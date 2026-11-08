'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldAlert, Loader2, KeyRound, Eye, EyeOff } from 'lucide-react';
import { Button, ColourStrip, Field, RegistrationMark } from '../../../components/ui/press';

export default function AdminLoginPage() {
  const router = useRouter();
  // No credentials are kept here: the access check runs server-side against the
  // press's own admin record (see /api/admin/login), so nothing an operator or a
  // visitor can see on this page ever becomes a password.
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
        throw new Error(data.error || 'Invalid credentials.');
      }

      router.push('/admin/dashboard');
    } catch (e: any) {
      setError(e.message || 'Login failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-grow items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
      <div className="w-full max-w-md rounded-xl border border-ink-200 bg-white shadow-card">
        <ColourStrip />

        <div className="p-7 sm:p-8">
          <img
            src="/images/logo-lockup.webp"
            alt="Print Vatika"
            width={520}
            height={404}
            className="h-auto w-[190px]"
          />

          <div className="mt-7 flex items-center gap-2.5">
            <RegistrationMark className="text-primary-500" />
            <span className="label-caps">Staff only</span>
          </div>

          <h1 className="mt-4 text-title-l">Press administration</h1>
          <p className="mt-2 text-body text-ink-500">
            Manage the order queue, catalog and pricing rules.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <Field label="Access password" htmlFor="password" required>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  className="pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-ink-400 transition-colors hover:text-ink-600"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </Field>

            {error && (
              <div
                role="alert"
                className="flex items-center gap-2.5 rounded border border-red-300 bg-red-50 px-3.5 py-2.5 text-body-s font-medium text-red-700"
              >
                <ShieldAlert size={15} className="flex-none" aria-hidden="true" />
                {error}
              </div>
            )}

            <Button type="submit" size="lg" plate disabled={isLoading} className="w-full">
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                  Checking
                </>
              ) : (
                <>
                  <KeyRound size={16} aria-hidden="true" />
                  Access dashboard
                </>
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}