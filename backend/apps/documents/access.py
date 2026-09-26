from __future__ import annotations

import hashlib
import secrets
from dataclasses import dataclass
from datetime import timedelta

from django.conf import settings
from django.contrib.auth.hashers import check_password, make_password
from django.core.signing import BadSignature, SignatureExpired, TimestampSigner
from django.db import transaction
from django.db.models import F
from django.utils import timezone

from apps.audit.models import AuditAction
from apps.audit.services import audit_log

from .models import (
    DocumentAccessGrant,
    DocumentAccessOTP,
    DocumentAccessRequest,
    DocumentAccessRequestStatus,
)

ACCESS_COOKIE_NAME = "cst_document_access"
ACCESS_OPEN_COOKIE_NAME = "cst_document_open"
ACCESS_COOKIE_SALT = "documents.secure-access"
ACCESS_OPEN_COOKIE_SALT = "documents.secure-open"
ACCESS_COOKIE_MAX_AGE_SECONDS = 30 * 60


class AccessGrantError(Exception):
    pass


class AccessOTPError(Exception):
    pass


class AccessOTPResendTooSoon(AccessOTPError):
    def __init__(self, retry_after_seconds: int):
        self.retry_after_seconds = max(1, retry_after_seconds)
        super().__init__(
            f"Un nouveau code pourra être demandé dans {self.retry_after_seconds} seconde(s)."
        )


@dataclass(frozen=True)
class IssuedAccessOTP:
    otp: DocumentAccessOTP
    code: str


@dataclass(frozen=True)
class AccessOTPVerificationResult:
    ok: bool
    reason: str
    remaining_attempts: int


def _token_hash(raw_token: str) -> str:
    return hashlib.sha256(raw_token.encode("utf-8")).hexdigest()


def generate_access_token() -> str:
    return secrets.token_urlsafe(36)


def mask_email(email: str) -> str:
    local, separator, domain = email.partition("@")
    if not separator:
        return email
    if len(local) <= 2:
        masked_local = local[:1] + "*" * max(1, len(local) - 1)
    else:
        masked_local = local[:2] + "*" * max(3, len(local) - 2)
    return f"{masked_local}@{domain}"


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


def resolve_grant(raw_token: str) -> DocumentAccessGrant | None:
    if not raw_token:
        return None
    return (
        DocumentAccessGrant.objects.select_related("document", "request", "created_by")
        .filter(token_hash=_token_hash(raw_token))
        .first()
    )


def grant_unavailable_reason(grant: DocumentAccessGrant) -> str | None:
    if grant.is_revoked:
        return "revoked"
    if grant.is_expired:
        return "expired"
    if not grant.has_remaining_opens:
        return "limit_reached"
    if not grant.document.is_confidential:
        return "not_confidential"
    return None


@transaction.atomic
def approve_access_request(
    *,
    access_request: DocumentAccessRequest,
    reviewer,
    duration_hours: int,
    max_opens: int,
    request=None,
) -> tuple[DocumentAccessGrant, str]:
    locked = (
        DocumentAccessRequest.objects.select_for_update()
        .select_related("document")
        .get(pk=access_request.pk)
    )

    if locked.status != DocumentAccessRequestStatus.PENDING:
        raise AccessGrantError("Cette demande a déjà été traitée.")
    if not locked.document.is_confidential:
        raise AccessGrantError("Ce document n’est plus marqué comme confidentiel.")

    now = timezone.now()
    raw_token = generate_access_token()
    grant = DocumentAccessGrant.objects.create(
        request=locked,
        document=locked.document,
        recipient_name=locked.full_name,
        recipient_email=locked.email,
        token_hash=_token_hash(raw_token),
        expires_at=now + timedelta(hours=max(1, int(duration_hours))),
        max_opens=max(1, int(max_opens)),
        created_by=reviewer,
    )

    locked.status = DocumentAccessRequestStatus.APPROVED
    locked.reviewed_at = now
    locked.reviewed_by = reviewer
    locked.refusal_reason = ""
    locked.save(
        update_fields=[
            "status",
            "reviewed_at",
            "reviewed_by",
            "refusal_reason",
            "updated_at",
        ]
    )

    audit_log(
        action=AuditAction.DOCUMENT_ACCESS_APPROVED,
        actor=reviewer,
        request=request,
        target=grant,
        description="Autorisation temporaire créée pour un document confidentiel.",
        metadata={
            "document_id": locked.document_id,
            "access_request_id": locked.pk,
            "expires_at": grant.expires_at.isoformat(),
            "max_opens": grant.max_opens,
            "grant_reference": grant.reference,
        },
    )
    return grant, raw_token


