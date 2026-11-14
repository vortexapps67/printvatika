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
  Phone,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  Edit2,
  Image as ImageIcon,
  Check,
  CheckCircle2,
  AlertCircle,
  SlidersHorizontal,
  Layers,
  Tag,
  Percent,
  KeyRound,
  ShieldCheck,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import {
  Badge,
  Button,
  ColourStrip,
  Panel,
  PanelHead,
  Skeleton,
  SpecRow,
  StatusPill,
} from '../../../components/ui/press';
import { SITE } from '../../../lib/site';

const AVAILABLE_IMAGES = [
  { label: 'Flex Banners', path: '/images/flex-banners.jpg' },
  { label: 'Flex Banners 2', path: '/images/flex-banners-2.jpg' },
  { label: 'Banner Signage', path: '/images/banner-signage.jpg' },
  { label: 'Business Cards', path: '/images/business-cards.jpg' },
  { label: 'Banner Cards', path: '/images/banner-cards.jpg' },
  { label: 'T-Shirts', path: '/images/t-shirts.jpg' },
  { label: 'Banner T-Shirts', path: '/images/banner-tshirts.jpg' },
  { label: 'Posters', path: '/images/posters.jpg' },
  { label: 'Banner Posters', path: '/images/banner-posters.jpg' },
  { label: 'Flyers', path: '/images/flyers.jpg' },
  { label: 'Brochures', path: '/images/brochures.jpg' },
  { label: 'Custom Print', path: '/images/custom-print.jpg' },
  { label: 'Stickers (Vector)', path: '/images/stickers.svg' },
  { label: 'Hero Light', path: '/images/hero-bg-light.png' },
  { label: 'Hero Dark', path: '/images/hero-bg-dark.png' },
];

interface HeroSlideData {
  id?: string;
  image: string;
  alt?: string;
  eyebrow: string;
  title: string;
  body: string;
  chip: { label: string; value: string };
  href: string;
  cta: string;
  href2?: string;
  cta2?: string;
}

interface PromoData {
  id?: string;
  image: string;
  eyebrow: string;
  title: string;
  body: string;
  href: string;
  cta: string;
  featured?: boolean;
}

interface OfferData {
  id?: string;
  title: string;
  body: string;
  tag: string;
  href: string;
  cta: string;
}

