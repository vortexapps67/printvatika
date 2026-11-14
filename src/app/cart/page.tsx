'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { getBrowserSupabase } from '../../lib/supabaseBrowser';
import { Badge, Button, ButtonLink, ColourStrip, EmptyState, Field, Panel, PanelHead, SpecRow } from '../../components/ui/press';
import { SITE } from '../../lib/site';
import { payable } from '../../lib/catalog';
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
  MessageCircle,
  QrCode,
  Store,
  Check,
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
  } = useCart();

  const [isLoading, setIsLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Customer auth (Supabase). Replaces the old localStorage scrape.
  const { user: authUser, signIn } = useAuth();
  const currentUser = authUser
    ? {
        id: authUser.id,
        email: authUser.email || '',
        name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || '',
      }
    : null;

  // Auth gate modal state for login-before-ordering
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalEmail, setAuthModalEmail] = useState('');
  const [authModalPassword, setAuthModalPassword] = useState('');
  const [authModalLoading, setAuthModalLoading] = useState(false);
  const [authModalError, setAuthModalError] = useState('');

  const handleModalSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthModalError('');
    setAuthModalLoading(true);
    try {
      const { error } = await signIn(authModalEmail, authModalPassword);
      if (error) {
        setAuthModalError(error);
      } else {
        setShowAuthModal(false);
      }
    } catch (err: any) {
      setAuthModalError(err?.message || 'Failed to sign in. Please try again.');
    } finally {
      setAuthModalLoading(false);
    }
  };

  useEffect(() => {
    if (authUser?.email && !checkoutDetails.customerEmail) {
      updateCheckoutDetails({ customerEmail: authUser.email });
    }
    if (authUser?.user_metadata?.full_name && !checkoutDetails.customerName) {
      updateCheckoutDetails({ customerName: authUser.user_metadata.full_name });
    }
  }, [authUser, checkoutDetails.customerEmail, checkoutDetails.customerName, updateCheckoutDetails]);

  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showQuoteNotice, setShowQuoteNotice] = useState(false);
  const [activePaymentTab, setActivePaymentTab] = useState<'online' | 'upi' | 'counter'>('online');
  const [utrInput, setUtrInput] = useState('');
  const [utrSubmitting, setUtrSubmitting] = useState(false);
  const [utrError, setUtrError] = useState('');
  const [simulatedOrder, setSimulatedOrder] = useState<any>(null);

  /* Razorpay gateway key from environment */
  const razorpayKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '';
  const isRazorpayConfigured = !!razorpayKey && !/YOUR_|placeholder|example/i.test(razorpayKey);
  const allowTestPayment = process.env.NODE_ENV !== 'production';
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  /* The discount code. Only the code the customer already has is ever sent to be
     checked, and the order route checks it again against the price it works out
     itself before any money comes off — so this is display, not authority. */
  const [couponInput, setCouponInput] = useState('');
  const [coupon, setCoupon] = useState<{
    code: string;
    discount: number;
    deliveryWaived: boolean;
  } | null>(null);
  const [couponChecking, setCouponChecking] = useState(false);
  const [couponMessage, setCouponMessage] = useState('');
  const [couponFailed, setCouponFailed] = useState(false);

  const discount = coupon?.discount ?? 0;
  const payableDelivery = coupon?.deliveryWaived ? 0 : deliveryCharge;

  /* Billed the way the press bills — whole rupees — so the total on screen is the
     total in its order book, and the amount the gateway charges. A bespoke job
     (nothing but quote-only lines) has no courier charge either: the quote covers
     the whole job. */
  const goodsTotal = payable(cartSubtotal);
  const deliveryAmount = goodsTotal > 0 ? payable(payableDelivery) : 0;
  const discountAmount = payable(discount);
  const amountDue = Math.max(0, goodsTotal + deliveryAmount - discountAmount);

  /** Ask the shop's own settings whether this code may be used, and for how much. */
  const applyCoupon = async (): Promise<{ code: string; discount: number; deliveryWaived: boolean } | null> => {
    const code = couponInput.trim().toUpperCase();
    if (!code) return null;

    setCouponChecking(true);
    setCouponFailed(false);
    try {
      const res = await fetch(`/api/coupons?code=${encodeURIComponent(code)}&subtotal=${cartSubtotal}`);
      const data = await res.json();
      if (data.valid) {
        const applied = {
          code: String(data.code),
          discount: Number(data.discount) || 0,
          deliveryWaived: Boolean(data.deliveryWaived),
        };
        setCoupon(applied);
        setCouponMessage(String(data.reason || ''));
        setCouponInput(applied.code);
        return applied;
      }
      setCoupon(null);
      setCouponMessage(String(data.reason || 'That code cannot be used on this order.'));
      setCouponFailed(true);
      return null;
    } catch {
      setCoupon(null);
      setCouponMessage('We could not check that code just now.');
      setCouponFailed(true);
      return null;
    } finally {
      setCouponChecking(false);
    }
  };

  const removeCoupon = () => {
    setCoupon(null);
    setCouponInput('');
    setCouponMessage('');
    setCouponFailed(false);
  };

  /* A code is tied to an order value, so changing the basket means checking it
     again rather than quietly over-discounting. The check waits for the basket
     to settle, so holding the + button down is one check, not forty — and a
     limiter answer is not read as a verdict on the code, because a hurried
     customer must not lose their discount for being quick. */
  useEffect(() => {
    if (!coupon) return;
    let cancelled = false;

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/coupons?code=${encodeURIComponent(coupon.code)}&subtotal=${cartSubtotal}`);
        if (cancelled || res.status === 429) return;
        const data = await res.json();
        if (cancelled) return;
        if (data.valid) {
          setCoupon({
            code: String(data.code),
            discount: Number(data.discount) || 0,
            deliveryWaived: Boolean(data.deliveryWaived),
          });
          setCouponMessage(String(data.reason || ''));
        } else {
          setCoupon(null);
          setCouponMessage(String(data.reason || 'That code no longer applies.'));
          setCouponFailed(true);
        }
      } catch {
        /* Leave the code as it stands; the order route decides for real. */
      }
    }, 600);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartSubtotal]);

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

    // Enforce login before ordering
    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }

    if (!validateForm()) return;

    /* Guest checkout. A signed-in session is used when one exists (pre-filling
       the form above), but it is no longer a requirement — this app has no
       sign-in screen, so requiring one blocked every order. */
    setIsLoading(true);

    try {
      /* A code typed but never applied is tried once here, so a customer who
         pastes an offer and goes straight to paying still gets it. */
      const appliedCoupon = coupon ?? (couponInput.trim() ? await applyCoupon() : null);

      const { data: sessionData } = await getBrowserSupabase().auth.getSession();
      const accessToken = sessionData.session?.access_token;

      // 1. Submit cart specifications and buyer data to API to create PENDING order
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({
          ...(currentUser ? { userId: currentUser.id, userToken: currentUser.id } : {}),
          customerName: checkoutDetails.customerName,
          customerEmail: checkoutDetails.customerEmail,
          customerPhone: checkoutDetails.customerPhone,
          fulfillmentType: checkoutDetails.fulfillmentType,
          deliveryAddress: checkoutDetails.deliveryAddress,
          deliveryCity: checkoutDetails.deliveryCity,
          deliveryState: checkoutDetails.deliveryState,
          deliveryPincode: checkoutDetails.deliveryPincode,
          couponCode: appliedCoupon?.code,
          notes: checkoutDetails.notes,
          /* No prices are sent. The order route works out the subtotal, the
             courier charge and the discount from the catalogue and the shop's
             own codes, so an edited request cannot set its own total. */
          items: cart.map(item => ({
            product_slug: item.product.slug,
            product_name: item.product.name,
            quantity: item.quantity,
            selected_options: item.selected_options,
            dimensions: item.dimensions,
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

      // 2. Open payment modal for payment selection, or quote notice for bespoke items
      if (Number(orderData.total_amount) === 0) {
        clearCart();
        setShowQuoteNotice(true);
      } else {
        setShowPaymentModal(true);
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
    if (typeof window === 'undefined' || !(window as any).Razorpay) {
      alert('Payment gateway is loading. Please try again in a moment or use UPI QR.');
      return;
    }
    const key = razorpayKey;
    const options: any = {
      key,
      amount: Math.round(Number(order.total_amount) * 100),
      currency: 'INR',
      name: 'Print Vatika',
      description: `Payment for print order ${order.id}`,
      image: '/images/logo-nobg.png',
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

          clearCart();
          setShowPaymentModal(false);
          router.push(`/track?id=${order.id}&phone=${checkoutDetails.customerPhone}`);
        } catch (e) {
          clearCart();
          setShowPaymentModal(false);
          router.push(`/track?id=${order.id}&phone=${checkoutDetails.customerPhone}`);
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
        color: '#0B7C8A', // Brand turquoise
      },
    };

    if (order.razorpay_order_id) {
      options.order_id = order.razorpay_order_id;
    }

    try {
      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error('Razorpay open failed:', err);
      alert('Could not open payment window. Please use the UPI QR Code option.');
    }
  };

  const handleSubmitUTR = async () => {
    if (!simulatedOrder) return;
    const clean = utrInput.trim();
    if (clean.length < 6) {
      setUtrError('Please enter a valid 12-digit UPI UTR / reference number.');
      return;
    }
    setUtrSubmitting(true);
    setUtrError('');
    try {
      const res = await fetch('/api/payments/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: simulatedOrder.id,
          method: 'upi_utr',
          utr: clean,
        }),
      });
      if (res.ok) {
        clearCart();
        setShowPaymentModal(false);
        router.push(`/track?id=${simulatedOrder.id}&phone=${checkoutDetails.customerPhone}`);
      } else {
        const err = await res.json();
        setUtrError(err.error || 'Failed to submit UTR. Please check and try again.');
      }
    } catch {
      setUtrError('Network error. Please try again.');
    } finally {
      setUtrSubmitting(false);
    }
  };

  const handlePayAtCounter = async () => {
    if (!simulatedOrder) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/payments/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: simulatedOrder.id,
          method: 'pay_at_counter',
        }),
      });
      if (res.ok) {
        clearCart();
        setShowPaymentModal(false);
        router.push(`/track?id=${simulatedOrder.id}&phone=${checkoutDetails.customerPhone}`);
      } else {
        alert('Failed to confirm order. Please try again.');
      }
    } catch {
      alert('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
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
          setShowPaymentModal(false);
          router.push(`/track?id=${simulatedOrder.id}&phone=${checkoutDetails.customerPhone}`);
        }, 800);
      }
    } catch (e) {
      alert('Simulation failed.');
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
                className="flex gap-4 rounded-2xl border border-ink-200/80 bg-white p-4 shadow-card transition-shadow duration-300 ease-press hover:shadow-card-hover sm:gap-5"
              >
                <div className="h-20 w-20 flex-none overflow-hidden rounded-xl border border-ink-200/80 bg-ink-50 sm:h-24 sm:w-24">
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
                      className="-mr-1 -mt-1 flex h-7 w-7 flex-none items-center justify-center rounded-full text-ink-400 transition-colors hover:bg-red-50 hover:text-red-600"
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
                        className="rounded-full border border-ink-200 bg-ink-50 px-2 py-0.5 font-mono text-micro text-ink-600"
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
                    <div className="flex items-center rounded-full border border-ink-200 bg-white shadow-sm">
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
                      <span className="tnum mt-0.5 block font-display text-title font-bold tracking-tight text-ink-950">
                        ₹{payable(item.total_price)}
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
            <div className="overflow-hidden rounded-2xl border border-ink-200/80 bg-white shadow-card lg:sticky lg:top-20">
              <PanelHead title="Checkout" hint="Nothing is charged until you approve." />

              <div className="space-y-6 p-5 sm:p-6">
                {/* Auth gate */}
                {currentUser ? (
                  <div className="flex items-center justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2.5">
                    <p className="min-w-0 text-body-s text-emerald-900">
                      Signed in as <strong className="font-semibold">{currentUser.name || currentUser.email}</strong>
                    </p>
                    <Badge tone="success">Verified</Badge>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-3 rounded-lg border border-ink-200/80 bg-ink-50 px-3.5 py-3">
                    <p className="flex items-start gap-2.5 text-body-s leading-snug text-ink-700">
                      <Lock size={14} className="mt-0.5 flex-none text-ink-400" aria-hidden="true" />
                      <span>
                        <strong className="font-semibold text-ink-950">Sign in to order.</strong> Your
                        account keeps the artwork you upload and the proof we print from.
                      </span>
                    </p>
                    <a
                      href="/login?next=/cart"
                      className="flex-none rounded-full bg-primary-500 px-3 py-1.5 font-mono text-micro uppercase tracking-wider2 text-white transition-colors hover:bg-primary-600"
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
                                ? 'flex items-center justify-center gap-2 rounded-lg border-2 border-primary-500 bg-primary-50 px-3 py-3 font-mono text-micro font-medium uppercase tracking-wider2 text-primary-700 transition-colors'
                                : 'flex items-center justify-center gap-2 rounded-lg border border-ink-200 bg-white px-3 py-3 font-mono text-micro font-medium uppercase tracking-wider2 text-ink-500 transition-colors hover:border-ink-400 hover:text-ink-950'
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
                    <div className="rounded-xl border border-ink-200/80 bg-ink-50 p-4">
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

                  {/* Discount code — the shop's own codes, read from its settings. */}
                  <Field
                    label="Discount code"
                    htmlFor="coupon"
                    hint="Got a code from the counter or a WhatsApp offer?"
                  >
                    <div className="flex gap-2">
                      <input
                        id="coupon"
                        type="text"
                        value={couponInput}
                        onChange={e => setCouponInput(e.target.value.toUpperCase())}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            void applyCoupon();
                          }
                        }}
                        placeholder="VATIKA50"
                        className="font-mono uppercase"
                        disabled={!!coupon}
                        autoComplete="off"
                      />
                      {coupon ? (
                        <Button type="button" variant="ghost" onClick={removeCoupon} className="shrink-0">
                          Remove
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          variant="ink"
                          onClick={() => void applyCoupon()}
                          disabled={couponChecking || !couponInput.trim()}
                          className="shrink-0"
                        >
                          {couponChecking ? 'Checking' : 'Apply'}
                        </Button>
                      )}
                    </div>
                  </Field>

                  {couponMessage && (
                    <p
                      className={`-mt-2 text-body-s leading-relaxed ${
                        couponFailed ? 'text-red-600' : 'text-emerald-700'
                      }`}
                    >
                      {couponMessage}
                    </p>
                  )}

                  {/* Totals */}
                  <dl className="divide-y divide-ink-200 border-y border-ink-200 py-1">
                    <SpecRow label="Subtotal" value={`₹${goodsTotal}`} />
                    <SpecRow
                      label={isPickup ? 'Store pickup' : 'Delivery'}
                      value={
                        deliveryAmount > 0 ? `₹${deliveryAmount}` : <span className="text-emerald-700">Free</span>
                      }
                    />
                    {discountAmount > 0 && (
                      <SpecRow
                        label={`Discount · ${coupon?.code}`}
                        value={<span className="text-emerald-700">− ₹{discountAmount}</span>}
                      />
                    )}
                    <SpecRow label="Total payable" value={`₹${amountDue}`} strong className="pb-3 pt-3" />
                  </dl>

                  {!currentUser ? (
                    <Button
                      type="button"
                      size="lg"
                      plate
                      onClick={() => setShowAuthModal(true)}
                      className="w-full bg-gradient-to-r from-primary-600 via-primary-500 to-indigo-600 hover:from-primary-700 hover:to-indigo-700 text-white shadow-lg transition-all"
                    >
                      <Lock size={16} aria-hidden="true" />
                      Sign in to place order
                    </Button>
                  ) : (
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
                  )}

                  <p className="flex items-center justify-center gap-2 text-center font-mono text-micro uppercase tracking-wider2 text-ink-400">
                    <ShieldCheck size={13} className="text-emerald-600" aria-hidden="true" />
                    {isRazorpayConfigured ? 'UPI, cards and net banking' : 'Pay by UPI or at the counter'}
                  </p>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---- Bespoke job / Quote requested modal ---- */}
      {showQuoteNotice && simulatedOrder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/70 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="quote-title"
        >
          <div className="animate-fade-rise w-full max-w-md overflow-hidden rounded-2xl border border-ink-200/80 bg-white shadow-card-hover">
            <ColourStrip />
            <div className="space-y-5 p-6">
              <div>
                <Badge tone="warning">Quote requested</Badge>
                <h2 id="quote-title" className="mt-3 text-title">
                  Order <span className="font-mono">{simulatedOrder.id}</span> is saved
                </h2>
                <p className="mt-2 text-body-s leading-relaxed text-ink-600">
                  Nothing is charged upfront for custom printing. Our team reviews your specs and files
                  and will contact you on <strong className="font-semibold text-ink-900">{checkoutDetails.customerPhone}</strong> with a detailed quotation before printing.
                </p>
              </div>

              <div className="rounded-xl border border-ink-200/80 bg-ink-50 py-4 text-center">
                <span className="label-caps">Status</span>
                <span className="tnum mt-1 block font-display text-display-s font-bold tracking-tight text-ink-950">
                  To be quoted
                </span>
              </div>

              <div className="space-y-2.5">
                <Button
                  variant="ink"
                  size="lg"
                  className="w-full"
                  onClick={() => {
                    const text = encodeURIComponent(
                      `Hi Print Vatika, I have placed custom quote order ${simulatedOrder.id}. Please review my file and let me know the quote.`
                    );
                    window.open(`https://wa.me/${SITE.phoneRaw.replace(/\D/g, '')}?text=${text}`, '_blank');
                  }}
                >
                  <MessageCircle size={16} aria-hidden="true" />
                  Discuss on WhatsApp
                </Button>
                <Button
                  variant="ghost"
                  size="lg"
                  className="w-full"
                  onClick={() => {
                    setShowQuoteNotice(false);
                    router.push(`/track?id=${simulatedOrder.id}&phone=${checkoutDetails.customerPhone}`);
                  }}
                >
                  Track this order
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---- Comprehensive Payment Modal (Online / UPI QR / Counter) ---- */}
      {showPaymentModal && simulatedOrder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/75 p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pay-modal-title"
        >
          <div className="animate-fade-rise my-8 w-full max-w-lg overflow-hidden rounded-2xl border border-ink-200/80 bg-white shadow-lift">
            <ColourStrip />
            <div className="p-6 sm:p-7">
              {/* Header */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-micro uppercase tracking-wider2 text-primary-700 bg-primary-50 px-2 py-0.5 rounded-md font-semibold">
                      Order {simulatedOrder.id}
                    </span>
                    <Badge tone="warning">Payment pending</Badge>
                  </div>
                  <h2 id="pay-modal-title" className="mt-2 text-title font-bold text-ink-950">
                    Choose Payment Method
                  </h2>
                </div>
                <div className="text-right">
                  <span className="label-caps">Amount Due</span>
                  <span className="tnum block font-display text-heading-sm font-bold text-ink-950">
                    ₹{payable(simulatedOrder.total_amount)}
                  </span>
                </div>
              </div>

              {/* Payment Method Switcher Tabs */}
              <div className="mt-5 grid grid-cols-3 gap-1 rounded-xl bg-ink-100 p-1">
                <button
                  type="button"
                  onClick={() => setActivePaymentTab('online')}
                  className={`flex items-center justify-center gap-1.5 rounded-lg py-2 font-mono text-micro font-medium uppercase tracking-wider2 transition-all ${
                    activePaymentTab === 'online'
                      ? 'bg-white text-ink-950 shadow-sm'
                      : 'text-ink-600 hover:text-ink-900'
                  }`}
                >
                  <CreditCard size={14} />
                  <span>Cards / UPI</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActivePaymentTab('upi')}
                  className={`flex items-center justify-center gap-1.5 rounded-lg py-2 font-mono text-micro font-medium uppercase tracking-wider2 transition-all ${
                    activePaymentTab === 'upi'
                      ? 'bg-white text-ink-950 shadow-sm'
                      : 'text-ink-600 hover:text-ink-900'
                  }`}
                >
                  <QrCode size={14} />
                  <span>Scan QR</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActivePaymentTab('counter')}
                  className={`flex items-center justify-center gap-1.5 rounded-lg py-2 font-mono text-micro font-medium uppercase tracking-wider2 transition-all ${
                    activePaymentTab === 'counter'
                      ? 'bg-white text-ink-950 shadow-sm'
                      : 'text-ink-600 hover:text-ink-900'
                  }`}
                >
                  <Store size={14} />
                  <span>Counter</span>
                </button>
              </div>

              {/* Tab 1: Razorpay Online Checkout */}
              {activePaymentTab === 'online' && (
                <div className="mt-6 space-y-4">
                  <div className="rounded-xl border border-primary-200/70 bg-primary-50/50 p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-600 text-white">
                        <CreditCard size={18} />
                      </div>
                      <div>
                        <h4 className="font-semibold text-ink-900 text-body">
                          Instant Online Checkout
                        </h4>
                        <p className="mt-0.5 text-body-s text-ink-600 leading-snug">
                          Pay instantly with Google Pay, PhonePe, Paytm, Debit/Credit Card, or Net Banking.
                        </p>
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="ink"
                    size="lg"
                    className="w-full py-3.5 text-body font-semibold"
                    onClick={() => initializeLiveRazorpay(simulatedOrder)}
                  >
                    <CreditCard size={16} aria-hidden="true" />
                    Pay ₹{payable(simulatedOrder.total_amount)} Online Now
                  </Button>

                  {allowTestPayment && (
                    <div className="pt-2 border-t border-ink-100">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-ink-500 font-mono text-micro"
                        onClick={handleSimulatePaymentSuccess}
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <Loader2 size={13} className="animate-spin mr-1" />
                        ) : (
                          <CheckCircle2 size={13} className="mr-1 text-emerald-600" />
                        )}
                        Simulate instant test approval (Dev Mode)
                      </Button>
                    </div>
                  )}

                  <p className="text-center font-mono text-micro text-ink-400 flex items-center justify-center gap-1.5">
                    <ShieldCheck size={13} className="text-emerald-600" />
                    Secured by 256-bit Razorpay Payment Gateway
                  </p>
                </div>
              )}

              {/* Tab 2: UPI QR Code & UTR Submission */}
              {activePaymentTab === 'upi' && (
                <div className="mt-5 space-y-4 text-center">
                  <div className="flex justify-center">
                    <div className="p-2.5 rounded-xl border-2 border-ink-200 bg-white shadow-sm inline-block">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                          `upi://pay?pa=09811427517@oksbi&pn=Printer+Vatika&am=${simulatedOrder.total_amount}&cu=INR&tn=${encodeURIComponent(
                            'Order ' + simulatedOrder.id
                          )}`
                        )}&bgcolor=FFFFFF&color=0B0B0C&margin=5`}
                        alt="UPI Payment QR Code"
                        width={180}
                        height={180}
                        className="rounded-lg"
                      />
                    </div>
                  </div>

                  <div>
                    <span className="font-mono text-body-s font-semibold text-ink-900 block">
                      UPI ID: 09811427517@oksbi
                    </span>
                    <span className="font-mono text-micro text-ink-500">
                      Print Vatika · State Bank of India
                    </span>
                  </div>

                  <a
                    href={`upi://pay?pa=09811427517@oksbi&pn=Printer+Vatika&am=${simulatedOrder.total_amount}&cu=INR&tn=${encodeURIComponent(
                      'Order ' + simulatedOrder.id
                    )}`}
                    className="inline-flex sm:hidden items-center justify-center gap-2 rounded-xl bg-primary-600 text-white px-4 py-2.5 font-semibold text-body-s w-full shadow-sm"
                  >
                    Open in UPI App (GPay / PhonePe / Paytm)
                  </a>

                  <div className="text-left pt-2 border-t border-ink-100">
                    <label htmlFor="utr-input" className="block text-label font-medium text-ink-800 mb-1">
                      Enter 12-digit UPI Reference / UTR Number *
                    </label>
                    <div className="flex gap-2">
                      <input
                        id="utr-input"
                        type="text"
                        value={utrInput}
                        onChange={e => setUtrInput(e.target.value)}
                        placeholder="e.g. 431289123456"
                        maxLength={24}
                        className="font-mono uppercase text-body"
                      />
                      <Button
                        type="button"
                        variant="ink"
                        onClick={handleSubmitUTR}
                        disabled={utrSubmitting || !utrInput.trim()}
                        className="shrink-0"
                      >
                        {utrSubmitting ? <Loader2 size={15} className="animate-spin" /> : 'Submit UTR'}
                      </Button>
                    </div>
                    {utrError && <p className="mt-1 text-micro text-red-600">{utrError}</p>}
                    <p className="mt-1 font-mono text-micro text-ink-400">
                      Find the 12-digit UPI transaction reference in your UPI app receipt.
                    </p>
                  </div>
                </div>
              )}

              {/* Tab 3: Pay Cash / UPI at Counter */}
              {activePaymentTab === 'counter' && (
                <div className="mt-6 space-y-4">
                  <div className="rounded-xl border border-ink-200 bg-ink-50 p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-ink-900 text-white">
                        <Store size={18} />
                      </div>
                      <div>
                        <h4 className="font-semibold text-ink-950 text-body">
                          Pay upon Counter Pickup
                        </h4>
                        <p className="mt-1 text-body-s text-ink-600 leading-snug">
                          {SITE.pickupAddress}
                        </p>
                        <p className="mt-2 font-mono text-micro text-emerald-700 font-medium">
                          Mon–Sat: 9:00 AM – 8:00 PM · Near Saket Metro
                        </p>
                      </div>
                    </div>
                  </div>

                  <p className="text-body-s text-ink-600 leading-relaxed">
                    Your job will be queued for printing. You can inspect the finished prints and pay
                    by Cash or UPI at the counter when collecting.
                  </p>

                  <Button
                    variant="ink"
                    size="lg"
                    className="w-full py-3.5 text-body font-semibold"
                    onClick={handlePayAtCounter}
                    disabled={isLoading}
                  >
                    {isLoading ? <Loader2 size={16} className="animate-spin mr-1" /> : <Store size={16} className="mr-1" />}
                    Confirm Order & Pay at Counter
                  </Button>
                </div>
              )}

              {/* Cancel / Track Later */}
              <div className="mt-6 pt-4 border-t border-ink-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setShowPaymentModal(false);
                    clearCart();
                    router.push(`/track?id=${simulatedOrder.id}&phone=${checkoutDetails.customerPhone}`);
                  }}
                  className="font-mono text-micro uppercase tracking-wider2 text-ink-500 hover:text-ink-900 transition-colors"
                >
                  Pay later & track order
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const text = encodeURIComponent(
                      `Order ${simulatedOrder.id} (${checkoutDetails.customerName}) — need assistance with payment.`
                    );
                    window.open(`https://wa.me/${SITE.phoneRaw.replace(/\D/g, '')}?text=${text}`, '_blank');
                  }}
                  className="font-mono text-micro text-primary-700 hover:text-primary-800 flex items-center gap-1 font-semibold"
                >
                  <MessageCircle size={13} />
                  Help on WhatsApp
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---- Sleek Login-Before-Ordering Modal ---- */}
      {showAuthModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/70 backdrop-blur-md p-4 animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md overflow-hidden rounded-3xl border border-white/20 bg-white shadow-2xl animate-in zoom-in-95 duration-200">
            <ColourStrip />
            <div className="p-6 sm:p-8 space-y-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-50 text-primary-600">
                    <Lock size={20} />
                  </div>
                  <div>
                    <h3 className="font-display text-title font-bold text-ink-950">
                      Sign in to order
                    </h3>
                    <p className="text-body-s text-ink-500">
                      Link this order to your account
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAuthModal(false)}
                  className="rounded-full p-1.5 text-ink-400 hover:bg-ink-100 hover:text-ink-700 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <p className="text-body-s text-ink-600 leading-relaxed">
                An account protects your print artwork, lets you inspect live 300 DPI press proofs, and enables automatic WhatsApp order tracking.
              </p>

              {authModalError && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-body-s text-red-700">
                  {authModalError}
                </div>
              )}

              <form onSubmit={handleModalSignIn} className="space-y-4">
                <Field label="Email address" htmlFor="auth-email">
                  <input
                    id="auth-email"
                    type="email"
                    value={authModalEmail}
                    onChange={e => setAuthModalEmail(e.target.value)}
                    placeholder="you@company.com"
                    required
                  />
                </Field>
                <Field label="Password" htmlFor="auth-password">
                  <input
                    id="auth-password"
                    type="password"
                    value={authModalPassword}
                    onChange={e => setAuthModalPassword(e.target.value)}
                    placeholder="Your password"
                    required
                  />
                </Field>

                <Button
                  type="submit"
                  size="lg"
                  plate
                  disabled={authModalLoading}
                  className="w-full"
                >
                  {authModalLoading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    'Sign In & Continue Order'
                  )}
                </Button>
              </form>

              <div className="relative my-4 flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-ink-200" />
                </div>
                <span className="relative bg-white px-3 font-mono text-micro uppercase text-ink-400">
                  or
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <Link
                  href="/login?next=/cart"
                  className="flex items-center justify-center rounded-xl border border-ink-200 bg-ink-50 px-3 py-2.5 text-center font-mono text-micro font-semibold uppercase tracking-wider text-ink-700 hover:bg-ink-100 transition-colors"
                >
                  Full Sign In
                </Link>
                <Link
                  href="/signup?next=/cart"
                  className="flex items-center justify-center rounded-xl border border-primary-200 bg-primary-50 px-3 py-2.5 text-center font-mono text-micro font-semibold uppercase tracking-wider text-primary-700 hover:bg-primary-100 transition-colors"
                >
                  Create Account
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}