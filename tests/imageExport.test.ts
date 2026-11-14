import { describe, it, expect, beforeEach, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  stripHtmlForCanvas,
  buildCharacterExportSheetModel,
  wrapTextLines,
} from '@features/export/imageExporter.ts';
import {
  buildClassicPdfDocumentModel,
  encodeJpegPagesToPdf,
} from '@features/export/pdfExporter.ts';
import { createExportMethods } from '@app/export.js';
import { renderModalDiscord } from '@ui/modals/modalDiscord.ts';
import { renderHeader } from '@ui/layout/header.ts';
import { renderUnifiedSheet } from '@ui/views/sheetUnified.ts';
import { renderClassicSheet } from '@ui/views/sheetClassic.ts';
import { renderDashboardView } from '@ui/views/dashboard.ts';
import { renderSettingsData } from '@ui/views/settings/settingsData.ts';

function buildSampleCharacter(overrides: Record<string, any> = {}) {
  return {
    id: 'char-hero-1',
    name: 'Artorias el Caminante',
    updatedAt: '2026-01-15T12:00:00.000Z',
    basics: {
      fullName: 'Sir Artorias del Abismo',
      nickname: 'Caminante del Abismo',
      race: 'Caballero de Gwyn',
      role: 'Espadachín',
      realAge: 'Desconocida',
      genderPronouns: 'Él',
      alignment: 'Legal Bueno',
      quotes: ['<i>«El abismo consume incluso a los más puros.»</i>'],
      avatarDataUrl: 'data:image/png;base64,AAA',
      bannerDataUrl: 'data:image/png;base64,BBB',
    },
    body: {
      height: '2.10 m',
      weight: '115 kg',
      build: 'Atlética y acorazada',
      eyeColor: 'Azul tenue',
      hairColor: 'Plateado',
      physicalDescription: '<p>Armadura azulada desgastada.<br>Capa hecha jirones.</p>',
    },
    mind: {
      personalitySummary: 'Estoico, honorable y resuelto frente a la corrupción.',
      virtues: 'Lealtad inquebrantable',
      flaws: 'Exceso de sacrificio',
    },
    social: {
      faction: 'Cuatro Caballeros de Gwyn',
      friendsAllies: 'Sif el Gran Lobo Gris',
    },
    beliefs: {
      moralCode: 'Proteger Oolacile a cualquier costo',
      originEvent: '<p>Descendió solo al abismo para sellar a Manus.</p>',
    },
    priorities: {
      mainGoal: 'Contener la expansión de la oscuridad',
    },
    powerScaling: {
      tier: '7-B',
      strikingStrength: 'Ciudad',
      speed: 'Hipersónico',
      durability: 'Ciudad',
      range: 'Decenas de metros',
      stamina: 'Sobrehumana',
      iq: 'Alto',
      biq: 'Maestro espadachín',
    },
    skills: [
      { name: 'Estocada del Lobo', category: 'Combate', rank: 'A+', cost: 'Estamina', description: 'Salto acrobático con gran espadón.' },
      { name: 'Escudo de Santuario', category: 'Defensa', rank: 'A', description: 'Barrera contra corrupción abismal.' },
    ],
    weapons: [
      { name: 'Espadón de Artorias', type: 'Espadón', damage: 'Alto', range: 'Alcance largo', description: 'Forjado para cazar seres oscuros.' },
    ],
    customTabs: [
      {
        id: 'tab-extra-1',
        label: 'Crónica Extra',
        blocks: [
          { label: 'Compañero', content: '<b>Sif</b> guardó su tumba en el Bosque Tenebroso.' },
        ],
      },
    ],
    ...overrides,
  };
}

