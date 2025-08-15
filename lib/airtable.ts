// lib/airtable.ts
import Airtable from 'airtable';

// --- Env
const API_KEY = process.env.AIRTABLE_API_KEY!;
const BASE_ID = process.env.AIRTABLE_BASE_ID!;
const TABLE = process.env.AIRTABLE_TABLE_NAME || 'placements';

if (!API_KEY) console.error('[airtable] Missing AIRTABLE_API_KEY');
if (!BASE_ID) console.error('[airtable] Missing AIRTABLE_BASE_ID');

// --- Client
const base = new Airtable({ apiKey: API_KEY }).base(BASE_ID);

// --- Helpers to keep types clean/safe
const num = (v: any, d = 0) => (typeof v === 'number' ? v : Number(v) || d);
const str = (v: any, d = '') => (typeof v === 'string' ? v : (v ?? d));

// --- Types used by the app (optional but handy)
export type PlacementRecord = {
  id: string;
  side: 'front' | 'back' | string;
  size: 'small' | 'medium' | 'large' | string;
  x: number;          // normalized 0..1
  y: number;          // normalized 0..1
  w: number;          // normalized width 0..1
  z_index: number;
  image_url: string;
  rotation: number;   // degrees
};

// List paid+live placements for a given side, ordered by z-index (ascending)
export async function listLivePlacements(side: 'front' | 'back'): Promise<PlacementRecord[]> {
  try {
    const records = await base(TABLE)
      .select({
        // Checkbox truthiness + exact side match (all lowercase in Airtable options)
        filterByFormula: `AND({live}, {side} = '${side}')`,
        sort: [{ field: 'z_index', direction: 'asc' }]
        // No pageSize override here; .all() will paginate with default (<=100 per page)
      })
      .all();

    return records.map((r) => ({
      id: r.id,
      side: str(r.get('side')) as any,
      size: str(r.get('size')) as any,
      x: num(r.get('x')),
      y: num(r.get('y')),
      w: num(r.get('w')),
      z_index: num(r.get('z_index')),
      image_url: str(r.get('image_url')),
      rotation: num(r.get('rotation'))
    }));
  } catch (e: any) {
    console.error('[airtable] listLivePlacements failed:', e?.message || e);
    throw e;
  }
}

// Highest z-index for a side (so the next placement can layer above)
export async function getMaxZ(side: 'front' | 'back'): Promise<number> {
  try {
    const records = await base(TABLE)
      .select({
        filterByFormula: `({side} = '${side}')`,
        sort: [{ field: 'z_index', direction: 'desc' }],
        pageSize: 1 // allowed (1..100)
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

// Create a new placement (pending/live=false before payment)
export async function createPlacement(fields: {
  status: 'pending' | 'paid' | 'cancelled' | string;
  side: 'front' | 'back' | string;
  size: 'small' | 'medium' | 'large' | string;
  x: number;
  y: number;
  w: number;
  rotation?: number;
  image_url: string;
  public_id: string;
  z_index: number;
  live: boolean;
}) {
  try {
    const r = await base(TABLE).create([{ fields }]);
    return r[0];
  } catch (e: any) {
    console.error('[airtable] createPlacement failed:', e?.message || e);
    throw e;
  }
}

// Update an existing placement by Airtable record ID
export async function updatePlacement(
  id: string,
  fields: Partial<{
    status: 'pending' | 'paid' | 'cancelled' | string;
    side: 'front' | 'back' | string;
    size: 'small' | 'medium' | 'large' | string;
    x: number;
    y: number;
    w: number;
    rotation: number;
    image_url: string;
    public_id: string;
    z_index: number;
    live: boolean;
    checkout_session_id: string;
    amount: number;
    email: string;
  }>
) {
  try {
    const r = await base(TABLE).update([{ id, fields }]);
    return r[0];
  } catch (e: any) {
    console.error('[airtable] updatePlacement failed:', e?.message || e);
    throw e;
  }
}
