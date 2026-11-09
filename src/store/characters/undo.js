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
  if (!obj) return '{}';
  const raw = window.Alpine?.raw ? window.Alpine.raw(obj) : obj;
  return JSON.stringify(raw, (key, value) => {
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
  if (typeof jsonStr !== 'string') return jsonStr || {};
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

    async undo() {
      if (!this.active) return;
      if (!this.undoStack || this.undoStack.length === 0) {
        window.Alpine?.store('app')?.toast('No hay acciones previas para deshacer en esta sesión.', 'info');
        return;
      }
      const stackIndex = this.undoStack.map(s => s.id).lastIndexOf(this.activeId);
      if (stackIndex === -1) {
        window.Alpine?.store('app')?.toast('No hay acciones previas para deshacer en este operativo.', 'info');
        return;
      }
      const [last] = this.undoStack.splice(stackIndex, 1);

      try {
        this.redoStack.push({
          id: this.active.id,
          snapshot: serializeUndoSnapshot(this.active),
          actionName: last.actionName,
          timestamp: Date.now()
        });
        if (this.redoStack.length > 30) {
          this.redoStack.shift();
          pruneUndoImagePool(this.undoStack, this.redoStack);
        }

        const restoredChar = ensureCharacterDefaults(deserializeUndoSnapshot(last.snapshot));
        const idx = this.list.findIndex(c => c.id === restoredChar.id);
        if (idx !== -1) {
          const current = this.list[idx];
          // Eliminar propiedades que ya no existan en el snapshot restaurado
          for (const k of Object.keys(current)) {
            if (!(k in restoredChar)) {
              delete current[k];
            }
          }
          // Asignar todas las propiedades restauradas al objeto reactivo existente en memoria
          Object.assign(current, restoredChar);

          if (this.activeId === current.id) {
            this.syncTabsToApp?.(current);
            this.clearTabCompletionCache?.();
            this.updateOverallCompletion?.();
          }
          await this._persist(current);
          this.scheduleAutoSave?.();
        }

        window.Alpine?.store('app')?.toast(`Acción deshecha: ${last.actionName}`, 'success');
      } catch (e) {
        console.error('[characters] Error al revertir la acción:', e);
        window.Alpine?.store('app')?.toast('Error al revertir la acción.', 'error');
      }
    },

    async redo() {
      if (!this.active) return;
      if (!this.redoStack || this.redoStack.length === 0) {
        window.Alpine?.store('app')?.toast('No hay acciones para rehacer.', 'info');
        return;
      }
      const stackIndex = this.redoStack.map(s => s.id).lastIndexOf(this.activeId);
      if (stackIndex === -1) {
        window.Alpine?.store('app')?.toast('No hay acciones para rehacer en este operativo.', 'info');
        return;
      }
      const [next] = this.redoStack.splice(stackIndex, 1);

      try {
        this.undoStack.push({
          id: this.active.id,
          snapshot: serializeUndoSnapshot(this.active),
          actionName: next.actionName,
          timestamp: Date.now()
        });
        if (this.undoStack.length > 30) {
          this.undoStack.shift();
          pruneUndoImagePool(this.undoStack, this.redoStack);
        }

        const restoredChar = ensureCharacterDefaults(deserializeUndoSnapshot(next.snapshot));
        const idx = this.list.findIndex(c => c.id === restoredChar.id);
        if (idx !== -1) {
          const current = this.list[idx];
          // Eliminar propiedades que ya no existan en el snapshot restaurado
          for (const k of Object.keys(current)) {
            if (!(k in restoredChar)) {
              delete current[k];
            }
          }
          // Asignar todas las propiedades restauradas al objeto reactivo existente en memoria
          Object.assign(current, restoredChar);

          if (this.activeId === current.id) {
            this.syncTabsToApp?.(current);
            this.clearTabCompletionCache?.();
            this.updateOverallCompletion?.();
          }
          await this._persist(current);
          this.scheduleAutoSave?.();
        }

        window.Alpine?.store('app')?.toast(`Acción rehecha: ${next.actionName}`, 'success');
      } catch (e) {
        console.error('[characters] Error al rehacer la acción:', e);
        window.Alpine?.store('app')?.toast('Error al rehacer la acción.', 'error');
      }
    }
  };
}
