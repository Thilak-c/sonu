import { NextResponse } from 'next/server';
import { initDb } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = await initDb();
    const products = await db.collection('products').find({}).sort({ createdAt: -1 }).toArray();

    return NextResponse.json({ success: true, count: products.length, products });
  } catch (error) {
    console.error('[Admin Products GET Error]:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      name,
      slug,
      sku,
      brand = 'Sonu Shoe',
      role = 'standard', // 'standard' | 'accessory' | 'bundle'
      category = 'Shoe',
      sport = 'Road Running',
      gender = 'unisex',
      tags = [],
      costPrice = null,
      priceNumber,
      originalPrice = null,
      image,
      gallery = [],
      description = '',
      variants = [],
      color = '',
      colorHex = '',
      colorways = [],
      linkedColorways = [],
      relatedProducts = [],
      accessories = [],
      comboItems = [],
      comboPrice = null,
      weight = 850,
      returnPolicy = '7 Days Exchange',
      seo = {},
      features = [],
      hidden = false,
      featured = false,
    } = body;

    if (!name || !priceNumber) {
      return NextResponse.json({ error: 'Name and selling price are required' }, { status: 400 });
    }

    const parseNum = (val) => {
      if (val === null || val === undefined || val === '') return null;
      if (typeof val === 'number') return isNaN(val) ? null : val;
      const cleaned = Number(String(val).replace(/[^\d.]/g, ''));
      return isNaN(cleaned) ? null : cleaned;
    };

    const cleanPrice = parseNum(priceNumber) || 0;
    const cleanOriginalPrice = parseNum(originalPrice);
    const cleanCostPrice = parseNum(costPrice);
    const cleanSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const cleanSku = sku || `SNU-${cleanSlug.slice(0, 8).toUpperCase()}`;

    // Auto-calculate financial margins & discounts
    const discount = cleanOriginalPrice && cleanOriginalPrice > cleanPrice
      ? Math.round(((cleanOriginalPrice - cleanPrice) / cleanOriginalPrice) * 100)
      : 0;
    const margin = cleanCostPrice && cleanPrice > cleanCostPrice
      ? Math.round(((cleanPrice - cleanCostPrice) / cleanPrice) * 100)
      : null;

    // Build default size variants if none provided
    const DEFAULT_SIZES = ['UK 3', 'UK 4', 'UK 5', 'UK 6', 'UK 7', 'UK 8', 'UK 9', 'UK 10', 'UK 11'];
    const resolvedVariants = Array.isArray(variants) && variants.length > 0
      ? variants
      : DEFAULT_SIZES.map((sz) => ({
          size: sz,
          sku: `${cleanSku}-${sz.replace(/\s+/g, '')}`,
          stock: 12,
          priceOverride: null,
          active: true,
        }));

    const totalStock = resolvedVariants.reduce((sum, v) => sum + (v.active !== false ? Number(v.stock || 0) : 0), 0);
    const activeSizes = resolvedVariants.filter((v) => v.active !== false && Number(v.stock || 0) > 0).map((v) => v.size);

    const db = await initDb();

    // Check if slug already exists
    const existing = await db.collection('products').findOne({ slug: cleanSlug });
    if (existing) {
      return NextResponse.json({ error: 'A product with this identifier already exists' }, { status: 409 });
    }

    const mainImage = image || (gallery[0] || '');

    const newProduct = {
      id: cleanSlug,
      slug: cleanSlug,
      sku: cleanSku,
      name,
      brand: brand || '',
      role, // 'standard' | 'accessory' | 'bundle'
      category: category || '',
      sport: sport || '',
      gender: gender || '',
      tags: Array.isArray(tags) ? tags : [],
      costPrice: cleanCostPrice,
      price: `₹${cleanPrice.toLocaleString('en-IN')}`,
      priceNumber: cleanPrice,
      originalPrice: cleanOriginalPrice,
      discount,
      margin,
      image: mainImage,
      gallery: gallery.length > 0 ? gallery : (mainImage ? [mainImage] : []),
      alt: `${name} ${category}`.trim(),
      description: description || '',
      features: Array.isArray(features) ? features : [],
      variants: resolvedVariants,
      availableSizes: activeSizes,
      stockQuantity: totalStock,
      inStock: totalStock > 0,
      color: color || '',
      colorHex: colorHex || '',
      linkedColorways: Array.isArray(linkedColorways) ? linkedColorways : (Array.isArray(colorways) ? colorways : []),
      colorways: Array.isArray(linkedColorways) ? linkedColorways : (Array.isArray(colorways) ? colorways : []),
      relatedProducts: Array.isArray(relatedProducts) ? relatedProducts : [],
      accessories: Array.isArray(accessories) ? accessories : [],
      comboItems: Array.isArray(comboItems) ? comboItems : [],
      comboPrice: comboPrice ? Number(comboPrice) : null,
      shipping: {
        weight: weight ? Number(weight) : null,
        returnPolicy: returnPolicy || '',
      },
      seo: {
        metaTitle: seo?.metaTitle || '',
        metaDescription: seo?.metaDescription || '',
        keywords: Array.isArray(seo?.keywords) ? seo.keywords : [],
      },
      hidden: Boolean(hidden),
      featured: Boolean(featured),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.collection('products').insertOne(newProduct);

    return NextResponse.json({ success: true, product: newProduct });
  } catch (error) {
    console.error('[Admin Products POST Error]:', error);
    return NextResponse.json(
      { error: 'Failed to create product', details: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  try {
    const body = await request.json();
    const db = await initDb();

    const parseNum = (val) => {
      if (val === null || val === undefined || val === '') return null;
      if (typeof val === 'number') return isNaN(val) ? null : val;
      const cleaned = Number(String(val).replace(/[^\d.]/g, ''));
      return isNaN(cleaned) ? null : cleaned;
    };

    // Bulk update support
    if (Array.isArray(body.slugs) && body.slugs.length > 0) {
      const { slugs, ...updates } = body;
      if (updates.priceNumber !== undefined) {
        const priceNum = parseNum(updates.priceNumber) || 0;
        updates.priceNumber = priceNum;
        updates.price = `₹${priceNum.toLocaleString('en-IN')}`;
      }
      updates.updatedAt = new Date();
      await db.collection('products').updateMany(
        { $or: [{ slug: { $in: slugs } }, { id: { $in: slugs } }] },
        { $set: updates }
      );
      return NextResponse.json({ success: true, count: slugs.length, message: 'Products updated' });
    }

    const { slug, ...updates } = body;

    if (!slug) {
      return NextResponse.json({ error: 'Product slug is required' }, { status: 400 });
    }

    // Pricing & financial calculations
    if (updates.priceNumber !== undefined) {
      const priceNum = parseNum(updates.priceNumber) || 0;
      updates.priceNumber = priceNum;
      updates.price = `₹${priceNum.toLocaleString('en-IN')}`;
    }

    if (updates.originalPrice !== undefined) {
      updates.originalPrice = parseNum(updates.originalPrice);
    }

    if (updates.costPrice !== undefined) {
      updates.costPrice = parseNum(updates.costPrice);
    }

    if (updates.priceNumber !== undefined || updates.originalPrice !== undefined) {
      const p = updates.priceNumber !== undefined ? updates.priceNumber : null;
      const op = updates.originalPrice !== undefined ? updates.originalPrice : null;
      if (p && op && op > p) {
        updates.discount = Math.round(((op - p) / op) * 100);
      } else {
        updates.discount = 0;
      }
    }

    if (updates.priceNumber !== undefined || updates.costPrice !== undefined) {
      const p = updates.priceNumber !== undefined ? updates.priceNumber : null;
      const cp = updates.costPrice !== undefined ? updates.costPrice : null;
      if (p && cp && p > cp) {
        updates.margin = Math.round(((p - cp) / p) * 100);
      }
    }

    // Stock & variants rollup
    if (Array.isArray(updates.variants)) {
      const totalStock = updates.variants.reduce((sum, v) => sum + (v.active !== false ? Number(v.stock || 0) : 0), 0);
      updates.stockQuantity = totalStock;
      updates.availableSizes = updates.variants.filter((v) => v.active !== false && Number(v.stock || 0) > 0).map((v) => v.size);
      if (updates.inStock === undefined) {
        updates.inStock = totalStock > 0;
      }
    }

    updates.updatedAt = new Date();

    if (Array.isArray(updates.linkedColorways) || Array.isArray(updates.colorways)) {
      const linked = Array.isArray(updates.linkedColorways) ? updates.linkedColorways : updates.colorways;
      updates.linkedColorways = linked;
      updates.colorways = linked;

      // Bidirectional sync: link back to this product on siblings
      for (const siblingSlug of linked) {
        if (siblingSlug && siblingSlug !== slug) {
          await db.collection('products').updateOne(
            { $or: [{ slug: siblingSlug }, { id: siblingSlug }] },
            { $addToSet: { linkedColorways: slug, colorways: slug } }
          );
        }
      }
    }

    const result = await db.collection('products').updateOne(
      { $or: [{ slug }, { id: slug }] },
      { $set: updates }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Product updated successfully' });
  } catch (error) {
    console.error('[Admin Products PATCH Error]:', error);
    return NextResponse.json(
      { error: 'Failed to update product', details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    const slugsParam = searchParams.get('slugs');
    const all = searchParams.get('all');

    const db = await initDb();

    // Delete all products
    if (all === 'true') {
      const res = await db.collection('products').deleteMany({});
      return NextResponse.json({
        success: true,
        count: res.deletedCount,
        message: 'All products successfully deleted',
      });
    }

    // Bulk deletion support
    if (slugsParam) {
      const slugs = slugsParam.split(',').filter(Boolean);
      await db.collection('products').deleteMany({
        $or: [{ slug: { $in: slugs } }, { id: { $in: slugs } }],
      });
      return NextResponse.json({ success: true, count: slugs.length, message: 'Products deleted' });
    }

    if (!slug) {
      return NextResponse.json({ error: 'Product slug is required' }, { status: 400 });
    }

    const result = await db.collection('products').deleteOne({
      $or: [{ slug }, { id: slug }],
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Product deleted' });
  } catch (error) {
    console.error('[Admin Products DELETE Error]:', error);
    return NextResponse.json(
      { error: 'Failed to delete product', details: error.message },
      { status: 500 }
    );
  }
}
