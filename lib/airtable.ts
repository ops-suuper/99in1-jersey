import Airtable from 'airtable';

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY! }).base(
  process.env.AIRTABLE_BASE_ID!
);
const TABLE = process.env.AIRTABLE_TABLE_NAME || 'placements';

export async function listLivePlacements(side: 'front' | 'back') {
  const records = await base(TABLE)
    .select({
      filterByFormula: `AND({live} = 1, {side} = '${side}')`,
      sort: [{ field: 'z_index', direction: 'asc' }],
      pageSize: 200
    })
    .all();

  return records.map(r => ({
    id: r.id,
    side: r.get('side'),
    size: r.get('size'),
    x: r.get('x'),
    y: r.get('y'),
    w: r.get('w'),
    z_index: r.get('z_index'),
    image_url: r.get('image_url')
  }));
}

export async function getMaxZ(side: 'front' | 'back') {
  const records = await base(TABLE)
    .select({
      filterByFormula: `({side} = '${side}')`,
      sort: [{ field: 'z_index', direction: 'desc' }],
      pageSize: 1
    })
    .all();
  if (records.length === 0) return 0;
  return (records[0].get('z_index') as number) || 0;
}

export async function createPlacement(fields: any) {
  const r = await base(TABLE).create([{ fields }]);
  return r[0];
}

export async function updatePlacement(id: string, fields: any) {
  const r = await base(TABLE).update([{ id, fields }]);
  return r[0];
}
