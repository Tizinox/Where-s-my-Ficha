/**
 * utils/powerScalingRandomizer.js
 * Generador ponderado y coherente para la matriz de Power-Scaling.
 * 
 * Implementa probabilidades realistas (curva estratificada de rareza)
 * para evitar que al randomizar siempre se generen deidades (High 1-A, Tier 0, etc.)
 * y haciendo que las categorías cósmicas y trascendentes sean verdaderos
 * logros difíciles de conseguir.
 */

export const POWER_RARITIES = [
  {
    id: 'common',
    label: 'Terrenal / Humano',
    badge: 'Común',
    chancePercent: 45,
    cumulativeChance: 0.45,
    color: '#94a3b8',
    glowColor: 'rgba(148, 163, 184, 0.7)',
    minTierIndex: 0,  // Tier 11-C
    maxTierIndex: 12, // Tier 8-A (Multi-Manzanas)
    normalizedMin: 0.0,
    normalizedMax: 0.22,
    tierRangeLabel: 'Tier 11-C a Tier 8-A',
    description: 'Capacidad humana, atletas, combatientes marciales y nivel callejero / muro / edificio.',
    brackets: {
      dc: [0, 4],            // Human Level a City Block Level
      striking: [0, 2],      // Class H a Class MJ
      durability: [0, 3],    // Human Level a Building Level
      speed: [0, 5],         // Below Average Human a Subsonic
      lifting: [0, 5],       // Below Average a Class 1
      range: [0, 3]          // Standard Melee a Hundreds of Meters
    }
  },
  {
    id: 'uncommon',
    label: 'Urbano y Geográfico',
    badge: 'Poco Común',
    chancePercent: 30,
    cumulativeChance: 0.75,
    color: '#10b981',
    glowColor: 'rgba(16, 185, 129, 0.7)',
    minTierIndex: 13, // Low 7-C (Pueblo Pequeño)
    maxTierIndex: 27, // High 6-A (Multi-Continente)
    normalizedMin: 0.24,
    normalizedMax: 0.50,
    tierRangeLabel: 'Low 7-C a High 6-A',
    description: 'Poder para arrasar aldeas, metrópolis, cordilleras, archipiélagos y continentes.',
    brackets: {
      dc: [5, 10],           // Town Level a Continent Level
      striking: [3, 6],      // Class GJ a Class EJ
      durability: [4, 8],    // City Level a Continent Level
      speed: [5, 13],        // Subsonic a Massively Hypersonic
      lifting: [5, 13],      // Class 1 a Class M
      range: [3, 7]          // Hundreds of Meters a Planetary
    }
  },
  {
    id: 'rare',
    label: 'Planetario y Estelar',
    badge: 'Raro',
    chancePercent: 15,
    cumulativeChance: 0.90,
    color: '#00f0ff',
    glowColor: 'rgba(0, 240, 255, 0.7)',
    minTierIndex: 28, // Tier 5-C (Luna)
    maxTierIndex: 38, // Tier 4-A (Multi-Sistema Solar)
    normalizedMin: 0.52,
    normalizedMax: 0.70,
    tierRangeLabel: 'Tier 5-C a Tier 4-A',
    description: 'Capacidad para fragmentar lunas, planetas terrestres, supernovas y sistemas solares.',
    brackets: {
      dc: [11, 14],          // Moon Level a Solar System Level
      striking: [7, 9],      // Class ZJ a Stellar Class
      durability: [9, 11],   // Planet Level a Solar System Level
      speed: [14, 21],       // Massively Hypersonic+ a FTL+
      lifting: [14, 19],     // Class T a Class Y
      range: [7, 10]         // Planetary a Galactic
    }
  },
  {
    id: 'epic',
    label: 'Cósmico y Multiversal',
    badge: 'Épico',
    chancePercent: 6.5,
    cumulativeChance: 0.965,
    color: '#a855f7',
    glowColor: 'rgba(168, 85, 247, 0.8)',
    minTierIndex: 39, // Tier 3-C (Galaxia)
    maxTierIndex: 46, // Tier 2-A (Multiverso+ 4D)
    normalizedMin: 0.72,
    normalizedMax: 0.85,
    tierRangeLabel: 'Tier 3-C a Tier 2-A',
    description: 'Señores cósmicos, destructores de galaxias, universos y continuos espacio-temporales 4D.',
    brackets: {
      dc: [15, 17],          // Galaxy Level a Multiversal Level (4D)
      striking: [10, 12],    // Galactic Class a Multiversal Class
      durability: [12, 14],  // Galaxy Level a Multiversal Level
      speed: [21, 24],       // FTL+ a Infinite Speed
      lifting: [19, 23],     // Pre-Stellar a Universal
      range: [10, 13]        // Galactic a Multiversal
    }
  },
  {
    id: 'legendary',
    label: 'Hiperversal',
    badge: 'Legendario',
    chancePercent: 2.5,
    cumulativeChance: 0.99,
    color: '#f59e0b',
    glowColor: 'rgba(245, 158, 11, 0.9)',
    minTierIndex: 47, // Low 1-C (5D-6D)
    maxTierIndex: 50, // High 1-B (Aleph-0)
    normalizedMin: 0.87,
    normalizedMax: 0.93,
    tierRangeLabel: 'Low 1-C a High 1-B',
    description: 'Entidades que operan en dimensiones superiores complejas (5D a infinitas dimensiones).',
    brackets: {
      dc: [17, 18],          // Multiversal Level a Hyperversal Level (5D+)
      striking: [12, 13],    // Multiversal Class a Hyperversal Class
      durability: [14, 15],  // Multiversal Level a Hyperversal Level
      speed: [24, 25],       // Infinite Speed a Immeasurable
      lifting: [23, 24],     // Universal a Infinite
      range: [13, 15]        // Multiversal a Hyperversal
    }
  },
  {
    id: 'mythic',
    label: 'Dios Trascendente',
    badge: 'Mítico',
    chancePercent: 1.0, // 1% de tiradas globales
    cumulativeChance: 1.0,
    color: '#ef4444',
    glowColor: 'rgba(239, 68, 68, 0.95)',
    minTierIndex: 51, // Low 1-A (Bajo Outerverso)
    maxTierIndex: 54, // Tier 0 (Boundless / Extraversal)
    normalizedMin: 0.95,
    normalizedMax: 1.0,
    tierRangeLabel: 'Low 1-A a Tier 0 / Boundless',
    description: 'Trascendencia absoluta sobre conceptos dimensionales, leyes de la física y jerarquías infinitas.',
    brackets: {
      dc: [19, 20],          // Outerversal Level a Extraversal Level
      striking: [14, 14],    // Outerversal Class
      durability: [16, 17],  // Outerversal Level a True Invulnerability
      speed: [25, 27],       // Immeasurable a Omnipresent
      lifting: [24, 25],     // Infinite a Irrelevant
      range: [16, 17]        // Outerversal a Irrelevant
    }
  }
];

