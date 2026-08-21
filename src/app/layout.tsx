import type { Metadata } from "next";
import "./globals.css";
import { VisualEditsMessenger } from "orchids-visual-edits";
import { AuthProvider } from "@/lib/auth-context";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "Smart Student Utility System",
  description: "A comprehensive utility system for college students",
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
        </AuthProvider>
        <VisualEditsMessenger />
      </body>
    </html>
  );
}