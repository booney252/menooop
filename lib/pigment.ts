/**
 * The signature device: every quantity in Marlow is rendered as depth of one
 * pigment soaked into a surface. No hue changes, no traffic lights, no red.
 */
export function depth(value: number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  const v = Math.max(0, Math.min(3, value));
  return 0.1 + (v / 3) * 0.9;
}

export function inkPigment(value: number | null | undefined): string {
  if (value === null || value === undefined) return "var(--color-wash)";
  return `color-mix(in srgb, var(--color-figlift) ${Math.round(depth(value) * 100)}%, var(--color-wash))`;
}

export function paperPigment(value: number | null | undefined): string {
  if (value === null || value === undefined) return "#e9dce3";
  return `color-mix(in srgb, var(--color-fig) ${Math.round(depth(value) * 100)}%, #e9dce3)`;
}
