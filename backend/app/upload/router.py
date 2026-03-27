import logging
import uuid

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File

from app.auth.dependencies import get_current_admin
from app.database import get_supabase

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/upload", tags=["upload"])

ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_SIZE_BYTES = 5 * 1024 * 1024  # 5 MB

# Magic bytes for MIME detection
MAGIC_BYTES: dict[bytes, str] = {
    b"\xff\xd8\xff": "image/jpeg",
    b"\x89PNG": "image/png",
    b"RIFF": "image/webp",  # partial — we check further below
}


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
        supabase = get_supabase()
        result = supabase.storage.from_("covers").upload(
            path=filename,
            file=contents,
            file_options={"content-type": mime},
        )
        public_url = supabase.storage.from_("covers").get_public_url(filename)
        logger.info("Uploaded file: %s", filename)
        return {"url": public_url}
    except Exception:
        logger.error("Error uploading file", exc_info=True)
        raise HTTPException(status_code=500, detail="internal server error")
