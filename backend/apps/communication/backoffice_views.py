from django.contrib import messages
from django.core.mail import send_mail
from django.core.paginator import Paginator
from django.db.models import Count, Q
from django.shortcuts import get_object_or_404, redirect, render
from django.utils import timezone
from django.views.decorators.http import require_http_methods, require_POST

from apps.audit.models import AuditAction
from apps.audit.services import audit_log
from apps.backoffice.access import backoffice_2fa_required

from .forms import ContactRequestBackofficeForm, NewsletterCampaignForm
from .models import (
    ContactRequest, ContactStatus, Conversation, ConversationStatus, ChatMessage, ChatSender,
    NewsletterCampaign, NewsletterSubscriber, SubscriberStatus,
)
from .realtime import broadcast_message, broadcast_read_receipt
from .tasks import send_newsletter_campaign_task


def _require_perm(request, perm):
    if request.user.is_superuser or request.user.has_perm(perm):
        return None
    messages.error(request, "Vous n’avez pas l’autorisation nécessaire.")
    return redirect("backoffice:dashboard")


@backoffice_2fa_required
def contact_list_view(request):
    denied = _require_perm(request, "communication.view_contactrequest")
    if denied: return denied
    qs = ContactRequest.objects.select_related("category", "assigned_to")
    q = request.GET.get("q", "").strip(); status = request.GET.get("status", "").strip()
    if q:
        qs = qs.filter(Q(last_name__icontains=q) | Q(first_name__icontains=q) | Q(email__icontains=q) | Q(subject__icontains=q) | Q(message__icontains=q))
    if status:
        qs = qs.filter(status=status)
    page_obj = Paginator(qs, 25).get_page(request.GET.get("page"))
    return render(request, "backoffice/communication/contact_list.html", {"page_obj": page_obj, "query": q, "status_filter": status, "status_choices": ContactStatus.choices})


@backoffice_2fa_required
@require_http_methods(["GET", "POST"])
def contact_detail_view(request, pk):
    denied = _require_perm(request, "communication.view_contactrequest")
    if denied: return denied
    contact = get_object_or_404(ContactRequest.objects.select_related("category", "assigned_to"), pk=pk)
    if contact.status == ContactStatus.NEW:
        contact.status = ContactStatus.READ; contact.read_at = timezone.now(); contact.save(update_fields=["status", "read_at", "updated_at"])
        audit_log(action=AuditAction.CONTACT_READ, actor=request.user, request=request, target=contact, description="Demande de contact consultée.")
    if request.method == "POST":
        denied = _require_perm(request, "communication.manage_contactrequest")
        if denied: return denied
        old_status = contact.status
        form = ContactRequestBackofficeForm(request.POST, instance=contact)
        if form.is_valid():
            obj = form.save(commit=False)
            if obj.status in {ContactStatus.CLOSED, ContactStatus.RESOLVED} and not obj.closed_at:
                obj.closed_at = timezone.now()
            obj.save()
            audit_log(action=AuditAction.CONTACT_STATUS_CHANGED, actor=request.user, request=request, target=obj, description=f"Statut contact : {old_status} → {obj.status}.")
            messages.success(request, "La demande a été mise à jour.")
            return redirect("backoffice:communication_contact_detail", pk=obj.pk)
    else:
        form = ContactRequestBackofficeForm(instance=contact)
    return render(request, "backoffice/communication/contact_detail.html", {"contact": contact, "form": form})


@backoffice_2fa_required
@require_POST
def contact_reply_view(request, pk):
    denied = _require_perm(request, "communication.reply_contactrequest")
    if denied: return denied
    contact = get_object_or_404(ContactRequest, pk=pk)
    body = request.POST.get("reply", "").strip()
    if not body:
        messages.error(request, "La réponse ne peut pas être vide.")
        return redirect("backoffice:communication_contact_detail", pk=pk)
    try:
        send_mail(f"Re: {contact.subject}", body, None, [contact.email], fail_silently=False)
        contact.status = ContactStatus.IN_PROGRESS if contact.status in {ContactStatus.NEW, ContactStatus.READ} else contact.status
        contact.save(update_fields=["status", "updated_at"])
        audit_log(action=AuditAction.CONTACT_REPLIED, actor=request.user, request=request, target=contact, description="Réponse envoyée par e-mail.")
        messages.success(request, "Réponse envoyée.")
    except Exception:
        messages.error(request, "L’e-mail n’a pas pu être envoyé. La demande reste enregistrée.")
    return redirect("backoffice:communication_contact_detail", pk=pk)


