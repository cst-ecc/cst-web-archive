from django.urls import path

from .api import (
    PublicDocumentDetailView,
    PublicDocumentListView,
    public_document_download_view,
)

app_name = "documents_api"

urlpatterns = [
    path("", PublicDocumentListView.as_view(), name="list"),
    path("<slug:slug>/", PublicDocumentDetailView.as_view(), name="detail"),
    path("<slug:slug>/download/", public_document_download_view, name="download"),
]
