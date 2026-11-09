/**
 * store/characters.js
 * Alpine.store('characters') — Orquestador modular de gestión de personajes con persistencia Dexie.js (IndexedDB).
 *
 * Módulos desacoplados:
 * - schema.js: Esquemas canónicos, valores iniciales, defaults y validaciones de estructura.
 * - undo.js: Historial de sesión en memoria con pool de deduplicación de imágenes Base64.
 * - folders.js: Gestión de carpetas, agrupación y Drag y Drop.
 * - media.js: Carga de avatares, báneres, fondos, recortes e identidades visuales.
 * - steam.js: Marcos animados de Steam, avatares, vitrina de insignias y estilo de bordes.
 * - submodels.js: Habilidades, Armas, Galería, Relaciones, Facciones, Power-Scaling y Ejes.
 */

import { db, runMigrationIfNecessary } from '../database.js';
import { ls } from '../utils/storage.js';
import { sanitizeCharacterData } from '../utils/textFormatterEngine.js';
import { exportCharacterJSON, exportAllCharactersJSON, exportFolderCharactersJSON, buildFolderJSONString, importCharacterJSON, charToDiscordText, splitIntoDiscordBlocks } from '../utils/exportEngine.js';
import {
  getDefaultPersonalityAxes,
  getDefaultStyle,
  getDefaultVisualSettings,
  createEmptyCharacter,
  getTierRank,
  ensureCharacterDefaults
} from './characters/schema.js';
import { createUndoMethods } from './characters/undo.js';
import { createFolderMethods } from './characters/folders.js';
import { createMediaMethods } from './characters/media.js';
import { createSteamMethods } from './characters/steam.js';
import { createSubmodelMethods } from './characters/submodels.js';
import { createCustomTabMethods } from './characters/customTabs.js';

// Re-exportar funciones de esquema para retrocompatibilidad total con cualquier módulo externo
export {
  getDefaultPersonalityAxes,
  getDefaultStyle,
  getDefaultVisualSettings,
  createEmptyCharacter,
  getTierRank,
  ensureCharacterDefaults
};

