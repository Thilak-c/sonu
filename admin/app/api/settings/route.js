import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

const DEFAULT_SELLER = {
  companyName: 'Sonu Shoe',
  addressLine1: '34, Rd Number 2, Nehru Nagar',
  addressLine2: 'Patliputra Colony',
  city: 'Patna',
  state: 'Bihar',
  pincode: '800013',
  stateCode: '10',
  country: 'India',
  phone: '8008439762',
  email: 'yashodanandkumar15@gmail.com',
  gstin: '',
  signatureTitle: 'Authorized Signature for Sonu Shoe',
  reverseCharge: 'No',
};

export async function GET() {
  try {
    const db = await getDb();
    const authDoc = await db.collection('settings').findOne({ _id: 'auth_settings' });
    const sellerDoc = await db.collection('settings').findOne({ _id: 'seller_settings' });

    return NextResponse.json({
      success: true,
      enableNumberVerification: authDoc?.enableNumberVerification === true,
      enableEmailVerification: authDoc?.enableEmailVerification === true,
      seller: {
        ...DEFAULT_SELLER,
        ...(sellerDoc ? { ...sellerDoc, _id: undefined } : {}),
      },
    });
  } catch (error) {
    console.warn('[Admin Settings API] Using fallback defaults:', error.message);
    return NextResponse.json({
      success: true,
      enableNumberVerification: false,
      enableEmailVerification: false,
      seller: DEFAULT_SELLER,
    });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const db = await getDb();

    // 1. Auth settings update if provided
    if ('enableNumberVerification' in body || 'enableEmailVerification' in body) {
      const updateAuthDoc = {
        $set: {
          enableNumberVerification: Boolean(body.enableNumberVerification),
          enableEmailVerification: Boolean(body.enableEmailVerification),
          updatedAt: new Date(),
        },
      };

      await db.collection('settings').updateOne(
        { _id: 'auth_settings' },
        updateAuthDoc,
        { upsert: true }
      );
    }

    // 2. Seller settings update if provided
    if (body.seller && typeof body.seller === 'object') {
      const cleanedSeller = {
        companyName: (body.seller.companyName || 'Sonu Shoe').trim(),
        addressLine1: (body.seller.addressLine1 || '').trim(),
        addressLine2: (body.seller.addressLine2 || '').trim(),
        city: (body.seller.city || '').trim(),
        state: (body.seller.state || '').trim(),
        pincode: (body.seller.pincode || '').trim(),
        stateCode: (body.seller.stateCode || '10').trim(),
        country: (body.seller.country || 'India').trim(),
        phone: (body.seller.phone || '').trim(),
        email: (body.seller.email || '').trim(),
        gstin: (body.seller.gstin || '').trim(),
        signatureTitle: (body.seller.signatureTitle || 'Authorized Signature for Sonu Shoe').trim(),
        reverseCharge: (body.seller.reverseCharge || 'No').trim(),
        updatedAt: new Date(),
      };

      await db.collection('settings').updateOne(
        { _id: 'seller_settings' },
        { $set: cleanedSeller },
        { upsert: true }
      );
    }

    // Retrieve fresh settings
    const authDoc = await db.collection('settings').findOne({ _id: 'auth_settings' });
    const sellerDoc = await db.collection('settings').findOne({ _id: 'seller_settings' });

    return NextResponse.json({
      success: true,
      enableNumberVerification: authDoc?.enableNumberVerification === true,
      enableEmailVerification: authDoc?.enableEmailVerification === true,
      seller: {
        ...DEFAULT_SELLER,
        ...(sellerDoc ? { ...sellerDoc, _id: undefined } : {}),
      },
    });
  } catch (error) {
    console.error('[Admin Settings API] Error updating settings:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update settings' },
      { status: 500 }
    );
  }
}
