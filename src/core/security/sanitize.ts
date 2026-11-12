/**
 * core/security/sanitize.ts
 * Utilidades de sanitización estricta contra XSS, inyección de atributos/estilos y Prototype Pollution.
 */

const HTML_ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

export function escapeHtml(input: unknown): string {
  if (input === null || input === undefined) return '';
  return String(input).replace(/[&<>"']/g, (ch) => HTML_ESCAPE_MAP[ch] ?? ch);
}

const HEX_COLOR_RE = /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
const CSS_VAR_RE = /^var\(--[a-z0-9-_]+(?:\s*,\s*#[0-9a-f]{3,8})?\)$/i;

export function sanitizeHexColor(input: unknown, fallback = '#00F0FF'): string {
  if (typeof input !== 'string') return fallback;
  const trimmed = input.trim();
  if (HEX_COLOR_RE.test(trimmed)) return trimmed;
  if (CSS_VAR_RE.test(trimmed)) return trimmed;
  return fallback;
}

export function sanitizeImageUrl(input: unknown): string {
  if (typeof input !== 'string') return '';
  const trimmed = input.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('data:image/')) {
    // Reject SVG data URIs to avoid embedded scripts
    if (/^data:image\/svg\+xml/i.test(trimmed)) return '';
    return trimmed;
  }
  try {
    const parsed = new URL(trimmed, 'http://localhost');
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:' || parsed.protocol === 'blob:') {
      return trimmed;
    }
  } catch {
    return '';
  }
  return '';
}

const DANGEROUS_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

export function stripPrototypePollution<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => stripPrototypePollution(item)) as unknown as T;
  }
  if (value && typeof value === 'object') {
    const clean: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      if (DANGEROUS_KEYS.has(key)) continue;
      clean[key] = stripPrototypePollution(val);
    }
    return clean as T;
  }
  return value;
}

