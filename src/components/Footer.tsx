import React from 'react';
import Link from 'next/link';
import { Mail, Phone, MapPin, Printer, ShieldCheck } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-white font-extrabold text-lg">
              <div className="bg-primary-600 text-white p-1 rounded-md">
                <Printer size={16} />
              </div>
              <span>Print Vatika</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              New Delhi's premier commercial printing press. Premium business cards, flex banners, customized t-shirts, flyers, stickers, and specialty printing delivered right to your doorstep.
            </p>
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <ShieldCheck size={14} className="text-emerald-500" />
              <span>Razorpay Verified Safe Payments</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-bold text-white tracking-wider uppercase mb-4">Services</h3>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/catalog" className="hover:text-white transition-colors">
                  Product Catalog
                </Link>
              </li>
              <li>
                <Link href="/customize/business-cards" className="hover:text-white transition-colors">
                  Business Cards
                </Link>
              </li>
              <li>
                <Link href="/customize/t-shirts" className="hover:text-white transition-colors">
                  Custom Apparel
                </Link>
              </li>
              <li>
                <Link href="/customize/flex-banners" className="hover:text-white transition-colors">
                  Flex & Banner Signage
                </Link>
              </li>
            </ul>
          </div>

          {/* Business Hours */}
          <div>
            <h3 className="text-sm font-bold text-white tracking-wider uppercase mb-4">Press Hours</h3>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>Monday - Saturday: 9:00 AM - 8:00 PM</li>
              <li>Sunday: <span className="text-amber-500 font-semibold">Closed</span></li>
              <li className="pt-2 text-[10px] text-slate-500">Online orders accepted 24/7</li>
            </ul>
          </div>

          {/* Contact Details */}
          <div>
            <h3 className="text-sm font-bold text-white tracking-wider uppercase mb-4">Contact Us</h3>
            <ul className="space-y-3 text-xs">
              <li className="flex items-start gap-2">
                <MapPin size={16} className="text-primary-400 shrink-0 mt-0.5" />
                <span className="text-slate-400 leading-tight">
                  F-298, Himmat Singh Marg, Near Saket Metro, Lado Sarai, New Delhi - 110030
                </span>
              </li>
              <li className="flex items-center gap-2">
                <Phone size={16} className="text-primary-400 shrink-0" />
                <a href="tel:09811427517" className="text-slate-400 font-semibold hover:text-white transition-colors">
                  +91 98114 27517
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail size={16} className="text-primary-400 shrink-0" />
                <a href="mailto:orders@printvatika.com" className="text-slate-400 hover:text-white transition-colors">
                  orders@printvatika.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-800 text-center text-xs text-slate-500 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p>© {new Date().getFullYear()} Print Vatika. All rights reserved.</p>
          <div className="flex space-x-6 text-[11px]">
            <a href="/privacy.html" className="hover:text-slate-300 transition-colors">Privacy Policy</a>
            <a href="/terms.html" className="hover:text-slate-300 transition-colors">Terms of Service</a>
            <Link href="/admin/dashboard" className="hover:text-slate-300 font-medium transition-colors">
              Admin Portal
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
