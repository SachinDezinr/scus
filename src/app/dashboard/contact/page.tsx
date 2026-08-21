'use client';

import { motion } from 'framer-motion';
import { Mail, Linkedin, Instagram, ExternalLink, MessageSquare } from 'lucide-react';

const channels = [
  {
    title: 'Electronic Mail',
    value: 'sachinpanwarpay@gmail.com',
    href: 'mailto:sachinpanwarpay@gmail.com',
    icon: Mail,
    color: '#4F6EF7',
  },
  {
    title: 'LinkedIn Professional',
    value: 'sachin-panwar-dezinr',
    href: 'https://www.linkedin.com/in/sachin-panwar-dezinr',
    icon: Linkedin,
    color: '#0A66C2',
  },
  {
    title: 'Instagram Handle',
    value: '@isachin.panwar',
    href: 'https://www.instagram.com/isachin.panwar?igsh=MXIxeGFxcXR2dThuYw==',
    icon: Instagram,
    color: '#E1306C',
  },
];

export default function ContactPage() {
  return (
    <div className="w-full max-w-4xl mx-auto flex-1 flex flex-col justify-between">
      {/* Upper content */}
      <div className="space-y-6 sm:space-y-8">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="pb-5 sm:pb-6 border-b border-[#1f2230]">
          <div className="flex items-center gap-2 mb-1">
            <MessageSquare size={16} className="text-primary" />
            <span className="text-[11px] font-mono uppercase tracking-wider text-primary font-semibold">Inquiries & Support</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
            Campus <span className="gradient-text">Communications</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 max-w-xl">
            Reach out for technical issues, system contributions, department integrations, or feedback.
          </p>
        </motion.div>

        {/* Contact Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
          {channels.map((c, i) => (
            <motion.a
              key={i}
              href={c.href}
              target={c.href.startsWith('http') ? '_blank' : undefined}
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="block group"
            >
              <div className="glass-card glass-card-hover rounded-xl p-4 sm:p-5 flex flex-col justify-between h-full transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-white/5 group-hover:scale-105 transition-transform"
                    style={{ background: `${c.color}15`, color: c.color }}
                  >
                    <c.icon size={20} />
                  </div>
                  <ExternalLink size={15} className="text-muted-foreground group-hover:text-white transition-colors" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] sm:text-[11px] font-mono uppercase text-muted-foreground tracking-wider mb-0.5">{c.title}</p>
                  <p className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-primary transition-colors">{c.value}</p>
                </div>
              </div>
            </motion.a>
          ))}
        </div>
      </div>

      {/* Bottom Pinned Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="pt-8 pb-4 mt-12 border-t border-[#1f2230] text-center shrink-0"
      >
        <p className="text-xs sm:text-sm text-muted-foreground font-medium flex items-center justify-center gap-1.5 flex-wrap">
          Created by <span className="text-white font-bold gradient-text">Sachin Panwar</span>
        </p>
        <p className="text-[10px] text-muted-foreground/60 mt-1 font-mono">
          Campus Utility System © {new Date().getFullYear()}
        </p>
      </motion.div>
    </div>
  );
}