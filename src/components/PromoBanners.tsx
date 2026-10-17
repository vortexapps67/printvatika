import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

/**
 * Promo banners.
 *
 * The mid-page banner block: three image tiles, each one a department or a
 * job type, each one a single click into the filtered catalog. Picture fills
 * the tile, gradient carries the type — same construction as the hero, so
 * the page reads as one shop window rather than a set of widgets.
 */

const BANNERS = [
  {
    image: '/images/brochures.jpg',
    alt: 'Folded printed brochures arranged on a table',
    eyebrow: 'Marketing',
    title: 'Brochures, flyers & posters',
    body: 'Everything for a launch or an event, from A6 handouts to A1 posters.',
    href: '/catalog?category=Marketing',
    cta: 'Shop marketing',
    featured: true,
  },
  {
    image: '/images/custom-print.jpg',
    alt: 'Print operator checking a sheet off the press',
    eyebrow: 'Specialty',
    title: 'Not on the shelf?',
    body: 'Upload the artwork, describe the job, get a quote back from the counter.',
    href: '/customize/custom-print',
    cta: 'Get a quote',
    featured: false,
  },
  {
    image: '/images/hero-bg-light.png',
    alt: 'Press sheets and colour bars on the shop floor',
    eyebrow: 'The counter',
    title: 'Feel the stock first',
    body: 'Card weights, laminates and flex swatches to hand, Mon–Sat.',
    href: '#visit',
    cta: 'Find us',
    featured: false,
  },
];

export function PromoBanners() {
  return (
    <section aria-label="Featured departments" className="mx-auto max-w-sheet px-4 pb-4 sm:px-6 lg:px-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {BANNERS.map(b => (
          <Link
            key={b.image}
            href={b.href}
            className={`group relative block overflow-hidden rounded-xl shadow-card transition-shadow duration-300 hover:shadow-card-hover ${
              b.featured ? 'sm:col-span-2 lg:col-span-1' : ''
            }`}
          >
            <div className="relative aspect-[4/3] bg-ink-100">
              <img
                src={b.image}
                alt={b.alt}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover transition-transform duration-700 ease-press group-hover:scale-105"
              />
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-t from-ink-950/92 via-ink-950/45 to-ink-950/5"
              />

              <div className="absolute inset-0 flex flex-col justify-end p-5 sm:p-6">
                <span className="font-mono text-micro uppercase tracking-wider2 text-primary-300">
                  {b.eyebrow}
                </span>
                <h3 className="mt-1.5 font-display text-title-l font-extrabold leading-tight text-white sm:text-title-l">
                  {b.title}
                </h3>
                <p className="mt-1.5 max-w-md text-body-s leading-relaxed text-ink-300">{b.body}</p>
                <span className="mt-4 inline-flex w-fit items-center gap-2 rounded-lg bg-white/95 px-4 py-2.5 font-mono text-micro font-semibold uppercase tracking-wider2 text-ink-950 transition-colors group-hover:bg-primary-500 group-hover:text-white">
                  {b.cta}
                  <ArrowRight size={13} aria-hidden="true" />
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
