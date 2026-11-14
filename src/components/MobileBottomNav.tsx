'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, LayoutGrid, Flame, ShoppingBag, PackageCheck } from 'lucide-react';
import { useCart } from '../context/CartContext';

export function MobileBottomNav() {
  const pathname = usePathname();
  const { cart } = useCart();
  const cartCount = cart.length;

  const tabs = [
    {
      id: 'home',
      label: 'Home',
      href: '/',
      icon: Home,
      isActive: pathname === '/',
    },
    {
      id: 'categories',
      label: 'Categories',
      href: '/catalog',
      icon: LayoutGrid,
      isActive: pathname.startsWith('/catalog') && !pathname.includes('deal='),
    },
    {
      id: 'deals',
      label: 'Top Deals',
      href: '/catalog?deals=true',
      icon: Flame,
      badge: '35%',
      isActive: pathname.includes('deals=true'),
    },
    {
      id: 'cart',
      label: 'Cart',
      href: '/cart',
      icon: ShoppingBag,
      count: cartCount,
      isActive: pathname === '/cart',
    },
    {
      id: 'orders',
      label: 'Orders',
      href: '/track',
      icon: PackageCheck,
      isActive: pathname === '/track',
    },
  ];

  return (
    <nav
      aria-label="Mobile app navigation"
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-ink-200 bg-white/95 pb-[max(0.35rem,env(safe-area-inset-bottom))] pt-1 backdrop-blur-md shadow-card-hover md:hidden"
    >
      <div className="flex items-center justify-around">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const active = tab.isActive;

          return (
            <Link
              key={tab.id}
              href={tab.href}
              className={`relative flex flex-1 flex-col items-center justify-center py-1 transition-all active:scale-95 ${
                active ? 'text-primary-600 font-semibold' : 'text-ink-500 hover:text-ink-900'
              }`}
            >
              <div className="relative">
                <Icon size={20} className={active ? 'stroke-[2.4]' : 'stroke-[1.8]'} />

                {/* Cart badge */}
                {tab.count !== undefined && tab.count > 0 && (
                  <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 font-mono text-[9px] font-bold text-white shadow-sm">
                    {tab.count > 9 ? '9+' : tab.count}
                  </span>
                )}

                {/* Deals badge */}
                {tab.badge && (
                  <span className="absolute -right-3 -top-1.5 rounded-full bg-orange-600 px-1 py-0.2 font-mono text-[8px] font-extrabold uppercase text-white shadow-xs">
                    {tab.badge}
                  </span>
                )}
              </div>

              <span className="mt-1 font-sans text-[10px] tracking-tight">
                {tab.label}
              </span>

              {/* Active pill dot indicator */}
              {active && (
                <span className="mt-0.5 h-1 w-4 rounded-full bg-primary-600" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
