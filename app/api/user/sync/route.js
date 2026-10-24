import { NextResponse } from 'next/server';
import { getDb, initDb } from '@/lib/mongodb';

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      email,
      mobile,
      firstName,
      lastName,
      name,
      preference,
      dob,
      isEmailVerified,
      address,
    } = body;

    if (!email && !mobile) {
      return NextResponse.json(
        { error: 'Either email or mobile is required to sync user profile' },
        { status: 400 }
      );
    }

    const db = await initDb();

    // Match existing user by either email or mobile number
    const userFilter =
      email && mobile
        ? { $or: [{ email: email.toLowerCase().trim() }, { mobile: mobile.trim() }] }
        : email
        ? { email: email.toLowerCase().trim() }
        : { mobile: mobile.trim() };

    const setFields = {
      updatedAt: new Date(),
    };

    if (name) setFields.name = name;
    if (firstName) setFields.firstName = firstName;
    if (lastName) setFields.lastName = lastName;
    if (!name && (firstName || lastName)) {
      setFields.name = `${firstName || ''} ${lastName || ''}`.trim();
    }
    if (email) setFields.email = email.toLowerCase().trim();
    if (mobile) setFields.mobile = mobile.trim();
    if (preference) setFields.preference = preference;
    if (dob) setFields.dob = dob;
    if (typeof isEmailVerified === 'boolean') setFields.isEmailVerified = isEmailVerified;

    if (address && (address.houseNo || address.street || address.roadArea || address.pincode)) {
      setFields.primaryAddress = {
        houseNo: address.houseNo || '',
        street: address.street || address.roadArea || '',
        landmark: address.landmark || '',
        city: address.city || '',
        state: address.state || '',
        pincode: address.pincode || '',
      };
    }

    const updateDoc = {
      $set: setFields,
      $setOnInsert: {
        createdAt: new Date(),
        orders: [],
      },
    };

    const result = await db.collection('users').updateOne(userFilter, updateDoc, { upsert: true });

    return NextResponse.json({
      success: true,
      message: 'User profile synced to MongoDB successfully',
      matchedCount: result.matchedCount,
      upsertedId: result.upsertedId,
    });
  } catch (error) {
    console.error('[MongoDB] User sync error:', error);
    return NextResponse.json(
      { error: 'Failed to sync user data in MongoDB' },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const mobile = searchParams.get('mobile');

    if (!email && !mobile) {
      return NextResponse.json(
        { error: 'Please provide email or mobile to lookup profile' },
        { status: 400 }
      );
    }

    const db = await initDb();
    const query = email
      ? { email: email.toLowerCase().trim() }
      : { mobile: mobile.trim() };

    const user = await db.collection('users').findOne(query);

    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error('[MongoDB] Error finding user:', error);
    return NextResponse.json(
      { error: 'Failed to lookup user profile' },
      { status: 500 }
    );
  }
}
