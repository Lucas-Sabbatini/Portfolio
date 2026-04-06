from datetime import datetime

from pydantic import BaseModel


class PostImageResponse(BaseModel):
    id: str
    key: str
    url: str
    post_id: str
    created_at: datetime | None = None
