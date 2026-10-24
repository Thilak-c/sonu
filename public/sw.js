// Sonu shoe Global Image Cache Service Worker
const CACHE_NAME = 'sonu-global-image-cache-v1';

// Static image extensions & directories to intercept
const IMAGE_EXTENSIONS = /\.(png|jpe?g|webp|avif|svg|gif|ico)(\?.*)?$/i;

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME && key.startsWith('sonu-image')) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only intercept GET requests
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Check if request is an image
  const isImage =
    request.destination === 'image' ||
    IMAGE_EXTENSIONS.test(url.pathname) ||
    url.pathname.startsWith('/images/') ||
    url.pathname.startsWith('/Logo/') ||
    url.pathname.startsWith('/asset/') ||
    url.pathname.includes('/_next/image');

  if (!isImage) return;

  // Cache-First with Network Fallback & Auto-Revalidation
  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cachedResponse = await cache.match(request);
      if (cachedResponse) {
        // Return immediately from local cache
        // Optionally revalidate in background if online
        fetch(request)
          .then((networkResponse) => {
            if (networkResponse && (networkResponse.ok || networkResponse.type === 'opaque')) {
              cache.put(request, networkResponse.clone());
            }
          })
          .catch(() => {});
        return cachedResponse;
      }

      // If not in cache, fetch from network and cache clone
      return fetch(request)
        .then((networkResponse) => {
          if (networkResponse && (networkResponse.ok || networkResponse.type === 'opaque')) {
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        })
        .catch(async () => {
          // If offline and cache has match by URL string
          const fallback = await cache.match(request.url);
          if (fallback) return fallback;
          return new Response('', { status: 408, statusText: 'Request timed out' });
        });
    })
  );
});
