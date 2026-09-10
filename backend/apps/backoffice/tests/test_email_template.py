from django.core import mail
from django.test import TestCase, override_settings

from apps.accounts.emails import send_login_otp_email
from apps.accounts.models import User


@override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend", OTP_EXPIRY_MINUTES=5)
class LoginOTPEmailTests(TestCase):
    def test_email_contains_plain_text_and_html_versions(self):
        user = User.objects.create_user(email="manager@example.test", password="StrongPassword-123!")
        send_login_otp_email(user=user, code="483721")
        self.assertEqual(len(mail.outbox), 1)
        message = mail.outbox[0]
        self.assertEqual(message.to, ["manager@example.test"])
        self.assertIn("483721", message.body)
        self.assertEqual(len(message.alternatives), 1)
        self.assertEqual(message.alternatives[0][1], "text/html")
        self.assertIn("483721", message.alternatives[0][0])
        self.assertIn("CST / CSMO", message.alternatives[0][0])
