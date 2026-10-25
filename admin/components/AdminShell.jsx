'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Users,
  Layers,
  Settings,
  ExternalLink,
  Menu,
  X,
  Search,
  Bell,
  CheckCircle2,
  Database,
  ArrowUpRight,
  Plus,
} from 'lucide-react';

export default function AdminShell({ children, onNewProductClick }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dbHealthy, setDbHealthy] = useState(true);
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const navLinks = [
    { label: 'Overview', href: '/', icon: LayoutDashboard },
    { label: 'Orders', href: '/orders', icon: ShoppingBag },
    { label: 'Products', href: '/products', icon: Package },
    { label: 'Customers', href: '/customers', icon: Users },
    { label: 'Inventory', href: '/inventory', icon: Layers },
    { label: 'Settings', href: '/settings', icon: Settings },
  ];

  const getPageTitle = () => {
    if (pathname === '/') return 'Executive Overview';
    if (pathname.startsWith('/orders')) return 'Orders & Fulfillment';
    if (pathname.startsWith('/products')) return 'Product Catalog';
    if (pathname.startsWith('/customers')) return 'Customer CRM';
    if (pathname.startsWith('/inventory')) return 'Inventory Matrix';
    if (pathname.startsWith('/settings')) return 'System & Database';
    return 'Operations Control';
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col md:flex-row font-['Helvetica_Now_Text',sans-serif]">
      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between px-5 h-16 bg-[#111111] text-white sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 -ml-1.5 text-white/80 hover:text-white"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="flex items-center gap-2">
            <span className="font-bold text-[18px] tracking-tight">SONU</span>
            <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-white/10 text-white/70">
              Admin
            </span>
          </div>
        </div>

        <a
          href="http://localhost:3000"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-[12px] text-white/70 hover:text-white"
        >
          <span>Store</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-[260px] bg-[#111111] text-white shrink-0 sticky top-0 h-screen border-r border-[#222222]">
        {/* Brand Header */}
        <div className="px-6 py-6 border-b border-[#222222] flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-[22px] tracking-tight">SONU</span>
              <span className="text-[11px] font-medium tracking-wide uppercase px-2 py-0.5 rounded-full bg-white/10 text-neutral-300">
                Ops v1.0
              </span>
            </div>
            <p className="text-[12px] text-neutral-400 mt-0.5 tracking-normal">
              Footwear Control Plane
            </p>
          </div>
        </div>

        {/* Database Status Pill */}
        <div className="px-6 pt-5 pb-2">
          <div className="flex items-center justify-between px-3 py-2 rounded-[10px] bg-[#1a1a1a] border border-[#282828]">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[12px] font-medium text-neutral-300">MongoDB</span>
            </div>
            <span className="text-[11px] text-emerald-400 font-medium">sonu_shoes</span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto scrollbar-none">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3.5 px-3.5 py-3 rounded-[12px] text-[14px] font-medium transition-all ${
                  isActive
                    ? 'bg-white text-[#111111] shadow-sm'
                    : 'text-neutral-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#111111]' : 'text-neutral-400'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom Store Link & Time */}
        <div className="p-4 border-t border-[#222222] space-y-3">
          <a
            href="http://localhost:3000"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between px-3.5 py-2.5 rounded-[10px] bg-[#1a1a1a] hover:bg-[#252525] text-neutral-300 hover:text-white text-[13px] font-medium transition-colors group"
          >
            <span className="flex items-center gap-2">
              <ExternalLink className="w-3.5 h-3.5 text-neutral-400 group-hover:text-white" />
              <span>Live Storefront</span>
            </span>
            <span className="text-[11px] text-neutral-500 font-mono">:3000</span>
          </a>

          <div className="flex items-center justify-between px-1 text-[11px] text-neutral-500">
            <span>IST (Local)</span>
            <span className="font-mono text-neutral-400">{currentTime || 'Live'}</span>
          </div>
        </div>
      </aside>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/60"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-[280px] bg-[#111111] text-white h-full flex flex-col p-6 z-10 shadow-2xl">
            <div className="flex items-center justify-between pb-6 border-b border-[#222222]">
              <span className="font-bold text-[20px]">SONU Ops</span>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 text-neutral-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 py-6 space-y-1.5">
              {navLinks.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3.5 px-3.5 py-3 rounded-[12px] text-[15px] font-medium ${
                      isActive ? 'bg-white text-[#111111]' : 'text-neutral-400'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <a
              href="http://localhost:3000"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 py-3 rounded-full bg-white text-[#111111] font-medium text-[14px]"
            >
              <span>Go to Storefront</span>
              <ArrowUpRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      )}

      {/* Main Content Container */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#f9fafb]">
        {/* Top Desktop Navigation Bar (Hidden on /orders to render dedicated Shiprocket header) */}
        {!pathname.startsWith('/orders') && (
          <header className="hidden md:flex items-center justify-between px-8 h-20 bg-white border-b border-neutral-200/80 sticky top-0 z-30">
            <div>
              <div className="flex items-center gap-2 text-[13px] text-neutral-400 font-normal">
                <span>SONU</span>
                <span>/</span>
                <span className="text-neutral-700 capitalize">
                  {pathname === '/' ? 'Dashboard' : pathname.replace('/', '')}
                </span>
              </div>
              <h1 className="text-[20px] font-bold text-[#111111] tracking-tight leading-tight mt-0.5">
                {getPageTitle()}
              </h1>
            </div>

            <div className="flex items-center gap-4">
              <Link
                href="/products?action=new"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#111111] hover:bg-black text-white text-[13px] font-medium transition-all shadow-sm active:scale-[0.98] cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Drop</span>
              </Link>

              <div className="flex items-center gap-3 pl-2 border-l border-neutral-200">
                <div className="w-9 h-9 rounded-full bg-[#111111] text-white flex items-center justify-center text-[13px] font-bold tracking-tight">
                  AD
                </div>
                <div className="text-left hidden lg:block">
                  <p className="text-[13px] font-semibold text-[#111111] leading-none">Admin</p>
                  <p className="text-[11px] text-neutral-400 mt-0.5 leading-none">Operations Lead</p>
                </div>
              </div>
            </div>
          </header>
        )}

        {/* Page Content */}
        <main className={`flex-1 ${pathname.startsWith('/orders') ? 'p-4 sm:p-6 w-full' : 'p-5 sm:p-7 lg:p-8 max-w-[1440px] w-full mx-auto'}`}>
          {children}
        </main>
      </div>
    </div>
  );
}
