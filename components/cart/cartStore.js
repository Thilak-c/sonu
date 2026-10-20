'use client';

const CART_STORAGE_KEY = 'sonu_cart';

export function getCartItems() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
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

export function clearCart() {
  saveCartItems([]);
}
