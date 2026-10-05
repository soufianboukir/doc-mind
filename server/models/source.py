import uuid
from datetime import datetime

from sqlalchemy import ForeignKey, Integer, Numeric, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from db.db import Base


class MessageSource(Base):
    __tablename__ = "sources"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    message_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("messages.id", ondelete="CASCADE")
    )
    chunk_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("chunks.id", ondelete="CASCADE")
    )
    score: Mapped[float] = mapped_column(Numeric(5, 4))
    rank: Mapped[int] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())