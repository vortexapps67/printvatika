'use client';

import React, { useEffect, useState } from 'react';
import { Download, X, Sparkles, Smartphone } from 'lucide-react';

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already in standalone mode (installed)
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsInstalled(true);
      return;
    }

    // Register service worker if supported
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }

    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Don't show immediately, delay 3 seconds for smooth first page load
      const timer = setTimeout(() => {
        const dismissed = localStorage.getItem('pv_pwa_dismissed');
        if (!dismissed) setShowPrompt(true);
      }, 3000);
      return () => clearTimeout(timer);
    };

    window.addEventListener('beforeinstallprompt', handler);

    window.addEventListener('appinstalled', () => {
      setShowPrompt(false);
      setIsInstalled(true);
      setDeferredPrompt(null);
    });

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    try {
      localStorage.setItem('pv_pwa_dismissed', 'true');
    } catch {}
  };

  if (!showPrompt || isInstalled) return null;

  return (
    <div className="fixed bottom-16 left-3 right-3 z-40 mx-auto max-w-md rounded-xl border border-primary-200 bg-white p-3.5 shadow-2xl animate-fade-rise md:bottom-5 md:right-5 md:left-auto">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-primary-600 text-white shadow-sm">
          <Smartphone size={22} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="font-display text-body-s font-bold text-ink-950">
              Print Vatika Web App
            </span>
            <span className="rounded bg-primary-50 px-1.5 py-0.2 font-mono text-[9px] font-bold uppercase text-primary-700">
              PWA
            </span>
          </div>
          <p className="mt-0.5 text-micro text-ink-500">
            Install on your phone for 1-tap ordering & order tracking!
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleInstallClick}
            className="flex items-center gap-1 rounded-lg bg-primary-600 px-3 py-1.5 font-mono text-micro font-bold uppercase tracking-wider text-white shadow-sm transition-all hover:bg-primary-700 active:scale-95"
          >
            <Download size={12} />
            Install
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            className="rounded-lg p-1 text-ink-400 hover:bg-ink-100 hover:text-ink-700"
            aria-label="Dismiss app install"
          >
            <X size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
