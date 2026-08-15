from io import BytesIO

from pypdf import PdfReader


def extract_pdf_pages(pdf_bytes: bytes) -> list[dict]:
    """
    Extract text from every page of a PDF.

    Returns:
        [
            {
                "page_number": 1,
                "text": "..."
            },
            ...
        ]
    """

    reader = PdfReader(BytesIO(pdf_bytes))

    pages = []

    for page_number, page in enumerate(reader.pages, start=1):
        text = page.extract_text() or ""

        text = text.strip()

        if not text:
            continue

        pages.append(
            {
                "page_number": page_number,
                "text": text,
            }
        )

    return pages
