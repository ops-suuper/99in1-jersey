import type { NextApiRequest, NextApiResponse } from 'next';
import { updatePlacement } from '../../lib/airtable';
import { stripe, PRICE_IDS } from '../../lib/stripe';
import { Size } from '../../lib/schema';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { placement_id, size } = req.body || {};

    if (!placement_id) return res.status(400).json({ error: 'missing placement_id' });
    if (!['small','medium','large'].includes(size)) return res.status(400).json({ error: 'invalid size' });

    const priceId = PRICE_IDS[size as Size];
    if (!priceId) return res.status(500).json({ error: 'missing Stripe price id for size' });

    const success = `${process.env.NEXT_PUBLIC_APP_URL}/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancel = `${process.env.NEXT_PUBLIC_APP_URL}/cancel`;

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',                         // <- payment (NOT subscription)
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: success,
      cancel_url: cancel,
      allow_promotion_codes: true,
      submit_type: 'pay',
      billing_address_collection: 'auto'
    });

    // Store session id on the placement so the webhook can look it up
    await updatePlacement(placement_id, { checkout_session_id: session.id });

    return res.status(200).json({ url: session.url });
  } catch (e: any) {
    console.error('[checkout] error:', e?.message || e);
    return res.status(500).json({ error: 'server error creating checkout' });
  }
}
