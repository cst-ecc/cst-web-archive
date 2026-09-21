from rest_framework import serializers

from .models import Document


class PublicDocumentSerializer(serializers.ModelSerializer):
    categorySlug = serializers.SerializerMethodField()
    fileUrl = serializers.SerializerMethodField()
    downloadUrl = serializers.SerializerMethodField()
    sizeLabel = serializers.SerializerMethodField()
    fileSize = serializers.IntegerField(source="file_size", read_only=True)
    fileType = serializers.SerializerMethodField()
    openCount = serializers.IntegerField(source="open_count", read_only=True)

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
            "fileType",
            "fileSize",
            "downloads",
            "openCount",
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

    def get_fileType(self, obj):
        name = (obj.file.name if obj.file else "").lower()
        mime = (obj.mime_type or "").lower()
        if mime == "application/pdf" or name.endswith(".pdf"):
            return "pdf"
        if name.endswith((".doc", ".docx", ".odt")):
            return "docx"
        if name.endswith((".xls", ".xlsx", ".ods")):
            return "xlsx"
        if name.endswith((".jpg", ".jpeg", ".png", ".webp")):
            return "image"
        return "autre"

    def get_sizeLabel(self, obj):
        return obj.size_label
