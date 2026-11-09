/**
 * store/tierlist/constants.js
 * Constantes, rangos por defecto, paletas y catálogo de herramientas.
 */

export const STORAGE_KEY = 'wimsf_tierlist_state_v1';

export const DEFAULT_TIERS = [
  { id: 'tier_s', label: 'S', color: '#ef4444', characterIds: [] },
  { id: 'tier_a', label: 'A', color: '#f97316', characterIds: [] },
  { id: 'tier_b', label: 'B', color: '#eab308', characterIds: [] },
  { id: 'tier_c', label: 'C', color: '#10b981', characterIds: [] },
  { id: 'tier_d', label: 'D', color: '#06b6d4', characterIds: [] },
  { id: 'tier_e', label: 'E', color: '#8b5cf6', characterIds: [] },
];

export const TIER_PRESET_COLORS = [
  '#ef4444', // Rojo
  '#f97316', // Naranja
  '#eab308', // Amarillo
  '#10b981', // Verde Esmeralda
  '#06b6d4', // Cian Eléctrico
  '#3b82f6', // Azul Cobalto
  '#8b5cf6', // Violeta Neón
  '#d946ef', // Fucsia
  '#ec4899', // Rosa
  '#64748b', // Pizarra
];

export const TIER_PRESET_GRADIENTS = [
  { name: 'Teal Ciber (X)', from: '#0b4f6c', to: '#00c9a7', dir: 'to bottom' },
  { name: 'Sunset Rose (S+)', from: '#f857a6', to: '#ff758c', dir: 'to bottom' },
  { name: 'Lavender Neon (S)', from: '#5c6ac4', to: '#8c9eff', dir: 'to bottom' },
  { name: 'Electric Aether (A)', from: '#7f00ff', to: '#00c6ff', dir: 'to bottom' },
  { name: 'Peach Bloom (B)', from: '#fa709a', to: '#fee140', dir: 'to bottom' },
  { name: 'Frost Crystal (C)', from: '#ffffff', to: '#a1c4fd', dir: 'to bottom' },
  { name: 'Dark Steel (D)', from: '#232526', to: '#525252', dir: 'to bottom' },
  { name: 'Inferno Ruby', from: '#ff0844', to: '#ff4e50', dir: 'to bottom' },
  { name: 'Toxic Emerald', from: '#11998e', to: '#38ef7d', dir: 'to bottom' },
  { name: 'Cosmic Violet', from: '#8e2de2', to: '#4a00e0', dir: 'to bottom' },
  { name: 'Solar Flare', from: '#f12711', to: '#f5af19', dir: 'to bottom' },
  { name: 'Deep Cobalt', from: '#0052d4', to: '#4364f7', dir: 'to bottom' }
];

export const TIERLIST_ICONS = [
  { id: 'trophy', label: 'Trofeo', category: 'General' },
  { id: 'swords', label: 'Espadas (Combate)', category: 'Combate' },
  { id: 'sword', label: 'Espada', category: 'Combate' },
  { id: 'dumbbell', label: 'Mancuerna (Fuerza)', category: 'Atributos' },
  { id: 'brain', label: 'Cerebro (Inteligencia)', category: 'Atributos' },
  { id: 'heart', label: 'Corazón (Vitalidad)', category: 'Atributos' },
  { id: 'shield', label: 'Escudo (Defensa)', category: 'Combate' },
  { id: 'flame', label: 'Fuego (Poder)', category: 'Poder' },
  { id: 'zap', label: 'Rayo (Velocidad)', category: 'Atributos' },
  { id: 'target', label: 'Diana (Puntería)', category: 'Combate' },
  { id: 'crosshair', label: 'Retícula (Puntería)', category: 'Combate' },
  { id: 'skull', label: 'Calavera (Letalidad)', category: 'Poder' },
  { id: 'crown', label: 'Corona (Liderazgo)', category: 'Jerarquía' },
  { id: 'star', label: 'Estrella (Rango)', category: 'General' },
  { id: 'award', label: 'Medalla', category: 'General' },
  { id: 'gem', label: 'Gema (Rareza)', category: 'General' },
  { id: 'sparkles', label: 'Destellos (Magia)', category: 'Poder' },
  { id: 'activity', label: 'Actividad (Rendimiento)', category: 'Atributos' },
  { id: 'eye', label: 'Ojo (Percepción)', category: 'Atributos' },
  { id: 'ghost', label: 'Fantasma (Sigilo)', category: 'Especial' },
  { id: 'bot', label: 'Robot (Tecnología)', category: 'Especial' },
  { id: 'scale', label: 'Balanza (Justicia)', category: 'Especial' },
  { id: 'book-open', label: 'Libro (Sabiduría)', category: 'Atributos' },
  { id: 'coins', label: 'Monedas (Riqueza)', category: 'Especial' },
  { id: 'compass', label: 'Brújula (Exploración)', category: 'General' },
  { id: 'bomb', label: 'Bomba (Caos)', category: 'Poder' },
  { id: 'gamepad-2', label: 'Mando (Gaming)', category: 'General' }
];

