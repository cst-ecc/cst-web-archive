from datetime import timedelta

from django.contrib.auth.models import Group
from django.test import TestCase
from django.utils import timezone
from django.urls import reverse

from apps.accounts.models import User
from apps.accounts.roles import GROUP_EDITOR, GROUP_MANAGER
from apps.backoffice.session import VERIFIED_USER_ID
from apps.documents.models import (
    Document,
    DocumentAccessGrant,
    DocumentAccessRequest,
    DocumentAccessRequestStatus,
    DocumentCategory,
)

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

    def _create_document(self, title, *, confidential=False, author=None):
        owner = author or self.editor
        return Document.objects.create(
            title=title,
            summary="Résumé",
            category=self.category,
            kind="rapport",
            date="2026-09-10",
            file=test_pdf(name=f"{title[:12].replace(' ', '-')}.pdf"),
            author=owner,
            last_editor=owner,
            is_confidential=confidential,
        )

    def test_manager_can_make_multiple_documents_confidential(self):
        first = self._create_document("Rapport public A")
        second = self._create_document("Rapport public B")
        self._verified_login(self.manager)

        response = self.client.post(
            reverse("backoffice:document_bulk_confidentiality"),
            {
                "document_ids": [str(first.pk), str(second.pk)],
                "action": "make_confidential",
            },
        )

        self.assertRedirects(response, reverse("backoffice:document_list"))
        first.refresh_from_db()
        second.refresh_from_db()
        self.assertTrue(first.is_confidential)
        self.assertTrue(second.is_confidential)
        self.assertEqual(first.last_editor, self.manager)
        self.assertEqual(second.last_editor, self.manager)

    def test_editor_cannot_use_bulk_confidentiality_action(self):
        document = self._create_document("Document éditeur")
        self._verified_login(self.editor)

        response = self.client.post(
            reverse("backoffice:document_bulk_confidentiality"),
            {
                "document_ids": [str(document.pk)],
                "action": "make_confidential",
            },
        )

        self.assertEqual(response.status_code, 403)
        document.refresh_from_db()
        self.assertFalse(document.is_confidential)

    def test_bulk_make_public_revokes_grants_and_closes_pending_requests(self):
        document = self._create_document(
            "Rapport confidentiel",
            confidential=True,
        )
        approved_request = DocumentAccessRequest.objects.create(
            document=document,
            full_name="Jean Exemple",
            email="jean@example.test",
            reason="Consultation",
            status=DocumentAccessRequestStatus.APPROVED,
            reviewed_at=timezone.now(),
            reviewed_by=self.manager,
        )
        grant = DocumentAccessGrant.objects.create(
            request=approved_request,
            document=document,
            recipient_name="Jean Exemple",
            recipient_email="jean@example.test",
            token_hash="a" * 64,
            expires_at=timezone.now() + timedelta(hours=24),
            max_opens=5,
            created_by=self.manager,
        )
        pending_request = DocumentAccessRequest.objects.create(
            document=document,
            full_name="Paul Exemple",
            email="paul@example.test",
            reason="Consultation",
        )
        self._verified_login(self.manager)

        response = self.client.post(
            reverse("backoffice:document_bulk_confidentiality"),
            {
                "document_ids": [str(document.pk)],
                "action": "make_public",
            },
        )

        self.assertRedirects(response, reverse("backoffice:document_list"))
        document.refresh_from_db()
        grant.refresh_from_db()
        pending_request.refresh_from_db()
        self.assertFalse(document.is_confidential)
        self.assertIsNotNone(grant.revoked_at)
        self.assertEqual(
            pending_request.status,
            DocumentAccessRequestStatus.REFUSED,
        )

    def test_bulk_action_preserves_document_list_filters(self):
        document = self._create_document("Rapport à filtrer")
        self._verified_login(self.manager)
        return_query = "q=Rapport&status=brouillon&confidential=no&page=2"

        response = self.client.post(
            reverse("backoffice:document_bulk_confidentiality"),
            {
                "document_ids": [str(document.pk)],
                "action": "make_confidential",
                "return_query": return_query,
            },
        )

        self.assertEqual(response.status_code, 302)
        self.assertEqual(
            response.url,
            reverse("backoffice:document_list") + "?" + return_query,
        )

