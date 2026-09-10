from django.urls import path

from . import backoffice_views

app_name = "news_backoffice"

urlpatterns = [
    path("", backoffice_views.news_list_view, name="list"),
    path("new/", backoffice_views.news_create_view, name="create"),
    path("<int:pk>/edit/", backoffice_views.news_edit_view, name="edit"),
    path(
        "<int:pk>/preview/",
        backoffice_views.news_preview_view,
        name="preview",
    ),
    path(
        "<int:pk>/transition/<str:action>/",
        backoffice_views.news_transition_view,
        name="transition",
    ),
]
