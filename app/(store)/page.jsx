'use client';

import React, { useState } from 'react';

export default function HomePage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleNotifyMe = (e) => {
    e.preventDefault();
    if (email && email.includes('@')) {
      setSubmitted(true);
      try {
        localStorage.setItem('sonu_early_access_email', email);
      } catch (err) {}
    }
  };

  const openSearch = () => {
    window.dispatchEvent(new CustomEvent('open-search'));
  };

  const openSidebar = () => {
    window.dispatchEvent(new CustomEvent('open-menu'));
  };

  return (
    <div
      className="w-full flex-1 flex flex-col justify-between bg-white text-[#111111] select-none"
      style={{ fontFamily: "'Helvetica Now Text', sans-serif" }}
    >
      {/* Top Banner Tag */}
      <div className="w-full border-b border-neutral-100 bg-[#fafafa] py-2 text-center px-4">
        <p className="text-[11.5px] sm:text-[12px] tracking-[0.2em] uppercase font-medium text-[#707072]">
          Sonu Shoe / Small-Run Handcrafted Footwear
        </p>
      </div>

      {/* Hero / Main Centered Section */}
      <div className="w-full max-w-[1240px] mx-auto px-6 sm:px-10 lg:px-12 py-16 sm:py-24 lg:py-28 flex flex-col items-center justify-center text-center flex-1">
        {/* Subtle Pill Tag */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-neutral-100 text-[#111111] text-[11.5px] sm:text-[12px] font-semibold uppercase tracking-wider mb-8">
          <span className="w-2 h-2 rounded-full bg-[#111111] animate-ping" />
          <span>Edition 01 &bull; Drop Preview</span>
        </div>

        {/* Big Signature Headline: LAUNCHING SOON */}
        <h1
          className="text-[44px] sm:text-[72px] lg:text-[96px] font-black uppercase text-[#111111] tracking-[-0.03em] leading-[0.95] max-w-4xl"
          style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
        >
          Launching Soon.
        </h1>

        {/* Subtitle / Brand Philosophy */}
        <p className="text-[16px] sm:text-[19px] lg:text-[21px] text-[#707072] mt-6 max-w-xl leading-relaxed">
          For the long way home. Engineered in small handcrafted runs with ergonomic gum rubber soles and full-grain leather.
        </p>

        {/* Quick Explore Triggers */}
        <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
          <button
            type="button"
            onClick={openSearch}
            className="px-6 py-3 rounded-full bg-[#111111] hover:bg-black text-white text-[14px] font-semibold transition-all shadow-sm active:scale-95 cursor-pointer flex items-center gap-2"
          >
            <svg
              className="w-4 h-4 text-white shrink-0"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <span>Search Catalog</span>
          </button>

          <button
            type="button"
            onClick={openSidebar}
            className="px-6 py-3 rounded-full bg-white hover:bg-neutral-50 text-[#111111] border border-neutral-300 text-[14px] font-semibold transition-all shadow-2xs active:scale-95 cursor-pointer flex items-center gap-2"
          >
            <svg
              className="w-4 h-4 text-[#111111] shrink-0"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
            <span>Explore Menu</span>
          </button>
        </div>

        {/* Clean Early Access Email Box */}
        <div className="mt-12 w-full max-w-md">
          {submitted ? (
            <div className="p-4 rounded-2xl bg-neutral-100 text-[#111111] text-[13.5px] font-medium text-center">
              ✓ You are on the priority list. We will notify you the moment Drop 01 goes live.
            </div>
          ) : (
            <form onSubmit={handleNotifyMe} className="flex items-center gap-2">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email for private drop access"
                className="flex-1 h-[48px] px-4 rounded-full border border-neutral-300 focus:border-[#111111] text-[13.5px] text-[#111111] placeholder-neutral-400 outline-none transition-colors bg-white"
              />
              <button
                type="submit"
                className="h-[48px] px-6 rounded-full bg-[#111111] hover:bg-black text-white text-[13.5px] font-semibold transition-all cursor-pointer whitespace-nowrap active:scale-95"
              >
                Notify Me
              </button>
            </form>
          )}
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-10 mt-16 sm:mt-20 pt-12 border-t border-neutral-200/80 w-full max-w-3xl text-center sm:text-left">
          <div>
            <h2 className="text-[14px] font-bold text-[#111111] uppercase tracking-wider">
              Handcrafted Soles
            </h2>
            <p className="text-[12.5px] text-[#707072] mt-1 leading-relaxed">
              Ergonomic gum rubber cushions designed for all-day city walking.
            </p>
          </div>
          <div>
            <h2 className="text-[14px] font-bold text-[#111111] uppercase tracking-wider">
              Small-Run Drops
            </h2>
            <p className="text-[12.5px] text-[#707072] mt-1 leading-relaxed">
              Strictly limited numbers per silhouette to maintain uncompromising build quality.
            </p>
          </div>
          <div>
            <h2 className="text-[14px] font-bold text-[#111111] uppercase tracking-wider">
              Express Dispatch
            </h2>
            <p className="text-[12.5px] text-[#707072] mt-1 leading-relaxed">
              Air express fulfillment straight from our Patna One Plaza flagship hub.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
