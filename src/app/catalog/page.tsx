import React from 'react';
import { DbClient } from '../../lib/db';
import { CatalogClient } from '../../components/CatalogClient';
import { ColourStrip, RegistrationMark } from '../../components/ui/press';
import { dealsBySlug } from '../../lib/catalog';
import { BESTSELLERS } from '../../lib/merch';
import { SITE } from '../../lib/site';
import { PackageSearch, Truck, PackageCheck, BadgeCheck } from 'lucide-react';

export const revalidate = 0;

export default async function CatalogPage() {
  const [products, rules] = await Promise.all([
    DbClient.getProducts(),
    DbClient.getAllPricingRules(),
  ]);
  const deals = dealsBySlug(rules);

  return (
    <div className="mx-auto max-w-sheet px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <header className="pb-7">
        <div className="flex items-center gap-2.5">
          <RegistrationMark className="text-primary-500" />
          <span className="label-caps">The catalog</span>
        </div>

        <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-display-s sm:text-display">
              Eight ways to
              <br className="hidden sm:block" /> put it on paper.
            </h1>
            <p className="mt-4 max-w-xl text-body text-ink-500">
              Pick a product to set its stock, finish, size and quantity. Every option reprices the
              job as you go.
            </p>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-ink-200 bg-white px-5 py-3.5 shadow-card">
            <PackageSearch size={18} className="text-primary-500" aria-hidden="true" />
            <span className="tnum font-display text-title-l font-extrabold leading-none text-ink-950">
              {products.length}
            </span>
            <span className="font-mono text-micro uppercase tracking-wider2 text-ink-500">
              {products.length === 1 ? 'Product' : 'Products'}
            </span>
          </div>
        </div>
        <ColourStrip rule className="mt-7" />
      </header>

      {/* Offer bar — the same four facts the homepage promises, kept in view
          while somebody is choosing product options. */}
      <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { Icon: Truck, text: `Flat ₹${SITE.deliveryCharge} courier across India` },
          { Icon: PackageCheck, text: 'Free counter pickup, no minimum' },
          { Icon: BadgeCheck, text: 'Up to 35% off on bulk tiers' },
          { Icon: PackageSearch, text: 'Live price as you change the spec' },
        ].map(({ Icon, text }) => (
          <li
            key={text}
            className="flex items-center gap-2.5 rounded-xl border border-ink-200 bg-white px-4 py-3 shadow-card"
          >
            <Icon size={16} className="flex-none text-primary-500" aria-hidden="true" />
            <span className="font-mono text-micro uppercase tracking-wider2 text-ink-600">
              {text}
            </span>
          </li>
        ))}
      </ul>

      <div className="pt-8">
        <CatalogClient products={products} deals={deals} bestsellers={[...BESTSELLERS]} />
      </div>
    </div>
  );
}