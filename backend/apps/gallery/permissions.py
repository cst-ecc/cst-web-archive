from django.apps import apps
from django.contrib.auth.models import Group, Permission
from django.db.models.signals import post_migrate
from django.dispatch import receiver

from apps.accounts.roles import GROUP_EDITOR, GROUP_MANAGER


MANAGER_ALBUM_PERMISSIONS = (
    "view_galleryalbum",
    "add_galleryalbum",
    "change_galleryalbum",
    "submit_galleryalbum",
    "review_galleryalbum",
    "publish_galleryalbum",
    "archive_galleryalbum",
)

EDITOR_ALBUM_PERMISSIONS = (
    "view_galleryalbum",
    "add_galleryalbum",
    "change_galleryalbum",
    "submit_galleryalbum",
)

MANAGER_IMAGE_PERMISSIONS = (
    "view_galleryimage",
    "add_galleryimage",
    "change_galleryimage",
    "delete_galleryimage",
)

EDITOR_IMAGE_PERMISSIONS = (
    "view_galleryimage",
    "add_galleryimage",
    "change_galleryimage",
)


def _permissions_for(model: str):
    return {
        permission.codename: permission
        for permission in Permission.objects.filter(
            content_type__app_label="gallery",
            content_type__model=model,
        )
    }


def assign_gallery_permissions() -> None:
    if not apps.is_installed("apps.gallery"):
        return

    try:
        manager = Group.objects.get(name=GROUP_MANAGER)
        editor = Group.objects.get(name=GROUP_EDITOR)
    except Group.DoesNotExist:
        return

    album_permissions = _permissions_for("galleryalbum")
    image_permissions = _permissions_for("galleryimage")

    manager.permissions.add(
        *[
            album_permissions[codename]
            for codename in MANAGER_ALBUM_PERMISSIONS
            if codename in album_permissions
        ],
        *[
            image_permissions[codename]
            for codename in MANAGER_IMAGE_PERMISSIONS
            if codename in image_permissions
        ],
    )

    editor.permissions.add(
        *[
            album_permissions[codename]
            for codename in EDITOR_ALBUM_PERMISSIONS
            if codename in album_permissions
        ],
        *[
            image_permissions[codename]
            for codename in EDITOR_IMAGE_PERMISSIONS
            if codename in image_permissions
        ],
    )


@receiver(post_migrate, dispatch_uid="gallery.assign_group_permissions")
def assign_gallery_permissions_after_migrate(sender, **kwargs):
    if getattr(sender, "label", None) == "gallery":
        assign_gallery_permissions()
