"""Tests for social links endpoints."""

from unittest.mock import AsyncMock, patch

import pytest
from httpx import AsyncClient

LINK_ROW = {
    "id": "00000000-0000-0000-0000-000000000030",
    "platform": "GitHub",
    "url": "https://github.com/user",
    "label": "GitHub",
    "icon": "github",
    "color": "#333",
    "sort_order": 0,
}


@pytest.mark.asyncio
async def test_list_social_links(client: AsyncClient, mock_db):
    rows = [LINK_ROW, {**LINK_ROW, "id": "00000000-0000-0000-0000-000000000031", "sort_order": 1}]
    with patch("app.content.service.list_social_links", new_callable=AsyncMock) as mock_list:
        mock_list.return_value = rows
        response = await client.get("/api/social-links")

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    assert data[0]["platform"] == "GitHub"


@pytest.mark.asyncio
async def test_create_social_link_authenticated(client: AsyncClient, mock_db, auth_cookie: str):
    with patch("app.content.service.create_social_link", new_callable=AsyncMock) as mock_create:
        mock_create.return_value = LINK_ROW
        response = await client.post(
            "/api/social-links",
            json={
                "platform": "GitHub",
                "url": "https://github.com/user",
                "label": "GitHub",
                "icon": "github",
                "color": "#333",
                "sort_order": 0,
            },
            cookies={"access_token": auth_cookie},
        )

    assert response.status_code == 201
    assert response.json()["platform"] == "GitHub"


@pytest.mark.asyncio
async def test_create_social_link_unauthenticated(client: AsyncClient, mock_db):
    response = await client.post(
        "/api/social-links",
        json={
            "platform": "GitHub",
            "url": "https://github.com",
            "label": "GitHub",
            "sort_order": 0,
        },
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_update_social_link_success(client: AsyncClient, mock_db, auth_cookie: str):
    link_id = "00000000-0000-0000-0000-000000000030"
    updated = {**LINK_ROW, "url": "https://github.com/newuser"}
    with patch("app.content.service.update_social_link", new_callable=AsyncMock) as mock_update:
        mock_update.return_value = updated
        response = await client.put(
            f"/api/social-links/{link_id}",
            json={
                "platform": "GitHub",
                "url": "https://github.com/newuser",
                "label": "GitHub",
                "sort_order": 0,
            },
            cookies={"access_token": auth_cookie},
        )

    assert response.status_code == 200
    assert response.json()["url"] == "https://github.com/newuser"


@pytest.mark.asyncio
async def test_update_social_link_not_found(client: AsyncClient, mock_db, auth_cookie: str):
    link_id = "00000000-0000-0000-0000-000000000099"
    with patch("app.content.service.update_social_link", new_callable=AsyncMock) as mock_update:
        mock_update.return_value = None
        response = await client.put(
            f"/api/social-links/{link_id}",
            json={"platform": "x", "url": "https://x.com", "label": "x", "sort_order": 0},
            cookies={"access_token": auth_cookie},
        )

    assert response.status_code == 404


@pytest.mark.asyncio
async def test_delete_social_link_success(client: AsyncClient, mock_db, auth_cookie: str):
    link_id = "00000000-0000-0000-0000-000000000030"
    with patch("app.content.service.delete_social_link", new_callable=AsyncMock) as mock_delete:
        mock_delete.return_value = True
        response = await client.delete(
            f"/api/social-links/{link_id}",
            cookies={"access_token": auth_cookie},
        )

    assert response.status_code == 204


@pytest.mark.asyncio
async def test_delete_social_link_not_found(client: AsyncClient, mock_db, auth_cookie: str):
    link_id = "00000000-0000-0000-0000-000000000099"
    with patch("app.content.service.delete_social_link", new_callable=AsyncMock) as mock_delete:
        mock_delete.return_value = False
        response = await client.delete(
            f"/api/social-links/{link_id}",
            cookies={"access_token": auth_cookie},
        )

    assert response.status_code == 404
