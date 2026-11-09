/**
 * main.js — Punto de entrada principal
 * Registra stores, arranca Alpine.js e inicializa Lucide Icons y subsistemas.
 */

import Alpine from 'alpinejs';
import collapse from '@alpinejs/collapse';
import { appIcons, createIcons, initIconObserver } from './utils/icons.js';
import { ls } from './utils/storage.js';
import { globalTextFormatter } from './utils/textFormatterEngine.js';
import { multilineInputEngine } from './utils/multilineInputEngine.js';
import { emojiAutocompleteEngine } from './utils/emojiAutocompleteEngine.js';

import { registerAppStore } from './store/app.js';
import { registerCharactersStore } from './store/characters.js';
import { registerSettingsStore } from './store/settings.js';
import { registerDevConsoleStore } from './store/devConsole.js';
import { registerSteamFramesStore } from './store/steamFrames.js';
import { registerSteamAvatarsStore } from './store/steamAvatars.js';
import { registerSteamBadgesStore } from './store/steamBadges.js';
import { registerTierListStore } from './store/tierlist.js';
import { registerCustomEmojisStore } from './store/customEmojis.js';
import { registerSteamEmojisStore } from './store/steamEmojis.js';
import { bootScreen } from './utils/bootScreen.js';
import { settingsInteractiveGrid } from './utils/interactiveGridHero.js';
import { settingsMagneticRail } from './utils/magneticTabs.js';
import { initAnimateIconObserver } from './utils/animatedIconsBridge.js';
import { registerBgPanController } from './utils/bgPanController.js';
import { registerCyberColorPicker } from './utils/cyberColorPicker.js';

import 'cropperjs/dist/cropper.css';
import './style.css';

// ── 0. Funciones de arranque temprano (Boot Sequence) ─────────────────────────
function bootstrapFactoryReset() {
  const FACTORY_RESET_KEY = 'superficha_factory_clean_reset_v3';
  if (ls.get(FACTORY_RESET_KEY) !== 'done') {
    try {
      ls.keys().forEach(k => {
        if (k.startsWith('superficha_') || k === 'activeId') {
          ls.remove(k);
        }
      });
      ls.set(FACTORY_RESET_KEY, 'done');
      window.__NEEDS_FACTORY_RESET__ = true;
    } catch (e) {
      console.warn('[main] Error preparando factory reset:', e);
    }
  }
}

function bootstrapEarlyFavicon() {
  try {
    const savedFavicon = ls.get('sys_active_favicon');
    if (savedFavicon) {
      const link = document.querySelector("link[rel*='icon']");
      if (link) link.href = savedFavicon;
      const shortcut = document.querySelector("link[rel='shortcut icon']");
      if (shortcut) shortcut.href = savedFavicon;
    }
  } catch (e) {
    console.warn('[main] Error inyectando favicon activo inicial:', e);
  }
}

function bootstrapEarlyPlaceholders() {
  try {
    const saved = ls.getJSON('superficha_show_placeholders');
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
  createIcons
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

// Inicializar fondo dinámico interactivo (Skecher UI) para la vista de ajustes
settingsInteractiveGrid.init();

// Observador reactivo de activación/suspensión del grid interactivo y riel de píldora líquida
Alpine.effect(() => {
  const isSettingsActive = Alpine.store('app')?.activeView === 'settings';
  const isGridDisabled = Alpine.store('settings')?.disableSettingsInteractiveGrid;
  if (isSettingsActive && !isGridDisabled) {
    settingsInteractiveGrid.updateMetrics();
    settingsInteractiveGrid.wakeUp();

    // Inicializar y sincronizar el riel magnético con la pestaña activa
    setTimeout(() => {
      settingsMagneticRail.init();
      const currentSubTab = Alpine.store('settings')?.activeSubTab || 'identity';
      settingsMagneticRail.setActive(currentSubTab, false);
    }, 50);
  } else {
    settingsInteractiveGrid.sleep();
  }
});

// Observador para cambios de subpestaña en configuraciones
Alpine.effect(() => {
  const currentSubTab = Alpine.store('settings')?.activeSubTab;
  if (Alpine.store('app')?.activeView === 'settings' && currentSubTab) {
    settingsMagneticRail.setActive(currentSubTab, true);
  }
});

// Re-renderizar fondo al cambiar paletas de color en caliente
Alpine.effect(() => {
  const _rgb = Alpine.store('settings')?.rgbChannels;
  const _surface = Alpine.store('settings')?.surfaceColor;
  if (Alpine.store('app')?.activeView === 'settings') {
    settingsInteractiveGrid.draw();
  }
});

// ── 5. Lucide Icons y AnimateIcons — Observadores reactivos continuos ─────────
initIconObserver();
initAnimateIconObserver();

// ── 6. Salvaguarda de Persistencia: Auto-guardado al salir o cambiar de pestaña
const saveAllPendingNow = () => {
  try {
    window.globalTextFormatter?.syncAllEditorsToTextareas?.();
  } catch { }
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
  } catch { }
};

window.addEventListener('beforeunload', saveAllPendingNow);
window.addEventListener('pagehide', saveAllPendingNow);
window.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    saveAllPendingNow();
  }
});

// Prevenir que soltar archivos externos fuera de zonas designadas cause la navegación nativa del navegador
window.addEventListener('dragover', (e) => {
  if (e.dataTransfer?.types?.includes('Files')) {
    e.preventDefault();
  }
}, false);

window.addEventListener('drop', (e) => {
  if (e.dataTransfer?.types?.includes('Files')) {
    if (!e.target.closest?.('.tierlist-cyber-panel') && !e.target.closest?.('[data-allow-file-drop]')) {
      e.preventDefault();
    }
  }
}, false);
