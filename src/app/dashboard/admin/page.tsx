'use client';

import { useAuth } from '@/lib/auth-context';
import { useCampusData } from '@/lib/data-context';
import { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Shield, Clock, Loader2, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { AdminTabType } from '@/types/admin';
import {
  AdminHeader,
  AdminTabs,
  AdminDeleteModal,
  AdminOverviewTab,
  AdminComplaintsTab,
  AdminResolvedTab,
  AdminLostItemsTab,
  AdminFoundItemsTab,
  AdminResourcesTab,
} from '@/components/admin';

const statusConfig: Record<string, { color: string; bg: string; icon: React.ElementType }> = {
  pending: { color: '#fbbf24', bg: 'rgba(251,191,36,0.12)', icon: Clock },
  'in progress': { color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', icon: Loader2 },
  resolved: { color: '#00f5d4', bg: 'rgba(0,245,212,0.12)', icon: CheckCircle2 },
};

const priorityConfig: Record<string, { label: string; color: string; bg: string }> = {
  urgent: { label: 'Urgent', color: '#ef4444', bg: 'rgba(239,68,68,0.15)' },
  high: { label: 'High', color: '#ff6b6b', bg: 'rgba(255,107,107,0.15)' },
  medium: { label: 'Medium', color: '#fbbf24', bg: 'rgba(251,191,36,0.15)' },
  low: { label: 'Low', color: '#00f5d4', bg: 'rgba(0,245,212,0.15)' },
};

export default function AdminPage() {
  const { user, authFetch } = useAuth();
  const {
    complaints,
    lostItems,
    foundItems,
    resources,
    initialLoaded,
    refetchComplaints,
    refetchLostFound,
    refetchResources,
  } = useCampusData();

  const router = useRouter();
  const [activeTab, setActiveTab] = useState<AdminTabType>('overview');
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; type: string; name: string } | null>(null);

  useEffect(() => {
    if (user && user.role !== 'admin') {
      router.push('/dashboard');
    }
  }, [user, router]);

  const updateComplaintStatus = async (id: string, status: string) => {
    const res = await authFetch('/api/complaints', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    });
    if (res.ok) { 
      toast.success(status === 'resolved' ? 'Complaint resolved' : 'Status updated'); 
      refetchComplaints(); 
    }
    else toast.error('Failed to update');
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    const { id, type } = confirmDelete;
    let url = '';
    if (type === 'complaint') url = `/api/complaints?id=${id}`;
    else if (type === 'lost') url = `/api/lost-found/lost?id=${id}`;
    else if (type === 'found') url = `/api/lost-found/found?id=${id}`;
    else if (type === 'resource') url = `/api/resources?id=${id}`;

    const res = await authFetch(url, { method: 'DELETE' });
    if (res.ok) {
      toast.success('Deleted successfully');
      setConfirmDelete(null);
      if (type === 'complaint') refetchComplaints();
      else if (type === 'lost' || type === 'found') refetchLostFound();
      else if (type === 'resource') refetchResources();
    } else toast.error('Failed to delete');
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-4">
        <div className="glass-card rounded-2xl p-8 sm:p-12 text-center max-w-md w-full">
          <Shield size={48} className="mx-auto text-coral mb-4" />
          <h2 className="text-xl font-bold mb-2 text-white">Access Denied</h2>
          <p className="text-xs sm:text-sm text-muted-foreground">This area is restricted to administrators only.</p>
        </div>
      </div>
    );
  }

  const activeComplaints = complaints.filter(c => c.status !== 'resolved');
  const resolvedComplaints = complaints.filter(c => c.status === 'resolved');

  return (
    <div className="max-w-6xl mx-auto w-full space-y-5 sm:space-y-6">
      <AdminDeleteModal
        confirmDelete={confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
      />

      <AdminHeader />

      <AdminTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        counts={{
          activeComplaints: activeComplaints.length,
          resolvedCount: resolvedComplaints.length,
          lostItems: lostItems.length,
          foundItems: foundItems.length,
          resources: resources.length,
        }}
      />

      {!initialLoaded ? (
        <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <AdminOverviewTab
              complaints={complaints}
              activeComplaintsCount={activeComplaints.length}
              resolvedCount={resolvedComplaints.length}
              lostItemsCount={lostItems.length}
              resourcesCount={resources.length}
              onUpdateStatus={updateComplaintStatus}
              statusConfig={statusConfig}
              priorityConfig={priorityConfig}
            />
          )}

          {activeTab === 'complaints' && (
            <AdminComplaintsTab
              complaints={activeComplaints}
              onUpdateStatus={updateComplaintStatus}
              onConfirmDelete={setConfirmDelete}
              statusConfig={statusConfig}
              priorityConfig={priorityConfig}
            />
          )}

          {activeTab === 'resolved' && (
            <AdminResolvedTab
              complaints={resolvedComplaints}
              onConfirmDelete={setConfirmDelete}
              statusConfig={statusConfig}
              priorityConfig={priorityConfig}
            />
          )}

          {activeTab === 'lost' && (
            <AdminLostItemsTab
              items={lostItems}
              onConfirmDelete={setConfirmDelete}
            />
          )}

          {activeTab === 'found' && (
            <AdminFoundItemsTab
              items={foundItems}
              onConfirmDelete={setConfirmDelete}
            />
          )}

          {activeTab === 'resources' && (
            <AdminResourcesTab
              resources={resources}
              onConfirmDelete={setConfirmDelete}
            />
          )}
        </AnimatePresence>
      )}
    </div>
  );
}