// lib/schema.ts

export enum Size {
  Small = 'small',
  Medium = 'medium',
  Large = 'large',
}

// Maximum width & height allowed for each size tier
export const SIZE_LIMITS: Record<Size, { maxWidth: number; maxHeight: number }> = {
  [Size.Small]: { maxWidth: 150, maxHeight: 150 },
  [Size.Medium]: { maxWidth: 300, maxHeight: 300 },
  [Size.Large]: { maxWidth: 500, maxHeight: 500 },
};

// Minimum and maximum allowed scale multipliers
export const MIN_SCALE = 0.1;
export const MAX_SCALE = 3;

/**
 * Given an image’s original width/height and a size tier,
 * returns scaled dimensions that preserve the original aspect ratio
 * while fitting inside the max width/height for the tier.
 */
export function getScaledDimensions(
  originalWidth: number,
  originalHeight: number,
  size: Size
) {
  const { maxWidth, maxHeight } = SIZE_LIMITS[size];
  const ratio = Math.min(maxWidth / originalWidth, maxHeight / originalHeight, 1);

  return {
    width: originalWidth * ratio,
    height: originalHeight * ratio,
    scale: ratio,
  };
}
