'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

export default function PageViewTracker() {
  const pathname = usePathname();
  const lastTracked = useRef(null);

  useEffect(() => {
    if (!pathname) return;

    // Deduplicate rapid double executions
    if (lastTracked.current === pathname) return;
    lastTracked.current = pathname;

    // Small delay to ensure document title is set
    const timer = setTimeout(() => {
      try {
        const payload = {
          path: pathname,
          title: typeof document !== 'undefined' ? document.title : '',
        };

        if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
          const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
          navigator.sendBeacon('/api/views', blob);
        } else {
          fetch('/api/views', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            keepalive: true,
          }).catch(() => {});
        }
      } catch (err) {
        // Silently swallow analytics errors so they never disrupt user experience
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [pathname]);

  return null;
}

