'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { addToCart, getCartItems } from '@/components/cart/cartStore';

const SIZE_CHART = [
  { size: 'UK 3', inLength: '8.8', cmLength: '22.4', us: '5.5', eu: '36', cmJp: '22.5' },
  { size: 'UK 4', inLength: '9.2', cmLength: '23.4', us: '6.5', eu: '37.5', cmJp: '23.5' },
  { size: 'UK 5', inLength: '9.5', cmLength: '24.1', us: '7.5', eu: '38.5', cmJp: '24.5' },
  { size: 'UK 6', inLength: '9.8', cmLength: '24.9', us: '8.5', eu: '40', cmJp: '25.5' },
  { size: 'UK 7', inLength: '10.2', cmLength: '25.9', us: '9.5', eu: '41', cmJp: '26.5' },
  { size: 'UK 8', inLength: '10.5', cmLength: '26.7', us: '10.5', eu: '42.5', cmJp: '27.5' },
  { size: 'UK 9', inLength: '10.8', cmLength: '27.4', us: '11.5', eu: '44', cmJp: '28.5' },
];

export default function ProductDetailClient({ product }) {
  // Color options
  const colorOptions = [
    {
      id: 'color-purple',
      name: 'Purple / Magenta',
      thumb: '/images/products/hybrid-purple-thumb.png',
      main: '/images/products/hybrid-purple-main.png',
    },
    {
      id: 'color-black',
      name: 'Black / White',
      thumb: '/images/products/hybrid-black-thumb.png',
      main: '/images/products/hybrid-black-thumb.png',
    },
    {
      id: 'color-white',
      name: 'Summit White / Infrared',
      thumb: '/images/products/hybrid-white-thumb.png',
      main: '/images/products/hybrid-white-thumb.png',
    },
  ];

  const [activeColor, setActiveColor] = useState(colorOptions[0]);
  const [selectedSize, setSelectedSize] = useState(null); // null until selected
  const [cartCount, setCartCount] = useState(1);

  // Added to Bag / Select Size Drawer state
  const [isBagModalMounted, setIsBagModalMounted] = useState(false);
  const [isBagModalVisible, setIsBagModalVisible] = useState(false);
  const [isBagBackdropVisible, setIsBagBackdropVisible] = useState(false);
  const [bagModalMode, setBagModalMode] = useState('added-to-bag'); // 'added-to-bag' | 'select-size'
  const bagTimerRef = useRef(null);

  // Size Guide Modal state
  const [isModalMounted, setIsModalMounted] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const closeTimerRef = useRef(null);
  const [unit, setUnit] = useState('in'); // 'in' or 'cm'
  const [isFavourite, setIsFavourite] = useState(false);

  // Handlers for Added to Bag / Select Size drawer
  const openBagModal = (mode = 'added-to-bag') => {
    if (bagTimerRef.current) clearTimeout(bagTimerRef.current);
    setBagModalMode(mode);
    setIsBagModalMounted(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setIsBagBackdropVisible(true);
        setIsBagModalVisible(true);
      });
    });
  };

  const closeBagModal = () => {
    setIsBagBackdropVisible(false);
    setIsBagModalVisible(false);
    bagTimerRef.current = setTimeout(() => {
      setIsBagModalMounted(false);
    }, 320);
  };

  // Handlers for Size Guide Modal
  const openSizeGuide = () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    setIsModalMounted(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setIsModalVisible(true);
      });
    });
  };

  const closeSizeGuide = () => {
    setIsModalVisible(false);
    closeTimerRef.current = setTimeout(() => {
      setIsModalMounted(false);
    }, 320);
  };

  // Sync initial cart count on mount
  useEffect(() => {
    const items = getCartItems();
    const count = items.reduce((acc, it) => acc + (it.quantity || 1), 0);
    if (count > 0) setCartCount(count);
  }, []);

  // Handle Add to Bag button click
  const handleAddToBag = () => {
    if (!selectedSize) {
      // If customer has NOT selected size, pop up the select size drawer
      openBagModal('select-size');
    } else {
      // Customer has selected size, add to cart and pop up "Added to Bag" confirmation
      const updated = addToCart({
        id: product.id,
        name: product.name,
        category: product.category,
        price: product.price,
        priceNumber: product.priceNumber || 13995,
        size: selectedSize,
        color: activeColor.name,
        image: activeColor.thumb || activeColor.main || product.image,
      });
      const totalCount = updated.reduce((acc, it) => acc + (it.quantity || 1), 0);
      setCartCount(totalCount);
      openBagModal('added-to-bag');
    }
  };

  // Handle Size selection from inside the drawer:
  // 1. Drawer goes DOWN with animation
  // 2. Add to cart & switch to 'added-to-bag'
  // 3. Drawer comes UP with animation
  const handleSelectSizeInDrawer = (sz) => {
    setSelectedSize(sz);
    const updated = addToCart({
      id: product.id,
      name: product.name,
      category: product.category,
      price: product.price,
      priceNumber: product.priceNumber || 13995,
      size: sz,
      color: activeColor.name,
      image: activeColor.thumb || activeColor.main || product.image,
    });
    const totalCount = updated.reduce((acc, it) => acc + (it.quantity || 1), 0);
    setCartCount(totalCount);

    // Slide DOWN with animation
    setIsBagModalVisible(false);

    if (bagTimerRef.current) clearTimeout(bagTimerRef.current);
    bagTimerRef.current = setTimeout(() => {
      setBagModalMode('added-to-bag');
      // Slide back UP with animation
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsBagModalVisible(true);
        });
      });
    }, 320);
  };

  // Close modals on Escape and lock scroll
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (isModalMounted) closeSizeGuide();
        if (isBagModalMounted) closeBagModal();
      }
    };

    if (isModalMounted || isBagModalMounted) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
      if (bagTimerRef.current) clearTimeout(bagTimerRef.current);
    };
  }, [isModalMounted, isBagModalMounted]);

  return (
    <div className="w-full bg-white select-none font-['Helvetica_Now_Text',sans-serif]">
      {/* Main Container */}
      <div className="w-full max-w-[540px] md:max-w-[960px] mx-auto px-4 sm:px-6 py-4 sm:py-8">
        
        {/* Top Header Block: strictly matching Screenshot 1 */}
        <div className="flex flex-col text-left mb-3">
          {/* 1. Just In Badge */}
          <span className="text-[#c83200] text-[15px] sm:text-[16px] font-medium leading-none mb-1">
            Just In
          </span>

          {/* 2. Product Name */}
          <h1
            className="text-[22px] sm:text-[26px] font-medium text-[#111111] tracking-tight leading-snug font-['Helvetica_Now_Text_Medium',sans-serif]"
            style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
          >
            {product.name}
          </h1>

          {/* 3. Product Subtitle / Category */}
          <p className="text-[15px] sm:text-[16px] text-[#707072] mt-0.5 leading-tight">
            {product.category}
          </p>

          {/* 4. Price */}
          <p
            className="text-[17px] sm:text-[18px] font-medium text-[#111111] mt-2 font-['Helvetica_Now_Text_Medium',sans-serif]"
            style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
          >
            {product.price}
          </p>

          {/* 5. Inclusive of all taxes */}
          <p className="text-[14px] text-[#707072] mt-0.5">
            Inclusive of all taxes
          </p>
        </div>

        {/* Main Product Hero Image Area: strictly matching Screenshot 1 */}
        <div className="w-full bg-[#f5f5f5] rounded-xl flex items-center justify-center  sm:p-8 min-h-[340px] sm:min-h-[440px] relative overflow-hidden group">
          <img
            src={activeColor.main}
            alt={`${product.name} in ${activeColor.name}`}
            className="w-full h-auto max-h-[380px] object-contain transition-transform duration-500 group-hover:scale-105"
            loading="eager"
          />
        </div>

        {/* Carousel Pagination Dots */}
        <div className="flex items-center justify-center gap-2 py-4">
          <span className="w-2 h-2 rounded-full bg-[#111111]" />
          <span className="w-2 h-2 rounded-full bg-[#d2d2d2]" />
          <span className="w-2 h-2 rounded-full bg-[#d2d2d2]" />
          <span className="w-2 h-2 rounded-full bg-[#d2d2d2]" />
          <span className="w-2 h-2 rounded-full bg-[#d2d2d2]" />
          <span className="w-2 h-2 rounded-full bg-[#d2d2d2]" />
          <span className="w-2 h-2 rounded-full bg-[#d2d2d2]" />
          <span className="w-2 h-2 rounded-full bg-[#d2d2d2]" />
          <span className="w-2 h-2 rounded-full bg-[#d2d2d2]" />
        </div>

        {/* Color Options Row: strictly matching Screenshot 2 */}
        <div className="grid grid-cols-3 gap-3 my-4">
          {colorOptions.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setActiveColor(opt)}
              className={`aspect-square bg-[#f5f5f5] rounded-xl overflow-hidden  flex items-center justify-center cursor-pointer transition-all ${
                activeColor.id === opt.id
                  ? 'border-2 border-[#111111] shadow-xs'
                  : 'border border-transparent hover:border-neutral-300'
              }`}
            >
              <img
                src={opt.thumb}
                alt={opt.name}
                className="w-full h-full object-contain"
              />
            </button>
          ))}
        </div>

        {/* Size Selection Section: strictly matching Screenshot 3 */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[16px] font-medium text-[#111111]">
              Select Size
            </span>

            {/* Size Guide Button with User's Exact SVG */}
            <button
              type="button"
              onClick={openSizeGuide}
              className="flex items-center gap-1.5 text-[15px] font-medium text-[#111111] hover:text-[#707072] transition-colors cursor-pointer"
            >
              <svg
                aria-hidden="true"
                focusable="false"
                viewBox="0 0 24 24"
                role="img"
                width="20px"
                height="20px"
                fill="none"
                className="shrink-0"
              >
                <path
                  stroke="#111111"
                  strokeWidth="1.5"
                  d="M21.75 10.5v6.75a1.5 1.5 0 01-1.5 1.5H3.75a1.5 1.5 0 01-1.5-1.5V10.5m3.308-2.25h12.885"
                />
                <path
                  stroke="#111111"
                  strokeWidth="1.5"
                  d="M15.79 5.599l2.652 2.65-2.652 2.653M8.21 5.599l-2.652 2.65 2.652 2.653M17.25 19v-2.5M12 19v-2.5M6.75 19v-2.5"
                />
              </svg>
              <span>Size Guide</span>
            </button>
          </div>

          {/* Size Buttons Grid: UK 3 to UK 9 */}
          <div className="grid grid-cols-4 gap-2.5">
            {SIZE_CHART.map((item) => (
              <button
                key={item.size}
                type="button"
                onClick={() => setSelectedSize(item.size)}
                className={`py-3.5 rounded-[8px] text-[15px] font-medium transition-all cursor-pointer ${
                  selectedSize === item.size
                    ? 'border-2 border-[#111111] bg-white text-[#111111] shadow-xs'
                    : 'border border-neutral-300 bg-white text-[#111111] hover:border-[#111111]'
                }`}
              >
                {item.size}
              </button>
            ))}
          </div>
        </div>

        {/* CTA Buttons Block: strictly matching Screenshot 3 */}
        <div className="mt-8 flex flex-col gap-3">
          {/* Add to Bag */}
          <button
            type="button"
            onClick={handleAddToBag}
            className="w-full py-4 rounded-full bg-[#111111] hover:bg-black text-white text-[16px] font-medium transition-all shadow-md active:scale-[0.99] cursor-pointer"
          >
            Add to Bag
          </button>

          {/* Favourite Button with Heart Outline */}
          <button
            type="button"
            onClick={() => setIsFavourite(!isFavourite)}
            className="w-full py-4 rounded-full border border-neutral-300 hover:border-[#111111] bg-white text-[#111111] text-[16px] font-medium flex items-center justify-center gap-2 transition-all active:scale-[0.99] cursor-pointer"
          >
            <span>Favourite</span>
            <svg
              className={`w-5 h-5 transition-colors ${
                isFavourite ? 'fill-rose-500 text-rose-500' : 'fill-none text-[#111111]'
              }`}
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.75}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
              />
            </svg>
          </button>
        </div>

        {/* Description & Details */}
        <div className="mt-10 pt-6 border-t border-neutral-200">
          <p className="text-[15px] text-[#707072] leading-relaxed">
            {product.description}
          </p>
        </div>
      </div>

      {/* 1. Added to Bag / Select Size Drawer strictly matching User's latest Screenshot */}
      {isBagModalMounted && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Blacked-out backdrop overlay */}
          <div
            className={`fixed inset-0 bg-black/60 transition-opacity duration-300 ease-out cursor-pointer ${
              isBagBackdropVisible ? 'opacity-100' : 'opacity-0'
            }`}
            onClick={closeBagModal}
          />

          {/* Drawer Sheet strictly matching the design */}
          <div
            className={`fixed inset-x-0 bottom-0 sm:inset-auto sm:top-1/2 sm:left-1/2 w-full sm:max-w-[540px] bg-white rounded-t-[28px] sm:rounded-[24px] shadow-2xl z-50 p-6 sm:p-7 overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
              isBagModalVisible
                ? 'translate-y-0 opacity-100 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:scale-100 sm:opacity-100'
                : 'translate-y-full opacity-0 sm:-translate-x-1/2 sm:translate-y-[100vh] sm:scale-95 sm:opacity-0'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {bagModalMode === 'select-size' ? (
              /* Flow A: Customer didn't select size yet -> pop up Select Size */
              <div>
                {/* Header */}
                <div className="flex items-center justify-between">
                  <h2 className="text-[22px] sm:text-[24px] font-medium text-[#111111] tracking-tight">
                    Select Size
                  </h2>
                  <button
                    type="button"
                    onClick={closeBagModal}
                    className="w-9 h-9 rounded-full bg-[#f5f5f5] hover:bg-[#e8e8e8] flex items-center justify-center text-[#111111] transition-colors cursor-pointer"
                    aria-label="Close"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Product Summary Row */}
                <div className="mt-4 flex items-center gap-3.5 pb-4 border-b border-neutral-100">
                  <div className="w-[64px] h-[64px] bg-[#f5f5f5] rounded-lg flex items-center justify-center shrink-0">
                    <img
                      src={activeColor.thumb || activeColor.main}
                      alt={product.name}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div>
                    <h3 className="text-[16px] font-medium text-[#111111] leading-tight">
                      {product.name}
                    </h3>
                    <p className="text-[14px] text-[#707072] mt-0.5">
                      {product.price}
                    </p>
                  </div>
                </div>

                {/* Size Grid Options */}
                <div className="mt-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[14px] text-[#707072]">
                      Choose your size to add to bag
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        closeBagModal();
                        setTimeout(() => openSizeGuide(), 320);
                      }}
                      className="text-[13px] font-medium text-[#111111] underline hover:text-[#707072] cursor-pointer"
                    >
                      Size Guide
                    </button>
                  </div>
                  <div className="grid grid-cols-4 gap-2.5">
                    {SIZE_CHART.map((item) => (
                      <button
                        key={item.size}
                        type="button"
                        onClick={() => handleSelectSizeInDrawer(item.size)}
                        className="py-3 rounded-[8px] text-[15px] font-medium border border-neutral-300 hover:border-[#111111] hover:bg-neutral-50 bg-white text-[#111111] transition-all cursor-pointer active:scale-95"
                      >
                        {item.size}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* Flow B: Added to Bag confirmation strictly matching User's uploaded screenshot */
              <div>
                {/* Header: Green Checkmark + Added to Bag + Circular Close Button */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    {/* Green checkmark circle icon */}
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

                  {/* Circular Close Button with Light Grey Background */}
                  <button
                    type="button"
                    onClick={closeBagModal}
                    className="w-9 h-9 rounded-full bg-[#f5f5f5] hover:bg-[#e8e8e8] flex items-center justify-center text-[#111111] transition-colors cursor-pointer"
                    aria-label="Close"
                  >
                    <svg
                      className="w-4 h-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Product Info Row strictly matching Screenshot */}
                <div className="mt-6 flex items-start gap-4">
                  {/* Square thumbnail in light grey box */}
                  <div className="w-[104px] h-[104px] sm:w-[112px] sm:h-[112px] bg-[#f5f5f5] rounded-xl flex items-center justify-center  shrink-0">
                    <img
                      src={activeColor.thumb || activeColor.main}
                      alt={product.name}
                      className="w-full h-full object-contain"
                    />
                  </div>

                  {/* Details column */}
                  <div className="flex flex-col text-left">
                    <h3 
                      className="text-[17px] sm:text-[18px] font-medium text-[#111111] leading-snug font-['Helvetica_Now_Text_Medium',sans-serif]"
                      style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
                    >
                      {product.name}
                    </h3>
                    <p className="text-[15px] text-[#707072] mt-0.5 leading-tight">
                      {product.category} ({selectedSize || 'UK 9'})
                    </p>
                    <p className="text-[15px] text-[#707072] mt-0.5 leading-tight">
                      Size {selectedSize || 'UK 9'}
                    </p>
                    <p
                      className="text-[17px] font-medium text-[#111111] mt-2 font-['Helvetica_Now_Text_Medium',sans-serif]"
                      style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
                    >
                      {product.price}
                    </p>
                    <p className="text-[13px] text-[#707072] mt-0.5">
                      Inclusive of all taxes
                    </p>
                  </div>
                </div>

                {/* CTA Button strictly matching Screenshot */}
                <div className="mt-6">
                  <Link
                    href="/checkout"
                    onClick={closeBagModal}
                    className="w-full py-4 rounded-full bg-[#111111] hover:bg-black text-white text-[16px] font-medium text-center transition-all block shadow-md active:scale-[0.99] cursor-pointer"
                  >
                    View Bag ({cartCount})
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. Size Guide Modal strictly matching user's Image 1 reference */}
      {isModalMounted && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Blacked-out backdrop overlay with smooth fade in & fade out */}
          <div
            className={`fixed inset-0 bg-black/60 transition-opacity duration-300 ease-out cursor-pointer ${
              isModalVisible ? 'opacity-100' : 'opacity-0'
            }`}
            onClick={closeSizeGuide}
          />

          {/* Modal / Bottom Sheet with smooth slide up & slide down animation */}
          <div
            className={`fixed inset-x-0 bottom-0 sm:inset-auto sm:top-1/2 sm:left-1/2 w-full sm:max-w-[620px] max-h-[92vh] sm:max-h-[88vh] bg-white rounded-t-[26px] sm:rounded-[24px] shadow-2xl z-50 px-6 pt-6 pb-8 overflow-y-auto transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
              isModalVisible
                ? 'translate-y-0 opacity-100 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:scale-100'
                : 'translate-y-full opacity-0 sm:-translate-x-1/2 sm:-translate-y-[45%] sm:scale-95'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header: Title on Left, Thin Close Icon on Right */}
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-[26px] sm:text-[28px] font-medium text-[#111111] tracking-tight leading-tight">
                  Size Guide
                </h2>
                <p className="text-[15px] text-[#707072] mt-1">
                  {product.name} {product.category}
                </p>
              </div>

              {/* Clean Minimal Close ✕ Button */}
              <button
                type="button"
                onClick={closeSizeGuide}
                className="p-1 text-[#111111] hover:opacity-60 transition-opacity cursor-pointer mt-0.5"
                aria-label="Close Size Guide"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Subtext */}
            <p className="text-[16px] text-[#111111] font-normal mt-7 mb-4">
              Below are product's physical dimensions
            </p>

            {/* in / cm Pill Switcher strictly matching Image 1 */}
            <div className="mb-6">
              <div className="relative inline-flex items-center bg-[#f5f5f5] rounded-full p-1 h-[44px]">
                {/* Sliding black-outlined pill indicator */}
                <div
                  className={`absolute top-1 bottom-1 w-[52px] rounded-full bg-white border border-[#111111] shadow-xs transition-all duration-300 ease-in-out ${
                    unit === 'in' ? 'left-1' : 'left-[55px]'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setUnit('in')}
                  className={`relative z-10 w-[52px] h-[36px] flex items-center justify-center text-[15px] font-medium transition-colors cursor-pointer ${
                    unit === 'in' ? 'text-[#111111]' : 'text-[#707072]'
                  }`}
                >
                  in
                </button>
                <button
                  type="button"
                  onClick={() => setUnit('cm')}
                  className={`relative z-10 w-[52px] h-[36px] flex items-center justify-center text-[15px] font-medium transition-colors cursor-pointer ${
                    unit === 'cm' ? 'text-[#111111]' : 'text-[#707072]'
                  }`}
                >
                  cm
                </button>
              </div>
            </div>

            {/* Grid Table strictly matching Image 1 */}
            <div className="w-full overflow-x-auto border border-[#e5e5e5]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#e5e5e5]">
                    <th className="py-3.5 px-4 font-medium text-[#111111] bg-white border-r border-[#e5e5e5] align-top whitespace-nowrap min-w-[76px] text-[14px]">
                      Size
                    </th>
                    <th className="py-3.5 px-3.5 font-medium text-[#111111] bg-[#fafafa] border-r border-[#e5e5e5] align-top leading-tight min-w-[105px] text-[14px]">
                      Product<br />Foot<br />Length
                    </th>
                    <th className="py-3.5 px-3.5 font-medium text-[#111111] bg-white border-r border-[#e5e5e5] align-top leading-tight min-w-[95px] text-[14px]">
                      Product<br />US Size
                    </th>
                    <th className="py-3.5 px-3.5 font-medium text-[#111111] bg-[#fafafa] border-r border-[#e5e5e5] align-top leading-tight min-w-[95px] text-[14px]">
                      Product<br />EU Size
                    </th>
                    <th className="py-3.5 px-3.5 font-medium text-[#111111] bg-white align-top leading-tight min-w-[95px] text-[14px]">
                      Product<br />CM/JP
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e5e5e5]">
                  {SIZE_CHART.map((row) => (
                    <tr key={row.size}>
                      <td className="py-4 px-4 font-bold text-[#111111] bg-white border-r border-[#e5e5e5] whitespace-nowrap text-[15px]">
                        {row.size}
                      </td>
                      <td className="py-4 px-3.5 font-normal text-[#111111] bg-[#fafafa] border-r border-[#e5e5e5] whitespace-nowrap text-[15px] transition-all duration-200">
                        {unit === 'in' ? row.inLength : row.cmLength}
                      </td>
                      <td className="py-4 px-3.5 font-normal text-[#111111] bg-white border-r border-[#e5e5e5] whitespace-nowrap text-[15px]">
                        {row.us}
                      </td>
                      <td className="py-4 px-3.5 font-normal text-[#111111] bg-[#fafafa] border-r border-[#e5e5e5] whitespace-nowrap text-[15px]">
                        {row.eu}
                      </td>
                      <td className="py-4 px-3.5 font-normal text-[#111111] bg-white whitespace-nowrap text-[15px]">
                        {row.cmJp}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
