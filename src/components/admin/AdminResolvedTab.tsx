'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, MapPin, Trash2 } from 'lucide-react';
import { Complaint } from '@/types/admin';

interface AdminResolvedTabProps {
  complaints: Complaint[];
  onConfirmDelete: (item: { id: string; type: string; name: string }) => void;
  statusConfig: Record<string, { color: string; bg: string }>;
  priorityConfig: Record<string, { label: string; color: string; bg: string }>;
}

export default function AdminResolvedTab({
  complaints,
  onConfirmDelete,
  statusConfig,
  priorityConfig,
}: AdminResolvedTabProps) {
  return (
    <motion.div key="resolved" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
      <div className="glass-card rounded-xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckCircle2 size={16} className="text-neon" />
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Resolved Complaints</p>
        </div>
        <span className="text-xs text-neon font-bold">{complaints.length} resolved</span>
      </div>

      {complaints.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center">
          <CheckCircle2 size={40} className="mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No resolved complaints yet.</p>
        </div>
      ) : (
        complaints.map(c => {
          const prio = priorityConfig[c.priority || 'medium'] || priorityConfig.medium;
          return (
            <motion.div key={c.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl p-5 border-neon/20">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-bold text-base">{c.item_name}</h3>
                    <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full flex items-center gap-1"
                      style={{ background: statusConfig.resolved?.bg, color: statusConfig.resolved?.color }}>
                      <CheckCircle2 size={10} /> Resolved
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
                      style={{ background: prio.bg, color: prio.color }}>
                      Priority: {prio.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                    <span className="flex items-center gap-1"><MapPin size={12} />{c.class_name}, {c.department}, {c.floor}</span>
                    <span>{new Date(c.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>
                  <p className="text-sm mt-3 text-muted-foreground">{c.description}</p>
                </div>
                <button onClick={() => onConfirmDelete({ id: c.id, type: 'complaint', name: c.item_name })}
                  className="p-2 rounded-lg bg-coral/10 text-coral hover:bg-coral/20 transition-colors">
                  <Trash2 size={16} />
                </button>
              </div>
            </motion.div>
          );
        })
      )}
    </motion.div>
  );
}