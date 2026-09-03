import React from 'react';
import { DbClient } from '../../lib/db';
import { CatalogClient } from '../../components/CatalogClient';
import { Sparkles, ShoppingBag } from 'lucide-react';

export const revalidate = 0; // Fresh data on each load

export default async function CatalogPage() {
  const products = await DbClient.getProducts();

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 sm:px-6 lg:px-8 space-y-8">
      {/* Page Header */}
      <div className="border-b border-slate-200 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 bg-primary-50 text-primary-700 border border-primary-100 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider mb-2">
            <Sparkles size={12} className="text-primary-600" /> Official Print Press Catalog
          </span>
          <h1 className="font-serif text-3xl font-black text-slate-900 tracking-tight sm:text-4xl">
            Commercial Printing Catalog
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
            Search and select any commercial printing product below to configure paper stocks, dimensions, upload designs, and get instant pricing.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 bg-slate-100/80 border border-slate-200/80 rounded-xl px-3.5 py-2 self-start md:self-auto shadow-sm">
          <ShoppingBag size={14} className="text-primary-600" />
          <span>{products.length} Products in Catalog</span>
        </div>
      </div>

      {/* Interactive Search & Products Client */}
      <CatalogClient products={products} />
    </div>
  );
}
