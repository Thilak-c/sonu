import { NextResponse } from 'next/server';
import { initDb } from '@/lib/mongodb';
import { createRazorpayOrder, getRazorpayCredentials } from '@/lib/razorpay';
import { rateLimit } from '@/lib/ratelimit';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  // Rate limit: max 15 razorpay order creation calls per 10 mins per IP
  const blockedResponse = rateLimit(request, 'razorpay_order', {
    limit: 15,
    windowMs: 10 * 60 * 1000,
  });
  if (blockedResponse) return blockedResponse;

  try {
    const { amount, receipt, orderId, notes = {}, items = [] } = await request.json();

    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount <= 0) {
      return NextResponse.json(
        { error: 'Valid positive amount is required' },
        { status: 400 }
      );
    }

    // Verify credentials configuration
    let creds;
    try {
      creds = getRazorpayCredentials();
    } catch (credErr) {
      console.error('[Razorpay Config Error]:', credErr.message);
      return NextResponse.json(
        { error: 'Payment gateway configuration error. Please contact store support.' },
        { status: 500 }
      );
    }

    const amountInPaise = Math.round(numericAmount * 100);
    const finalOrderId = orderId || receipt || `SONU-IN-${Math.floor(100000 + Math.random() * 900000)}`;
    const receiptId = String(finalOrderId).slice(0, 40);

    const rzpOrder = await createRazorpayOrder({
      amountInPaise,
      receipt: receiptId,
      notes: {
        ...notes,
        orderId: finalOrderId,
        gatewayMode: creds.mode,
      },
    });

    // Save initial order draft record in MongoDB BEFORE payment starts
    try {
      const db = await initDb();
      await db.collection('orders').updateOne(
        { razorpayOrderId: rzpOrder.orderId },
        {
          $set: {
            orderId: finalOrderId,
            razorpayOrderId: rzpOrder.orderId,
            totalAmount: numericAmount,
            amount: numericAmount,
            currency: rzpOrder.currency || 'INR',
            items: items || [],
            customer: {
              name: notes.customerName || '',
              email: (notes.customerEmail || '').toLowerCase().trim(),
              mobile: notes.contact || '',
              address: notes.address || '',
            },
            payment: {
              method: notes.method || 'razorpay',
              status: 'PENDING_PAYMENT',
              razorpayOrderId: rzpOrder.orderId,
              expectedAmount: numericAmount,
              expectedAmountInPaise: amountInPaise,
              gatewayMode: creds.mode,
            },
            status: 'PENDING',
            updatedAt: new Date(),
          },
          $setOnInsert: {
            createdAt: new Date(),
            paymentHistory: [
              {
                event: 'ORDER_INTENT_CREATED',
                status: 'PENDING_PAYMENT',
                amount: numericAmount,
                razorpayOrderId: rzpOrder.orderId,
                gatewayMode: creds.mode,
                timestamp: new Date(),
                note: `Checkout initialized in ${creds.mode.toUpperCase()} mode for ₹${numericAmount}`,
              },
            ],
          },
        },
        { upsert: true }
      );
      console.log(`[MongoDB] Initial order draft saved: ${finalOrderId} (${rzpOrder.orderId}) [Mode: ${creds.mode}]`);
    } catch (dbErr) {
      console.error('[MongoDB] Warning: Failed to write initial order to DB:', dbErr);
    }

    return NextResponse.json({
      orderId: rzpOrder.orderId,
      amount: rzpOrder.amount,
      currency: rzpOrder.currency,
      receipt: receiptId,
      keyId: rzpOrder.keyId,
      mode: creds.mode,
    });
  } catch (error) {
    console.error('Razorpay order creation error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error while initializing payment' },
      { status: 500 }
    );
  }
}
