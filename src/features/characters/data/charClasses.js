/**
 * charClasses.js
 * Diccionario de Clases RPG Tradicionales y Arquetipos de Combate FGC.
 * Mapea cada clase y arquetipo con descripciones técnicas, de rol y mecánicas.
 */

// ============================================================================
// 1. DICCIONARIO DE ARQUETIPOS DE COMBATE FGC (INFIL GLOSSARY y FIGHTING GAMES)
// ============================================================================
export const FGC_ARCHETYPES = {
  // FUNDAMENTALES / CLÁSICOS
  'Shoto / All-Rounder': 'Equilibrio neutro entre proyectiles, ataques anti-aéreos y herramientas de avance. Versátil en cualquier rango.',
  'Zoner': 'Dominio del espacio a larga distancia mediante proyectiles, trampas o extremidades extensibles para denegar el acceso.',
  'Rushdown': 'Presión constante y agresiva a corta distancia orientada a romper la guardia del oponente antes de que pueda respirar.',
  'Grappler': 'Especialista en agarres de comando de alto riesgo y daño masivo. Busca acorralar al rival en situaciones de adivinanza.',
  'Footsies / Mid-Range': 'Control absoluto de la distancia media (whiff punish, pokes) para castigar el mínimo error del rival.',

  // TÁCTICAS / ESPECIALIZACIÓN
  'Setplay / Vortex': 'Basado en derribos garantizados que fuerzan al rival a adivinar la defensa repetidamente al levantarse (Okizeme).',
  'Puppet / Invocador': 'Control simultáneo de dos entidades independientes (personaje principal y mascota/invocación) para ataques en sándwich.',
  'Stance / Cambio de Postura': 'Mapeo dinámico que altera completamente las normales, velocidad y movimientos al cambiar de postura.',
  'Pixie / Glass Cannon': 'Movilidad sobrehumana, mixups veloces y Hitboxes pequeñas compensadas con muy baja resistencia o vida.',
  'Bait y Punish': 'Estilo evasivo diseñado para provocar el fallo enemigo y responder con castigos de máximo daño.',
  'Trap / Area Denial': 'Despliegue de elementos en pantalla (minas, orbes, glifos) que restringen las rutas de movimiento del oponente.',

  // MECÁNICAS DE JUEGO y RECURSOS
  'Install / Power-Up': 'Capacidad de activar un estado temporal que altera las reglas de sus ataques y aumenta su velocidad o daño.',
  'Charge / Carga': 'Habilidades que requieren mantener direcciones guardadas previamente para liberar golpes de gran alcance y poder.',
  'Tank / Heavy Armor': 'Personaje pesado con resistencia elevada y marcos de superarmadura que absorben impactos sin interrumpir su ataque.',
  'Parry / Counter-Based': 'Enfocado en lecturas precisas de bloqueo defensivo o desvíos para revertir la iniciativa del combate.',
  'Gimmick / Rule-Breaker': 'Diseñado alrededor de una mecánica única fuera de la norma del sistema (contadores de cartas, temporizadores, venenos).',
};

export const FGC_ARCHETYPES_DICT = FGC_ARCHETYPES;

export const FGC_ARCHETYPES_CATEGORIES = [
  {
    id: 'fundamentales',
    label: 'Fundamentales / Clásicos',
    icon: 'swords',
    classes: [
      'Shoto / All-Rounder',
      'Zoner',
      'Rushdown',
      'Grappler',
      'Footsies / Mid-Range'
    ]
  },
  {
    id: 'tacticas',
    label: 'Tácticas / Especialización',
    icon: 'target',
    classes: [
      'Setplay / Vortex',
      'Puppet / Invocador',
      'Stance / Cambio de Postura',
      'Pixie / Glass Cannon',
      'Bait y Punish',
      'Trap / Area Denial'
    ]
  },
  {
    id: 'mecanicas',
    label: 'Mecánicas de Juego y Recursos',
    icon: 'zap',
    classes: [
      'Install / Power-Up',
      'Charge / Carga',
      'Tank / Heavy Armor',
      'Parry / Counter-Based',
      'Gimmick / Rule-Breaker'
    ]
  }
];