@backoffice_2fa_required
def conversation_list_view(request):
    denied = _require_perm(request, "communication.view_conversation")
    if denied: return denied
    qs = (
        Conversation.objects.select_related("assigned_to")
        .annotate(
            unread_count=Count(
                "messages",
                filter=Q(messages__sender_type=ChatSender.VISITOR, messages__is_read=False),
            )
        )
    )
    status = request.GET.get("status", "").strip()
    if status:
        qs = qs.filter(status=status)
    return render(
        request,
        "backoffice/communication/conversation_list.html",
        {
            "page_obj": Paginator(qs, 30).get_page(request.GET.get("page")),
            "status_choices": ConversationStatus.choices,
            "status_filter": status,
        },
    )


@backoffice_2fa_required
@require_http_methods(["GET", "POST"])
def conversation_detail_view(request, pk):
    denied = _require_perm(request, "communication.view_conversation")
    if denied: return denied
    conversation = get_object_or_404(
        Conversation.objects.select_related("assigned_to").prefetch_related("messages"),
        pk=pk,
    )
    unread_ids = list(
        ChatMessage.objects.filter(
            conversation=conversation,
            sender_type=ChatSender.VISITOR,
            is_read=False,
        ).values_list("pk", flat=True)
    )
    if unread_ids:
        ChatMessage.objects.filter(pk__in=unread_ids).update(is_read=True)
        broadcast_read_receipt(
            conversation,
            reader_type=ChatSender.MEMBER,
            message_ids=unread_ids,
        )
    if request.method == "POST":
        denied = _require_perm(request, "communication.reply_conversation")
        if denied: return denied
        content = request.POST.get("message", "").strip()
        if content and len(content) <= 3000 and conversation.status not in {ConversationStatus.CLOSED, ConversationStatus.ARCHIVED}:
            msg = ChatMessage.objects.create(conversation=conversation, sender_type=ChatSender.MEMBER, sender_user=request.user, content=content, is_read=False)
            if conversation.status == ConversationStatus.WAITING:
                conversation.status = ConversationStatus.ACTIVE
            if conversation.assigned_to_id is None:
                conversation.assigned_to = request.user
            conversation.last_activity_at = timezone.now(); conversation.save(update_fields=["status", "assigned_to", "last_activity_at", "updated_at"])
            broadcast_message(conversation, msg)
            audit_log(action=AuditAction.CHAT_REPLIED, actor=request.user, request=request, target=conversation, description="Réponse envoyée dans la conversation.")
            return redirect("backoffice:communication_conversation_detail", pk=pk)
    return render(request, "backoffice/communication/conversation_detail.html", {"conversation": conversation})


@backoffice_2fa_required
@require_POST
def conversation_take_view(request, pk):
    denied = _require_perm(request, "communication.reply_conversation")
    if denied: return denied
    conversation = get_object_or_404(Conversation, pk=pk)
    conversation.assigned_to = request.user; conversation.status = ConversationStatus.ACTIVE
    conversation.save(update_fields=["assigned_to", "status", "updated_at"])
    audit_log(action=AuditAction.CHAT_ASSIGNED, actor=request.user, request=request, target=conversation, description="Conversation prise en charge.")
    return redirect("backoffice:communication_conversation_detail", pk=pk)


@backoffice_2fa_required
@require_POST
def conversation_close_view(request, pk):
    denied = _require_perm(request, "communication.manage_conversation")
    if denied: return denied
    conversation = get_object_or_404(Conversation, pk=pk)
    conversation.status = ConversationStatus.CLOSED; conversation.closed_at = timezone.now(); conversation.save(update_fields=["status", "closed_at", "updated_at"])
    audit_log(action=AuditAction.CHAT_CLOSED, actor=request.user, request=request, target=conversation, description="Conversation fermée.")
    return redirect("backoffice:communication_conversation_detail", pk=pk)


