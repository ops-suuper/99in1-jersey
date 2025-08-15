import type { NextApiRequest, NextApiResponse } from 'next';
import { stripe } from '../../lib/stripe';
import getRawBody from 'raw-body';
import { updatePlacement } from '../../lib/airtable';

export const config = { api: { bodyParser: false } };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end('Method not allowed');
  const sig = req.headers['stripe-signature'] as string;
  let event;

  try {
    const buf = await getRawBody(req);
    event = stripe.webhooks.constructEvent(buf, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const s = event.data.object as any;
    const placementId = s.client_reference_id;
    const email = s.customer_details?.email || '';
    const amount = (s.amount_total || 0) / 100;

    if (placementId) {
      await updatePlacement(placementId, {
        status: 'paid',
        live: true,
        email,
        amount
      });
    }
  }

  res.status(200).json({ received: true });
}