export default function AdminDashboardPage() {
  const router = useRouter();

  // Tab Management
  const [activeTab, setActiveTab] = useState<'orders' | 'products' | 'banners' | 'promos' | 'pricing' | 'settings'>('orders');

  // Data State
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductSlug, setSelectedProductSlug] = useState<string>('business-cards');
  const [productOptions, setProductOptions] = useState<ProductOption[]>([]);
  const [pricingRules, setPricingRules] = useState<PricingRule[]>([]);
  const [settings, setSettings] = useState<Record<string, string>>({});

  // Hero Banners State
  const [heroSlides, setHeroSlides] = useState<HeroSlideData[]>([]);
  const [isSavingBanners, setIsSavingBanners] = useState(false);

  // Promo Banners & Offers State
  const [promoList, setPromoList] = useState<PromoData[]>([]);
  const [offerList, setOfferList] = useState<OfferData[]>([]);
  const [isSavingPromos, setIsSavingPromos] = useState(false);

  // Flash Sale Start/Stop Controller State
  const [saleActive, setSaleActive] = useState(true);
  const [saleTitle, setSaleTitle] = useState('Deal of the Day · Up to 35% Bulk Discount on Business Cards & Flex Banners!');
  const [saleBadge, setSaleBadge] = useState('Deal of the Day');
  const [saleHours, setSaleHours] = useState('6');
  const [isSavingSale, setIsSavingSale] = useState(false);

  // Site Settings & Master Password State
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [announcementText, setAnnouncementText] = useState('');
  const [announcementLink, setAnnouncementLink] = useState('');
  const [shopPhone, setShopPhone] = useState('');
  const [shopWhatsapp, setShopWhatsapp] = useState('');
  const [shopUpiId, setShopUpiId] = useState('');
  const [shopAddress, setShopAddress] = useState('');
  const [deliveryCharge, setDeliveryCharge] = useState('50');
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Product Editing Modal
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSavingProduct, setIsSavingProduct] = useState(false);

  // Loading & Error States
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Selected Order for Details View Modal
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [statusUpdateNote, setStatusUpdateNote] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Inline Base Prices state
  const [editingBasePrices, setEditingBasePrices] = useState<Record<string, number>>({});
  const [isSavingPrice, setIsSavingPrice] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

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
        router.push('/admin/login');
        return;
      }
      if (!ordersRes.ok) throw new Error('Failed to load orders.');
      const ordersData = await ordersRes.json();
      setOrders(ordersData);

      // 2. Fetch Products
      const productsRes = await fetch('/api/orders/products');
      if (productsRes.ok) {
        const productsData = await productsRes.json();
        setProducts(productsData);
        const initialPrices: Record<string, number> = {};
        productsData.forEach((p: Product) => {
          initialPrices[p.slug] = p.base_price;
        });
        setEditingBasePrices(initialPrices);
      }

      // 3. Fetch Settings (Hero banners, promos, password, announcement, etc.)
      const settingsRes = await fetch('/api/admin/settings');
      if (settingsRes.ok) {
        const settingsData = await settingsRes.json();
        setSettings(settingsData);

        if (settingsData.admin_password) setAdminPassword(settingsData.admin_password);

        if (settingsData.sale_active !== undefined) {
          setSaleActive(settingsData.sale_active === 'true' || settingsData.sale_active === true);
        }
        if (settingsData.sale_title) setSaleTitle(settingsData.sale_title);
        if (settingsData.sale_badge) setSaleBadge(settingsData.sale_badge);
        if (settingsData.sale_hours) setSaleHours(settingsData.sale_hours);

        if (settingsData.announcement_text) setAnnouncementText(settingsData.announcement_text);
        if (settingsData.announcement_link) setAnnouncementLink(settingsData.announcement_link);
        if (settingsData.phone) setShopPhone(settingsData.phone);
        if (settingsData.whatsapp) setShopWhatsapp(settingsData.whatsapp);
        if (settingsData.upi_id) setShopUpiId(settingsData.upi_id);
        if (settingsData.address) setShopAddress(settingsData.address);
        if (settingsData.delivery_charge) setDeliveryCharge(settingsData.delivery_charge);

        if (settingsData.hero_banners) {
          try {
            setHeroSlides(JSON.parse(settingsData.hero_banners));
          } catch (e) {
            console.error('Failed to parse hero_banners', e);
          }
        }

        if (settingsData.promo_banners) {
          try {
            setPromoList(JSON.parse(settingsData.promo_banners));
          } catch (e) {
            console.error('Failed to parse promo_banners', e);
          }
        }

        if (settingsData.offer_tickets) {
          try {
            setOfferList(JSON.parse(settingsData.offer_tickets));
          } catch (e) {
            console.error('Failed to parse offer_tickets', e);
          }
        }
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
    showToast('Dashboard refreshed with latest press data.');
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

  // Order status update
  const handleUpdateOrderStatus = async (orderId: string, nextStatus: OrderStatus) => {
    setIsUpdatingStatus(true);
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          orderStatus: nextStatus,
          notes: statusUpdateNote || `Order status updated to ${nextStatus}`,
        }),
      });

      if (!res.ok) throw new Error('Status update failed.');
      const data = await res.json();

      setOrders(prev => prev.map(o => (o.id === orderId ? data.order : o)));
      setSelectedOrder(data.order);
      setStatusUpdateNote('');
      showToast(`Order ${orderId} moved to ${nextStatus}.`);
    } catch (e: any) {
      alert(e.message || 'Failed to update order.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Inline Base Price update
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
          basePrice,
        }),
      });
      if (res.ok) {
        showToast(`Base price for ${slug} updated to ₹${basePrice}.`);
        setProducts(prev =>
          prev.map(p => (p.slug === slug ? { ...p, base_price: Number(basePrice) } : p))
        );
      } else {
        alert('Failed to save price.');
      }
    } catch (err) {
      alert('Network failure saving price.');
    } finally {
      setIsSavingPrice(false);
    }
  };

  // Toggle active product
  const handleToggleProductActive = async (slug: string) => {
    try {
      const res = await fetch('/api/admin/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggleActive', slug }),
      });
      if (res.ok) {
        setProducts(prev =>
          prev.map(p => (p.slug === slug ? { ...p, is_active: !p.is_active } : p))
        );
        showToast(`Product ${slug} storefront visibility toggled.`);
      }
    } catch (err) {
      alert('Network failure toggling product status.');
    }
  };

  // Save Full Product Details (Name, Image, Base Price, Unit, Description)
  const handleSaveProductModal = async () => {
    if (!editingProduct) return;
    setIsSavingProduct(true);
    try {
      const res = await fetch('/api/admin/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          slug: editingProduct.slug,
          updates: {
            name: editingProduct.name,
            category: editingProduct.category,
            description: editingProduct.description,
            image_url: editingProduct.image_url,
            base_price: Number(editingProduct.base_price),
            base_unit: editingProduct.base_unit,
            is_active: editingProduct.is_active !== false,
          },
        }),
      });

      if (!res.ok) throw new Error('Failed to update product');

      setProducts(prev =>
        prev.map(p => (p.slug === editingProduct.slug ? { ...editingProduct } : p))
      );
      setEditingBasePrices(prev => ({
        ...prev,
        [editingProduct.slug]: Number(editingProduct.base_price),
      }));

      showToast(`Product "${editingProduct.name}" saved! Live on catalog immediately.`);
      setEditingProduct(null);
    } catch (e: any) {
      alert(e.message || 'Error updating product.');
    } finally {
      setIsSavingProduct(false);
    }
  };

  // Quick 1-Click Update for any product's image
  const handleQuickUpdateProductImage = async (slug: string, imageUrl: string) => {
    try {
      const res = await fetch('/api/admin/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          slug,
          updates: { image_url: imageUrl },
        }),
      });
      if (res.ok) {
        setProducts(prev =>
          prev.map(p => (p.slug === slug ? { ...p, image_url: imageUrl } : p))
        );
        showToast(`Image updated for ${slug}! Live immediately.`);
      } else {
        alert('Failed to update product image');
      }
    } catch {
      alert('Network error updating product image');
    }
  };

  // Start or Stop Flash Sale Controller
  const handleToggleSale = async (nextState: boolean) => {
    setIsSavingSale(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: {
            sale_active: String(nextState),
            sale_title: saleTitle,
            sale_badge: saleBadge,
            sale_hours: saleHours,
          },
        }),
      });
      if (res.ok) {
        setSaleActive(nextState);
        showToast(
          nextState
            ? '🔥 FLASH SALE STARTED! Countdown timer is now live on the storefront.'
            : '🛑 FLASH SALE STOPPED! Sale ticker banner is now hidden on the storefront.'
        );
      } else {
        alert('Failed to update sale status');
      }
    } catch {
      alert('Network failure saving sale status');
    } finally {
      setIsSavingSale(false);
    }
  };

  // Save Hero Banners Carousel
  const handleSaveHeroBanners = async () => {
    setIsSavingBanners(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'hero_banners',
          value: JSON.stringify(heroSlides),
        }),
      });

      if (!res.ok) throw new Error('Failed to save hero banners');
      showToast('Hero banners updated! Real-time updates are live on homepage.');
    } catch (e: any) {
      alert(e.message || 'Error saving hero banners.');
    } finally {
      setIsSavingBanners(false);
    }
  };

  // Save Promo Banners & Offer Tickets
  const handleSavePromosAndOffers = async () => {
    setIsSavingPromos(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: {
            promo_banners: JSON.stringify(promoList),
            offer_tickets: JSON.stringify(offerList),
          },
        }),
      });

      if (!res.ok) throw new Error('Failed to save promos and offer tickets');
      showToast('Promo cards & offer tickets updated! Live immediately on storefront.');
    } catch (e: any) {
      alert(e.message || 'Error saving promos & offers.');
    } finally {
      setIsSavingPromos(false);
    }
  };

  // Save Single Master Admin Password
  const handleSaveMasterPassword = async () => {
    if (!adminPassword.trim()) {
      alert('Password cannot be empty.');
      return;
    }
    setIsSavingPassword(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'admin_password',
          value: adminPassword.trim(),
        }),
      });

      if (!res.ok) throw new Error('Failed to update password');
      showToast('Master admin password updated successfully! Keep this safe.');
    } catch (e: any) {
      alert(e.message || 'Error updating password.');
    } finally {
      setIsSavingPassword(false);
    }
  };

  // Save Site Sections (Announcement bar, phone, upi, etc.)
  const handleSaveSiteSettings = async () => {
    setIsSavingSettings(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: {
            announcement_text: announcementText,
            announcement_link: announcementLink,
            phone: shopPhone,
            whatsapp: shopWhatsapp,
            upi_id: shopUpiId,
            address: shopAddress,
            delivery_charge: deliveryCharge,
          },
        }),
      });

      if (!res.ok) throw new Error('Failed to update settings');
      showToast('Site settings updated! Top announcement bar & contact info are live.');
    } catch (e: any) {
      alert(e.message || 'Error updating site settings.');
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Save Pricing Rule multipliers
  const handleSaveOptionModifiers = async () => {
    setIsSavingPrice(true);
    try {
      const res = await fetch('/api/admin/pricing', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: selectedProductSlug,
          options: productOptions,
          rules: pricingRules,
        }),
      });

      if (!res.ok) throw new Error('Failed to update pricing rules');
      showToast(`Pricing matrices & tier formulas updated for ${selectedProductSlug}.`);
    } catch (e: any) {
      alert(e.message || 'Error updating pricing rules.');
    } finally {
      setIsSavingPrice(false);
    }
  };

  // Filter orders
  const filteredOrders = orders.filter(order => {
    const matchesFilter = statusFilter === 'ALL' || order.order_status === statusFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      order.id.toLowerCase().includes(q) ||
      order.customer_name.toLowerCase().includes(q) ||
      order.customer_phone.includes(q);
    return matchesFilter && matchesSearch;
  });

  const totalRevenue = orders.reduce((acc, curr) => acc + (curr.total_amount || 0), 0);
  const pendingOrders = orders.filter(o => o.order_status === 'PAYMENT_PENDING').length;
  const inPressOrders = orders.filter(
    o => o.order_status === 'PRINTING' || o.order_status === 'CONFIRMED'
  ).length;

  return (
    <div className="min-h-screen bg-ink-50 pb-24 text-ink-900">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-lg border border-primary-500 bg-ink-950 px-5 py-3.5 font-mono text-body-s font-semibold text-white shadow-2xl animate-fade-rise">
          <Sparkles size={17} className="text-primary-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <header className="sticky top-0 z-40 border-b border-ink-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-4">
            <img
              src="/images/logo-lockup.webp"
              alt="Print Vatika"
              width={140}
              height={40}
              className="h-8 w-auto object-contain"
            />
            <div className="hidden h-5 w-px bg-ink-200 sm:block" />
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-mono text-micro font-semibold uppercase tracking-wider2 text-ink-600">
                Press Admin Control
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="hidden sm:inline-flex"
            >
              <RefreshCw size={13} className={isRefreshing ? 'animate-spin' : ''} />
              Sync Real-Time
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open('/', '_blank')}
              title="Open storefront in new tab"
            >
              <ExternalLink size={13} />
              <span className="hidden sm:inline">Storefront</span>
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-red-600 hover:bg-red-50">
              <LogOut size={14} />
              <span className="hidden sm:inline">Exit</span>
            </Button>
          </div>
        </div>

        {/* Tab Strip */}
        <div className="border-t border-ink-100 bg-white px-4 sm:px-6">
          <nav className="scrollbar-none mx-auto flex max-w-7xl space-x-1 overflow-x-auto py-2">
            {[
              { id: 'orders', label: 'Orders Queue', count: orders.length, icon: ShoppingBag },
              { id: 'products', label: 'Products & Images', count: products.length, icon: ImageIcon },
              { id: 'banners', label: 'Hero Banners', icon: Sparkles },
              { id: 'promos', label: 'Offers & Promos', icon: Tag },
              { id: 'pricing', label: 'Pricing Rules', icon: Percent },
              { id: 'settings', label: 'Master Password & Settings', icon: KeyRound },
            ].map(tab => {
              const active = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex flex-none items-center gap-2 rounded-md px-3.5 py-2 font-mono text-micro font-semibold uppercase tracking-wider2 transition-all ${
                    active
                      ? 'bg-ink-950 text-white shadow-sm'
                      : 'text-ink-600 hover:bg-ink-100 hover:text-ink-950'
                  }`}
                >
                  <Icon size={14} />
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span
                      className={`ml-1 rounded px-1.5 py-0.5 text-[10px] ${
                        active ? 'bg-primary-500 text-white' : 'bg-ink-200 text-ink-700'
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
        {isLoading ? (
          <div className="space-y-4 py-12">
            <Skeleton className="h-28 w-full rounded-xl" />
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-800">
            <div className="flex items-center gap-3">
              <AlertCircle size={20} className="text-red-600" />
              <h3 className="font-display text-body font-bold">Failed to load press state</h3>
            </div>
            <p className="mt-2 text-body-s">{error}</p>
            <Button onClick={fetchDashboardData} size="sm" className="mt-4">
              Retry Connection
            </Button>
          </div>
        ) : (
          <>
            {/* ================= 1. ORDERS TAB ================= */}
            {activeTab === 'orders' && (
              <div className="space-y-6">
                {/* Metrics */}
                <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                  {[
                    { label: 'Total Orders', value: orders.length, icon: ShoppingBag },
                    { label: 'Payment Pending', value: pendingOrders, icon: Clock },
                    { label: 'In Production', value: inPressOrders, icon: Printer },
                    {
                      label: 'Press Volume',
                      value: `₹${totalRevenue.toLocaleString('en-IN')}`,
                      icon: TrendingUp,
                    },
                  ].map(({ label, value, icon: Icon }) => (
                    <div key={label} className="rounded-xl border border-ink-200 bg-white p-4 shadow-sm">
                      <dt className="label-caps text-ink-500">{label}</dt>
                      <dd className="mt-2 flex items-baseline justify-between">
                        <span className="font-display text-title-l font-bold text-ink-950">{value}</span>
                        <Icon size={18} className="text-ink-400" />
                      </dd>
                    </div>
                  ))}
                </dl>

                {/* Queue Table */}
                <Panel flush>
                  <PanelHead
                    title="Order Queue & Dispatch"
                    hint="Click 'Manage' on any row to inspect uploaded artwork files, verify transaction, and update status."
                  />

                  {/* Search and Filters */}
                  <div className="flex flex-col gap-3 border-b border-ink-200 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="relative w-full sm:max-w-xs">
                      <Search
                        size={15}
                        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400"
                      />
                      <input
                        type="search"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Search ID, name or phone…"
                        className="w-full rounded-md border border-ink-200 bg-ink-50 py-1.5 pl-9 pr-3 text-body-s focus:border-ink-950 focus:bg-white focus:outline-none"
                      />
                    </div>

                    <div className="scrollbar-none flex gap-1.5 overflow-x-auto">
                      {['ALL', 'PAYMENT_PENDING', 'CONFIRMED', 'PRINTING', 'READY', 'DELIVERED', 'CANCELLED'].map(
                        filter => {
                          const active = statusFilter === filter;
                          return (
                            <button
                              key={filter}
                              type="button"
                              onClick={() => setStatusFilter(filter)}
                              className={`flex-none rounded-md px-2.5 py-1.5 font-mono text-micro font-medium uppercase tracking-wider2 transition-colors ${
                                active
                                  ? 'bg-ink-950 text-white'
                                  : 'border border-ink-200 text-ink-600 hover:border-ink-950'
                              }`}
                            >
                              {filter.replace(/_/g, ' ')}
                            </button>
                          );
                        }
                      )}
                    </div>
                  </div>

                  {/* Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left">
                      <thead>
                        <tr className="border-b border-ink-200 bg-ink-50 font-mono text-micro font-semibold uppercase tracking-wider2 text-ink-500">
                          <th className="px-4 py-3">Order ID</th>
                          <th className="px-4 py-3">Customer</th>
                          <th className="px-4 py-3">Fulfillment</th>
                          <th className="px-4 py-3">Total</th>
                          <th className="px-4 py-3">Payment</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-ink-100">
                        {filteredOrders.length > 0 ? (
                          filteredOrders.map(o => (
                            <tr key={o.id} className="transition-colors hover:bg-ink-50/70">
                              <td className="whitespace-nowrap px-4 py-3 font-mono text-body-s font-bold text-ink-950">
                                {o.id}
                              </td>
                              <td className="px-4 py-3">
                                <span className="block text-body-s font-medium text-ink-900">
                                  {o.customer_name}
                                </span>
                                <span className="block font-mono text-micro text-ink-400">
                                  {o.customer_phone}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <Badge tone={o.fulfillment_type === 'delivery' ? 'neutral' : 'warning'}>
                                  {o.fulfillment_type === 'delivery' ? (
                                    <Truck size={11} className="mr-1 inline" />
                                  ) : (
                                    <Building size={11} className="mr-1 inline" />
                                  )}
                                  {o.fulfillment_type}
                                </Badge>
                              </td>
                              <td className="whitespace-nowrap px-4 py-3 font-mono text-body-s font-semibold text-ink-950">
                                ₹{o.total_amount.toFixed(2)}
                              </td>
                              <td className="px-4 py-3">
                                <Badge tone={o.payment_status === 'PAID' ? 'success' : 'warning'}>
                                  {o.payment_status}
                                </Badge>
                              </td>
                              <td className="px-4 py-3">
                                <StatusPill status={o.order_status} />
                              </td>
                              <td className="px-4 py-3 text-right">
                                <Button variant="outline" size="sm" onClick={() => setSelectedOrder(o)}>
                                  Manage
                                </Button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={7} className="px-4 py-12 text-center text-body-s text-ink-500">
                              No orders found matching current criteria.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </Panel>
              </div>
            )}

            {/* ================= 2. PRODUCTS & IMAGES TAB ================= */}
            {activeTab === 'products' && (
              <div className="space-y-6">
                <Panel flush>
                  <PanelHead
                    title="Products & Storefront Images"
                    hint="All 8 press product lines. Click 'Edit Details' to change title, category, description, base unit, and choose or upload image."
                  />

                  <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
                    {products.map(p => (
                      <div
                        key={p.id}
                        className="flex flex-col justify-between rounded-xl border border-ink-200 bg-white p-4 shadow-sm transition-all hover:border-ink-300"
                      >
                        <div>
                          <div className="relative aspect-[16/10] overflow-hidden rounded-lg border border-ink-100 bg-ink-100">
                            <img
                              src={p.image_url}
                              alt={p.name}
                              className="h-full w-full object-cover"
                            />
                            <span
                              className={`absolute right-2 top-2 rounded-full px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider2 ${
                                p.is_active !== false
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-ink-800 text-ink-300'
                              }`}
                            >
                              {p.is_active !== false ? 'Active' : 'Hidden'}
                            </span>
                          </div>

                          <div className="mt-3.5">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h3 className="font-display text-body-l font-bold text-ink-950">{p.name}</h3>
                                <p className="font-mono text-micro uppercase tracking-wider2 text-ink-400">
                                  {p.category} · /{p.slug}
                                </p>
                              </div>
                            </div>
                            <p className="mt-2 line-clamp-2 text-body-s text-ink-600">
                              {p.description || 'No description set.'}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 border-t border-ink-100 pt-3">
                          {/* Inline Price editing */}
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center overflow-hidden rounded-md border border-ink-200 bg-white">
                              <span className="border-r border-ink-200 bg-ink-50 px-2 py-1 font-mono text-micro text-ink-500">
                                ₹
                              </span>
                              <input
                                type="number"
                                step="1"
                                value={editingBasePrices[p.slug] || 0}
                                onChange={e =>
                                  setEditingBasePrices(prev => ({
                                    ...prev,
                                    [p.slug]: parseFloat(e.target.value) || 0,
                                  }))
                                }
                                className="w-20 px-2 py-1 font-mono text-body-s font-semibold text-ink-950 focus:outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => handleUpdateBasePrice(p.slug)}
                                disabled={isSavingPrice}
                                className="border-l border-ink-200 bg-ink-50 px-2.5 py-1 font-mono text-micro font-medium text-ink-700 hover:bg-ink-950 hover:text-white"
                              >
                                Save
                              </button>
                            </div>

                            <span className="font-mono text-micro text-ink-400">{p.base_unit}</span>
                          </div>

                          {/* Direct Image Swap Rail */}
                          <div className="mt-3 rounded-lg border border-ink-200 bg-ink-50/70 p-2.5">
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-[10px] font-bold uppercase tracking-wider2 text-ink-600">
                                Quick Swap Image
                              </span>
                              <span className="font-mono text-[9px] text-ink-400">1-click studio preset</span>
                            </div>
                            <div className="mt-2 flex flex-wrap gap-1">
                              {AVAILABLE_IMAGES.slice(0, 8).map(img => (
                                <button
                                  key={img.path}
                                  type="button"
                                  onClick={() => handleQuickUpdateProductImage(p.slug, img.path)}
                                  title={`Switch ${p.name} to ${img.label}`}
                                  className={`rounded px-1.5 py-0.5 font-mono text-[9px] transition-colors ${
                                    p.image_url === img.path
                                      ? 'bg-ink-950 font-bold text-white shadow-xs'
                                      : 'bg-white text-ink-700 border border-ink-200 hover:bg-ink-200'
                                  }`}
                                >
                                  {img.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="mt-3 flex items-center gap-2">
                            <Button
                              variant="solid"
                              size="sm"
                              onClick={() => setEditingProduct(p)}
                              className="flex-1"
                            >
                              <Edit2 size={13} />
                              Edit Details & Image
                            </Button>
                            <button
                              type="button"
                              onClick={() => handleToggleProductActive(p.slug)}
                              title={p.is_active ? 'Deactivate from shop' : 'Activate in shop'}
                              className="rounded-md border border-ink-200 p-2 text-ink-600 transition-colors hover:bg-ink-100"
                            >
                              {p.is_active !== false ? (
                                <ToggleRight size={22} className="text-emerald-600" />
                              ) : (
                                <ToggleLeft size={22} className="text-ink-400" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Panel>
              </div>
            )}

            {/* ================= 3. HERO BANNERS TAB ================= */}
            {activeTab === 'banners' && (
              <div className="space-y-6">
                <Panel flush>
                  <PanelHead
                    title="Hero Carousel Banners"
                    hint="Edit rotating banners on the homepage. Change titles, starting chips, CTA links, and photography. Changes update immediately."
                    action={
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const newSlide: HeroSlideData = {
                              id: `banner-${Date.now()}`,
                              image: '/images/banner-signage.jpg',
                              eyebrow: 'Speciality · New',
                              title: 'Custom Printing Solutions',
                              body: 'Quality offset and digital printing dispatched in 24–48 hours.',
                              chip: { label: 'Starting at', value: '₹99' },
                              href: '/catalog',
                              cta: 'Order now',
                              href2: '/customize/custom-print',
                              cta2: 'Get quote',
                            };
                            setHeroSlides(prev => [...prev, newSlide]);
                          }}
                        >
                          <Plus size={14} /> Add Slide
                        </Button>
                        <Button
                          variant="solid"
                          size="sm"
                          onClick={handleSaveHeroBanners}
                          disabled={isSavingBanners}
                        >
                          <Check size={14} /> {isSavingBanners ? 'Saving...' : 'Save All Banners'}
                        </Button>
                      </div>
                    }
                  />

                  <div className="space-y-6 p-5">
                    {heroSlides.map((slide, idx) => (
                      <div
                        key={slide.id || idx}
                        className="rounded-xl border border-ink-200 bg-white p-5 shadow-sm"
                      >
                        <div className="flex items-center justify-between border-b border-ink-100 pb-3">
                          <div className="flex items-center gap-2">
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-ink-950 font-mono text-micro font-bold text-white">
                              {idx + 1}
                            </span>
                            <h4 className="font-display text-body font-bold text-ink-950">
                              Slide {idx + 1}: {slide.title || 'Untitled Banner'}
                            </h4>
                          </div>
                          {heroSlides.length > 1 && (
                            <button
                              type="button"
                              onClick={() => setHeroSlides(prev => prev.filter((_, i) => i !== idx))}
                              className="text-red-500 hover:text-red-700"
                              title="Delete slide"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>

                        <div className="mt-4 grid gap-5 lg:grid-cols-12">
                          {/* Image preview & selector */}
                          <div className="space-y-3 lg:col-span-4">
                            <label className="label-caps block">Banner Image</label>
                            <div className="relative aspect-[16/10] overflow-hidden rounded-lg border border-ink-200 bg-ink-100">
                              <img
                                src={slide.image}
                                alt={slide.title}
                                className="h-full w-full object-cover"
                              />
                            </div>
                            <input
                              type="text"
                              value={slide.image}
                              onChange={e => {
                                const val = e.target.value;
                                setHeroSlides(prev => {
                                  const copy = [...prev];
                                  copy[idx].image = val;
                                  return copy;
                                });
                              }}
                              placeholder="/images/banner-signage.jpg"
                              className="w-full rounded-md border border-ink-200 bg-ink-50 px-3 py-2 font-mono text-micro focus:border-ink-950 focus:bg-white focus:outline-none"
                            />
                            {/* Preset pills */}
                            <div className="flex flex-wrap gap-1.5">
                              {AVAILABLE_IMAGES.slice(0, 8).map(img => (
                                <button
                                  key={img.path}
                                  type="button"
                                  onClick={() => {
                                    setHeroSlides(prev => {
                                      const copy = [...prev];
                                      copy[idx].image = img.path;
                                      return copy;
                                    });
                                  }}
                                  className={`rounded px-2 py-0.5 font-mono text-[10px] transition-colors ${
                                    slide.image === img.path
                                      ? 'bg-ink-950 text-white'
                                      : 'bg-ink-100 text-ink-700 hover:bg-ink-200'
                                  }`}
                                >
                                  {img.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Slide Copy & Links */}
                          <div className="space-y-3 lg:col-span-8">
                            <div className="grid gap-3 sm:grid-cols-2">
                              <div>
                                <label className="label-caps block">Eyebrow Tagline</label>
                                <input
                                  type="text"
                                  value={slide.eyebrow}
                                  onChange={e => {
                                    const val = e.target.value;
                                    setHeroSlides(prev => {
                                      const copy = [...prev];
                                      copy[idx].eyebrow = val;
                                      return copy;
                                    });
                                  }}
                                  placeholder="Signage · priced by the foot"
                                  className="mt-1 w-full rounded-md border border-ink-200 px-3 py-1.5 text-body-s"
                                />
                              </div>
                              <div>
                                <label className="label-caps block">Starting Price Chip</label>
                                <div className="mt-1 flex gap-2">
                                  <input
                                    type="text"
                                    value={slide.chip?.label || 'Starting at'}
                                    onChange={e => {
                                      const val = e.target.value;
                                      setHeroSlides(prev => {
                                        const copy = [...prev];
                                        copy[idx].chip = {
                                          ...copy[idx].chip,
                                          label: val,
                                          value: copy[idx].chip?.value || '₹15/sqft',
                                        };
                                        return copy;
                                      });
                                    }}
                                    placeholder="Starting at"
                                    className="w-1/2 rounded-md border border-ink-200 px-3 py-1.5 font-mono text-micro"
                                  />
                                  <input
                                    type="text"
                                    value={slide.chip?.value || ''}
                                    onChange={e => {
                                      const val = e.target.value;
                                      setHeroSlides(prev => {
                                        const copy = [...prev];
                                        copy[idx].chip = {
                                          label: copy[idx].chip?.label || 'Starting at',
                                          value: val,
                                        };
                                        return copy;
                                      });
                                    }}
                                    placeholder="₹15/sqft"
                                    className="w-1/2 rounded-md border border-ink-200 px-3 py-1.5 font-mono text-micro font-bold text-ink-950"
                                  />
                                </div>
                              </div>
                            </div>

                            <div>
                              <label className="label-caps block">Headline Title</label>
                              <input
                                type="text"
                                value={slide.title}
                                onChange={e => {
                                  const val = e.target.value;
                                  setHeroSlides(prev => {
                                    const copy = [...prev];
                                    copy[idx].title = val;
                                    return copy;
                                  });
                                }}
                                placeholder="Flex banners from ₹15 a sq ft."
                                className="mt-1 w-full rounded-md border border-ink-200 px-3 py-1.5 font-display text-body font-bold text-ink-950"
                              />
                            </div>

                            <div>
                              <label className="label-caps block">Description Body</label>
                              <textarea
                                rows={2}
                                value={slide.body}
                                onChange={e => {
                                  const val = e.target.value;
                                  setHeroSlides(prev => {
                                    const copy = [...prev];
                                    copy[idx].body = val;
                                    return copy;
                                  });
                                }}
                                placeholder="Details about stock, finishes, dispatch speed…"
                                className="mt-1 w-full rounded-md border border-ink-200 px-3 py-1.5 text-body-s"
                              />
                            </div>

                            {/* Buttons */}
                            <div className="grid gap-3 sm:grid-cols-2">
                              <div>
                                <label className="label-caps block">Primary CTA (Text & Link)</label>
                                <div className="mt-1 flex gap-2">
                                  <input
                                    type="text"
                                    value={slide.cta}
                                    onChange={e => {
                                      const val = e.target.value;
                                      setHeroSlides(prev => {
                                        const copy = [...prev];
                                        copy[idx].cta = val;
                                        return copy;
                                      });
                                    }}
                                    placeholder="Shop signage"
                                    className="w-1/2 rounded-md border border-ink-200 px-3 py-1.5 text-body-s font-semibold"
                                  />
                                  <input
                                    type="text"
                                    value={slide.href}
                                    onChange={e => {
                                      const val = e.target.value;
                                      setHeroSlides(prev => {
                                        const copy = [...prev];
                                        copy[idx].href = val;
                                        return copy;
                                      });
                                    }}
                                    placeholder="/catalog?category=Signage"
                                    className="w-1/2 rounded-md border border-ink-200 px-3 py-1.5 font-mono text-micro"
                                  />
                                </div>
                              </div>
                              <div>
                                <label className="label-caps block">Secondary CTA (Optional)</label>
                                <div className="mt-1 flex gap-2">
                                  <input
                                    type="text"
                                    value={slide.cta2 || ''}
                                    onChange={e => {
                                      const val = e.target.value;
                                      setHeroSlides(prev => {
                                        const copy = [...prev];
                                        copy[idx].cta2 = val;
                                        return copy;
                                      });
                                    }}
                                    placeholder="Upload artwork"
                                    className="w-1/2 rounded-md border border-ink-200 px-3 py-1.5 text-body-s"
                                  />
                                  <input
                                    type="text"
                                    value={slide.href2 || ''}
                                    onChange={e => {
                                      const val = e.target.value;
                                      setHeroSlides(prev => {
                                        const copy = [...prev];
                                        copy[idx].href2 = val;
                                        return copy;
                                      });
                                    }}
                                    placeholder="/customize/flex-banners"
                                    className="w-1/2 rounded-md border border-ink-200 px-3 py-1.5 font-mono text-micro"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                    <div className="pt-2">
                      <Button
                        variant="solid"
                        size="lg"
                        onClick={handleSaveHeroBanners}
                        disabled={isSavingBanners}
                        className="w-full sm:w-auto"
                      >
                        <Check size={16} /> {isSavingBanners ? 'Saving Banners…' : 'Save Hero Banners'}
                      </Button>
                    </div>
                  </div>
                </Panel>
              </div>
            )}

            {/* ================= 4. PROMOS & OFFERS TAB ================= */}
            {activeTab === 'promos' && (
              <div className="space-y-6">
                {/* 1. Flash Sale & Countdown Ticker Controller (Start / Stop Sale) */}
                <Panel flush className="border-2 border-primary-500 bg-gradient-to-r from-primary-50/70 via-white to-primary-50/30">
                  <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`flex h-3 w-3 rounded-full ${
                            saleActive ? 'bg-red-500 animate-pulse' : 'bg-ink-300'
                          }`}
                        />
                        <h3 className="font-display text-title font-bold text-ink-950">
                          Storefront Flash Sale & Countdown Ticker
                        </h3>
                        <span
                          className={`rounded-full px-2.5 py-0.5 font-mono text-micro font-bold uppercase ${
                            saleActive ? 'bg-red-100 text-red-800' : 'bg-ink-200 text-ink-700'
                          }`}
                        >
                          {saleActive ? 'LIVE ON STOREFRONT' : 'STOPPED / HIDDEN'}
                        </span>
                      </div>
                      <p className="mt-1 text-body-s text-ink-600">
                        When active, a Flipkart-style live countdown timer strip appears at the top of the storefront. Stop anytime to hide it immediately.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleSale(!saleActive)}
                        disabled={isSavingSale}
                        className={`flex items-center gap-2 rounded-lg px-6 py-2.5 font-mono text-micro font-bold uppercase tracking-wider transition-all shadow-md ${
                          saleActive
                            ? 'bg-red-600 text-white hover:bg-red-700 active:scale-95'
                            : 'bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95'
                        }`}
                      >
                        {saleActive ? '🛑 Stop Sale' : '🔥 Start Sale Now'}
                      </button>
                    </div>
                  </div>

                  {/* Sale configuration fields */}
                  <div className="border-t border-ink-200 bg-white p-5">
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div>
                        <label className="label-caps block text-micro">Sale Badge Label</label>
                        <input
                          type="text"
                          value={saleBadge}
                          onChange={e => setSaleBadge(e.target.value)}
                          placeholder="Deal of the Day, Mega Sale..."
                          className="mt-1 w-full rounded-md border border-ink-200 px-3 py-1.5 font-mono text-micro font-bold"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="label-caps block text-micro">Sale Headline & Offer Text</label>
                        <input
                          type="text"
                          value={saleTitle}
                          onChange={e => setSaleTitle(e.target.value)}
                          placeholder="Up to 35% Bulk Discount on Business Cards & Flex Banners!"
                          className="mt-1 w-full rounded-md border border-ink-200 px-3 py-1.5 text-body-s font-semibold"
                        />
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <label className="label-caps text-micro">Timer Duration:</label>
                        <select
                          value={saleHours}
                          onChange={e => setSaleHours(e.target.value)}
                          className="rounded border border-ink-200 px-2 py-1 font-mono text-micro"
                        >
                          <option value="2">2 Hours</option>
                          <option value="4">4 Hours</option>
                          <option value="6">6 Hours</option>
                          <option value="12">12 Hours</option>
                          <option value="24">24 Hours</option>
                          <option value="48">48 Hours</option>
                        </select>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleSale(saleActive)}
                        disabled={isSavingSale}
                      >
                        <Check size={13} /> Save Sale Settings
                      </Button>
                    </div>
                  </div>
                </Panel>

                {/* 3-Card Mid-Page Promos */}
                <Panel flush>
                  <PanelHead
                    title="Mid-Page Promo Banners (3 Cards)"
                    hint="Highlight departments, specialty custom printing, or counter visits."
                    action={
                      <Button
                        variant="solid"
                        size="sm"
                        onClick={handleSavePromosAndOffers}
                        disabled={isSavingPromos}
                      >
                        <Check size={14} /> {isSavingPromos ? 'Saving...' : 'Save All Promos & Offers'}
                      </Button>
                    }
                  />

                  <div className="grid gap-5 p-5 md:grid-cols-3">
                    {promoList.map((promo, idx) => (
                      <div
                        key={promo.id || idx}
                        className="flex flex-col justify-between rounded-xl border border-ink-200 bg-white p-4 shadow-sm"
                      >
                        <div className="space-y-3">
                          <div className="relative aspect-[4/3] overflow-hidden rounded-lg border border-ink-200 bg-ink-100">
                            <img
                              src={promo.image}
                              alt={promo.title}
                              className="h-full w-full object-cover"
                            />
                          </div>

                          <div>
                            <label className="label-caps block text-micro">Image Path</label>
                            <input
                              type="text"
                              value={promo.image}
                              onChange={e => {
                                const val = e.target.value;
                                setPromoList(prev => {
                                  const copy = [...prev];
                                  copy[idx].image = val;
                                  return copy;
                                });
                              }}
                              className="w-full rounded border border-ink-200 px-2 py-1 font-mono text-micro"
                            />
                            <div className="mt-1 flex flex-wrap gap-1">
                              {AVAILABLE_IMAGES.slice(0, 5).map(img => (
                                <button
                                  key={img.path}
                                  type="button"
                                  onClick={() => {
                                    setPromoList(prev => {
                                      const copy = [...prev];
                                      copy[idx].image = img.path;
                                      return copy;
                                    });
                                  }}
                                  className="rounded bg-ink-100 px-1.5 py-0.5 text-[9px] hover:bg-ink-200"
                                >
                                  {img.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div>
                            <label className="label-caps block text-micro">Eyebrow</label>
                            <input
                              type="text"
                              value={promo.eyebrow}
                              onChange={e => {
                                const val = e.target.value;
                                setPromoList(prev => {
                                  const copy = [...prev];
                                  copy[idx].eyebrow = val;
                                  return copy;
                                });
                              }}
                              className="w-full rounded border border-ink-200 px-2 py-1 text-body-s"
                            />
                          </div>

                          <div>
                            <label className="label-caps block text-micro">Title</label>
                            <input
                              type="text"
                              value={promo.title}
                              onChange={e => {
                                const val = e.target.value;
                                setPromoList(prev => {
                                  const copy = [...prev];
                                  copy[idx].title = val;
                                  return copy;
                                });
                              }}
                              className="w-full rounded border border-ink-200 px-2 py-1 font-bold text-body-s"
                            />
                          </div>

                          <div>
                            <label className="label-caps block text-micro">Body</label>
                            <textarea
                              rows={2}
                              value={promo.body}
                              onChange={e => {
                                const val = e.target.value;
                                setPromoList(prev => {
                                  const copy = [...prev];
                                  copy[idx].body = val;
                                  return copy;
                                });
                              }}
                              className="w-full rounded border border-ink-200 px-2 py-1 text-body-s"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="label-caps block text-micro">CTA Text</label>
                              <input
                                type="text"
                                value={promo.cta}
                                onChange={e => {
                                  const val = e.target.value;
                                  setPromoList(prev => {
                                    const copy = [...prev];
                                    copy[idx].cta = val;
                                    return copy;
                                  });
                                }}
                                className="w-full rounded border border-ink-200 px-2 py-1 font-mono text-micro"
                              />
                            </div>
                            <div>
                              <label className="label-caps block text-micro">Link</label>
                              <input
                                type="text"
                                value={promo.href}
                                onChange={e => {
                                  const val = e.target.value;
                                  setPromoList(prev => {
                                    const copy = [...prev];
                                    copy[idx].href = val;
                                    return copy;
                                  });
                                }}
                                className="w-full rounded border border-ink-200 px-2 py-1 font-mono text-micro"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Panel>

                {/* Offer Tickets */}
                <Panel flush>
                  <PanelHead
                    title="Offer Tickets (4 Guarantee Badges)"
                    hint="Storefront promise cards: Pickup, Flat delivery, bulk tier discounts, proof verification."
                  />

                  <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
                    {offerList.map((offer, idx) => (
                      <div
                        key={offer.id || idx}
                        className="space-y-3 rounded-xl border border-dashed border-primary-300 bg-primary-50/40 p-4"
                      >
                        <span className="font-mono text-micro font-bold uppercase text-primary-700">
                          Ticket {idx + 1}
                        </span>

                        <div>
                          <label className="label-caps block text-micro">Title</label>
                          <input
                            type="text"
                            value={offer.title}
                            onChange={e => {
                              const val = e.target.value;
                              setOfferList(prev => {
                                const copy = [...prev];
                                copy[idx].title = val;
                                return copy;
                              });
                            }}
                            className="w-full rounded border border-ink-200 bg-white px-2 py-1 font-bold text-body-s"
                          />
                        </div>

                        <div>
                          <label className="label-caps block text-micro">Tag Ribbon</label>
                          <input
                            type="text"
                            value={offer.tag}
                            onChange={e => {
                              const val = e.target.value;
                              setOfferList(prev => {
                                const copy = [...prev];
                                copy[idx].tag = val;
                                return copy;
                              });
                            }}
                            placeholder="No code needed"
                            className="w-full rounded border border-ink-200 bg-white px-2 py-1 font-mono text-micro"
                          />
                        </div>

                        <div>
                          <label className="label-caps block text-micro">Body</label>
                          <textarea
                            rows={2}
                            value={offer.body}
                            onChange={e => {
                              const val = e.target.value;
                              setOfferList(prev => {
                                const copy = [...prev];
                                copy[idx].body = val;
                                return copy;
                              });
                            }}
                            className="w-full rounded border border-ink-200 bg-white px-2 py-1 text-body-s"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="label-caps block text-micro">CTA</label>
                            <input
                              type="text"
                              value={offer.cta}
                              onChange={e => {
                                const val = e.target.value;
                                setOfferList(prev => {
                                  const copy = [...prev];
                                  copy[idx].cta = val;
                                  return copy;
                                });
                              }}
                              className="w-full rounded border border-ink-200 bg-white px-2 py-1 font-mono text-micro"
                            />
                          </div>
                          <div>
                            <label className="label-caps block text-micro">Link</label>
                            <input
                              type="text"
                              value={offer.href}
                              onChange={e => {
                                const val = e.target.value;
                                setOfferList(prev => {
                                  const copy = [...prev];
                                  copy[idx].href = val;
                                  return copy;
                                });
                              }}
                              className="w-full rounded border border-ink-200 bg-white px-2 py-1 font-mono text-micro"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-ink-100 p-5">
                    <Button
                      variant="solid"
                      size="lg"
                      onClick={handleSavePromosAndOffers}
                      disabled={isSavingPromos}
                    >
                      <Check size={16} /> Save Promos & Offer Tickets
                    </Button>
                  </div>
                </Panel>
              </div>
            )}

            {/* ================= 5. PRICING RULES TAB ================= */}
            {activeTab === 'pricing' && (
              <Panel flush>
                <PanelHead
                  title="Option Pricing & Tier Surcharges"
                  hint="Set surcharges per unit for finishes/stocks, and bulk discount factors."
                  action={
                    <div>
                      <select
                        value={selectedProductSlug}
                        onChange={e => setSelectedProductSlug(e.target.value)}
                        className="h-9 rounded-md border border-ink-200 bg-white px-3 font-mono text-micro font-semibold uppercase tracking-wider2"
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
                          <section key={opt.id} className="space-y-3">
                            <h3 className="label-caps">
                              {opt.display_name} · <span className="text-ink-400">{opt.name}</span>
                            </h3>
                            <ul className="grid gap-2 sm:grid-cols-2">
                              {opt.options_json.map((choice, choiceIdx) => (
                                <li
                                  key={choice.value}
                                  className="flex items-center justify-between gap-3 rounded-md border border-ink-200 bg-white p-3 shadow-xs"
                                >
                                  <span className="truncate text-body-s font-medium text-ink-800">
                                    {choice.label}
                                  </span>
                                  <div className="flex items-center overflow-hidden rounded-md border border-ink-200">
                                    <span className="border-r border-ink-200 bg-ink-50 px-2 py-1 font-mono text-micro text-ink-500">
                                      ₹
                                    </span>
                                    <input
                                      type="number"
                                      value={choice.price_modifier || 0}
                                      onChange={e => {
                                        const val = parseFloat(e.target.value) || 0;
                                        setProductOptions(prev => {
                                          const copy = [...prev];
                                          copy[optIdx].options_json[choiceIdx].price_modifier = val;
                                          return copy;
                                        });
                                      }}
                                      className="w-16 px-2 py-1 text-right font-mono text-body-s font-semibold"
                                    />
                                  </div>
                                </li>
                              ))}
                            </ul>
                          </section>
                        );
                      })}

                      {pricingRules.length > 0 && (
                        <section className="space-y-3 pt-3">
                          <h3 className="label-caps">Quantity Discount Tiers</h3>
                          <ul className="divide-y divide-ink-200 rounded-md border border-ink-200 bg-white px-4">
                            {pricingRules.map((rule, ruleIdx) => (
                              <li key={rule.id} className="flex items-center justify-between py-3">
                                <span className="text-body-s text-ink-700">
                                  When <strong>{rule.option_key}</strong> is{' '}
                                  <strong>{rule.option_value}</strong> at{' '}
                                  <span className="font-mono font-bold text-ink-950">{rule.tier_min_qty}+ units</span>
                                </span>
                                <div className="flex items-center gap-3">
                                  <input
                                    type="number"
                                    step="0.05"
                                    min="0.5"
                                    max="1.0"
                                    value={rule.tier_discount_factor}
                                    onChange={e => {
                                      const val = parseFloat(e.target.value) || 1.0;
                                      setPricingRules(prev => {
                                        const copy = [...prev];
                                        copy[ruleIdx].tier_discount_factor = val;
                                        return copy;
                                      });
                                    }}
                                    className="w-16 rounded border border-ink-200 px-2 py-1 text-center font-mono text-body-s"
                                  />
                                  <span className="font-mono text-micro font-bold text-emerald-600">
                                    {Math.round((1 - rule.tier_discount_factor) * 100)}% off
                                  </span>
                                </div>
                              </li>
                            ))}
                          </ul>
                        </section>
                      )}

                      <Button onClick={handleSaveOptionModifiers} disabled={isSavingPrice} size="lg">
                        <Check size={16} /> Save Pricing Formulas
                      </Button>
                    </>
                  ) : (
                    <p className="text-body text-ink-500">
                      No additional options configured for this product.
                    </p>
                  )}
                </div>
              </Panel>
            )}

            {/* ================= 6. MASTER PASSWORD & SETTINGS TAB ================= */}
            {activeTab === 'settings' && (
              <div className="space-y-6">
                {/* Master Admin Password */}
                <Panel flush>
                  <PanelHead
                    title="Main Single Admin Password"
                    hint="A single shared master password controls access to this dashboard and admin login. Updating here takes effect immediately."
                  />

                  <div className="p-5 sm:max-w-xl">
                    <div className="space-y-4">
                      <div>
                        <label className="label-caps block">Master Access Password</label>
                        <div className="relative mt-2 flex items-center">
                          <input
                            type={showAdminPassword ? 'text' : 'password'}
                            value={adminPassword}
                            onChange={e => setAdminPassword(e.target.value)}
                            placeholder="Enter new admin password"
                            className="w-full rounded-md border border-ink-300 bg-white px-3.5 py-2.5 pr-12 font-mono text-body font-bold text-ink-950 focus:border-ink-950 focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => setShowAdminPassword(!showAdminPassword)}
                            className="absolute right-3 text-ink-400 hover:text-ink-700"
                            title={showAdminPassword ? 'Hide password' : 'Show password'}
                          >
                            {showAdminPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                        <p className="mt-2 text-body-s text-ink-500">
                          Current password is <code className="rounded bg-ink-200 px-1.5 py-0.5 font-mono text-micro font-bold text-ink-950">{adminPassword}</code>. You can change it to any new password anytime.
                        </p>
                      </div>

                      <Button
                        variant="solid"
                        size="md"
                        onClick={handleSaveMasterPassword}
                        disabled={isSavingPassword}
                      >
                        <ShieldCheck size={16} /> {isSavingPassword ? 'Updating Password...' : 'Save New Master Password'}
                      </Button>
                    </div>
                  </div>
                </Panel>

                {/* Announcement Bar & Contact Sections */}
                <Panel flush>
                  <PanelHead
                    title="Storefront Sections & Fulfillment Settings"
                    hint="Update the top announcement ticker, shop phone, WhatsApp, counter pickup address, and UPI ID."
                  />

                  <div className="space-y-5 p-5">
                    {/* Announcement Bar */}
                    <div className="rounded-xl border border-ink-200 bg-ink-50/50 p-4">
                      <h4 className="font-display text-body font-bold text-ink-950">Top Announcement Bar</h4>
                      <p className="mt-1 text-body-s text-ink-500">
                        Appears at the very top of all customer pages with truck icon.
                      </p>
                      <div className="mt-3 grid gap-3 sm:grid-cols-3">
                        <div className="sm:col-span-2">
                          <label className="label-caps block text-micro">Announcement Message</label>
                          <input
                            type="text"
                            value={announcementText}
                            onChange={e => setAnnouncementText(e.target.value)}
                            placeholder="Commercial printing press near Saket Metro · 24–48 hour dispatch…"
                            className="mt-1 w-full rounded-md border border-ink-200 bg-white px-3 py-2 text-body-s"
                          />
                        </div>
                        <div>
                          <label className="label-caps block text-micro">Target Link</label>
                          <input
                            type="text"
                            value={announcementLink}
                            onChange={e => setAnnouncementLink(e.target.value)}
                            placeholder="/catalog"
                            className="mt-1 w-full rounded-md border border-ink-200 bg-white px-3 py-2 font-mono text-micro"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Contact details */}
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      <div>
                        <label className="label-caps block">Shop Phone</label>
                        <input
                          type="text"
                          value={shopPhone}
                          onChange={e => setShopPhone(e.target.value)}
                          placeholder="09811427517"
                          className="mt-1 w-full rounded-md border border-ink-200 bg-white px-3 py-2 font-mono text-body-s"
                        />
                      </div>
                      <div>
                        <label className="label-caps block">WhatsApp Number (with country code)</label>
                        <input
                          type="text"
                          value={shopWhatsapp}
                          onChange={e => setShopWhatsapp(e.target.value)}
                          placeholder="919811427517"
                          className="mt-1 w-full rounded-md border border-ink-200 bg-white px-3 py-2 font-mono text-body-s"
                        />
                      </div>
                      <div>
                        <label className="label-caps block">UPI ID for Direct Transfers</label>
                        <input
                          type="text"
                          value={shopUpiId}
                          onChange={e => setShopUpiId(e.target.value)}
                          placeholder="09811427517@oksbi"
                          className="mt-1 w-full rounded-md border border-ink-200 bg-white px-3 py-2 font-mono text-body-s"
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="sm:col-span-2">
                        <label className="label-caps block">Store Pickup Physical Address</label>
                        <textarea
                          rows={2}
                          value={shopAddress}
                          onChange={e => setShopAddress(e.target.value)}
                          placeholder="F-298, Himmat Singh Marg, Near Saket Metro, Lado Sarai, New Delhi - 110030"
                          className="mt-1 w-full rounded-md border border-ink-200 bg-white px-3 py-2 text-body-s"
                        />
                      </div>
                      <div>
                        <label className="label-caps block">Flat Delivery Courier Charge (₹)</label>
                        <input
                          type="number"
                          value={deliveryCharge}
                          onChange={e => setDeliveryCharge(e.target.value)}
                          placeholder="50"
                          className="mt-1 w-full rounded-md border border-ink-200 bg-white px-3 py-2 font-mono text-body-s font-bold"
                        />
                      </div>
                    </div>

                    <div className="pt-2">
                      <Button
                        variant="solid"
                        size="lg"
                        onClick={handleSaveSiteSettings}
                        disabled={isSavingSettings}
                      >
                        <Check size={16} /> Save All Site Settings
                      </Button>
                    </div>
                  </div>
                </Panel>
              </div>
            )}
          </>
        )}
      </main>

      {/* ================= PRODUCT EDIT MODAL ================= */}
      {editingProduct && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-ink-950/70 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="animate-fade-rise max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-ink-200 bg-white shadow-2xl">
            <ColourStrip />
            <div className="flex items-center justify-between border-b border-ink-200 p-5">
              <div>
                <Badge tone="neutral">Product Editor</Badge>
                <h3 className="mt-1 font-display text-title font-bold text-ink-950">
                  Edit: {editingProduct.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="rounded p-1 text-ink-400 hover:bg-ink-100 hover:text-ink-950"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-5 p-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label-caps block">Product Name</label>
                  <input
                    type="text"
                    value={editingProduct.name}
                    onChange={e => setEditingProduct({ ...editingProduct, name: e.target.value })}
                    className="mt-1 w-full rounded-md border border-ink-200 px-3 py-2 text-body-s font-bold"
                  />
                </div>
                <div>
                  <label className="label-caps block">Category</label>
                  <input
                    type="text"
                    value={editingProduct.category}
                    onChange={e => setEditingProduct({ ...editingProduct, category: e.target.value })}
                    className="mt-1 w-full rounded-md border border-ink-200 px-3 py-2 text-body-s"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label-caps block">Base Price (₹)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={editingProduct.base_price}
                    onChange={e =>
                      setEditingProduct({
                        ...editingProduct,
                        base_price: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="mt-1 w-full rounded-md border border-ink-200 px-3 py-2 font-mono text-body font-bold text-ink-950"
                  />
                </div>
                <div>
                  <label className="label-caps block">Base Unit Quote</label>
                  <input
                    type="text"
                    value={editingProduct.base_unit}
                    onChange={e => setEditingProduct({ ...editingProduct, base_unit: e.target.value })}
                    placeholder="/ piece, / 100 pcs, / sq ft"
                    className="mt-1 w-full rounded-md border border-ink-200 px-3 py-2 font-mono text-body-s"
                  />
                </div>
              </div>

              {/* Image selector & preset picker */}
              <div className="space-y-3 rounded-lg border border-ink-200 bg-ink-50/60 p-4">
                <label className="label-caps block">Product Image</label>
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 flex-none overflow-hidden rounded-md border border-ink-200 bg-white">
                    <img
                      src={editingProduct.image_url}
                      alt={editingProduct.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <input
                      type="text"
                      value={editingProduct.image_url}
                      onChange={e =>
                        setEditingProduct({ ...editingProduct, image_url: e.target.value })
                      }
                      placeholder="/images/business-cards.jpg"
                      className="w-full rounded-md border border-ink-200 bg-white px-3 py-2 font-mono text-micro"
                    />
                  </div>
                </div>

                <div>
                  <span className="font-mono text-micro uppercase tracking-wider2 text-ink-400">
                    Quick Pick Photography:
                  </span>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {AVAILABLE_IMAGES.map(img => (
                      <button
                        key={img.path}
                        type="button"
                        onClick={() =>
                          setEditingProduct({ ...editingProduct, image_url: img.path })
                        }
                        className={`rounded px-2 py-1 font-mono text-micro transition-colors ${
                          editingProduct.image_url === img.path
                            ? 'bg-ink-950 text-white'
                            : 'bg-white text-ink-700 hover:bg-ink-200'
                        }`}
                      >
                        {img.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="label-caps block">Product Description</label>
                <textarea
                  rows={3}
                  value={editingProduct.description || ''}
                  onChange={e => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  className="mt-1 w-full rounded-md border border-ink-200 px-3 py-2 text-body-s leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-between border-t border-ink-100 pt-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingProduct.is_active !== false}
                    onChange={e =>
                      setEditingProduct({ ...editingProduct, is_active: e.target.checked })
                    }
                    className="h-4 w-4 rounded border-ink-300 text-ink-950"
                  />
                  <span className="text-body-s font-medium text-ink-800">
                    Active on Storefront
                  </span>
                </label>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setEditingProduct(null)}>
                    Cancel
                  </Button>
                  <Button
                    variant="solid"
                    size="sm"
                    onClick={handleSaveProductModal}
                    disabled={isSavingProduct}
                  >
                    <Check size={14} /> {isSavingProduct ? 'Saving…' : 'Save Product'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= ORDER DETAILS MODAL ================= */}
      {selectedOrder && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink-950/70 p-4 sm:p-8"
          role="dialog"
          aria-modal="true"
        >
          <div className="animate-fade-rise my-auto w-full max-w-5xl rounded-xl border border-ink-200 bg-white shadow-2xl">
            <ColourStrip />

            {/* Header */}
            <div className="flex items-start justify-between gap-4 border-b border-ink-200 p-5 sm:p-6">
              <div>
                <Badge tone="neutral">Order Inspection</Badge>
                <h2 className="mt-2 font-display text-title-l font-bold text-ink-950">
                  {selectedOrder.id}
                </h2>
                <p className="mt-1 font-mono text-body-s text-ink-500">
                  Placed {new Date(selectedOrder.created_at).toLocaleString('en-IN')}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge tone={selectedOrder.fulfillment_type === 'delivery' ? 'neutral' : 'warning'}>
                  {selectedOrder.fulfillment_type === 'delivery' ? (
                    <Truck size={12} className="mr-1 inline" />
                  ) : (
                    <Building size={12} className="mr-1 inline" />
                  )}
                  {selectedOrder.fulfillment_type}
                </Badge>
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="rounded p-1 text-ink-400 hover:bg-ink-100 hover:text-ink-950"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-12">
              {/* Left Column: Customer & Items */}
              <div className="space-y-6 lg:col-span-7">
                <section>
                  <h3 className="label-caps mb-3">Customer Information</h3>
                  <dl className="grid gap-2 sm:grid-cols-2 rounded-lg border border-ink-200 bg-ink-50 p-3.5">
                    <div className="flex items-center gap-2 text-body-s text-ink-800">
                      <User size={14} className="text-ink-400" />
                      <span className="font-semibold">{selectedOrder.customer_name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-body-s text-ink-800">
                      <Phone size={14} className="text-ink-400" />
                      <span className="font-mono font-medium">{selectedOrder.customer_phone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-body-s text-ink-800 sm:col-span-2">
                      <Notebook size={14} className="text-ink-400" />
                      <span>{selectedOrder.customer_email}</span>
                    </div>
                  </dl>
                </section>

                {selectedOrder.fulfillment_type === 'delivery' && (
                  <section>
                    <h3 className="label-caps mb-2">Delivery Address</h3>
                    <p className="rounded-lg border border-ink-200 bg-ink-50 p-3.5 text-body-s leading-relaxed text-ink-800">
                      {selectedOrder.delivery_address}, {selectedOrder.delivery_city},{' '}
                      {selectedOrder.delivery_state} — {selectedOrder.delivery_pincode}
                    </p>
                  </section>
                )}

                <section>
                  <h3 className="label-caps mb-3">Items Configured & Artwork</h3>
                  <div className="space-y-3">
                    {selectedOrder.items?.map(item => (
                      <article key={item.id} className="rounded-lg border border-ink-200 p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h4 className="font-display text-body font-bold text-ink-950">
                              {item.product_name}
                            </h4>
                            <p className="font-mono text-micro font-semibold uppercase tracking-wider2 text-ink-500">
                              {item.quantity} units
                            </p>
                          </div>
                          <span className="font-mono text-body font-bold text-ink-950">
                            ₹{item.total_price.toFixed(2)}
                          </span>
                        </div>

                        {/* Options pills */}
                        <ul className="mt-3 flex flex-wrap gap-1.5">
                          {Object.entries(item.selected_options).map(([k, v]) => (
                            <li
                              key={k}
                              className="rounded bg-ink-100 px-2 py-0.5 font-mono text-micro text-ink-700"
                            >
                              <span className="text-ink-400">{k}:</span> {v}
                            </li>
                          ))}
                        </ul>

                        {/* Files row */}
                        <div className="mt-4 grid gap-3 border-t border-ink-100 pt-4 sm:grid-cols-2">
                          <div>
                            <span className="label-caps block text-micro">Approved Proof</span>
                            <div className="mt-1.5 aspect-[4/3] overflow-hidden rounded-md border border-ink-200 bg-ink-100">
                              {item.preview_file_url ? (
                                <img
                                  src={item.preview_file_url}
                                  alt="Proof"
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <span className="flex h-full items-center justify-center font-mono text-micro text-ink-400">
                                  No visual proof
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-col justify-between">
                            <div>
                              <span className="label-caps block text-micro">Print File Download</span>
                              <p className="mt-1 font-mono text-micro text-ink-500">
                                Customer uploaded artwork
                              </p>
                            </div>
                            <div className="pt-3">
                              {item.original_file_url ? (
                                <a
                                  href={item.original_file_url}
                                  download={`${item.product_slug}-order-${selectedOrder.id}`}
                                  className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-ink-950 px-3 py-2.5 font-mono text-micro font-semibold uppercase tracking-wider2 text-white hover:bg-primary-600"
                                >
                                  <Download size={14} /> Download Original
                                </a>
                              ) : (
                                <span className="block rounded bg-ink-100 p-2 text-center font-mono text-micro text-ink-400">
                                  No file uploaded
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              </div>

              {/* Right Column: Financials & Status Management */}
              <div className="space-y-6 lg:col-span-5">
                <div className="rounded-lg border border-ink-200 bg-ink-50 p-4">
                  <dl className="divide-y divide-ink-200">
                    <SpecRow label="Subtotal" value={`₹${selectedOrder.subtotal.toFixed(2)}`} />
                    <SpecRow
                      label="Delivery"
                      value={
                        selectedOrder.delivery_charge > 0
                          ? `₹${selectedOrder.delivery_charge.toFixed(2)}`
                          : 'Free Pickup'
                      }
                    />
                    <SpecRow
                      label="Total Paid"
                      value={`₹${selectedOrder.total_amount.toFixed(2)}`}
                      strong
                      className="pt-2"
                    />
                  </dl>

                  <div className="mt-4 border-t border-ink-200 pt-3">
                    <div className="flex items-center justify-between">
                      <span className="label-caps">Payment State</span>
                      <Badge tone={selectedOrder.payment_status === 'PAID' ? 'success' : 'warning'}>
                        {selectedOrder.payment_status}
                      </Badge>
                    </div>
                    {selectedOrder.payment_id && (
                      <p className="mt-2 font-mono text-micro text-ink-600">
                        Txn / UTR: <span className="font-bold">{selectedOrder.payment_id}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Move to status buttons */}
                <div>
                  <h3 className="label-caps mb-2.5">Move Production Status</h3>
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
                      const isCurrent = selectedOrder.order_status === status;
                      return (
                        <button
                          key={status}
                          type="button"
                          disabled={isUpdatingStatus || isCurrent}
                          onClick={() =>
                            handleUpdateOrderStatus(selectedOrder.id, status as OrderStatus)
                          }
                          className={`rounded-md p-2.5 font-mono text-micro font-semibold uppercase tracking-wider2 transition-all ${
                            isCurrent
                              ? 'bg-ink-200 text-ink-400 cursor-default'
                              : status === 'CANCELLED'
                              ? 'border border-red-200 bg-white text-red-700 hover:bg-red-50'
                              : 'border border-ink-200 bg-white text-ink-800 hover:bg-ink-950 hover:text-white'
                          }`}
                        >
                          {status.replace(/_/g, ' ')}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Customer Notification Note */}
                <div>
                  <h3 className="label-caps mb-2">WhatsApp / Status Note</h3>
                  <textarea
                    rows={2}
                    value={statusUpdateNote}
                    onChange={e => setStatusUpdateNote(e.target.value)}
                    placeholder="e.g. Plates mounted, finishing in lamination..."
                    className="w-full rounded-md border border-ink-200 p-2.5 text-body-s"
                  />
                  <p className="mt-1 text-micro text-ink-400">
                    Recorded in order log and sent to customer on WhatsApp update.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
