'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from './ui/press';
import { CATEGORIES, categoryHref, money, unitQuote } from '../lib/catalog';
import type { Product } from '../types';
import { cn } from '@/lib/utils';

/**
 * Storefront hero.
 *
 * Two jobs, in the order a shopper meets them: a rotating banner carousel
 * that leads with the picture and the starting price of an actual product,
 * then a search row with the category chips, so someone who already knows
 * what they want skips the banners entirely.
 *
 * The carousel is deliberately plain — no scroll listeners, no libraries.
 * One interval, one index, opacity crossfade, and it stops dead under
 * prefers-reduced-motion.
 */

interface Slide {
  image: string;
  alt: string;
  eyebrow: string;
  title: string;
  body: string;
  chip: { label: string; value: string };
  href: string;
  cta: string;
  href2?: string;
  cta2?: string;
}

/** One slide's price line, written the way the shop writes it. */
function quoted(product: Product | undefined, fallback: string, unitWord: string) {
  if (!product) return { title: fallback, chip: fallback };
  const quote = unitQuote(product);
  const value = money(quote.amount);
  if (quote.isArea) return { title: `${value} a sq ft`, chip: `${value}/sqft` };
  if (quote.qty > 1) return { title: `${value} for ${quote.qty}`, chip: `${value} / ${quote.qty} pcs` };
  return { title: value, chip: `${value}/${unitWord}` };
}

/* The copy on these banners is fixed; the money is not. Every figure is read
   back out of the catalogue the configurator prices from, so a banner can never
   promise a number the shop will not honour — which is exactly how the old
   static build ended up advertising business cards at ₹1 and flyers at ₹2. */
function slidesFor(products: Product[]): Slide[] {
  const bySlug = new Map(products.map(p => [p.slug, p]));
  const signage = quoted(bySlug.get('flex-banners'), '₹15 a sq ft', 'sqft');
  const cards = quoted(bySlug.get('business-cards'), '₹299 for 100', 'card');
  const tees = quoted(bySlug.get('t-shirts'), '₹249', 'tee');
  const posters = quoted(bySlug.get('posters'), '₹49', 'poster');
  const flyers = quoted(bySlug.get('flyers'), '₹199 for 500', 'flyer');

  return [
    {
      image: '/images/banner-signage.jpg',
      alt: 'A printed flex banner mounted on a shop front',
      eyebrow: 'Signage · priced by the foot',
      title: `Flex banners from ${signage.title}.`,
      body: 'Enter the exact feet, pick the finish and the eyelets, and watch the price update. Weatherproof star flex, dispatched in 24–48 hours.',
      chip: { label: 'Starting at', value: signage.chip },
      href: '/catalog?category=Signage',
      cta: 'Shop signage',
      href2: '/customize/flex-banners',
      cta2: 'Upload artwork',
    },
    {
      image: '/images/banner-cards.jpg',
      alt: 'Stack of printed business cards on a desk',
      eyebrow: 'Stationery · proofed first',
      title: `Business cards from ${cards.title}.`,
      body: '300–400 GSM stock, matte through velvet lamination. Line your artwork up against the real trim size, approve that exact file, then pay.',
      chip: { label: 'Starting at', value: cards.chip },
      href: '/customize/business-cards',
      cta: 'Design your card',
      href2: '/catalog?category=Stationery',
      cta2: 'All stationery',
    },
    {
      image: '/images/banner-tshirts.jpg',
      alt: 'Custom printed cotton t-shirts',
      eyebrow: 'Apparel · printed in-house',
      title: `Custom t-shirts from ${tees.title}.`,
      body: 'Cotton tees screen printed at the counter — front, back or both, in the colour and size you pick. Ten or ten thousand.',
      chip: { label: 'Starting at', value: tees.chip },
      href: '/customize/t-shirts',
      cta: 'Print a tee',
      href2: '/catalog?category=Apparel',
      cta2: 'All apparel',
    },
    {
      image: '/images/banner-posters.jpg',
      alt: 'Large format colour posters printed on photo paper',
      eyebrow: 'Marketing · event ready',
      title: `Posters from ${posters.title}, flyers from ${flyers.title}.`,
      body: 'A3 to A1 on matte, gloss or waterproof synthetic. The collateral for a launch, a sale or an event, cut and ready to hand out.',
      chip: { label: 'Starting at', value: posters.chip },
      href: '/catalog?category=Marketing',
      cta: 'Shop marketing',
      href2: '/customize/custom-print',
      cta2: 'Quote a custom job',
    },
  ];
}

