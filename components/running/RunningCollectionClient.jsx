'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Heart,
  SlidersHorizontal,
  X,
  Check,
  ChevronDown,
  RotateCcw,
} from 'lucide-react';

/**
 * Group linked product variants into a single parent shoe entity.
 * If a shoe has two colors and both products are linked (via colorways,
 * relatedProducts, or same model name + gender), only one product card is shown,
 * with the linked colors displayed as interactive color dots below.
 */
function groupLinkedProducts(products = []) {
  const groups = [];
  const visited = new Set();

  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    const pid = p.slug || p.id || String(p._id);

    if (visited.has(pid)) continue;

    const cluster = [p];
    visited.add(pid);

    const getProductLinks = (item) => {
      const links = new Set();
      const addArr = (arr) => {
        if (Array.isArray(arr)) {
          arr.forEach((val) => {
            if (val && typeof val === 'string') links.add(val.trim());
            else if (val && val.slug) links.add(val.slug);
            else if (val && val.id) links.add(val.id);
          });
        }
      };
      addArr(item.linkedColorways);
      addArr(item.colorways);
      addArr(item.relatedProducts);
      addArr(item.accessories);
      return links;
    };

    const pLinks = getProductLinks(p);

    for (let j = i + 1; j < products.length; j++) {
      const other = products[j];
      const otherId = other.slug || other.id || String(other._id);
      if (visited.has(otherId)) continue;

      const otherLinks = getProductLinks(other);
      const pIdentifiers = [p.slug, p.id, p.itemId, String(p._id)].filter(Boolean);
      const otherIdentifiers = [other.slug, other.id, other.itemId, String(other._id)].filter(Boolean);

      const isExplicitlyLinked =
        otherIdentifiers.some((id) => pLinks.has(id)) ||
        pIdentifiers.some((id) => otherLinks.has(id));

      const isSameModelDifferentColor =
        Boolean(p.name && other.name) &&
        p.name.trim().toLowerCase() === other.name.trim().toLowerCase() &&
        (p.gender || '').toLowerCase() === (other.gender || '').toLowerCase() &&
        (p.colorHex !== other.colorHex || p.color !== other.color || p.slug !== other.slug);

      if (isExplicitlyLinked || isSameModelDifferentColor) {
        cluster.push(other);
        visited.add(otherId);
        otherLinks.forEach((l) => pLinks.add(l));
      }
    }

    if (cluster.length > 1) {
      // Linked multi-color shoe
      const variants = cluster.map((item) => {
        const numPrice = Number(item.priceNumber || (typeof item.price === 'number' ? item.price : 0));
        const origPrice = item.originalPrice ? Number(item.originalPrice) : null;
        const disc =
          item.discountPercent ||
          (origPrice && origPrice > numPrice
            ? Math.round(((origPrice - numPrice) / origPrice) * 100)
            : 0);

        return {
          id: item.slug || item.id,
          slug: item.slug || item.id,
          name: item.name,
          category: item.category,
          gender: item.gender,
          price: item.price,
          priceNumber: numPrice,
          originalPrice: origPrice,
          discountPercent: disc,
          image: item.image || item.mainImage,
          alt: item.alt || item.name,
          color: item.color || 'Color',
          colorHex: item.colorHex || '#111111',
          border: (item.colorHex || '').toLowerCase() === '#ffffff',
        };
      });

      const colorDots = variants.map((v, idx) => ({
        index: idx,
        name: v.color,
        hex: v.colorHex,
        border: v.border,
      }));

      const primary = cluster[0];
      groups.push({
        ...primary,
        id: primary.slug || primary.id,
        isGrouped: true,
        variants,
        colorDots,
      });
    } else {
      // Single shoe without linked siblings
      let dots = [];
      if (Array.isArray(p.colorDots) && p.colorDots.length > 0) {
        dots = p.colorDots.map((d, idx) => ({ ...d, index: idx }));
      } else if (p.colorHex) {
        dots = [{ index: 0, name: p.color || 'Tone', hex: p.colorHex, border: p.colorHex.toLowerCase() === '#ffffff' }];
      } else {
        dots = [
          { index: 0, name: 'White', hex: '#ffffff', border: true },
          { index: 1, name: 'Black', hex: '#111111', border: false },
          { index: 2, name: 'Grey', hex: '#6f7276', border: false },
        ];
      }

      const numPrice = Number(p.priceNumber || (typeof p.price === 'number' ? p.price : 0));
      const origPrice = p.originalPrice ? Number(p.originalPrice) : null;
      const disc =
        p.discountPercent ||
        (origPrice && origPrice > numPrice
          ? Math.round(((origPrice - numPrice) / origPrice) * 100)
          : 0);

      const singleVariant = {
        id: p.slug || p.id,
        slug: p.slug || p.id,
        name: p.name,
        category: p.category,
        gender: p.gender,
        price: p.price,
        priceNumber: numPrice,
        originalPrice: origPrice,
        discountPercent: disc,
        image: p.image || p.mainImage,
        alt: p.alt || p.name,
        color: p.color || 'Tone',
        colorHex: p.colorHex || '#111111',
        border: (p.colorHex || '').toLowerCase() === '#ffffff',
      };

      groups.push({
        ...p,
        id: p.slug || p.id,
        isGrouped: false,
        variants: [singleVariant],
        colorDots: dots,
      });
    }
  }

  return groups;
}

