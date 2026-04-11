import logging
import uuid

import boto3
from botocore.exceptions import ClientError
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


def _get_s3_client():
    settings = get_settings()
    return boto3.client("s3", region_name=settings.aws_default_region)


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
    s3_key = f"covers/{filename}"

    settings = get_settings()

    if settings.s3_bucket_name:
        try:
            s3 = _get_s3_client()
            s3.put_object(
                Bucket=settings.s3_bucket_name,
                Key=s3_key,
                Body=contents,
                ContentType=mime,
            )
            logger.info("Uploaded to S3: %s", s3_key)
        except ClientError as exc:
            logger.error("S3 upload failed", exc_info=True)
            raise HTTPException(status_code=500, detail="internal server error") from exc
    else:
        # Fallback to local filesystem (development)
        from pathlib import Path

        import aiofiles

        covers_dir = Path(settings.upload_dir) / "covers"
        covers_dir.mkdir(parents=True, exist_ok=True)
        dest = covers_dir / filename
        async with aiofiles.open(dest, "wb") as f:
            await f.write(contents)
        logger.info("Uploaded locally: %s", filename)

    return {"url": f"/uploads/covers/{filename}"}


@router.get("/covers/{filename}")
async def serve_cover(filename: str) -> bytes:
    """Serve cover images from S3 or local filesystem."""
    return await _serve_s3_file(f"covers/{filename}")


@router.get("/post-images/{filename}")
async def serve_post_image(filename: str) -> bytes:
    """Serve post images from S3 or local filesystem."""
    return await _serve_s3_file(f"post-images/{filename}")


async def _serve_s3_file(s3_key: str):
    settings = get_settings()

    if settings.s3_bucket_name:
        try:
            s3 = _get_s3_client()
            response = s3.get_object(
                Bucket=settings.s3_bucket_name,
                Key=s3_key,
            )
            from fastapi.responses import Response

            return Response(
                content=response["Body"].read(),
                media_type=response["ContentType"],
                headers={"Cache-Control": "public, max-age=31536000, immutable"},
            )
        except ClientError as exc:
            raise HTTPException(status_code=404, detail="File not found") from exc
    else:
        # Local fallback handled by StaticFiles mount
        raise HTTPException(status_code=404, detail="File not found")
