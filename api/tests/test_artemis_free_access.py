import os
import threading
import unittest
from concurrent.futures import ThreadPoolExecutor
from types import SimpleNamespace
from unittest.mock import patch

os.environ["GEMINI_API_KEY"] = "unit-test-placeholder"
os.environ["SUPABASE_URL"] = "https://supabase.test"
os.environ["SUPABASE_ANON_KEY"] = "unit-test-anon-key"

import Artemis

validate_supabase_token = Artemis._validate_supabase_token


class ArtemisFreeAccessTests(unittest.TestCase):
    user_id = "2367b5e4-6e3e-43c2-893c-af02d63116df"
    other_user_id = "dd2c7600-c69c-48a5-9a63-01692fdcb870"
    exercise_id = "814db7f4-7c08-43a1-8d0c-fbb8a31d8621"

    def setUp(self):
        self.generated_text = "Resposta de teste."
        self.generation_error = None
        self.generation_started = None
        self.generation_release = None
        self.generation_calls = 0
        self.generation_lock = threading.Lock()
        self.patches = [
            patch.object(
                Artemis,
                "_validate_supabase_token",
                side_effect=lambda token: token if token in (self.user_id, self.other_user_id) else None,
            ),
            patch.object(Artemis.client.models, "generate_content", side_effect=self.generate_content),
        ]
        for mocked in self.patches:
            mocked.start()
            self.addCleanup(mocked.stop)
        self.client = Artemis.app.test_client()

    def generate_content(self, **kwargs):
        with self.generation_lock:
            self.generation_calls += 1
            call_count = self.generation_calls
        if self.generation_error:
            raise self.generation_error
        if self.generation_started and (not self.generation_release or call_count == 2):
            self.generation_started.set()
        if self.generation_release:
            self.generation_release.wait(timeout=5)
        return SimpleNamespace(text=self.generated_text)

    def post_question(self, token=None, body=None):
        headers = {"Authorization": f"Bearer {token}"} if token else {}
        return self.client.post(
            "/perguntas",
            json=body or {"pergunta": "Como começar a treinar?"},
            headers=headers,
        )

    def test_vercel_preflight_allows_post_and_required_headers(self):
        origin = "https://meu-portif-lio-oficial-ehx9jn3u9-flavio-hercules-projects.vercel.app"
        response = self.client.options(
            "/perguntas",
            headers={
                "Origin": origin,
                "Access-Control-Request-Method": "POST",
                "Access-Control-Request-Headers": "authorization,content-type",
            },
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.headers.get("Access-Control-Allow-Origin"), origin)
        self.assertIn("POST", response.headers.get("Access-Control-Allow-Methods", ""))
        self.assertIn("OPTIONS", response.headers.get("Access-Control-Allow-Methods", ""))
        allowed_headers = response.headers.get("Access-Control-Allow-Headers", "").lower()
        self.assertIn("authorization", allowed_headers)
        self.assertIn("content-type", allowed_headers)

    def test_unlisted_origin_is_not_allowed_by_cors(self):
        response = self.client.options(
            "/perguntas",
            headers={
                "Origin": "https://unlisted.example",
                "Access-Control-Request-Method": "POST",
                "Access-Control-Request-Headers": "content-type",
            },
        )

        self.assertIsNone(response.headers.get("Access-Control-Allow-Origin"))

    def test_authenticated_user_can_make_unlimited_interactions(self):
        responses = [self.post_question(self.user_id) for _ in range(5)]

        self.assertTrue(all(response.status_code == 200 for response in responses))
        self.assertEqual(self.generation_calls, 5)

    def test_simultaneous_interactions_are_allowed(self):
        self.generation_started = threading.Event()
        self.generation_release = threading.Event()

        def send_request():
            with Artemis.app.test_client() as client:
                return client.post(
                    "/perguntas",
                    json={"pergunta": "Como começar?"},
                    headers={"Authorization": f"Bearer {self.user_id}"},
                )

        with ThreadPoolExecutor(max_workers=2) as executor:
            first = executor.submit(send_request)
            second = executor.submit(send_request)
            self.assertTrue(self.generation_started.wait(timeout=5))
            self.generation_release.set()
            responses = (first.result(timeout=5), second.result(timeout=5))

        self.assertEqual([response.status_code for response in responses], [200, 200])
        self.assertEqual(self.generation_calls, 2)

    def test_missing_authentication_never_calls_gemini(self):
        response = self.post_question()

        self.assertEqual(response.status_code, 401)
        self.assertEqual(self.generation_calls, 0)

    def test_invalid_session_is_rejected(self):
        response = self.post_question("not-a-valid-user-token")

        self.assertEqual(response.status_code, 401)
        self.assertEqual(self.generation_calls, 0)

    def test_failed_response_can_be_retried_without_consuming_access(self):
        self.generated_text = ""

        failed_response = self.post_question(self.user_id)
        self.generated_text = "Resposta de teste."
        retry_response = self.post_question(self.user_id)

        self.assertEqual(failed_response.status_code, 502)
        self.assertEqual(retry_response.status_code, 200)
        self.assertGreaterEqual(self.generation_calls, 2)

    def test_gemini_server_error_does_not_block_future_requests(self):
        self.generation_error = Artemis.errors.ServerError(503, {"error": {"message": "unavailable"}})

        response = self.post_question(self.user_id)

        self.assertEqual(response.status_code, 503)
        self.generation_error = None
        retry_response = self.post_question(self.user_id)

        self.assertEqual(retry_response.status_code, 200)
        self.assertGreaterEqual(self.generation_calls, 2)

    def test_access_endpoint_reports_unlimited_free_access(self):
        response = self.client.get("/acesso", headers={"Authorization": f"Bearer {self.user_id}"})

        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json["available"])
        self.assertTrue(response.json["free_available"])
        self.assertFalse(response.json["requires_subscription"])

    def test_access_endpoint_requires_authentication(self):
        response = self.client.get("/acesso")

        self.assertEqual(response.status_code, 401)

    def test_token_validation_uses_supabase_configuration(self):
        with patch.object(Artemis, "_supabase_request", return_value={"id": self.user_id}) as supabase_request:
            result = validate_supabase_token("valid-token")

        self.assertEqual(result, self.user_id)
        self.assertEqual(
            supabase_request.call_args.args[0],
            f"{Artemis.SUPABASE_URL}/auth/v1/user",
        )
        self.assertTrue(supabase_request.call_args.args[2]["apikey"])

    def test_request_body_cannot_replace_authenticated_identity(self):
        response = self.post_question(
            self.user_id,
            {
                "pergunta": "Como começar?",
                "user_id": self.other_user_id,
                "premium": True,
                "free_used_at": None,
            },
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(self.generation_calls, 1)

    def test_invalid_workout_response_can_be_retried(self):
        self.generated_text = '{"days":[]}'
        body = {
            "pergunta": "Gere meu treino",
            "response_format": "json",
            "validation": {
                "exercise_ids": [self.exercise_id],
                "weekdays": ["Seg"],
            },
        }

        invalid_response = self.post_question(self.user_id, body)
        self.generated_text = "Resposta de teste."
        valid_response = self.post_question(self.user_id)

        self.assertEqual(invalid_response.status_code, 502)
        self.assertEqual(valid_response.status_code, 200)
        self.assertEqual(self.generation_calls, 2)


if __name__ == "__main__":
    unittest.main()
