import logging
import uuid
from pathlib import Path

import aiofiles
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile

from app.auth.dependencies import get_current_admin
from app.config import get_settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/upload", tags=["upload"])

ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_SIZE_BYTES = 5 * 1024 * 1024  # 5 MB


def detect_mime(data: bytes) -> str | None:
    if data[:3] == b"\xff\xd8\xff":
        return "image/jpeg"
    if data[:4] == b"\x89PNG":
        return "image/png"
    if data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        return "image/webp"
    return None


@router.post("")
async def upload_file(
    file: UploadFile = File(...),
    _admin: dict[str, str] = Depends(get_current_admin),
) -> dict[str, str]:
    contents = await file.read()

    if len(contents) > MAX_SIZE_BYTES:
        raise HTTPException(status_code=422, detail="File exceeds 5 MB limit")

    mime = detect_mime(contents)
    if mime is None or mime not in ALLOWED_MIME_TYPES:
        raise HTTPException(status_code=422, detail="Invalid file type. Allowed: jpeg, png, webp")

    ext_map = {"image/jpeg": "jpg", "image/png": "png", "image/webp": "webp"}
    ext = ext_map[mime]
    filename = f"{uuid.uuid4()}.{ext}"

    try:
        settings = get_settings()
        covers_dir = Path(settings.upload_dir) / "covers"
        covers_dir.mkdir(parents=True, exist_ok=True)
        dest = covers_dir / filename
        async with aiofiles.open(dest, "wb") as f:
            await f.write(contents)
        logger.info("Uploaded file: %s", filename)
        return {"url": f"/uploads/covers/{filename}"}
    except Exception as exc:
        logger.error("Error saving uploaded file", exc_info=True)
        raise HTTPException(status_code=500, detail="internal server error") from exc
