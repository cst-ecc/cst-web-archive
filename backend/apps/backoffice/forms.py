from django import forms


class BackofficeLoginForm(forms.Form):
    email = forms.EmailField(
        label="Adresse e-mail",
        max_length=254,
        widget=forms.EmailInput(
            attrs={
                "autocomplete": "email",
                "autofocus": True,
                "placeholder": "nom@ecc.bj",
            }
        ),
    )
    password = forms.CharField(
        label="Mot de passe",
        strip=False,
        widget=forms.PasswordInput(
            attrs={
                "autocomplete": "current-password",
                "placeholder": "Votre mot de passe",
            }
        ),
    )


class OTPVerificationForm(forms.Form):
    code = forms.RegexField(
        label="Code de vérification",
        regex=r"^\d{6}$",
        min_length=6,
        max_length=6,
        error_messages={
            "invalid": "Saisissez le code à 6 chiffres reçu par e-mail.",
        },
        widget=forms.TextInput(
            attrs={
                "autocomplete": "one-time-code",
                "inputmode": "numeric",
                "pattern": "[0-9]{6}",
                "maxlength": "6",
                "autofocus": True,
                "placeholder": "000000",
            }
        ),
    )
