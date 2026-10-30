import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

const DEFAULT_HOMEPAGE = {
  heroImage: '/images/hero-pool.webp',
  eyebrowTag: 'Sonu Shoe / Signature Drop 01',
  headline: 'FOR THE LONG WAY HOME.',
  description:
    'Small-run handcrafted luxury footwear engineered with ergonomic gum rubber soles and pebble-grain leather, built for all-day city walking.',
  primaryBtnText: 'Shop The 01',
  primaryBtnLink: '/product/drop-hybrid-men',
  secondaryBtnText: 'Explore Fresh Drops',
  secondaryBtnLink: '/#fresh-drops',
  announcementBarText: 'Free Express Shipping Across India On All Orders',
  enableAnnouncementBar: true,
};

const DEFAULT_CHECKOUT = {
  // Delivery & shipping rules
  freeDelivery: true,
  standardDeliveryFee: 99,
  freeDeliveryThreshold: 0,
  deliveryTimelineText: 'Express delivery in 3-5 business days across India',

  // Full COD (Cash On Delivery)
  enableFullCod: false,
  fullCodFee: 200,
  fullCodNote: 'Pay in full with cash or UPI directly to the delivery agent upon doorstep arrival. An additional COD handling fee applies.',

  // Partial COD (Advance deposit)
  enablePartialCod: true,
  partialCodAdvance: 200,
  partialCodNote: 'Pay a flat advance deposit online to confirm your order shipment. The remaining balance is paid to the courier upon delivery.',

  // Prepaid payment (UPI, Cards, NetBanking)
  enablePrepaid: true,
  prepaidDiscount: 0,
  prepaidNote: 'Fastest dispatch with zero extra handling fees.',
};

export async function GET() {
  try {
    const db = await getDb();
    const [authDoc, homepageDoc, checkoutDoc] = await Promise.all([
      db.collection('settings').findOne({ _id: 'auth_settings' }),
      db.collection('settings').findOne({ _id: 'homepage_settings' }),
      db.collection('settings').findOne({ _id: 'checkout_settings' }),
    ]);

    return NextResponse.json({
      success: true,
      enableNumberVerification: authDoc?.enableNumberVerification === true,
      enableEmailVerification: authDoc?.enableEmailVerification === true,
      homepage: {
        ...DEFAULT_HOMEPAGE,
        ...(homepageDoc ? { ...homepageDoc, _id: undefined } : {}),
      },
      checkout: {
        ...DEFAULT_CHECKOUT,
        ...(checkoutDoc ? { ...checkoutDoc, _id: undefined } : {}),
      },
    });
  } catch (error) {
    console.warn('[Settings API] Using fallback defaults:', error.message);
    return NextResponse.json({
      success: true,
      enableNumberVerification: false,
      enableEmailVerification: false,
      homepage: DEFAULT_HOMEPAGE,
      checkout: DEFAULT_CHECKOUT,
    });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { enableNumberVerification, enableEmailVerification } = body;

    const db = await getDb();
    const updateDoc = {
      $set: {
        enableNumberVerification: Boolean(enableNumberVerification),
        enableEmailVerification: Boolean(enableEmailVerification),
        updatedAt: new Date(),
      },
    };

    await db.collection('settings').updateOne(
      { _id: 'auth_settings' },
      updateDoc,
      { upsert: true }
    );

    return NextResponse.json({
      success: true,
      enableNumberVerification: Boolean(enableNumberVerification),
      enableEmailVerification: Boolean(enableEmailVerification),
    });
  } catch (error) {
    console.error('[Settings API] Error updating settings:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update settings' },
      { status: 500 }
    );
  }
}
