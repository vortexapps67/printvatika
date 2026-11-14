'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import {
  Mail,
  Lock,
  Phone,
  ArrowRight,
  Loader2,
  Eye,
  EyeOff,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { OtpModal } from '../../components/OtpModal';

function getSafeNext(): string {
  if (typeof window === 'undefined') return '/account';
  const next = new URLSearchParams(window.location.search).get('next');
  return next && next.startsWith('/') ? next : '/account';
}

export default function LoginPage() {
  const { signIn, user, sendOtp, setCustomUser } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'otp' | 'password'>('otp');
  const [otpType, setOtpType] = useState<'phone' | 'email'>('phone');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // OTP Modal State
  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [otpTarget, setOtpTarget] = useState('');

  React.useEffect(() => {
    if (user) router.replace(getSafeNext());
  }, [user, router]);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) setError(error);
    else router.push(getSafeNext());
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const targetVal = otpType === 'phone' ? phone.trim() : email.trim();

    if (otpType === 'phone') {
      const clean = phone.replace(/\D/g, '');
      if (clean.length < 10) {
        setError('Please enter a valid 10-digit mobile number.');
        return;
      }
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        setError('Please enter a valid email address.');
        return;
      }
    }

    setLoading(true);
    const res = await sendOtp(targetVal, otpType);
    setLoading(false);

    if (!res.success) {
      setError(res.error || 'Failed to send OTP. Please try again.');
      return;
    }

    setOtpTarget(targetVal);
    setOtpModalOpen(true);
  };

  const handleOtpVerified = (verifiedUser: any) => {
    setOtpModalOpen(false);
    setCustomUser(verifiedUser);
    router.push(getSafeNext());
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      {/* Left: brand panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary-500 to-primary-700">
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
              Print that makes your brand unforgettable.
            </h2>
            <p className="mt-4 text-lg text-white/80 leading-relaxed">
              Business cards, banners, apparel and more — proofed on screen before you pay. Trusted by 500+ businesses across Delhi NCR.
            </p>
            <div className="mt-8 flex items-center gap-6">
              <div className="text-center">
                <p className="text-3xl font-extrabold">24hr</p>
                <p className="text-sm text-white/70">Dispatch</p>
              </div>
              <div className="h-10 w-px bg-white/20" />
              <div className="text-center">
                <p className="text-3xl font-extrabold">500+</p>
                <p className="text-sm text-white/70">Businesses</p>
              </div>
              <div className="h-10 w-px bg-white/20" />
              <div className="text-center">
                <p className="text-3xl font-extrabold">4.9★</p>
                <p className="text-sm text-white/70">Rating</p>
              </div>
            </div>
          </div>
          <p className="text-sm text-white/60">© {new Date().getFullYear()} Print Vatika. All rights reserved.</p>
        </div>
      </div>

      {/* Right: form */}
      <div className="flex w-full items-center justify-center px-4 py-12 lg:w-1/2">
        <div className="w-full max-w-md animate-fade-rise">
          <div className="mb-6">
            <div className="flex items-center gap-2 text-primary-600">
              <Sparkles size={18} />
              <span className="text-body-s font-semibold uppercase tracking-wider">Secure Access</span>
            </div>
            <h1 className="mt-3 text-display-s font-extrabold tracking-tight text-ink-900">Sign in to your account</h1>
            <p className="mt-2 text-body text-ink-500">Track orders, inspect print proofs, and reorder in one tap.</p>
          </div>

          {/* Tabs: OTP Login vs Password Login */}
          <div className="mb-6 grid grid-cols-2 gap-1.5 rounded-2xl bg-ink-100 p-1 border border-ink-200/60">
            <button
              type="button"
              onClick={() => { setActiveTab('otp'); setError(''); }}
              className={`flex items-center justify-center gap-2 rounded-xl py-2.5 font-mono text-micro font-bold uppercase tracking-wider transition-all duration-200 ${
                activeTab === 'otp'
                  ? 'bg-white text-ink-950 shadow-sm border border-ink-200/80'
                  : 'text-ink-600 hover:text-ink-900'
              }`}
            >
              <Phone size={14} className="text-primary-600" />
              Instant OTP Login
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('password'); setError(''); }}
              className={`flex items-center justify-center gap-2 rounded-xl py-2.5 font-mono text-micro font-bold uppercase tracking-wider transition-all duration-200 ${
                activeTab === 'password'
                  ? 'bg-white text-ink-950 shadow-sm border border-ink-200/80'
                  : 'text-ink-600 hover:text-ink-900'
              }`}
            >
              <Lock size={14} />
              Password Login
            </button>
          </div>

          {activeTab === 'otp' ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              {/* Toggle Phone vs Email */}
              <div className="flex items-center justify-between text-body-s text-ink-600 mb-1">
                <span className="font-semibold text-ink-700">Receive OTP on:</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setOtpType('phone')}
                    className={`font-mono text-micro px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                      otpType === 'phone'
                        ? 'bg-primary-50 text-primary-700 border border-primary-200'
                        : 'text-ink-500 hover:text-ink-900'
                    }`}
                  >
                    Mobile SMS
                  </button>
                  <button
                    type="button"
                    onClick={() => setOtpType('email')}
                    className={`font-mono text-micro px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                      otpType === 'email'
                        ? 'bg-primary-50 text-primary-700 border border-primary-200'
                        : 'text-ink-500 hover:text-ink-900'
                    }`}
                  >
                    Email
                  </button>
                </div>
              </div>

              {otpType === 'phone' ? (
                <div>
                  <label htmlFor="login-phone" className="mb-1.5 block text-body-s font-semibold text-ink-700">
                    Mobile Number
                  </label>
                  <div className="relative flex">
                    <span className="inline-flex h-12 items-center gap-1.5 rounded-l-xl border border-r-0 border-ink-200 bg-ink-50 px-3.5 font-mono text-body-s font-bold text-ink-700 select-none">
                      🇮🇳 +91
                    </span>
                    <input
                      id="login-phone"
                      type="tel"
                      inputMode="numeric"
                      value={phone}
                      onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="98114 27517"
                      required
                      autoFocus
                      className="h-12 w-full rounded-r-xl border border-ink-200 bg-white px-4 text-body font-mono text-ink-900 shadow-sm transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label htmlFor="login-email-otp" className="mb-1.5 block text-body-s font-semibold text-ink-700">
                    Email address
                  </label>
                  <div className="relative">
                    <Mail size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-400" />
                    <input
                      id="login-email-otp"
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="you@company.com"
                      required
                      autoFocus
                      className="h-12 w-full rounded-xl border border-ink-200 bg-white pl-11 pr-4 text-body text-ink-900 shadow-sm transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                    />
                  </div>
                </div>
              )}

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-body-s text-red-700 animate-fade-rise">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary-600 to-primary-700 text-body font-semibold text-white shadow-lg shadow-primary-500/25 transition-all hover:from-primary-700 hover:to-primary-800 disabled:opacity-60 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Sending OTP...
                  </>
                ) : (
                  <>
                    Send Verification Code <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="mb-1.5 block text-body-s font-semibold text-ink-700">Email address</label>
                <div className="relative">
                  <Mail size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-400" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@company.com"
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
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
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
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary-500 text-body font-semibold text-white shadow-lg shadow-primary-500/25 transition-all hover:bg-primary-600 hover:shadow-xl hover:shadow-primary-500/30 disabled:opacity-60 cursor-pointer"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : <>Sign in <ArrowRight size={16} /></>}
              </button>
            </form>
          )}

          <div className="mt-6 flex items-center justify-center gap-2 text-micro text-ink-400 font-mono">
            <ShieldCheck size={14} className="text-emerald-600" />
            <span>256-Bit Encrypted · Instant OTP Verification</span>
          </div>

          <p className="mt-6 text-center text-body-s text-ink-500">
            New to Print Vatika?{' '}
            <Link href="/signup" className="font-semibold text-primary-600 transition-colors hover:text-primary-700">
              Create a free account
            </Link>
          </p>
        </div>
      </div>

      {/* OTP Verification Modal */}
      <OtpModal
        isOpen={otpModalOpen}
        onClose={() => setOtpModalOpen(false)}
        target={otpTarget}
        type={otpType}
        onVerified={handleOtpVerified}
      />
    </div>
  );
}
