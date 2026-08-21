'use client';

import { useAuth } from '@/lib/auth-context';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Building2, Plus, Camera, Clock, CheckCircle2,
  AlertCircle, Loader2, MapPin, FileText, Sparkles,
  Pencil, Trash2, Save, X, ChevronUp, Eye,
  Users, UserCheck, ShieldAlert
} from 'lucide-react';

interface Complaint {
  id: string;
  item_name: string;
  class_name: string;
  department: string;
  floor: string;
  description: string;
  photo_url?: string;
  status: string;
  priority?: string;
  user_id: string;
  created_at: string;
}

const STATUS = {
  pending: { color: '#fbbf24', bg: 'rgba(251,191,36,0.12)', icon: Clock },
  'in progress': { color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', icon: Loader2 },
  resolved: { color: '#00f5d4', bg: 'rgba(0,245,212,0.12)', icon: CheckCircle2 },
} as const;

const PRIORITY = {
  urgent: { label: 'Urgent', color: '#ef4444', bg: 'rgba(239,68,68,0.15)' },
  high: { label: 'High', color: '#ff6b6b', bg: 'rgba(255,107,107,0.15)' },
  medium: { label: 'Medium', color: '#fbbf24', bg: 'rgba(251,191,36,0.15)' },
  low: { label: 'Low', color: '#00f5d4', bg: 'rgba(0,245,212,0.15)' },
} as const;

type ViewTab = 'all' | 'mine' | 'resolved';

export default function ComplaintsPage() {
  const { user, authFetch } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [viewTab, setViewTab] = useState<ViewTab>('all');
  const [editComplaint, setEditComplaint] = useState<Complaint | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; name: string } | null>(null);

  const fetchComplaints = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/complaints');
      const data = await res.json();
      setComplaints(data.complaints || []);
    } catch { /* ignore */ }
    setLoading(false);
  }, [authFetch]);

  useEffect(() => { fetchComplaints(); }, [fetchComplaints]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    const form = e.currentTarget;
    try {
      const res = await authFetch('/api/complaints', { method: 'POST', body: new FormData(form) });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); setSubmitting(false); return; }
      toast.success('Complaint submitted!');
      form.reset();
      setShowForm(false);
      setViewTab('mine');
      fetchComplaints();
    } catch { toast.error('Something went wrong'); }
    setSubmitting(false);
  };

  const updateStatus = async (id: string, status: string) => {
    const res = await authFetch('/api/complaints', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    });
    if (res.ok) { 
      toast.success(status === 'resolved' ? 'Complaint resolved!' : 'Status updated!'); 
      fetchComplaints(); 
    }
    else toast.error('Failed to update');
  };

  const handleEditSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editComplaint) return;
    setEditSaving(true);
    const fd = new FormData(e.currentTarget);
    const payload: Record<string, string> = { id: editComplaint.id };
    fd.forEach((v, k) => { if (v) payload[k] = v as string; });
    const res = await authFetch('/api/complaints', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) { toast.success('Updated!'); setEditComplaint(null); fetchComplaints(); }
    else { const d = await res.json(); toast.error(d.error || 'Failed'); }
    setEditSaving(false);
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    const res = await authFetch(`/api/complaints?id=${confirmDelete.id}`, { method: 'DELETE' });
    if (res.ok) { toast.success('Deleted'); setConfirmDelete(null); fetchComplaints(); }
    else toast.error('Failed to delete');
  };

  const isOwner = (c: Complaint) => user?.id === c.user_id;
  const isAdmin = user?.role === 'admin';

  const activeComplaints = complaints.filter(c => c.status !== 'resolved');
  const resolvedComplaints = complaints.filter(c => c.status === 'resolved');

  const displayed = (() => {
    if (viewTab === 'mine') return complaints.filter(c => c.user_id === user?.id && c.status !== 'resolved');
    if (viewTab === 'resolved') return resolvedComplaints;
    return activeComplaints;
  })();

  const inp = "w-full px-3.5 md:px-4 py-2.5 md:py-3 rounded-xl bg-secondary/50 border border-border text-xs md:text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary transition-colors";
  const lbl = "block text-[11px] font-semibold text-muted-foreground mb-1 uppercase tracking-wider";

  return (
    <div className="max-w-5xl mx-auto w-full">

      {/* ── Confirm Delete Modal ── */}
      <AnimatePresence>
        {confirmDelete && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs"
            onClick={() => setConfirmDelete(null)}>
            <motion.div initial={{ scale: 0.92 }} animate={{ scale: 1 }} exit={{ scale: 0.92 }}
              className="glass-card rounded-2xl p-5 md:p-6 max-w-sm w-full" onClick={e => e.stopPropagation()}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-coral/15 flex items-center justify-center shrink-0">
                  <Trash2 size={18} className="text-coral" />
                </div>
                <div>
                  <h3 className="font-bold text-sm md:text-base text-white">Delete Complaint?</h3>
                  <p className="text-xs text-muted-foreground">This action cannot be undone</p>
                </div>
              </div>
              <p className="text-xs md:text-sm text-muted-foreground mb-5">
                Delete <span className="text-foreground font-semibold">"{confirmDelete.name}"</span>?
              </p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2.5 rounded-xl glass-card text-xs font-semibold">Cancel</button>
                <button onClick={handleDelete} className="flex-1 py-2.5 rounded-xl bg-coral text-white text-xs font-semibold">Delete</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Edit Modal ── */}
      <AnimatePresence>
        {editComplaint && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-4 bg-black/70 backdrop-blur-xs overflow-y-auto"
            onClick={() => setEditComplaint(null)}>
            <motion.div initial={{ scale: 0.95, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 16 }}
              className="glass-card rounded-2xl p-4 md:p-6 w-full max-w-lg my-auto max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-base md:text-lg flex items-center gap-2 text-white">
                  <Pencil size={17} className="text-coral" /> Edit Complaint
                </h3>
                <button onClick={() => setEditComplaint(null)} className="p-1.5 rounded-lg glass-card text-muted-foreground hover:text-foreground">
                  <X size={16} />
                </button>
              </div>
              <form onSubmit={handleEditSave} className="space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div><label className={lbl}>Item / Equipment *</label><input name="item_name" required defaultValue={editComplaint.item_name} className={inp} /></div>
                  <div><label className={lbl}>Class / Room *</label><input name="class_name" required defaultValue={editComplaint.class_name} className={inp} /></div>
                  <div><label className={lbl}>Department *</label><input name="department" required defaultValue={editComplaint.department} className={inp} /></div>
                  <div><label className={lbl}>Floor *</label><input name="floor" required defaultValue={editComplaint.floor} className={inp} /></div>
                  <div className="sm:col-span-2">
                    <label className={lbl}>Priority Level</label>
                    <select name="priority" defaultValue={editComplaint.priority || 'medium'} className={inp}>
                      <option value="low">Low Priority</option>
                      <option value="medium">Medium Priority</option>
                      <option value="high">High Priority</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>
                <div><label className={lbl}>Description *</label><textarea name="description" required rows={3} defaultValue={editComplaint.description} className={inp} /></div>
                <button type="submit" disabled={editSaving}
                  className="w-full py-2.5 md:py-3 rounded-xl bg-gradient-to-r from-coral to-[#ff8f6b] text-white font-semibold text-xs md:text-sm flex items-center justify-center gap-2 disabled:opacity-50">
                  {editSaving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Save size={15} /> Save Changes</>}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Header ── */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-5 md:mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Building2 size={16} className="text-coral" />
          <span className="text-[11px] font-semibold text-coral uppercase tracking-widest">Infrastructure</span>
        </div>
        <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-white">
          Infrastructure <span className="gradient-text">Complaints</span>
        </h1>
        <p className="text-muted-foreground mt-0.5 text-xs md:text-sm">Report broken infrastructure, assign priority, and track repair status.</p>
      </motion.div>

      {/* ── Top controls bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-1 glass-card rounded-xl p-1 overflow-x-auto max-w-full">
          <button onClick={() => setViewTab('all')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${viewTab === 'all' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
            <Users size={12} /> Active
            <span className="ml-1 px-1.5 py-0.2 rounded-full bg-white/10 text-[10px]">{activeComplaints.length}</span>
          </button>
          <button onClick={() => setViewTab('mine')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${viewTab === 'mine' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
            <UserCheck size={12} /> Mine
            <span className="ml-1 px-1.5 py-0.2 rounded-full bg-white/10 text-[10px]">{complaints.filter(c => c.user_id === user?.id && c.status !== 'resolved').length}</span>
          </button>
          <button onClick={() => setViewTab('resolved')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${viewTab === 'resolved' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
            <CheckCircle2 size={12} /> Resolved
            <span className="ml-1 px-1.5 py-0.2 rounded-full bg-white/10 text-[10px]">{resolvedComplaints.length}</span>
          </button>
        </div>

        <button onClick={() => setShowForm(v => !v)}
          className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 ${showForm ? 'bg-coral text-white' : 'glass-card text-coral hover:border-coral/30'}`}>
          <Plus size={14} /> New Complaint
        </button>
      </div>

      {/* ── Submit Form ── */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-6 overflow-hidden">
            <div className="glass-card rounded-2xl p-4 md:p-6 max-w-2xl">
              <h2 className="text-sm md:text-base font-bold mb-4 flex items-center gap-2 text-white">
                <AlertCircle size={16} className="text-coral" /> File New Complaint
              </h2>
              <form onSubmit={handleSubmit} className="space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div><label className={lbl}>Item / Equipment *</label><input name="item_name" required className={inp} placeholder="e.g. Projector" /></div>
                  <div><label className={lbl}>Class / Room *</label><input name="class_name" required className={inp} placeholder="e.g. Room 301" /></div>
                  <div><label className={lbl}>Department *</label><input name="department" required className={inp} placeholder="e.g. Computer Science" /></div>
                  <div><label className={lbl}>Floor *</label><input name="floor" required className={inp} placeholder="e.g. 3rd Floor" /></div>
                  <div className="sm:col-span-2">
                    <label className={lbl}>Priority Level *</label>
                    <select name="priority" defaultValue="medium" className={inp}>
                      <option value="low">Low Priority (Minor issue)</option>
                      <option value="medium">Medium Priority (Standard issue)</option>
                      <option value="high">High Priority (Urgent repair required)</option>
                      <option value="urgent">Urgent Priority (Safety hazard / Critical)</option>
                    </select>
                  </div>
                </div>
                <div><label className={lbl}>Description *</label><textarea name="description" required rows={3} className={inp} placeholder="Describe the issue in detail..." /></div>
                <div>
                  <label className={lbl}>Photo (optional)</label>
                  <div className="flex items-center gap-2">
                    <Camera size={14} className="text-muted-foreground shrink-0" />
                    <input type="file" name="photo" accept="image/jpeg,image/png" className={inp} />
                  </div>
                </div>
                <button type="submit" disabled={submitting}
                  className="w-full py-2.5 md:py-3 rounded-xl bg-gradient-to-r from-coral to-[#ff8f6b] text-white font-semibold text-xs md:text-sm flex items-center justify-center gap-2 disabled:opacity-50">
                  {submitting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Plus size={15} /> Submit Complaint</>}
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── List ── */}
      {loading ? (
        <div className="flex justify-center py-16"><div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : displayed.length === 0 ? (
        <div className="glass-card rounded-2xl p-8 md:p-12 text-center">
          <Building2 size={36} className="mx-auto text-muted-foreground mb-3" />
          <p className="text-xs md:text-sm text-muted-foreground">
            {viewTab === 'mine' ? "You haven't filed any active complaints." : viewTab === 'resolved' ? "No resolved complaints." : "No active complaints."}
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {displayed.map(c => {
            const st = STATUS[c.status as keyof typeof STATUS] || STATUS.pending;
            const prio = PRIORITY[c.priority as keyof typeof PRIORITY] || PRIORITY.medium;
            const expanded = expandedId === c.id;
            return (
              <motion.div key={c.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className={`glass-card glass-card-hover rounded-2xl overflow-hidden transition-all duration-200 ${c.status === 'resolved' ? 'border-neon/20' : ''}`}>
                <div className="flex flex-col md:flex-row">
                  {c.photo_url && !expanded && (
                    <div className="w-full md:w-44 h-40 md:h-auto overflow-hidden shrink-0">
                      <img src={c.photo_url} alt={c.item_name} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="flex-1 p-4 md:p-5">
                    <div className="flex items-start justify-between gap-2 flex-wrap mb-2.5">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-sm md:text-base text-white truncate">{c.item_name}</h3>
                          <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1"
                            style={{ background: st.bg, color: st.color }}>
                            <st.icon size={10} /> {c.status}
                          </span>
                          <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1"
                            style={{ background: prio.bg, color: prio.color }}>
                            <ShieldAlert size={10} /> {prio.label}
                          </span>
                          {viewTab === 'all' && isOwner(c) && (
                            <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/15 text-primary">Yours</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => setExpandedId(expanded ? null : c.id)}
                          title={expanded ? 'Collapse' : 'View details'}
                          className="p-1.5 rounded-lg glass-card text-muted-foreground hover:text-primary transition-colors">
                          {expanded ? <ChevronUp size={14} /> : <Eye size={14} />}
                        </button>
                        {isOwner(c) && (
                          <>
                            <button onClick={() => setEditComplaint(c)}
                              className="p-1.5 rounded-lg glass-card text-muted-foreground hover:text-primary transition-colors">
                              <Pencil size={14} />
                            </button>
                            <button onClick={() => setConfirmDelete({ id: c.id, name: c.item_name })}
                              className="p-1.5 rounded-lg glass-card text-muted-foreground hover:text-coral transition-colors">
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1 text-xs md:text-sm text-muted-foreground mb-3">
                      <div className="flex items-center gap-2"><MapPin size={13} className="text-primary shrink-0" /><span className="truncate">{c.class_name} · {c.department} · {c.floor}</span></div>
                      <div className="flex items-start gap-2"><FileText size={13} className="text-primary shrink-0 mt-0.5" /><span className="line-clamp-2">{c.description}</span></div>
                      <div className="flex items-center gap-2"><Sparkles size={13} className="text-primary shrink-0" /><span className="text-[11px]">{new Date(c.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span></div>
                    </div>

                    {isAdmin && (
                      <div className="flex items-center gap-1.5 pt-3 border-t border-border flex-wrap">
                        <span className="text-[11px] text-muted-foreground">Update:</span>
                        <button onClick={() => updateStatus(c.id, 'pending')} disabled={c.status === 'pending'}
                          className="text-[9px] md:text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                          style={{ background: STATUS.pending.bg, color: STATUS.pending.color }}>
                          Pending
                        </button>
                        <button onClick={() => updateStatus(c.id, 'in progress')} disabled={c.status === 'in progress'}
                          className="text-[9px] md:text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                          style={{ background: STATUS['in progress'].bg, color: STATUS['in progress'].color }}>
                          In Progress
                        </button>
                        <button onClick={() => updateStatus(c.id, 'resolved')} disabled={c.status === 'resolved'}
                          className="text-[9px] md:text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                          style={{ background: STATUS.resolved.bg, color: STATUS.resolved.color }}>
                          Resolve
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* ── Expanded Detail Panel ── */}
                <AnimatePresence>
                  {expanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      className="border-t border-border overflow-hidden">
                      <div className="p-4 md:p-5">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-1.5">
                          <Eye size={11} /> Full Details
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2.5">
                            <div className="grid grid-cols-2 gap-2.5">
                              {[
                                { label: 'Equipment', value: c.item_name },
                                { label: 'Priority', value: prio.label },
                                { label: 'Class / Room', value: c.class_name },
                                { label: 'Department', value: c.department },
                              ].map(f => (
                                <div key={f.label} className="rounded-xl p-2.5 bg-secondary/40">
                                  <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-0.5">{f.label}</p>
                                  <p className="text-xs md:text-sm font-semibold truncate">{f.value}</p>
                                </div>
                              ))}
                            </div>
                            <div className="rounded-xl p-2.5 bg-secondary/40">
                              <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Description</p>
                              <p className="text-xs md:text-sm leading-relaxed">{c.description}</p>
                            </div>
                          </div>

                          {c.photo_url && (
                            <div>
                              <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Photo Evidence</p>
                              <img src={c.photo_url} alt={c.item_name} className="w-full h-44 md:h-48 object-cover rounded-xl" />
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}