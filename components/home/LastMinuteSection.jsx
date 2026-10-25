'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { addToCart, getCartItems, removeFromCart, updateCartQuantity } from '@/components/cart/cartStore';

const LAST_MINUTE_ADDITIONS = [
  {
    id: 'addon-bottle',
    brand: 'Sonu Shoe',
    title: 'Refuel Bottle Grip 18 Oz',
    price: 999,
    priceFormatted: '₹999',
    image: '/images/addons/bottle.jpg',
    color: 'Black/White',
  },
  {
    id: 'addon-basketball',
    brand: 'Sonu Shoe',
    title: 'Everyday All Court 8P Deflated',
    price: 2999,
    priceFormatted: '₹2,999',
    image: '/images/addons/basketball.jpg',
    color: 'Orange/Black',
  },
  {
    id: 'addon-wristbands',
    brand: 'Sonu Shoe',
    title: 'Classic Doublewide Wristbands',
    price: 1099,
    priceFormatted: '₹1,099',
    image: '/images/addons/wristbands.jpg',
    color: 'Royal/White/Red',
  },
  {
    id: 'addon-backpack',
    brand: 'Sonu Shoe Heritage',
    title: 'Heritage Backpack 2.0 (23L)',
    price: 2495,
    priceFormatted: '₹2,495',
    image: '/images/addons/backpack.jpg',
    color: 'Black',
  },
];

