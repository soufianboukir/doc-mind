from groq import Groq

from config.config import settings

_client: Groq | None = None


def get_client() -> Groq:
    global _client

    if _client is None:
        _client = Groq(
            api_key=settings.groq_api_key,
        )

    return _client


def generate_answer(
    query: str,
    context: str,
) -> str:

    client = get_client()

    response = client.chat.completions.create(
        model=settings.groq_model,
        temperature=0.1,
        max_tokens=1024,
        messages=[
            {
                "role": "system",
                "content": """
                    You are DocMind, a document question-answering assistant.

                    Answer the user's question using ONLY the provided document context.

                    Rules:
                    - Never invent information.
                    - If the answer is not contained in the context, clearly say so.
                    - Answer in the same language as the user's question.
                    - Be concise but sufficiently explanatory.
                    - Do not use outside knowledge.
                    """,
            },
            {
                "role": "user",
                "content": f"""
                    DOCUMENT CONTEXT:

                    {context}

                    QUESTION:

                    {query}
                    """,
            },
        ],
    )

    return response.choices[0].message.content or ""
