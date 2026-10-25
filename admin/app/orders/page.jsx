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
  Printer,
  Copy,
  Calendar,
  AlertCircle,
  ArrowRight,
  Box,
} from 'lucide-react';

function OrdersContent() {
  const searchParams = useSearchParams();
  const initialId = searchParams.get('id');

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updatingAction, setUpdatingAction] = useState(null); // 'ready_to_ship' | 'request_pickup' | 'status_update'
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

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
        } else if (selectedOrder) {
          const refreshed = (json.orders || []).find((o) => o.orderId === selectedOrder.orderId);
          if (refreshed) setSelectedOrder(refreshed);
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

  // Step 1: Ready to Ship (Assign AWB & Courier)
  const handleReadyToShip = async (orderId) => {
    try {
      setUpdatingAction('ready_to_ship');
      const res = await fetch(`/api/orders/${orderId}/ready-to-ship`, {
        method: 'POST',
      });
      const data = await res.json();

      if (res.ok && data.success) {
        showToast(`✓ Marked Ready to Ship! AWB: ${data.awbCode}`);
        setOrders((prev) =>
          prev.map((o) => (o.orderId === orderId ? data.order : o))
        );
        setSelectedOrder(data.order);
      } else {
        alert(data.error || 'Failed to mark as Ready to Ship');
      }
    } catch (err) {
      console.error('Ready to ship error:', err);
      alert('Network error while marking Ready to Ship');
    } finally {
      setUpdatingAction(null);
    }
  };

  // Step 2: Request Pickup (Schedule Shiprocket courier arrival & fetch label)
  const handleRequestPickup = async (orderId) => {
    try {
      setUpdatingAction('request_pickup');
      const res = await fetch(`/api/orders/${orderId}/request-pickup`, {
        method: 'POST',
      });
      const data = await res.json();

      if (res.ok && data.success) {
        showToast(`✓ Courier Pickup Scheduled! Token: ${data.pickupToken}`);
        setOrders((prev) =>
          prev.map((o) => (o.orderId === orderId ? data.order : o))
        );
        setSelectedOrder(data.order);
      } else {
        alert(data.error || 'Failed to request pickup');
      }
    } catch (err) {
      console.error('Request pickup error:', err);
      alert('Network error while requesting pickup');
    } finally {
      setUpdatingAction(null);
    }
  };

  // Manual status override (shipped, delivered, cancelled)
  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      setUpdatingAction('status_update');
      const res = await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          fulfillmentStatus: newStatus,
        }),
      });

      if (res.ok) {
        showToast(`✓ Order status updated to ${newStatus}`);
        setOrders((prev) =>
          prev.map((ord) =>
            ord.orderId === orderId
              ? { ...ord, fulfillmentStatus: newStatus }
              : ord
          )
        );
        if (selectedOrder && selectedOrder.orderId === orderId) {
          setSelectedOrder((prev) => ({
            ...prev,
            fulfillmentStatus: newStatus,
          }));
        }
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setUpdatingAction(null);
    }
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    showToast(`Copied ${label} to clipboard!`);
  };

  const getStatusBadge = (status, shiprocket) => {
    if (status === 'delivered') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Delivered
        </span>
      );
    }
    if (status === 'shipped') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
          <Truck className="w-3.5 h-3.5" />
          In Transit
        </span>
      );
    }
    if (status === 'pickup_scheduled' || shiprocket?.status === 'PICKUP_SCHEDULED') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
          <Calendar className="w-3.5 h-3.5" />
          Pickup Scheduled
        </span>
      );
    }
    if (status === 'ready_to_ship' || shiprocket?.awbCode) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-medium bg-purple-50 text-purple-700 border border-purple-200">
          <Box className="w-3.5 h-3.5" />
          Ready to Ship
        </span>
      );
    }
    if (status === 'cancelled') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-medium bg-rose-50 text-rose-700 border border-rose-200">
          <XCircle className="w-3.5 h-3.5" />
          Cancelled
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
        <Clock className="w-3.5 h-3.5" />
        New Order
      </span>
    );
  };

  const tabs = [
    { id: 'all', label: 'All Orders' },
    { id: 'pending', label: 'New / Unfulfilled' },
    { id: 'ready_to_ship', label: 'Ready to Ship' },
    { id: 'pickup_scheduled', label: 'Pickup Scheduled' },
    { id: 'shipped', label: 'In Transit' },
    { id: 'delivered', label: 'Delivered' },
  ];

  return (
    <AdminShell>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-[#111111] text-white text-[13px] px-5 py-2.5 rounded-full shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top duration-200">
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="space-y-6">
        {/* Page Title & Search Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-[24px] font-bold tracking-tight text-[#111111]">
              Orders & Shiprocket Fulfillment
            </h2>
            <p className="text-[14px] text-neutral-500 mt-0.5">
              Manage order lifecycle: assign AWB, schedule courier pickup, print shipping labels.
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
                    <th className="py-3.5 px-6">Amount</th>
                    <th className="py-3.5 px-6">Fulfillment</th>
                    <th className="py-3.5 px-6">Courier / AWB</th>
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
                        })
                      : 'Recent';

                    const awb = ord.shiprocket?.awbCode;
                    const courier = ord.shiprocket?.courierName;

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
                          {getStatusBadge(ord.fulfillmentStatus, ord.shiprocket)}
                        </td>
                        <td className="py-4 px-6">
                          {awb ? (
                            <div>
                              <span className="font-mono text-[12px] font-bold text-[#111111] block">
                                {awb}
                              </span>
                              <span className="text-[11px] text-neutral-400">
                                {courier || 'Assigned'}
                              </span>
                            </div>
                          ) : (
                            <span className="text-[12px] text-neutral-400 italic">
                              Not assigned yet
                            </span>
                          )}
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
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[12px] font-medium border border-neutral-200 hover:border-black bg-white text-[#111111] transition-all cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Manage</span>
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

      {/* Order Detail & Fulfillment Action Drawer */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-end">
          <div
            className="fixed inset-0 bg-black/50 transition-opacity backdrop-blur-xs"
            onClick={() => setSelectedOrder(null)}
          />

          <div className="relative w-full max-w-[580px] bg-white h-full shadow-2xl flex flex-col z-10 overflow-y-auto">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-neutral-200 flex items-center justify-between sticky top-0 bg-white z-20">
              <div>
                <span className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider block">
                  Order Management
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                  <h3 className="text-[19px] font-bold text-[#111111] font-mono">
                    {selectedOrder.orderId}
                  </h3>
                  {getStatusBadge(selectedOrder.fulfillmentStatus, selectedOrder.shiprocket)}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-700 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 flex-1">
              
              {/* ORDER LIFECYCLE STEPPER */}
              <div className="p-4 rounded-[16px] bg-[#fbfbfb] border border-neutral-200/80">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 block mb-3">
                  Fulfillment Pipeline
                </span>
                <div className="flex items-center justify-between text-[11px] font-medium text-neutral-600 relative">
                  {/* Step 1: Placed */}
                  <div className="flex flex-col items-center gap-1 z-10">
                    <div className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold">
                      ✓
                    </div>
                    <span>Placed</span>
                  </div>

                  {/* Connecting Line 1 */}
                  <div className={`flex-1 h-[2px] mx-1 ${
                    selectedOrder.shiprocket?.awbCode ? 'bg-emerald-500' : 'bg-neutral-200'
                  }`} />

                  {/* Step 2: Ready to Ship */}
                  <div className="flex flex-col items-center gap-1 z-10">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold ${
                      selectedOrder.shiprocket?.awbCode
                        ? 'bg-emerald-500 text-white'
                        : selectedOrder.fulfillmentStatus === 'unfulfilled' || !selectedOrder.fulfillmentStatus
                        ? 'bg-[#111111] text-white ring-4 ring-neutral-100'
                        : 'bg-neutral-200 text-neutral-500'
                    }`}>
                      {selectedOrder.shiprocket?.awbCode ? '✓' : '2'}
                    </div>
                    <span className={selectedOrder.shiprocket?.awbCode ? 'text-[#111111] font-semibold' : ''}>
                      Ready to Ship
                    </span>
                  </div>

                  {/* Connecting Line 2 */}
                  <div className={`flex-1 h-[2px] mx-1 ${
                    selectedOrder.shiprocket?.status === 'PICKUP_SCHEDULED' || selectedOrder.fulfillmentStatus === 'pickup_scheduled' || selectedOrder.fulfillmentStatus === 'shipped' || selectedOrder.fulfillmentStatus === 'delivered'
                      ? 'bg-emerald-500'
                      : 'bg-neutral-200'
                  }`} />

                  {/* Step 3: Pickup Scheduled */}
                  <div className="flex flex-col items-center gap-1 z-10">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold ${
                      selectedOrder.fulfillmentStatus === 'pickup_scheduled' || selectedOrder.shiprocket?.status === 'PICKUP_SCHEDULED'
                        ? 'bg-[#111111] text-white ring-4 ring-neutral-100'
                        : selectedOrder.fulfillmentStatus === 'shipped' || selectedOrder.fulfillmentStatus === 'delivered'
                        ? 'bg-emerald-500 text-white'
                        : 'bg-neutral-200 text-neutral-500'
                    }`}>
                      {selectedOrder.fulfillmentStatus === 'shipped' || selectedOrder.fulfillmentStatus === 'delivered' ? '✓' : '3'}
                    </div>
                    <span>Pickup</span>
                  </div>

                  {/* Connecting Line 3 */}
                  <div className={`flex-1 h-[2px] mx-1 ${
                    selectedOrder.fulfillmentStatus === 'shipped' || selectedOrder.fulfillmentStatus === 'delivered'
                      ? 'bg-emerald-500'
                      : 'bg-neutral-200'
                  }`} />

                  {/* Step 4: In Transit / Delivered */}
                  <div className="flex flex-col items-center gap-1 z-10">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold ${
                      selectedOrder.fulfillmentStatus === 'delivered'
                        ? 'bg-emerald-500 text-white'
                        : selectedOrder.fulfillmentStatus === 'shipped'
                        ? 'bg-[#111111] text-white ring-4 ring-neutral-100'
                        : 'bg-neutral-200 text-neutral-500'
                    }`}>
                      {selectedOrder.fulfillmentStatus === 'delivered' ? '✓' : '4'}
                    </div>
                    <span>Delivered</span>
                  </div>
                </div>
              </div>

              {/* PRIMARY FULFILLMENT ACTION CARD */}
              <div className="p-5 rounded-[18px] bg-neutral-900 text-white space-y-3.5 shadow-md">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] uppercase font-bold tracking-wider text-neutral-400">
                    Next Required Action
                  </span>
                  {selectedOrder.shiprocket?.shipmentId && (
                    <span className="text-[11px] font-mono bg-white/10 px-2 py-0.5 rounded text-neutral-300">
                      Shipment #{selectedOrder.shiprocket.shipmentId}
                    </span>
                  )}
                </div>

                {/* State A: Not Ready to Ship Yet -> Show "Ready to Ship" Button */}
                {!selectedOrder.shiprocket?.awbCode && selectedOrder.fulfillmentStatus !== 'cancelled' && (
                  <div className="space-y-2">
                    <p className="text-[13px] text-neutral-300">
                      Order is packed. Click <strong className="text-white">Ready to Ship</strong> to assign the best courier and generate the Shiprocket AWB.
                    </p>
                    <button
                      type="button"
                      disabled={updatingAction === 'ready_to_ship'}
                      onClick={() => handleReadyToShip(selectedOrder.orderId)}
                      className="w-full py-3.5 px-4 rounded-xl bg-white text-black font-semibold text-[14px] hover:bg-neutral-200 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                    >
                      {updatingAction === 'ready_to_ship' ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin text-black" />
                          <span>Generating AWB with Shiprocket...</span>
                        </>
                      ) : (
                        <>
                          <Box className="w-4 h-4" />
                          <span>Ready to Ship (Assign AWB)</span>
                          <ArrowRight className="w-4 h-4 ml-1 opacity-60" />
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* State B: AWB Generated, Not Picked Up Yet -> Show "Request Pickup" Button */}
                {selectedOrder.shiprocket?.awbCode && selectedOrder.fulfillmentStatus !== 'pickup_scheduled' && selectedOrder.fulfillmentStatus !== 'shipped' && selectedOrder.fulfillmentStatus !== 'delivered' && selectedOrder.fulfillmentStatus !== 'cancelled' && (
                  <div className="space-y-2.5">
                    <div className="bg-white/10 p-3 rounded-xl flex items-center justify-between text-[13px]">
                      <div>
                        <span className="text-neutral-400 text-[11px] block">Assigned Courier</span>
                        <span className="font-semibold text-white">{selectedOrder.shiprocket.courierName || 'Delhivery Surface'}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-neutral-400 text-[11px] block">AWB Tracking Code</span>
                        <span className="font-mono font-bold text-white">{selectedOrder.shiprocket.awbCode}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={updatingAction === 'request_pickup'}
                      onClick={() => handleRequestPickup(selectedOrder.orderId)}
                      className="w-full py-3.5 px-4 rounded-xl bg-amber-400 text-neutral-950 font-bold text-[14px] hover:bg-amber-300 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                    >
                      {updatingAction === 'request_pickup' ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin text-neutral-950" />
                          <span>Scheduling Pickup with Courier...</span>
                        </>
                      ) : (
                        <>
                          <Truck className="w-4 h-4" />
                          <span>Request Pickup (Schedule Courier)</span>
                          <ArrowRight className="w-4 h-4 ml-1 opacity-60" />
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* State C: Pickup Scheduled -> Show Confirmation & Print Label Button */}
                {(selectedOrder.fulfillmentStatus === 'pickup_scheduled' || selectedOrder.shiprocket?.status === 'PICKUP_SCHEDULED') && (
                  <div className="space-y-3">
                    <div className="bg-emerald-950/60 border border-emerald-500/30 p-3.5 rounded-xl text-[13px]">
                      <div className="flex items-center gap-2 text-emerald-400 font-semibold mb-1">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Pickup Confirmed & Scheduled!</span>
                      </div>
                      <p className="text-neutral-300 text-[12px]">
                        Courier will arrive at the Patna pickup address. 
                        {selectedOrder.shiprocket?.pickupToken && (
                          <span className="block mt-1 font-mono text-white">
                            Token: {selectedOrder.shiprocket.pickupToken} &bull; Date: {selectedOrder.shiprocket.pickupScheduledDate || 'Today'}
                          </span>
                        )}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      {selectedOrder.shiprocket?.labelUrl && (
                        <a
                          href={selectedOrder.shiprocket.labelUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 py-3 px-4 rounded-xl bg-white text-black font-semibold text-[13.5px] hover:bg-neutral-200 transition-all flex items-center justify-center gap-2"
                        >
                          <Printer className="w-4 h-4" />
                          <span>Print Shipping Label</span>
                        </a>
                      )}

                      <button
                        type="button"
                        onClick={() => updateOrderStatus(selectedOrder.orderId, 'shipped')}
                        className="py-3 px-4 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-medium text-[13px] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Truck className="w-3.5 h-3.5" />
                        <span>Mark Handed Over</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* State D: Shipped */}
                {selectedOrder.fulfillmentStatus === 'shipped' && (
                  <div className="space-y-2">
                    <div className="bg-blue-950/60 border border-blue-500/30 p-3.5 rounded-xl text-[13px]">
                      <div className="flex items-center gap-2 text-blue-400 font-semibold mb-1">
                        <Truck className="w-4 h-4" />
                        <span>Parcel In Transit with Courier</span>
                      </div>
                      <p className="text-neutral-300 text-[12px]">
                        AWB: {selectedOrder.shiprocket?.awbCode || 'N/A'} &bull; Courier: {selectedOrder.shiprocket?.courierName || 'Delhivery'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => updateOrderStatus(selectedOrder.orderId, 'delivered')}
                      className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-semibold text-[13.5px] transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Mark as Delivered</span>
                    </button>
                  </div>
                )}

                {/* State E: Delivered */}
                {selectedOrder.fulfillmentStatus === 'delivered' && (
                  <div className="bg-emerald-950/60 border border-emerald-500/30 p-3.5 rounded-xl text-[13px] text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Order successfully fulfilled and delivered to customer.</span>
                  </div>
                )}
              </div>

              {/* SHIPROCKET LOGISTICS SPEC SHEET */}
              {selectedOrder.shiprocket && (
                <div className="p-4 rounded-[16px] bg-[#f9fafb] border border-neutral-200 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-semibold text-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5 text-neutral-600" />
                      Shiprocket Logistics Sync
                    </span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-purple-100 text-purple-800">
                      {selectedOrder.shiprocket.status || 'SYNCED'}
                    </span>
                  </div>

                  <div className="text-[13px] text-neutral-700 space-y-2 pt-1 border-t border-neutral-200">
                    <div className="flex justify-between items-center">
                      <span className="text-neutral-500">SR Order ID:</span>
                      <span className="font-mono font-medium">{selectedOrder.shiprocket.orderId || 'N/A'}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-neutral-500">Shipment ID:</span>
                      <span className="font-mono font-medium">{selectedOrder.shiprocket.shipmentId || 'N/A'}</span>
                    </div>

                    {selectedOrder.shiprocket.courierName && (
                      <div className="flex justify-between items-center">
                        <span className="text-neutral-500">Courier Partner:</span>
                        <span className="font-medium text-[#111111]">{selectedOrder.shiprocket.courierName}</span>
                      </div>
                    )}

                    {selectedOrder.shiprocket.awbCode && (
                      <div className="flex justify-between items-center bg-white p-2 rounded-lg border border-neutral-200">
                        <div>
                          <span className="text-neutral-400 text-[11px] block">AWB Number</span>
                          <span className="font-mono font-bold text-[#111111] text-[14px]">
                            {selectedOrder.shiprocket.awbCode}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(selectedOrder.shiprocket.awbCode, 'AWB Code')}
                          className="p-1.5 rounded bg-neutral-100 hover:bg-neutral-200 text-neutral-700 transition-colors"
                          title="Copy AWB"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    {selectedOrder.shiprocket.pickupToken && (
                      <div className="flex justify-between items-center">
                        <span className="text-neutral-500">Pickup Token:</span>
                        <span className="font-mono font-bold text-neutral-800">{selectedOrder.shiprocket.pickupToken}</span>
                      </div>
                    )}

                    <div className="flex justify-between items-center pt-1 border-t border-neutral-200">
                      <span className="text-neutral-500">Pickup Location:</span>
                      <span className="font-medium text-neutral-800">Home (Patna, Bihar - 800013)</span>
                    </div>
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
                  <span>Total Amount</span>
                  <span>₹{(selectedOrder.totalAmount || 13995).toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Quick Status Adjustments */}
              <div className="pt-2">
                <span className="text-[12px] font-semibold text-neutral-400 uppercase tracking-wider block mb-2">
                  Override Status
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => updateOrderStatus(selectedOrder.orderId, 'pending')}
                    className="px-3 py-1.5 rounded-full text-[12px] font-medium bg-neutral-100 hover:bg-neutral-200 text-neutral-700 transition-colors cursor-pointer"
                  >
                    Reset to Pending
                  </button>
                  <button
                    type="button"
                    onClick={() => updateOrderStatus(selectedOrder.orderId, 'shipped')}
                    className="px-3 py-1.5 rounded-full text-[12px] font-medium bg-blue-100 hover:bg-blue-200 text-blue-800 transition-colors cursor-pointer"
                  >
                    Set In Transit
                  </button>
                  <button
                    type="button"
                    onClick={() => updateOrderStatus(selectedOrder.orderId, 'delivered')}
                    className="px-3 py-1.5 rounded-full text-[12px] font-medium bg-emerald-100 hover:bg-emerald-200 text-emerald-800 transition-colors cursor-pointer"
                  >
                    Set Delivered
                  </button>
                  <button
                    type="button"
                    onClick={() => updateOrderStatus(selectedOrder.orderId, 'cancelled')}
                    className="px-3 py-1.5 rounded-full text-[12px] font-medium bg-rose-100 hover:bg-rose-200 text-rose-800 transition-colors cursor-pointer"
                  >
                    Cancel Order
                  </button>
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
                Close Drawer
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
