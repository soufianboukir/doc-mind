# services/docx_service.py
from io import BytesIO
from docx import Document as DocxDocument  # pip install python-docx


def extract_docx_pages(docx_bytes: bytes) -> list[dict]:
    doc = DocxDocument(BytesIO(docx_bytes))

    text = "\n".join(p.text for p in doc.paragraphs if p.text.strip())

    if not text.strip():
        return []

    # docx has no native "pages" — treat the whole doc as page 1,
    # your chunker will still split it up downstream.
    return [{"page_number": 1, "text": text}]