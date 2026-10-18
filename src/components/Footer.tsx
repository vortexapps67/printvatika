import React from 'react';
import Link from 'next/link';
import { SITE } from '../lib/site';
import { CATEGORIES, categoryHref } from '../lib/catalog';
import { Mail, Phone, MapPin, ShieldCheck, ArrowUpRight, Truck } from 'lucide-react';

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
    <footer className="mt-auto border-t border-ink-200 bg-white text-ink-700">
      {/* Newsletter / CTA strip */}
      <div className="border-b border-ink-200 bg-ink-50">
        <div className="mx-auto flex max-w-sheet flex-col items-start justify-between gap-4 px-4 py-8 sm:flex-row sm:items-center sm:px-6 lg:px-8">
          <div>
            <h3 className="text-title font-bold text-ink-900">Have artwork ready?</h3>
            <p className="mt-1 text-body-s text-ink-500">
              Upload it and see the proof before you pay. Free counter pickup.
            </p>
          </div>
          <Link
            href="/customize/custom-print"
            className="inline-flex h-11 items-center gap-2 rounded-lg bg-primary-500 px-6 text-body-s font-semibold text-white transition-colors hover:bg-primary-600"
          >
            Upload artwork
            <ArrowUpRight size={15} aria-hidden="true" />
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-sheet px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2.5">
              <img
                src="/images/logo-mark.png"
                alt=""
                width={192}
                height={192}
                className="h-10 w-10 flex-none rounded-lg"
              />
              <span className="text-title font-extrabold tracking-tight text-ink-900">
                Print<span className="text-primary-600"> Vatika</span>
              </span>
            </div>
            <p className="mt-4 max-w-sm text-body-s leading-relaxed text-ink-500">
              Commercial printing press on Himmat Singh Marg, minutes from Saket Metro. Offset and digital printing for businesses across Delhi NCR — proofed before it ships.
            </p>
            <div className="mt-5 flex items-center gap-2 text-body-s text-ink-500">
              <ShieldCheck size={15} className="text-primary-600" aria-hidden="true" />
              Payments verified server-side via Razorpay
            </div>
            <div className="mt-5 flex items-center gap-3">
              <a
                href={`tel:${SITE.phoneRaw}`}
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-ink-200 px-4 text-body-s font-medium text-ink-700 transition-colors hover:border-primary-500 hover:text-primary-600"
              >
                <Phone size={14} aria-hidden="true" />
                {SITE.phoneDisplay}
              </a>
            </div>
          </div>

          {/* What we print */}
          <div>
            <h3 className="text-body-s font-bold uppercase tracking-wider text-ink-900">What we print</h3>
            <ul className="mt-4 space-y-2.5">
              {CATALOG_LINKS.map(l => (
                <li key={l.href}>
                  <Link href={l.href} className="text-body-s text-ink-500 transition-colors hover:text-primary-600">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-body-s font-bold uppercase tracking-wider text-ink-900">Shop by category</h3>
            <ul className="mt-4 space-y-2.5">
              {CATEGORIES.map(c => (
                <li key={c.key}>
                  <Link href={categoryHref(c)} className="text-body-s text-ink-500 transition-colors hover:text-primary-600">
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-body-s font-bold uppercase tracking-wider text-ink-900">Reach us</h3>
            <ul className="mt-4 space-y-3">
              <li className="flex gap-2.5">
                <MapPin size={15} className="mt-0.5 flex-none text-primary-600" aria-hidden="true" />
                <a href={SITE.mapLink} target="_blank" rel="noreferrer noopener" className="text-body-s leading-relaxed text-ink-500 transition-colors hover:text-primary-600">
                  {SITE.street}, {SITE.city} {SITE.pincode}
                </a>
              </li>
              <li className="flex gap-2.5">
                <Mail size={15} className="mt-0.5 flex-none text-primary-600" aria-hidden="true" />
                <a href={`mailto:${SITE.email}`} className="text-body-s text-ink-500 transition-colors hover:text-primary-600">
                  {SITE.email}
                </a>
              </li>
              <li className="flex gap-2.5">
                <Truck size={15} className="mt-0.5 flex-none text-primary-600" aria-hidden="true" />
                <span className="text-body-s text-ink-500">Flat ₹{SITE.deliveryCharge} delivery · Free pickup</span>
              </li>
            </ul>
            <div className="mt-5">
              <p className="text-micro font-semibold uppercase tracking-wider text-ink-400">Counter hours</p>
              <ul className="mt-2 space-y-1">
                {SITE.hours.map(h => (
                  <li key={h.days} className="text-body-s text-ink-500">
                    {h.days}: {h.time}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 flex flex-col gap-3 border-t border-ink-200 pt-6 text-body-s text-ink-400 sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} {SITE.name}. All rights reserved.</p>
          <nav className="flex flex-wrap gap-x-5 gap-y-2" aria-label="Legal">
            <Link href="/catalog" className="transition-colors hover:text-ink-700">Catalog</Link>
            <Link href="/track" className="transition-colors hover:text-ink-700">Track order</Link>
            <Link href={`mailto:${SITE.email}`} className="transition-colors hover:text-ink-700">Enquiries</Link>
            <Link href="/admin/dashboard" className="transition-colors hover:text-ink-700">Staff login</Link>
          </nav>
        </div>
      </div>
    </footer>
  );
};