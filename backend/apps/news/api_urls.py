from django.urls import path

from .api import (
    PublicHomeSpecialNewsView,
    PublicNewsDetailView,
    PublicNewsListView,
)

app_name = "news_api"

urlpatterns = [
    path("", PublicNewsListView.as_view(), name="list"),
    # Toujours avant <slug:slug>/ pour éviter que « home-special » soit capturé
    # comme le slug d'une actualité.
    path(
        "home-special/",
        PublicHomeSpecialNewsView.as_view(),
        name="home-special",
    ),
    path("<slug:slug>/", PublicNewsDetailView.as_view(), name="detail"),
]
