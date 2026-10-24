'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

const CACHE_NAME = 'sonu-global-image-cache-v1';
const cachedUrls = new Set();

/**
 * Caches a loaded image URL directly into the browser's persistent CacheStorage
 */
export function cacheLoadedImage(src) {
  if (!src || typeof window === 'undefined' || !('caches' in window)) return;
  // Ignore data URIs or blob URLs
  if (src.startsWith('data:') || src.startsWith('blob:')) return;
  if (cachedUrls.has(src)) return;
  cachedUrls.add(src);

  caches
    .open(CACHE_NAME)
    .then((cache) => {
      cache.match(src).then((matched) => {
        if (!matched) {
          fetch(src, { mode: 'no-cors', priority: 'low' })
            .then((response) => {
              if (response && (response.ok || response.type === 'opaque')) {
                cache.put(src, response);
              }
            })
            .catch(() => {});
        }
      });
    })
    .catch(() => {});
}

/**
 * Scans all current document images and caches already-completed ones
 */
function scanAndCacheImages() {
  if (typeof document === 'undefined') return;
  const imgs = document.querySelectorAll('img');
  imgs.forEach((img) => {
    const src = img.currentSrc || img.src;
    if (src && img.complete && img.naturalWidth > 0) {
      cacheLoadedImage(src);
    }
  });
}

export default function GlobalImageCache() {
  const pathname = usePathname();
  const initializedRef = useRef(false);

  useEffect(() => {
    // 1. Register Service Worker for seamless network-level image caching
    if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          // If updated sw is waiting, activate immediately
          if (reg.waiting) {
            reg.waiting.postMessage({ type: 'SKIP_WAITING' });
          }
        })
        .catch(() => {});
    }

    if (initializedRef.current) return;
    initializedRef.current = true;

    // 2. Global capture listener: as soon as ANY image loads on ANY page, cache it
    const handleImageLoad = (event) => {
      const target = event.target;
      if (target && target.tagName === 'IMG') {
        const src = target.currentSrc || target.src;
        if (src) {
          cacheLoadedImage(src);
        }
      }
    };

    // Use capture phase (true) so we intercept load events from all images anywhere in the DOM tree
    document.addEventListener('load', handleImageLoad, true);

    // 3. Scan existing images on the page
    scanAndCacheImages();

    // 4. MutationObserver to catch dynamically rendered images (drawers, modals, carousels)
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList') {
          for (const node of mutation.addedNodes) {
            if (node.nodeType === Node.ELEMENT_NODE) {
              if (node.tagName === 'IMG') {
                const src = node.currentSrc || node.src;
                if (src && node.complete && node.naturalWidth > 0) {
                  cacheLoadedImage(src);
                }
              } else if (node.querySelectorAll) {
                const innerImgs = node.querySelectorAll('img');
                innerImgs.forEach((img) => {
                  const src = img.currentSrc || img.src;
                  if (src && img.complete && img.naturalWidth > 0) {
                    cacheLoadedImage(src);
                  }
                });
              }
            }
          }
        }
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      document.removeEventListener('load', handleImageLoad, true);
      observer.disconnect();
    };
  }, []);

  // Whenever the user navigates to a new page (home screen, product detail, checkout, etc.)
  useEffect(() => {
    scanAndCacheImages();
    // Run another check after a brief microtask for react hydration
    const timer = setTimeout(scanAndCacheImages, 100);
    return () => clearTimeout(timer);
  }, [pathname]);

  return null;
}
