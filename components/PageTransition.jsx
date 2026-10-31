'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';

export default function PageTransition({ children }) {
  const pathname = usePathname();
  const [displayChildren, setDisplayChildren] = useState(children);
  const [isFading, setIsFading] = useState(false);
  const prevPathnameRef = useRef(pathname);
  const latestChildrenRef = useRef(children);
  latestChildrenRef.current = children;

  // Disable browser scroll restoration on refresh and force top
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if ('scrollRestoration' in window.history) {
        window.history.scrollRestoration = 'manual';
      }
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
  }, []);

  // Force scroll to top on every page change
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);

  // Keep display children in sync on normal re-renders
  useEffect(() => {
    if (!isFading) {
      setDisplayChildren(children);
    }
  }, [children, isFading]);

  // Route transition: fade out old page, swap content, fade in new page
  useEffect(() => {
    if (pathname === prevPathnameRef.current) return;
    prevPathnameRef.current = pathname;

    // 1. Fade out old page
    setIsFading(true);

    // 2. Once faded out, swap to new route content and fade in
    const timer = setTimeout(() => {
      setDisplayChildren(latestChildrenRef.current);
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      setIsFading(false);
    }, 180);

    return () => clearTimeout(timer);
  }, [pathname]);

  return (
    <div
      className={`flex-1 flex flex-col will-change-[opacity] transition-opacity duration-200 ease-out ${
        isFading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {displayChildren}
    </div>
  );
}
