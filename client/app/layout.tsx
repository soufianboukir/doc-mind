import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DocMind",
  description:
    "A simple and intuitive AI-powered document analysis tool that helps you extract insights and make informed decisions from your documents.",
};

import { Geist } from "next/font/google";

const geist = Geist({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-geist-sans",
  display: "swap",
});

// app/layout.tsx
import { AuthProvider } from "@/context/auth-context";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={geist.variable}>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
