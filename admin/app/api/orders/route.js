import { NextResponse } from 'next/server';
import { initDb } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const query = searchParams.get('q');

    const db = await initDb();
    const filter = {};

    if (status && status !== 'all') {
      if (status === 'pending') {
        filter.$or = [
          { fulfillmentStatus: 'pending' },
          { fulfillmentStatus: 'unfulfilled' },
          { fulfillmentStatus: null },
          { fulfillmentStatus: { $exists: false } },
        ];
      } else {
        filter.fulfillmentStatus = status;
      }
    }

    if (query) {
      const q = query.trim();
      filter.$or = [
        { orderId: { $regex: q, $options: 'i' } },
        { 'customer.name': { $regex: q, $options: 'i' } },
        { 'customer.mobile': { $regex: q, $options: 'i' } },
        { 'customer.email': { $regex: q, $options: 'i' } },
      ];
    }

    const orders = await db
      .collection('orders')
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(100)
      .toArray();

    return NextResponse.json({ success: true, count: orders.length, orders });
  } catch (error) {
    console.error('[Admin Orders GET Error]:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders from MongoDB', details: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  try {
    const body = await request.json();
    const { orderId, fulfillmentStatus, trackingNumber, internalNote } = body;

    if (!orderId) {
      return NextResponse.json({ error: 'orderId is required' }, { status: 400 });
    }

    const db = await initDb();
    const updateFields = {
      updatedAt: new Date(),
    };

    if (fulfillmentStatus) updateFields.fulfillmentStatus = fulfillmentStatus;
    if (trackingNumber !== undefined) updateFields.trackingNumber = trackingNumber;
    if (internalNote !== undefined) updateFields.internalNote = internalNote;

    const result = await db.collection('orders').updateOne(
      { orderId },
      { $set: updateFields }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Order updated successfully' });
  } catch (error) {
    console.error('[Admin Orders PATCH Error]:', error);
    return NextResponse.json(
      { error: 'Failed to update order in MongoDB', details: error.message },
      { status: 500 }
    );
  }
}
