from django.contrib.auth.models import Group
from django.test import TestCase

from apps.accounts.models import User
from apps.backoffice.policy import (
    BackofficeRole,
    Capability,
    default_can,
    role_for_user,
)


class BackofficePolicyTests(TestCase):
    def setUp(self):
        self.manager_group = Group.objects.get(name="Manager")
        self.editor_group = Group.objects.get(name="Éditeur")

        self.superadmin = User.objects.create_superuser(
            email="root@example.test",
            password="StrongPassword-123!",
        )

        self.manager = User.objects.create_user(
            email="manager@example.test",
            password="StrongPassword-123!",
        )
        self.manager.groups.add(self.manager_group)

        self.editor = User.objects.create_user(
            email="editor@example.test",
            password="StrongPassword-123!",
        )
        self.editor.groups.add(self.editor_group)

    def test_roles_are_resolved(self):
        self.assertEqual(
            role_for_user(self.superadmin),
            BackofficeRole.SUPERADMIN,
        )
        self.assertEqual(
            role_for_user(self.manager),
            BackofficeRole.MANAGER,
        )
        self.assertEqual(
            role_for_user(self.editor),
            BackofficeRole.EDITOR,
        )

    def test_editor_cannot_publish(self):
        self.assertFalse(
            default_can(self.editor, Capability.CONTENT_PUBLISH)
        )
        self.assertTrue(
            default_can(self.editor, Capability.CONTENT_SUBMIT)
        )

    def test_manager_can_publish_but_not_manage_users(self):
        self.assertTrue(
            default_can(self.manager, Capability.CONTENT_PUBLISH)
        )
        self.assertFalse(
            default_can(self.manager, Capability.USER_MANAGE)
        )

    def test_superadmin_has_all_capabilities(self):
        for capability in Capability:
            self.assertTrue(default_can(self.superadmin, capability))
