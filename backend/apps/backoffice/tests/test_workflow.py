from django.contrib.auth.models import Group
from django.test import TestCase

from apps.accounts.models import User
from apps.backoffice.workflow import (
    PublicationStatus,
    WorkflowAction,
    available_actions,
    can_transition,
    target_status,
)


class EditorialWorkflowTests(TestCase):
    def setUp(self):
        manager_group = Group.objects.get(name="Manager")
        editor_group = Group.objects.get(name="Éditeur")

        self.superadmin = User.objects.create_superuser(
            email="root@example.test",
            password="StrongPassword-123!",
        )

        self.manager = User.objects.create_user(
            email="manager@example.test",
            password="StrongPassword-123!",
        )
        self.manager.groups.add(manager_group)

        self.editor = User.objects.create_user(
            email="editor@example.test",
            password="StrongPassword-123!",
        )
        self.editor.groups.add(editor_group)

        self.other_editor = User.objects.create_user(
            email="other@example.test",
            password="StrongPassword-123!",
        )
        self.other_editor.groups.add(editor_group)

    def test_editor_can_submit_own_draft(self):
        self.assertTrue(
            can_transition(
                user=self.editor,
                source=PublicationStatus.DRAFT,
                action=WorkflowAction.SUBMIT,
                owner_id=self.editor.pk,
            )
        )

    def test_superadmin_gets_publish_not_submit_for_draft(self):
        self.assertEqual(
            available_actions(
                user=self.superadmin,
                source=PublicationStatus.DRAFT,
                owner_id=self.editor.pk,
            ),
            [WorkflowAction.PUBLISH],
        )

    def test_editor_cannot_submit_another_users_draft(self):
        self.assertFalse(
            can_transition(
                user=self.editor,
                source=PublicationStatus.DRAFT,
                action=WorkflowAction.SUBMIT,
                owner_id=self.other_editor.pk,
            )
        )

    def test_editor_cannot_publish(self):
        self.assertFalse(
            can_transition(
                user=self.editor,
                source=PublicationStatus.PENDING,
                action=WorkflowAction.PUBLISH,
                owner_id=self.editor.pk,
            )
        )

    def test_manager_can_publish_pending_content(self):
        self.assertTrue(
            can_transition(
                user=self.manager,
                source=PublicationStatus.PENDING,
                action=WorkflowAction.PUBLISH,
                owner_id=self.editor.pk,
            )
        )

        self.assertEqual(
            target_status(
                source=PublicationStatus.PENDING,
                action=WorkflowAction.PUBLISH,
            ),
            PublicationStatus.PUBLISHED,
        )

    def test_manager_can_archive_published_content(self):
        self.assertTrue(
            can_transition(
                user=self.manager,
                source=PublicationStatus.PUBLISHED,
                action=WorkflowAction.ARCHIVE,
                owner_id=self.editor.pk,
            )
        )
