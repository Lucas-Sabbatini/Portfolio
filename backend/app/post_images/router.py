import re
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, Response, UploadFile

from app.auth.dependencies import get_current_admin
from app.config import get_settings
from app.database import get_session
from app.post_images import service
from app.post_images.schemas import PostImageResponse
from app.upload.router import ALLOWED_MIME_TYPES, MAX_SIZE_BYTES, detect_mime

router = APIRouter(prefix="/api/posts/{post_id}/images", tags=["post-images"])


def _sanitize_key(filename: str) -> str:
    name = Path(filename).stem.lower().strip()
    name = re.sub(r"[^\w\s-]", "", name)
    name = re.sub(r"[\s_-]+", "-", name)
    return re.sub(r"^-+|-+$", "", name) or "image"


@router.get("", response_model=list[PostImageResponse])
async def list_post_images(
    post_id: str,
    session=Depends(get_session),
    _admin: dict[str, str] = Depends(get_current_admin),
):
    return await service.list_images(session, post_id)


@router.post("", response_model=PostImageResponse, status_code=201)
async def upload_post_image(
    post_id: str,
    file: UploadFile = File(...),
    key: str | None = Form(None),
    session=Depends(get_session),
    _admin: dict[str, str] = Depends(get_current_admin),
):
    contents = await file.read()

    if len(contents) > MAX_SIZE_BYTES:
        raise HTTPException(status_code=422, detail="File exceeds 5 MB limit")

    mime = detect_mime(contents)
    if mime is None or mime not in ALLOWED_MIME_TYPES:
        raise HTTPException(status_code=422, detail="Invalid file type. Allowed: jpeg, png, webp")

    ext_map = {"image/jpeg": "jpg", "image/png": "png", "image/webp": "webp"}
    ext = ext_map[mime]
    filename = f"{uuid.uuid4()}.{ext}"

    if not key:
        key = _sanitize_key(file.filename or "image")

    settings = get_settings()
    images_dir = Path(settings.upload_dir) / "post-images"
    images_dir.mkdir(parents=True, exist_ok=True)
    dest = images_dir / filename
    dest.write_bytes(contents)

    url = f"/uploads/post-images/{filename}"
    return await service.create_image(session, post_id, key, url)


@router.delete("/{image_id}", status_code=204)
async def delete_post_image(
    post_id: str,
    image_id: str,
    session=Depends(get_session),
    _admin: dict[str, str] = Depends(get_current_admin),
):
    url = await service.delete_image(session, image_id)
    if url is None:
        raise HTTPException(status_code=404, detail="Image not found")

    # Remove file from disk — url is like /uploads/post-images/uuid.ext
    settings = get_settings()
    relative = url.removeprefix("/uploads/")
    file_path = Path(settings.upload_dir) / relative
    if file_path.exists():
        file_path.unlink()

    return Response(status_code=204)
