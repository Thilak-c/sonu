'use client';

import React, { useState, useRef } from 'react';
import { addToCart } from '@/components/cart/cartStore';

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
  const carouselRef = useRef(null);

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

          {/* Addon Items: Strictly ONE row on phone, edge-to-edge scroll bleed, 4 columns on desktop */}
          <div
            ref={carouselRef}
            className="-mx-6 px-6 sm:-mx-10 sm:px-10 lg:mx-0 lg:px-0 flex lg:grid lg:grid-cols-4 gap-3 sm:gap-6 overflow-x-auto scrollbar-none pb-4 snap-x snap-mandatory"
          >
            {LAST_MINUTE_ADDITIONS.map((addon) => {
              const isAdded = addedAddonId === addon.id;

              return (
                <div
                  key={addon.id}
                  className="flex flex-col group w-[170px] sm:w-[200px] lg:w-auto shrink-0 snap-start"
                >
                  {/* Square Image Box */}
                  <div className="w-full aspect-square bg-[#f5f5f5] rounded-xl flex items-center justify-center p-3 overflow-hidden">
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

                    {/* Move to Bag Button */}
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
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
