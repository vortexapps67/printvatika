import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, FileWarning, Search } from 'lucide-react';
import { ButtonLink, ColourStrip, Panel, RegistrationMark } from '@/components/ui/press';

export const metadata: Metadata = {
  title: 'Page not found',
  description: 'That page is not on the press sheet. Browse the catalog or track an existing order.',
};

const ROUTES = [
  { href: '/catalog', label: 'Catalog', hint: 'Every product we run, with live proofs' },
  { href: '/track', label: 'Track an order', hint: 'Live status by order number' },
  { href: '/', label: 'Home', hint: 'Press specs, hours and pickup' },
];

export default function NotFound() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-20 sm:px-6 sm:py-28">
      <div className="mb-4 flex items-center gap-2">
        <RegistrationMark className="text-primary-500" />
        <span className="label-caps text-ink-500">Misfeed · Sheet 404</span>
      </div>

      <p className="font-display text-display font-bold leading-none tracking-tight text-ink-950 sm:text-display-l">
        404
      </p>

      <h1 className="mt-4 max-w-xl text-title-l text-ink-950">
        This page didn&rsquo;t make it through the press.
      </h1>
      <p className="mt-4 max-w-lg text-body text-ink-500">
        The link may be out of date, or the product slug was renamed. Nothing was charged —
        nothing was ordered. Try one of the routes below.
      </p>

      <ColourStrip className="mt-8 h-1.5 w-full" />

      <ul className="mt-8 flex flex-col gap-3">
        {ROUTES.map(r => (
          <li key={r.href}>
            <Link
              href={r.href}
              className="group flex items-center gap-4 rounded-2xl border border-ink-200/80 bg-white px-4 py-4 shadow-card transition-all duration-300 ease-press hover:-translate-y-0.5 hover:shadow-card-hover hover:border-primary-300 hover:bg-primary-50/40"
            >
              <span className="min-w-0 flex-1">
                <span className="block font-display text-title font-bold text-ink-950">
                  {r.label}
                </span>
                <span className="mt-0.5 block text-body-s text-ink-500">{r.hint}</span>
              </span>
              <ArrowRight
                size={18}
                aria-hidden="true"
                className="flex-none text-ink-400 transition-colors group-hover:text-primary-500"
              />
            </Link>
          </li>
        ))}
      </ul>

      <Panel className="mt-10">
        <div className="flex items-start gap-3">
          <FileWarning size={18} className="mt-0.5 flex-none text-ink-400" aria-hidden="true" />
          <div className="min-w-0">
            <p className="label-caps text-ink-500">Looking for something specific?</p>
            <p className="mt-1.5 text-body-s text-ink-600">
              Search the catalog from the bar above, or call the press directly and we&rsquo;ll
              tell you whether we run it.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <ButtonLink href="/catalog" variant="outline" size="sm">
                <Search size={14} aria-hidden="true" />
                Browse catalog
              </ButtonLink>
            </div>
          </div>
        </div>
      </Panel>
    </div>
  );
}