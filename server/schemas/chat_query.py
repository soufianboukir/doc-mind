from pydantic import BaseModel, Field
import uuid
from datetime import datetime


class ChatQueryRequest(BaseModel):
    query: str = Field(
        min_length=1,
        max_length=4000,
    )


class SourceChunk(BaseModel):
    chunk_id: str
    document_id: str
    filename: str
    content: str
    page_number: int | None
    score: float


class ChatQueryResponse(BaseModel):
    answer: str
    sources: list[SourceChunk]


class MessageOut(BaseModel):
    id: uuid.UUID
    chat_id: uuid.UUID
    role: str
    content: str
    latency_ms: int | None = None
    llm_provider: str | None = None
    created_at: datetime
