"""Real database tests for the posts service."""

import pytest
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.posts.schemas import PostCreate, PostUpdate
from app.posts.service import (
    create_post,
    delete_post,
    get_post_by_slug,
    list_posts,
    toggle_publish,
    update_post,
)

pytestmark = pytest.mark.asyncio


@pytest.fixture
def draft_data() -> PostCreate:
    return PostCreate(
        title="Test Post",
        excerpt="An excerpt",
        body="Body content " * 20,
        tag="Research",
        status="draft",
    )


@pytest.fixture
def published_data() -> PostCreate:
    return PostCreate(
        title="Published Post",
        excerpt="An excerpt",
        body="Body content " * 20,
        tag="Research",
        status="published",
    )


async def test_create_post_persists(db_session: AsyncSession, draft_data: PostCreate):
    row = await create_post(db_session, draft_data)
    assert row["id"] is not None
    assert row["slug"] == "test-post"
    assert row["status"] == "draft"
    assert row["created_at"] is not None


async def test_create_post_auto_slug(db_session: AsyncSession):
    data = PostCreate(title="Hello World!", excerpt="x", body="x", tag="Research")
    row = await create_post(db_session, data)
    assert row["slug"] == "hello-world"


async def test_create_post_auto_read_time(db_session: AsyncSession):
    data = PostCreate(title="My Post", excerpt="x", body="word " * 400, tag="Research")
    row = await create_post(db_session, data)
    assert row["read_time"] == "2 min read"


async def test_create_post_duplicate_slug_raises(db_session: AsyncSession, draft_data: PostCreate):
    await create_post(db_session, draft_data)
    with pytest.raises(IntegrityError):
        await create_post(db_session, draft_data)


async def test_get_post_by_slug_found(db_session: AsyncSession, draft_data: PostCreate):
    await create_post(db_session, draft_data)
    row = await get_post_by_slug(db_session, "test-post")
    assert row is not None
    assert row["title"] == "Test Post"


async def test_get_post_by_slug_not_found(db_session: AsyncSession):
    row = await get_post_by_slug(db_session, "nonexistent")
    assert row is None


async def test_list_posts_returns_only_published(
    db_session: AsyncSession,
    draft_data: PostCreate,
    published_data: PostCreate,
):
    await create_post(db_session, draft_data)
    await create_post(db_session, published_data)
    rows = await list_posts(db_session)
    assert all(r["status"] == "published" for r in rows)
    slugs = [r["slug"] for r in rows]
    assert "published-post" in slugs
    assert "test-post" not in slugs


async def test_list_posts_tag_filter(db_session: AsyncSession):
    await create_post(db_session, PostCreate(title="A", excerpt="x", body="x", tag="Research", status="published"))
    await create_post(db_session, PostCreate(title="B", excerpt="x", body="x", tag="Archived", status="published"))
    rows = await list_posts(db_session, tag="Research")
    assert all(r["tag"] == "Research" for r in rows)


async def test_update_post_changes_fields(db_session: AsyncSession, draft_data: PostCreate):
    await create_post(db_session, draft_data)
    update = PostUpdate(title="Updated", excerpt="New excerpt", body="New body", tag="Archived")
    row = await update_post(db_session, "test-post", update)
    assert row is not None
    assert row["title"] == "Updated"
    assert row["tag"] == "Archived"


async def test_update_post_not_found_returns_none(db_session: AsyncSession):
    update = PostUpdate(title="x", excerpt="x", body="x", tag="Research")
    row = await update_post(db_session, "nonexistent", update)
    assert row is None


async def test_delete_post_returns_true(db_session: AsyncSession, draft_data: PostCreate):
    await create_post(db_session, draft_data)
    deleted = await delete_post(db_session, "test-post")
    assert deleted is True


async def test_delete_post_nonexistent_returns_false(db_session: AsyncSession):
    deleted = await delete_post(db_session, "nonexistent")
    assert deleted is False


async def test_toggle_publish_draft_to_published(db_session: AsyncSession, draft_data: PostCreate):
    await create_post(db_session, draft_data)
    row = await toggle_publish(db_session, "test-post")
    assert row is not None
    assert row["status"] == "published"
    assert row["published_at"] is not None


async def test_toggle_publish_sets_published_at_once(db_session: AsyncSession, draft_data: PostCreate):
    await create_post(db_session, draft_data)
    published = await toggle_publish(db_session, "test-post")
    first_published_at = published["published_at"]
    # Toggle back to draft
    await toggle_publish(db_session, "test-post")
    # Toggle to published again — published_at should not change
    republished = await toggle_publish(db_session, "test-post")
    assert republished["published_at"] == first_published_at


async def test_toggle_publish_nonexistent_returns_none(db_session: AsyncSession):
    row = await toggle_publish(db_session, "nonexistent")
    assert row is None
