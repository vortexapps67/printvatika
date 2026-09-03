import { NextRequest, NextResponse } from 'next/server';
import { DbClient } from '../../../../lib/db';
import { checkRateLimit } from '../../../../lib/rateLimit';

export async function POST(req: NextRequest) {
  try {
    const rateCheck = checkRateLimit(req, {
      limit: 5,
      windowMs: 5 * 60 * 1000,
      prefix: 'admin-login',
    });

    if (!rateCheck.success) {
      return NextResponse.json(
        { error: `Too many login attempts. Please try again in ${rateCheck.resetInSeconds} seconds.` },
        {
          status: 429,
          headers: { 'Retry-After': String(rateCheck.resetInSeconds) }
        }
      );
    }

    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
    }

    // Verify credentials
    const isValid = await DbClient.authenticateAdmin(email, password);

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid admin credentials.' }, { status: 401 });
    }

    // Set secure authentication cookie
    const response = NextResponse.json({ success: true, message: 'Logged in successfully.' });
    
    // Cookie expires in 1 day
    const oneDay = 24 * 60 * 60;
    response.cookies.set('admin_token', 'printer_wala_vatika_authorized_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: oneDay,
      path: '/'
    });

    return response;

  } catch (error) {
    console.error('Admin Login API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
