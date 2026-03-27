import re
from datetime import datetime
from typing import Optional

from pydantic import BaseModel


def slugify(title: str) -> str:
    slug = title.lower().strip()
    slug = re.sub(r"[^\w\s-]", "", slug)
    slug = re.sub(r"[\s_-]+", "-", slug)
    return re.sub(r"^-+|-+$", "", slug)


class PostCreate(BaseModel):
    title: str
    excerpt: str
    body: str = ""
    tag: str
    slug: Optional[str] = None
    cover_image: Optional[str] = None
    read_time: Optional[str] = None
    status: str = "draft"


class PostUpdate(BaseModel):
    title: str
    excerpt: str
    body: str = ""
    tag: str
    slug: Optional[str] = None
    cover_image: Optional[str] = None
    read_time: Optional[str] = None
    status: str = "draft"


class PostResponse(BaseModel):
    id: str
    slug: str
    title: str
    excerpt: str
    body: str
    tag: str
    status: str
    cover_image: Optional[str] = None
    read_time: Optional[str] = None
    published_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class PostListItem(BaseModel):
    id: str
    slug: str
    title: str
    excerpt: str
    tag: str
    status: str
    cover_image: Optional[str] = None
    read_time: Optional[str] = None
    published_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
