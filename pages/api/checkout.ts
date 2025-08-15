import type { NextApiRequest, NextApiResponse } from 'next';
import { stripe, PRICE_IDS } from '../../lib/stripe';
import { updatePlacement } from '../../lib/airtable';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('[checkout] method=', req.method, 'url=', req.url);

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST /api/checkout' });
  }

  try {
    const { placement_id, size } = req.body || {};
    if (!placement_id) return res.status(400).json({ error: 'missing placement_id' });
    if (!['small','medium','large'].includes(size)) return res.status(400).json({ error: 'bad size' });

    const priceId = PRICE_IDS[size as 'small'|'medium'|'large'];
    if (!priceId) return res.status(400).json({ error: `Missing Stripe price ID for size "${size}"` });

    const successBase = process.env.NEXT_PUBLIC_APP_URL;
    if (!successBase) return res.status(500).json({ error: 'NEXT_PUBLIC_APP_URL not set in env' });

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${successBase}/success?sid={CHECKOUT_SESSION_ID}`,
      cancel_url: `${successBase}/cancel`,
      client_reference_id: placement_id,
      metadata: { placement_id, size }
    });

    await updatePlacement(placement_id, { checkout_session_id: session.id });
    return res.status(200).json({ url: session.url });
  } catch (e: any) {
    console.error('checkout error:', e?.message || e);
    return res.status(500).json({ error: `server error creating checkout: ${e?.message || e}` });
  }
}
