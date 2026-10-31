import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

function getDocId(path = '/', type = 'page', identifier = '') {
  const cleanPath = (path || '/').split('?')[0].toLowerCase().trim() || '/';

  if (cleanPath === '/' || type === 'home') {
    return 'home';
  }

  if (type === 'product' && identifier) {
    return `product:${identifier.toLowerCase().trim()}`;
  }

  if (cleanPath.startsWith('/product/')) {
    const slug = cleanPath.replace('/product/', '').replace(/\/$/, '');
    return `product:${slug}`;
  }

  if (type === 'category' && identifier) {
    return `category:${identifier.toLowerCase().trim()}`;
  }

  if (cleanPath.startsWith('/category/')) {
    const slug = cleanPath.replace('/category/', '').replace(/\/$/, '');
    return `category:${slug}`;
  }

  return `path:${cleanPath}`;
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const path = (body.path || '/').split('?')[0];
    const type = body.type || (path === '/' ? 'home' : path.startsWith('/product/') ? 'product' : path.startsWith('/category/') || path === '/running' || path === '/sneakers' ? 'category' : 'page');
    const identifier = body.identifier || (type === 'product' ? path.replace('/product/', '') : type === 'category' ? path.replace('/category/', '') : '');
    const title = (body.title || '').trim();

    const docId = getDocId(path, type, identifier);
    const db = await getDb();

    // Dedicated 'views' collection in MongoDB
    const result = await db.collection('views').findOneAndUpdate(
      { _id: docId },
      {
        $inc: { count: 1, views: 1 },
        $set: {
          path,
          type,
          identifier: identifier || docId,
          title: title || (type === 'home' ? 'Homepage' : identifier),
          lastViewedAt: new Date(),
        },
        $setOnInsert: {
          createdAt: new Date(),
        },
      },
      { upsert: true, returnDocument: 'after' }
    );

    const doc = result?.value || result;
    const views = doc?.count || doc?.views || 1;

    return NextResponse.json({
      success: true,
      id: docId,
      views,
      count: views,
    });
  } catch (error) {
    console.error('[Views API POST Error]:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to record view' },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path');
    const type = searchParams.get('type');
    const identifier = searchParams.get('identifier');
    const limit = Math.min(Number(searchParams.get('limit')) || 50, 100);

    const db = await getDb();

    // Query single page/product view count
    if (path || identifier || type === 'home') {
      const docId = getDocId(path, type, identifier);
      const doc = await db.collection('views').findOne({ _id: docId });
      const views = doc?.count || doc?.views || 0;

      return NextResponse.json({
        success: true,
        id: docId,
        views,
        count: views,
        doc,
      });
    }

    // Query list of views
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
    console.error('[Views API GET Error]:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch views' },
      { status: 500 }
    );
  }
}

