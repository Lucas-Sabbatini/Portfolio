import logging

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import PostImage
from app.utils import orm_to_dict

logger = logging.getLogger(__name__)


async def list_images(session: AsyncSession, post_id: str) -> list[dict]:
    result = await session.execute(
        select(PostImage).where(PostImage.post_id == post_id).order_by(PostImage.created_at)
    )
    return [orm_to_dict(r) for r in result.scalars().all()]


async def create_image(session: AsyncSession, post_id: str, key: str, url: str) -> dict:
    image = PostImage(post_id=post_id, key=key, url=url)
    session.add(image)
    await session.flush()
    await session.refresh(image)
    logger.info("Created post image: key=%s for post=%s", key, post_id)
    return orm_to_dict(image)


async def delete_image(session: AsyncSession, post_id: str, image_id: str) -> str | None:
    result = await session.execute(
        select(PostImage).where(PostImage.id == image_id, PostImage.post_id == post_id)
    )
    image = result.scalar_one_or_none()
    if image is None:
        return None
    url = image.url
    await session.execute(delete(PostImage).where(PostImage.id == image_id))
    logger.info("Deleted post image: %s", image_id)
    return url
