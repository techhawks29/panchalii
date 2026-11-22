const rupees = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

/** ₹18,49,900 — Indian digit grouping, no paise. */
export const inr = (v: number) => rupees.format(v);

export const piecesLabel = (n: number) => (n === 1 ? '1 piece' : `${n} pieces`);

export const dateLabel = (iso?: string | Date | null) =>
  iso ? new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

export const dateTimeLabel = (iso?: string | Date | null) =>
  iso ? new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) : '';

export const discountPercent = (price: number, mrp?: number) =>
  mrp && mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;

export const errorMessage = (err: unknown, fallback = 'Something went wrong. Please try again.') =>
  err instanceof TypeError ? "Can't reach Panchalii right now. Check your connection and try again." : err instanceof Error && err.message ? err.message : fallback;
