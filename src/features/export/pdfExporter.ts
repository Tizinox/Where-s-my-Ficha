/**
 * @file src/features/export/pdfExporter.ts
 * Exportador editorial multipágina en PDF (A4) especialmente optimizado para Ficha B (Clásica):
 * - Maqueta automáticamente todas las secciones de la ficha sin solapar ni cortar tarjetas.
 * - Embebe retratos, báner, imágenes de habilidades, armas, pestañas personalizadas y galería.
 * - Genera un archivo PDF 1.4 estándar binario directamente en el navegador sin dependencias externas.
 */

import {
  buildExportFilename,
  loadCanvasImage,
  stripHtmlForCanvas,
  triggerBlobDownload,
  wrapTextLines,
} from '@features/export/imageExporter.ts';

export type PdfExportTheme = 'light' | 'dark';

export interface ExportPdfOptions {
  theme?: PdfExportTheme;
  includeImages?: boolean;
}

export interface PdfFieldItem {
  label: string;
  value: string;
  swatchHex?: string;
}

export interface PdfMediaCardItem {
  title: string;
  badges: string[];
  details: PdfFieldItem[];
  body: string;
  imageUrl?: string;
  imageFit?: 'cover' | 'contain';
}

export interface PdfGalleryEntry {
  url: string;
  caption: string;
  fit?: 'cover' | 'contain';
}

export interface PdfAxisEntry {
  leftLabel: string;
  rightLabel: string;
  value: number;
  category?: string;
}

export interface PdfCustomStatEntry {
  label: string;
  value: number;
  max: number;
}

export interface PdfCustomSectionData {
  id: string;
  title: string;
  description?: string;
  fields: PdfFieldItem[];
  stats: PdfCustomStatEntry[];
  images: PdfGalleryEntry[];
}

export interface ClassicPdfDocumentModel {
  name: string;
  alias: string;
  sheetLabel: string;
  quote: string;
  badges: string[];
  bannerUrl: string;
  avatarUrl: string;
  avatarAspect: 'square' | 'portrait';
  basicsFields: PdfFieldItem[];
  bodyFields: PdfFieldItem[];
  bodyDescription: string;
  mindFields: PdfFieldItem[];
  mindAxes: PdfAxisEntry[];
  socialFields: PdfFieldItem[];
  relations: Array<{ name: string; bondType: string; status: string; description: string }>;
  beliefsFields: PdfFieldItem[];
  prioritiesFields: PdfFieldItem[];
  skills: PdfMediaCardItem[];
  weapons: PdfMediaCardItem[];
  gearFields: PdfFieldItem[];
  inventory: Array<{ name: string; quantity: string; category: string; notes: string }>;
  powerStats: PdfFieldItem[];
  powerDetails: PdfFieldItem[];
  powerFeats: Array<{ name: string; description: string }>;
  customSections: PdfCustomSectionData[];
  gallery: PdfGalleryEntry[];
  footerMeta: string;
}

interface PdfPalette {
  pageBg: string;
  cardBg: string;
  mutedBg: string;
  border: string;
  borderStrong: string;
  accent: string;
  accentSoft: string;
  textMain: string;
  textMuted: string;
  textDim: string;
  badgeText: string;
}

const PDF_PALETTES: Record<PdfExportTheme, PdfPalette> = {
  light: {
    pageBg: '#fbf9f4',
    cardBg: '#ffffff',
    mutedBg: '#f1ede3',
    border: '#d6cfbe',
    borderStrong: '#9c927d',
    accent: '#7a5221',
    accentSoft: 'rgba(122, 82, 33, 0.10)',
    textMain: '#1c1b18',
    textMuted: '#534e46',
    textDim: '#7a7368',
    badgeText: '#5e3d15',
  },
  dark: {
    pageBg: '#121318',
    cardBg: '#181a22',
    mutedBg: '#20232e',
    border: '#323646',
    borderStrong: '#4c5268',
    accent: '#c8aa6e',
    accentSoft: 'rgba(200, 170, 110, 0.14)',
    textMain: '#ededf3',
    textMuted: '#b0b4c4',
    textDim: '#7e8396',
    badgeText: '#e6cf9b',
  },
};

// A4 2x (595.28 x 841.89 pt @ ~144 DPI para lectura nítida sin inflar memoria)
const PAGE_W = 1190;
const PAGE_H = 1684;
const PAD_X = 62;
const CONTENT_W = PAGE_W - PAD_X * 2; // 1066
const HEADER_TOP_Y = 78;
const FOOTER_TOP_Y = PAGE_H - 58;
const CONTENT_BOTTOM = FOOTER_TOP_Y - 22;

const FONT_SERIF = 'Georgia, "Source Serif 4", "Times New Roman", serif';
const FONT_SANS = 'system-ui, -apple-system, "Segoe UI", Inter, Roboto, sans-serif';
const FONT_MONO = 'ui-monospace, "Cascadia Mono", "JetBrains Mono", Consolas, monospace';

const IS_HEX_COLOR = /^#[0-9a-fA-F]{3,8}$/;

function cleanText(raw: unknown, maxLen = 0): string {
  const cleaned = stripHtmlForCanvas(raw);
  if (!cleaned) return '';
  if (maxLen > 0 && cleaned.length > maxLen) {
    return `${cleaned.slice(0, maxLen - 1).trimEnd()}…`;
  }
  return cleaned;
}

