"use client";

import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  ExternalLink,
  FilesIcon,
  Loader2,
  MoreHorizontal,
  Trash2,
} from "lucide-react";

import { Document } from "@/types/chat";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DocumentListItemProps {
  document: Document;
  chatId: string;
  onDelete?: (documentId: string) => void;
}

function formatFileSize(bytes: number | null) {
  if (!bytes) {
    return "Unknown size";
  }

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getStatus(status: Document["status"]) {
  switch (status) {
    case "completed":
      return {
        label: "Ready",
        icon: CheckCircle2,
        className: "text-emerald-600",
      };

    case "processing":
      return {
        label: "Processing",
        icon: Loader2,
        className: "text-blue-600",
      };

    case "pending":
      return {
        label: "Pending",
        icon: Clock3,
        className: "text-amber-600",
      };

    case "failed":
      return {
        label: "Failed",
        icon: AlertCircle,
        className: "text-red-600",
      };
  }
}

export function DocumentListItem({
  document,
  chatId,
  onDelete,
}: DocumentListItemProps) {
  const status = getStatus(document.status);
  const StatusIcon = status.icon;

  async function handleOpenDocument() {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/chats/${chatId}/documents/${document.id}/url`,
        {
          method: "GET",
          credentials: "include",
        },
      );

      if (!response.ok) {
        throw new Error("Failed to get document URL");
      }

      const data: { url: string } = await response.json();

      window.open(data.url, "_blank", "noopener,noreferrer");
    } catch (error) {
      console.error("Failed to open document:", error);
    }
  }

  return (
    <div className="flex items-center gap-4 rounded-xl border bg-card p-4 transition-colors hover:bg-muted/40">
      {/* File icon */}
      <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-muted">
        <FilesIcon className="size-5 text-muted-foreground" />
      </div>

      {/* Document information */}
      <div className="min-w-0 flex-1">
        <button
          type="button"
          onClick={handleOpenDocument}
          disabled={document.status !== "completed"}
          className="group flex max-w-full items-center gap-1.5 text-left"
        >
          <span
            className={`truncate font-medium transition-colors ${
              document.status === "completed"
                ? "group-hover:text-primary cursor-pointer group-hover:underline"
                : "cursor-not-allowed text-muted-foreground"
            }`}
          >
            {document.filename}
          </span>

          {document.status === "completed" && (
            <ExternalLink className="size-3.5 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
          )}
        </button>

        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
          <span>{formatFileSize(document.file_size_bytes)}</span>

          {document.page_count && (
            <span>
              {document.page_count}{" "}
              {document.page_count === 1 ? "page" : "pages"}
            </span>
          )}

          {document.language && (
            <span className="uppercase">{document.language}</span>
          )}
        </div>
      </div>

      {/* Status */}
      <div
        className={`hidden items-center gap-1.5 text-sm sm:flex ${status.className}`}
      >
        <StatusIcon
          className={`size-4 ${
            document.status === "processing" ? "animate-spin" : ""
          }`}
        />

        <span>{status.label}</span>
      </div>

      {/* Actions */}
      <DropdownMenu>
        <DropdownMenuTrigger>
          <Button variant="ghost" size="icon" className="shrink-0">
            <MoreHorizontal className="size-4" />
            <span className="sr-only">Document actions</span>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end">
          {document.status === "completed" && (
            <DropdownMenuItem onClick={handleOpenDocument}>
              <ExternalLink className="size-4" />
              Open document
            </DropdownMenuItem>
          )}

          <DropdownMenuItem
            variant="destructive"
            onClick={() => onDelete?.(document.id)}
          >
            <Trash2 className="size-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
