export interface Chat {
  id: string;          // UUID
  user_id: string;     // UUID
  title: string;
  created_at: string;  // ISO 8601 timestamp
  updated_at: string;  // ISO 8601 timestamp
}

// For POST /api/v1/chats
export interface ChatCreate {
  title: string;
}

// For PATCH /api/v1/chats/{chat_id}
export interface ChatUpdate {
  title: string;
}