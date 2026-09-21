import type { Metadata, Viewport } from 'next';
import { Fraunces, Inter } from 'next/font/google';
import './globals.css';

/* Tipografías autoalojadas por next/font: sin request a Google en runtime y
   sin salto de layout al cargar. */
const display = Fraunces({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  variable: '--font-display',
  display: 'swap',
});

const sans = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Happy Yellow Flowers Day',
  description:
    'Un día para celebrar la luz, el sol y las flores que iluminan el mundo. Plantá flores y desatá una lluvia de pétalos.',
  openGraph: {
    title: 'Happy Yellow Flowers Day',
    description: 'Plantá flores amarillas y celebrá con una lluvia de pétalos.',
    locale: 'es_ES',
    type: 'website',
  },
};

export const viewport: Viewport = {
  themeColor: '#FAF6EE',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${display.variable} ${sans.variable}`}>
      <body>{children}</body>
    </html>
  );
}
