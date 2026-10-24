'use client';

const CART_STORAGE_KEY = 'sonu_cart';

const LEGACY_IMAGES = {
  '/images/products/hybrid-purple-thumb.png': '/images/ad22b92Nike-HQ2593-502_1.avif',
  '/images/products/hybrid-purple-main.png': '/images/ad22b92Nike-HQ2593-502_1.avif',
  '/images/products/hybrid-black-thumb.png': '/images/ad22b92Nike-HJ1101-003_1.avif',
  '/images/products/hybrid-white-thumb.png': '/images/1e462d9Nike-IO3815-102_1.avif',
  '/images/model-01-low.webp': '/images/ad22b92Nike-HJ1101-003_1.avif',
  '/images/model-02-runner.webp': '/images/ad22b92Nike-HQ2593-502_1.avif',
  '/images/model-03-court.webp': '/images/ad22b92Nike-HQ3049-502_1.avif',
  '/images/model-04-trail.webp': '/images/1e462d9Nike-IO3815-500_1.avif',
  '/images/model-05-archive.webp': '/images/ad22b92Nike-IQ3439-211_1.avif',
};

const VALID_CATALOG_SIZES = ['UK 3', 'UK 4', 'UK 5', 'UK 6', 'UK 7', 'UK 8', 'UK 9'];

export function getCartItems() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    const items = raw ? JSON.parse(raw) : [];
    return items.map((item) => {
      let size = item.size;
      // If item has a mismatched size like UK 10/11/12, normalize to UK 9
      if (size && !VALID_CATALOG_SIZES.includes(size)) {
        size = 'UK 9';
      }
      return {
        ...item,
        size: size || 'UK 8',
        image: LEGACY_IMAGES[item.image] || item.image,
      };
    });
  } catch (e) {
    console.error('Failed to parse cart', e);
    return [];
  }
}

export function saveCartItems(items) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new Event('cart-updated'));
  } catch (e) {
    console.error('Failed to save cart', e);
  }
}

export function addToCart(productItem) {
  const current = getCartItems();
  // Check if item with same id, size and color already exists
  const existingIdx = current.findIndex(
    (item) =>
      item.id === productItem.id &&
      item.size === productItem.size &&
      item.color === productItem.color
  );

  let updated;
  if (existingIdx > -1) {
    updated = [...current];
    updated[existingIdx].quantity = (updated[existingIdx].quantity || 1) + (productItem.quantity || 1);
  } else {
    updated = [
      ...current,
      {
        ...productItem,
        quantity: productItem.quantity || 1,
        addedAt: Date.now(),
      },
    ];
  }

  saveCartItems(updated);
  if (productItem.image) {
    preloadImage(productItem.image);
  }
  return updated;
}

export function removeFromCart(itemId, size, color) {
  const current = getCartItems();
  const updated = current.filter(
    (item) => !(item.id === itemId && item.size === size && item.color === color)
  );
  saveCartItems(updated);
  return updated;
}

export function updateCartQuantity(itemId, size, color, delta) {
  const current = getCartItems();
  const updated = current
    .map((item) => {
      if (item.id === itemId && item.size === size && item.color === color) {
        const newQty = (item.quantity || 1) + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : null;
      }
      return item;
    })
    .filter(Boolean);

  saveCartItems(updated);
  return updated;
}

export function updateCartItemSize(itemId, oldSize, color, newSize) {
  const current = getCartItems();
  const targetIdx = current.findIndex(
    (item) => item.id === itemId && item.size === oldSize && item.color === color
  );
  if (targetIdx === -1) return current;

  // Check if item with itemId and newSize already exists
  const existingNewSizeIdx = current.findIndex(
    (item) => item.id === itemId && item.size === newSize && item.color === color
  );

  let updated = [...current];
  if (existingNewSizeIdx > -1 && existingNewSizeIdx !== targetIdx) {
    // Merge quantity into existing new size item
    updated[existingNewSizeIdx].quantity =
      (updated[existingNewSizeIdx].quantity || 1) + (updated[targetIdx].quantity || 1);
    updated.splice(targetIdx, 1);
  } else {
    updated[targetIdx] = {
      ...updated[targetIdx],
      size: newSize,
    };
  }

  saveCartItems(updated);
  return updated;
}

export function clearCart() {
  saveCartItems([]);
}

/**
 * Preloads and aggressively caches an image into browser memory and CacheStorage
 */
export function preloadImage(src) {
  if (typeof window === 'undefined' || !src) return;
  try {
    // 1. Instant in-memory Image decode
    const img = new Image();
    img.src = src;
    img.decoding = 'async';

    // 2. Head link preload tag for high priority network scheduling
    if (!document.querySelector(`link[rel="preload"][href="${src}"]`)) {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = src;
      link.fetchPriority = 'high';
      document.head.appendChild(link);
    }

    // 3. Cache Storage API persistence for instant 0ms loads
    if ('caches' in window) {
      caches.open('sonu-bag-images-v1').then((cache) => {
        cache.match(src).then((match) => {
          if (!match) {
            fetch(src, { mode: 'no-cors', priority: 'high' })
              .then((res) => {
                if (res && (res.ok || res.type === 'opaque')) {
                  cache.put(src, res);
                }
              })
              .catch(() => {});
          }
        });
      }).catch(() => {});
    }
  } catch (e) {}
}

/**
 * Preloads all images currently in the customer's cart
 */
export function preloadCartImages() {
  if (typeof window === 'undefined') return;
  const items = getCartItems();
  items.forEach((item) => {
    if (item.image) {
      preloadImage(item.image);
    }
  });
}

export const PAYMENT_ICONS = [
  '/images/payments/upi.svg',
  '/images/payments/googlePay.svg',
  '/images/payments/phonePe.svg',
  '/images/payments/paytm.svg',
  '/images/payments/otherUpi.svg',
  '/images/payments/card.svg',
  '/images/payments/netbanking.svg',
  '/images/payments/alert.svg',
  '/images/payments/caret-up.svg',
  '/images/payments/caret-down.svg',
  '/images/payments/radio-selected.svg',
  '/images/payments/radio-unselected.svg',
  '/images/payments/emi.svg',
  '/images/payments/bank-axis.svg',
  '/images/payments/bank-hdfc.svg',
  '/images/payments/bank-icici.svg',
  '/images/payments/bank-kotak.svg',
  '/images/payments/bank-sbi.svg',
  '/images/payments/bank-yes.svg',
  '/images/payments/bank-other.svg',
  '/images/payments/close.svg',
  '/images/payments/down-dropdown.svg',
];

/**
 * Preloads all payment option images and icons into memory and cache
 */
export function preloadPaymentImages() {
  if (typeof window === 'undefined') return;
  PAYMENT_ICONS.forEach((src) => {
    preloadImage(src);
  });
}