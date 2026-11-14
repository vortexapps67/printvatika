'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { AnnouncementBar } from './AnnouncementBar';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { MobileBottomNav } from './MobileBottomNav';
import { PwaInstallPrompt } from './PwaInstallPrompt';

export function StorefrontShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin');

  if (isAdmin) {
    // Pure standalone Admin Console environment:
    // Strip customer announcement bar, customer navbar, customer footer, and customer floating bottom dock!
    return (
      <div className="flex min-h-screen flex-col bg-[#0B0F19] [background-image:none] text-slate-100 antialiased">
        {children}
      </div>
    );
  }

  return (
    <>
      <AnnouncementBar />
      <Navbar />
      <main id="main" className="flex-grow pb-24 md:pb-8">
        {children}
      </main>
      <Footer />
      <MobileBottomNav />
      <PwaInstallPrompt />
    </>
  );
}
