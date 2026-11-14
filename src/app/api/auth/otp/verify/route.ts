import { NextRequest, NextResponse } from 'next/server';
import { verifyOtp, normalizeEmail, normalizePhone } from '../../../../../lib/otpService';
import { checkRateLimit } from '../../../../../lib/rateLimit';

export async function POST(req: NextRequest) {
  try {
    // 1. Rate Limiting: Max 10 verification attempts per minute per IP
    const rateCheck = checkRateLimit(req, {
      limit: 10,
      windowMs: 60 * 1000,
      prefix: 'otp-verify',
    });

    if (!rateCheck.success) {
      return NextResponse.json(
        { error: `Too many verification attempts. Please wait ${rateCheck.resetInSeconds} seconds.` },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { target, type, code, name } = body;

    if (!target || !type || !code) {
      return NextResponse.json(
        { error: 'Target, type, and 6-digit code are required.' },
        { status: 400 }
      );
    }

    const normalizedTarget = type === 'phone' ? normalizePhone(target) : normalizeEmail(target);
    const verification = verifyOtp(normalizedTarget, type, String(code));

    if (!verification.success) {
      return NextResponse.json({ error: verification.error || 'Invalid code.' }, { status: 400 });
    }

    // Prepare user object
    const resolvedName = name?.trim() || (type === 'email' ? normalizedTarget.split('@')[0] : 'Customer');
    const userPayload = {
      id: `usr_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`,
      name: resolvedName,
      email: type === 'email' ? normalizedTarget : '',
      phone: type === 'phone' ? normalizedTarget : '',
      verifiedAt: new Date().toISOString(),
    };

    const response = NextResponse.json({
      success: true,
      verified: true,
      message: `${type === 'phone' ? 'Phone' : 'Email'} verified successfully!`,
      user: userPayload,
    });

    // Set signed customer session cookie
    response.cookies.set('vatika_customer_session', JSON.stringify(userPayload), {
      httpOnly: false, // Accessible to client-side auth context
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('Error verifying OTP:', error);
    return NextResponse.json(
      { error: error?.message || 'Verification failed. Please try again.' },
      { status: 500 }
    );
  }
}
