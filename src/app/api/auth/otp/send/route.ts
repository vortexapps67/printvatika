import { NextRequest, NextResponse } from 'next/server';
import { generateOtp, normalizeEmail, normalizePhone } from '../../../../../lib/otpService';
import { checkRateLimit } from '../../../../../lib/rateLimit';

export async function POST(req: NextRequest) {
  try {
    // 1. Rate Limiting: Max 4 OTP requests per 2 minutes per IP
    const rateCheck = checkRateLimit(req, {
      limit: 4,
      windowMs: 2 * 60 * 1000,
      prefix: 'otp-send',
    });

    if (!rateCheck.success) {
      return NextResponse.json(
        { error: `Too many OTP requests. Please wait ${rateCheck.resetInSeconds} seconds before requesting again.` },
        {
          status: 429,
          headers: { 'Retry-After': String(rateCheck.resetInSeconds) },
        }
      );
    }

    const body = await req.json();
    const { target, type } = body;

    if (!target || typeof target !== 'string') {
      return NextResponse.json({ error: 'Valid phone number or email is required.' }, { status: 400 });
    }

    if (type !== 'phone' && type !== 'email') {
      return NextResponse.json({ error: 'Type must be either "phone" or "email".' }, { status: 400 });
    }

    // Validate phone or email format
    if (type === 'phone') {
      const cleanDigits = target.replace(/\D/g, '');
      if (cleanDigits.length < 10) {
        return NextResponse.json({ error: 'Please enter a valid 10-digit mobile number.' }, { status: 400 });
      }
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(target.trim())) {
        return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
      }
    }

    const { code, expiresAt } = generateOtp(target, type);
    const normalizedTarget = type === 'phone' ? normalizePhone(target) : normalizeEmail(target);

    // If WhatsApp API credentials are configured, dispatch real WhatsApp OTP message
    const whatsappApiToken = process.env.WHATSAPP_API_TOKEN;
    const whatsappApiUrl = process.env.WHATSAPP_API_URL;
    if (type === 'phone' && whatsappApiToken && whatsappApiUrl) {
      try {
        await fetch(whatsappApiUrl, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${whatsappApiToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: normalizedTarget.replace(/\+/g, ''),
            type: 'text',
            text: {
              body: `Your Print Vatika verification code is: ${code}. Valid for 10 minutes. Do not share this code with anyone.`,
            },
          }),
        });
      } catch (err) {
        console.warn('Failed to send live WhatsApp message:', err);
      }
    }

    return NextResponse.json({
      success: true,
      message: `OTP sent to ${normalizedTarget}`,
      target: normalizedTarget,
      type,
      expiresAt,
      // Pass demo code for instant local / test verification without requiring paid SMS carrier
      demoCode: code,
    });
  } catch (error: any) {
    console.error('Error generating OTP:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to send OTP. Please try again.' },
      { status: 500 }
    );
  }
}
