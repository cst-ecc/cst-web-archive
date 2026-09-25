from django.contrib import admin
from .models import ContactCategory, ContactRequest, Conversation, ChatMessage, NewsletterSubscriber, NewsletterCampaign

admin.site.register([ContactCategory, ContactRequest, Conversation, ChatMessage, NewsletterSubscriber, NewsletterCampaign])
