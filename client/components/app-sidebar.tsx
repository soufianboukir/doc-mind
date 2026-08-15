"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { NavChats } from "@/components/nav-chats";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Sparkles } from "lucide-react";
import type { Chat } from "@/types/chat";
import { apiFetch, ApiError } from "@/lib/api";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const router = useRouter();

  const [chats, setChats] = React.useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = React.useState<string | undefined>();
  const [isLoadingChats, setIsLoadingChats] = React.useState(true);

  React.useEffect(() => {
    async function loadChats() {
      try {
        const data = await apiFetch<Chat[]>("/api/v1/chats");
        setChats(data);
      } catch (err) {
        console.error(err instanceof ApiError ? err.message : err);
      } finally {
        setIsLoadingChats(false);
      }
    }
    loadChats();
  }, []);

  return (
    <Sidebar
      className="top-(--header-height) h-[calc(100svh-var(--header-height))]!"
      {...props}
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<a href="#" />}>
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <Sparkles className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">DocMind</span>
                <span className="truncate text-xs">Enterprise</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <NavChats
          chats={chats}
          activeChatId={activeChatId}
          isLoading={isLoadingChats}
          onSelectChat={(chat) => {
            setActiveChatId(chat.id);
            router.push(`/chat/${chat.id}`);
          }}
          onAddChat={async (title: string) => {
            try {
              const chat = await apiFetch<Chat>("/api/v1/chats", {
                method: "POST",
                body: JSON.stringify({ title }),
              });
              setChats((prev) => [chat, ...prev]);
              setActiveChatId(chat.id);
              router.push(`/chat/${chat.id}`);
            } catch (err) {
              console.error(err instanceof ApiError ? err.message : err);
              throw err; // keeps the dialog open on failure
            }
          }}
          onRenameChat={async (chat: Chat, newTitle: string) => {
            try {
              await apiFetch(`/api/v1/chats/${chat.id}`, {
                method: "PATCH",
                body: JSON.stringify({ title: newTitle }),
              });
              setChats((prev) =>
                prev.map((c) =>
                  c.id === chat.id ? { ...c, title: newTitle } : c,
                ),
              );
            } catch (err) {
              console.error(err instanceof ApiError ? err.message : err);
              throw err;
            }
          }}
          onDeleteChat={async (chat: Chat) => {
            try {
              await apiFetch(`/api/v1/chats/${chat.id}`, {
                method: "DELETE",
              });
              setChats((prev) => prev.filter((c) => c.id !== chat.id));
              if (activeChatId === chat.id) {
                setActiveChatId(undefined);
                router.push("/");
              }
            } catch (err) {
              console.error(err instanceof ApiError ? err.message : err);
              throw err;
            }
          }}
        />
      </SidebarContent>

      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
