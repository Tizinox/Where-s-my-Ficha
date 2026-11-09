/**
 * store/characters/schema.js
 * Esquemas canónicos, valores iniciales, defaults y validaciones de estructura de personajes.
 */

import { ALL_TABS } from '../app.js';
import { ls } from '../../utils/storage.js';
import { sanitizeCharacterData } from '../../utils/textFormatterEngine.js';

// ── Lista predeterminada de 15 ejes de personalidad categorizados ──────────
export function getDefaultPersonalityAxes() {
  return [
    { id: crypto.randomUUID(), leftLabel: 'Introvertido', rightLabel: 'Extrovertido', value: 50, category: 'Social' },
    { id: crypto.randomUUID(), leftLabel: 'Racional / Lógico', rightLabel: 'Emocional / Pasional', value: 50, category: 'Intelectual' },
    { id: crypto.randomUUID(), leftLabel: 'Prudente / Cauteloso', rightLabel: 'Impulsivo / Temerario', value: 50, category: 'Conductual' },
    { id: crypto.randomUUID(), leftLabel: 'Empático / Altruista', rightLabel: 'Egoísta / Indiferente', value: 50, category: 'Moral' },
    { id: crypto.randomUUID(), leftLabel: 'Metódico / Disciplinado', rightLabel: 'Caótico / Inconstante', value: 50, category: 'Conductual' },
    { id: crypto.randomUUID(), leftLabel: 'Calmado / Paciente', rightLabel: 'Irascible / Hostil', value: 50, category: 'Emocional' },
    { id: crypto.randomUUID(), leftLabel: 'Honesto / Directo', rightLabel: 'Astuto / Manipulador', value: 50, category: 'Moral' },
    { id: crypto.randomUUID(), leftLabel: 'Idealista / Soñador', rightLabel: 'Cínico / Realista', value: 50, category: 'Intelectual' },
    { id: crypto.randomUUID(), leftLabel: 'Confiado / Abierto', rightLabel: 'Desconfiado / Paranoico', value: 50, category: 'Social' },
    { id: crypto.randomUUID(), leftLabel: 'Compasivo / Piadoso', rightLabel: 'Implacable / Sanguinario', value: 50, category: 'Moral' },
    // 5 nuevos ejes pedidos:
    { id: crypto.randomUUID(), leftLabel: 'Optimista / Esperanzado', rightLabel: 'Pesimista / Nihilista', value: 50, category: 'Emocional' },
    { id: crypto.randomUUID(), leftLabel: 'Sumiso / Conformista', rightLabel: 'Dominante / Rebelde', value: 50, category: 'Conductual' },
    { id: crypto.randomUUID(), leftLabel: 'Espiritual / Místico', rightLabel: 'Materialista / Empírico', value: 50, category: 'Intelectual' },
    { id: crypto.randomUUID(), leftLabel: 'Tradicionalista / Aferrado al pasado', rightLabel: 'Innovador / Enfocado en el futuro', value: 50, category: 'Intelectual' },
    { id: crypto.randomUUID(), leftLabel: 'Tolerante / Resiliente', rightLabel: 'Volátil / Explosivo', value: 50, category: 'Emocional' },
  ];
}

export function getDefaultStyle() {
  const parsed = ls.getJSON('superficha_default_style');
  if (parsed) {
    return {
      accentColor: parsed.accentColor || '#00F0FF',
      fontDisplay: parsed.fontDisplay || 'Barlow Condensed',
      fontBody: parsed.fontBody || 'Inter Tight',
      fontInput: parsed.fontInput || 'JetBrains Mono',
      fontHud: parsed.fontHud || 'Chakra Petch',
      density: parsed.density || 'normal',
      kitId: parsed.kitId || '',
    };
  }
  return {
    accentColor: '#00F0FF',
    fontDisplay: 'Barlow Condensed',
    fontBody: 'Inter Tight',
    fontInput: 'JetBrains Mono',
    fontHud: 'Chakra Petch',
    density: 'normal',
    kitId: '',
  };
}

