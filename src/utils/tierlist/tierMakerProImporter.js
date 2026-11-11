/**
 * utils/tierlist/tierMakerProImporter.js
 * Motor de importación directa de plantillas desde tiermakerpro.com
 * Permite pegar cualquier enlace de TierMaker Pro (ej: /templates/... o /make-list/?template=...),
 * resuelve la plantilla mediante universalFetch (proxy local en desarrollo o lectores CORS) y extrae:
 *  1. Título de la Tier List
 *  2. Rangos estándar de TierMaker Pro (S, A, B, C, D) con sus colores canónicos
 *  3. Catálogo completo de imágenes con resolución WebP nativa y proxy wsrv.nl para el pool de operativos.
 */

import { DEFAULT_TIERS } from '../../store/tierlist/constants.js';
import { universalFetch } from '../mediaUrlEngine.js';

// Cache en memoria para el bundle compilado de templateService y evitar re-descargas del bundle de 1.5MB
let cachedServiceJs = null;
let cachedServiceUrl = null;

/**
 * Tiers estándar canónicos de TierMaker Pro con su paleta de colores oficial.
 */
export const TIERMAKERPRO_DEFAULT_TIERS = [
  { id: 'tier_s', name: 'S', color: '#ff7f7f' },
  { id: 'tier_a', name: 'A', color: '#ffbf7f' },
  { id: 'tier_b', name: 'B', color: '#ffdf7f' },
  { id: 'tier_c', name: 'C', color: '#ffff7f' },
  { id: 'tier_d', name: 'D', color: '#bfff7f' }
];

/**
 * Extrae slug y categoría de una URL de TierMaker Pro.
 * @param {string} rawUrl
 * @returns {{ category: string, slug: string }}
 */
