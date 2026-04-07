"""Tests for post images endpoints."""

from datetime import UTC, datetime
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from httpx import AsyncClient

POST_ID = "00000000-0000-0000-0000-000000000001"
IMAGE_ROW = {
    "id": "00000000-0000-0000-0000-000000000099",
    "key": "hero",
    "url": "/uploads/post-images/abc.jpg",
    "post_id": POST_ID,
    "created_at": datetime(2024, 6, 1, tzinfo=UTC),
}

JPEG_BYTES = b"\xff\xd8\xff\xe0" + b"\x00" * 200


def _mock_aiofiles_open():
    mock_file = AsyncMock()
    mock_file.__aenter__ = AsyncMock(return_value=mock_file)
    mock_file.__aexit__ = AsyncMock(return_value=False)
    mock_file.write = AsyncMock()
    return patch("aiofiles.open", return_value=mock_file)


# ---------------------------------------------------------------------------
# LIST
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_list_post_images_authenticated(client: AsyncClient, mock_db, auth_cookie: str):
    with patch("app.post_images.service.list_images", new_callable=AsyncMock) as mock_list:
        mock_list.return_value = [IMAGE_ROW]
        response = await client.get(
            f"/api/posts/{POST_ID}/images",
            cookies={"access_token": auth_cookie},
        )

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["key"] == "hero"


@pytest.mark.asyncio
async def test_list_post_images_unauthenticated(client: AsyncClient, mock_db):
    response = await client.get(f"/api/posts/{POST_ID}/images")
    assert response.status_code == 401


# ---------------------------------------------------------------------------
# UPLOAD
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_upload_post_image_success(client: AsyncClient, mock_db, auth_cookie: str):
    with (
        _mock_aiofiles_open(),
        patch("app.post_images.router.Path.mkdir"),
        patch("app.post_images.service.create_image", new_callable=AsyncMock) as mock_create,
    ):
        mock_create.return_value = IMAGE_ROW
        response = await client.post(
            f"/api/posts/{POST_ID}/images",
            files={"file": ("photo.jpg", JPEG_BYTES, "image/jpeg")},
            data={"key": "hero"},
            cookies={"access_token": auth_cookie},
        )

    assert response.status_code == 201
    assert response.json()["key"] == "hero"
    mock_create.assert_called_once()


@pytest.mark.asyncio
async def test_upload_post_image_derives_key_from_filename(
    client: AsyncClient, mock_db, auth_cookie: str
):
    row = {**IMAGE_ROW, "key": "my-photo"}
    with (
        _mock_aiofiles_open(),
        patch("app.post_images.router.Path.mkdir"),
        patch("app.post_images.service.create_image", new_callable=AsyncMock) as mock_create,
    ):
        mock_create.return_value = row
        response = await client.post(
            f"/api/posts/{POST_ID}/images",
            files={"file": ("My Photo.jpg", JPEG_BYTES, "image/jpeg")},
            cookies={"access_token": auth_cookie},
        )

    assert response.status_code == 201
    # Verify the sanitized key was passed to create_image
    call_args = mock_create.call_args
    assert call_args[0][2] == "my-photo"  # positional arg: key


@pytest.mark.asyncio
async def test_upload_post_image_exceeds_size_limit(client: AsyncClient, mock_db, auth_cookie: str):
    big_jpeg = b"\xff\xd8\xff\xe0" + b"\x00" * (5 * 1024 * 1024 + 1)
    response = await client.post(
        f"/api/posts/{POST_ID}/images",
        files={"file": ("big.jpg", big_jpeg, "image/jpeg")},
        cookies={"access_token": auth_cookie},
    )

    assert response.status_code == 422
    assert "5 MB" in response.json()["detail"]


@pytest.mark.asyncio
async def test_upload_post_image_invalid_mime(client: AsyncClient, mock_db, auth_cookie: str):
    response = await client.post(
        f"/api/posts/{POST_ID}/images",
        files={"file": ("file.bin", b"not an image", "application/octet-stream")},
        cookies={"access_token": auth_cookie},
    )

    assert response.status_code == 422
    assert "Invalid file type" in response.json()["detail"]


@pytest.mark.asyncio
async def test_upload_post_image_unauthenticated(client: AsyncClient, mock_db):
    response = await client.post(
        f"/api/posts/{POST_ID}/images",
        files={"file": ("photo.jpg", JPEG_BYTES, "image/jpeg")},
    )

    assert response.status_code == 401


# ---------------------------------------------------------------------------
# DELETE
# ---------------------------------------------------------------------------

IMAGE_ID = "00000000-0000-0000-0000-000000000099"


@pytest.mark.asyncio
async def test_delete_post_image_success(client: AsyncClient, mock_db, auth_cookie: str, tmp_path):
    # Create the file on disk so the real Path logic works
    upload_dir = tmp_path / "uploads"
    images_dir = upload_dir / "post-images"
    images_dir.mkdir(parents=True)
    target_file = images_dir / "abc.jpg"
    target_file.write_bytes(b"fake")

    with (
        patch("app.post_images.service.delete_image", new_callable=AsyncMock) as mock_del,
        patch("app.post_images.router.get_settings") as mock_settings,
    ):
        mock_del.return_value = "/uploads/post-images/abc.jpg"
        mock_settings.return_value = MagicMock(upload_dir=str(upload_dir))
        response = await client.delete(
            f"/api/posts/{POST_ID}/images/{IMAGE_ID}",
            cookies={"access_token": auth_cookie},
        )

    assert response.status_code == 204
    assert not target_file.exists()  # file was cleaned up


@pytest.mark.asyncio
async def test_delete_post_image_not_found(client: AsyncClient, mock_db, auth_cookie: str):
    with patch("app.post_images.service.delete_image", new_callable=AsyncMock) as mock_del:
        mock_del.return_value = None
        response = await client.delete(
            f"/api/posts/{POST_ID}/images/{IMAGE_ID}",
            cookies={"access_token": auth_cookie},
        )

    assert response.status_code == 404


@pytest.mark.asyncio
async def test_delete_post_image_unauthenticated(client: AsyncClient, mock_db):
    response = await client.delete(f"/api/posts/{POST_ID}/images/{IMAGE_ID}")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_delete_post_image_file_not_on_disk(
    client: AsyncClient, mock_db, auth_cookie: str, tmp_path
):
    """When the file doesn't exist on disk, delete still succeeds (record removed)."""
    upload_dir = tmp_path / "uploads"
    upload_dir.mkdir(parents=True)

    with (
        patch("app.post_images.service.delete_image", new_callable=AsyncMock) as mock_del,
        patch("app.post_images.router.get_settings") as mock_settings,
    ):
        mock_del.return_value = "/uploads/post-images/missing.jpg"
        mock_settings.return_value = MagicMock(upload_dir=str(upload_dir))
        response = await client.delete(
            f"/api/posts/{POST_ID}/images/{IMAGE_ID}",
            cookies={"access_token": auth_cookie},
        )

    assert response.status_code == 204
