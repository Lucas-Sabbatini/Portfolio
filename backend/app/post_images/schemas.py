from datetime import datetime

from pydantic import BaseModel, ConfigDict


class PostImageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    key: str
    url: str
    post_id: str
    created_at: datetime | None = None
