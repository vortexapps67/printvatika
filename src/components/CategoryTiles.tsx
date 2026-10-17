import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { categoryHref, presentCategories } from '../lib/catalog';
import type { Category } from '../lib/catalog';
import type { Product } from '../types';

/**
 * Category tiles.
 *
 * The browse layer. Someone who does not yet know which product they want
 * starts here and lands in the right filtered catalog in one click, so each
 * tile carries a real photograph from that category plus a line explaining
 * what is actually in it.
 *
 * The image sits on a tinted stock wash, one per category, so a grid of
 * unrelated photographs still reads as a single printed sheet.
 */

/** Literal class strings so Tailwind can see them. */
const WASH: Record<Category['wash'], string> = {
  aqua: 'bg-wash-aqua',
  mint: 'bg-wash-mint',
  sand: 'bg-wash-sand',
  sage: 'bg-wash-sage',
  haze: 'bg-wash-haze',
};

interface CategoryTilesProps {
  products: Product[];
}

export function CategoryTiles({ products }: CategoryTilesProps) {
  const tiles = presentCategories(products).map(c => {
    const inCategory = products.filter(p => p.category === c.db);
    return { ...c, count: inCategory.length, cover: inCategory[0]?.image_url };
  });

  return (
    <ul className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
      {tiles.map(c => (
        <li key={c.key} className={c.key === 'specialty' ? 'col-span-2 lg:col-span-1' : undefined}>
          <Link
            href={categoryHref(c)}
            className="group flex h-full flex-col overflow-hidden rounded-xl border border-ink-200 bg-white shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:border-ink-300 hover:shadow-card-hover"
          >
            <div className={`relative aspect-[4/3] overflow-hidden ${WASH[c.wash]}`}>
              {c.cover && (
                <img
                  src={c.cover}
                  alt=""
                  aria-hidden="true"
                  className="h-full w-full object-cover opacity-90 transition-transform duration-700 ease-press group-hover:scale-105"
                  loading="lazy"
                />
              )}
            </div>

            <div className="flex flex-1 flex-col p-4">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-display text-title font-extrabold leading-tight text-ink-950 transition-colors group-hover:text-primary-600">
                  {c.name}
                </h3>
                <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-ink-50 text-ink-500 transition-all duration-300 group-hover:bg-primary-500 group-hover:text-white">
                  <ArrowRight
                    size={15}
                    className="transition-transform duration-300 group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </span>
              </div>
              <p className="mt-2 flex-1 text-body-s leading-relaxed text-ink-500">{c.blurb}</p>
              <span className="mt-3 font-mono text-micro uppercase tracking-wider2 text-ink-500">
                {c.count} {c.count === 1 ? 'product' : 'products'}
              </span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}