import { NextRequest, NextResponse } from 'next/server';
import { DbClient } from '../../../../lib/db';
import { sendAdminOrderNotification } from '../../../../lib/whatsapp';
import { checkRateLimit } from '../../../../lib/rateLimit';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const rateCheck = checkRateLimit(req, {
      limit: 15,
      windowMs: 60 * 1000,
      prefix: 'verify-payment',
    });

    if (!rateCheck.success) {
      return NextResponse.json(
        { error: `Too many payment verification requests. Please try again in ${rateCheck.resetInSeconds} seconds.` },
        {
          status: 429,
          headers: { 'Retry-After': String(rateCheck.resetInSeconds) }
        }
      );
    }

    const body = await req.json();
    const { orderId, razorpayPaymentId, razorpayOrderId, razorpaySignature, paymentId, status } = body;

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required for verification.' }, { status: 400 });
    }

    // 1. Load the order to verify its existence
    const order = await DbClient.getOrderById(orderId);
    if (!order) {
      return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    }

    // 2. Perform Verification Check
    let isPaymentValid = false;
    let transactionId = '';

    const isRazorpayConfigured = !!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID && !!process.env.RAZORPAY_KEY_SECRET;

    if (isRazorpayConfigured && razorpayPaymentId && razorpaySignature) {
      // Real Razorpay signature check
      const secret = process.env.RAZORPAY_KEY_SECRET!;
      const text = `${razorpayOrderId}|${razorpayPaymentId}`;
      const generatedSignature = crypto
        .createHmac('sha256', secret)
        .update(text)
        .digest('hex');

      if (generatedSignature === razorpaySignature) {
        isPaymentValid = true;
        transactionId = razorpayPaymentId;
      }
    } else {
      // Sandbox Simulator verification
      if (status === 'PAID' || paymentId) {
        isPaymentValid = true;
        transactionId = paymentId || `pay_sim_${Date.now()}`;
      }
    }

    if (!isPaymentValid) {
      // Mark payment failed in the DB
      await DbClient.updateOrderStatus(orderId, 'PAYMENT_PENDING', 'FAILED', 'Payment verification failed.');
      return NextResponse.json({ error: 'Invalid signature / Failed transaction.' }, { status: 400 });
    }

    // 3. Mark the Order as PAID & CONFIRMED in the Database
    // Order status transitions: PAYMENT_PENDING -> PAID (marking confirmation) -> CONFIRMED (ready for printing queue)
    const updatedOrder = await DbClient.setOrderPaid(orderId, transactionId);
    if (!updatedOrder) {
      return NextResponse.json({ error: 'Failed to update order state.' }, { status: 500 });
    }

    // Automatically transition to CONFIRMED status to signify it's ready for the printer press operator
    const confirmedOrder = await DbClient.updateOrderStatus(orderId, 'CONFIRMED', 'PAID', 'Order automatically confirmed and queued for printing.');

    // 4. Trigger WhatsApp Alert Notification to Printing Press Owner
    if (confirmedOrder) {
      // Runs in background
      await sendAdminOrderNotification(confirmedOrder);
    }

    return NextResponse.json({
      success: true,
      message: 'Order paid and confirmed successfully.',
      order: confirmedOrder || updatedOrder
    });

  } catch (error) {
    console.error('Payment verification error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
