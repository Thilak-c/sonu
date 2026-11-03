import crypto from 'crypto';

/**
 * Razorpay Payment Security & API Gateway Library for Sonu Admin
 */

export function getRazorpayCredentials() {
  const keyId = (process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '').trim();
  const keySecret = (process.env.RAZORPAY_KEY_SECRET || '').trim();

  if (!keyId || !keySecret) {
    throw new Error(
      'Razorpay credentials missing in Admin. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in admin/.env.local'
    );
  }

  const isLive = keyId.startsWith('rzp_live_');
  const isTest = keyId.startsWith('rzp_test_');

  return {
    keyId,
    keySecret,
    mode: isLive ? 'live' : isTest ? 'test' : 'custom',
    authHeader: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`,
  };
}

/**
 * Fetch raw payment details from Razorpay API
 */
export async function fetchRazorpayPayment(paymentId) {
  if (!paymentId) {
    throw new Error('Payment ID is required to fetch Razorpay payment');
  }

  const { authHeader, mode } = getRazorpayCredentials();
  const res = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}`, {
    method: 'GET',
    headers: {
      Authorization: authHeader,
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.description || `Failed to fetch payment ${paymentId} from Razorpay`);
  }

  return { ...data, gatewayMode: mode };
}

/**
 * Fetch order details from Razorpay API
 */
export async function fetchRazorpayOrder(orderId) {
  if (!orderId) {
    throw new Error('Order ID is required to fetch Razorpay order');
  }

  const { authHeader, mode } = getRazorpayCredentials();
  const res = await fetch(`https://api.razorpay.com/v1/orders/${orderId}`, {
    method: 'GET',
    headers: {
      Authorization: authHeader,
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.description || `Failed to fetch order ${orderId} from Razorpay`);
  }

  return { ...data, gatewayMode: mode };
}

/**
 * Verify & Recheck Payment status directly with Razorpay API
 */
export async function recheckRazorpayPayment(paymentId, expectedAmountInPaise, orderId) {
  const { mode } = getRazorpayCredentials();
  const paymentData = await fetchRazorpayPayment(paymentId);

  const expected = expectedAmountInPaise ? Math.round(Number(expectedAmountInPaise)) : null;
  const actual = Math.round(Number(paymentData.amount));
  const amountMatches = expected ? actual === expected : true;
  const orderMatches = orderId ? paymentData.order_id === orderId : true;

  return {
    success: true,
    mode,
    paymentId: paymentData.id,
    orderId: paymentData.order_id,
    status: paymentData.status,
    captured: paymentData.captured || paymentData.status === 'captured',
    method: paymentData.method,
    amount: paymentData.amount / 100,
    amountInPaise: paymentData.amount,
    currency: paymentData.currency,
    email: paymentData.email,
    contact: paymentData.contact,
    vpa: paymentData.vpa || paymentData.upi?.vpa || null,
    bank: paymentData.bank || null,
    wallet: paymentData.wallet || null,
    card: paymentData.card ? {
      network: paymentData.card.network,
      type: paymentData.card.type,
      last4: paymentData.card.last4,
    } : null,
    rrn: paymentData.acquirer_data?.rrn || paymentData.acquirer_data?.upi_transaction_id || null,
    fee: paymentData.fee ? paymentData.fee / 100 : 0,
    tax: paymentData.tax ? paymentData.tax / 100 : 0,
    createdAt: paymentData.created_at ? new Date(paymentData.created_at * 1000) : new Date(),
    discrepancies: {
      amountMismatch: !amountMatches,
      expectedAmount: expected ? expected / 100 : null,
      collectedAmount: actual / 100,
      orderMismatch: !orderMatches,
      notCaptured: paymentData.status !== 'captured',
    },
  };
}

