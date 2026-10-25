import { NextResponse } from 'next/server';
import { initDb } from '@/lib/mongodb';
import { trackShiprocketOrder } from '@/lib/shiprocket';

export const dynamic = 'force-dynamic';

export async function GET(request, context) {
  try {
    const params = await context.params;
    const orderId = params.id;

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    const db = await initDb();
    const order = await db.collection('orders').findOne({ orderId });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const awbCode = order.shiprocket?.awbCode;
    const shipmentId = order.shiprocket?.shipmentId;
    const srOrderId = order.shiprocket?.orderId;

    if (!awbCode && !shipmentId && !srOrderId) {
      return NextResponse.json(
        { error: 'No Shiprocket tracking parameters found' },
        { status: 400 }
      );
    }

    const trackingData = await trackShiprocketOrder({
      awbCode,
      shipmentId,
      orderId: srOrderId,
    });

    return NextResponse.json({
      success: true,
      tracking: trackingData,
    });
  } catch (error) {
    console.error('[Track Order API Error]:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve tracking', details: error.message },
      { status: 500 }
    );
  }
}
