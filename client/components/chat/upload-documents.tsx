"use client";

import { ChangeEvent, useState } from "react";
import { Loader2, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";

interface UploadDocumentsProps {
  chatId: string;
  onUploaded?: () => void;
}

export function UploadDocuments({
  chatId,
  onUploaded,
}: UploadDocumentsProps) {
  const [uploading, setUploading] = useState(false);

  async function handleFiles(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const files = event.target.files;

    if (!files || files.length === 0) {
      return;
    }

    const formData = new FormData();

    Array.from(files).forEach((file) => {
      formData.append("files", file);
    });

    try {
      setUploading(true);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/chats/${chatId}/documents`,
        {
          method: "POST",
          credentials: "include",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      onUploaded?.();
    } catch (error) {
      console.error(error);
    } finally {
      setUploading(false);

      event.target.value = "";
    }
  }

  return (
    <div>
      <input
        id="document-upload"
        type="file"
        multiple
        className="hidden"
        onChange={handleFiles}
        accept=".pdf,.doc,.docx,.txt,.md"
      />

      <Button
        disabled={uploading}
      >
        <label htmlFor="document-upload">
          {uploading ? (
            <Loader2 className="animate-spin" />
          ) : (
            <Upload />
          )}

          {uploading
            ? "Uploading..."
            : "Upload documents"}
        </label>
      </Button>
    </div>
  );
}