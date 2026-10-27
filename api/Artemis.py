from pathlib import Path
import json
import os
import re
import uuid
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

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
                origin.strip()
                for origin in os.getenv("ARTEMIS_CORS_ORIGINS", "").split(",")
                if origin.strip()
            ] or [
                r"https?://(localhost|127\.0\.0\.1)(:\d+)?"
            ]
        },
        r"/acesso": {
            "origins": [
                origin.strip()
                for origin in os.getenv("ARTEMIS_CORS_ORIGINS", "").split(",")
                if origin.strip()
            ] or [
                r"https?://(localhost|127\.0\.0\.1)(:\d+)?"
            ]
        },
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

client = genai.Client(
    api_key=api_key,
    http_options=types.HttpOptions(timeout=120000),
)

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
SUPABASE_URL = os.getenv("SUPABASE_URL", "").strip().rstrip("/")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "").strip()
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "").strip()


class SupabaseUnavailable(Exception):
    pass


def _supabase_request(url, method, headers, payload=None):
    body = json.dumps(payload).encode("utf-8") if payload is not None else None
    http_request = Request(url, data=body, headers=headers, method=method)
    try:
        with urlopen(http_request, timeout=10) as response:
            content = response.read()
    except HTTPError as error:
        if error.code in (400, 401, 403) and url.endswith("/auth/v1/user"):
            return None
        raise SupabaseUnavailable from None
    except (URLError, TimeoutError, OSError):
        raise SupabaseUnavailable from None

    if not content:
        return None
    try:
        return json.loads(content)
    except (UnicodeDecodeError, json.JSONDecodeError):
        raise SupabaseUnavailable from None


def _validate_supabase_token(token):
    if not SUPABASE_URL or not SUPABASE_ANON_KEY:
        raise SupabaseUnavailable

    user = _supabase_request(
        f"{SUPABASE_URL}/auth/v1/user",
        "GET",
        {
            "apikey": SUPABASE_ANON_KEY,
            "Authorization": f"Bearer {token}",
        },
    )
    if not isinstance(user, dict) or not user.get("id"):
        return None
    return str(user["id"])


def _authenticated_user_id():
    authorization = request.headers.get("Authorization", "")
    scheme, separator, token = authorization.partition(" ")
    if not separator or scheme.lower() != "bearer" or not token.strip():
        return None, (jsonify({
            "erro": "Entre na sua conta para usar a Artemis.",
            "codigo": "authentication_required",
        }), 401)

    try:
        user_id = _validate_supabase_token(token.strip())
    except SupabaseUnavailable:
        return None, (_error_response(
            "authentication_unavailable",
            "Não foi possível validar sua sessão agora. Tente novamente.",
            503,
        ))
    if not user_id:
        return None, (jsonify({
            "erro": "Sua sessão expirou. Entre novamente para continuar.",
            "codigo": "invalid_session",
        }), 401)
    return user_id, None


def _supabase_rpc(function_name, payload):
    if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
        raise SupabaseUnavailable

    return _supabase_request(
        f"{SUPABASE_URL}/rest/v1/rpc/{function_name}",
        "POST",
        {
            "apikey": SUPABASE_SERVICE_ROLE_KEY,
            "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
            "Content-Type": "application/json",
        },
        payload,
    )


def _access_status(user_id):
    result = _supabase_rpc("artemis_check_access", {"p_user_id": user_id})
    required_fields = ("premium", "free_available", "free_in_progress", "requires_subscription")
    if not isinstance(result, dict) or any(field not in result for field in required_fields):
        raise SupabaseUnavailable
    return result


def _release_free_reservation(user_id, request_id):
    try:
        _supabase_rpc("artemis_release_free_usage", {
            "p_user_id": user_id,
            "p_request_id": request_id,
        })
    except SupabaseUnavailable:
        app.logger.warning("Could not release an Artemis free-use reservation.")


def _error_response(code, message, status):
    return jsonify({"erro": message, "codigo": code}), status


