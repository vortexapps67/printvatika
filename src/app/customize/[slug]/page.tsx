import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { DbClient } from '../../../lib/db';
import { money, unitQuote } from '../../../lib/catalog';
import { ProductCustomizer } from '../../../components/ProductCustomizer';

export const revalidate = 0; // Fresh DB specifications on each hit

interface CustomizePageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata({ params }: CustomizePageProps): Promise<Metadata> {
  const product = await DbClient.getProductBySlug(params.slug);
  if (!product) {
    return {
      title: 'Product Customizer | Print Vatika',
      description: 'Configure and order commercial printing products with instant online proofs.',
    };
  }

  const quote = unitQuote(product);
  const startingAt = quote.isQuote
    ? 'quoted on request'
    : quote.isArea
      ? `${money(quote.amount)} per sq ft`
      : quote.qty > 1
        ? `${money(quote.amount)} for ${quote.qty} pieces`
        : `${money(quote.amount)} each`;

  const title = `${product.name} Custom Printing & Instant 2D Proofs | Print Vatika`;
  const description = `Order custom ${product.name} online from Print Vatika. ${product.description} ${
    quote.isQuote
      ? 'Priced on request — send us the job and we will quote it.'
      : `Starting at ${startingAt}.`
  } Instant online configuration, wholesale pricing, and doorstep delivery across India.`;

  return {
    title,
    description,
    keywords: [
      product.name,
      `${product.name} printing`,
      `${product.name} Delhi`,
      'custom printing',
      product.category,
      'Print Vatika'
    ],
    openGraph: {
      title,
      description,
      url: `https://printvatika.vercel.app/customize/${product.slug}`,
      images: [
        {
          url: product.image_url,
          width: 800,
          height: 600,
          alt: product.name,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [product.image_url],
    },
    alternates: {
      canonical: `https://printvatika.vercel.app/customize/${product.slug}`,
    },
  };
}

export default async function CustomizePage({ params }: CustomizePageProps) {
  const { slug } = params;

  // Retrieve details in parallel
  const [product, options, pricingRules] = await Promise.all([
    DbClient.getProductBySlug(slug),
    DbClient.getProductOptions(slug),
    DbClient.getPricingRules(slug)
  ]);

  if (!product) {
    notFound();
  }

  const quote = unitQuote(product);

  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: product.image_url,
    description: product.description,
    category: product.category,
    sku: product.id,
    /* A bespoke job has no catalogue price, so it carries no Offer at all —
       publishing one at ₹0 would read as "free" to a crawler. */
    ...(quote.isQuote
      ? {}
      : {
          offers: {
            '@type': 'Offer',
            price: quote.amount,
            priceCurrency: 'INR',
            /* What that price actually buys — ₹299 is for 100 pieces, and ₹15 is
               for one square foot. Without this a crawler reads ₹2.99 as one card. */
            eligibleQuantity: {
              '@type': 'QuantitativeValue',
              value: quote.qty,
              unitText: quote.isArea ? 'square foot' : 'piece'
            },
            availability: 'https://schema.org/InStock',
            seller: {
              '@type': 'PrintShop',
              name: 'Print Vatika'
            }
          }
        })
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <ProductCustomizer
          product={product}
          options={options}
          pricingRules={pricingRules}
        />
      </div>
    </>
  );
}
