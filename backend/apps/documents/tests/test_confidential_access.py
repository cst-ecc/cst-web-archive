import re

from django.core import mail
from django.test import TestCase, override_settings
from django.urls import reverse
from django.utils import timezone

from apps.accounts.models import User
from apps.core.publication import PublicationStatus
from apps.documents.access import approve_access_request
from apps.documents.models import (
    Document,
    DocumentAccessGrant,
    DocumentAccessRequest,
    DocumentCategory,
    DocumentKind,
)

from .helpers import test_pdf


@override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
class ConfidentialDocumentAccessTests(TestCase):
    def setUp(self):
        self.manager = User.objects.create_user(
            email="manager@example.test",
            password="StrongPassword-123!",
        )
        self.category = DocumentCategory.objects.create(
            name="Rapports confidentiels",
            slug="rapports-confidentiels",
        )
        self.document = Document.objects.create(
            title="Rapport confidentiel",
            summary="Contenu réservé",
            reference="CONF-001",
            category=self.category,
            kind=DocumentKind.REPORT,
            date=timezone.localdate(),
            file=test_pdf("confidentiel.pdf"),
            original_filename="confidentiel.pdf",
            file_size=128,
            mime_type="application/pdf",
            status=PublicationStatus.PUBLISHED,
            author=self.manager,
            last_editor=self.manager,
            is_confidential=True,
        )

    def _request_access(self, email="reader@example.test"):
        response = self.client.post(
            reverse(
                "documents_api:request_access",
                kwargs={"slug": self.document.slug},
            ),
            data={
                "fullName": "Jean Lecteur",
                "email": email,
                "phone": "+2290100000000",
                "organization": "Paroisse test",
                "reason": "Consultation nécessaire pour les travaux institutionnels.",
            },
            content_type="application/json",
        )
        return response

    def test_confidential_document_hides_file_urls(self):
        response = self.client.get(
            reverse("documents_api:detail", kwargs={"slug": self.document.slug})
        )
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertTrue(payload["isConfidential"])
        self.assertFalse(payload["canRead"])
        self.assertIsNone(payload["fileUrl"])
        self.assertIsNone(payload["downloadUrl"])

    def test_confidential_document_public_content_is_blocked(self):
        response = self.client.get(
            reverse("documents_api:content", kwargs={"slug": self.document.slug})
        )
        self.assertEqual(response.status_code, 404)

    def test_access_request_is_created_and_duplicate_pending_is_reused(self):
        first = self._request_access()
        self.assertEqual(first.status_code, 201)
        self.assertEqual(DocumentAccessRequest.objects.count(), 1)

        second = self._request_access()
        self.assertEqual(second.status_code, 200)
        self.assertEqual(DocumentAccessRequest.objects.count(), 1)

    def test_otp_verification_unlocks_secure_content(self):
        request_response = self._request_access()
        self.assertEqual(request_response.status_code, 201)
        access_request = DocumentAccessRequest.objects.get()

        grant, raw_token = approve_access_request(
            access_request=access_request,
            reviewer=self.manager,
            duration_hours=24,
            max_opens=2,
        )
        self.assertIsInstance(grant, DocumentAccessGrant)
        self.assertNotEqual(grant.token_hash, raw_token)

        info_url = reverse(
            "documents_api:secure_access_info", kwargs={"token": raw_token}
        )
        info = self.client.get(info_url)
        self.assertEqual(info.status_code, 200)
        self.assertFalse(info.json()["verified"])

        otp_response = self.client.post(
            reverse("documents_api:secure_access_otp", kwargs={"token": raw_token})
        )
        self.assertEqual(otp_response.status_code, 200)
        self.assertEqual(len(mail.outbox), 1)

        match = re.search(r"\b(\d{6})\b", mail.outbox[0].body)
        self.assertIsNotNone(match)
        code = match.group(1)

        verify_response = self.client.post(
            reverse("documents_api:secure_access_verify", kwargs={"token": raw_token}),
            data={"code": code},
            content_type="application/json",
        )
        self.assertEqual(verify_response.status_code, 200)
        self.assertTrue(verify_response.json()["verified"])

        info = self.client.get(info_url)
        self.assertTrue(info.json()["verified"])
        self.assertEqual(info.json()["watermark"]["name"], "Jean Lecteur")

        content_response = self.client.get(
            reverse("documents_api:secure_content", kwargs={"token": raw_token})
        )
        self.assertEqual(content_response.status_code, 200)
        self.assertEqual(content_response["Cache-Control"], "private, no-store")

        grant.refresh_from_db()
        self.assertEqual(grant.open_count, 1)

    def test_making_document_public_revokes_existing_grant(self):
        response = self._request_access()
        self.assertEqual(response.status_code, 201)
        access_request = DocumentAccessRequest.objects.get()
        grant, raw_token = approve_access_request(
            access_request=access_request,
            reviewer=self.manager,
            duration_hours=24,
            max_opens=5,
        )
        pending_response = self._request_access(email="reader2@example.test")
        self.assertEqual(pending_response.status_code, 201)
        pending_request = DocumentAccessRequest.objects.get(email="reader2@example.test")

        self.document.is_confidential = False
        self.document.save(update_fields=["is_confidential", "updated_at"])

        grant.refresh_from_db()
        pending_request.refresh_from_db()
        self.assertIsNotNone(grant.revoked_at)
        self.assertEqual(pending_request.status, "refused")

        self.document.is_confidential = True
        self.document.save(update_fields=["is_confidential", "updated_at"])

        info = self.client.get(
            reverse("documents_api:secure_access_info", kwargs={"token": raw_token})
        )
        self.assertEqual(info.status_code, 410)
        self.assertEqual(info.json()["detail"], "revoked")

