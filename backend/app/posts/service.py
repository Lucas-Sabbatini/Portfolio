import logging
from datetime import UTC, datetime

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Post
from app.posts.schemas import PostCreate, PostUpdate, slugify
from app.utils import orm_to_dict

logger = logging.getLogger(__name__)


def compute_read_time(body: str) -> str:
    return f"{max(1, len(body.split()) // 200)} min read"


async def list_posts(session: AsyncSession, tag: str | None = None) -> list[dict]:
    stmt = (
        select(Post)
        .where(Post.status == "published")
        .order_by(Post.published_at.desc())
    )
    if tag:
        stmt = stmt.where(Post.tag == tag)
    result = await session.execute(stmt)
    rows = result.scalars().all()
    logger.info("Listed %d published posts", len(rows))
    return [orm_to_dict(r) for r in rows]


async def get_post_by_slug(session: AsyncSession, slug: str) -> dict | None:
    result = await session.execute(select(Post).where(Post.slug == slug))
    row = result.scalar_one_or_none()
    return orm_to_dict(row) if row else None


async def create_post(session: AsyncSession, data: PostCreate) -> dict:
    slug = data.slug if data.slug else slugify(data.title)
    read_time = data.read_time if data.read_time else compute_read_time(data.body)
    post = Post(
        slug=slug,
        title=data.title,
        excerpt=data.excerpt,
        body=data.body,
        tag=data.tag,
        status=data.status,
        cover_image=data.cover_image,
        read_time=read_time,
    )
    session.add(post)
    await session.flush()
    await session.refresh(post)
    logger.info("Created post: %s", slug)
    return orm_to_dict(post)


async def update_post(session: AsyncSession, slug: str, data: PostUpdate) -> dict | None:
    new_slug = data.slug if data.slug else slug
    read_time = data.read_time if data.read_time else compute_read_time(data.body)
    result = await session.execute(select(Post).where(Post.slug == slug))
    post = result.scalar_one_or_none()
    if post is None:
        return None
    post.slug = new_slug
    post.title = data.title
    post.excerpt = data.excerpt
    post.body = data.body
    post.tag = data.tag
    post.status = data.status
    post.cover_image = data.cover_image
    post.read_time = read_time
    post.updated_at = datetime.now(UTC)
    await session.flush()
    await session.refresh(post)
    logger.info("Updated post: %s", slug)
    return orm_to_dict(post)


async def delete_post(session: AsyncSession, slug: str) -> bool:
    result = await session.execute(delete(Post).where(Post.slug == slug))
    deleted = result.rowcount == 1
    if deleted:
        logger.info("Deleted post: %s", slug)
    return deleted


async def toggle_publish(session: AsyncSession, slug: str) -> dict | None:
    result = await session.execute(select(Post).where(Post.slug == slug))
    post = result.scalar_one_or_none()
    if post is None:
        return None
    new_status = "published" if post.status == "draft" else "draft"
    if new_status == "published" and post.published_at is None:
        post.published_at = datetime.now(UTC)
    post.status = new_status
    post.updated_at = datetime.now(UTC)
    await session.flush()
    await session.refresh(post)
    logger.info("Toggled post %s to %s", slug, new_status)
    return orm_to_dict(post)
