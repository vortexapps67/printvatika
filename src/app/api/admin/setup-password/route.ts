import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// One-time endpoint to update the admin password. Remove after use.
export async function POST(req: NextRequest) {
  const { password, secret } = await req.json();
  if (secret !== 'printvatika-setup-2026') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!password) {
    return NextResponse.json({ error: 'Password required' }, { status: 400 });
  }
  const { getSupabase } = await import('../../../../lib/supabaseStore');
  const sb = getSupabase();
  const { error } = await sb.from('settings').upsert({ key: 'admin_password', value: password, label: 'Admin Password' }, { onConflict: 'key' });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}