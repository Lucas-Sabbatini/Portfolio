import logging

from fastapi import Cookie, HTTPException
from jose import JWTError, jwt

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
    except JWTError as exc:
        logger.warning("Invalid JWT token presented")
        raise HTTPException(status_code=401, detail="Invalid token") from exc
