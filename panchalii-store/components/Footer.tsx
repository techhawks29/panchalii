import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-[#0F1A0F] border-t border-[rgba(201,169,110,0.15)]">
      <div className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-2 md:grid-cols-4 gap-10">
        {/* Brand */}
        <div className="col-span-2 md:col-span-1">
          <div className="mb-6">
            <p className="font-display text-gold text-xl tracking-[0.3em] font-light">PANCHALII</p>
            <p className="text-cream/30 text-[8px] tracking-[0.4em] font-body mt-0.5">— SELECT —</p>
          </div>
          <p className="text-sm text-cream/40 font-body leading-relaxed">
            Thoughtfully curated sarees and timeless pieces — bringing India's finest craftsmanship to your everyday.
          </p>
          <p className="font-display italic text-gold/40 text-2xl mt-6 leading-tight">Tradition<br/>Lives Beautifully</p>
        </div>

        <div>
          <p className="text-[9px] font-body font-medium text-cream/40 uppercase tracking-[0.3em] mb-5">SHOP</p>
          <div className="w-6 h-px bg-gold mb-5" />
          <ul className="space-y-3">
            {[['New Arrivals', '/shop?sort=newest'], ['Sarees', '/shop?category=sarees'], ['Silk', '/shop?category=silk'], ['Best Sellers', '/shop?featured=true'], ['All Collections', '/shop']].map(([l, h]) => (
              <li key={h}><Link href={h} className="text-xs text-cream/50 hover:text-gold transition-colors font-body">{l}</Link></li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-[9px] font-body font-medium text-cream/40 uppercase tracking-[0.3em] mb-5">HELP</p>
          <div className="w-6 h-px bg-gold mb-5" />
          <ul className="space-y-3">
            {[['Track Your Order', '/account/orders'], ['Shipping & Delivery', '#'], ['Returns & Exchanges', '#'], ['Size Guide', '#'], ['Contact Support', '#']].map(([l, h]) => (
              <li key={h}><Link href={h} className="text-xs text-cream/50 hover:text-gold transition-colors font-body">{l}</Link></li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-[9px] font-body font-medium text-cream/40 uppercase tracking-[0.3em] mb-5">STAY IN TOUCH</p>
          <div className="w-6 h-px bg-gold mb-5" />
          <p className="text-xs text-cream/40 font-body leading-relaxed mb-5">
            Be the first to know about new collections, exclusive offers and stories from our artisans.
          </p>
          <form className="flex gap-0 border border-[rgba(201,169,110,0.4)]">
            <input
              type="email"
              placeholder="Your email address"
              className="flex-1 bg-transparent px-3 py-2.5 text-xs text-cream/70 placeholder-cream/30 font-body focus:outline-none"
            />
            <button type="submit" className="bg-gold text-bg-dark px-4 text-xs font-body font-medium hover:bg-gold-light transition-colors">→</button>
          </form>
          <div className="flex items-center gap-4 mt-6">
            {[['IG', '#'], ['FB', '#'], ['PIN', '#'], ['YT', '#'], ['WA', '#']].map(([n, h]) => (
              <a key={n} href={h}
                className="w-7 h-7 rounded-full border border-[rgba(201,169,110,0.3)] flex items-center justify-center text-cream/40 hover:border-gold hover:text-gold transition-colors text-[9px] font-body">
                {n}
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-[rgba(201,169,110,0.1)] px-6 py-5 max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-2">
        <p className="text-[10px] text-cream/25 font-body tracking-widest">© {new Date().getFullYear()} PANCHALII. ALL RIGHTS RESERVED.</p>
        <div className="flex gap-6">
          {[['Privacy Policy', '#'], ['Terms of Service', '#']].map(([l, h]) => (
            <Link key={l} href={h} className="text-[10px] text-cream/25 hover:text-gold font-body tracking-widest transition-colors">{l}</Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
