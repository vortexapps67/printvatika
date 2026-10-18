'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { getBrowserSupabase } from '../../lib/supabaseBrowser';
import { Button } from '../../components/ui/press';
import { Package, LogOut, User, Clock, CheckCircle2, Truck, XCircle, Loader2, ArrowRight } from 'lucide-react';
import { money } from '../../lib/catalog';

interface OrderRow {
  id: string;
  total_amount: number;
  payment_status: string;
  order_status: string;
  created_at: string;
  items?: { product_name: string; quantity: number }[];
}

export default function AccountPage() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/login');
      return;
    }

    (async () => {
      try {
        const supabase = getBrowserSupabase();
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;
        const res = await fetch('/api/account/orders', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Could not load orders.');
        setOrders(data.orders || []);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setFetching(false);
      }
    })();
  }, [user, loading, router]);

  if (loading || fetching) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 size={28} className="animate-spin text-primary-500" />
      </div>
    );
  }

  if (!user) return null;

  const name = user.user_metadata?.full_name || user.email?.split('@')[0] || 'there';

  return (
    <div className="mx-auto max-w-sheet px-4 py-10 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-display-s font-bold text-ink-900">My account</h1>
          <p className="mt-1 text-body text-ink-500">Welcome back, {name}.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => { signOut(); router.push('/'); }}>
          <LogOut size={14} /> Sign out
        </Button>
      </div>

      {/* Profile card */}
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-ink-200 bg-white p-5 shadow-card">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-50 text-primary-600">
              <User size={18} />
            </div>
            <div className="min-w-0">
              <p className="text-body-s font-semibold text-ink-900 truncate">{user.email}</p>
              <p className="text-micro text-ink-500">Account email</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-ink-200 bg-white p-5 shadow-card">
          <p className="text-display-s font-bold text-ink-900">{orders.length}</p>
          <p className="text-body-s text-ink-500">Total orders</p>
        </div>
        <div className="rounded-xl border border-ink-200 bg-white p-5 shadow-card">
          <p className="text-display-s font-bold text-ink-900">
            {orders.filter(o => o.order_status === 'DELIVERED').length}
          </p>
          <p className="text-body-s text-ink-500">Delivered</p>
        </div>
      </div>

      {/* Orders */}
      <div className="mt-10">
        <h2 className="text-title font-bold text-ink-900">Order history</h2>
        {error && (
          <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-body-s text-red-700">{error}</p>
        )}
        {orders.length === 0 && !error ? (
          <div className="mt-6 rounded-xl border border-dashed border-ink-300 bg-ink-50 p-10 text-center">
            <Package size={32} className="mx-auto text-ink-300" />
            <p className="mt-4 text-body font-semibold text-ink-700">No orders yet</p>
            <p className="mt-1 text-body-s text-ink-500">Your orders will appear here once you place one.</p>
            <Link href="/catalog" className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary-500 px-5 py-2.5 text-body-s font-semibold text-white hover:bg-primary-600">
              Start shopping <ArrowRight size={14} />
            </Link>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {orders.map(order => (
              <div key={order.id} className="rounded-xl border border-ink-200 bg-white p-5 shadow-card">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-mono text-body-s font-semibold text-ink-900">{order.id}</p>
                    <p className="mt-0.5 text-micro text-ink-500">
                      {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={order.order_status} />
                    <span className="tnum font-display text-title font-bold text-ink-900">{money(order.total_amount)}</span>
                  </div>
                </div>
                {order.items && order.items.length > 0 && (
                  <ul className="mt-4 divide-y divide-ink-100 border-t border-ink-100 pt-3">
                    {order.items.map((it, i) => (
                      <li key={i} className="flex items-center justify-between py-2 text-body-s">
                        <span className="text-ink-700">{it.product_name}</span>
                        <span className="text-ink-500">× {it.quantity}</span>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="mt-4 flex gap-2">
                  <Link href={`/track?id=${order.id}`} className="text-body-s font-semibold text-primary-600 hover:text-primary-700">
                    Track order →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string; Icon: any }> = {
    PAYMENT_PENDING: { label: 'Payment pending', cls: 'bg-ink-100 text-ink-700', Icon: Clock },
    PAID: { label: 'Paid', cls: 'bg-primary-50 text-primary-700', Icon: CheckCircle2 },
    CONFIRMED: { label: 'Confirmed', cls: 'bg-indigo-50 text-indigo-700', Icon: CheckCircle2 },
    PRINTING: { label: 'Printing', cls: 'bg-primary-50 text-primary-700', Icon: Package },
    READY: { label: 'Ready', cls: 'bg-violet-50 text-violet-700', Icon: Package },
    OUT_FOR_DELIVERY: { label: 'Out for delivery', cls: 'bg-amber-50 text-amber-700', Icon: Truck },
    DELIVERED: { label: 'Delivered', cls: 'bg-emerald-50 text-emerald-700', Icon: CheckCircle2 },
    CANCELLED: { label: 'Cancelled', cls: 'bg-red-50 text-red-700', Icon: XCircle },
  };
  const s = map[status] || { label: status, cls: 'bg-ink-100 text-ink-700', Icon: Clock };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-micro font-semibold uppercase tracking-wider ${s.cls}`}>
      <s.Icon size={12} />
      {s.label}
    </span>
  );
}