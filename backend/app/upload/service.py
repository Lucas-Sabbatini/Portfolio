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


async def save_cover_image(contents: bytes, mime: str) -> str:
    filename = f"{uuid.uuid4()}.{_IMAGE_EXT[mime]}"
    s3_key = f"covers/{filename}"
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
        covers_dir = Path(settings.upload_dir) / "covers"
        covers_dir.mkdir(parents=True, exist_ok=True)
        async with aiofiles.open(covers_dir / filename, "wb") as f:
            await f.write(contents)
        logger.info("Uploaded locally: %s", filename)

    return f"/uploads/covers/{filename}"


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
