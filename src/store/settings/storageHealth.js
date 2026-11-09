/**
 * store/settings/storageHealth.js
 * Auditoría, telemetría en vivo y optimización del almacenamiento (IndexedDB / Caché).
 * Monitorea cuota en disco, persistencia (navigator.storage.persist), escaneo de activos pesados y purgado seguro.
 */

import { db } from '../../database.js';

export const APP_STORAGE_SAFETY_LIMIT_GB = 30; // Tope de seguridad establecido para la aplicación (30 GB)
export const APP_STORAGE_SAFETY_LIMIT_BYTES = APP_STORAGE_SAFETY_LIMIT_GB * 1024 * 1024 * 1024;

export function createStorageHealthMethods() {
  return {
    storageLoading: false,
    storageUsageBytes: 0,
    storageQuotaBytes: APP_STORAGE_SAFETY_LIMIT_BYTES,
    storageUsageMB: '0.0',
    storageQuotaGB: '30.0',
    storageSystemQuotaGB: '0.0',
    storagePercentage: 0,
    storageIsPersisted: false,
    storagePersistenceSupported: typeof navigator !== 'undefined' && Boolean(navigator.storage && navigator.storage.persist),
    isCleaningStorage: false,
    storageTelemetryExpanded: true,
    heavyScannerExpanded: false,

    storageBreakdown: {
      rosterBytes: 0,
      rosterCount: 0,
      tierlistBytes: 0,
      tierlistGuestsCount: 0,
      tierlistTemplatesCount: 0,
      emojisBytes: 0,
      backgroundsBytes: 0,
      localStorageBytes: 0,
      metaBytes: 0,
      systemOverheadBytes: 0
    },

    heavyAssets: [],

    // ── 1. Telemetría en Vivo de Cuota del Navegador ──────────────────────────
    async refreshStorageTelemetry() {
      this.storageLoading = true;
      try {
        if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
          const estimate = await navigator.storage.estimate();
          const usage = estimate.usage || 0;
          const rawSystemQuota = estimate.quota || 0;

          // El navegador reporta toda la capacidad libre del disco (~500 GB).
          // Establecemos un tope de seguridad estricto de 30 GB para proteger el disco del usuario.
          const effectiveQuota = Math.min(rawSystemQuota > 0 ? rawSystemQuota : APP_STORAGE_SAFETY_LIMIT_BYTES, APP_STORAGE_SAFETY_LIMIT_BYTES);

          this.storageUsageBytes = usage;
          this.storageQuotaBytes = effectiveQuota;
          this.storageSystemQuotaGB = rawSystemQuota > 0 ? (rawSystemQuota / (1024 * 1024 * 1024)).toFixed(1) : '0.0';
          this.storageUsageMB = (usage / (1024 * 1024)).toFixed(1);
          this.storageQuotaGB = (effectiveQuota / (1024 * 1024 * 1024)).toFixed(1);
          this.storagePercentage = effectiveQuota > 0 ? Math.min(100, Number(((usage / effectiveQuota) * 100).toFixed(2))) : 0;
        }

        if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persisted) {
          this.storageIsPersisted = await navigator.storage.persisted();
        }

        await this.scanStorageBreakdown();
      } catch (err) {
        console.warn('[storageHealth] Error al obtener telemetría de almacenamiento:', err);
      } finally {
        this.storageLoading = false;
        setTimeout(() => window.lucide?.createIcons?.(), 50);
      }
    },

    // ── 2. Solicitar Blindaje Permanente de Datos ────────────────────────────
    async requestPersistence() {
      if (typeof navigator === 'undefined' || !navigator.storage || !navigator.storage.persist) {
        window.Alpine?.store('app')?.toast('Tu navegador no soporta la API de persistencia.', 'warning');
        return;
      }
      try {
        const granted = await navigator.storage.persist();
        this.storageIsPersisted = granted;
        if (granted) {
          window.Alpine?.store('app')?.toast('¡Almacenamiento Blindado! El navegador jamás limpiará tus fichas automáticamente.', 'success');
        } else {
          window.Alpine?.store('app')?.toast('El navegador mantuvo la persistencia estándar. (Recomendación: añade la página a favoritos para mayor prioridad).', 'info');
        }
      } catch (err) {
        console.error('[storageHealth] Error solicitando persistencia:', err);
      }
    },

    // ── 3. Escáner de Desglose y "Vampiros de Memoria" ────────────────────────
    async scanStorageBreakdown() {
      const breakdown = {
        rosterBytes: 0,
        rosterCount: 0,
        tierlistBytes: 0,
        tierlistGuestsCount: 0,
        tierlistTemplatesCount: 0,
        emojisBytes: 0,
        backgroundsBytes: 0,
        localStorageBytes: 0
      };

      const assets = [];

      const estimateStringBytes = (str) => {
        if (!str || typeof str !== 'string') return 0;
        return str.length;
      };

      // A. Medir Personajes en Dexie
      try {
        if (db && db.characters) {
          const chars = await db.characters.toArray();
          breakdown.rosterCount = chars.length;

          chars.forEach(c => {
            let charBytes = 0;
            // Avatar
            const avatarUrl = c.basics?.avatarDataUrl;
            if (avatarUrl && avatarUrl.startsWith('data:')) {
              const b = estimateStringBytes(avatarUrl);
              charBytes += b;
              if (b > 1024 * 1024) { // > 1MB
                const isGif = avatarUrl.startsWith('data:image/gif') || Boolean(c.basics?.avatarTransform?.includes('scale'));
                assets.push({
                  id: `char_av_${c.id}`,
                  name: `Avatar ${isGif ? 'GIF' : 'PFP'} // ${c.name || 'Sin nombre'}`,
                  type: isGif ? 'avatar_gif' : 'avatar_img',
                  typeLabel: isGif ? 'GIF Animado' : 'Imagen PFP',
                  context: `Ficha: ${c.name || 'Operativo'}`,
                  sizeBytes: b,
                  sizeFormatted: `${(b / (1024 * 1024)).toFixed(1)} MB`,
                  severity: b > 10 * 1024 * 1024 ? 'danger' : (b > 3 * 1024 * 1024 ? 'warning' : 'normal'),
                  actionType: 'view_char',
                  targetId: c.id
                });
              }
            }

            // Banner
            const bannerUrl = c.basics?.bannerDataUrl;
            if (bannerUrl && bannerUrl.startsWith('data:')) {
              const b = estimateStringBytes(bannerUrl);
              charBytes += b;
              if (b > 2 * 1024 * 1024) {
                assets.push({
                  id: `char_bn_${c.id}`,
                  name: `Báner // ${c.name || 'Sin nombre'}`,
                  type: 'banner',
                  typeLabel: 'Báner de Ficha',
                  context: `Ficha: ${c.name || 'Operativo'}`,
                  sizeBytes: b,
                  sizeFormatted: `${(b / (1024 * 1024)).toFixed(1)} MB`,
                  severity: b > 8 * 1024 * 1024 ? 'danger' : 'warning',
                  actionType: 'view_char',
                  targetId: c.id
                });
              }
            }

            // Galería y Armamento
            if (Array.isArray(c.gallery)) {
              c.gallery.forEach((g, gIdx) => {
                if (g?.url && g.url.startsWith('data:')) {
                  const gb = estimateStringBytes(g.url);
                  charBytes += gb;
                  if (gb > 2 * 1024 * 1024) {
                    assets.push({
                      id: `char_gal_${c.id}_${gIdx}`,
                      name: `Galería (${g.title || 'Foto ' + (gIdx + 1)}) // ${c.name || 'Ficha'}`,
                      type: 'gallery',
                      typeLabel: 'Foto de Galería',
                      context: `Ficha: ${c.name || 'Operativo'}`,
                      sizeBytes: gb,
                      sizeFormatted: `${(gb / (1024 * 1024)).toFixed(1)} MB`,
                      severity: gb > 8 * 1024 * 1024 ? 'danger' : 'warning',
                      actionType: 'view_char',
                      targetId: c.id
                    });
                  }
                }
              });
            }

            // Considerar tamaño real completo de la ficha serializada en BD (JSON nativo)
            try {
              const fullCharJson = JSON.stringify(c);
              if (fullCharJson) {
                charBytes = Math.max(charBytes, fullCharJson.length);
              }
            } catch (_) {}

            breakdown.rosterBytes += charBytes;
          });
        }
      } catch (e) {
        console.warn('[storageHealth] Error auditando personajes:', e);
      }

      // B. Medir Tier Lists en Dexie
      try {
        if (db && db.meta) {
          const tlEntry = await db.meta.get('wimsf_tierlist_state_v1');
          if (tlEntry && tlEntry.data) {
            const tl = tlEntry.data;
            let tlBytes = 0;

            // Invitados manuales
            if (Array.isArray(tl.guestCharacters)) {
              breakdown.tierlistGuestsCount = tl.guestCharacters.length;
              tl.guestCharacters.forEach(g => {
                const av = g.basics?.avatarDataUrl;
                if (av && av.startsWith('data:')) {
                  const b = estimateStringBytes(av);
                  tlBytes += b;
                  if (b > 1024 * 1024) {
                    const isGif = av.startsWith('data:image/gif') || Boolean(g.basics?.avatarTransform);
                    assets.push({
                      id: `tl_guest_${g.id}`,
                      name: `Invitado (${g.name || 'Sin Nombre'})`,
                      type: isGif ? 'avatar_gif' : 'tierlist_guest',
                      typeLabel: isGif ? 'GIF Invitado' : 'Token Invitado',
                      context: 'Tier List (Operativo sin ficha)',
                      sizeBytes: b,
                      sizeFormatted: `${(b / (1024 * 1024)).toFixed(1)} MB`,
                      severity: b > 10 * 1024 * 1024 ? 'danger' : (b > 3 * 1024 * 1024 ? 'warning' : 'normal'),
                      actionType: 'edit_guest',
                      targetId: g.id
                    });
                  }
                }
              });
            }

            // Personajes de plantilla
            let tmCount = 0;
            if (Array.isArray(tl.lists)) {
              tl.lists.forEach(l => {
                if (Array.isArray(l.templateCharacters)) {
                  tmCount += l.templateCharacters.length;
                  l.templateCharacters.forEach(tc => {
                    const av = tc.basics?.avatarDataUrl;
                    if (av && av.startsWith('data:')) {
                      const b = estimateStringBytes(av);
                      tlBytes += b;
                      if (b > 1.5 * 1024 * 1024) {
                        assets.push({
                          id: `tl_template_${tc.id}`,
                          name: `Plantilla (${tc.name || 'Token'})`,
                          type: 'tierlist_template',
                          typeLabel: 'Token de Plantilla',
                          context: `Lista: ${l.title || 'Tier List'}`,
                          sizeBytes: b,
                          sizeFormatted: `${(b / (1024 * 1024)).toFixed(1)} MB`,
                          severity: b > 8 * 1024 * 1024 ? 'danger' : 'warning',
                          actionType: 'none',
                          targetId: tc.id
                        });
                      }
                    }
                  });
                }
              });
            }
            breakdown.tierlistTemplatesCount = tmCount;

            // Considerar tamaño real completo del estado serializado de la Tier List (388 tokens, listas, notas, filas)
            try {
              const fullTlJson = JSON.stringify(tl);
              if (fullTlJson) {
                tlBytes = Math.max(tlBytes, fullTlJson.length);
              }
            } catch (_) {}

            breakdown.tierlistBytes = tlBytes;
          }

          // Medir otros metadatos en IndexedDB (preferencias, flags, activeId)
          try {
            const allMeta = await db.meta.toArray();
            let mBytes = 0;
            allMeta.forEach(m => {
              if (m.key !== 'wimsf_tierlist_state_v1') {
                try {
                  const s = JSON.stringify(m);
                  if (s) mBytes += s.length;
                } catch (_) {}
              }
            });
            breakdown.metaBytes = mBytes;
          } catch (_) {}
        }
      } catch (e) {
        console.warn('[storageHealth] Error auditando tier lists:', e);
      }

      // C. Medir Emojis Personalizados
      try {
        const emojisStore = window.Alpine?.store('customEmojis');
        if (emojisStore && Array.isArray(emojisStore.list)) {
          let emBytes = 0;
          emojisStore.list.forEach(em => {
            if (em.dataUrl && em.dataUrl.startsWith('data:')) {
              const b = estimateStringBytes(em.dataUrl);
              emBytes += b;
              if (b > 500 * 1024) { // > 500 KB para un emoji es pesado
                assets.push({
                  id: `emoji_${em.id}`,
                  name: `:${em.name || 'emoji'}:`,
                  type: 'emoji',
                  typeLabel: 'Emoji Custom',
                  context: 'Biblioteca de Emojis',
                  sizeBytes: b,
                  sizeFormatted: `${(b / (1024 * 1024)).toFixed(2)} MB`,
                  severity: b > 1.5 * 1024 * 1024 ? 'danger' : 'warning',
                  actionType: 'none',
                  targetId: em.id
                });
              }
            }
          });
          breakdown.emojisBytes = emBytes;
        }
      } catch (e) {
        console.warn('[storageHealth] Error auditando emojis:', e);
      }

      // D. Medir Fondos de Pantalla
      try {
        let bgBytes = 0;
        if (this.dashboardBgUrl && this.dashboardBgUrl.startsWith('data:')) {
          const b = estimateStringBytes(this.dashboardBgUrl);
          bgBytes += b;
          if (b > 1.5 * 1024 * 1024) {
            assets.push({
              id: 'bg_dashboard',
              name: 'Fondo del Panel Principal',
              type: 'background',
              typeLabel: 'Wallpaper Custom',
              context: 'Ajustes > Entorno',
              sizeBytes: b,
              sizeFormatted: `${(b / (1024 * 1024)).toFixed(1)} MB`,
              severity: b > 8 * 1024 * 1024 ? 'danger' : 'warning',
              actionType: 'reset_bg',
              targetId: 'dashboard'
            });
          }
        }
        if (this.tierlistBgUrl && this.tierlistBgUrl.startsWith('data:')) {
          const b = estimateStringBytes(this.tierlistBgUrl);
          bgBytes += b;
          if (b > 1.5 * 1024 * 1024) {
            assets.push({
              id: 'bg_tierlist',
              name: 'Fondo del Tablero Tier List',
              type: 'background',
              typeLabel: 'Wallpaper Tier List',
              context: 'Ajustes > Entorno',
              sizeBytes: b,
              sizeFormatted: `${(b / (1024 * 1024)).toFixed(1)} MB`,
              severity: b > 8 * 1024 * 1024 ? 'danger' : 'warning',
              actionType: 'reset_bg',
              targetId: 'tierlist'
            });
          }
        }
        breakdown.backgroundsBytes = bgBytes;
      } catch (e) {
        console.warn('[storageHealth] Error auditando fondos:', e);
      }

      // E. Medir localStorage
      try {
        if (typeof localStorage !== 'undefined') {
          let lsBytes = 0;
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            const val = localStorage.getItem(key);
            lsBytes += ((key?.length || 0) + (val?.length || 0)) * 2;
          }
          breakdown.localStorageBytes = lsBytes;
        }
      } catch (e) {
        console.warn('[storageHealth] Error auditando localStorage:', e);
      }

      // Calcular huella del motor IndexedDB (archivos SST de LevelDB/SQLite, diarios WAL y Caché de origen)
      const measuredContentBytes = (breakdown.rosterBytes || 0) +
        (breakdown.tierlistBytes || 0) +
        (breakdown.emojisBytes || 0) +
        (breakdown.backgroundsBytes || 0) +
        (breakdown.metaBytes || 0) +
        (breakdown.localStorageBytes || 0);

      breakdown.systemOverheadBytes = Math.max(0, this.storageUsageBytes - measuredContentBytes);

      this.storageBreakdown = breakdown;

      // Ordenar activos pesados de mayor a menor y tomar los más relevantes
      this.heavyAssets = assets.sort((a, b) => b.sizeBytes - a.sizeBytes).slice(0, 15);
    },

    // ── 4. Protocolo de Limpieza y Mantenimiento Seguro ──────────────────────
    async runStorageCleanup() {
      if (this.isCleaningStorage) return;
      this.isCleaningStorage = true;
      let cleanedItemsCount = 0;

      try {
        // 0. Depurar bases de datos legacy huérfanas en el navegador (ej: keyval-store antigua)
        if (typeof indexedDB !== 'undefined' && typeof indexedDB.databases === 'function') {
          try {
            const dbs = await indexedDB.databases();
            for (const d of dbs) {
              if (d && d.name === 'keyval-store') {
                indexedDB.deleteDatabase('keyval-store');
                cleanedItemsCount++;
              }
            }
          } catch (_) {}
        }
        // 1. Limpiar pilas de deshacer/rehacer de Tier List y Editor
        const tlStore = window.Alpine?.store('tierlist');
        if (tlStore) {
          const undoCount = (tlStore.undoStack?.length || 0) + (tlStore.redoStack?.length || 0);
          tlStore.undoStack = [];
          tlStore.redoStack = [];
          cleanedItemsCount += undoCount;
        }

        const charStore = window.Alpine?.store('characters');
        if (charStore && Array.isArray(charStore.undoStack)) {
          const charUndoCount = charStore.undoStack.length;
          charStore.undoStack = [];
          cleanedItemsCount += charUndoCount;
        }

        // 2. Limpieza de claves obsoletas o huérfanas en localStorage
        if (typeof localStorage !== 'undefined') {
          const keysToRemove = [];
          for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (k && (k.startsWith('temp_') || k.startsWith('cropper_draft_') || k === 'wimsf_tierlist_state_v1')) {
              keysToRemove.push(k);
            }
          }
          keysToRemove.forEach(k => {
            try { localStorage.removeItem(k); cleanedItemsCount++; } catch (_) {}
          });
        }

        // 3. Compactación de base de datos en Tier List
        if (tlStore && typeof tlStore.saveState === 'function') {
          await tlStore.saveState(true);
        }

        // 4. Liberar ObjectURLs revocadas en el cropper
        const cropperStore = window.Alpine?.store('mediaCropper');
        if (cropperStore && typeof cropperStore.revokeAllObjectUrls === 'function') {
          cropperStore.revokeAllObjectUrls();
        }

        // 5. Refrescar telemetría inmediatamente
        await this.refreshStorageTelemetry();

        window.Alpine?.store('app')?.toast(
          `Mantenimiento finalizado: ${cleanedItemsCount > 0 ? cleanedItemsCount + ' elementos temporales depurados.' : 'Caché optimizada y sin residuos.'}`,
          'success'
        );
      } catch (err) {
        console.error('[storageHealth] Error durante mantenimiento:', err);
        window.Alpine?.store('app')?.toast('Error durante el mantenimiento de almacenamiento.', 'error');
      } finally {
        this.isCleaningStorage = false;
        setTimeout(() => window.lucide?.createIcons?.(), 50);
      }
    },

    // ── Helper: Navegación contextual desde el auditor de peso ──────────────
    handleHeavyAssetAction(asset) {
      if (!asset) return;
      if (asset.actionType === 'view_char' && asset.targetId) {
        this.closeModal?.();
        window.Alpine?.store('characters')?.selectCharacter(asset.targetId);
        window.Alpine?.store('app')?.setActiveView?.('character');
      } else if (asset.actionType === 'edit_guest' && asset.targetId) {
        this.closeModal?.();
        window.Alpine?.store('app')?.setActiveView?.('tierlist');
        window.Alpine?.store('tierlist')?.editGuestCharacter(asset.targetId);
      } else if (asset.actionType === 'reset_bg') {
        if (asset.targetId === 'dashboard') {
          this.dashboardBgUrl = '';
          this.dashboardBgMode = 'pattern';
        } else if (asset.targetId === 'tierlist') {
          this.tierlistBgUrl = '';
          this.tierlistBgMode = 'pattern';
        }
        this.saveGlobalSettings();
        this.refreshStorageTelemetry();
        window.Alpine?.store('app')?.toast('Fondo pesado restablecido a la trama estándar.', 'info');
      }
    }
  };
}

