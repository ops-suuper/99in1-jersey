import type { NextApiRequest, NextApiResponse } from 'next';
import { listLivePlacements } from '../../lib/airtable';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const side = (req.query.side as string) || 'front';
    if (!['front', 'back'].includes(side)) {
      return res.status(400).json({ error: 'bad side' });
    }

    const items = await listLivePlacements(side as 'front'|'back');
    return res.status(200).json({ items });
  } catch (e: any) {
    console.error('[placements] error:', e?.message || e);
    return res.status(500).json({ error: e?.message || 'server error in /api/placements' });
  }
}
