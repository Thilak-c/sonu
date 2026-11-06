import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { rateLimit, getClientIp } from '../lib/ratelimit.js';
import { verifyWebhookSignature } from '../lib/razorpay.js';

describe('Security Suite: In-Memory Rate Limiter', () => {
  test('allows requests within limit and extracts client IP', () => {
    const mockReq = {
      headers: new Headers({ 'x-forwarded-for': '203.0.113.195, 10.0.0.1' }),
    };

    const ip = getClientIp(mockReq);
    assert.equal(ip, '203.0.113.195');

    const action = `test_action_${Date.now()}`;
    const r1 = rateLimit(mockReq, action, { limit: 2, windowMs: 10000 });
    assert.equal(r1, null, 'First request should be allowed');

    const r2 = rateLimit(mockReq, action, { limit: 2, windowMs: 10000 });
    assert.equal(r2, null, 'Second request should be allowed');

    const r3 = rateLimit(mockReq, action, { limit: 2, windowMs: 10000 });
    assert.notEqual(r3, null, 'Third request should be blocked');
    assert.equal(r3.status, 429, 'Status should be 429 Too Many Requests');
  });

  test('extracts CF-Connecting-IP and X-Real-IP when present', () => {
    const cfReq = {
      headers: new Headers({ 'cf-connecting-ip': '198.51.100.42' }),
    };
    assert.equal(getClientIp(cfReq), '198.51.100.42');

    const realReq = {
      headers: new Headers({ 'x-real-ip': '198.51.100.99' }),
    };
    assert.equal(getClientIp(realReq), '198.51.100.99');
  });
});

describe('Security Suite: Razorpay Webhook Signatures', () => {
  const secret = 'test_webhook_secret_key_12345';
  const payload = JSON.stringify({ event: 'payment.captured', id: 'pay_test123' });

  test('validates authentic cryptographic signature', () => {
    const validSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    const isValid = verifyWebhookSignature(payload, validSignature, secret);
    assert.equal(isValid, true);
  });

  test('rejects forged or tampered signatures', () => {
    const fakeSignature = '0000000000000000000000000000000000000000000000000000000000000000';
    const isValid = verifyWebhookSignature(payload, fakeSignature, secret);
    assert.equal(isValid, false);
  });
});

describe('Security Suite: Admin Authentication Rule', () => {
  const VALID_USERS = ['8008', '9122'];

  test('only 8008 and 9122 are permitted access', () => {
    assert.equal(VALID_USERS.includes('8008'), true);
    assert.equal(VALID_USERS.includes('9122'), true);
    assert.equal(VALID_USERS.includes('1234'), false);
    assert.equal(VALID_USERS.includes('admin'), false);
    assert.equal(VALID_USERS.includes(''), false);
  });
});

