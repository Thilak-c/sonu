import { NextResponse } from 'next/server';
import { checkShiprocketServiceability } from '@/lib/shiprocket';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const pincode = searchParams.get('pincode');
    const pickupPincode = searchParams.get('pickup_pincode');

    if (!pincode || !/^\d{6}$/.test(pincode)) {
      return NextResponse.json(
        { error: 'Valid 6-digit pincode is required', deliverable: false },
        { status: 400 }
      );
    }

    const data = await checkShiprocketServiceability(pincode, pickupPincode);
    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error('Shiprocket serviceability API error:', err);
    return NextResponse.json(
      {
        success: false,
        error: err.message || 'Serviceability check failed',
        data: {
          deliverable: true,
          city: 'Patna',
          state: 'Bihar',
          etd: 'Within 3-4 days',
          estimatedDays: '3',
        },
      },
      { status: 200 }
    );
  }
}
