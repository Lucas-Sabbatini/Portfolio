import logging

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_admin
from app.auth.service import authenticate_admin, create_access_token
from app.database import get_session

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/auth", tags=["auth"])


class LoginRequest(BaseModel):
    email: str
    password: str


class MessageResponse(BaseModel):
    message: str


class MeResponse(BaseModel):
    email: str


@router.post("/login", response_model=MessageResponse)
async def login(
    body: LoginRequest,
    session: AsyncSession = Depends(get_session),
) -> JSONResponse:
    admin = await authenticate_admin(session, body.email, body.password)
    if admin is None:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token({"email": admin["email"], "id": admin["id"]})
    response = JSONResponse(content={"message": "ok"})
    from app.config import get_settings as _get_settings
    _settings = _get_settings()
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        secure=True,
        samesite="strict",
        max_age=_settings.access_token_expire_hours * 3600,
        path="/",
    )
    logger.info("Login successful for %s", admin["email"])
    return response


@router.post("/logout", response_model=MessageResponse)
async def logout() -> JSONResponse:
    response = JSONResponse(content={"message": "ok"})
    response.delete_cookie(key="access_token", path="/")
    return response


@router.get("/me", response_model=MeResponse)
async def me(admin: dict[str, str] = Depends(get_current_admin)) -> MeResponse:
    return MeResponse(email=admin["email"])
