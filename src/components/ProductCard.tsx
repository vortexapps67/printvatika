import React from 'react';
import Link from 'next/link';
import { Product } from '../types';
import { ArrowRight, Truck, Tag, Sparkles } from 'lucide-react';
import { dealUnit, money, unitQuote } from '../lib/catalog';
import type { Deal } from '../lib/catalog';
import { Ribbon } from './ui/press';
import { cn } from '@/lib/utils';

/**
 * Product card.
 *
 * Leads with the picture, the starting price and the deepest real discount,
 * because that is what someone browsing a print shop actually scans for. The
 * whole card is one link target — clicking anywhere but the button gets you
 * to the configurator, which is where the order is actually configured.
 *
 * Badges are rationed: one ribbon on the photograph (the deal, or the
 * bestseller mark when there is no deal), one line of small print under the
 * price. A card that shouts three times gets read zero times.
 */
interface ProductCardProps {
  product: Product;
  className?: string;
  /** Compact variant for dense strips; drops the description. */
  compact?: boolean;
  /** Deepest quantity-tier discount for this product, if it has one. */
  deal?: Deal;
  /** Marks the line as one of the shop's bestsellers. */
  bestseller?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  className,
  compact,
  deal,
  bestseller,
}) => {
  const href = `/customize/${product.slug}`;
  const hasDeal = Boolean(deal && deal.pct > 0);

  /* Quoted the way the shop sells it — cheapest configuration, in the shop's
     own unit ("₹299 / 100 pcs", "₹15/sqft") — so the number on the card is one
     the configurator will honour. */
  const quote = unitQuote(product);

  return (
    <article
      className={cn(
        'group relative flex h-full flex-col overflow-hidden rounded-2xl border border-ink-200/80 bg-white',
        'shadow-card transition-all duration-200 ease-press',
        'hover:-translate-y-0.5 hover:border-ink-300 hover:shadow-card-hover',
        className,
      )}
    >
      <Link href={href} className="flex h-full flex-col focus-visible:outline-none">
        {/* Image: square, uncropped-feeling, fills the card top */}
        <div className="relative aspect-square overflow-hidden bg-ink-50">
          <img
            src={product.image_url}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-500 ease-press group-hover:scale-105"
            loading="lazy"
            decoding="async"
          />
          {product.category && (
            <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 font-mono text-micro uppercase tracking-wider2 text-ink-700 shadow-sm backdrop-blur-sm">
              {product.category}
            </span>
          )}

          {/* The one ribbon on the picture: the deal if there is one, the
              bestseller mark otherwise. */}
          {hasDeal && deal ? (
            <Ribbon
              tone="accent"
              icon={<Tag size={11} aria-hidden="true" />}
              className="absolute right-3 top-3"
            >
              Save {deal.pct}%
            </Ribbon>
          ) : bestseller ? (
            <Ribbon
              tone="ink"
              icon={<Sparkles size={11} aria-hidden="true" />}
              className="absolute right-3 top-3"
            >
              Bestseller
            </Ribbon>
          ) : null}
        </div>

        <div className="flex flex-1 flex-col p-4 sm:p-5">
          {/* Bestseller mark also sits in the body when the ribbon is taken
              up by a deal, so the two never fight for the same corner. */}
          {bestseller && hasDeal && (
            <span className="mb-2 inline-flex w-fit items-center gap-1 rounded-full bg-primary-50 px-2.5 py-1 font-mono text-micro font-semibold uppercase tracking-wider2 text-primary-700 ring-1 ring-inset ring-primary-200">
              <Sparkles size={11} aria-hidden="true" />
              Bestseller
            </span>
          )}

          <h3 className="font-display text-title font-bold leading-tight text-ink-950 transition-colors group-hover:text-primary-600">
            {product.name}
          </h3>

          {!compact && (
            <p className="mt-2 line-clamp-2 flex-1 text-body-s leading-relaxed text-ink-500">
              {product.description}
            </p>
          )}

          {/* Price rail — the number that decides whether anyone looks twice */}
          <div className="mt-4 border-t border-ink-100 pt-4">
            <div className="flex items-end justify-between gap-3">
              <div>
                <span className="label-caps block">{quote.isQuote ? 'Priced on request' : 'Starts at'}</span>
                <span className="tnum mt-0.5 block font-display text-title-l font-bold leading-none text-ink-950">
                  {quote.isQuote ? (
                    'Custom quote'
                  ) : (
                    <>
                      {money(quote.amount)}
                      {quote.isArea && (
                        <span className="font-mono text-body-s font-medium text-ink-500">/sqft</span>
                      )}
                      {quote.unitLabel && (
                        <span className="font-mono text-body-s font-medium text-ink-500"> {quote.unitLabel}</span>
                      )}
                    </>
                  )}
                </span>
              </div>

              <span className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-primary-500 px-4 font-mono text-micro font-semibold uppercase tracking-wider2 text-white transition-colors duration-200 group-hover:bg-ink-950">
                Configure
                <ArrowRight
                  size={13}
                  className="transition-transform duration-200 group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </span>
            </div>

            {hasDeal && deal ? (
              <p className="mt-2.5 font-mono text-micro uppercase tracking-wider2 text-primary-700">
                {deal.pct}% off at {deal.minQty}+ {dealUnit(product.slug)}
              </p>
            ) : (
              <p className="mt-2.5 flex items-center gap-1.5 font-mono text-micro uppercase tracking-wider2 text-ink-500">
                <Truck size={12} aria-hidden="true" />
                Free counter pickup
              </p>
            )}
          </div>
        </div>
      </Link>
    </article>
  );
};