describe('Image Exporter & Unified Export Flow', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('strips rich HTML into clean readable plain text', () => {
    const html = '<p>Primera línea<br>Segunda &amp; <b>tercera</b></p><ul><li>Habilidad A</li><li>Habilidad B</li></ul>';
    const cleaned = stripHtmlForCanvas(html);

    expect(cleaned).toContain('Primera línea\nSegunda & tercera');
    expect(cleaned).toContain('• Habilidad A');
    expect(cleaned).toContain('• Habilidad B');
    expect(cleaned).not.toContain('<p>');
    expect(cleaned).not.toContain('&amp;');
  });

  it('builds complete and compact sheet models cleanly while hiding empty sections', () => {
    const sample = buildSampleCharacter();

    const completeModel = buildCharacterExportSheetModel(sample, { preset: 'complete' });
    expect(completeModel.name).toBe('Sir Artorias del Abismo');
    expect(completeModel.alias).toBe('Caminante del Abismo');
    expect(completeModel.quote).toBe('«El abismo consume incluso a los más puros.»');
    expect(completeModel.badges).toContain('Tier 7-B');
    expect(completeModel.stats.some((s) => s.label === 'Potencia (AP)')).toBe(true);
    expect(completeModel.sections.some((sec) => sec.id === 'weapons')).toBe(true);
    const extrasSec = completeModel.sections.find((sec) => sec.id === 'extras');
    expect(extrasSec?.fields?.some((f) => f.label === 'Crónica Extra' && f.value.includes('Sif guardó su tumba'))).toBe(true);

    const compactModel = buildCharacterExportSheetModel(sample, {
      preset: 'compact',
      hideTierBadge: true,
    });
    expect(compactModel.badges.some((b) => b.startsWith('Tier'))).toBe(false);
    expect(compactModel.sections.some((sec) => sec.id === 'compact-profile')).toBe(true);
    expect(compactModel.sections.some((sec) => sec.id === 'extras')).toBe(false);

    const minimalChar = { id: 'min-1', name: 'Nadie', basics: {}, skills: [], weapons: [] };
    const minimalModel = buildCharacterExportSheetModel(minimalChar, { preset: 'complete' });
    expect(minimalModel.name).toBe('Nadie');
    expect(minimalModel.stats).toEqual([]);
    expect(minimalModel.sections).toEqual([]);
  });

  it('wraps long prose and enforces maxLines with ellipsis', () => {
    const measure = (text: string) => text.length * 10;
    const lines = wrapTextLines(
      measure,
      'Esta es una descripción editorial lo suficientemente extensa para requerir múltiples saltos de línea.',
      180,
      3,
    );

    expect(lines).toHaveLength(3);
    expect(lines[2].endsWith('…')).toBe(true);
    lines.forEach((line) => expect(measure(line)).toBeLessThanOrEqual(190));
  });

  it('manages unified modal state, smart routing (Ficha A -> image, Ficha B -> pdf), preferences and openDiscordModal', () => {
    const activeUnified = buildSampleCharacter({ sheetType: 'unified' });
    const classicChar = buildSampleCharacter({
      id: 'char-hero-2',
      name: 'Solaire de Astora',
      sheetType: 'classic',
      basics: { fullName: 'Solaire de Astora' },
    });

    const methods = createExportMethods();
    const store: any = {
      toast: vi.fn(),
      ...methods,
    };
    Object.defineProperties(store, Object.getOwnPropertyDescriptors(methods));
    store.loadSavedDiscordPreferences = vi.fn();
    store.refreshExportImagePreview = vi.fn(async () => {});
    store.refreshExportPdfPreview = vi.fn(async () => {});

    (window as any).Alpine = {
      store: (name: string) => {
        if (name === 'characters') {
          return {
            active: activeUnified,
            list: [activeUnified, classicChar],
            exportJSONForChar: vi.fn(),
          };
        }
        return store;
      },
    };

    // Opens on PDF tab automatically when target is Ficha B (sheetType === 'classic')
    store.openExportModal('char-hero-2');
    expect(store.showDiscordModal).toBe(true);
    expect(store.exportModalTab).toBe('pdf');
    expect(store.exportTargetChar?.id).toBe('char-hero-2');
    expect(store.refreshExportPdfPreview).toHaveBeenCalledTimes(1);

    // PDF theme and image inclusion preferences persist
    store.setExportPdfTheme('dark');
    store.toggleExportPdfImages();
    expect(store.exportPdfTheme).toBe('dark');
    expect(store.exportPdfIncludeImages).toBe(false);
    expect(store.refreshExportPdfPreview).toHaveBeenCalledTimes(3);
    const savedPdfPrefs = JSON.parse(localStorage.getItem('superficha_pdf_export_prefs') || '{}');
    expect(savedPdfPrefs).toEqual({ theme: 'dark', includeImages: false });

    // Opens on Image PNG tab automatically when target is Ficha A (sheetType === 'unified')
    store.closeDiscordModal();
    store.openExportModal(null);
    expect(store.showDiscordModal).toBe(true);
    expect(store.exportModalTab).toBe('image');
    expect(store.exportTargetChar?.id).toBe('char-hero-1');
    expect(store.refreshExportImagePreview).toHaveBeenCalledTimes(1);

    // Explicit image tab preset and theme changes persist
    store.setExportImagePreset('compact');
    store.setExportImageTheme('light');
    expect(store.exportImagePreset).toBe('compact');
    expect(store.exportImageTheme).toBe('light');

    // Legacy openDiscordModal opens the Discord tab smoothly
    store.closeDiscordModal();
    store.openDiscordModal();
    expect(store.showDiscordModal).toBe(true);
    expect(store.exportModalTab).toBe('discord');
    expect(store.discordFullText).toContain('Sir Artorias del Abismo');
  });

  it('exposes PDF and image export controls across modal, header, classic/unified sheets, dashboard, settings and devConsole', () => {
    const modalHtml = renderModalDiscord();
    expect(modalHtml).toContain('id="discord-modal"');
    expect(modalHtml).toContain('PDF con Imágenes');
    expect(modalHtml).toContain('Descargar PDF');
    expect(modalHtml).toContain('Incluir retratos, galería e ítems');
    expect(modalHtml).toContain('Imagen PNG');
    expect(modalHtml).toContain('Ficha Completa');
    expect(modalHtml).toContain('Tarjeta Resumida');
    expect(modalHtml).toContain('Papel Claro');
    expect(modalHtml).toContain('Descargar PNG');
    expect(modalHtml).toContain('Copiar Imagen');
    expect(modalHtml).toContain('Texto Discord');
    expect(modalHtml).toContain('Archivo JSON');

    const headerHtml = renderHeader();
    expect(headerHtml).toContain('id="btn-export-sheet"');
    expect(headerHtml).toContain('openExportModal(null)');

    const unifiedHtml = renderUnifiedSheet();
    expect(unifiedHtml).toContain("openExportModal(null, 'image')");

    const classicHtml = renderClassicSheet();
    expect(classicHtml).toContain('id="btn-classic-export-pdf"');
    expect(classicHtml).toContain("openExportModal(null, 'pdf')");
    expect(classicHtml).toContain('Exportar PDF');

    const dashHtml = renderDashboardView();
    expect(dashHtml).toContain('openExportModal(char.id)');
    expect(dashHtml).toContain('Exportar PDF');
    expect(dashHtml).toContain('Exportar Imagen');

    const settingsHtml = renderSettingsData();
    expect(settingsHtml).toContain('openExportModal(null)');
    expect(settingsHtml).toContain('Exportar Ficha B (PDF con imágenes)');

    const devConsoleSrc = readFileSync(
      resolve(process.cwd(), 'src/features/dev-console/devConsole.store.js'),
      'utf8',
    );
    expect(devConsoleSrc).toContain("openExportModal?.(null, 'image')");
    expect(devConsoleSrc).toContain("openExportModal?.(null, 'pdf')");
    expect(devConsoleSrc).toContain("cmd: 'export pdf'");
    expect(devConsoleSrc).not.toContain('La exportación a imagen ha sido deshabilitada');
  });
});

