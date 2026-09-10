from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("django-admin/", admin.site.urls),

    path("backoffice/", include("apps.backoffice.urls")),

    path("api/v1/", include("apps.core.urls")),
    path("api/v1/news/", include("apps.news.api_urls")),
    path("api/v1/albums/", include("apps.gallery.api_urls")),
    path("api/v1/documents/", include("apps.documents.api_urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
