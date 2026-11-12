/**
 * main.ts — Punto de entrada principal
 * Registra stores, arranca Alpine.js e inicializa Lucide Icons y subsistemas.
 */

import Alpine from 'alpinejs';
import collapse from '@alpinejs/collapse';
import { appIcons, createIcons, initIconObserver } from '@core/icons/icons.js';
import { initAnimateIconObserver } from '@core/icons/animatedIcons.ts';
import { ls } from '@core/db/storage.ts';
import { globalTextFormatter } from '@core/rich-text/textFormatterEngine.js';
import { multilineInputEngine } from '@core/rich-text/multilineInputEngine.js';
import { emojiAutocompleteEngine } from '@core/rich-text/emojiAutocompleteEngine.js';

import { registerAppStore } from '@app/app.store.js';
import { registerCharactersStore } from '@features/characters/characters.store.js';
import { registerSettingsStore } from '@features/settings/settings.store.js';
import { registerDevConsoleStore } from '@features/dev-console/devConsole.store.js';
import { registerSteamFramesStore } from '@features/steam/steamFrames.store.js';
import { registerSteamAvatarsStore } from '@features/steam/steamAvatars.store.js';
import { registerSteamBadgesStore } from '@features/steam/steamBadges.store.js';
import { registerTierListStore } from '@features/tierlist/tierlist.store.js';
import { registerCustomEmojisStore } from '@features/emojis/customEmojis.store.js';
import { registerSteamEmojisStore } from '@features/steam/steamEmojis.store.js';
import { bootScreen } from '@core/ui/bootScreen.js';
import { settingsInteractiveGrid } from '@core/ui/interactiveGridHero.js';
import { settingsMagneticRail } from '@core/ui/magneticTabs.js';
import { registerBgPanController } from '@core/media/bgPanController.js';
import { registerCyberColorPicker } from '@core/ui/cyberColorPicker.js';

import 'cropperjs/dist/cropper.css';
import '@ui/styles/main.css';

// ── 0. Funciones de arranque temprano (Boot Sequence) ─────────────────────────
function bootstrapFactoryReset(): void {
  const FACTORY_RESET_KEY = 'superficha_factory_clean_reset_v3';
  if (ls.get(FACTORY_RESET_KEY) !== 'done') {
    // Nunca borrar IndexedDB automáticamente si falta la clave en localStorage
    // (evita pérdida total de fichas cuando se limpia localStorage o cambia de perfil).
    ls.set(FACTORY_RESET_KEY, 'done');
  }
}

function bootstrapEarlyFavicon(): void {
  try {
    const savedFavicon = ls.get('sys_active_favicon');
    if (savedFavicon) {
      const link = document.querySelector<HTMLLinkElement>("link[rel*='icon']");
      if (link) link.href = savedFavicon;
      const shortcut = document.querySelector<HTMLLinkElement>("link[rel='shortcut icon']");
      if (shortcut) shortcut.href = savedFavicon;
    }
  } catch (e) {
    console.warn('[main] Error inyectando favicon activo inicial:', e);
  }
}

function bootstrapEarlyPlaceholders(): void {
  try {
    const saved = ls.getJSON<boolean>('superficha_show_placeholders');
    const show = saved !== null ? saved : true;
    const val = show ? 'true' : 'false';
    if (typeof document !== 'undefined') {
      if (document.documentElement) document.documentElement.setAttribute('data-show-placeholders', val);
      if (document.body) document.body.setAttribute('data-show-placeholders', val);
    }
  } catch (e) {
    console.warn('[main] Error configurando placeholders tempranos:', e);
  }
}

// Iniciar pantalla de arranque retro BIOS / CMD (Anti-FOUC)
bootScreen.init();
window.retriggerBiosBoot = () => bootScreen.init();

// Ejecutar inicialización temprana antes del render de Alpine
bootstrapFactoryReset();
bootstrapEarlyFavicon();
bootstrapEarlyPlaceholders();

// ── 1. Configurar Alpine y utilidades globales ────────────────────────────────
Alpine.plugin(collapse);
window.lucideIcons = appIcons;
window.lucide = {
  icons: appIcons,
  createIcons,
};
window.globalTextFormatter = globalTextFormatter;

