import logging

from django.db import transaction
from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from django.http import HttpResponse
from django.shortcuts import get_object_or_404, redirect
from django.utils import timezone
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import ContactCategory, Conversation, ConversationStatus, ChatMessage, ChatSender, NewsletterSubscriber, SubscriberStatus
from .rate_limit import client_ip, enforce_rate_limit
from .serializers import ContactCategorySerializer, ContactRequestSerializer, ConversationSerializer, NewsletterSubscribeSerializer
from .tasks import send_contact_acknowledgement_task, send_newsletter_confirmation_task

logger = logging.getLogger(__name__)

def _safe_delay(task, *args):
    try:
        task.delay(*args)
    except Exception:
        logger.exception("Impossible de planifier une tâche de communication; la donnée métier reste enregistrée.")


class PublicCommunicationAPIView(APIView):
    """
    API publique volontairement indépendante de la session back-office.

    DRF applique SessionAuthentication par défaut et, lorsqu'un visiteur possède
    déjà une session Django (par exemple un membre connecté au back-office sur le
    même domaine), cette authentification impose un jeton CSRF sur les POST.
    Ces endpoints publics utilisent leurs propres contrôles (rate limiting, token
    de conversation, validation métier) et ne doivent donc pas authentifier la
    session Django du navigateur.
    """

    authentication_classes = []
    permission_classes = [AllowAny]


class ContactCategoriesView(PublicCommunicationAPIView):
    def get(self, request):
        data = ContactCategorySerializer(ContactCategory.objects.filter(is_active=True), many=True).data
        return Response(data)


class ContactCreateView(PublicCommunicationAPIView):
    def post(self, request):
        ip = client_ip(request)
        enforce_rate_limit(key=f"contact:{ip}", limit=5, window=600)
        serializer = ContactRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        contact = serializer.save()
        transaction.on_commit(lambda: _safe_delay(send_contact_acknowledgement_task, contact.pk))
        return Response({"id": contact.pk, "message": "Votre message a bien été reçu."}, status=201)


class ConversationCreateView(PublicCommunicationAPIView):
    def post(self, request):
        ip = client_ip(request)
        enforce_rate_limit(key=f"chat-create:{ip}", limit=8, window=600)
        name = str(request.data.get("name", "")).strip()[:160]
        email = str(request.data.get("email", "")).strip()[:254]
        if email:
            try:
                validate_email(email)
            except ValidationError:
                return Response({"email": ["Adresse e-mail invalide."]}, status=400)
        content = str(request.data.get("message", "")).strip()
        if len(content) < 2 or len(content) > 3000:
            return Response({"message": ["Message invalide."]}, status=400)
        conversation = Conversation.objects.create(visitor_name=name, visitor_email=email)
        ChatMessage.objects.create(conversation=conversation, sender_type=ChatSender.VISITOR, content=content)
        return Response(ConversationSerializer(conversation).data, status=201)


class ConversationDetailView(PublicCommunicationAPIView):
    def _get(self, public_id, token):
        return get_object_or_404(Conversation.objects.prefetch_related("messages"), public_id=public_id, visitor_token=token)
    def get(self, request, public_id):
        token = request.headers.get("X-Conversation-Token", "")
        return Response(ConversationSerializer(self._get(public_id, token)).data)
    def post(self, request, public_id):
        ip = client_ip(request)
        enforce_rate_limit(key=f"chat-message:{ip}", limit=30, window=300)
        token = request.headers.get("X-Conversation-Token", "")
        conversation = self._get(public_id, token)
        if conversation.status in {ConversationStatus.CLOSED, ConversationStatus.ARCHIVED}:
            return Response({"detail": "Cette conversation est fermée."}, status=409)
        content = str(request.data.get("message", "")).strip()
        if len(content) < 1 or len(content) > 3000:
            return Response({"message": ["Message invalide."]}, status=400)
        msg = ChatMessage.objects.create(conversation=conversation, sender_type=ChatSender.VISITOR, content=content)
        conversation.last_activity_at = timezone.now()
        conversation.save(update_fields=["last_activity_at", "updated_at"])
        from .realtime import broadcast_message
        broadcast_message(conversation, msg)
        return Response({"id": msg.pk, "created_at": msg.created_at}, status=201)


class NewsletterSubscribeView(PublicCommunicationAPIView):
    def post(self, request):
        ip = client_ip(request)
        enforce_rate_limit(key=f"newsletter:{ip}", limit=6, window=3600)
        serializer = NewsletterSubscribeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"].strip().lower()
        name = serializer.validated_data.get("name", "").strip()
        subscriber, created = NewsletterSubscriber.objects.get_or_create(email=email, defaults={"name": name})
        if subscriber.status == SubscriberStatus.ACTIVE:
            return Response({"message": "Cette adresse est déjà abonnée."}, status=200)
        if subscriber.status == SubscriberStatus.BLOCKED:
            return Response({"message": "Cette adresse ne peut pas être inscrite."}, status=400)
        subscriber.name = name or subscriber.name
        subscriber.status = SubscriberStatus.PENDING
        subscriber.unsubscribed_at = None
        subscriber.save(update_fields=["name", "status", "unsubscribed_at", "updated_at"])
        transaction.on_commit(lambda: _safe_delay(send_newsletter_confirmation_task, subscriber.pk))
        return Response({"message": "Vérifiez votre boîte e-mail pour confirmer votre abonnement."}, status=201 if created else 200)


def newsletter_confirm_view(request, token):
    subscriber = get_object_or_404(NewsletterSubscriber, confirmation_token=token)
    if subscriber.status != SubscriberStatus.BLOCKED:
        subscriber.status = SubscriberStatus.ACTIVE
        subscriber.confirmed_at = timezone.now()
        subscriber.unsubscribed_at = None
        subscriber.save(update_fields=["status", "confirmed_at", "unsubscribed_at", "updated_at"])
    return redirect("/contact?newsletter=confirmed")


def newsletter_unsubscribe_view(request, token):
    subscriber = get_object_or_404(NewsletterSubscriber, unsubscribe_token=token)
    subscriber.status = SubscriberStatus.UNSUBSCRIBED
    subscriber.unsubscribed_at = timezone.now()
    subscriber.save(update_fields=["status", "unsubscribed_at", "updated_at"])
    return HttpResponse("Vous êtes désabonné(e) de la newsletter CST/CSMo.", content_type="text/plain; charset=utf-8")
