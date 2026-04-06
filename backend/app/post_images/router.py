import re
import uuid
from pathlib import Path
from typing import Annotated

import aiofiles
from fastapi import APIRouter, Depends, File, Form, HTTPException, Response, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_admin
from app.config import get_settings
from app.database import get_session
from app.post_images import service
from app.post_images.schemas import PostImageResponse
from app.upload.router import ALLOWED_MIME_TYPES, MAX_SIZE_BYTES, detect_mime

router = APIRouter(prefix="/api/posts/{post_id}/images", tags=["post-images"])

DbSession = Annotated[AsyncSession, Depends(get_session)]
AdminDep = Annotated[dict[str, str], Depends(get_current_admin)]


def _sanitize_key(filename: str) -> str:
    name = Path(filename).stem.lower().strip()
    name = re.sub(r"[^\w\s-]", "", name)
    name = re.sub(r"[\s_-]+", "-", name)
    return re.sub(r"^-+|-+$", "", name) or "image"


@router.get("", response_model=list[PostImageResponse])
async def list_post_images(
    post_id: str,
    session: DbSession,
    _admin: AdminDep,
):
    rows = await service.list_images(session, post_id)
    return [PostImageResponse.model_validate(r) for r in rows]


@router.post("", response_model=PostImageResponse, status_code=201)
async def upload_post_image(
    post_id: str,
    file: UploadFile = File(...),
    key: str | None = Form(None),
    session: DbSession = None,  # type: ignore[assignment]
    _admin: AdminDep = None,  # type: ignore[assignment]
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
    async with aiofiles.open(dest, "wb") as f:
        await f.write(contents)

    url = f"/uploads/post-images/{filename}"
    row = await service.create_image(session, post_id, key, url)
    return PostImageResponse.model_validate(row)


@router.delete("/{image_id}", status_code=204)
async def delete_post_image(
    post_id: str,
    image_id: str,
    session: DbSession,
    _admin: AdminDep,
):
    url = await service.delete_image(session, post_id, image_id)
    if url is None:
        raise HTTPException(status_code=404, detail="Image not found")

    # Remove file from disk — url is like /uploads/post-images/uuid.ext
    settings = get_settings()
    relative = url.removeprefix("/uploads/")
    upload_root = Path(settings.upload_dir).resolve()
    file_path = (upload_root / relative).resolve()
    if not str(file_path).startswith(str(upload_root)):
        raise HTTPException(status_code=400, detail="Invalid path")
    if file_path.exists():
        file_path.unlink()

    return Response(status_code=204)
