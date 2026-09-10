from django.apps import apps
from django.contrib.auth.models import Group, Permission
from django.db.models.signals import post_migrate
from django.dispatch import receiver

from apps.accounts.roles import GROUP_EDITOR, GROUP_MANAGER


MANAGER_PERMISSION_CODENAMES = (
    "view_news",
    "add_news",
    "change_news",
    "submit_news",
    "review_news",
    "publish_news",
    "archive_news",
)

EDITOR_PERMISSION_CODENAMES = (
    "view_news",
    "add_news",
    "change_news",
    "submit_news",
)


def assign_news_permissions() -> None:
    if not apps.is_installed("apps.news"):
        return

    try:
        manager = Group.objects.get(name=GROUP_MANAGER)
        editor = Group.objects.get(name=GROUP_EDITOR)
    except Group.DoesNotExist:
        return

    permissions = Permission.objects.filter(
        content_type__app_label="news",
        content_type__model="news",
    )

    by_codename = {perm.codename: perm for perm in permissions}

    manager.permissions.add(
        *[
            by_codename[codename]
            for codename in MANAGER_PERMISSION_CODENAMES
            if codename in by_codename
        ]
    )
    editor.permissions.add(
        *[
            by_codename[codename]
            for codename in EDITOR_PERMISSION_CODENAMES
            if codename in by_codename
        ]
    )


@receiver(post_migrate, dispatch_uid="news.assign_group_permissions")
def assign_news_permissions_after_migrate(sender, **kwargs):
    if getattr(sender, "label", None) == "news":
        assign_news_permissions()
