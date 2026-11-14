import { NextRequest, NextResponse } from 'next/server';

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

// In-memory sliding window store
const rateLimitStore = new Map<string, RateLimitRecord>();

// Periodic garbage collection for expired entries (safe for serverless lambdas)
let lastCleanup = Date.now();
function cleanupExpired() {
  const now = Date.now();
  if (now - lastCleanup < 60_000) return;
  lastCleanup = now;

  rateLimitStore.forEach((record, key) => {
    if (record.resetTime <= now) {
      rateLimitStore.delete(key);
    }
  });
}

export interface RateLimitOptions {
  limit: number;
  windowMs: number;
  prefix?: string;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetInSeconds: number;
}

/**
 * Extracts the real client IP address from proxy and CDN headers.
 */
export function getClientIp(req: Request | NextRequest): string {
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) {
    const firstIp = forwardedFor.split(',')[0].trim();
    if (firstIp) return firstIp;
  }

  const realIp = req.headers.get('x-real-ip') || req.headers.get('cf-connecting-ip');
  if (realIp) return realIp.trim();

  return '127.0.0.1';
}

/**
 * Checks and increments rate limit for a given request.
 */
export function checkRateLimit(
  req: Request | NextRequest,
  options: RateLimitOptions
): RateLimitResult {
  cleanupExpired();

  const ip = getClientIp(req);
  const key = `${options.prefix || 'rl'}:${ip}`;
  const now = Date.now();

  let record = rateLimitStore.get(key);

  if (!record || now >= record.resetTime) {
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + options.windowMs,
    });
    return {
      success: true,
      limit: options.limit,
      remaining: Math.max(0, options.limit - 1),
      resetInSeconds: Math.ceil(options.windowMs / 1000),
    };
  }

  record.count += 1;
  const resetInSeconds = Math.max(1, Math.ceil((record.resetTime - now) / 1000));

  if (record.count > options.limit) {
    return {
      success: false,
      limit: options.limit,
      remaining: 0,
      resetInSeconds,
    };
  }

  return {
    success: true,
    limit: options.limit,
    remaining: Math.max(0, options.limit - record.count),
    resetInSeconds,
  };
}

/**
 * Expressive helper to return an immediate 429 response if limited
 */
export function enforceRateLimit(
  req: Request | NextRequest,
  options: RateLimitOptions
): NextResponse | null {
  const result = checkRateLimit(req, options);
  if (!result.success) {
    return NextResponse.json(
      {
        error: `Rate limit exceeded. Please wait ${result.resetInSeconds} seconds before trying again.`,
        retryAfter: result.resetInSeconds,
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(result.resetInSeconds),
          'X-RateLimit-Limit': String(result.limit),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.ceil((Date.now() + result.resetInSeconds * 1000) / 1000)),
        },
      }
    );
  }
  return null;
}
