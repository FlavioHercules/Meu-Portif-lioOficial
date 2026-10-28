# Artemis Desktop

Assistente local para Windows. A janela, o microfone e a síntese de voz funcionam independentemente da interface MotionFit. Perguntas gerais usam a API Flask `/perguntas` já existente e exigem login Supabase.

## Preparação

No PowerShell, a partir da pasta `motionfit`:

```powershell
cd ArtemisDesktop
py -m venv .venv
.\.venv\Scripts\python.exe -m pip install --upgrade pip
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

O app lê `SUPABASE_URL` e `SUPABASE_ANON_KEY` de `api/.env`, `.env` do projeto ou `ArtemisDesktop/.env`. A chave pública anon é usada somente para autenticar o usuário; a chave Gemini continua exclusivamente no backend. Nenhuma senha ou sessão é gravada em disco.

## Inicialização

```powershell
.\.venv\Scripts\python.exe .\artemis_desktop.py
```

Entre com sua conta MotionFit para conversar com a IA. O botão **Iniciar servidor Artemis** executa o `api/Artemis.py` com um dos interpretadores encontrados em `api/.venv`, no projeto ou na pasta pai. Esse ambiente precisa ter as dependências de `api/requirements.txt` e o arquivo `api/.env` configurado. Ao fechar a janela, o app encerra apenas o backend que ele próprio iniciou.

O reconhecimento começa somente pelo botão **Falar com a Artemis** e usa `pt-BR` pelo serviço online do Google Speech Recognition. A captura local usa `sounddevice`, sem exigir compilação do PyAudio. A fala da Artemis usa `pyttsx3` e as vozes instaladas no Windows. As ferramentas locais são intencionalmente fixas: abrir VS Code, abrir Downloads, informar a hora local e iniciar os servidores Artemis e MotionFit. A IA não pode fornecer comandos de terminal para execução.

## Limitações

- O reconhecimento de fala precisa de internet e do microfone autorizado no Windows.
- A captura de áudio requer um dispositivo de entrada funcional e compatível com PortAudio.
- A síntese funciona offline, mas a disponibilidade de voz em português depende das vozes instaladas no Windows; sem uma voz pt-BR, o sistema pode usar a voz padrão.
- Perguntas gerais precisam do backend ativo, acesso ao Supabase e disponibilidade/quota do Gemini já configurado.
- O início do frontend pressupõe Node.js/npm instalado e o projeto acessível em `localhost:5173`.