'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { FRESH_DROPS } from '@/components/home/freshDropsData';
import { addToCart, getCartItems, removeFromCart, updateCartQuantity } from '@/components/cart/cartStore';

const CATALOG_SIZES = ['UK 3', 'UK 4', 'UK 5', 'UK 6', 'UK 7', 'UK 8', 'UK 9'];

export default function FavouritesClient() {
  const [wishlistMap, setWishlistMap] = useState({});
  const [isLoaded, setIsLoaded] = useState(false);
  const [addedItemKey, setAddedItemKey] = useState(null);

  // Cart state
  const [cartItems, setCartItems] = useState([]);
  const [cartCount, setCartCount] = useState(0);

  // Added to Bag Drawer state
  const [drawerItem, setDrawerItem] = useState(null);
  const [isDrawerMounted, setIsDrawerMounted] = useState(false);
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const drawerTimerRef = useRef(null);

  // Size Picker Modal state
  const [activeModalProduct, setActiveModalProduct] = useState(null);
  const [selectedSize, setSelectedSize] = useState('UK 8');
  const [isModalVisible, setIsModalVisible] = useState(false);

  // Size Guide modal state
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const [sizeGuideUnit, setSizeGuideUnit] = useState('cm');

  useEffect(() => {
    try {
      const raw = localStorage.getItem('sonu_wishlist');
      if (raw) {
        setWishlistMap(JSON.parse(raw));
      } else {
        // Seed initial 2 items so layout matches user mockup on initial visit
        const initialSeed = {
          [FRESH_DROPS[0].id]: true,
          [FRESH_DROPS[1].id]: true,
        };
        localStorage.setItem('sonu_wishlist', JSON.stringify(initialSeed));
        setWishlistMap(initialSeed);
      }
    } catch (e) {
      console.error('Failed to load wishlist', e);
    }
    setIsLoaded(true);

    const handleUpdate = () => {
      try {
        const updated = localStorage.getItem('sonu_wishlist');
        if (updated) setWishlistMap(JSON.parse(updated));
      } catch (e) {}
    };

    window.addEventListener('wishlist-updated', handleUpdate);
    return () => window.removeEventListener('wishlist-updated', handleUpdate);
  }, []);

  // Sync cart items & count
  useEffect(() => {
    const syncCart = () => {
      const items = getCartItems();
      setCartItems(items);
      const count = items.reduce((acc, it) => acc + (it.quantity || 1), 0);
      setCartCount(count);
    };

    syncCart();
    window.addEventListener('cart-updated', syncCart);
    return () => window.removeEventListener('cart-updated', syncCart);
  }, []);

  const closeDrawer = () => {
    setIsDrawerVisible(false);
    if (drawerTimerRef.current) clearTimeout(drawerTimerRef.current);
    drawerTimerRef.current = setTimeout(() => {
      setIsDrawerMounted(false);
      setDrawerItem(null);
    }, 400);
  };

  const removeFavourite = (id) => {
    setWishlistMap((prev) => {
      const next = { ...prev };
      delete next[id];
      try {
        localStorage.setItem('sonu_wishlist', JSON.stringify(next));
        window.dispatchEvent(new Event('wishlist-updated'));
      } catch (e) {}
      return next;
    });
  };

  const openSizeModal = (product) => {
    setActiveModalProduct(product);
    setSelectedSize('UK 8');
    setIsModalVisible(false);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setIsModalVisible(true);
      });
    });
  };

  const closeSizeModal = () => {
    setIsModalVisible(false);
    setTimeout(() => {
      setActiveModalProduct(null);
    }, 350);
  };

  const handleConfirmMoveToBag = () => {
    if (!activeModalProduct) return;

    const formattedPrice =
      activeModalProduct.price ||
      `₹${(activeModalProduct.priceNumber || 13995).toLocaleString('en-IN')}`;

    addToCart({
      id: activeModalProduct.id,
      name: activeModalProduct.name,
      category: activeModalProduct.category,
      price: formattedPrice,
      priceNumber: activeModalProduct.priceNumber || 13995,
      image: activeModalProduct.image,
      size: selectedSize,
      quantity: 1,
      color: activeModalProduct.colorways?.[0] || 'Standard',
    });

    const addedItem = {
      ...activeModalProduct,
      selectedSize,
      priceFormatted: formattedPrice,
    };

    closeSizeModal();

    // Open Added to Bag confirmation popup drawer with smooth animation
    setDrawerItem(addedItem);
    setIsDrawerMounted(true);
    setIsDrawerVisible(false);
    if (drawerTimerRef.current) clearTimeout(drawerTimerRef.current);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setIsDrawerVisible(true);
      });
    });
  };

  const favouritedProducts = FRESH_DROPS.filter(
    (p) => wishlistMap[p.id] || wishlistMap[p.slug]
  );
  const count = favouritedProducts.length;

  if (!isLoaded) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center font-['Helvetica_Now_Text',sans-serif]">
        <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-['Helvetica_Now_Text',sans-serif] text-[#111111] pb-24 pt-4 sm:pt-8">

      <div className="max-w-[1440px] mx-auto px-4 sm:px-8">
        {/* Header: Title and Item Count matching design */}
        <div>
          <h1
            className="text-[24px] sm:text-[28px] font-bold text-[#111111] tracking-tight leading-tight font-['Helvetica_Now_Text_Medium',sans-serif]"
            style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
          >
            Favourites
          </h1>
          <p className="text-[14px] sm:text-[15px] text-[#707072] mt-0.5 font-normal">
            {count} {count === 1 ? 'item' : 'items'}
          </p>
        </div>

        {/* Content */}
        {count === 0 ? (
          /* Empty State */
          <div className="py-20 text-center max-w-[420px] mx-auto space-y-4">
            <p className="text-[16px] text-[#707072]">
              You don&apos;t have any favourites saved yet.
            </p>
            <Link
              href="/#fresh-drops"
              className="inline-flex items-center justify-center px-6 py-2.5 rounded-full border border-[#cccccc] hover:border-black text-[14px] font-medium text-[#111111] transition-colors"
            >
              Explore Fresh Drops
            </Link>
          </div>
        ) : (
          /* 2-Column Grid on Mobile matching design */
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-2.5 sm:gap-x-4 md:gap-x-6 gap-y-8 sm:gap-y-10 mt-5 sm:mt-7">
            {favouritedProducts.map((product) => {
              const matchingCartItems = cartItems.filter((it) => it.id === product.id);
              const qty = matchingCartItems.reduce((acc, it) => acc + (it.quantity || 1), 0);
              const primaryItem = matchingCartItems[0];

              return (
                <div key={product.id} className="flex flex-col">
                  {/* Top Image Box with Light Gray Background */}
                  <div className="relative aspect-square bg-[#f6f6f6] overflow-hidden flex items-center justify-center group">
                    <Link
                      href={`/product/${product.slug || product.id}`}
                      className="w-full h-full flex items-center justify-center cursor-pointer"
                    >
                      <img
                        src={product.image}
                        alt={product.alt || product.name}
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    </Link>

                    {/* Circular White Close Button with 'X' in top-right */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFavourite(product.id);
                      }}
                      className="absolute top-2 right-2 sm:top-2.5 sm:right-2.5 w-7 h-7 sm:w-8 sm:h-8 bg-white rounded-full flex items-center justify-center hover:bg-[#ececec] transition-colors cursor-pointer z-10"
                      title="Remove from Favourites"
                      aria-label="Remove from Favourites"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        width="14px"
                        height="14px"
                        stroke="currentColor"
                        fill="none"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-[#111111]"
                      >
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>

                  {/* Product Details Section */}
                  <div className="pt-2.5 sm:pt-3 flex flex-col flex-grow justify-between">
                    <div>
                      {/* Brand Name */}
                      <p
                        className="text-[14px] sm:text-[15px] font-bold text-[#111111] leading-tight font-['Helvetica_Now_Text_Medium',sans-serif]"
                        style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
                      >
                        Sonu Shoe
                      </p>

                      {/* Product Name */}
                      <Link
                        href={`/product/${product.slug || product.id}`}
                        className="block text-[13px] sm:text-[14px] text-[#707072] hover:text-[#111111] transition-colors leading-snug line-clamp-1 mt-0.5"
                      >
                        {product.name}
                      </Link>

                      {/* Category */}
                      <p className="text-[13px] sm:text-[14px] text-[#707072] leading-snug line-clamp-1">
                        {product.category || "Women's Road-Running Shoes"}
                      </p>

                      {/* Price */}
                      <p
                        className="text-[14px] sm:text-[15px] font-bold text-[#111111] mt-1.5 font-['Helvetica_Now_Text_Medium',sans-serif]"
                        style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
                      >
                        {product.price ||
                          `₹${(product.priceNumber || 13995).toLocaleString('en-IN')}`}
                      </p>
                    </div>

                    {/* Move to Bag Button / Quantity Pill */}
                    <div className="mt-3 sm:mt-4">
                      {qty > 0 ? (
                        <div className="w-full sm:w-fit h-[36px] sm:h-[40px] px-3 rounded-full border border-[#111111] bg-white flex items-center justify-between sm:gap-4 text-[#111111]">
                          <button
                            type="button"
                            onClick={() => {
                              if (primaryItem) {
                                if (qty <= 1) {
                                  removeFromCart(primaryItem.id, primaryItem.size, primaryItem.color);
                                } else {
                                  updateCartQuantity(primaryItem.id, primaryItem.size, primaryItem.color, -1);
                                }
                              }
                            }}
                            className="p-1 text-[#111111] hover:text-[#707072] transition-colors cursor-pointer flex items-center justify-center active:scale-90"
                            aria-label="Decrease quantity"
                          >
                            {qty <= 1 ? (
                              <svg
                                aria-hidden="true"
                                focusable="false"
                                viewBox="0 0 24 24"
                                className="w-6 h-6"
                                fill="none"
                              >
                                <path
                                  stroke="currentColor"
                                  strokeMiterlimit="10"
                                  strokeWidth="1.5"
                                  d="M13.75 10v7m-3.5-7v7m-3.5-8.5V17c0 1.24 1.01 2.25 2.25 2.25h6c1.24 0 2.25-1.01 2.25-2.25V7.75h2.25m-10-3h3.75c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5H4.5"
                                />
                              </svg>
                            ) : (
                              <span className="text-[18px] font-medium leading-none px-0.5">−</span>
                            )}
                          </button>

                          <span
                            className="text-[13px] sm:text-[14px] font-medium text-[#111111] min-w-[20px] text-center select-none font-['Helvetica_Now_Text_Medium',sans-serif]"
                            style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
                          >
                            {qty}
                          </span>

                          <button
                            type="button"
                            onClick={() => {
                              if (primaryItem) {
                                updateCartQuantity(primaryItem.id, primaryItem.size, primaryItem.color, 1);
                              }
                            }}
                            className="p-1 text-[#111111] hover:text-[#707072] text-[24px] font-normal transition-colors cursor-pointer leading-none flex items-center justify-center active:scale-90"
                            aria-label="Increase quantity"
                          >
                            +
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => openSizeModal(product)}
                          className="w-full sm:w-fit px-4 sm:px-5 py-2 sm:py-2.5 rounded-full border border-[#cccccc] hover:border-black text-[13px] sm:text-[14px] font-medium text-[#111111] bg-white transition-all cursor-pointer inline-flex items-center justify-center active:scale-[0.98] font-['Helvetica_Now_Text_Medium',sans-serif]"
                          style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
                        >
                          Move to Bag
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SIZE SELECTOR BOTTOM SHEET / MODAL */}
      {activeModalProduct && (
        <div className="fixed inset-0 z-50 overflow-hidden font-['Helvetica_Now_Text',sans-serif]">
          {/* Backdrop */}
          <div
            className={`fixed inset-0 bg-black/60 transition-opacity duration-400 ease-out cursor-pointer ${
              isModalVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
            onClick={closeSizeModal}
          />

          {/* Modal Container */}
          <div
            className={`fixed inset-x-0 bottom-0 sm:inset-auto sm:top-1/2 sm:left-1/2 w-full sm:max-w-[460px] bg-white rounded-t-[24px] sm:rounded-[24px] shadow-2xl z-50 p-6 sm:p-7 overflow-y-auto max-h-[85vh] transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] transform will-change-transform ${
              isModalVisible
                ? 'translate-y-0 opacity-100 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:scale-100 sm:opacity-100'
                : 'translate-y-full opacity-0 sm:-translate-x-1/2 sm:translate-y-[40%] sm:scale-95 sm:opacity-0 pointer-events-none'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with Product Preview */}
            <div className="flex items-center justify-between pb-4 border-b border-[#f0f0f0]">
              <div className="flex items-center gap-3">
                <div className="w-16 h-16  flex items-center justify-center shrink-0">
                  <img
                    src={activeModalProduct.image}
                    alt={activeModalProduct.name}
                    className="w-full rounded-[12px] h-full object-contain"
                  />
                </div>
                <div>
                  <h3
                    className="text-[16px] font-bold text-[#111111] leading-tight font-['Helvetica_Now_Text_Medium',sans-serif]"
                    style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
                  >
                    {activeModalProduct.name}
                  </h3>
                  <p className="text-[13px] text-[#707072] mt-0.5">
                    {activeModalProduct.price ||
                      `₹${(activeModalProduct.priceNumber || 13995).toLocaleString('en-IN')}`}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeSizeModal}
                className="w-8 h-8 rounded-full  hover:bg-[#e8e8e8] flex items-center justify-center text-[#111111] transition-colors cursor-pointer"
                aria-label="Close"
              >
                <svg viewBox="0 0 24 24" width="16px" height="16px" stroke="currentColor" fill="none" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Size Options */}
            <div className="py-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[14px] font-bold text-[#111111]">Select Size</span>
                <button
                  type="button"
                  onClick={() => setIsSizeGuideOpen(true)}
                  className="text-[12px] sm:text-[13px] text-[#707072] underline hover:text-[#111111] transition-colors cursor-pointer"
                >
                  Size Guide
                </button>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-4 gap-2">
                {CATALOG_SIZES.map((size) => {
                  const isSelected = selectedSize === size;
                  return (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setSelectedSize(size)}
                      className={`py-2.5 rounded-xl border text-[13px] font-medium transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#111111] text-white border-[#111111] shadow-sm'
                          : 'bg-white text-[#111111] border-[#e5e5e5] hover:border-black'
                      }`}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Action Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleConfirmMoveToBag}
                className="w-full py-3.5 rounded-full bg-[#111111] hover:bg-black text-white text-[14px] font-medium transition-all shadow-sm active:scale-[0.99] cursor-pointer font-['Helvetica_Now_Text_Medium',sans-serif]"
                style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
              >
                Move to Bag • {selectedSize}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SIZE GUIDE MODAL */}
      {isSizeGuideOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden font-['Helvetica_Now_Text',sans-serif]">
          <div
            className="fixed inset-0 bg-black/60 transition-opacity duration-300 ease-out cursor-pointer"
            onClick={() => setIsSizeGuideOpen(false)}
          />

          <div
            className="fixed inset-x-0 bottom-0 sm:inset-auto sm:top-1/2 sm:left-1/2 w-full sm:max-w-[540px] max-h-[90vh] bg-white rounded-t-[24px] sm:rounded-[24px] shadow-2xl z-50 p-6 sm:p-7 overflow-y-auto sm:-translate-x-1/2 sm:-translate-y-1/2"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between pb-3 border-b border-[#f0f0f0]">
              <div>
                <h2 className="text-[20px] sm:text-[22px] font-bold text-[#111111] tracking-tight">
                  Size Guide
                </h2>
                <p className="text-[13px] text-[#707072] mt-0.5">
                  Footwear Size Conversion & Measurements
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsSizeGuideOpen(false)}
                className="w-8 h-8 rounded-full bg-[#f5f5f5] hover:bg-[#e8e8e8] flex items-center justify-center text-[#111111] transition-colors cursor-pointer"
                aria-label="Close Size Guide"
              >
                <svg viewBox="0 0 24 24" width="16px" height="16px" stroke="currentColor" fill="none" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* in / cm Switcher */}
            <div className="my-4 flex items-center justify-between">
              <span className="text-[13px] text-[#707072]">Foot Length Unit:</span>
              <div className="inline-flex items-center bg-[#f5f5f5] rounded-full p-1 h-[36px]">
                <button
                  type="button"
                  onClick={() => setSizeGuideUnit('cm')}
                  className={`px-3 py-1 text-[13px] rounded-full font-medium transition-all cursor-pointer ${
                    sizeGuideUnit === 'cm'
                      ? 'bg-white text-[#111111] shadow-xs'
                      : 'text-[#707072] hover:text-[#111111]'
                  }`}
                >
                  cm
                </button>
                <button
                  type="button"
                  onClick={() => setSizeGuideUnit('in')}
                  className={`px-3 py-1 text-[13px] rounded-full font-medium transition-all cursor-pointer ${
                    sizeGuideUnit === 'in'
                      ? 'bg-white text-[#111111] shadow-xs'
                      : 'text-[#707072] hover:text-[#111111]'
                  }`}
                >
                  in
                </button>
              </div>
            </div>

            {/* Conversion Table */}
            <div className="overflow-x-auto border border-[#e5e5e5] rounded-xl">
              <table className="w-full text-left border-collapse text-[13px]">
                <thead>
                  <tr className="bg-[#f9f9f9] border-b border-[#e5e5e5] text-[#111111] font-semibold">
                    <th className="py-2.5 px-3 border-r border-[#e5e5e5]">UK</th>
                    <th className="py-2.5 px-3 border-r border-[#e5e5e5]">US Men</th>
                    <th className="py-2.5 px-3 border-r border-[#e5e5e5]">US Women</th>
                    <th className="py-2.5 px-3 border-r border-[#e5e5e5]">EU</th>
                    <th className="py-2.5 px-3">Length ({sizeGuideUnit})</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f0f0f0] text-[#333333]">
                  {[
                    { uk: 'UK 3', usM: '3.5', usW: '5', eu: '35.5', cm: '22.0', in: '8.7' },
                    { uk: 'UK 4', usM: '4.5', usW: '6', eu: '37', cm: '23.0', in: '9.1' },
                    { uk: 'UK 5', usM: '5.5', usW: '7', eu: '38', cm: '24.0', in: '9.4' },
                    { uk: 'UK 6', usM: '6.5', usW: '8', eu: '39', cm: '24.8', in: '9.8' },
                    { uk: 'UK 7', usM: '7.5', usW: '9', eu: '40.5', cm: '25.5', in: '10.0' },
                    { uk: 'UK 8', usM: '8.5', usW: '10', eu: '42', cm: '26.5', in: '10.4' },
                    { uk: 'UK 9', usM: '9.5', usW: '11', eu: '43', cm: '27.5', in: '10.8' },
                  ].map((row) => (
                    <tr
                      key={row.uk}
                      className={`hover:bg-[#f9f9f9] transition-colors ${
                        selectedSize === row.uk ? 'bg-neutral-50 font-semibold text-[#111111]' : ''
                      }`}
                    >
                      <td className="py-2 px-3 border-r border-[#e5e5e5]">{row.uk}</td>
                      <td className="py-2 px-3 border-r border-[#e5e5e5]">{row.usM}</td>
                      <td className="py-2 px-3 border-r border-[#e5e5e5]">{row.usW}</td>
                      <td className="py-2 px-3 border-r border-[#e5e5e5]">{row.eu}</td>
                      <td className="py-2 px-3">{sizeGuideUnit === 'cm' ? row.cm : row.in}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-5 pt-3 border-t border-[#f0f0f0]">
              <button
                type="button"
                onClick={() => setIsSizeGuideOpen(false)}
                className="w-full py-3 rounded-full bg-[#111111] hover:bg-black text-white text-[14px] font-medium transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Added to Bag Popup Drawer / Modal */}
      {isDrawerMounted && (
        <div className="fixed inset-0 z-50 overflow-hidden font-['Helvetica_Now_Text',sans-serif]">
          {/* Backdrop overlay */}
          <div
            className={`fixed inset-0 bg-black/60 transition-opacity duration-400 ease-out cursor-pointer ${
              isDrawerVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
            onClick={closeDrawer}
          />

          {/* Modal / Bottom Sheet */}
          <div
            className={`fixed inset-x-0 bottom-0 sm:inset-auto sm:top-1/2 sm:left-1/2 w-full sm:max-w-[500px] bg-white rounded-t-[28px] sm:rounded-[24px] shadow-2xl z-50 p-6 sm:p-7 overflow-hidden transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] transform will-change-transform ${
              isDrawerVisible
                ? 'translate-y-0 opacity-100 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:scale-100 sm:opacity-100'
                : 'translate-y-full opacity-0 sm:-translate-x-1/2 sm:translate-y-[40%] sm:scale-95 sm:opacity-0 pointer-events-none'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header: Green Checkmark + Added to Bag + Close Button */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-full bg-[#008a00] flex items-center justify-center shrink-0">
                  <svg
                    className="w-3.5 h-3.5 text-white"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={3}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <h2 className="text-[22px] sm:text-[24px] font-medium text-[#111111] tracking-tight leading-none">
                  Added to Bag
                </h2>
              </div>

              <button
                type="button"
                onClick={closeDrawer}
                className="w-9 h-9 rounded-full bg-[#f5f5f5] hover:bg-[#e8e8e8] flex items-center justify-center text-[#111111] transition-colors cursor-pointer"
                aria-label="Close"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Product Details Row */}
            {drawerItem && (
              <div className="mt-6 flex items-start gap-4">
                <div className="w-[104px] h-[104px] sm:w-[112px] sm:h-[112px] rounded-xl flex items-center justify-center shrink-0 overflow-hidden p-2">
                  <img
                    src={drawerItem.image}
                    alt={drawerItem.name}
                    className="w-full h-full object-contain mix-blend-multiply"
                  />
                </div>

                <div className="flex flex-col text-left">
                  <h3
                    className="text-[17px] sm:text-[18px] font-medium text-[#111111] leading-snug font-['Helvetica_Now_Text_Medium',sans-serif]"
                    style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
                  >
                    {drawerItem.name}
                  </h3>
                  <p className="text-[15px] text-[#707072] mt-0.5 leading-tight">
                    {drawerItem.category || "Women's Road-Running Shoes"} ({drawerItem.selectedSize || 'UK 8'})
                  </p>
                  <p className="text-[15px] text-[#707072] mt-0.5 leading-tight">
                    Size {drawerItem.selectedSize || 'UK 8'}
                  </p>
                  <p
                    className="text-[17px] font-medium text-[#111111] mt-0 font-['Helvetica_Now_Text_Medium',sans-serif]"
                    style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
                  >
                    {drawerItem.priceFormatted}
                  </p>
                  <p className="text-[13px] text-[#707072] mt-0.5">
                    Inclusive of all taxes
                  </p>
                </div>
              </div>
            )}

            {/* View Bag CTA Button */}
            <div className="mt-6">
              <Link
                href="/checkout"
                onClick={closeDrawer}
                className="w-full py-4 rounded-full bg-[#111111] hover:bg-black text-white text-[16px] font-medium text-center transition-all block shadow-md active:scale-[0.99] cursor-pointer font-['Helvetica_Now_Text_Medium',sans-serif]"
                style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
              >
                View Bag ({cartCount})
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
