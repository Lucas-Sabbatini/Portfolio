"""Tests for posts update and publish toggle edge cases."""

from datetime import UTC, datetime
from unittest.mock import AsyncMock, patch

import pytest
from httpx import AsyncClient

PUBLISHED_POST = {
    "id": "00000000-0000-0000-0000-000000000001",
    "slug": "test-post",
    "title": "Test Post",
    "excerpt": "Test excerpt",
    "body": "Test body content " * 50,
    "tag": "Research",
    "status": "published",
    "cover_image": None,
    "read_time": "1 min read",
    "published_at": datetime(2024, 1, 1, tzinfo=UTC),
    "created_at": datetime(2024, 1, 1, tzinfo=UTC),
    "updated_at": datetime(2024, 1, 1, tzinfo=UTC),
}

DRAFT_POST = {**PUBLISHED_POST, "status": "draft", "published_at": None}


@pytest.mark.asyncio
async def test_update_post_success(client: AsyncClient, mock_db, auth_cookie: str):
    updated = {**PUBLISHED_POST, "title": "Updated Title", "excerpt": "Updated excerpt"}
    with patch("app.posts.service.update_post", new_callable=AsyncMock) as mock_update:
        mock_update.return_value = updated
        response = await client.put(
            "/api/posts/test-post",
            json={
                "title": "Updated Title",
                "excerpt": "Updated excerpt",
                "body": "New body",
                "tag": "Research",
            },
            cookies={"access_token": auth_cookie},
        )

    assert response.status_code == 200
    assert response.json()["title"] == "Updated Title"


@pytest.mark.asyncio
async def test_update_post_not_found(client: AsyncClient, mock_db, auth_cookie: str):
    with patch("app.posts.service.update_post", new_callable=AsyncMock) as mock_update:
        mock_update.return_value = None
        response = await client.put(
            "/api/posts/nonexistent",
            json={"title": "x", "excerpt": "x", "body": "x", "tag": "Research"},
            cookies={"access_token": auth_cookie},
        )

    assert response.status_code == 404


@pytest.mark.asyncio
async def test_update_post_unauthenticated(client: AsyncClient, mock_db):
    response = await client.put(
        "/api/posts/test-post",
        json={"title": "x", "excerpt": "x", "body": "x", "tag": "Research"},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_toggle_publish_draft_to_published(client: AsyncClient, mock_db, auth_cookie: str):
    published = {
        **DRAFT_POST,
        "status": "published",
        "published_at": datetime(2024, 6, 1, tzinfo=UTC),
    }
    with patch("app.posts.service.toggle_publish", new_callable=AsyncMock) as mock_toggle:
        mock_toggle.return_value = published
        response = await client.patch(
            "/api/posts/test-post/publish",
            cookies={"access_token": auth_cookie},
        )

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "published"
    assert data["published_at"] is not None


@pytest.mark.asyncio
async def test_toggle_publish_published_to_draft(client: AsyncClient, mock_db, auth_cookie: str):
    """Unpublish: published → draft."""
    unpublished = {**PUBLISHED_POST, "status": "draft"}
    with patch("app.posts.service.toggle_publish", new_callable=AsyncMock) as mock_toggle:
        mock_toggle.return_value = unpublished
        response = await client.patch(
            "/api/posts/test-post/publish",
            cookies={"access_token": auth_cookie},
        )

    assert response.status_code == 200
    assert response.json()["status"] == "draft"