@transaction.atomic
def refuse_access_request(
    *,
    access_request: DocumentAccessRequest,
    reviewer,
    reason: str = "",
    request=None,
) -> DocumentAccessRequest:
    locked = DocumentAccessRequest.objects.select_for_update().get(pk=access_request.pk)
    if locked.status != DocumentAccessRequestStatus.PENDING:
        raise AccessGrantError("Cette demande a déjà été traitée.")

    locked.status = DocumentAccessRequestStatus.REFUSED
    locked.reviewed_at = timezone.now()
    locked.reviewed_by = reviewer
    locked.refusal_reason = (reason or "").strip()[:1000]
    locked.save(
        update_fields=[
            "status",
            "reviewed_at",
            "reviewed_by",
            "refusal_reason",
            "updated_at",
        ]
    )

    audit_log(
        action=AuditAction.DOCUMENT_ACCESS_REFUSED,
        actor=reviewer,
        request=request,
        target=locked,
        description="Demande d’accès à un document confidentiel refusée.",
        metadata={"document_id": locked.document_id},
    )
    return locked


@transaction.atomic
def rotate_grant_token(*, grant: DocumentAccessGrant, actor, request=None) -> tuple[DocumentAccessGrant, str]:
    locked = DocumentAccessGrant.objects.select_for_update().get(pk=grant.pk)
    reason = grant_unavailable_reason(locked)
    if reason is not None:
        raise AccessGrantError("Cette autorisation n’est plus active.")

    raw_token = generate_access_token()
    locked.token_hash = _token_hash(raw_token)
    locked.save(update_fields=["token_hash", "updated_at"])

    audit_log(
        action=AuditAction.DOCUMENT_ACCESS_LINK_RENEWED,
        actor=actor,
        request=request,
        target=locked,
        description="Lien temporaire d’accès régénéré.",
        metadata={"grant_reference": locked.reference},
    )
    return locked, raw_token


@transaction.atomic
def mark_grant_link_sent(*, grant: DocumentAccessGrant) -> None:
    DocumentAccessGrant.objects.filter(pk=grant.pk).update(link_sent_at=timezone.now())


@transaction.atomic
def revoke_grant(*, grant: DocumentAccessGrant, actor, request=None) -> DocumentAccessGrant:
    locked = DocumentAccessGrant.objects.select_for_update().get(pk=grant.pk)
    if locked.revoked_at is None:
        locked.revoked_at = timezone.now()
        locked.revoked_by = actor
        locked.save(update_fields=["revoked_at", "revoked_by", "updated_at"])

    DocumentAccessOTP.objects.filter(
        grant=locked,
        used_at__isnull=True,
        invalidated_at__isnull=True,
    ).update(invalidated_at=timezone.now())

    audit_log(
        action=AuditAction.DOCUMENT_ACCESS_REVOKED,
        actor=actor,
        request=request,
        target=locked,
        description="Autorisation d’accès révoquée.",
        metadata={"grant_reference": locked.reference},
    )
    return locked


def _generate_numeric_code() -> str:
    return f"{secrets.randbelow(1_000_000):06d}"