function addField(
  list: PdfFieldItem[],
  label: string,
  rawValue: unknown,
  options: { maxLen?: number; swatchHex?: unknown } = {},
): void {
  const value = cleanText(rawValue, options.maxLen || 0);
  if (!value) return;
  const hexCandidate = typeof options.swatchHex === 'string' && IS_HEX_COLOR.test(options.swatchHex.trim())
    ? options.swatchHex.trim()
    : undefined;
  list.push({ label, value, swatchHex: hexCandidate });
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

function joinNonEmpty(parts: unknown[], separator = ' · '): string {
  return parts.map((p) => cleanText(p)).filter(Boolean).join(separator);
}

/**
 * Construye el modelo documental completo y ordenado para generar el PDF multipágina.
 */
export function buildClassicPdfDocumentModel(
  rawChar: any,
  options: ExportPdfOptions = {},
): ClassicPdfDocumentModel {
  const char = unwrapRaw(rawChar) || {};
  const includeImages = options.includeImages !== false;
  const b = char.basics || {};
  const bo = char.body || {};
  const m = char.mind || {};
  const s = char.social || {};
  const be = char.beliefs || {};
  const p = char.priorities || {};
  const ps = char.powerScaling || {};
  const ex = char.extras || {};

  const name = cleanText(b.fullName || char.name) || 'Personaje sin título';
  const rawAlias = cleanText(b.nickname || b.alias);
  const alias = rawAlias && rawAlias.toLowerCase() !== name.toLowerCase() ? rawAlias : '';
  const sheetLabel = char.sheetType === 'classic' ? 'FICHA B · DOSIER EDITORIAL' : 'FICHA EDITORIAL';

  const quotes = Array.isArray(b.quotes) ? b.quotes : [];
  const quote = quotes.map((q: unknown) => cleanText(q)).find(Boolean) || '';

  const avatarUrl = includeImages
    ? (b.useIconForPfp ? (b.iconDataUrl || b.avatarDataUrl || '') : (b.avatarDataUrl || b.iconDataUrl || ''))
    : '';
  const bannerUrl = includeImages ? (b.bannerDataUrl || char.visualSettings?.backgroundUrl || '') : '';
  const avatarAspect = b.avatarAspect === 'portrait' ? 'portrait' : 'square';

  const badges: string[] = [];
  const roleVal = cleanText(b.role || ex.charClass || ex.class || ex.fgcStyle);
  const raceVal = cleanText(b.race);
  const ageVal = cleanText(b.realAge || b.apparentAge);
  const genderVal = cleanText(b.genderPronouns);
  const alignVal = cleanText(b.alignment);
  const tierVal = cleanText(ps.tier || ps.overallTier);

  if (raceVal) badges.push(raceVal);
  if (roleVal) badges.push(roleVal);
  if (ageVal) badges.push(`Edad: ${ageVal}`);
  if (genderVal) badges.push(genderVal);
  if (alignVal && alignVal !== 'Neutral Absoluto') badges.push(alignVal);
  if (tierVal) badges.push(`Tier ${tierVal}`);

  // 1. Datos Básicos
  const basicsFields: PdfFieldItem[] = [];
  addField(basicsFields, 'Nombre Completo', b.fullName || char.name);
  addField(basicsFields, 'Apodo / Alias', alias);
  addField(basicsFields, 'Raza / Especie', b.race);
  addField(basicsFields, 'Rol / Ocupación', b.role);
  addField(basicsFields, 'Edad Real', b.realAge);
  addField(basicsFields, 'Edad Aparente', b.apparentAge);
  addField(basicsFields, 'Género / Pronombres', b.genderPronouns);
  addField(basicsFields, 'Orientación', b.orientation);
  addField(basicsFields, 'Alineamiento', alignVal && alignVal !== 'Neutral Absoluto' ? alignVal : '');

  // 2. Físico y Apariencia
  const bodyFields: PdfFieldItem[] = [];
  addField(bodyFields, 'Estatura', bo.height);
  addField(bodyFields, 'Peso', bo.weight);
  addField(bodyFields, 'Complexión', bo.build);
  addField(bodyFields, 'Fenotipo / Especie', bo.speciesPhenotype);
  addField(bodyFields, 'Color de Ojos', bo.eyeColor, { swatchHex: bo.eyeColorHex });
  addField(bodyFields, 'Cabello', bo.hairColor, { swatchHex: bo.hairColorHex });
  addField(bodyFields, 'Tono de Piel', bo.skinColor, { swatchHex: bo.skinColorHex });
  addField(bodyFields, 'Condición Física', bo.physicalCondition);
  addField(bodyFields, 'Presencia / Aura', bo.presenceAura);
  addField(bodyFields, 'Voz', bo.voice);
  addField(bodyFields, 'Aroma', bo.scentAroma);
  addField(bodyFields, 'Postura', bo.postureBodyLanguage);
  addField(bodyFields, 'Expresión Facial', bo.facialExpression);
  addField(bodyFields, 'Rasgos Distintivos', bo.distinctiveMarks);
  addField(bodyFields, 'Accesorios', bo.notableAccessories);
  addField(bodyFields, 'Modificaciones', bo.bodyModifications);
  addField(bodyFields, 'Vestimenta', bo.clothingStyle);
  const bodyDescription = cleanText(bo.physicalDescription);

  // 3. Mente & Personalidad
  const mindFields: PdfFieldItem[] = [];
  addField(mindFields, 'Resumen de Personalidad', m.personalitySummary);
  addField(mindFields, 'MBTI / Arquetipo', m.mbti);
  addField(mindFields, 'Virtudes', m.virtues);
  addField(mindFields, 'Defectos', m.flaws);
  addField(mindFields, 'Cordura / Estabilidad', joinNonEmpty([m.sanityStatus, m.sanityNotes], ' — '));
  addField(mindFields, 'Ancla Emocional', m.sanityAnchor);
  addField(mindFields, 'Fobias / Traumas', m.fobiasTraumas);
  addField(mindFields, 'Mecanismos de Defensa', m.defenseMechanisms);
  addField(mindFields, 'Detonantes', m.triggers);
  addField(mindFields, 'Hábitos / Compulsiones', m.habitsCompulsions);

  const rawAxes = Array.isArray(m.axes) ? m.axes : [];
  const mindAxes: PdfAxisEntry[] = rawAxes
    .filter((ax: any) => ax && typeof ax.value === 'number' && Number(ax.value) !== 50)
    .slice(0, 10)
    .map((ax: any) => ({
      leftLabel: cleanText(ax.leftLabel) || 'Polo A',
      rightLabel: cleanText(ax.rightLabel) || 'Polo B',
      value: Math.max(0, Math.min(100, Math.round(Number(ax.value)))),
      category: cleanText(ax.category),
    }));

  // 4. Social & Relaciones
  const socialFields: PdfFieldItem[] = [];
  addField(socialFields, 'Facción Principal', s.faction);
  if (Array.isArray(s.factions) && s.factions.length > 0) {
    const facNames = s.factions
      .map((f: any) => cleanText(f?.name || f))
      .filter(Boolean)
      .join(', ');
    addField(socialFields, 'Otras Facciones', facNames);
  }
  addField(socialFields, 'Títulos / Epítetos', s.titlesEpithets);
  addField(socialFields, 'Origen / Residencia', s.originResidencia);
  addField(socialFields, 'Reputación', s.reputation);
  addField(socialFields, 'Idiomas', s.languages);
  addField(socialFields, 'Red de Influencia', s.networkInfluence);
  addField(socialFields, 'Máscara Social', s.socialMask);
  addField(socialFields, 'Estilo de Vida', s.lifestyleStandard);
  addField(socialFields, 'Comunicación', s.communicationStyle);
  addField(socialFields, 'Rumores / Visión Pública', s.rumorsPublicView);
  addField(socialFields, 'Deudas y Favores', s.debtsFavors);
  addField(socialFields, 'Rivales / Enemigos', s.rivalsEnemies);
  addField(socialFields, 'Dependientes', s.dependents);

  const relations = (Array.isArray(s.relations) ? s.relations : [])
    .filter((r: any) => r && (cleanText(r.name) || cleanText(r.description)))
    .map((r: any) => ({
      name: cleanText(r.name) || 'Vínculo',
      bondType: cleanText(r.bondType),
      status: cleanText(r.status),
      description: cleanText(r.description),
    }));

  // 5. Creencias & Prioridades
  const beliefsFields: PdfFieldItem[] = [];
  addField(beliefsFields, 'Código Moral', be.moralCode);
  addField(beliefsFields, 'Religión / Culto', be.religion);
  addField(beliefsFields, 'Cosmovisión', be.worldview);
  addField(beliefsFields, 'Le Gusta / Valores', be.loves);
  addField(beliefsFields, 'Odia / Rechaza', be.hates);
  addField(beliefsFields, 'Línea Roja', be.redLine);
  addField(beliefsFields, 'Postura ante Autoridad', be.authorityStance);
  addField(beliefsFields, 'Autoimagen', be.selfImage);
  addField(beliefsFields, 'Prejuicios', be.biasesPrejudices);
  addField(beliefsFields, 'Puntos Ciegos', be.blindSpots);
  addField(beliefsFields, 'Supersticiones', be.superstitions);
  addField(beliefsFields, 'Dicho vs Hecho', be.statedVsActive);
  addField(beliefsFields, 'Evento de Origen / Historia', be.originEvent);

  const prioritiesFields: PdfFieldItem[] = [];
  addField(prioritiesFields, 'Objetivo Principal', p.mainGoal);
  if (Array.isArray(p.secondaryGoals) && p.secondaryGoals.length > 0) {
    const goalsText = p.secondaryGoals
      .map((g: any) => cleanText(g?.text || g?.title || g))
      .filter(Boolean)
      .join(' · ');
    addField(prioritiesFields, 'Metas Secundarias', goalsText);
  }
  addField(prioritiesFields, 'Motivación Profunda', p.deepMotivation);
  addField(prioritiesFields, 'Mayor Miedo', p.greatestFear);
  addField(prioritiesFields, 'Conflicto Actual', p.currentConflict);
  addField(prioritiesFields, 'Lealtad Máxima', p.maxLoyalty);
  addField(prioritiesFields, 'Límite de Sacrificio', p.sacrificeLine);
  addField(prioritiesFields, 'Deseo vs Necesidad', p.wantVsNeed);
  addField(prioritiesFields, 'Urgencia', p.timeHorizonUrgency);
  addField(prioritiesFields, 'Reacción al Fracaso', p.failureReaction);
  addField(prioritiesFields, 'Fantasía de Victoria', p.victoryFantasy);

  // 6. Habilidades & Poderes (con imagen demostrativa)
  const rawSkills = Array.isArray(char.skills) ? char.skills : [];
  const skills: PdfMediaCardItem[] = rawSkills
    .filter((sk: any) => sk && (cleanText(sk.title || sk.name) || cleanText(sk.summary) || cleanText(sk.effect) || sk.imageDataUrl))
    .map((sk: any, idx: number) => {
      const skBadges = [
        sk.type === 'active' ? 'Activa' : sk.type === 'passive' ? 'Pasiva' : '',
        cleanText(sk.tier),
        cleanText(sk.elementType),
      ].filter(Boolean);

      const details: PdfFieldItem[] = [];
      addField(details, 'Costo', sk.cost);
      addField(details, 'Enfriamiento (CD)', sk.cd);
      addField(details, 'Tiempo (TD)', sk.td);
      addField(details, 'Rango', sk.range);
      addField(details, 'Condición', sk.condicion);
      addField(details, 'Efecto / Mecánica', sk.effect);
      addField(details, 'Desventaja / Riesgo', sk.drawback);

      return {
        title: cleanText(sk.title || sk.name) || `Habilidad ${idx + 1}`,
        badges: skBadges,
        details,
        body: cleanText(sk.summary),
        imageUrl: includeImages ? cleanText(sk.imageDataUrl) : '',
        imageFit: sk.imageFit === 'contain' ? 'contain' : 'cover',
      };
    });

  // 7. Arsenal & Armas (con imagen)
  const rawWeapons = Array.isArray(char.weapons) ? char.weapons : [];
  const weapons: PdfMediaCardItem[] = rawWeapons
    .filter((wp: any) => wp && (cleanText(wp.name || wp.weaponType) || cleanText(wp.description) || cleanText(wp.ability) || wp.imageDataUrl))
    .map((wp: any, idx: number) => {
      const wpBadges = [
        cleanText(wp.weaponType),
        cleanText(wp.rarity),
        cleanText(wp.damageType),
      ].filter(Boolean);

      const details: PdfFieldItem[] = [];
      addField(details, 'Habilidad del Arma', wp.ability);
      addField(details, 'Peso / Valor', joinNonEmpty([wp.weight, wp.value], ' · '));
      addField(details, 'Notas', wp.notes);

      return {
        title: cleanText(wp.name || wp.weaponType) || `Arma ${idx + 1}`,
        badges: wpBadges,
        details,
        body: cleanText(wp.description),
        imageUrl: includeImages ? cleanText(wp.imageDataUrl) : '',
        imageFit: wp.imageFit === 'contain' ? 'contain' : 'cover',
      };
    });

  // 8. Equipo, Extras & Inventario
  const gearFields: PdfFieldItem[] = [];
  addField(gearFields, 'Clase RPG', ex.charClass || ex.class);
  addField(gearFields, 'Estilo de Combate', ex.fgcStyle);
  addField(gearFields, 'Equipo Estándar', ps.standardEquipment);
  addField(gearFields, 'Objetos Sentimentales', ex.sentimentalItems);
  addField(gearFields, 'Voz / Seiyuu', joinNonEmpty([ex.voiceActor, ex.voiceUrl], ' — '));
  addField(gearFields, 'Playlist / Tema', ex.playlist);
  addField(gearFields, 'Inspiraciones', ex.conceptInspirations);
  addField(gearFields, 'Tropo / Rol Narrativo', ex.narrativeRoleTropes);
  addField(gearFields, 'Moodboard Estético', ex.aestheticMoodboard);
  addField(gearFields, 'Dinámicas de Rol', ex.rpDynamicsShips);
  addField(gearFields, 'Curiosidades', ex.curiosities);
  addField(gearFields, 'Notas de Rol', ex.roleNotes);

  const inventory = (Array.isArray(ex.inventory) ? ex.inventory : [])
    .filter((it: any) => it && (cleanText(it.name) || cleanText(it.notes)))
    .map((it: any) => ({
      name: cleanText(it.name) || 'Objeto',
      quantity: cleanText(it.quantity),
      category: cleanText(it.category),
      notes: cleanText(it.notes || it.description),
    }));

  // 9. Power-Scaling
  const powerStats: PdfFieldItem[] = [];
  addField(powerStats, 'Tier General', ps.overallTier || ps.tier);
  addField(powerStats, 'Capacidad Destructiva (DC)', ps.dc);
  addField(powerStats, 'Potencia Física (AP)', ps.strikingStrength);
  addField(powerStats, 'Durabilidad', ps.durability);
  addField(powerStats, 'Velocidad Base', ps.speed);
  addField(powerStats, 'Vel. Combate', ps.speedCombat);
  addField(powerStats, 'Vel. Reacción', ps.speedReaction);
  addField(powerStats, 'Fuerza de Levantamiento', ps.liftingStrength);
  addField(powerStats, 'Rango', ps.range);
  addField(powerStats, 'IQ / Intelecto', ps.iq || ps.intelligence);
  addField(powerStats, 'BIQ (Combate)', ps.biq);
  addField(powerStats, 'Estamina', ps.stamina);

  const powerDetails: PdfFieldItem[] = [];
  if (Array.isArray(ps.resistancesList) && ps.resistancesList.length > 0) {
    addField(powerDetails, 'Resistencias', ps.resistancesList.map((r: unknown) => cleanText(r)).filter(Boolean).join(', '));
  }
  addField(powerDetails, 'Notas de Resistencia', ps.resistancesNotes);
  if (Array.isArray(ps.haxList) && ps.haxList.length > 0) {
    addField(powerDetails, 'Habilidades Especiales (Hax)', ps.haxList.map((h: unknown) => cleanText(h)).filter(Boolean).join(', '));
  }
  addField(powerDetails, 'Debilidades Conocidas', ps.weaknesses);

  const powerFeats = (Array.isArray(ps.feats) ? ps.feats : [])
    .filter((f: any) => f && (cleanText(f.title || f.name) || cleanText(f.description)))
    .map((f: any) => ({
      name: cleanText(f.title || f.name) || 'Hazaña',
      description: cleanText(f.description || f.notes),
    }));

  // 10. Pestañas Personalizadas (campos, estadísticas e imágenes propias)
  const rawCustomTabs = Array.isArray(char.customTabs) ? char.customTabs : [];
  const customSections: PdfCustomSectionData[] = [];

  for (const tab of rawCustomTabs) {
    if (!tab) continue;
    const fields: PdfFieldItem[] = [];
    const stats: PdfCustomStatEntry[] = [];
    const images: PdfGalleryEntry[] = [];
    const blocks = Array.isArray(tab.blocks) ? tab.blocks : [];

    for (const blk of blocks) {
      if (!blk) continue;
      const directContent = cleanText(blk.content || blk.text || blk.value);
      if (directContent) {
        addField(fields, cleanText(blk.title || blk.label) || 'Nota', directContent);
      }
      if (Array.isArray(blk.fields)) {
        for (const f of blk.fields) {
          if (!f || f.type === 'divider' || f.type === 'spacer') continue;
          const fLabel = cleanText(f.label) || 'Campo';
          if (f.type === 'image') {
            if (includeImages && typeof f.value === 'string' && f.value.trim()) {
              images.push({
                url: f.value.trim(),
                caption: fLabel,
                fit: f.imageFit === 'cover' ? 'cover' : 'contain',
              });
            }
          } else if (f.type === 'stat') {
            const numVal = Number(f.value);
            const maxVal = Number(f.max) || 100;
            if (!Number.isNaN(numVal)) {
              stats.push({ label: fLabel, value: numVal, max: maxVal > 0 ? maxVal : 100 });
            }
          } else {
            addField(fields, fLabel, f.value);
          }
        }
      }
      if (Array.isArray(blk.items)) {
        for (const it of blk.items) {
          if (!it) continue;
          const imgUrl = it.dataUrl || it.imageDataUrl || it.url;
          if (includeImages && typeof imgUrl === 'string' && imgUrl.trim() && (imgUrl.startsWith('data:image') || imgUrl.startsWith('http'))) {
            images.push({
              url: imgUrl.trim(),
              caption: cleanText(it.title || it.caption || it.label || blk.title) || 'Imagen',
              fit: it.imageFit === 'cover' ? 'cover' : 'contain',
            });
          }
          const itemLabel = cleanText(it.title || it.label || it.name);
          const itemVal = cleanText(it.description || it.content || it.value);
          if (itemLabel && itemVal) {
            addField(fields, itemLabel, itemVal);
          } else if (itemVal || itemLabel) {
            addField(fields, cleanText(blk.title || blk.label) || 'Elemento', itemVal || itemLabel);
          }
        }
      }
    }

    if (fields.length > 0 || stats.length > 0 || images.length > 0) {
      customSections.push({
        id: cleanText(tab.id) || `custom-${customSections.length + 1}`,
        title: cleanText(tab.label) || 'Sección Personalizada',
        description: cleanText(tab.description),
        fields,
        stats,
        images,
      });
    }
  }

  // 11. Galería de Imágenes de Referencia (extras.gallery + ícono/fondo adicionales sin duplicar)
  const gallery: PdfGalleryEntry[] = [];
  if (includeImages) {
    const seenUrls = new Set<string>();
    if (avatarUrl) seenUrls.add(avatarUrl);
    if (bannerUrl) seenUrls.add(bannerUrl);

    if (b.iconDataUrl && !seenUrls.has(b.iconDataUrl)) {
      seenUrls.add(b.iconDataUrl);
      gallery.push({ url: b.iconDataUrl, caption: 'Ícono / Emblema', fit: 'contain' });
    }

    const rawGallery = Array.isArray(ex.gallery) ? ex.gallery : [];
    rawGallery.forEach((img: any, idx: number) => {
      const url = typeof img === 'string' ? img : img?.dataUrl || img?.url || '';
      if (!url || seenUrls.has(url)) return;
      seenUrls.add(url);
      gallery.push({
        url,
        caption: cleanText(img?.caption || img?.title) || `Referencia Visual #${idx + 1}`,
        fit: img?.imageFit === 'cover' ? 'cover' : 'contain',
      });
    });

    const customBg = cleanText(char.presentation?.background?.image || char.visualSettings?.backgroundUrl);
    if (customBg && !seenUrls.has(customBg)) {
      seenUrls.add(customBg);
      gallery.push({ url: customBg, caption: 'Fondo Escénico', fit: 'contain' });
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
    sheetLabel,
    quote,
    badges,
    bannerUrl,
    avatarUrl,
    avatarAspect,
    basicsFields,
    bodyFields,
    bodyDescription,
    mindFields,
    mindAxes,
    socialFields,
    relations,
    beliefsFields,
    prioritiesFields,
    skills,
    weapons,
    gearFields,
    inventory,
    powerStats,
    powerDetails,
    powerFeats,
    customSections,
    gallery,
    footerMeta: `Actualizado: ${updatedText}`,
  };
}

// ── Utilidades gráficas en Canvas 2D ───────────────────────────────────────

function drawContainedImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
  mode: 'cover' | 'contain',
): void {
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  if (!iw || !ih) return;

  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();

  if (mode === 'contain') {
    const scale = Math.min(w / iw, h / ih);
    const dw = iw * scale;
    const dh = ih * scale;
    ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
  } else {
    const scale = Math.max(w / iw, h / ih);
    const dw = iw * scale;
    const dh = ih * scale;
    ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
  }
  ctx.restore();
}

function drawRoundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  const rad = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.lineTo(x + w - rad, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rad);
  ctx.lineTo(x + w, y + h - rad);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rad, y + h);
  ctx.lineTo(x + rad, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rad);
  ctx.lineTo(x, y + rad);
  ctx.quadraticCurveTo(x, y, x + rad, y);
  ctx.closePath();
}

