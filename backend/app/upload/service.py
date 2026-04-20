import logging
import uuid
from pathlib import Path

import aiofiles
import boto3
from botocore.exceptions import ClientError

from app.config import get_settings

logger = logging.getLogger(__name__)

ALLOWED_IMAGE_MIME_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024  # 5 MB

ALLOWED_CV_MIME = "application/pdf"
MAX_CV_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB
CV_S3_KEY = "cv/cv.pdf"
CV_DOWNLOAD_FILENAME = "lucas-janot-cv.pdf"

_IMAGE_EXT = {"image/jpeg": "jpg", "image/png": "png", "image/webp": "webp"}


def detect_image_mime(data: bytes) -> str | None:
    if data[:3] == b"\xff\xd8\xff":
        return "image/jpeg"
    if data[:4] == b"\x89PNG":
        return "image/png"
    if data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        return "image/webp"
    return None


def is_pdf(data: bytes) -> bool:
    return data[:5] == b"%PDF-"


def get_s3_client():
    settings = get_settings()
    return boto3.client("s3", region_name=settings.aws_default_region)


async def _save_image(contents: bytes, mime: str, prefix: str) -> str:
    filename = f"{uuid.uuid4()}.{_IMAGE_EXT[mime]}"
    s3_key = f"{prefix}/{filename}"
    settings = get_settings()

    if settings.s3_bucket_name:
        get_s3_client().put_object(
            Bucket=settings.s3_bucket_name,
            Key=s3_key,
            Body=contents,
            ContentType=mime,
        )
        logger.info("Uploaded to S3: %s", s3_key)
    else:
        local_dir = Path(settings.upload_dir) / prefix
        local_dir.mkdir(parents=True, exist_ok=True)
        async with aiofiles.open(local_dir / filename, "wb") as f:
            await f.write(contents)
        logger.info("Uploaded locally: %s/%s", prefix, filename)

    return f"/uploads/{prefix}/{filename}"


async def save_cover_image(contents: bytes, mime: str) -> str:
    return await _save_image(contents, mime, "covers")


async def save_post_image(contents: bytes, mime: str) -> str:
    return await _save_image(contents, mime, "post-images")


async def delete_uploaded_file(url: str) -> None:
    """Delete a file by its public /uploads/... URL.

    Raises ValueError if the derived path escapes the uploads root (traversal
    guard). No-op when the underlying file is already missing.
    """
    settings = get_settings()
    relative = url.removeprefix("/uploads/")

    if settings.s3_bucket_name:
        try:
            get_s3_client().delete_object(Bucket=settings.s3_bucket_name, Key=relative)
            logger.info("Deleted from S3: %s", relative)
        except ClientError:
            logger.error("S3 delete failed: %s", relative, exc_info=True)
        return

    upload_root = Path(settings.upload_dir).resolve()
    file_path = (upload_root / relative).resolve()
    if not str(file_path).startswith(str(upload_root)):
        raise ValueError("Invalid path")
    if file_path.exists():
        file_path.unlink()


async def save_cv(contents: bytes) -> None:
    settings = get_settings()

    if settings.s3_bucket_name:
        get_s3_client().put_object(
            Bucket=settings.s3_bucket_name,
            Key=CV_S3_KEY,
            Body=contents,
            ContentType=ALLOWED_CV_MIME,
        )
        logger.info("Uploaded CV to S3: %s", CV_S3_KEY)
    else:
        cv_dir = Path(settings.upload_dir) / "cv"
        cv_dir.mkdir(parents=True, exist_ok=True)
        async with aiofiles.open(cv_dir / "cv.pdf", "wb") as f:
            await f.write(contents)
        logger.info("Uploaded CV locally")


async def delete_cv() -> bool:
    """Returns True when a CV existed and was deleted, False when none existed."""
    settings = get_settings()

    if settings.s3_bucket_name:
        client = get_s3_client()
        try:
            client.head_object(Bucket=settings.s3_bucket_name, Key=CV_S3_KEY)
        except ClientError:
            return False
        client.delete_object(Bucket=settings.s3_bucket_name, Key=CV_S3_KEY)
        logger.info("Deleted CV from S3")
        return True

    local_path = Path(settings.upload_dir) / "cv" / "cv.pdf"
    if not local_path.exists():
        return False
    local_path.unlink()
    logger.info("Deleted CV locally")
    return True


async def load_cv() -> bytes | None:
    settings = get_settings()

    if settings.s3_bucket_name:
        try:
            obj = get_s3_client().get_object(
                Bucket=settings.s3_bucket_name,
                Key=CV_S3_KEY,
            )
        except ClientError:
            return None
        return obj["Body"].read()

    local_path = Path(settings.upload_dir) / "cv" / "cv.pdf"
    if not local_path.exists():
        return None
    return local_path.read_bytes()


async def load_s3_object(s3_key: str) -> tuple[bytes, str] | None:
    settings = get_settings()

    if not settings.s3_bucket_name:
        # Local-dev: StaticFiles mount serves /uploads/* directly.
        return None

    try:
        response = get_s3_client().get_object(
            Bucket=settings.s3_bucket_name,
            Key=s3_key,
        )
    except ClientError:
        return None
    return response["Body"].read(), response["ContentType"]
