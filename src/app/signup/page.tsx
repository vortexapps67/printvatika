'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import {
  Mail,
  Lock,
  User,
  Phone,
  ArrowRight,
  Loader2,
  Eye,
  EyeOff,
  Sparkles,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';
import { OtpModal } from '../../components/OtpModal';

function getSafeNext(): string {
  if (typeof window === 'undefined') return '/account';
  const next = new URLSearchParams(window.location.search).get('next');
  return next && next.startsWith('/') ? next : '/account';
}

export default function SignupPage() {
  const { signUp, user, sendOtp, setCustomUser } = useAuth();
  const router = useRouter();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authMethod, setAuthMethod] = useState<'phone_otp' | 'email_otp' | 'password'>('phone_otp');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // OTP Modal states
  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [otpTarget, setOtpTarget] = useState('');
  const [otpType, setOtpType] = useState<'phone' | 'email'>('phone');
  const [otpDemoCode, setOtpDemoCode] = useState<string | undefined>(undefined);

  React.useEffect(() => {
    if (user) router.replace(getSafeNext());
  }, [user, router]);

  const handleStartOtpVerification = async (typeToVerify: 'phone' | 'email') => {
    setError('');

    if (!name.trim()) {
      setError('Please enter your full name.');
      return;
    }

    const targetVal = typeToVerify === 'phone' ? phone.trim() : email.trim();

    if (typeToVerify === 'phone') {
      const cleanDigits = phone.replace(/\D/g, '');
      if (cleanDigits.length < 10) {
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
    const res = await sendOtp(targetVal, typeToVerify);
    setLoading(false);

    if (!res.success) {
      setError(res.error || 'Failed to send OTP. Please try again.');
      return;
    }

    setOtpTarget(targetVal);
    setOtpType(typeToVerify);
    setOtpDemoCode(res.demoCode);
    setOtpModalOpen(true);
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (authMethod === 'phone_otp') {
      await handleStartOtpVerification('phone');
      return;
    }
    if (authMethod === 'email_otp') {
      await handleStartOtpVerification('email');
      return;
    }

    // Standard password signup
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    const { error } = await signUp(email, password, name);
    setLoading(false);

    if (error) {
      setError(error);
    } else {
      // Trigger OTP verification for extra security
      await handleStartOtpVerification('email');
    }
  };

  const handleOtpVerified = (verifiedUser: any) => {
    setOtpModalOpen(false);
    // Link local custom user
    setCustomUser({
      ...verifiedUser,
      name: name || verifiedUser.name,
      phone: phone || verifiedUser.phone,
      email: email || verifiedUser.email,
    });
    router.push(getSafeNext());
  };

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
              Create your account with secure OTP verification to save addresses, track orders, reorder in one tap, and get exclusive bulk pricing.
            </p>
            <ul className="mt-8 space-y-3">
              {[
                'Instant Mobile & Email OTP verification',
                'Live 300 DPI proof before you pay',
                'Free counter pickup near Saket Metro',
                'Flat ₹50 delivery anywhere in India',
              ].map(item => (
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
          <div className="mb-6">
            <div className="flex items-center gap-2 text-primary-600">
              <Sparkles size={18} />
              <span className="text-body-s font-semibold uppercase tracking-wider">Fast Account Creation</span>
            </div>
            <h1 className="mt-3 text-display-s font-extrabold tracking-tight text-ink-900">Create your account</h1>
            <p className="mt-2 text-body text-ink-500">Verify your mobile or email with an instant OTP.</p>
          </div>

          {/* Verification Method Switcher */}
          <div className="mb-6 grid grid-cols-3 gap-1.5 rounded-2xl bg-ink-100 p-1 border border-ink-200/60">
            <button
              type="button"
              onClick={() => { setAuthMethod('phone_otp'); setError(''); }}
              className={`flex items-center justify-center gap-1.5 rounded-xl py-2 px-1 font-mono text-micro font-bold uppercase tracking-wider transition-all duration-200 ${
                authMethod === 'phone_otp'
                  ? 'bg-white text-ink-950 shadow-sm border border-ink-200/80'
                  : 'text-ink-600 hover:text-ink-900'
              }`}
            >
              <Phone size={13} />
              Mobile OTP
            </button>
            <button
              type="button"
              onClick={() => { setAuthMethod('email_otp'); setError(''); }}
              className={`flex items-center justify-center gap-1.5 rounded-xl py-2 px-1 font-mono text-micro font-bold uppercase tracking-wider transition-all duration-200 ${
                authMethod === 'email_otp'
                  ? 'bg-white text-ink-950 shadow-sm border border-ink-200/80'
                  : 'text-ink-600 hover:text-ink-900'
              }`}
            >
              <Mail size={13} />
              Email OTP
            </button>
            <button
              type="button"
              onClick={() => { setAuthMethod('password'); setError(''); }}
              className={`flex items-center justify-center gap-1.5 rounded-xl py-2 px-1 font-mono text-micro font-bold uppercase tracking-wider transition-all duration-200 ${
                authMethod === 'password'
                  ? 'bg-white text-ink-950 shadow-sm border border-ink-200/80'
                  : 'text-ink-600 hover:text-ink-900'
              }`}
            >
              <Lock size={13} />
              Password
            </button>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label htmlFor="name" className="mb-1.5 block text-body-s font-semibold text-ink-700">
                Full name <span className="text-red-500">*</span>
              </label>
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

            {/* Mobile Number */}
            <div>
              <label htmlFor="phone" className="mb-1.5 block text-body-s font-semibold text-ink-700">
                Mobile number {authMethod === 'phone_otp' && <span className="text-red-500">*</span>}
              </label>
              <div className="relative flex">
                <span className="inline-flex h-12 items-center gap-1.5 rounded-l-xl border border-r-0 border-ink-200 bg-ink-50 px-3.5 font-mono text-body-s font-bold text-ink-700 select-none">
                  🇮🇳 +91
                </span>
                <input
                  id="phone"
                  type="tel"
                  inputMode="numeric"
                  value={phone}
                  onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="98114 27517"
                  required={authMethod === 'phone_otp'}
                  className="h-12 w-full rounded-r-xl border border-ink-200 bg-white px-4 text-body font-mono text-ink-900 shadow-sm transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                />
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label htmlFor="email" className="mb-1.5 block text-body-s font-semibold text-ink-700">
                Email address {(authMethod === 'email_otp' || authMethod === 'password') && <span className="text-red-500">*</span>}
              </label>
              <div className="relative">
                <Mail size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-400" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  required={authMethod === 'email_otp' || authMethod === 'password'}
                  autoComplete="email"
                  className="h-12 w-full rounded-xl border border-ink-200 bg-white pl-11 pr-4 text-body text-ink-900 shadow-sm transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                />
              </div>
            </div>

            {/* Password (only in password mode) */}
            {authMethod === 'password' && (
              <div>
                <label htmlFor="password" className="mb-1.5 block text-body-s font-semibold text-ink-700">
                  Create password <span className="text-red-500">*</span>
                </label>
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
            )}

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-body-s text-red-700 animate-fade-rise">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary-600 to-primary-700 text-body font-semibold text-white shadow-lg shadow-primary-500/25 transition-all hover:from-primary-700 hover:to-primary-800 disabled:opacity-60 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Sending code...
                </>
              ) : authMethod === 'phone_otp' ? (
                <>
                  <Phone size={16} />
                  Send Mobile OTP & Sign Up
                </>
              ) : authMethod === 'email_otp' ? (
                <>
                  <Mail size={16} />
                  Send Email OTP & Sign Up
                </>
              ) : (
                <>
                  Create Account with Password <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 flex items-center justify-center gap-2 text-micro text-ink-400 font-mono">
            <ShieldCheck size={14} className="text-emerald-600" />
            <span>256-Bit Encrypted · Instant OTP Verification</span>
          </div>

          <p className="mt-6 text-center text-body-s text-ink-500">
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-primary-600 transition-colors hover:text-primary-700">
              Sign in
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
        userName={name}
        demoCode={otpDemoCode}
        onVerified={handleOtpVerified}
      />
    </div>
  );
}
