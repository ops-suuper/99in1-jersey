import type { NextApiRequest, NextApiResponse } from 'next';
import { createPlacement, getMaxZ } from '../../lib/airtable';
import { Size, MIN_SCALE, MAX_SCALE } from '../../lib/schema';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { imageUrl, x, y, scale, size } = req.body;

    if (!imageUrl || typeof x !== 'number' || typeof y !== 'number' || typeof scale !== 'number' || !size) {
      return res.status(400).json({ error: 'Missing or invalid parameters' });
    }

    if (scale < MIN_SCALE || scale > MAX_SCALE) {
      return res.status(400).json({ error: 'Scale out of range' });
    }

    // Validate size
    if (!Object.values(Size).includes(size)) {
      return res.status(400).json({ error: 'Invalid size' });
    }

    // Get max z-index so new placement is on top
    const maxZ = await getMaxZ();
    const zIndex = maxZ + 1;

    // Create new placement in Airtable
    const placement = await createPlacement({
      imageUrl,
      x,
      y,
      scale,
      size,
      zIndex,
    });

    res.status(200).json({ success: true, placement });
  } catch (error: any) {
    console.error('Error creating placement:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
