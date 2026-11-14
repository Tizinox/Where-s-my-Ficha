/**
 * @file src/ui/mountAppUi.ts
 * Registra los controladores UI y monta la interfaz modular de la aplicación
 * antes de iniciar Alpine.js.
 */

import { type AlpineRegistry, registerUiControllers } from '@ui/controllers/uiControllers';
import { renderDynamicBg } from '@ui/layout/dynamicBg';
import { renderHeader } from '@ui/layout/header';
import { renderSidebar } from '@ui/layout/sidebar';
import { renderToasts } from '@ui/layout/toasts';
import { renderDashboardView } from '@ui/views/dashboard';
import { renderSettingsView } from '@ui/views/settings';
import { renderTierlistView } from '@ui/views/tierlist';
import { renderSheetSkeleton } from '@ui/views/sheetSkeleton';
import { renderUnifiedSheet } from '@ui/views/sheetUnified';
import { renderClassicSheet } from '@ui/views/sheetClassic';
import { renderGlobalModals } from '@ui/modals';

/**
 * Construye el HTML completo del contenedor #app.
 */
export function renderAppShellHtml(): string {
  return `
    ${renderDynamicBg()}
    ${renderHeader()}
    ${renderDashboardView()}
    ${renderSettingsView()}
    ${renderTierlistView()}
    ${renderSidebar()}

    <!-- =======================================================
       MAIN CONTENT — Contenedor y Pestañas de la Ficha
       ======================================================= -->
    <main id="app-content" role="main" aria-label="Contenido de la ficha" x-show="$store.app.activeView === 'editor'"
      x-cloak>

      ${renderSheetSkeleton()}

      <!-- Sin personaje activo -->
      <div x-show="!$store.characters.loading && !$store.characters.active" x-cloak class="empty-state">
        <i data-lucide="user" class="w-12 h-12"></i>
        <h2 class="font-title" style="font-size:1.5rem;color:var(--text-primary);">Ningún personaje seleccionado</h2>
        <p style="font-size:0.85rem;color:var(--text-muted);max-width:280px;text-align:center;">
          Crea una nueva ficha o selecciona un personaje desde el panel principal.</p>
        <button class="header-btn-accent mt-3" @click="$store.characters.createNew()">
          <i data-lucide="plus" class="w-4 h-4"></i>
          Crear Ficha
        </button>
      </div>

      <!-- Contenedor Principal de Ficha Actual (Hoja Física Integral Unificada) -->
      <template x-if="$store.characters.active && ($store.characters.active?.sheetType || 'unified') !== 'classic'">
        <div id="character-view-container" class="w-full" x-show="!$store.characters.loading && !$store.app.isSheetLoading" x-cloak>
          ${renderUnifiedSheet()}
        </div>
      </template>

      <!-- Contenedor Principal de Ficha Clásica (Rama main / Modular por Pestañas) -->
      <template x-if="$store.characters.active && $store.characters.active?.sheetType === 'classic'">
        ${renderClassicSheet()}
      </template>

    </main>`;
}

/**
 * Construye el HTML completo de modales globales y notificaciones toast.
 */
export function renderModalsRootHtml(): string {
  return `
    ${renderGlobalModals()}
    ${renderToasts()}`;
}

/**
 * Monta sincrónicamente la estructura de UI en el DOM antes de Alpine.start().
 */
export function mountAppUi(Alpine: AlpineRegistry, doc: Document = document): void {
  registerUiControllers(Alpine);

  const appRoot = doc.getElementById('app');
  if (appRoot) {
    appRoot.innerHTML = renderAppShellHtml();
  }

  const modalsRoot = doc.getElementById('modals-root');
  if (modalsRoot) {
    modalsRoot.innerHTML = renderModalsRootHtml();
  }
}

