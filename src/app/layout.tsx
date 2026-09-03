import React from 'react';
import type { Metadata } from 'next';
import { Outfit, Playfair_Display } from 'next/font/google';
import './globals.css';
import { CartProvider } from '../context/CartContext';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';

// Premium high-end fonts
const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  display: 'swap',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  weight: ['400', '600', '700', '800', '900'],
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://printvatika.vercel.app'),
  title: {
    default: 'Print Vatika | Commercial Printing Press & Custom Print Shop',
    template: '%s | Print Vatika'
  },
  description: 'Order premium business cards, flex banners, custom t-shirts, flyers, brochures, and stickers online. Professional digital & offset printing press near Saket Metro, New Delhi. Fast turnaround and Porter delivery.',
  keywords: [
    'printing press Delhi',
    'business cards printing',
    'visiting card printer',
    'flex banner printing Saket',
    'custom t shirt printing New Delhi',
    'flyer brochure printing press',
    'commercial offset printer',
    'Print Vatika'
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
    title: 'Print Vatika | Commercial Printing Press & Custom Print Shop',
    description: 'Configure and order premium Business Cards, Banners, T-Shirts, Flyers, and Custom Prints online. High-quality offset & digital print services at wholesale rates.',
    images: [
      {
        url: '/imgs/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Print Vatika - Commercial Printing Press',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Print Vatika | Premium Commercial Printing Press',
    description: 'Order custom business cards, t-shirts, banners, and flyers online with instant proofs.',
    images: ['/imgs/og-image.jpg'],
  },
  alternates: {
    canonical: 'https://printvatika.vercel.app',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'PrintShop',
  name: 'Print Vatika',
  image: 'https://printvatika.vercel.app/imgs/og-image.jpg',
  url: 'https://printvatika.vercel.app',
  telephone: '+919811427517',
  priceRange: '₹₹',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'F-298, Himmat Singh Marg, Near Saket Metro, Lado Sarai',
    addressLocality: 'New Delhi',
    addressRegion: 'Delhi',
    postalCode: '110030',
    addressCountry: 'IN'
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: 28.5244,
    longitude: 77.1955
  },
  openingHoursSpecification: [
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      opens: '09:00',
      closes: '20:00'
    }
  ],
  currenciesAccepted: 'INR',
  paymentAccepted: 'UPI, Credit Card, Debit Card, Net Banking, Cash'
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${outfit.variable} ${playfair.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="font-sans antialiased text-slate-800 bg-slate-50 min-h-screen flex flex-col">
        <CartProvider>
          <Navbar />
          <main className="flex-grow flex flex-col">
            {children}
          </main>
          <Footer />
        </CartProvider>
      </body>
    </html>
  );
}
