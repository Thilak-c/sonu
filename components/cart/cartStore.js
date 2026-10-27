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
      // If item has a mismatched footwear size like UK 10/11/12, normalize to UK 9 (preserve 'One Size' for accessories/gear)
      if (size && size !== 'One Size' && !VALID_CATALOG_SIZES.includes(size)) {
        size = 'UK 9';
      }
      return {
        ...item,
        size: size || 'One Size',
        image: LEGACY_IMAGES[item.image] || item.image,
      };
    });
  } catch (e) {
    console.error('Failed to parse cart', e);
    return [];
  }
}

export function calculateCartSubtotal(cartItems) {
  return getCartPricingSummary(cartItems).subtotal;
}

export function getCartPricingSummary(cartItems) {
  if (!Array.isArray(cartItems) || cartItems.length === 0) {
    return {
      items: [],
      combos: [],
      rawTotal: 0,
      comboDiscount: 0,
      subtotal: 0,
    };
  }

  const pool = cartItems.map((item) => {
    let pNum = Number(item.priceNumber);
    if (!pNum || isNaN(pNum)) {
      if (typeof item.price === 'string') {
        const parsed = Number(item.price.replace(/[^\d.]/g, ''));
        pNum = !isNaN(parsed) && parsed > 0 ? parsed : 13995;
      } else if (typeof item.price === 'number') {
        pNum = item.price;
      } else {
        pNum = 13995;
      }
    }
    return {
      ...item,
      remainingQty: Number(item.quantity || 1),
      unitPrice: pNum,
    };
  });

  const combos = [];
  let total = 0;
  let rawTotal = 0;

  for (const item of pool) {
    rawTotal += item.remainingQty * item.unitPrice;
  }

  // Check for combo packages
  for (const base of pool) {
    const comboPriceNum = Number(base.comboPrice);
    const hasCombo =
      comboPriceNum > 0 &&
      Array.isArray(base.comboItems) &&
      base.comboItems.length > 0;

    if (hasCombo && base.remainingQty > 0) {
      const requiredSlugs = base.comboItems.map((ci) => ci.slug || ci.id);

      while (base.remainingQty > 0) {
        const matchedItems = requiredSlugs.map((slug) =>
          pool.find(
            (p) =>
              (p.id === slug || p.slug === slug) &&
              p !== base &&
              p.remainingQty > 0
          )
        );

        if (matchedItems.every(Boolean)) {
          base.remainingQty -= 1;
          const matchedNames = [base.name];
          let individualComboSum = base.unitPrice;

          matchedItems.forEach((m) => {
            m.remainingQty -= 1;
            matchedNames.push(m.name);
            individualComboSum += m.unitPrice;
          });

          const savings = Math.max(0, individualComboSum - comboPriceNum);

          combos.push({
            title: 'combo offer',
            items: matchedNames,
            comboPrice: comboPriceNum,
            originalPrice: individualComboSum,
            savings,
          });

          total += comboPriceNum;
        } else {
          break;
        }
      }
    }
  }

  // Add remaining unbundled items at standard selling price
  for (const item of pool) {
    if (item.remainingQty > 0) {
      total += item.remainingQty * item.unitPrice;
    }
  }

  return {
    items: pool.map((item) => ({
      name: item.name || 'Shoe',
      quantity: Number(item.quantity || 1),
      unitPrice: item.unitPrice,
      totalPrice: item.unitPrice * Number(item.quantity || 1),
    })),
    combos,
    rawTotal,
    comboDiscount: Math.max(0, rawTotal - total),
    subtotal: total,
  };
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
    (item) =>
      !(
        item.id === itemId &&
        (!size || item.size === size) &&
        (!color || item.color === color)
      )
  );
  saveCartItems(updated);
  return updated;
}

export function updateCartQuantity(itemId, size, color, delta) {
  const current = getCartItems();
  let matched = false;
  const updated = current
    .map((item) => {
      const match =
        item.id === itemId &&
        (!size || item.size === size) &&
        (!color || item.color === color);
      if (match && !matched) {
        matched = true;
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