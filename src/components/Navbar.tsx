'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { ButtonLink, ColourStrip } from './ui/press';
import { CATEGORIES, categoryHref } from '../lib/catalog';
import { SITE } from '../lib/site';
import { Search, Menu, X, ShoppingBag, ArrowRight, Phone, LayoutGrid } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Header.
 *
 * Two tiers, the way an online print shop is actually navigated: a utility
 * tier that holds search, track-order and the cart, then a category tier that
 * stays one click away at all times. The category row is the point — somebody
 * who knows they want a flex banner should never have to go back to the
 * catalog and filter.
 */

const UTILITY_LINKS = [{ href: '/track', label: 'Track Order' }] as const;

export const Navbar: React.FC = () => {
  const { cart } = useCart();
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [navSearch, setNavSearch] = useState('');

  const cartCount = cart.length;

  // Close the drawer on navigation, and lock scroll while it's open.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setIsOpen(false);
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  // Any route change closes the drawer, including ones we did not trigger.
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = navSearch.trim();
    router.push(query ? `/catalog?q=${encodeURIComponent(query)}` : '/catalog');
    setIsOpen(false);
  };

  /* The category filter lives in a query string, which the router does not
     hand us synchronously during render. Reading it lazily keeps the active
     highlight correct on arrival and correct again after a client-side push. */
  const activeCategory = (): string | null => {
    if (typeof window === 'undefined') return null;
    return new URLSearchParams(window.location.search).get('category');
  };

  const onCatalog = pathname?.startsWith('/catalog');
  const isAllActive = !!onCatalog && activeCategory() === null;

  return (
    <header className="sticky top-0 z-50 border-b border-ink-200 bg-white/95 backdrop-blur-sm">
      {/* ---- Tier 1: wordmark, search, utilities ---- */}
      <div className="mx-auto max-w-sheet px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center gap-4 lg:gap-6">
          <Link
            href="/"
            className="group flex shrink-0 items-center gap-2.5"
            aria-label="Print Vatika — home"
          >
            {/* The real mark. The artwork carries a white ground, so it sits on
                a light plate rather than being knocked out — that also keeps
                it readable against the bar's translucent white while scrolling. */}
            <img
              src="/images/logo-mark.png"
              alt=""
              width={192}
              height={192}
              className="h-10 w-10 flex-none rounded-lg ring-1 ring-ink-200/80 transition-shadow group-hover:shadow-card"
            />
            <span className="hidden flex-col leading-none sm:flex">
              <span className="font-display text-body-l font-extrabold tracking-tightest text-ink-950">
                Print<span className="text-primary-500"> Vatika</span>
              </span>
              <span className="mt-0.5 font-mono text-micro uppercase tracking-wider2 text-ink-500">
                Press · Saket Metro
              </span>
            </span>
          </Link>

          {/* Desktop search — the widest element in the tier, because it is
              the one control that works when someone does not know the name
              of what they want yet. */}
          <form
            onSubmit={handleSearchSubmit}
            className="hidden min-w-0 flex-1 md:block"
            role="search"
          >
            <div className="relative">
              <Search
                size={16}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-400"
                aria-hidden="true"
              />
              <input
                type="search"
                value={navSearch}
                onChange={e => setNavSearch(e.target.value)}
                placeholder="Search business cards, flex, t-shirts, stickers…"
                aria-label="Search products"
                className="h-11 rounded-full border-ink-200 bg-ink-50 pl-11 pr-4 text-body text-ink-900 transition-colors hover:border-ink-300 hover:bg-white"
              />
            </div>
          </form>

          {/* Desktop utilities */}
          <div className="ml-auto hidden shrink-0 items-center gap-1 md:flex">
            {UTILITY_LINKS.map(l => (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  'rounded-lg px-3 py-2 font-mono text-label font-medium uppercase tracking-wider2 transition-colors',
                  pathname?.startsWith(l.href)
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-ink-600 hover:bg-ink-100 hover:text-ink-950',
                )}
              >
                {l.label}
              </Link>
            ))}

            <a
              href={`tel:${SITE.phoneRaw}`}
              className="hidden items-center gap-2 rounded-lg px-3 py-2 font-mono text-label font-medium tracking-wider2 text-ink-600 transition-colors hover:bg-ink-100 hover:text-ink-950 xl:flex"
            >
              <Phone size={14} aria-hidden="true" />
              {SITE.phoneDisplay}
            </a>

            <Link
              href={user ? '/account' : '/login'}
              className={cn(
                'rounded-lg px-3 py-2 font-mono text-label font-medium uppercase tracking-wider2 transition-colors',
                pathname?.startsWith('/account') || pathname?.startsWith('/login')
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-ink-600 hover:bg-ink-100 hover:text-ink-950',
              )}
            >
              {user ? 'My account' : 'Login'}
            </Link>

            <Link
              href="/cart"
              className={cn(
                'relative ml-1 flex h-11 items-center gap-2 rounded-full px-5 font-mono text-label font-semibold uppercase tracking-wider2 transition-all',
                cartCount > 0
                  ? 'bg-primary-500 text-white shadow-card hover:bg-primary-600'
                  : 'border border-ink-300 bg-white text-ink-900 hover:border-ink-950',
              )}
              aria-label={`Cart${cartCount ? `, ${cartCount} item${cartCount === 1 ? '' : 's'}` : ', empty'}`}
            >
              <ShoppingBag size={16} aria-hidden="true" />
              <span>Cart</span>
              {cartCount > 0 && (
                <span
                  className={cn(
                    'tnum flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-micro font-semibold leading-none',
                    'bg-white text-primary-600',
                  )}
                >
                  {cartCount}
                </span>
              )}
            </Link>
          </div>

          {/* Mobile actions */}
          <div className="ml-auto flex items-center gap-2 md:hidden">
            <Link
              href="/cart"
              className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-ink-200 bg-white text-ink-800"
              aria-label={`Cart${cartCount ? `, ${cartCount} items` : ', empty'}`}
            >
              <ShoppingBag size={18} aria-hidden="true" />
              {cartCount > 0 && (
                <span className="tnum absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary-500 px-1 text-micro font-semibold leading-none text-white">
                  {cartCount}
                </span>
              )}
            </Link>
            <button
              type="button"
              onClick={() => setIsOpen(v => !v)}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-ink-200 bg-white text-ink-800 transition-colors hover:border-ink-950"
              aria-label={isOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isOpen}
            >
              {isOpen ? <X size={19} /> : <Menu size={19} />}
            </button>
          </div>
        </div>
      </div>

      {/* ---- Tier 2: categories ---- */}
      <nav aria-label="Product categories" className="hidden border-t border-ink-100 md:block">
        <div className="mx-auto max-w-sheet px-4 sm:px-6 lg:px-8">
          <div className="scrollbar-none flex items-center gap-1 overflow-x-auto">
            <Link
              href="/catalog"
              className={cn(
                'flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-3 font-mono text-label font-semibold uppercase tracking-wider2 transition-colors',
                isAllActive
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-ink-600 hover:border-ink-300 hover:text-ink-950',
              )}
            >
              <LayoutGrid size={14} aria-hidden="true" />
              All products
            </Link>

            {CATEGORIES.map(c => (
              <Link
                key={c.key}
                href={categoryHref(c)}
                className={cn(
                  'shrink-0 border-b-2 px-3 py-3 font-mono text-label font-semibold uppercase tracking-wider2 transition-colors',
                  onCatalog && activeCategory() === c.db
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-ink-600 hover:border-ink-300 hover:text-ink-950',
                )}
              >
                {c.name}
              </Link>
            ))}

            <Link
              href="/customize/custom-print"
              className="ml-auto shrink-0 border-b-2 border-transparent px-3 py-3 font-mono text-label font-semibold uppercase tracking-wider2 text-primary-600 transition-colors hover:border-primary-500"
            >
              Quote a custom job
            </Link>
          </div>
        </div>
        <ColourStrip />
      </nav>

      {/* ---- Mobile drawer ---- */}
      {isOpen && (
        <div className="animate-fade-rise max-h-[calc(100vh-4rem)] overflow-y-auto border-t border-ink-200 bg-white md:hidden">
          <div className="mx-auto max-w-sheet px-4 py-5">
            <form onSubmit={handleSearchSubmit} className="mb-5" role="search">
              <div className="relative">
                <Search
                  size={16}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-400"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  value={navSearch}
                  onChange={e => setNavSearch(e.target.value)}
                  placeholder="Search products…"
                  aria-label="Search products"
                  className="h-11 rounded-full pl-11 pr-4 text-body-s"
                />
              </div>
            </form>

            <p className="label-caps mb-2">Categories</p>
            <div className="grid grid-cols-2 gap-2">
              <Link
                href="/catalog"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2 rounded-lg border border-ink-200 bg-white px-3 py-3 font-mono text-micro font-semibold uppercase tracking-wider2 text-ink-800"
              >
                <LayoutGrid size={14} aria-hidden="true" />
                All products
              </Link>
              {CATEGORIES.map(c => (
                <Link
                  key={c.key}
                  href={categoryHref(c)}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-between rounded-lg border border-ink-200 bg-white px-3 py-3 font-mono text-micro font-semibold uppercase tracking-wider2 text-ink-800"
                >
                  {c.name}
                  <ArrowRight size={13} className="text-ink-300" aria-hidden="true" />
                </Link>
              ))}
            </div>

            <nav className="mt-5 flex flex-col" aria-label="Utility">
              {UTILITY_LINKS.map(l => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-between border-b border-ink-100 py-3.5 font-display text-title font-bold text-ink-900"
                >
                  {l.label}
                  <ArrowRight size={16} className="text-ink-300" aria-hidden="true" />
                </Link>
              ))}
            </nav>

            <ButtonLink
              href="/catalog"
              size="lg"
              onClick={() => setIsOpen(false)}
              className="mt-6 w-full"
            >
              Start a print job
            </ButtonLink>
          </div>
        </div>
      )}
    </header>
  );
};