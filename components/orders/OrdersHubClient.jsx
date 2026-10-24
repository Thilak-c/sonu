'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function OrdersHubClient() {
  const [searchInput, setSearchInput] = useState('');
  const [orders, setOrders] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // Load orders from localStorage and from logged-in mobile profile
  useEffect(() => {
    const loadStoredAndProfileOrders = async () => {
      let localOrders = [];
      try {
        const raw = localStorage.getItem('sonu_orders');
        if (raw) {
          localOrders = JSON.parse(raw);
        }
      } catch (e) {
        console.error('Failed to parse local orders', e);
      }

      // Check if user has a stored mobile number to fetch profile orders
      let mobile = '';
      try {
        mobile = localStorage.getItem('sonu_user_mobile') || '';
        if (!mobile) {
          const prof = JSON.parse(localStorage.getItem('sonu_user_profile') || '{}');
          mobile = prof.mobile || '';
        }
      } catch (e) {}

      if (mobile) {
        try {
          const res = await fetch(`/api/orders?mobile=${encodeURIComponent(mobile)}`);
          if (res.ok) {
            const data = await res.json();
            if (data.orders && Array.isArray(data.orders)) {
              // Merge remote and local orders deduplicated by orderId
              const map = new Map();
              data.orders.forEach((o) => map.set(o.orderId, o));
              localOrders.forEach((o) => {
                if (!map.has(o.orderId)) map.set(o.orderId, o);
              });
              localOrders = Array.from(map.values());
            }
          }
        } catch (err) {
          console.error('Failed to fetch mobile orders', err);
        }
      }

      setOrders(localOrders);
      setIsInitialLoading(false);
    };

    loadStoredAndProfileOrders();
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    const query = searchInput.trim();
    if (!query) return;

    setIsSearching(true);
    setSearchError('');
    setHasSearched(true);

    try {
      const isMobile = /^\d{10}$/.test(query.replace(/\D/g, ''));
      let url = '';

      if (isMobile) {
        url = `/api/orders?mobile=${encodeURIComponent(query.replace(/\D/g, '').slice(-10))}`;
      } else {
        url = `/api/orders?orderId=${encodeURIComponent(query)}`;
      }

      const res = await fetch(url);
      const data = await res.json();

      if (!res.ok || (data.orders && data.orders.length === 0) || (!data.orders && !data.order)) {
        setSearchError('No order found matching that Order ID or phone number. Please check the spelling or format.');
        setOrders([]);
      } else if (data.order) {
        setOrders([data.order]);
      } else if (data.orders) {
        setOrders(data.orders);
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
    try {
      const raw = localStorage.getItem('sonu_orders');
      setOrders(raw ? JSON.parse(raw) : []);
    } catch (e) {
      setOrders([]);
    }
  };

  return (
    <div className="min-h-screen bg-white font-['Helvetica_Now_Text',sans-serif] text-[#111111] pb-24 pt-6 sm:pt-10">
      <div className="max-w-[840px] mx-auto px-4 sm:px-6">
        {/* Title Header */}
        <div className="border-b border-[#e5e5e5] pb-5">
          <h1
            className="text-[26px] sm:text-[32px] font-bold text-[#111111] tracking-tight font-['Helvetica_Now_Text_Medium',sans-serif]"
            style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
          >
            Orders & Tracking
          </h1>
          <p className="text-[14px] text-[#707072] mt-1">
            Track your footwear deliveries, view invoices, and review order payment breakdowns.
          </p>
        </div>

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
                {hasSearched ? 'No matching order found' : 'No recent orders in this browser'}
              </h2>
              <p className="text-[13.5px] text-[#707072] mt-1.5 leading-relaxed">
                {hasSearched
                  ? 'Verify your 10-digit mobile number or Order ID (e.g. SONU-IN-123456) and try searching again.'
                  : 'If you placed an order previously, enter your 10-digit mobile number or Order ID in the lookup bar above to track your parcel.'}
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
              </span>
              {hasSearched && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="font-medium text-[#111111] underline hover:text-[#707072] cursor-pointer"
                >
                  Show all past orders
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
    </div>
  );
}
