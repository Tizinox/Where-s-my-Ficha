/**
 * utils/tierlist/tierMakerImporter.js
 * Motor de importación directa de plantillas desde tiermaker.com
 * Permite pegar cualquier enlace de TierMaker, resuelve la plantilla mediante
 * bypass de CORS/Cloudflare (Jina Reader / Proxies) y extrae:
 *  1. Título de la Tier List
 *  2. Rangos / Filas originales
 *  3. Catálogo completo de imágenes con nombres limpios y proxy CORS de alto rendimiento.
 */

import { DEFAULT_TIERS } from '../../store/tierlist/constants.js';
import { fetchAndParseTierBuddyTemplate } from './tierBuddyImporter.js';

export { fetchAndParseTierBuddyTemplate };

/**
 * Extrae el slug identificador de una URL de TierMaker o texto pegado.
 * @param {string} inputUrl 
 * @returns {string} slug limpio de la plantilla
 */
export function extractTierMakerSlug(inputUrl) {
  if (!inputUrl || typeof inputUrl !== 'string') return '';
  let url = inputUrl.trim();

  // Caso: https://tiermaker.com/create/anime-tier-list-2024-491544
  // Caso: https://tiermaker.com/categories/anime/anime-tier-list-2024-491544
  // Caso: https://tiermaker.com/tier-list/anime-tier-list-2024-491544
  const slugMatch = url.match(/(?:create|categories\/[^\/\s?#]+|tier-list)\/([a-zA-Z0-9_-]+)/i);
  if (slugMatch && slugMatch[1]) {
    return slugMatch[1];
  }

  // Caso: el usuario pegó directamente el slug (ej: anime-tier-list-2024-491544)
  const clean = url.replace(/^[a-z]+:\/\/[^\/]+\//i, '').replace(/\/+$/, '').split('?')[0].split('#')[0];
  const parts = clean.split('/');
  return parts[parts.length - 1] || clean;
}

/**
 * Limpia y normaliza el título detectado para la Tier List.
 */
export function cleanTierListTitle(rawTitle, slug) {
  if (rawTitle && typeof rawTitle === 'string') {
    let t = rawTitle
      .replace(/^title:\s*/i, '')
      .replace(/^#+\s*/i, '')
      .replace(/^create an?\s+/i, '')
      .replace(/tier list maker/gi, '')
      .replace(/tier list/gi, '')
      .replace(/template/gi, '')
      .replace(/-\s*tiermaker$/i, '')
      .replace(/[()]/g, '')
      .replace(/["'<>]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (t.length >= 2 && !/^[^a-zA-Z0-9]+$/.test(t) && !/^[0-9a-f]{6,}$/i.test(t)) {
      return t;
    }
  }

  if (slug) {
    // Generar título a partir del slug (ej: aut-60-abilities-19561348 -> Aut 60 Abilities)
    return slug
      .replace(/-\d{4,}$/, '')
      .replace(/tier-list/gi, '')
      .replace(/[-_]+/g, ' ')
      .trim()
      .split(' ')
      .filter(Boolean)
      .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ') || 'Tier List Importada';
  }

  return 'Tier List Importada';
}

/**
 * Limpia el nombre del operativo a partir de la URL del archivo de imagen en TierMaker.
 */
export function cleanItemName(rawUrl, fallbackTitle = 'Operativo', index = 1) {
  try {
    const filename = rawUrl.split('/').pop().replace(/\.[^.]+$/, '');
    let clean = decodeURIComponent(filename)
      // Remover prefijos comunes de TierMaker: zzzzz-171029498291-, 1-, 02-
      .replace(/^[a-z0-9_-]*\d{7,}[a-z0-9_-]*-/i, '')
      .replace(/^\d+-+/, '')
      .replace(/^custom/i, '')
      .replace(/portrait$/i, '')
      .replace(/hphoverpng$/i, '')
      .replace(/png$/i, '')
      .replace(/[-_]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // Si es un hash MD5 sin sentido legible (ej: d95ac780fecb253925e9c2ecdf45ef60)
    if (/^[a-f0-9]{24,36}(?:\s+\d+)?$/i.test(clean)) {
      return `${fallbackTitle} #${index}`;
    }

    if (clean.length > 0 && !/^\d+$/.test(clean)) {
      return clean.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    }
  } catch (e) {}

  return `${fallbackTitle} #${index}`;
}

/**
 * Extrae los niveles sugeridos desde el contenido si están presentes.
 */
/**
 * Convierte colores rgb(...) o rgba(...) a formato hexadecimal (#rrggbb).
 */
export function rgbToHex(rgbStr) {
  if (!rgbStr) return '#3b82f6';
  if (rgbStr.startsWith('#')) return rgbStr;
  const match = rgbStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  if (match) {
    const r = Math.max(0, Math.min(255, parseInt(match[1], 10))).toString(16).padStart(2, '0');
    const g = Math.max(0, Math.min(255, parseInt(match[2], 10))).toString(16).padStart(2, '0');
    const b = Math.max(0, Math.min(255, parseInt(match[3], 10))).toString(16).padStart(2, '0');
    return `#${r}${g}${b}`;
  }
  return rgbStr;
}

/**
 * Extrae los niveles personalizados desde el contenido (HTML o Markdown).
 * Devuelve un array de tiers con títulos y colores exactos si existen en la plantilla.
 */
export function extractTiersFromContent(content) {
  if (!content || typeof content !== 'string') return [];

  const tiers = [];
  const defaultColors = ['#ef4444', '#f97316', '#eab308', '#10b981', '#06b6d4', '#8b5cf6', '#ec4899', '#64748b'];

  // 1. Detección en Markdown: Bloque de títulos entre enlaces sociales y primeras imágenes
  const lines = content.split('\n').map(l => l.trim()).filter(Boolean);
  let startIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('Share on Twitter') || line.includes('Share Template on Facebook') || line.includes('Share on FB')) {
      startIndex = i + 1;
      break;
    }
  }

  if (startIndex === -1) {
    for (let i = 0; i < Math.min(lines.length, 50); i++) {
      if (lines[i].startsWith('# ') && lines[i].toLowerCase().includes('tier list')) {
        startIndex = i + 1;
        break;
      }
    }
  }

  if (startIndex !== -1) {
    for (let i = startIndex; i < Math.min(lines.length, startIndex + 30); i++) {
      const line = lines[i];
      if (line.includes('📌 Pin Images') || line.includes('![Image') || line.includes('Download the TierMaker') || line.includes('### ') || line.includes('#### ')) {
        break;
      }
      if (line.startsWith('[') && line.endsWith(')')) continue;
      if (line.startsWith('http')) continue;
      if (line.length > 0 && line.length < 80) {
        const color = defaultColors[tiers.length % defaultColors.length];
        tiers.push({
          id: `tier_tm_${tiers.length}_${Date.now()}`,
          label: line,
          color,
          colorType: 'solid',
          solidColor: color,
          characterIds: []
        });
      }
    }
  }

  // 2. Detección en HTML: Elementos .label-holder con su background-color exacto
  if (tiers.length === 0) {
    const holderRegex = /<div[^>]*class="[^"]*label-holder[^"]*"[^>]*style="[^"]*background-color:\s*([^;"]+)[^"]*"[^>]*>[\s\S]*?<span[^>]*class="label"[^>]*>([\s\S]*?)<\/span>[\s\S]*?<\/div>/gi;
    let m;
    let idx = 0;
    while ((m = holderRegex.exec(content)) !== null) {
      const color = rgbToHex(m[1].trim());
      const rawLabel = m[2].replace(/<[^>]+>/g, '').trim();
      if (rawLabel) {
        tiers.push({
          id: `tier_tm_${idx}_${Date.now()}`,
          label: rawLabel,
          color,
          colorType: 'solid',
          solidColor: color,
          characterIds: []
        });
        idx++;
      }
    }
  }

  // 3. Si aún no hay tiers, probar la secuencia clásica de una letra (S, A, B, C, D, E)
  if (tiers.length === 0) {
    const canonicalSet = new Set(['S', 'A', 'B', 'C', 'D', 'E', 'F']);
    const colorMap = {
      'S': '#ef4444',
      'A': '#f97316',
      'B': '#eab308',
      'C': '#10b981',
      'D': '#06b6d4',
      'E': '#8b5cf6',
      'F': '#ec4899'
    };

    for (let i = 0; i < Math.min(lines.length, 80); i++) {
      const line = lines[i].toUpperCase();
      if (canonicalSet.has(line) && !tiers.some(t => t.label === line)) {
        tiers.push({
          id: `tier_tm_${line.toLowerCase()}_${Date.now()}_${tiers.length}`,
          label: line,
          color: colorMap[line] || '#3b82f6',
          colorType: 'solid',
          solidColor: colorMap[line] || '#3b82f6',
          characterIds: []
        });
      }
    }
  }

  return tiers;
}

/**
 * Consulta y parsea una plantilla de TierMaker por URL o Slug.
 * @param {string} inputUrl URL de TierMaker o slug
 * @returns {Promise<{ success: boolean, title: string, customTiers: Array, defaultTiers: Array, hasCustomTiers: boolean, tiers: Array, items: Array, totalCount: number, error?: string }>}
 */
export async function fetchAndParseTierMakerTemplate(inputUrl) {
  if (typeof inputUrl === 'string' && inputUrl.includes('tierbuddy.com')) {
    return await fetchAndParseTierBuddyTemplate(inputUrl);
  }

  const slug = extractTierMakerSlug(inputUrl);
  if (!slug) {
    throw new Error('Por favor ingresa un enlace o slug válido de TierMaker (tiermaker.com) o TierBuddy (tierbuddy.com).');
  }

  const targetUrl = `https://tiermaker.com/create/${slug}`;
  let rawContent = '';

  // 1. Intento principal con Jina AI Reader en formato Markdown (evita colisiones con atributos HTML)
  try {
    const jinaUrl = `https://r.jina.ai/${targetUrl}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    const res = await fetch(jinaUrl, {
      headers: {
        'Accept': 'text/plain',
        'X-Return-Format': 'markdown'
      },
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (res.ok) {
      rawContent = await res.text();
    }
  } catch (err) {
    console.warn('[tierMakerImporter] Jina reader Markdown falló, intentando HTML/proxies:', err);
  }

  // 2. Si falló Markdown, intentar Jina Reader en HTML
  if (!rawContent || rawContent.length < 500) {
    try {
      const jinaUrl = `https://r.jina.ai/${targetUrl}`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);

      const res = await fetch(jinaUrl, {
        headers: {
          'Accept': 'text/plain',
          'X-Return-Format': 'html'
        },
        signal: controller.signal
      });
      clearTimeout(timeout);

      if (res.ok) {
        rawContent = await res.text();
      }
    } catch (err) {}
  }

  // 3. Fallback con proxies CORS si Jina falló
  if (!rawContent || rawContent.length < 200) {
    const fallbackProxies = [
      `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`,
      `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(targetUrl)}`
    ];

    for (const pUrl of fallbackProxies) {
      try {
        const c = new AbortController();
        const t = setTimeout(() => c.abort(), 8000);
        const r = await fetch(pUrl, { signal: c.signal });
        clearTimeout(t);
        if (r.ok) {
          rawContent = await r.text();
          if (rawContent && rawContent.length > 500) break;
        }
      } catch (e) {}
    }
  }

  if (!rawContent || rawContent.length < 200) {
    throw new Error('No se pudo descargar la plantilla de TierMaker. Verifica que el enlace sea público y accesible.');
  }

  // 4. Extraer Título (de forma limpia y segura sin confundir con etiquetas o atributos HTML)
  let detectedTitle = '';
  const h1Match = rawContent.match(/^#\s+([^\n#<]+)/im);
  if (h1Match && h1Match[1] && h1Match[1].trim().length > 2) {
    detectedTitle = cleanTierListTitle(h1Match[1], slug);
  } else {
    const titleHeader = rawContent.match(/^Title:\s*([^\n<]+)/im);
    if (titleHeader && titleHeader[1] && titleHeader[1].trim().length > 2) {
      detectedTitle = cleanTierListTitle(titleHeader[1], slug);
    } else {
      const htmlTitle = rawContent.match(/<title>([^<]+)<\/title>/i);
      if (htmlTitle && htmlTitle[1] && htmlTitle[1].trim().length > 2) {
        detectedTitle = cleanTierListTitle(htmlTitle[1], slug);
      } else {
        detectedTitle = cleanTierListTitle('', slug);
      }
    }
  }

  // 5. Extraer Rangos Personalizados de la Plantilla
  const customTiers = extractTiersFromContent(rawContent);
  const defaultTiers = JSON.parse(JSON.stringify(DEFAULT_TIERS));
  const hasCustomTiers = Array.isArray(customTiers) && customTiers.length >= 2;
  const finalTiers = hasCustomTiers ? customTiers : defaultTiers;

  // 6. Extraer Imágenes de la plantilla
  const imgRegex = /https:\/\/tiermaker\.com\/images\/[^\s"',\)<>]+\.(?:png|jpe?g|webp)/gi;
  const filterImageUrls = (content) => {
    const matches = [...content.matchAll(imgRegex)].map(m => m[0]);
    const valid = [];
    const seen = new Set();
    for (const u of matches) {
      const l = u.toLowerCase();
      if (l.includes('logo') || l.includes('search-icon') || l.includes('random') || l.includes('banner') || l.includes('avatar') || l.includes('favicon')) {
        continue;
      }
      if (seen.has(u)) continue;
      seen.add(u);
      valid.push(u);
    }
    return valid;
  };

  let imageUrls = filterImageUrls(rawContent);

  // 7. Si se detectaron pocas imágenes (< 5), buscar en la página de resumen de categorías de la plantilla
  // (TierMaker almacena las 90+ imágenes estáticamente en /categories/.../<slug>)
  if (imageUrls.length < 5) {
    const catMatch = rawContent.match(/https:\/\/tiermaker\.com\/categories\/[a-z0-9_-]+\/[a-z0-9_-]+/i) ||
                     rawContent.match(/\/categories\/([a-z0-9_-]+\/[a-z0-9_-]+)/i);
    const catUrl = catMatch ? (catMatch[0].startsWith('http') ? catMatch[0] : `https://tiermaker.com/categories/${catMatch[1]}`) : null;

    if (catUrl) {
      try {
        const jinaCatUrl = `https://r.jina.ai/${catUrl}`;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);
        const resCat = await fetch(jinaCatUrl, {
          headers: { 'Accept': 'text/plain', 'X-Return-Format': 'markdown' },
          signal: controller.signal
        });
        clearTimeout(timeout);
        if (resCat.ok) {
          const catContent = await resCat.text();
          const catImages = filterImageUrls(catContent);
          if (catImages.length > imageUrls.length) {
            imageUrls = catImages;
          }
        }
      } catch (e) {
        console.warn('[tierMakerImporter] Falló la extracción desde categoría:', e);
      }
    }
  }

  // 8. Construir lista de operativos con proxy ultraligero WebP
  const items = imageUrls.map((rawImgUrl, idx) => {
    const name = cleanItemName(rawImgUrl, detectedTitle.slice(0, 16) || 'Operativo', idx + 1);
    const proxyUrl = `https://wsrv.nl/?url=${encodeURIComponent(rawImgUrl)}&output=webp`;

    return {
      id: `guest_tm_${Date.now()}_${idx + 1}_${Math.random().toString(36).substr(2, 4)}`,
      name,
      originalUrl: rawImgUrl,
      avatarDataUrl: proxyUrl
    };
  });

  return {
    success: true,
    source: 'tiermaker',
    title: detectedTitle,
    slug,
    customTiers,
    defaultTiers,
    hasCustomTiers,
    tiers: finalTiers,
    items,
    totalCount: items.length
  };
}
