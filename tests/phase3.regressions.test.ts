import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ensureCharacterDefaults } from '@features/characters/schema.js';
import { parseMarkdownToHtml } from '@core/rich-text/textFormatterEngine.js';
import { parseAndValidateJSON } from '@features/export/exportEngine.js';
import { ls } from '@core/db/storage.ts';
import { createCustomTabMethods } from '@features/characters/customTabs.js';
import { createMediaMethods } from '@features/characters/media.js';

describe('Phase 3 regression fixes', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('preserves full active weapon schema in ensureCharacterDefaults', () => {
    const normalized = ensureCharacterDefaults({
      id: 'char-1',
      name: 'Aria',
      weapons: [
        {
          id: 'wp-1',
          name: 'Espada Solar',
          weaponType: 'Mandoble',
          rarity: 'Legendaria',
          rarityColor: '#f59e0b',
          tags: ['Fuego', 'A dos manos'],
          damage: '3d10 + 6',
          range: 'Cuerpo a cuerpo (2m)',
          cd: '2 turnos',
          td: 'Estándar',
          linkedSkillId: 'skill-42',
          properties: 'Ignición al impacto',
          lore: 'Forjada en un núcleo estelar.',
          imageDataUrl: 'data:image/png;base64,AAA',
        },
      ],
    });

    expect(normalized.weapons).toHaveLength(1);
    expect(normalized.weapons[0]).toMatchObject({
      id: 'wp-1',
      name: 'Espada Solar',
      weaponType: 'Mandoble',
      rarity: 'Legendaria',
      rarityColor: '#f59e0b',
      tags: ['Fuego', 'A dos manos'],
      damage: '3d10 + 6',
      range: 'Cuerpo a cuerpo (2m)',
      cd: '2 turnos',
      td: 'Estándar',
      linkedSkillId: 'skill-42',
      properties: 'Ignición al impacto',
      lore: 'Forjada en un núcleo estelar.',
    });
  });

  it('escapes stored XSS payloads inside colored rich-text spans', () => {
    const payload = '<span style="color: #00F0FF;"><img src=x onerror="alert(1)">**Texto**</span>';
    const rendered = parseMarkdownToHtml(payload);

    expect(rendered).not.toContain('<img');
    expect(rendered).toContain('&lt;img src=x onerror=&quot;alert(1)&quot;&gt;');
    expect(rendered).toContain('<span style="color: #00f0ff;">');
    expect(rendered).toContain('<strong>Texto</strong>');
  });

  it('sanitizes malicious CSS style attributes in colored spans', () => {
    const exprPayload = '<span style="color: expression(alert(1));">hola</span>';
    expect(parseMarkdownToHtml(exprPayload)).toBe('<span style="color: #ffffff;">hola</span>');

    const multiPropPayload = '<span style="color: red; background:url(javascript:alert(1));">hola</span>';
    expect(parseMarkdownToHtml(multiPropPayload)).not.toContain('<span');
    expect(parseMarkdownToHtml(multiPropPayload)).toContain('&lt;span');
  });

  it('strips prototype pollution keys when importing character JSON', () => {
    const maliciousJson =
      '{"id":"c1","name":"Operativo","__proto__":{"polluted":true},"basics":{"constructor":{"prototype":{"hacked":true}},"fullName":"Operativo Uno"}}';

    const result = parseAndValidateJSON(maliciousJson) as {
      id: string;
      name: string;
      basics: { fullName: string };
    };
    expect(result.id).toBe('c1');
    expect(Object.prototype.hasOwnProperty.call(result, '__proto__')).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(result.basics, 'constructor')).toBe(false);
    expect(result.basics.fullName).toBe('Operativo Uno');
  });

  it('removes stale localStorage key when payload exceeds 1.5MB safety threshold', () => {
    ls.setJSON('superficha_custom_emojis', [{ shortcode: 'old' }]);
    expect(ls.get('superficha_custom_emojis')).not.toBeNull();

    const oversizedPayload = { big: 'x'.repeat(1_600_000) };
    ls.setJSON('superficha_custom_emojis', oversizedPayload);

    expect(ls.get('superficha_custom_emojis')).toBeNull();
  });

  it('moves block builder fields up and down when side is omitted and rotates CSS transforms', () => {
    vi.useFakeTimers();
    const store = {
      ...createMediaMethods(),
      ...createCustomTabMethods(),
      blockBuilderForm: {
        fields: [{ id: 'a' }, { id: 'b' }, { id: 'c' }],
      },
    };

    store.moveBlockBuilderField(0, 1);
    expect(store.blockBuilderForm.fields.map((f) => f.id)).toEqual(['b', 'a', 'c']);

    store.moveBlockBuilderField(2, 1);
    expect(store.blockBuilderForm.fields.map((f) => f.id)).toEqual(['b', 'c', 'a']);

    expect(store._rotateCssTransform('', 90)).toBe('transform: rotate(90deg);');
    expect(store._rotateCssTransform('transform: rotate(90deg);', 90)).toBe('transform: rotate(180deg);');
    vi.runAllTimers();
    vi.useRealTimers();
  });
});
