"""Tests for skills endpoints."""

from unittest.mock import AsyncMock, patch

import pytest
from httpx import AsyncClient

SKILL_ROW = {
    "id": "00000000-0000-0000-0000-000000000020",
    "name": "Python",
    "category": "Backend",
    "icon": "python-icon",
    "sort_order": 0,
}


@pytest.mark.asyncio
async def test_list_skills(client: AsyncClient, mock_db):
    rows = [SKILL_ROW, {**SKILL_ROW, "id": "00000000-0000-0000-0000-000000000021", "sort_order": 1}]
    with patch("app.content.service.list_skills", new_callable=AsyncMock) as mock_list:
        mock_list.return_value = rows
        response = await client.get("/api/skills")

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    assert data[0]["name"] == "Python"


@pytest.mark.asyncio
async def test_create_skill_authenticated(client: AsyncClient, mock_db, auth_cookie: str):
    with patch("app.content.service.create_skill", new_callable=AsyncMock) as mock_create:
        mock_create.return_value = SKILL_ROW
        response = await client.post(
            "/api/skills",
            json={"name": "Python", "category": "Backend", "icon": "python-icon", "sort_order": 0},
            cookies={"access_token": auth_cookie},
        )

    assert response.status_code == 201
    assert response.json()["name"] == "Python"


@pytest.mark.asyncio
async def test_create_skill_unauthenticated(client: AsyncClient, mock_db):
    response = await client.post(
        "/api/skills",
        json={"name": "Python", "category": "Backend", "sort_order": 0},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_update_skill_success(client: AsyncClient, mock_db, auth_cookie: str):
    skill_id = "00000000-0000-0000-0000-000000000020"
    updated = {**SKILL_ROW, "name": "Python 3", "sort_order": 1}
    with patch("app.content.service.update_skill", new_callable=AsyncMock) as mock_update:
        mock_update.return_value = updated
        response = await client.put(
            f"/api/skills/{skill_id}",
            json={"name": "Python 3", "category": "Backend", "sort_order": 1},
            cookies={"access_token": auth_cookie},
        )

    assert response.status_code == 200
    assert response.json()["name"] == "Python 3"


@pytest.mark.asyncio
async def test_update_skill_not_found(client: AsyncClient, mock_db, auth_cookie: str):
    skill_id = "00000000-0000-0000-0000-000000000099"
    with patch("app.content.service.update_skill", new_callable=AsyncMock) as mock_update:
        mock_update.return_value = None
        response = await client.put(
            f"/api/skills/{skill_id}",
            json={"name": "x", "category": "x", "sort_order": 0},
            cookies={"access_token": auth_cookie},
        )

    assert response.status_code == 404


@pytest.mark.asyncio
async def test_delete_skill_success(client: AsyncClient, mock_db, auth_cookie: str):
    skill_id = "00000000-0000-0000-0000-000000000020"
    with patch("app.content.service.delete_skill", new_callable=AsyncMock) as mock_delete:
        mock_delete.return_value = True
        response = await client.delete(
            f"/api/skills/{skill_id}",
            cookies={"access_token": auth_cookie},
        )

    assert response.status_code == 204


@pytest.mark.asyncio
async def test_delete_skill_not_found(client: AsyncClient, mock_db, auth_cookie: str):
    skill_id = "00000000-0000-0000-0000-000000000099"
    with patch("app.content.service.delete_skill", new_callable=AsyncMock) as mock_delete:
        mock_delete.return_value = False
        response = await client.delete(
            f"/api/skills/{skill_id}",
            cookies={"access_token": auth_cookie},
        )

    assert response.status_code == 404
