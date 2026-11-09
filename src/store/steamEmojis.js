/**
 * Steam Emojis Store
 * Alpine.store('steamEmojis') — Explorador y gestor de paquetes de emoticonos de Steam.
 * Permite explorar packs populares, buscar libremente en cualquier juego de Steam
 * e importar/sincronizar emojis directamente en la librería de customEmojis.
 */

import { steamEmojisService } from '../utils/steam/steamEmojisService.js';
import { MAX_CUSTOM_EMOJIS } from './customEmojis.js';

export function registerSteamEmojisStore(Alpine) {
  Alpine.store('steamEmojis', {
    isOpen: false,
    activeTab: 'packs', // 'packs' | 'search' | 'installed'
    query: '',
    searchQuery: '',
    searchResults: [],
    selectedGame: null,
    selectedGameEmojis: [],
    selectedPack: null,
    isLoading: false,
    isSearching: false,

    allPacks: steamEmojisService.getPacks(),
    featuredGames: steamEmojisService.getFeaturedGames(),

    open(initialTab = 'packs', pack = null) {
      this.isOpen = true;
      this.activeTab = initialTab;
      this.selectedPack = pack;
      if (initialTab === 'search' && !this.selectedGame) {
        // Seleccionar primer juego destacado por defecto
        this.selectGame(this.featuredGames[0]);
      }
    },

    close() {
      this.isOpen = false;
      this.selectedPack = null;
    },

    setTab(tab) {
      this.activeTab = tab;
      if (tab === 'search' && !this.selectedGame) {
        this.selectGame(this.featuredGames[0]);
      }
    },

    openPackDetail(pack) {
      this.selectedPack = pack;
    },

    closePackDetail() {
      this.selectedPack = null;
    },

    // ── Getters Reactivos ──────────────────────────────────────

    get filteredPacks() {
      return steamEmojisService.filterPacks(this.allPacks, this.query);
    },

    get installedSteamEmojis() {
      const customStore = Alpine.store('customEmojis');
      if (!customStore || !Array.isArray(customStore.list)) return [];
      
      // Emojis que provienen de Steam (por categoría o por URL de steamstatic)
      return customStore.list.filter(e => {
        if (!e) return false;
        const url = (e.url || '').toLowerCase();
        const cat = (e.category || '').toLowerCase();
        return (
          url.includes('steamstatic.com') ||
          cat.includes('steam') ||
          cat.includes('counter-strike') ||
          cat.includes('valve') ||
          cat.includes('hollow knight') ||
          cat.includes('undertale') ||
          cat.includes('terraria') ||
          cat.includes('isaac') ||
          cat.includes('portal') ||
          cat.includes('cyberpunk')
        );
      });
    },

    // ── Verificaciones de Estado ────────────────────────────────

    isEmojiAdded(shortcode) {
      if (!shortcode) return false;
      const customStore = Alpine.store('customEmojis');
      if (!customStore) return false;
      return Boolean(customStore.getEmojiByShortcode(shortcode));
    },

    getPackAddedCount(pack) {
      if (!pack || !Array.isArray(pack.emojis)) return 0;
      return pack.emojis.filter(e => this.isEmojiAdded(e.shortcode)).length;
    },

    isPackFullyAdded(pack) {
      if (!pack || !Array.isArray(pack.emojis) || pack.emojis.length === 0) return false;
      return this.getPackAddedCount(pack) === pack.emojis.length;
    },

    // ── Acciones de Importación / Gestión ───────────────────────

    addSingleEmoji(emoji, category = 'Steam') {
      const customStore = Alpine.store('customEmojis');
      if (!customStore) return;

      const code = customStore.sanitizeShortcode(emoji.shortcode);
      if (!code) {
        Alpine.store('app')?.toast('Código de emoji inválido.', 'warning');
        return;
      }

      if (this.isEmojiAdded(code)) {
        Alpine.store('app')?.toast(`El emoticono :${code}: ya está en tu colección.`, 'info');
        return;
      }

      if (customStore.list.length >= MAX_CUSTOM_EMOJIS) {
        Alpine.store('app')?.toast(`Has alcanzado el límite recomendado (${MAX_CUSTOM_EMOJIS} emojis). Elimina alguno antes de añadir más.`, 'warning');
        return;
      }

      const newEmoji = {
        id: crypto.randomUUID(),
        shortcode: code,
        name: emoji.name || code,
        url: emoji.url,
        category: category || emoji.category || 'Steam',
        createdAt: Date.now()
      };

      customStore.list.unshift(newEmoji);
      customStore.saveEmojis();
      window.globalTextFormatter?.formatPreviewElements?.();

      Alpine.store('app')?.toast(`¡:${code}: añadido a tu colección de emojis!`, 'success');
    },

    removeSingleEmoji(shortcode) {
      const customStore = Alpine.store('customEmojis');
      if (!customStore) return;

      const cleanCode = (shortcode || '').toLowerCase().trim();
      const existing = customStore.list.find(e => e.shortcode.toLowerCase() === cleanCode);
      if (!existing) return;

      customStore.deleteEmoji(existing.id);
    },

    toggleEmoji(emoji, category = 'Steam') {
      if (this.isEmojiAdded(emoji.shortcode)) {
        this.removeSingleEmoji(emoji.shortcode);
      } else {
        this.addSingleEmoji(emoji, category);
      }
    },

    installPack(pack) {
      if (!pack || !Array.isArray(pack.emojis) || pack.emojis.length === 0) return;
      const customStore = Alpine.store('customEmojis');
      if (!customStore) return;

      let addedCount = 0;
      const cat = pack.category || pack.name || 'Steam';

      for (const item of pack.emojis) {
        const code = customStore.sanitizeShortcode(item.shortcode);
        if (!code) continue;

        if (this.isEmojiAdded(code)) continue;

        if (customStore.list.length >= MAX_CUSTOM_EMOJIS) {
          Alpine.store('app')?.toast(`Límite alcanzado (${MAX_CUSTOM_EMOJIS} emojis). Se detuvo la importación.`, 'warning');
          break;
        }

        customStore.list.push({
          id: crypto.randomUUID(),
          shortcode: code,
          name: item.name || code,
          url: item.url,
          category: cat,
          createdAt: Date.now()
        });
        addedCount++;
      }

      if (addedCount > 0) {
        customStore.saveEmojis();
        window.globalTextFormatter?.formatPreviewElements?.();
        Alpine.store('app')?.toast(`¡Pack "${pack.name}" instalado (+${addedCount} emoticonos)!`, 'success');
      } else {
        Alpine.store('app')?.toast(`Todos los emoticonos del pack "${pack.name}" ya estaban en tu librería.`, 'info');
      }
    },

    uninstallPack(pack) {
      if (!pack || !Array.isArray(pack.emojis)) return;
      const customStore = Alpine.store('customEmojis');
      if (!customStore) return;

      const codesToRemove = new Set(pack.emojis.map(e => e.shortcode.toLowerCase()));
      const initialLen = customStore.list.length;
      customStore.list = customStore.list.filter(e => !codesToRemove.has(e.shortcode.toLowerCase()));

      const removedCount = initialLen - customStore.list.length;
      if (removedCount > 0) {
        customStore.saveEmojis();
        window.globalTextFormatter?.formatPreviewElements?.();
        Alpine.store('app')?.toast(`Se desinstalaron ${removedCount} emoticonos del pack "${pack.name}".`, 'info');
      }
    },

    // ── Búsqueda Libre en Línea por Juego ───────────────────────

    async onSearchInput() {
      const q = (this.searchQuery || '').trim();
      if (q.length < 2) {
        this.searchResults = [];
        return;
      }

      this.isSearching = true;
      try {
        const results = await steamEmojisService.searchOnlineGames(q);
        this.searchResults = results || [];
      } catch (e) {
        console.warn('[steamEmojis] Error buscando juegos online:', e);
        this.searchResults = [];
      } finally {
        this.isSearching = false;
      }
    },

    async selectGame(game) {
      if (!game || !game.appid) return;
      this.selectedGame = game;
      this.isLoading = true;
      this.selectedGameEmojis = [];

      try {
        const emojis = await steamEmojisService.getEmoticonsForGame(game.appid, game.name);
        this.selectedGameEmojis = emojis || [];
      } catch (e) {
        console.warn(`[steamEmojis] Error cargando emoticonos de ${game.name}:`, e);
        this.selectedGameEmojis = [];
      } finally {
        this.isLoading = false;
      }
    },

    installAllFromActiveGame() {
      if (!this.selectedGame || this.selectedGameEmojis.length === 0) return;
      
      const pseudoPack = {
        name: this.selectedGame.name,
        category: this.selectedGame.name,
        emojis: this.selectedGameEmojis
      };
      this.installPack(pseudoPack);
    }
  });
}

export default registerSteamEmojisStore;
