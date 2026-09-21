from rest_framework import serializers

from apps.documents.serializers import PublicDocumentSerializer

from .models import News, NewsCategory


class PublicNewsCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = NewsCategory
        fields = ("slug", "name")


class PublicNewsSerializer(serializers.ModelSerializer):
    date = serializers.SerializerMethodField()
    imageUrl = serializers.SerializerMethodField()
    imageAlt = serializers.CharField(source="image_alt")
    category = PublicNewsCategorySerializer(read_only=True)
    documents = PublicDocumentSerializer(many=True, read_only=True)
    relatedDocumentSlugs = serializers.SerializerMethodField()
    homeSlot = serializers.SerializerMethodField()
    eventDate = serializers.SerializerMethodField()
    attachment = serializers.SerializerMethodField()
    sessionNumber = serializers.IntegerField(source="session_number", read_only=True)
    sessionTheme = serializers.CharField(source="session_theme", read_only=True)
    sessionLocation = serializers.CharField(source="session_location", read_only=True)
    sessionStartDate = serializers.SerializerMethodField()
    sessionEndDate = serializers.SerializerMethodField()

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
            "category",
            "documents",
            "relatedDocumentSlugs",
            "homeSlot",
            "eventDate",
            "attachment",
            "sessionNumber",
            "sessionTheme",
            "sessionLocation",
            "sessionStartDate",
            "sessionEndDate",
        )

    def get_date(self, obj):
        return obj.publication_date.isoformat() if obj.publication_date else None

    def get_imageUrl(self, obj):
        # URL relative volontaire : Next/Image peut la servir sur le même
        # domaine via le gateway sans configuration remotePatterns.
        if obj.featured_image:
            return obj.featured_image.url

        return ""

    def get_relatedDocumentSlugs(self, obj):
        # public_news_queryset() précharge uniquement les documents publiés.
        # Les slugs restent exposés pour compatibilité avec le frontend historique,
        # tandis que `documents` fournit désormais les objets complets sans N+1.
        return [document.slug for document in obj.documents.all()]

    def get_homeSlot(self, obj):
        return obj.home_slot or None

    def get_eventDate(self, obj):
        return obj.event_date.isoformat() if obj.event_date else None

    def get_sessionStartDate(self, obj):
        return obj.session_start_date.isoformat() if obj.session_start_date else None

    def get_sessionEndDate(self, obj):
        return obj.session_end_date.isoformat() if obj.session_end_date else None

    def get_attachment(self, obj):
        if not obj.attachment:
            return None

        data = {
            "type": obj.attachment_type,
            "url": obj.attachment.url,
            "label": obj.attachment_display_label,
        }

        # Pour un PDF, une couverture facultative peut servir de prévisualisation.
        if obj.attachment_type == "pdf" and obj.featured_image:
            data["previewUrl"] = obj.featured_image.url

        return data

    def to_representation(self, instance):
        data = super().to_representation(instance)

        # Conserver un contrat JSON propre : ces champs sont optionnels côté Next.
        optional_fields = (
            "homeSlot",
            "eventDate",
            "attachment",
            "sessionNumber",
            "sessionTheme",
            "sessionLocation",
            "sessionStartDate",
            "sessionEndDate",
        )
        for field in optional_fields:
            if data.get(field) in (None, ""):
                data.pop(field, None)

        if not data.get("category"):
            data.pop("category", None)

        return data