// ── CATÁLOGO DE HERRAMIENTAS DE CALIFICACIÓN ─────────────
export const TIER_RATING_TOOLS = [
  // ── CATEGORÍA: OPERADORES DE RELACIÓN ───────────────────────
  {
    id: 'op_eq',
    category: 'relation',
    categoryLabel: 'Operadores de Relación',
    symbol: '=',
    name: 'Equivalencia exacta',
    desc: 'Mismo valor, rendimiento o utilidad entre elementos.',
    color: '#06b6d4',
    bg: 'rgba(6, 182, 212, 0.15)',
    border: 'rgba(6, 182, 212, 0.45)',
    type: 'row_operator'
  },
  {
    id: 'op_approx',
    category: 'relation',
    categoryLabel: 'Operadores de Relación',
    symbol: '≈',
    name: 'Aproximación / Empate técnico',
    desc: 'Diferencia mínima y debatible entre opciones.',
    color: '#38bdf8',
    bg: 'rgba(56, 189, 248, 0.15)',
    border: 'rgba(56, 189, 248, 0.45)',
    type: 'row_operator'
  },
  {
    id: 'op_gt',
    category: 'relation',
    categoryLabel: 'Operadores de Relación',
    symbol: '>',
    name: 'Superioridad ordinal',
    desc: 'Micro-ordenar de izquierda a derecha dentro de un mismo tier.',
    color: '#10b981',
    bg: 'rgba(16, 185, 129, 0.15)',
    border: 'rgba(16, 185, 129, 0.45)',
    type: 'row_operator'
  },
  {
    id: 'op_lt',
    category: 'relation',
    categoryLabel: 'Operadores de Relación',
    symbol: '<',
    name: 'Inferioridad ordinal',
    desc: 'Orden menor respecto al elemento contiguo.',
    color: '#14b8a6',
    bg: 'rgba(20, 184, 166, 0.15)',
    border: 'rgba(20, 184, 166, 0.45)',
    type: 'row_operator'
  },
  {
    id: 'op_dgt',
    category: 'relation',
    categoryLabel: 'Operadores de Relación',
    symbol: '>>',
    name: 'Brecha abismal (Superior)',
    desc: 'Salto de poder masivo que supera una simple línea divisoria.',
    color: '#f59e0b',
    bg: 'rgba(245, 158, 11, 0.18)',
    border: 'rgba(245, 158, 11, 0.55)',
    type: 'row_operator'
  },
  {
    id: 'op_dlt',
    category: 'relation',
    categoryLabel: 'Operadores de Relación',
    symbol: '<<',
    name: 'Brecha abismal (Inferior)',
    desc: 'Caída de poder masiva respecto a la opción previa.',
    color: '#f97316',
    bg: 'rgba(249, 115, 22, 0.18)',
    border: 'rgba(249, 115, 22, 0.55)',
    type: 'row_operator'
  },
  {
    id: 'op_gte',
    category: 'relation',
    categoryLabel: 'Operadores de Relación',
    symbol: '≥',
    name: 'Mayor o igual que',
    desc: 'Superior o como mínimo igual de competente que el siguiente elemento.',
    color: '#38bdf8',
    bg: 'rgba(56, 189, 248, 0.15)',
    border: 'rgba(56, 189, 248, 0.5)',
    type: 'row_operator'
  },
  {
    id: 'op_lte',
    category: 'relation',
    categoryLabel: 'Operadores de Relación',
    symbol: '≤',
    name: 'Menor o igual que',
    desc: 'Inferior o como máximo igual de competente que el siguiente elemento.',
    color: '#fb7185',
    bg: 'rgba(251, 113, 133, 0.15)',
    border: 'rgba(251, 113, 133, 0.5)',
    type: 'row_operator'
  },
  {
    id: 'op_neq',
    category: 'relation',
    categoryLabel: 'Operadores de Relación',
    symbol: '≠',
    name: 'Incomparable / Diferente función',
    desc: 'No comparable directamente debido a roles, nichos o kits totalmente distintos.',
    color: '#e879f9',
    bg: 'rgba(232, 121, 249, 0.15)',
    border: 'rgba(232, 121, 249, 0.5)',
    type: 'row_operator'
  },
  {
    id: 'op_matchup',
    category: 'relation',
    categoryLabel: 'Operadores de Relación',
    symbol: '⇄',
    name: 'Matchup dependiente',
    desc: 'Relación no transitiva (Piedra-Papel-Tijera): el resultado depende del enfrentamiento.',
    color: '#facc15',
    bg: 'rgba(250, 204, 21, 0.15)',
    border: 'rgba(250, 204, 21, 0.5)',
    type: 'row_operator'
  },
  {
    id: 'op_dash',
    category: 'relation',
    categoryLabel: 'Operadores de Relación',
    symbol: '—',
    name: 'Raya divisoria / Separador',
    desc: 'Separador o raya horizontal para delimitar bloques y secciones dentro de la fila.',
    color: '#94a3b8',
    bg: 'rgba(148, 163, 184, 0.16)',
    border: 'rgba(148, 163, 184, 0.5)',
    type: 'row_operator'
  },
  {
    id: 'op_slash',
    category: 'relation',
    categoryLabel: 'Operadores de Relación',
    symbol: '/',
    name: 'Raya diagonal / Barra',
    desc: 'Separador diagonal para dividir variantes, subclases o categorías contiguas.',
    color: '#cbd5e1',
    bg: 'rgba(203, 213, 225, 0.16)',
    border: 'rgba(203, 213, 225, 0.5)',
    type: 'row_operator'
  },
  {
    id: 'op_pipe',
    category: 'relation',
    categoryLabel: 'Operadores de Relación',
    symbol: '|',
    name: 'Separador vertical / Pilar',
    desc: 'Corte vertical limpio para independizar subgrupos dentro del mismo tier.',
    color: '#e2e8f0',
    bg: 'rgba(226, 232, 240, 0.16)',
    border: 'rgba(226, 232, 240, 0.5)',
    type: 'row_operator'
  },
  {
    id: 'op_hr',
    category: 'relation',
    categoryLabel: 'Operadores de Relación',
    symbol: '───',
    name: 'Línea Divisora de Campo',
    desc: 'Línea horizontal al 100% que divide el tier en dos campos. Permite ponerle nombre o dejarla como línea recta continua.',
    color: '#00f0ff',
    bg: 'rgba(0, 240, 255, 0.16)',
    border: 'rgba(0, 240, 255, 0.5)',
    type: 'row_operator',
    isRowDivider: true
  },

  // ── CATEGORÍA: MODIFICADORES DE SUB-NIVELES ─────────────────
  {
    id: 'sub_plusplus',
    category: 'subtier',
    categoryLabel: 'Modificadores de Sub-niveles',
    symbol: '++',
    name: 'Ultra-grado positivo',
    desc: 'Peldaño superior extremo (ej. S++ > S+ > S).',
    color: '#22c55e',
    bg: 'rgba(34, 197, 94, 0.2)',
    border: 'rgba(34, 197, 94, 0.6)',
    type: 'badge'
  },
  {
    id: 'sub_plus',
    category: 'subtier',
    categoryLabel: 'Modificadores de Sub-niveles',
    symbol: '+',
    name: 'Sub-grado positivo',
    desc: 'Rendimiento por encima del estándar del rango (ej. S+).',
    color: '#4ade80',
    bg: 'rgba(74, 222, 128, 0.2)',
    border: 'rgba(74, 222, 128, 0.5)',
    type: 'badge'
  },
  {
    id: 'sub_minus',
    category: 'subtier',
    categoryLabel: 'Modificadores de Sub-niveles',
    symbol: '-',
    name: 'Sub-grado negativo',
    desc: 'Rendimiento en la parte baja del rango (ej. S-).',
    color: '#fb7185',
    bg: 'rgba(251, 113, 133, 0.2)',
    border: 'rgba(251, 113, 133, 0.5)',
    type: 'badge'
  },
  {
    id: 'sub_minusminus',
    category: 'subtier',
    categoryLabel: 'Modificadores de Sub-niveles',
    symbol: '--',
    name: 'Ultra-grado negativo',
    desc: 'Peldaño inferior extremo dentro del rango (ej. S--).',
    color: '#ef4444',
    bg: 'rgba(239, 68, 68, 0.2)',
    border: 'rgba(239, 68, 68, 0.6)',
    type: 'badge'
  },
  {
    id: 'sub_ex',
    category: 'subtier',
    categoryLabel: 'Modificadores de Sub-niveles',
    symbol: 'EX',
    name: 'Tier excluyente',
    desc: 'Reservado para lo que rompe las reglas del juego por completo.',
    color: '#a855f7',
    bg: 'rgba(168, 85, 247, 0.22)',
    border: 'rgba(168, 85, 247, 0.65)',
    type: 'badge'
  },
  {
    id: 'sub_god',
    category: 'subtier',
    categoryLabel: 'Modificadores de Sub-niveles',
    symbol: 'GOD',
    name: 'Nivel Divino / Inalcanzable',
    desc: 'Categoría suprema fuera de toda escala convencional.',
    color: '#eab308',
    bg: 'rgba(234, 179, 8, 0.22)',
    border: 'rgba(234, 179, 8, 0.65)',
    type: 'badge'
  },
  {
    id: 'sub_unknown',
    category: 'subtier',
    categoryLabel: 'Modificadores de Sub-niveles',
    symbol: '?',
    name: 'Incierto / Sin feats',
    desc: 'Rendimiento o poder no demostrado, feats insuficientes o altamente debatible.',
    color: '#94a3b8',
    bg: 'rgba(148, 163, 184, 0.22)',
    border: 'rgba(148, 163, 184, 0.65)',
    type: 'badge'
  },

  // ── CATEGORÍA: AGRUPACIONES Y CONTEXTO ──────────────────────
  {
    id: 'ctx_combo',
    category: 'context',
    categoryLabel: 'Agrupaciones y Contexto',
    symbol: '[ ]',
    name: 'Paquetes o Sinergias',
    desc: 'Engloba elementos que operan en conjunto (1er clic: [, 2do clic: ]).',
    color: '#38bdf8',
    bg: 'rgba(56, 189, 248, 0.15)',
    border: 'rgba(56, 189, 248, 0.55)',
    type: 'row_operator',
    isGroupWrapper: true
  },
  {
    id: 'ctx_bracket_open',
    category: 'context',
    categoryLabel: 'Agrupaciones y Contexto',
    symbol: '[',
    name: 'Apertura de Paquete',
    desc: 'Inicia el paquete de sinergia en la fila.',
    color: '#38bdf8',
    bg: 'rgba(56, 189, 248, 0.18)',
    border: 'rgba(56, 189, 248, 0.6)',
    type: 'row_operator',
    bracketSide: 'open',
    isSubTool: true
  },
  {
    id: 'ctx_bracket_close',
    category: 'context',
    categoryLabel: 'Agrupaciones y Contexto',
    symbol: ']',
    name: 'Cierre de Paquete',
    desc: 'Cierra el paquete de sinergia en la fila.',
    color: '#38bdf8',
    bg: 'rgba(56, 189, 248, 0.18)',
    border: 'rgba(56, 189, 248, 0.6)',
    type: 'row_operator',
    bracketSide: 'close',
    isSubTool: true
  },
  {
    id: 'ctx_cond',
    category: 'context',
    categoryLabel: 'Agrupaciones y Contexto',
    symbol: '( )',
    name: 'Condicionales',
    desc: 'Engloba restricciones o dependencias (1er clic: (, 2do clic: )).',
    color: '#c084fc',
    bg: 'rgba(192, 132, 252, 0.15)',
    border: 'rgba(192, 132, 252, 0.55)',
    type: 'row_operator',
    isGroupWrapper: true
  },
  {
    id: 'ctx_paren_open',
    category: 'context',
    categoryLabel: 'Agrupaciones y Contexto',
    symbol: '(',
    name: 'Apertura Condicional',
    desc: 'Inicia el bloque condicional en la fila.',
    color: '#c084fc',
    bg: 'rgba(192, 132, 252, 0.18)',
    border: 'rgba(192, 132, 252, 0.6)',
    type: 'row_operator',
    bracketSide: 'open',
    isSubTool: true
  },
  {
    id: 'ctx_paren_close',
    category: 'context',
    categoryLabel: 'Agrupaciones y Contexto',
    symbol: ')',
    name: 'Cierre Condicional',
    desc: 'Cierra el bloque condicional en la fila.',
    color: '#c084fc',
    bg: 'rgba(192, 132, 252, 0.18)',
    border: 'rgba(192, 132, 252, 0.6)',
    type: 'row_operator',
    bracketSide: 'close',
    isSubTool: true
  },
  {
    id: 'ctx_var',
    category: 'context',
    categoryLabel: 'Agrupaciones y Contexto',
    symbol: '±',
    name: 'Varianza / Margen de error',
    desc: 'Mide la volatilidad o inestabilidad del rendimiento de un elemento.',
    color: '#fb923c',
    bg: 'rgba(251, 146, 60, 0.2)',
    border: 'rgba(251, 146, 60, 0.6)',
    type: 'badge'
  },

  // ── CATEGORÍA: TENDENCIAS DEL META Y TRADING ────────────────
  {
    id: 'meta_up',
    category: 'meta',
    categoryLabel: 'Tendencias del Meta y Trading',
    symbol: '↑',
    name: 'Tendencia al alza',
    desc: 'Indica si un elemento está subiendo de valor o relevancia en el meta/mercado actual.',
    color: '#10b981',
    bg: 'rgba(16, 185, 129, 0.2)',
    border: 'rgba(16, 185, 129, 0.6)',
    type: 'badge'
  },
  {
    id: 'meta_down',
    category: 'meta',
    categoryLabel: 'Tendencias del Meta y Trading',
    symbol: '↓',
    name: 'Tendencia a la baja',
    desc: 'Indica si un elemento está perdiendo relevancia o cayendo de valor en el meta/mercado actual.',
    color: '#f43f5e',
    bg: 'rgba(244, 63, 94, 0.2)',
    border: 'rgba(244, 63, 94, 0.6)',
    type: 'badge'
  },
  {
    id: 'meta_rework',
    category: 'meta',
    categoryLabel: 'Tendencias del Meta y Trading',
    symbol: '⟳',
    name: 'En revisión / Rework próximo',
    desc: 'Señala que el elemento está sujeto a cambios inminentes por actualizaciones de los desarrolladores.',
    color: '#06b6d4',
    bg: 'rgba(6, 182, 212, 0.2)',
    border: 'rgba(6, 182, 212, 0.6)',
    type: 'badge'
  },
  {
    id: 'trade_win',
    category: 'meta',
    categoryLabel: 'Tendencias del Meta y Trading',
    symbol: 'W',
    name: 'Win (Favorable)',
    desc: 'Usado en trading para clasificar qué tan favorable es un intercambio al recibir o dar ese objeto (ganancia).',
    color: '#22c55e',
    bg: 'rgba(34, 197, 94, 0.22)',
    border: 'rgba(34, 197, 94, 0.65)',
    type: 'badge'
  },
  {
    id: 'trade_fair',
    category: 'meta',
    categoryLabel: 'Tendencias del Meta y Trading',
    symbol: 'F',
    name: 'Fair (Equitativo)',
    desc: 'Usado en trading para clasificar un intercambio de valor comercial justo o equivalente.',
    color: '#eab308',
    bg: 'rgba(234, 179, 8, 0.2)',
    border: 'rgba(234, 179, 8, 0.6)',
    type: 'badge'
  },
  {
    id: 'trade_loss',
    category: 'meta',
    categoryLabel: 'Tendencias del Meta y Trading',
    symbol: 'L',
    name: 'Loss (Desfavorable)',
    desc: 'Usado en trading para clasificar qué tan desfavorable es un intercambio al recibir o dar ese objeto (pérdida).',
    color: '#ef4444',
    bg: 'rgba(239, 68, 68, 0.22)',
    border: 'rgba(239, 68, 68, 0.65)',
    type: 'badge'
  }
];

