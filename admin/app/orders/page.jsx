'use client';

import React, { useState, useEffect, useMemo, useRef, Suspense } from 'react';
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
  MessageSquare,
  Sparkles,
  Check,
  User,
  CreditCard,
  FileText,
  Package,
  Save,
  Trash2,
} from 'lucide-react';

// --- SIGNATURE ANIMATED FLOATING FORM SYSTEM (MATCHING PRODUCT ADD FORM) ---
function FloatingInput({
  label,
  value,
  onChange,
  type = 'text',
  required = false,
  min,
  max,
  prefix,
  helper,
  disabled = false,
  className = '',
  compact = true,
}) {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef(null);

  const hasValue = value !== '' && value !== null && value !== undefined;
  const isFloating = isFocused || hasValue;

  return (
    <div className={`w-full ${className}`}>
      <div
        onClick={() => !disabled && inputRef.current?.focus()}
        className={`relative w-full ${
          compact ? 'h-[46px] px-3.5 rounded-[8px]' : 'h-[52px] px-4 rounded-[8px]'
        } border transition-all duration-200 cursor-text bg-white flex items-center ${
          isFocused ? 'border-[#111111] ring-1 ring-[#111111]/10' : 'border-[#8d8d8d]'
        } ${disabled ? 'bg-neutral-50/70 cursor-not-allowed opacity-75' : ''}`}
      >
        <span
          className={`absolute transition-all duration-200 ease-out pointer-events-none select-none truncate max-w-[calc(100%-14px)] ${
            isFloating
              ? `-top-2 left-2.5 px-1.5 bg-white leading-none z-10 text-[11px] text-[#111111] font-medium`
              : `top-1/2 -translate-y-1/2 left-3.5 text-[13px] text-[#707072]`
          }`}
          style={{ fontFamily: "'Helvetica Now Text', sans-serif" }}
        >
          {label}
          {required ? '*' : ''}
        </span>

        <div className="flex items-center w-full min-w-0">
          {prefix && (
            <span
              className={`text-[13px] text-neutral-500 font-semibold select-none pr-1 shrink-0 ${
                isFloating ? 'opacity-100' : 'opacity-0'
              } transition-opacity duration-150`}
              style={{ fontFamily: "'Helvetica Now Text', sans-serif" }}
            >
              {prefix}
            </span>
          )}
          <input
            ref={inputRef}
            type={type}
            disabled={disabled}
            required={required}
            min={min}
            max={max}
            value={value ?? ''}
            onChange={onChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className="w-full bg-transparent text-[13.5px] text-[#111111] font-medium outline-none p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            style={{ fontFamily: "'Helvetica Now Text', sans-serif" }}
          />
        </div>
      </div>
      {helper && (
        <p
          className="text-[11px] text-[#707072] mt-1 px-1"
          style={{ fontFamily: "'Helvetica Now Text', sans-serif" }}
        >
          {helper}
        </p>
      )}
    </div>
  );
}

function FloatingSelect({
  label,
  value,
  options = [],
  onSelect,
  required = false,
  className = '',
  compact = true,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isFloating = isOpen || Boolean(value);

  const selectedOpt = options.find((opt) =>
    typeof opt === 'string' ? opt === value : (opt.value || opt.id) === value
  );
  const displayLabel =
    typeof selectedOpt === 'string'
      ? selectedOpt
      : selectedOpt?.label || selectedOpt?.name || value || '';

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <div
        onClick={() => setIsOpen((prev) => !prev)}
        className={`relative w-full ${
          compact ? 'h-[46px] px-3.5 rounded-[8px]' : 'h-[52px] px-4 rounded-[8px]'
        } border transition-all duration-200 cursor-pointer bg-white flex items-center justify-between ${
          isOpen ? 'border-[#111111] ring-1 ring-[#111111]/10' : 'border-[#8d8d8d]'
        }`}
      >
        <span
          className={`absolute transition-all duration-200 ease-out pointer-events-none select-none truncate max-w-[calc(100%-24px)] ${
            isFloating
              ? `-top-2 left-2.5 px-1.5 bg-white leading-none z-10 text-[11px] text-[#111111] font-medium`
              : `top-1/2 -translate-y-1/2 left-3.5 text-[13px] text-[#707072]`
          }`}
          style={{ fontFamily: "'Helvetica Now Text', sans-serif" }}
        >
          {label}
          {required ? '*' : ''}
        </span>

        <span
          className={`text-[13.5px] text-[#111111] font-medium truncate mr-2 ${
            value ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ fontFamily: "'Helvetica Now Text', sans-serif" }}
        >
          {displayLabel || 'Select'}
        </span>

        <svg
          className={`w-3.5 h-3.5 text-[#111111] transition-transform duration-200 shrink-0 ${
            isOpen ? 'rotate-180' : ''
          }`}
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M7 10l5 5 5-5z" />
        </svg>
      </div>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-[#e5e5e5] rounded-[10px] shadow-xl py-1 z-50 max-h-56 overflow-y-auto">
          {options.map((opt, i) => {
            const optVal =
              typeof opt === 'string'
                ? opt
                : opt.value !== undefined
                ? opt.value
                : opt.id || opt.name;
            const optLabel =
              typeof opt === 'string'
                ? opt
                : opt.label || opt.name || opt.title || optVal;
            const isSelected = value === optVal;
            return (
              <div
                key={i}
                onClick={() => {
                  onSelect(optVal);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2 text-[13px] transition-colors cursor-pointer select-none ${
                  isSelected
                    ? 'bg-[#f5f5f5] text-[#111111] font-semibold'
                    : 'text-[#222222] hover:bg-[#fafafa]'
                }`}
                style={{ fontFamily: "'Helvetica Now Text', sans-serif" }}
              >
                <span className="truncate flex-1 mr-2">{optLabel}</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-[#111111] shrink-0" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function FloatingTextarea({
  label,
  value,
  onChange,
  rows = 2,
  required = false,
  className = '',
}) {
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef(null);

  const hasValue = value !== '' && value !== null && value !== undefined;
  const isFloating = isFocused || hasValue;

  return (
    <div className={`w-full ${className}`}>
      <div
        onClick={() => textareaRef.current?.focus()}
        className={`relative w-full rounded-[8px] border p-3 pt-3.5 transition-all duration-200 cursor-text bg-white ${
          isFocused ? 'border-[#111111] ring-1 ring-[#111111]/10' : 'border-[#8d8d8d]'
        }`}
      >
        <span
          className={`absolute transition-all duration-200 ease-out pointer-events-none select-none ${
            isFloating
              ? '-top-2 left-2.5 px-1.5 bg-white text-[11px] text-[#111111] font-medium leading-none z-10'
              : 'top-3.5 left-3.5 text-[13px] text-[#707072]'
          }`}
          style={{ fontFamily: "'Helvetica Now Text', sans-serif" }}
        >
          {label}
          {required ? '*' : ''}
        </span>

        <textarea
          ref={textareaRef}
          rows={rows}
          required={required}
          value={value ?? ''}
          onChange={onChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="w-full bg-transparent text-[13.5px] text-[#111111] font-medium outline-none p-0 resize-none leading-relaxed mt-0.5"
          style={{ fontFamily: "'Helvetica Now Text', sans-serif" }}
        />
      </div>
    </div>
  );
}

function OrdersContent() {
  const searchParams = useSearchParams();
  const initialId = searchParams.get('id');

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('new'); // 'new' | 'ready_to_ship' | 'on_hold' | 'pickups' | 'in_transit' | 'delivered' | 'rto' | 'all'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [unmaskedPhones, setUnmaskedPhones] = useState({});
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [itemsPerPage, setItemsPerPage] = useState(15);
  const [currentPage, setCurrentPage] = useState(1);
  const [catalogProducts, setCatalogProducts] = useState([]);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [selectedCatalogProduct, setSelectedCatalogProduct] = useState(null);
  const [productPickerSearch, setProductPickerSearch] = useState('');
  const [newProductSize, setNewProductSize] = useState('UK 8');
  const [newProductQty, setNewProductQty] = useState(1);
  const [sellerSettings, setSellerSettings] = useState({
    companyName: 'Sonu Shoe',
    addressLine1: '34, Rd Number 2, Nehru Nagar',
    addressLine2: 'Patliputra Colony',
    city: 'Patna',
    state: 'Bihar',
    pincode: '800013',
    stateCode: '10',
    country: 'India',
    phone: '8008439762',
    email: 'yashodanandkumar15@gmail.com',
    gstin: '',
    signatureTitle: 'Authorized Signature for Sonu Shoe',
    reverseCharge: 'No',
  });

  useEffect(() => {
    fetch('/api/settings')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.seller) setSellerSettings((prev) => ({ ...prev, ...data.seller }));
      })
      .catch((err) => console.warn('Could not load seller settings:', err));

    fetch('/api/products')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.products && data.products.length > 0) {
          setCatalogProducts(data.products);
        } else {
          setCatalogProducts([
            { id: 'drop-hybrid-women', name: 'SONU Hybrid RN v1 - Road Edition', priceNumber: 13995, image: '/images/test/1e462d9Nike-IV2476-200_1.avif' },
            { id: 'drop-hybrid-men', name: 'SONU Hybrid Trail Pro', priceNumber: 15995, image: '/images/test/ad22b92nike-hq3049-502_1-1792991427168-2vciyc.webp' },
            { id: 'drop-pace-elite', name: 'SONU Pace Elite Marathon', priceNumber: 17995, image: '/images/test/1e462d9Nike-IV2476-200_1.avif' },
          ]);
        }
      })
      .catch(() => {
        setCatalogProducts([
          { id: 'drop-hybrid-women', name: 'SONU Hybrid RN v1 - Road Edition', priceNumber: 13995, image: '/images/test/1e462d9Nike-IV2476-200_1.avif' },
          { id: 'drop-hybrid-men', name: 'SONU Hybrid Trail Pro', priceNumber: 15995, image: '/images/test/ad22b92nike-hq3049-502_1-1792991427168-2vciyc.webp' },
        ]);
      });
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const formatAddressLines = (addr, fullAddress) => {
    if (typeof addr === 'object' && addr !== null) {
      const lines = [];
      const line1 = [addr.houseNo, addr.street, addr.landmark].filter(Boolean).join(', ');
      if (line1) lines.push(line1);

      const line2 = [addr.area || addr.colony || addr.locality, addr.city, addr.state].filter(Boolean).join(', ');
      if (line2 && line2 !== line1) lines.push(line2);

      const line3 = [addr.city, addr.state].filter(Boolean).join(', ');
      if (line3 && !lines.includes(line3)) lines.push(line3);

      const pin = [addr.pincode, addr.country || 'India'].filter(Boolean).join(', ');
      if (pin) lines.push(pin);

      if (lines.length > 0) return lines;
    }

    const str = typeof addr === 'string' ? addr : fullAddress;
    if (!str) return ['Patna, Bihar', '800013, India'];

    const parts = str.split(',').map((s) => s.trim()).filter(Boolean);
    if (parts.length <= 2) return [str];

    const lines = [];
    let current = [];
    for (let i = 0; i < parts.length; i++) {
      current.push(parts[i]);
      if (current.join(', ').length >= 26 || i === parts.length - 1) {
        lines.push(current.join(', '));
        current = [];
      }
    }
    return lines;
  };

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
    setCurrentPage(1);
    fetchOrders();
  };

  const togglePhoneMask = (orderId, e) => {
    e.stopPropagation();
    setUnmaskedPhones((prev) => ({
      ...prev,
      [orderId]: !prev[orderId],
    }));
  };

  const toggleSelectAll = () => {
    if (selectedOrders.length === paginatedOrders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(paginatedOrders.map((o) => o.orderId));
    }
  };

  const toggleSelectRow = (orderId, e) => {
    e.stopPropagation();
    setSelectedOrders((prev) =>
      prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId]
    );
  };

  // Step 1: Ready to Ship (Assign AWB & Courier - Mocked Shiprocket + WhatsApp)
  const handleShipNow = async (orderId, e) => {
    if (e) e.stopPropagation();
    try {
      setActionLoading(orderId);
      const res = await fetch(`/api/orders/${orderId}/ready-to-ship`, {
        method: 'POST',
      });
      const data = await res.json();

      if (res.ok && data.success) {
        showToast(`✓ Order ${orderId} Ready to Ship! AWB: ${data.awbCode}`);
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
      console.error('Ready to ship error:', err);
      alert('Network error while processing shipment');
    } finally {
      setActionLoading(null);
    }
  };

  // Step 2: Request Pickup (Mocked Shiprocket + WhatsApp)
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

  useEffect(() => {
    if (selectedOrder) {
      const cust = selectedOrder.customer || {};
      const addr = cust.address || selectedOrder.address || {};
      const rawItems = Array.isArray(selectedOrder.items) ? selectedOrder.items : [];
      const rawPaymentMethod = selectedOrder.payment?.method || selectedOrder.paymentMethod || 'partial_cod';
      let rawPaymentStatus = selectedOrder.payment?.status || 'PENDING';
      if (rawPaymentMethod === 'partial_cod' && (rawPaymentStatus === 'PAID' || !selectedOrder.payment?.status)) {
        rawPaymentStatus = 'PARTIALLY_PAID';
      }

      setEditForm({
        orderId: selectedOrder.orderId,
        fulfillmentStatus: selectedOrder.fulfillmentStatus || 'new',
        status: selectedOrder.status || selectedOrder.fulfillmentStatus || 'new',
        customerName: cust.name || `${cust.firstName || ''} ${cust.lastName || ''}`.trim() || '',
        customerEmail: cust.email || '',
        customerMobile: cust.mobile || selectedOrder.address?.mobile || '',
        houseNo: typeof addr === 'string' ? '' : (addr.houseNo || ''),
        street: typeof addr === 'string' ? addr : (addr.street || addr.roadArea || ''),
        landmark: typeof addr === 'string' ? '' : (addr.landmark || ''),
        city: typeof addr === 'string' ? '' : (addr.city || ''),
        state: typeof addr === 'string' ? '' : (addr.state || ''),
        pincode: typeof addr === 'string' ? '' : (addr.pincode || ''),
        paymentMethod: rawPaymentMethod,
        paymentStatus: rawPaymentStatus,
        advancePaid: selectedOrder.payment?.advancePaid ?? (rawPaymentMethod === 'partial_cod' ? 200 : 0),
        totalAmount: selectedOrder.totalAmount || 13995,
        internalNote: selectedOrder.internalNote || selectedOrder.remark || '',
        items: JSON.parse(JSON.stringify(rawItems)),
      });
    } else {
      setEditForm(null);
    }
  }, [selectedOrder]);

  const handlePaymentMethodChange = (newMethod) => {
    if (!editForm) return;
    let nextStatus = editForm.paymentStatus;
    let nextAdvance = editForm.advancePaid;

    if (newMethod === 'partial_cod') {
      nextStatus = 'PARTIALLY_PAID';
      if (!nextAdvance || Number(nextAdvance) === 0 || Number(nextAdvance) === editForm.totalAmount) {
        nextAdvance = 200;
      }
    } else if (newMethod === 'cod') {
      nextStatus = 'PENDING';
      nextAdvance = 0;
    } else if (newMethod === 'prepaid') {
      nextStatus = 'PAID';
      nextAdvance = editForm.totalAmount;
    }

    setEditForm((prev) => ({
      ...prev,
      paymentMethod: newMethod,
      paymentStatus: nextStatus,
      advancePaid: nextAdvance,
    }));
  };

  const handleAddProductToOrder = () => {
    if (!editForm) return;
    const targetProduct = selectedCatalogProduct || catalogProducts[0] || {
      id: 'drop-hybrid-rn',
      name: 'SONU Hybrid RN',
      priceNumber: 13995,
      image: '/images/test/1e462d9Nike-IV2476-200_1.avif',
    };

    const newItem = {
      id: targetProduct.id || targetProduct._id || `item-${Date.now()}`,
      name: targetProduct.name || targetProduct.title || 'SONU Footwear',
      sku: `${targetProduct.id || 'SONU'}-${newProductSize.replace(/\s+/g, '')}`,
      size: newProductSize,
      quantity: Number(newProductQty) || 1,
      priceNumber: Number(targetProduct.priceNumber) || 13995,
      image: targetProduct.image || '/images/test/1e462d9Nike-IV2476-200_1.avif',
    };

    const nextItems = [...(editForm.items || []), newItem];
    const newTotal = nextItems.reduce(
      (acc, it) => acc + (Number(it.priceNumber) || 0) * (Number(it.quantity) || 1),
      0
    );

    setEditForm((prev) => ({
      ...prev,
      items: nextItems,
      totalAmount: newTotal,
      advancePaid: prev.paymentMethod === 'prepaid' ? newTotal : prev.advancePaid,
    }));

    setShowAddProductModal(false);
    setSelectedCatalogProduct(null);
    setProductPickerSearch('');
    setNewProductSize('UK 8');
    setNewProductQty(1);
    showToast(`✓ Added ${newItem.name} (${newItem.size}) to order`);
  };

  const handleRemoveProductFromOrder = (idx) => {
    if (!editForm || !editForm.items) return;
    const itemToRemove = editForm.items[idx];
    const nextItems = editForm.items.filter((_, i) => i !== idx);
    const newTotal = nextItems.reduce(
      (acc, it) => acc + (Number(it.priceNumber) || 0) * (Number(it.quantity) || 1),
      0
    );

    setEditForm((prev) => ({
      ...prev,
      items: nextItems,
      totalAmount: newTotal,
      advancePaid: prev.paymentMethod === 'prepaid' ? newTotal : Math.min(prev.advancePaid, newTotal),
    }));
    showToast(`Removed ${itemToRemove?.name || 'item'} from order`);
  };

  const handleSaveOrder = async () => {
    if (!editForm || !selectedOrder) return;
    setIsSaving(true);
    try {
      const payload = {
        orderId: editForm.orderId,
        fulfillmentStatus: editForm.fulfillmentStatus,
        status: editForm.status,
        customer: {
          ...(selectedOrder.customer || {}),
          name: editForm.customerName,
          email: editForm.customerEmail,
          mobile: editForm.customerMobile,
          address: {
            houseNo: editForm.houseNo,
            street: editForm.street,
            landmark: editForm.landmark,
            city: editForm.city,
            state: editForm.state,
            pincode: editForm.pincode,
          },
        },
        address: {
          ...(selectedOrder.address || {}),
          houseNo: editForm.houseNo,
          street: editForm.street,
          landmark: editForm.landmark,
          city: editForm.city,
          state: editForm.state,
          pincode: editForm.pincode,
          mobile: editForm.customerMobile,
        },
        payment: {
          ...(selectedOrder.payment || {}),
          method: editForm.paymentMethod,
          status: editForm.paymentStatus,
          advancePaid: Number(editForm.advancePaid) || 0,
        },
        items: editForm.items,
        internalNote: editForm.internalNote,
        remark: editForm.internalNote,
      };

      const res = await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`✓ Order ${editForm.orderId} saved successfully`);
        const updated = data.order || { ...selectedOrder, ...payload };
        setOrders((prev) => prev.map((o) => (o.orderId === editForm.orderId ? updated : o)));
        setSelectedOrder(updated);
      } else {
        alert(data.error || 'Failed to save order updates');
      }
    } catch (err) {
      console.error('Save order error:', err);
      alert('Network error while saving order');
    } finally {
      setIsSaving(false);
    }
  };

  const handleMarkInTransit = async (orderId) => {
    try {
      setActionLoading(orderId);
      const res = await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          fulfillmentStatus: 'in_transit',
          shiprocket: {
            ...(selectedOrder?.shiprocket || {}),
            status: 'IN_TRANSIT',
          },
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`✓ Order ${orderId} moved to In Transit`);
        await handleSendMockWhatsApp(orderId, 'IN_TRANSIT');
        const updated = data.order || { ...selectedOrder, fulfillmentStatus: 'in_transit' };
        setOrders((prev) => prev.map((o) => (o.orderId === orderId ? updated : o)));
        setSelectedOrder(updated);
      } else {
        alert(data.error || 'Failed to update order status');
      }
    } catch (err) {
      console.error('In transit error:', err);
      alert('Network error while updating status');
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkDelivered = async (orderId) => {
    try {
      setActionLoading(orderId);
      const res = await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          fulfillmentStatus: 'delivered',
          shiprocket: {
            ...(selectedOrder?.shiprocket || {}),
            status: 'DELIVERED',
          },
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`✓ Order ${orderId} marked as Delivered!`);
        await handleSendMockWhatsApp(orderId, 'DELIVERED');
        const updated = data.order || { ...selectedOrder, fulfillmentStatus: 'delivered' };
        setOrders((prev) => prev.map((o) => (o.orderId === orderId ? updated : o)));
        setSelectedOrder(updated);
      } else {
        alert(data.error || 'Failed to mark delivered');
      }
    } catch (err) {
      console.error('Delivered error:', err);
      alert('Network error while updating status');
    } finally {
      setActionLoading(null);
    }
  };

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

  const handleCreateTestOrder = async () => {
    try {
      setActionLoading('create_test');
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`✓ Test Order #${data.order.orderId} created!`);
        setOrders((prev) => [data.order, ...prev]);
        setSelectedOrder(data.order);
      } else {
        alert(data.error || 'Failed to create test order');
      }
    } catch (err) {
      console.error('Create test order error:', err);
      alert('Network error while generating test order');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSendMockWhatsApp = async (orderId, template) => {
    try {
      setActionLoading(`wa_${template}`);
      const res = await fetch(`/api/orders/${orderId}/whatsapp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ template }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`✓ Mock WhatsApp dispatched [${template}]`);
        setOrders((prev) => prev.map((o) => (o.orderId === orderId ? data.order : o)));
        if (selectedOrder && selectedOrder.orderId === orderId) {
          setSelectedOrder(data.order);
        }
      } else {
        alert(data.error || 'Failed to dispatch mock WhatsApp');
      }
    } catch (err) {
      console.error('WhatsApp error:', err);
      alert('Network error triggering mock WhatsApp');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDownloadInvoice = (ord) => {
    if (!ord) return;
    const customer = ord.customer || {};
    const items = ord.items || [];
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      showToast('Popup blocked. Please allow popups to view invoice.');
      return;
    }

    const stateMap = {
      bihar: '10',
      karnataka: '29',
      delhi: '07',
      maharashtra: '27',
      'uttar pradesh': '09',
      'west bengal': '19',
      gujarat: '24',
      haryana: '06',
      punjab: '03',
      rajasthan: '08',
      telangana: '36',
      'tamil nadu': '33',
      kerala: '32',
      jharkhand: '20',
      odisha: '21',
    };
    const custAddr = customer.address || ord.address || {};
    const customerName =
      customer.name ||
      `${customer.firstName || ''} ${customer.lastName || ''}`.trim() ||
      ord.customerName ||
      'Customer';
    const houseNo = custAddr.houseNo || '';
    const street = custAddr.street || custAddr.roadArea || '';
    const landmark = custAddr.landmark || custAddr.locality || '';
    const city = custAddr.city || '';
    const state = custAddr.state || '';
    const pincode = custAddr.pincode || '';
    const country = custAddr.country || (pincode ? 'India' : '');

    const custState = (state || '').toLowerCase().trim();
    const customerStateCode = stateMap[custState] || custAddr.stateCode || '';

    const orderDate = new Date(ord.createdAt || Date.now()).toLocaleDateString('en-GB');
    const invoiceDate = new Date().toLocaleDateString('en-GB');
    const orderNum = ord.shiprocket?.orderId || ord.orderId?.replace(/\D/g, '') || ord.orderId;
    const invoiceNum = `Retail${String(ord.orderId || '').replace(/\D/g, '').slice(-5).padStart(5, '0') || '00002'}`;
    const channel = `CUSTOM (${ord.shiprocket?.channelId || '8506269'})`;
    const shippedBy = ord.shiprocket?.courierName || ord.shiprocket?.courier || '';
    const awbNo = ord.shiprocket?.awbCode || '';

    // Payment & Partial COD Calculation
    const paymentMethodRaw = (ord.payment?.method || 'cod').toLowerCase();
    const isPartialCod = paymentMethodRaw.includes('partial') || Number(ord.payment?.advancePaid) > 0;
    const advancePaid = isPartialCod ? (Number(ord.payment?.advancePaid) || 200) : 0;
    const totalOrderAmount = Number(ord.totalAmount || 0);
    const remainingCodToPay = Math.max(0, totalOrderAmount - advancePaid);

    // Strict display: Only 'cod' or 'prepaid' (never says 'partial cod')
    const paymentMethodDisplay = (paymentMethodRaw === 'prepaid' || paymentMethodRaw === 'online') ? 'prepaid' : 'cod';

    const html = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8"/>
    <title>Tax Invoice - ${ord.orderId}</title>
    <style>
      @font-face {
        font-family: 'Helvetica Now Text';
        src: url('/Font/HelveticaNowText.woff2') format('woff2');
        font-weight: 100 450;
      }
      @font-face {
        font-family: 'Helvetica Now Text Medium';
        src: url('/Font/HelveticaNowTextMedium.woff2') format('woff2');
        font-weight: 451 900;
      }
      @page {
        size: A4 portrait;
        margin: 0;
      }
      * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }
      body {
        font-family: 'Helvetica Now Text', sans-serif;
        color: #333333;
        background: #ffffff;
        width: 595.28pt;
        min-height: 841.89pt;
        padding: 34pt;
        margin: 0 auto;
        box-sizing: border-box;
        font-size: 9.0pt;
        line-height: 1.35;
      }
      .brand-title {
        text-align: center;
        font-family: 'Helvetica Now Text Medium', sans-serif;
        font-size: 13.5pt;
        font-weight: 700;
        color: #333333;
        margin-bottom: 11pt;
      }
      .line-dark {
        border: none;
        border-top: 0.75pt solid #5d6975;
        margin: 0;
      }
      .line-light {
        border: none;
        border-top: 0.75pt solid #c1ced9;
        margin: 0;
      }
      .invoice-title {
        text-align: center;
        font-family: 'Helvetica Now Text Medium', sans-serif;
        font-size: 21.6pt;
        font-weight: 700;
        letter-spacing: 1.5px;
        color: #333333;
        margin: 9pt 0;
      }
      .three-columns {
        display: flex;
        width: 100%;
        margin-top: 15pt;
        margin-bottom: 12pt;
      }
      .col-shipping {
        width: 157pt;
        padding-right: 8pt;
      }
      .col-sold-by {
        width: 158pt;
        border-left: 0.75pt dashed #cccccc;
        border-right: 0.75pt dashed #cccccc;
        padding: 0 10pt;
        text-align: right;
      }
      .col-invoice-details {
        width: 212pt;
        padding-left: 10pt;
      }
      .col-header {
        font-family: 'Helvetica Now Text Medium', sans-serif;
        font-size: 9.0pt;
        font-weight: 700;
        color: #333333;
        margin-bottom: 8pt;
        text-transform: uppercase;
      }
      .col-header-sold {
        text-align: left;
        font-family: 'Helvetica Now Text Medium', sans-serif;
        font-size: 9.0pt;
        font-weight: 700;
        color: #333333;
        margin-bottom: 8pt;
        text-transform: uppercase;
      }
      .addr-line {
        font-size: 9.0pt;
        line-height: 1.35;
        color: #333333;
        margin-bottom: 1.5pt;
      }
      .sold-line {
        font-size: 9.0pt;
        line-height: 1.35;
        color: #333333;
        margin-bottom: 1.5pt;
        text-align: right;
      }
      .addr-gap {
        height: 10pt;
      }
      .meta-table {
        width: 100%;
        border-collapse: collapse;
      }
      .meta-table td {
        padding: 1.5pt 0;
        vertical-align: top;
      }
      .meta-label {
        font-family: 'Helvetica Now Text Medium', sans-serif;
        font-size: 8.2pt;
        font-weight: 700;
        color: #333333;
        text-transform: uppercase;
        width: 82pt;
      }
      .meta-value {
        font-size: 9.0pt;
        color: #333333;
      }
      .items-table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 2pt;
      }
      .items-table th {
        font-family: 'Helvetica Now Text Medium', sans-serif;
        font-size: 6.0pt;
        font-weight: 700;
        color: #333333;
        border-bottom: 0.75pt solid #c1ced9;
        padding: 5pt 2pt 4pt 2pt;
        text-transform: uppercase;
        vertical-align: bottom;
      }
      .items-table td {
        font-size: 6.0pt;
        color: #333333;
        padding: 10pt 2pt;
        vertical-align: top;
      }
      .prod-name {
        font-family: 'Helvetica Now Text Medium', sans-serif;
        font-size: 8.2pt;
        font-weight: 700;
        color: #333333;
      }
      .prod-sku {
        font-size: 7.5pt;
        color: #333333;
        margin-top: 2pt;
      }
      .sig-box {
        width: 126pt;
        height: 54pt;
        border: 0.75pt solid #666666;
        margin-bottom: 6pt;
        background: #ffffff;
      }
      .sig-text {
        font-family: 'Helvetica Now Text Medium', sans-serif;
        font-size: 9.0pt;
        font-weight: 700;
        color: #333333;
        line-height: 1.3;
      }
      .reverse-charge {
        font-size: 9.0pt;
        color: #333333;
        margin-top: 14pt;
      }
      @media print {
        html, body {
          width: 595.28pt !important;
          min-height: 841.89pt !important;
          margin: 0 !important;
          padding: 34pt !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
      }
    </style>
  </head>
  <body>
    <!-- Top Centered Header -->
    <div class="brand-title">${sellerSettings.companyName || 'Sonu Shoe'}</div>
    <div class="line-dark"></div>

    <div class="invoice-title">TAX INVOICE</div>
    <div class="line-dark"></div>

    <!-- Three Columns (Shipping Address | Sold By | Invoice Details) -->
    <div class="three-columns">
      <!-- 1. Shipping Address -->
      <div class="col-shipping">
        <div class="col-header">SHIPPING ADDRESS:</div>
        <p class="addr-line" style="font-family: 'Helvetica Now Text Medium', sans-serif; font-weight: 700;">
          ${customerName}
        </p>
        ${(houseNo || street) ? `<p class="addr-line">${[houseNo, street].filter(Boolean).join(', ')}</p>` : ''}
        ${landmark ? `<p class="addr-line">${landmark}</p>` : ''}
        ${(city || state) ? `<p class="addr-line">${[city, state].filter(Boolean).join(', ')}</p>` : ''}
        <div class="addr-gap"></div>
        ${(city || pincode) ? `<p class="addr-line">${[city, pincode].filter(Boolean).join(' ')}</p>` : ''}
        ${state ? `<p class="addr-line">${state}</p>` : ''}
        ${country ? `<p class="addr-line">${country}</p>` : ''}
        ${customerStateCode ? `<p class="addr-line" style="margin-top: 2pt;">State Code : ${customerStateCode}</p>` : ''}
      </div>

      <!-- 2. Sold By (Strictly right-aligned inside middle dashed column) -->
      <div class="col-sold-by">
        <div class="col-header-sold">SOLD BY:</div>
        <p class="sold-line" style="font-family: 'Helvetica Now Text Medium', sans-serif; font-weight: 700;">
          ${sellerSettings.companyName || 'Sonu Shoe'}
        </p>
        <p class="sold-line">${sellerSettings.addressLine1 || '34, Rd Number 2, Nehru Nagar'},</p>
        <p class="sold-line">${sellerSettings.addressLine2 || 'Patliputra Colony, Patna, Bihar'}</p>
        <p class="sold-line">${sellerSettings.pincode || '800013'}</p>
        <div class="addr-gap"></div>
        <p class="sold-line">${sellerSettings.city || 'Patna'} ${sellerSettings.pincode || '800013'}</p>
        <p class="sold-line">${sellerSettings.state || 'Bihar'}</p>
        <p class="sold-line">${sellerSettings.country || 'India'}</p>
        <p class="sold-line">State Code : ${sellerSettings.stateCode || '10'}</p>
        <p class="sold-line">Ph: ${sellerSettings.phone || '8008439762'}</p>
        <p class="sold-line">GSTIN No.${sellerSettings.gstin ? ' ' + sellerSettings.gstin : ''}</p>
        <p class="sold-line" style="margin-top: 2pt;">Email:</p>
        <p class="sold-line" style="font-size: 8.5pt;">${sellerSettings.email || 'yashodanandkumar15@gmail.com'}</p>
      </div>

      <!-- 3. Invoice Details -->
      <div class="col-invoice-details">
        <div class="col-header">INVOICE DETAILS:</div>
        <table class="meta-table">
          <tr>
            <td class="meta-label">INVOICE NO.</td>
            <td class="meta-value">: ${invoiceNum}</td>
          </tr>
          <tr>
            <td class="meta-label">INVOICE DATE</td>
            <td class="meta-value">: ${invoiceDate}</td>
          </tr>
          <tr>
            <td class="meta-label">ORDER NO.</td>
            <td class="meta-value">: ${orderNum}</td>
          </tr>
          <tr>
            <td class="meta-label">ORDER DATE</td>
            <td class="meta-value">: ${orderDate}</td>
          </tr>
          <tr>
            <td class="meta-label">CHANNEL</td>
            <td class="meta-value">: ${channel}</td>
          </tr>
          <tr>
            <td class="meta-label">SHIPPED BY</td>
            <td class="meta-value">: ${shippedBy}</td>
          </tr>
          <tr>
            <td class="meta-label">AWB NO.</td>
            <td class="meta-value">: ${awbNo}</td>
          </tr>
          <tr>
            <td class="meta-label">PAYMENT<br/>METHOD</td>
            <td class="meta-value">: ${paymentMethodDisplay}</td>
          </tr>
          <tr>
            <td class="meta-label">REMARK</td>
            <td class="meta-value">: No Remark.</td>
          </tr>
        </table>
      </div>
    </div>

    <!-- Line above product table -->
    <div class="line-light" style="margin-top: 14pt; margin-bottom: 2pt;"></div>

    <!-- Product Items Table -->
    <table class="items-table">
      <thead>
        <tr>
          <th style="text-align: left; width: 24pt;">S.NO.</th>
          <th style="text-align: left; width: 185pt;">PRODUCT NAME</th>
          <th style="text-align: center; width: 26pt;">HSN</th>
          <th style="text-align: center; width: 26pt;">QTY</th>
          <th style="text-align: right; width: 53pt;">UNIT PRICE</th>
          <th style="text-align: right; width: 56pt;">UNIT DISCOUNT</th>
          <th style="text-align: right; width: 36pt;">TAXABLE<br/>VALUE</th>
          <th style="text-align: right; width: 53pt;">CGST<br/><span style="font-weight: normal;">(Value | %)</span></th>
          <th style="text-align: right; width: 43pt;">SGST<br/><span style="font-weight: normal;">(Value | %)</span></th>
          <th style="text-align: right; width: 53pt;">TOTAL<br/><span style="font-weight: normal;">(Including GST)</span></th>
        </tr>
      </thead>
      <tbody>
        ${items.map((it, idx) => {
      const qty = Number(it.quantity || 1);
      const unitPrice = Number(it.priceNumber || 13995);
      const taxableVal = (unitPrice * qty).toFixed(2);
      const sku = it.sku || (it.id ? `${it.id}-${(it.size || 'UK-4').replace(/\s+/g, '-')}` : 'drop-hybrid-women-UK-4');
      return `
            <tr>
              <td style="text-align: left;">${idx + 1}</td>
              <td style="text-align: left;">
                <div class="prod-name">${it.name || 'SONU Hybrid RN'}</div>
                <div class="prod-sku">SKU : ${sku}</div>
              </td>
              <td style="text-align: center;">640411</td>
              <td style="text-align: center;">${qty}</td>
              <td style="text-align: right;">Rs. ${unitPrice.toFixed(2)}</td>
              <td style="text-align: right;">0.00</td>
              <td style="text-align: right;">${taxableVal}</td>
              <td style="text-align: right;">0.00 | 0.00</td>
              <td style="text-align: right;">0.00 | 0.00</td>
              <td style="text-align: right;">${taxableVal}</td>
            </tr>
          `;
    }).join('')}
      </tbody>
    </table>

    <!-- Totals Summary Section (Standard bill summary) -->
    <div style="margin-top: 15pt; text-align: right;">
      ${advancePaid > 0 ? `
        <div style="display: flex; justify-content: flex-end; gap: 40pt; font-size: 8.2pt; font-family: 'Helvetica Now Text Medium', sans-serif; font-weight: 700; color: #333333; padding-right: 2pt;">
          <span>Paid in Advance</span>
          <span style="font-family: 'Helvetica Now Text', sans-serif; font-weight: normal; font-size: 9.0pt;">Rs. ${advancePaid.toFixed(2)}</span>
        </div>
      ` : ''}

      <div style="border-top: 0.75pt solid #5d6975; width: 261pt; margin-left: auto; margin-top: 5pt; margin-bottom: 5pt;"></div>

      <div style="display: flex; justify-content: flex-end; gap: 40pt; font-size: 10.5pt; font-family: 'Helvetica Now Text Medium', sans-serif; font-weight: 700; color: #333333; padding-right: 2pt;">
        <span>NET TOTAL (In Value)</span>
        <span>Rs. ${remainingCodToPay.toFixed(2)}</span>
      </div>
    </div>

    <!-- Full-width line below totals -->
    <div class="line-dark" style="margin-top: 10pt; margin-bottom: 22pt;"></div>

    <!-- Bottom Section: Signature & Reverse Charge -->
    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
      <div>
        <div class="sig-box"></div>
        <div class="sig-text">
          Authorized Signature for<br/>
          ${sellerSettings.companyName || 'Sonu Shoe'}
        </div>
      </div>
      <div class="reverse-charge">
        Whether tax is payable under reverse charge- ${sellerSettings.reverseCharge || 'No'}
      </div>
    </div>

    <script>
      window.onload = function() {
        window.print();
      };
    </script>
  </body>
</html>`;

    printWindow.document.write(html);
    printWindow.document.close();
    showToast(`✓ Generated Tax Invoice for #${ord.orderId}`);
  };

  const handleCloneOrder = async (ord) => {
    try {
      setActionLoading(`clone_${ord.orderId}`);
      const clonedNum = Math.floor(100000 + Math.random() * 900000);
      const newOrderId = `SONU-IN-${clonedNum}`;
      const payload = {
        ...ord,
        _id: undefined,
        orderId: newOrderId,
        createdAt: new Date(),
        updatedAt: new Date(),
        fulfillmentStatus: 'new',
        shiprocket: {
          ...ord.shiprocket,
          orderId: Math.floor(10000000 + Math.random() * 90000000),
          shipmentId: Math.floor(1000000 + Math.random() * 9000000),
          awbCode: null,
          status: 'NEW',
        },
      };
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`✓ Cloned order to #${newOrderId}`);
        setOrders((prev) => [data.order, ...prev]);
        setSelectedOrder(data.order);
      } else {
        alert(data.error || 'Failed to clone order');
      }
    } catch (err) {
      console.error(err);
      alert('Error cloning order');
    } finally {
      setActionLoading(null);
    }
  };

  const handleMoveToOnHold = async (ord) => {
    const nextStatus = ord.fulfillmentStatus === 'on_hold' ? 'new' : 'on_hold';
    await updateStatus(ord.orderId, nextStatus);
    showToast(
      nextStatus === 'on_hold'
        ? `✓ Order ${ord.orderId} moved to On Hold`
        : `✓ Order ${ord.orderId} restored to Ready to Process`
    );
  };

  const handleAddOrderTag = (ord) => {
    const tag = window.prompt('Enter tag to add (e.g. VIP, Urgent, Address Checked):');
    if (!tag || !tag.trim()) return;
    showToast(`✓ Added tag "${tag.trim()}" to #${ord.orderId}`);
  };

  const handleExportCSV = () => {
    if (!filteredOrders.length) {
      showToast('No orders to export');
      return;
    }
    const headers = [
      'Order ID',
      'Date',
      'Customer Name',
      'Phone',
      'Email',
      'Status',
      'Payment Method',
      'Amount (INR)',
      'AWB Code',
      'Courier',
    ];
    const rows = filteredOrders.map((o) => [
      `"${o.orderId}"`,
      `"${new Date(o.createdAt || Date.now()).toISOString().split('T')[0]}"`,
      `"${(o.customer?.name || '').replace(/"/g, '""')}"`,
      `"${o.customer?.mobile || ''}"`,
      `"${o.customer?.email || ''}"`,
      `"${o.fulfillmentStatus || 'new'}"`,
      `"${o.payment?.method || 'prepaid'}"`,
      Number(o.totalAmount || 0),
      `"${o.shiprocket?.awbCode || ''}"`,
      `"${o.shiprocket?.courierName || ''}"`,
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `sonu_orders_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`✓ Exported ${filteredOrders.length} orders to CSV`);
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard?.writeText(text);
    showToast(`Copied ${label} to clipboard!`);
  };

  const filteredOrders = useMemo(() => {
    return orders.filter((ord) => {
      // Ignore uncompleted/abandoned checkout drafts
      if (ord.payment?.status === 'PENDING_PAYMENT') return false;

      const status = (ord.fulfillmentStatus || ord.shiprocket?.status || 'new').toLowerCase();

      // Cancelled orders: ONLY shown in 'all' tab. Completely excluded from every other tab!
      if (status === 'cancelled') {
        return activeTab === 'all';
      }

      if (activeTab === 'new') {
        return (
          status === 'new' ||
          status === 'pending' ||
          status === 'unfulfilled' ||
          status === 'confirmed' ||
          (!ord.fulfillmentStatus && status !== 'on_hold' && status !== 'hold')
        );
      }
      if (activeTab === 'ready_to_ship') return status === 'ready_to_ship';
      if (activeTab === 'on_hold') return status === 'on_hold' || status === 'hold';
      if (activeTab === 'pickups') {
        return (
          status === 'pickup_scheduled' ||
          status === 'manifested' ||
          status === 'pickup_queued' ||
          status === 'picked_up'
        );
      }
      if (activeTab === 'in_transit') {
        return (
          status === 'shipped' ||
          status === 'in_transit' ||
          status === 'out_for_delivery'
        );
      }
      if (activeTab === 'delivered') return status === 'delivered';
      if (activeTab === 'rto') {
        return (
          status === 'rto' ||
          status === 'return_to_origin' ||
          status === 'returned'
        );
      }
      return true; // 'all'
    });
  }, [orders, activeTab]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / itemsPerPage));
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredOrders.slice(start, start + itemsPerPage);
  }, [filteredOrders, currentPage, itemsPerPage]);

  const tabCounts = useMemo(() => {
    const counts = {
      new: 0,
      ready_to_ship: 0,
      on_hold: 0,
      pickups: 0,
      in_transit: 0,
      delivered: 0,
      rto: 0,
      all: 0,
    };

    orders.forEach((ord) => {
      if (ord.payment?.status === 'PENDING_PAYMENT') return;
      counts.all += 1;
      const status = (ord.fulfillmentStatus || ord.shiprocket?.status || 'new').toLowerCase();

      // Cancelled orders only belong to 'all'
      if (status === 'cancelled') return;

      if (status === 'on_hold' || status === 'hold') {
        counts.on_hold += 1;
      } else if (
        status === 'new' ||
        status === 'pending' ||
        status === 'unfulfilled' ||
        status === 'confirmed' ||
        !ord.fulfillmentStatus
      ) {
        counts.new += 1;
      } else if (status === 'ready_to_ship') {
        counts.ready_to_ship += 1;
      } else if (
        status === 'pickup_scheduled' ||
        status === 'manifested' ||
        status === 'pickup_queued' ||
        status === 'picked_up'
      ) {
        counts.pickups += 1;
      } else if (
        status === 'shipped' ||
        status === 'in_transit' ||
        status === 'out_for_delivery'
      ) {
        counts.in_transit += 1;
      } else if (status === 'delivered') {
        counts.delivered += 1;
      } else if (
        status === 'rto' ||
        status === 'return_to_origin' ||
        status === 'returned'
      ) {
        counts.rto += 1;
      }
    });

    return counts;
  }, [orders]);

  // Keyboard Shortcuts: Option + Shift + I (Invoice), Option + Shift + E (Edit Order)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.altKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.code === 'KeyI')) {
        e.preventDefault();
        const target = selectedOrder || paginatedOrders[0];
        if (target) handleDownloadInvoice(target);
      }
      if (e.altKey && e.shiftKey && (e.key === 'E' || e.key === 'e' || e.code === 'KeyE')) {
        e.preventDefault();
        const target = selectedOrder || paginatedOrders[0];
        if (target) setSelectedOrder(target);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedOrder, paginatedOrders]);

  const navTabs = [
    { id: 'new', label: 'New' },
    { id: 'ready_to_ship', label: 'Ready to Ship' },
    { id: 'on_hold', label: 'Hold' },
    { id: 'pickups', label: 'Pickup & Manifested' },
    { id: 'in_transit', label: 'In Transit' },
    { id: 'delivered', label: 'Delivered' },
    { id: 'rto', label: 'RTO' },
    { id: 'all', label: 'All' },
  ];

  return (
    <AdminShell>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-[#111111] text-white text-[13px] px-5 py-2.5 rounded-full border border-neutral-800 shadow-2xl flex items-center gap-2 animate-toast pointer-events-none">
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="w-full flex-1 flex flex-col min-h-[calc(100vh-48px)] text-[#111111]" style={{ fontFamily: "'Helvetica Now Text', sans-serif" }}>

        {/* 1. TOP HEADER BAR */}
        <div className="bg-white border-b border-neutral-200 -mt-4 sm:-mt-6 -mx-4 sm:-mx-6 px-6 py-4 mb-6 shadow-2xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">

            {/* Left: Orders Title & Status Badge */}
            <div className="flex items-center gap-3">
              <h1 className="text-[22px] font-bold text-[#111111] tracking-tight">
                Orders
              </h1>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-neutral-200 bg-neutral-100 text-[11.5px] font-medium text-neutral-800">
                <span className="w-1.5 h-1.5 rounded-full bg-[#111111]" />
                <span>Shiprocket Mock</span>
              </div>
            </div>

            {/* Center: Search Group */}
            <div className="flex-1 max-w-[500px]">
              <form onSubmit={handleSearchSubmit} className="flex items-center border border-neutral-300 rounded-lg bg-white overflow-hidden shadow-2xs focus-within:border-[#111111] transition-all">
                <div className="flex items-center gap-2 px-3 flex-1">
                  <Search className="w-4 h-4 text-neutral-400 shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by Order ID, Buyer, Email, Phone..."
                    className="w-full py-2 text-[13px] outline-none text-[#111111] placeholder:text-neutral-400 bg-transparent"
                  />
                </div>
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      fetchOrders();
                    }}
                    className="px-2 text-neutral-400 hover:text-black text-xs cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </form>
            </div>

            {/* Right: + Create Test Order & Refresh */}
            <div className="flex items-center gap-2.5 shrink-0">
              <button
                type="button"
                disabled={actionLoading === 'create_test'}
                onClick={handleCreateTestOrder}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#111111] hover:bg-black text-white text-[13px] font-medium transition-all shadow-xs cursor-pointer active:scale-[0.98] disabled:opacity-50"
              >
                {actionLoading === 'create_test' ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                ) : (
                  <Plus className="w-3.5 h-3.5" />
                )}
                <span>Create Test Order</span>
              </button>

              <button
                type="button"
                onClick={fetchOrders}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-neutral-300 bg-white hover:bg-neutral-100 text-[13px] font-medium text-[#111111] shadow-2xs transition-colors cursor-pointer"
                title="Refresh"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-neutral-700 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>

          </div>
        </div>

        {/* 2. PRIMARY NAVIGATION TABS */}
        <div className="flex items-center gap-8 border-b border-neutral-200 overflow-x-auto scrollbar-none mb-4">
          {navTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const count = tabCounts[tab.id];
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id);
                  setCurrentPage(1);
                }}
                className={`pb-3 text-[13.5px] font-medium transition-all cursor-pointer whitespace-nowrap relative ${isActive
                    ? 'text-[#111111] border-b-2 border-[#111111] font-bold'
                    : 'text-neutral-500 hover:text-[#111111] border-b-2 border-transparent'
                  }`}
              >
                <span>{tab.label}</span>
                {count > 0 && tab.id !== 'all' && (
                  <span className={`ml-1.5 text-[11px] px-1.5 py-0.2 rounded-full font-bold ${isActive ? 'bg-[#111111] text-white' : 'bg-neutral-200 text-neutral-700'
                    }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* 3. FILTER CONTROLS & EXPORT */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <p className="text-[12.5px] text-neutral-500 font-normal">
            Showing {filteredOrders.length} {filteredOrders.length === 1 ? 'Order' : 'Orders'} (Page {currentPage} of {totalPages})
          </p>

          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-800 text-[12.5px] font-medium shadow-2xs transition-colors cursor-pointer self-start sm:self-auto"
            title="Export Orders to CSV"
          >
            <Download className="w-3.5 h-3.5 text-neutral-600" />
            <span>Export CSV</span>
          </button>
        </div>

        {/* 5. ORDERS TABLE & PAGINATION CONTAINER (Dynamic Viewport Height) */}
        <div className="w-full flex-1 flex flex-col min-h-[calc(100vh-230px)]">

          <div className="w-full overflow-x-auto scrollbar-none flex-1 pb-4">
            {/* Table Header Row */}
            <div className="grid grid-cols-[36px_180px_220px_190px_150px_110px_110px_125px_120px] gap-3 px-4 py-2.5 text-[11.5px] font-bold text-neutral-600 uppercase tracking-wider border-b border-neutral-200 bg-neutral-100/70 rounded-t-lg min-w-[1280px]">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedOrders.length > 0 && selectedOrders.length === paginatedOrders.length}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 rounded text-black accent-black cursor-pointer"
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
              <div className="space-y-2 mt-2 min-w-[1280px]">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="bg-white rounded-lg border border-neutral-200 p-4 grid grid-cols-[36px_180px_220px_190px_150px_110px_110px_125px_120px] gap-3 items-center animate-pulse">
                    <div className="w-4 h-4 rounded bg-neutral-200" />
                    <div className="space-y-2">
                      <div className="w-24 h-4 rounded bg-neutral-200" />
                      <div className="w-20 h-3 rounded bg-neutral-100" />
                    </div>
                    <div className="space-y-2">
                      <div className="w-32 h-4 rounded bg-neutral-200" />
                      <div className="w-24 h-3 rounded bg-neutral-100" />
                    </div>
                    <div className="space-y-2">
                      <div className="w-36 h-4 rounded bg-neutral-200" />
                      <div className="w-20 h-3 rounded bg-neutral-100" />
                    </div>
                    <div className="w-24 h-4 rounded bg-neutral-100" />
                    <div className="w-16 h-4 rounded bg-neutral-200" />
                    <div className="w-20 h-4 rounded bg-neutral-100" />
                    <div className="w-14 h-6 rounded-full bg-neutral-200" />
                    <div className="w-20 h-7 rounded bg-neutral-200" />
                  </div>
                ))}
              </div>
            ) : paginatedOrders.length > 0 ? (
              <div className="space-y-2 mt-2 min-w-[1266px]">
                {paginatedOrders.map((ord) => {
                  const customer = ord.customer || {};
                  const customerName = customer.name || `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || ord.customerName || 'Customer';
                  const email = customer.email || ord.customerEmail || '—';
                  const rawPhone = customer.mobile || ord.customerPhone || ord.address?.mobile || '';
                  const isPhoneUnmasked = !!unmaskedPhones[ord.orderId];
                  const displayPhone = isPhoneUnmasked ? (rawPhone ? `+91 ${rawPhone}` : '—') : (rawPhone ? 'xxxxxxxxxx' : '—');

                  const addr = customer.address || ord.address || {};
                  const fullAddress = typeof addr === 'string' ? addr : [addr.houseNo, addr.street || addr.roadArea, addr.city, addr.state, addr.pincode].filter(Boolean).join(', ');

                  const items = ord.items || [];
                  const firstItem = items[0] || {};

                  const amount = Number(ord.totalAmount || ord.amount || 13995);
                  const isCod = ord.payment?.method === 'partial_cod' || ord.payment?.method === 'cod';

                  const rawStatus = (ord.fulfillmentStatus || ord.shiprocket?.status || 'NEW').toLowerCase();
                  const isCancelled = rawStatus === 'cancelled';
                  const isHold = !isCancelled && (rawStatus === 'on_hold' || rawStatus === 'hold');
                  const isNew = !isCancelled && !isHold && (rawStatus === 'new' || rawStatus === 'pending' || rawStatus === 'unfulfilled' || rawStatus === 'confirmed' || !ord.fulfillmentStatus);
                  const isReadyToShip = !isCancelled && rawStatus === 'ready_to_ship';
                  const isPickup = !isCancelled && (rawStatus === 'pickup_scheduled' || rawStatus === 'pickup_queued' || rawStatus === 'picked_up');
                  const isManifested = !isCancelled && rawStatus === 'manifested';
                  const isInTransit = !isCancelled && (rawStatus === 'shipped' || rawStatus === 'in_transit' || rawStatus === 'out_for_delivery');
                  const isDelivered = !isCancelled && rawStatus === 'delivered';
                  const isRto = !isCancelled && (rawStatus === 'rto' || rawStatus === 'return_to_origin' || rawStatus === 'returned');

                  const isSelected = selectedOrders.includes(ord.orderId);
                  const hasEmail = ord.emailLogs && ord.emailLogs.length > 0;
                  const hasWhatsApp = ord.whatsappLogs && ord.whatsappLogs.length > 0;

                  const dateObj = ord.createdAt ? new Date(ord.createdAt) : new Date();
                  const formattedDate = dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
                  const formattedTime = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

                  return (
                    <div
                      key={ord.orderId}
                      onClick={() => setSelectedOrder(ord)}
                      className={`grid grid-cols-[36px_180px_220px_190px_150px_110px_110px_125px_120px] gap-3 px-4 py-3.5 bg-white rounded-lg border transition-all cursor-pointer items-start text-[13px] ${isSelected
                          ? 'border-[#111111] shadow-[0_0_0_1px_#111111] bg-neutral-50/60'
                          : 'border-neutral-200 hover:border-neutral-400 hover:shadow-2xs'
                        }`}
                    >

                      {/* 1. Checkbox */}
                      <div className="pt-1" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => toggleSelectRow(ord.orderId, e)}
                          className="w-4 h-4 rounded text-black accent-black cursor-pointer"
                        />
                      </div>

                      {/* 2. Order Details */}
                      <div>
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedOrder(ord);
                          }}
                          className="text-[#111111] font-bold hover:underline cursor-pointer block tracking-tight text-[13.5px]"
                        >
                          {ord.orderId}
                        </span>

                        <p className="text-[11.5px] text-neutral-500 mt-0.5">
                          {formattedDate} | {formattedTime}
                        </p>

                        <div className="flex items-center gap-1 text-[11px] text-neutral-500 mt-1.5">
                          <ShoppingCart className="w-3.5 h-3.5 text-neutral-400" />
                          <span>Shipment: {ord.shiprocket?.shipmentId || 'Pending'}</span>
                        </div>

                        {hasEmail ? (
                          <div className="mt-1.5 inline-flex items-center gap-1 text-[10.5px] font-medium text-neutral-800 bg-neutral-100 px-1.5 py-0.5 rounded border border-neutral-200" title={`Email sent to ${ord.customer?.email || 'customer'}`}>
                            <Mail className="w-3 h-3 text-neutral-700" />
                            <span>Email Sent</span>
                          </div>
                        ) : hasWhatsApp ? (
                          <div className="mt-1.5 inline-flex items-center gap-1 text-[10.5px] font-medium text-neutral-800 bg-neutral-100 px-1.5 py-0.5 rounded border border-neutral-200">
                            <MessageSquare className="w-3 h-3 text-neutral-700" />
                            <span>WA Alert Sent</span>
                          </div>
                        ) : null}
                      </div>

                      {/* 3. Customer Details */}
                      <div>
                        <p className="font-semibold text-[#111111] text-[13px]">
                          {customerName}
                        </p>

                        <p className="text-[12px] text-neutral-500 truncate max-w-[210px] mt-0.5" title={email}>
                          {email}
                        </p>

                        <div className="flex items-center gap-1.5 text-[12px] text-neutral-600 mt-0.5">
                          <span>{displayPhone}</span>
                          <button
                            type="button"
                            onClick={(e) => togglePhoneMask(ord.orderId, e)}
                            className="text-neutral-400 hover:text-black transition-colors p-0.5 cursor-pointer"
                            title={isPhoneUnmasked ? 'Mask phone' : 'Reveal phone'}
                          >
                            {isPhoneUnmasked ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>

                        <div className="relative group/addr inline-block max-w-[210px] mt-1" onClick={(e) => e.stopPropagation()}>
                          <div className="text-[11.5px] text-neutral-500 truncate cursor-help border-b border-dotted border-neutral-300">
                            {fullAddress || 'Patna, Bihar'}
                          </div>

                          {/* Speech Bubble Tooltip */}
                          <div className="invisible group-hover/addr:visible opacity-0 group-hover/addr:opacity-100 transition-all duration-150 absolute bottom-full left-0 mb-2.5 z-50 w-72 p-4 bg-white rounded-2xl shadow-2xl border border-neutral-200/90 pointer-events-none text-left">
                            <div className="text-[13px] font-semibold text-[#111111] leading-relaxed space-y-0.5">
                              {formatAddressLines(addr, fullAddress).map((line, idx) => (
                                <p key={idx}>{line}</p>
                              ))}
                            </div>
                            <div className="absolute -bottom-1.5 left-6 w-3 h-3 bg-white border-r border-b border-neutral-200/90 rotate-45" />
                          </div>
                        </div>
                      </div>

                      {/* 4. Product Details */}
                      <div>
                        <p className="font-semibold text-[#111111] text-[13px] truncate" title={firstItem.name || 'Sonu Footwear'}>
                          {firstItem.name || 'Sonu Hybrid RN'}
                        </p>

                        <p className="text-[11.5px] text-neutral-500 mt-0.5 truncate">
                          Size: {firstItem.size || 'UK 8'} &bull; Qty: {firstItem.quantity || 1}
                        </p>

                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedOrder(ord);
                            }}
                            className="text-[11.5px] text-neutral-800 hover:underline font-semibold mt-1 block"
                          >
                            +{items.length - 1} more item{items.length - 1 > 1 ? 's' : ''}
                          </button>
                        )}
                      </div>

                      {/* 5. Package Details */}
                      <div className="text-[12px] text-neutral-600 space-y-0.5">
                        <p><span className="text-neutral-500">Weight:</span> 0.9 Kg</p>
                        <p className="text-neutral-500">30 x 20 x 12 cm</p>
                        {ord.shiprocket?.courierName && (
                          <p className="text-[11px] text-[#111111] font-medium truncate" title={ord.shiprocket.courierName}>
                            {ord.shiprocket.courierName}
                          </p>
                        )}
                      </div>

                      {/* 6. Payment */}
                      <div>
                        <p className="font-bold text-[#111111] text-[13.5px]">
                          ₹ {amount.toLocaleString('en-IN')}
                        </p>
                        <div className="mt-1">
                          {isCod ? (
                            <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-neutral-100 text-neutral-800 border border-neutral-300">
                              Partial COD
                            </span>
                          ) : (
                            <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#111111] text-white">
                              Prepaid
                            </span>
                          )}
                        </div>
                      </div>

                      {/* 7. Pickup Address */}
                      <div onClick={(e) => e.stopPropagation()}>
                        <div className="relative group/pickup inline-block">
                          <span className="text-[12.5px] font-medium text-neutral-800 border-b border-dotted border-neutral-400 cursor-help">
                            Patna Hub
                          </span>

                          {/* Speech Bubble Tooltip */}
                          <div className="invisible group-hover/pickup:visible opacity-0 group-hover/pickup:opacity-100 transition-all duration-150 absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 z-50 w-72 p-4 bg-white rounded-2xl shadow-2xl border border-neutral-200/90 pointer-events-none text-left">
                            <div className="text-[13px] font-semibold text-[#111111] leading-relaxed space-y-0.5">
                              <p>34 Rd Number 2, Nehru Nagar,</p>
                              <p>Patliputra Colony, Patna, Bihar</p>
                              <p>Patna, Bihar</p>
                              <p>800013, India</p>
                            </div>
                            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-r border-b border-neutral-200/90 rotate-45" />
                          </div>
                        </div>
                      </div>

                      {/* 8. Status Badge */}
                      <div className="flex items-center">
                        {isNew && (
                          <span className="inline-flex items-center justify-center px-2 py-0.5 rounded text-[10.5px] font-bold bg-neutral-100 text-neutral-800 border border-neutral-300 whitespace-nowrap shrink-0">
                            NEW
                          </span>
                        )}
                        {isHold && (
                          <span className="inline-flex items-center justify-center px-2 py-0.5 rounded text-[10.5px] font-bold bg-amber-50 text-amber-800 border border-amber-300 whitespace-nowrap shrink-0">
                            HOLD
                          </span>
                        )}
                        {isReadyToShip && (
                          <span className="inline-flex items-center justify-center px-2 py-0.5 rounded text-[10.5px] font-bold bg-neutral-100 text-neutral-800 border border-neutral-300 whitespace-nowrap shrink-0">
                            READY TO SHIP
                          </span>
                        )}
                        {isPickup && (
                          <span className="inline-flex items-center justify-center px-2 py-0.5 rounded text-[10.5px] font-bold bg-neutral-100 text-neutral-800 border border-neutral-300 whitespace-nowrap shrink-0">
                            PICKUP
                          </span>
                        )}
                        {isManifested && (
                          <span className="inline-flex items-center justify-center px-2 py-0.5 rounded text-[10.5px] font-bold bg-neutral-100 text-neutral-800 border border-neutral-300 whitespace-nowrap shrink-0">
                            MANIFESTED
                          </span>
                        )}
                        {isInTransit && (
                          <span className="inline-flex items-center justify-center px-2 py-0.5 rounded text-[10.5px] font-bold bg-neutral-100 text-neutral-800 border border-neutral-300 whitespace-nowrap shrink-0">
                            IN TRANSIT
                          </span>
                        )}
                        {isDelivered && (
                          <span className="inline-flex items-center justify-center px-2 py-0.5 rounded text-[10.5px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 whitespace-nowrap shrink-0">
                            DELIVERED
                          </span>
                        )}
                        {isRto && (
                          <span className="inline-flex items-center justify-center px-2 py-0.5 rounded text-[10.5px] font-bold bg-neutral-100 text-neutral-500 border border-neutral-300 whitespace-nowrap shrink-0">
                            RTO
                          </span>
                        )}
                        {isCancelled && (
                          <span className="inline-flex items-center justify-center px-2 py-0.5 rounded text-[10.5px] font-bold bg-rose-50 text-rose-700 border border-rose-200 whitespace-nowrap shrink-0">
                            CANCELLED
                          </span>
                        )}
                      </div>

                      {/* 9. Action Buttons */}
                      <div className="flex items-center justify-end gap-1.5 relative">
                        {isCancelled && (
                          <span className="px-2.5 py-1 text-[11.5px] font-semibold text-neutral-400 select-none">
                            Cancelled
                          </span>
                        )}
                        {isNew && (
                          <button
                            type="button"
                            disabled={actionLoading === ord.orderId}
                            onClick={(e) => handleShipNow(ord.orderId, e)}
                            className="px-3 py-1.5 rounded-lg bg-[#111111] hover:bg-black active:scale-[0.98] text-white text-[12px] font-semibold transition-all shadow-xs flex items-center justify-center min-w-[104px] cursor-pointer"
                          >
                            {actionLoading === ord.orderId ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                            ) : (
                              <span>Ready to Ship</span>
                            )}
                          </button>
                        )}

                        {isHold && (
                          <button
                            type="button"
                            disabled={actionLoading === ord.orderId}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMoveToHold(ord);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-white border border-neutral-300 hover:border-[#111111] text-[#111111] text-[12px] font-semibold transition-all shadow-xs flex items-center justify-center min-w-[76px] cursor-pointer"
                          >
                            <span>Unhold</span>
                          </button>
                        )}

                        {isReadyToShip && (
                          <button
                            type="button"
                            disabled={actionLoading === ord.orderId}
                            onClick={(e) => handleRequestPickup(ord.orderId, e)}
                            className="px-3 py-1.5 rounded-lg bg-[#111111] hover:bg-black active:scale-[0.98] text-white text-[12px] font-semibold transition-all shadow-xs flex items-center justify-center min-w-[80px] cursor-pointer"
                          >
                            {actionLoading === ord.orderId ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                            ) : (
                              <span>Pickup</span>
                            )}
                          </button>
                        )}

                        {(isPickup || isManifested) && (
                          <a
                            href={ord.shiprocket?.labelUrl || `https://apiv2.shiprocket.in/generate/label/sample_${ord.shiprocket?.shipmentId}.pdf`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="px-3 py-1.5 rounded-lg bg-white hover:bg-neutral-100 text-[#111111] border border-neutral-300 text-[12px] font-semibold transition-all shadow-2xs flex items-center gap-1 justify-center min-w-[72px]"
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
                            className="px-3 py-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-[#111111] text-[12px] font-medium transition-all border border-neutral-300 flex items-center justify-center min-w-[65px] cursor-pointer"
                          >
                            Track
                          </button>
                        )}

                        {/* Three-Dot Popover Menu (Matching Exact UI Specification) */}
                        <div className="relative" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => setOpenDropdownId(openDropdownId === ord.orderId ? null : ord.orderId)}
                            className="w-7 h-7 rounded-full bg-neutral-100 hover:bg-neutral-200 text-[#111111] flex items-center justify-center transition-colors cursor-pointer"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>

                          {openDropdownId === ord.orderId && (
                            <div className="absolute right-0 top-8 z-50 w-64 bg-white rounded-xl shadow-2xl border border-neutral-200 py-1.5 text-[13px] animate-dropdown select-none">

                              {/* 1. Download Invoice */}
                              <button
                                type="button"
                                onClick={() => {
                                  handleDownloadInvoice(ord);
                                  setOpenDropdownId(null);
                                }}
                                className="w-full px-4 py-2 text-left hover:bg-neutral-50 flex items-center justify-between text-[#111111] font-semibold cursor-pointer transition-colors"
                              >
                                <span>Download Invoice</span>
                                <span className="text-[12px] text-neutral-400 font-normal">Option + Shift + I</span>
                              </button>

                              {/* 2. Edit Order */}
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedOrder(ord);
                                  setOpenDropdownId(null);
                                }}
                                className="w-full px-4 py-2 text-left hover:bg-neutral-50 flex items-center justify-between text-[#111111] font-semibold cursor-pointer transition-colors"
                              >
                                <span>Edit Order</span>
                                <span className="text-[12px] text-neutral-400 font-normal">Option + Shift + E</span>
                              </button>

                              {/* Divider */}
                              <div className="border-t border-neutral-200 my-1 mx-3" />

                              {/* 3. Add Order Tag */}
                              <button
                                type="button"
                                onClick={() => {
                                  handleAddOrderTag(ord);
                                  setOpenDropdownId(null);
                                }}
                                className="w-full px-4 py-2 text-left hover:bg-neutral-50 flex items-center text-[#111111] font-semibold cursor-pointer transition-colors"
                              >
                                <span>Add Order Tag</span>
                              </button>

                              {/* 6. Clone Order */}
                              <button
                                type="button"
                                onClick={() => {
                                  handleCloneOrder(ord);
                                  setOpenDropdownId(null);
                                }}
                                className="w-full px-4 py-2 text-left hover:bg-neutral-50 flex items-center text-[#111111] font-semibold cursor-pointer transition-colors"
                              >
                                <span>Clone Order</span>
                              </button>

                              {/* 7. Move to On Hold */}
                              <button
                                type="button"
                                onClick={() => {
                                  handleMoveToOnHold(ord);
                                  setOpenDropdownId(null);
                                }}
                                className="w-full px-4 py-2 text-left hover:bg-neutral-50 flex items-center justify-between text-[#111111] font-semibold cursor-pointer transition-colors"
                              >
                                <span>{ord.fulfillmentStatus === 'on_hold' ? 'Remove from On Hold' : 'Move to On Hold'}</span>
                                <span className="bg-[#00a859] text-white text-[11px] font-bold px-1.5 py-0.5 rounded leading-none">
                                  New
                                </span>
                              </button>

                              {/* 8. Cancel / Restore Order */}
                              {ord.fulfillmentStatus !== 'cancelled' ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    updateStatus(ord.orderId, 'cancelled');
                                    setOpenDropdownId(null);
                                  }}
                                  className="w-full px-4 py-2 text-left hover:bg-rose-50 flex items-center text-[#e53935] font-semibold cursor-pointer transition-colors"
                                >
                                  <span>Cancel Order</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    updateStatus(ord.orderId, 'new');
                                    setOpenDropdownId(null);
                                  }}
                                  className="w-full px-4 py-2 text-left hover:bg-neutral-50 flex items-center text-neutral-700 font-semibold cursor-pointer transition-colors"
                                >
                                  <span>Restore Order</span>
                                </button>
                              )}

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
                <h3 className="text-[15px] font-bold text-[#111111]">No orders in this tab</h3>
                <p className="text-[13px] text-neutral-400 mt-1 max-w-sm mx-auto">
                  No orders match your filter. Click <strong>+ Create Test Order</strong> above to spawn a sample order instantly.
                </p>
              </div>
            )}

          </div>

          {/* 6. WORKING PAGINATION FOOTER PINNED AT VIEWPORT BOTTOM */}
          <div className="mt-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 pb-4 border-t border-neutral-200 text-[13px] text-neutral-600 bg-transparent">
            <div className="flex items-center gap-2">
              <span>Items per page:</span>
              <div className="relative inline-block">
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="appearance-none border border-neutral-300 bg-white rounded-md px-3 py-1 pr-7 text-[12.5px] font-medium text-neutral-800 cursor-pointer shadow-2xs outline-none focus:border-[#111111]"
                >
                  <option value={10}>10 Orders</option>
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
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="flex items-center gap-1 px-3 py-1 rounded-md border border-neutral-300 bg-white text-neutral-600 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>PREV</span>
              </button>

              <span className="w-8 h-8 rounded-md bg-[#111111] text-white flex items-center justify-center font-bold text-[13px]">
                {currentPage}
              </span>

              <span className="text-neutral-400 text-xs">of {totalPages}</span>

              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="flex items-center gap-1 px-3 py-1 rounded-md border border-neutral-300 bg-white text-neutral-600 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <span>NEXT</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* 7. REMADE LUXURY SLIDE-OUT ORDER DRAWER (VIEW & EDIT) */}
      {selectedOrder && editForm && (
        <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-end">
          <div
            className="fixed inset-0 bg-black/60 animate-modal-backdrop backdrop-blur-[2px]"
            onClick={() => setSelectedOrder(null)}
          />

          <div className="relative w-full max-w-[620px] bg-white h-full shadow-2xl flex flex-col z-10 overflow-hidden animate-drawer-right">
            {/* Header */}
            <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-md z-30">
              <div className="flex items-center gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10.5px] font-bold text-neutral-400 uppercase tracking-widest">ORDER</span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(selectedOrder.orderId);
                        setCopiedId(true);
                        setTimeout(() => setCopiedId(false), 2000);
                      }}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-neutral-600 hover:text-black transition-colors cursor-pointer"
                      title="Copy Order ID"
                    >
                      {copiedId ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span className="text-emerald-600">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 text-neutral-400" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                  <h3 className="text-[18px] font-bold text-[#111111] tracking-tight">
                    {selectedOrder.orderId}
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDownloadInvoice(selectedOrder)}
                  className="px-3 py-1.5 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-100 text-[#111111] text-[12px] font-semibold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
                  title="Download Tax Invoice PDF"
                >
                  <Download className="w-3.5 h-3.5 text-neutral-600" />
                  <span>Invoice</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-700 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Quick Status Control Bar */}
            <div className="px-6 py-3 bg-neutral-50/90 border-b border-neutral-200 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                  Status:
                </span>
                <select
                  value={editForm.fulfillmentStatus}
                  onChange={(e) => setEditForm({ ...editForm, fulfillmentStatus: e.target.value })}
                  className="text-[11.5px] font-bold px-2.5 py-1 rounded-md border border-neutral-300 bg-white text-[#111111] focus:border-[#111111] focus:outline-none cursor-pointer uppercase tracking-tight shadow-2xs"
                >
                  <option value="new">NEW</option>
                  <option value="ready_to_ship">READY TO SHIP</option>
                  <option value="hold">HOLD</option>
                  <option value="pickup_scheduled">PICKUP & MANIFESTED</option>
                  <option value="in_transit">IN TRANSIT</option>
                  <option value="delivered">DELIVERED</option>
                  <option value="rto">RTO</option>
                  <option value="cancelled">CANCELLED</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                {selectedOrder.fulfillmentStatus === 'new' && (
                  <button
                    type="button"
                    disabled={actionLoading === selectedOrder.orderId}
                    onClick={(e) => handleShipNow(selectedOrder.orderId, e)}
                    className="px-3 py-1 rounded-md bg-[#111111] hover:bg-black text-white text-[11px] font-semibold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Box className="w-3.5 h-3.5" />
                    <span>Ready to Ship</span>
                  </button>
                )}
                {selectedOrder.fulfillmentStatus === 'ready_to_ship' && (
                  <button
                    type="button"
                    disabled={actionLoading === selectedOrder.orderId}
                    onClick={(e) => handleRequestPickup(selectedOrder.orderId, e)}
                    className="px-3 py-1 rounded-md bg-[#111111] hover:bg-black text-white text-[11px] font-semibold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Truck className="w-3.5 h-3.5" />
                    <span>Schedule Pickup</span>
                  </button>
                )}
                {(selectedOrder.fulfillmentStatus === 'pickup_scheduled' || selectedOrder.fulfillmentStatus === 'manifested') && (
                  <button
                    type="button"
                    disabled={actionLoading === selectedOrder.orderId}
                    onClick={() => handleMarkInTransit(selectedOrder.orderId)}
                    className="px-3 py-1 rounded-md bg-[#111111] hover:bg-black text-white text-[11px] font-semibold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Truck className="w-3.5 h-3.5" />
                    <span>Dispatch (In Transit)</span>
                  </button>
                )}
                {selectedOrder.fulfillmentStatus === 'in_transit' && (
                  <button
                    type="button"
                    disabled={actionLoading === selectedOrder.orderId}
                    onClick={() => handleMarkDelivered(selectedOrder.orderId)}
                    className="px-3 py-1 rounded-md bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-semibold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Mark Delivered</span>
                  </button>
                )}
              </div>
            </div>

            {/* Scrollable Body */}
            <div className="p-0 space-y-5 flex-1 overflow-y-auto bg-neutral-50/50">

              {/* 1. Customer Information Card */}
              <div className="p-4 bg-white space-y-4">
                <div className="flex items-center gap-2 pb-1 border-b border-neutral-100">
                  <User className="w-4 h-4 text-neutral-600" />
                  <span className="text-[11.5px] font-bold uppercase tracking-wider text-neutral-800">
                    Customer Information
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <FloatingInput
                    label="Customer Name"
                    value={editForm.customerName}
                    onChange={(e) => setEditForm({ ...editForm, customerName: e.target.value })}
                  />
                  <FloatingInput
                    label="Phone Number"
                    prefix="+91"
                    value={editForm.customerMobile}
                    onChange={(e) => setEditForm({ ...editForm, customerMobile: e.target.value })}
                  />
                </div>

                <FloatingInput
                  label="Email Address"
                  type="email"
                  value={editForm.customerEmail}
                  onChange={(e) => setEditForm({ ...editForm, customerEmail: e.target.value })}
                />
              </div>

              {/* 2. Shipping Address Card */}
              <div className="p-4 bg-white space-y-4">
                <div className="flex items-center gap-2 pb-1 border-b border-neutral-100">
                  <MapPin className="w-4 h-4 text-neutral-600" />
                  <span className="text-[11.5px] font-bold uppercase tracking-wider text-neutral-800">
                    Delivery Address
                  </span>
                </div>

                <div className="pt-1 space-y-3.5">
                  <FloatingInput
                    label="Flat / House No / Building"
                    value={editForm.houseNo}
                    onChange={(e) => setEditForm({ ...editForm, houseNo: e.target.value })}
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <FloatingInput
                      label="Street / Area / Colony"
                      value={editForm.street}
                      onChange={(e) => setEditForm({ ...editForm, street: e.target.value })}
                    />
                    <FloatingInput
                      label="Landmark"
                      value={editForm.landmark}
                      onChange={(e) => setEditForm({ ...editForm, landmark: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <FloatingInput
                      label="City"
                      value={editForm.city}
                      onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                    />
                    <FloatingInput
                      label="State"
                      value={editForm.state}
                      onChange={(e) => setEditForm({ ...editForm, state: e.target.value })}
                    />
                    <FloatingInput
                      label="PIN Code"
                      value={editForm.pincode}
                      onChange={(e) => setEditForm({ ...editForm, pincode: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* 3. Ordered Items Card */}
              <div className="p-4 bg-white space-y-3">
                <div className="flex items-center justify-between pb-1 border-b border-neutral-100">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-neutral-600" />
                    <span className="text-[11.5px] font-bold uppercase tracking-wider text-neutral-800">
                      Ordered Items ({editForm.items?.length || 0})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddProductModal((prev) => !prev);
                      if (!showAddProductModal && catalogProducts.length > 0 && !selectedCatalogProduct) {
                        setSelectedCatalogProduct(catalogProducts[0]);
                      }
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#111111] hover:bg-black text-white text-[11px] font-semibold transition-all cursor-pointer shadow-xs"
                  >
                    {showAddProductModal ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                    <span>{showAddProductModal ? 'Close' : 'Add Product'}</span>
                  </button>
                </div>

                {/* Animated Product Selector Sliding Container (Smooth Open & Close) */}
                <div
                  className={`grid-collapse transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                    showAddProductModal ? 'grid-collapse-open' : 'grid-collapse-closed'
                  }`}
                >
                  <div className="grid-collapse-inner">
                    <div
                      className={`pt-1 pb-2 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                        showAddProductModal ? 'translate-y-0 opacity-100' : '-translate-y-3 opacity-0'
                      }`}
                    >
                      <div className="p-3 bg-white border border-[#e5e5e5] rounded-[12px] shadow-sm space-y-3">
                        {/* Search Bar */}
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        value={productPickerSearch}
                        onChange={(e) => setProductPickerSearch(e.target.value)}
                        placeholder="Search by name, SKU, price, category..."
                        className="w-full h-8.5 pl-8.5 pr-8 rounded-[8px] border border-[#e5e5e5] bg-white text-[12px] text-[#111111] placeholder:text-[#8d8d8d] outline-none focus:border-[#111111] transition-colors"
                      />
                      {productPickerSearch && (
                        <button
                          type="button"
                          onClick={() => setProductPickerSearch('')}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 text-[14px] leading-none cursor-pointer"
                        >
                          ×
                        </button>
                      )}
                    </div>

                    {/* Products Grid (Matching media_1793165801671_7f054558) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[290px] overflow-y-auto pr-0.5">
                      {(() => {
                        const q = productPickerSearch.trim().toLowerCase();
                        const filtered = catalogProducts.filter((p) => {
                          if (!q) return true;
                          return (
                            (p.name || p.title || '').toLowerCase().includes(q) ||
                            (p.sku || '').toLowerCase().includes(q) ||
                            (p.category || '').toLowerCase().includes(q) ||
                            (p.color || '').toLowerCase().includes(q) ||
                            String(p.priceNumber || '').includes(q)
                          );
                        });

                        if (filtered.length === 0) {
                          return (
                            <div className="col-span-full py-6 text-center text-[12px] text-neutral-400">
                              No products match &quot;{productPickerSearch}&quot;
                            </div>
                          );
                        }

                        return filtered.map((p) => {
                          const pId = p.id || p._id || p.slug;
                          const isSelected =
                            selectedCatalogProduct &&
                            (selectedCatalogProduct.id === pId ||
                              selectedCatalogProduct._id === pId ||
                              selectedCatalogProduct.slug === pId);

                          const imgSrc = p.image || (p.gallery && p.gallery[0]);

                          return (
                            <button
                              key={pId}
                              type="button"
                              onClick={() => setSelectedCatalogProduct(p)}
                              className={`flex items-stretch rounded-[10px] text-left cursor-pointer transition-colors overflow-hidden ${
                                isSelected
                                  ? 'bg-[#ebebeb] text-white border-[#111111]'
                                  : 'bg-white text-[#111111] border-[#e5e5e5] hover:border-[#111111]'
                              }`}
                            >
                              <div className="w-16 self-stretch shrink-0  flex items-center justify-center overflow-hidden">
                                {imgSrc ? (
                                  <img
                                    src={imgSrc}
                                    alt={p.name || p.title}
                                    className="w-full h-full object-cover block"
                                  />
                                ) : (
                                  <Package className="w-4 h-4 text-neutral-400" />
                                )}
                              </div>
                              <div className="min-w-0 flex-1 px-2  flex items-center justify-between gap-">
                                <div className="min-w-0 flex-1">
                                  <span
                                    className={`text-[12.5px] font-medium truncate block ${
                                      isSelected ? 'text-black' : 'text-[#000000]'
                                    }`}
                                  >
                                    {p.name || p.title}
                                  </span>
                                  <div
                                    className={`flex items-center gap-1.5 text-[11px] mt-0.5 flex-wrap ${
                                      isSelected ? 'text-[#707072]' : 'text-[#707072]'
                                    }`}
                                  >
                                    <span>₹{(p.priceNumber || 13995).toLocaleString('en-IN')}</span>
                                    {(p.sku || p.id) && (
                                      <>
                                        <span>•</span>
                                        <span className={isSelected ? 'text-black font-medium' : 'text-neutral-700 font-medium'}>
                                          {p.sku || p.id}
                                        </span>
                                      </>
                                    )}
                                    {p.category && (
                                      <>
                                        <span>•</span>
                                        <span className={`capitalize ${isSelected ? 'text-neutral-700' : 'text-neutral-500'}`}>
                                          {p.category}
                                        </span>
                                      </>
                                    )}
                                  </div>
                                </div>
                                {isSelected ? (
                                  <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center shrink-0">
                                    <Check className="w-3 h-3 text-black stroke-[3.5]" />
                                  </div>
                                ) : (
                                  <span className="text-[11px] font-medium text-[#707072] shrink-0">
                                    Select
                                  </span>
                                )}
                              </div>
                            </button>
                          );
                        });
                      })()}
                    </div>

                    {/* Bottom Action Bar: Shoe Size, Quantity & Add to Order */}
                    <div className="pt-2.5 border-t border-[#e5e5e5] flex flex-wrap items-center justify-between gap-2.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-[11px] text-[#707072] shrink-0 font-medium">Selected:</span>
                        <span className="text-[12px] font-bold text-[#111111] truncate max-w-[140px] sm:max-w-[200px]">
                          {selectedCatalogProduct ? (selectedCatalogProduct.name || selectedCatalogProduct.title) : 'Click product to select'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <div className="flex items-center gap-1">
                          <span className="text-[11px] font-medium text-[#707072]">Size:</span>
                          <select
                            value={newProductSize}
                            onChange={(e) => setNewProductSize(e.target.value)}
                            className="h-7 px-1.5 rounded-md border border-[#e5e5e5] bg-white text-[11.5px] font-semibold text-[#111111] focus:border-[#111111] outline-none cursor-pointer"
                          >
                            {['UK 3', 'UK 4', 'UK 4.5', 'UK 5', 'UK 5.5', 'UK 6', 'UK 6.5', 'UK 7', 'UK 7.5', 'UK 8', 'UK 8.5', 'UK 9', 'UK 9.5', 'UK 10', 'UK 10.5', 'UK 11', 'UK 12'].map((sz) => (
                              <option key={sz} value={sz}>{sz}</option>
                            ))}
                          </select>
                        </div>

                        <div className="flex items-center gap-1">
                          <span className="text-[11px] font-medium text-[#707072]">Qty:</span>
                          <input
                            type="number"
                            min="1"
                            max="10"
                            value={newProductQty}
                            onChange={(e) => setNewProductQty(Math.max(1, parseInt(e.target.value, 10) || 1))}
                            className="w-10 h-7 text-center rounded-md border border-[#e5e5e5] bg-white text-[11.5px] font-semibold text-[#111111] focus:border-[#111111] outline-none"
                          />
                        </div>

                        <button
                          type="button"
                          disabled={!selectedCatalogProduct}
                          onClick={handleAddProductToOrder}
                          className={`h-7 px-3 rounded-md text-[11.5px] font-bold cursor-pointer transition-all inline-flex items-center gap-1 ${
                            selectedCatalogProduct
                              ? 'bg-[#111111] hover:bg-black text-white shadow-xs'
                              : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                          }`}
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add to Order</span>
                        </button>
                      </div>
                    </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {editForm.items?.map((item, idx) => (
                    <div key={idx} className=" flex items-start gap-3">
                      <div className="w-14 h-14 rounded-md  shrink-0 overflow-hidden flex items-center justify-center ">
                        <img
                          src={item.image || '/images/test/1e462d9Nike-IV2476-200_1.avif'}
                          alt={item.name}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="flex-1 min-w-0 ">
                        <p className="font-bold text-[13px] text-[#111111] leading-snug">
                          {item.name || 'SONU Hybrid RN'}
                        </p>
                        <p className="text-[11px] text-neutral-500 font-mono">
                          SKU: {item.sku || item.id || 'drop-hybrid-women-UK-4'}
                        </p>
                        <div className="flex items-center gap-3 pt-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] font-semibold text-neutral-500">Size:</span>
                            <select
                              value={item.size || 'UK 8'}
                              onChange={(e) => {
                                const newItems = [...editForm.items];
                                newItems[idx] = { ...newItems[idx], size: e.target.value };
                                setEditForm({ ...editForm, items: newItems });
                              }}
                              className="text-[11.5px] font-bold bg-white border border-neutral-300 rounded px-2 py-0.5 focus:border-[#111111] focus:outline-none"
                            >
                              {['UK 3', 'UK 4', 'UK 4.5', 'UK 5', 'UK 5.5', 'UK 6', 'UK 6.5', 'UK 7', 'UK 7.5', 'UK 8', 'UK 8.5', 'UK 9', 'UK 9.5', 'UK 10', 'UK 10.5', 'UK 11', 'UK 12'].map((sz) => (
                                <option key={sz} value={sz}>{sz}</option>
                              ))}
                            </select>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] font-semibold text-neutral-500">Qty:</span>
                            <input
                              type="number"
                              min="1"
                              max="10"
                              value={item.quantity || 1}
                              onChange={(e) => {
                                const newItems = [...editForm.items];
                                const q = Math.max(1, parseInt(e.target.value, 10) || 1);
                                newItems[idx] = { ...newItems[idx], quantity: q };
                                const newTotal = newItems.reduce(
                                  (acc, it) => acc + (Number(it.priceNumber) || 0) * (Number(it.quantity) || 1),
                                  0
                                );
                                setEditForm({
                                  ...editForm,
                                  items: newItems,
                                  totalAmount: newTotal,
                                  advancePaid: editForm.paymentMethod === 'prepaid' ? newTotal : editForm.advancePaid,
                                });
                              }}
                              className="w-12 text-[11.5px] font-bold text-center bg-white border border-neutral-300 rounded px-1 py-0.5 focus:border-[#111111] focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="text-right flex flex-col items-end justify-between self-stretch">
                        <div>
                          <span className="font-bold text-[13.5px] text-[#111111] block">
                            ₹ {((item.priceNumber || 13995) * (item.quantity || 1)).toLocaleString('en-IN')}
                          </span>
                          <span className="text-[10.5px] text-neutral-400 block">
                            ₹ {(item.priceNumber || 13995).toLocaleString('en-IN')} each
                          </span>
                        </div>
                        {editForm.items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveProductFromOrder(idx)}
                            className="p-1 text-neutral-400 hover:text-rose-600 transition-colors cursor-pointer"
                            title="Remove item from order"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 4. Payment & Billing Card */}
              <div className="p-4 bg-white space-y-4">
                <div className="flex items-center gap-2 pb-1 border-b border-neutral-100">
                  <CreditCard className="w-4 h-4 text-neutral-600" />
                  <span className="text-[11.5px] font-bold uppercase tracking-wider text-neutral-800">
                    Payment & Bill Summary
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <FloatingSelect
                    label="Payment Method"
                    value={editForm.paymentMethod}
                    options={[
                      { value: 'partial_cod', label: 'Partial COD' },
                      { value: 'cod', label: 'COD (Full Cash on Delivery)' },
                      { value: 'prepaid', label: 'Prepaid (Razorpay / Online)' },
                    ]}
                    onSelect={(val) => handlePaymentMethodChange(val)}
                  />

                  <FloatingSelect
                    label="Payment Status"
                    value={editForm.paymentStatus}
                    options={[
                      { value: 'PARTIALLY_PAID', label: 'PARTIALLY PAID (Advance Received)' },
                      { value: 'PAID', label: 'PAID (Full Amount)' },
                      { value: 'PENDING', label: 'PENDING (Payment Due)' },
                      { value: 'FAILED', label: 'FAILED' },
                    ]}
                    onSelect={(val) => setEditForm({ ...editForm, paymentStatus: val })}
                  />
                </div>

                <div className="pt-2 border-t border-neutral-100 space-y-3 text-[12.5px]">
                  <div className="flex items-center justify-between text-neutral-600">
                    <span>Order Total</span>
                    <span className="font-semibold text-[#111111]">
                      ₹ {editForm.totalAmount.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-neutral-600">
                    <span>Advance Paid (Cut off)</span>
                    <div className="w-36">
                      <FloatingInput
                        label="Advance Paid"
                        prefix="₹"
                        type="number"
                        min="0"
                        value={editForm.advancePaid}
                        onChange={(e) => setEditForm({ ...editForm, advancePaid: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-neutral-200 text-[#111111] font-bold text-[13.5px]">
                    <span>Balance Due on Delivery (COD)</span>
                    <span>
                      ₹ {Math.max(0, editForm.totalAmount - (Number(editForm.advancePaid) || 0)).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>

              {/* 5. Courier & Shiprocket Card */}
              <div className="p-4 bg-white space-y-3">
                <div className="flex items-center justify-between pb-1 border-b border-neutral-100">
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-neutral-600" />
                    <span className="text-[11.5px] font-bold uppercase tracking-wider text-neutral-800">
                      Logistics & Shipment
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded">
                    Patna Hub
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-[12.5px]">
                  <div className="p-2.5 rounded-lg bg-neutral-50 border border-neutral-100 space-y-0.5">
                    <span className="text-[10.5px] uppercase font-bold text-neutral-400 block">Courier</span>
                    <p className={`font-semibold ${selectedOrder.shiprocket?.courierName ? 'text-[#111111]' : 'text-neutral-400 font-normal'}`}>
                      {selectedOrder.shiprocket?.courierName || 'Pending Assignment'}
                    </p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-neutral-50 border border-neutral-100 space-y-0.5">
                    <span className="text-[10.5px] uppercase font-bold text-neutral-400 block">AWB Code</span>
                    <p className={`font-mono ${selectedOrder.shiprocket?.awbCode ? 'font-bold text-[#111111]' : 'text-neutral-400 font-normal'}`}>
                      {selectedOrder.shiprocket?.awbCode || 'Pending Dispatch'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <a
                    href={selectedOrder.shiprocket?.labelUrl || `https://apiv2.shiprocket.in/generate/label/sample_${selectedOrder.shiprocket?.shipmentId}.pdf`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2 px-3 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-100 text-[#111111] text-[12px] font-semibold transition-all flex items-center justify-center gap-1.5 shadow-2xs"
                  >
                    <Printer className="w-3.5 h-3.5 text-neutral-600" />
                    <span>Print Label PDF</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => handleDownloadInvoice(selectedOrder)}
                    className="flex-1 py-2 px-3 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-100 text-[#111111] text-[12px] font-semibold transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-neutral-600" />
                    <span>Tax Invoice PDF</span>
                  </button>
                </div>
              </div>

              {/* 6. Internal Notes Card */}
              <div className="p-4 bg-white space-y-3">
                <div className="flex items-center gap-2 pb-1 border-b border-neutral-100">
                  <FileText className="w-4 h-4 text-neutral-600" />
                  <span className="text-[11.5px] font-bold uppercase tracking-wider text-neutral-800">
                    Internal Notes & Remarks
                  </span>
                </div>
                <div className="pt-1">
                  <FloatingTextarea
                    label="Internal remarks (e.g. Call customer before dispatch, verified address)..."
                    rows={2}
                    value={editForm.internalNote}
                    onChange={(e) => setEditForm({ ...editForm, internalNote: e.target.value })}
                  />
                </div>
              </div>

              {/* 7. Customer Notifications (Email via Hostinger SMTP & WhatsApp) */}
              <div className="p-4 bg-white space-y-3">
                <div className="flex items-center justify-between pb-1 border-b border-neutral-100">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-neutral-600" />
                    <span className="text-[11.5px] font-bold uppercase tracking-wider text-neutral-800">
                      Customer Notifications
                    </span>
                  </div>
                  <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                    Email Active
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={!!actionLoading}
                    onClick={() => handleSendMockWhatsApp(selectedOrder.orderId, 'ORDER_CONFIRMED')}
                    className="px-2.5 py-1.5 rounded-lg border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-[11px] font-medium text-neutral-800 transition-colors text-left cursor-pointer"
                  >
                    ✉️ Order Confirmed
                  </button>
                  <button
                    type="button"
                    disabled={!!actionLoading}
                    onClick={() => handleSendMockWhatsApp(selectedOrder.orderId, 'READY_TO_SHIP')}
                    className="px-2.5 py-1.5 rounded-lg border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-[11px] font-medium text-neutral-800 transition-colors text-left cursor-pointer"
                  >
                    📦 Ready to Ship
                  </button>
                  <button
                    type="button"
                    disabled={!!actionLoading}
                    onClick={() => handleSendMockWhatsApp(selectedOrder.orderId, 'PICKUP_SCHEDULED')}
                    className="px-2.5 py-1.5 rounded-lg border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-[11px] font-medium text-neutral-800 transition-colors text-left cursor-pointer"
                  >
                    🚚 Pickup Scheduled
                  </button>
                  <button
                    type="button"
                    disabled={!!actionLoading}
                    onClick={() => handleSendMockWhatsApp(selectedOrder.orderId, 'DELIVERED')}
                    className="px-2.5 py-1.5 rounded-lg border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-[11px] font-medium text-neutral-800 transition-colors text-left cursor-pointer"
                  >
                    🎉 Delivered
                  </button>
                </div>
              </div>

            </div>

            {/* Sticky Bottom Save / Discard Bar */}
            <div className="px-6 py-4 border-t border-neutral-200 bg-white sticky bottom-0 z-30 flex items-center justify-between gap-3 shadow-lg">
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2.5 rounded-lg border border-neutral-300 hover:bg-neutral-100 text-[#111111] font-semibold text-[13px] transition-colors cursor-pointer"
              >
                Close
              </button>

              <button
                type="button"
                disabled={isSaving}
                onClick={handleSaveOrder}
                className="px-6 py-2.5 rounded-lg bg-[#111111] hover:bg-black active:scale-[0.98] text-white font-bold text-[13px] transition-all shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span>Saving Changes...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 text-white" />
                    <span>Save Changes</span>
                  </>
                )}
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
