import uuid
from pathlib import Path

from fastapi import HTTPException, UploadFile, status

from app.config import get_settings

settings = get_settings()
ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
EXTENSIONS = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
}


def _avatar_dir() -> Path:
    path = Path(settings.avatar_upload_dir)
    path.mkdir(parents=True, exist_ok=True)
    return path


def avatar_file_path(user_id: uuid.UUID) -> Path | None:
    directory = _avatar_dir()
    for path in directory.glob(f"{user_id}.*"):
        return path
    return None


async def save_avatar(user_id: uuid.UUID, file: UploadFile) -> str:
    content_type = file.content_type or ""
    if content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Avatar must be a JPEG, PNG, WebP, or GIF image",
        )

    data = await file.read()
    if not data:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Empty file")
    if len(data) > settings.max_avatar_bytes:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Image is too large (max 5MB)")

    directory = _avatar_dir()
    for existing in directory.glob(f"{user_id}.*"):
        existing.unlink(missing_ok=True)

    extension = EXTENSIONS[content_type]
    path = directory / f"{user_id}{extension}"
    path.write_bytes(data)
    return str(path)
