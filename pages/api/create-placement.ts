// pages/api/create-placement.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { createPlacement, getMaxZ } from '../../lib/airtable';
import { Size, LONG_SIDE_CAP, MIN_SCALE, MAX_SCALE, clamp } from '../../lib/schema';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { side, size, x, y, w, rotation, image_url, public_id } = req.body || {};

    // Basic validation (these names must match your frontend & Airtable)
    if (!['front', 'back'].includes(side)) return res.status(400).json({ error: 'bad side' });
    if (!['small', 'medium', 'large'].includes(size)) return res.status(400).json({ error: 'bad size' });
    if (typeof x !== 'number' || typeof y !== 'number') return res.status(400).json({ error: 'bad coords' });
    if (!image_url || !public_id) return res.status(400).json({ error: 'missing image' });

    // Width is stored as a fraction of jersey width.
    // Clamp to tier limits (40%..100% of the tier cap).
    const cap = LONG_SIDE_CAP[size as Size];
    const minW = cap * MIN_SCALE;
    const maxW = cap * MAX_SCALE;
    const chosenW = typeof w === 'number' ? clamp(w, minW, maxW) : clamp(cap * 0.8, minW, maxW);

    const rot = typeof rotation === 'number' ? rotation : 0;

    // Place above others on the same side
    const z_index = (await getMaxZ(side)) + 1;

    // Create pending record; webhook will flip live=true + status='paid'
    const record = await createPlacement({
      status: 'pending',
      side,
      size,
      x,
      y,
      w: chosenW,
      rotation: rot,
      image_url,
      public_id,
      z_index,
      live: false
    });

    return res.status(200).json({ placement_id: record.id, z_index });
  } catch (e: any) {
    console.error('create-placement error:', e?.message || e);
    return res.status(500).json({ error: 'server error creating placement (check Airtable env/fields)' });
  }
}
