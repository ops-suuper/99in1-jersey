// lib/schema.ts
export type Side = 'front' | 'back';
export type Size = 'small' | 'medium' | 'large';

// Max *long-side* (width on canvas) as a fraction of jersey width
export const LONG_SIDE_CAP: Record<Size, number> = {
  small: 0.06,  // 6%
  medium: 0.09, // 9%
  large: 0.13   // 13%
};

// Back-compat alias so older files importing SIZE_CAP keep building
export const SIZE_CAP = LONG_SIDE_CAP;

export const MIN_SCALE = 0.4;  // 40% of cap
export const MAX_SCALE = 1.0;  // 100% of cap

export function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}
