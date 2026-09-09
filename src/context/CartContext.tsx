'use client';

import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import type { Product, ProductVariant } from '@/lib/api';

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
  | { type: 'CLOSE' };

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
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
      const price = i.variant.price ?? i.product.base_price;
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
