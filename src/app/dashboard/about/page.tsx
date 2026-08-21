'use client';

import { Shield, Search, BookOpen, Building2 } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="space-y-8 max-w-4xl">
      <div className="pb-6 border-b border-[#1f2230]">
        <span className="text-[11px] font-mono uppercase tracking-wider text-primary font-semibold">Institutional Specs</span>
        <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight mt-1">
          About Smart Student Utility System
        </h1>
        <p className="text-xs md:text-sm text-muted-foreground mt-1">
          Architected for campus efficiency, collaborative study material circulation, and infrastructure upkeep.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          {
            title: 'Lost & Found Registry',
            desc: 'Automated weighted string matching algorithm comparing brand, item name, color, and location to connect finders with owners securely.',
            icon: Search,
          },
          {
            title: 'Resource Repository',
            desc: 'Curated repository for semester notes, PYQs, and exam preparation guides indexed by course code and subject title.',
            icon: BookOpen,
          },
          {
            title: 'Infrastructure Tracking',
            desc: 'Incident reporting pipeline enabling students to report broken facilities with photo evidence and priority tagging.',
            icon: Building2,
          },
          {
            title: 'Role-Based Permissions',
            desc: 'Granular access controls isolating administrative triage actions from standard student submissions.',
            icon: Shield,
          },
        ].map((mod, i) => (
          <div key={i} className="glass-card rounded-xl p-5 border border-[#232634]">
            <div className="w-8 h-8 rounded-lg bg-[#191b24] border border-[#262a3c] flex items-center justify-center text-primary mb-3">
              <mod.icon size={16} />
            </div>
            <h3 className="text-sm font-bold text-white mb-1">{mod.title}</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">{mod.desc}</p>
          </div>
        ))}
      </div>

      <div className="p-5 rounded-xl bg-[#14161f] border border-[#202330]">
        <h3 className="text-sm font-bold text-white mb-1">Architecture & Security</h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Powered by Next.js 15 App Router, TypeScript, and Neon Serverless Postgres. Inputs are sanitized against XSS vectors and secured with token authorization.
        </p>
      </div>
    </div>
  );
}