describe('Classic Sheet (Ficha B) PDF Exporter', () => {
  it('builds a structured document model with color swatches, non-neutral axes, custom tabs, item images and deduplicated gallery', () => {
    const classicChar = buildSampleCharacter({
      sheetType: 'classic',
      basics: {
        fullName: 'Lady Maria de la Torre del Reloj Astral',
        nickname: 'Lady Maria',
        race: 'Cazadora Cainhurst',
        role: 'Guardiana del Secreto',
        realAge: 'Desconocida',
        genderPronouns: 'Ella',
        alignment: 'Neutral Legal',
        quotes: ['<i>«Un cadáver debería dejarse bien solo.»</i>'],
        avatarDataUrl: 'data:image/png;base64,AVATAR_UNIQUE',
        bannerDataUrl: 'data:image/png;base64,BANNER_UNIQUE',
      },
      body: {
        height: '1.80 m',
        eyeColor: 'Gris pálido',
        eyeColorHex: '#9aa4b0',
        hairColor: 'Rubio ceniza',
        hairColorHex: '#d8cfb8',
        skinColor: 'Pálida',
        skinColorHex: '#ece4dc',
        physicalDescription: '<p>Abrigo carmesí bordado.<br>Sombrero tricornio de cazadora.</p>',
      },
      mind: {
        personalitySummary: 'Melancólica pero implacable protectora.',
        axes: [
          { leftLabel: 'Cruel', rightLabel: 'Compasiva', value: 78, category: 'Moral' },
          { leftLabel: 'Caótica', rightLabel: 'Metódica', value: 50, category: 'Neutral' },
        ],
      },
      skills: [
        {
          title: 'Danza de Sangre',
          type: 'active',
          tier: 'S',
          elementType: 'Fuego / Sangre',
          cost: 'HP',
          summary: 'Tajo flameante de gran alcance.',
          imageDataUrl: 'data:image/png;base64,SKILL_IMG',
          imageFit: 'cover',
        },
      ],
      weapons: [
        {
          name: 'Rakuyo',
          weaponType: 'Sable gemelo',
          rarity: 'Única',
          damageType: 'Cortante',
          description: 'Espada elegante de Cainhurst.',
          imageDataUrl: 'data:image/png;base64,WEAPON_IMG',
        },
      ],
      customTabs: [
        {
          id: 'tab-extra-1',
          label: 'Archivo Astral',
          blocks: [
            {
              title: 'Reliquias',
              fields: [
                { type: 'text', label: 'Título Antiguo', value: 'Discípula de Gehrman' },
                { type: 'image', label: 'Torre del Reloj', value: 'data:image/png;base64,CUSTOM_IMG' },
                { type: 'stat', label: 'Maestría Astral', value: 85, max: 100 },
              ],
              items: [
                {
                  title: 'Vial antiguo',
                  description: 'Sangre preservada de Cainhurst',
                  dataUrl: 'data:image/png;base64,ITEM_IMG',
                },
              ],
            },
          ],
        },
      ],
      extras: {
        gallery: [
          { dataUrl: 'data:image/png;base64,AVATAR_UNIQUE', caption: 'Duplicado avatar' },
          { dataUrl: 'data:image/png;base64,GALLERY_1', caption: 'Boceto oficial' },
        ],
      },
    });

    const fullModel = buildClassicPdfDocumentModel(classicChar, { includeImages: true });
    expect(fullModel.name).toBe('Lady Maria de la Torre del Reloj Astral');
    expect(fullModel.sheetLabel).toBe('FICHA B · DOSIER EDITORIAL');
    expect(fullModel.avatarUrl).toBe('data:image/png;base64,AVATAR_UNIQUE');
    expect(fullModel.bannerUrl).toBe('data:image/png;base64,BANNER_UNIQUE');

    const eyeField = fullModel.bodyFields.find((f) => f.label === 'Color de Ojos');
    expect(eyeField?.swatchHex).toBe('#9aa4b0');
    expect(fullModel.mindAxes).toHaveLength(1);
    expect(fullModel.mindAxes[0].rightLabel).toBe('Compasiva');
    expect(fullModel.skills[0].imageUrl).toBe('data:image/png;base64,SKILL_IMG');
    expect(fullModel.weapons[0].imageUrl).toBe('data:image/png;base64,WEAPON_IMG');

    expect(fullModel.customSections).toHaveLength(1);
    const customSec = fullModel.customSections[0];
    expect(customSec.title).toBe('Archivo Astral');
    expect(customSec.fields.some((f) => f.label === 'Título Antiguo' && f.value === 'Discípula de Gehrman')).toBe(true);
    expect(customSec.fields.some((f) => f.label === 'Vial antiguo' && f.value.includes('Cainhurst'))).toBe(true);
    expect(customSec.stats.some((st) => st.label === 'Maestría Astral' && st.value === 85 && st.max === 100)).toBe(true);
    expect(customSec.images.some((im) => im.url === 'data:image/png;base64,CUSTOM_IMG')).toBe(true);
    expect(customSec.images.some((im) => im.url === 'data:image/png;base64,ITEM_IMG')).toBe(true);

    // Avatar & banner duplicates must be filtered out of the extras gallery
    expect(fullModel.gallery).toHaveLength(1);
    expect(fullModel.gallery[0].caption).toBe('Boceto oficial');

    // Text-only PDF option strips all image URLs cleanly
    const textOnlyModel = buildClassicPdfDocumentModel(classicChar, { includeImages: false });
    expect(textOnlyModel.avatarUrl).toBe('');
    expect(textOnlyModel.bannerUrl).toBe('');
    expect(textOnlyModel.skills[0].imageUrl).toBe('');
    expect(textOnlyModel.weapons[0].imageUrl).toBe('');
    expect(textOnlyModel.customSections[0].images).toEqual([]);
    expect(textOnlyModel.gallery).toEqual([]);
  });

  it('encodes multi-page JPEG streams into a spec-compliant A4 PDF 1.4 binary with exact xref byte offsets', () => {
    const fakeJpegPage1 = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0xff, 0xd9]);
    const fakeJpegPage2 = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x01, 0xff, 0xd9]);

    const pdfBytes = encodeJpegPagesToPdf([
      { jpegBytes: fakeJpegPage1, pixelWidth: 1190, pixelHeight: 1684 },
      { jpegBytes: fakeJpegPage2, pixelWidth: 1190, pixelHeight: 1684 },
    ]);

    const ascii = new TextDecoder('latin1').decode(pdfBytes);
    expect(ascii.startsWith('%PDF-1.4\n')).toBe(true);
    expect(ascii).toContain('/Type /Pages');
    expect(ascii).toContain('/Count 2');
    expect(ascii).toContain('/MediaBox [0 0 595.28 841.89]');
    expect(ascii).toContain('/Filter /DCTDecode');
    expect(ascii.trimEnd().endsWith('%%EOF')).toBe(true);

    // Verify startxref points directly to "xref" and every object offset in xref matches actual byte offset
    const startXrefMatch = ascii.match(/startxref\n(\d+)\n%%EOF/);
    expect(startXrefMatch).not.toBeNull();
    const startXrefOffset = Number(startXrefMatch![1]);
    expect(ascii.slice(startXrefOffset, startXrefOffset + 4)).toBe('xref');

    const objMatches = Array.from(ascii.matchAll(/(\d+) 0 obj\n/g));
    expect(objMatches.length).toBeGreaterThanOrEqual(8);
    for (const match of objMatches) {
      const objOffset = match.index!;
      const paddedOffset = String(objOffset).padStart(10, '0');
      expect(ascii).toContain(`${paddedOffset} 00000 n `);
    }
  });
});
