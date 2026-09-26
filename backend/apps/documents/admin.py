from django.contrib import admin

from .models import (
    Document,
    DocumentAccessGrant,
    DocumentAccessOTP,
    DocumentAccessRequest,
    DocumentCategory,
)


@admin.register(DocumentCategory)
class DocumentCategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "order", "is_active")
    list_editable = ("order", "is_active")
    search_fields = ("name", "slug")
    prepopulated_fields = {"slug": ("name",)}


@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "kind",
        "category",
        "status",
        "date",
        "featured",
        "is_confidential",
        "open_count",
        "downloads",
    )
    list_filter = ("status", "kind", "category", "featured", "is_confidential", "date")
    search_fields = ("title", "summary", "reference", "slug")
    readonly_fields = (
        "slug",
        "open_count",
        "downloads",
        "file_size",
        "mime_type",
        "original_filename",
        "submitted_at",
        "published_at",
        "archived_at",
        "created_at",
        "updated_at",
    )


@admin.register(DocumentAccessRequest)
class DocumentAccessRequestAdmin(admin.ModelAdmin):
    list_display = ("full_name", "email", "document", "status", "created_at", "reviewed_at")
    list_filter = ("status", "created_at")
    search_fields = ("full_name", "email", "organization", "document__title")
    readonly_fields = ("created_at", "updated_at")


@admin.register(DocumentAccessGrant)
class DocumentAccessGrantAdmin(admin.ModelAdmin):
    list_display = ("recipient_name", "document", "expires_at", "open_count", "max_opens", "revoked_at")
    list_filter = ("expires_at", "revoked_at")
    search_fields = ("recipient_name", "recipient_email", "document__title", "public_id")
    readonly_fields = ("public_id", "token_hash", "created_at", "updated_at")


@admin.register(DocumentAccessOTP)
class DocumentAccessOTPAdmin(admin.ModelAdmin):
    list_display = ("grant", "created_at", "expires_at", "attempts", "used_at", "invalidated_at")
    readonly_fields = ("code_hash", "created_at")
