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

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState('upi'); // 'upi' | 'card' | 'cod'
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
          setAddress(JSON.parse(storedAddress));
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
          setAddress(JSON.parse(storedAddress));
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

  // Step 2 -> Step 3: Validate Address & Proceed to Payment
  const handleProceedToPayment = (e) => {
    e?.preventDefault();
    const errors = {};

    if (!address.firstName.trim()) errors.firstName = 'First name is required';
    if (!address.lastName.trim()) errors.lastName = 'Last name is required';
    if (!address.mobile.trim() || address.mobile.replace(/\D/g, '').length !== 10) {
      errors.mobile = 'Enter a valid 10-digit mobile number';
    }
    if (!address.pincode.trim() || address.pincode.replace(/\D/g, '').length !== 6) {
      errors.pincode = 'Enter a valid 6-digit PIN code';
    }
    if (!address.houseNo.trim()) errors.houseNo = 'House / Flat / Building is required';
    if (!address.street.trim()) errors.street = 'Street / Area is required';
    if (!address.city.trim()) errors.city = 'City is required';

    if (Object.keys(errors).length > 0) {
      setAddressErrors(errors);
      return;
    }

    setAddressErrors({});
    try {
      localStorage.setItem('sonu_shipping_address', JSON.stringify(address));
    } catch (err) {
      // storage unavailable
    }

    setCheckoutStep('payment');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Step 3 -> Step 4: Complete Payment & Place Order
  const handlePlaceOrder = () => {
    setIsPlacingOrder(true);

    setTimeout(() => {
      const orderId = `SONU-IN-${Math.floor(100000 + Math.random() * 900000)}`;
      const orderData = {
        orderId,
        items: [...cartItems],
        totalAmount: subtotal,
        address: { ...address },
        paymentMethod,
        placedAt: new Date().toISOString(),
        estimatedDelivery: '3-5 business days',
      };

      try {
        const pastOrders = JSON.parse(localStorage.getItem('sonu_orders') || '[]');
        pastOrders.unshift(orderData);
        localStorage.setItem('sonu_orders', JSON.stringify(pastOrders));
      } catch (err) {
        // ignore
      }

      setConfirmedOrder(orderData);
      clearCart();
      setIsPlacingOrder(false);
      setCheckoutStep('confirmation');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 900);
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

  // STEP 2: SHIPPING & DELIVERY ADDRESS FORM
  if (checkoutStep === 'address') {
    const indianStates = [
      'Maharashtra',
      'Delhi',
      'Karnataka',
      'Tamil Nadu',
      'Telangana',
      'Gujarat',
      'Haryana',
      'Uttar Pradesh',
      'West Bengal',
      'Rajasthan',
      'Kerala',
      'Punjab',
      'Madhya Pradesh',
      'Goa',
    ];

    return (
      <div className="w-full max-w-[540px] mx-auto px-5 sm:px-6 pt-4 sm:pt-6 pb-28 font-['Helvetica_Now_Text',sans-serif] text-[#111111]">
        {/* Back Button & Stepper Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#e5e5e5]">
          <button
            type="button"
            onClick={() => setCheckoutStep('bag')}
            className="text-[14px] font-medium text-[#707072] hover:text-[#111111] flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Bag
          </button>
          <span className="text-[12px] font-medium uppercase tracking-wider text-[#707072]">
            Step 1 of 2
          </span>
        </div>

        {/* Heading */}
        <div className="mt-5 mb-6">
          <h1
            className="text-[24px] sm:text-[26px] font-bold tracking-tight text-[#111111] font-['Helvetica_Now_Text_Medium',sans-serif]"
            style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
          >
            Delivery Address
          </h1>
          <p className="text-[14px] text-[#707072] mt-1">
            Where should we send your order?
          </p>
        </div>

        {/* Address Form */}
        <form onSubmit={handleProceedToPayment} className="space-y-4">
          {/* Row: First Name & Last Name */}
          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[12px] text-[#707072] mb-1 font-medium">First Name*</label>
              <input
                type="text"
                value={address.firstName}
                onChange={(e) => setAddress({ ...address, firstName: e.target.value })}
                className={`w-full h-[50px] px-4 rounded-[8px] border text-[15px] outline-none transition-colors ${
                  addressErrors.firstName ? 'border-[#d32f2f]' : 'border-[#8d8d8d] focus:border-[#111111]'
                }`}
              />
              {addressErrors.firstName && (
                <span className="text-[11px] text-[#d32f2f] mt-1 block">{addressErrors.firstName}</span>
              )}
            </div>
            <div>
              <label className="block text-[12px] text-[#707072] mb-1 font-medium">Last Name*</label>
              <input
                type="text"
                value={address.lastName}
                onChange={(e) => setAddress({ ...address, lastName: e.target.value })}
                className={`w-full h-[50px] px-4 rounded-[8px] border text-[15px] outline-none transition-colors ${
                  addressErrors.lastName ? 'border-[#d32f2f]' : 'border-[#8d8d8d] focus:border-[#111111]'
                }`}
              />
              {addressErrors.lastName && (
                <span className="text-[11px] text-[#d32f2f] mt-1 block">{addressErrors.lastName}</span>
              )}
            </div>
          </div>

          {/* Row: Mobile & PIN code */}
          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[12px] text-[#707072] mb-1 font-medium">Mobile Number*</label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-[14px] text-[#707072]">+91</span>
                <input
                  type="tel"
                  maxLength={10}
                  value={address.mobile}
                  onChange={(e) =>
                    setAddress({ ...address, mobile: e.target.value.replace(/\D/g, '').slice(0, 10) })
                  }
                  className={`w-full h-[50px] pl-12 pr-3 rounded-[8px] border text-[15px] outline-none transition-colors ${
                    addressErrors.mobile ? 'border-[#d32f2f]' : 'border-[#8d8d8d] focus:border-[#111111]'
                  }`}
                />
              </div>
              {addressErrors.mobile && (
                <span className="text-[11px] text-[#d32f2f] mt-1 block">{addressErrors.mobile}</span>
              )}
            </div>
            <div>
              <label className="block text-[12px] text-[#707072] mb-1 font-medium">PIN Code*</label>
              <input
                type="text"
                maxLength={6}
                inputMode="numeric"
                value={address.pincode}
                onChange={(e) =>
                  setAddress({ ...address, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) })
                }
                className={`w-full h-[50px] px-4 rounded-[8px] border text-[15px] outline-none transition-colors ${
                  addressErrors.pincode ? 'border-[#d32f2f]' : 'border-[#8d8d8d] focus:border-[#111111]'
                }`}
              />
              {addressErrors.pincode && (
                <span className="text-[11px] text-[#d32f2f] mt-1 block">{addressErrors.pincode}</span>
              )}
            </div>
          </div>

          {/* Flat / House No / Building */}
          <div>
            <label className="block text-[12px] text-[#707072] mb-1 font-medium">
              Flat, House No., Building, Apartment*
            </label>
            <input
              type="text"
              value={address.houseNo}
              onChange={(e) => setAddress({ ...address, houseNo: e.target.value })}
              className={`w-full h-[50px] px-4 rounded-[8px] border text-[15px] outline-none transition-colors ${
                addressErrors.houseNo ? 'border-[#d32f2f]' : 'border-[#8d8d8d] focus:border-[#111111]'
              }`}
            />
            {addressErrors.houseNo && (
              <span className="text-[11px] text-[#d32f2f] mt-1 block">{addressErrors.houseNo}</span>
            )}
          </div>

          {/* Area / Street */}
          <div>
            <label className="block text-[12px] text-[#707072] mb-1 font-medium">
              Area, Street, Sector, Village*
            </label>
            <input
              type="text"
              value={address.street}
              onChange={(e) => setAddress({ ...address, street: e.target.value })}
              className={`w-full h-[50px] px-4 rounded-[8px] border text-[15px] outline-none transition-colors ${
                addressErrors.street ? 'border-[#d32f2f]' : 'border-[#8d8d8d] focus:border-[#111111]'
              }`}
            />
            {addressErrors.street && (
              <span className="text-[11px] text-[#d32f2f] mt-1 block">{addressErrors.street}</span>
            )}
          </div>

          {/* Landmark */}
          <div>
            <label className="block text-[12px] text-[#707072] mb-1 font-medium">Landmark (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Near Apollo Hospital"
              value={address.landmark}
              onChange={(e) => setAddress({ ...address, landmark: e.target.value })}
              className="w-full h-[50px] px-4 rounded-[8px] border border-[#8d8d8d] focus:border-[#111111] text-[15px] outline-none transition-colors"
            />
          </div>

          {/* Row: City & State */}
          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[12px] text-[#707072] mb-1 font-medium">City / Town*</label>
              <input
                type="text"
                value={address.city}
                onChange={(e) => setAddress({ ...address, city: e.target.value })}
                className={`w-full h-[50px] px-4 rounded-[8px] border text-[15px] outline-none transition-colors ${
                  addressErrors.city ? 'border-[#d32f2f]' : 'border-[#8d8d8d] focus:border-[#111111]'
                }`}
              />
              {addressErrors.city && (
                <span className="text-[11px] text-[#d32f2f] mt-1 block">{addressErrors.city}</span>
              )}
            </div>
            <div>
              <label className="block text-[12px] text-[#707072] mb-1 font-medium">State*</label>
              <select
                value={address.state}
                onChange={(e) => setAddress({ ...address, state: e.target.value })}
                className="w-full h-[50px] px-3.5 rounded-[8px] border border-[#8d8d8d] focus:border-[#111111] bg-white text-[15px] outline-none cursor-pointer"
              >
                {indianStates.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </form>

        {/* Free Delivery Banner */}
        <div className="mt-6 p-4 rounded-[12px] bg-[#f7f7f7] border border-[#e5e5e5] flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#008a00] text-white flex items-center justify-center shrink-0">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <p className="text-[13px] font-bold text-[#111111]">Free Standard Delivery</p>
            <p className="text-[12px] text-[#707072]">Estimated arrival in 3-5 business days across India.</p>
          </div>
        </div>

        {/* Fixed Bottom Bar: Continue to Payment */}
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#e5e5e5] h-[88px] flex items-center px-5 sm:px-6 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
          <div className="max-w-[540px] mx-auto w-full">
            <button
              type="button"
              onClick={handleProceedToPayment}
              className="w-full py-4 rounded-full bg-[#111111] hover:bg-black active:scale-[0.99] text-white text-[16px] font-medium transition-all shadow-sm cursor-pointer font-['Helvetica_Now_Text_Medium',sans-serif]"
              style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
            >
              Continue to Payment
            </button>
          </div>
        </div>
      </div>
    );
  }

  // STEP 3: PAYMENT METHOD SELECTION
  if (checkoutStep === 'payment') {
    return (
      <div className="w-full max-w-[540px] mx-auto px-5 sm:px-6 pt-4 sm:pt-6 pb-28 font-['Helvetica_Now_Text',sans-serif] text-[#111111]">
        {/* Back Button */}
        <div className="flex items-center justify-between pb-4 border-b border-[#e5e5e5]">
          <button
            type="button"
            onClick={() => setCheckoutStep('address')}
            className="text-[14px] font-medium text-[#707072] hover:text-[#111111] flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Address
          </button>
          <span className="text-[12px] font-medium uppercase tracking-wider text-[#707072]">
            Step 2 of 2
          </span>
        </div>

        {/* Heading */}
        <div className="mt-5 mb-6">
          <h1
            className="text-[24px] sm:text-[26px] font-bold tracking-tight text-[#111111] font-['Helvetica_Now_Text_Medium',sans-serif]"
            style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
          >
            Select Payment
          </h1>
          <p className="text-[14px] text-[#707072] mt-1">
            Choose how you would like to pay for your footwear.
          </p>
        </div>

        {/* Delivery Address Snapshot Card */}
        <div className="p-4 rounded-[12px] border border-[#e5e5e5] bg-[#fafafa] flex justify-between items-start mb-6">
          <div>
            <p className="text-[12px] uppercase tracking-wider text-[#707072] font-medium">Deliver To</p>
            <p className="text-[14px] font-medium text-[#111111] mt-0.5">
              {address.firstName} {address.lastName} (+91 {address.mobile})
            </p>
            <p className="text-[12px] text-[#707072] mt-0.5 leading-relaxed">
              {address.houseNo}, {address.street}, {address.city} – {address.pincode}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setCheckoutStep('address')}
            className="text-[13px] font-medium text-[#111111] underline cursor-pointer ml-3 shrink-0"
          >
            Edit
          </button>
        </div>

        {/* Payment Methods */}
        <div className="space-y-3">
          {/* Option 1: UPI */}
          <div
            onClick={() => setPaymentMethod('upi')}
            className={`p-4 rounded-[12px] border transition-all cursor-pointer ${
              paymentMethod === 'upi' ? 'border-[#111111] bg-[#fafafa]' : 'border-[#e5e5e5] hover:border-[#8d8d8d]'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    paymentMethod === 'upi' ? 'border-[#111111]' : 'border-[#8d8d8d]'
                  }`}
                >
                  {paymentMethod === 'upi' && <div className="w-2.5 h-2.5 rounded-full bg-[#111111]" />}
                </div>
                <div>
                  <p className="text-[15px] font-medium text-[#111111]">UPI (Google Pay, PhonePe, Paytm)</p>
                  <p className="text-[12px] text-[#707072]">Instant, secure payment via any UPI app</p>
                </div>
              </div>
              <span className="text-[11px] font-medium uppercase px-2 py-0.5 bg-[#e8f5e9] text-[#008a00] rounded">
                Recommended
              </span>
            </div>

            {paymentMethod === 'upi' && (
              <div className="mt-3.5 pt-3.5 border-t border-[#e5e5e5]">
                <input
                  type="text"
                  placeholder="Enter UPI ID (e.g. mobile@okhdfcbank)"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  className="w-full h-[46px] px-3.5 rounded-[8px] border border-[#8d8d8d] focus:border-[#111111] text-[14px] outline-none"
                />
              </div>
            )}
          </div>

          {/* Option 2: Credit / Debit Card */}
          <div
            onClick={() => setPaymentMethod('card')}
            className={`p-4 rounded-[12px] border transition-all cursor-pointer ${
              paymentMethod === 'card' ? 'border-[#111111] bg-[#fafafa]' : 'border-[#e5e5e5] hover:border-[#8d8d8d]'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  paymentMethod === 'card' ? 'border-[#111111]' : 'border-[#8d8d8d]'
                }`}
              >
                {paymentMethod === 'card' && <div className="w-2.5 h-2.5 rounded-full bg-[#111111]" />}
              </div>
              <div>
                <p className="text-[15px] font-medium text-[#111111]">Credit / Debit Card</p>
                <p className="text-[12px] text-[#707072]">Visa, MasterCard, RuPay, Maestro</p>
              </div>
            </div>

            {paymentMethod === 'card' && (
              <div className="mt-3.5 pt-3.5 border-t border-[#e5e5e5] space-y-3">
                <input
                  type="text"
                  maxLength={19}
                  placeholder="Card Number"
                  value={cardDetails.number}
                  onChange={(e) => setCardDetails({ ...cardDetails, number: e.target.value })}
                  className="w-full h-[46px] px-3.5 rounded-[8px] border border-[#8d8d8d] focus:border-[#111111] text-[14px] outline-none"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    maxLength={5}
                    placeholder="MM / YY"
                    value={cardDetails.expiry}
                    onChange={(e) => setCardDetails({ ...cardDetails, expiry: e.target.value })}
                    className="w-full h-[46px] px-3.5 rounded-[8px] border border-[#8d8d8d] focus:border-[#111111] text-[14px] outline-none"
                  />
                  <input
                    type="password"
                    maxLength={4}
                    placeholder="CVV"
                    value={cardDetails.cvv}
                    onChange={(e) => setCardDetails({ ...cardDetails, cvv: e.target.value })}
                    className="w-full h-[46px] px-3.5 rounded-[8px] border border-[#8d8d8d] focus:border-[#111111] text-[14px] outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Option 3: Cash on Delivery */}
          <div
            onClick={() => setPaymentMethod('cod')}
            className={`p-4 rounded-[12px] border transition-all cursor-pointer ${
              paymentMethod === 'cod' ? 'border-[#111111] bg-[#fafafa]' : 'border-[#e5e5e5] hover:border-[#8d8d8d]'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  paymentMethod === 'cod' ? 'border-[#111111]' : 'border-[#8d8d8d]'
                }`}
              >
                {paymentMethod === 'cod' && <div className="w-2.5 h-2.5 rounded-full bg-[#111111]" />}
              </div>
              <div>
                <p className="text-[15px] font-medium text-[#111111]">Cash on Delivery (COD)</p>
                <p className="text-[12px] text-[#707072]">Pay in cash or UPI upon delivery</p>
              </div>
            </div>
          </div>
        </div>

        {/* Price Breakdown */}
        <div className="mt-8 pt-5 border-t border-[#e5e5e5] space-y-2 text-[14px]">
          <div className="flex justify-between text-[#707072]">
            <span>Bag Total ({totalQuantity} items)</span>
            <span>₹ {subtotal.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between text-[#707072]">
            <span>Shipping</span>
            <span className="text-[#008a00] font-medium">Free</span>
          </div>
          <div className="flex justify-between text-[17px] font-bold text-[#111111] pt-2 border-t border-[#e5e5e5]">
            <span>Total Payable</span>
            <span>₹ {subtotal.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Fixed Bottom Bar: Place Order */}
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#e5e5e5] h-[88px] flex items-center px-5 sm:px-6 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
          <div className="max-w-[540px] mx-auto w-full">
            <button
              type="button"
              disabled={isPlacingOrder}
              onClick={handlePlaceOrder}
              className="w-full py-4 rounded-full bg-[#111111] hover:bg-black active:scale-[0.99] text-white text-[16px] font-medium transition-all shadow-sm cursor-pointer flex items-center justify-center gap-2 font-['Helvetica_Now_Text_Medium',sans-serif]"
              style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
            >
              {isPlacingOrder ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Confirming Order...</span>
                </>
              ) : (
                `Place Order • ₹ ${subtotal.toLocaleString('en-IN')}`
              )}
            </button>
          </div>
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
