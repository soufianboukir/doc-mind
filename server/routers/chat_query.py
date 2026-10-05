import time
import uuid

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)
from sqlalchemy.orm import Session

from db.db import get_db
from models.chat import Chat
from collections import defaultdict

from models.chunk import Chunk     
from models.document import Document
from models.source import MessageSource
from schemas.chat_query import MessageWithSources

from models.message import Message, MessageRole
from models.user import User
from routers.auth import get_current_user
from schemas.chat_query import (
    ChatQueryRequest,
    ChatQueryResponse,
    MessageOut,
    SourceChunk,
)
from services.embedding import generate_embeddings
from services.llm_service import generate_answer
from services.retrieval_service import retrieve_chunks
from config.config import settings

router = APIRouter(
    prefix="/api/v1/chats",
    tags=["chat-query"],
)

MIN_SIMILARITY = 0.5


@router.post(
    "/{chat_id}/query",
    response_model=ChatQueryResponse,
)
def query_chat(
    chat_id: uuid.UUID,
    payload: ChatQueryRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):

    # ---------------------------------------------------------
    # 1. Validate query
    # ---------------------------------------------------------

    print(chat_id, payload.query)
    query = payload.query.strip()

    if not query:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Query cannot be empty.",
        )

    # ---------------------------------------------------------
    # 2. Verify chat ownership
    # ---------------------------------------------------------

    chat = (
        db.query(Chat)
        .filter(
            Chat.id == chat_id,
            Chat.user_id == current_user.id,
        )
        .first()
    )

    if chat is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat not found.",
        )

    # ---------------------------------------------------------
    # 3. Store user message
    # ---------------------------------------------------------

    user_message = Message(
        id=uuid.uuid4(),
        chat_id=chat_id,
        role=MessageRole.USER,
        content=query,
    )

    db.add(user_message)
    db.commit()
    db.refresh(user_message)

    # ---------------------------------------------------------
    # Start measuring RAG latency
    # ---------------------------------------------------------

    start_time = time.perf_counter()

    # ---------------------------------------------------------
    # 4. Generate query embedding
    # ---------------------------------------------------------

    try:
        query_embedding = generate_embeddings(
            [query],
            input_type="search_query",
        )[0]

    except Exception as e:
        print("Embedding error:", repr(e))
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to generate query embedding: {e}",
        ) from e

    # ---------------------------------------------------------
    # 5. Retrieve relevant chunks
    # ---------------------------------------------------------

    try:
        results = retrieve_chunks(
            db=db,
            chat_id=chat_id,
            query_embedding=query_embedding,
        )

    except Exception as e:
        print("Retrieval error:", repr(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve document context: {e}",
        ) from e

    # Keep only sufficiently similar chunks
    results = [
        chunk for chunk in results
        if float(chunk["similarity"]) > MIN_SIMILARITY
    ]

    if not results:
        latency_ms = int((time.perf_counter() - start_time) * 1000)

        answer = (
            "I couldn't find any content in your documents "
            "relevant to your question."
        )

        assistant_message = Message(
            id=uuid.uuid4(),
            chat_id=chat_id,
            role=MessageRole.ASSISTANT,
            content=answer,
            latency_ms=latency_ms,
            llm_provider=None,
        )

        db.add(assistant_message)
        db.commit()
        db.refresh(assistant_message)

        return ChatQueryResponse(
            message=MessageOut(
                id=assistant_message.id,
                chat_id=assistant_message.chat_id,
                role=assistant_message.role.value,
                content=assistant_message.content,
                latency_ms=assistant_message.latency_ms,
                llm_provider=assistant_message.llm_provider,
                created_at=assistant_message.created_at,
            ),
            sources=[],
        )

    # ---------------------------------------------------------
    # 6. Build context + sources
    # ---------------------------------------------------------

    context_parts: list[str] = []
    sources: list[SourceChunk] = []

    for chunk in results:
        content = chunk["content"]
        filename = chunk["filename"]
        page_number = chunk["page_number"]
        similarity = float(chunk["similarity"])

        context_parts.append(f"""
    File: {filename}
    Page: {page_number or "Unknown"}

    {content}
    """.strip())

        sources.append(
            SourceChunk(
                chunk_id=str(chunk["id"]),
                document_id=str(chunk["document_id"]),
                filename=filename,
                content=content,
                page_number=page_number,
                score=max(0.0, min(1.0, similarity)),
            )
        )

    context = "\n\n---\n\n".join(context_parts)

    # ---------------------------------------------------------
    # 7. Generate answer
    # ---------------------------------------------------------

    try:
        answer = generate_answer(
            query=query,
            context=context,
        )

    except Exception as e:
        print("LLM error:", repr(e))
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to generate answer: {e}",
        ) from e

    # ---------------------------------------------------------
    # 8. Calculate latency
    # ---------------------------------------------------------

    latency_ms = int((time.perf_counter() - start_time) * 1000)

    # ---------------------------------------------------------
    # 9. Store assistant message + its sources (one transaction)
    # ---------------------------------------------------------

    assistant_message = Message(
        id=uuid.uuid4(),
        chat_id=chat_id,
        role=MessageRole.ASSISTANT,
        content=answer,
        latency_ms=latency_ms,
        llm_provider=settings.gemini_model,
    )

    db.add(assistant_message)
    db.flush()  # makes sure the message row exists before the FK rows

    db.add_all(
        [
            MessageSource(
                id=uuid.uuid4(),
                message_id=assistant_message.id,
                chunk_id=uuid.UUID(source.chunk_id),
                score=source.score,
                rank=rank,
            )
            for rank, source in enumerate(sources)
        ]
    )

    db.commit()
    db.refresh(assistant_message)

    # ---------------------------------------------------------
    # 10. Return message + sources
    # ---------------------------------------------------------

    return ChatQueryResponse(
        message=MessageOut(
            id=assistant_message.id,
            chat_id=assistant_message.chat_id,
            role=assistant_message.role.value,
            content=assistant_message.content,
            latency_ms=assistant_message.latency_ms,
            llm_provider=assistant_message.llm_provider,
            created_at=assistant_message.created_at,
        ),
        sources=sources,
    )


