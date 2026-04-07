import logging
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_admin, get_optional_admin
from app.database import get_session
from app.posts import service
from app.posts.schemas import PostCreate, PostListItem, PostResponse, PostUpdate

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/posts", tags=["posts"])

DbSession = Annotated[AsyncSession, Depends(get_session)]
AdminDep = Annotated[dict[str, str], Depends(get_current_admin)]
OptionalAdminDep = Annotated[dict[str, str] | None, Depends(get_optional_admin)]


@router.get("", response_model=list[PostListItem])
async def list_posts(
    tag: str | None = Query(default=None),
    status: str | None = Query(default=None),
    admin: OptionalAdminDep = None,
    session: DbSession = None,  # type: ignore[assignment]
) -> list[PostListItem]:
    if status and status != "published":
        if admin is None:
            raise HTTPException(status_code=401, detail="Not authenticated")
    rows = await service.list_posts(session, tag=tag, status=status)
    return [PostListItem.model_validate(r) for r in rows]


@router.get("/{slug}", response_model=PostResponse)
async def get_post(
    slug: str,
    admin: OptionalAdminDep = None,
    session: DbSession = None,  # type: ignore[assignment]
) -> PostResponse:
    row = await service.get_post_by_slug(session, slug)
    if row is None:
        raise HTTPException(status_code=404, detail="Post not found")
    if row["status"] != "published" and admin is None:
        raise HTTPException(status_code=404, detail="Post not found")
    return PostResponse.model_validate(row)


@router.post("", response_model=PostResponse, status_code=201)
async def create_post(
    body: PostCreate,
    _admin: AdminDep,
    session: DbSession,
) -> PostResponse:
    row = await service.create_post(session, body)
    return PostResponse.model_validate(row)


@router.put("/{slug}", response_model=PostResponse)
async def update_post(
    slug: str,
    body: PostUpdate,
    _admin: AdminDep,
    session: DbSession,
) -> PostResponse:
    row = await service.update_post(session, slug, body)
    if row is None:
        raise HTTPException(status_code=404, detail="Post not found")
    return PostResponse.model_validate(row)


@router.delete("/{slug}", status_code=204)
async def delete_post(
    slug: str,
    _admin: AdminDep,
    session: DbSession,
) -> Response:
    deleted = await service.delete_post(session, slug)
    if not deleted:
        raise HTTPException(status_code=404, detail="Post not found")
    return Response(status_code=204)


@router.patch("/{slug}/publish", response_model=PostResponse)
async def publish_post(
    slug: str,
    _admin: AdminDep,
    session: DbSession,
) -> PostResponse:
    row = await service.toggle_publish(session, slug)
    if row is None:
        raise HTTPException(status_code=404, detail="Post not found")
    return PostResponse.model_validate(row)
