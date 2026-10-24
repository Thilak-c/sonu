'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import LoginModal from '@/components/auth/LoginModal';

export default function OrdersHubClient() {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userMobile, setUserMobile] = useState('');
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  // Helper to extract clean 10-digit mobile
  const getCleanMobile = (phone) => {
    if (!phone) return '';
    return String(phone).replace(/\D/g, '').slice(-10);
  };

  // Helper to verify if an order is linked to a target mobile number
  const isOrderLinkedToMobile = (order, targetMobile) => {
    if (!order || !targetMobile) return false;
    const cleanTarget = getCleanMobile(targetMobile);
    const orderMobiles = [
      order.customer?.mobile,
      order.address?.mobile,
      order.shippingAddress?.mobile,
      order.mobile,
    ].filter(Boolean);

    return orderMobiles.some((m) => getCleanMobile(m) === cleanTarget);
  };

  // Fetch orders for clean mobile number
  const fetchOrdersForMobile = useCallback(async (mobile) => {
    const cleanMobile = getCleanMobile(mobile);
    if (!cleanMobile) {
      setOrders([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    let matched = [];

    // 1. Check local storage
    try {
      const raw = localStorage.getItem('sonu_orders');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          matched = parsed.filter((o) => isOrderLinkedToMobile(o, cleanMobile));
        }
      }
    } catch (e) {
      console.error('Failed to parse local orders', e);
    }

    // 2. Fetch from MongoDB API
    try {
      const res = await fetch(`/api/orders?mobile=${encodeURIComponent(cleanMobile)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.orders && Array.isArray(data.orders)) {
          const map = new Map();
          data.orders.forEach((o) => map.set(o.orderId, o));
          matched.forEach((o) => {
            if (!map.has(o.orderId)) map.set(o.orderId, o);
          });
          matched = Array.from(map.values());
        }
      }
    } catch (err) {
      console.error('Failed to fetch mobile orders', err);
    }

    // Sort newest first
    matched.sort((a, b) => {
      const dateA = new Date(a.placedAt || a.createdAt || 0).getTime();
      const dateB = new Date(b.placedAt || b.createdAt || 0).getTime();
      return dateB - dateA;
    });

    setOrders(matched);
    setIsLoading(false);
  }, []);

  // Check login & phone number on mount
  useEffect(() => {
    const checkPhoneAndLoad = () => {
      let storedMobile = '';
      try {
        storedMobile = localStorage.getItem('sonu_user_mobile') || '';
        if (!storedMobile) {
          const prof = JSON.parse(localStorage.getItem('sonu_user_profile') || '{}');
          storedMobile = prof.mobile || '';
        }
      } catch (e) {}

      if (storedMobile) {
        const clean = getCleanMobile(storedMobile);
        setUserMobile(clean);
        fetchOrdersForMobile(clean);
      } else {
        setUserMobile('');
        setOrders([]);
        setIsLoading(false);
        // Automatically open the login popup modal if user has no phone saved
        setIsLoginOpen(true);
      }
    };

    checkPhoneAndLoad();

    window.addEventListener('auth-changed', checkPhoneAndLoad);
    window.addEventListener('storage', checkPhoneAndLoad);
    return () => {
      window.removeEventListener('auth-changed', checkPhoneAndLoad);
      window.removeEventListener('storage', checkPhoneAndLoad);
    };
  }, [fetchOrdersForMobile]);

  // Handle Login Modal close / completion
  const handleLoginClose = () => {
    setIsLoginOpen(false);
    let storedMobile = '';
    try {
      storedMobile = localStorage.getItem('sonu_user_mobile') || '';
      if (!storedMobile) {
        const prof = JSON.parse(localStorage.getItem('sonu_user_profile') || '{}');
        storedMobile = prof.mobile || '';
      }
    } catch (e) {}

    if (storedMobile) {
      const clean = getCleanMobile(storedMobile);
      setUserMobile(clean);
      fetchOrdersForMobile(clean);
    }
  };

  // Format date helper: "Oct 08"
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '';
      return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
    } catch (e) {
      return '';
    }
  };

  // Status headline: e.g. "Delivered on Oct 08"
  const getStatusHeadline = (order) => {
    const rawDate = order.deliveryDate || order.placedAt || order.createdAt || new Date();
    const dateFormatted = formatDate(rawDate);
    const status = (order.shipment?.status || order.status || '').toUpperCase();

    if (status === 'DELIVERED') {
      return `Delivered on ${dateFormatted}`;
    }
    if (status === 'SHIPPED' || status === 'OUT_FOR_DELIVERY') {
      return `Arriving by ${dateFormatted}`;
    }
    if (status === 'CANCELLED') {
      return `Cancelled on ${dateFormatted}`;
    }
    return `Delivered on ${dateFormatted}`;
  };

  // Subtitle: e.g. "Minutes Basket (1 item)"
  const getItemSubtitle = (order) => {
    const items = order.items || [];
    const totalQty = items.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);
    const firstName = items[0]?.name || 'Sonu Shoe';
    const itemLabel = totalQty === 1 ? '1 item' : `${totalQty} items`;

    if (items.length > 1) {
      return `${firstName} & more (${itemLabel})`;
    }
    return `${firstName} (${itemLabel})`;
  };

  return (
    <div className="min-h-screen bg-white font-['Helvetica_Now_Text',sans-serif] text-[#111111] pb-24 pt-2 sm:pt-4">
      <div className="max-w-[760px] mx-auto px-4 sm:px-6">
        
        {/* Centered Orders Header matching the Bag design */}
        <div className="text-center pt-2 mb-6">
          <h1
            className="text-[26px] sm:text-[30px] font-bold tracking-tight text-[#111111] font-['Helvetica_Now_Text_Medium',sans-serif]"
            style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
          >
            Orders
          </h1>
          <p className="text-[14px] sm:text-[15px] text-[#707072] mt-1 font-normal">
            {orders.length} {orders.length === 1 ? 'order' : 'orders'}
            {userMobile ? ` | +91 ${userMobile}` : ''}
          </p>
          <div className="border-t border-[#e5e5e5] mt-6" />
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin" />
            <p className="text-[14px] text-[#707072]">Loading orders...</p>
          </div>
        )}

        {/* Not Logged In State */}
        {!userMobile && !isLoading && (
          <div className="py-16 text-center max-w-[420px] mx-auto space-y-4">
            <p className="text-[15px] text-[#707072]">
              Please log in with your mobile number to view your order history.
            </p>
            <button
              type="button"
              onClick={() => setIsLoginOpen(true)}
              className="inline-flex items-center justify-center px-7 py-3 rounded-full bg-[#111111] hover:bg-black text-white text-[14px] font-medium transition-all shadow-sm active:scale-[0.99] cursor-pointer"
            >
              Log In to View Orders
            </button>
          </div>
        )}

        {/* Empty Orders State */}
        {userMobile && !isLoading && orders.length === 0 && (
          <div className="py-20 text-center max-w-[420px] mx-auto space-y-4">
            <p className="text-[16px] text-[#707072]">
              Your order history is empty.
            </p>
            <Link
              href="/"
              className="inline-flex items-center justify-center px-6 py-2.5 rounded-full border border-[#cccccc] hover:border-black text-[14px] font-medium text-[#111111] transition-colors"
            >
              Start Shopping
            </Link>
          </div>
        )}

        {/* Order History List (Matching the uploaded design) */}
        {userMobile && !isLoading && orders.length > 0 && (
          <div className="divide-y divide-[#e5e5e5]">
            {orders.map((order) => {
              const firstItem = order.items?.[0] || {};
              const headline = getStatusHeadline(order);
              const subtitle = getItemSubtitle(order);

              return (
                <Link
                  key={order.orderId || order._id}
                  href={`/order/${order.orderId}`}
                  className="flex items-center justify-between py-4 sm:py-5 hover:bg-neutral-50/70 transition-colors rounded-xl px-2 -mx-2 group cursor-pointer"
                >
                  {/* Left Side: Product Image & Details */}
                  <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
                    {/* Left: Rounded Square Image Box */}
                    <div className="w-[68px] h-[68px] sm:w-[76px] sm:h-[76px] bg-[#f4f4f4] rounded-[16px] sm:rounded-[18px] flex items-center justify-center p-2 shrink-0 overflow-hidden">
                      <img
                        src={firstItem.image || '/Logo/Logo_Full.png'}
                        alt={firstItem.name || 'Sonu shoe'}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          e.currentTarget.src = '/Logo/Logo_Full.png';
                        }}
                      />
                    </div>

                    {/* Right of Image: Date / Status Headline + Product Name */}
                    <div className="min-w-0">
                      <h2
                        className="text-[15px] sm:text-[16.5px] font-bold text-[#111111] truncate tracking-tight font-['Helvetica_Now_Text_Medium',sans-serif]"
                        style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
                      >
                        {headline}
                      </h2>
                      <p className="text-[13px] sm:text-[14px] text-[#707072] mt-0.5 truncate font-normal">
                        {subtitle}
                      </p>
                    </div>
                  </div>

                  {/* Far Right: Chevron Icon */}
                  <div className="shrink-0 pl-3">
                    <svg
                      className="w-5 h-5 text-[#111111] group-hover:translate-x-0.5 transition-transform"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Login Modal */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={handleLoginClose}
        initialStep="mobile"
      />
    </div>
  );
}