@router.get(
    "/{chat_id}/messages",
    response_model=list[MessageWithSources],
)
def get_chat_messages(
    chat_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    chat = (
        db.query(Chat)
        .filter(
            Chat.id == chat_id,
            Chat.user_id == current_user.id,
        )
        .first()
    )

    if chat is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat not found.",
        )

    messages = (
        db.query(Message)
        .filter(Message.chat_id == chat_id)
        .order_by(Message.created_at.asc())
        .all()
    )

    sources_by_message: dict[uuid.UUID, list[SourceChunk]] = defaultdict(list)

    if messages:
        rows = (
            db.query(MessageSource, Chunk, Document)
            .join(Chunk, Chunk.id == MessageSource.chunk_id)
            .join(Document, Document.id == Chunk.document_id)
            .filter(MessageSource.message_id.in_([m.id for m in messages]))
            .order_by(MessageSource.rank.asc())
            .all()
        )

        for source, chunk, document in rows:
            sources_by_message[source.message_id].append(
                SourceChunk(
                    chunk_id=str(chunk.id),
                    document_id=str(document.id),
                    filename=document.filename,
                    content=chunk.content,
                    page_number=chunk.page_number,
                    score=float(source.score),
                )
            )

    return [
        MessageWithSources(
            id=message.id,
            chat_id=message.chat_id,
            role=message.role.value,
            content=message.content,
            latency_ms=message.latency_ms,
            llm_provider=message.llm_provider,
            created_at=message.created_at,
            sources=sources_by_message.get(message.id, []),
        )
        for message in messages
    ]