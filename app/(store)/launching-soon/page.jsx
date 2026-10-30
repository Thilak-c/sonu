'use client';

import React, { useState } from 'react';

export default function LaunchingSoonPage() {
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
      {/* Hero / Main Centered Section */}
      <div className="w-full max-w-[1240px] mx-auto px-6 sm:px-10 lg:px-12 py-16 sm:py-24 lg:py-28 flex flex-col items-center justify-center text-center flex-1">
        {/* Big Signature Headline: LAUNCHING SOON */}
        <h1
          className="text-[44px] sm:text-[72px] lg:text-[96px] font-black uppercase text-[#111111] tracking-[-0.03em] leading-[0.95] max-w-4xl"
          style={{ fontFamily: "'Helvetica Now Text Medium', sans-serif" }}
        >
          Launching Soon.
        </h1>
      </div>
    </div>
  );
}

