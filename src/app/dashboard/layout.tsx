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
      <div className="min-h-screen flex items-center justify-center mesh-bg">
        <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen mesh-bg flex">
      <Sidebar />
      <main className="flex-1 lg:ml-[260px] pt-14 lg:pt-0 min-h-screen w-0">
        <div className="p-4 md:p-6 lg:p-8">
          {children}
        </div>
      </main>
      <AIChatWidget />
    </div>
  );
}