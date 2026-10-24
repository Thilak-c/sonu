'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import AdminShell from '@/components/AdminShell';
import {
  Plus,
  Search,
  Package,
  Edit2,
  Trash2,
  Check,
  X,
  ExternalLink,
  RefreshCw,
  LayoutGrid,
  List,
  Sparkles,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';

const PRESET_IMAGES = [
  { label: 'Hybrid RN Violet', url: '/images/ad22b92Nike-HQ2593-502_1.avif' },
  { label: 'Stealth RN Black', url: '/images/ad22b92Nike-HJ1101-003_1.avif' },
  { label: 'Pure Low White', url: '/images/1e462d9Nike-IO3815-102_1.avif' },
  { label: 'Off-Path Trail Brown', url: '/images/ad22b92Nike-IQ3439-211_1.avif' },
  { label: 'AeroFlex Lilac', url: '/images/1e462d9Nike-IO3815-500_1.avif' },
  { label: 'Stride Tempo Pink', url: '/images/ad22b92Nike-HQ3049-502_1.avif' },
];

const ALL_SIZES = ['UK 3', 'UK 4', 'UK 5', 'UK 6', 'UK 7', 'UK 8', 'UK 9'];

function ProductsContent() {
  const searchParams = useSearchParams();
  const shouldOpenNew = searchParams.get('action') === 'new';

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [saving, setSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    category: "Women's Road Running Shoes",
    priceNumber: 13995,
    image: PRESET_IMAGES[0].url,
    description: '',
    availableSizes: [...ALL_SIZES],
    inStock: true,
  });

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/products');
      if (res.ok) {
        const json = await res.json();
        setProducts(json.products || []);
      }
    } catch (err) {
      console.error('Failed to fetch products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    if (shouldOpenNew) {
      openCreateModal();
    }
  }, [shouldOpenNew]);

  const openCreateModal = () => {
    setModalMode('create');
    setFormData({
      name: '',
      slug: '',
      category: "Women's Road Running Shoes",
      priceNumber: 13995,
      image: PRESET_IMAGES[0].url,
      description: 'Handcrafted small-run footwear engineered with ergonomic comfort soles and premium materials.',
      availableSizes: [...ALL_SIZES],
      inStock: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (prod) => {
    setModalMode('edit');
    setFormData({
      name: prod.name || '',
      slug: prod.slug || prod.id,
      category: prod.category || "Footwear",
      priceNumber: prod.priceNumber || 13995,
      image: prod.image || PRESET_IMAGES[0].url,
      description: prod.description || '',
      availableSizes: prod.availableSizes || [...ALL_SIZES],
      inStock: prod.inStock !== false,
    });
    setIsModalOpen(true);
  };

  const handleToggleStock = async (slug, currentStock) => {
    try {
      const newStock = !currentStock;
      // Optimistic update
      setProducts((prev) =>
        prev.map((p) => (p.slug === slug || p.id === slug ? { ...p, inStock: newStock } : p))
      );

      await fetch('/api/products', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, inStock: newStock }),
      });
    } catch (err) {
      console.error('Failed to toggle stock:', err);
      fetchProducts();
    }
  };

  const handleDeleteProduct = async (slug) => {
    if (!confirm('Are you sure you want to remove this product from the live catalog?')) return;
    try {
      setProducts((prev) => prev.filter((p) => p.slug !== slug && p.id !== slug));
      await fetch(`/api/products?slug=${encodeURIComponent(slug)}`, {
        method: 'DELETE',
      });
    } catch (err) {
      console.error('Failed to delete product:', err);
      fetchProducts();
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      if (modalMode === 'create') {
        const res = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        if (res.ok) {
          const json = await res.json();
          setProducts((prev) => [json.product, ...prev]);
          setIsModalOpen(false);
        } else {
          const err = await res.json();
          alert(err.error || 'Failed to create product');
        }
      } else {
        const res = await fetch('/api/products', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        if (res.ok) {
          setProducts((prev) =>
            prev.map((p) => (p.slug === formData.slug ? { ...p, ...formData } : p))
          );
          setIsModalOpen(false);
        } else {
          const err = await res.json();
          alert(err.error || 'Failed to update product');
        }
      }
    } catch (err) {
      console.error('Form submit error:', err);
    } finally {
      setSaving(false);
    }
  };

  const toggleSize = (size) => {
    setFormData((prev) => {
      const exists = prev.availableSizes.includes(size);
      const updated = exists
        ? prev.availableSizes.filter((s) => s !== size)
        : [...prev.availableSizes, size];
      return { ...prev, availableSizes: updated };
    });
  };

  const filteredProducts = products.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.name?.toLowerCase().includes(q) ||
      p.category?.toLowerCase().includes(q) ||
      p.slug?.toLowerCase().includes(q)
    );
  });

  return (
    <AdminShell>
      <div className="space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-[24px] font-bold tracking-tight text-[#111111]">
              Footwear Catalog
            </h2>
            <p className="text-[14px] text-neutral-500 mt-0.5">
              Live products in MongoDB synchronized with the Next.js consumer storefront.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search silhouettes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-[200px] sm:w-[240px] h-10 pl-9 pr-3 rounded-full border border-neutral-200 bg-white text-[13px] outline-none focus:border-[#111111]"
              />
            </div>

            <div className="flex items-center border border-neutral-200 rounded-full bg-white p-0.5">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-full cursor-pointer transition-colors ${
                  viewMode === 'grid' ? 'bg-[#111111] text-white' : 'text-neutral-500 hover:text-black'
                }`}
                title="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-2 rounded-full cursor-pointer transition-colors ${
                  viewMode === 'table' ? 'bg-[#111111] text-white' : 'text-neutral-500 hover:text-black'
                }`}
                title="Table View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#111111] hover:bg-black text-white text-[13px] font-medium transition-all shadow-sm active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Drop</span>
            </button>
          </div>
        </div>

        {/* Catalog Body */}
        {loading ? (
          <div className="py-24 text-center text-neutral-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
            <p className="text-[14px]">Loading catalog from MongoDB...</p>
          </div>
        ) : filteredProducts.length > 0 ? (
          viewMode === 'grid' ? (
            /* Grid View */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
              {filteredProducts.map((prod) => {
                const inStock = prod.inStock !== false;
                const priceFormatted = typeof prod.price === 'string' ? prod.price : `₹${(prod.priceNumber || 13995).toLocaleString('en-IN')}`;

                return (
                  <div
                    key={prod.slug || prod.id}
                    className="bg-white rounded-[20px] border border-neutral-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.02)] overflow-hidden flex flex-col group hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)] transition-all"
                  >
                    {/* Shoe Hero Image */}
                    <div className="aspect-[4/3] bg-neutral-50/70 p-6 flex items-center justify-center relative overflow-hidden">
                      <img
                        src={prod.image || prod.mainImage || PRESET_IMAGES[0].url}
                        alt={prod.name}
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-3.5 right-3.5 flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleToggleStock(prod.slug || prod.id, inStock)}
                          className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all cursor-pointer shadow-sm ${
                            inStock
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {inStock ? 'In Stock' : 'Out of Stock'}
                        </button>
                      </div>
                    </div>

                    {/* Shoe Details */}
                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-[11px] uppercase tracking-wider text-neutral-400 font-medium">
                              {prod.category || 'Footwear'}
                            </span>
                            <h3 className="text-[17px] font-bold text-[#111111] leading-snug mt-0.5">
                              {prod.name}
                            </h3>
                          </div>
                          <span className="text-[16px] font-bold text-[#111111]">
                            {priceFormatted}
                          </span>
                        </div>

                        {/* Sizes Pill list */}
                        <div className="flex flex-wrap gap-1 mt-3">
                          {(prod.availableSizes || ALL_SIZES).map((sz) => (
                            <span
                              key={sz}
                              className="text-[10px] font-medium px-2 py-0.5 rounded bg-neutral-100 text-neutral-600"
                            >
                              {sz}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Card Actions */}
                      <div className="flex items-center justify-between pt-4 mt-4 border-t border-neutral-100">
                        <a
                          href={`http://localhost:3000/product/${prod.slug || prod.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[12px] font-medium text-neutral-500 hover:text-black transition-colors"
                        >
                          <span>Storefront</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditModal(prod)}
                            className="p-2 rounded-full hover:bg-neutral-100 text-neutral-600 hover:text-black transition-colors cursor-pointer"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteProduct(prod.slug || prod.id)}
                            className="p-2 rounded-full hover:bg-rose-50 text-neutral-400 hover:text-rose-600 transition-colors cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Table View */
            <div className="bg-white rounded-[20px] border border-neutral-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.02)] overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-neutral-50/80 border-b border-neutral-100 text-[12px] font-semibold text-neutral-500 uppercase tracking-wider">
                    <th className="py-3.5 px-6">Product</th>
                    <th className="py-3.5 px-6">Category</th>
                    <th className="py-3.5 px-6">Price</th>
                    <th className="py-3.5 px-6">Inventory Status</th>
                    <th className="py-3.5 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 text-[14px]">
                  {filteredProducts.map((prod) => {
                    const inStock = prod.inStock !== false;
                    return (
                      <tr key={prod.slug || prod.id} className="hover:bg-neutral-50/70 transition-colors">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <img
                              src={prod.image || PRESET_IMAGES[0].url}
                              alt=""
                              className="w-12 h-12 rounded-lg bg-neutral-100 object-contain p-1"
                            />
                            <div>
                              <p className="font-bold text-[#111111]">{prod.name}</p>
                              <p className="text-[12px] font-mono text-neutral-400">{prod.slug}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-neutral-600">{prod.category}</td>
                        <td className="py-4 px-6 font-bold text-[#111111]">
                          ₹{(prod.priceNumber || 13995).toLocaleString('en-IN')}
                        </td>
                        <td className="py-4 px-6">
                          <button
                            type="button"
                            onClick={() => handleToggleStock(prod.slug || prod.id, inStock)}
                            className={`px-3 py-1 rounded-full text-[12px] font-medium transition-all cursor-pointer ${
                              inStock
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {inStock ? 'In Stock' : 'Out of Stock'}
                          </button>
                        </td>
                        <td className="py-4 px-6 text-right space-x-2">
                          <button
                            type="button"
                            onClick={() => openEditModal(prod)}
                            className="p-1.5 rounded-full hover:bg-neutral-100 text-neutral-600 hover:text-black cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteProduct(prod.slug || prod.id)}
                            className="p-1.5 rounded-full hover:bg-rose-50 text-neutral-400 hover:text-rose-600 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        ) : (
          <div className="py-20 text-center">
            <Package className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
            <h3 className="text-[16px] font-medium text-[#111111]">No products found</h3>
            <p className="text-[13px] text-neutral-400 mt-1">
              Add a new drop to populate your storefront.
            </p>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/50 transition-opacity"
            onClick={() => setIsModalOpen(false)}
          />

          <div className="relative w-full max-w-[620px] bg-white rounded-[24px] shadow-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto z-10">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
              <h3 className="text-[20px] font-bold text-[#111111]">
                {modalMode === 'create' ? 'Add New Footwear Drop' : 'Edit Drop Details'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="mt-6 space-y-5">
              <div>
                <label className="block text-[13px] font-medium text-neutral-700 mb-1.5">
                  Footwear Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SONU Velocity Pro"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full h-11 px-4 rounded-[12px] border border-neutral-200 text-[14px] outline-none focus:border-[#111111]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-medium text-neutral-700 mb-1.5">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full h-11 px-3 rounded-[12px] border border-neutral-200 text-[14px] outline-none focus:border-[#111111] bg-white"
                  >
                    <option value="Women's Road Running Shoes">Women's Road Running Shoes</option>
                    <option value="Men's Road Running Shoes">Men's Road Running Shoes</option>
                    <option value="Lifestyle & Court Shoes">Lifestyle & Court Shoes</option>
                    <option value="All-Terrain Trail Running Shoes">All-Terrain Trail Running Shoes</option>
                    <option value="Women's Training & Gym Shoes">Women's Training & Gym Shoes</option>
                    <option value="Performance Speed Shoes">Performance Speed Shoes</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[13px] font-medium text-neutral-700 mb-1.5">
                    Retail Price (INR ₹)
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={formData.priceNumber}
                    onChange={(e) => setFormData({ ...formData, priceNumber: Number(e.target.value) })}
                    className="w-full h-11 px-4 rounded-[12px] border border-neutral-200 text-[14px] outline-none focus:border-[#111111]"
                  />
                </div>
              </div>

              {/* Product Hero Image Selection */}
              <div>
                <label className="block text-[13px] font-medium text-neutral-700 mb-1.5">
                  Footwear Visual Asset
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {PRESET_IMAGES.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setFormData({ ...formData, image: img.url })}
                      className={`aspect-square rounded-[12px] border p-1 bg-neutral-50 flex items-center justify-center transition-all cursor-pointer ${
                        formData.image === img.url
                          ? 'border-2 border-[#111111] shadow-sm'
                          : 'border-neutral-200 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={img.url} alt="" className="w-full h-full object-contain" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Sizes Available */}
              <div>
                <label className="block text-[13px] font-medium text-neutral-700 mb-1.5">
                  Available Footwear Sizes
                </label>
                <div className="flex flex-wrap gap-2">
                  {ALL_SIZES.map((sz) => {
                    const isChecked = formData.availableSizes.includes(sz);
                    return (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => toggleSize(sz)}
                        className={`h-9 px-3.5 rounded-full text-[13px] font-medium transition-all cursor-pointer ${
                          isChecked
                            ? 'bg-[#111111] text-white'
                            : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                        }`}
                      >
                        {sz}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-[13px] font-medium text-neutral-700 mb-1.5">
                  Product Description
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Engineered for maximum kinetic comfort..."
                  className="w-full p-3.5 rounded-[12px] border border-neutral-200 text-[13px] outline-none focus:border-[#111111]"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-3 border-t border-neutral-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-full border border-neutral-200 text-[13px] font-medium text-neutral-600 hover:text-black cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-full bg-[#111111] hover:bg-black text-white text-[13px] font-medium transition-all shadow-sm active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {saving ? 'Saving...' : modalMode === 'create' ? 'Publish Drop' : 'Update Drop'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminShell>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-neutral-500">Loading products...</div>}>
      <ProductsContent />
    </Suspense>
  );
}
