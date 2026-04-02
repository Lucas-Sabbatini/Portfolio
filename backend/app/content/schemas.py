from datetime import datetime

from pydantic import BaseModel


class ContentUpdate(BaseModel):
    value: str


class ExperienceCreate(BaseModel):
    role: str
    company: str
    period: str
    description: list[str] = []
    sort_order: int = 0


class ExperienceUpdate(BaseModel):
    role: str
    company: str
    period: str
    description: list[str] = []
    sort_order: int = 0


class ExperienceResponse(BaseModel):
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


class SkillUpdate(BaseModel):
    name: str
    category: str
    icon: str | None = None
    sort_order: int = 0


class SkillResponse(BaseModel):
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
    sort_order: int = 0


class SocialLinkUpdate(BaseModel):
    platform: str
    url: str
    label: str
    icon: str | None = None
    sort_order: int = 0


class SocialLinkResponse(BaseModel):
    id: str
    platform: str
    url: str
    label: str
    icon: str | None = None
    sort_order: int
