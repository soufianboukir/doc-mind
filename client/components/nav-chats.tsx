"use client";

import { useState } from "react";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupAction,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  MessageSquare,
  MessageSquarePlus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Loader2,
  Plus,
  Upload,
} from "lucide-react";
import type { Chat } from "@/types/chat";
import Link from "next/link";

interface NavChatsProps {
  chats: Chat[];
  activeChatId?: string;
  isLoading?: boolean;
  onSelectChat?: (chat: Chat) => void;
  onAddChat?: (title: string) => void | Promise<void>;
  onRenameChat?: (chat: Chat, newTitle: string) => void | Promise<void>;
  onDeleteChat?: (chat: Chat) => void | Promise<void>;
}

export function NavChats({
  chats,
  activeChatId,
  onSelectChat,
  onAddChat,
  onRenameChat,
  onDeleteChat,
}: NavChatsProps) {
  // Add dialog
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  // Rename dialog
  const [editingChat, setEditingChat] = useState<Chat | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);

  // Delete confirmation
  const [deletingChat, setDeletingChat] = useState<Chat | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  function openAdd() {
    setNewTitle("");
    setIsAddOpen(true);
  }

  async function confirmAdd() {
    const title = newTitle.trim() || "New chat";
    try {
      setIsAdding(true);
      await onAddChat?.(title);
      setIsAddOpen(false);
    } finally {
      setIsAdding(false);
    }
  }

  function openRename(chat: Chat) {
    setEditingChat(chat);
    setRenameValue(chat.title);
  }

  async function confirmRename() {
    if (!editingChat || !renameValue.trim()) return;
    try {
      setIsRenaming(true);
      await onRenameChat?.(editingChat, renameValue.trim());
      setEditingChat(null);
    } finally {
      setIsRenaming(false);
    }
  }

  async function confirmDelete() {
    if (!deletingChat) return;
    try {
      setIsDeleting(true);
      await onDeleteChat?.(deletingChat);
      setDeletingChat(null);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
      <SidebarGroup>
        <SidebarGroupLabel>Chats</SidebarGroupLabel>

        {chats.length > 0 && (
          <SidebarGroupAction title="New chat" onClick={openAdd}>
            <Plus className="size-4" />
            <span className="sr-only">New chat</span>
          </SidebarGroupAction>
        )}

        {chats.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed px-4 py-8 mx-2 text-center">
            <div className="flex size-9 items-center justify-center rounded-full bg-muted">
              <MessageSquare className="size-4 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">No chats yet</p>
              <p className="text-xs text-muted-foreground">
                Start a new conversation to see it here.
              </p>
            </div>
            <Button size="sm" className="mt-1 gap-1.5" onClick={openAdd}>
              <MessageSquarePlus className="size-3.5" />
              New chat
            </Button>
          </div>
        ) : (
          <SidebarMenu>
            {chats.map((chat) => (
              <SidebarMenuItem key={chat.id} className="-mb-5">
                <SidebarMenuButton
                  isActive={chat.id === activeChatId}
                  onClick={() => onSelectChat?.(chat)}
                  className="py-5 px-3 cursor-pointer"
                >
                  <span className="truncate">{chat.title}</span>
                </SidebarMenuButton>

                <DropdownMenu>
                  <DropdownMenuTrigger>
                    <SidebarMenuAction
                      showOnHover
                      className="data-[state=open]:bg-sidebar-accent data-[state=open]:opacity-100 mt-1"
                    >
                      <MoreHorizontal />
                      <span className="sr-only">More</span>
                    </SidebarMenuAction>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    side="right"
                    align="start"
                    className="w-50"
                  >
                    <DropdownMenuItem
                      onClick={() => openRename(chat)}
                      className="gap-2 cursor-pointer"
                    >
                      <Pencil className="size-3.5" />
                      <span>Edit chat</span>
                    </DropdownMenuItem>

                    <DropdownMenuItem className="gap-2 cursor-pointer">
                      <Upload className="size-3.5" />
                      <Link href={`/chat/${chat.id}/info`}>
                        Upload documents
                      </Link>
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => setDeletingChat(chat)}
                      className="gap-2 text-destructive focus:text-destructive cursor-pointer"
                    >
                      <Trash2 className="size-3.5" />
                      <span>Delete chat</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        )}
      </SidebarGroup>

      {/* Add dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>New chat</DialogTitle>
            <DialogDescription>Give your new chat a title.</DialogDescription>
          </DialogHeader>
          <Input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") confirmAdd();
            }}
            placeholder="New chat"
            autoFocus
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>
              Cancel
            </Button>
            <Button onClick={confirmAdd} disabled={isAdding}>
              {isAdding ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                "Create"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename dialog */}
      <Dialog
        open={!!editingChat}
        onOpenChange={(open) => !open && setEditingChat(null)}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Rename chat</DialogTitle>
            <DialogDescription>Give this chat a new title.</DialogDescription>
          </DialogHeader>
          <Input
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") confirmRename();
            }}
            placeholder="Chat title"
            autoFocus
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingChat(null)}>
              Cancel
            </Button>
            <Button
              onClick={confirmRename}
              disabled={isRenaming || !renameValue.trim()}
            >
              {isRenaming ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                "Save"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deletingChat}
        onOpenChange={(open) => !open && setDeletingChat(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete <b>{deletingChat?.title}</b>?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this chat and its messages. This
              action can&apos;t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmDelete();
              }}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
