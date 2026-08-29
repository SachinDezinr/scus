'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './auth-context';

export interface Complaint {
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

export interface LostItem {
  id: string;
  item_name: string;
  color: string;
  brand?: string;
  location?: string;
  remark?: string;
  owner_name: string;
  phone: string;
  image_url?: string;
  user_id: string;
  created_at: string;
}

export interface FoundItem {
  id: string;
  item_name: string;
  color: string;
  brand?: string;
  location?: string;
  remark?: string;
  finder_name: string;
  phone: string;
  image_url?: string;
  user_id: string;
  created_at: string;
}

export interface MatchedItem {
  id: string;
  match_score: number;
  lost_item_data: LostItem;
  found_item_data: FoundItem;
  expires_at: string;
  created_at: string;
}

export interface Resource {
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

interface DataContextType {
  complaints: Complaint[];
  lostItems: LostItem[];
  foundItems: FoundItem[];
  matches: MatchedItem[];
  resources: Resource[];
  initialLoaded: boolean;
  refetchComplaints: () => Promise<void>;
  refetchLostFound: () => Promise<void>;
  refetchResources: () => Promise<void>;
  refetchAll: () => Promise<void>;
  stats: {
    complaintsCount: number;
    lostCount: number;
    foundCount: number;
    resourcesCount: number;
  };
}

const DataContext = createContext<DataContextType | null>(null);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { user, authFetch } = useAuth();

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [lostItems, setLostItems] = useState<LostItem[]>([]);
  const [foundItems, setFoundItems] = useState<FoundItem[]>([]);
  const [matches, setMatches] = useState<MatchedItem[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [initialLoaded, setInitialLoaded] = useState(false);

  const refetchComplaints = useCallback(async () => {
    if (!user) return;
    try {
      const res = await authFetch('/api/complaints');
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        if (Array.isArray(data.complaints)) {
          setComplaints(data.complaints);
        }
      }
    } catch {
      // quiet fallback
    }
  }, [authFetch, user]);

  const refetchLostFound = useCallback(async () => {
    if (!user) return;
    try {
      const [lRes, fRes, mRes] = await Promise.allSettled([
        authFetch('/api/lost-found/lost'),
        authFetch('/api/lost-found/found'),
        authFetch('/api/lost-found/matches'),
      ]);

      if (lRes.status === 'fulfilled' && lRes.value.ok) {
        const lData = await lRes.value.json().catch(() => ({}));
        if (Array.isArray(lData.items)) setLostItems(lData.items);
      }
      if (fRes.status === 'fulfilled' && fRes.value.ok) {
        const fData = await fRes.value.json().catch(() => ({}));
        if (Array.isArray(fData.items)) setFoundItems(fData.items);
      }
      if (mRes.status === 'fulfilled' && mRes.value.ok) {
        const mData = await mRes.value.json().catch(() => ({}));
        if (Array.isArray(mData.matches)) setMatches(mData.matches);
      }
    } catch {
      // quiet fallback
    }
  }, [authFetch, user]);

