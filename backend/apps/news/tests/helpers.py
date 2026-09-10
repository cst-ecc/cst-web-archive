import io

from django.core.files.uploadedfile import SimpleUploadedFile
from PIL import Image


def test_image(name="test.jpg"):
    buffer = io.BytesIO()
    Image.new("RGB", (32, 24), "white").save(buffer, format="JPEG")
    return SimpleUploadedFile(
        name,
        buffer.getvalue(),
        content_type="image/jpeg",
    )
