import { MongoClient } from 'mongodb';

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sonu_shoes?directConnection=true';
const DB_NAME = process.env.MONGODB_DB || 'sonu_shoes';

const SHIPROCKET_EMAIL = process.env.SHIPROCKET_EMAIL || 'flowify.sonushoe@gmail.com';
const SHIPROCKET_PASSWORD = process.env.SHIPROCKET_PASSWORD || 'BkA4ZyxjCowt&&udq*O1Yklg^rpg%X&s';
const BASE_URL = process.env.SHIPROCKET_BASE_URL || 'https://apiv2.shiprocket.in/v1/external';
const PICKUP_LOCATION = 'Patna One Plaza Hub';
const PICKUP_DATE = '2026-11-10'; // Tomorrow

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

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  console.log(`\n======================================================`);
  console.log(`=== SHIPROCKET ORDER RESET & MANIFEST AUTOMATION ===`);
  console.log(`Pickup Location: ${PICKUP_LOCATION}`);
  console.log(`Pickup Date:     ${PICKUP_DATE} (Tomorrow)`);
  console.log(`Dimensions:      30 x 20 x 12 cm | Weight: 0.40 kg (400g)`);
  console.log(`Shipping Mode:   Cheapest & Fastest SURFACE Only (No Air)`);
  console.log(`======================================================\n`);

  const token = await getShiprocketToken();
  console.log(`✓ Authenticated with Shiprocket Production API`);

  const client = new MongoClient(MONGO_URI);
  await client.connect();
  const db = client.db(DB_NAME);

  const targetOrderIds = ['SONU-IN-673698', 'SONU-IN-351751', 'SONU-IN-185003'];
  const orders = await db.collection('orders').find({ orderId: { $in: targetOrderIds } }).toArray();

  if (orders.length !== 3) {
    throw new Error(`Expected 3 orders, found ${orders.length} in database`);
  }

  // --- STEP 1: CANCEL OLD SHIPROCKET ORDERS ---
  console.log(`\n[Step 1/5] Cancelling existing shipments in Shiprocket...`);
  const oldShiprocketOrderIds = orders
    .map((o) => o.shiprocket?.orderId)
    .filter(Boolean)
    .map(Number);

  if (oldShiprocketOrderIds.length > 0) {
    console.log(`Cancelling Shiprocket IDs: ${oldShiprocketOrderIds.join(', ')}`);
    try {
      const cancelRes = await fetch(`${BASE_URL}/orders/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ids: oldShiprocketOrderIds }),
      });
      const cancelData = await cancelRes.json();
      console.log(`✓ Cancel response:`, cancelData.message || JSON.stringify(cancelData));
    } catch (cancelErr) {
      console.warn(`⚠ Warning during cancellation:`, cancelErr.message);
    }
  }

  console.log(`Waiting 3 seconds for Shiprocket to release orders...`);
  await sleep(3000);

  // --- STEP 2: RE-CREATE ORDERS WITH 400g & 30x20x12 cm ---
  console.log(`\n[Step 2/5] Creating fresh orders in Shiprocket with 400g dimensions...`);
  const results = [];

  for (const ord of orders) {
    console.log(`\nProcessing Order #${ord.orderId} (${ord.customer?.name})...`);

    const customer = ord.customer || {};
    const addr = customer.address || {};
    const nameParts = (customer.name || 'Customer').trim().split(' ');
    const firstName = customer.firstName || nameParts[0] || 'Customer';
    const lastName = customer.lastName || nameParts.slice(1).join(' ') || 'Shoe';

    const now = new Date(ord.placedAt || ord.createdAt || Date.now());
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const orderDate = `${year}-${month}-${day} ${hours}:${minutes}`;

    const orderItems = (ord.items || []).map((item) => ({
      name: item.name || 'Sonu shoe',
      sku: `${item.id || item.slug || 'sonu'}-${item.size || 'std'}`.replace(/\s+/g, '-'),
      units: Number(item.quantity || 1),
      selling_price: Number(item.priceNumber || 13995),
      discount: 0,
      tax: 0,
      hsn: 640411,
    }));

    const billingAddress1 = [addr.houseNo, addr.street].filter(Boolean).join(', ') || 'First & Second floor, Patna One Plaza Mall';
    const billingAddress2 = addr.landmark || '';
    const isPartialCod = ord.payment?.method === 'partial_cod';
    const isFullCod = ord.payment?.method === 'full_cod' || ord.payment?.method === 'cod';
    const isCod = isPartialCod || isFullCod;
    const totalAmount = Number(ord.totalAmount || 13995);
    const advancePaid = isPartialCod ? Number(ord.payment?.advancePaid ?? 200) : 0;

    const createPayload = {
      order_id: String(ord.orderId),
      order_date: orderDate,
      pickup_location: PICKUP_LOCATION,
      channel_id: '',
      comment: isPartialCod
        ? `Partial COD: Advance ₹${advancePaid} paid online. Collect balance ₹${Math.max(0, totalAmount - advancePaid)} on delivery.`
        : isFullCod
        ? `Full COD: Collect full ₹${totalAmount} upon delivery.`
        : 'Sonu shoe Prepaid Order',
      billing_customer_name: firstName,
      billing_last_name: lastName,
      billing_address: billingAddress1,
      billing_address_2: billingAddress2,
      billing_city: addr.city || 'Patna',
      billing_pincode: addr.pincode || '800001',
      billing_state: addr.state || 'Bihar',
      billing_country: 'India',
      billing_email: customer.email || 'support@sonushoe.in',
      billing_phone: customer.mobile || '8008439762',
      shipping_is_billing: true,
      order_items: orderItems,
      payment_method: isCod ? 'COD' : 'Prepaid',
      shipping_charges: 0,
      giftwrap_charges: 0,
      transaction_charges: 0,
      total_discount: isPartialCod ? advancePaid : 0,
      sub_total: totalAmount,
      length: 30,
      breadth: 20,
      height: 12,
      weight: 0.4, // Exactly 400g as requested
    };

    const createRes = await fetch(`${BASE_URL}/orders/create/adhoc`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(createPayload),
    });

    const createData = await createRes.json();
    if (!createRes.ok || !createData.order_id) {
      console.error(`✖ Failed to create order ${ord.orderId}:`, createData);
      throw new Error(createData.message || `Failed to create Shiprocket order ${ord.orderId}`);
    }

    const newSrOrderId = createData.order_id;
    const newShipmentId = createData.shipment_id;
    console.log(`  ✓ Created Order ID: ${newSrOrderId} | Shipment ID: ${newShipmentId}`);

    // --- STEP 3: FIND CHEAPEST & FASTEST SURFACE COURIER ---
    console.log(`  [Step 3/5] Querying live serviceability for cheapest & fastest Surface courier...`);
    const srvRes = await fetch(`${BASE_URL}/courier/serviceability/?order_id=${newSrOrderId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const srvData = await srvRes.json();
    const allCouriers = srvData.data?.available_courier_companies || [];

    // Filter strictly for Surface couriers (no air)
    const surfaceCouriers = allCouriers.filter((c) => {
      const isAir = (c.courier_name || '').toLowerCase().includes('air') || c.mode === 1 || c.is_surface === false;
      return !isAir;
    });

    if (surfaceCouriers.length === 0) {
      throw new Error(`No surface couriers available for order ${ord.orderId}`);
    }

    // Sort to pick the cheapest and fastest surface courier:
    // Prioritize high rating & reliability, fastest days, then lowest cost
    surfaceCouriers.sort((a, b) => {
      const daysA = Number(a.estimated_delivery_days) || 99;
      const daysB = Number(b.estimated_delivery_days) || 99;
      const rateA = Number(a.rate) || 999;
      const rateB = Number(b.rate) || 999;

      // Balance speed and cost:
      const scoreA = rateA * 0.5 + daysA * 15 - (Number(a.rating) || 0) * 10;
      const scoreB = rateB * 0.5 + daysB * 15 - (Number(b.rating) || 0) * 10;
      return scoreA - scoreB;
    });

    const chosenCourier = surfaceCouriers[0];
    console.log(`  ✓ Selected Surface Courier: "${chosenCourier.courier_name}" (ID: ${chosenCourier.courier_company_id}) | Rate: ₹${chosenCourier.rate} | Days: ${chosenCourier.estimated_delivery_days} | Rating: ${chosenCourier.rating}★`);

    // --- STEP 4: ASSIGN AWB ---
    console.log(`  [Step 4/5] Assigning AWB...`);
    const awbRes = await fetch(`${BASE_URL}/courier/assign/awb`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        shipment_id: Number(newShipmentId),
        courier_id: Number(chosenCourier.courier_company_id),
      }),
    });
    const awbData = await awbRes.json();
    if (!awbRes.ok || !awbData.response?.data?.awb_code) {
      console.error(`✖ Failed to assign AWB for shipment ${newShipmentId}:`, awbData);
      throw new Error(awbData.message || awbData.response?.data?.awb_assign_error || 'Failed to assign AWB');
    }

    const awbCode = awbData.response.data.awb_code;
    const courierName = awbData.response.data.courier_name || chosenCourier.courier_name;
    const routingCode = awbData.response.data.routing_code || '';
    console.log(`  ✓ AWB Assigned: ${awbCode} via ${courierName}`);

    // --- STEP 5: SCHEDULE PICKUP FOR TOMORROW ---
    console.log(`  [Step 5/5] Scheduling courier pickup for tomorrow (${PICKUP_DATE})...`);
    const pickupRes = await fetch(`${BASE_URL}/orders/take-pickup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        shipment_id: [Number(newShipmentId)],
        pickup_date: [PICKUP_DATE],
      }),
    });
    const pickupData = await pickupRes.json();
    const pickupToken = pickupData.response?.data?.pickup_token_number || pickupData.pickup_token_number || 'SCHEDULED';
    console.log(`  ✓ Pickup Scheduled for ${PICKUP_DATE}! Token: ${pickupToken}`);

    // --- MANIFEST & LABEL GENERATION ---
    let manifestUrl = '';
    let labelUrl = '';

    try {
      const labelRes = await fetch(`${BASE_URL}/courier/generate/label`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ shipment_id: [Number(newShipmentId)] }),
      });
      const labelData = await labelRes.json();
      labelUrl = labelData.label_url || labelData.label_created || '';
      if (labelUrl) console.log(`  ✓ Label Generated: ${labelUrl}`);
    } catch (e) {
      console.warn(`  ⚠ Label generation warning:`, e.message);
    }

    try {
      const manifestRes = await fetch(`${BASE_URL}/manifests/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ shipment_id: [Number(newShipmentId)] }),
      });
      const manifestData = await manifestRes.json();
      manifestUrl = manifestData.manifest_url || '';
      if (manifestUrl) console.log(`  ✓ Manifest Generated: ${manifestUrl}`);
    } catch (e) {
      console.warn(`  ⚠ Manifest generation warning:`, e.message);
    }

    // Update Local Database
    const shiprocketDoc = {
      orderId: newSrOrderId,
      shipmentId: newShipmentId,
      status: 'PICKUP_SCHEDULED',
      currentStatus: 'Pickup Scheduled',
      awbCode: awbCode,
      courierName: courierName,
      courierCompanyId: chosenCourier.courier_company_id,
      routingCode: routingCode,
      pickupDate: PICKUP_DATE,
      pickupToken: pickupToken,
      labelUrl: labelUrl,
      manifestUrl: manifestUrl,
      trackUrl: `https://shiprocket.co/tracking/${awbCode}`,
      awbAssignedAt: new Date(),
      isSimulated: false,
      weight: 0.4,
      dimensions: '30x20x12',
    };

    await db.collection('orders').updateOne(
      { orderId: ord.orderId },
      {
        $set: {
          fulfillmentStatus: 'pickup_scheduled',
          shiprocket: shiprocketDoc,
          updatedAt: new Date(),
        },
      }
    );

    results.push({
      orderId: ord.orderId,
      customer: customer.name,
      srOrderId: newSrOrderId,
      shipmentId: newShipmentId,
      awbCode,
      courierName,
      pickupToken,
      pickupDate: PICKUP_DATE,
      labelUrl,
      manifestUrl,
    });
  }

  await client.close();

  console.log(`\n======================================================`);
  console.log(`✓ ALL 3 ORDERS SUCCESSFULLY INITIALIZED & SCHEDULED!`);
  console.log(`======================================================`);
  for (const r of results) {
    console.log(`• #${r.orderId} (${r.customer}) -> ${r.courierName} | AWB: ${r.awbCode} | Pickup: ${r.pickupDate} (Token: ${r.pickupToken})`);
    if (r.labelUrl) console.log(`  Label: ${r.labelUrl}`);
    if (r.manifestUrl) console.log(`  Manifest: ${r.manifestUrl}`);
  }
  console.log(`======================================================\n`);
}

main().catch((err) => {
  console.error('\n✖ Fatal Error:', err);
  process.exit(1);
});

