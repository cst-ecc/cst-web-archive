import logging

from django.contrib import messages
from django.contrib.auth import authenticate, login, logout
from django.shortcuts import redirect, render
from django.utils import timezone
from django.views.decorators.cache import never_cache
from django.views.decorators.http import require_http_methods, require_POST

from apps.accounts.emails import send_login_otp_email
from apps.accounts.models import LoginOTP, OTPPurpose, User
from apps.accounts.otp import OTPResendTooSoon, issue_login_otp, verify_login_otp
from apps.audit.models import AuditAction
from apps.audit.services import audit_log

from .access import backoffice_2fa_required, backoffice_role_label, has_backoffice_access
from .forms import BackofficeLoginForm, OTPVerificationForm
from .rate_limit import is_login_rate_limited, record_login_failure, reset_identifier_ip_limit
from .session import PENDING_OTP_ID, PENDING_USER_ID, clear_pending_session, clear_verified_session, mark_verified_session, pending_session_is_valid, start_pending_session, update_pending_otp

logger = logging.getLogger(__name__)
GENERIC_LOGIN_ERROR = "Identifiants incorrects ou accès non autorisé."
GENERIC_DELIVERY_ERROR = "Le service de vérification est momentanément indisponible. Veuillez réessayer dans quelques instants."


def _pending_user(request):
    if not pending_session_is_valid(request):
        clear_pending_session(request)
        return None
    user_id = request.session.get(PENDING_USER_ID)
    try:
        user = User.objects.get(pk=user_id, is_active=True)
    except User.DoesNotExist:
        clear_pending_session(request)
        return None
    if not has_backoffice_access(user):
        clear_pending_session(request)
        return None
    return user


def _latest_pending_otp(user):
    now = timezone.now()
    candidates = LoginOTP.objects.filter(user=user, purpose=OTPPurpose.LOGIN, used_at__isnull=True, invalidated_at__isnull=True, expires_at__gt=now).order_by("-created_at")
    for otp in candidates[:5]:
        if not otp.is_locked:
            return otp
    return None


def _invalidate_otp_after_delivery_failure(*, otp, user, request) -> None:
    now = timezone.now()
    LoginOTP.objects.filter(pk=otp.pk, used_at__isnull=True, invalidated_at__isnull=True).update(invalidated_at=now)
    audit_log(action=AuditAction.OTP_FAILED, actor=user, request=request, target=otp, description="Échec de délivrance du code OTP.", metadata={"reason": "delivery_failed"})


def _deliver_otp(*, issued, user, request) -> bool:
    try:
        send_login_otp_email(user=user, code=issued.code)
        return True
    except Exception:
        logger.exception("Échec d'envoi de l'OTP de connexion.")
        _invalidate_otp_after_delivery_failure(otp=issued.otp, user=user, request=request)
        return False


@never_cache
@require_http_methods(["GET", "POST"])
def login_view(request):
    if request.user.is_authenticated and has_backoffice_access(request.user) and request.session.get("backoffice_2fa_verified_user_id") == request.user.pk:
        return redirect("backoffice:dashboard")

    if request.method == "GET":
        clear_pending_session(request)
        return render(request, "backoffice/login.html", {"form": BackofficeLoginForm()})

    form = BackofficeLoginForm(request.POST)
    if not form.is_valid():
        return render(request, "backoffice/login.html", {"form": form}, status=400)

    email = form.cleaned_data["email"].strip().lower()
    password = form.cleaned_data["password"]

    if is_login_rate_limited(request=request, email=email):
        audit_log(action=AuditAction.LOGIN_FAILED, request=request, description="Connexion bloquée temporairement par limitation de débit.", metadata={"reason": "rate_limited"})
        messages.error(request, GENERIC_LOGIN_ERROR)
        return render(request, "backoffice/login.html", {"form": form}, status=429)

    user = authenticate(request, email=email, password=password)
    if user is None:
        record_login_failure(request=request, email=email)
        messages.error(request, GENERIC_LOGIN_ERROR)
        return render(request, "backoffice/login.html", {"form": form}, status=400)

    if not has_backoffice_access(user):
        record_login_failure(request=request, email=email)
        audit_log(action=AuditAction.LOGIN_FAILED, actor=user, request=request, target=user, description="Accès back-office refusé.", metadata={"reason": "backoffice_not_allowed"})
        messages.error(request, GENERIC_LOGIN_ERROR)
        return render(request, "backoffice/login.html", {"form": form}, status=400)

    reset_identifier_ip_limit(request=request, email=email)

    try:
        issued = issue_login_otp(user=user, request=request, enforce_cooldown=True)
    except OTPResendTooSoon:
        existing = _latest_pending_otp(user)
        if existing is None:
            messages.error(request, GENERIC_DELIVERY_ERROR)
            return render(request, "backoffice/login.html", {"form": form}, status=429)
        start_pending_session(request, user_id=user.pk, otp_id=existing.pk)
        messages.info(request, "Un code de vérification a déjà été envoyé récemment.")
        return redirect("backoffice:otp")

    if not _deliver_otp(issued=issued, user=user, request=request):
        messages.error(request, GENERIC_DELIVERY_ERROR)
        return render(request, "backoffice/login.html", {"form": form}, status=503)

    start_pending_session(request, user_id=user.pk, otp_id=issued.otp.pk)
    messages.success(request, "Un code de vérification a été envoyé à votre adresse e-mail.")
    return redirect("backoffice:otp")


