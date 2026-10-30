'use client';

import React, { useState, useEffect, useRef } from 'react';
import AdminShell from '@/components/AdminShell';
import {
  Building2,
  MapPin,
  FileText,
  Phone,
  Mail,
  Save,
  Check,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
  Truck,
  Box,
  Upload,
  Image as ImageIcon,
  Globe,
  Sliders,
  Eye,
  Layers,
  CreditCard,
  Banknote,
  Percent,
  Tag,
  Shield,
  HelpCircle,
} from 'lucide-react';

const DEFAULT_SELLER = {
  companyName: 'Sonu Shoe',
  addressLine1: 'First and Second floor, Patna One Plaza Mall, New Dak Bunglow Rd',
  addressLine2: 'opp. Bharat Petrol Pump, Bander Bagicha, Fraser Road Area',
  city: 'Patna',
  state: 'Bihar',
  pincode: '800001',
  stateCode: '10',
  country: 'India',
  phone: '9122913620',
  email: 'support@sonushoe.in',
  gstin: '',
  signatureTitle: 'Authorized Signature for Sonu Shoe',
  reverseCharge: 'No',
};

const DEFAULT_HOMEPAGE = {
  heroImage: '/images/hero-pool.webp',
  eyebrowTag: 'Sonu Shoe / Signature Drop 01',
  headline: 'FOR THE LONG WAY HOME.',
  description:
    'Small-run handcrafted luxury footwear engineered with ergonomic gum rubber soles and pebble-grain leather, built for all-day city walking.',
  primaryBtnText: 'Shop The 01',
  primaryBtnLink: '/product/drop-hybrid-men',
  secondaryBtnText: 'Explore Fresh Drops',
  secondaryBtnLink: '/#fresh-drops',
  announcementBarText: 'Free Express Shipping Across India On All Orders',
  enableAnnouncementBar: true,
};

const DEFAULT_SHIPROCKET = {
  pickupLocation: 'Patna One Plaza Hub',
  contactPerson: 'Mohammad Shamshad',
  contactPhone: '9122913620',
  addressLine1: 'First and Second floor, Patna One Plaza Mall, New Dak Bunglow Rd',
  addressLine2: 'opp. Bharat Petrol Pump, Bander Bagicha, Fraser Road Area',
  city: 'Patna',
  state: 'Bihar',
  pincode: '800001',
  country: 'India',

  singleLength: 30,
  singleBreadth: 20,
  singleHeight: 12,
  singleWeight: 0.9,

  doubleLength: 35,
  doubleBreadth: 28,
  doubleHeight: 24,
  doubleWeight: 1.8,

  additionalWeightPerUnit: 0.9,
  additionalHeightPerUnit: 12,

  courierPreference: 'Delhivery Surface Express',
  isMockMode: true,
};

const DEFAULT_CHECKOUT = {
  // Delivery & shipping rules
  freeDelivery: true,
  standardDeliveryFee: 99,
  freeDeliveryThreshold: 0,
  deliveryTimelineText: 'Express delivery in 3-5 business days across India',

  // Full COD (Cash On Delivery)
  enableFullCod: false,
  fullCodFee: 200,
  fullCodNote: 'Pay full order balance in cash or UPI directly upon doorstep delivery. An extra COD handling fee applies.',

  // Partial COD (Advance deposit)
  enablePartialCod: true,
  partialCodAdvance: 200,
  partialCodNote: 'Pay a flat advance deposit online to confirm your shipment. The remaining balance is paid to the courier upon delivery.',

  // Prepaid payment (UPI, Cards, NetBanking)
  enablePrepaid: true,
  prepaidDiscount: 0,
  prepaidNote: 'Fastest dispatch with zero extra handling fees.',
};

