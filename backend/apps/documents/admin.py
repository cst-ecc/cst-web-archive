from django.contrib import admin

from .models import Document, DocumentCategory


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
        "downloads",
    )
    list_filter = ("status", "kind", "category", "featured", "date")
    search_fields = ("title", "summary", "reference", "slug")
    readonly_fields = (
        "slug",
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
