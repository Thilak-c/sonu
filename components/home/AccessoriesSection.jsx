'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { addToCart } from '@/components/cart/cartStore';

export const ACCESSORIES = [
  {
    id: 'sonu-crew-socks-3pack',
    brand: 'Sonu Shoe',
    title: 'Cushioned Crew Socks (3-Pack)',
    category: 'Unisex Athletic Socks',
    price: 599,
    priceFormatted: '₹599',
    originalPrice: 899,
    image: '/images/addons/socks.jpg',
    color: 'White / Black',
    description: 'High-density zonal cushioning with moisture-wicking yarns and ergonomic arch band.',
  },
  {
    id: 'sonu-refuel-bottle-24oz',
    brand: 'Sonu Shoe',
    title: 'Refuel Grip Water Bottle (24 Oz)',
    category: 'Hydration Gear',
    price: 799,
    priceFormatted: '₹799',
    originalPrice: 1199,
    image: '/images/addons/bottle.jpg',
    color: 'Matte Stealth Black',
    description: 'BPA-free leakproof squeeze bottle with high-flow valve and textured grip.',
  },
  {
    id: 'sonu-sneaker-cleaning-kit',
    brand: 'Sonu Shoe',
    title: 'Premium Sneaker Cleaning Kit',
    category: 'Footwear Care',
    price: 699,
    priceFormatted: '₹699',
    originalPrice: 999,
    image: '/images/addons/cleaning-kit.jpg',
    color: 'Natural Wood / Clear',
    description: 'All-surface foaming cleaner, natural hog bristle brush, and premium microfiber cloth.',
  },
  {
    id: 'sonu-ergonomic-insoles',
    brand: 'Sonu Shoe',
    title: 'Ergonomic Dual-Density Insoles',
    category: 'Footwear Comfort',
    price: 499,
    priceFormatted: '₹499',
    originalPrice: 799,
    image: '/images/addons/insoles.jpg',
    color: 'Teal / Charcoal',
    description: 'Shock-absorbing high-rebound PU foam with deep heel cradle and breathable top layer.',
  },
  {
    id: 'sonu-reflective-laces',
    brand: 'Sonu Shoe',
    title: 'Reflective Performance Laces',
    category: 'Shoe Accessories',
    price: 299,
    priceFormatted: '₹299',
    originalPrice: 499,
    image: '/images/addons/laces.jpg',
    color: 'Reflective Black',
    description: 'Heavy-duty braided laces with 3M reflective threading for high-visibility low-light runs.',
  },
];

export default function AccessoriesSection() {
  const [addedId, setAddedId] = useState(null);
  const [toastMessage, setToastMessage] = useState('');
  const scrollRef = useRef(null);

  const handleAddToCart = (item) => {
    addToCart({
      id: item.id,
      title: item.title,
      name: item.title,
      brand: item.brand,
      price: item.priceFormatted,
      priceNumber: item.price,
      image: item.image,
      size: 'One Size',
      color: item.color,
      quantity: 1,
    });

    setAddedId(item.id);
    setToastMessage(`Added ${item.title} to Bag`);

    setTimeout(() => {
      setAddedId(null);
    }, 1800);

    setTimeout(() => {
      setToastMessage('');
    }, 2500);
  };

  const scroll = (direction) => {
    if (!scrollRef.current) return;
    const offset = direction === 'left' ? -320 : 320;
    scrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
  };

  return (
    <section
      id="accessories"
      aria-label="Sonu Shoe Accessories & Gear"
      className="w-full bg-white py-8 sm:py-12 select-none font-['Helvetica_Now_Text',sans-serif]"
    >
      <div className="w-full max-w-[1440px] mx-auto px-6 sm:px-10">
        {/* Section Header */}
        <div className="flex items-end justify-between mb-5 sm:mb-6">
          <div>
            <span className="text-[12px] font-medium tracking-[0.2em] uppercase text-[#707072] block mb-1">
              Sonu Shoe Essentials
            </span>
            <h2
              className="text-[26px] sm:text-[32px] font-bold text-[#111111] tracking-tight font-['Helvetica_Now_Text_Medium',sans-serif]"
              style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
            >
              Accessories & Gear
            </h2>
          </div>

          {/* Desktop Navigation Arrows */}
          <div className="hidden sm:flex items-center gap-2">
            <button
              type="button"
              onClick={() => scroll('left')}
              className="w-10 h-10 rounded-full border border-[#e5e5e5] bg-white hover:bg-neutral-100 flex items-center justify-center text-[#111111] transition-all active:scale-95 cursor-pointer shadow-sm"
              aria-label="Previous items"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => scroll('right')}
              className="w-10 h-10 rounded-full border border-[#e5e5e5] bg-white hover:bg-neutral-100 flex items-center justify-center text-[#111111] transition-all active:scale-95 cursor-pointer shadow-sm"
              aria-label="Next items"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Carousel / Grid Container */}
        <div
          ref={scrollRef}
          className="-mx-6 px-6 sm:mx-0 sm:px-0 flex sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 overflow-x-auto no-scrollbar scrollbar-none pb-4"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {ACCESSORIES.map((item) => {
            const isAdded = addedId === item.id;

            return (
              <div
                key={item.id}
                className="group flex-shrink-0 w-[72vw] sm:w-auto flex flex-col justify-between  transition-all "
              >
                {/* Product Visual */}
                <div className="w-full aspect-square bg-white rounded-xl overflow-hidden flex items-center justify-center  relative">
                  <img
                    src={item.image}
                    alt={`${item.brand} ${item.title}`}
                    className="w-full h-full object-contain transform group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                    onError={(e) => {
                      // Fallback gracefully if image is still generating
                      e.currentTarget.src = '/images/addons/bottle.jpg';
                    }}
                  />

                  {/* Brand Tag */}
                  <span className="absolute top-2.5 left-2.5 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-neutral-900/5 text-neutral-700">
                    {item.brand}
                  </span>
                </div>

                {/* Details */}
                <div className="pt-3.5 flex flex-col flex-1">
                  <span className="text-[11px] uppercase tracking-wider text-[#707072] font-medium">
                    {item.category}
                  </span>
                  <h3
                    className="text-[15px] sm:text-[16px] font-bold text-[#111111] mt-0.5 leading-snug line-clamp-1 font-['Helvetica_Now_Text_Medium',sans-serif]"
                    style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
                  >
                    {item.title}
                  </h3>
                  <p className="text-[12px] text-[#707072] mt-1 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>

                  <div className="mt-2.5 flex items-baseline gap-2">
                    <span className="text-[16px] font-bold text-[#111111]">
                      {item.priceFormatted}
                    </span>
                    {item.originalPrice && (
                      <span className="text-[12px] text-[#707072] line-through">
                        ₹{item.originalPrice.toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>
                </div>

                {/* Add to Bag Button */}
                <div className="pt-3 mt-auto">
                  <button
                    type="button"
                    onClick={() => handleAddToCart(item)}
                    className={`w-full py-2.5 px-4 rounded-full text-[13px] font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.98] ${
                      isAdded
                        ? 'bg-emerald-600 text-white'
                        : 'bg-[#111111] hover:bg-black text-white'
                    }`}
                  >
                    {isAdded ? (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        Added to Bag
                      </>
                    ) : (
                      'Add to Bag'
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#111111] text-white text-[13px] font-medium px-4 py-2.5 rounded-full shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          {toastMessage}
        </div>
      )}
    </section>
  );
}

