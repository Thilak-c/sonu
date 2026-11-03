import crypto from 'crypto';

/**
 * Razorpay Payment Security & API Gateway Library
 * Handles credential management, signature verification, server-to-server payment rechecks,
 * auto-capture, and webhook verification.
 */

export function getRazorpayCredentials() {
  const keyId = (process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '').trim();
  const keySecret = (process.env.RAZORPAY_KEY_SECRET || '').trim();

  if (!keyId || !keySecret) {
    throw new Error(
      'Razorpay credentials missing. Please define RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env.local'
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
 * Create an order on Razorpay Orders API
 */
export async function createRazorpayOrder({ amountInPaise, receipt, notes = {} }) {
  const { authHeader, keyId, mode } = getRazorpayCredentials();

  if (!amountInPaise || amountInPaise <= 0) {
    throw new Error('Invalid amount in paise for Razorpay order');
  }

  const res = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      Authorization: authHeader,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: Math.round(amountInPaise),
      currency: 'INR',
      receipt: String(receipt || '').slice(0, 40),
      notes,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.description || 'Failed to create order on Razorpay');
  }

  return {
    orderId: data.id,
    amount: data.amount,
    currency: data.currency,
    receipt: data.receipt,
    keyId,
    mode,
  };
}

/**
 * Verify Razorpay standard checkout payment signature
 */
export function verifyRazorpaySignature({ razorpayOrderId, razorpayPaymentId, razorpaySignature }) {
  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    return false;
  }

  const { keySecret } = getRazorpayCredentials();
  const expectedSignature = crypto
    .createHmac('sha256', keySecret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex');

  return expectedSignature === razorpaySignature;
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
 * Capture an authorized payment if not already captured
 */
export async function captureRazorpayPayment(paymentId, amountInPaise, currency = 'INR') {
  const { authHeader } = getRazorpayCredentials();

  const res = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}/capture`, {
    method: 'POST',
    headers: {
      Authorization: authHeader,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: Math.round(amountInPaise),
      currency,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.description || `Failed to capture payment ${paymentId}`);
  }

  return data;
}

/**
 * Bulletproof Payment Verification:
 * 1. Checks signature
 * 2. Directly fetches payment entity from Razorpay API
 * 3. Captures payment if authorized
 * 4. Strictly checks status === 'captured', currency === 'INR', amount match, order_id match
 */
export async function verifyAndRecheckPayment({
  razorpayPaymentId,
  razorpayOrderId,
  razorpaySignature,
  expectedAmountInPaise,
}) {
  const errors = [];

  // 1. Signature Check
  if (razorpaySignature) {
    const isSigValid = verifyRazorpaySignature({
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    });
    if (!isSigValid) {
      errors.push('Cryptographic signature mismatch. Untrusted payment attempt.');
    }
  } else {
    errors.push('Razorpay payment signature missing.');
  }

  // 2. Direct Server-to-Server API check
  let paymentData = null;
  try {
    paymentData = await fetchRazorpayPayment(razorpayPaymentId);
  } catch (fetchErr) {
    errors.push(`Gateway payment query failed: ${fetchErr.message}`);
    return {
      isVerified: false,
      errors,
      payment: null,
    };
  }

  // 3. Auto-capture if payment is in 'authorized' state
  if (paymentData.status === 'authorized') {
    try {
      paymentData = await captureRazorpayPayment(
        razorpayPaymentId,
        paymentData.amount,
        paymentData.currency
      );
      console.log(`[Razorpay] Successfully auto-captured authorized payment ${razorpayPaymentId}`);
    } catch (capErr) {
      errors.push(`Auto-capture failed: ${capErr.message}`);
    }
  }

  // 4. Verify payment status is captured
  if (paymentData.status !== 'captured') {
    errors.push(
      `Payment is not captured. Current gateway status is '${paymentData.status}'. Reason: ${
        paymentData.error_description || 'Uncaptured funds'
      }`
    );
  }

  // 5. Verify currency
  if (paymentData.currency !== 'INR') {
    errors.push(`Invalid payment currency '${paymentData.currency}'. Expected 'INR'.`);
  }

  // 6. Verify amount (allow tolerance of 0 paise)
  if (expectedAmountInPaise !== undefined && expectedAmountInPaise !== null) {
    const expected = Math.round(Number(expectedAmountInPaise));
    const actual = Math.round(Number(paymentData.amount));
    if (actual !== expected) {
      errors.push(
        `Payment amount mismatch! Expected ₹${(expected / 100).toFixed(2)} (${expected} paise), but gateway collected ₹${(actual / 100).toFixed(2)} (${actual} paise).`
      );
    }
  }

  // 7. Verify order_id binding
  if (razorpayOrderId && paymentData.order_id && paymentData.order_id !== razorpayOrderId) {
    errors.push(
      `Razorpay Order ID mismatch! Expected '${razorpayOrderId}', but payment is linked to '${paymentData.order_id}'.`
    );
  }

  const isVerified = errors.length === 0 && paymentData.status === 'captured';

  return {
    isVerified,
    errors,
    mode: paymentData.id.startsWith('pay_') && paymentData.gatewayMode ? paymentData.gatewayMode : 'unknown',
    payment: {
      id: paymentData.id,
      orderId: paymentData.order_id,
      status: paymentData.status,
      method: paymentData.method,
      amount: paymentData.amount / 100,
      amountInPaise: paymentData.amount,
      currency: paymentData.currency,
      email: paymentData.email,
      contact: paymentData.contact,
      vpa: paymentData.vpa || paymentData.upi?.vpa || null,
      bank: paymentData.bank || null,
      wallet: paymentData.wallet || null,
      card: paymentData.card
        ? {
            network: paymentData.card.network,
            type: paymentData.card.type,
            last4: paymentData.card.last4,
          }
        : null,
      acquirerData: paymentData.acquirer_data || {},
      rrn: paymentData.acquirer_data?.rrn || paymentData.acquirer_data?.upi_transaction_id || null,
      fee: paymentData.fee ? paymentData.fee / 100 : 0,
      tax: paymentData.tax ? paymentData.tax / 100 : 0,
      capturedAt: paymentData.created_at ? new Date(paymentData.created_at * 1000) : new Date(),
    },
  };
}

/**
 * Verify Razorpay Webhook Signature
 */
export function verifyWebhookSignature(rawBody, signature, secret) {
  if (!signature || !secret || !rawBody) {
    return false;
  }

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');

  return expectedSignature === signature;
}

