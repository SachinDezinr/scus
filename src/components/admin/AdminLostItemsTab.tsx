'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Trash2, Tag, Package, MapPin, User, Phone, FileText } from 'lucide-react';
import { LostItem } from '../../types/admin';

interface AdminLostItemsTabProps {
  items: LostItem[];
  onConfirmDelete: (item: { id: string; type: string; name: string }) => void;
}

export default function AdminLostItemsTab({ items, onConfirmDelete }: AdminLostItemsTabProps) {
  return (
    <motion.div key="lost" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
      <p className="text-xs text-muted-foreground">{items.length} lost items in system</p>
      {items.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center">
          <AlertTriangle size={40} className="mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No lost items.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map(item => (
            <motion.div key={item.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl overflow-hidden">
              {item.image_url && <img src={item.image_url} alt={item.item_name} className="w-full h-36 object-cover" />}
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-sm">{item.item_name}</h3>
                    <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-coral/15 text-coral">Lost</span>
                  </div>
                  <button onClick={() => onConfirmDelete({ id: item.id, type: 'lost', name: item.item_name })}
                    className="p-1.5 rounded-lg bg-coral/10 text-coral hover:bg-coral/20 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="space-y-1.5 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5"><Tag size={12} className="text-primary" /><span>Color: {item.color}</span></div>
                  {item.brand && <div className="flex items-center gap-1.5"><Package size={12} className="text-primary" /><span>Brand: {item.brand}</span></div>}
                  {item.location && <div className="flex items-center gap-1.5"><MapPin size={12} className="text-primary" /><span>{item.location}</span></div>}
                  <div className="flex items-center gap-1.5"><User size={12} className="text-primary" /><span>{item.owner_name}</span></div>
                  <div className="flex items-center gap-1.5"><Phone size={12} className="text-primary" /><span>{item.phone}</span></div>
                  {item.remark && <div className="flex items-start gap-1.5 mt-1 p-2 rounded-lg bg-secondary/30"><FileText size={12} className="text-primary mt-0.5" /><span>{item.remark}</span></div>}
                  <p className="text-[10px] text-muted-foreground/60 mt-1">{new Date(item.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}