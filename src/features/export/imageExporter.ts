/**
 * @file src/features/export/imageExporter.ts
 * Generador editorial de fichas de personaje en imagen PNG legible (Canvas 2D).
 */

import { sanitizeCorruptedTokens } from '@core/rich-text/textFormatterEngine.js';

export type ExportImagePreset = 'complete' | 'compact';
export type ExportImageTheme = 'dark' | 'light';

export interface ExportImageOptions {
  preset?: ExportImagePreset;
  theme?: ExportImageTheme;
  hideTierBadge?: boolean;
}

export interface ExportFieldEntry {
  label: string;
  value: string;
}

export interface ExportItemEntry {
  title: string;
  subtitle?: string;
  description?: string;
}

export interface ExportSectionCard {
  id: string;
  title: string;
  fullWidth?: boolean;
  fields?: ExportFieldEntry[];
  paragraphs?: string[];
  items?: ExportItemEntry[];
}

export interface CharacterExportSheetModel {
  name: string;
  alias: string;
  quote: string;
  bannerUrl: string;
  avatarUrl: string;
  avatarAspect: 'square' | 'portrait';
  avatarShape: 'rounded' | 'circle' | 'square';
  badges: string[];
  stats: ExportFieldEntry[];
  sections: ExportSectionCard[];
  footerMeta: string;
}

interface PaletteTokens {
  bgOuter: string;
  bgCard: string;
  bgMuted: string;
  border: string;
  borderStrong: string;
  textMain: string;
  textMuted: string;
  textDim: string;
  accent: string;
  accentSoft: string;
}

const PALETTES: Record<ExportImageTheme, PaletteTokens> = {
  dark: {
    bgOuter: '#101116',
    bgCard: '#17181f',
    bgMuted: '#20222c',
    border: '#303342',
    borderStrong: '#484c60',
    textMain: '#ededf3',
    textMuted: '#adb0bf',
    textDim: '#7a7e90',
    accent: '#c8aa6e',
    accentSoft: 'rgba(200, 170, 110, 0.14)',
  },
  light: {
    bgOuter: '#e7e2d7',
    bgCard: '#f9f6ef',
    bgMuted: '#efeae0',
    border: '#cbc4b4',
    borderStrong: '#968c78',
    textMain: '#1d1c19',
    textMuted: '#575249',
    textDim: '#7a7469',
    accent: '#7a5221',
    accentSoft: 'rgba(122, 82, 33, 0.11)',
  },
};

const LOGICAL_WIDTH = 1200;
const OUTER_PAD = 44;
const INNER_WIDTH = LOGICAL_WIDTH - OUTER_PAD * 2;
const SECTION_GAP = 22;
const CARD_PAD_X = 24;
const CARD_PAD_Y = 20;
const FONT_DISPLAY = 'Georgia, "Source Serif 4", "Times New Roman", serif';
const FONT_SANS = 'system-ui, -apple-system, "Segoe UI", Inter, Roboto, sans-serif';
const FONT_MONO = 'ui-monospace, "Cascadia Mono", "JetBrains Mono", Consolas, monospace';

const MAX_CANVAS_HEIGHT = 4400;

/**
 * Convierte contenido HTML enriquecido o corrupto en texto plano legible para Canvas.
 */
export function stripHtmlForCanvas(raw: unknown): string {
  if (raw === null || raw === undefined) return '';
  let text = sanitizeCorruptedTokens(String(raw));
  text = text
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|h1|h2|h3|h4|blockquote)>/gi, '\n')
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<\/li>/gi, '\n')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/<[^>]+>/g, '');

  return text
    .split('\n')
    .map((line) => line.trimEnd())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function unwrapRaw<T>(val: T): T {
  if (typeof window !== 'undefined' && (window as any).Alpine?.raw) {
    try {
      return (window as any).Alpine.raw(val);
    } catch {
      return val;
    }
  }
  return val;
}

function cleanFieldText(val: unknown, maxLen = 0): string {
  const cleaned = stripHtmlForCanvas(val);
  if (!cleaned) return '';
  if (maxLen > 0 && cleaned.length > maxLen) {
    return `${cleaned.slice(0, maxLen - 1).trimEnd()}…`;
  }
  return cleaned;
}

function pushField(list: ExportFieldEntry[], label: string, rawVal: unknown, maxLen = 0): void {
  const value = cleanFieldText(rawVal, maxLen);
  if (value) list.push({ label, value });
}

/**
 * Construye el modelo editorial estructurado para dibujar una ficha legible.
 */
