import { NextResponse } from 'next/server';
import { initDb } from '@/lib/mongodb';
import { trackShiprocketOrder, getShiprocketRemittanceDetails, getShiprocketToken } from '@/lib/shiprocket';

export const dynamic = 'force-dynamic';

function mapShiprocketStatus(statusStr = '', statusId = null) {
  const s = String(statusStr).toUpperCase();
  const id = Number(statusId);

  if (id === 7 || s.includes('DELIVERED')) return 'delivered';
  if (id === 6 || id === 17 || id === 18 || s.includes('IN TRANSIT') || s.includes('SHIPPED') || s.includes('OUT FOR DELIVERY')) return 'in_transit';
  if (
    id === 3 || id === 4 || id === 19 || id === 20 || id === 35 || id === 42 ||
    s.includes('PICKUP SCHEDULED') || s.includes('PICKED UP') || s.includes('PICKUP GENERATED') ||
    s.includes('OUT FOR PICKUP') || s.includes('PICKUP EXCEPTION') || s.includes('MANIFEST')
  ) return 'pickup_scheduled';
  if (id === 8 || id === 9 || id === 13 || id === 14 || id === 15 || id === 16 || s.includes('RTO') || s.includes('RETURN')) return 'rto';
  if (id === 5 || s.includes('CANCEL')) return 'cancelled';
  return null;
}

export async function POST(request) {
  try {
    const db = await initDb();
    const updates = [];

    // 1. Fetch recent active orders directly from Shiprocket to discover newly created or manifested shipments
    try {
      const base = process.env.SHIPROCKET_BASE_URL || 'https://apiv2.shiprocket.in/v1/external';
      const token = await getShiprocketToken();
      const srRes = await fetch(`${base}/orders?per_page=30`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (srRes.ok) {
        const srData = await srRes.json();
        const srOrders = Array.isArray(srData.data) ? srData.data : [];
        for (const sr of srOrders) {
          const rawChannel = sr.channel_order_id || '';
          const baseOrderId = rawChannel.replace(/-R\d+$/, '').replace(/-[A-Z0-9]+$/, '').trim();
          if (!baseOrderId) continue;

          const srStatus = (sr.status || '').toUpperCase();
          if (srStatus === 'CANCELED' || srStatus === 'CANCELLED') continue;

          const shipment = Array.isArray(sr.shipments) ? sr.shipments[0] : sr.shipments;
          const awb = sr.awb_code || shipment?.awb;
          const courier = sr.courier_name || shipment?.courier;
          const statusId = sr.status_code || shipment?.status;
          const mapped = mapShiprocketStatus(srStatus, statusId);

          if (awb || mapped) {
            const setFields = {
              'shiprocket.orderId': sr.id,
              'shiprocket.status': srStatus,
              'shiprocket.currentStatus': sr.status,
              'shiprocket.channelOrderId': rawChannel,
              'shiprocket.lastSyncedAt': new Date(),
              updatedAt: new Date(),
            };
            if (shipment?.id) setFields['shiprocket.shipmentId'] = shipment.id;
            if (awb) setFields['shiprocket.awbCode'] = awb;
            if (courier) setFields['shiprocket.courierName'] = courier;
            if (shipment?.manifest_url) setFields['shiprocket.manifestUrl'] = shipment.manifest_url;
            if (shipment?.label_url) setFields['shiprocket.labelUrl'] = shipment.label_url;
            if (shipment?.pickup_id) setFields['shiprocket.pickupId'] = shipment.pickup_id;
            if (mapped) setFields.fulfillmentStatus = mapped;

            const res = await db.collection('orders').updateOne(
              { orderId: baseOrderId },
              { $set: setFields }
            );
            if (res.modifiedCount > 0) {
              updates.push({ orderId: baseOrderId, awbCode: awb, status: srStatus, mappedFulfillment: mapped });
            }
          }
        }
      }
    } catch (srErr) {
      console.warn('[Sync Shiprocket Orders Discovery Warning]:', srErr.message);
    }

    // 2. Find active orders that have an AWB assigned in MongoDB
    const activeOrders = await db
      .collection('orders')
      .find({
        'shiprocket.awbCode': { $exists: true, $ne: null, $ne: '' },
        fulfillmentStatus: { $nin: ['cancelled', 'canceled'] },
      })
      .sort({ createdAt: -1 })
      .limit(30)
      .toArray();

    if (!activeOrders.length && !updates.length) {
      return NextResponse.json({ success: true, message: 'No active courier orders to sync', syncedCount: 0 });
    }

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
