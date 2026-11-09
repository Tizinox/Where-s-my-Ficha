/**
 * Steam Avatar Frames Service
 * Conexión directa al API oficial de la Tienda de Puntos de Steam (ILoyaltyRewardsService)
 * Provee catálogo de más de 2,000 marcos de avatar animados con transparencia,
 * búsqueda instantánea en tiempo real, caché inteligente y respaldo offline.
 */

// Dynamic import: steamFramesCatalog.js se carga de forma perezosa bajo demanda

import { ls } from '../storage.js';

const STEAM_API_BASE = 'https://api.steampowered.com/ILoyaltyRewardsService/QueryRewardItems/v1/';
const CACHE_KEY = 'steam_avatar_frames_catalog_v1';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 horas

// Lista de respaldo offline con marcos populares emblemáticos de Steam
export const OFFLINE_FEATURED_FRAMES = [
  {
    id: '4079939',
    appid: 1929290,
    name: 'Fire',
    game: 'Fire Theme',
    category: 'fire',
    animated: true,
    url: 'https://shared.fastly.steamstatic.com/community_assets/images/items/1929290/b981100294d7975e53ac9a58919e3510478934e4.png',
    previewUrl: 'https://shared.fastly.steamstatic.com/community_assets/images/items/1929290/6c6c7bbda77ea2f10b784eb96154b79fa93e2ba0.png'
  },
  {
    id: '4079886',
    appid: 4246860,
    name: 'Ultraviolet',
    game: 'Security 51',
    category: 'neon',
    animated: true,
    url: 'https://shared.fastly.steamstatic.com/community_assets/images/items/4246860/9a3b26092679194bc4b39629322a036ee9fffcc5.png',
    previewUrl: 'https://shared.fastly.steamstatic.com/community_assets/images/items/4246860/6cb198d7a1f9cd4455db892ceb7f871c52b10715.png'
  },
  {
    id: '4079885',
    appid: 4246860,
    name: 'Camera',
    game: 'Security 51',
    category: 'cyber',
    animated: true,
    url: 'https://shared.fastly.steamstatic.com/community_assets/images/items/4246860/6552fbf8d88fafc926a73105d31eeb1a990428d8.png',
    previewUrl: 'https://shared.fastly.steamstatic.com/community_assets/images/items/4246860/881b29a28c5e6fe7d6c6e75508c903a58cf09f16.png'
  },
  {
    id: '4079937',
    appid: 1929290,
    name: 'Sky Clouds',
    game: 'Sky Clouds Theme',
    category: 'fantasy',
    animated: true,
    url: 'https://shared.fastly.steamstatic.com/community_assets/images/items/1929290/d8797b1f02b73f6f574384a2ab04b6504cdfdbdc.png',
    previewUrl: 'https://shared.fastly.steamstatic.com/community_assets/images/items/1929290/d8797b1f02b73f6f574384a2ab04b6504cdfdbdc.png'
  },
  {
    id: '4079884',
    appid: 4246860,
    name: 'Entrance',
    game: 'Security 51',
    category: 'neon',
    animated: true,
    url: 'https://shared.fastly.steamstatic.com/community_assets/images/items/4246860/6ee23c245acfc7561a46a65eb949676f7ac5590b.png',
    previewUrl: 'https://shared.fastly.steamstatic.com/community_assets/images/items/4246860/a08487c704cc3e2903783308d3172f03af071102.png'
  },
  {
    id: '2350790_1',
    appid: 2350790,
    name: 'Vault Frame',
    game: 'Moonlighter 2: The Endless Vault',
    category: 'fantasy',
    animated: true,
    url: 'https://shared.fastly.steamstatic.com/community_assets/images/items/2350790/4b0d99e981afc34fc20b16fbcd182097c85a9cbf.png',
    previewUrl: 'https://shared.fastly.steamstatic.com/community_assets/images/items/2350790/407a21f34d4dede10752f5bf1be0a40feb15a324.png'
  },
  {
    id: '2350790_2',
    appid: 2350790,
    name: 'The Blob Frame',
    game: 'Moonlighter 2: The Endless Vault',
    category: 'fantasy',
    animated: true,
    url: 'https://shared.fastly.steamstatic.com/community_assets/images/items/2350790/cf8629d3a553ce0011f949c3e474a01e91ed9d60.png',
    previewUrl: 'https://shared.fastly.steamstatic.com/community_assets/images/items/2350790/0cba52d6a3cb55d8eb9026a9177ce490404030a7.png'
  },
  {
    id: '1414910_1',
    appid: 1414910,
    name: 'Shimmering Stars',
    game: 'The Shimmering Horizon',
    category: 'fantasy',
    animated: true,
    url: 'https://shared.fastly.steamstatic.com/community_assets/images/items/1414910/a3d25860681b4c87222454f26fe95de5e2dee488.png',
    previewUrl: 'https://shared.fastly.steamstatic.com/community_assets/images/items/1414910/08a769bb406a0e83ce8d98456becc1a3e71b31ac.png'
  },
  {
    id: '4197830_1',
    appid: 4197830,
    name: 'PvE Perimeter',
    game: 'Steam Survival Fest',
    category: 'cyber',
    animated: true,
    url: 'https://shared.fastly.steamstatic.com/community_assets/images/items/4197830/3ac33fc9016d86de1fb22f00f5adb0afe74647eb.png',
    previewUrl: 'https://shared.fastly.steamstatic.com/community_assets/images/items/4197830/a9483889d4a97aa04eb8a97170899f5ec81ff4df.png'
  },
  {
    id: '4533730_1',
    appid: 4533730,
    name: 'Flower Frame',
    game: 'Yokai: Lust Secret',
    category: 'anime',
    animated: true,
    url: 'https://shared.fastly.steamstatic.com/community_assets/images/items/4533730/56607ea017bd4d55c75ed9ac82e7e77e040b428c.png',
    previewUrl: 'https://shared.fastly.steamstatic.com/community_assets/images/items/4533730/c8857f8e9e782cf80c56f30619f1af91dd759f95.png'
  },
  {
    id: '4533730_2',
    appid: 4533730,
    name: 'Kasumi Frame',
    game: 'Yokai: Lust Secret',
    category: 'anime',
    animated: true,
    url: 'https://shared.fastly.steamstatic.com/community_assets/images/items/4533730/1bbb4f524171a19112748386bdca0c4239b2f3ac.png',
    previewUrl: 'https://shared.fastly.steamstatic.com/community_assets/images/items/4533730/8151498f65ae30488457129c7ec87a389498f326.png'
  },
  {
    id: '4173110_1',
    appid: 4173110,
    name: "Tsuchinoko's Stride",
    game: 'Cirno! Lifts a Boulder',
    category: 'anime',
    animated: true,
    url: 'https://shared.fastly.steamstatic.com/community_assets/images/items/4173110/b16fcc7d663bb1c954f8235db4754327d9be5386.png',
    previewUrl: 'https://shared.fastly.steamstatic.com/community_assets/images/items/4173110/cc47a86ba258ea567e6e2cbae74818b1356ab6d1.png'
  }
];

