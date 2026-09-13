'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { Product } from '@/lib/api';

const STORAGE_KEY = 'favorites';

interface FavoritesContextValue {
  items: Product[];
  count: number;
  isFavorite: (productId: number) => boolean;
  toggle: (product: Product) => void;
  remove: (productId: number) => void;
  clear: () => void;
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Product[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Load from localStorage on mount (client-side only).
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setItems(JSON.parse(stored) as Product[]);
    } catch {
      // Ignore parse errors
    }
    setHydrated(true);
  }, []);

  // Persist whenever items change (after hydration, to avoid clobbering).
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Ignore storage errors (e.g. private browsing quota)
    }
  }, [items, hydrated]);

  const isFavorite = (productId: number) => items.some((p) => p.id === productId);

  const toggle = (product: Product) => {
    setItems((prev) =>
      prev.some((p) => p.id === product.id)
        ? prev.filter((p) => p.id !== product.id)
        : [product, ...prev],
    );
  };

  const remove = (productId: number) => {
    setItems((prev) => prev.filter((p) => p.id !== productId));
  };

  const clear = () => setItems([]);

  return (
    <FavoritesContext.Provider
      value={{ items, count: items.length, isFavorite, toggle, remove, clear }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites(): FavoritesContextValue {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavorites must be used inside FavoritesProvider');
  return ctx;
}
