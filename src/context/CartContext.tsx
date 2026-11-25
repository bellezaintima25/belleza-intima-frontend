'use client';

import React, { createContext, useContext, useReducer, useEffect, useRef, ReactNode } from 'react';
import type { Combo, Product, ProductVariant } from '@/lib/api';
import { effectivePrice, getImageForColor } from '@/lib/api';

// Claves de almacenamiento del carrito en el navegador. Los productos conservan su formato
// de siempre (un arreglo); los combos van aparte, así los carritos ya guardados siguen valiendo.
const CART_STORAGE_KEY = 'belleza-intima-cart';
const COMBOS_STORAGE_KEY = 'belleza-intima-cart-combos';

export interface CartItem {
  product: Product;
  variant: ProductVariant;
  quantity: number;
}

/** Un producto de un combo del carrito, con la talla y el color ya elegidos. */
export interface CartComboItem {
  productId: number;
  name: string;
  quantity: number;     // unidades de este producto por cada combo
  size: string;
  color: string;
  image: string | null;
  unitPrice: number;    // precio unitario dentro del combo
  stock: number;        // existencias de la variante elegida (al momento de agregar)
}

/** Un combo en el carrito (versión liviana: solo lo necesario para mostrarlo y pedirlo). */
export interface CartCombo {
  lineId: string;       // combo + elecciones: el mismo combo con otras tallas es otra línea
  comboId: number;
  name: string;
  image: string | null;
  finalPrice: number;   // precio del combo (por unidad)
  originalPrice: number;
  quantity: number;
  items: CartComboItem[];
}

/** Máximo de combos iguales que alcanzan con las existencias de las piezas elegidas. */
export function maxComboQty(c: CartCombo): number {
  const caps = c.items.map((i) => Math.floor(i.stock / Math.max(1, i.quantity)));
  return Math.max(1, Math.min(10, ...caps));
}

/** Arma la línea del carrito a partir de un combo y las tallas/colores elegidos. */
export function buildCartCombo(
  combo: Combo,
  selections: Record<number, { size: string | null; color: string | null }>,
  quantity = 1,
): CartCombo {
  const items: CartComboItem[] = combo.items.map((it) => {
    const sel = selections[it.product_id] ?? { size: null, color: null };
    const variant = it.product?.variants?.find((v) => v.size === sel.size && v.color === sel.color) ?? null;
    return {
      productId: it.product_id,
      name: it.product?.name ?? 'Producto',
      quantity: it.quantity,
      size: sel.size ?? '',
      color: sel.color ?? '',
      image: it.product ? getImageForColor(it.product.images, sel.color ?? undefined) : null,
      unitPrice: it.unit_price,
      stock: variant ? variant.stock : 0,
    };
  });
  const key = items.map((i) => `${i.productId}:${i.size}:${i.color}`).sort().join('|');
  return {
    lineId: `${combo.id}|${key}`,
    comboId: combo.id,
    name: combo.name,
    image: combo.image_url ?? combo.images?.[0]?.url ?? items.find((i) => i.image)?.image ?? null,
    finalPrice: combo.final_price,
    originalPrice: combo.original_price,
    quantity,
    items,
  };
}

interface CartState {
  items: CartItem[];
  combos: CartCombo[];
  isOpen: boolean;
}

