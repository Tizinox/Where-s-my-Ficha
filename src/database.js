/**
 * database.js
 * Instancia Dexie.js para TacticalRosterDB.
 * Incluye migración automática desde idb-keyval (legacy).
 */

import Dexie from 'dexie';

// ── Definición de la Base de Datos ───────────────────────────────────────────
export const db = new Dexie('TacticalRosterDB');

db.version(1).stores({
  // Primary key: id | Índices secundarios: name, updatedAt
  characters: 'id, name, updatedAt',
  // Tabla auxiliar key-value para metadatos (activeId, etc.)
  meta: 'key',
});

// ── Migración Automática desde idb-keyval (Legacy Bridge) ────────────────────
let _migrationRan = false;

/**
 * Migra datos existentes desde el store idb-keyval al store Dexie.
 * Se ejecuta una sola vez al cargar la app.
 *
 * idb-keyval usa una BD llamada "keyval-store" con un objectStore "keyval".
 * Los personajes están almacenados con claves "wimsf_char_<id>" y
 * el ID activo con clave "wimsf_active_id".
 */
export async function runMigrationIfNecessary() {
  if (_migrationRan) return;
  _migrationRan = true;

  // Si ya hay personajes en Dexie, la migración ya ocurrió previamente
  const existingCount = await db.characters.count();
  if (existingCount > 0) {
    console.log('Almacenamiento local verificado y listo.');
    return;
  }

  // Intentar abrir la BD legacy de idb-keyval
  try {
    const legacyDbExists = await checkLegacyDbExists('keyval-store');
    if (!legacyDbExists) {
      console.log('Almacenamiento verificado. No hay datos antiguos que migrar.');
      return;
    }

    console.log('Sincronizando datos de personajes previos...');

    const legacyData = await readAllFromIdbKeyval();
    const characters = [];
    let activeId = null;

    for (const [key, value] of legacyData) {
      const strKey = String(key);
      if (strKey.startsWith('wimsf_char_') && value) {
        characters.push(value);
      } else if (strKey === 'wimsf_active_id') {
        activeId = value;
      }
    }

    if (characters.length === 0) {
      console.log('Almacenamiento verificado y listo.');
      return;
    }

    // Insertar personajes en Dexie
    await db.characters.bulkPut(characters);
    console.log(`✅ ${characters.length} personaje(s) sincronizado(s) con éxito.`);

    // Migrar activeId
    if (activeId) {
      await db.meta.put({ key: 'activeId', value: activeId });
    }

    // Marcar la BD legacy como migrada borrando sus entradas
    await clearLegacyIdbKeyval();
    console.log('🧹 Limpieza de temporales completada.');

  } catch (e) {
    console.error('Error durante la sincronización inicial de datos:', e);
    // No bloqueamos la app — simplemente la migración no se completó.
    // En el próximo arranque se reintentará.
    _migrationRan = false;
  }
}

// ── Helpers para leer la BD legacy de idb-keyval ─────────────────────────────

/**
 * Comprueba si una base de datos IndexedDB existe sin crearla.
 */
function checkLegacyDbExists(dbName) {
  return new Promise((resolve) => {
    if (typeof indexedDB === 'undefined') {
      resolve(false);
      return;
    }
    // indexedDB.databases() es soportado en Chrome/Edge/Firefox modernos
    if (indexedDB.databases) {
      indexedDB.databases().then(dbs => {
        resolve(dbs.some(d => d.name === dbName));
      }).catch(() => {
        // Fallback: intentar abrir
        resolve(true);
      });
    } else {
      // Fallback para navegadores sin databases()
      resolve(true);
    }
  });
}

/**
 * Lee todos los pares key-value del store "keyval" de la BD "keyval-store" (idb-keyval default).
 * @returns {Promise<Array<[string, any]>>}
 */
function readAllFromIdbKeyval() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('keyval-store');

    request.onerror = () => reject(request.error);

    request.onsuccess = () => {
      const idb = request.result;
      if (!idb.objectStoreNames.contains('keyval')) {
        idb.close();
        resolve([]);
        return;
      }
      const tx = idb.transaction('keyval', 'readonly');
      const store = tx.objectStore('keyval');
      const entries = [];

      const cursorReq = store.openCursor();
      cursorReq.onsuccess = () => {
        const cursor = cursorReq.result;
        if (cursor) {
          entries.push([cursor.key, cursor.value]);
          cursor.continue();
        }
      };

      tx.oncomplete = () => {
        idb.close();
        resolve(entries);
      };
      tx.onerror = () => {
        idb.close();
        reject(tx.error);
      };
    };

    request.onupgradeneeded = () => {
      // La BD no existía, cerrar sin crear nada
      request.result.close();
      request.transaction?.abort();
      resolve([]);
    };
  });
}

/**
 * Borra todas las entradas del store legacy de idb-keyval.
 */
function clearLegacyIdbKeyval() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('keyval-store');

    request.onerror = () => reject(request.error);

    request.onsuccess = () => {
      const idb = request.result;
      if (!idb.objectStoreNames.contains('keyval')) {
        idb.close();
        resolve();
        return;
      }
      const tx = idb.transaction('keyval', 'readwrite');
      const store = tx.objectStore('keyval');
      store.clear();

      tx.oncomplete = () => {
        idb.close();
        resolve();
      };
      tx.onerror = () => {
        idb.close();
        reject(tx.error);
      };
    };
  });
}
