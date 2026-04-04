"""Tests for posts endpoints."""

from datetime import UTC, datetime
from unittest.mock import ANY, AsyncMock, patch

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

DRAFT_POST = {**PUBLISHED_POST, "status": "draft", "slug": "draft-post"}


@pytest.mark.asyncio
async def test_list_posts_public(client: AsyncClient, mock_db):
    with patch("app.posts.service.list_posts", new_callable=AsyncMock) as mock_list:
        mock_list.return_value = [PUBLISHED_POST]
        response = await client.get("/api/posts")

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["slug"] == "test-post"
    # body should NOT be in list response
    assert "body" not in data[0]


@pytest.mark.asyncio
async def test_list_posts_tag_filter(client: AsyncClient, mock_db):
    with patch("app.posts.service.list_posts", new_callable=AsyncMock) as mock_list:
        mock_list.return_value = [PUBLISHED_POST]
        response = await client.get("/api/posts?tag=Research")

    assert response.status_code == 200
    mock_list.assert_called_once_with(ANY, tag="Research", status=None)


@pytest.mark.asyncio
async def test_get_post_by_slug(client: AsyncClient, mock_db):
    with patch("app.posts.service.get_post_by_slug", new_callable=AsyncMock) as mock_get:
        mock_get.return_value = PUBLISHED_POST
        response = await client.get("/api/posts/test-post")

    assert response.status_code == 200
    data = response.json()
    assert data["slug"] == "test-post"
    assert "body" in data


@pytest.mark.asyncio
async def test_get_post_not_found(client: AsyncClient, mock_db):
    with patch("app.posts.service.get_post_by_slug", new_callable=AsyncMock) as mock_get:
        mock_get.return_value = None
        response = await client.get("/api/posts/nonexistent")

    assert response.status_code == 404


@pytest.mark.asyncio
async def test_get_draft_post_as_public(client: AsyncClient, mock_db):
    with patch("app.posts.service.get_post_by_slug", new_callable=AsyncMock) as mock_get:
        mock_get.return_value = DRAFT_POST
        response = await client.get("/api/posts/draft-post")

    assert response.status_code == 404


@pytest.mark.asyncio
async def test_create_post_authenticated(client: AsyncClient, mock_db, auth_cookie: str):
    new_post = {**PUBLISHED_POST, "slug": "new-title", "title": "New Title"}
    with patch("app.posts.service.create_post", new_callable=AsyncMock) as mock_create:
        mock_create.return_value = new_post
        response = await client.post(
            "/api/posts",
            json={"title": "New Title", "excerpt": "excerpt", "body": "body", "tag": "Research"},
            cookies={"access_token": auth_cookie},
        )

    assert response.status_code == 201
    data = response.json()
    assert "slug" in data