// ============================================================================
// 2. DICCIONARIO COMPLETO DE CLASES RPG (FIGHTER / ROGUE / MAGE / HYBRIDS)
// ============================================================================
export const RPG_CLASSES = {
  // ── RAMA COMBATE (FIGHTER / MARCIAL) ──
  'Guerrero (Warrior)': 'Especialista en combate cuerpo a cuerpo, dominando armaduras y armas pesadas.',
  'Caballero (Knight)': 'Bastión defensivo con código de honor, alta resistencia y uso de escudos.',
  'Berserker': 'Combatiente impulsado por la furia, sacrificando defensa por daño masivo.',
  'Paladín': 'Guerrero sagrado que combina combate físico con milagros de curación y protección.',
  'Caballero Oscuro (Dark Knight)': 'Utiliza magia de sombras y sacrificio de vitalidad para canalizar golpes devastadores.',
  'Centinela (Sentinel)': 'Guardián estático enfocado en el control de masas y defensa de zona.',
  'Dragón / Dragoon': 'Guerrero de alta movilidad especializado en saltos, lanzas y combate aéreo.',
  'Maestro de Armas (Weapon Master)': 'Experto en el manejo fluido de múltiples tipos de armamento táctico.',
  'Artista Marcial / Monje': 'Especialista en combate sin armas, agilidad superior y canalización de Ki.',
  'Soldado / Púgil': 'Combatiente táctico militar de primera línea o peleador de corta distancia.',
  'Samurái / Ronin': 'Maestría en la katana, enfoques de precisión y cortes de alta velocidad.',
  'Heraldo / Inquisidor': 'Liderazgo militar, cazador de herejes con capacidad de debilitar enemigos.',
  'Señor de la Guerra (Warlord)': 'Comandante táctico que potencia las capacidades de sus aliados en batalla.',

  // ── RAMA SIGILO Y AGILIDAD (ROGUE / PÍCARO) ──
  'Ladrón (Thief)': 'Agilidad pura, sigilo, robo de recursos y evasión de riesgos.',
  'Asesino': 'Maestro del ataque por la espalda, emboscadas y letalidad instantánea.',
  'Ninja': 'Agilidad sobrehumana, uso de herramientas ocultas (shurikens, humo) y ninjutsu.',
  'Infiltrado / Espía': 'Especialista en pasar desapercibido, sabotaje e inteligencia táctica.',
  'Envenenador (Poisoner)': 'Aplica toxinas y efectos de daño progresivo (DoT) en sus ataques.',
  'Tirador / Arquero (Marksman / Archer)': 'Ataques de precisión a larga distancia con arcos o ballestas.',
  'Pistolero (Gunslinger)': 'Especialista en armas de fuego de corta y mediana distancia con disparos veloces.',
  'Cazador / Batidor (Hunter / Scout)': 'Rastreador de terreno, detección de trampas y exploración avanzada.',
  'Esgrimista / Duelista': 'Experto en combate 1v1 con armas ligeras, parry y estocadas precisas.',
  'Corsario / Bandido': 'Combatiente pragmático de escaramuzas con tácticas sucias de calle.',
  'Maestro de Trampas': 'Despliegue de artefactos ofensivos y restricciones de movimiento en el campo.',
  'Tahúr / Camaleón': 'Manipulación de la suerte, engaño visual y adaptación al entorno.',

  // ── RAMA ARCANO Y CONOCIMIENTO (MAGE / MAGO) ──
  'Mago / Hechicero (Wizard / Sorcerer)': 'Manipulador de las artes arcanas, canalizando conjuros de área masivos.',
  'Brujo (Warlock / Witch)': 'Obtiene su poder mediante pactos oscuros, maldiciones y rituales.',
  'Arcanista': 'Estudioso de la estructura de la magia, enfocado en metamagia y contraconjuros.',
  'Nigromante': 'Invocación y control de muertos vivientes y manipulación de la energía vital.',
  'Druida': 'Canalizador de la naturaleza, metamorfosis animal y magia elemental telúrica.',
  'Clérigo / Sacerdote': 'Emisario divino centrado en sanación, purificación y bendiciones.',
  'Elementalista': 'Dominio primario de los elementos (Fuego, Agua, Tierra, Aire).',
  'Invocador (Summoner)': 'Trae entidades de otros planos para combatir en su lugar.',
  'Ilusionista': 'Crea espejismos y alteraciones sensoriales para confundir al rival.',
  'Alquimista / Tecnomante': 'Uso de brebajes, pócimas y fusión de magia con tecnología/artefactos.',
  'Psiónico / Mentalista': 'Manipulación mental, telequinesis y ataques directamente al intelecto.',
  'Caminante de Sueños / Geomante': 'Alteración del entorno físico o acceso al plano psíquico/onírico.',

  // ── RAMA HÍBRIDA y SOCIAL (HYBRIDS / ROLEPLAY) ──
  'Bardo': 'Inspirador mediante el arte/música, soporte general y versatilidad.',
  'Diplomático / Mercader': 'Enfoque en carisma, persuasión, comercio y resolución no violenta.',
  'Erudito (Loremaster)': 'Enciclopedia viviente, análisis de debilidades enemigas e historia.',
  'Caminante del Horizonte (Horizon Walker)': 'Explorador de planos dimensionales y teletransporte.',
  'Espada Hechizada (Spellsword / Battlemage)': 'Fusión perfecta de combate con espada y magia rápida.',
  'Arquero Arcano': 'Dispara proyectiles imbuidos con conjuros elementales o arcanos.',
  'Maestro de Bestias': 'Combate coordinado junto a una criatura o compañero animal.',
};

