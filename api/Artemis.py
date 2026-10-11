from pathlib import Path
import os

from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS
from google import genai
from google.genai import errors, types


# ============================================================
# CONFIGURAÇÃO
# ============================================================

BASE_DIR = Path(__file__).resolve().parent

# Carrega api/.env
load_dotenv(BASE_DIR / ".env")

app = Flask(__name__)

CORS(
    app,
    resources={
        r"/perguntas": {
            "origins": [
                r"https?://(localhost|127\.0\.0\.1)(:\d+)?"
            ]
        }
    },
)


# ============================================================
# GEMINI
# ============================================================

api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    raise ValueError(
        "GEMINI_API_KEY não encontrada. "
        "Verifique o arquivo api/.env."
    )

client = genai.Client(api_key=api_key)

# IMPORTANTE:
# No .env use:
#
# GEMINI_MODEL=gemini-3.8-flash
#
# Sem "models/".
MODEL = os.getenv(
    "GEMINI_MODEL",
    "gemini-3.8-flash"
).strip()

# Remove "models/" caso tenha sido colocado acidentalmente
if MODEL.startswith("models/"):
    MODEL = MODEL.replace("models/", "", 1)

FALLBACK_MODELS = [
    model.strip().removeprefix("models/")
    for model in os.getenv(
        "GEMINI_FALLBACK_MODELS",
        "gemini-3.1-flash-lite",
    ).split(",")
    if model.strip()
]
ACTIVE_MODEL = MODEL


# ============================================================
# PERSONALIDADE DA ARTEMIS
# ============================================================

SYSTEM_PROMPT = """
Você é Artemis, a assistente virtual da MotionFit.

A MotionFit é uma plataforma de exercícios, academia, calistenia,
esportes, evolução, desempenho, tecnologia e análise de movimentos.

Sua função é conversar naturalmente em português do Brasil e ajudar
o usuário a organizar seus treinos.

Você pode perguntar sobre:

- objetivo
- experiência
- frequência de treino
- preferência entre academia e calistenia
- equipamentos disponíveis
- esportes praticados
- altura e peso quando forem relevantes para recomendações gerais

Use as informações compartilhadas pelo usuário para personalizar
sugestões gerais de treino e explicar exercícios com clareza.

Não faça diagnóstico médico e não substitua um profissional de saúde
ou de educação física.

Se houver dor, lesão ou condição médica, recomende procurar um
profissional qualificado.

A análise corporal pela câmera depende de um módulo de visão e
análise de movimento da MotionFit. Não afirme que essa funcionalidade
já está disponível apenas porque a Artemis está funcionando.

Seja amigável, objetiva, clara e natural.

Não fique repetindo as mesmas informações.

Responda diretamente ao que o usuário perguntou.
"""


# ============================================================
# ROTA PRINCIPAL
# ============================================================

@app.get("/")
def home():
    return jsonify({
        "status": "online",
        "assistente": "Artemis",
        "app": "MotionFit",
        "modelo": ACTIVE_MODEL
    })


# ============================================================
# ROTA DA ARTEMIS
# ============================================================

