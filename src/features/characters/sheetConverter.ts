/**
 * @file src/features/characters/sheetConverter.ts
 * Conversor bidireccional sin pérdida entre Ficha A (Simple · `unified`) y
 * Ficha B (Compleja · `classic`). Preserva el 100 % de los campos, pestañas,
 * medios e historial mientras normaliza campos compartidos entre ambos formatos.
 */

import { ensureCharacterDefaults } from './schema.js';

export type SheetType = 'unified' | 'classic';

export interface SheetTypeMeta {
  id: SheetType;
  code: 'Ficha A' | 'Ficha B';
  name: string;
  shortLabel: string;
  layoutHint: string;
  description: string;
}

export interface PreservedSectionInfo {
  key: string;
  label: string;
  detail: string;
}

export interface SheetConversionSummary {
  charId: string;
  charName: string;
  sourceType: SheetType;
  targetType: SheetType;
  skillsCount: number;
  weaponsCount: number;
  quotesCount: number;
  galleryCount: number;
  customTabsCount: number;
  preservedSections: PreservedSectionInfo[];
  syncNotes: string[];
}

export const SHEET_TYPE_META: Record<SheetType, SheetTypeMeta> = {
  unified: {
    id: 'unified',
    code: 'Ficha A',
    name: 'Ficha A · Simple',
    shortLabel: 'Ficha A · Simple',
    layoutHint: 'Unificada en 3 columnas',
    description:
      'Vista directa de una sola página en 3 columnas centrada en atributos clave, poderes, equipo y trasfondo. Ideal para lectura rápida y exportación en imagen.',
  },
  classic: {
    id: 'classic',
    code: 'Ficha B',
    name: 'Ficha B · Compleja',
    shortLabel: 'Ficha B · Compleja',
    layoutHint: 'Sidebar + 12 pestañas modulares',
    description:
      'Vista modular completa con psicología, ejes de personalidad, relaciones, facciones, creencias, habilidades detalladas, arsenal y power-scaling avanzado.',
  },
};

const POWER_SCALING_TEXT_KEYS = [
  'tier',
  'tierCustom',
  'overallTier',
  'overallTierCustom',
  'ap',
  'dc',
  'dcCustom',
  'strikingStrength',
  'strikingStrengthCustom',
  'durability',
  'durabilityCustom',
  'speed',
  'speedCustom',
  'speedTravel',
  'speedTravelCustom',
  'speedCombat',
  'speedCombatCustom',
  'speedReaction',
  'speedReactionCustom',
  'speedAttack',
  'speedAttackCustom',
  'liftingStrength',
  'liftingStrengthCustom',
  'range',
  'rangeCustom',
  'iq',
  'iqCustom',
  'biq',
  'biqCustom',
  'intelligence',
  'intelligenceCustom',
  'stamina',
  'staminaCustom',
  'resistancesNotes',
  'standardEquipment',
  'weaknesses',
] as const;

function hasText(value: unknown): boolean {
  return typeof value === 'string' ? value.trim().length > 0 : Boolean(value);
}

function countPopulatedKeys(obj: Record<string, unknown> | undefined, keys: readonly string[]): number {
  if (!obj || typeof obj !== 'object') return 0;
  return keys.reduce((acc, key) => (hasText(obj[key]) ? acc + 1 : acc), 0);
}

function deepClonePlain<T>(input: T): T {
  return JSON.parse(JSON.stringify(input ?? {}));
}

export function normalizeSheetType(rawType: unknown): SheetType {
  const normalized = String(rawType ?? '').trim().toLowerCase();
  if (normalized === 'classic' || normalized === 'b' || normalized === 'ficha b' || normalized === 'compleja') {
    return 'classic';
  }
  return 'unified';
}

export function getOppositeSheetType(currentType: unknown): SheetType {
  return normalizeSheetType(currentType) === 'classic' ? 'unified' : 'classic';
}

export function normalizeSkillType(rawType: unknown): 'active' | 'passive' {
  const normalized = String(rawType ?? '').trim().toLowerCase();
  return normalized === 'passive' || normalized === 'pasiva' ? 'passive' : 'active';
}

export function hasPowerScalingData(ps: Record<string, any> | undefined | null): boolean {
  if (!ps || typeof ps !== 'object') return false;
  if (countPopulatedKeys(ps, POWER_SCALING_TEXT_KEYS) > 0) return true;
  if (Array.isArray(ps.resistancesList) && ps.resistancesList.length > 0) return true;
  if (Array.isArray(ps.haxList) && ps.haxList.length > 0) return true;
  if (Array.isArray(ps.feats) && ps.feats.length > 0) return true;
  return false;
}

/**
 * Analiza la ficha antes de convertir para informar al usuario sin alterar nada:
 * muestra exactamente qué contenido tiene el personaje y qué sincronizaciones
 * automáticas garantizan que no se pierda ningún detalle.
 */
