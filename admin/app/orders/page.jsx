'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import AdminShell from '@/components/AdminShell';
import {
  Search,
  ChevronDown,
  RefreshCw,
  Plus,
  Calendar,
  Filter,
  Download,
  Layers,
  ShoppingCart,
  ShieldCheck,
  Eye,
  EyeOff,
  AlertTriangle,
  ArrowDown,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  X,
  Copy,
  Printer,
  Truck,
  Box,
  CheckCircle2,
  Clock,
  Phone,
  Mail,
  MapPin,
  ExternalLink,
} from 'lucide-react';

function OrdersContent() {
  const searchParams = useSearchParams();
  const initialId = searchParams.get('id');

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('new'); // 'new' | 'ready_to_ship' | 'pickups' | 'in_transit' | 'delivered' | 'rto' | 'all'
  const [activeSubTab, setActiveSubTab] = useState('new'); // 'new' | 'duplicate' | 'on_hold'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [unmaskedPhones, setUnmaskedPhones] = useState({});
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [actionLoading, setActionLoading] = useState(null); // orderId
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [dateRange, setDateRange] = useState('Last 30 days');
  const [itemsPerPage, setItemsPerPage] = useState(15);
  const [currentPage, setCurrentPage] = useState(1);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleWindowClick = () => setOpenDropdownId(null);
    window.addEventListener('click', handleWindowClick);
    return () => window.removeEventListener('click', handleWindowClick);
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const url = new URL('/api/orders', window.location.origin);
      if (searchQuery.trim()) url.searchParams.set('q', searchQuery.trim());

      const res = await fetch(url.toString());
      if (res.ok) {
        const json = await res.json();
        const fetched = json.orders || [];
        setOrders(fetched);
        if (initialId) {
          const match = fetched.find((o) => o.orderId === initialId);
          if (match) setSelectedOrder(match);
        } else if (selectedOrder) {
          const refreshed = fetched.find((o) => o.orderId === selectedOrder.orderId);
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
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchOrders();
  };

  // Toggle phone number mask
  const togglePhoneMask = (orderId, e) => {
    e.stopPropagation();
    setUnmaskedPhones((prev) => ({
      ...prev,
      [orderId]: !prev[orderId],
    }));
  };

  // Select all checkbox
  const toggleSelectAll = () => {
    if (selectedOrders.length === filteredOrders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(filteredOrders.map((o) => o.orderId));
    }
  };

  const toggleSelectRow = (orderId, e) => {
    e.stopPropagation();
    setSelectedOrders((prev) =>
      prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId]
    );
  };

  // Step 1: Ship Now (Assign AWB & Courier)
  const handleShipNow = async (orderId, e) => {
    if (e) e.stopPropagation();
    try {
      setActionLoading(orderId);
      const res = await fetch(`/api/orders/${orderId}/ready-to-ship`, {
        method: 'POST',
      });
      const data = await res.json();

      if (res.ok && data.success) {
        showToast(`✓ Order ${orderId} marked Ready to Ship! AWB: ${data.awbCode}`);
        setOrders((prev) =>
          prev.map((o) => (o.orderId === orderId ? data.order : o))
        );
        if (selectedOrder && selectedOrder.orderId === orderId) {
          setSelectedOrder(data.order);
        }
      } else {
        alert(data.error || 'Failed to process shipment');
      }
    } catch (err) {
      console.error('Ship Now error:', err);
      alert('Network error while processing shipment');
    } finally {
      setActionLoading(null);
    }
  };

  // Step 2: Request Pickup
  const handleRequestPickup = async (orderId, e) => {
    if (e) e.stopPropagation();
    try {
      setActionLoading(orderId);
      const res = await fetch(`/api/orders/${orderId}/request-pickup`, {
        method: 'POST',
      });
      const data = await res.json();

      if (res.ok && data.success) {
        showToast(`✓ Courier pickup scheduled! Token: ${data.pickupToken}`);
        setOrders((prev) =>
          prev.map((o) => (o.orderId === orderId ? data.order : o))
        );
        if (selectedOrder && selectedOrder.orderId === orderId) {
          setSelectedOrder(data.order);
        }
      } else {
        alert(data.error || 'Failed to schedule pickup');
      }
    } catch (err) {
      console.error('Request pickup error:', err);
      alert('Network error while requesting pickup');
    } finally {
      setActionLoading(null);
    }
  };

  // Status override (delivered, shipped, cancelled)
  const updateStatus = async (orderId, newStatus) => {
    try {
      setActionLoading(orderId);
      const res = await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          fulfillmentStatus: newStatus,
        }),
      });

      if (res.ok) {
        showToast(`✓ Status updated to ${newStatus}`);
        setOrders((prev) =>
          prev.map((ord) =>
            ord.orderId === orderId ? { ...ord, fulfillmentStatus: newStatus } : ord
          )
        );
        if (selectedOrder && selectedOrder.orderId === orderId) {
          setSelectedOrder((prev) => ({ ...prev, fulfillmentStatus: newStatus }));
        }
      }
    } catch (err) {
      console.error('Status update error:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard?.writeText(text);
    showToast(`Copied ${label} to clipboard!`);
  };

  // Filter orders by tab
  const filteredOrders = useMemo(() => {
    return orders.filter((ord) => {
      const status = (ord.fulfillmentStatus || ord.shiprocket?.status || 'new').toLowerCase();
      if (activeTab === 'new') {
        return (
          status === 'new' ||
          status === 'pending' ||
          status === 'unfulfilled' ||
          status === 'confirmed' ||
          !ord.fulfillmentStatus
        );
      }
      if (activeTab === 'ready_to_ship') {
        return status === 'ready_to_ship';
      }
      if (activeTab === 'pickups') {
        return status === 'pickup_scheduled';
      }
      if (activeTab === 'in_transit') {
        return status === 'shipped' || status === 'in_transit';
      }
      if (activeTab === 'delivered') {
        return status === 'delivered';
      }
      if (activeTab === 'rto') {
        return status === 'cancelled' || status === 'rto';
      }
      return true; // 'all'
    });
  }, [orders, activeTab]);

  // Tab counts
  const tabCounts = useMemo(() => {
    const counts = {
      new: 0,
      ready_to_ship: 0,
      pickups: 0,
      in_transit: 0,
      delivered: 0,
      rto: 0,
      all: orders.length,
    };
    orders.forEach((ord) => {
      const status = (ord.fulfillmentStatus || ord.shiprocket?.status || 'new').toLowerCase();
      if (
        status === 'new' ||
        status === 'pending' ||
        status === 'unfulfilled' ||
        status === 'confirmed' ||
        !ord.fulfillmentStatus
      ) {
        counts.new += 1;
      } else if (status === 'ready_to_ship') {
        counts.ready_to_ship += 1;
      } else if (status === 'pickup_scheduled') {
        counts.pickups += 1;
      } else if (status === 'shipped' || status === 'in_transit') {
        counts.in_transit += 1;
      } else if (status === 'delivered') {
        counts.delivered += 1;
      } else if (status === 'cancelled' || status === 'rto') {
        counts.rto += 1;
      }
    });
    return counts;
  }, [orders]);

  const navTabs = [
    { id: 'new', label: 'New' },
    { id: 'ready_to_ship', label: 'Ready To Ship' },
    { id: 'pickups', label: 'Pickups & Manifests' },
    { id: 'in_transit', label: 'In Transit' },
    { id: 'delivered', label: 'Delivered' },
    { id: 'rto', label: 'RTO' },
    { id: 'all', label: 'All' },
  ];

  return (
    <AdminShell>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-[#111111] text-white text-[13px] px-5 py-2.5 rounded-full shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top duration-200">
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="w-full font-['Helvetica_Now_Text',sans-serif] text-[#111111]">
        
        {/* 1. TOP HEADER BAR */}
        <div className="bg-white border-b border-neutral-200/80 -mt-4 sm:-mt-6 -mx-4 sm:-mx-6 px-6 py-3.5 mb-5 shadow-2xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            {/* Left: Orders Title & Domestic Dropdown */}
            <div className="flex items-center gap-3">
              <h1 className="text-[22px] font-bold text-[#111111] tracking-tight">
                Orders
              </h1>
              <button
                type="button"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-neutral-300 bg-white hover:bg-neutral-50 text-[13px] font-medium text-[#111111] shadow-2xs transition-colors cursor-pointer"
              >
                <span>Domestic</span>
                <ChevronDown className="w-3.5 h-3.5 text-neutral-500" />
              </button>
            </div>

            {/* Center: Search Group */}
            <div className="flex-1 max-w-[540px]">
              <form onSubmit={handleSearchSubmit} className="flex items-center border border-neutral-300 rounded-lg bg-white overflow-hidden shadow-2xs focus-within:border-[#7352f7] transition-all">
                <button
                  type="button"
                  className="flex items-center gap-1 px-3 py-2 text-[12.5px] font-medium text-neutral-700 hover:bg-neutral-50 border-r border-neutral-200 shrink-0 cursor-pointer"
                >
                  <span>Last one year</span>
                  <ChevronDown className="w-3 h-3 text-neutral-500" />
                </button>
                <div className="flex items-center gap-2 px-3 flex-1">
                  <Search className="w-4 h-4 text-neutral-400 shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search via 'Buyer Email' or Order ID"
                    className="w-full py-2 text-[13px] outline-none text-[#111111] placeholder:text-neutral-400 bg-transparent"
                  />
                </div>
              </form>
            </div>

            {/* Right: + Add Order & Sync Orders */}
            <div className="flex items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => showToast('Opening Add Order wizard...')}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#6c47ff] hover:bg-[#5b36e8] text-white text-[13px] font-semibold transition-all shadow-xs cursor-pointer active:scale-[0.98]"
              >
                <Plus className="w-4 h-4" />
                <span>Add Order</span>
              </button>

              <button
                type="button"
                onClick={fetchOrders}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-neutral-300 bg-white hover:bg-neutral-50 text-[13px] font-medium text-[#111111] shadow-2xs transition-colors cursor-pointer"
                title="Sync Orders"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-neutral-600 ${loading ? 'animate-spin' : ''}`} />
                <span>Sync Orders</span>
              </button>
            </div>

          </div>
        </div>

        {/* 2. PRIMARY NAVIGATION TABS */}
        <div className="flex items-center gap-8 border-b border-neutral-200 overflow-x-auto scrollbar-none mb-3">
          {navTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const count = tabCounts[tab.id];
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`pb-3 text-[14px] font-semibold transition-all cursor-pointer whitespace-nowrap relative ${
                  isActive
                    ? 'text-[#6c47ff] border-b-2 border-[#6c47ff]'
                    : 'text-neutral-500 hover:text-neutral-900 border-b-2 border-transparent'
                }`}
              >
                <span>{tab.label}</span>
                {count > 0 && tab.id !== 'all' && (
                  <span className={`ml-1.5 text-[11px] px-1.5 py-0.2 rounded-full font-bold ${
                    isActive ? 'bg-[#ede8ff] text-[#6c47ff]' : 'bg-neutral-100 text-neutral-500'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* 3. SECONDARY SUB-TABS (When on New tab) */}
        {activeTab === 'new' && (
          <div className="flex items-center gap-2 mb-4">
            <button
              type="button"
              onClick={() => setActiveSubTab('new')}
              className={`px-3 py-1 rounded-md text-[12px] font-semibold transition-all cursor-pointer ${
                activeSubTab === 'new'
                  ? 'bg-[#f4f0ff] text-[#6c47ff] border border-[#d8caff]'
                  : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-50'
              }`}
            >
              New
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('duplicate')}
              className={`px-3 py-1 rounded-md text-[12px] font-medium transition-all cursor-pointer ${
                activeSubTab === 'duplicate'
                  ? 'bg-[#f4f0ff] text-[#6c47ff] border border-[#d8caff]'
                  : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-50'
              }`}
            >
              Duplicate Orders
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('on_hold')}
              className={`px-3 py-1 rounded-md text-[12px] font-medium transition-all cursor-pointer ${
                activeSubTab === 'on_hold'
                  ? 'bg-[#f4f0ff] text-[#6c47ff] border border-[#d8caff]'
                  : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-50'
              }`}
            >
              On Hold
            </button>
          </div>
        )}

        {/* 4. FILTER CONTROLS & BULK ACTIONS */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
          
          {/* Left: Date Filter & More Filters */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-neutral-300 bg-white hover:bg-neutral-50 text-[12.5px] font-medium text-neutral-800 shadow-2xs transition-colors cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5 text-neutral-500" />
              <span>{dateRange}</span>
              <ChevronDown className="w-3.5 h-3.5 text-neutral-500 ml-1" />
            </button>

            <button
              type="button"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-neutral-300 bg-white hover:bg-neutral-50 text-[12.5px] font-medium text-neutral-800 shadow-2xs transition-colors cursor-pointer"
            >
              <Filter className="w-3.5 h-3.5 text-neutral-500" />
              <span>More Filters</span>
            </button>
          </div>

          {/* Right: Bulk Action Icons & Dropdown */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="p-2 rounded-md border border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-600 shadow-2xs transition-colors cursor-pointer"
              title="Bulk Edit"
            >
              <Layers className="w-4 h-4" />
            </button>

            <button
              type="button"
              className="p-2 rounded-md border border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-600 shadow-2xs transition-colors cursor-pointer"
              title="Export Orders"
            >
              <Download className="w-4 h-4" />
            </button>

            <button
              type="button"
              className="flex items-center gap-1 px-3 py-1.5 rounded-md border border-neutral-300 bg-white text-[12.5px] text-neutral-500 shadow-2xs hover:bg-neutral-50 transition-colors cursor-pointer"
            >
              <span>Select Bulk Action</span>
              <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
            </button>
          </div>

        </div>

        {/* Counter Text */}
        <p className="text-[12.5px] text-neutral-500 mb-2 font-normal">
          {filteredOrders.length} {filteredOrders.length === 1 ? 'Order' : 'Orders'} for {dateRange}
        </p>

        {/* 5. ORDERS TABLE */}
        <div className="w-full overflow-x-auto scrollbar-none pb-4">
          
          {/* Table Header Row */}
          <div className="grid grid-cols-[36px_190px_230px_200px_160px_120px_120px_90px_120px] gap-3 px-4 py-2.5 text-[12px] font-bold text-neutral-700 uppercase tracking-wider border-b border-neutral-200 bg-neutral-50/60 rounded-t-lg min-w-[1266px]">
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={selectedOrders.length > 0 && selectedOrders.length === filteredOrders.length}
                onChange={toggleSelectAll}
                className="w-4 h-4 rounded text-[#6c47ff] focus:ring-[#6c47ff] cursor-pointer"
              />
            </div>
            <div>Order Details</div>
            <div>Customer details</div>
            <div>Product Details</div>
            <div>Package Details</div>
            <div>Payment</div>
            <div>Pickup Address</div>
            <div>Status</div>
            <div className="text-right pr-2">Action</div>
          </div>

          {/* Table Body / Order Cards */}
          {loading ? (
            <div className="py-24 text-center bg-white rounded-b-lg border border-neutral-200">
              <RefreshCw className="w-6 h-6 animate-spin text-[#6c47ff] mx-auto mb-2" />
              <p className="text-[14px] text-neutral-500 font-medium">Loading orders from MongoDB & Shiprocket...</p>
            </div>
          ) : filteredOrders.length > 0 ? (
            <div className="space-y-2.5 mt-2.5 min-w-[1266px]">
              {filteredOrders.map((ord) => {
                const customer = ord.customer || {};
                const customerName = customer.name || `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || 'Randhir Kumar';
                const email = customer.email || 'thilak8797@gmail.com';
                const rawPhone = customer.mobile || '8008439762';
                const isPhoneUnmasked = !!unmaskedPhones[ord.orderId];
                const displayPhone = isPhoneUnmasked ? `+91 ${rawPhone}` : 'xxxxxxxxxx';

                const addr = customer.address || {};
                const fullAddress = typeof addr === 'string' ? addr : [addr.houseNo, addr.street, addr.city, addr.state, addr.pincode].filter(Boolean).join(', ');

                const items = ord.items || [];
                const firstItem = items[0] || {};
                const totalQuantity = items.reduce((sum, it) => sum + (it.quantity || 1), 0);

                const amount = Number(ord.totalAmount || ord.amount || 13995);
                const isHighValue = amount >= 50000;
                const isCod = ord.payment?.method === 'partial_cod' || ord.payment?.method === 'cod';

                const rawStatus = (ord.fulfillmentStatus || ord.shiprocket?.status || 'NEW').toUpperCase();
                const isNew = rawStatus === 'NEW' || rawStatus === 'PENDING' || rawStatus === 'UNFULFILLED' || rawStatus === 'CONFIRMED';
                const isReadyToShip = rawStatus === 'READY_TO_SHIP';
                const isPickupScheduled = rawStatus === 'PICKUP_SCHEDULED';
                const isInTransit = rawStatus === 'SHIPPED' || rawStatus === 'IN_TRANSIT';

                const isSelected = selectedOrders.includes(ord.orderId);

                // Date formatting: 25 Oct 2026 | 02:27 AM
                const dateObj = ord.createdAt ? new Date(ord.createdAt) : new Date();
                const formattedDate = dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
                const formattedTime = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

                return (
                  <div
                    key={ord.orderId}
                    onClick={() => setSelectedOrder(ord)}
                    className={`grid grid-cols-[36px_190px_230px_200px_160px_120px_120px_90px_120px] gap-3 px-4 py-3.5 bg-white rounded-lg border transition-all cursor-pointer items-start text-[13px] ${
                      isSelected
                        ? 'border-[#6c47ff] shadow-[0_0_0_1px_#6c47ff] bg-[#faf8ff]'
                        : 'border-neutral-200/90 hover:border-[#6c47ff]/60 hover:shadow-2xs'
                    }`}
                  >
                    
                    {/* 1. Checkbox */}
                    <div className="pt-1" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => toggleSelectRow(ord.orderId, e)}
                        className="w-4 h-4 rounded text-[#6c47ff] focus:ring-[#6c47ff] cursor-pointer"
                      />
                    </div>

                    {/* 2. Order Details */}
                    <div>
                      {isHighValue && (
                        <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#fef3c7] text-[#92400e] border border-[#fde68a] mb-1">
                          Eway bill mandatory
                        </span>
                      )}

                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedOrder(ord);
                        }}
                        className="text-[#6c47ff] font-bold hover:underline cursor-pointer block tracking-tight text-[13.5px]"
                      >
                        {ord.orderId}
                      </span>

                      <p className="text-[11.5px] text-neutral-500 mt-0.5">
                        {formattedDate} | {formattedTime}
                      </p>

                      <div className="flex items-center gap-1 text-[11px] text-neutral-500 mt-1.5">
                        <ShoppingCart className="w-3.5 h-3.5 text-neutral-400" />
                        <span>CUSTOM ({ord.shiprocket?.channelId || '8506269'})</span>
                      </div>

                      <div className="mt-2.5">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-semibold bg-[#eff6ff] text-[#1d4ed8] border border-[#dbeafe]">
                          <ShieldCheck className="w-3 h-3 text-[#1d4ed8]" />
                          <span>Secured</span>
                        </span>
                      </div>
                    </div>

                    {/* 3. Customer Details */}
                    <div>
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-[#e0f2fe] text-[#0369a1] mb-1">
                        ★ Repeat Customer
                      </span>

                      <p className="font-semibold text-[#111111] text-[13px]">
                        {customerName}
                      </p>

                      <p className="text-[12px] text-neutral-500 truncate max-w-[210px] mt-0.5" title={email}>
                        {email}
                      </p>

                      <div className="flex items-center gap-1.5 text-[12px] text-neutral-600 mt-0.5">
                        <span className="font-mono">{displayPhone}</span>
                        <button
                          type="button"
                          onClick={(e) => togglePhoneMask(ord.orderId, e)}
                          className="text-neutral-400 hover:text-neutral-700 transition-colors p-0.5"
                          title={isPhoneUnmasked ? 'Mask phone' : 'Reveal phone'}
                        >
                          {isPhoneUnmasked ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>

                      <div className="flex items-start gap-1 text-[11.5px] text-neutral-500 mt-1 line-clamp-2 max-w-[210px]" title={fullAddress}>
                        {isHighValue && <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />}
                        <span className="truncate">{fullAddress || 'Patna, Bihar'}</span>
                      </div>

                      {/* RTO Risk Badge */}
                      <div className="flex items-center gap-1.5 mt-2">
                        <span className="text-[11px] text-neutral-500 font-medium">RTO Risk :</span>
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-bold border border-emerald-500 text-emerald-700 bg-emerald-50">
                          <ArrowDown className="w-2.5 h-2.5" />
                          <span>LOW</span>
                        </span>
                      </div>
                    </div>

                    {/* 4. Product Details */}
                    <div>
                      <p className="font-semibold text-[#111111] text-[13px] truncate" title={firstItem.name || 'SONU Footwear'}>
                        {firstItem.name || 'SONU Hybrid RN'}
                      </p>

                      <p className="text-[11.5px] text-neutral-500 mt-0.5 truncate" title={firstItem.id || firstItem.slug}>
                        SKU: {(firstItem.id || firstItem.slug || 'drop-hybrid-women').slice(0, 16)}...
                      </p>

                      <p className="text-[11.5px] text-neutral-500 mt-0.5">
                        QTY: {firstItem.quantity || 1}
                      </p>

                      <p className="text-[11.5px] text-neutral-500 mt-0.5">
                        HSN: 640411
                      </p>

                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedOrder(ord);
                          }}
                          className="text-[11.5px] text-[#6c47ff] hover:underline font-semibold mt-1 block"
                        >
                          +{items.length - 1} {items.length - 1 === 1 ? 'Product' : 'Products'}
                        </button>
                      )}
                    </div>

                    {/* 5. Package Details */}
                    <div className="text-[12px] text-neutral-600 space-y-0.5">
                      <p><span className="text-neutral-500">Dead wt. :</span> 0.9 Kg</p>
                      <p className="text-neutral-500">30 x 20 x 12 (cm)</p>
                      <p><span className="text-neutral-500">Volumetric wt.:</span> 1.440 Kg</p>
                    </div>

                    {/* 6. Payment */}
                    <div>
                      <p className="font-bold text-[#111111] text-[13.5px]">
                        ₹ {amount.toFixed(2)}
                      </p>
                      <div className="mt-1">
                        {isCod ? (
                          <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#fff7ed] text-[#ea580c] border border-[#ffedd5]">
                            COD
                          </span>
                        ) : (
                          <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#f0fdf4] text-[#16a34a] border border-[#dcfce7]">
                            Prepaid
                          </span>
                        )}
                      </div>
                    </div>

                    {/* 7. Pickup Address */}
                    <div>
                      <span className="text-[12.5px] font-medium text-neutral-800 border-b border-dotted border-neutral-400 cursor-help" title="Home: 34 Rd Number 2, Nehru Nagar, Patna, Bihar 800013">
                        Home
                      </span>
                    </div>

                    {/* 8. Status */}
                    <div>
                      {isNew && (
                        <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-[#f0fdf4] text-[#16a34a] border border-[#bbf7d0]">
                          NEW
                        </span>
                      )}
                      {isReadyToShip && (
                        <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-[#faf5ff] text-[#9333ea] border border-[#f3e8ff]">
                          READY TO SHIP
                        </span>
                      )}
                      {isPickupScheduled && (
                        <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-[#eef2ff] text-[#4f46e5] border border-[#e0e7ff]">
                          PICKUP SCHEDULED
                        </span>
                      )}
                      {isInTransit && (
                        <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-[#eff6ff] text-[#2563eb] border border-[#dbeafe]">
                          IN TRANSIT
                        </span>
                      )}
                      {rawStatus === 'DELIVERED' && (
                        <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-[#ecfdf5] text-[#059669] border border-[#a7f3d0]">
                          DELIVERED
                        </span>
                      )}
                    </div>

                    {/* 9. Action Buttons */}
                    <div className="flex items-center justify-end gap-1.5 relative">
                      {/* Dynamic Primary Button */}
                      {isNew && (
                        <button
                          type="button"
                          disabled={actionLoading === ord.orderId}
                          onClick={(e) => handleShipNow(ord.orderId, e)}
                          className="px-4 py-1.5 rounded-lg bg-[#6c47ff] hover:bg-[#5833ea] active:scale-[0.98] text-white text-[12.5px] font-semibold transition-all shadow-xs flex items-center justify-center min-w-[84px] cursor-pointer"
                        >
                          {actionLoading === ord.orderId ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                          ) : (
                            <span>Ship Now</span>
                          )}
                        </button>
                      )}

                      {isReadyToShip && (
                        <button
                          type="button"
                          disabled={actionLoading === ord.orderId}
                          onClick={(e) => handleRequestPickup(ord.orderId, e)}
                          className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-neutral-950 text-[12px] font-bold transition-all shadow-xs flex items-center justify-center min-w-[95px] cursor-pointer"
                        >
                          {actionLoading === ord.orderId ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin text-neutral-950" />
                          ) : (
                            <span>Pickup</span>
                          )}
                        </button>
                      )}

                      {isPickupScheduled && (
                        <a
                          href={ord.shiprocket?.labelUrl || `https://apiv2.shiprocket.in/generate/label/sample_${ord.shiprocket?.shipmentId}.pdf`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-black text-white text-[12px] font-semibold transition-all shadow-xs flex items-center gap-1 justify-center min-w-[80px]"
                        >
                          <Printer className="w-3 h-3" />
                          <span>Label</span>
                        </a>
                      )}

                      {isInTransit && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedOrder(ord);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-[#eff6ff] hover:bg-[#dbeafe] text-[#1d4ed8] text-[12px] font-semibold transition-all border border-[#bfdbfe] flex items-center justify-center min-w-[70px] cursor-pointer"
                        >
                          Track
                        </button>
                      )}

                      {/* Three Dots Menu Button */}
                      <div className="relative" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => setOpenDropdownId(openDropdownId === ord.orderId ? null : ord.orderId)}
                          className="w-7 h-7 rounded-full bg-[#f4f2ff] hover:bg-[#eae6ff] text-[#6c47ff] flex items-center justify-center transition-colors cursor-pointer"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>

                        {/* Dropdown Popover */}
                        {openDropdownId === ord.orderId && (
                          <div className="absolute right-0 top-8 z-40 w-48 bg-white rounded-xl shadow-xl border border-neutral-200 py-1 text-[13px] animate-in fade-in zoom-in-95 duration-150">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedOrder(ord);
                                setOpenDropdownId(null);
                              }}
                              className="w-full px-4 py-2 text-left hover:bg-neutral-50 flex items-center gap-2 text-neutral-700"
                            >
                              <Eye className="w-3.5 h-3.5 text-neutral-500" />
                              <span>Inspect Order</span>
                            </button>

                            {ord.shiprocket?.awbCode && (
                              <button
                                type="button"
                                onClick={() => {
                                  copyToClipboard(ord.shiprocket.awbCode, 'AWB Code');
                                  setOpenDropdownId(null);
                                }}
                                className="w-full px-4 py-2 text-left hover:bg-neutral-50 flex items-center gap-2 text-neutral-700"
                              >
                                <Copy className="w-3.5 h-3.5 text-neutral-500" />
                                <span>Copy AWB Code</span>
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => {
                                updateStatus(ord.orderId, 'shipped');
                                setOpenDropdownId(null);
                              }}
                              className="w-full px-4 py-2 text-left hover:bg-neutral-50 flex items-center gap-2 text-neutral-700"
                            >
                              <Truck className="w-3.5 h-3.5 text-neutral-500" />
                              <span>Mark In Transit</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                updateStatus(ord.orderId, 'delivered');
                                setOpenDropdownId(null);
                              }}
                              className="w-full px-4 py-2 text-left hover:bg-neutral-50 flex items-center gap-2 text-neutral-700"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Mark Delivered</span>
                            </button>

                            <div className="border-t border-neutral-100 my-1" />

                            <button
                              type="button"
                              onClick={() => {
                                updateStatus(ord.orderId, 'cancelled');
                                setOpenDropdownId(null);
                              }}
                              className="w-full px-4 py-2 text-left hover:bg-rose-50 flex items-center gap-2 text-rose-600"
                            >
                              <X className="w-3.5 h-3.5 text-rose-600" />
                              <span>Cancel Order</span>
                            </button>
                          </div>
                        )}
                      </div>

                    </div>

                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-20 text-center bg-white rounded-b-lg border border-neutral-200">
              <Box className="w-10 h-10 text-neutral-300 mx-auto mb-2" />
              <h3 className="text-[15px] font-bold text-[#111111]">No orders in this view</h3>
              <p className="text-[13px] text-neutral-400 mt-1">
                Try switching between tabs or adjust your search filter.
              </p>
            </div>
          )}

        </div>

        {/* 6. PAGINATION FOOTER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 pb-8 text-[13px] text-neutral-600">
          <div className="flex items-center gap-2">
            <span>Items per page:</span>
            <div className="relative inline-block">
              <select
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className="appearance-none border border-neutral-300 bg-white rounded-md px-3 py-1 pr-7 text-[12.5px] font-medium text-neutral-800 cursor-pointer shadow-2xs outline-none focus:border-[#6c47ff]"
              >
                <option value={15}>15 Orders</option>
                <option value={25}>25 Orders</option>
                <option value={50}>50 Orders</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-neutral-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="flex items-center gap-1 px-3 py-1 rounded-md border border-neutral-300 bg-white text-neutral-600 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>PREV</span>
            </button>

            <span className="w-8 h-8 rounded-md bg-[#6c47ff] text-white flex items-center justify-center font-bold text-[13px]">
              {currentPage}
            </span>

            <button
              type="button"
              disabled={true}
              className="flex items-center gap-1 px-3 py-1 rounded-md border border-neutral-300 bg-white text-neutral-600 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <span>NEXT</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>

      {/* 7. SLIDE-OUT ORDER INSPECTION DRAWER */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-end">
          <div
            className="fixed inset-0 bg-black/50 transition-opacity backdrop-blur-2xs"
            onClick={() => setSelectedOrder(null)}
          />

          <div className="relative w-full max-w-[580px] bg-white h-full shadow-2xl flex flex-col z-10 overflow-y-auto animate-in slide-in-from-right duration-200">
            {/* Header */}
            <div className="px-6 py-5 border-b border-neutral-200 flex items-center justify-between sticky top-0 bg-white z-20">
              <div>
                <span className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider block">
                  Shiprocket Logistics Manager
                </span>
                <div className="flex items-center gap-2.5 mt-0.5">
                  <h3 className="text-[18px] font-bold text-[#111111] font-mono">
                    {selectedOrder.orderId}
                  </h3>
                  <span className="text-[11px] font-bold uppercase px-2 py-0.5 rounded bg-[#f4f0ff] text-[#6c47ff] border border-[#d8caff]">
                    {selectedOrder.fulfillmentStatus || selectedOrder.shiprocket?.status || 'NEW'}
                  </span>
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

            {/* Body */}
            <div className="p-6 space-y-6 flex-1">
              
              {/* Stepper */}
              <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200">
                <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 block mb-3">
                  Shipment Pipeline
                </span>
                <div className="flex items-center justify-between text-[11px] font-semibold text-neutral-600">
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[11px]">✓</div>
                    <span>Placed</span>
                  </div>
                  <div className={`flex-1 h-[2px] mx-1 ${selectedOrder.shiprocket?.awbCode ? 'bg-emerald-500' : 'bg-neutral-200'}`} />
                  <div className="flex flex-col items-center gap-1">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] ${selectedOrder.shiprocket?.awbCode ? 'bg-emerald-500 text-white' : 'bg-[#6c47ff] text-white'}`}>
                      {selectedOrder.shiprocket?.awbCode ? '✓' : '2'}
                    </div>
                    <span>Ready</span>
                  </div>
                  <div className={`flex-1 h-[2px] mx-1 ${selectedOrder.shiprocket?.status === 'PICKUP_SCHEDULED' || selectedOrder.fulfillmentStatus === 'pickup_scheduled' ? 'bg-emerald-500' : 'bg-neutral-200'}`} />
                  <div className="flex flex-col items-center gap-1">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] ${selectedOrder.fulfillmentStatus === 'pickup_scheduled' ? 'bg-[#6c47ff] text-white' : 'bg-neutral-200 text-neutral-500'}`}>
                      3
                    </div>
                    <span>Pickup</span>
                  </div>
                  <div className={`flex-1 h-[2px] mx-1 ${selectedOrder.fulfillmentStatus === 'shipped' || selectedOrder.fulfillmentStatus === 'delivered' ? 'bg-emerald-500' : 'bg-neutral-200'}`} />
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-6 h-6 rounded-full bg-neutral-200 text-neutral-500 flex items-center justify-center text-[11px]">4</div>
                    <span>Delivered</span>
                  </div>
                </div>
              </div>

              {/* Action Box */}
              <div className="p-4 rounded-xl bg-neutral-900 text-white space-y-3">
                <span className="text-[11px] uppercase font-bold tracking-wider text-neutral-400 block">
                  Next Step
                </span>

                {!selectedOrder.shiprocket?.awbCode && (
                  <div className="space-y-2">
                    <p className="text-[13px] text-neutral-300">
                      Click below to assign courier and generate AWB with Shiprocket.
                    </p>
                    <button
                      type="button"
                      disabled={actionLoading === selectedOrder.orderId}
                      onClick={() => handleShipNow(selectedOrder.orderId)}
                      className="w-full py-3 rounded-lg bg-[#6c47ff] hover:bg-[#5833ea] text-white font-bold text-[13.5px] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                    >
                      {actionLoading === selectedOrder.orderId ? (
                        <RefreshCw className="w-4 h-4 animate-spin text-white" />
                      ) : (
                        <>
                          <Box className="w-4 h-4" />
                          <span>Ship Now (Generate AWB)</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                {selectedOrder.shiprocket?.awbCode && selectedOrder.fulfillmentStatus !== 'pickup_scheduled' && selectedOrder.fulfillmentStatus !== 'shipped' && (
                  <div className="space-y-2.5">
                    <div className="bg-white/10 p-2.5 rounded-lg flex items-center justify-between text-[12.5px]">
                      <div>
                        <span className="text-neutral-400 text-[11px] block">Courier</span>
                        <span className="font-semibold text-white">{selectedOrder.shiprocket.courierName || 'Delhivery'}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-neutral-400 text-[11px] block">AWB Code</span>
                        <span className="font-mono font-bold text-white">{selectedOrder.shiprocket.awbCode}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={actionLoading === selectedOrder.orderId}
                      onClick={() => handleRequestPickup(selectedOrder.orderId)}
                      className="w-full py-3 rounded-lg bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-[13.5px] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                    >
                      {actionLoading === selectedOrder.orderId ? (
                        <RefreshCw className="w-4 h-4 animate-spin text-neutral-950" />
                      ) : (
                        <>
                          <Truck className="w-4 h-4" />
                          <span>Request Pickup (Schedule Courier)</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                {(selectedOrder.fulfillmentStatus === 'pickup_scheduled' || selectedOrder.shiprocket?.status === 'PICKUP_SCHEDULED') && (
                  <div className="space-y-2.5">
                    <div className="p-3 bg-emerald-950/70 border border-emerald-500/30 rounded-lg text-[12.5px] text-emerald-300">
                      ✓ Courier Pickup Scheduled from Patna address!
                      {selectedOrder.shiprocket?.pickupToken && (
                        <span className="block mt-1 font-mono text-white text-[12px]">
                          Token: {selectedOrder.shiprocket.pickupToken} &bull; Date: {selectedOrder.shiprocket.pickupScheduledDate || 'Today'}
                        </span>
                      )}
                    </div>

                    <a
                      href={selectedOrder.shiprocket?.labelUrl || `https://apiv2.shiprocket.in/generate/label/sample_${selectedOrder.shiprocket?.shipmentId}.pdf`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 rounded-lg bg-white text-black font-semibold text-[13px] hover:bg-neutral-200 transition-all flex items-center justify-center gap-2"
                    >
                      <Printer className="w-4 h-4" />
                      <span>Print Shipping Label PDF</span>
                    </a>
                  </div>
                )}
              </div>

              {/* Items */}
              <div>
                <h4 className="text-[13.5px] font-bold text-[#111111] mb-2.5">
                  Ordered Items ({selectedOrder.items?.length || 0})
                </h4>
                <div className="space-y-2">
                  {selectedOrder.items?.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 rounded-xl border border-neutral-200">
                      <div className="w-12 h-12 rounded-lg bg-neutral-100 shrink-0 overflow-hidden flex items-center justify-center">
                        <img src={item.image || '/images/ad22b92Nike-HQ2593-502_1.avif'} alt="" className="w-full h-full object-contain p-0.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-[13px] text-[#111111] truncate">{item.name}</p>
                        <p className="text-[11.5px] text-neutral-500">Size: {item.size || 'UK 8'} &bull; Qty: {item.quantity || 1}</p>
                      </div>
                      <span className="font-bold text-[13px] text-[#111111]">
                        ₹ {(item.priceNumber || 13995).toLocaleString('en-IN')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Customer & Address */}
              <div className="p-4 rounded-xl border border-neutral-200 space-y-2 text-[12.5px] text-neutral-600">
                <p className="font-bold text-[#111111] text-[13.5px]">
                  {selectedOrder.customer?.name || 'Customer'}
                </p>
                <p>{selectedOrder.customer?.email}</p>
                <p>+91 {selectedOrder.customer?.mobile}</p>
                <div className="pt-2 border-t border-neutral-100 text-neutral-700">
                  <p className="font-medium text-neutral-500 text-[11px] uppercase mb-0.5">Delivery Address</p>
                  <p>
                    {typeof selectedOrder.customer?.address === 'string'
                      ? selectedOrder.customer?.address
                      : [
                          selectedOrder.customer?.address?.houseNo,
                          selectedOrder.customer?.address?.street,
                          selectedOrder.customer?.address?.landmark,
                          selectedOrder.customer?.address?.city,
                          selectedOrder.customer?.address?.state,
                          selectedOrder.customer?.address?.pincode,
                        ].filter(Boolean).join(', ')}
                  </p>
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="p-5 border-t border-neutral-200 bg-white sticky bottom-0">
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="w-full py-2.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-[#111111] font-semibold text-[13.5px] transition-colors cursor-pointer"
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