interface MeasuredFieldLayout {
  field: PdfFieldItem;
  lines: string[];
  height: number;
}

function measureFieldBlock(
  ctx: CanvasRenderingContext2D,
  field: PdfFieldItem,
  colWidth: number,
  maxLines = 0,
): MeasuredFieldLayout {
  ctx.font = `400 18px ${FONT_SANS}`;
  const innerW = colWidth - (field.swatchHex ? 22 : 0);
  const lines = wrapTextLines((t) => ctx.measureText(t).width, field.value, innerW, maxLines);
  const labelH = 22;
  const lineH = 26;
  const bodyH = Math.max(1, lines.length) * lineH;
  return {
    field,
    lines,
    height: labelH + bodyH + 10,
  };
}

class PdfPagePaginator {
  public readonly pages: HTMLCanvasElement[] = [];
  private canvas!: HTMLCanvasElement;
  public ctx!: CanvasRenderingContext2D;
  public y = 0;

  constructor(
    private readonly model: ClassicPdfDocumentModel,
    private readonly palette: PdfPalette,
  ) {
    this.startPage(true);
  }

  public startPage(isCover = false): void {
    const canvas = document.createElement('canvas');
    canvas.width = PAGE_W;
    canvas.height = PAGE_H;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Canvas 2D no está disponible para generar el PDF.');
    }
    this.canvas = canvas;
    this.ctx = ctx;
    this.pages.push(canvas);