export function getDefaultVisualSettings() {
  const defStyle = getDefaultStyle();
  return {
    accentColor: defStyle.accentColor || '#00F0FF',
    kitId: defStyle.kitId || '',
    fonts: {
      display: defStyle.fontDisplay || 'Barlow Condensed',
      body: defStyle.fontBody || 'Inter Tight',
      mono: defStyle.fontInput || 'JetBrains Mono',
      hud: defStyle.fontHud || 'Chakra Petch',
    },
    density: defStyle.density || 'normal',
    backgroundUrl: '',
    backgroundBlur: 0,
    backgroundOpacity: 50,
    backgroundZoom: 100,
    backgroundPosX: 50,
    backgroundPosY: 50,
    backgroundScrim: 20,
    backgroundMode: 'pattern',
  };
}

// ── Schema vacío canónico de un personaje ────────────────────────────────────
export function createEmptyCharacter(overrides = {}) {
  const defaultVisuals = getDefaultVisualSettings();

  return {
    id: crypto.randomUUID(),
    name: 'Nuevo Personaje',
    folderId: overrides.folderId || null,
    isFavorite: Boolean(overrides.isFavorite || overrides.favorite),
    isLocked: Boolean(overrides.isLocked || overrides.locked),
    createdAt: Date.now(),
    updatedAt: Date.now(),

    // Pestañas activas para este personaje (solo pestañas no opcionales por defecto)
    activeTabs: ALL_TABS.filter(t => !t.isOptional).map(t => t.id),
    customTabs: [],

    // Estilo y Tematización por Ficha (Schema Unificado + Retrocompatibilidad)
    visualSettings: { ...defaultVisuals, fonts: { ...defaultVisuals.fonts } },
    style: {
      accentColor: defaultVisuals.accentColor,
      fontDisplay: defaultVisuals.fonts.display,
      fontBody: defaultVisuals.fonts.body,
      fontInput: defaultVisuals.fonts.mono,
      fontHud: defaultVisuals.fonts.hud,
      density: defaultVisuals.density,
      kitId: defaultVisuals.kitId,
    },

    // Presentación y Fondos Dinámicos
    presentation: {
      background: {
        image: defaultVisuals.backgroundUrl,
        blur: defaultVisuals.backgroundBlur,
        opacity: defaultVisuals.backgroundOpacity,
        zoom: defaultVisuals.backgroundZoom,
        posX: defaultVisuals.backgroundPosX,
        posY: defaultVisuals.backgroundPosY,
        scrim: defaultVisuals.backgroundScrim,
        mode: defaultVisuals.backgroundMode,
      }
    },

    // Datos Básicos
    basics: {
      fullName: 'Nuevo Personaje',
      nickname: '',
      realAge: '',
      apparentAge: '',
      genderPronouns: '',
      race: '',
      orientation: '',
      role: '',
      alignment: 'Neutral Absoluto',
      quotes: [],
      showQuoteOnCard: true,
      avatarDataUrl: '',
      bannerDataUrl: '',
      iconDataUrl: '',
      avatarFrame: null,
      steamIcon: null,
      steamBadges: [],
      avatarShape: 'rounded',
      avatarRadius: 25,
      avatarAspect: 'square',
      useIconForPfp: false,
    },
    // Cuerpo
    body: {
      unitSystem: 'metric',
      height: '',
      weight: '',
      build: '',
      eyeColor: '',
      eyeColorHex: '#3b82f6',
      eyeColorLastApi: '',
      eyeColorIsCustom: false,
      hairColor: '',
      hairColorHex: '#1e293b',
      hairColorLastApi: '',
      hairColorIsCustom: false,
      skinColor: '',
      skinColorHex: '#d1d5db',
      skinColorLastApi: '',
      skinColorIsCustom: false,
      notableAccessories: '',
      bodyModifications: '',
      clothingStyle: '',
      physicalDescription: '',
      voice: '',
      postureBodyLanguage: '',
      scentAroma: '',
      facialExpression: '',
      speciesPhenotype: '',
      physicalCondition: '',
      presenceAura: '',
      distinctiveMarks: '',
    },
    // Mente
    mind: {
      personalitySummary: '',
      virtues: '',
      flaws: '',
      mbti: '',
      fobiasTraumas: '',
      defenseMechanisms: '',
      triggers: '',
      habitsCompulsions: '',
      sanityStatus: 'Estable',
      sanityNotes: '',
      sanityAnchor: '',
      axes: getDefaultPersonalityAxes(),
    },
    // Social
    social: {
      faction: '',
      reputation: '',
      originResidencia: '',
      titlesEpithets: '',
      socialMask: '',
      lifestyleStandard: '',
      communicationStyle: '',
      rumorsPublicView: '',
      debtsFavors: '',
      rivalsEnemies: '',
      dependents: '',
      relations: [],
      factions: [],
      languages: '',
      networkInfluence: '',
    },
    // Creencias
    beliefs: {
      moralCode: '',
      religion: '',
      loves: '',
      hates: '',
      redLine: '',
      worldview: '',
      superstitions: '',
      selfImage: '',
      biasesPrejudices: '',
      blindSpots: '',
      originEvent: '',
      authorityStance: '',
      statedVsActive: '',
    },
    // Prioridades
    priorities: {
      mainGoal: '',
      secondaryGoals: [],
      greatestFear: '',
      deepMotivation: '',
      currentConflict: '',
      maxLoyalty: '',
      sacrificeLine: '',
      wantVsNeed: '',
      timeHorizonUrgency: '',
      failureReaction: '',
      conflictHierarchy: '',
      victoryFantasy: '',
    },
    skills: [],
    weapons: [],
    // Power-Scaling
    powerScaling: {
      enabled: false,
      overallTier: '',
      overallTierCustom: '',
      tier: '',
      tierCustom: '',
      dc: '',
      dcCustom: '',
      strikingStrength: '',
      strikingStrengthCustom: '',
      durability: '',
      durabilityCustom: '',
      speed: '',
      speedCustom: '',
      speedTravel: '',
      speedTravelCustom: '',
      speedCombat: '',
      speedCombatCustom: '',
      speedReaction: '',
      speedReactionCustom: '',
      speedAttack: '',
      speedAttackCustom: '',
      liftingStrength: '',
      liftingStrengthCustom: '',
      range: '',
      rangeCustom: '',
      iq: '',
      iqCustom: '',
      biq: '',
      biqCustom: '',
      intelligence: '',
      intelligenceCustom: '',
      stamina: '',
      staminaCustom: '',
      resistancesList: [],
      resistancesInput: '',
      resistancesNotes: '',
      haxList: [],
      haxInput: '',
      standardEquipment: '',
      weaknesses: '',
      feats: [],
    },
    // Extras
    extras: {
      voiceActor: '',
      voiceUrl: '',
      curiosities: '',
      playlist: '',
      secondaryLikes: '',
      roleNotes: '',
      charClass: '',
      charClassCustomDesc: '',
      charClassIsCustom: false,
      class: '',
      fgcStyle: '',
      fgcStyleCustomDesc: '',
      fgcStyleIsCustom: false,
      conceptInspirations: '',
      narrativeRoleTropes: '',
      sentimentalItems: '',
      aestheticMoodboard: '',
      rpDynamicsShips: '',
      dialogueFormattingStyle: '',
      gallery: [],
      inventory: [],
    },
    ...overrides,
  };
}

