import Airtable from 'airtable';

const API_KEY = process.env.AIRTABLE_API_KEY!;
const BASE_ID = process.env.AIRTABLE_BASE_ID!;
const TABLE = process.env.AIRTABLE_TABLE_NAME || 'placements';

if (!API_KEY) console.error('[airtable] Missing AIRTABLE_API_KEY');
if (!BASE_ID) console.error('[airtable] Missing AIRTABLE_BASE_ID');

const base = new Airtable({ apiKey: API_KEY }).base(BASE_ID);

// helpers to keep types clean
const num = (v: any, d = 0) => (typeof v === 'number' ? v : Number(v) || d);
const str = (v: any, d = '') => (typeof v === 'string' ? v : (v ?? d));

export async function listLivePlacements(side: 'front' | 'back') {
  try {
    const records = await base(TABLE)
      .select({
        // truthy checkbox + exact side
        filterByFormula: `AND({live}, {side} = '${side}')`,
        sort: [{ field: 'z_index', direction: 'asc' }],
        pageSize: 200
      })
      .all();

    return records.map(r => ({
      id: r.id,
      side: str(r.get('side')),
      size: str(r.get('size')),
      x: num(r.get('x')),
      y: num(r.get('y')),
      w: num(r.get('w')),
      z_index: num(r.get('z_index')),
      image_url: str(r.get('image_url'))
    }));
  } catch (e: any) {
    console.error('[airtable] listLivePlacements failed:', e?.message || e);
    throw e;
  }
}

export async function getMaxZ(side: 'front' | 'back') {
  try {
    const records = await base(TABLE)
      .select({
        filterByFormula: `({side} = '${side}')`,
        sort: [{ field: 'z_index', direction: 'desc' }],
        pageSize: 1
      })
      .all();
    if (records.length === 0) return 0;
    const v = records[0].get('z_index');
    return typeof v === 'number' ? v : Number(v) || 0;
  } catch (e: any) {
    console.error('[airtable] getMaxZ failed:', e?.message || e);
    throw e;
  }
}

export async function createPlacement(fields: any) {
  try {
    const r = await base(TABLE).create([{ fields }]);
    return r[0];
  } catch (e: any) {
    console.error('[airtable] createPlacement failed:', e?.message || e);
    throw e;
  }
}

export async function updatePlacement(id: string, fields: any) {
  try {
    const r = await base(TABLE).update([{ id, fields }]);
    return r[0];
  } catch (e: any) {
    console.error('[airtable] updatePlacement failed:', e?.message || e);
    throw e;
  }
}
