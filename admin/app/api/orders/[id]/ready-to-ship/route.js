import { NextResponse } from 'next/server';
import { initDb } from '@/lib/mongodb';
import { assignShiprocketAWB } from '@/lib/shiprocket';
import { sendMockWhatsAppMessage } from '@/lib/whatsapp';
import { sendShippingNotificationEmail } from '@/lib/email';

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

    // Call Shiprocket Production to assign courier & generate real AWB
    const awbResult = await assignShiprocketAWB(shipmentId);

    // Trigger Mock WhatsApp notification
    const customer = order.customer || {};
    const customerPhone = customer.mobile || order.address?.mobile || '8008439762';
    const customerName = customer.name || `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || 'Valued Runner';

    const waResult = await sendMockWhatsAppMessage({
      phone: customerPhone,
      recipientName: customerName,
      template: 'READY_TO_SHIP',
      orderId,
      courierName: awbResult.courierName,
      awbCode: awbResult.awbCode,
      totalAmount: order.totalAmount,
    });

    // Dispatch Shipping Notification Email via Hostinger SMTP
    let emailResult = null;
    if (customer.email) {
      try {
        emailResult = await sendShippingNotificationEmail(order, awbResult.awbCode, awbResult.courierName);
      } catch (emErr) {
        console.warn(`[Email Service] Failed sending shipping email for #${orderId}:`, emErr);
      }
    }

    const updateDoc = {
      fulfillmentStatus: 'ready_to_ship',
      'shiprocket.shipmentId': shipmentId,
      'shiprocket.status': 'READY_TO_SHIP',
      'shiprocket.awbCode': awbResult.awbCode,
      'shiprocket.courierName': awbResult.courierName,
      'shiprocket.courierCompanyId': awbResult.courierCompanyId,
      'shiprocket.routingCode': awbResult.routingCode,
      'shiprocket.awbAssignedAt': new Date(),
      'shiprocket.isSimulated': false,
      updatedAt: new Date(),
    };

    const pushOps = { whatsappLogs: waResult };
    if (emailResult) {
      pushOps.emailLogs = {
        type: 'READY_TO_SHIP',
        sentAt: new Date(),
        to: customer.email,
        awbCode: awbResult.awbCode,
        courier: awbResult.courierName,
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
      message: 'Order marked as Ready to Ship, AWB assigned, and Email & Notification sent',
      awbCode: awbResult.awbCode,
      courierName: awbResult.courierName,
      whatsapp: waResult,
      email: emailResult,
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
