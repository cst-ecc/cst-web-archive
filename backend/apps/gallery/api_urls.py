from django.urls import path

from .api import PublicGalleryAlbumDetailView, PublicGalleryAlbumListView

app_name = "gallery_api"

urlpatterns = [
    path("", PublicGalleryAlbumListView.as_view(), name="list"),
    path("<slug:slug>/", PublicGalleryAlbumDetailView.as_view(), name="detail"),
]
