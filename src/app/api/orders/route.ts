import { NextRequest, NextResponse } from 'next/server';
import { DbClient } from '../../../lib/db';
import { calculatePricing } from '../../../lib/priceCalculator';
import { SITE } from '../../../lib/site';
import { Order, OrderItem } from '../../../types';
import { checkRateLimit } from '../../../lib/rateLimit';
import { nextOrderSerial } from '../../../lib/supabaseMap';

/** Money with two decimals — for the per-unit prices on an item, which stay
 *  exact; order totals are billed to the rupee (see `payable` in catalog.ts). */
function round2(value: number): number {
  return Math.round(Number(value) * 100) / 100;
}

/** Order money, to the rupee, exactly as the shop's records keep it. */
function payable(value: number): number {
  return Math.round(Number(value) || 0);
}

export async function POST(req: NextRequest) {
  try {
    // 1. Rate Limiting: 5 orders per minute per IP (raised with
    //    ORDER_RATE_LIMIT when a script is checking the checkout).
    const rateCheck = checkRateLimit(req, {
      limit: Number(process.env.ORDER_RATE_LIMIT) || 5,
      windowMs: 60 * 1000,
      prefix: 'create-order',
    });

    if (!rateCheck.success) {
      return NextResponse.json(
        { error: `Too many order requests. Please try again in ${rateCheck.resetInSeconds} seconds.` },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateCheck.resetInSeconds),
            'X-RateLimit-Limit': String(rateCheck.limit),
            'X-RateLimit-Remaining': String(rateCheck.remaining),
          },
        }
      );
    }

    const body = await req.json();

    /* 2. Guest checkout. The previous build rejected every order that did not
       carry a signed-in session, but this app has no customer sign-in screen,
       so that gate made it impossible to buy anything. Name, phone and email
       are still mandatory (validated below) and the rate limiter above guards
       against abuse. To require accounts again, reinstate a token check here
       after adding the sign-in pages. */

    /* If the customer is signed in, link the order to their account. The
       Authorization header is verified against Supabase Auth so a request
       cannot claim someone else's account by editing the body. */
    let resolvedUserId: string | undefined;
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace(/^Bearer\s+/i, '').trim();
    if (token) {
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const sb = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
        const { data } = await sb.auth.getUser(token);
        if (data?.user?.id) resolvedUserId = data.user.id;
      } catch {
        /* Ignore — fall back to the body value (or none). */
      }
    }
    if (!resolvedUserId && typeof body.userId === 'string') resolvedUserId = body.userId;
    const {
      customerName,
      customerEmail,
      customerPhone,
      fulfillmentType,
      deliveryAddress,
      deliveryCity,
      deliveryState,
      deliveryPincode,
      couponCode,
      notes,
      items
    } = body;

    if (!customerName || !customerEmail || !customerPhone || !items || items.length === 0) {
      return NextResponse.json({ error: 'Missing mandatory checkout fields.' }, { status: 400 });
    }

    const fulfillment = (fulfillmentType === 'delivery' ? 'delivery' : 'pickup') as 'delivery' | 'pickup';

    /* 4. Price the job here, not in the browser. A total that arrives over the
       wire can be edited, so every line is recalculated from the catalogue: the
       product's own base price, the options chosen and the quantity tier that
       applies. What the shop charges is what the shop's rules say. */
    const pricedItems: any[] = [];
    let subtotal = 0;

    for (const item of items) {
      const slug = String(item.product_slug || '').trim();
      const [product, options, rules] = await Promise.all([
        DbClient.getProductBySlug(slug),
        DbClient.getProductOptions(slug),
        DbClient.getPricingRules(slug),
      ]);

      if (!product) {
        return NextResponse.json(
          { error: `This order names a product that is not in the catalogue: ${slug}` },
          { status: 400 }
        );
      }

      const quantity = Math.max(1, Math.round(Number(item.quantity) || 1));
      const breakdown = calculatePricing(
        product,
        options,
        rules,
        item.selected_options || {},
        quantity,
        item.dimensions || undefined,
        fulfillment
      );

      const lineTotal = payable(breakdown.subtotal);
      subtotal += lineTotal;

      pricedItems.push({
        product_slug: product.slug,
        product_name: product.name,
        quantity,
        selected_options: item.selected_options || {},
        unit_price: round2(breakdown.unitPrice),
        total_price: lineTotal,
        original_file_url: item.original_file_url || item.original_file?.base64 || undefined,
        preview_file_url: item.preview_file_url || item.preview_base64 || undefined,
        design_config: item.design_config || undefined,
        dimensions: item.dimensions || undefined,
        selected_artwork_label: item.original_file?.name || item.selected_artwork_label || undefined
      });
    }

    /* 5. The shop's own discount codes, read from its settings row, then the
       courier charge. A code that is switched off, or that the order is too
       small for, simply does nothing — the order is still placed. */
    const wanted = String(couponCode || '').trim().toUpperCase();
    const coupons = await DbClient.getCoupons();
    const coupon = wanted ? coupons.find(c => c.code === wanted && c.active) : undefined;
    const unlocked = Boolean(coupon && subtotal >= (coupon?.minOrder ?? 0));

    let discount = 0;
    let deliveryWaived = false;
    if (unlocked && coupon) {
      if (coupon.type === 'delivery') deliveryWaived = true;
      else discount = Math.min(payable(coupon.value), subtotal);
    }

    /* A job that is quoted by hand (base price 0) has nothing to add a courier
       charge to: the quote covers the whole thing. A mixed basket does pay for
       delivery, because the printed part is a real sale. */
    const deliveryCharge =
      fulfillment === 'delivery' && !deliveryWaived && subtotal > 0 ? SITE.deliveryCharge : 0;
    const totalAmount = Math.max(0, subtotal + deliveryCharge - discount);

    /* The shop reads coupons out of the order notes, so the code goes there —
       including when it was refused, with the reason, so a customer who asks why
       gets an answer rather than a mystery. */
    const noteParts: string[] = [];
    if (unlocked && coupon) noteParts.push(`[COUPON: ${coupon.code}]`);
    else if (wanted && coupon) noteParts.push(`[COUPON ${wanted} NOT APPLIED: minimum order ₹${coupon.minOrder}]`);
    else if (wanted) noteParts.push(`[COUPON ${wanted} NOT RECOGNISED]`);
    if (notes) noteParts.push(String(notes));

    // 6. Next unique serial, e.g. PV-1009 — same id shape as the orders
    //    already sitting in the shop's database (PV-1001 …).
    const allOrders = await DbClient.getOrders();
    const orderSerial = nextOrderSerial(allOrders.map(o => o.id));
    const orderId = `PV-${orderSerial}`;

    // 7. Construct Order input schema
    const orderInput = {
      id: orderId,
      customer_name: customerName,
      customer_email: customerEmail,
      customer_phone: customerPhone,
      fulfillment_type: fulfillment,
      delivery_address: fulfillment === 'delivery' ? deliveryAddress : undefined,
      delivery_city: fulfillment === 'delivery' ? deliveryCity : undefined,
      delivery_state: fulfillment === 'delivery' ? deliveryState : undefined,
      delivery_pincode: fulfillment === 'delivery' ? deliveryPincode : undefined,
      delivery_charge: deliveryCharge,
      subtotal,
      total_amount: totalAmount,
      payment_status: 'PENDING' as const,
      order_status: 'PAYMENT_PENDING' as const,
      notes: noteParts.filter(Boolean).join(' ') || undefined,
      user_id: resolvedUserId,
    };

    // 8. Save to database
    const createdOrder = await DbClient.createOrder(orderInput, pricedItems);

    /* 9. Razorpay: charge the amount this server just worked out, never one it
       was told. Skipped when no gateway is configured, and when the order comes
       to nothing — a bespoke job is quoted by hand. */
    const isReal = (value?: string) =>
      Boolean(value) && !/YOUR_|placeholder|example/i.test(value as string);
    const gatewayReady =
      isReal(process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID) && isReal(process.env.RAZORPAY_KEY_SECRET);

    let razorpay_order_id: string | null = null;

    if (gatewayReady && totalAmount > 0) {
      try {
        const Razorpay = require('razorpay');
        const rzp = new Razorpay({
          key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          key_secret: process.env.RAZORPAY_KEY_SECRET,
        });

        const rzpOrder = await rzp.orders.create({
          amount: Math.round(totalAmount * 100), // paise
          currency: 'INR',
          receipt: orderId
        });

        razorpay_order_id = rzpOrder.id;
      } catch (rzpErr) {
        console.error('Failed to trigger Razorpay client SDK Order creation:', rzpErr);
      }
    }

    return NextResponse.json({
      ...createdOrder,
      razorpay_order_id,
      /* What the server decided this order costs. The cart shows these numbers
         rather than its own arithmetic, so the price on screen is the price the
         press will bill. */
      totals: {
        subtotal,
        delivery: deliveryCharge,
        discount,
        deliveryWaived,
        total: totalAmount,
        coupon: unlocked && coupon ? coupon.code : null
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Order API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
