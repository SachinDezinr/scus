'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Shield } from 'lucide-react';

export default function AdminHeader() {
  return (
    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
      <div className="flex items-center gap-2 mb-2">
        <Shield size={18} className="text-coral" />
        <span className="text-xs font-semibold text-coral uppercase tracking-widest">Admin Control Panel</span>
      </div>
      <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
        Admin <span className="gradient-text">Dashboard</span>
      </h1>
      <p className="text-muted-foreground mt-1 text-sm">Manage all system data — complaints, lost & found, and resources.</p>
    </motion.div>
  );
}