export function extractTierMakerProSlug(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return { category: '', slug: '' };
  const clean = rawUrl.trim();

  try {
    const parsed = new URL(clean);
    if (parsed.searchParams.has('template')) {
      return { category: '', slug: parsed.searchParams.get('template') || '' };
    }
  } catch (e) {}

  // Ejemplos:
  // https://tiermakerpro.com/templates/anime/Jujutsu-Kaisen/
  // https://tiermakerpro.com/templates/film/Marvel-characters/
  // https://tiermakerpro.com/templates/superheroes/
  const match = clean.match(/templates\/([^\/\s?#]+)\/([^\/\s?#]+)/i) ||
                clean.match(/templates\/([^\/\s?#]+)/i);

  if (match) {
    if (match[2]) {
      return { category: match[1], slug: match[2] };
    }
    return { category: '', slug: match[1] };
  }

  const parts = clean.replace(/^[a-z]+:\/\/[^\/]+\//i, '').replace(/\/+$/, '').split('?')[0].split('/');
  return { category: '', slug: parts[parts.length - 1] || clean };
}

/**
 * Limpia y normaliza el título detectado para la Tier List de TierMaker Pro.
 */
export function cleanTierMakerProTitle(rawTitle, slug) {
  if (rawTitle && typeof rawTitle !== 'string') return 'Tier List TierMaker Pro';
  let t = (rawTitle || '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s*-\s*TierMaker\s*Pro.*$/i, '')
    .replace(/\s*\|\s*TierMaker\s*Pro.*$/i, '')
    .replace(/^title:\s*/i, '')
    .replace(/^#\s*/i, '')
    .replace(/tier list maker/gi, '')
    .replace(/template/gi, '')
    .trim();

  if (t.length >= 2) return t;

  if (slug) {
    return slug
      .replace(/[-_]+/g, ' ')
      .trim()
      .split(' ')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ') + ' Tier List';
  }

  return 'Tier List TierMaker Pro';
}

/**
 * Limpia el nombre del personaje extrayendo texto legible o cruzándolo con el structured data de JSON-LD.
 */
export function cleanTierMakerProItemName(rawName, ldNames = [], index = 1) {
  if (!rawName || typeof rawName !== 'string') {
    return `Personaje #${index}`;
  }

  // Quitar prefijo de numeración (ej: "021-fushiguro-toji" -> "fushiguro toji")
  let clean = rawName
    .replace(/^\d+[-_]/, '')
    .replace(/[-_]+/g, ' ')
    .trim();

  // Intentar emparejar con los nombres reales de JSON-LD
  if (ldNames && ldNames.length > 0) {
    const cleanLower = clean.toLowerCase();
    const cleanNoSpaces = cleanLower.replace(/\s+/g, '');

    const directMatch = ldNames.find(n => {
      const nLower = n.toLowerCase();
      const nNoSpaces = nLower.replace(/\s+/g, '');
      return nLower === cleanLower || nNoSpaces === cleanNoSpaces || nLower.includes(cleanLower) || cleanLower.includes(nLower);
    });

    if (directMatch) {
      return directMatch;
    }
  }

  // Formato Capitalizado (Title Case)
  return clean
    .split(' ')
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Obtiene el código fuente del bundle templateService de tiermakerpro.com.
 * Utiliza cache para no re-descargar los ~1.5MB en cada consulta.
 */
async function getTierMakerProServiceJs(indexJsPath) {
  if (cachedServiceJs && cachedServiceUrl === indexJsPath) {
    return cachedServiceJs;
  }

  try {
    const indexRes = await universalFetch(`https://tiermakerpro.com${indexJsPath}`, {
      signal: AbortSignal.timeout(8000)
    });
    if (!indexRes.ok) return null;
    const indexJs = await indexRes.text();

    const serviceMatch = indexJs.match(/assets\/templateService-[^"']+\.js/);
    if (!serviceMatch) return null;

    const serviceRes = await universalFetch(`https://tiermakerpro.com/${serviceMatch[0]}`, {
      signal: AbortSignal.timeout(12000)
    });
    if (!serviceRes.ok) return null;

    cachedServiceJs = await serviceRes.text();
    cachedServiceUrl = indexJsPath;
    return cachedServiceJs;
  } catch (e) {
    console.warn('[tierMakerProImporter] Error al obtener templateService bundle:', e);
    return null;
  }
}

/**
 * Analiza e importa una plantilla de tiermakerpro.com a partir de su URL.
 * @param {string} targetUrl
 * @returns {Promise<{
 *   success: boolean,
 *   source: string,
 *   title: string,
 *   slug: string,
 *   customTiers: Array<{ id: string, name: string, color: string }>,
 *   defaultTiers: Array<{ id: string, name: string, color: string }>,
 *   hasCustomTiers: boolean,
 *   tiers: Array<{ id: string, name: string, color: string }>,
 *   items: Array<{ id: string, name: string, originalUrl: string, avatarDataUrl: string }>,
 *   totalCount: number
 * }>}
 */
export async function fetchAndParseTierMakerProTemplate(targetUrl) {
  if (!targetUrl || typeof targetUrl !== 'string') {
    throw new Error('URL de TierMaker Pro no válida.');
  }

  const cleanUrl = targetUrl.trim();
  const { category, slug } = extractTierMakerProSlug(cleanUrl);

  if (!slug) {
    throw new Error('No se pudo identificar la plantilla en la URL de TierMaker Pro proporcionada.');
  }

  // 1. Descargar página HTML de la plantilla
  let html = '';
  try {
    const res = await universalFetch(cleanUrl, {
      headers: { 'Accept': 'text/html,application/xhtml+xml,application/xml' },
      signal: AbortSignal.timeout(10000)
    });
    if (res.ok) {
      html = await res.text();
    }
  } catch (e) {
    throw new Error(`No se pudo conectar con tiermakerpro.com: ${e.message || 'Error de red'}`);
  }

  if (!html || html.length < 200) {
    throw new Error('La respuesta de tiermakerpro.com fue vacía o inaccesible.');
  }

  // 2. Extraer Título y Nombres desde JSON-LD Structured Data
  let pageTitle = '';
  let ldItems = [];
  const ldMatch = html.match(/id="static-route-structured-data"[^>]*>([\s\S]*?)<\/script>/i);
  if (ldMatch) {
    try {
      const ldData = JSON.parse(ldMatch[1]);
      const graph = ldData['@graph'] || (Array.isArray(ldData) ? ldData : [ldData]);
      for (const node of graph) {
        if (node['@type'] === 'ItemPage' && node.name) {
          pageTitle = node.name;
        }
        if (node['@type'] === 'ItemList' && Array.isArray(node.itemListElement)) {
          ldItems = node.itemListElement.map(item => item.name || '').filter(Boolean);
        }
      }
    } catch (e) {}
  }

  // Fallback de título desde <title> o meta og:title
  if (!pageTitle) {
    const ogTitle = html.match(/<meta property="og:title" content="([^"]+)"/i) || html.match(/<title>([^<]+)<\/title>/i);
    if (ogTitle) {
      pageTitle = ogTitle[1];
    }
  }

  const finalTitle = cleanTierMakerProTitle(pageTitle, slug);

  // 3. Localizar index-*.js y templateService-*.js
  const indexMatch = html.match(/\/assets\/index-[^"']+\.js/);
  if (!indexMatch) {
    throw new Error('No se pudo localizar el bundle de activos de tiermakerpro.com.');
  }

  const serviceJs = await getTierMakerProServiceJs(indexMatch[0]);
  if (!serviceJs) {
    throw new Error('No se pudo descargar el catálogo de plantillas de tiermakerpro.com.');
  }

  // 4. Buscar la plantilla por slug en serviceJs
  const slugClean = slug.replace(/\/+$/, '');
  const slugRegex = new RegExp(`routeSegment:["']${slugClean}["']|id:["']${slugClean.toLowerCase()}["']`, 'i');
  const slugPos = serviceJs.search(slugRegex);

  if (slugPos === -1) {
    throw new Error(`La plantilla "${slugClean}" no fue encontrada en el catálogo de TierMaker Pro.`);
  }

  // Tomar el bloque donde se define la plantilla
  const chunk = serviceJs.slice(Math.max(0, slugPos - 1200), slugPos + 3500);

  // Extraer carpetas de categoría y plantilla
  const assetsMatch = chunk.match(/categoryFolderName:["']([^"']+)["'],folderName:["']([^"']+)["']/i);
  const catFolder = assetsMatch ? assetsMatch[1] : category;
  const folder = assetsMatch ? assetsMatch[2] : '';

  if (!folder) {
    throw new Error(`No se pudo resolver la estructura de imágenes para la plantilla "${slugClean}".`);
  }

  // 5. Mapear todas las imágenes de la plantilla en serviceJs
  // Formato: "../assets/picture/Anime/Jujutsu Kaisen/Itadori Yuji.webp": Is
  const mappingPrefix = `../assets/picture/${catFolder}/${folder}/`;
  const mappingEscaped = mappingPrefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const mappingRegex = new RegExp(`"${mappingEscaped}([^"]+)\\.webp":([a-zA-Z0-9_$]+)`, 'g');

  const rawMappedItems = [];
  let mapMatch;
  while ((mapMatch = mappingRegex.exec(serviceJs)) !== null) {
    const rawItemName = mapMatch[1];
    const varName = mapMatch[2];

    // Buscar definición de la variable al inicio del bundle: const Is="/assets/Itadori Yuji-DClaPD1E.webp"
    const varRegex = new RegExp(`\\b${varName}="(\\/assets\\/[^"]+)"`);
    const varMatch = serviceJs.match(varRegex);
    const assetPath = varMatch ? varMatch[1] : null;

    if (assetPath) {
      rawMappedItems.push({
        name: rawItemName,
        assetPath
      });
    }
  }

  if (rawMappedItems.length === 0) {
    throw new Error(`No se encontraron imágenes válidas para la plantilla "${finalTitle}".`);
  }

  // 6. Construir lista de operativos para la Tier List
  const items = rawMappedItems.map((item, idx) => {
    const prettyName = cleanTierMakerProItemName(item.name, ldItems, idx + 1);
    const directUrl = `https://tiermakerpro.com${item.assetPath}`;
    const proxyUrl = `https://wsrv.nl/?url=${encodeURIComponent(directUrl)}&output=webp`;

    return {
      id: `guest_tmp_${Date.now()}_${idx + 1}_${Math.random().toString(36).substr(2, 4)}`,
      name: prettyName,
      originalUrl: directUrl,
      avatarDataUrl: proxyUrl
    };
  });

  const tiers = TIERMAKERPRO_DEFAULT_TIERS.map(t => ({ ...t }));

  return {
    success: true,
    source: 'tiermakerpro',
    title: finalTitle,
    slug: slugClean,
    customTiers: tiers,
    defaultTiers: tiers,
    hasCustomTiers: true,
    tiers,
    items,
    totalCount: items.length
  };
}

