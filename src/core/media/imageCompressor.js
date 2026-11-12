/**
 * utils/imageCompressor.js
 * Helper reutilizable para comprimir imagenes usando la Canvas API.
 * Redimensiona a max 1080px, convierte a WebP.
 */

const MAX_SIZE = 1080;
const WEBP_QUALITY = 0.88;

/**
 * Comprime una imagen a WebP con maximo MAX_SIZE px en cualquier dimension.
 * Para GIFs animados, captura el primer frame como imagen estatica WebP.
 * @param {File} file
 * @returns {Promise<string>} DataURL en formato WebP
 */
export async function compressImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      let { width, height } = img;
      if (width > MAX_SIZE || height > MAX_SIZE) {
        if (width >= height) {
          height = Math.round((height / width) * MAX_SIZE);
          width = MAX_SIZE;
        } else {
          width = Math.round((width / height) * MAX_SIZE);
          height = MAX_SIZE;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      
      const dataUrl = canvas.toDataURL('image/webp', WEBP_QUALITY);
      
      // Cleanup for Garbage Collection
      URL.revokeObjectURL(objectUrl);
      canvas.width = 0;
      canvas.height = 0;
      img.src = '';
      
      resolve(dataUrl);
    };
    
    img.onerror = (err) => {
      URL.revokeObjectURL(objectUrl);
      reject(err);
    };
    
    img.src = objectUrl;
  });
}

/**
 * Comprime una imagen y retorna el DataURL junto con estadisticas de tamanio.
 * @param {File} file
 * @returns {Promise<{dataUrl: string, originalKB: number, compressedKB: number}>}
 */
export async function compressImageWithStats(file) {
  const dataUrl = await compressImage(file);
  const originalKB = Math.round(file.size / 1024);
  const base64Data = dataUrl.split(',')[1] || '';
  const compressedKB = Math.round((base64Data.length * 3 / 4) / 1024);
  return { dataUrl, originalKB, compressedKB };
}

/**
 * Lee un archivo como DataURL sin modificar sus bytes (ideal para GIFs animados o SVGs)
 * @param {File|Blob} file 
 * @returns {Promise<string>}
 */
export function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}
