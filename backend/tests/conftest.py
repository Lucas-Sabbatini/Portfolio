"""Pytest fixtures for backend tests."""
import asyncio
from datetime import datetime, timezone, timedelta
from unittest.mock import AsyncMock, MagicMock, patch
from typing import AsyncGenerator

import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from jose import jwt


# ---------------------------------------------------------------------------
# Settings override – supply dummy env vars before importing the app
# ---------------------------------------------------------------------------
import os

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
    """Patch asyncpg pool and supabase client."""
    mock_pool = MagicMock()
    mock_pool.fetchrow = AsyncMock(return_value=None)
    mock_pool.fetch = AsyncMock(return_value=[])
    mock_pool.execute = AsyncMock(return_value="DELETE 0")

    mock_supabase = MagicMock()

    with patch("app.database._pool", mock_pool), \
         patch("app.database._supabase", mock_supabase), \
         patch("app.database.get_pool", AsyncMock(return_value=mock_pool)), \
         patch("app.database.get_supabase", MagicMock(return_value=mock_supabase)):
        yield {"pool": mock_pool, "supabase": mock_supabase}


@pytest.fixture
def auth_cookie() -> str:
    """Return a valid JWT access_token cookie value."""
    from app.config import get_settings
    get_settings.cache_clear()
    settings = get_settings()
    expire = datetime.now(timezone.utc) + timedelta(hours=8)
    token = jwt.encode(
        {"email": "admin@example.com", "id": "test-id", "exp": expire.timestamp()},
        settings.secret_key,
        algorithm="HS256",
    )
    return token
