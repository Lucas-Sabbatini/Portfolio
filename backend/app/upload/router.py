import logging

from botocore.exceptions import ClientError
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import Response

from app.auth.dependencies import get_current_admin
from app.upload import service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/upload", tags=["upload"])
public_router = APIRouter(tags=["public"])


@router.post("")
async def upload_image(
    file: UploadFile = File(...),
    _admin: dict[str, str] = Depends(get_current_admin),
) -> dict[str, str]:
    contents = await file.read()

    if len(contents) > service.MAX_IMAGE_SIZE_BYTES:
        raise HTTPException(status_code=422, detail="File exceeds 5 MB limit")

    mime = service.detect_image_mime(contents)
    if mime is None or mime not in service.ALLOWED_IMAGE_MIME_TYPES:
        raise HTTPException(status_code=422, detail="Invalid file type. Allowed: jpeg, png, webp")

    try:
        url = await service.save_cover_image(contents, mime)
    except ClientError as exc:
        logger.error("S3 upload failed", exc_info=True)
        raise HTTPException(status_code=500, detail="internal server error") from exc

    return {"url": url}


@router.post("/cv")
async def upload_cv(
    file: UploadFile = File(...),
    _admin: dict[str, str] = Depends(get_current_admin),
) -> dict[str, str]:
    contents = await file.read()

    if len(contents) > service.MAX_CV_SIZE_BYTES:
        raise HTTPException(status_code=422, detail="File exceeds 10 MB limit")
    if not service.is_pdf(contents):
        raise HTTPException(status_code=422, detail="Invalid file type. Expected PDF")

    try:
        await service.save_cv(contents)
    except ClientError as exc:
        logger.error("S3 CV upload failed", exc_info=True)
        raise HTTPException(status_code=500, detail="internal server error") from exc

    return {"url": "/cv"}


@router.delete("/cv", status_code=204)
async def delete_cv(_admin: dict[str, str] = Depends(get_current_admin)):
    try:
        deleted = await service.delete_cv()
    except ClientError as exc:
        logger.error("S3 CV delete failed", exc_info=True)
        raise HTTPException(status_code=500, detail="internal server error") from exc
    if not deleted:
        raise HTTPException(status_code=404, detail="CV not found")
    return Response(status_code=204)


@public_router.get("/cv")
async def serve_cv():
    data = await service.load_cv()
    if data is None:
        raise HTTPException(status_code=404, detail="CV not found")
    return Response(
        content=data,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'inline; filename="{service.CV_DOWNLOAD_FILENAME}"',
            "Cache-Control": "public, max-age=3600",
        },
    )


@router.get("/covers/{filename}")
async def serve_cover(filename: str):
    return await _serve_uploaded_file(f"covers/{filename}")


@router.get("/post-images/{filename}")
async def serve_post_image(filename: str):
    return await _serve_uploaded_file(f"post-images/{filename}")


async def _serve_uploaded_file(s3_key: str):
    result = await service.load_s3_object(s3_key)
    if result is None:
        raise HTTPException(status_code=404, detail="File not found")
    content, content_type = result
    return Response(
        content=content,
        media_type=content_type,
        headers={"Cache-Control": "public, max-age=31536000, immutable"},
    )
