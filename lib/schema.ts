export enum Size {
  Small = 'small',
  Medium = 'medium',
  Large = 'large',
}

export const SIZE_LIMITS: Record<Size, { maxWidth: number; maxHeight: number }> = {
  [Size.Small]: { maxWidth: 150, maxHeight: 150 },
  [Size.Medium]: { maxWidth: 300, maxHeight: 300 },
  [Size.Large]: { maxWidth: 500, maxHeight: 500 },
};

export const MIN_SCALE = 0.1;
export const MAX_SCALE = 3;
