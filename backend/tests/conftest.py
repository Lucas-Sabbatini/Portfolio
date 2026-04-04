"""Pytest fixtures for backend tests."""

import socket

# ---------------------------------------------------------------------------
# Settings override – supply dummy env vars before importing the app
# ---------------------------------------------------------------------------
import os
from collections.abc import AsyncGenerator
from datetime import UTC, datetime, timedelta
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from jose import jwt

os.environ.setdefault("TEST_DATABASE_URL", "postgresql://test:test@localhost/test")
os.environ.setdefault("DATABASE_URL", "postgresql://test:test@localhost/test")
os.environ.setdefault("SECRET_KEY", "testsecretkey1234567890123456789")
os.environ.setdefault("RESEND_API_KEY", "re_test_key")
os.environ.setdefault("RESEND_FROM_EMAIL", "test@example.com")
os.environ.setdefault("ALLOWED_ORIGINS", "http://localhost:5173")


# ---------------------------------------------------------------------------
# pytest-docker: auto-manage a Postgres container for tests
# ---------------------------------------------------------------------------


def _pg_ready(host: str, port: int) -> bool:
    """Return True when Postgres accepts TCP connections."""
    try:
        with socket.create_connection((host, port), timeout=1):
            return True
    except OSError:
        return False


@pytest.fixture(scope="session")
def docker_compose_file() -> str:
    return str(Path(__file__).resolve().parent.parent / "docker-compose.test.yml")


@pytest.fixture(scope="session")
def docker_compose_project_name() -> str:
    return "blog-test"


@pytest.fixture(scope="session")
def postgres_url(docker_services, docker_ip) -> str:
    """Wait for Postgres to be ready and return the async connection URL."""
    port = docker_services.port_for("test-db", 5432)
    docker_services.wait_until_responsive(
        timeout=30,
        pause=0.5,
        check=lambda: _pg_ready(docker_ip, port),
    )
    return f"postgresql+asyncpg://test:test@{docker_ip}:{port}/test"


# ---------------------------------------------------------------------------
# Real database fixtures
# ---------------------------------------------------------------------------


@pytest_asyncio.fixture(scope="session")
async def db_engine(request):
    """Create all tables once per session against a real Postgres DB.

    Uses TEST_DATABASE_URL env var directly (e.g. in CI) or falls back
    to the pytest-docker managed container for local runs.
    """
    from sqlalchemy.ext.asyncio import create_async_engine

    from app.models import Base

    env_url = os.environ.get("TEST_DATABASE_URL")
    if env_url and env_url.startswith("postgresql+asyncpg://"):
        url = env_url
    else:
        url = request.getfixturevalue("postgres_url")

    engine = create_async_engine(url)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


@pytest_asyncio.fixture
async def db_session(db_engine) -> AsyncGenerator:
    """Yield a session per test; roll back all changes afterwards."""
    from sqlalchemy.ext.asyncio import AsyncSession

    async with db_engine.connect() as conn:
        trans = await conn.begin()
        session = AsyncSession(bind=conn, expire_on_commit=False)
        yield session
        await session.close()
        await trans.rollback()


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
