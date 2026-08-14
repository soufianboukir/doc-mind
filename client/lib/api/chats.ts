import { ChatDocuments } from "@/types/chat";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function getChatDocuments(
  chatId: string
): Promise<ChatDocuments> {
  const response = await fetch(
    `${API_URL}/api/v1/chats/${chatId}/documents`,
    {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    }
  );

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