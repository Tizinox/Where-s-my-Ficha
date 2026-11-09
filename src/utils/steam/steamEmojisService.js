/**
 * Steam Emojis Service
 * Maneja paquetes oficiales de emoticonos, búsqueda libre en tiempo real
 * por juego y extracción dinámica desde Steam CDN y SteamCardExchange.
 */

import { ls } from '../storage.js';
import { POPULAR_STEAM_EMOJI_PACKS, POPULAR_STEAM_GAMES_LIST } from './steamEmojisCatalog.js';

const CACHE_KEY_PREFIX = 'steam_game_emojis_';
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 días

class SteamEmojisService {
  constructor() {
    this._memoryCache = new Map();
  }

  getPacks() {
    return POPULAR_STEAM_EMOJI_PACKS;
  }

  getFeaturedGames() {
    return POPULAR_STEAM_GAMES_LIST;
  }

  /**
   * Filtra paquetes precargados según término de búsqueda
   */
  filterPacks(packs, query = '') {
    const q = (query || '').trim().toLowerCase();
    if (!q) return packs;

    return packs.filter(p => {
      if (p.name.toLowerCase().includes(q)) return true;
      if (p.game.toLowerCase().includes(q)) return true;
      if (p.category.toLowerCase().includes(q)) return true;
      return p.emojis.some(e => e.shortcode.toLowerCase().includes(q) || e.name.toLowerCase().includes(q));
    });
  }

  /**
   * Obtiene todos los emoticonos de un juego por su AppID.
   * Utiliza caché en memoria -> localStorage -> fetch dinámico en SteamCardExchange.
   */
  async getEmoticonsForGame(appid, gameName = '') {
    const numericAppId = Number(appid);
    if (!numericAppId) return [];

    // 1. Memoria rápida
    if (this._memoryCache.has(numericAppId)) {
      return this._memoryCache.get(numericAppId);
    }

    // 2. Revisar si coincide con alguno de nuestros packs precargados
    const matchedPack = POPULAR_STEAM_EMOJI_PACKS.find(p => p.appid === numericAppId);
    if (matchedPack && matchedPack.emojis && matchedPack.emojis.length > 0) {
      this._memoryCache.set(numericAppId, matchedPack.emojis);
      return matchedPack.emojis;
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
      const dynamicEmojis = await this._fetchFromScx(numericAppId, gameName);
      if (dynamicEmojis && dynamicEmojis.length > 0) {
        this._memoryCache.set(numericAppId, dynamicEmojis);
        ls.setJSON(cacheKey, {
          timestamp: Date.now(),
          items: dynamicEmojis
        });
        return dynamicEmojis;
      }
    } catch (e) {
      console.warn(`[steamEmojisService] Error buscando emoticonos para AppID ${appid}:`, e);
    }

    return [];
  }

  /**
   * Búsqueda en vivo de juegos en SteamCardExchange
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
   * Extrae los emoticonos de un juego desde la página de SteamCardExchange
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
        const timeout = setTimeout(() => controller.abort(), 7000);
        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timeout);
        if (res.ok) {
          html = await res.text();
          if (html && html.includes('series-1-emoticons')) break;
        }
      } catch (_) {}
    }

    if (!html) return [];

    const emoticonsIdx = html.indexOf('id="series-1-emoticons"');
    if (emoticonsIdx === -1) return [];

    // Limitar el bloque a la sección de emoticonos
    const nextSectionIdx = html.indexOf('id="series-1-backgrounds"', emoticonsIdx);
    const sectionHtml = nextSectionIdx !== -1 
      ? html.substring(emoticonsIdx, nextSectionIdx)
      : html.substring(emoticonsIdx, emoticonsIdx + 20000);

    const emojis = [];
    const seenCodes = new Set();

    // 1. Priorizar extracción de imagen oficial de alta resolución (54px) de Steam
    const highResRegex = /<img[^>]+src="([^"]+community_assets\/images\/items\/[^"]+)"[^>]*alt=":([^:]+):"[\s\S]*?<div[^>]*class="[^"]*text-sm[^"]*"[^>]*>:([^<:]+):<\/div>/gi;
    let match;

    while ((match = highResRegex.exec(sectionHtml)) !== null) {
      const highResUrl = match[1];
      const rawCode = match[2] || match[3];
      const cleanCode = rawCode.replace(/^:+|:+$/g, '').trim().toLowerCase();
      if (!cleanCode || seenCodes.has(cleanCode)) continue;
      seenCodes.add(cleanCode);

      const readableName = cleanCode
        .replace(/[-_]+/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase());

      emojis.push({
        shortcode: cleanCode,
        name: readableName,
        url: highResUrl,
        game: gameName || `Juego Steam (${appid})`,
        appid
      });
    }

    // 2. Fallback si el formato del DOM difiere
    if (emojis.length === 0) {
      const itemRegex = /<img[^>]+src="([^"]+)"[^>]*alt="([^"]*)"[\s\S]*?<div[^>]*class="[^"]*text-sm[^"]*"[^>]*>:?([a-zA-Z0-9_\-]+):?<\/div>/gi;
      while ((match = itemRegex.exec(sectionHtml)) !== null) {
        let rawUrl = match[1];
        const rawCode = match[3] || match[2];
        const cleanCode = rawCode.replace(/^:+|:+$/g, '').trim().toLowerCase();
        if (!cleanCode || seenCodes.has(cleanCode)) continue;
        seenCodes.add(cleanCode);

        // Si la URL es de items de Steam, usarla; si no, CDN oficial
        const finalUrl = rawUrl.includes('community_assets/images/items/')
          ? rawUrl
          : `https://community.steamstatic.com/economy/emoticon/${cleanCode}`;

        const readableName = cleanCode
          .replace(/[-_]+/g, ' ')
          .replace(/\b\w/g, l => l.toUpperCase());

        emojis.push({
          shortcode: cleanCode,
          name: readableName,
          url: finalUrl,
          game: gameName || `Juego Steam (${appid})`,
          appid
        });
      }
    }

    return emojis;
  }
}

export const steamEmojisService = new SteamEmojisService();
export default steamEmojisService;
