'use client';

import React from 'react';
import Link from 'next/link';

interface StoryItem {
  name: string;
  shortName: string;
  image: string;
  href: string;
  badge?: string;
  color: string;
}

const STORIES: StoryItem[] = [
  {
    name: 'Business Cards',
    shortName: 'Cards',
    image: '/images/business-cards.jpg',
    href: '/customize/business-cards',
    badge: 'Popular',
    color: 'from-blue-500 to-indigo-600',
  },
  {
    name: 'Flex Banners',
    shortName: 'Signage',
    image: '/images/flex-banners.jpg',
    href: '/customize/flex-banners',
    badge: '₹15/ft',
    color: 'from-amber-500 to-orange-600',
  },
  {
    name: 'Custom T-Shirts',
    shortName: 'T-Shirts',
    image: '/images/t-shirts.jpg',
    href: '/customize/t-shirts',
    color: 'from-emerald-500 to-teal-600',
  },
  {
    name: 'Posters',
    shortName: 'Posters',
    image: '/images/posters.jpg',
    href: '/customize/posters',
    color: 'from-purple-500 to-violet-600',
  },
  {
    name: 'Flyers & Pamphlets',
    shortName: 'Flyers',
    image: '/images/flyers.jpg',
    href: '/customize/flyers',
    badge: 'Bulk',
    color: 'from-rose-500 to-pink-600',
  },
  {
    name: 'Brochures',
    shortName: 'Brochures',
    image: '/images/brochures.jpg',
    href: '/customize/brochures',
    color: 'from-cyan-500 to-blue-600',
  },
  {
    name: 'Stickers & Labels',
    shortName: 'Stickers',
    image: '/images/stickers.svg',
    href: '/customize/stickers',
    color: 'from-yellow-400 to-amber-500',
  },
  {
    name: 'Custom Jobs',
    shortName: 'Specialty',
    image: '/images/custom-print.jpg',
    href: '/customize/custom-print',
    badge: 'Quote',
    color: 'from-slate-700 to-ink-950',
  },
];

export function CategoryStories() {
  return (
    <section
      aria-label="Popular Categories"
      className="scrollbar-none border-b border-ink-100 bg-white py-3 shadow-xs"
    >
      <div className="mx-auto flex max-w-sheet items-center gap-4 overflow-x-auto px-4 sm:px-6">
        {STORIES.map(item => (
          <Link
            key={item.name}
            href={item.href}
            className="group flex flex-none flex-col items-center gap-1.5 transition-transform active:scale-95"
          >
            <div className="relative">
              {/* Outer gradient story ring */}
              <div
                className={`flex h-[60px] w-[60px] sm:h-[68px] sm:w-[68px] items-center justify-center rounded-full bg-gradient-to-tr ${item.color} p-[2px] transition-transform duration-300 group-hover:scale-105 shadow-sm`}
              >
                <div className="h-full w-full overflow-hidden rounded-full bg-white p-[2px]">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="h-full w-full rounded-full object-cover"
                    loading="lazy"
                  />
                </div>
              </div>

              {/* Tag pill */}
              {item.badge && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-red-600 px-1.5 py-0.2 font-mono text-[8px] font-bold uppercase text-white shadow-xs">
                  {item.badge}
                </span>
              )}
            </div>

            <span className="max-w-[70px] truncate text-center font-display text-[11px] font-medium text-ink-800 group-hover:text-primary-600 sm:text-micro">
              {item.shortName}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
