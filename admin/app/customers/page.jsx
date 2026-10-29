'use client';

import React, { useState, useEffect, useMemo, useRef, Suspense } from 'react';
import AdminShell from '@/components/AdminShell';
import {
  Users,
  User,
  Plus,
  Search,
  Mail,
  Phone,
  MapPin,
  ShoppingBag,
  ArrowUpDown,
  ChevronDown,
  X,
  Check,
  Copy,
  ExternalLink,
  Edit2,
  Trash2,
  Download,
  RefreshCw,
  Sliders,
  DollarSign,
  Calendar,
  Eye,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
} from 'lucide-react';

const CUSTOMER_TABS = [
  { id: 'overview', label: 'Overview & Metrics', number: '01' },
  { id: 'orders', label: 'Order History', number: '02' },
  { id: 'address', label: 'Shipping Address', number: '03' },
  { id: 'edit', label: 'Edit Customer', number: '04' },
];

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [segmentFilter, setSegmentFilter] = useState('all');
  const [cityFilter, setCityFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  // Row Selection State
  const [selectedIds, setSelectedIds] = useState([]);

  // Drawer / Modal State
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeDrawerTab, setActiveDrawerTab] = useState('overview');

  // Add Customer Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newCustomerForm, setNewCustomerForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    mobile: '',
    houseNo: '',
    street: '',
    landmark: '',
    city: '',
    state: '',
    pincode: '',
    notes: '',
  });

  // Edit Customer Form State inside drawer
  const [editForm, setEditForm] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);

  // Show Toast Helper
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // Fetch Customers from API
  const fetchCustomers = async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      else setLoading(true);

      const res = await fetch('/api/customers');
      if (res.ok) {
        const data = await res.json();
        setCustomers(data.customers || []);
        if (isManual) showToast('✓ Customer list refreshed');
      } else {
        showToast('Failed to load customers');
      }
    } catch (err) {
      console.error('Fetch customers error:', err);
      showToast('Error loading customer directory');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // Sync edit form when a customer is selected
  useEffect(() => {
    if (selectedCustomer) {
      setEditForm({
        name: selectedCustomer.name || '',
        firstName: selectedCustomer.firstName || '',
        lastName: selectedCustomer.lastName || '',
        email: selectedCustomer.email || '',
        mobile: selectedCustomer.mobile || '',
        houseNo: selectedCustomer.primaryAddress?.houseNo || '',
        street: selectedCustomer.primaryAddress?.street || '',
        landmark: selectedCustomer.primaryAddress?.landmark || '',
        city: selectedCustomer.primaryAddress?.city || '',
        state: selectedCustomer.primaryAddress?.state || '',
        pincode: selectedCustomer.primaryAddress?.pincode || '',
        notes: selectedCustomer.notes || '',
      });
    }
  }, [selectedCustomer]);

  // Unique list of cities for filter dropdown
  const uniqueCities = useMemo(() => {
    const set = new Set();
    customers.forEach((c) => {
      const city = c.primaryAddress?.city;
      if (city && city.trim()) set.add(city.trim());
    });
    return Array.from(set).sort();
  }, [customers]);

  // Filtered & Sorted Customers
  const filteredCustomers = useMemo(() => {
    return customers
      .filter((c) => {
        // 1. Search Query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const name = (c.name || '').toLowerCase();
          const email = (c.email || '').toLowerCase();
          const mobile = (c.mobile || '').toLowerCase();
          const city = (c.primaryAddress?.city || '').toLowerCase();
          const state = (c.primaryAddress?.state || '').toLowerCase();
          const pin = (c.primaryAddress?.pincode || '').toLowerCase();
          const match =
            name.includes(q) ||
            email.includes(q) ||
            mobile.includes(q) ||
            city.includes(q) ||
            state.includes(q) ||
            pin.includes(q);
          if (!match) return false;
        }

        // 2. Segment / Status Filter
        if (segmentFilter !== 'all') {
          if (segmentFilter === 'vip' && c.status !== 'VIP') return false;
          if (segmentFilter === 'repeat' && c.status !== 'Repeat') return false;
          if (segmentFilter === 'active' && c.status !== 'Active') return false;
          if (segmentFilter === 'prospect' && c.status !== 'Prospect') return false;
        }

        // 3. City Filter
        if (cityFilter !== 'all') {
          const cCity = (c.primaryAddress?.city || '').toLowerCase().trim();
          if (cCity !== cityFilter.toLowerCase().trim()) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') {
          return new Date(b.createdAt || b.lastOrderDate || 0) - new Date(a.createdAt || a.lastOrderDate || 0);
        }
        if (sortBy === 'spent_desc') {
          return (b.totalSpent || 0) - (a.totalSpent || 0);
        }
        if (sortBy === 'spent_asc') {
          return (a.totalSpent || 0) - (b.totalSpent || 0);
        }
        if (sortBy === 'orders_desc') {
          return (b.orderCount || 0) - (a.orderCount || 0);
        }
        if (sortBy === 'name_asc') {
          return (a.name || '').localeCompare(b.name || '');
        }
        return 0;
      });
  }, [customers, searchQuery, segmentFilter, cityFilter, sortBy]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    const totalCount = customers.length;
    const totalRevenue = customers.reduce((sum, c) => sum + (c.totalSpent || 0), 0);
    const repeatBuyers = customers.filter((c) => (c.orderCount || 0) >= 2).length;
    const vipCount = customers.filter((c) => c.status === 'VIP').length;
    return { totalCount, totalRevenue, repeatBuyers, vipCount };
  }, [customers]);

  // Selection Handlers
  const toggleSelectAll = () => {
    if (selectedIds.length === filteredCustomers.length && filteredCustomers.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredCustomers.map((c) => c._id));
    }
  };

  const toggleSelectRow = (id, e) => {
    e.stopPropagation();
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Copy helper
  const copyToClipboard = (text, label) => {
    if (!text) return;
    navigator.clipboard?.writeText(text);
    showToast(`✓ Copied ${label}`);
  };

  // Bulk Copy Emails
  const handleBulkCopyEmails = () => {
    const selectedCustomers = customers.filter((c) => selectedIds.includes(c._id));
    const emails = selectedCustomers.map((c) => c.email).filter(Boolean).join(', ');
    if (!emails) {
      showToast('No email addresses found for selected rows');
      return;
    }
    navigator.clipboard?.writeText(emails);
    showToast(`✓ Copied ${selectedCustomers.length} email(s)`);
  };

  // Export CSV Helper
  const handleExportCSV = (customersToExport = filteredCustomers) => {
    if (!customersToExport || customersToExport.length === 0) {
      showToast('No customer data to export');
      return;
    }

    const headers = [
      'Customer ID',
      'Name',
      'Email',
      'Mobile',
      'City',
      'State',
      'Pincode',
      'Total Orders',
      'Total Spent (INR)',
      'Status',
      'Joined / Last Active',
    ];

    const rows = customersToExport.map((c) => [
      `"${c._id || ''}"`,
      `"${(c.name || '').replace(/"/g, '""')}"`,
      `"${c.email || ''}"`,
      `"${c.mobile || ''}"`,
      `"${c.primaryAddress?.city || ''}"`,
      `"${c.primaryAddress?.state || ''}"`,
      `"${c.primaryAddress?.pincode || ''}"`,
      c.orderCount || 0,
      c.totalSpent || 0,
      `"${c.status || 'Active'}"`,
      `"${c.lastOrderDate ? new Date(c.lastOrderDate).toLocaleDateString('en-IN') : ''}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `sonu_customers_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`✓ Exported ${customersToExport.length} customer(s) to CSV`);
  };

  // Delete Customer
  const handleDeleteCustomer = async (id, e) => {
    if (e) e.stopPropagation();
    if (!confirm('Are you sure you want to delete this customer record?')) return;

    try {
      const res = await fetch(`/api/customers?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        showToast('✓ Customer deleted');
        setCustomers((prev) => prev.filter((c) => c._id !== id));
        if (selectedCustomer?._id === id) {
          setIsDrawerOpen(false);
          setSelectedCustomer(null);
        }
      } else {
        showToast('Failed to delete customer');
      }
    } catch (err) {
      console.error(err);
      showToast('Error deleting customer');
    }
  };

  // Bulk Delete
  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} customer records?`)) return;

    for (const id of selectedIds) {
      await fetch(`/api/customers?id=${encodeURIComponent(id)}`, { method: 'DELETE' }).catch(() => {});
    }
    setCustomers((prev) => prev.filter((c) => !selectedIds.includes(c._id)));
    setSelectedIds([]);
    showToast(`✓ Deleted selected customer records`);
  };

  // Add Customer Submit
  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    if (!newCustomerForm.firstName && !newCustomerForm.email && !newCustomerForm.mobile) {
      showToast('Please enter customer name, email, or mobile');
      return;
    }

    try {
      setCreating(true);
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: newCustomerForm.firstName,
          lastName: newCustomerForm.lastName,
          name: `${newCustomerForm.firstName} ${newCustomerForm.lastName}`.trim(),
          email: newCustomerForm.email,
          mobile: newCustomerForm.mobile,
          primaryAddress: {
            houseNo: newCustomerForm.houseNo,
            street: newCustomerForm.street,
            landmark: newCustomerForm.landmark,
            city: newCustomerForm.city,
            state: newCustomerForm.state,
            pincode: newCustomerForm.pincode,
          },
          notes: newCustomerForm.notes,
        }),
      });

      if (res.ok) {
        showToast('✓ Customer created successfully');
        setIsAddModalOpen(false);
        setNewCustomerForm({
          firstName: '',
          lastName: '',
          email: '',
          mobile: '',
          houseNo: '',
          street: '',
          landmark: '',
          city: '',
          state: '',
          pincode: '',
          notes: '',
        });
        fetchCustomers();
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to create customer');
      }
    } catch (err) {
      console.error(err);
      showToast('Error creating customer');
    } finally {
      setCreating(false);
    }
  };

  // Edit Customer Submit (from inside Drawer)
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!selectedCustomer?._id) return;

    try {
      setSavingEdit(true);
      const res = await fetch('/api/customers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedCustomer._id,
          name: `${editForm.firstName || ''} ${editForm.lastName || ''}`.trim() || editForm.name,
          firstName: editForm.firstName,
          lastName: editForm.lastName,
          email: editForm.email,
          mobile: editForm.mobile,
          primaryAddress: {
            houseNo: editForm.houseNo,
            street: editForm.street,
            landmark: editForm.landmark,
            city: editForm.city,
            state: editForm.state,
            pincode: editForm.pincode,
          },
          notes: editForm.notes,
        }),
      });

      if (res.ok) {
        showToast('✓ Customer details updated');
        // Update local state
        setCustomers((prev) =>
          prev.map((c) =>
            c._id === selectedCustomer._id
              ? {
                  ...c,
                  name: `${editForm.firstName || ''} ${editForm.lastName || ''}`.trim() || editForm.name,
                  firstName: editForm.firstName,
                  lastName: editForm.lastName,
                  email: editForm.email,
                  mobile: editForm.mobile,
                  notes: editForm.notes,
                  primaryAddress: {
                    houseNo: editForm.houseNo,
                    street: editForm.street,
                    landmark: editForm.landmark,
                    city: editForm.city,
                    state: editForm.state,
                    pincode: editForm.pincode,
                  },
                }
              : c
          )
        );
        setSelectedCustomer((prev) => ({
          ...prev,
          name: `${editForm.firstName || ''} ${editForm.lastName || ''}`.trim() || editForm.name,
          firstName: editForm.firstName,
          lastName: editForm.lastName,
          email: editForm.email,
          mobile: editForm.mobile,
          notes: editForm.notes,
          primaryAddress: {
            houseNo: editForm.houseNo,
            street: editForm.street,
            landmark: editForm.landmark,
            city: editForm.city,
            state: editForm.state,
            pincode: editForm.pincode,
          },
        }));
        setActiveDrawerTab('overview');
      } else {
        showToast('Failed to update customer');
      }
    } catch (err) {
      console.error(err);
      showToast('Error saving updates');
    } finally {
      setSavingEdit(false);
    }
  };

  // Helper for customer initials
  const getInitials = (name) => {
    if (!name) return 'CU';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  };

  // Open Drawer helper
  const openCustomerDrawer = (customer, tab = 'overview') => {
    setSelectedCustomer(customer);
    setActiveDrawerTab(tab);
    setIsDrawerOpen(true);
  };

  return (
    <AdminShell>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-[#111111] text-white text-[13px] px-4 py-2 rounded-full border border-neutral-700 flex items-center gap-2 animate-toast pointer-events-none">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div>
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center pb-5 px-2 pt-10 justify-between gap-4">
          <div className="flex items-center gap-3">
            <h2 className="text-[22px] font-bold tracking-tight text-[#111111]">
              Customers
            </h2>
            <span className="text-[12px] font-medium px-2.5 py-0.5 rounded-full bg-neutral-100 text-neutral-600 border border-neutral-200/80 transition-colors">
              {filteredCustomers.length}
            </span>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={() => fetchCustomers(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 text-[13px] font-medium transition-all active:scale-95 cursor-pointer disabled:opacity-50"
              title="Refresh customer directory"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
              type="button"
              onClick={() => handleExportCSV()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-800 text-[13px] font-medium transition-all active:scale-95 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>

            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#111111] hover:bg-black text-white text-[13px] font-medium border border-neutral-900 transition-all duration-150 ease-out active:scale-95 cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add Customer</span>
            </button>
          </div>
        </div>

        {/* Quick KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pb-3 px-0">
          <div className="p-3 bg-white border border-neutral-200 rounded-lg">
            <span className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider block">Total Directory</span>
            <p className="text-[18px] font-bold text-[#111111] mt-0.5">{metrics.totalCount}</p>
          </div>
          <div className="p-3 bg-white border border-neutral-200 rounded-lg">
            <span className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider block">Customer Revenue</span>
            <p className="text-[18px] font-bold text-[#111111] mt-0.5">₹{metrics.totalRevenue.toLocaleString('en-IN')}</p>
          </div>
          <div className="p-3 bg-white border border-neutral-200 rounded-lg">
            <span className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider block">Repeat Buyers</span>
            <p className="text-[18px] font-bold text-[#111111] mt-0.5">{metrics.repeatBuyers}</p>
          </div>
          <div className="p-3 bg-white border border-neutral-200 rounded-lg">
            <span className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider block">VIP Accounts</span>
            <p className="text-[18px] font-bold text-[#111111] mt-0.5">{metrics.vipCount}</p>
          </div>
        </div>

        {/* Search & Filter Bar (Matching Product Page Style) */}
        <div className="flex flex-col sm:flex-row items-stretch p-2 px-0 pt-2 sm:items-center gap-1">
          {/* 1. Search Query */}
          <div className="relative flex-1 min-w-[220px]">
            <input
              type="text"
              placeholder="Search customer name, email, phone, city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-11 pl-4 pr-10 border border-neutral-200 bg-white text-[13.5px] text-neutral-800 placeholder:text-neutral-400 outline-none focus:border-neutral-900 transition-colors"
            />
            <Search className="w-4 h-4 text-neutral-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none stroke-[1.75]" />
          </div>

          {/* 2. Customer Tier / Segment Filter */}
          <div className="relative min-w-[170px]">
            <select
              value={segmentFilter}
              onChange={(e) => setSegmentFilter(e.target.value)}
              className="w-full appearance-none h-11 pl-4 pr-9 border border-neutral-200 bg-white text-[13.5px] text-neutral-800 cursor-pointer outline-none focus:border-neutral-900 transition-colors"
            >
              <option value="all">All customer tiers</option>
              <option value="vip">VIP (₹25k+ / 3+ orders)</option>
              <option value="repeat">Repeat buyers (2+ orders)</option>
              <option value="active">Active (1 order)</option>
              <option value="prospect">Prospects (0 orders)</option>
            </select>
            <svg
              className="w-2.5 h-2.5 text-neutral-500 fill-current absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              viewBox="0 0 10 6"
            >
              <path d="M0 0h10L5 6z" />
            </svg>
          </div>

          {/* 3. Location / City Filter */}
          <div className="relative min-w-[155px]">
            <select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="w-full appearance-none h-11 pl-4 pr-9 border border-neutral-200 bg-white text-[13.5px] text-neutral-800 cursor-pointer outline-none focus:border-neutral-900 transition-colors"
            >
              <option value="all">All locations</option>
              {uniqueCities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
            <svg
              className="w-2.5 h-2.5 text-neutral-500 fill-current absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              viewBox="0 0 10 6"
            >
              <path d="M0 0h10L5 6z" />
            </svg>
          </div>

          {/* 4. Sort Dropdown */}
          <div className="relative sm:ml-auto min-w-[150px]">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full appearance-none h-11 pl-4 pr-8 border border-neutral-200 bg-white text-[13px] font-medium text-neutral-700 cursor-pointer outline-none focus:border-neutral-900 transition-colors"
            >
              <option value="newest">Sort: Newest</option>
              <option value="spent_desc">Sort: Spent (High-Low)</option>
              <option value="spent_asc">Sort: Spent (Low-High)</option>
              <option value="orders_desc">Sort: Most Orders</option>
              <option value="name_asc">Sort: Name (A-Z)</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-neutral-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Smooth Bulk Action Bar (Matching Product Page Flat Style) */}
        <div className={`grid-collapse ${selectedIds.length > 0 ? 'grid-collapse-open' : 'grid-collapse-closed'}`}>
          <div className="grid-collapse-inner">
            <div className="bg-white border border-neutral-300 text-neutral-900 px-4 py-2.5 flex items-center justify-between gap-3 mb-2 rounded-lg">
              <div className="flex items-center gap-2 text-[13px] font-medium">
                <span className="px-2 py-0.5 rounded-full bg-neutral-100 border border-neutral-200 text-neutral-700 text-[11px]">
                  {selectedIds.length}
                </span>
                <span>Selected</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleBulkCopyEmails}
                  className="px-3 py-1 rounded-full border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-[12px] font-medium text-neutral-800 cursor-pointer transition-all duration-150 ease-out active:scale-95"
                >
                  Copy Emails
                </button>
                <button
                  type="button"
                  onClick={() => handleExportCSV(customers.filter((c) => selectedIds.includes(c._id)))}
                  className="px-3 py-1 rounded-full border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-[12px] font-medium text-neutral-800 cursor-pointer transition-all duration-150 ease-out active:scale-95"
                >
                  Export CSV
                </button>
                <button
                  type="button"
                  onClick={handleBulkDelete}
                  className="px-3 py-1 rounded-full border border-rose-200 bg-rose-50 hover:bg-rose-100 text-[12px] font-medium text-rose-700 cursor-pointer transition-all duration-150 ease-out active:scale-95"
                >
                  Delete
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedIds([])}
                  className="p-1 rounded-full hover:bg-neutral-100 text-neutral-400 hover:text-black cursor-pointer ml-1 transition-colors duration-150"
                  title="Clear selection"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Customer Table (Clean Border-Driven Grid Matching Product Page) */}
        {loading ? (
          <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden shadow-none">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-neutral-200 bg-white text-[13px] font-semibold text-neutral-800">
                    <th className="py-3 px-4 border-r border-neutral-200 w-[140px]"><span className="w-16 h-3 rounded skeleton-shimmer block" /></th>
                    <th className="py-3 px-4 border-r border-neutral-200 min-w-[220px]"><span className="w-28 h-3 rounded skeleton-shimmer block" /></th>
                    <th className="py-3 px-4 border-r border-neutral-200 min-w-[200px]"><span className="w-24 h-3 rounded skeleton-shimmer block" /></th>
                    <th className="py-3 px-4 border-r border-neutral-200 min-w-[160px]"><span className="w-20 h-3 rounded skeleton-shimmer block" /></th>
                    <th className="py-3 px-4 border-r border-neutral-200 w-[110px] text-center"><span className="w-12 h-3 rounded skeleton-shimmer block mx-auto" /></th>
                    <th className="py-3 px-4 border-r border-neutral-200 w-[150px] text-right"><span className="w-20 h-3 rounded skeleton-shimmer block ml-auto" /></th>
                    <th className="py-3 px-4 border-r border-neutral-200 w-[110px]"><span className="w-14 h-5 rounded-full skeleton-shimmer block" /></th>
                    <th className="py-3 px-4 w-[130px] text-right"><span className="w-16 h-3 rounded skeleton-shimmer block ml-auto" /></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <tr key={i}>
                      <td className="py-3.5 px-4 border-r border-neutral-200"><div className="flex items-center gap-3"><div className="w-5 h-5 rounded skeleton-shimmer" /><div className="w-16 h-3 rounded skeleton-shimmer" /></div></td>
                      <td className="py-3.5 px-4 border-r border-neutral-200"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full skeleton-shimmer" /><div className="w-32 h-3 rounded skeleton-shimmer" /></div></td>
                      <td className="py-3.5 px-4 border-r border-neutral-200"><div className="w-28 h-3 rounded skeleton-shimmer" /></td>
                      <td className="py-3.5 px-4 border-r border-neutral-200"><div className="w-24 h-3 rounded skeleton-shimmer" /></td>
                      <td className="py-3.5 px-4 border-r border-neutral-200"><div className="w-12 h-5 rounded-full skeleton-shimmer mx-auto" /></td>
                      <td className="py-3.5 px-4 border-r border-neutral-200"><div className="w-20 h-3 rounded skeleton-shimmer ml-auto" /></td>
                      <td className="py-3.5 px-4 border-r border-neutral-200"><div className="w-14 h-5 rounded-full skeleton-shimmer" /></td>
                      <td className="py-3.5 px-4"><div className="w-16 h-5 rounded skeleton-shimmer ml-auto" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : filteredCustomers.length > 0 ? (
          <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden shadow-none transition-all duration-200">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-neutral-200 bg-white text-[13px] font-semibold text-neutral-800">
                    {/* Select All Checkbox + ID */}
                    <th className="py-3 px-4 border-r border-neutral-200 whitespace-nowrap w-[140px]">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={toggleSelectAll}
                          className={`w-5 h-5 rounded-[5px] flex items-center justify-center shrink-0 cursor-pointer transition-colors ${
                            selectedIds.length > 0
                              ? 'bg-[#111111] border border-[#111111] text-white'
                              : 'border border-neutral-300 bg-white hover:border-neutral-400'
                          }`}
                          title={selectedIds.length === filteredCustomers.length ? 'Deselect all' : 'Select all'}
                        >
                          {selectedIds.length === filteredCustomers.length && filteredCustomers.length > 0 ? (
                            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                          ) : selectedIds.length > 0 ? (
                            <span className="w-2.5 h-[2px] bg-white rounded-full" />
                          ) : null}
                        </button>
                        <span>ID</span>
                      </div>
                    </th>

                    {/* Customer Name */}
                    <th className="py-3 px-4 border-r border-neutral-200 whitespace-nowrap min-w-[220px]">
                      <div className="flex items-center justify-between">
                        <span>Customer</span>
                        <svg
                          className="w-3.5 h-3.5 text-neutral-400 shrink-0 inline-block ml-1"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M3 6h10M3 12h7M3 18h4M17 8l3 3m0 0l3-3m-3 3V3" />
                        </svg>
                      </div>
                    </th>

                    {/* Contact (Email & Mobile) */}
                    <th className="py-3 px-4 border-r border-neutral-200 whitespace-nowrap min-w-[210px]">
                      <span>Contact</span>
                    </th>

                    {/* Location */}
                    <th className="py-3 px-4 border-r border-neutral-200 whitespace-nowrap min-w-[160px]">
                      <span>Location</span>
                    </th>

                    {/* Orders Count */}
                    <th className="py-3 px-4 border-r border-neutral-200 whitespace-nowrap w-[110px] text-center">
                      <span>Orders</span>
                    </th>

                    {/* Total Spent */}
                    <th className="py-3 px-4 border-r border-neutral-200 whitespace-nowrap w-[150px] text-right">
                      <div className="flex items-center justify-end gap-1">
                        <span>Total Spent</span>
                        <svg
                          className="w-3.5 h-3.5 text-neutral-400 shrink-0 inline-block ml-1"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M3 6h10M3 12h7M3 18h4M17 8l3 3m0 0l3-3m-3 3V3" />
                        </svg>
                      </div>
                    </th>

                    {/* Status Badge */}
                    <th className="py-3 px-4 border-r border-neutral-200 whitespace-nowrap w-[110px]">
                      <span>Status</span>
                    </th>

                    {/* Row Actions */}
                    <th className="py-3 px-4 whitespace-nowrap w-[130px] text-right">
                      <span>Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 text-[13.5px] text-neutral-800">
                  {filteredCustomers.map((c) => {
                    const isSelected = selectedIds.includes(c._id);
                    const initials = getInitials(c.name);
                    const displayId = c._id.startsWith('guest_') ? 'GST-' + c._id.slice(6, 10).toUpperCase() : 'CST-' + c._id.slice(-4).toUpperCase();
                    const cityState = [c.primaryAddress?.city, c.primaryAddress?.state].filter(Boolean).join(', ') || 'India';
                    const pincode = c.primaryAddress?.pincode;

                    return (
                      <tr
                        key={c._id}
                        onClick={() => openCustomerDrawer(c)}
                        className={`hover:bg-neutral-50/70 transition-colors cursor-pointer ${
                          isSelected ? 'bg-neutral-50/90' : ''
                        }`}
                      >
                        {/* ID & Checkbox */}
                        <td className="py-3.5 px-4 border-r border-neutral-200 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={(e) => toggleSelectRow(c._id, e)}
                              className={`w-5 h-5 rounded-[5px] flex items-center justify-center shrink-0 cursor-pointer transition-colors ${
                                isSelected
                                  ? 'bg-[#111111] border border-[#111111] text-white'
                                  : 'border border-neutral-300 bg-white hover:border-neutral-400'
                              }`}
                            >
                              {isSelected && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                            </button>
                            <span className="text-[12.5px] font-mono text-neutral-500 font-medium">
                              {displayId}
                            </span>
                          </div>
                        </td>

                        {/* Customer Avatar & Name */}
                        <td className="py-3.5 px-4 border-r border-neutral-200">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-full bg-[#111111] text-white flex items-center justify-center text-[11.5px] font-bold shrink-0 tracking-tight">
                              {initials}
                            </div>
                            <div className="min-w-0 flex-1">
                              <span className="font-semibold text-[13.5px] text-neutral-900 block truncate hover:underline">
                                {c.name || 'Anonymous Customer'}
                              </span>
                              <span className="text-[11.5px] text-neutral-400 block truncate">
                                Joined {c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : 'Recently'}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Contact */}
                        <td className="py-3.5 px-4 border-r border-neutral-200">
                          <div className="space-y-0.5">
                            {c.email ? (
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className="text-[13px] text-neutral-800 truncate select-all">{c.email}</span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    copyToClipboard(c.email, 'Email');
                                  }}
                                  className="text-neutral-400 hover:text-black shrink-0 p-0.5 cursor-pointer"
                                  title="Copy email"
                                >
                                  <Copy className="w-3 h-3" />
                                </button>
                              </div>
                            ) : (
                              <span className="text-[12.5px] text-neutral-400 italic">No email</span>
                            )}
                            {c.mobile && (
                              <div className="flex items-center gap-1 text-[12px] text-neutral-500">
                                <span>+91 {c.mobile}</span>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Location */}
                        <td className="py-3.5 px-4 border-r border-neutral-200">
                          <div className="min-w-0">
                            <p className="text-[13px] text-neutral-800 font-medium truncate capitalize">
                              {cityState}
                            </p>
                            {pincode && (
                              <span className="text-[11.5px] text-neutral-400 font-mono">
                                PIN: {pincode}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Orders Count */}
                        <td className="py-3.5 px-4 border-r border-neutral-200 text-center whitespace-nowrap">
                          <span
                            className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-[12px] font-semibold ${
                              c.orderCount > 0
                                ? 'bg-neutral-100 text-neutral-900 border border-neutral-200'
                                : 'bg-neutral-50 text-neutral-400 border border-neutral-200/60'
                            }`}
                          >
                            {c.orderCount} {c.orderCount === 1 ? 'order' : 'orders'}
                          </span>
                        </td>

                        {/* Total Spent */}
                        <td className="py-3.5 px-4 border-r border-neutral-200 text-right whitespace-nowrap">
                          <div className="text-right">
                            <span className="font-bold text-[13.5px] text-[#111111] block">
                              ₹{(c.totalSpent || 0).toLocaleString('en-IN')}
                            </span>
                            {c.orderCount > 1 && (
                              <span className="text-[11px] text-neutral-400 block">
                                Avg: ₹{c.avgOrderValue.toLocaleString('en-IN')}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4 border-r border-neutral-200 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11.5px] font-semibold ${
                              c.status === 'VIP'
                                ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                : c.status === 'Repeat'
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : c.status === 'Active'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-neutral-100 text-neutral-600 border border-neutral-200'
                            }`}
                          >
                            {c.status}
                          </span>
                        </td>

                        {/* Row Actions */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => openCustomerDrawer(c, 'overview')}
                              className="p-1.5 rounded-md text-neutral-500 hover:text-black hover:bg-neutral-100 transition-colors cursor-pointer"
                              title="View Customer Profile"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => openCustomerDrawer(c, 'edit')}
                              className="p-1.5 rounded-md text-neutral-500 hover:text-black hover:bg-neutral-100 transition-colors cursor-pointer"
                              title="Edit Customer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handleDeleteCustomer(c._id, e)}
                              className="p-1.5 rounded-md text-neutral-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Delete Customer Record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : customers.length === 0 ? (
          <div className="py-20 text-center min-h-[50vh] bg-white border border-neutral-200 rounded-lg p-8">
            <Users className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
            <h3 className="text-[17px] font-bold text-[#111111]">No customers registered yet</h3>
            <p className="text-[13px] text-neutral-500 mt-1 max-w-sm mx-auto mb-5">
              Customer accounts will populate automatically whenever someone places an order or creates a profile.
            </p>
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#111111] hover:bg-black text-white text-[13px] font-medium border border-neutral-900 transition-all active:scale-95 cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add First Customer</span>
            </button>
          </div>
        ) : (
          <div className="py-20 text-center bg-white border border-neutral-200 rounded-lg">
            <Users className="w-9 h-9 text-neutral-300 mx-auto mb-2.5" />
            <h3 className="text-[15px] font-medium text-[#111111]">No matching customers found</h3>
            <p className="text-[13px] text-neutral-400 mt-0.5">
              Try adjusting your search query or reset the active filter options.
            </p>
          </div>
        )}
      </div>

      {/* Slide-Over Customer Detail & Edit Drawer (Matching Products 6-Tab Drawer) */}
      {isDrawerOpen && selectedCustomer && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 transition-opacity duration-300 backdrop-blur-[2px]"
            onClick={() => setIsDrawerOpen(false)}
          />

          {/* Drawer Panel */}
          <div className="relative w-full max-w-2xl lg:max-w-3xl bg-white h-full border-l border-[#e5e5e5] flex flex-col z-10 shadow-2xl animate-drawer-right">
            {/* Drawer Top Header */}
            <div className="px-5 py-4 border-b border-[#e5e5e5] bg-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-[#111111] text-white flex items-center justify-center font-bold text-[13px] shrink-0">
                  {getInitials(selectedCustomer.name)}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-[18px] font-bold text-[#111111] truncate tracking-tight font-medium">
                      {selectedCustomer.name}
                    </h3>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                        selectedCustomer.status === 'VIP'
                          ? 'bg-purple-50 text-purple-700 border border-purple-200'
                          : selectedCustomer.status === 'Repeat'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      {selectedCustomer.status}
                    </span>
                  </div>
                  <p className="text-[12.5px] text-neutral-400 truncate">
                    {selectedCustomer.email || 'No email attached'} • +91 {selectedCustomer.mobile || '—'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(false)}
                  className="w-8 h-8 rounded-full border border-neutral-200 bg-white hover:bg-neutral-100 flex items-center justify-center text-neutral-600 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Tab Navigation Pill Bar */}
            <div className="px-5 py-2.5 border-b border-[#f0f0f0] bg-[#fafafa] flex items-center gap-1.5 overflow-x-auto shrink-0">
              {CUSTOMER_TABS.map((tab) => {
                const isActive = activeDrawerTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveDrawerTab(tab.id)}
                    className={`px-3 py-1.5 rounded-full text-[12.5px] font-medium transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-[#111111] text-white shadow-xs'
                        : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-100'
                    }`}
                  >
                    <span className={`text-[10px] ${isActive ? 'text-neutral-400' : 'text-neutral-400'}`}>
                      {tab.number}
                    </span>
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Drawer Body Scroll Area */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
              {/* TAB 01: OVERVIEW */}
              {activeDrawerTab === 'overview' && (
                <div className="space-y-6">
                  {/* Metric Cards Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3.5 rounded-lg border border-neutral-200 bg-neutral-50/70">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 block">Total Spent</span>
                      <p className="text-[19px] font-bold text-[#111111] mt-0.5">₹{(selectedCustomer.totalSpent || 0).toLocaleString('en-IN')}</p>
                    </div>
                    <div className="p-3.5 rounded-lg border border-neutral-200 bg-neutral-50/70">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 block">Total Orders</span>
                      <p className="text-[19px] font-bold text-[#111111] mt-0.5">{selectedCustomer.orderCount || 0}</p>
                    </div>
                    <div className="p-3.5 rounded-lg border border-neutral-200 bg-neutral-50/70">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 block">Avg Order Value</span>
                      <p className="text-[19px] font-bold text-[#111111] mt-0.5">₹{(selectedCustomer.avgOrderValue || 0).toLocaleString('en-IN')}</p>
                    </div>
                    <div className="p-3.5 rounded-lg border border-neutral-200 bg-neutral-50/70">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 block">Customer Tier</span>
                      <p className="text-[19px] font-bold text-[#111111] mt-0.5">{selectedCustomer.status}</p>
                    </div>
                  </div>

                  {/* Quick Action Buttons */}
                  <div className="flex items-center gap-2.5 pt-1">
                    {selectedCustomer.email && (
                      <a
                        href={`mailto:${selectedCustomer.email}`}
                        className="flex-1 py-2 px-3 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 text-[#111111] text-[13px] font-medium flex items-center justify-center gap-2 transition-colors shadow-2xs"
                      >
                        <Mail className="w-3.5 h-3.5 text-neutral-600" />
                        <span>Email Customer</span>
                      </a>
                    )}
                    {selectedCustomer.mobile && (
                      <a
                        href={`tel:${selectedCustomer.mobile}`}
                        className="flex-1 py-2 px-3 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 text-[#111111] text-[13px] font-medium flex items-center justify-center gap-2 transition-colors shadow-2xs"
                      >
                        <Phone className="w-3.5 h-3.5 text-neutral-600" />
                        <span>Call Phone</span>
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => setActiveDrawerTab('edit')}
                      className="py-2 px-4 rounded-lg bg-[#111111] hover:bg-black text-white text-[13px] font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                  </div>

                  {/* Summary Profile Details */}
                  <div className="rounded-xl border border-neutral-200 bg-white p-4 space-y-3">
                    <h4 className="text-[14px] font-bold text-[#111111]">Profile & Account Information</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[13px]">
                      <div>
                        <span className="text-neutral-400 text-[11.5px] block">Full Name</span>
                        <span className="font-medium text-neutral-900">{selectedCustomer.name}</span>
                      </div>
                      <div>
                        <span className="text-neutral-400 text-[11.5px] block">Email Address</span>
                        <span className="font-medium text-neutral-900 select-all">{selectedCustomer.email || 'None'}</span>
                      </div>
                      <div>
                        <span className="text-neutral-400 text-[11.5px] block">Mobile Number</span>
                        <span className="font-medium text-neutral-900">{selectedCustomer.mobile ? `+91 ${selectedCustomer.mobile}` : 'None'}</span>
                      </div>
                      <div>
                        <span className="text-neutral-400 text-[11.5px] block">Last Order Placed</span>
                        <span className="font-medium text-neutral-900">
                          {selectedCustomer.lastOrderDate ? new Date(selectedCustomer.lastOrderDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Never'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Primary Address Preview */}
                  <div className="rounded-xl border border-neutral-200 bg-white p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[14px] font-bold text-[#111111]">Primary Shipping Destination</h4>
                      <button
                        type="button"
                        onClick={() => {
                          const addr = selectedCustomer.primaryAddress;
                          const full = [addr?.houseNo, addr?.street, addr?.landmark, addr?.city, addr?.state, addr?.pincode].filter(Boolean).join(', ');
                          copyToClipboard(full, 'Address');
                        }}
                        className="text-[12px] text-neutral-500 hover:text-black flex items-center gap-1 cursor-pointer"
                      >
                        <Copy className="w-3 h-3" />
                        <span>Copy Address</span>
                      </button>
                    </div>
                    <p className="text-[13px] text-neutral-700 leading-relaxed">
                      {[
                        selectedCustomer.primaryAddress?.houseNo,
                        selectedCustomer.primaryAddress?.street,
                        selectedCustomer.primaryAddress?.landmark,
                        selectedCustomer.primaryAddress?.city,
                        selectedCustomer.primaryAddress?.state,
                        selectedCustomer.primaryAddress?.pincode ? `PIN: ${selectedCustomer.primaryAddress?.pincode}` : '',
                      ]
                        .filter(Boolean)
                        .join(', ') || 'No shipping address recorded yet.'}
                    </p>
                  </div>

                  {/* Customer Notes */}
                  {selectedCustomer.notes && (
                    <div className="rounded-xl border border-neutral-200 bg-amber-50/50 p-4 space-y-1">
                      <span className="text-[12px] font-bold text-amber-900 uppercase tracking-wider block">Staff Notes</span>
                      <p className="text-[13px] text-neutral-800">{selectedCustomer.notes}</p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 02: ORDER HISTORY */}
              {activeDrawerTab === 'orders' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[14px] font-bold text-[#111111]">
                      Past Orders ({selectedCustomer.orders?.length || 0})
                    </h4>
                  </div>

                  {selectedCustomer.orders && selectedCustomer.orders.length > 0 ? (
                    <div className="divide-y divide-neutral-200 border border-neutral-200 rounded-xl bg-white overflow-hidden">
                      {selectedCustomer.orders.map((ord) => (
                        <div key={ord.orderId} className="p-4 hover:bg-neutral-50/60 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-[13.5px] text-[#111111]">
                                #{ord.orderId}
                              </span>
                              <span
                                className={`text-[10.5px] font-semibold px-2 py-0.5 rounded-full uppercase ${
                                  ord.status === 'CONFIRMED' || ord.status === 'DELIVERED'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-neutral-100 text-neutral-700'
                                }`}
                              >
                                {ord.fulfillmentStatus || ord.status}
                              </span>
                            </div>
                            <p className="text-[12px] text-neutral-400 mt-0.5">
                              {ord.placedAt ? new Date(ord.placedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recent'} • {ord.itemsCount} item(s) • Method: {ord.paymentMethod?.toUpperCase()}
                            </p>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="text-[15px] font-bold text-[#111111]">
                              ₹{(ord.totalAmount || 0).toLocaleString('en-IN')}
                            </span>
                            <a
                              href={`/orders?search=${ord.orderId}`}
                              className="px-3 py-1.5 rounded-full border border-neutral-200 hover:bg-neutral-100 text-[12px] font-medium text-neutral-700 inline-flex items-center gap-1 transition-colors"
                              title="View Order in Orders Tab"
                            >
                              <span>Inspect</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-12 text-center border border-neutral-200 rounded-xl bg-neutral-50/50">
                      <ShoppingBag className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
                      <p className="text-[13px] font-medium text-neutral-600">No orders placed by this customer yet.</p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 03: SHIPPING ADDRESS */}
              {activeDrawerTab === 'address' && (
                <div className="space-y-4">
                  <div className="rounded-xl border border-neutral-200 bg-white p-5 space-y-4">
                    <h4 className="text-[15px] font-bold text-[#111111]">Recorded Delivery Address</h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[13px]">
                      <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-100">
                        <span className="text-[11px] uppercase tracking-wider text-neutral-400 font-bold block mb-1">House / Flat</span>
                        <p className="font-medium text-neutral-900">{selectedCustomer.primaryAddress?.houseNo || '—'}</p>
                      </div>
                      <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-100">
                        <span className="text-[11px] uppercase tracking-wider text-neutral-400 font-bold block mb-1">Street / Area</span>
                        <p className="font-medium text-neutral-900">{selectedCustomer.primaryAddress?.street || '—'}</p>
                      </div>
                      <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-100">
                        <span className="text-[11px] uppercase tracking-wider text-neutral-400 font-bold block mb-1">Landmark</span>
                        <p className="font-medium text-neutral-900">{selectedCustomer.primaryAddress?.landmark || '—'}</p>
                      </div>
                      <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-100">
                        <span className="text-[11px] uppercase tracking-wider text-neutral-400 font-bold block mb-1">City</span>
                        <p className="font-medium text-neutral-900">{selectedCustomer.primaryAddress?.city || '—'}</p>
                      </div>
                      <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-100">
                        <span className="text-[11px] uppercase tracking-wider text-neutral-400 font-bold block mb-1">State</span>
                        <p className="font-medium text-neutral-900">{selectedCustomer.primaryAddress?.state || '—'}</p>
                      </div>
                      <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-100">
                        <span className="text-[11px] uppercase tracking-wider text-neutral-400 font-bold block mb-1">Pincode</span>
                        <p className="font-medium text-neutral-900">{selectedCustomer.primaryAddress?.pincode || '—'}</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const addr = selectedCustomer.primaryAddress;
                        const full = [addr?.houseNo, addr?.street, addr?.landmark, addr?.city, addr?.state, addr?.pincode].filter(Boolean).join(', ');
                        copyToClipboard(full, 'Full Address');
                      }}
                      className="w-full py-2.5 rounded-lg border border-neutral-300 bg-white hover:bg-neutral-50 text-[13px] font-semibold text-neutral-800 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Full Postal Address to Clipboard</span>
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 04: EDIT PROFILE */}
              {activeDrawerTab === 'edit' && editForm && (
                <form onSubmit={handleSaveEdit} className="space-y-4">
                  <div className="rounded-xl border border-neutral-200 bg-white p-5 space-y-4">
                    <h4 className="text-[15px] font-bold text-[#111111]">Edit Customer Details</h4>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11.5px] font-bold text-neutral-600 block mb-1">First Name</label>
                        <input
                          type="text"
                          value={editForm.firstName}
                          onChange={(e) => setEditForm((prev) => ({ ...prev, firstName: e.target.value }))}
                          className="w-full h-10 px-3 rounded-lg border border-neutral-200 text-[13px] outline-none focus:border-black"
                          placeholder="First name"
                        />
                      </div>
                      <div>
                        <label className="text-[11.5px] font-bold text-neutral-600 block mb-1">Last Name</label>
                        <input
                          type="text"
                          value={editForm.lastName}
                          onChange={(e) => setEditForm((prev) => ({ ...prev, lastName: e.target.value }))}
                          className="w-full h-10 px-3 rounded-lg border border-neutral-200 text-[13px] outline-none focus:border-black"
                          placeholder="Last name"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11.5px] font-bold text-neutral-600 block mb-1">Email Address</label>
                        <input
                          type="email"
                          value={editForm.email}
                          onChange={(e) => setEditForm((prev) => ({ ...prev, email: e.target.value }))}
                          className="w-full h-10 px-3 rounded-lg border border-neutral-200 text-[13px] outline-none focus:border-black"
                          placeholder="customer@example.com"
                        />
                      </div>
                      <div>
                        <label className="text-[11.5px] font-bold text-neutral-600 block mb-1">Mobile (+91)</label>
                        <input
                          type="tel"
                          value={editForm.mobile}
                          onChange={(e) => setEditForm((prev) => ({ ...prev, mobile: e.target.value }))}
                          className="w-full h-10 px-3 rounded-lg border border-neutral-200 text-[13px] outline-none focus:border-black"
                          placeholder="10-digit number"
                        />
                      </div>
                    </div>

                    <div className="pt-2 border-t border-neutral-100">
                      <span className="text-[12px] font-bold text-neutral-800 block mb-3">Shipping Address</span>
                      
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[11.5px] text-neutral-500 block mb-1">House / Flat No.</label>
                            <input
                              type="text"
                              value={editForm.houseNo}
                              onChange={(e) => setEditForm((prev) => ({ ...prev, houseNo: e.target.value }))}
                              className="w-full h-9 px-3 rounded-lg border border-neutral-200 text-[13px] outline-none focus:border-black"
                              placeholder="Flat 402, House 33"
                            />
                          </div>
                          <div>
                            <label className="text-[11.5px] text-neutral-500 block mb-1">Landmark</label>
                            <input
                              type="text"
                              value={editForm.landmark}
                              onChange={(e) => setEditForm((prev) => ({ ...prev, landmark: e.target.value }))}
                              className="w-full h-9 px-3 rounded-lg border border-neutral-200 text-[13px] outline-none focus:border-black"
                              placeholder="Near temple / park"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-[11.5px] text-neutral-500 block mb-1">Street / Area</label>
                          <input
                            type="text"
                            value={editForm.street}
                            onChange={(e) => setEditForm((prev) => ({ ...prev, street: e.target.value }))}
                            className="w-full h-9 px-3 rounded-lg border border-neutral-200 text-[13px] outline-none focus:border-black"
                            placeholder="Road 2, Patliputra Colony"
                          />
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="text-[11.5px] text-neutral-500 block mb-1">City</label>
                            <input
                              type="text"
                              value={editForm.city}
                              onChange={(e) => setEditForm((prev) => ({ ...prev, city: e.target.value }))}
                              className="w-full h-9 px-3 rounded-lg border border-neutral-200 text-[13px] outline-none focus:border-black"
                              placeholder="Patna"
                            />
                          </div>
                          <div>
                            <label className="text-[11.5px] text-neutral-500 block mb-1">State</label>
                            <input
                              type="text"
                              value={editForm.state}
                              onChange={(e) => setEditForm((prev) => ({ ...prev, state: e.target.value }))}
                              className="w-full h-9 px-3 rounded-lg border border-neutral-200 text-[13px] outline-none focus:border-black"
                              placeholder="Bihar"
                            />
                          </div>
                          <div>
                            <label className="text-[11.5px] text-neutral-500 block mb-1">PIN Code</label>
                            <input
                              type="text"
                              value={editForm.pincode}
                              onChange={(e) => setEditForm((prev) => ({ ...prev, pincode: e.target.value }))}
                              className="w-full h-9 px-3 rounded-lg border border-neutral-200 text-[13px] outline-none focus:border-black"
                              placeholder="800013"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-neutral-100">
                      <label className="text-[11.5px] font-bold text-neutral-600 block mb-1">Internal Notes</label>
                      <textarea
                        rows={3}
                        value={editForm.notes}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, notes: e.target.value }))}
                        className="w-full p-3 rounded-lg border border-neutral-200 text-[13px] outline-none focus:border-black"
                        placeholder="Add private staff notes regarding this customer..."
                      />
                    </div>

                    <div className="flex items-center justify-end gap-2.5 pt-2">
                      <button
                        type="button"
                        onClick={() => setActiveDrawerTab('overview')}
                        className="px-4 py-2 rounded-full border border-neutral-200 hover:bg-neutral-100 text-[13px] font-medium transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={savingEdit}
                        className="px-5 py-2 rounded-full bg-[#111111] hover:bg-black text-white text-[13px] font-semibold transition-all active:scale-95 cursor-pointer disabled:opacity-50 shadow-xs"
                      >
                        {savingEdit ? 'Saving Updates...' : 'Save Customer Changes'}
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Customer Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-[2px] transition-opacity"
            onClick={() => setIsAddModalOpen(false)}
          />

          <div className="relative bg-white rounded-2xl max-w-lg w-full p-6 border border-neutral-200 shadow-2xl z-10 animate-modal-content">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center">
                  <User className="w-4 h-4 text-[#111111]" />
                </div>
                <div>
                  <h3 className="text-[17px] font-bold text-[#111111]">Create New Customer</h3>
                  <p className="text-[12px] text-neutral-400">Add profile to your customer directory</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="w-7 h-7 rounded-full hover:bg-neutral-100 flex items-center justify-center text-neutral-400 hover:text-black cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[12px] font-medium text-neutral-700 block mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={newCustomerForm.firstName}
                    onChange={(e) => setNewCustomerForm((prev) => ({ ...prev, firstName: e.target.value }))}
                    className="w-full h-10 px-3 rounded-lg border border-neutral-200 text-[13px] outline-none focus:border-black"
                    placeholder="e.g. Priya"
                  />
                </div>
                <div>
                  <label className="text-[12px] font-medium text-neutral-700 block mb-1">Last Name</label>
                  <input
                    type="text"
                    value={newCustomerForm.lastName}
                    onChange={(e) => setNewCustomerForm((prev) => ({ ...prev, lastName: e.target.value }))}
                    className="w-full h-10 px-3 rounded-lg border border-neutral-200 text-[13px] outline-none focus:border-black"
                    placeholder="e.g. Patel"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[12px] font-medium text-neutral-700 block mb-1">Email Address</label>
                  <input
                    type="email"
                    value={newCustomerForm.email}
                    onChange={(e) => setNewCustomerForm((prev) => ({ ...prev, email: e.target.value }))}
                    className="w-full h-10 px-3 rounded-lg border border-neutral-200 text-[13px] outline-none focus:border-black"
                    placeholder="priya@example.com"
                  />
                </div>
                <div>
                  <label className="text-[12px] font-medium text-neutral-700 block mb-1">Mobile (+91)</label>
                  <input
                    type="tel"
                    value={newCustomerForm.mobile}
                    onChange={(e) => setNewCustomerForm((prev) => ({ ...prev, mobile: e.target.value }))}
                    className="w-full h-10 px-3 rounded-lg border border-neutral-200 text-[13px] outline-none focus:border-black"
                    placeholder="9876543210"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-neutral-100 space-y-3">
                <span className="text-[12px] font-bold text-neutral-700 block">Delivery Address</span>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={newCustomerForm.houseNo}
                    onChange={(e) => setNewCustomerForm((prev) => ({ ...prev, houseNo: e.target.value }))}
                    className="w-full h-9 px-3 rounded-lg border border-neutral-200 text-[13px] outline-none focus:border-black"
                    placeholder="House / Flat No."
                  />
                  <input
                    type="text"
                    value={newCustomerForm.street}
                    onChange={(e) => setNewCustomerForm((prev) => ({ ...prev, street: e.target.value }))}
                    className="w-full h-9 px-3 rounded-lg border border-neutral-200 text-[13px] outline-none focus:border-black"
                    placeholder="Street / Area"
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    value={newCustomerForm.city}
                    onChange={(e) => setNewCustomerForm((prev) => ({ ...prev, city: e.target.value }))}
                    className="w-full h-9 px-3 rounded-lg border border-neutral-200 text-[13px] outline-none focus:border-black"
                    placeholder="City (Patna)"
                  />
                  <input
                    type="text"
                    value={newCustomerForm.state}
                    onChange={(e) => setNewCustomerForm((prev) => ({ ...prev, state: e.target.value }))}
                    className="w-full h-9 px-3 rounded-lg border border-neutral-200 text-[13px] outline-none focus:border-black"
                    placeholder="State"
                  />
                  <input
                    type="text"
                    value={newCustomerForm.pincode}
                    onChange={(e) => setNewCustomerForm((prev) => ({ ...prev, pincode: e.target.value }))}
                    className="w-full h-9 px-3 rounded-lg border border-neutral-200 text-[13px] outline-none focus:border-black"
                    placeholder="PIN Code"
                  />
                </div>
              </div>

              <div>
                <label className="text-[12px] font-medium text-neutral-700 block mb-1">Notes</label>
                <textarea
                  rows={2}
                  value={newCustomerForm.notes}
                  onChange={(e) => setNewCustomerForm((prev) => ({ ...prev, notes: e.target.value }))}
                  className="w-full p-2.5 rounded-lg border border-neutral-200 text-[13px] outline-none focus:border-black"
                  placeholder="Optional internal customer notes..."
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-full border border-neutral-200 hover:bg-neutral-100 text-[13px] font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2 rounded-full bg-[#111111] hover:bg-black text-white text-[13px] font-semibold transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Create Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
