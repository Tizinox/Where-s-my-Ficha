/**
 * store/characters/undo.js
 * Motor de Undo / Redo con Pool de Deduplicación de Imágenes Base64.
 * Reduce el consumo de RAM de cientos de megabytes a menos de 5 MB
 * preservando fidelidad total en la restauración de estados.
 */

import { ensureCharacterDefaults } from './schema.js';

const _undoImagePool = new Map();
const _undoImagePoolReverse = new Map(); // dataUri -> id para lookup O(1) inmediato
let _undoImageCounter = 0;

export function serializeUndoSnapshot(obj) {
  return JSON.stringify(obj, (key, value) => {
    if (typeof value === 'string' && value.startsWith('data:image/') && value.length > 256) {
      if (_undoImagePoolReverse.has(value)) {
        return `__IMG_POOL_REF_${_undoImagePoolReverse.get(value)}__`;
      }
      const newId = ++_undoImageCounter;
      _undoImagePool.set(newId, value);
      _undoImagePoolReverse.set(value, newId);
      return `__IMG_POOL_REF_${newId}__`;
    }
    return value;
  });
}

export function deserializeUndoSnapshot(jsonStr) {
  return JSON.parse(jsonStr, (key, value) => {
    if (typeof value === 'string' && value.startsWith('__IMG_POOL_REF_') && value.endsWith('__')) {
      const id = parseInt(value.slice(15, -2), 10);
      if (_undoImagePool.has(id)) {
        return _undoImagePool.get(id);
      }
    }
    return value;
  });
}

export function pruneUndoImagePool(undoStack, redoStack) {
  if (_undoImagePool.size <= 25) return;
  const activeRefs = new Set();
  const scanStack = (stack) => {
    for (const item of stack) {
      if (!item.snapshot) continue;
      const matches = item.snapshot.match(/__IMG_POOL_REF_(\d+)__/g);
      if (matches) {
        for (const m of matches) {
          const id = parseInt(m.slice(15, -2), 10);
          activeRefs.add(id);
        }
      }
    }
  };
  scanStack(undoStack);
  scanStack(redoStack);
  for (const id of _undoImagePool.keys()) {
    if (!activeRefs.has(id)) {
      const dataUri = _undoImagePool.get(id);
      if (dataUri) {
        _undoImagePoolReverse.delete(dataUri);
      }
      _undoImagePool.delete(id);
    }
  }
}

export function createUndoMethods() {
  return {
    undoStack: [],
    redoStack: [],

    pushUndoSnapshot(actionName = 'Modificación') {
      if (!this.active) return;
      try {
        this.undoStack.push({
          id: this.active.id,
          snapshot: serializeUndoSnapshot(this.active),
          actionName,
          timestamp: Date.now()
        });
        if (this.undoStack.length > 30) {
          this.undoStack.shift();
          pruneUndoImagePool(this.undoStack, this.redoStack);
        }
        this.redoStack = [];
      } catch (e) {
        console.warn('[characters] Error registrando snapshot de Undo:', e);
      }
    },

    undo() {
      if (this.undoStack.length === 0) {
        window.Alpine?.store('app')?.toast('No hay acciones previas para deshacer en esta sesión.', 'info');
        return;
      }
      const last = this.undoStack.pop();
      try {
        this.redoStack.push({
          id: this.active.id,
          snapshot: serializeUndoSnapshot(this.active),
          actionName: last.actionName,
          timestamp: Date.now()
        });

        const restoredChar = ensureCharacterDefaults(deserializeUndoSnapshot(last.snapshot));
        const idx = this.list.findIndex(c => c.id === restoredChar.id);
        if (idx !== -1) {
          this.list[idx] = restoredChar;
        }
        if (this.activeId === restoredChar.id) {
          Object.keys(this.active).forEach(k => delete this.active[k]);
          Object.assign(this.active, restoredChar);
          this.syncTabsToApp?.(restoredChar);
        }

        this._persist(restoredChar);
        window.Alpine?.store('app')?.toast(`Acción deshecha: ${last.actionName}`, 'success');
      } catch (e) {
        window.Alpine?.store('app')?.toast('Error al revertir la acción.', 'error');
      }
    },

    redo() {
      if (this.redoStack.length === 0) {
        window.Alpine?.store('app')?.toast('No hay acciones para rehacer.', 'info');
        return;
      }
      const next = this.redoStack.pop();
      try {
        this.undoStack.push({
          id: this.active.id,
          snapshot: serializeUndoSnapshot(this.active),
          actionName: next.actionName,
          timestamp: Date.now()
        });

        const restoredChar = ensureCharacterDefaults(deserializeUndoSnapshot(next.snapshot));
        const idx = this.list.findIndex(c => c.id === restoredChar.id);
        if (idx !== -1) {
          this.list[idx] = restoredChar;
        }
        if (this.activeId === restoredChar.id) {
          Object.keys(this.active).forEach(k => delete this.active[k]);
          Object.assign(this.active, restoredChar);
          this.syncTabsToApp?.(restoredChar);
        }

        this._persist(restoredChar);
        window.Alpine?.store('app')?.toast(`Acción rehecha: ${next.actionName}`, 'success');
      } catch (e) {
        window.Alpine?.store('app')?.toast('Error al rehacer la acción.', 'error');
      }
    }
  };
}
