'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, FileText, Trash2, User, Eye } from 'lucide-react';
import { Resource } from '../../types/admin';

interface AdminResourcesTabProps {
  resources: Resource[];
  onConfirmDelete: (item: { id: string; type: string; name: string }) => void;
}

export default function AdminResourcesTab({ resources, onConfirmDelete }: AdminResourcesTabProps) {
  return (
    <motion.div key="resources" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
      <p className="text-xs text-muted-foreground">{resources.length} resources in system</p>
      {resources.length === 0 ? (
        <div className="glass-card rounded-2xl p-8 sm:p-12 text-center">
          <BookOpen size={40} className="mx-auto text-muted-foreground mb-3" />
          <p className="text-xs sm:text-sm text-muted-foreground">No resources uploaded.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {resources.map(res => (
            <motion.div key={res.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl p-4 sm:p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber/15 flex items-center justify-center shrink-0">
                    <FileText size={18} className="text-amber" />
                  </div>
                  <button onClick={() => onConfirmDelete({ id: res.id, type: 'resource', name: res.subject_name })}
                    className="p-1.5 rounded-lg bg-coral/10 text-coral hover:bg-coral/20 transition-colors"
                    title="Delete Resource">
                    <Trash2 size={14} />
                  </button>
                </div>
                <h3 className="font-bold text-sm sm:text-base text-white mb-0.5 truncate">{res.subject_name}</h3>
                <p className="text-xs text-muted-foreground mb-3 truncate">{res.course_name}</p>
                <div className="space-y-1.5 text-xs text-muted-foreground mb-3">
                  <div className="flex items-center gap-1.5"><User size={12} className="text-primary shrink-0" /><span className="truncate">{res.uploader_name}</span></div>
                  <div className="flex items-center gap-1.5"><FileText size={12} className="text-primary shrink-0" /><span className="truncate">{res.file_name}</span></div>
                  {res.tips && (
                    <div className="p-2 rounded-lg bg-amber/5 border border-amber/10 text-[11px] line-clamp-2">
                      {res.tips}
                    </div>
                  )}
                  <p className="text-[10px] text-muted-foreground/60">{new Date(res.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                </div>
              </div>
              <a href={res.file_url} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl bg-amber/10 text-amber text-xs font-semibold hover:bg-amber/20 transition-colors mt-2">
                <Eye size={13} /> View File
              </a>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}