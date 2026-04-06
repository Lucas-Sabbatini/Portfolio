from uuid import UUID

from app.models import Base


def orm_to_dict(obj: Base) -> dict:
    result = {}
    for c in obj.__table__.columns:
        val = getattr(obj, c.name)
        if isinstance(val, UUID):
            val = str(val)
        result[c.name] = val
    return result
