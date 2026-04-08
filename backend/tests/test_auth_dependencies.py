"""Tests for auth dependency functions."""

from datetime import UTC, datetime, timedelta

import jwt
import pytest

from app.auth.dependencies import get_optional_admin

pytestmark = pytest.mark.asyncio


@pytest.fixture
def _clear_settings():
    from app.config import get_settings

    get_settings.cache_clear()
    yield
    get_settings.cache_clear()


def _make_token(payload: dict, key: str | None = None) -> str:
    from app.config import get_settings

    get_settings.cache_clear()
    secret = key or get_settings().secret_key
    return jwt.encode(payload, secret, algorithm="HS256")


async def test_get_optional_admin_valid_token(_clear_settings):
    token = _make_token(
        {
            "email": "admin@example.com",
            "id": "test-id",
            "exp": (datetime.now(UTC) + timedelta(hours=1)).timestamp(),
        }
    )
    result = await get_optional_admin(token)
    assert result == {"email": "admin@example.com", "id": "test-id"}


async def test_get_optional_admin_no_token(_clear_settings):
    result = await get_optional_admin(None)
    assert result is None


async def test_get_optional_admin_expired_token(_clear_settings):
    token = _make_token(
        {
            "email": "admin@example.com",
            "id": "test-id",
            "exp": (datetime.now(UTC) - timedelta(hours=1)).timestamp(),
        }
    )
    result = await get_optional_admin(token)
    assert result is None


async def test_get_optional_admin_tampered_token(_clear_settings):
    token = _make_token(
        {
            "email": "admin@example.com",
            "id": "test-id",
            "exp": (datetime.now(UTC) + timedelta(hours=1)).timestamp(),
        },
        key="wrong-secret-key-that-doesnt-match",
    )
    result = await get_optional_admin(token)
    assert result is None


async def test_get_optional_admin_missing_email_claim(_clear_settings):
    token = _make_token(
        {
            "id": "test-id",
            "exp": (datetime.now(UTC) + timedelta(hours=1)).timestamp(),
        }
    )
    result = await get_optional_admin(token)
    assert result is None
