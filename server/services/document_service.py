import uuid

from db.db import SessionLocal
from services.document_processor import process_document


def process_document_background(document_id: uuid.UUID):
    db = SessionLocal()

    try:
        process_document(
            document_id,
            db,
        )
    finally:
        db.close()