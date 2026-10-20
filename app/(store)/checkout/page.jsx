'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  getCartItems,
  removeFromCart,
  updateCartQuantity,
  clearCart,
} from '@/components/cart/cartStore';

export default function CheckoutPage() {
  const [cartItems, setCartItems] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [wishlist, setWishlist] = useState({});

  useEffect(() => {
    const syncCart = () => {
      setCartItems(getCartItems());
      setIsLoaded(true);
    };

    syncCart();
    window.addEventListener('cart-updated', syncCart);
    window.addEventListener('storage', syncCart);

    return () => {
      window.removeEventListener('cart-updated', syncCart);
      window.removeEventListener('storage', syncCart);
    };
  }, []);

  const totalQuantity = cartItems.reduce((acc, item) => acc + (item.quantity || 1), 0);
  const subtotal = cartItems.reduce(
    (acc, item) => acc + (item.priceNumber || 13995) * (item.quantity || 1),
    0
  );

  const toggleWishlist = (key) => {
    setWishlist((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleCheckout = () => {
    const user = typeof window !== 'undefined' ? localStorage.getItem('sonu_user_mobile') : null;
    if (!user) {
      window.dispatchEvent(new CustomEvent('open-login-modal'));
      return;
    }
    setOrderPlaced(true);
    clearCart();
  };

  // Loading state while checking localStorage on client
  if (!isLoaded) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[50vh]">
        <div className="w-6 h-6 border-2 border-[#111111] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Order Success Screen
  if (orderPlaced) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center select-none font-['Helvetica_Now_Text',sans-serif]">
        <div className="w-14 h-14 rounded-full bg-[#008a00] flex items-center justify-center text-white mb-4">
          <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h1 className="text-[26px] sm:text-[32px] font-bold text-[#111111] tracking-tight">
          Thank you for your order!
        </h1>
        <p className="text-[15px] text-[#707072] mt-2 max-w-[380px] leading-relaxed">
          Your footwear order has been confirmed and is being prepared for dispatch with free express delivery.
        </p>
        <Link
          href="/"
          className="mt-8 px-8 py-3.5 bg-[#111111] hover:bg-black text-white text-[15px] font-medium rounded-full transition-all"
        >
          Continue Shopping
        </Link>
      </div>
    );
  }

  // Empty Bag Screen
  if (cartItems.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center select-none font-['Helvetica_Now_Text',sans-serif]">
        <div className="w-full max-w-[360px] flex flex-col items-center">
          <h1 
            className="text-[24px] sm:text-[28px] font-medium text-[#111111] tracking-tight font-['Helvetica_Now_Text_Medium',sans-serif]"
            style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
          >
            Bag
          </h1>
          <p className="text-[14px] sm:text-[15px] text-[#707072] mt-1 mb-8">
            0 items | ₹0
          </p>
          <div className="w-full border-t border-[#e5e5e5] mb-8" />
          <p className="text-[16px] text-[#707072] mb-8 font-normal">
            There are no items in your bag.
          </p>
          <Link
            href="/#fresh-drops"
            className="w-full py-4 bg-[#111111] text-white text-[15px] font-medium rounded-full text-center hover:bg-neutral-800 active:scale-[0.99] transition-all"
          >
            Explore Fresh Drops
          </Link>
        </div>
      </div>
    );
  }

  // Active Bag Screen strictly matching user's design screenshots
  return (
    <div className="w-full max-w-[540px] mx-auto px-5 sm:px-6 pt-6 sm:pt-10 pb-0 font-['Helvetica_Now_Text',sans-serif] select-none text-[#111111]">
      {/* Centered Bag Header */}
      <div className="text-center pt-2">
        <h1 
          className="text-[24px] sm:text-[26px] font-medium tracking-tight text-[#111111] font-['Helvetica_Now_Text_Medium',sans-serif]"
          style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
        >
          Bag
        </h1>
        <p className="text-[14px] sm:text-[15px] text-[#707072] mt-1">
          {totalQuantity} {totalQuantity === 1 ? 'item' : 'items'} | ₹{subtotal.toLocaleString('en-IN')}
        </p>
      </div>

      {/* Top Divider Line */}
      <div className="border-t border-[#e5e5e5] mt-6 mb-7" />

      {/* Bag Items List */}
      <div className="space-y-8">
        {cartItems.map((item, idx) => {
          const itemKey = `${item.id}-${item.size}-${item.color}-${idx}`;
          const isFavourited = wishlist[itemKey];

          return (
            <div key={itemKey}>
              {/* Product Info Row: Thumbnail on left, Details on right */}
              <div className="flex gap-4 sm:gap-5 items-start">
                {/* Square Product Image */}
                <div className="w-[124px] h-[124px] sm:w-[136px] sm:h-[136px] bg-[#f5f5f5] shrink-0 flex items-center justify-center">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-contain mix-blend-multiply"
                  />
                </div>

                {/* Details Column */}
                <div className="flex-1 min-w-0 pt-0.5">
                  {/* Price */}
                  <p className="text-[17px] sm:text-[18px] font-bold text-[#111111] leading-none">
                    ₹ {(item.priceNumber || 13995).toLocaleString('en-IN')}
                  </p>

                  {/* Shoe Title */}
                  <h2 
                    className="text-[16px] sm:text-[17px] font-medium text-[#111111] mt-1.5 leading-snug font-['Helvetica_Now_Text_Medium',sans-serif]"
                    style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
                  >
                    {item.name}
                  </h2>

                  {/* Category with size in parentheses */}
                  <p className="text-[14px] text-[#707072] mt-1 leading-normal">
                    {item.category || "Women's Training Shoes"} ({item.size})
                  </p>

                  {/* 14 Day Return */}
                  <p className="text-[14px] text-[#707072] mt-0.5 leading-normal">
                    14 Day Return
                  </p>

                  {/* Underlined Size */}
                  <div className="mt-1">
                    <span className="text-[14px] font-medium text-[#111111] underline underline-offset-4 decoration-1">
                      Size {item.size}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quantity Pill + Wishlist Action Row */}
              <div className="mt-3.5 flex items-center gap-2.5">
                {/* Quantity Control Pill: Trash | Count | + */}
                <div className="inline-flex items-center border border-[#e5e5e5] rounded-full h-10 px-3.5 bg-white">
                  {/* Delete / Trash Button */}
                  <button
                    type="button"
                    onClick={() => removeFromCart(item.id, item.size, item.color)}
                    className="p-1 text-[#111111] hover:text-[#707072] transition-colors cursor-pointer"
                    aria-label="Remove item"
                  >
                    <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" role="img" width="24px" height="24px" fill="none"><path stroke="currentColor" strokeMiterlimit="10" stroke-width="1.5" d="M13.75 10v7m-3.5-7v7m-3.5-8.5V17c0 1.24 1.01 2.25 2.25 2.25h6c1.24 0 2.25-1.01 2.25-2.25V7.75h2.25m-10-3h3.75c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5H4.5"></path></svg>
                  </button>

                  {/* Quantity Display */}
                  <span className="px-3.5 text-[15px] font-medium text-[#111111] min-w-[28px] text-center">
                    {item.quantity || 1}
                  </span>

                  {/* Increment Button */}
                  <button
                    type="button"
                    onClick={() => updateCartQuantity(item.id, item.size, item.color, 1)}
                    className="p-1 text-[#111111] hover:text-[#707072] text-[18px] font-normal transition-colors cursor-pointer leading-none flex items-center justify-center"
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>

                {/* Circular Wishlist / Favourite Button */}
                <button
                  type="button"
                  onClick={() => toggleWishlist(itemKey)}
                  className={`w-10 h-10 rounded-full border border-[#e5e5e5] flex items-center justify-center transition-colors cursor-pointer hover:bg-neutral-50 ${
                    isFavourited ? 'bg-neutral-50 text-red-500' : 'text-[#111111]'
                  }`}
                  aria-label={isFavourited ? 'Remove from favourites' : 'Save to favourites'}
                >
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    className="w-[18px] h-[18px]"
                    fill={isFavourited ? 'currentColor' : 'none'}
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                </button>
              </div>

              {/* Urgency Badge: Clock + Only 1 left */}
              <div className="mt-3 flex items-center gap-1.5 text-[#b07800] text-[14px]">
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="w-4 h-4 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <span>Only 1 left.</span>
              </div>

              {/* Divider between items */}
              <div className="border-t border-[#e5e5e5] mt-6" />
            </div>
          );
        })}
      </div>

      {/* Summary Section strictly matching Image 1 */}
      <section className="pt-8 pb-4" aria-label="Order Summary">
        <h2 className="text-[22px] sm:text-[24px] font-bold text-[#111111] mb-5 tracking-tight">
          Summary
        </h2>

        <div className="space-y-3.5 text-[15px] sm:text-[16px] text-[#111111]">
          {/* Bag Total */}
          <div className="flex items-center justify-between">
            <span>Bag Total</span>
            <span>₹ {subtotal.toLocaleString('en-IN')}</span>
          </div>

          {/* Sub Total */}
          <div className="flex items-center justify-between">
            <span>Sub Total</span>
            <span>₹ {subtotal.toLocaleString('en-IN')}</span>
          </div>

          {/* Shipping Charges */}
          <div className="flex items-center justify-between">
            <span>Shipping Charges</span>
            <span className="text-[#0d8240] font-normal">Free</span>
          </div>
        </div>

        {/* Divider above You Pay */}
        <div className="border-t border-[#e5e5e5] my-4" />

        {/* You Pay */}
        <div className="flex items-center justify-between text-[18px] sm:text-[19px] font-bold text-[#111111]">
          <span>You Pay</span>
          <span>₹ {subtotal.toLocaleString('en-IN')}</span>
        </div>

        {/* Divider below You Pay */}
        <div className="border-t border-[#e5e5e5] mt-4 mb-4" />
      </section>

      {/* Fixed Bottom Bar: Proceed to Buy */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#e5e5e5] h-[88px] flex items-center px-5 sm:px-6 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <div className="max-w-[540px] mx-auto w-full">
          <button
            type="button"
            onClick={handleCheckout}
            className="w-full py-4 rounded-full bg-[#111111] hover:bg-black active:scale-[0.99] text-white text-[16px] font-medium transition-all shadow-sm cursor-pointer font-['Helvetica_Now_Text_Medium',sans-serif]"
            style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
          >
            Proceed to Buy
          </button>
        </div>
      </div>
    </div>
  );
}