    // Fondo de página
    ctx.fillStyle = this.palette.pageBg;
    ctx.fillRect(0, 0, PAGE_W, PAGE_H);

    // Marco sutil editorial
    ctx.strokeStyle = this.palette.border;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(28, 28, PAGE_W - 56, PAGE_H - 56);

    if (!isCover) {
      // Cabecera discreta de continuidad en páginas 2+
      ctx.font = `700 13px ${FONT_MONO}`;
      ctx.fillStyle = this.palette.accent;
      ctx.textBaseline = 'top';
      ctx.fillText(this.model.name.toUpperCase(), PAD_X, 44);

      ctx.textAlign = 'right';
      ctx.fillStyle = this.palette.textDim;
      ctx.fillText(this.model.sheetLabel, PAGE_W - PAD_X, 44);
      ctx.textAlign = 'left';

      ctx.strokeStyle = this.palette.border;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(PAD_X, 66);
      ctx.lineTo(PAGE_W - PAD_X, 66);
      ctx.stroke();

      this.y = HEADER_TOP_Y + 12;
    } else {
      this.y = 54;
    }
  }

  public ensureSpace(neededHeight: number): void {
    if (this.y + neededHeight > CONTENT_BOTTOM) {
      this.startPage(false);
    }
  }

  public drawSectionBanner(title: string, subtitle = '', reserveContentHeight = 90): void {
    const bannerH = subtitle ? 64 : 44;
    this.ensureSpace(bannerH + reserveContentHeight);

    const ctx = this.ctx;
    ctx.fillStyle = this.palette.mutedBg;
    ctx.fillRect(PAD_X, this.y, CONTENT_W, 42);

    ctx.fillStyle = this.palette.accent;
    ctx.fillRect(PAD_X, this.y, 5, 42);

    ctx.strokeStyle = this.palette.borderStrong;
    ctx.lineWidth = 1;
    ctx.strokeRect(PAD_X, this.y, CONTENT_W, 42);

    ctx.font = `700 20px ${FONT_SERIF}`;
    ctx.fillStyle = this.palette.textMain;
    ctx.textBaseline = 'middle';
    ctx.fillText(title, PAD_X + 18, this.y + 21);

    this.y += 42;
    if (subtitle) {
      ctx.font = `400 16px ${FONT_SANS}`;
      ctx.fillStyle = this.palette.textMuted;
      ctx.textBaseline = 'top';
      ctx.fillText(subtitle, PAD_X + 4, this.y + 8);
      this.y += 26;
    }
    this.y += 14;
  }

  public stampFooters(): void {
    const total = this.pages.length;
    this.pages.forEach((page, idx) => {
      const ctx = page.getContext('2d');
      if (!ctx) return;

      ctx.strokeStyle = this.palette.border;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(PAD_X, FOOTER_TOP_Y - 10);
      ctx.lineTo(PAGE_W - PAD_X, FOOTER_TOP_Y - 10);
      ctx.stroke();

      ctx.font = `400 13px ${FONT_MONO}`;
      ctx.fillStyle = this.palette.textDim;
      ctx.textBaseline = 'top';
      ctx.textAlign = 'left';
      ctx.fillText(`WHERE'S MY FICHA · ${this.model.footerMeta}`, PAD_X, FOOTER_TOP_Y);

      ctx.textAlign = 'right';
      ctx.fillStyle = this.palette.textMuted;
      ctx.fillText(`Página ${idx + 1} de ${total}`, PAGE_W - PAD_X, FOOTER_TOP_Y);
      ctx.textAlign = 'left';
    });
  }
}

async function loadImageMap(urls: string[]): Promise<Map<string, HTMLImageElement>> {
  const unique = Array.from(new Set(urls.filter(Boolean)));
  const loaded = new Map<string, HTMLImageElement>();
  const cleanups: Array<() => void> = [];

  await Promise.all(
    unique.map(async (url) => {
      const res = await loadCanvasImage(url);
      if (res) {
        loaded.set(url, res.image);
        cleanups.push(res.cleanup);
      }
    }),
  );

  // Devolvemos map; las URLs temporales blob se limpian tras terminar renderizado usando helper adjunto
  (loaded as any)._cleanup = () => {
    cleanups.forEach((fn) => fn());
  };
  return loaded;
}

