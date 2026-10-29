import { NextResponse } from 'next/server';
import { initDb } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = await initDb();
    const users = await db.collection('users').find({}).sort({ updatedAt: -1 }).toArray();
    const orders = await db.collection('orders').find({}).sort({ createdAt: -1, placedAt: -1 }).toArray();

    // Map existing users
    const matchedEmailSet = new Set();
    const matchedMobileSet = new Set();

    const customerList = users.map((u) => {
      const emailLower = (u.email || '').toLowerCase().trim();
      const mobileClean = (u.mobile || '').trim();
      if (emailLower) matchedEmailSet.add(emailLower);
      if (mobileClean) matchedMobileSet.add(mobileClean);

      const userOrders = orders.filter((o) => {
        const orderEmail = (o.customer?.email || '').toLowerCase().trim();
        const orderMobile = (o.customer?.mobile || '').trim();
        return (emailLower && orderEmail === emailLower) || (mobileClean && orderMobile === mobileClean);
      });

      const totalSpent = userOrders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
      const orderCount = userOrders.length;
      const latestOrder = userOrders[0];

      const primaryAddress = u.primaryAddress || latestOrder?.customer?.address || {};

      let status = 'Prospect';
      if (totalSpent >= 25000 || orderCount >= 3) {
        status = 'VIP';
      } else if (orderCount >= 2) {
        status = 'Repeat';
      } else if (orderCount === 1) {
        status = 'Active';
      }

      return {
        _id: u._id.toString(),
        name: u.name || `${u.firstName || ''} ${u.lastName || ''}`.trim() || latestOrder?.customer?.name || 'Customer',
        firstName: u.firstName || (u.name ? u.name.split(' ')[0] : ''),
        lastName: u.lastName || (u.name ? u.name.split(' ').slice(1).join(' ') : ''),
        email: u.email || latestOrder?.customer?.email || '',
        mobile: u.mobile || latestOrder?.customer?.mobile || '',
        primaryAddress: {
          houseNo: primaryAddress.houseNo || '',
          street: primaryAddress.street || primaryAddress.roadArea || '',
          landmark: primaryAddress.landmark || '',
          city: primaryAddress.city || '',
          state: primaryAddress.state || '',
          pincode: primaryAddress.pincode || '',
        },
        orderCount,
        totalSpent,
        avgOrderValue: orderCount > 0 ? Math.round(totalSpent / orderCount) : 0,
        orders: userOrders.map((o) => ({
          orderId: o.orderId,
          totalAmount: Number(o.totalAmount || 0),
          status: o.status || 'CONFIRMED',
          fulfillmentStatus: o.fulfillmentStatus || (o.shiprocket?.status || 'Processing'),
          paymentMethod: o.payment?.method || 'prepaid',
          placedAt: o.placedAt || o.createdAt,
          itemsCount: (o.items || []).reduce((acc, it) => acc + Number(it.quantity || 1), 0),
        })),
        lastOrderDate: latestOrder?.placedAt || latestOrder?.createdAt || u.updatedAt || u.createdAt,
        createdAt: u.createdAt || latestOrder?.createdAt || new Date(),
        updatedAt: u.updatedAt || latestOrder?.updatedAt || new Date(),
        status,
      };
    });

    // Check if there are customer orders that don't belong to any user document yet
    orders.forEach((o) => {
      const orderEmail = (o.customer?.email || '').toLowerCase().trim();
      const orderMobile = (o.customer?.mobile || '').trim();

      const alreadyExists =
        (orderEmail && matchedEmailSet.has(orderEmail)) ||
        (orderMobile && matchedMobileSet.has(orderMobile));

      if (!alreadyExists && (orderEmail || orderMobile)) {
        if (orderEmail) matchedEmailSet.add(orderEmail);
        if (orderMobile) matchedMobileSet.add(orderMobile);

        const guestOrders = orders.filter((go) => {
          const goEmail = (go.customer?.email || '').toLowerCase().trim();
          const goMobile = (go.customer?.mobile || '').trim();
          return (orderEmail && goEmail === orderEmail) || (orderMobile && goMobile === orderMobile);
        });

        const totalSpent = guestOrders.reduce((sum, go) => sum + (Number(go.totalAmount) || 0), 0);
        const orderCount = guestOrders.length;
        const addr = o.customer?.address || {};

        let status = 'Active';
        if (totalSpent >= 25000 || orderCount >= 3) {
          status = 'VIP';
        } else if (orderCount >= 2) {
          status = 'Repeat';
        }

        customerList.push({
          _id: `guest_${o.orderId || Math.random().toString(36).substring(7)}`,
          name: o.customer?.name || 'Customer',
          firstName: o.customer?.firstName || (o.customer?.name ? o.customer.name.split(' ')[0] : 'Customer'),
          lastName: o.customer?.lastName || (o.customer?.name ? o.customer.name.split(' ').slice(1).join(' ') : ''),
          email: o.customer?.email || '',
          mobile: o.customer?.mobile || '',
          primaryAddress: {
            houseNo: addr.houseNo || '',
            street: addr.street || addr.roadArea || '',
            landmark: addr.landmark || '',
            city: addr.city || '',
            state: addr.state || '',
            pincode: addr.pincode || '',
          },
          orderCount,
          totalSpent,
          avgOrderValue: orderCount > 0 ? Math.round(totalSpent / orderCount) : 0,
          orders: guestOrders.map((go) => ({
            orderId: go.orderId,
            totalAmount: Number(go.totalAmount || 0),
            status: go.status || 'CONFIRMED',
            fulfillmentStatus: go.fulfillmentStatus || (go.shiprocket?.status || 'Processing'),
            paymentMethod: go.payment?.method || 'prepaid',
            placedAt: go.placedAt || go.createdAt,
            itemsCount: (go.items || []).reduce((acc, it) => acc + Number(it.quantity || 1), 0),
          })),
          lastOrderDate: o.placedAt || o.createdAt,
          createdAt: o.createdAt || new Date(),
          updatedAt: o.updatedAt || new Date(),
          status,
        });
      }
    });

    // Sort by latest order or updated date
    customerList.sort((a, b) => new Date(b.lastOrderDate || b.createdAt) - new Date(a.lastOrderDate || a.createdAt));

    return NextResponse.json({ success: true, count: customerList.length, customers: customerList });
  } catch (error) {
    console.error('[Admin Customers GET Error]:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customers', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, firstName, lastName, email, mobile, primaryAddress, notes } = body;

    if (!name && !firstName && !email && !mobile) {
      return NextResponse.json({ error: 'Customer name, email or mobile is required.' }, { status: 400 });
    }

    const db = await initDb();
    const fullName = name || `${firstName || ''} ${lastName || ''}`.trim() || 'New Customer';

    const customerDoc = {
      name: fullName,
      firstName: firstName || fullName.split(' ')[0],
      lastName: lastName || fullName.split(' ').slice(1).join(' '),
      email: (email || '').toLowerCase().trim(),
      mobile: (mobile || '').trim(),
      primaryAddress: {
        houseNo: primaryAddress?.houseNo || '',
        street: primaryAddress?.street || primaryAddress?.roadArea || '',
        landmark: primaryAddress?.landmark || '',
        city: primaryAddress?.city || '',
        state: primaryAddress?.state || '',
        pincode: primaryAddress?.pincode || '',
      },
      notes: notes || '',
      orders: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection('users').insertOne(customerDoc);

    return NextResponse.json({
      success: true,
      message: 'Customer created successfully',
      customerId: result.insertedId.toString(),
      customer: { ...customerDoc, _id: result.insertedId.toString() },
    });
  } catch (error) {
    console.error('[Admin Customers POST Error]:', error);
    return NextResponse.json({ error: error.message || 'Failed to create customer' }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const body = await request.json();
    const { id, name, firstName, lastName, email, mobile, primaryAddress, notes } = body;

    if (!id) {
      return NextResponse.json({ error: 'Customer ID is required.' }, { status: 400 });
    }

    const db = await initDb();
    const filter = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { email: email?.toLowerCase() };

    const updateFields = {
      updatedAt: new Date(),
    };

    if (name !== undefined) updateFields.name = name;
    if (firstName !== undefined) updateFields.firstName = firstName;
    if (lastName !== undefined) updateFields.lastName = lastName;
    if (email !== undefined) updateFields.email = (email || '').toLowerCase().trim();
    if (mobile !== undefined) updateFields.mobile = (mobile || '').trim();
    if (notes !== undefined) updateFields.notes = notes;
    if (primaryAddress !== undefined) updateFields.primaryAddress = primaryAddress;

    await db.collection('users').updateOne(filter, { $set: updateFields });

    return NextResponse.json({
      success: true,
      message: 'Customer updated successfully',
    });
  } catch (error) {
    console.error('[Admin Customers PATCH Error]:', error);
    return NextResponse.json({ error: error.message || 'Failed to update customer' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Customer ID is required' }, { status: 400 });
    }

    const db = await initDb();
    if (ObjectId.isValid(id)) {
      await db.collection('users').deleteOne({ _id: new ObjectId(id) });
    }

    return NextResponse.json({ success: true, message: 'Customer deleted successfully' });
  } catch (error) {
    console.error('[Admin Customers DELETE Error]:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete customer' }, { status: 500 });
  }
}
