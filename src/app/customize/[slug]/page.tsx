import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { DbClient } from '../../../lib/db';
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

  const title = `${product.name} Custom Printing & Instant 2D Proofs | Print Vatika`;
  const description = `Order custom ${product.name} online from Print Vatika. ${product.description} Starting at ₹${product.base_price}. Instant online configuration, wholesale pricing, and doorstep delivery across India.`;

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

  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: product.image_url,
    description: product.description,
    category: product.category,
    sku: product.id,
    offers: {
      '@type': 'Offer',
      price: product.base_price,
      priceCurrency: 'INR',
      availability: 'https://schema.org/InStock',
      seller: {
        '@type': 'PrintShop',
        name: 'Print Vatika'
      }
    }
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
