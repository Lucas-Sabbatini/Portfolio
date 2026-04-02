"""Integration smoke tests — full HTTP request/response cycle with mocked DB."""

from datetime import UTC, datetime
from unittest.mock import AsyncMock, patch

import pytest
from httpx import AsyncClient

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

PUBLISHED_POST = {
    "id": "00000000-0000-0000-0000-000000000001",
    "slug": "test-post",
    "title": "Test Post",
    "excerpt": "Test excerpt",
    "body": "Test body content",
    "tag": "Research",
    "status": "published",
    "cover_image": None,
    "read_time": "1 min read",
    "published_at": datetime(2024, 1, 1, tzinfo=UTC),
    "created_at": datetime(2024, 1, 1, tzinfo=UTC),
    "updated_at": datetime(2024, 1, 1, tzinfo=UTC),
}


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_health_returns_ok(client: AsyncClient, mock_db):
    response = await client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


@pytest.mark.asyncio
async def test_cors_headers_present(app, mock_db):
    """Preflight OPTIONS request from allowed origin should return CORS headers."""
    async with AsyncClient(
        transport=__import__("httpx").ASGITransport(app=app),
        base_url="http://test",
    ) as ac:
        response = await ac.options(
            "/api/posts",
            headers={
                "Origin": "http://localhost:5173",
                "Access-Control-Request-Method": "GET",
            },
        )
    assert response.status_code in (200, 204)
    assert "access-control-allow-origin" in response.headers


@pytest.mark.asyncio
async def test_auth_cookie_flow(client: AsyncClient, mock_db):
    """Login → cookie set → /api/auth/me → 200 → logout → cookie cleared."""
    # Login
    with patch("app.auth.router.authenticate_admin", new_callable=AsyncMock) as mock_auth:
        mock_auth.return_value = {"id": "test-id", "email": "admin@example.com"}
        login_resp = await client.post(
            "/api/auth/login", json={"email": "admin@example.com", "password": "secret"}
        )

    assert login_resp.status_code == 200
    token = login_resp.cookies.get("access_token")
    assert token is not None

    # /me with cookie
    me_resp = await client.get("/api/auth/me", cookies={"access_token": token})
    assert me_resp.status_code == 200
    assert me_resp.json()["email"] == "admin@example.com"

    # Logout
    logout_resp = await client.post("/api/auth/logout", cookies={"access_token": token})
    assert logout_resp.status_code == 200
    # Cookie is cleared
    cookie_after = logout_resp.cookies.get("access_token")
    assert cookie_after is None or cookie_after == ""


@pytest.mark.asyncio
async def test_protected_route_without_cookie(client: AsyncClient, mock_db):
    """POST /api/posts without cookie → 401."""
    response = await client.post(
        "/api/posts",
        json={"title": "T", "excerpt": "E", "body": "B", "tag": "Research"},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_full_post_lifecycle(client: AsyncClient, mock_db, auth_cookie: str):
    """Create → get by slug → publish → list (appears) → delete → list (gone)."""
    post = {**PUBLISHED_POST, "status": "draft", "published_at": None}
    published = {**post, "status": "published", "published_at": datetime(2024, 6, 1, tzinfo=UTC)}
    cookies = {"access_token": auth_cookie}

    # Create
    with patch("app.posts.service.create_post", new_callable=AsyncMock) as m:
        m.return_value = post
        create_resp = await client.post(
            "/api/posts",
            json={"title": "Test Post", "excerpt": "exc", "body": "body", "tag": "Research"},
            cookies=cookies,
        )
    assert create_resp.status_code == 201
    slug = create_resp.json()["slug"]

    # Get by slug (published post)
    with patch("app.posts.service.get_post_by_slug", new_callable=AsyncMock) as m:
        m.return_value = {**post, "status": "published"}
        get_resp = await client.get(f"/api/posts/{slug}")
    assert get_resp.status_code == 200
    assert get_resp.json()["slug"] == slug

    # Publish (toggle)
    with patch("app.posts.service.toggle_publish", new_callable=AsyncMock) as m:
        m.return_value = published
        pub_resp = await client.patch(f"/api/posts/{slug}/publish", cookies=cookies)
    assert pub_resp.status_code == 200
    assert pub_resp.json()["status"] == "published"

    # List — appears
    with patch("app.posts.service.list_posts", new_callable=AsyncMock) as m:
        m.return_value = [published]
        list_resp = await client.get("/api/posts")
    assert list_resp.status_code == 200
    assert any(p["slug"] == slug for p in list_resp.json())

    # Delete
    with patch("app.posts.service.delete_post", new_callable=AsyncMock) as m:
        m.return_value = True
        del_resp = await client.delete(f"/api/posts/{slug}", cookies=cookies)
    assert del_resp.status_code == 204

    # List — gone
    with patch("app.posts.service.list_posts", new_callable=AsyncMock) as m:
        m.return_value = []
        list_resp2 = await client.get("/api/posts")
    assert list_resp2.status_code == 200
    assert list_resp2.json() == []


@pytest.mark.asyncio
async def test_upload_rejects_invalid_mime(client: AsyncClient, mock_db, auth_cookie: str):
    """Upload a .txt file → 422."""
    response = await client.post(
        "/api/upload",
        files={"file": ("test.txt", b"hello world", "text/plain")},
        cookies={"access_token": auth_cookie},
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_newsletter_duplicate_returns_409(client: AsyncClient, mock_db):
    """Subscribe twice → 201 then 409."""
    with patch("app.newsletter.service.subscribe", new_callable=AsyncMock) as mock_sub:
        mock_sub.return_value = {"id": "abc", "email": "test@example.com", "created_at": None}
        resp1 = await client.post("/api/newsletter/subscribe", json={"email": "test@example.com"})
    assert resp1.status_code == 201

    with patch("app.newsletter.service.subscribe", new_callable=AsyncMock) as mock_sub:
        mock_sub.side_effect = ValueError("already_subscribed")
        resp2 = await client.post("/api/newsletter/subscribe", json={"email": "test@example.com"})
    assert resp2.status_code == 409
