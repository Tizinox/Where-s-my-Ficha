/**
 * Alpine Store: steamBadges
 * Gestiona el catálogo masivo de insignias de Steam (+2,200 insignias oficiales),
 * los 3 slots equipables del personaje, filtros globales, paginación infinita y búsqueda en vivo.
 */

import { steamBadgesService } from '../utils/steam/steamBadgesService.js';

export function registerSteamBadgesStore(Alpine) {
  Alpine.store('steamBadges', {
    allBadges: [],
    featuredGames: [],
    selectedAppId: null, // null = todos los juegos
    selectedGameName: '',
    filterType: 'all', // 'all' | 'normal' | 'foil'
    query: '',
    page: 1,
    pageSize: 36,
    selectedSlot: 0, // 0, 1 o 2
    isLoading: false,
    showCustomModal: false,

    // Búsqueda en vivo online
    onlineSearchResults: [],
    isSearchingOnline: false,

    // Campos para agregar insignia manual por URL
    customUrl: '',
    customName: '',
    customGame: '',
    customIsFoil: false,

    init() {
      // Lazy: NO cargar 2,200 insignias en el arranque de la app
      this.allBadges = [];
      this.featuredGames = [];
    },

    async ensureLoaded() {
      if (this.allBadges.length === 0 && !this.isLoading) {
        await this.loadBadges();
      }
    },

    async loadBadges() {
      if (this.allBadges.length > 0) return;
      this.isLoading = true;
      try {
        const badges = (await steamBadgesService.getAllBadges()) || [];
        const games = (await steamBadgesService.getFeaturedGames()) || [];
        this.allBadges = Object.freeze(badges);
        this.featuredGames = Object.freeze(games);
      } catch (err) {
        console.warn('Error cargando insignias:', err);
      } finally {
        this.isLoading = false;
      }
    },

    setGameFilter(appid, gameName = '') {
      if (this.selectedAppId === appid) {
        // Toggle: si ya estaba seleccionado, volver a todos los juegos
        this.selectedAppId = null;
        this.selectedGameName = '';
      } else {
        this.selectedAppId = appid;
        this.selectedGameName = gameName;
      }
      this.page = 1;
    },

    clearGameFilter() {
      this.selectedAppId = null;
      this.selectedGameName = '';
      this.page = 1;
    },

    setFilterType(type) {
      this.filterType = type;
      this.page = 1;
    },

    onSearchInput() {
      this.page = 1;
    },

    clearSearch() {
      this.query = '';
      this.page = 1;
    },

    get filteredBadges() {
      return steamBadgesService.filterBadges(this.allBadges, this.query, this.filterType, this.selectedAppId);
    },

    get paginatedBadges() {
      return this.filteredBadges.slice(0, this.page * this.pageSize);
    },

    get totalCount() {
      return this.filteredBadges.length;
    },

    get hasMore() {
      return this.paginatedBadges.length < this.filteredBadges.length;
    },

    loadMore() {
      this.page++;
    },

    /**
     * Búsqueda avanzada / online de juegos fuera del catálogo
     */
    async searchGameOnline() {
      const q = (this.query || '').trim();
      if (!q) return;

      this.isSearchingOnline = true;
      try {
        // Si es número (AppID directo)
        if (/^\d+$/.test(q)) {
          const appid = Number(q);
          const existing = this.allBadges.filter(b => b.appid === appid);
          if (existing.length > 0) {
            this.selectedAppId = appid;
            this.selectedGameName = existing[0].game;
            this.query = '';
            this.page = 1;
            return;
          }

          // Cargar dinámicamente desde SteamCardExchange
          const newBadges = await steamBadgesService.getBadgesForGame(appid, `Juego #${appid}`);
          if (newBadges && newBadges.length > 0) {
            this.allBadges.unshift(...newBadges);
            this.selectedAppId = appid;
            this.selectedGameName = newBadges[0].game;
            this.query = '';
            this.page = 1;
            Alpine.store('app').toast(`¡Se cargaron ${newBadges.length} insignias para el juego #${appid}!`, 'success');
            return;
          }
        }

        // Búsqueda textual en SteamCardExchange
        const onlineGames = await steamBadgesService.searchOnlineGames(q);
        if (onlineGames && onlineGames.length > 0) {
          this.onlineSearchResults = onlineGames.slice(0, 8);
          Alpine.store('app').toast(`Se encontraron ${onlineGames.length} juegos en SteamCardExchange.`, 'info');
        } else {
          Alpine.store('app').toast('No se encontraron más resultados en línea para esa búsqueda.', 'info');
        }
      } catch (err) {
        console.warn('Error en búsqueda online:', err);
      } finally {
        this.isSearchingOnline = false;
      }
    },

    async loadOnlineGameBadges(game) {
      this.isLoading = true;
      try {
        const badges = await steamBadgesService.getBadgesForGame(game.appid, game.name);
        if (badges && badges.length > 0) {
          // Agregar al inicio del catálogo local
          const uniqueNew = badges.filter(nb => !this.allBadges.some(b => b.id === nb.id));
          if (uniqueNew.length > 0) {
            this.allBadges.unshift(...uniqueNew);
          }
          this.selectedAppId = game.appid;
          this.selectedGameName = game.name;
          this.query = '';
          this.onlineSearchResults = [];
          this.page = 1;
          Alpine.store('app').toast(`¡Insignias de «${game.name}» cargadas con éxito!`, 'success');
        } else {
          Alpine.store('app').toast(`No se pudieron extraer insignias para «${game.name}».`, 'warning');
        }
      } catch (e) {
        Alpine.store('app').toast(`Error al cargar «${game.name}».`, 'error');
      } finally {
        this.isLoading = false;
      }
    },

    /**
     * Comprueba si una insignia está actualmente equipada en el personaje activo
     */
    isBadgeEquipped(badge, char = null) {
      const c = char || Alpine.store('characters').active;
      if (!c?.basics?.steamBadges || !Array.isArray(c.basics.steamBadges)) return false;
      return c.basics.steamBadges.some(b => b && (b.id === badge.id || b.url === badge.url));
    },

    /**
     * Retorna el índice de slot donde está equipada la insignia (-1 si no está equipada)
     */
    getEquippedSlot(badge, char = null) {
      const c = char || Alpine.store('characters').active;
      if (!c?.basics?.steamBadges || !Array.isArray(c.basics.steamBadges)) return -1;
      return c.basics.steamBadges.findIndex(b => b && (b.id === badge.id || b.url === badge.url));
    },

    /**
     * Equipa la insignia en el slot seleccionado o en el primer slot disponible
     */
    equipBadge(badge, slot = null) {
      const targetSlot = (slot !== null && slot >= 0 && slot < 3) ? slot : this.selectedSlot;
      Alpine.store('characters').setSteamBadge(badge, targetSlot);
      
      // Avanzar al siguiente slot si está libre
      const badges = Alpine.store('characters').getCharSteamBadges();
      if (badges.length < 3) {
        for (let i = 0; i < 3; i++) {
          if (!badges[i]) {
            this.selectedSlot = i;
            break;
          }
        }
      }
    },

    /**
     * Quita la insignia de un slot
     */
    removeBadge(slotIndex) {
      Alpine.store('characters').removeSteamBadge(slotIndex);
    },

    /**
     * Equipa una insignia personalizada mediante enlace directo
     */
    equipCustomBadge() {
      const url = (this.customUrl || '').trim();
      if (!url) {
        Alpine.store('app').toast('Debes ingresar una URL de imagen válida.', 'error');
        return;
      }
      const badge = {
        id: `custom_${Date.now()}`,
        appid: 0,
        game: (this.customGame || 'Insignia Externa').trim(),
        name: (this.customName || 'Insignia Personalizada').trim(),
        level: this.customIsFoil ? 'Foil' : 'Personalizada',
        isFoil: Boolean(this.customIsFoil),
        url: url
      };
      this.equipBadge(badge, this.selectedSlot);
      this.customUrl = '';
      this.customName = '';
      this.customGame = '';
      this.customIsFoil = false;
      this.showCustomModal = false;
    }
  });
}
