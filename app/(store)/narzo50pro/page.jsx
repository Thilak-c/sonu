'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const VIP_PIN = '8008439762';

export default function Narzo50ProPage() {
  const router = useRouter();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('sonu_site_unlocked');
      if (stored === 'true') {
        setIsUnlocked(true);
      }
    } catch (e) {}
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (pin.trim() === VIP_PIN) {
      try {
        localStorage.setItem('sonu_site_unlocked', 'true');
        // Also set a cookie so Server Components and early loaders can detect it
        document.cookie = 'sonu_site_unlocked=true; path=/; max-age=31536000; SameSite=Lax';
      } catch (err) {}

      setIsUnlocked(true);
      setTimeout(() => {
        router.push('/');
      }, 600);
    } else {
      setError('Incorrect 10-digit PIN. Please try again.');
    }
  };

  return (
    <div
      className="min-h-[80vh] flex items-center justify-center px-4 py-16 bg-white text-[#111111]"
      style={{ fontFamily: "'Helvetica Now Text', sans-serif" }}
    >
      {/* Modal Card */}
      <div className="w-full max-w-md p-6 sm:p-8 rounded-3xl bg-white border border-neutral-200 shadow-2xl text-center space-y-6">
        <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center mx-auto text-[#111111]">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0110 0v4" />
          </svg>
        </div>

        <div>
          <span className="text-[11px] uppercase tracking-[0.2em] font-semibold text-neutral-400 block mb-1">
            VIP Gateway Access
          </span>
          <h1
            className="text-[22px] sm:text-[24px] font-bold text-[#111111] tracking-tight font-['Helvetica_Now_Text_Medium',sans-serif]"
            style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
          >
            Enter 10-Digit Access PIN
          </h1>
          <p className="text-[13px] text-neutral-500 mt-1">
            Provide the authorized unlock PIN to bypass the Launching Soon restriction and access the entire store.
          </p>
        </div>

        {isUnlocked ? (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[13.5px] font-medium space-y-2">
            <p className="font-bold">✓ Storefront Unlocked Successfully!</p>
            <p className="text-[12px] text-emerald-600">Redirecting you to the home catalog...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="password"
                inputMode="numeric"
                maxLength={10}
                autoFocus
                placeholder="••••••••••"
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value.replace(/\D/g, '').slice(0, 10));
                  setError('');
                }}
                className="w-full h-12 px-4 rounded-xl border border-neutral-300 focus:border-[#111111] text-center text-[20px] tracking-[0.3em] font-mono outline-none transition-all placeholder:tracking-normal placeholder:font-sans placeholder:text-[14px]"
              />
              {error && <p className="text-[12px] text-rose-600 font-medium mt-1.5">{error}</p>}
            </div>

            <button
              type="submit"
              disabled={pin.length !== 10}
              className="w-full h-12 rounded-full bg-[#111111] hover:bg-black disabled:opacity-50 text-white text-[14px] font-semibold transition-all shadow-sm active:scale-98 cursor-pointer flex items-center justify-center"
            >
              Unlock Entire Store
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
