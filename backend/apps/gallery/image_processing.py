from __future__ import annotations

import io
import uuid
from dataclasses import dataclass

from django.core.files.base import ContentFile
from django.core.exceptions import ValidationError
from PIL import Image, ImageOps, UnidentifiedImageError

from .validators import validate_gallery_image


MAX_GALLERY_DIMENSION = 2200
WEBP_QUALITY = 82
JPEG_QUALITY = 84


@dataclass(frozen=True)
class ProcessedGalleryImage:
    file: ContentFile
    width: int
    height: int
    file_size: int
    mime_type: str
    original_filename: str


def process_gallery_image(uploaded_file) -> ProcessedGalleryImage:
    validate_gallery_image(uploaded_file)

    original_filename = getattr(uploaded_file, "name", "")[:255]

    try:
        uploaded_file.seek(0)
        image = Image.open(uploaded_file)
        image.verify()
    except (UnidentifiedImageError, OSError) as exc:
        raise ValidationError("Le fichier transmis n'est pas une image valide.") from exc

    uploaded_file.seek(0)
    image = Image.open(uploaded_file)
    image = ImageOps.exif_transpose(image)

    has_alpha = image.mode in {"RGBA", "LA"} or "transparency" in image.info
    image = image.convert("RGBA" if has_alpha else "RGB")

    try:
        resampling = Image.Resampling.LANCZOS
    except AttributeError:  # pragma: no cover
        resampling = Image.LANCZOS

    image.thumbnail((MAX_GALLERY_DIMENSION, MAX_GALLERY_DIMENSION), resampling)

    output = io.BytesIO()
    extension = "webp"
    mime_type = "image/webp"

    try:
        image.save(
            output,
            format="WEBP",
            quality=WEBP_QUALITY,
            method=6,
            optimize=True,
        )
    except Exception:
        output = io.BytesIO()
        extension = "jpg"
        mime_type = "image/jpeg"

        if image.mode == "RGBA":
            background = Image.new("RGB", image.size, (255, 255, 255))
            background.paste(image, mask=image.getchannel("A"))
            image = background
        else:
            image = image.convert("RGB")

        image.save(
            output,
            format="JPEG",
            quality=JPEG_QUALITY,
            optimize=True,
            progressive=True,
        )

    payload = output.getvalue()
    width, height = image.size

    return ProcessedGalleryImage(
        file=ContentFile(payload, name=f"{uuid.uuid4().hex}.{extension}"),
        width=width,
        height=height,
        file_size=len(payload),
        mime_type=mime_type,
        original_filename=original_filename,
    )
