import os
import threading
import unittest
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta, timezone
from types import SimpleNamespace
from unittest.mock import patch
from uuid import uuid4

os.environ["GEMINI_API_KEY"] = "unit-test-placeholder"
os.environ["SUPABASE_URL"] = "https://supabase.test"
os.environ["SUPABASE_ANON_KEY"] = "unit-test-anon-key"
os.environ["SUPABASE_SERVICE_ROLE_KEY"] = "unit-test-service-role-key"

import Artemis

supabase_token_validator = Artemis._validate_supabase_token


class FakeEntitlements:
    def __init__(self):
        self.states = {}
        self.lock = threading.Lock()

    def _state(self, user_id):
        return self.states.setdefault(user_id, {
            "used": False,
            "request_id": None,
            "subscription_status": None,
            "ends_at": None,
        })

    @staticmethod
    def _has_premium(state):
        return (
            state["subscription_status"] in ("active", "trialing")
            and state["ends_at"] is not None
            and state["ends_at"] > datetime.now(timezone.utc)
        )

    def rpc(self, function_name, payload):
        user_id = payload["p_user_id"]
        with self.lock:
            state = self._state(user_id)
            premium = self._has_premium(state)
            if function_name == "artemis_check_access":
                in_progress = state["request_id"] is not None
                return {
                    "premium": premium,
                    "free_available": not premium and not state["used"] and not in_progress,
                    "free_in_progress": not premium and in_progress,
                    "requires_subscription": not premium and state["used"],
                }
            if function_name == "artemis_reserve_access":
                if premium:
                    return {"status": "premium"}
                if state["used"]:
                    return {"status": "subscription_required"}
                if state["request_id"]:
                    return {"status": "in_progress"}
                state["request_id"] = payload["p_request_id"]
                return {"status": "free"}
            if function_name == "artemis_complete_free_usage":
                if state["request_id"] != payload["p_request_id"]:
                    return {"status": "reservation_lost"}
                state["used"] = True
                state["request_id"] = None
                return {"status": "completed"}
            if function_name == "artemis_release_free_usage":
                if state["request_id"] == payload["p_request_id"]:
                    state["request_id"] = None
                    return True
                return False
        raise AssertionError(f"Unexpected RPC function: {function_name}")


