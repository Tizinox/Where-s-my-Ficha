/**
 * core/db/dexie.ts
 * Instancia Dexie.js para TacticalRosterDB.
 * Incluye migración automática desde idb-keyval (legacy).
 */

import Dexie, { type Table } from 'dexie';

export interface MetaRecord {
  key: string;
  value: unknown;
}

export class TacticalRosterDatabase extends Dexie {
  characters!: Table<Record<string, any>, string>;
  meta!: Table<MetaRecord, string>;

  constructor() {
    super('TacticalRosterDB');
    this.version(1).stores({
      characters: 'id, name, updatedAt',
      meta: 'key',
    });
  }
}

export const db = new TacticalRosterDatabase();

let _migrationRan = false;

export async function runMigrationIfNecessary(): Promise<void> {
  if (_migrationRan) return;
  _migrationRan = true;

  const existingCount = await db.characters.count();
  if (existingCount > 0) {
    console.log('Almacenamiento local verificado y listo.');
    return;
  }

  try {
    const legacyDbExists = await checkLegacyDbExists('keyval-store');
    if (!legacyDbExists) {
      console.log('Almacenamiento verificado. No hay datos antiguos que migrar.');
      return;
    }

    console.log('Sincronizando datos de personajes previos...');
    const legacyData = await readAllFromIdbKeyval();
    const characters: Record<string, any>[] = [];
    let activeId: unknown = null;

    for (const [key, value] of legacyData) {
      const strKey = String(key);
      if (strKey.startsWith('wimsf_char_') && value && typeof value === 'object') {
        characters.push(value as Record<string, any>);
      } else if (strKey === 'wimsf_active_id') {
        activeId = value;
      }
    }

    if (characters.length === 0) {
      console.log('Almacenamiento verificado y listo.');
      return;
    }

    await db.characters.bulkPut(characters);
    console.log(`${characters.length} personaje(s) sincronizado(s) con éxito.`);

    if (activeId) {
      await db.meta.put({ key: 'activeId', value: activeId });
    }

    await clearLegacyIdbKeyval();
    console.log('Limpieza de temporales completada.');
  } catch (e) {
    console.error('Error durante la sincronización inicial de datos:', e);
    _migrationRan = false;
  }
}

function checkLegacyDbExists(dbName: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof indexedDB === 'undefined') {
      resolve(false);
      return;
    }
    if (indexedDB.databases) {
      indexedDB
        .databases()
        .then((dbs) => resolve(dbs.some((d) => d.name === dbName)))
        .catch(() => resolve(false));
    } else {
      resolve(false);
    }
  });
}

function readAllFromIdbKeyval(): Promise<Array<[string, unknown]>> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('keyval-store');
    let abortedUpgrade = false;

    request.onerror = () => {
      if (abortedUpgrade) {
        resolve([]);
      } else {
        reject(request.error);
      }
    };

    request.onsuccess = () => {
      const idb = request.result;
      if (!idb.objectStoreNames.contains('keyval')) {
        idb.close();
        resolve([]);
        return;
      }
      const tx = idb.transaction('keyval', 'readonly');
      const store = tx.objectStore('keyval');
      const entries: Array<[string, unknown]> = [];

      const cursorReq = store.openCursor();
      cursorReq.onsuccess = () => {
        const cursor = cursorReq.result;
        if (cursor) {
          entries.push([String(cursor.key), cursor.value]);
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
      abortedUpgrade = true;
      request.result.close();
      request.transaction?.abort();
    };
  });
}

function clearLegacyIdbKeyval(): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('keyval-store');
    let abortedUpgrade = false;

    request.onerror = () => {
      if (abortedUpgrade) resolve();
      else reject(request.error);
    };

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

    request.onupgradeneeded = () => {
      abortedUpgrade = true;
      request.result.close();
      request.transaction?.abort();
    };
  });
}

