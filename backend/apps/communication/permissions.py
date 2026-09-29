from django.apps import apps
from django.contrib.auth.models import Group, Permission
from django.db.models.signals import post_migrate
from django.dispatch import receiver

from apps.accounts.roles import GROUP_EDITOR, GROUP_MANAGER


MANAGER_PERMISSION_CODENAMES = (
    "view_contact",
    "change_contact",
    "manage_contact",
    "reply_contact",
    "view_contactreply",
)


def assign_communication_permissions() -> None:
    if not apps.is_installed("apps.communication"):
        return

    try:
        manager = Group.objects.get(name=GROUP_MANAGER)
        editor = Group.objects.get(name=GROUP_EDITOR)
    except Group.DoesNotExist:
        return

    permissions = Permission.objects.filter(content_type__app_label="communication")
    by_codename = {permission.codename: permission for permission in permissions}

    manager.permissions.add(
        *[
            by_codename[codename]
            for codename in MANAGER_PERMISSION_CODENAMES
            if codename in by_codename
        ]
    )

    # Les éditeurs n'accèdent pas par défaut aux données personnelles des contacts.
    editor.permissions.remove(
        *[
            permission
            for codename, permission in by_codename.items()
            if codename in MANAGER_PERMISSION_CODENAMES
        ]
    )


@receiver(post_migrate, dispatch_uid="communication.assign_group_permissions")
def assign_communication_permissions_after_migrate(sender, **kwargs):
    if getattr(sender, "label", None) == "communication":
        assign_communication_permissions()
