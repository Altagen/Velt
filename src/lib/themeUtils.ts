/**
 * Returns true when the given CSS background colour is perceived as light.
 * Used to adapt hover/active states for dark vs. light themes.
 */
export function isLightTheme(background: string): boolean {
  const h = background.replace('#', '');
  if (h.length < 6) return false;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return r * 0.299 + g * 0.587 + b * 0.114 > 128;
}
