import { NextResponse } from 'next/server';
import { initDb } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

const DEFAULT_TAXONOMIES = {
  categories: [
    'Women Running Shoe',
    'Women Sneaker',
  ],
  sports: [
    'Road Running',
    'Trail Running',
    'Court & Lifestyle',
    'Gym & Training',
    'Track & Field',
  ],
  returnPolicies: [
    '7 Days Exchange',
    '14 Days Easy Return',
    '30 Days Wear Trial',
    'Final Sale - No Returns',
  ],
};

export async function GET() {
  try {
    const db = await initDb();
    let doc = await db.collection('taxonomies').findOne({ _id: 'product_dropdowns' });
    if (!doc) {
      doc = {
        _id: 'product_dropdowns',
        ...DEFAULT_TAXONOMIES,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await db.collection('taxonomies').insertOne(doc);
    }

    return NextResponse.json({
      success: true,
      categories: Array.isArray(doc.categories) && doc.categories.length > 0 ? doc.categories : DEFAULT_TAXONOMIES.categories,
      sports: Array.isArray(doc.sports) && doc.sports.length > 0 ? doc.sports : DEFAULT_TAXONOMIES.sports,
      returnPolicies: Array.isArray(doc.returnPolicies) && doc.returnPolicies.length > 0 ? doc.returnPolicies : DEFAULT_TAXONOMIES.returnPolicies,
    });
  } catch (error) {
    console.error('[Admin Taxonomies GET Error]:', error);
    return NextResponse.json({
      success: true,
      ...DEFAULT_TAXONOMIES,
    });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { type, action, value } = body;

    const db = await initDb();

    let field = 'categories';
    if (type === 'sport' || type === 'sports') field = 'sports';
    else if (type === 'returnPolicy' || type === 'returnPolicies') field = 'returnPolicies';
    else field = 'categories';

    const cleanVal = (value || '').trim();
    if (!cleanVal) {
      return NextResponse.json({ error: 'Value is required' }, { status: 400 });
    }

    // Ensure doc exists
    let doc = await db.collection('taxonomies').findOne({ _id: 'product_dropdowns' });
    if (!doc) {
      await db.collection('taxonomies').insertOne({
        _id: 'product_dropdowns',
        ...DEFAULT_TAXONOMIES,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    if (action === 'add') {
      await db.collection('taxonomies').updateOne(
        { _id: 'product_dropdowns' },
        {
          $addToSet: { [field]: cleanVal },
          $set: { updatedAt: new Date() },
        }
      );
    } else if (action === 'remove') {
      await db.collection('taxonomies').updateOne(
        { _id: 'product_dropdowns' },
        {
          $pull: { [field]: cleanVal },
          $set: { updatedAt: new Date() },
        }
      );
    }

    const updatedDoc = await db.collection('taxonomies').findOne({ _id: 'product_dropdowns' });

    return NextResponse.json({
      success: true,
      categories: updatedDoc?.categories || DEFAULT_TAXONOMIES.categories,
      sports: updatedDoc?.sports || DEFAULT_TAXONOMIES.sports,
      returnPolicies: updatedDoc?.returnPolicies || DEFAULT_TAXONOMIES.returnPolicies,
    });
  } catch (error) {
    console.error('[Admin Taxonomies POST Error]:', error);
    return NextResponse.json(
      { error: 'Failed to update taxonomies', details: error.message },
      { status: 500 }
    );
  }
}
