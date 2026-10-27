import { initDb } from './mongodb.js';
import { ObjectId } from 'mongodb';

const toPlain = (doc) => (doc ? JSON.parse(JSON.stringify(doc)) : doc);

function formatProduct(raw) {
  if (!raw) return null;
  const p = toPlain(raw);
  const id = p.slug || p.itemId || String(p._id);
  const mainImg = p.image || p.mainImage || (Array.isArray(p.gallery) && p.gallery[0]) || '';
  const gallery = Array.isArray(p.gallery) && p.gallery.length > 0 ? p.gallery : (mainImg ? [mainImg] : []);
  const numPrice = Number(p.priceNumber || (typeof p.price === 'number' ? p.price : 13995));
  const displayPrice = typeof p.price === 'string' && p.price.startsWith('₹')
    ? p.price
    : `₹${numPrice.toLocaleString('en-IN')}`;

  const availableSizes = Array.isArray(p.availableSizes) && p.availableSizes.length > 0
    ? p.availableSizes
    : (Array.isArray(p.variants) && p.variants.length > 0
        ? p.variants.filter((v) => v.active !== false && Number(v.stock || 0) > 0).map((v) => v.size)
        : ['UK 3', 'UK 4', 'UK 5', 'UK 6', 'UK 7', 'UK 8', 'UK 9', 'UK 10', 'UK 11']);

  return {
    ...p,
    id,
    itemId: id,
    slug: p.slug || id,
    name: p.name || 'Sonu Shoe',
    category: p.category || "Road Running Shoes",
    image: mainImg,
    mainImage: mainImg,
    gallery,
    otherImages: gallery,
    alt: p.alt || `${p.name || 'Sonu Shoe'} - ${p.category || 'Shoe'}`,
    price: displayPrice,
    priceNumber: numPrice,
    originalPrice: p.originalPrice ? Number(p.originalPrice) : null,
    costPrice: p.costPrice ? Number(p.costPrice) : null,
    description: p.description || '',
    availableSizes,
    variants: p.variants || [],
    inStock: p.inStock !== false && p.hidden !== true,
    featured: p.featured === true,
  };
}

export async function getAllProducts() {
  try {
    const db = await initDb();
    if (!db) return [];
    
    // Fetch real products from DB that are not hidden
    const dbProducts = await db
      .collection('products')
      .find({ hidden: { $ne: true } })
      .sort({ createdAt: -1 })
      .toArray();

    return (dbProducts || []).map(formatProduct);
  } catch (err) {
    console.error('[MongoDB] Error fetching all products:', err);
    return [];
  }
}

export async function getProductById(id) {
  if (!id) return null;

  try {
    const db = await initDb();
    if (!db) return null;

    const queries = [{ slug: id }, { itemId: id }, { sku: id }];
    if (ObjectId.isValid(id)) {
      queries.push({ _id: new ObjectId(id) });
    }

    const raw = await db.collection('products').findOne({ $or: queries });
    if (!raw) return null;

    return formatProduct(raw);
  } catch (err) {
    console.error('[MongoDB] Error fetching product by ID:', err);
    return null;
  }
}
