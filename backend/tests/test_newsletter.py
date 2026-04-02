"""Tests for newsletter endpoints."""

from datetime import UTC, datetime
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from httpx import AsyncClient

SUBSCRIBER_ROW = {
    "id": "00000000-0000-0000-0000-000000000010",
    "email": "user@example.com",
    "created_at": datetime(2024, 1, 1, tzinfo=UTC),
}


@pytest.mark.asyncio
async def test_subscribe_success(client: AsyncClient, mock_db):
    with (
        patch("app.newsletter.service.subscribe", new_callable=AsyncMock) as mock_sub,
        patch("resend.Emails.send", MagicMock(return_value={"id": "email-id"})),
    ):
        mock_sub.return_value = SUBSCRIBER_ROW
        response = await client.post(
            "/api/newsletter/subscribe", json={"email": "user@example.com"}
        )

    assert response.status_code == 201
    mock_sub.assert_called_once_with("user@example.com")


@pytest.mark.asyncio
async def test_subscribe_duplicate(client: AsyncClient, mock_db):
    with patch("app.newsletter.service.subscribe", new_callable=AsyncMock) as mock_sub:
        mock_sub.side_effect = ValueError("already_subscribed")
        response = await client.post(
            "/api/newsletter/subscribe", json={"email": "user@example.com"}
        )

    assert response.status_code == 409


@pytest.mark.asyncio
async def test_subscribe_invalid_email(client: AsyncClient, mock_db):
    response = await client.post("/api/newsletter/subscribe", json={"email": "not-an-email"})
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_list_subscribers_authenticated(client: AsyncClient, mock_db, auth_cookie: str):
    with patch("app.newsletter.service.list_subscribers", new_callable=AsyncMock) as mock_list:
        mock_list.return_value = [SUBSCRIBER_ROW]
        response = await client.get(
            "/api/newsletter/subscribers",
            cookies={"access_token": auth_cookie},
        )

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["email"] == "user@example.com"


@pytest.mark.asyncio
async def test_list_subscribers_unauthenticated(client: AsyncClient, mock_db):
    response = await client.get("/api/newsletter/subscribers")
    assert response.status_code == 401
