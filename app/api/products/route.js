import { NextResponse } from 'next/server';
import { initDb } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');

    const db = await initDb();
    if (!db) {
      return NextResponse.json({ success: false, error: 'Database unavailable' }, { status: 500 });
    }

    if (slug) {
      const queries = [{ slug }, { itemId: slug }, { sku: slug }];
      if (ObjectId.isValid(slug)) {
        queries.push({ _id: new ObjectId(slug) });
      }
      const product = await db.collection('products').findOne({ $or: queries });
      if (!product) {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, product });
    }

    const products = await db
      .collection('products')
      .find({ hidden: { $ne: true } })
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    console.error('[MongoDB] Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve products from database' },
      { status: 500 }
    );
  }
}
