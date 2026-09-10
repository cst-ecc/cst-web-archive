from django.db.models import Q
from rest_framework.generics import ListAPIView, RetrieveAPIView
from rest_framework.permissions import AllowAny

from apps.core.publication import PublicationStatus

from .models import News
from .serializers import PublicNewsSerializer


class PublicNewsQuerysetMixin:
    serializer_class = PublicNewsSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        qs = (
            News.objects.filter(
                status=PublicationStatus.PUBLISHED,
                publication_date__isnull=False,
            )
            .exclude(featured_image="")
            .select_related("category")
            .order_by(
                "-publication_date",
                "-published_at",
                "display_order",
            )
        )

        featured = self.request.query_params.get("featured")
        if featured in {"1", "true", "True"}:
            qs = qs.filter(featured=True).order_by(
                "display_order",
                "-publication_date",
                "-published_at",
            )

        search = (self.request.query_params.get("search") or "").strip()
        if search:
            qs = qs.filter(
                Q(title__icontains=search)
                | Q(excerpt__icontains=search)
                | Q(content__icontains=search)
            )

        return qs


class PublicNewsListView(PublicNewsQuerysetMixin, ListAPIView):
    # Le frontend actuel attend directement NewsItem[] et non une enveloppe
    # paginée pour getNews().
    pagination_class = None


class PublicNewsDetailView(PublicNewsQuerysetMixin, RetrieveAPIView):
    lookup_field = "slug"