function drawTwoColFieldGrid(
  pag: PdfPagePaginator,
  palette: PdfPalette,
  fields: PdfFieldItem[],
  sectionTitle?: string,
): void {
  if (fields.length === 0) return;

  const colGap = 24;
  const cardPadX = 20;
  const cardPadY = 16;
  const colW = (CONTENT_W - cardPadX * 2 - colGap) / 2;

  // Emparejar campos largos (superan 140 chars) como ancho completo para no desperdiciar ni apretar columnas
  type RowGroup =
    | { kind: 'pair'; left: MeasuredFieldLayout; right?: MeasuredFieldLayout; height: number }
    | { kind: 'full'; item: MeasuredFieldLayout; height: number };

  const rows: RowGroup[] = [];
  let i = 0;
  const MAX_LINES_PER_CHUNK = 38;
  while (i < fields.length) {
    const f = fields[i];
    const isLong = f.value.length > 110 || f.value.includes('\n');
    if (isLong) {
      const m = measureFieldBlock(pag.ctx, f, CONTENT_W - cardPadX * 2);
      if (m.lines.length <= MAX_LINES_PER_CHUNK) {
        rows.push({ kind: 'full', item: m, height: m.height });
      } else {
        for (let li = 0; li < m.lines.length; li += MAX_LINES_PER_CHUNK) {
          const sliceLines = m.lines.slice(li, li + MAX_LINES_PER_CHUNK);
          const partLabel = li === 0 ? f.label : `${f.label} (cont.)`;
          const partHeight = 22 + sliceLines.length * 26 + 10;
          rows.push({
            kind: 'full',
            item: {
              field: { label: partLabel, value: sliceLines.join('\n'), swatchHex: li === 0 ? f.swatchHex : undefined },
              lines: sliceLines,
              height: partHeight,
            },
            height: partHeight,
          });
        }
      }
      i += 1;
    } else {
      const left = measureFieldBlock(pag.ctx, f, colW);
      const next = fields[i + 1];
      const nextIsLong = next && (next.value.length > 110 || next.value.includes('\n'));
      if (next && !nextIsLong) {
        const right = measureFieldBlock(pag.ctx, next, colW);
        rows.push({ kind: 'pair', left, right, height: Math.max(left.height, right.height) });
        i += 2;
      } else {
        rows.push({ kind: 'pair', left, height: left.height });
        i += 1;
      }
    }
  }

  if (sectionTitle) {
    pag.drawSectionBanner(sectionTitle, '', Math.min(180, (rows[0]?.height || 60) + cardPadY * 2));
  }

  // Paginar fila por fila dibujando tarjetas limpias por bloque de página
  let rowIndex = 0;
  while (rowIndex < rows.length) {
    const available = CONTENT_BOTTOM - pag.y - cardPadY * 2;
    if (rows[rowIndex].height > available && pag.y > HEADER_TOP_Y + 40) {
      pag.startPage(false);
    }

    const batch: RowGroup[] = [];
    let batchH = cardPadY * 2;
    while (rowIndex < rows.length) {
      const nextRow = rows[rowIndex];
      const projected = batchH + nextRow.height + (batch.length > 0 ? 8 : 0);
      if (batch.length > 0 && pag.y + projected > CONTENT_BOTTOM) {
        break;
      }
      batch.push(nextRow);
      batchH = projected;
      rowIndex += 1;
    }

    const ctx = pag.ctx;
    ctx.fillStyle = palette.cardBg;
    ctx.fillRect(PAD_X, pag.y, CONTENT_W, batchH);
    ctx.strokeStyle = palette.border;
    ctx.lineWidth = 1;
    ctx.strokeRect(PAD_X, pag.y, CONTENT_W, batchH);

    let innerY = pag.y + cardPadY;
    for (const row of batch) {
      if (row.kind === 'full') {
        drawMeasuredField(ctx, palette, row.item, PAD_X + cardPadX, innerY);
      } else {
        drawMeasuredField(ctx, palette, row.left, PAD_X + cardPadX, innerY);
        if (row.right) {
          drawMeasuredField(ctx, palette, row.right, PAD_X + cardPadX + colW + colGap, innerY);
        }
      }
      innerY += row.height + 8;
    }

    pag.y += batchH + 18;
  }
}

