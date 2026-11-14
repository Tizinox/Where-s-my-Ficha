/**
 * core/ui/contrast.ts
 * Calculadora de luminancia relativa y relación de contraste WCAG 2.1.
 */

export interface RgbColor {
  r: number;
  g: number;
  b: number;
}

export interface HudContrastResult {
  ratio: number;
  ratioFormatted: string;
  passes: boolean;
  warning: string | null;
}

export function hexToRgb(hex: string): RgbColor | null {
  if (!hex || typeof hex !== 'string') return null;
  let cleanHex = hex.trim().replace(/^#/, '');
  if (cleanHex.length === 3) {
    cleanHex = cleanHex
      .split('')
      .map((c) => c + c)
      .join('');
  }
  if (cleanHex.length !== 6) return null;
  const num = parseInt(cleanHex, 16);
  if (Number.isNaN(num)) return null;
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

export function getRelativeLuminance(r: number, g: number, b: number): number {
  const normalize = (val: number) => {
    const s = val / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * normalize(r) + 0.7152 * normalize(g) + 0.0722 * normalize(b);
}

export function getContrastRatio(hex1: string, hex2: string): number {
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);
  if (!rgb1 || !rgb2) return 1;

  const lum1 = getRelativeLuminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = getRelativeLuminance(rgb2.r, rgb2.g, rgb2.b);

  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);

  return (lighter + 0.05) / (darker + 0.05);
}

export function checkHudContrast(accentHex: string, bgHex = '#0a0a0c'): HudContrastResult {
  const ratio = getContrastRatio(accentHex, bgHex);
  const ratioFormatted = ratio.toFixed(1);
  const passes = ratio >= 3.0;

  return {
    ratio,
    ratioFormatted,
    passes,
    warning: !passes
      ? `Este color tiene bajo contraste (${ratioFormatted}:1) y puede dificultar la lectura en la interfaz oscura.`
      : null,
  };
}

