"""Pytest fixtures for backend tests."""

import asyncio

# ---------------------------------------------------------------------------
# Settings override – supply dummy env vars before importing the app
# ---------------------------------------------------------------------------
import os
from collections.abc import AsyncGenerator
from datetime import UTC, datetime, timedelta
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from jose import jwt

os.environ.setdefault("DATABASE_URL", "postgresql://test:test@localhost/test")
os.environ.setdefault("SECRET_KEY", "testsecretkey1234567890123456789")
os.environ.setdefault("RESEND_API_KEY", "re_test_key")
os.environ.setdefault("RESEND_FROM_EMAIL", "test@example.com")
os.environ.setdefault("ALLOWED_ORIGINS", "http://localhost:5173")


@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest.fixture
def app():
    # Clear lru_cache so settings are re-read with env vars above
    from app.config import get_settings

    get_settings.cache_clear()
    from app.main import app as fastapi_app

    return fastapi_app


@pytest_asyncio.fixture
async def client(app, mock_db) -> AsyncGenerator[AsyncClient, None]:
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac


@pytest.fixture
def mock_db():
    """Patch SQLAlchemy async session."""
    from sqlalchemy.ext.asyncio import AsyncSession

    mock_session = MagicMock(spec=AsyncSession)
    mock_session.execute = AsyncMock(return_value=MagicMock())
    mock_session.commit = AsyncMock()
    mock_session.rollback = AsyncMock()
    mock_session.flush = AsyncMock()
    mock_session.refresh = AsyncMock()
    mock_session.add = MagicMock()
    mock_session.__aenter__ = AsyncMock(return_value=mock_session)
    mock_session.__aexit__ = AsyncMock(return_value=False)

    async def fake_get_session():
        yield mock_session

    with patch("app.database.get_session", fake_get_session):
        yield {"session": mock_session}


@pytest.fixture
def auth_cookie() -> str:
    """Return a valid JWT access_token cookie value."""
    from app.config import get_settings

    get_settings.cache_clear()
    settings = get_settings()
    expire = datetime.now(UTC) + timedelta(hours=8)
    token = jwt.encode(
        {"email": "admin@example.com", "id": "test-id", "exp": expire.timestamp()},
        settings.secret_key,
        algorithm="HS256",
    )
    return token
