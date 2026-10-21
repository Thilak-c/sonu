import { NextResponse } from 'next/server';
import { initDb } from '@/lib/mongodb';
import { FRESH_DROPS } from '@/components/home/freshDropsData';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');

    const db = await initDb();

    if (slug) {
      let product = await db.collection('products').findOne({ slug });
      if (!product) {
        // Fallback to static data if not found yet
        product = FRESH_DROPS.find((p) => p.slug === slug);
      }
      if (!product) {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, product });
    }

    const products = await db.collection('products').find({}).toArray();

    return NextResponse.json({
      success: true,
      count: products.length,
      products: products.length > 0 ? products : FRESH_DROPS,
    });
  } catch (error) {
    console.error('[MongoDB] Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve products from database' },
      { status: 500 }
    );
  }
}