export default function LastMinuteSection() {
  const [addedAddonId, setAddedAddonId] = useState(null);
  const [drawerItem, setDrawerItem] = useState(null);
  const [isDrawerMounted, setIsDrawerMounted] = useState(false);
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [cartCount, setCartCount] = useState(0);
  const carouselRef = useRef(null);
  const drawerTimerRef = useRef(null);

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

  const scrollAddons = (direction) => {
    if (!carouselRef.current) return;
    const amount = direction === 'left' ? -300 : 300;
    carouselRef.current.scrollBy({ left: amount, behavior: 'smooth' });
  };

  const handleMoveToBag = (addon) => {
    addToCart({
      id: addon.id,
      name: addon.title,
      price: addon.priceFormatted,
      priceNumber: addon.price,
      image: addon.image,
      size: 'One Size',
      color: addon.color,
      quantity: 1,
    });

    setAddedAddonId(addon.id);
    setTimeout(() => {
      setAddedAddonId(null);
    }, 2000);

    // Open Added to Bag confirmation popup
    setDrawerItem(addon);
    setIsDrawerMounted(true);
    if (drawerTimerRef.current) clearTimeout(drawerTimerRef.current);
    drawerTimerRef.current = setTimeout(() => {
      setIsDrawerVisible(true);
    }, 20);
  };

  const closeDrawer = () => {
    setIsDrawerVisible(false);
    if (drawerTimerRef.current) clearTimeout(drawerTimerRef.current);
    drawerTimerRef.current = setTimeout(() => {
      setIsDrawerMounted(false);
      setDrawerItem(null);
    }, 300);
  };

  return (
    <section
      aria-label="Last Minute Addition"
      className="w-full bg-white py-10 sm:py-16 border-t border-[#f0f0f0] select-none font-['Helvetica_Now_Text',sans-serif]"
    >
      <div className="w-full max-w-[1440px] mx-auto px-6 sm:px-10">
        <h2
          className="text-[24px] sm:text-[28px] font-bold text-[#111111] mb-6 sm:mb-8 tracking-tight font-['Helvetica_Now_Text_Medium',sans-serif]"
          style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
        >
          Last Minute Addition
        </h2>

        {/* Carousel / Grid Container with Navigation Arrows */}
        <div className="relative">
          {/* Left Arrow Button */}
          <button
            type="button"
            onClick={() => scrollAddons('left')}
            className="hidden sm:flex absolute -left-4 top-[38%] -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white shadow-[0_2px_10px_rgba(0,0,0,0.12)] border border-[#e5e5e5] items-center justify-center text-[#111111] hover:bg-neutral-50 transition-all cursor-pointer active:scale-95"
            aria-label="Previous items"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Right Arrow Button */}
          <button
            type="button"
            onClick={() => scrollAddons('right')}
            className="hidden sm:flex absolute -right-4 top-[38%] -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white shadow-[0_2px_10px_rgba(0,0,0,0.12)] border border-[#e5e5e5] items-center justify-center text-[#111111] hover:bg-neutral-50 transition-all cursor-pointer active:scale-95"
            aria-label="Next items"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Addon Items: Edge-to-edge bleed on phone, 4 columns on desktop */}
          <div
            ref={carouselRef}
            className="-mx-6 px-6 sm:-mx-10 sm:px-10 lg:mx-0 lg:px-0 flex lg:grid lg:grid-cols-4 gap-3.5 sm:gap-6 overflow-x-auto no-scrollbar scrollbar-none pb-4"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {LAST_MINUTE_ADDITIONS.map((addon) => {
              const isAdded = addedAddonId === addon.id;
              const cartItem = cartItems.find((it) => it.id === addon.id);
              const qty = cartItem ? (cartItem.quantity || 1) : 0;

              return (
                <div
                  key={addon.id}
                  className="flex flex-col group w-[175px] sm:w-[200px] lg:w-auto shrink-0"
                >
                  {/* Square Image Box (User custom styling preserved) */}
                  <div className="w-full aspect-square flex items-center justify-center overflow-hidden">
                    <img
                      src={addon.image}
                      alt={addon.title}
                      loading="lazy"
                      className="w-full h-full object-contain mix-blend-multiply transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>

                  {/* Info */}
                  <div className="pt-2.5 flex-1 flex flex-col justify-between">
                    <div>
                      <p className="text-[11px] sm:text-[12px] text-[#707072] font-normal leading-tight">
                        {addon.brand}
                      </p>
                      <h3 className="text-[13px] sm:text-[14px] font-medium text-[#111111] mt-0.5 leading-snug line-clamp-1">
                        {addon.title}
                      </h3>
                      <p
                        className="text-[13px] sm:text-[14px] font-bold text-[#111111] mt-1 font-['Helvetica_Now_Text_Medium',sans-serif]"
                        style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
                      >
                        {addon.priceFormatted}
                      </p>
                    </div>

                    {/* Move to Bag Button / Quantity Pill */}
                    {qty > 0 ? (
                      <div className="mt-2.5 w-full h-[34px] sm:h-[38px] rounded-full border border-[#111111] bg-white flex items-center justify-between px-3 text-[#111111]">
                        <button
                          type="button"
                          onClick={() => {
                            if (qty <= 1) {
                              removeFromCart(addon.id, 'One Size', addon.color);
                            } else {
                              updateCartQuantity(addon.id, 'One Size', addon.color, -1);
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
                              className="w-4 h-4"
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
                            <span className="text-[16px] font-medium leading-none px-0.5">−</span>
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
                          onClick={() => updateCartQuantity(addon.id, 'One Size', addon.color, 1)}
                          className="p-1 text-[#111111] hover:text-[#707072] text-[18px] font-normal transition-colors cursor-pointer leading-none flex items-center justify-center active:scale-90"
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleMoveToBag(addon)}
                        className={`mt-2.5 w-full py-1.5 sm:py-2 rounded-full border text-[12px] sm:text-[13px] font-medium transition-all cursor-pointer active:scale-[0.98] ${
                          isAdded
                            ? 'bg-[#0d8240] text-white border-[#0d8240]'
                            : 'border-[#111111] text-[#111111] bg-white hover:bg-[#111111] hover:text-white'
                        }`}
                      >
                        {isAdded ? 'Added ✓' : 'Move to Bag'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Trailing spacer for smooth edge-to-edge scroll bleed */}
            <div className="w-1.5 sm:w-2 lg:hidden shrink-0" aria-hidden="true" />
          </div>
        </div>
      </div>

      {/* Added to Bag Popup Drawer / Modal (Exact match to Product Detail Page) */}
      {isDrawerMounted && (
        <div className="fixed inset-0 z-50 overflow-hidden font-['Helvetica_Now_Text',sans-serif]">
          {/* Backdrop overlay */}
          <div
            className={`fixed inset-0 bg-black/60 transition-opacity duration-300 ease-out cursor-pointer ${
              isDrawerVisible ? 'opacity-100' : 'opacity-0'
            }`}
            onClick={closeDrawer}
          />

          {/* Modal / Bottom Sheet */}
          <div
            className={`fixed inset-x-0 bottom-0 sm:inset-auto sm:top-1/2 sm:left-1/2 w-full sm:max-w-[500px] bg-white rounded-t-[28px] sm:rounded-[24px] shadow-2xl z-50 p-6 sm:p-7 overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
              isDrawerVisible
                ? 'translate-y-0 opacity-100 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:scale-100 sm:opacity-100'
                : 'translate-y-full opacity-0 sm:-translate-x-1/2 sm:translate-y-[100vh] sm:scale-95 sm:opacity-0'
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
                    alt={drawerItem.title}
                    className="w-full h-full object-contain mix-blend-multiply"
                  />
                </div>

                <div className="flex flex-col text-left">
                  <h3
                    className="text-[17px] sm:text-[18px] font-medium text-[#111111] leading-snug font-['Helvetica_Now_Text_Medium',sans-serif]"
                    style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
                  >
                    {drawerItem.title}
                  </h3>
                  <p className="text-[15px] text-[#707072] mt-0.5 leading-tight">
                    {drawerItem.brand} (One Size)
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
    </section>
  );
}