class ArtemisMonetizationTests(unittest.TestCase):
    user_id = "2367b5e4-6e3e-43c2-893c-af02d63116df"
    other_user_id = "dd2c7600-c69c-48a5-9a63-01692fdcb870"
    exercise_id = "814db7f4-7c08-43a1-8d0c-fbb8a31d8621"

    def setUp(self):
        self.entitlements = FakeEntitlements()
        self.generated_text = "Resposta de teste."
        self.generation_error = None
        self.generation_started = None
        self.generation_release = None
        self.generation_calls = 0
        self.requested_models = []
        self.generation_lock = threading.Lock()
        self.patches = [
            patch.object(Artemis, "_validate_supabase_token", side_effect=lambda token: token if token in (self.user_id, self.other_user_id) else None),
            patch.object(Artemis, "_supabase_rpc", side_effect=self.entitlements.rpc),
            patch.object(Artemis.client.models, "generate_content", side_effect=self.generate_content),
        ]
        for mocked in self.patches:
            mocked.start()
            self.addCleanup(mocked.stop)
        self.client = Artemis.app.test_client()

    def generate_content(self, **kwargs):
        with self.generation_lock:
            self.generation_calls += 1
            self.requested_models.append(kwargs["model"])
        if self.generation_error:
            raise self.generation_error
        if self.generation_started:
            self.generation_started.set()
        if self.generation_release:
            self.generation_release.wait(timeout=5)
        return SimpleNamespace(text=self.generated_text)

    def post_question(self, token=None, body=None, request_id=None):
        return self.client.post(
            "/perguntas",
            json=body or {"pergunta": "Como começar a treinar?"},
            headers={
                **({"Authorization": f"Bearer {token}"} if token else {}),
                "Idempotency-Key": request_id or str(uuid4()),
            },
        )

    def test_new_authenticated_user_gets_one_recorded_free_interaction(self):
        response = self.post_question(self.user_id)

        self.assertEqual(response.status_code, 200)
        self.assertTrue(self.entitlements.states[self.user_id]["used"])
        self.assertEqual(self.generation_calls, 1)

    def test_second_interaction_without_active_subscription_requires_plan(self):
        self.assertEqual(self.post_question(self.user_id).status_code, 200)

        response = self.post_question(self.user_id)

        self.assertEqual(response.status_code, 402)
        self.assertEqual(response.json["codigo"], "subscription_required")
        self.assertEqual(self.generation_calls, 1)

    def test_repeated_idempotency_key_cannot_generate_twice(self):
        request_id = str(uuid4())
        self.assertEqual(self.post_question(self.user_id, request_id=request_id).status_code, 200)

        response = self.post_question(self.user_id, request_id=request_id)

        self.assertEqual(response.status_code, 402)
        self.assertEqual(self.generation_calls, 1)

    def test_free_use_is_isolated_per_authenticated_user(self):
        self.assertEqual(self.post_question(self.user_id).status_code, 200)
        self.assertEqual(self.post_question(self.other_user_id).status_code, 200)

        self.assertTrue(self.entitlements.states[self.user_id]["used"])
        self.assertTrue(self.entitlements.states[self.other_user_id]["used"])

    def test_simultaneous_requests_share_one_free_reservation(self):
        self.generation_started = threading.Event()
        self.generation_release = threading.Event()

        def send_request():
            with Artemis.app.test_client() as client:
                return client.post(
                    "/perguntas",
                    json={"pergunta": "Como começar?"},
                    headers={
                        "Authorization": f"Bearer {self.user_id}",
                        "Idempotency-Key": str(uuid4()),
                    },
                )

        with ThreadPoolExecutor(max_workers=2) as executor:
            first = executor.submit(send_request)
            self.assertTrue(self.generation_started.wait(timeout=5))
            second = executor.submit(send_request)
            second_response = second.result(timeout=5)
            self.generation_release.set()
            first_response = first.result(timeout=5)

        self.assertEqual(second_response.status_code, 409)
        self.assertEqual(first_response.status_code, 200)
        self.assertEqual(self.generation_calls, 1)
        self.assertTrue(self.entitlements.states[self.user_id]["used"])

    def test_empty_gemini_response_releases_free_reservation(self):
        self.generated_text = ""

        response = self.post_question(self.user_id)

        self.assertEqual(response.status_code, 502)
        self.assertFalse(self.entitlements.states[self.user_id]["used"])
        self.assertIsNone(self.entitlements.states[self.user_id]["request_id"])

    def test_missing_authentication_never_calls_gemini_or_entitlement_rpc(self):
        response = self.client.post(
            "/perguntas",
            json={"pergunta": "Como começar?"},
            headers={"Idempotency-Key": str(uuid4())},
        )

        self.assertEqual(response.status_code, 401)
        self.assertEqual(self.generation_calls, 0)
        self.assertEqual(self.entitlements.states, {})

    def test_invalid_session_is_rejected(self):
        response = self.post_question("not-a-valid-user-token")

        self.assertEqual(response.status_code, 401)
        self.assertEqual(self.generation_calls, 0)

    def test_active_subscription_is_authorized_without_consuming_free_use(self):
        self.entitlements.states[self.user_id] = {
            "used": False,
            "request_id": None,
            "subscription_status": "active",
            "ends_at": datetime.now(timezone.utc) + timedelta(days=30),
        }

        response = self.post_question(self.user_id)

        self.assertEqual(response.status_code, 200)
        self.assertFalse(self.entitlements.states[self.user_id]["used"])

    def test_expired_or_canceled_subscription_does_not_grant_access(self):
        inactive_subscriptions = (
            ("active", datetime.now(timezone.utc) - timedelta(seconds=1)),
            ("canceled", datetime.now(timezone.utc) + timedelta(days=30)),
            ("past_due", datetime.now(timezone.utc) + timedelta(days=30)),
        )
        for status, ends_at in inactive_subscriptions:
            with self.subTest(status=status):
                self.entitlements.states[self.user_id] = {
                    "used": True,
                    "request_id": None,
                    "subscription_status": status,
                    "ends_at": ends_at,
                }

                response = self.post_question(self.user_id)

                self.assertEqual(response.status_code, 402)

    def test_gemini_server_error_releases_free_reservation(self):
        self.generation_error = Artemis.errors.ServerError(503, {"error": {"message": "unavailable"}})

        response = self.post_question(self.user_id)

        self.assertEqual(response.status_code, 503)
        self.assertFalse(self.entitlements.states[self.user_id]["used"])
        self.assertIsNone(self.entitlements.states[self.user_id]["request_id"])

    def test_authentication_uses_supabase_user_endpoint(self):
        token = "user-access-token"
        with patch.object(Artemis, "_supabase_request", return_value={"id": self.user_id}) as auth_request:
            authenticated_id = supabase_token_validator(token)

        self.assertEqual(authenticated_id, self.user_id)
        self.assertEqual(auth_request.call_args.args[0], "https://supabase.test/auth/v1/user")
        self.assertEqual(auth_request.call_args.args[2]["Authorization"], f"Bearer {token}")

    def test_access_endpoint_reports_one_free_interaction(self):
        response = self.client.get("/acesso", headers={"Authorization": f"Bearer {self.user_id}"})

        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json["free_available"])
        self.assertFalse(response.json["premium"])

    def test_user_id_in_request_body_cannot_change_authenticated_owner(self):
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
        self.assertTrue(self.entitlements.states[self.user_id]["used"])
        self.assertNotIn(self.other_user_id, self.entitlements.states)

    def test_invalid_workout_json_does_not_consume_free_use(self):
        self.generated_text = '{"days":[]}'
        body = {
            "pergunta": "Gere meu treino",
            "response_format": "json",
            "validation": {
                "exercise_ids": [self.exercise_id],
                "weekdays": ["Seg"],
            },
        }

        response = self.post_question(self.user_id, body)

        self.assertEqual(response.status_code, 502)
        self.assertFalse(self.entitlements.states[self.user_id]["used"])
        self.assertIsNone(self.entitlements.states[self.user_id]["request_id"])

    def test_access_endpoint_requires_authentication(self):
        response = self.client.get("/acesso")

        self.assertEqual(response.status_code, 401)


if __name__ == "__main__":
    unittest.main()
