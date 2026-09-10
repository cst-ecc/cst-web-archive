from django.contrib.staticfiles import finders
from django.test import TestCase


class BackofficeLoaderAssetsTests(TestCase):
    def test_loader_and_upload_assets_are_available(self):
        self.assertIsNotNone(finders.find("backoffice/js/loading.js"))
        self.assertIsNotNone(finders.find("backoffice/js/uploads.js"))
        self.assertIsNotNone(finders.find("backoffice/js/gallery_chunk_upload.js"))
        self.assertIsNotNone(finders.find("backoffice/css/loader.css"))
        self.assertIsNotNone(finders.find("backoffice/css/documents.css"))
