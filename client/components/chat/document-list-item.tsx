"use client";

import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  File,
  FileArchive,
  FileCode2,
  FileImage,
  FilesIcon,
  FileText,
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
  onDelete?: (documentId: string) => void;
}

function getFileIcon(mimeType: string | null) {
  if (!mimeType) {
    return File;
  }

  if (mimeType === "application/pdf") {
    return FileText;
  }

  if (mimeType.startsWith("image/")) {
    return FileImage;
  }

  if (mimeType.includes("zip") || mimeType.includes("compressed")) {
    return FileArchive;
  }

  if (
    mimeType.includes("javascript") ||
    mimeType.includes("json") ||
    mimeType.includes("python")
  ) {
    return FileCode2;
  }

  return File;
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
  onDelete,
}: DocumentListItemProps) {
  const FileIcon = getFileIcon(document.mime_type);
  const status = getStatus(document.status);
  const StatusIcon = status.icon;

  return (
    <div className="flex items-center gap-4 rounded-xl border bg-card p-4 transition-colors hover:bg-muted/40">
      <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-muted">
        <FilesIcon className="size-5 text-muted-foreground" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{document.filename}</p>

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

      <DropdownMenu>
        <DropdownMenuTrigger>
          <Button variant="ghost" size="icon" className="shrink-0">
            <MoreHorizontal className="size-4" />
            <span className="sr-only">Document actions</span>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end">
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
