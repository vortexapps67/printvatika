'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Product } from '../types';
import { ProductCard } from './ProductCard';
import { Search, X, SlidersHorizontal, ArrowUpDown, PackageSearch, Sparkles } from 'lucide-react';

interface CatalogClientProps {
  products: Product[];
}

function CatalogClientContent({ products }: CatalogClientProps) {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || searchParams.get('search') || '';
  const initialCategory = searchParams.get('category') || 'all';

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'name-asc'>('featured');

  // Sync if URL search params change
  useEffect(() => {
    const q = searchParams.get('q') || searchParams.get('search');
    if (q !== null) {
      setSearchQuery(q);
    }
    const cat = searchParams.get('category');
    if (cat !== null) {
      setSelectedCategory(cat);
    }
  }, [searchParams]);

  // Extract unique categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach(p => {
      if (p.category) set.add(p.category);
    });
    return ['all', ...Array.from(set)];
  }, [products]);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let list = products.filter(p => p.is_active !== false);

    // Category filter
    if (selectedCategory && selectedCategory.toLowerCase() !== 'all') {
      list = list.filter(
        p => p.category.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    // Search query filter
    const query = searchQuery.trim().toLowerCase();
    if (query) {
      list = list.filter(p => {
        const nameMatch = p.name.toLowerCase().includes(query);
        const descMatch = p.description.toLowerCase().includes(query);
        const catMatch = p.category.toLowerCase().includes(query);
        const slugMatch = p.slug.toLowerCase().includes(query);
        return nameMatch || descMatch || catMatch || slugMatch;
      });
    }

    // Sorting
    return [...list].sort((a, b) => {
      if (sortBy === 'price-asc') return a.base_price - b.base_price;
      if (sortBy === 'price-desc') return b.base_price - a.base_price;
      if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
      return 0; // featured/default
    });
  }, [products, selectedCategory, searchQuery, sortBy]);

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  const handleResetAll = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSortBy('featured');
  };

  return (
    <div className="space-y-8">
      {/* Search & Controls Section */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        {/* Search Bar Input */}
        <div className="relative flex items-center">
          <div className="absolute left-4 pointer-events-none text-slate-400">
            <Search size={20} />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Escape') handleClearSearch();
            }}
            placeholder="Search printing products (e.g., business cards, t-shirts, flex banners, flyers, posters)..."
            className="w-full pl-11 pr-10 py-3 text-sm sm:text-base bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-slate-800 placeholder-slate-400 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
          />
          {searchQuery && (
            <button
              onClick={handleClearSearch}
              className="absolute right-3 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
              title="Clear search (Esc)"
              aria-label="Clear search"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Categories and Sort Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2 border-t border-slate-100">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <SlidersHorizontal size={15} className="text-slate-400 shrink-0 hidden sm:block" />
            {categories.map(cat => {
              const isActive = selectedCategory.toLowerCase() === cat.toLowerCase();
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-primary-600 text-white shadow-sm ring-2 ring-primary-500/30'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                  }`}
                >
                  {cat === 'all' ? 'All Products' : cat}
                </button>
              );
            })}
          </div>

          {/* Sort Selector & Result Count */}
          <div className="flex items-center justify-between md:justify-end gap-3 shrink-0">
            <span className="text-xs text-slate-500 font-medium">
              {filteredProducts.length} {filteredProducts.length === 1 ? 'item' : 'items'}
            </span>

            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs">
              <ArrowUpDown size={13} className="text-slate-400" />
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                className="bg-transparent text-slate-700 font-medium focus:outline-none cursor-pointer"
                aria-label="Sort products by"
              >
                <option value="featured">Featured</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="name-asc">Name: A-Z</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Active Filter Indicators */}
      {(searchQuery || selectedCategory !== 'all') && (
        <div className="flex items-center justify-between bg-primary-50/70 border border-primary-100 text-primary-900 rounded-xl px-4 py-2.5 text-xs font-medium">
          <div className="flex items-center gap-2 flex-wrap">
            <span>Filtering by:</span>
            {searchQuery && (
              <span className="inline-flex items-center gap-1 bg-white border border-primary-200 text-primary-800 px-2 py-0.5 rounded-md font-semibold">
                "{searchQuery}"
                <button onClick={handleClearSearch} className="hover:text-red-500 ml-0.5">
                  <X size={12} />
                </button>
              </span>
            )}
            {selectedCategory !== 'all' && (
              <span className="inline-flex items-center gap-1 bg-white border border-primary-200 text-primary-800 px-2 py-0.5 rounded-md font-semibold">
                Category: {selectedCategory}
                <button onClick={() => setSelectedCategory('all')} className="hover:text-red-500 ml-0.5">
                  <X size={12} />
                </button>
              </span>
            )}
          </div>

          <button
            onClick={handleResetAll}
            className="text-primary-700 hover:text-primary-900 underline font-semibold shrink-0 ml-2"
          >
            Reset All
          </button>
        </div>
      )}

      {/* Product Grid */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {filteredProducts.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-16 px-4 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
          <div className="w-14 h-14 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
            <PackageSearch size={28} />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-800">No matching products found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              We couldn't find any products matching your search criteria. Try checking for typos, using broader keywords, or clearing your filters.
            </p>
          </div>
          <button
            onClick={handleResetAll}
            className="inline-flex items-center gap-1.5 bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-sm"
          >
            Clear Filters & Show All
          </button>
        </div>
      )}
    </div>
  );
}

export const CatalogClient: React.FC<CatalogClientProps> = ({ products }) => {
  return (
    <Suspense
      fallback={
        <div className="py-12 text-center text-slate-400 text-sm animate-pulse">
          Loading catalog...
        </div>
      }
    >
      <CatalogClientContent products={products} />
    </Suspense>
  );
};
