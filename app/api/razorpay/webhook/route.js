import { NextResponse } from 'next/server';
import { initDb } from '@/lib/mongodb';
import { createShiprocketOrder } from '@/lib/shiprocket';
import { sendOrderConfirmationEmail } from '@/lib/email';
import { verifyWebhookSignature, getRazorpayCredentials, captureRazorpayPayment } from '@/lib/razorpay';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-razorpay-signature');

    let webhookSecret = (process.env.RAZORPAY_WEBHOOK_SECRET || '').trim();
    if (!webhookSecret) {
      try {
        const creds = getRazorpayCredentials();
        webhookSecret = creds.keySecret;
      } catch (e) {
        // Fallback
      }
    }

    // 1. Strict Cryptographic Signature Verification
    if (signature && webhookSecret) {
      const isValid = verifyWebhookSignature(rawBody, signature, webhookSecret);
      if (!isValid) {
        console.warn('[Razorpay Webhook] Invalid signature received from IP');
        return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 });
      }
    } else if (!signature) {
      console.warn('[Razorpay Webhook] Request received without x-razorpay-signature header');
      return NextResponse.json({ error: 'Missing x-razorpay-signature header' }, { status: 400 });
    }

    const event = JSON.parse(rawBody);
    const eventName = event.event;
    const db = await initDb();

    console.log(`[Razorpay Webhook Received] Event: ${eventName} (ID: ${event.id || 'N/A'})`);

    // 2. Persist Webhook Event in Audit Collection
    try {
      await db.collection('razorpay_webhook_logs').insertOne({
        eventId: event.id || `evt_${Date.now()}`,
        event: eventName,
        createdAt: new Date(),
        accountId: event.account_id || null,
        payload: {
          paymentId: event.payload?.payment?.entity?.id || null,
          orderId: event.payload?.payment?.entity?.order_id || event.payload?.order?.entity?.id || null,
          amount: event.payload?.payment?.entity?.amount ? event.payload.payment.entity.amount / 100 : null,
          method: event.payload?.payment?.entity?.method || null,
          status: event.payload?.payment?.entity?.status || null,
          error: event.payload?.payment?.entity?.error_description || null,
        },
      });
    } catch (logErr) {
      console.warn('[Razorpay Webhook] Failed to log raw event to DB:', logErr.message);
    }

    // 3. Process Specific Webhook Events
    if (eventName === 'payment.captured' || eventName === 'order.paid') {
      const paymentEntity = event.payload?.payment?.entity;
      const orderEntity = event.payload?.order?.entity;
      const razorpayOrderId = paymentEntity?.order_id || orderEntity?.id;
      const razorpayPaymentId = paymentEntity?.id;
      const amountCollected = paymentEntity?.amount ? paymentEntity.amount / 100 : null;

      if (razorpayOrderId) {
        const existingOrder = await db.collection('orders').findOne({
          $or: [
            { razorpayOrderId },
            { 'payment.razorpayOrderId': razorpayOrderId },
          ],
        });

        if (existingOrder) {
          const isPartial = existingOrder.payment?.method === 'partial_cod';
          const newPaymentStatus = isPartial ? 'PARTIALLY_PAID' : 'PAID';

          // If order is not yet confirmed (e.g., customer closed tab before redirect), confirm it now!
          const isNotConfirmed = existingOrder.status !== 'CONFIRMED';
          const updateData = {
            'payment.status': newPaymentStatus,
            'payment.razorpayPaymentId': razorpayPaymentId,
            'payment.amountCaptured': amountCollected || existingOrder.totalAmount,
            'payment.acquirerRrn': paymentEntity?.acquirer_data?.rrn || paymentEntity?.acquirer_data?.upi_transaction_id || null,
            'payment.methodDetails': {
              instrument: paymentEntity?.method,
              vpa: paymentEntity?.vpa || paymentEntity?.upi?.vpa || null,
              bank: paymentEntity?.bank || null,
              wallet: paymentEntity?.wallet || null,
              card: paymentEntity?.card || null,
            },
            updatedAt: new Date(),
          };

          if (isNotConfirmed) {
            updateData.status = 'CONFIRMED';
            updateData.fulfillmentStatus = 'unfulfilled';
            updateData.placedAt = existingOrder.placedAt || new Date().toISOString();
          }

          const historyEntry = {
            event: 'WEBHOOK_PAYMENT_CAPTURED',
            status: newPaymentStatus,
            amount: amountCollected,
            razorpayPaymentId,
            razorpayOrderId,
            rrn: updateData['payment.acquirerRrn'],
            timestamp: new Date(),
            note: `Payment verified and recorded via Razorpay Webhook [${eventName}]`,
          };

          await db.collection('orders').updateOne(
            { _id: existingOrder._id },
            {
              $set: updateData,
              $push: { paymentHistory: historyEntry },
            }
          );

          console.log(
            `[Razorpay Webhook] Order ${existingOrder.orderId} synced with payment ${razorpayPaymentId}. Status: ${newPaymentStatus}`
          );

          // Push to Shiprocket if not yet pushed
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
              console.log(`[Razorpay Webhook] Shiprocket order auto-created: ${shipRes.shipment_id}`);
            } catch (srErr) {
              console.warn('[Razorpay Webhook] Auto-Shiprocket error:', srErr.message);
            }
          }

          // Send confirmation email if newly confirmed
          if (isNotConfirmed && existingOrder.customer?.email) {
            try {
              await sendOrderConfirmationEmail({ ...existingOrder, ...updateData });
            } catch (mailErr) {
              console.warn('[Razorpay Webhook] Confirmation email error:', mailErr.message);
            }
          }
        } else {
          console.warn(`[Razorpay Webhook] Received ${eventName} for unknown Razorpay Order ID: ${razorpayOrderId}`);
        }
      }
    } else if (eventName === 'payment.failed') {
      const paymentEntity = event.payload?.payment?.entity;
      const razorpayOrderId = paymentEntity?.order_id;
      const razorpayPaymentId = paymentEntity?.id;
      const failureReason = paymentEntity?.error_description || paymentEntity?.error_reason || 'Payment failed';

      if (razorpayOrderId) {
        await db.collection('orders').updateOne(
          {
            $or: [
              { razorpayOrderId },
              { 'payment.razorpayOrderId': razorpayOrderId },
            ],
          },
          {
            $set: {
              'payment.status': 'PAYMENT_FAILED',
              'payment.failureReason': failureReason,
              updatedAt: new Date(),
            },
            $push: {
              paymentHistory: {
                event: 'WEBHOOK_PAYMENT_FAILED',
                status: 'PAYMENT_FAILED',
                razorpayPaymentId,
                razorpayOrderId,
                reason: failureReason,
                timestamp: new Date(),
                note: `Gateway reported transaction decline: ${failureReason}`,
              },
            },
          }
        );
        console.log(`[Razorpay Webhook] Recorded failure for order with Razorpay Order ID ${razorpayOrderId}: ${failureReason}`);
      }
    } else if (eventName === 'payment.authorized') {
      // Auto-capture authorized payments
      const paymentEntity = event.payload?.payment?.entity;
      if (paymentEntity?.id && paymentEntity?.status === 'authorized') {
        try {
          await captureRazorpayPayment(paymentEntity.id, paymentEntity.amount, paymentEntity.currency);
          console.log(`[Razorpay Webhook] Auto-captured authorized payment ${paymentEntity.id}`);
        } catch (capErr) {
          console.error(`[Razorpay Webhook] Auto-capture failed for ${paymentEntity.id}:`, capErr.message);
        }
      }
    }

    return NextResponse.json({ success: true, event: eventName, processedAt: new Date() });
  } catch (error) {
    console.error('[Razorpay Webhook Error]:', error);
    return NextResponse.json(
      { error: error.message || 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
