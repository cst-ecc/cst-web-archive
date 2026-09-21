from django.db.models import Prefetch, Q
from django.utils import timezone
from rest_framework.generics import ListAPIView, RetrieveAPIView
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.publication import PublicationStatus
from apps.documents.models import Document

from .models import News, NewsHomeSlot
from .serializers import PublicNewsSerializer


def public_news_queryset():
    """
    Base commune des actualités publiques.

    Une actualité standard doit disposer d'une image de couverture.
    Une actualité spéciale (Alerte Info / Événement à venir) peut être publiée
    sans couverture à condition d'avoir sa propre pièce jointe.
    """
    return (
        News.objects.filter(
            status=PublicationStatus.PUBLISHED,
            publication_date__isnull=False,
        )
        .filter(
            ~Q(featured_image="")
            | (
                Q(
                    home_slot__in=[
                        NewsHomeSlot.ALERT_INFO,
                        NewsHomeSlot.UPCOMING_EVENT,
                    ]
                )
                & ~Q(attachment="")
            )
        )
        .select_related("category")
        .prefetch_related(
            Prefetch(
                "documents",
                queryset=(
                    Document.objects.filter(status=PublicationStatus.PUBLISHED)
                    .select_related("category")
                    .order_by("-date", "display_order", "title")
                ),
            )
        )
    )


class PublicNewsQuerysetMixin:
    serializer_class = PublicNewsSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        qs = public_news_queryset().order_by(
            "-publication_date",
            "-published_at",
            "display_order",
        )

        featured = self.request.query_params.get("featured")
        if featured in {"1", "true", "True"}:
            qs = qs.filter(featured=True).order_by(
                "display_order",
                "-publication_date",
                "-published_at",
            )

        category = (self.request.query_params.get("category") or "").strip()
        if category:
            qs = qs.filter(category__slug=category)

        document_kind = (
            self.request.query_params.get("document_kind") or ""
        ).strip()
        if document_kind:
            qs = qs.filter(
                documents__kind=document_kind,
                documents__status=PublicationStatus.PUBLISHED,
            ).distinct()

        home_slot = (self.request.query_params.get("home_slot") or "").strip()
        if home_slot:
            if home_slot in NewsHomeSlot.values:
                qs = qs.filter(home_slot=home_slot)
            else:
                qs = qs.none()

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


class PublicHomeSpecialNewsView(APIView):
    """
    Retourne au maximum deux éléments, dans l'ordre d'affichage de l'accueil :
    1. le prochain événement (date aujourd'hui ou future la plus proche) ;
    2. la dernière Alerte Info publiée.
    """

    permission_classes = [AllowAny]

    def get(self, request):
        base = public_news_queryset().exclude(attachment="")

        event = (
            base.filter(
                home_slot=NewsHomeSlot.UPCOMING_EVENT,
                event_date__gte=timezone.localdate(),
            )
            .order_by(
                "event_date",
                "display_order",
                "-publication_date",
                "-published_at",
            )
            .first()
        )

        alert = (
            base.filter(home_slot=NewsHomeSlot.ALERT_INFO)
            .order_by(
                "-publication_date",
                "-published_at",
                "display_order",
            )
            .first()
        )

        items = [item for item in (event, alert) if item is not None]
        serializer = PublicNewsSerializer(
            items,
            many=True,
            context={"request": request},
        )
        return Response(serializer.data)
