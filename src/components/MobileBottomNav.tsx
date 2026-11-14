'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  LayoutGrid,
  Flame,
  ShoppingBag,
  User,
  PackageCheck,
  Sparkles,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export function MobileBottomNav() {
  const pathname = usePathname();
  const { cart } = useCart();
  const { user } = useAuth();
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
      id: 'catalog',
      label: 'Explore',
      href: '/catalog',
      icon: LayoutGrid,
      isActive: pathname.startsWith('/catalog') && !pathname.includes('deals='),
    },
    {
      id: 'deals',
      label: 'Deals',
      href: '/catalog?deals=true',
      icon: Flame,
      badge: 'SALE',
      isActive: pathname.includes('deals='),
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
      id: 'account',
      label: user ? 'Account' : 'Sign In',
      href: user ? '/account' : '/login',
      icon: user ? PackageCheck : User,
      isActive: pathname === '/account' || pathname === '/login' || pathname === '/track',
      userInitial: user?.user_metadata?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase(),
    },
  ];

  return (
    <div className="fixed bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 z-50 w-[94%] max-w-md pointer-events-auto select-none">
      <nav
        aria-label="Floating Navigation Dock"
        className="relative flex items-center justify-around px-2 py-1.5 rounded-full border border-ink-900/10 dark:border-white/15 bg-white/90 dark:bg-ink-950/90 backdrop-blur-2xl shadow-[0_12px_36px_rgba(0,0,0,0.16)] transition-all duration-300"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = tab.isActive;

          return (
            <Link
              key={tab.id}
              href={tab.href}
              className={`group relative flex flex-1 flex-col items-center justify-center py-1 px-1.5 rounded-full transition-all duration-200 active:scale-90 ${
                active
                  ? 'text-primary-600 dark:text-primary-400 font-semibold'
                  : 'text-ink-600 hover:text-ink-950 dark:text-ink-400 dark:hover:text-white'
              }`}
            >
              {/* Active pill glow wash */}
              {active && (
                <span className="absolute inset-0 rounded-full bg-primary-500/10 dark:bg-primary-500/20 -z-10 animate-in fade-in zoom-in-95 duration-200" />
              )}

              <div className="relative flex items-center justify-center">
                <Icon
                  size={20}
                  className={`transition-transform duration-200 group-hover:scale-110 ${
                    active ? 'stroke-[2.5]' : 'stroke-[1.8]'
                  }`}
                />

                {/* Cart Badge with glowing dot */}
                {tab.count !== undefined && tab.count > 0 && (
                  <span className="absolute -right-2.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-gradient-to-r from-red-600 to-rose-500 px-1 font-mono text-[9px] font-extrabold text-white shadow-sm ring-1 ring-white/50 animate-in zoom-in-75">
                    {tab.count > 9 ? '9+' : tab.count}
                  </span>
                )}

                {/* Hot Deal Flame Badge */}
                {tab.badge && (
                  <span className="absolute -right-3 -top-1.5 flex items-center gap-0.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-1 py-0.2 font-mono text-[8px] font-black uppercase text-white shadow-xs">
                    <Sparkles size={7} />
                    {tab.badge}
                  </span>
                )}

                {/* User initial avatar indicator if signed in */}
                {tab.userInitial && (
                  <span className="absolute -right-1.5 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-600 text-[8px] font-bold text-white shadow-xs">
                    {tab.userInitial}
                  </span>
                )}
              </div>

              {/* Text Label */}
              <span className="mt-0.5 font-sans text-[10px] tracking-tight leading-none truncate max-w-[54px]">
                {tab.label}
              </span>

              {/* Sub-dot active indicator */}
              {active && (
                <span className="mt-0.5 h-1 w-2.5 rounded-full bg-primary-600 dark:bg-primary-400 shadow-xs" />
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

// Export alias for dock
export { MobileBottomNav as BottomDock };