export const TIER_ORDER_MAP = {
  'TIER 0': 0, '1-S': 0, 'BOUNDLESS': 0,
  'HIGH 1-A': 10, 'TIER 1-A': 20, '1-A': 20, 'LOW 1-A': 30,
  'HIGH 1-B': 40, 'TIER 1-B': 50, '1-B': 50,
  'HIGH 1-C': 60, 'TIER 1-C': 70, '1-C': 70, 'LOW 1-C': 80,
  'TIER 2-A': 90, '2-A': 90, 'TIER 2-B': 100, '2-B': 100, 'TIER 2-C': 110, '2-C': 110, 'LOW 2-C': 120,
  'HIGH 3-A': 130, 'TIER 3-A': 140, '3-A': 140, 'TIER 3-B': 150, '3-B': 150, 'TIER 3-C': 160, '3-C': 160,
  'TIER 4-A': 170, '4-A': 170, 'TIER 4-B': 180, '4-B': 180, 'HIGH 4-C': 190, 'TIER 4-C': 200, '4-C': 200, 'LOW 4-C': 210,
  'HIGH 5-A': 220, 'TIER 5-A': 230, '5-A': 230, 'TIER 5-B': 240, '5-B': 240, 'LOW 5-B': 250, 'TIER 5-C': 260, '5-C': 260,
  'HIGH 6-A': 270, 'TIER 6-A': 280, '6-A': 280, 'HIGH 6-B': 290, 'TIER 6-B': 300, '6-B': 300, 'LOW 6-B': 310,
  'HIGH 6-C': 320, 'TIER 6-C': 330, '6-C': 330, 'LOW 6-C': 340,
  'HIGH 7-A': 350, 'TIER 7-A': 360, '7-A': 360, 'TIER 7-B': 370, '7-B': 370, 'LOW 7-B': 380,
  'HIGH 7-C': 390, 'TIER 7-C': 400, '7-C': 400, 'LOW 7-C': 410,
  'TIER 8-A': 420, '8-A': 420, 'TIER 8-B': 430, '8-B': 430, 'HIGH 8-C': 440, 'TIER 8-C': 450, '8-C': 450,
  'TIER 9-A': 460, '9-A': 460, 'TIER 9-B': 470, '9-B': 470, 'TIER 9-C': 480, '9-C': 480,
  'TIER 10-A': 490, '10-A': 490, 'TIER 10-B': 500, '10-B': 500, 'TIER 10-C': 510, '10-C': 510,
  'TIER 11-A': 520, '11-A': 520, 'TIER 11-B': 530, '11-B': 530, 'TIER 11-C': 540, '11-C': 540,
};

