import type { Metadata, Viewport } from 'next';
import { DM_Sans, Playfair_Display } from 'next/font/google';
import { Providers } from '@/components/providers';
import './globals.css';

const dmSans = DM_Sans({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-dm-sans', display: 'swap' });
const playfair = Playfair_Display({ subsets: ['latin'], weight: ['500', '600', '700'], variable: '--font-playfair', display: 'swap' });

const description =
  'Overcomers Ministry of Believers Fellowship — a Christ-centred community growing in faith, fellowship, and service.';

export const metadata: Metadata = {
  metadataBase: process.env.NEXT_PUBLIC_SITE_URL ? new URL(process.env.NEXT_PUBLIC_SITE_URL) : undefined,
  title: {
    default: 'Overcomers Ministry of Believers Fellowship',
    template: '%s · Overcomers Ministry',
  },
  description,
  robots: { index: true, follow: true },
  icons: { icon: '/overcomers-logo.jpg' },
  openGraph: {
    title: 'Overcomers Ministry of Believers Fellowship',
    description,
    type: 'website',
    images: ['/overcomers-logo.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Overcomers Ministry of Believers Fellowship',
    description,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${dmSans.variable} ${playfair.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
