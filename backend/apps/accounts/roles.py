"""Rôles de base du back-office CST/CSMO."""

from django.contrib.auth.models import Group

GROUP_MANAGER = "Manager"
GROUP_EDITOR = "Éditeur"
BACKOFFICE_GROUPS = (GROUP_MANAGER, GROUP_EDITOR)


def ensure_backoffice_groups() -> None:
    for name in BACKOFFICE_GROUPS:
        Group.objects.get_or_create(name=name)


def user_in_group(user, group_name: str) -> bool:
    return bool(
        getattr(user, "is_authenticated", False)
        and user.groups.filter(name=group_name).exists()
    )
