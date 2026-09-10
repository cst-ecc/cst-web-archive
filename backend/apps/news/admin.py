from django.contrib import admin

from .models import News, NewsCategory


@admin.register(NewsCategory)
class NewsCategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "is_active", "order")
    list_filter = ("is_active",)
    search_fields = ("name", "description")
    prepopulated_fields = {"slug": ("name",)}


@admin.register(News)
class NewsAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "status",
        "organ",
        "featured",
        "publication_date",
        "author",
        "updated_at",
    )
    list_filter = ("status", "organ", "featured", "category")
    search_fields = ("title", "excerpt", "content", "slug")
    readonly_fields = (
        "slug",
        "status",
        "submitted_at",
        "published_at",
        "archived_at",
        "created_at",
        "updated_at",
    )
