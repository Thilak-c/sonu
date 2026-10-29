import { NextResponse } from 'next/server';
import { initDb } from '@/lib/mongodb';

export async function POST(request) {
  try {
    const { amount, receipt, orderId, notes, items } = await request.json();

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Valid amount is required' },
        { status: 400 }
      );
    }

    const keyId = process.env.RAZORPAY_KEY_ID || 'rzp_test_ToeynJ0XXfrtyp';
    const keySecret = process.env.RAZORPAY_KEY_SECRET || 'usK3zc5FrVqz83iZSL5YMEiJ';

    const authHeader = `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`;

    // Razorpay amount is in paise (1 INR = 100 paise)
    const amountInPaise = Math.round(Number(amount) * 100);
    const finalOrderId = orderId || receipt || `SONU-IN-${Math.floor(100000 + Math.random() * 900000)}`;
    const receiptId = String(finalOrderId).slice(0, 40);

    const res = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: amountInPaise,
        currency: 'INR',
        receipt: receiptId,
        notes: notes || {},
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { error: data.error?.description || 'Failed to create Razorpay order' },
        { status: res.status }
      );
    }

    // Save initial order record into MongoDB BEFORE payment starts
    try {
      const db = await initDb();
      await db.collection('orders').updateOne(
        { razorpayOrderId: data.id },
        {
          $set: {
            orderId: finalOrderId,
            razorpayOrderId: data.id,
            amount: Number(amount),
            currency: data.currency || 'INR',
            items: items || [],
            customer: {
              name: notes?.customerName || '',
              email: (notes?.customerEmail || '').toLowerCase().trim(),
              mobile: notes?.contact || '',
              address: notes?.address || '',
            },
            payment: {
              method: notes?.method || 'razorpay',
              status: 'PENDING_PAYMENT',
              razorpayOrderId: data.id,
            },
            status: 'PENDING',
            updatedAt: new Date(),
          },
          $setOnInsert: {
            createdAt: new Date(),
          },
        },
        { upsert: true }
      );
      console.log(`[MongoDB] Initial order draft saved with Razorpay order ID ${data.id}`);
    } catch (dbErr) {
      console.error('[MongoDB] Warning: Failed to write initial order to DB:', dbErr);
    }

    return NextResponse.json({
      orderId: data.id,
      amount: data.amount,
      currency: data.currency,
      receipt: receiptId,
      keyId,
    });
  } catch (error) {
    console.error('Razorpay order creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error while initializing payment' },
      { status: 500 }
    );
  }
}
