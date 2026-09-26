from pathlib import Path

from django.http import FileResponse, HttpResponse
from django.shortcuts import get_object_or_404, redirect
from django.utils import timezone
from django.views.decorators.http import require_http_methods
from rest_framework import status
from rest_framework.generics import ListAPIView, RetrieveAPIView
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.audit.models import AuditAction
from apps.audit.services import audit_log
from apps.core.publication import PublicationStatus

from .access import (
    AccessGrantError,
    AccessOTPResendTooSoon,
    grant_unavailable_reason,
    issue_access_otp,
    mask_email,
    register_secure_open,
    request_has_counted_open,
    request_has_verified_access,
    resolve_grant,
    set_counted_open_cookie,
    set_verified_access_cookie,
    verify_access_otp,
)
from .emails import send_document_access_otp_email
from .models import Document, DocumentAccessRequest, DocumentAccessRequestStatus
from .serializers import DocumentAccessRequestSerializer, PublicDocumentSerializer
from .services import increment_downloads, register_document_open


class PublicNoStoreAPIView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def finalize_response(self, request, response, *args, **kwargs):
        response = super().finalize_response(request, response, *args, **kwargs)
        response["Cache-Control"] = "private, no-store"
        response["Pragma"] = "no-cache"
        return response


class PublicDocumentQuerysetMixin:
    serializer_class = PublicDocumentSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        qs = (
            Document.objects.filter(status=PublicationStatus.PUBLISHED)
            .select_related("category")
            .order_by("-date", "display_order", "-published_at")
        )

        category = self.request.query_params.get("category")
        if category:
            qs = qs.filter(category__slug=category)

        kind = self.request.query_params.get("kind")
        if kind:
            qs = qs.filter(kind=kind)

        year = self.request.query_params.get("year")
        if year and year.isdigit():
            qs = qs.filter(date__year=int(year))

        search = (self.request.query_params.get("search") or "").strip()
        if search:
            from django.db.models import Q

            qs = qs.filter(
                Q(title__icontains=search)
                | Q(summary__icontains=search)
                | Q(reference__icontains=search)
            )

        featured = self.request.query_params.get("featured")
        if featured in {"1", "true", "True"}:
            qs = qs.filter(featured=True).order_by(
                "display_order",
                "-date",
                "-published_at",
            )

        ordering = self.request.query_params.get("ordering")
        if ordering == "ancien":
            qs = qs.order_by("date", "display_order")
        elif ordering == "titre":
            qs = qs.order_by("title")
        elif ordering == "populaire":
            qs = qs.order_by("-open_count", "-date")

        return qs


class PublicDocumentListView(PublicDocumentQuerysetMixin, ListAPIView):
    pagination_class = None


class PublicDocumentDetailView(PublicDocumentQuerysetMixin, RetrieveAPIView):
    lookup_field = "slug"


def _document_file_response(document: Document, *, cache_control: str) -> FileResponse:
    filename = document.original_filename or Path(document.file.name).name or "document"
    response = FileResponse(
        document.file.open("rb"),
        as_attachment=False,
        filename=filename,
        content_type=document.mime_type or "application/octet-stream",
    )
    response["Cache-Control"] = cache_control
    response["X-Content-Type-Options"] = "nosniff"
    response["X-Robots-Tag"] = "noindex, nofollow, noarchive"
    return response


def _document_head_response(document: Document, *, cache_control: str) -> HttpResponse:
    response = HttpResponse(status=200, content_type=document.mime_type or "application/octet-stream")
    if document.file_size:
        response["Content-Length"] = str(document.file_size)
    response["Cache-Control"] = cache_control
    response["X-Content-Type-Options"] = "nosniff"
    response["X-Robots-Tag"] = "noindex, nofollow, noarchive"
    return response


@require_http_methods(["GET", "HEAD"])
def public_document_content_view(request, slug):
    document = get_object_or_404(
        Document.objects.filter(
            status=PublicationStatus.PUBLISHED,
            is_confidential=False,
        ),
        slug=slug,
    )
    if request.method == "HEAD":
        return _document_head_response(document, cache_control="private, max-age=300")
    return _document_file_response(document, cache_control="private, max-age=300")


def public_document_download_view(request, slug):
    document = get_object_or_404(
        Document.objects.filter(
            status=PublicationStatus.PUBLISHED,
            is_confidential=False,
        ),
        slug=slug,
    )
    increment_downloads(document)
    return redirect("documents_api:content", slug=document.slug)


class PublicDocumentOpenView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request, slug):
        document = get_object_or_404(
            Document.objects.filter(
                status=PublicationStatus.PUBLISHED,
                is_confidential=False,
            ),
            slug=slug,
        )
        source = (request.query_params.get("source") or "").strip()
        open_count = register_document_open(
            document=document,
            request=request,
            source=source,
        )
        return Response({"slug": document.slug, "openCount": open_count})


