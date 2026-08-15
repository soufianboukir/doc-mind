import os

import cohere
from config.config import settings

# Cohere's embed-english-light-v3.0 is 384-dim and has a generous free tier.
# If you'd rather use the full-size model, swap to "embed-english-v3.0"
# (1024-dim) — just remember to match your DB's vector column size.
MODEL_NAME = "embed-english-v3.0"
EMBEDDING_DIM = 1024

# Cohere caps batch size per request — chunk larger inputs to stay under it.
MAX_BATCH_SIZE = 96

_client: cohere.Client | None = None


def get_embedding_client() -> cohere.Client:
    """
    Lazily create and reuse a single Cohere client.
    """

    global _client

    if _client is None:
        api_key = settings.cohere_api_key

        if not api_key:
            raise RuntimeError(
                "COHERE_API_KEY is not set. Add it to your environment "
            )

        _client = cohere.Client(api_key)

    return _client


def generate_embeddings(
    texts: list[str],
    input_type: str = "search_document",
) -> list[list[float]]:
    """
    Generate embeddings for a list of texts via the Cohere API.

    input_type should be "search_document" when embedding chunks for
    storage, and "search_query" when embedding a user's question at
    query time — Cohere v3 models use this to optimize the vectors
    for each side of the search.
    """

    if not texts:
        return []

    client = get_embedding_client()

    all_embeddings: list[list[float]] = []

    for i in range(0, len(texts), MAX_BATCH_SIZE):
        batch = texts[i : i + MAX_BATCH_SIZE]

        response = client.embed(
            texts=batch,
            model=MODEL_NAME,
            input_type=input_type,
            embedding_types=["float"],
        )

        all_embeddings.extend(response.embeddings.float)

    return all_embeddings