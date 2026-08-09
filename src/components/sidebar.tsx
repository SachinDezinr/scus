'use client';

import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home, Search, BookOpen, Building2, Mail, Info,
  LogOut, Menu, X, Shield, ChevronRight
} from 'lucide-react';
import Logo from '@/components/logo';

const navItems = [
  { href: '/dashboard', label: 'Home', icon: Home, color: '#a78bfa', adminOnly: false },
  { href: '/dashboard/lost-found', label: 'Lost & Found', icon: Search, color: '#00f5d4', adminOnly: false },
  { href: '/dashboard/resources', label: 'Resource Exchange', icon: BookOpen, color: '#fbbf24', adminOnly: false },
  { href: '/dashboard/complaints', label: 'Complaints', icon: Building2, color: '#ff6b6b', adminOnly: false },
  { href: '/dashboard/contact', label: 'Contact Us', icon: Mail, color: '#7b61ff', adminOnly: false },
  { href: '/dashboard/about', label: 'About Us', icon: Info, color: '#a78bfa', adminOnly: false },
  { href: '/dashboard/admin', label: 'Admin Panel', icon: Shield, color: '#ff6b6b', adminOnly: true },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) =>
    pathname === href || (href !== '/dashboard' && pathname.startsWith(href));

  const filteredItems = navItems.filter(item => !item.adminOnly || user?.role === 'admin');

  const NavContent = ({ onNav, isMobile = false }: { onNav?: () => void; isMobile?: boolean }) => (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Logo */}
      <div className="p-4 border-b border-border shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-secondary/80 border border-primary/20 flex items-center justify-center shrink-0 shadow-sm">
            <Logo size={24} />
          </div>
          <div className="min-w-0">
            <h1 className={`${isMobile ? 'text-sm' : 'text-xs'} font-bold tracking-tight text-foreground leading-tight truncate`}>
              Smart Student
            </h1>
            <p className={`${isMobile ? 'text-[10px]' : 'text-[9px]'} text-muted-foreground font-semibold tracking-wider uppercase truncate`}>
              Utility System
            </p>
          </div>
        </div>
      </div>

      {/* User badge */}
      <div className="px-2.5 py-2.5 shrink-0">
        <div className="glass-card rounded-xl px-2.5 py-2 flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
            style={{
              background: user?.role === 'admin' ? 'rgba(255,107,107,0.2)' : 'rgba(0,245,212,0.15)',
              color: user?.role === 'admin' ? '#ff6b6b' : '#00f5d4'
            }}
          >
            {user?.role === 'admin' ? <Shield size={13} /> : user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className={`${isMobile ? 'text-sm' : 'text-xs'} font-semibold truncate leading-tight`}>{user?.name}</p>
            <p className={`${isMobile ? 'text-xs' : 'text-[10px]'} text-muted-foreground capitalize`}>{user?.role}</p>
          </div>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-2.5 py-1 space-y-0.5">
        {filteredItems.map(item => {
          const active = isActive(item.href);
          return (
            <Link key={item.href} href={item.href} onClick={onNav}>
              <motion.div
                className={`relative flex items-center gap-2.5 px-2.5 py-2 rounded-xl ${
                  isMobile ? 'text-sm' : 'text-xs'
                } font-medium transition-colors cursor-pointer ${
                  active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                }`}
                whileHover={{ x: 2 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              >
                {active && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute inset-0 rounded-xl"
                    style={{ background: `${item.color}12`, border: `1px solid ${item.color}22` }}
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  />
                )}
                <item.icon
                  size={isMobile ? 18 : 16}
                  style={{ color: active ? item.color : undefined }}
                  className="relative z-10 shrink-0"
                />
                <span className="relative z-10 flex-1 truncate">{item.label}</span>
                {item.adminOnly && !active && (
                  <span className="text-[8px] font-bold px-1 py-0.5 rounded bg-coral/15 text-coral relative z-10 shrink-0">
                    ADMIN
                  </span>
                )}
                {active && (
                  <ChevronRight size={isMobile ? 14 : 12} className="ml-auto relative z-10 shrink-0" style={{ color: item.color }} />
                )}
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-2.5 border-t border-border shrink-0">
        <button
          onClick={logout}
          className={`flex items-center gap-2.5 w-full px-2.5 py-2 rounded-xl ${
            isMobile ? 'text-sm' : 'text-xs'
          } font-medium text-muted-foreground hover:text-coral hover:bg-coral/8 transition-colors`}
        >
          <LogOut size={isMobile ? 18 : 16} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* ─── Mobile top bar ─── */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 h-14 bg-sidebar border-b border-border flex items-center justify-between px-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-secondary/80 border border-primary/20 flex items-center justify-center">
            <Logo size={20} />
          </div>
          <span className="text-sm font-bold tracking-wider">SSUS</span>
        </div>
        <button
          onClick={() => setMobileOpen(v => !v)}
          className="p-2 rounded-lg hover:bg-white/8 transition-colors"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* ─── Mobile drawer (225px width) ─── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 bg-black/60 z-40"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -240 }}
              animate={{ x: 0 }}
              exit={{ x: -240 }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              className="lg:hidden fixed left-0 top-0 bottom-0 w-[225px] z-50 bg-sidebar border-r border-border"
            >
              <NavContent onNav={() => setMobileOpen(false)} isMobile={true} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ─── Desktop sidebar — unchanged 260px ─── */}
      <aside className="hidden lg:flex flex-col fixed top-0 left-0 bottom-0 w-[260px] z-30 bg-sidebar border-r border-border">
        <NavContent isMobile={false} />
      </aside>
    </>
  );
}