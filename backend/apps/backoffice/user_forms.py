from django import forms
from django.contrib.auth.forms import SetPasswordForm
from django.contrib.auth.models import Group

from apps.accounts.models import User
from apps.accounts.roles import GROUP_EDITOR, GROUP_MANAGER


ROLE_CHOICES = (
    (GROUP_MANAGER, "Manager"),
    (GROUP_EDITOR, "Éditeur"),
)


class BackofficeUserCreateForm(forms.ModelForm):
    role = forms.ChoiceField(label="Rôle", choices=ROLE_CHOICES)

    class Meta:
        model = User
        fields = ("email", "first_name", "last_name", "is_active")
        labels = {
            "email": "Adresse e-mail",
            "first_name": "Prénom(s)",
            "last_name": "Nom",
            "is_active": "Compte actif",
        }

    def clean_email(self):
        return self.cleaned_data["email"].strip().lower()

    def save(self, commit=True):
        user = super().save(commit=False)
        user.email = self.cleaned_data["email"]
        user.username = None

        # Le mot de passe est choisi par le destinataire via le lien d'invitation.
        user.set_unusable_password()

        if commit:
            user.save()
            self._save_role(user)

        return user

    def _save_role(self, user):
        role_name = self.cleaned_data["role"]
        role_group = Group.objects.get(name=role_name)
        user.groups.set([role_group])


class BackofficeUserUpdateForm(forms.ModelForm):
    role = forms.ChoiceField(label="Rôle", choices=ROLE_CHOICES)

    class Meta:
        model = User
        fields = ("email", "first_name", "last_name", "is_active")
        labels = {
            "email": "Adresse e-mail",
            "first_name": "Prénom(s)",
            "last_name": "Nom",
            "is_active": "Compte actif",
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        if self.instance.pk:
            role = (
                self.instance.groups.filter(
                    name__in=[GROUP_MANAGER, GROUP_EDITOR]
                )
                .values_list("name", flat=True)
                .first()
            )
            if role:
                self.fields["role"].initial = role

    def clean_email(self):
        return self.cleaned_data["email"].strip().lower()

    def save(self, commit=True):
        user = super().save(commit=commit)
        if commit:
            role_group = Group.objects.get(name=self.cleaned_data["role"])
            user.groups.set([role_group])
        return user


class BackofficeSetPasswordForm(SetPasswordForm):
    new_password1 = forms.CharField(
        label="Nouveau mot de passe",
        strip=False,
        widget=forms.PasswordInput(
            attrs={
                "autocomplete": "new-password",
                "autofocus": True,
            }
        ),
    )
    new_password2 = forms.CharField(
        label="Confirmez le mot de passe",
        strip=False,
        widget=forms.PasswordInput(
            attrs={"autocomplete": "new-password"}
        ),
    )
