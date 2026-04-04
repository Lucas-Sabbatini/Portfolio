import logging
from datetime import UTC, datetime

from sqlalchemy import delete, select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import ContentBlock, ExperienceEntry, Skill, SocialLink
from app.utils import orm_to_dict

logger = logging.getLogger(__name__)


# --- Content blocks ---


async def get_content_section(session: AsyncSession, section: str) -> dict[str, str]:
    result = await session.execute(
        select(ContentBlock).where(ContentBlock.section == section)
    )
    return {row.key: row.value for row in result.scalars().all()}


async def upsert_content(session: AsyncSession, section: str, key: str, value: str) -> None:
    stmt = (
        pg_insert(ContentBlock)
        .values(section=section, key=key, value=value)
        .on_conflict_do_update(
            constraint="content_blocks_section_key",
            set_={"value": value, "updated_at": datetime.now(UTC)},
        )
    )
    await session.execute(stmt)
    logger.info("Upserted content block %s/%s", section, key)


# --- Experience ---


async def list_experience(session: AsyncSession) -> list[dict]:
    result = await session.execute(
        select(ExperienceEntry).order_by(ExperienceEntry.sort_order)
    )
    return [orm_to_dict(r) for r in result.scalars().all()]


async def create_experience(
    session: AsyncSession,
    role: str,
    company: str,
    period: str,
    description: list[str],
    sort_order: int,
) -> dict:
    entry = ExperienceEntry(
        role=role,
        company=company,
        period=period,
        description=description,
        sort_order=sort_order,
    )
    session.add(entry)
    await session.flush()
    await session.refresh(entry)
    logger.info("Created experience entry: %s at %s", role, company)
    return orm_to_dict(entry)


async def update_experience(
    session: AsyncSession,
    entry_id: str,
    role: str,
    company: str,
    period: str,
    description: list[str],
    sort_order: int,
) -> dict | None:
    result = await session.execute(
        select(ExperienceEntry).where(ExperienceEntry.id == entry_id)
    )
    entry = result.scalar_one_or_none()
    if entry is None:
        return None
    entry.role = role
    entry.company = company
    entry.period = period
    entry.description = description
    entry.sort_order = sort_order
    entry.updated_at = datetime.now(UTC)
    await session.flush()
    await session.refresh(entry)
    logger.info("Updated experience entry: %s", entry_id)
    return orm_to_dict(entry)


async def delete_experience(session: AsyncSession, entry_id: str) -> bool:
    result = await session.execute(
        delete(ExperienceEntry).where(ExperienceEntry.id == entry_id)
    )
    deleted = result.rowcount == 1
    if deleted:
        logger.info("Deleted experience entry: %s", entry_id)
    return deleted


# --- Skills ---


async def list_skills(session: AsyncSession) -> list[dict]:
    result = await session.execute(select(Skill).order_by(Skill.sort_order))
    return [orm_to_dict(r) for r in result.scalars().all()]


async def create_skill(
    session: AsyncSession, name: str, category: str, icon: str | None, sort_order: int
) -> dict:
    skill = Skill(name=name, category=category, icon=icon, sort_order=sort_order)
    session.add(skill)
    await session.flush()
    await session.refresh(skill)
    logger.info("Created skill: %s", name)
    return orm_to_dict(skill)


async def update_skill(
    session: AsyncSession,
    skill_id: str,
    name: str,
    category: str,
    icon: str | None,
    sort_order: int,
) -> dict | None:
    result = await session.execute(select(Skill).where(Skill.id == skill_id))
    skill = result.scalar_one_or_none()
    if skill is None:
        return None
    skill.name = name
    skill.category = category
    skill.icon = icon
    skill.sort_order = sort_order
    await session.flush()
    await session.refresh(skill)
    logger.info("Updated skill: %s", skill_id)
    return orm_to_dict(skill)


async def delete_skill(session: AsyncSession, skill_id: str) -> bool:
    result = await session.execute(delete(Skill).where(Skill.id == skill_id))
    deleted = result.rowcount == 1
    if deleted:
        logger.info("Deleted skill: %s", skill_id)
    return deleted


# --- Social links ---


async def list_social_links(session: AsyncSession) -> list[dict]:
    result = await session.execute(select(SocialLink).order_by(SocialLink.sort_order))
    return [orm_to_dict(r) for r in result.scalars().all()]


async def create_social_link(
    session: AsyncSession,
    platform: str,
    url: str,
    label: str,
    icon: str | None,
    color: str | None,
    sort_order: int,
) -> dict:
    link = SocialLink(
        platform=platform,
        url=url,
        label=label,
        icon=icon,
        color=color,
        sort_order=sort_order,
    )
    session.add(link)
    await session.flush()
    await session.refresh(link)
    logger.info("Created social link: %s", platform)
    return orm_to_dict(link)


async def update_social_link(
    session: AsyncSession,
    link_id: str,
    platform: str,
    url: str,
    label: str,
    icon: str | None,
    color: str | None,
    sort_order: int,
) -> dict | None:
    result = await session.execute(select(SocialLink).where(SocialLink.id == link_id))
    link = result.scalar_one_or_none()
    if link is None:
        return None
    link.platform = platform
    link.url = url
    link.label = label
    link.icon = icon
    link.color = color
    link.sort_order = sort_order
    await session.flush()
    await session.refresh(link)
    logger.info("Updated social link: %s", link_id)
    return orm_to_dict(link)


async def delete_social_link(session: AsyncSession, link_id: str) -> bool:
    result = await session.execute(delete(SocialLink).where(SocialLink.id == link_id))
    deleted = result.rowcount == 1
    if deleted:
        logger.info("Deleted social link: %s", link_id)
    return deleted
