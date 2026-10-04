import logging

from google import genai
from google.genai import types
from google.genai.errors import APIError

from config.config import settings

logger = logging.getLogger(__name__)

_client: genai.Client | None = None

SYSTEM_PROMPT = """You are DocMind, a document question-answering assistant.

Answer the user's question using ONLY the provided document context.

Rules:
- Never invent information.
- If the answer is not contained in the context, clearly say so.
- Answer in the same language as the user's question.
- Be concise but sufficiently explanatory.
- Do not use outside knowledge."""


def get_client() -> genai.Client:
    global _client

    if _client is None:
        _client = genai.Client(api_key=settings.gemini_api_key)

    return _client


def generate_answer(query: str, context: str) -> str:
    client = get_client()

    prompt = f"DOCUMENT CONTEXT:\n\n{context}\n\nQUESTION:\n\n{query}"

    try:
        response = client.models.generate_content(
            model=settings.gemini_model,
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_PROMPT,
                temperature=0.1,
                max_output_tokens=2048,
                # Flash models can spend output tokens on internal
                # "thinking", which cuts answers short. Turn it off
                # for simple RAG answering.
                thinking_config=types.ThinkingConfig(thinking_budget=0),
            ),
        )
    except APIError as error:
        if error.code == 429:
            logger.warning("Gemini free-tier rate limit hit")
        raise

    return response.text or ""
