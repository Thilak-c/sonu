import { MongoClient } from 'mongodb';

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sonu_shoes?directConnection=true';
const DB_NAME = process.env.MONGODB_DB || 'sonu_shoes';

const SHIPROCKET_EMAIL = process.env.SHIPROCKET_EMAIL || 'flowify.sonushoe@gmail.com';
const SHIPROCKET_PASSWORD = process.env.SHIPROCKET_PASSWORD || 'BkA4ZyxjCowt&&udq*O1Yklg^rpg%X&s';
const BASE_URL = process.env.SHIPROCKET_BASE_URL || 'https://apiv2.shiprocket.in/v1/external';

async function getShiprocketToken() {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: SHIPROCKET_EMAIL, password: SHIPROCKET_PASSWORD }),
  });
  const data = await res.json();
  if (!res.ok || !data.token) {
    throw new Error(data.message || 'Failed to authenticate with Shiprocket Production API');
  }
  return data.token;
}

async function main() {
  console.log(`\n=== SHIPROCKET REAL-TIME ORDER SYNC ===`);
  console.log(`Connecting to Shiprocket API (${SHIPROCKET_EMAIL})...`);

  const token = await getShiprocketToken();
  console.log(`✓ Authenticated with Shiprocket Production API`);

  const client = new MongoClient(MONGO_URI);
  await client.connect();
  const db = client.db(DB_NAME);

  // Find all active orders with AWB or shipmentId
  const orders = await db
    .collection('orders')
    .find({
      $or: [
        { 'shiprocket.awbCode': { $exists: true, $ne: null } },
        { 'shiprocket.shipmentId': { $exists: true, $ne: null } },
      ],
      fulfillmentStatus: { $ne: 'cancelled' },
    })
    .sort({ createdAt: -1 })
    .toArray();

  console.log(`Found ${orders.length} active shipments in database.\n`);

  let updatedCount = 0;

  for (const ord of orders) {
    const awb = ord.shiprocket?.awbCode;
    const shipmentId = ord.shiprocket?.shipmentId;
    const customerName = ord.customer?.name || 'Customer';

    console.log(`[Syncing] #${ord.orderId} (${customerName}) | AWB: ${awb || 'None'}`);

    if (awb) {
      try {
        const res = await fetch(`${BASE_URL}/courier/track/awb/${encodeURIComponent(awb)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const trackData = await res.json();

        if (res.ok && trackData?.tracking_data) {
          const details = trackData.tracking_data;
          const shipmentTrack = details.shipment_track?.[0] || {};
          const currentStatus = shipmentTrack.current_status || 'AWB Assigned';
          const statusId = shipmentTrack.current_status_id || details.shipment_status;
          const courier = shipmentTrack.courier_name || ord.shiprocket?.courierName;
          const edd = shipmentTrack.edd || details.etd || '';
          const trackUrl = details.track_url || `https://shiprocket.co/tracking/${awb}`;
          const activities = details.shipment_track_activities || [];

          // Map Shiprocket Status Code to internal fulfillmentStatus
          let nextFulfillmentStatus = ord.fulfillmentStatus;
          if (statusId === 6 || currentStatus.toLowerCase().includes('delivered')) {
            nextFulfillmentStatus = 'delivered';
          } else if (statusId === 7 || statusId === 8 || statusId === 9 || currentStatus.toLowerCase().includes('in transit') || currentStatus.toLowerCase().includes('out for delivery')) {
            nextFulfillmentStatus = 'in_transit';
          } else if (statusId === 19 || statusId === 18 || currentStatus.toLowerCase().includes('pickup scheduled')) {
            nextFulfillmentStatus = 'pickup_scheduled';
          }

          const updateFields = {
            'shiprocket.currentStatus': currentStatus,
            'shiprocket.statusId': statusId,
            'shiprocket.courierName': courier,
            'shiprocket.edd': edd,
            'shiprocket.trackUrl': trackUrl,
            'shiprocket.activities': activities,
            'shiprocket.lastSyncedAt': new Date(),
          };

          if (nextFulfillmentStatus !== ord.fulfillmentStatus) {
            updateFields.fulfillmentStatus = nextFulfillmentStatus;
          }

          await db.collection('orders').updateOne(
            { orderId: ord.orderId },
            { $set: updateFields }
          );

          console.log(`  ✓ Updated Status: "${currentStatus}" (Status ID: ${statusId}) | Courier: ${courier} | EDD: ${edd || 'N/A'}`);
          updatedCount++;
        } else {
          console.log(`  ⚠ Shiprocket track returned: ${trackData?.message || 'No tracking info'}`);
        }
      } catch (err) {
        console.warn(`  ✖ Failed to track AWB ${awb}:`, err.message);
      }
    }
  }

  await client.close();
  console.log(`\n========================================`);
  console.log(`✓ Shiprocket Order Sync Complete! (${updatedCount} shipments updated)`);
  console.log(`========================================\n`);
}

main().catch((err) => {
  console.error('[Shiprocket Sync Error]:', err);
  process.exit(1);
});