@never_cache
@require_http_methods(["GET", "POST"])
def otp_view(request):
    user = _pending_user(request)
    if user is None:
        messages.info(request, "Votre session de vérification a expiré. Veuillez vous reconnecter.")
        return redirect("backoffice:login")

    otp_id = request.session.get(PENDING_OTP_ID)
    if request.method == "POST":
        form = OTPVerificationForm(request.POST)
        if form.is_valid():
            if not otp_id:
                messages.error(request, "Demandez un nouveau code de vérification.")
            else:
                result = verify_login_otp(otp_id=otp_id, user=user, raw_code=form.cleaned_data["code"], request=request)
                if result.ok:
                    login(request, user, backend="django.contrib.auth.backends.ModelBackend")
                    mark_verified_session(request, user_id=user.pk)
                    return redirect("backoffice:dashboard")
                if result.reason in {"expired", "used", "invalidated", "locked"}:
                    request.session.pop(PENDING_OTP_ID, None)
                    request.session.modified = True
                if result.reason == "expired":
                    messages.error(request, "Ce code a expiré. Demandez un nouveau code.")
                elif result.reason == "locked":
                    messages.error(request, "Nombre maximal de tentatives atteint. Demandez un nouveau code.")
                elif result.reason in {"used", "invalidated"}:
                    messages.error(request, "Ce code n'est plus valide. Demandez un nouveau code.")
                else:
                    messages.error(request, f"Code incorrect. {result.remaining_attempts} tentative(s) restante(s).")
    else:
        form = OTPVerificationForm()

    return render(request, "backoffice/otp.html", {"form": form, "email_hint": _masked_email(user.email), "can_verify": bool(otp_id)})


@never_cache
@require_POST
def resend_otp_view(request):
    user = _pending_user(request)
    if user is None:
        messages.info(request, "Votre session de vérification a expiré. Veuillez vous reconnecter.")
        return redirect("backoffice:login")

    try:
        issued = issue_login_otp(user=user, request=request, enforce_cooldown=True)
    except OTPResendTooSoon as exc:
        messages.warning(request, f"Veuillez patienter {exc.retry_after_seconds} seconde(s) avant un nouveau renvoi.")
        return redirect("backoffice:otp")

    if not _deliver_otp(issued=issued, user=user, request=request):
        request.session.pop(PENDING_OTP_ID, None)
        request.session.modified = True
        messages.error(request, GENERIC_DELIVERY_ERROR)
        return redirect("backoffice:otp")

    update_pending_otp(request, otp_id=issued.otp.pk)
    messages.success(request, "Un nouveau code de vérification a été envoyé.")
    return redirect("backoffice:otp")


@never_cache
@require_POST
def logout_view(request):
    clear_pending_session(request)
    clear_verified_session(request)
    logout(request)
    return redirect("backoffice:login")


@never_cache
@backoffice_2fa_required
def dashboard_view(request):
    return render(request, "backoffice/dashboard.html", {"role_label": backoffice_role_label(request.user)})


def _masked_email(email: str) -> str:
    local, separator, domain = email.partition("@")
    if not separator:
        return email
    if len(local) <= 2:
        masked_local = local[0:1] + "*" * max(1, len(local) - 1)
    else:
        masked_local = local[:2] + "*" * max(2, len(local) - 2)
    return f"{masked_local}@{domain}"
