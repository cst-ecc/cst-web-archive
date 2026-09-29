from django.urls import path

from . import api

app_name = "communication_api"

urlpatterns = [
    path("csrf/", api.contact_csrf, name="csrf"),
    path("", api.contact_create, name="create"),
]
