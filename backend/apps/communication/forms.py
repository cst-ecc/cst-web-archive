from django import forms

from .models import Contact, ContactReply


class ContactStatusForm(forms.ModelForm):
    class Meta:
        model = Contact
        fields = ("status",)


class ContactReplyForm(forms.ModelForm):
    class Meta:
        model = ContactReply
        fields = ("subject", "message")
        widgets = {
            "message": forms.Textarea(attrs={"rows": 8}),
        }

    def clean_subject(self):
        value = self.cleaned_data["subject"].replace("\x00", "").strip()
        if len(value) < 3:
            raise forms.ValidationError("Veuillez préciser l’objet de la réponse.")
        return value

    def clean_message(self):
        value = self.cleaned_data["message"].replace("\x00", "").strip()
        if len(value) < 10:
            raise forms.ValidationError("La réponse doit contenir au moins 10 caractères.")
        return value
