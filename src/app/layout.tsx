import React from 'react';
import type { Metadata } from 'next';
import Script from 'next/script';
import { Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { CartProvider } from '../context/CartContext';
import { AuthProvider } from '../context/AuthContext';
import { Navbar } from '../components/Navbar';
import { AnnouncementBar } from '../components/AnnouncementBar';
import { MobileBottomNav } from '../components/MobileBottomNav';
import { PwaInstallPrompt } from '../components/PwaInstallPrompt';
import { Footer } from '../components/Footer';
import { SITE } from '../lib/site';

/* Display + body: Plus Jakarta Sans — premium, modern, geometric. */
const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
});

/* Specs and data: JetBrains Mono — every measurement, price and order ref. */
const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
  weight: ['400', '500', '600'],
});

/* Describes public/og.png. Kept here so the alt text matches the artwork. */
const OG_ALT =
  'Print Vatika — commercial printing press near Saket Metro, New Delhi. 300 DPI, offset and digital, 24-48 hour dispatch, free store pickup.';

export const metadata: Metadata = {
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Print Vatika',
  },
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
    <html lang="en-IN" className={`${jakarta.variable} ${jetbrainsMono.variable}`}>
      <head>
        <meta name="theme-color" content="#1e40af" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <link rel="apple-touch-icon" href="/images/logo-mark.png" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </head>
      <body className="flex min-h-screen flex-col">
        {/* Load Razorpay Checkout SDK for fast, seamless online payments */}
        <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-primary-600 focus:px-4 focus:py-2 focus:font-mono focus:text-label focus:text-white"
        >
          Skip to content
        </a>
        <AuthProvider>
          <CartProvider>
            <AnnouncementBar />
            <Navbar />
            <main id="main" className="flex-grow pb-24 md:pb-8">
              {children}
            </main>
            <Footer />
            <MobileBottomNav />
            <PwaInstallPrompt />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}