@pytest.mark.asyncio
async def test_create_post_unauthenticated(client: AsyncClient, mock_db):
    response = await client.post(
        "/api/posts",
        json={"title": "Title", "excerpt": "excerpt", "body": "body", "tag": "Research"},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_publish_post(client: AsyncClient, mock_db, auth_cookie: str):
    published = {
        **PUBLISHED_POST,
        "status": "published",
        "published_at": datetime(2024, 1, 1, tzinfo=UTC),
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
async def test_delete_post(client: AsyncClient, mock_db, auth_cookie: str):
    with patch("app.posts.service.delete_post", new_callable=AsyncMock) as mock_delete:
        mock_delete.return_value = True
        response = await client.delete(
            "/api/posts/test-post",
            cookies={"access_token": auth_cookie},
        )

    assert response.status_code == 204


@pytest.mark.asyncio
async def test_read_time_auto_computed(client: AsyncClient, mock_db, auth_cookie: str):
    """If read_time not provided, service should compute it."""
    body_text = "word " * 400  # 400 words → 2 min read
    computed_post = {**PUBLISHED_POST, "read_time": "2 min read", "body": body_text}

    with patch("app.posts.service.create_post", new_callable=AsyncMock) as mock_create:
        mock_create.return_value = computed_post
        response = await client.post(
            "/api/posts",
            json={"title": "Title", "excerpt": "exc", "body": body_text, "tag": "Research"},
            cookies={"access_token": auth_cookie},
        )

    assert response.status_code == 201
    # Verify service was called (it handles read_time computation)
    mock_create.assert_called_once()
    call_arg = mock_create.call_args[0][1]
    # read_time was not provided in request
    assert call_arg.read_time is None


# ---------------------------------------------------------------------------
# Draft / status filter tests
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_list_posts_status_all_authenticated(client: AsyncClient, mock_db, auth_cookie: str):
    """Authenticated admin can list all posts (drafts + published)."""
    with patch("app.posts.service.list_posts", new_callable=AsyncMock) as mock_list:
        mock_list.return_value = [PUBLISHED_POST, DRAFT_POST]
        response = await client.get(
            "/api/posts?status=all",
            cookies={"access_token": auth_cookie},
        )

    assert response.status_code == 200
    assert len(response.json()) == 2
    mock_list.assert_called_once_with(ANY, tag=None, status="all")


@pytest.mark.asyncio
async def test_list_posts_status_all_unauthenticated(client: AsyncClient, mock_db):
    """Unauthenticated request with status=all should be rejected."""
    response = await client.get("/api/posts?status=all")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_list_posts_status_draft_authenticated(
    client: AsyncClient, mock_db, auth_cookie: str
):
    """Authenticated admin can list only draft posts."""
    with patch("app.posts.service.list_posts", new_callable=AsyncMock) as mock_list:
        mock_list.return_value = [DRAFT_POST]
        response = await client.get(
            "/api/posts?status=draft",
            cookies={"access_token": auth_cookie},
        )

    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["status"] == "draft"
    mock_list.assert_called_once_with(ANY, tag=None, status="draft")


@pytest.mark.asyncio
async def test_list_posts_status_draft_unauthenticated(client: AsyncClient, mock_db):
    """Unauthenticated request with status=draft should be rejected."""
    response = await client.get("/api/posts?status=draft")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_list_posts_status_published_no_auth_required(client: AsyncClient, mock_db):
    """Explicitly passing status=published should work without auth."""
    with patch("app.posts.service.list_posts", new_callable=AsyncMock) as mock_list:
        mock_list.return_value = [PUBLISHED_POST]
        response = await client.get("/api/posts?status=published")

    assert response.status_code == 200
    mock_list.assert_called_once_with(ANY, tag=None, status="published")


@pytest.mark.asyncio
async def test_list_posts_status_all_with_tag(client: AsyncClient, mock_db, auth_cookie: str):
    """status and tag params work together."""
    with patch("app.posts.service.list_posts", new_callable=AsyncMock) as mock_list:
        mock_list.return_value = [DRAFT_POST]
        response = await client.get(
            "/api/posts?status=all&tag=Research",
            cookies={"access_token": auth_cookie},
        )

    assert response.status_code == 200
    mock_list.assert_called_once_with(ANY, tag="Research", status="all")


@pytest.mark.asyncio
async def test_list_posts_status_all_invalid_token(client: AsyncClient, mock_db):
    """Expired/invalid token with status=all should be rejected."""
    response = await client.get(
        "/api/posts?status=all",
        cookies={"access_token": "invalid-token"},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_get_draft_post_authenticated(client: AsyncClient, mock_db, auth_cookie: str):
    """Authenticated admin can view a draft post by slug."""
    with patch("app.posts.service.get_post_by_slug", new_callable=AsyncMock) as mock_get:
        mock_get.return_value = DRAFT_POST
        response = await client.get(
            "/api/posts/draft-post",
            cookies={"access_token": auth_cookie},
        )

    assert response.status_code == 200
    data = response.json()
    assert data["slug"] == "draft-post"
    assert data["status"] == "draft"


@pytest.mark.asyncio
async def test_get_draft_post_unauthenticated(client: AsyncClient, mock_db):
    """Unauthenticated user cannot view a draft post (existing test, kept for clarity)."""
    with patch("app.posts.service.get_post_by_slug", new_callable=AsyncMock) as mock_get:
        mock_get.return_value = DRAFT_POST
        response = await client.get("/api/posts/draft-post")

    assert response.status_code == 404


@pytest.mark.asyncio
async def test_get_draft_post_invalid_token(client: AsyncClient, mock_db):
    """Invalid token should not grant access to draft posts."""
    with patch("app.posts.service.get_post_by_slug", new_callable=AsyncMock) as mock_get:
        mock_get.return_value = DRAFT_POST
        response = await client.get(
            "/api/posts/draft-post",
            cookies={"access_token": "garbage"},
        )

    assert response.status_code == 404


@pytest.mark.asyncio
async def test_get_published_post_no_auth_still_works(client: AsyncClient, mock_db):
    """Published posts remain accessible without authentication."""
    with patch("app.posts.service.get_post_by_slug", new_callable=AsyncMock) as mock_get:
        mock_get.return_value = PUBLISHED_POST
        response = await client.get("/api/posts/test-post")

    assert response.status_code == 200
    assert response.json()["slug"] == "test-post"
