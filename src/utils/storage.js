/**
 * utils/storage.js
 * Wrapper seguro y centralizado para localStorage con manejo de excepciones y serialización JSON.
 */

export const ls = {
  /**
   * Obtiene un valor de localStorage de forma segura
   * @param {string} key 
   * @param {string|null} fallback 
   * @returns {string|null}
   */
  get(key, fallback = null) {
    try {
      if (typeof localStorage === 'undefined') return fallback;
      const val = localStorage.getItem(key);
      return val !== null ? val : fallback;
    } catch {
      return fallback;
    }
  },

  /**
   * Obtiene y parsea un objeto JSON de localStorage
   * @param {string} key 
   * @param {any} fallback 
   * @returns {any}
   */
  getJSON(key, fallback = null) {
    try {
      if (typeof localStorage === 'undefined') return fallback;
      const val = localStorage.getItem(key);
      return val !== null ? JSON.parse(val) : fallback;
    } catch {
      return fallback;
    }
  },

  /**
   * Guarda un valor en localStorage de forma segura
   * @param {string} key 
   * @param {any} val 
   */
  set(key, val) {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, typeof val === 'string' ? val : String(val));
      }
    } catch (e) {
      const isQuota = e?.name === 'QuotaExceededError' || e?.code === 22 || e?.code === 1014 || (e?.message && e.message.toLowerCase().includes('quota'));
      if (isQuota) {
        console.warn(`[storage] Cuota de localStorage (~5MB) alcanzada al guardar clave "${key}". La app utiliza IndexedDB como almacenamiento principal persistente.`);
      } else {
        console.warn(`[storage] Error guardando clave "${key}":`, e);
      }
    }
  },

  /**
   * Serializa y guarda un objeto como JSON en localStorage
   * @param {string} key 
   * @param {any} val 
   */
  setJSON(key, val) {
    try {
      if (typeof localStorage !== 'undefined') {
        const jsonStr = JSON.stringify(val);
        // Si el payload supera 1.5MB, omitir localStorage para evitar saturación de cuota (~5MB)
        if (jsonStr.length > 1500000) {
          console.warn(`[storage] Omitiendo almacenamiento en localStorage para clave "${key}" (${Math.round(jsonStr.length / 1024)} KB) para resguardar la cuota del navegador. Los datos se almacenan en IndexedDB.`);
          return;
        }
        localStorage.setItem(key, jsonStr);
      }
    } catch (e) {
      const isQuota = e?.name === 'QuotaExceededError' || e?.code === 22 || e?.code === 1014 || (e?.message && e.message.toLowerCase().includes('quota'));
      if (isQuota) {
        console.warn(`[storage] Cuota de localStorage (~5MB) alcanzada al guardar JSON para clave "${key}". Los datos están a salvo en IndexedDB (sin límite de 5MB).`);
      } else {
        console.warn(`[storage] Error guardando JSON para clave "${key}":`, e);
      }
    }
  },

  /**
   * Elimina una clave de localStorage
   * @param {string} key 
   */
  remove(key) {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(key);
      }
    } catch {}
  },

  /**
   * Retorna todas las claves de localStorage
   * @returns {string[]}
   */
  keys() {
    try {
      return typeof localStorage !== 'undefined' ? Object.keys(localStorage) : [];
    } catch {
      return [];
    }
  }
};