def _valid_generated_response(text, response_format, validation=None):
    if not isinstance(text, str) or not text.strip():
        return False
    if response_format == "json":
        try:
            result = json.loads(text)
        except json.JSONDecodeError:
            return False
        days = result.get("days") if isinstance(result, dict) else None
        expected_weekdays = validation["weekdays"]
        allowed_exercises = set(validation["exercise_ids"])
        return (
            isinstance(result, dict)
            and isinstance(days, list)
            and len(days) == len(expected_weekdays)
            and all(
                isinstance(day, dict)
                and isinstance(day.get("title"), str)
                and bool(day["title"].strip())
                and day.get("weekday") == expected_weekdays[index]
                and isinstance(day.get("exercises"), list)
                and len(day["exercises"]) >= 3
                and all(
                    isinstance(exercise, dict)
                    and isinstance(exercise.get("exercise_id"), str)
                    and exercise.get("exercise_id") in allowed_exercises
                    and isinstance(exercise.get("name"), str)
                    and bool(exercise["name"].strip())
                    and isinstance(exercise.get("sets"), (int, float))
                    and isinstance(exercise.get("reps"), str)
                    and isinstance(exercise.get("rest_seconds"), (int, float))
                    for exercise in day["exercises"]
                )
                for index, day in enumerate(days)
            )
        )
    if response_format == "catalog" and re.search(r"\[\[exercicio:[^\]]*$", text.strip()):
        return False
    return True


# ============================================================
# PERSONALIDADE DA ARTEMIS
# ============================================================

