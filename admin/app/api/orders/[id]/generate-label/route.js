import { NextResponse } from 'next/server';
import { initDb } from '@/lib/mongodb';
import { generateShiprocketLabel } from '@/lib/shiprocket';

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
        { error: 'Shipment has not been registered on Shiprocket yet' },
        { status: 400 }
      );
    }

    const labelResult = await generateShiprocketLabel(shipmentId);

    if (labelResult?.labelUrl) {
      await db.collection('orders').updateOne(
        { orderId },
        {
          $set: {
            'shiprocket.labelUrl': labelResult.labelUrl,
            updatedAt: new Date(),
          },
        }
      );

      return NextResponse.json({
        success: true,
        labelUrl: labelResult.labelUrl,
      });
    }

    return NextResponse.json(
      {
        error: labelResult?.message || labelResult?.error || 'Failed to generate label from Shiprocket',
      },
      { status: 502 }
    );
  } catch (err) {
    console.error(`[Generate Label Error for order]:`, err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

