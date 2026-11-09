/**
 * Steam Animated Avatars Store
 * Gestiona el catálogo de avatares animados de Steam para el ÍCONO del personaje,
 * búsqueda reactiva, modal de catálogo completo y modal de confirmación de reemplazo.
 */

import { steamAvatarsService } from '../utils/steam/steamAvatarsService.js';

export function registerSteamAvatarsStore(Alpine) {
  Alpine.store('steamAvatars', {
    isOpen: false,
    isLoading: false,
    isCatalogLoaded: false,
    query: '',
    category: 'all',
    allAvatars: [],
    page: 1,
    pageSize: 48,

    // Estado del modal de confirmación
    showConfirmModal: false,
    pendingAvatar: null,
    previousIconUrl: null,

    init() {
      // Lazy: NO cargar catálogo de 2,700 avatares en el arranque
      this.allAvatars = [];
    },

    async ensureLoaded() {
      if (!this.isCatalogLoaded && !this.isLoading) {
        await this.loadAvatars();
      }
    },

    async open() {
      this.isOpen = true;
      this.page = 1;
      if (!this.isCatalogLoaded) {
        await this.loadAvatars();
      }
      setTimeout(() => {
        const input = document.getElementById('steam-avatars-search-input');
        if (input) input.focus();
      }, 100);
    },

    close() {
      this.isOpen = false;
    },

    async loadAvatars(forceRefresh = false) {
      if (this.isLoading) return;
      this.isLoading = true;
      try {
        const avatars = await steamAvatarsService.getAvatars({ forceRefresh });
        this.allAvatars = Object.freeze(avatars || []);
        this.isCatalogLoaded = true;
      } catch (err) {
        console.warn('Error cargando avatares animados de Steam:', err);
      } finally {
        this.isLoading = false;
      }
    },

    setCategory(cat) {
      this.category = cat;
      this.page = 1;
    },

    onSearchInput() {
      this.page = 1;
    },

    clearSearch() {
      this.query = '';
      this.page = 1;
      const input = document.getElementById('steam-avatars-search-input');
      if (input) input.focus();
    },

    get filteredAvatars() {
      return steamAvatarsService.filterAvatars(this.allAvatars, this.query, this.category);
    },

    get paginatedAvatars() {
      return this.filteredAvatars.slice(0, this.page * this.pageSize);
    },

    get totalCount() {
      return this.filteredAvatars.length;
    },

    get hasMore() {
      return this.paginatedAvatars.length < this.filteredAvatars.length;
    },

    loadMore() {
      this.page++;
    },

    isEquipped(avatar) {
      if (!avatar) return false;
      const char = Alpine.store('characters')?.active;
      const currentIcon = char?.basics?.iconDataUrl;
      return Boolean(currentIcon && currentIcon === avatar.url);
    },

    /**
     * Intenta equipar el avatar como ÍCONO del personaje.
     * Si ya existe un icono previo, abre la ventana de confirmación.
     */
    promptEquip(avatar) {
      if (!avatar) return;
      const char = Alpine.store('characters')?.active;
      if (!char) return;

      const currentIcon = char.basics?.iconDataUrl;

      // Si ya tiene ese mismo avatar equipado, desequipar directamente
      if (currentIcon === avatar.url) {
        this.removeEquip();
        return;
      }

      // Si ya tiene un icono previo configurado y es diferente:
      if (currentIcon && String(currentIcon).trim().length > 0) {
        this.pendingAvatar = avatar;
        this.previousIconUrl = currentIcon;
        this.showConfirmModal = true;
        return;
      }

      // No tenía icono previo, equipar inmediatamente
      this.applyEquip(avatar);
    },

    confirmEquip() {
      if (this.pendingAvatar) {
        this.applyEquip(this.pendingAvatar);
      }
      this.cancelEquip();
    },

    cancelEquip() {
      this.showConfirmModal = false;
      this.pendingAvatar = null;
      this.previousIconUrl = null;
    },

    applyEquip(avatar) {
      Alpine.store('characters').setSteamIcon(avatar);
      if (this.isOpen) {
        this.close();
      }
    },

    removeEquip() {
      Alpine.store('characters').removeSteamIcon();
    },

    searchQuick(query, max = 12) {
      const q = (query || '').trim();
      if (!q) return [];
      if (!this.isCatalogLoaded && !this.isLoading) {
        this.ensureLoaded();
      }
      const pool = this.allAvatars.length > 0 ? this.allAvatars : [];
      const filtered = steamAvatarsService.filterAvatars(pool, q, 'all');
      return filtered.slice(0, max);
    }
  });
}