const ROTATE_MS = 6000;

export function Hero({ products = [] }: { products?: Product[] }) {
  const slides = slidesFor(products);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    setReduceMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  useEffect(() => {
    if (paused || reduceMotion) return;
    const id = window.setInterval(() => setIndex(i => (i + 1) % slides.length), ROTATE_MS);
    return () => window.clearInterval(id);
  }, [paused, reduceMotion, slides.length]);

  const go = (next: number) => {
    const count = slides.length || 1;
    setIndex(((next % count) + count) % count);
  };

  return (
    <section aria-label="Featured offers">
      {/* ---- Banner carousel ---- */}
      <div
        className="relative h-[430px] overflow-hidden bg-ink-950 sm:h-[470px] lg:h-[540px]"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocusCapture={() => setPaused(true)}
        onBlurCapture={() => setPaused(false)}
      >
        {slides.map((s, i) => {
          const isActive = i === index;
          return (
            <div
              key={s.image}
              aria-hidden={!isActive}
              className={cn(
                'absolute inset-0 transition-opacity duration-700 ease-press',
                isActive ? 'opacity-100' : 'pointer-events-none opacity-0',
              )}
            >
              <img
                src={s.image}
                alt={isActive ? s.alt : ''}
                className="h-full w-full object-cover"
                fetchPriority={i === 0 ? 'high' : 'auto'}
                loading={i === 0 ? 'eager' : 'lazy'}
                decoding="async"
              />
              {/* Scrim: horizontal on wide screens so the copy column reads,
                  vertical on phones where the copy sits under the picture. */}
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-r from-ink-950 via-ink-950/85 to-ink-950/30"
              />
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-t from-ink-950/90 via-ink-950/30 to-transparent sm:via-transparent"
              />

              <div className="absolute inset-0">
                <div className="mx-auto flex h-full max-w-sheet flex-col justify-center px-4 pb-16 pt-8 sm:px-6 sm:pb-20 lg:px-8">
                  <p className="font-mono text-micro uppercase tracking-wider2 text-primary-300">
                    {s.eyebrow}
                  </p>

                  {/* First slide carries the page's h1; the rest are h2 so the
                      document still has exactly one top-level heading. */}
                  {i === 0 ? (
                    <h1 className="mt-4 max-w-2xl font-display text-display-s font-black leading-[0.98] tracking-tightest text-white sm:text-display lg:text-display-l">
                      {s.title}
                    </h1>
                  ) : (
                    <h2 className="mt-4 max-w-2xl font-display text-display-s font-black leading-[0.98] tracking-tightest text-white sm:text-display lg:text-display-l">
                      {s.title}
                    </h2>
                  )}

                  <p className="mt-4 hidden max-w-xl text-body-l leading-relaxed text-ink-300 sm:block">
                    {s.body}
                  </p>

                  <div className="mt-6 flex flex-wrap items-center gap-3">
                    <span className="flex items-baseline gap-2 rounded-lg border border-white/20 bg-white/10 px-3.5 py-2 backdrop-blur-sm">
                      <span className="font-mono text-micro uppercase tracking-wider2 text-ink-300">
                        {s.chip.label}
                      </span>
                      <span className="tnum font-display text-title font-extrabold leading-none text-white">
                        {s.chip.value}
                      </span>
                    </span>
                  </div>

                  <div className="mt-6 flex flex-wrap gap-3">
                    <Link
                      href={s.href}
                      tabIndex={isActive ? undefined : -1}
                      className="inline-flex h-12 items-center gap-2 rounded-lg bg-primary-500 px-6 font-mono text-body-s font-semibold uppercase tracking-wider2 text-white shadow-card transition-colors hover:bg-primary-600"
                    >
                      {s.cta}
                      <ArrowRight size={15} aria-hidden="true" />
                    </Link>
                    {s.href2 && (
                      <Link
                        href={s.href2}
                        tabIndex={isActive ? undefined : -1}
                        className="inline-flex h-12 items-center gap-2 rounded-lg border border-white/30 bg-white/10 px-6 font-mono text-body-s font-semibold uppercase tracking-wider2 text-white backdrop-blur-sm transition-colors hover:bg-white/20"
                      >
                        {s.cta2}
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* ---- Arrows ---- */}
        <button
          type="button"
          onClick={() => go(index - 1)}
          aria-label="Previous banner"
          className="absolute left-3 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-ink-950/50 text-white backdrop-blur-sm transition-colors hover:bg-ink-950/80 sm:flex lg:left-6"
        >
          <ArrowLeft size={18} aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => go(index + 1)}
          aria-label="Next banner"
          className="absolute right-3 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-ink-950/50 text-white backdrop-blur-sm transition-colors hover:bg-ink-950/80 sm:flex lg:right-6"
        >
          <ArrowRight size={18} aria-hidden="true" />
        </button>

        {/* ---- Dots + slide counter ---- */}
        <div className="absolute inset-x-0 bottom-0">
          <div className="mx-auto flex max-w-sheet items-center justify-between gap-4 px-4 pb-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2">
              {slides.map((s, i) => (
                <button
                  key={s.image}
                  type="button"
                  onClick={() => go(i)}
                  aria-label={`Go to banner ${i + 1}: ${s.title}`}
                  aria-current={i === index}
                  className={cn(
                    'h-1.5 rounded-full transition-all duration-300',
                    i === index ? 'w-8 bg-primary-500' : 'w-4 bg-white/40 hover:bg-white/70',
                  )}
                />
              ))}
            </div>
            <span className="tnum font-mono text-micro uppercase tracking-wider2 text-white/70">
              {String(index + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}
            </span>
          </div>
        </div>
      </div>

      {/* ---- Search row: the way in for anyone who already knows ---- */}
      <div className="border-b border-ink-200 bg-white">
        <div className="mx-auto max-w-sheet px-4 py-5 sm:px-6 lg:px-8">
          <form action="/catalog" method="GET" className="flex flex-col gap-2.5 sm:flex-row" role="search">
            <div className="relative flex-1">
              <Search
                size={18}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-400"
                aria-hidden="true"
              />
              <input
                type="search"
                name="q"
                placeholder="Search business cards, flex, t-shirts, flyers, stickers…"
                aria-label="Search the catalog"
                className="h-12 w-full rounded-full border border-ink-200 bg-ink-50 pl-12 pr-4 text-body text-ink-900 shadow-card transition-colors placeholder:text-ink-400 hover:border-ink-300 hover:bg-white"
              />
            </div>
            <Button type="submit" size="lg" className="h-12 sm:w-auto">
              Search
            </Button>
          </form>

          <div className="scrollbar-none mt-3.5 flex items-center gap-2 overflow-x-auto pb-0.5">
            <span className="hidden shrink-0 pr-1 font-mono text-micro uppercase tracking-wider2 text-ink-400 sm:block">
              Shop
            </span>
            <Link
              href="/catalog"
              className="shrink-0 rounded-full border border-ink-200 bg-white px-3.5 py-1.5 font-mono text-micro font-semibold uppercase tracking-wider2 text-ink-700 transition-colors hover:border-ink-950 hover:bg-ink-950 hover:text-white"
            >
              All products
            </Link>
            {CATEGORIES.map(c => (
              <Link
                key={c.key}
                href={categoryHref(c)}
                className="shrink-0 rounded-full border border-ink-200 bg-white px-3.5 py-1.5 font-mono text-micro font-semibold uppercase tracking-wider2 text-ink-700 transition-colors hover:border-ink-950 hover:bg-ink-950 hover:text-white"
              >
                {c.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
