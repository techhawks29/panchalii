'use client';
import { Suspense, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiGet } from '../../lib/api';
import ProductCard from '../../components/ProductCard';
import SkeletonCard from '../../components/SkeletonCard';
import { DiamondRule, EmptyState, icons } from '../../components/ui';

interface Product {
  _id: string; name: string; slug: string; price: number; mrp?: number; images: string[];
  fabric?: string; colour?: { name: string; hex: string }; isNew?: boolean; inStock?: boolean;
}
interface ProductsResponse { data: Product[]; pagination: { total: number; page: number; pages: number } }
interface Category { _id: string; name: string; slug: string; parentCategory?: string | null }

const SORTS = [
  { value: '', label: 'Newest' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'popular', label: 'Most loved' },
];
// Broad terms: the API matches fabric by "contains", so "Silk" covers Pure, Katan, Crepe and Tissue silk
const FABRICS = ['Silk', 'Cotton', 'Organza', 'Georgette'];
const OCCASIONS = ['Wedding', 'Festival', 'Reception', 'Party', 'Office', 'Casual'];
const PRICES = [
  { value: '', label: 'Any price' },
  { value: '0-5000', label: 'Under ₹5,000' },
  { value: '5000-10000', label: '₹5,000 – ₹10,000' },
  { value: '10000-20000', label: '₹10,000 – ₹20,000' },
  { value: '20000-', label: 'Above ₹20,000' },
];

