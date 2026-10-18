import { NextRequest, NextResponse } from 'next/server';
import { DbClient } from '../../../../lib/db';

/* Reads a live order, so it is never prerendered. */
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const phone = searchParams.get('phone');

    if (!id || !phone) {
      return NextResponse.json({ error: 'Order ID and registered Mobile number are required.' }, { status: 400 });
    }

    const cleanId = id.replace('#', '').toUpperCase().trim();
    const order = await DbClient.getOrderByIdAndPhone(cleanId, phone);

    if (!order) {
      return NextResponse.json({ error: 'Order not found or mobile number verification failed.' }, { status: 404 });
    }

    return NextResponse.json(order);

  } catch (error) {
    console.error('Track Order API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
