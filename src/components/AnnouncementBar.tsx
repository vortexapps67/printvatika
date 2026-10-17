'use client';

import React, { useEffect, useState } from 'react';
import { Truck, MapPin, Clock, BadgeCheck, Tag } from 'lucide-react';
import { SITE } from '../lib/site';

/**
 * Promo bar.
 *
 * Sits above the header and rotates through the four promises that actually
 * decide whether someone orders from a local press: how fast, how cheap to
 * collect, whether they can check it first, and what delivery costs. Every
 * line is a fact we can honour, not a discount we cannot.
 */

/* Short on purpose: this sits in a fixed-height bar that has to survive a
   320px viewport without truncating. The long form of each promise lives in
   the strip further down the homepage. */
const PROMISES = [
  { Icon: Clock, text: '24–48 hr dispatch' },
  { Icon: MapPin, text: 'Free counter pickup' },
  { Icon: Tag, text: 'Up to 35% off on bulk tiers' },
  { Icon: BadgeCheck, text: 'Live proof before you pay' },
  { Icon: Truck, text: `Flat ₹${SITE.deliveryCharge} delivery in NCR` },
] as const;

const ROTATE_MS = 5200;

export function AnnouncementBar() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % PROMISES.length);
    }, ROTATE_MS);
    return () => window.clearInterval(id);
  }, []);

  const { Icon, text } = PROMISES[index];

  return (
    <div className="bg-ink-950 text-white">
      <div className="mx-auto flex h-10 max-w-sheet items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        {/* Rotating promise. aria-live is off: this is ambient, and announcing
            it four times a cycle would be noise for a screen reader. */}
        <p className="flex min-w-0 items-center gap-2 font-mono text-micro uppercase tracking-wider2 text-ink-300">
          <Icon size={13} className="flex-none text-primary-500" aria-hidden="true" />
          <span className="truncate">{text}</span>
        </p>

        <a
          href={`tel:${SITE.phoneRaw}`}
          className="hidden flex-none items-center gap-2 font-mono text-micro uppercase tracking-wider2 text-ink-300 transition-colors hover:text-white sm:flex"
        >
          {SITE.phoneDisplay}
        </a>
      </div>
    </div>
  );
}