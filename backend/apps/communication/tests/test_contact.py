import json
from unittest.mock import patch

from django.contrib.auth.models import Group
from django.core.cache import cache
from django.test import Client, TestCase, override_settings

from apps.accounts.roles import GROUP_EDITOR, GROUP_MANAGER, ensure_backoffice_groups
from apps.communication.models import Contact
from apps.communication.permissions import assign_communication_permissions


TEST_CACHE = {
    "default": {
        "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
        "LOCATION": "communication-tests",
    }
}


@override_settings(
    CACHES=TEST_CACHE,
    CONTACT_RATE_LIMIT_COUNT=5,
    CONTACT_RATE_LIMIT_WINDOW_SECONDS=3600,
)
class ContactApiTests(TestCase):
    def setUp(self):
        cache.clear()
        self.client = Client(enforce_csrf_checks=True)
        self.payload = {
            "name": "Assogba",
            "first_names": "Léonard",
            "email": "leonard@example.com",
            "phone": "+229 01 00 00 00 00",
            "subject": "Demande d'information",
            "category": "general",
            "message": "Bonjour, je souhaite obtenir une information institutionnelle.",
            "website": "",
        }

    def _csrf(self):
        response = self.client.get("/api/v1/contact/csrf/")
        self.assertEqual(response.status_code, 200)
        return response.json()["csrfToken"]

    @patch("apps.communication.api.send_contact_acknowledgement.delay")
    @patch("apps.communication.api.send_new_contact_notification.delay")
    def test_valid_submission_is_stored(self, notify, acknowledge):
        token = self._csrf()
        with self.captureOnCommitCallbacks(execute=True):
            response = self.client.post(
                "/api/v1/contact/",
                data=json.dumps(self.payload),
                content_type="application/json",
                HTTP_X_CSRFTOKEN=token,
            )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(Contact.objects.count(), 1)
        notify.assert_called_once()
        acknowledge.assert_called_once()

    def test_csrf_is_required(self):
        response = self.client.post(
            "/api/v1/contact/",
            data=json.dumps(self.payload),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 403)
        self.assertEqual(Contact.objects.count(), 0)

    def test_invalid_email_is_rejected(self):
        token = self._csrf()
        self.payload["email"] = "invalid"
        response = self.client.post(
            "/api/v1/contact/",
            data=json.dumps(self.payload),
            content_type="application/json",
            HTTP_X_CSRFTOKEN=token,
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(Contact.objects.count(), 0)

    def test_missing_required_field_is_rejected(self):
        token = self._csrf()
        self.payload.pop("subject")
        response = self.client.post(
            "/api/v1/contact/",
            data=json.dumps(self.payload),
            content_type="application/json",
            HTTP_X_CSRFTOKEN=token,
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(Contact.objects.count(), 0)

    def test_whitespace_subject_is_rejected(self):
        token = self._csrf()
        self.payload["subject"] = "   "
        response = self.client.post(
            "/api/v1/contact/",
            data=json.dumps(self.payload),
            content_type="application/json",
            HTTP_X_CSRFTOKEN=token,
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(Contact.objects.count(), 0)

    def test_overlong_message_is_rejected(self):
        token = self._csrf()
        self.payload["message"] = "x" * 5001
        response = self.client.post(
            "/api/v1/contact/",
            data=json.dumps(self.payload),
            content_type="application/json",
            HTTP_X_CSRFTOKEN=token,
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(Contact.objects.count(), 0)

    def test_honeypot_is_silently_ignored(self):
        token = self._csrf()
        self.payload["website"] = "https://spam.example"
        response = self.client.post(
            "/api/v1/contact/",
            data=json.dumps(self.payload),
            content_type="application/json",
            HTTP_X_CSRFTOKEN=token,
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(Contact.objects.count(), 0)

    @override_settings(CONTACT_RATE_LIMIT_COUNT=1)
    @patch("apps.communication.api.send_contact_acknowledgement.delay")
    @patch("apps.communication.api.send_new_contact_notification.delay")
    def test_rate_limit_blocks_excess_submissions(self, _notify, _acknowledge):
        token = self._csrf()
        first = self.client.post(
            "/api/v1/contact/",
            data=json.dumps(self.payload),
            content_type="application/json",
            HTTP_X_CSRFTOKEN=token,
        )
        second = self.client.post(
            "/api/v1/contact/",
            data=json.dumps(self.payload),
            content_type="application/json",
            HTTP_X_CSRFTOKEN=token,
        )
        self.assertEqual(first.status_code, 201)
        self.assertEqual(second.status_code, 429)

    @override_settings(CONTACT_RATE_LIMIT_COUNT=1)
    @patch("apps.communication.api.send_contact_acknowledgement.delay")
    @patch("apps.communication.api.send_new_contact_notification.delay")
    def test_rate_limit_prefers_gateway_real_ip_over_spoofed_forwarded_for(self, _notify, _acknowledge):
        token = self._csrf()
        first = self.client.post(
            "/api/v1/contact/",
            data=json.dumps(self.payload),
            content_type="application/json",
            HTTP_X_CSRFTOKEN=token,
            HTTP_X_REAL_IP="203.0.113.20",
            HTTP_X_FORWARDED_FOR="198.51.100.1",
        )
        second = self.client.post(
            "/api/v1/contact/",
            data=json.dumps(self.payload),
            content_type="application/json",
            HTTP_X_CSRFTOKEN=token,
            HTTP_X_REAL_IP="203.0.113.20",
            HTTP_X_FORWARDED_FOR="198.51.100.99",
        )
        self.assertEqual(first.status_code, 201)
        self.assertEqual(second.status_code, 429)


class ContactPermissionTests(TestCase):
    def test_manager_has_contact_rights_but_editor_does_not(self):
        ensure_backoffice_groups()
        assign_communication_permissions()
        manager = Group.objects.get(name=GROUP_MANAGER)
        editor = Group.objects.get(name=GROUP_EDITOR)

        manager_codes = set(manager.permissions.values_list("codename", flat=True))
        editor_codes = set(editor.permissions.values_list("codename", flat=True))

        self.assertIn("view_contact", manager_codes)
        self.assertIn("manage_contact", manager_codes)
        self.assertIn("reply_contact", manager_codes)
        self.assertNotIn("view_contact", editor_codes)
        self.assertNotIn("reply_contact", editor_codes)


@override_settings(CACHES=TEST_CACHE)
class ContactBackofficeTests(TestCase):
    def setUp(self):
        from apps.accounts.models import User
        from apps.backoffice.session import VERIFIED_USER_ID

        self.user = User.objects.create_superuser(
            email="root-contact@example.test",
            password="StrongPassword-123!",
        )
        self.contact = Contact.objects.create(
            name="Dupont",
            first_names="Jean",
            email="jean.dupont@example.test",
            subject="Question institutionnelle",
            category="general",
            message="Je souhaite obtenir une précision sur vos activités.",
        )
        self.client.force_login(self.user)
        session = self.client.session
        session[VERIFIED_USER_ID] = self.user.pk
        session.save()

    def test_opening_new_contact_marks_it_read(self):
        response = self.client.get(f"/backoffice/contacts/{self.contact.pk}/")
        self.assertEqual(response.status_code, 200)
        self.contact.refresh_from_db()
        self.assertEqual(self.contact.status, "read")
        self.assertIsNotNone(self.contact.read_at)

    @patch("apps.communication.backoffice_views.send_mail", side_effect=RuntimeError("smtp unavailable"))
    def test_reply_is_kept_when_email_fails(self, _send_mail):
        response = self.client.post(
            f"/backoffice/contacts/{self.contact.pk}/",
            data={
                "action": "reply",
                "reply-subject": "Re: Question institutionnelle",
                "reply-message": "Votre demande a bien été examinée. Merci pour votre message.",
            },
        )
        self.assertEqual(response.status_code, 302)
        reply = self.contact.replies.get()
        self.assertEqual(reply.delivery_status, "failed")
        self.assertTrue(reply.error_message)
