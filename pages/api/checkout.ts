import type { NextApiRequest, NextApiResponse } from 'next';
import { stripe, PRICE_IDS } from '../../lib/stripe';
import { updatePlacement } from '../../lib/airtable';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end('Method not allowed');

  const { placement_id, size } = req.body || {};
  if (!placement_id) return res.status(400).json({ error: 'missing placement_id' });
  if (!['small','medium','large'].includes(size)) return res.status(400).json({ error: 'bad size' });

  const success = `${process.env.NEXT_PUBLIC_APP_URL}/success`;
  const cancel = `${process.env.NEXT_PUBLIC_APP_URL}/cancel`;

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [{ price: PRICE_IDS[size as 'small'|'medium'|'large'], quantity: 1 }],
    success_url: `${success}?sid={CHECKOUT_SESSION_ID}`,
    cancel_url: cancel,
    client_reference_id: placement_id,
    metadata: { placement_id, size }
  });

  await updatePlacement(placement_id, { checkout_session_id: session.id });
  res.status(200).json({ url: session.url });
}
