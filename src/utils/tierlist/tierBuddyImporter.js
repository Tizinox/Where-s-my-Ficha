/**
 * utils/tierlist/tierBuddyImporter.js
 * Motor de importación directa de plantillas y listas desde tierbuddy.com
 * Permite pegar cualquier enlace de TierBuddy (ej: /list/... o /templates/...),
 * resuelve la lista mediante fetch directo o proxies CORS (Jina Reader / AllOrigins) y extrae:
 *  1. Título de la Tier List
 *  2. Rangos / Filas originales con sus colores hexadecimales exactos
 *  3. Catálogo completo de imágenes con nombres limpios y proxy CORS de alto rendimiento (wsrv.nl).
 */

import { DEFAULT_TIERS } from '../../store/tierlist/constants.js';

/**
 * Limpia y normaliza el título detectado para la Tier List de TierBuddy.
 */
export function cleanTierBuddyTitle(rawTitle, url) {
  if (rawTitle && typeof rawTitle === 'string') {
    let t = rawTitle
      .replace(/<[^>]+>/g, '')
      .replace(/\s*\|\s*TierBuddy.*$/i, '')
      .replace(/\s*-\s*#1\s*Tier List Maker.*$/i, '')
      .replace(/^title:\s*/i, '')
      .replace(/^#\s*/i, '')
      .trim();

    if (t.length >= 2) return t;
  }

  // Fallback a partir de la URL
  try {
    const slugMatch = url.match(/\/list\/([a-zA-Z0-9_-]+)/i);
    if (slugMatch && slugMatch[1]) {
      return slugMatch[1]
        .replace(/-\d{10,}-[a-z0-9]+$/i, '')
        .replace(/-tier-list$/i, '')
        .replace(/[-_]+/g, ' ')
        .trim()
        .split(' ')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');
    }
  } catch (e) {}

  return 'Tier List TierBuddy';
}

/**
 * Limpia el nombre del operativo a partir del atributo alt o URL de TierBuddy.
 */
export function cleanTierBuddyItemName(rawAlt, rawUrl, fallbackTitle = 'Operativo', index = 1) {
  if (rawAlt && typeof rawAlt === 'string') {
    let name = rawAlt
      .replace(/<[^>]+>/g, '')
      .replace(/\s*-\s*.*?tier list item$/i, '')
      .replace(/\.[a-z0-9]{3,4}$/i, '')
      .replace(/[-_]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const lower = name.toLowerCase();
    if (name.length > 0 && !/^[a-f0-9]{20,}$/i.test(name) && lower !== 'image' && lower !== 'screenshot') {
      return name.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    }
  }

  try {
    const filename = rawUrl.split('/').pop().split('?')[0].replace(/\.[^.]+$/, '');
    let clean = decodeURIComponent(filename)
      .replace(/[-_]+/g, ' ')
      .trim();
    const lower = clean.toLowerCase();
    if (clean.length > 0 && !/^[a-f0-9]{20,}$/i.test(clean) && lower !== 'image' && lower !== 'screenshot') {
      return clean.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    }
  } catch (e) {}

  return `${fallbackTitle} #${index}`;
}

/**
 * Descarga el contenido HTML de TierBuddy usando fallback de proxies CORS.
 */
async function fetchTierBuddyHtml(targetUrl) {
  let rawContent = '';

  // 1. Intento directo primero (por si el entorno no tiene restricciones de CORS)
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(targetUrl, { signal: controller.signal });
    clearTimeout(timeout);
    if (res.ok) {
      rawContent = await res.text();
    }
  } catch (e) {
    // Falla directa esperada en navegadores debido a CORS
  }

  // 2. Intento principal con Jina AI Reader
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
    } catch (err) {
      console.warn('[tierBuddyImporter] Jina reader falló, intentando proxies alternativos:', err);
    }
  }

  // 3. Fallbacks de proxies CORS (AllOrigins y CodeTabs)
  if (!rawContent || rawContent.length < 500) {
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

  return rawContent;
}

/**
 * Consulta y parsea una plantilla o lista pública de TierBuddy por URL.
 * @param {string} inputUrl URL de TierBuddy
 * @returns {Promise<{ success: boolean, source: string, title: string, tiers: Array, items: Array, totalCount: number, error?: string }>}
 */
export async function fetchAndParseTierBuddyTemplate(inputUrl) {
  if (!inputUrl || typeof inputUrl !== 'string') {
    throw new Error('Por favor ingresa un enlace válido de TierBuddy (ej: tierbuddy.com/list/...)');
  }

  let targetUrl = inputUrl.trim();
  if (!/^https?:\/\//i.test(targetUrl)) {
    targetUrl = `https://${targetUrl}`;
  }

  const rawHtml = await fetchTierBuddyHtml(targetUrl);
  if (!rawHtml || rawHtml.length < 300) {
    throw new Error('No se pudo descargar la lista de TierBuddy. Verifica que el enlace sea público y accesible.');
  }

  // 1. Título
  const h1Match = rawHtml.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) ||
                  rawHtml.match(/<meta property="og:title" content="([^"]+)"/i) ||
                  rawHtml.match(/<title>([\s\S]*?)<\/title>/i);
  const detectedTitle = cleanTierBuddyTitle(h1Match ? h1Match[1] : '', targetUrl);

  // 2. Extraer Tiers (filas y colores exactos)
  const tiers = [];
  const tierRegex = /<div[^>]*class="[^"]*tier-label[^"]*"[^>]*style="[^"]*background-color:\s*([^;"]+)[^"]*"[^>]*>(.*?)<\/div>|<div[^>]*style="[^"]*background-color:\s*([^;"]+)[^"]*"[^>]*class="[^"]*tier-label[^"]*"[^>]*>(.*?)<\/div>/gi;
  let match;
  let idx = 0;
  while ((match = tierRegex.exec(rawHtml)) !== null) {
    const color = (match[1] || match[3] || '#3b82f6').trim();
    const rawLabel = (match[2] || match[4] || '').trim();
    const label = rawLabel.replace(/<[^>]+>/g, '').trim();
    if (label && !tiers.some(t => t.label === label)) {
      tiers.push({
        id: `tier_tb_${label.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now()}_${idx++}`,
        label,
        color,
        colorType: 'solid',
        solidColor: color,
        characterIds: []
      });
    }
  }

  // Fallback si no encontró en HTML: intentar desde reactRouterContext streamController
  if (tiers.length === 0) {
    const tierMatches = [...rawHtml.matchAll(/"label","([^"]+)","color","([^"]+)"/g)];
    tierMatches.forEach((tm, i) => {
      if (!tiers.some(t => t.label === tm[1])) {
        tiers.push({
          id: `tier_tb_${tm[1].toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now()}_${i}`,
          label: tm[1],
          color: tm[2],
          colorType: 'solid',
          solidColor: tm[2],
          characterIds: []
        });
      }
    });
  }

  const finalTiers = tiers.length >= 2 ? tiers : JSON.parse(JSON.stringify(DEFAULT_TIERS));

  // 3. Extraer Ítems / Imágenes
  const items = [];
  const seenUrls = new Set();

  // A. Búsqueda por <img> con tier-item-image o dentro de tier-item
  const imgRegex = /<img[^>]+(?:class="[^"]*tier-item-image[^"]*"|class="[^"]*tier-item[^"]*")[^>]*>|<img[^>]+src="([^"]*(?:tierlist-uploads|digitaloceanspaces)[^"]*)"[^>]*>/gi;
  while ((match = imgRegex.exec(rawHtml)) !== null) {
    const tag = match[0];
    const srcMatch = tag.match(/src="([^"]+)"/i);
    const altMatch = tag.match(/alt="([^"]+)"/i);

    if (srcMatch) {
      let rawImgUrl = srcMatch[1].replace(/&amp;/g, '&');
      // Desempaquetar wsrv.nl si viene envuelta
      const wsrvMatch = rawImgUrl.match(/wsrv\.nl\/\?url=([^&]+)/);
      if (wsrvMatch) {
        rawImgUrl = decodeURIComponent(wsrvMatch[1]);
      }

      if (rawImgUrl.includes('logo') || rawImgUrl.includes('icon') || rawImgUrl.includes('googleusercontent')) {
        continue;
      }

      if (seenUrls.has(rawImgUrl)) continue;
      seenUrls.add(rawImgUrl);

      const name = cleanTierBuddyItemName(altMatch ? altMatch[1] : '', rawImgUrl, detectedTitle.slice(0, 16) || 'Operativo', items.length + 1);
      const proxyUrl = `https://wsrv.nl/?url=${encodeURIComponent(rawImgUrl)}&output=webp`;

      items.push({
        id: `guest_tb_${Date.now()}_${items.length + 1}_${Math.random().toString(36).substr(2, 4)}`,
        name,
        originalUrl: rawImgUrl,
        avatarDataUrl: proxyUrl
      });
    }
  }

  // B. Fallback a URLs de digitaloceanspaces.com encontradas en el cuerpo
  if (items.length === 0) {
    const doMatches = [...rawHtml.matchAll(/https?:\/\/[^"',\s\\]*digitaloceanspaces\.com\/[^"',\s\\]+/gi)];
    doMatches.forEach((dm) => {
      const u = dm[0].replace(/\\\//g, '/').replace(/&amp;/g, '&');
      if (!seenUrls.has(u) && !u.includes('logo')) {
        seenUrls.add(u);
        const name = cleanTierBuddyItemName('', u, detectedTitle.slice(0, 16) || 'Operativo', items.length + 1);
        const proxyUrl = `https://wsrv.nl/?url=${encodeURIComponent(u)}&output=webp`;
        items.push({
          id: `guest_tb_${Date.now()}_${items.length + 1}_${Math.random().toString(36).substr(2, 4)}`,
          name,
          originalUrl: u,
          avatarDataUrl: proxyUrl
        });
      }
    });
  }

  if (items.length === 0) {
    throw new Error('No se encontraron imágenes o personajes en esta lista de TierBuddy. Asegúrate de que contenga elementos cargados.');
  }

  const hasCustomTiers = tiers.length >= 2;
  const defaultTiers = JSON.parse(JSON.stringify(DEFAULT_TIERS));

  return {
    success: true,
    source: 'tierbuddy',
    title: detectedTitle,
    customTiers: hasCustomTiers ? tiers : [],
    defaultTiers,
    hasCustomTiers,
    tiers: finalTiers,
    items,
    totalCount: items.length
  };
}
