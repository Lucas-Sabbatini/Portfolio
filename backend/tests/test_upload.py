"""Tests for the upload endpoint (POST /api/upload)."""

from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from botocore.exceptions import ClientError
from httpx import AsyncClient

# Valid image bytes for each format
JPEG_BYTES = b"\xff\xd8\xff\xe0" + b"\x00" * 200
PNG_BYTES = b"\x89PNG\r\n\x1a\n" + b"\x00" * 200
WEBP_BYTES = b"RIFF\x00\x00\x00\x00WEBP" + b"\x00" * 200
PDF_BYTES = b"%PDF-1.4\n" + b"\x00" * 200


def _mock_aiofiles_open():
    """Return a patch for aiofiles.open that swallows writes."""
    mock_file = AsyncMock()
    mock_file.__aenter__ = AsyncMock(return_value=mock_file)
    mock_file.__aexit__ = AsyncMock(return_value=False)
    mock_file.write = AsyncMock()
    return patch("aiofiles.open", return_value=mock_file)


@pytest.mark.asyncio
async def test_upload_cover_success_jpeg(client: AsyncClient, mock_db, auth_cookie: str):
    with _mock_aiofiles_open(), patch("pathlib.Path.mkdir"):
        response = await client.post(
            "/api/upload",
            files={"file": ("photo.jpg", JPEG_BYTES, "image/jpeg")},
            cookies={"access_token": auth_cookie},
        )

    assert response.status_code == 200
    assert response.json()["url"].endswith(".jpg")
    assert "/uploads/covers/" in response.json()["url"]


@pytest.mark.asyncio
async def test_upload_cover_success_png(client: AsyncClient, mock_db, auth_cookie: str):
    with _mock_aiofiles_open(), patch("pathlib.Path.mkdir"):
        response = await client.post(
            "/api/upload",
            files={"file": ("photo.png", PNG_BYTES, "image/png")},
            cookies={"access_token": auth_cookie},
        )

    assert response.status_code == 200
    assert response.json()["url"].endswith(".png")


@pytest.mark.asyncio
async def test_upload_cover_success_webp(client: AsyncClient, mock_db, auth_cookie: str):
    with _mock_aiofiles_open(), patch("pathlib.Path.mkdir"):
        response = await client.post(
            "/api/upload",
            files={"file": ("photo.webp", WEBP_BYTES, "image/webp")},
            cookies={"access_token": auth_cookie},
        )

    assert response.status_code == 200
    assert response.json()["url"].endswith(".webp")


@pytest.mark.asyncio
async def test_upload_cover_exceeds_size_limit(client: AsyncClient, mock_db, auth_cookie: str):
    big_jpeg = b"\xff\xd8\xff\xe0" + b"\x00" * (5 * 1024 * 1024 + 1)
    response = await client.post(
        "/api/upload",
        files={"file": ("big.jpg", big_jpeg, "image/jpeg")},
        cookies={"access_token": auth_cookie},
    )

    assert response.status_code == 422
    assert "5 MB" in response.json()["detail"]


@pytest.mark.asyncio
async def test_upload_cover_invalid_mime(client: AsyncClient, mock_db, auth_cookie: str):
    response = await client.post(
        "/api/upload",
        files={"file": ("file.bin", b"not an image at all", "application/octet-stream")},
        cookies={"access_token": auth_cookie},
    )

    assert response.status_code == 422
    assert "Invalid file type" in response.json()["detail"]


@pytest.mark.asyncio
async def test_upload_cover_unauthenticated(client: AsyncClient, mock_db):
    response = await client.post(
        "/api/upload",
        files={"file": ("photo.jpg", JPEG_BYTES, "image/jpeg")},
    )

    assert response.status_code == 401


