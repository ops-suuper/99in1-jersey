import type { NextApiRequest, NextApiResponse } from 'next';
import { listLivePlacements } from '../../lib/airtable';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const side = (req.query.side as string) || 'front';
  if (!['front', 'back'].includes(side)) return res.status(400).json({ error: 'bad side' });

  const items = await listLivePlacements(side as 'front'|'back');
  res.status(200).json({ items });
}
