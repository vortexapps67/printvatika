import React from 'react';
import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { CartProvider } from '../context/CartContext';
import { Navbar } from '../components/Navbar';
import { AnnouncementBar } from '../components/AnnouncementBar';
import { Footer } from '../components/Footer';
import { SITE } from '../lib/site';

/* Body + display: Inter — clean, modern e-commerce sans. */
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800', '900'],
});

/* Specs and data: JetBrains Mono — every measurement, price and order ref. */
const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

/* Describes public/og.png. Kept here so the alt text matches the artwork. */
const OG_ALT =
  'Print Vatika — commercial printing press near Saket Metro, New Delhi. 300 DPI, offset and digital, 24-48 hour dispatch, free store pickup.';

export const metadata: Metadata = {
  metadataBase: new URL('https://printvatika.vercel.app'),
  title: {
    default: 'Print Vatika | Commercial Printing Press, Saket Metro New Delhi',
    template: '%s | Print Vatika',
  },
  description:
    'Commercial printing press near Saket Metro, New Delhi. Order business cards, flex banners, custom t-shirts, flyers, brochures and stickers with live proofs. 300 DPI offset and digital printing, 24-48 hour dispatch, free store pickup.',
  keywords: [
    'printing press Delhi',
    'printing press Saket Metro',
    'business cards printing Delhi',
    'visiting card printer Lado Sarai',
    'flex banner printing New Delhi',
    'custom t shirt printing New Delhi',
    'flyer brochure printing press',
    'commercial offset printer Delhi',
    'Print Vatika',
  ],
  authors: [{ name: 'Print Vatika' }],
  creator: 'Print Vatika',
  publisher: 'Print Vatika',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://printvatika.vercel.app',
    siteName: 'Print Vatika',
    title: 'Print Vatika | Commercial Printing Press, New Delhi',
    description:
      'Configure and order business cards, flex banners, t-shirts, flyers and custom prints. Live 2D proofs, 300 DPI quality, 24-48 hour dispatch.',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: OG_ALT }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Print Vatika | Commercial Printing Press, New Delhi',
    description: 'Order custom business cards, banners, t-shirts and flyers with instant proofs.',
    images: ['/og.png'],
  },
  alternates: {
    canonical: 'https://printvatika.vercel.app',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'PrintShop',
  name: 'Print Vatika',
  url: 'https://printvatika.vercel.app',
  telephone: SITE.phoneRaw,
  email: SITE.email,
  priceRange: '₹₹',
  currenciesAccepted: 'INR',
  paymentAccepted: 'UPI, Credit Card, Debit Card, Net Banking, Cash',
  address: {
    '@type': 'PostalAddress',
    streetAddress: SITE.street,
    addressLocality: SITE.city,
    addressRegion: SITE.region,
    postalCode: SITE.pincode,
    addressCountry: 'IN',
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: 28.5244,
    longitude: 77.1955,
  },
  areaServed: [
    { '@type': 'City', name: 'New Delhi' },
    { '@type': 'AdministrativeArea', name: 'Delhi NCR' },
  ],
  openingHoursSpecification: [
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      opens: '09:00',
      closes: '20:00',
    },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </head>
      <body className="flex min-h-screen flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-ink-950 focus:px-4 focus:py-2 focus:font-mono focus:text-label focus:text-white"
        >
          Skip to content
        </a>
        <CartProvider>
          <AnnouncementBar />
          <Navbar />
          <main id="main" className="flex-grow">
            {children}
          </main>
          <Footer />
        </CartProvider>
      </body>
    </html>
  );
}