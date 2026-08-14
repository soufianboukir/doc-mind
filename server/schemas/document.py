import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class DocumentOut(BaseModel):
    id: uuid.UUID
    chat_id: uuid.UUID
    user_id: uuid.UUID

    filename: str
    storage_path: str

    mime_type: str | None
    file_size_bytes: int | None

    language: str | None
    page_count: int | None

    status: str
    error_message: str | None

    uploaded_at: datetime
    processed_at: datetime | None

    model_config = ConfigDict(from_attributes=True)


class ChatDocumentsOut(BaseModel):
    id: uuid.UUID
    title: str
    created_at: datetime
    updated_at: datetime
    documents: list[DocumentOut]

    model_config = ConfigDict(from_attributes=True)