@pytest.mark.asyncio
async def test_upload_cv_success(client: AsyncClient, mock_db, auth_cookie: str):
    with _mock_aiofiles_open(), patch("pathlib.Path.mkdir"):
        response = await client.post(
            "/api/upload/cv",
            files={"file": ("cv.pdf", PDF_BYTES, "application/pdf")},
            cookies={"access_token": auth_cookie},
        )

    assert response.status_code == 200
    assert response.json() == {"url": "/api/upload/cv"}


@pytest.mark.asyncio
async def test_upload_cv_exceeds_size_limit(client: AsyncClient, mock_db, auth_cookie: str):
    big_pdf = b"%PDF-1.4\n" + b"\x00" * (10 * 1024 * 1024 + 1)
    response = await client.post(
        "/api/upload/cv",
        files={"file": ("big.pdf", big_pdf, "application/pdf")},
        cookies={"access_token": auth_cookie},
    )

    assert response.status_code == 422
    assert "10 MB" in response.json()["detail"]


@pytest.mark.asyncio
async def test_upload_cv_invalid_type(client: AsyncClient, mock_db, auth_cookie: str):
    response = await client.post(
        "/api/upload/cv",
        files={"file": ("cv.pdf", b"not a pdf at all", "application/pdf")},
        cookies={"access_token": auth_cookie},
    )

    assert response.status_code == 422
    assert "Expected PDF" in response.json()["detail"]


@pytest.mark.asyncio
async def test_upload_cv_unauthenticated(client: AsyncClient, mock_db):
    response = await client.post(
        "/api/upload/cv",
        files={"file": ("cv.pdf", PDF_BYTES, "application/pdf")},
    )

    assert response.status_code == 401


@pytest.mark.asyncio
async def test_serve_cv_local_success(client: AsyncClient, mock_db, tmp_path, monkeypatch):
    cv_dir = tmp_path / "cv"
    cv_dir.mkdir()
    (cv_dir / "cv.pdf").write_bytes(PDF_BYTES)

    from app.config import get_settings

    get_settings.cache_clear()
    monkeypatch.setenv("UPLOAD_DIR", str(tmp_path))
    get_settings.cache_clear()

    response = await client.get("/api/upload/cv")

    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    assert "inline" in response.headers["content-disposition"]
    assert response.content == PDF_BYTES


@pytest.mark.asyncio
async def test_serve_cv_local_missing(client: AsyncClient, mock_db, tmp_path, monkeypatch):
    from app.config import get_settings

    get_settings.cache_clear()
    monkeypatch.setenv("UPLOAD_DIR", str(tmp_path))
    get_settings.cache_clear()

    response = await client.get("/api/upload/cv")

    assert response.status_code == 404


@pytest.mark.asyncio
async def test_serve_cv_s3_not_found(client: AsyncClient, mock_db, monkeypatch):
    from app.config import get_settings

    get_settings.cache_clear()
    monkeypatch.setenv("S3_BUCKET_NAME", "test-bucket")
    get_settings.cache_clear()

    s3_client = MagicMock()
    s3_client.get_object.side_effect = ClientError(
        {"Error": {"Code": "NoSuchKey", "Message": "not found"}}, "GetObject"
    )
    with patch("app.upload.service.get_s3_client", return_value=s3_client):
        response = await client.get("/api/upload/cv")

    assert response.status_code == 404


@pytest.mark.asyncio
async def test_serve_cv_s3_success(client: AsyncClient, mock_db, monkeypatch):
    from app.config import get_settings

    get_settings.cache_clear()
    monkeypatch.setenv("S3_BUCKET_NAME", "test-bucket")
    get_settings.cache_clear()

    body_stream = MagicMock()
    body_stream.read.return_value = PDF_BYTES
    s3_client = MagicMock()
    s3_client.get_object.return_value = {"Body": body_stream}
    with patch("app.upload.service.get_s3_client", return_value=s3_client):
        response = await client.get("/api/upload/cv")

    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    assert "inline" in response.headers["content-disposition"]
    assert "lucas-janot-cv.pdf" in response.headers["content-disposition"]
    assert response.content == PDF_BYTES
