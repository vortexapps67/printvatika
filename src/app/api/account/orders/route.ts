import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { DbClient } from '../../../../lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.replace(/^Bearer\s+/i, '').trim();
  if (!token) {
    return NextResponse.json({ error: 'Sign in to view your orders.' }, { status: 401 });
  }

  // Verify the token with Supabase Auth.
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData?.user) {
    return NextResponse.json({ error: 'Session expired. Please sign in again.' }, { status: 401 });
  }

  const email = userData.user.email;
  if (!email) {
    return NextResponse.json({ error: 'No email on this account.' }, { status: 400 });
  }

  const orders = await DbClient.getOrders();
  const mine = orders
    .filter(o => o.customer_email.toLowerCase() === email.toLowerCase())
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return NextResponse.json({ email, orders: mine });
}