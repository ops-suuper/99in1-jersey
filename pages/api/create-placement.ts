import type { NextApiRequest, NextApiResponse } from 'next';
import { createPlacement, getMaxZ } from '../../lib/airtable';
import { Size, SIZE_CAP, MIN_SCALE, MAX_SCALE } from '../../lib/schema';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { side, size, x, y, w, image_url, public_id } = req.body || {};
    if (!['front', 'back'].includes(side)) return res.status(400).json({ error: 'bad side' });
    if (!['small', 'medium', 'large'].includes(size)) return res.status(400).json({ error: 'bad size' });
    if (typeof x !== 'number' || typeof y !== 'number') return res.status(400).json({ error: 'bad coords' });
    if (!image_url || !public_id) return res.status(400).json({ error: 'missing image' });

    // Validate width: must be within [MIN_SCALE*cap, MAX_SCALE*cap]
    const cap = SIZE_CAP[size as Size];
    const minW = cap * MIN_SCALE;
    const maxW = cap * MAX_SCALE;
    const chosenW = typeof w === 'number' ? Math.max(minW, Math.min(maxW, w)) : cap; // default to cap if missing

    const z_index = (await getMaxZ(side)) + 1;

    const record = await createPlacement({
      status: 'pending',
      side,
      size,
      x,
      y,
      w: chosenW,
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
