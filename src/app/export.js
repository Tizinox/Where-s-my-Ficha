/**
 * app/export.js
 * Submódulo de exportación y formateador para Discord.
 */

import { 
  DISCORD_SEPARATORS, 
  DISCORD_SECTIONS, 
  charToDiscordText, 
  splitIntoDiscordBlocks, 
  parseDiscordMarkdownToHtml 
} from '@features/export/exportEngine.js';
import { formatRichText } from '@core/rich-text/textFormatterEngine.js';
import { ls } from '@core/db/storage.ts';

export function createExportMethods() {
  return {
    // ── Modal de exportación Discord Avanzado (WYSIWYG) ─────────
    showDiscordModal: false,
    discordPreviewTab: 'wysiwyg', // 'wysiwyg' | 'raw'
    discordExportOptions: {
      formatMode: 'standard', // 'standard' | 'compact'
      separator: DISCORD_SEPARATORS[0].value,
      selectedSections: DISCORD_SECTIONS.map(s => s.id),
      showSectionMenu: false,
    },
    discordFullText: '',
    discordBlocks: [], // array de strings, uno por bloque ≤ 1950 chars
    discordHtmlPreview: '',

    openDiscordModal(blocks = null) {
      this.loadSavedDiscordPreferences();
      this.recalculateDiscordExport();
      this.showDiscordModal = true;
    },

    closeDiscordModal() {
      this.showDiscordModal = false;
      this.discordExportOptions.showSectionMenu = false;
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
      const charStore = window.Alpine?.store('characters');
      const char = charStore?.active;
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
