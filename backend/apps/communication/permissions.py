from django.apps import apps
from django.contrib.auth.models import Group, Permission
from django.db.models.signals import post_migrate
from django.dispatch import receiver

from apps.accounts.roles import GROUP_MANAGER

MANAGER_CODES = (
    "view_contactrequest", "change_contactrequest", "manage_contactrequest", "reply_contactrequest",
    "view_conversation", "change_conversation", "manage_conversation", "reply_conversation",
    "view_chatmessage", "view_newslettersubscriber", "change_newslettersubscriber", "manage_newslettersubscriber",
    "view_newslettercampaign", "add_newslettercampaign", "change_newslettercampaign", "manage_newslettercampaign", "send_newslettercampaign",
)


def assign_communication_permissions():
    if not apps.is_installed("apps.communication"):
        return
    try:
        manager = Group.objects.get(name=GROUP_MANAGER)
    except Group.DoesNotExist:
        return
    perms = Permission.objects.filter(content_type__app_label="communication")
    by_code = {p.codename: p for p in perms}
    manager.permissions.add(*[by_code[c] for c in MANAGER_CODES if c in by_code])


@receiver(post_migrate, dispatch_uid="communication.assign_group_permissions")
def assign_after_migrate(sender, **kwargs):
    if getattr(sender, "label", None) == "communication":
        assign_communication_permissions()
