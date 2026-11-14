'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ShieldAlert,
  Loader2,
  KeyRound,
  Eye,
  EyeOff,
  Lock,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Cpu,
} from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Invalid master credentials.');
      }

      router.push('/admin/dashboard');
    } catch (e: any) {
      setError(e.message || 'Login failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-slate-950 px-4 py-12 text-slate-100 sm:px-6 lg:px-8">
      {/* Background ambient lighting */}
      <div className="pointer-events-none absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-primary-600/15 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-indigo-600/15 blur-[120px]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-40" />

      <div className="relative z-10 w-full max-w-md">
        {/* Brand Header */}
        <div className="mb-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/80 px-3.5 py-1.5 shadow-inner backdrop-blur-md">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-slate-300">
              Control Plane v2.0
            </span>
          </div>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Press Administration
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Dedicated management interface for Print Vatika operations.
          </p>
        </div>

        {/* Login Card */}
        <div className="overflow-hidden rounded-3xl border border-slate-800/90 bg-slate-900/80 p-7 sm:p-9 shadow-2xl backdrop-blur-xl">
          {/* Top subtle highlight */}
          <div className="mb-6 flex items-center justify-between border-b border-slate-800 pb-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-600 to-indigo-600 font-black text-white shadow-lg shadow-primary-500/30">
                PV
              </div>
              <div>
                <p className="font-display text-sm font-bold text-white">Print Vatika</p>
                <p className="font-mono text-xs text-slate-400">Restricted Console</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg border border-slate-700/80 bg-slate-800/60 px-2.5 py-1 text-xs text-slate-300">
              <Lock size={12} className="text-primary-400" />
              <span className="font-mono text-[11px]">Staff Only</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-300"
              >
                Master Access Password
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <KeyRound size={17} />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter administrator password"
                  autoComplete="current-password"
                  required
                  autoFocus
                  className="h-12 w-full rounded-2xl border border-slate-700/90 bg-slate-950/80 pl-11 pr-12 font-mono text-sm text-white placeholder-slate-500 shadow-inner transition-all focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div
                role="alert"
                className="flex items-center gap-2.5 rounded-xl border border-red-500/40 bg-red-950/50 p-3.5 text-xs font-medium text-red-300 animate-in fade-in"
              >
                <ShieldAlert size={16} className="shrink-0 text-red-400" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="group relative flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-primary-600 via-primary-500 to-indigo-600 font-semibold text-white shadow-lg shadow-primary-500/25 transition-all duration-200 hover:brightness-110 hover:shadow-xl hover:shadow-primary-500/40 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin text-white" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>Enter Dashboard</span>
                  <ArrowRight
                    size={16}
                    className="transition-transform duration-200 group-hover:translate-x-1"
                  />
                </>
              )}
            </button>
          </form>

          {/* Security note */}
          <div className="mt-6 flex items-center justify-center gap-2 border-t border-slate-800/80 pt-5 text-center text-xs text-slate-500">
            <ShieldCheck size={14} className="text-emerald-500" />
            <span>Encrypted Session · Session Cookie Protected</span>
          </div>
        </div>

        {/* Back to Storefront Link */}
        <div className="mt-6 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 transition-colors hover:text-white"
          >
            <span>Return to Public Storefront</span>
            <ExternalLink size={12} />
          </Link>
        </div>
      </div>
    </div>
  );
}
