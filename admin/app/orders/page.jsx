'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import AdminShell from '@/components/AdminShell';
import {
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Truck,
  XCircle,
  X,
  ExternalLink,
  ChevronRight,
  Eye,
  RefreshCw,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Package,
} from 'lucide-react';

function OrdersContent() {
  const searchParams = useSearchParams();
  const initialId = searchParams.get('id');

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [trackingInput, setTrackingInput] = useState('');

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const url = new URL('/api/orders', window.location.origin);
      if (activeTab !== 'all') url.searchParams.set('status', activeTab);
      if (searchQuery.trim()) url.searchParams.set('q', searchQuery.trim());

      const res = await fetch(url.toString());
      if (res.ok) {
        const json = await res.json();
        setOrders(json.orders || []);
        if (initialId) {
          const match = (json.orders || []).find((o) => o.orderId === initialId);
          if (match) setSelectedOrder(match);
        }
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [activeTab]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchOrders();
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      setUpdatingStatus(true);
      const res = await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          fulfillmentStatus: newStatus,
          trackingNumber: trackingInput.trim() || undefined,
        }),
      });

      if (res.ok) {
        setOrders((prev) =>
          prev.map((ord) =>
            ord.orderId === orderId
              ? {
                  ...ord,
                  fulfillmentStatus: newStatus,
                  trackingNumber: trackingInput.trim() || ord.trackingNumber,
                }
              : ord
          )
        );

        if (selectedOrder && selectedOrder.orderId === orderId) {
          setSelectedOrder((prev) => ({
            ...prev,
            fulfillmentStatus: newStatus,
            trackingNumber: trackingInput.trim() || prev.trackingNumber,
          }));
        }
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Delivered
          </span>
        );
      case 'shipped':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
            <Truck className="w-3.5 h-3.5" />
            In Transit / Shipped
          </span>
        );
      case 'processing':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3.5 h-3.5" />
            Processing
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-medium bg-neutral-100 text-neutral-700 border border-neutral-200">
            <Clock className="w-3.5 h-3.5" />
            Pending Dispatch
          </span>
        );
    }
  };

  const tabs = [
    { id: 'all', label: 'All Orders' },
    { id: 'pending', label: 'Pending' },
    { id: 'processing', label: 'Processing' },
    { id: 'shipped', label: 'Shipped' },
    { id: 'delivered', label: 'Delivered' },
  ];

  return (
    <AdminShell>
      <div className="space-y-6">
        {/* Page Title & Search Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-[24px] font-bold tracking-tight text-[#111111]">
              Orders Management
            </h2>
            <p className="text-[14px] text-neutral-500 mt-0.5">
              Track customer purchases, fulfillment status, and courier dispatch.
            </p>
          </div>

          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search Order ID, Name, Phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-[240px] sm:w-[280px] h-10 pl-9 pr-3 rounded-full border border-neutral-200 bg-white text-[13px] outline-none focus:border-[#111111] transition-all"
              />
            </div>
            <button
              type="submit"
              className="h-10 px-4 rounded-full bg-[#111111] text-white text-[13px] font-medium hover:bg-black transition-all cursor-pointer"
            >
              Filter
            </button>
            <button
              type="button"
              onClick={fetchOrders}
              className="w-10 h-10 rounded-full border border-neutral-200 bg-white flex items-center justify-center text-neutral-600 hover:text-black transition-all cursor-pointer"
              title="Refresh"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </form>
        </div>

        {/* Tab Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-neutral-200/80">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`pb-3 px-3 text-[14px] font-medium border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'border-[#111111] text-[#111111]'
                    : 'border-transparent text-neutral-400 hover:text-neutral-700'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Orders Table Container */}
        <div className="bg-white rounded-[20px] border border-neutral-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.02)] overflow-hidden">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-neutral-400">
              <RefreshCw className="w-6 h-6 animate-spin mb-2" />
              <p className="text-[14px]">Loading orders from MongoDB...</p>
            </div>
          ) : orders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-neutral-50/80 border-b border-neutral-100 text-[12px] font-semibold text-neutral-500 uppercase tracking-wider">
                    <th className="py-3.5 px-6">Order ID</th>
                    <th className="py-3.5 px-6">Customer</th>
                    <th className="py-3.5 px-6">Products</th>
                    <th className="py-3.5 px-6">Total Amount</th>
                    <th className="py-3.5 px-6">Fulfillment</th>
                    <th className="py-3.5 px-6">Date</th>
                    <th className="py-3.5 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 text-[14px]">
                  {orders.map((ord) => {
                    const customerName =
                      ord.customer?.name ||
                      `${ord.customer?.firstName || ''} ${ord.customer?.lastName || ''}`.trim() ||
                      'Customer';
                    const items = ord.items || [];
                    const firstItem = items[0];
                    const itemCount = items.reduce((s, it) => s + (it.quantity || 1), 0);
                    const dateFormatted = ord.createdAt
                      ? new Date(ord.createdAt).toLocaleDateString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })
                      : 'Recent';

                    return (
                      <tr
                        key={ord.orderId}
                        onClick={() => setSelectedOrder(ord)}
                        className="group hover:bg-neutral-50/70 transition-colors cursor-pointer"
                      >
                        <td className="py-4 px-6 font-mono font-medium text-[#111111]">
                          {ord.orderId}
                        </td>
                        <td className="py-4 px-6">
                          <p className="font-medium text-[#111111]">{customerName}</p>
                          <p className="text-[12px] text-neutral-400">
                            {ord.customer?.mobile || ord.customer?.email || 'Store User'}
                          </p>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2.5">
                            {firstItem?.image && (
                              <img
                                src={firstItem.image}
                                alt=""
                                className="w-10 h-10 rounded-lg bg-neutral-100 object-contain p-0.5 shrink-0"
                              />
                            )}
                            <div className="min-w-0">
                              <p className="font-medium text-[#111111] text-[13px] truncate max-w-[180px]">
                                {firstItem?.name || 'Footwear item'}
                              </p>
                              <p className="text-[11px] text-neutral-400">
                                {itemCount} {itemCount === 1 ? 'item' : 'items'} &bull; {firstItem?.size || 'UK 8'}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6 font-bold text-[#111111]">
                          ₹{(ord.totalAmount || 13995).toLocaleString('en-IN')}
                        </td>
                        <td className="py-4 px-6">
                          {getStatusBadge(ord.fulfillmentStatus)}
                        </td>
                        <td className="py-4 px-6 text-[13px] text-neutral-500">
                          {dateFormatted}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedOrder(ord);
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[12px] font-medium border border-neutral-200 hover:border-black bg-white text-[#111111] transition-all"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Inspect</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-16 text-center">
              <Package className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
              <h3 className="text-[16px] font-medium text-[#111111]">No orders found</h3>
              <p className="text-[13px] text-neutral-400 mt-1">
                Try switching filter tabs or clearing your search query.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Order Detail Inspection Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-end">
          <div
            className="fixed inset-0 bg-black/50 transition-opacity"
            onClick={() => setSelectedOrder(null)}
          />

          <div className="relative w-full max-w-[560px] bg-white h-full shadow-2xl flex flex-col z-10 overflow-y-auto">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-neutral-200 flex items-center justify-between sticky top-0 bg-white z-20">
              <div>
                <span className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider">
                  Order Details
                </span>
                <h3 className="text-[18px] font-bold text-[#111111]">
                  {selectedOrder.orderId}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 flex-1">
              {/* Status Section */}
              <div className="p-4 rounded-[16px] bg-neutral-50 border border-neutral-200/80">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[13px] font-medium text-neutral-500">
                    Fulfillment Status
                  </span>
                  <div>{getStatusBadge(selectedOrder.fulfillmentStatus)}</div>
                </div>

                <div className="flex flex-wrap gap-2 pt-2 border-t border-neutral-200">
                  <button
                    type="button"
                    disabled={updatingStatus}
                    onClick={() => updateOrderStatus(selectedOrder.orderId, 'processing')}
                    className="px-3 py-1.5 rounded-full text-[12px] font-medium bg-amber-100 text-amber-800 hover:bg-amber-200 transition-all cursor-pointer"
                  >
                    Set Processing
                  </button>
                  <button
                    type="button"
                    disabled={updatingStatus}
                    onClick={() => updateOrderStatus(selectedOrder.orderId, 'shipped')}
                    className="px-3 py-1.5 rounded-full text-[12px] font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 transition-all cursor-pointer"
                  >
                    Set Shipped
                  </button>
                  <button
                    type="button"
                    disabled={updatingStatus}
                    onClick={() => updateOrderStatus(selectedOrder.orderId, 'delivered')}
                    className="px-3 py-1.5 rounded-full text-[12px] font-medium bg-emerald-100 text-emerald-800 hover:bg-emerald-200 transition-all cursor-pointer"
                  >
                    Set Delivered
                  </button>
                </div>
              </div>

              {/* Shiprocket Logistics Card */}
              {selectedOrder.shiprocket && (
                <div className="p-4 rounded-[16px] bg-[#f9fafb] border border-neutral-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-semibold text-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5 text-neutral-600" />
                      Shiprocket Logistics
                    </span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-purple-100 text-purple-800">
                      {selectedOrder.shiprocket.status || 'SYNCED'}
                    </span>
                  </div>
                  <div className="text-[13px] text-neutral-700 space-y-1 pt-1 border-t border-neutral-200">
                    <div className="flex justify-between">
                      <span className="text-neutral-500">SR Order ID:</span>
                      <span className="font-mono font-medium">{selectedOrder.shiprocket.orderId || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Shipment ID:</span>
                      <span className="font-mono font-medium">{selectedOrder.shiprocket.shipmentId || 'N/A'}</span>
                    </div>
                    {selectedOrder.shiprocket.awbCode && (
                      <div className="flex justify-between">
                        <span className="text-neutral-500">AWB Code:</span>
                        <span className="font-mono font-bold text-[#111111]">{selectedOrder.shiprocket.awbCode}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Items Breakdown */}
              <div>
                <h4 className="text-[14px] font-semibold text-[#111111] mb-3">
                  Ordered Footwear ({selectedOrder.items?.length || 0})
                </h4>
                <div className="space-y-3">
                  {selectedOrder.items?.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-4 p-3 rounded-[12px] border border-neutral-200"
                    >
                      <div className="w-14 h-14 rounded-lg bg-neutral-100 shrink-0 overflow-hidden flex items-center justify-center">
                        <img
                          src={item.image || '/images/ad22b92Nike-HQ2593-502_1.avif'}
                          alt={item.name}
                          className="w-full h-full object-contain p-1"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h5 className="font-semibold text-[14px] text-[#111111] truncate">
                          {item.name}
                        </h5>
                        <p className="text-[12px] text-neutral-400 mt-0.5">
                          Size: <span className="font-medium text-neutral-700">{item.size || 'UK 8'}</span> &bull; Qty: {item.quantity || 1}
                        </p>
                        <p className="text-[13px] font-bold text-[#111111] mt-1">
                          ₹{(item.priceNumber || 13995).toLocaleString('en-IN')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Customer & Delivery Information */}
              <div className="space-y-3">
                <h4 className="text-[14px] font-semibold text-[#111111]">
                  Shipping Address
                </h4>
                <div className="p-4 rounded-[16px] border border-neutral-200 space-y-2 text-[13px] text-neutral-600">
                  <p className="font-semibold text-[#111111] text-[14px]">
                    {selectedOrder.customer?.name || 'Customer'}
                  </p>
                  {selectedOrder.customer?.mobile && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-neutral-400" />
                      <span>+91 {selectedOrder.customer.mobile}</span>
                    </div>
                  )}
                  {selectedOrder.customer?.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-neutral-400" />
                      <span>{selectedOrder.customer.email}</span>
                    </div>
                  )}
                  <div className="flex items-start gap-2 pt-1 border-t border-neutral-100 text-neutral-700">
                    <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0 mt-0.5" />
                    <p>
                      {[
                        selectedOrder.customer?.address?.houseNo,
                        selectedOrder.customer?.address?.street,
                        selectedOrder.customer?.address?.landmark,
                        selectedOrder.customer?.address?.city,
                        selectedOrder.customer?.address?.state,
                        selectedOrder.customer?.address?.pincode,
                      ]
                        .filter(Boolean)
                        .join(', ') || 'No address details recorded'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Financial Breakdown */}
              <div className="p-4 rounded-[16px] bg-neutral-50 border border-neutral-200 space-y-2 text-[13px]">
                <div className="flex justify-between text-neutral-500">
                  <span>Subtotal</span>
                  <span>₹{(selectedOrder.totalAmount || 13995).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-neutral-500">
                  <span>Standard Shipping</span>
                  <span className="text-emerald-600 font-medium">Free</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-neutral-200 font-bold text-[#111111] text-[15px]">
                  <span>Total Amount Paid</span>
                  <span>₹{(selectedOrder.totalAmount || 13995).toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="p-6 border-t border-neutral-200 bg-white sticky bottom-0">
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="w-full py-3 rounded-full bg-[#111111] text-white text-[14px] font-medium hover:bg-black transition-all cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}

export default function OrdersPage() {
  return (
    <Suspense fallback={<div className="p-8 text-neutral-500">Loading orders...</div>}>
      <OrdersContent />
    </Suspense>
  );
}
