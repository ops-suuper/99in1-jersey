// lib/schema.ts

export type Side = 'front' | 'back';
export type Size = 'small' | 'medium' | 'large';

/**
 * Max *long-side* (our canvas uses width) as a fraction of jersey width.
 * These create a clear visual difference between tiers and prevent distortion.
 */
export const LONG_SIDE_CAP: Record<Size, number> = {
  small: 0.06,  // 6%
  medium: 0.09, // 9%
  large: 0.13   // 13%
};

/** Back-compat alias so any older imports keep working. */
export const SIZE_CAP = LONG_SIDE_CAP;

/** Users can resize within 40%–100% of their tier’s cap. */
export const MIN_SCALE = 0.4;
export const MAX_SCALE = 1.0;

export function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}
