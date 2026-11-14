/**
 * app/export.js
 * Submódulo de exportación y formateador para Discord.
 */

import { 
  DISCORD_SEPARATORS, 
  DISCORD_SECTIONS, 
  charToDiscordText, 
  splitIntoDiscordBlocks, 
  parseDiscordMarkdownToHtml,
  exportCharacterJSON,
} from '@features/export/exportEngine.js';
import {
  exportCharacterImageBlob,
  downloadCharacterImage,
  copyCharacterImageToClipboard,
} from '@features/export/imageExporter.ts';
import {
  renderClassicPdfPages,
  downloadClassicCharacterPdf,
} from '@features/export/pdfExporter.ts';
import { formatRichText } from '@core/rich-text/textFormatterEngine.js';
import { ls } from '@core/db/storage.ts';

export function createExportMethods() {
  return {
    // ── Modal unificado de Exportación (PDF + Imagen PNG + Discord + JSON) ──
    showDiscordModal: false,
    exportModalTab: 'image', // 'pdf' | 'image' | 'discord' | 'json'
    exportTargetCharId: null,
    exportImagePreset: 'complete', // 'complete' | 'compact'
    exportImageTheme: 'dark', // 'dark' | 'light'
    exportImagePreviewUrl: '',
    exportImageLoading: false,
    exportImageError: '',
    exportImageMeta: { width: 0, height: 0, sizeKb: 0 },
    _exportPreviewSeq: 0,

    // ── Estado de Exportación PDF Editorial (Ficha B / Dosier) ──
    exportPdfTheme: 'light', // 'light' | 'dark'
    exportPdfIncludeImages: true,
    exportPdfPreviews: [],
    exportPdfPageCount: 0,
    exportPdfLoading: false,
    exportPdfError: '',
    _exportPdfSeq: 0,

    discordPreviewTab: 'wysiwyg', // 'wysiwyg' | 'raw'
    discordSeparators: DISCORD_SEPARATORS,
    discordSections: DISCORD_SECTIONS,
    discordExportOptions: {
      formatMode: 'standard', // 'standard' | 'compact'
      separator: DISCORD_SEPARATORS[0].value,
      selectedSections: DISCORD_SECTIONS.map(s => s.id),
      showSectionMenu: false,
    },
    discordFullText: '',
    discordBlocks: [], // array de strings, uno por bloque ≤ 1950 chars
    discordHtmlPreview: '',

    get exportTargetChar() {
      return this.resolveExportTargetChar();
    },

    resolveExportTargetChar() {
      const charStore = window.Alpine?.store('characters');
      if (!charStore) return null;
      if (this.exportTargetCharId) {
        if (charStore.active?.id === this.exportTargetCharId) {
          return charStore.active;
        }
        const match = Array.isArray(charStore.list)
          ? charStore.list.find(c => c.id === this.exportTargetCharId)
          : null;
        if (match) return match;
      }
      return charStore.active || null;
    },

    openExportModal(charId = null, initialTab = null) {
      const charStore = window.Alpine?.store('characters');
      const targetId = charId || charStore?.active?.id || null;
      if (!targetId && !charStore?.active) {
        this.toast?.('No hay ningún personaje seleccionado para exportar.', 'warning');
        return;
      }

      this.exportTargetCharId = targetId;
      const targetChar = this.resolveExportTargetChar();
      const autoTab = targetChar?.sheetType === 'classic' ? 'pdf' : 'image';
      this.exportModalTab = ['pdf', 'image', 'discord', 'json'].includes(initialTab) ? initialTab : autoTab;

      this.exportImageError = '';
      this.exportPdfError = '';
      this.revokeExportImagePreview();
      this.exportPdfPreviews = [];
      this.exportPdfPageCount = 0;

      const savedImgPrefs = ls?.getJSON?.('superficha_image_export_prefs');
      if (savedImgPrefs && typeof savedImgPrefs === 'object') {
        if (savedImgPrefs.preset === 'complete' || savedImgPrefs.preset === 'compact') {
          this.exportImagePreset = savedImgPrefs.preset;
        }
        if (savedImgPrefs.theme === 'dark' || savedImgPrefs.theme === 'light') {
          this.exportImageTheme = savedImgPrefs.theme;
        }
      } else if (typeof document !== 'undefined' && document.documentElement?.getAttribute('data-theme') === 'light') {
        this.exportImageTheme = 'light';
      }

      const savedPdfPrefs = ls?.getJSON?.('superficha_pdf_export_prefs');
      if (savedPdfPrefs && typeof savedPdfPrefs === 'object') {
        if (savedPdfPrefs.theme === 'light' || savedPdfPrefs.theme === 'dark') {
          this.exportPdfTheme = savedPdfPrefs.theme;
        }
        if (typeof savedPdfPrefs.includeImages === 'boolean') {
          this.exportPdfIncludeImages = savedPdfPrefs.includeImages;
        }
      }

      this.loadSavedDiscordPreferences();
      this.recalculateDiscordExport();
      this.showDiscordModal = true;

      if (this.exportModalTab === 'pdf') {
        void this.refreshExportPdfPreview();
      } else if (this.exportModalTab === 'image') {
        void this.refreshExportImagePreview();
      }
    },

    openDiscordModal(_blocks = null) {
      this.openExportModal(null, 'discord');
    },

    closeDiscordModal() {
      this.showDiscordModal = false;
      this.discordExportOptions.showSectionMenu = false;
      this._exportPreviewSeq++;
      this._exportPdfSeq++;
      this.exportImageLoading = false;
      this.exportPdfLoading = false;
      this.exportPdfPreviews = [];
      this.revokeExportImagePreview();
    },

    revokeExportImagePreview() {
      if (this.exportImagePreviewUrl && typeof URL !== 'undefined' && typeof URL.revokeObjectURL === 'function') {
        try {
          URL.revokeObjectURL(this.exportImagePreviewUrl);
        } catch {
          // ignore
        }
      }
      this.exportImagePreviewUrl = '';
    },

    getExportImageOptions() {
      return {
        preset: this.exportImagePreset === 'compact' ? 'compact' : 'complete',
        theme: this.exportImageTheme === 'light' ? 'light' : 'dark',
        hideTierBadge: false,
      };
    },

    saveExportImagePreferences() {
      ls?.setJSON?.('superficha_image_export_prefs', {
        preset: this.exportImagePreset,
        theme: this.exportImageTheme,
      });
    },

    getExportPdfOptions() {
      return {
        theme: this.exportPdfTheme === 'dark' ? 'dark' : 'light',
        includeImages: Boolean(this.exportPdfIncludeImages),
      };
    },

    saveExportPdfPreferences() {
      ls?.setJSON?.('superficha_pdf_export_prefs', {
        theme: this.exportPdfTheme,
        includeImages: this.exportPdfIncludeImages,
      });
    },

    setExportModalTab(tab) {
      if (!['pdf', 'image', 'discord', 'json'].includes(tab)) return;
      this.exportModalTab = tab;
      if (tab === 'pdf' && this.exportPdfPreviews.length === 0 && !this.exportPdfLoading) {
        void this.refreshExportPdfPreview();
      } else if (tab === 'image' && !this.exportImagePreviewUrl && !this.exportImageLoading) {
        void this.refreshExportImagePreview();
      } else if (tab === 'discord') {
        this.recalculateDiscordExport();
      }
    },

    setExportPdfTheme(theme) {
      const next = theme === 'dark' ? 'dark' : 'light';
      if (this.exportPdfTheme === next && this.exportPdfPreviews.length > 0) return;
      this.exportPdfTheme = next;
      this.saveExportPdfPreferences();
      if (this.showDiscordModal && this.exportModalTab === 'pdf') {
        void this.refreshExportPdfPreview();
      }
    },

    toggleExportPdfImages() {
      this.exportPdfIncludeImages = !this.exportPdfIncludeImages;
      this.saveExportPdfPreferences();
      if (this.showDiscordModal && this.exportModalTab === 'pdf') {
        void this.refreshExportPdfPreview();
      }
    },

    async refreshExportPdfPreview() {
      const char = this.resolveExportTargetChar();
      if (!char) {
        this.exportPdfPreviews = [];
        this.exportPdfPageCount = 0;
        this.exportPdfError = 'No hay ninguna ficha seleccionada.';
        return;
      }

      const seq = ++this._exportPdfSeq;
      this.exportPdfLoading = true;
      this.exportPdfError = '';

      try {
        const result = await renderClassicPdfPages(char, this.getExportPdfOptions());
        if (seq !== this._exportPdfSeq || !this.showDiscordModal) return;

        this.exportPdfPreviews = result.previews;
        this.exportPdfPageCount = result.pageCount;
      } catch (err) {
        if (seq !== this._exportPdfSeq) return;
        console.error('[Export] PDF preview failed:', err);
        this.exportPdfError = 'No se pudo generar la vista previa del PDF en este navegador.';
      } finally {
        if (seq === this._exportPdfSeq) {
          this.exportPdfLoading = false;
        }
      }
    },

    async downloadExportPdf() {
      const char = this.resolveExportTargetChar();
      if (!char) {
        this.toast?.('No hay ningún personaje para exportar.', 'warning');
        return;
      }
      try {
        const { filename, pageCount } = await downloadClassicCharacterPdf(char, this.getExportPdfOptions());
        this.toast?.(`PDF descargado (${pageCount} pág.): ${filename}`, 'success');
      } catch (err) {
        console.error('[Export] PDF download failed:', err);
        this.toast?.('No se pudo generar el archivo PDF.', 'error');
      }
    },

    setExportImagePreset(preset) {
      const next = preset === 'compact' ? 'compact' : 'complete';
      if (this.exportImagePreset === next && this.exportImagePreviewUrl) return;
      this.exportImagePreset = next;
      this.saveExportImagePreferences();
      if (this.showDiscordModal && this.exportModalTab === 'image') {
        void this.refreshExportImagePreview();
      }
    },

    setExportImageTheme(theme) {
      const next = theme === 'light' ? 'light' : 'dark';
      if (this.exportImageTheme === next && this.exportImagePreviewUrl) return;
      this.exportImageTheme = next;
      this.saveExportImagePreferences();
      if (this.showDiscordModal && this.exportModalTab === 'image') {
        void this.refreshExportImagePreview();
      }
    },

    async refreshExportImagePreview() {
      const char = this.resolveExportTargetChar();
      if (!char) {
        this.revokeExportImagePreview();
        this.exportImageError = 'No hay ninguna ficha seleccionada.';
        return;
      }

      const seq = ++this._exportPreviewSeq;
      this.exportImageLoading = true;
      this.exportImageError = '';

      try {
        const result = await exportCharacterImageBlob(char, this.getExportImageOptions());
        if (seq !== this._exportPreviewSeq || !this.showDiscordModal) return;

        this.revokeExportImagePreview();
        if (typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
          this.exportImagePreviewUrl = URL.createObjectURL(result.blob);
        }
        this.exportImageMeta = {
          width: result.width,
          height: result.height,
          sizeKb: Math.max(1, Math.round(result.blob.size / 1024)),
        };
      } catch (err) {
        if (seq !== this._exportPreviewSeq) return;
        console.error('[Export] Image preview failed:', err);
        this.exportImageError = 'No se pudo generar la vista previa de imagen en este navegador.';
      } finally {
        if (seq === this._exportPreviewSeq) {
          this.exportImageLoading = false;
        }
      }
    },

    async downloadExportImage() {
      const char = this.resolveExportTargetChar();
      if (!char) {
        this.toast?.('No hay ningún personaje para exportar.', 'warning');
        return;
      }
      try {
        const { filename } = await downloadCharacterImage(char, this.getExportImageOptions());
        this.toast?.(`Imagen descargada: ${filename}`, 'success');
      } catch (err) {
        console.error('[Export] Image download failed:', err);
        this.toast?.('No se pudo descargar la imagen PNG.', 'error');
      }
    },

    async copyExportImage() {
      const char = this.resolveExportTargetChar();
      if (!char) {
        this.toast?.('No hay ningún personaje para copiar.', 'warning');
        return;
      }
      try {
        const copied = await copyCharacterImageToClipboard(char, this.getExportImageOptions());
        if (copied) {
          this.toast?.('Imagen PNG copiada al portapapeles.', 'success');
        } else {
          this.toast?.('Tu navegador no permite copiar imágenes directo; usa «Descargar PNG».', 'warning');
        }
      } catch (err) {
        console.error('[Export] Copy image failed:', err);
        this.toast?.('No se pudo copiar la imagen; usa «Descargar PNG».', 'warning');
      }
    },

    exportTargetJSON() {
      const char = this.resolveExportTargetChar();
      const charStore = window.Alpine?.store('characters');
      if (!char) {
        this.toast?.('No hay ningún personaje para exportar.', 'warning');
        return;
      }
      if (charStore?.exportJSONForChar) {
        charStore.exportJSONForChar(char.id);
        return;
      }
      exportCharacterJSON(char);
      this.toast?.(`Ficha "${char.name || 'Personaje'}" exportada en JSON.`, 'success');
    },

    async copyTargetJSON() {
      const char = this.resolveExportTargetChar();
      const charStore = window.Alpine?.store('characters');
      if (!char) {
        this.toast?.('No hay ningún personaje para copiar.', 'warning');
        return;
      }
      if (charStore?.active?.id === char.id && typeof charStore.copyActiveJSONToClipboard === 'function') {
        await charStore.copyActiveJSONToClipboard();
        return;
      }
      try {
        await navigator.clipboard.writeText(JSON.stringify(char, null, 2));
        this.toast?.(`JSON de "${char.name || 'Personaje'}" copiado al portapapeles.`, 'success');
      } catch {
        this.toast?.('No se pudo copiar el JSON al portapapeles.', 'error');
      }
    },

    setDiscordPreviewTab(tab) {
      if (['wysiwyg', 'raw'].includes(tab)) {
        this.discordPreviewTab = tab;
        this.saveDiscordPreferences();
      }
    },

    setDiscordFormatMode(mode) {
      if (['standard', 'compact'].includes(mode)) {
        this.discordExportOptions.formatMode = mode;
        this.recalculateDiscordExport();
        this.saveDiscordPreferences();
      }
    },

    setDiscordSeparator(sep) {
      this.discordExportOptions.separator = sep;
      this.recalculateDiscordExport();
      this.saveDiscordPreferences();
    },

    toggleDiscordSection(sectionId) {
      const idx = this.discordExportOptions.selectedSections.indexOf(sectionId);
      if (idx >= 0) {
        if (this.discordExportOptions.selectedSections.length > 1) {
          this.discordExportOptions.selectedSections.splice(idx, 1);
        } else {
          this.toast('Debes mantener al menos una sección seleccionada.', 'warning');
          return;
        }
      } else {
        this.discordExportOptions.selectedSections.push(sectionId);
      }
      this.recalculateDiscordExport();
      this.saveDiscordPreferences();
    },

    toggleAllDiscordSections(selectAll = true) {
      if (selectAll) {
        this.discordExportOptions.selectedSections = DISCORD_SECTIONS.map(s => s.id);
      } else {
        this.discordExportOptions.selectedSections = ['basics'];
      }
      this.recalculateDiscordExport();
      this.saveDiscordPreferences();
    },

    recalculateDiscordExport() {
      const char = this.resolveExportTargetChar?.() || window.Alpine?.store('characters')?.active;
      if (!char) {
        this.discordFullText = '';
        this.discordBlocks = [];
        this.discordHtmlPreview = '';
        return;
      }
      const fullText = charToDiscordText(char, {
        mode: this.discordExportOptions.formatMode,
        sections: this.discordExportOptions.selectedSections,
        separator: this.discordExportOptions.separator,
      });
      this.discordFullText = fullText;
      this.discordBlocks = splitIntoDiscordBlocks(fullText, 1950);
      this.discordHtmlPreview = parseDiscordMarkdownToHtml(fullText);
    },

    parseDiscordMarkdownToHtml(markdownText) {
      return parseDiscordMarkdownToHtml(markdownText);
    },

    formatRichText(text) {
      return formatRichText(text);
    },

    async copyDiscordBlock(index) {
      const text = this.discordBlocks[index];
      if (!text) return;
      try {
        await navigator.clipboard.writeText(text);
        this.toast(`¡Bloque ${index + 1} copiado al portapapeles!`, 'success');
      } catch {
        this.toast('No se pudo copiar al portapapeles.', 'error');
      }
    },

    async copyAllDiscordBlocks() {
      if (!this.discordFullText) return;
      try {
        await navigator.clipboard.writeText(this.discordFullText);
        this.toast('📋 Todo el contenido de Discord copiado al portapapeles.', 'success');
      } catch {
        this.toast('No se pudo copiar al portapapeles.', 'error');
      }
    },

    loadSavedDiscordPreferences() {
      const parsed = ls.getJSON('superficha_discord_export_options');
      if (parsed) {
        if (parsed.formatMode) this.discordExportOptions.formatMode = parsed.formatMode;
        if (parsed.separator) this.discordExportOptions.separator = parsed.separator;
        if (Array.isArray(parsed.selectedSections) && parsed.selectedSections.length > 0) {
          this.discordExportOptions.selectedSections = parsed.selectedSections;
        }
        if (parsed.previewTab) this.discordPreviewTab = parsed.previewTab;
      }
    },

    saveDiscordPreferences() {
      const toSave = {
        formatMode: this.discordExportOptions.formatMode,
        separator: this.discordExportOptions.separator,
        selectedSections: this.discordExportOptions.selectedSections,
        previewTab: this.discordPreviewTab,
      };
      ls.setJSON('superficha_discord_export_options', toSave);
    }
  };
}
