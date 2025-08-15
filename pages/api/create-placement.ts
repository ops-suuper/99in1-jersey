import type { NextApiRequest, NextApiResponse } from 'next';
import { createPlacement, getMaxZ } from '../../lib/airtable';
import { Size, SIZE_LIMITS, MIN_SCALE, MAX_SCALE } from '../../lib/schema';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { imageUrl, x, y, scale, size }: { imageUrl: string; x: number; y: number; scale: number; size: Size } = req.body;

    if (!imageUrl || typeof x !== 'number' || typeof y !== 'number' || typeof scale !== 'number' || !size) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Enforce proportional scaling limits per size
    const limits = SIZE_LIMITS[size];
    if (!limits) {
      return res.status(400).json({ error: 'Invalid size category' });
    }

    const clampedScale = Math.max(
      MIN_SCALE,
      Math.min(scale, MAX_SCALE, limits.maxScale)
    );

    // Get the next highest Z index so new placements appear on top
    const z = (await getMaxZ()) + 1;

    const record = await createPlacement({
      imageUrl,
      x,
      y,
      scale: clampedScale,
      size,
      z,
    });

    return res.status(200).json({ success: true, record });
  } catch (error) {
    console.error('Error creating placement:', error);
    return res.status(500).json({ error: 'Failed to create placement' });
  }
}