type CartAction =
  | { type: 'ADD'; product: Product; variant: ProductVariant; quantity: number }
  | { type: 'REMOVE'; variantId: number }
  | { type: 'UPDATE_QTY'; variantId: number; quantity: number }
  | { type: 'ADD_COMBO'; combo: CartCombo }
  | { type: 'REMOVE_COMBO'; lineId: string }
  | { type: 'UPDATE_COMBO_QTY'; lineId: string; quantity: number }
  | { type: 'CLEAR' }
  | { type: 'OPEN' }
  | { type: 'CLOSE' }
  | { type: 'HYDRATE'; items: CartItem[] }
  | { type: 'HYDRATE_COMBOS'; combos: CartCombo[] };

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'HYDRATE':
      // Reemplaza los items con los guardados en el navegador (sin abrir el drawer).
      return { ...state, items: action.items };
    case 'HYDRATE_COMBOS':
      return { ...state, combos: action.combos };
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
    case 'ADD_COMBO': {
      const existing = state.combos.findIndex((c) => c.lineId === action.combo.lineId);
      if (existing >= 0) {
        const updated = [...state.combos];
        const merged = { ...updated[existing], quantity: updated[existing].quantity + action.combo.quantity };
        updated[existing] = { ...merged, quantity: Math.min(merged.quantity, maxComboQty(merged)) };
        return { ...state, combos: updated, isOpen: true };
      }
      return { ...state, combos: [...state.combos, action.combo], isOpen: true };
    }
    case 'REMOVE_COMBO':
      return { ...state, combos: state.combos.filter((c) => c.lineId !== action.lineId) };
    case 'UPDATE_COMBO_QTY': {
      if (action.quantity <= 0) {
        return { ...state, combos: state.combos.filter((c) => c.lineId !== action.lineId) };
      }
      return {
        ...state,
        combos: state.combos.map((c) => (c.lineId === action.lineId ? { ...c, quantity: action.quantity } : c)),
      };
    }
    case 'CLEAR':
      return { ...state, items: [], combos: [] };
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
  combos: CartCombo[];
  isOpen: boolean;
  addItem: (product: Product, variant: ProductVariant, quantity?: number) => void;
  removeItem: (variantId: number) => void;
  updateQty: (variantId: number, quantity: number) => void;
  addCombo: (combo: Combo, selections: Record<number, { size: string | null; color: string | null }>, quantity?: number) => void;
  removeCombo: (lineId: string) => void;
  updateComboQty: (lineId: string, quantity: number) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  total: number;
  itemCount: number;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [], combos: [], isOpen: false });
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
    try {
      const rawCombos = localStorage.getItem(COMBOS_STORAGE_KEY);
      if (rawCombos) {
        const combos = JSON.parse(rawCombos) as CartCombo[];
        // Solo se aceptan líneas con la forma esperada (evita romper la tienda con datos viejos).
        const valid = Array.isArray(combos)
          ? combos.filter((c) => c && typeof c.lineId === 'string' && Array.isArray(c.items) && c.quantity > 0)
          : [];
        if (valid.length > 0) dispatch({ type: 'HYDRATE_COMBOS', combos: valid });
      }
    } catch {
      /* se ignora */
    }
    hydrated.current = true;
  }, []);

  // 2) Cada vez que cambian, los guarda (tras la hidratación inicial).
  useEffect(() => {
    if (!hydrated.current) return;
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state.items));
    } catch {
      /* si el almacenamiento falla (modo privado, lleno), no rompe la app */
    }
  }, [state.items]);

  useEffect(() => {
    if (!hydrated.current) return;
    try {
      localStorage.setItem(COMBOS_STORAGE_KEY, JSON.stringify(state.combos));
    } catch {
      /* igual que arriba */
    }
  }, [state.combos]);

  const value: CartContextValue = {
    items: state.items,
    combos: state.combos,
    isOpen: state.isOpen,
    addItem: (product, variant, quantity = 1) =>
      dispatch({ type: 'ADD', product, variant, quantity }),
    removeItem: (variantId) => dispatch({ type: 'REMOVE', variantId }),
    updateQty: (variantId, quantity) => dispatch({ type: 'UPDATE_QTY', variantId, quantity }),
    addCombo: (combo, selections, quantity = 1) =>
      dispatch({ type: 'ADD_COMBO', combo: buildCartCombo(combo, selections, quantity) }),
    removeCombo: (lineId) => dispatch({ type: 'REMOVE_COMBO', lineId }),
    updateComboQty: (lineId, quantity) => dispatch({ type: 'UPDATE_COMBO_QTY', lineId, quantity }),
    clearCart: () => dispatch({ type: 'CLEAR' }),
    openCart: () => dispatch({ type: 'OPEN' }),
    closeCart: () => dispatch({ type: 'CLOSE' }),
    total:
      state.items.reduce((sum, i) => sum + effectivePrice(i.product, i.variant) * i.quantity, 0) +
      state.combos.reduce((sum, c) => sum + c.finalPrice * c.quantity, 0),
    itemCount:
      state.items.reduce((sum, i) => sum + i.quantity, 0) +
      state.combos.reduce((sum, c) => sum + c.quantity, 0),
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}
