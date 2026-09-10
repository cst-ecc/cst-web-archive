from rest_framework import serializers

from .models import Document


class PublicDocumentSerializer(serializers.ModelSerializer):
    categorySlug = serializers.SerializerMethodField()
    fileUrl = serializers.SerializerMethodField()
    downloadUrl = serializers.SerializerMethodField()
    sizeLabel = serializers.SerializerMethodField()

    class Meta:
        model = Document
        fields = (
            "id",
            "slug",
            "title",
            "summary",
            "categorySlug",
            "kind",
            "date",
            "reference",
            "fileUrl",
            "downloadUrl",
            "downloads",
            "pages",
            "sizeLabel",
            "featured",
            "status",
        )

    def get_categorySlug(self, obj):
        return obj.category_slug

    def get_fileUrl(self, obj):
        return obj.file_url

    def get_downloadUrl(self, obj):
        return f"/api/v1/documents/{obj.slug}/download/"

    def get_sizeLabel(self, obj):
        return obj.size_label
