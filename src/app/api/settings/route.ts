import { NextResponse } from 'next/server';
import { DbClient } from '../../../lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const raw = await DbClient.getSettings();
    // Exclude sensitive keys from public consumption
    const { admin_password, ...safeSettings } = raw;
    return NextResponse.json(safeSettings);
  } catch (error) {
    console.error('Public Settings GET error:', error);
    return NextResponse.json({ error: 'Failed to load settings' }, { status: 500 });
  }
}
