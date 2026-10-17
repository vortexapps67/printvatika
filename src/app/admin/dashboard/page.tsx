'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Order, Product, ProductOption, PricingRule, OrderStatus, PaymentStatus } from '../../../types';
import {
  Printer,
  ShoppingBag,
  TrendingUp,
  Clock,
  Search,
  Download,
  Notebook,
  RefreshCw,
  LogOut,
  ToggleLeft,
  ToggleRight,
  Truck,
  Building,
  User,
  X,
  Loader2,
  Phone,
} from 'lucide-react';
import {
  Badge,
  Button,
  ColourStrip,
  Panel,
  PanelHead,
  SpecRow,
  StatusPill,
} from '../../../components/ui/press';
import { SITE } from '../../../lib/site';

export default function AdminDashboardPage() {
  const router = useRouter();
  
  // Tab Management
  const [activeTab, setActiveTab] = useState<'orders' | 'products' | 'pricing'>('orders');
  
  // Data State
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductSlug, setSelectedProductSlug] = useState<string>('business-cards');
  const [productOptions, setProductOptions] = useState<ProductOption[]>([]);
  const [pricingRules, setPricingRules] = useState<PricingRule[]>([]);
  
  // Loading & Error States
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Selected Order for Details View Modal
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [statusUpdateNote, setStatusUpdateNote] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Edit Pricing states
  const [editingBasePrices, setEditingBasePrices] = useState<Record<string, number>>({});
  const [isSavingPrice, setIsSavingPrice] = useState(false);

  // Authentication check & Initial fetch
  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Fetch options when product selected in pricing tab changes
  useEffect(() => {
    if (activeTab === 'pricing') {
      fetchProductPricingConfigs(selectedProductSlug);
    }
  }, [activeTab, selectedProductSlug]);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    setError('');
    try {
      // 1. Fetch Orders from Admin API
      const ordersRes = await fetch('/api/admin/orders');
      if (ordersRes.status === 401) {
        // Redirect to admin login if cookie check fails
        router.push('/admin/login');
        return;
      }
      if (!ordersRes.ok) throw new Error('Failed to load orders.');
      const ordersData = await ordersRes.json();
      setOrders(ordersData);

      // 2. Fetch Products
      const productsRes = await fetch('/api/orders/products'); // public endpoint or standard catalog query
      if (productsRes.ok) {
        const productsData = await productsRes.json();
        setProducts(productsData);
        // Sync editing base prices state
        const initialPrices: Record<string, number> = {};
        productsData.forEach((p: Product) => {
          initialPrices[p.slug] = p.base_price;
        });
        setEditingBasePrices(initialPrices);
      }
    } catch (e: any) {
      setError(e.message || 'Error syncing data.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchDashboardData();
    setIsRefreshing(false);
  };

  const fetchProductPricingConfigs = async (slug: string) => {
    try {
      const res = await fetch(`/api/orders/products?slug=${slug}`);
      if (res.ok) {
        const data = await res.json();
        setProductOptions(data.options || []);
        setPricingRules(data.rules || []);
      }
    } catch (err) {
      console.error('Error fetching product pricing', err);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
      router.push('/admin/login');
    } catch (e) {
      console.error(e);
    }
  };

  // Status updates PUT handler
  const handleUpdateOrderStatus = async (orderId: string, nextStatus: OrderStatus) => {
    setIsUpdatingStatus(true);
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          orderStatus: nextStatus,
          notes: statusUpdateNote || `Order status updated to ${nextStatus}`
        })
      });

      if (!res.ok) throw new Error('Status update failed.');
      
      const data = await res.json();
      
      // Update local orders list state
      setOrders(prev => prev.map(o => o.id === orderId ? data.order : o));
      setSelectedOrder(data.order);
      setStatusUpdateNote('');
      alert(`Order status updated to ${nextStatus}. Customer has been notified.`);
    } catch (e: any) {
      alert(e.message || 'Failed to update order.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Modify base price PUT handler
  const handleUpdateBasePrice = async (slug: string) => {
    setIsSavingPrice(true);
    const basePrice = editingBasePrices[slug];
    try {
      const res = await fetch('/api/admin/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updatePrice',
          slug,
          basePrice
        })
      });
      if (res.ok) {
        alert('Base price updated in press database.');
        fetchDashboardData();
      } else {
        alert('Failed to save price.');
      }
    } catch (err) {
      alert('Network failure saving price.');
    } finally {
      setIsSavingPrice(false);
    }
  };

  // Toggle active product PUT handler
  const handleToggleProductActive = async (slug: string) => {
    try {
      const res = await fetch('/api/admin/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggleActive',
          slug
        })
      });
      if (res.ok) {
        fetchDashboardData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Edit Option Modifiers submit PUT handler
  const handleSaveOptionModifiers = async () => {
    setIsSavingPrice(true);
    try {
      const res = await fetch('/api/admin/pricing', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: selectedProductSlug,
          options: productOptions,
          rules: pricingRules
        })
      });
      if (res.ok) {
        alert('Custom pricing rules and modifiers saved successfully.');
        fetchProductPricingConfigs(selectedProductSlug);
      } else {
        alert('Failed to save options.');
      }
    } catch (e) {
      alert('Error saving modifications.');
    } finally {
      setIsSavingPrice(false);
    }
  };

  // Statistics Computations
  const stats = {
    totalOrders: orders.length,
    todayOrders: orders.filter(o => o.created_at.startsWith(new Date().toISOString().split('T')[0])).length,
    pendingCount: orders.filter(o => o.order_status === 'PAYMENT_PENDING' || o.order_status === 'PAID' || o.order_status === 'CONFIRMED').length,
    printingCount: orders.filter(o => o.order_status === 'PRINTING').length,
    revenue: orders.filter(o => o.payment_status === 'PAID').reduce((sum, o) => sum + o.total_amount, 0),
    deliveredCount: orders.filter(o => o.order_status === 'DELIVERED').length
  };

  // Filtered orders list
  const filteredOrders = orders.filter(o => {
    const matchesStatus = statusFilter === 'ALL' || o.order_status === statusFilter;
    const matchesSearch = 
      o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customer_phone.includes(searchQuery);
    return matchesStatus && matchesSearch;
  });

