"""Tests for content endpoints."""

from datetime import UTC, datetime
from unittest.mock import AsyncMock, patch

import pytest
from httpx import AsyncClient

EXPERIENCE_ROW = {
    "id": "00000000-0000-0000-0000-000000000002",
    "role": "Engineer",
    "company": "Acme",
    "period": "2020-2023",
    "description": ["Did stuff", "More stuff"],
    "sort_order": 0,
    "updated_at": datetime(2024, 1, 1, tzinfo=UTC),
}


@pytest.mark.asyncio
async def test_get_content_section(client: AsyncClient, mock_db):
    with patch("app.content.service.get_content_section", new_callable=AsyncMock) as mock_get:
        mock_get.return_value = {"hero_title": "Hello", "hero_subtitle": "World"}
        response = await client.get("/api/content/hero")

    assert response.status_code == 200
    data = response.json()
    assert data["hero_title"] == "Hello"
    assert data["hero_subtitle"] == "World"


@pytest.mark.asyncio
async def test_patch_content_upserts(client: AsyncClient, mock_db, auth_cookie: str):
    with patch("app.content.service.upsert_content", new_callable=AsyncMock) as mock_upsert:
        mock_upsert.return_value = None
        response = await client.patch(
            "/api/content/hero/title",
            json={"value": "New Title"},
            cookies={"access_token": auth_cookie},
        )

    assert response.status_code == 200
    mock_upsert.assert_called_once_with("hero", "title", "New Title")


@pytest.mark.asyncio
async def test_patch_content_unauthenticated(client: AsyncClient, mock_db):
    response = await client.patch("/api/content/hero/title", json={"value": "x"})
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_get_experience_ordered(client: AsyncClient, mock_db):
    rows = [
        {**EXPERIENCE_ROW, "sort_order": 0},
        {**EXPERIENCE_ROW, "id": "00000000-0000-0000-0000-000000000003", "sort_order": 1},
    ]
    with patch("app.content.service.list_experience", new_callable=AsyncMock) as mock_list:
        mock_list.return_value = rows
        response = await client.get("/api/experience")

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    assert data[0]["sort_order"] == 0
    assert data[1]["sort_order"] == 1


@pytest.mark.asyncio
async def test_create_experience_authenticated(client: AsyncClient, mock_db, auth_cookie: str):
    with patch("app.content.service.create_experience", new_callable=AsyncMock) as mock_create:
        mock_create.return_value = EXPERIENCE_ROW
        response = await client.post(
            "/api/experience",
            json={
                "role": "Engineer",
                "company": "Acme",
                "period": "2020-2023",
                "description": [],
                "sort_order": 0,
            },
            cookies={"access_token": auth_cookie},
        )

    assert response.status_code == 201
    data = response.json()
    assert data["role"] == "Engineer"


@pytest.mark.asyncio
async def test_delete_experience(client: AsyncClient, mock_db, auth_cookie: str):
    entry_id = "00000000-0000-0000-0000-000000000002"
    with patch("app.content.service.delete_experience", new_callable=AsyncMock) as mock_delete:
        mock_delete.return_value = True
        response = await client.delete(
            f"/api/experience/{entry_id}",
            cookies={"access_token": auth_cookie},
        )

    assert response.status_code == 204
