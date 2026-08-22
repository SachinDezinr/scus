'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, Building2, MapPin, ChevronUp, ChevronDown, Trash2 } from 'lucide-react';
import { Complaint } from '../../types/admin';

interface AdminComplaintsTabProps {
  complaints: Complaint[];
  onUpdateStatus: (id: string, status: string) => void;
  onConfirmDelete: (item: { id: string; type: string; name: string }) => void;
  statusConfig: Record<string, { color: string; bg: string; icon: React.ElementType }>;
  priorityConfig: Record<string, { label: string; color: string; bg: string }>;
}

export default function AdminComplaintsTab({
  complaints,
  onUpdateStatus,
  onConfirmDelete,
  statusConfig,
  priorityConfig,
}: AdminComplaintsTabProps) {
  const [statusFilter, setStatusFilter] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredComplaints = statusFilter ? complaints.filter(c => c.status === statusFilter) : complaints;

  return (
    <motion.div key="complaints" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
      <div className="glass-card rounded-xl p-3 sm:p-4 flex items-center gap-2.5 sm:gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold uppercase tracking-wider">
          <Filter size={14} />
          <span>Status:</span>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {['', 'pending', 'in progress'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`text-[10px] font-bold uppercase tracking-wide px-3 py-1.5 rounded-lg transition-colors ${statusFilter === s ? 'bg-primary text-primary-foreground' : 'glass-card text-muted-foreground hover:text-foreground'}`}>
              {s || 'All Active'}
            </button>
          ))}
        </div>
        <span className="sm:ml-auto text-xs text-muted-foreground">{filteredComplaints.length} active complaints</span>
      </div>

      {filteredComplaints.length === 0 ? (
        <div className="glass-card rounded-2xl p-8 sm:p-12 text-center">
          <Building2 size={40} className="mx-auto text-muted-foreground mb-3" />
          <p className="text-xs sm:text-sm text-muted-foreground">No active complaints found.</p>
        </div>
      ) : (
        filteredComplaints.map(c => {
          const st = statusConfig[c.status] || statusConfig.pending;
          const prio = priorityConfig[c.priority || 'medium'] || priorityConfig.medium;
          const isExpanded = expandedId === c.id;
          return (
            <motion.div key={c.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl overflow-hidden">
              <div className="p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <h3 className="font-bold text-sm sm:text-base text-white">{c.item_name}</h3>
                      <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full flex items-center gap-1"
                        style={{ background: st.bg, color: st.color }}>
                        <st.icon size={10} /> {c.status}
                      </span>
                      <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
                        style={{ background: prio.bg, color: prio.color }}>
                        Priority: {prio.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1"><MapPin size={12} />{c.class_name}, {c.department}, {c.floor}</span>
                      <span>{new Date(c.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => setExpandedId(isExpanded ? null : c.id)}
                      className="p-2 rounded-lg glass-card text-muted-foreground hover:text-foreground transition-colors"
                      title={isExpanded ? "Collapse" : "Expand"}>
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                    <button onClick={() => onConfirmDelete({ id: c.id, type: 'complaint', name: c.item_name })}
                      className="p-2 rounded-lg bg-coral/10 text-coral hover:bg-coral/20 transition-colors"
                      title="Delete">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="flex gap-2 mt-3.5 flex-wrap items-center pt-3 border-t border-border/50">
                  <span className="text-xs text-muted-foreground">Update:</span>
                  <button onClick={() => onUpdateStatus(c.id, 'pending')}
                    disabled={c.status === 'pending'}
                    className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wide px-2.5 sm:px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ background: statusConfig.pending.bg, color: statusConfig.pending.color }}>
                    Pending
                  </button>
                  <button onClick={() => onUpdateStatus(c.id, 'in progress')}
                    disabled={c.status === 'in progress'}
                    className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wide px-2.5 sm:px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ background: statusConfig['in progress'].bg, color: statusConfig['in progress'].color }}>
                    In Progress
                  </button>
                  <button onClick={() => onUpdateStatus(c.id, 'resolved')}
                    className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wide px-2.5 sm:px-3 py-1.5 rounded-lg transition-colors"
                    style={{ background: statusConfig.resolved.bg, color: statusConfig.resolved.color }}>
                    Resolve
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                    className="border-t border-border overflow-hidden">
                    <div className="p-4 sm:p-5 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <div className="rounded-xl p-3 bg-secondary/30">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Description</p>
                            <p className="text-xs sm:text-sm leading-relaxed">{c.description}</p>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="rounded-xl p-3 bg-secondary/30">
                              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Class / Room</p>
                              <p className="text-xs sm:text-sm font-semibold truncate">{c.class_name}</p>
                            </div>
                            <div className="rounded-xl p-3 bg-secondary/30">
                              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Floor</p>
                              <p className="text-xs sm:text-sm font-semibold truncate">{c.floor}</p>
                            </div>
                            <div className="rounded-xl p-3 bg-secondary/30 col-span-2">
                              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Department</p>
                              <p className="text-xs sm:text-sm font-semibold truncate">{c.department}</p>
                            </div>
                          </div>
                        </div>
                        {c.photo_url && (
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Photo Evidence</p>
                            <img src={c.photo_url} alt={c.item_name} className="w-full h-44 sm:h-48 object-cover rounded-xl" />
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })
      )}
    </motion.div>
  );
}