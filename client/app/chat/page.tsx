"use client";

import { FileText, MessageSquarePlus, Sparkles } from "lucide-react";

export default function ChatPage() {
  return (
    <div className="flex min-h-[calc(100vh-7rem)] items-center justify-center">
      <div className="mx-auto flex max-w-lg flex-col items-center text-center">
        <div className="mb-6 flex size-16 items-center justify-center rounded-2xl border bg-muted/50 shadow-sm">
          <MessageSquarePlus className="size-7 text-muted-foreground" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            Start a new conversation
          </h1>

          <p className="text-sm leading-6 text-muted-foreground">
            Select a chat from the sidebar or create a new one to start asking
            questions about your documents.
          </p>
        </div>

        <div className="mt-8 flex items-center gap-2 text-xs text-muted-foreground">
          <Sparkles className="size-3.5" />
          <span>Upload documents and let DocMind find the answers.</span>
        </div>

        <div className="mt-10 grid w-full grid-cols-2 gap-3">
          <div className="rounded-xl border bg-card p-4 text-left">
            <FileText className="mb-3 size-5 text-muted-foreground" />

            <p className="text-sm font-medium">Your documents</p>

            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Upload PDFs and other documents to your chat.
            </p>
          </div>

          <div className="rounded-xl border bg-card p-4 text-left">
            <Sparkles className="mb-3 size-5 text-muted-foreground" />

            <p className="text-sm font-medium">Ask questions</p>

            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Get answers based on the documents you provide.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
