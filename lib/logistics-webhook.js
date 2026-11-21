import { NextResponse } from 'next/server';
import { initDb } from './mongodb.js';

export const EXPECTED_TOKEN = process.env.COURIER_WEBHOOK_SECRET || 'sonu_logistics_live_secure_token_2026';

export function mapShiprocketStatus(statusStr = '', statusId = null) {
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

export async function handleLogisticsWebhook(request) {
  try {
    const headerKey =
      request.headers.get('x-api-key') ||
      request.headers.get('x-token') ||
      request.headers.get('authorization')?.replace('Bearer ', '') ||
      '';

    if (headerKey !== EXPECTED_TOKEN) {
      console.warn('[Shiprocket Webhook] Unauthorized access attempt with token:', headerKey);
      return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    console.log('[Shiprocket Webhook Received Payload]:', JSON.stringify(body));

    // Detect Shiprocket Test Webhook ping or sample payload
    const isSampleTest =
      !body ||
      Object.keys(body).length === 0 ||
      body.channel_order_id === 'enter your channel order id' ||
      body.channel === 'enter your channel name' ||
      body.courier_name === 'enter courier_name';

    if (isSampleTest) {
      return NextResponse.json({
        success: true,
        message: 'Shiprocket test webhook verified successfully! Real-time courier tracking listener is active.',
      });
    }

    const awbRaw = body.awb || body.awb_code || body.shipment_track?.[0]?.awb_code || '';
    const awb = awbRaw ? String(awbRaw).trim() : '';

    const rawChannelId = body.channel_order_id || (body.order_id && String(body.order_id).startsWith('SONU') ? body.order_id : '');
    const channelOrderId = rawChannelId ? String(rawChannelId).trim() : '';

    const srOrderIdRaw = body.order_id && !String(body.order_id).startsWith('SONU') ? body.order_id : body.sr_order_id;
    const srOrderId = srOrderIdRaw && !isNaN(Number(srOrderIdRaw)) ? Number(srOrderIdRaw) : null;

    const shipmentIdRaw = body.shipment_id || body.shipment_track?.[0]?.shipment_id;
    const shipmentId = shipmentIdRaw && !isNaN(Number(shipmentIdRaw)) ? Number(shipmentIdRaw) : null;

    const rawStatus = (body.current_status || body.shipment_status || body.status || '').toUpperCase();
    const statusId = body.current_status_id || body.shipment_status_id || body.status_id || null;
    const courierName = body.courier_name || body.shipment_track?.[0]?.courier_name || '';
    const edd = body.etd || body.edd || body.shipment_track?.[0]?.edd || '';
    const activities = body.scans || body.shipment_track_activities || [];
    const mappedFulfillment = mapShiprocketStatus(rawStatus, statusId);

    // Strip suffixes like -R1, -BD, -S1 to find the base order ID in MongoDB
    const cleanOrderId = channelOrderId ? channelOrderId.replace(/-[A-Z0-9]+$/, '') : null;

    const db = await initDb();
    const query = {
      $or: [
        ...(awb ? [{ 'shiprocket.awbCode': awb }, { trackingNumber: awb }] : []),
        ...(channelOrderId ? [{ orderId: channelOrderId }] : []),
        ...(cleanOrderId ? [{ orderId: cleanOrderId }] : []),
        ...(srOrderId ? [{ 'shiprocket.orderId': srOrderId }] : []),
        ...(shipmentId ? [{ 'shiprocket.shipmentId': shipmentId }] : []),
      ],
    };

    const updateDoc = {
      'shiprocket.status': rawStatus || 'IN_TRANSIT',
      'shiprocket.currentStatus': body.current_status || body.shipment_status || rawStatus,
      ...(statusId ? { 'shiprocket.statusId': Number(statusId) } : {}),
      ...(courierName ? { 'shiprocket.courierName': courierName } : {}),
      ...(awb ? { 'shiprocket.awbCode': awb, trackingNumber: awb } : {}),
      ...(edd ? { 'shiprocket.edd': edd } : {}),
      ...(activities.length ? { 'shiprocket.activities': activities } : {}),
      'shiprocket.lastSyncedAt': new Date(),
      updatedAt: new Date(),
    };

    if (mappedFulfillment) {
      updateDoc.fulfillmentStatus = mappedFulfillment;
      if (mappedFulfillment === 'delivered') {
        updateDoc.deliveredAt = body.current_timestamp ? new Date(body.current_timestamp) : new Date();
      }
    }

    const result = await db.collection('orders').updateOne(query, { $set: updateDoc });

    console.log(`[Shiprocket Webhook Synced] Matched: ${result.matchedCount}, AWB: ${awb || 'N/A'}, Status: ${rawStatus}`);

    return NextResponse.json({
      success: true,
      message: 'Tracking status updated successfully in MongoDB',
      matched: result.matchedCount,
      awb,
      status: rawStatus,
      mappedFulfillment,
    });
  } catch (err) {
    console.error('[Shiprocket Webhook Processing Error]:', err);
    return NextResponse.json({ error: 'Failed to process tracking webhook', details: err.message }, { status: 500 });
  }
}
