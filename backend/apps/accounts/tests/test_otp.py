from datetime import timedelta

from django.contrib.auth.hashers import check_password
from django.test import RequestFactory, TestCase, override_settings
from django.utils import timezone

from apps.audit.models import AuditAction, AuditLog
from apps.accounts.models import LoginOTP, User
from apps.accounts.otp import (
    OTPResendTooSoon,
    issue_login_otp,
    verify_login_otp,
)


@override_settings(
    OTP_EXPIRY_MINUTES=5,
    OTP_MAX_ATTEMPTS=3,
    OTP_RESEND_COOLDOWN_SECONDS=60,
)
class LoginOTPTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="manager@example.test",
            password="StrongPassword-123!",
        )
        self.factory = RequestFactory()
        self.request = self.factory.post(
            "/backoffice/login/",
            HTTP_X_FORWARDED_FOR="203.0.113.20",
            HTTP_USER_AGENT="OTPTests/1.0",
        )

    def test_code_is_hashed_and_never_stored_in_clear(self):
        issued = issue_login_otp(user=self.user, request=self.request)

        self.assertNotEqual(issued.otp.code_hash, issued.code)
        self.assertTrue(check_password(issued.code, issued.otp.code_hash))
        self.assertFalse(
            any(
                value == issued.code
                for value in issued.otp.__dict__.values()
            )
        )

    def test_resend_cooldown_is_enforced(self):
        issue_login_otp(user=self.user, request=self.request)

        with self.assertRaises(OTPResendTooSoon):
            issue_login_otp(user=self.user, request=self.request)

    def test_new_otp_invalidates_previous_one(self):
        first = issue_login_otp(user=self.user, request=self.request)

        LoginOTP.objects.filter(pk=first.otp.pk).update(
            resend_available_at=timezone.now() - timedelta(seconds=1)
        )

        second = issue_login_otp(user=self.user, request=self.request)

        first.otp.refresh_from_db()
        self.assertIsNotNone(first.otp.invalidated_at)
        self.assertTrue(second.otp.is_active)

        result = verify_login_otp(
            otp_id=first.otp.pk,
            user=self.user,
            raw_code=first.code,
            request=self.request,
        )
        self.assertFalse(result.ok)
        self.assertEqual(result.reason, "invalidated")

    def test_valid_code_is_one_time_use(self):
        issued = issue_login_otp(user=self.user, request=self.request)

        result = verify_login_otp(
            otp_id=issued.otp.pk,
            user=self.user,
            raw_code=issued.code,
            request=self.request,
        )
        self.assertTrue(result.ok)

        issued.otp.refresh_from_db()
        self.assertIsNotNone(issued.otp.used_at)

        second_result = verify_login_otp(
            otp_id=issued.otp.pk,
            user=self.user,
            raw_code=issued.code,
            request=self.request,
        )
        self.assertFalse(second_result.ok)
        self.assertEqual(second_result.reason, "used")

    def test_wrong_codes_increment_attempts_then_lock(self):
        issued = issue_login_otp(user=self.user, request=self.request)

        for expected_remaining in (2, 1, 0):
            result = verify_login_otp(
                otp_id=issued.otp.pk,
                user=self.user,
                raw_code="999999",
                request=self.request,
            )
            self.assertFalse(result.ok)
            self.assertEqual(result.remaining_attempts, expected_remaining)

        issued.otp.refresh_from_db()
        self.assertEqual(issued.otp.attempts, 3)
        self.assertIsNotNone(issued.otp.invalidated_at)

    def test_expired_code_is_rejected(self):
        issued = issue_login_otp(user=self.user, request=self.request)
        LoginOTP.objects.filter(pk=issued.otp.pk).update(
            expires_at=timezone.now() - timedelta(seconds=1)
        )

        result = verify_login_otp(
            otp_id=issued.otp.pk,
            user=self.user,
            raw_code=issued.code,
            request=self.request,
        )

        self.assertFalse(result.ok)
        self.assertEqual(result.reason, "expired")

    def test_request_and_success_are_audited(self):
        issued = issue_login_otp(user=self.user, request=self.request)
        verify_login_otp(
            otp_id=issued.otp.pk,
            user=self.user,
            raw_code=issued.code,
            request=self.request,
        )

        self.assertTrue(
            AuditLog.objects.filter(
                actor=self.user,
                action=AuditAction.OTP_REQUESTED,
            ).exists()
        )
        self.assertTrue(
            AuditLog.objects.filter(
                actor=self.user,
                action=AuditAction.OTP_SUCCESS,
            ).exists()
        )
