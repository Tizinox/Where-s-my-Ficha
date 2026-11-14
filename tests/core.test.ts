import { describe, it, expect } from 'vitest';
import { hexToRgb, getContrastRatio, checkHudContrast } from '@core/ui/contrast';
import {
  escapeHtml,
  sanitizeHexColor,
  sanitizeImageUrl,
  stripPrototypePollution,
} from '@core/security/sanitize';
import { ALL_TABS, DEFAULT_ACTIVE_TABS } from '@app/constants';

describe('core/ui/contrast', () => {
  it('parses 3-char and 6-char hex values correctly', () => {
    expect(hexToRgb('#0ff')).toEqual({ r: 0, g: 255, b: 255 });
    expect(hexToRgb('#00F0FF')).toEqual({ r: 0, g: 240, b: 255 });
    expect(hexToRgb('invalid')).toBeNull();
  });

  it('computes high contrast for cyan on dark HUD background', () => {
    const ratio = getContrastRatio('#00F0FF', '#0a0a0c');
    expect(ratio).toBeGreaterThan(10);
    const result = checkHudContrast('#00F0FF', '#0a0a0c');
    expect(result.passes).toBe(true);
    expect(result.warning).toBeNull();
  });

  it('flags low contrast foreground colors', () => {
    const result = checkHudContrast('#111111', '#0a0a0c');
    expect(result.passes).toBe(false);
    expect(result.warning).toBeTypeOf('string');
  });
});

describe('core/security/sanitize', () => {
  it('escapes HTML special characters', () => {
    expect(escapeHtml(`<img src=x onerror="alert('xss')">&`)).toBe(
      '&lt;img src=x onerror=&quot;alert(&#39;xss&#39;)&quot;&gt;&amp;',
    );
    expect(escapeHtml(null)).toBe('');
  });

  it('accepts safe hex colors and CSS vars, rejecting injection', () => {
    expect(sanitizeHexColor('#aabbcc')).toBe('#aabbcc');
    expect(sanitizeHexColor('var(--accent)')).toBe('var(--accent)');
    expect(sanitizeHexColor('red; background:url(javascript:alert(1))')).toBe('#00F0FF');
  });

  it('allows http/https/blob/raster data URLs and blocks javascript/svg XSS', () => {
    expect(sanitizeImageUrl('https://example.com/pic.png')).toBe('https://example.com/pic.png');
    expect(sanitizeImageUrl('data:image/png;base64,AAAA')).toBe('data:image/png;base64,AAAA');
    expect(sanitizeImageUrl('data:image/svg+xml,<svg onload=alert(1)>')).toBe('');
    expect(sanitizeImageUrl('javascript:alert(1)')).toBe('');
  });

  it('strips __proto__, constructor, and prototype recursively', () => {
    const polluted = JSON.parse('{"name":"Test","__proto__":{"isAdmin":true},"nested":{"constructor":{"x":1}}}');
    const cleaned = stripPrototypePollution(polluted) as Record<string, unknown>;
    expect(Object.prototype.hasOwnProperty.call(cleaned, '__proto__')).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(cleaned.nested as object, 'constructor')).toBe(false);
    expect(cleaned.name).toBe('Test');
  });
});

describe('app/constants', () => {
  it('excludes optional tabs from default active tabs', () => {
    expect(ALL_TABS.some((t) => t.id === 'steam' && t.isOptional)).toBe(true);
    expect(DEFAULT_ACTIVE_TABS).not.toContain('steam');
    expect(DEFAULT_ACTIVE_TABS).toContain('basics');
  });
});

