import logging
from datetime import UTC, datetime

from app.database import get_pool
from app.posts.schemas import PostCreate, PostUpdate, slugify

logger = logging.getLogger(__name__)


def compute_read_time(body: str) -> str:
    return f"{max(1, len(body.split()) // 200)} min read"


async def list_posts(tag: str | None = None) -> list[dict]:
    try:
        pool = await get_pool()
        if tag:
            rows = await pool.fetch(
                "SELECT id, slug, title, excerpt, tag, status, cover_image, read_time, "
                "published_at, created_at, updated_at FROM posts "
                "WHERE status = 'published' AND tag = $1 ORDER BY published_at DESC",
                tag,
            )
        else:
            rows = await pool.fetch(
                "SELECT id, slug, title, excerpt, tag, status, cover_image, read_time, "
                "published_at, created_at, updated_at FROM posts "
                "WHERE status = 'published' ORDER BY published_at DESC",
            )
        logger.info("Listed %d published posts", len(rows))
        return [dict(r) for r in rows]
    except Exception:
        logger.error("Database error listing posts", exc_info=True)
        raise


async def get_post_by_slug(slug: str) -> dict | None:
    try:
        pool = await get_pool()
        row = await pool.fetchrow(
            "SELECT id, slug, title, excerpt, body, tag, status, cover_image, read_time, "
            "published_at, created_at, updated_at FROM posts WHERE slug = $1",
            slug,
        )
        if row is None:
            return None
        return dict(row)
    except Exception:
        logger.error("Database error getting post by slug: %s", slug, exc_info=True)
        raise


async def create_post(data: PostCreate) -> dict:
    slug = data.slug if data.slug else slugify(data.title)
    read_time = data.read_time if data.read_time else compute_read_time(data.body)
    try:
        pool = await get_pool()
        row = await pool.fetchrow(
            "INSERT INTO posts (slug, title, excerpt, body, tag, status, cover_image, read_time) "
            "VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *",
            slug, data.title, data.excerpt, data.body, data.tag, data.status,
            data.cover_image, read_time,
        )
        logger.info("Created post: %s", slug)
        return dict(row)
    except Exception:
        logger.error("Database error creating post", exc_info=True)
        raise


async def update_post(slug: str, data: PostUpdate) -> dict | None:
    new_slug = data.slug if data.slug else slug
    read_time = data.read_time if data.read_time else compute_read_time(data.body)
    try:
        pool = await get_pool()
        row = await pool.fetchrow(
            "UPDATE posts SET slug = $1, title = $2, excerpt = $3, body = $4, tag = $5, "
            "status = $6, cover_image = $7, read_time = $8, updated_at = now() "
            "WHERE slug = $9 RETURNING *",
            new_slug, data.title, data.excerpt, data.body, data.tag,
            data.status, data.cover_image, read_time, slug,
        )
        if row:
            logger.info("Updated post: %s", slug)
        return dict(row) if row else None
    except Exception:
        logger.error("Database error updating post: %s", slug, exc_info=True)
        raise


async def delete_post(slug: str) -> bool:
    try:
        pool = await get_pool()
        result = await pool.execute("DELETE FROM posts WHERE slug = $1", slug)
        deleted = result == "DELETE 1"
        if deleted:
            logger.info("Deleted post: %s", slug)
        return deleted
    except Exception:
        logger.error("Database error deleting post: %s", slug, exc_info=True)
        raise


async def toggle_publish(slug: str) -> dict | None:
    try:
        pool = await get_pool()
        row = await pool.fetchrow("SELECT * FROM posts WHERE slug = $1", slug)
        if row is None:
            return None

        new_status = "published" if row["status"] == "draft" else "draft"
        published_at = row["published_at"]
        if new_status == "published" and published_at is None:
            published_at = datetime.now(UTC)

        updated = await pool.fetchrow(
            "UPDATE posts SET status = $1, published_at = $2, updated_at = now() "
            "WHERE slug = $3 RETURNING *",
            new_status, published_at, slug,
        )
        logger.info("Toggled post %s to %s", slug, new_status)
        return dict(updated) if updated else None
    except Exception:
        logger.error("Database error toggling publish for: %s", slug, exc_info=True)
        raise
