from django.contrib import messages
from django.core.exceptions import PermissionDenied, ValidationError
from django.core.paginator import Paginator
from django.http import FileResponse
from django.db.models import Q
from django.shortcuts import get_object_or_404, redirect, render
from django.views.decorators.cache import never_cache
from django.views.decorators.http import require_http_methods, require_POST

from apps.audit.models import AuditAction, AuditLog
from apps.audit.services import audit_log
from apps.backoffice.access import backoffice_2fa_required
from apps.backoffice.workflow import ACTION_LABELS, available_actions
from apps.core.publication import PublicationStatus

from .forms import (
    DocumentAccessApprovalForm,
    DocumentAccessRefusalForm,
    DocumentForm,
)
from .models import (
    Document,
    DocumentAccessGrant,
    DocumentAccessRequest,
    DocumentAccessRequestStatus,
    DocumentKind,
)
from .access import (
    AccessGrantError,
    approve_access_request,
    mark_grant_link_sent,
    refuse_access_request,
    revoke_grant,
    rotate_grant_token,
)
from .emails import send_document_access_granted_email
from .services import (
    can_edit_document,
    can_preview_document,
    transition_document,
    visible_documents_queryset,
)


@never_cache
@backoffice_2fa_required
def document_list_view(request):
    if not request.user.has_perm("documents.view_document"):
        raise PermissionDenied

    qs = visible_documents_queryset(request.user).order_by(
        "-date",
        "display_order",
        "-created_at",
    )

    query = (request.GET.get("q") or "").strip()
    status = (request.GET.get("status") or "").strip()
    kind = (request.GET.get("kind") or "").strip()
    confidential = (request.GET.get("confidential") or "").strip()

    if query:
        qs = qs.filter(
            Q(title__icontains=query)
            | Q(summary__icontains=query)
            | Q(reference__icontains=query)
        )

    if status:
        qs = qs.filter(status=status)

    if kind:
        qs = qs.filter(kind=kind)

    if confidential == "yes":
        qs = qs.filter(is_confidential=True)
    elif confidential == "no":
        qs = qs.filter(is_confidential=False)

    page_obj = Paginator(qs, 20).get_page(request.GET.get("page"))

    return render(
        request,
        "backoffice/documents/list.html",
        {
            "page_obj": page_obj,
            "query": query,
            "status_filter": status,
            "kind_filter": kind,
            "confidential_filter": confidential,
            "pending_access_requests": (
                DocumentAccessRequest.objects.filter(
                    status=DocumentAccessRequestStatus.PENDING
                ).count()
                if request.user.has_perm("documents.publish_document")
                else 0
            ),
            "status_choices": PublicationStatus.choices,
            "kind_choices": DocumentKind.choices,
        },
    )


@never_cache
@require_http_methods(["GET", "POST"])
@backoffice_2fa_required
def document_create_view(request):
    if not request.user.has_perm("documents.add_document"):
        raise PermissionDenied

    if request.method == "POST":
        form = DocumentForm(request.POST, request.FILES, user=request.user)

        if form.is_valid():
            document = form.save(commit=False)
            document.author = request.user
            document.last_editor = request.user
            document.save()

            audit_log(
                action=AuditAction.CONTENT_CREATED,
                actor=request.user,
                request=request,
                target=document,
                description="Document créé.",
                metadata={
                    "status": document.status,
                    "is_confidential": document.is_confidential,
                },
            )

            messages.success(request, "Le document a été créé en brouillon.")
            return redirect("backoffice:document_edit", pk=document.pk)
    else:
        form = DocumentForm(user=request.user)

    return render(
        request,
        "backoffice/documents/form.html",
        {
            "form": form,
            "page_title": "Nouveau document",
            "submit_label": "Créer le brouillon",
        },
    )


@never_cache
@require_http_methods(["GET", "POST"])
@backoffice_2fa_required
def document_edit_view(request, pk):
    document = get_object_or_404(visible_documents_queryset(request.user), pk=pk)

    if not can_edit_document(request.user, document):
        raise PermissionDenied

    if request.method == "POST":
        previous_is_confidential = document.is_confidential
        form = DocumentForm(
            request.POST,
            request.FILES,
            instance=document,
            user=request.user,
        )

        if form.is_valid():
            updated = form.save(commit=False)
            updated.last_editor = request.user
            updated.save()

            audit_log(
                action=AuditAction.CONTENT_UPDATED,
                actor=request.user,
                request=request,
                target=updated,
                description="Document modifié.",
                metadata={
                    "status": updated.status,
                    "is_confidential": updated.is_confidential,
                    "confidentiality_changed": (
                        previous_is_confidential != updated.is_confidential
                    ),
                },
            )

            messages.success(request, "Le document a été enregistré.")
            return redirect("backoffice:document_edit", pk=updated.pk)
    else:
        form = DocumentForm(instance=document, user=request.user)

    actions = available_actions(
        user=request.user,
        source=document.status,
        owner_id=document.author_id,
    )

    return render(
        request,
        "backoffice/documents/form.html",
        {
            "form": form,
            "document": document,
            "page_title": "Modifier le document",
            "submit_label": "Enregistrer",
            "workflow_actions": actions,
            "action_labels": ACTION_LABELS,
        },
    )


