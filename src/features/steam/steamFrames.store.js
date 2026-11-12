/**
 * Steam Avatar Frames Store
 * Maneja el estado reactivo del catálogo, buscador y modal de marcos de Steam.
 */

import { steamFramesService, OFFLINE_FEATURED_FRAMES } from './steamFramesService.js';

export function registerSteamFramesStore(Alpine) {
  Alpine.store('steamFrames', {
    isOpen: false,
    isLoading: false,
    isCatalogLoaded: false,
    query: '',
    category: 'all', // 'all' | 'animated' | 'fire' | 'cyber' | 'fantasy' | 'dark'
    allFrames: Object.freeze(OFFLINE_FEATURED_FRAMES),
    page: 1,
    pageSize: 48,

    init() {
      // Lazy: NO cargar el catálogo de +2,000 marcos en el arranque inicial de la app
      this.allFrames = Object.freeze(OFFLINE_FEATURED_FRAMES);
    },

    async ensureLoaded() {
      if (!this.isCatalogLoaded && !this.isLoading) {
        await this.loadFrames();
      }
    },

    async open() {
      this.isOpen = true;
      this.page = 1;
      if (!this.isCatalogLoaded) {
        await this.loadFrames();
      }
      setTimeout(() => {
        const input = document.getElementById('steam-frames-search-input');
        if (input) input.focus();
      }, 100);
    },

    close() {
      this.isOpen = false;
    },

    async loadFrames(forceRefresh = false) {
      if (this.isLoading) return;
      this.isLoading = true;
      try {
        const frames = await steamFramesService.getFrames({ forceRefresh });
        if (frames && frames.length > 0) {
          this.allFrames = Object.freeze(frames);
          this.isCatalogLoaded = true;
        } else {
          this.allFrames = Object.freeze(OFFLINE_FEATURED_FRAMES);
        }
      } catch (err) {
        console.warn('Error cargando marcos de Steam:', err);
        this.allFrames = Object.freeze(OFFLINE_FEATURED_FRAMES);
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
      const input = document.getElementById('steam-frames-search-input');
      if (input) input.focus();
    },

    get filteredFrames() {
      return steamFramesService.filterFrames(this.allFrames, this.query, this.category);
    },

    get paginatedFrames() {
      const filtered = this.filteredFrames;
      return filtered.slice(0, this.page * this.pageSize);
    },

    get totalCount() {
      return this.filteredFrames.length;
    },

    get hasMore() {
      return this.paginatedFrames.length < this.filteredFrames.length;
    },

    loadMore() {
      this.page++;
    },

    equipFrame(frame) {
      Alpine.store('characters').setAvatarFrame(frame);
      this.close();
    },

    toggleEquip(frame) {
      if (this.isEquipped(frame)) {
        Alpine.store('characters').removeAvatarFrame();
      } else {
        Alpine.store('characters').setAvatarFrame(frame);
      }
    },

    isEquipped(frame) {
      if (!frame) return false;
      const activeFrame = Alpine.store('characters').active?.basics?.avatarFrame;
      return Boolean(activeFrame && (activeFrame.id === frame.id || activeFrame.url === frame.url));
    },

    searchQuick(query, max = 10) {
      const q = (query || '').trim();
      if (!q) return [];
      if (!this.isCatalogLoaded && !this.isLoading) {
        this.ensureLoaded();
      }
      const pool = this.allFrames.length > 0 ? this.allFrames : OFFLINE_FEATURED_FRAMES;
      const filtered = steamFramesService.filterFrames(pool, q);
      return filtered.slice(0, max);
    },

    formatFrameName(name) {
      if (!name) return 'Marco Steam';
      if (String(name).toLowerCase() === 'frame of reference') return 'Marco de Referencia';
      return name;
    },

    formatFrameGame(game, name = '') {
      const g = String(game || '').trim();
      const n = String(name || '').toLowerCase();
      if (g.toLowerCase() === 'if_animated_frame' || n.includes('reference') || n.includes('referencia')) {
        return 'Idea Fix';
      }
      if (!g || /^(if_|anim_|animated_frame|tdr_)/i.test(g) || g.includes('Animated_Frame')) {
        if (/^tdr_/i.test(g)) return "Tom Clancy's The Division Resurgence";
        return 'Steam Points Shop';
      }
      return g;
    }
  });
}