// ── Registro del store ───────────────────────────────────────────────────────
export function registerCharactersStore(Alpine) {
  Alpine.store('characters', {
    list: [],               // Array de personajes en memoria
    activeId: null,         // ID del personaje activo
    loading: true,
    renameTarget: null,     // { id, name } para modal de renombre
    deleteTarget: null,     // ID para confirmación de borrado
    deleteCountdown: 0,     // Segundos de protección anti-missclick
    _deleteTimer: null,

    // ── Selección Múltiple y Operaciones en Lote en Dashboard ───────
    selectedIds: [],
    lastSelectedId: null,
    deleteBatchModalOpen: false,
    deleteBatchCountdown: 0,
    _deleteBatchTimer: null,

    // ── Previsualización antes de Importar (JSON Preview Modal) ───────
    jsonPreview: {
      isOpen: false,
      sourceName: '',
      isRoster: false,
      char: null,
      characters: [],
      folders: [],
      exportedAt: null,
      existingMatch: null,
      rawJSON: '',
      showRaw: false,
      copiedRaw: false,
      rosterImportMode: 'merge', // 'merge' | 'replace'
      manualInputOpen: false,
      manualInputText: ''
    },

    // ── Estado de Auto-Guardado Inteligente y Persistencia Reactiva ─────────
    saveStatus: 'saved',    // 'idle' | 'pending' | 'saving' | 'saved' | 'error'
    hasPendingChanges: false,
    lastSavedTime: Date.now(),
    saveError: null,
    _idleSaveTimer: null,
    _autoSaveIntervalTimer: null,
    _isSaving: false,

    // Intervalo de guardado automático: 30000ms (30 segundos por defecto)
    autoSaveIntervalMs: Number(ls.get('superficha_autosave_interval', 30000)) || 30000,
    autoSaveIdleMs: 1200,   // 1.2s de inactividad de escritura para persistir silenciosamente

    get autoSaveIntervalLabel() {
      const ms = this.autoSaveIntervalMs;
      if (ms === 0) return 'Solo Manual';
      if (ms === 15000) return 'Cada 15s';
      if (ms === 30000) return 'Cada 30s';
      if (ms === 60000) return 'Cada 1 min';
      if (ms === 120000) return 'Cada 2 min';
      return `${ms / 1000}s`;
    },

    setAutoSaveInterval(intervalMs) {
      this.autoSaveIntervalMs = Number(intervalMs);
      ls.set('superficha_autosave_interval', intervalMs);
      this.restartAutoSaveInterval();
      const label = this.autoSaveIntervalLabel;
      Alpine.store('app')?.toast(`Intervalo de auto-guardado: ${label}`, 'info');
    },

    restartAutoSaveInterval() {
      if (this._autoSaveIntervalTimer) {
        clearInterval(this._autoSaveIntervalTimer);
        this._autoSaveIntervalTimer = null;
      }
      if (this.autoSaveIntervalMs > 0) {
        this._autoSaveIntervalTimer = setInterval(() => {
          if (this.hasPendingChanges && this.active && !this.active.isLocked && !this._isSaving) {
            // Safety net: persistir durante idle time del navegador si está disponible para no colisionar
            if ('requestIdleCallback' in window) {
              window.requestIdleCallback(() => {
                if (this.hasPendingChanges && this.active && !this.active.isLocked && !this._isSaving) {
                  this._saveActive(false);
                }
              }, { timeout: 2000 });
            } else {
              this._saveActive(false);
            }
          }
        }, this.autoSaveIntervalMs);
      }
    },

    // ── Recordatorio de Backup (7 Días) ──────────────────────────────
    lastJsonExportTimestamp: (() => {
      const stored = ls.get('superficha_last_export_timestamp', null);
      if (stored === null || stored === undefined || stored === '' || stored === 0 || stored === '0') {
        const now = Date.now();
        ls.set('superficha_last_export_timestamp', now);
        return now;
      }
      return Number(stored) || Date.now();
    })(),

    get isBackupRecommended() {
      if (this.list.length === 0) return false;
      if (!this.lastJsonExportTimestamp) return false;
      const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
      return (Date.now() - this.lastJsonExportTimestamp) > SEVEN_DAYS_MS;
    },

    // ── Modo de Vista del Panel de Personajes ('grid' | 'banner') ────
    rosterViewMode: ls.get('superficha_roster_view_mode', 'grid'),

    setRosterViewMode(mode) {
      this.rosterViewMode = mode;
      ls.set('superficha_roster_view_mode', mode);
    },

    // ── Integración de Submódulos Desacoplados ───────────────────────
    ...createUndoMethods(),
    ...createFolderMethods(),
    ...createMediaMethods(),
    ...createSteamMethods(),
    ...createSubmodelMethods(),
    ...createCustomTabMethods(),

    // ── Paginación y Filtros de Lista de Personajes ──────────────────
    itemsPerPage: 9,
    currentPage: 1,
    searchQuery: '',
    tierFilter: 'all',
    classFilter: 'all',
    sortBy: 'updatedAt',

    clearDashboardFilters() {
      this.searchQuery = '';
      this.tierFilter = 'all';
      this.classFilter = 'all';
      this.sortBy = 'updatedAt';
      this.currentPage = 1;
    },

    formatDate(timestamp) {
      if (!timestamp) return 'Reciente';
      try {
        const d = new Date(timestamp);
        return d.toLocaleDateString('es-ES', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      } catch {
        return 'Reciente';
      }
    },

    get availableTiers() {
      const tiers = new Set();
      this.list.forEach(c => {
        if (c.powerScaling?.tier && typeof c.powerScaling.tier === 'string' && c.powerScaling.tier.trim()) {
          tiers.add(c.powerScaling.tier.trim());
        }
      });
      return Array.from(tiers).sort();
    },

    get availableClasses() {
      const classes = new Set();
      this.list.forEach(c => {
        const cls = (c.extras?.fgcStyle || c.extras?.charClass || c.basics?.role || '').trim();
        if (cls) {
          classes.add(cls);
        }
      });
      return Array.from(classes).sort();
    },

    // ── Motor de Búsqueda Transversal Profunda ───────────────────
    getSearchMatch(char, rawQuery) {
      if (!char || !rawQuery || typeof rawQuery !== 'string' || !rawQuery.trim()) {
        return { matched: true, subfieldTag: null };
      }
      const q = rawQuery.toLowerCase().trim();

      // 1. Identidad Principal
      const name = (char.name || '').toLowerCase();
      const fullName = (char.basics?.fullName || '').toLowerCase();
      const alias = (char.basics?.alias || '').toLowerCase();
      const nickname = (char.basics?.nickname || '').toLowerCase();
      const race = (char.basics?.race || '').toLowerCase();
      const role = (char.basics?.role || '').toLowerCase();
      const alignment = (char.basics?.alignment || '').toLowerCase();

      if (name.includes(q) || fullName.includes(q) || alias.includes(q) || nickname.includes(q) || race.includes(q) || role.includes(q) || alignment.includes(q)) {
        return { matched: true, subfieldTag: null };
      }

      // 2. Cuerpo, Biometría y Expresión Física
      const eyes = (char.body?.eyeColor || '').toLowerCase();
      const hair = (char.body?.hairColor || '').toLowerCase();
      const skin = (char.body?.skinColor || '').toLowerCase();
      const height = (char.body?.height || '').toLowerCase();
      const weight = (char.body?.weight || '').toLowerCase();
      const build = (char.body?.build || '').toLowerCase();
      const posture = (char.body?.postureBodyLanguage || '').toLowerCase();
      const scent = (char.body?.scentAroma || '').toLowerCase();
      const face = (char.body?.facialExpression || '').toLowerCase();
      const phenotype = (char.body?.speciesPhenotype || '').toLowerCase();
      const condition = (char.body?.physicalCondition || '').toLowerCase();
      const aura = (char.body?.presenceAura || '').toLowerCase();
      const voice = (char.body?.voice || '').toLowerCase();
      const style = (char.body?.clothingStyle || '').toLowerCase();
      const physDesc = (char.body?.physicalDescription || '').toLowerCase();
      const mods = (char.body?.bodyModifications || '').toLowerCase();
      const accessories = (char.body?.notableAccessories || '').toLowerCase();

      if (eyes.includes(q) || hair.includes(q) || skin.includes(q) || height.includes(q) || weight.includes(q) ||
          build.includes(q) || posture.includes(q) || scent.includes(q) || face.includes(q) || phenotype.includes(q) ||
          condition.includes(q) || aura.includes(q) || voice.includes(q) || style.includes(q) || physDesc.includes(q) ||
          mods.includes(q) || accessories.includes(q)) {
        return { matched: true, subfieldTag: `Cuerpo ➔ Biometría / Apariencia` };
      }

      // 3. Mente, Personalidad y Sanidad
      const mindSummary = (char.mind?.personalitySummary || '').toLowerCase();
      const virtues = (char.mind?.virtues || '').toLowerCase();
      const flaws = (char.mind?.flaws || '').toLowerCase();
      const mbti = (char.mind?.mbti || '').toLowerCase();
      const traumas = (char.mind?.fobiasTraumas || '').toLowerCase();
      const defense = (char.mind?.defenseMechanisms || '').toLowerCase();
      const triggers = (char.mind?.triggers || '').toLowerCase();
      const habits = (char.mind?.habitsCompulsions || '').toLowerCase();
      const sanityStatus = (char.mind?.sanityStatus || '').toLowerCase();
      const sanityNotes = (char.mind?.sanityNotes || '').toLowerCase();
      const sanityAnchor = (char.mind?.sanityAnchor || char.priorities?.sanityAnchor || '').toLowerCase();

      if (mindSummary.includes(q) || virtues.includes(q) || flaws.includes(q) || mbti.includes(q) ||
          traumas.includes(q) || defense.includes(q) || triggers.includes(q) || habits.includes(q) ||
          sanityStatus.includes(q) || sanityNotes.includes(q) || sanityAnchor.includes(q)) {
        return { matched: true, subfieldTag: `Mente ➔ Personalidad y Sanidad` };
      }

      // 4. Social y Relaciones
      const faction = (char.social?.faction || '').toLowerCase();
      const reputation = (char.social?.reputation || '').toLowerCase();
      const originResidencia = (char.social?.originResidencia || '').toLowerCase();
      const titles = (char.social?.titlesEpithets || '').toLowerCase();
      const socialMask = (char.social?.socialMask || '').toLowerCase();
      const lifestyle = (char.social?.lifestyleStandard || '').toLowerCase();
      const commStyle = (char.social?.communicationStyle || '').toLowerCase();
      const rumors = (char.social?.rumorsPublicView || '').toLowerCase();
      const debts = (char.social?.debtsFavors || '').toLowerCase();
      const rivals = (char.social?.rivalsEnemies || '').toLowerCase();
      const dependents = (char.social?.dependents || '').toLowerCase();
      const languages = (char.social?.languages || '').toLowerCase();
      const network = (char.social?.networkInfluence || '').toLowerCase();

      if (faction.includes(q) || reputation.includes(q) || originResidencia.includes(q) || titles.includes(q) ||
          socialMask.includes(q) || lifestyle.includes(q) || commStyle.includes(q) || rumors.includes(q) ||
          debts.includes(q) || rivals.includes(q) || dependents.includes(q) || languages.includes(q) || network.includes(q)) {
        return { matched: true, subfieldTag: `Social ➔ Entorno y Redes` };
      }

      if (Array.isArray(char.social?.relations)) {
        for (const rel of char.social.relations) {
          if ((rel.name || '').toLowerCase().includes(q) || (rel.bondType || '').toLowerCase().includes(q) ||
              (rel.status || '').toLowerCase().includes(q) || (rel.description || '').toLowerCase().includes(q)) {
            return { matched: true, subfieldTag: `Social ➔ Relación: ${rel.name || 'Vínculo'}` };
          }
        }
      }

      if (Array.isArray(char.social?.factions)) {
        for (const fac of char.social.factions) {
          if ((fac.name || '').toLowerCase().includes(q) || (fac.affinity || '').toLowerCase().includes(q)) {
            return { matched: true, subfieldTag: `Social ➔ Facción: ${fac.name || 'Gremio'}` };
          }
        }
      }

      // 5. Creencias y Filosofía
      const moral = (char.beliefs?.moralCode || '').toLowerCase();
      const religion = (char.beliefs?.religion || '').toLowerCase();
      const loves = (char.beliefs?.loves || '').toLowerCase();
      const hates = (char.beliefs?.hates || '').toLowerCase();
      const redLine = (char.beliefs?.redLine || '').toLowerCase();
      const worldview = (char.beliefs?.worldview || '').toLowerCase();
      const superstitions = (char.beliefs?.superstitions || '').toLowerCase();
      const selfImage = (char.beliefs?.selfImage || '').toLowerCase();
      const biases = (char.beliefs?.biasesPrejudices || '').toLowerCase();
      const blindSpots = (char.beliefs?.blindSpots || '').toLowerCase();
      const originEvent = (char.beliefs?.originEvent || '').toLowerCase();
      const authorityStance = (char.beliefs?.authorityStance || '').toLowerCase();
      const statedVsActive = (char.beliefs?.statedVsActive || '').toLowerCase();

      if (moral.includes(q) || religion.includes(q) || loves.includes(q) || hates.includes(q) || redLine.includes(q) ||
          worldview.includes(q) || superstitions.includes(q) || selfImage.includes(q) || biases.includes(q) ||
          blindSpots.includes(q) || originEvent.includes(q) || authorityStance.includes(q) || statedVsActive.includes(q)) {
        return { matched: true, subfieldTag: `Creencias ➔ Filosofía y Moral` };
      }

      // 6. Prioridades y Motivaciones
      const mainGoal = (char.priorities?.mainGoal || '').toLowerCase();
      const greatestFear = (char.priorities?.greatestFear || '').toLowerCase();
      const deepMotivation = (char.priorities?.deepMotivation || '').toLowerCase();
      const currentConflict = (char.priorities?.currentConflict || '').toLowerCase();
      const maxLoyalty = (char.priorities?.maxLoyalty || '').toLowerCase();
      const sacrificeLine = (char.priorities?.sacrificeLine || '').toLowerCase();
      const wantVsNeed = (char.priorities?.wantVsNeed || '').toLowerCase();
      const timeHorizonUrgency = (char.priorities?.timeHorizonUrgency || '').toLowerCase();
      const failureReaction = (char.priorities?.failureReaction || '').toLowerCase();
      const conflictHierarchy = (char.priorities?.conflictHierarchy || '').toLowerCase();
      const victoryFantasy = (char.priorities?.victoryFantasy || '').toLowerCase();

      if (mainGoal.includes(q) || greatestFear.includes(q) || deepMotivation.includes(q) || currentConflict.includes(q) ||
          maxLoyalty.includes(q) || sacrificeLine.includes(q) || wantVsNeed.includes(q) || timeHorizonUrgency.includes(q) ||
          failureReaction.includes(q) || conflictHierarchy.includes(q) || victoryFantasy.includes(q)) {
        return { matched: true, subfieldTag: `Prioridades ➔ Objetivos y Conflictos` };
      }

      if (Array.isArray(char.priorities?.secondaryGoals)) {
        for (const goal of char.priorities.secondaryGoals) {
          if ((goal.text || '').toLowerCase().includes(q)) {
            return { matched: true, subfieldTag: `Prioridades ➔ Meta Secundaria` };
          }
        }
      }

      // 7. Habilidades
      if (Array.isArray(char.skills)) {
        for (const s of char.skills) {
          if ((s.title || '').toLowerCase().includes(q) || (s.summary || '').toLowerCase().includes(q) ||
              (s.effect || '').toLowerCase().includes(q) || (s.condicion || '').toLowerCase().includes(q) ||
              (s.elementType || '').toLowerCase().includes(q) || (s.drawback || '').toLowerCase().includes(q)) {
            return { matched: true, subfieldTag: `Habilidad ➔ ${s.title || 'Poder'}` };
          }
          if (Array.isArray(s.tags) && s.tags.some(t => String(t).toLowerCase().includes(q))) {
            return { matched: true, subfieldTag: `Habilidad ➔ Tag: ${s.title || 'Habilidad'}` };
          }
        }
      }

      // 8. Armas y Artefactos
      if (Array.isArray(char.weapons)) {
        for (const w of char.weapons) {
          if ((w.name || '').toLowerCase().includes(q) || (w.weaponType || '').toLowerCase().includes(q) ||
              (w.properties || '').toLowerCase().includes(q) || (w.lore || '').toLowerCase().includes(q) ||
              (w.damage || '').toLowerCase().includes(q)) {
            return { matched: true, subfieldTag: `Arma ➔ ${w.name || 'Artefacto'}` };
          }
        }
      }

      // 9. Power-Scaling
      if (char.powerScaling) {
        const tier = (char.powerScaling.tier || '').toLowerCase();
        const overall = (char.powerScaling.overallTier || '').toLowerCase();
        const dc = (char.powerScaling.dc || '').toLowerCase();
        const str = (char.powerScaling.strikingStrength || '').toLowerCase();
        const dur = (char.powerScaling.durability || '').toLowerCase();
        const spd = (char.powerScaling.speed || '').toLowerCase();

        if (tier.includes(q) || overall.includes(q) || dc.includes(q) || str.includes(q) || dur.includes(q) || spd.includes(q)) {
          return { matched: true, subfieldTag: `Power-Scaling ➔ Stats` };
        }

        if (Array.isArray(char.powerScaling.feats)) {
          for (const f of char.powerScaling.feats) {
            if ((f.title || '').toLowerCase().includes(q) || (f.context || '').toLowerCase().includes(q)) {
              return { matched: true, subfieldTag: `Power-Scaling ➔ Hazaña: ${f.title || 'Feat'}` };
            }
          }
        }

        if (Array.isArray(char.powerScaling.haxList) && char.powerScaling.haxList.some(h => String(h).toLowerCase().includes(q))) {
          return { matched: true, subfieldTag: `Power-Scaling ➔ Hax` };
        }

        if (Array.isArray(char.powerScaling.resistancesList) && char.powerScaling.resistancesList.some(r => String(r).toLowerCase().includes(q))) {
          return { matched: true, subfieldTag: `Power-Scaling ➔ Resistencia` };
        }
      }

      // 10. Extras y Guía de Rol
      const notes = (char.extras?.roleNotes || '').toLowerCase();
      const backstory = (char.extras?.backstory || '').toLowerCase();
      const fgcStyle = (char.extras?.fgcStyle || '').toLowerCase();
      const charClass = (char.extras?.charClass || '').toLowerCase();
      const curiosities = (char.extras?.curiosities || '').toLowerCase();
      const playlist = (char.extras?.playlist || '').toLowerCase();
      const secondaryLikes = (char.extras?.secondaryLikes || '').toLowerCase();
      const conceptInspirations = (char.extras?.conceptInspirations || '').toLowerCase();
      const narrativeRoleTropes = (char.extras?.narrativeRoleTropes || '').toLowerCase();
      const sentimentalItems = (char.extras?.sentimentalItems || '').toLowerCase();
      const aestheticMoodboard = (char.extras?.aestheticMoodboard || '').toLowerCase();
      const rpDynamicsShips = (char.extras?.rpDynamicsShips || '').toLowerCase();
      const dialogueFormattingStyle = (char.extras?.dialogueFormattingStyle || '').toLowerCase();

      if (notes.includes(q) || backstory.includes(q) || fgcStyle.includes(q) || charClass.includes(q) ||
          curiosities.includes(q) || playlist.includes(q) || secondaryLikes.includes(q) ||
          conceptInspirations.includes(q) || narrativeRoleTropes.includes(q) || sentimentalItems.includes(q) ||
          aestheticMoodboard.includes(q) || rpDynamicsShips.includes(q) || dialogueFormattingStyle.includes(q)) {
        return { matched: true, subfieldTag: `Extras ➔ Inspiración y Guía de Rol` };
      }

      return { matched: false, subfieldTag: null };
    },

    get filteredList() {
      const trimmedQuery = (this.searchQuery || '').trim();
      const activeFolder = this.activeFolderId;
      const tierFilter = this.tierFilter;
      const classFilter = this.classFilter;
      const validFolderIds = (activeFolder === 'unassigned') ? new Set(this.folders.map(f => f.id)) : null;

      const filtered = this.list.filter(c => {
        if (trimmedQuery) {
          const matchResult = this.getSearchMatch(c, trimmedQuery);
          if (!matchResult.matched) return false;
        }

        if (tierFilter && tierFilter !== 'all') {
          const tier = (c.powerScaling?.tier || '').trim();
          if (tier !== tierFilter) return false;
        }

        if (classFilter && classFilter !== 'all') {
          const charClass = (c.extras?.fgcStyle || c.extras?.charClass || c.basics?.role || '').trim();
          if (charClass !== classFilter) return false;
        }

        if (activeFolder && activeFolder !== 'all') {
          if (activeFolder === 'unassigned') {
            if (c.folderId && validFolderIds && validFolderIds.has(c.folderId)) return false;
          } else {
            if (c.folderId !== activeFolder) return false;
          }
        }

        return true;
      });

      return filtered.sort((a, b) => {
        if (this.sortBy === 'favorites') {
          const favA = a.isFavorite ? 1 : 0;
          const favB = b.isFavorite ? 1 : 0;
          if (favA !== favB) return favB - favA;
          const timeA = a.updatedAt || a.createdAt || 0;
          const timeB = b.updatedAt || b.createdAt || 0;
          return timeB - timeA;
        }
        if (this.sortBy === 'name') {
          return (a.name || '').localeCompare(b.name || '');
        }
        if (this.sortBy === 'tier') {
          const rankA = getTierRank(a.powerScaling?.tier);
          const rankB = getTierRank(b.powerScaling?.tier);
          if (rankA !== rankB) return rankA - rankB;
          return (a.name || '').localeCompare(b.name || '');
        }
        const timeA = a.updatedAt || a.createdAt || 0;
        const timeB = b.updatedAt || b.createdAt || 0;
        return timeB - timeA;
      });
    },

    get totalPages() {
      return Math.max(1, Math.ceil(this.filteredList.length / this.itemsPerPage));
    },

    get paginatedList() {
      const start = (this.currentPage - 1) * this.itemsPerPage;
      return this.filteredList.slice(start, start + this.itemsPerPage);
    },

    setPage(page) {
      const p = Math.max(1, Math.min(page, this.totalPages));
      this.currentPage = p;
    },

    nextPage() {
      if (this.currentPage < this.totalPages) {
        this.currentPage++;
      }
    },

    prevPage() {
      if (this.currentPage > 1) {
        this.currentPage--;
      }
    },

    _adjustPaginationAfterDeletion() {
      if (this.currentPage > this.totalPages) {
        this.currentPage = Math.max(1, this.totalPages);
      }
    },

    // ── Getters Principales ──────────────────────────────────────────
    get active() {
      return this.list.find(c => c.id === this.activeId) ?? null;
    },

    get activeFolder() {
      if (!this.activeFolderId || this.activeFolderId === 'all' || this.activeFolderId === 'unassigned') {
        return null;
      }
      return (this.folders || []).find(f => f.id === this.activeFolderId) || null;
    },

    get unassignedCharCount() {
      const validFolderIds = new Set((this.folders || []).map(f => f.id));
      return (this.list || []).filter(c => !c.folderId || !validFolderIds.has(c.folderId)).length;
    },

    get selectedCount() {
      return this.selectedIds?.length || 0;
    },

    get selectedCharacters() {
      const set = new Set(this.selectedIds || []);
      return (this.list || []).filter(c => set.has(c.id));
    },

    // ── Métodos de Selección Múltiple en Dashboard ───────────────────
    isCharacterSelected(id) {
      return (this.selectedIds || []).includes(id);
    },

    toggleSelect(id) {
      if (!id) return;
      if (!Array.isArray(this.selectedIds)) this.selectedIds = [];
      const idx = this.selectedIds.indexOf(id);
      if (idx > -1) {
        this.selectedIds.splice(idx, 1);
      } else {
        this.selectedIds.push(id);
      }
      this.lastSelectedId = id;
    },

    selectCharacter(id) {
      if (!id) return;
      if (!Array.isArray(this.selectedIds)) this.selectedIds = [];
      if (!this.selectedIds.includes(id)) {
        this.selectedIds.push(id);
      }
      this.lastSelectedId = id;
    },

    deselectCharacter(id) {
      if (!id || !Array.isArray(this.selectedIds)) return;
      const idx = this.selectedIds.indexOf(id);
      if (idx > -1) this.selectedIds.splice(idx, 1);
    },

    clearSelection() {
      this.selectedIds = [];
      this.lastSelectedId = null;
    },

    selectAllVisible() {
      const visibleIds = (this.paginatedList || []).map(c => c.id);
      if (!visibleIds.length) return;
      if (!Array.isArray(this.selectedIds)) this.selectedIds = [];
      const set = new Set(this.selectedIds);
      visibleIds.forEach(id => set.add(id));
      this.selectedIds = Array.from(set);
      this.lastSelectedId = visibleIds[visibleIds.length - 1];
    },

    selectRange(charId) {
      if (!charId) return;
      const visibleCards = this.paginatedList || [];
      const list = visibleCards.map(c => c.id);
      if (!list.length) {
        this.toggleSelect(charId);
        return;
      }
      const targetIdx = list.indexOf(charId);
      if (targetIdx === -1) {
        this.toggleSelect(charId);
        return;
      }
      const anchorId = this.lastSelectedId;
      const anchorIdx = anchorId ? list.indexOf(anchorId) : -1;
      if (anchorIdx === -1) {
        this.selectCharacter(charId);
      } else {
        const start = Math.min(anchorIdx, targetIdx);
        const end = Math.max(anchorIdx, targetIdx);
        const slice = list.slice(start, end + 1);
        if (!Array.isArray(this.selectedIds)) this.selectedIds = [];
        const set = new Set(this.selectedIds);
        slice.forEach(id => set.add(id));
        this.selectedIds = Array.from(set);
        this.lastSelectedId = charId;
      }
    },

    handleCardClick(event, charId) {
      if (!charId) return;

      // 1. Shift + Click: Rango continuo
      if (event && event.shiftKey) {
        event.preventDefault();
        event.stopPropagation();
        this.selectRange(charId);
        return;
      }

      // 2. Ctrl / Cmd + Click: Toggle individual
      if (event && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        event.stopPropagation();
        this.toggleSelect(charId);
        return;
      }

      // 3. Si hay selección activa, cualquier clic sobre la tarjeta suma o resta
      if (this.selectedCount > 0) {
        event?.preventDefault?.();
        event?.stopPropagation?.();
        this.toggleSelect(charId);
        return;
      }

      // 4. Clic normal sin selección activa: abre la ficha del personaje
      this.openCharacterSheet(charId);
    },

    async toggleFavoriteSelected() {
      if (!this.selectedCount) return;
      const chars = this.selectedCharacters;
      const allFav = chars.every(c => c.isFavorite);
      for (const c of chars) {
        c.isFavorite = !allFav;
        c.updatedAt = Date.now();
        await this._persist(c);
      }
      Alpine.store('app')?.toast(
        allFav 
          ? `${chars.length} fichas removidas de favoritas` 
          : `${chars.length} fichas marcadas como favoritas ★`, 
        'info'
      );
    },

    exportSelectedJSON() {
      if (!this.selectedCount) return;
      exportAllCharactersJSON(this.selectedCharacters);
      Alpine.store('app')?.toast(`Exportadas ${this.selectedCount} fichas en JSON ✓`, 'success');
    },

    confirmDeleteSelected() {
      if (!this.selectedCount) return;
      this.deleteBatchCountdown = 3;
      this.deleteBatchModalOpen = true;
      if (this._deleteBatchTimer) clearInterval(this._deleteBatchTimer);
      this._deleteBatchTimer = setInterval(() => {
        if (this.deleteBatchCountdown > 0) {
          this.deleteBatchCountdown--;
        } else {
          clearInterval(this._deleteBatchTimer);
          this._deleteBatchTimer = null;
        }
      }, 1000);
    },

    cancelDeleteBatch() {
      this.deleteBatchModalOpen = false;
      this.deleteBatchCountdown = 0;
      if (this._deleteBatchTimer) {
        clearInterval(this._deleteBatchTimer);
        this._deleteBatchTimer = null;
      }
    },

    async executeDeleteSelected() {
      if (this.deleteBatchCountdown > 0) return;
      if (this._deleteBatchTimer) {
        clearInterval(this._deleteBatchTimer);
        this._deleteBatchTimer = null;
      }
      const idsToDelete = [...(this.selectedIds || [])];
      if (!idsToDelete.length) {
        this.deleteBatchModalOpen = false;
        return;
      }
      const count = idsToDelete.length;
      const deleteSet = new Set(idsToDelete);

      this.list = this.list.filter(c => !deleteSet.has(c.id));
      for (const id of idsToDelete) {
        await db.characters.delete(id);
      }

      if (deleteSet.has(this.activeId)) {
        this.activeId = this.list[0]?.id ?? null;
        await db.meta.put({ key: 'activeId', value: this.activeId });
      }

      this.clearSelection();
      this.deleteBatchModalOpen = false;
      this.deleteBatchCountdown = 0;
      this._adjustPaginationAfterDeletion();
      Alpine.store('app')?.toast(`${count} ${count === 1 ? 'ficha eliminada' : 'fichas eliminadas'} correctamente.`, 'error');
    },

    // ── Estilos Dinámicos HUD acordes a la Configuración del Usuario ─
    getMultiselectAccentColor() {
      return Alpine.store('settings')?.accentColor || '#00f0ff';
    },

    getMultiselectRgbChannels() {
      return Alpine.store('settings')?.rgbChannels || '0, 240, 255';
    },

    getMultiselectBarStyle() {
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

    getCharAccentColor(char = null) {
      const globalAccent = Alpine.store('settings')?.accentColor || '#00F0FF';
      const target = char || this.active;
      if (!target) return globalAccent;
      const customColor = target.visualSettings?.accentColor || target.style?.accentColor;
      if (!customColor || customColor === '#00F0FF') {
        return globalAccent;
      }
      return customColor;
    },

    // ── Inicialización (carga desde Dexie.js / IndexedDB) ────────────
    async init() {
      try {
        if (window.__NEEDS_FACTORY_RESET__) {
          await db.characters.clear();
          await db.meta.clear();
          try {
            if (typeof indexedDB !== 'undefined') {
              await indexedDB.deleteDatabase('keyval-store');
            }
          } catch { }
          window.__NEEDS_FACTORY_RESET__ = false;
        } else {
          await runMigrationIfNecessary();
        }

        const chars = await db.characters.toArray();
        let anyCorruptedRepaired = false;
        this.list = [];

        for (const rawChar of chars.filter(Boolean)) {
          const hadCorruptedTokens = sanitizeCharacterData(rawChar);
          const c = this._ensureDefaults(rawChar);
          this.list.push(c);
          if (hadCorruptedTokens) {
            anyCorruptedRepaired = true;
            await this._persist(c);
          }
        }
        this.list.sort((a, b) => a.createdAt - b.createdAt);

        if (anyCorruptedRepaired) {
          console.info('[characters] Auto-reparación completada: Base de datos purgada de tokens residuales.');
        }

        try {
          const parsedBackup = ls.getJSON('superficha_active_char_backup');
          if (parsedBackup && parsedBackup.id && parsedBackup.data) {
            sanitizeCharacterData(parsedBackup.data);
            const exIdx = this.list.findIndex(c => c.id === parsedBackup.id);
            if (exIdx !== -1) {
              if (!this.list[exIdx].updatedAt || (parsedBackup.updatedAt || 0) >= (parsedBackup.updatedAt || 0)) {
                this.list[exIdx] = this._ensureDefaults(parsedBackup.data);
                await this._persist(this.list[exIdx]);
              }
            } else {
              const restored = this._ensureDefaults(parsedBackup.data);
              this.list.push(restored);
              await this._persist(restored);
            }
            ls.remove('superficha_active_char_backup');
          }
        } catch (backupErr) {
          console.warn('[characters] Error restaurando backup sincrónico:', backupErr);
        }

        try {
          const savedFoldersMeta = await db.meta.get('folders');
          let loadedFolders = savedFoldersMeta?.value;
          if (!Array.isArray(loadedFolders)) {
            const lsFolders = ls.getJSON('superficha_folders');
            if (lsFolders) loadedFolders = lsFolders;
          }
          this.folders = Array.isArray(loadedFolders) ? loadedFolders : [];
        } catch (errFolders) {
          console.warn('[characters] Error cargando carpetas:', errFolders);
          this.folders = [];
        }

        if (this.list.length === 0) {
          const initialChar = createEmptyCharacter({ name: 'Nuevo Personaje' });
          this.list = [initialChar];
          this.activeId = initialChar.id;
          await this._persist(initialChar);
          await db.meta.put({ key: 'activeId', value: initialChar.id });
          // Inicializar timestamp de backup en la primera creación para evitar alerta preventiva inmediata
          this.lastJsonExportTimestamp = Date.now();
          ls.set('superficha_last_export_timestamp', this.lastJsonExportTimestamp);
        } else {
          const savedMeta = await db.meta.get('activeId');
          const savedActive = savedMeta?.value;
          if (savedActive && this.list.find(c => c.id === savedActive)) {
            this.activeId = savedActive;
          } else if (this.list.length > 0) {
            this.activeId = this.list[0].id;
          }
        }

        if (this.active) {
          this.syncTabsToApp(this.active);
          this.updateOverallCompletion();
        }
        this.startQuoteRotation();
        this.restartAutoSaveInterval();
        Alpine.store('app')?.restoreNavigationState?.();
      } catch (e) {
        console.error('[characters] Error cargando Dexie.js:', e);
        Alpine.store('app').toast('Error al cargar los personajes.', 'error');
      } finally {
        this.loading = false;
      }
    },

    // ── Restablecer Toda la Aplicación a Estado de Fábrica ───────────
    async factoryResetApp() {
      try {
        if (typeof indexedDB !== 'undefined') {
          await db.characters.clear();
          await db.meta.clear();
          try {
            await indexedDB.deleteDatabase('keyval-store');
          } catch { }
        }

        ls.keys().forEach(k => {
          if (k.startsWith('superficha_') || k === 'activeId' || k.includes('ficha')) {
            ls.remove(k);
          }
        });

        const freshChar = createEmptyCharacter({ name: 'Nuevo Personaje' });
        this.list = [freshChar];
        this.activeId = freshChar.id;
        this.folders = [];
        this.activeFolderId = 'all';
        await this._persist(freshChar);
        await db.meta.put({ key: 'activeId', value: freshChar.id });
        await db.meta.delete('folders');

        const settingsStore = Alpine.store('settings');
        if (settingsStore) {
          settingsStore.accentColor = '#00F0FF';
          settingsStore.fontDisplay = 'Barlow Condensed';
          settingsStore.fontBody = 'Inter Tight';
          settingsStore.fontInput = 'JetBrains Mono';
          settingsStore.fontHud = 'Chakra Petch';
          settingsStore.density = 'normal';
          settingsStore.kitId = '';
          settingsStore.showPlaceholders = true;
          settingsStore.customThemeKits = [];
          settingsStore.dashboardBgMode = 'pattern';
          settingsStore.dashboardBgUrl = '';
          settingsStore.dashboardBgBlur = 0;
          settingsStore.dashboardBgOpacity = 60;
          settingsStore.tierlistBgMode = 'pattern';
          settingsStore.tierlistBgUrl = '';
          settingsStore.tierlistBgBlur = 0;
          settingsStore.tierlistBgOpacity = 60;
          settingsStore.closeModal();
          settingsStore.applySettings();
        }

        const appStore = Alpine.store('app');
        if (appStore) {
          appStore.currentTab = 'basics';
          appStore.editMode = true;
          appStore.showDashboard = false;
          if (typeof appStore.closeAllModals === 'function') {
            appStore.closeAllModals();
          }
          appStore.toast('Programa restablecido a valores de fábrica.', 'success');
        }
      } catch (err) {
        console.error('[characters] Error en factoryResetApp:', err);
      }
    },

    _ensureDefaults(char) {
      return ensureCharacterDefaults(char);
    },

    // ── CRUD de Personajes ──────────────────────────────────────────
    async createNew() {
      const char = createEmptyCharacter();
      this.list.push(char);
      await this._persist(char);
      await this.selectActive(char.id);
      this.setPage(this.totalPages);
      Alpine.store('app').toast(`Personaje "${char.name}" creado.`, 'success');
      Alpine.store('app').openEditorView(char.id);
      return char;
    },

    async duplicate(id) {
      const source = this.list.find(c => c.id === id);
      if (!source) return;
      const copy = createEmptyCharacter({
        ...JSON.parse(JSON.stringify(source)),
        id: crypto.randomUUID(),
        name: `${source.name} (copia)`,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      this.list.push(copy);
      await this._persist(copy);
      this.setPage(this.totalPages);
      Alpine.store('app').toast(`"${copy.name}" creado como copia.`, 'success');
      return copy;
    },

    async rename(id, newName) {
      const char = this.list.find(c => c.id === id);
      if (!char || !newName?.trim()) return;
      char.name = newName.trim();
      char.updatedAt = Date.now();
      await this._persist(char);
      this.renameTarget = null;
      Alpine.store('app').toast(`Renombrado a "${char.name}".`, 'success');
    },

    async toggleFavorite(id) {
      const char = this.list.find(c => c.id === id) || (this.active?.id === id ? this.active : null);
      if (!char) return;
      char.isFavorite = !char.isFavorite;
      char.updatedAt = Date.now();
      await this._persist(char);
      if (this.active && this.active.id === char.id) {
        this.active.isFavorite = char.isFavorite;
      }
      const label = char.isFavorite ? 'marcada como favorita ★' : 'desmarcada de favoritas';
      Alpine.store('app')?.toast(`"${char.name}" ${label}.`, 'info');
    },

    async toggleLocked(id) {
      const char = this.list.find(c => c.id === id) || (this.active?.id === id ? this.active : null);
      if (!char) return;
      char.isLocked = !char.isLocked;
      char.updatedAt = Date.now();
      await this._persist(char);
      if (this.active && this.active.id === char.id) {
        this.active.isLocked = char.isLocked;
        if (char.isLocked) {
          Alpine.store('app').editMode = false;
        }
      }
      const label = char.isLocked ? 'bloqueada contra edición 🔒' : 'desbloqueada para edición 🔓';
      Alpine.store('app')?.toast(`"${char.name}" ${label}.`, char.isLocked ? 'warning' : 'success');
    },

    async confirmDelete(id) {
      this.deleteTarget = id;
      this.deleteCountdown = 5;
      if (this._deleteTimer) {
        clearInterval(this._deleteTimer);
        this._deleteTimer = null;
      }
      this._deleteTimer = setInterval(() => {
        if (this.deleteCountdown > 0) {
          this.deleteCountdown--;
        } else {
          clearInterval(this._deleteTimer);
          this._deleteTimer = null;
        }
      }, 1000);
    },

    cancelDelete() {
      this.deleteTarget = null;
      this.deleteCountdown = 0;
      if (this._deleteTimer) {
        clearInterval(this._deleteTimer);
        this._deleteTimer = null;
      }
    },

    async deleteChar(id) {
      if (this.deleteCountdown > 0) return;
      if (this._deleteTimer) {
        clearInterval(this._deleteTimer);
        this._deleteTimer = null;
      }
      const idx = this.list.findIndex(c => c.id === id);
      if (idx === -1) {
        this.deleteTarget = null;
        return;
      }
      const name = this.list[idx].name;
      this.list.splice(idx, 1);
      await db.characters.delete(id);
      this.deleteTarget = null;
      this.deleteCountdown = 0;

      if (this.activeId === id) {
        this.activeId = this.list[0]?.id ?? null;
        await db.meta.put({ key: 'activeId', value: this.activeId });
      }
      this._adjustPaginationAfterDeletion();
      Alpine.store('app').toast(`"${name}" eliminado.`, 'error');
    },

    async resetCharacter(id) {
      const targetId = id || this.activeId;
      const char = this.list.find(c => c.id === targetId);
      if (!char) return;

      const charName = char.name || char.basics?.fullName || 'Personaje';
      const emptyChar = createEmptyCharacter({
        id: char.id,
        createdAt: char.createdAt,
        name: 'Nuevo Personaje',
      });

      Object.keys(char).forEach(key => delete char[key]);
      Object.assign(char, emptyChar);

      await this._persist(char);

      if (this.activeId === targetId) {
        Alpine.store('app').currentTab = 'basics';
      }

      Alpine.store('app').toast(`"${charName}" ha sido restablecido a estado de fábrica.`, 'warning');
    },

    syncTabsToApp(char = null) {
      const target = char || this.active;
      if (!target) return;
      const appStore = Alpine.store('app');
      if (appStore) {
        if (Array.isArray(target.activeTabs) && target.activeTabs.length > 0) {
          appStore.activeTabs = [...target.activeTabs];
        }
        if (!appStore.activeTabs.includes(appStore.currentTab)) {
          appStore.currentTab = appStore.activeTabs[0] || 'basics';
        }
        appStore.warmupTabs?.();
      }
    },

    async selectActive(id) {
      if (this.hasPendingChanges && this.active) {
        await this._saveActive(false);
      }
      if (!this.list.find(c => c.id === id)) return;
      this.clearTabCompletionCache();

      // Resetear pestañas secundarias cargadas al cambiar de personaje para no re-renderizar 10 pestañas a la vez
      if (this.activeId !== id) {
        const appStore = window.Alpine?.store('app');
        if (appStore) {
          const keepTabs = new Set(['basics']);
          if (appStore.currentTab) keepTabs.add(appStore.currentTab);
          appStore.visitedTabs = Array.from(keepTabs);
        }
      }

      this.activeId = id;
      await db.meta.put({ key: 'activeId', value: id });
      if (this.active) {
        this.syncTabsToApp(this.active);
        this.updateOverallCompletion();
      }
      Alpine.store('app')?.saveNavigationState?.();
    },

    openCharacterSheet(id) {
      if (Alpine.store('app')) {
        Alpine.store('app').isSheetLoading = true;
      }
      this.selectActive(id);
      const char = this.list.find(c => c.id === id);
      if (char?.isLocked) {
        Alpine.store('app').editMode = false;
      }
      Alpine.store('app').openEditorView(id);
    },

    // ── Exportación y Respaldo ───────────────────────────────────────
    exportJSONForChar(charId = null) {
      const idToFind = charId || this.activeId;
      const char = this.list.find(c => c.id === idToFind) || (this.active?.id === idToFind ? this.active : null);
      if (!char) {
        Alpine.store('app').toast('No se encontró el personaje para exportar.', 'warning');
        return;
      }
      exportCharacterJSON(char);
      this.lastJsonExportTimestamp = Date.now();
      ls.set('superficha_last_export_timestamp', this.lastJsonExportTimestamp);
      Alpine.store('app').toast(`Backup de "${char.name}" descargado.`, 'success');
    },

    // ── Indicador de Completitud por Sección y Global (con Caché) ───
    _tabCompletionCache: new Map(),

    clearTabCompletionCache() {
      if (this._tabCompletionCache) {
        this._tabCompletionCache.clear();
      }
    },

    getTabCompletion(tabId, char = null) {
      const target = char || this.active;
      if (!target) return { filled: 0, total: 1, percent: 0 };

      const isTargetActive = (!char || char.id === this.activeId);
      if (isTargetActive && this._tabCompletionCache && this._tabCompletionCache.has(tabId)) {
        return this._tabCompletionCache.get(tabId);
      }

      const isVal = (v) => v !== null && v !== undefined && String(v).trim().length > 0;

      let fields = [];
      switch (tabId) {
        case 'basics':
          fields = [
            isVal(target.basics?.fullName),
            isVal(target.basics?.nickname),
            isVal(target.basics?.race),
            isVal(target.basics?.genderPronouns),
            isVal(target.basics?.realAge),
            isVal(target.basics?.role),
            isVal(target.basics?.alignment) && target.basics.alignment !== 'Neutral Absoluto',
            isVal(target.basics?.avatarDataUrl)
          ];
          break;
        case 'body':
          fields = [
            isVal(target.body?.height) || isVal(target.body?.weight) || isVal(target.body?.build),
            isVal(target.body?.eyeColor) || isVal(target.body?.hairColor) || isVal(target.body?.skinColor),
            isVal(target.body?.postureBodyLanguage) || isVal(target.body?.facialExpression),
            isVal(target.body?.voice) || isVal(target.body?.scentAroma),
            isVal(target.body?.speciesPhenotype),
            isVal(target.body?.physicalCondition) || isVal(target.body?.presenceAura),
            isVal(target.body?.notableAccessories) || isVal(target.body?.bodyModifications),
            isVal(target.body?.clothingStyle) || isVal(target.body?.physicalDescription)
          ];
          break;
        case 'mind':
          fields = [
            isVal(target.mind?.personalitySummary),
            isVal(target.mind?.virtues) || isVal(target.mind?.flaws),
            isVal(target.mind?.fobiasTraumas) || isVal(target.mind?.triggers),
            isVal(target.mind?.defenseMechanisms) || isVal(target.mind?.habitsCompulsions),
            (isVal(target.mind?.sanityStatus) && target.mind.sanityStatus !== 'Estable') || isVal(target.mind?.sanityAnchor),
            isVal(target.mind?.mbti),
            Array.isArray(target.mind?.axes) && target.mind.axes.length > 0
          ];
          break;
        case 'social':
          fields = [
            isVal(target.social?.faction) || isVal(target.social?.reputation),
            isVal(target.social?.socialMask),
            isVal(target.social?.lifestyleStandard),
            isVal(target.social?.communicationStyle),
            isVal(target.social?.rumorsPublicView),
            isVal(target.social?.debtsFavors) || isVal(target.social?.rivalsEnemies),
            isVal(target.social?.languages),
            isVal(target.social?.networkInfluence),
            Array.isArray(target.social?.relations) && target.social.relations.length > 0
          ];
          break;
        case 'beliefs':
          fields = [
            isVal(target.beliefs?.moralCode),
            isVal(target.beliefs?.religion),
            isVal(target.beliefs?.worldview),
            isVal(target.beliefs?.selfImage),
            isVal(target.beliefs?.originEvent),
            isVal(target.beliefs?.authorityStance),
            isVal(target.beliefs?.statedVsActive),
            isVal(target.beliefs?.blindSpots),
            isVal(target.beliefs?.biasesPrejudices),
            isVal(target.beliefs?.redLine),
            isVal(target.beliefs?.loves) || isVal(target.beliefs?.hates)
          ];
          break;
        case 'priorities':
          fields = [
            isVal(target.priorities?.mainGoal),
            isVal(target.priorities?.deepMotivation),
            isVal(target.priorities?.greatestFear),
            isVal(target.priorities?.sacrificeLine) || isVal(target.priorities?.maxLoyalty),
            isVal(target.priorities?.wantVsNeed),
            isVal(target.priorities?.currentConflict) || isVal(target.priorities?.timeHorizonUrgency),
            isVal(target.priorities?.conflictHierarchy) || isVal(target.priorities?.failureReaction),
            Array.isArray(target.priorities?.secondaryGoals) && target.priorities.secondaryGoals.length > 0
          ];
          break;
        case 'skills':
          fields = [
            Array.isArray(target.skills) && target.skills.length > 0,
            Array.isArray(target.skills) && target.skills.some(s => isVal(s.title) && isVal(s.effect)),
            Array.isArray(target.skills) && target.skills.length >= 2
          ];
          break;
        case 'weapons':
          fields = [
            Array.isArray(target.weapons) && target.weapons.length > 0,
            Array.isArray(target.weapons) && target.weapons.some(w => isVal(w.name))
          ];
          break;
        case 'power':
          fields = [
            isVal(target.powerScaling?.tier),
            isVal(target.powerScaling?.strikingStrength),
            isVal(target.powerScaling?.durability),
            isVal(target.powerScaling?.speed)
          ];
          break;
        case 'extras':
          fields = [
            isVal(target.extras?.charClass) || isVal(target.extras?.fgcStyle),
            isVal(target.extras?.conceptInspirations) || isVal(target.extras?.narrativeRoleTropes),
            isVal(target.extras?.sentimentalItems) || isVal(target.extras?.aestheticMoodboard),
            isVal(target.extras?.rpDynamicsShips) || isVal(target.extras?.dialogueFormattingStyle),
            isVal(target.extras?.curiosities) || isVal(target.extras?.secondaryLikes) || isVal(target.extras?.roleNotes),
            isVal(target.extras?.voiceActor) || isVal(target.extras?.playlist) || (Array.isArray(target.extras?.gallery) && target.extras.gallery.length > 0)
          ];
          break;
        case 'steam':
          fields = [
            Boolean(target.basics?.avatarFrame?.url)
          ];
          break;
        default: {
          const ct = target.customTabs?.find(c => c.id === tabId);
          if (ct && Array.isArray(ct.blocks) && ct.blocks.length > 0) {
            fields = ct.blocks.map(b => {
              if (b.type === 'cards' || b.type === 'attributes' || b.type === 'gallery') {
                return Array.isArray(b.items) && b.items.length > 0;
              }
              if (b.type === 'text') {
                return Boolean(b.content && b.content.trim().length > 0);
              }
              return false;
            });
          } else {
            fields = [false];
          }
        }
      }

      const total = fields.length;
      const filled = fields.filter(Boolean).length;
      const percent = Math.round((filled / (total || 1)) * 100);
      const res = { filled, total, percent };
      if (isTargetActive && this._tabCompletionCache) {
        this._tabCompletionCache.set(tabId, res);
      }
      return res;
    },

    overallCompletion: 0,

    updateOverallCompletion(char = null) {
      const target = char || this.active;
      if (!target) {
        this.overallCompletion = 0;
        return 0;
      }

      const appStore = Alpine.store('app');
      const activeTabIds = (appStore?.activeTabs || ['basics', 'body', 'mind', 'social', 'beliefs', 'priorities', 'skills', 'weapons', 'power', 'extras'])
        .filter(id => id !== 'steam');

      let totalCount = 0;
      let filledCount = 0;

      activeTabIds.forEach(tabId => {
        const { filled, total } = this.getTabCompletion(tabId, target);
        filledCount += filled;
        totalCount += total;
      });

      const res = Math.round((filledCount / (totalCount || 1)) * 100);
      if (!char || char.id === this.activeId) {
        this.overallCompletion = res;
      }
      return res;
    },

    getOverallCompletion(char = null) {
      if (char && char.id !== this.activeId) {
        return this.updateOverallCompletion(char);
      }
      if (this.overallCompletion === 0 && this.active) {
        return this.updateOverallCompletion();
      }
      return this.overallCompletion;
    },


    // ── Exportacion JSON (backup individual y masivo) ──────────────────
    exportJSON() {
      if (!this.active) {
        Alpine.store('app').toast('No hay personaje activo para exportar.', 'warning');
        return;
      }
      this._saveActive();
      exportCharacterJSON(this.active);
      this.lastJsonExportTimestamp = Date.now();
      ls.set('superficha_last_export_timestamp', this.lastJsonExportTimestamp);
      Alpine.store('app').toast(`Backup de "${this.active.name}" descargado.`, 'success');
    },

    async exportAllJSON() {
      if (!this.list || this.list.length === 0) {
        Alpine.store('app').toast('No hay personajes en el roster para exportar.', 'warning');
        return;
      }
      if (this.hasPendingChanges && this.active) {
        await this._saveActive(false);
      }
      exportAllCharactersJSON(this.list);
      this.lastJsonExportTimestamp = Date.now();
      ls.set('superficha_last_export_timestamp', this.lastJsonExportTimestamp);
      Alpine.store('app').toast(`Copia de seguridad completa (${this.list.length} personajes) descargada.`, 'success');
    },

    exportFolderJSON(folderId) {
      if (!folderId) return;
      const count = this.getFolderCharCount(folderId);
      const folderName = this.getFolderName(folderId);
      if (count === 0) {
        Alpine.store('app')?.toast(`La carpeta «${folderName}» no contiene personajes para exportar.`, 'warning');
        return;
      }
      this._saveActive();
      exportFolderCharactersJSON(folderId, this.list, this.folders);
      Alpine.store('app')?.toast(`Copia de la carpeta «${folderName}» (${count} fichas) descargada.`, 'success');
    },

    async copyFolderJSONToClipboard(folderId) {
      if (!folderId) return;
      const count = this.getFolderCharCount(folderId);
      const folderName = this.getFolderName(folderId);
      if (count === 0) {
        Alpine.store('app')?.toast(`La carpeta «${folderName}» no contiene personajes para copiar.`, 'warning');
        return;
      }
      this._saveActive();
      const jsonStr = buildFolderJSONString(folderId, this.list, this.folders);
      if (!jsonStr) return;

      try {
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(jsonStr);
        } else {
          const ta = document.createElement('textarea');
          ta.value = jsonStr;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand('copy');
          document.body.removeChild(ta);
        }
        Alpine.store('app')?.toast(`¡JSON de la carpeta «${folderName}» (${count} fichas) copiado al portapapeles!`, 'success');
      } catch (err) {
        console.warn('[characters] Error copiando carpeta al portapapeles:', err);
        Alpine.store('app')?.toast('No se pudo acceder al portapapeles.', 'error');
      }
    },

    // ── Previsualización antes de Importar (JSON Preview) ───────────────
    openImportPreview(result, sourceName = 'Archivo JSON') {
      if (!result) return;
      this.jsonPreview.sourceName = sourceName;
      this.jsonPreview.showRaw = false;
      this.jsonPreview.copiedRaw = false;

      if (result.isRosterBackup && Array.isArray(result.characters)) {
        this.jsonPreview.isRoster = true;
        this.jsonPreview.isFolderBackup = result.subType === 'superficha_folder_backup' || !!result.folder;
        this.jsonPreview.folderInfo = result.folder || null;
        this.jsonPreview.char = null;
        this.jsonPreview.existingMatch = null;
        this.jsonPreview.characters = result.characters;
        this.jsonPreview.folders = result.folders || [];
        this.jsonPreview.exportedAt = result.exportedAt || null;
        this.jsonPreview.rosterImportMode = 'merge';
        this.jsonPreview.rawJSON = JSON.stringify(result, null, 2);
      } else {
        this.jsonPreview.isRoster = false;
        this.jsonPreview.isFolderBackup = false;
        this.jsonPreview.folderInfo = null;
        this.jsonPreview.characters = [];
        this.jsonPreview.folders = [];
        this.jsonPreview.char = result;
        this.jsonPreview.rawJSON = JSON.stringify(result, null, 2);

        // Detectar si ya existe un personaje con el mismo ID o nombre (case-insensitive)
        const norm = (str) => (str || '').trim().toLowerCase();
        const targetName = norm(result.name);
        const match = this.list.find(c => {
          if (result.id && c.id === result.id) return true;
          if (targetName && norm(c.name) === targetName) return true;
          return false;
        });
        this.jsonPreview.existingMatch = match || null;
      }

      this.jsonPreview.isOpen = true;
      if (typeof window !== 'undefined' && window.lucide) {
        setTimeout(() => window.lucide.createIcons(), 60);
      }
    },

    closeImportPreview() {
      this.jsonPreview.isOpen = false;
      this.jsonPreview.isFolderBackup = false;
      this.jsonPreview.folderInfo = null;
      this.jsonPreview.char = null;
      this.jsonPreview.characters = [];
      this.jsonPreview.folders = [];
      this.jsonPreview.existingMatch = null;
      this.jsonPreview.rawJSON = '';
      this.jsonPreview.showRaw = false;
      this.jsonPreview.copiedRaw = false;
    },

    async confirmImportAsNew() {
      if (!this.jsonPreview.char) return;
      try {
        const charData = JSON.parse(JSON.stringify(this.jsonPreview.char));
        delete charData._sourceFile;
        charData.id = crypto.randomUUID();
        charData.createdAt = Date.now();
        charData.updatedAt = Date.now();
        const char = this._ensureDefaults(charData);
        this.list.push(char);
        await this._persist(char);
        await this.selectActive(char.id);
        this.closeImportPreview();
        Alpine.store('app')?.toast(`"${char.name}" se importó como nueva ficha.`, 'success');
        Alpine.store('app')?.closeDashboard?.();
        Alpine.store('settings')?.closeModal?.();
      } catch (e) {
        console.error('[characters] Error importando como nueva ficha:', e);
        Alpine.store('app')?.toast('Error al guardar la nueva ficha.', 'error');
      }
    },

    async confirmImportOverwrite() {
      if (!this.jsonPreview.char || !this.jsonPreview.existingMatch) return;
      try {
        const matchId = this.jsonPreview.existingMatch.id;
        const charData = JSON.parse(JSON.stringify(this.jsonPreview.char));
        charData.id = matchId;
        charData.updatedAt = Date.now();
        const updatedChar = this._ensureDefaults(charData);

        const idx = this.list.findIndex(c => c.id === matchId);
        if (idx !== -1) {
          this.list[idx] = updatedChar;
        }
        await this._persist(updatedChar);
        await this.selectActive(matchId);
        this.closeImportPreview();
        Alpine.store('app')?.toast(`"${updatedChar.name}" fue sobrescrita con los datos del JSON.`, 'success');
        Alpine.store('app')?.closeDashboard?.();
        Alpine.store('settings')?.closeModal?.();
      } catch (e) {
        console.error('[characters] Error sobrescribiendo ficha:', e);
        Alpine.store('app')?.toast('Error al actualizar la ficha.', 'error');
      }
    },

    async confirmImportRoster(mode = 'merge') {
      if (!this.jsonPreview.isRoster || !Array.isArray(this.jsonPreview.characters)) return;
      try {
        if (mode === 'replace') {
          if (typeof indexedDB !== 'undefined') {
            await db.characters.clear();
          }
          this.list = [];
        }

        if (Array.isArray(this.jsonPreview.folders) && this.jsonPreview.folders.length > 0) {
          for (const f of this.jsonPreview.folders) {
            if (!this.folders.some(existing => existing.id === f.id)) {
              this.folders.push(f);
            }
          }
          await this.saveFolders();
        }

        let count = 0;
        let lastImportedId = null;
        for (const rawChar of this.jsonPreview.characters) {
          const charData = JSON.parse(JSON.stringify(rawChar));
          delete charData._sourceFile;
          if (mode === 'merge') {
            charData.id = crypto.randomUUID();
          } else {
            charData.id = charData.id || crypto.randomUUID();
          }
          charData.createdAt = charData.createdAt || Date.now();
          charData.updatedAt = Date.now();
          const char = this._ensureDefaults(charData);
          this.list.push(char);
          await this._persist(char);
          lastImportedId = char.id;
          count++;
        }

        if (lastImportedId) {
          await this.selectActive(lastImportedId);
        }

        this.closeImportPreview();
        Alpine.store('app')?.toast(`Respaldo de Roster importado: ${count} personajes añadidos.`, 'success');
        Alpine.store('app')?.closeDashboard?.();
        Alpine.store('settings')?.closeModal?.();
      } catch (e) {
        console.error('[characters] Error importando paquete de roster:', e);
        Alpine.store('app')?.toast('Error al importar el respaldo de roster.', 'error');
      }
    },

    async copyPreviewRawJSON() {
      if (!this.jsonPreview.rawJSON) return;
      try {
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(this.jsonPreview.rawJSON);
        } else {
          const ta = document.createElement('textarea');
          ta.value = this.jsonPreview.rawJSON;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand('copy');
          document.body.removeChild(ta);
        }
        this.jsonPreview.copiedRaw = true;
        setTimeout(() => { this.jsonPreview.copiedRaw = false; }, 2000);
        Alpine.store('app')?.toast('Código JSON copiado al portapapeles.', 'success');
      } catch {
        Alpine.store('app')?.toast('No se pudo copiar el texto.', 'error');
      }
    },

    async copyActiveJSONToClipboard() {
      if (!this.active) {
        Alpine.store('app')?.toast('No hay personaje activo para copiar.', 'warning');
        return;
      }
      this._saveActive();
      const rawChar = (typeof window !== 'undefined' && window.Alpine?.raw)
        ? window.Alpine.raw(this.active)
        : this.active;
      const data = JSON.parse(JSON.stringify(rawChar));
      if (this.active.powerScaling) {
        const rawPS = (typeof window !== 'undefined' && window.Alpine?.raw)
          ? window.Alpine.raw(this.active.powerScaling)
          : this.active.powerScaling;
        data.powerScaling = JSON.parse(JSON.stringify(rawPS));
      }
      const jsonStr = JSON.stringify(data, null, 2);
      try {
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(jsonStr);
        } else {
          const ta = document.createElement('textarea');
          ta.value = jsonStr;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand('copy');
          document.body.removeChild(ta);
        }
        Alpine.store('app')?.toast(`¡JSON de "${this.active.name}" copiado al portapapeles!`, 'success');
      } catch (err) {
        console.warn('[characters] Error copiando JSON activo:', err);
        Alpine.store('app')?.toast('No se pudo copiar al portapapeles.', 'error');
      }
    },

    async pasteJSONFromClipboard() {
      try {
        let text = '';
        if (navigator.clipboard?.readText) {
          text = await navigator.clipboard.readText();
        }
        if (!text || !text.trim()) {
          Alpine.store('app')?.toast('El portapapeles no contiene texto legible.', 'warning');
          this.jsonPreview.manualInputOpen = true;
          return;
        }
        const result = await importCharacterJSON(text.trim());
        this.openImportPreview(result, 'Portapapeles');
      } catch (err) {
        console.warn('[characters] Error leyendo portapapeles:', err);
        this.jsonPreview.manualInputOpen = true;
        Alpine.store('app')?.toast('Pega el código JSON en el campo manual.', 'info');
      }
    },

    async processManualJSONInput() {
      const text = this.jsonPreview.manualInputText;
      if (!text || !text.trim()) {
        Alpine.store('app')?.toast('Por favor introduce un texto o JSON válido.', 'warning');
        return;
      }
      try {
        const result = await importCharacterJSON(text.trim());
        this.jsonPreview.manualInputText = '';
        this.jsonPreview.manualInputOpen = false;
        this.openImportPreview(result, 'Entrada Manual');
      } catch (err) {
        Alpine.store('app')?.toast(err.message || 'JSON inválido.', 'error');
      }
    },

    async handleJSONDrop(event) {
      event.preventDefault();
      const rawFiles = event.dataTransfer?.files;
      if (rawFiles && rawFiles.length > 0) {
        // Filtrar archivos con extensión .json o MIME application/json
        const jsonFiles = Array.from(rawFiles).filter(f => {
          const name = (f.name || '').toLowerCase();
          return name.endsWith('.json') || f.type === 'application/json' || f.type === '';
        });

        if (jsonFiles.length === 0) {
          Alpine.store('app')?.toast('Por favor arrastra archivos válidos con extensión .json.', 'warning');
          return;
        }

        // ── CASO A: Se arrastra 1 solo archivo ──────────────────────────────
        if (jsonFiles.length === 1) {
          const file = jsonFiles[0];
          try {
            const result = await importCharacterJSON(file);
            // Si el archivo contiene múltiples personajes internamente (ej. un array o paquete de roster)
            if (result && result.isRosterBackup && Array.isArray(result.characters)) {
              result.characters.forEach(c => {
                c._sourceFile = file.name;
              });
              this.openImportPreview(result, `${file.name} (${result.characters.length} personajes)`);
            } else if (result) {
              result._sourceFile = file.name;
              this.openImportPreview(result, file.name);
            }
          } catch (e) {
            Alpine.store('app')?.toast(e.message || 'Error al procesar el archivo arrastrado.', 'error');
          }
          return;
        }

        // ── CASO B: Se arrastran 2 o más archivos JSON separados a la vez ───
        const allChars = [];
        const allFolders = [];
        const processedFileNames = [];
        const failedFiles = [];

        for (const file of jsonFiles) {
          try {
            const result = await importCharacterJSON(file);
            processedFileNames.push(file.name);

            if (result && result.isRosterBackup && Array.isArray(result.characters)) {
              result.characters.forEach(c => {
                c._sourceFile = file.name;
                allChars.push(c);
              });
              if (Array.isArray(result.folders)) {
                allFolders.push(...result.folders);
              }
            } else if (result) {
              result._sourceFile = file.name;
              allChars.push(result);
            }
          } catch (fileErr) {
            console.warn(`[characters] Error al leer archivo ${file.name}:`, fileErr);
            failedFiles.push(file.name);
          }
        }

        if (allChars.length === 0) {
          Alpine.store('app')?.toast('Ninguno de los archivos arrastrados contiene información válida de personajes.', 'error');
          return;
        }

        if (failedFiles.length > 0) {
          Alpine.store('app')?.toast(`Se ignoraron ${failedFiles.length} archivo(s) no compatibles.`, 'warning');
        }

        // Si los archivos procesados en conjunto sumaron solo 1 personaje
        if (allChars.length === 1) {
          this.openImportPreview(allChars[0], processedFileNames[0] || 'Archivo JSON');
          return;
        }

        // Múltiples personajes provenientes de múltiples archivos separados
        const aggregatedRoster = {
          isRosterBackup: true,
          subType: 'superficha_multi_file_drop',
          totalCharacters: allChars.length,
          characters: allChars,
          folders: allFolders,
          sourceFiles: processedFileNames,
          exportedAt: Date.now()
        };

        this.openImportPreview(
          aggregatedRoster,
          `${processedFileNames.length} archivos JSON (${allChars.length} personajes)`
        );
        return;
      }

      // Soporte para texto plano arrastrado que contenga código JSON
      const text = event.dataTransfer?.getData('text');
      if (text && text.trim()) {
        try {
          const result = await importCharacterJSON(text.trim());
          this.openImportPreview(result, 'Texto Arrastrado');
        } catch (e) {
          Alpine.store('app')?.toast(e.message || 'El texto arrastrado no es un JSON válido.', 'error');
        }
      }
    },

    async importJSON(eventOrFile) {
      let file = null;
      let sourceName = 'Archivo JSON';
      if (eventOrFile instanceof File) {
        file = eventOrFile;
        sourceName = file.name;
      } else if (eventOrFile?.target?.files?.[0]) {
        file = eventOrFile.target.files[0];
        sourceName = file.name;
      }
      if (!file) return;

      try {
        const result = await importCharacterJSON(file);
        this.openImportPreview(result, sourceName);
      } catch (e) {
        Alpine.store('app')?.toast(e.message || 'Error al importar el archivo.', 'error');
      }

      if (eventOrFile?.target && 'value' in eventOrFile.target) {
        eventOrFile.target.value = '';
      }
    },

    triggerJSONImport() {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json,application/json';
      input.onchange = (e) => this.importJSON(e);
      input.click();
    },

    buildDiscordExport() {
      if (!this.active) {
        Alpine.store('app').toast('No hay personaje activo para exportar.', 'warning');
        return;
      }
      Alpine.store('app').openDiscordModal();
    },

    // ── Auto-guardado Inteligente por Intervalos y Inactividad ─────────
    scheduleAutoSave() {
      if (this.active?.isLocked) {
        return;
      }
      this.clearTabCompletionCache();
      this.hasPendingChanges = true;
      if (this.saveStatus !== 'pending' && this.saveStatus !== 'saving') {
        this.saveStatus = 'pending';
      }

      if (this._idleSaveTimer) {
        clearTimeout(this._idleSaveTimer);
        this._idleSaveTimer = null;
      }
      if (this.autoSaveIntervalMs > 0) {
        this._idleSaveTimer = setTimeout(() => {
          if (this.hasPendingChanges && this.active && !this.active.isLocked && !this._isSaving) {
            this._saveActive(false);
          }
        }, this.autoSaveIdleMs);
      }
    },

    async forceSave() {
      if (this.active?.isLocked) {
        Alpine.store('app')?.toast('Ficha bloqueada: Desbloquéala desde el candado para guardar cambios.', 'warning');
        return;
      }
      if (this._idleSaveTimer) {
        clearTimeout(this._idleSaveTimer);
        this._idleSaveTimer = null;
      }
      await this._saveActive(true);
    },

    saveIfPendingSync() {
      if (this.hasPendingChanges && this.active && !this.active.isLocked) {
        try {
          this.active.updatedAt = Date.now();
          const raw = window.Alpine?.raw ? window.Alpine.raw(this.active) : this.active;
          const str = JSON.stringify(raw);
          // Solo respaldar en localStorage si el payload es liviano (<1MB) para prevenir QuotaExceededError
          if (str.length < 1000000) {
            ls.setJSON('superficha_active_char_backup', {
              id: this.active.id,
              updatedAt: this.active.updatedAt,
              data: raw
            });
          }
        } catch (_) {
          // Fallback silencioso; IndexedDB es la fuente de verdad primaria
        }
      }
    },

    async saveIfPending() {
      if (this.hasPendingChanges && this.active && !this.active.isLocked && !this._isSaving) {
        await this._saveActive(false);
      }
    },

    async _saveActive(notifySuccess = false) {
      if (this._isSaving) return;
      const char = this.active;
      if (!char) return;
      if (char.isLocked) {
        if (notifySuccess) {
          Alpine.store('app')?.toast('Ficha protegida contra edición.', 'warning');
        }
        return;
      }

      // Cancelar cualquier temporizador de idle pendiente ya que estamos guardando en este instante
      if (this._idleSaveTimer) {
        clearTimeout(this._idleSaveTimer);
        this._idleSaveTimer = null;
      }

      this._isSaving = true;
      this.saveStatus = 'saving';
      try {
        char.updatedAt = Date.now();
        await this._persist(char);
        ls.remove('superficha_active_char_backup');
        this.hasPendingChanges = false;
        this.saveStatus = 'saved';
        this.lastSavedTime = Date.now();
        this.saveError = null;
        this.updateOverallCompletion();
        if (notifySuccess) {
          Alpine.store('app')?.toast('Ficha guardada manualmente ✓', 'success');
        }
      } catch (e) {
        console.error('[characters] Error en auto-guardado:', e);
        this.saveStatus = 'error';
        this.saveError = e.message || 'Error de persistencia';
        Alpine.store('app')?.toast('Error al guardar datos. Haz clic para reintentar.', 'error', {
          label: 'REINTENTAR',
          onClick: () => this.forceSave()
        });
      } finally {
        this._isSaving = false;
      }
    },

    async _persist(char) {
      if (!char) return;
      let clone;
      try {
        const raw = window.Alpine?.raw ? window.Alpine.raw(char) : char;
        clone = JSON.parse(JSON.stringify(raw));
      } catch (cloneErr) {
        try {
          clone = JSON.parse(JSON.stringify(char));
        } catch (jsonErr) {
          console.error('[characters] Error de serialización al persistir ficha:', cloneErr, jsonErr);
          throw cloneErr;
        }
      }
      await db.characters.put(clone);
    }
  });
}
