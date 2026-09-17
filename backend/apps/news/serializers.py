from rest_framework import serializers

from .models import News


class PublicNewsSerializer(serializers.ModelSerializer):
    date = serializers.SerializerMethodField()
    imageUrl = serializers.SerializerMethodField()
    imageAlt = serializers.CharField(source="image_alt")
    relatedDocumentSlugs = serializers.SerializerMethodField()
    homeSlot = serializers.SerializerMethodField()
    eventDate = serializers.SerializerMethodField()
    attachment = serializers.SerializerMethodField()

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
            "homeSlot",
            "eventDate",
            "attachment",
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
        # Le module Documents reste indépendant de la pièce jointe de l'actualité.
        return []

    def get_homeSlot(self, obj):
        return obj.home_slot or None

    def get_eventDate(self, obj):
        return obj.event_date.isoformat() if obj.event_date else None

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
        if not data.get("homeSlot"):
            data.pop("homeSlot", None)
        if not data.get("eventDate"):
            data.pop("eventDate", None)
        if not data.get("attachment"):
            data.pop("attachment", None)

        return data
