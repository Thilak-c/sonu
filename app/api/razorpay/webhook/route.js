import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getDb } from '@/lib/mongodb';
import { createShiprocketOrder } from '@/lib/shiprocket';
import { sendOrderConfirmationEmail } from '@/lib/email';

export async function POST(request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-razorpay-signature');
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET || 'usK3zc5FrVqz83iZSL5YMEiJ';

    // Verify webhook signature if present
    if (signature && webhookSecret) {
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(rawBody)
        .digest('hex');

      if (expectedSignature !== signature) {
        console.warn('[Razorpay Webhook] Invalid webhook signature');
        return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 });
      }
    }

    const event = JSON.parse(rawBody);
    const db = await getDb();

    // Handle payment captured or order paid
    if (event.event === 'payment.captured' || event.event === 'order.paid') {
      const paymentEntity = event.payload?.payment?.entity;
      const orderEntity = event.payload?.order?.entity;
      const razorpayOrderId = paymentEntity?.order_id || orderEntity?.id;
      const razorpayPaymentId = paymentEntity?.id;

      if (razorpayOrderId) {
        const existingOrder = await db.collection('orders').findOne({
          $or: [
            { razorpayOrderId },
            { 'payment.razorpayOrderId': razorpayOrderId },
          ],
        });

        if (existingOrder && existingOrder.status !== 'CONFIRMED') {
          const isPartial = existingOrder.payment?.method === 'partial_cod';
          const updateData = {
            status: 'CONFIRMED',
            'payment.status': isPartial ? 'PARTIALLY_PAID' : 'PAID',
            'payment.razorpayPaymentId': razorpayPaymentId,
            updatedAt: new Date(),
          };

          await db.collection('orders').updateOne(
            { _id: existingOrder._id },
            { $set: updateData }
          );

          console.log(`[Razorpay Webhook] Order ${existingOrder.orderId} automatically confirmed via webhook.`);

          // Automatically push to Shiprocket if not yet created
          if (!existingOrder.shiprocket?.orderId) {
            try {
              const fullOrder = { ...existingOrder, ...updateData };
              const shipRes = await createShiprocketOrder(fullOrder);
              await db.collection('orders').updateOne(
                { _id: existingOrder._id },
                {
                  $set: {
                    shiprocket: {
                      orderId: shipRes.order_id,
                      shipmentId: shipRes.shipment_id,
                      status: shipRes.status || 'NEW',
                      awbCode: shipRes.awb_code || null,
                      courierName: shipRes.courier_name || null,
                      createdAt: new Date(),
                    },
                  },
                }
              );
            } catch (srErr) {
              console.warn('[Razorpay Webhook] Auto-shiprocket error:', srErr.message);
            }
          }

          // Send confirmation email
          if (existingOrder.customer?.email) {
            try {
              await sendOrderConfirmationEmail({ ...existingOrder, ...updateData });
            } catch (mailErr) {
              console.warn('[Razorpay Webhook] Email error:', mailErr.message);
            }
          }
        }
      }
    }

    return NextResponse.json({ status: 'ok', received: true });
  } catch (error) {
    console.error('[Razorpay Webhook Error]:', error);
    return NextResponse.json({ error: error.message || 'Webhook processing failed' }, { status: 500 });
  }
}

