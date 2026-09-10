from django.urls import path

from .api import PublicNewsDetailView, PublicNewsListView

app_name = "news_api"

urlpatterns = [
    path("", PublicNewsListView.as_view(), name="list"),
    path("<slug:slug>/", PublicNewsDetailView.as_view(), name="detail"),
]
