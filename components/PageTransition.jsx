'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';

export default function PageTransition({ children }) {
  const pathname = usePathname();
  const [displayChildren, setDisplayChildren] = useState(children);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const prevPathnameRef = useRef(pathname);

  useEffect(() => {
    // When route path changes
    if (pathname !== prevPathnameRef.current) {
      prevPathnameRef.current = pathname;
      // 1. Fade out current page quickly
      setIsFadingOut(true);

      const timer = setTimeout(() => {
        // 2. Switch to new page content and scroll to top
        setDisplayChildren(children);
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
        // 3. Fade in new page
        requestAnimationFrame(() => {
          setIsFadingOut(false);
        });
      }, 120);

      return () => clearTimeout(timer);
    } else {
      // Content updated on same page
      setDisplayChildren(children);
    }
  }, [pathname, children]);

  return (
    <div
      className={`flex-1 flex flex-col will-change-[opacity] transition-opacity duration-150 ease-out animate-page-in ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {displayChildren}
    </div>
  );
}
