'use client';

import { usePathname } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageTransition from '@/components/PageTransition';
import GlobalImageCache from '@/components/GlobalImageCache';

export default function StoreLayout({ children }) {
  const pathname = usePathname();
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
