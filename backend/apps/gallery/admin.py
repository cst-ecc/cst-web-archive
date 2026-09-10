from django.contrib import admin

from .models import GalleryAlbum, GalleryImage


class GalleryImageInline(admin.TabularInline):
    model = GalleryImage
    extra = 0
    readonly_fields = (
        "width",
        "height",
        "file_size",
        "mime_type",
        "original_filename",
        "uploaded_by",
        "created_at",
    )


@admin.register(GalleryAlbum)
class GalleryAlbumAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "status",
        "date",
        "featured",
        "author",
        "updated_at",
    )
    list_filter = ("status", "featured", "date")
    search_fields = ("title", "description", "slug")
    readonly_fields = (
        "slug",
        "status",
        "submitted_at",
        "published_at",
        "archived_at",
        "created_at",
        "updated_at",
    )
    inlines = [GalleryImageInline]


@admin.register(GalleryImage)
class GalleryImageAdmin(admin.ModelAdmin):
    list_display = ("album", "title", "order", "width", "height", "file_size")
    list_filter = ("mime_type", "created_at")
    search_fields = ("album__title", "title", "alt", "original_filename")
    readonly_fields = (
        "width",
        "height",
        "file_size",
        "mime_type",
        "original_filename",
        "created_at",
        "updated_at",
    )