if (isLoading) {
    return (
      <div className="flex flex-grow flex-col items-center justify-center gap-4 py-24">
        <Loader2 className="animate-spin text-primary-600" size={32} aria-hidden="true" />
        <h1 className="label-caps">Syncing press operations</h1>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-sheet px-4 py-8 sm:px-6 lg:px-8">
      {/* ---- Header ---- */}
      <header className="flex flex-col gap-5 border-b border-ink-200 pb-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <img
            src="/images/logo-mark.png"
            alt=""
            width={192}
            height={192}
            className="h-10 w-10 flex-none rounded-sm ring-1 ring-ink-200"
          />
          <div>
            <h1 className="text-title-l">Admin console</h1>
            <p className="font-mono text-micro uppercase tracking-wider2 text-ink-500">
              Print Vatika · {SITE.city} hub
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw size={13} className={isRefreshing ? 'animate-spin' : ''} aria-hidden="true" />
            Refresh
          </Button>
          <Button variant="danger" size="sm" onClick={handleLogout}>
            <LogOut size={13} aria-hidden="true" />
            Log out
          </Button>
        </div>
      </header>

      {/* ---- Tabs ---- */}
      <div className="flex gap-6 border-b border-ink-200">
        {(
          [
            { id: 'orders', label: `Orders queue (${orders.length})` },
            { id: 'products', label: 'Catalog' },
            { id: 'pricing', label: 'Pricing rules' },
          ] as const
        ).map(tab => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              aria-current={active ? 'page' : undefined}
              className={
                active
                  ? 'border-b-2 border-primary-500 pb-3 font-mono text-label font-medium uppercase tracking-wider2 text-ink-950'
                  : 'border-b-2 border-transparent pb-3 font-mono text-label font-medium uppercase tracking-wider2 text-ink-400 transition-colors hover:text-ink-950'
              }
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ================= ORDERS ================= */}
      {activeTab === 'orders' && (
        <div className="mt-7 space-y-7">
          {/* Stats */}
          <dl className="grid grid-cols-2 gap-px overflow-hidden rounded border border-ink-200 bg-ink-200 lg:grid-cols-4">
            {[
              { label: 'Total orders', value: stats.totalOrders, Icon: ShoppingBag },
              { label: 'Press revenue', value: `₹${stats.revenue.toLocaleString('en-IN')}`, Icon: TrendingUp },
              { label: 'Queue pending', value: stats.pendingCount, Icon: Clock },
              { label: 'On press', value: stats.printingCount, Icon: Printer },
            ].map(({ label, value, Icon }) => (
              <div key={label} className="bg-white p-5">
                <dt className="label-caps">{label}</dt>
                <dd className="mt-2.5 flex items-baseline justify-between gap-2">
                  <span className="tnum font-display text-title-l font-extrabold tracking-tightest text-ink-950">
                    {value}
                  </span>
                  <Icon size={17} className="flex-none text-ink-300" aria-hidden="true" />
                </dd>
              </div>
            ))}
          </dl>

          {/* Table */}
          <Panel flush>
            <PanelHead
              title="Order queue"
              hint="Select a row to manage status and notify the customer."
            />

            {/* Filters */}
            <div className="flex flex-col gap-4 border-b border-ink-200 p-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative w-full lg:max-w-xs">
                <Search
                  size={15}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Order ID, customer name or phone"
                  aria-label="Search orders"
                  className="pl-9"
                />
              </div>

              <div className="scrollbar-none flex gap-1.5 overflow-x-auto">
                {['ALL', 'PAYMENT_PENDING', 'CONFIRMED', 'PRINTING', 'READY', 'DELIVERED', 'CANCELLED'].map(filter => {
                  const active = statusFilter === filter;
                  return (
                    <button
                      key={filter}
                      type="button"
                      onClick={() => setStatusFilter(filter)}
                      aria-pressed={active}
                      className={
                        active
                          ? 'flex-none whitespace-nowrap rounded-sm bg-ink-950 px-3 py-2 font-mono text-micro font-medium uppercase tracking-wider2 text-white transition-colors'
                          : 'flex-none whitespace-nowrap rounded-sm border border-ink-200 px-3 py-2 font-mono text-micro font-medium uppercase tracking-wider2 text-ink-500 transition-colors hover:border-ink-950 hover:text-ink-950'
                      }
                    >
                      {filter.replace(/_/g, ' ')}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-ink-200 bg-ink-50">
                    {['Order', 'Customer', 'Fulfilment', 'Amount', 'Payment', 'Status', ''].map(h => (
                      <th key={h} className="label-caps whitespace-nowrap px-4 py-3">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100">
                  {filteredOrders.length > 0 ? (
                    filteredOrders.map(o => (
                      <tr key={o.id} className="transition-colors hover:bg-ink-50">
                        <td className="tnum whitespace-nowrap px-4 py-3.5 font-mono text-body-s font-medium text-ink-950">
                          {o.id}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="block whitespace-nowrap text-body-s font-medium text-ink-900">
                            {o.customer_name}
                          </span>
                          <span className="tnum mt-0.5 block font-mono text-micro text-ink-400">
                            {o.customer_phone}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <Badge tone={o.fulfillment_type === 'delivery' ? 'neutral' : 'warning'}>
                            {o.fulfillment_type === 'delivery' ? (
                              <Truck size={11} aria-hidden="true" />
                            ) : (
                              <Building size={11} aria-hidden="true" />
                            )}
                            {o.fulfillment_type}
                          </Badge>
                        </td>
                        <td className="tnum whitespace-nowrap px-4 py-3.5 text-body-s font-semibold text-ink-950">
                          ₹{o.total_amount.toFixed(2)}
                        </td>
                        <td className="px-4 py-3.5">
                          <Badge tone={o.payment_status === 'PAID' ? 'success' : 'warning'}>
                            {o.payment_status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3.5">
                          <StatusPill status={o.order_status} />
                        </td>
                        <td className="px-4 py-3.5">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedOrder(o)}
                          >
                            Manage
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-4 py-14 text-center">
                        <p className="font-display text-title font-bold text-ink-950">Queue is clear</p>
                        <p className="mx-auto mt-2 max-w-sm text-body-s text-ink-500">
                          No orders match the current filter. Try a different status or clear the
                          search.
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>
      )}

      {/* ================= PRODUCTS ================= */}
      {activeTab === 'products' && (
        <Panel flush className="mt-7">
          <PanelHead
            title="Catalog & base prices"
            hint="Set the starting price for each product, and toggle what appears in the storefront."
          />

          <ul className="divide-y divide-ink-100">
            {products.map(p => (
              <li
                key={p.id}
                className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 items-center gap-3.5">
                  <img
                    src={p.image_url}
                    alt={p.name}
                    className="h-12 w-12 flex-none rounded-sm border border-ink-200 object-cover"
                  />
                  <div className="min-w-0">
                    <span className="block truncate font-display text-body font-bold text-ink-950">
                      {p.name}
                    </span>
                    <span className="font-mono text-micro uppercase tracking-wider2 text-ink-400">
                      {p.category} · /{p.slug}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center overflow-hidden rounded-sm border border-ink-200">
                    <span className="tnum border-r border-ink-200 bg-ink-50 px-2.5 py-2 font-mono text-body-s text-ink-500">
                      ₹
                    </span>
                    <input
                      type="number"
                      step="0.1"
                      aria-label={`Base price for ${p.name}`}
                      value={editingBasePrices[p.slug] || 0}
                      onChange={e =>
                        setEditingBasePrices(prev => ({ ...prev, [p.slug]: parseFloat(e.target.value) || 0 }))
                      }
                      className="tnum w-24 border-0 px-2.5 py-2 font-mono text-body-s font-medium"
                    />
                    <Button
                      size="sm"
                      onClick={() => handleUpdateBasePrice(p.slug)}
                      disabled={isSavingPrice}
                      className="h-full rounded-none border-l border-ink-200"
                    >
                      Save
                    </Button>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleProductActive(p.slug)}
                    aria-label={`${p.is_active ? 'Hide' : 'Show'} ${p.name} in the storefront`}
                    className="flex h-9 w-9 items-center justify-center rounded-sm transition-colors hover:bg-ink-100"
                  >
                    {p.is_active ? (
                      <ToggleRight size={26} className="text-emerald-600" />
                    ) : (
                      <ToggleLeft size={26} className="text-ink-300" />
                    )}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      )}

      {/* ================= PRICING ================= */}
      {activeTab === 'pricing' && (
        <Panel flush className="mt-7">
          <PanelHead
            title="Pricing rules"
            hint="Option surcharges apply per unit. Tier factors apply across the whole job."
            action={
              <div>
                <label htmlFor="pricing-product" className="sr-only">
                  Product
                </label>
                <select
                  id="pricing-product"
                  value={selectedProductSlug}
                  onChange={e => setSelectedProductSlug(e.target.value)}
                  className="h-9 w-auto font-mono text-micro uppercase tracking-wider2"
                >
                  {products.map(p => (
                    <option key={p.slug} value={p.slug}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            }
          />

          <div className="space-y-6 p-5">
            {productOptions.length > 0 ? (
              <>
                {productOptions.map((opt, optIdx) => {
                  if (opt.type !== 'select') return null;

                  return (
                    <section key={opt.id}>
                      <h3 className="label-caps mb-3">
                        {opt.display_name} · <span className="text-ink-400">{opt.name}</span>
                      </h3>
                      <ul className="grid gap-2 sm:grid-cols-2">
                        {opt.options_json.map((choice, choiceIdx) => (
                          <li
                            key={choice.value}
                            className="flex items-center justify-between gap-3 rounded-sm border border-ink-200 bg-white p-3"
                          >
                            <span className="min-w-0 truncate text-body-s font-medium text-ink-800">
                              {choice.label}
                            </span>
                            <div className="flex flex-none items-center overflow-hidden rounded-sm border border-ink-200">
                              <span className="tnum border-r border-ink-200 bg-ink-50 px-2 py-1.5 font-mono text-micro text-ink-500">
                                ₹
                              </span>
                              <input
                                type="number"
                                aria-label={`Surcharge for ${choice.label}`}
                                value={choice.price_modifier || 0}
                                onChange={e => {
                                  const val = parseFloat(e.target.value) || 0;
                                  setProductOptions(prev => {
                                    const copy = [...prev];
                                    copy[optIdx].options_json[choiceIdx].price_modifier = val;
                                    return copy;
                                  });
                                }}
                                className="tnum w-20 border-0 px-2 py-1.5 text-right font-mono text-body-s"
                              />
                            </div>
                          </li>
                        ))}
                      </ul>
                    </section>
                  );
                })}

                {pricingRules.length > 0 && (
                  <section>
                    <h3 className="label-caps mb-3">Bulk discount tiers</h3>
                    <ul className="divide-y divide-ink-200 border-y border-ink-200">
                      {pricingRules.map((rule, ruleIdx) => (
                        <li
                          key={rule.id}
                          className="flex flex-wrap items-center justify-between gap-3 py-3"
                        >
                          <span className="text-body-s text-ink-700">
                            When <strong className="font-semibold">{rule.option_key}</strong> is set to{' '}
                            <strong className="font-semibold">{rule.option_value}</strong> at{' '}
                            <span className="tnum font-mono">{rule.tier_min_qty}+</span>
                          </span>
                          <div className="flex items-center gap-2.5">
                            <div className="flex items-center overflow-hidden rounded-sm border border-ink-200">
                              <input
                                type="number"
                                step="0.05"
                                min="0.5"
                                max="1.0"
                                aria-label={`Discount factor for tier of ${rule.tier_min_qty}`}
                                value={rule.tier_discount_factor}
                                onChange={e => {
                                  const val = parseFloat(e.target.value) || 1.0;
                                  setPricingRules(prev => {
                                    const copy = [...prev];
                                    copy[ruleIdx].tier_discount_factor = val;
                                    return copy;
                                  });
                                }}
                                className="tnum w-16 border-0 px-2 py-1.5 text-center font-mono text-body-s"
                              />
                            </div>
                            <span className="tnum w-16 font-mono text-micro text-emerald-700">
                              {Math.round((1 - rule.tier_discount_factor) * 100)}% off
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                <Button onClick={handleSaveOptionModifiers} disabled={isSavingPrice} size="lg" plate>
                  Save pricing rules
                </Button>
              </>
            ) : (
              <p className="text-body text-ink-500">
                This product has no configurable options.
              </p>
            )}
          </div>
        </Panel>
      )}

      {/* ================= ORDER DETAIL ================= */}
      {selectedOrder && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink-950/70 p-4 sm:p-8"
          role="dialog"
          aria-modal="true"
          aria-labelledby="order-modal-title"
        >
          <div className="animate-fade-rise my-auto w-full max-w-5xl rounded-xl border border-ink-200 bg-white shadow-card">
            <ColourStrip />

            {/* Header */}
            <div className="flex items-start justify-between gap-4 border-b border-ink-200 p-5 sm:p-6">
              <div className="min-w-0">
                <Badge tone="neutral">Order management</Badge>
                <h2 id="order-modal-title" className="tnum mt-2.5 text-title-l">
                  {selectedOrder.id}
                </h2>
                <p className="mt-1 font-mono text-body-s text-ink-500">
                  Placed {new Date(selectedOrder.created_at).toLocaleString('en-IN')}
                </p>
              </div>
              <div className="flex flex-none items-center gap-3">
                <Badge tone={selectedOrder.fulfillment_type === 'delivery' ? 'neutral' : 'warning'}>
                  {selectedOrder.fulfillment_type === 'delivery' ? (
                    <Truck size={11} aria-hidden="true" />
                  ) : (
                    <Building size={11} aria-hidden="true" />
                  )}
                  {selectedOrder.fulfillment_type}
                </Badge>
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="flex h-8 w-8 items-center justify-center rounded-sm text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-950"
                  aria-label="Close order"
                >
                  <X size={17} />
                </button>
              </div>
            </div>

            <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-12">
              {/* Left: customer + items */}
              <div className="space-y-6 lg:col-span-7">
                <section>
                  <h3 className="label-caps mb-3">Customer</h3>
                  <dl className="grid gap-2 sm:grid-cols-2">
                    <div className="flex items-center gap-2 text-body-s text-ink-700">
                      <dt className="sr-only">Name</dt>
                      <User size={14} className="flex-none text-ink-300" aria-hidden="true" />
                      <dd className="truncate">{selectedOrder.customer_name}</dd>
                    </div>
                    <div className="flex items-center gap-2 text-body-s text-ink-700">
                      <dt className="sr-only">Phone</dt>
                      <Phone size={14} className="flex-none text-ink-300" aria-hidden="true" />
                      <dd className="tnum">{selectedOrder.customer_phone}</dd>
                    </div>
                    <div className="flex items-center gap-2 text-body-s text-ink-700 sm:col-span-2">
                      <dt className="sr-only">Email</dt>
                      <Notebook size={14} className="flex-none text-ink-300" aria-hidden="true" />
                      <dd className="truncate">{selectedOrder.customer_email}</dd>
                    </div>
                  </dl>
                </section>

                {selectedOrder.fulfillment_type === 'delivery' && (
                  <section>
                    <h3 className="label-caps mb-2.5">Delivery address</h3>
                    <p className="text-body-s leading-relaxed text-ink-700">
                      {selectedOrder.delivery_address}, {selectedOrder.delivery_city},{' '}
                      {selectedOrder.delivery_state} — {selectedOrder.delivery_pincode}
                    </p>
                  </section>
                )}

                <section>
                  <h3 className="label-caps mb-3">Items configured</h3>
                  <div className="space-y-3">
                    {selectedOrder.items?.map((item, i) => (
                      <article key={item.id} className="rounded-sm border border-ink-200 p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <h4 className="font-display text-body font-bold text-ink-950">
                              {item.product_name}
                            </h4>
                            <p className="tnum mt-0.5 font-mono text-micro uppercase tracking-wider2 text-ink-400">
                              {item.quantity} units
                            </p>
                          </div>
                          <span className="tnum shrink-0 font-display text-body font-bold text-ink-950">
                            ₹{item.total_price.toFixed(2)}
                          </span>
                        </div>

                        <ul className="mt-3 flex flex-wrap gap-1.5">
                          {Object.entries(item.selected_options).map(([k, v]) => (
                            <li
                              key={k}
                              className="rounded-sm border border-ink-200 bg-ink-50 px-2 py-0.5 font-mono text-micro text-ink-600"
                            >
                              <span className="text-ink-400">{k}</span> {v}
                            </li>
                          ))}
                        </ul>

                        <div className="mt-4 grid gap-3 border-t border-ink-100 pt-4 sm:grid-cols-2">
                          <div>
                            <span className="label-caps">Approved proof</span>
                            <div className="mt-2 aspect-[4/3] overflow-hidden rounded-sm border border-ink-200 bg-white">
                              {item.preview_file_url ? (
                                <img
                                  src={item.preview_file_url}
                                  alt={`Proof for ${item.product_name}`}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <span className="flex h-full items-center justify-center text-body-s text-ink-400">
                                  No proof
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-col">
                            <span className="label-caps">Print-ready file</span>
                            <p className="mt-2 truncate font-mono text-micro text-ink-500">
                              {item.product_slug}-design-raw.png
                            </p>
                            <div className="mt-auto pt-4">
                              {item.original_file_url ? (
                                <a
                                  href={item.original_file_url}
                                  download={`${item.product_slug}-order-${selectedOrder.id}-design`}
                                  className="inline-flex w-full items-center justify-center gap-1.5 rounded-sm bg-ink-950 px-3 py-2.5 font-mono text-micro font-medium uppercase tracking-wider2 text-white transition-colors hover:bg-primary-600"
                                >
                                  <Download size={13} aria-hidden="true" />
                                  Download file
                                </a>
                              ) : (
                                <p className="rounded-sm border border-ink-200 bg-ink-50 px-3 py-2.5 text-center font-mono text-micro text-ink-400">
                                  No upload
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              </div>

              {/* Right: actions */}
              <div className="space-y-6 lg:col-span-5">
                <div className="rounded-sm border border-ink-200 bg-ink-50 p-4">
                  <dl className="divide-y divide-ink-200">
                    <SpecRow label="Subtotal" value={`₹${selectedOrder.subtotal.toFixed(2)}`} />
                    <SpecRow
                      label="Delivery"
                      value={
                        selectedOrder.delivery_charge > 0 ? (
                          `₹${selectedOrder.delivery_charge.toFixed(2)}`
                        ) : (
                          <span className="text-emerald-700">Free</span>
                        )
                      }
                    />
                    <SpecRow
                      label="Paid"
                      value={`₹${selectedOrder.total_amount.toFixed(2)}`}
                      strong
                      className="pb-2 pt-3"
                    />
                  </dl>

                  <div className="mt-4 border-t border-ink-200 pt-4">
                    <span className="label-caps">Transaction</span>
                    <p className="mt-2 flex items-center gap-2 text-body-s">
                      <span className="label-caps">Status</span>
                      <Badge tone={selectedOrder.payment_status === 'PAID' ? 'success' : 'warning'}>
                        {selectedOrder.payment_status}
                      </Badge>
                    </p>
                    {selectedOrder.payment_id && (
                      <p className="mt-2 flex items-baseline gap-2">
                        <span className="label-caps">Txn</span>
                        <span className="truncate font-mono text-micro text-ink-600">
                          {selectedOrder.payment_id}
                        </span>
                      </p>
                    )}
                  </div>
                </div>

                <section>
                  <h3 className="label-caps mb-3">Move to status</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      'PAID',
                      'CONFIRMED',
                      'PRINTING',
                      'READY',
                      'OUT_FOR_DELIVERY',
                      'DELIVERED',
                      'CANCELLED',
                    ].map(status => {
                      const current = selectedOrder.order_status === status;
                      return (
                        <button
                          key={status}
                          type="button"
                          disabled={isUpdatingStatus || current}
                          onClick={() => handleUpdateOrderStatus(selectedOrder.id, status as OrderStatus)}
                          className={
                            current
                              ? 'cursor-default rounded-sm border border-ink-200 bg-ink-100 px-2.5 py-2.5 font-mono text-micro font-medium uppercase tracking-wider2 text-ink-400'
                              : status === 'CANCELLED'
                              ? 'rounded-sm border border-ink-200 bg-white px-2.5 py-2.5 font-mono text-micro font-medium uppercase tracking-wider2 text-ink-700 transition-colors hover:border-red-400 hover:bg-red-50 hover:text-red-700'
                              : 'rounded-sm border border-ink-200 bg-white px-2.5 py-2.5 font-mono text-micro font-medium uppercase tracking-wider2 text-ink-700 transition-colors hover:border-ink-950 hover:bg-ink-950 hover:text-white'
                          }
                        >
                          {status.replace(/_/g, ' ')}
                        </button>
                      );
                    })}
                  </div>
                </section>

                <section>
                  <h3 className="label-caps mb-2.5">Notification to customer</h3>
                  <textarea
                    rows={3}
                    value={statusUpdateNote}
                    onChange={e => setStatusUpdateNote(e.target.value)}
                    placeholder="e.g. Plates loaded, wrapping for dispatch…"
                    aria-label="Status notification note"
                  />
                  <p className="mt-2 text-body-s leading-relaxed text-ink-400">
                    Sent to the customer on WhatsApp with this status update and recorded on the order
                    timeline.
                  </p>
                </section>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}