import logging

from django.contrib import messages
from django.contrib.auth.tokens import default_token_generator
from django.core.paginator import Paginator
from django.db.models import Q
from django.shortcuts import get_object_or_404, redirect, render
from django.utils.encoding import force_str
from django.utils.http import urlsafe_base64_decode
from django.views.decorators.cache import never_cache
from django.views.decorators.http import require_http_methods, require_POST

from apps.accounts.invitations import send_backoffice_invitation
from apps.accounts.models import User
from apps.accounts.roles import GROUP_EDITOR, GROUP_MANAGER
from apps.audit.models import AuditAction
from apps.audit.services import audit_log

from .access import backoffice_2fa_required
from .permissions import superadmin_required
from .user_forms import (
    BackofficeSetPasswordForm,
    BackofficeUserCreateForm,
    BackofficeUserUpdateForm,
)

logger = logging.getLogger(__name__)


def _managed_users():
    """
    Comptes gérés par cette interface.

    Les superutilisateurs sont volontairement exclus : leur création et
    maintenance restent hors du workflow Manager/Éditeur.
    """
    return (
        User.objects.filter(is_superuser=False)
        .filter(groups__name__in=[GROUP_MANAGER, GROUP_EDITOR])
        .distinct()
        .order_by("email")
    )


@never_cache
@backoffice_2fa_required
@superadmin_required
def user_list_view(request):
    query = (request.GET.get("q") or "").strip()
    users = _managed_users()

    if query:
        users = users.filter(
            Q(email__icontains=query)
            | Q(first_name__icontains=query)
            | Q(last_name__icontains=query)
        )

    paginator = Paginator(users, 20)
    page_obj = paginator.get_page(request.GET.get("page"))

    return render(
        request,
        "backoffice/users/list.html",
        {
            "page_obj": page_obj,
            "query": query,
        },
    )


@never_cache
@require_http_methods(["GET", "POST"])
@backoffice_2fa_required
@superadmin_required
def user_create_view(request):
    if request.method == "POST":
        form = BackofficeUserCreateForm(request.POST)

        if form.is_valid():
            user = form.save()

            audit_log(
                action=AuditAction.USER_CREATED,
                actor=request.user,
                request=request,
                target=user,
                description="Utilisateur back-office créé.",
                metadata={
                    "role": form.cleaned_data["role"],
                    "is_active": user.is_active,
                },
            )

            try:
                send_backoffice_invitation(request=request, user=user)
                messages.success(
                    request,
                    "L'utilisateur a été créé et son invitation a été envoyée.",
                )
            except Exception:
                logger.exception(
                    "Échec d'envoi de l'invitation back-office pour user_id=%s",
                    user.pk,
                )
                messages.warning(
                    request,
                    "L'utilisateur a été créé, mais l'invitation n'a pas pu être envoyée. "
                    "Vous pourrez la renvoyer depuis sa fiche.",
                )

            return redirect("backoffice:user_list")
    else:
        form = BackofficeUserCreateForm(initial={"is_active": True})

    return render(
        request,
        "backoffice/users/form.html",
        {
            "form": form,
            "page_title": "Nouvel utilisateur",
            "submit_label": "Créer et inviter",
        },
    )


@never_cache
@require_http_methods(["GET", "POST"])
@backoffice_2fa_required
@superadmin_required
def user_update_view(request, pk):
    user = get_object_or_404(_managed_users(), pk=pk)
    previous_groups = list(
        user.groups.filter(name__in=[GROUP_MANAGER, GROUP_EDITOR])
        .values_list("name", flat=True)
    )

    if request.method == "POST":
        form = BackofficeUserUpdateForm(request.POST, instance=user)

        if form.is_valid():
            updated_user = form.save()

            audit_log(
                action=AuditAction.USER_UPDATED,
                actor=request.user,
                request=request,
                target=updated_user,
                description="Utilisateur back-office modifié.",
                metadata={
                    "previous_roles": previous_groups,
                    "new_role": form.cleaned_data["role"],
                    "is_active": updated_user.is_active,
                },
            )

            if previous_groups != [form.cleaned_data["role"]]:
                audit_log(
                    action=AuditAction.ROLE_CHANGED,
                    actor=request.user,
                    request=request,
                    target=updated_user,
                    description="Rôle back-office modifié.",
                    metadata={
                        "previous_roles": previous_groups,
                        "new_role": form.cleaned_data["role"],
                    },
                )

            messages.success(request, "L'utilisateur a été mis à jour.")
            return redirect("backoffice:user_list")
    else:
        form = BackofficeUserUpdateForm(instance=user)

    return render(
        request,
        "backoffice/users/form.html",
        {
            "form": form,
            "managed_user": user,
            "page_title": "Modifier l'utilisateur",
            "submit_label": "Enregistrer",
        },
    )


