import Link from 'next/link';
import type { ReactNode } from 'react';
import BrandMark from './BrandMark';
import { DiamondRule } from './ui';

// Same wine velvet folds as the entry curtain, as a static backdrop
const VELVET =
  'linear-gradient(180deg, rgba(0,0,0,0.35) 0%, transparent 25%, transparent 65%, rgba(0,0,0,0.65) 100%), ' +
  'repeating-linear-gradient(90deg, #1c080b 0px, #34121a 14px, #4f1f27 38px, #5b2a30 50px, #46191f 66px, #2a0d13 86px, #1c080b 100px)';

export default function AuthShell({ eyebrow, title, children, footer }: { eyebrow: string; title: string; children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="min-h-[calc(100vh-72px)] flex items-center justify-center px-4 py-14" style={{ background: VELVET }}>
      <div className="w-full max-w-md">
        <Link href="/" className="flex flex-col items-center mb-8" aria-label="Panchalii home">
          <BrandMark className="h-[120px] w-auto" />
          <p className="label-eyebrow mt-4">{eyebrow}</p>
        </Link>
        <div className="bg-[#0F1A0F]/95 border border-[rgba(201,169,110,0.25)] backdrop-blur-sm px-7 sm:px-10 py-10 shadow-2xl shadow-black/50">
          <h1 className="font-display text-cream text-3xl text-center">{title}</h1>
          <DiamondRule className="mt-3 mb-8" />
          {children}
        </div>
        {footer && <div className="text-center mt-6">{footer}</div>}
        <p className="text-center text-[9px] uppercase tracking-[0.3em] text-cream/30 mt-8">Timeless · Ethical · Exquisite</p>
      </div>
    </div>
  );
}