export const RPG_CLASSES_DICT = RPG_CLASSES;
export const CHAR_CLASSES_DICT = RPG_CLASSES;

export const RPG_CLASSES_CATEGORIES = [
  {
    id: 'combate',
    label: 'Rama Combate (Fighter / Marcial)',
    icon: 'swords',
    classes: [
      'Guerrero (Warrior)',
      'Caballero (Knight)',
      'Berserker',
      'Paladín',
      'Caballero Oscuro (Dark Knight)',
      'Centinela (Sentinel)',
      'Dragón / Dragoon',
      'Maestro de Armas (Weapon Master)',
      'Artista Marcial / Monje',
      'Soldado / Púgil',
      'Samurái / Ronin',
      'Heraldo / Inquisidor',
      'Señor de la Guerra (Warlord)'
    ]
  },
  {
    id: 'sigilo',
    label: 'Rama Sigilo y Agilidad (Rogue / Pícaro)',
    icon: 'ghost',
    classes: [
      'Ladrón (Thief)',
      'Asesino',
      'Ninja',
      'Infiltrado / Espía',
      'Envenenador (Poisoner)',
      'Tirador / Arquero (Marksman / Archer)',
      'Pistolero (Gunslinger)',
      'Cazador / Batidor (Hunter / Scout)',
      'Esgrimista / Duelista',
      'Corsario / Bandido',
      'Maestro de Trampas',
      'Tahúr / Camaleón'
    ]
  },
  {
    id: 'arcano',
    label: 'Rama Arcano y Conocimiento (Mage / Mago)',
    icon: 'wand-2',
    classes: [
      'Mago / Hechicero (Wizard / Sorcerer)',
      'Brujo (Warlock / Witch)',
      'Arcanista',
      'Nigromante',
      'Druida',
      'Clérigo / Sacerdote',
      'Elementalista',
      'Invocador (Summoner)',
      'Ilusionista',
      'Alquimista / Tecnomante',
      'Psiónico / Mentalista',
      'Caminante de Sueños / Geomante'
    ]
  },
  {
    id: 'hibrida',
    label: 'Rama Híbrida y Social (Hybrids / Roleplay)',
    icon: 'users',
    classes: [
      'Bardo',
      'Diplomático / Mercader',
      'Erudito (Loremaster)',
      'Caminante del Horizonte (Horizon Walker)',
      'Espada Hechizada (Spellsword / Battlemage)',
      'Arquero Arcano',
      'Maestro de Bestias'
    ]
  }
];

export const CHAR_CLASSES_CATEGORIES = RPG_CLASSES_CATEGORIES;

