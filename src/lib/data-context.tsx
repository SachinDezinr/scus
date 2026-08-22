'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './auth-context';
import { Complaint, LostItem, FoundItem, MatchedItem, Resource } from '@/types/admin';

export type { Complaint, LostItem, FoundItem, MatchedItem, Resource };

export interface DataContextType {
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
  const [initialLoaded, setInitialLoaded] = useState<boolean>(false);

  const refetchComplaints = useCallback(async () => {
    if (!user) return;
    try {
      const res = await authFetch('/api/complaints');
      if (res.ok) {
        const data = await res.json();
        setComplaints(data.complaints || []);
      }
    } catch {
      // quiet fallback
    }
  }, [authFetch, user]);

  const refetchLostFound = useCallback(async () => {
    if (!user) return;
    try {
      const [lRes, fRes, mRes] = await Promise.all([
        authFetch('/api/lost-found/lost'),
        authFetch('/api/lost-found/found'),
        authFetch('/api/lost-found/matches'),
      ]);
      const [lData, fData, mData] = await Promise.all([lRes.json(), fRes.json(), mRes.json()]);
      setLostItems(lData.items || []);
      setFoundItems(fData.items || []);
      setMatches(mData.matches || []);
    } catch {
      // quiet fallback
    }
  }, [authFetch, user]);

  const refetchResources = useCallback(async () => {
    if (!user) return;
    try {
      const res = await authFetch('/api/resources');
      if (res.ok) {
        const data = await res.json();
        setResources(data.resources || []);
      }
    } catch {
      // quiet fallback
    }
  }, [authFetch, user]);

  const refetchAll = useCallback(async () => {
    if (!user) return;
    await Promise.all([refetchComplaints(), refetchLostFound(), refetchResources()]);
    setInitialLoaded(true);
  }, [user, refetchComplaints, refetchLostFound, refetchResources]);

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

  const stats = useMemo(() => ({
    complaintsCount: complaints.length,
    lostCount: lostItems.length,
    foundCount: foundItems.length,
    resourcesCount: resources.length,
  }), [complaints.length, lostItems.length, foundItems.length, resources.length]);

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

export function useCampusData(): DataContextType {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useCampusData must be used within DataProvider');
  return ctx;
}