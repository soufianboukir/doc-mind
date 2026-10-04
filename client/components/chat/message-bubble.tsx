"use client";

import { useState } from "react";
import { ChevronDown, FileText, RotateCcw } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import type { DisplayMessage } from "@/lib/types";
import { cn } from "@/lib/utils";

interface MessageBubbleProps {
  message: DisplayMessage;
  onRetry?: () => void;
}

export function MessageBubble({ message, onRetry }: MessageBubbleProps) {
  const isUser = message.role === "user";
  const [sourcesOpen, setSourcesOpen] = useState(false);

  return (
    <div
      className={cn(
        "flex w-full gap-3",
        isUser ? "flex-row-reverse" : "flex-row",
      )}
    >
      <Avatar className="mt-0.5 h-8 w-8 shrink-0">
        <AvatarFallback
          className={cn(
            "text-[11px] font-medium tracking-wide",
            isUser
              ? "bg-[#7C93FF] text-[#111113]"
              : "bg-[#26262B] text-[#EDEDEC]",
          )}
        >
          {isUser ? "YOU" : "AI"}
        </AvatarFallback>
      </Avatar>

      <div
        className={cn(
          "flex max-w-[75%] flex-col gap-2",
          isUser ? "items-end" : "items-start",
        )}
      >
        <div
          className={cn(
            "rounded-2xl px-4 py-2.5 text-[14px] leading-relaxed",
            isUser
              ? "bg-[#7C93FF] text-[#0F0F11] rounded-tr-sm"
              : "bg-[#1A1A1D] text-[#EDEDEC] rounded-tl-sm border border-white/[0.06]",
            message.failed && "border border-red-500/40 bg-red-950/20",
          )}
        >
          {message.pending ? (
            <div className="flex items-center gap-1.5 py-0.5">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current opacity-60 [animation-delay:-0.3s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current opacity-60 [animation-delay:-0.15s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current opacity-60" />
            </div>
          ) : (
            <p className="whitespace-pre-wrap break-words">{message.content}</p>
          )}
        </div>

        {message.failed && onRetry && (
          <button
            onClick={onRetry}
            className="flex items-center gap-1 text-[11px] text-red-400/90 transition-colors hover:text-red-300"
          >
            <RotateCcw className="h-3 w-3" />
            Couldn&apos;t send — retry
          </button>
        )}

        {/* Citation strip — the signature element: sources shown like
            highlighted excerpts pulled straight off the source page. */}
        {!isUser && message.sources && message.sources.length > 0 && (
          <div className="w-full">
            <button
              onClick={() => setSourcesOpen((v) => !v)}
              className="flex items-center gap-1.5 rounded-md px-1.5 py-1 text-[11px] font-medium text-[#8C8C93] transition-colors hover:text-[#EDEDEC]"
            >
              <span
                className="inline-block h-2 w-2 rounded-sm"
                style={{ backgroundColor: "rgba(245, 214, 107, 0.9)" }}
              />
              {message.sources.length} source
              {message.sources.length > 1 ? "s" : ""}
              <ChevronDown
                className={cn(
                  "h-3 w-3 transition-transform",
                  sourcesOpen && "rotate-180",
                )}
              />
            </button>

            {sourcesOpen && (
              <div className="mt-1.5 flex flex-col gap-1.5">
                {message.sources.map((source) => (
                  <div
                    key={source.chunk_id}
                    className="rounded-lg border-l-2 px-3 py-2 text-[12.5px] leading-relaxed"
                    style={{
                      borderColor: "rgba(245, 214, 107, 0.55)",
                      backgroundColor: "rgba(245, 214, 107, 0.06)",
                    }}
                  >
                    <div className="mb-1 flex items-center justify-between gap-2 text-[10.5px] font-mono uppercase tracking-wide text-[#8C8C93]">
                      <span className="flex min-w-0 items-center gap-1.5">
                        <FileText className="h-3 w-3 shrink-0" />
                        <span className="truncate">{source.filename}</span>
                        {source.page_number != null && (
                          <span className="shrink-0">
                            · p.{source.page_number}
                          </span>
                        )}
                      </span>
                      <span className="shrink-0">
                        {Math.round(source.score * 100)}%
                      </span>
                    </div>
                    <p className="line-clamp-3 text-[#C7C7CC]">
                      {source.content}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {!message.pending && (
          <div className="flex items-center gap-2 px-1 font-mono text-[10.5px] text-[#5C5C63]">
            <span>
              {new Date(message.created_at).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
            {message.latency_ms != null && (
              <span>· {(message.latency_ms / 1000).toFixed(1)}s</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function MessageBubbleSkeleton({ isUser }: { isUser?: boolean }) {
  return (
    <div className={cn("flex w-full gap-3", isUser && "flex-row-reverse")}>
      <Skeleton className="h-8 w-8 shrink-0 rounded-full bg-[#1F1F23]" />
      <Skeleton
        className={cn(
          "h-10 max-w-[60%] rounded-2xl bg-[#1F1F23]",
          isUser ? "w-40" : "w-64",
        )}
      />
    </div>
  );
}
