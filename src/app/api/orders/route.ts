import { NextRequest, NextResponse } from 'next/server';
import { DbClient } from '../../../lib/db';
import { Order, OrderItem } from '../../../types';
import { checkRateLimit } from '../../../lib/rateLimit';

export async function POST(req: NextRequest) {
  try {
    // 1. Rate Limiting: 5 orders per minute per IP
    const rateCheck = checkRateLimit(req, {
      limit: 5,
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

    // 2. Authentication Gate: Must be signed in to place an order
    const authHeader = req.headers.get('authorization');
    const userToken = authHeader?.replace(/^Bearer\s+/i, '') || body.userToken || body.userId;

    if (!userToken) {
      return NextResponse.json(
        { error: 'Authentication required: You must be signed in to place an order.' },
        { status: 401 }
      );
    }
    
    // 3. Mandatory Fields Validation
    const {
      customerName,
      customerEmail,
      customerPhone,
      fulfillmentType,
      deliveryAddress,
      deliveryCity,
      deliveryState,
      deliveryPincode,
      deliveryCharge,
      subtotal,
      totalAmount,
      notes,
      items
    } = body;

    if (!customerName || !customerEmail || !customerPhone || !items || items.length === 0) {
      return NextResponse.json({ error: 'Missing mandatory checkout fields.' }, { status: 400 });
    }

    // 4. Determine unique serial Order ID e.g. #PV-1001
    const allOrders = await DbClient.getOrders();
    const count = allOrders.length;
    const orderSerial = 1001 + count;
    const orderId = `#PV-${orderSerial}`;

    // 5. Construct Order input schema
    const orderInput = {
      id: orderId,
      customer_name: customerName,
      customer_email: customerEmail,
      customer_phone: customerPhone,
      fulfillment_type: fulfillmentType,
      delivery_address: fulfillmentType === 'delivery' ? deliveryAddress : undefined,
      delivery_city: fulfillmentType === 'delivery' ? deliveryCity : undefined,
      delivery_state: fulfillmentType === 'delivery' ? deliveryState : undefined,
      delivery_pincode: fulfillmentType === 'delivery' ? deliveryPincode : undefined,
      delivery_charge: Number(deliveryCharge) || 0,
      subtotal: Number(subtotal),
      total_amount: Number(totalAmount),
      payment_status: 'PENDING' as const,
      order_status: 'PAYMENT_PENDING' as const,
      notes: notes || undefined
    };

    // 6. Construct items list
    const itemsInput = items.map((item: any) => ({
      product_slug: item.product_slug,
      product_name: item.product_name,
      quantity: Number(item.quantity) || 1,
      selected_options: item.selected_options || {},
      unit_price: Number(item.unit_price),
      total_price: Number(item.total_price),
      original_file_url: item.original_file?.base64 || undefined,
      preview_file_url: item.preview_base64 || undefined,
      design_config: item.design_config || undefined
    }));

    // 7. Save to database
    const createdOrder = await DbClient.createOrder(orderInput, itemsInput);

    // 8. Razorpay Integration hook
    let razorpay_order_id = null;
    if (process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
      try {
        const Razorpay = require('razorpay');
        const rzp = new Razorpay({
          key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          key_secret: process.env.RAZORPAY_KEY_SECRET,
        });

        const rzpOrder = await rzp.orders.create({
          amount: Math.round(Number(totalAmount) * 100), // paise
          currency: 'INR',
          receipt: orderId,
          payment_capture: 1
        });
        
        razorpay_order_id = rzpOrder.id;
      } catch (rzpErr) {
        console.error('Failed to trigger Razorpay client SDK Order creation:', rzpErr);
      }
    }

    return NextResponse.json({
      ...createdOrder,
      razorpay_order_id
    }, { status: 201 });

  } catch (error) {
    console.error('Order API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
