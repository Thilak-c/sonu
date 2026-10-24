import { NextResponse } from 'next/server';
import { getDb, initDb } from '@/lib/mongodb';
import { createShiprocketOrder } from '@/lib/shiprocket';

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

    if (!orderId || !items || !Array.isArray(items)) {
      return NextResponse.json(
        { error: 'Invalid order payload. orderId and items are required.' },
        { status: 400 }
      );
    }

    const db = await initDb();

    const fullName =
      address.name ||
      `${address.firstName || ''} ${address.lastName || ''}`.trim() ||
      'Customer';

    const isPartialCod = paymentMethod === 'partial_cod' || paymentMethod === 'cod';
    const advancePaid = isPartialCod ? Number(body.advancePaid || 200) : (razorpayPaymentId ? Number(totalAmount) : 0);
    const balanceDue = isPartialCod ? Math.max(0, Number(totalAmount) - advancePaid) : 0;

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
      totalAmount: Number(totalAmount),
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
        method: isPartialCod ? 'partial_cod' : paymentMethod,
        status: isPartialCod ? (razorpayPaymentId ? 'PARTIALLY_PAID' : 'PENDING') : (razorpayPaymentId ? 'PAID' : 'PENDING'),
        advancePaid,
        balanceDue,
        razorpayPaymentId: razorpayPaymentId || null,
        razorpayOrderId: razorpayOrderId || null,
        razorpaySignature: razorpaySignature || null,
      },
      status: 'CONFIRMED',
      estimatedDelivery: '3-5 business days',
      placedAt: placedAt || new Date().toISOString(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // 1. Insert or update order in MongoDB
    await db.collection('orders').updateOne(
      { orderId },
      { $set: orderDoc },
      { upsert: true }
    );

    // 2. Upsert customer profile in MongoDB 'users' collection
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

    console.log(`[MongoDB] Successfully saved Order ${orderId} into database.`);

    // 3. Automatically push order to Shiprocket
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

    return NextResponse.json({
      success: true,
      orderId,
      shiprocket: shiprocketResult,
      message: 'Order saved in MongoDB and pushed to Shiprocket successfully',
    });
  } catch (error) {
    console.error('[MongoDB] Error saving order:', error);
    return NextResponse.json(
      { error: 'Internal server error while saving order to MongoDB' },
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
      let order = await db.collection('orders').findOne({ orderId });
      if (!order && orderId.length === 24) {
        try {
          const { ObjectId } = await import('mongodb');
          order = await db.collection('orders').findOne({ _id: new ObjectId(orderId) });
        } catch (e) {}
      }
      if (!order) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, order });
    }

    const query = {};
    if (email) query['customer.email'] = email.toLowerCase().trim();
    if (mobile) query['customer.mobile'] = mobile.trim();

    const orders = await db
      .collection('orders')
      .find(query)
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();

    return NextResponse.json({ success: true, count: orders.length, orders });
  } catch (error) {
    console.error('[MongoDB] Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve orders from database' },
      { status: 500 }
    );
  }
}
