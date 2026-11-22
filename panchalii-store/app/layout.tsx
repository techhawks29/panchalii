import type { Metadata } from 'next';
import { Cormorant_Garamond, Instrument_Sans } from 'next/font/google';
import './globals.css';
import Providers from './providers';
import Header from '../components/Header';
import Footer from '../components/Footer';
import CartDrawer from '../components/CartDrawer';
import EntryCurtain from '../components/EntryCurtain';
import { ENTRY_SEEN_KEY } from '../lib/entry';

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
});

const instrumentSans = Instrument_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

export const metadata: Metadata = {
  title: { default: 'Panchalii — Handcrafted Sarees', template: '%s | Panchalii' },
  description: 'Discover our collection of handcrafted silk and handloom sarees.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  openGraph: {
    siteName: 'Panchalii',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${cormorant.variable} ${instrumentSans.variable}`} suppressHydrationWarning>
      <head>
        {/* Decide before first paint whether the entry curtain plays, so returning visitors never see it flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var r=document.documentElement;if(sessionStorage.getItem('${ENTRY_SEEN_KEY}')==='1'||matchMedia('(prefers-reduced-motion: reduce)').matches){r.classList.add('entry-skip')}else{r.classList.add('entry-playing')}}catch(e){}`,
          }}
        />
      </head>
      <body className="font-body bg-surface text-on-surface min-h-screen flex flex-col">
        <Providers>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
          <CartDrawer />
        </Providers>
        <EntryCurtain />
      </body>
    </html>
  );
}
