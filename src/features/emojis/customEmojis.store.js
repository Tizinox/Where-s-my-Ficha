/**
 * store/customEmojis.js
 * Alpine.store('customEmojis') — Gestor de Emoticonos y Emojis Personalizados.
 * 
 * Permite registrar, editar, eliminar, exportar/importar y usar emojis propios
 * con sintaxis estilo Discord/Twitch/Slack (:shortcode:).
 * Soporta imágenes locales (WebP, PNG, SVG) y GIFs animados preservados.
 */

import { ls } from '@core/db/storage.ts';
import { db } from '@core/db/dexie.ts';
import { escapeHtml, sanitizeImageUrl } from '@core/security/sanitize.ts';

const STORAGE_KEY = 'superficha_custom_emojis';
export const MAX_CUSTOM_EMOJIS = 150;
export const MAX_EMOJI_FILE_SIZE = 2 * 1024 * 1024; // 2 MB límite de seguridad

/**
 * Procesa un archivo de imagen para convertirlo en un formato optimizado.
 * Preserva GIFs animados y SVGs sin comprimir a través de FileReader,
 * y redimensiona imágenes estáticas a max 128x128 WebP para carga ultrarrápida.
 */
export async function processEmojiImage(file) {
  if (!file) throw new Error('No se proporcionó ningún archivo');

  // Si es GIF animado, SVG vectorial o APNG, leer como dataURL directamente para mantener la animación en bucle y vectores intactos
  const isGif = file.type === 'image/gif' || file.name?.toLowerCase().endsWith('.gif');
  const isSvg = file.type === 'image/svg+xml' || file.name?.toLowerCase().endsWith('.svg');
  const isApng = file.type === 'image/apng' || file.name?.toLowerCase().endsWith('.apng');

  if (isGif || isSvg || isApng) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  }

  // Para PNG, JPEG, WebP, redimensionar a max 128x128 píxeles
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      const MAX_SIZE = 128;
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
      canvas.width = Math.max(1, width);
      canvas.height = Math.max(1, height);
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const dataUrl = canvas.toDataURL('image/webp', 0.92);
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

