from rest_framework import serializers

from .models import Document, DocumentAccessRequest


class PublicDocumentSerializer(serializers.ModelSerializer):
    categorySlug = serializers.SerializerMethodField()
    fileUrl = serializers.SerializerMethodField()
    downloadUrl = serializers.SerializerMethodField()
    sizeLabel = serializers.SerializerMethodField()
    fileSize = serializers.IntegerField(source="file_size", read_only=True)
    fileType = serializers.SerializerMethodField()
    openCount = serializers.IntegerField(source="open_count", read_only=True)
    isConfidential = serializers.BooleanField(source="is_confidential", read_only=True)
    canRead = serializers.SerializerMethodField()

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
            "isConfidential",
            "canRead",
        )

    def get_categorySlug(self, obj):
        return obj.category_slug

    def get_fileUrl(self, obj):
        if obj.is_confidential:
            return None
        return f"/api/v1/documents/{obj.slug}/content/"

    def get_downloadUrl(self, obj):
        if obj.is_confidential:
            return None
        return f"/api/v1/documents/{obj.slug}/download/"

    def get_canRead(self, obj):
        return not obj.is_confidential

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


class DocumentAccessRequestSerializer(serializers.ModelSerializer):
    fullName = serializers.CharField(source="full_name", max_length=180)
    organization = serializers.CharField(required=False, allow_blank=True, max_length=180)
    phone = serializers.CharField(required=False, allow_blank=True, max_length=40)
    reason = serializers.CharField(max_length=3000)

    class Meta:
        model = DocumentAccessRequest
        fields = ("fullName", "email", "phone", "organization", "reason")

    def validate_fullName(self, value):
        value = " ".join(value.split()).strip()
        if len(value) < 3:
            raise serializers.ValidationError("Indiquez votre nom et vos prénoms.")
        return value

    def validate_email(self, value):
        return value.strip().lower()

    def validate_reason(self, value):
        value = value.strip()
        if len(value) < 10:
            raise serializers.ValidationError(
                "Précisez brièvement le motif de votre demande."
            )
        return value
