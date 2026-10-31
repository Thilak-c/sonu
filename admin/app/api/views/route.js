import { NextResponse } from 'next/server';
import { initDb } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const limit = Math.min(Number(searchParams.get('limit')) || 100, 200);

    const db = await initDb();
    const query = {};
    if (type) query.type = type;

    const [viewsList, totalViewsAgg] = await Promise.all([
      db.collection('views').find(query).sort({ count: -1 }).limit(limit).toArray(),
      db.collection('views').aggregate([
        { $group: { _id: null, totalViews: { $sum: '$count' } } },
      ]).toArray(),
    ]);

    const totalViews = totalViewsAgg[0]?.totalViews || 0;

    return NextResponse.json({
      success: true,
      totalViews,
      count: viewsList.length,
      views: viewsList,
    });
  } catch (error) {
    console.error('[Admin Views API GET Error]:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch views' },
      { status: 500 }
    );
  }
}

