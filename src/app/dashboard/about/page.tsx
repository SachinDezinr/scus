'use client';

import { motion, Variants } from 'framer-motion';
import {
  Info, Search, BookOpen, Building2, Mail,
  Instagram, Shield, Users, Sparkles, Heart, Linkedin
} from 'lucide-react';

const modules = [
  { name: 'Lost & Found', desc: 'Smart matching system to reunite owners with their lost items using weighted scoring on brand, name, color, and location.', icon: Search, color: '#00f5d4' },
  { name: 'Resource Exchange', desc: 'Platform for seniors to share notes, PYQs, and study material with juniors. Filter by course and subject.', icon: BookOpen, color: '#fbbf24' },
  { name: 'Infrastructure Complaints', desc: 'Report broken infrastructure with photo evidence. Admins can track and update repair status in real-time.', icon: Building2, color: '#ff6b6b' },
  { name: 'Role-Based Access', desc: 'Secure authentication with separate admin and user roles. Admins manage all modules and data.', icon: Shield, color: '#a78bfa' },
];

const container: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const item: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 20 } },
};

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Info size={18} className="text-primary" />
          <span className="text-xs font-semibold text-primary uppercase tracking-widest">About</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
          About <span className="gradient-text">Smart Student Utility</span>
        </h1>
      </motion.div>

      {/* Description */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card rounded-2xl p-6 md:p-8 mb-8"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#a78bfa] to-[#00f5d4] flex items-center justify-center">
            <Sparkles size={20} className="text-[#0a0a0f]" />
          </div>
          <div>
            <h2 className="text-lg font-bold">Smart Student Utility System</h2>
            <p className="text-xs text-muted-foreground">Your all-in-one campus companion</p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed mb-4">
          Smart Student Utility System is a comprehensive web platform designed for college and university students. 
          It brings together essential campus utilities under one roof, making student life easier, more organized, and more connected.
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Built with modern web technologies, the system features a secure authentication system, intelligent item matching, 
          resource sharing capabilities, and infrastructure complaint management -- all wrapped in a beautiful, responsive interface 
          that works seamlessly on both desktop and mobile devices.
        </p>
      </motion.div>

      {/* Modules Overview */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mb-8">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Users size={18} className="text-neon" /> Platform Modules
        </h2>
        <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {modules.map(mod => (
            <motion.div key={mod.name} variants={item} className="glass-card rounded-2xl p-5">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: `${mod.color}15` }}>
                <mod.icon size={18} style={{ color: mod.color }} />
              </div>
              <h3 className="font-bold text-sm mb-1" style={{ color: mod.color }}>{mod.name}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{mod.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-card rounded-2xl p-6 text-center"
      >
        <div className="flex items-center justify-center gap-2 mb-3">
          <Heart size={16} className="text-coral" />
          <p className="text-sm font-semibold">Created by <span className="gradient-text font-bold">Sachin Panwar</span></p>
        </div>
        <div className="flex items-center justify-center gap-4">
          <a href="mailto:sachinpanwarpay@gmail.com" className="w-10 h-10 rounded-xl glass-card flex items-center justify-center text-coral hover:bg-coral/10 transition-colors">
            <Mail size={18} />
          </a>
          <a href="https://www.linkedin.com/in/sachin-panwar-dezinr" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-xl glass-card flex items-center justify-center text-[#0a66c2] hover:bg-[#0a66c2]/10 transition-colors">
            <Linkedin size={18} />
          </a>
          <a href="https://www.instagram.com/isachin.panwar?igsh=MXIxeGFxcXR2dThuYw==" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-xl glass-card flex items-center justify-center text-primary hover:bg-primary/10 transition-colors">
            <Instagram size={18} />
          </a>
        </div>
      </motion.div>
    </div>
  );
}