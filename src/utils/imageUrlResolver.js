/**
 * utils/imageUrlResolver.js
 * Capa de compatibilidad retrocompatible hacia utils/mediaUrlEngine.js.
 * Exporta el motor unificado de URLs y descarga de medios para todas las vistas.
 */

export {
  PLATFORM_NAMES,
  unwrapSearchRedirects,
  parseMediaUrl,
  resolveCandidateImageUrls,
  fetchImageAsFileFromUrl
} from './mediaUrlEngine.js';
