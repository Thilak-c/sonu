'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft,
  ChevronRight,
  Heart,
  ChevronDown,
  RotateCcw,
  Truck,
  X,
} from 'lucide-react';
import { addToCart, getCartItems } from '@/components/cart/cartStore';
import FallbackImage from '@/components/FallbackImage';

const SIZE_CHART = [
  { size: 'UK 3', inLength: '8.8', cmLength: '22.4', us: '5.5', eu: '36', cmJp: '22.5' },
  { size: 'UK 4', inLength: '9.2', cmLength: '23.4', us: '6.5', eu: '37.5', cmJp: '23.5' },
  { size: 'UK 5', inLength: '9.5', cmLength: '24.1', us: '7.5', eu: '38.5', cmJp: '24.5' },
  { size: 'UK 6', inLength: '9.8', cmLength: '24.9', us: '8.5', eu: '40', cmJp: '25.5' },
  { size: 'UK 7', inLength: '10.2', cmLength: '25.9', us: '9.5', eu: '41', cmJp: '26.5' },
  { size: 'UK 8', inLength: '10.5', cmLength: '26.7', us: '10.5', eu: '42.5', cmJp: '27.5' },
  { size: 'UK 9', inLength: '10.8', cmLength: '27.4', us: '11.5', eu: '44', cmJp: '28.5' },
];

