/**
 * store/app/modals.js
 * Submódulo de notificaciones (Toasts), atajos de teclado globales, lightbox y modales de confirmación/reinicio.
 */

export function createModalMethods() {
  return {
    // ── Toast notifications (Soporte con Acciones / Undo) ───
    toasts: [],
    _toastId: 0,
    maxVisibleToasts: 3, // Límite general en pantalla (máximo 3 o 4 para no saturar la interfaz)

    /**
     * @param {string} message
     * @param {'success'|'error'|'warning'|'info'} type
     * @param {number|Object} durationOrAction  ms o { label, onClick, duration }
     * @param {Object} [action]  { label, onClick }
     */
    toast(message, type = 'info', durationOrAction = 3500, action = null) {
      let duration = typeof durationOrAction === 'number' ? durationOrAction : 3500;
      let act = action;

      if (typeof durationOrAction === 'object' && durationOrAction !== null) {
        act = durationOrAction;
        duration = durationOrAction.duration || 6000;
      }

      // 1. Anti-spam / Deduplicación inteligente:
      // Si el mismo mensaje ya está visible en pantalla (y sin acción interactiva distinta),
      // no creamos otra tarjeta idéntica: incrementamos su contador y renovamos su duración.
      const existing = this.toasts.find(t => t.visible && t.message === message && t.type === type && !t.action && !act);
      if (existing) {
        existing.count = (existing.count || 1) + 1;
        if (existing._timer) {
          clearTimeout(existing._timer);
        }
        existing._timer = setTimeout(() => this.dismissToast(existing.id), duration);
        return existing.id;
      }

      // 2. Control de límite general en pantalla (máximo 3 visibles simultáneamente):
      // Si se alcanza el límite, cerramos inmediatamente los toasts más viejos para despejar la vista.
      const maxToasts = this.maxVisibleToasts || 3;
      const visibleToasts = this.toasts.filter(t => t.visible);
      if (visibleToasts.length >= maxToasts) {
        const excessCount = visibleToasts.length - maxToasts + 1;
        for (let i = 0; i < excessCount; i++) {
          this.dismissToast(visibleToasts[i].id);
        }
      }

      const id = ++this._toastId;
      const newToast = {
        id,
        message,
        type,
        action: act,
        count: 1,
        visible: true,
        _timer: null,
      };

      newToast._timer = setTimeout(() => this.dismissToast(id), duration);
      this.toasts.push(newToast);
      return id;
    },

    dismissToast(id) {
      const idx = this.toasts.findIndex(t => t.id === id);
      if (idx !== -1) {
        const target = this.toasts[idx];
        if (target._timer) {
          clearTimeout(target._timer);
          target._timer = null;
        }
        target.visible = false;
        setTimeout(() => {
          this.toasts = this.toasts.filter(t => t.id !== id);
        }, 300); // tiempo de salida de la animación CSS
      }
    },

    clearAllToasts() {
      this.toasts.forEach(t => {
        if (t._timer) clearTimeout(t._timer);
        t.visible = false;
      });
      setTimeout(() => {
        this.toasts = [];
      }, 300);
    },

    // ── Modal de Atajos de Teclado (Hotkeys Modal) ────
    showHotkeysModal: false,

    openHotkeysModal() {
      this.showHotkeysModal = true;
    },

    closeHotkeysModal() {
      this.showHotkeysModal = false;
    },

    toggleHotkeysModal() {
      this.showHotkeysModal = !this.showHotkeysModal;
    },

    // ── Motor Global de Atajos de Teclado (Hotkeys Engine) ──────
    initHotkeys() {
      if (window._hotkeysInitialized) return;
      window._hotkeysInitialized = true;

      window.addEventListener('keydown', (e) => {
        const activeEl = document.activeElement;
        const isInputField = activeEl && (
          activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          activeEl.isContentEditable
        );

        // 1. Escape: Jerarquía inteligente de cierre (Modales -> Submenús/Popovers -> Desenfocar -> Dashboard)
        if (e.key === 'Escape') {
          const charStore = window.Alpine?.store('characters');
          const steamFramesStore = window.Alpine?.store('steamFrames');
          const steamAvatarsStore = window.Alpine?.store('steamAvatars');
          const steamBadgesStore = window.Alpine?.store('steamBadges');
          const steamEmojisStore = window.Alpine?.store('steamEmojis');
          const customEmojisStore = window.Alpine?.store('customEmojis');
          const devConsoleStore = window.Alpine?.store('devConsole');
          const tierlistStore = window.Alpine?.store('tierlist');
          const settingsStore = window.Alpine?.store('settings');

          // NIVEL 1: Diálogos y Modales principales
          const modalEntries = [
            { isOpen: () => this.showHotkeysModal, close: () => this.closeHotkeysModal() },
            { isOpen: () => this.showCropper, close: () => this.cancelCropper() },
            { isOpen: () => Boolean(this.lightboxUrl), close: () => this.closeLightbox() },
            { isOpen: () => this.showDiscordModal, close: () => this.closeDiscordModal() },
            { isOpen: () => this.showResetModal, close: () => this.closeResetModal() },
            { isOpen: () => this.showFactoryResetModal, close: () => this.closeFactoryResetModal() },
            { isOpen: () => this.showGifSizeErrorModal, close: () => this.closeGifSizeError() },
            { isOpen: () => Boolean(charStore?.customTabModalOpen), close: () => charStore.closeCustomTabModal() },
            { isOpen: () => Boolean(charStore?.blockBuilderModalOpen), close: () => charStore.closeBlockBuilder() },
            { isOpen: () => Boolean(charStore?.showImportPreview), close: () => charStore.closeImportPreview() },
            { isOpen: () => Boolean(charStore?.createSheetModalOpen), close: () => charStore.closeCreateSheetModal() },
            { isOpen: () => Boolean(charStore?.renameTarget), close: () => { charStore.renameTarget = null; } },
            { isOpen: () => Boolean(charStore?.deleteTarget), close: () => charStore.cancelDelete() },
            { isOpen: () => Boolean(charStore?.deleteFolderTarget), close: () => charStore.cancelDeleteFolder() },
            { isOpen: () => Boolean(charStore?.folderModalOpen), close: () => charStore.closeFolderModal() },
            { isOpen: () => Boolean(customEmojisStore?.isOpen), close: () => customEmojisStore.closePicker() },
            { isOpen: () => Boolean(steamEmojisStore?.isOpen), close: () => steamEmojisStore.close() },
            { isOpen: () => Boolean(steamFramesStore?.isOpen), close: () => steamFramesStore.close() },
            { isOpen: () => Boolean(steamAvatarsStore?.isOpen), close: () => steamAvatarsStore.close() },
            { isOpen: () => Boolean(steamAvatarsStore?.promptTarget), close: () => steamAvatarsStore.cancelEquip() },
            { isOpen: () => Boolean(steamBadgesStore?.showCustomModal), close: () => { steamBadgesStore.showCustomModal = false; } },
            { isOpen: () => Boolean(devConsoleStore?.showModal), close: () => devConsoleStore.closeModal() },
            { isOpen: () => Boolean(tierlistStore?.showTierMakerModal), close: () => tierlistStore.closeTierMakerModal() },
            { isOpen: () => Boolean(tierlistStore?.showListsModal), close: () => tierlistStore.closeListsModal() },
            { isOpen: () => Boolean(tierlistStore?.showIconPickerModal), close: () => tierlistStore.closeIconPicker() },
            { isOpen: () => Boolean(tierlistStore?.showAddGuestModal), close: () => tierlistStore.closeAddGuestModal() },
            { isOpen: () => Boolean(tierlistStore?.showBatchGuestsModal), close: () => tierlistStore.closeBatchGuestsModal() },
            { isOpen: () => Boolean(tierlistStore?.dividerTitleModal?.isOpen), close: () => tierlistStore.closeDividerTitleModal() },
            { isOpen: () => Boolean(tierlistStore?.tierEditorModal?.isOpen), close: () => tierlistStore.closeTierEditor() },
            { isOpen: () => Boolean(tierlistStore?.confirmDialog?.isOpen), close: () => tierlistStore.closeConfirm() },
            { isOpen: () => Boolean(settingsStore?.showDesignerModal), close: () => settingsStore.closeDesigner() },
            { isOpen: () => Boolean(settingsStore?.showExportKitModal), close: () => settingsStore.closeExportKit() },
            { isOpen: () => Boolean(settingsStore?.showImportKitModal), close: () => settingsStore.closeImportKitModal() },
            { isOpen: () => Boolean(settingsStore?.isOpen), close: () => settingsStore.closeModal() },
          ];

          for (const modal of modalEntries) {
            if (modal.isOpen()) {
              modal.close();
              e.preventDefault();
              return;
            }
          }

          if (this.activeView === 'settings') {
            this.closeSettingsView();
            e.preventDefault();
            return;
          }
          if (settingsStore && typeof settingsStore.forceCloseAllModals === 'function') {
            settingsStore.forceCloseAllModals();
          }

          // NIVEL 2: Sub-menús, selectores de color (CyberColorPicker) y popovers flotantes
          // 2a. Selectores de Color CyberColorPicker abiertos
          if (window._activeCyberColorPickers && window._activeCyberColorPickers.size > 0) {
            let closedPicker = false;
            for (const picker of Array.from(window._activeCyberColorPickers)) {
              if (picker && (picker.isOpen || picker.isOpen === undefined)) {
                if (typeof picker.close === 'function') picker.close();
                else picker.isOpen = false;
                closedPicker = true;
              }
            }
            window._activeCyberColorPickers.clear();
            if (closedPicker) {
              e.preventDefault();
              return;
            }
          }

          // 2b. Menú de añadir pestañas/secciones
          if (this.showAddTabMenu) {
            this.showAddTabMenu = false;
            e.preventDefault();
            return;
          }

          // 2c. Sub-menús o dropdowns locales con banderas booleanas en el DOM
          let closedSubmenu = false;
          try {
            const dropdownEls = Array.from(document.querySelectorAll('[x-data]')).filter(el => {
              if (el === document.body || el.id === 'app' || el.classList.contains('app-container')) return false;
              const data = window.Alpine?.$data(el);
              if (!data) return false;
              const menuKeys = [
                'isOpen', 'open', 'isMenuOpen', 'openAppearance', 'openMore',
                'showQuickMenu', 'showProbModal', 'showSanityMenu', 'showFilterDropdown',
                'showCatDropdown', 'showFilterReadDropdown', 'openPresets', 'openIconPicker'
              ];
              for (const key of menuKeys) {
                if (data[key] === true) {
                  const popup = el.querySelector('[x-show], [role="menu"], [role="listbox"], .is-open, .is-open-card') || el;
                  if (popup && (popup.offsetParent !== null || getComputedStyle(popup).display !== 'none')) {
                    if (typeof data.close === 'function') {
                      data.close();
                    } else {
                      data[key] = false;
                    }
                    closedSubmenu = true;
                    return true;
                  }
                }
              }
              return false;
            });
            if (closedSubmenu || dropdownEls.length > 0) {
              e.preventDefault();
              return;
            }
          } catch (domErr) {
            console.warn('[ESC Handler] Error checking dropdown state:', domErr);
          }

          // NIVEL 3: Si el cursor está en un campo de texto, desenfocar primero (unfocus)
          if (isInputField) {
            activeEl.blur();
            e.preventDefault();
            return;
          }

          // NIVEL 4: Deselección y Cancelaciones contextuales inteligentes
          // (Se nerfea la tecla ESC: JAMÁS expulsar al Dashboard involuntariamente)
          
          // 4a. En la vista Tier List:
          if (this.activeView === 'tierlist' && tierlistStore) {
            e.preventDefault();
            e.stopPropagation();
            if (typeof e.stopImmediatePropagation === 'function') e.stopImmediatePropagation();
            tierlistStore.handleEscape?.();
            return;
          }

          // 4b. En la vista Dashboard:
          if (this.activeView === 'dashboard') {
            // Deseleccionar fichas marcadas en selección múltiple
            if (charStore && Array.isArray(charStore.selectedIds) && charStore.selectedIds.length > 0) {
              e.preventDefault();
              charStore.clearSelection();
              return;
            }
            // Limpiar buscador si contiene texto
            if (charStore?.searchQuery) {
              e.preventDefault();
              charStore.searchQuery = '';
              return;
            }
            return;
          }

          // 4c. En la vista Editor de Ficha:
          if (this.activeView === 'editor') {
            // En el editor de ficha, ESC desenfoca pero jamás expulsa al usuario al Dashboard
            e.preventDefault();
            return;
          }

          return;
        }

        // 2. Ctrl + S / Cmd + S: Guardar inmediatamente
        if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
          e.preventDefault();
          const charStore = window.Alpine?.store('characters');
          if (charStore && typeof charStore.forceSave === 'function') {
            charStore.forceSave();
          }
          return;
        }

        // 2b. Ctrl + , / Cmd + ,: Abrir o Alternar pantalla de Configuraciones Globales
        if ((e.ctrlKey || e.metaKey) && (e.key === ',' || e.code === 'Comma')) {
          e.preventDefault();
          const settingsStore = window.Alpine?.store('settings');
          if (this.activeView === 'settings') {
            if (typeof settingsStore?.closeModal === 'function') {
              settingsStore.closeModal();
            } else {
              this.closeSettingsView();
            }
          } else {
            if (typeof settingsStore?.openModal === 'function') {
              settingsStore.openModal();
            } else {
              this.openSettingsView();
            }
          }
          return;
        }


        // 4. Ctrl + Z / Cmd + Z (sin Shift): Deshacer snapshot
        if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z') && !e.shiftKey) {
          if (!isInputField) {
            e.preventDefault();
            const appStore = window.Alpine?.store('app');
            if (appStore?.activeView === 'tierlist') {
              const tierStore = window.Alpine?.store('tierlist');
              if (tierStore && typeof tierStore.undo === 'function') {
                tierStore.undo();
              }
            } else {
              const charStore = window.Alpine?.store('characters');
              if (charStore && typeof charStore.undo === 'function') {
                charStore.undo();
              }
            }
          }
          return;
        }

        // 5. Ctrl + Y / Cmd + Shift + Z: Rehacer snapshot
        if (((e.ctrlKey || e.metaKey) && (e.key === 'y' || e.key === 'Y')) ||
            ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'z' || e.key === 'Z'))) {
          if (!isInputField) {
            e.preventDefault();
            const appStore = window.Alpine?.store('app');
            if (appStore?.activeView === 'tierlist') {
              const tierStore = window.Alpine?.store('tierlist');
              if (tierStore && typeof tierStore.redo === 'function') {
                tierStore.redo();
              }
            } else {
              const charStore = window.Alpine?.store('characters');
              if (charStore && typeof charStore.redo === 'function') {
                charStore.redo();
              }
            }
          }
          return;
        }

        // 6. Ctrl + F / Cmd + F: Enfocar buscador
        if ((e.ctrlKey || e.metaKey) && (e.key === 'f' || e.key === 'F')) {
          const searchInput = document.querySelector('.dashboard-search-input') || document.querySelector('input[type="search"]');
          if (searchInput) {
            e.preventDefault();
            searchInput.focus();
            searchInput.select();
          }
          return;
        }

        // 7. Shift + ? (o ? fuera de inputs): Abrir modal de atajos
        if ((e.key === '?' || (e.shiftKey && e.key === '/')) && !isInputField) {
          e.preventDefault();
          this.toggleHotkeysModal();
          return;
        }
      });
    },

    // ── Modal Lightbox (Vista previa a pantalla completa) ───
    lightboxUrl: null,

    openLightbox(url) {
      if (!url) return;
      this.lightboxUrl = url;
    },

    closeLightbox() {
      this.lightboxUrl = null;
    },

    // ── Modal de Restablecer Personaje (Reset con Cooldown de 5s) ──
    showResetModal: false,
    resetCountdown: 5,
    resetTimerInterval: null,
    resetTargetCharId: null,
    resetTargetCharName: '',

    openResetModal(targetCharId = null) {
      const charsStore = window.Alpine?.store('characters');
      const targetId = targetCharId || charsStore?.activeId;
      const targetChar = charsStore?.list?.find(c => c.id === targetId) || charsStore?.active;

      if (!targetChar) {
        this.toast('No hay un personaje seleccionado para restablecer.', 'warning');
        return;
      }

      this.resetTargetCharId = targetId;
      this.resetTargetCharName = targetChar.name || targetChar.basics?.fullName || 'Personaje';
      this.resetCountdown = 5;
      this.showResetModal = true;

      if (this.resetTimerInterval) {
        clearInterval(this.resetTimerInterval);
        this.resetTimerInterval = null;
      }

      this.resetTimerInterval = setInterval(() => {
        if (this.resetCountdown > 0) {
          this.resetCountdown--;
        }
        if (this.resetCountdown <= 0) {
          clearInterval(this.resetTimerInterval);
          this.resetTimerInterval = null;
        }
      }, 1000);
    },

    closeResetModal() {
      this.showResetModal = false;
      if (this.resetTimerInterval) {
        clearInterval(this.resetTimerInterval);
        this.resetTimerInterval = null;
      }
      this.resetCountdown = 5;
      this.resetTargetCharId = null;
      this.resetTargetCharName = '';
    },

    async confirmResetCharacter() {
      if (this.resetCountdown > 0 || !this.resetTargetCharId) return;
      const charsStore = window.Alpine?.store('characters');
      await charsStore?.resetCharacter(this.resetTargetCharId);
      this.closeResetModal();
    },

    // ── Modal de Seguridad: Reinicio de Fábrica Global ────────
    showFactoryResetModal: false,
    factoryResetConfirmInput: '',

    openFactoryResetModal() {
      this.factoryResetConfirmInput = '';
      this.showFactoryResetModal = true;
    },

    closeFactoryResetModal() {
      this.showFactoryResetModal = false;
      this.factoryResetConfirmInput = '';
    },

    async confirmFactoryReset() {
      if (this.factoryResetConfirmInput.trim().toUpperCase() !== 'BORRAR') {
        this.toast('Debes escribir "BORRAR" para confirmar el restablecimiento total.', 'warning');
        return;
      }
      const charsStore = window.Alpine?.store('characters');
      await charsStore?.factoryResetApp();
      this.clearBlobUrlCache();
      this.closeFactoryResetModal();
      const settingsStore = window.Alpine?.store('settings');
      if (settingsStore) settingsStore.closeModal();
    },

    // ── Weight Warning State (GIFs pesados) ─────────────────
    showGifSizeErrorModal: false,
    gifWarningSizeMB: '0',
    pendingGifAction: null,

    triggerGifWeightWarning(sizeMB, onConfirm) {
      this.gifWarningSizeMB = String(sizeMB || '10.0');
      this.pendingGifAction = onConfirm;
      this.showGifSizeErrorModal = true;
    },

    confirmHeavyGif() {
      const act = this.pendingGifAction;
      this.showGifSizeErrorModal = false;
      this.pendingGifAction = null;
      if (typeof act === 'function') {
        act();
      }
    },

    cancelHeavyGif() {
      this.showGifSizeErrorModal = false;
      this.pendingGifAction = null;
    },

    // Compatibilidad retroactiva
    triggerGifSizeError() {
      this.triggerGifWeightWarning('10.0', null);
    },

    closeGifSizeError() {
      this.cancelHeavyGif();
    }
  };
}
