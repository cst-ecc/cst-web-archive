from functools import wraps

from django.contrib import messages
from django.shortcuts import redirect


def superadmin_required(view_func):
    """Réserve une vue du back-office au Super administrateur."""
    @wraps(view_func)
    def wrapped(request, *args, **kwargs):
        if not request.user.is_authenticated:
            return redirect("backoffice:login")

        if not request.user.is_active or not request.user.is_superuser:
            messages.error(
                request,
                "Cette fonctionnalité est réservée au Super administrateur.",
            )
            return redirect("backoffice:dashboard")

        return view_func(request, *args, **kwargs)

    return wrapped
