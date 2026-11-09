/**
 * store/app.js
 * Alpine.store('app') — Orquestador modular del estado global de la aplicación.
 *
 * Módulos desacoplados:
 * - app/constants.js: Pestañas canónicas y colores de rareza.
 * - app/navigation.js: Navegación, vistas principales, orden de pestañas, sidebar y diccionarios.
 * - app/export.js: Estación de exportación visual a imagen y formateador Discord WYSIWYG.
 * - app/mediaCropper.js: Recorte con Cropper.js, encuadre GIF y caché LRU de Blob Object URLs.
 * - app/modals.js: Motor de atajos de teclado, toasts, lightbox y modales de reinicio.
 */

import { 
  ALL_TABS, 
  SYSTEM_TABS, 
  DEFAULT_ACTIVE_TABS, 
  DEFAULT_RARITY_COLORS 
} from './app/constants.js';
import { getInitialExportOptions, createExportMethods } from './app/export.js';
import { createNavigationMethods } from './app/navigation.js';
import { createCropperMethods } from './app/mediaCropper.js';
import { createModalMethods } from './app/modals.js';

// Re-exportar para retrocompatibilidad total con cualquier importador externo
export {
  ALL_TABS,
  SYSTEM_TABS,
  DEFAULT_ACTIVE_TABS,
  DEFAULT_RARITY_COLORS,
  getInitialExportOptions
};

// ── Registro del store ───────────────────────────────────────────────────────
export function registerAppStore(Alpine) {
  const storeDefinition = {
    init() {
      this.loadSavedExportPreferences();
      this.loadSavedDiscordPreferences();

      // Pre-cargar datos estáticos de Power-Scaling en segundo plano sin bloquear el hilo principal
      if ('requestIdleCallback' in window) {
        window.requestIdleCallback(() => this.ensurePowerScalingLoaded?.());
      } else {
        setTimeout(() => this.ensurePowerScalingLoaded?.(), 1000);
      }
    }
  };

  const mixins = [
    createNavigationMethods(),
    createExportMethods(),
    createCropperMethods(),
    createModalMethods()
  ];

  for (const mixin of mixins) {
    Object.defineProperties(storeDefinition, Object.getOwnPropertyDescriptors(mixin));
  }

  Alpine.store('app', storeDefinition);
}
