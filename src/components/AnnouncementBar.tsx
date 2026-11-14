'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Truck, Phone } from 'lucide-react';
import { SITE } from '../lib/site';

export function AnnouncementBar() {
  const [text, setText] = useState<string>(
    `Commercial printing press near Saket Metro · 24–48 hour dispatch · Free store pickup · Flat ₹${SITE.deliveryCharge} delivery across India`
  );
  const [link, setLink] = useState<string>('/catalog');
  const [phone, setPhone] = useState<string>(SITE.phoneDisplay);
  const [phoneRaw, setPhoneRaw] = useState<string>(SITE.phoneRaw);

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data?.announcement_text) setText(data.announcement_text);
        if (data?.announcement_link) setLink(data.announcement_link);
        if (data?.phone) {
          setPhone(data.phone);
          setPhoneRaw(data.phone.replace(/\D/g, ''));
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="bg-ink-950 text-ink-100">
      <div className="mx-auto flex h-10 max-w-sheet items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <p className="flex min-w-0 items-center gap-2 text-body-s font-medium">
          <Truck size={15} className="flex-none text-primary-400" aria-hidden="true" />
          <Link href={link || '/catalog'} className="truncate hover:text-white transition-colors">
            {text}
          </Link>
        </p>
        <div className="hidden flex-none items-center gap-4 text-body-s sm:flex">
          <a
            href={`tel:${phoneRaw}`}
            className="flex items-center gap-1.5 font-medium text-ink-300 transition-colors hover:text-white"
          >
            <Phone size={14} aria-hidden="true" />
            {phone}
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
