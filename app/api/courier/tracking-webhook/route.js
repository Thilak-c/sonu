import { handleLogisticsWebhook } from '@/lib/logistics-webhook';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  return handleLogisticsWebhook(request);
}

export async function GET() {
  return NextResponse.json({
    status: 'ACTIVE',
    service: 'Sonu Shoe Logistics Webhook',
    message: 'Shiprocket tracking webhook endpoint is active and ready for POST updates.',
  });
}
