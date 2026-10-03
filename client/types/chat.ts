export interface Chat {
  id: string; // UUID
  user_id: string; // UUID
  title: string;
  created_at: string; // ISO 8601 timestamp
  updated_at: string; // ISO 8601 timestamp
}

// For POST /api/v1/chats
export interface ChatCreate {
  title: string;
}

// For PATCH /api/v1/chats/{chat_id}
export interface ChatUpdate {
  title: string;
}

export type DocumentStatus = "pending" | "processing" | "completed" | "failed";

export interface Document {
  id: string;
  chat_id: string;
  user_id: string;

  filename: string;
  storage_path: string;

  mime_type: string | null;
  file_size_bytes: number | null;

  language: string | null;
  page_count: number | null;

  status: DocumentStatus;
  error_message: string | null;

  uploaded_at: string;
  processed_at: string | null;
}

export interface ChatDocuments {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  documents: Document[];
}

export type MessageRole = "user" | "assistant";

export interface Message {
  id: string;
  chat_id: string;
  role: MessageRole;
  content: string;
  latency_ms: number | null;
  llm_provider: string | null;
  created_at: string;
}

export interface SourceChunk {
  chunk_id: string;
  document_id: string;
  filename: string;
  content: string;
  page_number: number | null;
  score: number;
}

export interface ChatQueryResponse {
  message: Message;
  sources: SourceChunk[];
}
