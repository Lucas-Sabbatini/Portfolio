import logging

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_admin, get_mfa_pending_admin
from app.auth.ip_whitelist import check_ip_whitelist
from app.auth.mfa import generate_qr_base64, generate_totp_secret, get_provisioning_uri, verify_totp
from app.auth.service import authenticate_admin, create_access_token, create_mfa_token
from app.config import get_settings
from app.database import get_session
from app.models import AdminUser
from app.rate_limit import (
    clear_failed_logins,
    is_account_locked,
    limiter,
    record_failed_login,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/auth", tags=["auth"])


class LoginRequest(BaseModel):
    email: str
    password: str


class MessageResponse(BaseModel):
    message: str


class MeResponse(BaseModel):
    email: str


@router.post("/login", dependencies=[Depends(check_ip_whitelist)])
@limiter.limit("5/minute")
async def login(
    request: Request,
    body: LoginRequest,
    session: AsyncSession = Depends(get_session),
) -> JSONResponse:
    if is_account_locked(body.email):
        logger.warning("Login blocked (account locked) for %s", body.email)
        raise HTTPException(status_code=403, detail="Account temporarily locked")

    admin = await authenticate_admin(session, body.email, body.password)
    if admin is None:
        record_failed_login(body.email)
        raise HTTPException(status_code=401, detail="Invalid credentials")

    clear_failed_logins(body.email)

    # If MFA is enrolled, require TOTP verification before issuing access token
    if admin.get("totp_secret"):
        mfa_token = create_mfa_token({"email": admin["email"], "id": admin["id"]})
        response = JSONResponse(content={"message": "mfa_required"})
        response.set_cookie(
            key="mfa_token",
            value=mfa_token,
            httponly=True,
            secure=True,
            samesite="strict",
            max_age=300,  # 5 minutes
            path="/",
        )
        logger.info("MFA required for %s", admin["email"])
        return response

    settings = get_settings()
    token = create_access_token({"email": admin["email"], "id": admin["id"]})
    response = JSONResponse(content={"message": "ok"})
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        secure=True,
        samesite="strict",
        max_age=settings.access_token_expire_hours * 3600,
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


# ---------------------------------------------------------------------------
# MFA endpoints
# ---------------------------------------------------------------------------


class MfaVerifyRequest(BaseModel):
    code: str


class MfaSetupResponse(BaseModel):
    qr_code: str
    secret: str


@router.post("/mfa/verify")
async def mfa_verify(
    body: MfaVerifyRequest,
    pending: dict[str, str] = Depends(get_mfa_pending_admin),
    session: AsyncSession = Depends(get_session),
) -> JSONResponse:
    result = await session.execute(select(AdminUser).where(AdminUser.email == pending["email"]))
    admin = result.scalar_one_or_none()
    if admin is None or admin.totp_secret is None:
        raise HTTPException(status_code=401, detail="Invalid MFA state")

    if not verify_totp(admin.totp_secret, body.code):
        raise HTTPException(status_code=401, detail="Invalid TOTP code")

    settings = get_settings()
    token = create_access_token({"email": pending["email"], "id": pending["id"]})
    response = JSONResponse(content={"message": "ok"})
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        secure=True,
        samesite="strict",
        max_age=settings.access_token_expire_hours * 3600,
        path="/",
    )
    response.delete_cookie(key="mfa_token", path="/")
    logger.info("MFA verified for %s", pending["email"])
    return response


@router.post("/mfa/setup", response_model=MfaSetupResponse)
async def mfa_setup(
    admin: dict[str, str] = Depends(get_current_admin),
) -> MfaSetupResponse:
    secret = generate_totp_secret()
    uri = get_provisioning_uri(secret, admin["email"])
    qr_code = generate_qr_base64(uri)
    return MfaSetupResponse(qr_code=qr_code, secret=secret)


class MfaConfirmRequest(BaseModel):
    secret: str
    code: str


@router.post("/mfa/confirm", response_model=MessageResponse)
async def mfa_confirm(
    body: MfaConfirmRequest,
    admin: dict[str, str] = Depends(get_current_admin),
    session: AsyncSession = Depends(get_session),
) -> MessageResponse:
    if not verify_totp(body.secret, body.code):
        raise HTTPException(status_code=400, detail="Invalid TOTP code")

    await session.execute(
        update(AdminUser).where(AdminUser.email == admin["email"]).values(totp_secret=body.secret)
    )
    await session.commit()
    logger.info("MFA enrolled for %s", admin["email"])
    return MessageResponse(message="MFA enabled")