export function buildCharacterExportSheetModel(
  rawChar: any,
  options: { preset?: ExportImagePreset; hideTierBadge?: boolean } = {},
): CharacterExportSheetModel {
  const char = unwrapRaw(rawChar) || {};
  const preset: ExportImagePreset = options.preset === 'compact' ? 'compact' : 'complete';
  const b = char.basics || {};
  const bo = char.body || {};
  const m = char.mind || {};
  const s = char.social || {};
  const be = char.beliefs || {};
  const p = char.priorities || {};
  const ps = char.powerScaling || {};
  const ex = char.extras || {};
  const skills = Array.isArray(char.skills) ? char.skills : [];
  const weapons = Array.isArray(char.weapons) ? char.weapons : [];
  const customTabs = Array.isArray(char.customTabs) ? char.customTabs : [];

  const name = cleanFieldText(b.fullName || char.name) || 'Personaje sin título';
  const rawAlias = cleanFieldText(b.nickname || b.alias);
  const alias = rawAlias && rawAlias.toLowerCase() !== name.toLowerCase() ? rawAlias : '';

  const quotesList = Array.isArray(b.quotes) ? b.quotes : [];
  const quote = quotesList.map((q: unknown) => cleanFieldText(q)).find(Boolean) || '';

  const avatarUrl = b.useIconForPfp
    ? (b.iconDataUrl || b.avatarDataUrl || '')
    : (b.avatarDataUrl || b.iconDataUrl || '');
  const bannerUrl = b.bannerDataUrl || char.visualSettings?.backgroundUrl || '';
  const avatarAspect = b.avatarAspect === 'portrait' ? 'portrait' : 'square';
  const avatarShape = b.avatarShape === 'circle'
    ? 'circle'
    : b.avatarShape === 'square'
      ? 'square'
      : 'rounded';

  const badges: string[] = [];
  const roleVal = cleanFieldText(b.role || ex.charClass || ex.class || ex.fgcStyle);
  const raceVal = cleanFieldText(b.race);
  const ageVal = cleanFieldText(b.realAge || b.apparentAge);
  const genderVal = cleanFieldText(b.genderPronouns);
  const alignVal = cleanFieldText(b.alignment);
  const tierVal = !options.hideTierBadge ? cleanFieldText(ps.tier || ps.overallTier) : '';

  if (raceVal) badges.push(raceVal);
  if (roleVal) badges.push(roleVal);
  if (ageVal) badges.push(`Edad: ${ageVal}`);
  if (genderVal) badges.push(genderVal);
  if (alignVal && alignVal !== 'Neutral Absoluto') badges.push(alignVal);
  if (tierVal) badges.push(`Tier ${tierVal}`);

  const stats: ExportFieldEntry[] = [];
  if (!options.hideTierBadge) {
    pushField(stats, 'Tier', ps.tier || ps.overallTier);
  }
  pushField(stats, 'Potencia (AP)', ps.strikingStrength || ps.dc);
  pushField(stats, 'Velocidad', ps.speed || ps.speedCombat);
  pushField(stats, 'Durabilidad', ps.durability);
  pushField(stats, 'Rango', ps.range);
  pushField(stats, 'Estamina', ps.stamina);
  if (preset === 'complete') {
    pushField(stats, 'IQ / BIQ', [ps.iq || ps.intelligence, ps.biq].filter(Boolean).join(' · '));
    pushField(stats, 'Facción', s.faction);
  }

  const sections: ExportSectionCard[] = [];

  if (preset === 'compact') {
    const summaryFields: ExportFieldEntry[] = [];
    const bioSummary = [
      bo.height ? `Est. ${bo.height}` : '',
      bo.weight ? `Peso ${bo.weight}` : '',
      bo.build || '',
      bo.eyeColor ? `Ojos ${bo.eyeColor}` : '',
      bo.hairColor ? `Cabello ${bo.hairColor}` : '',
    ].filter(Boolean).join(' · ');
    pushField(summaryFields, 'Aspecto', bioSummary);
    pushField(summaryFields, 'Personalidad', m.personalitySummary, 240);
    pushField(summaryFields, 'Virtudes', m.virtues, 120);
    pushField(summaryFields, 'Defectos', m.flaws, 120);
    pushField(summaryFields, 'Objetivo / Código', [p.mainGoal, be.moralCode].filter(Boolean).join(' · '), 160);
    const loreExcerpt = cleanFieldText(be.originEvent || bo.physicalDescription, 280);
    if (summaryFields.length > 0 || loreExcerpt) {
      sections.push({
        id: 'compact-profile',
        title: 'Perfil & Esencia',
        fields: summaryFields,
        paragraphs: loreExcerpt ? [loreExcerpt] : undefined,
      });
    }

    const capItems: ExportItemEntry[] = [];
    skills.slice(0, 4).forEach((sk: any, idx: number) => {
      const title = cleanFieldText(sk?.title || sk?.name) || `Habilidad ${idx + 1}`;
      const sub = [sk?.type === 'active' ? 'Activa' : sk?.type === 'passive' ? 'Pasiva' : '', sk?.tier || '']
        .filter(Boolean)
        .join(' · ');
      const desc = cleanFieldText(sk?.summary || sk?.shortSummary || sk?.effect, 140);
      capItems.push({ title, subtitle: sub, description: desc });
    });
    weapons.slice(0, 2).forEach((wp: any) => {
      const title = cleanFieldText(wp?.name || wp?.weaponType);
      if (title) {
        capItems.push({
          title,
          subtitle: [wp?.weaponType, wp?.rarity].filter(Boolean).join(' · ') || 'Armamento',
          description: cleanFieldText(wp?.notes || wp?.description || wp?.damageType, 110),
        });
      }
    });
    if (capItems.length > 0 || ex.sentimentalItems || ps.standardEquipment) {
      const eqFields: ExportFieldEntry[] = [];
      pushField(eqFields, 'Equipo Clave', ex.sentimentalItems || ps.standardEquipment, 150);
      sections.push({
        id: 'compact-abilities',
        title: 'Habilidades & Equipo Clave',
        items: capItems,
        fields: eqFields,
      });
    }
  } else {
    // 1. Rasgos Físicos e Identidad
    const physFields: ExportFieldEntry[] = [];
    pushField(physFields, 'Estatura / Peso', [bo.height, bo.weight, bo.build].filter(Boolean).join(' · '));
    pushField(physFields, 'Ojos / Cabello', [bo.eyeColor ? `Ojos: ${bo.eyeColor}` : '', bo.hairColor ? `Cabello: ${bo.hairColor}` : ''].filter(Boolean).join(' · '));
    pushField(physFields, 'Piel / Voz', [bo.skinColor, bo.voice].filter(Boolean).join(' · '));
    pushField(physFields, 'Indumentaria', bo.clothingStyle);
    pushField(physFields, 'Rasgos / Marcas', bo.bodyModifications || bo.distinctiveMarks || bo.notableAccessories);
    pushField(physFields, 'Expresión / Aura', [bo.facialExpression, bo.presenceAura].filter(Boolean).join(' · '));
    if (physFields.length > 0) {
      sections.push({ id: 'physical', title: 'Identidad & Rasgos Físicos', fields: physFields });
    }

    // 2. Personalidad & Motivaciones
    const mindFields: ExportFieldEntry[] = [];
    pushField(mindFields, 'Resumen', m.personalitySummary);
    pushField(mindFields, 'Virtudes / Ideales', m.virtues);
    pushField(mindFields, 'Defectos / Flaws', m.flaws);
    pushField(mindFields, 'Código Moral / Visión', [be.moralCode, be.worldview].filter(Boolean).join(' · '));
    pushField(mindFields, 'Objetivo Principal', p.mainGoal);
    pushField(mindFields, 'Mayor Miedo / Conflicto', [p.greatestFear, p.currentConflict].filter(Boolean).join(' · '));
    if (mindFields.length > 0) {
      sections.push({ id: 'mind', title: 'Personalidad, Principios & Metas', fields: mindFields });
    }

    // 3. Historia, Lore & Trasfondo (ancho completo)
    const loreParagraphs: string[] = [];
    const originTxt = cleanFieldText(be.originEvent);
    const physDescTxt = cleanFieldText(bo.physicalDescription);
    if (originTxt) loreParagraphs.push(originTxt);
    if (physDescTxt && physDescTxt !== originTxt) loreParagraphs.push(physDescTxt);
    if (loreParagraphs.length > 0) {
      sections.push({
        id: 'lore',
        title: 'Historia, Lore & Trasfondo',
        fullWidth: true,
        paragraphs: loreParagraphs,
      });
    }

    // 4. Habilidades & Poderes
    if (skills.length > 0) {
      const skillItems: ExportItemEntry[] = skills.slice(0, 12).map((sk: any, idx: number) => ({
        title: cleanFieldText(sk?.title || sk?.name) || `Habilidad ${idx + 1}`,
        subtitle: [
          sk?.type === 'active' ? 'Activa' : sk?.type === 'passive' ? 'Pasiva' : '',
          sk?.tier || '',
          sk?.cooldown || '',
        ].filter(Boolean).join(' · '),
        description: cleanFieldText(sk?.summary || sk?.shortSummary || sk?.effect, 320),
      }));
      if (skills.length > 12) {
        skillItems.push({
          title: `+ ${skills.length - 12} habilidades adicionales en la ficha`,
        });
      }
      sections.push({
        id: 'skills',
        title: `Habilidades & Poderes (${skills.length})`,
        fullWidth: true,
        items: skillItems,
      });
    }

    // 5. Arsenal & Equipo
    const weaponItems: ExportItemEntry[] = weapons.slice(0, 8).map((wp: any) => ({
      title: cleanFieldText(wp?.name || wp?.weaponType) || 'Arma sin nombre',
      subtitle: [wp?.weaponType, wp?.rarity, wp?.damageType].filter(Boolean).join(' · '),
      description: cleanFieldText(wp?.description || wp?.notes || wp?.ability, 220),
    }));
    const gearFields: ExportFieldEntry[] = [];
    pushField(gearFields, 'Equipo y Objetos Clave', ex.sentimentalItems || ps.standardEquipment);
    pushField(gearFields, 'Debilidades Conocidas', ps.weaknesses);
    if (weaponItems.length > 0 || gearFields.length > 0) {
      sections.push({
        id: 'weapons',
        title: 'Armamento, Equipo & Debilidades',
        fullWidth: true,
        items: weaponItems.length > 0 ? weaponItems : undefined,
        fields: gearFields.length > 0 ? gearFields : undefined,
      });
    }

    // 6. Vínculos, Curiosidades & Bloques Personalizados
    const extraFields: ExportFieldEntry[] = [];
    if (Array.isArray(s.relations) && s.relations.length > 0) {
      const relSummary = s.relations
        .slice(0, 6)
        .map((r: any) => `${r?.name || 'Vínculo'}${r?.bondType ? ` (${r.bondType})` : ''}`)
        .join(', ');
      pushField(extraFields, 'Relaciones', relSummary);
    }
    pushField(extraFields, 'Curiosidades y Notas', ex.curiosities);
    pushField(extraFields, 'Voz / Inspiraciones', [ex.voiceActor, ex.conceptInspirations].filter(Boolean).join(' · '));
    customTabs.slice(0, 4).forEach((tab: any) => {
      const blockTexts = Array.isArray(tab?.blocks)
        ? tab.blocks
            .map((blk: any) => {
              const direct = cleanFieldText(blk?.content || blk?.text || blk?.value, 240);
              if (direct) return direct;
              if (Array.isArray(blk?.fields)) {
                return blk.fields
                  .map((f: any) => {
                    const fVal = cleanFieldText(f?.value, 160);
                    if (!fVal) return '';
                    const fLbl = cleanFieldText(f?.label);
                    return fLbl ? `${fLbl}: ${fVal}` : fVal;
                  })
                  .filter(Boolean)
                  .join(' · ');
              }
              return '';
            })
            .filter(Boolean)
            .join('\n')
        : '';
      if (tab?.label && blockTexts) {
        pushField(extraFields, tab.label, blockTexts);
      }
    });
    if (extraFields.length > 0) {
      sections.push({
        id: 'extras',
        title: 'Vínculos, Notas & Extras',
        fullWidth: true,
        fields: extraFields,
      });
    }
  }

  let updatedText = 'Reciente';
  if (char.updatedAt) {
    try {
      updatedText = new Date(char.updatedAt).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      updatedText = 'Reciente';
    }
  }

  return {
    name,
    alias,
    quote,
    bannerUrl,
    avatarUrl,
    avatarAspect,
    avatarShape,
    badges,
    stats,
    sections,
    footerMeta: `Actualizado: ${updatedText}`,
  };
}

