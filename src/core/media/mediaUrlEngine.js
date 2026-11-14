/**
 * utils/mediaUrlEngine.js
 * 
 * Motor integral de resolución, análisis y descarga de imágenes y galerías externas.
 * Soporta de forma nativa las 10 plataformas visuales principales:
 *  1. Pinterest (Pins, pin.it shortlinks, CDN i.pinimg.com a resolución original)
 *  2. ArtStation (Artwork projects, perfiles y CDN cdna/cdnb a 4K)
 *  3. Pixiv (Artworks individuales y páginas múltiples vía proxy de alta velocidad pixiv.cat / pixiv.re)
 *  4. DeviantArt (oEmbed oficial de alta fidelidad)
 *  5. Behance (Galerías de proyectos y CDN mir-s3-cdn-cf a máxima resolución)
 *  6. Are.na (API REST pública v2 de bloques y canales)
 *  7. Cosmos.so (Entregas CDN de imagen)
 *  8. Designspiration (CDN dspncdn y enlaces save)
 *  9. Savee.com / Savee.it (CDN de alta calidad assets/img.savee)
 * 10. Pearltrees (CDN y previews de perlas)
 * 
 * Además de: Imgur, Giphy, Tenor, Twitter/X, Discord, Google Images y enlaces directos.
 */

// ── Nombres amigables de plataformas ─────────────────────────────────────────
export const PLATFORM_NAMES = {
  pinterest: 'Pinterest',
  artstation: 'ArtStation',
  pixiv: 'Pixiv',
  deviantart: 'DeviantArt',
  behance: 'Behance',
  arena: 'Are.na',
  cosmos: 'Cosmos',
  designspiration: 'Designspiration',
  savee: 'Savee',
  pearltrees: 'Pearltrees',
  imgur: 'Imgur',
  giphy: 'Giphy',
  twitter: 'Twitter / X',
  discord: 'Discord',
  direct: 'Enlace Directo',
  generic: 'Página Web'
};

/**
 * Desenrosca redirecciones comunes (ej: Google Images o Google Search).
 * @param {string} rawUrl
 * @returns {string}
 */
export function unwrapSearchRedirects(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return '';
  let url = rawUrl.trim();
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes('google.') && (parsed.searchParams.has('imgurl') || parsed.searchParams.has('url') || parsed.searchParams.has('q'))) {
      const unwrapped = parsed.searchParams.get('imgurl') || parsed.searchParams.get('url') || parsed.searchParams.get('q');
      if (unwrapped && unwrapped.startsWith('http')) {
        return unwrapped;
      }
    }
  } catch (e) {}
  return url;
}

/**
 * Normaliza y analiza cualquier URL para extraer plataforma, metadatos y lista de imágenes.
 * @param {string} rawUrl
 * @returns {Promise<{
 *   success: boolean,
 *   platform: string,
 *   platformName: string,
 *   title: string,
 *   author: string,
 *   images: Array<{ url: string, label: string, isOriginal?: boolean }>,
 *   originalUrl: string
 * }>}
 */
