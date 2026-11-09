/**
 * Steam Badges Service
 * Permite consultar insignias normales (Niveles 1-5) e insignias reflectantes (Foil) de Steam.
 * Catálogo completo de +2,200 insignias oficiales precargadas + búsqueda en vivo en SteamCardExchange.
 */

import { ls } from '../storage.js';

// Dynamic import: steamBadgesCatalog.js se carga de forma perezosa bajo demanda

const CACHE_KEY_PREFIX = 'steam_game_badges_';
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 días

class SteamBadgesService {
  constructor() {
    this._bundled = [];
    this._featuredGames = [];
    this._isBundledLoaded = false;
    this._memoryCache = new Map();
  }

  async _ensureBundledLoaded() {
    if (this._isBundledLoaded) return;
    try {
      const mod = await import('./steamBadgesCatalog.js');
      this._bundled = mod.STEAM_BADGES_CATALOG || mod.default || [];
      this._featuredGames = mod.FEATURED_STEAM_GAMES || [];
      this._isBundledLoaded = true;
    } catch (e) {
      console.warn('[steamBadgesService] Error cargando catálogo de insignias:', e);
    }
  }

  async getFeaturedGames() {
    await this._ensureBundledLoaded();
    return this._featuredGames;
  }

  async getAllBadges() {
    await this._ensureBundledLoaded();
    return this._bundled;
  }

  /**
   * Obtiene las insignias de un juego por su AppID.
   * Primero busca en el catálogo empaquetado, luego en memoria/localStorage, y finalmente vía fetch dinámico.
   */
  async getBadgesForGame(appid, gameName = '') {
    const numericAppId = Number(appid);
    if (!numericAppId) return [];

    // 1. Memoria local
    if (this._memoryCache.has(numericAppId)) {
      return this._memoryCache.get(numericAppId);
    }

    // 2. Asegurar catálogo cargado
    await this._ensureBundledLoaded();
    const bundled = this._bundled.filter(b => b.appid === numericAppId);
    if (bundled.length > 0) {
      this._memoryCache.set(numericAppId, bundled);
      return bundled;
    }

    // 3. LocalStorage
    const cacheKey = `${CACHE_KEY_PREFIX}${numericAppId}`;
    const cached = ls.getJSON(cacheKey);
    if (cached && cached.timestamp && Date.now() - cached.timestamp < CACHE_TTL_MS && Array.isArray(cached.items) && cached.items.length > 0) {
      this._memoryCache.set(numericAppId, cached.items);
      return cached.items;
    }

    // 4. Fetch dinámico desde SteamCardExchange
    try {
      const dynamicBadges = await this._fetchFromScx(numericAppId, gameName);
      if (dynamicBadges && dynamicBadges.length > 0) {
        this._memoryCache.set(numericAppId, dynamicBadges);
        ls.setJSON(`${CACHE_KEY_PREFIX}${numericAppId}`, {
          timestamp: Date.now(),
          items: dynamicBadges
        });
        return dynamicBadges;
      }
    } catch (_) {}

    return [];
  }

