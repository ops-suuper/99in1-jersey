export type Size = 'small' | 'medium' | 'large';

// Scale limits for each size category
export const SIZE_LIMITS: Record<Size, { maxScale: number }> = {
  small: { maxScale: 0.8 },   // Smaller max scale for small tier
  medium: { maxScale: 1.2 },  // Moderate size
  large: { maxScale: 2.0 },   // Biggest allowed size
};

// Minimum and maximum scaling allowed globally
export const MIN_SCALE = 0.1;
export const MAX_SCALE = 3.0;