class DocumentAccessRequestView(PublicNoStoreAPIView):

    def post(self, request, slug):
        document = get_object_or_404(
            Document.objects.filter(
                status=PublicationStatus.PUBLISHED,
                is_confidential=True,
            ),
            slug=slug,
        )
        serializer = DocumentAccessRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        email = data["email"].strip().lower()

        existing = (
            DocumentAccessRequest.objects.filter(
                document=document,
                email__iexact=email,
                status=DocumentAccessRequestStatus.PENDING,
            )
            .order_by("-created_at")
            .first()
        )
        if existing is not None:
            return Response(
                {
                    "status": existing.status,
                    "message": (
                        "Votre demande est enregistrée et reste en attente d’examen."
                    ),
                },
                status=status.HTTP_200_OK,
            )

        access_request = DocumentAccessRequest.objects.create(
            document=document,
            full_name=data["full_name"],
            email=email,
            phone=(data.get("phone") or "").strip(),
            organization=(data.get("organization") or "").strip(),
            reason=data["reason"],
        )
        audit_log(
            action=AuditAction.DOCUMENT_ACCESS_REQUESTED,
            request=request,
            target=access_request,
            description="Demande publique d’accès à un document confidentiel.",
            metadata={
                "document_id": document.pk,
                "document_slug": document.slug,
                "email_domain": email.partition("@")[2],
            },
        )
        return Response(
            {
                "status": access_request.status,
                "message": "Votre demande a bien été enregistrée.",
            },
            status=status.HTTP_201_CREATED,
        )


class SecureDocumentAccessInfoView(PublicNoStoreAPIView):

    def get(self, request, token):
        grant = resolve_grant(token)
        if grant is None:
            return Response({"detail": "Lien d’accès invalide."}, status=status.HTTP_404_NOT_FOUND)

        verified = request_has_verified_access(request, grant)
        counted_open = verified and request_has_counted_open(request, grant)
        unavailable = grant_unavailable_reason(grant)
        if unavailable and not (unavailable == "limit_reached" and counted_open):
            return Response(
                {"detail": unavailable},
                status=status.HTTP_410_GONE,
            )

        payload = {
            "verified": verified,
            "recipientHint": mask_email(grant.recipient_email),
            "expiresAt": grant.expires_at.isoformat(),
            "remainingOpens": grant.remaining_opens,
            "maxOpens": grant.max_opens,
            "grantReference": grant.reference,
            "document": {
                "slug": grant.document.slug,
                "title": grant.document.title,
                "reference": grant.document.reference,
            },
        }
        if verified:
            payload["watermark"] = {
                "name": grant.recipient_name,
                "reference": grant.reference,
            }
        return Response(payload)


class SecureDocumentOTPIssueView(PublicNoStoreAPIView):

    def post(self, request, token):
        grant = resolve_grant(token)
        if grant is None:
            return Response({"detail": "Lien d’accès invalide."}, status=status.HTTP_404_NOT_FOUND)

        if request_has_verified_access(request, grant):
            return Response({"verified": True, "message": "Accès déjà vérifié."})

        try:
            issued = issue_access_otp(grant=grant, request=request)
        except AccessOTPResendTooSoon as exc:
            return Response(
                {
                    "detail": "Un code a déjà été envoyé récemment.",
                    "retryAfter": exc.retry_after_seconds,
                },
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )
        except AccessGrantError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_410_GONE)

        try:
            send_document_access_otp_email(grant=grant, code=issued.code)
        except Exception:
            issued.otp.invalidated_at = timezone.now()
            issued.otp.save(update_fields=["invalidated_at"])
            return Response(
                {"detail": "Le code n’a pas pu être envoyé. Réessayez plus tard."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        return Response(
            {
                "message": f"Un code de vérification a été envoyé à {mask_email(grant.recipient_email)}.",
                "recipientHint": mask_email(grant.recipient_email),
            }
        )


class SecureDocumentOTPVerifyView(PublicNoStoreAPIView):

    def post(self, request, token):
        grant = resolve_grant(token)
        if grant is None:
            return Response({"detail": "Lien d’accès invalide."}, status=status.HTTP_404_NOT_FOUND)

        code = str(request.data.get("code") or "").strip()
        if len(code) != 6 or not code.isdigit():
            return Response(
                {"detail": "Saisissez le code à 6 chiffres."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        result = verify_access_otp(
            grant=grant,
            raw_code=code,
            request=request,
        )
        if not result.ok:
            messages = {
                "expired": "Ce code a expiré. Demandez un nouveau code.",
                "locked": "Nombre maximal de tentatives atteint. Demandez un nouveau code.",
                "not_found": "Demandez d’abord un code de vérification.",
                "invalid": "Code incorrect.",
                "revoked": "Cette autorisation a été révoquée.",
                "limit_reached": "Le nombre maximal d’ouvertures a été atteint.",
            }
            return Response(
                {
                    "detail": messages.get(result.reason, "Ce code n’est plus valide."),
                    "remainingAttempts": result.remaining_attempts,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        response = Response({"verified": True, "message": "Accès vérifié."})
        set_verified_access_cookie(response, grant)
        return response


@require_http_methods(["GET", "HEAD"])
def secure_document_content_view(request, token):
    grant = resolve_grant(token)
    if grant is None:
        return HttpResponse(status=404)

    if grant.is_revoked or grant.is_expired or not grant.document.is_confidential:
        return HttpResponse(status=410)

    if not request_has_verified_access(request, grant):
        return HttpResponse(status=403)

    counted_open = request_has_counted_open(request, grant)
    if not grant.has_remaining_opens and not counted_open:
        return HttpResponse(status=410)

    if request.method == "HEAD":
        return _document_head_response(grant.document, cache_control="private, no-store")

    if not counted_open:
        try:
            grant = register_secure_open(grant=grant, request=request)
        except AccessGrantError:
            return HttpResponse(status=410)

    response = _document_file_response(grant.document, cache_control="private, no-store")
    if not counted_open:
        set_counted_open_cookie(response, grant)
    return response
