import { NextRequest, NextResponse } from 'next/server';
import { DbClient } from '../../../../lib/db';

export const dynamic = 'force-dynamic';

function checkAdminAuth(req: NextRequest): boolean {
  const token = req.cookies.get('admin_token')?.value;
  return token === 'printer_wala_vatika_authorized_token';
}

export async function GET(req: NextRequest) {
  if (!checkAdminAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const settings = await DbClient.getSettings();
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Admin Settings GET error:', error);
    return NextResponse.json({ error: 'Failed to load settings' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  if (!checkAdminAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();

    // Support single key-value update { key, value } OR batch object { [key]: value }
    if (body.key && body.value !== undefined) {
      await DbClient.updateSetting(body.key, typeof body.value === 'string' ? body.value : JSON.stringify(body.value));
      return NextResponse.json({ success: true, message: `Setting ${body.key} saved.` });
    }

    if (body.settings && typeof body.settings === 'object') {
      for (const [k, v] of Object.entries(body.settings)) {
        await DbClient.updateSetting(k, typeof v === 'string' ? v : JSON.stringify(v));
      }
      return NextResponse.json({ success: true, message: 'Settings saved.' });
    }

    // Direct object with keys
    for (const [k, v] of Object.entries(body)) {
      if (k !== 'key' && k !== 'value') {
        await DbClient.updateSetting(k, typeof v === 'string' ? v : JSON.stringify(v));
      }
    }

    return NextResponse.json({ success: true, message: 'Settings updated successfully.' });

  } catch (error) {
    console.error('Admin Settings PUT error:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
