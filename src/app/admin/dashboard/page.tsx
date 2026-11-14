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
    <div className="min-h-screen bg-slate-950 pb-16 text-slate-100 antialiased selection:bg-primary-500 selection:text-white">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl border border-primary-500/40 bg-slate-900/95 px-5 py-3.5 font-mono text-xs font-semibold text-white shadow-2xl backdrop-blur-xl animate-fade-rise">
          <Sparkles size={16} className="text-primary-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header - Sleek Executive Navbar */}
      <header className="sticky top-0 z-40 border-b border-slate-800/90 bg-slate-950/90 backdrop-blur-xl shadow-lg">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-600 via-primary-500 to-indigo-600 font-black text-white shadow-lg shadow-primary-500/30">
              PV
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-extrabold text-base tracking-tight text-white">
                  PrintVatika
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live Press Console
                </span>
              </div>
              <p className="font-mono text-xs text-slate-400">Commercial Printing Control Plane</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700/80 bg-slate-900/70 px-3 py-1.5 font-mono text-xs font-medium text-slate-300 shadow-sm transition-all hover:border-slate-600 hover:bg-slate-800 hover:text-white disabled:opacity-50"
            >
              <RefreshCw size={13} className={isRefreshing ? 'animate-spin text-primary-400' : 'text-slate-400'} />
              <span className="hidden sm:inline">Sync Real-Time</span>
            </button>
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700/80 bg-slate-900/70 px-3 py-1.5 font-mono text-xs font-medium text-slate-300 shadow-sm transition-all hover:border-slate-600 hover:bg-slate-800 hover:text-white"
              title="Open storefront in new tab"
            >
              <ExternalLink size={13} className="text-slate-400" />
              <span className="hidden sm:inline">Storefront</span>
            </a>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 rounded-xl border border-red-500/30 bg-red-950/40 px-3 py-1.5 font-mono text-xs font-medium text-red-300 shadow-sm transition-all hover:bg-red-900/60 hover:text-white"
            >
              <LogOut size={13} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>

        {/* Tab Strip */}
        <div className="border-t border-slate-800/80 bg-slate-900/50 px-4 sm:px-6">
          <nav className="scrollbar-none mx-auto flex max-w-7xl space-x-1.5 overflow-x-auto py-2">
            {[
              { id: 'orders', label: 'Order Queue', count: orders.length, icon: ShoppingBag },
              { id: 'products', label: 'Products & Catalog', count: products.length, icon: ImageIcon },
              { id: 'banners', label: 'Hero Banners', icon: Sparkles },
              { id: 'promos', label: 'Promos & Offers', icon: Tag },
              { id: 'pricing', label: 'Pricing Rules', icon: Percent },
              { id: 'settings', label: 'Master Password', icon: KeyRound },
            ].map(tab => {
              const active = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex flex-none items-center gap-2 rounded-xl px-3.5 py-2 font-mono text-xs font-bold uppercase tracking-wider transition-all duration-150 ${
                    active
                      ? 'bg-gradient-to-r from-primary-600 to-indigo-600 text-white shadow-md shadow-primary-500/20'
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                  }`}
                >
                  <Icon size={14} className={active ? 'text-white' : 'text-slate-500'} />
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span
                      className={`ml-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        active ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-300'
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
                <dl className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
                  {[
                    { label: 'Total Orders', value: orders.length, icon: ShoppingBag, color: 'text-blue-600 bg-blue-50 border-blue-200/60' },
                    { label: 'Payment Pending', value: pendingOrders, icon: Clock, color: 'text-amber-600 bg-amber-50 border-amber-200/60' },
                    { label: 'In Production', value: inPressOrders, icon: Printer, color: 'text-emerald-600 bg-emerald-50 border-emerald-200/60' },
                    {
                      label: 'Press Volume',
                      value: `₹${totalRevenue.toLocaleString('en-IN')}`,
                      icon: TrendingUp,
                      color: 'text-purple-600 bg-purple-50 border-purple-200/60',
                    },
                  ].map(({ label, value, icon: Icon, color }) => (
                    <div key={label} className="rounded-2xl border border-ink-200/80 bg-white p-5 shadow-sm transition-all hover:shadow-md">
                      <div className="flex items-center justify-between">
                        <dt className="font-mono text-micro font-bold uppercase tracking-wider text-ink-500">{label}</dt>
                        <div className={`flex h-9 w-9 items-center justify-center rounded-xl border ${color}`}>
                          <Icon size={16} />
                        </div>
                      </div>
                      <dd className="mt-3">
                        <span className="font-display text-2xl sm:text-3xl font-extrabold text-ink-950">{value}</span>
                      </dd>
                    </div>
                  ))}
                </dl>

                {/* Queue Table */}
                <Panel dark flush>
                  <PanelHead
                    dark
                    title="Order Queue & Dispatch Control"
                    hint="Click 'Manage' to inspect uploaded artwork files, verify transaction, and advance order status."
                  />

                  {/* Search and Filters */}
                  <div className="flex flex-col gap-3 border-b border-slate-800/80 bg-slate-950/40 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="relative w-full sm:max-w-xs">
                      <Search
                        size={15}
                        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
                      />
                      <input
                        type="search"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Search ID, customer name or phone…"
                        className="w-full rounded-xl border border-slate-700/80 bg-slate-900/80 py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 shadow-inner focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
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
                              className={`flex-none rounded-xl px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-wider transition-all ${
                                active
                                  ? 'bg-gradient-to-r from-primary-600 to-indigo-600 text-white shadow-md shadow-primary-500/25'
                                  : 'border border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700 hover:text-white'
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
                        <tr className="border-b border-slate-800 bg-slate-950/80 font-mono text-[11px] font-bold uppercase tracking-wider text-slate-400">
                          <th className="px-4 py-3">Order ID</th>
                          <th className="px-4 py-3">Customer</th>
                          <th className="px-4 py-3">Fulfillment</th>
                          <th className="px-4 py-3">Total Amount</th>
                          <th className="px-4 py-3">Payment</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {filteredOrders.length > 0 ? (
                          filteredOrders.map(o => (
                            <tr key={o.id} className="transition-colors hover:bg-slate-800/40">
                              <td className="whitespace-nowrap px-4 py-3">
                                <span className="rounded-lg border border-primary-500/30 bg-primary-500/10 px-2 py-0.5 font-mono text-xs font-bold text-primary-400">
                                  #{o.id}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <span className="block text-xs font-bold text-white">
                                  {o.customer_name}
                                </span>
                                <span className="block font-mono text-[11px] text-slate-400">
                                  {o.customer_phone}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <span className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800/80 px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-slate-300">
                                  {o.fulfillment_type === 'delivery' ? (
                                    <Truck size={11} className="text-primary-400" />
                                  ) : (
                                    <Building size={11} className="text-amber-400" />
                                  )}
                                  {o.fulfillment_type}
                                </span>
                              </td>
                              <td className="whitespace-nowrap px-4 py-3 font-mono text-xs font-bold text-emerald-400">
                                ₹{o.total_amount.toFixed(2)}
                              </td>
                              <td className="px-4 py-3">
                                <span
                                  className={`inline-flex items-center rounded-full px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider ${
                                    o.payment_status === 'PAID'
                                      ? 'border border-emerald-500/30 bg-emerald-500/15 text-emerald-300'
                                      : 'border border-amber-500/30 bg-amber-500/15 text-amber-300'
                                  }`}
                                >
                                  {o.payment_status}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <span
                                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider ${
                                    o.order_status === 'CONFIRMED'
                                      ? 'border border-emerald-500/30 bg-emerald-500/15 text-emerald-300'
                                      : o.order_status === 'PRINTING'
                                      ? 'border border-cyan-500/30 bg-cyan-500/15 text-cyan-300 animate-pulse'
                                      : o.order_status === 'READY'
                                      ? 'border border-indigo-500/30 bg-indigo-500/15 text-indigo-300'
                                      : o.order_status === 'DELIVERED'
                                      ? 'border border-blue-500/30 bg-blue-500/15 text-blue-300'
                                      : 'border border-slate-700 bg-slate-800 text-slate-300'
                                  }`}
                                >
                                  {o.order_status.replace(/_/g, ' ')}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right">
                                <button
                                  type="button"
                                  onClick={() => setSelectedOrder(o)}
                                  className="rounded-xl border border-slate-700/80 bg-slate-800/80 px-3 py-1 font-mono text-xs font-bold text-slate-200 shadow-sm transition-all hover:border-primary-500 hover:bg-primary-600 hover:text-white"
                                >
                                  Manage
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={7} className="px-4 py-12 text-center font-mono text-xs text-slate-400">
                              No orders match the selected filter.
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
                <Panel dark flush>
                  <PanelHead
                    dark
                    title="Products & Storefront Images"
                    hint="All 8 commercial product lines. Change title, category, description, base unit, and choose studio photography."
                  />

                  <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
                    {products.map(p => (
                      <div
                        key={p.id}
                        className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-md transition-all hover:border-slate-700 hover:shadow-lg"
                      >
                        <div>
                          <div className="relative aspect-[16/10] overflow-hidden rounded-xl border border-slate-800 bg-slate-950">
                            <img
                              src={p.image_url}
                              alt={p.name}
                              className="h-full w-full object-cover"
                            />
                            <span
                              className={`absolute right-2.5 top-2.5 rounded-full px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider ${
                                p.is_active !== false
                                  ? 'border border-emerald-500/30 bg-emerald-500/20 text-emerald-300'
                                  : 'border border-slate-700 bg-slate-800 text-slate-400'
                              }`}
                            >
                              {p.is_active !== false ? 'Live on Store' : 'Hidden'}
                            </span>
                          </div>

                          <div className="mt-3.5">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h3 className="font-display text-base font-bold text-white">{p.name}</h3>
                                <p className="font-mono text-[11px] uppercase tracking-wider text-slate-400">
                                  {p.category} · /{p.slug}
                                </p>
                              </div>
                            </div>
                            <p className="mt-2 line-clamp-2 text-xs text-slate-400">
                              {p.description || 'No description set.'}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 border-t border-slate-800 pt-3">
                          {/* Inline Price editing */}
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center overflow-hidden rounded-xl border border-slate-700 bg-slate-950">
                              <span className="border-r border-slate-700 bg-slate-900 px-2.5 py-1.5 font-mono text-xs text-slate-400">
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
                                className="w-20 bg-transparent px-2.5 py-1.5 font-mono text-xs font-bold text-white focus:outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => handleUpdateBasePrice(p.slug)}
                                disabled={isSavingPrice}
                                className="border-l border-slate-700 bg-slate-800 px-3 py-1.5 font-mono text-xs font-bold text-slate-200 hover:bg-primary-600 hover:text-white transition-colors"
                              >
                                Save
                              </button>
                            </div>

                            <span className="font-mono text-xs text-slate-400">{p.base_unit}</span>
                          </div>

                          {/* Direct Image Swap Rail */}
                          <div className="mt-3 rounded-xl border border-slate-800 bg-slate-950/60 p-2.5">
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                Quick Swap Image
                              </span>
                              <span className="font-mono text-[10px] text-slate-500">1-click preset</span>
                            </div>
                            <div className="mt-2 flex flex-wrap gap-1">
                              {AVAILABLE_IMAGES.slice(0, 8).map(img => (
                                <button
                                  key={img.path}
                                  type="button"
                                  onClick={() => handleQuickUpdateProductImage(p.slug, img.path)}
                                  title={`Switch ${p.name} to ${img.label}`}
                                  className={`rounded-lg px-2 py-0.5 font-mono text-[10px] font-medium transition-colors ${
                                    p.image_url === img.path
                                      ? 'border border-primary-500/40 bg-primary-600 text-white font-bold'
                                      : 'border border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-700 hover:text-white'
                                  }`}
                                >
                                  {img.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="mt-3 flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setEditingProduct(p)}
                              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-700/80 bg-slate-800 px-3 py-2 font-mono text-xs font-bold text-white shadow-sm transition-all hover:bg-slate-700"
                            >
                              <Edit2 size={13} />
                              Edit Product
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleProductActive(p.slug)}
                              title={p.is_active !== false ? 'Hide from storefront' : 'Make live'}
                              className="rounded-xl border border-slate-700/80 bg-slate-800 p-2 text-slate-300 hover:bg-slate-700 hover:text-white transition-all"
                            >
                              {p.is_active !== false ? (
                                <ToggleRight size={18} className="text-emerald-400" />
                              ) : (
                                <ToggleLeft size={18} className="text-slate-500" />
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
                <Panel dark flush>
                  <PanelHead
                    dark
                    title="Main Single Admin Password"
                    hint="A single shared master password controls access to this dashboard and admin login. Updating here takes effect immediately."
                  />

                  <div className="p-5 sm:max-w-xl">
                    <div className="space-y-4">
                      <div>
                        <label className="mb-2 block font-mono text-xs font-bold uppercase tracking-wider text-slate-300">
                          Master Access Password
                        </label>
                        <div className="relative mt-2 flex items-center">
                          <input
                            type={showAdminPassword ? 'text' : 'password'}
                            value={adminPassword}
                            onChange={e => setAdminPassword(e.target.value)}
                            placeholder="Enter new admin password"
                            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 pr-12 font-mono text-sm font-bold text-white shadow-inner focus:border-primary-500 focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => setShowAdminPassword(!showAdminPassword)}
                            className="absolute right-3.5 text-slate-400 hover:text-slate-200"
                            title={showAdminPassword ? 'Hide password' : 'Show password'}
                          >
                            {showAdminPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                        <p className="mt-2 text-xs text-slate-400">
                          Current master key: <code className="rounded-lg border border-slate-700 bg-slate-800 px-2 py-0.5 font-mono text-xs font-bold text-primary-400">{adminPassword}</code>
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={handleSaveMasterPassword}
                        disabled={isSavingPassword}
                        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary-600 to-indigo-600 px-5 py-2.5 font-mono text-xs font-bold text-white shadow-md hover:from-primary-700 hover:to-indigo-700 disabled:opacity-50 transition-all"
                      >
                        <ShieldCheck size={16} /> {isSavingPassword ? 'Updating Password...' : 'Save New Master Password'}
                      </button>
                    </div>
                  </div>
                </Panel>

                {/* Announcement Bar & Contact Sections */}
                <Panel dark flush>
                  <PanelHead
                    dark
                    title="Storefront Sections & Fulfillment Settings"
                    hint="Update the top announcement ticker, shop phone, WhatsApp, counter pickup address, and UPI ID."
                  />

                  <div className="space-y-5 p-5">
                    {/* Announcement Bar */}
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
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
      {/* ================= PRODUCT EDITOR MODAL ================= */}
      {editingProduct && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/80 backdrop-blur-md p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="animate-fade-rise max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-slate-700/80 bg-slate-900/95 text-slate-100 shadow-2xl backdrop-blur-2xl">
            {/* Top colored strip */}
            <div className="h-1.5 w-full bg-gradient-to-r from-primary-600 via-indigo-600 to-emerald-500" />

            <div className="flex items-center justify-between border-b border-slate-800 p-5 sm:p-6">
              <div>
                <span className="rounded-full border border-primary-500/30 bg-primary-500/10 px-2.5 py-0.5 font-mono text-[11px] font-bold uppercase text-primary-400">
                  Product Details & Studio Image
                </span>
                <h3 className="mt-1 font-display text-xl font-bold text-white">
                  Edit: {editingProduct.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-5 p-5 sm:p-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block font-mono text-xs font-bold uppercase tracking-wider text-slate-300">
                    Product Title
                  </label>
                  <input
                    type="text"
                    value={editingProduct.name}
                    onChange={e => setEditingProduct({ ...editingProduct, name: e.target.value })}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 font-sans text-sm font-semibold text-white shadow-inner focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-mono text-xs font-bold uppercase tracking-wider text-slate-300">
                    Category Tag
                  </label>
                  <input
                    type="text"
                    value={editingProduct.category}
                    onChange={e => setEditingProduct({ ...editingProduct, category: e.target.value })}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 font-sans text-sm text-white shadow-inner focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block font-mono text-xs font-bold uppercase tracking-wider text-slate-300">
                    Base Price (₹)
                  </label>
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
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 font-mono text-sm font-bold text-emerald-400 shadow-inner focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-mono text-xs font-bold uppercase tracking-wider text-slate-300">
                    Unit Quote
                  </label>
                  <input
                    type="text"
                    value={editingProduct.base_unit}
                    onChange={e => setEditingProduct({ ...editingProduct, base_unit: e.target.value })}
                    placeholder="/ piece, / 100 pcs, / sq ft"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 font-mono text-xs text-white shadow-inner focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                </div>
              </div>

              {/* Image selector & preset picker */}
              <div className="space-y-3 rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                <label className="block font-mono text-xs font-bold uppercase tracking-wider text-slate-300">
                  Photography Asset
                </label>
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 flex-none overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
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
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-xs text-slate-300 focus:border-primary-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-400">
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
                        className={`rounded-lg px-2.5 py-1 font-mono text-[10px] font-medium transition-colors ${
                          editingProduct.image_url === img.path
                            ? 'border border-primary-500/50 bg-primary-600 text-white font-bold'
                            : 'border border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-700 hover:text-white'
                        }`}
                      >
                        {img.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-1 block font-mono text-xs font-bold uppercase tracking-wider text-slate-300">
                  Product Description
                </label>
                <textarea
                  rows={3}
                  value={editingProduct.description || ''}
                  onChange={e => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-xs leading-relaxed text-slate-200 shadow-inner focus:border-primary-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-between border-t border-slate-800 pt-4">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={editingProduct.is_active !== false}
                    onChange={e =>
                      setEditingProduct({ ...editingProduct, is_active: e.target.checked })
                    }
                    className="h-4 w-4 rounded border-slate-700 bg-slate-950 text-primary-600 focus:ring-primary-500/20"
                  />
                  <span className="font-mono text-xs font-semibold text-slate-300">
                    Live on Consumer Storefront
                  </span>
                </label>

                <div className="flex gap-2.5">
                  <button
                    type="button"
                    onClick={() => setEditingProduct(null)}
                    className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 font-mono text-xs font-bold text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveProductModal}
                    disabled={isSavingProduct}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-primary-600 to-indigo-600 px-4 py-2 font-mono text-xs font-bold text-white shadow-md hover:from-primary-700 hover:to-indigo-700 disabled:opacity-50 transition-all"
                  >
                    <Check size={14} /> {isSavingProduct ? 'Saving…' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= ORDER DETAILS MODAL ================= */}
      {selectedOrder && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/80 backdrop-blur-md p-4 sm:p-8"
          role="dialog"
          aria-modal="true"
        >
          <div className="animate-fade-rise my-auto w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-700/80 bg-slate-900/95 text-slate-100 shadow-2xl backdrop-blur-2xl">
            {/* Top colored strip */}
            <div className="h-1.5 w-full bg-gradient-to-r from-primary-600 via-indigo-600 to-emerald-500" />

            {/* Header */}
            <div className="flex items-start justify-between gap-4 border-b border-slate-800 p-5 sm:p-6">
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full border border-primary-500/30 bg-primary-500/10 px-2.5 py-0.5 font-mono text-[11px] font-bold uppercase text-primary-400">
                    Order Inspection
                  </span>
                  <span className="rounded-full border border-slate-700 bg-slate-800 px-2.5 py-0.5 font-mono text-[11px] font-semibold text-slate-300">
                    {selectedOrder.fulfillment_type === 'delivery' ? 'Courier Delivery' : 'Store Pickup'}
                  </span>
                </div>
                <h2 className="mt-2.5 font-display text-2xl sm:text-3xl font-extrabold text-white">
                  #{selectedOrder.id}
                </h2>
                <p className="mt-1 font-mono text-xs text-slate-400">
                  Placed on {new Date(selectedOrder.created_at).toLocaleString('en-IN')}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
                  aria-label="Close dialog"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-12">
              {/* Left Column: Customer & Items */}
              <div className="space-y-6 lg:col-span-7">
                <section>
                  <h3 className="mb-2.5 font-mono text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Customer Information
                  </h3>
                  <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                    <dl className="grid gap-2.5 sm:grid-cols-2">
                      <div className="flex items-center gap-2 text-xs text-slate-200">
                        <User size={15} className="text-primary-400 shrink-0" />
                        <span className="font-bold text-white">{selectedOrder.customer_name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-200">
                        <Phone size={15} className="text-emerald-400 shrink-0" />
                        <span className="font-mono font-medium">{selectedOrder.customer_phone}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-200 sm:col-span-2">
                        <Notebook size={15} className="text-slate-400 shrink-0" />
                        <span>{selectedOrder.customer_email}</span>
                      </div>
                    </dl>

                    {/* WhatsApp Action */}
                    {selectedOrder.customer_phone && (
                      <div className="mt-3.5 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                        <span className="text-[11px] font-mono text-slate-400">Quick Contact</span>
                        <a
                          href={`https://wa.me/91${selectedOrder.customer_phone.replace(/\D/g, '').slice(-10)}?text=${encodeURIComponent(`Hello ${selectedOrder.customer_name}, regards from Print Vatika regarding Order #${selectedOrder.id}.`)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-3 py-1 font-mono text-xs font-bold text-emerald-300 hover:bg-emerald-500/25 transition-colors"
                        >
                          <Phone size={12} />
                          <span>WhatsApp Customer</span>
                        </a>
                      </div>
                    )}
                  </div>
                </section>

                {selectedOrder.fulfillment_type === 'delivery' && (
                  <section>
                    <h3 className="mb-2 font-mono text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Delivery Address
                    </h3>
                    <p className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3.5 font-mono text-xs leading-relaxed text-slate-300">
                      <Truck size={14} className="inline mr-2 text-primary-400" />
                      {selectedOrder.delivery_address}, {selectedOrder.delivery_city},{' '}
                      {selectedOrder.delivery_state} — {selectedOrder.delivery_pincode}
                    </p>
                  </section>
                )}

                <section>
                  <h3 className="mb-2.5 font-mono text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Configured Items & Artwork Proof
                  </h3>
                  <div className="space-y-3.5">
                    {selectedOrder.items?.map(item => (
                      <article key={item.id} className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h4 className="font-display text-sm font-bold text-white">
                              {item.product_name}
                            </h4>
                            <p className="font-mono text-xs font-bold text-primary-400">
                              {item.quantity} units
                            </p>
                          </div>
                          <span className="font-mono text-sm font-bold text-emerald-400">
                            ₹{item.total_price.toFixed(2)}
                          </span>
                        </div>

                        {/* Options pills */}
                        <ul className="mt-3 flex flex-wrap gap-1.5">
                          {Object.entries(item.selected_options).map(([k, v]) => (
                            <li
                              key={k}
                              className="rounded-lg border border-slate-800 bg-slate-900 px-2 py-0.5 font-mono text-[11px] text-slate-300"
                            >
                              <span className="text-slate-500">{k}:</span> {v}
                            </li>
                          ))}
                        </ul>

                        {/* Files row */}
                        <div className="mt-4 grid gap-3 border-t border-slate-800/80 pt-3.5 sm:grid-cols-2">
                          <div>
                            <span className="block font-mono text-[10px] font-bold uppercase tracking-wider text-slate-400">
                              Approved Visual Proof
                            </span>
                            <div className="mt-1.5 aspect-[4/3] overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
                              {item.preview_file_url ? (
                                <img
                                  src={item.preview_file_url}
                                  alt="Proof"
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <span className="flex h-full items-center justify-center font-mono text-xs text-slate-500">
                                  No visual proof
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-col justify-between">
                            <div>
                              <span className="block font-mono text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                Original Print Artwork
                              </span>
                              <p className="mt-1 font-mono text-xs text-slate-400">
                                High-res file uploaded by buyer
                              </p>
                            </div>
                            <div className="pt-3">
                              {item.original_file_url ? (
                                <a
                                  href={item.original_file_url}
                                  download={`${item.product_slug}-order-${selectedOrder.id}`}
                                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary-600 to-indigo-600 px-3 py-2.5 font-mono text-xs font-bold text-white shadow-md hover:from-primary-700 hover:to-indigo-700 transition-all"
                                >
                                  <Download size={14} /> Download File
                                </a>
                              ) : (
                                <span className="block rounded-xl border border-slate-800 bg-slate-900 p-2.5 text-center font-mono text-xs text-slate-500">
                                  No artwork uploaded
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
                <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                  <div className="space-y-2 font-mono text-xs">
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Subtotal</span>
                      <span>₹{selectedOrder.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Delivery</span>
                      <span>
                        {selectedOrder.delivery_charge > 0
                          ? `₹${selectedOrder.delivery_charge.toFixed(2)}`
                          : 'Free Pickup'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-t border-slate-800 pt-2 text-sm font-bold text-white">
                      <span>Total Amount</span>
                      <span className="text-emerald-400">₹{selectedOrder.total_amount.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="mt-4 border-t border-slate-800 pt-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs text-slate-400">Payment Status</span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider ${
                          selectedOrder.payment_status === 'PAID'
                            ? 'border border-emerald-500/30 bg-emerald-500/15 text-emerald-300'
                            : 'border border-amber-500/30 bg-amber-500/15 text-amber-300'
                        }`}
                      >
                        {selectedOrder.payment_status}
                      </span>
                    </div>
                    {selectedOrder.payment_id && (
                      <p className="mt-2 font-mono text-[11px] text-slate-400">
                        Txn / UTR: <span className="font-bold text-slate-200">{selectedOrder.payment_id}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Move to status buttons */}
                <div>
                  <h3 className="mb-2 font-mono text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Advance Production Status
                  </h3>
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
                          className={`rounded-xl p-2.5 font-mono text-xs font-bold uppercase tracking-wider transition-all ${
                            isCurrent
                              ? 'border border-primary-500/40 bg-primary-500/20 text-primary-300 shadow-sm cursor-default'
                              : status === 'CANCELLED'
                              ? 'border border-red-500/30 bg-red-950/40 text-red-300 hover:bg-red-900/60'
                              : 'border border-slate-800 bg-slate-800/80 text-slate-300 hover:border-slate-600 hover:bg-slate-700 hover:text-white'
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
                  <h3 className="mb-2 font-mono text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    WhatsApp Status Note
                  </h3>
                  <textarea
                    rows={2}
                    value={statusUpdateNote}
                    onChange={e => setStatusUpdateNote(e.target.value)}
                    placeholder="e.g. Plates mounted, finishing in lamination..."
                    className="w-full rounded-2xl border border-slate-800 bg-slate-950/80 p-3 font-mono text-xs text-white placeholder-slate-500 shadow-inner focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                  <p className="mt-1 font-mono text-[11px] text-slate-500">
                    Recorded in press timeline and dispatched on WhatsApp update.
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
