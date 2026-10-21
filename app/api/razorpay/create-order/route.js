import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { amount, receipt, notes } = await request.json();

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

    const res = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: amountInPaise,
        currency: 'INR',
        receipt: receipt || `rcpt_${Date.now()}`,
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

    return NextResponse.json({
      orderId: data.id,
      amount: data.amount,
      currency: data.currency,
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