export function registerCustomEmojisStore(Alpine) {
  Alpine.store('customEmojis', {
    // Lista principal de emojis: [{ id, shortcode, name, url, category, createdAt }]
    list: [],

    // Búsqueda y filtros en la pestaña de Ajustes
    query: '',
    selectedCategory: 'all',

    // Formulario de creación / edición
    formShortcode: '',
    formName: '',
    formCategory: 'General',
    formUrl: '',
    formPreview: '',
    formFileName: '',
    isProcessingFile: false,
    editingEmojiId: null,

    // Favoritos y Recientes
    favoriteIds: [],
    recentIds: [],

    // Subida múltiple / Lote
    isBatchProcessing: false,
    batchProgress: { current: 0, total: 0 },
    batchTargetCategory: 'General',

    // Modo Gestión / Selección en Masa
    isBatchSelectMode: false,
    selectedEmojiIds: [],

    // Estado del selector / picker flotante
    isPickerOpen: false,
    pickerQuery: '',
    pickerCategory: 'all',
    lastActiveInput: null,

    // Mapa en memoria para resolución instantánea O(1) de :shortcode:
    _lookupMap: new Map(),

    init() {
      this.loadEmojis();
      this.loadEmojisFromIndexedDB();
      this.loadFavoritesAndRecents();

      // Rastrear el último input o textarea enfocado para inserción directa
      document.addEventListener('focusin', (e) => {
        const el = e.target;
        if (
          el &&
          (el.tagName === 'TEXTAREA' ||
            (el.tagName === 'INPUT' && ['text', 'search'].includes(el.type)) ||
            el.classList?.contains('rich-text-editor'))
        ) {
          if (!el.closest('#emoji-picker-modal')) {
            this.lastActiveInput = el;
          }
        }
      });
    },

    /**
     * Carga los emojis guardados de localStorage inicialmente (0ms síncrono)
     */
    loadEmojis() {
      try {
        const saved = ls.getJSON(STORAGE_KEY, []);
        this.list = Array.isArray(saved) ? saved : [];
        this._rebuildLookup();
      } catch (e) {
        console.warn('[customEmojis] Error cargando emojis:', e);
        this.list = [];
        this._rebuildLookup();
      }
    },

    /**
     * Carga asíncrona desde IndexedDB (Dexie) para soporte de colecciones grandes sin límite de 5MB
     */
    async loadEmojisFromIndexedDB() {
      try {
        if (!db || !db.meta) return;
        const entry = await db.meta.get('custom_emojis');
        if (entry && Array.isArray(entry.data)) {
          // IndexedDB es la fuente de verdad autoritativa (evita resurrección desde localStorage)
          this.list = entry.data;
          this._rebuildLookup();
          if (entry.data.length === 0) {
            ls.remove(STORAGE_KEY);
          } else {
            ls.setJSON(STORAGE_KEY, this.list);
          }
        }
      } catch (e) {
        console.warn('[customEmojis] Error leyendo de IndexedDB:', e);
      }
    },

    loadFavoritesAndRecents() {
      try {
        this.favoriteIds = ls.getJSON('superficha_custom_emojis_favorites', []);
        this.recentIds = ls.getJSON('superficha_custom_emojis_recents', []);
      } catch (e) {
        this.favoriteIds = [];
        this.recentIds = [];
      }
    },

    toggleFavorite(emojiId) {
      if (!emojiId) return;
      if (this.favoriteIds.includes(emojiId)) {
        this.favoriteIds = this.favoriteIds.filter(id => id !== emojiId);
        Alpine.store('app')?.toast('Eliminado de favoritos', 'info');
      } else {
        this.favoriteIds.push(emojiId);
        Alpine.store('app')?.toast('Añadido a favoritos ⭐', 'success');
      }
      ls.setJSON('superficha_custom_emojis_favorites', this.favoriteIds);
    },

    isFavorite(emojiId) {
      return this.favoriteIds.includes(emojiId);
    },

    recordRecent(emojiId) {
      if (!emojiId) return;
      this.recentIds = [emojiId, ...this.recentIds.filter(id => id !== emojiId)].slice(0, 16);
      ls.setJSON('superficha_custom_emojis_recents', this.recentIds);
    },

    /**
     * Guarda la lista actual en IndexedDB (almacenamiento seguro en disco) y localStorage
     */
    saveEmojis() {
      this._rebuildLookup();

      // 1. Guardar en IndexedDB (sin límite de 5MB, soporte para GIFs grandes)
      try {
        if (db && db.meta) {
          db.meta.put({
            key: 'custom_emojis',
            data: JSON.parse(JSON.stringify(this.list)),
            updatedAt: Date.now()
          }).catch(err => {
            console.warn('[customEmojis] Error guardando en Dexie:', err);
          });
        }
      } catch (e) {
        console.warn('[customEmojis] Error en guardado IndexedDB:', e);
      }

      // 2. Guardar en localStorage con salvaguarda de cuota (QuotaExceededError)
      try {
        ls.setJSON(STORAGE_KEY, this.list);
      } catch (e) {
        console.warn('[customEmojis] Cuota de localStorage superada; datos protegidos en IndexedDB:', e);
      }
    },

    /**
     * Reconstruye el Map en memoria para búsquedas instantáneas
     */
    _rebuildLookup() {
      const map = new Map();
      for (const emoji of this.list) {
        if (emoji && emoji.shortcode && emoji.url) {
          map.set(emoji.shortcode.toLowerCase(), emoji);
        }
      }
      this._lookupMap = map;
    },

    /**
     * Obtiene un emoji por su shortcode sin los dos puntos
     * @param {string} code 
     * @returns {Object|null}
     */
    getEmojiByShortcode(code) {
      if (!code) return null;
      return this._lookupMap.get(String(code).toLowerCase().trim()) || null;
    },

    /**
     * Sanitiza una cadena para convertirla en un shortcode válido:
     * minúsculas, guiones bajos en vez de espacios, solo [a-z0-9_-]
     */
    sanitizeShortcode(val) {
      if (!val) return '';
      return String(val)
        .trim()
        .toLowerCase()
        .replace(/[\s.]+/g, '_')
        .replace(/[^a-z0-9_-]/g, '')
        .slice(0, 32);
    },

    // ── Getters Reactivos ──────────────────────────────────────

    get favoriteEmojis() {
      return this.list.filter(e => this.favoriteIds.includes(e.id));
    },

    get recentEmojis() {
      return this.recentIds
        .map(id => this.list.find(e => e.id === id))
        .filter(Boolean);
    },

    get categories() {
      const set = new Set();
      for (const e of this.list) {
        if (e.category && e.category.trim()) {
          set.add(e.category.trim());
        }
      }
      return Array.from(set).sort();
    },

    get filteredList() {
      const q = (this.query || '').trim().toLowerCase();
      const cat = this.selectedCategory;

      let source = this.list;
      if (cat === 'favorites') {
        source = this.favoriteEmojis;
      } else if (cat !== 'all') {
        source = this.list.filter(e => e.category === cat);
      }

      if (!q) return source;
      return source.filter(e =>
        e.shortcode.toLowerCase().includes(q) ||
        (e.name && e.name.toLowerCase().includes(q)) ||
        (e.category && e.category.toLowerCase().includes(q))
      );
    },

    get filteredPickerList() {
      const q = (this.pickerQuery || '').trim().toLowerCase();
      const cat = this.pickerCategory;

      let source = this.list;
      if (cat === 'favorites') {
        source = this.favoriteEmojis;
      } else if (cat === 'recents') {
        source = this.recentEmojis;
      } else if (cat !== 'all') {
        source = this.list.filter(e => e.category === cat);
      }

      if (!q) return source;
      return source.filter(e =>
        e.shortcode.toLowerCase().includes(q) ||
        (e.name && e.name.toLowerCase().includes(q))
      );
    },

    get totalCount() {
      return this.list.length;
    },

    get maxCapacity() {
      return MAX_CUSTOM_EMOJIS;
    },

    get capacityPercentage() {
      return Math.min(100, Math.round((this.list.length / MAX_CUSTOM_EMOJIS) * 100));
    },

    get estimatedStorageBytes() {
      let total = 0;
      for (const e of this.list) {
        if (e && e.url) total += e.url.length;
      }
      return total;
    },

    get estimatedMemoryFormatted() {
      const bytes = this.estimatedStorageBytes;
      if (bytes < 1024) return `${bytes} B`;
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
      return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    },

    get memoryHealth() {
      const pct = this.capacityPercentage;
      if (pct < 60) return { status: 'optimal', label: 'ÓPTIMO', color: '#10b981' };
      if (pct < 90) return { status: 'moderate', label: 'MODERADO', color: '#f59e0b' };
      return { status: 'warning', label: 'LÍMITE ALCANZADO', color: '#ef4444' };
    },

    get canAddMore() {
      return this.list.length < MAX_CUSTOM_EMOJIS;
    },

    // ── Gestión del Formulario ──────────────────────────────────

    async handleFileUpload(event) {
      const file = event?.target?.files?.[0];
      if (!file) return;

      // Validación de tamaño máximo de archivo para proteger memoria RAM
      if (file.size > MAX_EMOJI_FILE_SIZE) {
        const mb = (file.size / (1024 * 1024)).toFixed(1);
        Alpine.store('app')?.toast(`El archivo pesa ${mb} MB (límite: 2 MB). Usa un archivo optimizado o una URL directa para no sobrecargar la memoria.`, 'warning');
        if (event.target) event.target.value = '';
        return;
      }

      // Validación de capacidad máxima de emojis
      if (this.list.length >= MAX_CUSTOM_EMOJIS && !this.editingEmojiId) {
        Alpine.store('app')?.toast(`Has alcanzado el límite recomendado (${MAX_CUSTOM_EMOJIS} emojis). Elimina alguno antes de añadir más.`, 'warning');
        if (event.target) event.target.value = '';
        return;
      }

      this.isProcessingFile = true;
      try {
        const dataUrl = await processEmojiImage(file);
        this.formPreview = dataUrl;
        this.formUrl = dataUrl;
        this.formFileName = file.name;

        // Si el shortcode está vacío, derivarlo del nombre del archivo
        if (!this.formShortcode) {
          const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
          this.formShortcode = this.sanitizeShortcode(baseName);
        }
        if (!this.formName) {
          const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
          this.formName = baseName.replace(/[-_]+/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        }
      } catch (err) {
        console.error('[customEmojis] Error al procesar archivo:', err);
        Alpine.store('app')?.toast('Error al procesar la imagen.', 'error');
      } finally {
        this.isProcessingFile = false;
        if (event.target) event.target.value = '';
      }
    },

    handleUrlInput() {
      const url = (this.formUrl || '').trim();
      if (!url) {
        this.formPreview = '';
        return;
      }
      this.formPreview = url;

      // Autoderivar código y nombre a partir de la URL si están vacíos
      if (!this.formShortcode) {
        try {
          const pathname = new URL(url).pathname;
          const filename = pathname.split('/').filter(Boolean).pop() || '';
          const cleanName = filename.split('.')[0];
          if (cleanName && cleanName.length >= 2 && !/^\d+$/.test(cleanName)) {
            this.formShortcode = this.sanitizeShortcode(cleanName);
            if (!this.formName) {
              this.formName = cleanName.replace(/[-_]+/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            }
          }
        } catch {
          const match = url.match(/\/([^/?#]+?)(?:\.[a-zA-Z0-9]+)?(?:\?|#|$)/);
          if (match && match[1] && !/^\d+$/.test(match[1])) {
            this.formShortcode = this.sanitizeShortcode(match[1]);
          }
        }
      }
    },

    handlePreviewError() {
      if (this.formPreview) {
        Alpine.store('app')?.toast('No se pudo cargar la imagen desde ese enlace. Asegúrate de que sea un enlace directo a la imagen o GIF.', 'warning');
      }
    },

    isGif(emojiOrUrl) {
      const u = typeof emojiOrUrl === 'string' ? emojiOrUrl : emojiOrUrl?.url;
      if (!u) return false;
      const str = String(u).toLowerCase();
      return str.includes('.gif') || str.startsWith('data:image/gif');
    },

    resetForm() {
      this.formShortcode = '';
      this.formName = '';
      this.formCategory = 'General';
      this.formUrl = '';
      this.formPreview = '';
      this.formFileName = '';
      this.isProcessingFile = false;
      this.editingEmojiId = null;
    },

    editEmoji(emoji) {
      if (!emoji) return;
      this.editingEmojiId = emoji.id;
      this.formShortcode = emoji.shortcode || '';
      this.formName = emoji.name || '';
      this.formCategory = emoji.category || 'General';
      this.formUrl = emoji.url || '';
      this.formPreview = emoji.url || '';
      this.formFileName = '';

      // Scroll suave hacia el formulario en pantallas móviles
      const formEl = document.getElementById('emoji-editor-form-card');
      if (formEl) {
        formEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    },

    saveCurrentEmoji() {
      const code = this.sanitizeShortcode(this.formShortcode);
      const url = (this.formUrl || this.formPreview || '').trim();
      const name = (this.formName || '').trim() || code;
      const category = (this.formCategory || '').trim() || 'General';

      if (!code) {
        Alpine.store('app')?.toast('Indica un código o nombre válido para el emoji.', 'warning');
        return;
      }
      if (!url) {
        Alpine.store('app')?.toast('Sube una imagen o introduce una URL para el emoji.', 'warning');
        return;
      }

      // Comprobar conflicto de shortcode (si no estamos editando el mismo emoji)
      const existing = this.list.find(e => e.shortcode.toLowerCase() === code.toLowerCase() && e.id !== this.editingEmojiId);
      if (existing) {
        Alpine.store('app')?.toast(`El código :${code}: ya está en uso. Elige otro.`, 'warning');
        return;
      }

      // Comprobar límite de seguridad si es un emoji nuevo
      if (!this.editingEmojiId && this.list.length >= MAX_CUSTOM_EMOJIS) {
        Alpine.store('app')?.toast(`Límite recomendado alcanzado (${MAX_CUSTOM_EMOJIS} emojis). Elimina alguno antes de añadir más.`, 'warning');
        return;
      }

      if (this.editingEmojiId) {
        // Actualizar existente
        const idx = this.list.findIndex(e => e.id === this.editingEmojiId);
        if (idx !== -1) {
          this.list[idx] = {
            ...this.list[idx],
            shortcode: code,
            name,
            url,
            category,
            updatedAt: Date.now()
          };
          this.saveEmojis();
          Alpine.store('app')?.toast(`Emoticono :${code}: actualizado.`, 'success');
        }
      } else {
        // Crear nuevo
        const newEmoji = {
          id: crypto.randomUUID(),
          shortcode: code,
          name,
          url,
          category,
          createdAt: Date.now()
        };
        this.list.unshift(newEmoji);
        this.saveEmojis();
        Alpine.store('app')?.toast(`¡Emoticono :${code}: guardado con éxito!`, 'success');
      }

      this.resetForm();

      // Si hay elementos enriquecidos en pantalla, re-renderizar para que reconozcan el nuevo emoji
      window.globalTextFormatter?.formatPreviewElements?.();
    },

    deleteEmoji(id) {
      const emoji = this.list.find(e => e.id === id);
      if (!emoji) return;

      this.list = this.list.filter(e => e.id !== id);
      if (this.editingEmojiId === id) {
        this.resetForm();
      }
      this.saveEmojis();
      Alpine.store('app')?.toast(`Emoticono :${emoji.shortcode}: eliminado.`, 'info');

      // Actualizar previsualizaciones
      window.globalTextFormatter?.formatPreviewElements?.();
    },

    copyShortcode(emoji) {
      if (!emoji || !emoji.shortcode) return;
      const text = `:${emoji.shortcode}:`;
      try {
        navigator.clipboard.writeText(text);
        Alpine.store('app')?.toast(`Copiado: ${text}`, 'success');
      } catch {
        Alpine.store('app')?.toast(`Código: ${text}`, 'info');
      }
    },

    // ── Exportación e Importación de Packs JSON ──────────────────

    exportJson() {
      if (this.list.length === 0) {
        Alpine.store('app')?.toast('No hay emojis personalizados para exportar.', 'warning');
        return;
      }

      const pack = {
        name: 'Where Is My Ficha - Custom Emojis Pack',
        version: '1.0',
        exportedAt: new Date().toISOString(),
        emojis: this.list.map(e => ({
          shortcode: e.shortcode,
          name: e.name,
          url: e.url,
          category: e.category || 'General'
        }))
      };

      try {
        const jsonStr = JSON.stringify(pack, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `custom-emojis-pack-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        Alpine.store('app')?.toast(`Pack exportado (${this.list.length} emojis).`, 'success');
      } catch (e) {
        console.error('[customEmojis] Error exportando pack JSON:', e);
        Alpine.store('app')?.toast('Error al exportar pack de emojis.', 'error');
      }
    },

    async importJsonFile(event) {
      const file = event?.target?.files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const data = JSON.parse(text);

        const rawList = Array.isArray(data) ? data : (data.emojis || []);
        if (!Array.isArray(rawList) || rawList.length === 0) {
          Alpine.store('app')?.toast('El archivo no contiene un pack válido de emojis.', 'warning');
          return;
        }

        let importedCount = 0;
        let updatedCount = 0;

        for (const item of rawList) {
          if (!item || !item.shortcode || !item.url) continue;
          const safeUrl = sanitizeImageUrl(item.url);
          const code = this.sanitizeShortcode(item.shortcode);
          if (!code || !safeUrl) continue;

          const existingIdx = this.list.findIndex(e => e.shortcode.toLowerCase() === code.toLowerCase());
          if (existingIdx !== -1) {
            // Actualizar existente
            this.list[existingIdx] = {
              ...this.list[existingIdx],
              name: String(item.name || this.list[existingIdx].name),
              url: safeUrl,
              category: String(item.category || this.list[existingIdx].category || 'General'),
              updatedAt: Date.now()
            };
            updatedCount++;
          } else {
            // Comprobar límite de seguridad
            if (this.list.length >= MAX_CUSTOM_EMOJIS) {
              Alpine.store('app')?.toast(`Límite alcanzado (${MAX_CUSTOM_EMOJIS} emojis). Se detuvo la importación de nuevos elementos.`, 'warning');
              break;
            }

            // Crear nuevo
            this.list.push({
              id: crypto.randomUUID(),
              shortcode: code,
              name: String(item.name || code),
              url: safeUrl,
              category: String(item.category || 'General'),
              createdAt: Date.now()
            });
            importedCount++;
          }
        }

        this.saveEmojis();
        Alpine.store('app')?.toast(`¡Pack importado! +${importedCount} nuevos, ${updatedCount} actualizados.`, 'success');
        window.globalTextFormatter?.formatPreviewElements?.();
      } catch (err) {
        console.error('[customEmojis] Error importando pack JSON:', err);
        Alpine.store('app')?.toast('Error al leer el archivo JSON.', 'error');
      } finally {
        if (event.target) event.target.value = '';
      }
    },

    // ── Picker Modal / Selector Rápido ──────────────────────────

    openPicker(targetInput = null) {
      if (targetInput) {
        this.lastActiveInput = targetInput;
      }
      this.pickerQuery = '';
      this.pickerCategory = 'all';
      this.isPickerOpen = true;

      setTimeout(() => {
        const input = document.getElementById('emoji-picker-search-input');
        if (input) input.focus();
      }, 80);
    },

    closePicker() {
      this.isPickerOpen = false;
    },

    selectEmoji(emoji) {
      if (!emoji || !emoji.shortcode) return;
      this.recordRecent(emoji.id);
      const textToInsert = `:${emoji.shortcode}:`;

      const input = this.lastActiveInput;

      if (input && document.body.contains(input)) {
        // Si es un editor enriquecido contenteditable (rich-text-editor)
        if (input.classList?.contains('rich-text-editor')) {
          input.focus();
          const safeUrl = sanitizeImageUrl(emoji.url);
          const safeCode = escapeHtml(emoji.shortcode);
          if (safeUrl) {
            // Insertar imagen o shortcode en el editor de forma segura
            const imgHtml = `<img class="custom-inline-emoji" src="${escapeHtml(safeUrl)}" alt=":${safeCode}:" title=":${safeCode}:" data-shortcode="${safeCode}" loading="lazy" />&nbsp;`;
            try {
              document.execCommand('insertHTML', false, imgHtml);
            } catch {
              const imgEl = document.createElement('img');
              imgEl.className = 'custom-inline-emoji';
              imgEl.src = safeUrl;
              imgEl.alt = `:${emoji.shortcode}:`;
              imgEl.title = `:${emoji.shortcode}:`;
              imgEl.dataset.shortcode = emoji.shortcode;
              imgEl.loading = 'lazy';
              input.appendChild(imgEl);
              input.appendChild(document.createTextNode('\u00A0'));
            }
          }
          if (typeof input._flushSync === 'function') {
            input._flushSync();
          }
          Alpine.store('app')?.toast(`Insertado :${emoji.shortcode}:`, 'success');
          this.closePicker();
          return;
        }

        // Si es un textarea o input tradicional
        if (typeof input.selectionStart === 'number' && typeof input.selectionEnd === 'number') {
          const start = input.selectionStart;
          const end = input.selectionEnd;
          const val = input.value || '';
          input.value = val.substring(0, start) + textToInsert + ' ' + val.substring(end);
          input.selectionStart = input.selectionEnd = start + textToInsert.length + 1;
          input.focus();
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
          Alpine.store('app')?.toast(`Insertado :${emoji.shortcode}:`, 'success');
          this.closePicker();
          return;
        }
      }

      // Si no hay input activo o no se puede enfocar, copiar al portapapeles
      this.copyShortcode(emoji);
      this.closePicker();
    },

    // ── Encuadre y Recorte Visual 1:1 (Cropper) ────────────────
    async openCropperForCurrentEmoji() {
      const src = (this.formPreview || this.formUrl || '').trim();
      if (!src) {
        Alpine.store('app')?.toast('Primero debes subir una imagen o pegar una URL.', 'info');
        return;
      }
      if (src.startsWith('http://') || src.startsWith('https://')) {
        await window.Alpine?.store('app')?.openMediaUrl(src, 'custom_emoji');
        return;
      }
      window.Alpine?.store('app')?.openCropper(src, 'custom_emoji');
    },

    async processCroppedEmoji(file) {
      try {
        const dataUrl = await processEmojiImage(file);
        this.formPreview = dataUrl;
        this.formUrl = dataUrl;
        Alpine.store('app')?.toast('Emoticono encuadrado y recortado 1:1 ✓', 'success');
      } catch (err) {
        console.error('[customEmojis] Error en recorte:', err);
        Alpine.store('app')?.toast('Error al encuadrar el emoticono.', 'error');
      }
    },

    async processCroppedEmojiGif(dataUrl, cssTransform) {
      this.formPreview = dataUrl;
      this.formUrl = dataUrl;
      Alpine.store('app')?.toast('GIF animado encuadrado 1:1 ✓', 'success');
    },

    // ── Subida Múltiple / Lote (Batch Drag & Drop) ──────────────
    async handleBatchUpload(eventOrFiles, targetCategory = 'General') {
      let files = [];
      if (eventOrFiles?.target?.files) {
        files = Array.from(eventOrFiles.target.files);
      } else if (Array.isArray(eventOrFiles)) {
        files = eventOrFiles;
      } else if (eventOrFiles instanceof FileList) {
        files = Array.from(eventOrFiles);
      }

      if (!files || files.length === 0) return;

      const imageFiles = files.filter(f => f.type.startsWith('image/') || /\.(png|jpe?g|gif|webp|svg|apng)$/i.test(f.name));
      if (imageFiles.length === 0) {
        Alpine.store('app')?.toast('No se encontraron archivos de imagen válidos.', 'warning');
        if (eventOrFiles?.target) eventOrFiles.target.value = '';
        return;
      }

      const remainingCapacity = Math.max(0, MAX_CUSTOM_EMOJIS - this.list.length);
      if (remainingCapacity <= 0) {
        Alpine.store('app')?.toast(`Capacidad máxima alcanzada (${MAX_CUSTOM_EMOJIS} emojis). Elimina alguno para importar más.`, 'warning');
        if (eventOrFiles?.target) eventOrFiles.target.value = '';
        return;
      }

      const filesToProcess = imageFiles.slice(0, remainingCapacity);
      if (imageFiles.length > remainingCapacity) {
        Alpine.store('app')?.toast(`Se procesarán ${remainingCapacity} de ${imageFiles.length} imágenes por límite de capacidad.`, 'info');
      }

      this.isBatchProcessing = true;
      this.batchProgress = { current: 0, total: filesToProcess.length };

      let successCount = 0;
      const cat = (targetCategory || this.batchTargetCategory || 'General').trim() || 'General';

      try {
        for (let i = 0; i < filesToProcess.length; i++) {
          const file = filesToProcess[i];
          this.batchProgress.current = i + 1;

          if (file.size > MAX_EMOJI_FILE_SIZE) {
            console.warn(`[customEmojis] Saltando ${file.name} por superar 2MB`);
            continue;
          }

          try {
            const dataUrl = await processEmojiImage(file);
            const rawBase = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
            const baseCode = this.sanitizeShortcode(rawBase) || 'emoji';
            let code = baseCode;
            let counter = 2;
            while (this.list.some(e => e.shortcode.toLowerCase() === code.toLowerCase())) {
              code = `${baseCode}_${counter++}`;
            }

            const cleanName = rawBase.replace(/[-_]+/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

            this.list.unshift({
              id: crypto.randomUUID(),
              shortcode: code,
              name: cleanName,
              url: dataUrl,
              category: cat,
              createdAt: Date.now()
            });
            successCount++;
          } catch (fileErr) {
            console.warn(`[customEmojis] Error en archivo ${file.name}:`, fileErr);
          }
        }

        this.saveEmojis();
        Alpine.store('app')?.toast(`¡Lote completado! +${successCount} nuevos emojis en "${cat}" ✓`, 'success');
        window.globalTextFormatter?.formatPreviewElements?.();
      } catch (err) {
        console.error('[customEmojis] Error en subida por lote:', err);
        Alpine.store('app')?.toast('Ocurrió un error al procesar el lote.', 'error');
      } finally {
        this.isBatchProcessing = false;
        this.batchProgress = { current: 0, total: 0 };
        if (eventOrFiles?.target) eventOrFiles.target.value = '';
      }
    },

    // ── Gestión en Masa (Selección Múltiple y Acciones) ─────────
    toggleBatchMode() {
      this.isBatchSelectMode = !this.isBatchSelectMode;
      if (!this.isBatchSelectMode) {
        this.selectedEmojiIds = [];
      }
    },

    toggleSelectEmoji(id) {
      if (!id) return;
      if (this.selectedEmojiIds.includes(id)) {
        this.selectedEmojiIds = this.selectedEmojiIds.filter(x => x !== id);
      } else {
        this.selectedEmojiIds.push(id);
      }
    },

    isEmojiSelected(id) {
      return this.selectedEmojiIds.includes(id);
    },

    selectAllFiltered() {
      const ids = this.filteredList.map(e => e.id);
      this.selectedEmojiIds = Array.from(new Set([...this.selectedEmojiIds, ...ids]));
    },

    clearSelection() {
      this.selectedEmojiIds = [];
    },

    deleteSelectedEmojis() {
      const count = this.selectedEmojiIds.length;
      if (count === 0) return;

      const idsToDelete = new Set(this.selectedEmojiIds);
      this.list = this.list.filter(e => !idsToDelete.has(e.id));
      this.favoriteIds = this.favoriteIds.filter(id => !idsToDelete.has(id));
      this.recentIds = this.recentIds.filter(id => !idsToDelete.has(id));

      if (idsToDelete.has(this.editingEmojiId)) {
        this.resetForm();
      }

      this.saveEmojis();
      ls.setJSON('superficha_custom_emojis_favorites', this.favoriteIds);
      ls.setJSON('superficha_custom_emojis_recents', this.recentIds);

      this.selectedEmojiIds = [];
      this.isBatchSelectMode = false;
      Alpine.store('app')?.toast(`Se eliminaron ${count} emoticonos ✓`, 'info');
      window.globalTextFormatter?.formatPreviewElements?.();
    },

    moveSelectedToCategory(newCat) {
      const cat = (newCat || '').trim();
      if (!cat) {
        Alpine.store('app')?.toast('Escribe o selecciona una categoría de destino.', 'warning');
        return;
      }
      const count = this.selectedEmojiIds.length;
      if (count === 0) return;

      const idsToMove = new Set(this.selectedEmojiIds);
      for (const e of this.list) {
        if (idsToMove.has(e.id)) {
          e.category = cat;
          e.updatedAt = Date.now();
        }
      }

      this.saveEmojis();
      this.selectedEmojiIds = [];
      Alpine.store('app')?.toast(`Se movieron ${count} emoticonos a "${cat}" ✓`, 'success');
    }
  });
}

export default registerCustomEmojisStore;
