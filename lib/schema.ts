export type Side = 'front' | 'back';
export type Size = 'small' | 'medium' | 'large';

// Max width (as a fraction of jersey width) per tier
export const SIZE_CAP: Record<Size, number> = {
  small: 0.05,   // 5% of jersey width
  medium: 0.07,  // 7%
  large: 0.10    // 10%
};

// Let users choose 40%–100% of their tier cap
export const MIN_SCALE = 0.4;  // 40% of cap
export const MAX_SCALE = 1.0;  // 100% of cap

export function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

export function clampScale(scale: number) {
  return Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale));
}

// Validate chosen width 'w' for a given tier
export function clampWidthForTier(size: Size, w: number) {
  const cap = SIZE_CAP[size];
  const min = cap * MIN_SCALE;
  const max = cap * MAX_SCALE;
  return Math.max(min, Math.min(max, w));
}