@never_cache
@require_POST
@backoffice_2fa_required
@superadmin_required
def user_toggle_active_view(request, pk):
    user = get_object_or_404(_managed_users(), pk=pk)
    user.is_active = not user.is_active
    user.save(update_fields=["is_active", "updated_at"])

    audit_log(
        action=AuditAction.USER_UPDATED,
        actor=request.user,
        request=request,
        target=user,
        description=(
            "Utilisateur back-office activé."
            if user.is_active
            else "Utilisateur back-office suspendu."
        ),
        metadata={"is_active": user.is_active},
    )

    messages.success(
        request,
        "Le compte a été activé." if user.is_active else "Le compte a été suspendu.",
    )
    return redirect("backoffice:user_list")


@never_cache
@require_POST
@backoffice_2fa_required
@superadmin_required
def user_resend_invitation_view(request, pk):
    user = get_object_or_404(_managed_users(), pk=pk)

    # Une invitation de définition de mot de passe n'a de sens que si
    # l'utilisateur n'a encore aucun mot de passe exploitable.
    if user.has_usable_password():
        messages.info(
            request,
            "Ce compte possède déjà un mot de passe. Utilisez ultérieurement "
            "le workflow de réinitialisation plutôt qu'une invitation.",
        )
        return redirect("backoffice:user_update", pk=user.pk)

    try:
        send_backoffice_invitation(request=request, user=user)
        messages.success(request, "L'invitation a été renvoyée.")
    except Exception:
        logger.exception(
            "Échec de renvoi de l'invitation back-office pour user_id=%s",
            user.pk,
        )
        messages.error(
            request,
            "L'invitation n'a pas pu être envoyée pour le moment.",
        )

    return redirect("backoffice:user_update", pk=user.pk)


@never_cache
@require_http_methods(["GET", "POST"])
def account_setup_view(request, uidb64, token):
    """
    Page publique d'activation du compte invité.

    Le token natif Django est invalidé automatiquement après `set_password()`.
    """
    try:
        uid = force_str(urlsafe_base64_decode(uidb64))
        user = User.objects.get(pk=uid, is_active=True)
    except (TypeError, ValueError, OverflowError, User.DoesNotExist):
        user = None

    token_is_valid = (
        user is not None
        and not user.is_superuser
        and user.groups.filter(name__in=[GROUP_MANAGER, GROUP_EDITOR]).exists()
        and default_token_generator.check_token(user, token)
    )

    if not token_is_valid:
        return render(
            request,
            "backoffice/users/setup_invalid.html",
            status=400,
        )

    if request.method == "POST":
        form = BackofficeSetPasswordForm(user=user, data=request.POST)

        if form.is_valid():
            form.save()

            audit_log(
                action=AuditAction.USER_UPDATED,
                actor=user,
                request=request,
                target=user,
                description="Mot de passe initial défini par l'utilisateur.",
                metadata={"reason": "account_setup"},
            )

            messages.success(
                request,
                "Votre mot de passe a été défini. Vous pouvez maintenant vous connecter.",
            )
            return redirect("backoffice:login")
    else:
        form = BackofficeSetPasswordForm(user=user)

    return render(
        request,
        "backoffice/users/setup.html",
        {
            "form": form,
            "setup_user": user,
        },
    )
