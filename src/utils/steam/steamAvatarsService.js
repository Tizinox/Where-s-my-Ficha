/**
 * Steam Animated Avatars Service
 * Conexión y catálogo de más de 2,700 avatares animados de Steam Points Shop y SteamCardExchange.
 * Optimizado con Carga Perezosa (Lazy Loading) bajo demanda para reducir el bundle inicial.
 */

import { ls } from '../storage.js';

const CACHE_KEY = 'steam_animated_avatars_catalog_v2';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24h

class SteamAvatarsService {
  constructor() {
    this._memoryAvatars = null;
    this._bundledCatalog = null;
    this._isLoading = false;
  }

  async _getBundledCatalog() {
    if (this._bundledCatalog && this._bundledCatalog.length > 0) {
      return this._bundledCatalog;
    }
    try {
      const mod = await import('./steamAvatarsCatalog.js');
      this._bundledCatalog = mod.default || mod.bundledCatalog || [];
      return this._bundledCatalog;
    } catch (e) {
      console.warn('[steamAvatarsService] Error cargando catálogo de avatares:', e);
      return [];
    }
  }

  async getAvatars({ forceRefresh = false } = {}) {
    if (!forceRefresh && this._memoryAvatars && this._memoryAvatars.length > 0) {
      return this._memoryAvatars;
    }

    const bundled = await this._getBundledCatalog();
    if (Array.isArray(bundled) && bundled.length > 0) {
      this._memoryAvatars = bundled;
      return this._memoryAvatars;
    }

    return [];
  }

  filterAvatars(avatars, query = '', category = 'all') {
    if (!Array.isArray(avatars)) return [];
    let list = avatars;

    if (category && category !== 'all') {
      list = list.filter(a => a.category === category);
    }

    const q = (query || '').trim().toLowerCase();
    if (!q) return list;

    const terms = q.split(/\s+/).filter(Boolean);
    return list.filter(a => {
      const target = `${a.name || ''} ${a.game || ''}`.toLowerCase();
      return terms.every(t => target.includes(t));
    });
  }

  searchQuick(query, max = 12) {
    const q = (query || '').trim();
    if (!q) return [];
    const pool = this._memoryAvatars || this._bundledCatalog || [];
    const filtered = this.filterAvatars(pool, q, 'all');
    return filtered.slice(0, max);
  }
}

export const steamAvatarsService = new SteamAvatarsService();
export default steamAvatarsService;