@backoffice_2fa_required
def subscriber_list_view(request):
    denied = _require_perm(request, "communication.view_newslettersubscriber")
    if denied: return denied
    qs = NewsletterSubscriber.objects.all(); q = request.GET.get("q", "").strip(); status = request.GET.get("status", "").strip()
    if q: qs = qs.filter(Q(email__icontains=q) | Q(name__icontains=q))
    if status: qs = qs.filter(status=status)
    return render(request, "backoffice/communication/subscriber_list.html", {"page_obj": Paginator(qs, 40).get_page(request.GET.get("page")), "query": q, "status_filter": status, "status_choices": SubscriberStatus.choices})


@backoffice_2fa_required
@require_POST
def subscriber_toggle_view(request, pk):
    denied = _require_perm(request, "communication.manage_newslettersubscriber")
    if denied: return denied
    subscriber = get_object_or_404(NewsletterSubscriber, pk=pk)
    subscriber.status = SubscriberStatus.BLOCKED if subscriber.status != SubscriberStatus.BLOCKED else SubscriberStatus.UNSUBSCRIBED
    subscriber.save(update_fields=["status", "updated_at"])
    audit_log(action=AuditAction.NEWSLETTER_SUBSCRIBER_CHANGED, actor=request.user, request=request, target=subscriber, description=f"Statut abonné : {subscriber.status}.")
    return redirect("backoffice:communication_subscribers")


@backoffice_2fa_required
def campaign_list_view(request):
    denied = _require_perm(request, "communication.view_newslettercampaign")
    if denied: return denied
    return render(request, "backoffice/communication/campaign_list.html", {"campaigns": NewsletterCampaign.objects.select_related("created_by")[:100]})


@backoffice_2fa_required
@require_http_methods(["GET", "POST"])
def campaign_create_view(request):
    denied = _require_perm(request, "communication.add_newslettercampaign")
    if denied: return denied
    form = NewsletterCampaignForm(request.POST or None)
    if request.method == "POST" and form.is_valid():
        campaign = form.save(commit=False); campaign.created_by = request.user; campaign.save()
        audit_log(action=AuditAction.NEWSLETTER_CAMPAIGN_CREATED, actor=request.user, request=request, target=campaign, description="Campagne newsletter créée.")
        messages.success(request, "Campagne enregistrée en brouillon.")
        return redirect("backoffice:communication_campaigns")
    return render(request, "backoffice/communication/campaign_form.html", {"form": form})


@backoffice_2fa_required
@require_http_methods(["GET", "POST"])
def campaign_edit_view(request, pk):
    denied = _require_perm(request, "communication.change_newslettercampaign")
    if denied: return denied
    campaign = get_object_or_404(NewsletterCampaign, pk=pk)
    if campaign.status != "brouillon":
        messages.error(request, "Seules les campagnes en brouillon peuvent être modifiées.")
        return redirect("backoffice:communication_campaigns")
    form = NewsletterCampaignForm(request.POST or None, instance=campaign)
    if request.method == "POST" and form.is_valid():
        form.save()
        messages.success(request, "Campagne mise à jour.")
        return redirect("backoffice:communication_campaigns")
    return render(request, "backoffice/communication/campaign_form.html", {"form": form, "campaign": campaign})


@backoffice_2fa_required
@require_POST
def campaign_test_view(request, pk):
    denied = _require_perm(request, "communication.send_newslettercampaign")
    if denied: return denied
    campaign = get_object_or_404(NewsletterCampaign, pk=pk)
    email = request.POST.get("email", "").strip()
    if not email: email = request.user.email
    try:
        send_mail(f"[TEST] {campaign.subject}", campaign.content, None, [email], fail_silently=False)
        messages.success(request, f"E-mail de test envoyé à {email}.")
    except Exception:
        messages.error(request, "Échec de l’envoi de test.")
    return redirect("backoffice:communication_campaigns")


@backoffice_2fa_required
@require_POST
def campaign_send_view(request, pk):
    denied = _require_perm(request, "communication.send_newslettercampaign")
    if denied: return denied
    campaign = get_object_or_404(NewsletterCampaign, pk=pk)
    send_newsletter_campaign_task.delay(campaign.pk)
    audit_log(action=AuditAction.NEWSLETTER_CAMPAIGN_SENT, actor=request.user, request=request, target=campaign, description="Envoi de campagne déclenché.")
    messages.success(request, "L’envoi asynchrone de la campagne a été lancé.")
    return redirect("backoffice:communication_campaigns")
