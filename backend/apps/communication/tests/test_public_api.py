from unittest.mock import patch

from django.test import override_settings
from django.urls import reverse
from rest_framework.test import APIClient, APITestCase

from apps.accounts.models import User

from apps.communication.models import ContactRequest, Conversation, NewsletterSubscriber, SubscriberStatus


@override_settings(CACHES={"default": {"BACKEND": "django.core.cache.backends.locmem.LocMemCache"}})
class PublicCommunicationApiTests(APITestCase):
    @patch("apps.communication.api.send_contact_acknowledgement_task.delay")
    def test_contact_is_persisted_before_email_task(self, delay):
        with self.captureOnCommitCallbacks(execute=True):
            response = self.client.post("/api/v1/communication/contact/", {
                "last_name": "Test", "first_name": "Visiteur", "email": "visitor@example.com",
                "subject": "Information", "message": "Bonjour, ceci est une demande de test.",
                "consent_acknowledged": True, "website": "",
            }, format="json")
        self.assertEqual(response.status_code, 201)
        self.assertEqual(ContactRequest.objects.count(), 1)
        delay.assert_called_once()


    @patch("apps.communication.api.send_contact_acknowledgement_task.delay", side_effect=RuntimeError("mail queue unavailable"))
    def test_contact_survives_email_queue_failure(self, delay):
        with self.captureOnCommitCallbacks(execute=True):
            response = self.client.post("/api/v1/communication/contact/", {
                "last_name": "Durable", "email": "durable@example.com",
                "subject": "Demande durable", "message": "Ce message doit rester enregistré malgré l’échec e-mail.",
                "consent_acknowledged": True, "website": "",
            }, format="json")
        self.assertEqual(response.status_code, 201)
        self.assertTrue(ContactRequest.objects.filter(email="durable@example.com").exists())

    @patch("apps.communication.api.send_contact_acknowledgement_task.delay")
    def test_contact_rate_limit(self, delay):
        payload = {
            "last_name": "Rate", "email": "rate@example.com", "subject": "Limite",
            "message": "Message suffisamment long pour le test de limite.",
            "consent_acknowledged": True, "website": "",
        }
        for _ in range(5):
            with self.captureOnCommitCallbacks(execute=True):
                response = self.client.post("/api/v1/communication/contact/", payload, format="json")
            self.assertEqual(response.status_code, 201)
        response = self.client.post("/api/v1/communication/contact/", payload, format="json")
        self.assertEqual(response.status_code, 429)

    def test_contact_rejects_honeypot(self):
        response = self.client.post("/api/v1/communication/contact/", {
            "last_name": "Bot", "email": "bot@example.com", "subject": "Spam",
            "message": "Un message suffisamment long.", "consent_acknowledged": True, "website": "filled",
        }, format="json")
        self.assertEqual(response.status_code, 400)
        self.assertEqual(ContactRequest.objects.count(), 0)


    def test_public_chat_does_not_require_csrf_even_with_backoffice_session(self):
        """Une session Django existante ne doit pas transformer le chat public en endpoint CSRF-protégé."""
        user = User.objects.create_user(
            email="staff-csrf@example.com",
            password="temporary-test-password",
            is_staff=True,
        )
        client = APIClient(enforce_csrf_checks=True)
        client.force_login(user)
        response = client.post(
            "/api/v1/communication/chat/conversations/",
            {"message": "Bonjour depuis une session back-office"},
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        self.assertTrue(response.data.get("visitor_token"))

    def test_chat_create_accepts_slashless_url(self):
        response = self.client.post("/api/v1/communication/chat/conversations", {"message": "Bonjour"}, format="json")
        self.assertEqual(response.status_code, 201)
        self.assertTrue(response.data.get("public_id"))
        self.assertTrue(response.data.get("visitor_token"))

    def test_chat_token_is_required_to_read_conversation(self):
        created = self.client.post("/api/v1/communication/chat/conversations/", {"message": "Bonjour"}, format="json")
        self.assertEqual(created.status_code, 201)
        public_id = created.data["public_id"]
        denied = self.client.get(f"/api/v1/communication/chat/conversations/{public_id}/")
        self.assertEqual(denied.status_code, 404)
        allowed = self.client.get(f"/api/v1/communication/chat/conversations/{public_id}/", HTTP_X_CONVERSATION_TOKEN=created.data["visitor_token"])
        self.assertEqual(allowed.status_code, 200)

    @patch("apps.communication.api.send_newsletter_confirmation_task.delay")
    def test_newsletter_is_pending_until_confirmation(self, delay):
        with self.captureOnCommitCallbacks(execute=True):
            response = self.client.post("/api/v1/communication/newsletter/subscribe/", {"email": "news@example.com", "website": ""}, format="json")
        self.assertIn(response.status_code, {200, 201})
        subscriber = NewsletterSubscriber.objects.get(email="news@example.com")
        self.assertEqual(subscriber.status, SubscriberStatus.PENDING)
        delay.assert_called_once_with(subscriber.pk)