  const refetchResources = useCallback(async () => {
    if (!user) return<dyad-write path="src/lib/data-context.tsx" description="Update stats to count only pending and in-progress complaints for active count.">
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './auth-context';

export interface Complaint {
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

export interface LostItem {
  id: string;
  item_name: string;
  color: string;
  brand?: string;
  location?: string;
  remark?: string;
  owner_name: string;
  phone: string;
  image_url?: string;
  user_id: string;
  created_at: string;
}

export interface FoundItem {
  id: string;
  item_name: string;
  color: string;
  brand?: string;
  location?: string;
  remark?: string;
  finder_name: string;
  phone: string;
  image_url?: string;
  user_id: string;
  created_at: string;
}

export interface MatchedItem {
  id: string;
  match_score: number;
  lost_item_data: LostItem;
  found_item_data: FoundItem;
  expires_at: string;
  created_at: string;
}

export interface Resource {
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

interface DataContextType {
  complaints: Complaint[];
  lostItems: LostItem[];
  foundItems: FoundItem[];
  matches: MatchedItem[];
  resources: Resource[];
  initialLoaded: boolean;
  refetchComplaints: () => Promise<void>;
  refetchLostFound: () => Promise<void>;
  refetchResources: () => Promise<void>;
  refetchAll: () => Promise<void>;
  stats: {
    complaintsCount: number;
    lostCount: number;
    foundCount: number;
    resourcesCount: number;
  };
}

const DataContext = createContext<DataContextType | null>(null);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { user, authFetch } = useAuth();

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [lostItems, setLostItems] = useState<LostItem[]>([]);
  const [foundItems, setFoundItems] = useState<FoundItem[]>([]);
  const [matches, setMatches] = useState<MatchedItem[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [initialLoaded, setInitialLoaded] = useState(false);

  const refetchComplaints = useCallback(async () => {
    if (!user) return;
    try {
      const res = await authFetch('/api/complaints');
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        if (Array.isArray(data.complaints)) {
          setComplaints(data.complaints);
        }
      }
    } catch {
      // quiet fallback
    }
  }, [authFetch, user]);

  const refetchLostFound = useCallback(async () => {
    if (!user) return;
    try {
      const [lRes, fRes, mRes] = await Promise.allSettled([
        authFetch('/api/lost-found/lost'),
        authFetch('/api/lost-found/found'),
        authFetch('/api/lost-found/matches'),
      ]);

      if (lRes.status === 'fulfilled' && lRes.value.ok) {
        const lData = await lRes.value.json().catch(() => ({}));
        if (Array.isArray(lData.items)) setLostItems(lData.items);
      }
      if (fRes.status === 'fulfilled' && fRes.value.ok) {
        const fData = await fRes.value.json().catch(() => ({}));
        if (Array.isArray(fData.items)) setFoundItems(fData.items);
      }
      if (mRes.status === 'fulfilled' && mRes.value.ok) {
        const mData = await mRes.value.json().catch(() => ({}));
        if (Array.isArray(mData.matches)) setMatches(mData.matches);
      }
    } catch {
      // quiet fallback
    }
  }, [authFetch, user]);

  const refetchResources = useCallback(async () => {
    if (!user) return;
    try {
      const res = await authFetch('/api/resources');
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        if (Array.isArray(data.resources)) {
          setResources(data.resources);
        }
      }
    } catch {
      // quiet fallback
    }
  }, [authFetch, user]);

  const refetchAll = useCallback(async () => {
    if (!user) return;
    await Promise.allSettled([refetchComplaints(), refetchLostFound(), refetchResources()]);
    setInitialLoaded(true);
  }, [user, refetchComplaints, refetchLostFound, refetchResources]);

  // Initial load only once when user is authenticated
  useEffect(() => {
    if (user && !initialLoaded) {
      refetchAll();
    } else if (!user) {
      setComplaints([]);
      setLostItems([]);
      setFoundItems([]);
      setMatches([]);
      setResources([]);
      setInitialLoaded(false);
    }
  }, [user, initialLoaded, refetchAll]);

  const stats = useMemo(() => {
    const activeComplaintsCount = (complaints || []).filter(
      (c: Complaint) => c.status === 'pending' || c.status === 'in progress'
    ).length;

    return {
      complaintsCount: activeComplaintsCount,
      lostCount: lostItems?.length || 0,
      foundCount: foundItems?.length || 0,
      resourcesCount: resources?.length || 0,
    };
  }, [complaints, lostItems, foundItems, resources]);

  return (
    <DataContext.Provider
      value={{
        complaints,
        lostItems,
        foundItems,
        matches,
        resources,
        initialLoaded,
        refetchComplaints,
        refetchLostFound,
        refetchResources,
        refetchAll,
        stats,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useCampusData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useCampusData must be used within DataProvider');
  return ctx;
}