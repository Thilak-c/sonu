import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = await getDb();
    const doc = await db.collection('settings').findOne({ _id: 'auth_settings' });
    return NextResponse.json({
      success: true,
      enableNumberVerification: doc?.enableNumberVerification === true,
      enableEmailVerification: doc?.enableEmailVerification === true,
    });
  } catch (error) {
    console.warn('[Settings API] Using fallback defaults:', error.message);
    return NextResponse.json({
      success: true,
      enableNumberVerification: false,
      enableEmailVerification: false,
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
