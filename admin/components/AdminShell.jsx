'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Users,
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
  SlidersHorizontal,
  BarChart3,
  Eye,
  LogOut,
  UserCheck,
} from 'lucide-react';

export default function AdminShell({ children, onNewProductClick }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dbHealthy, setDbHealthy] = useState(true);
  const [currentTime, setCurrentTime] = useState('');
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Read user from localStorage or cookie
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('sonu_admin_user');
      if (stored) {
        setUser(stored);
      } else {
        fetch('/api/auth')
          .then((r) => r.json())
          .then((d) => {
            if (d.authenticated && d.user) {
              setUser(d.user);
              localStorage.setItem('sonu_admin_user', d.user);
            }
          })
          .catch(() => {});
      }
    }
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth', { method: 'DELETE' });
    } catch {}
    if (typeof window !== 'undefined') {
      localStorage.removeItem('sonu_admin_user');
      document.cookie = 'sonu_admin_user=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
      window.location.href = '/login';
    }
  };

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
    { label: 'Orders', href: '/orders', icon: ShoppingBag },
    { label: 'Products', href: '/products', icon: Package },
    { label: 'Edit', href: '/edit', icon: SlidersHorizontal },
    { label: 'Overview', href: '/overview', icon: LayoutDashboard },
    { label: 'Analytics', href: '/analytics', icon: BarChart3 },
    { label: 'Customers', href: '/customers', icon: Users },
    { label: 'Settings', href: '/settings', icon: Settings },
  ];

  const getPageTitle = () => {
    if (pathname.startsWith('/orders')) return 'Orders';
    if (pathname.startsWith('/products')) return 'Products';
    if (pathname.startsWith('/edit')) return 'Edit Content';
    if (pathname.startsWith('/overview')) return 'Overview';
    if (pathname.startsWith('/analytics') || pathname.startsWith('/views')) return 'Analytics';
    if (pathname.startsWith('/customers')) return 'Customers';
    if (pathname.startsWith('/settings')) return 'Settings';
    return 'Admin';
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
          <img
            src="/Logo/Logo_Full_white.png"
            alt="Sonu Shoe"
            className="h-6 w-auto object-contain"
          />
        </div>

        {/* <a
          href="http://localhost:3000"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-[12px] text-white/70 hover:text-white"
        >
          <span>Store</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a> */}
      </header>

      {/* Desktop Sidebar Wrapper (Keeps layout width constant at 68px so page doesn't shift) */}
      <div className="hidden md:block w-[68px] shrink-0">
        <aside className="group fixed top-0 left-0 h-screen w-[68px] hover:w-[240px] transition-all duration-300 ease-in-out bg-[#111111] text-white z-40 border-r border-[#222222] flex flex-col overflow-hidden">
          {/* Brand Header */}
          <div className="h-16 flex items-center px-4 border-b border-[#222222] shrink-0 overflow-hidden whitespace-nowrap">
            <img
              src="/favicon.ico"
              alt="SONU"
              className="w-9 h-9 rounded-xl object-contain shrink-0"
            />
            <div className="ml-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <img
                src="/Logo/Logo_Full_white.png"
                alt="Sonu Shoe"
                className="h-6 w-auto object-contain"
              />
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-2.5 py-2 space-y-1 overflow-y-auto overflow-x-hidden scrollbar-none">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={item.label}
                  className={`flex items-center h-11 px-2 rounded-xl text-[14px] font-medium transition-all whitespace-nowrap overflow-hidden ${
                    isActive
                      ? 'bg-white text-[#111111]'
                      : 'text-neutral-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <div className="w-7 flex items-center justify-center shrink-0">
                    <Icon className={`w-5 h-5 ${isActive ? 'text-[#111111]' : 'text-neutral-400'}`} />
                  </div>
                  <span className="ml-2.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </nav>

          {/* Bottom Store Link & Time */}
          <div className="p-2.5 border-t border-[#222222] space-y-2 shrink-0 overflow-hidden">
            <a
              href="http://localhost:3000"
              target="_blank"
              rel="noopener noreferrer"
              title="Live Storefront (:3000)"
              className="flex items-center h-10 px-2 rounded-[10px] bg-[#1a1a1a] hover:bg-[#252525] text-neutral-300 hover:text-white text-[13px] font-medium transition-colors whitespace-nowrap overflow-hidden"
            >
              <div className="w-7 flex items-center justify-center shrink-0">
                <ExternalLink className="w-4 h-4 text-neutral-400" />
              </div>
              <div className="ml-2.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-between flex-1">
                <span>Storefront</span>
                <span className="text-[10px] text-neutral-500">:3000</span>
              </div>
            </a>

            <div
              className="h-7 flex items-center px-2 text-[11px] text-neutral-500 whitespace-nowrap overflow-hidden"
              title={`IST (Local): ${currentTime || 'Live'}`}
            >
              <div className="w-7 flex items-center justify-center shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-neutral-600" />
              </div>
              <div className="ml-2.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-between flex-1">
                <span>IST</span>
                <span className="text-neutral-400">{currentTime || 'Live'}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              title={user ? `Signed in as User ${user} - Sign Out` : 'Sign Out'}
              className="w-full flex items-center h-9 px-2 rounded-[10px] text-neutral-400 hover:text-red-400 hover:bg-white/5 text-[12px] font-medium transition-colors whitespace-nowrap overflow-hidden cursor-pointer"
            >
              <div className="w-7 flex items-center justify-center shrink-0">
                <LogOut className="w-4 h-4" />
              </div>
              <div className="ml-2.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-between flex-1">
                <span>Sign Out</span>
                {user && <span className="text-[10px] text-neutral-400 bg-white/10 px-1.5 py-0.5 rounded font-mono">#{user}</span>}
              </div>
            </button>
          </div>
        </aside>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/60 animate-modal-backdrop backdrop-blur-[2px]"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-[280px] bg-[#111111] text-white h-full flex flex-col p-6 z-10 shadow-2xl animate-drawer-left">
            <div className="flex items-center justify-between pb-6 border-b border-[#222222]">
              <span className="font-bold text-[20px]">Sonu Shoe</span>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
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
                    className={`flex items-center gap-3.5 px-3.5 py-3 rounded-[12px] text-[15px] font-medium transition-all duration-150 ease-out active:scale-[0.98] ${
                      isActive ? 'bg-white text-[#111111] shadow-sm' : 'text-neutral-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="pt-4 border-t border-[#222222] space-y-2">
              {user && (
                <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-[13px] text-neutral-300">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>Signed in as</span>
                  </div>
                  <span className="font-mono font-bold text-white">#{user}</span>
                </div>
              )}
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[13px] font-medium transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Container */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#f9fafb]">
        {/* Top Desktop Navigation Bar */}
        {!pathname.startsWith('/overview') && !pathname.startsWith('/analytics') && !pathname.startsWith('/views') && (
          <header className="hidden md:flex items-center justify-between px-8 h-14 bg-white border-b border-neutral-200/80 sticky top-0 z-30">
            <div className="flex items-center gap-2 text-[13px] text-neutral-400 font-normal">
              <span>Sonu Shoe</span>
              <span>/</span>
              <span className="text-neutral-800 font-medium capitalize">
                {pathname === '/' ? 'Dashboard' : pathname.replace('/', '')}
              </span>
            </div>

           
          </header>
        )}

        {/* Page Content */}
        <main className="flex-1 flex flex-col w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
