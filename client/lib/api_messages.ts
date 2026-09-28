import type { ChatQueryResponse, MessageOut } from "./types";

// Backend runs on a different origin locally, so every request needs
// credentials: "include" to send the httpOnly access_token cookie set
// by /api/v1/auth/login. Point this at your deployed API in prod via env.
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (!res.ok) {
    let detail = res.statusText;

    try {
      const body = await res.json();
      detail = body.detail ?? detail;
    } catch {
      // response wasn't JSON — fall back to statusText
    }

    throw new ApiError(detail, res.status);
  }

  // 204 No Content etc.
  if (res.status === 204) {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}

export function getChatMessages(chatId: string): Promise<MessageOut[]> {
  return request<MessageOut[]>(`/api/v1/chats/${chatId}/messages`);
}

export function queryChat(
  chatId: string,
  query: string,
): Promise<ChatQueryResponse> {
  return request<ChatQueryResponse>(`/api/v1/chats/${chatId}/query`, {
    method: "POST",
    body: JSON.stringify({ query }),
  });
}
