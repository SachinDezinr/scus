'use client';

import { useAuth } from '@/lib/auth-context';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Search, Plus, Eye, Package, MapPin, Phone, User,
  Tag, MessageSquare, Sparkles, X, Clock, CheckCircle2,
  AlertTriangle, Pencil, Trash2, Save, Users, UserCheck
} from 'lucide-react';

type MainTab = 'report-lost' | 'report-found' | 'view';
type ViewTab = 'all' | 'mine' | 'lost' | 'found' | 'matched';

interface Item {
  id: string;
  item_name: string;
  color: string;
  brand?: string;
  location?: string;
  remark?: string;
  owner_name?: string;
  finder_name?: string;
  phone: string;
  image_url?: string;
  user_id: string;
  created_at: string;
}

interface MatchedItem {
  id: string;
  match_score: number;
  lost_item_data: Item;
  found_item_data: Item;
  expires_at: string;
  created_at: string;
}

export default function LostFoundPage() {
  const { user, authFetch } = useAuth();
  const [mainTab, setMainTab] = useState<MainTab>('view');
  const [viewTab, setViewTab] = useState<ViewTab>('all');
  const [lostItems, setLostItems] = useState<Item[]>([]);
  const [foundItems, setFoundItems] = useState<Item[]>([]);
  const [matches, setMatches] = useState<MatchedItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [matchResult, setMatchResult] = useState<{ item: Item; score: number; type: string } | null>(null);
  const [editItem, setEditItem] = useState<{ item: Item; type: 'lost' | 'found' } | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; type: 'lost' | 'found'; name: string } | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [lR, fR, mR] = await Promise.all([
        authFetch('/api/lost-found/lost'),
        authFetch('/api/lost-found/found'),
        authFetch('/api/lost-found/matches'),
      ]);
      const [lD, fD, mD] = await Promise.all([lR.json(), fR.json(), mR.json()]);
      setLostItems(lD.items || []);
      setFoundItems(fD.items || []);
      setMatches(mD.matches || []);
    } catch { /* ignore */ }
    setLoading(false);
  }, [authFetch]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleLostSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    const form = e.currentTarget;
    try {
      const res = await authFetch('/api/lost-found/lost', { method: 'POST', body: new FormData(form) });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); setSubmitting(false); return; }
      toast.success('Lost item reported!');
      form.reset();
      if (data.match) setMatchResult({ item: data.match.found, score: data.match.score, type: 'found' });
      setMainTab('view'); setViewTab('mine');
      fetchAll();
    } catch { toast.error('Something went wrong'); }
    setSubmitting(false);
  };

  const handleFoundSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    const form = e.currentTarget;
    try {
      const res = await authFetch('/api/lost-found/found', { method: 'POST', body: new FormData(form) });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); setSubmitting(false); return; }
      toast.success('Found item reported!');
      form.reset();
      if (data.match) setMatchResult({ item: data.match.lost, score: data.match.score, type: 'lost' });
      setMainTab('view'); setViewTab('mine');
      fetchAll();
    } catch { toast.error('Something went wrong'); }
    setSubmitting(false);
  };

  const handleEditSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editItem) return;
    setEditSaving(true);
    const fd = new FormData(e.currentTarget);
    const payload: Record<string, string> = { id: editItem.item.id };
    fd.forEach((v, k) => { payload[k] = v as string; });
    const ep = editItem.type === 'lost' ? '/api/lost-found/lost' : '/api/lost-found/found';
    const res = await authFetch(ep, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (res.ok) { toast.success('Updated!'); setEditItem(null); fetchAll(); }
    else { const d = await res.json(); toast.error(d.error || 'Failed'); }
    setEditSaving(false);
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    const ep = confirmDelete.type === 'lost' ? `/api/lost-found/lost?id=${confirmDelete.id}` : `/api/lost-found/found?id=${confirmDelete.id}`;
    const res = await authFetch(ep, { method: 'DELETE' });
    if (res.ok) { toast.success('Deleted'); setConfirmDelete(null); fetchAll(); }
    else toast.error('Failed to delete');
  };

  const isOwner = (item: Item) => user?.id === item.user_id;

  const inp = "w-full px-3.5 md:px-4 py-2.5 md:py-3 rounded-xl bg-secondary/50 border border-border text-xs md:text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary transition-colors";
  const lbl = "block text-[11px] font-semibold text-muted-foreground mb-1 uppercase tracking-wider";

  const allItems = [
    ...lostItems.map(i => ({ ...i, _type: 'lost' as const })),
    ...foundItems.map(i => ({ ...i, _type: 'found' as const })),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const myItems = allItems.filter(i => i.user_id === user?.id);

  const viewedItems = (() => {
    if (viewTab === 'all') return allItems;
    if (viewTab === 'mine') return myItems;
    if (viewTab === 'lost') return lostItems.map(i => ({ ...i, _type: 'lost' as const }));
    if (viewTab === 'found') return foundItems.map(i => ({ ...i, _type: 'found' as const }));
    return [];
  })();

  const renderItemCard = (item: Item & { _type: 'lost' | 'found' }) => (
    <motion.div key={item.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="glass<dyad-write path="src/app/dashboard/lost-found/page.tsx" description="Complete and fix syntax and compilation issues in Lost & Found page">
'use client';

import { useAuth } from '@/lib/auth-context';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Search, Plus, Eye, Package, MapPin, Phone, User,
  Tag, MessageSquare, Sparkles, X, Clock, CheckCircle2,
  AlertTriangle, Pencil, Trash2, Save, Users, UserCheck
} from 'lucide-react';

type MainTab = 'report-lost' | 'report-found' | 'view';
type ViewTab = 'all' | 'mine' | 'lost' | 'found' | 'matched';

interface Item {
  id: string;
  item_name: string;
  color: string;
  brand?: string;
  location?: string;
  remark?: string;
  owner_name?: string;
  finder_name?: string;
  phone: string;
  image_url?: string;
  user_id: string;
  created_at: string;
}

interface MatchedItem {
  id: string;
  match_score: number;
  lost_item_data: Item;
  found_item_data: Item;
  expires_at: string;
  created_at: string;
}

export default function LostFoundPage() {
  const { user, authFetch } = useAuth();
  const [mainTab, setMainTab] = useState<MainTab>('view');
  const [viewTab, setViewTab] = useState<ViewTab>('all');
  const [lostItems, setLostItems] = useState<Item[]>([]);
  const [foundItems, setFoundItems] = useState<Item[]>([]);
  const [matches, setMatches] = useState<MatchedItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [matchResult, setMatchResult] = useState<{ item: Item; score: number; type: string } | null>(null);
  const [editItem, setEditItem] = useState<{ item: Item; type: 'lost' | 'found' } | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; type: 'lost' | 'found'; name: string } | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [lR, fR, mR] = await Promise.all([
        authFetch('/api/lost-found/lost'),
        authFetch('/api/lost-found/found'),
        authFetch('/api/lost-found/matches'),
      ]);
      const [lD, fD, mD] = await Promise.all([lR.json(), fR.json(), mR.json()]);
      setLostItems(lD.items || []);
      setFoundItems(fD.items || []);
      setMatches(mD.matches || []);
    } catch { /* ignore */ }
    setLoading(false);
  }, [authFetch]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleLostSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    const form = e.currentTarget;
    try {
      const res = await authFetch('/api/lost-found/lost', { method: 'POST', body: new FormData(form) });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); setSubmitting(false); return; }
      toast.success('Lost item reported!');
      form.reset();
      if (data.match) setMatchResult({ item: data.match.found, score: data.match.score, type: 'found' });
      setMainTab('view'); setViewTab('mine');
      fetchAll();
    } catch { toast.error('Something went wrong'); }
    setSubmitting(false);
  };

  const handleFoundSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    const form = e.currentTarget;
    try {
      const res = await authFetch('/api/lost-found/found', { method: 'POST', body: new FormData(form) });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); setSubmitting(false); return; }
      toast.success('Found item reported!');
      form.reset();
      if (data.match) setMatchResult({ item: data.match.lost, score: data.match.score, type: 'lost' });
      setMainTab('view'); setViewTab('mine');
      fetchAll();
    } catch { toast.error('Something went wrong'); }
    setSubmitting(false);
  };

  const handleEditSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editItem) return;
    setEditSaving(true);
    const fd = new FormData(e.currentTarget);
    const payload: Record<string, string> = { id: editItem.item.id };
    fd.forEach((v, k) => { payload[k] = v as string; });
    const ep = editItem.type === 'lost' ? '/api/lost-found/lost' : '/api/lost-found/found';
    const res = await authFetch(ep, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (res.ok) { toast.success('Updated!'); setEditItem(null); fetchAll(); }
    else { const d = await res.json(); toast.error(d.error || 'Failed'); }
    setEditSaving(false);
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    const ep = confirmDelete.type === 'lost' ? `/api/lost-found/lost?id=${confirmDelete.id}` : `/api/lost-found/found?id=${confirmDelete.id}`;
    const res = await authFetch(ep, { method: 'DELETE' });
    if (res.ok) { toast.success('Deleted'); setConfirmDelete(null); fetchAll(); }
    else toast.error('Failed to delete');
  };

  const isOwner = (item: Item) => user?.id === item.user_id;

  const inp = "w-full px-3.5 md:px-4 py-2.5 md:py-3 rounded-xl bg-secondary/50 border border-border text-xs md:text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary transition-colors";
  const lbl = "block text-[11px] font-semibold text-muted-foreground mb-1 uppercase tracking-wider";

  const allItems = [
    ...lostItems.map(i => ({ ...i, _type: 'lost' as const })),
    ...foundItems.map(i => ({ ...i, _type: 'found' as const })),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const myItems = allItems.filter(i => i.user_id === user?.id);

  const viewedItems = (() => {
    if (viewTab === 'all') return allItems;
    if (viewTab === 'mine') return myItems;
    if (viewTab === 'lost') return lostItems.map(i => ({ ...i, _type: 'lost' as const }));
    if (viewTab === 'found') return foundItems.map(i => ({ ...i, _type: 'found' as const }));
    return [];
  })();

  const renderItemCard = (item: Item & { _type: 'lost' | 'found' }) => (
    <motion.div key={item.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="glass-card glass-card-hover rounded-2xl overflow-hidden flex flex-col justify-between">
      {item.image_url && (
        <div className="h-36 sm:h-40 overflow-hidden shrink-0">
          <img src={item.image_url} alt={item.item_name} className="w-full h-full object-cover" />
        </div>
      )}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-3 gap-2">
            <h3 className="font-bold text-sm sm:text-base truncate flex-1 text-white">{item.item_name}</h3>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 sm:py-1 rounded-full ${item._type === 'lost' ? 'bg-coral/15 text-coral' : 'bg-neon/15 text-neon'}`}>
                {item._type}
              </span>
              {isOwner(item) && (
                <>
                  <button onClick={() => setEditItem({ item, type: item._type })}
                    className="p-1 sm:p-1.5 rounded-lg glass-card text-muted-foreground hover:text-primary transition-colors">
                    <Pencil size={13} />
                  </button>
                  <button onClick={() => setConfirmDelete({ id: item.id, type: item._type, name: item.item_name })}
                    className="p-1 sm:p-1.5 rounded-lg glass-card text-muted-foreground hover:text-coral transition-colors">
                    <Trash2 size={13} />
                  </button>
                </>
              )}
            </div>
          </div>
          <div className="space-y-1.5 text-xs sm:text-sm text-muted-foreground">
            <div className="flex items-center gap-2"><Tag size={13} className="text-primary shrink-0" /><span className="truncate">Color: {item.color}</span></div>
            {item.brand && <div className="flex items-center gap-2"><Package size={13} className="text-primary shrink-0" /><span className="truncate">Brand: {item.brand}</span></div>}
            {item.location && <div className="flex items-center gap-2"><MapPin size={13} className="text-primary shrink-0" /><span className="truncate">{item.location}</span></div>}
            {item.remark && <div className="flex items-start gap-2"><MessageSquare size={13} className="text-primary shrink-0 mt-0.5" /><span className="line-clamp-2">{item.remark}</span></div>}
            <div className="flex items-center gap-2"><User size={13} className="text-primary shrink-0" /><span className="truncate">{item.owner_name || item.finder_name}</span></div>
            <div className="flex items-center gap-2"><Phone size={13} className="text-primary shrink-0" /><span className="truncate">{item.phone}</span></div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground/70 mt-3 pt-2.5 border-t border-[#1c1f2b]">
          <Clock size={12} className="shrink-0" />
          <span className="text-[10px]">{new Date(item.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="max-w-6xl mx-auto w-full">

      {/* Confirm Delete Modal */}
      <AnimatePresence>
        {confirmDelete && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs"
            onClick={() => setConfirmDelete(null)}>
            <motion.div initial={{ scale: 0.92 }} animate={{ scale: 1 }} exit={{ scale: 0.92 }}
              className="glass-card rounded-2xl p-5 sm:p-6 max-w-sm w-full" onClick={e => e.stopPropagation()}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-coral/15 flex items-center justify-center shrink-0"><Trash2 size={18} className="text-coral" /></div>
                <div><h3 className="font-bold text-sm sm:text-base text-white">Delete Item?</h3><p className="text-xs text-muted-foreground">Cannot be undone</p></div>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground mb-5">Delete <span className="text-foreground font-semibold">"{confirmDelete.name}"</span>?</p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2.5 rounded-xl glass-card text-xs sm:text-sm font-semibold">Cancel</button>
                <button onClick={handleDelete} className="flex-1 py-2.5 rounded-xl bg-coral text-white text-xs sm:text-sm font-semibold">Delete</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {editItem && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs overflow-y-auto"
            onClick={() => setEditItem(null)}>
            <motion.div initial={{ scale: 0.95, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 16 }}
              className="glass-card rounded-2xl p-4 sm:p-6 w-full max-w-lg my-auto max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-base sm:text-lg flex items-center gap-2 text-white">
                  <Pencil size={17} className="text-primary" /> Edit {editItem.type === 'lost' ? 'Lost' : 'Found'} Item
                </h3>
                <button onClick={() => setEditItem(null)} className="p-1.5 rounded-lg glass-card text-muted-foreground hover:text-foreground"><X size={17} /></button>
              </div>
              <form onSubmit={handleEditSave} className="space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div><label className={lbl}>Item Name *</label><input name="item_name" required defaultValue={editItem.item.item_name} className={inp} /></div>
                  <div><label className={lbl}>Color *</label><input name="color" required defaultValue={editItem.item.color} className={inp} /></div>
                  <div><label className={lbl}>Brand</label><input name="brand" defaultValue={editItem.item.brand || ''} className={inp} /></div>
                  <div><label className={lbl}>Location</label><input name="location" defaultValue={editItem.item.location || ''} className={inp} /></div>
                  <div>
                    <label className={lbl}>{editItem.type === 'lost' ? 'Owner Name' : 'Finder Name'} *</label>
                    <input name={editItem.type === 'lost' ? 'owner_name' : 'finder_name'} required
                      defaultValue={editItem.type === 'lost' ? (editItem.item.owner_name || '') : (editItem.item.finder_name || '')} className={inp} />
                  </div>
                  <div><label className={lbl}>Phone *</label><input name="phone" required defaultValue={editItem.item.phone} className={inp} /></div>
                </div>
                <div><label className={lbl}>Remark</label><textarea name="remark" rows={2} defaultValue={editItem.item.remark || ''} className={inp} /></div>
                <button type="submit" disabled={editSaving}
                  className="w-full py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-primary to-[#7b61ff] text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 disabled:opacity-50">
                  {editSaving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Save size={16} /> Save Changes</>}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Match Popup */}
      <AnimatePresence>
        {matchResult && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs"
            onClick={() => setMatchResult(null)}>
            <div className="glass-card rounded-2xl p-5 sm:p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2"><Sparkles className="text-neon" size={18} /><h3 className="text-base sm:text-lg font-bold text-neon">Match Found!</h3></div>
                <button onClick={() => setMatchResult(null)} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
              </div>
              <div className="glass-card rounded-xl p-3.5 sm:p-4 mb-3">
                <p className="text-xs text-muted-foreground mb-2">Match Score: <span className="text-neon font-bold">{matchResult.score.toFixed(0)}%</span></p>
                <h4 className="font-bold text-sm sm:text-base text-white mb-2">{matchResult.item.item_name}</h4>
                <div className="space-y-1 text-xs sm:text-sm text-muted-foreground">
                  <p>Color: {matchResult.item.color}</p>
                  {matchResult.item.brand && <p>Brand: {matchResult.item.brand}</p>}
                  {matchResult.item.location && <p>Location: {matchResult.item.location}</p>}
                  {matchResult.item.remark && <p>Remark: {matchResult.item.remark}</p>}
                  <p className="text-foreground font-semibold mt-2">
                    {matchResult.type === 'found' ? `Finder: ${matchResult.item.finder_name}` : `Owner: ${matchResult.item.owner_name}`}
                  </p>
                  <p>Phone: {matchResult.item.phone}</p>
                </div>
                {matchResult.item.image_url && <img src={matchResult.item.image_url} alt="" className="w-full h-28 sm:h-32 object-cover rounded-lg mt-3" />}
              </div>
              <p className="text-xs text-muted-foreground">Contact the person above to reclaim your item.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-5 sm:mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Search size={16} className="text-neon" />
          <span className="text-[11px] font-semibold text-neon uppercase tracking-widest">Lost & Found</span>
        </div>
        <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-white">
          Lost & Found <span className="gradient-text">Registry</span>
        </h1>
        <p className="text-muted-foreground mt-0.5 text-xs sm:text-sm">Report lost or found items. Our smart system matches them automatically.</p>
      </motion.div>

      {/* Main action tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 mb-4 sm:mb-5">
        {[
          { id: 'view' as MainTab, label: 'Browse Items', icon: Eye },
          { id: 'report-lost' as MainTab, label: 'Report Lost', icon: AlertTriangle },
          { id: 'report-found' as MainTab, label: 'Report Found', icon: CheckCircle2 },
        ].map(t => (
          <button key={t.id} onClick={() => setMainTab(t.id)}
            className={`flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${mainTab === t.id ? 'bg-primary text-primary-foreground shadow-md' : 'glass-card text-muted-foreground hover:text-foreground'}`}>
            <t.icon size={14} /> {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">

        {/* Report Lost */}
        {mainTab === 'report-lost' && (
          <motion.div key="report-lost" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="glass-card rounded-2xl p-4 sm:p-6 max-w-2xl">
              <h2 className="text-sm sm:text-base font-bold mb-4 flex items-center gap-2 text-white"><AlertTriangle size={16} className="text-coral" /> Report Lost Item</h2>
              <form onSubmit={handleLostSubmit} className="space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div><label className={lbl}>Item Name *</label><input name="item_name" required className={inp} placeholder="e.g. iPhone 15" /></div>
                  <div><label className={lbl}>Color *</label><input name="color" required className={inp} placeholder="e.g. Black" /></div>
                  <div><label className={lbl}>Brand</label><input name="brand" className={inp} placeholder="e.g. Apple (optional)" /></div>
                  <div><label className={lbl}>Location *</label><input name="location" required className={inp} placeholder="e.g. Library" /></div>
                  <div><label className={lbl}>Owner Name *</label><input name="owner_name" required className={inp} placeholder="Your name" /></div>
                  <div><label className={lbl}>Phone *</label><input name="phone" required className={inp} placeholder="Phone number" /></div>
                </div>
                <div><label className={lbl}>Remark</label><textarea name="remark" rows={2} className={inp} placeholder="Additional details (optional)" /></div>
                <div><label className={lbl}>Image (optional)</label><input type="file" name="image" accept="image/jpeg,image/png" className={inp} /></div>
                <button type="submit" disabled={submitting}
                  className="w-full py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-coral to-[#ff8f6b] text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 disabled:opacity-50">
                  {submitting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Plus size={16} /> Submit Report</>}
                </button>
              </form>
            </div>
          </motion.div>
        )}

        {/* Report Found */}
        {mainTab === 'report-found' && (
          <motion.div key="report-found" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="glass-card rounded-2xl p-4 sm:p-6 max-w-2xl">
              <h2 className="text-sm sm:text-base font-bold mb-4 flex items-center gap-2 text-white"><CheckCircle2 size={16} className="text-neon" /> Report Found Item</h2>
              <form onSubmit={handleFoundSubmit} className="space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div><label className={lbl}>Item Name *</label><input name="item_name" required className={inp} placeholder="e.g. Water Bottle" /></div>
                  <div><label className={lbl}>Color *</label><input name="color" required className={inp} placeholder="e.g. Blue" /></div>
                  <div><label className={lbl}>Brand</label><input name="brand" className={inp} placeholder="e.g. Milton (optional)" /></div>
                  <div><label className={lbl}>Location</label><input name="location" className={inp} placeholder="Where found (optional)" /></div>
                  <div><label className={lbl}>Finder Name *</label><input name="finder_name" required className={inp} placeholder="Your name" /></div>
                  <div><label className={lbl}>Phone *</label><input name="phone" required className={inp} placeholder="Phone number" /></div>
                </div>
                <div><label className={lbl}>Remark</label><textarea name="remark" rows={2} className={inp} placeholder="Additional details (optional)" /></div>
                <div><label className={lbl}>Image (optional)</label><input type="file" name="image" accept="image/jpeg,image/png" className={inp} /></div>
                <button type="submit" disabled={submitting}
                  className="w-full py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-neon to-[#00d4b4] text-[#0a0a0f] font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 disabled:opacity-50">
                  {submitting ? <div className="w-4 h-4 border-2 border-[#0a0a0f] border-t-transparent rounded-full animate-spin" /> : <><Plus size={16} /> Submit Report</>}
                </button>
              </form>
            </div>
          </motion.div>
        )}

        {/* Browse */}
        {mainTab === 'view' && (
          <motion.div key="view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {/* Sub-tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 mb-4 sm:mb-5">
              {([
                { id: 'all', label: 'All', count: allItems.length, icon: Users },
                { id: 'mine', label: 'Mine', count: myItems.length, icon: UserCheck },
                { id: 'lost', label: 'Lost', count: lostItems.length, icon: AlertTriangle },
                { id: 'found', label: 'Found', count: foundItems.length, icon: Package },
                { id: 'matched', label: 'Matched', count: matches.length, icon: Sparkles },
              ] as const).map(t => (
                <button key={t.id} onClick={() => setViewTab(t.id)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${viewTab === t.id ? 'bg-primary text-primary-foreground shadow' : 'glass-card text-muted-foreground hover:text-foreground'}`}>
                  <t.icon size={13} /> {t.label}
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/10">{t.count}</span>
                </button>
              ))}
            </div>

            {loading ? (
              <div className="flex justify-center py-16"><div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
            ) : viewTab === 'matched' ? (
              matches.length === 0 ? (
                <div className="glass-card rounded-2xl p-8 sm:p-12 text-center"><Sparkles size={36} className="mx-auto text-muted-foreground mb-3" /><p className="text-xs sm:text-sm text-muted-foreground">No matched items yet.</p></div>
              ) : (
                <div className="space-y-4">
                  {matches.map(m => (
                    <motion.div key={m.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl p-4 sm:p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <Sparkles size={15} className="text-neon" />
                        <span className="text-xs font-bold text-neon uppercase tracking-widest">Score: {m.match_score.toFixed(0)}%</span>
                        <span className="ml-auto text-[10px] sm:text-xs text-muted-foreground">Expires: {new Date(m.expires_at).toLocaleDateString('en-IN')}</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        {[
                          { label: 'Lost Item', data: m.lost_item_data, color: 'text-coral', nameKey: 'owner_name', role: 'Owner' },
                          { label: 'Found Item', data: m.found_item_data, color: 'text-neon', nameKey: 'finder_name', role: 'Finder' },
                        ].map(side => (
                          <div key={side.label} className="glass-card rounded-xl p-3.5 sm:p-4">
                            <span className={`text-[10px] font-bold uppercase tracking-widest mb-1.5 block ${side.color}`}>{side.label}</span>
                            <h4 className="font-bold text-sm sm:text-base text-white mb-2">{side.data.item_name}</h4>
                            <div className="space-y-1 text-xs sm:text-sm text-muted-foreground">
                              <p>Color: {side.data.color}</p>
                              {side.data.brand && <p>Brand: {side.data.brand}</p>}
                              {side.data.location && <p>Location: {side.data.location}</p>}
                              {side.data.remark && <p>Remark: {side.data.remark}</p>}
                              <p className="font-semibold text-foreground mt-2">
                                {side.role}: {side.data[side.nameKey as keyof Item]}
                              </p>
                              <p>Phone: {side.data.phone}</p>
                            </div>
                            {side.data.image_url && <img src={side.data.image_url} alt="" className="w-full h-24 sm:h-28 object-cover rounded-lg mt-2" />}
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )
            ) : viewedItems.length === 0 ? (
              <div className="glass-card rounded-2xl p-8 sm:p-12 text-center">
                <Search size={36} className="mx-auto text-muted-foreground mb-3" />
                <p className="text-xs sm:text-sm text-muted-foreground">{viewTab === 'mine' ? "You haven't reported any items." : 'No items found.'}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
                {viewedItems.map(item => renderItemCard(item))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}