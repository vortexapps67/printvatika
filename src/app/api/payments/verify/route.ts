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
    const {
      orderId,
      method,
      utr,
      razorpayPaymentId,
      razorpayOrderId,
      razorpaySignature,
      paymentId,
      status
    } = body;

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required for verification.' }, { status: 400 });
    }

    // 1. Load the order to verify its existence
    const order = await DbClient.getOrderById(orderId);
    if (!order) {
      return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    }

    // 2. Handle UPI UTR Manual Submission
    if (method === 'upi_utr') {
      const cleanUtr = String(utr || '').trim();
      if (!cleanUtr || cleanUtr.length < 6) {
        return NextResponse.json(
          { error: 'Please enter a valid UPI reference / UTR number (at least 6 digits).' },
          { status: 400 }
        );
      }

      const updatedOrder = await DbClient.setOrderPaid(orderId, cleanUtr);
      const confirmedOrder = await DbClient.updateOrderStatus(
        orderId,
        'CONFIRMED',
        'PAID',
        `UPI payment submitted. UTR: ${cleanUtr}`
      );

      if (confirmedOrder) {
        await sendAdminOrderNotification(confirmedOrder);
      }

      return NextResponse.json({
        success: true,
        message: 'UPI payment submitted and queued for print production.',
        order: confirmedOrder || updatedOrder
      });
    }

    // 3. Handle Pay at Counter (Cash/UPI on Pickup)
    if (method === 'pay_at_counter') {
      const confirmedOrder = await DbClient.updateOrderStatus(
        orderId,
        'CONFIRMED',
        'PENDING',
        'Customer will pay at shop counter upon pickup.'
      );

      if (confirmedOrder) {
        await sendAdminOrderNotification(confirmedOrder);
      }

      return NextResponse.json({
        success: true,
        message: 'Order confirmed for counter pickup and payment.',
        order: confirmedOrder
      });
    }

    // 4. Handle Bespoke / Quote Request
    if (method === 'quote_request') {
      const confirmedOrder = await DbClient.updateOrderStatus(
        orderId,
        'CONFIRMED',
        'PENDING',
        'Bespoke custom job quote requested.'
      );

      if (confirmedOrder) {
        await sendAdminOrderNotification(confirmedOrder);
      }

      return NextResponse.json({
        success: true,
        message: 'Quote request submitted. Our team will contact you shortly.',
        order: confirmedOrder
      });
    }

    // 5. Perform Online Razorpay Verification Check
    let isPaymentValid = false;
    let transactionId = '';

    /* A key only counts as configured when it is a real one: the .env template
       ships placeholders (rzp_test_YOUR_PUBLIC_KEY_ID, YOUR_SECRET_KEY_HERE)
       and those must not switch the live path on. */
    const isReal = (value?: string) => Boolean(value) && !/YOUR_|placeholder|example/i.test(value as string);

    const isRazorpayConfigured =
      isReal(process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID) && isReal(process.env.RAZORPAY_KEY_SECRET);

    const allowUnsignedTest = process.env.NODE_ENV !== 'production' || !isRazorpayConfigured;

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
    } else if (allowUnsignedTest && (status === 'PAID' || paymentId || razorpayPaymentId)) {
      // Development or test sandbox mode
      isPaymentValid = true;
      transactionId = razorpayPaymentId || paymentId || `pay_test_${Date.now()}`;
    }

    if (!isPaymentValid) {
      if (isRazorpayConfigured && (razorpayPaymentId || razorpaySignature)) {
        await DbClient.updateOrderStatus(orderId, 'PAYMENT_PENDING', 'FAILED', 'Payment verification failed.');
      }
      return NextResponse.json({ error: 'Invalid signature / Failed transaction.' }, { status: 400 });
    }

    // 6. Mark the Order as PAID & CONFIRMED in the Database
    const updatedOrder = await DbClient.setOrderPaid(orderId, transactionId);
    if (!updatedOrder) {
      return NextResponse.json({ error: 'Failed to update order state.' }, { status: 500 });
    }

    // Automatically transition to CONFIRMED status to signify it's ready for the printer press operator
    const confirmedOrder = await DbClient.updateOrderStatus(
      orderId,
      'CONFIRMED',
      'PAID',
      `Online payment verified. Ref: ${transactionId}`
    );

    // 7. Trigger WhatsApp Alert Notification to Printing Press Owner
    if (confirmedOrder) {
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
