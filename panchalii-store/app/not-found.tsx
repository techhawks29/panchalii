import Link from 'next/link';
import { DiamondRule } from '../components/ui';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-5 py-20 text-center">
      <div className="max-w-md">
        <p className="label-eyebrow">Error 404</p>
        <h1 className="font-display font-light text-cream text-5xl md:text-6xl mt-3">Lost the Thread</h1>
        <DiamondRule className="mt-5" />
        <p className="text-cream-muted leading-relaxed mt-6">The page you&apos;re looking for has moved or no longer exists.</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-10">
          <Link href="/shop" className="btn-secondary">Shop sarees →</Link>
          <Link href="/" className="btn-primary">Back home</Link>
        </div>
      </div>
    </div>
  );
}
