import logging
from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict, EmailStr
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_admin
from app.database import get_session
from app.newsletter import service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/newsletter", tags=["newsletter"])

DbSession = Annotated[AsyncSession, Depends(get_session)]
AdminDep = Annotated[dict[str, str], Depends(get_current_admin)]


class SubscribeRequest(BaseModel):
    email: EmailStr


class SubscriberResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    email: str
    created_at: datetime | None = None


@router.post("/subscribe", status_code=201)
async def subscribe(
    body: SubscribeRequest,
    session: DbSession,
) -> dict:
    try:
        row = await service.subscribe(session, str(body.email))
    except ValueError as exc:
        if "already_subscribed" in str(exc):
            raise HTTPException(status_code=409, detail="Email already subscribed") from exc
        raise HTTPException(status_code=400, detail="Bad request") from exc
    return {"id": str(row["id"]), "email": row["email"]}


@router.get("/subscribers", response_model=list[SubscriberResponse])
async def list_subscribers(
    _admin: AdminDep,
    session: DbSession,
) -> list[SubscriberResponse]:
    rows = await service.list_subscribers(session)
    return [SubscriberResponse.model_validate(r) for r in rows]
