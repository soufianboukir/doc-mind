"use client";

import { FileStack } from "lucide-react";

import { Document } from "@/types/chat";

import { DocumentListItem } from "./document-list-item";

interface DocumentListProps {
  documents: Document[];
  onDelete?: (documentId: string) => void;
}

export function DocumentList({ documents, onDelete }: DocumentListProps) {
  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
        <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-muted">
          <FileStack className="size-5 text-muted-foreground" />
        </div>

        <h3 className="font-semibold">No documents yet</h3>

        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Upload documents to start building the knowledge base for this chat.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {documents.map((document) => (
        <DocumentListItem
          chatId={document.chat_id}
          key={document.id}
          document={document}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
