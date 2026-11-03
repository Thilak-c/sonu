import { NextResponse } from 'next/server';
import { initDb } from '@/lib/mongodb';
import { createShiprocketOrder } from '@/lib/shiprocket';
import { sendOrderConfirmationEmail } from '@/lib/email';
import { verifyAndRecheckPayment } from '@/lib/razorpay';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      orderId,
      items,
      totalAmount,
      address = {},
      paymentMethod = 'upi',
      razorpayPaymentId,
      razorpayOrderId,
      razorpaySignature,
      placedAt,
    } = body;

    if (!orderId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Invalid order payload. orderId and at least one item are required.' },
        { status: 400 }
      );
    }

    const numericTotal = Number(totalAmount);
    if (!numericTotal || numericTotal <= 0) {
      return NextResponse.json(
        { error: 'Valid total amount is required.' },
        { status: 400 }
      );
    }

    const isPartialCod = paymentMethod === 'partial_cod';
    const isFullCod = paymentMethod === 'full_cod' || paymentMethod === 'cod';
    const isOnline = !isFullCod;

    const db = await initDb();

    // 1. Mandatory Payment Verification for All Online / Partial COD Orders
    let verifiedPaymentInfo = null;
    if (isOnline) {
      if (!razorpayPaymentId || !razorpayOrderId || !razorpaySignature) {
        return NextResponse.json(
          {
            error:
              'Payment proof missing. Razorpay payment ID, order ID, and signature are required for online orders.',
          },
          { status: 400 }
        );
      }

      const expectedAmountInPaise = isPartialCod
        ? Math.round(Number(body.advancePaid || 200) * 100)
        : Math.round(numericTotal * 100);

      // Perform bulletproof verification: Signature + Direct Gateway Query + Status check + Capture
      const verification = await verifyAndRecheckPayment({
        razorpayPaymentId,
        razorpayOrderId,
        razorpaySignature,
        expectedAmountInPaise,
      });

      if (!verification.isVerified) {
        console.error(
          `[Razorpay Verification Failed] Order ${orderId} (Payment: ${razorpayPaymentId}):`,
          verification.errors
        );

        // Record failed attempt in order paymentHistory if draft exists
        try {
          await db.collection('orders').updateOne(
            {
              $or: [
                { orderId },
                { razorpayOrderId },
                { 'payment.razorpayOrderId': razorpayOrderId },
              ],
            },
            {
              $set: {
                'payment.status': 'VERIFICATION_FAILED',
                'payment.lastError': verification.errors.join('; '),
                updatedAt: new Date(),
              },
              $push: {
                paymentHistory: {
                  event: 'PAYMENT_VERIFICATION_FAILED',
                  status: 'FAILED',
                  razorpayPaymentId,
                  razorpayOrderId,
                  errors: verification.errors,
                  timestamp: new Date(),
                },
              },
            }
          );
        } catch (dbErr) {
          console.error('[MongoDB] Failed to log payment failure:', dbErr);
        }

        return NextResponse.json(
          {
            error: 'Payment could not be verified with Razorpay gateway.',
            details: verification.errors,
          },
          { status: 400 }
        );
      }

      verifiedPaymentInfo = verification;
      console.log(
        `[Razorpay Verified ✓] Order ${orderId}: ₹${verification.payment.amount} collected via ${verification.payment.method} [Mode: ${verification.mode}]`
      );
    }

    const fullName =
      address.name ||
      `${address.firstName || ''} ${address.lastName || ''}`.trim() ||
      'Customer';

    const advancePaid = isPartialCod
      ? Number(body.advancePaid || 200)
      : isFullCod
      ? 0
      : numericTotal;

    const balanceDue = isPartialCod
      ? Math.max(0, numericTotal - advancePaid)
      : isFullCod
      ? numericTotal
      : 0;

    const orderDoc = {
      orderId,
      items: items.map((item) => ({
        id: item.id || item.slug,
        slug: item.slug || item.id,
        name: item.name,
        priceNumber: Number(item.priceNumber || 13995),
        price: item.price || `₹${item.priceNumber || 13995}`,
        size: item.size || 'UK 8',
        quantity: Number(item.quantity || 1),
        image: item.image,
      })),
      totalAmount: numericTotal,
      currency: 'INR',
      customer: {
        name: fullName,
        firstName: address.firstName || '',
        lastName: address.lastName || '',
        email: (address.email || '').toLowerCase().trim(),
        mobile: address.mobile || '',
        address: {
          houseNo: address.houseNo || '',
          street: address.street || address.roadArea || '',
          landmark: address.landmark || '',
          city: address.city || '',
          state: address.state || '',
          pincode: address.pincode || '',
        },
      },
      payment: {
        method: isPartialCod ? 'partial_cod' : isFullCod ? 'full_cod' : paymentMethod,
        status: isPartialCod
          ? 'PARTIALLY_PAID'
          : isFullCod
          ? 'PENDING_COD'
          : 'PAID',
        advancePaid,
        balanceDue,
        gateway: isFullCod ? 'cod' : 'razorpay',
        gatewayMode: verifiedPaymentInfo?.mode || 'none',
        razorpayPaymentId: razorpayPaymentId || null,
        razorpayOrderId: razorpayOrderId || null,
        razorpaySignature: razorpaySignature || null,
        amountCaptured: verifiedPaymentInfo?.payment?.amount || (isFullCod ? 0 : advancePaid),
        currency: 'INR',
        acquirerRrn: verifiedPaymentInfo?.payment?.rrn || null,
        methodDetails: verifiedPaymentInfo
          ? {
              instrument: verifiedPaymentInfo.payment.method,
              vpa: verifiedPaymentInfo.payment.vpa,
              bank: verifiedPaymentInfo.payment.bank,
              wallet: verifiedPaymentInfo.payment.wallet,
              card: verifiedPaymentInfo.payment.card,
              fee: verifiedPaymentInfo.payment.fee,
              tax: verifiedPaymentInfo.payment.tax,
            }
          : null,
        verifiedAt: new Date(),
      },
      status: 'CONFIRMED',
      fulfillmentStatus: 'unfulfilled',
      estimatedDelivery: '3-5 business days',
      placedAt: placedAt || new Date().toISOString(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // 2. Insert or update existing order in MongoDB & Append Payment History
    const orderFilter = razorpayOrderId
      ? {
          $or: [
            { orderId },
            { razorpayOrderId },
            { 'payment.razorpayOrderId': razorpayOrderId },
          ],
        }
      : { orderId };

    const paymentHistoryEntry = {
      event: isFullCod ? 'COD_ORDER_PLACED' : 'PAYMENT_VERIFIED_AND_CAPTURED',
      status: orderDoc.payment.status,
      amount: advancePaid,
      balanceDue,
      gateway: isFullCod ? 'cod' : 'razorpay',
      gatewayMode: verifiedPaymentInfo?.mode || 'none',
      razorpayPaymentId: razorpayPaymentId || null,
      razorpayOrderId: razorpayOrderId || null,
      acquirerRrn: verifiedPaymentInfo?.payment?.rrn || null,
      timestamp: new Date(),
      note: isFullCod
        ? 'Full Cash on Delivery order confirmed by buyer'
        : `₹${advancePaid} successfully captured on Razorpay [${verifiedPaymentInfo?.mode?.toUpperCase()}]`,
    };

    await db.collection('orders').updateOne(
      orderFilter,
      {
        $set: orderDoc,
        $push: { paymentHistory: paymentHistoryEntry },
      },
      { upsert: true }
    );

    // 3. Upsert customer profile in MongoDB 'users' collection
    if (address.email || address.mobile) {
      const userFilter = address.email
        ? { email: address.email.toLowerCase().trim() }
        : { mobile: address.mobile.trim() };

      await db.collection('users').updateOne(
        userFilter,
        {
          $set: {
            name: fullName,
            firstName: address.firstName || '',
            lastName: address.lastName || '',
            mobile: address.mobile || '',
            email: (address.email || '').toLowerCase().trim(),
            primaryAddress: {
              houseNo: address.houseNo || '',
              street: address.street || address.roadArea || '',
              landmark: address.landmark || '',
              city: address.city || '',
              state: address.state || '',
              pincode: address.pincode || '',
            },
            updatedAt: new Date(),
          },
          $setOnInsert: {
            createdAt: new Date(),
          },
          $addToSet: {
            orders: orderId,
          },
        },
        { upsert: true }
      );
    }

    console.log(`[MongoDB] Successfully confirmed Order ${orderId} in database.`);

    // 4. Automatically push confirmed order to Shiprocket
    let shiprocketResult = null;
    try {
      shiprocketResult = await createShiprocketOrder(orderDoc);
      console.log(
        `[Shiprocket] Successfully pushed Order ${orderId} to Shiprocket. Shipment ID: ${shiprocketResult.shipment_id}`
      );

      await db.collection('orders').updateOne(
        { orderId },
        {
          $set: {
            shiprocket: {
              orderId: shiprocketResult.order_id,
              shipmentId: shiprocketResult.shipment_id,
              status: shiprocketResult.status || 'NEW',
              awbCode: shiprocketResult.awb_code || null,
              courierName: shiprocketResult.courier_name || null,
              createdAt: new Date(),
            },
          },
        }
      );
    } catch (srError) {
      console.error(`[Shiprocket] Error pushing Order ${orderId} to Shiprocket:`, srError.message);
      await db.collection('orders').updateOne(
        { orderId },
        {
          $set: {
            shiprocket: {
              status: 'FAILED',
              error: srError.message,
              failedAt: new Date(),
            },
          },
        }
      );
    }

    // 5. Send Order Confirmation Email via Hostinger SMTP
    if (orderDoc.customer?.email) {
      sendOrderConfirmationEmail(orderDoc).catch((e) =>
        console.warn(`[Email Service] Non-blocking order confirmation error for #${orderId}:`, e.message)
      );
    }

    return NextResponse.json({
      success: true,
      orderId,
      paymentStatus: orderDoc.payment.status,
      shiprocket: shiprocketResult,
      message: 'Order verified, placed, and pushed to Shiprocket successfully',
    });
  } catch (error) {
    console.error('[Orders API Error]:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error while processing order' },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');
    const email = searchParams.get('email');
    const mobile = searchParams.get('mobile');

    const db = await initDb();

    if (orderId) {
      const order = await db.collection('orders').findOne({ orderId });
      if (!order) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, order });
    }

    if (email || mobile) {
      const filter = {};
      if (email) filter['customer.email'] = email.toLowerCase().trim();
      if (mobile) filter['customer.mobile'] = mobile.trim();

      const orders = await db
        .collection('orders')
        .find(filter)
        .sort({ createdAt: -1 })
        .toArray();

      return NextResponse.json({ success: true, orders });
    }

    const orders = await db
      .collection('orders')
      .find({ 'payment.status': { $ne: 'PENDING_PAYMENT' } })
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();

    return NextResponse.json({ success: true, orders });
  } catch (error) {
    console.error('[Orders GET Error]:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve orders from database' },
      { status: 500 }
    );
  }
}
