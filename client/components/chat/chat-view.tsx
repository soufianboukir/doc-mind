"use client";

import { useEffect, useRef, useState } from "react";
import { AlertCircle } from "lucide-react";
import { getChatMessages, queryChat, ApiError } from "@/lib/api_messages";
import type { DisplayMessage } from "@/lib/types";
import { MessageBubble, MessageBubbleSkeleton } from "./message-bubble";
import { ChatComposer } from "./chat-composer";
import { EmptyState } from "./empty-state";

interface ChatViewProps {
  chatId: string;
}

const PENDING_ID_PREFIX = "pending-";

export function ChatView({ chatId }: ChatViewProps) {
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

  const scrollAnchorRef = useRef<HTMLDivElement>(null);
  const lastQueryRef = useRef<string>("");

  useEffect(() => {
    let cancelled = false;

    async function loadHistory() {
      setLoadingHistory(true);
      setLoadError(null);

      try {
        const history = await getChatMessages(chatId);
        if (!cancelled) {
          setMessages(history);
        }
      } catch (err) {
        if (!cancelled) {
          setLoadError(
            err instanceof ApiError
              ? err.message
              : "Couldn't load this conversation.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingHistory(false);
        }
      }
    }

    loadHistory();

    return () => {
      cancelled = true;
    };
  }, [chatId]);

  useEffect(() => {
    scrollAnchorRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  async function handleSend(overrideQuery?: string) {
    const query = (overrideQuery ?? draft).trim();
    if (!query || sending) return;

    lastQueryRef.current = query;
    setSending(true);
    setDraft("");

    const optimisticId = `${PENDING_ID_PREFIX}${Date.now()}`;
    const now = new Date().toISOString();

    setMessages((prev) => [
      ...prev,
      {
        id: optimisticId,
        chat_id: chatId,
        role: "user",
        content: query,
        latency_ms: null,
        llm_provider: null,
        created_at: now,
      },
      {
        id: `${optimisticId}-assistant`,
        chat_id: chatId,
        role: "assistant",
        content: "",
        latency_ms: null,
        llm_provider: null,
        created_at: now,
        pending: true,
      },
    ]);

    try {
      const response = await queryChat(chatId, query);

      setMessages((prev) => {
        // Drop the two optimistic placeholders, append the real pair.
        const withoutOptimistic = prev.filter(
          (m) => !m.id.startsWith(optimisticId),
        );

        const confirmedUserMessage: DisplayMessage = {
          id: `${optimisticId}-confirmed`,
          chat_id: chatId,
          role: "user",
          content: query,
          latency_ms: null,
          llm_provider: null,
          created_at: now,
        };

        return [
          ...withoutOptimistic,
          confirmedUserMessage,
          { ...response.message, sources: response.sources },
        ];
      });
    } catch (err) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === `${optimisticId}-assistant`
            ? {
                ...m,
                pending: false,
                failed: true,
                content:
                  err instanceof ApiError
                    ? err.message
                    : "Something went wrong generating a response.",
              }
            : m,
        ),
      );
    } finally {
      setSending(false);
    }
  }

  function handleRetry() {
    setMessages((prev) =>
      prev.filter(
        (m) => !(m.role === "user" && m.content === lastQueryRef.current) ||
          !m.id.includes(PENDING_ID_PREFIX),
      ),
    );
    handleSend(lastQueryRef.current);
  }

  return (
    <div className="flex h-dvh flex-col bg-[#111113]">
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto flex max-w-3xl flex-col gap-5 px-4 py-6 sm:px-6">
          {loadingHistory && (
            <>
              <MessageBubbleSkeleton isUser />
              <MessageBubbleSkeleton />
            </>
          )}

          {!loadingHistory && loadError && (
            <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-950/20 px-4 py-3 text-[13px] text-red-300">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {loadError}
            </div>
          )}

          {!loadingHistory && !loadError && messages.length === 0 && (
            <div className="flex h-[60vh] items-center justify-center">
              <EmptyState />
            </div>
          )}

          {!loadingHistory &&
            !loadError &&
            messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                onRetry={message.failed ? handleRetry : undefined}
              />
            ))}

          <div ref={scrollAnchorRef} />
        </div>
      </div>

      <ChatComposer
        value={draft}
        onChange={setDraft}
        onSubmit={() => handleSend()}
        disabled={sending || loadingHistory}
      />
    </div>
  );
}
