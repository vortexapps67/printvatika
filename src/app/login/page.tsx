'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { Button, Field } from '../../components/ui/press';
import { Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const { signIn, user } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (user) router.replace('/account');
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) setError(error);
    else router.push('/account');
  };

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <div className="text-center">
        <h1 className="text-display-s font-bold text-ink-900">Welcome back</h1>
        <p className="mt-2 text-body text-ink-500">Sign in to track orders and reorder in one tap.</p>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
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
            placeholder="••••••••"
            required
            autoComplete="current-password"
          />
        </Field>

        {error && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-body-s text-red-700">{error}</p>
        )}

        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading ? <Loader2 size={18} className="animate-spin" /> : <>Sign in <ArrowRight size={16} /></>}
        </Button>
      </form>

      <p className="mt-6 text-center text-body-s text-ink-500">
        New to Print Vatika?{' '}
        <Link href="/signup" className="font-semibold text-primary-600 hover:text-primary-700">
          Create an account
        </Link>
      </p>
    </div>
  );
}