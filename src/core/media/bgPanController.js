/**
 * utils/bgPanController.js
 * Controlador Alpine interactivo para Encuadre 2D (Drag y Pan),
 * zoom con rueda de ratón y matriz de anclaje rápido 3x3 en vistas previas de fondo.
 */

export function registerBgPanController(Alpine) {
  Alpine.data('bgPanController', (target = 'dashboard') => ({
    isDragging: false,
    startX: 0,
    startY: 0,
    initialPosX: 50,
    initialPosY: 50,
    containerWidth: 1,
    containerHeight: 1,
    isHovered: false,
    showMockup: true,

    get settingsStore() {
      return Alpine.store('settings');
    },

    get charStore() {
      return Alpine.store('characters');
    },

    get theme() {
      if (target === 'tierlist') {
        return {
          name: 'purple',
          accent: 'text-purple-400',
          border: 'border-purple-400/40',
          bgActive: 'bg-purple-400',
          shadow: 'shadow-[0_0_10px_rgba(168,85,247,0.7)]',
          badge: 'text-purple-300 border-purple-400/40 bg-purple-500/20'
        };
      }
      if (target === 'character') {
        return {
          name: 'emerald',
          accent: 'text-emerald-400',
          border: 'border-emerald-400/40',
          bgActive: 'bg-emerald-400',
          shadow: 'shadow-[0_0_10px_rgba(16,185,129,0.7)]',
          badge: 'text-emerald-300 border-emerald-400/40 bg-emerald-500/20'
        };
      }
      return {
        name: 'cyan',
        accent: 'text-cyan-400',
        border: 'border-cyan-400/40',
        bgActive: 'bg-cyan-400',
        shadow: 'shadow-[0_0_10px_rgba(6,182,212,0.7)]',
        badge: 'text-cyan-300 border-cyan-400/40 bg-cyan-500/20'
      };
    },

    getX() {
      if (target === 'dashboard') return this.settingsStore?.dashboardBgPosX ?? 50;
      if (target === 'tierlist') return this.settingsStore?.tierlistBgPosX ?? 50;
      if (target === 'character') return this.charStore?.active?.presentation?.background?.posX ?? 50;
      return 50;
    },

    getY() {
      if (target === 'dashboard') return this.settingsStore?.dashboardBgPosY ?? 50;
      if (target === 'tierlist') return this.settingsStore?.tierlistBgPosY ?? 50;
      if (target === 'character') return this.charStore?.active?.presentation?.background?.posY ?? 50;
      return 50;
    },

    getZoom() {
      if (target === 'dashboard') return this.settingsStore?.dashboardBgZoom ?? 100;
      if (target === 'tierlist') return this.settingsStore?.tierlistBgZoom ?? 100;
      if (target === 'character') return this.charStore?.active?.presentation?.background?.zoom ?? 100;
      return 100;
    },

    setPos(x, y) {
      const clampedX = Math.max(0, Math.min(100, Math.round(x)));
      const clampedY = Math.max(0, Math.min(100, Math.round(y)));
      if (target === 'dashboard') {
        this.settingsStore.dashboardBgPosX = clampedX;
        this.settingsStore.dashboardBgPosY = clampedY;
        this.settingsStore.saveDashboardBgSettings();
      } else if (target === 'tierlist') {
        this.settingsStore.tierlistBgPosX = clampedX;
        this.settingsStore.tierlistBgPosY = clampedY;
        this.settingsStore.saveTierlistBgSettings();
      } else if (target === 'character') {
        this.charStore.updateBackgroundPosX(clampedX);
        this.charStore.updateBackgroundPosY(clampedY);
      }
    },

    setZoom(z) {
      const clampedZ = Math.max(100, Math.min(250, Math.round(z)));
      if (target === 'dashboard') {
        this.settingsStore.dashboardBgZoom = clampedZ;
        this.settingsStore.saveDashboardBgSettings();
      } else if (target === 'tierlist') {
        this.settingsStore.tierlistBgZoom = clampedZ;
        this.settingsStore.saveTierlistBgSettings();
      } else if (target === 'character') {
        this.charStore.updateBackgroundZoom(clampedZ);
      }
    },

    resetFrame() {
      if (target === 'dashboard') {
        this.settingsStore?.resetDashboardBgFrame?.();
      } else if (target === 'tierlist') {
        this.settingsStore?.resetTierlistBgFrame?.();
      } else if (target === 'character') {
        this.charStore?.resetBackgroundFrame?.();
      }
    },

    hasImage() {
      if (target === 'dashboard') {
        return (this.settingsStore.dashboardBgMode === 'custom' && !!this.settingsStore.dashboardBgUrl) ||
               (this.settingsStore.dashboardBgMode === 'dynamic');
      }
      if (target === 'tierlist') {
        return (this.settingsStore.tierlistBgMode === 'custom' && !!this.settingsStore.tierlistBgUrl) ||
               (this.settingsStore.tierlistBgMode === 'sync');
      }
      if (target === 'character') {
        const bg = this.charStore?.active?.presentation?.background;
        const mode = bg?.mode || 'pattern';
        return (mode === 'custom' && !!bg?.image) || (mode === 'sync');
      }
      return false;
    },

    isSyncMode() {
      if (target === 'tierlist') return this.settingsStore?.tierlistBgMode === 'sync';
      if (target === 'character') return (this.charStore?.active?.presentation?.background?.mode || 'pattern') === 'sync';
      return false;
    },

    onPointerDown(e) {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      if (!this.hasImage()) return;
      const rect = e.currentTarget.getBoundingClientRect();
      this.containerWidth = rect.width || 1;
      this.containerHeight = rect.height || 1;
      this.startX = e.clientX;
      this.startY = e.clientY;
      this.initialPosX = this.getX();
      this.initialPosY = this.getY();
      this.isDragging = true;
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch (_) {}
    },

    onPointerMove(e) {
      if (!this.isDragging) return;
      const dx = e.clientX - this.startX;
      const dy = e.clientY - this.startY;
      // Arrastrar a la derecha reduce X (revelando la parte izquierda de la imagen)
      const deltaX = (dx / this.containerWidth) * 100;
      // Arrastrar hacia abajo reduce Y (revelando la parte superior)
      const deltaY = (dy / this.containerHeight) * 100;
      this.setPos(this.initialPosX - deltaX, this.initialPosY - deltaY);
    },

    onPointerUp(e) {
      if (!this.isDragging) return;
      this.isDragging = false;
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch (_) {}
      if (target === 'dashboard') {
        this.settingsStore?.saveDashboardBgSettings?.(true);
      } else if (target === 'tierlist') {
        this.settingsStore?.saveTierlistBgSettings?.(true);
      }
    },

    onWheel(e) {
      if (!this.hasImage()) return;
      e.preventDefault();
      const step = 5;
      const dir = e.deltaY < 0 ? step : -step;
      this.setZoom(this.getZoom() + dir);
    },

    // ── Matriz de Anclaje Rápido 3x3 ──
    setAnchor(ax, ay) {
      this.setPos(ax, ay);
      if (target === 'dashboard') {
        this.settingsStore?.saveDashboardBgSettings?.(true);
      } else if (target === 'tierlist') {
        this.settingsStore?.saveTierlistBgSettings?.(true);
      }
    },

    isAnchorActive(ax, ay) {
      const curX = this.getX();
      const curY = this.getY();
      const matchX = ax === 50 ? (curX >= 25 && curX <= 75) : (ax === 0 ? curX < 25 : curX > 75);
      const matchY = ay === 50 ? (curY >= 25 && curY <= 75) : (ay === 0 ? curY < 25 : curY > 75);
      return matchX && matchY;
    }
  }));
}
