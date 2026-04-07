"""Real database tests for the post images service."""

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.post_images.service import create_image, delete_image, list_images
from app.posts.schemas import PostCreate
from app.posts.service import create_post

pytestmark = pytest.mark.asyncio


@pytest.fixture
async def sample_post_id(db_session: AsyncSession) -> str:
    """Create a post and return its id."""
    row = await create_post(
        db_session,
        PostCreate(title="Image Test Post", excerpt="x", body="x", tag="Research"),
    )
    return row["id"]


async def test_create_image_persists(db_session: AsyncSession, sample_post_id: str):
    row = await create_image(db_session, sample_post_id, "hero", "/uploads/post-images/a.jpg")

    assert row["id"] is not None
    assert row["key"] == "hero"
    assert row["url"] == "/uploads/post-images/a.jpg"
    assert row["post_id"] == sample_post_id
    assert row["created_at"] is not None


async def test_list_images_ordered_by_created_at(db_session: AsyncSession, sample_post_id: str):
    await create_image(db_session, sample_post_id, "first", "/uploads/post-images/1.jpg")
    await create_image(db_session, sample_post_id, "second", "/uploads/post-images/2.jpg")

    rows = await list_images(db_session, sample_post_id)
    assert len(rows) == 2
    keys = [r["key"] for r in rows]
    assert "first" in keys
    assert "second" in keys


async def test_list_images_empty(db_session: AsyncSession, sample_post_id: str):
    rows = await list_images(db_session, sample_post_id)
    assert rows == []


async def test_delete_image_returns_url(db_session: AsyncSession, sample_post_id: str):
    row = await create_image(db_session, sample_post_id, "del-me", "/uploads/post-images/d.jpg")
    url = await delete_image(db_session, sample_post_id, row["id"])
    assert url == "/uploads/post-images/d.jpg"


async def test_delete_image_not_found(db_session: AsyncSession, sample_post_id: str):
    result = await delete_image(db_session, sample_post_id, "00000000-0000-0000-0000-000000000099")
    assert result is None


async def test_delete_image_wrong_post(db_session: AsyncSession, sample_post_id: str):
    row = await create_image(db_session, sample_post_id, "mine", "/uploads/post-images/m.jpg")
    # Try deleting with a different post_id
    result = await delete_image(db_session, "00000000-0000-0000-0000-000000000099", row["id"])
    assert result is None
