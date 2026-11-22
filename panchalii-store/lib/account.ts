'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiGet, apiPost } from './api';
import { useAuthStore } from './stores/auth.store';
import { errorMessage } from './format';

export interface Address {
  _id: string;
  label: string;
  name: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

export interface WishProduct {
  _id: string;
  name: string;
  slug: string;
  price: number;
  mrp?: number;
  images: string[];
  fabric?: string;
  inStock?: boolean;
  colour?: { name: string; hex: string };
}

export interface OrderItem { product?: { _id: string; slug?: string; images?: string[] } | string; name: string; image?: string; price: number; qty: number; lineTotal?: number }
export interface Order {
  _id: string;
  orderNumber: string;
  status: string;
  items: OrderItem[];
  address?: Omit<Address, '_id' | 'label' | 'isDefault'>;
  subtotal: number;
  couponCode?: string;
  couponDiscount?: number;
  shippingCharge: number;
  walletAmountUsed?: number;
  loyaltyPointsUsed?: number;
  total: number;
  payment?: { status: string; paidAt?: string };
  timeline?: { status: string; note?: string; at: string }[];
  trackingNumber?: string;
  createdAt: string;
}

export interface Profile { _id: string; name: string; email?: string; phone?: string; createdAt?: string; hasPassword?: boolean; loyaltyPoints?: number; walletBalance?: number }

const useSignedIn = () => useAuthStore((s) => s.isAuthenticated);

export function useProfile() {
  const signedIn = useSignedIn();
  return useQuery({ queryKey: ['profile'], queryFn: () => apiGet<{ data: Profile }>('/me/profile').then((r) => r.data), enabled: signedIn });
}

export function useAddresses() {
  const signedIn = useSignedIn();
  return useQuery({ queryKey: ['addresses'], queryFn: () => apiGet<{ data: Address[] }>('/me/addresses').then((r) => r.data), enabled: signedIn });
}

export function useOrders() {
  const signedIn = useSignedIn();
  return useQuery({ queryKey: ['orders'], queryFn: () => apiGet<{ data: Order[] }>('/me/orders?limit=50').then((r) => r.data), enabled: signedIn });
}

export function useOrder(id: string) {
  const signedIn = useSignedIn();
  return useQuery({ queryKey: ['order', id], queryFn: () => apiGet<{ data: Order }>(`/me/orders/${id}`).then((r) => r.data), enabled: signedIn && !!id });
}

export function useWishlist() {
  const signedIn = useSignedIn();
  return useQuery({
    queryKey: ['wishlist'],
    queryFn: () => apiGet<{ data: { products: WishProduct[] } }>('/me/wishlist').then((r) => r.data.products || []),
    enabled: signedIn,
  });
}

/** Wishlist membership + an optimistic toggle shared by product cards, product pages and the wishlist page. */
export function useWishlistToggle() {
  const qc = useQueryClient();
  const signedIn = useSignedIn();
  const { data = [] } = useWishlist();
  const ids = new Set(data.map((p) => p._id));

  const mutation = useMutation({
    mutationFn: (p: WishProduct) => apiPost('/me/wishlist/toggle', { productId: p._id }),
    onMutate: async (p) => {
      await qc.cancelQueries({ queryKey: ['wishlist'] });
      const before = qc.getQueryData<WishProduct[]>(['wishlist']) || [];
      qc.setQueryData<WishProduct[]>(['wishlist'], before.some((x) => x._id === p._id) ? before.filter((x) => x._id !== p._id) : [p, ...before]);
      return { before, wasSaved: before.some((x) => x._id === p._id) };
    },
    onSuccess: (_d, _p, ctx) => toast.success(ctx?.wasSaved ? 'Removed from wishlist' : 'Saved to your wishlist'),
    onError: (err, _p, ctx) => {
      if (ctx) qc.setQueryData(['wishlist'], ctx.before);
      toast.error(errorMessage(err, 'Could not update your wishlist'));
    },
  });

  return {
    signedIn,
    isSaved: (id: string) => ids.has(id),
    toggle: (p: WishProduct) => {
      if (!signedIn) {
        toast.info('Sign in to save sarees to your wishlist');
        return false;
      }
      mutation.mutate(p);
      return true;
    },
  };
}

export const addressLines = (a: Pick<Address, 'line1' | 'line2' | 'city' | 'state' | 'pincode'>) =>
  [[a.line1, a.line2].filter(Boolean).join(', '), `${a.city}, ${a.state} — ${a.pincode}`];
