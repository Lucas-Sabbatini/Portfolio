from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ContentUpdate(BaseModel):
    value: str


class ExperienceCreate(BaseModel):
    role: str
    company: str
    period: str
    description: list[str] = []
    sort_order: int = 0


# ExperienceCreate and ExperienceUpdate are identical
ExperienceUpdate = ExperienceCreate


class ExperienceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    role: str
    company: str
    period: str
    description: list[str]
    sort_order: int
    updated_at: datetime | None = None


class SkillCreate(BaseModel):
    name: str
    category: str
    icon: str | None = None
    sort_order: int = 0


# SkillCreate and SkillUpdate are identical
SkillUpdate = SkillCreate


class SkillResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    category: str
    icon: str | None = None
    sort_order: int


class SocialLinkCreate(BaseModel):
    platform: str
    url: str
    label: str
    icon: str | None = None
    color: str | None = None
    sort_order: int = 0


# SocialLinkCreate and SocialLinkUpdate are identical
SocialLinkUpdate = SocialLinkCreate


class SocialLinkResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    platform: str
    url: str
    label: str
    icon: str | None = None
    color: str | None = None
    sort_order: int