SYSTEM_PROMPT = """
Você é Artemis, a assistente virtual da MotionFit.

A MotionFit é uma plataforma de exercícios, academia, calistenia,
esportes, evolução, desempenho e tecnologia.

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

Não ofereça análise corporal ou de movimentos por câmera; esse recurso
não está disponível no momento.

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
    user_id, auth_error = _authenticated_user_id()
    if auth_error:
        return auth_error

    dados = request.get_json(silent=True)
    if not isinstance(dados, dict):
        return _error_response("invalid_request", "O corpo da requisição precisa ser um JSON.", 400)

    pergunta = dados.get("pergunta")
    if not isinstance(pergunta, str):
        return _error_response("invalid_request", "A pergunta deve ser uma string.", 400)
    pergunta = pergunta.strip()
    if not pergunta:
        return _error_response("invalid_request", "A pergunta não pode estar vazia.", 400)

    historico = dados.get("historico", [])
    if not isinstance(historico, list):
        return _error_response("invalid_request", "O histórico da conversa precisa ser uma lista.", 400)

    response_format = dados.get("response_format", "text")
    if response_format not in ("text", "json", "catalog"):
        return _error_response("invalid_request", "Formato de resposta inválido.", 400)

    validation = None
    if response_format == "json":
        validation_data = dados.get("validation")
        if not isinstance(validation_data, dict):
            return _error_response("invalid_request", "Envie os critérios de validação do treino.", 400)
        exercise_ids = validation_data.get("exercise_ids")
        weekdays = validation_data.get("weekdays")
        if (
            not isinstance(exercise_ids, list)
            or not exercise_ids
            or len(exercise_ids) > 1000
            or not isinstance(weekdays, list)
            or not weekdays
            or len(weekdays) > 7
            or any(not isinstance(day, str) or not day.strip() for day in weekdays)
            or len(set(weekdays)) != len(weekdays)
        ):
            return _error_response("invalid_request", "Os critérios de validação do treino são inválidos.", 400)
        try:
            normalized_exercise_ids = [str(uuid.UUID(exercise_id)) for exercise_id in exercise_ids]
        except (ValueError, AttributeError, TypeError):
            return _error_response("invalid_request", "O catálogo de exercícios contém identificadores inválidos.", 400)
        if len(set(normalized_exercise_ids)) != len(normalized_exercise_ids):
            return _error_response("invalid_request", "O catálogo contém identificadores duplicados.", 400)
        validation = {"exercise_ids": normalized_exercise_ids, "weekdays": weekdays}

    raw_request_id = request.headers.get("Idempotency-Key", "")
    try:
        request_id = str(uuid.UUID(raw_request_id))
    except (ValueError, AttributeError):
        return _error_response("invalid_request", "A requisição precisa de uma chave de idempotência UUID.", 400)

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

    try:
        reservation = _supabase_rpc("artemis_reserve_access", {
            "p_user_id": user_id,
            "p_request_id": request_id,
        })
    except SupabaseUnavailable:
        app.logger.error("Supabase authorization is unavailable for an Artemis request.")
        return _error_response("authorization_unavailable", "Não foi possível verificar seu acesso à Artemis. Tente novamente.", 503)

    if not isinstance(reservation, dict):
        return _error_response("authorization_unavailable", "Não foi possível verificar seu acesso à Artemis. Tente novamente.", 503)

    reservation_status = reservation.get("status")
    if reservation_status == "subscription_required":
        return _error_response("subscription_required", "Sua utilização gratuita já foi usada. Assine um plano para continuar usando a Artemis.", 402)
    if reservation_status == "in_progress":
        return _error_response("request_in_progress", "Já existe uma interação com a Artemis em andamento para sua conta.", 409)
    if reservation_status not in ("free", "premium"):
        return _error_response("authorization_unavailable", "Não foi possível verificar seu acesso à Artemis. Tente novamente.", 503)
    reserved_free_use = reservation_status == "free"

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
                        temperature=0.2 if response_format == "json" else 0.7,
                        max_output_tokens=8192 if response_format == "json" else 1800,
                        response_mime_type="application/json" if response_format == "json" else None,
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

        if not _valid_generated_response(texto, response_format, validation):
            _release_free_reservation(user_id, request_id) if reserved_free_use else None
            return _error_response("invalid_assistant_response", "A Artemis não conseguiu concluir uma resposta válida. Sua utilização gratuita não foi consumida.", 502)

        if reserved_free_use:
            completion = _supabase_rpc("artemis_complete_free_usage", {
                "p_user_id": user_id,
                "p_request_id": request_id,
            })
            if not isinstance(completion, dict) or completion.get("status") not in ("completed", "premium"):
                _release_free_reservation(user_id, request_id)
                return _error_response("authorization_unavailable", "Não foi possível confirmar a utilização. Tente novamente.", 503)

        app.logger.info("Artemis completed a response using model %s.", ACTIVE_MODEL)
        return jsonify({
            "resposta": texto
        }), 200

    except errors.ClientError as error:
        _release_free_reservation(user_id, request_id) if reserved_free_use else None
        code = getattr(error, "code", None)
        message = str(error)
        if (
            code == 401
            or "api key" in message.lower()
            or "unauthorized" in message.lower()
        ):
            app.logger.error("Gemini rejected the configured server credentials.")
            return _error_response("assistant_unavailable", "A Artemis está temporariamente indisponível. Tente novamente mais tarde.", 503)
        if (
            code == 429
            or "quota" in message.lower()
            or "rate limit" in message.lower()
        ):
            app.logger.warning("Gemini rate limit or quota prevented an Artemis response.")
            return _error_response("assistant_unavailable", "A Artemis está com muitas solicitações. Tente novamente mais tarde.", 503)
        app.logger.error("Gemini rejected an Artemis request (code=%s).", code)
        return _error_response("assistant_unavailable", "A Artemis não conseguiu responder agora. Tente novamente.", 502)
    except errors.ServerError as error:
        _release_free_reservation(user_id, request_id) if reserved_free_use else None
        app.logger.warning("Gemini server error prevented an Artemis response.")
        return _error_response("assistant_unavailable", "A Artemis está temporariamente indisponível. Tente novamente mais tarde.", 503)
    except SupabaseUnavailable:
        app.logger.error("Supabase could not confirm an Artemis free-use reservation.")
        return _error_response("authorization_unavailable", "Não foi possível confirmar seu acesso à Artemis. Tente novamente.", 503)
    except Exception as error:
        _release_free_reservation(user_id, request_id) if reserved_free_use else None
        app.logger.error("Unexpected Artemis failure (%s).", type(error).__name__)
        return _error_response("assistant_unavailable", "Não foi possível processar sua pergunta. Tente novamente.", 500)


@app.get("/acesso")
def acesso():
    user_id, auth_error = _authenticated_user_id()
    if auth_error:
        return auth_error

    try:
        return jsonify(_access_status(user_id)), 200
    except SupabaseUnavailable:
        app.logger.error("Supabase authorization status could not be loaded.")
        return _error_response("authorization_unavailable", "Não foi possível verificar seu acesso à Artemis. Tente novamente.", 503)


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