"""Real database tests for the content service."""

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.content.schemas import ExperienceCreate, SkillCreate, SocialLinkCreate
from app.content.service import (
    create_experience,
    create_skill,
    create_social_link,
    delete_experience,
    delete_skill,
    delete_social_link,
    get_content_section,
    list_experience,
    list_skills,
    list_social_links,
    update_experience,
    update_skill,
    update_social_link,
    upsert_content,
)

pytestmark = pytest.mark.asyncio


# ---------------------------------------------------------------------------
# Content blocks
# ---------------------------------------------------------------------------


async def test_upsert_content_insert(db_session: AsyncSession):
    await upsert_content(db_session, "hero", "title", "Hello World")
    result = await get_content_section(db_session, "hero")
    assert result["title"] == "Hello World"


async def test_upsert_content_update(db_session: AsyncSession):
    await upsert_content(db_session, "hero", "title", "First")
    await upsert_content(db_session, "hero", "title", "Second")
    result = await get_content_section(db_session, "hero")
    assert result["title"] == "Second"


async def test_upsert_content_no_duplicate_row(db_session: AsyncSession):
    await upsert_content(db_session, "about", "bio", "v1")
    await upsert_content(db_session, "about", "bio", "v2")
    result = await get_content_section(db_session, "about")
    assert len(result) == 1


async def test_get_content_section_empty(db_session: AsyncSession):
    result = await get_content_section(db_session, "nonexistent_section")
    assert result == {}


# ---------------------------------------------------------------------------
# Experience
# ---------------------------------------------------------------------------


async def test_list_experience_ordered_by_sort_order(db_session: AsyncSession):
    await create_experience(
        db_session, ExperienceCreate(role="Junior Dev", company="Corp A", period="2018-2020", description=["task a"], sort_order=2)
    )
    await create_experience(
        db_session, ExperienceCreate(role="Senior Dev", company="Corp B", period="2020-2023", description=["task b"], sort_order=1)
    )
    rows = await list_experience(db_session)
    assert rows[0]["sort_order"] == 1
    assert rows[1]["sort_order"] == 2


async def test_create_experience_description_array(db_session: AsyncSession):
    items = ["Built things", "Led team", "Shipped features"]
    row = await create_experience(db_session, ExperienceCreate(role="Engineer", company="Acme", period="2020-2023", description=items, sort_order=0))
    assert row["description"] == items


async def test_update_experience_changes_fields(db_session: AsyncSession):
    row = await create_experience(db_session, ExperienceCreate(role="Dev", company="OldCo", period="2019-2021", sort_order=0))
    updated = await update_experience(
        db_session, str(row["id"]), ExperienceCreate(role="Senior Dev", company="NewCo", period="2021-2024", description=["promoted"], sort_order=1)
    )
    assert updated is not None
    assert updated["role"] == "Senior Dev"
    assert updated["company"] == "NewCo"


async def test_update_experience_not_found(db_session: AsyncSession):
    result = await update_experience(
        db_session, "00000000-0000-0000-0000-000000000099", ExperienceCreate(role="x", company="x", period="x", sort_order=0)
    )
    assert result is None


async def test_delete_experience_returns_true(db_session: AsyncSession):
    row = await create_experience(db_session, ExperienceCreate(role="Dev", company="Co", period="2020-2021", sort_order=0))
    deleted = await delete_experience(db_session, str(row["id"]))
    assert deleted is True


async def test_delete_experience_nonexistent(db_session: AsyncSession):
    deleted = await delete_experience(db_session, "00000000-0000-0000-0000-000000000099")
    assert deleted is False


# ---------------------------------------------------------------------------
# Skills
# ---------------------------------------------------------------------------


async def test_list_skills_ordered_by_sort_order(db_session: AsyncSession):
    await create_skill(db_session, SkillCreate(name="Go", category="Backend", sort_order=2))
    await create_skill(db_session, SkillCreate(name="Python", category="Backend", sort_order=1))
    rows = await list_skills(db_session)
    assert rows[0]["sort_order"] == 1
    assert rows[1]["sort_order"] == 2


