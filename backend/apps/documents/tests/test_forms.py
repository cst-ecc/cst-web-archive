from django.test import TestCase
from django.utils import timezone

from apps.accounts.models import User
from apps.documents.forms import DocumentForm
from apps.documents.models import Document, DocumentCategory

from .helpers import test_pdf


class DocumentFormTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="editor@example.test",
            password="StrongPassword-123!",
        )
        self.category = DocumentCategory.objects.create(
            name="Rapports",
            slug="rapports",
        )

    def test_document_accepts_long_original_filename(self):
        long_name = (
            "Déroulement de la Rencontre d'information, d'échange et de partage "
            "avec le diocèse de France corrigé.pdf"
        )

        form = DocumentForm(
            data={
                "title": "Rencontre avec le diocèse de France",
                "reference": "DOC-FR-001",
                "category": self.category.pk,
                "new_category_name": "",
                "kind": "rapport",
                "summary": "Document de travail.",
                "date": "2026-09-10",
                "pages": "",
            },
            files={"file": test_pdf(name=long_name)},
            user=self.user,
        )

        self.assertTrue(form.is_valid(), form.errors.as_json())
        document = form.save(commit=False)
        document.author = self.user
        document.last_editor = self.user
        document.save()

        self.assertEqual(document.original_filename, long_name)
        self.assertLessEqual(len(document.file.name), 500)

    def test_existing_file_is_kept_when_editing_without_new_upload(self):
        document = Document.objects.create(
            title="Document existant",
            summary="Résumé",
            category=self.category,
            kind="rapport",
            date=timezone.localdate(),
            file=test_pdf(),
            original_filename="document.pdf",
            file_size=128,
            mime_type="application/pdf",
            author=self.user,
            last_editor=self.user,
        )
        original_file_name = document.file.name

        form = DocumentForm(
            data={
                "title": "Document existant modifié",
                "reference": "",
                "category": self.category.pk,
                "new_category_name": "",
                "kind": "rapport",
                "summary": "Résumé modifié",
                "date": "2026-09-10",
                "pages": "",
            },
            files={},
            instance=document,
            user=self.user,
        )

        self.assertTrue(form.is_valid(), form.errors.as_json())
        updated = form.save()
        self.assertEqual(updated.file.name, original_file_name)
