import logging

import jwt
from fastapi import Cookie, HTTPException
from jwt import InvalidTokenError

from app.config import get_settings

logger = logging.getLogger(__name__)


async def get_current_admin(access_token: str = Cookie(default=None)) -> dict[str, str]:
    if not access_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        settings = get_settings()
        payload = jwt.decode(access_token, settings.secret_key, algorithms=["HS256"])
        email: str | None = payload.get("email")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return {"email": email, "id": payload.get("id", "")}
    except InvalidTokenError as exc:
        logger.warning("Invalid JWT token presented")
        raise HTTPException(status_code=401, detail="Invalid token") from exc


async def get_mfa_pending_admin(mfa_token: str = Cookie(default=None)) -> dict[str, str]:
    if not mfa_token:
        raise HTTPException(status_code=401, detail="MFA token required")
    try:
        settings = get_settings()
        payload = jwt.decode(mfa_token, settings.secret_key, algorithms=["HS256"])
        if payload.get("purpose") != "mfa":
            raise HTTPException(status_code=401, detail="Invalid MFA token")
        email: str | None = payload.get("email")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid MFA token")
        return {"email": email, "id": payload.get("id", "")}
    except InvalidTokenError as exc:
        logger.warning("Invalid MFA token presented")
        raise HTTPException(status_code=401, detail="Invalid MFA token") from exc


async def get_optional_admin(
    access_token: str = Cookie(default=None),
) -> dict[str, str] | None:
    if not access_token:
        return None
    try:
        settings = get_settings()
        payload = jwt.decode(access_token, settings.secret_key, algorithms=["HS256"])
        email: str | None = payload.get("email")
        if email is None:
            return None
        return {"email": email, "id": payload.get("id", "")}
    except InvalidTokenError:
        return None
