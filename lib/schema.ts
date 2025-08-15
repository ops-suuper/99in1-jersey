// lib/schema.ts
export type Side = 'front' | 'back';
export type Size = 'small' | 'medium' | 'large';

// Max width (as a fraction of jersey width) per tier
export const SIZE_CAP: Record<Size, number> = {
  small: 0.05,   // 5% of jersey width
  medium: 0.07,  // 7%
  large: 0.10    // 10%
};

// Allow transforms within 40%–100% of the tier cap
export const MIN_SCALE = 0.4;
export const MAX_SCALE = 1.0;
