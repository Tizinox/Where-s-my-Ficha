/**
 * store/app/navigation.js
 * Submódulo de navegación, pestañas, vistas principales, sidebar y diccionarios de juego.
 */

import { ALL_TABS, DEFAULT_ACTIVE_TABS, DEFAULT_RARITY_COLORS } from './constants.js';
import { ALIGNMENTS_DICT } from '../../utils/alignments.js';
import {
  RPG_CLASSES_DICT,
  RPG_CLASSES_CATEGORIES,
  FGC_ARCHETYPES_DICT,
  FGC_ARCHETYPES_CATEGORIES
} from '../../utils/charClasses.js';
import {
  POWER_SCALING_DICT,
  POWER_SCALING_LABELS,
  OVERALL_TIER_OPTIONS,
  AP_OPTIONS,
  DC_OPTIONS,
  STRIKING_STRENGTH_OPTIONS,
  DURABILITY_OPTIONS,
  SPEED_OPTIONS,
  LIFTING_STRENGTH_OPTIONS,
  RANGE_OPTIONS,
  IQ_OPTIONS,
  BIQ_OPTIONS,
  INTELLIGENCE_OPTIONS,
  STAMINA_OPTIONS,
  RESISTANCE_PRESETS,
  loadPowerScalingData
} from '../../utils/powerScalingDict.js';
import { DISCORD_SEPARATORS, DISCORD_SECTIONS } from '../../utils/exportEngine.js';
import { ls } from '../../utils/storage.js';