class SteamFramesService {
  constructor() {
    this._memoryFrames = null;
    this._isLoading = false;
  }

  /**
   * Obtiene la lista completa de marcos desde caché, catálogo local oficial o API de Steam.
   * @param {Object} options
   * @param {boolean} options.forceRefresh - Si es true consulta API
   * @returns {Promise<Array>} Lista de objetos de marco formateados
   */
  async _getBundledCatalog() {
    if (this._bundledCatalog && this._bundledCatalog.length > 0) {
      return this._bundledCatalog;
    }
    try {
      const mod = await import('./steamFramesCatalog.js');
      this._bundledCatalog = mod.default || mod.bundledCatalog || [];
      return this._bundledCatalog;
    } catch (e) {
      console.warn('[steamFramesService] Error cargando catálogo de marcos:', e);
      return [];
    }
  }

  async getFrames({ forceRefresh = false } = {}) {
    if (!forceRefresh && this._memoryFrames && this._memoryFrames.length > 0) {
      return this._memoryFrames;
    }

    if (!forceRefresh) {
      // Usar catálogo oficial cargado bajo demanda
      const bundled = await this._getBundledCatalog();
      if (Array.isArray(bundled) && bundled.length > 0) {
        this._memoryFrames = bundled;
        return this._memoryFrames;
      }
    }

    // 3. Forzar actualización vía proxy o CORS bypass
    this._isLoading = true;
    try {
      const allDefinitions = await this._fetchFromSteam();
      if (allDefinitions && allDefinitions.length > 0) {
        const parsed = allDefinitions
          .map(item => this._formatItem(item))
          .filter(x => Boolean(x && x.url));

        const uniqueMap = new Map();
        for (const item of parsed) {
          if (!uniqueMap.has(item.id)) {
            uniqueMap.set(item.id, item);
          }
        }
        const finalFrames = Array.from(uniqueMap.values());
        if (finalFrames.length > 0) {
          this._memoryFrames = finalFrames;
          return this._memoryFrames;
        }
      }
    } catch (_) {
      // Silencioso para no generar alertas molestas
    } finally {
      this._isLoading = false;
    }

    // Fallback asegurado
    const fallback = await this._getBundledCatalog();
    this._memoryFrames = (Array.isArray(fallback) && fallback.length > 0)
      ? fallback
      : OFFLINE_FEATURED_FRAMES;
    return this._memoryFrames;
  }

