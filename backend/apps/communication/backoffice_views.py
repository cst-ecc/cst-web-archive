from django.contrib import messages
from django.core.exceptions import PermissionDenied
from django.core.mail import send_mail
from django.core.paginator import Paginator
from django.db.models import Q
from django.shortcuts import get_object_or_404, redirect, render
from django.utils import timezone
from django.views.decorators.cache import never_cache
from django.views.decorators.http import require_http_methods

from apps.audit.models import AuditAction
from apps.audit.services import audit_log
from apps.backoffice.access import backoffice_2fa_required

from .forms import ContactReplyForm, ContactStatusForm
from .models import Contact, ContactCategory, ContactReply, ContactStatus


@never_cache
@backoffice_2fa_required
def contact_list_view(request):
    if not request.user.has_perm("communication.view_contact"):
        raise PermissionDenied

    qs = Contact.objects.select_related("last_managed_by").all()
    query = (request.GET.get("q") or "").strip()
    status = (request.GET.get("status") or "").strip()
    category = (request.GET.get("category") or "").strip()

    if query:
        qs = qs.filter(
            Q(name__icontains=query)
            | Q(first_names__icontains=query)
            | Q(email__icontains=query)
            | Q(subject__icontains=query)
        )
    if status:
        qs = qs.filter(status=status)
    if category:
        qs = qs.filter(category=category)

    page_obj = Paginator(qs, 20).get_page(request.GET.get("page"))
    return render(
        request,
        "backoffice/communication/contact_list.html",
        {
            "page_obj": page_obj,
            "query": query,
            "status_filter": status,
            "category_filter": category,
            "status_choices": ContactStatus.choices,
            "category_choices": ContactCategory.choices,
            "new_count": Contact.objects.filter(status=ContactStatus.NEW).count(),
        },
    )


@never_cache
@backoffice_2fa_required
@require_http_methods(["GET", "POST"])
def contact_detail_view(request, pk: int):
    if not request.user.has_perm("communication.view_contact"):
        raise PermissionDenied

    contact = get_object_or_404(Contact.objects.prefetch_related("replies__author"), pk=pk)
    can_manage = request.user.has_perm("communication.manage_contact")
    can_reply = request.user.has_perm("communication.reply_contact")

    if request.method == "GET" and contact.status == ContactStatus.NEW and can_manage:
        contact.status = ContactStatus.READ
        contact.read_at = timezone.now()
        contact.last_managed_by = request.user
        contact.save(update_fields=["status", "read_at", "last_managed_by", "updated_at"])

    status_form = ContactStatusForm(instance=contact, prefix="status")
    reply_form = ContactReplyForm(
        initial={"subject": f"Re: {contact.subject}"},
        prefix="reply",
    )

    if request.method == "POST":
        action = request.POST.get("action")
        if action == "status":
            if not can_manage:
                raise PermissionDenied
            status_form = ContactStatusForm(request.POST, instance=contact, prefix="status")
            if status_form.is_valid():
                previous = contact.status
                updated = status_form.save(commit=False)
                updated.last_managed_by = request.user
                if updated.status == ContactStatus.READ and not updated.read_at:
                    updated.read_at = timezone.now()
                if updated.status in {ContactStatus.PROCESSED, ContactStatus.CLOSED}:
                    updated.processed_at = updated.processed_at or timezone.now()
                updated.save()
                audit_log(
                    action=AuditAction.CONTACT_STATUS_CHANGED,
                    actor=request.user,
                    request=request,
                    target=updated,
                    description="Statut d'une demande de contact modifié.",
                    metadata={"from": previous, "to": updated.status},
                )
                messages.success(request, "Le statut de la demande a été mis à jour.")
                return redirect("backoffice:contact_detail", pk=contact.pk)
        elif action == "reply":
            if not can_reply:
                raise PermissionDenied
            reply_form = ContactReplyForm(request.POST, prefix="reply")
            if reply_form.is_valid():
                reply = reply_form.save(commit=False)
                reply.contact = contact
                reply.author = request.user
                reply.save()

                try:
                    send_mail(
                        subject=reply.subject,
                        message=reply.message,
                        from_email=None,
                        recipient_list=[contact.email],
                        fail_silently=False,
                    )
                except Exception as exc:
                    reply.delivery_status = ContactReply.DeliveryStatus.FAILED
                    reply.error_message = str(exc)[:500]
                    reply.save(update_fields=["delivery_status", "error_message", "updated_at"])
                    messages.warning(
                        request,
                        "La réponse a été enregistrée, mais l'e-mail n'a pas pu être envoyé.",
                    )
                else:
                    reply.delivery_status = ContactReply.DeliveryStatus.SENT
                    reply.sent_at = timezone.now()
                    reply.save(update_fields=["delivery_status", "sent_at", "updated_at"])
                    if contact.status in {ContactStatus.NEW, ContactStatus.READ}:
                        contact.status = ContactStatus.IN_PROGRESS
                        contact.last_managed_by = request.user
                        contact.save(update_fields=["status", "last_managed_by", "updated_at"])
                    messages.success(request, "La réponse a été envoyée et ajoutée à l'historique.")

                audit_log(
                    action=AuditAction.CONTACT_REPLIED,
                    actor=request.user,
                    request=request,
                    target=contact,
                    description="Réponse enregistrée pour une demande de contact.",
                    metadata={"delivery_status": reply.delivery_status},
                )
                return redirect("backoffice:contact_detail", pk=contact.pk)

    return render(
        request,
        "backoffice/communication/contact_detail.html",
        {
            "contact": contact,
            "status_form": status_form,
            "reply_form": reply_form,
            "can_manage": can_manage,
            "can_reply": can_reply,
        },
    )
