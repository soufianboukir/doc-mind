-- =====================================================================
-- DocMind — Database Schema
-- PostgreSQL 16 + pgvector
--
-- This file is idempotent (safe to re-run): every object uses
-- IF NOT EXISTS / CREATE OR REPLACE where possible. Run it once
-- against a fresh database, e.g. via a container's /docker-entrypoint-
-- initdb.d/ mount (see docker-compose.yml in this same delivery).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0. Extensions
-- ---------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pgcrypto;   -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS vector;     -- pgvector: embedding column type + ANN indexes
CREATE EXTENSION IF NOT EXISTS citext;     -- case-insensitive email column

-- ---------------------------------------------------------------------
-- 1. Utility: shared updated_at trigger function
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------------
-- 2. users
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username        CITEXT NOT NULL UNIQUE,
    email           CITEXT NOT NULL UNIQUE,
    password_hash   TEXT NOT NULL,
    display_name    TEXT,
    avatar_url      TEXT,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_users_email ON users (email);

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------
-- 3. chats
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS chats (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title           TEXT NOT NULL DEFAULT 'New chat',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_chats_user_id ON chats (user_id);
CREATE INDEX IF NOT EXISTS ix_chats_user_updated ON chats (user_id, updated_at DESC);

DROP TRIGGER IF EXISTS trg_chats_updated_at ON chats;
CREATE TRIGGER trg_chats_updated_at
    BEFORE UPDATE ON chats
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------
-- 4. documents
-- ---------------------------------------------------------------------
-- CREATE TYPE has no native IF NOT EXISTS, so guard it manually to
-- keep the whole script safe to re-run against an already-initialized DB.
DO $$ BEGIN
    CREATE TYPE document_status AS ENUM ('pending', 'processing', 'completed', 'failed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS documents (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_id         UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    filename        TEXT NOT NULL,
    storage_path    TEXT NOT NULL,          -- path/key on disk volume or S3-compatible bucket
    mime_type       TEXT,
    file_size_bytes BIGINT,
    language        TEXT,                    -- detected ISO 639-1 code, e.g. 'ar', 'fr', 'en'
    page_count      INTEGER,
    status          document_status NOT NULL DEFAULT 'pending',
    error_message   TEXT,                    -- populated when status = 'failed'
    uploaded_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    processed_at    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS ix_documents_chat_id ON documents (chat_id);
CREATE INDEX IF NOT EXISTS ix_documents_user_id ON documents (user_id);
CREATE INDEX IF NOT EXISTS ix_documents_status ON documents (status);

-- ---------------------------------------------------------------------
-- 5. chunks
-- chat_id is intentionally denormalized here (also derivable via
-- document_id -> documents.chat_id) so that every retrieval query can
-- filter on a single indexed column instead of joining through
-- documents on the hot path.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS chunks (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id     UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    chat_id         UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
    content         TEXT NOT NULL,
    embedding       VECTOR(1024) NOT NULL,   -- bge-m3 embedding dimension
    token_count     INTEGER,
    chunk_index     INTEGER NOT NULL,        -- ordinal position within the document
    page_number     INTEGER,
    content_tsv     TSVECTOR GENERATED ALWAYS AS (to_tsvector('simple', content)) STORED,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_chunks_document_id ON chunks (document_id);
CREATE INDEX IF NOT EXISTS ix_chunks_chat_id ON chunks (chat_id);

-- Lexical half of hybrid search (BM25-style ranking via ts_rank on this GIN index)
CREATE INDEX IF NOT EXISTS ix_chunks_content_tsv ON chunks USING GIN (content_tsv);

-- Dense half of hybrid search. HNSW gives better recall/latency than
-- IVFFlat and doesn't need a training pass over existing data, which
-- matters for a table that grows continuously as users upload docs.
-- cosine distance matches how bge-m3 embeddings are typically compared.
CREATE INDEX IF NOT EXISTS ix_chunks_embedding_hnsw
    ON chunks USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);

-- ---------------------------------------------------------------------
-- 6. messages
-- ---------------------------------------------------------------------
DO $$ BEGIN
    CREATE TYPE message_role AS ENUM ('user', 'assistant');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS messages (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_id         UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
    role            message_role NOT NULL,
    content         TEXT NOT NULL,
    latency_ms      INTEGER,                 -- end-to-end response time, assistant messages only
    llm_provider    TEXT,                    -- e.g. 'gemini-flash', 'groq-llama' — which one actually answered
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_messages_chat_id ON messages (chat_id);
CREATE INDEX IF NOT EXISTS ix_messages_chat_created ON messages (chat_id, created_at);

-- ---------------------------------------------------------------------
-- 7. citations
-- Per-claim verification results: links one assistant message to the
-- specific chunk(s) used to check each atomic claim in that answer.
-- ---------------------------------------------------------------------
DO $$ BEGIN
    CREATE TYPE citation_verdict AS ENUM ('supported', 'weak', 'unverified', 'contradicted');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS citations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id      UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    chunk_id        UUID NOT NULL REFERENCES chunks(id) ON DELETE CASCADE,
    claim_text      TEXT NOT NULL,           -- the decomposed atomic claim being checked
    claim_index     INTEGER NOT NULL,        -- ordinal position of this claim within the answer
    verdict         citation_verdict NOT NULL,
    confidence      NUMERIC(4,3) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_citations_message_id ON citations (message_id);
CREATE INDEX IF NOT EXISTS ix_citations_chunk_id ON citations (chunk_id);

-- ---------------------------------------------------------------------
-- 8. conflicts
-- Logged cross-document contradictions surfaced in a given answer.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS conflicts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id      UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    chunk_id_a      UUID NOT NULL REFERENCES chunks(id) ON DELETE CASCADE,
    chunk_id_b      UUID NOT NULL REFERENCES chunks(id) ON DELETE CASCADE,
    description     TEXT NOT NULL,           -- human-readable summary of what disagrees
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_conflict_distinct_chunks CHECK (chunk_id_a <> chunk_id_b)
);

CREATE INDEX IF NOT EXISTS ix_conflicts_message_id ON conflicts (message_id);

-- =====================================================================
-- End of schema
-- =====================================================================