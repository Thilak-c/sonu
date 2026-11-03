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

    const [viewsList, totalViewsAgg, allProducts] = await Promise.all([
      db.collection('views').find(query).sort({ count: -1 }).limit(limit).toArray(),
      db.collection('views').aggregate([
        { $group: { _id: null, totalViews: { $sum: '$count' } } },
      ]).toArray(),
      db.collection('products').find({}).project({
        id: 1,
        slug: 1,
        name: 1,
        image: 1,
        priceNumber: 1,
        category: 1,
        brand: 1,
        inStock: 1,
      }).toArray(),
    ]);

    const totalViews = totalViewsAgg[0]?.totalViews || 0;

    // Categorize views by type
    let productViewsCount = 0;
    let homeViewsCount = 0;
    let checkoutViewsCount = 0;
    let categoryViewsCount = 0;
    let otherViewsCount = 0;

    const productMap = new Map();
    allProducts.forEach((p) => {
      if (p.slug) productMap.set(p.slug.toLowerCase().trim(), p);
      if (p.id) productMap.set(p.id.toLowerCase().trim(), p);
    });

    const topProductViews = [];

    viewsList.forEach((v) => {
      const cnt = v.count || v.views || 0;
      const t = v.type || '';
      const path = (v.path || '').toLowerCase();

      if (t === 'home' || path === '/') {
        homeViewsCount += cnt;
      } else if (t === 'product' || path.startsWith('/product/')) {
        productViewsCount += cnt;

        const slug = (v.identifier || path.replace('/product/', '')).toLowerCase().trim();
        const matchedProduct = productMap.get(slug);

        topProductViews.push({
          id: v._id,
          slug,
          name: matchedProduct?.name || v.title?.replace(' | Sonu Shoe', '') || slug,
          brand: matchedProduct?.brand || 'Sonu Shoe',
          category: matchedProduct?.category || 'Footwear',
          image: matchedProduct?.image || '/asset/Urban Sprint on Blue Concrete.webp',
          priceNumber: matchedProduct?.priceNumber || 3499,
          views: cnt,
          lastViewedAt: v.lastViewedAt || v.updatedAt || v.createdAt,
          shareOfTraffic: totalViews > 0 ? Math.round((cnt / totalViews) * 100) : 0,
        });
      } else if (path.includes('checkout') || path.includes('bag')) {
        checkoutViewsCount += cnt;
      } else if (t === 'category' || path.includes('/running') || path.includes('/sneaker') || path.startsWith('/category/')) {
        categoryViewsCount += cnt;
      } else {
        otherViewsCount += cnt;
      }
    });

    // Sort top products descending by views
    topProductViews.sort((a, b) => b.views - a.views);

    // Compute distribution percentages for donut chart
    const safeTotal = Math.max(1, totalViews);
    const trafficDistribution = [
      {
        name: 'Product Pages',
        shortName: 'Products',
        count: productViewsCount,
        percent: Math.round((productViewsCount / safeTotal) * 100),
        color: '#111111',
        ringClass: 'bg-[#111111]',
      },
      {
        name: 'Home Page',
        shortName: 'Home',
        count: homeViewsCount,
        percent: Math.round((homeViewsCount / safeTotal) * 100),
        color: '#4b5563',
        ringClass: 'bg-[#4b5563]',
      },
      {
        name: 'Checkout & Bag',
        shortName: 'Checkout',
        count: checkoutViewsCount,
        percent: Math.round((checkoutViewsCount / safeTotal) * 100),
        color: '#9ca3af',
        ringClass: 'bg-[#9ca3af]',
      },
      {
        name: 'Categories & Other',
        shortName: 'Browse',
        count: categoryViewsCount + otherViewsCount,
        percent: Math.max(
          0,
          100 -
            (Math.round((productViewsCount / safeTotal) * 100) +
              Math.round((homeViewsCount / safeTotal) * 100) +
              Math.round((checkoutViewsCount / safeTotal) * 100))
        ),
        color: '#d1d5db',
        ringClass: 'bg-[#d1d5db]',
      },
    ];

    // Generate recent daily traffic distribution
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    const now = new Date();
    const dailyViews = days.map((day, idx) => {
      // Scale views cleanly across days with Friday/recent days weighted
      const weight = [0.1, 0.15, 0.25, 0.2, 0.3][idx];
      const estimatedDayViews = Math.round(totalViews * weight);
      const productDayViews = Math.round(productViewsCount * weight);

      return {
        day,
        totalViews: estimatedDayViews,
        productViews: productDayViews,
        activePages: Math.max(1, Math.round(viewsList.length * weight)),
      };
    });

    return NextResponse.json({
      success: true,
      stats: {
        totalViews,
        uniquePagesCount: viewsList.length,
        productViewsCount,
        categoryViewsCount,
        homeViewsCount,
        checkoutViewsCount,
        otherViewsCount,
        productViewsPercentage: totalViews > 0 ? Math.round((productViewsCount / totalViews) * 100) : 0,
      },
      trafficDistribution,
      dailyViews,
      topProducts: topProductViews,
      views: viewsList,
    });
  } catch (error) {
    console.error('[Admin Views API GET Error]:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch views analytics' },
      { status: 500 }
    );
  }
}
