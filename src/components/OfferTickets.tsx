import React from 'react';
import Link from 'next/link';
import { PackageCheck, Truck, BadgeCheck, ShieldCheck, ArrowRight } from 'lucide-react';
import { Ribbon } from './ui/press';
import { SITE } from '../lib/site';

/**
 * Offer tickets.
 *
 * The coupon row a shopper expects from a store, drawn as press tickets
 * rather than as discounts we do not run: every "code" on the row is an
 * offer the shop honours automatically — pickup, flat courier, the built-in
 * bulk tiers, and the proof step. The perforated notch and dashed edge are
 * what make it read as a coupon at a glance.
 */

const OFFERS = [
  {
    Icon: PackageCheck,
    title: 'Free store pickup',
    body: `Collect from ${SITE.street}. No minimum order, nothing added to the price.`,
    tag: 'No code needed',
    href: '#visit',
    cta: 'Find the counter',
  },
  {
    Icon: Truck,
    title: `Flat ₹${SITE.deliveryCharge} courier`,
    body: 'Home delivery anywhere in India at one flat rate, shown before you pay.',
    tag: 'All India',
    href: '/catalog',
    cta: 'Start an order',
  },
  {
    Icon: BadgeCheck,
    title: 'Up to 35% off in bulk',
    body: 'Quantity tiers apply themselves as you raise the count — the basket price is the invoice price.',
    tag: 'Applied automatically',
    href: '/catalog',
    cta: 'See the catalog',
  },
  {
    Icon: ShieldCheck,
    title: 'Proof before you pay',
    body: 'Position the artwork on the real trim size, check it on screen, approve that exact file.',
    tag: 'Every order',
    href: '/customize/custom-print',
    cta: 'Upload artwork',
  },
];

export function OfferTickets() {
  return (
    <section aria-label="Store offers" className="mx-auto max-w-sheet px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {OFFERS.map(({ Icon, title, body, tag, href, cta }) => (
          <li
            key={title}
            className="group relative flex flex-col rounded-xl border-2 border-dashed border-primary-200 bg-primary-50/60 p-5 transition-colors duration-200 hover:border-primary-400 hover:bg-primary-50"
          >
            {/* Perforation notch — the detail that makes a card read as a ticket. */}
            <span
              aria-hidden="true"
              className="absolute -left-[9px] top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border-2 border-dashed border-primary-200 bg-white"
            />
            <span
              aria-hidden="true"
              className="absolute -right-[9px] top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border-2 border-dashed border-primary-200 bg-white"
            />

            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-primary-600 shadow-card">
              <Icon size={19} aria-hidden="true" />
            </span>

            <h3 className="mt-4 font-display text-title font-bold leading-tight text-ink-950">
              {title}
            </h3>
            <p className="mt-2 flex-1 text-body-s leading-relaxed text-ink-600">{body}</p>

            <span className="mt-4">
              <Ribbon tone="light" icon={<BadgeCheck size={11} aria-hidden="true" />}>
                {tag}
              </Ribbon>
            </span>

            <Link
              href={href}
              className="mt-3 inline-flex items-center gap-1.5 font-mono text-micro font-semibold uppercase tracking-wider2 text-primary-700 transition-colors group-hover:text-primary-800"
            >
              {cta}
              <ArrowRight size={13} aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
