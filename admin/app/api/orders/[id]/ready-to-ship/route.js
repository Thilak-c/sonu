import { NextResponse } from 'next/server';
import { initDb } from '@/lib/mongodb';
import { assignShiprocketAWB } from '@/lib/shiprocket';

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

    // Call Shiprocket to assign courier & generate AWB
    const awbResult = await assignShiprocketAWB(shipmentId);

    const updateDoc = {
      fulfillmentStatus: 'ready_to_ship',
      'shiprocket.status': 'READY_TO_SHIP',
      'shiprocket.awbCode': awbResult.awbCode,
      'shiprocket.courierName': awbResult.courierName,
      'shiprocket.courierCompanyId': awbResult.courierCompanyId,
      'shiprocket.routingCode': awbResult.routingCode,
      'shiprocket.awbAssignedAt': new Date(),
      'shiprocket.isSimulated': !!awbResult.isSimulated,
      updatedAt: new Date(),
    };

    await db.collection('orders').updateOne(
      { orderId },
      { $set: updateDoc }
    );

    const updatedOrder = await db.collection('orders').findOne({ orderId });

    return NextResponse.json({
      success: true,
      message: 'Order marked as Ready to Ship & AWB assigned',
      awbCode: awbResult.awbCode,
      courierName: awbResult.courierName,
      order: updatedOrder,
    });
  } catch (error) {
    console.error('[Ready To Ship API Error]:', error);
    return NextResponse.json(
      { error: 'Failed to assign AWB', details: error.message },
      { status: 500 }
    );
  }
}
