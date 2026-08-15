import re


def clean_text(text: str) -> str:
    """
    Normalize extracted PDF text.
    """

    text = text.replace("\x00", " ")

    # Normalize whitespace
    text = re.sub(r"\s+", " ", text)

    return text.strip()


def chunk_text(
    text: str,
    chunk_size: int = 500,
    overlap: int = 75,
) -> list[str]:
    """
    Split text into overlapping chunks.

    chunk_size and overlap are approximated using words.
    """

    if not text.strip():
        return []

    words = text.split()

    if len(words) <= chunk_size:
        return [" ".join(words)]

    chunks = []

    start = 0

    while start < len(words):
        end = start + chunk_size

        chunk = " ".join(words[start:end])

        if chunk.strip():
            chunks.append(chunk.strip())

        if end >= len(words):
            break

        start = end - overlap

    return chunks