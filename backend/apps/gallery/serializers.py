from rest_framework import serializers

from .models import GalleryAlbum, GalleryImage


class PublicGalleryImageSerializer(serializers.ModelSerializer):
    imageUrl = serializers.SerializerMethodField()

    class Meta:
        model = GalleryImage
        fields = (
            "id",
            "title",
            "imageUrl",
            "alt",
            "width",
            "height",
        )

    def get_imageUrl(self, obj):
        return obj.image.url if obj.image else ""


class PublicGalleryAlbumSerializer(serializers.ModelSerializer):
    coverUrl = serializers.SerializerMethodField()
    images = PublicGalleryImageSerializer(many=True)
    relatedSessionSlug = serializers.SerializerMethodField()

    class Meta:
        model = GalleryAlbum
        fields = (
            "id",
            "slug",
            "title",
            "date",
            "description",
            "coverUrl",
            "images",
            "relatedSessionSlug",
            "status",
        )

    def get_coverUrl(self, obj):
        return obj.cover_url

    def get_relatedSessionSlug(self, obj):
        return None
