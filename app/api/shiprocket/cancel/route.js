import { NextResponse } from 'next/server';
import { initDb } from '@/lib/mongodb';
import { getShiprocketToken } from '@/lib/shiprocket';

export async function POST(request) {
  try {
    const { orderId, shiprocketOrderId } = await request.json();

    let targetSrId = shiprocketOrderId;
    const db = await initDb();

    if (!targetSrId && orderId) {
      const order = await db.collection('orders').findOne({ orderId });
      if (order && order.shiprocket?.orderId) {
        targetSrId = order.shiprocket.orderId;
      }
    }

    if (!targetSrId) {
      return NextResponse.json(
        { error: 'Shiprocket Order ID is required to cancel.' },
        { status: 400 }
      );
    }

    const base = process.env.SHIPROCKET_BASE_URL || 'https://apiv2.shiprocket.in/v1/external';
    const token = await getShiprocketToken();

    const res = await fetch(`${base}/orders/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ ids: [Number(targetSrId)] }),
    });

    const cancelResult = await res.json();
    if (!res.ok) {
      throw new Error(cancelResult.message || 'Failed to cancel order on Shiprocket');
    }

    // Update MongoDB
    if (orderId) {
      await db.collection('orders').updateOne(
        { orderId },
        {
          $set: {
            status: 'CANCELLED',
            fulfillmentStatus: 'cancelled',
            'shiprocket.status': 'CANCELLED',
            'shiprocket.cancelledAt': new Date(),
          },
        }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Order cancelled successfully on Shiprocket',
      data: cancelResult,
    });
  } catch (error) {
    console.error('Shiprocket cancel API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to cancel order on Shiprocket' },
      { status: 500 }
    );
  }
}
