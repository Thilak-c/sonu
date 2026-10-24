import { NextResponse } from 'next/server';
import { initDb } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = await initDb();
    const customers = await db.collection('users').find({}).sort({ updatedAt: -1 }).toArray();

    // Augment with order metrics if available
    const orders = await db.collection('orders').find({}).toArray();

    const customerList = customers.map((c) => {
      const userOrders = orders.filter(
        (o) =>
          (c.email && o.customer?.email?.toLowerCase() === c.email.toLowerCase()) ||
          (c.mobile && o.customer?.mobile === c.mobile)
      );

      const totalSpent = userOrders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);

      return {
        ...c,
        orderCount: userOrders.length,
        totalSpent,
        lastOrderDate: userOrders[0]?.createdAt || userOrders[0]?.placedAt || c.updatedAt,
      };
    });

    return NextResponse.json({ success: true, count: customerList.length, customers: customerList });
  } catch (error) {
    console.error('[Admin Customers GET Error]:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customers', details: error.message },
      { status: 500 }
    );
  }
}
