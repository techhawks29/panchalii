import Link from 'next/link';
import Image from 'next/image';
import ProductCard from '../components/ProductCard';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

async function getSettings() {
  try {
    const res = await fetch(`${API_URL}/v1/public/settings`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    return (await res.json()).data;
  } catch { return null; }
}

async function getFeaturedProducts() {
  try {
    const res = await fetch(`${API_URL}/v1/public/products?featured=true&limit=8&inStock=true`, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    return (await res.json()).data || [];
  } catch { return []; }
}

async function getNewArrivals() {
  try {
    const res = await fetch(`${API_URL}/v1/public/products?sort=newest&limit=4&inStock=true`, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    return (await res.json()).data || [];
  } catch { return []; }
}

const DEFAULT_CATEGORIES = [
  { name: 'Sarees', slug: 'sarees', tagline: 'Tradition in a new light.' },
  { name: 'Silk Sarees', slug: 'silk', tagline: 'Woven with heritage.' },
  { name: 'Handloom', slug: 'handloom', tagline: 'Artisan craftsmanship.' },
];

export default async function HomePage() {
  const [settings, featured, newArrivals] = await Promise.all([getSettings(), getFeaturedProducts(), getNewArrivals()]);
  const heroBanner = settings?.banners?.find((b: { position: string }) => b.position === 'home_hero');
  const categories: { _id?: string; name: string; slug?: string; image?: string; tagline?: string; description?: string }[] =
    settings?.categories?.length ? settings.categories : DEFAULT_CATEGORIES;

  return (
    <div className="bg-[#192619]">

      {/* ── Hero ── */}
      <section className="relative min-h-[90vh] flex items-end overflow-hidden">
        {heroBanner?.image ? (
          <Image src={heroBanner.image} alt={heroBanner.title || "Panchalii"} fill sizes="100vw" className="object-cover object-center" priority />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#0F1A0F] via-[#192619] to-[#2A3D2A]" />
        )}

        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0F1A0F] via-[#0F1A0F]/10 via-35% to-transparent" />
        {/* Left shade keeps the headline legible over the photo */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0F1A0F]/85 via-[#0F1A0F]/25 via-40% to-transparent to-65%" />

        {/* Side label — right */}
        <div className="absolute right-10 top-1/2 -translate-y-1/2 hidden lg:flex flex-col items-center gap-3">
          <span className="text-[#C9A96E]/50 text-[9px] font-body tracking-[0.4em] uppercase writing-mode-vertical"
            style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}>
            A HERITAGE WOVEN FOR TOMORROW
          </span>
          <div className="w-px h-20 bg-[#C9A96E]/30" />
        </div>

        {/* Content */}
        <div className="hero-copy relative z-10 max-w-7xl mx-auto px-6 pb-24 w-full">
          <p className="label-eyebrow mb-4">Tradition Meets Tomorrow</p>
          <div className="w-12 h-px bg-[#C9A96E] mb-6" />
          <h1 className="font-display font-light text-cream text-6xl md:text-8xl leading-[1.05] mb-6 max-w-2xl">
            More Than<br />Fashion
          </h1>
          <p className="font-display italic text-cream/70 text-xl md:text-2xl mb-10">A story in every drape.</p>
          <div className="flex flex-wrap gap-4">
            <Link href="/shop" className="btn-primary">
              Explore Collections →
            </Link>
            <Link href="/shop?sort=newest" className="btn-secondary">
              New Arrivals →
            </Link>
          </div>
        </div>

        {/* Bottom corner label */}
        <div className="absolute bottom-8 right-8 hidden lg:flex gap-6">
          {['TIMELESS', 'ETHICAL', 'EXQUISITE'].map((w) => (
            <span key={w} className="text-cream/30 text-[9px] font-body tracking-[0.3em]">{w}</span>
          ))}
        </div>
      </section>

      {/* ── Tagline strip ── */}
      <section className="border-y border-[rgba(201,169,110,0.2)] py-10 text-center bg-[#0F1A0F]">
        <div className="text-[#C9A96E] text-[9px] font-body tracking-[0.3em] uppercase mb-3">◆</div>
        <p className="font-display text-cream text-lg md:text-xl font-light tracking-wide">
          Fresh silhouettes. Timeless craftsmanship. Made for you.
        </p>
      </section>

      {/* ── Collection Cards (Arched) ── */}
      <section className="bg-[#192619] py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {categories.slice(0, 3).map((cat) => (
              <Link
                key={cat._id ?? cat.slug}
                href={`/shop?category=${cat.slug ?? cat._id}`}
                className="group relative overflow-hidden bg-[#0F1A0F] block"
                style={{ borderRadius: '50% 50% 4px 4px / 20% 20% 4px 4px' }}
              >
                <div className="aspect-[3/4] relative">
                  {cat.image ? (
                    <Image src={cat.image} alt={cat.name} fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-b from-[#2A3D2A] to-[#0F1A0F]" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0F1A0F] via-[#0F1A0F]/20 to-transparent" />

                  {/* Gold arch border */}
                  <div className="absolute inset-0 border border-[rgba(201,169,110,0.3)] pointer-events-none"
                    style={{ borderRadius: '50% 50% 4px 4px / 20% 20% 4px 4px' }} />

                  <div className="absolute bottom-10 left-0 right-0 text-center px-6">
                    <p className="label-eyebrow mb-2">New Collection</p>
                    <h3 className="font-display text-cream text-3xl md:text-4xl font-semibold uppercase tracking-widest">{cat.name}</h3>
                    <p className="text-cream/60 font-body text-sm mt-2">{cat.tagline ?? cat.description ?? 'Discover the collection.'}</p>
                    <div className="mt-4 inline-flex items-center gap-2 border border-[rgba(201,169,110,0.5)] text-gold text-[10px] uppercase tracking-[0.25em] font-body px-5 py-2">
                      Explore →
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Kalakaari / Featured Editorial ── */}
      <section className="bg-[#0F1A0F] py-20 px-6 relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <p className="label-eyebrow mb-3">Discover</p>
            <h2 className="font-display text-cream text-4xl md:text-6xl font-light uppercase tracking-[0.15em]">Panchalii Collection</h2>
            <div className="text-[#C9A96E] text-sm mt-2">◆</div>
            <p className="text-cream/50 font-body text-sm mt-3 tracking-widest">Art. Culture. Craftsmanship. Woven into every story.</p>
          </div>

          {/* Side labels */}
          <div className="hidden lg:flex absolute left-6 top-1/2 -translate-y-1/2 flex-col items-center gap-4">
            {['ROOTED', 'IN INDIAN', 'ARTISTRY'].map((w) => (
              <span key={w} className="text-cream/20 text-[8px] font-body tracking-[0.4em]">{w}</span>
            ))}
          </div>

          {featured.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {featured.map((p: { _id: string; name: string; slug: string; price: number; mrp?: number; images: string[]; fabric?: string }) => (
                <ProductCard key={p._id} product={p} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-cream/30 font-body text-sm uppercase tracking-widest">Collection coming soon</p>
            </div>
          )}

          <div className="text-center mt-10">
            <Link href="/shop?featured=true" className="btn-primary">View All Collections →</Link>
          </div>
        </div>
      </section>

      {/* ── New Arrivals ── */}
      {newArrivals.length > 0 && (
        <section className="bg-[#192619] py-20 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-end justify-between mb-10">
              <div>
                <p className="label-eyebrow mb-2">Just In</p>
                <h2 className="font-display text-cream text-4xl md:text-5xl font-light">New Arrivals</h2>
              </div>
              <Link href="/shop?sort=newest" className="btn-ghost text-gold">View all →</Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {newArrivals.map((p: { _id: string; name: string; slug: string; price: number; mrp?: number; images: string[]; fabric?: string }) => (
                <ProductCard key={p._id} product={p} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Brand values ── */}
      <section className="bg-[#0F1A0F] border-t border-[rgba(201,169,110,0.15)] py-16 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-gold/60 text-[9px] font-body tracking-[0.4em] mb-6">◆</p>
          <p className="label-eyebrow mb-2">More Than Fashion</p>
          <p className="label-eyebrow">A Feeling</p>
          <div className="w-px h-12 bg-[rgba(201,169,110,0.3)] mx-auto my-8" />
          <p className="text-cream/50 font-body text-sm max-w-md mx-auto leading-relaxed">
            Rooted in tradition. Woven for tomorrow.<br />
            Thank you for being a part of our story.
          </p>
        </div>
      </section>

      {/* ── Trust ── */}
      <section className="bg-[#192619] border-t border-[rgba(201,169,110,0.15)] py-12 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { title: 'Free Shipping', desc: 'On orders above ₹999' },
            { title: 'Authentic Weaves', desc: 'Directly from weavers' },
            { title: 'Easy Returns', desc: '7-day return policy' },
            { title: 'Secure Payment', desc: 'Razorpay secured' },
          ].map((b) => (
            <div key={b.title}>
              <div className="w-6 h-px bg-gold mx-auto mb-3" />
              <p className="font-body text-xs text-cream uppercase tracking-[0.2em] mb-1">{b.title}</p>
              <p className="text-xs text-cream/40 font-body">{b.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