/**
 * Determina el rango de rareza según un valor de Tier (ej: 'High 1-A', 'Tier 7-B', 'Tier 10-A')
 * @param {string} tierValue 
 * @param {Array} tierOptionsList 
 * @returns {Object}
 */
export function getTierRarity(tierValue, tierOptionsList = []) {
  if (!tierValue) return POWER_RARITIES[0];
  let idx = -1;
  if (Array.isArray(tierOptionsList) && tierOptionsList.length > 0) {
    idx = tierOptionsList.findIndex(opt => opt.value === tierValue);
  }
  
  if (idx < 0) {
    // Estimación por patrones textuales canónicos
    const clean = String(tierValue).toLowerCase();
    if (clean.includes('tier 0') || clean.includes('extraversal') || clean.includes('boundless') || clean.includes('high 1-a') || clean.includes('tier 1-a') || clean.includes('low 1-a')) {
      return POWER_RARITIES[5]; // mythic
    }
    if (clean.includes('1-b') || clean.includes('1-c') || clean.includes('hiperverso') || clean.includes('hypervers')) {
      return POWER_RARITIES[4]; // legendary
    }
    if (clean.includes('tier 2') || clean.includes('tier 3') || clean.includes('universo') || clean.includes('galaxia') || clean.includes('multiverso')) {
      return POWER_RARITIES[3]; // epic
    }
    if (clean.includes('tier 4') || clean.includes('tier 5') || clean.includes('planeta') || clean.includes('estrella') || clean.includes('luna')) {
      return POWER_RARITIES[2]; // rare
    }
    if (clean.includes('tier 6') || clean.includes('tier 7') || clean.includes('ciudad') || clean.includes('pueblo') || clean.includes('montaña') || clean.includes('isla') || clean.includes('país')) {
      return POWER_RARITIES[1]; // uncommon
    }
    return POWER_RARITIES[0]; // common
  }

  for (const rarity of POWER_RARITIES) {
    if (idx >= rarity.minTierIndex && idx <= rarity.maxTierIndex) {
      return rarity;
    }
  }
  return POWER_RARITIES[0];
}

/**
 * Genera una matriz de atributos completa mediante distribución ponderada
 * con consistencia orgánica entre atributos físicos, mentales y de velocidad.
 * 
 * @param {Object} powerOptions - Diccionario cargado con las opciones de cada atributo
 * @returns {Object}
 */
