import uuid

from sqlalchemy.orm import Session

from services.embedding import generate_embeddings
from services.retrieval_service import retrieve_chunks
from services.llm_service import generate_answer


def answer_question(
    db: Session,
    chat_id: uuid.UUID,
    question: str,
):
    # ---------------------------------------------------------
    # 1. Generate query embedding
    # ---------------------------------------------------------

    query_embedding = generate_embeddings(
        [question],
        input_type="search_query",
    )[0]

    # ---------------------------------------------------------
    # 2. Retrieve relevant chunks
    # ---------------------------------------------------------

    chunks = retrieve_chunks(
        db=db,
        chat_id=chat_id,
        query_embedding=query_embedding,
        limit=8,
    )

    if not chunks:
        return {
            "answer": (
                "I couldn't find relevant information " "in the uploaded documents."
            ),
            "sources": [],
        }

    # ---------------------------------------------------------
    # 3. Build context
    # ---------------------------------------------------------

    context_parts = []

    for chunk in chunks:
        context_parts.append(f"""
File: {chunk["filename"]}
Page: {chunk["page_number"] or "Unknown"}

{chunk["content"]}
""".strip())

    context = "\n\n---\n\n".join(context_parts)

    # ---------------------------------------------------------
    # 4. Generate answer
    # ---------------------------------------------------------

    answer = generate_answer(
        query=question,
        context=context,
    )

    # ---------------------------------------------------------
    # 5. Build sources
    # ---------------------------------------------------------

    sources = [
        {
            "chunk_id": str(chunk["id"]),
            "document_id": str(chunk["document_id"]),
            "filename": chunk["filename"],
            "content": chunk["content"],
            "page_number": chunk["page_number"],
            "similarity": float(chunk["similarity"]),
        }
        for chunk in chunks
    ]

    return {
        "answer": answer,
        "sources": sources,
    }