@never_cache
@backoffice_2fa_required
def document_preview_view(request, pk):
    document = get_object_or_404(visible_documents_queryset(request.user), pk=pk)

    if not can_preview_document(request.user, document):
        raise PermissionDenied

    return render(
        request,
        "backoffice/documents/preview.html",
        {
            "document": document,
            "can_edit": can_edit_document(request.user, document),
        },
    )


@never_cache
@require_POST
@backoffice_2fa_required
def document_transition_view(request, pk, action):
    document = get_object_or_404(visible_documents_queryset(request.user), pk=pk)

    try:
        updated = transition_document(
            document=document,
            action=action,
            user=request.user,
            request=request,
        )
    except PermissionDenied:
        raise
    except ValidationError as exc:
        messages.error(request, " ".join(exc.messages))
        return redirect("backoffice:document_edit", pk=document.pk)

    messages.success(request, "Le statut du document a été mis à jour.")

    if updated.status == PublicationStatus.ARCHIVED:
        return redirect("backoffice:document_list")

    return redirect("backoffice:document_preview", pk=updated.pk)


@never_cache
@backoffice_2fa_required
def document_file_view(request, pk):
    document = get_object_or_404(visible_documents_queryset(request.user), pk=pk)
    if not can_preview_document(request.user, document):
        raise PermissionDenied
    if not document.file:
        raise PermissionDenied

    audit_log(
        action=AuditAction.DOCUMENT_OPENED,
        actor=request.user,
        request=request,
        target=document,
        description="Document ouvert depuis le back-office.",
        metadata={
            "source": "backoffice",
            "is_confidential": document.is_confidential,
        },
    )

    response = FileResponse(
        document.file.open("rb"),
        as_attachment=False,
        filename=document.original_filename or document.file.name.rsplit("/", 1)[-1],
        content_type=document.mime_type or "application/octet-stream",
    )
    response["Cache-Control"] = "private, no-store"
    response["X-Content-Type-Options"] = "nosniff"
    response["X-Robots-Tag"] = "noindex, nofollow, noarchive"
    return response


def _require_access_manager(user):
    if not user.has_perm("documents.publish_document"):
        raise PermissionDenied


@never_cache
@backoffice_2fa_required
def document_access_request_list_view(request):
    _require_access_manager(request.user)

    qs = DocumentAccessRequest.objects.select_related(
        "document", "reviewed_by"
    ).order_by("-created_at")
    status_filter = (request.GET.get("status") or "pending").strip()
    query = (request.GET.get("q") or "").strip()

    if status_filter in {
        DocumentAccessRequestStatus.PENDING,
        DocumentAccessRequestStatus.APPROVED,
        DocumentAccessRequestStatus.REFUSED,
    }:
        qs = qs.filter(status=status_filter)
    elif status_filter == "all":
        pass
    else:
        status_filter = "pending"
        qs = qs.filter(status=DocumentAccessRequestStatus.PENDING)

    if query:
        qs = qs.filter(
            Q(full_name__icontains=query)
            | Q(email__icontains=query)
            | Q(document__title__icontains=query)
            | Q(organization__icontains=query)
        )

    page_obj = Paginator(qs, 25).get_page(request.GET.get("page"))
    counts = {
        "pending": DocumentAccessRequest.objects.filter(
            status=DocumentAccessRequestStatus.PENDING
        ).count(),
        "approved": DocumentAccessRequest.objects.filter(
            status=DocumentAccessRequestStatus.APPROVED
        ).count(),
        "refused": DocumentAccessRequest.objects.filter(
            status=DocumentAccessRequestStatus.REFUSED
        ).count(),
    }

    return render(
        request,
        "backoffice/documents/access_requests.html",
        {
            "page_obj": page_obj,
            "status_filter": status_filter,
            "query": query,
            "counts": counts,
        },
    )


