import { NextResponse } from 'next/server';
import { initDb } from '@/lib/mongodb';
import { createShiprocketOrder } from '@/lib/shiprocket';
import { sendMockWhatsAppMessage } from '@/lib/whatsapp';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const query = searchParams.get('q');

    const db = await initDb();
    const filter = {
      // Exclude abandoned checkout payment drafts
      'payment.status': { $ne: 'PENDING_PAYMENT' },
    };

    if (status && status !== 'all') {
      if (status === 'pending') {
        filter.$or = [
          { fulfillmentStatus: 'pending' },
          { fulfillmentStatus: 'unfulfilled' },
          { fulfillmentStatus: null },
          { fulfillmentStatus: { $exists: false } },
        ];
      } else {
        filter.fulfillmentStatus = status;
      }
    }

    if (query) {
      const q = query.trim();
      filter.$or = [
        { orderId: { $regex: q, $options: 'i' } },
        { 'customer.name': { $regex: q, $options: 'i' } },
        { 'customer.mobile': { $regex: q, $options: 'i' } },
        { 'customer.email': { $regex: q, $options: 'i' } },
      ];
    }

    const orders = await db
      .collection('orders')
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(100)
      .toArray();

    return NextResponse.json({ success: true, count: orders.length, orders });
  } catch (error) {
    console.error('[Admin Orders GET Error]:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders from MongoDB', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const db = await initDb();

    // Quick Test Order Generator
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const orderId = body.orderId || `ORD-${new Date().getFullYear()}-${randomNum}`;
    const mockNames = ['Aarav Sharma', 'Priya Patel', 'Rohan Verma', 'Ananya Iyer', 'Vikram Malhotra'];
    const randomName = mockNames[Math.floor(Math.random() * mockNames.length)];
    const randomMobile = `98${Math.floor(10000000 + Math.random() * 90000000)}`;

    const isPartialCod = Math.random() > 0.5;
    const testOrder = {
      orderId,
      customer: {
        name: body.customerName || randomName,
        email: body.customerEmail || `${randomName.toLowerCase().replace(' ', '.')}@example.com`,
        mobile: body.customerMobile || randomMobile,
        address: {
          houseNo: 'Flat 402, Lotus Arcade',
          street: 'Indiranagar 100ft Road',
          city: 'Bengaluru',
          state: 'Karnataka',
          pincode: '560038',
        },
      },
      items: [
        {
          id: 'drop-hybrid-women',
          name: 'Sonu Hybrid RN v1 - Road Edition',
          size: 'UK 8',
          quantity: 1,
          priceNumber: 13995,
          colorway: 'Grey / Vibrant Green',
          image: '/images/test/1e462d9Nike-IV2476-200_1.avif',
        },
      ],
      totalAmount: 13995,
      payment: {
        method: isPartialCod ? 'partial_cod' : 'prepaid',
        status: isPartialCod ? 'PARTIALLY_PAID' : 'PAID',
        advancePaid: isPartialCod ? 200 : 13995,
        balanceDue: isPartialCod ? 13795 : 0,
      },
      fulfillmentStatus: 'new',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Auto-create mock Shiprocket shipment
    const srData = await createShiprocketOrder(testOrder);
    testOrder.shiprocket = {
      orderId: srData.order_id,
      shipmentId: srData.shipment_id,
      status: 'NEW',
      channelId: '8506269',
      isSimulated: true,
      createdAt: new Date(),
    };

    // Trigger mock WhatsApp Order Confirmed
    const waLog = await sendMockWhatsAppMessage({
      phone: testOrder.customer.mobile,
      recipientName: testOrder.customer.name,
      template: 'ORDER_CONFIRMED',
      orderId: testOrder.orderId,
      totalAmount: testOrder.totalAmount,
    });
    testOrder.whatsappLogs = [waLog];

    await db.collection('orders').insertOne(testOrder);

    return NextResponse.json({
      success: true,
      message: `Test order #${orderId} created successfully with mock Shiprocket & WhatsApp`,
      order: testOrder,
    });
  } catch (error) {
    console.error('[Admin Orders POST Error]:', error);
    return NextResponse.json(
      { error: 'Failed to create order', details: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  try {
    const body = await request.json();
    const {
      orderId,
      fulfillmentStatus,
      status,
      customer,
      address,
      items,
      payment,
      internalNote,
      remark,
      trackingNumber,
      shiprocket,
    } = body;

    if (!orderId) {
      return NextResponse.json({ error: 'orderId is required' }, { status: 400 });
    }

    const db = await initDb();
    const updateFields = {
      updatedAt: new Date(),
    };

    if (fulfillmentStatus !== undefined) updateFields.fulfillmentStatus = fulfillmentStatus;
    if (status !== undefined) updateFields.status = status;
    if (customer !== undefined) updateFields.customer = customer;
    if (address !== undefined) updateFields.address = address;
    if (items !== undefined) updateFields.items = items;
    if (payment !== undefined) updateFields.payment = payment;
    if (internalNote !== undefined) updateFields.internalNote = internalNote;
    if (remark !== undefined) updateFields.remark = remark;
    if (trackingNumber !== undefined) updateFields.trackingNumber = trackingNumber;
    if (shiprocket !== undefined) updateFields.shiprocket = shiprocket;

    const result = await db.collection('orders').updateOne(
      { orderId },
      { $set: updateFields }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const updatedOrder = await db.collection('orders').findOne({ orderId });

    return NextResponse.json({
      success: true,
      message: 'Order updated successfully',
      order: updatedOrder,
    });
  } catch (error) {
    console.error('[Admin Orders PATCH Error]:', error);
    return NextResponse.json(
      { error: 'Failed to update order in MongoDB', details: error.message },
      { status: 500 }
    );
  }
}
