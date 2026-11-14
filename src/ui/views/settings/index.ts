/**
 * @file src/ui/views/settings/index.ts
 * Vista principal de Configuración estilo Discord / Notion (Menú lateral + 1 columna).
 */

import { type SettingsNavItemConfig, renderSettingsNavItem } from '@ui/components/uiPrimitives';
import { renderSettingsIdentity } from './settingsIdentity';
import { renderSettingsPresets } from './settingsPresets';
import { renderSettingsEnvironment } from './settingsEnvironment';
import { renderSettingsEmojis } from './settingsEmojis';
import { renderSettingsData } from './settingsData';
import { renderSettingsExtras } from './settingsExtras';

interface SettingsNavGroup {
  sectionLabel: string;
  items: SettingsNavItemConfig[];
}

const SETTINGS_NAV_GROUPS: SettingsNavGroup[] = [
  {
    sectionLabel: 'Personalización',
    items: [
      { subTab: 'identity', icon: 'palette', label: 'Apariencia' },
      { subTab: 'presets', icon: 'sparkles', label: 'Temas y Kits' },
      { subTab: 'environment', icon: 'image', label: 'Fondos' },
    ],
  },
  {
    sectionLabel: 'Contenido y Datos',
    items: [
      { subTab: 'emojis', icon: 'smile', label: 'Emojis' },
      { subTab: 'data', icon: 'database', label: 'Copias de Seguridad' },
    ],
  },
  {
    sectionLabel: 'Aplicación',
    items: [
      { subTab: 'extras', icon: 'sliders', label: 'Tier List y Sistema' },
    ],
  },
];

const SETTINGS_PANELS = [
  { subTab: 'identity', render: renderSettingsIdentity },
  { subTab: 'presets', render: renderSettingsPresets },
  { subTab: 'environment', render: renderSettingsEnvironment },
  { subTab: 'emojis', render: renderSettingsEmojis },
  { subTab: 'data', render: renderSettingsData },
  { subTab: 'extras', render: renderSettingsExtras },
] as const;

function renderSettingsSidebar(): string {
  const navGroupsHtml = SETTINGS_NAV_GROUPS.map(
    (group) => `
            <div class="wiki-settings-nav-label">${group.sectionLabel}</div>${group.items.map(renderSettingsNavItem).join('')}`,
  ).join('\n');

  return `
        <aside class="wiki-settings-sidebar" aria-label="Menú de configuración">
          <nav class="wiki-settings-nav" role="tablist">${navGroupsHtml}
          </nav>
        </aside>`;
}

export function renderSettingsView(): string {
  const panelsHtml = SETTINGS_PANELS.map(
    (panel) => `
          <div x-show="$store.settings.activeSubTab === '${panel.subTab}'">
            ${panel.render()}
          </div>`,
  ).join('\n');

  return `<!-- VISTA PRINCIPAL: CONFIGURACIÓN ESTILO DISCORD / NOTION -->
<main id="main-settings-view"
  x-show="$store.app.activeView === 'settings'"
  x-cloak
  @mousemove="window.settingsInteractiveGrid?.handlePointerMove($event)"
  @mouseleave="window.settingsInteractiveGrid?.handlePointerLeave()"
  @keydown.escape.window="if ($store.app.activeView === 'settings') $store.settings.closeModal()"
  class="settings-fullscreen-view"
  role="region"
  aria-label="Configuración del Sistema">

  <!-- Lienzo de cuadrícula interactiva reactiva al puntero (Configuración) -->
  <div id="settings-interactive-grid-container"
    x-show="$store.app.activeView === 'settings' && !$store.settings.disableSettingsInteractiveGrid"
    aria-hidden="true">
    <canvas id="settings-interactive-grid-canvas"></canvas>
  </div>

  <template x-if="$store.app.isViewVisited('settings')">
    <div class="wiki-shell">

      <!-- CABECERA SOBRIA -->
      <header class="wiki-settings-header">
        <div class="wiki-settings-title-group">
          <h1 class="wiki-settings-title">Configuración</h1>
          <kbd class="wiki-settings-kbd">Ctrl + ,</kbd>
        </div>

        <button type="button"
          @click="$store.settings.closeModal()"
          class="souls-btn"
          aria-label="Volver">
          <i data-lucide="arrow-left" class="w-3.5 h-3.5"></i>
          <span x-text="$store.app.previousView === 'tierlist' ? 'Volver a Tier List' : ($store.app.previousView === 'editor' && $store.characters.active ? 'Volver a la Ficha' : 'Volver al Panel')"></span>
        </button>
      </header>

      <!-- CUERPO: MENÚ LATERAL + CONTENIDO -->
      <div class="wiki-settings-layout">
        ${renderSettingsSidebar()}

        <div class="wiki-settings-content">
          ${panelsHtml}

          <!-- Pie de acciones -->
          <footer class="wiki-settings-footer">
            <button type="button"
              @click="$store.settings.resetToDefault()"
              class="souls-btn souls-btn-danger"
              title="Restaura colores, fuentes y fondos predeterminados">
              <i data-lucide="rotate-ccw" class="w-3.5 h-3.5"></i>
              <span>Restaurar valores iniciales</span>
            </button>

            <div class="flex flex-wrap items-center gap-2 ml-auto">
              <button type="button"
                @click="$store.settings.saveAsGlobalDefault()"
                class="souls-btn"
                title="Guarda tu apariencia actual como tema por defecto">
                <i data-lucide="save" class="w-3.5 h-3.5"></i>
                <span>Guardar como predeterminado</span>
              </button>

              <button type="button"
                @click="$store.settings.applyAndCloseModal()"
                class="souls-btn souls-btn-primary">
                <i data-lucide="check" class="w-3.5 h-3.5"></i>
                <span>Aplicar y Salir</span>
              </button>
            </div>
          </footer>
        </div>

      </div>
    </div>
  </template>
</main>`;
}

