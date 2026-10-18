'use client';

import React from 'react';
import Link from 'next/link';
import { Truck, Phone } from 'lucide-react';
import { SITE } from '../lib/site';

export function AnnouncementBar() {
  return (
    <div className="bg-primary-500 text-white">
      <div className="mx-auto flex h-10 max-w-sheet items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <p className="flex min-w-0 items-center gap-2 text-body-s font-medium">
          <Truck size={15} className="flex-none" aria-hidden="true" />
          <span className="truncate">
            Get your order in just 24–48 hrs · Enjoy FREE shipping for store pickup across India
          </span>
        </p>
        <div className="hidden flex-none items-center gap-4 text-body-s sm:flex">
          <a href={`tel:${SITE.phoneRaw}`} className="flex items-center gap-1.5 font-medium transition-colors hover:text-white/80">
            <Phone size={14} aria-hidden="true" />
            {SITE.phoneDisplay}
          </a>
          <Link href="/track" className="font-medium transition-colors hover:text-white/80">
            Track Order
          </Link>
          <Link href="/login" className="font-medium transition-colors hover:text-white/80">
            Login / Signup
          </Link>
        </div>
      </div>
    </div>
  );
}