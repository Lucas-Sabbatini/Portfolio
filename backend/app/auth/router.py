import logging

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from app.auth.dependencies import get_current_admin
from app.auth.service import authenticate_admin, create_access_token

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
async def login(body: LoginRequest) -> JSONResponse:
    admin = await authenticate_admin(body.email, body.password)
    if admin is None:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token({"email": admin["email"], "id": admin["id"]})
    response = JSONResponse(content={"message": "ok"})
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        samesite="strict",
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
