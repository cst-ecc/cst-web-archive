from pathlib import Path

from django.db.models import Q
from django.http import FileResponse, HttpResponse
from django.shortcuts import get_object_or_404
from django.views.decorators.http import require_http_methods
from rest_framework.generics import ListAPIView, RetrieveAPIView
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.publication import PublicationStatus

from .models import Document
from .serializers import PublicDocumentSerializer
from .services import increment_downloads, register_document_open


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
    response = HttpResponse(
        status=200,
        content_type=document.mime_type or "application/octet-stream",
    )
    if document.file_size:
        response["Content-Length"] = str(document.file_size)
    response["Cache-Control"] = cache_control
    response["X-Content-Type-Options"] = "nosniff"
    response["X-Robots-Tag"] = "noindex, nofollow, noarchive"
    return response


@require_http_methods(["GET", "HEAD"])
def public_document_content_view(request, slug):
    document = get_object_or_404(
        Document.objects.filter(status=PublicationStatus.PUBLISHED),
        slug=slug,
    )
    if request.method == "HEAD":
        return _document_head_response(document, cache_control="private, max-age=300")
    return _document_file_response(document, cache_control="private, max-age=300")


@require_http_methods(["GET"])
def public_document_download_view(request, slug):
    document = get_object_or_404(
        Document.objects.filter(status=PublicationStatus.PUBLISHED),
        slug=slug,
    )
    source = (request.GET.get("source") or "").strip()
    increment_downloads(document=document, request=request, source=source)

    filename = document.original_filename or Path(document.file.name).name or "document"
    response = FileResponse(
        document.file.open("rb"),
        as_attachment=True,
        filename=filename,
        content_type=document.mime_type or "application/octet-stream",
    )
    response["Cache-Control"] = "private, no-store"
    response["X-Content-Type-Options"] = "nosniff"
    response["X-Robots-Tag"] = "noindex, nofollow, noarchive"
    return response


class PublicDocumentOpenView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request, slug):
        document = get_object_or_404(
            Document.objects.filter(status=PublicationStatus.PUBLISHED),
            slug=slug,
        )
        source = (request.query_params.get("source") or "").strip()
        open_count = register_document_open(
            document=document,
            request=request,
            source=source,
        )
        return Response({"slug": document.slug, "openCount": open_count})
