/**
 * store/tierlist.js
 * Motor del Creador de Tier Lists para "¿Where is my Ficha?".
 * Permite clasificar de forma interactiva los operativos (personajes)
 * en rangos canónicos o personalizados (S, A, B, C, D, E, etc.),
 * reordenarlos con Drag y Drop, asignar sellos y persistir el estado.
 */

import { compressImage, compressImageWithStats, readFileAsDataUrl } from '../utils/imageCompressor.js';
import { fetchImageAsFileFromUrl } from '../utils/imageUrlResolver.js';
import { ls } from '../utils/storage.js';
import { db } from '../database.js';
import {
  STORAGE_KEY,
  DEFAULT_TIERS,
  TIER_PRESET_COLORS,
  TIER_PRESET_GRADIENTS,
  TIERLIST_ICONS,
  TIER_RATING_TOOLS
} from './tierlist/constants.js';
import { fetchAndParseTierMakerTemplate } from '../utils/tierlist/tierMakerImporter.js';
import { createEmptyCharacter } from './characters/schema.js';

// Re-exportar constantes para retrocompatibilidad total
export {
  STORAGE_KEY,
  DEFAULT_TIERS,
  TIER_PRESET_COLORS,
  TIER_PRESET_GRADIENTS,
  TIERLIST_ICONS,
  TIER_RATING_TOOLS
};

