import { ChatDocuments } from "@/types/chat";

import type { ChatQueryResponse, Message } from "@/types/chat";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function getChatDocuments(chatId: string): Promise<ChatDocuments> {
  const response = await fetch(`${API_URL}/api/v1/chats/${chatId}/documents`, {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("Chat not found");
    }

    if (response.status === 401) {
      throw new Error("Unauthorized");
    }

    throw new Error("Failed to fetch chat documents");
  }

  return response.json();
}

export async function getChatMessages(chatId: string): Promise<Message[]> {
  const response = await fetch(`${API_URL}/api/v1/chats/${chatId}/messages`, {
    method: "GET",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Failed to load chat messages");
  }

  return response.json();
}

export async function sendChatMessage(
  chatId: string,
  query: string,
): Promise<ChatQueryResponse> {
  const response = await fetch(`${API_URL}/api/v1/chats/${chatId}/query`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query,
    }),
  });

  if (!response.ok) {
    let message = "Failed to send message";

    try {
      const data = await response.json();
      message = data.detail ?? message;
    } catch {
      // Ignore invalid error response.
    }

    throw new Error(message);
  }

  return response.json();
}
