import React from 'react';
import Link from 'next/link';
import { SITE } from '../lib/site';
import { CATEGORIES, categoryHref } from '../lib/catalog';
import { Mail, Phone, MapPin, ShieldCheck, ArrowUpRight, Truck } from 'lucide-react';
import { ColourStrip } from './ui/press';

const CATALOG_LINKS = [
  { href: '/catalog', label: 'All products' },
  { href: '/customize/business-cards', label: 'Business cards' },
  { href: '/customize/flex-banners', label: 'Flex & banners' },
  { href: '/customize/t-shirts', label: 'Custom apparel' },
  { href: '/customize/flyers', label: 'Flyers & posters' },
  { href: '/customize/custom-print', label: 'Custom jobs' },
];

export const Footer: React.FC = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto bg-ink-950 text-ink-300">
      {/* Paper edge: the CMYK strip separating the page from the footer. */}
      <ColourStrip />

      {/* CTA strip */}
      <div className="border-b border-white/10">
        <div className="mx-auto flex max-w-sheet flex-col items-start justify-between gap-5 px-4 py-9 sm:flex-row sm:items-center sm:px-6 lg:px-8">
          <div>
            <h3 className="font-display text-title-l font-bold tracking-tight text-white">
              Have artwork ready?
            </h3>
            <p className="mt-1.5 max-w-md text-body-s leading-relaxed text-ink-400">
              Upload it and see the proof before you pay. Free counter pickup from the Saket Metro shop.
            </p>
          </div>
          <Link
            href="/customize/custom-print"
            className="inline-flex h-11 flex-none items-center gap-2 rounded-full bg-primary-500 px-6 font-mono text-label font-semibold uppercase tracking-wider2 text-white transition-all hover:bg-primary-400 active:scale-[0.98]"
          >
            Upload artwork
            <ArrowUpRight size={15} aria-hidden="true" />
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-sheet px-4 pb-10 pt-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2.5">
              <img
                src="/images/logo-mark.png"
                alt=""
                width={192}
                height={192}
                className="h-10 w-10 flex-none rounded-lg bg-white/90 p-1"
              />
              <span className="font-display text-title font-bold tracking-tight text-white">
                Print<span className="text-primary-400"> Vatika</span>
              </span>
            </div>
            <p className="mt-4 max-w-sm text-body-s leading-relaxed text-ink-400">
              Commercial printing press on Himmat Singh Marg, minutes from Saket Metro. Offset and
              digital printing for businesses across Delhi NCR — proofed before it ships.
            </p>
            <div className="mt-5 flex items-center gap-2 text-body-s text-ink-400">
              <ShieldCheck size={15} className="text-primary-400" aria-hidden="true" />
              Payments verified server-side via Razorpay
            </div>
            <div className="mt-5 flex items-center gap-3">
              <a
                href={`tel:${SITE.phoneRaw}`}
                className="inline-flex h-10 items-center gap-2 rounded-full border border-white/15 px-4 font-mono text-label tracking-wider2 text-ink-200 transition-colors hover:border-primary-400 hover:text-white"
              >
                <Phone size={14} aria-hidden="true" />
                {SITE.phoneDisplay}
              </a>
            </div>
          </div>

          {/* What we print */}
          <div>
            <h3 className="font-mono text-micro font-semibold uppercase tracking-wider2 text-primary-300">
              What we print
            </h3>
            <ul className="mt-4 space-y-2.5">
              {CATALOG_LINKS.map(l => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-body-s text-ink-400 transition-colors hover:text-white"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="font-mono text-micro font-semibold uppercase tracking-wider2 text-primary-300">
              Shop by category
            </h3>
            <ul className="mt-4 space-y-2.5">
              {CATEGORIES.map(c => (
                <li key={c.key}>
                  <Link
                    href={categoryHref(c)}
                    className="text-body-s text-ink-400 transition-colors hover:text-white"
                  >
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-mono text-micro font-semibold uppercase tracking-wider2 text-primary-300">
              Reach us
            </h3>
            <ul className="mt-4 space-y-3">
              <li className="flex gap-2.5">
                <MapPin size={15} className="mt-0.5 flex-none text-primary-400" aria-hidden="true" />
                <a
                  href={SITE.mapLink}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-body-s leading-relaxed text-ink-400 transition-colors hover:text-white"
                >
                  {SITE.street}, {SITE.city} {SITE.pincode}
                </a>
              </li>
              <li className="flex gap-2.5">
                <Mail size={15} className="mt-0.5 flex-none text-primary-400" aria-hidden="true" />
                <a
                  href={`mailto:${SITE.email}`}
                  className="text-body-s text-ink-400 transition-colors hover:text-white"
                >
                  {SITE.email}
                </a>
              </li>
              <li className="flex gap-2.5">
                <Truck size={15} className="mt-0.5 flex-none text-primary-400" aria-hidden="true" />
                <span className="text-body-s text-ink-400">
                  Flat ₹{SITE.deliveryCharge} delivery · Free pickup
                </span>
              </li>
            </ul>
            <div className="mt-5">
              <p className="font-mono text-micro font-semibold uppercase tracking-wider2 text-ink-300">
                Counter hours
              </p>
              <ul className="mt-2 space-y-1">
                {SITE.hours.map(h => (
                  <li key={h.days} className="text-body-s text-ink-400">
                    {h.days}: {h.time}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 flex flex-col gap-3 border-t border-white/10 pt-6 text-body-s text-ink-400 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {SITE.name}. All rights reserved.
          </p>
          <nav className="flex flex-wrap gap-x-5 gap-y-2" aria-label="Legal">
            <Link href="/catalog" className="transition-colors hover:text-ink-200">
              Catalog
            </Link>
            <Link href="/track" className="transition-colors hover:text-ink-200">
              Track order
            </Link>
            <Link href={`mailto:${SITE.email}`} className="transition-colors hover:text-ink-200">
              Enquiries
            </Link>
            <Link href="/admin/dashboard" className="transition-colors hover:text-ink-200">
              Staff login
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
};
