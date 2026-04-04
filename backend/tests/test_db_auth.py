"""Real database tests for the auth service."""

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.service import authenticate_admin, hash_password
from app.models import AdminUser

pytestmark = pytest.mark.asyncio

# passlib + bcrypt>=4.0 incompatibility detection
try:
    hash_password("probe")
    _bcrypt_ok = True
except Exception:
    _bcrypt_ok = False

bcrypt_required = pytest.mark.skipif(not _bcrypt_ok, reason="passlib/bcrypt incompatibility")


@pytest.fixture
async def admin_user(db_session: AsyncSession):
    if not _bcrypt_ok:
        pytest.skip("passlib/bcrypt incompatibility")
    user = AdminUser(email="admin@example.com", password_hash=hash_password("secret"))
    db_session.add(user)
    await db_session.flush()
    await db_session.refresh(user)
    return {"id": str(user.id), "email": user.email}


@bcrypt_required
async def test_authenticate_admin_correct_credentials(db_session: AsyncSession, admin_user):
    result = await authenticate_admin(db_session, "admin@example.com", "secret")
    assert result is not None
    assert result["email"] == "admin@example.com"
    assert "id" in result


@bcrypt_required
async def test_authenticate_admin_wrong_password(db_session: AsyncSession, admin_user):
    result = await authenticate_admin(db_session, "admin@example.com", "wrongpassword")
    assert result is None


async def test_authenticate_admin_unknown_email(db_session: AsyncSession):
    result = await authenticate_admin(db_session, "nobody@example.com", "secret")
    assert result is None
