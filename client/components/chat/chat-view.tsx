"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { Loader2, Send, Check, Copy } from "lucide-react";

import { getChatMessages, sendChatMessage } from "@/lib/api/chats";

import type { Message, SourceChunk } from "@/types/chat";
import Image from "next/image";
import { useAuth } from "@/context/auth-context";
import { MarkdownContent } from "@/app/chat/mardown-content";

interface AssistantResponse {
  message: Message;
  sources: SourceChunk[];
}

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }

    // Fallback for non-secure contexts (http on a non-localhost host)
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";

    document.body.appendChild(textarea);
    textarea.select();

    const success = document.execCommand("copy");
    document.body.removeChild(textarea);

    return success;
  } catch (error) {
    console.error("Copy failed:", error);
    return false;
  }
}

export default function ChatPage() {
  const { id } = useParams<{ id: string }>();

  const [messages, setMessages] = useState<Message[]>([]);

  const [input, setInput] = useState("");
  const { user } = useAuth();
  const [loadingMessages, setLoadingMessages] = useState(true);

  const [sending, setSending] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const hasScrolledInitially = useRef(false);

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [chatTitle, setChatTitle] = useState("");

  async function handleCopy(messageId: string, text: string) {
    const success = await copyToClipboard(text);

    if (!success) return;

    setCopiedId(messageId);

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setCopiedId(null), 2000);
  }

  // Reset when switching to another chat
  useEffect(() => {
    hasScrolledInitially.current = false;
  }, [id]);

  useEffect(() => {
    if (loadingMessages) return;

    // Wait one frame so the new message (Markdown, formulas) is laid out
    const frame = requestAnimationFrame(() => {
      bottomRef.current?.scrollIntoView({
        // Jump instantly on first load, animate for new messages
        behavior: hasScrolledInitially.current ? "smooth" : "auto",
        block: "end",
      });

      hasScrolledInitially.current = true;
    });

    return () => cancelAnimationFrame(frame);
  }, [messages, sending, error, loadingMessages]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoadingMessages(true);
        setError(null);

        const data = await getChatMessages(id);

        if (!cancelled) {
          setMessages(data);
          console.log(data);
          
          setChatTitle(data.length > 0 ? data[0].title! : "Chat");
        }
      } catch (error) {
        if (!cancelled) {
          console.error(error);

          setError(
            error instanceof Error ? error.message : "Failed to load messages.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingMessages(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [id]);

  async function handleSendMessage() {
    const query = input.trim();

    if (!query || sending) {
      return;
    }

    setError(null);
    setSending(true);

    // --------------------------------------------------
    // Optimistic user message
    // --------------------------------------------------

    const optimisticMessage: Message = {
      id: `optimistic-${Date.now()}`,
      chat_id: id,
      role: "user",
      content: query,
      title: chatTitle || null,
      latency_ms: null,
      llm_provider: null,
      created_at: new Date().toISOString(),
    };

    setMessages((previous) => [...previous, optimisticMessage]);

    setInput("");

    try {
      const response: AssistantResponse = await sendChatMessage(id, query);

      setMessages((previous) => [
        ...previous,
        { ...response.message, sources: response.sources },
      ]);
    } catch (error) {
      console.error(error);

      // Remove optimistic message if request failed.
      setMessages((previous) =>
        previous.filter((message) => message.id !== optimisticMessage.id),
      );

      setInput(query);

      setError(
        error instanceof Error ? error.message : "Failed to send message.",
      );
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();

      handleSendMessage();
    }
  }

  useEffect(() => {
    document.title = `DocMind - ${chatTitle}`;
  }, [chatTitle]);

  if (loadingMessages) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto pb-20">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={
                message.role === "user"
                  ? "ml-auto max-w-[80%]"
                  : "mr-auto w-full"
              }
            >
              <div className="flex gap-2">
                <div
                  className={
                    message.role === "user"
                      ? "rounded-2xl bg-primary px-4 py-3 text-primary-foreground"
                      : "rounded-2xl py-4 w-[85%]"
                  }
                >
                  {message.role === "user" ? (
                    <p className="whitespace-pre-wrap text-sm">
                      {message.content}
                    </p>
                  ) : (
                    <>
                      <MarkdownContent content={message.content} />
                      <div className="flex gap-2">
                        {message.llm_provider && (
                          <span className="rounded-full border border-emerald-700/40 bg-emerald-500/15 px-2 py-0.5 text-emerald-900 dark:text-emerald-200 text-sm">

                            {message.llm_provider}
                          </span>
                        )}
                        {message.latency_ms && (
                          <span className="rounded-full border border-blue-700/40 bg-blue-500/15 px-2 py-0.5 text-blue-900 dark:text-blue-200 text-sm">
                            {message.latency_ms} ms
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() =>
                            handleCopy(message.id, message.content)
                          }
                          aria-label={
                            copiedId === message.id ? "Copied" : "Copy message"
                          }
                          title={copiedId === message.id ? "Copied" : "Copy"}
                          className="inline-flex cursor-pointer items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        >
                          {copiedId === message.id ? (
                            <>
                              <Check className="size-3.5" />
                              Copied
                            </>
                          ) : (
                            <>
                              <Copy className="size-3.5" />
                              Copy
                            </>
                          )}
                        </button>
                      </div>
                    </>
                  )}
                </div>

                {message.role === "user" && (
                  <Image
                    width={50}
                    height={50}
                    src={user?.avatar_url || "/default_user.jpeg"}
                    alt="User image"
                    className="size-8 shrink-0 rounded-2xl"
                  />
                )}
              </div>

              {/* Sources */}

              {message.role === "assistant" &&
                message.sources &&
                message.sources.length > 0 && (
                  <div className="mt-3">
                    <summary className="cursor-pointer select-none text-xs font-medium text-muted-foreground hover:text-foreground">
                      Sources ({message.sources.length})
                    </summary>

                    <div className="mt-2 space-y-2">
                      {message.sources.map((source) => (
                        <div
                          key={source.chunk_id}
                          className="rounded-lg border bg-muted/30 p-3"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <span className="truncate text-xs font-medium">
                              {source.filename}
                            </span>

                            <div className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
                              {source.page_number && (
                                <span>Page {source.page_number}</span>
                              )}
                              <span>Score {source.score.toFixed(2)}</span>
                            </div>
                          </div>

                          <p className="mt-2 line-clamp-3 text-xs text-muted-foreground">
                            {source.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          ))}

          {messages.length === 0 && !loadingMessages && (
            <div className="mx-auto">
              <p className="text-2xl font-semibold">
                Hello {user?.display_name}, Start a conversation
              </p>
            </div>
          )}

          {/* Generation indicator */}

          {sending && (
            <div className="mr-auto flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Thinking...
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Composer */}

      <div className="border-t bg-background bottom-0 w-full fixed">
        <div className="mx-auto w-full max-w-3xl px-4 py-4">
          <div className="flex items-end gap-2 rounded-2xl border bg-muted/30 p-2">
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleKeyDown}
              disabled={sending}
              placeholder="Ask something about your documents..."
              rows={1}
              className="max-h-40 min-h-10 flex-1 resize-none bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground"
            />

            <button
              type="button"
              disabled={!input.trim() || sending}
              onClick={handleSendMessage}
              className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
            >
              {sending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Send className="size-4" />
              )}
            </button>
          </div>

          <p className="mt-2 text-center text-xs text-muted-foreground">
            Ask questions about the documents uploaded to this chat.
          </p>
        </div>
      </div>
    </div>
  );
}
