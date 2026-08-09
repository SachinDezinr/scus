'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2 } from 'lucide-react';

interface AdminDeleteModalProps {
  confirmDelete: { id: string; type: string; name: string } | null;
  onClose: () => void;
  onConfirm: () => void;
}

export default function AdminDeleteModal({ confirmDelete, onClose, onConfirm }: AdminDeleteModalProps) {
  return (
    <AnimatePresence>
      {confirmDelete && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.9 }}
            className="glass-card rounded-2xl p-6 max-w-sm w-full"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-coral/15 flex items-center justify-center">
                <Trash2 size={18} className="text-coral" />
              </div>
              <div>
                <h3 className="font-bold">Confirm Delete</h3>
                <p className="text-xs text-muted-foreground">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-5">
              Delete <span className="text-foreground font-semibold">"{confirmDelete.name}"</span>?
            </p>
            <div className="flex gap-3">
              <button onClick={onClose} className="flex-1 py-2.5 rounded-xl glass-card text-sm font-semibold hover:border-border/80 transition-colors">
                Cancel
              </button>
              <button onClick={onConfirm} className="flex-1 py-2.5 rounded-xl bg-coral text-white text-sm font-semibold hover:bg-coral/90 transition-colors">
                Delete
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}