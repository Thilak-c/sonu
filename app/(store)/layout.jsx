'use client';

import { usePathname } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageTransition from '@/components/PageTransition';

export default function StoreLayout({ children }) {
  const pathname = usePathname();
  const isCheckout = pathname === '/checkout';

  return (
    <div className={`min-h-dvh bg-white flex flex-col justify-between ${isCheckout ? 'pb-[88px]' : ''}`}>
      <Header />
      <main id="main" className="flex-1 flex flex-col">
        <PageTransition>{children}</PageTransition>
      </main>
      <Footer />
    </div>
  );
}
