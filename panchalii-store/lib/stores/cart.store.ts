'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiPost, apiGet } from '../api';

export interface CartProduct {
  _id: string;
  name: string;
  price: number;
  mrp?: number;
  images: string[];
  slug: string;
  inStock: boolean;
}

export interface CartItem {
  product: CartProduct;
  qty: number;
}

interface CartState {
  items: CartItem[];
  guestToken: string | null;
  isOpen: boolean;
  addItem: (productId: string, qty?: number) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  updateQty: (productId: string, qty: number) => Promise<void>;
  loadCart: () => Promise<void>;
  mergeCart: () => Promise<void>;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  itemCount: () => number;
  subtotal: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      guestToken: null,
      isOpen: false,

      addItem: async (productId, qty = 1) => {
        const { guestToken } = get();
        const res = await apiPost<{ data: { items: CartItem[] }; guestToken?: string }>(
          '/public/cart/add',
          { productId, qty, guestToken }
        );
        set({ items: res.data.items, guestToken: res.guestToken || guestToken, isOpen: true });
      },

      removeItem: async (productId) => {
        const { guestToken } = get();
        const res = await apiPost<{ data: { items: CartItem[] } }>(
          '/public/cart/remove',
          { productId, guestToken }
        );
        set({ items: res.data.items });
      },

      updateQty: async (productId, qty) => {
        const { guestToken } = get();
        const res = await apiPost<{ data: { items: CartItem[] } }>(
          '/public/cart/update',
          { productId, qty, guestToken }
        );
        set({ items: res.data.items });
      },

      loadCart: async () => {
        const { guestToken } = get();
        if (!guestToken) return;
        try {
          const res = await apiGet<{ data: { items: CartItem[] } }>(`/public/cart/${guestToken}`);
          set({ items: res.data?.items || [] });
        } catch { /* silent */ }
      },

      mergeCart: async () => {
        const { guestToken } = get();
        if (!guestToken) return;
        try {
          const res = await apiPost<{ data: { items: CartItem[] } }>('/me/cart/merge', { guestToken });
          set({ items: res.data?.items || [], guestToken: null });
        } catch { /* silent */ }
      },

      clearCart: () => set({ items: [], guestToken: null }),

      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),

      itemCount: () => get().items.reduce((sum, i) => sum + i.qty, 0),
      subtotal: () => get().items.reduce((sum, i) => sum + i.product.price * i.qty, 0),
    }),
    { name: 'panchalii-cart', partialize: (s: CartState) => ({ items: s.items, guestToken: s.guestToken }) }
  )
);
