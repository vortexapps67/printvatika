import { NextRequest, NextResponse } from 'next/server';
import { DbClient } from '../../../lib/db';
import { checkRateLimit } from '../../../lib/rateLimit';

export const dynamic = 'force-dynamic';

/**
 * Checks one discount code against an order subtotal.
 *
 * The customer's own code is the only one ever mentioned — the shop's full list
 * is never published from here — and this is a courtesy check for the cart, not
 * the authority: the order route re-checks the same rule against the price it
 * works out for itself before any money comes off.
 */
export async function GET(req: NextRequest) {
  const rateCheck = checkRateLimit(req, {
    limit: 30,
    windowMs: 60 * 1000,
    prefix: 'coupon-check',
  });

  if (!rateCheck.success) {
    return NextResponse.json(
      { valid: false, reason: 'Too many attempts. Please wait a minute.' },
      { status: 429 }
    );
  }

  const code = String(req.nextUrl.searchParams.get('code') || '').trim().toUpperCase();
  const subtotal = Math.max(0, Number(req.nextUrl.searchParams.get('subtotal')) || 0);

  if (!code) {
    return NextResponse.json({ valid: false, reason: 'Enter a code.' });
  }

  const coupons = await DbClient.getCoupons();
  const coupon = coupons.find(c => c.code === code && c.active);

  if (!coupon) {
    return NextResponse.json({ valid: false, reason: `We do not recognise the code ${code}.` });
  }

  const minOrder = coupon.minOrder ?? 0;
  if (subtotal < minOrder) {
    return NextResponse.json({
      valid: false,
      code: coupon.code,
      minOrder,
      reason: `${coupon.code} needs an order of ₹${minOrder.toLocaleString('en-IN')} or more.`,
    });
  }

  const deliveryWaived = coupon.type === 'delivery';
  const discount = deliveryWaived ? 0 : Math.min(coupon.value, subtotal);

  return NextResponse.json({
    valid: true,
    code: coupon.code,
    type: coupon.type,
    value: coupon.value,
    minOrder,
    discount,
    deliveryWaived,
    reason: deliveryWaived
      ? `${coupon.code} applied — delivery is on us.`
      : `${coupon.code} applied — ₹${discount.toFixed(2)} off.`,
  });
}
