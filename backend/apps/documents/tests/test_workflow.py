from django.contrib.auth.models import Group
from django.test import RequestFactory, TestCase
from django.utils import timezone

from apps.accounts.models import User
from apps.accounts.roles import GROUP_EDITOR, GROUP_MANAGER
from apps.core.publication import PublicationStatus
from apps.documents.models import Document, DocumentCategory, DocumentKind
from apps.documents.permissions import assign_document_permissions
from apps.documents.services import transition_document

from .helpers import test_pdf


class DocumentWorkflowTests(TestCase):
    def setUp(self):
        assign_document_permissions()

        manager_group = Group.objects.get(name=GROUP_MANAGER)
        editor_group = Group.objects.get(name=GROUP_EDITOR)

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

        self.category = DocumentCategory.objects.create(
            name="Rapports",
            slug="rapports",
        )

        self.request = RequestFactory().post("/backoffice/documents/")
        self.request.META["REMOTE_ADDR"] = "127.0.0.1"

        self.document = Document.objects.create(
            title="Rapport",
            summary="Résumé",
            reference="REF",
            category=self.category,
            kind=DocumentKind.REPORT,
            date=timezone.localdate(),
            file=test_pdf(),
            author=self.editor,
            last_editor=self.editor,
        )

    def test_editor_submits_then_manager_publishes(self):
        submitted = transition_document(
            document=self.document,
            action="submit",
            user=self.editor,
            request=self.request,
        )
        self.assertEqual(submitted.status, PublicationStatus.PENDING)

        published = transition_document(
            document=submitted,
            action="publish",
            user=self.manager,
            request=self.request,
        )
        self.assertEqual(published.status, PublicationStatus.PUBLISHED)
        self.assertIsNotNone(published.published_at)

    def test_publish_requires_file(self):
        self.document.file = ""
        self.document.status = PublicationStatus.PENDING
        self.document.save(update_fields=["file", "status"])

        with self.assertRaises(Exception):
            transition_document(
                document=self.document,
                action="publish",
                user=self.manager,
                request=self.request,
            )
