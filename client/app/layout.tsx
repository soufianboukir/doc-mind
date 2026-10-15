import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DocMind",
  description:
    "A simple and intuitive AI-powered document analysis tool that helps you extract insights and make informed decisions from your documents.",
};


// app/layout.tsx
import { AuthProvider } from "@/context/auth-context";
import { ThemeProvider } from "@/components/theme-provider";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