// --- SIGNATURE ANIMATED FLOATING FORM SYSTEM (MATCHING ORDERS & PRODUCTS) ---
function FloatingInput({
  label,
  value,
  onChange,
  type = 'text',
  step,
  required = false,
  min,
  max,
  prefix,
  helper,
  disabled = false,
  className = '',
  compact = true,
}) {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef(null);

  const hasValue = value !== '' && value !== null && value !== undefined;
  const isFloating = isFocused || hasValue;

  return (
    <div className={`w-full ${className}`}>
      <div
        onClick={() => !disabled && inputRef.current?.focus()}
        className={`relative w-full ${
          compact ? 'h-[46px] px-3.5 rounded-[8px]' : 'h-[52px] px-4 rounded-[8px]'
        } border transition-all duration-200 cursor-text bg-white flex items-center ${
          isFocused ? 'border-[#111111] ring-1 ring-[#111111]/10' : 'border-[#8d8d8d]'
        } ${disabled ? 'bg-neutral-50/70 cursor-not-allowed opacity-75' : ''}`}
      >
        <span
          className={`absolute transition-all duration-200 ease-out pointer-events-none select-none truncate max-w-[calc(100%-14px)] ${
            isFloating
              ? `-top-2 left-2.5 px-1.5 bg-white leading-none z-10 text-[11px] text-[#111111] font-medium`
              : `top-1/2 -translate-y-1/2 left-3.5 text-[13px] text-[#707072]`
          }`}
          style={{ fontFamily: "'Helvetica Now Text', sans-serif" }}
        >
          {label}
          {required ? '*' : ''}
        </span>

        <div className="flex items-center w-full min-w-0">
          {prefix && (
            <span
              className={`text-[13px] text-neutral-500 font-semibold select-none pr-1 shrink-0 ${
                isFloating ? 'opacity-100' : 'opacity-0'
              } transition-opacity duration-150`}
              style={{ fontFamily: "'Helvetica Now Text', sans-serif" }}
            >
              {prefix}
            </span>
          )}
          <input
            ref={inputRef}
            type={type}
            step={step}
            disabled={disabled}
            required={required}
            min={min}
            max={max}
            value={value ?? ''}
            onChange={onChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className="w-full bg-transparent text-[13.5px] text-[#111111] font-medium outline-none p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            style={{ fontFamily: "'Helvetica Now Text', sans-serif" }}
          />
        </div>
      </div>
      {helper && (
        <p
          className="text-[11px] text-[#707072] mt-1 px-1"
          style={{ fontFamily: "'Helvetica Now Text', sans-serif" }}
        >
          {helper}
        </p>
      )}
    </div>
  );
}

function FloatingSelect({
  label,
  value,
  options = [],
  onSelect,
  required = false,
  className = '',
  compact = true,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isFloating = isOpen || Boolean(value);

  const selectedOpt = options.find((opt) =>
    typeof opt === 'string' ? opt === value : (opt.value || opt.id) === value
  );
  const displayLabel =
    typeof selectedOpt === 'string'
      ? selectedOpt
      : selectedOpt?.label || selectedOpt?.name || value || '';

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <div
        onClick={() => setIsOpen((prev) => !prev)}
        className={`relative w-full ${
          compact ? 'h-[46px] px-3.5 rounded-[8px]' : 'h-[52px] px-4 rounded-[8px]'
        } border transition-all duration-200 cursor-pointer bg-white flex items-center justify-between ${
          isOpen ? 'border-[#111111] ring-1 ring-[#111111]/10' : 'border-[#8d8d8d]'
        }`}
      >
        <span
          className={`absolute transition-all duration-200 ease-out pointer-events-none select-none truncate max-w-[calc(100%-24px)] ${
            isFloating
              ? `-top-2 left-2.5 px-1.5 bg-white leading-none z-10 text-[11px] text-[#111111] font-medium`
              : `top-1/2 -translate-y-1/2 left-3.5 text-[13px] text-[#707072]`
          }`}
          style={{ fontFamily: "'Helvetica Now Text', sans-serif" }}
        >
          {label}
          {required ? '*' : ''}
        </span>

        <span
          className={`text-[13.5px] text-[#111111] font-medium truncate mr-2 ${
            value ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ fontFamily: "'Helvetica Now Text', sans-serif" }}
        >
          {displayLabel || 'Select'}
        </span>

        <svg
          className={`w-3.5 h-3.5 text-[#111111] transition-transform duration-200 shrink-0 ${
            isOpen ? 'rotate-180' : ''
          }`}
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M7 10l5 5 5-5z" />
        </svg>
      </div>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-[#e5e5e5] rounded-[10px] shadow-xl py-1 z-50 max-h-56 overflow-y-auto">
          {options.map((opt, i) => {
            const optVal =
              typeof opt === 'string'
                ? opt
                : opt.value !== undefined
                ? opt.value
                : opt.id || opt.name;
            const optLabel =
              typeof opt === 'string'
                ? opt
                : opt.label || opt.name || opt.title || optVal;
            const isSelected = value === optVal;
            return (
              <div
                key={i}
                onClick={() => {
                  onSelect(optVal);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2 text-[13px] transition-colors cursor-pointer select-none ${
                  isSelected
                    ? 'bg-[#f5f5f5] text-[#111111] font-semibold'
                    : 'text-[#222222] hover:bg-[#fafafa]'
                }`}
                style={{ fontFamily: "'Helvetica Now Text', sans-serif" }}
              >
                <span className="truncate flex-1 mr-2">{optLabel}</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-[#111111] shrink-0" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function FloatingTextarea({
  label,
  value,
  onChange,
  rows = 3,
  required = false,
  className = '',
}) {
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef(null);

  const hasValue = value !== '' && value !== null && value !== undefined;
  const isFloating = isFocused || hasValue;

  return (
    <div className={`w-full ${className}`}>
      <div
        onClick={() => textareaRef.current?.focus()}
        className={`relative w-full rounded-[8px] border p-3 pt-3.5 transition-all duration-200 cursor-text bg-white ${
          isFocused ? 'border-[#111111] ring-1 ring-[#111111]/10' : 'border-[#8d8d8d]'
        }`}
      >
        <span
          className={`absolute transition-all duration-200 ease-out pointer-events-none select-none ${
            isFloating
              ? '-top-2 left-2.5 px-1.5 bg-white text-[11px] text-[#111111] font-medium leading-none z-10'
              : 'top-3.5 left-3.5 text-[13px] text-[#707072]'
          }`}
          style={{ fontFamily: "'Helvetica Now Text', sans-serif" }}
        >
          {label}
          {required ? '*' : ''}
        </span>

        <textarea
          ref={textareaRef}
          rows={rows}
          required={required}
          value={value ?? ''}
          onChange={onChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="w-full bg-transparent text-[13.5px] text-[#111111] font-medium outline-none p-0 resize-none leading-relaxed mt-0.5"
          style={{ fontFamily: "'Helvetica Now Text', sans-serif" }}
        />
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('homepage'); // 'homepage' | 'checkout' | 'shiprocket' | 'invoice' | 'auth'
  const [seller, setSeller] = useState(DEFAULT_SELLER);
  const [homepage, setHomepage] = useState(DEFAULT_HOMEPAGE);
  const [shiprocket, setShiprocket] = useState(DEFAULT_SHIPROCKET);
  const [checkout, setCheckout] = useState(DEFAULT_CHECKOUT);
  const [previewPaymentMethod, setPreviewPaymentMethod] = useState('partial_cod');
  const [authSettings, setAuthSettings] = useState({
    enableNumberVerification: false,
    enableEmailVerification: false,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingHero, setUploadingHero] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const heroFileInputRef = useRef(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    async function fetchSettings() {
      try {
        setLoading(true);
        const res = await fetch('/api/settings');
        if (res.ok) {
          const data = await res.json();
          if (data.seller) setSeller((prev) => ({ ...prev, ...data.seller }));
          if (data.homepage) setHomepage((prev) => ({ ...prev, ...data.homepage }));
          if (data.shiprocket) setShiprocket((prev) => ({ ...prev, ...data.shiprocket }));
          if (data.checkout) setCheckout((prev) => ({ ...prev, ...data.checkout }));
          setAuthSettings({
            enableNumberVerification: Boolean(data.enableNumberVerification),
            enableEmailVerification: Boolean(data.enableEmailVerification),
          });
        }
      } catch (err) {
        console.error('Failed to load settings:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

  const handleSellerChange = (field, value) => {
    setSeller((prev) => ({ ...prev, [field]: value }));
  };

  const handleHomepageChange = (field, value) => {
    setHomepage((prev) => ({ ...prev, [field]: value }));
  };

  const handleShiprocketChange = (field, value) => {
    setShiprocket((prev) => ({ ...prev, [field]: value }));
  };

  const handleCheckoutChange = (field, value) => {
    setCheckout((prev) => ({ ...prev, [field]: value }));
  };

  // Upload hero image directly
  const handleHeroFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      setUploadingHero(true);
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.success && data.urls?.[0]) {
        handleHomepageChange('heroImage', data.urls[0]);
        showToast('✓ Hero image uploaded successfully');
      } else {
        alert(data.error || 'Failed to upload hero image');
      }
    } catch (err) {
      console.error('Hero upload error:', err);
      alert('Upload failed. Please try again.');
    } finally {
      setUploadingHero(false);
      if (heroFileInputRef.current) heroFileInputRef.current.value = '';
    }
  };

  const handleSave = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seller,
          homepage,
          shiprocket,
          checkout,
          enableNumberVerification: authSettings.enableNumberVerification,
          enableEmailVerification: authSettings.enableEmailVerification,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast('✓ Settings saved successfully');
      } else {
        alert(data.error || 'Failed to save settings');
      }
    } catch (err) {
      console.error('Error saving settings:', err);
      alert('Network error while saving settings');
    } finally {
      setSaving(false);
    }
  };

  // Keyboard shortcut: Cmd/Ctrl + S to save
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [seller, homepage, shiprocket, authSettings]);

  // Volumetric Weight Calculations: (L x B x H) / 5000
  const singleVolWeight = (
    (Number(shiprocket.singleLength || 0) *
      Number(shiprocket.singleBreadth || 0) *
      Number(shiprocket.singleHeight || 0)) /
    5000
  ).toFixed(2);

  const doubleVolWeight = (
    (Number(shiprocket.doubleLength || 0) *
      Number(shiprocket.doubleBreadth || 0) *
      Number(shiprocket.doubleHeight || 0)) /
    5000
  ).toFixed(2);

  return (
    <AdminShell>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-[#111111] text-white text-[13px] px-5 py-2.5 rounded-full border border-neutral-800 shadow-2xl flex items-center gap-2 animate-toast pointer-events-none">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div
        className="w-full flex-1 flex flex-col p-5 sm:p-7 lg:p-8 text-[#111111]"
        style={{ fontFamily: "'Helvetica Now Text', sans-serif" }}
      >
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <h1 className="text-[24px] font-bold text-[#111111] tracking-tight">
              Settings & Store Controls
            </h1>
            <p className="text-[12.5px] text-neutral-500 mt-0.5">
              Manage editable homepage banners, Shiprocket box dimensions & pickup address, tax seller details, and customer verification.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || loading}
              className="h-9 px-5 rounded-full bg-[#111111] hover:bg-black text-white text-[13px] font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-xs disabled:opacity-50"
            >
              {saving ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              <span>Save Changes</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 mb-6 border-b border-neutral-200 pb-3 overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('homepage')}
            className={`px-3.5 py-1.5 rounded-lg text-[13px] font-medium transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'homepage'
                ? 'bg-neutral-100 text-[#111111] font-semibold shadow-2xs'
                : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50'
            }`}
          >
            Homepage (CMS)
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('checkout')}
            className={`px-3.5 py-1.5 rounded-lg text-[13px] font-medium transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'checkout'
                ? 'bg-neutral-100 text-[#111111] font-semibold shadow-2xs'
                : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50'
            }`}
          >
            Checkout & Payments
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('shiprocket')}
            className={`px-3.5 py-1.5 rounded-lg text-[13px] font-medium transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'shiprocket'
                ? 'bg-neutral-100 text-[#111111] font-semibold shadow-2xs'
                : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50'
            }`}
          >
            Shiprocket & Logistics
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('invoice')}
            className={`px-3.5 py-1.5 rounded-lg text-[13px] font-medium transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'invoice'
                ? 'bg-neutral-100 text-[#111111] font-semibold shadow-2xs'
                : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50'
            }`}
          >
            Seller & Tax Invoice
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('auth')}
            className={`px-3.5 py-1.5 rounded-lg text-[13px] font-medium transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'auth'
                ? 'bg-neutral-100 text-[#111111] font-semibold shadow-2xs'
                : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50'
            }`}
          >
            Verification & Security
          </button>
        </div>

        {/* Loading Spinner */}
        {loading ? (
          <div className="flex items-center justify-center p-16 text-neutral-400">
            <RefreshCw className="w-6 h-6 animate-spin text-[#111111]" />
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-6 max-w-6xl">
            {/* ======================================================== */}
            {/* TAB 1: HOMEPAGE (EDITABLE HOMEPAGE / CMS)                */}
            {/* ======================================================== */}
            {activeTab === 'homepage' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left: Homepage Fields Form (7 cols) */}
                <div className="lg:col-span-7 bg-white rounded-2xl border border-neutral-200/80 p-5 sm:p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center text-[#111111]">
                        <Globe className="w-4 h-4" />
                      </div>
                      <div>
                        <h2 className="text-[15px] font-bold text-[#111111]">
                          Homepage Hero & Headline Editor
                        </h2>
                        <p className="text-[12px] text-neutral-500">
                          Edit the primary hero banner, editorial headline, and call-to-action buttons.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Announcement Bar Settings */}
                  <div className="p-4 rounded-xl bg-neutral-50/70 border border-neutral-200/70 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[13px] font-semibold text-[#111111]">
                          Top Announcement Bar
                        </p>
                        <p className="text-[11.5px] text-neutral-500">
                          Shows a banner at the very top of the storefront.
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={homepage.enableAnnouncementBar}
                        onChange={(e) =>
                          handleHomepageChange('enableAnnouncementBar', e.target.checked)
                        }
                        className="w-4 h-4 accent-[#111111] cursor-pointer"
                      />
                    </div>
                    {homepage.enableAnnouncementBar && (
                      <FloatingInput
                        label="Announcement Bar Text"
                        value={homepage.announcementBarText}
                        onChange={(e) =>
                          handleHomepageChange('announcementBarText', e.target.value)
                        }
                      />
                    )}
                  </div>

                  {/* Hero Image Section with Signature FloatingInput */}
                  <div className="flex items-center gap-2.5">
                    <div className="flex-1">
                      <FloatingInput
                        label="Hero Banner Image URL / Path"
                        value={homepage.heroImage}
                        onChange={(e) => handleHomepageChange('heroImage', e.target.value)}
                        required
                      />
                    </div>
                    <input
                      type="file"
                      ref={heroFileInputRef}
                      accept="image/*"
                      onChange={handleHeroFileUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => heroFileInputRef.current?.click()}
                      disabled={uploadingHero}
                      className="h-[46px] px-4 rounded-[8px] border border-[#8d8d8d] hover:border-[#111111] bg-white text-[13px] font-medium text-[#111111] flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 disabled:opacity-50"
                    >
                      {uploadingHero ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4" />
                      )}
                      <span>Upload</span>
                    </button>
                  </div>

                  {/* Eyebrow Tag */}
                  <FloatingInput
                    label="Eyebrow Tagline"
                    value={homepage.eyebrowTag}
                    onChange={(e) => handleHomepageChange('eyebrowTag', e.target.value)}
                  />

                  {/* Main Headline */}
                  <FloatingInput
                    label="Hero Headline (All Caps Recommended)"
                    value={homepage.headline}
                    onChange={(e) => handleHomepageChange('headline', e.target.value)}
                    required
                  />

                  {/* Description copy with FloatingTextarea */}
                  <FloatingTextarea
                    label="Hero Editorial Description"
                    value={homepage.description}
                    onChange={(e) => handleHomepageChange('description', e.target.value)}
                    rows={3}
                  />

                  {/* CTAs */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                    <FloatingInput
                      label="Primary Button Label"
                      value={homepage.primaryBtnText}
                      onChange={(e) => handleHomepageChange('primaryBtnText', e.target.value)}
                    />
                    <FloatingInput
                      label="Primary Button Link"
                      value={homepage.primaryBtnLink}
                      onChange={(e) => handleHomepageChange('primaryBtnLink', e.target.value)}
                    />
                    <FloatingInput
                      label="Secondary Button Label"
                      value={homepage.secondaryBtnText}
                      onChange={(e) => handleHomepageChange('secondaryBtnText', e.target.value)}
                    />
                    <FloatingInput
                      label="Secondary Button Link"
                      value={homepage.secondaryBtnLink}
                      onChange={(e) => handleHomepageChange('secondaryBtnLink', e.target.value)}
                    />
                  </div>

                  <div className="pt-3 flex justify-end">
                    <button
                      type="submit"
                      disabled={saving}
                      className="h-10 px-6 rounded-full bg-[#111111] hover:bg-black text-white text-[13px] font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-xs disabled:opacity-50"
                    >
                      {saving ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Check className="w-3.5 h-3.5" />
                      )}
                      <span>Save Homepage Settings</span>
                    </button>
                  </div>
                </div>

                {/* Right: Live Storefront Hero Preview (5 cols) */}
                <div className="lg:col-span-5 space-y-4">
                  <div className="bg-white rounded-2xl border border-neutral-200/80 p-5 shadow-xs">
                    <div className="flex items-center justify-between pb-3 border-b border-neutral-100 mb-3">
                      <span className="text-[12px] font-bold uppercase tracking-wider text-neutral-400">
                        Live Storefront Preview
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-neutral-100 text-[10.5px] font-semibold text-neutral-600">
                        Desktop & Mobile
                      </span>
                    </div>

                    {/* Miniature Hero Box */}
                    <div className="rounded-xl border border-neutral-200 overflow-hidden bg-white shadow-2xs">
                      {/* Announcement mock */}
                      {homepage.enableAnnouncementBar && (
                        <div className="bg-[#111111] text-white text-[10px] text-center py-1 px-2 truncate">
                          {homepage.announcementBarText || 'Free Express Shipping Across India'}
                        </div>
                      )}

                      {/* Hero Image */}
                      <div className="aspect-[16/9] w-full bg-neutral-100 overflow-hidden relative">
                        {homepage.heroImage ? (
                          <img
                            src={homepage.heroImage}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-neutral-400 text-xs">
                            No image selected
                          </div>
                        )}
                      </div>

                      {/* Content block */}
                      <div className="p-4 text-center">
                        <span className="text-[9.5px] uppercase tracking-widest text-neutral-400 font-semibold block mb-1">
                          {homepage.eyebrowTag}
                        </span>
                        <h3 className="text-[16px] font-black uppercase text-[#111111] leading-tight">
                          {homepage.headline}
                        </h3>
                        <p className="text-[11px] text-neutral-500 mt-1 line-clamp-2">
                          {homepage.description}
                        </p>

                        <div className="flex items-center justify-center gap-2 mt-3">
                          <span className="px-3 py-1 rounded-full bg-[#111111] text-white text-[10.5px] font-medium">
                            {homepage.primaryBtnText || 'Shop Now'}
                          </span>
                          <span className="px-3 py-1 rounded-full bg-neutral-100 text-neutral-800 text-[10.5px] font-medium">
                            {homepage.secondaryBtnText || 'Explore'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/80 text-[12px] text-neutral-600 flex items-start gap-2.5">
                    <Sparkles className="w-4 h-4 text-neutral-500 shrink-0 mt-0.5" />
                    <p>
                      Changes saved here immediately update the live customer storefront at <strong>sonushoe.in</strong> without requiring a redeploy.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* TAB: CHECKOUT & PAYMENTS (COD, ADVANCE, DELIVERY)         */}
            {/* ======================================================== */}
            {activeTab === 'checkout' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left: Configuration Form (7 cols) */}
                <div className="lg:col-span-7 space-y-6">
                  {/* Section 1: Delivery & Shipping Rules */}
                  <div className="bg-white rounded-2xl border border-neutral-200/80 p-5 sm:p-6 shadow-xs space-y-5">
                    <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center text-[#111111]">
                          <Truck className="w-4 h-4" />
                        </div>
                        <div>
                          <h2 className="text-[15px] font-bold text-[#111111]">
                            Delivery & Shipping Rules
                          </h2>
                          <p className="text-[12px] text-neutral-500">
                            Configure standard shipping rates and free delivery threshold.
                          </p>
                        </div>
                      </div>

                      {/* Toggle: Free Delivery */}
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <span className="text-[12.5px] font-medium text-neutral-700">
                          {checkout.freeDelivery ? 'Free Shipping Enabled' : 'Charge Shipping'}
                        </span>
                        <div
                          onClick={() => handleCheckoutChange('freeDelivery', !checkout.freeDelivery)}
                          className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ${
                            checkout.freeDelivery ? 'bg-[#111111]' : 'bg-neutral-300'
                          }`}
                        >
                          <div
                            className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                              checkout.freeDelivery ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </div>
                      </label>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FloatingInput
                        label="Standard Delivery Fee (₹)"
                        type="number"
                        min="0"
                        value={checkout.standardDeliveryFee ?? 99}
                        onChange={(e) => handleCheckoutChange('standardDeliveryFee', e.target.value)}
                        helper={checkout.freeDelivery ? 'Shown crossed-out at checkout when free' : 'Charged on standard orders'}
                      />

                      <FloatingInput
                        label="Free Shipping Min. Order (₹)"
                        type="number"
                        min="0"
                        value={checkout.freeDeliveryThreshold ?? 0}
                        onChange={(e) => handleCheckoutChange('freeDeliveryThreshold', e.target.value)}
                        helper="Enter 0 to offer free delivery on ALL orders"
                      />
                    </div>

                    <FloatingInput
                      label="Estimated Delivery Timeline"
                      value={checkout.deliveryTimelineText || ''}
                      onChange={(e) => handleCheckoutChange('deliveryTimelineText', e.target.value)}
                      helper="Customer promise displayed across checkout & tracking"
                    />
                  </div>

                  {/* Section 2: Partial Cash on Delivery (Advance Deposit) */}
                  <div className="bg-white rounded-2xl border border-neutral-200/80 p-5 sm:p-6 shadow-xs space-y-5">
                    <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center text-[#111111]">
                          <Shield className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h2 className="text-[15px] font-bold text-[#111111]">
                              Partial Cash on Delivery (Advance Deposit)
                            </h2>
                            <span className="px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Recommended
                            </span>
                          </div>
                          <p className="text-[12px] text-neutral-500">
                            Require customers to pay a small upfront deposit online to eliminate fraudulent RTO returns.
                          </p>
                        </div>
                      </div>

                      {/* Toggle: Enable Partial COD */}
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <span className="text-[12.5px] font-medium text-neutral-700">
                          {checkout.enablePartialCod ? 'Active' : 'Disabled'}
                        </span>
                        <div
                          onClick={() => handleCheckoutChange('enablePartialCod', !checkout.enablePartialCod)}
                          className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ${
                            checkout.enablePartialCod ? 'bg-[#111111]' : 'bg-neutral-300'
                          }`}
                        >
                          <div
                            className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                              checkout.enablePartialCod ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </div>
                      </label>
                    </div>

                    {checkout.enablePartialCod && (
                      <div className="space-y-4">
                        <FloatingInput
                          label="Advance Deposit Amount (₹)"
                          type="number"
                          min="1"
                          value={checkout.partialCodAdvance ?? 200}
                          onChange={(e) => handleCheckoutChange('partialCodAdvance', e.target.value)}
                          helper="Customer pays this amount via Razorpay online. The balance is paid to courier."
                        />

                        <FloatingTextarea
                          label="Partial COD Explanatory Note for Customer"
                          rows={2}
                          value={checkout.partialCodNote || ''}
                          onChange={(e) => handleCheckoutChange('partialCodNote', e.target.value)}
                        />
                      </div>
                    )}
                  </div>

                  {/* Section 3: Full Cash on Delivery (Full COD) */}
                  <div className="bg-white rounded-2xl border border-neutral-200/80 p-5 sm:p-6 shadow-xs space-y-5">
                    <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center text-[#111111]">
                          <Banknote className="w-4 h-4" />
                        </div>
                        <div>
                          <h2 className="text-[15px] font-bold text-[#111111]">
                            Full Cash on Delivery (100% COD)
                          </h2>
                          <p className="text-[12px] text-neutral-500">
                            Allow customers to pay the entire bill at their doorstep, with optional handling fee.
                          </p>
                        </div>
                      </div>

                      {/* Toggle: Enable Full COD */}
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <span className="text-[12.5px] font-medium text-neutral-700">
                          {checkout.enableFullCod ? 'Active' : 'Disabled'}
                        </span>
                        <div
                          onClick={() => handleCheckoutChange('enableFullCod', !checkout.enableFullCod)}
                          className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ${
                            checkout.enableFullCod ? 'bg-[#111111]' : 'bg-neutral-300'
                          }`}
                        >
                          <div
                            className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                              checkout.enableFullCod ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </div>
                      </label>
                    </div>

                    {checkout.enableFullCod && (
                      <div className="space-y-4">
                        <FloatingInput
                          label="Extra Full COD Handling Fee (₹)"
                          type="number"
                          min="0"
                          value={checkout.fullCodFee ?? 200}
                          onChange={(e) => handleCheckoutChange('fullCodFee', e.target.value)}
                          helper="E.g. ₹200 added for doorstep cash handling risk and courier collection fee"
                        />

                        <FloatingTextarea
                          label="Full COD Customer Instruction Note"
                          rows={2}
                          value={checkout.fullCodNote || ''}
                          onChange={(e) => handleCheckoutChange('fullCodNote', e.target.value)}
                        />
                      </div>
                    )}
                  </div>

                  {/* Section 4: Prepaid Online Payments */}
                  <div className="bg-white rounded-2xl border border-neutral-200/80 p-5 sm:p-6 shadow-xs space-y-5">
                    <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center text-[#111111]">
                          <CreditCard className="w-4 h-4" />
                        </div>
                        <div>
                          <h2 className="text-[15px] font-bold text-[#111111]">
                            Prepaid Online Payments (UPI / Cards / NetBanking)
                          </h2>
                          <p className="text-[12px] text-neutral-500">
                            Instant online payment via Razorpay payment gateway.
                          </p>
                        </div>
                      </div>

                      {/* Toggle: Enable Prepaid */}
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <span className="text-[12.5px] font-medium text-neutral-700">
                          {checkout.enablePrepaid ? 'Active' : 'Disabled'}
                        </span>
                        <div
                          onClick={() => handleCheckoutChange('enablePrepaid', !checkout.enablePrepaid)}
                          className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ${
                            checkout.enablePrepaid ? 'bg-[#111111]' : 'bg-neutral-300'
                          }`}
                        >
                          <div
                            className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                              checkout.enablePrepaid ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </div>
                      </label>
                    </div>

                    {checkout.enablePrepaid && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FloatingInput
                          label="Instant Online Discount (%)"
                          type="number"
                          min="0"
                          max="50"
                          value={checkout.prepaidDiscount ?? 0}
                          onChange={(e) => handleCheckoutChange('prepaidDiscount', e.target.value)}
                          helper="E.g. 5 for 5% off to incentivize 100% upfront online payment"
                        />

                        <FloatingInput
                          label="Prepaid Tagline / Highlight"
                          value={checkout.prepaidNote || ''}
                          onChange={(e) => handleCheckoutChange('prepaidNote', e.target.value)}
                          helper="Displays under UPI & Card payment options"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Live Interactive Storefront Checkout Simulator (5 cols) */}
                <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-24">
                  <div className="bg-white rounded-2xl border border-neutral-200/80 p-5 shadow-xs space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                      <div className="flex items-center gap-2">
                        <Eye className="w-4 h-4 text-[#111111]" />
                        <h3 className="text-[14px] font-bold text-[#111111]">
                          Live Storefront Checkout Simulator
                        </h3>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-neutral-100 text-neutral-700 border border-neutral-200 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Live Sync
                      </span>
                    </div>

                    <p className="text-[12px] text-neutral-500">
                      Test how your checkout rules, advance deposit, and delivery fees look to customers during payment:
                    </p>

                    {/* Simulated Footwear Cart Item */}
                    <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200/60 flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-white border border-neutral-200 overflow-hidden shrink-0 flex items-center justify-center">
                        <img
                          src="/images/products/drop-hybrid-men/main.webp"
                          alt="Shoe"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-bold text-[#111111] truncate">
                          Sonu Drop Hybrid Men (1x)
                        </p>
                        <p className="text-[11.5px] text-neutral-500">Size: UK 9 &bull; Pebble Black</p>
                      </div>
                      <span className="text-[13px] font-bold text-[#111111] shrink-0">
                        ₹ 13,995
                      </span>
                    </div>

                    {/* Interactive Payment Method Simulator Tabs */}
                    <div className="space-y-2 pt-1">
                      <label className="text-[11.5px] uppercase font-bold tracking-wider text-neutral-400 block">
                        Select Method to Simulate:
                      </label>
                      <div className="grid grid-cols-3 gap-1.5">
                        <button
                          type="button"
                          onClick={() => setPreviewPaymentMethod('prepaid')}
                          disabled={!checkout.enablePrepaid}
                          className={`py-2 px-1 text-[11px] font-semibold rounded-lg border text-center transition-all cursor-pointer ${
                            previewPaymentMethod === 'prepaid'
                              ? 'bg-[#111111] text-white border-[#111111] shadow-2xs'
                              : checkout.enablePrepaid
                              ? 'bg-white text-neutral-700 border-neutral-200 hover:border-neutral-400'
                              : 'bg-neutral-100 text-neutral-400 border-neutral-200 cursor-not-allowed opacity-50'
                          }`}
                        >
                          UPI / Prepaid
                        </button>

                        <button
                          type="button"
                          onClick={() => setPreviewPaymentMethod('partial_cod')}
                          disabled={!checkout.enablePartialCod}
                          className={`py-2 px-1 text-[11px] font-semibold rounded-lg border text-center transition-all cursor-pointer ${
                            previewPaymentMethod === 'partial_cod'
                              ? 'bg-[#111111] text-white border-[#111111] shadow-2xs'
                              : checkout.enablePartialCod
                              ? 'bg-white text-neutral-700 border-neutral-200 hover:border-neutral-400'
                              : 'bg-neutral-100 text-neutral-400 border-neutral-200 cursor-not-allowed opacity-50'
                          }`}
                        >
                          Partial COD
                        </button>

                        <button
                          type="button"
                          onClick={() => setPreviewPaymentMethod('full_cod')}
                          disabled={!checkout.enableFullCod}
                          className={`py-2 px-1 text-[11px] font-semibold rounded-lg border text-center transition-all cursor-pointer ${
                            previewPaymentMethod === 'full_cod'
                              ? 'bg-[#111111] text-white border-[#111111] shadow-2xs'
                              : checkout.enableFullCod
                              ? 'bg-white text-neutral-700 border-neutral-200 hover:border-neutral-400'
                              : 'bg-neutral-100 text-neutral-400 border-neutral-200 cursor-not-allowed opacity-50'
                          }`}
                        >
                          Full COD
                        </button>
                      </div>
                    </div>

                    {/* Calculated Price Breakdown Box */}
                    {(() => {
                      const sampleSubtotal = 13995;
                      const isFreeShipping = checkout.freeDelivery && (Number(checkout.freeDeliveryThreshold || 0) === 0 || sampleSubtotal >= Number(checkout.freeDeliveryThreshold || 0));
                      const deliveryCharge = isFreeShipping ? 0 : Number(checkout.standardDeliveryFee || 0);
                      const codCharge = previewPaymentMethod === 'full_cod' && checkout.enableFullCod ? Number(checkout.fullCodFee || 0) : 0;
                      const prepaidDiscountPct = previewPaymentMethod === 'prepaid' ? Number(checkout.prepaidDiscount || 0) : 0;
                      const prepaidDiscountAmt = prepaidDiscountPct > 0 ? Math.round((sampleSubtotal * prepaidDiscountPct) / 100) : 0;
                      const calculatedTotal = sampleSubtotal + deliveryCharge + codCharge - prepaidDiscountAmt;
                      const advanceAmt = previewPaymentMethod === 'partial_cod' ? Number(checkout.partialCodAdvance || 200) : 0;
                      const balanceDue = previewPaymentMethod === 'partial_cod' ? Math.max(0, calculatedTotal - advanceAmt) : (previewPaymentMethod === 'full_cod' ? calculatedTotal : 0);

                      return (
                        <div className="p-4 rounded-xl border border-neutral-200 bg-[#fbfbfb] space-y-2.5 text-[12.5px]">
                          <div className="flex items-center justify-between text-neutral-600">
                            <span>Footwear Subtotal</span>
                            <span className="font-semibold text-[#111111]">₹ {sampleSubtotal.toLocaleString('en-IN')}</span>
                          </div>

                          <div className="flex items-center justify-between text-neutral-600">
                            <span>Shipping / Delivery</span>
                            {isFreeShipping ? (
                              <div className="flex items-center gap-1.5 font-medium">
                                <span className="line-through text-neutral-400 text-[11px]">₹{checkout.standardDeliveryFee || 99}</span>
                                <span className="text-emerald-600 font-bold">Free</span>
                              </div>
                            ) : (
                              <span className="font-semibold text-[#111111]">₹ {deliveryCharge}</span>
                            )}
                          </div>

                          {codCharge > 0 && (
                            <div className="flex items-center justify-between text-amber-900 bg-amber-50 px-2.5 py-1 rounded-md font-medium">
                              <span>Full COD Handling Fee</span>
                              <span className="font-bold">+ ₹ {codCharge}</span>
                            </div>
                          )}

                          {prepaidDiscountAmt > 0 && (
                            <div className="flex items-center justify-between text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md font-medium">
                              <span>Prepaid Instant Discount ({prepaidDiscountPct}%)</span>
                              <span className="font-bold">- ₹ {prepaidDiscountAmt.toLocaleString('en-IN')}</span>
                            </div>
                          )}

                          {previewPaymentMethod === 'partial_cod' ? (
                            <>
                              <div className="pt-2 border-t border-neutral-200 space-y-1.5">
                                <div className="flex items-center justify-between text-neutral-700 font-medium">
                                  <span>Advance Paid Online Now</span>
                                  <span className="text-[#111111] font-bold">₹ {advanceAmt.toLocaleString('en-IN')}</span>
                                </div>
                                <div className="flex items-center justify-between text-neutral-500">
                                  <span>Remaining Due on Doorstep</span>
                                  <span className="text-[#111111] font-bold">₹ {balanceDue.toLocaleString('en-IN')}</span>
                                </div>
                              </div>

                              <div className="pt-2 border-t border-neutral-200 flex items-center justify-between">
                                <span className="text-[13.5px] font-bold text-[#111111]">Total Order Value</span>
                                <span className="text-[15px] font-bold text-[#111111]">₹ {calculatedTotal.toLocaleString('en-IN')}</span>
                              </div>
                            </>
                          ) : (
                            <div className="pt-2 border-t border-neutral-200 flex items-center justify-between">
                              <span className="text-[13.5px] font-bold text-[#111111]">
                                {previewPaymentMethod === 'full_cod' ? 'Due on Doorstep' : 'You Pay Now'}
                              </span>
                              <span className="text-[15px] font-bold text-[#111111]">
                                ₹ {calculatedTotal.toLocaleString('en-IN')}
                              </span>
                            </div>
                          )}

                          {/* Dynamic note display */}
                          <div className="mt-2 pt-2 border-t border-neutral-200/60 text-[11px] text-neutral-500 leading-relaxed">
                            <span className="font-semibold text-neutral-700">Notice to customer: </span>
                            {previewPaymentMethod === 'partial_cod'
                              ? checkout.partialCodNote
                              : previewPaymentMethod === 'full_cod'
                              ? checkout.fullCodNote
                              : checkout.prepaidNote}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Timeline guarantee */}
                    <div className="p-3 rounded-xl bg-neutral-100 text-neutral-700 text-[11.5px] flex items-center gap-2">
                      <Truck className="w-4 h-4 text-neutral-500 shrink-0" />
                      <span>{checkout.deliveryTimelineText || 'Express delivery in 3-5 business days across India'}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* TAB 2: SHIPROCKET & LOGISTICS (DIMENSIONS & ADDRESS)      */}
            {/* ======================================================== */}
            {activeTab === 'shiprocket' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left: Shiprocket Configuration Form (7 cols) */}
                <div className="lg:col-span-7 bg-white rounded-2xl border border-neutral-200/80 p-5 sm:p-6 shadow-xs space-y-6">
                  {/* Section 1: Warehouse / Pickup Address */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center text-[#111111]">
                          <MapPin className="w-4 h-4" />
                        </div>
                        <div>
                          <h2 className="text-[15px] font-bold text-[#111111]">
                            Shiprocket Pickup Warehouse Address
                          </h2>
                          <p className="text-[12px] text-neutral-500">
                            The pickup hub where Delhivery, Blue Dart & other couriers collect footwear orders.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <FloatingInput
                        label="Pickup Location Nickname"
                        value={shiprocket.pickupLocation}
                        onChange={(e) => handleShiprocketChange('pickupLocation', e.target.value)}
                        required
                      />
                      <FloatingInput
                        label="Contact Person"
                        value={shiprocket.contactPerson}
                        onChange={(e) => handleShiprocketChange('contactPerson', e.target.value)}
                        required
                      />
                      <FloatingInput
                        label="Pickup Phone"
                        prefix="+91"
                        value={shiprocket.contactPhone}
                        onChange={(e) => handleShiprocketChange('contactPhone', e.target.value)}
                        required
                      />
                      <FloatingInput
                        label="Pickup Pincode"
                        value={shiprocket.pincode}
                        onChange={(e) => handleShiprocketChange('pincode', e.target.value)}
                        required
                      />
                      <div className="sm:col-span-2">
                        <FloatingInput
                          label="Street Address Line 1"
                          value={shiprocket.addressLine1}
                          onChange={(e) => handleShiprocketChange('addressLine1', e.target.value)}
                          required
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <FloatingInput
                          label="Address Line 2 (Colony / Landmark)"
                          value={shiprocket.addressLine2}
                          onChange={(e) => handleShiprocketChange('addressLine2', e.target.value)}
                        />
                      </div>
                      <FloatingInput
                        label="City"
                        value={shiprocket.city}
                        onChange={(e) => handleShiprocketChange('city', e.target.value)}
                        required
                      />
                      <FloatingInput
                        label="State"
                        value={shiprocket.state}
                        onChange={(e) => handleShiprocketChange('state', e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  {/* Section 2: Single Shoe Box Dimensions (1 Unit) */}
                  <div className="space-y-4 pt-4 border-t border-neutral-100">
                    <div className="flex items-center justify-between pb-2">
                      <div className="flex items-center gap-2">
                        <Box className="w-4 h-4 text-[#111111]" />
                        <h3 className="text-[14px] font-bold text-[#111111]">
                          Single Shoe Order Package (1 Pair)
                        </h3>
                      </div>
                      <span className="text-[11.5px] font-medium text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-full">
                        Standard Footwear Box
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <FloatingInput
                        label="Length (cm)"
                        type="number"
                        value={shiprocket.singleLength}
                        onChange={(e) => handleShiprocketChange('singleLength', e.target.value)}
                      />
                      <FloatingInput
                        label="Breadth (cm)"
                        type="number"
                        value={shiprocket.singleBreadth}
                        onChange={(e) => handleShiprocketChange('singleBreadth', e.target.value)}
                      />
                      <FloatingInput
                        label="Height (cm)"
                        type="number"
                        value={shiprocket.singleHeight}
                        onChange={(e) => handleShiprocketChange('singleHeight', e.target.value)}
                      />
                      <FloatingInput
                        label="Dead Wt (kg)"
                        type="number"
                        step="0.05"
                        value={shiprocket.singleWeight}
                        onChange={(e) => handleShiprocketChange('singleWeight', e.target.value)}
                      />
                    </div>

                    <p className="text-[11.5px] text-neutral-500">
                      Calculated Volumetric Weight: <strong>{singleVolWeight} kg</strong> (Billing weight: {Math.max(Number(shiprocket.singleWeight || 0.9), Number(singleVolWeight))} kg)
                    </p>
                  </div>

                  {/* Section 3: Two Shoes Package (2 Pairs) */}
                  <div className="space-y-4 pt-4 border-t border-neutral-100">
                    <div className="flex items-center justify-between pb-2">
                      <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-[#111111]" />
                        <h3 className="text-[14px] font-bold text-[#111111]">
                          Two Shoes Order Package (2 Pairs)
                        </h3>
                      </div>
                      <span className="text-[11.5px] font-medium text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-full">
                        Double-Shoe Master Carton
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <FloatingInput
                        label="Length (cm)"
                        type="number"
                        value={shiprocket.doubleLength}
                        onChange={(e) => handleShiprocketChange('doubleLength', e.target.value)}
                      />
                      <FloatingInput
                        label="Breadth (cm)"
                        type="number"
                        value={shiprocket.doubleBreadth}
                        onChange={(e) => handleShiprocketChange('doubleBreadth', e.target.value)}
                      />
                      <FloatingInput
                        label="Height (cm)"
                        type="number"
                        value={shiprocket.doubleHeight}
                        onChange={(e) => handleShiprocketChange('doubleHeight', e.target.value)}
                      />
                      <FloatingInput
                        label="Dead Wt (kg)"
                        type="number"
                        step="0.05"
                        value={shiprocket.doubleWeight}
                        onChange={(e) => handleShiprocketChange('doubleWeight', e.target.value)}
                      />
                    </div>

                    <p className="text-[11.5px] text-neutral-500">
                      Calculated Volumetric Weight: <strong>{doubleVolWeight} kg</strong> (Billing weight: {Math.max(Number(shiprocket.doubleWeight || 1.8), Number(doubleVolWeight))} kg)
                    </p>
                  </div>

                  {/* Section 4: 3+ Pairs Incremental Rule */}
                  <div className="p-4 rounded-xl bg-neutral-50/70 border border-neutral-200/70 space-y-3">
                    <p className="text-[13px] font-semibold text-[#111111]">
                      Bulk Orders Rule (3+ Shoes)
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <FloatingInput
                        label="Additional Weight Per Pair (kg)"
                        type="number"
                        step="0.1"
                        value={shiprocket.additionalWeightPerUnit}
                        onChange={(e) => handleShiprocketChange('additionalWeightPerUnit', e.target.value)}
                      />
                      <FloatingInput
                        label="Additional Stack Height (cm)"
                        type="number"
                        value={shiprocket.additionalHeightPerUnit}
                        onChange={(e) => handleShiprocketChange('additionalHeightPerUnit', e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Section 5: Courier Preference & Simulation Mode */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                    <FloatingSelect
                      label="Preferred Courier Partner"
                      value={shiprocket.courierPreference}
                      options={[
                        'Delhivery Surface Express',
                        'Blue Dart Express',
                        'Ekart Logistics',
                        'DTDC Express',
                      ]}
                      onSelect={(val) => handleShiprocketChange('courierPreference', val)}
                    />

                    <div className="flex flex-col justify-center">
                      <label className="flex items-center justify-between p-3 h-[46px] rounded-[8px] border border-[#8d8d8d] bg-white cursor-pointer">
                        <div>
                          <p className="text-[12.5px] font-semibold text-[#111111]">
                            Shiprocket Simulation Mode
                          </p>
                          <p className="text-[10.5px] text-neutral-400">
                            Instant realistic mock AWB generation
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          checked={shiprocket.isMockMode}
                          onChange={(e) => handleShiprocketChange('isMockMode', e.target.checked)}
                          className="w-4 h-4 accent-[#111111] cursor-pointer"
                        />
                      </label>
                    </div>
                  </div>

                  <div className="pt-3 flex justify-end">
                    <button
                      type="submit"
                      disabled={saving}
                      className="h-10 px-6 rounded-full bg-[#111111] hover:bg-black text-white text-[13px] font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-xs disabled:opacity-50"
                    >
                      {saving ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Check className="w-3.5 h-3.5" />
                      )}
                      <span>Save Logistics Configuration</span>
                    </button>
                  </div>
                </div>

                {/* Right: Live Packaging Visualizer Card (5 cols) */}
                <div className="lg:col-span-5 space-y-4">
                  <div className="bg-white rounded-2xl border border-neutral-200/80 p-5 shadow-xs">
                    <div className="flex items-center justify-between pb-3 border-b border-neutral-100 mb-3">
                      <span className="text-[12px] font-bold uppercase tracking-wider text-neutral-400">
                        Package Specifications
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-neutral-100 text-[10.5px] font-semibold text-neutral-600">
                        Shiprocket Dimensions
                      </span>
                    </div>

                    {/* Single Shoe Box Spec Card */}
                    <div className="p-4 rounded-xl border border-neutral-200 bg-neutral-50/50 space-y-2 mb-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[13px] font-bold text-[#111111]">
                          1 Shoe (Single Order)
                        </span>
                        <span className="text-[12px] font-bold text-neutral-800 bg-white px-2 py-0.5 rounded border border-neutral-200">
                          {shiprocket.singleWeight} Kg
                        </span>
                      </div>
                      <p className="text-[13px] text-neutral-700 font-medium">
                        {shiprocket.singleLength} x {shiprocket.singleBreadth} x {shiprocket.singleHeight} cm
                      </p>
                      <p className="text-[11.5px] text-neutral-500">
                        Volumetric: {singleVolWeight} Kg • Standard sneaker shoe box packaging
                      </p>
                    </div>

                    {/* Two Shoes Box Spec Card */}
                    <div className="p-4 rounded-xl border border-neutral-200 bg-neutral-50/50 space-y-2 mb-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[13px] font-bold text-[#111111]">
                          2 Shoes (Double Order)
                        </span>
                        <span className="text-[12px] font-bold text-neutral-800 bg-white px-2 py-0.5 rounded border border-neutral-200">
                          {shiprocket.doubleWeight} Kg
                        </span>
                      </div>
                      <p className="text-[13px] text-neutral-700 font-medium">
                        {shiprocket.doubleLength} x {shiprocket.doubleBreadth} x {shiprocket.doubleHeight} cm
                      </p>
                      <p className="text-[11.5px] text-neutral-500">
                        Volumetric: {doubleVolWeight} Kg • Master shipping carton containing 2 boxes
                      </p>
                    </div>

                    {/* Pickup Location Preview */}
                    <div className="p-4 rounded-xl border border-neutral-200 bg-white space-y-1 text-[12px] text-neutral-700">
                      <p className="font-bold text-[13px] text-[#111111] flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-neutral-500" />
                        <span>Pickup Hub: {shiprocket.pickupLocation || 'Patna One Plaza Hub'}</span>
                      </p>
                      <p>{shiprocket.addressLine1}</p>
                      {shiprocket.addressLine2 && <p>{shiprocket.addressLine2}</p>}
                      <p>
                        {shiprocket.city}, {shiprocket.state} - {shiprocket.pincode}
                      </p>
                      <p className="text-[11px] text-neutral-500">
                        Contact: {shiprocket.contactPerson} ({shiprocket.contactPhone})
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/80 text-[12px] text-neutral-600 flex items-start gap-2.5">
                    <Truck className="w-4 h-4 text-neutral-500 shrink-0 mt-0.5" />
                    <p>
                      These dimensions automatically populate on the <strong>Orders table</strong> package column and are transmitted when requesting courier pickups.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* TAB 3: SELLER & TAX INVOICE                              */}
            {/* ======================================================== */}
            {activeTab === 'invoice' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left: Input Form (7 cols) */}
                <div className="lg:col-span-7 bg-white rounded-2xl border border-neutral-200/80 p-5 sm:p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center text-[#111111]">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div>
                        <h2 className="text-[15px] font-bold text-[#111111]">
                          Seller & Business Details
                        </h2>
                        <p className="text-[12px] text-neutral-500">
                          Appears on all printed tax invoices under "SOLD BY".
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {/* Company Name */}
                    <div className="sm:col-span-2">
                      <FloatingInput
                        label="Company / Brand Name"
                        value={seller.companyName}
                        onChange={(e) => handleSellerChange('companyName', e.target.value)}
                        required
                      />
                    </div>

                    {/* Address Line 1 */}
                    <div className="sm:col-span-2">
                      <FloatingInput
                        label="Address Line 1 (Street / House / Floor)"
                        value={seller.addressLine1}
                        onChange={(e) => handleSellerChange('addressLine1', e.target.value)}
                        required
                      />
                    </div>

                    {/* Address Line 2 */}
                    <div className="sm:col-span-2">
                      <FloatingInput
                        label="Address Line 2 (Colony / Landmark / Area)"
                        value={seller.addressLine2}
                        onChange={(e) => handleSellerChange('addressLine2', e.target.value)}
                      />
                    </div>

                    {/* City */}
                    <FloatingInput
                      label="City"
                      value={seller.city}
                      onChange={(e) => handleSellerChange('city', e.target.value)}
                      required
                    />

                    {/* State */}
                    <FloatingInput
                      label="State"
                      value={seller.state}
                      onChange={(e) => handleSellerChange('state', e.target.value)}
                      required
                    />

                    {/* Pincode */}
                    <FloatingInput
                      label="Pincode"
                      value={seller.pincode}
                      onChange={(e) => handleSellerChange('pincode', e.target.value)}
                      required
                    />

                    {/* State Code */}
                    <FloatingInput
                      label="State Code (GST Code)"
                      value={seller.stateCode}
                      onChange={(e) => handleSellerChange('stateCode', e.target.value)}
                    />

                    {/* Phone Number */}
                    <FloatingInput
                      label="Contact Phone"
                      prefix="+91"
                      value={seller.phone}
                      onChange={(e) => handleSellerChange('phone', e.target.value)}
                    />

                    {/* Contact Email */}
                    <FloatingInput
                      label="Contact Email"
                      type="email"
                      value={seller.email}
                      onChange={(e) => handleSellerChange('email', e.target.value)}
                    />

                    {/* GSTIN Number */}
                    <div className="sm:col-span-2">
                      <FloatingInput
                        label="GSTIN No. (Optional)"
                        value={seller.gstin}
                        onChange={(e) => handleSellerChange('gstin', e.target.value)}
                      />
                    </div>

                    {/* Signature Line */}
                    <div className="sm:col-span-2">
                      <FloatingInput
                        label="Invoice Signature Label"
                        value={seller.signatureTitle}
                        onChange={(e) => handleSellerChange('signatureTitle', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      disabled={saving}
                      className="h-10 px-6 rounded-full bg-[#111111] hover:bg-black text-white text-[13px] font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-xs disabled:opacity-50"
                    >
                      {saving ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Check className="w-3.5 h-3.5" />
                      )}
                      <span>Save Seller Address</span>
                    </button>
                  </div>
                </div>

                {/* Right: Live Invoice Preview Card (5 cols) */}
                <div className="lg:col-span-5 space-y-4">
                  <div className="bg-white rounded-2xl border border-neutral-200/80 p-5 shadow-xs">
                    <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                      <span className="text-[12px] font-bold uppercase tracking-wider text-neutral-400">
                        Live Preview (SOLD BY)
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-neutral-100 text-[10.5px] font-semibold text-neutral-600">
                        Tax Invoice Section
                      </span>
                    </div>

                    {/* Mock Invoice Box */}
                    <div className="mt-4 p-4 rounded-xl bg-neutral-50 border border-neutral-200 text-right space-y-1 text-[12px] text-neutral-700">
                      <p className="font-bold text-[13.5px] text-[#111111]">
                        {seller.companyName || 'Sonu Shoe'}
                      </p>
                      {seller.addressLine1 && <p>{seller.addressLine1},</p>}
                      {seller.addressLine2 && <p>{seller.addressLine2},</p>}
                      <p>{[seller.city, seller.state].filter(Boolean).join(', ')}</p>
                      {seller.pincode && <p>{seller.pincode}</p>}
                      <p>{[seller.city, seller.pincode].filter(Boolean).join(' ')}</p>
                      {seller.state && <p>{seller.state}</p>}
                      <p>{seller.country || 'India'}</p>
                      {seller.stateCode && <p>State Code : {seller.stateCode}</p>}
                      {seller.phone && <p>Ph: {seller.phone}</p>}
                      {seller.gstin ? (
                        <p>GSTIN No. : {seller.gstin}</p>
                      ) : (
                        <p className="text-neutral-400">GSTIN No. : —</p>
                      )}
                      {seller.email && (
                        <p className="text-[11.5px] break-all">Email: {seller.email}</p>
                      )}
                    </div>

                    {/* Bottom Signature Preview */}
                    <div className="mt-4 pt-4 border-t border-neutral-200">
                      <div className="w-36 h-12 rounded border border-neutral-300 bg-white mb-2" />
                      <p className="text-[11.5px] font-semibold text-[#111111]">
                        {seller.signatureTitle || 'Authorized Signature for Sonu Shoe'}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/80 text-[12px] text-neutral-600 flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-neutral-500 shrink-0 mt-0.5" />
                    <p>
                      Any updates saved here will immediately reflect on the <strong>Download Invoice</strong> action on the Orders page.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* TAB 4: VERIFICATION & SECURITY                           */}
            {/* ======================================================== */}
            {activeTab === 'auth' && (
              <div className="bg-white rounded-2xl border border-neutral-200/80 p-5 sm:p-6 shadow-xs max-w-2xl space-y-6">
                <div>
                  <h2 className="text-[16px] font-bold text-[#111111]">
                    Customer Checkout Verification
                  </h2>
                  <p className="text-[12.5px] text-neutral-500 mt-0.5">
                    Configure optional OTP verification requirements for shoppers placing orders.
                  </p>
                </div>

                <div className="space-y-4 pt-2">
                  <label className="flex items-center justify-between p-4 rounded-xl border border-neutral-200 hover:border-neutral-300 transition-colors cursor-pointer">
                    <div>
                      <p className="text-[13.5px] font-semibold text-[#111111]">
                        Require Mobile Number OTP
                      </p>
                      <p className="text-[12px] text-neutral-500">
                        Sends a verification code to customer's mobile during checkout.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={authSettings.enableNumberVerification}
                      onChange={(e) =>
                        setAuthSettings((prev) => ({
                          ...prev,
                          enableNumberVerification: e.target.checked,
                        }))
                      }
                      className="w-4 h-4 accent-[#111111] cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-4 rounded-xl border border-neutral-200 hover:border-neutral-300 transition-colors cursor-pointer">
                    <div>
                      <p className="text-[13.5px] font-semibold text-[#111111]">
                        Require Email Verification
                      </p>
                      <p className="text-[12px] text-neutral-500">
                        Sends an email confirmation code before order submission.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={authSettings.enableEmailVerification}
                      onChange={(e) =>
                        setAuthSettings((prev) => ({
                          ...prev,
                          enableEmailVerification: e.target.checked,
                        }))
                      }
                      className="w-4 h-4 accent-[#111111] cursor-pointer"
                    />
                  </label>
                </div>

                <div className="pt-3 flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="h-10 px-6 rounded-full bg-[#111111] hover:bg-black text-white text-[13px] font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    {saving ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Check className="w-3.5 h-3.5" />
                    )}
                    <span>Save Verification Settings</span>
                  </button>
                </div>
              </div>
            )}
          </form>
        )}
      </div>
    </AdminShell>
  );
}
