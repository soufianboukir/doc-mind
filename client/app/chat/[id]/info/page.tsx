"use client";

import { use, useCallback, useEffect, useState } from "react";
import { ArrowLeft, FileStack, Loader2 } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { DocumentList } from "@/components/chat/document-list";
import { UploadDocuments } from "@/components/chat/upload-documents";
import { getChatDocuments } from "@/lib/api/chats";
import { ChatDocuments } from "@/types/chat";

interface ChatInfoPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function ChatInfoPage({ params }: ChatInfoPageProps) {
  const { id } = use(params);

  const [data, setData] = useState<ChatDocuments | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  const loadDocuments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await getChatDocuments(id);

      setData(result);
    } catch (error) {
      console.error(error);

      setError(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  async function handleDelete(documentId: string) {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/chats/${id}/documents/${documentId}`,
        {
          method: "DELETE",
          credentials: "include",
        },
      );

      if (!response.ok) {
        throw new Error("Failed to delete document");
      }

      await loadDocuments();
    } catch (error) {
      console.error(error);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="mx-auto flex min-h-screen items-center justify-center px-6">
        <div className="text-center">
          <h1 className="text-xl font-semibold">Unable to load chat</h1>

          <p className="mt-2 text-sm text-muted-foreground">
            {error ?? "Something went wrong."}
          </p>

          <Button className="mt-6" variant="outline">
            <Link href={`/chat/${id}`}>
              <ArrowLeft />
              Back to chat
            </Link>
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <div className="mx-auto px-6 py-10">

        <div className="flex items-start justify-between gap-6">
          <div className="flex items-start gap-4">
            <Button variant="ghost" size="icon">
              <Link href={`/chat/${id}`}>
                <ArrowLeft />
                <span className="sr-only">Back to chat</span>
              </Link>
            </Button>

            <div>
              <p className="text-sm text-muted-foreground">Chat information</p>

              <h1 className="mt-1 text-2xl font-semibold tracking-tight">
                {data.title}
              </h1>

              <p className="mt-1 text-sm text-muted-foreground">
                {data.documents.length}{" "}
                {data.documents.length === 1 ? "document" : "documents"}
              </p>
            </div>
          </div>

          <UploadDocuments chatId={id} onUploaded={loadDocuments} />
        </div>

        <Separator className="my-8" />


        <section>
          <div className="mb-5 flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
              <FileStack className="size-4" />
            </div>

            <div>
              <h2 className="font-semibold">Documents</h2>

              <p className="text-sm text-muted-foreground">
                Documents attached to this chat
              </p>
            </div>
          </div>

          <DocumentList documents={data.documents} onDelete={handleDelete} />
        </section>
      </div>
    </main>
  );
}
