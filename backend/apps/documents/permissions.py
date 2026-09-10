from django.apps import apps
from django.contrib.auth.models import Group, Permission
from django.db.models.signals import post_migrate
from django.dispatch import receiver

from apps.accounts.roles import GROUP_EDITOR, GROUP_MANAGER


MANAGER_DOCUMENT_PERMISSIONS = (
    "view_document",
    "add_document",
    "change_document",
    "submit_document",
    "review_document",
    "publish_document",
    "archive_document",
)

EDITOR_DOCUMENT_PERMISSIONS = (
    "view_document",
    "add_document",
    "change_document",
    "submit_document",
)


def assign_document_permissions() -> None:
    if not apps.is_installed("apps.documents"):
        return

    try:
        manager = Group.objects.get(name=GROUP_MANAGER)
        editor = Group.objects.get(name=GROUP_EDITOR)
    except Group.DoesNotExist:
        return

    permissions = {
        permission.codename: permission
        for permission in Permission.objects.filter(
            content_type__app_label="documents",
            content_type__model="document",
        )
    }

    manager.permissions.add(
        *[
            permissions[codename]
            for codename in MANAGER_DOCUMENT_PERMISSIONS
            if codename in permissions
        ]
    )
    editor.permissions.add(
        *[
            permissions[codename]
            for codename in EDITOR_DOCUMENT_PERMISSIONS
            if codename in permissions
        ]
    )


@receiver(post_migrate, dispatch_uid="documents.assign_group_permissions")
def assign_document_permissions_after_migrate(sender, **kwargs):
    if getattr(sender, "label", None) == "documents":
        assign_document_permissions()
