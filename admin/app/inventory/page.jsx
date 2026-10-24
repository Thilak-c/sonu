'use client';

import React, { useState, useEffect } from 'react';
import AdminShell from '@/components/AdminShell';
import {
  Layers,
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
} from 'lucide-react';

const SIZES = ['UK 3', 'UK 4', 'UK 5', 'UK 6', 'UK 7', 'UK 8', 'UK 9'];

export default function InventoryPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/products');
      if (res.ok) {
        const json = await res.json();
        setProducts(json.products || []);
      }
    } catch (err) {
      console.error('Failed to fetch inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const filtered = products.filter((p) => {
    if (!searchQuery.trim()) return true;
    return p.name?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <AdminShell>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-[24px] font-bold tracking-tight text-[#111111]">
              Inventory Matrix
            </h2>
            <p className="text-[14px] text-neutral-500 mt-0.5">
              Footwear size-by-size availability and real-time stock allocation.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search silhouette..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-[220px] sm:w-[260px] h-10 pl-9 pr-3 rounded-full border border-neutral-200 bg-white text-[13px] outline-none focus:border-[#111111]"
              />
            </div>
            <button
              type="button"
              onClick={fetchInventory}
              className="w-10 h-10 rounded-full border border-neutral-200 bg-white flex items-center justify-center text-neutral-600 hover:text-black cursor-pointer shadow-sm"
              title="Refresh"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Matrix Card */}
        <div className="bg-white rounded-[20px] border border-neutral-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.02)] overflow-hidden">
          {loading ? (
            <div className="py-20 text-center text-neutral-400">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
              <p className="text-[14px]">Loading inventory data...</p>
            </div>
          ) : filtered.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-neutral-50/80 border-b border-neutral-100 text-[12px] font-semibold text-neutral-500 uppercase tracking-wider">
                    <th className="py-3.5 px-6 min-w-[200px]">Footwear Silhouette</th>
                    <th className="py-3.5 px-4 text-center">UK 3</th>
                    <th className="py-3.5 px-4 text-center">UK 4</th>
                    <th className="py-3.5 px-4 text-center">UK 5</th>
                    <th className="py-3.5 px-4 text-center">UK 6</th>
                    <th className="py-3.5 px-4 text-center">UK 7</th>
                    <th className="py-3.5 px-4 text-center">UK 8</th>
                    <th className="py-3.5 px-4 text-center">UK 9</th>
                    <th className="py-3.5 px-6 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 text-[13px]">
                  {filtered.map((prod) => {
                    const availableSizes = prod.availableSizes || SIZES;
                    const inStock = prod.inStock !== false;

                    return (
                      <tr key={prod.slug || prod.id} className="hover:bg-neutral-50/60 transition-colors">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <img
                              src={prod.image || '/images/ad22b92Nike-HQ2593-502_1.avif'}
                              alt=""
                              className="w-10 h-10 rounded-lg bg-neutral-100 object-contain p-0.5"
                            />
                            <div>
                              <p className="font-bold text-[#111111]">{prod.name}</p>
                              <p className="text-[11px] text-neutral-400">{prod.category}</p>
                            </div>
                          </div>
                        </td>

                        {SIZES.map((sz) => {
                          const hasSize = inStock && availableSizes.includes(sz);
                          return (
                            <td key={sz} className="py-4 px-4 text-center">
                              {hasSize ? (
                                <span className="inline-block w-6 h-6 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold leading-6">
                                  ✓
                                </span>
                              ) : (
                                <span className="inline-block w-6 h-6 rounded-full bg-neutral-100 text-neutral-400 text-[11px] font-bold leading-6">
                                  —
                                </span>
                              )}
                            </td>
                          );
                        })}

                        <td className="py-4 px-6 text-right">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium ${
                              inStock
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {inStock ? 'Available' : 'Zero Allocation'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-16 text-center text-neutral-400">
              <Layers className="w-8 h-8 mx-auto mb-2 text-neutral-300" />
              <p>No products found in inventory.</p>
            </div>
          )}
        </div>
      </div>
    </AdminShell>
  );
}
