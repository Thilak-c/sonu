import { NextResponse } from 'next/server';
import { initDb } from '@/lib/mongodb';
import { trackShiprocketOrder, getShiprocketRemittanceDetails } from '@/lib/shiprocket';

export const dynamic = 'force-dynamic';

function mapShiprocketStatus(statusStr = '', statusId = null) {
  const s = String(statusStr).toUpperCase();
  const id = Number(statusId);

  if (id === 7 || s.includes('DELIVERED')) return 'delivered';
  if (id === 6 || id === 17 || id === 18 || s.includes('IN TRANSIT') || s.includes('SHIPPED') || s.includes('OUT FOR DELIVERY')) return 'in_transit';
  if (id === 3 || id === 4 || id === 19 || s.includes('PICKUP SCHEDULED') || s.includes('PICKED UP') || s.includes('PICKUP GENERATED') || s.includes('OUT FOR PICKUP')) return 'pickup_scheduled';
  if (id === 8 || id === 9 || id === 13 || id === 14 || id === 15 || id === 16 || s.includes('RTO') || s.includes('RETURN')) return 'rto';
  if (id === 5 || s.includes('CANCEL')) return 'cancelled';
  return null;
}

export async function POST(request) {
  try {
    const db = await initDb();

    // Find active orders that have an AWB assigned and are not yet cancelled
    const activeOrders = await db
      .collection('orders')
      .find({
        'shiprocket.awbCode': { $exists: true, $ne: null, $ne: '' },
        fulfillmentStatus: { $nin: ['cancelled', 'canceled'] },
      })
      .sort({ createdAt: -1 })
      .limit(30)
      .toArray();

    if (!activeOrders.length) {
      return NextResponse.json({ success: true, message: 'No active courier orders to sync', syncedCount: 0 });
    }

    const updates = [];

    // Parallel sync each active AWB with Shiprocket Production Tracking API
    await Promise.allSettled(
      activeOrders.map(async (order) => {
        const awbCode = order.shiprocket?.awbCode;
        if (!awbCode) return;

        try {
          const trackResult = await trackShiprocketOrder({
            awbCode,
            orderId: order.shiprocket?.orderId,
            shipmentId: order.shiprocket?.shipmentId,
          });

          const trackingData = trackResult?.tracking_data;
          const shipmentTrack = trackingData?.shipment_track?.[0];

          if (!shipmentTrack) return;

          const rawStatus = (shipmentTrack.current_status || shipmentTrack.status || '').toUpperCase();
          const statusId = shipmentTrack.current_status_id || shipmentTrack.status_id || null;
          const edd = shipmentTrack.edd || trackingData.etd || '';
          const courierName = shipmentTrack.courier_name || '';
          const activities = trackingData.shipment_track_activities || [];
          const mappedFulfillment = mapShiprocketStatus(rawStatus, statusId);

          const updateDoc = {
            'shiprocket.status': rawStatus,
            'shiprocket.currentStatus': shipmentTrack.current_status || rawStatus,
            'shiprocket.lastSyncedAt': new Date(),
            updatedAt: new Date(),
          };

          if (statusId) updateDoc['shiprocket.statusId'] = Number(statusId);
          if (courierName) updateDoc['shiprocket.courierName'] = courierName;
          if (edd) updateDoc['shiprocket.edd'] = edd;
          if (activities.length) updateDoc['shiprocket.activities'] = activities;
          const finalFulfillment = mappedFulfillment || order.fulfillmentStatus;
          if (mappedFulfillment) {
            updateDoc.fulfillmentStatus = mappedFulfillment;
            if (mappedFulfillment === 'delivered') {
              updateDoc.deliveredAt = shipmentTrack.delivered_date || new Date();
            }
          }

          // If order is delivered and has COD, fetch live remittance details
          const isCodOrder = order.payment?.method === 'cod' || order.payment?.method === 'full_cod' || order.payment?.method === 'partial_cod';
          if (finalFulfillment === 'delivered' && isCodOrder && order.shiprocket?.orderId) {
            try {
              const rem = await getShiprocketRemittanceDetails(order.shiprocket.orderId);
              if (rem?.success) {
                updateDoc['shiprocket.remittanceStatus'] = rem.remittanceStatus;
                updateDoc['shiprocket.remittanceUtr'] = rem.remittanceUtr;
                updateDoc['shiprocket.remittanceDate'] = rem.remittanceDate;
                if (rem.deliveredDate) updateDoc['shiprocket.deliveredDate'] = rem.deliveredDate;
                if (rem.invoiceNo) updateDoc['shiprocket.invoiceNo'] = rem.invoiceNo;
                if (rem.invoiceLink) updateDoc['shiprocket.invoiceLink'] = rem.invoiceLink;
              }
            } catch (remErr) {
              console.warn(`[Remittance fetch error for #${order.orderId}]:`, remErr.message);
            }
          }

          await db.collection('orders').updateOne({ orderId: order.orderId }, { $set: updateDoc });

          updates.push({
            orderId: order.orderId,
            awbCode,
            status: rawStatus,
            mappedFulfillment: mappedFulfillment || order.fulfillmentStatus,
          });
        } catch (err) {
          console.warn(`[Sync Error for Order #${order.orderId}]:`, err.message);
        }
      })
    );

    return NextResponse.json({
      success: true,
      syncedCount: updates.length,
      updates,
    });
  } catch (error) {
    console.error('[Shiprocket Orders Batch Sync Error]:', error);
    return NextResponse.json({ error: 'Failed to sync with Shiprocket', details: error.message }, { status: 500 });
  }
}

// Allow GET request to trigger sync as well
export async function GET(request) {
  return POST(request);
}
