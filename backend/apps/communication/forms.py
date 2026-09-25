from django import forms

from .models import ContactRequest, NewsletterCampaign


class ContactRequestBackofficeForm(forms.ModelForm):
    class Meta:
        model = ContactRequest
        fields = ("status", "assigned_to", "internal_note")
        widgets = {"internal_note": forms.Textarea(attrs={"rows": 5})}


class NewsletterCampaignForm(forms.ModelForm):
    class Meta:
        model = NewsletterCampaign
        fields = ("title", "subject", "content")
        widgets = {"content": forms.Textarea(attrs={"rows": 14})}