@transaction.atomic
def issue_access_otp(*, grant: DocumentAccessGrant, request=None) -> IssuedAccessOTP:
    locked = DocumentAccessGrant.objects.select_for_update().get(pk=grant.pk)
    reason = grant_unavailable_reason(locked)
    if reason is not None:
        raise AccessGrantError(reason)

    now = timezone.now()
    latest = (
        DocumentAccessOTP.objects.select_for_update()
        .filter(
            grant=locked,
            used_at__isnull=True,
            invalidated_at__isnull=True,
        )
        .order_by("-created_at")
        .first()
    )
    if latest is not None and now < latest.resend_available_at:
        retry_after = int((latest.resend_available_at - now).total_seconds())
        raise AccessOTPResendTooSoon(max(1, retry_after))

    DocumentAccessOTP.objects.filter(
        grant=locked,
        used_at__isnull=True,
        invalidated_at__isnull=True,
    ).update(invalidated_at=now)

    raw_code = _generate_numeric_code()
    otp = DocumentAccessOTP.objects.create(
        grant=locked,
        code_hash=make_password(raw_code),
        expires_at=now + timedelta(minutes=settings.OTP_EXPIRY_MINUTES),
        max_attempts=settings.OTP_MAX_ATTEMPTS,
        resend_available_at=now + timedelta(seconds=settings.OTP_RESEND_COOLDOWN_SECONDS),
        ip_address=_client_ip(request),
        user_agent=_user_agent(request),
    )

    audit_log(
        action=AuditAction.DOCUMENT_ACCESS_OTP_REQUESTED,
        request=request,
        target=locked,
        description="Code de vérification envoyé pour un document confidentiel.",
        metadata={"grant_reference": locked.reference},
    )
    return IssuedAccessOTP(otp=otp, code=raw_code)


@transaction.atomic
def verify_access_otp(
    *,
    grant: DocumentAccessGrant,
    raw_code: str,
    request=None,
) -> AccessOTPVerificationResult:
    locked_grant = DocumentAccessGrant.objects.select_for_update().get(pk=grant.pk)
    reason = grant_unavailable_reason(locked_grant)
    if reason is not None:
        return AccessOTPVerificationResult(False, reason, 0)

    otp = (
        DocumentAccessOTP.objects.select_for_update()
        .filter(grant=locked_grant, used_at__isnull=True, invalidated_at__isnull=True)
        .order_by("-created_at")
        .first()
    )
    if otp is None:
        return AccessOTPVerificationResult(False, "not_found", 0)

    now = timezone.now()
    if otp.is_expired:
        otp.invalidated_at = now
        otp.save(update_fields=["invalidated_at"])
        return AccessOTPVerificationResult(False, "expired", 0)

    if otp.attempts >= otp.max_attempts:
        otp.invalidated_at = otp.invalidated_at or now
        otp.save(update_fields=["invalidated_at"])
        return AccessOTPVerificationResult(False, "locked", 0)

    if not check_password(raw_code, otp.code_hash):
        otp.attempts += 1
        update_fields = ["attempts"]
        remaining = max(0, otp.max_attempts - otp.attempts)
        if remaining == 0:
            otp.invalidated_at = now
            update_fields.append("invalidated_at")
        otp.save(update_fields=update_fields)

        audit_log(
            action=AuditAction.DOCUMENT_ACCESS_OTP_FAILED,
            request=request,
            target=locked_grant,
            description="Code de vérification incorrect pour un document confidentiel.",
            metadata={
                "grant_reference": locked_grant.reference,
                "remaining_attempts": remaining,
            },
        )
        return AccessOTPVerificationResult(
            False,
            "locked" if remaining == 0 else "invalid",
            remaining,
        )

    otp.used_at = now
    otp.save(update_fields=["used_at"])
    locked_grant.last_verified_at = now
    locked_grant.save(update_fields=["last_verified_at", "updated_at"])

    audit_log(
        action=AuditAction.DOCUMENT_ACCESS_VERIFIED,
        request=request,
        target=locked_grant,
        description="Identité vérifiée par OTP pour un document confidentiel.",
        metadata={"grant_reference": locked_grant.reference},
    )
    return AccessOTPVerificationResult(True, "ok", otp.max_attempts - otp.attempts)


