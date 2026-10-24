'use client';

import React, { useState, useEffect } from 'react';
import AdminShell from '@/components/AdminShell';
import {
  Users,
  Search,
  RefreshCw,
  Phone,
  Mail,
  MapPin,
  ShoppingBag,
  CreditCard,
} from 'lucide-react';

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/customers');
      if (res.ok) {
        const json = await res.json();
        setCustomers(json.customers || []);
      }
    } catch (err) {
      console.error('Failed to fetch customers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const filteredCustomers = customers.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.name?.toLowerCase().includes(q) ||
      c.mobile?.includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.primaryAddress?.city?.toLowerCase().includes(q)
    );
  });

  return (
    <AdminShell>
      <div className="space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-[24px] font-bold tracking-tight text-[#111111]">
              Customer Directory
            </h2>
            <p className="text-[14px] text-neutral-500 mt-0.5">
              Consumer profiles, delivery addresses and order histories saved in MongoDB.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search customers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-[220px] sm:w-[260px] h-10 pl-9 pr-3 rounded-full border border-neutral-200 bg-white text-[13px] outline-none focus:border-[#111111]"
              />
            </div>
            <button
              type="button"
              onClick={fetchCustomers}
              className="w-10 h-10 rounded-full border border-neutral-200 bg-white flex items-center justify-center text-neutral-600 hover:text-black cursor-pointer shadow-sm"
              title="Refresh"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Customer Table */}
        <div className="bg-white rounded-[20px] border border-neutral-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.02)] overflow-hidden">
          {loading ? (
            <div className="py-20 text-center text-neutral-400">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
              <p className="text-[14px]">Loading customer profiles from MongoDB...</p>
            </div>
          ) : filteredCustomers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-neutral-50/80 border-b border-neutral-100 text-[12px] font-semibold text-neutral-500 uppercase tracking-wider">
                    <th className="py-3.5 px-6">Customer</th>
                    <th className="py-3.5 px-6">Contact Details</th>
                    <th className="py-3.5 px-6">Delivery Location</th>
                    <th className="py-3.5 px-6">Orders</th>
                    <th className="py-3.5 px-6 text-right">Lifetime Spend</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 text-[14px]">
                  {filteredCustomers.map((user, idx) => {
                    const initials = (user.name || user.firstName || 'C')
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase();

                    return (
                      <tr key={user._id || idx} className="hover:bg-neutral-50/60 transition-colors">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-[#111111] text-white flex items-center justify-center font-bold text-[13px] shrink-0">
                              {initials}
                            </div>
                            <div>
                              <p className="font-bold text-[#111111]">{user.name || 'Footwear Enthusiast'}</p>
                              <p className="text-[12px] text-neutral-400 font-mono">
                                ID: {(user._id || '').slice(-6)}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="space-y-1 text-[13px]">
                            {user.mobile && (
                              <p className="flex items-center gap-1.5 text-neutral-700">
                                <Phone className="w-3.5 h-3.5 text-neutral-400" />
                                <span>+91 {user.mobile}</span>
                              </p>
                            )}
                            {user.email && (
                              <p className="flex items-center gap-1.5 text-neutral-500 text-[12px]">
                                <Mail className="w-3.5 h-3.5 text-neutral-400" />
                                <span>{user.email}</span>
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-6 text-[13px] text-neutral-600">
                          {user.primaryAddress?.city ? (
                            <div className="flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                              <span>
                                {user.primaryAddress.city} - {user.primaryAddress.pincode}
                              </span>
                            </div>
                          ) : (
                            <span className="text-neutral-400">Direct Online Order</span>
                          )}
                        </td>
                        <td className="py-4 px-6">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[12px] font-medium bg-neutral-100 text-neutral-700">
                            <ShoppingBag className="w-3 h-3" />
                            <span>{user.orderCount || 1} orders</span>
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right font-bold text-[#111111]">
                          ₹{(user.totalSpent || 13995).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-16 text-center">
              <Users className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
              <h3 className="text-[16px] font-medium text-[#111111]">No customers registered</h3>
              <p className="text-[13px] text-neutral-400 mt-1">
                New customers will appear here when they register or place orders on the storefront.
              </p>
            </div>
          )}
        </div>
      </div>
    </AdminShell>
  );
}
