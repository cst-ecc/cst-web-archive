from unittest.mock import patch

from django.contrib.auth.models import Group
from django.test import TestCase, override_settings
from django.urls import reverse

from apps.accounts.models import LoginOTP, User


@override_settings(
    EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend",
    OTP_EXPIRY_MINUTES=5,
    OTP_MAX_ATTEMPTS=5,
    OTP_RESEND_COOLDOWN_SECONDS=60,
    OTP_PENDING_SESSION_MINUTES=10,
    BACKOFFICE_SESSION_MAX_AGE=28800,
    BACKOFFICE_LOGIN_MAX_ATTEMPTS=2,
    BACKOFFICE_LOGIN_IP_MAX_ATTEMPTS=20,
    BACKOFFICE_LOGIN_WINDOW_MINUTES=15,
    BACKOFFICE_LOGIN_LOCKOUT_MINUTES=15,
)
class BackofficeSecurityTests(TestCase):
    def setUp(self):
        manager = Group.objects.get(name="Manager")
        self.user = User.objects.create_user(
            email="manager@example.test",
            password="StrongPassword-123!",
        )
        self.user.groups.add(manager)

    def test_login_page_is_not_cacheable(self):
        response = self.client.get(reverse("backoffice:login"))
        cache_control = response.headers.get("Cache-Control", "")
        self.assertIn("no-cache", cache_control)
        self.assertIn("no-store", cache_control)

    def test_repeated_bad_password_is_rate_limited(self):
        payload = {
            "email": self.user.email,
            "password": "WrongPassword",
        }

        first = self.client.post(reverse("backoffice:login"), payload)
        second = self.client.post(reverse("backoffice:login"), payload)
        third = self.client.post(reverse("backoffice:login"), payload)

        self.assertEqual(first.status_code, 400)
        self.assertEqual(second.status_code, 400)
        self.assertEqual(third.status_code, 429)

    @patch("apps.backoffice.views.logger.exception")
    @patch(
        "apps.backoffice.views.send_login_otp_email",
        side_effect=RuntimeError("SMTP indisponible"),
    )
    def test_delivery_failure_invalidates_generated_otp(
        self,
        mocked_send,
        mocked_logger_exception,
    ):
        response = self.client.post(
            reverse("backoffice:login"),
            {
                "email": self.user.email,
                "password": "StrongPassword-123!",
            },
        )

        self.assertEqual(response.status_code, 503)
        self.assertTrue(mocked_send.called)
        self.assertTrue(mocked_logger_exception.called)

        otp = LoginOTP.objects.latest("created_at")
        self.assertIsNotNone(otp.invalidated_at)
        self.assertNotIn("_auth_user_id", self.client.session)
        self.assertNotIn(
            "backoffice_pending_user_id",
            self.client.session,
        )
