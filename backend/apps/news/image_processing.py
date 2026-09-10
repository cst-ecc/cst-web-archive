from __future__ import annotations

import io
import uuid

from django.core.files.base import ContentFile
from PIL import Image, ImageOps, UnidentifiedImageError

from .validators import validate_news_image


MAX_COVER_DIMENSION = 2400
WEBP_QUALITY = 82
JPEG_QUALITY = 84


def compress_news_cover_image(uploaded_file):
    """
    Compresse l'image de couverture avant stockage.

    Objectif :
    - accepter les photos lourdes de téléphone jusqu'à la limite configurée ;
    - corriger l'orientation EXIF ;
    - réduire la dimension maximale ;
    - stocker un fichier webp lorsque Pillow le permet ;
    - fallback JPEG si WebP n'est pas disponible.

    Le fichier d'origine n'est jamais conservé sous son nom client.
    """
    if not uploaded_file:
        return uploaded_file

    validate_news_image(uploaded_file)

    try:
        uploaded_file.seek(0)
        image = Image.open(uploaded_file)
        image.verify()
    except (UnidentifiedImageError, OSError) as exc:
        raise ValueError("Le fichier transmis n'est pas une image valide.") from exc

    uploaded_file.seek(0)
    image = Image.open(uploaded_file)
    image = ImageOps.exif_transpose(image)

    has_alpha = image.mode in {"RGBA", "LA"} or "transparency" in image.info

    if has_alpha:
        image = image.convert("RGBA")
    else:
        image = image.convert("RGB")

    try:
        resampling = Image.Resampling.LANCZOS
    except AttributeError:  # pragma: no cover - compat anciennes versions Pillow
        resampling = Image.LANCZOS

    image.thumbnail(
        (MAX_COVER_DIMENSION, MAX_COVER_DIMENSION),
        resampling,
    )

    output = io.BytesIO()
    extension = "webp"

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

    output.seek(0)
    return ContentFile(
        output.getvalue(),
        name=f"{uuid.uuid4().hex}.{extension}",
    )
