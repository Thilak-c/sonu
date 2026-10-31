'use client';

import React, { useState, useEffect, useMemo } from 'react';
import AdminShell from '@/components/AdminShell';
import {
  Sparkles,
  Flame,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Search,
  Check,
  X,
  ExternalLink,
  Layers,
  Save,
  Loader2,
  AlertCircle,
  Eye,
} from 'lucide-react';

export default function EditContentPage() {
  const [activeTab, setActiveTab] = useState('home');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // All catalog products from API
  const [allProducts, setAllProducts] = useState([]);

  // Curated lists (arrays of slugs/ids, max 5 each)
  const [featuredIds, setFeaturedIds] = useState([]);
  const [freshDropIds, setFreshDropIds] = useState([]);

  // Product picker modal state
  const [pickerModal, setPickerModal] = useState({
    isOpen: false,
    targetSection: null, // 'featured' | 'freshDrops'
    searchQuery: '',
  });

  // Load products and current homepage settings
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);

        const [pData, sData] = await Promise.all([
          fetch('/api/products').then((r) => r.json()),
          fetch('/api/settings').then((r) => r.json()),
        ]);

        if (pData.success && Array.isArray(pData.products)) {
          setAllProducts(pData.products);
        }

        if (sData.success && sData.homepage) {
          const hp = sData.homepage;
          // Initial featured IDs (use saved array if exists and non-empty, otherwise fallback)
          const initFeatured = Array.isArray(hp.featuredProductIds) && hp.featuredProductIds.length > 0
            ? hp.featuredProductIds
            : (pData.products || []).filter((p) => p.featured === true).map((p) => p.slug || p.id).slice(0, 5);

          // Initial fresh drop IDs (use saved array if exists and non-empty, otherwise fallback)
          const initFresh = Array.isArray(hp.freshDropProductIds) && hp.freshDropProductIds.length > 0
            ? hp.freshDropProductIds
            : (pData.products || []).map((p) => p.slug || p.id).slice(0, 5);

          setFeaturedIds(initFeatured.slice(0, 5));
          setFreshDropIds(initFresh.slice(0, 5));
        }
      } catch (err) {
        console.error('Failed to load curation data:', err);
        setErrorMsg('Failed to load store data. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Map IDs to actual product objects
  const getProduct = (id) =>
    allProducts.find((p) => p.slug === id || p.id === id || String(p._id) === id);

  const curatedFeatured = useMemo(
    () => featuredIds.map(getProduct).filter(Boolean),
    [featuredIds, allProducts]
  );

  const curatedFreshDrops = useMemo(
    () => freshDropIds.map(getProduct).filter(Boolean),
    [freshDropIds, allProducts]
  );

  // Reordering helpers
  const moveItem = (section, index, direction) => {
    const list = section === 'featured' ? [...featuredIds] : [...freshDropIds];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= list.length) return;

    const temp = list[index];
    list[index] = list[targetIdx];
    list[targetIdx] = temp;

    if (section === 'featured') setFeaturedIds(list);
    else setFreshDropIds(list);
  };

  const removeItem = (section, id) => {
    if (section === 'featured') {
      setFeaturedIds((prev) => prev.filter((item) => item !== id));
    } else {
      setFreshDropIds((prev) => prev.filter((item) => item !== id));
    }
  };

  const addItem = (section, id) => {
    if (section === 'featured') {
      if (featuredIds.length >= 5 || featuredIds.includes(id)) return;
      setFeaturedIds((prev) => [...prev, id]);
    } else {
      if (freshDropIds.length >= 5 || freshDropIds.includes(id)) return;
      setFreshDropIds((prev) => [...prev, id]);
    }
  };

  // Save changes
  const handleSave = async () => {
    try {
      setSaving(true);
      setErrorMsg('');

      // 1. Fetch current settings to preserve other homepage fields
      const currentRes = await fetch('/api/settings');
      const currentData = await currentRes.json();
      const currentHp = currentData.homepage || {};

      const payload = {
        homepage: {
          ...currentHp,
          featuredProductIds: featuredIds.slice(0, 5),
          freshDropProductIds: freshDropIds.slice(0, 5),
        },
      };

      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const resJson = await res.json();
      if (!res.ok || !resJson.success) {
        throw new Error(resJson.error || 'Failed to save settings');
      }

      // Also sync featured: true flag in products collection for the 5 featured items
      if (featuredIds.length > 0) {
        const allSlugs = allProducts.map((p) => p.slug || p.id).filter(Boolean);
        await fetch('/api/products', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slugs: allSlugs, featured: false }),
        });
        await fetch('/api/products', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slugs: featuredIds, featured: true }),
        });
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Save failed:', err);
      setErrorMsg(err.message || 'Error saving curation changes.');
    } finally {
      setSaving(false);
    }
  };

  // Filtered available products for modal picker
  const pickerAvailableProducts = useMemo(() => {
    const activeList = pickerModal.targetSection === 'featured' ? featuredIds : freshDropIds;
    const query = (pickerModal.searchQuery || '').toLowerCase().trim();

    return allProducts
      .filter((p) => {
        const id = p.slug || p.id;
        if (activeList.includes(id)) return false; // already selected
        if (!query) return true;
        const name = (p.name || '').toLowerCase();
        const brand = (p.brand || '').toLowerCase();
        const cat = (p.category || '').toLowerCase();
        return name.includes(query) || brand.includes(query) || cat.includes(query);
      })
      .slice(0, 20);
  }, [allProducts, pickerModal, featuredIds, freshDropIds]);

  return (
    <AdminShell>
      <div className="flex-1 bg-[#f8f9fa] min-h-screen pb-24 font-['Helvetica_Now_Text',sans-serif]">
        {/* Top Header */}
        <div className="bg-white border-b border-neutral-200 sticky top-0 z-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-8 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold tracking-wider uppercase text-neutral-500">
                  Storefront Content
                </span>
              </div>
              <h1
                className="text-[22px] sm:text-[26px] font-bold text-[#111111] tracking-tight font-['Helvetica_Now_Text_Medium',sans-serif]"
                style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
              >
                Edit & Curate Sections
              </h1>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              {saveSuccess && (
                <span className="text-[13px] font-medium text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full flex items-center gap-1.5 animate-in fade-in">
                  <Check className="w-3.5 h-3.5" />
                  Saved Live!
                </span>
              )}

              <button
                type="button"
                onClick={handleSave}
                disabled={saving || loading}
                className="w-full sm:w-auto bg-[#111111] hover:bg-black text-white px-6 py-2.5 rounded-xl text-[14px] font-medium flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="max-w-7xl mx-auto px-4 sm:px-8 flex items-center gap-2 border-t border-neutral-100 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setActiveTab('home')}
              className={`py-3 px-4 text-[14px] font-medium border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'home'
                  ? 'border-[#111111] text-[#111111]'
                  : 'border-transparent text-neutral-500 hover:text-neutral-900'
              }`}
            >
              <Layers className="w-4 h-4" />
              Home Page
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6 sm:py-8">
          {errorMsg && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-[14px] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {errorMsg}
            </div>
          )}

          {loading ? (
            <div className="py-24 flex flex-col items-center justify-center text-neutral-400 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-[#111111]" />
              <p className="text-[14px]">Loading catalog and curation settings...</p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* SECTION 1: FEATURED CAROUSEL */}
              <div className="bg-white rounded-2xl border border-neutral-200 p-5 sm:p-7 shadow-xs">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-5 border-b border-neutral-100 gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <h2
                        className="text-[18px] sm:text-[20px] font-bold text-[#111111] font-['Helvetica_Now_Text_Medium',sans-serif]"
                        style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
                      >
                        Featured Section
                      </h2>
                    </div>
                    <p className="text-[13px] text-neutral-500 mt-1">
                      Spotlighted prominently right below the hero banner. Exactly up to 5 shoes.
                    </p>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                    <span className="text-[12px] font-semibold px-2.5 py-1 rounded-full bg-neutral-100 text-neutral-700">
                      {featuredIds.length} / 5 Selected
                    </span>

                    <button
                      type="button"
                      disabled={featuredIds.length >= 5}
                      onClick={() =>
                        setPickerModal({
                          isOpen: true,
                          targetSection: 'featured',
                          searchQuery: '',
                        })
                      }
                      className="bg-[#111111] hover:bg-black disabled:opacity-40 text-white px-3.5 py-1.5 rounded-lg text-[13px] font-medium flex items-center gap-1.5 transition-all cursor-pointer disabled:cursor-not-allowed"
                    >
                      <Plus className="w-4 h-4" />
                      Add Product
                    </button>
                  </div>
                </div>

                {/* Product List */}
                <div className="mt-5 space-y-2.5">
                  {curatedFeatured.length === 0 ? (
                    <div className="py-12 border-2 border-dashed border-neutral-200 rounded-xl text-center">
                      <p className="text-[14px] text-neutral-500">No products selected for Featured.</p>
                      <button
                        type="button"
                        onClick={() =>
                          setPickerModal({
                            isOpen: true,
                            targetSection: 'featured',
                            searchQuery: '',
                          })
                        }
                        className="mt-3 text-[13px] font-medium text-[#111111] underline hover:text-neutral-700 cursor-pointer"
                      >
                        + Choose products from catalog
                      </button>
                    </div>
                  ) : (
                    curatedFeatured.map((p, idx) => (
                      <div
                        key={p.slug || p.id}
                        className="flex items-center justify-between p-3.5 bg-neutral-50 hover:bg-neutral-100/70 rounded-xl border border-neutral-200/70 transition-colors"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <span className="w-6 h-6 rounded-full bg-white border border-neutral-200 text-neutral-600 font-bold text-[11px] flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>

                          <div className="w-12 h-12 bg-white rounded-lg border border-neutral-200 overflow-hidden shrink-0 flex items-center justify-center">
                            <img
                              src={p.image || p.mainImage || '/placeholder.png'}
                              alt={p.name}
                              className="w-full h-full object-contain p-1"
                            />
                          </div>

                          <div className="min-w-0">
                            <h3 className="text-[14px] sm:text-[15px] font-bold text-[#111111] truncate">
                              {p.name}
                            </h3>
                            <p className="text-[12px] text-neutral-500 truncate">
                              {p.brand || 'Sonu Shoe'} · {p.category || 'Shoe'} ·{' '}
                              <span className="font-semibold text-neutral-800">{p.price}</span>
                            </p>
                          </div>
                        </div>

                        {/* Controls */}
                        <div className="flex items-center gap-1 shrink-0 ml-2">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => moveItem('featured', idx, 'up')}
                            className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-900 hover:bg-white disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                            title="Move Up"
                          >
                            <ArrowUp className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === curatedFeatured.length - 1}
                            onClick={() => moveItem('featured', idx, 'down')}
                            className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-900 hover:bg-white disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                            title="Move Down"
                          >
                            <ArrowDown className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeItem('featured', p.slug || p.id)}
                            className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 cursor-pointer transition-colors"
                            title="Remove"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* SECTION 2: FRESH DROPS CAROUSEL */}
              <div className="bg-white rounded-2xl border border-neutral-200 p-5 sm:p-7 shadow-xs">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-5 border-b border-neutral-100 gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                        <Flame className="w-4 h-4" />
                      </div>
                      <h2
                        className="text-[18px] sm:text-[20px] font-bold text-[#111111] font-['Helvetica_Now_Text_Medium',sans-serif]"
                        style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
                      >
                        Fresh Drops Section
                      </h2>
                    </div>
                    <p className="text-[13px] text-neutral-500 mt-1">
                      New drop showcase carousel. Exactly up to 5 shoes in the order you want them displayed.
                    </p>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                    <span className="text-[12px] font-semibold px-2.5 py-1 rounded-full bg-neutral-100 text-neutral-700">
                      {freshDropIds.length} / 5 Selected
                    </span>

                    <button
                      type="button"
                      disabled={freshDropIds.length >= 5}
                      onClick={() =>
                        setPickerModal({
                          isOpen: true,
                          targetSection: 'freshDrops',
                          searchQuery: '',
                        })
                      }
                      className="bg-[#111111] hover:bg-black disabled:opacity-40 text-white px-3.5 py-1.5 rounded-lg text-[13px] font-medium flex items-center gap-1.5 transition-all cursor-pointer disabled:cursor-not-allowed"
                    >
                      <Plus className="w-4 h-4" />
                      Add Product
                    </button>
                  </div>
                </div>

                {/* Product List */}
                <div className="mt-5 space-y-2.5">
                  {curatedFreshDrops.length === 0 ? (
                    <div className="py-12 border-2 border-dashed border-neutral-200 rounded-xl text-center">
                      <p className="text-[14px] text-neutral-500">No products selected for Fresh Drops.</p>
                      <button
                        type="button"
                        onClick={() =>
                          setPickerModal({
                            isOpen: true,
                            targetSection: 'freshDrops',
                            searchQuery: '',
                          })
                        }
                        className="mt-3 text-[13px] font-medium text-[#111111] underline hover:text-neutral-700 cursor-pointer"
                      >
                        + Choose products from catalog
                      </button>
                    </div>
                  ) : (
                    curatedFreshDrops.map((p, idx) => (
                      <div
                        key={p.slug || p.id}
                        className="flex items-center justify-between p-3.5 bg-neutral-50 hover:bg-neutral-100/70 rounded-xl border border-neutral-200/70 transition-colors"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <span className="w-6 h-6 rounded-full bg-white border border-neutral-200 text-neutral-600 font-bold text-[11px] flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>

                          <div className="w-12 h-12 bg-white rounded-lg border border-neutral-200 overflow-hidden shrink-0 flex items-center justify-center">
                            <img
                              src={p.image || p.mainImage || '/placeholder.png'}
                              alt={p.name}
                              className="w-full h-full object-contain p-1"
                            />
                          </div>

                          <div className="min-w-0">
                            <h3 className="text-[14px] sm:text-[15px] font-bold text-[#111111] truncate">
                              {p.name}
                            </h3>
                            <p className="text-[12px] text-neutral-500 truncate">
                              {p.brand || 'Sonu Shoe'} · {p.category || 'Shoe'} ·{' '}
                              <span className="font-semibold text-neutral-800">{p.price}</span>
                            </p>
                          </div>
                        </div>

                        {/* Controls */}
                        <div className="flex items-center gap-1 shrink-0 ml-2">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => moveItem('freshDrops', idx, 'up')}
                            className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-900 hover:bg-white disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                            title="Move Up"
                          >
                            <ArrowUp className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === curatedFreshDrops.length - 1}
                            onClick={() => moveItem('freshDrops', idx, 'down')}
                            className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-900 hover:bg-white disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                            title="Move Down"
                          >
                            <ArrowDown className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeItem('freshDrops', p.slug || p.id)}
                            className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 cursor-pointer transition-colors"
                            title="Remove"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* MODAL: PRODUCT PICKER */}
        {pickerModal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden flex flex-col max-h-[85vh]">
              {/* Header */}
              <div className="px-5 py-4 border-b border-neutral-200 flex items-center justify-between">
                <div>
                  <h3 className="text-[16px] font-bold text-[#111111]">
                    Add Product to{' '}
                    {pickerModal.targetSection === 'featured' ? 'Featured' : 'Fresh Drops'}
                  </h3>
                  <p className="text-[12px] text-neutral-500">Select any shoe from your store catalog</p>
                </div>
                <button
                  type="button"
                  onClick={() => setPickerModal({ isOpen: false, targetSection: null, searchQuery: '' })}
                  className="p-1 text-neutral-400 hover:text-neutral-700 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Search Bar */}
              <div className="p-3 border-b border-neutral-100 bg-neutral-50">
                <div className="relative">
                  <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={pickerModal.searchQuery}
                    onChange={(e) =>
                      setPickerModal((prev) => ({ ...prev, searchQuery: e.target.value }))
                    }
                    placeholder="Search by shoe name, brand, or category..."
                    className="w-full bg-white border border-neutral-200 rounded-xl pl-9 pr-4 py-2 text-[13px] outline-none focus:border-[#111111]"
                    autoFocus
                  />
                </div>
              </div>

              {/* Products List */}
              <div className="flex-1 overflow-y-auto p-3 space-y-1.5 divide-y divide-neutral-100">
                {pickerAvailableProducts.length === 0 ? (
                  <div className="py-12 text-center text-neutral-400 text-[13px]">
                    No matching products available to add.
                  </div>
                ) : (
                  pickerAvailableProducts.map((p) => {
                    const id = p.slug || p.id;
                    return (
                      <div
                        key={id}
                        onClick={() => {
                          addItem(pickerModal.targetSection, id);
                          setPickerModal((prev) => ({ ...prev, isOpen: false }));
                        }}
                        className="flex items-center justify-between p-2.5 hover:bg-neutral-50 rounded-xl cursor-pointer transition-colors group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-11 h-11 bg-white rounded-lg border border-neutral-200 overflow-hidden shrink-0 flex items-center justify-center">
                            <img
                              src={p.image || p.mainImage || '/placeholder.png'}
                              alt={p.name}
                              className="w-full h-full object-contain p-1"
                            />
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-[13px] font-bold text-[#111111] truncate group-hover:text-black">
                              {p.name}
                            </h4>
                            <p className="text-[11px] text-neutral-500 truncate">
                              {p.brand || 'Sonu Shoe'} · {p.price}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          className="px-3 py-1 bg-neutral-100 group-hover:bg-[#111111] group-hover:text-white rounded-lg text-[12px] font-medium text-neutral-700 transition-colors"
                        >
                          Select
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}

