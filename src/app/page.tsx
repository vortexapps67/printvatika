import React from 'react';
import Link from 'next/link';
import { DbClient } from '../lib/db';
import { ProductCard } from '../components/ProductCard';
import { Hero } from '@/components/ui/tailwind-css-background-snippet';
import {
  UploadCloud,
  LayoutGrid,
  ShoppingBag,
  Sparkles,
  Zap,
  Truck,
  CheckCircle,
  MessageSquare,
  HelpCircle,
  Printer,
  ChevronRight,
  Search
} from 'lucide-react';

export const revalidate = 0; // Disable caching to fetch fresh DB values

export default async function HomePage() {
  // Fetch active products directly on the server
  const products = await DbClient.getProducts();
  const popularProducts = products.slice(0, 4);

  const steps = [
    {
      icon: <LayoutGrid className="text-primary-600" size={24} />,
      title: 'Select Product',
      desc: 'Browse our catalog and select business cards, banners, t-shirts, flyers, or custom jobs.'
    },
    {
      icon: <UploadCloud className="text-primary-600" size={24} />,
      title: 'Customize & Upload',
      desc: 'Upload your JPG, PNG, or PDF and position it using our interactive design canvas editor.'
    },
    {
      icon: <ShoppingBag className="text-primary-600" size={24} />,
      title: 'Checkout & Pay',
      desc: 'Review live pricing summaries, choose delivery or store pickup, and pay securely via UPI/Card.'
    },
    {
      icon: <Truck className="text-primary-600" size={24} />,
      title: 'Printing & Fulfillment',
      desc: 'Get live status updates on WhatsApp as we print and deliver your order.'
    }
  ];

  const features = [
    {
      title: 'Super-Fast Turnaround',
      desc: 'Most items are printed and dispatched within 24-48 hours from our Jaipur press.',
      icon: <Zap size={20} className="text-indigo-500" />
    },
    {
      title: 'Indian Gateway (Razorpay)',
      desc: '100% secure payments via BHIM UPI, Google Pay, PhonePe, Cards, and Net Banking.',
      icon: <CheckCircle size={20} className="text-emerald-500" />
    },
    {
      title: 'Interactive Design Proofs',
      desc: 'Reposition and size your designs. See bleeding boundaries and warning prompts instantly.',
      icon: <Sparkles size={20} className="text-purple-500" />
    },
    {
      title: 'Fulfillment Choice',
      desc: 'Pick up for free directly from our Vatika shop, or opt for cheap home delivery across India.',
      icon: <Truck size={20} className="text-blue-500" />
    }
  ];

  const faqs = [
    {
      q: 'What file formats do you support?',
      a: 'We accept PNG, JPG, JPEG, and PDF files. For banners and cards, high-resolution PDFs or PNG files are highly recommended for the best printing sharpness.'
    },
    {
      q: 'How does the resolution validator work?',
      a: 'When you upload an image in the product customize editor, our system checks the resolution against standard 300 DPI print sizes. If your image pixel count is too low, we show a disclaimer warning, though you can still choose to proceed.'
    },
    {
      q: 'Can I pick up my order directly from the press?',
      a: 'Yes! During checkout, select "Store Pickup". You can collect it from our Vatika branch in Jaipur for free as soon as status goes to "READY".'
    },
    {
      q: 'Is my uploaded file saved in original quality?',
      a: 'Absolutely. The preview canvas is only a client-side visualization. We save your original high-quality file separately in our order files directory so our production operators print the exact file you uploaded.'
    }
  ];

  return (
    <div className="space-y-16 pb-20">
      {/* 1. Hero Section */}
      <Hero className="py-20 px-4 sm:px-6 lg:px-8 text-white">
        <div className="max-w-5xl mx-auto text-center space-y-6 relative z-10">
          <span className="inline-flex items-center gap-1.5 bg-primary-400/20 text-primary-200 border border-primary-400/30 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">
            <Sparkles size={12} /> Modern Indian Printing Press
          </span>
          
          <h1 className="font-serif text-4xl sm:text-6xl font-black tracking-tight leading-tight sm:leading-none">
            Print Anything,{' '}
            <span className="bg-gradient-to-r from-primary-200 via-primary-300 to-primary-400 bg-clip-text text-transparent">
              Easily.
            </span>
          </h1>
          
          <p className="text-slate-300 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
            Upload your designs, configure paper size, lamination, or shirt details, preview in 2D instantly, and receive high-quality prints with WhatsApp notifications.
          </p>

          {/* Hero Product Search Bar */}
          <form action="/catalog" method="GET" className="max-w-lg mx-auto pt-2">
            <div className="relative flex items-center">
              <Search className="absolute left-4 text-slate-400" size={18} />
              <input
                type="text"
                name="q"
                placeholder="Search products (visiting cards, banners, t-shirts, flyers)..."
                className="w-full pl-11 pr-24 py-3 bg-white/95 backdrop-blur-sm text-slate-900 placeholder-slate-400 rounded-xl shadow-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 transition-all"
              />
              <button
                type="submit"
                className="absolute right-2 bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg transition-colors shadow-sm"
              >
                Search
              </button>
            </div>
          </form>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-2">
            <Link
              href="/catalog"
              className="w-full sm:w-auto bg-primary-600 hover:bg-primary-700 text-white font-bold px-8 py-3.5 rounded-xl shadow-lg hover:shadow-primary-600/30 transition-all flex items-center justify-center gap-2"
            >
              Browse Products
              <ChevronRight size={16} />
            </Link>
            <Link
              href="/customize/custom-print"
              className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold px-8 py-3.5 rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <UploadCloud size={16} />
              Upload Custom Design
            </Link>
          </div>
        </div>
      </Hero>

      {/* 2. Popular Products Catalog Showcase */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="font-serif text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Popular Printing Products
            </h2>
            <p className="text-slate-500 text-xs sm:text-sm mt-1">
              Select a category to customize material specifications
            </p>
          </div>
          <Link
            href="/catalog"
            className="text-xs sm:text-sm text-primary-600 hover:text-primary-700 font-bold flex items-center gap-1 shrink-0"
          >
            View All Catalog
            <ChevronRight size={14} />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {popularProducts.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* 3. How It Works Workflow */}
      <section className="bg-slate-100/80 border-y border-slate-200 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-2">
            <h2 className="font-serif text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              How It Works
            </h2>
            <p className="text-slate-500 max-w-xl mx-auto text-xs sm:text-sm">
              We have simplified the custom printing workflow into four easy steps
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, idx) => (
              <div key={idx} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm relative space-y-3">
                <div className="absolute top-4 right-4 text-slate-200 font-black text-4xl">
                  0{idx + 1}
                </div>
                <div className="bg-primary-50 w-12 h-12 rounded-xl flex items-center justify-center">
                  {step.icon}
                </div>
                <h3 className="font-bold text-slate-900 text-base">{step.title}</h3>
                <p className="text-slate-500 text-xs leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Why Choose Us / Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-3 gap-12 items-center">
        <div className="space-y-4 lg:col-span-1">
          <h2 className="font-serif text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Why Choose Print Vatika?
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm leading-relaxed">
            We merge traditional printing craftsmanship with digital tools. View digital mockups before paying, and track every stage of printing from Jaipur.
          </p>
          <div className="pt-2">
            <div className="border-l-4 border-primary-600 pl-4 py-1 text-slate-600 text-xs italic">
              "Providing commercial-grade Flex printing and business cards to local Vatika Jaipur merchants since 2018."
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 lg:col-span-2">
          {features.map((feat, idx) => (
            <div key={idx} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-2">
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-slate-50 rounded-lg">
                  {feat.icon}
                </div>
                <h3 className="font-bold text-slate-900 text-sm">{feat.title}</h3>
              </div>
              <p className="text-slate-500 text-xs leading-relaxed pl-9">
                {feat.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Customer Reviews */}
      <section className="bg-primary-700 text-white py-16 px-4">
        <div className="max-w-7xl mx-auto space-y-10">
          <div className="text-center space-y-2">
            <h2 className="font-serif text-2xl sm:text-3xl font-black tracking-tight">What Our Customers Say</h2>
            <p className="text-primary-200 text-xs sm:text-sm">Verified feedback from shop owners and corporate clients</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-4">
              <div className="flex text-amber-400 gap-0.5">★ ★ ★ ★ ★</div>
              <p className="text-slate-300 text-xs italic leading-relaxed">
                "Ordered 500 double-sided matte business cards. The canvas tool let me adjust my logo perfectly. Verified payment server-side and got status updates on WhatsApp. Excellent quality cardstock."
              </p>
              <div>
                <h4 className="font-bold text-xs text-white">Rajesh Sharma</h4>
                <p className="text-[10px] text-primary-200">Proprietor, Sharma Sweets Jaipur</p>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-4">
              <div className="flex text-amber-400 gap-0.5">★ ★ ★ ★ ★</div>
              <p className="text-slate-300 text-xs italic leading-relaxed">
                "We print our shop banners and vinyl flex posters exclusively at Print Vatika. The pricing editor allows configuring exact foot dimensions. Very reliable and quick local shop!"
              </p>
              <div>
                <h4 className="font-bold text-xs text-white">Amit Choudhary</h4>
                <p className="text-[10px] text-primary-200">Director, Choudhary Electronics</p>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-4">
              <div className="flex text-amber-400 gap-0.5">★ ★ ★ ★ ★</div>
              <p className="text-slate-300 text-xs italic leading-relaxed">
                "Highly professional team. The custom cotton t-shirts print did not fade. Upload system works nicely on mobile. Standard delivery is ₹50 flat, which is very reasonable."
              </p>
              <div>
                <h4 className="font-bold text-xs text-white">Pooja Verma</h4>
                <p className="text-[10px] text-primary-200">Manager, Vatika Co-operative Bank</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5.5 Map Location Section */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <h2 className="font-serif text-2xl sm:text-3xl font-black text-slate-900 text-center tracking-tight">
          Visit Our Press Storefront
        </h2>
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
          <p className="text-slate-500 text-xs sm:text-sm mb-4">
            We are located in the Delhi/NCR region. Stop by to inspect card weights, examine lamination finishes, or collect pickup orders directly from the counter:
          </p>
          <div className="relative overflow-hidden w-full rounded-2xl border border-slate-200" style={{ paddingTop: '56.25%' }}>
            <iframe 
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2309.6171148141198!2d77.19263710887732!3d28.524512375622653!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390d1f42cbbc8423%3A0xdc29121a55f2f481!2sPrint%20Vatika!5e1!3m2!1sen!2sin!4v1787317523633!5m2!1sen!2sin" 
              className="absolute top-0 left-0 w-full h-full border-0" 
              allowFullScreen={true} 
              loading="lazy" 
              referrerPolicy="strict-origin-when-cross-origin"
            />
          </div>
        </div>
      </section>

      {/* 6. FAQs Section */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <h2 className="font-serif text-2xl sm:text-3xl font-black text-slate-900 text-center tracking-tight">
          Frequently Asked Questions
        </h2>

        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <div key={idx} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-1">
              <h3 className="font-bold text-slate-900 text-sm flex items-start gap-2">
                <HelpCircle size={16} className="text-primary-600 mt-0.5 shrink-0" />
                {faq.q}
              </h3>
              <p className="text-slate-500 text-xs leading-relaxed pl-6">
                {faq.a}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
