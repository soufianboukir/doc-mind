import uuid

from sqlalchemy import text
from sqlalchemy.orm import Session


def retrieve_chunks(
    db: Session,
    chat_id: uuid.UUID,
    query_embedding: list[float],
    limit: int = 8,
):
    sql = text("""
        SELECT
            id,
            document_id,
            content,
            page_number,
            1 - (embedding <=> CAST(:embedding AS vector)) AS similarity
        FROM chunks
        WHERE chat_id = :chat_id
        ORDER BY embedding <=> CAST(:embedding AS vector)
        LIMIT :limit
    """)

    embedding_string = "[" + ",".join(str(value) for value in query_embedding) + "]"

    result = db.execute(
        sql,
        {
            "chat_id": str(chat_id),
            "embedding": embedding_string,
            "limit": limit,
        },
    )

    return result.mappings().all()
