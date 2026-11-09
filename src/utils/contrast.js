/**
 * utils/contrast.js
 * Calculadora de luminancia relativa y relación de contraste WCAG 2.1
 * para verificar legibilidad de colores de acento en interfaces oscuras.
 */

/**
 * Convierte un color HEX (3 o 6 dígitos) a un objeto { r, g, b } (0-255)
 */
export function hexToRgb(hex) {
  if (!hex || typeof hex !== 'string') return null;
  let cleanHex = hex.trim().replace(/^#/, '');
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map(c => c + c).join('');
  }
  if (cleanHex.length !== 6) return null;
  const num = parseInt(cleanHex, 16);
  if (isNaN(num)) return null;
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255
  };
}

/**
 * Calcula la luminancia relativa según la especificación WCAG 2.1
 * L = 0.2126 * R + 0.7152 * G + 0.0722 * B
 */
export function getRelativeLuminance(r, g, b) {
  const normalize = (val) => {
    const s = val / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * normalize(r) + 0.7152 * normalize(g) + 0.0722 * normalize(b);
}

/**
 * Calcula la relación de contraste entre dos colores HEX
 * Retorna un valor numérico (ej. 4.5 para 4.5:1)
 */
export function getContrastRatio(hex1, hex2) {
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);
  if (!rgb1 || !rgb2) return 1;

  const lum1 = getRelativeLuminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = getRelativeLuminance(rgb2.r, rgb2.g, rgb2.b);

  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Evalúa el contraste de un color de acento contra los fondos oscuros principales del HUD (#0a0a0c)
 * Retorna { ratio, ratioFormatted, passes, warning }
 */
export function checkHudContrast(accentHex, bgHex = '#0a0a0c') {
  const ratio = getContrastRatio(accentHex, bgHex);
  const ratioFormatted = ratio.toFixed(1);
  // Threshold WCAG AA para componentes interfaz y texto amplio en HUD oscuro: 3.0:1
  const passes = ratio >= 3.0;

  return {
    ratio,
    ratioFormatted,
    passes,
    warning: !passes ? `Este color tiene bajo contraste (${ratioFormatted}:1) y puede dificultar la lectura en la interfaz oscura.` : null
  };
}
