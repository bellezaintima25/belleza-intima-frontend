'use client';

import React, { createContext, useContext, useReducer, useEffect, useRef, ReactNode } from 'react';
import type { Product, ProductVariant } from '@/lib/api';
import { effectivePrice } from '@/lib/api';

// Clave de almacenamiento del carrito en el navegador.
const CART_STORAGE_KEY = 'belleza-intima-cart';

export interface CartItem {
  product: Product;
  variant: ProductVariant;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
}

type CartAction =
  | { type: 'ADD'; product: Product; variant: ProductVariant; quantity: number }
  | { type: 'REMOVE'; variantId: number }
  | { type: 'UPDATE_QTY'; variantId: number; quantity: number }
  | { type: 'CLEAR' }
  | { type: 'OPEN' }
  | { type: 'CLOSE' }
  | { type: 'HYDRATE'; items: CartItem[] };

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'HYDRATE':
      // Reemplaza los items con los guardados en el navegador (sin abrir el drawer).
      return { ...state, items: action.items };
    case 'ADD': {
      const existing = state.items.findIndex((i) => i.variant.id === action.variant.id);
      if (existing >= 0) {
        const updated = [...state.items];
        updated[existing] = {
          ...updated[existing],
          quantity: updated[existing].quantity + action.quantity,
        };
        return { ...state, items: updated, isOpen: true };
      }
      return {
        ...state,
        items: [...state.items, { product: action.product, variant: action.variant, quantity: action.quantity }],
        isOpen: true,
      };
    }
    case 'REMOVE':
      return { ...state, items: state.items.filter((i) => i.variant.id !== action.variantId) };
    case 'UPDATE_QTY': {
      if (action.quantity <= 0) {
        return { ...state, items: state.items.filter((i) => i.variant.id !== action.variantId) };
      }
      return {
        ...state,
        items: state.items.map((i) =>
          i.variant.id === action.variantId ? { ...i, quantity: action.quantity } : i,
        ),
      };
    }
    case 'CLEAR':
      return { ...state, items: [] };
    case 'OPEN':
      return { ...state, isOpen: true };
    case 'CLOSE':
      return { ...state, isOpen: false };
    default:
      return state;
  }
}

interface CartContextValue {
  items: CartItem[];
  isOpen: boolean;
  addItem: (product: Product, variant: ProductVariant, quantity?: number) => void;
  removeItem: (variantId: number) => void;
  updateQty: (variantId: number, quantity: number) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  total: number;
  itemCount: number;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [], isOpen: false });
  // Evita guardar el estado vacío inicial en localStorage antes de hidratar.
  const hydrated = useRef(false);

  // 1) Al montar (solo en el navegador), carga el carrito guardado.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(CART_STORAGE_KEY);
      if (raw) {
        const items = JSON.parse(raw) as CartItem[];
        if (Array.isArray(items) && items.length > 0) {
          dispatch({ type: 'HYDRATE', items });
        }
      }
    } catch {
      /* almacenamiento no disponible o datos corruptos: se ignora */
    }
    hydrated.current = true;
  }, []);

  // 2) Cada vez que cambian los items, los guarda (tras la hidratación inicial).
  useEffect(() => {
    if (!hydrated.current) return;
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state.items));
    } catch {
      /* si el almacenamiento falla (modo privado, lleno), no rompe la app */
    }
  }, [state.items]);

  const value: CartContextValue = {
    items: state.items,
    isOpen: state.isOpen,
    addItem: (product, variant, quantity = 1) =>
      dispatch({ type: 'ADD', product, variant, quantity }),
    removeItem: (variantId) => dispatch({ type: 'REMOVE', variantId }),
    updateQty: (variantId, quantity) => dispatch({ type: 'UPDATE_QTY', variantId, quantity }),
    clearCart: () => dispatch({ type: 'CLEAR' }),
    openCart: () => dispatch({ type: 'OPEN' }),
    closeCart: () => dispatch({ type: 'CLOSE' }),
    total: state.items.reduce((sum, i) => {
      const price = effectivePrice(i.product, i.variant);
      return sum + price * i.quantity;
    }, 0),
    itemCount: state.items.reduce((sum, i) => sum + i.quantity, 0),
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}
