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
from apps.backoffice.workflow import (
    ACTION_LABELS,
    WorkflowAction,
    available_actions,
)
from apps.core.publication import PublicationStatus

from .forms import NewsForm
from .models import News
from .services import (
    can_edit_news,
    can_preview_news,
    transition_news,
    visible_news_queryset,
)


@never_cache
@backoffice_2fa_required
def news_list_view(request):
    if not request.user.has_perm("news.view_news"):
        raise PermissionDenied

    qs = visible_news_queryset(request.user)

    query = (request.GET.get("q") or "").strip()
    status = (request.GET.get("status") or "").strip()

    if query:
        qs = qs.filter(Q(title__icontains=query) | Q(excerpt__icontains=query))

    if status:
        qs = qs.filter(status=status)

    page_obj = Paginator(qs, 20).get_page(request.GET.get("page"))

    return render(
        request,
        "backoffice/news/list.html",
        {
            "page_obj": page_obj,
            "query": query,
            "status_filter": status,
            "status_choices": PublicationStatus.choices,
        },
    )


@never_cache
@require_http_methods(["GET", "POST"])
@backoffice_2fa_required
def news_create_view(request):
    if not request.user.has_perm("news.add_news"):
        raise PermissionDenied

    if request.method == "POST":
        form = NewsForm(request.POST, request.FILES, user=request.user)

        if form.is_valid():
            news = form.save(commit=False)
            news.author = request.user
            news.last_editor = request.user
            news.save()

            audit_log(
                action=AuditAction.CONTENT_CREATED,
                actor=request.user,
                request=request,
                target=news,
                description="Actualité créée.",
                metadata={"status": news.status},
            )

            if news.featured_image:
                audit_log(
                    action=AuditAction.MEDIA_UPLOADED,
                    actor=request.user,
                    request=request,
                    target=news,
                    description="Image de couverture d’actualité téléversée et compressée.",
                    metadata={"field": "featured_image"},
                )

            messages.success(request, "L’actualité a été créée en brouillon.")
            return redirect("backoffice:news_edit", pk=news.pk)
    else:
        form = NewsForm(user=request.user)

    return render(
        request,
        "backoffice/news/form.html",
        {
            "form": form,
            "page_title": "Nouvelle actualité",
            "submit_label": "Créer le brouillon",
        },
    )


@never_cache
@require_http_methods(["GET", "POST"])
@backoffice_2fa_required
def news_edit_view(request, pk):
    news = get_object_or_404(visible_news_queryset(request.user), pk=pk)

    if not can_edit_news(request.user, news):
        raise PermissionDenied

    previous_image_name = news.featured_image.name if news.featured_image else ""

    if request.method == "POST":
        form = NewsForm(
            request.POST,
            request.FILES,
            instance=news,
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
                description="Actualité modifiée.",
                metadata={"status": updated.status},
            )

            current_image_name = (
                updated.featured_image.name if updated.featured_image else ""
            )
            if current_image_name and current_image_name != previous_image_name:
                audit_log(
                    action=AuditAction.MEDIA_UPLOADED,
                    actor=request.user,
                    request=request,
                    target=updated,
                    description="Image de couverture d’actualité téléversée et compressée.",
                    metadata={"field": "featured_image"},
                )

            messages.success(request, "L’actualité a été enregistrée.")
            return redirect("backoffice:news_edit", pk=updated.pk)
    else:
        form = NewsForm(instance=news, user=request.user)

    actions = available_actions(
        user=request.user,
        source=news.status,
        owner_id=news.author_id,
    )

    return render(
        request,
        "backoffice/news/form.html",
        {
            "form": form,
            "news": news,
            "page_title": "Modifier l’actualité",
            "submit_label": "Enregistrer",
            "workflow_actions": actions,
            "action_labels": ACTION_LABELS,
        },
    )


@never_cache
@backoffice_2fa_required
def news_preview_view(request, pk):
    news = get_object_or_404(visible_news_queryset(request.user), pk=pk)

    if not can_preview_news(request.user, news):
        raise PermissionDenied

    return render(
        request,
        "backoffice/news/preview.html",
        {
            "news": news,
            "can_edit": can_edit_news(request.user, news),
        },
    )


@never_cache
@require_POST
@backoffice_2fa_required
def news_transition_view(request, pk, action):
    news = get_object_or_404(visible_news_queryset(request.user), pk=pk)

    try:
        updated = transition_news(
            news=news,
            action=action,
            user=request.user,
            request=request,
        )
    except PermissionDenied:
        raise
    except ValidationError as exc:
        messages.error(request, " ".join(exc.messages))
        return redirect("backoffice:news_edit", pk=news.pk)

    messages.success(request, "Le statut de l’actualité a été mis à jour.")

    if updated.status == PublicationStatus.ARCHIVED:
        return redirect("backoffice:news_list")

    return redirect("backoffice:news_preview", pk=updated.pk)
