import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

const DEFAULT_SELLER = {
  companyName: 'Sonu Shoe',
  addressLine1: 'First and Second floor, Patna One Plaza Mall, New Dak Bunglow Rd',
  addressLine2: 'opp. Bharat Petrol Pump, Bander Bagicha, Fraser Road Area',
  city: 'Patna',
  state: 'Bihar',
  pincode: '800001',
  stateCode: '10',
  country: 'India',
  phone: '9122913620',
  email: 'support@sonushoe.in',
  gstin: '',
  signatureTitle: 'Authorized Signature for Sonu Shoe',
  reverseCharge: 'No',
};

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

const DEFAULT_SHIPROCKET = {
  pickupLocation: 'Patna One Plaza Hub',
  contactPerson: 'Mohammad Shamshad',
  contactPhone: '9122913620',
  addressLine1: 'First and Second floor, Patna One Plaza Mall, New Dak Bunglow Rd',
  addressLine2: 'opp. Bharat Petrol Pump, Bander Bagicha, Fraser Road Area',
  city: 'Patna',
  state: 'Bihar',
  pincode: '800001',
  country: 'India',

  // Single shoe package (1 Unit)
  singleLength: 30,
  singleBreadth: 20,
  singleHeight: 12,
  singleWeight: 0.9,

  // Two shoes package (2 Units)
  doubleLength: 35,
  doubleBreadth: 28,
  doubleHeight: 24,
  doubleWeight: 1.8,

  // Multi-unit rules (3+ items)
  additionalWeightPerUnit: 0.9,
  additionalHeightPerUnit: 12,

  // Courier
  courierPreference: 'Delhivery Surface Express',
  isMockMode: false,
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
    const [authDoc, sellerDoc, homepageDoc, shiprocketDoc, checkoutDoc] = await Promise.all([
      db.collection('settings').findOne({ _id: 'auth_settings' }),
      db.collection('settings').findOne({ _id: 'seller_settings' }),
      db.collection('settings').findOne({ _id: 'homepage_settings' }),
      db.collection('settings').findOne({ _id: 'shiprocket_settings' }),
      db.collection('settings').findOne({ _id: 'checkout_settings' }),
    ]);

    return NextResponse.json({
      success: true,
      enableNumberVerification: authDoc?.enableNumberVerification === true,
      enableEmailVerification: authDoc?.enableEmailVerification === true,
      seller: {
        ...DEFAULT_SELLER,
        ...(sellerDoc ? { ...sellerDoc, _id: undefined } : {}),
      },
      homepage: {
        ...DEFAULT_HOMEPAGE,
        ...(homepageDoc ? { ...homepageDoc, _id: undefined } : {}),
      },
      shiprocket: {
        ...DEFAULT_SHIPROCKET,
        ...(shiprocketDoc ? { ...shiprocketDoc, _id: undefined } : {}),
      },
      checkout: {
        ...DEFAULT_CHECKOUT,
        ...(checkoutDoc ? { ...checkoutDoc, _id: undefined } : {}),
      },
    });
  } catch (error) {
    console.warn('[Admin Settings API] Using fallback defaults:', error.message);
    return NextResponse.json({
      success: true,
      enableNumberVerification: false,
      enableEmailVerification: false,
      seller: DEFAULT_SELLER,
      homepage: DEFAULT_HOMEPAGE,
      shiprocket: DEFAULT_SHIPROCKET,
      checkout: DEFAULT_CHECKOUT,
    });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const db = await getDb();

    // 1. Auth settings
    if ('enableNumberVerification' in body || 'enableEmailVerification' in body) {
      await db.collection('settings').updateOne(
        { _id: 'auth_settings' },
        {
          $set: {
            enableNumberVerification: Boolean(body.enableNumberVerification),
            enableEmailVerification: Boolean(body.enableEmailVerification),
            updatedAt: new Date(),
          },
        },
        { upsert: true }
      );
    }

    // 2. Seller settings
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

    // 3. Homepage settings
    if (body.homepage && typeof body.homepage === 'object') {
      const cleanedHomepage = {
        heroImage: (body.homepage.heroImage || DEFAULT_HOMEPAGE.heroImage).trim(),
        eyebrowTag: (body.homepage.eyebrowTag || DEFAULT_HOMEPAGE.eyebrowTag).trim(),
        headline: (body.homepage.headline || DEFAULT_HOMEPAGE.headline).trim(),
        description: (body.homepage.description || DEFAULT_HOMEPAGE.description).trim(),
        primaryBtnText: (body.homepage.primaryBtnText || DEFAULT_HOMEPAGE.primaryBtnText).trim(),
        primaryBtnLink: (body.homepage.primaryBtnLink || DEFAULT_HOMEPAGE.primaryBtnLink).trim(),
        secondaryBtnText: (body.homepage.secondaryBtnText || DEFAULT_HOMEPAGE.secondaryBtnText).trim(),
        secondaryBtnLink: (body.homepage.secondaryBtnLink || DEFAULT_HOMEPAGE.secondaryBtnLink).trim(),
        announcementBarText: (body.homepage.announcementBarText || DEFAULT_HOMEPAGE.announcementBarText).trim(),
        enableAnnouncementBar: body.homepage.enableAnnouncementBar !== false,
        updatedAt: new Date(),
      };

      await db.collection('settings').updateOne(
        { _id: 'homepage_settings' },
        { $set: cleanedHomepage },
        { upsert: true }
      );
    }

    // 4. Shiprocket settings
    if (body.shiprocket && typeof body.shiprocket === 'object') {
      const cleanedShiprocket = {
        pickupLocation: (body.shiprocket.pickupLocation || DEFAULT_SHIPROCKET.pickupLocation).trim(),
        contactPerson: (body.shiprocket.contactPerson || DEFAULT_SHIPROCKET.contactPerson).trim(),
        contactPhone: (body.shiprocket.contactPhone || DEFAULT_SHIPROCKET.contactPhone).trim(),
        addressLine1: (body.shiprocket.addressLine1 || DEFAULT_SHIPROCKET.addressLine1).trim(),
        addressLine2: (body.shiprocket.addressLine2 || '').trim(),
        city: (body.shiprocket.city || DEFAULT_SHIPROCKET.city).trim(),
        state: (body.shiprocket.state || DEFAULT_SHIPROCKET.state).trim(),
        pincode: (body.shiprocket.pincode || DEFAULT_SHIPROCKET.pincode).trim(),
        country: (body.shiprocket.country || 'India').trim(),

        singleLength: Number(body.shiprocket.singleLength) || 30,
        singleBreadth: Number(body.shiprocket.singleBreadth) || 20,
        singleHeight: Number(body.shiprocket.singleHeight) || 12,
        singleWeight: Number(body.shiprocket.singleWeight) || 0.9,

        doubleLength: Number(body.shiprocket.doubleLength) || 35,
        doubleBreadth: Number(body.shiprocket.doubleBreadth) || 28,
        doubleHeight: Number(body.shiprocket.doubleHeight) || 24,
        doubleWeight: Number(body.shiprocket.doubleWeight) || 1.8,

        additionalWeightPerUnit: Number(body.shiprocket.additionalWeightPerUnit) || 0.9,
        additionalHeightPerUnit: Number(body.shiprocket.additionalHeightPerUnit) || 12,

        courierPreference: (body.shiprocket.courierPreference || DEFAULT_SHIPROCKET.courierPreference).trim(),
        isMockMode: false,
        updatedAt: new Date(),
      };

      await db.collection('settings').updateOne(
        { _id: 'shiprocket_settings' },
        { $set: cleanedShiprocket },
        { upsert: true }
      );
    }

    // 5. Checkout & Payments settings
    if (body.checkout && typeof body.checkout === 'object') {
      const cleanedCheckout = {
        freeDelivery: body.checkout.freeDelivery !== false,
        standardDeliveryFee: Number(body.checkout.standardDeliveryFee) >= 0 ? Number(body.checkout.standardDeliveryFee) : 99,
        freeDeliveryThreshold: Number(body.checkout.freeDeliveryThreshold) >= 0 ? Number(body.checkout.freeDeliveryThreshold) : 0,
        deliveryTimelineText: (body.checkout.deliveryTimelineText || DEFAULT_CHECKOUT.deliveryTimelineText).trim(),

        enableFullCod: Boolean(body.checkout.enableFullCod),
        fullCodFee: Number(body.checkout.fullCodFee) >= 0 ? Number(body.checkout.fullCodFee) : 200,
        fullCodNote: (body.checkout.fullCodNote || DEFAULT_CHECKOUT.fullCodNote).trim(),

        enablePartialCod: body.checkout.enablePartialCod !== false,
        partialCodAdvance: Number(body.checkout.partialCodAdvance) > 0 ? Number(body.checkout.partialCodAdvance) : 200,
        partialCodNote: (body.checkout.partialCodNote || DEFAULT_CHECKOUT.partialCodNote).trim(),

        enablePrepaid: body.checkout.enablePrepaid !== false,
        prepaidDiscount: Number(body.checkout.prepaidDiscount) >= 0 ? Number(body.checkout.prepaidDiscount) : 0,
        prepaidNote: (body.checkout.prepaidNote || DEFAULT_CHECKOUT.prepaidNote).trim(),
        updatedAt: new Date(),
      };

      await db.collection('settings').updateOne(
        { _id: 'checkout_settings' },
        { $set: cleanedCheckout },
        { upsert: true }
      );
    }

    // Retrieve fresh settings
    const [authDoc, sellerDoc, homepageDoc, shiprocketDoc, checkoutDoc] = await Promise.all([
      db.collection('settings').findOne({ _id: 'auth_settings' }),
      db.collection('settings').findOne({ _id: 'seller_settings' }),
      db.collection('settings').findOne({ _id: 'homepage_settings' }),
      db.collection('settings').findOne({ _id: 'shiprocket_settings' }),
      db.collection('settings').findOne({ _id: 'checkout_settings' }),
    ]);

    return NextResponse.json({
      success: true,
      enableNumberVerification: authDoc?.enableNumberVerification === true,
      enableEmailVerification: authDoc?.enableEmailVerification === true,
      seller: {
        ...DEFAULT_SELLER,
        ...(sellerDoc ? { ...sellerDoc, _id: undefined } : {}),
      },
      homepage: {
        ...DEFAULT_HOMEPAGE,
        ...(homepageDoc ? { ...homepageDoc, _id: undefined } : {}),
      },
      shiprocket: {
        ...DEFAULT_SHIPROCKET,
        ...(shiprocketDoc ? { ...shiprocketDoc, _id: undefined } : {}),
      },
      checkout: {
        ...DEFAULT_CHECKOUT,
        ...(checkoutDoc ? { ...checkoutDoc, _id: undefined } : {}),
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
