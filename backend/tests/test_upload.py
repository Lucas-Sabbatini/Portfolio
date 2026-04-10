"""Tests for the upload endpoint (POST /api/upload)."""

from unittest.mock import AsyncMock, patch

import pytest
from httpx import AsyncClient

# Valid image bytes for each format
JPEG_BYTES = b"\xff\xd8\xff\xe0" + b"\x00" * 200
PNG_BYTES = b"\x89PNG\r\n\x1a\n" + b"\x00" * 200
WEBP_BYTES = b"RIFF\x00\x00\x00\x00WEBP" + b"\x00" * 200


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
