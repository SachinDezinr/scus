'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Building2, CheckCircle2, AlertTriangle, BookOpen, Clock } from 'lucide-react';
import { Complaint } from '../../types/admin';

interface AdminOverviewTabProps {
  complaints: Complaint[];
  activeComplaintsCount: number;
  resolvedCount: number;
  lostItemsCount: number;
  resourcesCount: number;
  onUpdateStatus: (id: string, status: string) => void;
  statusConfig: Record<string, { color: string; bg: string }>;
  priorityConfig: Record<string, { label: string; color: string; bg: string }>;
}

export default function AdminOverviewTab({
  complaints,
  activeComplaintsCount,
  resolvedCount,
  lostItemsCount,
  resourcesCount,
  onUpdateStatus,
  statusConfig,
  priorityConfig,
}: AdminOverviewTabProps) {
  const pendingCount = complaints.filter(c => c.status === 'pending').length;
  const inProgressCount = complaints.filter(c => c.status === 'in progress').length;
  const pendingComplaints = complaints.filter(c => c.status === 'pending').slice(0, 3);

  return (
    <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Active Complaints', value: activeComplaintsCount, color: '#ff6b6b', icon: Building2 },
          { label: 'Resolved Complaints', value: resolvedCount, color: '#00f5d4', icon: CheckCircle2 },
          { label: 'Lost Items', value: lostItemsCount, color: '#ff6b6b', icon: AlertTriangle },
          { label: 'Resources', value: resourcesCount, color: '#fbbf24', icon: BookOpen },
        ].map(stat => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl p-5">
            <div className="w-10 h-10 rounded-xl mb-3 flex items-center justify-center" style={{ background: `${stat.color}18` }}>
              <stat.icon size={18} style={{ color: stat.color }} />
            </div>
            <p className="text-2xl font-extrabold">{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="glass-card rounded-2xl p-6">
        <h3 className="font-bold mb-4 flex items-center gap-2"><Building2 size={16} className="text-coral" /> Complaint Status Breakdown</h3>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Pending', count: pendingCount, ...statusConfig.pending },
            { label: 'In Progress', count: inProgressCount, ...statusConfig['in progress'] },
            { label: 'Resolved', count: resolvedCount, ...statusConfig.resolved },
          ].map(s => (
            <div key={s.label} className="rounded-xl p-4 text-center" style={{ background: s.bg }}>
              <p className="text-2xl font-extrabold" style={{ color: s.color }}>{s.count}</p>
              <p className="text-xs font-semibold mt-1" style={{ color: s.color }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-card rounded-2xl p-6">
        <h3 className="font-bold mb-4 flex items-center gap-2"><Clock size={16} className="text-amber" /> Recent Pending Complaints</h3>
        {pendingComplaints.length === 0 ? (
          <p className="text-sm text-muted-foreground">No pending complaints.</p>
        ) : (
          <div className="space-y-3">
            {pendingComplaints.map(c => {
              const prio = priorityConfig[c.priority || 'medium'] || priorityConfig.medium;
              return (
                <div key={c.id} className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 gap-3 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold">{c.item_name}</p>
                      <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                        style={{ background: prio.bg, color: prio.color }}>
                        {prio.label}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{c.class_name}, {c.department}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => onUpdateStatus(c.id, 'in progress')}
                      className="text-[10px] px-3 py-1.5 rounded-lg font-bold transition-all hover:scale-105"
                      style={{ background: statusConfig['in progress']?.bg, color: statusConfig['in progress']?.color }}>
                      In Progress
                    </button>
                    <button onClick={() => onUpdateStatus(c.id, 'resolved')}
                      className="text-[10px] px-3 py-1.5 rounded-lg font-bold transition-all hover:scale-105"
                      style={{ background: statusConfig.resolved?.bg, color: statusConfig.resolved?.color }}>
                      Resolve
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}