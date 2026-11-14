import { NextRequest, NextResponse } from 'next/server';
import { generateOtp, normalizeEmail, normalizePhone } from '../../../../../lib/otpService';
import { checkRateLimit } from '../../../../../lib/rateLimit';
import { sendRealSms, sendRealEmail } from '../../../../../lib/smsService';

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

    // 2. Dispatch real SMS or Email
    let dispatchResult: any = { sent: false };
    if (type === 'phone') {
      dispatchResult = await sendRealSms(normalizedTarget, code);
    } else {
      dispatchResult = await sendRealEmail(normalizedTarget, code);
    }

    // Check if test / demo mode is explicitly enabled
    const isTestMode = process.env.ENABLE_DEMO_OTP === 'true';

    return NextResponse.json({
      success: true,
      message: dispatchResult.sent
        ? `Verification code sent via ${dispatchResult.provider || 'SMS'}`
        : `Verification code generated for ${normalizedTarget}`,
      target: normalizedTarget,
      type,
      expiresAt,
      gatewayConfigured: dispatchResult.sent,
      // Only include demo code if test mode is explicitly enabled in env
      demoCode: isTestMode ? code : undefined,
    });
  } catch (error: any) {
    console.error('Error generating OTP:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to send OTP. Please try again.' },
      { status: 500 }
    );
  }
}
