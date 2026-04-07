import re
from datetime import datetime

from pydantic import BaseModel, ConfigDict


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
    slug: str | None = None
    cover_image: str | None = None
    read_time: str | None = None
    status: str = "draft"


# PostCreate and PostUpdate are identical — use PostCreate for both
PostUpdate = PostCreate


class PostImageItem(BaseModel):
    key: str
    url: str


class PostResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    slug: str
    title: str
    excerpt: str
    body: str
    tag: str
    status: str
    cover_image: str | None = None
    read_time: str | None = None
    published_at: datetime | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None
    images: list[PostImageItem] = []


class PostListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    slug: str
    title: str
    excerpt: str
    tag: str
    status: str
    cover_image: str | None = None
    read_time: str | None = None
    published_at: datetime | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None
