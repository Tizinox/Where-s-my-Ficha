/**
 * utils/minecraftHeadsDb.js
 * Base de datos y motor de búsqueda inteligente de cabezas y objetos de Minecraft-Heads.com
 */

// Categorías oficiales de Minecraft-Heads.com con iconos y etiquetas en español
export const HEAD_CATEGORIES = [
  { id: 'all', name: 'Todos', icon: 'boxes', badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' },
  { id: 'humanoid', name: 'Armaduras y Humanoides', icon: 'shield', badgeClass: 'bg-orange-500/20 text-orange-300 border-orange-500/40' },
  { id: 'decoration', name: 'Decoración y Muebles', icon: 'lamp', badgeClass: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' },
  { id: 'blocks', name: 'Bloques y Minerales', icon: 'box', badgeClass: 'bg-blue-500/20 text-blue-300 border-blue-500/40' },
  { id: 'monsters', name: 'Monstruos y Mobs', icon: 'skull', badgeClass: 'bg-purple-500/20 text-purple-300 border-purple-500/40' },
  { id: 'animals', name: 'Animales', icon: 'paw-print', badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/40' },
  { id: 'food-drinks', name: 'Comida y Bebidas', icon: 'utensils', badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
  { id: 'plants', name: 'Plantas y Naturaleza', icon: 'leaf', badgeClass: 'bg-green-500/20 text-green-300 border-green-500/40' },
  { id: 'humans', name: 'Humanos y Guerreros', icon: 'user', badgeClass: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' },
  { id: 'miscellaneous', name: 'Geek y Coleccionables', icon: 'gamepad-2', badgeClass: 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/40' }
];

// Presets recomendados destacados para clic rápido
export const POPULAR_HEAD_PRESETS = [
  { name: 'Melon (sliced)', category: 'plants', hash: '92a86755effd2506d681bf23cd38fff93ce2861ab6ca24886d91e646374c735f', icon: '🍉', n: 'Melon (sliced)', c: 'plants', h: '92a86755effd2506d681bf23cd38fff93ce2861ab6ca24886d91e646374c735f', t: 'Fruit|Sliced|Summer' },
  { name: 'Hamburger', category: 'food-drinks', hash: '8704ce32b03fa7ca74ef3381a1796d66e74ab79ceea260a9c4fe1ec6fcb1', icon: '🍔', n: 'Hamburger', c: 'food-drinks', h: '8704ce32b03fa7ca74ef3381a1796d66e74ab79ceea260a9c4fe1ec6fcb1', t: 'Food|Burger' },
  { name: 'Camera', category: 'decoration', hash: '6cb232b725c8438ae7cc5d08cfccba2c1eb7579f170f074d2839d3752e5', icon: '📷', n: 'Camera', c: 'decoration', h: '6cb232b725c8438ae7cc5d08cfccba2c1eb7579f170f074d2839d3752e5', t: 'Tech|Camera' },
  { name: 'Chest', category: 'decoration', hash: '6f6694b415a45446f254f4b1626dfbc9fd42a399f91a473347f71167ffb45d2', icon: '📦', n: 'Chest', c: 'decoration', h: '6f6694b415a45446f254f4b1626dfbc9fd42a399f91a473347f71167ffb45d2', t: 'Block|Chest' },
  { name: 'Coffee Cup', category: 'food-drinks', hash: 'a127f805a5a1ba48e35cf8147d337d45ba36ce99cf0656ff56f35b2bf2311', icon: '☕', n: 'Coffee Cup', c: 'food-drinks', h: 'a127f805a5a1ba48e35cf8147d337d45ba36ce99cf0656ff56f35b2bf2311', t: 'Drink|Coffee' },
  { name: 'Golden Apple', category: 'food-drinks', hash: 'bf9a764d9435b80a6b7d72c0ecb29094fe5936cf1837a7b8e515d968b5', icon: '🍏', n: 'Golden Apple', c: 'food-drinks', h: 'bf9a764d9435b80a6b7d72c0ecb29094fe5936cf1837a7b8e515d968b5', t: 'Food|Apple|Gold' },
  { name: 'TNT', category: 'blocks', hash: '4c3d08e907d727b22a2ec9eb482a095ad7adfb09d0cb0d70b3b4f61f7d79b69b', icon: '🧨', n: 'TNT', c: 'blocks', h: '4c3d08e907d727b22a2ec9eb482a095ad7adfb09d0cb0d70b3b4f61f7d79b69b', t: 'Block|TNT' },
  { name: 'Golden Crown', category: 'decoration', hash: '298e83b8d4f404845ecdbb5bfb72a6bca233a0ec2b2a6ba9dcf727dbf8c', icon: '👑', n: 'Golden Crown', c: 'decoration', h: '298e83b8d4f404845ecdbb5bfb72a6bca233a0ec2b2a6ba9dcf727dbf8c', t: 'Crown|Gold' },
  { name: 'Pink Axolotl', category: 'animals', hash: '13dbd440ad2f61a15a81e3532ff61168db7570956976cd8ab87063be74c3e808', icon: '🦎', n: 'Pink Axolotl', c: 'animals', h: '13dbd440ad2f61a15a81e3532ff61168db7570956976cd8ab87063be74c3e808', t: 'Animal|Axolotl' },
  { name: 'Creeper', category: 'monsters', hash: 'f4261917f01637144e138a0ab6e5b4f8d9faeb73a6e9a03c2ff5502c77dfa8ba', icon: '💥', n: 'Creeper', c: 'monsters', h: 'f4261917f01637144e138a0ab6e5b4f8d9faeb73a6e9a03c2ff5502c77dfa8ba', t: 'Monster|Creeper' },
  { name: 'Rubik\'s Cube', category: 'miscellaneous', hash: '9fa111246c109796e680a6d1dc79275a5e305e94b1da94d34eb5deca121', icon: '🎲', n: 'Rubik\'s Cube', c: 'miscellaneous', h: '9fa111246c109796e680a6d1dc79275a5e305e94b1da94d34eb5deca121', t: 'Toy|Game' },
  { name: 'Pokeball', category: 'miscellaneous', hash: '7c86cc1c9b68d669527ee673b22cfdc86fb837a1f5ce0bf3ef75ebafadfa8', icon: '🔴', n: 'Pokeball', c: 'miscellaneous', h: '7c86cc1c9b68d669527ee673b22cfdc86fb837a1f5ce0bf3ef75ebafadfa8', t: 'Game|Pokemon' }
];

// Presets en memoria listos inmediatamente para búsqueda rápida
const INITIAL_PRESETS = POPULAR_HEAD_PRESETS.map(p => ({
  n: p.n || p.name,
  c: p.c || p.category,
  h: p.h || p.hash,
  t: p.t || p.name
}));

// Catálogo base reactivo (iniciado con presets rápidos y ampliado bajo demanda con JSON)
export let CORE_MINECRAFT_HEADS = [...INITIAL_PRESETS];
let coreHeadsCache = null;
let isFetchingCore = false;

/**
 * Carga de forma asíncrona la base de datos base (JSON) bajo demanda sin congelar el hilo principal.
 */
export async function loadCoreHeads() {
  if (coreHeadsCache) return coreHeadsCache;
  if (isFetchingCore) return CORE_MINECRAFT_HEADS;

  isFetchingCore = true;
  try {
    const res = await fetch('/data/minecraft-heads-core.json');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        coreHeadsCache = data;
        CORE_MINECRAFT_HEADS = data;
        return coreHeadsCache;
      }
    }
  } catch (err) {
    console.warn('[minecraftHeadsDb] No se pudo cargar el catálogo base JSON, usando presets.', err);
  } finally {
    isFetchingCore = false;
  }
  return CORE_MINECRAFT_HEADS;
}

// Diccionario de sinónimos y traducciones Español ↔ Inglés para búsqueda natural
export const SPANISH_ALIASES = {
  'sandia': 'melon',
  'sandía': 'melon',
  'sandia rebanada': 'melon (sliced)',
  'sandía rebanada': 'melon (sliced)',
  'melon rebanado': 'melon (sliced)',
  'hamburguesa': 'burger',
  'hamburguesas': 'burger',
  'camara': 'camera',
  'cámara': 'camera',
  'cofre': 'chest',
  'pocion': 'potion',
  'poción': 'potion',
  'espada': 'sword',
  'escudo': 'shield',
  'arco': 'bow',
  'flecha': 'arrow',
  'perro': 'dog',
  'perrito': 'puppy',
  'gato': 'cat',
  'gatito': 'kitten',
  'pastel': 'cake',
  'tarta': 'cake',
  'galleta': 'cookie',
  'pan': 'bread',
  'queso': 'cheese',
  'helado': 'ice cream',
  'palomitas': 'popcorn',
  'cerveza': 'beer',
  'vino': 'wine',
  'cafe': 'coffee',
  'café': 'coffee',
  'taza': 'cup',
  'manzana dorada': 'golden apple',
  'manzana': 'apple',
  'calavera': 'skull',
  'corona': 'crown',
  'reloj': 'clock',
  'linterna': 'lantern',
  'vela': 'candle',
  'globo': 'globe',
  'globo terraqueo': 'globe',
  'mochila': 'backpack',
  'corazon': 'heart',
  'corazón': 'heart',
  'estrella': 'star',
  'diamante': 'diamond',
  'esmeralda': 'emerald',
  'oro': 'gold',
  'hierro': 'iron',
  'rana': 'frog',
  'pato': 'duck',
  'zorro': 'fox',
  'pinguino': 'penguin',
  'pingüino': 'penguin',
  'axolote': 'axolotl',
  'ajolote': 'axolotl',
  'abeja': 'bee',
  'loro': 'parrot',
  'lobo': 'wolf',
  'cerdo': 'pig',
  'vaca': 'cow',
  'oveja': 'sheep',
  'conejo': 'rabbit',
  'champinon': 'mushroom',
  'champiñón': 'mushroom',
  'seta': 'mushroom',
  'calabaza': 'pumpkin',
  'antorcha': 'torch',
  'fogata': 'campfire',
  'horno': 'furnace',
  'mesa de crafteo': 'crafting table',
  'portal': 'portal',
  'pocion de curacion': 'potion of healing',
  'moneda': 'coin',
  'auriculares': 'headphones',
  'audifonos': 'headphones',
  'audífonos': 'headphones'
};

// Estado en memoria de la base de datos extendida (lazy-loaded)
let extendedHeadsCache = null;
let isFetchingExtended = false;

/**
 * Carga de forma asíncrona la base de datos extendida de 92,000+ cabezas sin congelar la interfaz.
 */
export async function loadExtendedHeadsDatabase() {
  if (extendedHeadsCache) return extendedHeadsCache;
  if (isFetchingExtended) return coreHeadsCache || CORE_MINECRAFT_HEADS;

  isFetchingExtended = true;
  try {
    const res = await fetch('/data/minecraft-heads-curated.json');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        extendedHeadsCache = data;
        return extendedHeadsCache;
      }
    }
  } catch (err) {
    console.warn('[minecraftHeadsDb] No se pudo cargar el catálogo extendido, usando catálogo base.', err);
  } finally {
    isFetchingExtended = false;
  }
  return coreHeadsCache || CORE_MINECRAFT_HEADS;
}

/**
 * Obtiene la URL de renderizado 3D isométrico transparente para un Hash de textura o Username.
 */
export function getHeadRenderUrl(hashOrUser, size = 128) {
  if (!hashOrUser || !hashOrUser.trim()) return '/favicon.png';
  const clean = hashOrUser.trim();
  if (clean.startsWith('http://') || clean.startsWith('https://') || clean.startsWith('data:')) {
    return clean;
  }
  return `https://mc-heads.net/head/${encodeURIComponent(clean)}/${size}`;
}

/**
 * Extrae hash de textura desde cualquier variante de Base64 de Mojang.
 */
function extractTextureHashFromBase64(str) {
  if (!str) return null;
  const b64Match = str.match(/eyJ[a-zA-Z0-9+/=]{20,}/);
  if (b64Match) {
    try {
      const decoded = typeof atob !== 'undefined' ? atob(b64Match[0]) : Buffer.from(b64Match[0], 'base64').toString('utf8');
      const hashMatch = decoded.match(/textures\.minecraft\.net\/texture\/([a-f0-9]{32,64})/i);
      if (hashMatch) return hashMatch[1];
    } catch (_) {}
  }
  return null;
}

/**
 * Resuelve y extrae el hash de textura a partir de una variedad universal de formatos:
 * - URL directa de minecraft-heads.com (ej: https://minecraft-heads.com/custom-heads/head/20577-melon-sliced)
 * - Comandos modernos 1.20.5+ y legados de Minecraft (/give @p player_head[profile=...] o {SkullOwner:...})
 * - Hash directo de 32 a 64 caracteres hex
 * - URL de texturas de Mojang (ej: http://textures.minecraft.net/texture/92a86755...)
 * - Cadena Base64 de comando (eyJ0ZXh0dXJlcy...)
 * - Nombre de objeto o slug (ej: "Demonshade Helmet", "demonshade-helmet", "Melon (sliced)")
 */
export function resolveMinecraftHeadInput(rawInput) {
  if (!rawInput || !rawInput.trim()) return null;
  const clean = rawInput.trim();

  // 1. Es un hash hexadecimal directo de 32 a 64 caracteres
  if (/^[a-f0-9]{32,64}$/i.test(clean)) {
    return {
      type: 'hash',
      hash: clean,
      name: 'Custom Texture Hash',
      url: getHeadRenderUrl(clean)
    };
  }

  // 2. Es una URL de textures.minecraft.net
  const textureUrlMatch = clean.match(/textures\.minecraft\.net\/texture\/([a-f0-9]{32,64})/i);
  if (textureUrlMatch) {
    return {
      type: 'hash',
      hash: textureUrlMatch[1],
      name: 'Mojang Texture',
      url: getHeadRenderUrl(textureUrlMatch[1])
    };
  }

  // 3. Es un comando Minecraft (/give, /item, SkullOwner, profile) o cadena Base64
  const b64Hash = extractTextureHashFromBase64(clean);
  if (b64Hash) {
    return {
      type: 'hash',
      hash: b64Hash,
      name: 'Minecraft Command Head',
      url: getHeadRenderUrl(b64Hash)
    };
  }

  // 4. Es una URL de minecraft-heads.com con ID y slug (ej: /custom-heads/head/1234-demonshade-helmet)
  const mhUrlMatch = clean.match(/minecraft-heads\.com\/custom-heads\/(?:head\/)?(?:[a-z0-9-]+\/)?([0-9]+)-([a-z0-9-]+)/i);
  if (mhUrlMatch) {
    const slugName = mhUrlMatch[2].replace(/-/g, ' ');
    const matched = searchMinecraftHeads(slugName, 'all', 1);
    if (matched.length > 0) {
      const item = matched[0];
      return {
        type: 'item',
        hash: item.h,
        name: item.n,
        category: item.c,
        tags: item.t,
        url: getHeadRenderUrl(item.h)
      };
    }
    return {
      type: 'slug',
      name: slugName,
      slug: slugName,
      url: '/favicon.png'
    };
  }

  // 5. Es una URL de minecraft-heads.com con hash hexadecimal
  const mhHexMatch = clean.match(/minecraft-heads\.com\/[^\s"'<>]*\/([a-f0-9]{32,64})/i);
  if (mhHexMatch) {
    return {
      type: 'hash',
      hash: mhHexMatch[1],
      name: 'Minecraft-Heads Texture',
      url: getHeadRenderUrl(mhHexMatch[1])
    };
  }

  // 6. Búsqueda por nombre exacto o sinónimo en catálogo
  const exactMatch = searchMinecraftHeads(clean, 'all', 1);
  if (exactMatch.length > 0) {
    const item = exactMatch[0];
    return {
      type: 'item',
      hash: item.h,
      name: item.n,
      category: item.c,
      tags: item.t,
      url: getHeadRenderUrl(item.h)
    };
  }

  return null;
}

/**
 * Busca cabezas en la base de datos aplicando puntuación inteligente, normalización en español,
 * coincidencia exacta, difusa y búsqueda universal sin bloqueos de categoría.
 */
export function searchMinecraftHeads(query, category = 'all', limit = 48) {
  const dataset = extendedHeadsCache || coreHeadsCache || CORE_MINECRAFT_HEADS;

  if (!query || !query.trim()) {
    if (category && category !== 'all') {
      return dataset.filter(x => x.c === category).slice(0, limit);
    }
    return dataset.slice(0, limit);
  }

  let clean = query.trim().toLowerCase();

  // Comprobar sinónimo en español
  for (const [es, en] of Object.entries(SPANISH_ALIASES)) {
    if (clean === es) {
      clean = en;
      break;
    } else if (clean.startsWith(es + ' ')) {
      clean = clean.replace(es, en);
      break;
    }
  }

  const terms = clean.split(/\s+/).filter(Boolean);

  const scored = [];

  for (let i = 0; i < dataset.length; i++) {
    const item = dataset[i];
    const nameLower = (item.n || '').toLowerCase();
    const tagsLower = (item.t || '').toLowerCase();
    let score = 0;

    // Coincidencia de nombre exacta
    if (nameLower === clean) {
      score += 1200;
    } else if (nameLower.startsWith(clean)) {
      score += 600;
    } else if (nameLower.includes(clean)) {
      score += 350;
    }

    // Coincidencia con todos los términos individuales
    if (terms.length > 1) {
      if (terms.every(t => nameLower.includes(t))) {
        score += 280;
      }
    }

    // Coincidencia con etiquetas completas
    if (terms.every(t => tagsLower.includes(t))) {
      score += 160;
    }

    // Coincidencias parciales por término
    for (const t of terms) {
      if (nameLower.includes(t)) {
        score += 70;
      } else if (tagsLower.includes(t)) {
        score += 35;
      }
    }

    if (score > 0) {
      // Priorizar la categoría seleccionada si el usuario tiene una activa
      if (category && category !== 'all' && item.c === category) {
        score += 90;
      }
      scored.push({ item, score });
    }
  }

  // Ordenar por relevancia
  scored.sort((a, b) => b.score - a.score);

  // Desduplicar por hash y limitar
  const uniqueResults = [];
  const seen = new Set();

  for (const r of scored) {
    if (!seen.has(r.item.h)) {
      seen.add(r.item.h);
      uniqueResults.push(r.item);
      if (uniqueResults.length >= limit) break;
    }
  }

  return uniqueResults;
}
