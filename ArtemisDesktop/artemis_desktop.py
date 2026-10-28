import os
import queue
import re
import shutil
import subprocess
import sys
import threading
import unicodedata
import webbrowser
from datetime import datetime
from pathlib import Path

import pyttsx3
import requests
import speech_recognition as sr
import sounddevice as sd
import tkinter as tk
from tkinter import ttk


APP_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = APP_DIR.parent
API_DIR = PROJECT_ROOT / "api"
API_SCRIPT = API_DIR / "Artemis.py"
API_URL = os.getenv("ARTEMIS_API_URL", "http://127.0.0.1:5000").rstrip("/")
MOTIONFIT_URL = "http://localhost:5173"
CREATE_NEW_CONSOLE = getattr(subprocess, "CREATE_NEW_CONSOLE", 0)


def load_project_environment():
    allowed_names = {
        "SUPABASE_URL",
        "VITE_SUPABASE_URL",
        "SUPABASE_ANON_KEY",
        "VITE_SUPABASE_ANON_KEY",
        "ARTEMIS_API_URL",
    }
    candidates = (
        APP_DIR / ".env",
        API_DIR / ".env",
        PROJECT_ROOT / ".env",
        PROJECT_ROOT.parent / ".env",
    )
    for env_path in candidates:
        if not env_path.is_file():
            continue
        try:
            lines = env_path.read_text(encoding="utf-8").splitlines()
        except OSError:
            continue
        for line in lines:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            name, value = line.split("=", 1)
            name = name.strip()
            if name not in allowed_names:
                continue
            value = value.strip().strip("\"'")
            os.environ.setdefault(name, value)


load_project_environment()
SUPABASE_URL = os.getenv("SUPABASE_URL", os.getenv("VITE_SUPABASE_URL", "")).rstrip("/")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", os.getenv("VITE_SUPABASE_ANON_KEY", ""))


def normalize_text(text):
    normalized = unicodedata.normalize("NFD", text.casefold())
    return "".join(character for character in normalized
                   if unicodedata.category(character) != "Mn")


class SoundDeviceMicrophone(sr.AudioSource):
    def __init__(self, sample_rate=16000, chunk_size=1024):
        self.SAMPLE_RATE = sample_rate
        self.SAMPLE_WIDTH = 2
        self.CHUNK = chunk_size
        self._input_stream = None
        self.stream = None

    def __enter__(self):
        self._input_stream = sd.RawInputStream(
            samplerate=self.SAMPLE_RATE,
            blocksize=self.CHUNK,
            dtype="int16",
            channels=1,
        )
        self._input_stream.start()
        self.stream = self
        return self

    def read(self, size):
        audio, _overflowed = self._input_stream.read(size)
        return audio

    def __exit__(self, _exception_type, _exception, _traceback):
        if self._input_stream:
            self._input_stream.stop()
            self._input_stream.close()
            self._input_stream = None
        self.stream = None


class SupabaseSession:
    def __init__(self):
        self.access_token = None
        self.refresh_token = None
        self.expires_at = 0
        self.http = requests.Session()

    @property
    def configured(self):
        return bool(SUPABASE_URL and SUPABASE_ANON_KEY)

    @property
    def signed_in(self):
        return bool(self.access_token)

    def _auth_request(self, path, payload):
        response = self.http.post(
            f"{SUPABASE_URL}/auth/v1/{path}",
            headers={"apikey": SUPABASE_ANON_KEY, "Content-Type": "application/json"},
            json=payload,
            timeout=20,
        )
        try:
            data = response.json()
        except ValueError:
            data = {}
        if not response.ok:
            message = data.get("msg") or data.get("message") or data.get("error_description") or "Verifique suas credenciais e tente novamente."
            raise RuntimeError(message)
        if not isinstance(data, dict) or not data.get("access_token"):
            raise RuntimeError("O Supabase não retornou uma sessão válida.")
        self.access_token = data["access_token"]
        self.refresh_token = data.get("refresh_token")
        self.expires_at = datetime.now().timestamp() + int(data.get("expires_in", 3600))

    def sign_in(self, email, password):
        if not self.configured:
            raise RuntimeError("Configure SUPABASE_URL e SUPABASE_ANON_KEY no api/.env do projeto.")
        self._auth_request("token?grant_type=password", {"email": email, "password": password})

    def get_access_token(self):
        if not self.access_token:
            raise RuntimeError("Entre na sua conta MotionFit para conversar com a IA.")
        if datetime.now().timestamp() >= self.expires_at - 60:
            if not self.refresh_token:
                self.sign_out()
                raise RuntimeError("Sua sessão expirou. Entre novamente.")
            self._auth_request("token?grant_type=refresh_token", {"refresh_token": self.refresh_token})
        return self.access_token

    def sign_out(self):
        self.access_token = None
        self.refresh_token = None
        self.expires_at = 0

    def ask(self, question, history):
        token = self.get_access_token()
        try:
            response = self.http.post(
                f"{API_URL}/perguntas",
                headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
                json={"pergunta": question, "historico": history[-12:], "response_format": "text"},
                timeout=(10, 430),
            )
        except requests.RequestException as error:
            raise RuntimeError("Não foi possível conectar à API da Artemis. Inicie o servidor e confira a rede.") from error
        try:
            data = response.json()
        except ValueError:
            data = {}
        if not response.ok:
            if response.status_code == 401:
                self.sign_out()
                raise RuntimeError("Sua sessão expirou. Entre novamente para usar a IA.")
            raise RuntimeError(data.get("erro") or "A API da Artemis não conseguiu responder.")
        answer = data.get("resposta") if isinstance(data, dict) else None
        if not isinstance(answer, str) or not answer.strip():
            raise RuntimeError("A API da Artemis retornou uma resposta vazia.")
        return answer.strip()


