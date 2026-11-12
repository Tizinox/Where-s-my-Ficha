/**
 * core/db/storage.ts
 * Wrapper seguro y centralizado para localStorage con manejo de excepciones y serialización JSON.
 */

function isQuotaError(e: unknown): boolean {
  const err = e as { name?: string; code?: number; message?: string } | null;
  if (!err) return false;
  return (
    err.name === 'QuotaExceededError' ||
    err.code === 22 ||
    err.code === 1014 ||
    Boolean(err.message && err.message.toLowerCase().includes('quota'))
  );
}

export const ls = {
  get(key: string, fallback: string | null = null): string | null {
    try {
      if (typeof localStorage === 'undefined') return fallback;
      const val = localStorage.getItem(key);
      return val !== null ? val : fallback;
    } catch {
      return fallback;
    }
  },

  getJSON<T = unknown>(key: string, fallback: T | null = null): T | null {
    try {
      if (typeof localStorage === 'undefined') return fallback;
      const val = localStorage.getItem(key);
      return val !== null ? (JSON.parse(val) as T) : fallback;
    } catch {
      return fallback;
    }
  },

  set(key: string, val: unknown): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, typeof val === 'string' ? val : String(val));
      }
    } catch (e) {
      if (isQuotaError(e)) {
        console.warn(
          `[storage] Cuota de localStorage (~5MB) alcanzada al guardar clave "${key}". La app utiliza IndexedDB como almacenamiento principal persistente.`
        );
      } else {
        console.warn(`[storage] Error guardando clave "${key}":`, e);
      }
    }
  },

  setJSON(key: string, val: unknown): void {
    try {
      if (typeof localStorage !== 'undefined') {
        const jsonStr = JSON.stringify(val);
        if (jsonStr.length > 1_500_000) {
          localStorage.removeItem(key);
          console.warn(
            `[storage] Omitiendo almacenamiento en localStorage para clave "${key}" (${Math.round(jsonStr.length / 1024)} KB) para resguardar la cuota del navegador. Los datos se almacenan en IndexedDB.`
          );
          return;
        }
        localStorage.setItem(key, jsonStr);
      }
    } catch (e) {
      if (isQuotaError(e)) {
        console.warn(
          `[storage] Cuota de localStorage (~5MB) alcanzada al guardar JSON para clave "${key}". Los datos están a salvo en IndexedDB (sin límite de 5MB).`
        );
      } else {
        console.warn(`[storage] Error guardando JSON para clave "${key}":`, e);
      }
    }
  },

  remove(key: string): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(key);
      }
    } catch {}
  },

  keys(): string[] {
    try {
      if (typeof localStorage === 'undefined') return [];
      return Object.keys(localStorage);
    } catch {
      return [];
    }
  },
};