@app.post("/perguntas")
def perguntas():

    # --------------------------------------------------------
    # RECEBE JSON
    # --------------------------------------------------------

    dados = request.get_json(silent=True)

    # --------------------------------------------------------
    # VALIDAÇÃO
    # --------------------------------------------------------

    if not isinstance(dados, dict):
        return jsonify({
            "erro": "O corpo da requisição precisa ser um JSON."
        }), 400

    if "pergunta" not in dados:
        return jsonify({
            "erro": 'Envie JSON no formato: {"pergunta": "..."}'
        }), 400

    pergunta = dados["pergunta"]

    if not isinstance(pergunta, str):
        return jsonify({
            "erro": "A pergunta deve ser uma string."
        }), 400

    pergunta = pergunta.strip()

    if not pergunta:
        return jsonify({
            "erro": "A pergunta não pode estar vazia."
        }), 400

    historico = dados.get("historico", [])
    if not isinstance(historico, list):
        return jsonify({
            "erro": "O histórico da conversa precisa ser uma lista."
        }), 400

    conteudos = []
    for mensagem in historico[-100:]:
        if not isinstance(mensagem, dict):
            continue

        papel = mensagem.get("role")
        conteudo = mensagem.get("content")
        if papel not in ("user", "assistant") or not isinstance(conteudo, str):
            continue

        conteudo = conteudo.strip()[:3000]
        if conteudo:
            conteudos.append(types.Content(
                role="model" if papel == "assistant" else "user",
                parts=[types.Part(text=conteudo)],
            ))

    conteudos.append(types.Content(
        role="user",
        parts=[types.Part(text=pergunta)],
    ))

    # --------------------------------------------------------
    # LOG
    # --------------------------------------------------------

    app.logger.info(
        f"Artemis recebeu pergunta usando modelo: {MODEL}"
    )

    # --------------------------------------------------------
    # GEMINI
    # --------------------------------------------------------

    try:

        global ACTIVE_MODEL
        texto = None
        ultimo_erro_api = None
        modelos = dict.fromkeys([ACTIVE_MODEL, *FALLBACK_MODELS, MODEL])

        for modelo in modelos:
            try:
                resposta = client.models.generate_content(
                    model=modelo,
                    contents=conteudos,
                    config=types.GenerateContentConfig(
                        system_instruction=SYSTEM_PROMPT,
                        temperature=0.7,
                        max_output_tokens=1800,
                        response_mime_type="application/json" if dados.get("response_format") == "json" else None,
                        thinking_config=types.ThinkingConfig(
                            thinking_level="low",
                        ),
                    ),
                )
            except errors.ServerError as error:
                ultimo_erro_api = error
                app.logger.warning(
                    "Modelo Gemini %s indisponível; tentando fallback.",
                    modelo,
                )
                continue
            except errors.ClientError as error:
                message = str(error).lower()
                if getattr(error, "code", None) == 429 or "quota" in message:
                    raise
                if "rate limit" not in message:
                    raise

                ultimo_erro_api = error
                app.logger.warning(
                    "Limite atingido no modelo Gemini %s; tentando fallback.",
                    modelo,
                )
                continue

            texto = getattr(resposta, "text", None)
            if texto:
                ACTIVE_MODEL = modelo
                break

        if not texto and ultimo_erro_api:
            raise ultimo_erro_api

        # ----------------------------------------------------
        # VERIFICA RESPOSTA
        # ----------------------------------------------------

        if not texto:
            return jsonify({
                "erro": "A IA não retornou uma resposta."
            }), 502

        app.logger.info(
            "Artemis respondeu com sucesso."
        )

        return jsonify({
            "resposta": texto
        }), 200

    # ========================================================
    # ERRO DE CLIENTE GEMINI
    # ========================================================

    except errors.ClientError as error:

        app.logger.exception(
            "Erro da API Gemini"
        )

        code = getattr(error, "code", None)
        message = str(error)

        # ----------------------------------------------------
        # API KEY
        # ----------------------------------------------------

        if (
            code == 401
            or "api key" in message.lower()
            or "unauthorized" in message.lower()
        ):
            return jsonify({
                "erro": "Chave da API inválida ou não configurada."
            }), 401

        # ----------------------------------------------------
        # QUOTA / RATE LIMIT
        # ----------------------------------------------------

        if (
            code == 429
            or "quota" in message.lower()
            or "rate limit" in message.lower()
        ):
            return jsonify({
                "erro": "Limite da API atingido.",
                "codigo": code
            }), 429

        # ----------------------------------------------------
        # MODELO / OUTRO ERRO
        # ----------------------------------------------------

        return jsonify({
            "erro": "Erro na API Gemini.",
            "codigo": code,
            "detalhes": message
        }), 400

    # ========================================================
    # SERVIDOR GEMINI
    # ========================================================

    except errors.ServerError as error:

        app.logger.exception(
            "Erro do servidor Gemini"
        )

        return jsonify({
            "erro": "Erro temporário no servidor do Gemini.",
            "detalhes": str(error)
        }), 503

    # ========================================================
    # ERRO INESPERADO
    # ========================================================

    except Exception as error:

        app.logger.exception(
            "Erro inesperado na Artemis"
        )

        return jsonify({
            "erro": "Não foi possível processar sua pergunta.",
            "detalhes": str(error)
        }), 500


# ============================================================
# INICIAR SERVIDOR
# ============================================================

if __name__ == "__main__":

    print("=" * 60)
    print("ARTEMIS - MOTIONFIT")
    print("=" * 60)
    print(f"Modelo: {ACTIVE_MODEL}")
    print(f"Fallbacks: {', '.join(FALLBACK_MODELS)}")
    print("Servidor: http://127.0.0.1:5000")
    print("=" * 60)

    app.run(
        host="127.0.0.1",
        port=5000,
        debug=False
    )