async def test_create_skill_with_icon(db_session: AsyncSession):
    row = await create_skill(db_session, SkillCreate(name="Python", category="Backend", icon="python-icon", sort_order=0))
    assert row["name"] == "Python"
    assert row["icon"] == "python-icon"
    assert row["id"] is not None


async def test_update_skill(db_session: AsyncSession):
    row = await create_skill(db_session, SkillCreate(name="JS", category="Frontend", sort_order=0))
    updated = await update_skill(
        db_session, str(row["id"]), SkillCreate(name="TypeScript", category="Frontend", icon="ts-icon", sort_order=1)
    )
    assert updated is not None
    assert updated["name"] == "TypeScript"
    assert updated["icon"] == "ts-icon"


async def test_update_skill_not_found(db_session: AsyncSession):
    result = await update_skill(
        db_session, "00000000-0000-0000-0000-000000000099", SkillCreate(name="x", category="x", sort_order=0)
    )
    assert result is None


async def test_delete_skill(db_session: AsyncSession):
    row = await create_skill(db_session, SkillCreate(name="CSS", category="Frontend", sort_order=0))
    deleted = await delete_skill(db_session, str(row["id"]))
    assert deleted is True


async def test_delete_skill_nonexistent(db_session: AsyncSession):
    deleted = await delete_skill(db_session, "00000000-0000-0000-0000-000000000099")
    assert deleted is False


# ---------------------------------------------------------------------------
# Social links
# ---------------------------------------------------------------------------


async def test_list_social_links_ordered_by_sort_order(db_session: AsyncSession):
    await create_social_link(
        db_session, SocialLinkCreate(platform="Twitter", url="https://twitter.com", label="Twitter", sort_order=2)
    )
    await create_social_link(
        db_session, SocialLinkCreate(platform="GitHub", url="https://github.com", label="GitHub", sort_order=1)
    )
    rows = await list_social_links(db_session)
    assert rows[0]["sort_order"] == 1
    assert rows[1]["sort_order"] == 2


async def test_create_social_link_with_icon_and_color(db_session: AsyncSession):
    row = await create_social_link(
        db_session, SocialLinkCreate(platform="GitHub", url="https://github.com/user", label="GitHub", icon="github", color="#333", sort_order=0)
    )
    assert row["platform"] == "GitHub"
    assert row["icon"] == "github"
    assert row["color"] == "#333"
    assert row["id"] is not None


async def test_update_social_link(db_session: AsyncSession):
    row = await create_social_link(
        db_session, SocialLinkCreate(platform="LinkedIn", url="https://linkedin.com/old", label="LinkedIn", sort_order=0)
    )
    updated = await update_social_link(
        db_session,
        str(row["id"]),
        SocialLinkCreate(platform="LinkedIn", url="https://linkedin.com/new", label="LinkedIn", icon="li", color="#0077b5", sort_order=1),
    )
    assert updated is not None
    assert updated["url"] == "https://linkedin.com/new"
    assert updated["icon"] == "li"


async def test_update_social_link_not_found(db_session: AsyncSession):
    result = await update_social_link(
        db_session,
        "00000000-0000-0000-0000-000000000099",
        SocialLinkCreate(platform="x", url="https://x.com", label="x", sort_order=0),
    )
    assert result is None


async def test_delete_social_link(db_session: AsyncSession):
    row = await create_social_link(db_session, SocialLinkCreate(platform="X", url="https://x.com", label="X", sort_order=0))
    deleted = await delete_social_link(db_session, str(row["id"]))
    assert deleted is True


async def test_delete_social_link_nonexistent(db_session: AsyncSession):
    deleted = await delete_social_link(db_session, "00000000-0000-0000-0000-000000000099")
    assert deleted is False
