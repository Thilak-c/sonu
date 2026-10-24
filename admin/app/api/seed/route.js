import { NextResponse } from 'next/server';
import { initDb } from '@/lib/mongodb';
import { FRESH_DROPS } from '@/lib/initialProducts';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const db = await initDb();
    const now = new Date();

    // Upsert all default fresh drops
    for (const drop of FRESH_DROPS) {
      await db.collection('products').updateOne(
        { slug: drop.slug },
        {
          $set: {
            ...drop,
            updatedAt: now,
          },
          $setOnInsert: {
            createdAt: now,
          },
        },
        { upsert: true }
      );
    }

    const count = await db.collection('products').countDocuments();

    return NextResponse.json({
      success: true,
      message: `Successfully synced ${FRESH_DROPS.length} default products into MongoDB`,
      totalProducts: count,
    });
  } catch (error) {
    console.error('[Admin Seed Error]:', error);
    return NextResponse.json(
      { error: 'Failed to seed products into database', details: error.message },
      { status: 500 }
    );
  }
}
