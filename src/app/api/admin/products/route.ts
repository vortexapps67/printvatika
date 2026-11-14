import { NextRequest, NextResponse } from 'next/server';
import { DbClient } from '../../../../lib/db';

function checkAdminAuth(req: NextRequest): boolean {
  const token = req.cookies.get('admin_token')?.value;
  return token === 'printer_wala_vatika_authorized_token';
}

export async function PUT(req: NextRequest) {
  if (!checkAdminAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { action, slug, basePrice } = body;

    if (action === 'toggleActive') {
      const success = await DbClient.toggleProductActive(slug);
      return NextResponse.json({ success });
    }

    if (action === 'updatePrice') {
      const success = await DbClient.updateProductPrice(slug, basePrice);
      return NextResponse.json({ success });
    }

    if (action === 'update' || action === 'updateProduct') {
      const rawUpdates = body.updates || body;
      const { action: _a, slug: _s, ...cleanUpdates } = rawUpdates;
      const success = await DbClient.updateProduct(slug, cleanUpdates);
      return NextResponse.json({ success, message: 'Product updated successfully.' });
    }

    return NextResponse.json({ error: 'Invalid action specified' }, { status: 400 });

  } catch (error) {
    console.error('Admin Products API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
