import { NextRequest, NextResponse } from 'next/server';
import { DbClient } from '../../../../lib/db';

/* Reads live catalogue rows, so it is never prerendered. */
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get('slug');

    if (slug) {
      const [product, options, rules] = await Promise.all([
        DbClient.getProductBySlug(slug),
        DbClient.getProductOptions(slug),
        DbClient.getPricingRules(slug)
      ]);

      if (!product) {
        return NextResponse.json({ error: 'Product not found.' }, { status: 404 });
      }

      return NextResponse.json({
        product,
        options,
        rules
      });
    }

    // Default: fetch all active products
    const products = await DbClient.getProducts();
    return NextResponse.json(products);

  } catch (error) {
    console.error('Products API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
