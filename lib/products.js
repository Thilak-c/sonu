import { FRESH_DROPS } from '@/components/home/freshDropsData';
import { initDb } from './mongodb';

const toPlain = (doc) => (doc ? JSON.parse(JSON.stringify(doc)) : doc);

export async function getAllProducts() {
  try {
    const db = await initDb();
    if (db) {
      const dbProducts = await db.collection('products').find({}).toArray();
      if (dbProducts && dbProducts.length > 0) {
        return dbProducts.map((raw) => {
          const p = toPlain(raw);
          return {
            ...p,
            id: p.slug || p.itemId || String(p._id),
            itemId: p.itemId || p.slug || String(p._id),
            mainImage: p.mainImage || p.image,
            price: typeof p.price === 'number' ? p.price : (p.priceNumber || 13995),
          };
        });
      }
    }
  } catch (err) {
    // MongoDB fallback to FRESH_DROPS
  }

  return FRESH_DROPS.map((p) => ({
    ...p,
    itemId: p.id || p.slug,
    mainImage: p.image,
    otherImages: p.gallery || [],
    price: p.priceNumber || 13995,
    availableSizes: ['UK 3', 'UK 4', 'UK 5', 'UK 6', 'UK 7', 'UK 8', 'UK 9'],
    inStock: true,
  }));
}

export async function getProductById(id) {
  if (!id) return null;

  // Check FRESH_DROPS first for instant matching
  const staticMatch = FRESH_DROPS.find((p) => p.id === id || p.slug === id);
  if (staticMatch) {
    return {
      ...staticMatch,
      itemId: staticMatch.id,
      mainImage: staticMatch.image,
      otherImages: staticMatch.gallery || [],
      price: staticMatch.priceNumber || 13995,
      availableSizes: ['UK 3', 'UK 4', 'UK 5', 'UK 6', 'UK 7', 'UK 8', 'UK 9'],
      inStock: true,
    };
  }

  try {
    const db = await initDb();
    if (db) {
      const raw = await db.collection('products').findOne({
        $or: [{ slug: id }, { itemId: id }],
      });
      if (raw) {
        const p = toPlain(raw);
        return {
          ...p,
          id: p.slug || p.itemId || String(p._id),
          itemId: p.itemId || p.slug || String(p._id),
          mainImage: p.mainImage || p.image,
          price: typeof p.price === 'number' ? p.price : (p.priceNumber || 13995),
          availableSizes: p.availableSizes || ['UK 3', 'UK 4', 'UK 5', 'UK 6', 'UK 7', 'UK 8', 'UK 9'],
          inStock: p.inStock !== false,
        };
      }
    }
  } catch (err) {
    // Ignore db failure
  }

  return null;
}
