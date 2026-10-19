'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Product } from '../types';
import { ProductCard } from './ProductCard';
import { Button, ColourStrip, EmptyState } from './ui/press';
import { CATEGORIES } from '../lib/catalog';
import type { Deal } from '../lib/catalog';
import { Search, X, SlidersHorizontal, ArrowUpDown, PackageSearch } from 'lucide-react';

interface CatalogClientProps {
  products: Product[];
  /** Deepest real quantity-tier discount per product slug, from pricing_rules. */
  deals?: Record<string, Deal>;
  /** Slugs flagged as bestsellers, so cards carry the same mark storewide. */
  bestsellers?: string[];
}

type SortKey = 'featured' | 'price-asc' | 'price-desc' | 'name-asc';

const SORTS: { value: SortKey; label: string }[] = [
  { value: 'featured', label: 'Featured' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
  { value: 'name-asc', label: 'Name: A–Z' },
];

function CatalogClientContent({ products, deals, bestsellers }: CatalogClientProps) {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || searchParams.get('search') || '';
  const initialCategory = searchParams.get('category') || 'all';

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [sortBy, setSortBy] = useState<SortKey>('featured');

  useEffect(() => {
    const q = searchParams.get('q') || searchParams.get('search');
    if (q !== null) setSearchQuery(q);
    const cat = searchParams.get('category');
    if (cat !== null) setSelectedCategory(cat);
  }, [searchParams]);

  /* Chip labels come from the shared category registry, so the filter row
     always reads "Stationery" rather than whatever string db.json happens
     to hold, and the order matches the header nav. */
  const categories = useMemo(() => {
    const present = new Set(products.filter(p => p.is_active !== false).map(p => p.category));
    const known = CATEGORIES.filter(c => present.has(c.db)).map(c => ({ value: c.db, label: c.name }));
    const stray = Array.from(present)
      .filter(db => !CATEGORIES.some(c => c.db === db))
      .map(db => ({ value: db, label: db }));
    return [{ value: 'all', label: 'All products' }, ...known, ...stray];
  }, [products]);

  const filteredProducts = useMemo(() => {
    let list = products.filter(p => p.is_active !== false);

    if (selectedCategory && selectedCategory.toLowerCase() !== 'all') {
      list = list.filter(p => p.category.toLowerCase() === selectedCategory.toLowerCase());
    }

    const query = searchQuery.trim().toLowerCase();
    if (query) {
      list = list.filter(p => {
        const haystack = `${p.name} ${p.description} ${p.category} ${p.slug}`.toLowerCase();
        return haystack.includes(query);
      });
    }

    return [...list].sort((a, b) => {
      if (sortBy === 'price-asc') return a.base_price - b.base_price;
      if (sortBy === 'price-desc') return b.base_price - a.base_price;
      if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
      return 0;
    });
  }, [products, selectedCategory, searchQuery, sortBy]);

  const hasFilters = Boolean(searchQuery.trim()) || selectedCategory !== 'all';
  const resetAll = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSortBy('featured');
  };

  return (
    <div className="space-y-8">
      {/* Search */}
      <div className="relative">
        <Search
          size={18}
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-400"
          aria-hidden="true"
        />
        <input
          type="search"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          onKeyDown={e => e.key === 'Escape' && setSearchQuery('')}
          placeholder="Search business cards, t-shirts, flex banners, flyers, stickers…"
          aria-label="Search the catalog"
          className="h-12 rounded-full pl-12 pr-12 text-body shadow-card"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute right-4 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-ink-100 text-ink-500 transition-colors hover:bg-ink-200 hover:text-ink-900"
            title="Clear search"
            aria-label="Clear search"
          >
            <X size={15} />
          </button>
        )}
      </div>

      {/* Category + sort */}
      <div className="flex flex-col gap-4 border-y border-ink-200 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="scrollbar-none flex items-center gap-2 overflow-x-auto">
          <SlidersHorizontal size={14} className="flex-none text-ink-400" aria-hidden="true" />
          {categories.map(cat => {
            const isActive = selectedCategory.toLowerCase() === cat.value.toLowerCase();
            return (
              <button
                key={cat.value}
                type="button"
                onClick={() => setSelectedCategory(cat.value)}
                aria-pressed={isActive}
                className={
                  isActive
                    ? 'whitespace-nowrap rounded-full bg-primary-500 px-4 py-2 font-mono text-micro font-semibold uppercase tracking-wider2 text-white shadow-card transition-colors hover:bg-primary-600'
                    : 'whitespace-nowrap rounded-full border border-ink-200 bg-white px-4 py-2 font-mono text-micro font-semibold uppercase tracking-wider2 text-ink-600 transition-colors hover:border-ink-950 hover:text-ink-950'
                }
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        <div className="flex flex-none items-center justify-between gap-4 lg:justify-end">
          <span className="tnum font-mono text-label text-ink-500">
            {filteredProducts.length} {filteredProducts.length === 1 ? 'result' : 'results'}
          </span>
          <div className="flex items-center gap-2">
            <ArrowUpDown size={13} className="text-ink-400" aria-hidden="true" />
            <label htmlFor="sort" className="sr-only">
              Sort products
            </label>
            <select
              id="sort"
              value={sortBy}
              onChange={e => setSortBy(e.target.value as SortKey)}
              className="h-9 w-auto py-0 font-mono text-micro uppercase tracking-wider2"
            >
              {SORTS.map(s => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Active filter chips */}
      {hasFilters && (
        <div className="flex flex-wrap items-center gap-2.5 rounded-2xl border border-primary-200/70 bg-primary-50/70 px-4 py-3">
          <span className="label-caps">Filtered by</span>
          {searchQuery.trim() && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary-300 bg-white px-3 py-1.5 font-mono text-micro text-primary-700">
              “{searchQuery.trim()}”
              <button type="button" onClick={() => setSearchQuery('')} aria-label="Remove search filter">
                <X size={11} />
              </button>
            </span>
          )}
          {selectedCategory !== 'all' && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary-300 bg-white px-3 py-1.5 font-mono text-micro text-primary-700">
              {categories.find(c => c.value.toLowerCase() === selectedCategory.toLowerCase())
                ?.label ?? selectedCategory}
              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                aria-label="Remove category filter"
              >
                <X size={11} />
              </button>
            </span>
          )}
          <Button variant="ghost" size="sm" onClick={resetAll} className="ml-auto">
            Reset all
          </Button>
        </div>
      )}

      {/* Grid */}
      {filteredProducts.length > 0 ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {filteredProducts.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                deal={deals?.[product.slug]}
                bestseller={bestsellers?.includes(product.slug)}
              />
            ))}
          </div>
          <ColourStrip />
        </>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-ink-200/80 bg-white shadow-card">
          <EmptyState
            icon={<PackageSearch size={22} />}
            title="Nothing matches that"
            body="Try a broader term, or clear the filters to see all eight product lines."
            action={
              <Button variant="ink" onClick={resetAll}>
                Clear filters
              </Button>
            }
          />
        </div>
      )}
    </div>
  );
}

export const CatalogClient: React.FC<CatalogClientProps> = ({ products, deals, bestsellers }) => (
  <Suspense
    fallback={
      <div className="py-20 text-center font-mono text-label uppercase tracking-wider2 text-ink-400">
        Loading catalog…
      </div>
    }
  >
    <CatalogClientContent products={products} deals={deals} bestsellers={bestsellers} />
  </Suspense>
);