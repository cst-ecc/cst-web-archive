from django.test import TestCase
from django.urls import reverse
from django.utils import timezone

from apps.accounts.models import User
from apps.audit.models import AuditAction, AuditLog
from apps.core.publication import PublicationStatus
from apps.documents.models import Document, DocumentCategory, DocumentKind

from .helpers import test_pdf


class PublicDocumentApiTests(TestCase):
    def setUp(self):
        self.author = User.objects.create_user(
            email="author@example.test",
            password="StrongPassword-123!",
        )
        self.category = DocumentCategory.objects.create(
            name="Rapports",
            slug="rapports",
            order=1,
        )

    def _document(self, *, title, status):
        return Document.objects.create(
            title=title,
            summary=f"Résumé {title}",
            reference="REF-001",
            category=self.category,
            kind=DocumentKind.REPORT,
            date=timezone.localdate(),
            file=test_pdf(),
            original_filename="document.pdf",
            file_size=128,
            mime_type="application/pdf",
            status=status,
            author=self.author,
            last_editor=self.author,
        )

    def test_list_exposes_only_published_documents(self):
        published = self._document(title="Publié", status=PublicationStatus.PUBLISHED)
        self._document(title="Brouillon", status=PublicationStatus.DRAFT)

        response = self.client.get(reverse("documents_api:list"))

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertIsInstance(payload, list)
        self.assertEqual(len(payload), 1)
        self.assertEqual(payload[0]["slug"], published.slug)
        self.assertEqual(payload[0]["status"], "publie")
        self.assertEqual(payload[0]["categorySlug"], "rapports")

    def test_detail_shape_matches_frontend_document(self):
        document = self._document(title="Document API", status=PublicationStatus.PUBLISHED)

        response = self.client.get(
            reverse("documents_api:detail", kwargs={"slug": document.slug})
        )

        self.assertEqual(response.status_code, 200)
        payload = response.json()

        self.assertEqual(payload["title"], "Document API")
        self.assertEqual(payload["kind"], "rapport")
        self.assertTrue(payload["fileUrl"].endswith("/content/"))
        self.assertTrue(payload["downloadUrl"].endswith("/download/"))
        self.assertFalse(payload["isConfidential"])
        self.assertTrue(payload["canRead"])
        self.assertEqual(payload["openCount"], 0)

    def test_draft_detail_is_not_public(self):
        document = self._document(title="Privé", status=PublicationStatus.DRAFT)

        response = self.client.get(
            reverse("documents_api:detail", kwargs={"slug": document.slug})
        )

        self.assertEqual(response.status_code, 404)

    def test_view_endpoint_counts_openings_and_audits_source(self):
        document = self._document(title="Document lu", status=PublicationStatus.PUBLISHED)

        response = self.client.post(
            reverse("documents_api:view", kwargs={"slug": document.slug}) + "?source=/sessions/6"
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["openCount"], 1)

        document.refresh_from_db()
        self.assertEqual(document.open_count, 1)

        log = AuditLog.objects.filter(
            action=AuditAction.DOCUMENT_OPENED,
            target_id=str(document.pk),
        ).latest("created_at")
        self.assertEqual(log.metadata["source"], "/sessions/6")
        self.assertEqual(log.metadata["open_count"], 1)

    def test_view_endpoint_counts_each_open_request(self):
        document = self._document(title="Document multiple", status=PublicationStatus.PUBLISHED)
        url = reverse("documents_api:view", kwargs={"slug": document.slug})

        self.client.post(url)
        response = self.client.post(url)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["openCount"], 2)
        document.refresh_from_db()
        self.assertEqual(document.open_count, 2)

    def test_view_endpoint_rejects_unpublished_document(self):
        document = self._document(title="Document privé", status=PublicationStatus.DRAFT)

        response = self.client.post(
            reverse("documents_api:view", kwargs={"slug": document.slug})
        )

        self.assertEqual(response.status_code, 404)

