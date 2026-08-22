'use client';

import React from 'react';
import { AdminTabType } from '@/types/admin';
import { BarChart3, Building2, CheckCircle2, Search, Package, BookOpen } from 'lucide-react';

interface TabItem {
  id: AdminTabType;
  label: string;
  icon: React.ElementType;
  count: number;
  color: string;
}

interface AdminTabsProps {
  activeTab: AdminTabType;
  onTabChange: (tab: AdminTabType) => void;
  counts: {
    activeComplaints: number;
    resolvedCount: number;
    lostItems: number;
    foundItems: number;
    resources: number;
  };
}

export default function AdminTabs({ activeTab, onTabChange, counts }: AdminTabsProps) {
  const tabs: TabItem[] = [
    { id: 'overview', label: 'Overview', icon: BarChart3, count: 0, color: '#a78bfa' },
    { id: 'complaints', label: 'Complaints', icon: Building2, count: counts.activeComplaints, color: '#ff6b6b' },
    { id: 'resolved', label: 'Resolved', icon: CheckCircle2, count: counts.resolvedCount, color: '#00f5d4' },
    { id: 'lost', label: 'Lost', icon: Search, count: counts.lostItems, color: '#00f5d4' },
    { id: 'found', label: 'Found', icon: Package, count: counts.foundItems, color: '#00f5d4' },
    { id: 'resources', label: 'Resources', icon: BookOpen, count: counts.resources, color: '#fbbf24' },
  ];

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 mb-5">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
            activeTab === tab.id ? 'bg-primary text-primary-foreground shadow-md' : 'glass-card text-muted-foreground hover:text-foreground'
          }`}
        >
          <tab.icon size={13} />
          {tab.label}
          {tab.count > 0 && (
            <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold"
              style={{ background: `${tab.color}20`, color: tab.color }}>
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}