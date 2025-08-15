export type Side = 'front' | 'back';
export type Size = 'small' | 'medium' | 'large';

export const SIZE_TO_W: Record<Size, number> = {
  small: 0.05,   // 5% of jersey width
  medium: 0.07,
  large: 0.10
};

export function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}
