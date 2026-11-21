import { NextResponse } from 'next/server';
import { initDb } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import {
  cancelShiprocketAwb,
  cancelShiprocketOrder,
  createShiprocketOrder,
  assignShiprocketAWB,
  requestShiprocketPickup,
  generateShiprocketLabel,
  generateShiprocketManifest,
} from '@/lib/shiprocket';

export const dynamic = 'force-dynamic';

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    const db = await initDb();
    let query = { orderId: id };
    if (ObjectId.isValid(id) && String(new ObjectId(id)) === id) {
      query = { $or: [{ orderId: id }, { _id: new ObjectId(id) }] };
    }

    const order = await db.collection('orders').findOne(query);
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const previousAwb = order.shiprocket?.awbCode || null;
    const previousSrOrderId = order.shiprocket?.orderId || null;

    // 1. Cancel previous AWB / Shipment in Shiprocket if present
    if (previousAwb) {
      try {
        console.log(`[Replace Shipment] Cancelling existing AWB ${previousAwb} for order #${order.orderId}...`);
        await cancelShiprocketAwb(previousAwb);
      } catch (cancelAwbErr) {
        console.warn(`[Replace Shipment] Warning while cancelling AWB ${previousAwb}:`, cancelAwbErr.message);
      }
    }

    if (previousSrOrderId) {
      try {
        console.log(`[Replace Shipment] Cancelling existing Shiprocket Order ${previousSrOrderId}...`);
        await cancelShiprocketOrder(previousSrOrderId);
      } catch (cancelSrErr) {
        console.warn(`[Replace Shipment] Warning while cancelling Shiprocket order:`, cancelSrErr.message);
      }
    }

    // 2. Prepare refreshed order payload for Shiprocket
    // Ensure channelOrderId is unique with a replacement tag so Shiprocket creates a clean new shipment
    const replacementTag = `-R${Date.now().toString().slice(-4)}`;
    const freshOrderPayload = {
      ...order,
      orderId: `${order.orderId}${replacementTag}`,
      originalOrderId: order.orderId,
    };

    console.log(`[Replace Shipment] Creating fresh Shiprocket order for #${order.orderId} (Channel: ${freshOrderPayload.orderId})...`);
    const srOrderRes = await createShiprocketOrder(freshOrderPayload);
    const newSrOrderId = srOrderRes.order_id;
    const newShipmentId = srOrderRes.shipment_id;

    if (!newShipmentId) {
      throw new Error(srOrderRes.message || 'Failed to obtain fresh shipment ID from Shiprocket');
    }

    // 3. Auto-assign the best available Surface courier
    console.log(`[Replace Shipment] Auto-assigning Surface courier for shipment ${newShipmentId}...`);
    const awbRes = await assignShiprocketAWB(newShipmentId, null, order);
    const newAwbCode = awbRes.awbCode;

    // 4. Request courier pickup (today or next working day)
    const pickupDateStr = new Date().toISOString().split('T')[0];
    let pickupRes = { pickupToken: 'SCHEDULED', pickupScheduledDate: pickupDateStr };
    try {
      pickupRes = await requestShiprocketPickup(newShipmentId, pickupDateStr);
    } catch (pickupErr) {
      console.warn(`[Replace Shipment] Warning during pickup generation:`, pickupErr.message);
    }

    // 5. Generate fresh shipping label & manifest if available
    let labelUrl = null;
    try {
      const labelRes = await generateShiprocketLabel(newShipmentId);
      labelUrl = labelRes.labelUrl || null;
    } catch (labelErr) {
      console.warn(`[Replace Shipment] Label generation pending:`, labelErr.message);
    }

    let manifestUrl = null;
    try {
      const manifestRes = await generateShiprocketManifest(newShipmentId);
      manifestUrl = manifestRes.manifestUrl || null;
    } catch (manifestErr) {
      console.warn(`[Replace Shipment] Manifest generation pending:`, manifestErr.message);
    }

    // 6. Persist updated shipping data into MongoDB
    const updatedShiprocket = {
      orderId: newSrOrderId,
      shipmentId: newShipmentId,
      channelOrderId: srOrderRes.channel_order_id || freshOrderPayload.orderId,
      awbCode: newAwbCode,
      courierName: awbRes.courierName,
      courierCompanyId: awbRes.courierCompanyId,
      routingCode: awbRes.routingCode || null,
      rate: awbRes.rate || null,
      pickupToken: pickupRes.pickupToken || 'SCHEDULED',
      pickupScheduledDate: pickupRes.pickupScheduledDate || pickupDateStr,
      pickupDate: pickupRes.pickupScheduledDate || pickupDateStr,
      pickupLocationName: 'Patna One Plaza Hub',
      labelUrl,
      manifestUrl,
      status: 'PICKUP SCHEDULED',
      currentStatus: 'PICKUP SCHEDULED',
      pickupExceptionReason: null,
      previousAwb,
      replacedAt: new Date(),
      lastSyncedAt: new Date(),
    };

    const updateFields = {
      shiprocket: updatedShiprocket,
      trackingNumber: newAwbCode,
      fulfillmentStatus: 'pickup_scheduled',
      updatedAt: new Date(),
    };

    await db.collection('orders').updateOne(
      { orderId: order.orderId },
      {
        $set: updateFields,
        $push: {
          timeline: {
            status: 'shipment_replaced',
            title: 'Shipment Cancelled & Replaced',
            description: `Previous shipment (${previousAwb ? 'AWB: ' + previousAwb : 'None'}) cancelled. Assigned new ${awbRes.courierName} shipment (AWB: ${newAwbCode}). Scheduled pickup: ${pickupRes.pickupScheduledDate || pickupDateStr}.`,
            timestamp: new Date(),
          },
        },
      }
    );

    const refreshedOrder = await db.collection('orders').findOne({ orderId: order.orderId });

    return NextResponse.json({
      success: true,
      message: `Shipment replaced successfully with new ${awbRes.courierName} AWB ${newAwbCode}`,
      order: refreshedOrder,
      awbCode: newAwbCode,
      courierName: awbRes.courierName,
    });
  } catch (error) {
    console.error('[Replace Shipment Error]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to replace shipment order' },
      { status: 500 }
    );
  }
}
