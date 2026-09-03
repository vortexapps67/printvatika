'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '../../context/CartContext';
import { calculatePricing } from '../../lib/priceCalculator';
import {
  ShoppingBag,
  Trash2,
  MapPin,
  Truck,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  Building,
  CheckCircle2,
  Loader2,
  Phone,
  Mail,
  User,
  Info,
  Lock
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
    cartTotal
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
                name: user.user_metadata?.full_name || user.name || user.email?.split('@')[0] || ''
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
          'Authorization': `Bearer ${currentUser.id}`
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
            original_file: item.original_file, // transfers original base64
            preview_base64: item.preview_base64,
            design_config: item.design_config
          }))
        })
      });

      if (!response.ok) {
        throw new Error('Server failed to initiate order');
      }

      const orderData = await response.json();
      setSimulatedOrder(orderData);
      
      // 2. Open payment window (either Razorpay SDK or Simulator fallback)
      // Check if public Razorpay keys are configured
      const isRazorpayConfigured = !!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
      
      if (isRazorpayConfigured) {
        // Trigger live Razorpay Checkout SDK window
        initializeLiveRazorpay(orderData);
      } else {
        // Fall back to our clean simulated gateway modal
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
      amount: Math.round(order.total_amount * 100), // amount in paise
      currency: 'INR',
      name: 'Print Vatika',
      description: `Payment for Print Order ${order.id}`,
      order_id: order.razorpay_order_id, // generated by server API
      handler: async function (response: any) {
        // Verify payment signature server-side
        setIsLoading(true);
        try {
          const verification = await fetch('/api/payments/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orderId: order.id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpayOrderId: response.razorpay_order_id,
              razorpaySignature: response.razorpay_signature
            })
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
        contact: checkoutDetails.customerPhone
      },
      theme: {
        color: '#6d28d9'
      }
    };

    const rzp = new (window as any).Razorpay(options);
    rzp.open();
  };

  // Simulation Payment verification handler
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
          status: 'PAID'
        })
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

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-8">
        Your Shopping Cart
      </h1>

      {cart.length === 0 ? (
        <div className="text-center py-20 bg-white border border-slate-200 rounded-3xl max-w-2xl mx-auto p-6 shadow-sm">
          <ShoppingBag size={48} className="mx-auto text-slate-300 mb-4" />
          <h2 className="text-xl font-bold text-slate-800">Your Cart is Empty</h2>
          <p className="text-slate-400 text-xs mt-2 max-w-sm mx-auto">
            Customize business cards, print custom banners, apparel shirts, and checkout online.
          </p>
          <Link
            href="/catalog"
            className="inline-flex items-center gap-1.5 bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs px-6 py-3 rounded-xl shadow-md mt-6 transition-all"
          >
            Browse Products Catalog
            <ArrowRight size={14} />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Cart Items List */}
          <div className="lg:col-span-7 space-y-4">
            {cart.map(item => (
              <div key={item.id} className="bg-white border border-slate-200 rounded-2xl p-4 flex gap-4 shadow-sm relative overflow-hidden">
                {/* Thumbnail */}
                <div className="w-20 h-20 bg-slate-100 rounded-xl overflow-hidden border border-slate-200 shrink-0">
                  {item.preview_base64 ? (
                    <img src={item.preview_base64} alt={item.product.name} className="w-full h-full object-cover" />
                  ) : (
                    <img src={item.product.image_url} alt={item.product.name} className="w-full h-full object-cover" />
                  )}
                </div>

                {/* Details */}
                <div className="flex-grow space-y-1">
                  <h3 className="font-bold text-slate-900 text-sm leading-tight">
                    {item.product.name}
                  </h3>
                  
                  {/* Selected Spec list tags */}
                  <div className="flex flex-wrap gap-1 text-[10px]">
                    {Object.entries(item.selected_options).map(([key, val]) => (
                      <span key={key} className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium border border-slate-150 capitalize">
                        {key}: {val}
                      </span>
                    ))}
                  </div>

                  {item.original_file && (
                    <span className="inline-block text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 font-semibold truncate max-w-[200px] mt-1">
                      File: {item.original_file.name}
                    </span>
                  )}

                  {/* Quantity and Price */}
                  <div className="flex items-center gap-4 pt-2">
                    <div className="flex items-center border border-slate-200 rounded-lg">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="px-2.5 py-1 text-slate-500 hover:bg-slate-100 font-bold"
                      >
                        -
                      </button>
                      <span className="px-3 text-xs font-bold text-slate-800">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="px-2.5 py-1 text-slate-500 hover:bg-slate-100 font-bold"
                      >
                        +
                      </button>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 font-medium">Unit: ₹{item.unit_price.toFixed(2)}</span>
                      <span className="block text-sm font-extrabold text-slate-900 leading-none mt-0.5">
                        ₹{item.total_price.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Remove button */}
                <button
                  onClick={() => removeFromCart(item.id)}
                  className="text-slate-400 hover:text-red-500 p-1.5 hover:bg-red-50 rounded-lg transition-colors shrink-0 self-start"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}

            <button
              onClick={clearCart}
              className="text-xs font-bold text-red-500 hover:text-red-700 bg-red-50/50 hover:bg-red-50 px-4 py-2.5 rounded-xl border border-red-100 transition-colors"
            >
              Clear Shopping Cart
            </button>
          </div>

          {/* Right: Checkout Shipping Forms & Totals */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
            <h2 className="text-lg font-extrabold text-slate-800">Checkout Specifications</h2>
            
            {/* Auth Gate Status Indicator */}
            {currentUser ? (
              <div className="bg-emerald-50 border border-emerald-200/80 rounded-2xl px-4 py-3 flex items-center justify-between text-xs text-emerald-900">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>Signed in as <strong>{currentUser.name || currentUser.email}</strong></span>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">Verified</span>
              </div>
            ) : (
              <div className="bg-blue-50/80 border border-blue-200/80 rounded-2xl p-4 flex items-center justify-between gap-3 text-xs text-blue-900">
                <div className="flex items-center gap-2.5">
                  <span className="text-base">🔒</span>
                  <span className="leading-tight">
                    <strong>Sign In Required:</strong> You must log in to place an order and track proofs.
                  </span>
                </div>
                <a
                  href="/login.html?returnTo=cart.html"
                  className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition-colors shadow-sm"
                >
                  Sign In →
                </a>
              </div>
            )}

            <form onSubmit={handlePlaceOrder} className="space-y-4">
              {/* Name */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 uppercase flex items-center gap-1.5">
                  <User size={14} className="text-slate-400" /> Full Name
                </label>
                <input
                  type="text"
                  value={checkoutDetails.customerName}
                  onChange={e => handleInputChange('customerName', e.target.value)}
                  placeholder="Enter full name"
                  className={`w-full bg-slate-50 border rounded-xl px-4 py-2.5 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 ${formErrors.name ? 'border-red-500' : 'border-slate-200'}`}
                />
                {formErrors.name && <p className="text-[10px] text-red-500 font-bold">{formErrors.name}</p>}
              </div>

              {/* Mobile and Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 uppercase flex items-center gap-1.5">
                    <Phone size={14} className="text-slate-400" /> Mobile Phone
                  </label>
                  <input
                    type="tel"
                    value={checkoutDetails.customerPhone}
                    onChange={e => handleInputChange('customerPhone', e.target.value)}
                    placeholder="10-digit number"
                    className={`w-full bg-slate-50 border rounded-xl px-4 py-2.5 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 ${formErrors.phone ? 'border-red-500' : 'border-slate-200'}`}
                  />
                  {formErrors.phone && <p className="text-[10px] text-red-500 font-bold">{formErrors.phone}</p>}
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 uppercase flex items-center gap-1.5">
                    <Mail size={14} className="text-slate-400" /> Email Address
                  </label>
                  <input
                    type="email"
                    value={checkoutDetails.customerEmail}
                    onChange={e => handleInputChange('customerEmail', e.target.value)}
                    placeholder="email@address.com"
                    className={`w-full bg-slate-50 border rounded-xl px-4 py-2.5 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 ${formErrors.email ? 'border-red-500' : 'border-slate-200'}`}
                  />
                  {formErrors.email && <p className="text-[10px] text-red-500 font-bold">{formErrors.email}</p>}
                </div>
              </div>

              {/* Fulfillment Type Toggle */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600 uppercase">Fulfillment Method</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleInputChange('fulfillmentType', 'pickup')}
                    className={`flex items-center justify-center gap-2 p-3 border rounded-xl font-bold text-xs transition-all ${
                      checkoutDetails.fulfillmentType === 'pickup'
                        ? 'border-primary-600 bg-primary-50 text-primary-700'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <Building size={16} />
                    Store Pickup
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInputChange('fulfillmentType', 'delivery')}
                    className={`flex items-center justify-center gap-2 p-3 border rounded-xl font-bold text-xs transition-all ${
                      checkoutDetails.fulfillmentType === 'delivery'
                        ? 'border-primary-600 bg-primary-50 text-primary-700'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <Truck size={16} />
                    Home Delivery
                  </button>
                </div>
              </div>

              {/* Conditionally Render Addresses */}
              {checkoutDetails.fulfillmentType === 'pickup' ? (
                <div className="border border-indigo-150 bg-indigo-50/40 rounded-2xl p-4 text-xs space-y-2">
                  <span className="font-bold text-indigo-700 uppercase tracking-wider block">Pickup Shop Address</span>
                  <p className="text-slate-600 font-medium leading-relaxed">
                    Main Bazar Road, Near Gandhi Chowk, Vatika, Jaipur, Rajasthan - 303905
                  </p>
                  <span className="block text-[10px] text-slate-500 font-semibold italic">
                    Pickup Charge: ₹0 (No shipping fees apply)
                  </span>
                </div>
              ) : (
                <div className="space-y-3.5 border-t border-slate-100 pt-4">
                  {/* Address */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 uppercase">Street Address</label>
                    <input
                      type="text"
                      value={checkoutDetails.deliveryAddress}
                      onChange={e => handleInputChange('deliveryAddress', e.target.value)}
                      placeholder="Flat, House no., Building, Street Name"
                      className={`w-full bg-slate-50 border rounded-xl px-4 py-2.5 text-xs focus:outline-none ${formErrors.address ? 'border-red-500' : 'border-slate-200'}`}
                    />
                    {formErrors.address && <p className="text-[10px] text-red-500 font-bold">{formErrors.address}</p>}
                  </div>

                  {/* City, State, Pincode */}
                  <div className="grid grid-cols-3 gap-2.5">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-600 uppercase">City</label>
                      <input
                        type="text"
                        value={checkoutDetails.deliveryCity}
                        onChange={e => handleInputChange('deliveryCity', e.target.value)}
                        placeholder="Jaipur"
                        className={`w-full bg-slate-50 border rounded-xl px-3 py-2 text-xs focus:outline-none ${formErrors.city ? 'border-red-500' : 'border-slate-200'}`}
                      />
                      {formErrors.city && <p className="text-[9px] text-red-500 font-bold">{formErrors.city}</p>}
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-600 uppercase">State</label>
                      <input
                        type="text"
                        value={checkoutDetails.deliveryState}
                        onChange={e => handleInputChange('deliveryState', e.target.value)}
                        placeholder="Rajasthan"
                        className={`w-full bg-slate-50 border rounded-xl px-3 py-2 text-xs focus:outline-none ${formErrors.state ? 'border-red-500' : 'border-slate-200'}`}
                      />
                      {formErrors.state && <p className="text-[9px] text-red-500 font-bold">{formErrors.state}</p>}
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-600 uppercase">Pincode</label>
                      <input
                        type="text"
                        value={checkoutDetails.deliveryPincode}
                        onChange={e => handleInputChange('deliveryPincode', e.target.value)}
                        placeholder="302001"
                        maxLength={6}
                        className={`w-full bg-slate-50 border rounded-xl px-3 py-2 text-xs focus:outline-none ${formErrors.pincode ? 'border-red-500' : 'border-slate-200'}`}
                      />
                      {formErrors.pincode && <p className="text-[9px] text-red-500 font-bold">{formErrors.pincode}</p>}
                    </div>
                  </div>
                </div>
              )}

              {/* Internal notes */}
              <div className="space-y-1 pt-2">
                <label className="text-xs font-bold text-slate-600 uppercase">Special Instructions / Notes</label>
                <textarea
                  rows={2}
                  value={checkoutDetails.notes}
                  onChange={e => handleInputChange('notes', e.target.value)}
                  placeholder="e.g. Please crop image slightly, require early dispatch..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs focus:outline-none"
                />
              </div>

              {/* Order total list summary */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mt-6 space-y-2">
                <div className="flex justify-between text-xs text-slate-500 font-medium">
                  <span>Cart Subtotal:</span>
                  <span>₹{cartSubtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-500 font-medium">
                  <span>Fulfillment Charge ({checkoutDetails.fulfillmentType}):</span>
                  <span>{deliveryCharge > 0 ? `₹${deliveryCharge.toFixed(2)}` : 'FREE'}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-slate-200 font-extrabold text-slate-900">
                  <span className="text-sm">Grand Total (Incl. GST):</span>
                  <span className="text-xl">₹{cartTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Submit Checkout */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3.5 rounded-2xl shadow-lg hover:shadow-primary-600/20 transition-all flex items-center justify-center gap-2 mt-4 text-sm"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Processing Checkout...
                  </>
                ) : (
                  <>
                    <CreditCard size={16} />
                    Confirm Order & Pay Online
                  </>
                )}
              </button>
            </form>

            <div className="flex gap-2 justify-center text-[10px] text-slate-400 font-medium">
              <ShieldCheck size={14} className="text-emerald-500" />
              <span>UPI, Cards, and Net Banking verification secured by SSL</span>
            </div>
          </div>
        </div>
      )}

      {/* UPI & Card Payment Gateway Simulator Modal */}
      {showSimulator && simulatedOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-6 sm:p-8 space-y-6 shadow-2xl relative animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="text-center space-y-2">
              <span className="bg-primary-100 text-primary-700 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                Razorpay Sandbox Gateway
              </span>
              <h3 className="font-extrabold text-slate-900 text-xl">Confirm Simulated Payment</h3>
              <p className="text-slate-400 text-xs">
                OrderID: <span className="font-bold text-slate-800">{simulatedOrder.id}</span>
              </p>
            </div>

            {/* Price block */}
            <div className="bg-slate-50 rounded-2xl p-4 text-center border border-slate-200">
              <span className="text-xs text-slate-500 font-semibold block uppercase">Amount Due</span>
              <span className="text-3xl font-black text-slate-900">₹{simulatedOrder.total_amount.toFixed(2)}</span>
            </div>

            {/* Sim options */}
            <div className="space-y-4">
              <div className="flex items-start gap-3 bg-indigo-50/50 border border-indigo-100 rounded-xl p-3.5 text-xs text-slate-600 font-medium">
                <Info size={18} className="text-indigo-600 shrink-0 mt-0.5" />
                <span>
                  This simulated gateway verifies database entry integrity and triggers WhatsApp order alerts. Click the button below to confirm payment.
                </span>
              </div>

              {paymentSuccess ? (
                <div className="flex flex-col items-center justify-center text-center py-6 text-emerald-600 space-y-2">
                  <CheckCircle2 size={48} className="animate-bounce" />
                  <span className="font-bold text-sm">Payment Approved Successfully!</span>
                  <span className="text-[10px] text-slate-400">Verifying transaction server-side...</span>
                </div>
              ) : (
                <div className="space-y-3">
                  <button
                    onClick={handleSimulatePaymentSuccess}
                    disabled={isLoading}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 text-sm"
                  >
                    {isLoading ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 size={16} />
                        Simulate Successful Payment (PAID)
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={() => {
                      setShowSimulator(false);
                      router.push(`/track?id=${simulatedOrder.id}&phone=${checkoutDetails.customerPhone}`);
                    }}
                    className="w-full bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold py-3 rounded-xl transition-all text-xs text-center block"
                  >
                    Close & Keep Payment Pending
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Sign In Required Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-6 sm:p-8 space-y-5 shadow-2xl relative animate-in zoom-in-95 duration-200 text-center">
            <div className="w-14 h-14 mx-auto rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-2xl">
              🔒
            </div>
            <div className="space-y-1.5">
              <h3 className="font-serif text-2xl font-black text-slate-900 tracking-tight">
                Sign In Required to Order
              </h3>
              <p className="text-slate-500 text-xs sm:text-sm leading-relaxed max-w-sm mx-auto">
                You must be signed in to your Print Vatika account to complete checkout. An account secures your high-res uploaded artwork and enables real-time WhatsApp and dashboard tracking.
              </p>
            </div>
            <div className="space-y-3 pt-2">
              <a
                href="/login.html?returnTo=cart.html"
                className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3.5 rounded-xl shadow-lg hover:shadow-primary-600/20 transition-all flex items-center justify-center gap-2 text-sm"
              >
                Sign In or Create Account
                <ArrowRight size={16} />
              </a>
              <button
                type="button"
                onClick={() => setShowAuthModal(false)}
                className="w-full py-2 text-xs text-slate-400 hover:text-slate-600 font-semibold"
              >
                Cancel & Return to Cart
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
