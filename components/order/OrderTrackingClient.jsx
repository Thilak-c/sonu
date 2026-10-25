'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function OrderTrackingClient({ initialOrder, orderId }) {
  const [order, setOrder] = useState(initialOrder);
  const [loading, setLoading] = useState(!initialOrder);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  // Live Shiprocket Tracking State
  const [liveTrack, setLiveTrack] = useState(null);
  const [trackingLoading, setTrackingLoading] = useState(false);

  // Fallback client-side fetch if server didn't find order in MongoDB
  useEffect(() => {
    if (order) return;
    if (!orderId) return;

    const fetchOrder = async () => {
      try {
        setLoading(true);
        setError('');

        const res = await fetch(`/api/orders?orderId=${encodeURIComponent(orderId)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.order) {
            setOrder(data.order);
            return;
          }
        }

        // Fallback: check localStorage for recently placed order
        if (typeof window !== 'undefined') {
          const storedOrders = JSON.parse(localStorage.getItem('sonu_orders') || '[]');
          const match = storedOrders.find((o) => o.orderId === orderId);
          if (match) {
            setOrder(match);
            return;
          }
        }

        setError('We could not find an order matching this reference ID.');
      } catch (err) {
        console.error('Error fetching order:', err);
        setError('Unable to load order details. Please check your connection.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, order]);

  // Fetch Live Shiprocket Tracking
  const fetchLiveTracking = async () => {
    if (!orderId) return;
    try {
      setTrackingLoading(true);
      const res = await fetch(`/api/shiprocket/track?orderId=${encodeURIComponent(orderId)}`);
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          setLiveTrack(json.data);
        }
      }
    } catch (e) {
      console.error('Tracking fetch error:', e);
    } finally {
      setTrackingLoading(false);
    }
  };

  useEffect(() => {
    if (order?.shiprocket) {
      fetchLiveTracking();
    }
  }, [order]);

  const handleCopyId = () => {
    if (!order?.orderId) return;
    navigator.clipboard?.writeText(order.orderId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Format Order Date
  const formatDate = (isoString) => {
    if (!isoString) return 'Just now';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (e) {
      return isoString;
    }
  };

  // Compute Expected Delivery Date
  const getExpectedDateDisplay = () => {
    if (liveTrack?.edd) return liveTrack.edd;
    if (order?.estimatedDelivery && order.estimatedDelivery.includes('Oct')) {
      return order.estimatedDelivery;
    }
    const baseDate = order?.placedAt ? new Date(order.placedAt) : new Date();
    const edd = new Date(baseDate);
    edd.setDate(edd.getDate() + 3);
    return edd.toLocaleDateString('en-IN', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center font-['Helvetica_Now_Text',sans-serif] px-4 text-center">
        <div className="w-9 h-9 border-3 border-neutral-300 border-t-black rounded-full animate-spin mb-4" />
        <h2 className="text-[17px] font-bold text-[#111111]">Loading your order tracking...</h2>
        <p className="text-[13px] text-neutral-500 mt-1">Retrieving details and live courier status</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center font-['Helvetica_Now_Text',sans-serif] px-4 text-center max-w-md mx-auto">
        <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-400 mb-4 text-2xl">
          📦
        </div>
        <h1 className="text-[22px] font-bold text-[#111111]">Order Not Found</h1>
        <p className="text-[14px] text-neutral-500 mt-2 mb-6">
          {error || "We couldn't locate this order. Please verify your order ID or contact customer support."}
        </p>
        <Link
          href="/"
          className="px-8 py-3.5 rounded-full bg-black text-white text-[14px] font-medium hover:bg-neutral-800 transition-colors"
        >
          Return to Storefront
        </Link>
      </div>
    );
  }

  const customer = order.customer || {};
  const addr = customer.address || {};
  const items = order.items || [];
  const shiprocket = order.shiprocket || {};

  // Construct Full Address String
  const addressLine = [
    addr.houseNo,
    addr.street || addr.roadArea,
    addr.landmark,
    addr.city,
    addr.state,
    addr.pincode ? `- ${addr.pincode}` : '',
  ]
    .filter(Boolean)
    .join(', ');

  // Direct Shiprocket Tracking URL
  const publicTrackingUrl =
    liveTrack?.trackUrl ||
    (shiprocket.awbCode ? `https://shiprocket.co/tracking/${shiprocket.awbCode}` : '') ||
    (shiprocket.orderId ? `https://shiprocket.co/tracking/?order_id=${shiprocket.orderId}` : 'https://shiprocket.co/tracking');

  // Tracking Progress Stage
  const currentFulfillment = (order.fulfillmentStatus || order.status || 'confirmed').toLowerCase();
  const isDelivered = currentFulfillment === 'delivered';
  const isShipped = isDelivered || currentFulfillment === 'shipped' || currentFulfillment === 'in_transit';
  const isProcessing = isShipped || currentFulfillment === 'processing' || currentFulfillment === 'confirmed';

  // Payment Breakdown
  const isPartialCod = order.payment?.method === 'partial_cod' || order.payment?.method === 'cod';
  const advancePaid = isPartialCod ? Number(order.payment?.advancePaid ?? 200) : Number(order.totalAmount || 13995);
  const balanceDue = isPartialCod ? Number(order.payment?.balanceDue ?? Math.max(0, Number(order.totalAmount || 13995) - advancePaid)) : 0;

  return (
    <div className="min-h-screen font-['Helvetica_Now_Text',sans-serif] text-[#111111] pb-24 pt-6 sm:pt-10">
      <div className="max-w-[760px] mx-auto px-4 sm:px-6 space-y-6">
        {/* Top Order Confirmation Banner */}
        <div className="bg-white">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-[24px] sm:text-[28px] font-bold text-[#111111] tracking-tight font-['Helvetica_Now_Text_Medium',sans-serif]">
                Thank you, {customer.name || 'Customer'}!
              </h1>
              <div className="flex flex-wrap items-center gap-2.5 mt-2">
        
                <span className="text-[13px] text-[#707072]">Order ID: {order.orderId}</span>
              </div>
            </div>
          </div>

          {/* Expected Delivery Date Highlight */}
          <div className="pt-6">
            <div className=" sm:p-5 font-['Helvetica_Now_Text_Medium',sans-serif] rounded-[18px] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-[12px] uppercase font-bold tracking-wider text-emerald-800">
                  Expected Delivery Date
                </p>
                <p className="text-[19px] sm:text-[22px] font-bold text-[#111111] mt-0.5 font-['Helvetica_Now_Text_Medium',sans-serif]">
                  {getExpectedDateDisplay()}
                </p>
               
              </div>

          
            </div>

            {/* 4-Step Progress Tracker */}
            <div className="mt-8 pt-2">
              <div className="relative">
                {/* Horizontal Progress Bar Line (Visible on phone and desktop) */}
                <div className="absolute top-3.5 sm:top-4 left-[12.5%] right-[12.5%] h-[2px] bg-neutral-200 z-0" />
                <div
                  className="absolute top-3.5 sm:top-4 left-[12.5%] h-[2px] bg-[#111111] z-0 transition-all duration-500 ease-out"
                  style={{
                    width: isDelivered ? '75%' : isShipped ? '50%' : isProcessing ? '25%' : '0%',
                  }}
                />

                <div className="grid grid-cols-4 gap-1 sm:gap-2 text-center relative z-10">
                  {/* Step 1: Confirmed */}
                  <div className="flex flex-col items-center">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-black text-white ring-4 ring-white flex items-center justify-center text-[11px] sm:text-[12px] font-bold mb-1.5 shadow-sm">
                      ✓
                    </div>
                    <p className="text-[11px] sm:text-[13px] font-bold text-[#111111] leading-tight">Order Placed</p>
                    <p className="text-[9.5px] sm:text-[11px] text-neutral-400 mt-0.5 leading-tight">Confirmed</p>
                  </div>

                  {/* Step 2: Processing */}
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full ring-4 ring-white flex items-center justify-center text-[11px] sm:text-[12px] font-bold mb-1.5 shadow-sm transition-colors ${
                        isProcessing
                          ? 'bg-black text-white'
                          : 'bg-neutral-200 text-neutral-500'
                      }`}
                    >
                      {isShipped ? '✓' : '2'}
                    </div>
                    <p className="text-[11px] sm:text-[13px] font-bold text-[#111111] leading-tight">Preparing</p>
                    <p className="text-[9.5px] sm:text-[11px] text-neutral-400 mt-0.5 leading-tight">Quality Check</p>
                  </div>

                  {/* Step 3: Shipped */}
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full ring-4 ring-white flex items-center justify-center text-[11px] sm:text-[12px] font-bold mb-1.5 shadow-sm transition-colors ${
                        isShipped
                          ? 'bg-black text-white'
                          : 'bg-neutral-200 text-neutral-500'
                      }`}
                    >
                      {isDelivered ? '✓' : '3'}
                    </div>
                    <p className="text-[11px] sm:text-[13px] font-bold text-[#111111] leading-tight">Dispatched</p>
                    <p className="text-[9.5px] sm:text-[11px] text-neutral-400 mt-0.5 leading-tight">In Transit</p>
                  </div>

                  {/* Step 4: Delivered */}
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full ring-4 ring-white flex items-center justify-center text-[11px] sm:text-[12px] font-bold mb-1.5 shadow-sm transition-colors ${
                        isDelivered
                          ? 'bg-emerald-600 text-white'
                          : 'bg-neutral-200 text-neutral-500'
                      }`}
                    >
                      {isDelivered ? '✓' : '4'}
                    </div>
                    <p className="text-[11px] sm:text-[13px] font-bold text-[#111111] leading-tight">Delivered</p>
                    <p className="text-[9.5px] sm:text-[11px] text-neutral-400 mt-0.5 leading-tight">To Doorstep</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Shiprocket Live Tracking Card */}
        <div className="font-['Helvetica_Now_Text_Medium',sans-serif]">
          <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
            <div className="flex items-center gap-2.5">
            
              <div>
                <h2 className="text-[16px] font-bold text-[#111111]">
                   Logistics Tracking
                </h2>
                <p className="text-[12px] text-neutral-400">
                  Real-time package dispatch & courier status
                </p>
              </div>
            </div>
          </div>

          <div className="">
         
            <div className="">
              <p className="text-[11px] ">Courier AWB Number</p>
              <p className="underline">
                {liveTrack?.awbCode || shiprocket.awbCode || 'Assigned at Dispatch'}
              </p>
            </div>
          </div>

      
        </div>

        {/* Ordered Footwear Items Breakdown (Same to Same as Bag) */}
        <div className="bg-white">
          <h2
            className="text-[20px] sm:text-[22px] font-bold tracking-tight text-[#111111] font-['Helvetica_Now_Text_Medium',sans-serif] mb-6"
            style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
          >
             {items.length} {items.length === 1 ? 'item' : 'items'}
          </h2>

          <div>
            {items.map((item, idx) => {
              const itemKey = `${item.id || item.slug || idx}-${item.size}-${idx}`;
              return (
                <div key={itemKey} className="border-b border-[#e5e5e5] pb-8 mb-8 last:border-b-0 last:mb-0">
                  {/* Product Info Row - exact same as Bag */}
                  <div className="flex gap-4 sm:gap-6 items-start">
                    {/* Square Product Image - no padding, no background */}
                    <div className="w-[135px] h-[135px] sm:w-[150px] sm:h-[150px] shrink-0 flex items-center justify-center overflow-hidden">
                      <img
                        src={item.image || '/images/ad22b92Nike-HQ2593-502_1.avif'}
                        alt={item.name}
                        loading="eager"
                        fetchPriority="high"
                        decoding="async"
                        className="w-full h-full object-contain"
                      />
                    </div>

                    {/* Details Column - exact same as Bag */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      {/* 1. Price */}
                      <p className="text-[17px] sm:text-[18px] font-bold text-[#111111] leading-none">
                        ₹ {(item.priceNumber || 13995).toLocaleString('en-IN')}
                      </p>

                      {/* 2. Product Name */}
                      <div className="block">
                        <h3
                          className="text-[16px] sm:text-[17px] font-bold text-[#111111] leading-snug font-['Helvetica_Now_Text_Medium',sans-serif]"
                          style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
                        >
                          {item.name}
                        </h3>
                      </div>

                      {/* 3. Category */}
                      <p className="text-[14px] text-[#707072] leading-normal">
                        {item.category || "Women's Road Running Shoes"}
                      </p>

                      {/* 4. Shipping / Delivery */}
                      <p className="text-[14px] text-[#707072] leading-normal">
                        Usually ships in 1 day
                      </p>

                      {/* 5. Return Policy */}
                      <p className="text-[14px] text-[#707072] leading-normal">
                        7 Day Return
                      </p>

                      {/* 6. Size */}
                      <div>
                        <span className="text-[14px] font-medium text-[#111111]">
                          Size {item.size || 'UK 8'}
                        </span>
                        {item.quantity > 1 && (
                          <span className="text-[14px] text-[#707072] ml-2 font-normal">
                            (Qty: {item.quantity})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pricing Summary - exact same as Bag */}
          <div className="border-t border-[#e5e5e5] pt-6 mt-6 space-y-3.5 text-[15px] sm:text-[16px] text-[#111111]">
            <div className="flex items-center justify-between">
              <span>Bag Total</span>
              <span>₹ {(order.totalAmount || 13995).toLocaleString('en-IN')}</span>
            </div>

            <div className="flex items-center justify-between">
              <span>Shipping Charges</span>
              <span className="text-[#0d8240] font-normal">Free</span>
            </div>

            {isPartialCod && (
              <div className="flex items-center justify-between text-[#707072]">
                <span>Advance Paid Online</span>
                <span className="text-[#111111] font-medium">₹ {advancePaid.toLocaleString('en-IN')}</span>
              </div>
            )}
          </div>

          <div className="border-t border-[#e5e5e5] my-4" />

          {isPartialCod ? (
            <div className="flex items-center justify-between text-[17px] sm:text-[18px] font-bold text-[#111111]">
              <span className="flex items-center gap-2">
                <span>Due on Delivery</span>
               
              </span>
              <span>₹ {balanceDue.toLocaleString('en-IN')}</span>
            </div>
          ) : (
            <div className="flex items-center justify-between text-[17px] sm:text-[18px] font-bold text-[#111111]">
              <span>You Paid</span>
              <span>₹ {(order.totalAmount || 13995).toLocaleString('en-IN')}</span>
            </div>
          )}
        </div>

        {/* Delivery Address & Customer Details */}
        <div className=" rounded-[24px]">
          <h2 className="text-[16px] font-bold text-[#111111] mb-3">
            Delivery Address
          </h2>
          <div className="text-[13.5px] text-neutral-700 space-y-1.5 leading-relaxed">
            <p className="text-[15px] font-bold text-[#111111]">
              {customer.name || 'Customer'}
            </p>
            {customer.mobile && (
              <p className="text-neutral-600 font-medium">
                +91 {customer.mobile} {customer.email ? `• ${customer.email}` : ''}
              </p>
            )}
            <p className="text-neutral-600 pt-1">
              {addressLine || 'Shipping address recorded with order'}
            </p>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <Link
            href="/"
            className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-[#111111] hover:bg-black text-white text-[14px] font-medium text-center transition-all shadow-sm"
          >
            Continue Shopping
          </Link>
          <Link
            href="/help-center"
            className="w-full sm:w-auto px-6 py-3.5 rounded-full border border-neutral-300 hover:border-black text-[14px] font-medium text-center transition-colors text-neutral-700 bg-white"
          >
            Need Help?
          </Link>
        </div>
      </div>
    </div>
  );
}
