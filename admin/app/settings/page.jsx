'use client';

import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';

const DEFAULT_SELLER = {
  companyName: 'Sonu Shoe',
  addressLine1: '34, Rd Number 2, Nehru Nagar',
  addressLine2: 'Patliputra Colony',
  city: 'Patna',
  state: 'Bihar',
  pincode: '800013',
  stateCode: '10',
  country: 'India',
  phone: '8008439762',
  email: 'yashodanandkumar15@gmail.com',
  gstin: '',
  signatureTitle: 'Authorized Signature for Sonu Shoe',
  reverseCharge: 'No',
};

export default function SettingsPage() {
  const [seller, setSeller] = useState(DEFAULT_SELLER);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [activeTab, setActiveTab] = useState('invoice'); // 'invoice' | 'auth'
  const [authSettings, setAuthSettings] = useState({
    enableNumberVerification: false,
    enableEmailVerification: false,
  });

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
          if (data.seller) {
            setSeller((prev) => ({ ...prev, ...data.seller }));
          }
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
    setSeller((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    try {
      setSaving(true);
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seller,
          enableNumberVerification: authSettings.enableNumberVerification,
          enableEmailVerification: authSettings.enableEmailVerification,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.seller) setSeller((prev) => ({ ...prev, ...data.seller }));
        showToast('Settings saved successfully!');
      } else {
        showToast('Failed to save settings.');
      }
    } catch (err) {
      console.error('Error saving settings:', err);
      showToast('Error saving settings.');
    } finally {
      setSaving(false);
    }
  };

  // Keyboard shortcut Cmd/Ctrl + S
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [seller, authSettings]);

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
        className="w-full flex-1 flex flex-col min-h-[calc(100vh-48px)] text-[#111111]"
        style={{ fontFamily: "'Helvetica Now Text', sans-serif" }}
      >
        {/* Top Header */}
        <div className="bg-white border-b border-neutral-200 -mt-4 sm:-mt-6 -mx-4 sm:-mx-6 px-6 py-4 mb-6 shadow-2xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-[22px] font-bold text-[#111111] tracking-tight">
                Settings
              </h1>
              <p className="text-[12.5px] text-neutral-500 mt-0.5">
                Configure your seller profile, tax invoice address, and store preferences.
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
          <div className="flex items-center gap-2 mt-4 pt-3 border-t border-neutral-100">
            <button
              type="button"
              onClick={() => setActiveTab('invoice')}
              className={`px-3.5 py-1.5 rounded-lg text-[13px] font-medium transition-all cursor-pointer ${
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
              className={`px-3.5 py-1.5 rounded-lg text-[13px] font-medium transition-all cursor-pointer ${
                activeTab === 'auth'
                  ? 'bg-neutral-100 text-[#111111] font-semibold shadow-2xs'
                  : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50'
              }`}
            >
              Verification & Security
            </button>
          </div>
        </div>

        {/* Content Area */}
        {loading ? (
          <div className="flex items-center justify-center p-16 text-neutral-400">
            <RefreshCw className="w-6 h-6 animate-spin text-[#111111]" />
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-6 max-w-5xl">
            {activeTab === 'invoice' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left: Input Form (7 cols) */}
                <div className="lg:col-span-7 bg-white rounded-2xl border border-neutral-200/80 p-5 sm:p-6 shadow-xs space-y-5">
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

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Company Name */}
                    <div className="sm:col-span-2">
                      <label className="block text-[12px] font-semibold text-neutral-700 mb-1">
                        Company / Brand Name *
                      </label>
                      <input
                        type="text"
                        value={seller.companyName}
                        onChange={(e) => handleSellerChange('companyName', e.target.value)}
                        required
                        className="w-full h-10 px-3 rounded-xl border border-neutral-200 bg-neutral-50/50 text-[13px] text-[#111111] focus:bg-white focus:border-[#111111] focus:outline-none transition-all"
                        placeholder="e.g. Sonu Shoe"
                      />
                    </div>

                    {/* Address Line 1 */}
                    <div className="sm:col-span-2">
                      <label className="block text-[12px] font-semibold text-neutral-700 mb-1">
                        Address Line 1 (Street / House / Floor) *
                      </label>
                      <input
                        type="text"
                        value={seller.addressLine1}
                        onChange={(e) => handleSellerChange('addressLine1', e.target.value)}
                        required
                        className="w-full h-10 px-3 rounded-xl border border-neutral-200 bg-neutral-50/50 text-[13px] text-[#111111] focus:bg-white focus:border-[#111111] focus:outline-none transition-all"
                        placeholder="e.g. 34, Rd Number 2, Nehru Nagar"
                      />
                    </div>

                    {/* Address Line 2 */}
                    <div className="sm:col-span-2">
                      <label className="block text-[12px] font-semibold text-neutral-700 mb-1">
                        Address Line 2 (Colony / Landmark / Area)
                      </label>
                      <input
                        type="text"
                        value={seller.addressLine2}
                        onChange={(e) => handleSellerChange('addressLine2', e.target.value)}
                        className="w-full h-10 px-3 rounded-xl border border-neutral-200 bg-neutral-50/50 text-[13px] text-[#111111] focus:bg-white focus:border-[#111111] focus:outline-none transition-all"
                        placeholder="e.g. Patliputra Colony"
                      />
                    </div>

                    {/* City */}
                    <div>
                      <label className="block text-[12px] font-semibold text-neutral-700 mb-1">
                        City *
                      </label>
                      <input
                        type="text"
                        value={seller.city}
                        onChange={(e) => handleSellerChange('city', e.target.value)}
                        required
                        className="w-full h-10 px-3 rounded-xl border border-neutral-200 bg-neutral-50/50 text-[13px] text-[#111111] focus:bg-white focus:border-[#111111] focus:outline-none transition-all"
                        placeholder="e.g. Patna"
                      />
                    </div>

                    {/* State */}
                    <div>
                      <label className="block text-[12px] font-semibold text-neutral-700 mb-1">
                        State *
                      </label>
                      <input
                        type="text"
                        value={seller.state}
                        onChange={(e) => handleSellerChange('state', e.target.value)}
                        required
                        className="w-full h-10 px-3 rounded-xl border border-neutral-200 bg-neutral-50/50 text-[13px] text-[#111111] focus:bg-white focus:border-[#111111] focus:outline-none transition-all"
                        placeholder="e.g. Bihar"
                      />
                    </div>

                    {/* Pincode */}
                    <div>
                      <label className="block text-[12px] font-semibold text-neutral-700 mb-1">
                        Pincode *
                      </label>
                      <input
                        type="text"
                        value={seller.pincode}
                        onChange={(e) => handleSellerChange('pincode', e.target.value)}
                        required
                        className="w-full h-10 px-3 rounded-xl border border-neutral-200 bg-neutral-50/50 text-[13px] text-[#111111] focus:bg-white focus:border-[#111111] focus:outline-none transition-all"
                        placeholder="e.g. 800013"
                      />
                    </div>

                    {/* State Code */}
                    <div>
                      <label className="block text-[12px] font-semibold text-neutral-700 mb-1">
                        State Code (GST Code)
                      </label>
                      <input
                        type="text"
                        value={seller.stateCode}
                        onChange={(e) => handleSellerChange('stateCode', e.target.value)}
                        className="w-full h-10 px-3 rounded-xl border border-neutral-200 bg-neutral-50/50 text-[13px] text-[#111111] focus:bg-white focus:border-[#111111] focus:outline-none transition-all"
                        placeholder="e.g. 10 (Bihar)"
                      />
                    </div>

                    {/* Phone Number */}
                    <div>
                      <label className="block text-[12px] font-semibold text-neutral-700 mb-1">
                        Contact Phone
                      </label>
                      <input
                        type="text"
                        value={seller.phone}
                        onChange={(e) => handleSellerChange('phone', e.target.value)}
                        className="w-full h-10 px-3 rounded-xl border border-neutral-200 bg-neutral-50/50 text-[13px] text-[#111111] focus:bg-white focus:border-[#111111] focus:outline-none transition-all"
                        placeholder="e.g. 8008439762"
                      />
                    </div>

                    {/* Contact Email */}
                    <div>
                      <label className="block text-[12px] font-semibold text-neutral-700 mb-1">
                        Contact Email
                      </label>
                      <input
                        type="email"
                        value={seller.email}
                        onChange={(e) => handleSellerChange('email', e.target.value)}
                        className="w-full h-10 px-3 rounded-xl border border-neutral-200 bg-neutral-50/50 text-[13px] text-[#111111] focus:bg-white focus:border-[#111111] focus:outline-none transition-all"
                        placeholder="e.g. support@sonushoe.com"
                      />
                    </div>

                    {/* GSTIN Number */}
                    <div className="sm:col-span-2">
                      <label className="block text-[12px] font-semibold text-neutral-700 mb-1">
                        GSTIN No. (Optional)
                      </label>
                      <input
                        type="text"
                        value={seller.gstin}
                        onChange={(e) => handleSellerChange('gstin', e.target.value)}
                        className="w-full h-10 px-3 rounded-xl border border-neutral-200 bg-neutral-50/50 text-[13px] text-[#111111] focus:bg-white focus:border-[#111111] focus:outline-none transition-all"
                        placeholder="Leave blank if not registered"
                      />
                    </div>

                    {/* Signature Line */}
                    <div className="sm:col-span-2">
                      <label className="block text-[12px] font-semibold text-neutral-700 mb-1">
                        Invoice Signature Label
                      </label>
                      <input
                        type="text"
                        value={seller.signatureTitle}
                        onChange={(e) => handleSellerChange('signatureTitle', e.target.value)}
                        className="w-full h-10 px-3 rounded-xl border border-neutral-200 bg-neutral-50/50 text-[13px] text-[#111111] focus:bg-white focus:border-[#111111] focus:outline-none transition-all"
                        placeholder="e.g. Authorized Signature for Sonu Shoe"
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
