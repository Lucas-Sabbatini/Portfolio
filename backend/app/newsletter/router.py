import logging
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr

from app.auth.dependencies import get_current_admin
from app.newsletter import service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/newsletter", tags=["newsletter"])


class SubscribeRequest(BaseModel):
    email: EmailStr


class SubscriberResponse(BaseModel):
    id: str
    email: str
    created_at: datetime | None = None


@router.post("/subscribe", status_code=201)
async def subscribe(body: SubscribeRequest) -> dict:
    try:
        row = await service.subscribe(str(body.email))
        return {"id": str(row["id"]), "email": row["email"]}
    except ValueError as exc:
        if "already_subscribed" in str(exc):
            raise HTTPException(status_code=409, detail="Email already subscribed") from exc
        raise HTTPException(status_code=400, detail="Bad request") from exc
    except Exception as exc:
        logger.error("Error subscribing", exc_info=True)
        raise HTTPException(status_code=500, detail="internal server error") from exc


@router.get("/subscribers", response_model=list[SubscriberResponse])
async def list_subscribers(
    _admin: dict[str, str] = Depends(get_current_admin),
) -> list[SubscriberResponse]:
    try:
        rows = await service.list_subscribers()
        return [SubscriberResponse(id=str(r["id"]), email=r["email"], created_at=r.get("created_at")) for r in rows]
    except Exception as exc:
        logger.error("Error listing subscribers", exc_info=True)
        raise HTTPException(status_code=500, detail="internal server error") from exc
