/**
 * app/constants.ts
 * Definiciones canónicas y constantes globales de la aplicación.
 */

export interface TabDefinition {
  id: string;
  label: string;
  icon: string;
  order: number;
  isOptional?: boolean;
}

export const ALL_TABS: TabDefinition[] = [
  { id: 'basics', label: 'Datos Básicos', icon: 'id-card', order: 0 },
  { id: 'body', label: 'Cuerpo', icon: 'activity', order: 1 },
  { id: 'mind', label: 'Mente', icon: 'brain', order: 2 },
  { id: 'social', label: 'Social', icon: 'users-round', order: 3 },
  { id: 'beliefs', label: 'Creencias', icon: 'compass', order: 4 },
  { id: 'priorities', label: 'Prioridades', icon: 'list-todo', order: 5 },
  { id: 'skills', label: 'Habilidades', icon: 'zap', order: 6 },
  { id: 'weapons', label: 'Arsenal', icon: 'sword', order: 7 },
  { id: 'power', label: 'Power-Scaling', icon: 'gauge', order: 8 },
  { id: 'extras', label: 'Extras', icon: 'layers', order: 9 },
  { id: 'steam', label: 'Steam', icon: 'steam', order: 10, isOptional: true },
];

export const SYSTEM_TABS = ALL_TABS;
export const DEFAULT_ACTIVE_TABS = ALL_TABS.filter((t) => !t.isOptional).map((t) => t.id);

export const DEFAULT_RARITY_COLORS: Record<string, string> = {
  Común: '#9ca3af',
  'Poco Común': '#22c55e',
  Rara: '#38bdf8',
  Épica: '#a855f7',
  Legendaria: '#f59e0b',
  Mítica: '#f43f5e',
  'Única / Artefacto': '#ef4444',
};

