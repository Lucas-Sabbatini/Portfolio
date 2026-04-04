import logging
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_admin
from app.content import service
from app.content.schemas import (
    ContentUpdate,
    ExperienceCreate,
    ExperienceResponse,
    ExperienceUpdate,
    SkillCreate,
    SkillResponse,
    SkillUpdate,
    SocialLinkCreate,
    SocialLinkResponse,
    SocialLinkUpdate,
)
from app.database import get_session

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["content"])


# --- Content blocks ---


@router.get("/content/{section}")
async def get_content(
    section: str,
    session: AsyncSession = Depends(get_session),
) -> dict[str, str]:
    try:
        return await service.get_content_section(session, section)
    except Exception as exc:
        logger.error("Error getting content section", exc_info=True)
        raise HTTPException(status_code=500, detail="internal server error") from exc


@router.patch("/content/{section}/{key}")
async def patch_content(
    section: str,
    key: str,
    body: ContentUpdate,
    _admin: dict[str, str] = Depends(get_current_admin),
    session: AsyncSession = Depends(get_session),
) -> dict[str, str]:
    try:
        await service.upsert_content(session, section, key, body.value)
        return {"section": section, "key": key, "value": body.value}
    except Exception as exc:
        logger.error("Error patching content", exc_info=True)
        raise HTTPException(status_code=500, detail="internal server error") from exc


# --- Experience ---


@router.get("/experience", response_model=list[ExperienceResponse])
async def list_experience(
    session: AsyncSession = Depends(get_session),
) -> list[ExperienceResponse]:
    try:
        rows = await service.list_experience(session)
        return [
            ExperienceResponse(id=str(r["id"]), **{k: r[k] for k in r if k != "id"}) for r in rows
        ]
    except Exception as exc:
        logger.error("Error listing experience", exc_info=True)
        raise HTTPException(status_code=500, detail="internal server error") from exc


@router.post("/experience", response_model=ExperienceResponse, status_code=201)
async def create_experience(
    body: ExperienceCreate,
    _admin: dict[str, str] = Depends(get_current_admin),
    session: AsyncSession = Depends(get_session),
) -> ExperienceResponse:
    try:
        row = await service.create_experience(
            session, body.role, body.company, body.period, body.description, body.sort_order
        )
        return ExperienceResponse(id=str(row["id"]), **{k: row[k] for k in row if k != "id"})
    except Exception as exc:
        logger.error("Error creating experience", exc_info=True)
        raise HTTPException(status_code=500, detail="internal server error") from exc


@router.put("/experience/{entry_id}", response_model=ExperienceResponse)
async def update_experience(
    entry_id: UUID,
    body: ExperienceUpdate,
    _admin: dict[str, str] = Depends(get_current_admin),
    session: AsyncSession = Depends(get_session),
) -> ExperienceResponse:
    try:
        row = await service.update_experience(
            session,
            str(entry_id),
            body.role,
            body.company,
            body.period,
            body.description,
            body.sort_order,
        )
    except Exception as exc:
        logger.error("Error updating experience", exc_info=True)
        raise HTTPException(status_code=500, detail="internal server error") from exc
    if row is None:
        raise HTTPException(status_code=404, detail="Not found")
    return ExperienceResponse(id=str(row["id"]), **{k: row[k] for k in row if k != "id"})


@router.delete("/experience/{entry_id}", status_code=204)
async def delete_experience(
    entry_id: UUID,
    _admin: dict[str, str] = Depends(get_current_admin),
    session: AsyncSession = Depends(get_session),
) -> Response:
    try:
        deleted = await service.delete_experience(session, str(entry_id))
    except Exception as exc:
        logger.error("Error deleting experience", exc_info=True)
        raise HTTPException(status_code=500, detail="internal server error") from exc
    if not deleted:
        raise HTTPException(status_code=404, detail="Not found")
    return Response(status_code=204)


# --- Skills ---


@router.get("/skills", response_model=list[SkillResponse])
async def list_skills(
    session: AsyncSession = Depends(get_session),
) -> list[SkillResponse]:
    try:
        rows = await service.list_skills(session)
        return [SkillResponse(id=str(r["id"]), **{k: r[k] for k in r if k != "id"}) for r in rows]
    except Exception as exc:
        logger.error("Error listing skills", exc_info=True)
        raise HTTPException(status_code=500, detail="internal server error") from exc


