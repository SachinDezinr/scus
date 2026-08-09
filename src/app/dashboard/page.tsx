'use client';

import { useAuth } from '@/lib/auth-context';
import { motion, Variants } from 'framer-motion';
import Link from 'next/link';
import { Search, BookOpen, Building2, Mail, ArrowRight, Sparkles } from 'lucide-react';

const modules = [
  {
    title: 'Lost & Found',
    desc: 'Report lost items or register found ones. Smart matching connects owners with finders.',
    icon: Search,
    href: '/dashboard/lost-found',
    color: '#00f5d4',
    gradient: 'from-[#00f5d4]/20 to-[#00f5d4]/5',
  },
  {
    title: 'Resource Exchange',
    desc: 'Share notes, PYQs, and study materials. Help juniors ace their exams.',
    icon: BookOpen,
    href: '/dashboard/resources',
    color: '#fbbf24',
    gradient: 'from-[#fbbf24]/20 to-[#fbbf24]/5',
  },
  {
    title: 'Infrastructure Complaints',
    desc: 'Report broken infrastructure. Track repair status in real-time.',
    icon: Building2,
    href: '/dashboard/complaints',
    color: '#ff6b6b',
    gradient: 'from-[#ff6b6b]/20 to-[#ff6b6b]/5',
  },
  {
    title: 'Contact Us',
    desc: 'Get in touch via Gmail, WhatsApp, or Instagram for quick support.',
    icon: Mail,
    href: '/dashboard/contact',
    color: '#7b61ff',
    gradient: 'from-[#7b61ff]/20 to-[#7b61ff]/5',
  },
];

const container: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};
const item: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 20 } },
};

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="max-w-5xl mx-auto">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-2 mb-2">
          <Sparkles size={18} className="text-neon" />
          <span className="text-xs font-semibold text-neon uppercase tracking-widest">Dashboard</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
          Welcome back, <span className="gradient-text">{user?.name}</span>
        </h1>
        <p className="text-muted-foreground mt-2 text-sm md:text-base">
          Access all campus utilities from one place. What would you like to do today?
        </p>
      </motion.div>

      {/* Module cards */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid gap-4 md:grid-cols-2"
      >
        {modules.map(mod => (
          <motion.div key={mod.title} variants={item}>
            <Link href={mod.href}>
              <div className="glass-card glass-card-hover rounded-2xl p-6 group cursor-pointer transition-all duration-300 h-full">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${mod.gradient} flex items-center justify-center mb-4`}>
                  <mod.icon size={22} style={{ color: mod.color }} />
                </div>
                <h3 className="text-lg font-bold mb-1" style={{ color: mod.color }}>{mod.title}</h3>
                <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{mod.desc}</p>
                <div className="flex items-center gap-1 text-xs font-semibold" style={{ color: mod.color }}>
                  <span>Open Module</span>
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}