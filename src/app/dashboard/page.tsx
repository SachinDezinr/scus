'use client';

import { useAuth } from '@/lib/auth-context';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Search, BookOpen, Building2, ArrowRight,
  Shield, Bot, Plus, CheckCircle2, Clock
} from 'lucide-react';

interface StatsData {
  complaintsCount: number;
  lostCount: number;
  foundCount: number;
  resourcesCount: number;
}

export default function DashboardPage() {
  const { user, authFetch } = useAuth();
  const [stats, setStats] = useState<StatsData>({
    complaintsCount: 0,
    lostCount: 0,
    foundCount: 0,
    resourcesCount: 0,
  });

  useEffect(() => {
    async function loadStats() {
      try {
        const [cRes, lRes, fRes, rRes] = await Promise.all([
          authFetch('/api/complaints'),
          authFetch('/api/lost-found/lost'),
          authFetch('/api/lost-found/found'),
          authFetch('/api/resources'),
        ]);
        const [cData, lData, fData, rData] = await Promise.all([
          cRes.json(), lRes.json(), fRes.json(), rRes.json(),
        ]);
        setStats({
          complaintsCount: (cData.complaints || []).length,
          lostCount: (lData.items || []).length,
          foundCount: (fData.items || []).length,
          resourcesCount: (rData.resources || []).length,
        });
      } catch {
        // quiet fallback
      }
    }
    loadStats();
  }, [authFetch]);

  return (
    <div className="space-y-8">
      {/* Top Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#1f2230]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono uppercase tracking-wider text-primary font-semibold">Campus Operations Hub</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Welcome back, {user?.name}
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
            Review your campus reports, browse verified exam notes, or query the assistant.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/ai-assistant"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#191b24] hover:bg-[#202330] border border-[#2b2f42] text-xs font-medium text-white transition-colors"
          >
            <Bot size={15} className="text-primary" />
            <span>Campus AI</span>
          </Link>
          {user?.role === 'admin' && (
            <Link
              href="/dashboard/admin"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-primary hover:bg-primary/90 text-xs font-semibold text-white transition-colors shadow-sm"
            >
              <Shield size={15} />
              <span>Admin Console</span>
            </Link>
          )}
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {[
          { label: 'Active Complaints', value: stats.complaintsCount, sub: 'In pipeline', href: '/dashboard/complaints' },
          { label: 'Lost Items Logged', value: stats.lostCount, sub: 'Awaiting match', href: '/dashboard/lost-found' },
          { label: 'Found Items Logged', value: stats.foundCount, sub: 'In registry', href: '/dashboard/lost-found' },
          { label: 'Verified Resources', value: stats.resourcesCount, sub: 'PDF Notes & PYQs', href: '/dashboard/resources' },
        ].map((item, idx) => (
          <Link key={idx} href={item.href}>
            <div className="glass-card glass-card-hover p-4 rounded-xl cursor-pointer">
              <span className="text-[11px] font-mono uppercase text-muted-foreground block">{item.label}</span>
              <p className="text-2xl font-bold text-white tracking-tight my-1">{item.value}</p>
              <span className="text-[11px] text-[#6b7280]">{item.sub}</span>
            </div>
          </Link>
        ))}
      </div>

      {/* Primary Utility Modules Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground font-mono">
            Platform Utilities
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Lost & Found */}
          <div className="glass-card rounded-xl p-5 flex flex-col justify-between hover:border-[#383c50] transition-colors">
            <div>
              <div className="w-9 h-9 rounded-lg bg-[#1b1e2a] border border-[#272b3c] flex items-center justify-center text-primary mb-4">
                <Search size={18} />
              </div>
              <h3 className="text-base font-bold text-white mb-1.5">Lost & Found Registry</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Automated attribute matching across color, brand, location, and item type with direct student contact.
              </p>
            </div>
            <div className="pt-5 mt-4 border-t border-[#1c1f2b] flex items-center justify-between">
              <Link href="/dashboard/lost-found" className="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
                Open Registry <ArrowRight size={13} />
              </Link>
            </div>
          </div>

          {/* Resources */}
          <div className="glass-card rounded-xl p-5 flex flex-col justify-between hover:border-[#383c50] transition-colors">
            <div>
              <div className="w-9 h-9 rounded-lg bg-[#1b1e2a] border border-[#272b3c] flex items-center justify-center text-amber mb-4">
                <BookOpen size={18} />
              </div>
              <h3 className="text-base font-bold text-white mb-1.5">Resource Exchange</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Course-specific lecture notes, previous year question papers, and preparation tips shared by seniors.
              </p>
            </div>
            <div className="pt-5 mt-4 border-t border-[#1c1f2b] flex items-center justify-between">
              <Link href="/dashboard/resources" className="text-xs font-semibold text-amber hover:underline flex items-center gap-1">
                Browse Repository <ArrowRight size={13} />
              </Link>
            </div>
          </div>

          {/* Infrastructure Complaints */}
          <div className="glass-card rounded-xl p-5 flex flex-col justify-between hover:border-[#383c50] transition-colors">
            <div>
              <div className="w-9 h-9 rounded-lg bg-[#1b1e2a] border border-[#272b3c] flex items-center justify-center text-rose-400 mb-4">
                <Building2 size={18} />
              </div>
              <h3 className="text-base font-bold text-white mb-1.5">Campus Infrastructure</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Report broken projectors, laboratory equipment, or furniture with classroom tags and priority levels.
              </p>
            </div>
            <div className="pt-5 mt-4 border-t border-[#1c1f2b] flex items-center justify-between">
              <Link href="/dashboard/complaints" className="text-xs font-semibold text-rose-400 hover:underline flex items-center gap-1">
                File Ticket <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Workflow Guidance */}
      <div className="p-5 rounded-xl bg-[#14161f] border border-[#202330]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-white mb-1">Need immediate assistance?</h3>
            <p className="text-xs text-muted-foreground">
              Use our AI campus assistant for querying available notes, checking ticket resolutions, or finding items.
            </p>
          </div>
          <Link
            href="/dashboard/ai-assistant"
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[#202332] hover:bg-[#282d40] border border-[#30354b] text-xs font-medium text-white transition-colors shrink-0"
          >
            Launch Assistant
          </Link>
        </div>
      </div>
    </div>
  );
}