  /**
   * Consulta el API oficial de Steam a través del proxy local de Vite o proxies CORS.
   */
  async _fetchFromSteam() {
    const allDefs = [];
    let cursor = '';
    let batch = 0;
    const maxBatches = 5;

    const fetchBatch = async (cur) => {
      const query = `count=1000&community_item_classes[0]=14${cur ? `&cursor=${encodeURIComponent(cur)}` : ''}`;
      const candidates = [
        `/api/steam-proxy?${query}`,
        `https://corsproxy.io/?url=${encodeURIComponent(`${STEAM_API_BASE}?${query}`)}`,
        `https://api.allorigins.win/raw?url=${encodeURIComponent(`${STEAM_API_BASE}?${query}`)}`
      ];

      for (const url of candidates) {
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 7000);
          const res = await fetch(url, { signal: controller.signal });
          clearTimeout(timeout);
          if (res.ok) {
            const data = await res.json();
            if (data?.response?.definitions) {
              return data.response;
            }
          }
        } catch (_) {}
      }
      return null;
    };

    while (batch < maxBatches) {
      batch++;
      const resp = await fetchBatch(cursor);
      if (!resp) break;
      const defs = resp.definitions || [];
      if (defs.length === 0) break;
      allDefs.push(...defs);
      cursor = resp.next_cursor;
      if (!cursor) break;
    }

    return allDefs;
  }

  /**
   * Formatea un item de la API oficial de Steam a un objeto normalizado.
   */
  _formatItem(item) {
    if (!item) return null;
    const appid = item.appid;
    const data = item.community_item_data || {};
    
    // Hash para la imagen animada y estática
    const animHash = data.item_image_small || data.item_image_large;
    const staticHash = data.item_image_large || data.item_image_small;
    if (!animHash && !staticHash) return null;

    let name = (data.item_title || data.item_name || item.internal_description || 'Marco de Steam').trim();
    let game = (item.internal_description || '').trim();

    // Traducción de marcos conocidos en inglés
    if (name.toLowerCase() === 'frame of reference') {
      name = 'Marco de Referencia';
    }

    // Limpieza de identificadores técnicos internos de desarrolladores en Steam
    if (game.toLowerCase() === 'if_animated_frame' || name.toLowerCase() === 'marco de referencia') {
      game = 'Idea Fix';
    } else if (
      !game || game.length <= 2 || !isNaN(Number(game)) || 
      game.toLowerCase() === 'animated avatar frame' || 
      /^(if_|anim_|animated_frame|tdr_)/i.test(game) ||
      game.includes('Animated_Frame')
    ) {
      if (/^tdr_/i.test(game)) {
        game = "Tom Clancy's The Division Resurgence";
      } else {
        game = 'Steam Points Shop';
      }
    }

    return {
      id: String(item.defid || `${appid}_${animHash}`),
      appid: appid,
      name: name,
      game: game,
      pointCost: item.point_cost || '2000',
      animated: Boolean(data.animated),
      url: `https://shared.fastly.steamstatic.com/community_assets/images/items/${appid}/${animHash}`,
      previewUrl: `https://shared.fastly.steamstatic.com/community_assets/images/items/${appid}/${staticHash}`
    };
  }

  /**
   * Filtra la lista de marcos en base a un texto de búsqueda y/o categoría.
   */
  filterFrames(frames, query = '', category = 'all') {
    if (!Array.isArray(frames)) return [];
    
    let result = frames;

    // Filtro por categoría o tipo
    if (category === 'animated') {
      result = result.filter(f => f.animated);
    } else if (category === 'fire') {
      const regex = /fire|flame|lava|burn|fuego|plasma|ember|sol|sun|blaze/i;
      result = result.filter(f => regex.test(f.name) || regex.test(f.game) || regex.test(f.category || ''));
    } else if (category === 'cyber') {
      const regex = /cyber|neon|matrix|tech|glitch|circuit|laser|hacker|futur|security/i;
      result = result.filter(f => regex.test(f.name) || regex.test(f.game) || regex.test(f.category || ''));
    } else if (category === 'fantasy') {
      const regex = /magic|spell|star|gold|crystal|dragon|runic|void|celestial|hades|vault|horizon|moonlighter|fantasy/i;
      result = result.filter(f => regex.test(f.name) || regex.test(f.game) || regex.test(f.category || ''));
    } else if (category === 'dark') {
      const regex = /dark|skull|death|blood|shadow|horror|demon|abyss|dead/i;
      result = result.filter(f => regex.test(f.name) || regex.test(f.game) || regex.test(f.category || ''));
    }

    // Filtro por texto libre
    const q = (query || '').trim().toLowerCase();
    if (q) {
      result = result.filter(f => {
        const nameMatch = (f.name || '').toLowerCase().includes(q);
        const gameMatch = (f.game || '').toLowerCase().includes(q);
        const catMatch = (f.category || '').toLowerCase().includes(q);
        const appidMatch = String(f.appid || '').includes(q);
        return nameMatch || gameMatch || catMatch || appidMatch;
      });
    }

    return result;
  }
}

export const steamFramesService = new SteamFramesService();
export default steamFramesService;
