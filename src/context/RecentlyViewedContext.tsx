'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { Product } from '@/lib/api';

const STORAGE_KEY = 'recently_viewed';
const ENABLED_KEY = 'recently_viewed_enabled';
const MAX_ITEMS = 10;

interface RecentlyViewedContextValue {
  items: Product[];
  enabled: boolean;
  trackProduct: (product: Product) => void;
  setEnabled: (enabled: boolean) => void;
}

const RecentlyViewedContext = createContext<RecentlyViewedContextValue | null>(null);

export function RecentlyViewedProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Product[]>([]);
  const [enabled, setEnabledState] = useState(true);

  // Load from localStorage on mount (client-side only)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setItems(JSON.parse(stored) as Product[]);
      }

      const storedEnabled = localStorage.getItem(ENABLED_KEY);
      // Default is enabled; only disable if explicitly set to 'false'
      if (storedEnabled !== null) {
        setEnabledState(storedEnabled !== 'false');
      }
    } catch {
      // Ignore parse errors
    }
  }, []);

  const trackProduct = (product: Product) => {
    if (!enabled) return;

    setItems((prev) => {
      // Move to front if already present, otherwise prepend; cap at MAX_ITEMS
      const without = prev.filter((p) => p.id !== product.id);
      const updated = [product, ...without].slice(0, MAX_ITEMS);

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // Ignore storage errors (e.g. private browsing quota)
      }

      return updated;
    });
  };

  const setEnabled = (value: boolean) => {
    setEnabledState(value);
    try {
      localStorage.setItem(ENABLED_KEY, String(value));
    } catch {
      // Ignore storage errors
    }
  };

  return (
    <RecentlyViewedContext.Provider value={{ items, enabled, trackProduct, setEnabled }}>
      {children}
    </RecentlyViewedContext.Provider>
  );
}

export function useRecentlyViewed(): RecentlyViewedContextValue {
  const ctx = useContext(RecentlyViewedContext);
  if (!ctx) throw new Error('useRecentlyViewed must be used inside RecentlyViewedProvider');
  return ctx;
}
