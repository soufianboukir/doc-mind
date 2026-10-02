export type MessageRole = "user" | "assistant";

export interface MessageOut {
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
  message: MessageOut;
  sources: SourceChunk[];
}

export interface ChatQueryRequest {
  query: string;
}

export interface DisplayMessage extends MessageOut {
  sources?: SourceChunk[];
  pending?: boolean;
  failed?: boolean;
}
