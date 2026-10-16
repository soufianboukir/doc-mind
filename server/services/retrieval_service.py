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
            c.id,
            c.document_id,
            c.content,
            c.page_number,
            d.filename,
            1 - (c.embedding <=> CAST(:embedding AS vector)) AS similarity
        FROM chunks AS c
        INNER JOIN documents AS d
            ON d.id = c.document_id
        WHERE c.chat_id = :chat_id
        ORDER BY c.embedding <=> CAST(:embedding AS vector)
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
