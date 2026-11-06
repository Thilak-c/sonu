/**
 * High-performance sliding-window in-memory rate limiter.
 * Automatically evicts stale buckets to keep memory footprint minimal.
 */
class MemoryRateLimiter {
  constructor() {
    this.buckets = new Map();
    if (typeof setInterval !== 'undefined') {
      const sweepTimer = setInterval(() => this.cleanup(), 5 * 60 * 1000);
      if (sweepTimer.unref) sweepTimer.unref();
    }
  }

  cleanup() {
    const now = Date.now();
    for (const [key, record] of this.buckets.entries()) {
      if (record.resetAt <= now) {
        this.buckets.delete(key);
      }
    }
  }

  check(key, limit, windowMs) {
    const now = Date.now();
    let record = this.buckets.get(key);

    if (!record || record.resetAt <= now) {
      record = { count: 1, resetAt: now + windowMs };
      this.buckets.set(key, record);
      return {
        allowed: true,
        remaining: limit - 1,
        resetSeconds: Math.ceil(windowMs / 1000),
      };
    }

    if (record.count >= limit) {
      const resetSeconds = Math.max(1, Math.ceil((record.resetAt - now) / 1000));
      return {
        allowed: false,
        remaining: 0,
        resetSeconds,
      };
    }

    record.count += 1;
    const resetSeconds = Math.max(1, Math.ceil((record.resetAt - now) / 1000));
    return {
      allowed: true,
      remaining: Math.max(0, limit - record.count),
      resetSeconds,
    };
  }
}

const globalLimiter = globalThis.__sonuRateLimiter || new MemoryRateLimiter();
globalThis.__sonuRateLimiter = globalLimiter;

export function getClientIp(request) {
  if (!request) return '127.0.0.1';

  const xff = request.headers?.get ? request.headers.get('x-forwarded-for') : null;
  if (xff) {
    const firstIp = xff.split(',')[0].trim();
    if (firstIp) return firstIp;
  }

  const realIp = request.headers?.get ? request.headers.get('x-real-ip') : null;
  if (realIp) return realIp.trim();

  const cfIp = request.headers?.get ? request.headers.get('cf-connecting-ip') : null;
  if (cfIp) return cfIp.trim();

  return '127.0.0.1';
}

export function rateLimit(request, action = 'default', { limit = 60, windowMs = 60 * 1000 } = {}) {
  const ip = getClientIp(request);
  const key = `${action}:${ip}`;
  const result = globalLimiter.check(key, limit, windowMs);

  if (!result.allowed) {
    return Response.json(
      {
        success: false,
        error: 'Too many requests. Please slow down and try again shortly.',
        retryAfter: result.resetSeconds,
      },
      {
        status: 429,
        headers: {
          'Retry-After': result.resetSeconds.toString(),
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': result.resetSeconds.toString(),
        },
      }
    );
  }

  return null;
}

