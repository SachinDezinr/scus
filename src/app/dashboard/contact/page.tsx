'use client';

import { motion, Variants } from 'framer-motion';
import { Mail, Phone, Instagram, ExternalLink, Linkedin } from 'lucide-react';

const contacts = [
  {
    label: 'Gmail',
    desc: 'sachinpanwarpay@gmail.com',
    icon: Mail,
    color: '#ff6b6b',
    gradient: 'from-[#ff6b6b]/20 to-[#ff6b6b]/5',
    href: 'mailto:sachinpanwarpay@gmail.com',
  },
  {
    label: 'LinkedIn',
    desc: 'sachin-panwar-dezinr',
    icon: Linkedin,
    color: '#0a66c2',
    gradient: 'from-[#0a66c2]/20 to-[#0a66c2]/5',
    href: 'https://www.linkedin.com/in/sachin-panwar-dezinr',
  },
  {
    label: 'Instagram',
    desc: '@isachin.panwar',
    icon: Instagram,
    color: '#a78bfa',
    gradient: 'from-[#a78bfa]/20 to-[#a78bfa]/5',
    href: 'https://www.instagram.com/isachin.panwar?igsh=MXIxeGFxcXR2dThuYw==',
  },
];

const container: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.12 } },
};
const item: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 20 } },
};

export default function ContactPage() {
  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Phone size={18} className="text-electric" />
          <span className="text-xs font-semibold text-electric uppercase tracking-widest">Contact</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
          Get in <span className="gradient-text">Touch</span>
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">Reach out to us through any of these channels. We are here to help!</p>
      </motion.div>

      {/* Contact Cards */}
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
        {contacts.map(c => (
          <motion.a
            key={c.label}
            variants={item}
            href={c.href}
            target={c.label !== 'Gmail' ? '_blank' : undefined}
            rel="noopener noreferrer"
            className="block"
          >
            <div className="glass-card glass-card-hover rounded-2xl p-6 group cursor-pointer transition-all duration-300">
              <div className="flex items-center gap-5">
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${c.gradient} flex items-center justify-center shrink-0`}>
                  <c.icon size={24} style={{ color: c.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-lg" style={{ color: c.color }}>{c.label}</h3>
                  <p className="text-sm text-muted-foreground truncate">{c.desc}</p>
                </div>
                <ExternalLink size={18} className="text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
              </div>
            </div>
          </motion.a>
        ))}
      </motion.div>
    </div>
  );
}