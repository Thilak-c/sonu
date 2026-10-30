'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageTransition from '@/components/PageTransition';
import GlobalImageCache from '@/components/GlobalImageCache';

export default function StoreLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSiteUnlocked, setIsSiteUnlocked] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('sonu_site_unlocked');
      const hasCookie = document.cookie.includes('sonu_site_unlocked=true');
      if (stored === 'true' || hasCookie) {
        setIsSiteUnlocked(true);
      }
    } catch (e) {}
  }, [pathname]);

  // Force all visitors to /launching-soon unless unlocked via /narzo50pro PIN
  useEffect(() => {
    // Check local storage or cookie
    let unlocked = false;
    try {
      unlocked = localStorage.getItem('sonu_site_unlocked') === 'true' || document.cookie.includes('sonu_site_unlocked=true');
    } catch (e) {}

    if (unlocked) {
      return;
    }

    // Allow user to visit /narzo50pro or /launching-soon
    if (pathname && pathname !== '/launching-soon' && pathname !== '/narzo50pro') {
      router.replace('/launching-soon');
    }
  }, [pathname, router]);

  const isCheckout = pathname === '/checkout';
  const isHelpCenter = pathname === '/help-center' || pathname?.startsWith('/help-center');

  return (
    <div className={`min-h-dvh bg-white flex flex-col justify-between ${isCheckout ? 'lg:pb-0 pb-[80px]' : ''}`}>
      <GlobalImageCache />
      {!isHelpCenter && <Header />}
      <main id="main" className="flex-1 flex flex-col">
        <PageTransition>{children}</PageTransition>
      </main>
      <Footer />
    </div>
  );
}
