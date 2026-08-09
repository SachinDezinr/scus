'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Home, AlertTriangle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen mesh-bg flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl p-8 max-w-md w-full text-center"
      >
        <div className="w-16 h-16 rounded-2xl bg-coral/15 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle size={32} className="text-coral" />
        </div>
        <h1 className="text-3xl font-extrabold mb-2">404</h1>
        <h2 className="text-lg font-bold mb-2">Page Not Found</h2>
        <p className="text-sm text-muted-foreground mb-6">
          The page you are looking for doesn't exist or has been moved.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity"
        >
          <Home size={16} /> Back to Dashboard
        </Link>
      </motion.div>
    </div>
  );
}