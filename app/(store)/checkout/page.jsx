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
  // Steps: 'bag' | 'address' | 'payment' | 'confirmation'
  const [checkoutStep, setCheckoutStep] = useState('bag');

  const [cartItems, setCartItems] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [wishlist, setWishlist] = useState({});

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
    state: 'Maharashtra',
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
      setCartItems(getCartItems());
      setIsLoaded(true);
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
              state: parsed.state || prev.state || 'Maharashtra',
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
            state: parsed.state || prev.state || 'Maharashtra',
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

      // 1. Create order on backend via Razorpay Orders API
      const res = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: subtotal,
          notes: {
            customerName:
              address.name ||
              `${address.firstName || ''} ${address.lastName || ''}`.trim() ||
              'Customer',
            method: paymentMethod,
          },
        }),
      });

      const orderData = await res.json();
      if (!res.ok || !orderData.orderId) {
        throw new Error(orderData.error || 'Failed to create payment order');
      }

      const displayName =
        address.name ||
        `${address.firstName || ''} ${address.lastName || ''}`.trim() ||
        'Customer';

      // 2. Configure and open Razorpay modal
      const options = {
        key: orderData.keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_ToeynJ0XXfrtyp',
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name: 'SONU',
        description: `Order Payment (${totalQuantity} ${totalQuantity === 1 ? 'item' : 'items'})`,
        image: '/images/brand/logo.svg',
        order_id: orderData.orderId,
        prefill: {
          name: displayName,
          email: address.email || '',
          contact: address.mobile || '',
        },
        notes: {
          address: `${address.houseNo || ''}, ${address.street || ''}, ${address.city || ''} - ${address.pincode || ''}`,
          method: paymentMethod,
        },
        theme: {
          color: '#111111',
        },
        modal: {
          ondismiss: () => {
            setIsPlacingOrder(false);
          },
        },
        handler: function (response) {
          const placedOrderId = `SONU-IN-${Math.floor(100000 + Math.random() * 900000)}`;
          const confirmedData = {
            orderId: placedOrderId,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpayOrderId: response.razorpay_order_id,
            razorpaySignature: response.razorpay_signature,
            items: [...cartItems],
            totalAmount: subtotal,
            address: { ...address },
            paymentMethod,
            placedAt: new Date().toISOString(),
            estimatedDelivery: '3-5 business days',
          };

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
      <div className="w-full max-w-[580px] mx-auto px-5 sm:px-6 pt-8 pb-16 font-['Helvetica_Now_Text',sans-serif] text-[#111111]">
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
          <p className="text-[14px] text-[#707072] mt-1.5">
            Order ID: <span className="text-[#111111] font-mono font-medium">{confirmedOrder.orderId}</span>
          </p>
          {confirmedOrder.razorpayPaymentId && (
            <p className="text-[12.5px] text-[#707072] mt-1 font-mono">
              Payment ID: <span className="text-[#111111] font-medium">{confirmedOrder.razorpayPaymentId}</span>
            </p>
          )}
        </div>

        {/* Order Details Card */}
        <div className="mt-8 bg-[#fafafa] border border-[#e5e5e5] rounded-[16px] p-5 sm:p-6 space-y-4">
          <div className="flex justify-between items-start pb-4 border-b border-[#e5e5e5]">
            <div>
              <p className="text-[12px] uppercase tracking-wider text-[#707072] font-medium">Estimated Delivery</p>
              <p className="text-[16px] font-bold text-[#111111] mt-0.5">3-5 Business Days</p>
              <p className="text-[13px] text-[#008a00] font-medium mt-0.5">Free Express Shipping</p>
            </div>
            <div className="text-right">
              <p className="text-[12px] uppercase tracking-wider text-[#707072] font-medium">Amount Paid</p>
              <p className="text-[18px] font-bold text-[#111111] mt-0.5">
                ₹ {confirmedOrder.totalAmount.toLocaleString('en-IN')}
              </p>
              <span className="inline-block px-2 py-0.5 bg-[#e8f5e9] text-[#008a00] rounded text-[11px] font-medium uppercase mt-0.5">
                {confirmedOrder.paymentMethod.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Delivery Address Snapshot */}
          <div className="pb-4 border-b border-[#e5e5e5]">
            <p className="text-[12px] uppercase tracking-wider text-[#707072] font-medium mb-1">Delivering To</p>
            <p className="text-[14px] font-medium text-[#111111]">
              {confirmedOrder.address.firstName} {confirmedOrder.address.lastName}
            </p>
            <p className="text-[13px] text-[#707072] leading-relaxed mt-0.5">
              {confirmedOrder.address.houseNo}, {confirmedOrder.address.street}
              {confirmedOrder.address.landmark ? `, Near ${confirmedOrder.address.landmark}` : ''}
              <br />
              {confirmedOrder.address.city}, {confirmedOrder.address.state} – {confirmedOrder.address.pincode}
            </p>
            <p className="text-[13px] text-[#707072] mt-1">Phone: +91 {confirmedOrder.address.mobile}</p>
          </div>

          {/* Items Summary */}
          <div>
            <p className="text-[12px] uppercase tracking-wider text-[#707072] font-medium mb-2.5">Items Ordered</p>
            <div className="space-y-3">
              {confirmedOrder.items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3.5">
                  <div className="w-14 h-14 bg-white border border-[#e5e5e5] rounded-[8px] shrink-0 p-1 flex items-center justify-center">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-contain mix-blend-multiply"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-medium text-[#111111] truncate">{item.name}</p>
                    <p className="text-[12px] text-[#707072]">
                      Size: {item.size} • Qty: {item.quantity || 1}
                    </p>
                  </div>
                  <p className="text-[14px] font-medium text-[#111111]">
                    ₹ {((item.priceNumber || 13995) * (item.quantity || 1)).toLocaleString('en-IN')}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-8 text-center">
          <Link
            href="/"
            className="inline-block w-full py-4 bg-[#111111] hover:bg-black text-white text-[15px] font-medium rounded-full text-center transition-all shadow-sm"
          >
            Continue Shopping
          </Link>
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
        <div className="max-w-[480px] sm:max-w-[500px] mx-auto px-4 pt-4 pb-28 space-y-5">
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

          {/* 2. Offers for you */}
          <div>
            <div className="flex items-center justify-between pb-2">
              <h2
                className="text-[16px] sm:text-[17px] font-bold text-[#111111] font-['Helvetica_Now_Text_Medium',sans-serif]"
                style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
              >
                Offers for you
              </h2>
              <button
                type="button"
                className="text-[13px] font-medium text-[#111111] hover:underline cursor-pointer font-['Helvetica_Now_Text_Medium',sans-serif]"
                style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
              >
                View all
              </button>
            </div>

            <div className="border border-[#e5e5e5] rounded-[14px] p-4 bg-white flex items-center justify-between shadow-[0_1px_4px_rgba(0,0,0,0.02)]">
              <div>
                <p className="text-[12.5px] font-medium leading-none">
                  <span className="text-[#008a00] font-semibold">Cashback</span>{' '}
                  <span className="text-[#707072]">HDFC EMI Bank Of...</span>
                </p>
                <p
                  className="text-[14px] sm:text-[14.5px] font-bold text-[#111111] mt-1.5 font-['Helvetica_Now_Text_Medium',sans-serif]"
                  style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
                >
                  10% off upto ₹1,500 ...
                </p>
              </div>
              <div className="flex flex-col items-end text-[11.5px] text-[#707072] shrink-0 pl-3">
                <span className="leading-tight">1 of 1</span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#111111] mt-1" />
              </div>
            </div>
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

          {/* 4. Footer Note and Proceed to Pay CTA */}
          <div className="pt-4 pb-4">
            <p
              className="text-center text-[12.5px] text-[#8d8d8d] font-normal mb-4 font-['Helvetica_Now_Text',sans-serif]"
              style={{ fontFamily: "'Helvetica Now Text', sans-serif" }}
            >
              Powered by Flowify Agency
            </p>

            <button
              type="button"
              onClick={handleProceedToPayment}
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

  // STEP 1: ACTIVE BAG SCREEN (Review Bag Items before Checkout)
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
              {/* Product Info Row */}
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
                  <p className="text-[17px] sm:text-[18px] font-bold text-[#111111] leading-none">
                    ₹ {(item.priceNumber || 13995).toLocaleString('en-IN')}
                  </p>

                  <h2
                    className="text-[16px] sm:text-[17px] font-medium text-[#111111] mt-1.5 leading-snug font-['Helvetica_Now_Text_Medium',sans-serif]"
                    style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
                  >
                    {item.name}
                  </h2>

                  <p className="text-[14px] text-[#707072] mt-1 leading-normal">
                    {item.category || "Women's Training Shoes"} ({item.size})
                  </p>

                  <p className="text-[14px] text-[#707072] mt-0.5 leading-normal">14 Day Return</p>

                  <div className="mt-1">
                    <span className="text-[14px] font-medium text-[#111111] underline underline-offset-4 decoration-1">
                      Size {item.size}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quantity Pill + Wishlist Action Row */}
              <div className="mt-3.5 flex items-center gap-2.5">
                <div className="inline-flex items-center border border-[#e5e5e5] rounded-full h-10 px-3.5 bg-white">
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
                      role="img"
                      width="24px"
                      height="24px"
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

                  <span className="px-3.5 text-[15px] font-medium text-[#111111] min-w-[28px] text-center">
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

      {/* Summary Section */}
      <section className="pt-8 pb-4" aria-label="Order Summary">
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
        </div>

        <div className="border-t border-[#e5e5e5] my-4" />

        <div className="flex items-center justify-between text-[18px] sm:text-[19px] font-bold text-[#111111]">
          <span>You Pay</span>
          <span>₹ {subtotal.toLocaleString('en-IN')}</span>
        </div>

        <div className="border-t border-[#e5e5e5] mt-4 mb-4" />
      </section>

      {/* Fixed Bottom Bar: Proceed to Buy */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#e5e5e5] h-[88px] flex items-center px-5 sm:px-6 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <div className="max-w-[540px] mx-auto w-full">
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
  );
}
