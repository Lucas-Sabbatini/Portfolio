import logging
from typing import Annotated
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

DbSession = Annotated[AsyncSession, Depends(get_session)]
AdminDep = Annotated[dict[str, str], Depends(get_current_admin)]


# --- Content blocks ---


@router.get("/content/{section}")
async def get_content(
    section: str,
    session: DbSession,
) -> dict[str, str]:
    return await service.get_content_section(session, section)


@router.patch("/content/{section}/{key}")
async def patch_content(
    section: str,
    key: str,
    body: ContentUpdate,
    _admin: AdminDep,
    session: DbSession,
) -> dict[str, str]:
    await service.upsert_content(session, section, key, body.value)
    return {"section": section, "key": key, "value": body.value}


# --- Experience ---


@router.get("/experience", response_model=list[ExperienceResponse])
async def list_experience(
    session: DbSession,
) -> list[ExperienceResponse]:
    rows = await service.list_experience(session)
    return [ExperienceResponse.model_validate(r) for r in rows]


@router.post("/experience", response_model=ExperienceResponse, status_code=201)
async def create_experience(
    body: ExperienceCreate,
    _admin: AdminDep,
    session: DbSession,
) -> ExperienceResponse:
    row = await service.create_experience(session, body)
    return ExperienceResponse.model_validate(row)


@router.put("/experience/{entry_id}", response_model=ExperienceResponse)
async def update_experience(
    entry_id: UUID,
    body: ExperienceUpdate,
    _admin: AdminDep,
    session: DbSession,
) -> ExperienceResponse:
    row = await service.update_experience(session, str(entry_id), body)
    if row is None:
        raise HTTPException(status_code=404, detail="Not found")
    return ExperienceResponse.model_validate(row)


@router.delete("/experience/{entry_id}", status_code=204)
async def delete_experience(
    entry_id: UUID,
    _admin: AdminDep,
    session: DbSession,
) -> Response:
    deleted = await service.delete_experience(session, str(entry_id))
    if not deleted:
        raise HTTPException(status_code=404, detail="Not found")
    return Response(status_code=204)


# --- Skills ---


@router.get("/skills", response_model=list[SkillResponse])
async def list_skills(
    session: DbSession,
) -> list[SkillResponse]:
    rows = await service.list_skills(session)
    return [SkillResponse.model_validate(r) for r in rows]


@router.post("/skills", response_model=SkillResponse, status_code=201)
async def create_skill(
    body: SkillCreate,
    _admin: AdminDep,
    session: DbSession,
) -> SkillResponse:
    row = await service.create_skill(session, body)
    return SkillResponse.model_validate(row)


@router.put("/skills/{skill_id}", response_model=SkillResponse)
async def update_skill(
    skill_id: UUID,
    body: SkillUpdate,
    _admin: AdminDep,
    session: DbSession,
) -> SkillResponse:
    row = await service.update_skill(session, str(skill_id), body)
    if row is None:
        raise HTTPException(status_code=404, detail="Not found")
    return SkillResponse.model_validate(row)


@router.delete("/skills/{skill_id}", status_code=204)
async def delete_skill(
    skill_id: UUID,
    _admin: AdminDep,
    session: DbSession,
) -> Response:
    deleted = await service.delete_skill(session, str(skill_id))
    if not deleted:
        raise HTTPException(status_code=404, detail="Not found")
    return Response(status_code=204)


# --- Social links ---


@router.get("/social-links", response_model=list[SocialLinkResponse])
async def list_social_links(
    session: DbSession,
) -> list[SocialLinkResponse]:
    rows = await service.list_social_links(session)
    return [SocialLinkResponse.model_validate(r) for r in rows]


@router.post("/social-links", response_model=SocialLinkResponse, status_code=201)
async def create_social_link(
    body: SocialLinkCreate,
    _admin: AdminDep,
    session: DbSession,
) -> SocialLinkResponse:
    row = await service.create_social_link(session, body)
    return SocialLinkResponse.model_validate(row)


@router.put("/social-links/{link_id}", response_model=SocialLinkResponse)
async def update_social_link(
    link_id: UUID,
    body: SocialLinkUpdate,
    _admin: AdminDep,
    session: DbSession,
) -> SocialLinkResponse:
    row = await service.update_social_link(session, str(link_id), body)
    if row is None:
        raise HTTPException(status_code=404, detail="Not found")
    return SocialLinkResponse.model_validate(row)


@router.delete("/social-links/{link_id}", status_code=204)
async def delete_social_link(
    link_id: UUID,
    _admin: AdminDep,
    session: DbSession,
) -> Response:
    deleted = await service.delete_social_link(session, str(link_id))
    if not deleted:
        raise HTTPException(status_code=404, detail="Not found")
    return Response(status_code=204)
