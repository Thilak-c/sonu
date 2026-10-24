'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import LoginModal from '@/components/auth/LoginModal';

export default function OrdersHubClient() {
  const [searchInput, setSearchInput] = useState('');
  const [orders, setOrders] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // Authentication & Phone state
  const [userMobile, setUserMobile] = useState('');
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  // Helper to extract clean 10-digit phone number
  const getCleanMobile = (phone) => {
    if (!phone) return '';
    return String(phone).replace(/\D/g, '').slice(-10);
  };

  // Helper to check if an order is linked to a given mobile number
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

  // Fetch orders linked to a specific mobile number
  const fetchOrdersForMobile = useCallback(async (mobile) => {
    const cleanMobile = getCleanMobile(mobile);
    if (!cleanMobile) {
      setOrders([]);
      setIsInitialLoading(false);
      return;
    }

    setIsInitialLoading(true);

    // 1. Check local orders for this mobile number only
    let matchedLocalOrders = [];
    try {
      const raw = localStorage.getItem('sonu_orders');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          matchedLocalOrders = parsed.filter((o) => isOrderLinkedToMobile(o, cleanMobile));
        }
      }
    } catch (e) {
      console.error('Failed to parse local orders', e);
    }

    // 2. Fetch from MongoDB API for this mobile
    try {
      const res = await fetch(`/api/orders?mobile=${encodeURIComponent(cleanMobile)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.orders && Array.isArray(data.orders)) {
          const map = new Map();
          data.orders.forEach((o) => map.set(o.orderId, o));
          matchedLocalOrders.forEach((o) => {
            if (!map.has(o.orderId)) map.set(o.orderId, o);
          });
          matchedLocalOrders = Array.from(map.values());
        }
      }
    } catch (err) {
      console.error('Failed to fetch mobile orders', err);
    }

    setOrders(matchedLocalOrders);
    setIsInitialLoading(false);
  }, []);

  // Check login & phone number on mount and listen to updates
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
        setIsInitialLoading(false);
        // Automatically open the login popup modal if user has no phone saved
        setIsLoginOpen(true);
      }
    };

    checkPhoneAndLoad();

    // Listen for auth-changed and storage events
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

  // Search by specific Order ID or Phone number
  const handleSearch = async (e) => {
    e.preventDefault();
    const query = searchInput.trim();
    if (!query) return;

    // If user is not logged in with phone number, open login modal
    if (!userMobile) {
      setIsLoginOpen(true);
      return;
    }

    setIsSearching(true);
    setSearchError('');
    setHasSearched(true);

    try {
      const isMobile = /^\d{10}$/.test(query.replace(/\D/g, ''));
      let url = '';

      if (isMobile) {
        const cleanQueryMobile = query.replace(/\D/g, '').slice(-10);
        // If searched phone doesn't match logged in phone, reject
        if (cleanQueryMobile !== userMobile) {
          setSearchError(`You are currently logged in as +91 ${userMobile}. You can only view orders associated with your verified phone number.`);
          setOrders([]);
          setIsSearching(false);
          return;
        }
        url = `/api/orders?mobile=${encodeURIComponent(cleanQueryMobile)}`;
      } else {
        url = `/api/orders?orderId=${encodeURIComponent(query)}`;
      }

      const res = await fetch(url);
      const data = await res.json();

      if (!res.ok || (data.orders && data.orders.length === 0) || (!data.orders && !data.order)) {
        setSearchError('No order found matching that Order ID. Please check the order details.');
        setOrders([]);
      } else if (data.order) {
        // Enforce that the found order belongs to this verified user
        if (!isOrderLinkedToMobile(data.order, userMobile)) {
          setSearchError('No order found matching this Order ID under your verified phone number.');
          setOrders([]);
        } else {
          setOrders([data.order]);
        }
      } else if (data.orders) {
        const matched = data.orders.filter((o) => isOrderLinkedToMobile(o, userMobile));
        if (matched.length === 0) {
          setSearchError('No orders found for this search under your verified phone number.');
          setOrders([]);
        } else {
          setOrders(matched);
        }
      }
    } catch (err) {
      console.error('Order search error:', err);
      setSearchError('Unable to connect to order services. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchInput('');
    setHasSearched(false);
    setSearchError('');
    if (userMobile) {
      fetchOrdersForMobile(userMobile);
    } else {
      setOrders([]);
    }
  };

  return (
    <div className="min-h-screen bg-white font-['Helvetica_Now_Text',sans-serif] text-[#111111] pb-24 pt-6 sm:pt-10">
      <div className="max-w-[840px] mx-auto px-4 sm:px-6">
        {/* Title Header */}
        <div className="border-b border-[#e5e5e5] pb-5 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <h1
              className="text-[26px] sm:text-[32px] font-bold text-[#111111] tracking-tight font-['Helvetica_Now_Text_Medium',sans-serif]"
              style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
            >
              Orders & Tracking
            </h1>
            <p className="text-[14px] text-[#707072] mt-1">
              Track live shipments, view tax invoices, and review order payment breakdowns.
            </p>
          </div>

          {/* User Phone Status Badge */}
          {userMobile ? (
            <div className="flex items-center gap-2 self-start sm:self-auto bg-neutral-50 border border-neutral-200/80 px-3.5 py-1.5 rounded-full text-[12.5px]">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
              <span className="text-neutral-600 font-medium">+91 {userMobile}</span>
              <button
                type="button"
                onClick={() => setIsLoginOpen(true)}
                className="text-[#111111] font-semibold underline hover:text-[#707072] ml-1 cursor-pointer"
              >
                Change
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsLoginOpen(true)}
              className="self-start sm:self-auto px-4 py-2 rounded-full bg-[#111111] hover:bg-black text-white text-[13px] font-medium transition-colors cursor-pointer"
            >
              Log In to View Orders
            </button>
          )}
        </div>

        {/* NOT LOGGED IN STATE (No Phone Number Saved) */}
        {!userMobile && !isInitialLoading && (
          <div className="my-8 p-6 sm:p-8 rounded-[24px] border border-[#e5e5e5] bg-[#fafafa] text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-white shadow-xs border border-neutral-200 flex items-center justify-center mx-auto text-[#111111]">
              <svg viewBox="0 0 24 24" width="26px" height="26px" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="5" y="2" width="14" height="20" rx="3" />
                <line x1="12" y1="18" x2="12.01" y2="18" />
              </svg>
            </div>
            <div>
              <h2
                className="text-[20px] font-bold text-[#111111] font-['Helvetica_Now_Text_Medium',sans-serif]"
                style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
              >
                Verify your phone number
              </h2>
              <p className="text-[14px] text-[#707072] max-w-[420px] mx-auto mt-1 leading-relaxed">
                We only display orders linked to your verified mobile number to keep your deliveries and invoices private.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsLoginOpen(true)}
              className="inline-flex items-center justify-center px-7 py-3 rounded-full bg-[#111111] hover:bg-black text-white text-[14px] font-medium transition-all shadow-sm active:scale-[0.99] cursor-pointer"
            >
              Verify Mobile Number & View Orders
            </button>
          </div>
        )}

        {/* Quick Search Bar */}
        <div className="pt-6 pb-2">
          <form onSubmit={handleSearch} className="space-y-2">
            <label
              htmlFor="order-search"
              className="block text-[13px] font-semibold text-[#111111] uppercase tracking-wider"
            >
              Look up an order
            </label>
            <div className="flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1">
                <input
                  id="order-search"
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Enter Order ID (SONU-IN-...) or 10-digit Phone"
                  className="w-full h-12 px-4 rounded-full border border-neutral-300 focus:border-black outline-none text-[14px] font-medium text-[#111111] placeholder:text-[#8d8d8d] transition-colors"
                />
                {searchInput && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-black text-xs font-semibold px-2 py-1 cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>
              <button
                type="submit"
                disabled={isSearching || !searchInput.trim()}
                className="h-12 px-8 rounded-full bg-[#111111] hover:bg-black active:scale-[0.99] text-white text-[14px] font-medium transition-all shadow-sm cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2 shrink-0 font-['Helvetica_Now_Text_Medium',sans-serif]"
                style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
              >
                {isSearching ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Searching...</span>
                  </>
                ) : (
                  <span>Track Order</span>
                )}
              </button>
            </div>
            {searchError && (
              <p className="text-[13px] text-red-600 font-medium pt-1">{searchError}</p>
            )}
          </form>
        </div>

        {/* Orders List / Empty State */}
        {isInitialLoading ? (
          <div className="py-20 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin" />
          </div>
        ) : orders.length === 0 ? (
          <div className="py-16 text-center max-w-[480px] mx-auto space-y-4">
            <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mx-auto text-neutral-500">
              <svg viewBox="0 0 24 24" width="28px" height="28px" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
                />
              </svg>
            </div>
            <div>
              <h2
                className="text-[19px] font-bold text-[#111111] font-['Helvetica_Now_Text_Medium',sans-serif]"
                style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
              >
                {hasSearched
                  ? 'No matching order found'
                  : userMobile
                  ? `No orders found for +91 ${userMobile}`
                  : 'No orders to display'}
              </h2>
              <p className="text-[13.5px] text-[#707072] mt-1.5 leading-relaxed">
                {hasSearched
                  ? 'Verify your 10-digit mobile number or Order ID (e.g. SONU-IN-123456) and try searching again.'
                  : userMobile
                  ? 'If you placed an order with a different phone number, enter it above or switch your mobile number.'
                  : 'Please log in with your phone number to track your shipments.'}
              </p>
            </div>
            <Link
              href="/"
              className="inline-flex items-center justify-center px-7 py-3 rounded-full bg-[#111111] hover:bg-black text-white text-[13.5px] font-medium transition-all shadow-sm"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="pt-6 space-y-6">
            <div className="flex items-center justify-between text-[13px] text-[#707072]">
              <span>
                Showing {orders.length} {orders.length === 1 ? 'order' : 'orders'}
                {userMobile && !hasSearched && ` for +91 ${userMobile}`}
              </span>
              {hasSearched && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="font-medium text-[#111111] underline hover:text-[#707072] cursor-pointer"
                >
                  Show all my orders
                </button>
              )}
            </div>

            {orders.map((order) => {
              const items = order.items || [];
              const isPartialCod =
                order.payment?.method === 'partial_cod' || order.paymentMethod === 'partial_cod';
              const advancePaid = Number(order.payment?.advancePaid || order.advancePaid || 200);
              const totalAmount = Number(order.totalAmount || 13995);
              const balanceDue = Number(
                order.payment?.balanceDue || order.balanceDue || Math.max(0, totalAmount - advancePaid)
              );

              const formattedDate = order.placedAt
                ? new Date(order.placedAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })
                : 'Recent Order';

              const orderStatus = (order.fulfillmentStatus || order.status || 'CONFIRMED').toUpperCase();

              return (
                <div
                  key={order.orderId || order._id}
                  className="border border-[#e5e5e5] rounded-[20px] p-5 sm:p-6 bg-white shadow-[0_1px_4px_rgba(0,0,0,0.02)] transition-all hover:border-black/30"
                >
                  {/* Card Header: Order ID, Date, Status */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#f0f0f0] gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className="text-[16px] font-bold text-[#111111] font-['Helvetica_Now_Text_Medium',sans-serif]"
                          style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
                        >
                          {order.orderId}
                        </span>
                        <span className="text-[12px] text-[#707072]">• {formattedDate}</span>
                      </div>
                      <p className="text-[12px] text-[#707072] mt-0.5">
                        Deliver to {order.customer?.name || order.address?.name || 'Customer'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11.5px] font-semibold tracking-tight">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                        {orderStatus}
                      </span>
                    </div>
                  </div>

                  {/* Payment Breakdown Badge */}
                  <div className="pt-3.5 pb-2">
                    {isPartialCod ? (
                      <div className="p-3 rounded-[12px] bg-neutral-50 border border-neutral-200/80 text-[12.5px] text-neutral-700 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                        <span className="font-medium text-[#111111]">
                          Partial Cash on Delivery (COD)
                        </span>
                        <span className="text-[#707072]">
                          ₹{advancePaid.toLocaleString('en-IN')} Paid Online &bull;{' '}
                          <strong className="text-[#111111]">
                            ₹{balanceDue.toLocaleString('en-IN')} Due on Delivery
                          </strong>
                        </span>
                      </div>
                    ) : (
                      <div className="p-3 rounded-[12px] bg-neutral-50 border border-neutral-200/80 text-[12.5px] text-neutral-700 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                        <span className="font-medium text-[#111111]">Prepaid Full Payment</span>
                        <span className="text-[#059669] font-semibold">
                          ₹{totalAmount.toLocaleString('en-IN')} Paid in Full
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Line Items */}
                  <div className="divide-y divide-[#f0f0f0] my-2">
                    {items.map((item, idx) => (
                      <div key={idx} className="py-3 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3.5">
                          {item.image && (
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-16 h-16 object-contain shrink-0"
                            />
                          )}
                          <div>
                            <p
                              className="text-[14px] font-bold text-[#111111] leading-snug line-clamp-1 font-['Helvetica_Now_Text_Medium',sans-serif]"
                              style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
                            >
                              {item.name}
                            </p>
                            <p className="text-[12px] text-[#707072] mt-0.5">
                              Size: {item.size || 'UK 8'} &bull; Qty: {item.quantity || 1}
                            </p>
                          </div>
                        </div>
                        <span className="text-[14px] font-semibold text-[#111111] shrink-0">
                          {item.price || `₹${(item.priceNumber || 13995).toLocaleString('en-IN')}`}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Card Footer: Total & Track Button */}
                  <div className="pt-4 border-t border-[#f0f0f0] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="text-[13px] text-[#707072]">
                      <span>Order Total: </span>
                      <strong className="text-[#111111] text-[15px]">
                        ₹{totalAmount.toLocaleString('en-IN')}
                      </strong>
                    </div>

                    <Link
                      href={`/order/${order.orderId}`}
                      className="px-6 py-2.5 rounded-full bg-[#111111] hover:bg-black text-white text-[13px] font-medium transition-all shadow-sm text-center active:scale-[0.99] font-['Helvetica_Now_Text_Medium',sans-serif]"
                      style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
                    >
                      Track Live Shipment &rarr;
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Login / Phone Verification Modal */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={handleLoginClose}
        initialStep="mobile"
      />
    </div>
  );
}
