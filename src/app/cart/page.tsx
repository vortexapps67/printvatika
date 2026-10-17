'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '../../context/CartContext';
import { Badge, Button, ButtonLink, ColourStrip, EmptyState, Field, Panel, PanelHead, SpecRow } from '../../components/ui/press';
import { SITE } from '../../lib/site';
import {
  ShoppingBag,
  Trash2,
  MapPin,
  Truck,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  Building2,
  CheckCircle2,
  Loader2,
  Phone,
  Mail,
  User,
  Info,
  Lock,
  X,
  FileCheck2,
  Minus,
  Plus,
} from 'lucide-react';

export default function CartPage() {
  const router = useRouter();
  const {
    cart,
    checkoutDetails,
    removeFromCart,
    updateQuantity,
    clearCart,
    updateCheckoutDetails,
    cartSubtotal,
    deliveryCharge,
    cartTotal,
  } = useCart();

  const [isLoading, setIsLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // User Authentication State
  const [currentUser, setCurrentUser] = useState<{ id: string; email: string; name?: string } | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const keys = Object.keys(localStorage);
        const authKey = keys.find(k => k.startsWith('sb-') && k.endsWith('-auth-token')) || 'vatika_user';
        if (authKey) {
          const raw = localStorage.getItem(authKey);
          if (raw) {
            const parsed = JSON.parse(raw);
            const user = parsed.user || parsed;
            if (user && (user.id || user.email)) {
              setCurrentUser({
                id: user.id || 'user_' + Date.now(),
                email: user.email || '',
                name: user.user_metadata?.full_name || user.name || user.email?.split('@')[0] || '',
              });
              if (user.email && !checkoutDetails.customerEmail) {
                updateCheckoutDetails({ customerEmail: user.email });
              }
              if (user.user_metadata?.full_name && !checkoutDetails.customerName) {
                updateCheckoutDetails({ customerName: user.user_metadata.full_name });
              }
            }
          }
        }
      }
    } catch (err) {
      console.warn('Could not read user auth state', err);
    }
  }, []);

  // Payment simulator modal state
  const [showSimulator, setShowSimulator] = useState(false);
  const [simulatedOrder, setSimulatedOrder] = useState<any>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Form input validation
  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!checkoutDetails.customerName.trim()) errors.name = 'Full name is required';

    // India mobile validation (10 digits)
    const phoneClean = checkoutDetails.customerPhone.replace(/\D/g, '');
    if (phoneClean.length < 10) errors.phone = 'Enter a valid 10-digit mobile number';

    // Email check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(checkoutDetails.customerEmail)) errors.email = 'Enter a valid email address';

    if (checkoutDetails.fulfillmentType === 'delivery') {
      if (!checkoutDetails.deliveryAddress.trim()) errors.address = 'Delivery address is required';
      if (!checkoutDetails.deliveryCity.trim()) errors.city = 'City is required';
      if (!checkoutDetails.deliveryState.trim()) errors.state = 'State is required';

      const pinClean = checkoutDetails.deliveryPincode.replace(/\D/g, '');
      if (pinClean.length < 6) errors.pincode = 'Enter a valid 6-digit Pincode';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (field: string, value: string) => {
    updateCheckoutDetails({ [field]: value });
    if (formErrors[field]) {
      setFormErrors(prev => {
        const copy = { ...prev };
        delete copy[field];
        return copy;
      });
    }
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    // Must be signed in to place an order
    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }

    setIsLoading(true);

    try {
      // 1. Submit cart specifications and buyer data to API to create PENDING order
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${currentUser.id}`,
        },
        body: JSON.stringify({
          userId: currentUser.id,
          userToken: currentUser.id,
          customerName: checkoutDetails.customerName,
          customerEmail: checkoutDetails.customerEmail,
          customerPhone: checkoutDetails.customerPhone,
          fulfillmentType: checkoutDetails.fulfillmentType,
          deliveryAddress: checkoutDetails.deliveryAddress,
          deliveryCity: checkoutDetails.deliveryCity,
          deliveryState: checkoutDetails.deliveryState,
          deliveryPincode: checkoutDetails.deliveryPincode,
          deliveryCharge,
          subtotal: cartSubtotal,
          totalAmount: cartTotal,
          notes: checkoutDetails.notes,
          items: cart.map(item => ({
            product_slug: item.product.slug,
            product_name: item.product.name,
            quantity: item.quantity,
            selected_options: item.selected_options,
            unit_price: item.unit_price,
            total_price: item.total_price,
            original_file: item.original_file,
            preview_base64: item.preview_base64,
            design_config: item.design_config,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error('Server failed to initiate order');
      }

      const orderData = await response.json();
      setSimulatedOrder(orderData);

      // 2. Open payment window (either Razorpay SDK or Simulator fallback)
      const isRazorpayConfigured = !!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;

      if (isRazorpayConfigured) {
        initializeLiveRazorpay(orderData);
      } else {
        setShowSimulator(true);
      }
    } catch (error) {
      console.error(error);
      alert('Checkout failed. Please check network connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Razorpay API launcher
  const initializeLiveRazorpay = (order: any) => {
    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      amount: Math.round(order.total_amount * 100),
      currency: 'INR',
      name: 'Print Vatika',
      description: `Payment for print order ${order.id}`,
      order_id: order.razorpay_order_id,
      handler: async function (response: any) {
        setIsLoading(true);
        try {
          const verification = await fetch('/api/payments/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orderId: order.id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpayOrderId: response.razorpay_order_id,
              razorpaySignature: response.razorpay_signature,
            }),
          });

          if (verification.ok) {
            clearCart();
            router.push(`/track?id=${order.id}&status=success`);
          } else {
            alert('Payment verification failed. Please contact support.');
          }
        } catch (e) {
          alert('Could not verify signature.');
        } finally {
          setIsLoading(false);
        }
      },
      prefill: {
        name: checkoutDetails.customerName,
        email: checkoutDetails.customerEmail,
        contact: checkoutDetails.customerPhone,
      },
      theme: {
        color: '#0B7C8A',
      },
    };

    const rzp = new (window as any).Razorpay(options);
    rzp.open();
  };

  const handleSimulatePaymentSuccess = async () => {
    if (!simulatedOrder) return;
    setIsLoading(true);

    try {
      const paymentId = `pay_sim_${Date.now()}`;
      const verifyRes = await fetch('/api/payments/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: simulatedOrder.id,
          paymentId: paymentId,
          status: 'PAID',
        }),
      });

      if (verifyRes.ok) {
        setPaymentSuccess(true);
        setTimeout(() => {
          clearCart();
          setShowSimulator(false);
          router.push(`/track?id=${simulatedOrder.id}&phone=${checkoutDetails.customerPhone}`);
        }, 1500);
      } else {
        alert('Simulator verification failed.');
      }
    } catch (e) {
      alert('Error verifying simulated transaction.');
    } finally {
      setIsLoading(false);
    }
  };

  const isPickup = checkoutDetails.fulfillmentType === 'pickup';
  const itemCount = cart.reduce((n, i) => n + i.quantity, 0);

  return (
    <div className="mx-auto max-w-sheet px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <header className="border-b border-ink-200 pb-6">
        <div className="flex items-end justify-between gap-6">
          <div>
            <h1 className="text-display-s">Your cart</h1>
            <p className="mt-2 font-mono text-label uppercase tracking-wider2 text-ink-500">
              {cart.length > 0 ? (
                <>
                  {cart.length} {cart.length === 1 ? 'job' : 'jobs'} · {itemCount} units
                </>
              ) : (
                'Nothing queued'
              )}
            </p>
          </div>
          {cart.length > 0 && (
            <Button variant="danger" size="sm" onClick={clearCart}>
              <Trash2 size={13} aria-hidden="true" />
              Clear cart
            </Button>
          )}
        </div>
        <ColourStrip rule className="mt-6" />
      </header>

      {cart.length === 0 ? (
        <Panel flush className="mx-auto mt-10 max-w-xl">
          <EmptyState
            icon={<ShoppingBag size={22} />}
            title="Nothing on the plate"
            body="Configure a product — stock, finish, size and quantity — upload your artwork, and it will appear here to check out."
            action={
              <ButtonLink href="/catalog" size="lg" variant="ink">
                Open the catalog
                <ArrowRight size={16} aria-hidden="true" />
              </ButtonLink>
            }
          />
        </Panel>
      ) : (
        <div className="mt-8 grid items-start gap-8 lg:grid-cols-12">
          {/* ---- Items ---- */}
          <div className="space-y-4 lg:col-span-7">
            {cart.map(item => (
              <article
                key={item.id}
                className="flex gap-4 rounded-xl border border-ink-200 bg-white p-4 shadow-card sm:gap-5"
              >
                <div className="h-20 w-20 flex-none overflow-hidden rounded-sm border border-ink-200 bg-ink-50 sm:h-24 sm:w-24">
                  <img
                    src={item.preview_base64 || item.product.image_url}
                    alt={item.product.name}
                    className="h-full w-full object-cover"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="font-display text-body-l font-bold leading-tight text-ink-950">
                      {item.product.name}
                    </h2>
                    <button
                      type="button"
                      onClick={() => removeFromCart(item.id)}
                      className="-mr-1 -mt-1 flex h-7 w-7 flex-none items-center justify-center rounded-sm text-ink-400 transition-colors hover:bg-red-50 hover:text-red-600"
                      aria-label={`Remove ${item.product.name} from cart`}
                    >
                      <X size={15} />
                    </button>
                  </div>

                  {/* Specs, in the mono spec voice */}
                  <ul className="mt-2.5 flex flex-wrap gap-1.5">
                    {Object.entries(item.selected_options).map(([key, val]) => (
                      <li
                        key={key}
                        className="rounded-sm border border-ink-200 bg-ink-50 px-1.5 py-0.5 font-mono text-micro text-ink-600"
                      >
                        <span className="text-ink-400">{key}</span> {val}
                      </li>
                    ))}
                  </ul>

                  {item.original_file && (
                    <p className="mt-2 inline-flex max-w-full items-center gap-1.5 truncate font-mono text-micro text-emerald-700">
                      <FileCheck2 size={12} className="flex-none" aria-hidden="true" />
                      {item.original_file.name}
                    </p>
                  )}

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-ink-100 pt-3">
                    {/* Quantity stepper */}
                    <div className="flex items-center rounded-sm border border-ink-200">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="flex h-8 w-8 items-center justify-center text-ink-600 transition-colors hover:bg-ink-100 hover:text-ink-950"
                        aria-label="Decrease quantity"
                      >
                        <Minus size={13} />
                      </button>
                      <span className="tnum w-12 border-x border-ink-200 text-center font-mono text-label font-medium text-ink-900">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="flex h-8 w-8 items-center justify-center text-ink-600 transition-colors hover:bg-ink-100 hover:text-ink-950"
                        aria-label="Increase quantity"
                      >
                        <Plus size={13} />
                      </button>
                    </div>

                    <div className="text-right">
                      <span className="tnum block font-mono text-micro text-ink-400">
                        ₹{item.unit_price.toFixed(2)} each
                      </span>
                      <span className="tnum mt-0.5 block font-display text-title font-extrabold text-ink-950">
                        ₹{item.total_price.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </article>
            ))}

            <Link
              href="/catalog"
              className="group inline-flex items-center gap-2 font-mono text-label font-medium uppercase tracking-wider2 text-primary-600 transition-colors hover:text-primary-700"
            >
              <ArrowRight size={14} className="rotate-180 transition-transform group-hover:-translate-x-0.5" aria-hidden="true" />
              Add another job
            </Link>
          </div>

          {/* ---- Checkout ---- */}
          <div className="lg:col-span-5">
            <div className="rounded-xl border border-ink-200 bg-white shadow-card lg:sticky lg:top-20">
              <PanelHead title="Checkout" hint="Nothing is charged until you approve." />

              <div className="space-y-6 p-5 sm:p-6">
                {/* Auth gate */}
                {currentUser ? (
                  <div className="flex items-center justify-between gap-3 rounded border border-emerald-200 bg-emerald-50 px-3.5 py-2.5">
                    <p className="min-w-0 text-body-s text-emerald-900">
                      Signed in as <strong className="font-semibold">{currentUser.name || currentUser.email}</strong>
                    </p>
                    <Badge tone="success">Verified</Badge>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-3 rounded border border-ink-200 bg-ink-50 px-3.5 py-3">
                    <p className="flex items-start gap-2.5 text-body-s leading-snug text-ink-700">
                      <Lock size={14} className="mt-0.5 flex-none text-ink-400" aria-hidden="true" />
                      <span>
                        <strong className="font-semibold text-ink-950">Sign in to order.</strong> Your
                        account keeps the artwork you upload and the proof we print from.
                      </span>
                    </p>
                    <a
                      href="/login.html?returnTo=cart.html"
                      className="flex-none rounded-sm bg-ink-950 px-3 py-1.5 font-mono text-micro uppercase tracking-wider2 text-white transition-colors hover:bg-ink-800"
                    >
                      Sign in
                    </a>
                  </div>
                )}

                <form onSubmit={handlePlaceOrder} className="space-y-5">
                  <Field label="Full name" htmlFor="name" required error={formErrors.name}>
                    <input
                      id="name"
                      type="text"
                      value={checkoutDetails.customerName}
                      onChange={e => handleInputChange('customerName', e.target.value)}
                      placeholder="As it should appear on the invoice"
                      className={formErrors.name ? 'border-red-500' : ''}
                    />
                  </Field>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field label="Mobile" htmlFor="phone" required error={formErrors.phone}>
                      <input
                        id="phone"
                        type="tel"
                        inputMode="numeric"
                        value={checkoutDetails.customerPhone}
                        onChange={e => handleInputChange('customerPhone', e.target.value)}
                        placeholder="10-digit number"
                        className={formErrors.phone ? 'border-red-500' : ''}
                      />
                    </Field>
                    <Field label="Email" htmlFor="email" required error={formErrors.email}>
                      <input
                        id="email"
                        type="email"
                        value={checkoutDetails.customerEmail}
                        onChange={e => handleInputChange('customerEmail', e.target.value)}
                        placeholder="you@company.com"
                        className={formErrors.email ? 'border-red-500' : ''}
                      />
                    </Field>
                  </div>

                  {/* Fulfillment segmented control */}
                  <fieldset>
                    <legend className="label-caps mb-2">How you want it</legend>
                    <div className="grid grid-cols-2 gap-2">
                      {(
                        [
                          { value: 'pickup', label: 'Store pickup', Icon: Building2 },
                          { value: 'delivery', label: 'Home delivery', Icon: Truck },
                        ] as const
                      ).map(({ value, label, Icon }) => {
                        const active = checkoutDetails.fulfillmentType === value;
                        return (
                          <button
                            key={value}
                            type="button"
                            onClick={() => handleInputChange('fulfillmentType', value)}
                            aria-pressed={active}
                            className={
                              active
                                ? 'flex items-center justify-center gap-2 rounded-sm border-2 border-ink-950 bg-ink-950 px-3 py-3 font-mono text-micro font-medium uppercase tracking-wider2 text-white transition-colors'
                                : 'flex items-center justify-center gap-2 rounded-sm border border-ink-200 bg-white px-3 py-3 font-mono text-micro font-medium uppercase tracking-wider2 text-ink-500 transition-colors hover:border-ink-950 hover:text-ink-950'
                            }
                          >
                            <Icon size={14} aria-hidden="true" />
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </fieldset>

                  {isPickup ? (
                    <div className="rounded border border-ink-200 bg-ink-50 p-4">
                      <p className="label-caps flex items-center gap-2 text-ink-950">
                        <MapPin size={13} className="text-primary-500" aria-hidden="true" />
                        Collect from the counter
                      </p>
                      <p className="mt-2.5 text-body-s leading-relaxed text-ink-700">
                        {SITE.street}, {SITE.city} {SITE.pincode}
                      </p>
                      <p className="mt-3 font-mono text-micro uppercase tracking-wider2 text-emerald-700">
                        No delivery charge
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-5 border-t border-ink-100 pt-5">
                      <Field label="Street address" htmlFor="address" required error={formErrors.address}>
                        <input
                          id="address"
                          type="text"
                          value={checkoutDetails.deliveryAddress}
                          onChange={e => handleInputChange('deliveryAddress', e.target.value)}
                          placeholder="Flat, house no., building, street"
                          className={formErrors.address ? 'border-red-500' : ''}
                        />
                      </Field>

                      <div className="grid grid-cols-3 gap-3">
                        <Field label="City" htmlFor="city" required error={formErrors.city}>
                          <input
                            id="city"
                            type="text"
                            value={checkoutDetails.deliveryCity}
                            onChange={e => handleInputChange('deliveryCity', e.target.value)}
                            placeholder="New Delhi"
                            className={formErrors.city ? 'border-red-500' : ''}
                          />
                        </Field>
                        <Field label="State" htmlFor="state" required error={formErrors.state}>
                          <input
                            id="state"
                            type="text"
                            value={checkoutDetails.deliveryState}
                            onChange={e => handleInputChange('deliveryState', e.target.value)}
                            placeholder="Delhi"
                            className={formErrors.state ? 'border-red-500' : ''}
                          />
                        </Field>
                        <Field label="Pincode" htmlFor="pincode" required error={formErrors.pincode}>
                          <input
                            id="pincode"
                            type="text"
                            inputMode="numeric"
                            value={checkoutDetails.deliveryPincode}
                            onChange={e => handleInputChange('deliveryPincode', e.target.value)}
                            placeholder="110030"
                            maxLength={6}
                            className={formErrors.pincode ? 'border-red-500' : ''}
                          />
                        </Field>
                      </div>
                    </div>
                  )}

                  <Field
                    label="Notes for the press"
                    htmlFor="notes"
                    hint="Anything we should know before this goes on press."
                  >
                    <textarea
                      id="notes"
                      rows={3}
                      value={checkoutDetails.notes}
                      onChange={e => handleInputChange('notes', e.target.value)}
                      placeholder="e.g. punch the corners, keep the logo clear of the trim edge…"
                    />
                  </Field>

                  {/* Totals */}
                  <dl className="divide-y divide-ink-200 border-y border-ink-200 py-1">
                    <SpecRow label="Subtotal" value={`₹${cartSubtotal.toFixed(2)}`} />
                    <SpecRow
                      label={isPickup ? 'Store pickup' : 'Delivery'}
                      value={
                        deliveryCharge > 0 ? `₹${deliveryCharge.toFixed(2)}` : <span className="text-emerald-700">Free</span>
                      }
                    />
                    <SpecRow label="Total payable" value={`₹${cartTotal.toFixed(2)}`} strong className="pb-3 pt-3" />
                  </dl>

                  <Button type="submit" size="lg" plate disabled={isLoading} className="w-full">
                    {isLoading ? (
                      <>
                        <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                        Processing
                      </>
                    ) : (
                      <>
                        <CreditCard size={16} aria-hidden="true" />
                        Place order & pay
                      </>
                    )}
                  </Button>

                  <p className="flex items-center justify-center gap-2 text-center font-mono text-micro uppercase tracking-wider2 text-ink-400">
                    <ShieldCheck size={13} className="text-emerald-600" aria-hidden="true" />
                    UPI, cards and net banking
                  </p>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---- Payment simulator ---- */}
      {showSimulator && simulatedOrder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/70 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="sim-title"
        >
          <div className="animate-fade-rise w-full max-w-md rounded-xl border border-ink-200 bg-white shadow-card">
            <ColourStrip />
            <div className="space-y-5 p-6">
              <div>
                <Badge tone="warning">Sandbox gateway</Badge>
                <h2 id="sim-title" className="mt-3 text-title">
                  Confirm simulated payment
                </h2>
                <p className="mt-1.5 font-mono text-body-s text-ink-500">
                  Order <span className="font-medium text-ink-800">{simulatedOrder.id}</span>
                </p>
              </div>

              <div className="rounded border border-ink-200 bg-ink-50 py-5 text-center">
                <span className="label-caps">Amount due</span>
                <span className="tnum mt-2 block font-display text-display-s font-black tracking-tightest text-ink-950">
                  ₹{simulatedOrder.total_amount.toFixed(2)}
                </span>
              </div>

              <div className="flex items-start gap-2.5 rounded border border-ink-200 bg-ink-50 p-3.5">
                <Info size={15} className="mt-0.5 flex-none text-ink-400" aria-hidden="true" />
                <p className="text-body-s leading-relaxed text-ink-600">
                  This gateway verifies the order record and triggers the WhatsApp confirmation. No
                  real money moves.
                </p>
              </div>

              {paymentSuccess ? (
                <div className="flex flex-col items-center gap-2 py-6 text-emerald-600">
                  <CheckCircle2 size={40} aria-hidden="true" />
                  <p className="font-display text-body-l font-bold">Payment approved</p>
                  <p className="font-mono text-micro uppercase tracking-wider2 text-ink-400">
                    Verifying transaction…
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <Button
                    onClick={handleSimulatePaymentSuccess}
                    disabled={isLoading}
                    variant="ink"
                    size="lg"
                    className="w-full"
                  >
                    {isLoading ? (
                      <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                    ) : (
                      <CheckCircle2 size={16} aria-hidden="true" />
                    )}
                    Simulate successful payment
                  </Button>
                  <Button
                    variant="ghost"
                    size="lg"
                    className="w-full"
                    onClick={() => {
                      setShowSimulator(false);
                      router.push(`/track?id=${simulatedOrder.id}&phone=${checkoutDetails.customerPhone}`);
                    }}
                  >
                    Close and keep payment pending
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ---- Sign-in required ---- */}
      {showAuthModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/70 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="auth-title"
        >
          <div className="animate-fade-rise w-full max-w-md rounded-xl border border-ink-200 bg-white shadow-card">
            <ColourStrip />
            <div className="p-6 text-center sm:p-8">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded border border-ink-200 bg-ink-50 text-ink-500">
                <Lock size={20} aria-hidden="true" />
              </span>
              <h2 id="auth-title" className="mt-5 text-title">
                Sign in to place this order
              </h2>
              <p className="mx-auto mt-3 max-w-sm text-body leading-relaxed text-ink-500">
                An account keeps the artwork you uploaded and the proof the press works from, so a
                reprint never starts from scratch.
              </p>
              <div className="mt-7 space-y-2.5">
                <a
                  href="/login.html?returnTo=cart.html"
                  className="flex w-full items-center justify-center gap-2 rounded bg-primary-500 px-6 py-3.5 font-mono text-label font-medium uppercase tracking-wider2 text-white transition-colors hover:bg-primary-600"
                >
                  Sign in or create an account
                  <ArrowRight size={15} aria-hidden="true" />
                </a>
                <Button variant="ghost" size="lg" className="w-full" onClick={() => setShowAuthModal(false)}>
                  Back to cart
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}