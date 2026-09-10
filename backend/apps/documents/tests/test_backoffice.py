from django.contrib.auth.models import Group
from django.test import TestCase
from django.urls import reverse

from apps.accounts.models import User
from apps.accounts.roles import GROUP_EDITOR, GROUP_MANAGER
from apps.backoffice.session import VERIFIED_USER_ID
from apps.documents.models import Document, DocumentCategory

from .helpers import test_pdf


class DocumentBackofficeTests(TestCase):
    def setUp(self):
        self.category = DocumentCategory.objects.create(
            name="Décisions",
            slug="decisions",
        )

        editor_group = Group.objects.get(name=GROUP_EDITOR)
        manager_group = Group.objects.get(name=GROUP_MANAGER)

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

        self.manager = User.objects.create_user(
            email="manager@example.test",
            password="StrongPassword-123!",
        )
        self.manager.groups.add(manager_group)

    def _verified_login(self, user):
        self.client.force_login(user)
        session = self.client.session
        session[VERIFIED_USER_ID] = user.pk
        session.save()

    def test_editor_can_create_document(self):
        self._verified_login(self.editor)

        response = self.client.post(
            reverse("backoffice:document_create"),
            {
                "title": "Acte institutionnel",
                "reference": "ACTE-001",
                "category": self.category.pk,
                "new_category_name": "",
                "kind": "decision",
                "summary": "Résumé du document",
                "date": "2026-09-10",
                "pages": "",
            },
            files={"file": test_pdf()},
        )

        # Django test client ignores the files kwarg for multipart unless using
        # data with file directly. Keep a second robust request below if needed.
        if response.status_code != 302:
            response = self.client.post(
                reverse("backoffice:document_create"),
                {
                    "title": "Acte institutionnel",
                    "reference": "ACTE-001",
                    "category": self.category.pk,
                    "new_category_name": "",
                    "kind": "decision",
                    "summary": "Résumé du document",
                    "date": "2026-09-10",
                    "pages": "",
                    "file": test_pdf(),
                },
            )

        self.assertEqual(response.status_code, 302)
        document = Document.objects.get(title="Acte institutionnel")
        self.assertEqual(document.author, self.editor)
        self.assertEqual(document.status, "brouillon")

    def test_editor_does_not_see_another_editors_document(self):
        document = Document.objects.create(
            title="Document autre",
            summary="Résumé",
            category=self.category,
            kind="rapport",
            date="2026-09-10",
            file=test_pdf(),
            author=self.other_editor,
            last_editor=self.other_editor,
        )

        self._verified_login(self.editor)
        response = self.client.get(
            reverse("backoffice:document_edit", kwargs={"pk": document.pk})
        )
        self.assertEqual(response.status_code, 404)

    def test_manager_sees_all_documents(self):
        Document.objects.create(
            title="Document éditeur",
            summary="Résumé",
            category=self.category,
            kind="rapport",
            date="2026-09-10",
            file=test_pdf(),
            author=self.editor,
            last_editor=self.editor,
        )

        self._verified_login(self.manager)
        response = self.client.get(reverse("backoffice:document_list"))

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Document éditeur")
