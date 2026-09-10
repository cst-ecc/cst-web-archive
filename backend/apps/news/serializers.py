from rest_framework import serializers

from .models import News


class PublicNewsSerializer(serializers.ModelSerializer):
    date = serializers.SerializerMethodField()
    imageUrl = serializers.SerializerMethodField()
    imageAlt = serializers.CharField(source="image_alt")
    relatedDocumentSlugs = serializers.SerializerMethodField()

    class Meta:
        model = News
        fields = (
            "id",
            "slug",
            "title",
            "date",
            "excerpt",
            "imageUrl",
            "imageAlt",
            "content",
            "featured",
            "status",
            "relatedDocumentSlugs",
        )

    def get_date(self, obj):
        return obj.publication_date.isoformat() if obj.publication_date else None

    def get_imageUrl(self, obj):
        # URL relative volontaire : Next/Image peut la servir sur le même
        # domaine via le gateway sans configuration remotePatterns.
        return obj.featured_image.url if obj.featured_image else ""

    def get_relatedDocumentSlugs(self, obj):
        # Le module Documents sera branché ultérieurement sans casser le
        # contrat frontend déjà existant.
        return []
