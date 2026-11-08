'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/press';
import { Mail, Lock, User, ArrowRight, Loader2, Eye, EyeOff, Sparkles, CheckCircle2 } from 'lucide-react';

export default function SignupPage() {
  const { signUp, user } = useAuth();
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (user) router.replace('/account');
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error } = await signUp(email, password, name);
    setLoading(false);
    if (error) setError(error);
    else setSuccess(true);
  };

  if (success) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
        <div className="w-full max-w-md animate-scale-in text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary-50 text-primary-600">
            <CheckCircle2 size={40} />
          </div>
          <h1 className="mt-6 text-display-s font-extrabold tracking-tight text-ink-900">Check your email</h1>
          <p className="mt-3 text-body text-ink-500">
            We sent a confirmation link to <strong className="text-ink-900">{email}</strong>. Click it to activate your account, then sign in.
          </p>
          <Link href="/login" className="mt-8 inline-flex items-center gap-2 rounded-xl bg-primary-500 px-6 py-3 text-body-s font-semibold text-white transition-colors hover:bg-primary-600">
            Go to sign in <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      {/* Left: brand panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-primary-700 via-primary-600 to-primary-500">
        <div className="absolute inset-0 bg-[url('/images/hero-bg-light.png')] bg-cover bg-center opacity-20 mix-blend-overlay" />
        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          <div>
            <div className="flex items-center gap-3">
              <img src="/images/logo-mark.png" alt="" className="h-12 w-12 rounded-xl bg-white/20 p-1.5" />
              <span className="text-2xl font-extrabold tracking-tight">Print<span className="text-primary-200">Vatika</span></span>
            </div>
          </div>
          <div className="max-w-md">
            <h2 className="text-4xl font-extrabold leading-tight tracking-tight">
              Join 500+ businesses printing with us.
            </h2>
            <p className="mt-4 text-lg text-white/80 leading-relaxed">
              Create your account to save addresses, track orders, reorder in one tap, and get exclusive bulk pricing.
            </p>
            <ul className="mt-8 space-y-3">
              {['Free counter pickup on all orders', 'Live proof before you pay', 'Flat ₹50 delivery anywhere in India', 'Bulk discounts up to 35% off'].map(item => (
                <li key={item} className="flex items-center gap-3 text-white/90">
                  <CheckCircle2 size={18} className="flex-none text-primary-200" />
                  <span className="text-body">{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <p className="text-sm text-white/60">© {new Date().getFullYear()} Print Vatika. All rights reserved.</p>
        </div>
      </div>

      {/* Right: form */}
      <div className="flex w-full items-center justify-center px-4 py-12 lg:w-1/2">
        <div className="w-full max-w-md animate-fade-rise">
          <div className="mb-8">
            <div className="flex items-center gap-2 text-primary-600">
              <Sparkles size={18} />
              <span className="text-body-s font-semibold uppercase tracking-wider">Get started</span>
            </div>
            <h1 className="mt-3 text-display-s font-extrabold tracking-tight text-ink-900">Create your account</h1>
            <p className="mt-2 text-body text-ink-500">Save addresses, track orders, and reorder in one tap.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="name" className="mb-1.5 block text-body-s font-semibold text-ink-700">Full name</label>
              <div className="relative">
                <User size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-400" />
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="As it should appear on invoices"
                  required
                  autoComplete="name"
                  className="h-12 w-full rounded-xl border border-ink-200 bg-white pl-11 pr-4 text-body text-ink-900 shadow-sm transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                />
              </div>
            </div>
            <div>
              <label htmlFor="email" className="mb-1.5 block text-body-s font-semibold text-ink-700">Email address</label>
              <div className="relative">
                <Mail size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-400" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                  className="h-12 w-full rounded-xl border border-ink-200 bg-white pl-11 pr-4 text-body text-ink-900 shadow-sm transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                />
              </div>
            </div>
            <div>
              <label htmlFor="password" className="mb-1.5 block text-body-s font-semibold text-ink-700">Password</label>
              <div className="relative">
                <Lock size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-400" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  className="h-12 w-full rounded-xl border border-ink-200 bg-white pl-11 pr-12 text-body text-ink-900 shadow-sm transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-ink-400 transition-colors hover:text-ink-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-body-s text-red-700 animate-fade-rise">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary-500 text-body font-semibold text-white shadow-lg shadow-primary-500/25 transition-all hover:bg-primary-600 hover:shadow-xl hover:shadow-primary-500/30 disabled:opacity-60"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <>Create account <ArrowRight size={16} /></>}
            </button>
          </form>

          <div className="mt-6 flex items-center gap-4">
            <div className="h-px flex-1 bg-ink-200" />
            <span className="text-body-s text-ink-400">or</span>
            <div className="h-px flex-1 bg-ink-200" />
          </div>

          <p className="mt-6 text-center text-body-s text-ink-500">
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-primary-600 transition-colors hover:text-primary-700">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}