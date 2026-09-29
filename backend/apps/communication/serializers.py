import re

from rest_framework import serializers

from .models import Contact, ContactCategory


PHONE_RE = re.compile(r"^[0-9+().\-\s]{6,40}$")


def _clean_text(value: str) -> str:
    return value.replace("\x00", "").strip()


class ContactCreateSerializer(serializers.ModelSerializer):
    website = serializers.CharField(
        write_only=True,
        required=False,
        allow_blank=True,
        max_length=200,
    )

    class Meta:
        model = Contact
        fields = (
            "name",
            "first_names",
            "email",
            "phone",
            "subject",
            "category",
            "message",
            "website",
        )
        extra_kwargs = {
            "name": {"min_length": 2, "max_length": 160},
            "first_names": {"required": False, "allow_blank": True, "max_length": 160},
            "phone": {"required": False, "allow_blank": True, "max_length": 40},
            "subject": {"min_length": 3, "max_length": 220},
            "message": {"min_length": 10, "max_length": 5000},
            "category": {"required": False},
        }

    def validate_name(self, value):
        value = _clean_text(value)
        if len(value) < 2:
            raise serializers.ValidationError("Veuillez indiquer votre nom.")
        return value

    def validate_first_names(self, value):
        return _clean_text(value)

    def validate_email(self, value):
        return value.strip().lower()

    def validate_phone(self, value):
        value = _clean_text(value)
        if value and not PHONE_RE.fullmatch(value):
            raise serializers.ValidationError("Numéro de téléphone invalide.")
        return value

    def validate_subject(self, value):
        value = _clean_text(value)
        if len(value) < 3:
            raise serializers.ValidationError("Veuillez préciser l’objet de votre demande.")
        return value

    def validate_message(self, value):
        value = _clean_text(value)
        if len(value) < 10:
            raise serializers.ValidationError("Le message doit contenir au moins 10 caractères.")
        return value

    def validate_category(self, value):
        return value or ContactCategory.GENERAL

    def create(self, validated_data):
        validated_data.pop("website", None)
        return super().create(validated_data)
