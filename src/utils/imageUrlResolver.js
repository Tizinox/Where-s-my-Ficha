/**
 * utils/imageUrlResolver.js
 * Motor inteligente de resolución y descarga de imágenes desde URLs externas.
 * Soporta Pinterest, ArtStation, Pixiv, DeviantArt, Imgur, Discord, Twitter/X,
 * Giphy, Tenor, Google Images y cualquier URL web o enlace directo con bypass CORS automático.
 */

/**
 * Normaliza y resuelve la URL directa de la imagen a partir de cualquier enlace de galería o plataforma.
 * @param {string} rawUrl
 * @returns {Promise<string[]>} Lista ordenada de URLs candidatas para descargar
 */
export async function resolveCandidateImageUrls(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return [];
  let url = rawUrl.trim();

  // 1. Desenvolver redirecciones de Google Images / Google Search
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes('google.') && (parsed.searchParams.has('imgurl') || parsed.searchParams.has('url') || parsed.searchParams.has('q'))) {
      const unwrapped = parsed.searchParams.get('imgurl') || parsed.searchParams.get('url') || parsed.searchParams.get('q');
      if (unwrapped && unwrapped.startsWith('http')) {
        url = unwrapped;
      }
    }
  } catch (e) {}

  const candidates = [];

  // 2. Pixiv (artworks o i.pximg.net) -> pixiv.cat y pixiv.re reverse proxies
  const pixivMatch = url.match(/pixiv\.net\/(?:[a-zA-Z_-]+\/)?artworks\/(\d+)(?:#(\d+))?/i) ||
                     url.match(/pixiv\.net\/member_illust\.php\?.*illust_id=(\d+)/i);
  if (pixivMatch) {
    const illustId = pixivMatch[1];
    const page = pixivMatch[2] ? `-${pixivMatch[2]}` : '';
    candidates.push(`https://pixiv.cat/${illustId}${page}.png`);
    candidates.push(`https://pixiv.cat/${illustId}${page}.jpg`);
    candidates.push(`https://pixiv.re/${illustId}${page}.png`);
    return candidates;
  }
  if (url.includes('i.pximg.net/')) {
    const pxMatch = url.match(/(\d+)(?:_p(\d+))?\.(?:jpg|jpeg|png|gif|webp)/i);
    if (pxMatch) {
      const page = pxMatch[2] ? `-${parseInt(pxMatch[2]) + 1}` : '';
      candidates.push(`https://pixiv.cat/${pxMatch[1]}${page}.png`);
      candidates.push(`https://pixiv.cat/${pxMatch[1]}${page}.jpg`);
      return candidates;
    }
  }

  // 3. Pinterest (Imágenes directas, Pins o shortlinks pin.it)
  if (url.includes('i.pinimg.com')) {
    const hiResOrig = url.replace(/\/(236x|474x|564x|736x)\//, '/originals/');
    const hiRes736 = url.replace(/\/(236x|474x|564x)\//, '/736x/');
    candidates.push(hiResOrig);
    candidates.push(hiRes736);
    candidates.push(url);
    return candidates;
  }

  const pinterestPinMatch = url.match(/pinterest\.[a-z.]+(?:\/.*)?\/pin\/(\d+)/i) ||
                           url.match(/\/pin\/(\d+)/i) ||
                           url.match(/pin\.it\/([a-zA-Z0-9]+)/i);

  if (pinterestPinMatch) {
    let pinId = pinterestPinMatch[1];

    // Si es enlace corto tipo pin.it/XXXX, extraer ID resolviendo la redirección
    if (!pinId || isNaN(Number(pinId))) {
      try {
        const unwrapUrl = `https://corsproxy.io/?url=${encodeURIComponent(url)}`;
        const unwrapRes = await fetch(unwrapUrl);
        const html = await unwrapRes.text();
        const m = html.match(/\/pin\/(\d+)/i) || html.match(/pin_ids=(\d+)/i);
        if (m) pinId = m[1];
      } catch (e) {}
    }

    if (pinId && !isNaN(Number(pinId))) {
      try {
        const pinApiUrl = `https://widgets.pinterest.com/v3/pidgets/pins/info/?pin_ids=${pinId}`;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        const pinRes = await fetch(pinApiUrl, { signal: controller.signal });
        clearTimeout(timeout);

        if (pinRes.ok) {
          const pinData = await pinRes.json();
          const images = pinData?.data?.[0]?.images;
          if (images) {
            const baseImg = images['564x']?.url || images['236x']?.url || Object.values(images)[0]?.url;
            if (baseImg) {
              const orig = baseImg.replace(/\/(236x|474x|564x|736x)\//, '/originals/');
              const high = baseImg.replace(/\/(236x|474x|564x)\//, '/736x/');
              candidates.push(orig);
              candidates.push(high);
              candidates.push(baseImg);
              return candidates;
            }
          }
        }
      } catch (e) {
        console.warn('Error al resolver Pin de Pinterest vía widgets API:', e);
      }
    }
  }

  // 4. Imgur (álbumes, galerías o páginas)
  const imgurMatch = url.match(/imgur\.com\/(?:gallery\/|a\/)?([a-zA-Z0-9]{5,8})(?:[^\w]|$)/i);
  if (imgurMatch && !url.includes('i.imgur.com')) {
    candidates.push(`https://i.imgur.com/${imgurMatch[1]}.png`);
    candidates.push(`https://i.imgur.com/${imgurMatch[1]}.jpg`);
    candidates.push(`https://i.imgur.com/${imgurMatch[1]}.gif`);
  }

  // 5. Giphy
  const giphyMatch = url.match(/giphy\.com\/gifs\/(?:[a-zA-Z0-9_-]+-)?([a-zA-Z0-9]+)$/i);
  if (giphyMatch && !url.includes('media.giphy.com')) {
    candidates.push(`https://media.giphy.com/media/${giphyMatch[1]}/giphy.gif`);
  }

  // 6. Twitter / X (pbs.twimg.com)
  if (url.includes('pbs.twimg.com/media/')) {
    if (!url.includes('format=')) {
      candidates.push(url.includes('?') ? `${url}&format=png&name=large` : `${url}?format=png&name=large`);
    }
    candidates.push(url);
    return candidates;
  }

  // 7. Discord attachments
  if (url.includes('discordapp.com/') || url.includes('discordapp.net/')) {
    candidates.push(url);
  }

  // 8. DeviantArt oEmbed API
  if (url.includes('deviantart.com/') && url.includes('/art/')) {
    try {
      const oembedUrl = `https://backend.deviantart.com/oembed?url=${encodeURIComponent(url)}`;
      const res = await fetch(oembedUrl);
      if (res.ok) {
        const data = await res.json();
        if (data.url) candidates.push(data.url);
        if (data.thumbnail_url) candidates.push(data.thumbnail_url);
        if (candidates.length > 0) return candidates;
      }
    } catch (e) {}
  }

  // 9. Si la URL ya parece ser un archivo de imagen directo
  const isDirectImageExt = /\.(jpg|jpeg|png|webp|gif|svg|avif|bmp)(\?.*)?$/i.test(url) ||
                          url.includes('i.pinimg.com') ||
                          url.includes('cdna.artstation.com') ||
                          url.includes('cdnb.artstation.com') ||
                          url.includes('images-wixmp-') ||
                          url.includes('i.redd.it') ||
                          url.includes('preview.redd.it');

  if (isDirectImageExt) {
    candidates.push(url);
    return candidates;
  }

  // 10. Si es una página web (Pinterest pin, ArtStation artwork, Reddit, Wiki, Blog, etc.)
  // Intentar extraer metadatos OpenGraph (og:image) o Twitter Card
  const metaImg = await extractMetaImageFromWebpage(url);
  if (metaImg) {
    if (metaImg.includes('i.pinimg.com')) {
      candidates.push(metaImg.replace(/\/(236x|474x|564x)\//, '/736x/'));
    }
    candidates.push(metaImg);
    return candidates;
  }

  // Fallback
  if (!candidates.includes(url)) {
    candidates.push(url);
  }

  return candidates;
}

/**
 * Extrae la imagen principal de una página web usando proxies CORS para leer meta etiquetas og:image
 * @param {string} pageUrl
 * @returns {Promise<string|null>}
 */
async function extractMetaImageFromWebpage(pageUrl) {
  const proxies = [
    (u) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(u)}`,
    (u) => `https://corsproxy.io/?url=${encodeURIComponent(u)}`,
    (u) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`
  ];

  for (const proxyFn of proxies) {
    try {
      const pUrl = proxyFn(pageUrl);
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4500);
      const res = await fetch(pUrl, {
        signal: controller.signal,
        headers: { 'Accept': 'text/html,application/xhtml+xml,application/xml' }
      });
      clearTimeout(timeout);
      if (!res.ok) continue;
      const html = await res.text();

      const ogMatch = html.match(/<meta[^>]+property=["']og:image(?::secure_url)?["'][^>]+content=["']([^"']+)["']/i) ||
                      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image(?::secure_url)?["']/i) ||
                      html.match(/<meta[^>]+name=["']twitter:image(?::src)?["'][^>]+content=["']([^"']+)["']/i) ||
                      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image(?::src)?["']/i) ||
                      html.match(/<link[^>]+rel=["']image_src["'][^>]+href=["']([^"']+)["']/i);

      if (ogMatch && ogMatch[1]) {
        let img = ogMatch[1].replace(/&amp;/g, '&').trim();
        if (img.startsWith('//')) img = 'https:' + img;
        return img;
      }
    } catch (e) {}
  }
  return null;
}

/**
 * Descarga una imagen convirtiéndola en un File compatible con Cropper / almacenamiento.
 * Utiliza múltiples proxies globales (wsrv.nl, weserv, codetabs, corsproxy) para evadir bloqueos de CORS y hotlink.
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

    // Pipeline de proxies de alto rendimiento
    const endpoints = [
      // 1. wsrv.nl (Cloudflare Edge Image Proxy, universal, strip referer, soporta GIFs con &n=-1)
      `https://wsrv.nl/?url=${encodeURIComponent(targetUrl)}${isGif ? '&n=-1' : ''}`,
      // 2. Directo (funciona con hosts amigables con CORS como Discord, Imgur, Pixiv.cat, etc.)
      targetUrl,
      // 3. images.weserv.nl (Mirror)
      `https://images.weserv.nl/?url=${encodeURIComponent(targetUrl)}${isGif ? '&n=-1' : ''}`,
      // 4. CodeTabs CORS Proxy
      `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(targetUrl)}`,
      // 5. CORSProxy.io
      `https://corsproxy.io/?url=${encodeURIComponent(targetUrl)}`
    ];

    for (const endpoint of endpoints) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 7500);
        const res = await fetch(endpoint, {
          signal: controller.signal,
          mode: 'cors'
        });
        clearTimeout(timeout);

        if (res.ok) {
          const contentType = (res.headers.get('content-type') || '').toLowerCase();
          // Ignorar respuestas que sean páginas HTML de error
          if (contentType.includes('text/html') && !endpoint.includes('blob:')) {
            continue;
          }

          const blob = await res.blob();
          if (blob && blob.size > 150) {
            let mime = blob.type || contentType || 'image/png';
            if (isGif || mime.includes('gif')) mime = 'image/gif';
            else if (mime.includes('webp')) mime = 'image/webp';
            else if (mime.includes('jpeg') || mime.includes('jpg')) mime = 'image/jpeg';
            else mime = 'image/png';

            const ext = isGif ? 'gif' : (mime.includes('webp') ? 'webp' : (mime.includes('jpeg') || mime.includes('jpg') ? 'jpg' : 'png'));
            return new File([blob], `url_asset_${Date.now()}.${ext}`, { type: mime });
          }
        }
      } catch (err) {
        lastError = err;
      }
    }

    // Fallback Canvas Image para el candidato si fetch está restringido en el origen
    try {
      const fileFromCanvas = await loadViaCanvasImage(targetUrl, isGif);
      if (fileFromCanvas) return fileFromCanvas;
    } catch (e) {}
  }

  throw lastError || new Error('No se pudo descargar la imagen desde los servidores de origen.');
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
