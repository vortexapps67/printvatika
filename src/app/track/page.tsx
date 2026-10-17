'use client';

import React, { useState, useEffect } from 'react';
import { Order, OrderStatus } from '../../types';
import { SITE } from '../../lib/site';
import {
  Button,
  ColourStrip,
  Field,
  Panel,
  PanelHead,
  RegistrationMark,
  SpecRow,
  StatusPill,
} from '../../components/ui/press';
import { Search, Truck, Building2, AlertCircle, Loader2, Phone, Check } from 'lucide-react';

/* This page reads nothing from the query string during render. The URL
   parameters only prefill the form and kick off a lookup, which happens after
   mount anyway — so reading them from window.location here rather than
   through useSearchParams keeps the page statically prerenderable. It used to
   use useSearchParams behind a Suspense boundary, and because the route was
   static, Next baked the spinner fallback into the HTML and shipped an empty
   <main> to anyone who did not run JavaScript. */
export default function TrackPage() {
  return <TrackerContent />;
}

function TrackerContent() {
  const [orderId, setOrderId] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState('');

  // Direct query links e.g. /track?id=PV-1001&phone=9876543210
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlId = params.get('id');
    const urlPhone = params.get('phone');

    if (urlId && urlPhone) {
      setOrderId(urlId);
      setPhone(urlPhone);
      fetchOrderStatus(urlId, urlPhone);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchOrderStatus = async (queryId: string, queryPhone: string) => {
    setIsLoading(true);
    setError('');
    setOrder(null);

    try {
      const cleanId = queryId.replace('#', '').trim();
      const res = await fetch(`/api/orders/track?id=${cleanId}&phone=${queryPhone}`);

      if (!res.ok) {
        if (res.status === 404) {
          throw new Error('Order not found or mobile number mismatch.');
        } else {
          throw new Error('Server error fetching order.');
        }
      }

      const data = await res.json();
      setOrder(data);
    } catch (e: any) {
      setError(e.message || 'Verification failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId.trim()) {
      setError('Please enter your Order number.');
      return;
    }
    if (phone.replace(/\D/g, '').length < 10) {
      setError('Please enter your 10-digit mobile number.');
      return;
    }
    fetchOrderStatus(orderId, phone);
  };

  const getTimelineSteps = (currentStatus: OrderStatus, fulfillment: string) => {
    const isDelivery = fulfillment === 'delivery';

    const steps = [
      { status: 'PAYMENT_PENDING', label: 'Order placed', desc: 'Order received, payment awaiting verification.' },
      { status: 'PAID', label: 'Payment verified', desc: 'Transaction approved and secured.' },
      { status: 'CONFIRMED', label: 'Job confirmed', desc: 'Artwork approved by the print operators.' },
      { status: 'PRINTING', label: 'On press', desc: 'Your design is running on the machine.' },
      {
        status: 'READY',
        label: isDelivery ? 'Ready for dispatch' : 'Ready for pickup',
        desc: isDelivery ? 'Packed and handed to the courier.' : 'Waiting at the counter for collection.',
      },
      {
        status: isDelivery ? 'OUT_FOR_DELIVERY' : 'READY',
        label: isDelivery ? 'Out for delivery' : 'Collected',
        desc: isDelivery ? 'Out with the courier driver.' : 'Collected from the counter.',
      },
      {
        status: 'DELIVERED',
        label: isDelivery ? 'Delivered' : 'Collected',
        desc: isDelivery ? 'Handed over at the address.' : 'Order collected by the customer.',
      },
    ];

    return steps.filter(s => {
      if (!isDelivery && s.status === 'OUT_FOR_DELIVERY') return false;
      return true;
    });
  };

  const getStepState = (stepStatus: string, currentStatus: OrderStatus) => {
    const statusOrder: OrderStatus[] = [
      'PAYMENT_PENDING',
      'PAID',
      'CONFIRMED',
      'PRINTING',
      'READY',
      'OUT_FOR_DELIVERY',
      'DELIVERED',
    ];

    const currentIdx = statusOrder.indexOf(currentStatus);
    const stepIdx = statusOrder.indexOf(stepStatus as OrderStatus);

    if (currentStatus === 'CANCELLED') return 'cancelled';
    if (stepIdx === -1) return 'pending';
    if (stepIdx < currentIdx) return 'completed';
    if (stepIdx === currentIdx) return 'active';
    return 'pending';
  };

  const isDelivery = order?.fulfillment_type === 'delivery';
  const steps = order ? getTimelineSteps(order.order_status, order.fulfillment_type) : [];

  // Progress as a fraction of steps reached — drives the ink meter.
  const completedCount = order
    ? steps.filter(s => getStepState(s.status, order.order_status) === 'completed').length
    : 0;
  const progress = steps.length ? Math.round((completedCount / steps.length) * 100) : 0;

  return (
    <div className="mx-auto max-w-sheet px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <header className="border-b border-ink-200 pb-6">
        <div className="flex items-center gap-2.5">
          <RegistrationMark className="text-primary-500" />
          <span className="label-caps">Order tracking</span>
        </div>
        <h1 className="mt-4 text-display-s">Where is my print job?</h1>
        <p className="mt-3 max-w-xl text-body text-ink-500">
          Enter the order reference from your confirmation along with the mobile number you ordered
          with.
        </p>
        <ColourStrip rule className="mt-6" />
      </header>

      {/* ---- Lookup ---- */}
      <Panel className="mx-auto mt-8 max-w-2xl">
        <form onSubmit={handleSearch} className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Order number" htmlFor="orderId" required>
              <input
                id="orderId"
                type="text"
                value={orderId}
                onChange={e => setOrderId(e.target.value)}
                placeholder="e.g. PV-1002"
                autoComplete="off"
              />
            </Field>
            <Field label="Mobile number" htmlFor="phone" required>
              <input
                id="phone"
                type="tel"
                inputMode="numeric"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="10-digit number"
                autoComplete="tel"
              />
            </Field>
          </div>

          {error && (
            <div
              role="alert"
              className="flex items-center gap-2.5 rounded border border-red-300 bg-red-50 px-3.5 py-2.5 text-body-s font-medium text-red-700"
            >
              <AlertCircle size={15} className="flex-none" aria-hidden="true" />
              {error}
            </div>
          )}

          <Button type="submit" size="lg" plate disabled={isLoading} className="w-full">
            {isLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                Looking up
              </>
            ) : (
              <>
                <Search size={16} aria-hidden="true" />
                Look up order
              </>
            )}
          </Button>
        </form>
      </Panel>

      {/* ---- Results ---- */}
      {order && (
        <div className="mt-8 grid items-start gap-6 md:grid-cols-12">
          {/* Timeline */}
          <Panel flush className="md:col-span-7">
            <PanelHead
              title={<span className="tnum">{order.id}</span>}
              hint={`Placed ${new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`}
              action={
                order.order_status === 'CANCELLED' ? (
                  <StatusPill status="CANCELLED" />
                ) : (
                  <StatusPill status={order.order_status} />
                )
              }
            />

            {/* Progress meter: completed steps in magenta, rest in ink */}
            <div className="px-5 pt-4">
              <div className="flex items-center justify-between">
                <span className="label-caps">Progress</span>
                <span className="tnum font-mono text-label font-medium text-ink-700">
                  {completedCount}/{steps.length} stages
                </span>
              </div>
              <div className="mt-2 h-1 w-full overflow-hidden rounded-sm bg-ink-200">
                <div
                  className="h-full bg-primary-500 transition-all duration-500 ease-press"
                  style={{ width: `${progress}%` }}
                  role="progressbar"
                  aria-valuenow={progress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label="Order progress"
                />
              </div>
            </div>

            <ol className="space-y-0 px-5 pb-6 pt-6">
              {steps.map((step, idx) => {
                const state = getStepState(step.status, order.order_status);
                const isLast = idx === steps.length - 1;

                return (
                  <li key={idx} className="relative flex gap-4 pb-6 last:pb-0">
                    {/* The rail */}
                    {!isLast && (
                      <span
                        aria-hidden="true"
                        className={`absolute left-[13px] top-7 h-[calc(100%-1.75rem)] w-px ${
                          state === 'cancelled' ? 'bg-ink-200' : 'bg-ink-200'
                        }`}
                      />
                    )}

                    {/* The node — square, because this is a press sheet */}
                    <span
                      aria-hidden="true"
                      className={`relative z-10 mt-0.5 flex h-7 w-7 flex-none items-center justify-center rounded-sm border font-mono text-micro font-semibold ${
                        state === 'completed'
                          ? 'border-ink-950 bg-ink-950 text-white'
                          : state === 'active'
                          ? 'border-primary-600 bg-primary-500 text-white'
                          : 'border-ink-300 bg-white text-ink-400'
                      }`}
                    >
                      {state === 'completed' ? <Check size={13} /> : idx + 1}
                    </span>

                    <div className="min-w-0 flex-1 pt-1">
                      <h3
                        className={`font-display text-body font-bold ${
                          state === 'pending' ? 'text-ink-400' : 'text-ink-950'
                        }`}
                      >
                        {step.label}
                      </h3>
                      <p className="mt-1 text-body-s leading-relaxed text-ink-500">{step.desc}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </Panel>

          {/* Spec card */}
          <div className="space-y-6 md:col-span-5">
            <Panel flush>
              <PanelHead title="Job specification" />
              <div className="space-y-5 p-5">
                <ul className="space-y-4">
                  {order.items?.map((item, i) => (
                    <li key={i} className="flex gap-3">
                      <div className="h-12 w-12 flex-none overflow-hidden rounded-sm border border-ink-200 bg-ink-50">
                        <img
                          src={item.preview_file_url || item.original_file_url}
                          alt={item.product_name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-display text-body font-bold leading-tight text-ink-950">
                          {item.product_name}
                        </h4>
                        <p className="tnum mt-1 font-mono text-micro uppercase tracking-wider2 text-ink-500">
                          {item.quantity} units
                        </p>
                        <ul className="mt-1.5 flex flex-wrap gap-1">
                          {Object.entries(item.selected_options).map(([k, v]) => (
                            <li
                              key={k}
                              className="rounded-sm border border-ink-200 bg-ink-50 px-1.5 py-0.5 font-mono text-micro text-ink-600"
                            >
                              <span className="text-ink-400">{k}</span> {v}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </li>
                  ))}
                </ul>

                {/* Fulfilment */}
                <div className="flex gap-2.5 border-t border-ink-100 pt-5">
                  {isDelivery ? (
                    <Truck size={16} className="mt-0.5 flex-none text-primary-500" aria-hidden="true" />
                  ) : (
                    <Building2 size={16} className="mt-0.5 flex-none text-primary-500" aria-hidden="true" />
                  )}
                  <div className="min-w-0">
                    <span className="label-caps">
                      {isDelivery ? 'Delivering to' : 'Collect from'}
                    </span>
                    <p className="mt-1.5 text-body-s leading-relaxed text-ink-700">
                      {isDelivery
                        ? `${order.delivery_address}, ${order.delivery_city}, ${order.delivery_state} — ${order.delivery_pincode}`
                        : SITE.pickupAddress}
                    </p>
                  </div>
                </div>

                <dl className="divide-y divide-ink-200 border-y border-ink-200">
                  <SpecRow label="Subtotal" value={`₹${order.subtotal.toFixed(2)}`} />
                  <SpecRow
                    label="Delivery"
                    value={
                      order.delivery_charge > 0 ? (
                        `₹${order.delivery_charge.toFixed(2)}`
                      ) : (
                        <span className="text-emerald-700">Free</span>
                      )
                    }
                  />
                  <SpecRow label="Paid" value={`₹${order.total_amount.toFixed(2)}`} strong className="pb-3 pt-3" />
                </dl>
              </div>
            </Panel>

            {/* Support — real number, not a placeholder */}
            <div className="flex gap-3 rounded-xl border border-ink-200 bg-white p-4 shadow-card">
              <Phone size={16} className="mt-0.5 flex-none text-primary-500" aria-hidden="true" />
              <p className="text-body-s leading-relaxed text-ink-600">
                Need to change the specification or cancel? Call the counter on{' '}
                <a href={`tel:${SITE.phoneRaw}`} className="tnum font-medium text-ink-950 underline">
                  {SITE.phoneDisplay}
                </a>{' '}
                and quote{' '}
                <span className="tnum font-mono font-medium text-ink-950">{order.id}</span>.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}