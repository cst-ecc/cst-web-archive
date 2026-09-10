from django.contrib import messages
from django.core.exceptions import PermissionDenied, ValidationError
from django.core.paginator import Paginator
from django.db.models import Q
from django.shortcuts import get_object_or_404, redirect, render
from django.views.decorators.cache import never_cache
from django.views.decorators.http import require_http_methods, require_POST

from apps.audit.models import AuditAction
from apps.audit.services import audit_log
from apps.backoffice.access import backoffice_2fa_required
from apps.backoffice.workflow import ACTION_LABELS, available_actions
from apps.core.publication import PublicationStatus

from .forms import DocumentForm
from .models import Document, DocumentKind
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

    page_obj = Paginator(qs, 20).get_page(request.GET.get("page"))

    return render(
        request,
        "backoffice/documents/list.html",
        {
            "page_obj": page_obj,
            "query": query,
            "status_filter": status,
            "kind_filter": kind,
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
                metadata={"status": document.status},
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
                metadata={"status": updated.status},
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
