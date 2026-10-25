import { NextResponse } from 'next/server';
import { initDb } from '@/lib/mongodb';
import { requestShiprocketPickup, generateShiprocketLabel } from '@/lib/shiprocket';

export const dynamic = 'force-dynamic';

export async function POST(request, context) {
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

    const shipmentId = order.shiprocket?.shipmentId;
    if (!shipmentId) {
      return NextResponse.json(
        { error: 'Order does not have a linked Shiprocket shipment ID' },
        { status: 400 }
      );
    }

    // 1. Request pickup from Shiprocket
    const pickupResult = await requestShiprocketPickup(shipmentId);

    // 2. Generate shipping label PDF link
    let labelResult = null;
    try {
      labelResult = await generateShiprocketLabel(shipmentId);
    } catch (lblErr) {
      console.warn('Label generation notice:', lblErr.message);
    }

    const updateDoc = {
      fulfillmentStatus: 'pickup_scheduled',
      'shiprocket.status': 'PICKUP_SCHEDULED',
      'shiprocket.pickupToken': pickupResult.pickupToken,
      'shiprocket.pickupScheduledDate': pickupResult.pickupScheduledDate,
      'shiprocket.pickupScheduledAt': new Date(),
      'shiprocket.labelUrl': labelResult?.labelUrl || null,
      updatedAt: new Date(),
    };

    await db.collection('orders').updateOne(
      { orderId },
      { $set: updateDoc }
    );

    const updatedOrder = await db.collection('orders').findOne({ orderId });

    return NextResponse.json({
      success: true,
      message: 'Shiprocket pickup scheduled successfully',
      pickupToken: pickupResult.pickupToken,
      pickupDate: pickupResult.pickupScheduledDate,
      labelUrl: labelResult?.labelUrl,
      order: updatedOrder,
    });
  } catch (error) {
    console.error('[Request Pickup API Error]:', error);
    return NextResponse.json(
      { error: 'Failed to schedule pickup', details: error.message },
      { status: 500 }
    );
  }
}