function ShopContent() {
  const sp = useSearchParams();
  const router = useRouter();
  const [filtersOpen, setFiltersOpen] = useState(false);

  const category = sp.get('category') || '';
  const fabric = sp.get('fabric') || '';
  const occasion = sp.get('occasion') || '';
  const price = sp.get('price') || '';
  const sort = sp.get('sort') || '';
  const q = sp.get('q') || '';
  const featured = sp.get('featured') || '';
  const page = Math.max(1, Number(sp.get('page')) || 1);
  const [search, setSearch] = useState(q);
  useEffect(() => setSearch(q), [q]);

  const params = new URLSearchParams();
  if (category) params.set('category', category);
  if (fabric) params.set('fabric', fabric);
  if (occasion) params.set('occasion', occasion);
  if (sort) params.set('sort', sort);
  if (q) params.set('q', q);
  if (featured) params.set('featured', featured);
  if (price) {
    const [min, max] = price.split('-');
    if (min) params.set('minPrice', min);
    if (max) params.set('maxPrice', max);
  }
  params.set('page', String(page));
  params.set('limit', '12');

  const { data, isLoading, isError, refetch } = useQuery<ProductsResponse>({
    queryKey: ['products', params.toString()],
    queryFn: () => apiGet(`/public/products?${params.toString()}`),
    placeholderData: (prev) => prev,
  });
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => apiGet<{ data: Category[] }>('/public/categories').then((r) => r.data.filter((c) => !c.parentCategory)),
    staleTime: 5 * 60_000,
  });

  const setParam = (key: string, value: string) => {
    const p = new URLSearchParams(sp.toString());
    if (value) p.set(key, value); else p.delete(key);
    if (key !== 'page') p.delete('page');
    router.push(`/shop${p.toString() ? `?${p}` : ''}`, { scroll: key === 'page' });
  };

  const activeCategory = categories.find((c) => c.slug === category || c._id === category);
  const title = q ? `“${q}”` : featured ? 'Best Sellers' : sort === 'newest' ? 'New Arrivals' : activeCategory?.name ?? 'All Sarees';
  const active = [
    activeCategory && { key: 'category', label: activeCategory.name },
    fabric && { key: 'fabric', label: fabric },
    occasion && { key: 'occasion', label: occasion },
    price && { key: 'price', label: PRICES.find((p) => p.value === price)?.label ?? price },
    featured && { key: 'featured', label: 'Best sellers' },
    q && { key: 'q', label: `Search: ${q}` },
  ].filter(Boolean) as { key: string; label: string }[];

  return (
    <div>
      <section className="bg-[#0F1A0F] border-b border-[rgba(201,169,110,0.15)] py-14 px-6 text-center">
        <p className="label-eyebrow mb-3">{q ? 'Search results' : 'The collection'}</p>
        <h1 className="font-display font-light text-cream text-5xl md:text-6xl">{title}</h1>
        <DiamondRule className="mt-4" />
        <form
          onSubmit={(e) => { e.preventDefault(); setParam('q', search.trim()); }}
          className="max-w-xl mx-auto mt-8 flex border border-[rgba(201,169,110,0.4)] focus-within:border-gold"
          role="search"
        >
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search silk, banarasi, kanjivaram…"
            aria-label="Search sarees"
            className="flex-1 bg-transparent px-4 py-3 text-sm text-cream placeholder-cream-muted/50 focus:outline-none"
          />
          <button type="submit" className="px-5 text-gold hover:text-gold-light" aria-label="Search">{icons.search}</button>
        </form>
      </section>

      <div className="max-w-7xl mx-auto px-5 md:px-6 py-10">
        <div className="flex flex-wrap items-center gap-3 mb-8 pb-5 border-b border-[rgba(201,169,110,0.15)]">
          <p className="text-[10px] uppercase tracking-[0.25em] text-cream-muted mr-auto">
            {data ? `${data.pagination.total} ${data.pagination.total === 1 ? 'saree' : 'sarees'}` : ' '}
          </p>
          <button onClick={() => setFiltersOpen((v) => !v)} className="md:hidden btn-ghost text-gold" aria-expanded={filtersOpen}>
            {filtersOpen ? 'Hide filters' : 'Filters'}{active.length ? ` (${active.length})` : ''}
          </button>
          <label className="flex items-center gap-3">
            <span className="text-[10px] uppercase tracking-[0.25em] text-cream-muted">Sort</span>
            <select value={sort} onChange={(e) => setParam('sort', e.target.value)} className="input !w-auto !py-2 text-xs uppercase tracking-[0.15em] cursor-pointer">
              {SORTS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </label>
        </div>

        {active.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            {active.map((a) => (
              <button key={a.key} onClick={() => setParam(a.key, '')} className="inline-flex items-center gap-2 border border-gold/50 text-gold text-[10px] uppercase tracking-[0.18em] px-3 py-1.5 hover:bg-gold/10">
                {a.label} <span aria-hidden="true">×</span><span className="sr-only">Remove filter</span>
              </button>
            ))}
            <button onClick={() => router.push('/shop')} className="text-[10px] uppercase tracking-[0.18em] text-cream-muted hover:text-cream px-2">Clear all</button>
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-10">
          <aside className={`${filtersOpen ? 'block' : 'hidden'} md:block md:w-52 shrink-0 space-y-8`} aria-label="Filters">
            <FilterGroup title="Collection" value={activeCategory?.slug ?? ''} options={categories.map((c) => ({ value: c.slug, label: c.name }))} onChange={(v) => setParam('category', v)} />
            <FilterGroup title="Fabric" value={fabric} options={FABRICS.map((f) => ({ value: f, label: f }))} onChange={(v) => setParam('fabric', v)} />
            <FilterGroup title="Occasion" value={occasion} options={OCCASIONS.map((o) => ({ value: o, label: o }))} onChange={(v) => setParam('occasion', v)} />
            <FilterGroup title="Price" value={price} options={PRICES.slice(1)} onChange={(v) => setParam('price', v)} />
          </aside>

          <div className="flex-1 min-w-0">
            {isError ? (
              <EmptyState icon={icons.search} title="Collection unavailable" body="Check your connection and try again." action={{ label: 'Retry', onClick: () => refetch() }} />
            ) : isLoading ? (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-5 gap-y-10">{Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}</div>
            ) : !data?.data.length ? (
              <EmptyState icon={icons.search} title="No sarees found" body="Try removing a filter or searching for something else." action={{ label: 'Clear filters', onClick: () => router.push('/shop') }} />
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-5 gap-y-10">
                {data.data.map((p) => <ProductCard key={p._id} product={p} />)}
              </div>
            )}

            {data && data.pagination.pages > 1 && (
              <nav className="flex justify-center items-center gap-2 mt-14" aria-label="Pages">
                <button disabled={page <= 1} onClick={() => setParam('page', String(page - 1))} className="px-3 h-10 text-[10px] uppercase tracking-[0.2em] text-gold disabled:opacity-30">← Prev</button>
                {Array.from({ length: data.pagination.pages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setParam('page', String(p))}
                    aria-current={page === p ? 'page' : undefined}
                    className={`w-10 h-10 text-sm border transition-colors ${page === p ? 'border-gold bg-gold text-[#0F1A0F]' : 'border-[rgba(201,169,110,0.25)] text-cream-muted hover:border-gold hover:text-gold'}`}
                  >
                    {p}
                  </button>
                ))}
                <button disabled={page >= data.pagination.pages} onClick={() => setParam('page', String(page + 1))} className="px-3 h-10 text-[10px] uppercase tracking-[0.2em] text-gold disabled:opacity-30">Next →</button>
              </nav>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function FilterGroup({ title, value, options, onChange }: { title: string; value: string; options: { value: string; label: string }[]; onChange: (v: string) => void }) {
  if (!options.length) return null;
  return (
    <fieldset>
      <legend className="text-[10px] font-semibold uppercase tracking-[0.25em] text-gold mb-3">{title}</legend>
      <div className="space-y-1">
        {options.map((o) => {
          const on = value === o.value;
          return (
            <button
              key={o.value}
              type="button"
              aria-pressed={on}
              onClick={() => onChange(on ? '' : o.value)}
              className={`flex items-center gap-3 w-full text-left py-1.5 text-sm transition-colors ${on ? 'text-cream' : 'text-cream-muted hover:text-cream'}`}
            >
              <span className={`w-2 h-2 rotate-45 border shrink-0 ${on ? 'bg-gold border-gold' : 'border-gold/40'}`} />
              {o.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

export default function ShopPage() {
  return <Suspense><ShopContent /></Suspense>;
}
