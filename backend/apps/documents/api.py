from django.db.models import Q
from django.shortcuts import get_object_or_404, redirect
from rest_framework.generics import ListAPIView, RetrieveAPIView
from rest_framework.permissions import AllowAny

from apps.core.publication import PublicationStatus

from .models import Document
from .serializers import PublicDocumentSerializer
from .services import increment_downloads


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
            qs = qs.order_by("-downloads", "-date")

        return qs


class PublicDocumentListView(PublicDocumentQuerysetMixin, ListAPIView):
    pagination_class = None


class PublicDocumentDetailView(PublicDocumentQuerysetMixin, RetrieveAPIView):
    lookup_field = "slug"


def public_document_download_view(request, slug):
    document = get_object_or_404(
        Document.objects.filter(status=PublicationStatus.PUBLISHED),
        slug=slug,
    )
    increment_downloads(document)
    return redirect(document.file.url)
