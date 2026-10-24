'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { FRESH_DROPS } from '@/components/home/freshDropsData';
import { addToCart } from '@/components/cart/cartStore';

export default function FavouritesClient() {
  const [wishlistMap, setWishlistMap] = useState({});
  const [isLoaded, setIsLoaded] = useState(false);
  const [selectedSizes, setSelectedSizes] = useState({});
  const [addedItemKey, setAddedItemKey] = useState(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('sonu_wishlist');
      if (raw) {
        setWishlistMap(JSON.parse(raw));
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

  const handleSelectSize = (productId, size) => {
    setSelectedSizes((prev) => ({ ...prev, [productId]: size }));
  };

  const handleMoveToBag = (product) => {
    const size = selectedSizes[product.id] || 'UK 8';
    addToCart({
      id: product.id,
      name: product.name,
      category: product.category,
      price: product.priceNumber || 13995,
      priceFormatted: product.price || `₹${(product.priceNumber || 13995).toLocaleString('en-IN')}`,
      image: product.image,
      size,
      quantity: 1,
      color: product.colorways?.[0] || 'Standard',
    });

    setAddedItemKey(product.id);
    setTimeout(() => {
      setAddedItemKey(null);
    }, 2000);
  };

  const favouritedProducts = FRESH_DROPS.filter((p) => wishlistMap[p.id] || wishlistMap[p.slug]);
  const count = favouritedProducts.length;

  if (!isLoaded) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-['Helvetica_Now_Text',sans-serif] text-[#111111] pb-24 pt-6 sm:pt-10">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Breadcrumb & Title */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-[#e5e5e5] pb-5 gap-3">
          <div>
            <h1
              className="text-[26px] sm:text-[32px] font-bold text-[#111111] tracking-tight font-['Helvetica_Now_Text_Medium',sans-serif]"
              style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
            >
              Favourites
            </h1>
            <p className="text-[14px] text-[#707072] mt-0.5">
              {count} {count === 1 ? 'item' : 'items'} saved to your wishlist
            </p>
          </div>
          {count > 0 && (
            <Link
              href="/"
              className="text-[13px] font-medium text-[#111111] underline hover:text-[#707072] self-start sm:self-auto"
            >
              Discover More Drops
            </Link>
          )}
        </div>

        {/* Content Area */}
        {count === 0 ? (
          /* Empty State */
          <div className="py-24 text-center max-w-[480px] mx-auto space-y-5">
            <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mx-auto text-neutral-500">
              <svg viewBox="0 0 24 24" width="28px" height="28px" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
                />
              </svg>
            </div>
            <div>
              <h2
                className="text-[20px] font-bold text-[#111111] font-['Helvetica_Now_Text_Medium',sans-serif]"
                style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
              >
                No favourites saved yet
              </h2>
              <p className="text-[14px] text-[#707072] mt-1.5 leading-relaxed">
                Items added to your Favourites from product pages will be saved here so you can easily review and move them to your bag.
              </p>
            </div>
            <Link
              href="/#fresh-drops"
              className="inline-flex items-center justify-center px-8 py-3.5 rounded-full bg-[#111111] hover:bg-black text-white text-[14px] font-medium transition-all shadow-sm active:scale-[0.99]"
            >
              Explore Fresh Drops
            </Link>
          </div>
        ) : (
          /* Grid of Favourited Shoes */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 pt-8">
            {favouritedProducts.map((product) => {
              const currentSize = selectedSizes[product.id] || 'UK 8';
              const isAdded = addedItemKey === product.id;

              return (
                <div
                  key={product.id}
                  className="group flex flex-col justify-between border border-[#e5e5e5] rounded-[20px] p-4 sm:p-5 hover:shadow-md transition-all bg-white relative"
                >
                  {/* Top Bar: Category & Remove Heart Button */}
                  <div className="flex items-center justify-between z-10">
                    <span className="text-[11px] uppercase tracking-wider text-[#707072] font-semibold">
                      {product.category || 'Running Shoes'}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeFavourite(product.id)}
                      className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center transition-colors text-red-500 cursor-pointer"
                      title="Remove from Favourites"
                      aria-label="Remove from Favourites"
                    >
                      <svg viewBox="0 0 24 24" width="18px" height="18px" fill="currentColor">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                      </svg>
                    </button>
                  </div>

                  {/* Product Image Clickable Link (No BG, No Padding) */}
                  <Link
                    href={`/product/${product.slug || product.id}`}
                    className="block my-3 cursor-pointer overflow-hidden"
                  >
                    <img
                      src={product.image}
                      alt={product.alt || product.name}
                      className="w-full aspect-square object-contain group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  </Link>

                  {/* Title and Price */}
                  <div>
                    <Link
                      href={`/product/${product.slug || product.id}`}
                      className="text-[17px] font-bold text-[#111111] hover:text-[#707072] transition-colors leading-snug line-clamp-1 font-['Helvetica_Now_Text_Medium',sans-serif]"
                      style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
                    >
                      {product.name}
                    </Link>
                    <p className="text-[15px] font-semibold text-[#111111] mt-1">
                      {product.price || `₹${(product.priceNumber || 13995).toLocaleString('en-IN')}`}
                    </p>

                    {/* Quick Size Select Selector */}
                    <div className="mt-4 pt-3 border-t border-[#f0f0f0]">
                      <p className="text-[11px] uppercase tracking-wider text-[#707072] font-semibold mb-2">
                        Select Size (UK)
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {['UK 4', 'UK 5', 'UK 6', 'UK 7', 'UK 8', 'UK 9'].map((sz) => (
                          <button
                            key={sz}
                            type="button"
                            onClick={() => handleSelectSize(product.id, sz)}
                            className={`text-[12px] font-medium px-2.5 py-1 rounded-md border transition-all cursor-pointer ${
                              currentSize === sz
                                ? 'bg-[#111111] text-white border-[#111111]'
                                : 'bg-white text-[#111111] border-[#e5e5e5] hover:border-black'
                            }`}
                          >
                            {sz}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Move to Bag Action Button */}
                    <button
                      type="button"
                      onClick={() => handleMoveToBag(product)}
                      className={`w-full mt-4 py-3 rounded-full text-[14px] font-medium transition-all shadow-sm cursor-pointer flex items-center justify-center gap-2 font-['Helvetica_Now_Text_Medium',sans-serif] ${
                        isAdded
                          ? 'bg-emerald-700 text-white'
                          : 'bg-[#111111] hover:bg-black text-white active:scale-[0.99]'
                      }`}
                      style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
                    >
                      {isAdded ? (
                        <>
                          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <span>Added to Bag!</span>
                        </>
                      ) : (
                        `Move to Bag • ${currentSize}`
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
