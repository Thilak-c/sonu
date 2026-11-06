'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';

const ALLOWED_USERS = ['8008', '9122'];

export default function AdminLoginPage() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    // Focus input on mount
    inputRef.current?.focus();

    // Check if already authenticated
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth');
        const data = await res.json();
        if (data.authenticated) {
          router.replace('/orders');
        }
      } catch {
        // Ignore
      }
    };
    checkAuth();
  }, [router]);

  const handleLogin = async (overrideCode) => {
    const targetCode = (overrideCode || code).trim();
    if (!targetCode) {
      setError('Please enter a user code.');
      return;
    }

    if (!ALLOWED_USERS.includes(targetCode)) {
    setError('Invalid user code. ');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: targetCode }),
      });

      const data = await res.json();

      if (data.success) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('sonu_admin_user', targetCode);
        }
        router.push('/orders');
      } else {
        setError(data.error || 'Authentication failed.');
      }
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleLogin();
    }
  };

  const handleChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 4);
    setCode(val);
    setError('');
    if (val.length === 4) {
      if (ALLOWED_USERS.includes(val)) {
        handleLogin(val);
      } else {
        setError('Invalid user code. ');
      }
    }
  };

  return (
    <div
      className="min-h-screen w-full bg-[#f8f9fa] flex flex-col items-center justify-center p-4 selection:bg-[#111111] selection:text-white"
      style={{ fontFamily: "'Helvetica Now Text', sans-serif" }}
    >
      <div className="w-full max-w-[420px]">
        {/* Main Card */}
        <div className=" flex flex-col items-center text-center">
          {/* Brand Logo & Lock */}
          <div className="relative mb-6">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center ">
              <img
                src="/favicon.ico"
                alt="Sonu Shoe"
                className="w-16 h-16 object-contain rounded-xl"
              />
            </div>
            
          </div>

          {/* Heading */}
         
          <p className="text-[13.5px] text-neutral-500 mt-1 mb-7 leading-relaxed">
            Enter your 4-digit code to access store controls.
          </p>

      

          {/* Code Input */}
          <div className="w-full space-y-4">
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                value={code}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder="••••"
                disabled={loading}
                className={`w-full h-14 text-center text-[26px] font-mono tracking-[0.5em] pl-[0.5em] rounded-xl border bg-neutral-50/50 outline-none transition-all placeholder:text-neutral-300 placeholder:tracking-widest ${
                  error
                    ? 'border-red-400 bg-red-50/30 text-red-900 focus:border-red-500 focus:ring-2 focus:ring-red-100'
                    : 'border-neutral-200 text-[#111111] focus:border-[#111111] focus:bg-white focus:ring-2 focus:ring-neutral-100'
                }`}
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center justify-center gap-1.5 text-[12.5px] text-red-600 d-200/80 px-3 py-2 rounded-lg text-center animate-fade-in">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

           
          </div>
        </div>

        {/* Footer Note */}
        <p className="text-center text-[12px] text-neutral-400 mt-6">
          Authorized personnel only &bull; Sonu Shoe Internal System
        </p>
      </div>
    </div>
  );
}

