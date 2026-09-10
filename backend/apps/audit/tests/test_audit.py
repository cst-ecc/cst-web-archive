from django.contrib.auth.signals import user_logged_in, user_login_failed
from django.test import RequestFactory, TestCase
from apps.accounts.models import User
from apps.audit.models import AuditAction, AuditLog
from apps.audit.services import audit_log


class AuditLogTests(TestCase):
    def setUp(self):
        self.factory = RequestFactory()
        self.user = User.objects.create_user(email="admin@example.test", password="StrongPassword-123!")

    def test_service_records_actor_ip_and_target(self):
        request = self.factory.get("/", HTTP_X_FORWARDED_FOR="203.0.113.10", HTTP_USER_AGENT="TestAgent")
        entry = audit_log(action=AuditAction.USER_UPDATED, actor=self.user, request=request,
                          target=self.user, description="Modification de test.")
        self.assertEqual(entry.actor, self.user)
        self.assertEqual(entry.ip_address, "203.0.113.10")
        self.assertEqual(entry.target_type, "accounts.user")
        self.assertEqual(entry.target_id, str(self.user.pk))

    def test_login_success_signal_is_recorded(self):
        request = self.factory.post("/login/")
        user_logged_in.send(sender=User, request=request, user=self.user)
        self.assertTrue(AuditLog.objects.filter(actor=self.user, action=AuditAction.LOGIN_SUCCESS).exists())

    def test_login_failure_does_not_store_password(self):
        request = self.factory.post("/login/")
        user_login_failed.send(sender=User, credentials={"email": "someone@example.test", "password": "NEVER_STORE_THIS"}, request=request)
        entry = AuditLog.objects.get(action=AuditAction.LOGIN_FAILED)
        self.assertNotIn("password", entry.metadata)
        self.assertNotIn("NEVER_STORE_THIS", str(entry.metadata))