export function getSheetConversionSummary(
  char: Record<string, any> | null | undefined,
  explicitTargetType?: SheetType,
): SheetConversionSummary {
  const safeChar = char || {};
  const sourceType = normalizeSheetType(safeChar.sheetType);
  const targetType = explicitTargetType ? normalizeSheetType(explicitTargetType) : getOppositeSheetType(sourceType);

  const skills = Array.isArray(safeChar.skills) ? safeChar.skills : [];
  const weapons = Array.isArray(safeChar.weapons) ? safeChar.weapons : [];
  const quotes = Array.isArray(safeChar.basics?.quotes) ? safeChar.basics.quotes : [];
  const gallery = Array.isArray(safeChar.extras?.gallery) ? safeChar.extras.gallery : [];
  const customTabs = Array.isArray(safeChar.customTabs) ? safeChar.customTabs : [];

  const preservedSections: PreservedSectionInfo[] = [];

  const bodyExtendedCount = countPopulatedKeys(safeChar.body, [
    'age', 'apparentAge', 'skinTone', 'voice', 'posture', 'scars', 'tattoos',
    'clothingStyle', 'accessories', 'physicalDescription', 'healthStatus', 'distinctiveMarks',
  ]);
  if (bodyExtendedCount > 0) {
    preservedSections.push({
      key: 'body',
      label: 'Cuerpo y Apariencia',
      detail: `${bodyExtendedCount} campo${bodyExtendedCount === 1 ? '' : 's'} adicionales`,
    });
  }

  const mindExtendedCount = countPopulatedKeys(safeChar.mind, [
    'mbti', 'fobiasTraumas', 'defenseMechanisms', 'triggers', 'habitsCompulsions', 'sanityNotes', 'sanityAnchor',
  ]);
  const nonNeutralAxes = Array.isArray(safeChar.mind?.axes)
    ? safeChar.mind.axes.filter((axis: any) => typeof axis?.value === 'number' && axis.value !== 50).length
    : 0;
  if (mindExtendedCount > 0 || nonNeutralAxes > 0) {
    preservedSections.push({
      key: 'mind',
      label: 'Mente y Ejes Psicológicos',
      detail: `${mindExtendedCount} campos · ${nonNeutralAxes} ejes ajustados`,
    });
  }

  const relationsCount = Array.isArray(safeChar.social?.relations) ? safeChar.social.relations.length : 0;
  const factionsCount = Array.isArray(safeChar.social?.factions) ? safeChar.social.factions.length : 0;
  const socialTextCount = countPopulatedKeys(safeChar.social, [
    'faction', 'reputation', 'originResidencia', 'titlesEpithets', 'socialMask',
    'lifestyleStandard', 'communicationStyle', 'rumorsPublicView', 'debtsFavors',
    'rivalsEnemies', 'dependents', 'languages', 'networkInfluence',
  ]);
  if (relationsCount > 0 || factionsCount > 0 || socialTextCount > 0) {
    preservedSections.push({
      key: 'social',
      label: 'Red Social y Facciones',
      detail: `${relationsCount} relaciones · ${factionsCount} facciones`,
    });
  }

  const beliefsExtendedCount = countPopulatedKeys(safeChar.beliefs, [
    'moralCode', 'religion', 'loves', 'hates', 'redLine', 'worldview',
    'superstitions', 'selfImage', 'biasesPrejudices', 'blindSpots', 'authorityStance', 'statedVsActive',
  ]);
  if (beliefsExtendedCount > 0) {
    preservedSections.push({
      key: 'beliefs',
      label: 'Creencias y Código Moral',
      detail: `${beliefsExtendedCount} campo${beliefsExtendedCount === 1 ? '' : 's'} de filosofía`,
    });
  }

  const prioritiesCount =
    countPopulatedKeys(safeChar.priorities, [
      'mainGoal', 'greatestFear', 'deepMotivation', 'currentConflict', 'maxLoyalty',
      'sacrificeLine', 'wantVsNeed', 'timeHorizonUrgency', 'failureReaction', 'conflictHierarchy', 'victoryFantasy',
    ]) + (Array.isArray(safeChar.priorities?.secondaryGoals) ? safeChar.priorities.secondaryGoals.length : 0);
  if (prioritiesCount > 0) {
    preservedSections.push({
      key: 'priorities',
      label: 'Prioridades y Metas',
      detail: `${prioritiesCount} metas / motivaciones`,
    });
  }

  const psHax = Array.isArray(safeChar.powerScaling?.haxList) ? safeChar.powerScaling.haxList.length : 0;
  const psRes = Array.isArray(safeChar.powerScaling?.resistancesList) ? safeChar.powerScaling.resistancesList.length : 0;
  const psFeats = Array.isArray(safeChar.powerScaling?.feats) ? safeChar.powerScaling.feats.length : 0;
  const psAdvancedCount = countPopulatedKeys(safeChar.powerScaling, [
    'overallTier', 'dc', 'liftingStrength', 'iq', 'biq', 'speedTravel', 'speedCombat',
    'speedReaction', 'speedAttack', 'standardEquipment', 'weaknesses', 'resistancesNotes',
  ]);
  if (psHax > 0 || psRes > 0 || psFeats > 0 || psAdvancedCount > 0) {
    preservedSections.push({
      key: 'powerScaling',
      label: 'Power-Scaling Detallado',
      detail: `${psFeats} hazañas · ${psHax} hax · ${psRes} resistencias`,
    });
  }

  if (customTabs.length > 0 || gallery.length > 0) {
    preservedSections.push({
      key: 'extras',
      label: 'Galería y Pestañas Custom',
      detail: `${gallery.length} imágenes · ${customTabs.length} pestañas propias`,
    });
  }

  const syncNotes: string[] = [];
  if (targetType === 'classic') {
    syncNotes.push('Se desbloquean las 12 pestañas modulares conservando todos los datos cargados en la Ficha A.');
    if (skills.some((s: any) => !['active', 'passive'].includes(String(s?.type || '').toLowerCase()))) {
      syncNotes.push('Las habilidades rápidas se normalizan a Activa/Pasiva para los filtros de Ficha B.');
    }
    if (hasPowerScalingData(safeChar.powerScaling) && !safeChar.powerScaling?.enabled) {
      syncNotes.push('Power-Scaling se activa automáticamente para que tus atributos sigan visibles en Ficha B.');
    }
  } else {
    syncNotes.push('Se adapta la vista a Ficha A (3 columnas) para edición y lectura rápida.');
    syncNotes.push('Ningún campo de Cuerpo, Mente, Social, Creencias, Prioridades o Power-Scaling se borra: quedan guardados si decides volver a Ficha B.');
  }

  return {
    charId: safeChar.id || '',
    charName: safeChar.basics?.fullName || safeChar.name || 'Sin Nombre',
    sourceType,
    targetType,
    skillsCount: skills.length,
    weaponsCount: weapons.length,
    quotesCount: quotes.length,
    galleryCount: gallery.length,
    customTabsCount: customTabs.length,
    preservedSections,
    syncNotes,
  };
}