export async function parseMediaUrl(rawUrl) {
  const url = unwrapSearchRedirects(rawUrl);
  if (!url) {
    return {
      success: false,
      platform: 'unknown',
      platformName: 'Desconocido',
      title: '',
      author: '',
      images: [],
      originalUrl: rawUrl || ''
    };
  }

  // 1. Pinterest (Pins, pin.it o CDN directo)
  if (url.includes('pinterest.') || url.includes('pin.it') || url.includes('i.pinimg.com')) {
    const res = await parsePinterestUrl(url);
    if (res.images.length > 0) return res;
  }

  // 2. Are.na (Bloques o CDN)
  if (url.includes('are.na')) {
    const res = await parseAreNaUrl(url);
    if (res.images.length > 0) return res;
  }

  // 3. Pixiv (Artworks o pximg)
  if (url.includes('pixiv.net') || url.includes('pximg.net')) {
    const res = parsePixivUrl(url);
    if (res.images.length > 0) return res;
  }

  // 4. DeviantArt (Artworks y oEmbed)
  if (url.includes('deviantart.com')) {
    const res = await parseDeviantArtUrl(url);
    if (res.images.length > 0) return res;
  }

  // 5. ArtStation (Projects, artworks y CDN cdna/cdnb)
  if (url.includes('artstation.com')) {
    const res = await parseArtStationUrl(url);
    if (res.images.length > 0) return res;
  }

  // 6. Behance (Galerías y CDN mir-s3-cdn-cf)
  if (url.includes('behance.net')) {
    const res = await parseBehanceUrl(url);
    if (res.images.length > 0) return res;
  }

  // 7. Cosmos (cosmos.so)
  if (url.includes('cosmos.so')) {
    const res = await parseCosmosUrl(url);
    if (res.images.length > 0) return res;
  }

  // 8. Designspiration (designspiration.com o dspncdn)
  if (url.includes('designspiration.com') || url.includes('dspncdn.com')) {
    const res = await parseDesignspirationUrl(url);
    if (res.images.length > 0) return res;
  }

  // 9. Savee (savee.com, savee.it o CDN assets/img.savee)
  if (url.includes('savee.com') || url.includes('savee.it')) {
    const res = await parseSaveeUrl(url);
    if (res.images.length > 0) return res;
  }

  // 10. Pearltrees (pearltrees.com o cdn.pearltrees.com)
  if (url.includes('pearltrees.com')) {
    const res = await parsePearltreesUrl(url);
    if (res.images.length > 0) return res;
  }

  // 11. Imgur
  if (url.includes('imgur.com')) {
    const res = parseImgurUrl(url);
    if (res.images.length > 0) return res;
  }

  // 12. Giphy
  if (url.includes('giphy.com')) {
    const res = parseGiphyUrl(url);
    if (res.images.length > 0) return res;
  }

  // 13. Twitter / X (pbs.twimg.com)
  if (url.includes('pbs.twimg.com')) {
    const res = parseTwitterMediaUrl(url);
    if (res.images.length > 0) return res;
  }

  // 14. Discord
  if (url.includes('discordapp.com') || url.includes('discordapp.net')) {
    return {
      success: true,
      platform: 'discord',
      platformName: PLATFORM_NAMES.discord,
      title: 'Archivo adjunto de Discord',
      author: '',
      images: [{ url, label: 'Imagen Original', isOriginal: true }],
      originalUrl: url
    };
  }

  // 15. Enlace directo a archivo de imagen (.jpg, .png, .webp, .gif, .svg, .avif o parámetros de formato)
  const isDirect = /\.(jpg|jpeg|png|webp|gif|svg|avif|bmp)(\?.*)?$/i.test(url) ||
                   /[?&](?:format|fm|ext)=(?:jpg|jpeg|png|webp|gif|avif)/i.test(url) ||
                   /\.(jpg|jpeg|png|webp|gif|svg|avif|bmp)\b/i.test(url);
  if (isDirect) {
    return {
      success: true,
      platform: 'direct',
      platformName: PLATFORM_NAMES.direct,
      title: 'Imagen directa',
      author: '',
      images: [{ url, label: 'Archivo Original', isOriginal: true }],
      originalUrl: url
    };
  }

  // 16. Sondeo rápido de cabeceras HEAD para CDNs modernos (Unsplash, Imgix, Cloudinary, etc.)
  try {
    const probeRes = await universalFetch(url, { method: 'HEAD', signal: AbortSignal.timeout(3000) });
    const cType = (probeRes.headers.get('content-type') || '').toLowerCase();
    if (cType.startsWith('image/')) {
      return {
        success: true,
        platform: 'direct',
        platformName: PLATFORM_NAMES.direct,
        title: 'Imagen directa',
        author: '',
        images: [{ url, label: 'Imagen Original', isOriginal: true }],
        originalUrl: url
      };
    }
  } catch (e) {}

  // 16. Fallback genérico: Intentar extraer imagen de portada o media de la página vía Jina
  try {
    const jinaRes = await extractImagesViaJina(url);
    if (jinaRes && jinaRes.text) {
      const imgMatches = jinaRes.text.match(/https?:\/\/[^\s)"']+\.(?:jpg|jpeg|png|webp|gif)/gi) || [];
      const validImgs = imgMatches.filter(img => !img.includes('avatar') && !img.includes('logo') && !img.includes('icon'));
      if (validImgs.length > 0) {
        const unique = [...new Set(validImgs)].slice(0, 8);
        return {
          success: true,
          platform: 'generic',
          platformName: PLATFORM_NAMES.generic,
          title: jinaRes.title || 'Imagen web',
          author: '',
          images: unique.map((u, i) => ({ url: u, label: `Imagen encontrada #${i + 1}`, isOriginal: i === 0 })),
          originalUrl: url
        };
      }
    }
  } catch (e) {}

  return {
    success: false,
    platform: 'unknown',
    platformName: 'Desconocido',
    title: '',
    author: '',
    images: [],
    originalUrl: url
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// PARSERS ESPECÍFICOS POR PLATAFORMA
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Realiza peticiones HTTP universales a salvo de restricciones CORS del navegador.
 * En entorno local (localhost / 127.0.0.1) se enruta automáticamente mediante /api/media-proxy en Node.js.
 * En entornos externos o de respaldo, prueba acceso directo y mirrors de proxies CORS.
 * @param {string} targetUrl
 * @param {RequestInit} [options]
 * @returns {Promise<Response>}
 */
export async function universalFetch(targetUrl, options = {}) {
  // 1. En entorno de navegador, usar prioritariamente el proxy local de Vite/Node
  if (typeof window !== 'undefined') {
    const proxyUrl = `/api/media-proxy?url=${encodeURIComponent(targetUrl)}`;
    try {
      const res = await fetch(proxyUrl, options);
      if (res.ok) return res;
    } catch (e) {
      // Si el proxy local no responde, continuar a fallbacks
    }
  }

  // 2. Intento directo: En Node (servidor/pruebas) o si en navegador no es un dominio restringido por CORS/Rastreadores
  const isBrowser = typeof window !== 'undefined';
  const isCorsRestricted = isBrowser && /pinterest\.|artstation\.com|behance\.net|pixiv\.net|pximg\.net|deviantart\.com|savee\.|designspiration\.com|are\.na|tiermaker\.com/i.test(targetUrl);
  if (!isCorsRestricted) {
    try {
      const res = await fetch(targetUrl, options);
      if (res.ok) return res;
    } catch (err) {}
  }

  // 3. Fallback con proxy público Jina Reader para páginas web / HTML
  try {
    const jinaUrl = `https://r.jina.ai/${targetUrl}`;
    const res = await fetch(jinaUrl, {
      headers: { 'Accept': 'text/plain' },
      signal: AbortSignal.timeout(6000)
    });
    if (res.ok) return res;
  } catch (e) {}

  // 4. Fallback con AllOrigins
  try {
    const allOriginsUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`;
    const res = await fetch(allOriginsUrl, {
      signal: AbortSignal.timeout(5000)
    });
    if (res.ok) return res;
  } catch (e) {}

  throw new Error(`No se pudo conectar con el recurso: ${targetUrl}`);
}

/**
 * Extrae contenido y enlaces de imágenes de una página web usando el lector universal r.jina.ai.
 * Bypasea protecciones Cloudflare / bot walls de forma limpia y devuelve el texto estructurado.
 * @param {string} pageUrl
 * @returns {Promise<{ text: string, title: string } | null>}
 */
export async function extractImagesViaJina(pageUrl) {
  if (!pageUrl || typeof pageUrl !== 'string') return null;
  try {
    const res = await universalFetch(`https://r.jina.ai/${pageUrl}`, {
      headers: { 'Accept': 'text/plain' },
      signal: AbortSignal.timeout(9000)
    });
    if (!res.ok) return null;
    const text = await res.text();
    const titleMatch = text.match(/^Title:\s*(.+)$/m) || text.match(/#\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1].trim() : '';
    return { text, title };
  } catch (e) {
    return null;
  }
}

// ── 1. Pinterest ─────────────────────────────────────────────────────────────
async function parsePinterestUrl(url) {
  // A) CDN directo i.pinimg.com
  if (url.includes('i.pinimg.com')) {
    const hiResOrig = url.replace(/\/(236x|474x|564x|736x)\//, '/originals/');
    const hiRes736 = url.replace(/\/(236x|474x|564x)\//, '/736x/');
    const images = [
      { url: hiResOrig, label: 'Resolución Original (Máxima)', isOriginal: true },
      { url: hiRes736, label: 'Alta Resolución (736px)' }
    ];
    if (!images.some(i => i.url === url)) {
      images.push({ url, label: 'Vista actual' });
    }
    return {
      success: true,
      platform: 'pinterest',
      platformName: PLATFORM_NAMES.pinterest,
      title: 'Pin de Pinterest',
      author: '',
      images,
      originalUrl: url
    };
  }

  // B) Enlace de Pin (pin/123 o pin.it/abc)
  const pinMatch = url.match(/pinterest\.[a-z.]+(?:\/.*)?\/pin\/(\d+)/i) ||
                   url.match(/\/pin\/(\d+)/i);

  let pinId = pinMatch ? pinMatch[1] : null;

  // Si es un enlace corto pin.it/XXXX, desenrollarlo para obtener el Pin ID real
  if (!pinId && url.includes('pin.it')) {
    try {
      const res = await universalFetch(url, { signal: AbortSignal.timeout(5000) });
      const finalUrl = res.headers.get('x-final-url') || res.url || '';
      const m = finalUrl.match(/\/pin\/(\d+)/i);
      if (m) pinId = m[1];
      if (!pinId) {
        const text = await res.text();
        const m2 = text.match(/\/pin\/(\d+)/i) || text.match(/pin_ids=(\d+)/i);
        if (m2) pinId = m2[1];
      }
    } catch (e) {}
  }

  if (pinId && !isNaN(Number(pinId))) {
    try {
      const pinApiUrl = `https://widgets.pinterest.com/v3/pidgets/pins/info/?pin_ids=${pinId}`;
      const res = await universalFetch(pinApiUrl, { signal: AbortSignal.timeout(6000) });
      if (res.ok) {
        const json = await res.json();
        const pinData = json?.data?.[0];
        if (pinData) {
          const title = pinData.description || 'Pin de Pinterest';
          const author = pinData.pinner?.full_name || pinData.pinner?.username || '';
          const images = [];

          // Si es un carrusel o story pin con múltiples páginas/imágenes
          const storyPages = pinData.story_pin_data?.pages || [];
          if (storyPages.length > 1) {
            storyPages.forEach((p, idx) => {
              const pOrig = p.image?.images?.originals?.url || p.image?.images?.['736x']?.url || p.image?.images?.['564x']?.url;
              if (pOrig) {
                images.push({
                  url: pOrig,
                  label: `Ilustración #${idx + 1}`,
                  isOriginal: idx === 0
                });
              }
            });
          } else {
            // Pin individual: enviar la resolución máxima directamente
            const storyOrig = storyPages[0]?.image?.images?.originals?.url || storyPages[0]?.image?.images?.['736x']?.url;
            const baseImg = pinData.images?.['564x']?.url || pinData.images?.['236x']?.url || Object.values(pinData.images || {})[0]?.url;
            const targetUrl = storyOrig || (baseImg ? baseImg.replace(/\/(236x|474x|564x|736x)\//, '/originals/') : null);
            if (targetUrl) {
              images.push({ url: targetUrl, label: 'Resolución Original (Máxima)', isOriginal: true });
            }
          }

          if (images.length > 0) {
            return {
              success: true,
              platform: 'pinterest',
              platformName: PLATFORM_NAMES.pinterest,
              title,
              author,
              images,
              originalUrl: url
            };
          }
        }
      }
    } catch (e) {
      console.warn('[mediaUrlEngine] Pinterest widget API falló:', e);
    }
  }

  // Fallback: extraer imágenes del Pin vía Jina Reader
  const jinaRes = await extractImagesViaJina(url);
  if (jinaRes && jinaRes.text) {
    const pinMatches = jinaRes.text.match(/https:\/\/i\.pinimg\.com\/[^\s)"']+/gi) || [];
    const seen = new Set();
    const images = [];

    for (const rawImg of pinMatches) {
      const clean = rawImg.replace(/[,.]$/, '').trim();
      const baseKey = clean.split('?')[0].replace(/\/(236x|474x|564x|736x|originals)\//, '/');
      if (seen.has(baseKey)) continue;
      seen.add(baseKey);

      const hiResOrig = clean.replace(/\/(236x|474x|564x|736x)\//, '/originals/');
      const hiRes736 = clean.replace(/\/(236x|474x|564x)\//, '/736x/');
      images.push({ url: hiResOrig, label: 'Original (Máxima calidad)', isOriginal: true });
      images.push({ url: hiRes736, label: 'Alta calidad (736px)' });
    }

    if (images.length > 0) {
      return {
        success: true,
        platform: 'pinterest',
        platformName: PLATFORM_NAMES.pinterest,
        title: jinaRes.title || 'Pin de Pinterest',
        author: '',
        images,
        originalUrl: url
      };
    }
  }

  return { success: false, images: [] };
}

// ── 2. Are.na ────────────────────────────────────────────────────────────────
async function parseAreNaUrl(url) {
  // Are.na Block: are.na/block/{id}
  const blockMatch = url.match(/are\.na\/(?:.*\/)?block\/(\d+)/i) ||
                     url.match(/are\.na\/.*#(\d+)/i);
  if (blockMatch) {
    const blockId = blockMatch[1];
    try {
      const apiUrl = `https://api.are.na/v2/blocks/${blockId}`;
      const res = await universalFetch(apiUrl, {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(6000)
      });
      if (res.ok) {
        const data = await res.json();
        const title = data.title || data.generated_title || 'Bloque de Are.na';
        const author = data.user?.username || data.user?.full_name || '';
        const images = [];

        if (data.image?.original?.url) {
          images.push({ url: data.image.original.url, label: `Original (${data.image.original.file_size ? Math.round(data.image.original.file_size / 1024) + ' KB' : 'Máxima'})`, isOriginal: true });
        }
        if (data.image?.display?.url && data.image.display.url !== data.image?.original?.url) {
          images.push({ url: data.image.display.url, label: 'Resolución de pantalla (Display)' });
        }
        if (data.image?.large?.url) {
          images.push({ url: data.image.large.url, label: 'Grande' });
        }

        if (images.length > 0) {
          return {
            success: true,
            platform: 'arena',
            platformName: PLATFORM_NAMES.arena,
            title,
            author,
            images,
            originalUrl: url
          };
        }
      }
    } catch (e) {
      console.warn('[mediaUrlEngine] Are.na API falló:', e);
    }
  }

  // CDN directo: images.are.na
  if (url.includes('images.are.na')) {
    return {
      success: true,
      platform: 'arena',
      platformName: PLATFORM_NAMES.arena,
      title: 'Imagen de Are.na',
      author: '',
      images: [{ url, label: 'Imagen de Are.na', isOriginal: true }],
      originalUrl: url
    };
  }

  return { success: false, images: [] };
}

// ── 3. Pixiv ─────────────────────────────────────────────────────────────────
function parsePixivUrl(url) {
  // URLs típicas:
  // pixiv.net/artworks/12345678 o pixiv.net/artworks/12345678#2 o member_illust.php?illust_id=12345678
  const pixivMatch = url.match(/pixiv\.net\/(?:[a-zA-Z_-]+\/)?artworks\/(\d+)(?:#(\d+))?/i) ||
                     url.match(/pixiv\.net\/member_illust\.php\?.*illust_id=(\d+)/i);
  if (pixivMatch) {
    const illustId = pixivMatch[1];
    const pageIndex = pixivMatch[2] ? parseInt(pixivMatch[2], 10) : 1;
    const images = [];

    // Si tiene página especificada:
    if (pageIndex > 1) {
      images.push({ url: `https://pixiv.cat/${illustId}-${pageIndex}.png`, label: `Página #${pageIndex} (PNG)`, isOriginal: true });
      images.push({ url: `https://pixiv.cat/${illustId}-${pageIndex}.jpg`, label: `Página #${pageIndex} (JPG)` });
    } else {
      // Página 1 (por defecto) + opción de páginas siguientes en caso de álbum/manga
      images.push({ url: `https://pixiv.cat/${illustId}.png`, label: 'Ilustración Principal (PNG)', isOriginal: true });
      images.push({ url: `https://pixiv.cat/${illustId}.jpg`, label: 'Ilustración Principal (JPG)' });
      images.push({ url: `https://pixiv.re/${illustId}.png`, label: 'Espejo Alternativo (pixiv.re)' });

      // Preparar candidatos de álbum multi-página (Páginas 2 a 5)
      for (let p = 2; p <= 5; p++) {
        images.push({ url: `https://pixiv.cat/${illustId}-${p}.png`, label: `Página #${p} (si es álbum/manga)` });
      }
    }

    return {
      success: true,
      platform: 'pixiv',
      platformName: PLATFORM_NAMES.pixiv,
      title: `Ilustración Pixiv #${illustId}`,
      author: '',
      images,
      originalUrl: url
    };
  }

  // CDN directo i.pximg.net -> convertir a pixiv.cat
  if (url.includes('i.pximg.net/')) {
    const pxMatch = url.match(/(\d+)(?:_p(\d+))?\.(?:jpg|jpeg|png|gif|webp)/i);
    if (pxMatch) {
      const illustId = pxMatch[1];
      const page = pxMatch[2] ? `-${parseInt(pxMatch[2], 10) + 1}` : '';
      return {
        success: true,
        platform: 'pixiv',
        platformName: PLATFORM_NAMES.pixiv,
        title: `Ilustración Pixiv #${illustId}`,
        author: '',
        images: [
          { url: `https://pixiv.cat/${illustId}${page}.png`, label: 'Alta Calidad (PNG)', isOriginal: true },
          { url: `https://pixiv.cat/${illustId}${page}.jpg`, label: 'Alta Calidad (JPG)' }
        ],
        originalUrl: url
      };
    }
  }

  return { success: false, images: [] };
}

// ── 4. DeviantArt ────────────────────────────────────────────────────────────
async function parseDeviantArtUrl(url) {
  if (url.includes('deviantart.com')) {
    try {
      const oembedUrl = `https://backend.deviantart.com/oembed?url=${encodeURIComponent(url)}`;
      const res = await universalFetch(oembedUrl, { signal: AbortSignal.timeout(6000) });
      if (res.ok) {
        const data = await res.json();
        const images = [];
        if (data.url) {
          images.push({ url: data.url, label: `Original (${data.width || ''}x${data.height || ''})`.trim(), isOriginal: true });
        }
        if (data.thumbnail_url && data.thumbnail_url !== data.url) {
          images.push({ url: data.thumbnail_url, label: 'Miniatura / Preview' });
        }

        if (images.length > 0) {
          return {
            success: true,
            platform: 'deviantart',
            platformName: PLATFORM_NAMES.deviantart,
            title: data.title || 'Arte de DeviantArt',
            author: data.author_name || '',
            images,
            originalUrl: url
          };
        }
      }
    } catch (e) {
      console.warn('[mediaUrlEngine] DeviantArt oEmbed falló:', e);
    }

    // Fallback: extraer imágenes vía Jina Reader
    const jinaRes = await extractImagesViaJina(url);
    if (jinaRes && jinaRes.text) {
      const wixMatches = jinaRes.text.match(/https:\/\/[^\s)"']*(?:images-wixmp-|deviantart\.net)[^\s)"']+/gi) || [];
      if (wixMatches.length > 0) {
        const unique = [...new Set(wixMatches.map(m => m.replace(/[,.]$/, '').trim()))];
        return {
          success: true,
          platform: 'deviantart',
          platformName: PLATFORM_NAMES.deviantart,
          title: jinaRes.title || 'Arte de DeviantArt',
          author: '',
          images: unique.map((u, i) => ({ url: u, label: `Imagen DeviantArt #${i + 1}`, isOriginal: i === 0 })),
          originalUrl: url
        };
      }
    }
  }

  // CDN directo Wix/DeviantArt (images-wixmp-)
  if (url.includes('images-wixmp-')) {
    return {
      success: true,
      platform: 'deviantart',
      platformName: PLATFORM_NAMES.deviantart,
      title: 'Imagen de DeviantArt',
      author: '',
      images: [{ url, label: 'Asset Original', isOriginal: true }],
      originalUrl: url
    };
  }

  return { success: false, images: [] };
}

// ── 5. ArtStation ────────────────────────────────────────────────────────────
async function parseArtStationUrl(url) {
  // A) CDN directo cdna.artstation.com o cdnb.artstation.com
  if (url.includes('cdna.artstation.com') || url.includes('cdnb.artstation.com')) {
    const images = [];
    const cleanUrl = url.split('?')[0];
    const query = url.includes('?') ? '?' + url.split('?')[1] : '';

    const url4k = cleanUrl.replace(/\/(medium|large|smaller_square|small)\//, '/4k/') + query;
    const urlLarge = cleanUrl.replace(/\/(medium|smaller_square|small|4k)\//, '/large/') + query;
    
    images.push({ url: url4k, label: 'Resolución 4K (Máxima)', isOriginal: true });
    images.push({ url: urlLarge, label: 'Alta Resolución (Large)' });
    if (!images.some(i => i.url === url)) {
      images.push({ url, label: 'Resolución Copiada' });
    }

    return {
      success: true,
      platform: 'artstation',
      platformName: PLATFORM_NAMES.artstation,
      title: 'Arte de ArtStation',
      author: '',
      images,
      originalUrl: url
    };
  }

  // B) Enlace a Proyecto o Artwork: artstation.com/artwork/{hash} o artstation.com/projects/{hash}
  const projectMatch = url.match(/artstation\.com\/(?:artwork|projects)\/([a-zA-Z0-9_-]+)/i);
  if (projectMatch) {
    const hash = projectMatch[1];
    
    // 1. Intentar consultar endpoint JSON
    try {
      const res = await universalFetch(`https://www.artstation.com/projects/${hash}.json`, {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(4000)
      });
      if (res.ok) {
        const json = await res.json();
        const title = json.title || `Proyecto ArtStation #${hash}`;
        const author = json.user?.full_name || json.user?.username || '';
        const assets = Array.isArray(json.assets) ? json.assets : [];
        const images = [];

        assets.forEach((ast, idx) => {
          if (ast.has_image && ast.image_url) {
            const highRes = ast.image_url.replace(/\/large\//, '/4k/');
            images.push({
              url: highRes,
              label: ast.title || `Obra #${idx + 1}`,
              isOriginal: idx === 0
            });
          }
        });

        if (images.length > 0) {
          return {
            success: true,
            platform: 'artstation',
            platformName: PLATFORM_NAMES.artstation,
            title,
            author,
            images,
            originalUrl: url
          };
        }
      }
    } catch (e) {}

    // 2. Extraer mediante Reader Jina (bypasea Cloudflare Turnstile/Bot Protection de ArtStation)
    const jinaRes = await extractImagesViaJina(`https://www.artstation.com/artwork/${hash}`);
    if (jinaRes && jinaRes.text) {
      const rawMatches = jinaRes.text.match(/https:\/\/cdn[ab]?\.artstation\.com\/p\/assets\/images\/[^\s)"']+/gi) || [];
      const seen = new Set();
      const images = [];

      for (const rawImg of rawMatches) {
        const cleanImg = rawImg.replace(/&dl=1/g, '').replace(/[,.]$/, '').trim();
        const baseKey = cleanImg.split('?')[0].replace(/\/(4k|large|medium|small|smaller_square)\//, '/');
        if (seen.has(baseKey)) continue;
        seen.add(baseKey);

        const highRes = cleanImg.replace(/\/(medium|large|smaller_square|small)\//, '/4k/');

        images.push({
          url: highRes,
          label: `Ilustración #${images.length + 1} (4K)`,
          isOriginal: images.length === 0
        });
      }

      if (images.length > 0) {
        return {
          success: true,
          platform: 'artstation',
          platformName: PLATFORM_NAMES.artstation,
          title: jinaRes.title || `Proyecto ArtStation #${hash}`,
          author: '',
          images,
          originalUrl: url
        };
      }
    }
  }

  return { success: false, images: [] };
}

// ── 6. Behance ───────────────────────────────────────────────────────────────
async function parseBehanceUrl(url) {
  // A) CDN directo de Behance: mir-s3-cdn-cf.behance.net/project_modules/...
  if (url.includes('behance.net') && url.includes('project_modules')) {
    const images = [];
    const urlFs = url.replace(/\/(disp|max_1200|1400|max_1920)\//, '/fs/');
    const url1920 = url.replace(/\/(disp|max_1200|1400|fs)\//, '/max_1920/');
    
    images.push({ url: urlFs, label: 'Resolución Completa (Full Size)', isOriginal: true });
    images.push({ url: url1920, label: 'Alta Calidad (1920px)' });
    if (!images.some(i => i.url === url)) {
      images.push({ url, label: 'Resolución Actual' });
    }

    return {
      success: true,
      platform: 'behance',
      platformName: PLATFORM_NAMES.behance,
      title: 'Diseño de Behance',
      author: '',
      images,
      originalUrl: url
    };
  }

  // B) Enlace a Galería de Proyecto: behance.net/gallery/{id}/{slug}
  const galleryMatch = url.match(/behance\.net\/gallery\/(\d+)/i);
  if (galleryMatch) {
    const id = galleryMatch[1];
    const jinaRes = await extractImagesViaJina(url);
    if (jinaRes && jinaRes.text) {
      const rawMatches = jinaRes.text.match(/https:\/\/mir-s3-cdn-cf\.behance\.net\/project_modules\/[^\s)"']+/gi) || [];
      const seen = new Set();
      const images = [];

      for (const rawImg of rawMatches) {
        const cleanImg = rawImg.replace(/[,.]$/, '').trim();
        const baseKey = cleanImg.split('?')[0].replace(/\/(disp|max_1200|1400|max_1920|fs)\//, '/');
        if (seen.has(baseKey)) continue;
        seen.add(baseKey);

        const urlFs = cleanImg.replace(/\/(disp|max_1200|1400|max_1920)\//, '/fs/');
        const url1920 = cleanImg.replace(/\/(disp|max_1200|1400|fs)\//, '/max_1920/');

        images.push({
          url: urlFs,
          label: `Módulo #${Math.floor(images.length / 2) + 1} (Full Size)`,
          isOriginal: true
        });
        images.push({
          url: url1920,
          label: `Módulo #${Math.floor(images.length / 2) + 1} (1920px)`
        });
      }

      if (images.length > 0) {
        return {
          success: true,
          platform: 'behance',
          platformName: PLATFORM_NAMES.behance,
          title: jinaRes.title || `Proyecto Behance #${id}`,
          author: '',
          images,
          originalUrl: url
        };
      }
    }
  }

  return { success: false, images: [] };
}

// ── 7. Cosmos (cosmos.so) ────────────────────────────────────────────────────
async function parseCosmosUrl(url) {
  if (url.includes('cdn.cosmos.so') || url.includes('image.cosmos.so') || url.includes('img.cosmos.so')) {
    return {
      success: true,
      platform: 'cosmos',
      platformName: PLATFORM_NAMES.cosmos,
      title: 'Elemento de Cosmos',
      author: '',
      images: [{ url, label: 'Imagen Cosmos HD', isOriginal: true }],
      originalUrl: url
    };
  }

  const pMatch = url.match(/cosmos\.so\/(?:.*\/)?p\/([a-zA-Z0-9_-]+)/i);
  if (pMatch) {
    const id = pMatch[1];
    const jinaRes = await extractImagesViaJina(url);
    if (jinaRes && jinaRes.text) {
      const cosmosImgs = jinaRes.text.match(/https:\/\/(?:cdn|image|img)\.cosmos\.so\/[^\s)"']+/gi) ||
                         jinaRes.text.match(/https?:\/\/[^\s)"']+\.(?:jpg|jpeg|png|webp)/gi) || [];
      const valid = cosmosImgs.filter(u => !u.includes('avatar') && !u.includes('logo'));
      if (valid.length > 0) {
        const unique = [...new Set(valid.map(m => m.replace(/[,.]$/, '').trim()))];
        return {
          success: true,
          platform: 'cosmos',
          platformName: PLATFORM_NAMES.cosmos,
          title: jinaRes.title || `Elemento Cosmos #${id}`,
          author: '',
          images: unique.map((u, i) => ({ url: u, label: `Imagen Cosmos #${i + 1}`, isOriginal: i === 0 })),
          originalUrl: url
        };
      }
    }
  }

  return { success: false, images: [] };
}

// ── 8. Designspiration ───────────────────────────────────────────────────────
async function parseDesignspirationUrl(url) {
  if (url.includes('dspncdn.com')) {
    return {
      success: true,
      platform: 'designspiration',
      platformName: PLATFORM_NAMES.designspiration,
      title: 'Inspiración de Designspiration',
      author: '',
      images: [{ url, label: 'Imagen Original Designspiration', isOriginal: true }],
      originalUrl: url
    };
  }

  const saveMatch = url.match(/designspiration\.com\/save\/([a-zA-Z0-9_-]+)/i);
  if (saveMatch) {
    const id = saveMatch[1];
    const jinaRes = await extractImagesViaJina(url);
    if (jinaRes && jinaRes.text) {
      const dspnImgs = jinaRes.text.match(/https:\/\/[^\s)"']*dspncdn\.com\/[^\s)"']+/gi) ||
                        jinaRes.text.match(/https?:\/\/[^\s)"']+\.(?:jpg|jpeg|png|webp)/gi) || [];
      const valid = dspnImgs.filter(u => !u.includes('avatar') && !u.includes('logo'));
      if (valid.length > 0) {
        const unique = [...new Set(valid.map(m => m.replace(/[,.]$/, '').trim()))];
        return {
          success: true,
          platform: 'designspiration',
          platformName: PLATFORM_NAMES.designspiration,
          title: jinaRes.title || `Save de Designspiration #${id}`,
          author: '',
          images: unique.map((u, i) => ({ url: u, label: `Imagen Designspiration #${i + 1}`, isOriginal: i === 0 })),
          originalUrl: url
        };
      }
    }
  }

  return { success: false, images: [] };
}

// ── 9. Savee (savee.com / savee.it) ──────────────────────────────────────────
async function parseSaveeUrl(url) {
  if (url.includes('savee.com') && (url.includes('assets.') || url.includes('img.') || url.includes('/uploads/'))) {
    return {
      success: true,
      platform: 'savee',
      platformName: PLATFORM_NAMES.savee,
      title: 'Captura de Savee',
      author: '',
      images: [{ url, label: 'Imagen Savee Original', isOriginal: true }],
      originalUrl: url
    };
  }

  const iMatch = url.match(/savee\.(?:com|it)\/(?:.*\/)?i\/([a-zA-Z0-9_-]+)/i);
  if (iMatch) {
    const id = iMatch[1];
    const jinaRes = await extractImagesViaJina(url);
    if (jinaRes && jinaRes.text) {
      const saveeImgs = jinaRes.text.match(/https:\/\/(?:assets\.savee\.it|img\.savee\.com)[^\s)"']+/gi) ||
                        jinaRes.text.match(/https?:\/\/[^\s)"']+\.(?:jpg|jpeg|png|webp)/gi) || [];
      const valid = saveeImgs.filter(u => !u.includes('avatar') && !u.includes('logo'));
      if (valid.length > 0) {
        const unique = [...new Set(valid.map(m => m.replace(/[,.]$/, '').trim()))];
        return {
          success: true,
          platform: 'savee',
          platformName: PLATFORM_NAMES.savee,
          title: jinaRes.title || `Colección Savee #${id}`,
          author: '',
          images: unique.map((u, i) => ({ url: u, label: `Imagen Savee #${i + 1}`, isOriginal: i === 0 })),
          originalUrl: url
        };
      }
    }
  }

  return { success: false, images: [] };
}

// ── 10. Pearltrees ───────────────────────────────────────────────────────────
async function parsePearltreesUrl(url) {
  if (url.includes('cdn.pearltrees.com') || url.includes('pearltrees.com/s/file/')) {
    return {
      success: true,
      platform: 'pearltrees',
      platformName: PLATFORM_NAMES.pearltrees,
      title: 'Archivo de Pearltrees',
      author: '',
      images: [{ url, label: 'Asset Pearltrees', isOriginal: true }],
      originalUrl: url
    };
  }

  const pMatch = url.match(/pearltrees\.com\/p\/([a-zA-Z0-9_-]+)/i);
  if (pMatch) {
    const id = pMatch[1];
    const jinaRes = await extractImagesViaJina(url);
    if (jinaRes && jinaRes.text) {
      const ptImgs = jinaRes.text.match(/https:\/\/(?:cdn\.)?pearltrees\.com\/[^\s)"']+/gi) ||
                     jinaRes.text.match(/https?:\/\/[^\s)"']+\.(?:jpg|jpeg|png|webp)/gi) || [];
      const valid = ptImgs.filter(u => !u.includes('avatar') && !u.includes('logo'));
      if (valid.length > 0) {
        const unique = [...new Set(valid.map(m => m.replace(/[,.]$/, '').trim()))];
        return {
          success: true,
          platform: 'pearltrees',
          platformName: PLATFORM_NAMES.pearltrees,
          title: jinaRes.title || `Perla #${id}`,
          author: '',
          images: unique.map((u, i) => ({ url: u, label: `Imagen Pearltrees #${i + 1}`, isOriginal: i === 0 })),
          originalUrl: url
        };
      }
    }
  }

  return { success: false, images: [] };
}

// ── 11. Imgur ────────────────────────────────────────────────────────────────
function parseImgurUrl(url) {
  const imgurMatch = url.match(/imgur\.com\/(?:gallery\/|a\/)?([a-zA-Z0-9]{5,8})(?:[^\w]|$)/i);
  if (imgurMatch && !url.includes('i.imgur.com')) {
    const id = imgurMatch[1];
    return {
      success: true,
      platform: 'imgur',
      platformName: PLATFORM_NAMES.imgur,
      title: `Imgur #${id}`,
      author: '',
      images: [
        { url: `https://i.imgur.com/${id}.png`, label: 'PNG de Alta Calidad', isOriginal: true },
        { url: `https://i.imgur.com/${id}.jpg`, label: 'JPG' },
        { url: `https://i.imgur.com/${id}.gif`, label: 'GIF Animado' }
      ],
      originalUrl: url
    };
  }
  return { success: false, images: [] };
}

// ── 12. Giphy ────────────────────────────────────────────────────────────────
function parseGiphyUrl(url) {
  const giphyMatch = url.match(/giphy\.com\/gifs\/(?:[a-zA-Z0-9_-]+-)?([a-zA-Z0-9]+)$/i);
  if (giphyMatch && !url.includes('media.giphy.com')) {
    const id = giphyMatch[1];
    return {
      success: true,
      platform: 'giphy',
      platformName: PLATFORM_NAMES.giphy,
      title: `GIF de Giphy #${id}`,
      author: '',
      images: [
        { url: `https://media.giphy.com/media/${id}/giphy.gif`, label: 'GIF Original', isOriginal: true },
        { url: `https://media.giphy.com/media/${id}/200.gif`, label: 'Miniatura rápida' }
      ],
      originalUrl: url
    };
  }
  return { success: false, images: [] };
}

// ── 13. Twitter / X ──────────────────────────────────────────────────────────
function parseTwitterMediaUrl(url) {
  if (url.includes('pbs.twimg.com/media/')) {
    const baseUrl = url.split('?')[0];
    return {
      success: true,
      platform: 'twitter',
      platformName: PLATFORM_NAMES.twitter,
      title: 'Imagen de Twitter/X',
      author: '',
      images: [
        { url: `${baseUrl}?format=png&name=large`, label: 'Resolución Máxima (PNG Large)', isOriginal: true },
        { url: `${baseUrl}?format=jpg&name=large`, label: 'Resolución Grande (JPG)' },
        { url, label: 'Enlace directo copiado' }
      ],
      originalUrl: url
    };
  }
  return { success: false, images: [] };
}

// ═════════════════════════════════════════════════════════════════════════════
// RETROCOMPATIBILIDAD Y PIPELINE DE DESCARGA
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Devuelve un array plano de URLs candidatas ordenadas por calidad.
 * Compatible con la firma anterior de imageUrlResolver.js.
 * @param {string} rawUrl
 * @returns {Promise<string[]>}
 */
export async function resolveCandidateImageUrls(rawUrl) {
  const parsed = await parseMediaUrl(rawUrl);
  if (parsed.images && parsed.images.length > 0) {
    return parsed.images.map(img => img.url);
  }
  return rawUrl ? [rawUrl.trim()] : [];
}

/**
 * Descarga una imagen convirtiéndola en un objeto File de alta fidelidad.
 * Utiliza wsrv.nl como proxy edge principal (remueve la cabecera referer para evadir
 * hotlinking de Cloudflare/AWS y soporta GIFs preservando todos sus fotogramas).
 * @param {string} rawUrl
 * @returns {Promise<File>}
 */
export async function fetchImageAsFileFromUrl(rawUrl) {
  const candidates = await resolveCandidateImageUrls(rawUrl);
  if (!candidates.length) {
    throw new Error('URL de imagen no válida');
  }

  let lastError = null;

  for (const targetUrl of candidates) {
    const isGif = targetUrl.toLowerCase().includes('.gif') || rawUrl.toLowerCase().includes('.gif');

    // Pipeline prioritario de descarga
    const endpoints = [];

    // 0. Si estamos en entorno de navegador, usar prioritariamente el proxy local de alta velocidad sin CORS
    if (typeof window !== 'undefined') {
      endpoints.push(`/api/media-proxy?url=${encodeURIComponent(targetUrl)}`);
    }

    // 1. wsrv.nl: Edge CDN sin referer, soporte de GIFs con n=-1, bypass CORS
    endpoints.push(`https://wsrv.nl/?url=${encodeURIComponent(targetUrl)}${isGif ? '&n=-1' : ''}`);
    // 2. Directo (hosts amigos de CORS como Imgur, Pixiv.cat, Are.na, Discord)
    endpoints.push(targetUrl);
    // 3. Mirror images.weserv.nl
    endpoints.push(`https://images.weserv.nl/?url=${encodeURIComponent(targetUrl)}${isGif ? '&n=-1' : ''}`);

    for (const endpoint of endpoints) {
      try {
        const res = await fetch(endpoint, {
          signal: AbortSignal.timeout(8000),
          mode: 'cors'
        });

        if (res.ok) {
          const contentType = (res.headers.get('content-type') || '').toLowerCase();
          // Ignorar respuestas erróneas que devuelvan páginas HTML
          if (contentType.includes('text/html') && !endpoint.includes('blob:')) {
            continue;
          }

          const blob = await res.blob();
          if (blob && blob.size > 120) {
            let mime = blob.type || contentType || 'image/png';
            if (isGif || mime.includes('gif')) mime = 'image/gif';
            else if (mime.includes('webp')) mime = 'image/webp';
            else if (mime.includes('jpeg') || mime.includes('jpg')) mime = 'image/jpeg';
            else mime = 'image/png';

            const ext = isGif ? 'gif' : (mime.includes('webp') ? 'webp' : (mime.includes('jpeg') || mime.includes('jpg') ? 'jpg' : 'png'));
            return new File([blob], `media_asset_${Date.now()}.${ext}`, { type: mime });
          }
        }
      } catch (err) {
        lastError = err;
      }
    }

    // Fallback Canvas Image en caso de que fetch esté restringido
    try {
      const fileFromCanvas = await loadViaCanvasImage(targetUrl, isGif);
      if (fileFromCanvas) return fileFromCanvas;
    } catch (e) {}
  }

  throw lastError || new Error('No se pudo descargar la imagen desde el servidor de origen.');
}

/**
 * Fallback usando objeto Image() del DOM con proxy wsrv para pintar a Canvas
 */
function loadViaCanvasImage(targetUrl, isGif) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    const proxyUrl = `https://wsrv.nl/?url=${encodeURIComponent(targetUrl)}${isGif ? '&n=-1' : ''}`;

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        canvas.toBlob((blob) => {
          if (!blob) return reject(new Error('Canvas toBlob failed'));
          const file = new File([blob], `canvas_asset_${Date.now()}.png`, { type: 'image/png' });
          resolve(file);
        }, 'image/png');
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = () => reject(new Error('Image onerror failed'));
    img.src = proxyUrl;
  });
}

