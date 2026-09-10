from functools import wraps

from django.contrib import messages
from django.shortcuts import redirect

from apps.accounts.roles import GROUP_EDITOR, GROUP_MANAGER


def has_backoffice_access(user) -> bool:
    """Autorise uniquement les utilisateurs actifs prévus pour le back-office."""
    if not getattr(user, "is_authenticated", False) or not user.is_active:
        return False

    if user.is_superuser:
        return True

    return user.groups.filter(name__in=[GROUP_MANAGER, GROUP_EDITOR]).exists()


def backoffice_role_label(user) -> str:
    if getattr(user, "is_superuser", False):
        return "Super administrateur"
    if user.groups.filter(name=GROUP_MANAGER).exists():
        return GROUP_MANAGER
    if user.groups.filter(name=GROUP_EDITOR).exists():
        return GROUP_EDITOR
    return "Aucun rôle back-office"


def backoffice_2fa_required(view_func):
    """
    Protège les pages du back-office avec authentification + rôle + 2FA.

    Une simple session Django obtenue ailleurs dans le projet ne suffit pas :
    la session doit explicitement porter la preuve 2FA de cet utilisateur.
    """
    @wraps(view_func)
    def wrapped(request, *args, **kwargs):
        from .session import is_verified_for_user

        if not request.user.is_authenticated:
            return redirect("backoffice:login")

        if not has_backoffice_access(request.user):
            messages.error(
                request,
                "Votre compte n'est pas autorisé à accéder au back-office.",
            )
            return redirect("backoffice:login")

        if not is_verified_for_user(request, request.user):
            messages.info(
                request,
                "Une vérification à deux facteurs est requise.",
            )
            return redirect("backoffice:login")

        return view_func(request, *args, **kwargs)

    return wrapped
