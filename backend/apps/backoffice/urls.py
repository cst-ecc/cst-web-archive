from django.urls import path

from apps.documents import backoffice_views as document_views
from apps.gallery import backoffice_views as gallery_views
from apps.news import backoffice_views as news_views

from . import user_views, views

app_name = "backoffice"

urlpatterns = [
    path("", views.dashboard_view, name="dashboard"),

    path("login/", views.login_view, name="login"),
    path("login/otp/", views.otp_view, name="otp"),
    path("login/otp/resend/", views.resend_otp_view, name="otp_resend"),
    path("logout/", views.logout_view, name="logout"),

    path(
        "setup/<uidb64>/<token>/",
        user_views.account_setup_view,
        name="account_setup",
    ),

    path("users/", user_views.user_list_view, name="user_list"),
    path("users/new/", user_views.user_create_view, name="user_create"),
    path("users/<int:pk>/edit/", user_views.user_update_view, name="user_update"),
    path(
        "users/<int:pk>/toggle-active/",
        user_views.user_toggle_active_view,
        name="user_toggle_active",
    ),
    path(
        "users/<int:pk>/resend-invitation/",
        user_views.user_resend_invitation_view,
        name="user_resend_invitation",
    ),

    path("news/", news_views.news_list_view, name="news_list"),
    path("news/new/", news_views.news_create_view, name="news_create"),
    path("news/<int:pk>/edit/", news_views.news_edit_view, name="news_edit"),
    path("news/<int:pk>/preview/", news_views.news_preview_view, name="news_preview"),
    path(
        "news/<int:pk>/transition/<str:action>/",
        news_views.news_transition_view,
        name="news_transition",
    ),

    path("gallery/", gallery_views.album_list_view, name="gallery_list"),
    path("gallery/new/", gallery_views.album_create_view, name="gallery_create"),
    path("gallery/<int:pk>/edit/", gallery_views.album_edit_view, name="gallery_edit"),
    path(
        "gallery/<int:pk>/uploads/start/",
        gallery_views.album_upload_start_view,
        name="gallery_upload_start",
    ),
    path(
        "gallery/uploads/<str:upload_id>/chunk/",
        gallery_views.album_upload_chunk_view,
        name="gallery_upload_chunk",
    ),
    path(
        "gallery/uploads/<str:upload_id>/complete/",
        gallery_views.album_upload_complete_view,
        name="gallery_upload_complete",
    ),
    path(
        "gallery/uploads/<str:upload_id>/status/",
        gallery_views.album_upload_status_view,
        name="gallery_upload_status",
    ),
    path(
        "gallery/<int:pk>/preview/",
        gallery_views.album_preview_view,
        name="gallery_preview",
    ),
    path(
        "gallery/<int:pk>/transition/<str:action>/",
        gallery_views.album_transition_view,
        name="gallery_transition",
    ),
    path(
        "gallery/images/<int:pk>/delete/",
        gallery_views.gallery_image_delete_view,
        name="gallery_image_delete",
    ),

    path("documents/", document_views.document_list_view, name="document_list"),
    path("documents/new/", document_views.document_create_view, name="document_create"),
    path(
        "documents/<int:pk>/edit/",
        document_views.document_edit_view,
        name="document_edit",
    ),
    path(
        "documents/<int:pk>/preview/",
        document_views.document_preview_view,
        name="document_preview",
    ),
    path(
        "documents/<int:pk>/transition/<str:action>/",
        document_views.document_transition_view,
        name="document_transition",
    ),
]
