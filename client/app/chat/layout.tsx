"use client";

import { ReactNode } from "react";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { RequireAuth } from "@/components/require-auth";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

interface ChatLayoutProps {
  children: ReactNode;
}

export default function ChatLayout({ children }: ChatLayoutProps) {
  return (
    <RequireAuth>
      <div className="flex h-screen flex-col">
        <div className="[--header-height:calc(--spacing(14))]">
          <SidebarProvider className="flex flex-col">
            <SiteHeader />
            <div className="flex flex-1">
              <AppSidebar />
              <SidebarInset>
                <div className="flex flex-1 flex-col gap-4 p-4">
                  {children}
                </div>
              </SidebarInset>
            </div>
          </SidebarProvider>
        </div>
      </div>
    </RequireAuth>
  );
}
