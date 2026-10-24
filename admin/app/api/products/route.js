import { NextResponse } from 'next/server';
import { initDb } from '@/lib/mongodb';
import { FRESH_DROPS } from '@/lib/initialProducts';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = await initDb();
    let products = await db.collection('products').find({}).sort({ createdAt: -1 }).toArray();

    if (products.length === 0) {
      const now = new Date();
      await db.collection('products').insertMany(
        FRESH_DROPS.map((p) => ({ ...p, createdAt: now, updatedAt: now }))
      );
      products = await db.collection('products').find({}).sort({ createdAt: -1 }).toArray();
    }

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
      category,
      priceNumber,
      image,
      gallery = [],
      description = '',
      colorways = [],
      availableSizes = ['UK 3', 'UK 4', 'UK 5', 'UK 6', 'UK 7', 'UK 8', 'UK 9'],
      features = [],
      inStock = true,
    } = body;

    if (!name || !priceNumber) {
      return NextResponse.json({ error: 'Name and price are required' }, { status: 400 });
    }

    const cleanSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const cleanPrice = Number(priceNumber);

    const db = await initDb();

    // Check if slug already exists
    const existing = await db.collection('products').findOne({ slug: cleanSlug });
    if (existing) {
      return NextResponse.json({ error: 'A product with this slug already exists' }, { status: 409 });
    }

    const newProduct = {
      id: cleanSlug,
      slug: cleanSlug,
      name,
      category: category || "Footwear",
      price: `₹${cleanPrice.toLocaleString('en-IN')}`,
      priceNumber: cleanPrice,
      image: image || '/images/ad22b92Nike-HQ2593-502_1.avif',
      gallery: gallery.length > 0 ? gallery : [image || '/images/ad22b92Nike-HQ2593-502_1.avif'],
      alt: `${name} ${category}`,
      colorways: colorways.length > 0 ? colorways : ['Signature Tone'],
      description: description || 'Handcrafted small-run sneaker engineered with ergonomic comfort soles.',
      features: features.length > 0 ? features : ['Dual-density high-rebound cushioning', 'Premium vulcanized gum rubber sole'],
      availableSizes: availableSizes.length > 0 ? availableSizes : ['UK 3', 'UK 4', 'UK 5', 'UK 6', 'UK 7', 'UK 8', 'UK 9'],
      inStock: Boolean(inStock),
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
    const { slug, ...updates } = body;

    if (!slug) {
      return NextResponse.json({ error: 'Product slug is required' }, { status: 400 });
    }

    const db = await initDb();

    if (updates.priceNumber !== undefined) {
      const priceNum = Number(updates.priceNumber);
      updates.priceNumber = priceNum;
      updates.price = `₹${priceNum.toLocaleString('en-IN')}`;
    }

    updates.updatedAt = new Date();

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

    if (!slug) {
      return NextResponse.json({ error: 'Product slug is required' }, { status: 400 });
    }

    const db = await initDb();
    const result = await db.collection('products').deleteOne({
      $or: [{ slug }, { id: slug }],
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Product deleted from MongoDB' });
  } catch (error) {
    console.error('[Admin Products DELETE Error]:', error);
    return NextResponse.json(
      { error: 'Failed to delete product', details: error.message },
      { status: 500 }
    );
  }
}