  /**
   * Búsqueda en vivo de juegos en SteamCardExchange por nombre
   */
  async searchOnlineGames(query) {
    const q = (query || '').trim();
    if (q.length < 2) return [];

    const scxUrl = `https://www.steamcardexchange.net/api/request.php?SearchGame&q=${encodeURIComponent(q)}`;
    const candidates = [
      scxUrl,
      `https://corsproxy.io/?url=${encodeURIComponent(scxUrl)}`,
      `https://api.allorigins.win/raw?url=${encodeURIComponent(scxUrl)}`
    ];

    for (const url of candidates) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 6000);
        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timeout);
        if (res.ok) {
          const html = await res.text();
          if (html && html.includes('gamepage-appid-')) {
            const matches = [...html.matchAll(/href="[^"]*gamepage-appid-(\d+)"[^>]*>[\s\S]*?<span[^>]*>([^<]+)<\/span>/gi)];
            return matches.map(m => ({
              appid: Number(m[1]),
              name: m[2].trim()
            }));
          }
        }
      } catch (_) {}
    }
    return [];
  }

  /**
   * Scraping / Consulta segura vía CORS proxy para SteamCardExchange
   */
  async _fetchFromScx(appid, gameName) {
    const scxUrl = `https://www.steamcardexchange.net/index.php?gamepage-appid-${appid}`;
    const candidates = [
      scxUrl,
      `https://corsproxy.io/?url=${encodeURIComponent(scxUrl)}`,
      `https://api.allorigins.win/raw?url=${encodeURIComponent(scxUrl)}`
    ];

    let html = '';
    for (const url of candidates) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 6000);
        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timeout);
        if (res.ok) {
          html = await res.text();
          if (html && html.includes('series-1-badges')) break;
        }
      } catch (_) {}
    }

    if (!html) return [];

    const badges = [];

    const badgesIdx = html.indexOf('id="series-1-badges"');
    const foilIdx = html.indexOf('id="series-1-foilbadges"');
    const emoticonsIdx = html.indexOf('id="series-1-emoticons"');

    // 1. Normal badges
    if (badgesIdx !== -1 && foilIdx !== -1) {
      const normalHtml = html.substring(badgesIdx, foilIdx);
      const imgs = [...normalHtml.matchAll(/<img[^>]+src="([^"]+)"[^>]*alt="([^"]*)"/gi)];
      imgs.forEach((m, idx) => {
        const url = m[1];
        const alt = m[2];
        const name = alt.replace(/Series \d+ - /i, '').trim() || `Insignia Nivel ${idx + 1}`;
        badges.push({
          id: `${appid}_lvl_${idx + 1}`,
          appid,
          game: gameName || `Juego Steam (${appid})`,
          name,
          level: `Nivel ${idx + 1}`,
          isFoil: false,
          url
        });
      });
    }

    // 2. Foil badges
    if (foilIdx !== -1) {
      const foilEnd = emoticonsIdx !== -1 ? emoticonsIdx : foilIdx + 4000;
      const foilHtml = html.substring(foilIdx, foilEnd);
      const imgs = [...foilHtml.matchAll(/<img[^>]+src="([^"]+)"[^>]*alt="([^"]*)"/gi)];
      imgs.forEach((m, idx) => {
        const url = m[1];
        const alt = m[2];
        const name = alt.replace(/Series \d+ - /i, '').trim() || 'Insignia Reflectante (Foil)';
        badges.push({
          id: `${appid}_foil${idx > 0 ? '_' + (idx + 1) : ''}`,
          appid,
          game: gameName || `Juego Steam (${appid})`,
          name,
          level: 'Foil',
          isFoil: true,
          url
        });
      });
    }

    return badges;
  }

  filterBadges(badges, query = '', filterType = 'all', appidFilter = null) {
    if (!Array.isArray(badges)) return [];
    let list = badges;

    // Filtro por juego específico si está seleccionado
    if (appidFilter !== null && appidFilter !== undefined && appidFilter !== '') {
      const targetId = Number(appidFilter);
      list = list.filter(b => b.appid === targetId);
    }

    // Filtro por tipo (Normal / Foil)
    if (filterType === 'foil') {
      list = list.filter(b => b.isFoil);
    } else if (filterType === 'normal') {
      list = list.filter(b => !b.isFoil);
    }

    const q = (query || '').trim().toLowerCase();
    if (!q) return list;

    const terms = q.split(/\s+/).filter(Boolean);
    return list.filter(b => {
      const target = `${b.name || ''} ${b.game || ''} ${b.level || ''} ${b.appid || ''}`.toLowerCase();
      return terms.every(t => target.includes(t));
    });
  }
}

export const steamBadgesService = new SteamBadgesService();
export default steamBadgesService;