@never_cache
@backoffice_2fa_required
def document_access_request_detail_view(request, pk):
    _require_access_manager(request.user)
    access_request = get_object_or_404(
        DocumentAccessRequest.objects.select_related(
            "document", "reviewed_by"
        ).prefetch_related("document__access_grants"),
        pk=pk,
    )
    try:
        grant = access_request.grant
    except DocumentAccessGrant.DoesNotExist:
        grant = None
    log_filters = Q(
        target_type="documents.documentaccessrequest",
        target_id=str(access_request.pk),
    )
    if grant is not None:
        log_filters |= Q(
            target_type="documents.documentaccessgrant",
            target_id=str(grant.pk),
        )
    access_logs = AuditLog.objects.filter(log_filters).select_related("actor")[:30]

    return render(
        request,
        "backoffice/documents/access_request_detail.html",
        {
            "access_request": access_request,
            "grant": grant,
            "access_logs": access_logs,
            "approval_form": DocumentAccessApprovalForm(),
            "refusal_form": DocumentAccessRefusalForm(),
        },
    )


@never_cache
@require_POST
@backoffice_2fa_required
def document_access_request_approve_view(request, pk):
    _require_access_manager(request.user)
    access_request = get_object_or_404(
        DocumentAccessRequest.objects.select_related("document"), pk=pk
    )
    form = DocumentAccessApprovalForm(request.POST)
    if not form.is_valid():
        messages.error(request, "Vérifiez la durée et le nombre d’ouvertures.")
        return redirect("backoffice:document_access_request_detail", pk=pk)

    try:
        grant, raw_token = approve_access_request(
            access_request=access_request,
            reviewer=request.user,
            duration_hours=int(form.cleaned_data["duration_hours"]),
            max_opens=form.cleaned_data["max_opens"],
            request=request,
        )
    except AccessGrantError as exc:
        messages.error(request, str(exc))
        return redirect("backoffice:document_access_request_detail", pk=pk)

    access_url = request.build_absolute_uri(
        f"/documents/acces/{raw_token}"
    )
    try:
        send_document_access_granted_email(grant=grant, access_url=access_url)
        mark_grant_link_sent(grant=grant)
        messages.success(
            request,
            "L’autorisation a été créée et le lien sécurisé a été envoyé par e-mail.",
        )
    except Exception:
        messages.warning(
            request,
            "L’autorisation a été créée, mais l’e-mail n’a pas pu être envoyé. "
            "Utilisez « Régénérer et renvoyer le lien » pour réessayer.",
        )

    return redirect("backoffice:document_access_request_detail", pk=pk)


@never_cache
@require_POST
@backoffice_2fa_required
def document_access_request_refuse_view(request, pk):
    _require_access_manager(request.user)
    access_request = get_object_or_404(DocumentAccessRequest, pk=pk)
    form = DocumentAccessRefusalForm(request.POST)
    if not form.is_valid():
        messages.error(request, "Le motif du refus est invalide.")
        return redirect("backoffice:document_access_request_detail", pk=pk)

    try:
        refuse_access_request(
            access_request=access_request,
            reviewer=request.user,
            reason=form.cleaned_data["refusal_reason"],
            request=request,
        )
        messages.success(request, "La demande a été refusée.")
    except AccessGrantError as exc:
        messages.error(request, str(exc))

    return redirect("backoffice:document_access_request_detail", pk=pk)


@never_cache
@require_POST
@backoffice_2fa_required
def document_access_grant_revoke_view(request, pk):
    _require_access_manager(request.user)
    grant = get_object_or_404(
        DocumentAccessGrant.objects.select_related("request", "document"), pk=pk
    )
    revoke_grant(grant=grant, actor=request.user, request=request)
    messages.success(request, "L’autorisation a été révoquée immédiatement.")
    return redirect(
        "backoffice:document_access_request_detail", pk=grant.request_id
    )


@never_cache
@require_POST
@backoffice_2fa_required
def document_access_grant_resend_view(request, pk):
    _require_access_manager(request.user)
    grant = get_object_or_404(
        DocumentAccessGrant.objects.select_related("request", "document"), pk=pk
    )
    try:
        grant, raw_token = rotate_grant_token(
            grant=grant,
            actor=request.user,
            request=request,
        )
        access_url = request.build_absolute_uri(
            f"/documents/acces/{raw_token}"
        )
        send_document_access_granted_email(grant=grant, access_url=access_url)
        mark_grant_link_sent(grant=grant)
        messages.success(request, "Un nouveau lien sécurisé a été envoyé. L’ancien lien est invalide.")
    except AccessGrantError as exc:
        messages.error(request, str(exc))
    except Exception:
        messages.error(request, "Le nouveau lien n’a pas pu être envoyé par e-mail.")

    return redirect(
        "backoffice:document_access_request_detail", pk=grant.request_id
    )
