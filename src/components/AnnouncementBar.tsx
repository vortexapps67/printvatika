'use client';

import React from 'react';
import Link from 'next/link';
import { Truck, Phone } from 'lucide-react';
import { SITE } from '../lib/site';

export function AnnouncementBar() {
  return (
    <div className="bg-ink-950 text-ink-100">
      <div className="mx-auto flex h-10 max-w-sheet items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <p className="flex min-w-0 items-center gap-2 text-body-s font-medium">
          <Truck size={15} className="flex-none text-primary-400" aria-hidden="true" />
          <span className="truncate">
            Dispatch in 24–48 hrs · Free counter pickup · Flat ₹{SITE.deliveryCharge} delivery across India
          </span>
        </p>
        <div className="hidden flex-none items-center gap-4 text-body-s sm:flex">
          <a
            href={`tel:${SITE.phoneRaw}`}
            className="flex items-center gap-1.5 font-medium text-ink-300 transition-colors hover:text-white"
          >
            <Phone size={14} aria-hidden="true" />
            {SITE.phoneDisplay}
          </a>
          <Link href="/track" className="font-medium text-ink-300 transition-colors hover:text-white">
            Track order
          </Link>
          <Link href="/login" className="font-medium text-primary-300 transition-colors hover:text-primary-200">
            Login / Signup
          </Link>
        </div>
      </div>
    </div>
  );
}