export function getTierRank(tier) {
  if (!tier || typeof tier !== 'string') return 999;
  const t = tier.toUpperCase().trim();
  for (const [key, rank] of Object.entries(TIER_ORDER_MAP)) {
    if (t === key || t.startsWith(key)) return rank;
  }
  const match = t.match(/TIER\s*(\d+)(?:-([A-C]))?/i);
  if (match) {
    const num = parseInt(match[1], 10);
    const letter = match[2] || 'A';
    const letterOffset = letter === 'A' ? 0 : letter === 'B' ? 1 : 2;
    return num * 10 + letterOffset;
  }
  return 900;
}

/**
 * Normaliza y garantiza la estructura de datos completa para un personaje (backward-compatibility).
 */
export function ensureCharacterDefaults(char) {
  const empty = createEmptyCharacter();
  const body = { ...empty.body, ...(char.body || {}) };
  const mind = { ...empty.mind, ...(char.mind || {}) };
  if (!Array.isArray(mind.axes)) {
    mind.axes = getDefaultPersonalityAxes();
  }
  const social = { ...empty.social, ...(char.social || {}) };
  if (!Array.isArray(social.relations)) social.relations = [];
  social.relations = social.relations.map(r => ({
    id: r.id || crypto.randomUUID(),
    name: r.name || '',
    bondType: r.bondType || r.bond || 'Aliado',
    status: r.status || '',
    description: r.description || '',
  }));
  if (!Array.isArray(social.factions)) social.factions = [];
  social.factions = social.factions.map(f => ({
    id: f.id || crypto.randomUUID(),
    name: f.name || '',
    affinity: f.affinity || 'Neutral',
  }));

  // Limpieza y traducción automática de marcos de Steam
  if (char.basics?.avatarFrame) {
    if ((char.basics.avatarFrame.name || '').toLowerCase() === 'frame of reference') {
      char.basics.avatarFrame.name = 'Marco de Referencia';
    }
    if ((char.basics.avatarFrame.game || '').toLowerCase() === 'if_animated_frame' || (char.basics.avatarFrame.name || '').toLowerCase() === 'marco de referencia') {
      char.basics.avatarFrame.game = 'Idea Fix';
    }
  }

  const powerScaling = { ...empty.powerScaling, ...(char.powerScaling || {}) };
  if (!Array.isArray(powerScaling.haxList)) powerScaling.haxList = [];
  if (!Array.isArray(powerScaling.resistancesList)) powerScaling.resistancesList = [];
  if (!Array.isArray(powerScaling.feats)) powerScaling.feats = [];
  // Sincronización de compatibilidad heredada
  if (!powerScaling.overallTier && powerScaling.tier) {
    powerScaling.overallTier = powerScaling.tier;
  }
  if (!powerScaling.iq && powerScaling.intelligence) {
    powerScaling.iq = powerScaling.intelligence;
  }
  powerScaling.feats = powerScaling.feats.map(f => ({
    id: f.id || crypto.randomUUID(),
    title: f.title || '',
    targetStat: f.targetStat || '',
    tier: f.tier || '',
    auditState: f.auditState || 'consistent',
    context: f.context || '',
    link: f.link || '',
  }));

  const extras = { ...empty.extras, ...(char.extras || {}) };
  if (!Array.isArray(extras.gallery)) extras.gallery = [];
  if (!Array.isArray(extras.inventory)) extras.inventory = [];

  const defaultVisuals = getDefaultVisualSettings();
  const styleObj = char.style || {};
  const bgObj = (char.presentation && char.presentation.background) || {};
  const charVS = char.visualSettings || {};
  const charFonts = charVS.fonts || {};

  const visualSettings = {
    accentColor: charVS.accentColor || styleObj.accentColor || defaultVisuals.accentColor,
    kitId: charVS.kitId || styleObj.kitId || defaultVisuals.kitId,
    fonts: {
      display: charFonts.display || styleObj.fontDisplay || defaultVisuals.fonts.display,
      body: charFonts.body || styleObj.fontBody || defaultVisuals.fonts.body,
      mono: charFonts.mono || styleObj.fontInput || defaultVisuals.fonts.mono,
      hud: charFonts.hud || styleObj.fontHud || defaultVisuals.fonts.hud,
    },
    density: charVS.density || styleObj.density || defaultVisuals.density,
    backgroundUrl: charVS.backgroundUrl ?? bgObj.image ?? defaultVisuals.backgroundUrl,
    backgroundBlur: charVS.backgroundBlur ?? bgObj.blur ?? defaultVisuals.backgroundBlur,
    backgroundOpacity: charVS.backgroundOpacity ?? bgObj.opacity ?? defaultVisuals.backgroundOpacity,
    backgroundZoom: charVS.backgroundZoom ?? bgObj.zoom ?? defaultVisuals.backgroundZoom,
    backgroundPosX: charVS.backgroundPosX ?? bgObj.posX ?? defaultVisuals.backgroundPosX,
    backgroundPosY: charVS.backgroundPosY ?? bgObj.posY ?? defaultVisuals.backgroundPosY,
    backgroundScrim: charVS.backgroundScrim ?? bgObj.scrim ?? defaultVisuals.backgroundScrim,
    backgroundMode: charVS.backgroundMode ?? bgObj.mode ?? ((charVS.backgroundUrl || bgObj.image) ? 'custom' : 'pattern'),
  };

  const style = {
    accentColor: visualSettings.accentColor,
    kitId: visualSettings.kitId,
    fontDisplay: visualSettings.fonts.display,
    fontBody: visualSettings.fonts.body,
    fontInput: visualSettings.fonts.mono,
    fontHud: visualSettings.fonts.hud,
    density: visualSettings.density,
  };

  const presentation = {
    background: {
      image: visualSettings.backgroundUrl,
      blur: visualSettings.backgroundBlur,
      opacity: visualSettings.backgroundOpacity,
      zoom: visualSettings.backgroundZoom,
      posX: visualSettings.backgroundPosX,
      posY: visualSettings.backgroundPosY,
      scrim: visualSettings.backgroundScrim,
      mode: visualSettings.backgroundMode,
    }
  };

  const customTabs = Array.isArray(char.customTabs) ? char.customTabs.map(ct => ({
    id: ct.id || `custom_${crypto.randomUUID().slice(0, 8)}`,
    label: ct.label || 'Nueva Sección',
    icon: ct.icon || 'layers',
    description: ct.description || '',
    accentColor: ct.accentColor || '',
    blocks: Array.isArray(ct.blocks) ? ct.blocks : []
  })) : [];

  const defaultTabIds = ALL_TABS.filter(t => !t.isOptional).map(t => t.id);
  const allTabIds = [...ALL_TABS.map(t => t.id), ...customTabs.map(t => t.id)];
  let activeTabs = Array.isArray(char.activeTabs) && char.activeTabs.length > 0
    ? char.activeTabs.filter(id => allTabIds.includes(id))
    : [...defaultTabIds, ...customTabs.map(t => t.id)];
  if (activeTabs.length === 0) activeTabs = [...defaultTabIds];

  const basics = { ...empty.basics, ...(char.basics || {}) };
  const beliefs = { ...empty.beliefs, ...(char.beliefs || {}) };
  const priorities = { ...empty.priorities, ...(char.priorities || {}) };

  // Migración y unificación de campos duplicados (Retrocompatibilidad total)
  // 1. Títulos y Epítetos unificados en basics.nickname
  if (social.titlesEpithets) {
    if (!basics.nickname) {
      basics.nickname = social.titlesEpithets;
    } else if (!basics.nickname.includes(social.titlesEpithets)) {
      basics.nickname = `${basics.nickname} / ${social.titlesEpithets}`;
    }
  }

  // 2. Anclaje de cordura trasladado de prioridades a mente
  if (priorities.sanityAnchor && !mind.sanityAnchor) {
    mind.sanityAnchor = priorities.sanityAnchor;
  }

  // 3. Precio inaceptable unificado en beliefs.redLine
  if (priorities.unacceptablePrice) {
    if (!beliefs.redLine) {
      beliefs.redLine = priorities.unacceptablePrice;
    } else if (!beliefs.redLine.includes(priorities.unacceptablePrice)) {
      beliefs.redLine = `${beliefs.redLine} | ${priorities.unacceptablePrice}`;
    }
  }

  const finalChar = {
    ...char,
    folderId: char.folderId || null,
    isFavorite: Boolean(char.isFavorite || char.favorite),
    isLocked: Boolean(char.isLocked || char.locked),
    activeTabs,
    customTabs,
    visualSettings,
    style,
    presentation,
    basics,
    body,
    mind,
    social,
    beliefs,
    priorities,
    skills: Array.isArray(char.skills) ? char.skills.map(s => ({
      id: s.id || crypto.randomUUID(),
      type: s.type === 'passive' ? 'passive' : 'active',
      title: s.title || '',
      summary: s.summary || s.shortSummary || '',
      effect: s.effect || '',
      td: s.td || '',
      cd: s.cd || '',
      cost: s.cost || '',
      condicion: s.condicion || '',
      tier: s.tier || s.rank || s.skillRank || '',
      range: s.range || '',
      elementType: s.elementType || '',
      drawback: s.drawback || '',
      tags: Array.isArray(s.tags) ? s.tags : (typeof s.tags === 'string' && s.tags.trim() ? s.tags.split(',').map(t => t.trim()).filter(Boolean) : []),
      imageDataUrl: s.imageDataUrl || '',
      imageIsGif: Boolean(s.imageIsGif),
      imageFit: s.imageFit || 'contain',
      imageTransform: s.imageTransform || ''
    })) : [],
    weapons: Array.isArray(char.weapons) ? char.weapons.map(w => ({
      id: w.id || crypto.randomUUID(),
      name: w.name || '',
      category: w.category || '',
      rarity: w.rarity || 'Común',
      description: w.description || '',
      handling: w.handling || '',
      reach: w.reach || '',
      drawback: w.drawback || '',
      materials: w.materials || '',
      origin: w.origin || '',
      durability: w.durability || '',
      abilities: w.abilities || '',
      imageDataUrl: w.imageDataUrl || '',
      imageIsGif: Boolean(w.imageIsGif),
      imageFit: w.imageFit || 'contain',
      imageTransform: w.imageTransform || '',
      imageOrientation: w.imageOrientation || 'horizontal'
    })) : [],
    powerScaling,
    extras,
  };

  // Purgar preventivamente cualquier token residual de versiones anteriores
  sanitizeCharacterData(finalChar);

  return finalChar;
}
