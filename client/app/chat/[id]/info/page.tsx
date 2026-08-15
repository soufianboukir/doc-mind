"use client";

import { use, useCallback, useEffect, useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { DocumentList } from "@/components/chat/document-list";
import { DocumentUpload } from "@/components/chat/document-upload";
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
    let cancelled = false;

    async function fetchInitialDocuments() {
      try {
        const result = await getChatDocuments(id);

        if (cancelled) return;

        setData(result);
        setError(null);
      } catch (error) {
        if (cancelled) return;

        console.error(error);

        setError(
          error instanceof Error ? error.message : "Something went wrong",
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void fetchInitialDocuments();

    return () => {
      cancelled = true;
    };
  }, [id]);

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
      <div className="mx-auto px-6 py-5">
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
                {data.documents.length === 1 ? "document " : "documents "}-
                Upload and manage documents for this chat.
              </p>
            </div>
          </div>
        </div>

        <Separator className="my-8" />

        <section className="w-full">
          <DocumentUpload chatId={id} onUploaded={loadDocuments} />

          <div className="mt-6">
            <DocumentList documents={data.documents} onDelete={handleDelete} />
          </div>
        </section>
      </div>
    </main>
  );
}