class ArtemisDesktop:
    def __init__(self, root):
        self.root = root
        self.root.title("Artemis Desktop | MotionFit")
        self.root.geometry("860x700")
        self.root.minsize(600, 540)
        self.root.configure(bg="#080d0b")

        self.events = queue.Queue()
        self.speech_queue = queue.Queue()
        self.recognizer = sr.Recognizer()
        self.session = SupabaseSession()
        self.history = []
        self.busy = False
        self.speech_enabled = tk.BooleanVar(value=True)
        self.backend_process = None
        self.tts_engine = None
        self.closing = False

        self._build_interface()
        threading.Thread(target=self._speech_worker, daemon=True).start()
        self.root.after(100, self._process_events)
        self.root.protocol("WM_DELETE_WINDOW", self.close)
        self._set_status("Pronta. Clique em Falar para começar.")
        self._append_message("ARTEMIS", "Olá. Posso abrir o VS Code ou Downloads, informar as horas, iniciar os servidores permitidos ou conversar usando sua conta MotionFit.")

    def _build_interface(self):
        style = ttk.Style()
        style.theme_use("clam")
        style.configure("TFrame", background="#080d0b")
        style.configure("TLabel", background="#080d0b", foreground="#dce8df", font=("Segoe UI", 10))
        style.configure("TButton", background="#16251a", foreground="#baff85", padding=(12, 8), font=("Segoe UI", 10, "bold"))
        style.map("TButton", background=[("active", "#24452a"), ("disabled", "#172019")], foreground=[("disabled", "#68756b")])

        main = ttk.Frame(self.root, padding=20)
        main.pack(fill="both", expand=True)
        header = ttk.Frame(main)
        header.pack(fill="x", pady=(0, 12))
        ttk.Label(header, text="ARTEMIS", foreground="#a6ff69", font=("Segoe UI", 22, "bold")).pack(side="left")
        ttk.Label(header, text="DESKTOP  /  MOTIONFIT", foreground="#6c8b72", font=("Consolas", 9, "bold")).pack(side="right", pady=(10, 0))

        login = ttk.Frame(main)
        login.pack(fill="x", pady=(0, 12))
        self.email_entry = ttk.Entry(login, width=26)
        self.email_entry.insert(0, "E-mail MotionFit")
        self.email_entry.bind("<FocusIn>", self._clear_email_placeholder)
        self.email_entry.bind("<FocusOut>", self._restore_email_placeholder)
        self.email_entry.pack(side="left", padx=(0, 8), ipady=5)
        self.password_entry = ttk.Entry(login, width=20, show="*")
        self.password_entry.pack(side="left", padx=(0, 8), ipady=5)
        self.login_button = ttk.Button(login, text="Entrar", command=self._sign_in)
        self.login_button.pack(side="left")
        self.logout_button = ttk.Button(login, text="Sair", command=self._sign_out, state="disabled")
        self.logout_button.pack(side="left", padx=(8, 0))

        self.chat = tk.Text(
            main, wrap="word", state="disabled", relief="flat", padx=14, pady=12,
            bg="#0d1510", fg="#e1eee4", insertbackground="#a6ff69",
            font=("Segoe UI", 11), spacing1=3, spacing3=10,
        )
        self.chat.pack(fill="both", expand=True)
        self.chat.tag_configure("user", foreground="#a6ff69", font=("Segoe UI", 10, "bold"))
        self.chat.tag_configure("assistant", foreground="#73d9a2", font=("Segoe UI", 10, "bold"))
        self.chat.tag_configure("body", foreground="#e1eee4", font=("Segoe UI", 11))

        self.status_var = tk.StringVar(value="Iniciando...")
        ttk.Label(main, textvariable=self.status_var, foreground="#a6ff69").pack(anchor="w", pady=(10, 8))

        input_row = ttk.Frame(main)
        input_row.pack(fill="x")
        self.question_entry = ttk.Entry(input_row, font=("Segoe UI", 11))
        self.question_entry.pack(side="left", fill="x", expand=True, ipady=8, padx=(0, 8))
        self.question_entry.bind("<Return>", lambda _event: self._submit_typed())
        self.send_button = ttk.Button(input_row, text="Enviar", command=self._submit_typed)
        self.send_button.pack(side="left")

        controls = ttk.Frame(main)
        controls.pack(fill="x", pady=(10, 0))
        self.listen_button = ttk.Button(controls, text="Falar com a Artemis", command=self._start_listening)
        self.listen_button.pack(side="left")
        self.stop_speech_button = ttk.Button(controls, text="Interromper fala", command=self._stop_speaking)
        self.stop_speech_button.pack(side="left", padx=(8, 0))
        ttk.Checkbutton(
            controls,
            text="Falar respostas",
            variable=self.speech_enabled,
            command=self._toggle_speech,
        ).pack(side="left", padx=(12, 0))
        self.api_button = ttk.Button(
            controls,
            text="Iniciar servidor Artemis",
            command=lambda: self._submit_question("Iniciar servidor da Artemis"),
        )
        self.api_button.pack(side="right")

    def _clear_email_placeholder(self, _event=None):
        if self.email_entry.get() == "E-mail MotionFit":
            self.email_entry.delete(0, "end")

    def _restore_email_placeholder(self, _event=None):
        if not self.email_entry.get().strip():
            self.email_entry.insert(0, "E-mail MotionFit")

    def _append_message(self, author, text):
        self.chat.configure(state="normal")
        tag = "user" if author == "VOCÊ" else "assistant"
        self.chat.insert("end", f"{author}\n", tag)
        self.chat.insert("end", f"{text}\n\n", "body")
        self.chat.see("end")
        self.chat.configure(state="disabled")

    def _set_status(self, message):
        self.status_var.set(message)

    def _set_busy(self, busy):
        self.busy = busy
        state = "disabled" if busy else "normal"
        self.listen_button.configure(state=state)
        self.send_button.configure(state=state)
        self.login_button.configure(state=state)
        self.api_button.configure(state=state)

    def _sign_in(self):
        email = self.email_entry.get().strip()
        password = self.password_entry.get()
        if not email or email == "E-mail MotionFit" or not password:
            self._set_status("Informe seu e-mail e senha MotionFit.")
            return
        self._set_busy(True)
        self._set_status("Validando sua conta MotionFit...")
        threading.Thread(target=self._sign_in_worker, args=(email, password), daemon=True).start()

    def _sign_in_worker(self, email, password):
        try:
            self.session.sign_in(email, password)
            self.events.put(("signed_in", None))
        except Exception as error:
            self.events.put(("error", str(error)))

    def _sign_out(self):
        self.session.sign_out()
        self.password_entry.delete(0, "end")
        self.login_button.configure(state="normal")
        self.logout_button.configure(state="disabled")
        self._set_status("Sessão encerrada.")

    def _start_listening(self):
        if self.busy:
            return
        self._set_busy(True)
        self._set_status("Aguardando o microfone...")
        threading.Thread(target=self._listen_worker, daemon=True).start()

    def _listen_worker(self):
        try:
            with SoundDeviceMicrophone() as microphone:
                self.events.put(("status", "Ajustando ao ruído ambiente..."))
                self.recognizer.adjust_for_ambient_noise(microphone, duration=0.5)
                self.events.put(("status", "Ouvindo. Fale agora..."))
                audio = self.recognizer.listen(microphone, timeout=8, phrase_time_limit=20)
            transcript = self.recognizer.recognize_google(audio, language="pt-BR").strip()
            if not transcript:
                raise sr.UnknownValueError
            self.events.put(("transcript", transcript))
        except sr.WaitTimeoutError:
            self.events.put(("listen_error", "Não detectei fala. Clique e tente novamente."))
        except sr.UnknownValueError:
            self.events.put(("listen_error", "Não consegui entender. Repita a pergunta mais perto do microfone."))
        except sr.RequestError:
            self.events.put(("listen_error", "Falha de rede no reconhecimento de voz. Confira sua conexão."))
        except (OSError, AttributeError, sd.PortAudioError) as error:
            detail = str(error).strip()
            message = "Não foi possível acessar o microfone. Confira se o PyAudio está instalado e se o Windows liberou a permissão."
            self.events.put(("listen_error", f"{message} {detail}" if detail else message))
        except Exception as error:
            self.events.put(("listen_error", f"Erro no reconhecimento de voz: {error}"))

    def _submit_typed(self):
        self._submit_question(self.question_entry.get().strip())

    def _submit_question(self, question):
        if self.busy or not question:
            return
        self.question_entry.delete(0, "end")
        self._append_message("VOCÊ", question)
        self.history.append({"role": "user", "content": question})
        history_snapshot = list(self.history[-12:])[:-1]
        self._set_busy(True)
        self._set_status("Artemis está processando...")
        threading.Thread(
            target=self._answer_worker,
            args=(question, history_snapshot),
            daemon=True,
        ).start()

    def _answer_worker(self, question, history):
        try:
            answer = self._run_local_tool(question)
            if answer is None:
                answer = self.session.ask(question, history)
            self.events.put(("answer", answer))
        except Exception as error:
            self.events.put(("error", str(error)))

    def _run_local_tool(self, question):
        text = normalize_text(question)
        starts_action = re.search(r"\b(abra|abrir|abre|inicie|iniciar|inicia|execute|executar|start|inicie)\b", text)
        opens_action = re.search(r"\b(abra|abrir|abre|open|acessar)\b", text)
        responses = []

        if re.search(r"\b(que horas|hora agora|horario|horas sao)\b", text):
            return f"Agora são {datetime.now().strftime('%H:%M')} do seu horário local."

        if "vscode" in text or "visual studio code" in text or re.search(r"\bcode\b", text):
            if opens_action or starts_action:
                executable = shutil.which("code") or shutil.which("code.cmd")
                candidates = (
                    Path(os.getenv("LOCALAPPDATA", "")) / "Programs" / "Microsoft VS Code" / "Code.exe",
                    Path(os.getenv("ProgramFiles", "C:\\Program Files")) / "Microsoft VS Code" / "Code.exe",
                )
                executable_path = Path(executable) if executable else next((path for path in candidates if path.is_file()), None)
                if not executable_path or not Path(executable_path).is_file():
                    responses.append("Não encontrei o VS Code instalado. Instale-o ou adicione o comando code ao PATH.")
                else:
                    args = [str(executable_path)]
                    if "motionfit" in text:
                        args.append(str(PROJECT_ROOT))
                    subprocess.Popen(args, cwd=str(PROJECT_ROOT), close_fds=True)
                    responses.append("Abri o VS Code" + (" com o projeto MotionFit." if "motionfit" in text else "."))

        if "download" in text and opens_action:
            downloads = Path.home() / "Downloads"
            if not downloads.is_dir():
                responses.append("Não encontrei a pasta Downloads deste usuário.")
            else:
                if os.name == "nt":
                    os.startfile(str(downloads))
                else:
                    webbrowser.open(downloads.as_uri())
                responses.append("Abri sua pasta Downloads.")

        if "servidor" in text and "artemis" in text and starts_action:
            responses.append(self._launch_backend())

        if "motionfit" in text and starts_action:
            responses.append(self._launch_motionfit())

        return " ".join(responses) if responses else None

    def _launch_backend(self):
        try:
            requests.get(f"{API_URL}/", timeout=2)
            return "O servidor da Artemis já está respondendo em 127.0.0.1:5000."
        except requests.RequestException:
            pass
        if not API_SCRIPT.is_file():
            return f"Não encontrei o backend em {API_SCRIPT}."

        python_candidates = (
            API_DIR / ".venv" / "Scripts" / "python.exe",
            PROJECT_ROOT / ".venv" / "Scripts" / "python.exe",
            PROJECT_ROOT.parent / ".venv" / "Scripts" / "python.exe",
        )
        python_executable = next((path for path in python_candidates if path.is_file()), Path(sys.executable))
        try:
            self.backend_process = subprocess.Popen(
                [str(python_executable), str(API_SCRIPT)],
                cwd=str(API_DIR),
                creationflags=CREATE_NEW_CONSOLE,
                close_fds=True,
            )
        except OSError as error:
            return f"Não consegui iniciar o backend: {error}"
        return f"Iniciei o servidor da Artemis com {python_executable.name}. Confira a janela do backend se ele não ficar online."

    def _launch_motionfit(self):
        if not (PROJECT_ROOT / "package.json").is_file():
            return "Não encontrei o projeto MotionFit nesta pasta."
        try:
            requests.get(MOTIONFIT_URL, timeout=2)
            return "O MotionFit já está respondendo em localhost:5173."
        except requests.RequestException:
            pass

        if os.name == "nt":
            command = [os.getenv("COMSPEC", "cmd.exe"), "/c", "npm.cmd", "run", "dev"]
        else:
            npm = shutil.which("npm")
            if not npm:
                return "Não encontrei o npm instalado."
            command = [npm, "run", "dev"]
        try:
            subprocess.Popen(
                command,
                cwd=str(PROJECT_ROOT),
                creationflags=CREATE_NEW_CONSOLE,
                close_fds=True,
            )
        except OSError as error:
            return f"Não consegui iniciar o MotionFit: {error}"
        return "Iniciei o servidor de desenvolvimento do MotionFit em uma nova janela."

    def _speech_worker(self):
        try:
            engine = pyttsx3.init()
            self.tts_engine = engine
            engine.setProperty("rate", 175)
            voices = engine.getProperty("voices") or []
            portuguese_voice = next(
                (voice for voice in voices if "pt-br" in str(voice.id).lower()
                 or "portugu" in str(voice.name).lower()),
                None,
            )
            if portuguese_voice:
                engine.setProperty("voice", portuguese_voice.id)
        except Exception as error:
            self.events.put(("speech_unavailable", str(error)))
            return

        while True:
            text = self.speech_queue.get()
            if text is None:
                return
            try:
                self.events.put(("status", "Artemis está falando..."))
                engine.say(text)
                engine.runAndWait()
                self.events.put(("status", "Pronta para ouvir."))
            except Exception as error:
                self.events.put(("speech_unavailable", str(error)))

    def _stop_speaking(self):
        if self.tts_engine:
            try:
                self.tts_engine.stop()
                self._set_status("Fala interrompida.")
            except Exception as error:
                self._set_status(f"Não consegui interromper a fala: {error}")

    def _toggle_speech(self):
        if self.speech_enabled.get():
            return
        self._stop_speaking()
        while True:
            try:
                self.speech_queue.get_nowait()
            except queue.Empty:
                break

    def _process_events(self):
        if self.closing:
            return
        try:
            while True:
                event, value = self.events.get_nowait()
                if event == "status":
                    self._set_status(value)
                elif event == "transcript":
                    self._set_busy(False)
                    self._set_status("Reconheci sua pergunta.")
                    self._submit_question(value)
                elif event == "listen_error":
                    self._set_busy(False)
                    self._set_status(value)
                elif event == "signed_in":
                    self._set_busy(False)
                    self.password_entry.delete(0, "end")
                    self.login_button.configure(state="disabled")
                    self.logout_button.configure(state="normal")
                    self._set_status("Conta MotionFit conectada. A sessão fica apenas na memória.")
                elif event == "answer":
                    self._set_busy(False)
                    self._append_message("ARTEMIS", value)
                    self.history.append({"role": "assistant", "content": value})
                    self._set_status("Resposta recebida.")
                    if self.speech_enabled.get():
                        self.speech_queue.put(value)
                elif event == "error":
                    self._set_busy(False)
                    self._append_message("ARTEMIS", value)
                    self._set_status(value)
                elif event == "speech_unavailable":
                    self._set_status("Síntese de voz indisponível. Confira as vozes instaladas no Windows.")
        except queue.Empty:
            pass
        self.root.after(100, self._process_events)

    def close(self):
        self.closing = True
        self.session.sign_out()
        self.speech_queue.put(None)
        if self.backend_process and self.backend_process.poll() is None:
            self.backend_process.terminate()
        self.root.destroy()


def main():
    root = tk.Tk()
    ArtemisDesktop(root)
    root.mainloop()


if __name__ == "__main__":
    main()