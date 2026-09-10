import io

from django.core.files.uploadedfile import SimpleUploadedFile
from PIL import Image


def test_image(name="test.jpg", size=(48, 36)):
    buffer = io.BytesIO()
    Image.new("RGB", size, "white").save(buffer, format="JPEG")
    return SimpleUploadedFile(
        name,
        buffer.getvalue(),
        content_type="image/jpeg",
    )