/**
 * Envuelve texto en múltiples líneas ajustadas a maxWidth preservando saltos de línea.
 */
export function wrapTextLines(
  measureWidth: (text: string) => number,
  text: string,
  maxWidth: number,
  maxLines = 0,
): string[] {
  if (!text || maxWidth <= 20) return [];
  const paragraphs = String(text).split('\n');
  const result: string[] = [];

  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (!trimmed) {
      if (result.length > 0 && result[result.length - 1] !== '') {
        result.push('');
      }
      continue;
    }

    const words = trimmed.split(/\s+/);
    let current = '';

    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;
      if (measureWidth(candidate) <= maxWidth) {
        current = candidate;
      } else {
        if (current) {
          result.push(current);
          current = '';
        }
        if (measureWidth(word) <= maxWidth) {
          current = word;
        } else {
          // Romper palabra/URL larga carácter por carácter sin desbordar la caja
          let chunk = '';
          for (const ch of word) {
            if (measureWidth(chunk + ch) <= maxWidth) {
              chunk += ch;
            } else {
              if (chunk) result.push(chunk);
              chunk = ch;
            }
          }
          current = chunk;
        }
      }
    }
    if (current) {
      result.push(current);
    }
  }

  while (result.length > 0 && result[result.length - 1] === '') {
    result.pop();
  }

  if (maxLines > 0 && result.length > maxLines) {
    const sliced = result.slice(0, maxLines);
    const last = sliced[maxLines - 1] || '';
    sliced[maxLines - 1] = last.length > 1 ? `${last.slice(0, -1).trimEnd()}…` : '…';
    return sliced;
  }

  return result;
}