export default function ProductDetailClient({ product: initialProduct, initialCatalog = [] }) {
  const router = useRouter();

  const [product, setProduct] = useState(initialProduct);
  const [allCatalog, setAllCatalog] = useState(initialCatalog);
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [selectedSize, setSelectedSize] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [cartCount, setCartCount] = useState(1);
  const [isFavourite, setIsFavourite] = useState(false);
  const [wishlistMap, setWishlistMap] = useState({});

  // Delivery & Pincode State
  const [deliveryPincode, setDeliveryPincode] = useState('800013');
  const [deliveryCity, setDeliveryCity] = useState('PATNA');
  const [deliveryDays, setDeliveryDays] = useState(4);
  const [isPincodeLoading, setIsPincodeLoading] = useState(false);
  const [isPincodeMounted, setIsPincodeMounted] = useState(false);
  const [isPincodeVisible, setIsPincodeVisible] = useState(false);
  const [inputPincode, setInputPincode] = useState('');
  const pincodeTimerRef = useRef(null);

  // Accordion State
  const [isVendorDetailsOpen, setIsVendorDetailsOpen] = useState(false);
  const [isReturnPolicyOpen, setIsReturnPolicyOpen] = useState(false);

  // Modals State with Pop-out Animation
  const [isProductDetailsMounted, setIsProductDetailsMounted] = useState(false);
  const [isProductDetailsVisible, setIsProductDetailsVisible] = useState(false);
  const productDetailsTimerRef = useRef(null);

  const [isKnowMoreMounted, setIsKnowMoreMounted] = useState(false);
  const [isKnowMoreVisible, setIsKnowMoreVisible] = useState(false);
  const [knowMoreType, setKnowMoreType] = useState('return'); // 'return' | 'delivery'
  const knowMoreTimerRef = useRef(null);

  // Added to Bag / Select Size Drawer state
  const [isBagModalMounted, setIsBagModalMounted] = useState(false);
  const [isBagModalVisible, setIsBagModalVisible] = useState(false);
  const [isBagBackdropVisible, setIsBagBackdropVisible] = useState(false);
  const [bagModalMode, setBagModalMode] = useState('added-to-bag'); // 'added-to-bag' | 'select-size'
  const [tempDrawerSize, setTempDrawerSize] = useState(null);
  const bagTimerRef = useRef(null);

  // Size Guide Modal state
  const [isModalMounted, setIsModalMounted] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const closeTimerRef = useRef(null);
  const [unit, setUnit] = useState('in'); // 'in' or 'cm'

  // Carousel refs for desktop bottom sections
  const moreCarouselRef = useRef(null);
  const recentCarouselRef = useRef(null);

  const scrollCarousel = (ref, direction) => {
    if (ref.current) {
      const amount = (ref.current.clientWidth || 800) * (direction === 'left' ? -1 : 1);
      ref.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  // Update product if initialProduct prop changes
  useEffect(() => {
    if (initialProduct) {
      setProduct(initialProduct);
    }
  }, [initialProduct]);

  // Auto-detect location via IP Geolocation or saved localStorage address, and compute expected delivery date
  useEffect(() => {
    let isCancelled = false;

    // Load wishlist
    try {
      const savedWishlist =
        localStorage.getItem('sonu_wishlist') ||
        localStorage.getItem('aw_wishlist');
      if (savedWishlist) setWishlistMap(JSON.parse(savedWishlist));
    } catch {
      // ignore
    }

    const checkPincodeService = async (pin, currentCity) => {
      try {
        const sRes = await fetch(`/api/shiprocket/serviceability?pincode=${pin}`);
        if (sRes.ok) {
          const sData = await sRes.json();
          if (!isCancelled && sData?.data) {
            if (sData.data.city && !currentCity) {
              setDeliveryCity(sData.data.city.toUpperCase());
            }
            if (sData.data.estimatedDays) {
              const days = parseInt(sData.data.estimatedDays, 10);
              if (!isNaN(days) && days > 0) {
                setDeliveryDays(days);
              }
            }
          }
        }
      } catch {
        // keep default delivery timeline
      }
    };

    const detectLocation = async () => {
      let activePincode = null;
      let activeCity = null;

      // 1. Check if user already saved an address
      try {
        const saved =
          localStorage.getItem('sonu_shipping_address') ||
          localStorage.getItem('aw_shipping_address');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.pincode && /^\d{6}$/.test(parsed.pincode)) {
            activePincode = parsed.pincode;
            if (parsed.city) activeCity = parsed.city.toUpperCase();
          }
        }
      } catch {
        // ignore
      }

      // 2. If no saved address, auto-detect location via IP Geolocation
      if (!activePincode) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 4000);
          const response = await fetch('https://ipapi.co/json/', { signal: controller.signal });
          clearTimeout(timeoutId);
          if (response.ok) {
            const loc = await response.json();
            if (loc && !loc.error) {
              if (loc.postal && /^\d{6}$/.test(loc.postal.replace(/\D/g, ''))) {
                activePincode = loc.postal.replace(/\D/g, '');
              }
              if (loc.city) {
                activeCity = loc.city.toUpperCase();
              }
            }
          }
        } catch (err) {
          console.warn('IP Geolocation fallback used:', err);
        }
      }

      // 3. Fallback defaults if detection was blocked or unavailable
      if (!activePincode) activePincode = '800013';
      if (!activeCity) activeCity = 'PATNA';

      if (!isCancelled) {
        setDeliveryPincode(activePincode);
        setDeliveryCity(activeCity);
      }

      // 4. Fetch expected delivery date for the active pincode
      await checkPincodeService(activePincode, activeCity);
    };

    detectLocation();

    return () => {
      isCancelled = true;
    };
  }, []);

  // Sync isFavourite state for this product
  useEffect(() => {
    if (product) {
      const pid = product.id || product.slug || product.itemId;
      if (pid && wishlistMap[pid]) {
        setIsFavourite(true);
      } else {
        setIsFavourite(false);
      }
    }
  }, [product, wishlistMap]);

  // Maintain Recently Viewed in localStorage
  useEffect(() => {
    if (!product) return;
    const pid = product.id || product.slug || product.itemId;
    const timer = setTimeout(() => {
      try {
        const stored = JSON.parse(localStorage.getItem('sonu_recently_viewed') || '[]');
        if (Array.isArray(stored)) {
          setRecentlyViewed(stored.filter((it) => it.id !== pid && it.itemId !== pid));
        }

        const filtered = Array.isArray(stored)
          ? stored.filter((it) => it.id !== pid && it.itemId !== pid)
          : [];
        filtered.unshift({
          id: pid,
          itemId: pid,
          name: product.name,
          category: product.category || 'Handcrafted Footwear',
          price: product.price,
          priceNumber: product.priceNumber || 13995,
          image: product.image || product.mainImage,
          mainImage: product.image || product.mainImage,
        });
        localStorage.setItem('sonu_recently_viewed', JSON.stringify(filtered.slice(0, 10)));
      } catch {
        // ignore
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [product]);

  // Wishlist toggle helper
  const toggleProductWishlist = () => {
    if (!product) return;
    const pid = product.id || product.slug || product.itemId;
    const nextState = !isFavourite;
    setIsFavourite(nextState);
    setWishlistMap((prev) => {
      const next = { ...prev, [pid]: nextState };
      try {
        localStorage.setItem('sonu_wishlist', JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const toggleCardWishlist = (itemId) => {
    setWishlistMap((prev) => {
      const next = { ...prev, [itemId]: !prev[itemId] };
      try {
        localStorage.setItem('sonu_wishlist', JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const deliveryDateFormatted = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + (deliveryDays || 4));
    return d.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  }, [deliveryDays]);

  // Sync initial and ongoing cart count
  useEffect(() => {
    const syncCount = () => {
      const items = getCartItems();
      const count = items.reduce((acc, it) => acc + (it.quantity || 1), 0);
      setCartCount(count);
    };
    syncCount();
    window.addEventListener('cart-updated', syncCount);
    window.addEventListener('storage', syncCount);
    return () => {
      window.removeEventListener('cart-updated', syncCount);
      window.removeEventListener('storage', syncCount);
    };
  }, []);

  // Modal / Drawer handlers
  const openBagModal = (mode = 'added-to-bag') => {
    if (bagTimerRef.current) clearTimeout(bagTimerRef.current);
    setBagModalMode(mode);
    if (mode === 'select-size') {
      setTempDrawerSize(selectedSize || null);
    }
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

  const openKnowMore = (type) => {
    if (knowMoreTimerRef.current) clearTimeout(knowMoreTimerRef.current);
    setKnowMoreType(type);
    setIsKnowMoreMounted(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setIsKnowMoreVisible(true);
      });
    });
  };

  const closeKnowMore = () => {
    setIsKnowMoreVisible(false);
    knowMoreTimerRef.current = setTimeout(() => {
      setIsKnowMoreMounted(false);
    }, 320);
  };

  const openProductDetails = () => {
    if (productDetailsTimerRef.current) clearTimeout(productDetailsTimerRef.current);
    setIsProductDetailsMounted(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setIsProductDetailsVisible(true);
      });
    });
  };

  const closeProductDetails = () => {
    setIsProductDetailsVisible(false);
    productDetailsTimerRef.current = setTimeout(() => {
      setIsProductDetailsMounted(false);
    }, 320);
  };

  const openPincodeModal = () => {
    if (pincodeTimerRef.current) clearTimeout(pincodeTimerRef.current);
    setInputPincode(deliveryPincode);
    setIsPincodeMounted(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setIsPincodeVisible(true);
      });
    });
  };

  const closePincodeModal = () => {
    setIsPincodeVisible(false);
    pincodeTimerRef.current = setTimeout(() => {
      setIsPincodeMounted(false);
    }, 320);
  };

  // Close modals on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (isModalMounted) closeSizeGuide();
        if (isBagModalMounted) closeBagModal();
        if (isKnowMoreMounted) closeKnowMore();
        if (isProductDetailsMounted) closeProductDetails();
        if (isPincodeMounted) closePincodeModal();
      }
    };
    const anyModalOpen =
      isModalMounted ||
      isBagModalMounted ||
      isKnowMoreMounted ||
      isProductDetailsMounted ||
      isPincodeMounted;

    if (anyModalOpen) {
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
      if (knowMoreTimerRef.current) clearTimeout(knowMoreTimerRef.current);
      if (productDetailsTimerRef.current) clearTimeout(productDetailsTimerRef.current);
      if (pincodeTimerRef.current) clearTimeout(pincodeTimerRef.current);
    };
  }, [
    isModalMounted,
    isBagModalMounted,
    isKnowMoreMounted,
    isProductDetailsMounted,
    isPincodeMounted,
  ]);

  // Handle Add to Bag
  const handleAddToBag = () => {
    if (!product) return;

    if (!selectedSize) {
      openBagModal('select-size');
      return;
    }

    const updated = addToCart({
      id: product.id || product.slug,
      name: product.name,
      category: product.category,
      price: product.price || `₹${(product.priceNumber || 13995).toLocaleString('en-IN')}`,
      priceNumber: product.priceNumber || 13995,
      size: selectedSize,
      availableSizes: availableSizesList,
      color: Array.isArray(product.colorways) ? product.colorways[0] : (product.color || 'Signature Tone'),
      image: productImages[0] || product.image || product.mainImage,
    });
    const totalCount = updated.reduce((acc, it) => acc + (it.quantity || 1), 0);
    setCartCount(totalCount);
    openBagModal('added-to-bag');
  };

  const handleSelectSizeInDrawer = (sz) => {
    setSelectedSize(sz);
    const updated = addToCart({
      id: product.id || product.slug,
      name: product.name,
      category: product.category,
      price: product.price || `₹${(product.priceNumber || 13995).toLocaleString('en-IN')}`,
      priceNumber: product.priceNumber || 13995,
      size: sz,
      availableSizes: availableSizesList,
      color: Array.isArray(product.colorways) ? product.colorways[0] : (product.color || 'Signature Tone'),
      image: productImages[0] || product.image || product.mainImage,
    });
    const totalCount = updated.reduce((acc, it) => acc + (it.quantity || 1), 0);
    setCartCount(totalCount);

    setIsBagModalVisible(false);
    if (bagTimerRef.current) clearTimeout(bagTimerRef.current);
    bagTimerRef.current = setTimeout(() => {
      setBagModalMode('added-to-bag');
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsBagModalVisible(true);
        });
      });
    }, 320);
  };

  if (!product) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center font-['Helvetica_Now_Text',sans-serif]">
        <h1 className="text-[20px] font-medium text-[#111111] mb-3">Product not found</h1>
        <Link href="/" className="px-6 py-2.5 bg-[#111111] text-white rounded-full text-[14px]">
          Back to Shop
        </Link>
      </div>
    );
  }

  // Image collection
  const productImages = [
    product.image || product.mainImage,
    ...(product.gallery || product.otherImages || []),
  ].filter(Boolean);

  const activeImage = productImages[currentImageIndex] || productImages[0];

  const formattedPrice =
    typeof product.price === 'string'
      ? product.price
      : `₹${(product.priceNumber || product.price || 13995).toLocaleString('en-IN')}`;

  const availableSizesList =
    product.availableSizes && product.availableSizes.length > 0
      ? product.availableSizes
      : ['UK 3', 'UK 4', 'UK 5', 'UK 6', 'UK 7', 'UK 8', 'UK 9'];

  const swatches = (() => {
    const siblings = (allCatalog || []).filter(
      (p) =>
        (p.id || p.slug) !== (product.id || product.slug) &&
        (p.category === product.category || p.name?.split(' ')[0] === product.name?.split(' ')[0])
    );
    const list = [
      product,
      ...(siblings.length > 0
        ? siblings
        : (allCatalog || []).filter((p) => (p.id || p.slug) !== (product.id || product.slug))),
    ];
    return list.slice(0, 4);
  })();

  return (
    <div className="w-full bg-white select-none font-['Helvetica_Now_Text',sans-serif] text-[#111111] pb-20">
      {/* Main Container */}
      <div className="w-full px-5 sm:px-6 lg:px-8 pt-4 sm:pt-6">
        <div className="max-w-[1200px] xl:max-w-[1240px] mx-auto">

        {/* Mobile Header (Hidden on Desktop) */}
        <div className="flex flex-col text-left mb-5 lg:hidden">
          <span className="text-[#c83200] text-[15px] sm:text-[16px] font-medium leading-none mb-1.5">
            Just In
          </span>

          <h1
            className="text-[26px] sm:text-[28px] font-medium text-[#111111] tracking-[-0.02em] leading-[1.15] font-['Helvetica_Now_Text_Medium',sans-serif]"
            style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
          >
            {product.name}
          </h1>

          <p className="text-[15.5px] sm:text-[16px] text-[#707072] mt-1 leading-normal font-normal">
            {product.category || 'Handcrafted Footwear'}
          </p>

          <p
            className="text-[17px] sm:text-[18px] font-medium text-[#111111] mt-3.5 font-['Helvetica_Now_Text_Medium',sans-serif]"
            style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
          >
            {formattedPrice}
          </p>

          <p className="text-[14px] text-[#707072] mt-1">
            Inclusive of all taxes
          </p>
        </div>

        {/* 2-Column Product Layout on Desktop */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:gap-10 xl:gap-14">
          
          {/* Left Column: Vertical Thumbnails & Main Image Gallery */}
          <div className="w-full lg:flex-1 flex flex-col lg:flex-row gap-3 lg:gap-4 xl:gap-5 lg:sticky lg:top-24">
            
            {/* Desktop Vertical Thumbnails */}
            {productImages.length > 1 && (
              <div className="hidden lg:flex flex-col gap-2.5 w-[60px] xl:w-[64px] shrink-0 max-h-[520px] overflow-y-auto scrollbar-none py-0.5">
                {productImages.map((img, idx) => (
                  <button
                    key={`desk-thumb-${idx}`}
                    type="button"
                    onMouseEnter={() => setCurrentImageIndex(idx)}
                    onClick={() => setCurrentImageIndex(idx)}
                    className={`w-full aspect-square rounded-[8px] overflow-hidden flex items-center justify-center cursor-pointer transition-all p-0 ${
                      currentImageIndex === idx
                        ? 'border-[1.5px] border-[#111111]'
                        : 'border border-neutral-200 hover:border-neutral-400 opacity-80 hover:opacity-100'
                    }`}
                    aria-label={`View image ${idx + 1}`}
                  >
                    <img src={img} alt="" className="w-full h-full object-contain" />
                  </button>
                ))}
              </div>
            )}

            {/* Main Hero Image Area */}
            <div className="flex-1 w-full aspect-square relative overflow-hidden flex items-center justify-center p-0 m-0 group">
              <FallbackImage
                src={activeImage}
                alt={product.name}
                className="w-full h-full object-contain"
                logoSize="w-8 h-8"
              />

              {/* Bottom Right Round Navigation Arrows */}
              {productImages.length > 1 && (
                <div className="absolute bottom-3.5 right-3.5 flex items-center gap-2 z-10">
                  <button
                    type="button"
                    onClick={() =>
                      setCurrentImageIndex(
                        (prev) => (prev - 1 + productImages.length) % productImages.length
                      )
                    }
                    className="w-9 h-9 rounded-full bg-white hover:bg-neutral-100 flex items-center justify-center  transition-all cursor-pointer"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="w-4 h-4 text-[#111111]" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setCurrentImageIndex((prev) => (prev + 1) % productImages.length)
                    }
                    className="w-9 h-9 rounded-full bg-white hover:bg-neutral-100 flex items-center justify-center  transition-all cursor-pointer"
                    aria-label="Next image"
                  >
                    <ChevronRight className="w-4 h-4 text-[#111111]" />
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Carousel Pagination Dots */}
            {productImages.length > 1 && (
              <div className="flex lg:hidden items-center justify-center gap-2 py-2">
                {productImages.map((_, idx) => (
                  <button
                    key={`mob-dot-${idx}`}
                    type="button"
                    onClick={() => setCurrentImageIndex(idx)}
                    className={`transition-all rounded-full cursor-pointer ${
                      currentImageIndex === idx
                        ? 'w-5 h-2 bg-[#111111]'
                        : 'w-2 h-2 bg-[#d2d2d2] hover:bg-[#8d8d8d]'
                    }`}
                    aria-label={`Slide ${idx + 1}`}
                  />
                ))}
              </div>
            )}

          </div>

          {/* Right Column: Details, Sizes, CTAs, Delivery, Accordions */}
          <div className="w-full lg:w-[380px] xl:w-[410px] shrink-0 mt-6 lg:mt-0">
            {/* Desktop Header */}
            <div className="hidden lg:flex flex-col text-left mb-6">
              <span className="text-[#c83200] text-[15px] xl:text-[16px] font-medium leading-none mb-1.5">
                Just In
              </span>
              <h1
                className="text-[26px] xl:text-[28px] font-medium text-[#111111] tracking-[-0.02em] leading-[1.15] font-['Helvetica_Now_Text_Medium',sans-serif]"
                style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
              >
                {product.name}
              </h1>
              <p className="text-[15.5px] xl:text-[16px] text-[#707072] mt-1 leading-normal font-normal">
                {product.category || 'Handcrafted Footwear'}
              </p>
              <p
                className="text-[17px] xl:text-[18px] font-medium text-[#111111] mt-3.5 font-['Helvetica_Now_Text_Medium',sans-serif]"
                style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
              >
                {formattedPrice}
              </p>
              <p className="text-[14px] text-[#707072] mt-1">
                Inclusive of all taxes
              </p>
            </div>

            {/* Colorway Swatches */}
            {swatches.length > 1 && (
              <div className="mb-6">
                <div className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-none">
                  {swatches.map((swatch, sIdx) => {
                    const isCurrent = (swatch.id || swatch.slug) === (product.id || product.slug);
                    return (
                      <button
                        key={`swatch-${swatch.id || swatch.slug}-${sIdx}`}
                        type="button"
                        onClick={() => {
                          if (!isCurrent) {
                            router.push(`/product/${swatch.id || swatch.slug}`);
                          }
                        }}
                        className={`w-[72px] h-[72px] sm:w-[76px] sm:h-[76px] aspect-square rounded-[8px] p-0 transition-all cursor-pointer overflow-hidden flex items-center justify-center shrink-0 ${
                          isCurrent
                            ? 'border-[1.5px] border-[#111111]'
                            : 'border border-neutral-200 hover:border-neutral-400'
                        }`}
                        title={swatch.name}
                      >
                        <img
                          src={swatch.image || swatch.mainImage}
                          alt={swatch.name}
                          className="w-full h-full object-contain"
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Size Selection Section */}
            <div className="mt-6 sm:mt-7">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[16px] font-medium text-[#111111]">
                  Select Size
                </span>

                <button
                  type="button"
                  onClick={openSizeGuide}
                  className="flex items-center gap-1.5 text-[15px] font-medium text-[#111111] hover:opacity-70 transition-opacity cursor-pointer"
                >
                  <svg
                    aria-hidden="true"
                    focusable="false"
                    viewBox="0 0 24 24"
                    role="img"
                    width="19px"
                    height="19px"
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

              {/* Size Buttons Grid (4 columns) */}
              <div className="grid grid-cols-4 gap-2 sm:gap-2.5">
                {availableSizesList.map((size) => {
                  const isSelected = selectedSize === size;
                  return (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setSelectedSize(size)}
                      className={`h-[52px] sm:h-[54px] rounded-[8px] flex items-center justify-center text-[15px] sm:text-[16px] font-medium transition-all cursor-pointer ${
                        isSelected
                          ? 'border-2 border-[#111111] bg-white text-[#111111] '
                          : 'border border-[#e5e5e5] bg-white text-[#111111] hover:border-[#111111]'
                      }`}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="mt-8 flex flex-col gap-3">
              <button
                type="button"
                onClick={handleAddToBag}
                className="w-full h-[58px] sm:h-[62px] rounded-full text-white text-[16px] font-medium transition-all  active:scale-[0.99] cursor-pointer bg-[#111111] hover:bg-black font-['Helvetica_Now_Text_Medium',sans-serif] flex items-center justify-center"
                style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
              >
                Add to Bag
              </button>

              <button
                type="button"
                onClick={toggleProductWishlist}
                className="w-full h-[58px] sm:h-[62px] rounded-full border border-[#cacacb] hover:border-[#111111] bg-white text-[#111111] text-[16px] font-medium flex items-center justify-center gap-2 transition-all active:scale-[0.99] cursor-pointer font-['Helvetica_Now_Text_Medium',sans-serif]"
                style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
              >
                <span>Favourite</span>
                <Heart
                  className={`w-5 h-5 ml-0.5 transition-colors ${
                    isFavourite ? 'fill-rose-500 text-rose-500' : 'text-[#111111]'
                  }`}
                />
              </button>
            </div>

            {/* Description & Style Block */}
            <div className="mt-9 sm:mt-10">
              <p className="text-[15.5px] sm:text-[16px] leading-[1.65] text-[#111111] font-normal">
                {product.description ||
                  'Handcrafted in small runs with ergonomic gum rubber soles, full-grain leather, and anatomical arch support engineered for 15,000+ daily steps with zero fatigue.'}
              </p>

              <div className="mt-5 space-y-1 text-[14.5px] sm:text-[15px] text-[#111111] leading-relaxed">
                <p>
                  • Colour Shown:{' '}
                  {Array.isArray(product.colorways)
                    ? product.colorways.join(' / ')
                    : (product.color || 'Signature Raw Tone')}
                </p>
                <p>• Style: {product.id || product.slug || 'SN-01-ARCHIVE'}</p>
              </div>

              <button
                type="button"
                onClick={openProductDetails}
                className="mt-4 text-[15px] font-medium text-[#111111] underline underline-offset-4 decoration-1 hover:text-[#707072] active:scale-[0.98] transition-transform cursor-pointer inline-block"
              >
                View Product Details
              </button>
            </div>

            {/* Delivery & Address */}
            <div className="mt-8 pt-6 border-t border-[#f0f0f0]">
              <h3
                className="text-[16px] font-medium text-[#111111] font-['Helvetica_Now_Text_Medium',sans-serif]"
                style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
              >
                Delivery by {deliveryDateFormatted}
              </h3>
              <div className="flex items-center justify-between mt-1 text-[14px]">
                <span className="text-[#707072]">
                  To {deliveryPincode}, {deliveryCity}
                </span>
                <button
                  type="button"
                  onClick={openPincodeModal}
                  className="font-medium text-[#111111] underline hover:text-[#707072] active:scale-[0.98] transition-transform cursor-pointer"
                >
                  Change
                </button>
              </div>

              {/* Delivery Perks */}
              <div className="mt-4 space-y-2.5">
                <div
                  onClick={() => openKnowMore('return')}
                  className="flex items-center justify-between group cursor-pointer py-1.5 -my-0.5 px-2.5 -mx-2.5 rounded-[8px] hover:bg-[#f6f6f6] active:scale-[0.985] transition-all select-none"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#f2f2f2] group-hover:bg-white flex items-center justify-center shrink-0 transition-colors">
                      <RotateCcw className="w-4 h-4 text-[#111111] stroke-[2]" />
                    </div>
                    <span className="text-[14px] text-[#111111] font-normal group-hover:text-black">
                      7-day return and size exchange
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      openKnowMore('return');
                    }}
                    className="text-[13px] font-medium text-[#111111] underline hover:text-[#707072] cursor-pointer"
                  >
                    Know More
                  </button>
                </div>

                <div
                  onClick={() => openKnowMore('delivery')}
                  className="flex items-center justify-between group cursor-pointer py-1.5 -my-0.5 px-2.5 -mx-2.5 rounded-[8px] hover:bg-[#f6f6f6] active:scale-[0.985] transition-all select-none"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#f2f2f2] group-hover:bg-white flex items-center justify-center shrink-0 transition-colors">
                      <Truck className="w-4 h-4 text-[#111111] stroke-[2]" />
                    </div>
                    <span className="text-[14px] text-[#111111] font-normal group-hover:text-black">
                      Free delivery available
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      openKnowMore('delivery');
                    }}
                    className="text-[13px] font-medium text-[#111111] underline hover:text-[#707072] cursor-pointer"
                  >
                    Know More
                  </button>
                </div>
              </div>
            </div>

            {/* Accordions */}
            <div className="border-t border-[#e5e5e5] mt-6">
              <button
                type="button"
                onClick={() => setIsVendorDetailsOpen(!isVendorDetailsOpen)}
                className="w-full py-4 flex items-center justify-between text-left cursor-pointer select-none group"
                aria-expanded={isVendorDetailsOpen}
              >
                <span
                  className="text-[16px] font-medium text-[#111111] font-['Helvetica_Now_Text_Medium',sans-serif]"
                  style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
                >
                  Vendor Details
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-[#111111] transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                    isVendorDetailsOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>
              <div
                className={`grid transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                  isVendorDetailsOpen
                    ? 'grid-rows-[1fr] opacity-100 pb-4'
                    : 'grid-rows-[0fr] opacity-0 pb-0'
                }`}
              >
                <div className="overflow-hidden space-y-2.5 text-[13.5px]">
                  <div>
                    <p className="text-[12px] text-[rgba(0,19,37,0.64)] leading-tight">Sold By</p>
                    <p className="text-[14px] font-normal text-[rgba(0,19,37,0.92)] mt-0.5">Sonu Shoes.</p>
                  </div>
                  <div>
                    <p className="text-[12px] text-[rgba(0,19,37,0.64)] leading-tight">Country Of Origin</p>
                    <p className="text-[14px] font-normal text-[rgba(0,19,37,0.92)] mt-0.5">India</p>
                  </div>
                  <div>
                    <p className="text-[12px] text-[rgba(0,19,37,0.64)] leading-tight">Name Of Manufacturer/ Packer/ Importer</p>
                    <p className="text-[14px] font-normal text-[rgba(0,19,37,0.92)] mt-0.5">Sonu Shoes</p>
                  </div>
                  <div>
                    <p className="text-[12px] text-[rgba(0,19,37,0.64)] leading-tight">Address Of Manufacturer/ Packer/ Importer</p>
                    <p className="text-[14px] font-normal text-[rgba(0,19,37,0.92)] mt-0.5 leading-[20px]">
                   -, Patna, Bihar 800013
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-[#e5e5e5]">
              <button
                type="button"
                onClick={() => setIsReturnPolicyOpen(!isReturnPolicyOpen)}
                className="w-full py-4 flex items-center justify-between text-left cursor-pointer select-none group"
                aria-expanded={isReturnPolicyOpen}
              >
                <span
                  className="text-[16px] font-medium text-[#111111] font-['Helvetica_Now_Text_Medium',sans-serif]"
                  style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
                >
                  Return And Exchange Policy
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-[#111111] transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                    isReturnPolicyOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>
              <div
                className={`grid transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                  isReturnPolicyOpen
                    ? 'grid-rows-[1fr] opacity-100 pb-4'
                    : 'grid-rows-[0fr] opacity-0 pb-0'
                }`}
              >
                <div className="overflow-hidden text-[13.5px] leading-[22px] text-[rgba(0,19,37,0.92)]">
                  <p>
                    This product is eligible for hassle-free returns or size exchanges within 7 days of delivery. Kindly ensure the footwear is unworn outdoors, with original packaging, shoe box, and tags intact.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Horizontal Divider */}
        <div className="border-t border-[#e5e5e5] mt-12 mb-8" />
        </div>

        {/* Bottom Section 1: More From [Category] */}
        <div className="mb-14 sm:mb-16">
          <div className="flex items-center justify-between mb-5">
            <h3
              className="text-[20px] sm:text-[22px] lg:text-[24px] font-medium text-[#111111] tracking-tight font-['Helvetica_Now_Text_Medium',sans-serif]"
              style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
            >
              More From {product.category || 'Handcrafted Footwear'}
            </h3>

            {/* Desktop Left/Right Scroll Arrows */}
            <div className="hidden sm:flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => scrollCarousel(moreCarouselRef, 'left')}
                className="w-10 h-10 rounded-full bg-[#f5f5f5] hover:bg-[#e5e5e5] flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Scroll left"
              >
                <ChevronLeft className="w-5 h-5 text-[#111111]" />
              </button>
              <button
                type="button"
                onClick={() => scrollCarousel(moreCarouselRef, 'right')}
                className="w-10 h-10 rounded-full bg-[#f5f5f5] hover:bg-[#e5e5e5] flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Scroll right"
              >
                <ChevronRight className="w-5 h-5 text-[#111111]" />
              </button>
            </div>
          </div>

          <div
            ref={moreCarouselRef}
            className="flex gap-[4px] sm:gap-[5px] overflow-x-auto pb-4 scrollbar-none snap-x snap-mandatory scroll-smooth"
          >
            {(allCatalog.filter((p) => (p.id || p.slug) !== (product.id || product.slug)).length > 0
              ? allCatalog.filter((p) => (p.id || p.slug) !== (product.id || product.slug))
              : allCatalog
            ).map((item, idx) => {
              const pid = item.id || item.slug || item.itemId;
              const isFav = wishlistMap[pid];
              const pPrice =
                typeof item.price === 'string'
                  ? item.price
                  : `₹${(item.priceNumber || item.price || 13995).toLocaleString('en-IN')}`;

              return (
                <div
                  key={`more-${pid}-${idx}`}
                  onClick={() => router.push(`/product/${pid}`)}
                  className="w-[75vw] sm:w-[calc((100%-5px)/2)] lg:w-[calc((100%-10px)/3)] shrink-0 snap-start select-none cursor-pointer group"
                >
                  <div className="aspect-square relative p-0 flex items-center justify-center overflow-hidden">
                    <img
                      src={item.image || item.mainImage}
                      alt={item.name}
                      className="w-full h-full object-contain"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleCardWishlist(pid);
                      }}
                      className="absolute top-3.5 right-3.5 w-9 h-9 rounded-full bg-white  flex items-center justify-center text-[#111111] hover:bg-neutral-50 transition-colors cursor-pointer z-10"
                      aria-label="Save to Wishlist"
                    >
                      <Heart
                        className={`w-4 h-4 transition-colors ${
                          isFav ? 'fill-rose-500 text-rose-500' : 'text-[#111111]'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="pt-3 px-1 sm:px-0">
                    <h4
                      className="text-[16px] sm:text-[17px] font-medium text-[#111111] leading-snug line-clamp-1 font-['Helvetica_Now_Text_Medium',sans-serif]"
                      style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
                    >
                      {item.name}
                    </h4>
                    <p className="text-[14px] sm:text-[15px] text-[#707072] mt-0.5 line-clamp-1">
                      {item.category || 'Handcrafted Footwear'}
                    </p>
                    <p className="text-[15px] sm:text-[16px] font-medium text-[#111111] mt-1.5">
                      {pPrice}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Section 2: Recently Viewed */}
        {recentlyViewed && recentlyViewed.length > 0 && (
          <div className="mb-14 sm:mb-16">
            <div className="flex items-center justify-between mb-5">
              <h3
                className="text-[20px] sm:text-[22px] lg:text-[24px] font-medium text-[#111111] tracking-tight font-['Helvetica_Now_Text_Medium',sans-serif]"
                style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
              >
                Recently Viewed
              </h3>

              {/* Desktop Left/Right Scroll Arrows */}
              <div className="hidden sm:flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => scrollCarousel(recentCarouselRef, 'left')}
                  className="w-10 h-10 rounded-full bg-[#f5f5f5] hover:bg-[#e5e5e5] flex items-center justify-center transition-colors cursor-pointer"
                  aria-label="Scroll left"
                >
                  <ChevronLeft className="w-5 h-5 text-[#111111]" />
                </button>
                <button
                  type="button"
                  onClick={() => scrollCarousel(recentCarouselRef, 'right')}
                  className="w-10 h-10 rounded-full bg-[#f5f5f5] hover:bg-[#e5e5e5] flex items-center justify-center transition-colors cursor-pointer"
                  aria-label="Scroll right"
                >
                  <ChevronRight className="w-5 h-5 text-[#111111]" />
                </button>
              </div>
            </div>

            <div
              ref={recentCarouselRef}
              className="flex gap-[4px] sm:gap-[5px] overflow-x-auto pb-4 scrollbar-none snap-x snap-mandatory scroll-smooth"
            >
              {recentlyViewed.map((item, idx) => {
                const pid = item.id || item.itemId;
                const isFav = wishlistMap[pid];

                return (
                  <div
                    key={`rv-${pid}-${idx}`}
                    onClick={() => router.push(`/product/${pid}`)}
                    className="w-[75vw] sm:w-[calc((100%-5px)/2)] lg:w-[calc((100%-10px)/3)] shrink-0 snap-start select-none cursor-pointer group"
                  >
                    <div className="aspect-square relative p-0 flex items-center justify-center overflow-hidden">
                      <img
                        src={item.image || item.mainImage}
                        alt={item.name}
                        className="w-full h-full object-contain"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          toggleCardWishlist(pid);
                        }}
                        className="absolute top-3.5 right-3.5 w-9 h-9 rounded-full bg-white  flex items-center justify-center text-[#111111] hover:bg-neutral-50 transition-colors cursor-pointer z-10"
                        aria-label="Save to Wishlist"
                      >
                        <Heart
                          className={`w-4 h-4 transition-colors ${
                            isFav ? 'fill-rose-500 text-rose-500' : 'text-[#111111]'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="pt-3 px-1 sm:px-0">
                      <span className="text-[#c83200] text-[13px] font-medium leading-none block mb-1">
                        Just In
                      </span>
                      <h4
                        className="text-[16px] sm:text-[17px] font-medium text-[#111111] leading-snug line-clamp-1 font-['Helvetica_Now_Text_Medium',sans-serif]"
                        style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
                      >
                        {item.name}
                      </h4>
                      <p className="text-[14px] sm:text-[15px] text-[#707072] mt-0.5 line-clamp-1">
                        {item.category || 'Handcrafted Footwear'}
                      </p>
                      <p className="text-[15px] sm:text-[16px] font-medium text-[#111111] mt-1.5">
                        {typeof item.price === 'string'
                          ? item.price
                          : `₹${(item.priceNumber || item.price || 13995).toLocaleString('en-IN')}`}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Modal 1: View Product Details Modal */}
      {isProductDetailsMounted && (
        <div className="fixed inset-0 z-50 overflow-hidden font-['Helvetica_Now_Text',sans-serif]">
          <div
            className={`fixed inset-0 bg-black/60 transition-opacity duration-300 ease-out cursor-pointer ${
              isProductDetailsVisible ? 'opacity-100' : 'opacity-0'
            }`}
            onClick={closeProductDetails}
          />
          <div
            className={`fixed inset-x-0 bottom-0 sm:inset-auto sm:top-1/2 sm:left-1/2 w-full sm:max-w-[520px] bg-white rounded-t-[28px] sm:rounded-[24px] shadow-2xl z-50 p-6 sm:p-7 overflow-y-auto max-h-[85vh] transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
              isProductDetailsVisible
                ? 'translate-y-0 opacity-100 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:scale-100'
                : 'translate-y-full opacity-0 sm:-translate-x-1/2 sm:-translate-y-[45%] sm:scale-95'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#f0f0f0]">
              <h2
                className="text-[19px] sm:text-[20px] font-bold text-[#111111] font-['Helvetica_Now_Text_Medium',sans-serif]"
                style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
              >
                Product Details
              </h2>
              <button
                type="button"
                onClick={closeProductDetails}
                className="w-9 h-9 rounded-full bg-[#f5f5f5] hover:bg-[#e8e8e8] flex items-center justify-center text-[#111111] transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="py-4 space-y-4 text-[14px] text-[#111111] leading-relaxed">
              <p>
                {product.description ||
                  'Engineered for maximum kinetic comfort and everyday urban movement. Designed with an anatomical footbed and premium vulcanized gum rubber soles.'}
              </p>

              {product.features && product.features.length > 0 && (
                <div className="pt-2">
                  <h4 className="font-semibold text-[#111111] mb-2 text-[14px]">Key Features:</h4>
                  <ul className="space-y-1.5 list-disc list-inside text-[#707072]">
                    {product.features.map((feat, idx) => (
                      <li key={idx}>{feat}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="pt-2 border-t border-[#f0f0f0] space-y-2.5 text-[13.5px]">
                <p>
                  <strong className="font-semibold text-[#111111]">Colorway:</strong>{' '}
                  {Array.isArray(product.colorways)
                    ? product.colorways.join(', ')
                    : (product.color || 'Signature Tone')}
                </p>
                <p>
                  <strong className="font-semibold text-[#111111]">Style Code:</strong>{' '}
                  {product.id || product.slug || 'SN-01-ARCHIVE'}
                </p>
                <p>
                  <strong className="font-semibold text-[#111111]">Fit & Sizing:</strong>{' '}
                  True to size. For half sizes, we recommend sizing up for all-day comfort.
                </p>
                <p>
                  <strong className="font-semibold text-[#111111]">Craftsmanship & Care:</strong>{' '}
                  Handcrafted full-grain leather & high-rebound cushioning. Wipe clean with soft damp cloth.
                </p>
              </div>
            </div>
            <div className="pt-3 border-t border-[#f0f0f0]">
              <button
                type="button"
                onClick={closeProductDetails}
                className="w-full py-3.5 rounded-full bg-[#111111] text-white text-[15px] font-medium hover:bg-black active:scale-[0.99] transition-all cursor-pointer font-['Helvetica_Now_Text_Medium',sans-serif]"
                style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Know More Modal */}
      {isKnowMoreMounted && (
        <div className="fixed inset-0 z-50 overflow-hidden font-['Helvetica_Now_Text',sans-serif]">
          <div
            className={`fixed inset-0 bg-black/60 transition-opacity duration-300 ease-out cursor-pointer ${
              isKnowMoreVisible ? 'opacity-100' : 'opacity-0'
            }`}
            onClick={closeKnowMore}
          />
          <div
            className={`fixed inset-x-0 bottom-0 sm:inset-auto sm:top-1/2 sm:left-1/2 w-full sm:max-w-[560px] bg-white rounded-t-[28px] sm:rounded-[24px] shadow-2xl z-50 p-6 sm:p-7 overflow-y-auto max-h-[85vh] transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
              isKnowMoreVisible
                ? 'translate-y-0 opacity-100 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:scale-100'
                : 'translate-y-full opacity-0 sm:-translate-x-1/2 sm:-translate-y-[45%] sm:scale-95'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#f0f0f0]">
              <h2
                className="text-[19px] sm:text-[20px] font-bold text-[#111111] font-['Helvetica_Now_Text_Medium',sans-serif]"
                style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
              >
                {knowMoreType === 'return' ? 'Return & Exchange Policy' : 'Delivery & Cancellation'}
              </h2>
              <button
                type="button"
                onClick={closeKnowMore}
                className="w-9 h-9 rounded-full bg-[#f5f5f5] hover:bg-[#e8e8e8] flex items-center justify-center text-[#111111] transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {knowMoreType === 'return' ? (
              <div className="py-4 space-y-4 text-[14px] text-[rgba(0,19,37,0.92)] leading-relaxed">
                <p>
                  At SONU, we want every pair to fit like a second skin. If your shoes don&apos;t fit perfectly, you can request a return or size exchange within 7 days of delivery.
                </p>
                <ol className="list-decimal list-inside space-y-2 text-[#707072]">
                  <li>Footwear must be unworn outdoors with all original packaging, shoe tags, and shoe box intact.</li>
                  <li>Free reverse pickup will be scheduled at your doorstep.</li>
                  <li>Refunds are initiated directly to your original payment method within 5–7 business days after pickup inspection.</li>
                </ol>
                <p className="pt-2 text-[13px] text-[#707072]">
                  Need support? Write to us anytime at{' '}
                  <a href="mailto:support@sonu.shoes" className="underline font-medium text-[#111111]">
                    support@sonu.shoes
                  </a>
                  .
                </p>
              </div>
            ) : (
              <div className="py-4 space-y-4 text-[14px] text-[rgba(0,19,37,0.92)] leading-relaxed">
                <p>
                  We provide complimentary express shipping across India on all footwear orders. Every order is packed in a protective carton with our signature shoebox.
                </p>
                <p>
                  Orders are dispatched within 24–48 hours from our atelier. Estimated delivery is typically 3–5 business days depending on your pincode.
                </p>
                <div className="pt-2 border-t border-[#f0f0f0]">
                  <h4 className="font-semibold text-[#111111] mb-1">Order Cancellation</h4>
                  <p className="text-[#707072]">
                    You may cancel your order free of cost before it ships. Once dispatched, simply request a return after delivery.
                  </p>
                </div>
              </div>
            )}

            <div className="pt-3 border-t border-[#f0f0f0]">
              <button
                type="button"
                onClick={closeKnowMore}
                className="w-full py-3.5 rounded-full bg-[#111111] text-white text-[15px] font-medium hover:bg-black active:scale-[0.99] transition-all cursor-pointer font-['Helvetica_Now_Text_Medium',sans-serif]"
                style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Change Pincode Modal */}
      {isPincodeMounted && (
        <div className="fixed inset-0 z-50 overflow-hidden font-['Helvetica_Now_Text',sans-serif]">
          <div
            className={`fixed inset-0 bg-black/60 transition-opacity duration-300 ease-out cursor-pointer ${
              isPincodeVisible ? 'opacity-100' : 'opacity-0'
            }`}
            onClick={closePincodeModal}
          />
          <div
            className={`fixed inset-x-0 bottom-0 sm:inset-auto sm:top-1/2 sm:left-1/2 w-full sm:max-w-[420px] bg-white rounded-t-[28px] sm:rounded-[24px] shadow-2xl z-50 p-6 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
              isPincodeVisible
                ? 'translate-y-0 opacity-100 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:scale-100'
                : 'translate-y-full opacity-0 sm:-translate-x-1/2 sm:-translate-y-[45%] sm:scale-95'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#f0f0f0]">
              <h3
                className="text-[17px] font-bold text-[#111111] font-['Helvetica_Now_Text_Medium',sans-serif]"
                style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
              >
                Check Delivery Pincode
              </h3>
              <button
                type="button"
                onClick={closePincodeModal}
                className="w-8 h-8 rounded-full bg-[#f5f5f5] hover:bg-[#e8e8e8] flex items-center justify-center text-[#111111] cursor-pointer"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="mt-4 space-y-4">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  maxLength={6}
                  value={inputPincode}
                  onChange={(e) => setInputPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="Enter 6-digit Pincode"
                  className="flex-1 px-4 py-3 rounded-[12px] border border-[#e5e5e5] text-[15px] text-[#111111] outline-none focus:border-[#111111]"
                />
                <button
                  type="button"
                  disabled={inputPincode.length !== 6 || isPincodeLoading}
                  onClick={async () => {
                    if (inputPincode.length === 6) {
                      setIsPincodeLoading(true);
                      const cleanPin = inputPincode;
                      setDeliveryPincode(cleanPin);
                      let newCity = deliveryCity;
                      try {
                        const sRes = await fetch(`/api/shiprocket/serviceability?pincode=${cleanPin}`);
                        if (sRes.ok) {
                          const sData = await sRes.json();
                          if (sData?.data) {
                            if (sData.data.city) {
                              newCity = sData.data.city.toUpperCase();
                              setDeliveryCity(newCity);
                            }
                            if (sData.data.estimatedDays) {
                              const days = parseInt(sData.data.estimatedDays, 10);
                              if (!isNaN(days) && days > 0) setDeliveryDays(days);
                            }
                          }
                        } else {
                          const pRes = await fetch(`https://api.postalpincode.in/pincode/${cleanPin}`);
                          if (pRes.ok) {
                            const pData = await pRes.json();
                            const district = pData?.[0]?.PostOffice?.[0]?.District;
                            if (district) {
                              newCity = district.toUpperCase();
                              setDeliveryCity(newCity);
                            }
                          }
                        }
                      } catch {
                        // ignore
                      } finally {
                        try {
                          localStorage.setItem(
                            'sonu_shipping_address',
                            JSON.stringify({ pincode: cleanPin, city: newCity })
                          );
                        } catch {}
                        setIsPincodeLoading(false);
                        closePincodeModal();
                      }
                    }
                  }}
                  className="px-5 py-3 rounded-[12px] bg-[#111111] text-white text-[14px] font-medium hover:bg-black active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed font-['Helvetica_Now_Text_Medium',sans-serif]"
                  style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
                >
                  {isPincodeLoading ? 'Checking...' : 'Check'}
                </button>
              </div>
              <p className="text-[12.5px] text-[#707072]">
                Enter your pincode to check express delivery timelines for your area.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Added to Bag / Select Size Drawer Sheet */}
      {isBagModalMounted && (
        <div className="fixed inset-0 z-50 overflow-hidden font-['Helvetica_Now_Text',sans-serif]">
          {/* Blacked-out backdrop overlay */}
          <div
            className={`fixed inset-0 bg-black/60 transition-opacity duration-300 ease-out cursor-pointer ${
              isBagBackdropVisible ? 'opacity-100' : 'opacity-0'
            }`}
            onClick={closeBagModal}
          />

          <div
            className={`fixed inset-x-0 bottom-0 sm:inset-auto sm:top-1/2 sm:left-1/2 w-full sm:max-w-[540px] bg-white rounded-t-[28px] sm:rounded-[24px] shadow-2xl z-50 p-6 sm:p-7 overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
              isBagModalVisible
                ? 'translate-y-0 opacity-100 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:scale-100 sm:opacity-100'
                : 'translate-y-full opacity-0 sm:-translate-x-1/2 sm:translate-y-[100vh] sm:scale-95 sm:opacity-0'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {bagModalMode === 'select-size' ? (
              /* Mode 1: Select Size Drawer (Strict match to user screenshot) */
              <div>
                {/* Header: Title, Category, Price on Left; Raw X on Right */}
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-[18px] sm:text-[19px] font-bold text-[#111111] leading-tight font-['Helvetica_Now_Text_Medium',sans-serif]">
                      {product.name}
                    </h2>
                    <p className="text-[15px] sm:text-[16px] text-[#111111] font-normal mt-1 leading-tight">
                      {product.category || "Women's Training Shoes"}
                    </p>
                    <p className="text-[16px] sm:text-[17px] font-bold text-[#111111] mt-1.5 leading-tight">
                      {formattedPrice}
                    </p>
                  </div>

                  {/* Close Button: Clean raw X matching screenshot */}
                  <button
                    type="button"
                    onClick={closeBagModal}
                    className="p-1 -mr-1 -mt-1 text-[#111111] hover:opacity-60 transition-opacity cursor-pointer"
                    aria-label="Close"
                  >
                    <X className="w-6 h-6 stroke-[1.8]" />
                  </button>
                </div>

                {/* Size Grid: 4 columns, light grey border rounded boxes */}
                <div className="mt-7">
                  <div className="grid grid-cols-4 gap-2.5 sm:gap-3">
                    {availableSizesList.map((sz) => {
                      const isSelected = sz === tempDrawerSize;
                      const isOutOfStock =
                        sz === 'UK 9' &&
                        (product.category?.toLowerCase().includes('women') ||
                          product.name?.toLowerCase().includes('women') ||
                          product.name?.toLowerCase().includes('hybrid rn'));

                      if (isOutOfStock) {
                        return (
                          <div
                            key={sz}
                            className="h-[50px] sm:h-[52px] rounded-[8px] border border-[#e5e5e5] bg-[#fafafa] flex items-center justify-center text-[15px] sm:text-[16px] font-medium text-[#d1d5db] line-through cursor-not-allowed select-none"
                          >
                            {sz}
                          </div>
                        );
                      }

                      return (
                        <button
                          key={sz}
                          type="button"
                          onClick={() => setTempDrawerSize(sz)}
                          className={`h-[50px] sm:h-[52px] rounded-[8px] border text-[15px] sm:text-[16px] font-medium flex items-center justify-center transition-all cursor-pointer active:scale-95 ${
                            isSelected
                              ? 'border-[#111111] bg-[#111111] text-white font-semibold'
                              : 'border-[#d1d5db] bg-white text-[#111111] hover:border-[#111111]'
                          }`}
                        >
                          {sz}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Bottom Button: Full-width pill matching screenshot strictly */}
                <div className="mt-8">
                  <button
                    type="button"
                    disabled={!tempDrawerSize}
                    onClick={() => {
                      if (!tempDrawerSize) return;
                      handleSelectSizeInDrawer(tempDrawerSize);
                    }}
                    className={`w-full py-4 rounded-full text-[16px] font-medium transition-all ${
                      tempDrawerSize
                        ? 'bg-[#111111] text-white hover:bg-black active:scale-[0.99] cursor-pointer'
                        : 'bg-[#e5e5e5] text-[#8e8e93] cursor-not-allowed'
                    }`}
                  >
                    Add to bag
                  </button>
                </div>
              </div>
            ) : (
              /* Mode 2: Added to Bag confirmation */
              <div>
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
                    onClick={closeBagModal}
                    className="w-9 h-9 rounded-full bg-[#f5f5f5] hover:bg-[#e8e8e8] flex items-center justify-center text-[#111111] transition-colors cursor-pointer"
                    aria-label="Close"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="mt-6 flex items-start gap-4">
                  <div className="w-[104px] h-[104px] sm:w-[112px] sm:h-[112px] bg-[#f5f5f5] rounded-xl flex items-center justify-center shrink-0 overflow-hidden">
                    <img
                      src={activeImage}
                      alt={product.name}
                      className="w-full h-full object-contain"
                    />
                  </div>

                  <div className="flex flex-col text-left">
                    <h3
                      className="text-[17px] sm:text-[18px] font-medium text-[#111111] leading-snug font-['Helvetica_Now_Text_Medium',sans-serif]"
                      style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
                    >
                      {product.name}
                    </h3>
                    <p className="text-[15px] text-[#707072] mt-0.5 leading-tight">
                      {product.category || 'Footwear'} ({selectedSize || 'UK 8'})
                    </p>
                    <p className="text-[15px] text-[#707072] mt-0.5 leading-tight">
                      Size {selectedSize || 'UK 8'}
                    </p>
                    <p
                      className="text-[17px] font-medium text-[#111111] mt-2 font-['Helvetica_Now_Text_Medium',sans-serif]"
                      style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
                    >
                      {formattedPrice}
                    </p>
                    <p className="text-[13px] text-[#707072] mt-0.5">
                      Inclusive of all taxes
                    </p>
                  </div>
                </div>

                <div className="mt-6">
                  <Link
                    href="/checkout"
                    onClick={closeBagModal}
                    className="w-full py-4 rounded-full bg-[#111111] hover:bg-black text-white text-[16px] font-medium text-center transition-all block shadow-md active:scale-[0.99] cursor-pointer font-['Helvetica_Now_Text_Medium',sans-serif]"
                    style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
                  >
                    View Bag ({cartCount})
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal 4: Size Guide Modal */}
      {isModalMounted && (
        <div className="fixed inset-0 z-50 overflow-hidden font-['Helvetica_Now_Text',sans-serif]">
          <div
            className={`fixed inset-0 bg-black/60 transition-opacity duration-300 ease-out cursor-pointer ${
              isModalVisible ? 'opacity-100' : 'opacity-0'
            }`}
            onClick={closeSizeGuide}
          />

          <div
            className={`fixed inset-x-0 bottom-0 sm:inset-auto sm:top-1/2 sm:left-1/2 w-full sm:max-w-[620px] max-h-[92vh] sm:max-h-[88vh] bg-white rounded-t-[26px] sm:rounded-[24px] shadow-2xl z-50 px-6 pt-6 pb-8 overflow-y-auto transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
              isModalVisible
                ? 'translate-y-0 opacity-100 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:scale-100'
                : 'translate-y-full opacity-0 sm:-translate-x-1/2 sm:-translate-y-[45%] sm:scale-95'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-[26px] sm:text-[28px] font-medium text-[#111111] tracking-tight leading-tight">
                  Size Guide
                </h2>
                <p className="text-[15px] text-[#707072] mt-1">
                  {product.name} {product.category}
                </p>
              </div>

              <button
                type="button"
                onClick={closeSizeGuide}
                className="p-1 text-[#111111] hover:opacity-60 transition-opacity cursor-pointer mt-0.5"
                aria-label="Close Size Guide"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-[16px] text-[#111111] font-normal mt-7 mb-4">
              Below are product&apos;s physical dimensions
            </p>

            {/* in / cm Pill Switcher */}
            <div className="mb-6">
              <div className="relative inline-flex items-center bg-[#f5f5f5] rounded-full p-1 h-[44px]">
                <div
                  className={`absolute top-1 bottom-1 w-[52px] rounded-full bg-white border border-[#111111]  transition-all duration-300 ease-in-out ${
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

            {/* Table */}
            <div className="w-full overflow-x-auto border border-[#e5e5e5]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#e5e5e5]">
                    <th className="py-3.5 px-4 font-medium text-[#111111] bg-white border-r border-[#e5e5e5] align-top whitespace-nowrap min-w-[76px] text-[14px]">
                      Size
                    </th>
                    <th className="py-3.5 px-3.5 font-medium text-[#111111] bg-[#fafafa] border-r border-[#e5e5e5] align-top leading-tight min-w-[105px] text-[14px]">
                      Foot<br />Length
                    </th>
                    <th className="py-3.5 px-3.5 font-medium text-[#111111] bg-white border-r border-[#e5e5e5] align-top leading-tight min-w-[95px] text-[14px]">
                      US<br />Size
                    </th>
                    <th className="py-3.5 px-3.5 font-medium text-[#111111] bg-[#fafafa] border-r border-[#e5e5e5] align-top leading-tight min-w-[95px] text-[14px]">
                      EU<br />Size
                    </th>
                    <th className="py-3.5 px-3.5 font-medium text-[#111111] bg-white align-top leading-tight min-w-[95px] text-[14px]">
                      CM /<br />JP
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
                        {unit === 'in' ? `${row.inLength} in` : `${row.cmLength} cm`}
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
