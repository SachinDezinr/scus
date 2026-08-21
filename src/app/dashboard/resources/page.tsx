'use client';

import { useAuth } from '@/lib/auth-context';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  BookOpen, Upload, Download, Filter, FileText, User,
  Lightbulb, Sparkles, Search, Pencil, Trash2, Save, X
} from 'lucide-react';

interface Resource {
  id: string;
  uploader_name: string;
  course_name: string;
  subject_name: string;
  file_url: string;
  file_name: string;
  tips?: string;
  user_id: string;
  created_at: string;
}

export default function ResourcesPage() {
  const { user, authFetch } = useAuth();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [courseFilter, setCourseFilter] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [editResource, setEditResource] = useState<Resource | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; name: string } | null>(null);

  const fetchResources = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (courseFilter) params.set('course', courseFilter);
      if (subjectFilter) params.set('subject', subjectFilter);
      const res = await authFetch(`/api/resources?${params}`);
      const data = await res.json();
      setResources(data.resources || []);
    } catch { /* ignore */ }
    setLoading(false);
  }, [authFetch, courseFilter, subjectFilter]);

  useEffect(() => { fetchResources(); }, [fetchResources]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    const form = e.currentTarget;
    const fd = new FormData(form);
    const file = fd.get('file') as File;
    if (file && file.size > 5 * 1024 * 1024) {
      toast.error('File must be under 5MB');
      setSubmitting(false);
      return;
    }
    try {
      const res = await authFetch('/api/resources', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); setSubmitting(false); return; }
      toast.success('Resource uploaded!');
      form.reset();
      setShowUpload(false);
      fetchResources();
    } catch { toast.error('Something went wrong'); }
    setSubmitting(false);
  };

  const handleEditSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editResource) return;
    setEditSaving(true);
    const form = e.currentTarget;
    const fd = new FormData(form);
    const payload: Record<string, string> = { id: editResource.id };
    fd.forEach((val, key) => { payload[key] = val as string; });
    try {
      const res = await authFetch('/api/resources', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        toast.success('Resource updated!');
        setEditResource(null);
        fetchResources();
      } else {
        const d = await res.json();
        toast.error(d.error || 'Failed to update');
      }
    } catch { toast.error('Something went wrong'); }
    setEditSaving(false);
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    const res = await authFetch(`/api/resources?id=${confirmDelete.id}`, { method: 'DELETE' });
    if (res.ok) {
      toast.success('Resource deleted');
      setConfirmDelete(null);
      fetchResources();
    } else toast.error('Failed to delete');
  };

  const isOwner = (res: Resource) => user?.id === res.user_id || user?.role === 'admin';

  const inputCls = "w-full px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-[#14161f] border border-border text-xs sm:text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary transition-colors text-foreground";
  const labelCls = "block text-[11px] font-semibold text-muted-foreground mb-1 uppercase tracking-wider";

  const courses = [...new Set(resources.map(r => r.course_name))];
  const subjects = [...new Set(resources.map(r => r.subject_name))];

  return (
    <div className="max-w-6xl mx-auto w-full space-y-5">
      {/* Confirm Delete Modal */}
      <AnimatePresence>
        {confirmDelete && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs"
            onClick={() => setConfirmDelete(null)}>
            <motion.div initial={{ scale: 0.92 }} animate={{ scale: 1 }} exit={{ scale: 0.92 }}
              className="glass-card rounded-2xl p-5 sm:p-6 max-w-sm w-full" onClick={e => e.stopPropagation()}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-coral/15 flex items-center justify-center shrink-0">
                  <Trash2 size={18} className="text-coral" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-white">Delete Resource?</h3>
                  <p className="text-xs text-muted-foreground">This cannot be undone</p>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground mb-5">
                Delete <span className="text-foreground font-semibold">"{confirmDelete.name}"</span>?
              </p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2.5 rounded-xl glass-card text-xs sm:text-sm font-semibold hover:border-border/80">Cancel</button>
                <button onClick={handleDelete} className="flex-1 py-2.5 rounded-xl bg-coral text-white text-xs sm:text-sm font-semibold hover:bg-coral/90">Delete</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {editResource && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs overflow-y-auto"
            onClick={() => setEditResource(null)}>
            <motion.div initial={{ scale: 0.95, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 16 }}
              className="glass-card rounded-2xl p-4 sm:p-6 w-full max-w-lg my-auto max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-base sm:text-lg flex items-center gap-2 text-white">
                  <Pencil size={17} className="text-amber" /> Edit Resource
                </h3>
                <button onClick={() => setEditResource(null)} className="p-1.5 rounded-lg glass-card text-muted-foreground hover:text-foreground">
                  <X size={17} />
                </button>
              </div>
              <form onSubmit={handleEditSave} className="space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Your Name *</label>
                    <input name="uploader_name" required defaultValue={editResource.uploader_name} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Course Name *</label>
                    <input name="course_name" required defaultValue={editResource.course_name} className={inputCls} />
                  </div>
                  <div className="sm:col-span-2">
                    <label className={labelCls}>Subject Name *</label>
                    <input name="subject_name" required defaultValue={editResource.subject_name} className={inputCls} />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Tips for Juniors</label>
                  <textarea name="tips" rows={2} defaultValue={editResource.tips || ''} className={inputCls} placeholder="Any advice? (optional)" />
                </div>
                <p className="text-[11px] text-muted-foreground">Note: File cannot be changed via edit. Upload a new resource to replace.</p>
                <button type="submit" disabled={editSaving}
                  className="w-full py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-amber to-[#f59e0b] text-[#0a0a0f] font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 disabled:opacity-50">
                  {editSaving ? <div className="w-4 h-4 border-2 border-[#0a0a0f] border-t-transparent rounded-full animate-spin" /> : <><Save size={16} /> Save Changes</>}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-2 mb-1">
          <BookOpen size={16} className="text-amber" />
          <span className="text-[11px] font-semibold text-amber uppercase tracking-widest">Resources</span>
        </div>
        <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-white">
          Resource <span className="gradient-text">Exchange</span>
        </h1>
        <p className="text-muted-foreground mt-0.5 text-xs sm:text-sm">Share and download verified notes, PYQs, and semester study guides.</p>
      </motion.div>

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={() => setShowUpload(!showUpload)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
            showUpload ? 'bg-amber text-[#0a0a0f]' : 'glass-card text-amber hover:border-amber/30'
          }`}
        >
          <Upload size={14} />
          {showUpload ? 'Close Upload' : 'Upload Resource'}
        </button>
      </div>

      {/* Upload Form */}
      {showUpload && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="overflow-hidden">
          <div className="glass-card rounded-2xl p-4 sm:p-6 max-w-2xl border-amber/30">
            <h2 className="text-sm sm:text-base font-bold mb-4 flex items-center gap-2 text-white">
              <Upload size={16} className="text-amber" /> Upload Study Material
            </h2>
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div><label className={labelCls}>Your Name *</label><input name="uploader_name" required className={inputCls} placeholder="e.g. Sachin Panwar" /></div>
                <div><label className={labelCls}>Course Name *</label><input name="course_name" required className={inputCls} placeholder="e.g. B.Tech CSE" /></div>
                <div><label className={labelCls}>Subject Name *</label><input name="subject_name" required className={inputCls} placeholder="e.g. Data Structures" /></div>
                <div><label className={labelCls}>PDF File * (Max 5MB)</label><input type="file" name="file" accept=".pdf" required className={inputCls} /></div>
              </div>
              <div><label className={labelCls}>Tips for Juniors</label><textarea name="tips" rows={2} className={inputCls} placeholder="Any advice for studying this subject? (optional)" /></div>
              <button type="submit" disabled={submitting} className="w-full py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-amber to-[#f59e0b] text-[#0a0a0f] font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 disabled:opacity-50">
                {submitting ? <div className="w-4 h-4 border-2 border-[#0a0a0f] border-t-transparent rounded-full animate-spin" /> : <><Upload size={16} /> Upload Resource</>}
              </button>
            </form>
          </div>
        </motion.div>
      )}

      {/* Filters (Clean spacing with no overlap on laptops & smaller screens) */}
      <div className="glass-card rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter size={14} className="text-primary" />
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Search & Filters</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* Course filter */}
          <div className="relative flex items-center">
            <div className="absolute left-3.5 pointer-events-none text-muted-foreground flex items-center">
              <Search size={15} />
            </div>
            <select
              value={courseFilter}
              onChange={e => setCourseFilter(e.target.value)}
              className={`${inputCls} pl-10.5 pr-8 appearance-none cursor-pointer`}
            >
              <option value="">All Courses</option>
              {courses.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Subject filter */}
          <div className="relative flex items-center">
            <div className="absolute left-3.5 pointer-events-none text-muted-foreground flex items-center">
              <Search size={15} />
            </div>
            <select
              value={subjectFilter}
              onChange={e => setSubjectFilter(e.target.value)}
              className={`${inputCls} pl-10.5 pr-8 appearance-none cursor-pointer`}
            >
              <option value="">All Subjects</option>
              {subjects.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Clear button */}
          {(courseFilter || subjectFilter) && (
            <div className="flex items-center sm:col-span-2 lg:col-span-1">
              <button
                onClick={() => { setCourseFilter(''); setSubjectFilter(''); }}
                className="text-xs font-semibold text-coral hover:text-coral/80 transition-colors py-2 px-1"
              >
                ✕ Clear all filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Resources Grid */}
      {loading ? (
        <div className="flex justify-center py-16"><div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : resources.length === 0 ? (
        <div className="glass-card rounded-2xl p-8 sm:p-12 text-center">
          <BookOpen size={36} className="mx-auto text-muted-foreground mb-3" />
          <p className="text-xs sm:text-sm text-muted-foreground">No resources found. Be the first to upload!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {resources.map(res => (
            <motion.div key={res.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card glass-card-hover rounded-2xl p-4 sm:p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between mb-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber/15 flex items-center justify-center shrink-0">
                    <FileText size={17} className="text-amber" />
                  </div>
                  {isOwner(res) && (
                    <div className="flex items-center gap-1">
                      <button onClick={() => setEditResource(res)}
                        className="p-1.5 rounded-lg glass-card text-muted-foreground hover:text-amber transition-colors">
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => setConfirmDelete({ id: res.id, name: res.subject_name })}
                        className="p-1.5 rounded-lg glass-card text-muted-foreground hover:text-coral transition-colors">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  )}
                </div>
                <h3 className="font-bold text-sm sm:text-base text-white mb-0.5 truncate">{res.subject_name}</h3>
                <p className="text-xs text-muted-foreground mb-2.5 truncate">{res.course_name}</p>
                <div className="space-y-1.5 text-xs text-muted-foreground mb-3">
                  <div className="flex items-center gap-2"><User size={13} className="text-primary shrink-0" /><span className="truncate">By {res.uploader_name}</span></div>
                  <div className="flex items-center gap-2"><FileText size={13} className="text-primary shrink-0" /><span className="truncate">{res.file_name}</span></div>
                  {res.tips && (
                    <div className="flex items-start gap-1.5 p-2 rounded-lg bg-amber/5 border border-amber/10 text-[11px]">
                      <Lightbulb size={13} className="text-amber mt-0.5 shrink-0" />
                      <span className="line-clamp-2">{res.tips}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground/60"><Sparkles size={12} className="shrink-0" /><span>{new Date(res.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span></div>
                </div>
              </div>
              <a
                href={res.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-amber/10 text-amber text-xs font-semibold hover:bg-amber/20 transition-colors mt-3"
              >
                <Download size={13} /> Download PDF
              </a>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}