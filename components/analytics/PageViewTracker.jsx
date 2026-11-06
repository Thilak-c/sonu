'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

const STORAGE_KEY = 'sonu_viewed_pages';

function hasViewedPage(path) {
  if (typeof window === 'undefined') return false;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const map = JSON.parse(raw);
    return !!map[path];
  } catch {
    return false;
  }
}

function markPageViewed(path) {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const map = raw ? JSON.parse(raw) : {};
    map[path] = Date.now();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {}
}

export default function PageViewTracker() {
  const pathname = usePathname();
  const lastTracked = useRef(null);

  useEffect(() => {
    if (!pathname) return;

    // Normalize path (strip query params, trailing slashes, clean root)
    const cleanPath = pathname.split('?')[0].replace(/\/+$/, '') || '/';

    // Ignore internal or admin paths
    if (cleanPath.startsWith('/admin') || cleanPath.startsWith('/api')) return;

    // Deduplicate in-memory double-mount executions
    if (lastTracked.current === cleanPath) return;
    lastTracked.current = cleanPath;

    // Check localStorage: only count view ONCE per page per user
    if (hasViewedPage(cleanPath)) {
      return;
    }

    // Mark as viewed in localStorage immediately to prevent race conditions
    markPageViewed(cleanPath);

    // Small delay to ensure document title is set
    const timer = setTimeout(() => {
      try {
        const payload = {
          path: cleanPath,
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

