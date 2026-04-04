import logging
from datetime import UTC, datetime, timedelta

from jose import jwt
from passlib.context import CryptContext
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.models import AdminUser

logger = logging.getLogger(__name__)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def create_access_token(data: dict[str, str]) -> str:
    settings = get_settings()
    to_encode = data.copy()
    expire = datetime.now(UTC) + timedelta(hours=settings.access_token_expire_hours)
    to_encode["exp"] = expire.timestamp()
    return jwt.encode(to_encode, settings.secret_key, algorithm="HS256")


async def authenticate_admin(session: AsyncSession, email: str, password: str) -> dict[str, str] | None:
    try:
        result = await session.execute(select(AdminUser).where(AdminUser.email == email))
        row = result.scalar_one_or_none()
    except Exception:
        logger.error("Database error during authentication", exc_info=True)
        return None

    if row is None:
        logger.warning("Failed login attempt for unknown email: %s", email)
        return None

    if not verify_password(password, row.password_hash):
        logger.warning("Failed login attempt (wrong password) for email: %s", email)
        return None

    logger.info("Successful login for email: %s", email)
    return {"id": str(row.id), "email": row.email}
