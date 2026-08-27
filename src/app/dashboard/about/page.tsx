'use client';

import { motion } from 'framer-motion';
import { Shield, Search, BookOpen, Building2, Cpu, CheckCircle2, Info } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="w-full space-y-5">
      {/* Top Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-2 mb-1">
          <Info size={16} className="text-primary" />
          <span className="text-[11px] font-semibold text-primary uppercase tracking-widest">Institutional Specs</span>
        </div>
        <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-white">
          About <span className="gradient-text">Campus Utility System</span>
        </h1>
        <p className="text-muted-foreground mt-0.5 text-xs sm:text-sm">
          Architected for high campus efficiency, collaborative peer-to-peer study material circulation, lost item recovery, and rapid infrastructure upkeep.
        </p>
      </motion.div>

      {/* Core Utility Modules */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          {
            title: 'Lost & Found Registry',
            desc: 'Automated weighted string matching algorithm comparing brand, item name, color, and location to connect finders with owners securely.',
            icon: Search,
            tag: 'Automated Matching',
          },
          {
            title: 'Resource Repository',
            desc: 'Curated repository for semester notes, PYQs, and exam preparation guides indexed by course code and subject title.',
            icon: BookOpen,
            tag: 'Peer Knowledge',
          },
          {
            title: 'Infrastructure Tracking',
            desc: 'Incident reporting pipeline enabling students to report broken facilities with classroom tags, priority levels, and photo evidence.',
            icon: Building2,
            tag: 'Rapid Repair',
          },
          {
            title: 'Role-Based Permissions',
            desc: 'Granular access controls isolating administrative triage actions from standard student submissions.',
            icon: Shield,
            tag: 'Secured Access',
          },
        ].map((mod, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass-card glass-card-hover rounded-2xl p-5 border border-[#232634] flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="w-9 h-9 rounded-xl bg-[#191b24] border border-[#262a3c] flex items-center justify-center text-primary">
                  <mod.icon size={17} />
                </div>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                  {mod.tag}
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-bold text-white mb-1.5">{mod.title}</h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{mod.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Architecture & Tech Stack Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="p-5 sm:p-6 rounded-2xl bg-[#14161f] border border-[#202330] space-y-3"
      >
        <div className="flex items-center gap-2">
          <Cpu size={18} className="text-primary" />
          <h3 className="text-sm sm:text-base font-bold text-white">Architecture & Engineering</h3>
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          Engineered using Next.js 15 App Router, React 19, TypeScript, and Neon Serverless PostgreSQL. Security layers include strict parameterized SQL execution, client-side data sanitization against XSS vectors, and rate-limited authentication barriers.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-[11px] font-mono text-muted-foreground">
          {['Next.js 15 App Router', 'Neon Serverless Postgres', 'TypeScript Strict', 'Tailwind CSS'].map((tech, idx) => (
            <div key={idx} className="flex items-center gap-1.5 p-2 rounded-lg bg-[#1a1d29] border border-[#262b3d]">
              <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
              <span className="truncate">{tech}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}