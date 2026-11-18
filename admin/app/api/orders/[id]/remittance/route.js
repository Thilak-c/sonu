import { NextResponse } from 'next/server';
import { initDb } from '@/lib/mongodb';
import { getShiprocketRemittanceDetails } from '@/lib/shiprocket';

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

    const srOrderId = order.shiprocket?.orderId;
    if (!srOrderId) {
      return NextResponse.json({
        success: false,
        message: 'No Shiprocket order registration found for this order',
      }, { status: 400 });
    }

    const remittance = await getShiprocketRemittanceDetails(srOrderId);

    // Cache remittance details in MongoDB
    await db.collection('orders').updateOne(
      { orderId },
      {
        $set: {
          'shiprocket.remittance': remittance,
          'shiprocket.remittanceStatus': remittance.remittanceStatus,
          'shiprocket.remittanceUtr': remittance.remittanceUtr,
          'shiprocket.remittanceDate': remittance.remittanceDate,
          'shiprocket.lastSyncedAt': new Date(),
        },
      }
    );

    return NextResponse.json({
      success: true,
      orderId,
      remittance,
    });
  } catch (error) {
    console.error('[Remittance API Error]:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve remittance details', details: error.message },
      { status: 500 }
    );
  }
}
