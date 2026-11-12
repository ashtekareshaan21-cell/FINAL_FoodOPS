import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { ServiceWorkerRegister } from '@/components/ServiceWorkerRegister';
import { CANONICAL_SITE_URL } from '@/lib/siteConfig';

export const viewport: Viewport = {
  themeColor: '#0b3c26',
};

export const metadata: Metadata = {
  metadataBase: new URL(CANONICAL_SITE_URL),
  title: {
    default: 'FoodOPS | Surplus Food Rescue Logistics',
    template: '%s | FoodOPS',
  },
  description:
    'Coordinating surplus food rescue between donors, verified NGOs, and volunteer riders in Pune and Pimpri-Chinchwad.',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  openGraph: {
    type: 'website',
    siteName: 'FoodOPS',
    locale: 'en_IN',
    url: CANONICAL_SITE_URL,
    title: 'FoodOPS | Surplus Food Rescue Logistics',
    description:
      'Coordinating surplus food rescue between donors, verified NGOs, and volunteer riders in Pune and Pimpri-Chinchwad.',
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'FoodOPS - Surplus food rescue, pilot in Pune',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FoodOPS | Surplus Food Rescue Logistics',
    description:
      'Coordinating surplus food rescue between donors, verified NGOs, and volunteer riders in Pune and Pimpri-Chinchwad.',
    images: ['/opengraph-image'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        {children}
        <ServiceWorkerRegister />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