/**
 * Devuelve una copia normalizada del personaje convertida al formato `targetType`
 * preservando absolutamente todos los campos, submodelos, imágenes y configuraciones.
 */
export function convertCharacterSheetData<T extends Record<string, any>>(
  char: T,
  targetType: SheetType,
): Record<string, any> {
  const normalizedTarget = normalizeSheetType(targetType);
  const draft: Record<string, any> = deepClonePlain(char);

  // Conservar compatibilidad si alguna habilidad rápida usaba `name` en lugar de `title`
  if (Array.isArray(draft.skills)) {
    draft.skills = draft.skills.map((skill: any) => ({
      ...skill,
      title: skill?.title || skill?.name || '',
      type: normalizeSkillType(skill?.type),
    }));
  }

  // Sincronizar nombre principal <-> basics.fullName sin pisar valores existentes
  const draftName = typeof draft.name === 'string' ? draft.name.trim() : '';
  const draftFullName = typeof draft.basics?.fullName === 'string' ? draft.basics.fullName.trim() : '';
  if (!draft.basics || typeof draft.basics !== 'object') {
    draft.basics = {};
  }
  if (draftFullName && (!draftName || draftName === 'Nuevo Personaje')) {
    draft.name = draftFullName;
  } else if (draftName && draftName !== 'Nuevo Personaje' && !draftFullName) {
    draft.basics.fullName = draftName;
  }

  // Activar Power-Scaling automáticamente al pasar a Ficha B si hay stats ya cargados en Ficha A
  if (normalizedTarget === 'classic' && hasPowerScalingData(draft.powerScaling)) {
    draft.powerScaling = {
      ...(draft.powerScaling || {}),
      enabled: true,
    };
  }

  draft.sheetType = normalizedTarget;
  draft.updatedAt = Date.now();

  const normalizedChar: Record<string, any> = ensureCharacterDefaults(draft);
  normalizedChar.sheetType = normalizedTarget;

  // Asegurar que al convertir a Ficha B estén habilitadas las pestañas que tienen datos
  if (normalizedTarget === 'classic') {
    const activeSet = new Set<string>(Array.isArray(normalizedChar.activeTabs) ? normalizedChar.activeTabs : []);
    if (hasPowerScalingData(normalizedChar.powerScaling)) activeSet.add('power');
    if (normalizedChar.skills?.length) activeSet.add('skills');
    if (normalizedChar.weapons?.length) activeSet.add('weapons');
    if (
      normalizedChar.basics?.avatarFrame ||
      normalizedChar.basics?.animatedAvatar ||
      (Array.isArray(normalizedChar.basics?.steamBadges) && normalizedChar.basics.steamBadges.length > 0)
    ) {
      activeSet.add('steam');
    }
    for (const ct of normalizedChar.customTabs || []) {
      if (ct?.id) activeSet.add(ct.id);
    }
    normalizedChar.activeTabs = Array.from(activeSet);
  }

  return normalizedChar;
}
