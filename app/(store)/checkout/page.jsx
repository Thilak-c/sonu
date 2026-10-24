'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  getCartItems,
  addToCart,
  removeFromCart,
  updateCartQuantity,
  updateCartItemSize,
  clearCart,
  preloadImage,
  preloadCartImages,
  PAYMENT_ICONS,
  preloadPaymentImages,
} from '@/components/cart/cartStore';

const LAST_MINUTE_ADDITIONS = [
  {
    id: 'addon-bottle',
    brand: 'Nike',
    title: 'Refuel Bottle Grip 18 Oz',
    price: 999,
    priceFormatted: '₹999',
    image: '/images/addons/bottle.jpg',
    color: 'Black/White',
  },
  {
    id: 'addon-basketball',
    brand: 'Nike',
    title: 'Everyday All Court 8P Deflated',
    price: 2999,
    priceFormatted: '₹2,999',
    image: '/images/addons/basketball.jpg',
    color: 'Orange/Black',
  },
  {
    id: 'addon-wristbands',
    brand: 'Nike',
    title: 'Swoosh Classic Doublewide Wristbands...',
    price: 1099,
    priceFormatted: '₹1,099',
    image: '/images/addons/wristbands.jpg',
    color: 'Royal/White/Red',
  },
  {
    id: 'addon-backpack',
    brand: 'Nike Heritage',
    title: 'Heritage Backpack 2.0 (23L)',
    price: 2495,
    priceFormatted: '₹2,495',
    image: '/images/addons/backpack.jpg',
    color: 'Black',
  },
];

const SIZE_CHART = [
  { size: 'UK 3', inLength: '8.8', cmLength: '22.4', us: '5.5', eu: '36', cmJp: '22.5' },
  { size: 'UK 4', inLength: '9.2', cmLength: '23.4', us: '6.5', eu: '37.5', cmJp: '23.5' },
  { size: 'UK 5', inLength: '9.5', cmLength: '24.1', us: '7.5', eu: '38.5', cmJp: '24.5' },
  { size: 'UK 6', inLength: '9.8', cmLength: '24.9', us: '8.5', eu: '40', cmJp: '25.5' },
  { size: 'UK 7', inLength: '10.2', cmLength: '25.9', us: '9.5', eu: '41', cmJp: '26.5' },
  { size: 'UK 8', inLength: '10.5', cmLength: '26.7', us: '10.5', eu: '42.5', cmJp: '27.5' },
  { size: 'UK 9', inLength: '10.8', cmLength: '27.4', us: '11.5', eu: '44', cmJp: '28.5' },
];

