'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiPost, apiGet } from '../api';
import { useAuthStore } from './auth.store';

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

      // The server cart is the source of truth: it carries current names and
      // prices, so admin edits and price changes reach the bag.
      loadCart: async () => {
        const { guestToken } = get();
        const signedIn = useAuthStore.getState().isAuthenticated;
        try {
          let items: CartItem[] | undefined;
          if (signedIn) {
            const res = guestToken
              ? await apiPost<{ data: { items: CartItem[] } }>('/me/cart/merge', { guestToken })
              : await apiGet<{ data: { items: CartItem[] } }>('/me/cart');
            items = res.data?.items;
            set({ guestToken: null });
          } else if (guestToken) {
            items = (await apiGet<{ data: { items: CartItem[] } }>(`/public/cart/${guestToken}`)).data?.items;
          } else {
            return;
          }
          set({ items: (items || []).filter((i) => i.product?._id) });
        } catch { /* keep the local copy if the network fails */ }
      },

      mergeCart: () => get().loadCart(),

      clearCart: () => set({ items: [], guestToken: null }),

      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),

      itemCount: () => get().items.reduce((sum, i) => sum + i.qty, 0),
      subtotal: () => get().items.reduce((sum, i) => sum + i.product.price * i.qty, 0),
    }),
    { name: 'panchalii-cart', partialize: (s: CartState) => ({ items: s.items, guestToken: s.guestToken }) }
  )
);

// Signing out must not leave the previous customer's bag in this browser.
if (typeof window !== 'undefined') {
  useAuthStore.subscribe((state, prev) => {
    if (prev.isAuthenticated && !state.isAuthenticated) useCartStore.getState().clearCart();
  });
}
