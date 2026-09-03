'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '../context/CartContext';
import { ShoppingBag, Menu, X, Printer, ShieldAlert, Search } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { cart } = useCart();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [navSearch, setNavSearch] = useState('');

  const cartCount = cart.length;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = navSearch.trim();
    if (query) {
      router.push(`/catalog?q=${encodeURIComponent(query)}`);
      setIsOpen(false);
    } else {
      router.push('/catalog');
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 gap-4">
          {/* Logo Brand */}
          <div className="flex items-center shrink-0">
            <Link href="/" className="flex items-center gap-2.5 text-primary-700 font-black text-xl tracking-tight group">
              <div className="bg-primary-600 text-white p-1.5 rounded-lg shadow-sm group-hover:bg-primary-700 transition-colors">
                <Printer size={20} className="stroke-[2.5]" />
              </div>
              <span className="bg-gradient-to-r from-primary-700 via-primary-600 to-indigo-600 bg-clip-text text-transparent font-serif tracking-tight">
                Print Vatika
              </span>
            </Link>
          </div>

          {/* Desktop Search Bar */}
          <form
            onSubmit={handleSearchSubmit}
            className="hidden md:flex flex-1 max-w-md mx-4 relative items-center"
          >
            <div className="absolute left-3 text-slate-400 pointer-events-none">
              <Search size={16} />
            </div>
            <input
              type="text"
              value={navSearch}
              onChange={e => setNavSearch(e.target.value)}
              placeholder="Search products (visiting cards, banners, t-shirts)..."
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 hover:bg-slate-100/80 focus:bg-white text-slate-800 placeholder-slate-400 rounded-full border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
            />
            {navSearch && (
              <button
                type="button"
                onClick={() => setNavSearch('')}
                className="absolute right-3 text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            )}
          </form>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-6 font-semibold text-xs text-slate-600 shrink-0">
            <Link href="/" className="hover:text-primary-600 transition-colors">
              Home
            </Link>
            <Link href="/catalog" className="hover:text-primary-600 transition-colors">
              Catalog
            </Link>
            <Link href="/track" className="hover:text-primary-600 transition-colors">
              Track Order
            </Link>
            <Link
              href="/admin/dashboard"
              className="flex items-center gap-1 hover:text-indigo-600 text-slate-500 font-medium border border-slate-200 rounded-full px-3 py-1 hover:bg-slate-50 transition-colors"
            >
              <ShieldAlert size={13} /> Admin
            </Link>

            {/* Cart Icon Bubble */}
            <Link
              href="/cart"
              className="relative p-2 bg-slate-50 rounded-full border border-slate-200 text-slate-700 hover:bg-primary-50 hover:text-primary-600 transition-all shadow-sm"
              aria-label="Shopping Cart"
            >
              <ShoppingBag size={18} />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full text-[10px] w-4.5 h-4.5 flex items-center justify-center font-bold shadow-sm">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>

          {/* Mobile Menu Buttons */}
          <div className="md:hidden flex items-center gap-3">
            <Link
              href="/cart"
              className="relative p-2 bg-slate-50 rounded-full border border-slate-200 text-slate-700"
              aria-label="Shopping Cart"
            >
              <ShoppingBag size={18} />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full text-[9px] w-4.5 h-4.5 flex items-center justify-center font-bold">
                  {cartCount}
                </span>
              )}
            </Link>
            
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-slate-600 focus:outline-none hover:bg-slate-100 p-1.5 rounded-lg border border-slate-200"
              aria-label="Toggle Menu"
            >
              {isOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white shadow-lg animate-in slide-in-from-top duration-200 p-3 space-y-2">
          {/* Mobile Search Input */}
          <form onSubmit={handleSearchSubmit} className="relative flex items-center mb-2">
            <div className="absolute left-3 text-slate-400 pointer-events-none">
              <Search size={15} />
            </div>
            <input
              type="text"
              value={navSearch}
              onChange={e => setNavSearch(e.target.value)}
              placeholder="Search products..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 text-slate-800 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </form>

          <div className="space-y-1 text-sm font-semibold text-slate-700">
            <Link
              href="/"
              onClick={() => setIsOpen(false)}
              className="block px-3 py-2 rounded-lg hover:bg-primary-50 hover:text-primary-600 transition-colors"
            >
              Home
            </Link>
            <Link
              href="/catalog"
              onClick={() => setIsOpen(false)}
              className="block px-3 py-2 rounded-lg hover:bg-primary-50 hover:text-primary-600 transition-colors"
            >
              Print Catalog
            </Link>
            <Link
              href="/track"
              onClick={() => setIsOpen(false)}
              className="block px-3 py-2 rounded-lg hover:bg-primary-50 hover:text-primary-600 transition-colors"
            >
              Track Order
            </Link>
            <Link
              href="/admin/dashboard"
              onClick={() => setIsOpen(false)}
              className="block px-3 py-2 rounded-lg text-indigo-600 bg-indigo-50/50 hover:bg-indigo-50 transition-colors"
            >
              Admin Dashboard
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};
