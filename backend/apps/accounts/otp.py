from __future__ import annotations

import secrets
from dataclasses import dataclass
from datetime import timedelta

from django.conf import settings
from django.contrib.auth.hashers import make_password
from django.db import transaction
from django.utils import timezone

from apps.audit.models import AuditAction
from apps.audit.services import audit_log

from .models import LoginOTP, OTPPurpose, User


class OTPError(Exception):
    """Erreur métier de base du mécanisme OTP."""


class OTPResendTooSoon(OTPError):
    def __init__(self, retry_after_seconds: int):
        self.retry_after_seconds = max(1, retry_after_seconds)
        super().__init__(
            f"Un nouveau code pourra être demandé dans "
            f"{self.retry_after_seconds} seconde(s)."
        )


@dataclass(frozen=True)
class IssuedOTP:
    """
    Résultat de génération.

    ``code`` n'est jamais persisté. Le futur service e-mail devra l'utiliser
    immédiatement puis laisser la variable sortir de portée.
    """
    otp: LoginOTP
    code: str


@dataclass(frozen=True)
class OTPVerificationResult:
    ok: bool
    reason: str
    remaining_attempts: int


def _client_ip(request) -> str | None:
    if request is None:
        return None

    forwarded = request.META.get("HTTP_X_FORWARDED_FOR", "")
    if forwarded:
        return forwarded.split(",", 1)[0].strip() or None

    return request.META.get("REMOTE_ADDR") or None


def _user_agent(request) -> str:
    if request is None:
        return ""
    return (request.META.get("HTTP_USER_AGENT") or "")[:2000]


def _generate_numeric_code() -> str:
    """Génère cryptographiquement un code numérique de 6 chiffres."""
    return f"{secrets.randbelow(1_000_000):06d}"


@transaction.atomic
def issue_login_otp(*, user: User, request=None, enforce_cooldown: bool = True) -> IssuedOTP:
    """
    Génère un OTP de connexion et invalide les OTP actifs précédents.

    Le cooldown s'applique au dernier OTP non utilisé/non invalidé. Pour les
    tests ou opérations internes explicitement contrôlées, ``enforce_cooldown``
    peut être désactivé.
    """
    now = timezone.now()

    latest = (
        LoginOTP.objects.select_for_update()
        .filter(
            user=user,
            purpose=OTPPurpose.LOGIN,
            used_at__isnull=True,
            invalidated_at__isnull=True,
        )
        .order_by("-created_at")
        .first()
    )

    if (
        enforce_cooldown
        and latest is not None
        and now < latest.resend_available_at
    ):
        retry_after = int(
            (latest.resend_available_at - now).total_seconds()
        )
        raise OTPResendTooSoon(max(1, retry_after))

    LoginOTP.objects.filter(
        user=user,
        purpose=OTPPurpose.LOGIN,
        used_at__isnull=True,
        invalidated_at__isnull=True,
    ).update(invalidated_at=now)

    raw_code = _generate_numeric_code()

    otp = LoginOTP.objects.create(
        user=user,
        purpose=OTPPurpose.LOGIN,
        code_hash=make_password(raw_code),
        expires_at=now + timedelta(minutes=settings.OTP_EXPIRY_MINUTES),
        max_attempts=settings.OTP_MAX_ATTEMPTS,
        resend_available_at=now
        + timedelta(seconds=settings.OTP_RESEND_COOLDOWN_SECONDS),
        ip_address=_client_ip(request),
        user_agent=_user_agent(request),
    )

    audit_log(
        action=AuditAction.OTP_REQUESTED,
        actor=user,
        request=request,
        target=otp,
        description="Code OTP de connexion généré.",
        metadata={"purpose": OTPPurpose.LOGIN},
    )

    return IssuedOTP(otp=otp, code=raw_code)


@transaction.atomic
def verify_login_otp(
    *,
    otp_id: int,
    user: User,
    raw_code: str,
    request=None,
) -> OTPVerificationResult:
    """
    Vérifie un OTP de manière transactionnelle.

    Un OTP expiré, consommé, invalidé ou verrouillé n'est jamais accepté.
    Une réussite le marque immédiatement comme utilisé.
    """
    now = timezone.now()

    try:
        otp = (
            LoginOTP.objects.select_for_update()
            .select_related("user")
            .get(
                pk=otp_id,
                user=user,
                purpose=OTPPurpose.LOGIN,
            )
        )
    except LoginOTP.DoesNotExist:
        audit_log(
            action=AuditAction.OTP_FAILED,
            actor=user,
            request=request,
            description="Échec OTP : code introuvable.",
            metadata={"reason": "not_found"},
        )
        return OTPVerificationResult(False, "invalid", 0)

    if otp.is_used:
        return OTPVerificationResult(False, "used", 0)

    if otp.is_invalidated:
        return OTPVerificationResult(False, "invalidated", 0)

    if otp.is_expired:
        if otp.invalidated_at is None:
            otp.invalidated_at = now
            otp.save(update_fields=["invalidated_at"])

        audit_log(
            action=AuditAction.OTP_FAILED,
            actor=user,
            request=request,
            target=otp,
            description="Échec OTP : code expiré.",
            metadata={"reason": "expired"},
        )
        return OTPVerificationResult(False, "expired", 0)

    if otp.is_locked:
        if otp.invalidated_at is None:
            otp.invalidated_at = now
            otp.save(update_fields=["invalidated_at"])
        return OTPVerificationResult(False, "locked", 0)

    if not otp.matches(raw_code):
        otp.attempts += 1
        update_fields = ["attempts"]

        if otp.attempts >= otp.max_attempts:
            otp.invalidated_at = now
            update_fields.append("invalidated_at")

        otp.save(update_fields=update_fields)

        remaining = max(0, otp.max_attempts - otp.attempts)

        audit_log(
            action=AuditAction.OTP_FAILED,
            actor=user,
            request=request,
            target=otp,
            description="Échec OTP : code incorrect.",
            metadata={
                "reason": "invalid_code",
                "remaining_attempts": remaining,
            },
        )
        return OTPVerificationResult(
            False,
            "locked" if remaining == 0 else "invalid",
            remaining,
        )

    otp.used_at = now
    otp.save(update_fields=["used_at"])

    audit_log(
        action=AuditAction.OTP_SUCCESS,
        actor=user,
        request=request,
        target=otp,
        description="Code OTP de connexion validé.",
        metadata={"purpose": OTPPurpose.LOGIN},
    )

    return OTPVerificationResult(True, "ok", otp.max_attempts - otp.attempts)