@router.post("/skills", response_model=SkillResponse, status_code=201)
async def create_skill(
    body: SkillCreate,
    _admin: dict[str, str] = Depends(get_current_admin),
    session: AsyncSession = Depends(get_session),
) -> SkillResponse:
    try:
        row = await service.create_skill(
            session, body.name, body.category, body.icon, body.sort_order
        )
        return SkillResponse(id=str(row["id"]), **{k: row[k] for k in row if k != "id"})
    except Exception as exc:
        logger.error("Error creating skill", exc_info=True)
        raise HTTPException(status_code=500, detail="internal server error") from exc


@router.put("/skills/{skill_id}", response_model=SkillResponse)
async def update_skill(
    skill_id: UUID,
    body: SkillUpdate,
    _admin: dict[str, str] = Depends(get_current_admin),
    session: AsyncSession = Depends(get_session),
) -> SkillResponse:
    try:
        row = await service.update_skill(
            session, str(skill_id), body.name, body.category, body.icon, body.sort_order
        )
    except Exception as exc:
        logger.error("Error updating skill", exc_info=True)
        raise HTTPException(status_code=500, detail="internal server error") from exc
    if row is None:
        raise HTTPException(status_code=404, detail="Not found")
    return SkillResponse(id=str(row["id"]), **{k: row[k] for k in row if k != "id"})


@router.delete("/skills/{skill_id}", status_code=204)
async def delete_skill(
    skill_id: UUID,
    _admin: dict[str, str] = Depends(get_current_admin),
    session: AsyncSession = Depends(get_session),
) -> Response:
    try:
        deleted = await service.delete_skill(session, str(skill_id))
    except Exception as exc:
        logger.error("Error deleting skill", exc_info=True)
        raise HTTPException(status_code=500, detail="internal server error") from exc
    if not deleted:
        raise HTTPException(status_code=404, detail="Not found")
    return Response(status_code=204)


# --- Social links ---


@router.get("/social-links", response_model=list[SocialLinkResponse])
async def list_social_links(
    session: AsyncSession = Depends(get_session),
) -> list[SocialLinkResponse]:
    try:
        rows = await service.list_social_links(session)
        return [
            SocialLinkResponse(id=str(r["id"]), **{k: r[k] for k in r if k != "id"}) for r in rows
        ]
    except Exception as exc:
        logger.error("Error listing social links", exc_info=True)
        raise HTTPException(status_code=500, detail="internal server error") from exc


@router.post("/social-links", response_model=SocialLinkResponse, status_code=201)
async def create_social_link(
    body: SocialLinkCreate,
    _admin: dict[str, str] = Depends(get_current_admin),
    session: AsyncSession = Depends(get_session),
) -> SocialLinkResponse:
    try:
        row = await service.create_social_link(
            session, body.platform, body.url, body.label, body.icon, body.color, body.sort_order
        )
        return SocialLinkResponse(id=str(row["id"]), **{k: row[k] for k in row if k != "id"})
    except Exception as exc:
        logger.error("Error creating social link", exc_info=True)
        raise HTTPException(status_code=500, detail="internal server error") from exc


@router.put("/social-links/{link_id}", response_model=SocialLinkResponse)
async def update_social_link(
    link_id: UUID,
    body: SocialLinkUpdate,
    _admin: dict[str, str] = Depends(get_current_admin),
    session: AsyncSession = Depends(get_session),
) -> SocialLinkResponse:
    try:
        row = await service.update_social_link(
            session,
            str(link_id),
            body.platform,
            body.url,
            body.label,
            body.icon,
            body.color,
            body.sort_order,
        )
    except Exception as exc:
        logger.error("Error updating social link", exc_info=True)
        raise HTTPException(status_code=500, detail="internal server error") from exc
    if row is None:
        raise HTTPException(status_code=404, detail="Not found")
    return SocialLinkResponse(id=str(row["id"]), **{k: row[k] for k in row if k != "id"})


@router.delete("/social-links/{link_id}", status_code=204)
async def delete_social_link(
    link_id: UUID,
    _admin: dict[str, str] = Depends(get_current_admin),
    session: AsyncSession = Depends(get_session),
) -> Response:
    try:
        deleted = await service.delete_social_link(session, str(link_id))
    except Exception as exc:
        logger.error("Error deleting social link", exc_info=True)
        raise HTTPException(status_code=500, detail="internal server error") from exc
    if not deleted:
        raise HTTPException(status_code=404, detail="Not found")
    return Response(status_code=204)