const LEGACY_ALIASES = {
  'Guerrero': 'Guerrero (Warrior)',
  'Warrior': 'Guerrero (Warrior)',
  'Caballero': 'Caballero (Knight)',
  'Knight': 'Caballero (Knight)',
  'Caballero Oscuro': 'Caballero Oscuro (Dark Knight)',
  'Dark Knight': 'Caballero Oscuro (Dark Knight)',
  'Centinela': 'Centinela (Sentinel)',
  'Sentinel': 'Centinela (Sentinel)',
  'Dragoneante': 'Dragón / Dragoon',
  'Dragoon': 'Dragón / Dragoon',
  'Caballero Dragón': 'Dragón / Dragoon',
  'Maestro de Armas': 'Maestro de Armas (Weapon Master)',
  'Weapon Master': 'Maestro de Armas (Weapon Master)',
  'Monje': 'Artista Marcial / Monje',
  'Artista Marcial': 'Artista Marcial / Monje',
  'Soldado': 'Soldado / Púgil',
  'Púgil': 'Soldado / Púgil',
  'Samurái': 'Samurái / Ronin',
  'Ronin': 'Samurái / Ronin',
  'Heraldo': 'Heraldo / Inquisidor',
  'Inquisidor': 'Heraldo / Inquisidor',
  'Señor de la Guerra': 'Señor de la Guerra (Warlord)',
  'Warlord': 'Señor de la Guerra (Warlord)',
  'Ladrón': 'Ladrón (Thief)',
  'Thief': 'Ladrón (Thief)',
  'Espía': 'Infiltrado / Espía',
  'Infiltrado': 'Infiltrado / Espía',
  'Envenenador': 'Envenenador (Poisoner)',
  'Arquero': 'Tirador / Arquero (Marksman / Archer)',
  'Tirador de Élite': 'Tirador / Arquero (Marksman / Archer)',
  'Pistolero': 'Pistolero (Gunslinger)',
  'Cazador': 'Cazador / Batidor (Hunter / Scout)',
  'Batidor': 'Cazador / Batidor (Hunter / Scout)',
  'Esgrimista': 'Esgrimista / Duelista',
  'Duelista': 'Esgrimista / Duelista',
  'Corsario': 'Corsario / Bandido',
  'Bandido': 'Corsario / Bandido',
  'Tahúr': 'Tahúr / Camaleón',
  'Camaleón': 'Tahúr / Camaleón',
  'Mago Arcano': 'Mago / Hechicero (Wizard / Sorcerer)',
  'Hechicero': 'Mago / Hechicero (Wizard / Sorcerer)',
  'Mago': 'Mago / Hechicero (Wizard / Sorcerer)',
  'Brujo': 'Brujo (Warlock / Witch)',
  'Bruja': 'Brujo (Warlock / Witch)',
  'Clérigo': 'Clérigo / Sacerdote',
  'Sacerdote': 'Clérigo / Sacerdote',
  'Sacerdote de Batalla': 'Clérigo / Sacerdote',
  'Invocador': 'Invocador (Summoner)',
  'Alquimista': 'Alquimista / Tecnomante',
  'Tecnomante': 'Alquimista / Tecnomante',
  'Psiónico': 'Psiónico / Mentalista',
  'Mentalista': 'Psiónico / Mentalista',
  'Geomante': 'Caminante de Sueños / Geomante',
  'Caminante de Sueños': 'Caminante de Sueños / Geomante',
  'Diplomático': 'Diplomático / Mercader',
  'Mercader': 'Diplomático / Mercader',
  'Erudito': 'Erudito (Loremaster)',
  'Maestro del Saber': 'Erudito (Loremaster)',
  'Caminante del Horizonte': 'Caminante del Horizonte (Horizon Walker)',
  'Guerrero Arcano': 'Espada Hechizada (Spellsword / Battlemage)',
  'Mago de Batalla': 'Espada Hechizada (Spellsword / Battlemage)',
};

Object.entries(LEGACY_ALIASES).forEach(([alias, canonical]) => {
  if (RPG_CLASSES[canonical] && !RPG_CLASSES[alias]) {
    RPG_CLASSES[alias] = RPG_CLASSES[canonical];
  }
});