export function rollWeightedPowerMatrix(powerOptions) {
  if (!powerOptions) return null;

  // 1. Tirada del Rango de Rareza Global
  const roll = Math.random();
  let selectedRarity = POWER_RARITIES[0];
  for (const r of POWER_RARITIES) {
    if (roll <= r.cumulativeChance) {
      selectedRarity = r;
      break;
    }
  }

  const overallOptions = powerOptions.overallTier || powerOptions.ap || [];
  const maxOverallIdx = Math.max(0, overallOptions.length - 1); // 54

  // 2. Determinación del Tier Principal dentro de la rareza
  let chosenTierIndex = 0;
  if (selectedRarity.id === 'mythic') {
    // Sub-distribución dentro del 1% Mítico:
    // Low 1-A (51): 40%
    // Tier 1-A (52): 35%
    // High 1-A (53): 18% (0.18% global ~ 1 en 555 tiradas)
    // Tier 0 Boundless (54): 7% (0.07% global ~ 1 en 1428 tiradas)
    const subRoll = Math.random();
    if (subRoll < 0.40) {
      chosenTierIndex = Math.min(51, maxOverallIdx);
    } else if (subRoll < 0.75) {
      chosenTierIndex = Math.min(52, maxOverallIdx);
    } else if (subRoll < 0.93) {
      chosenTierIndex = Math.min(53, maxOverallIdx);
    } else {
      chosenTierIndex = Math.min(54, maxOverallIdx);
    }
  } else {
    const min = Math.min(selectedRarity.minTierIndex, maxOverallIdx);
    const max = Math.min(selectedRarity.maxTierIndex, maxOverallIdx);
    const range = max - min;
    const subFactor = Math.pow(Math.random(), 1.15);
    chosenTierIndex = Math.min(max, Math.max(min, Math.round(min + subFactor * range)));
  }

  // Factor de progresión relativa dentro de la categoría de rareza [0.0, 1.0]
  const rarityMin = selectedRarity.minTierIndex;
  const rarityMax = selectedRarity.maxTierIndex;
  const intraProgress = rarityMax > rarityMin ? ((chosenTierIndex - rarityMin) / (rarityMax - rarityMin)) : 0.5;

  const isMythic = selectedRarity.id === 'mythic';
  const isLegendary = selectedRarity.id === 'legendary';
  const isEpic = selectedRarity.id === 'epic';

  const pickFromBracket = (optionsArr, bracketRange, jitterSpread = 0.5) => {
    if (!optionsArr || optionsArr.length === 0) return '';
    const [bMin, bMax] = bracketRange;
    const baseIdx = bMin + (bMax - bMin) * intraProgress;
    const jitter = (Math.random() - 0.5) * jitterSpread * 2;
    const finalIdx = Math.max(bMin, Math.min(bMax, Math.round(baseIdx + jitter)));
    return optionsArr[finalIdx]?.value || '';
  };

  // 3. Selección coherente de cada atributo:
  const result = {};

  // Overall Tier
  result.overallTier = overallOptions[chosenTierIndex]?.value || '';

  // AP (Potencia de Ataque): Muy ligada a Overall Tier (+- 1 rango)
  const apOptions = powerOptions.ap || overallOptions;
  const apJitter = Math.random() < 0.30 ? (Math.random() < 0.5 ? 1 : -1) : 0;
  const apIdx = Math.max(selectedRarity.minTierIndex, Math.min(selectedRarity.maxTierIndex, chosenTierIndex + apJitter));
  result.tier = apOptions[apIdx]?.value || result.overallTier;

  // DC (Capacidad Destructiva)
  result.dc = pickFromBracket(powerOptions.dc, selectedRarity.brackets.dc, 0.7);

  // Striking Strength
  result.strikingStrength = pickFromBracket(powerOptions.strikingStrength, selectedRarity.brackets.striking, 0.6);

  // Durability
  result.durability = pickFromBracket(powerOptions.durability, selectedRarity.brackets.durability, 0.7);

  // Lifting Strength
  result.liftingStrength = pickFromBracket(powerOptions.liftingStrength, selectedRarity.brackets.lifting, 1.0);

  // Range
  result.range = pickFromBracket(powerOptions.range, selectedRarity.brackets.range, 0.8);

  // Velocidades (28 opciones)
  const speedBracket = selectedRarity.brackets.speed;
  result.speed = pickFromBracket(powerOptions.speed, speedBracket, 0.7);
  // Velocidad de Combate, Reacción y Ataque tienden a ser iguales o levemente superiores a desplazamiento
  const [sMin, sMax] = speedBracket;
  const baseSpeedIdx = sMin + Math.round((sMax - sMin) * intraProgress);
  const clampSpeed = (val) => {
    const idx = Math.max(sMin, Math.min(sMax, val));
    return powerOptions.speed?.[idx]?.value || result.speed;
  };
  result.speedCombat = clampSpeed(baseSpeedIdx + (Math.random() < 0.4 ? 1 : 0));
  result.speedReaction = clampSpeed(baseSpeedIdx + (Math.random() < 0.4 ? 1 : 0));
  result.speedAttack = clampSpeed(baseSpeedIdx + (Math.random() < 0.35 ? 1 : 0));
  result.speedTravel = clampSpeed(baseSpeedIdx - (Math.random() < 0.35 ? 1 : 0));

  // Intelecto / IQ (11 opciones)
  // Omnisciente (10) y Casi-Omnisciente (9) reservadas para Míticos o seres de alta dimensión
  const rollIqIndex = () => {
    if (isMythic) {
      const q = Math.random();
      if (q < 0.35) return 10; // Omnisciente
      if (q < 0.65) return 9;  // Casi-Omnisciente
      if (q < 0.90) return 8;  // Supergenio
      return 7;                // Genio Extraordinario
    }
    if (isLegendary || isEpic) {
      const q = Math.random();
      if (q < 0.15) return 9; // Casi-Omnisciente
      if (q < 0.40) return 8; // Supergenio
      if (q < 0.70) return 7; // Genio Extraordinario
      return 6;               // Genio
    }
    // Distribución normal de inteligencia para seres estándar/terrenales:
    const q = Math.random();
    if (q < 0.03) return 0; // Mindless
    if (q < 0.08) return 1; // Animal
    if (q < 0.18) return 2; // Por debajo del promedio
    if (q < 0.52) return 3; // Promedio Humano (mayoría)
    if (q < 0.76) return 4; // Por encima del promedio
    if (q < 0.90) return 5; // Dotado / Talentoso
    if (q < 0.97) return 6; // Genio
    return 7;               // Genio Extraordinario (raro 3%)
  };

  const iqOptions = powerOptions.iq || [];
  const chosenIqIdx = Math.min(iqOptions.length - 1, rollIqIndex());
  result.iq = iqOptions[chosenIqIdx]?.value || '';
  result.intelligence = result.iq;

  // BIQ - Inteligencia de Batalla (9 opciones)
  // 0 Mindless ... 4 Veterano ... 8 Precognición Absoluta
  const rollBiqIndex = () => {
    if (isMythic) {
      const b = Math.random();
      if (b < 0.45) return 8; // Precognición Absoluta
      if (b < 0.80) return 7; // Estratega Bélico Supremo
      return 6;               // Prodigio de Batalla
    }
    if (isLegendary || isEpic) {
      const b = Math.random();
      if (b < 0.20) return 8;
      if (b < 0.50) return 7;
      if (b < 0.80) return 6;
      return 5;
    }
    const b = Math.random();
    if (b < 0.05) return 0; // Nula
    if (b < 0.15) return 1; // Feral / Instinto
    if (b < 0.35) return 2; // Principiante
    if (b < 0.65) return 3; // Adiestrado
    if (b < 0.85) return 4; // Veterano
    if (b < 0.95) return 5; // Maestro Marcial
    if (b < 0.99) return 6; // Prodigio de Batalla
    return 7;               // Estratega Supremo (1%)
  };

  const biqOptions = powerOptions.biq || [];
  const chosenBiqIdx = Math.min(biqOptions.length - 1, rollBiqIndex());
  result.biq = biqOptions[chosenBiqIdx]?.value || '';

  // Stamina / Resistencia a la Fatiga (8 opciones)
  // 0 Bajo Promedio ... 6 Ilimitada ... 7 Infinita Cósmica
  const rollStaminaIndex = () => {
    if (isMythic) {
      return Math.random() < 0.65 ? 7 : 6; // Infinita o Ilimitada
    }
    if (isLegendary || isEpic) {
      const s = Math.random();
      if (s < 0.35) return 7;
      if (s < 0.70) return 6;
      return 5; // Extremadamente Alta
    }
    const s = Math.random();
    if (s < 0.08) return 0; // Bajo el promedio
    if (s < 0.45) return 1; // Humano Promedio
    if (s < 0.75) return 2; // Humano Atleta
    if (s < 0.90) return 3; // Cúspide Humana
    if (s < 0.98) return 4; // Superhumana
    return 5;               // Extremadamente Alta (2%)
  };

  const staminaOptions = powerOptions.stamina || [];
  const chosenStaminaIdx = Math.min(staminaOptions.length - 1, rollStaminaIndex());
  result.stamina = staminaOptions[chosenStaminaIdx]?.value || '';

  return {
    attributes: result,
    rarity: selectedRarity,
    tierIndex: chosenTierIndex,
    tierValue: result.overallTier,
    tierLabel: overallOptions[chosenTierIndex]?.label || result.overallTier
  };
}