export function createNavigationMethods() {
  return {
    ALL_TABS,
    SYSTEM_TABS: ALL_TABS,
    DISCORD_SEPARATORS,
    DISCORD_SECTIONS,

    // ── Diccionario de Alineaciones Morales ─────────────────
    alignments: ALIGNMENTS_DICT,

    // ── Diccionario de Clases / Arquetipos (Canónicos) ─────
    rpgClasses: RPG_CLASSES_DICT,
    rpgClassesCategories: RPG_CLASSES_CATEGORIES,
    fgcArchetypes: FGC_ARCHETYPES_DICT,
    fgcArchetypesCategories: FGC_ARCHETYPES_CATEGORIES,

    // Aliases retrocompatibles (redirigidos a las propiedades canónicas)
    get charClasses() { return this.rpgClasses; },
    get charClassesCategories() { return this.rpgClassesCategories; },
    get fgcStyles() { return this.fgcArchetypes; },
    get fgcStylesCategories() { return this.fgcArchetypesCategories; },

    // ── Diccionario de Rarezas de Armas y Colores ──────────
    defaultRarityColors: DEFAULT_RARITY_COLORS,

    getWeaponRarityColor(weapon) {
      if (!weapon) return '#9ca3af';
      if (weapon.rarityColor && typeof weapon.rarityColor === 'string' && weapon.rarityColor.trim()) {
        return weapon.rarityColor.trim();
      }
      const r = weapon.rarity || 'Común';
      return DEFAULT_RARITY_COLORS[r] || '#38bdf8';
    },

    hexToRgba(hex, alpha = 0.2) {
      if (!hex || typeof hex !== 'string') return `rgba(156, 163, 175, ${alpha})`;
      let cleanHex = hex.trim().replace(/^#/, '');
      if (cleanHex.length === 3) {
        cleanHex = cleanHex.split('').map(c => c + c).join('');
      }
      if (cleanHex.length !== 6) return `rgba(156, 163, 175, ${alpha})`;
      const num = parseInt(cleanHex, 16);
      if (isNaN(num)) return `rgba(156, 163, 175, ${alpha})`;
      const r = (num >> 16) & 255;
      const g = (num >> 8) & 255;
      const b = num & 255;
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    },

    // ── Diccionario de Power-Scaling (VS Battles y CSAP) ────────────
    isPowerScalingLoaded: false,
    powerScalingDict: POWER_SCALING_DICT,
    powerScalingLabels: POWER_SCALING_LABELS,
    powerOptions: {
      overallTier: OVERALL_TIER_OPTIONS,
      ap: AP_OPTIONS,
      dc: DC_OPTIONS,
      strikingStrength: STRIKING_STRENGTH_OPTIONS,
      durability: DURABILITY_OPTIONS,
      speed: SPEED_OPTIONS,
      liftingStrength: LIFTING_STRENGTH_OPTIONS,
      range: RANGE_OPTIONS,
      iq: IQ_OPTIONS,
      biq: BIQ_OPTIONS,
      intelligence: INTELLIGENCE_OPTIONS,
      stamina: STAMINA_OPTIONS,
      resistancePresets: RESISTANCE_PRESETS,
    },
    activeTelemetry: null, // { key, category, desc }

    async ensurePowerScalingLoaded() {
      if (this.isPowerScalingLoaded) return;
      const data = await loadPowerScalingData();
      if (data) {
        this.powerScalingDict = { ...data.POWER_SCALING_DICT };
        this.powerScalingLabels = { ...data.POWER_SCALING_LABELS };
        this.powerOptions = {
          overallTier: [...(data.OVERALL_TIER_OPTIONS || [])],
          ap: [...(data.AP_OPTIONS || [])],
          dc: [...(data.DC_OPTIONS || [])],
          strikingStrength: [...(data.STRIKING_STRENGTH_OPTIONS || [])],
          durability: [...(data.DURABILITY_OPTIONS || [])],
          speed: [...(data.SPEED_OPTIONS || [])],
          liftingStrength: [...(data.LIFTING_STRENGTH_OPTIONS || [])],
          range: [...(data.RANGE_OPTIONS || [])],
          iq: [...(data.IQ_OPTIONS || [])],
          biq: [...(data.BIQ_OPTIONS || [])],
          intelligence: [...(data.INTELLIGENCE_OPTIONS || [])],
          stamina: [...(data.STAMINA_OPTIONS || [])],
          resistancePresets: [...(data.RESISTANCE_PRESETS || [])],
        };
        this.isPowerScalingLoaded = true;
      }
    },

    async setTelemetry(key, category = '') {
      await this.ensurePowerScalingLoaded();
      if (!key || !this.powerScalingDict[key]) {
        this.activeTelemetry = null;
        return;
      }
      this.activeTelemetry = {
        key,
        category,
        desc: this.powerScalingDict[key],
      };
    },

    clearTelemetry() {
      this.activeTelemetry = null;
    },

    // ── Modo edición / vista previa ─────────────────────────
    editMode: true,

    toggleEditMode() {
      window.globalTextFormatter?.syncAllEditorsToTextareas?.();
      window.Alpine?.store('characters')?.saveIfPending?.();
      this.editMode = !this.editMode;
      this.saveNavigationState();
      this.toast(
        this.editMode ? 'Modo edición activado' : 'Modo vista previa activado',
        this.editMode ? 'info' : 'success'
      );
      setTimeout(() => {
        window.globalTextFormatter?.syncAllEditorsFromTextareas?.();
        window.globalTextFormatter?.formatPreviewElements?.();
      }, 30);
    },

    // ── Dimensiones del Sidebar y Redimensión (Arrastrar para Expandir) ──
    sidebarWidth: 220,
    isResizingSidebar: false,

    initSidebar() {
      const saved = ls.get('superficha_sidebar_width');
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed)) {
          this.sidebarWidth = Math.min(480, Math.max(170, parsed));
        }
      }
      document.documentElement.style.setProperty('--sidebar-width', `${this.sidebarWidth}px`);
    },

    setSidebarWidth(width) {
      this.sidebarWidth = Math.min(480, Math.max(170, Math.round(width)));
      document.documentElement.style.setProperty('--sidebar-width', `${this.sidebarWidth}px`);
      ls.set('superficha_sidebar_width', String(this.sidebarWidth));
    },

    resetSidebarWidth() {
      // Alterna entre ancho estándar (220px) y ancho expandido (290px) con doble clic
      if (this.sidebarWidth > 230) {
        this.setSidebarWidth(220);
      } else {
        this.setSidebarWidth(290);
      }
    },

    startSidebarResize(e) {
      e.preventDefault();
      this.isResizingSidebar = true;
      const startX = e.clientX;
      const startWidth = this.sidebarWidth || 220;

      document.body.classList.add('is-resizing-sidebar');

      const onMouseMove = (moveEvent) => {
        const deltaX = moveEvent.clientX - startX;
        const newWidth = Math.min(480, Math.max(170, startWidth + deltaX));
        this.setSidebarWidth(newWidth);
      };

      const onMouseUp = () => {
        this.isResizingSidebar = false;
        document.body.classList.remove('is-resizing-sidebar');
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
      };

      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    },

    // ── Pestañas activas y Renderizado Diferido (Lazy Tabs) ───────
    currentTab: 'basics',
    visitedTabs: ['basics'],
    visitedViews: ['dashboard', 'editor'],

    isTabVisited(id) {
      if (!this.visitedTabs) this.visitedTabs = ['basics'];
      if (id === this.currentTab && !this.visitedTabs.includes(id)) {
        this.visitedTabs.push(id);
      }
      return this.visitedTabs.includes(id);
    },

    isViewVisited(view) {
      if (!this.visitedViews) this.visitedViews = ['dashboard', 'editor'];
      if (view === this.activeView && !this.visitedViews.includes(view)) {
        this.visitedViews.push(view);
      }
      return this.visitedViews.includes(view);
    },

    tabsVersion: 0,
    showAddTabMenu: false,
    openCreateCustomTabModal(tabId = null) {
      this.showAddTabMenu = false;
      window.Alpine?.store('characters')?.openCreateCustomTabModal?.(tabId);
    },
    draggedTabIndex: null,
    dragOverTabIndex: null,
    dragOverPosition: null, // 'before' | 'after'
    _isDraggingTab: false,
    activeTabs: [...DEFAULT_ACTIVE_TABS],

    get allAvailableTabObjects() {
      const char = window.Alpine?.store('characters')?.active;
      const customTabs = Array.isArray(char?.customTabs) ? char.customTabs : [];
      return [
        ...ALL_TABS,
        ...customTabs.map(ct => ({
          id: ct.id,
          label: ct.label || 'Nueva Sección',
          icon: ct.icon || 'layers',
          isCustom: true,
          accentColor: ct.accentColor,
          description: ct.description
        }))
      ];
    },

    get activeTabObjects() {
      const _ = this.tabsVersion;
      const currentActiveTabs = Array.isArray(this.activeTabs) ? this.activeTabs : [];
      const allTabs = this.allAvailableTabObjects;
      return currentActiveTabs
        .map(id => allTabs.find(t => t.id === id))
        .filter(Boolean);
    },

    get hiddenTabObjects() {
      const _ = this.tabsVersion;
      const currentActiveTabs = Array.isArray(this.activeTabs) ? this.activeTabs : [];
      const allTabs = this.allAvailableTabObjects;
      return allTabs.filter(t => !currentActiveTabs.includes(t.id));
    },

    setTab(id) {
      if (this._isDraggingTab) return;
      if (!this.activeTabs.includes(id)) return;
      if (this.currentTab === id) return;

      // 1. Sincronizar editor activo si tiene foco sin escanear síncronamente todo el DOM
      window.globalTextFormatter?.syncActiveEditor?.();
      window.Alpine?.store('characters')?.saveIfPending?.();

      const isFirstVisit = !this.visitedTabs.includes(id);
      if (isFirstVisit) {
        this.visitedTabs.push(id);
      }

      this.currentTab = id;

      if (id === 'power') {
        this.ensurePowerScalingLoaded?.();
      }

      // 2. Desacoplar animación con requestAnimationFrame para garantizar 60 FPS estables sin tirones
      requestAnimationFrame(() => {
        this._animateTabChange();
      });

      // 3. Guardado diferido en localStorage evitando bloqueo de I/O síncrono durante la interacción
      this.scheduleSaveNavigationState();
    },

    reorderTabs(fromIndex, toIndex) {
      const charStore = window.Alpine?.store('characters');
      const char = charStore?.active;

      const currentActive = [...(this.activeTabs || char?.activeTabs || [])];
      if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) return;
      if (fromIndex >= currentActive.length || toIndex >= currentActive.length) return;

      if (charStore && typeof charStore.pushUndoSnapshot === 'function') {
        charStore.pushUndoSnapshot('Reordenar secciones');
      }

      const [movedId] = currentActive.splice(fromIndex, 1);
      currentActive.splice(toIndex, 0, movedId);

      // Actualizar el array reactivo en app store y en el objeto de personaje
      this.activeTabs = [...currentActive];
      if (char) {
        char.activeTabs = [...currentActive];
      }
      this.tabsVersion++;

      if (char && typeof charStore?._persist === 'function') {
        charStore._persist(char);
      }
      if (typeof charStore?.scheduleAutoSave === 'function') {
        charStore.scheduleAutoSave();
      }
      this.saveNavigationState();

      const movedTab = ALL_TABS.find(t => t.id === movedId);
      this.toast(`Sección "${movedTab?.label || movedId}" reordenada.`, 'info');
    },

    moveTabUp(index) {
      if (index > 0) {
        this.reorderTabs(index, index - 1);
      }
    },

    moveTabDown(index) {
      if (index < (this.activeTabs || []).length - 1) {
        this.reorderTabs(index, index + 1);
      }
    },

    onSidebarDrop(e) {
      if (!this.editMode || this.draggedTabIndex === null) return;
      if (!e.target.closest('.tab-btn')) {
        const fromIndex = this.draggedTabIndex;
        const toIndex = (this.activeTabs || []).length - 1;
        if (fromIndex !== toIndex) {
          this.reorderTabs(fromIndex, toIndex);
        }
        this.endTabDrag();
      }
    },

    startTabDrag(e, index) {
      if (!this.editMode) return;
      this.draggedTabIndex = index;
      this._isDraggingTab = true;
      e.dataTransfer.effectAllowed = 'move';
      const tabId = this.activeTabs[index];
      try {
        e.dataTransfer.setData('text/plain', tabId || String(index));
      } catch { }
    },

    onTabDragOver(e, index) {
      if (!this.editMode || this.draggedTabIndex === null) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';

      const rect = e.currentTarget.getBoundingClientRect();
      const midY = rect.top + rect.height / 2;
      const pos = e.clientY < midY ? 'before' : 'after';

      this.dragOverTabIndex = index;
      this.dragOverPosition = pos;
    },

    onTabDragLeave(e, index) {
      if (this.dragOverTabIndex === index) {
        const rect = e.currentTarget.getBoundingClientRect();
        if (e.clientY < rect.top || e.clientY >= rect.bottom || e.clientX < rect.left || e.clientX >= rect.right) {
          this.dragOverTabIndex = null;
          this.dragOverPosition = null;
        }
      }
    },

    onTabDrop(e, targetIndex) {
      if (!this.editMode || this.draggedTabIndex === null) return;
      e.preventDefault();

      const fromIndex = this.draggedTabIndex;
      let toIndex = targetIndex;

      if (this.dragOverPosition === 'after') {
        toIndex = fromIndex < targetIndex ? targetIndex : targetIndex + 1;
      } else if (this.dragOverPosition === 'before') {
        toIndex = fromIndex < targetIndex ? targetIndex - 1 : targetIndex;
      }

      toIndex = Math.max(0, Math.min(toIndex, this.activeTabs.length - 1));

      if (fromIndex !== toIndex) {
        this.reorderTabs(fromIndex, toIndex);
      }

      this.endTabDrag();
    },

    endTabDrag() {
      this.draggedTabIndex = null;
      this.dragOverTabIndex = null;
      this.dragOverPosition = null;
      setTimeout(() => {
        this._isDraggingTab = false;
      }, 80);
    },

    removeTab(id) {
      const charStore = window.Alpine?.store('characters');
      const char = charStore?.active;

      const currentActive = [...(this.activeTabs || char?.activeTabs || [])];
      if (currentActive.length <= 1) {
        this.toast('Debe quedar al menos una sección activa.', 'warning');
        return;
      }

      if (charStore && typeof charStore.pushUndoSnapshot === 'function') {
        charStore.pushUndoSnapshot('Ocultar sección');
      }

      const newTabs = currentActive.filter(t => t !== id);
      this.activeTabs = [...newTabs];
      if (char) {
        char.activeTabs = [...newTabs];
      }
      this.tabsVersion++;

      if (char && typeof charStore?._persist === 'function') {
        charStore._persist(char);
      }
      if (typeof charStore?.scheduleAutoSave === 'function') {
        charStore.scheduleAutoSave();
      }

      if (this.currentTab === id) {
        this.setTab(newTabs[0] || 'basics');
      }
      this.saveNavigationState();

      const tab = this.allAvailableTabObjects.find(t => t.id === id) || ALL_TABS.find(t => t.id === id);
      this.toast(`Sección "${tab?.label || id}" oculta.`, 'info');
    },

    addTab(id) {
      const charStore = window.Alpine?.store('characters');
      const char = charStore?.active;

      const currentActive = [...(this.activeTabs || char?.activeTabs || [])];
      if (!currentActive.includes(id)) {
        if (charStore && typeof charStore.pushUndoSnapshot === 'function') {
          charStore.pushUndoSnapshot('Añadir sección');
        }

        const newTabs = [...currentActive, id];
        this.activeTabs = [...newTabs];
        if (char) {
          char.activeTabs = [...newTabs];
        }
        this.tabsVersion++;

        if (!this.visitedTabs.includes(id)) {
          this.visitedTabs.push(id);
        }
        this.currentTab = id;
        this.showAddTabMenu = false;
        if (id === 'power') {
          this.ensurePowerScalingLoaded?.();
        }

        if (char && typeof charStore?._persist === 'function') {
          charStore._persist(char);
        }
        if (typeof charStore?.scheduleAutoSave === 'function') {
          charStore.scheduleAutoSave();
        }
        this.saveNavigationState();

        const tab = this.allAvailableTabObjects.find(t => t.id === id) || ALL_TABS.find(t => t.id === id);
        this.toast(`Sección "${tab?.label || id}" añadida.`, 'success');
        this._animateTabChange();
      }
    },

    _animateTabChange() {
      const el = document.getElementById('tab-content');
      if (!el) return;
      // Cancelar animaciones previas para evitar colisiones entre clics rápidos
      if (typeof el.getAnimations === 'function') {
        el.getAnimations().forEach(anim => anim.cancel());
      }
      if (typeof el.animate === 'function') {
        el.animate([
          { opacity: 0.25, transform: 'translateY(4px)' },
          { opacity: 1, transform: 'translateY(0px)' }
        ], {
          duration: 160,
          easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
          fill: 'both'
        });
      }
    },

    // ── Pre-calentamiento progresivo de pestañas en segundo plano (Zero-Stutter Navigation) ───────
    _warmupRunning: false,
    _warmupTimer: null,
    warmupTabs() {
      if (typeof window === 'undefined') return;
      if (this._warmupTimer) clearTimeout(this._warmupTimer);

      this._warmupTimer = setTimeout(() => {
        if (this.activeView !== 'editor') return;
        const charStore = window.Alpine?.store('characters');
        if (!charStore?.active) return;

        const queue = (this.activeTabs || []).filter(id => !this.visitedTabs.includes(id));
        if (queue.length === 0) return;

        this._warmupRunning = true;
        const warmNext = (idx = 0) => {
          if (this.activeView !== 'editor') {
            this._warmupRunning = false;
            return;
          }
          if (idx >= queue.length) {
            this._warmupRunning = false;
            return;
          }
          const tabId = queue[idx];
          const schedule = window.requestIdleCallback || ((cb) => setTimeout(cb, 100));
          schedule(() => {
            if (this.activeView !== 'editor') {
              this._warmupRunning = false;
              return;
            }
            if (!this.visitedTabs.includes(tabId) && (this.activeTabs || []).includes(tabId)) {
              this.visitedTabs.push(tabId);
            }
            // Breve respiro de 75ms para no saturar nunca el thread principal
            setTimeout(() => warmNext(idx + 1), 75);
          }, { timeout: 1500 });
        };

        warmNext(0);
      }, 350);
    },

    // ── Estado de navegación y Memoria de Sesión (Persistencia en F5) ───────
    activeView: 'dashboard', // 'dashboard' | 'editor' | 'settings' | 'tierlist'
    previousView: 'dashboard',
    isSheetLoading: false,
    _sheetLoadingTimer: null,
    _saveNavTimer: null,

    scheduleSaveNavigationState() {
      if (this._saveNavTimer) clearTimeout(this._saveNavTimer);
      this._saveNavTimer = setTimeout(() => {
        this._saveNavTimer = null;
        this.saveNavigationState();
      }, 250);
    },

    saveNavigationState() {
      const charStore = window.Alpine?.store('characters');
      const settingsStore = window.Alpine?.store('settings');
      const state = {
        activeView: this.activeView || 'dashboard',
        previousView: this.previousView || 'dashboard',
        activeCharId: charStore?.activeId || null,
        currentTab: this.currentTab || 'basics',
        editMode: typeof this.editMode === 'boolean' ? this.editMode : true,
        activeSubTab: settingsStore?.activeSubTab || 'identity'
      };
      ls.setJSON('superficha_last_nav_location', state);
    },

    restoreNavigationState() {
      const nav = ls.getJSON('superficha_last_nav_location');
      if (!nav || typeof nav !== 'object') return;

      const charStore = window.Alpine?.store('characters');
      const settingsStore = window.Alpine?.store('settings');

      // 1. Restaurar personaje activo si existe en la lista
      if (nav.activeCharId && charStore?.list?.some(c => c.id === nav.activeCharId)) {
        charStore.activeId = nav.activeCharId;
        if (charStore.active) {
          charStore.syncTabsToApp(charStore.active);
        }
      }

      // 2. Restaurar pestaña activa si está habilitada
      if (nav.currentTab && this.activeTabs?.includes(nav.currentTab)) {
        this.currentTab = nav.currentTab;
        if (this.currentTab === 'power') {
          this.ensurePowerScalingLoaded?.();
        }
      }

      // 3. Restaurar modo de edición / lectura
      if (typeof nav.editMode === 'boolean') {
        this.editMode = nav.editMode;
      }

      // 4. Restaurar subpestaña de configuración
      if (nav.activeSubTab && settingsStore) {
        settingsStore.activeSubTab = nav.activeSubTab;
      }

      // 5. Restaurar vista principal
      if (nav.activeView === 'settings') {
        this.previousView = (nav.previousView === 'editor' && charStore?.active) ? 'editor' : 'dashboard';
        this.activeView = 'settings';
      } else if (nav.activeView === 'tierlist') {
        this.previousView = 'dashboard';
        this.activeView = 'tierlist';
      } else if (nav.activeView === 'editor' && charStore?.active) {
        this.previousView = 'dashboard';
        this.activeView = 'editor';
        if (this.currentTab === 'power') {
          this.ensurePowerScalingLoaded?.();
        }
      } else {
        this.activeView = 'dashboard';
      }
    },

    openDashboardView() {
      try {
        window.Alpine?.store('settings')?.forceCloseAllModals?.();
      } catch (e) { }

      // 1. Sincronizar y limpiar editor activo y selecciones de texto
      try {
        window.globalTextFormatter?.syncActiveEditor?.();
        if (document.activeElement && typeof document.activeElement.blur === 'function') {
          const tag = document.activeElement.tagName;
          if (tag === 'INPUT' || tag === 'TEXTAREA' || document.activeElement.isContentEditable) {
            document.activeElement.blur();
          }
        }
        const sel = window.getSelection?.();
        if (sel && sel.rangeCount > 0) {
          sel.removeAllRanges();
        }
      } catch (e) { }

      // 2. Persistir cambios pendientes y podar pools de memoria
      try {
        const charStore = window.Alpine?.store('characters');
        charStore?.saveIfPending?.();
        if (typeof charStore?.pruneUndoImagePool === 'function') {
          charStore.pruneUndoImagePool(charStore.undoStack, charStore.redoStack);
        }
      } catch (e) { }

      // 3. Cancelar tareas de calentamiento de pestañas en segundo plano
      if (this._warmupTimer) {
        clearTimeout(this._warmupTimer);
        this._warmupTimer = null;
      }
      this._warmupRunning = false;

      // Mantener visitedTabs intacto al cambiar de vista para evitar la destrucción masiva
      // del DOM y los picos de congelamiento por Garbage Collection (>500ms).
      this.previousView = this.activeView === 'settings' ? this.previousView : this.activeView;
      this.activeView = 'dashboard';
      this.saveNavigationState();
    },

    openTierListView() {
      try {
        window.Alpine?.store('settings')?.forceCloseAllModals?.();
      } catch (e) { }
      this.previousView = this.activeView === 'settings' ? this.previousView : this.activeView;
      this.activeView = 'tierlist';
      this.saveNavigationState();
    },

    closeTierListView() {
      this.openDashboardView();
    },

    openEditorView(charId = null) {
      try {
        window.Alpine?.store('settings')?.forceCloseAllModals?.();
      } catch (e) { }
      if (charId) {
        const charStore = window.Alpine?.store('characters');
        if (charStore && typeof charStore.selectActive === 'function') {
          charStore.selectActive(charId);
        }
      }
      this.previousView = this.activeView === 'settings' ? this.previousView : this.activeView;
      this.activeView = 'editor';
      this.warmupTabs();
      this.isSheetLoading = true;
      if (this._sheetLoadingTimer) clearTimeout(this._sheetLoadingTimer);
      this._sheetLoadingTimer = setTimeout(() => {
        this.isSheetLoading = false;
      }, 240);
      this.saveNavigationState();
    },

    openSettingsView(subTab = null) {
      try {
        window.Alpine?.store('settings')?.forceCloseAllModals?.();
        if (subTab && window.Alpine?.store('settings')) {
          window.Alpine.store('settings').activeSubTab = subTab;
        }
      } catch (e) { }
      if (this.activeView !== 'settings') {
        this.previousView = this.activeView;
      }
      this.activeView = 'settings';
      this.saveNavigationState();
    },

    closeSettingsView() {
      if (this.activeView !== 'settings') return;
      try {
        window.Alpine?.store('settings')?.forceCloseAllModals?.();
      } catch (e) { }
      if (this.previousView === 'tierlist') {
        this.activeView = 'tierlist';
      } else if (this.previousView === 'editor' && window.Alpine?.store('characters')?.active) {
        this.activeView = 'editor';
      } else {
        this.activeView = 'dashboard';
      }
      this.saveNavigationState();
    },

    // Métodos para compatibilidad
    openDashboard() {
      this.openDashboardView();
    },

    closeDashboard() {
      this.openEditorView();
    }
  };
}
