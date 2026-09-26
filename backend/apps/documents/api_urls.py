from django.urls import path

from .api import (
    DocumentAccessRequestView,
    PublicDocumentDetailView,
    PublicDocumentListView,
    PublicDocumentOpenView,
    SecureDocumentAccessInfoView,
    SecureDocumentOTPIssueView,
    SecureDocumentOTPVerifyView,
    public_document_content_view,
    public_document_download_view,
    secure_document_content_view,
)

app_name = "documents_api"

urlpatterns = [
    path("", PublicDocumentListView.as_view(), name="list"),
    path("access/<str:token>/", SecureDocumentAccessInfoView.as_view(), name="secure_access_info"),
    path("access/<str:token>/otp/", SecureDocumentOTPIssueView.as_view(), name="secure_access_otp"),
    path("access/<str:token>/verify/", SecureDocumentOTPVerifyView.as_view(), name="secure_access_verify"),
    path("access/<str:token>/content/", secure_document_content_view, name="secure_content"),
    path("<slug:slug>/", PublicDocumentDetailView.as_view(), name="detail"),
    path("<slug:slug>/view/", PublicDocumentOpenView.as_view(), name="view"),
    path("<slug:slug>/content/", public_document_content_view, name="content"),
    path("<slug:slug>/request-access/", DocumentAccessRequestView.as_view(), name="request_access"),
    path("<slug:slug>/download/", public_document_download_view, name="download"),
]
