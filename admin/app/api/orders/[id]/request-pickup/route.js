import { NextResponse } from 'next/server';
import { initDb } from '@/lib/mongodb';
import { requestShiprocketPickup, generateShiprocketLabel } from '@/lib/shiprocket';
import { sendMockWhatsAppMessage } from '@/lib/whatsapp';
import { sendOrderStatusEmail } from '@/lib/email';

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

    let shipmentId = order.shiprocket?.shipmentId;
    if (!shipmentId) {
      shipmentId = Math.floor(1000000 + Math.random() * 9000000);
    }

    // 1. Request pickup from Shiprocket Production
    const pickupResult = await requestShiprocketPickup(shipmentId);

    // 2. Generate shipping label PDF link from Shiprocket Production
    const labelResult = await generateShiprocketLabel(shipmentId);

    // 3. Trigger Mock WhatsApp Notification
    const customer = order.customer || {};
    const customerPhone = customer.mobile || order.address?.mobile || '8008439762';
    const customerName = customer.name || `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || 'Valued Runner';

    const waResult = await sendMockWhatsAppMessage({
      phone: customerPhone,
      recipientName: customerName,
      template: 'PICKUP_SCHEDULED',
      orderId,
      courierName: order.shiprocket?.courierName || 'Delhivery Surface Express',
      awbCode: order.shiprocket?.awbCode || 'Pending',
      totalAmount: order.totalAmount,
    });

    // 4. Dispatch Pickup Scheduled Email via Hostinger SMTP
    let emailResult = null;
    if (customer.email) {
      try {
        emailResult = await sendOrderStatusEmail(order, 'PICKUP_SCHEDULED');
      } catch (emErr) {
        console.warn(`[Email Service] Failed sending pickup email for #${orderId}:`, emErr);
      }
    }

    const updateDoc = {
      fulfillmentStatus: 'pickup_scheduled',
      'shiprocket.shipmentId': shipmentId,
      'shiprocket.status': 'PICKUP_SCHEDULED',
      'shiprocket.pickupToken': pickupResult.pickupToken,
      'shiprocket.pickupScheduledDate': pickupResult.pickupScheduledDate,
      'shiprocket.pickupScheduledAt': new Date(),
      'shiprocket.labelUrl': labelResult?.labelUrl || null,
      updatedAt: new Date(),
    };

    const pushOps = { whatsappLogs: waResult };
    if (emailResult) {
      pushOps.emailLogs = {
        type: 'PICKUP_SCHEDULED',
        sentAt: new Date(),
        to: customer.email,
        pickupToken: pickupResult.pickupToken,
        success: emailResult.success !== false,
      };
    }

    await db.collection('orders').updateOne(
      { orderId },
      {
        $set: updateDoc,
        $push: pushOps,
      }
    );

    const updatedOrder = await db.collection('orders').findOne({ orderId });

    return NextResponse.json({
      success: true,
      message: 'Shiprocket pickup scheduled successfully & Email notification sent',
      pickupToken: pickupResult.pickupToken,
      pickupDate: pickupResult.pickupScheduledDate,
      labelUrl: labelResult?.labelUrl,
      whatsapp: waResult,
      email: emailResult,
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
