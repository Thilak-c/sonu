// Shiprocket API Client & Real-time Serviceability Engine for SONU Shoes
let cachedToken = null;
let tokenExpiry = null;

export async function getShiprocketToken() {
  if (cachedToken && tokenExpiry && Date.now() < tokenExpiry) {
    return cachedToken;
  }

  const base = process.env.SHIPROCKET_BASE_URL || 'https://apiv2.shiprocket.in/v1/external';
  const email = process.env.SHIPROCKET_EMAIL || 'imdyashodanand2006@gmail.com';
  const password = process.env.SHIPROCKET_PASSWORD || 'sw0pXbiq24N9ygz^9W#0484Ud6!PKTv1';

  const res = await fetch(`${base}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();
  if (!res.ok || !data.token) {
    throw new Error(data.message || 'Failed to authenticate with Shiprocket');
  }

  cachedToken = data.token;
  tokenExpiry = Date.now() + 23 * 60 * 60 * 1000;
  return cachedToken;
}

export async function checkShiprocketServiceability(deliveryPincode, pickupPincode = null, weight = '0.9') {
  const pickup = pickupPincode || process.env.SHIPROCKET_PICKUP_PINCODE || '800013';
  const base = process.env.SHIPROCKET_BASE_URL || 'https://apiv2.shiprocket.in/v1/external';

  let token = null;
  let shiprocketData = null;

  try {
    token = await getShiprocketToken();
    const query = new URLSearchParams({
      pickup_postcode: pickup,
      delivery_postcode: deliveryPincode,
      cod: '1',
      weight: weight.toString(),
    }).toString();

    const res = await fetch(`${base}/courier/serviceability/?${query}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.ok) {
      shiprocketData = await res.json();
    }
  } catch (err) {
    console.error('Shiprocket API error:', err.message);
  }

  const couriers = shiprocketData?.data?.available_courier_companies || [];
  const primaryCourier = couriers[0] || null;

  let city = primaryCourier?.city || '';
  let state = primaryCourier?.state || '';
  const etd = primaryCourier?.etd || '';
  const estimatedDays = primaryCourier?.estimated_delivery_days || '';
  const courierName = primaryCourier?.courier_name || '';

  // Reverse postal lookup if city/state wasn't provided in courier response
  if (!city || !state) {
    try {
      const postRes = await fetch(`https://api.postalpincode.in/pincode/${deliveryPincode}`);
      if (postRes.ok) {
        const postData = await postRes.json();
        const postOffice = postData?.[0]?.PostOffice?.[0];
        if (postOffice) {
          if (!city) city = postOffice.District || postOffice.Block || postOffice.Division || '';
          if (!state) state = postOffice.State || '';
        }
      }
    } catch (postErr) {
      console.error('Postal pincode lookup error:', postErr.message);
    }
  }

  // Format state & city properly
  if (state) {
    state = state
      .toLowerCase()
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
  if (city) {
    city = city
      .toLowerCase()
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  const isDeliverable = couriers.length > 0;

  return {
    deliverable: isDeliverable,
    pincode: deliveryPincode,
    city: city || '',
    state: state || '',
    etd: isDeliverable ? (etd || (estimatedDays ? `In ${estimatedDays} days` : '')) : '',
    estimatedDays: isDeliverable ? (estimatedDays || '') : '',
    courierName: courierName || '',
    codAvailable: couriers.some((c) => c.cod === 1 || c.cod === true),
    courierCount: couriers.length,
    message: isDeliverable
      ? `Delivery available via ${courierName || 'Shiprocket'}`
      : 'Delivery not available to this PIN code',
  };
}

/**
 * Automatically pushes an order to Shiprocket
 * @param {Object} order - Full order document
 * @returns {Promise<Object>} Shiprocket response with shipment_id and order_id
 */
export async function createShiprocketOrder(order) {
  const base = process.env.SHIPROCKET_BASE_URL || 'https://apiv2.shiprocket.in/v1/external';
  const pickupLocation = process.env.SHIPROCKET_PICKUP_LOCATION || 'Home';

  const token = await getShiprocketToken();

  const customer = order.customer || {};
  const addr = customer.address || {};
  const nameParts = (customer.name || 'Customer').trim().split(' ');
  const firstName = customer.firstName || nameParts[0] || 'Customer';
  const lastName = customer.lastName || nameParts.slice(1).join(' ') || 'Shoe';

  // Format order date: "YYYY-MM-DD HH:mm"
  const now = new Date(order.placedAt || Date.now());
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const orderDate = `${year}-${month}-${day} ${hours}:${minutes}`;

  // Map items to Shiprocket order items
  const orderItems = (order.items || []).map((item) => ({
    name: item.name || 'SONU Shoes',
    sku: `${item.id || item.slug || 'sonu'}-${item.size || 'std'}`.replace(/\s+/g, '-'),
    units: Number(item.quantity || 1),
    selling_price: Number(item.priceNumber || 13995),
    discount: 0,
    tax: 0,
    hsn: 640411,
  }));

  const billingAddress1 = [addr.houseNo, addr.street].filter(Boolean).join(', ') || '34 Rd Number 2, Nehru Nagar';
  const billingAddress2 = addr.landmark || '';

  const isPartialCod = order.payment?.method === 'partial_cod' || order.payment?.method === 'cod';
  const totalAmount = Number(order.totalAmount || 13995);
  const advancePaid = isPartialCod ? Number(order.payment?.advancePaid ?? 200) : 0;
  const balanceDue = Math.max(0, totalAmount - advancePaid);

  const payload = {
    order_id: String(order.orderId),
    order_date: orderDate,
    pickup_location: pickupLocation,
    channel_id: '',
    comment: isPartialCod
      ? `Partial COD: Advance ₹${advancePaid} paid online. Collect balance ₹${balanceDue} on delivery.`
      : 'SONU Shoes Order',
    billing_customer_name: firstName,
    billing_last_name: lastName,
    billing_address: billingAddress1,
    billing_address_2: billingAddress2,
    billing_city: addr.city || 'Patna',
    billing_pincode: addr.pincode || '800001',
    billing_state: addr.state || 'Bihar',
    billing_country: 'India',
    billing_email: customer.email || 'Support@sonushoe.in',
    billing_phone: customer.mobile || '9182390192',
    shipping_is_billing: true,
    order_items: orderItems,
    payment_method: isPartialCod ? 'COD' : 'Prepaid',
    shipping_charges: 0,
    giftwrap_charges: 0,
    transaction_charges: 0,
    total_discount: isPartialCod ? advancePaid : 0,
    sub_total: totalAmount,
    length: 30,
    breadth: 20,
    height: 12,
    weight: 0.9,
  };

  const res = await fetch(`${base}/orders/create/adhoc`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok) {
    console.error('Shiprocket order creation error:', data);
    throw new Error(
      data.message ||
        (data.errors ? JSON.stringify(data.errors) : 'Failed to create Shiprocket order')
    );
  }

  return data;
}

/**
 * Cancels an order on Shiprocket
 * @param {number|string} shiprocketOrderId - The numeric order_id returned by Shiprocket
 */
export async function cancelShiprocketOrder(shiprocketOrderId) {
  const base = process.env.SHIPROCKET_BASE_URL || 'https://apiv2.shiprocket.in/v1/external';
  const token = await getShiprocketToken();

  const res = await fetch(`${base}/orders/cancel`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ ids: [Number(shiprocketOrderId)] }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to cancel order on Shiprocket');
  }
  return data;
}

/**
 * Tracks an order or shipment on Shiprocket
 * @param {Object} options - { orderId, shipmentId, awbCode }
 * @returns {Promise<Object>} Tracking details from Shiprocket
 */
export async function trackShiprocketOrder({ orderId, shipmentId, awbCode }) {
  const base = process.env.SHIPROCKET_BASE_URL || 'https://apiv2.shiprocket.in/v1/external';
  const token = await getShiprocketToken();

  let url = '';
  if (awbCode) {
    url = `${base}/courier/track/awb/${encodeURIComponent(awbCode)}`;
  } else if (shipmentId) {
    url = `${base}/courier/track/shipment/${encodeURIComponent(shipmentId)}`;
  } else if (orderId) {
    url = `${base}/courier/track?order_id=${encodeURIComponent(orderId)}`;
  } else {
    throw new Error('Order ID, Shipment ID, or AWB Code required for tracking');
  }

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json();
  return data;
}
