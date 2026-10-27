import { NextResponse } from 'next/server';
import { initDb } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = await initDb();

    // 1. Orders Stats
    const orders = await db.collection('orders').find({}).sort({ createdAt: -1 }).toArray();
    const totalOrders = orders.length;

    const totalRevenue = orders.reduce((sum, ord) => {
      const amt = Number(ord.totalAmount) || 0;
      return sum + amt;
    }, 0);

    const paidOrders = orders.filter((o) => o.paymentStatus === 'paid' || o.razorpayPaymentId).length;

    // 2. Products Stats
    const productCount = await db.collection('products').countDocuments();
    const inStockCount = await db.collection('products').countDocuments({ inStock: { $ne: false } });

    // 3. Customers Stats
    const totalCustomers = await db.collection('users').countDocuments();

    // 4. Recent 5 orders for dashboard
    const recentOrders = orders.slice(0, 6);

    return NextResponse.json({
      success: true,
      stats: {
        totalRevenue,
        totalOrders,
        paidOrders,
        productCount,
        inStockCount,
        totalCustomers,
      },
      recentOrders,
    });
  } catch (error) {
    console.error('[Admin Stats API Error]:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve admin stats', details: error.message },
      { status: 500 }
    );
  }
}
