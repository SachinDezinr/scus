import type { Metadata, Viewport } from "next";
import "./globals.css";
import { VisualEditsMessenger } from "orchids-visual-edits";
import { AuthProvider } from "@/lib/auth-context";
import { DataProvider } from "@/lib/data-context";
import { ChatProvider } from "@/lib/chat-context";
import { Toaster } from "sonner";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  interactiveWidget: "resizes-content",
};

export const metadata: Metadata = {
  title: "Campus Utility System",
  description: "A comprehensive utility system for college students and faculty",
  icons: {
    icon: [
      { url: "/app-logo.svg", type: "image/svg+xml" }
    ],
    shortcut: "/app-logo.svg",
    apple: "/app-logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AuthProvider>
          <DataProvider>
            <ChatProvider>
              {children}
              <Toaster
                theme="dark"
                position="top-right"
                toastOptions={{
                  style: {
                    background: '#12121a',
                    border: '1px solid rgba(168, 139, 250, 0.15)',
                    color: '#e8e6f0',
                  },
                }}
              />
            </ChatProvider>
          </DataProvider>
        </AuthProvider>
        <VisualEditsMessenger />
      </body>
    </html>
  );
}