'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { Button, Field } from '../../components/ui/press';
import { Mail, Lock, User, ArrowRight, Loader2 } from 'lucide-react';

export default function SignupPage() {
  const { signUp, user } = useAuth();
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary-50 text-primary-600">
          <Mail size={28} />
        </div>
        <h1 className="mt-6 text-display-s font-bold text-ink-900">Check your email</h1>
        <p className="mt-3 text-body text-ink-500">
          We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account, then sign in.
        </p>
        <Link href="/login" className="mt-6 inline-flex items-center gap-2 text-body-s font-semibold text-primary-600 hover:text-primary-700">
          Go to sign in <ArrowRight size={14} />
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <div className="text-center">
        <h1 className="text-display-s font-bold text-ink-900">Create your account</h1>
        <p className="mt-2 text-body text-ink-500">Save addresses, track orders, and reorder in one tap.</p>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <Field label="Full name" htmlFor="name">
          <input
            id="name"
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="As it should appear on invoices"
            required
            autoComplete="name"
          />
        </Field>
        <Field label="Email" htmlFor="email">
          <input
            id="email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            autoComplete="email"
          />
        </Field>
        <Field label="Password" htmlFor="password">
          <input
            id="password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="At least 6 characters"
            required
            minLength={6}
            autoComplete="new-password"
          />
        </Field>

        {error && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-body-s text-red-700">{error}</p>
        )}

        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading ? <Loader2 size={18} className="animate-spin" /> : <>Create account <ArrowRight size={16} /></>}
        </Button>
      </form>

      <p className="mt-6 text-center text-body-s text-ink-500">
        Already have an account?{' '}
        <Link href="/login" className="font-semibold text-primary-600 hover:text-primary-700">
          Sign in
        </Link>
      </p>
    </div>
  );
}