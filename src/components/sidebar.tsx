'use client';

import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Search, BookOpen, Building2,
  Mail, Info, LogOut, Menu, X, Shield, Bot
} from 'lucide-react';
import Logo from '@/components/logo';

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard, adminOnly: false },
  { href: '/dashboard/ai-assistant', label: 'AI Assistant', icon: Bot, adminOnly: false },
  { href: '/dashboard/lost-found', label: 'Lost & Found', icon: Search, adminOnly: false },
  { href: '/dashboard/resources', label: 'Resources', icon: BookOpen, adminOnly: false },
  { href: '/dashboard/complaints', label: 'Complaints', icon: Building2, adminOnly: false },
  { href: '/dashboard/contact', label: 'Contact', icon: Mail, adminOnly: false },
  { href: '/dashboard/about', label: 'About', icon: Info, adminOnly: false },
  { href: '/dashboard/admin', label: 'Admin Console', icon: Shield, adminOnly: true },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) =>
    pathname === href || (href !== '/dashboard' && pathname.startsWith(href));

  const filteredItems = navItems.filter(item => !item.adminOnly || user?.role === 'admin');

  const NavContent = ({ onNav }: { onNav?: () => void }) => (
    <div className="flex flex-col h-full bg-[#0e0f14] text-foreground select-none">
      {/* Brand Header */}
      <div className="h-16 px-5 flex items-center gap-3 border-b border-[#1c1e27] shrink-0">
        <Logo size={30} />
        <div className="min-w-0">
          <div className="text-xs font-bold tracking-tight text-white flex items-center gap-1.5">
            CAMPUS UTILITY
            <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">v1.2</span>
          </div>
          <p className="text-[11px] text-muted-foreground truncate">Student Operating Hub</p>
        </div>
      </div>

      {/* User Context card */}
      <div className="p-3">
        <div className="p-3 rounded-lg bg-[#14161f] border border-[#202330] flex items-center gap-2.5 transition-all lg:hover:border-[#3b4056]">
          <div
            className="w-8 h-8 rounded-md flex items-center justify-center text-xs font-bold shrink-0 bg-[#212536] text-white border border-[#2e3348]"
          >
            {user?.role === 'admin' ? <Shield size={14} className="text-amber" /> : user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate leading-tight">{user?.name}</p>
            <p className="text-[10px] text-muted-foreground font-mono truncate">{user?.email}</p>
          </div>
          {user?.role === 'admin' && (
            <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
              ADM
            </span>
          )}
        </div>
      </div>

      {/* Navigation Links */}
      <div className="px-3 py-1 flex-1 space-y-1 overflow-y-auto">
        <div className="px-2 pb-1.5 text-[10px] font-mono uppercase tracking-wider text-muted-foreground/70">
          Main Navigation
        </div>
        {filteredItems.map(item => {
          const active = isActive(item.href);
          return (
            <Link key={item.href} href={item.href} onClick={onNav} className="block">
              <div
                className={`nav-item-link relative flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium ${
                  active
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-[#9ca3af] hover:text-white hover:bg-[#161822] lg:hover:border lg:hover:border-[#2b2f44]'
                }`}
              >
                <item.icon
                  size={16}
                  className={`nav-icon transition-transform duration-200 ${active ? 'text-white' : 'text-[#6b7280]'}`}
                />
                <span className="nav-text flex-1 truncate transition-all duration-200">{item.label}</span>
                {item.adminOnly && (
                  <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded ${active ? 'bg-black/20 text-white' : 'bg-[#232634] text-muted-foreground'}`}>
                    ROOT
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </div>

      {/* Footer / Sign Out */}
      <div className="p-3 border-t border-[#1c1e27] shrink-0">
        <button
          onClick={logout}
          className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 transition-all lg:hover:translate-x-1"
        >
          <LogOut size={15} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile top navigation bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 h-16 bg-[#0e0f14] border-b border-[#1c1e27] flex items-center justify-between px-4">
        <div className="flex items-center gap-2.5">
          <Logo size={27} />
          <span className="text-s font-bold tracking-tight text-white uppercase">Campus Utility</span>
        </div>
        <button
          onClick={() => setMobileOpen(v => !v)}
          className="p-2 rounded-md hover:bg-[#161822] text-muted-foreground hover:text-white transition-colors"
          aria-label="Toggle Navigation"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 bg-black/70 z-40 backdrop-blur-xs"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -230 }}
              animate={{ x: 0 }}
              exit={{ x: -230 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="lg:hidden fixed left-0 top-0 bottom-0 w-[230px] z-50 bg-[#0e0f14] border-r border-[#1c1e27]"
            >
              <NavContent onNav={() => setMobileOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Desktop static sidebar */}
      <aside className="hidden lg:flex flex-col fixed top-0 left-0 bottom-0 w-[240px] z-30 bg-[#0e0f14] border-r border-[#1c1e27]">
        <NavContent />
      </aside>
    </>
  );
}