/**
 * Carga una imagen de forma segura evitando errores CORS que bloqueen `canvas.toBlob()`.
 */
export async function loadCanvasImage(src: string, timeoutMs = 3500): Promise<{
  image: HTMLImageElement;
  cleanup: () => void;
} | null> {
  if (!src || typeof src !== 'string') return null;

  const isLocal = src.startsWith('data:') || src.startsWith('blob:');
  let resolvedUrl = src;
  let revokeObjectUrl: string | null = null;

  if (!isLocal && typeof fetch === 'function') {
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;
    try {
      const res = await fetch(src, { mode: 'cors', signal: controller?.signal });
      if (!res.ok) return null;
      const blob = await res.blob();
      revokeObjectUrl = URL.createObjectURL(blob);
      resolvedUrl = revokeObjectUrl;
    } catch {
      return null;
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  return new Promise((resolve) => {
    const img = new Image();
    if (!isLocal && !revokeObjectUrl) {
      img.crossOrigin = 'anonymous';
    }
    const timer = setTimeout(() => {
      if (revokeObjectUrl) URL.revokeObjectURL(revokeObjectUrl);
      resolve(null);
    }, timeoutMs);

    img.onload = () => {
      clearTimeout(timer);
      resolve({
        image: img,
        cleanup: () => {
          if (revokeObjectUrl) URL.revokeObjectURL(revokeObjectUrl);
        },
      });
    };
    img.onerror = () => {
      clearTimeout(timer);
      if (revokeObjectUrl) URL.revokeObjectURL(revokeObjectUrl);
      resolve(null);
    };
    img.src = resolvedUrl;
  });
}

function drawRoundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  const radius = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function drawImageCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  dx: number,
  dy: number,
  dw: number,
  dh: number,
): void {
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  if (!iw || !ih) return;
  const scale = Math.max(dw / iw, dh / ih);
  const sw = dw / scale;
  const sh = dh / scale;
  const sx = (iw - sw) / 2;
  const sy = (ih - sh) / 2;
  ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
}

interface MeasuredSection {
  section: ExportSectionCard;
  x: number;
  y: number;
  w: number;
  h: number;
  blocks: Array<
    | { kind: 'field'; label: string; lines: string[] }
    | { kind: 'paragraph'; lines: string[] }
    | { kind: 'item'; title: string; subtitle: string; descLines: string[] }
  >;
}

function measureSectionContent(
  ctx: CanvasRenderingContext2D,
  section: ExportSectionCard,
  width: number,
): { height: number; blocks: MeasuredSection['blocks'] } {
  const contentW = width - CARD_PAD_X * 2;
  const blocks: MeasuredSection['blocks'] = [];
  let y = CARD_PAD_Y + 34 + 14; // Header title + spacing

  if (Array.isArray(section.fields)) {
    for (const f of section.fields) {
      ctx.font = `700 13px ${FONT_MONO}`;
      ctx.font = `400 16px ${FONT_SANS}`;
      const valLines = wrapTextLines((t) => ctx.measureText(t).width, f.value, contentW);
      blocks.push({ kind: 'field', label: f.label, lines: valLines });
      y += 18 + Math.max(1, valLines.length) * 23 + 12;
    }
  }

  if (Array.isArray(section.paragraphs)) {
    ctx.font = `400 16.5px ${FONT_SANS}`;
    for (const para of section.paragraphs) {
      const pLines = wrapTextLines((t) => ctx.measureText(t).width, para, contentW);
      blocks.push({ kind: 'paragraph', lines: pLines });
      y += pLines.reduce((acc, l) => acc + (l === '' ? 12 : 24), 0) + 10;
    }
  }

  if (Array.isArray(section.items)) {
    for (const item of section.items) {
      ctx.font = `400 15.5px ${FONT_SANS}`;
      const descLines = item.description
        ? wrapTextLines((t) => ctx.measureText(t).width, item.description, contentW - 22)
        : [];
      blocks.push({
        kind: 'item',
        title: item.title,
        subtitle: item.subtitle || '',
        descLines,
      });
      y += 24 + (item.subtitle ? 18 : 0) + descLines.length * 22 + 16;
    }
  }

  y += CARD_PAD_Y - 6;
  return { height: Math.max(96, y), blocks };
}

/**
 * Renderiza la ficha completa o resumida sobre un `<canvas>` de alta legibilidad.
 */
export async function renderCharacterSheetToCanvas(
  char: any,
  options: ExportImageOptions = {},
): Promise<{ canvas: HTMLCanvasElement; width: number; height: number }> {
  const theme: ExportImageTheme = options.theme === 'light' ? 'light' : 'dark';
  const preset: ExportImagePreset = options.preset === 'compact' ? 'compact' : 'complete';
  const palette = PALETTES[theme];
  const model = buildCharacterExportSheetModel(char, {
    preset,
    hideTierBadge: options.hideTierBadge,
  });

  const [bannerAsset, avatarAsset] = await Promise.all([
    model.bannerUrl ? loadCanvasImage(model.bannerUrl) : Promise.resolve(null),
    model.avatarUrl ? loadCanvasImage(model.avatarUrl) : Promise.resolve(null),
  ]);

  try {
    const measureCanvas = document.createElement('canvas');
    measureCanvas.width = LOGICAL_WIDTH;
    measureCanvas.height = 100;
    const mCtx = measureCanvas.getContext('2d');
    if (!mCtx) {
      throw new Error('No se pudo inicializar el contexto 2D para exportar la imagen.');
    }

    // ── Pass 1: Medir layout vertical completo ───────────────────────
    const heroBannerH = bannerAsset ? (preset === 'compact' ? 175 : 210) : 10;
    const avatarW = model.avatarAspect === 'portrait' ? 136 : 144;
    const avatarH = model.avatarAspect === 'portrait' ? 172 : 144;
    const heroInfoX = OUTER_PAD + CARD_PAD_X + avatarW + 28;
    const heroInfoW = LOGICAL_WIDTH - OUTER_PAD - CARD_PAD_X - heroInfoX;

    mCtx.font = `700 36px ${FONT_DISPLAY}`;
    const nameLines = wrapTextLines((t) => mCtx.measureText(t).width, model.name, heroInfoW, 2);
    let heroTextH = nameLines.length * 42;
    if (model.alias) heroTextH += 26;

    // Medir pills envueltas
    mCtx.font = `600 13.5px ${FONT_SANS}`;
    let chipRowX = 0;
    let chipRows = model.badges.length > 0 ? 1 : 0;
    for (const badge of model.badges) {
      const chipW = mCtx.measureText(badge).width + 22;
      if (chipRowX > 0 && chipRowX + chipW > heroInfoW) {
        chipRows += 1;
        chipRowX = chipW + 8;
      } else {
        chipRowX += chipW + 8;
      }
    }
    heroTextH += chipRows * 34;

    if (model.quote) {
      mCtx.font = `italic 16px ${FONT_DISPLAY}`;
      const qLines = wrapTextLines((t) => mCtx.measureText(t).width, `“${model.quote}”`, heroInfoW - 18, 3);
      heroTextH += 12 + qLines.length * 22 + 8;
    }

    const avatarOverlapTop = bannerAsset ? 54 : 0;
    const heroBodyH = Math.max(
      avatarH - avatarOverlapTop + CARD_PAD_Y + 12,
      heroTextH + CARD_PAD_Y * 2,
    );
    const heroCardH = heroBannerH + heroBodyH;

    let cursorY = OUTER_PAD + heroCardH + SECTION_GAP;

    // Banda de stats
    let statsCardH = 0;
    const statsPerRow = 4;
    if (model.stats.length > 0) {
      const statRows = Math.ceil(model.stats.length / statsPerRow);
      statsCardH = statRows * 70 + 28;
      cursorY += statsCardH + SECTION_GAP;
    }

    // Secciones (emparejando tarjetas cortas consecutivas en 2 columnas si no son fullWidth)
    const measuredSections: MeasuredSection[] = [];
    let i = 0;
    while (i < model.sections.length) {
      const current = model.sections[i];
      const next = model.sections[i + 1];
      const canPair = !current.fullWidth && next && !next.fullWidth;

      if (canPair) {
        const colW = (INNER_WIDTH - SECTION_GAP) / 2;
        const leftM = measureSectionContent(mCtx, current, colW);
        const rightM = measureSectionContent(mCtx, next, colW);
        const rowH = Math.max(leftM.height, rightM.height);

        measuredSections.push({
          section: current,
          x: OUTER_PAD,
          y: cursorY,
          w: colW,
          h: rowH,
          blocks: leftM.blocks,
        });
        measuredSections.push({
          section: next,
          x: OUTER_PAD + colW + SECTION_GAP,
          y: cursorY,
          w: colW,
          h: rowH,
          blocks: rightM.blocks,
        });
        cursorY += rowH + SECTION_GAP;
        i += 2;
      } else {
        const fullM = measureSectionContent(mCtx, current, INNER_WIDTH);
        measuredSections.push({
          section: current,
          x: OUTER_PAD,
          y: cursorY,
          w: INNER_WIDTH,
          h: fullM.height,
          blocks: fullM.blocks,
        });
        cursorY += fullM.height + SECTION_GAP;
        i += 1;
      }
    }

    const footerH = 44;
    const logicalHeight = Math.min(MAX_CANVAS_HEIGHT, cursorY + footerH + 18);
    const dpr = logicalHeight <= 2400 ? 1.5 : 1;

    // ── Pass 2: Dibujar Canvas final ─────────────────────────────────
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(LOGICAL_WIDTH * dpr);
    canvas.height = Math.round(logicalHeight * dpr);

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('No se pudo generar el lienzo gráfico.');
    }
    ctx.scale(dpr, dpr);

    // Fondo exterior
    ctx.fillStyle = palette.bgOuter;
    ctx.fillRect(0, 0, LOGICAL_WIDTH, logicalHeight);

    // ── 1. Tarjeta Cabecera Hero ─────────────────────────────────────
    const heroY = OUTER_PAD;
    drawRoundedRectPath(ctx, OUTER_PAD, heroY, INNER_WIDTH, heroCardH, 8);
    ctx.fillStyle = palette.bgCard;
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = palette.borderStrong;
    ctx.stroke();

    if (bannerAsset) {
      ctx.save();
      drawRoundedRectPath(ctx, OUTER_PAD + 1, heroY + 1, INNER_WIDTH - 2, heroBannerH, 7);
      ctx.clip();
      drawImageCover(ctx, bannerAsset.image, OUTER_PAD, heroY, INNER_WIDTH, heroBannerH);
      const grad = ctx.createLinearGradient(0, heroY, 0, heroY + heroBannerH);
      grad.addColorStop(0, 'rgba(10, 12, 16, 0.14)');
      grad.addColorStop(1, 'rgba(10, 12, 16, 0.68)');
      ctx.fillStyle = grad;
      ctx.fillRect(OUTER_PAD, heroY, INNER_WIDTH, heroBannerH);
      ctx.restore();
    } else {
      ctx.fillStyle = palette.accent;
      ctx.fillRect(OUTER_PAD, heroY, INNER_WIDTH, 6);
    }

    // Avatar
    const avatarX = OUTER_PAD + CARD_PAD_X;
    const avatarY = heroY + heroBannerH - (bannerAsset ? 54 : -CARD_PAD_Y);
    const avatarRadius = model.avatarShape === 'circle'
      ? avatarW / 2
      : model.avatarShape === 'square'
        ? 0
        : 10;

    ctx.save();
    drawRoundedRectPath(ctx, avatarX, avatarY, avatarW, avatarH, avatarRadius);
    ctx.fillStyle = palette.bgMuted;
    ctx.fill();
    ctx.clip();
    if (avatarAsset) {
      drawImageCover(ctx, avatarAsset.image, avatarX, avatarY, avatarW, avatarH);
    } else {
      ctx.fillStyle = palette.accent;
      ctx.font = `700 48px ${FONT_DISPLAY}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText((model.name || '?').slice(0, 1).toUpperCase(), avatarX + avatarW / 2, avatarY + avatarH / 2);
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
    }
    ctx.restore();

    drawRoundedRectPath(ctx, avatarX, avatarY, avatarW, avatarH, avatarRadius);
    ctx.lineWidth = 3;
    ctx.strokeStyle = palette.accent;
    ctx.stroke();

    // Textos de Identidad
    let textY = heroY + heroBannerH + CARD_PAD_Y + 26;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = palette.textMain;
    ctx.font = `700 36px ${FONT_DISPLAY}`;
    for (const line of nameLines) {
      ctx.fillText(line, heroInfoX, textY);
      textY += 40;
    }

    if (model.alias) {
      ctx.fillStyle = palette.accent;
      ctx.font = `italic 18px ${FONT_DISPLAY}`;
      ctx.fillText(`«${model.alias}»`, heroInfoX, textY);
      textY += 26;
    }

    // Pills de metadatos
    if (model.badges.length > 0) {
      let cx = heroInfoX;
      let cy = textY;
      ctx.font = `600 13.5px ${FONT_SANS}`;
      for (const badge of model.badges) {
        const tw = ctx.measureText(badge).width;
        const bw = tw + 20;
        if (cx > heroInfoX && cx + bw > OUTER_PAD + INNER_WIDTH - CARD_PAD_X) {
          cx = heroInfoX;
          cy += 34;
        }
        drawRoundedRectPath(ctx, cx, cy - 18, bw, 25, 4);
        ctx.fillStyle = palette.bgMuted;
        ctx.fill();
        ctx.lineWidth = 1;
        ctx.strokeStyle = palette.borderStrong;
        ctx.stroke();

        ctx.fillStyle = palette.textMain;
        ctx.fillText(badge, cx + 10, cy - 1);
        cx += bw + 8;
      }
      textY = cy + 20;
    }

    // Cita destacada
    if (model.quote) {
      ctx.font = `italic 16px ${FONT_DISPLAY}`;
      const qLines = wrapTextLines((t) => ctx.measureText(t).width, `“${model.quote}”`, heroInfoW - 18, 3);
      const qBlockH = qLines.length * 22 + 8;
      ctx.fillStyle = palette.accent;
      ctx.fillRect(heroInfoX, textY - 6, 3, qBlockH);
      ctx.fillStyle = palette.textMuted;
      let qy = textY + 12;
      for (const ql of qLines) {
        ctx.fillText(ql, heroInfoX + 14, qy);
        qy += 22;
      }
    }

    // ── 2. Banda de Atributos / Escala ──────────────────────────────
    if (model.stats.length > 0) {
      const statsY = OUTER_PAD + heroCardH + SECTION_GAP;
      drawRoundedRectPath(ctx, OUTER_PAD, statsY, INNER_WIDTH, statsCardH, 6);
      ctx.fillStyle = palette.bgCard;
      ctx.fill();
      ctx.lineWidth = 1;
      ctx.strokeStyle = palette.borderStrong;
      ctx.stroke();

      const colW = (INNER_WIDTH - CARD_PAD_X * 2 - 12 * (statsPerRow - 1)) / statsPerRow;
      model.stats.forEach((st, idx) => {
        const row = Math.floor(idx / statsPerRow);
        const col = idx % statsPerRow;
        const sx = OUTER_PAD + CARD_PAD_X + col * (colW + 12);
        const sy = statsY + 14 + row * 70;

        drawRoundedRectPath(ctx, sx, sy, colW, 58, 4);
        ctx.fillStyle = palette.bgMuted;
        ctx.fill();
        ctx.lineWidth = 1;
        ctx.strokeStyle = palette.border;
        ctx.stroke();

        ctx.fillStyle = palette.textMuted;
        ctx.font = `700 11.5px ${FONT_MONO}`;
        ctx.fillText(st.label.toUpperCase(), sx + 12, sy + 20);

        ctx.fillStyle = palette.accent;
        ctx.font = `700 16px ${FONT_SANS}`;
        const valLines = wrapTextLines((t) => ctx.measureText(t).width, st.value, colW - 24, 1);
        ctx.fillText(valLines[0] || '—', sx + 12, sy + 44);
      });
    }

    // ── 3. Secciones Editoriales ─────────────────────────────────────
    for (const ms of measuredSections) {
      if (ms.y + ms.h > logicalHeight - footerH - 8) continue;

      drawRoundedRectPath(ctx, ms.x, ms.y, ms.w, ms.h, 6);
      ctx.fillStyle = palette.bgCard;
      ctx.fill();
      ctx.lineWidth = 1;
      ctx.strokeStyle = palette.borderStrong;
      ctx.stroke();

      // Barra superior sutil de sección
      ctx.fillStyle = palette.bgMuted;
      ctx.fillRect(ms.x + 1, ms.y + 1, ms.w - 2, 42);
      ctx.fillStyle = palette.accent;
      ctx.fillRect(ms.x + 1, ms.y + 1, 4, 42);
      ctx.strokeStyle = palette.border;
      ctx.beginPath();
      ctx.moveTo(ms.x + 1, ms.y + 43);
      ctx.lineTo(ms.x + ms.w - 1, ms.y + 43);
      ctx.stroke();

      ctx.fillStyle = palette.textMain;
      ctx.font = `700 17px ${FONT_DISPLAY}`;
      ctx.fillText(ms.section.title, ms.x + CARD_PAD_X, ms.y + 28);

      let sy = ms.y + CARD_PAD_Y + 42;
      const sx = ms.x + CARD_PAD_X;

      for (const blk of ms.blocks) {
        if (blk.kind === 'field') {
          ctx.fillStyle = palette.accent;
          ctx.font = `700 12.5px ${FONT_MONO}`;
          ctx.fillText(blk.label.toUpperCase(), sx, sy);
          sy += 20;

          ctx.fillStyle = palette.textMain;
          ctx.font = `400 16px ${FONT_SANS}`;
          for (const line of blk.lines) {
            if (line) ctx.fillText(line, sx, sy);
            sy += 23;
          }
          sy += 10;
        } else if (blk.kind === 'paragraph') {
          ctx.fillStyle = palette.textMain;
          ctx.font = `400 16.5px ${FONT_SANS}`;
          for (const line of blk.lines) {
            if (line === '') {
              sy += 12;
            } else {
              ctx.fillText(line, sx, sy);
              sy += 24;
            }
          }
          sy += 10;
        } else if (blk.kind === 'item') {
          ctx.fillStyle = palette.accent;
          ctx.fillRect(sx, sy - 11, 3, 18);

          ctx.fillStyle = palette.textMain;
          ctx.font = `700 16.5px ${FONT_SANS}`;
          ctx.fillText(blk.title, sx + 12, sy + 2);
          sy += 22;

          if (blk.subtitle) {
            ctx.fillStyle = palette.textMuted;
            ctx.font = `600 12.5px ${FONT_MONO}`;
            ctx.fillText(blk.subtitle, sx + 12, sy);
            sy += 18;
          }

          if (blk.descLines.length > 0) {
            ctx.fillStyle = palette.textMuted;
            ctx.font = `400 15.5px ${FONT_SANS}`;
            for (const dl of blk.descLines) {
              if (dl) ctx.fillText(dl, sx + 12, sy);
              sy += 22;
            }
          }
          sy += 14;
        }
      }
    }

    // ── 4. Pie editorial ─────────────────────────────────────────────
    const footY = logicalHeight - 24;
    ctx.strokeStyle = palette.border;
    ctx.beginPath();
    ctx.moveTo(OUTER_PAD, footY - 22);
    ctx.lineTo(OUTER_PAD + INNER_WIDTH, footY - 22);
    ctx.stroke();

    ctx.fillStyle = palette.textDim;
    ctx.font = `600 12.5px ${FONT_MONO}`;
    ctx.fillText(`WHERE'S MY FICHA · ${model.name.toUpperCase()}`, OUTER_PAD, footY);

    ctx.textAlign = 'right';
    ctx.fillText(model.footerMeta, OUTER_PAD + INNER_WIDTH, footY);
    ctx.textAlign = 'left';

    return {
      canvas,
      width: canvas.width,
      height: canvas.height,
    };
  } finally {
    bannerAsset?.cleanup();
    avatarAsset?.cleanup();
  }
}

/**
 * Construye un nombre de archivo seguro a partir del personaje, sufijo y extensión.
 */
export function buildExportFilename(char: any, suffix: string, ext: string): string {
  const safeName = String(char?.name || char?.basics?.fullName || 'personaje')
    .replace(/[^a-z0-9_\-\s]/gi, '_')
    .trim()
    .replace(/\s+/g, '_') || 'personaje';
  return `${safeName}_${suffix}.${ext}`;
}

/**
 * Dispara la descarga local de un Blob limpiando el ObjectURL diferidamente.
 */
export function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  try {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}

/**
 * Genera el Blob PNG final listo para descarga, vista previa o portapapeles.
 */
export async function exportCharacterImageBlob(
  char: any,
  options: ExportImageOptions = {},
): Promise<{ blob: Blob; filename: string; width: number; height: number }> {
  const { canvas, width, height } = await renderCharacterSheetToCanvas(char, options);
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((out) => {
      if (out) resolve(out);
      else reject(new Error('El navegador no pudo codificar la ficha en PNG.'));
    }, 'image/png');
  });

  const suffix = options.preset === 'compact' ? 'tarjeta' : 'ficha';
  return {
    blob,
    filename: buildExportFilename(char, suffix, 'png'),
    width,
    height,
  };
}

/**
 * Descarga directamente la ficha en formato PNG.
 */
export async function downloadCharacterImage(
  char: any,
  options: ExportImageOptions = {},
): Promise<{ filename: string; width: number; height: number }> {
  const { blob, filename, width, height } = await exportCharacterImageBlob(char, options);
  triggerBlobDownload(blob, filename);
  return { filename, width, height };
}

/**
 * Copia la imagen PNG generada directamente al portapapeles del sistema.
 */
export async function copyCharacterImageToClipboard(
  char: any,
  options: ExportImageOptions = {},
): Promise<boolean> {
  if (typeof ClipboardItem === 'undefined' || !navigator.clipboard?.write) {
    throw new Error('Tu navegador no permite copiar imágenes directamente al portapapeles.');
  }
  const { blob } = await exportCharacterImageBlob(char, options);
  await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
  return true;
}

