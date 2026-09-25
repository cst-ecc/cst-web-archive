from rest_framework import serializers

from .models import ContactCategory, ContactRequest, Conversation, ChatMessage, NewsletterSubscriber


class ContactCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactCategory
        fields = ("slug", "name")


class ContactRequestSerializer(serializers.ModelSerializer):
    category = serializers.SlugRelatedField(slug_field="slug", queryset=ContactCategory.objects.filter(is_active=True), allow_null=True, required=False)
    website = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = ContactRequest
        fields = ("first_name", "last_name", "email", "phone", "subject", "category", "message", "consent_acknowledged", "website")

    def validate_website(self, value):
        if value:
            raise serializers.ValidationError("Envoi invalide.")
        return value

    def validate_consent_acknowledged(self, value):
        if not value:
            raise serializers.ValidationError("Cette confirmation est requise.")
        return value

    def validate_message(self, value):
        value = value.strip()
        if len(value) < 10:
            raise serializers.ValidationError("Le message doit contenir au moins 10 caractères.")
        return value

    def create(self, validated_data):
        validated_data.pop("website", None)
        return super().create(validated_data)


class ChatMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatMessage
        fields = ("id", "sender_type", "content", "is_read", "created_at")


class ConversationSerializer(serializers.ModelSerializer):
    messages = ChatMessageSerializer(many=True, read_only=True)
    class Meta:
        model = Conversation
        fields = ("public_id", "visitor_token", "visitor_name", "visitor_email", "status", "created_at", "last_activity_at", "messages")


class NewsletterSubscribeSerializer(serializers.Serializer):
    email = serializers.EmailField()
    name = serializers.CharField(max_length=160, allow_blank=True, required=False)
    website = serializers.CharField(write_only=True, required=False, allow_blank=True)

    def validate_website(self, value):
        if value:
            raise serializers.ValidationError("Envoi invalide.")
        return value
