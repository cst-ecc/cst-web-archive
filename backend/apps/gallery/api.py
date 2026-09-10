from django.db.models import Prefetch
from rest_framework.generics import ListAPIView, RetrieveAPIView
from rest_framework.permissions import AllowAny

from apps.core.publication import PublicationStatus

from .models import GalleryAlbum, GalleryImage
from .serializers import PublicGalleryAlbumSerializer


class PublicGalleryAlbumQuerysetMixin:
    serializer_class = PublicGalleryAlbumSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        qs = (
            GalleryAlbum.objects.filter(status=PublicationStatus.PUBLISHED)
            .prefetch_related(
                Prefetch(
                    "images",
                    queryset=GalleryImage.objects.order_by("order", "created_at"),
                )
            )
            .order_by("-date", "display_order", "-published_at")
        )

        featured = self.request.query_params.get("featured")
        if featured in {"1", "true", "True"}:
            qs = qs.filter(featured=True).order_by(
                "display_order",
                "-date",
                "-published_at",
            )

        return qs


class PublicGalleryAlbumListView(PublicGalleryAlbumQuerysetMixin, ListAPIView):
    pagination_class = None


class PublicGalleryAlbumDetailView(PublicGalleryAlbumQuerysetMixin, RetrieveAPIView):
    lookup_field = "slug"
