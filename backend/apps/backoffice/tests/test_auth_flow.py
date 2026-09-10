import re

from django.contrib.auth.models import Group
from django.core import mail
from django.test import TestCase, override_settings
from django.urls import reverse

from apps.accounts.models import User


@override_settings(
    EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend",
    OTP_EXPIRY_MINUTES=5,
    OTP_MAX_ATTEMPTS=5,
    OTP_RESEND_COOLDOWN_SECONDS=60,
    OTP_PENDING_SESSION_MINUTES=10,
)
class BackofficeAuthFlowTests(TestCase):
    def setUp(self):
        manager_group = Group.objects.get(name="Manager")
        self.user = User.objects.create_user(
            email="manager@example.test",
            password="StrongPassword-123!",
            is_active=True,
        )
        self.user.groups.add(manager_group)

    def _login_until_otp(self):
        response = self.client.post(
            reverse("backoffice:login"),
            {
                "email": self.user.email,
                "password": "StrongPassword-123!",
            },
        )
        self.assertRedirects(response, reverse("backoffice:otp"))
        self.assertEqual(len(mail.outbox), 1)

        match = re.search(r"\b(\d{6})\b", mail.outbox[0].body)
        self.assertIsNotNone(match)
        return match.group(1)

    def test_dashboard_requires_authentication_and_2fa(self):
        response = self.client.get(reverse("backoffice:dashboard"))
        self.assertRedirects(response, reverse("backoffice:login"))

    def test_manager_can_complete_full_2fa_flow(self):
        code = self._login_until_otp()

        # Le mot de passe seul ne doit pas encore authentifier la session.
        self.assertNotIn("_auth_user_id", self.client.session)

        response = self.client.post(
            reverse("backoffice:otp"),
            {"code": code},
        )
        self.assertRedirects(response, reverse("backoffice:dashboard"))

        session = self.client.session
        self.assertEqual(int(session["_auth_user_id"]), self.user.pk)
        self.assertEqual(
            session["backoffice_2fa_verified_user_id"],
            self.user.pk,
        )

        dashboard = self.client.get(reverse("backoffice:dashboard"))
        self.assertEqual(dashboard.status_code, 200)

    def test_wrong_password_uses_generic_message_and_sends_no_email(self):
        response = self.client.post(
            reverse("backoffice:login"),
            {
                "email": self.user.email,
                "password": "WrongPassword",
            },
        )

        self.assertEqual(response.status_code, 400)
        self.assertContains(
            response,
            "Identifiants incorrects ou accès non autorisé.",
            status_code=400,
        )
        self.assertEqual(len(mail.outbox), 0)

    def test_user_without_backoffice_role_is_denied(self):
        outsider = User.objects.create_user(
            email="outsider@example.test",
            password="StrongPassword-123!",
        )

        response = self.client.post(
            reverse("backoffice:login"),
            {
                "email": outsider.email,
                "password": "StrongPassword-123!",
            },
        )

        self.assertEqual(response.status_code, 400)
        self.assertContains(
            response,
            "Identifiants incorrects ou accès non autorisé.",
            status_code=400,
        )
        self.assertEqual(len(mail.outbox), 0)

    def test_resend_respects_cooldown(self):
        self._login_until_otp()

        response = self.client.post(reverse("backoffice:otp_resend"))
        self.assertRedirects(response, reverse("backoffice:otp"))
        self.assertEqual(len(mail.outbox), 1)

    def test_logout_removes_authenticated_session(self):
        code = self._login_until_otp()
        self.client.post(reverse("backoffice:otp"), {"code": code})

        response = self.client.post(reverse("backoffice:logout"))
        self.assertRedirects(response, reverse("backoffice:login"))
        self.assertNotIn("_auth_user_id", self.client.session)
        self.assertNotIn(
            "backoffice_2fa_verified_user_id",
            self.client.session,
        )
