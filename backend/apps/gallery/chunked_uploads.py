from __future__ import annotations

import shutil
from pathlib import Path

from django.conf import settings
from django.core.exceptions import ValidationError


def upload_root() -> Path:
    return Path(settings.MEDIA_ROOT) / "_tmp" / "gallery_uploads"


def session_dir(session) -> Path:
    return upload_root() / str(session.upload_id)


def chunk_path(session, index: int) -> Path:
    return session_dir(session) / f"{index:08d}.part"


def assembled_path(session) -> Path:
    return session_dir(session) / "assembled.original"


def write_chunk(session, *, index: int, uploaded_file) -> int:
    if index < 0 or index >= session.total_chunks:
        raise ValidationError("Index de morceau invalide.")

    max_chunk_mb = getattr(settings, "GALLERY_CHUNK_SIZE_MB", 8)
    max_chunk_bytes = max_chunk_mb * 1024 * 1024

    if uploaded_file.size > max_chunk_bytes:
        raise ValidationError(
            f"Le morceau dépasse {max_chunk_mb} Mo."
        )

    target_dir = session_dir(session)
    target_dir.mkdir(parents=True, exist_ok=True)

    target = chunk_path(session, index)
    temp_target = target.with_suffix(".tmp")

    with temp_target.open("wb") as destination:
        for piece in uploaded_file.chunks():
            destination.write(piece)

    temp_target.replace(target)
    return target.stat().st_size


def verify_all_chunks_present(session) -> None:
    missing = [
        index
        for index in range(session.total_chunks)
        if not chunk_path(session, index).exists()
    ]

    if missing:
        raise ValidationError(
            f"Upload incomplet. Morceau manquant : {missing[0] + 1}."
        )


def assemble_chunks(session) -> Path:
    verify_all_chunks_present(session)

    target = assembled_path(session)
    temp_target = target.with_suffix(".tmp")

    with temp_target.open("wb") as destination:
        for index in range(session.total_chunks):
            source = chunk_path(session, index)
            with source.open("rb") as chunk_file:
                shutil.copyfileobj(chunk_file, destination)

    temp_target.replace(target)

    actual_size = target.stat().st_size
    if actual_size != session.total_size:
        raise ValidationError(
            "La taille du fichier assemblé ne correspond pas à la taille annoncée."
        )

    return target


def cleanup_session_files(session) -> None:
    shutil.rmtree(session_dir(session), ignore_errors=True)
