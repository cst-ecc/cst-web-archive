from django.contrib.auth.signals import user_logged_in, user_logged_out, user_login_failed
from django.dispatch import receiver
from .models import AuditAction
from .services import audit_log


@receiver(user_logged_in)
def record_login_success(sender, request, user, **kwargs):
    audit_log(action=AuditAction.LOGIN_SUCCESS, actor=user, request=request, description="Connexion réussie.")


@receiver(user_logged_out)
def record_logout(sender, request, user, **kwargs):
    audit_log(action=AuditAction.LOGOUT, actor=user, request=request, description="Déconnexion.")


@receiver(user_login_failed)
def record_login_failure(sender, credentials, request, **kwargs):
    attempted_email = credentials.get("email") or credentials.get("username") or ""
    audit_log(
        action=AuditAction.LOGIN_FAILED,
        request=request,
        description="Échec de connexion.",
        metadata={"login_identifier": str(attempted_email)[:254]} if attempted_email else {},
    )
