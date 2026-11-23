// Ask the storefront to rebuild its cached (ISR) pages after catalogue changes.
const revalidateStorefront = (paths = ['/']) => {
  const base = process.env.FRONTEND_URL;
  const secret = process.env.REVALIDATE_SECRET;
  if (!base || !secret) return;
  fetch(`${base}/api/revalidate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-revalidate-secret': secret },
    body: JSON.stringify({ paths }),
    signal: AbortSignal.timeout(5000),
  }).catch((err) => console.warn('[storefront] revalidate failed:', err.message));
};

module.exports = { revalidateStorefront };
