/**
 * store/characters/folders.js
 * Gestión de carpetas organizadoras, agrupación de personajes y operaciones Drag y Drop.
 */

import { db } from '../../database.js';
import { compressImage } from '../../utils/imageCompressor.js';
import { ls } from '../../utils/storage.js';

export function createFolderMethods() {
  return {
    folders: [],
    activeFolderId: 'all', // 'all' | 'unassigned' | folderId
    folderModalOpen: false,
    folderModalMode: 'create', // 'create' | 'edit'
    folderForm: {
      id: null,
      name: '',
      icon: 'folder',
      customLogo: null,
      logoTransform: { zoom: 100, x: 50, y: 50 },
      color: '#00F0FF'
    },
    folderIconsCatalog: [
      'folder', 'sword', 'shield', 'skull', 'crown', 'zap', 'flame',
      'users', 'heart', 'sparkles', 'crosshair', 'book-open', 'bot',
      'ghost', 'target', 'gem', 'star', 'tag', 'box', 'archive'
    ],
    folderColorsCatalog: [
      '#00F0FF', '#F59E0B', '#EF4444', '#A855F7', '#10B981',
      '#EC4899', '#3B82F6', '#8B5CF6', '#F97316', '#64748B'
    ],

    // Estado Drag and Drop
    draggingCharId: null,
    dragOverFolderId: null,

    // Estado Confirmación de Eliminación de Carpeta (Modal dedicado sin confirm nativo)
    deleteFolderTarget: null,

    confirmDeleteFolder(folder) {
      if (!folder) return;
      this.deleteFolderTarget = folder;
      window.Alpine?.nextTick(() => window.lucide?.createIcons?.());
    },

    cancelDeleteFolder() {
      this.deleteFolderTarget = null;
    },

    async executeDeleteFolder() {
      if (!this.deleteFolderTarget) return;
      const folderId = this.deleteFolderTarget.id;
      this.deleteFolderTarget = null;
      await this.deleteFolder(folderId);
    },

    renderFolderIconSvg(iconName, className = 'w-4 h-4', color = 'currentColor', strokeWidth = 1.25) {
      const name = String(iconName || 'folder').trim();
      const pascal = name.replace(/(^\w|-\w)/g, t => t.replace(/-/g, '').toUpperCase());
      const iconLib = window.lucideIcons || {};
      const iconNode = iconLib[pascal] || iconLib['Folder'];
      if (!iconNode || !Array.isArray(iconNode)) {
        return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" class="${className}"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/></svg>`;
      }
      const children = iconNode.map(([tag, attrs]) => {
        const attrStr = Object.entries(attrs).map(([k, v]) => `${k}="${v}"`).join(' ');
        return `<${tag} ${attrStr}></${tag}>`;
      }).join('');
      return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" class="${className}">${children}</svg>`;
    },

    getFolderLogoStyle(item) {
      if (!item) return '';
      const t = item.logoTransform || item.customLogoTransform || { zoom: 100, x: 50, y: 50 };
      const zoom = (typeof t.zoom === 'number' ? t.zoom : 100) / 100;
      const x = typeof t.x === 'number' ? t.x : 50;
      const y = typeof t.y === 'number' ? t.y : 50;
      return `object-fit: cover; object-position: ${x}% ${y}%; transform: scale(${zoom}); transform-origin: ${x}% ${y}%;`;
    },

    resetFolderLogoTransform() {
      this.folderForm.logoTransform = { zoom: 100, x: 50, y: 50 };
    },

    adjustFolderLogoZoom(delta) {
      const current = this.folderForm.logoTransform?.zoom || 100;
      const next = Math.max(50, Math.min(300, current + delta));
      this.folderForm.logoTransform.zoom = next;
    },

    async saveFolders() {
      try {
        const raw = window.Alpine?.raw ? window.Alpine.raw(this.folders) : this.folders;
        const serialized = JSON.parse(JSON.stringify(raw));
        await db.meta.put({ key: 'folders', value: serialized });
        ls.setJSON('superficha_folders', serialized);
      } catch (e) {
        console.error('[characters] Error guardando carpetas:', e);
      }
    },

    openCreateFolderModal() {
      this.folderModalMode = 'create';
      const defaultColor = window.Alpine?.store('settings')?.accentColor || '#00F0FF';
      this.folderForm = {
        id: null,
        name: '',
        icon: 'folder',
        customLogo: null,
        logoTransform: { zoom: 100, x: 50, y: 50 },
        color: defaultColor
      };
      this.folderModalOpen = true;
    },

    openEditFolderModal(folder) {
      if (!folder) return;
      this.folderModalMode = 'edit';
      this.folderForm = {
        id: folder.id,
        name: folder.name || '',
        icon: folder.icon || 'folder',
        customLogo: folder.customLogo || null,
        logoTransform: folder.logoTransform ? JSON.parse(JSON.stringify(folder.logoTransform)) : { zoom: 100, x: 50, y: 50 },
        color: folder.color || '#00F0FF'
      };
      this.folderModalOpen = true;
    },

    closeFolderModal() {
      this.folderModalOpen = false;
    },

    async uploadFolderLogo(event) {
      const file = event?.target?.files?.[0];
      if (!file) return;
      if (!file.type.startsWith('image/')) {
        window.Alpine?.store('app')?.toast('Por favor selecciona un archivo de imagen o GIF válido.', 'warning');
        return;
      }
      const isGif = file.type === 'image/gif' || file.name.toLowerCase().endsWith('.gif');
      try {
        if (isGif) {
          const reader = new FileReader();
          reader.onload = (e) => {
            this.folderForm.customLogo = e.target.result;
            this.folderForm.logoTransform = { zoom: 100, x: 50, y: 50 };
            window.Alpine?.store('app')?.toast('Logo GIF animado cargado ✓', 'success');
          };
          reader.readAsDataURL(file);
        } else {
          try {
            const compressed = await compressImage(file, { maxWidth: 300, maxHeight: 300, quality: 0.9 });
            this.folderForm.customLogo = compressed;
            this.folderForm.logoTransform = { zoom: 100, x: 50, y: 50 };
            window.Alpine?.store('app')?.toast('Logo de carpeta cargado ✓', 'success');
          } catch {
            const reader = new FileReader();
            reader.onload = (e) => {
              this.folderForm.customLogo = e.target.result;
              this.folderForm.logoTransform = { zoom: 100, x: 50, y: 50 };
              window.Alpine?.store('app')?.toast('Logo de carpeta cargado ✓', 'success');
            };
            reader.readAsDataURL(file);
          }
        }
      } catch (err) {
        window.Alpine?.store('app')?.toast('Error al procesar la imagen.', 'error');
      }
      if (event.target) event.target.value = '';
    },

    removeFolderLogo() {
      this.folderForm.customLogo = null;
      this.folderForm.logoTransform = { zoom: 100, x: 50, y: 50 };
    },

    async saveFolderForm() {
      const name = String(this.folderForm.name || '').trim();
      if (!name) {
        window.Alpine?.store('app')?.toast('Por favor escribe un nombre para la carpeta.', 'warning');
        return;
      }

      if (this.folderModalMode === 'create') {
        const defaultColor = window.Alpine?.store('settings')?.accentColor || '#00F0FF';
        const newFolder = {
          id: crypto.randomUUID(),
          name,
          icon: this.folderForm.icon || 'folder',
          customLogo: this.folderForm.customLogo || null,
          logoTransform: this.folderForm.logoTransform ? JSON.parse(JSON.stringify(this.folderForm.logoTransform)) : { zoom: 100, x: 50, y: 50 },
          color: this.folderForm.color || defaultColor,
          createdAt: Date.now(),
          order: this.folders.length
        };
        this.folders.push(newFolder);
        await this.saveFolders();
        this.activeFolderId = newFolder.id;
        window.Alpine?.store('app')?.toast(`Carpeta «${name}» creada ✓`, 'success');
      } else {
        const folder = this.folders.find(f => f.id === this.folderForm.id);
        if (folder) {
          folder.name = name;
          folder.icon = this.folderForm.icon || 'folder';
          folder.customLogo = this.folderForm.customLogo || null;
          folder.logoTransform = this.folderForm.logoTransform ? JSON.parse(JSON.stringify(this.folderForm.logoTransform)) : { zoom: 100, x: 50, y: 50 };
          folder.color = this.folderForm.color || '#00F0FF';
          await this.saveFolders();
          window.Alpine?.store('app')?.toast(`Carpeta «${name}» actualizada ✓`, 'success');
        }
      }

      this.folderModalOpen = false;
      this.currentPage = 1;
    },

    async deleteFolder(folderId) {
      const folder = this.folders.find(f => f.id === folderId);
      const folderName = folder?.name || 'Carpeta';

      // Desvincular fichas de esta carpeta y persistir
      let count = 0;
      for (const char of this.list) {
        if (char.folderId === folderId) {
          char.folderId = null;
          char.updatedAt = Date.now();
          await this._persist(char);
          count++;
        }
      }

      this.folders = this.folders.filter(f => f.id !== folderId);
      await this.saveFolders();

      if (this.activeFolderId === folderId) {
        this.activeFolderId = 'all';
      }

      const msg = count > 0 
        ? `Carpeta «${folderName}» eliminada. ${count} ficha(s) devuelta(s) a Sin Carpeta.`
        : `Carpeta «${folderName}» eliminada.`;
      window.Alpine?.store('app')?.toast(msg, 'info');
    },

    setActiveFolder(folderId) {
      this.activeFolderId = folderId;
      this.currentPage = 1;
    },

    getFolderCharCount(folderId) {
      return (this.list || []).filter(c => c.folderId === folderId).length;
    },

    getFolderName(folderId) {
      if (!folderId) return 'Sin Carpeta';
      const f = (this.folders || []).find(fold => fold.id === folderId);
      return f ? f.name : 'Sin Carpeta';
    },

    // ── Drag y Drop Handlers ────────────────────────────────────
    startCharDrag(e, charId) {
      this.draggingCharId = charId;
      const isMulti = this.selectedIds && this.selectedIds.includes(charId) && this.selectedIds.length > 1;
      if (e?.dataTransfer) {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', charId);
        if (isMulti) {
          e.dataTransfer.setData('application/characters-multiselect', JSON.stringify(this.selectedIds));
        }
      }
    },

    endCharDrag() {
      this.draggingCharId = null;
      this.dragOverFolderId = null;
    },

    handleDragOverFolder(e, folderId) {
      if (e) {
        e.preventDefault();
        if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
      }
      this.dragOverFolderId = folderId;
    },

    handleDragLeaveFolder(e, folderId) {
      if (this.dragOverFolderId === folderId) {
        this.dragOverFolderId = null;
      }
    },

    async handleDropOnFolder(e, targetFolderId) {
      if (e) e.preventDefault();
      const charId = e?.dataTransfer?.getData('text/plain') || this.draggingCharId;
      const multiData = e?.dataTransfer?.getData('application/characters-multiselect');
      this.dragOverFolderId = null;
      this.draggingCharId = null;

      let idsToMove = [];
      if (multiData) {
        try {
          idsToMove = JSON.parse(multiData);
        } catch (_) {}
      }
      if (!idsToMove.length && charId) {
        if (this.selectedIds && this.selectedIds.includes(charId) && this.selectedIds.length > 1) {
          idsToMove = [...this.selectedIds];
        } else {
          idsToMove = [charId];
        }
      }

      if (!idsToMove.length) return;
      if (idsToMove.length === 1) {
        await this.moveCharacterToFolder(idsToMove[0], targetFolderId);
        if (this.selectedIds && this.selectedIds.includes(idsToMove[0])) {
          this.deselectCharacter(idsToMove[0]);
        }
      } else {
        await this.moveMultipleCharactersToFolder(idsToMove, targetFolderId);
      }
    },

    async moveCharacterToFolder(charId, targetFolderId) {
      const char = this.list.find(c => c.id === charId);
      if (!char) return;

      const normalizedTarget = (targetFolderId === 'all' || targetFolderId === 'unassigned') ? null : targetFolderId;
      if (char.folderId === normalizedTarget) return;

      char.folderId = normalizedTarget;
      char.updatedAt = Date.now();
      await this._persist(char);

      let destName = 'Sin Carpeta';
      if (normalizedTarget) {
        const f = this.folders.find(fold => fold.id === normalizedTarget);
        if (f) destName = f.name;
      }
      window.Alpine?.store('app')?.toast(`"${char.name || 'Personaje'}" movido a «${destName}» ✓`, 'success');
    },

    async moveMultipleCharactersToFolder(charIds, targetFolderId) {
      if (!Array.isArray(charIds) || charIds.length === 0) return;
      const normalizedTarget = (targetFolderId === 'all' || targetFolderId === 'unassigned') ? null : targetFolderId;
      let destName = 'Sin Carpeta';
      if (normalizedTarget) {
        const f = (this.folders || []).find(fold => fold.id === normalizedTarget);
        if (f) destName = f.name;
      }

      let movedCount = 0;
      for (const id of charIds) {
        const char = (this.list || []).find(c => c.id === id);
        if (char && char.folderId !== normalizedTarget) {
          char.folderId = normalizedTarget;
          char.updatedAt = Date.now();
          await this._persist(char);
          movedCount++;
        }
      }

      this.clearSelection();

      if (movedCount > 0) {
        window.Alpine?.store('app')?.toast(`${movedCount} ${movedCount === 1 ? 'ficha movida' : 'fichas movidas'} a «${destName}» ✓`, 'success');
      }
    },

    async moveSelectedToFolder(targetFolderId) {
      if (!this.selectedCount) return;
      await this.moveMultipleCharactersToFolder(this.selectedIds, targetFolderId);
    }
  };
}
