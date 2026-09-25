from django.urls import path
from . import api

app_name = "communication"
urlpatterns = [
    path("contact/categories/", api.ContactCategoriesView.as_view(), name="contact-categories"),
    path("contact/", api.ContactCreateView.as_view(), name="contact-create"),
    # Accept both canonical slash URLs and slashless variants. The aliases
    # prevent POST requests from failing under APPEND_SLASH=True while older
    # cached frontend bundles are still being replaced during deployment.
    path("chat/conversations", api.ConversationCreateView.as_view(), name="chat-create-no-slash"),
    path("chat/conversations/", api.ConversationCreateView.as_view(), name="chat-create"),
    path("chat/conversations/<uuid:public_id>", api.ConversationDetailView.as_view(), name="chat-detail-no-slash"),
    path("chat/conversations/<uuid:public_id>/", api.ConversationDetailView.as_view(), name="chat-detail"),
    path("newsletter/subscribe/", api.NewsletterSubscribeView.as_view(), name="newsletter-subscribe"),
    path("newsletter/confirm/<str:token>/", api.newsletter_confirm_view, name="newsletter-confirm"),
    path("newsletter/unsubscribe/<str:token>/", api.newsletter_unsubscribe_view, name="newsletter-unsubscribe"),
]
