import requests

from sqlalchemy.orm import Session
from datetime import datetime, timezone
from models.document import Document, DocumentStatus
from models.chunk import Chunk

from services.chunking import clean_text, chunk_text
from services.embedding import generate_embeddings
from services.pdf_service import extract_pdf_pages


def download_document(public_id: str) -> bytes:
    """
    Download a raw document from Cloudinary.
    """

    from cloudinary.utils import cloudinary_url

    url, _ = cloudinary_url(
        public_id,
        resource_type="raw",
        type="upload",
        secure=True,
    )

    response = requests.get(
        url,
        timeout=120,
    )

    response.raise_for_status()

    return response.content


def process_document(
    document_id,
    db: Session,
) -> None:
    """
    Full document ingestion pipeline:

    Cloudinary
        ↓
    PDF extraction
        ↓
    chunking
        ↓
    embeddings
        ↓
    PostgreSQL
    """

    document = db.query(Document).filter(Document.id == document_id).first()

    if document is None:
        return

    try:
        # ---------------------------------------------------------
        # 1. Mark as processing
        # ---------------------------------------------------------

        document.status = DocumentStatus.PROCESSING
        document.error_message = None

        db.commit()

        # ---------------------------------------------------------
        # 2. Download from Cloudinary
        # ---------------------------------------------------------

        pdf_bytes = download_document(document.storage_path)

        # ---------------------------------------------------------
        # 3. Extract PDF pages
        # ---------------------------------------------------------

        pages = extract_pdf_pages(pdf_bytes)

        if not pages:
            raise ValueError("No readable text was found in the PDF.")

        document.page_count = len(pages)

        # ---------------------------------------------------------
        # 4. Create chunks
        # ---------------------------------------------------------

        chunk_records = []

        chunk_index = 0

        for page in pages:

            text = clean_text(page["text"])

            if not text:
                continue

            page_chunks = chunk_text(
                text,
                chunk_size=500,
                overlap=75,
            )

            for content in page_chunks:

                chunk_records.append(
                    {
                        "content": content,
                        "page_number": page["page_number"],
                        "chunk_index": chunk_index,
                        "token_count": len(content.split()),
                    }
                )

                chunk_index += 1

        if not chunk_records:
            raise ValueError("No chunks could be generated from the document.")

        # ---------------------------------------------------------
        # 5. Generate embeddings
        # ---------------------------------------------------------

        texts = [chunk["content"] for chunk in chunk_records]

        embeddings = generate_embeddings(texts)

        if len(embeddings) != len(chunk_records):
            raise ValueError("Embedding count does not match chunk count.")

        # ---------------------------------------------------------
        # 6. Store chunks
        # ---------------------------------------------------------

        for chunk, embedding in zip(chunk_records, embeddings, strict=False):
            db_chunk = Chunk(
                document_id=document.id,
                chat_id=document.chat_id,
                content=chunk["content"],
                embedding=embedding,
                token_count=chunk["token_count"],
                chunk_index=chunk["chunk_index"],
                page_number=chunk["page_number"],
            )

            db.add(db_chunk)

        # ---------------------------------------------------------
        # 7. Mark document as completed
        # ---------------------------------------------------------

        document.status = DocumentStatus.COMPLETED
        document.processed_at = __import__("datetime").datetime.now(
            __import__("datetime").timezone.utc
        )

        document.processed_at = datetime.now(timezone.utc)

        document.error_message = None

        db.commit()

    except Exception as exc:

        db.rollback()

        # Re-fetch because rollback expires SQLAlchemy state
        document = db.query(Document).filter(Document.id == document_id).first()

        if document:
            document.status = DocumentStatus.FAILED
            document.error_message = str(exc)

            db.commit()

        raise
