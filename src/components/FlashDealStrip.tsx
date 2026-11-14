'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Flame, Clock, ArrowRight } from 'lucide-react';

interface FlashDealStripProps {
  saleActive?: boolean;
  title?: string;
  badge?: string;
}

export function FlashDealStrip({
  saleActive: propSaleActive,
  title: propTitle,
  badge: propBadge,
}: FlashDealStripProps) {
  const [isActive, setIsActive] = useState(propSaleActive !== false);
  const [saleTitle, setSaleTitle] = useState(
    propTitle || 'Up to 35% Bulk Discount on Business Cards & Flex Banners!'
  );
  const [saleBadge, setSaleBadge] = useState(propBadge || 'Deal of the Day');
  const [timeLeft, setTimeLeft] = useState({ hours: 4, minutes: 28, seconds: 15 });

  useEffect(() => {
    // If not explicitly provided via prop, fetch live from settings
    if (propSaleActive === undefined) {
      fetch('/api/settings')
        .then(res => res.json())
        .then(data => {
          if (data?.sale_active !== undefined) {
            setIsActive(data.sale_active === 'true' || data.sale_active === true);
          }
          if (data?.sale_title) setSaleTitle(data.sale_title);
          if (data?.sale_badge) setSaleBadge(data.sale_badge);
          if (data?.sale_hours) {
            const h = parseInt(data.sale_hours, 10);
            if (!isNaN(h) && h > 0) setTimeLeft({ hours: h, minutes: 0, seconds: 0 });
          }
        })
        .catch(() => {});
    } else {
      setIsActive(propSaleActive);
    }
  }, [propSaleActive]);

  useEffect(() => {
    if (!isActive) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        return { hours: 6, minutes: 0, seconds: 0 };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isActive]);

  if (!isActive) return null;

  const format = (n: number) => n.toString().padStart(2, '0');

  return (
    <div className="border-b border-primary-200 bg-gradient-to-r from-blue-700 via-primary-700 to-indigo-800 text-white shadow-xs">
      <div className="mx-auto flex max-w-sheet flex-col items-center justify-between gap-2 px-4 py-2.5 sm:flex-row sm:px-6">
        <div className="flex flex-wrap items-center justify-center gap-2 text-center sm:justify-start">
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-400 px-2 py-0.5 font-mono text-micro font-extrabold uppercase tracking-wider text-ink-950 shadow-xs">
            <Flame size={12} className="text-red-600 fill-red-600" />
            {saleBadge}
          </span>
          <span className="font-display text-body-s font-semibold">
            {saleTitle}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-mono text-micro font-bold">
            <Clock size={13} className="text-amber-300" />
            <span className="text-amber-200">Ends in:</span>
            <span className="rounded bg-black/40 px-1.5 py-0.5 text-white">
              {format(timeLeft.hours)}h
            </span>
            :
            <span className="rounded bg-black/40 px-1.5 py-0.5 text-white">
              {format(timeLeft.minutes)}m
            </span>
            :
            <span className="rounded bg-black/40 px-1.5 py-0.5 text-amber-300">
              {format(timeLeft.seconds)}s
            </span>
          </div>

          <Link
            href="/catalog?deals=true"
            className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-primary-800 transition-all hover:bg-amber-300 hover:text-ink-950"
          >
            <span>Shop Deals</span>
            <ArrowRight size={11} />
          </Link>
        </div>
      </div>
    </div>
  );
}
