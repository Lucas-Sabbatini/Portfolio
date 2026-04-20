import logging
import re
from pathlib import Path
from typing import Annotated

from botocore.exceptions import ClientError
from fastapi import APIRouter, Depends, File, Form, HTTPException, Response, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_admin
from app.database import get_session
from app.post_images import service
from app.post_images.schemas import PostImageResponse
from app.upload import service as upload_service

logger = logging.getLogger(__name__)

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

    if len(contents) > upload_service.MAX_IMAGE_SIZE_BYTES:
        raise HTTPException(status_code=422, detail="File exceeds 5 MB limit")

    mime = upload_service.detect_image_mime(contents)
    if mime is None or mime not in upload_service.ALLOWED_IMAGE_MIME_TYPES:
        raise HTTPException(status_code=422, detail="Invalid file type. Allowed: jpeg, png, webp")

    if not key:
        key = _sanitize_key(file.filename or "image")

    try:
        url = await upload_service.save_post_image(contents, mime)
    except ClientError as exc:
        logger.error("S3 upload failed for post image", exc_info=True)
        raise HTTPException(status_code=500, detail="internal server error") from exc

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

    try:
        await upload_service.delete_uploaded_file(url)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return Response(status_code=204)
