from django.urls import path
from . import backoffice_views as views

urlpatterns = [
    path("contacts/", views.contact_list_view, name="communication_contacts"),
    path("contacts/<int:pk>/", views.contact_detail_view, name="communication_contact_detail"),
    path("contacts/<int:pk>/reply/", views.contact_reply_view, name="communication_contact_reply"),
    path("messagerie/", views.conversation_list_view, name="communication_conversations"),
    path("messagerie/<int:pk>/", views.conversation_detail_view, name="communication_conversation_detail"),
    path("messagerie/<int:pk>/take/", views.conversation_take_view, name="communication_conversation_take"),
    path("messagerie/<int:pk>/close/", views.conversation_close_view, name="communication_conversation_close"),
    path("newsletter/abonnes/", views.subscriber_list_view, name="communication_subscribers"),
    path("newsletter/abonnes/<int:pk>/toggle/", views.subscriber_toggle_view, name="communication_subscriber_toggle"),
    path("newsletter/campagnes/", views.campaign_list_view, name="communication_campaigns"),
    path("newsletter/campagnes/new/", views.campaign_create_view, name="communication_campaign_create"),
    path("newsletter/campagnes/<int:pk>/edit/", views.campaign_edit_view, name="communication_campaign_edit"),
    path("newsletter/campagnes/<int:pk>/test/", views.campaign_test_view, name="communication_campaign_test"),
    path("newsletter/campagnes/<int:pk>/send/", views.campaign_send_view, name="communication_campaign_send"),
]
