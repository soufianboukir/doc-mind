"use client";

import { useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  File,
  FileText,
  Loader2,
  Upload,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  progress: number;
  failed?: boolean;
  fileObject?: File;
}

interface DocumentUploadProps {
  chatId: string;
  onUploaded?: () => void;
}

function getFileIcon(type: string) {
  if (type === "application/pdf") {
    return FileText;
  }

  return File;
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DocumentUpload({ chatId, onUploaded }: DocumentUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  async function uploadFiles(selectedFiles: File[]) {
    if (selectedFiles.length === 0) {
      return;
    }

    const newFiles: UploadedFile[] = selectedFiles.map((file) => ({
      id: crypto.randomUUID(),
      name: file.name,
      size: file.size,
      type: file.type,
      progress: 0,
      fileObject: file,
    }));

    setFiles((previous) => [...newFiles, ...previous]);

    const formData = new FormData();

    selectedFiles.forEach((file) => {
      formData.append("files", file);
    });

    try {
      // Show uploading state
      setFiles((previous) =>
        previous.map((file) =>
          newFiles.some((newFile) => newFile.id === file.id)
            ? {
                ...file,
                progress: 30,
              }
            : file,
        ),
      );

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/chats/${chatId}/documents`,
        {
          method: "POST",
          credentials: "include",
          body: formData,
        },
      );

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      setFiles((previous) =>
        previous.map((file) =>
          newFiles.some((newFile) => newFile.id === file.id)
            ? {
                ...file,
                progress: 100,
              }
            : file,
        ),
      );

      onUploaded?.();
    } catch (error) {
      console.error(error);

      setFiles((previous) =>
        previous.map((file) =>
          newFiles.some((newFile) => newFile.id === file.id)
            ? {
                ...file,
                failed: true,
                progress: 0,
              }
            : file,
        ),
      );
    }
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const selectedFiles = Array.from(event.target.files ?? []);

    uploadFiles(selectedFiles);

    event.target.value = "";
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);

    if (event.dataTransfer.files.length === 0) {
      return;
    }

    uploadFiles(Array.from(event.dataTransfer.files));
  }

  function removeFile(id: string) {
    setFiles((previous) => previous.filter((file) => file.id !== id));
  }

  return (
    <div className="w-full space-y-4">
      {/* Upload area */}

      <div
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`
          flex w-full flex-col items-center justify-center
          rounded-xl border border-dashed
          px-6 py-10 text-center
          transition-colors
          ${
            isDragging
              ? "border-primary bg-primary/5"
              : "border-border bg-muted/20 hover:bg-muted/40"
          }
        `}
      >
        <div className="mb-4 flex size-11 items-center justify-center rounded-full bg-muted">
          <Upload className="size-5 text-muted-foreground" />
        </div>

        <div className="space-y-1">
          <h3 className="text-sm font-medium">Upload documents</h3>

          <p className="text-xs text-muted-foreground">
            Drag and drop your files here or select them from your computer.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-5"
          onClick={() => inputRef.current?.click()}
        >
          <Upload className="size-4" />
          Choose files
        </Button>

        <p className="mt-3 text-xs text-muted-foreground">
          PDF, DOC, DOCX, TXT or Markdown
        </p>

        <input
          ref={inputRef}
          type="file"
          multiple
          hidden
          accept=".pdf,.doc,.docx,.txt,.md"
          onChange={handleFileChange}
        />
      </div>

      {/* Uploaded files */}

      {files.length > 0 && (
        <div className="w-full space-y-2">
          {files.map((file) => {
            const FileIcon = getFileIcon(file.type);

            const isUploading =
              file.progress > 0 && file.progress < 100 && !file.failed;

            return (
              <div
                key={file.id}
                className="w-full rounded-xl border bg-card p-4"
              >
                <div className="flex items-center gap-3">
                  {/* File icon */}

                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <FileIcon className="size-4 text-muted-foreground" />
                  </div>

                  {/* File information */}

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{file.name}</p>

                    <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{formatFileSize(file.size)}</span>

                      {file.failed && (
                        <>
                          <span>•</span>
                          <span className="text-destructive">
                            Upload failed
                          </span>
                        </>
                      )}

                      {file.progress === 100 && !file.failed && (
                        <>
                          <span>•</span>
                          <span className="text-emerald-600">Uploaded</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Status */}

                  <div className="flex shrink-0 items-center gap-2">
                    {isUploading && (
                      <Loader2 className="size-4 animate-spin text-muted-foreground" />
                    )}

                    {file.progress === 100 && !file.failed && (
                      <CheckCircle2 className="size-4 text-emerald-600" />
                    )}

                    {file.failed && (
                      <AlertCircle className="size-4 text-destructive" />
                    )}

                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      onClick={() => removeFile(file.id)}
                    >
                      <X className="size-4" />
                      <span className="sr-only">Remove {file.name}</span>
                    </Button>
                  </div>
                </div>

                {/* Progress */}

                {isUploading && (
                  <div className="mt-3 flex items-center gap-3">
                    <Progress value={file.progress} className="h-1.5" />

                    <span className="w-8 text-right text-xs text-muted-foreground">
                      {file.progress}%
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