export function registerTierListStore(Alpine) {
  Alpine.store('tierlist', {
    lists: [
      {
        id: 'list_default',
        title: 'Tier List de Operativos',
        icon: 'trophy',
        customIconUrl: null,
        iconFit: 'contain',
        iconZoom: 100,
        iconX: 50,
        iconY: 50,
        tiers: JSON.parse(JSON.stringify(DEFAULT_TIERS)),
        characterModifiers: {},
        dividerLabels: {},
        templateCharacters: [],
        createdAt: Date.now(),
        updatedAt: Date.now()
      }
    ],
    activeListId: 'list_default',
    availableIcons: TIERLIST_ICONS,
    ratingTools: TIER_RATING_TOOLS,
    selectedToolId: null,
    bracketPairStep: { ctx_combo: 'open', ctx_cond: 'open' },
    showRatingToolbox: (() => {
      try {
        const s = ls.get('superficha_tierlist_show_rating_toolbox');
        if (s !== null && s !== undefined) return s === 'true' || s === true;
        return true;
      } catch (e) {
        return true;
      }
    })(),
    draggingToolId: null,
    showListsModal: false,
    showIconPickerModal: false,
    iconPickerTab: 'upload', // 'upload' | 'presets'
    customIconUrlInput: '',
    iconSearchQuery: '',
    newListForm: {
      title: '',
      icon: 'trophy'
    },

    searchQuery: '',
    draggingCharId: null,
    dragSource: null,
    editingTierId: null,
    colorPickerTierId: null,
    showHelp: false,
    hideEmptyTiers: (() => {
      try {
        return ls.get('superficha_tierlist_hide_empty_tiers') === 'true';
      } catch (e) {
        return false;
      }
    })(),
    poolSortOrder: 'default', // 'default' | 'name-asc' | 'name-desc' | 'type'
    editingListId: null,
    editingListTitleInput: '',
    undoStack: [],
    redoStack: [],
    maxUndoSteps: 25,
    presetColors: TIER_PRESET_COLORS,
    presetGradients: TIER_PRESET_GRADIENTS,
    rowOpacity: 40, // 0 a 100 (%) — Transparencia de las filas de categorías
    nameplateStyle: 'below', // 'below' | 'overlay' | 'hidden' — 'below' garantiza que marcos y banners de Steam sean 100% visibles
    operatorDisplayMode: ls.get('superficha_tierlist_op_display_mode', 'symbol') || 'symbol', // 'symbol' | 'card' — 'symbol' muestra únicamente el símbolo flotante sin cajas ni textos
    tokenSize: Number(ls.get('superficha_tierlist_token_size', 72)) || 72, // 48 a 112 (px) — Escala de los avatares/íconos
    itemGap: Number(ls.get('superficha_tierlist_item_gap', 10)) !== null && !isNaN(Number(ls.get('superficha_tierlist_item_gap', 10))) ? Number(ls.get('superficha_tierlist_item_gap', 10)) : 10, // 0 a 36 (px) — Separación horizontal entre elementos
    poolAlignment: ls.get('superficha_tierlist_pool_alignment') === 'center' ? 'center' : 'left', // 'left' | 'center' — Alineación de la cuadrícula de reserva
    poolPosition: ls.get('superficha_tierlist_pool_pos', 'bottom') === 'top' ? 'top' : 'bottom', // 'top' | 'bottom' — Posición relativa del banco de reserva
    toolboxPosition: ls.get('superficha_tierlist_toolbox_pos', 'bottom') === 'top' ? 'top' : 'bottom', // 'top' | 'bottom' — Posición de la caja de herramientas (arriba/abajo del tablero)
    poolFolderFilter: 'all', // 'all' | 'unassigned' | folderId — Filtro por carpeta en el banco
    activeTargetTierId: null, // string | null — ID del tier destino fijado para click continuo
    hoveredCharId: null, // string | null — ID del personaje bajo el cursor para hotkeys rápidas
    hoveredTierId: null, // string | null — ID del tier bajo el cursor para atajos de colapso rápido
    lastInteractedTierId: null, // string | null — ID del último tier clicado o interactuado
    dragOverTarget: null, // { tierId: string, index: number, side: 'left' | 'right' } | null
    boardQuickMenuCharId: null, // string | null — ID del personaje cuyo menú flotante en el tablero está abierto

    // ── Selección Múltiple de Operativos (Shift / Ctrl + Clic o Clic directo cuando hay selección) ─────
    selectedCharacterIds: [],
    isMultiSelectMode: false,
    lastSelectedCharId: null,
    lastSelectedContext: null,
    _lastPoolNavIndex: 0,

    // ── Modo Zen / Vista Limpia (Presentación y Pantalla Completa) ─────
    isZenMode: false,
    zenShowPool: false,

    // ── Operativos sin Ficha (Invitados Temporales en Memoria) ─────
    guestCharacters: [], // Array en sesión (no se guarda en disco)
    poolTab: 'all', // 'all' | 'sheets' | 'guests'
    poolBatchLimit: 80,
    showAddGuestModal: false,
    editingGuestId: null,
    guestForm: {
      name: '',
      role: '',
      pfpUrl: '',
      pfpPreview: '',
      avatarTransform: ''
    },

    // ── Importación de Invitados en Lote (Drag y Drop en Banco / Archivos Múltiples) ─────
    isExternalFileDragOverPool: false,
    _poolDragTargetCount: 0,
    showBatchGuestsModal: false,
    batchGuestsQueue: [], // Array de { id, file, name, role, previewUrl, isGif, sizeKB }
    batchDefaultRole: '',
    batchNamePrefix: '',
    isProcessingBatch: false,
    batchProcessingProgress: 0,

    // ── Caja de Herramientas y Conectores Personalizados ───────────
    customRatingTools: [], // Array de { id, symbol, name, desc, color, bg, border, type, category: 'custom', isCustom: true }
    showCustomToolModal: false,
    editingCustomToolId: null,
    customToolForm: {
      symbol: '',
      name: '',
      desc: '',
      color: '#00f0ff',
      type: 'both' // 'both' | 'row_operator' | 'badge'
    },
    toolboxCategoryFilter: 'all', // 'all' | 'relation' | 'subtier' | 'context' | 'meta' | 'custom'
    toolboxSearchQuery: '',

    // ── Importador de Plantillas TierMaker ───────────────────────────
    showTierMakerModal: false,
    tierMakerUrlInput: '',
    tierMakerIsAnalyzing: false,
    tierMakerPreview: null,
    tierMakerOptions: {
      useCustomTiers: true,
      importTemplateGuests: true, // Importar los personajes temporales de TierMaker
      includeRegistered: true,     // Incluir las fichas registradas del usuario en el banco de esta lista
      includeGuests: false        // Mis Invitados (deshabilitado por defecto para no contaminar la lista importada)
    },

    // ── Diálogo de Confirmación Cyber HUD (Sin popups nativos) ──────
    confirmDialog: {
      isOpen: false,
      title: '¿Confirmar acción?',
      message: '',
      submessage: 'Esta acción no se puede deshacer.',
      confirmText: 'Eliminar',
      confirmType: 'danger', // 'danger' | 'warning'
      icon: 'trash-2',
      onConfirm: null
    },

    // ── Modal de Título de Separador Horizontal Cyber HUD ──────
    dividerTitleModal: {
      isOpen: false,
      rawId: null,
      title: ''
    },

    init() {
      // 1. Carga instantánea síncrona (0ms) desde localStorage
      this.loadSavedState();
      // 2. Carga asíncrona completa desde IndexedDB (recupera avatares y GIFs masivos sin límites)
      this.loadSavedStateFromIndexedDB();

      // 3. Listeners globales en window para garantizar que nunca quede una línea de arrastre huérfana
      if (typeof window !== 'undefined' && !this._globalDragListenersBound) {
        this._globalDragListenersBound = true;
        window.addEventListener('dragend', () => this.endDrag(), true);
        window.addEventListener('drop', () => { setTimeout(() => this.endDrag(), 0); }, true);
        window.addEventListener('mouseup', () => { if (this.isDragging) this.endDrag(); }, true);
      }
    },

    // ── Sistema de Deshacer / Rehacer Ligero y Protegido contra Saturación de RAM ───
    _collectAvatarMap() {
      const map = new Map();
      (this.guestCharacters || []).forEach(g => {
        if (g.basics?.avatarDataUrl) map.set(g.id, g.basics.avatarDataUrl);
      });
      (this.lists || []).forEach(l => {
        (l.templateCharacters || []).forEach(tc => {
          if (tc.basics?.avatarDataUrl) map.set(tc.id, tc.basics.avatarDataUrl);
        });
      });
      return map;
    },

    _createLightweightSnapshot(actionName = 'Acción') {
      return {
        actionName,
        activeListId: this.activeListId,
        lists: this.lists.map(l => ({
          id: l.id,
          title: l.title,
          icon: l.icon,
          customIconUrl: l.customIconUrl,
          iconFit: l.iconFit,
          iconZoom: l.iconZoom,
          iconX: l.iconX,
          iconY: l.iconY,
          characterModifiers: JSON.parse(JSON.stringify(l.characterModifiers || {})),
          dividerLabels: JSON.parse(JSON.stringify(l.dividerLabels || {})),
          poolCharacterIds: Array.isArray(l.poolCharacterIds) ? [...l.poolCharacterIds] : [],
          includeRegistered: l.includeRegistered,
          includeGuests: l.includeGuests,
          templateCharacters: (l.templateCharacters || []).map(tc => ({
            ...tc,
            basics: {
              ...(tc.basics || {}),
              avatarDataUrl: (tc.basics?.avatarDataUrl && tc.basics.avatarDataUrl.length < 50000) ? tc.basics.avatarDataUrl : null
            }
          })),
          tiers: (l.tiers || []).map(t => ({
            id: t.id,
            label: t.label,
            color: t.color,
            colorType: t.colorType,
            solidColor: t.solidColor,
            color1: t.color1,
            color2: t.color2,
            gradientDir: t.gradientDir,
            characterIds: [...(t.characterIds || [])]
          }))
        })),
        guestCharacters: (this.guestCharacters || []).map(g => ({
          ...g,
          basics: {
            ...(g.basics || {}),
            avatarDataUrl: (g.basics?.avatarDataUrl && g.basics.avatarDataUrl.length < 50000) ? g.basics.avatarDataUrl : null
          }
        }))
      };
    },

    _rehydrateSnapshotAvatars(lists, guests, avatarMap) {
      if (Array.isArray(guests)) {
        guests.forEach(g => {
          if (!g.basics) g.basics = {};
          if (!g.basics.avatarDataUrl && avatarMap.has(g.id)) {
            g.basics.avatarDataUrl = avatarMap.get(g.id);
          }
        });
      }
      if (Array.isArray(lists)) {
        lists.forEach(l => {
          if (Array.isArray(l.templateCharacters)) {
            l.templateCharacters.forEach(tc => {
              if (!tc.basics) tc.basics = {};
              if (!tc.basics.avatarDataUrl && avatarMap.has(tc.id)) {
                tc.basics.avatarDataUrl = avatarMap.get(tc.id);
              }
            });
          }
        });
      }
    },

    pushUndoSnapshot(actionName = 'Acción') {
      try {
        const snapshot = this._createLightweightSnapshot(actionName);
        this.undoStack.push(snapshot);
        if (this.undoStack.length > this.maxUndoSteps) {
          this.undoStack.shift();
        }
        this.redoStack = [];
      } catch (e) {
        console.warn('[tierlist] Error pushing undo snapshot', e);
      }
    },

    undo() {
      if (!this.undoStack || this.undoStack.length === 0) {
        Alpine.store('app')?.toast?.('No hay más acciones para deshacer en la Tier List.', 'info');
        return;
      }
      const avatarMap = this._collectAvatarMap();
      const currentSnapshot = this._createLightweightSnapshot('Actual');
      this.redoStack.push(currentSnapshot);
      if (this.redoStack.length > this.maxUndoSteps) {
        this.redoStack.shift();
      }

      const prev = this.undoStack.pop();
      this._rehydrateSnapshotAvatars(prev.lists, prev.guestCharacters, avatarMap);
      this.lists = prev.lists;
      this.activeListId = prev.activeListId;
      this.guestCharacters = prev.guestCharacters;
      this.selectedCharacterIds = [];
      this.saveState();
      this.refreshIcons();
      Alpine.store('app')?.toast?.(`Deshecho: ${prev.actionName}`, 'info');
    },

    redo() {
      if (!this.redoStack || this.redoStack.length === 0) {
        Alpine.store('app')?.toast?.('No hay más acciones para rehacer en la Tier List.', 'info');
        return;
      }
      const avatarMap = this._collectAvatarMap();
      const currentSnapshot = this._createLightweightSnapshot('Actual');
      this.undoStack.push(currentSnapshot);

      const next = this.redoStack.pop();
      this._rehydrateSnapshotAvatars(next.lists, next.guestCharacters, avatarMap);
      this.lists = next.lists;
      this.activeListId = next.activeListId;
      this.guestCharacters = next.guestCharacters;
      this.selectedCharacterIds = [];
      this.saveState();
      this.refreshIcons();
      Alpine.store('app')?.toast?.(`Rehecho: ${next.actionName}`, 'info');
    },

    toggleHideEmptyTiers() {
      this.hideEmptyTiers = !this.hideEmptyTiers;
      ls.set('superficha_tierlist_hide_empty_tiers', String(this.hideEmptyTiers));
      Alpine.store('app')?.toast?.(
        this.hideEmptyTiers ? 'Rangos vacíos ocultados (Modo Compacto).' : 'Todos los rangos visibles.',
        'info'
      );
    },

    setPoolTab(tab) {
      this.poolTab = tab;
      this.poolBatchLimit = 80;
    },

    setPoolSortOrder(order) {
      this.poolSortOrder = order;
      this.poolBatchLimit = 80;
    },

    loadMorePool(amount = 80) {
      this.poolBatchLimit = (this.poolBatchLimit || 80) + amount;
    },

    loadAllPool() {
      this.poolBatchLimit = 999999;
    },

    startRenameList(id, currentTitle) {
      this.editingListId = id;
      this.editingListTitleInput = currentTitle || '';
    },

    saveRenameList(id) {
      const target = this.lists.find(l => l.id === id);
      const newTitle = (this.editingListTitleInput || '').trim();
      if (target) {
        this.pushUndoSnapshot(`Renombrar lista a "${newTitle || 'Sin Título'}"`);
        target.title = newTitle;
        target.updatedAt = Date.now();
        this.saveState();
        Alpine.store('app')?.toast?.(newTitle ? `Tier List renombrada a "${newTitle}".` : 'Nombre de Tier List actualizado.', 'success');
      }
      this.editingListId = null;
    },

    cancelRenameList() {
      this.editingListId = null;
    },

    exportTierListAsJson(listId = null) {
      const target = this.lists.find(l => l.id === (listId || this.activeListId)) || this.currentList;
      if (!target) return;

      const rawTarget = (typeof window !== 'undefined' && window.Alpine && window.Alpine.raw)
        ? window.Alpine.raw(target)
        : target;
      const cleanTarget = JSON.parse(JSON.stringify(rawTarget));

      // 1. Recopilar todos los IDs de personajes asociados a esta Tier List:
      // - Operativos en los rangos (tiers):
      const tierCharIds = (cleanTarget.tiers || [])
        .flatMap(t => (t.characterIds || []))
        .filter(id => id && !this.isOperatorItem(id));

      // - Operativos en el banco / reserva (poolCharacterIds):
      const poolCharIds = (Array.isArray(cleanTarget.poolCharacterIds) ? cleanTarget.poolCharacterIds : [])
        .filter(id => id && !this.isOperatorItem(id));

      // - Operativos en la plantilla propia de la lista (templateCharacters):
      const templateCharIds = (cleanTarget.templateCharacters || [])
        .map(tc => tc && tc.id)
        .filter(Boolean);

      // - Operativos con modificadores o insignias asignadas:
      const modifierCharIds = Object.keys(cleanTarget.characterModifiers || {});

      // - Operativos invitados manuales si la lista incluye invitados:
      const guestCharIds = (this.guestCharacters || []).map(g => g.id);

      const allReferencedIds = [...new Set([
        ...tierCharIds,
        ...poolCharIds,
        ...templateCharIds,
        ...modifierCharIds,
        ...(cleanTarget.includeGuests !== false ? guestCharIds : [])
      ])];

      // 2. Construir instantáneas (snapshots) completas y autocontenidas de todos los personajes:
      // Esto garantiza que si el JSON se transfiere e importa en otra PC (incluso sin fichas registradas),
      // la tier list se renderice 100% idéntica con todas sus imágenes, GIFs animados, marcos de Steam y estilos.
      const characterSnapshots = [];
      allReferencedIds.forEach(id => {
        const char = this.resolveCharacter(id);
        if (!char) return;

        const rawChar = (typeof window !== 'undefined' && window.Alpine && window.Alpine.raw)
          ? window.Alpine.raw(char)
          : char;

        const isGuest = Boolean(rawChar.isGuest || (this.guestCharacters || []).some(g => g.id === rawChar.id));
        const isTemplate = Boolean(rawChar.isTemplate || (cleanTarget.templateCharacters || []).some(tc => tc.id === rawChar.id));

        characterSnapshots.push({
          id: rawChar.id,
          name: rawChar.name || rawChar.basics?.fullName || 'Sin Nombre',
          folderId: rawChar.folderId || null,
          isGuest,
          isTemplate,
          basics: {
            fullName: rawChar.basics?.fullName || rawChar.name || 'Sin Nombre',
            nickname: rawChar.basics?.nickname || '',
            avatarDataUrl: rawChar.basics?.avatarDataUrl || '',
            iconDataUrl: rawChar.basics?.iconDataUrl || '',
            bannerDataUrl: rawChar.basics?.bannerDataUrl || '',
            avatarTransform: rawChar.basics?.avatarTransform || '',
            iconTransform: rawChar.basics?.iconTransform || '',
            avatarShape: rawChar.basics?.avatarShape || 'rounded',
            avatarRadius: rawChar.basics?.avatarRadius !== undefined ? rawChar.basics.avatarRadius : 25,
            avatarAspect: rawChar.basics?.avatarAspect || 'square',
            useIconForPfp: Boolean(rawChar.basics?.useIconForPfp),
            avatarFrame: rawChar.basics?.avatarFrame ? JSON.parse(JSON.stringify(rawChar.basics.avatarFrame)) : null,
            steamIcon: rawChar.basics?.steamIcon ? JSON.parse(JSON.stringify(rawChar.basics.steamIcon)) : null,
            steamBadges: Array.isArray(rawChar.basics?.steamBadges) ? JSON.parse(JSON.stringify(rawChar.basics.steamBadges)) : []
          },
          visualSettings: rawChar.visualSettings ? JSON.parse(JSON.stringify(rawChar.visualSettings)) : null,
          style: rawChar.style ? JSON.parse(JSON.stringify(rawChar.style)) : null,
          powerScaling: {
            overallTier: rawChar.powerScaling?.overallTier || rawChar.powerScaling?.tier || '',
            tier: rawChar.powerScaling?.tier || rawChar.powerScaling?.overallTier || ''
          }
        });
      });

      // 3. Personajes invitados manuales relevantes para esta lista:
      const relevantGuests = (this.guestCharacters || []).filter(g => g && g.id && allReferencedIds.includes(g.id));

      const payload = {
        version: 'wimsf_tierlist_export_v2',
        exportedAt: new Date().toISOString(),
        list: cleanTarget,
        guestCharacters: JSON.parse(JSON.stringify(relevantGuests)),
        characterSnapshots
      };

      const safeFilename = (cleanTarget.title || 'tierlist')
        .toLowerCase()
        .replace(/[^a-z0-9_-]+/gi, '_')
        .slice(0, 40);

      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${safeFilename || 'tierlist'}_tierlist.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      Alpine.store('app')?.toast?.(`Tier List "${cleanTarget.title || 'Sin Título'}" exportada íntegramente con todas sus imágenes.`, 'success');
    },

    importTierListFromJson(event) {
      const file = event?.target?.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = JSON.parse(e.target.result);
          if (!data || (!data.list && !Array.isArray(data.tiers))) {
            Alpine.store('app')?.toast?.('Archivo JSON no válido para Tier List.', 'error');
            return;
          }

          this.pushUndoSnapshot('Importar Tier List JSON');

          const importedList = data.list || {
            id: `list_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            title: data.title || file.name.replace(/\.json$/i, ''),
            icon: data.icon || 'trophy',
            customIconUrl: data.customIconUrl || null,
            iconFit: data.iconFit || 'contain',
            iconZoom: data.iconZoom || 100,
            iconX: data.iconX || 50,
            iconY: data.iconY || 50,
            tiers: data.tiers || JSON.parse(JSON.stringify(DEFAULT_TIERS)),
            characterModifiers: data.characterModifiers || {},
            dividerLabels: data.dividerLabels || {},
            poolCharacterIds: Array.isArray(data.poolCharacterIds) ? data.poolCharacterIds : [],
            includeRegistered: data.includeRegistered !== false,
            includeGuests: data.includeGuests !== false,
            templateCharacters: data.templateCharacters || [],
            createdAt: Date.now(),
            updatedAt: Date.now()
          };

          // Sanitizar y asegurar propiedades críticas de la lista importada
          if (!Array.isArray(importedList.tiers)) {
            importedList.tiers = JSON.parse(JSON.stringify(DEFAULT_TIERS));
          } else {
            importedList.tiers = this._sanitizeTiers(importedList.tiers);
          }
          if (!importedList.characterModifiers || typeof importedList.characterModifiers !== 'object') {
            importedList.characterModifiers = (data.characterModifiers && typeof data.characterModifiers === 'object') ? data.characterModifiers : {};
          }
          if (!importedList.dividerLabels || typeof importedList.dividerLabels !== 'object') {
            importedList.dividerLabels = (data.dividerLabels && typeof data.dividerLabels === 'object') ? data.dividerLabels : {};
          }
          if (!Array.isArray(importedList.poolCharacterIds)) {
            importedList.poolCharacterIds = Array.isArray(data.poolCharacterIds) ? data.poolCharacterIds : [];
          }
          if (!Array.isArray(importedList.templateCharacters)) {
            importedList.templateCharacters = Array.isArray(data.templateCharacters) ? data.templateCharacters : [];
          }

          // Si ya existe una lista con el mismo ID, generar nuevo ID y título
          if (this.lists.some(l => l.id === importedList.id)) {
            importedList.id = `list_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
            importedList.title = `${importedList.title} (Importada)`;
          }

          // Restaurar personajes invitados manuales
          if (Array.isArray(data.guestCharacters) && data.guestCharacters.length > 0) {
            const existingIds = new Set((this.guestCharacters || []).map(g => g.id));
            const newGuests = data.guestCharacters.filter(g => g && g.id && !existingIds.has(g.id));
            if (newGuests.length > 0) {
              this.guestCharacters = [...(this.guestCharacters || []), ...newGuests];
            }
          }

          // RESTAURACIÓN DE INSTANTÁNEAS DE PERSONAJES (PORTABILIDAD 100% ENTRE PCS):
          // Si el JSON incluye characterSnapshots, revisamos si cada personaje está registrado en el roster
          // local ($store.characters.list) de esta PC. Si NO está presente, lo inyectamos automáticamente en
          // templateCharacters de la lista importada. De esta forma, resolveCharacter(id) lo resolverá de
          // inmediato con su imagen/GIF base64, marco de Steam, nombre y estilos originales.
          if (Array.isArray(data.characterSnapshots) && data.characterSnapshots.length > 0) {
            const charStore = Alpine.store('characters');
            const localCharIds = new Set((charStore?.list || []).map(c => c.id));
            const guestIds = new Set((this.guestCharacters || []).map(g => g.id));
            const templateIds = new Set(importedList.templateCharacters.map(t => t.id));

            data.characterSnapshots.forEach(snap => {
              if (!snap || !snap.id) return;
              if (!localCharIds.has(snap.id) && !guestIds.has(snap.id) && !templateIds.has(snap.id)) {
                importedList.templateCharacters.push({
                  ...snap,
                  isTemplate: true
                });
                templateIds.add(snap.id);
              }
            });
          }

          this.lists.push(importedList);
          this.activeListId = importedList.id;
          await this.saveState(true);
          this.refreshIcons();
          this.showListsModal = false;
          Alpine.store('app')?.toast?.(`Tier List "${importedList.title}" importada con éxito con todas sus imágenes.`, 'success');
        } catch (err) {
          console.error('[tierlist] Error al importar JSON:', err);
          Alpine.store('app')?.toast?.('Error al leer el archivo JSON de Tier List.', 'error');
        }
      };
      reader.readAsText(file);
      if (event.target) event.target.value = '';
    },

    toggleRatingToolbox() {
      this.showRatingToolbox = !this.showRatingToolbox;
      ls.set('superficha_tierlist_show_rating_toolbox', String(this.showRatingToolbox));
      this.saveState();
      this.refreshIcons();
    },

    toggleToolboxPosition() {
      this.toolboxPosition = this.toolboxPosition === 'top' ? 'bottom' : 'top';
      ls.set('superficha_tierlist_toolbox_pos', this.toolboxPosition);
      this.saveState();
      this.refreshIcons();
      Alpine.store('app')?.toast?.(
        `Caja de herramientas posicionada ${this.toolboxPosition === 'top' ? 'arriba' : 'abajo'} del tablero.`,
        'info'
      );
    },

    // ── Métodos de Modo Zen / Vista Limpia ─────────────────────────────
    toggleZenMode(enable = null) {
      const nextState = enable !== null ? Boolean(enable) : !this.isZenMode;
      this.isZenMode = nextState;
      if (this.isZenMode) {
        this.boardQuickMenuCharId = null;
        this.selectedCharacterIds = [];
        this.isMultiSelectMode = false;
        Alpine.store('app')?.toast?.('Modo Zen activado. Presiona Esc o Z para salir.', 'info');
      }
      this.refreshIcons();
    },

    toggleZenShowPool() {
      this.zenShowPool = !this.zenShowPool;
      this.refreshIcons();
    },

    toggleNativeFullscreen() {
      try {
        if (!document.fullscreenElement) {
          if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen().catch(() => {});
          }
        } else {
          if (document.exitFullscreen) {
            document.exitFullscreen().catch(() => {});
          }
        }
      } catch (e) {
        console.warn('[tierlist] Fullscreen API no disponible:', e);
      }
      this.refreshIcons();
    },

    get isDragging() {
      return Boolean(this.draggingCharId || this.draggingToolId);
    },

    get currentList() {
      const found = this.lists.find(l => l.id === this.activeListId);
      return found || this.lists[0] || null;
    },

    get characterModifiers() {
      if (!this.currentList) return {};
      if (!this.currentList.characterModifiers || typeof this.currentList.characterModifiers !== 'object') {
        this.currentList.characterModifiers = {};
      }
      return this.currentList.characterModifiers;
    },

    set characterModifiers(val) {
      if (this.currentList) {
        this.currentList.characterModifiers = val || {};
      }
    },

    get poolCharacterIds() {
      if (!this.currentList) return [];
      if (!Array.isArray(this.currentList.poolCharacterIds)) {
        this.currentList.poolCharacterIds = [];
      }
      return this.currentList.poolCharacterIds;
    },

    set poolCharacterIds(val) {
      if (this.currentList) {
        this.currentList.poolCharacterIds = Array.isArray(val) ? val : [];
      }
    },

    get tiers() {
      return this.currentList ? this.currentList.tiers : [];
    },

    set tiers(val) {
      if (this.currentList) {
        this.currentList.tiers = val;
      }
    },

    get title() {
      return this.currentList ? (this.currentList.title ?? '') : '';
    },

    set title(val) {
      if (this.currentList) {
        this.currentList.title = typeof val === 'string' ? val : '';
        this.currentList.updatedAt = Date.now();
      }
    },

    get icon() {
      return this.currentList?.icon || 'trophy';
    },

    set icon(val) {
      if (this.currentList) {
        this.currentList.icon = val;
        this.currentList.updatedAt = Date.now();
      }
    },

    get customIconUrl() {
      return this.currentList?.customIconUrl || null;
    },

    set customIconUrl(val) {
      if (this.currentList) {
        this.currentList.customIconUrl = val;
        this.currentList.updatedAt = Date.now();
        this.saveState();
      }
    },

    get iconFit() {
      return this.currentList?.iconFit || 'contain';
    },

    set iconFit(val) {
      if (this.currentList) {
        this.currentList.iconFit = val === 'cover' ? 'cover' : 'contain';
        this.currentList.updatedAt = Date.now();
        this.saveState();
      }
    },

    get iconZoom() {
      return this.currentList?.iconZoom !== undefined ? this.currentList.iconZoom : 100;
    },

    set iconZoom(val) {
      if (this.currentList) {
        this.currentList.iconZoom = Number(val);
        this.saveState();
      }
    },

    get iconX() {
      return this.currentList?.iconX !== undefined ? this.currentList.iconX : 50;
    },

    set iconX(val) {
      if (this.currentList) {
        this.currentList.iconX = Number(val);
        this.saveState();
      }
    },

    get iconY() {
      return this.currentList?.iconY !== undefined ? this.currentList.iconY : 50;
    },

    set iconY(val) {
      if (this.currentList) {
        this.currentList.iconY = Number(val);
        this.saveState();
      }
    },

    getCustomIconStyle(list = null) {
      const l = list || this.currentList;
      if (l && l.customIconTransform) {
        return l.customIconTransform;
      }
      const zoom = ((l && l.iconZoom !== undefined ? Number(l.iconZoom) : (list ? 100 : this.iconZoom)) || 100) / 100;
      const x = (l && l.iconX !== undefined ? Number(l.iconX) : (list ? 50 : this.iconX)) ?? 50;
      const y = (l && l.iconY !== undefined ? Number(l.iconY) : (list ? 50 : this.iconY)) ?? 50;
      const fit = (l && l.iconFit) ? l.iconFit : (list ? 'cover' : (this.iconFit || 'cover'));
      return `object-fit: ${fit} !important; object-position: ${x}% ${y}%; transform: scale(${zoom}); transform-origin: ${x}% ${y}%;`;
    },

    get filteredIcons() {
      if (!this.iconSearchQuery || !this.iconSearchQuery.trim()) {
        return this.availableIcons;
      }
      const q = this.iconSearchQuery.trim().toLowerCase();
      return this.availableIcons.filter(ic => 
        ic.id.toLowerCase().includes(q) || 
        ic.label.toLowerCase().includes(q) ||
        (ic.category && ic.category.toLowerCase().includes(q))
      );
    },

    loadSavedState() {
      try {
        const parsed = ls.getJSON(STORAGE_KEY);
        if (parsed && typeof parsed === 'object') {
          this._applyParsedState(parsed, false);
        }
      } catch (e) {
        console.warn('[tierlist] Error cargando estado previo desde localStorage:', e);
      }
    },

    async loadSavedStateFromIndexedDB() {
      try {
        if (!db || !db.meta) return;
        const entry = await db.meta.get(STORAGE_KEY);
        if (entry && entry.data && typeof entry.data === 'object') {
          this._applyParsedState(entry.data, true);
          this.refreshIcons();
        } else {
          // Migración inicial: si aún no existe en IndexedDB, respaldar el estado actual de localStorage
          const currentLs = ls.getJSON(STORAGE_KEY);
          if (currentLs && typeof currentLs === 'object') {
            const raw = window.Alpine?.raw ? window.Alpine.raw(currentLs) : currentLs;
            const serialized = JSON.parse(JSON.stringify(raw));
            await db.meta.put({
              key: STORAGE_KEY,
              data: serialized,
              updatedAt: Date.now()
            });
            this._applyParsedState(serialized, true);
            this.refreshIcons();
          }
        }
      } catch (e) {
        console.warn('[tierlist] Error cargando estado desde IndexedDB:', e);
      }
    },

    _applyParsedState(parsed, fromIndexedDB = false) {
      if (!parsed || typeof parsed !== 'object') return;

      if (parsed.showRatingToolbox !== undefined) {
        this.showRatingToolbox = Boolean(parsed.showRatingToolbox);
      } else {
        const savedToolbox = ls.get('superficha_tierlist_show_rating_toolbox');
        if (savedToolbox !== null && savedToolbox !== undefined) {
          this.showRatingToolbox = savedToolbox === 'true' || savedToolbox === true;
        }
      }

      if (parsed.rowOpacity !== undefined) {
        this.rowOpacity = Math.max(0, Math.min(100, Number(parsed.rowOpacity)));
      }

      if (parsed.nameplateStyle && ['below', 'overlay', 'hidden'].includes(parsed.nameplateStyle)) {
        this.nameplateStyle = parsed.nameplateStyle;
      }

      if (parsed.operatorDisplayMode && ['symbol', 'card'].includes(parsed.operatorDisplayMode)) {
        this.operatorDisplayMode = parsed.operatorDisplayMode;
      }

      if (parsed.toolboxPosition && ['top', 'bottom'].includes(parsed.toolboxPosition)) {
        this.toolboxPosition = parsed.toolboxPosition;
      }

      if (parsed.tokenSize !== undefined) {
        this.tokenSize = Math.max(48, Math.min(112, Number(parsed.tokenSize) || 72));
      } else {
        const savedSize = Number(ls.get('superficha_tierlist_token_size', 72));
        if (savedSize) this.tokenSize = Math.max(48, Math.min(112, savedSize));
      }

      if (parsed.itemGap !== undefined) {
        this.itemGap = Math.max(0, Math.min(36, Number(parsed.itemGap) || 0));
      } else {
        const savedGap = Number(ls.get('superficha_tierlist_item_gap', 10));
        if (!isNaN(savedGap) && savedGap >= 0) this.itemGap = Math.max(0, Math.min(36, savedGap));
      }

      if (parsed.poolAlignment && ['left', 'center'].includes(parsed.poolAlignment)) {
        this.poolAlignment = parsed.poolAlignment;
      } else {
        const savedAlign = ls.get('superficha_tierlist_pool_alignment');
        if (savedAlign && ['left', 'center'].includes(savedAlign)) {
          this.poolAlignment = savedAlign;
        }
      }

      // Cargar personajes invitados manuales del usuario si fueron guardados
      if (Array.isArray(parsed.guestCharacters)) {
        if (fromIndexedDB || !this.guestCharacters || this.guestCharacters.length === 0) {
          this.guestCharacters = parsed.guestCharacters;
        } else {
          // Si venimos de localStorage, rellenar si no hay conflicto
          this.guestCharacters = parsed.guestCharacters;
        }
      }

      // Cargar herramientas y conectores personalizados del usuario
      if (Array.isArray(parsed.customRatingTools)) {
        this.customRatingTools = parsed.customRatingTools;
      }

      // Caso A: Formato Multi-Lista
      if (Array.isArray(parsed.lists) && parsed.lists.length > 0) {
        this.lists = parsed.lists.map(list => ({
          id: list.id || `list_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
          title: typeof list.title === 'string' ? list.title : '',
          icon: list.icon || 'trophy',
          customIconUrl: list.customIconUrl || null,
          iconFit: list.iconFit || 'contain',
          iconZoom: list.iconZoom !== undefined ? Number(list.iconZoom) : 100,
          iconX: list.iconX !== undefined ? Number(list.iconX) : 50,
          iconY: list.iconY !== undefined ? Number(list.iconY) : 50,
          characterModifiers: (list.characterModifiers && typeof list.characterModifiers === 'object') ? list.characterModifiers : {},
          dividerLabels: (list.dividerLabels && typeof list.dividerLabels === 'object') ? list.dividerLabels : {},
          poolCharacterIds: Array.isArray(list.poolCharacterIds) ? list.poolCharacterIds : [],
          includeRegistered: list.includeRegistered !== false,
          includeGuests: list.includeGuests !== false,
          templateCharacters: Array.isArray(list.templateCharacters) ? list.templateCharacters : [],
          createdAt: list.createdAt || Date.now(),
          updatedAt: list.updatedAt || Date.now(),
          tiers: this._sanitizeTiers(list.tiers)
        }));
        if (parsed.activeListId && this.lists.some(l => l.id === parsed.activeListId)) {
          this.activeListId = parsed.activeListId;
        } else {
          this.activeListId = this.lists[0].id;
        }
      } 
      // Caso B: Migración de versión previa con una sola lista
      else if (Array.isArray(parsed.tiers) && parsed.tiers.length > 0) {
        this.lists = [
          {
            id: 'list_default',
            title: (typeof parsed.title === 'string' && parsed.title.trim()) ? parsed.title : 'Tier List de Operativos',
            icon: parsed.icon || 'trophy',
            customIconUrl: null,
            iconFit: 'contain',
            iconZoom: 100,
            iconX: 50,
            iconY: 50,
            characterModifiers: (parsed.characterModifiers && typeof parsed.characterModifiers === 'object') ? parsed.characterModifiers : {},
            dividerLabels: (parsed.dividerLabels && typeof parsed.dividerLabels === 'object') ? parsed.dividerLabels : {},
            poolCharacterIds: Array.isArray(parsed.poolCharacterIds) ? parsed.poolCharacterIds : [],
            includeRegistered: true,
            includeGuests: true,
            templateCharacters: [],
            tiers: this._sanitizeTiers(parsed.tiers),
            createdAt: Date.now(),
            updatedAt: Date.now()
          }
        ];
        this.activeListId = 'list_default';
      }

      // Auto-migración Retroactiva
      const templateGuests = [];
      const manualGuests = [];
      let needsMigrationSave = false;

      (this.guestCharacters || []).forEach(g => {
        const isTemplate = g.isTemplate || (typeof g.id === 'string' && g.id.startsWith('guest_tm_')) || Boolean(g.listId);
        if (isTemplate) {
          templateGuests.push({
            ...g,
            isTemplate: true
          });
          needsMigrationSave = true;
        } else {
          manualGuests.push(g);
        }
      });

      if (needsMigrationSave) {
        templateGuests.forEach(tg => {
          let targetList = this.lists.find(l => l.id === tg.listId);
          if (!targetList) {
            targetList = this.lists.find(l => l.id.startsWith('list_tm_')) ||
                         this.lists.find(l => Array.isArray(l.templateCharacters) && l.templateCharacters.length > 0) ||
                         this.lists[0];
          }
          if (targetList) {
            if (!Array.isArray(targetList.templateCharacters)) {
              targetList.templateCharacters = [];
            }
            if (!targetList.templateCharacters.some(c => c.id === tg.id)) {
              targetList.templateCharacters.push(tg);
            }
          }
        });
        this.guestCharacters = manualGuests;
        if (fromIndexedDB) {
          this.saveState(true);
        }
      }

      this._cleanupOrphanModifiers();
    },

    _sanitizeTiers(rawTiers) {
      if (!Array.isArray(rawTiers) || rawTiers.length === 0) {
        return JSON.parse(JSON.stringify(DEFAULT_TIERS));
      }
      return rawTiers.map(t => {
        const color = t.color || '#3b82f6';
        const isGradient = t.colorType === 'gradient';
        const solid = t.solidColor || (!color.includes('gradient') ? color : '#ef4444');
        return {
          id: t.id || `tier_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
          label: t.label || 'TIER',
          color: isGradient ? (color.includes('gradient') ? color : `linear-gradient(${t.gradientDir || 'to bottom'}, ${t.color1 || '#0b4f6c'}, ${t.color2 || '#00c9a7'})`) : solid,
          colorType: isGradient ? 'gradient' : 'solid',
          solidColor: solid,
          color1: t.color1 || '#0b4f6c',
          color2: t.color2 || '#00c9a7',
          gradientDir: t.gradientDir || 'to bottom',
          collapsed: Boolean(t.collapsed),
          characterIds: Array.isArray(t.characterIds) ? t.characterIds : []
        };
      });
    },

    _saveStateTimer: null,
    saveState(immediate = false) {
      if (immediate) {
        if (this._saveStateTimer) {
          clearTimeout(this._saveStateTimer);
          this._saveStateTimer = null;
        }
        this._doSaveState();
        return;
      }
      if (this._saveStateTimer) {
        clearTimeout(this._saveStateTimer);
      }
      this._saveStateTimer = setTimeout(() => {
        this._saveStateTimer = null;
        this._doSaveState();
      }, 350);
    },

    _cleanupOrphanModifiers() {
      if (!this.characterModifiers || typeof this.characterModifiers !== 'object') return;
      const assigned = new Set();
      this.tiers.forEach(t => {
        (t.characterIds || []).forEach(id => {
          if (!this.isOperatorItem(id)) assigned.add(id);
        });
      });
      Object.keys(this.characterModifiers).forEach(cid => {
        if (!assigned.has(cid)) {
          delete this.characterModifiers[cid];
        }
      });
    },

    async _doSaveState() {
      try {
        this._cleanupOrphanModifiers();
        const data = {
          activeListId: this.activeListId,
          showRatingToolbox: this.showRatingToolbox !== false,
          rowOpacity: this.rowOpacity !== undefined ? Number(this.rowOpacity) : 40,
          nameplateStyle: this.nameplateStyle || 'below',
          operatorDisplayMode: this.operatorDisplayMode || 'symbol',
          toolboxPosition: this.toolboxPosition || 'bottom',
          tokenSize: this.tokenSize || 72,
          itemGap: this.itemGap !== undefined ? Number(this.itemGap) : 10,
          poolAlignment: this.poolAlignment || 'left',
          guestCharacters: Array.isArray(this.guestCharacters) ? this.guestCharacters : [],
          customRatingTools: Array.isArray(this.customRatingTools) ? this.customRatingTools : [],
          lists: (this.lists || []).map(l => ({
            id: l.id,
            title: typeof l.title === 'string' ? l.title : '',
            icon: l.icon || 'trophy',
            customIconUrl: l.customIconUrl || null,
            iconFit: l.iconFit || 'contain',
            iconZoom: l.iconZoom !== undefined ? Number(l.iconZoom) : 100,
            iconX: l.iconX !== undefined ? Number(l.iconX) : 50,
            iconY: l.iconY !== undefined ? Number(l.iconY) : 50,
            characterModifiers: (l.characterModifiers && typeof l.characterModifiers === 'object') ? l.characterModifiers : {},
            dividerLabels: (l.dividerLabels && typeof l.dividerLabels === 'object') ? l.dividerLabels : {},
            poolCharacterIds: Array.isArray(l.poolCharacterIds) ? l.poolCharacterIds : [],
            includeRegistered: l.includeRegistered !== false,
            includeGuests: l.includeGuests !== false,
            templateCharacters: Array.isArray(l.templateCharacters) ? l.templateCharacters : [],
            createdAt: l.createdAt || Date.now(),
            updatedAt: l.updatedAt || Date.now(),
            tiers: (l.tiers || []).map(t => ({
              id: t.id,
              label: t.label,
              color: t.color,
              colorType: t.colorType === 'gradient' ? 'gradient' : 'solid',
              solidColor: t.solidColor || (t.color && !t.color.includes('gradient') ? t.color : null),
              color1: t.color1,
              color2: t.color2,
              gradientDir: t.gradientDir || 'to bottom',
              collapsed: Boolean(t.collapsed),
              characterIds: Array.isArray(t.characterIds) ? t.characterIds : []
            }))
          }))
        };

        // Des-proxificar limpiamente para IndexedDB y estructurar clones seguros (100% inmune a DOMException DataCloneError)
        const raw = window.Alpine?.raw ? window.Alpine.raw(data) : data;
        const serialized = JSON.parse(JSON.stringify(raw));

        // 1. Guardar en IndexedDB como fuente canónica persistente (soporta decenas de MBs, avatares y GIFs sin tope)
        try {
          if (db && db.meta) {
            await db.meta.put({
              key: STORAGE_KEY,
              data: serialized,
              updatedAt: Date.now()
            });
          }
        } catch (idbErr) {
          console.warn('[tierlist] Error guardando estado en IndexedDB:', idbErr);
        }

        // 2. Caché secundario en localStorage: solo si pesa menos de 1.5MB. Si es más pesado, liberamos la clave
        // para prevenir a perpetuidad el error "DOMException: The quota has been exceeded".
        try {
          if (typeof localStorage !== 'undefined') {
            const jsonStr = JSON.stringify(serialized);
            if (jsonStr.length < 1500000) {
              localStorage.setItem(STORAGE_KEY, jsonStr);
            } else if (localStorage.getItem(STORAGE_KEY)) {
              localStorage.removeItem(STORAGE_KEY);
            }
          }
        } catch (_) {
          try { localStorage.removeItem(STORAGE_KEY); } catch (__) {}
        }
      } catch (e) {
        console.warn('[tierlist] Error general en _doSaveState:', e);
      }
    },

    // ── Gestión de Múltiples Tier Lists ─────────────────────────────
    openListsModal() {
      this.newListForm = {
        title: '',
        icon: 'swords',
        includeRegistered: true,
        includeGuests: false
      };
      this.showListsModal = true;
      this.refreshIcons();
    },

    closeListsModal() {
      this.showListsModal = false;
    },

    createTierList(titleParam = null, iconParam = null) {
      const title = (titleParam || this.newListForm.title || '').trim() || `Tier List #${this.lists.length + 1}`;
      const icon = iconParam || this.newListForm.icon || 'trophy';
      const id = `list_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      const newList = {
        id,
        title,
        icon,
        customIconUrl: null,
        iconFit: 'contain',
        iconZoom: 100,
        iconX: 50,
        iconY: 50,
        tiers: JSON.parse(JSON.stringify(DEFAULT_TIERS)),
        characterModifiers: {},
        dividerLabels: {},
        poolCharacterIds: [],
        includeRegistered: this.newListForm?.includeRegistered !== false,
        includeGuests: this.newListForm?.includeGuests === true,
        templateCharacters: [],
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      this.lists.push(newList);
      this.activeListId = id;
      this.poolBatchLimit = 80;
      this.poolTab = 'all';
      this.newListForm = { title: '', icon: 'trophy', includeRegistered: true, includeGuests: false };
      this.saveState();
      this.showListsModal = false;
      Alpine.store('app')?.toast?.(`Tier List "${title}" creada con éxito.`, 'success');
      this.refreshIcons();
      return newList;
    },

    switchTierList(id) {
      const list = this.lists.find(l => l.id === id);
      if (!list) return;
      this.clearSelectedCharacters();
      this.activeListId = id;
      this.poolBatchLimit = 80;
      // Si la pestaña era 'template' pero la nueva lista no tiene personajes de plantilla, cambiar a 'all'
      if (this.poolTab === 'template' && (!list.templateCharacters || list.templateCharacters.length === 0)) {
        this.poolTab = 'all';
      }
      this.saveState();
      this.showListsModal = false;
      Alpine.store('app')?.toast?.(`Cargada: "${list.title || 'Sin Título'}".`, 'info');
      this.refreshIcons();
    },

    duplicateTierList(id) {
      const source = this.lists.find(l => l.id === id) || this.currentList;
      if (!source) return;
      const newId = `list_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      const copy = {
        id: newId,
        title: source.title ? `${source.title} (Copia)` : 'Copia de Tier List',
        icon: source.icon || 'trophy',
        customIconUrl: source.customIconUrl || null,
        iconFit: source.iconFit || 'contain',
        iconZoom: source.iconZoom ?? 100,
        iconX: source.iconX ?? 50,
        iconY: source.iconY ?? 50,
        characterModifiers: JSON.parse(JSON.stringify(source.characterModifiers || {})),
        dividerLabels: JSON.parse(JSON.stringify(source.dividerLabels || {})),
        poolCharacterIds: Array.isArray(source.poolCharacterIds) ? [...source.poolCharacterIds] : [],
        includeRegistered: source.includeRegistered !== false,
        includeGuests: source.includeGuests !== false,
        templateCharacters: JSON.parse(JSON.stringify(source.templateCharacters || [])),
        tiers: JSON.parse(JSON.stringify(source.tiers || DEFAULT_TIERS)).map(t => ({
          ...t,
          characterIds: Array.isArray(t.characterIds) ? [...t.characterIds] : []
        })),
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      this.lists.push(copy);
      this.activeListId = newId;
      this.saveState();
      Alpine.store('app')?.toast?.(`Copia creada: "${copy.title || 'Sin Título'}".`, 'success');
      this.refreshIcons();
    },

    deleteTierList(id) {
      if (this.lists.length <= 1) {
        Alpine.store('app')?.toast?.('No puedes eliminar la única Tier List disponible.', 'warning');
        return;
      }
      const target = this.lists.find(l => l.id === id);
      if (!target) return;

      this.openConfirm({
        title: '¿Eliminar Tier List?',
        message: `¿Estás seguro de que deseas eliminar «${target.title || 'esta lista'}»?`,
        submessage: 'Esta acción no se puede deshacer.',
        confirmText: 'Eliminar Lista',
        confirmType: 'danger',
        icon: 'trash-2',
        onConfirm: () => {
          this.lists = this.lists.filter(l => l.id !== id);
          if (this.activeListId === id) {
            this.activeListId = this.lists[0].id;
          }
          this.saveState();
          Alpine.store('app')?.toast?.(`Tier List «${target.title || 'Sin Título'}» eliminada.`, 'info');
          this.refreshIcons();
        }
      });
    },

    toggleCurrentIncludeRegistered() {
      if (!this.currentList) return;
      this.currentList.includeRegistered = this.currentList.includeRegistered === false ? true : false;
      this.saveState();
      Alpine.store('app')?.toast?.(
        this.currentList.includeRegistered ? 'Fichas registradas habilitadas en esta lista.' : 'Fichas registradas ocultadas de esta lista.',
        'info'
      );
    },

    toggleCurrentIncludeGuests() {
      if (!this.currentList) return;
      this.currentList.includeGuests = this.currentList.includeGuests === false ? true : false;
      this.saveState();
      Alpine.store('app')?.toast?.(
        this.currentList.includeGuests ? 'Mis invitados habilitados en esta lista.' : 'Mis invitados ocultados de esta lista.',
        'info'
      );
    },

    toggleListIncludeRegistered(listId) {
      const list = this.lists.find(l => l.id === listId);
      if (!list) return;
      list.includeRegistered = list.includeRegistered === false ? true : false;
      this.saveState();
    },

    toggleListIncludeGuests(listId) {
      const list = this.lists.find(l => l.id === listId);
      if (!list) return;
      list.includeGuests = list.includeGuests === false ? true : false;
      this.saveState();
    },

    // ── Métodos de Diálogo de Confirmación Cyber HUD ────────────────
    openConfirm({ title, message, submessage = 'Esta acción no se puede deshacer.', confirmText = 'Eliminar', confirmType = 'danger', icon = 'trash-2', onConfirm }) {
      this.confirmDialog = {
        isOpen: true,
        title,
        message,
        submessage,
        confirmText,
        confirmType,
        icon,
        onConfirm
      };
      this.refreshIcons();
      if (typeof window !== 'undefined') {
        setTimeout(() => this.refreshIcons(), 30);
      }
    },

    closeConfirm() {
      this.confirmDialog.isOpen = false;
      this.confirmDialog.onConfirm = null;
    },

    executeConfirm() {
      if (typeof this.confirmDialog.onConfirm === 'function') {
        const fn = this.confirmDialog.onConfirm;
        this.closeConfirm();
        fn();
      } else {
        this.closeConfirm();
      }
    },

    confirmRemoveTier(tierId) {
      const tier = this.tiers.find(t => t.id === tierId);
      if (!tier) return;
      if (this.tiers.length <= 1) {
        Alpine.store('app')?.toast?.('No puedes eliminar el único rango disponible.', 'warning');
        return;
      }
      const count = tier.characterIds?.length || 0;
      if (count > 0) {
        this.openConfirm({
          title: `¿Eliminar Rango «${tier.label}»?`,
          message: `Este rango contiene ${count} operativo(s) clasificado(s).`,
          submessage: 'Los operativos regresarán automáticamente al banco de reserva.',
          confirmText: 'Eliminar Rango',
          confirmType: 'danger',
          icon: 'layers',
          onConfirm: () => {
            this.removeTier(tierId);
          }
        });
      } else {
        this.removeTier(tierId);
      }
    },

    confirmRemoveGuestCharacter(guestId) {
      const guest = this.getGuestById(guestId);
      if (!guest) return;

      this.openConfirm({
        title: '¿Eliminar Operativo?',
        message: `¿Estás seguro de que deseas eliminar a «${guest.name}»?`,
        submessage: 'Se removerá de los rangos y del banco de reserva.',
        confirmText: 'Eliminar',
        confirmType: 'danger',
        icon: 'user-minus',
        onConfirm: () => {
          this.removeGuestCharacter(guestId);
        }
      });
    },

    confirmResetAllToPool() {
      const assigned = this.assignedCount;
      if (assigned === 0) {
        Alpine.store('app')?.toast?.('El tablero ya se encuentra vacío.', 'info');
        return;
      }
      this.openConfirm({
        title: '¿Vaciar Tablero?',
        message: `¿Deseas devolver los ${assigned} operativos clasificados al banco de reserva?`,
        submessage: 'Tus rangos y configuraciones se conservarán intactos.',
        confirmText: 'Devolver al Banco',
        confirmType: 'warning',
        icon: 'rotate-ccw',
        onConfirm: () => {
          this.resetAllToPool();
        }
      });
    },

    confirmResetToDefaults() {
      this.openConfirm({
        title: '¿Restablecer Rangos?',
        message: 'Se restablecerán todos los rangos de esta lista a los valores por defecto (S, A, B, C, D, E).',
        submessage: 'Los operativos clasificados regresarán al banco de reserva.',
        confirmText: 'Restablecer',
        confirmType: 'warning',
        icon: 'refresh-cw',
        onConfirm: () => {
          this.resetToDefaults();
        }
      });
    },

    // ── Gestión de Ícono y Emblema Personalizado ───────────────────
    setTierListIcon(iconId) {
      if (!this.currentList || !iconId) return;
      this.currentList.icon = iconId;
      this.currentList.customIconUrl = null; // Al elegir un icono de catálogo, se desactiva la imagen propia
      this.currentList.updatedAt = Date.now();
      this.saveState();
      this.showIconPickerModal = false;
      Alpine.store('app')?.toast?.(`Ícono actualizado a "${iconId}".`, 'success');
      this.refreshIcons();
    },

    handleCustomIconUpload(event) {
      const file = event.target.files?.[0];
      if (!file) return;
      if (!file.type.startsWith('image/')) {
        Alpine.store('app')?.toast?.('Por favor selecciona un archivo de imagen o GIF válido.', 'warning');
        return;
      }
      Alpine.store('app')?.openCropper(file, 'tierlist_icon');
      event.target.value = '';
    },

    openIconCropper() {
      if (!this.customIconUrl) {
        Alpine.store('app')?.toast?.('No hay ningún emblema personalizado para encuadrar.', 'info');
        return;
      }
      Alpine.store('app')?.openCropper(this.customIconUrl, 'tierlist_icon');
    },

    async processCroppedCustomIcon(file) {
      if (!this.currentList) return;
      try {
        const reader = new FileReader();
        reader.onload = (e) => {
          this.currentList.customIconUrl = e.target.result;
          this.currentList.customIconTransform = '';
          this.currentList.iconZoom = 100;
          this.currentList.iconX = 50;
          this.currentList.iconY = 50;
          this.currentList.iconFit = 'cover';
          this.currentList.updatedAt = Date.now();
          this.saveState();
          Alpine.store('app')?.toast?.('¡Emblema de Tier List recortado y guardado!', 'success');
        };
        reader.readAsDataURL(file);
      } catch (err) {
        console.error(err);
        Alpine.store('app')?.toast?.('Error al procesar el emblema.', 'error');
      }
    },

    async processCroppedCustomIconGif(dataUrl, cssTransform) {
      if (!this.currentList) return;
      this.currentList.customIconUrl = dataUrl;
      this.currentList.customIconTransform = cssTransform;
      this.currentList.iconZoom = 100;
      this.currentList.iconX = 50;
      this.currentList.iconY = 50;
      this.currentList.iconFit = 'cover';
      this.currentList.updatedAt = Date.now();
      this.saveState();
      Alpine.store('app')?.toast?.('¡Emblema GIF animado guardado con encuadre visual!', 'success');
    },

    async setCustomIconFromUrl(url) {
      const trimmed = (url || '').trim();
      if (!trimmed || !this.currentList) return;
      this.customIconUrlInput = '';
      await Alpine.store('app')?.openMediaUrl(trimmed, 'tierlist_icon');
    },

    removeCustomIcon() {
      if (!this.currentList) return;
      this.currentList.customIconUrl = null;
      this.currentList.customIconTransform = '';
      this.currentList.iconZoom = 100;
      this.currentList.iconX = 50;
      this.currentList.iconY = 50;
      this.currentList.iconFit = 'contain';
      this.currentList.updatedAt = Date.now();
      this.saveState();
      Alpine.store('app')?.toast?.('Emblema personalizado eliminado. Se restauró el ícono predeterminado.', 'info');
      this.refreshIcons();
    },

    resetIconAdjustments() {
      if (!this.currentList) return;
      this.currentList.customIconTransform = '';
      this.currentList.iconZoom = 100;
      this.currentList.iconX = 50;
      this.currentList.iconY = 50;
      this.currentList.iconFit = 'cover';
      this.currentList.updatedAt = Date.now();
      this.saveState();
    },

    openIconPicker() {
      this.iconSearchQuery = '';
      this.iconPickerTab = this.customIconUrl ? 'upload' : 'presets';
      this.customIconUrlInput = '';
      this.showIconPickerModal = true;
      this.refreshIcons();
    },

    closeIconPicker() {
      this.showIconPickerModal = false;
    },

    refreshIcons() {
      if (window.lucide?.createIcons) {
        window.lucide.createIcons();
      }
    },

    setRowOpacity(val) {
      const num = Math.max(0, Math.min(100, Number(val)));
      this.rowOpacity = isNaN(num) ? 40 : num;
      this.saveState();
    },

    getTierBackground(tier) {
      if (!tier) return '#3b82f6';
      if (tier.colorType === 'gradient') {
        const dir = tier.gradientDir || 'to bottom';
        const c1 = tier.color1 || '#0b4f6c';
        const c2 = tier.color2 || '#00c9a7';
        return `linear-gradient(${dir}, ${c1}, ${c2})`;
      }
      if (tier.solidColor) return tier.solidColor;
      if (tier.color && !tier.color.includes('gradient')) return tier.color;
      if (tier.color1 && !tier.color1.includes('gradient')) return tier.color1;
      return '#ef4444';
    },

    getTierSolidColor(tier) {
      if (!tier) return '#ef4444';
      if (tier.solidColor) return tier.solidColor;
      if (tier.color && !tier.color.includes('gradient')) return tier.color;
      if (tier.color1 && !tier.color1.includes('gradient')) return tier.color1;
      return '#ef4444';
    },

    getTierTextColor(tier) {
      // Garantizar siempre fuente puramente blanca con alto contraste en todas las Tier Lists
      return '#ffffff';
    },

    _hexToRgba(hex, alpha = 0.5) {
      if (!hex || typeof hex !== 'string') return `rgba(6, 182, 212, ${alpha})`;
      let h = hex.trim().replace('#', '');
      if (h.length === 3) h = h.split('').map(c => c + c).join('');
      if (h.length !== 6) return `rgba(6, 182, 212, ${alpha})`;
      const r = parseInt(h.substring(0, 2), 16);
      const g = parseInt(h.substring(2, 4), 16);
      const b = parseInt(h.substring(4, 6), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    },

    _getColorLuminance(hex) {
      if (!hex || typeof hex !== 'string') return 0;
      let h = hex.trim().replace('#', '');
      if (h.length === 3) h = h.split('').map(c => c + c).join('');
      if (h.length !== 6) return 0;
      const r = parseInt(h.substring(0, 2), 16) / 255;
      const g = parseInt(h.substring(2, 4), 16) / 255;
      const b = parseInt(h.substring(4, 6), 16) / 255;
      const norm = (c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
      return 0.2126 * norm(r) + 0.7152 * norm(g) + 0.0722 * norm(b);
    },

    getTierPrimaryColor(tier) {
      if (!tier) return '#00f0ff';
      if (tier.colorType === 'gradient') return tier.color1 || '#ef4444';
      return this.getTierSolidColor(tier);
    },

    getTierSecondaryColor(tier) {
      if (!tier) return '#00c9a7';
      if (tier.colorType === 'gradient') return tier.color2 || '#00c9a7';
      return this.getTierSolidColor(tier);
    },

    getTierEditBtnStyle(tier) {
      if (!tier) return '';
      const isGrad = tier.colorType === 'gradient';
      const c1 = isGrad ? (tier.color1 || '#ef4444') : this.getTierSolidColor(tier);
      const c2 = isGrad ? (tier.color2 || '#00c9a7') : c1;

      // Calcular luminancia en la zona del botón (esquina inferior derecha)
      const lum1 = this._getColorLuminance(c1);
      const lum2 = this._getColorLuminance(c2);
      const avgLum = isGrad ? (lum1 * 0.35 + lum2 * 0.65) : lum1;

      // Si el fondo del tier es muy claro o blanco (luminancia > 0.62):
      // Modo claro: botón blanco con texto e ícono oscuros de alta legibilidad
      if (avgLum > 0.62) {
        return `
          --tier-edit-color: #0b0e17;
          --tier-edit-icon-stroke: #0b0e17;
          --tier-edit-bg: rgba(255, 255, 255, 0.9);
          --tier-edit-border: rgba(0, 0, 0, 0.35);
          --tier-edit-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
          --tier-edit-hover-bg: #0b0e17;
          --tier-edit-hover-color: #ffffff;
          --tier-edit-hover-border: #0b0e17;
          --tier-edit-hover-icon-stroke: #ffffff;
        `;
      }

      // Para fondos estándar y oscuros (azul marino, negro, rojo, morado, etc.):
      // El botón usa SIEMPRE texto e ícono blanco puro de alto contraste sobre cristal oscuro
      return `
        --tier-edit-color: #ffffff;
        --tier-edit-icon-stroke: #ffffff;
        --tier-edit-bg: rgba(0, 0, 0, 0.68);
        --tier-edit-border: rgba(255, 255, 255, 0.35);
        --tier-edit-shadow: 0 2px 8px rgba(0, 0, 0, 0.65);
        --tier-edit-hover-bg: #ffffff;
        --tier-edit-hover-color: #0b0e17;
        --tier-edit-hover-border: #ffffff;
        --tier-edit-hover-icon-stroke: #0b0e17;
      `;
    },

    getTierModalAuraStyle(tier) {
      if (!tier) {
        return 'background-color: #0b0e17; border: 1.5px solid rgba(0, 240, 255, 0.4); box-shadow: 0 0 24px rgba(0, 240, 255, 0.18), 0 20px 45px -10px rgba(0, 0, 0, 0.85);';
      }
      if (tier.colorType === 'gradient') {
        const c1 = tier.color1 || '#ef4444';
        const c2 = tier.color2 || '#00c9a7';
        const rgba1 = this._hexToRgba(c1, 0.22);
        const rgba2 = this._hexToRgba(c2, 0.22);
        const gradBorder = `linear-gradient(to bottom, ${this._hexToRgba(c1, 0.65)}, ${this._hexToRgba(c2, 0.65)})`;
        return `background: linear-gradient(#0b0e17, #0b0e17) padding-box, ${gradBorder} border-box; border: 1.5px solid transparent; box-shadow: 0 -6px 20px -2px ${rgba1}, 0 10px 24px -2px ${rgba2}, 0 22px 45px -10px rgba(0, 0, 0, 0.85);`;
      } else {
        const c = this.getTierSolidColor(tier);
        const rgba = this._hexToRgba(c, 0.22);
        const borderColor = this._hexToRgba(c, 0.55);
        return `background-color: #0b0e17; border: 1.5px solid ${borderColor}; box-shadow: 0 0 24px ${rgba}, 0 22px 45px -10px rgba(0, 0, 0, 0.85);`;
      }
    },

    getTierLabelStyle(tier, isCollapsed = false) {
      const raw = tier?.label || '';
      const label = raw.trim();
      const len = label.length;

      if (isCollapsed) {
        if (len <= 2) {
          return 'font-size: 1.4rem; line-height: 1; letter-spacing: 0.04em; font-weight: 900; white-space: nowrap; text-align: center; color: #ffffff !important; text-shadow: 0 2px 8px rgba(0,0,0,0.9);';
        }
        if (len <= 5) {
          return 'font-size: 1.15rem; line-height: 1; letter-spacing: 0.03em; font-weight: 900; white-space: nowrap; text-align: center; color: #ffffff !important; text-shadow: 0 2px 8px rgba(0,0,0,0.9);';
        }
        if (len <= 11) {
          return 'font-size: 0.92rem; line-height: 1.1; letter-spacing: 0.02em; font-weight: 800; white-space: nowrap; text-align: center; color: #ffffff !important; text-shadow: 0 2px 8px rgba(0,0,0,0.9);';
        }
        if (len <= 18) {
          return 'font-size: 0.8rem; line-height: 1.15; letter-spacing: 0.015em; font-weight: 800; white-space: nowrap; text-align: center; color: #ffffff !important; text-shadow: 0 2px 8px rgba(0,0,0,0.9);';
        }
        // Para textos largos (ej: "PIZZA MOZZARELLA", "EL STAND QUE PUEDE HACER HERVIR")
        return 'font-size: 0.72rem; line-height: 1.15; letter-spacing: 0.01em; font-weight: 800; white-space: nowrap; text-align: center; color: #ffffff !important; text-shadow: 0 2px 8px rgba(0,0,0,0.9);';
      }

      const words = label.split(/\s+/).filter(Boolean);
      const maxWordLen = words.length > 0 ? Math.max(...words.map(w => w.length)) : len;

      let fontSize = '2.25rem';
      let lineHeight = '1.05';
      let letterSpacing = '0.04em';

      if (len <= 2) {
        fontSize = '2.25rem';
        lineHeight = '1.05';
        letterSpacing = '0.04em';
      } else if (len <= 4 && maxWordLen <= 4) {
        fontSize = '1.75rem';
        lineHeight = '1.08';
        letterSpacing = '0.03em';
      } else if (len <= 7 && maxWordLen <= 7) {
        fontSize = '1.35rem';
        lineHeight = '1.12';
        letterSpacing = '0.025em';
      } else if (len <= 11 && maxWordLen <= 8) {
        fontSize = '1.05rem';
        lineHeight = '1.15';
        letterSpacing = '0.02em';
      } else if (len <= 17 || maxWordLen <= 12) {
        fontSize = '0.85rem';
        lineHeight = '1.18';
        letterSpacing = '0.015em';
      } else if (len <= 25) {
        fontSize = '0.72rem';
        lineHeight = '1.15';
        letterSpacing = '0.01em';
      } else {
        fontSize = '0.62rem';
        lineHeight = '1.12';
        letterSpacing = '0.005em';
      }

      return `font-size: ${fontSize}; line-height: ${lineHeight}; letter-spacing: ${letterSpacing}; word-break: break-word; overflow-wrap: anywhere; hyphens: auto; max-width: 100%; text-align: center; color: #ffffff !important; text-shadow: 0 2px 8px rgba(0, 0, 0, 0.9), 0 0 14px rgba(0, 0, 0, 0.7);`;
    },

    get hasLongTierLabels() {
      return (this.tiers || []).some(t => ((t.label || '').trim().length > 3));
    },

    getQuickMenuLabelStyle(tier) {
      const raw = (tier?.label || '').trim();
      const len = raw.length;
      const words = raw.split(/\s+/).filter(Boolean);
      const maxWordLen = words.length > 0 ? Math.max(...words.map(w => w.length)) : len;

      let fontSize = '0.85rem';
      let lineHeight = '1';
      let letterSpacing = '0.04em';

      if (len <= 2) {
        fontSize = '0.85rem';
        lineHeight = '1';
        letterSpacing = '0.04em';
      } else if (len <= 4 && maxWordLen <= 4) {
        fontSize = '0.75rem';
        lineHeight = '1.05';
        letterSpacing = '0.025em';
      } else if (len <= 8 && maxWordLen <= 8) {
        fontSize = '0.66rem';
        lineHeight = '1.05';
        letterSpacing = '0.015em';
      } else if (len <= 15) {
        fontSize = '0.58rem';
        lineHeight = '1.05';
        letterSpacing = '0.005em';
      } else {
        fontSize = '0.50rem';
        lineHeight = '1';
        letterSpacing = '0em';
      }

      return `font-size: ${fontSize}; line-height: ${lineHeight}; letter-spacing: ${letterSpacing}; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis; word-break: break-word; overflow-wrap: anywhere; text-align: center; color: #ffffff !important; text-shadow: 0 1px 4px rgba(0, 0, 0, 0.85);`;
    },

    // ── Resolución Unificada de Personajes (Ficha o Invitado) ────────
    resolveCharacter(id) {
      if (!id) return null;
      // 1. Fichas registradas del usuario
      const charStore = Alpine.store('characters');
      const reg = charStore?.list?.find(c => c.id === id);
      if (reg) return reg;

      // 2. Personajes de la plantilla importada exclusiva de la lista actual
      const templateChar = (this.currentTemplateCharacters || []).find(c => c.id === id);
      if (templateChar) return templateChar;

      // 3. Personajes invitados manuales propios del usuario
      const manualGuest = (this.guestCharacters || []).find(c => c.id === id);
      if (manualGuest) return manualGuest;

      // 4. Fallback: buscar en plantillas de otras listas por si se está duplicando o visualizando
      for (const list of this.lists) {
        if (Array.isArray(list.templateCharacters)) {
          const found = list.templateCharacters.find(c => c.id === id);
          if (found) return found;
        }
      }
      return null;
    },

    getGuestById(id) {
      if (!id) return null;
      // 1. Plantilla de lista actual
      const tm = (this.currentTemplateCharacters || []).find(c => c.id === id);
      if (tm) return tm;

      // 2. Invitados manuales
      const g = (this.guestCharacters || []).find(c => c.id === id);
      if (g) return g;

      // 3. Fallback en otras listas
      for (const list of this.lists) {
        if (Array.isArray(list.templateCharacters)) {
          const found = list.templateCharacters.find(c => c.id === id);
          if (found) return found;
        }
      }
      return null;
    },

    // ── Estilo y Borde de Tokens de Personajes (Marco del Sistema y Badges) ────
    isTokenFrameEnabled(char) {
      if (!char) return true;
      const settings = Alpine.store('settings');
      if (!settings) return true;
      if (char.isTemplate) {
        return settings.tierlistShowFrameTemplate !== false;
      }
      if (char.isGuest) {
        return settings.tierlistShowFrameGuest !== false;
      }
      return settings.tierlistShowFrameRegistered !== false;
    },

    getTokenAvatarBoxRadius(char) {
      if (!char) return 25;
      const settings = Alpine.store('settings');
      if (!settings) return 25;
      if (char.isTemplate) {
        return settings.tierlistBorderRadiusTemplate !== undefined ? settings.tierlistBorderRadiusTemplate : 25;
      }
      if (char.isGuest) {
        return settings.tierlistBorderRadiusGuest !== undefined ? settings.tierlistBorderRadiusGuest : 25;
      }
      return settings.tierlistBorderRadiusRegistered !== undefined ? settings.tierlistBorderRadiusRegistered : 25;
    },

    getTokenAvatarBoxClass(char) {
      if (!char) return 'border-2';
      const hasFrame = this.isTokenFrameEnabled(char);
      if (!hasFrame) {
        return 'border-0';
      }
      if (char.basics?.avatarFrame?.url) {
        return 'border-2 border-black/60';
      }
      return 'border-2';
    },

    getTokenAvatarBoxStyle(char) {
      if (!char) return '';
      const radius = this.getTokenAvatarBoxRadius(char);
      const radiusStyle = `border-radius: ${radius}%;`;

      if (!this.isTokenFrameEnabled(char)) {
        return `border: none !important; box-shadow: none !important; ${radiusStyle}`;
      }
      if (char.basics?.avatarFrame?.url) {
        return radiusStyle;
      }
      const settings = Alpine.store('settings');
      const charStore = Alpine.store('characters');
      const app = Alpine.store('app');
      const accent = (charStore && typeof charStore.getCharAccentColor === 'function')
        ? charStore.getCharAccentColor(char)
        : (settings?.accentColor || '#00f0ff');
      const glow = app?.hexToRgba ? app.hexToRgba(accent, 0.35) : 'rgba(0,240,255,0.35)';

      // 1. Personajes de Plantilla (Importados de TierMaker)
      if (char.isTemplate) {
        if (settings?.hideTemplateBadge) {
          return `border-color: ${accent}; box-shadow: 0 0 10px ${glow}; ${radiusStyle}`;
        }
        return `border-color: #f59e0b; box-shadow: 0 0 12px rgba(245, 158, 11, 0.4); ${radiusStyle}`;
      }

      // 2. Personajes Invitados Manuales (Sin Ficha)
      if (char.isGuest) {
        if (settings?.hideGuestBadge) {
          return `border-color: ${accent}; box-shadow: 0 0 10px ${glow}; ${radiusStyle}`;
        }
        return `border-color: #a855f7; box-shadow: 0 0 12px rgba(168, 85, 247, 0.4); ${radiusStyle}`;
      }

      // 3. Personajes Registrados con Ficha
      return `border-color: ${accent}; box-shadow: 0 0 10px ${glow}; ${radiusStyle}`;
    },

    shouldShowTemplateBadge(char) {
      if (!char || !char.isTemplate) return false;
      const settings = Alpine.store('settings');
      return !settings?.hideTemplateBadge;
    },

    shouldShowGuestBadge(char) {
      if (!char || !char.isGuest || char.isTemplate) return false;
      const settings = Alpine.store('settings');
      return !settings?.hideGuestBadge;
    },

    // ── Getters reactivos ───────────────────────────────────────────
    get tokenSizeLabel() {
      const s = this.tokenSize || 72;
      if (s <= 56) return `Chico (${s}px)`;
      if (s <= 76) return `Medio (${s}px)`;
      if (s <= 92) return `Grande (${s}px)`;
      return `Extra (${s}px)`;
    },

    get itemGapLabel() {
      const g = this.itemGap !== undefined ? this.itemGap : 10;
      if (g === 0) return 'Junto (0px)';
      if (g <= 4) return `Mínimo (${g}px)`;
      if (g <= 8) return `Compacto (${g}px)`;
      if (g <= 12) return `Normal (${g}px)`;
      if (g <= 18) return `Medio (${g}px)`;
      if (g <= 26) return `Espacioso (${g}px)`;
      return `Amplio (${g}px)`;
    },

    get currentTemplateCharacters() {
      return (this.currentList && Array.isArray(this.currentList.templateCharacters)) ? this.currentList.templateCharacters : [];
    },

    get templateUnassignedCount() {
      const templateList = this.currentTemplateCharacters;
      if (templateList.length === 0) return 0;
      const assignedIds = new Set();
      this.tiers.forEach(t => (t.characterIds || []).forEach(id => {
        if (!this.isOperatorItem(id)) assignedIds.add(id);
      }));
      return templateList.filter(c => !assignedIds.has(c.id)).length;
    },

    get manualGuestUnassignedCount() {
      if (this.currentList?.includeGuests === false) return 0;
      const guestList = Array.isArray(this.guestCharacters) ? this.guestCharacters : [];
      const assignedIds = new Set();
      this.tiers.forEach(t => (t.characterIds || []).forEach(id => {
        if (!this.isOperatorItem(id)) assignedIds.add(id);
      }));
      return guestList.filter(c => !assignedIds.has(c.id)).length;
    },

    get guestUnassignedCount() {
      return this.manualGuestUnassignedCount;
    },

    get registeredUnassignedCount() {
      if (this.currentList?.includeRegistered === false) return 0;
      const charStore = Alpine.store('characters');
      const regList = (charStore && Array.isArray(charStore.list)) ? charStore.list : [];
      const assignedIds = new Set();
      this.tiers.forEach(t => (t.characterIds || []).forEach(id => {
        if (!this.isOperatorItem(id)) assignedIds.add(id);
      }));
      return regList.filter(c => !assignedIds.has(c.id)).length;
    },

    get totalUnassignedCount() {
      const charStore = Alpine.store('characters');
      const showRegistered = this.currentList?.includeRegistered !== false;
      const showGuests = this.currentList?.includeGuests !== false;

      const regList = (showRegistered && charStore && Array.isArray(charStore.list)) ? charStore.list : [];
      const guestList = (showGuests && Array.isArray(this.guestCharacters)) ? this.guestCharacters : [];
      const templateList = Array.isArray(this.currentTemplateCharacters) ? this.currentTemplateCharacters : [];

      const assignedIds = new Set();
      this.tiers.forEach(t => (t.characterIds || []).forEach(id => {
        if (!this.isOperatorItem(id)) assignedIds.add(id);
      }));
      return [...templateList, ...regList, ...guestList].filter(c => !assignedIds.has(c.id)).length;
    },

    get unassignedCharacters() {
      const charStore = Alpine.store('characters');
      const showRegistered = this.currentList?.includeRegistered !== false;
      const showGuests = this.currentList?.includeGuests !== false;

      const regList = (showRegistered && charStore && Array.isArray(charStore.list)) ? charStore.list : [];
      const guestList = (showGuests && Array.isArray(this.guestCharacters)) ? this.guestCharacters : [];
      const templateList = Array.isArray(this.currentTemplateCharacters) ? this.currentTemplateCharacters : [];

      const assignedIds = new Set();
      this.tiers.forEach(t => {
        (t.characterIds || []).forEach(id => {
          if (!this.isOperatorItem(id)) assignedIds.add(id);
        });
      });

      let pool = [];
      if (this.poolTab === 'template') {
        pool = templateList.filter(c => !assignedIds.has(c.id));
      } else if (this.poolTab === 'sheets') {
        pool = regList.filter(c => !assignedIds.has(c.id));
      } else if (this.poolTab === 'guests') {
        pool = guestList.filter(c => !assignedIds.has(c.id));
      } else {
        // En 'all': mostrar personajes de plantilla de esta lista primero, luego fichas registradas, luego invitados manuales
        pool = [...templateList, ...regList, ...guestList].filter(c => !assignedIds.has(c.id));
      }

      if (this.poolFolderFilter && this.poolFolderFilter !== 'all') {
        if (this.poolFolderFilter === 'unassigned') {
          pool = pool.filter(c => !c.folderId);
        } else {
          pool = pool.filter(c => c.folderId === this.poolFolderFilter);
        }
      }

      if (this.searchQuery && this.searchQuery.trim()) {
        const q = this.searchQuery.trim().toLowerCase();
        pool = pool.filter(c => (c.name || '').toLowerCase().includes(q));
      }

      if (this.poolSortOrder === 'default' && Array.isArray(this.poolCharacterIds) && this.poolCharacterIds.length > 0) {
        const orderMap = new Map();
        this.poolCharacterIds.forEach((id, idx) => orderMap.set(id, idx));
        pool.sort((a, b) => {
          const indexA = orderMap.has(a.id) ? orderMap.get(a.id) : 999999;
          const indexB = orderMap.has(b.id) ? orderMap.get(b.id) : 999999;
          return indexA - indexB;
        });
      } else if (this.poolSortOrder === 'name-asc') {
        pool.sort((a, b) => (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' }));
      } else if (this.poolSortOrder === 'name-desc') {
        pool.sort((a, b) => (b.name || '').localeCompare(a.name || '', undefined, { sensitivity: 'base' }));
      } else if (this.poolSortOrder === 'type') {
        const typeWeight = (c) => c.isTemplate ? 1 : (c.isGuest ? 2 : 0);
        pool.sort((a, b) => typeWeight(a) - typeWeight(b) || (a.name || '').localeCompare(b.name || ''));
      }

      return pool;
    },

    get visibleUnassignedCharacters() {
      const all = this.unassignedCharacters || [];
      if (this.searchQuery && this.searchQuery.trim()) {
        return all;
      }
      return all.slice(0, this.poolBatchLimit || 80);
    },

    get assignedCount() {
      let count = 0;
      this.tiers.forEach(t => {
        count += (t.characterIds || []).filter(id => !this.isOperatorItem(id)).length;
      });
      return count;
    },

    get selectedCharacters() {
      if (!Array.isArray(this.selectedCharacterIds) || this.selectedCharacterIds.length === 0) return [];
      return this.selectedCharacterIds.map(id => this.resolveCharacter(id)).filter(Boolean);
    },

    get selectedDisplayItems() {
      if (!Array.isArray(this.selectedCharacterIds) || this.selectedCharacterIds.length === 0) return [];
      return this.selectedCharacterIds.map(id => {
        if (this.isOperatorItem(id)) {
          const op = this.getOperatorInfo(id);
          return {
            id,
            name: op?.name || 'Operador',
            isOperator: true,
            symbol: op?.symbol || '?',
            color: op?.color || '#00f0ff',
            bg: op?.bg || 'rgba(0, 240, 255, 0.15)'
          };
        }
        const char = this.resolveCharacter(id);
        if (!char) return null;
        return {
          id: char.id,
          name: char.name || 'Operativo',
          isOperator: false,
          char
        };
      }).filter(Boolean);
    },

    get selectedCount() {
      return this.selectedCharacterIds.length;
    },

    get selectedCountLabel() {
      const count = this.selectedCount;
      const opCount = (this.selectedCharacterIds || []).filter(id => this.isOperatorItem(id)).length;
      if (opCount === count) {
        return count === 1 ? 'Operador' : 'Operadores';
      }
      if (opCount > 0) {
        return count === 1 ? 'Elemento' : 'Elementos';
      }
      return count === 1 ? 'Operativo' : 'Operativos';
    },

    getTierCharacters(tierId) {
      const tier = this.tiers.find(t => t.id === tierId);
      if (!tier || !Array.isArray(tier.characterIds)) return [];
      return tier.characterIds
        .filter(id => !this.isOperatorItem(id))
        .map(id => this.resolveCharacter(id))
        .filter(Boolean);
    },

    // ── Funciones de Calificación, Operadores y Modificadores ─────
    getRatingTool(id) {
      if (!id) return null;
      const custom = (this.customRatingTools || []).find(t => t.id === id);
      if (custom) return custom;
      return TIER_RATING_TOOLS.find(t => t.id === id) || null;
    },

    toolsByCategory(cat) {
      if (cat === 'custom') {
        return this.customRatingTools || [];
      }
      return TIER_RATING_TOOLS.filter(t => t.category === cat && !t.isSubTool);
    },

    getRatingToolsForDisplay(cat) {
      const q = (this.toolboxSearchQuery || '').trim().toLowerCase();
      let list = [];
      if (cat === 'custom') {
        list = this.customRatingTools || [];
      } else {
        list = TIER_RATING_TOOLS.filter(t => t.category === cat && !t.isSubTool);
      }
      if (!q) return list;
      return list.filter(t =>
        (t.symbol && t.symbol.toLowerCase().includes(q)) ||
        (t.name && t.name.toLowerCase().includes(q)) ||
        (t.desc && t.desc.toLowerCase().includes(q))
      );
    },

    setToolboxCategoryFilter(cat) {
      this.toolboxCategoryFilter = cat;
      this.refreshIcons();
    },

    // ── Gestión de Conectores y Modificadores Personalizados ─────────
    openCreateCustomToolModal(preset = null) {
      this.editingCustomToolId = null;
      if (preset && typeof preset === 'object') {
        this.customToolForm = {
          symbol: preset.symbol || '',
          name: preset.name || preset.symbol || '',
          desc: preset.desc || '',
          color: preset.color || '#00f0ff',
          type: preset.type || 'both'
        };
      } else {
        this.customToolForm = {
          symbol: '',
          name: '',
          desc: '',
          color: Alpine.store('settings')?.accentColor || '#00f0ff',
          type: 'both'
        };
      }
      this.showCustomToolModal = true;
      this.refreshIcons();
    },

    openEditCustomToolModal(toolId) {
      const tool = (this.customRatingTools || []).find(t => t.id === toolId);
      if (!tool) return;
      this.editingCustomToolId = toolId;
      this.customToolForm = {
        symbol: tool.symbol || '',
        name: tool.name || '',
        desc: tool.desc || '',
        color: tool.color || '#00f0ff',
        type: tool.type || 'both'
      };
      this.showCustomToolModal = true;
      this.refreshIcons();
    },

    closeCustomToolModal() {
      this.showCustomToolModal = false;
      this.editingCustomToolId = null;
    },

    saveCustomRatingTool() {
      const symbol = (this.customToolForm.symbol || '').trim();
      if (!symbol) {
        Alpine.store('app')?.toast?.('Por favor ingresa un símbolo o sigla corta (ej: VS, BUFF, NERF, MVP).', 'warning');
        return;
      }
      const name = (this.customToolForm.name || '').trim() || symbol;
      const desc = (this.customToolForm.desc || '').trim();
      const color = this.customToolForm.color || '#00f0ff';
      const type = this.customToolForm.type || 'both';
      const bg = this._hexToRgba(color, 0.16);
      const border = this._hexToRgba(color, 0.5);

      if (this.editingCustomToolId) {
        const found = (this.customRatingTools || []).find(t => t.id === this.editingCustomToolId);
        if (found) {
          found.symbol = symbol;
          found.name = name;
          found.desc = desc;
          found.color = color;
          found.bg = bg;
          found.border = border;
          found.type = type;
        }
        this.customRatingTools = [...this.customRatingTools];
        this.saveState(true);
        Alpine.store('app')?.toast?.(`Conector personalizado "${symbol}" actualizado con éxito.`, 'success');
      } else {
        const newTool = {
          id: `custom_op_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          category: 'custom',
          categoryLabel: 'Personalizados',
          symbol,
          name,
          desc,
          color,
          bg,
          border,
          type,
          isCustom: true
        };
        this.customRatingTools = [...(this.customRatingTools || []), newTool];
        this.saveState(true);
        Alpine.store('app')?.toast?.(`¡Conector personalizado "${symbol}" creado y añadido a tus herramientas!`, 'success');
      }

      this.closeCustomToolModal();
      this.toolboxCategoryFilter = 'custom';
      this.refreshIcons();
    },

    deleteCustomRatingTool(toolId, askConfirm = false) {
      if (!toolId) return;
      const tool = (this.customRatingTools || []).find(t => t.id === toolId);
      if (!tool) return;
      const symbol = tool.symbol || '';

      if (askConfirm) {
        this.openConfirm({
          title: 'Eliminar Conector',
          message: `¿Deseas eliminar definitivamente el conector "${symbol}"?`,
          submessage: 'Se retirará de tu caja de herramientas y de cualquier rango donde esté colocado en el tablero.',
          confirmText: 'Eliminar Conector',
          confirmType: 'danger',
          icon: 'trash-2',
          onConfirm: () => {
            this.deleteCustomRatingTool(toolId, false);
          }
        });
        return;
      }

      this.customRatingTools = (this.customRatingTools || []).filter(t => t.id !== toolId);
      
      // Retirar del tablero si estaba insertado en alguna tier
      (this.tiers || []).forEach(tier => {
        if (Array.isArray(tier.characterIds)) {
          tier.characterIds = tier.characterIds.filter(id => id !== `op:${toolId}`);
        }
      });
      if (this.selectedToolId === toolId) {
        this.selectedToolId = null;
      }

      this.saveState(true);
      Alpine.store('app')?.toast?.(`Conector "${symbol}" eliminado con éxito.`, 'info');
      this.closeCustomToolModal();
      this.refreshIcons();
    },

    confirmClearAllBoardOperators() {
      let totalCount = 0;
      (this.tiers || []).forEach(tier => {
        if (Array.isArray(tier.characterIds)) {
          const count = tier.characterIds.filter(id => this.isOperatorItem(id)).length;
          totalCount += count;
        }
      });

      if (totalCount === 0) {
        Alpine.store('app')?.toast?.('No hay conectores u operadores colocados en el tablero.', 'info');
        return;
      }

      this.openConfirm({
        title: 'Limpiar Conectores del Tablero',
        message: `¿Deseas retirar los ${totalCount} conectores y operadores de todos los rangos?`,
        submessage: 'Los operativos y personajes se mantendrán intactos en sus posiciones actuales.',
        confirmText: 'Retirar Todos',
        confirmType: 'warning',
        icon: 'eraser',
        onConfirm: () => {
          this.clearAllBoardOperators();
        }
      });
    },

    clearAllBoardOperators() {
      let totalCount = 0;
      (this.tiers || []).forEach(tier => {
        if (Array.isArray(tier.characterIds)) {
          const count = tier.characterIds.filter(id => this.isOperatorItem(id)).length;
          totalCount += count;
        }
      });

      if (totalCount === 0) {
        Alpine.store('app')?.toast?.('No hay operadores ni conectores en ningún rango del tablero.', 'info');
        return;
      }

      this.pushUndoSnapshot('Limpiar todos los operadores del tablero');
      (this.tiers || []).forEach(tier => {
        if (Array.isArray(tier.characterIds)) {
          tier.characterIds = tier.characterIds.filter(id => !this.isOperatorItem(id));
        }
      });
      this.saveState();
      Alpine.store('app')?.toast?.(`Se retiraron todos los ${totalCount} conectores del tablero. Los personajes permanecen intactos.`, 'success');
      this.refreshIcons();
    },

    isOperatorItem(id) {
      return typeof id === 'string' && id.startsWith('op:');
    },

    getOperatorInfo(id) {
      if (!this.isOperatorItem(id)) return null;
      const parts = id.split(':');
      const toolId = parts[1];
      if (toolId === 'ctx_combo') return this.getRatingTool('ctx_bracket_open') || this.getRatingTool('ctx_combo');
      if (toolId === 'ctx_cond') return this.getRatingTool('ctx_paren_open') || this.getRatingTool('ctx_cond');
      const found = this.getRatingTool(toolId);
      if (found) return found;
      return {
        id: toolId,
        symbol: parts[2] || toolId,
        name: 'Operador',
        desc: '',
        color: '#06b6d4',
        bg: 'rgba(6, 182, 212, 0.15)',
        border: 'rgba(6, 182, 212, 0.45)'
      };
    },

    getTierRowItems(tierId) {
      const tier = this.tiers.find(t => t.id === tierId);
      if (!tier || !Array.isArray(tier.characterIds)) return [];
      return tier.characterIds.map((id, index) => {
        if (this.isOperatorItem(id)) {
          const tool = this.getOperatorInfo(id);
          return {
            type: 'operator',
            rawId: id,
            index,
            tool
          };
        }
        const char = this.resolveCharacter(id);
        if (!char) return null;
        return {
          type: 'character',
          rawId: id,
          index,
          char,
          modifiers: this.getCharacterModifiers(id)
        };
      }).filter(Boolean);
    },

    getTierCharacterCount(tierId) {
      const tier = this.tiers.find(t => t.id === tierId);
      if (!tier || !Array.isArray(tier.characterIds)) return 0;
      return tier.characterIds.filter(id => !this.isOperatorItem(id)).length;
    },

    isCharacterInTier(charId) {
      if (!charId) return false;
      return this.tiers.some(t => Array.isArray(t.characterIds) && t.characterIds.includes(charId));
    },

    getCharacterModifiers(charId) {
      if (!charId || !this.currentList) return [];
      const list = this.characterModifiers[charId];
      if (!Array.isArray(list)) return [];
      return list.map(tid => this.getRatingTool(tid)).filter(Boolean);
    },

    addCharacterModifier(charId, toolId) {
      this.pushUndoSnapshot('Añadir modificador');
      if (!charId || !toolId || !this.currentList) return;
      if (!this.isCharacterInTier(charId)) {
        Alpine.store('app')?.toast?.('Solo puedes calificar operativos clasificados en el tablero.', 'warning');
        return;
      }
      if (!this.characterModifiers[charId]) {
        this.characterModifiers[charId] = [];
      }
      if (!this.characterModifiers[charId].includes(toolId)) {
        this.characterModifiers[charId].push(toolId);
        this.saveState();
        const tool = this.getRatingTool(toolId);
        Alpine.store('app')?.toast?.(`Insignia "${tool?.symbol || toolId}" asignada a ${this.resolveCharacter(charId)?.name || 'operativo'}.`, 'success');
      }
    },

    removeCharacterModifier(charId, toolId) {
      this.pushUndoSnapshot('Quitar modificador');
      if (!charId || !this.currentList || !this.characterModifiers[charId]) return;
      this.characterModifiers[charId] = this.characterModifiers[charId].filter(id => id !== toolId);
      if (this.characterModifiers[charId].length === 0) {
        delete this.characterModifiers[charId];
      }
      this.saveState();
    },

    toggleCharacterModifier(charId, toolId) {
      if (!this.characterModifiers[charId]?.includes(toolId)) {
        this.addCharacterModifier(charId, toolId);
      } else {
        this.removeCharacterModifier(charId, toolId);
        const tool = this.getRatingTool(toolId);
        Alpine.store('app')?.toast?.(`Insignia "${tool?.symbol || toolId}" retirada.`, 'info');
      }
    },

    toggleModifierForMultiple(charIds, toolId) {
      if (!Array.isArray(charIds) || charIds.length === 0 || !toolId) return;
      const tool = this.getRatingTool(toolId);
      this.pushUndoSnapshot('Modificadores en lote');
      const allHave = charIds.every(id => Array.isArray(this.characterModifiers[id]) && this.characterModifiers[id].includes(toolId));
      if (allHave) {
        charIds.forEach(id => {
          if (this.characterModifiers[id]) {
            this.characterModifiers[id] = this.characterModifiers[id].filter(t => t !== toolId);
            if (this.characterModifiers[id].length === 0) {
              delete this.characterModifiers[id];
            }
          }
        });
        this.saveState();
        Alpine.store('app')?.toast?.(`Insignia "${tool?.symbol || toolId}" retirada de ${charIds.length} operativos.`, 'info');
      } else {
        charIds.forEach(id => {
          if (!this.characterModifiers[id]) this.characterModifiers[id] = [];
          if (!this.characterModifiers[id].includes(toolId)) {
            this.characterModifiers[id].push(toolId);
          }
        });
        this.saveState();
        Alpine.store('app')?.toast?.(`Insignia "${tool?.symbol || toolId}" asignada a ${charIds.length} operativos.`, 'success');
      }
    },

    getSelectedCharactersTierInfo() {
      const boardIds = (this.selectedCharacterIds || []).filter(id => this.isCharacterInTier(id) && !this.isOperatorItem(id));
      if (boardIds.length < 2) return null;
      let detectedTier = null;
      for (const id of boardIds) {
        const tier = this.tiers.find(t => (t.characterIds || []).includes(id));
        if (!tier) return null;
        if (!detectedTier) {
          detectedTier = tier;
        } else if (detectedTier.id !== tier.id) {
          return null; // Seleccionados pertenecen a distintos tiers
        }
      }
      return { tier: detectedTier, characterIds: boardIds };
    },

    interleaveOperatorBetweenSelected(operatorToolId = 'op_gt') {
      const tierInfo = this.getSelectedCharactersTierInfo();
      if (!tierInfo) {
        Alpine.store('app')?.toast?.('Selecciona 2 o más operativos dentro del mismo rango para conectarlos.', 'warning');
        return;
      }
      const { tier, characterIds } = tierInfo;
      const tool = this.getRatingTool(operatorToolId);
      if (!tool) return;

      this.pushUndoSnapshot('Conectar en bloque');
      const currentList = [...(tier.characterIds || [])];
      const sortedSelected = characterIds
        .map(id => ({ id, index: currentList.indexOf(id) }))
        .filter(item => item.index !== -1)
        .sort((a, b) => a.index - b.index);

      if (sortedSelected.length < 2) return;

      const newList = [];
      for (let i = 0; i < currentList.length; i++) {
        const item = currentList[i];
        newList.push(item);
        const matchIdx = sortedSelected.findIndex(s => s.id === item);
        if (matchIdx !== -1 && matchIdx < sortedSelected.length - 1) {
          const nextItem = currentList[i + 1];
          const isAlreadyOp = nextItem && typeof nextItem === 'string' && nextItem.startsWith(`op:${operatorToolId}:`);
          if (!isAlreadyOp) {
            const opId = `op:${operatorToolId}:${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
            newList.push(opId);
          }
        }
      }
      tier.characterIds = newList;
      this.saveState();
      Alpine.store('app')?.toast?.(`Conector "${tool.symbol}" intercalado entre ${sortedSelected.length} operativos en rango ${tier.label}.`, 'success');
      this.refreshIcons();
    },

    hasTierOperators(tierId) {
      const tier = this.tiers.find(t => t.id === tierId);
      if (!tier || !Array.isArray(tier.characterIds)) return false;
      return tier.characterIds.some(id => this.isOperatorItem(id));
    },

    hasTierModifiers(tierId) {
      const tier = this.tiers.find(t => t.id === tierId);
      if (!tier || !Array.isArray(tier.characterIds)) return false;
      return tier.characterIds.some(id => !this.isOperatorItem(id) && Array.isArray(this.characterModifiers[id]) && this.characterModifiers[id].length > 0);
    },

    clearTierOperators(tierId) {
      const tier = this.tiers.find(t => t.id === tierId);
      if (!tier || !Array.isArray(tier.characterIds)) return;
      const count = tier.characterIds.filter(id => this.isOperatorItem(id)).length;
      if (count === 0) {
        Alpine.store('app')?.toast?.(`El rango ${tier.label} no tiene operadores ni conectores.`, 'info');
        return;
      }
      this.pushUndoSnapshot('Limpiar operadores de rango');
      tier.characterIds = tier.characterIds.filter(id => !this.isOperatorItem(id));
      this.saveState();
      Alpine.store('app')?.toast?.(`Se eliminaron ${count} conectores del rango ${tier.label}. Los personajes permanecen en su posición.`, 'success');
      this.refreshIcons();
    },

    clearTierModifiers(tierId) {
      const tier = this.tiers.find(t => t.id === tierId);
      if (!tier || !Array.isArray(tier.characterIds)) return;
      let clearedCount = 0;
      tier.characterIds.forEach(id => {
        if (!this.isOperatorItem(id) && this.characterModifiers[id]) {
          delete this.characterModifiers[id];
          clearedCount++;
        }
      });
      if (clearedCount === 0) {
        Alpine.store('app')?.toast?.(`No hay insignias asignadas en el rango ${tier.label}.`, 'info');
        return;
      }
      this.pushUndoSnapshot('Limpiar insignias de rango');
      this.saveState();
      Alpine.store('app')?.toast?.(`Se retiraron las insignias de ${clearedCount} operativos en el rango ${tier.label}.`, 'success');
      this.refreshIcons();
    },

    insertOperatorInTier(tierId, toolId, targetIndex = null, silent = false) {
      this.pushUndoSnapshot('Insertar operador');
      const tier = this.tiers.find(t => t.id === tierId);
      if (!tier) return;
      const opId = `op:${toolId}:${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
      if (!Array.isArray(tier.characterIds)) tier.characterIds = [];
      if (targetIndex !== null && targetIndex >= 0 && targetIndex <= tier.characterIds.length) {
        tier.characterIds.splice(targetIndex, 0, opId);
      } else {
        tier.characterIds.push(opId);
      }
      this.saveState();
      const tool = this.getRatingTool(toolId);
      if (!silent) {
        Alpine.store('app')?.toast?.(`Operador "${tool?.symbol || ''}" insertado en la fila.`, 'info');
      }
      this.refreshIcons();
    },

    removeRowItem(tierId, index) {
      this.pushUndoSnapshot('Eliminar elemento');
      const tier = this.tiers.find(t => t.id === tierId);
      if (!tier || !Array.isArray(tier.characterIds)) return;
      const removedId = tier.characterIds[index];
      if (removedId && this.currentList?.dividerLabels?.[removedId]) {
        delete this.currentList.dividerLabels[removedId];
      }
      tier.characterIds.splice(index, 1);
      this.saveState();
    },

    getDividerLabel(rawId) {
      if (!rawId || !this.currentList) return '';
      return this.currentList.dividerLabels?.[rawId] || '';
    },

    setDividerLabel(rawId, label) {
      if (!rawId || !this.currentList) return;
      if (!this.currentList.dividerLabels) {
        this.currentList.dividerLabels = {};
      }
      const trimmed = (typeof label === 'string') ? label.trim() : '';
      if (trimmed) {
        this.currentList.dividerLabels[rawId] = trimmed;
      } else {
        delete this.currentList.dividerLabels[rawId];
      }
      this.currentList.dividerLabels = { ...this.currentList.dividerLabels };
      this.saveState(true);
      this.refreshIcons();
    },

    openDividerTitleModal(rawId) {
      if (!rawId) return;
      const current = this.getDividerLabel(rawId);
      this.dividerTitleModal = {
        isOpen: true,
        rawId,
        title: current || ''
      };
      if (typeof setTimeout !== 'undefined') {
        setTimeout(() => {
          const input = document.getElementById('divider-title-input');
          if (input) {
            input.focus();
            input.select();
          }
        }, 50);
      }
      this.refreshIcons();
    },

    saveDividerTitle() {
      if (!this.dividerTitleModal.isOpen || !this.dividerTitleModal.rawId) return;
      this.setDividerLabel(this.dividerTitleModal.rawId, this.dividerTitleModal.title);
      this.closeDividerTitleModal();
      Alpine.store('app')?.toast?.('Título del separador guardado con éxito.', 'success');
    },

    clearDividerTitle() {
      if (!this.dividerTitleModal.isOpen || !this.dividerTitleModal.rawId) return;
      this.setDividerLabel(this.dividerTitleModal.rawId, '');
      this.closeDividerTitleModal();
      Alpine.store('app')?.toast?.('Separador restablecido como línea recta continua.', 'info');
    },

    closeDividerTitleModal() {
      this.dividerTitleModal.isOpen = false;
      this.dividerTitleModal.rawId = null;
      this.dividerTitleModal.title = '';
    },

    promptRenameDivider(rawId) {
      this.openDividerTitleModal(rawId);
    },

    toggleSelectTool(toolId) {
      const tool = this.getRatingTool(toolId);
      // Si la herramienta es de tipo badge (insignia) y el usuario tiene personajes seleccionados en el tablero:
      if (tool?.type === 'badge') {
        const boardSelected = (this.selectedCharacterIds || []).filter(id => this.isCharacterInTier(id) && !this.isOperatorItem(id));
        if (boardSelected.length > 0) {
          this.toggleModifierForMultiple(boardSelected, toolId);
          return;
        }
      }

      if (this.selectedToolId === toolId) {
        this.selectedToolId = null;
        this.bracketPairStep = { ctx_combo: 'open', ctx_cond: 'open' };
        this.lastBracketTierId = null;
      } else {
        this.selectedToolId = toolId;
        this.bracketPairStep = { ctx_combo: 'open', ctx_cond: 'open' };
        this.lastBracketTierId = null;
        if (toolId === 'ctx_combo') {
          Alpine.store('app')?.toast?.(`Modo Englobar [ ]: Clic 1 coloca apertura '[', Clic 2 coloca cierre ']'.`, 'info');
        } else if (toolId === 'ctx_cond') {
          Alpine.store('app')?.toast?.(`Modo Condicional ( ): Clic 1 coloca apertura '(', Clic 2 coloca cierre ')'.`, 'info');
        } else {
          Alpine.store('app')?.toast?.(`Herramienta "${tool?.symbol}" seleccionada. Haz clic en un personaje o en una fila para colocarla.`, 'info');
        }
      }
    },

    selectSubTool(toolId) {
      this.selectedToolId = toolId;
      const tool = this.getRatingTool(toolId);
      Alpine.store('app')?.toast?.(`Herramienta "${tool?.symbol}" seleccionada. Haz clic en la fila o sobre un personaje para posicionarla.`, 'info');
    },

    clearSelectedTool() {
      this.selectedToolId = null;
      this.bracketPairStep = { ctx_combo: 'open', ctx_cond: 'open' };
      this.lastBracketTierId = null;
    },

    startDragTool(event, toolId) {
      let effectiveId = toolId;
      if (toolId === 'ctx_combo') effectiveId = 'ctx_bracket_open';
      if (toolId === 'ctx_cond') effectiveId = 'ctx_paren_open';

      this.draggingToolId = effectiveId;
      this.dragSource = { type: 'tool', toolId: effectiveId };
      this.dragOverTarget = null;
      if (typeof document !== 'undefined') {
        document.body.classList.add('is-tier-dragging');
      }
      try {
        event.dataTransfer.setData('text/plain', `tool:${effectiveId}`);
        event.dataTransfer.setData('application/tier-tool', effectiveId);
        event.dataTransfer.effectAllowed = 'copyMove';
      } catch (e) {}
    },

    handleCharacterClick(charId) {
      if (!this.selectedToolId) return false;
      if (!this.isCharacterInTier(charId)) {
        Alpine.store('app')?.toast?.('Solo puedes calificar operativos clasificados en el tablero.', 'warning');
        return true;
      }

      // Caso A: Herramientas de englobar en 2 clics ([ ] o ( ))
      if (this.selectedToolId === 'ctx_combo' || this.selectedToolId === 'ctx_cond') {
        const isBracket = this.selectedToolId === 'ctx_combo';
        const groupKey = isBracket ? 'ctx_combo' : 'ctx_cond';
        if (!this.bracketPairStep) this.bracketPairStep = { ctx_combo: 'open', ctx_cond: 'open' };
        const currentStep = this.bracketPairStep[groupKey] || 'open';

        let targetTier = null;
        let charIndex = -1;
        for (const t of this.tiers) {
          const idx = (t.characterIds || []).indexOf(charId);
          if (idx !== -1) {
            targetTier = t;
            charIndex = idx;
            break;
          }
        }

        if (targetTier && charIndex !== -1) {
          const charObj = this.resolveCharacter(charId);
          if (currentStep === 'open') {
            const toolToInsert = isBracket ? 'ctx_bracket_open' : 'ctx_paren_open';
            this.insertOperatorInTier(targetTier.id, toolToInsert, charIndex, true);
            this.bracketPairStep[groupKey] = 'close';
            this.lastBracketTierId = targetTier.id;
            const sym = isBracket ? '[' : '(';
            const closeSym = isBracket ? ']' : ')';
            Alpine.store('app')?.toast?.(`Apertura '${sym}' colocada antes de ${charObj?.name || 'operativo'}. Ahora haz clic en el personaje donde quieras cerrar con '${closeSym}'.`, 'info');
            return true;
          } else {
            // Verificar si el usuario hace clic en el mismo tier
            if (this.lastBracketTierId && this.lastBracketTierId !== targetTier.id) {
              const prevTier = this.tiers.find(t => t.id === this.lastBracketTierId);
              Alpine.store('app')?.toast?.(`Debes cerrar la agrupación dentro del mismo rango (${prevTier?.label || 'tier previo'}).`, 'warning');
              return true;
            }
            const toolToInsert = isBracket ? 'ctx_bracket_close' : 'ctx_paren_close';
            const newIndex = targetTier.characterIds.indexOf(charId);
            const insertAt = newIndex !== -1 ? newIndex + 1 : null;
            this.insertOperatorInTier(targetTier.id, toolToInsert, insertAt, true);
            this.bracketPairStep[groupKey] = 'open';
            this.lastBracketTierId = null;
            const closeSym = isBracket ? ']' : ')';
            Alpine.store('app')?.toast?.(`Cierre '${closeSym}' colocado tras ${charObj?.name || 'operativo'}. ¡Elementos englobados!`, 'success');
            return true;
          }
        }
      }

      // Caso B: Sub-herramientas directas de apertura o cierre
      if (this.selectedToolId === 'ctx_bracket_open' || this.selectedToolId === 'ctx_paren_open') {
        for (const t of this.tiers) {
          const idx = (t.characterIds || []).indexOf(charId);
          if (idx !== -1) {
            this.insertOperatorInTier(t.id, this.selectedToolId, idx);
            return true;
          }
        }
      }
      if (this.selectedToolId === 'ctx_bracket_close' || this.selectedToolId === 'ctx_paren_close') {
        for (const t of this.tiers) {
          const idx = (t.characterIds || []).indexOf(charId);
          if (idx !== -1) {
            this.insertOperatorInTier(t.id, this.selectedToolId, idx + 1);
            return true;
          }
        }
      }

      // Caso C: Si es un operador de fila (como op_hr, op_gt, op_dash, etc.), insertarlo junto al personaje en el tier
      const tool = this.getRatingTool(this.selectedToolId);
      if (tool && tool.type === 'row_operator') {
        for (const t of this.tiers) {
          const idx = (t.characterIds || []).indexOf(charId);
          if (idx !== -1) {
            this.insertOperatorInTier(t.id, this.selectedToolId, idx + 1);
            return true;
          }
        }
      }

      // Caso D: Modificador estándar (insignia en personaje)
      this.toggleCharacterModifier(charId, this.selectedToolId);
      return true;
    },

    handleTierClick(tierId) {
      // 1. Si hay personajes seleccionados, un clic en el fondo vacío del tier los deselecciona limpiamente sin alterar el orden
      if (this.selectedCharacterIds && this.selectedCharacterIds.length > 0) {
        this.clearSelectedCharacters();
        return true;
      }

      if (!this.selectedToolId) return false;

      // Si es una herramienta de englobar ([ ] o ( ))
      if (this.selectedToolId === 'ctx_combo' || this.selectedToolId === 'ctx_cond') {
        const isBracket = this.selectedToolId === 'ctx_combo';
        const groupKey = isBracket ? 'ctx_combo' : 'ctx_cond';
        if (!this.bracketPairStep) this.bracketPairStep = { ctx_combo: 'open', ctx_cond: 'open' };
        const currentStep = this.bracketPairStep[groupKey] || 'open';

        if (currentStep === 'open') {
          const toolToInsert = isBracket ? 'ctx_bracket_open' : 'ctx_paren_open';
          this.insertOperatorInTier(tierId, toolToInsert, null, true);
          this.bracketPairStep[groupKey] = 'close';
          this.lastBracketTierId = tierId;
          const sym = isBracket ? '[' : '(';
          const closeSym = isBracket ? ']' : ')';
          Alpine.store('app')?.toast?.(`Apertura '${sym}' colocada en la fila. Ahora haz clic donde quieras cerrar con '${closeSym}'.`, 'info');
          return true;
        } else {
          if (this.lastBracketTierId && this.lastBracketTierId !== tierId) {
            const prevTier = this.tiers.find(t => t.id === this.lastBracketTierId);
            Alpine.store('app')?.toast?.(`Debes cerrar la agrupación dentro del mismo rango (${prevTier?.label || 'tier previo'}).`, 'warning');
            return true;
          }
          const toolToInsert = isBracket ? 'ctx_bracket_close' : 'ctx_paren_close';
          this.insertOperatorInTier(tierId, toolToInsert, null, true);
          this.bracketPairStep[groupKey] = 'open';
          this.lastBracketTierId = null;
          const closeSym = isBracket ? ']' : ')';
          Alpine.store('app')?.toast?.(`Cierre '${closeSym}' colocado.`, 'success');
          return true;
        }
      }

      this.insertOperatorInTier(tierId, this.selectedToolId);
      return true;
    },

    // ── Gestión de Personajes sin Ficha (Invitados Temporales) ─────
    openAddGuestModal() {
      this.editingGuestId = null;
      this.guestForm = {
        name: '',
        role: '',
        pfpUrl: '',
        pfpPreview: '',
        avatarTransform: ''
      };
      this.showAddGuestModal = true;
      this.refreshIcons();
    },

    editGuestCharacter(guestId) {
      const guest = this.getGuestById(guestId);
      if (!guest) return;
      this.editingGuestId = guestId;
      this.guestForm = {
        name: guest.name || '',
        role: guest.role || guest.basics?.role || '',
        pfpUrl: guest.basics?.avatarDataUrl || '',
        pfpPreview: guest.basics?.avatarDataUrl || '',
        avatarTransform: guest.basics?.avatarTransform || ''
      };
      this.showAddGuestModal = true;
      this.refreshIcons();
    },

    closeAddGuestModal() {
      this.showAddGuestModal = false;
      this.editingGuestId = null;
    },

    clearGuestImage() {
      this.guestForm.pfpPreview = '';
      this.guestForm.pfpUrl = '';
      this.guestForm.avatarTransform = '';
      this.refreshIcons();
    },

    extractCharacterNameFromFileName(filename) {
      if (!filename || typeof filename !== 'string') return '';
      try {
        let clean = filename.trim().split('?')[0].split('#')[0];
        try {
          clean = decodeURIComponent(clean);
        } catch (_) {}
        clean = clean.split(/[/\\]/).pop() || '';
        clean = clean.replace(/\.(png|jpe?g|webp|gif|avif|bmp|svg|tiff?|jfif|ico)$/i, '');
        clean = clean.replace(/_+/g, ' ');
        clean = clean.replace(/\s+/g, ' ').trim();
        return clean;
      } catch (e) {
        return '';
      }
    },

    async handleGuestImageUpload(event) {
      const file = event.target.files?.[0];
      if (!file) return;
      if (!file.type.startsWith('image/') && !file.name.toLowerCase().endsWith('.gif')) {
        Alpine.store('app')?.toast?.('Selecciona un archivo de imagen o GIF válido.', 'warning');
        return;
      }

      // Auto-completar nombre si el campo está vacío
      if (!this.guestForm.name || !this.guestForm.name.trim()) {
        const autoName = this.extractCharacterNameFromFileName(file.name);
        if (autoName) {
          this.guestForm.name = autoName;
        }
      }

      try {
        window.Alpine?.store('app')?.openCropper(file, 'tierlist_guest');
      } catch (err) {
        console.error(err);
        Alpine.store('app')?.toast?.('Error al abrir la herramienta de encuadre.', 'error');
      }
      event.target.value = '';
    },

    async handleGuestImageFileDrop(event) {
      const file = event.dataTransfer?.files?.[0];
      if (!file) return;
      if (!file.type.startsWith('image/') && !file.name.toLowerCase().endsWith('.gif')) {
        Alpine.store('app')?.toast?.('Arrastra un archivo de imagen o GIF válido.', 'warning');
        return;
      }

      // Auto-completar nombre si el campo está vacío
      if (!this.guestForm.name || !this.guestForm.name.trim()) {
        const autoName = this.extractCharacterNameFromFileName(file.name);
        if (autoName) {
          this.guestForm.name = autoName;
        }
      }

      try {
        window.Alpine?.store('app')?.openCropper(file, 'tierlist_guest');
      } catch (err) {
        console.error(err);
        Alpine.store('app')?.toast?.('Error al abrir la herramienta de encuadre.', 'error');
      }
    },

    async openCropperForCurrentGuestImage() {
      const raw = this.guestForm.pfpPreview || this.guestForm.pfpUrl;
      if (!raw) return;
      try {
        let file;
        if (raw.startsWith('data:')) {
          const res = await fetch(raw);
          const blob = await res.blob();
          const isGif = blob.type === 'image/gif' || raw.startsWith('data:image/gif');
          file = new File([blob], isGif ? 'guest_avatar.gif' : 'guest_avatar.png', {
            type: blob.type || (isGif ? 'image/gif' : 'image/png')
          });
        } else {
          Alpine.store('app')?.toast?.('Cargando imagen para encuadrar...', 'info');
          file = await fetchImageAsFileFromUrl(raw);
        }
        window.Alpine?.store('app')?.openCropper(file, 'tierlist_guest');
      } catch (err) {
        console.error('Error al abrir encuadre:', err);
        Alpine.store('app')?.toast?.('No se pudo abrir la herramienta de recorte.', 'error');
      }
    },

    async openCropperForGuestUrl() {
      const url = (this.guestForm.pfpUrl || '').trim();
      if (!url) return;

      // Auto-completar nombre si el campo está vacío y la URL tiene un nombre deducible
      if (!this.guestForm.name || !this.guestForm.name.trim()) {
        const autoName = this.extractCharacterNameFromFileName(url);
        if (autoName && autoName.length >= 2 && !autoName.startsWith('data:')) {
          this.guestForm.name = autoName;
        }
      }

      await window.Alpine?.store('app')?.openMediaUrl(url, 'tierlist_guest');
    },

    async processCroppedGuest(file) {
      try {
        const { dataUrl, compressedKB } = await compressImageWithStats(file);
        this.guestForm.pfpPreview = dataUrl;
        this.guestForm.pfpUrl = dataUrl;
        this.guestForm.avatarTransform = '';
        Alpine.store('app')?.toast?.(`Operativo encuadrado y optimizado (${compressedKB}KB WebP).`, 'success');
        this.refreshIcons();
      } catch (err) {
        console.error(err);
        Alpine.store('app')?.toast?.('Error al procesar el recorte de imagen.', 'error');
      }
    },

    async processCroppedGuestGif(dataUrl, cssTransform) {
      this.guestForm.pfpPreview = dataUrl;
      this.guestForm.pfpUrl = dataUrl;
      this.guestForm.avatarTransform = cssTransform;
      Alpine.store('app')?.toast?.('GIF animado encuadrado con rotación y escala personalizada.', 'success');
      this.refreshIcons();
    },

    createGuestCharacter() {
      try {
        const name = (this.guestForm.name || '').trim();
        if (!name) {
          Alpine.store('app')?.toast?.('Por favor ingresa un nombre para el personaje.', 'warning');
          return;
        }
        const role = (this.guestForm.role || '').trim();
        const pfp = this.guestForm.pfpPreview || (this.guestForm.pfpUrl || '').trim();
        const transform = this.guestForm.avatarTransform || '';

        if (this.editingGuestId) {
          const guest = this.getGuestById(this.editingGuestId);
          if (guest) {
            guest.name = name;
            guest.role = role;
            if (!guest.basics) guest.basics = {};
            guest.basics.role = role;
            guest.basics.avatarDataUrl = pfp;
            guest.basics.avatarTransform = transform;
            this.guestCharacters = [...this.guestCharacters];
            if (this.currentList && Array.isArray(this.currentList.templateCharacters)) {
              this.currentList.templateCharacters = [...this.currentList.templateCharacters];
            }
            this.saveState(true);
            this.showAddGuestModal = false;
            this.editingGuestId = null;
            Alpine.store('app')?.toast?.(`Operativo "${name}" actualizado exitosamente.`, 'success');
            this.refreshIcons();
            return;
          }
          this.editingGuestId = null;
        }

        const guest = {
          id: `guest_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          name,
          role,
          isGuest: true,
          isTemplate: false,
          basics: {
            fullName: name,
            role,
            avatarDataUrl: pfp,
            avatarTransform: transform,
            avatarShape: 'rounded',
            useIconForPfp: false
          }
        };

        this.guestCharacters = [...(this.guestCharacters || []), guest];
        this.saveState(true);
        this.showAddGuestModal = false;
        this.editingGuestId = null;
        this.poolTab = 'all';
        this.searchQuery = '';
        Alpine.store('app')?.toast?.(`Operativo temporal "${name}" añadido a tus invitados.`, 'success');
        this.refreshIcons();
      } catch (err) {
        console.error('[tierlist] Error al crear operativo sin ficha:', err);
        Alpine.store('app')?.toast?.('Error al crear el operativo. Revisa la consola.', 'error');
      }
    },

    /**
     * Promover un operativo invitado o de plantilla a Ficha Oficial en la base de datos principal.
     * Reemplaza de forma transparente su ID en todos los tiers conservando su posición y modificadores.
     */
    async promoteGuestToOfficial(guestId) {
      if (!guestId) return null;
      try {
        const guest = this.getGuestById(guestId) || this.getCharacter(guestId);
        if (!guest) {
          Alpine.store('app')?.toast?.('No se encontró el operativo invitado a convertir.', 'warning');
          return null;
        }

        const charactersStore = Alpine.store('characters');
        if (!charactersStore) {
          Alpine.store('app')?.toast?.('Error: Almacén de personajes no disponible.', 'error');
          return null;
        }

        const guestName = (guest.name || 'Nuevo Personaje').trim();
        const avatarUrl = guest.basics?.avatarDataUrl || guest.basics?.iconDataUrl || guest.avatarUrl || guest.pfpUrl || '';
        const avatarTransform = guest.basics?.avatarTransform || guest.avatarTransform || '';
        const guestRole = (guest.role || guest.basics?.role || '').trim();

        // 1. Crear la nueva ficha oficial usando createEmptyCharacter
        const newCharId = crypto.randomUUID();
        const newChar = createEmptyCharacter({
          name: guestName,
          basics: {
            fullName: guestName,
            role: guestRole,
            avatarDataUrl: avatarUrl,
            avatarTransform: avatarTransform
          }
        });
        newChar.id = newCharId;
        newChar.name = guestName;
        if (!newChar.basics) newChar.basics = {};
        newChar.basics.fullName = guestName;
        newChar.basics.role = guestRole;
        newChar.basics.avatarDataUrl = avatarUrl;
        newChar.basics.avatarTransform = avatarTransform;
        newChar.updatedAt = Date.now();
        newChar.createdAt = Date.now();

        // 2. Persistir en el almacén de fichas oficiales
        charactersStore.list.push(newChar);
        if (typeof charactersStore._persist === 'function') {
          await charactersStore._persist(newChar);
        } else if (typeof charactersStore.saveToStorage === 'function') {
          await charactersStore.saveToStorage();
        }

        // 3. Sustituir guestId por newCharId en todos los tiers del tablero (manteniendo posición exacta)
        (this.tiers || []).forEach(tier => {
          if (Array.isArray(tier.characterIds)) {
            tier.characterIds = tier.characterIds.map(id => id === guestId ? newCharId : id);
          }
        });

        // 4. Sustituir en listas archivadas si existen
        (this.lists || []).forEach(l => {
          (l.tiers || []).forEach(tier => {
            if (Array.isArray(tier.characterIds)) {
              tier.characterIds = tier.characterIds.map(id => id === guestId ? newCharId : id);
            }
          });
          if (Array.isArray(l.poolCharacterIds)) {
            l.poolCharacterIds = l.poolCharacterIds.map(id => id === guestId ? newCharId : id);
          }
        });

        // 5. Sustituir en modificadores/insignias activas
        if (this.characterModifiers && this.characterModifiers[guestId]) {
          this.characterModifiers[newCharId] = [...this.characterModifiers[guestId]];
          delete this.characterModifiers[guestId];
        }

        // 6. Sustituir en multiselección activa
        if (Array.isArray(this.selectedCharacterIds)) {
          this.selectedCharacterIds = this.selectedCharacterIds.map(id => id === guestId ? newCharId : id);
        }

        // 7. Sustituir en poolCharacterIds si estaba en banca
        if (Array.isArray(this.poolCharacterIds)) {
          this.poolCharacterIds = this.poolCharacterIds.map(id => id === guestId ? newCharId : id);
        }

        // 8. Remover de invitados manuales y de plantillas
        this.guestCharacters = (this.guestCharacters || []).filter(c => c.id !== guestId);
        if (this.currentList && Array.isArray(this.currentList.templateCharacters)) {
          this.currentList.templateCharacters = this.currentList.templateCharacters.filter(c => c.id !== guestId);
        }

        // 9. Guardar estado reactivo de la tier list
        await this.saveState(true);

        if (this.showAddGuestModal) {
          this.closeAddGuestModal();
        }
        if (this.boardQuickMenuCharId === guestId) {
          this.boardQuickMenuCharId = null;
        }

        Alpine.store('app')?.toast?.(`¡"${guestName}" convertido en Ficha Oficial con éxito! Ahora vive en tu base de datos principal.`, 'success');
        this.refreshIcons();
        return newChar;
      } catch (err) {
        console.error('[tierlist] Error al promover invitado a oficial:', err);
        Alpine.store('app')?.toast?.('Error al convertir el invitado en ficha oficial.', 'error');
        return null;
      }
    },

    /**
     * Exporta todos los personajes invitados manuales actuales en un archivo JSON (.guestpack.json).
     */
    exportGuestsPack() {
      try {
        const guests = Array.isArray(this.guestCharacters) ? this.guestCharacters : [];
        if (guests.length === 0) {
          Alpine.store('app')?.toast?.('No tienes personajes invitados manuales en este momento para exportar.', 'warning');
          return;
        }

        const packData = {
          app: "Where's my Ficha?",
          schema: 'superficha_guest_pack',
          version: 1,
          exportedAt: new Date().toISOString(),
          listTitle: this.currentList?.title || 'Tier List',
          guestCount: guests.length,
          guests: guests.map(g => ({
            id: g.id,
            name: g.name,
            role: g.role || g.basics?.role || '',
            basics: {
              fullName: g.name,
              role: g.role || g.basics?.role || '',
              avatarDataUrl: g.basics?.avatarDataUrl || '',
              avatarTransform: g.basics?.avatarTransform || '',
              avatarShape: g.basics?.avatarShape || 'rounded'
            }
          }))
        };

        const jsonString = JSON.stringify(packData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const safeTitle = (this.currentList?.title || 'tierlist')
          .toLowerCase()
          .replace(/[^a-z0-9_-]/g, '_')
          .replace(/_+/g, '_');
        const fileName = `${safeTitle}-pack-invitados-${new Date().toISOString().slice(0, 10)}.guestpack.json`;

        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        Alpine.store('app')?.toast?.(`¡Pack de ${guests.length} invitados exportado correctamente!`, 'success');
      } catch (err) {
        console.error('[tierlist] Error al exportar pack de invitados:', err);
        Alpine.store('app')?.toast?.('Error al exportar el pack de invitados.', 'error');
      }
    },

    /**
     * Importa un paquete de invitados desde un archivo JSON (.guestpack.json).
     */
    async importGuestsPack(file) {
      if (!file) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text);

        let incomingGuests = [];
        if (Array.isArray(data)) {
          incomingGuests = data;
        } else if (Array.isArray(data.guests)) {
          incomingGuests = data.guests;
        } else if (Array.isArray(data.guestCharacters)) {
          incomingGuests = data.guestCharacters;
        } else {
          throw new Error('Formato de archivo no reconocido como paquete de invitados.');
        }

        if (incomingGuests.length === 0) {
          Alpine.store('app')?.toast?.('El paquete no contiene ningún operativo invitado.', 'warning');
          return;
        }

        const baseTimestamp = Date.now();
        const sanitizedGuests = incomingGuests.map((g, idx) => {
          const name = (g.name || g.basics?.fullName || `Invitado ${idx + 1}`).trim();
          const role = (g.role || g.basics?.role || '').trim();
          const avatar = g.basics?.avatarDataUrl || g.avatarUrl || g.pfpUrl || '';
          const transform = g.basics?.avatarTransform || g.avatarTransform || '';
          return {
            id: `guest_${baseTimestamp}_${Math.random().toString(36).substr(2, 6)}_${idx}`,
            name,
            role,
            isGuest: true,
            isTemplate: false,
            basics: {
              fullName: name,
              role,
              avatarDataUrl: avatar,
              avatarTransform: transform,
              avatarShape: g.basics?.avatarShape || 'rounded',
              useIconForPfp: false
            }
          };
        });

        this.guestCharacters = [...(this.guestCharacters || []), ...sanitizedGuests];
        await this.saveState(true);
        this.poolTab = 'guests';
        Alpine.store('app')?.toast?.(`¡Se importaron ${sanitizedGuests.length} invitados del paquete exitosamente!`, 'success');
        this.refreshIcons();
      } catch (err) {
        console.error('[tierlist] Error al importar paquete de invitados:', err);
        Alpine.store('app')?.toast?.(`Error al importar: ${err.message || 'archivo inválido'}`, 'error');
      }
    },

    triggerGuestPackImport() {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json,.guestpack.json';
      input.onchange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
          this.importGuestsPack(file);
        }
      };
      input.click();
    },

    removeGuestCharacter(guestId) {
      if (!guestId) return;
      this.tiers.forEach(t => {
        t.characterIds = (t.characterIds || []).filter(id => id !== guestId);
      });
      this.guestCharacters = (this.guestCharacters || []).filter(c => c.id !== guestId);
      this.poolCharacterIds = (this.poolCharacterIds || []).filter(id => id !== guestId);
      if (this.currentList && Array.isArray(this.currentList.poolCharacterIds)) {
        this.currentList.poolCharacterIds = this.currentList.poolCharacterIds.filter(id => id !== guestId);
      }
      if (this.currentList && Array.isArray(this.currentList.templateCharacters)) {
        this.currentList.templateCharacters = this.currentList.templateCharacters.filter(c => c.id !== guestId);
      }
      this.lists.forEach(l => {
        if (Array.isArray(l.templateCharacters)) {
          l.templateCharacters = l.templateCharacters.filter(c => c.id !== guestId);
        }
      });
      this.saveState();
      Alpine.store('app')?.toast?.('Operativo eliminado.', 'info');
    },

    // ── Importador de TierMaker (tiermaker.com) ──────────────────────
    openTierMakerModal() {
      this.tierMakerUrlInput = '';
      this.tierMakerIsAnalyzing = false;
      this.tierMakerPreview = null;
      this.tierMakerError = null;
      this.tierMakerOptions = {
        useCustomTiers: true,
        importTemplateGuests: true,
        includeRegistered: true,
        includeGuests: false
      };
      this.showTierMakerModal = true;
      this.refreshIcons();
      setTimeout(() => this.refreshIcons(), 60);
    },

    closeTierMakerModal() {
      this.showTierMakerModal = false;
      this.tierMakerIsAnalyzing = false;
      this.tierMakerPreview = null;
      this.tierMakerError = null;
    },

    getEffectivePreviewTiers() {
      if (!this.tierMakerPreview) return [];
      const p = this.tierMakerPreview;
      const shouldUseCustom = this.tierMakerOptions?.useCustomTiers !== false && p.hasCustomTiers && Array.isArray(p.customTiers) && p.customTiers.length >= 2;
      return shouldUseCustom ? p.customTiers : (p.defaultTiers || DEFAULT_TIERS);
    },

    async pasteFromClipboardToTierMaker() {
      try {
        if (navigator.clipboard?.readText) {
          const text = await navigator.clipboard.readText();
          if (text && text.trim()) {
            this.tierMakerUrlInput = text.trim();
            if (this.tierMakerUrlInput.includes('tiermaker.com') || this.tierMakerUrlInput.includes('tierbuddy.com') || this.tierMakerUrlInput.includes('tiermakerpro.com')) {
              this.analyzeTierMakerUrl();
            }
          }
        } else {
          Alpine.store('app')?.toast?.('Tu navegador no permite acceso directo al portapapeles. Pega el enlace manualmente.', 'warning');
        }
      } catch (err) {
        Alpine.store('app')?.toast?.('No se pudo leer el portapapeles. Pega el enlace con Ctrl + V.', 'info');
      }
    },

    async analyzeTierMakerUrl() {
      const url = (this.tierMakerUrlInput || '').trim();
      if (!url) {
        this.tierMakerError = 'Por favor ingresa o pega un enlace de TierMaker, TierBuddy o TierMaker Pro.';
        return;
      }
      this.tierMakerIsAnalyzing = true;
      this.tierMakerError = null;
      this.tierMakerPreview = null;

      try {
        const result = await fetchAndParseTierMakerTemplate(url);
        if (result && result.success) {
          this.tierMakerPreview = result;
          const platform = result.source === 'tierbuddy' 
            ? 'TierBuddy' 
            : (result.source === 'tiermakerpro' ? 'TierMaker Pro' : 'TierMaker');
          const tierNote = result.hasCustomTiers ? ` con ${result.customTiers.length} rangos personalizados` : '';
          Alpine.store('app')?.toast?.(`¡Plantilla de ${platform} analizada${tierNote}! Se detectaron ${result.totalCount} operativos.`, 'success');
        } else {
          this.tierMakerError = 'No se pudieron extraer datos de la plantilla.';
        }
      } catch (err) {
        console.error('[tierlist] Error al analizar plantilla web:', err);
        this.tierMakerError = err.message || 'Error al conectar con la plantilla. Verifica el enlace.';
      } finally {
        this.tierMakerIsAnalyzing = false;
        this.refreshIcons();
      }
    },

    confirmImportTierMaker() {
      if (!this.tierMakerPreview || !Array.isArray(this.tierMakerPreview.items)) return;

      const preview = this.tierMakerPreview;
      const isTierBuddy = preview.source === 'tierbuddy' || (this.tierMakerUrlInput || '').includes('tierbuddy.com');
      const isTierMakerPro = preview.source === 'tiermakerpro' || (this.tierMakerUrlInput || '').includes('tiermakerpro.com');
      const prefix = isTierBuddy ? 'tb' : (isTierMakerPro ? 'tmp' : 'tm');
      const listId = `list_${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      const title = (preview.title || 'Tier List').trim() || 'Tier List Importada';
      const shouldImportGuests = this.tierMakerOptions?.importTemplateGuests !== false;
      const shouldIncludeRegistered = this.tierMakerOptions?.includeRegistered !== false;
      const shouldIncludeGuests = this.tierMakerOptions?.includeGuests === true;
      const shouldUseCustomTiers = this.tierMakerOptions?.useCustomTiers !== false && preview.hasCustomTiers && Array.isArray(preview.customTiers) && preview.customTiers.length >= 2;
      const sourceTiers = shouldUseCustomTiers ? preview.customTiers : (preview.defaultTiers || DEFAULT_TIERS);

      // 1. Crear rangos a partir de la opción del usuario (originales de la plantilla o canónicos estándar)
      const tiers = (sourceTiers && sourceTiers.length > 0)
        ? sourceTiers.map((t, idx) => ({
            id: `tier_${listId}_${idx}`,
            label: (t.label || `RANGO ${idx + 1}`).trim(),
            color: t.color || '#3b82f6',
            colorType: t.colorType || 'solid',
            solidColor: t.solidColor || t.color || '#3b82f6',
            color1: t.color1 || t.color || '#3b82f6',
            color2: t.color2 || '#00c9a7',
            gradientDir: 'to bottom',
            characterIds: []
          }))
        : JSON.parse(JSON.stringify(DEFAULT_TIERS));

      // 2. Crear nueva Tier List con sus banderas de alcance
      const newList = {
        id: listId,
        title,
        icon: 'trophy',
        customIconUrl: null,
        iconFit: 'contain',
        iconZoom: 100,
        iconX: 50,
        iconY: 50,
        tiers,
        characterModifiers: {},
        dividerLabels: {},
        includeRegistered: shouldIncludeRegistered,
        includeGuests: shouldIncludeGuests,
        templateCharacters: [],
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      // 3. Si se marcó importar personajes de la plantilla, agregarlos aislados en la lista
      let countAdded = 0;
      if (shouldImportGuests) {
        const newGuests = preview.items.map((item, idx) => ({
          id: item.id || `guest_${prefix}_${Date.now()}_${idx}_${Math.random().toString(36).substr(2, 5)}`,
          name: item.name || `Operativo #${idx + 1}`,
          listId: listId,
          isGuest: true,
          isTemplate: true,
          basics: {
            avatarDataUrl: item.avatarDataUrl,
            avatarTransform: '',
            avatarShape: 'rounded',
            useIconForPfp: false
          }
        }));
        newList.templateCharacters = newGuests;
        countAdded = newGuests.length;
      } else {
        newList.templateCharacters = [];
      }

      // 4. Agregar a listas y cambiar a la nueva lista
      this.lists.push(newList);
      this.activeListId = listId;
      this.poolTab = 'all';
      this.searchQuery = '';
      this.saveState(true);
      this.closeTierMakerModal();

      if (countAdded > 0) {
        Alpine.store('app')?.toast?.(`¡Tier List "${title}" creada con éxito! ${countAdded} operativos listos en el banco.`, 'success');
      } else {
        Alpine.store('app')?.toast?.(`¡Tier List "${title}" creada con sus rangos vacíos (sin personajes importados).`, 'success');
      }
      this.refreshIcons();
    },

    addTier(label = 'NUEVO', color = '#3b82f6') {
      const newId = `tier_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
      this.tiers.push({
        id: newId,
        label: label.toUpperCase(),
        color,
        colorType: color.includes('gradient') ? 'gradient' : 'solid',
        color1: color,
        color2: '#00c9a7',
        gradientDir: 'to bottom',
        collapsed: false,
        characterIds: []
      });
      this.saveState();
      Alpine.store('app')?.toast?.(`Nivel "${label}" añadido a la Tier List.`, 'success');
      this.refreshIcons();
    },

    // ── Colapso y Plegado de Rangos (Achicar / Expandir) ─────────────
    isTierCollapsed(tierId) {
      const tier = (this.tiers || []).find(t => t.id === tierId);
      return Boolean(tier?.collapsed);
    },

    toggleTierCollapse(tierId) {
      const tier = (this.tiers || []).find(t => t.id === tierId);
      if (!tier) return;
      tier.collapsed = !tier.collapsed;
      this.saveState();
      this.refreshIcons();
    },

    setTierCollapse(tierId, collapsed) {
      const tier = (this.tiers || []).find(t => t.id === tierId);
      if (!tier) return;
      tier.collapsed = Boolean(collapsed);
      this.saveState();
      this.refreshIcons();
    },

    get areAllTiersCollapsed() {
      if (!this.tiers || this.tiers.length === 0) return false;
      return this.tiers.every(t => Boolean(t.collapsed));
    },

    collapseAllTiers(collapsed = true) {
      if (!this.tiers) return;
      this.tiers.forEach(t => {
        t.collapsed = Boolean(collapsed);
      });
      this.saveState();
      this.refreshIcons();
    },

    toggleCollapseAllTiers() {
      const target = !this.areAllTiersCollapsed;
      this.collapseAllTiers(target);
    },

    getCharacterAvatar(char) {
      if (!char) return null;
      if (char.basics?.useIconForPfp) {
        return char.basics?.iconDataUrl || char.basics?.avatarDataUrl || null;
      }
      return char.basics?.avatarDataUrl || char.basics?.iconDataUrl || null;
    },

    removeTier(tierId) {
      const tier = this.tiers.find(t => t.id === tierId);
      const count = tier?.characterIds?.length || 0;
      this.tiers = this.tiers.filter(t => t.id !== tierId);
      this.saveState();
      if (count > 0) {
        Alpine.store('app')?.toast?.(`Nivel eliminado. ${count} personaje(s) regresaron al banco disponible.`, 'info');
      }
      this.refreshIcons();
    },

    moveTier(tierId, direction) {
      this.pushUndoSnapshot('Mover rango');
      const idx = this.tiers.findIndex(t => t.id === tierId);
      if (idx === -1) return;
      const targetIdx = idx + direction;
      if (targetIdx < 0 || targetIdx >= this.tiers.length) return;
      const [item] = this.tiers.splice(idx, 1);
      this.tiers.splice(targetIdx, 0, item);
      this.saveState();
      this.refreshIcons();
    },

    openTierEditor(tierId) {
      this.colorPickerTierId = tierId;
      this.refreshIcons();
    },

    closeTierEditor() {
      this.colorPickerTierId = null;
    },

    get activeEditingTier() {
      return this.tiers.find(t => t.id === this.colorPickerTierId) || null;
    },

    updateTierLabel(tierId, newLabel) {
      const tier = this.tiers.find(t => t.id === tierId);
      if (tier && typeof newLabel === 'string') {
        tier.label = newLabel.toUpperCase();
        this.saveState();
      }
    },

    setTierColor(tierId, color) {
      const tier = this.tiers.find(t => t.id === tierId);
      if (tier) {
        tier.colorType = 'solid';
        tier.solidColor = color;
        tier.color = color;
        this.saveState();
      }
    },

    setTierGradient(tierId, fromColor, toColor, dir = 'to bottom') {
      const tier = this.tiers.find(t => t.id === tierId);
      if (tier) {
        tier.colorType = 'gradient';
        tier.color1 = fromColor;
        tier.color2 = toColor;
        tier.gradientDir = dir;
        tier.color = `linear-gradient(${dir}, ${fromColor}, ${toColor})`;
        this.saveState();
      }
    },

    setTierColorType(tierId, type) {
      const tier = this.tiers.find(t => t.id === tierId);
      if (!tier) return;
      tier.colorType = type;
      if (type === 'solid') {
        const solid = tier.solidColor || (tier.color && !tier.color.includes('gradient') ? tier.color : (tier.color1 && !tier.color1.includes('gradient') ? tier.color1 : '#ef4444'));
        tier.solidColor = solid;
        tier.color = solid;
      } else {
        const c1 = tier.color1 || tier.solidColor || (tier.color && !tier.color.includes('gradient') ? tier.color : '#0b4f6c');
        const c2 = tier.color2 || '#00c9a7';
        const dir = tier.gradientDir || 'to bottom';
        tier.color1 = c1;
        tier.color2 = c2;
        tier.gradientDir = dir;
        tier.color = `linear-gradient(${dir}, ${c1}, ${c2})`;
      }
      this.saveState();
    },

    updateTierGradientColor(tierId, index, newColor) {
      const tier = this.tiers.find(t => t.id === tierId);
      if (!tier) return;
      if (index === 1) tier.color1 = newColor;
      if (index === 2) tier.color2 = newColor;
      tier.colorType = 'gradient';
      const c1 = tier.color1 || '#0b4f6c';
      const c2 = tier.color2 || '#00c9a7';
      const dir = tier.gradientDir || 'to bottom';
      tier.color = `linear-gradient(${dir}, ${c1}, ${c2})`;
      this.saveState();
    },

    setTierGradientDir(tierId, dir) {
      const tier = this.tiers.find(t => t.id === tierId);
      if (!tier) return;
      tier.gradientDir = dir;
      tier.colorType = 'gradient';
      const c1 = tier.color1 || '#0b4f6c';
      const c2 = tier.color2 || '#00c9a7';
      tier.color = `linear-gradient(${dir}, ${c1}, ${c2})`;
      this.saveState();
    },

    clearTier(tierId) {
      this.pushUndoSnapshot('Vaciar rango');
      const tier = this.tiers.find(t => t.id === tierId);
      if (tier) {
        const count = tier.characterIds.length;
        (tier.characterIds || []).forEach(cid => {
          if (!this.isOperatorItem(cid) && this.characterModifiers && this.characterModifiers[cid]) {
            delete this.characterModifiers[cid];
          }
        });
        tier.characterIds = [];
        this.saveState();
        if (count > 0) {
          Alpine.store('app')?.toast?.(`Fila despejada (${count} devueltos al banco).`, 'info');
        }
      }
    },

    resetAllToPool() {
      this.pushUndoSnapshot('Devolver todos al banco');
      let count = 0;
      this.tiers.forEach(t => {
        count += t.characterIds.length;
        t.characterIds = [];
      });
      if (this.currentList) {
        this.currentList.characterModifiers = {};
      }
      this.saveState();
      Alpine.store('app')?.toast?.(`Tier List reiniciada: ${count} personajes devueltos al banco.`, 'info');
    },

    resetToDefaults() {
      this.tiers = JSON.parse(JSON.stringify(DEFAULT_TIERS));
      this.title = 'Tier List de Operativos';
      this.rowOpacity = 40;
      this.itemGap = 10;
      this.saveState();
      Alpine.store('app')?.toast?.('Rangos restablecidos a los valores por defecto (S, A, B, C, D, E).', 'success');
    },

    setRowOpacity(val) {
      this.rowOpacity = Math.max(0, Math.min(100, Number(val)));
      this.saveState();
    },

    // ── Asignación y Reordenación de Personajes ──────────────────────
    toggleBoardQuickMenu(charId) {
      if (this.boardQuickMenuCharId === charId) {
        this.boardQuickMenuCharId = null;
      } else {
        this.boardQuickMenuCharId = charId;
      }
    },

    closeBoardQuickMenu() {
      this.boardQuickMenuCharId = null;
    },

    isBoardQuickMenuOpen(charId) {
      return this.boardQuickMenuCharId === charId;
    },

    isQuickMenuInTier(tierId) {
      if (!this.boardQuickMenuCharId) return false;
      const tier = (this.tiers || []).find(t => t.id === tierId);
      return Boolean(tier && (tier.characterIds || []).includes(this.boardQuickMenuCharId));
    },

    assignCharacter(charId, targetTierId, targetIndex = null) {
      this.boardQuickMenuCharId = null;
      this.pushUndoSnapshot('Asignar personaje');
      if (!charId || !targetTierId) return;

      // Remover de todos los tiers existentes
      this.tiers.forEach(t => {
        t.characterIds = (t.characterIds || []).filter(id => id !== charId);
      });

      // Insertar en el tier destino
      const targetTier = this.tiers.find(t => t.id === targetTierId);
      if (targetTier) {
        if (!Array.isArray(targetTier.characterIds)) targetTier.characterIds = [];
        if (targetIndex !== null && targetIndex >= 0 && targetIndex <= targetTier.characterIds.length) {
          targetTier.characterIds.splice(targetIndex, 0, charId);
        } else {
          targetTier.characterIds.push(charId);
        }
        this.saveState();
      }

      // Si el personaje asignado provenía del banco, avanzar la selección al siguiente disponible
      if (this.lastSelectedCharId === charId && this.lastSelectedContext === 'pool') {
        const nextPool = this.unassignedCharacters || [];
        if (nextPool.length > 0) {
          const nextIdx = Math.min(nextPool.length - 1, Math.max(0, this._lastPoolNavIndex || 0));
          if (nextPool[nextIdx]) {
            this.lastSelectedCharId = nextPool[nextIdx].id;
            this.selectedCharacterIds = [nextPool[nextIdx].id];
            this.scrollPoolItemIntoView(nextPool[nextIdx].id);
          }
        } else {
          this.lastSelectedCharId = null;
          this.selectedCharacterIds = [];
        }
        this.refreshIcons();
      }
    },

    unassignCharacter(charId) {
      this.boardQuickMenuCharId = null;
      if (!charId) return;
      const isOp = this.isOperatorItem(charId);
      this.pushUndoSnapshot(isOp ? 'Eliminar operador de fila' : 'Devolver al banco');
      this.tiers.forEach(t => {
        t.characterIds = (t.characterIds || []).filter(id => id !== charId);
      });
      if (this.characterModifiers && this.characterModifiers[charId]) {
        delete this.characterModifiers[charId];
      }
      if (this.hoveredCharId === charId) {
        this.hoveredCharId = null;
      }
      if (this.lastSelectedCharId === charId) {
        this.lastSelectedCharId = null;
      }
      if (!isOp && Array.isArray(this.poolCharacterIds) && !this.poolCharacterIds.includes(charId)) {
        this.poolCharacterIds.push(charId);
        if (this.currentList) {
          this.currentList.poolCharacterIds = [...this.poolCharacterIds];
        }
      }
      this.saveState();
      this.refreshIcons();
      if (isOp) {
        Alpine.store('app')?.toast?.('Operador eliminado de la fila.', 'info');
      }
    },

    // ── Selección Múltiple de Operativos (Shift: individual · Ctrl: rango) ─────
    isCharacterSelected(charId) {
      if (!charId) return false;
      return this.selectedCharacterIds.includes(charId);
    },

    toggleSelectCharacter(charId) {
      if (!charId) return;
      const idx = this.selectedCharacterIds.indexOf(charId);
      if (idx !== -1) {
        this.selectedCharacterIds.splice(idx, 1);
      } else {
        this.selectedCharacterIds.push(charId);
      }
      this.refreshIcons();
    },

    selectCharacter(charId) {
      if (!charId) return;
      if (!this.selectedCharacterIds.includes(charId)) {
        this.selectedCharacterIds.push(charId);
        this.refreshIcons();
      }
    },

    deselectCharacter(charId) {
      if (!charId) return;
      const idx = this.selectedCharacterIds.indexOf(charId);
      if (idx !== -1) {
        this.selectedCharacterIds.splice(idx, 1);
        this.refreshIcons();
      }
    },

    clearSelectedCharacters() {
      this.selectedCharacterIds = [];
      this.lastSelectedCharId = null;
      this.lastSelectedContext = null;
      this.refreshIcons();
    },

    selectAllUnassigned() {
      const unassigned = this.unassignedCharacters || [];
      const ids = unassigned.map(c => c.id).filter(Boolean);
      this.selectedCharacterIds = Array.from(new Set([...this.selectedCharacterIds, ...ids]));
      this.refreshIcons();
    },

    selectAllInTier(tierId) {
      const tier = this.tiers.find(t => t.id === tierId);
      if (!tier || !Array.isArray(tier.characterIds)) return;
      const allItemIds = tier.characterIds;
      this.selectedCharacterIds = Array.from(new Set([...this.selectedCharacterIds, ...allItemIds]));
      this.refreshIcons();
    },

    detectContextForCharacter(charId) {
      if (!charId) return null;
      if (this.unassignedCharacters && this.unassignedCharacters.some(c => c.id === charId)) {
        return 'pool';
      }
      for (const t of this.tiers) {
        if (Array.isArray(t.characterIds) && t.characterIds.includes(charId)) {
          return 'tier:' + t.id;
        }
      }
      return null;
    },

    getCharacterIdListForContext(context, charId = null) {
      const ctx = context || (charId ? this.detectContextForCharacter(charId) : null);
      if (ctx === 'pool') {
        return (this.unassignedCharacters || []).map(c => c.id).filter(Boolean);
      }
      if (ctx && ctx.startsWith('tier:')) {
        const tierId = ctx.replace('tier:', '');
        const tier = this.tiers.find(t => t.id === tierId);
        return tier?.characterIds || [];
      }
      return [];
    },

    getOrderedSelection(itemIds) {
      if (!Array.isArray(itemIds) || itemIds.length <= 1) return itemIds || [];

      // 1. Si todos los items pertenecen al mismo tier, ordenarlos por su posición visual en ese tier
      for (const tier of this.tiers) {
        const tierIds = tier.characterIds || [];
        if (itemIds.every(id => tierIds.includes(id))) {
          return [...itemIds].sort((a, b) => tierIds.indexOf(a) - tierIds.indexOf(b));
        }
      }

      // 2. Si todos los items pertenecen al banco (pool), ordenarlos según su orden en el banco
      const pool = this.unassignedCharacters || [];
      const poolIds = pool.map(c => c.id);
      if (itemIds.every(id => poolIds.includes(id))) {
        return [...itemIds].sort((a, b) => poolIds.indexOf(a) - poolIds.indexOf(b));
      }

      // 3. Si provienen de tiers distintos o mixtos, seguir el orden natural del tablero (tiers de arriba a abajo, luego banco)
      const boardOrder = [];
      this.tiers.forEach(t => {
        (t.characterIds || []).forEach(id => boardOrder.push(id));
      });
      poolIds.forEach(id => boardOrder.push(id));

      const idSet = new Set(itemIds);
      const ordered = boardOrder.filter(id => idSet.has(id));

      // Respaldo para cualquier ID que no estuviera en la lista global (ej. operadores nuevos)
      if (ordered.length < itemIds.length) {
        const orderedSet = new Set(ordered);
        itemIds.forEach(id => {
          if (!orderedSet.has(id)) ordered.push(id);
        });
      }

      return ordered;
    },

    selectRange(charId, context = null) {
      if (!charId) return;
      const ctx = context || this.detectContextForCharacter(charId);
      const list = this.getCharacterIdListForContext(ctx, charId);

      if (!list || list.length === 0) {
        this.toggleSelectCharacter(charId);
        this.lastSelectedCharId = charId;
        this.lastSelectedContext = ctx;
        return;
      }

      const targetIdx = list.indexOf(charId);
      if (targetIdx === -1) {
        this.toggleSelectCharacter(charId);
        this.lastSelectedCharId = charId;
        this.lastSelectedContext = ctx;
        return;
      }

      const anchorId = this.lastSelectedCharId;
      const isSameContext = Boolean(anchorId && this.lastSelectedContext === ctx);
      const anchorIdx = isSameContext ? list.indexOf(anchorId) : -1;

      if (anchorIdx === -1) {
        // Primer elemento seleccionado o ancla previa inexistente/en otro contexto
        this.selectCharacter(charId);
        this.lastSelectedCharId = charId;
        this.lastSelectedContext = ctx;
      } else {
        // Seleccionar todo el rango entre el primer elemento (ancla) y este último elemento
        const start = Math.min(anchorIdx, targetIdx);
        const end = Math.max(anchorIdx, targetIdx);
        const slice = list.slice(start, end + 1);

        slice.forEach(id => {
          if (!this.selectedCharacterIds.includes(id)) {
            this.selectedCharacterIds.push(id);
          }
        });

        this.lastSelectedCharId = charId;
        this.lastSelectedContext = ctx;
        this.refreshIcons();
      }
    },

    handleTokenClick(event, charId, onNormalClick = null, context = null) {
      const ctx = context || this.detectContextForCharacter(charId);

      // 0. Modo Destino Rápido Activo (Click-to-Send continuo a un tier fijado desde la banca)
      if (this.activeTargetTierId && ctx === 'pool') {
        event?.preventDefault?.();
        event?.stopPropagation?.();
        if (this.selectedCharacterIds.length > 0 && this.isCharacterSelected(charId)) {
          this.assignSelectedCharacters(this.activeTargetTierId);
        } else {
          this.assignCharacter(charId, this.activeTargetTierId);
        }
        return true;
      }

      // 1. Shift + Click: Selección por Rango (del último seleccionado hasta el actual)
      if (event && event.shiftKey) {
        event.preventDefault();
        event.stopPropagation();
        this.selectRange(charId, ctx);
        this.lastSelectedCharId = charId;
        this.lastSelectedContext = ctx;
        return true;
      }

      // 2. Ctrl / Cmd + Click: Selección Individual / Toggle (suma o resta individualmente)
      if (event && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        event.stopPropagation();
        this.toggleSelectCharacter(charId);
        this.lastSelectedCharId = charId;
        this.lastSelectedContext = ctx;
        return true;
      }

      // 3. Si hay una selección múltiple activa (o modo manual), cualquier clic suma o resta elementos
      if (this.selectedCharacterIds.length > 0 || this.isMultiSelectMode) {
        event?.preventDefault?.();
        event?.stopPropagation?.();
        this.toggleSelectCharacter(charId);
        this.lastSelectedCharId = charId;
        this.lastSelectedContext = ctx;
        return true;
      }

      // 4. Clic normal (seleccionar el token y teñir su marco de acento)
      this.lastSelectedCharId = charId;
      this.lastSelectedContext = ctx;
      if (ctx === 'pool') {
        const pool = this.visibleUnassignedCharacters || [];
        const idx = pool.findIndex(c => c.id === charId);
        if (idx !== -1) this._lastPoolNavIndex = idx;
      }

      if (typeof onNormalClick === 'function') {
        onNormalClick();
      } else {
        this.toggleSelectCharacter(charId);
      }
      return false;
    },

    // ── Navegación Espacial 2D con WASD / Flechas en el Banco ─────────
    navigatePoolSelection(direction, isShift = false, isAlt = false) {
      const pool = this.visibleUnassignedCharacters || [];
      if (!pool.length) return;

      const currentId = this.lastSelectedCharId;
      let currentIndex = -1;
      if (currentId) {
        currentIndex = pool.findIndex(c => c.id === currentId);
      }

      // Si el elemento previo ya no está en el banco (ej: fue asignado), usar el último índice recordado
      if (currentIndex === -1 && typeof this._lastPoolNavIndex === 'number') {
        currentIndex = Math.min(pool.length - 1, Math.max(0, this._lastPoolNavIndex));
      }

      // Si aún no hay nada seleccionado, seleccionar el primero y enfocar
      if (currentIndex === -1) {
        const first = pool[0];
        this._lastPoolNavIndex = 0;
        this.selectPoolToken(first.id, true);
        return;
      }

      let targetIndex = currentIndex;

      // Intentar navegación espacial precisa mediante el DOM
      const elements = Array.from(document.querySelectorAll('.tier-pool-item-wrapper[data-pool-char-id]'));
      const currentEl = document.getElementById('tier-pool-item-' + currentId) || elements[currentIndex];

      if (elements.length > 0 && currentEl && elements.length === pool.length) {
        const currentRect = currentEl.getBoundingClientRect();
        const currentCenterX = currentRect.left + currentRect.width / 2;

        if (direction === 'left') {
          targetIndex = Math.max(0, currentIndex - 1);
        } else if (direction === 'right') {
          targetIndex = Math.min(pool.length - 1, currentIndex + 1);
        } else if (direction === 'up') {
          // Buscar elementos en la fila superior más cercana
          const aboveElements = elements
            .map((el, idx) => ({ el, idx, rect: el.getBoundingClientRect() }))
            .filter(item => item.rect.top < currentRect.top - 8);

          if (aboveElements.length > 0) {
            const maxTop = Math.max(...aboveElements.map(item => item.rect.top));
            const rowElements = aboveElements.filter(item => Math.abs(item.rect.top - maxTop) < 12);
            rowElements.sort((a, b) => {
              const distA = Math.abs((a.rect.left + a.rect.width / 2) - currentCenterX);
              const distB = Math.abs((b.rect.left + b.rect.width / 2) - currentCenterX);
              return distA - distB;
            });
            targetIndex = rowElements[0].idx;
          }
        } else if (direction === 'down') {
          // Buscar elementos en la fila inferior más cercana
          const belowElements = elements
            .map((el, idx) => ({ el, idx, rect: el.getBoundingClientRect() }))
            .filter(item => item.rect.top > currentRect.top + 8);

          if (belowElements.length > 0) {
            const minTop = Math.min(...belowElements.map(item => item.rect.top));
            const rowElements = belowElements.filter(item => Math.abs(item.rect.top - minTop) < 12);
            rowElements.sort((a, b) => {
              const distA = Math.abs((a.rect.left + a.rect.width / 2) - currentCenterX);
              const distB = Math.abs((b.rect.left + b.rect.width / 2) - currentCenterX);
              return distA - distB;
            });
            targetIndex = rowElements[0].idx;
          }
        }
      } else {
        // Fallback geométrico estimando columnas
        const container = document.querySelector('.tier-dropzone-grid');
        const containerW = container ? container.clientWidth : 800;
        const tokenW = (this.tokenSize || 72) + (this.itemGap ?? 10);
        const cols = Math.max(1, Math.floor(containerW / tokenW));

        if (direction === 'left') targetIndex = Math.max(0, currentIndex - 1);
        else if (direction === 'right') targetIndex = Math.min(pool.length - 1, currentIndex + 1);
        else if (direction === 'up') targetIndex = Math.max(0, currentIndex - cols);
        else if (direction === 'down') targetIndex = Math.min(pool.length - 1, currentIndex + cols);
      }

      this._lastPoolNavIndex = targetIndex;
      const targetChar = pool[targetIndex];
      if (!targetChar) return;

      // Si se mantiene Alt: reordenar / reposicionar en el banco
      if (isAlt && targetIndex !== currentIndex && currentId) {
        this.reorderOrInsertPoolItem(
          currentId,
          targetChar.id,
          targetIndex,
          (direction === 'left' || direction === 'up') ? 'left' : 'right'
        );
        this.scrollPoolItemIntoView(currentId);
        return;
      }

      // Si se mantiene Shift: selección continua por rango
      if (isShift) {
        this.selectRange(targetChar.id, 'pool');
        this.lastSelectedCharId = targetChar.id;
        this.lastSelectedContext = 'pool';
        this.scrollPoolItemIntoView(targetChar.id);
        this.refreshIcons();
        return;
      }

      // Selección individual estándar con WASD
      this.selectPoolToken(targetChar.id, true);
    },

    selectPoolToken(charId, scroll = true) {
      if (!charId) return;
      this.lastSelectedCharId = charId;
      this.lastSelectedContext = 'pool';
      this.selectedCharacterIds = [charId];
      const pool = this.visibleUnassignedCharacters || [];
      const idx = pool.findIndex(c => c.id === charId);
      if (idx !== -1) this._lastPoolNavIndex = idx;

      if (scroll) {
        this.scrollPoolItemIntoView(charId);
      }
      this.refreshIcons();
    },

    scrollPoolItemIntoView(charId) {
      if (!charId) return;
      requestAnimationFrame(() => {
        const el = document.getElementById('tier-pool-item-' + charId);
        if (el) {
          el.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
        }
      });
    },

    // ── Estilos Dinámicos de Selección acordes a la Configuración del Usuario ─
    getMultiselectAccentColor() {
      return Alpine.store('settings')?.accentColor || '#00f0ff';
    },

    getMultiselectRgbChannels() {
      return Alpine.store('settings')?.rgbChannels || '0, 240, 255';
    },

    getMultiselectBarStyle() {
      if (!this.selectedCount || this.selectedCount <= 0) {
        return 'display: none !important;';
      }
      const settings = Alpine.store('settings');
      const rgb = settings?.rgbChannels || '0, 240, 255';
      const surface = settings?.surfaceColor || '#07090d';
      return `background-color: ${surface}f2; border-color: rgba(${rgb}, 0.55); box-shadow: 0 20px 50px rgba(0,0,0,0.95), 0 0 35px rgba(${rgb}, 0.35);`;
    },

    getMultiselectLaserStyle() {
      const settings = Alpine.store('settings');
      const accent = settings?.accentColor || '#00f0ff';
      return `background: linear-gradient(90deg, transparent, ${accent}, transparent);`;
    },

    getMultiselectIconBoxStyle() {
      const settings = Alpine.store('settings');
      const accent = settings?.accentColor || '#00f0ff';
      const rgb = settings?.rgbChannels || '0, 240, 255';
      return `background-color: rgba(${rgb}, 0.18); border-color: rgba(${rgb}, 0.45); color: ${accent}; box-shadow: 0 0 12px rgba(${rgb}, 0.4);`;
    },

    getMultiselectBadgeStyle() {
      const settings = Alpine.store('settings');
      const accent = settings?.accentColor || '#00f0ff';
      const rgb = settings?.rgbChannels || '0, 240, 255';
      return `background-color: ${accent}; color: #000000; box-shadow: 0 0 14px rgba(${rgb}, 0.85);`;
    },

    getTokenSelectionBoxStyle(charId) {
      if (!this.isCharacterSelected(charId)) return '';
      const settings = Alpine.store('settings');
      const accent = settings?.accentColor || '#00f0ff';
      const rgb = settings?.rgbChannels || '0, 240, 255';
      return `outline: 2.5px solid ${accent} !important; outline-offset: 2.5px !important; box-shadow: 0 0 22px rgba(${rgb}, 0.9) !important;`;
    },

    assignSelectedCharacters(targetTierId) {
      if (!this.selectedCharacterIds.length || !targetTierId) return;
      this.assignMultipleCharacters([...this.selectedCharacterIds], targetTierId);
    },

    unassignSelectedCharacters() {
      if (!this.selectedCharacterIds.length) return;
      this.unassignMultipleCharacters([...this.selectedCharacterIds]);
    },

    assignMultipleCharacters(charIds, targetTierId) {
      this.pushUndoSnapshot(`Asignar ${charIds.length} operativos`);
      if (!Array.isArray(charIds) || charIds.length === 0 || !targetTierId) return;
      const targetTier = this.tiers.find(t => t.id === targetTierId);
      if (!targetTier) return;
      if (!Array.isArray(targetTier.characterIds)) targetTier.characterIds = [];

      const orderedIds = this.getOrderedSelection(charIds);
      const idsSet = new Set(orderedIds);

      // Remover de todos los tiers existentes
      this.tiers.forEach(t => {
        t.characterIds = (t.characterIds || []).filter(id => !idsSet.has(id));
      });

      // Insertar al final del tier destino preservando orden visual
      orderedIds.forEach(id => {
        if (!targetTier.characterIds.includes(id)) {
          targetTier.characterIds.push(id);
        }
      });

      const count = charIds.length;
      const label = targetTier.label || 'el rango';
      this.clearSelectedCharacters();
      this.saveState();
      Alpine.store('app')?.toast?.(`${count} operativos asignados a Rango ${label}.`, 'success');
      this.refreshIcons();
    },

    unassignMultipleCharacters(charIds) {
      if (!Array.isArray(charIds) || charIds.length === 0) return;
      this.pushUndoSnapshot(`Devolver/eliminar ${charIds.length} elementos`);
      const idsSet = new Set(charIds);

      // Remover de todos los tiers
      this.tiers.forEach(t => {
        t.characterIds = (t.characterIds || []).filter(id => !idsSet.has(id));
      });

      // Limpiar modificadores si los hubiese
      charIds.forEach(id => {
        if (this.characterModifiers && this.characterModifiers[id]) {
          delete this.characterModifiers[id];
        }
        if (this.currentList?.dividerLabels && this.currentList.dividerLabels[id]) {
          delete this.currentList.dividerLabels[id];
        }
      });

      const count = charIds.length;
      const opCount = charIds.filter(id => this.isOperatorItem(id)).length;
      const charCount = count - opCount;

      if (Array.isArray(this.poolCharacterIds)) {
        charIds.forEach(id => {
          if (!this.isOperatorItem(id) && !this.poolCharacterIds.includes(id)) {
            this.poolCharacterIds.push(id);
          }
        });
        if (this.currentList) {
          this.currentList.poolCharacterIds = [...this.poolCharacterIds];
        }
      }

      this.clearSelectedCharacters();
      this.saveState();
      this.refreshIcons();

      if (opCount > 0 && charCount > 0) {
        Alpine.store('app')?.toast?.(`${charCount} operativos devueltos al banco y ${opCount} operadores eliminados.`, 'info');
      } else if (opCount > 0) {
        Alpine.store('app')?.toast?.(`${opCount} operador(es) eliminado(s) de la fila.`, 'info');
      } else {
        Alpine.store('app')?.toast?.(`${count} operativos devueltos al Banco de reserva.`, 'info');
      }
    },

    confirmDeleteSelectedCharacters() {
      const allIds = Array.from(this.selectedCharacterIds || []);
      const count = allIds.length;
      if (count === 0) return;

      const operatorIds = allIds.filter(id => this.isOperatorItem(id));
      const charIds = allIds.filter(id => !this.isOperatorItem(id));
      const selected = charIds.map(id => this.resolveCharacter(id)).filter(Boolean);

      const guests = selected.filter(c => c.isGuest && !c.isTemplate);
      const templates = selected.filter(c => c.isTemplate);
      const registered = selected.filter(c => !c.isGuest && !c.isTemplate);

      let message = '';
      let submessage = 'Esta acción se puede deshacer con Ctrl+Z.';

      if (charIds.length === 0) {
        // Solo hay operadores / modificadores seleccionados
        const title = operatorIds.length === 1 ? '¿Eliminar Operador?' : `¿Eliminar ${operatorIds.length} Operadores?`;
        message = `¿Deseas eliminar los ${operatorIds.length} operadores seleccionados del tablero?`;
        submessage = 'Se removerán permanentemente de las filas. Esta acción se puede deshacer con Ctrl+Z.';
        this.openConfirm({
          title,
          message,
          submessage,
          confirmText: 'Eliminar',
          confirmType: 'danger',
          icon: 'trash-2',
          onConfirm: () => {
            this.deleteSelectedCharacters();
          }
        });
        return;
      }

      if (registered.length === 0) {
        const parts = [];
        if (templates.length > 0) parts.push(`${templates.length} de plantilla`);
        if (guests.length > 0) parts.push(`${guests.length} invitado(s)`);
        if (operatorIds.length > 0) parts.push(`${operatorIds.length} operador(es)`);
        message = `¿Deseas eliminar permanentemente los ${count} elementos seleccionados (${parts.join(', ')})?`;
        submessage = 'Se removerán por completo de los rangos y del banco de reserva.';
      } else if (guests.length === 0 && templates.length === 0) {
        if (operatorIds.length > 0) {
          message = `¿Deseas procesar los ${count} elementos seleccionados (${operatorIds.length} operadores y ${registered.length} operativos)?`;
          submessage = 'Los operadores se eliminarán del tablero y los operativos registrados regresarán al banco de reserva.';
        } else {
          message = `¿Deseas retirar del tablero los ${count} operativos registrados seleccionados?`;
          submessage = 'Regresarán al banco de reserva. Sus fichas de personaje se mantendrán intactas.';
        }
      } else {
        const permanentCount = guests.length + templates.length + operatorIds.length;
        message = `¿Deseas eliminar los ${count} elementos seleccionados?`;
        submessage = `${permanentCount} elementos (invitados/plantilla/operadores) se eliminarán definitivamente, mientras que los ${registered.length} registrados solo regresarán al banco.`;
      }

      this.openConfirm({
        title: count === 1 ? '¿Eliminar Elemento?' : `¿Eliminar ${count} Elementos?`,
        message,
        submessage,
        confirmText: 'Eliminar',
        confirmType: 'danger',
        icon: 'trash-2',
        onConfirm: () => {
          this.deleteSelectedCharacters();
        }
      });
    },

    deleteSelectedCharacters() {
      const ids = Array.from(this.selectedCharacterIds || []);
      if (ids.length === 0) return;

      this.pushUndoSnapshot(`Eliminar ${ids.length} elementos`);

      const idsSet = new Set(ids);

      // 1. Remover de todos los tiers
      this.tiers.forEach(t => {
        t.characterIds = (t.characterIds || []).filter(id => !idsSet.has(id));
      });

      // 2. Limpiar modificadores si los hubiese
      ids.forEach(id => {
        if (this.characterModifiers && this.characterModifiers[id]) {
          delete this.characterModifiers[id];
        }
        if (this.currentList?.dividerLabels && this.currentList.dividerLabels[id]) {
          delete this.currentList.dividerLabels[id];
        }
      });

      // 3. Eliminar de invitados manuales (guestCharacters)
      const prevGuestsLen = (this.guestCharacters || []).length;
      this.guestCharacters = (this.guestCharacters || []).filter(c => !idsSet.has(c.id));
      const deletedGuests = prevGuestsLen - (this.guestCharacters || []).length;

      // 4. Eliminar de personajes de plantilla (currentList.templateCharacters y listas)
      let deletedTemplates = 0;
      if (this.currentList && Array.isArray(this.currentList.templateCharacters)) {
        const prevTplLen = this.currentList.templateCharacters.length;
        this.currentList.templateCharacters = this.currentList.templateCharacters.filter(c => !idsSet.has(c.id));
        deletedTemplates = prevTplLen - this.currentList.templateCharacters.length;
      }
      this.lists.forEach(l => {
        if (Array.isArray(l.templateCharacters)) {
          l.templateCharacters = l.templateCharacters.filter(c => !idsSet.has(c.id));
        }
      });

      const totalDeletedPermanent = deletedGuests + deletedTemplates;
      const count = ids.length;
      const opCount = ids.filter(id => this.isOperatorItem(id)).length;
      const charCount = count - opCount;

      this.clearSelectedCharacters();
      this.saveState();
      this.refreshIcons();

      if (opCount > 0 && charCount === 0) {
        Alpine.store('app')?.toast?.(`${opCount} operador(es) eliminado(s) del tablero.`, 'info');
      } else if (opCount > 0 && charCount > 0) {
        Alpine.store('app')?.toast?.(`${opCount} operador(es) eliminado(s) y ${charCount} operativos procesados.`, 'info');
      } else if (totalDeletedPermanent > 0) {
        Alpine.store('app')?.toast?.(`${count} operativos procesados (${totalDeletedPermanent} eliminados permanentemente).`, 'info');
      } else {
        Alpine.store('app')?.toast?.(`${count} operativos devueltos al banco de reserva.`, 'info');
      }
    },

    // ── Estilo de Nombres (Debajo / Superpuesto / Oculto) ───────────
    setNameplateStyle(style) {
      if (['below', 'overlay', 'hidden'].includes(style)) {
        this.nameplateStyle = style;
        this.saveState();
      }
    },

    // ── Estilo de Operadores en Fila (Solo Símbolo vs Bloque Completo) ─
    setOperatorDisplayMode(mode) {
      if (['symbol', 'card'].includes(mode)) {
        this.operatorDisplayMode = mode;
        try {
          ls.set('superficha_tierlist_op_display_mode', mode);
        } catch (e) {}
        this.saveState();
        this.refreshIcons();
        Alpine.store('app')?.toast?.(
          mode === 'symbol'
            ? 'Operadores en modo «Solo Símbolo» (sin caja ni nombre).'
            : 'Operadores en modo «Bloque y Nombre» (tarjeta completa).',
          'info'
        );
      }
    },

    toggleOperatorDisplayMode() {
      this.setOperatorDisplayMode((this.operatorDisplayMode || 'symbol') === 'symbol' ? 'card' : 'symbol');
    },

    setTokenSize(size) {
      const num = Math.max(48, Math.min(112, parseInt(size, 10) || 72));
      this.tokenSize = num;
      try {
        ls.set('superficha_tierlist_token_size', num);
      } catch (e) {}
      this.saveState();
    },

    setItemGap(gap) {
      const num = Math.max(0, Math.min(36, parseInt(gap, 10) || 0));
      this.itemGap = num;
      try {
        ls.set('superficha_tierlist_item_gap', num);
      } catch (e) {}
      this.saveState();
    },

    setPoolAlignment(align) {
      const val = align === 'center' ? 'center' : 'left';
      this.poolAlignment = val;
      try {
        ls.set('superficha_tierlist_pool_alignment', val);
      } catch (e) {}
      this.saveState();
      Alpine.store('app')?.toast?.(`Alineación del banco: ${val === 'center' ? 'Centrado (balanceado)' : 'Izquierda (estándar)'}`, 'info');
    },

    resetAppearanceDefaults() {
      this.setTokenSize(72);
      this.setItemGap(10);
      this.setPoolAlignment('left');
      this.nameplateStyle = 'below';
      this.rowOpacity = 40;
      this.saveState();
      this.refreshIcons();
      Alpine.store('app')?.toast?.('Apariencia restablecida: 72px / 10px (Alineación óptima al ras).', 'success');
    },

    cycleNameplateStyle() {
      const order = ['below', 'overlay', 'hidden'];
      const nextIdx = (order.indexOf(this.nameplateStyle || 'below') + 1) % order.length;
      this.nameplateStyle = order[nextIdx];
      this.saveState();
      const labels = {
        below: 'Debajo (Marcos y banners 100% libres)',
        overlay: 'Superpuesto en el avatar',
        hidden: 'Oculto (Solo avatares)'
      };
      Alpine.store('app')?.toast?.(`Estilo de nombres: ${labels[this.nameplateStyle]}`, 'info');
    },

    // ── Drag and Drop Nativo HTML5 Fluido y Preciso ─────────────────
    startDrag(event, charId, source) {
      this.draggingCharId = charId;
      this.dragSource = source; // { type: 'pool' } | { type: 'tier', tierId: string, index: number }
      this.dragOverTarget = null;
      if (typeof document !== 'undefined') {
        document.body.classList.add('is-tier-dragging');
      }
      try {
        event.dataTransfer.setData('text/plain', charId);
        event.dataTransfer.effectAllowed = 'move';
        if (this.isCharacterSelected(charId) && this.selectedCharacterIds.length > 1) {
          event.dataTransfer.setData('application/tier-multiselect', JSON.stringify(this.selectedCharacterIds));

          // Capsule ghost follower con badge +N al arrastrar en bloque
          try {
            const count = this.selectedCharacterIds.length;
            const accent = Alpine.store('settings')?.accentColor || '#00f0ff';
            const ghostEl = document.createElement('div');
            ghostEl.style.position = 'fixed';
            ghostEl.style.top = '-9999px';
            ghostEl.style.left = '-9999px';
            ghostEl.style.padding = '6px 14px';
            ghostEl.style.borderRadius = '12px';
            ghostEl.style.background = '#0a0d14';
            ghostEl.style.border = `2px solid ${accent}`;
            ghostEl.style.color = '#ffffff';
            ghostEl.style.fontFamily = 'monospace';
            ghostEl.style.fontSize = '12px';
            ghostEl.style.fontWeight = 'bold';
            ghostEl.style.boxShadow = `0 10px 25px rgba(0,0,0,0.8), 0 0 15px ${accent}66`;
            ghostEl.style.display = 'flex';
            ghostEl.style.alignItems = 'center';
            ghostEl.style.gap = '8px';
            ghostEl.style.zIndex = '999999';
            ghostEl.innerHTML = `<span style="background:${accent};color:#000;padding:2px 7px;border-radius:6px;font-size:11px;font-weight:900;">+${count}</span> <span>Moviendo en grupo</span>`;
            document.body.appendChild(ghostEl);
            event.dataTransfer.setDragImage(ghostEl, 20, 20);
            setTimeout(() => { if (ghostEl.parentNode) document.body.removeChild(ghostEl); }, 0);
          } catch (e) {}
        }
      } catch (e) {}
    },

    endDrag() {
      this.draggingCharId = null;
      this.dragSource = null;
      this.dragOverTarget = null;
      this.draggingToolId = null;
      if (typeof document !== 'undefined') {
        document.body.classList.remove('is-tier-dragging');
      }
    },

    isItemDimmedOnDrag(charId) {
      if (!this.isDragging) return false;
      if (this.draggingCharId === charId) return true;
      if (this.selectedCharacterIds?.length > 1 &&
          this.selectedCharacterIds.includes(this.draggingCharId) &&
          this.selectedCharacterIds.includes(charId)) {
        return true;
      }
      return false;
    },

    handleItemDragOver(event, tierId, index) {
      event.preventDefault();
      event.stopPropagation();
      // Si estamos arrastrando una herramienta de calificación sobre un personaje, no mostrar línea de reordenación
      if (this.draggingToolId) {
        this.dragOverTarget = null;
        return;
      }
      const rect = event.currentTarget.getBoundingClientRect();
      const tier = this.tiers.find(t => t.id === tierId);
      const rawItem = tier?.characterIds?.[index];

      // Si estamos arrastrando una selección múltiple y el cursor pasa sobre uno de los elementos seleccionados,
      // no mostrar la línea de reubicación dentro de la propia selección
      if (this.selectedCharacterIds?.length > 1 && this.selectedCharacterIds.includes(this.draggingCharId) && this.selectedCharacterIds.includes(rawItem)) {
        this.dragOverTarget = null;
        return;
      }

      const isDivider = typeof rawItem === 'string' && (rawItem.startsWith('op:op_hr:') || rawItem.startsWith('op:op_divider_horizontal:'));

      if (isDivider) {
        const mouseY = event.clientY - rect.top;
        const targetSide = mouseY > (rect.height / 2) ? 'bottom' : 'top';
        const prev = this.dragOverTarget;
        if (prev && prev.tierId === tierId && prev.index === index && prev.side === targetSide) {
          return;
        }
        this.dragOverTarget = {
          tierId,
          index,
          side: targetSide
        };
        return;
      }

      const mouseX = event.clientX - rect.left;
      const targetSide = mouseX > (rect.width / 2) ? 'right' : 'left';
      const prev = this.dragOverTarget;
      if (prev && prev.tierId === tierId && prev.index === index && prev.side === targetSide) {
        return;
      }
      this.dragOverTarget = {
        tierId,
        index,
        side: targetSide
      };
    },

    handleItemDragLeave(event) {
      if (event.currentTarget && event.relatedTarget && event.currentTarget.contains(event.relatedTarget)) {
        return;
      }
      this.dragOverTarget = null;
    },

    handleTierDropzoneDragOver(event, tierId) {
      event.preventDefault();
      if (event.target === event.currentTarget) {
        this.dragOverTarget = null;
      }
    },

    reorderOrInsertItem(itemId, targetTierId, targetIndex, insertSide = 'left') {
      if (!itemId || !targetTierId) return;
      const targetTier = this.tiers.find(t => t.id === targetTierId);
      if (!targetTier) return;
      if (!Array.isArray(targetTier.characterIds)) targetTier.characterIds = [];

      // Determinar si movemos un único elemento o un bloque de selección múltiple
      let itemsToMove = [itemId];
      if (this.selectedCharacterIds?.length > 1 && this.selectedCharacterIds.includes(itemId)) {
        itemsToMove = this.getOrderedSelection(this.selectedCharacterIds);
      }

      this.pushUndoSnapshot(itemsToMove.length > 1 
        ? `Mover ${itemsToMove.length} elementos en tablero` 
        : 'Mover elemento en tablero');

      const moveSet = new Set(itemsToMove);

      // Elemento de referencia antes de alterar los arreglos
      const targetItemId = targetTier.characterIds[targetIndex];

      // Si el destino es uno de los propios elementos seleccionados que estamos moviendo dentro del mismo tier, no hacer nada
      if (targetItemId && moveSet.has(targetItemId)) {
        return;
      }

      // Remover todos los elementos a mover de todos los tiers
      this.tiers.forEach(t => {
        t.characterIds = (t.characterIds || []).filter(id => !moveSet.has(id));
      });

      // Si alguno venía del banco con orden personalizado, limpiarlo del banco
      if (Array.isArray(this.poolCharacterIds) && this.poolCharacterIds.length > 0) {
        this.poolCharacterIds = this.poolCharacterIds.filter(id => !moveSet.has(id));
        if (this.currentList) {
          this.currentList.poolCharacterIds = [...this.poolCharacterIds];
        }
      }

      // Calcular la posición exacta de inserción
      let insertAt;
      if (targetItemId && targetTier.characterIds.includes(targetItemId)) {
        const newTargetIndex = targetTier.characterIds.indexOf(targetItemId);
        insertAt = (insertSide === 'right' || insertSide === 'bottom') ? newTargetIndex + 1 : newTargetIndex;
      } else if (typeof targetIndex === 'number' && targetIndex >= 0) {
        let desired = targetIndex;
        if (insertSide === 'right' || insertSide === 'bottom') desired += 1;
        insertAt = Math.max(0, Math.min(targetTier.characterIds.length, desired));
      } else {
        insertAt = targetTier.characterIds.length;
      }

      const safeIndex = Math.max(0, Math.min(targetTier.characterIds.length, insertAt));
      targetTier.characterIds.splice(safeIndex, 0, ...itemsToMove);

      // Una vez soltados y posicionados con éxito, deseleccionar para que queden asentados limpiamente
      this.clearSelectedCharacters();

      this.saveState();
      this.refreshIcons();
    },

    handleItemDrop(event, tierId, index) {
      if (event) {
        event.preventDefault();
        event.stopPropagation();
      }
      const targetSide = this.dragOverTarget?.side || 'left';
      this.dragOverTarget = null;

      // Debounce anti-rebote de eventos de soltado (evita duplicar inserciones en el mismo tick)
      const now = Date.now();
      if (this._lastTierDropTime && (now - this._lastTierDropTime < 150)) {
        return;
      }
      this._lastTierDropTime = now;

      // 1. Si se soltó una herramienta de calificación desde la caja de herramientas
      const toolId = event.dataTransfer?.getData('application/tier-tool') || this.draggingToolId;
      if (toolId) {
        const tier = this.tiers.find(t => t.id === tierId);
        const targetItemId = tier?.characterIds?.[index];
        const tool = this.getRatingTool(toolId);
        if (targetItemId && !this.isOperatorItem(targetItemId) && tool?.type === 'badge') {
          this.addCharacterModifier(targetItemId, toolId);
        } else {
          const insertIdx = (targetSide === 'right' || targetSide === 'bottom') ? index + 1 : index;
          this.insertOperatorInTier(tierId, toolId, insertIdx);
        }
        this.endDrag();
        return;
      }

      // 2. Si se soltó un personaje u operador para mover o reordenar
      const raw = event.dataTransfer?.getData('text/plain') || this.draggingCharId;
      if (!raw) {
        this.endDrag();
        return;
      }

      if (raw.startsWith('tool:')) {
        const tid = raw.replace('tool:', '');
        const insertIdx = (targetSide === 'right' || targetSide === 'bottom') ? index + 1 : index;
        this.insertOperatorInTier(tierId, tid, insertIdx);
        this.endDrag();
        return;
      }

      this.reorderOrInsertItem(raw, tierId, index, targetSide);
      this.endDrag();
    },

    handleDropOnTier(event, tierId, targetIndex = null) {
      if (event) {
        event.preventDefault();
        event.stopPropagation();
      }
      this.dragOverTarget = null;

      // Debounce anti-rebote de eventos de soltado (evita duplicar inserciones en el mismo tick)
      const now = Date.now();
      if (this._lastTierDropTime && (now - this._lastTierDropTime < 150)) {
        return;
      }
      this._lastTierDropTime = now;

      // 1. Si se soltó una herramienta
      const toolId = event?.dataTransfer?.getData('application/tier-tool') || this.draggingToolId;
      if (toolId) {
        this.insertOperatorInTier(tierId, toolId, targetIndex);
        this.endDrag();
        return;
      }

      const raw = event?.dataTransfer?.getData('text/plain') || this.draggingCharId;
      if (!raw) {
        this.endDrag();
        return;
      }

      if (raw.startsWith('tool:')) {
        this.insertOperatorInTier(tierId, raw.replace('tool:', ''), targetIndex);
        this.endDrag();
        return;
      }

      // Si se soltó en el fondo vacío del tier, añadir al final respetando orden y multiselección
      const tier = this.tiers.find(t => t.id === tierId);
      const count = tier?.characterIds?.length || 0;
      this.reorderOrInsertItem(raw, tierId, count, 'right');
      this.endDrag();
    },

    handleDropOnCharacter(event, charId) {
      event.preventDefault();
      event.stopPropagation();
      const toolId = event.dataTransfer?.getData('application/tier-tool') || this.draggingToolId;
      if (toolId) {
        this.addCharacterModifier(charId, toolId);
        this.endDrag();
        return;
      }
      const raw = event.dataTransfer?.getData('text/plain') || this.draggingCharId;
      if (raw && raw.startsWith('tool:')) {
        this.addCharacterModifier(charId, raw.replace('tool:', ''));
        this.endDrag();
        return;
      }

      for (const t of this.tiers) {
        const idx = (t.characterIds || []).indexOf(charId);
        if (idx !== -1) {
          const side = this.dragOverTarget?.side || 'left';
          this.reorderOrInsertItem(raw, t.id, idx, side);
          break;
        }
      }
      this.endDrag();
    },

    handleDragEnterPool(event) {
      if (event.dataTransfer?.types?.includes('Files')) {
        event.preventDefault();
        this._poolDragTargetCount = (this._poolDragTargetCount || 0) + 1;
        this.isExternalFileDragOverPool = true;
      }
    },

    handleDragOverPool(event) {
      if (event.dataTransfer?.types?.includes('Files')) {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'copy';
        this.isExternalFileDragOverPool = true;
      } else {
        event.preventDefault();
      }
    },

    handlePoolGridDragOver(event) {
      if (event.dataTransfer?.types?.includes('Files')) {
        this.handleDragOverPool(event);
        return;
      }
      event.preventDefault();
      if (event.target === event.currentTarget) {
        if (this.dragOverTarget?.type === 'pool') {
          this.dragOverTarget = null;
        }
      }
    },

    handlePoolItemDragOver(event, charId, index) {
      if (event.dataTransfer?.types?.includes('Files')) return;
      if (this.draggingToolId) return;
      if (this.draggingCharId === charId) {
        this.dragOverTarget = null;
        return;
      }
      if (this.selectedCharacterIds?.length > 1 && this.selectedCharacterIds.includes(this.draggingCharId) && this.selectedCharacterIds.includes(charId)) {
        this.dragOverTarget = null;
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      const rect = event.currentTarget.getBoundingClientRect();
      const mouseX = event.clientX - rect.left;
      const targetSide = mouseX > (rect.width / 2) ? 'right' : 'left';
      const prev = this.dragOverTarget;
      if (prev && prev.type === 'pool' && prev.charId === charId && prev.side === targetSide) {
        return;
      }
      this.dragOverTarget = {
        type: 'pool',
        charId,
        index,
        side: targetSide
      };
    },

    handlePoolItemDragLeave(event) {
      if (event.currentTarget && event.relatedTarget && event.currentTarget.contains(event.relatedTarget)) {
        return;
      }
      if (this.dragOverTarget?.type === 'pool') {
        this.dragOverTarget = null;
      }
    },

    reorderOrInsertPoolItem(rawId, targetCharId, targetIndex, insertSide = 'left') {
      if (!rawId || !targetCharId) return;

      let itemsToMove = [rawId];
      if (this.selectedCharacterIds?.length > 1 && this.selectedCharacterIds.includes(rawId)) {
        itemsToMove = this.getOrderedSelection(this.selectedCharacterIds);
      }

      this.pushUndoSnapshot(itemsToMove.length > 1 
        ? `Reordenar ${itemsToMove.length} operativos en banco` 
        : 'Reordenar operativo en banco');

      const currentPool = this.unassignedCharacters || [];
      let allIds = [];

      if (Array.isArray(this.poolCharacterIds) && this.poolCharacterIds.length > 0) {
        allIds = [...this.poolCharacterIds];
        currentPool.forEach(c => {
          if (!allIds.includes(c.id)) allIds.push(c.id);
        });
      } else {
        allIds = currentPool.map(c => c.id);
      }

      itemsToMove.forEach(id => {
        if (!allIds.includes(id)) allIds.push(id);
      });

      // Remover de tiers si alguno viene de un tier
      const moveSet = new Set(itemsToMove);
      this.tiers.forEach(t => {
        t.characterIds = (t.characterIds || []).filter(id => !moveSet.has(id));
      });
      itemsToMove.forEach(id => {
        if (this.characterModifiers && this.characterModifiers[id]) {
          delete this.characterModifiers[id];
        }
      });

      // Remover los items a mover de allIds para calcular el destino exacto
      allIds = allIds.filter(id => !moveSet.has(id));

      let targetIdx = allIds.indexOf(targetCharId);
      if (targetIdx === -1) {
        targetIdx = allIds.length;
      }

      const insertAt = insertSide === 'right' ? targetIdx + 1 : targetIdx;
      const safeIndex = Math.max(0, Math.min(allIds.length, insertAt));

      allIds.splice(safeIndex, 0, ...itemsToMove);

      this.poolCharacterIds = allIds;
      if (this.currentList) {
        this.currentList.poolCharacterIds = [...allIds];
      }
      this.poolSortOrder = 'default';
      this.clearSelectedCharacters();

      this.saveState();
      this.refreshIcons();
    },

    handlePoolClick(event) {
      if (this.selectedCharacterIds && this.selectedCharacterIds.length > 0) {
        this.clearSelectedCharacters();
      }
    },

    handlePoolItemDrop(event, charId, index) {
      event.preventDefault();
      event.stopPropagation();
      const targetSide = this.dragOverTarget?.side || 'left';
      this.dragOverTarget = null;

      // 1. Archivos externos soltados
      const droppedFiles = event.dataTransfer?.files;
      if (droppedFiles && droppedFiles.length > 0) {
        this.handleBatchFilesDropOnPool(droppedFiles);
        this.endDrag();
        return;
      }

      const raw = event.dataTransfer?.getData('text/plain') || this.draggingCharId;
      if (!raw) {
        this.endDrag();
        return;
      }

      // Si es un operador de fila o herramienta, se descarta del banco
      if (raw.startsWith('op:') || raw.startsWith('tool:')) {
        if (raw.startsWith('op:')) {
          this.tiers.forEach(t => {
            t.characterIds = (t.characterIds || []).filter(id => id !== raw);
          });
          this.saveState();
        }
        this.endDrag();
        return;
      }

      // Si se soltó sobre sí mismo
      if (raw === charId) {
        this.endDrag();
        return;
      }

      this.reorderOrInsertPoolItem(raw, charId, index, targetSide);
      this.endDrag();
    },

    handleDragLeavePool(event) {
      if (event.dataTransfer?.types?.includes('Files')) {
        event.preventDefault();
        this._poolDragTargetCount = Math.max(0, (this._poolDragTargetCount || 0) - 1);
        if (this._poolDragTargetCount === 0) {
          this.isExternalFileDragOverPool = false;
        }
      }
    },

    handleDropOnPool(event) {
      if (event) {
        event.preventDefault();
        event.stopPropagation();
      }
      this._poolDragTargetCount = 0;
      this.isExternalFileDragOverPool = false;

      // 1. Caso: Se soltaron archivos externos desde el explorador del sistema (Windows/Mac/Linux)
      const droppedFiles = event.dataTransfer?.files;
      if (droppedFiles && droppedFiles.length > 0) {
        this.handleBatchFilesDropOnPool(droppedFiles);
        this.endDrag();
        return;
      }

      // 2. Caso: Se soltó un elemento interno del tablero
      const raw = event.dataTransfer?.getData('text/plain') || this.draggingCharId;
      if (!raw) {
        this.endDrag();
        return;
      }
      // Si se soltó un operador de fila en el banco, simplemente se remueve
      if (raw.startsWith('op:')) {
        this.tiers.forEach(t => {
          t.characterIds = (t.characterIds || []).filter(id => id !== raw);
        });
        this.saveState();
        this.endDrag();
        return;
      }
      if (raw.startsWith('tool:')) {
        this.endDrag();
        return;
      }

      // Si se soltó un grupo de selección múltiple hacia el banco
      if (this.selectedCharacterIds.length > 1 && this.selectedCharacterIds.includes(raw)) {
        this.unassignMultipleCharacters([...this.selectedCharacterIds]);
        this.endDrag();
        return;
      }

      this.unassignCharacter(raw);
      this.endDrag();
    },

    handleBatchFilesDropOnPool(fileList) {
      if (!fileList || fileList.length === 0) return;
      const validFiles = Array.from(fileList).filter(file => {
        return file.type.startsWith('image/') || /\.(png|jpe?g|webp|gif|avif|bmp|svg|tiff?|jfif|ico)$/i.test(file.name);
      });

      if (validFiles.length === 0) {
        Alpine.store('app')?.toast?.('Ninguno de los archivos soltados es una imagen o GIF compatible.', 'warning');
        return;
      }

      // Limpiar previews previos para evitar fugas de memoria
      this._cleanupBatchPreviews();

      const items = validFiles.map((file, idx) => {
        const isGif = file.type === 'image/gif' || file.name.toLowerCase().endsWith('.gif');
        let autoName = this.extractCharacterNameFromFileName(file.name);
        if (!autoName || autoName.trim().length === 0) {
          autoName = `Invitado ${idx + 1}`;
        }
        return {
          id: `batch_item_${Date.now()}_${Math.random().toString(36).substr(2, 6)}_${idx}`,
          file: file,
          name: autoName,
          role: this.batchDefaultRole || '',
          previewUrl: URL.createObjectURL(file),
          isGif: isGif,
          sizeKB: Math.round(file.size / 1024)
        };
      });

      this.batchGuestsQueue = items;
      this.batchDefaultRole = '';
      this.batchNamePrefix = '';
      this.isProcessingBatch = false;
      this.batchProcessingProgress = 0;
      this.showBatchGuestsModal = true;
      this.refreshIcons();
    },

    /**
     * Aplica un rol o etiqueta común a todos los operativos en la cola de importación en lote.
     */
    applyBatchRoleToAll(customRole) {
      const role = (customRole !== undefined ? customRole : this.batchDefaultRole || '').trim();
      if (!this.batchGuestsQueue || this.batchGuestsQueue.length === 0) return;
      this.batchGuestsQueue.forEach(item => {
        item.role = role;
      });
      Alpine.store('app')?.toast?.(`Rol "${role || 'ninguno'}" asignado a los ${this.batchGuestsQueue.length} operativos.`, 'info');
    },

    /**
     * Añade un prefijo a los nombres de todos los operativos en la cola de importación en lote.
     */
    applyBatchPrefixToAll(customPrefix) {
      const prefix = (customPrefix !== undefined ? customPrefix : this.batchNamePrefix || '').trim();
      if (!prefix || !this.batchGuestsQueue || this.batchGuestsQueue.length === 0) return;
      this.batchGuestsQueue.forEach(item => {
        if (!item.name.startsWith(prefix)) {
          item.name = `${prefix}${item.name}`;
        }
      });
      Alpine.store('app')?.toast?.(`Prefijo "${prefix}" añadido a los nombres del lote.`, 'info');
    },

    handleBatchFileInputChange(event) {
      const files = event.target?.files;
      if (files && files.length > 0) {
        this.handleBatchFilesDropOnPool(files);
      }
      if (event.target) event.target.value = '';
    },

    removeBatchGuestItem(itemId) {
      const found = this.batchGuestsQueue.find(i => i.id === itemId);
      if (found && found.previewUrl) {
        try { URL.revokeObjectURL(found.previewUrl); } catch (_) {}
      }
      this.batchGuestsQueue = this.batchGuestsQueue.filter(i => i.id !== itemId);
      if (this.batchGuestsQueue.length === 0) {
        this.closeBatchGuestsModal();
      }
    },

    _cleanupBatchPreviews() {
      if (Array.isArray(this.batchGuestsQueue)) {
        this.batchGuestsQueue.forEach(item => {
          if (item.previewUrl) {
            try { URL.revokeObjectURL(item.previewUrl); } catch (_) {}
          }
        });
      }
    },

    closeBatchGuestsModal() {
      this.showBatchGuestsModal = false;
      this.isProcessingBatch = false;
      this.batchProcessingProgress = 0;
      this._cleanupBatchPreviews();
      this.batchGuestsQueue = [];
    },

    async confirmBatchGuestsImport() {
      if (!this.batchGuestsQueue || this.batchGuestsQueue.length === 0) {
        this.closeBatchGuestsModal();
        return;
      }

      this.isProcessingBatch = true;
      this.batchProcessingProgress = 0;
      const total = this.batchGuestsQueue.length;
      const newGuests = [];

      for (let i = 0; i < total; i++) {
        const item = this.batchGuestsQueue[i];
        try {
          let dataUrl = '';
          if (item.isGif) {
            dataUrl = await readFileAsDataUrl(item.file);
          } else {
            try {
              dataUrl = await compressImage(item.file);
            } catch (_) {
              dataUrl = await readFileAsDataUrl(item.file);
            }
          }

          const guestName = (item.name || '').trim() || this.extractCharacterNameFromFileName(item.file?.name) || `Invitado ${i + 1}`;
          const itemRole = (item.role || this.batchDefaultRole || '').trim();
          newGuests.push({
            id: `guest_${Date.now()}_${Math.random().toString(36).substr(2, 6)}_${i}`,
            name: guestName,
            role: itemRole,
            isGuest: true,
            isTemplate: false,
            basics: {
              fullName: guestName,
              role: itemRole,
              avatarDataUrl: dataUrl,
              avatarTransform: '',
              avatarShape: 'rounded',
              useIconForPfp: false
            }
          });
        } catch (err) {
          console.warn('[tierlist] Error al procesar imagen para lote:', item.file?.name, err);
        }
        this.batchProcessingProgress = Math.round(((i + 1) / total) * 100);
      }

      if (newGuests.length > 0) {
        this.guestCharacters = [...(this.guestCharacters || []), ...newGuests];
        await this.saveState(true);
        Alpine.store('app')?.toast?.(`¡Se añadieron ${newGuests.length} operativos invitados a la Tier List!`, 'success');
      }

      this.closeBatchGuestsModal();
      this.poolTab = 'all';
      this.searchQuery = '';
      this.refreshIcons();
    },

    togglePoolPosition() {
      this.poolPosition = this.poolPosition === 'top' ? 'bottom' : 'top';
      ls.set('superficha_tierlist_pool_pos', this.poolPosition);
      Alpine.store('app')?.toast?.(
        this.poolPosition === 'top' ? 'Banco de operativos posicionado arriba del tablero.' : 'Banco de operativos posicionado abajo del tablero.',
        'info'
      );
    },

    setActiveTargetTier(tierId) {
      if (this.activeTargetTierId === tierId) {
        this.activeTargetTierId = null;
        Alpine.store('app')?.toast?.('Modo Destino Rápido desactivado.', 'info');
      } else {
        this.activeTargetTierId = tierId;
        const tier = this.tiers.find(t => t.id === tierId);
        Alpine.store('app')?.toast?.(`Destino activo: Rango «${tier?.label || ''}». Haz clic en cualquier personaje del banco para clasificarlo.`, 'success');
      }
      this.refreshIcons();
    },

    clearActiveTargetTier() {
      this.activeTargetTierId = null;
      this.refreshIcons();
    },

    sortTierItemsAlphabetical(tierId) {
      const tier = this.tiers.find(t => t.id === tierId);
      if (!tier || !Array.isArray(tier.characterIds) || tier.characterIds.length <= 1) return;

      this.pushUndoSnapshot(`Ordenar Rango ${tier.label || ''} (A-Z)`);

      const items = tier.characterIds.map(rawId => {
        if (this.isOperatorItem(rawId)) {
          return { rawId, isOp: true, name: '' };
        }
        const char = this.resolveCharacter(rawId);
        return { rawId, isOp: false, name: (char?.name || '').toLowerCase() };
      });

      const charsOnly = items.filter(it => !it.isOp).sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
      const opsOnly = items.filter(it => it.isOp);

      tier.characterIds = [...charsOnly.map(it => it.rawId), ...opsOnly.map(it => it.rawId)];

      this.saveState();
      Alpine.store('app')?.toast?.(`Rango «${tier.label || ''}» ordenado alfabéticamente (A ➔ Z).`, 'success');
      this.refreshIcons();
    },

    handleEscape() {
      // Si hay algún modal abierto de la tier list, no intervenir aquí
      if (this.showAddGuestModal || this.showListsModal || this.showIconPickerModal || this.showTierEditorModal || this.showTierMakerModal || this.showBatchGuestsModal || this.confirmDialog?.isOpen || this.dividerTitleModal?.isOpen) {
        return false;
      }

      // 1. Si hay operativos seleccionados, deseleccionarlos de inmediato
      if (this.selectedCharacterIds && this.selectedCharacterIds.length > 0) {
        this.clearSelectedCharacters();
        return true;
      }

      // 2. Si hay herramienta de calificación en mano, deseleccionarla
      if (this.selectedToolId) {
        this.clearSelectedTool();
        return true;
      }

      // 3. Si hay un tier fijado como destino rápido, cancelarlo
      if (this.activeTargetTierId) {
        this.clearActiveTargetTier();
        return true;
      }

      // 4. Si el menú contextual de un operativo está abierto, cerrarlo
      if (this.boardQuickMenuCharId) {
        this.closeBoardQuickMenu();
        return true;
      }

      // 5. Si hay búsqueda en el banco, limpiarla
      if (this.searchQuery) {
        this.searchQuery = '';
        return true;
      }

      // 6. Si está en Modo Zen, salir del Modo Zen
      if (this.isZenMode) {
        this.toggleZenMode(false);
        return true;
      }

      return false;
    },

    handleGlobalKeydown(event) {
      if (Alpine.store('app')?.activeView !== 'tierlist') return;

      // Ignore if typing inside any input, textarea or contenteditable
      const target = event.target;
      if (target && (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable)) {
        return;
      }

      // Escape key: deselección inteligente contextual sin expulsar jamás al dashboard
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        this.handleEscape();
        return;
      }

      // Key Z: Alternar Modo Zen / Vista Limpia (sin modificadores Ctrl/Meta/Alt)
      if ((event.key === 'z' || event.key === 'Z') && !event.ctrlKey && !event.metaKey && !event.altKey) {
        event.preventDefault();
        this.toggleZenMode();
        return;
      }

      // ── Atajos de Colapso / Despliegue de Tiers (Alt + C, Shift + C, Ctrl + Alt + C o tecla C) ──
      // 1. Colapsar / Expandir TODOS los tiers: Ctrl + Alt + C o Ctrl + Shift + C
      if ((event.ctrlKey || event.metaKey) && (event.altKey || event.shiftKey) && (event.key === 'c' || event.key === 'C')) {
        event.preventDefault();
        this.toggleCollapseAllTiers();
        return;
      }

      // 2. Colapsar / Expandir el tier bajo el puntero o interactuado: Alt + C o Shift + C
      if ((event.altKey || event.shiftKey) && (event.key === 'c' || event.key === 'C') && !event.ctrlKey && !event.metaKey) {
        const targetTierId = this.hoveredTierId || this.lastInteractedTierId || this.activeTargetTierId;
        if (targetTierId) {
          event.preventDefault();
          this.toggleTierCollapse(targetTierId);
          return;
        }
      }

      // 3. Tecla 'C' directa cuando el puntero está sobre un tier y NO hay personajes seleccionados
      if ((event.key === 'c' || event.key === 'C') && !event.ctrlKey && !event.metaKey && !event.altKey && !event.shiftKey) {
        if (this.hoveredTierId && this.selectedCharacterIds.length === 0 && !this.hoveredCharId) {
          event.preventDefault();
          this.toggleTierCollapse(this.hoveredTierId);
          return;
        }
      }

      // Determine target character(s)
      const hasMulti = this.selectedCharacterIds.length > 0;
      const targetCharId = this.hoveredCharId || this.lastSelectedCharId;

      // ── WASD y Flechas: Desplazamiento y Navegación 2D en el Banco de Operativos ───
      const keyLower = event.key.toLowerCase();
      const isNavKey = ['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(keyLower);
      if (isNavKey && !event.ctrlKey && !event.metaKey) {
        const pool = this.visibleUnassignedCharacters || [];
        const isPoolTarget = this.lastSelectedContext === 'pool'
          || (targetCharId && (this.unassignedCharacters || []).some(c => c.id === targetCharId))
          || (!targetCharId && pool.length > 0);

        if (isPoolTarget && pool.length > 0) {
          event.preventDefault();
          const dirMap = {
            w: 'up', arrowup: 'up',
            s: 'down', arrowdown: 'down',
            a: 'left', arrowleft: 'left',
            d: 'right', arrowright: 'right'
          };
          this.navigatePoolSelection(dirMap[keyLower], event.shiftKey, event.altKey);
          return;
        }
      }

      // Enter o Espacio para asignación rápida si hay Target Tier activo en el banco
      if ((event.key === 'Enter' || event.key === ' ') && this.activeTargetTierId && !event.ctrlKey && !event.metaKey) {
        const pool = this.visibleUnassignedCharacters || [];
        const isPoolTarget = this.lastSelectedContext === 'pool'
          || (targetCharId && (this.unassignedCharacters || []).some(c => c.id === targetCharId));
        if (isPoolTarget && (targetCharId || pool[0])) {
          event.preventDefault();
          const cId = targetCharId || pool[0].id;
          if (hasMulti) {
            this.assignSelectedCharacters(this.activeTargetTierId);
          } else {
            this.assignCharacter(cId, this.activeTargetTierId);
          }
          return;
        }
      }

      if (!hasMulti && !targetCharId) return;

      // 1. Key 0, Backspace, Delete: Unassign (return to pool)
      if (event.key === '0' || event.key === 'Backspace' || event.key === 'Delete') {
        event.preventDefault();
        if (hasMulti) {
          this.unassignSelectedCharacters();
        } else {
          this.unassignCharacter(targetCharId);
        }
        return;
      }

      // 2. Number keys 1-9: map to tiers in order
      const num = parseInt(event.key, 10);
      if (!isNaN(num) && num >= 1 && num <= 9) {
        const tierIndex = num - 1;
        if (tierIndex < this.tiers.length) {
          event.preventDefault();
          const targetTier = this.tiers[tierIndex];
          if (hasMulti) {
            this.assignSelectedCharacters(targetTier.id);
          } else {
            this.assignCharacter(targetCharId, targetTier.id);
          }
          return;
        }
      }

      // 3. Letter keys matching tier labels (e.g. S, A, B, C, D, E, F)
      const keyUpper = event.key.toUpperCase();
      if (keyUpper.length === 1 && keyUpper >= 'A' && keyUpper <= 'Z') {
        const matchedTier = this.tiers.find(t => (t.label || '').trim().toUpperCase() === keyUpper);
        if (matchedTier) {
          event.preventDefault();
          if (hasMulti) {
            this.assignSelectedCharacters(matchedTier.id);
          } else {
            this.assignCharacter(targetCharId, matchedTier.id);
          }
          return;
        }
      }
    },

      });
}