/**
 * Individual Product Card Component
 * Handles interactive color swapping between linked color variants
 */
function ShoeCard({ shoe, isWishlisted, onToggleWishlist, selectedColorFilter }) {
  const variants = shoe.variants && shoe.variants.length > 0 ? shoe.variants : [shoe];
  const hasMultipleColors = variants.length > 1;

  const [activeIdx, setActiveIdx] = useState(0);

  // Automatically switch to the matching colorway variant if a color filter is active
  useEffect(() => {
    if (selectedColorFilter && selectedColorFilter !== 'All') {
      const target = selectedColorFilter.toLowerCase();
      const matchIdx = variants.findIndex((v) => {
        const c = (v.color || '').toLowerCase();
        return c.includes(target);
      });
      if (matchIdx !== -1) {
        setActiveIdx(matchIdx);
      }
    }
  }, [selectedColorFilter, variants]);

  const activeVariant = variants[activeIdx] || variants[0] || shoe;
  const pid = activeVariant.slug || activeVariant.id;
  const sellingPrice = activeVariant.priceNumber || 0;
  const originalPrice = activeVariant.originalPrice || null;
  const discountPercent =
    activeVariant.discountPercent ||
    (originalPrice && originalPrice > sellingPrice
      ? Math.round(((originalPrice - sellingPrice) / originalPrice) * 100)
      : 0);

  // When shoe has linked colors, render the linked colors as dots
  const dots = hasMultipleColors
    ? variants.map((v, i) => ({
      index: i,
      name: v.color || `Color ${i + 1}`,
      hex: v.colorHex || (i === 0 ? '#ffffff' : '#111111'),
      border: (v.colorHex || '').toLowerCase() === '#ffffff' || v.border,
    }))
    : shoe.colorDots || [
      { index: 0, name: shoe.color || 'White', hex: shoe.colorHex || '#ffffff', border: true },
    ];

  return (
    <div className="group flex flex-col text-left">
      {/* Image Square Box with Heart Overlay */}
      <div className="relative aspect-square w-full   flex items-center justify-center overflow-hidden rounded-[4px] sm:rounded-[6px]">
        <Link
          href={`/product/${pid}`}
          className="w-full h-full flex items-center justify-center cursor-pointer"
        >
          {activeVariant.image ? (
            <img
              src={activeVariant.image}
              alt={activeVariant.alt || activeVariant.name}
              className="w-full h-auto max-h-[85%] object-contain transform group-hover:scale-105 transition-all duration-300"
              loading="lazy"
            />
          ) : (
            <div className="text-neutral-400 text-xs font-mono">No Image</div>
          )}
        </Link>

        {/* Wishlist Button (Circular, top right corner) */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleWishlist(activeVariant);
          }}
          title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
          className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3 w-8 h-8 rounded-full bg-white/95 hover:bg-white flex items-center justify-center shadow-xs text-[#111111] transition-transform active:scale-90 cursor-pointer z-10"
        >
          <Heart
            className={`w-4 h-4 transition-colors ${isWishlisted ? 'fill-[#111111] text-[#111111]' : 'text-[#111111] stroke-[2]'
              }`}
          />
        </button>
      </div>

      {/* Product Details Content */}
      <div className="pt-2.5 sm:pt-3 flex flex-col flex-1">
        {/* Title */}
        <Link href={`/product/${pid}`} className="cursor-pointer">
          <h3
            className="text-[14.5px] sm:text-[16px] font-semibold text-[#111111] leading-snug line-clamp-1 group-hover:text-neutral-700 transition-colors"
            style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
          >
            {activeVariant.name}
          </h3>
        </Link>

        {/* Subtitle / Category (e.g. Men's Road-Running Shoes) */}
        <p className="text-[13px] sm:text-[14.5px] text-[#707072] leading-tight mt-0.5 line-clamp-1">
          {activeVariant.category ||
            (activeVariant.gender === 'women'
              ? "Women's Road-Running Shoes"
              : "Men's Road-Running Shoes")}
        </p>

        {/* Color Swatch Dots: Showing two (or more) linked colors */}
        <div className="flex items-center gap-1.5 sm:gap-2 mt-2 mb-1.5 min-h-[22px]">
          {dots.map((dot, idx) => {
            const isSelected = hasMultipleColors && activeIdx === dot.index;
            return (
              <button
                key={idx}
                type="button"
                onMouseEnter={() => {
                  if (hasMultipleColors) setActiveIdx(dot.index);
                }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (hasMultipleColors) setActiveIdx(dot.index);
                }}
                title={dot.name}
                className={`relative flex items-center justify-center rounded-full transition-all cursor-pointer ${isSelected ? 'scale-110' : 'hover:scale-105'
                  }`}
              >
                <span
                  className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full inline-block shadow-2xs transition-all ${dot.border || dot.hex?.toLowerCase() === '#ffffff'
                      ? 'border border-[#d4d4d4]'
                      : ''
                    } ${isSelected ? 'ring-1.5 ring-black ring-offset-1.5' : ''
                    }`}
                  style={{ backgroundColor: dot.hex }}
                />
              </button>
            );
          })}
        </div>

        {/* Pricing Block with Strikethrough & Green Discount */}
        <div className="mt-1 flex items-baseline gap-2 flex-wrap">
          <span
            className="text-[15px] sm:text-[16.5px] font-bold text-[#111111]"
            style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
          >
            {activeVariant.price}
          </span>
          {originalPrice && originalPrice > sellingPrice && (
            <span className="text-[13px] sm:text-[14px] text-[#707072] line-through font-normal">
              ₹{originalPrice.toLocaleString('en-IN')}
            </span>
          )}
        </div>

        {/* Green Discount Percent Tag */}
        {discountPercent > 0 && (
          <p className="text-[12.5px] sm:text-[13.5px] font-semibold text-[#007a3d] mt-0.5">
            {discountPercent}% off
          </p>
        )}
      </div>
    </div>
  );
}

export default function RunningCollectionClient({ initialProducts = [] }) {
  const [selectedGender, setSelectedGender] = useState('All'); // 'All' | 'Men' | 'Women' | 'Kids'
  const [selectedColor, setSelectedColor] = useState('All');
  const [selectedSort, setSelectedSort] = useState('featured'); // 'featured' | 'newest' | 'price_asc' | 'price_desc' | 'discount'
  const [priceFilter, setPriceFilter] = useState('all'); // 'all' | 'under_10k' | '10k_15k' | 'above_15k'
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [wishlistMap, setWishlistMap] = useState({});

  // Sync wishlist from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem('sonu_wishlist');
      if (raw) {
        const parsed = JSON.parse(raw);
        setWishlistMap(parsed && typeof parsed === 'object' ? parsed : {});
      }
    } catch (e) {
      console.warn('Failed to parse wishlist', e);
    }

    const handleWishlistUpdate = () => {
      try {
        const raw = localStorage.getItem('sonu_wishlist');
        if (raw) {
          const parsed = JSON.parse(raw);
          setWishlistMap(parsed && typeof parsed === 'object' ? parsed : {});
        }
      } catch (e) {
        // ignore
      }
    };

    window.addEventListener('wishlist-updated', handleWishlistUpdate);
    return () => window.removeEventListener('wishlist-updated', handleWishlistUpdate);
  }, []);

  const toggleWishlist = (product) => {
    const pid = product.slug || product.id;
    const next = { ...wishlistMap };
    if (next[pid]) {
      delete next[pid];
    } else {
      next[pid] = {
        id: pid,
        name: product.name,
        price: product.price,
        priceNumber: product.priceNumber,
        image: product.image,
        category: product.category,
      };
    }
    setWishlistMap(next);
    localStorage.setItem('sonu_wishlist', JSON.stringify(next));
    window.dispatchEvent(new Event('wishlist-updated'));
  };

  // Color Filter definitions
  const FILTER_COLORS = [
    { name: 'Black', hex: '#111111' },
    { name: 'White', hex: '#ffffff', border: true },
    { name: 'Grey', hex: '#6f7276' },
    { name: 'Green', hex: '#00c853' },
    { name: 'Blue', hex: '#1e3a8a' },
    { name: 'Red', hex: '#dc2626' },
    { name: 'Purple', hex: '#7c3aed' },
  ];

  // 1. Group initialProducts so linked colorways merge into a single product card
  const groupedProducts = useMemo(() => {
    return groupLinkedProducts(initialProducts);
  }, [initialProducts]);

  // 2. Filter & Sort Logic on the grouped products
  const filteredProducts = useMemo(() => {
    return groupedProducts
      .filter((shoe) => {
        const variants = shoe.variants || [shoe];

        // 1. Gender Filter
        if (selectedGender !== 'All') {
          const target = selectedGender.toLowerCase();
          const matchesGender = variants.some((v) => {
            const g = (v.gender || '').toLowerCase();
            const cat = (v.category || '').toLowerCase();
            const name = (v.name || '').toLowerCase();

            if (target === 'men') {
              return g === 'men' || g === 'unisex' || cat.includes("men's") || cat.includes('men ') || name.includes('men');
            }
            if (target === 'women') {
              return g === 'women' || g === 'unisex' || cat.includes("women's") || cat.includes('women ') || name.includes('women');
            }
            if (target === 'kids') {
              return g === 'kids' || cat.includes('kids') || name.includes('kids');
            }
            return false;
          });

          if (!matchesGender) return false;
        }

        // 2. Color Filter
        if (selectedColor !== 'All') {
          const targetColor = selectedColor.toLowerCase();
          const matchesColor = variants.some((v) => {
            const shoeColor = (v.color || '').toLowerCase();
            const dotsMatch = v.colorDots && v.colorDots.some((cd) => cd.name.toLowerCase().includes(targetColor));
            return shoeColor.includes(targetColor) || dotsMatch;
          });

          if (!matchesColor) return false;
        }

        // 3. Price Filter
        if (priceFilter !== 'all') {
          const matchesPrice = variants.some((v) => {
            const price = Number(v.priceNumber || 0);
            if (priceFilter === 'under_10k') return price < 10000;
            if (priceFilter === '10k_15k') return price >= 10000 && price <= 15000;
            if (priceFilter === 'above_15k') return price > 15000;
            return true;
          });

          if (!matchesPrice) return false;
        }

        return true;
      })
      .sort((a, b) => {
        const aPrimary = a.variants?.[0] || a;
        const bPrimary = b.variants?.[0] || b;

        if (selectedSort === 'price_asc') {
          return Number(aPrimary.priceNumber || 0) - Number(bPrimary.priceNumber || 0);
        }
        if (selectedSort === 'price_desc') {
          return Number(bPrimary.priceNumber || 0) - Number(aPrimary.priceNumber || 0);
        }
        if (selectedSort === 'discount') {
          const discA = aPrimary.discountPercent || 0;
          const discB = bPrimary.discountPercent || 0;
          return discB - discA;
        }
        if (selectedSort === 'newest') {
          return new Date(bPrimary.createdAt || 0) - new Date(aPrimary.createdAt || 0);
        }
        return 0;
      });
  }, [groupedProducts, selectedGender, selectedColor, priceFilter, selectedSort]);

  const activeFiltersCount =
    (selectedGender !== 'All' ? 1 : 0) +
    (selectedColor !== 'All' ? 1 : 0) +
    (priceFilter !== 'all' ? 1 : 0) +
    (selectedSort !== 'featured' ? 1 : 0);

  const resetAllFilters = () => {
    setSelectedGender('All');
    setSelectedColor('All');
    setPriceFilter('all');
    setSelectedSort('featured');
  };

  return (
    <div className="w-full min-h-screen bg-white select-none font-['Helvetica_Now_Text',sans-serif]">
      <div className="w-full max-w-[1440px] mx-auto px-2 sm:px-8 lg:px-12">
        {/* ================= 1. PAGE HEADER ================= */}
        <div className="pt-4 sm:pt-6">
          <h1
            className="text-[24px] sm:text-[30px] font-bold text-[#111111] tracking-tight"
            style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
          >
            Sonu Shoe-Running
          </h1>

          {/* Subnavigation: Men | Women | Kids matching user screenshot */}
          <div className="flex items-center gap-7 sm:gap-9 pt-3 pb-2 text-[15px] sm:text-[16px] font-medium text-[#111111]">
            {['All', 'Men', 'Women', 'Kids'].map((g) => {
              const isSelected = selectedGender === g;
              return (
                <button
                  key={g}
                  type="button"
                  onClick={() => setSelectedGender(g)}
                  className={`relative py-1 transition-colors cursor-pointer ${isSelected
                      ? 'text-[#111111] font-semibold'
                      : 'text-[#707072] hover:text-[#111111]'
                    }`}
                  style={{ fontFamily: isSelected ? "'Helvetica Now Text Medium', sans-serif" : "'Helvetica Now Text', sans-serif" }}
                >
                  <span>{g === 'All' ? 'All' : g}</span>
                  {isSelected && (
                    <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#111111] rounded-full" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ================= 2. RESULTS COUNT & FILTER BAR ================= */}
        <div className="flex items-center justify-between py-3 sm:py-4 border-b border-[#e5e5e5] mb-5 sm:mb-6">
          <span className="text-[14.5px] sm:text-[15.5px] text-[#707072] font-normal">
            {filteredProducts.length} {filteredProducts.length === 1 ? 'Result' : 'Results'}
          </span>

          <div className="flex items-center gap-2.5">
            {/* Sort Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsSortOpen(!isSortOpen)}
                className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-neutral-200 hover:border-black text-[13.5px] font-medium text-[#111111] bg-white transition-colors cursor-pointer"
              >
                <span>
                  Sort By:{' '}
                  {selectedSort === 'featured'
                    ? 'Featured'
                    : selectedSort === 'price_asc'
                      ? 'Price: Low-High'
                      : selectedSort === 'price_desc'
                        ? 'Price: High-Low'
                        : selectedSort === 'discount'
                          ? 'Biggest Discount'
                          : 'Newest'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-neutral-500" />
              </button>

              {isSortOpen && (
                <div
                  className="absolute right-0 top-full mt-1.5 w-48 bg-white rounded-xl shadow-lg border border-neutral-200 py-1.5 z-30"
                  onMouseLeave={() => setIsSortOpen(false)}
                >
                  {[
                    { id: 'featured', label: 'Featured' },
                    { id: 'newest', label: 'Newest' },
                    { id: 'price_asc', label: 'Price: Low to High' },
                    { id: 'price_desc', label: 'Price: High to Low' },
                    { id: 'discount', label: 'Discount Percentage' },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setSelectedSort(opt.id);
                        setIsSortOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-[13px] hover:bg-neutral-50 flex items-center justify-between cursor-pointer ${selectedSort === opt.id ? 'font-semibold text-black' : 'text-neutral-700'
                        }`}
                    >
                      <span>{opt.label}</span>
                      {selectedSort === opt.id && <Check className="w-3.5 h-3.5" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Filter Pill Button */}
            <button
              type="button"
              onClick={() => setIsFilterDrawerOpen(true)}
              className="h-9 px-4.5 rounded-full border border-neutral-300 hover:border-black bg-white flex items-center gap-2 text-[13.5px] font-medium text-[#111111] transition-all cursor-pointer shadow-2xs"
            >
              <span>Filter</span>
              <SlidersHorizontal className="w-3.5 h-3.5 stroke-[2]" />
              {activeFiltersCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-[#111111] text-white text-[10px] font-bold flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* ================= 3. PRODUCT GRID ================= */}
        {filteredProducts.length === 0 ? (
          <div className="py-20 text-center space-y-3">
            <p className="text-[17px] font-medium text-[#111111]">No running shoes found</p>
            <p className="text-[13.5px] text-[#707072]">Try resetting filters to view all running shoes.</p>
            <button
              type="button"
              onClick={resetAllFilters}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#111111] text-white text-[13.5px] font-medium hover:bg-black transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Filters</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-2.5 gap-y-7 sm:gap-x-6 sm:gap-y-10 lg:grid-cols-3 xl:grid-cols-4 pb-20">
            {filteredProducts.map((shoe) => {
              const pid = shoe.slug || shoe.id;
              const isWishlisted = Boolean(wishlistMap[pid]);

              return (
                <ShoeCard
                  key={pid}
                  shoe={shoe}
                  isWishlisted={isWishlisted}
                  onToggleWishlist={toggleWishlist}
                  selectedColorFilter={selectedColor}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* ================= 4. SLIDE-OVER FILTER DRAWER ================= */}
      {isFilterDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-[2px] transition-opacity"
            onClick={() => setIsFilterDrawerOpen(false)}
          />

          {/* Drawer Content */}
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-250">
            {/* Drawer Header */}
            <div className="flex items-center justify-between p-5 border-b border-[#e5e5e5]">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-[#111111]" />
                <h3
                  className="text-[17px] font-bold text-[#111111]"
                  style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
                >
                  Filter & Sort
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsFilterDrawerOpen(false)}
                className="w-9 h-9 rounded-full hover:bg-neutral-100 flex items-center justify-center text-neutral-600 hover:text-black transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {/* Gender Section */}
              <div>
                <span
                  className="block text-[13.5px] font-bold text-[#111111] mb-2.5"
                  style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
                >
                  Gender / Category
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {['All', 'Men', 'Women', 'Kids'].map((g) => {
                    const isSelected = selectedGender === g;
                    return (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setSelectedGender(g)}
                        className={`h-10 px-4 rounded-lg border text-[13px] font-medium transition-all cursor-pointer text-center ${isSelected
                            ? 'border-black bg-black text-white'
                            : 'border-neutral-200 bg-white text-[#111111] hover:border-neutral-400'
                          }`}
                      >
                        {g === 'All' ? 'All Genders' : g}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Color Swatch Filters */}
              <div>
                <span
                  className="block text-[13.5px] font-bold text-[#111111] mb-2.5"
                  style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
                >
                  Color
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedColor('All')}
                    className={`h-9 px-3.5 rounded-full text-[12.5px] font-medium border transition-all cursor-pointer ${selectedColor === 'All'
                        ? 'border-black bg-black text-white'
                        : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400'
                      }`}
                  >
                    All Colors
                  </button>
                  {FILTER_COLORS.map((c) => {
                    const isSelected = selectedColor === c.name;
                    return (
                      <button
                        key={c.name}
                        type="button"
                        onClick={() => setSelectedColor(isSelected ? 'All' : c.name)}
                        className={`h-9 px-3.5 rounded-full flex items-center gap-2 border transition-all cursor-pointer ${isSelected
                            ? 'border-black ring-1 ring-black bg-neutral-50 font-medium'
                            : 'border-neutral-200 bg-white hover:border-neutral-400'
                          }`}
                      >
                        <span
                          className={`w-3.5 h-3.5 rounded-full shrink-0 ${c.border ? 'border border-neutral-300' : ''
                            }`}
                          style={{ backgroundColor: c.hex }}
                        />
                        <span className="text-[12.5px] text-[#111111]">{c.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Price Range */}
              <div>
                <span
                  className="block text-[13.5px] font-bold text-[#111111] mb-2.5"
                  style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
                >
                  Price Range
                </span>
                <div className="space-y-1.5">
                  {[
                    { id: 'all', label: 'All Prices' },
                    { id: 'under_10k', label: 'Under ₹10,000' },
                    { id: '10k_15k', label: '₹10,000 — ₹15,000' },
                    { id: 'above_15k', label: 'Above ₹15,000' },
                  ].map((p) => (
                    <label
                      key={p.id}
                      className="flex items-center gap-2.5 py-1.5 cursor-pointer text-[13.5px] text-neutral-800"
                    >
                      <input
                        type="radio"
                        name="priceFilter"
                        checked={priceFilter === p.id}
                        onChange={() => setPriceFilter(p.id)}
                        className="w-4 h-4 accent-black cursor-pointer"
                      />
                      <span>{p.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Sort By inside drawer for mobile */}
              <div>
                <span
                  className="block text-[13.5px] font-bold text-[#111111] mb-2.5"
                  style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
                >
                  Sort By
                </span>
                <div className="space-y-1.5">
                  {[
                    { id: 'featured', label: 'Featured' },
                    { id: 'newest', label: 'Newest Arrivals' },
                    { id: 'price_asc', label: 'Price: Low to High' },
                    { id: 'price_desc', label: 'Price: High to Low' },
                    { id: 'discount', label: 'Biggest Discount' },
                  ].map((s) => (
                    <label
                      key={s.id}
                      className="flex items-center gap-2.5 py-1.5 cursor-pointer text-[13.5px] text-neutral-800"
                    >
                      <input
                        type="radio"
                        name="drawerSort"
                        checked={selectedSort === s.id}
                        onChange={() => setSelectedSort(s.id)}
                        className="w-4 h-4 accent-black cursor-pointer"
                      />
                      <span>{s.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-[#e5e5e5] bg-white flex items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                onClick={resetAllFilters}
                className="h-11 px-5 rounded-full border border-neutral-300 hover:border-black text-[13.5px] font-medium text-neutral-700 hover:text-black transition-colors cursor-pointer"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => setIsFilterDrawerOpen(false)}
                className="flex-1 h-11 px-6 rounded-full bg-[#111111] hover:bg-black text-white text-[13.5px] font-medium transition-all shadow-sm cursor-pointer"
                style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
              >
                View {filteredProducts.length} Results
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
