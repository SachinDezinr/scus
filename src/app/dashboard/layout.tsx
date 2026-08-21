'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Sidebar from '@/components/sidebar';
import AIChatWidget from '@/components/ai-chat-widget';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0b0c10]">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#0b0c10] text-foreground flex">
      <Sidebar />
      <main className="flex-1 lg:ml-[240px] pt-14 lg:pt-0 min-h-screen w-0 flex flex-col">
        <div className="p-4 md:p-8 max-w-6xl mx-auto w-full flex-1 flex flex-col">
          {children}
        </div>
      </main>
      <AIChatWidget />
    </div>
  );
}