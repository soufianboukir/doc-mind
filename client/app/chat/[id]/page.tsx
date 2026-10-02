import Chat from "@/components/chat/chat-view";

interface ChatPageProps {
  params: Promise<{ id: string }>;
}

export default async function ChatPage({ params }: ChatPageProps) {
  const { id } = await params;

  return <Chat chatId={id} />;
}