def _cookie_signer() -> TimestampSigner:
    return TimestampSigner(salt=ACCESS_COOKIE_SALT)


def _open_cookie_signer() -> TimestampSigner:
    return TimestampSigner(salt=ACCESS_OPEN_COOKIE_SALT)


def make_access_cookie_value(grant: DocumentAccessGrant) -> str:
    return _cookie_signer().sign(str(grant.pk))


def request_has_verified_access(request, grant: DocumentAccessGrant) -> bool:
    raw = request.COOKIES.get(ACCESS_COOKIE_NAME, "")
    if not raw:
        return False
    try:
        unsigned = _cookie_signer().unsign(
            raw,
            max_age=ACCESS_COOKIE_MAX_AGE_SECONDS,
        )
    except (BadSignature, SignatureExpired):
        return False
    return unsigned == str(grant.pk) and grant.last_verified_at is not None


def set_verified_access_cookie(response, grant: DocumentAccessGrant) -> None:
    remaining = max(1, int((grant.expires_at - timezone.now()).total_seconds()))
    max_age = min(ACCESS_COOKIE_MAX_AGE_SECONDS, remaining)
    response.set_cookie(
        ACCESS_COOKIE_NAME,
        make_access_cookie_value(grant),
        max_age=max_age,
        httponly=True,
        secure=not settings.DEBUG,
        samesite="Lax",
        path="/api/v1/documents/access/",
    )


def _open_marker_payload(grant: DocumentAccessGrant) -> str:
    verified = grant.last_verified_at.isoformat() if grant.last_verified_at else ""
    return f"{grant.pk}:{verified}"


def request_has_counted_open(request, grant: DocumentAccessGrant) -> bool:
    raw = request.COOKIES.get(ACCESS_OPEN_COOKIE_NAME, "")
    if not raw or grant.last_verified_at is None:
        return False
    try:
        unsigned = _open_cookie_signer().unsign(
            raw,
            max_age=ACCESS_COOKIE_MAX_AGE_SECONDS,
        )
    except (BadSignature, SignatureExpired):
        return False
    return unsigned == _open_marker_payload(grant)


def set_counted_open_cookie(response, grant: DocumentAccessGrant) -> None:
    remaining = max(1, int((grant.expires_at - timezone.now()).total_seconds()))
    max_age = min(ACCESS_COOKIE_MAX_AGE_SECONDS, remaining)
    response.set_cookie(
        ACCESS_OPEN_COOKIE_NAME,
        _open_cookie_signer().sign(_open_marker_payload(grant)),
        max_age=max_age,
        httponly=True,
        secure=not settings.DEBUG,
        samesite="Lax",
        path="/api/v1/documents/access/",
    )


@transaction.atomic
def register_secure_open(*, grant: DocumentAccessGrant, request=None) -> DocumentAccessGrant:
    locked = DocumentAccessGrant.objects.select_for_update().select_related("document").get(pk=grant.pk)
    reason = grant_unavailable_reason(locked)
    if reason is not None:
        raise AccessGrantError(reason)

    now = timezone.now()
    locked.open_count = F("open_count") + 1
    locked.last_opened_at = now
    locked.save(update_fields=["open_count", "last_opened_at", "updated_at"])
    locked.refresh_from_db(fields=["open_count", "last_opened_at"])

    audit_log(
        action=AuditAction.DOCUMENT_SECURE_OPENED,
        request=request,
        target=locked,
        description="Document confidentiel ouvert dans le lecteur sécurisé.",
        metadata={
            "document_id": locked.document_id,
            "grant_reference": locked.reference,
            "open_count": locked.open_count,
            "max_opens": locked.max_opens,
        },
    )
    return locked
