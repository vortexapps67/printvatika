import React from 'react';
import Link from 'next/link';
import { ButtonLink, ColourStrip, RegistrationMark } from './ui/press';
import { SITE } from '../lib/site';
import { CATEGORIES, categoryHref } from '../lib/catalog';
import { Mail, Phone, MapPin, ShieldCheck, ArrowUpRight } from 'lucide-react';

const CATALOG_LINKS = [
  { href: '/catalog', label: 'Full catalog' },
  { href: '/customize/business-cards', label: 'Business cards' },
  { href: '/customize/flex-banners', label: 'Flex & banner signage' },
  { href: '/customize/t-shirts', label: 'Custom apparel' },
  { href: '/customize/flyers', label: 'Flyers & posters' },
  { href: '/customize/custom-print', label: 'Any other job' },
];

export const Footer: React.FC = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto bg-ink-950 text-ink-300">
      <ColourStrip />

      <div className="mx-auto max-w-sheet px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-12">
          {/* Brand */}
          <div className="md:col-span-4 lg:col-span-5">
            <div className="flex items-center gap-2.5">
              <img
                src="/images/logo-mark.png"
                alt=""
                width={192}
                height={192}
                className="h-9 w-9 flex-none rounded-lg ring-1 ring-white/15"
              />
              <span className="font-display text-title font-extrabold tracking-tightest text-white">
                Print<span className="text-primary-400"> Vatika</span>
              </span>
            </div>

            {/* The mark's own tagline, set in the site's type rather than
                shipped inside the image so it stays legible at footer size. */}
            <p className="mt-4 font-mono text-micro uppercase tracking-wider2 text-primary-400">
              We print, you impress
            </p>

            <p className="mt-5 max-w-sm text-body-s leading-relaxed text-ink-400">
              A commercial press on Himmat Singh Marg, minutes from Saket Metro. Offset and
              digital printing for businesses across Delhi NCR — proofed before it ships.
            </p>

            <div className="mt-6 flex items-center gap-2 text-body-s text-ink-300">
              <ShieldCheck size={15} className="text-emerald-400" aria-hidden="true" />
              Payments verified server-side via Razorpay
            </div>
          </div>

          {/* Catalog */}
          <div className="md:col-span-4 lg:col-span-3">
            <h3 className="label-caps flex items-center gap-2 text-ink-400">
              <RegistrationMark className="text-primary-500" />
              What we print
            </h3>
            <ul className="mt-4 space-y-2.5">
              {CATALOG_LINKS.map(l => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-body-s text-ink-300 transition-colors hover:text-white"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>

            <h3 className="label-caps mt-8 text-ink-400">Shop by category</h3>
            <ul className="mt-4 space-y-2.5">
              {CATEGORIES.map(c => (
                <li key={c.key}>
                  <Link
                    href={categoryHref(c)}
                    className="text-body-s text-ink-300 transition-colors hover:text-white"
                  >
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Hours */}
          <div className="md:col-span-4 lg:col-span-2">
            <h3 className="label-caps text-ink-400">Counter hours</h3>
            <ul className="mt-4 space-y-2.5">
              {SITE.hours.map(h => (
                <li key={h.days} className="text-body-s">
                  <span className="block text-ink-400">{h.days}</span>
                  <span className="text-ink-200">{h.time}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 border-t border-ink-800 pt-4 font-mono text-micro uppercase tracking-wider2 text-ink-400">
              Online orders 24/7
            </p>
          </div>

          {/* Contact */}
          <div className="md:col-span-12 lg:col-span-2">
            <h3 className="label-caps text-ink-400">Reach the press</h3>
            <ul className="mt-4 space-y-4">
              <li className="flex gap-2.5">
                <MapPin size={15} className="mt-0.5 flex-none text-primary-400" aria-hidden="true" />
                <a
                  href={SITE.mapLink}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-body-s leading-relaxed text-ink-300 transition-colors hover:text-white"
                >
                  {SITE.street}
                  <br />
                  {SITE.city} {SITE.pincode}
                </a>
              </li>
              <li className="flex gap-2.5">
                <Phone size={15} className="mt-0.5 flex-none text-primary-400" aria-hidden="true" />
                <a
                  href={`tel:${SITE.phoneRaw}`}
                  className="tnum text-body-s text-ink-300 transition-colors hover:text-white"
                >
                  {SITE.phoneDisplay}
                </a>
              </li>
              <li className="flex gap-2.5">
                <Mail size={15} className="mt-0.5 flex-none text-primary-400" aria-hidden="true" />
                <a
                  href={`mailto:${SITE.email}`}
                  className="text-body-s text-ink-300 transition-colors hover:text-white"
                >
                  {SITE.email}
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Call to action strip */}
        <div className="mt-12 flex flex-col gap-4 border-t border-ink-800 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-md font-display text-lead-l font-bold leading-tight text-white">
            Have artwork ready? Upload it and see the proof before you pay.
          </p>
          <ButtonLink
            href="/customize/custom-print"
            variant="solid"
            size="lg"
            className="shrink-0"
          >
            Upload artwork
            <ArrowUpRight size={16} aria-hidden="true" />
          </ButtonLink>
        </div>
      </div>

      <div className="border-t border-ink-800">
        <div className="mx-auto flex max-w-sheet flex-col gap-3 px-4 py-5 text-body-s text-ink-400 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
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
            <Link
              href={`mailto:${SITE.email}`}
              className="transition-colors hover:text-ink-200"
            >
              Enquiries
            </Link>
            <Link
              href="/admin/dashboard"
              className="font-mono text-micro uppercase tracking-wider2 text-ink-400 transition-colors hover:text-ink-200"
            >
              Staff login
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
};