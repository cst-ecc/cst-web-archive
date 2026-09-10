from django.test import RequestFactory, TestCase, override_settings

from apps.backoffice.models import LoginRateLimit
from apps.backoffice.rate_limit import is_login_rate_limited, record_login_failure, reset_identifier_ip_limit


@override_settings(BACKOFFICE_LOGIN_MAX_ATTEMPTS=3, BACKOFFICE_LOGIN_IP_MAX_ATTEMPTS=20, BACKOFFICE_LOGIN_WINDOW_MINUTES=15, BACKOFFICE_LOGIN_LOCKOUT_MINUTES=15)
class LoginRateLimitTests(TestCase):
    def setUp(self):
        self.request = RequestFactory().post("/backoffice/login/", REMOTE_ADDR="203.0.113.40")
        self.email = "manager@example.test"

    def test_identifier_and_ip_are_not_stored_in_clear(self):
        record_login_failure(request=self.request, email=self.email)
        serialized = " ".join(LoginRateLimit.objects.values_list("key_hash", flat=True))
        self.assertNotIn(self.email, serialized)
        self.assertNotIn("203.0.113.40", serialized)

    def test_limit_blocks_after_configured_failures(self):
        for _ in range(3):
            record_login_failure(request=self.request, email=self.email)
        self.assertTrue(is_login_rate_limited(request=self.request, email=self.email))

    def test_success_resets_identifier_ip_scope_only(self):
        record_login_failure(request=self.request, email=self.email)
        reset_identifier_ip_limit(request=self.request, email=self.email)
        self.assertFalse(LoginRateLimit.objects.filter(scope=LoginRateLimit.Scope.IDENTIFIER_IP).exists())
        self.assertTrue(LoginRateLimit.objects.filter(scope=LoginRateLimit.Scope.IP).exists())
