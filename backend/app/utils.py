from app.models import Base


def orm_to_dict(obj: Base) -> dict:
    return {c.name: getattr(obj, c.name) for c in obj.__table__.columns}
