'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function TestOrderPage() {
  const [formData, setFormData] = useState({
    name: 'Thilak Shiv Narayan',
    mobile: '8008439762',
    email: 'thilak8797@gmail.com',
    houseNo: '34',
    street: 'Rd Number 2, Nehru Nagar, Patliputra Colony',
    landmark: 'Near Durga Mandir',
    city: 'Patna',
    state: 'Bihar',
    pincode: '800013',
    productName: 'SONU Hybrid RN',
    productSlug: 'drop-hybrid-women',
    size: 'UK 8',
    quantity: 1,
    price: 13995,
    paymentMethod: 'upi', // 'upi' (Prepaid) or 'cod'
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [cancelStatus, setCancelStatus] = useState('');
  const [recentOrders, setRecentOrders] = useState([]);
  const [fetchingRecent, setFetchingRecent] = useState(false);

  const fetchRecentOrders = async () => {
    try {
      setFetchingRecent(true);
      const res = await fetch('/api/orders?limit=10');
      if (res.ok) {
        const data = await res.json();
        setRecentOrders(data.orders || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setFetchingRecent(false);
    }
  };

  useEffect(() => {
    fetchRecentOrders();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePlaceTestOrder = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);
    setCancelStatus('');

    const testOrderId = `SONU-${Date.now().toString().slice(-6)}`;

    const payload = {
      orderId: testOrderId,
      items: [
        {
          id: formData.productSlug,
          slug: formData.productSlug,
          name: formData.productName,
          priceNumber: Number(formData.price),
          price: `₹${Number(formData.price).toLocaleString('en-IN')}`,
          size: formData.size,
          quantity: Number(formData.quantity),
          image: '/images/ad22b92Nike-HQ2593-502_1.avif',
        },
      ],
      totalAmount: Number(formData.price) * Number(formData.quantity),
      address: {
        name: formData.name,
        firstName: formData.name.split(' ')[0] || formData.name,
        lastName: formData.name.split(' ').slice(1).join(' ') || '',
        mobile: formData.mobile,
        email: formData.email,
        houseNo: formData.houseNo,
        street: formData.street,
        landmark: formData.landmark,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
      },
      paymentMethod: formData.paymentMethod,
      advancePaid: formData.paymentMethod === 'partial_cod' ? 200 : (Number(formData.price) * Number(formData.quantity)),
      balanceDue: formData.paymentMethod === 'partial_cod' ? Math.max(0, (Number(formData.price) * Number(formData.quantity)) - 200) : 0,
      razorpayPaymentId: `pay_mock_${Date.now()}`,
      placedAt: new Date().toISOString(),
    };

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to place order');
      }

      setResult({
        orderId: testOrderId,
        mongoSaved: true,
        shiprocket: data.shiprocket,
        raw: data,
      });

      fetchRecentOrders();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOnShiprocket = async (orderId, srOrderId) => {
    if (!srOrderId) return;
    try {
      setCancelling(true);
      setCancelStatus('');
      const res = await fetch('/api/shiprocket/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, shiprocketOrderId: srOrderId }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to cancel order on Shiprocket');
      }
      setCancelStatus('Order successfully cancelled on Shiprocket!');
      fetchRecentOrders();
      if (result && result.orderId === orderId) {
        setResult((prev) => ({
          ...prev,
          shiprocket: { ...prev.shiprocket, status: 'CANCELLED' },
        }));
      }
    } catch (err) {
      console.error(err);
      setCancelStatus(`Error: ${err.message}`);
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] font-['Helvetica_Now_Text',sans-serif] text-[#111111] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-white border border-[#e5e5e5] rounded-[24px] p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[12px] font-semibold mb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Shiprocket Live Test Suite
            </div>
            <h1 className="text-[26px] sm:text-[30px] font-bold tracking-tight">
              Test Order & Shiprocket Dispatch
            </h1>
            <p className="text-[14px] text-neutral-500 mt-1">
              Simulate customer orders, verify MongoDB storage, and inspect real-time Shiprocket AWB dispatch.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="http://localhost:3001/orders"
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2.5 rounded-full border border-neutral-300 hover:border-black text-[13px] font-medium transition-colors cursor-pointer bg-white"
            >
              Open Admin Orders ↗
            </a>
            <Link
              href="/"
              className="px-4 py-2.5 rounded-full bg-black text-white hover:bg-neutral-800 text-[13px] font-medium transition-colors cursor-pointer"
            >
              Go to Storefront
            </Link>
          </div>
        </div>

        {/* Main Grid: Form on Left, Output & Actions on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left: Test Order Configuration Form */}
          <div className="lg:col-span-7 bg-white border border-[#e5e5e5] rounded-[24px] p-6 sm:p-8 shadow-sm">
            <h2 className="text-[18px] font-bold text-[#111111] mb-5 flex items-center justify-between">
              <span>Order Configuration</span>
              <span className="text-[12px] font-normal text-neutral-400">Pre-populated with test data</span>
            </h2>

            <form onSubmit={handlePlaceTestOrder} className="space-y-4 text-[13px]">
              {/* Customer Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[12px] font-semibold text-neutral-600 mb-1">
                    Customer Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full h-11 px-3.5 rounded-[12px] border border-neutral-300 focus:border-black outline-none font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-neutral-600 mb-1">
                    Mobile Number
                  </label>
                  <input
                    type="text"
                    name="mobile"
                    value={formData.mobile}
                    onChange={handleInputChange}
                    className="w-full h-11 px-3.5 rounded-[12px] border border-neutral-300 focus:border-black outline-none font-medium"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-neutral-600 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full h-11 px-3.5 rounded-[12px] border border-neutral-300 focus:border-black outline-none font-medium"
                  required
                />
              </div>

              {/* Address */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div className="sm:col-span-1">
                  <label className="block text-[12px] font-semibold text-neutral-600 mb-1">
                    House / Flat No
                  </label>
                  <input
                    type="text"
                    name="houseNo"
                    value={formData.houseNo}
                    onChange={handleInputChange}
                    className="w-full h-11 px-3.5 rounded-[12px] border border-neutral-300 focus:border-black outline-none font-medium"
                    required
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[12px] font-semibold text-neutral-600 mb-1">
                    Street / Colony / Area
                  </label>
                  <input
                    type="text"
                    name="street"
                    value={formData.street}
                    onChange={handleInputChange}
                    className="w-full h-11 px-3.5 rounded-[12px] border border-neutral-300 focus:border-black outline-none font-medium"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-[12px] font-semibold text-neutral-600 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="w-full h-11 px-3.5 rounded-[12px] border border-neutral-300 focus:border-black outline-none font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-neutral-600 mb-1">
                    State
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    className="w-full h-11 px-3.5 rounded-[12px] border border-neutral-300 focus:border-black outline-none font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-neutral-600 mb-1">
                    Pincode
                  </label>
                  <input
                    type="text"
                    name="pincode"
                    value={formData.pincode}
                    onChange={handleInputChange}
                    className="w-full h-11 px-3.5 rounded-[12px] border border-neutral-300 focus:border-black outline-none font-medium"
                    required
                  />
                </div>
              </div>

              {/* Product & Payment */}
              <div className="pt-2 border-t border-neutral-100 grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div className="sm:col-span-2">
                  <label className="block text-[12px] font-semibold text-neutral-600 mb-1">
                    Footwear Model
                  </label>
                  <select
                    name="productSlug"
                    value={formData.productSlug}
                    onChange={(e) => {
                      const slug = e.target.value;
                      const name =
                        slug === 'drop-hybrid-women'
                          ? 'SONU Hybrid RN'
                          : 'SONU Court Classic';
                      setFormData((p) => ({ ...p, productSlug: slug, productName: name }));
                    }}
                    className="w-full h-11 px-3.5 rounded-[12px] border border-neutral-300 focus:border-black outline-none font-medium bg-white"
                  >
                    <option value="drop-hybrid-women">SONU Hybrid RN (₹13,995)</option>
                    <option value="drop-court-men">SONU Court Classic (₹14,495)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-neutral-600 mb-1">
                    Size
                  </label>
                  <select
                    name="size"
                    value={formData.size}
                    onChange={handleInputChange}
                    className="w-full h-11 px-3.5 rounded-[12px] border border-neutral-300 focus:border-black outline-none font-medium bg-white"
                  >
                    <option value="UK 7">UK 7</option>
                    <option value="UK 8">UK 8</option>
                    <option value="UK 9">UK 9</option>
                    <option value="UK 10">UK 10</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[12px] font-semibold text-neutral-600 mb-1">
                    Payment Method
                  </label>
                  <select
                    name="paymentMethod"
                    value={formData.paymentMethod}
                    onChange={handleInputChange}
                    className="w-full h-11 px-3.5 rounded-[12px] border border-neutral-300 focus:border-black outline-none font-medium bg-white"
                  >
                    <option value="upi">Prepaid Full (UPI / Cards)</option>
                    <option value="partial_cod">Partial COD (₹200 Advance, Balance on Delivery)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-neutral-600 mb-1">
                    Pickup Location in Shiprocket
                  </label>
                  <input
                    type="text"
                    disabled
                    value="Home (Patna 800013)"
                    className="w-full h-11 px-3.5 rounded-[12px] bg-neutral-100 border border-neutral-200 text-neutral-500 font-medium cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 rounded-full bg-[#111111] hover:bg-black active:scale-[0.99] text-white text-[15px] font-bold transition-all shadow-md cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Placing & Syncing with Shiprocket...</span>
                    </>
                  ) : (
                    <span>🚀 Place Test Order & Push to Shiprocket</span>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Right: Real-time Dispatch Results & Actions */}
          <div className="lg:col-span-5 space-y-6">
            {/* Live Result Card */}
            <div className="bg-white border border-[#e5e5e5] rounded-[24px] p-6 sm:p-7 shadow-sm">
              <h2 className="text-[17px] font-bold text-[#111111] mb-4 flex items-center gap-2">
                <span>Dispatch Status & Output</span>
              </h2>

              {error && (
                <div className="p-4 rounded-[16px] bg-red-50 border border-red-200 text-red-700 text-[13px] mb-4">
                  <p className="font-bold">Error placing order:</p>
                  <p className="mt-0.5">{error}</p>
                </div>
              )}

              {cancelStatus && (
                <div className="p-4 rounded-[16px] bg-amber-50 border border-amber-200 text-amber-800 text-[13px] mb-4">
                  {cancelStatus}
                </div>
              )}

              {!result && !error && (
                <div className="py-12 px-4 text-center text-neutral-400 text-[13px]">
                  <div className="w-12 h-12 rounded-full bg-neutral-100 text-neutral-400 mx-auto flex items-center justify-center mb-3">
                    📦
                  </div>
                  Click <strong>&quot;Place Test Order&quot;</strong> to trigger real-time order creation and Shiprocket sync.
                </div>
              )}

              {result && (
                <div className="space-y-4">
                  <div className="p-4 rounded-[16px] bg-emerald-50 border border-emerald-200 text-emerald-800 space-y-2 text-[13px]">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[14px]">Order Placed Successfully!</span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[11px] font-bold">
                        {result.shiprocket?.status || 'CONFIRMED'}
                      </span>
                    </div>
                    <div className="pt-2 border-t border-emerald-200/60 space-y-1.5 font-mono text-[12px]">
                      <div className="flex justify-between">
                        <span className="text-emerald-700">Store Order ID:</span>
                        <span className="font-bold">{result.orderId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-emerald-700">Shiprocket Order ID:</span>
                        <span className="font-bold">{result.shiprocket?.order_id || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-emerald-700">Shipment ID:</span>
                        <span className="font-bold">{result.shiprocket?.shipment_id || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions for this test order */}
                  <div className="space-y-2 pt-2">
                    <Link
                      href={`/order/${result.orderId}`}
                      target="_blank"
                      className="w-full py-2.5 rounded-full bg-black hover:bg-neutral-800 text-white text-[13px] font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>Open Customer Tracking Page (/order/{result.orderId})</span>
                      <span>↗</span>
                    </Link>

                    <a
                      href={`http://localhost:3001/orders?id=${result.orderId}`}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full py-2.5 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-[13px] font-semibold transition-colors flex items-center justify-center gap-1.5"
                    >
                      Inspect in Admin Panel ↗
                    </a>

                    {result.shiprocket?.order_id && result.shiprocket?.status !== 'CANCELLED' && (
                      <button
                        type="button"
                        disabled={cancelling}
                        onClick={() =>
                          handleCancelOnShiprocket(result.orderId, result.shiprocket.order_id)
                        }
                        className="w-full py-2.5 rounded-full border border-red-300 hover:bg-red-50 text-red-700 text-[13px] font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        {cancelling ? 'Cancelling on Shiprocket...' : '❌ Cancel Order on Shiprocket'}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Account Info Pill */}
            <div className="p-4 rounded-[20px] bg-white border border-[#e5e5e5] text-[12px] space-y-1.5 text-neutral-600">
              <p className="font-bold text-[#111111]">Active Shiprocket Account Details:</p>
              <p>&bull; Email: <span className="font-mono text-[#111111]">imdyashodanand2006@gmail.com</span></p>
              <p>&bull; Company: <span className="font-mono text-[#111111]">Thilak</span></p>
              <p>&bull; Primary Pickup: <span className="font-mono text-[#111111]">Home (800013, Patna)</span></p>
            </div>
          </div>
        </div>

        {/* Bottom Section: Recent Orders in Database */}
        <div className="bg-white border border-[#e5e5e5] rounded-[24px] p-6 sm:p-8 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-[18px] font-bold text-[#111111]">
                Recent Database Orders ({recentOrders.length})
              </h3>
              <p className="text-[13px] text-neutral-500">
                Live list of orders placed in your MongoDB store with real-time Shiprocket status
              </p>
            </div>
            <button
              type="button"
              onClick={fetchRecentOrders}
              className="px-3.5 py-1.5 rounded-full border border-neutral-300 hover:border-black text-[12px] font-medium transition-colors"
            >
              {fetchingRecent ? 'Refreshing...' : '↻ Refresh'}
            </button>
          </div>

          {recentOrders.length === 0 ? (
            <p className="text-neutral-400 text-[13px] py-6 text-center">No orders found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[13px]">
                <thead>
                  <tr className="border-b border-neutral-200 text-neutral-400 font-medium text-[11px] uppercase tracking-wider">
                    <th className="pb-3">Order ID</th>
                    <th className="pb-3">Customer</th>
                    <th className="pb-3">Amount</th>
                    <th className="pb-3">Shiprocket ID</th>
                    <th className="pb-3">SR Status</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {recentOrders.map((ord) => (
                    <tr key={ord.orderId} className="hover:bg-neutral-50 transition-colors">
                      <td className="py-3.5 font-mono font-bold text-[#111111]">
                        {ord.orderId}
                      </td>
                      <td className="py-3.5">
                        <p className="font-medium text-[#111111]">{ord.customer?.name || 'Customer'}</p>
                        <p className="text-[11px] text-neutral-400">{ord.customer?.mobile}</p>
                      </td>
                      <td className="py-3.5 font-bold text-[#111111]">
                        ₹{(ord.totalAmount || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 font-mono text-[12px]">
                        {ord.shiprocket?.orderId ? (
                          <span className="text-purple-700 font-semibold">{ord.shiprocket.orderId}</span>
                        ) : (
                          <span className="text-neutral-400">—</span>
                        )}
                      </td>
                      <td className="py-3.5">
                        {ord.shiprocket?.status === 'CANCELLED' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-100 text-neutral-600">
                            CANCELLED
                          </span>
                        ) : ord.shiprocket?.orderId ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">
                            {ord.shiprocket.status || 'NEW'}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-100 text-neutral-500">
                            UNSYNCED
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 text-right space-x-2.5">
                        <Link
                          href={`/order/${ord.orderId}`}
                          target="_blank"
                          className="text-[12px] text-black hover:underline font-bold"
                        >
                          Track ↗
                        </Link>
                        <a
                          href={`http://localhost:3001/orders?id=${ord.orderId}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[12px] text-neutral-500 hover:text-black hover:underline font-medium"
                        >
                          Admin ↗
                        </a>
                        {ord.shiprocket?.orderId && ord.shiprocket?.status !== 'CANCELLED' && (
                          <button
                            type="button"
                            onClick={() =>
                              handleCancelOnShiprocket(ord.orderId, ord.shiprocket.orderId)
                            }
                            className="text-[12px] text-red-600 hover:underline font-medium cursor-pointer"
                          >
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