// ── 2. Registrar stores reactivos de la aplicación ────────────────────────────
registerAppStore(Alpine);
registerCharactersStore(Alpine);
registerSettingsStore(Alpine);
registerDevConsoleStore(Alpine);
registerSteamFramesStore(Alpine);
registerSteamAvatarsStore(Alpine);
registerSteamBadgesStore(Alpine);
registerTierListStore(Alpine);
registerCustomEmojisStore(Alpine);
registerSteamEmojisStore(Alpine);
registerBgPanController(Alpine);
registerCyberColorPicker(Alpine);

// ── 3. Arrancar Alpine ────────────────────────────────────────────────────────
window.Alpine = Alpine;
window.settingsInteractiveGrid = settingsInteractiveGrid;
window.settingsMagneticRail = settingsMagneticRail;
Alpine.start();

// ── 4. Inicializar motores auxiliares ─────────────────────────────────────────
Alpine.store('app')?.initHotkeys?.();
Alpine.store('app')?.initSidebar?.();
Alpine.store('tierlist')?.init?.();
globalTextFormatter.init();
multilineInputEngine.init();
emojiAutocompleteEngine.init();

// Inicializar fondo dinámico interactivo para la vista de ajustes
settingsInteractiveGrid.init();

Alpine.effect(() => {
  const isSettingsActive = Alpine.store('app')?.activeView === 'settings';
  const isGridDisabled = Alpine.store('settings')?.disableSettingsInteractiveGrid;
  if (isSettingsActive && !isGridDisabled) {
    settingsInteractiveGrid.updateMetrics();
    settingsInteractiveGrid.wakeUp();

    setTimeout(() => {
      settingsMagneticRail.init();
      const currentSubTab = Alpine.store('settings')?.activeSubTab || 'identity';
      settingsMagneticRail.setActive(currentSubTab, false);
    }, 50);
  } else {
    settingsInteractiveGrid.sleep();
  }
});

Alpine.effect(() => {
  const currentSubTab = Alpine.store('settings')?.activeSubTab;
  if (Alpine.store('app')?.activeView === 'settings' && currentSubTab) {
    settingsMagneticRail.setActive(currentSubTab, true);
  }
});

Alpine.effect(() => {
  const _rgb = Alpine.store('settings')?.rgbChannels;
  const _surface = Alpine.store('settings')?.surfaceColor;
  if (Alpine.store('app')?.activeView === 'settings') {
    settingsInteractiveGrid.draw();
  }
});

// ── 5. Lucide Icons y Animaciones SVG nativas ─────────────────────────────────
initIconObserver();
initAnimateIconObserver();

// ── 6. Salvaguarda de Persistencia ────────────────────────────────────────────
const saveAllPendingNow = (): void => {
  try {
    window.globalTextFormatter?.syncAllEditorsToTextareas?.();
  } catch {}
  const charStore = window.Alpine?.store?.('characters');
  if (charStore) {
    charStore.saveIfPendingSync?.();
    charStore.saveIfPending?.();
  }
  const tierStore = window.Alpine?.store?.('tierlist');
  if (tierStore) {
    tierStore.saveState?.(true);
  }
  const settingsStore = window.Alpine?.store?.('settings');
  if (settingsStore) {
    settingsStore.saveGlobalSettings?.();
    settingsStore.saveDashboardBgSettings?.(true);
    settingsStore.saveTierlistBgSettings?.(true);
  }
  try {
    window.Alpine?.store?.('app')?.saveNavigationState?.();
  } catch {}
};

window.addEventListener('beforeunload', saveAllPendingNow);
window.addEventListener('pagehide', saveAllPendingNow);
window.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    saveAllPendingNow();
  }
});

window.addEventListener(
  'dragover',
  (e) => {
    if (e.dataTransfer?.types?.includes('Files')) {
      e.preventDefault();
    }
  },
  false
);

window.addEventListener(
  'drop',
  (e) => {
    const target = e.target as Element | null;
    if (e.dataTransfer?.types?.includes('Files')) {
      if (!target?.closest?.('.tierlist-cyber-panel') && !target?.closest?.('[data-allow-file-drop]')) {
        e.preventDefault();
      }
    }
  },
  false
);

