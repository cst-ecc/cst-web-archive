from django.core.files.uploadedfile import SimpleUploadedFile


def test_pdf(name="document.pdf", content=b"%PDF-1.4\n%test\n"):
    return SimpleUploadedFile(name, content, content_type="application/pdf")
