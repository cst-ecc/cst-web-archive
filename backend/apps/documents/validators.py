from pathlib import Path

from django.conf import settings
from django.core.exceptions import ValidationError


ALLOWED_DOCUMENT_EXTENSIONS = {
    ".pdf",
    ".doc",
    ".docx",
    ".xls",
    ".xlsx",
    ".ppt",
    ".pptx",
    ".odt",
    ".ods",
    ".odp",
}
ALLOWED_DOCUMENT_MIME_TYPES = {
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/vnd.oasis.opendocument.text",
    "application/vnd.oasis.opendocument.spreadsheet",
    "application/vnd.oasis.opendocument.presentation",
}


def validate_document_file(uploaded_file) -> None:
    if not uploaded_file:
        return

    suffix = Path(uploaded_file.name).suffix.lower()
    if suffix not in ALLOWED_DOCUMENT_EXTENSIONS:
        raise ValidationError(
            "Format non autorisé. Utilisez PDF, Word, Excel, PowerPoint ou OpenDocument."
        )

    max_mb = getattr(settings, "MAX_DOCUMENT_UPLOAD_MB", 100)
    max_bytes = max_mb * 1024 * 1024
    if uploaded_file.size > max_bytes:
        raise ValidationError(
            f"Le document dépasse la taille maximale de {max_mb} Mo."
        )

    content_type = getattr(uploaded_file, "content_type", "")
    if content_type and content_type not in ALLOWED_DOCUMENT_MIME_TYPES:
        raise ValidationError(
            "Le type MIME du fichier ne correspond pas à un document autorisé."
        )