function drawMeasuredField(
  ctx: CanvasRenderingContext2D,
  palette: PdfPalette,
  measured: MeasuredFieldLayout,
  x: number,
  y: number,
): void {
  ctx.textBaseline = 'top';
  ctx.font = `700 13px ${FONT_MONO}`;
  ctx.fillStyle = palette.accent;
  ctx.fillText(measured.field.label.toUpperCase(), x, y);

  let textX = x;
  if (measured.field.swatchHex) {
    ctx.fillStyle = measured.field.swatchHex;
    ctx.beginPath();
    ctx.arc(x + 7, y + 31, 6.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = palette.borderStrong;
    ctx.lineWidth = 1;
    ctx.stroke();
    textX += 20;
  }

  ctx.font = `400 18px ${FONT_SANS}`;
  ctx.fillStyle = palette.textMain;
  measured.lines.forEach((line, idx) => {
    ctx.fillText(line, textX, y + 22 + idx * 26);
  });
}

function drawMediaCardsSection(
  pag: PdfPagePaginator,
  palette: PdfPalette,
  imageMap: Map<string, HTMLImageElement>,
  title: string,
  items: PdfMediaCardItem[],
): void {
  if (items.length === 0) return;

  pag.drawSectionBanner(title, '', 170);

  for (const item of items) {
    const imgObj = item.imageUrl ? imageMap.get(item.imageUrl) : undefined;
    const thumbSize = imgObj ? 172 : 0;
    const cardPad = 20;
    const textW = imgObj ? CONTENT_W - cardPad * 2 - thumbSize - 22 : CONTENT_W - cardPad * 2;

    const ctx = pag.ctx;
    ctx.font = `700 22px ${FONT_SERIF}`;
    const titleLines = wrapTextLines((t) => ctx.measureText(t).width, item.title, textW, 2);
    const badgesH = item.badges.length > 0 ? 30 : 0;

    ctx.font = `400 18px ${FONT_SANS}`;
    const bodyLines = item.body
      ? wrapTextLines((t) => ctx.measureText(t).width, item.body, textW)
      : [];

    const detailLayouts = item.details.map((d) => measureFieldBlock(ctx, d, textW));
    const detailsH = detailLayouts.reduce((sum, d) => sum + d.height + 4, 0);

    const textHeight =
      titleLines.length * 28 +
      badgesH +
      (bodyLines.length > 0 ? bodyLines.length * 26 + 10 : 0) +
      (detailsH > 0 ? detailsH + 6 : 0);

    const cardH = cardPad * 2 + Math.max(thumbSize, textHeight);

    pag.ensureSpace(cardH + 14);
    const drawCtx = pag.ctx;
    const cardX = PAD_X;
    const cardY = pag.y;

    drawCtx.fillStyle = palette.cardBg;
    drawCtx.fillRect(cardX, cardY, CONTENT_W, cardH);
    drawCtx.fillStyle = palette.accent;
    drawCtx.fillRect(cardX, cardY, 4, cardH);
    drawCtx.strokeStyle = palette.border;
    drawCtx.lineWidth = 1;
    drawCtx.strokeRect(cardX, cardY, CONTENT_W, cardH);

    // Imagen derecha nítida si existe
    if (imgObj) {
      const imgX = cardX + CONTENT_W - cardPad - thumbSize;
      const imgY = cardY + cardPad;
      drawCtx.fillStyle = palette.mutedBg;
      drawCtx.fillRect(imgX, imgY, thumbSize, thumbSize);
      drawContainedImage(drawCtx, imgObj, imgX + 2, imgY + 2, thumbSize - 4, thumbSize - 4, item.imageFit || 'contain');
      drawCtx.strokeStyle = palette.borderStrong;
      drawCtx.strokeRect(imgX, imgY, thumbSize, thumbSize);
    }

    let ty = cardY + cardPad;
    const tx = cardX + cardPad;

    drawCtx.font = `700 22px ${FONT_SERIF}`;
    drawCtx.fillStyle = palette.textMain;
    drawCtx.textBaseline = 'top';
    titleLines.forEach((line, idx) => {
      drawCtx.fillText(line, tx, ty + idx * 28);
    });
    ty += titleLines.length * 28 + 4;

    if (item.badges.length > 0) {
      let bx = tx;
      drawCtx.font = `600 13px ${FONT_MONO}`;
      for (const badge of item.badges) {
        const bw = drawCtx.measureText(badge).width + 18;
        if (bx + bw > tx + textW) break;
        drawCtx.fillStyle = palette.accentSoft;
        drawCtx.fillRect(bx, ty, bw, 24);
        drawCtx.strokeStyle = palette.accent;
        drawCtx.lineWidth = 1;
        drawCtx.strokeRect(bx, ty, bw, 24);
        drawCtx.fillStyle = palette.badgeText;
        drawCtx.fillText(badge, bx + 9, ty + 5);
        bx += bw + 8;
      }
      ty += 32;
    }

    if (bodyLines.length > 0) {
      drawCtx.font = `400 18px ${FONT_SANS}`;
      drawCtx.fillStyle = palette.textMain;
      bodyLines.forEach((line, idx) => {
        drawCtx.fillText(line, tx, ty + idx * 26);
      });
      ty += bodyLines.length * 26 + 10;
    }

    for (const det of detailLayouts) {
      drawMeasuredField(drawCtx, palette, det, tx, ty);
      ty += det.height + 4;
    }

    pag.y += cardH + 14;
  }
}

function drawGallerySection(
  pag: PdfPagePaginator,
  palette: PdfPalette,
  imageMap: Map<string, HTMLImageElement>,
  title: string,
  entries: PdfGalleryEntry[],
): void {
  const validEntries = entries.filter((e) => imageMap.has(e.url));
  if (validEntries.length === 0) return;

  const colGap = 24;
  const tileW = (CONTENT_W - colGap) / 2;
  const imgBoxH = 310;
  const captionH = 44;
  const tileH = imgBoxH + captionH;

  pag.drawSectionBanner(title, `${validEntries.length} imagen${validEntries.length === 1 ? '' : 'es'} de referencia`, tileH + 16);

  for (let i = 0; i < validEntries.length; i += 2) {
    pag.ensureSpace(tileH + 18);
    const pair = [validEntries[i], validEntries[i + 1]].filter(Boolean);
    const ctx = pag.ctx;
    const rowY = pag.y;

    pair.forEach((entry, colIdx) => {
      const tx = PAD_X + colIdx * (tileW + colGap);
      const imgObj = imageMap.get(entry.url);
      if (!imgObj) return;

      ctx.fillStyle = palette.cardBg;
      ctx.fillRect(tx, rowY, tileW, tileH);

      ctx.fillStyle = palette.mutedBg;
      ctx.fillRect(tx + 8, rowY + 8, tileW - 16, imgBoxH - 12);

      // En galerías preferimos contain para mostrar la obra completa sin recortar cabeza/detalles
      drawContainedImage(ctx, imgObj, tx + 10, rowY + 10, tileW - 20, imgBoxH - 16, 'contain');

      ctx.font = `600 15px ${FONT_SANS}`;
      ctx.fillStyle = palette.textMuted;
      ctx.textBaseline = 'top';
      const capLines = wrapTextLines((t) => ctx.measureText(t).width, entry.caption, tileW - 28, 1);
      if (capLines[0]) {
        ctx.fillText(capLines[0], tx + 14, rowY + imgBoxH + 8);
      }

      ctx.strokeStyle = palette.borderStrong;
      ctx.lineWidth = 1;
      ctx.strokeRect(tx, rowY, tileW, tileH);
    });

    pag.y += tileH + 18;
  }
}

/**
 * Renderiza cada página A4 de la ficha en Canvas 2D bien organizada e ilustrativa.
 */
export async function renderClassicPdfPages(
  char: any,
  options: ExportPdfOptions = {},
): Promise<{
  model: ClassicPdfDocumentModel;
  previews: string[];
  jpegPages: Array<{ jpegBytes: Uint8Array; pixelWidth: number; pixelHeight: number }>;
  pageCount: number;
}> {
  const model = buildClassicPdfDocumentModel(char, options);
  const theme: PdfExportTheme = options.theme === 'dark' ? 'dark' : 'light';
  const palette = PDF_PALETTES[theme];

  const allUrls: string[] = [];
  if (model.bannerUrl) allUrls.push(model.bannerUrl);
  if (model.avatarUrl) allUrls.push(model.avatarUrl);
  model.skills.forEach((sk) => sk.imageUrl && allUrls.push(sk.imageUrl));
  model.weapons.forEach((wp) => wp.imageUrl && allUrls.push(wp.imageUrl));
  model.customSections.forEach((cs) => cs.images.forEach((im) => allUrls.push(im.url)));
  model.gallery.forEach((g) => allUrls.push(g.url));

  const imageMap = await loadImageMap(allUrls);

  try {
    const pag = new PdfPagePaginator(model, palette);

    // ── PORTADA DE LA FICHA (Página 1) ─────────────────────────────────────
    const bannerImg = model.bannerUrl ? imageMap.get(model.bannerUrl) : undefined;
    if (bannerImg) {
      const bannerH = 210;
      const ctx = pag.ctx;
      drawContainedImage(ctx, bannerImg, PAD_X, pag.y, CONTENT_W, bannerH, 'cover');
      ctx.strokeStyle = palette.borderStrong;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(PAD_X, pag.y, CONTENT_W, bannerH);
      pag.y += bannerH + 20;
    }

    // Cabecera Identidad (Retrato + Título + Badges + Cita)
    {
      const ctx = pag.ctx;
      const avatarImg = model.avatarUrl ? imageMap.get(model.avatarUrl) : undefined;
      const avatarW = avatarImg ? 186 : 0;
      const avatarH = avatarImg ? (model.avatarAspect === 'portrait' ? 242 : 186) : 0;
      const infoX = avatarImg ? PAD_X + avatarW + 28 : PAD_X;
      const infoW = avatarImg ? CONTENT_W - avatarW - 28 : CONTENT_W;

      ctx.font = `700 34px ${FONT_SERIF}`;
      const nameLines = wrapTextLines((t) => ctx.measureText(t).width, model.name, infoW, 2);

      let infoH = 26 + nameLines.length * 40;
      if (model.alias) infoH += 28;
      if (model.badges.length > 0) infoH += 42;

      ctx.font = `italic 18px ${FONT_SERIF}`;
      const quoteLines = model.quote
        ? wrapTextLines((t) => ctx.measureText(t).width, `«${model.quote}»`, infoW - 28, 3)
        : [];
      if (quoteLines.length > 0) {
        infoH += 16 + quoteLines.length * 25 + 16;
      }

      const heroH = Math.max(avatarH, infoH) + 28;
      const heroY = pag.y;

      // Tarjeta contenedora hero
      ctx.fillStyle = palette.cardBg;
      ctx.fillRect(PAD_X, heroY, CONTENT_W, heroH);
      ctx.strokeStyle = palette.borderStrong;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(PAD_X, heroY, CONTENT_W, heroH);

      if (avatarImg) {
        const ax = PAD_X + 16;
        const ay = heroY + 14;
        ctx.fillStyle = palette.mutedBg;
        drawRoundedRectPath(ctx, ax, ay, avatarW, avatarH, 4);
        ctx.fill();
        drawContainedImage(ctx, avatarImg, ax, ay, avatarW, avatarH, 'cover');
        ctx.strokeStyle = palette.accent;
        ctx.lineWidth = 2;
        ctx.strokeRect(ax, ay, avatarW, avatarH);
      }

      const rx = avatarImg ? infoX + 10 : PAD_X + 22;
      const rw = avatarImg ? infoW - 26 : CONTENT_W - 44;
      let ry = heroY + 16;

      ctx.textBaseline = 'top';
      ctx.font = `700 12px ${FONT_MONO}`;
      ctx.fillStyle = palette.accent;
      ctx.fillText(model.sheetLabel, rx, ry);
      ry += 22;

      ctx.font = `700 34px ${FONT_SERIF}`;
      ctx.fillStyle = palette.textMain;
      nameLines.forEach((line, idx) => {
        ctx.fillText(line, rx, ry + idx * 40);
      });
      ry += nameLines.length * 40 + 2;

      if (model.alias) {
        ctx.font = `600 18px ${FONT_SANS}`;
        ctx.fillStyle = palette.textMuted;
        ctx.fillText(`"${model.alias}"`, rx, ry);
        ry += 28;
      }

      if (model.badges.length > 0) {
        ry += 4;
        let bx = rx;
        ctx.font = `600 13px ${FONT_MONO}`;
        for (const badge of model.badges) {
          const bw = ctx.measureText(badge).width + 18;
          if (bx + bw > rx + rw) break;
          ctx.fillStyle = palette.accentSoft;
          ctx.fillRect(bx, ry, bw, 25);
          ctx.strokeStyle = palette.accent;
          ctx.lineWidth = 1;
          ctx.strokeRect(bx, ry, bw, 25);
          ctx.fillStyle = palette.badgeText;
          ctx.fillText(badge, bx + 9, ry + 5);
          bx += bw + 8;
        }
        ry += 34;
      }

      if (quoteLines.length > 0) {
        ry += 6;
        const qBoxH = quoteLines.length * 25 + 16;
        ctx.fillStyle = palette.mutedBg;
        ctx.fillRect(rx, ry, rw, qBoxH);
        ctx.fillStyle = palette.accent;
        ctx.fillRect(rx, ry, 4, qBoxH);
        ctx.font = `italic 18px ${FONT_SERIF}`;
        ctx.fillStyle = palette.textMain;
        quoteLines.forEach((line, idx) => {
          ctx.fillText(line, rx + 16, ry + 8 + idx * 25);
        });
      }

      pag.y += heroH + 22;
    }

    // ── DATOS BÁSICOS & FÍSICO ──────────────────────────────────────────────
    drawTwoColFieldGrid(pag, palette, model.basicsFields, 'Identidad & Datos Básicos');

    if (model.bodyFields.length > 0 || model.bodyDescription) {
      drawTwoColFieldGrid(pag, palette, model.bodyFields, 'Físico & Apariencia');
      if (model.bodyDescription) {
        drawTwoColFieldGrid(pag, palette, [{ label: 'Descripción Física', value: model.bodyDescription }]);
      }
    }

    // ── MENTE, EJES & PERSONALIDAD ──────────────────────────────────────────
    if (model.mindFields.length > 0 || model.mindAxes.length > 0) {
      drawTwoColFieldGrid(pag, palette, model.mindFields, 'Mente, Psique & Personalidad');

      if (model.mindAxes.length > 0) {
        const axisRowH = 44;
        const boxPad = 18;
        const colGap = 28;
        const colW = (CONTENT_W - boxPad * 2 - colGap) / 2;
        const pairCount = Math.ceil(model.mindAxes.length / 2);
        const totalBoxH = boxPad * 2 + 28 + pairCount * axisRowH;

        pag.ensureSpace(totalBoxH + 14);
        const ctx = pag.ctx;
        ctx.fillStyle = palette.cardBg;
        ctx.fillRect(PAD_X, pag.y, CONTENT_W, totalBoxH);
        ctx.strokeStyle = palette.border;
        ctx.strokeRect(PAD_X, pag.y, CONTENT_W, totalBoxH);

        ctx.font = `700 13px ${FONT_MONO}`;
        ctx.fillStyle = palette.accent;
        ctx.textBaseline = 'top';
        ctx.fillText('EJES DE PERSONALIDAD DESTACADOS', PAD_X + boxPad, pag.y + boxPad);

        model.mindAxes.forEach((ax, idx) => {
          const col = idx % 2;
          const row = Math.floor(idx / 2);
          const axX = PAD_X + boxPad + col * (colW + colGap);
          const axY = pag.y + boxPad + 28 + row * axisRowH;

          ctx.font = `600 13px ${FONT_SANS}`;
          ctx.fillStyle = palette.textMain;
          ctx.textAlign = 'left';
          ctx.fillText(`${ax.leftLabel} (${100 - ax.value}%)`, axX, axY);
          ctx.textAlign = 'right';
          ctx.fillText(`${ax.rightLabel} (${ax.value}%)`, axX + colW, axY);
          ctx.textAlign = 'left';

          const barY = axY + 20;
          ctx.fillStyle = palette.mutedBg;
          ctx.fillRect(axX, barY, colW, 8);
          ctx.strokeStyle = palette.borderStrong;
          ctx.strokeRect(axX, barY, colW, 8);

          const markerX = axX + (colW - 10) * (ax.value / 100);
          ctx.fillStyle = palette.accent;
          ctx.fillRect(markerX, barY - 2, 10, 12);
        });

        pag.y += totalBoxH + 18;
      }
    }

    // ── SOCIAL & RELACIONES ─────────────────────────────────────────────────
    if (model.socialFields.length > 0 || model.relations.length > 0) {
      drawTwoColFieldGrid(pag, palette, model.socialFields, 'Contexto Social & Facciones');

      if (model.relations.length > 0) {
        const relCards: PdfMediaCardItem[] = model.relations.map((rel) => ({
          title: rel.name,
          badges: [rel.bondType, rel.status].filter(Boolean),
          details: [],
          body: rel.description,
        }));
        drawMediaCardsSection(pag, palette, imageMap, 'Matriz de Relaciones', relCards);
      }
    }

    // ── CREENCIAS & PRIORIDADES ─────────────────────────────────────────────
    drawTwoColFieldGrid(pag, palette, model.beliefsFields, 'Creencias, Valores & Origen');
    drawTwoColFieldGrid(pag, palette, model.prioritiesFields, 'Prioridades, Metas & Conflictos');

    // ── HABILIDADES & PODERES (CON IMÁGENES) ────────────────────────────────
    drawMediaCardsSection(
      pag,
      palette,
      imageMap,
      `Habilidades & Poderes (${model.skills.length})`,
      model.skills,
    );

    // ── ARSENAL, EQUIPO & INVENTARIO (CON IMÁGENES) ─────────────────────────
    if (model.weapons.length > 0 || model.gearFields.length > 0 || model.inventory.length > 0) {
      if (model.weapons.length > 0) {
        drawMediaCardsSection(pag, palette, imageMap, `Armamento & Arsenal (${model.weapons.length})`, model.weapons);
      }
      drawTwoColFieldGrid(
        pag,
        palette,
        model.gearFields,
        model.weapons.length === 0 ? 'Equipo, Extras & Notas' : 'Equipo, Notas & Perfil Adicional',
      );
      if (model.inventory.length > 0) {
        const invFields: PdfFieldItem[] = model.inventory.map((it) => ({
          label: [it.name, it.quantity ? `×${it.quantity}` : '', it.category].filter(Boolean).join(' · '),
          value: it.notes || 'Registrado en inventario',
        }));
        drawTwoColFieldGrid(pag, palette, invFields, 'Inventario');
      }
    }

    // ── POWER-SCALING ───────────────────────────────────────────────────────
    if (model.powerStats.length > 0 || model.powerDetails.length > 0 || model.powerFeats.length > 0) {
      if (model.powerStats.length > 0) {
        const cols = 3;
        const gap = 14;
        const tileW = (CONTENT_W - gap * (cols - 1)) / cols;
        const tileH = 74;
        const rowCount = Math.ceil(model.powerStats.length / cols);
        pag.drawSectionBanner('Power-Scaling & Métricas de Combate', '', tileH + 20);

        for (let r = 0; r < rowCount; r++) {
          pag.ensureSpace(tileH + gap);
          const ctx = pag.ctx;
          const ry = pag.y;
          for (let c = 0; c < cols; c++) {
            const stat = model.powerStats[r * cols + c];
            if (!stat) continue;
            const tx = PAD_X + c * (tileW + gap);
            ctx.fillStyle = palette.mutedBg;
            ctx.fillRect(tx, ry, tileW, tileH);
            ctx.strokeStyle = palette.borderStrong;
            ctx.strokeRect(tx, ry, tileW, tileH);

            ctx.font = `700 12px ${FONT_MONO}`;
            ctx.fillStyle = palette.accent;
            ctx.textBaseline = 'top';
            ctx.fillText(stat.label.toUpperCase(), tx + 14, ry + 12);

            ctx.font = `700 18px ${FONT_SANS}`;
            ctx.fillStyle = palette.textMain;
            const valLines = wrapTextLines((t) => ctx.measureText(t).width, stat.value, tileW - 28, 1);
            if (valLines[0]) {
              ctx.fillText(valLines[0], tx + 14, ry + 36);
            }
          }
          pag.y += tileH + gap;
        }
        pag.y += 8;
      }

      drawTwoColFieldGrid(pag, palette, model.powerDetails);

      if (model.powerFeats.length > 0) {
        const featFields: PdfFieldItem[] = model.powerFeats.map((ft) => ({
          label: ft.name,
          value: ft.description || ft.name,
        }));
        drawTwoColFieldGrid(pag, palette, featFields, 'Hazañas Registradas');
      }
    }

    // ── PESTAÑAS PERSONALIZADAS (CON SUS IMÁGENES) ──────────────────────────
    for (const cSec of model.customSections) {
      pag.drawSectionBanner(cSec.title, cSec.description || '', 110);

      if (cSec.stats.length > 0) {
        const statFields: PdfFieldItem[] = cSec.stats.map((st) => ({
          label: st.label,
          value: `${st.value} / ${st.max}`,
        }));
        drawTwoColFieldGrid(pag, palette, statFields);
      }

      drawTwoColFieldGrid(pag, palette, cSec.fields);

      if (cSec.images.length > 0) {
        const imgEntries = cSec.images.filter((im) => imageMap.has(im.url));
        if (imgEntries.length > 0) {
          const colGap = 24;
          const tileW = (CONTENT_W - colGap) / 2;
          const tileH = 290;
          for (let i = 0; i < imgEntries.length; i += 2) {
            pag.ensureSpace(tileH + 18);
            const pair = [imgEntries[i], imgEntries[i + 1]].filter(Boolean);
            const ctx = pag.ctx;
            const rowY = pag.y;
            pair.forEach((entry, colIdx) => {
              const tx = PAD_X + colIdx * (tileW + colGap);
              const imgObj = imageMap.get(entry.url);
              if (!imgObj) return;
              ctx.fillStyle = palette.cardBg;
              ctx.fillRect(tx, rowY, tileW, tileH);
              ctx.fillStyle = palette.mutedBg;
              ctx.fillRect(tx + 8, rowY + 8, tileW - 16, tileH - 52);
              drawContainedImage(ctx, imgObj, tx + 10, rowY + 10, tileW - 20, tileH - 56, entry.fit || 'contain');
              ctx.font = `600 15px ${FONT_SANS}`;
              ctx.fillStyle = palette.textMuted;
              ctx.textBaseline = 'top';
              ctx.fillText(entry.caption, tx + 14, rowY + tileH - 34);
              ctx.strokeStyle = palette.borderStrong;
              ctx.strokeRect(tx, rowY, tileW, tileH);
            });
            pag.y += tileH + 18;
          }
        }
      }
    }

    // ── GALERÍA VISUAL DE REFERENCIAS ───────────────────────────────────────
    drawGallerySection(pag, palette, imageMap, 'Galería e Imágenes de Referencia', model.gallery);

    pag.stampFooters();

    const previews: string[] = [];
    const jpegPages: Array<{ jpegBytes: Uint8Array; pixelWidth: number; pixelHeight: number }> = [];

    for (const pageCanvas of pag.pages) {
      const dataUrl = pageCanvas.toDataURL('image/jpeg', 0.92);
      previews.push(dataUrl);
      jpegPages.push({
        jpegBytes: base64DataUrlToBytes(dataUrl),
        pixelWidth: pageCanvas.width,
        pixelHeight: pageCanvas.height,
      });
    }

    return {
      model,
      previews,
      jpegPages,
      pageCount: pag.pages.length,
    };
  } finally {
    const cleanup = (imageMap as any)._cleanup;
    if (typeof cleanup === 'function') cleanup();
  }
}

export function base64DataUrlToBytes(dataUrl: string): Uint8Array {
  const commaIdx = dataUrl.indexOf(',');
  const base64 = commaIdx >= 0 ? dataUrl.slice(commaIdx + 1) : dataUrl;
  const bin = atob(base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) {
    bytes[i] = bin.charCodeAt(i);
  }
  return bytes;
}

/**
 * Empaqueta páginas JPEG en un documento PDF 1.4 binario válido en tamaño A4 (595.28 x 841.89 pt).
 * No requiere librerías externas y calcula offsets exactos de la tabla xref.
 */
export function encodeJpegPagesToPdf(
  pages: Array<{ jpegBytes: Uint8Array; pixelWidth: number; pixelHeight: number }>,
): Uint8Array {
  if (!pages || pages.length === 0) {
    throw new Error('No hay páginas renderizadas para exportar a PDF.');
  }

  const encoder = new TextEncoder();
  const chunks: Uint8Array[] = [];
  let cursor = 0;

  const pushBytes = (bytes: Uint8Array): void => {
    chunks.push(bytes);
    cursor += bytes.length;
  };
  const pushAscii = (text: string): void => {
    pushBytes(encoder.encode(text));
  };

  // Cabecera estándar PDF 1.4 + bytes binarios de comentario según especificación
  pushAscii('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');

  // Reservamos 1 (Catalog), 2 (Pages), luego por cada página 3 objetos: Page, ImageXObject, ContentStream
  const pageObjIds: number[] = [];
  for (let i = 0; i < pages.length; i++) {
    pageObjIds.push(3 + i * 3);
  }
  const totalObjects = 2 + pages.length * 3;
  const offsets: number[] = new Array(totalObjects + 1).fill(0);

  // 1 0 obj: Catalog
  offsets[1] = cursor;
  pushAscii('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');

  // 2 0 obj: Pages root
  offsets[2] = cursor;
  const kidsRefs = pageObjIds.map((id) => `${id} 0 R`).join(' ');
  pushAscii(`2 0 obj\n<< /Type /Pages /Kids [${kidsRefs}] /Count ${pages.length} >>\nendobj\n`);

  // Páginas A4 (595.28 x 841.89 pt)
  const pdfW = '595.28';
  const pdfH = '841.89';

  pages.forEach((pg, idx) => {
    const pageId = 3 + idx * 3;
    const imgId = pageId + 1;
    const contentId = pageId + 2;

    const drawCmd = `q\n${pdfW} 0 0 ${pdfH} 0 0 cm\n/Im0 Do\nQ\n`;
    const drawBytes = encoder.encode(drawCmd);

    // Page dictionary
    offsets[pageId] = cursor;
    pushAscii(
      `${pageId} 0 obj\n` +
        `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pdfW} ${pdfH}] ` +
        `/Resources << /XObject << /Im0 ${imgId} 0 R >> >> /Contents ${contentId} 0 R >>\n` +
        'endobj\n',
    );

    // Image XObject (DCTDecode JPEG)
    offsets[imgId] = cursor;
    pushAscii(
      `${imgId} 0 obj\n` +
        `<< /Type /XObject /Subtype /Image /Width ${pg.pixelWidth} /Height ${pg.pixelHeight} ` +
        `/ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${pg.jpegBytes.length} >>\n` +
        'stream\n',
    );
    pushBytes(pg.jpegBytes);
    pushAscii('\nendstream\nendobj\n');

    // Content stream
    offsets[contentId] = cursor;
    pushAscii(`${contentId} 0 obj\n<< /Length ${drawBytes.length} >>\nstream\n`);
    pushBytes(drawBytes);
    pushAscii('endstream\nendobj\n');
  });

  // Tabla xref exacta
  const xrefStart = cursor;
  pushAscii(`xref\n0 ${totalObjects + 1}\n`);
  pushAscii('0000000000 65535 f \n');
  for (let id = 1; id <= totalObjects; id++) {
    const padded = String(offsets[id]).padStart(10, '0');
    pushAscii(`${padded} 00000 n \n`);
  }

  pushAscii(
    `trailer\n<< /Size ${totalObjects + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`,
  );

  const out = new Uint8Array(cursor);
  let pos = 0;
  for (const chunk of chunks) {
    out.set(chunk, pos);
    pos += chunk.length;
  }
  return out;
}

/**
 * Genera el Blob PDF listo para descarga junto con previsualizaciones de páginas.
 */
export async function exportClassicCharacterPdfBlob(
  char: any,
  options: ExportPdfOptions = {},
): Promise<{
  blob: Blob;
  filename: string;
  pageCount: number;
  previews: string[];
}> {
  const { previews, jpegPages, pageCount } = await renderClassicPdfPages(char, options);
  const pdfBytes = encodeJpegPagesToPdf(jpegPages);
  const pdfBuffer = new ArrayBuffer(pdfBytes.byteLength);
  new Uint8Array(pdfBuffer).set(pdfBytes);
  const blob = new Blob([pdfBuffer], { type: 'application/pdf' });
  const filename = buildExportFilename(char, 'ficha', 'pdf');

  return {
    blob,
    filename,
    pageCount,
    previews,
  };
}

/**
 * Renderiza y descarga directamente el archivo PDF de la ficha.
 */
export async function downloadClassicCharacterPdf(
  char: any,
  options: ExportPdfOptions = {},
): Promise<{ filename: string; pageCount: number }> {
  const { blob, filename, pageCount } = await exportClassicCharacterPdfBlob(char, options);
  triggerBlobDownload(blob, filename);
  return { filename, pageCount };
}
