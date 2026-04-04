import logging

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_admin, get_optional_admin
from app.database import get_session
from app.posts import service
from app.posts.schemas import PostCreate, PostListItem, PostResponse, PostUpdate

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/posts", tags=["posts"])


@router.get("", response_model=list[PostListItem])
async def list_posts(
    tag: str | None = Query(default=None),
    status: str | None = Query(default=None),
    admin: dict[str, str] | None = Depends(get_optional_admin),
    session: AsyncSession = Depends(get_session),
) -> list[PostListItem]:
    if status and status != "published":
        if admin is None:
            raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        rows = await service.list_posts(session, tag=tag, status=status)
        return [PostListItem(id=str(r["id"]), **{k: r[k] for k in r if k != "id"}) for r in rows]
    except Exception as exc:
        logger.error("Error listing posts", exc_info=True)
        raise HTTPException(status_code=500, detail="internal server error") from exc


@router.get("/{slug}", response_model=PostResponse)
async def get_post(
    slug: str,
    admin: dict[str, str] | None = Depends(get_optional_admin),
    session: AsyncSession = Depends(get_session),
) -> PostResponse:
    try:
        row = await service.get_post_by_slug(session, slug)
    except Exception as exc:
        logger.error("Error getting post", exc_info=True)
        raise HTTPException(status_code=500, detail="internal server error") from exc
    if row is None:
        raise HTTPException(status_code=404, detail="Post not found")
    if row["status"] != "published" and admin is None:
        raise HTTPException(status_code=404, detail="Post not found")
    return PostResponse(id=str(row["id"]), **{k: row[k] for k in row if k != "id"})


@router.post("", response_model=PostResponse, status_code=201)
async def create_post(
    body: PostCreate,
    _admin: dict[str, str] = Depends(get_current_admin),
    session: AsyncSession = Depends(get_session),
) -> PostResponse:
    try:
        row = await service.create_post(session, body)
        return PostResponse(id=str(row["id"]), **{k: row[k] for k in row if k != "id"})
    except Exception as exc:
        logger.error("Error creating post", exc_info=True)
        raise HTTPException(status_code=500, detail="internal server error") from exc


@router.put("/{slug}", response_model=PostResponse)
async def update_post(
    slug: str,
    body: PostUpdate,
    _admin: dict[str, str] = Depends(get_current_admin),
    session: AsyncSession = Depends(get_session),
) -> PostResponse:
    try:
        row = await service.update_post(session, slug, body)
    except Exception as exc:
        logger.error("Error updating post", exc_info=True)
        raise HTTPException(status_code=500, detail="internal server error") from exc
    if row is None:
        raise HTTPException(status_code=404, detail="Post not found")
    return PostResponse(id=str(row["id"]), **{k: row[k] for k in row if k != "id"})


@router.delete("/{slug}", status_code=204)
async def delete_post(
    slug: str,
    _admin: dict[str, str] = Depends(get_current_admin),
    session: AsyncSession = Depends(get_session),
) -> Response:
    try:
        deleted = await service.delete_post(session, slug)
    except Exception as exc:
        logger.error("Error deleting post", exc_info=True)
        raise HTTPException(status_code=500, detail="internal server error") from exc
    if not deleted:
        raise HTTPException(status_code=404, detail="Post not found")
    return Response(status_code=204)


@router.patch("/{slug}/publish", response_model=PostResponse)
async def publish_post(
    slug: str,
    _admin: dict[str, str] = Depends(get_current_admin),
    session: AsyncSession = Depends(get_session),
) -> PostResponse:
    try:
        row = await service.toggle_publish(session, slug)
    except Exception as exc:
        logger.error("Error toggling publish", exc_info=True)
        raise HTTPException(status_code=500, detail="internal server error") from exc
    if row is None:
        raise HTTPException(status_code=404, detail="Post not found")
    return PostResponse(id=str(row["id"]), **{k: row[k] for k in row if k != "id"})