export default function CheckoutPage() {
  const router = useRouter();
  // Steps: 'bag' | 'address' | 'payment' | 'confirmation'
  const [checkoutStep, setCheckoutStep] = useState('bag');

  const [cartItems, setCartItems] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [wishlist, setWishlist] = useState({});

  // Promo Code State
  const [isPromoOpen, setIsPromoOpen] = useState(false);
  const [promoInput, setPromoInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [promoError, setPromoError] = useState('');

  // Addons State
  const [addedAddonId, setAddedAddonId] = useState(null);
  const carouselRef = useRef(null);

  // Size Selector Modal State (Matches User Screenshot Strictly)
  const [editingSizeItem, setEditingSizeItem] = useState(null);
  const [tempSelectedSize, setTempSelectedSize] = useState(null);
  const [isSizeModalMounted, setIsSizeModalMounted] = useState(false);
  const [isSizeModalVisible, setIsSizeModalVisible] = useState(false);
  const [isSizeBackdropVisible, setIsSizeBackdropVisible] = useState(false);
  const sizeTimerRef = useRef(null);

  const openSizeModal = (item) => {
    if (sizeTimerRef.current) clearTimeout(sizeTimerRef.current);
    setEditingSizeItem(item);
    setTempSelectedSize(item.size || null);
    setIsSizeModalMounted(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setIsSizeBackdropVisible(true);
        setIsSizeModalVisible(true);
      });
    });
  };

  const closeSizeModal = () => {
    setIsSizeBackdropVisible(false);
    setIsSizeModalVisible(false);
    sizeTimerRef.current = setTimeout(() => {
      setIsSizeModalMounted(false);
      setEditingSizeItem(null);
      setTempSelectedSize(null);
    }, 320);
  };

  // Size Guide Modal State
  const [isSizeGuideMounted, setIsSizeGuideMounted] = useState(false);
  const [isSizeGuideVisible, setIsSizeGuideVisible] = useState(false);
  const [sizeGuideUnit, setSizeGuideUnit] = useState('in'); // 'in' or 'cm'
  const sizeGuideTimerRef = useRef(null);

  const openSizeGuide = () => {
    if (sizeGuideTimerRef.current) clearTimeout(sizeGuideTimerRef.current);
    setIsSizeGuideMounted(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setIsSizeGuideVisible(true);
      });
    });
  };

  const closeSizeGuide = () => {
    setIsSizeGuideVisible(false);
    sizeGuideTimerRef.current = setTimeout(() => {
      setIsSizeGuideMounted(false);
    }, 320);
  };

  const getProductHref = (item) => {
    if (item.slug) return `/product/${item.slug}`;
    if (item.id && (item.id.includes('hybrid') || item.id.includes('stealth') || item.id.includes('drop-'))) {
      return `/product/${item.id}`;
    }
    const name = (item.name || '').toLowerCase();
    if (name.includes('stealth') || name.includes("men") || name.includes('black')) {
      return '/product/drop-hybrid-men';
    }
    if (name.includes('hybrid') || name.includes("women") || name.includes('purple')) {
      return '/product/drop-hybrid-women';
    }
    return '/#fresh-drops';
  };

  // Shipping Address Form State
  const [address, setAddress] = useState({
    firstName: '',
    lastName: '',
    mobile: '',
    email: '',
    pincode: '',
    houseNo: '',
    street: '',
    landmark: '',
    city: '',
    state: 'Bihar',
  });
  const [addressErrors, setAddressErrors] = useState({});
  const [isDeliveryEstimateOpen, setIsDeliveryEstimateOpen] = useState(false);
  const [isPriceDetailsOpen, setIsPriceDetailsOpen] = useState(true);
  const [isPaymentOrderAddressOpen, setIsPaymentOrderAddressOpen] = useState(false);
  const [isPaymentPriceDetailsOpen, setIsPaymentPriceDetailsOpen] = useState(true);

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState('upi'); // 'upi' | 'card' | 'netbanking' | 'emi'
  const [selectedPaymentAccordion, setSelectedPaymentAccordion] = useState('upi');
  const [selectedUpiApp, setSelectedUpiApp] = useState('gpay'); // 'gpay' | 'phonepe' | 'paytm' | 'other'
  const [selectedBank, setSelectedBank] = useState('AXIS');
  const [upiId, setUpiId] = useState('');
  const [cardDetails, setCardDetails] = useState({ number: '', expiry: '', cvv: '', name: '' });
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState(null);

  // Sync cart & profile on mount
  useEffect(() => {
    const syncCart = () => {
      const items = getCartItems();
      setCartItems(items);
      setIsLoaded(true);
      items.forEach((it) => {
        if (it.image) preloadImage(it.image);
      });
      LAST_MINUTE_ADDITIONS.forEach((addon) => {
        if (addon.image) preloadImage(addon.image);
      });
      preloadPaymentImages();
    };

    const loadUserProfile = () => {
      try {
        const storedProfile = localStorage.getItem('sonu_user_profile');
        if (storedProfile) {
          const profile = JSON.parse(storedProfile);
          setAddress((prev) => ({
            ...prev,
            firstName: profile.firstName || prev.firstName,
            lastName: profile.lastName || prev.lastName,
            mobile: profile.mobile || prev.mobile,
            email: profile.email || prev.email,
          }));
        } else {
          const mobile = localStorage.getItem('sonu_user_mobile');
          if (mobile) {
            setAddress((prev) => ({ ...prev, mobile }));
          }
        }

        const storedAddress = localStorage.getItem('sonu_shipping_address');
        if (storedAddress) {
          try {
            const parsed = JSON.parse(storedAddress);
            setAddress((prev) => ({
              ...prev,
              ...parsed,
              landmark: parsed.landmark || '',
              houseNo: parsed.houseNo || '',
              street: parsed.street || parsed.roadArea || '',
              city: parsed.city || '',
              state: parsed.state || prev.state || 'Bihar',
              pincode: parsed.pincode || '',
              firstName: parsed.firstName || prev.firstName || '',
              lastName: parsed.lastName || prev.lastName || '',
              mobile: parsed.mobile || prev.mobile || '',
              email: parsed.email || prev.email || '',
            }));
          } catch (e) {}
        }
      } catch (err) {
        // ignore
      }
    };

    syncCart();
    loadUserProfile();

    const handleAuthChange = () => {
      loadUserProfile();
      const mobile = localStorage.getItem('sonu_user_mobile');
      if (mobile && checkoutStep === 'bag') {
        // Automatically transition to address step once user logs in
        setCheckoutStep('address');
      }
    };

    const handleAddressUpdate = () => {
      loadUserProfile();
      const storedAddress = localStorage.getItem('sonu_shipping_address');
      if (storedAddress) {
        try {
          const parsed = JSON.parse(storedAddress);
          setAddress((prev) => ({
            ...prev,
            ...parsed,
            landmark: parsed.landmark || '',
            houseNo: parsed.houseNo || '',
            street: parsed.street || parsed.roadArea || '',
            city: parsed.city || '',
            state: parsed.state || prev.state || 'Bihar',
            pincode: parsed.pincode || '',
            firstName: parsed.firstName || prev.firstName || '',
            lastName: parsed.lastName || prev.lastName || '',
            mobile: parsed.mobile || prev.mobile || '',
            email: parsed.email || prev.email || '',
          }));
        } catch (e) {}
      }
    };

    window.addEventListener('cart-updated', syncCart);
    window.addEventListener('storage', syncCart);
    window.addEventListener('auth-changed', handleAuthChange);
    window.addEventListener('address-updated', handleAddressUpdate);

    return () => {
      window.removeEventListener('cart-updated', syncCart);
      window.removeEventListener('storage', syncCart);
      window.removeEventListener('auth-changed', handleAuthChange);
      window.removeEventListener('address-updated', handleAddressUpdate);
    };
  }, [checkoutStep]);

  // Always scroll to top and preload payment images whenever checkoutStep changes
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    const timer = setTimeout(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }, 40);
    preloadPaymentImages();
    return () => clearTimeout(timer);
  }, [checkoutStep]);

  const totalQuantity = cartItems.reduce((acc, item) => acc + (item.quantity || 1), 0);
  const subtotal = cartItems.reduce(
    (acc, item) => acc + (item.priceNumber || 13995) * (item.quantity || 1),
    0
  );
  const promoDiscountAmount = appliedPromo
    ? Math.round((subtotal * appliedPromo.discountPercent) / 100)
    : 0;
  const youPay = Math.max(0, subtotal - promoDiscountAmount);

  const scrollAddons = (direction) => {
    if (carouselRef.current) {
      const scrollAmount = direction === 'left' ? -320 : 320;
      carouselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const handleApplyPromo = (e) => {
    e?.preventDefault();
    setPromoError('');
    const code = promoInput.trim().toUpperCase();
    if (!code) return;
    if (code === 'SONU10' || code === 'SAVE10' || code === 'NIKE10' || code === 'FIRSTPAIR') {
      setAppliedPromo({ code, discountPercent: 10 });
      setPromoInput('');
      setPromoError('');
    } else {
      setPromoError('Invalid promo code. Try SONU10');
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoError('');
  };

  const handleMoveToBag = (addon) => {
    addToCart({
      id: addon.id,
      name: addon.title,
      category: addon.brand,
      price: addon.priceFormatted,
      priceNumber: addon.price,
      image: addon.image,
      size: 'One Size',
      color: addon.color,
    });
    setCartItems(getCartItems());
    setAddedAddonId(addon.id);
    setTimeout(() => {
      setAddedAddonId(null);
    }, 1500);
  };

  const toggleWishlist = (key) => {
    setWishlist((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Step 1 -> Step 2: Click "Proceed to Buy"
  const handleProceedToBuy = () => {
    const user = typeof window !== 'undefined' ? localStorage.getItem('sonu_user_mobile') : null;
    if (!user) {
      window.dispatchEvent(new CustomEvent('open-login-modal'));
      return;
    }
    setCheckoutStep('address');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Step 2 -> Step 3: Proceed to Payment
  const handleProceedToPayment = (e) => {
    e?.preventDefault();
    preloadPaymentImages();
    if (!address.pincode && !address.mobile) {
      window.dispatchEvent(
        new CustomEvent('open-login-modal', { detail: { step: 'delivery-address' } })
      );
      return;
    }
    setCheckoutStep('payment');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Helper to load Razorpay checkout script
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (typeof window !== 'undefined' && window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // Step 3 -> Step 4: Open Razorpay Gateway & Complete Order
  const handlePlaceOrder = async () => {
    if (isPlacingOrder) return;
    setIsPlacingOrder(true);

    try {
      const isScriptLoaded = await loadRazorpayScript();
      if (!isScriptLoaded) {
        alert('Could not load payment gateway. Please check your internet connection.');
        setIsPlacingOrder(false);
        return;
      }

      // Prepare customer display info & verified mobile
      const displayName =
        address.name ||
        `${address.firstName || ''} ${address.lastName || ''}`.trim() ||
        'Customer';

      // Retrieve mobile number from state or local storage
      let phone = address.mobile || '';
      if (!phone && typeof window !== 'undefined') {
        try {
          phone = localStorage.getItem('sonu_user_mobile') || '';
          if (!phone) {
            const storedAddr = JSON.parse(localStorage.getItem('sonu_shipping_address') || '{}');
            phone = storedAddr.mobile || storedAddr.phone || '';
          }
          if (!phone) {
            const storedProf = JSON.parse(localStorage.getItem('sonu_user_profile') || '{}');
            phone = storedProf.mobile || '';
          }
        } catch (e) {
          // ignore
        }
      }
      const displayContact = (phone || '9182390192').replace(/\D/g, '').slice(-10);
      const isPartialCod = paymentMethod === 'partial_cod';
      const amountToPay = isPartialCod ? 200 : subtotal;

      // 1. Create order on backend via Razorpay Orders API & save draft in MongoDB
      const res = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amountToPay,
          items: cartItems,
          notes: {
            customerName: displayName,
            customerEmail: address.email || '',
            contact: displayContact,
            address: `${address.houseNo || ''}, ${address.street || ''}, ${address.city || ''} - ${address.pincode || ''}`,
            method: paymentMethod,
            totalOrderAmount: String(subtotal),
            advanceDeposit: isPartialCod ? '200' : '0',
          },
        }),
      });

      const orderData = await res.json();
      if (!res.ok || !orderData.orderId) {
        throw new Error(orderData.error || 'Failed to create payment order');
      }

      // Sequence blocks to always show full detailed payment options
      const sequenceMap = {
        card: ['block.cards', 'block.upi', 'block.netbanking', 'block.wallets_emi'],
        netbanking: ['block.netbanking', 'block.cards', 'block.upi', 'block.wallets_emi'],
        emi: ['block.wallets_emi', 'block.cards', 'block.upi', 'block.netbanking'],
        upi: ['block.upi', 'block.cards', 'block.netbanking', 'block.wallets_emi'],
        partial_cod: ['block.upi', 'block.cards', 'block.netbanking', 'block.wallets_emi'],
      };
      const activeSequence = sequenceMap[paymentMethod] || sequenceMap.upi;

      // 2. Configure and open Razorpay modal with full options
      const options = {
        key: orderData.keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_ToeynJ0XXfrtyp',
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name: 'SONU',
        description: isPartialCod
          ? 'Partial COD Advance Deposit (₹200)'
          : `Order Payment (${totalQuantity} ${totalQuantity === 1 ? 'item' : 'items'})`,
        image: '/images/brand/logo.svg',
        order_id: orderData.orderId,
        one_click_checkout: false,
        remember_customer: false,
        prefill: {
          name: displayName,
          email: address.email || '',
          contact: displayContact,
        },
        notes: {
          contact: displayContact,
          address: `${address.houseNo || ''}, ${address.street || ''}, ${address.city || ''} - ${address.pincode || ''}`,
          method: paymentMethod,
        },
        config: {
          display: {
            blocks: {
              cards: {
                name: 'Cards (Credit / Debit)',
                instruments: [{ method: 'card' }],
              },
              upi: {
                name: 'UPI / QR (Google Pay, PhonePe, Paytm)',
                instruments: [{ method: 'upi' }],
              },
              netbanking: {
                name: 'Net Banking (All Indian Banks)',
                instruments: [{ method: 'netbanking' }],
              },
              wallets_emi: {
                name: 'Wallets & EMI Options',
                instruments: [
                  { method: 'wallet' },
                  { method: 'emi' },
                  { method: 'paylater' },
                ],
              },
            },
            sequence: activeSequence,
            preferences: {
              show_default_blocks: true,
            },
          },
        },
        theme: {
          color: '#111111',
        },
        modal: {
          confirm_close: true,
          ondismiss: () => {
            setIsPlacingOrder(false);
          },
        },
        handler: async function (response) {
          const placedOrderId = `SONU-IN-${Math.floor(100000 + Math.random() * 900000)}`;
          const isPartial = paymentMethod === 'partial_cod';
          const confirmedData = {
            orderId: placedOrderId,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpayOrderId: response.razorpay_order_id,
            razorpaySignature: response.razorpay_signature,
            items: [...cartItems],
            totalAmount: subtotal,
            address: { ...address },
            paymentMethod,
            advancePaid: isPartial ? 200 : subtotal,
            balanceDue: isPartial ? Math.max(0, subtotal - 200) : 0,
            paymentStatus: isPartial ? 'PARTIALLY_PAID' : 'PAID',
            placedAt: new Date().toISOString(),
            estimatedDelivery: '3-5 business days',
          };

          // 1. Save confirmed order directly into MongoDB
          try {
            await fetch('/api/orders', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(confirmedData),
            });
          } catch (dbErr) {
            console.error('[MongoDB] Order save failed:', dbErr);
          }

          try {
            const pastOrders = JSON.parse(localStorage.getItem('sonu_orders') || '[]');
            pastOrders.unshift(confirmedData);
            localStorage.setItem('sonu_orders', JSON.stringify(pastOrders));
          } catch (err) {
            // ignore
          }

          setConfirmedOrder(confirmedData);
          clearCart();
          setIsPlacingOrder(false);
          setCheckoutStep('confirmation');
          window.scrollTo({ top: 0, behavior: 'smooth' });
          // Seamless redirect directly to the live Order Tracking page
          router.push(`/order/${placedOrderId}`);
        },
      };

      const rzpInstance = new window.Razorpay(options);
      rzpInstance.on('payment.failed', function (response) {
        setIsPlacingOrder(false);
        alert(`Payment failed: ${response.error?.description || 'Transaction declined'}`);
      });
      rzpInstance.open();
    } catch (err) {
      console.error('Razorpay checkout error:', err);
      setIsPlacingOrder(false);
      alert(err.message || 'Payment could not be initialized. Please try again.');
    }
  };

  // Loading state
  if (!isLoaded) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[50vh]">
        <div className="w-6 h-6 border-2 border-[#111111] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // STEP 4: ORDER SUCCESS / CONFIRMATION
  if (checkoutStep === 'confirmation' && confirmedOrder) {
    return (
      <div className="w-full max-w-[580px] mx-auto px-5 sm:px-6 pt-10 pb-20 font-['Helvetica_Now_Text',sans-serif] text-[#111111]">
        {/* Success Icon */}
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-[#008a00] flex items-center justify-center text-white mx-auto mb-4 shadow-sm">
            <svg
              className="w-8 h-8"
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
          <h1
            className="text-[26px] sm:text-[30px] font-bold tracking-tight font-['Helvetica_Now_Text_Medium',sans-serif]"
            style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
          >
            Thank you for your order!
          </h1>
          <p className="text-[14px] text-neutral-500 mt-2">
            Your order reference is <span className="font-mono font-bold text-[#111111]">{confirmedOrder.orderId}</span>
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href={`/order/${confirmedOrder.orderId}`}
              className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-[#111111] hover:bg-black text-white text-[14px] font-medium transition-all shadow-sm"
            >
              Track Your Order & Courier ↗
            </Link>
            <Link
              href="/"
              className="w-full sm:w-auto px-6 py-3.5 rounded-full border border-neutral-300 hover:border-black text-[14px] font-medium transition-colors text-neutral-700 bg-white"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // EMPTY BAG SCREEN (When cart has 0 items)
  if (cartItems.length === 0 && checkoutStep !== 'confirmation') {
    return (
      <div className="min-h-[75vh] flex flex-col items-center justify-center px-6 text-center select-none font-['Helvetica_Now_Text',sans-serif]">
        <div className="max-w-[440px] mx-auto flex flex-col items-center">
          <h1
            className="text-[26px] sm:text-[30px] font-medium text-[#111111] tracking-tight font-['Helvetica_Now_Text_Medium',sans-serif]"
            style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
          >
            Your bag is empty.
          </h1>
          <p
            className="text-[15px] sm:text-[16px] text-[#111111] mt-2 sm:mt-2.5 mb-8 font-normal font-['Helvetica_Now_Text',sans-serif]"
            style={{ fontFamily: "'Helvetica Now Text', sans-serif" }}
          >
            When you add products, they'll appear here.
          </p>
          <Link
            href="/#fresh-drops"
            className="inline-flex items-center justify-center px-10 sm:px-12 py-3.5 sm:py-4 bg-[#111111] hover:bg-black active:scale-[0.99] text-white text-[15px] sm:text-[16px] font-medium rounded-full transition-all shadow-sm font-['Helvetica_Now_Text_Medium',sans-serif]"
            style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
          >
            Shop Now
          </Link>
        </div>
      </div>
    );
  }

  // STEP 2: SELECT ADDRESS & PAY (EXACT DESIGN MATCH)
  if (checkoutStep === 'address') {
    const displayName =
      address.name ||
      `${address.firstName || ''} ${address.lastName || ''}`.trim() ||
      (typeof window !== 'undefined' ? localStorage.getItem('sonu_user_name') : '') ||
      'Thilak';
    const displayMobile =
      address.mobile ||
      (typeof window !== 'undefined' ? localStorage.getItem('sonu_user_mobile') : '') ||
      '8008439762';
    const displayPincode = address.pincode || '800013';
    const displayHouse = address.houseNo || '33a';
    const displayStreet = address.street || address.roadArea || "Pata lok, behind S'mart, Nehru Nagar";
    const displayLandmark = address.landmark || '';
    const displayAddressLine = [displayHouse, displayStreet, displayLandmark].filter(Boolean).join(', ');
    const displayCity = (address.city || 'PATNA').toUpperCase();
    const displayCityStatePin = `${displayCity}-${displayPincode}`;

    const handleChangeAddress = () => {
      window.dispatchEvent(
        new CustomEvent('open-login-modal', { detail: { step: 'delivery-address' } })
      );
    };

    return (
      <div className="min-h-screen bg-white font-['Helvetica_Now_Text',sans-serif] text-[#111111]">
        {/* Top Sticky Header */}
        <div className="sticky top-0 z-30 bg-white border-b border-[#f0f0f0]">
          <div className="max-w-[480px] sm:max-w-[500px] mx-auto px-4 h-14 flex items-center gap-3.5">
            <button
              type="button"
              onClick={() => setCheckoutStep('bag')}
              className="w-9 h-9 -ml-1.5 flex items-center justify-center text-[#111111] hover:text-[#707072] cursor-pointer transition-colors"
              aria-label="Back to Bag"
            >
              <svg
                className="w-5 h-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </button>
            <h1
              className="text-[18px] sm:text-[19px] font-bold text-[#111111] tracking-tight font-['Helvetica_Now_Text_Medium',sans-serif]"
              style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
            >
              Select Address & Pay
            </h1>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="max-w-[480px] sm:max-w-[500px] mx-auto px-4 pt-4 pb-36 space-y-5">
          {/* 1. Address Summary Card */}
          <div className="border border-[#e5e5e5] rounded-[16px] p-4 sm:p-5 bg-white shadow-[0_1px_4px_rgba(0,0,0,0.02)]">
            <h2
              className="text-[15px] sm:text-[16px] font-bold text-[#111111] leading-tight font-['Helvetica_Now_Text_Medium',sans-serif]"
              style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
            >
              Deliver to {displayName}, {displayPincode}
            </h2>

            <div className="text-[13px] sm:text-[13.5px] text-[#707072] mt-2 space-y-0.5 leading-relaxed font-['Helvetica_Now_Text',sans-serif]">
              <p className="line-clamp-2">{displayAddressLine}...</p>
              <p>{displayCityStatePin}</p>
              <p>+91-{displayMobile}</p>
            </div>

            <button
              type="button"
              onClick={handleChangeAddress}
              className="w-full py-3 mt-4 rounded-full border border-[#111111] text-[14px] font-medium text-[#111111] bg-white hover:bg-[#f7f7f7] active:scale-[0.99] transition-all cursor-pointer font-['Helvetica_Now_Text_Medium',sans-serif]"
              style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
            >
              Change or Add Address
            </button>
          </div>

          {/* 2. Offers */}
          <div className=" ">
            <p
              className="text-[13.5px] sm:text-[14px] text-[#707072] font-['Helvetica_Now_Text',sans-serif]"
              style={{ fontFamily: "'Helvetica Now Text', sans-serif" }}
            >
              There is no offer currently running.
            </p>
          </div>

          {/* 3. Order Information */}
          <div>
            <h2
              className="text-[16px] sm:text-[17px] font-bold text-[#111111] pb-2.5 font-['Helvetica_Now_Text_Medium',sans-serif]"
              style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
            >
              Order Information
            </h2>

            <div className="space-y-3">
              {/* Accordion 1: Delivery Estimate */}
              <div className="border border-[#e5e5e5] rounded-[14px] bg-white overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.02)]">
                <button
                  type="button"
                  onClick={() => setIsDeliveryEstimateOpen(!isDeliveryEstimateOpen)}
                  className="w-full p-4 flex items-center justify-between text-left cursor-pointer hover:bg-[#fafafa] transition-colors"
                >
                  <span
                    className="text-[15px] font-bold text-[#111111] font-['Helvetica_Now_Text_Medium',sans-serif]"
                    style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
                  >
                    Delivery Estimate
                  </span>
                  <svg
                    className={`w-4 h-4 text-[#111111] transition-transform duration-200 ${
                      isDeliveryEstimateOpen ? 'rotate-180' : ''
                    }`}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
                {isDeliveryEstimateOpen && (
                  <div className="px-4 pb-4 pt-1 border-t border-[#f0f0f0] text-[13px] text-[#707072] space-y-1">
                    <div className="flex items-center gap-2 text-[#111111]">
                      <svg
                        className="w-4 h-4 text-[#008a00] shrink-0"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect x="1" y="3" width="15" height="13" rx="1" />
                        <polygon points="16 8 20 8 23 11 23 16 16 8" />
                        <circle cx="5.5" cy="18.5" r="2.5" />
                        <circle cx="18.5" cy="18.5" r="2.5" />
                      </svg>
                      <span>
                        Expected delivery by{' '}
                        <strong className="font-semibold text-[#111111]">
                          {address.deliveryEtd || '3-5 business days'}
                        </strong>
                      </span>
                    </div>
                    <p className="text-[12px] text-[#8d8d8d] pl-6">
                      Standard surface shipping across India via Shiprocket
                    </p>
                  </div>
                )}
              </div>

              {/* Accordion 2: Price Details */}
              <div className="border border-[#e5e5e5] rounded-[14px] bg-white overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.02)]">
                <button
                  type="button"
                  onClick={() => setIsPriceDetailsOpen(!isPriceDetailsOpen)}
                  className="w-full p-4 flex items-center justify-between text-left cursor-pointer hover:bg-[#fafafa] transition-colors"
                >
                  <span
                    className="text-[15px] font-bold text-[#111111] font-['Helvetica_Now_Text_Medium',sans-serif]"
                    style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
                  >
                    Price Details
                  </span>
                  <svg
                    className={`w-4 h-4 text-[#111111] transition-transform duration-200 ${
                      isPriceDetailsOpen ? 'rotate-180' : ''
                    }`}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="18 15 12 9 6 15" />
                  </svg>
                </button>

                {isPriceDetailsOpen && (
                  <div className="px-4 pb-4 pt-1 border-t border-[#f0f0f0] space-y-2.5 text-[13.5px]">
                    <div className="flex justify-between items-center text-[#707072]">
                      <span>Bag Total</span>
                      <span className="text-[#111111] font-medium">
                        ₹{subtotal.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[#707072]">
                      <span className="flex items-center gap-1.5">
                        Shipping Charges
                        <svg
                          className="w-3.5 h-3.5 text-[#8d8d8d]"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <circle cx="12" cy="12" r="10" />
                          <line x1="12" y1="16" x2="12" y2="12" />
                          <line x1="12" y1="8" x2="12.01" y2="8" />
                        </svg>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="line-through text-[#8d8d8d]">₹99</span>
                        <span className="text-[#008a00] font-medium">Free</span>
                      </span>
                    </div>
                    <div className="border-b border-[#f0f0f0] my-2" />
                    <div className="flex justify-between items-center text-[15px] font-bold text-[#111111]">
                      <span
                        className="font-['Helvetica_Now_Text_Medium',sans-serif]"
                        style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
                      >
                        You Pay
                      </span>
                      <span
                        className="font-['Helvetica_Now_Text_Medium',sans-serif]"
                        style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
                      >
                        ₹{subtotal.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 4. Footer Note */}
          <div className="pt-2 pb-6">
            <p
              className="text-center text-[12.5px] text-[#8d8d8d] font-normal font-['Helvetica_Now_Text',sans-serif]"
              style={{ fontFamily: "'Helvetica Now Text', sans-serif" }}
            >
              Powered by Flowify Agency
            </p>
          </div>
        </div>

        {/* Fixed Bottom Bar for Proceed to Pay (matching Bag design) */}
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#e5e5e5] h-[80px] flex items-center px-4 sm:px-6 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
          <div className="w-full max-w-[480px] sm:max-w-[500px] mx-auto">
            <button
              type="button"
              onClick={handleProceedToPayment}
              onMouseEnter={preloadPaymentImages}
              onTouchStart={preloadPaymentImages}
              className="w-full py-4 rounded-full bg-[#111111] hover:bg-black active:scale-[0.99] text-white text-[16px] font-medium transition-all shadow-sm cursor-pointer font-['Helvetica_Now_Text_Medium',sans-serif]"
              style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
            >
              Proceed to Pay
            </button>
          </div>
        </div>
      </div>
    );
  }

  // STEP 3: PAYMENT METHOD SELECTION (EXACT DESIGN MATCH)
  if (checkoutStep === 'payment') {
    const displayName =
      address.name ||
      `${address.firstName || ''} ${address.lastName || ''}`.trim() ||
      'Thilak';
    const displayPhone = address.mobile || '9182390192';
    const displayPincode = address.pincode || '800013';
    const displayHouse = address.houseNo || '33a';
    const displayStreet = address.street || address.roadArea || "Pata lok, behind S'mart, Nehru Nagar";
    const displayLandmark = address.landmark || '';
    const displayAddressLine = [displayHouse, displayStreet, displayLandmark].filter(Boolean).join(', ');
    const displayCity = (address.city || 'PATNA').toUpperCase();

    const handleChangeAddress = () => {
      window.dispatchEvent(
        new CustomEvent('open-login-modal', { detail: { step: 'delivery-address' } })
      );
    };

    const popularBanks = [
      { id: 'AXIS', name: 'AXIS', icon: '/images/payments/bank-axis.svg' },
      { id: 'HDFC', name: 'HDFC', icon: '/images/payments/bank-hdfc.svg' },
      { id: 'ICICI', name: 'ICICI', icon: '/images/payments/bank-icici.svg' },
      { id: 'KOTAK', name: 'KOTAK', icon: '/images/payments/bank-kotak.svg' },
      { id: 'SBI', name: 'SBI', icon: '/images/payments/bank-sbi.svg' },
      { id: 'YES', name: 'YES', icon: '/images/payments/bank-yes.svg' },
      { id: 'Other', name: 'Other Bank', icon: '/images/payments/bank-other.svg' },
    ];

    return (
      <div className="min-h-screen bg-white font-['Helvetica_Now_Text',sans-serif] text-[#111111]">
        {/* Instant high-priority preload link tags for all payment icons */}
        {PAYMENT_ICONS.map((iconSrc) => (
          <link
            key={`preload-payment-${iconSrc}`}
            rel="preload"
            as="image"
            href={iconSrc}
            fetchPriority="high"
          />
        ))}

        {/* Top Sticky Header */}
        <div className="sticky top-0 z-30 bg-white border-b border-[#f0f0f0]">
          <div className="max-w-[480px] sm:max-w-[500px] mx-auto px-4 h-14 flex items-center gap-3.5">
            <button
              type="button"
              onClick={() => setCheckoutStep('address')}
              className="w-9 h-9 -ml-1.5 flex items-center justify-center text-[#111111] hover:text-[#707072] cursor-pointer transition-colors"
              aria-label="Back to Address"
            >
              <svg
                className="w-5 h-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </button>
            <h1
              className="text-[18px] sm:text-[19px] font-bold text-[#111111] tracking-tight font-['Helvetica_Now_Text_Medium',sans-serif]"
              style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
            >
              Select payment option
            </h1>
          </div>
        </div>

        {/* Content Container */}
        <div className="max-w-[480px] sm:max-w-[500px] mx-auto px-4 pt-5 pb-24 space-y-3.5">
          {/* Option 1: UPI */}
          <div className="border border-[#e5e5e5] rounded-[16px] p-4 bg-white shadow-[0_1px_4px_rgba(0,0,0,0.02)] transition-all">
            <div
              onClick={() => {
                setPaymentMethod('upi');
                setSelectedPaymentAccordion(
                  selectedPaymentAccordion === 'upi' ? '' : 'upi'
                );
              }}
              className="flex items-center justify-between cursor-pointer select-none"
            >
              <div className="flex items-center gap-3.5">
                <span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0">
                  <img
                    src="/images/payments/upi.svg"
                    alt="UPI"
                    className="w-6 h-6 object-contain"
                    loading="eager"
                    fetchPriority="high"
                    decoding="async"
                  />
                </span>
                <div>
                  <p
                    className="text-[16px] font-bold text-[#111111] leading-tight font-['Helvetica_Now_Text_Medium',sans-serif]"
                    style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
                  >
                    UPI
                  </p>
                  <p className="text-[13px] text-[#707072] mt-0.5">
                    Google Pay, PhonePe, Paytm & more
                  </p>
                </div>
              </div>
              <img
                src={selectedPaymentAccordion === 'upi' ? '/images/payments/caret-up.svg' : '/images/payments/caret-down.svg'}
                alt=""
                className="w-5 h-5 shrink-0"
                loading="eager"
                fetchPriority="high"
                decoding="async"
              />
            </div>

            {selectedPaymentAccordion === 'upi' && (
              <div className="mt-4 pt-3 border-t border-[#f0f0f0]">
                {/* 4 UPI Apps Grid */}
                <div className="grid grid-cols-4 gap-2 sm:gap-2.5">
                  {/* Google Pay */}
                  <div
                    onClick={() => setSelectedUpiApp('gpay')}
                    className="flex flex-col items-center cursor-pointer select-none group"
                  >
                    <div
                      className={`w-14 h-14 sm:w-16 sm:h-16 rounded-[14px] bg-white flex items-center justify-center p-2.5 transition-all ${
                        selectedUpiApp === 'gpay'
                          ? 'border-2 border-[#111111] shadow-sm'
                          : 'border border-[#e5e5e5] hover:border-[#8d8d8d]'
                      }`}
                    >
                      <img
                        src="/images/payments/googlePay.svg"
                        alt="Google Pay"
                        className="w-7 h-7 sm:w-8 sm:h-8 object-contain"
                        loading="eager"
                        fetchPriority="high"
                        decoding="async"
                      />
                    </div>
                    <p className="text-[12px] font-medium text-[#111111] text-center mt-1.5 leading-tight">
                      Google Pay
                    </p>
                  </div>

                  {/* PhonePe */}
                  <div
                    onClick={() => setSelectedUpiApp('phonepe')}
                    className="flex flex-col items-center cursor-pointer select-none group"
                  >
                    <div
                      className={`w-14 h-14 sm:w-16 sm:h-16 rounded-[14px] bg-white flex items-center justify-center p-2.5 transition-all ${
                        selectedUpiApp === 'phonepe'
                          ? 'border-2 border-[#111111] shadow-sm'
                          : 'border border-[#e5e5e5] hover:border-[#8d8d8d]'
                      }`}
                    >
                      <img
                        src="/images/payments/phonePe.svg"
                        alt="PhonePe"
                        className="w-7 h-7 sm:w-8 sm:h-8 object-contain"
                        loading="eager"
                        fetchPriority="high"
                        decoding="async"
                      />
                    </div>
                    <p className="text-[12px] font-medium text-[#111111] text-center mt-1.5 leading-tight">
                      PhonePe
                    </p>
                  </div>

                  {/* Paytm */}
                  <div
                    onClick={() => setSelectedUpiApp('paytm')}
                    className="flex flex-col items-center cursor-pointer select-none group"
                  >
                    <div
                      className={`w-14 h-14 sm:w-16 sm:h-16 rounded-[14px] bg-white flex items-center justify-center p-2.5 transition-all ${
                        selectedUpiApp === 'paytm'
                          ? 'border-2 border-[#111111] shadow-sm'
                          : 'border border-[#e5e5e5] hover:border-[#8d8d8d]'
                      }`}
                    >
                      <img
                        src="/images/payments/paytm.svg"
                        alt="Paytm"
                        className="w-7 h-7 sm:w-8 sm:h-8 object-contain"
                        loading="eager"
                        fetchPriority="high"
                        decoding="async"
                      />
                    </div>
                    <p className="text-[12px] font-medium text-[#111111] text-center mt-1.5 leading-tight">
                      Paytm
                    </p>
                  </div>

                  {/* Other UPI */}
                  <div
                    onClick={() => setSelectedUpiApp('other')}
                    className="flex flex-col items-center cursor-pointer select-none group"
                  >
                    <div
                      className={`w-14 h-14 sm:w-16 sm:h-16 rounded-[14px] bg-white flex items-center justify-center p-2.5 transition-all ${
                        selectedUpiApp === 'other'
                          ? 'border-2 border-[#111111] shadow-sm'
                          : 'border border-[#e5e5e5] hover:border-[#8d8d8d]'
                      }`}
                    >
                      <img
                        src="/images/payments/otherUpi.svg"
                        alt="Other UPI"
                        className="w-7 h-7 sm:w-8 sm:h-8 object-contain"
                        loading="eager"
                        fetchPriority="high"
                        decoding="async"
                      />
                    </div>
                    <p className="text-[12px] font-medium text-[#111111] text-center mt-1.5 leading-tight">
                      Other UPI
                    </p>
                  </div>
                </div>

                {/* Optional input when Other UPI is selected */}
                {selectedUpiApp === 'other' && (
                  <div className="mt-4">
                    <input
                      type="text"
                      placeholder="Enter UPI ID (e.g. mobile@okhdfcbank)"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      className="w-full h-[48px] px-3.5 rounded-[10px] border border-[#8d8d8d] focus:border-[#111111] text-[14px] outline-none"
                    />
                  </div>
                )}

                {/* Pay Button matching screenshot */}
                <button
                  type="button"
                  disabled={isPlacingOrder}
                  onClick={handlePlaceOrder}
                  className="w-full py-4 mt-5 rounded-full bg-[#111111] hover:bg-black active:scale-[0.99] text-white text-[16px] font-medium transition-all shadow-sm cursor-pointer disabled:opacity-75 flex items-center justify-center gap-2 font-['Helvetica_Now_Text_Medium',sans-serif]"
                  style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
                >
                  {isPlacingOrder ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Processing Payment...</span>
                    </>
                  ) : (
                    `Pay ₹${subtotal.toLocaleString('en-IN')}`
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Option 2: Credit/ Debit Card */}
          <div className="border border-[#e5e5e5] rounded-[16px] p-4 bg-white shadow-[0_1px_4px_rgba(0,0,0,0.02)] transition-all">
            <div
              onClick={() => {
                setPaymentMethod('card');
                setSelectedPaymentAccordion(
                  selectedPaymentAccordion === 'card' ? '' : 'card'
                );
              }}
              className="flex items-center justify-between cursor-pointer select-none"
            >
              <div className="flex items-center gap-3.5">
                <span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0">
                  <img
                    src="/images/payments/card.svg"
                    alt="Credit/ Debit Card"
                    className="w-6 h-6 object-contain"
                    loading="eager"
                    fetchPriority="high"
                    decoding="async"
                  />
                </span>
                <div>
                  <p
                    className="text-[16px] font-bold text-[#111111] leading-tight font-['Helvetica_Now_Text_Medium',sans-serif]"
                    style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
                  >
                    Credit/ Debit Card
                  </p>
                  <p className="text-[13px] text-[#707072] mt-0.5">
                    Visa, Mastercard, Rupay & more
                  </p>
                </div>
              </div>
              <img
                src={selectedPaymentAccordion === 'card' ? '/images/payments/caret-up.svg' : '/images/payments/caret-down.svg'}
                alt=""
                className="w-5 h-5 shrink-0"
                loading="eager"
                fetchPriority="high"
                decoding="async"
              />
            </div>

            {selectedPaymentAccordion === 'card' && (
              <div className="mt-4 pt-3.5 border-t border-[#f0f0f0] space-y-3">
                <input
                  type="text"
                  maxLength={19}
                  placeholder="Card Number"
                  value={cardDetails.number}
                  onChange={(e) =>
                    setCardDetails({ ...cardDetails, number: e.target.value })
                  }
                  className="w-full h-[48px] px-3.5 rounded-[10px] border border-[#8d8d8d] focus:border-[#111111] text-[14px] outline-none"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    maxLength={5}
                    placeholder="MM / YY"
                    value={cardDetails.expiry}
                    onChange={(e) =>
                      setCardDetails({ ...cardDetails, expiry: e.target.value })
                    }
                    className="w-full h-[48px] px-3.5 rounded-[10px] border border-[#8d8d8d] focus:border-[#111111] text-[14px] outline-none"
                  />
                  <input
                    type="password"
                    maxLength={4}
                    placeholder="CVV"
                    value={cardDetails.cvv}
                    onChange={(e) =>
                      setCardDetails({ ...cardDetails, cvv: e.target.value })
                    }
                    className="w-full h-[48px] px-3.5 rounded-[10px] border border-[#8d8d8d] focus:border-[#111111] text-[14px] outline-none"
                  />
                </div>
                <input
                  type="text"
                  placeholder="Name on Card"
                  value={cardDetails.name}
                  onChange={(e) =>
                    setCardDetails({ ...cardDetails, name: e.target.value })
                  }
                  className="w-full h-[48px] px-3.5 rounded-[10px] border border-[#8d8d8d] focus:border-[#111111] text-[14px] outline-none"
                />

                <button
                  type="button"
                  disabled={isPlacingOrder}
                  onClick={handlePlaceOrder}
                  className="w-full py-4 mt-4 rounded-full bg-[#111111] hover:bg-black active:scale-[0.99] text-white text-[16px] font-medium transition-all shadow-sm cursor-pointer disabled:opacity-75 flex items-center justify-center gap-2 font-['Helvetica_Now_Text_Medium',sans-serif]"
                  style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
                >
                  {isPlacingOrder ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Processing Payment...</span>
                    </>
                  ) : (
                    `Pay ₹${subtotal.toLocaleString('en-IN')}`
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Option 3: Net Banking */}
          <div className="border border-[#e5e5e5] rounded-[16px] p-4 bg-white shadow-[0_1px_4px_rgba(0,0,0,0.02)] transition-all">
            <div
              onClick={() => {
                setPaymentMethod('netbanking');
                setSelectedPaymentAccordion(
                  selectedPaymentAccordion === 'netbanking' ? '' : 'netbanking'
                );
              }}
              className="flex items-center justify-between cursor-pointer select-none"
            >
              <div className="flex items-center gap-3.5">
                <span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0">
                  <img
                    src="/images/payments/netbanking.svg"
                    alt="Net Banking"
                    className="w-6 h-6 object-contain"
                    loading="eager"
                    fetchPriority="high"
                    decoding="async"
                  />
                </span>
                <div>
                  <p
                    className="text-[16px] font-bold text-[#111111] leading-tight font-['Helvetica_Now_Text_Medium',sans-serif]"
                    style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
                  >
                    Net Banking
                  </p>
                  <p className="text-[13px] text-[#707072] mt-0.5">
                    Pay through your favourite bank
                  </p>
                </div>
              </div>
              <img
                src={selectedPaymentAccordion === 'netbanking' ? '/images/payments/caret-up.svg' : '/images/payments/caret-down.svg'}
                alt=""
                className="w-5 h-5 shrink-0"
                loading="eager"
                fetchPriority="high"
                decoding="async"
              />
            </div>

            {selectedPaymentAccordion === 'netbanking' && (
              <div className="mt-4 pt-3.5 border-t border-[#f0f0f0] space-y-3">
                {/* Bank of India Alert */}
                <div className="p-3 bg-[#fff8e1] rounded-[10px] text-[12.5px] text-[#795548] flex items-center gap-2.5">
                  <img
                    src="/images/payments/alert.svg"
                    alt=""
                    className="w-4 h-4 shrink-0"
                    loading="eager"
                    fetchPriority="high"
                    decoding="async"
                  />
                  <span>
                    Bank of India are experiencing a low success rate. Kindly use another way to pay.
                  </span>
                </div>

                {/* Popular Banks List */}
                <div className="space-y-1.5 pt-1">
                  {popularBanks.map((b) => (
                    <div
                      key={b.id}
                      onClick={() => setSelectedBank(b.id)}
                      className={`flex items-center justify-between p-3 rounded-[10px] cursor-pointer transition-colors ${
                        selectedBank === b.id
                          ? 'bg-[#f7f7f7] border border-[#111111]'
                          : 'hover:bg-[#fafafa] border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={b.icon}
                          alt={b.name}
                          className="w-6 h-6 object-contain"
                          loading="eager"
                          fetchPriority="high"
                          decoding="async"
                        />
                        <span className="text-[14px] font-medium text-[#111111]">
                          {b.name}
                        </span>
                      </div>
                      <img
                        src={
                          selectedBank === b.id
                            ? '/images/payments/radio-selected.svg'
                            : '/images/payments/radio-unselected.svg'
                        }
                        alt=""
                        className="w-5 h-5 shrink-0"
                        loading="eager"
                        fetchPriority="high"
                        decoding="async"
                      />
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  disabled={isPlacingOrder}
                  onClick={handlePlaceOrder}
                  className="w-full py-4 mt-4 rounded-full bg-[#111111] hover:bg-black active:scale-[0.99] text-white text-[16px] font-medium transition-all shadow-sm cursor-pointer disabled:opacity-75 flex items-center justify-center gap-2 font-['Helvetica_Now_Text_Medium',sans-serif]"
                  style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
                >
                  {isPlacingOrder ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Processing Payment...</span>
                    </>
                  ) : (
                    `Pay ₹${subtotal.toLocaleString('en-IN')}`
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Option 4: EMI */}
          <div className="border border-[#e5e5e5] rounded-[16px] p-4 bg-white shadow-[0_1px_4px_rgba(0,0,0,0.02)] transition-all">
            <div
              onClick={() => {
                setPaymentMethod('emi');
                setSelectedPaymentAccordion(
                  selectedPaymentAccordion === 'emi' ? '' : 'emi'
                );
              }}
              className="flex items-center justify-between cursor-pointer select-none"
            >
              <div className="flex items-center gap-3.5">
                <span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0">
                  <img
                    src="/images/payments/emi.svg"
                    alt="EMI"
                    className="w-6 h-6 object-contain"
                    loading="eager"
                    fetchPriority="high"
                    decoding="async"
                  />
                </span>
                <div>
                  <p
                    className="text-[16px] font-bold text-[#111111] leading-tight font-['Helvetica_Now_Text_Medium',sans-serif]"
                    style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
                  >
                    EMI
                  </p>
                  <p className="text-[13px] text-[#707072] mt-0.5">
                    Easy Installment Options
                  </p>
                </div>
              </div>
              <img
                src={selectedPaymentAccordion === 'emi' ? '/images/payments/caret-up.svg' : '/images/payments/caret-down.svg'}
                alt=""
                className="w-5 h-5 shrink-0"
                loading="eager"
                fetchPriority="high"
                decoding="async"
              />
            </div>

            {selectedPaymentAccordion === 'emi' && (
              <div className="mt-4 pt-3.5 border-t border-[#f0f0f0] space-y-4">
                <div className="p-3 bg-[#e8f5e9] rounded-[10px] text-[13px] text-[#008a00] font-medium flex items-center gap-2">
                  <span>10% Instant Discount up to ₹1,500 on HDFC CC EMI</span>
                </div>
                <button
                  type="button"
                  disabled={isPlacingOrder}
                  onClick={handlePlaceOrder}
                  className="w-full py-4 rounded-full bg-[#111111] hover:bg-black active:scale-[0.99] text-white text-[16px] font-medium transition-all shadow-sm cursor-pointer disabled:opacity-75 flex items-center justify-center gap-2 font-['Helvetica_Now_Text_Medium',sans-serif]"
                  style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
                >
                  {isPlacingOrder ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Processing Payment...</span>
                    </>
                  ) : (
                    `Pay ₹${subtotal.toLocaleString('en-IN')}`
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Option 5: Partial Cash on Delivery */}
          <div className="border border-[#e5e5e5] rounded-[16px] p-4 bg-white shadow-[0_1px_4px_rgba(0,0,0,0.02)] transition-all">
            <div
              onClick={() => {
                setPaymentMethod('partial_cod');
                setSelectedPaymentAccordion(
                  selectedPaymentAccordion === 'partial_cod' ? '' : 'partial_cod'
                );
              }}
              className="flex items-center justify-between cursor-pointer select-none"
            >
              <div className="flex items-center gap-3.5">
                <span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0">
                  <img
                    src="/images/payments/cod.svg"
                    alt="Partial COD"
                    className="w-6 h-6 object-contain"
                    loading="eager"
                    fetchPriority="high"
                    decoding="async"
                  />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <p
                      className="text-[16px] font-bold text-[#111111] leading-tight font-['Helvetica_Now_Text_Medium',sans-serif]"
                      style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
                    >
                      Partial Cash on Delivery
                    </p>
                   
                  </div>
                  <p className="text-[13px] text-[#707072] mt-0.5">
                    Pay ₹200 now &bull; ₹{Math.max(0, subtotal - 200).toLocaleString('en-IN')} on delivery
                  </p>
                </div>
              </div>
              <img
                src={
                  selectedPaymentAccordion === 'partial_cod'
                    ? '/images/payments/caret-up.svg'
                    : '/images/payments/caret-down.svg'
                }
                alt=""
                className="w-5 h-5 shrink-0"
                loading="eager"
                fetchPriority="high"
                decoding="async"
              />
            </div>

            {selectedPaymentAccordion === 'partial_cod' && (
              <div className="mt-4 pt-3.5 border-t border-[#f0f0f0] space-y-4">
                <div className="text-[13px] text-neutral-700 space-y-2">
                  <div className="flex items-center justify-between font-medium">
                    <span>Advance Booking Deposit</span>
                    <span className="text-[#111111] font-bold">₹200</span>
                  </div>
                  <div className="flex items-center justify-between text-[#707072]">
                    <span>Due on Delivery</span>
                    <span className="text-[#111111] font-semibold">
                      ₹{Math.max(0, subtotal - 200).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <p className="text-[12px] text-[#707072] pt-1.5 border-t border-neutral-200/60 leading-relaxed">
                    Pay a flat ₹200 advance deposit online to confirm your shipment. The remaining balance of ₹{Math.max(0, subtotal - 200).toLocaleString('en-IN')} is paid to the courier upon delivery.
                  </p>
                </div>
                <button
                  type="button"
                  disabled={isPlacingOrder}
                  onClick={handlePlaceOrder}
                  className="w-full py-4 rounded-full bg-[#111111] hover:bg-black active:scale-[0.99] text-white text-[16px] font-medium transition-all shadow-sm cursor-pointer disabled:opacity-75 flex items-center justify-center gap-2 font-['Helvetica_Now_Text_Medium',sans-serif]"
                  style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
                >
                  {isPlacingOrder ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Processing Advance Deposit...</span>
                    </>
                  ) : (
                    'Pay ₹200 to Confirm Order'
                  )}
                </button>
              </div>
            )}
          </div>

          {/* ORDER INFORMATION (EXACT SCREENSHOT MATCH) */}
          <div className="pt-5 space-y-3.5">
            <h2
              className="text-[18px] sm:text-[20px] font-bold text-[#111111] font-['Helvetica_Now_Text_Medium',sans-serif]"
              style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
            >
              Order Information
            </h2>

            {/* Deliver To Accordion */}
            <div className="border border-[#e5e5e5] rounded-[16px] p-4 sm:p-5 bg-white shadow-[0_1px_4px_rgba(0,0,0,0.02)] transition-all">
              <div
                onClick={() => setIsPaymentOrderAddressOpen(!isPaymentOrderAddressOpen)}
                className="flex items-center justify-between cursor-pointer select-none"
              >
                <p
                  className="text-[15px] sm:text-[16px] font-bold text-[#111111] font-['Helvetica_Now_Text_Medium',sans-serif]"
                  style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
                >
                  Deliver to {displayName}, {displayPincode}
                </p>
                <img
                  src={
                    isPaymentOrderAddressOpen
                      ? '/images/payments/caret-up.svg'
                      : '/images/payments/caret-down.svg'
                  }
                  alt=""
                  className="w-5 h-5 shrink-0"
                  loading="eager"
                  fetchPriority="high"
                  decoding="async"
                />
              </div>

              {isPaymentOrderAddressOpen && (
                <div className="mt-3.5 pt-3.5 border-t border-[#f0f0f0] text-[13px] text-[#707072] space-y-1">
                  <p className="text-[#111111] font-medium">
                    {displayName} &bull; +91 {displayPhone}
                  </p>
                  <p>{displayAddressLine}</p>
                  <p>
                    {displayCity} - {displayPincode}
                  </p>
                  <button
                    type="button"
                    onClick={handleChangeAddress}
                    className="mt-2 text-[13px] font-medium text-[#111111] underline hover:text-[#707072] cursor-pointer"
                  >
                    Change or Add Address
                  </button>
                </div>
              )}
            </div>

            {/* Price Details Accordion */}
            <div className="border border-[#e5e5e5] rounded-[16px] p-4 sm:p-5 bg-white shadow-[0_1px_4px_rgba(0,0,0,0.02)] transition-all">
              <div
                onClick={() => setIsPaymentPriceDetailsOpen(!isPaymentPriceDetailsOpen)}
                className="flex items-center justify-between cursor-pointer select-none"
              >
                <p
                  className="text-[15px] sm:text-[16px] font-bold text-[#111111] font-['Helvetica_Now_Text_Medium',sans-serif]"
                  style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
                >
                  Price Details
                </p>
                <img
                  src={
                    isPaymentPriceDetailsOpen
                      ? '/images/payments/caret-up.svg'
                      : '/images/payments/caret-down.svg'
                  }
                  alt=""
                  className="w-5 h-5 shrink-0"
                  loading="eager"
                  fetchPriority="high"
                  decoding="async"
                />
              </div>

              {isPaymentPriceDetailsOpen && (
                <div className="mt-4 pt-3.5 border-t border-[#f0f0f0] space-y-3.5">
                  <div className="flex items-center justify-between text-[14px] text-[#707072]">
                    <span>Bag Total</span>
                    <span className="text-[#111111] font-medium">
                      ₹{subtotal.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[14px] text-[#707072]">
                    <span className="flex items-center gap-1.5">
                      Shipping Charges
                      <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full border border-[#8d8d8d] text-[10px] text-[#8d8d8d]">
                        i
                      </span>
                    </span>
                    <div className="flex items-center gap-1.5 font-medium">
                      <span className="line-through text-[#8d8d8d] text-[13px]">₹99</span>
                      <span className="text-[#059669]">Free</span>
                    </div>
                  </div>
                  {paymentMethod === 'partial_cod' ? (
                    <>
                      <div className="flex items-center justify-between text-[14px] text-[#707072]">
                        <span>Advance Paid Online</span>
                        <span className="text-[#111111] font-medium">₹200</span>
                      </div>
                      <div className="flex items-center justify-between text-[14px] text-[#707072]">
                        <span>Due on Delivery</span>
                        <span className="text-[#111111] font-medium">
                          ₹{Math.max(0, subtotal - 200).toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="pt-3 border-t border-[#f0f0f0] flex items-center justify-between">
                        <span
                          className="text-[15px] sm:text-[16px] font-bold text-[#111111] font-['Helvetica_Now_Text_Medium',sans-serif]"
                          style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
                        >
                          You Pay Now
                        </span>
                        <span
                          className="text-[15px] sm:text-[16px] font-bold text-[#111111] font-['Helvetica_Now_Text_Medium',sans-serif]"
                          style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
                        >
                          ₹200
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="pt-3 border-t border-[#f0f0f0] flex items-center justify-between">
                      <span
                        className="text-[15px] sm:text-[16px] font-bold text-[#111111] font-['Helvetica_Now_Text_Medium',sans-serif]"
                        style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
                      >
                        You Pay
                      </span>
                      <span
                        className="text-[15px] sm:text-[16px] font-bold text-[#111111] font-['Helvetica_Now_Text_Medium',sans-serif]"
                        style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
                      >
                        ₹{subtotal.toLocaleString('en-IN')}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Full-width Divider & Powered by Flowify Agency */}
        <div className="w-full border-t border-[#e5e5e5] mt-10 pt-6 pb-14 text-center">
          <p className="text-[13px] text-[#707072] font-normal tracking-wide">
            Powered by Flowify Agency
          </p>
        </div>
      </div>
    );
  }

  // STEP 1: ACTIVE BAG SCREEN (EXACT DESIGN MATCH)
  return (
    <div className="w-full max-w-[1240px] mx-auto px-5 sm:px-8 lg:px-12 pt-6 sm:pt-10 pb-16 font-['Helvetica_Now_Text',sans-serif] select-none text-[#111111]">
      {/* High-priority Image Preloads for simultaneous instant loading */}
      {cartItems.map((it) => (
        <link key={`pl-${it.id}-${it.image}`} rel="preload" as="image" href={it.image} fetchPriority="high" />
      ))}
      {LAST_MINUTE_ADDITIONS.map((addon) => (
        <link key={`pl-add-${addon.id}`} rel="preload" as="image" href={addon.image} fetchPriority="high" />
      ))}

      {/* Centered Bag Header */}
      <div className="text-center pt-2 mb-8">
        <h1
          className="text-[26px] sm:text-[30px] font-bold tracking-tight text-[#111111] font-['Helvetica_Now_Text_Medium',sans-serif]"
          style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
        >
          Bag
        </h1>
        <p className="text-[14px] sm:text-[15px] text-[#707072] mt-1 font-normal">
          {totalQuantity} {totalQuantity === 1 ? 'item' : 'items'} | ₹{subtotal.toLocaleString('en-IN')}
        </p>
        <div className="border-t border-[#e5e5e5] mt-6" />
      </div>

      {/* 2-Column Desktop Grid / 1-Column Mobile Layout */}
      <div className="lg:grid lg:grid-cols-[1fr_380px] lg:gap-16 xl:gap-20 items-start">
        {/* LEFT COLUMN: Bag Items */}
        <div>


          {/* Items List */}
          <div>
            {cartItems.map((item, idx) => {
              const itemKey = `${item.id}-${item.size}-${item.color}-${idx}`;
              const isFavourited = wishlist[itemKey];
              const itemColor =
                item.color ||
                (item.name?.toLowerCase().includes('stealth') ? 'Black' : idx % 2 === 0 ? 'Grey' : 'White');
              const itemDelivery = 'Delivery by Wed, 28 Oct';
              const isLowStock = idx % 2 === 0 ? 3 : 1;

              return (
                <div key={itemKey} className="border-b border-[#e5e5e5] pb-8 mb-8 last:border-b-0 last:mb-0">
                  {/* Product Info Row */}
                  <div className="flex gap-4 sm:gap-6 items-stretch">
                    {/* Square Product Image (Clickable - height matches details, ZERO padding) */}
                    <Link
                      href={getProductHref(item)}
                      className="self-stretch w-[130px] sm:w-[155px] shrink-0 flex items-center justify-center rounded-sm group overflow-hidden"
                    >
                      <img
                        src={item.image}
                        alt={item.name}
                        loading="eager"
                        fetchPriority="high"
                        decoding="async"
                        className="w-full h-full object-contain mix-blend-multiply transition-transform duration-300 group-hover:scale-105"
                      />
                    </Link>

                    {/* Details Column */}
                    <div className="flex-1 min-w-0 pt-0.5">
                      {/* 1. Price */}
                      <p className="text-[17px] sm:text-[18px] font-bold text-[#111111] leading-none">
                        ₹ {(item.priceNumber || 13995).toLocaleString('en-IN')}
                      </p>

                      {/* 2. Product Name */}
                      <Link href={getProductHref(item)} className="block mt-1.5 hover:underline">
                        <h2
                          className="text-[16px] sm:text-[17px] font-bold text-[#111111] leading-snug font-['Helvetica_Now_Text_Medium',sans-serif]"
                          style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
                        >
                          {item.name}
                        </h2>
                      </Link>

                      {/* 3. Category */}
                      <p className="text-[14px] text-[#707072] leading-normal">
                        {item.category || "Women's Training Shoes"}
                      </p>

                      {/* 4. Shipping / Delivery */}
                      <p className="text-[14px] text-[#707072] leading-normal">
                        Usually ships in 1 day
                      </p>

                      {/* 5. Return Policy */}
                      <p className="text-[14px] text-[#707072] leading-normal">
                        7 Day Return
                      </p>

                      {/* 6. Size */}
                      <div className="mt-1">
                        <button
                          type="button"
                          onClick={() => openSizeModal(item)}
                          className="text-[14px] font-medium text-[#111111] underline underline-offset-4 decoration-1 cursor-pointer hover:text-[#707072] transition-colors"
                        >
                          Size {item.size || 'UK 8'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Quantity Pill + Wishlist Action Row */}
                  <div className="mt-4 flex items-center gap-2.5">
                    <div className="inline-flex items-center border border-[#e5e5e5] rounded-full h-10 px-3 bg-white">
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.id, item.size, item.color)}
                        className="p-1 text-[#111111] hover:text-[#707072] transition-colors cursor-pointer"
                        aria-label="Remove item"
                      >
                        <svg
                          aria-hidden="true"
                          focusable="false"
                          viewBox="0 0 24 24"
                          width="22px"
                          height="22px"
                          fill="none"
                        >
                          <path
                            stroke="currentColor"
                            strokeMiterlimit="10"
                            strokeWidth="1.5"
                            d="M13.75 10v7m-3.5-7v7m-3.5-8.5V17c0 1.24 1.01 2.25 2.25 2.25h6c1.24 0 2.25-1.01 2.25-2.25V7.75h2.25m-10-3h3.75c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5H4.5"
                          />
                        </svg>
                      </button>

                      <span className="px-3 text-[15px] font-medium text-[#111111] min-w-[24px] text-center">
                        {item.quantity || 1}
                      </span>

                      <button
                        type="button"
                        onClick={() => updateCartQuantity(item.id, item.size, item.color, 1)}
                        className="p-1 text-[#111111] hover:text-[#707072] text-[18px] font-normal transition-colors cursor-pointer leading-none flex items-center justify-center"
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>

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

                  {/* Urgency Badge */}
                  <div className="mt-3 flex items-center gap-1.5 text-[#b07800] text-[13.5px]">
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
                    <span>Only {isLowStock} left.</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT COLUMN: Sticky Summary Sidebar */}
        <div className="lg:sticky lg:top-24 mt-8 lg:mt-0">
          <h2 className="text-[22px] sm:text-[24px] font-bold text-[#111111] mb-5 tracking-tight">
            Summary
          </h2>

          <div className="space-y-3.5 text-[15px] sm:text-[16px] text-[#111111]">
            <div className="flex items-center justify-between">
              <span>Bag Total</span>
              <span>₹ {subtotal.toLocaleString('en-IN')}</span>
            </div>

            <div className="flex items-center justify-between">
              <span>Sub Total</span>
              <span>₹ {subtotal.toLocaleString('en-IN')}</span>
            </div>

            <div className="flex items-center justify-between">
              <span>Shipping Charges</span>
              <span className="text-[#0d8240] font-normal">Free</span>
            </div>

            {appliedPromo && (
              <div className="flex items-center justify-between text-[#0d8240]">
                <span>Promo ({appliedPromo.code})</span>
                <span>- ₹ {promoDiscountAmount.toLocaleString('en-IN')}</span>
              </div>
            )}
          </div>

          <div className="border-t border-[#e5e5e5] my-4" />

          <div className="flex items-center justify-between text-[17px] sm:text-[18px] font-bold text-[#111111]">
            <span>You Pay</span>
            <span>₹ {youPay.toLocaleString('en-IN')}</span>
          </div>

          <div className="border-t border-[#e5e5e5] mt-4 mb-4" />

          {/* Have a promo code? section strictly matching screenshot */}
          <div className="border-b border-[#e5e5e5] pb-4">
            <button
              type="button"
              onClick={() => setIsPromoOpen(!isPromoOpen)}
              className="w-full flex items-center justify-between py-2 text-left cursor-pointer group"
              aria-expanded={isPromoOpen}
            >
              <div className="flex items-center gap-3">
                {/* Coupon ticket icon matching screenshot */}
                <svg
                  viewBox="0 0 24 24"
                  className="w-5 h-5 text-[#111111] shrink-0"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                >
                  <rect x="2" y="6" width="20" height="12" rx="2" />
                  <circle cx="8" cy="12" r="1.5" fill="currentColor" />
                  <circle cx="16" cy="12" r="1.5" fill="currentColor" />
                  <line x1="16" y1="9" x2="8" y2="15" strokeLinecap="round" />
                </svg>
                <div>
                  <p className="text-[15px] font-bold text-[#111111] leading-tight">
                    Have a promo code?
                  </p>
                  <p className="text-[13px] text-[#707072] mt-0.5 leading-tight">
                    {appliedPromo
                      ? `${appliedPromo.code} applied (10% off)`
                      : 'Apply now to get instant savings'}
                  </p>
                </div>
              </div>

              <svg
                viewBox="0 0 24 24"
                className={`w-5 h-5 text-[#111111] transition-transform duration-200 shrink-0 ${
                  isPromoOpen ? 'rotate-90' : ''
                }`}
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {/* Promo Code Input Accordion */}
            {isPromoOpen && (
              <div className="mt-3 pt-2">
                {appliedPromo ? (
                  <div className="flex items-center justify-between bg-[#f5f5f5] px-3.5 py-2.5 rounded-lg text-[14px]">
                    <span className="font-medium text-[#0d8240]">
                      Code {appliedPromo.code} applied (-10%)
                    </span>
                    <button
                      type="button"
                      onClick={handleRemovePromo}
                      className="text-[13px] text-[#707072] hover:text-[#111111] underline cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyPromo} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter promo code"
                      value={promoInput}
                      onChange={(e) => {
                        setPromoInput(e.target.value);
                        setPromoError('');
                      }}
                      className="flex-1 px-3.5 py-2.5 rounded-full border border-[#8d8d8d] focus:border-[#111111] text-[14px] outline-none uppercase"
                    />
                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-full bg-[#111111] hover:bg-black text-white text-[14px] font-medium transition-all cursor-pointer"
                    >
                      Apply
                    </button>
                  </form>
                )}
                {promoError && (
                  <p className="text-[12.5px] text-red-600 mt-1.5 pl-1">{promoError}</p>
                )}
              </div>
            )}
          </div>

          {/* Proceed to Buy CTA (Desktop sidebar only; mobile uses the fixed bottom bar) */}
          <div className="hidden lg:block mt-6">
            <button
              type="button"
              onClick={handleProceedToBuy}
              className="w-full py-4 rounded-full bg-[#111111] hover:bg-black active:scale-[0.99] text-white text-[16px] font-medium transition-all shadow-sm cursor-pointer font-['Helvetica_Now_Text_Medium',sans-serif]"
              style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
            >
              Proceed to Buy
            </button>
          </div>
        </div>
      </div>

      {/* SECTION: Last Minute Addition (Single row on mobile) */}
      <section className="mt-8 sm:mt-16 lg:mt-24 pt-6 sm:pt-8 border-t border-[#f0f0f0]" aria-label="Last Minute Addition">
        <h2 className="text-[24px] sm:text-[28px] font-bold text-[#111111] mb-6 sm:mb-8 tracking-tight">
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
            className="-mx-5 px-5 sm:-mx-8 sm:px-8 lg:mx-0 lg:px-0 flex lg:grid lg:grid-cols-4 gap-2 sm:gap-6 overflow-x-auto scrollbar-none pb-2 snap-x snap-mandatory"
          >
            {LAST_MINUTE_ADDITIONS.map((addon) => {
              const isAdded = addedAddonId === addon.id;

              return (
                <div
                  key={addon.id}
                  className="flex flex-col group w-[165px] sm:w-[190px] lg:w-auto shrink-0 snap-start first:pl-3 sm:first:pl-4 lg:first:pl-0"
                >
                  {/* Square Image Box (Smaller compact scale) */}
                  <div className="w-full aspect-square flex items-center justify-center overflow-hidden">
                    <img
                      src={addon.image}
                      alt={addon.title}
                      loading="eager"
                      fetchPriority="high"
                      decoding="async"
                      className="w-full h-full object-contain mix-blend-multiply transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>

                  {/* Info */}
                  <div className="pt-2 flex-1 flex flex-col justify-between">
                    <div>
                      <p className="text-[11px] sm:text-[12px] text-[#707072] font-normal leading-tight">
                        {addon.brand}
                      </p>
                      <h3 className="text-[12px] sm:text-[13px] font-normal text-[#111111] mt-0.5 leading-snug line-clamp-1">
                        {addon.title}
                      </h3>
                      <p className="text-[13px] sm:text-[14px] font-bold text-[#111111] mt-1">
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
      </section>

      {/* Mobile Fixed Bottom Bar (Only visible on screens < lg) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#e5e5e5] h-[80px] flex items-center px-5 sm:px-6 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
        <button
          type="button"
          onClick={handleProceedToBuy}
          className="w-full py-4 rounded-full bg-[#111111] hover:bg-black active:scale-[0.99] text-white text-[16px] font-medium transition-all shadow-sm cursor-pointer font-['Helvetica_Now_Text_Medium',sans-serif]"
          style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
        >
          Proceed to Buy
        </button>
      </div>

      {/* Size Selector Modal / Bottom Sheet (Matches User Screenshot Strictly) */}
      {isSizeModalMounted && editingSizeItem && (
        <div className="fixed inset-0 z-50 overflow-hidden font-['Helvetica_Now_Text',sans-serif]">
          {/* Blacked-out backdrop overlay with smooth fade */}
          <div
            className={`fixed inset-0 bg-black/60 transition-opacity duration-300 ease-out cursor-pointer ${
              isSizeBackdropVisible ? 'opacity-100' : 'opacity-0'
            }`}
            onClick={closeSizeModal}
          />

          {/* Drawer Sheet / Centered Modal */}
          <div
            className={`fixed inset-x-0 bottom-0 sm:inset-auto sm:top-1/2 sm:left-1/2 w-full sm:max-w-[480px] bg-white rounded-t-[24px] sm:rounded-[24px] shadow-2xl z-50 px-6 pt-6 pb-8 overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
              isSizeModalVisible
                ? 'translate-y-0 opacity-100 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:scale-100 sm:opacity-100'
                : 'translate-y-full opacity-0 sm:-translate-x-1/2 sm:translate-y-[100vh] sm:scale-95 sm:opacity-0'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header: Title, Category, Price on Left; Raw X on Right */}
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-[18px] sm:text-[19px] font-bold text-[#111111] leading-tight font-['Helvetica_Now_Text_Medium',sans-serif]">
                  {editingSizeItem.name}
                </h2>
                <p className="text-[15px] sm:text-[16px] text-[#111111] font-normal mt-1 leading-tight">
                  {editingSizeItem.category || "Women's Training Shoes"}
                </p>
                <p className="text-[16px] sm:text-[17px] font-bold text-[#111111] mt-1.5 leading-tight">
                  ₹{(editingSizeItem.priceNumber || 13995).toLocaleString('en-IN')}
                </p>
              </div>

              {/* Close Button: Clean raw X matching screenshot */}
              <button
                type="button"
                onClick={closeSizeModal}
                className="p-1 -mr-1 -mt-1 text-[#111111] hover:opacity-60 transition-opacity cursor-pointer"
                aria-label="Close"
              >
                <svg className="w-6 h-6 stroke-[1.8]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Size Grid: 4 columns, light grey border rounded boxes */}
            <div className="mt-7">
              <div className="grid grid-cols-4 gap-2.5 sm:gap-3">
                {['UK 3', 'UK 4', 'UK 5', 'UK 6', 'UK 7', 'UK 8', 'UK 9'].map((sz) => {
                  const isSelected = sz === tempSelectedSize;
                  const isOutOfStock =
                    sz === 'UK 9' &&
                    (editingSizeItem.category?.toLowerCase().includes('women') ||
                      editingSizeItem.name?.toLowerCase().includes('women') ||
                      editingSizeItem.name?.toLowerCase().includes('hybrid rn'));

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
                      onClick={() => setTempSelectedSize(sz)}
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
                disabled={!tempSelectedSize}
                onClick={() => {
                  if (!tempSelectedSize) return;
                  updateCartItemSize(
                    editingSizeItem.id,
                    editingSizeItem.size,
                    editingSizeItem.color,
                    tempSelectedSize
                  );
                  setCartItems(getCartItems());
                  closeSizeModal();
                }}
                className={`w-full py-4 rounded-full text-[16px] font-medium transition-all ${
                  tempSelectedSize
                    ? 'bg-[#111111] text-white hover:bg-black active:scale-[0.99] cursor-pointer'
                    : 'bg-[#e5e5e5] text-[#8e8e93] cursor-not-allowed'
                }`}
              >
                Add to bag
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Size Guide Modal (Layered on top with smooth cubic-bezier animation) */}
      {isSizeGuideMounted && (
        <div className="fixed inset-0 z-60 overflow-hidden font-['Helvetica_Now_Text',sans-serif]">
          {/* Backdrop */}
          <div
            className={`fixed inset-0 bg-black/60 transition-opacity duration-300 ease-out cursor-pointer ${
              isSizeGuideVisible ? 'opacity-100' : 'opacity-0'
            }`}
            onClick={closeSizeGuide}
          />

          {/* Modal Container */}
          <div
            className={`fixed inset-x-0 bottom-0 sm:inset-auto sm:top-1/2 sm:left-1/2 w-full sm:max-w-[620px] max-h-[92vh] sm:max-h-[88vh] bg-white rounded-t-[26px] sm:rounded-[24px] shadow-2xl z-60 px-6 pt-6 pb-8 overflow-y-auto transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
              isSizeGuideVisible
                ? 'translate-y-0 opacity-100 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:scale-100'
                : 'translate-y-full opacity-0 sm:-translate-x-1/2 sm:translate-y-[100vh] sm:scale-95'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-[26px] sm:text-[28px] font-medium text-[#111111] tracking-tight leading-tight">
                  Size Guide
                </h2>
                <p className="text-[15px] text-[#707072] mt-1">
                  {editingSizeItem?.name || 'Footwear'} Size Chart
                </p>
              </div>

              <button
                type="button"
                onClick={closeSizeGuide}
                className="w-9 h-9 rounded-full bg-[#f5f5f5] hover:bg-[#e8e8e8] flex items-center justify-center text-[#111111] transition-colors cursor-pointer"
                aria-label="Close Size Guide"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <p className="text-[15px] sm:text-[16px] text-[#111111] font-normal mt-6 mb-4">
              Below are product&apos;s physical dimensions
            </p>

            {/* in / cm Pill Switcher */}
            <div className="mb-6">
              <div className="relative inline-flex items-center bg-[#f5f5f5] rounded-full p-1 h-[44px]">
                <div
                  className={`absolute top-1 bottom-1 w-[52px] rounded-full bg-white border border-[#111111] transition-all duration-300 ease-in-out ${
                    sizeGuideUnit === 'in' ? 'left-1' : 'left-[55px]'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setSizeGuideUnit('in')}
                  className={`relative z-10 w-[52px] h-[36px] flex items-center justify-center text-[15px] font-medium transition-colors cursor-pointer ${
                    sizeGuideUnit === 'in' ? 'text-[#111111]' : 'text-[#707072]'
                  }`}
                >
                  in
                </button>
                <button
                  type="button"
                  onClick={() => setSizeGuideUnit('cm')}
                  className={`relative z-10 w-[52px] h-[36px] flex items-center justify-center text-[15px] font-medium transition-colors cursor-pointer ${
                    sizeGuideUnit === 'cm' ? 'text-[#111111]' : 'text-[#707072]'
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
                    <tr
                      key={row.size}
                      className="hover:bg-neutral-50 transition-colors cursor-pointer"
                      onClick={() => {
                        if (editingSizeItem) {
                          updateCartItemSize(
                            editingSizeItem.id,
                            editingSizeItem.size,
                            editingSizeItem.color,
                            row.size
                          );
                          setCartItems(getCartItems());
                          closeSizeGuide();
                          closeSizeModal();
                        }
                      }}
                    >
                      <td className="py-4 px-4 font-bold text-[#111111] bg-white border-r border-[#e5e5e5] whitespace-nowrap text-[15px]">
                        {row.size}
                      </td>
                      <td className="py-4 px-3.5 font-normal text-[#111111] bg-[#fafafa] border-r border-[#e5e5e5] whitespace-nowrap text-[15px] transition-all duration-200">
                        {sizeGuideUnit === 'in' ? `${row.inLength} in` : `${row.cmLength} cm`}
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
