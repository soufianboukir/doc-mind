# services/md_service.py
def extract_md_pages(md_bytes: bytes) -> list[dict]:
    text = md_bytes.decode("utf-8", errors="ignore").strip()

    if not text:
        return []

    return [{"page_number": 1, "text": text}]