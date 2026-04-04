"""Tests for auth endpoints."""

from datetime import UTC, datetime, timedelta
from unittest.mock import AsyncMock, patch

import pytest
from httpx import AsyncClient
from jose import jwt

ADMIN_ROW = {
    "id": "00000000-0000-0000-0000-000000000001",
    "email": "admin@example.com",
    "password_hash": "$2b$12$placeholder",  # will be patched
}


@pytest.mark.asyncio
async def test_login_success(client: AsyncClient, mock_db):
    with patch("app.auth.router.authenticate_admin", new_callable=AsyncMock) as mock_auth:
        mock_auth.return_value = {"id": "test-id", "email": "admin@example.com"}
        response = await client.post(
            "/api/auth/login", json={"email": "admin@example.com", "password": "secret"}
        )

    assert response.status_code == 200
    assert response.json() == {"message": "ok"}
    assert "access_token" in response.cookies


@pytest.mark.asyncio
async def test_login_wrong_password(client: AsyncClient, mock_db):
    with patch("app.auth.router.authenticate_admin", new_callable=AsyncMock) as mock_auth:
        mock_auth.return_value = None
        response = await client.post(
            "/api/auth/login", json={"email": "admin@example.com", "password": "wrong"}
        )

    assert response.status_code == 401
    assert "access_token" not in response.cookies


@pytest.mark.asyncio
async def test_login_unknown_email(client: AsyncClient, mock_db):
    with patch("app.auth.router.authenticate_admin", new_callable=AsyncMock) as mock_auth:
        mock_auth.return_value = None
        response = await client.post(
            "/api/auth/login", json={"email": "unknown@example.com", "password": "x"}
        )

    assert response.status_code == 401


@pytest.mark.asyncio
async def test_me_authenticated(client: AsyncClient, mock_db, auth_cookie: str):
    response = await client.get("/api/auth/me", cookies={"access_token": auth_cookie})
    assert response.status_code == 200
    assert response.json()["email"] == "admin@example.com"


@pytest.mark.asyncio
async def test_me_unauthenticated(client: AsyncClient, mock_db):
    response = await client.get("/api/auth/me")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_logout(client: AsyncClient, mock_db, auth_cookie: str):
    # Set cookie, then logout
    client.cookies.set("access_token", auth_cookie)
    response = await client.post("/api/auth/logout")
    assert response.status_code == 200
    assert response.json() == {"message": "ok"}
    # Cookie should be cleared (set to empty or deleted)
    cookie_val = response.cookies.get("access_token")
    assert cookie_val is None or cookie_val == ""


@pytest.mark.asyncio
async def test_expired_token_rejected(client: AsyncClient, mock_db):
    from app.config import get_settings

    get_settings.cache_clear()
    settings = get_settings()
    expired_token = jwt.encode(
        {"email": "admin@example.com", "id": "test-id", "exp": (datetime.now(UTC) - timedelta(hours=1)).timestamp()},
        settings.secret_key,
        algorithm="HS256",
    )
    response = await client.get("/api/auth/me", cookies={"access_token": expired_token})
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_tampered_token_rejected(client: AsyncClient, mock_db):
    response = await client.get(
        "/api/auth/me", cookies={"access_token": "eyJhbGciOiJIUzI1NiJ9.tampered.signature"}
    )
    assert response.status_code == 401
