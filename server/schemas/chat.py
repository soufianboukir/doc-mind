import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class ChatCreate(BaseModel):
    title: str = Field(
        min_length=1,
        max_length=200,
    )


class ChatUpdate(BaseModel):
    title: str = Field(
        min_length=1,
        max_length=200,
    )


class ChatOut(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    title: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
