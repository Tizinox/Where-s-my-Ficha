/**
 * store/settings/themeDesigner.js
 * Diseñador de kits de temas: Creación personalizada con 6 colores,
 * 5 tipografías, geometría de esquinas, clonación, importación y exportación JSON.
 */

import { ls } from '@core/db/storage.ts';
import { DEFAULT_SETTINGS } from './constants.js';

export function createThemeDesignerMethods() {
  return {
    customThemeKits: [],
    kitSearchQuery: '',
    kitCategoryFilter: 'all', // 'all' | 'system' | 'custom'
    kitViewMode: ls.get('superficha_kit_view_mode', 'magazine'), // 'magazine' | 'grid'

    setKitViewMode(mode) {
      this.kitViewMode = mode;
      ls.set('superficha_kit_view_mode', mode);
    },

    scrollMagazine(direction = 1) {
      const el = document.getElementById('magazine-scroller-container');
      if (el) {
        const cardWidth = 380;
        el.scrollBy({ left: direction * cardWidth, behavior: 'smooth' });
      }
    },

    // Estado del Modal Diseñador de Kits
    showDesignerModal: false,
    designerMode: 'create', // 'create' | 'edit'
    designerForm: {
      id: '',
      name: '',
      color: DEFAULT_SETTINGS.accentColor,
      secondaryColor: DEFAULT_SETTINGS.secondaryColor,
      tertiaryColor: DEFAULT_SETTINGS.tertiaryColor,
      glowColor: DEFAULT_SETTINGS.glowColor,
      glowMode: DEFAULT_SETTINGS.glowMode,
      surfaceColor: DEFAULT_SETTINGS.surfaceColor,
      borderColor: DEFAULT_SETTINGS.borderColor,
      borderWidth: DEFAULT_SETTINGS.borderWidth,
      fontDisplay: DEFAULT_SETTINGS.fontDisplay,
      fontHud: DEFAULT_SETTINGS.fontHud,
      fontBody: DEFAULT_SETTINGS.fontBody,
      fontInput: DEFAULT_SETTINGS.fontInput,
      fontTierlist: DEFAULT_SETTINGS.fontTierlist,
      fontWeightDisplay: DEFAULT_SETTINGS.fontWeightDisplay,
      fontWeightHud: DEFAULT_SETTINGS.fontWeightHud,
      fontWeightBody: DEFAULT_SETTINGS.fontWeightBody,
      fontWeightInput: DEFAULT_SETTINGS.fontWeightInput,
      fontWeightTierlist: DEFAULT_SETTINGS.fontWeightTierlist,
      cornerStyle: DEFAULT_SETTINGS.cornerStyle || 'rounded',
      density: DEFAULT_SETTINGS.density,
      disableGlowEffects: false,
      disableCustomColors: false,
    },

    // Estado del Modal de Exportación de Kits
    showExportKitModal: false,
    exportKitData: null,
    exportKitString: '',

    // Estado del Modal de Importación de Kits
    showImportKitModal: false,
    importKitInput: '',

    loadCustomThemeKits() {
      const saved = ls.getJSON('superficha_custom_theme_kits');
      if (Array.isArray(saved)) {
        this.customThemeKits = saved;
      }
    },

    saveCustomThemeKits() {
      ls.setJSON('superficha_custom_theme_kits', this.customThemeKits);
    },

    getDesignerContrastInfo() {
      const parseHexRgb = (hex) => {
        if (typeof hex !== 'string') return null;
        const clean = hex.trim().replace(/^#/, '');
        if (/^[0-9a-f]{3}$/i.test(clean)) {
          return clean.split('').map((c) => parseInt(c + c, 16));
        }
        if (/^[0-9a-f]{6}$/i.test(clean)) {
          return [0, 2, 4].map((i) => parseInt(clean.slice(i, i + 2), 16));
        }
        return null;
      };
      const luminance = (rgb) => {
        const toLinear = (c) => {
          const s = c / 255;
          return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
        };
        return 0.2126 * toLinear(rgb[0]) + 0.7152 * toLinear(rgb[1]) + 0.0722 * toLinear(rgb[2]);
      };
      const fg = parseHexRgb(this.designerForm?.color) || [0, 240, 255];
      const bg = parseHexRgb(this.designerForm?.surfaceColor) || [10, 13, 20];
      const lFg = luminance(fg);
      const lBg = luminance(bg);
      const ratio = (Math.max(lFg, lBg) + 0.05) / (Math.min(lFg, lBg) + 0.05);
      const roundedRatio = Math.round(ratio * 100) / 100;
      const level = ratio >= 7 ? 'AAA' : (ratio >= 4.5 ? 'AA' : (ratio >= 3 ? 'AA*' : 'BAJO'));
      return {
        ratio: roundedRatio,
        level,
        ok: ratio >= 4.5,
        warn: ratio >= 3 && ratio < 4.5,
        surfaceIsLight: lBg > 0.42,
        label: `${roundedRatio.toFixed(2)}:1 · WCAG ${level}`,
      };
    },

    // ── Diseñador de Kits ──────────────────────────────
    openDesigner(kitToEdit = null) {
      if (kitToEdit) {
        const p = kitToEdit.palette || {};
        const isCustom = !!kitToEdit.isCustom;
        this.designerMode = isCustom ? 'edit' : 'create';
        this.designerForm = {
          id: isCustom ? kitToEdit.id : ('custom_' + Date.now()),
          name: isCustom ? (kitToEdit.name || 'Kit Personalizado') : `${kitToEdit.name} (Custom)`,
          color: kitToEdit.color || p.accent || DEFAULT_SETTINGS.accentColor,
          secondaryColor: p.secondary || kitToEdit.secondaryColor || DEFAULT_SETTINGS.secondaryColor,
          tertiaryColor: p.tertiary || kitToEdit.tertiaryColor || DEFAULT_SETTINGS.tertiaryColor,
          glowColor: p.glow || kitToEdit.glowColor || kitToEdit.color || DEFAULT_SETTINGS.glowColor,
          glowMode: kitToEdit.glowMode || ((p.glow || kitToEdit.glowColor) ? 'custom' : (DEFAULT_SETTINGS.glowMode || 'auto')),
          surfaceColor: p.surface || kitToEdit.surfaceColor || DEFAULT_SETTINGS.surfaceColor,
          borderColor: p.border || kitToEdit.borderColor || DEFAULT_SETTINGS.borderColor,
          borderWidth: Math.max(1, Math.min(5, parseInt(kitToEdit.borderWidth, 10) || DEFAULT_SETTINGS.borderWidth || 1)),
          fontDisplay: kitToEdit.fontDisplay || kitToEdit.font || DEFAULT_SETTINGS.fontDisplay,
          fontHud: kitToEdit.fontHud || DEFAULT_SETTINGS.fontHud,
          fontBody: kitToEdit.fontBody || DEFAULT_SETTINGS.fontBody,
          fontInput: kitToEdit.fontInput || DEFAULT_SETTINGS.fontInput,
          fontTierlist: kitToEdit.fontTierlist || kitToEdit.fontDisplay || DEFAULT_SETTINGS.fontTierlist,
          fontWeightDisplay: String(kitToEdit.fontWeightDisplay || DEFAULT_SETTINGS.fontWeightDisplay),
          fontWeightHud: String(kitToEdit.fontWeightHud || DEFAULT_SETTINGS.fontWeightHud),
          fontWeightBody: String(kitToEdit.fontWeightBody || DEFAULT_SETTINGS.fontWeightBody),
          fontWeightInput: String(kitToEdit.fontWeightInput || DEFAULT_SETTINGS.fontWeightInput),
          fontWeightTierlist: String(kitToEdit.fontWeightTierlist || DEFAULT_SETTINGS.fontWeightTierlist),
          cornerStyle: kitToEdit.cornerStyle || DEFAULT_SETTINGS.cornerStyle || 'rounded',
          density: kitToEdit.density || DEFAULT_SETTINGS.density || 'normal',
          disableGlowEffects: kitToEdit.disableGlowEffects !== undefined ? !!kitToEdit.disableGlowEffects : (kitToEdit.id === 'classic-rpg'),
          disableCustomColors: kitToEdit.disableCustomColors !== undefined ? !!kitToEdit.disableCustomColors : (kitToEdit.id === 'classic-rpg'),
        };
      } else {
        this.designerMode = 'create';
        this.designerForm = {
          id: 'custom_' + Date.now(),
          name: 'Mi Kit Personalizado',
          color: this.accentColor || DEFAULT_SETTINGS.accentColor,
          secondaryColor: this.secondaryColor || DEFAULT_SETTINGS.secondaryColor,
          tertiaryColor: this.tertiaryColor || DEFAULT_SETTINGS.tertiaryColor,
          glowColor: this.glowColor || this.accentColor || DEFAULT_SETTINGS.glowColor,
          glowMode: this.glowMode || DEFAULT_SETTINGS.glowMode || 'auto',
          surfaceColor: this.surfaceColor || DEFAULT_SETTINGS.surfaceColor,
          borderColor: this.borderColor || DEFAULT_SETTINGS.borderColor,
          borderWidth: Math.max(1, Math.min(5, parseInt(this.borderWidth, 10) || DEFAULT_SETTINGS.borderWidth || 1)),
          fontDisplay: this.fontDisplay || DEFAULT_SETTINGS.fontDisplay,
          fontHud: this.fontHud || DEFAULT_SETTINGS.fontHud,
          fontBody: this.fontBody || DEFAULT_SETTINGS.fontBody,
          fontInput: this.fontInput || DEFAULT_SETTINGS.fontInput,
          fontTierlist: this.fontTierlist || DEFAULT_SETTINGS.fontTierlist,
          fontWeightDisplay: String(this.fontWeightDisplay || DEFAULT_SETTINGS.fontWeightDisplay),
          fontWeightHud: String(this.fontWeightHud || DEFAULT_SETTINGS.fontWeightHud),
          fontWeightBody: String(this.fontWeightBody || DEFAULT_SETTINGS.fontWeightBody),
          fontWeightInput: String(this.fontWeightInput || DEFAULT_SETTINGS.fontWeightInput),
          fontWeightTierlist: String(this.fontWeightTierlist || DEFAULT_SETTINGS.fontWeightTierlist),
          cornerStyle: this.cornerStyle || DEFAULT_SETTINGS.cornerStyle || 'rounded',
          density: this.density || DEFAULT_SETTINGS.density || 'normal',
          disableGlowEffects: Boolean(this.disableGlowEffects),
          disableCustomColors: Boolean(this.disableCustomColors),
        };
      }
      this.showDesignerModal = true;
      setTimeout(() => {
        if (typeof window !== 'undefined') {
          window.lucide?.createIcons?.();
        }
      }, 50);
    },

    syncCurrentSettingsToDesigner() {
      this.designerForm.color = this.accentColor || DEFAULT_SETTINGS.accentColor;
      this.designerForm.secondaryColor = this.secondaryColor || DEFAULT_SETTINGS.secondaryColor;
      this.designerForm.tertiaryColor = this.tertiaryColor || DEFAULT_SETTINGS.tertiaryColor;
      this.designerForm.glowColor = this.glowColor || this.accentColor || DEFAULT_SETTINGS.glowColor;
      this.designerForm.glowMode = this.glowMode || DEFAULT_SETTINGS.glowMode || 'auto';
      this.designerForm.surfaceColor = this.surfaceColor || DEFAULT_SETTINGS.surfaceColor;
      this.designerForm.borderColor = this.borderColor || DEFAULT_SETTINGS.borderColor;
      this.designerForm.borderWidth = Math.max(1, Math.min(5, parseInt(this.borderWidth, 10) || DEFAULT_SETTINGS.borderWidth || 1));
      this.designerForm.fontDisplay = this.fontDisplay || DEFAULT_SETTINGS.fontDisplay;
      this.designerForm.fontHud = this.fontHud || DEFAULT_SETTINGS.fontHud;
      this.designerForm.fontBody = this.fontBody || DEFAULT_SETTINGS.fontBody;
      this.designerForm.fontInput = this.fontInput || DEFAULT_SETTINGS.fontInput;
      this.designerForm.fontTierlist = this.fontTierlist || DEFAULT_SETTINGS.fontTierlist;
      this.designerForm.fontWeightDisplay = String(this.fontWeightDisplay || DEFAULT_SETTINGS.fontWeightDisplay);
      this.designerForm.fontWeightHud = String(this.fontWeightHud || DEFAULT_SETTINGS.fontWeightHud);
      this.designerForm.fontWeightBody = String(this.fontWeightBody || DEFAULT_SETTINGS.fontWeightBody);
      this.designerForm.fontWeightInput = String(this.fontWeightInput || DEFAULT_SETTINGS.fontWeightInput);
      this.designerForm.fontWeightTierlist = String(this.fontWeightTierlist || DEFAULT_SETTINGS.fontWeightTierlist);
      this.designerForm.cornerStyle = this.cornerStyle || DEFAULT_SETTINGS.cornerStyle || 'rounded';
      this.designerForm.density = this.density || DEFAULT_SETTINGS.density || 'normal';
      this.designerForm.disableGlowEffects = Boolean(this.disableGlowEffects);
      this.designerForm.disableCustomColors = Boolean(this.disableCustomColors);
      window.Alpine?.store('app')?.toast?.('Ajustes visuales activos importados al diseñador.', 'info');
    },

    closeDesigner() {
      this.showDesignerModal = false;
    },

    saveDesignerKit(applyImmediately = false) {
      this.saveKitFromDesigner(applyImmediately);
    },

    saveKitFromDesigner(applyImmediately = false) {
      if (!this.designerForm.name?.trim()) {
        window.Alpine?.store('app')?.toast?.('Por favor, ingresa un nombre para el kit.', 'warning');
        return;
      }

      const accent = this.designerForm.color || DEFAULT_SETTINGS.accentColor;
      const secondary = this.designerForm.secondaryColor || DEFAULT_SETTINGS.secondaryColor;
      const tertiary = this.designerForm.tertiaryColor || DEFAULT_SETTINGS.tertiaryColor;
      const glow = this.designerForm.glowColor || accent;
      const surface = this.designerForm.surfaceColor || DEFAULT_SETTINGS.surfaceColor;
      const border = this.designerForm.borderColor || DEFAULT_SETTINGS.borderColor;

      const formattedKit = {
        id: this.designerForm.id || ('custom_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6)),
        name: this.designerForm.name.trim(),
        color: accent,
        secondaryColor: secondary,
        tertiaryColor: tertiary,
        glowColor: glow,
        glowMode: this.designerForm.glowMode || 'auto',
        surfaceColor: surface,
        borderColor: border,
        borderWidth: Math.max(1, Math.min(5, parseInt(this.designerForm.borderWidth, 10) || 1)),
        palette: {
          accent,
          secondary,
          tertiary,
          glow,
          surface,
          border,
        },
        fontDisplay: this.designerForm.fontDisplay || DEFAULT_SETTINGS.fontDisplay,
        fontHud: this.designerForm.fontHud || DEFAULT_SETTINGS.fontHud,
        fontBody: this.designerForm.fontBody || DEFAULT_SETTINGS.fontBody,
        fontInput: this.designerForm.fontInput || DEFAULT_SETTINGS.fontInput,
        fontTierlist: this.designerForm.fontTierlist || this.designerForm.fontDisplay || DEFAULT_SETTINGS.fontTierlist,
        fontWeightDisplay: String(this.designerForm.fontWeightDisplay || DEFAULT_SETTINGS.fontWeightDisplay),
        fontWeightHud: String(this.designerForm.fontWeightHud || DEFAULT_SETTINGS.fontWeightHud),
        fontWeightBody: String(this.designerForm.fontWeightBody || DEFAULT_SETTINGS.fontWeightBody),
        fontWeightInput: String(this.designerForm.fontWeightInput || DEFAULT_SETTINGS.fontWeightInput),
        fontWeightTierlist: String(this.designerForm.fontWeightTierlist || DEFAULT_SETTINGS.fontWeightTierlist),
        cornerStyle: this.designerForm.cornerStyle || DEFAULT_SETTINGS.cornerStyle || 'rounded',
        density: this.designerForm.density || 'normal',
        disableGlowEffects: Boolean(this.designerForm.disableGlowEffects),
        disableCustomColors: Boolean(this.designerForm.disableCustomColors),
        isCustom: true,
      };

      if (this.designerMode === 'edit') {
        const index = this.customThemeKits.findIndex(k => k.id === this.designerForm.id);
        if (index !== -1) {
          this.customThemeKits[index] = formattedKit;
          window.Alpine?.store('app')?.toast?.(`Kit "${formattedKit.name}" actualizado.`, 'success');
        } else {
          this.customThemeKits.push(formattedKit);
        }
      } else {
        this.customThemeKits.push(formattedKit);
        window.Alpine?.store('app')?.toast?.(`Kit "${formattedKit.name}" guardado exitosamente.`, 'success');
      }

      this.saveCustomThemeKits();
      this.closeDesigner();

      if (applyImmediately) {
        this.applyThemeKit(formattedKit);
      }
    },

    duplicateKit(kit) {
      if (!kit) return;
      const isSystem = !kit.isCustom;
      const copy = {
        ...JSON.parse(JSON.stringify(kit)),
        id: 'custom_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        name: isSystem ? `${kit.name} (Copia Editable)` : `${kit.name} (Copia)`,
        isCustom: true,
      };
      this.customThemeKits.push(copy);
      this.saveCustomThemeKits();
      if (isSystem) {
        window.Alpine?.store('app')?.toast?.(`Kit del sistema clonado como "${copy.name}". Ahora puedes editarlo en "Mis Kits".`, 'success');
      } else {
        window.Alpine?.store('app')?.toast?.(`Kit duplicado como "${copy.name}".`, 'success');
      }
    },

    deleteCustomKit(kitId) {
      const kit = this.customThemeKits.find(k => k.id === kitId);
      if (!kit) return;
      this.customThemeKits = this.customThemeKits.filter(k => k.id !== kitId);
      this.saveCustomThemeKits();
      window.Alpine?.store('app')?.toast?.(`Kit "${kit.name}" eliminado.`, 'info');
    },

    // ── Exportación de Kits ──────────────────────────────────────
    openExportKit(kit) {
      this.openExportKitModal(kit);
    },

    openExportKitModal(kit) {
      if (!kit) return;
      this.exportKitData = kit;
      const p = kit.palette || {};
      const accent = kit.color || p.accent || DEFAULT_SETTINGS.accentColor;
      const secondary = p.secondary || kit.secondaryColor || DEFAULT_SETTINGS.secondaryColor;
      const tertiary = p.tertiary || kit.tertiaryColor || DEFAULT_SETTINGS.tertiaryColor;
      const glow = p.glow || kit.glowColor || accent;
      const surface = p.surface || kit.surfaceColor || DEFAULT_SETTINGS.surfaceColor;
      const border = p.border || kit.borderColor || DEFAULT_SETTINGS.borderColor;
      const exportObject = {
        _type: 'superficha_theme_kit',
        version: 2,
        exportedAt: new Date().toISOString(),
        kit: {
          name: kit.name,
          color: accent,
          secondaryColor: secondary,
          tertiaryColor: tertiary,
          glowColor: glow,
          glowMode: kit.glowMode || DEFAULT_SETTINGS.glowMode || 'auto',
          surfaceColor: surface,
          borderColor: border,
          borderWidth: Math.max(1, Math.min(5, parseInt(kit.borderWidth, 10) || DEFAULT_SETTINGS.borderWidth || 1)),
          palette: {
            accent,
            secondary,
            tertiary,
            glow,
            surface,
            border,
          },
          fontDisplay: kit.fontDisplay || kit.font || DEFAULT_SETTINGS.fontDisplay,
          fontHud: kit.fontHud || DEFAULT_SETTINGS.fontHud,
          fontBody: kit.fontBody || DEFAULT_SETTINGS.fontBody,
          fontInput: kit.fontInput || DEFAULT_SETTINGS.fontInput,
          fontTierlist: kit.fontTierlist || kit.fontDisplay || DEFAULT_SETTINGS.fontTierlist,
          fontWeightDisplay: String(kit.fontWeightDisplay || DEFAULT_SETTINGS.fontWeightDisplay),
          fontWeightHud: String(kit.fontWeightHud || DEFAULT_SETTINGS.fontWeightHud),
          fontWeightBody: String(kit.fontWeightBody || DEFAULT_SETTINGS.fontWeightBody),
          fontWeightInput: String(kit.fontWeightInput || DEFAULT_SETTINGS.fontWeightInput),
          fontWeightTierlist: String(kit.fontWeightTierlist || DEFAULT_SETTINGS.fontWeightTierlist),
          cornerStyle: kit.cornerStyle || DEFAULT_SETTINGS.cornerStyle || 'rounded',
          density: kit.density || 'normal',
          disableGlowEffects: Boolean(kit.disableGlowEffects),
          disableCustomColors: Boolean(kit.disableCustomColors),
        }
      };
      this.exportKitString = JSON.stringify(exportObject, null, 2);
      this.showExportKitModal = true;
    },

    closeExportKit() {
      this.closeExportKitModal();
    },

    closeExportKitModal() {
      this.showExportKitModal = false;
      this.exportKitData = null;
      this.exportKitString = '';
    },

    copyExportString() {
      this.copyExportKitJson();
    },

    copyExportKitJson() {
      if (!this.exportKitString) return;
      navigator.clipboard.writeText(this.exportKitString).then(() => {
        window.Alpine?.store('app')?.toast?.('JSON del kit copiado al portapapeles.', 'success');
      }).catch(() => {
        window.Alpine?.store('app')?.toast?.('Error al copiar al portapapeles.', 'error');
      });
    },

    downloadExportFile() {
      this.downloadKitFile();
    },

    downloadKitFile() {
      if (!this.exportKitData || !this.exportKitString) return;
      const blob = new Blob([this.exportKitString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const sanitizedName = (this.exportKitData.name || 'tema').toLowerCase().replace(/[^a-z0-9]/g, '_');
      a.download = `theme_kit_${sanitizedName}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      window.Alpine?.store('app')?.toast?.('Archivo de kit descargado.', 'success');
    },

    // ── Importación de Kits ──────────────────────────────────────
    openImportKitModal() {
      this.importKitInput = '';
      this.showImportKitModal = true;
    },

    closeImportKitModal() {
      this.showImportKitModal = false;
      this.importKitInput = '';
    },

    _parseKitFromObject(parsed) {
      const src = (parsed._type === 'superficha_theme_kit' && parsed.kit) ? parsed.kit : parsed;
      if (!src || (!src.color && !src.palette?.accent && !src.name)) {
        throw new Error('Estructura de kit no reconocida');
      }

      const p = src.palette || {};
      const accent = src.color || p.accent || DEFAULT_SETTINGS.accentColor;
      const secondary = p.secondary || src.secondaryColor || DEFAULT_SETTINGS.secondaryColor;
      const tertiary = p.tertiary || src.tertiaryColor || DEFAULT_SETTINGS.tertiaryColor;
      const glow = p.glow || src.glowColor || accent;
      const surface = p.surface || src.surfaceColor || DEFAULT_SETTINGS.surfaceColor;
      const border = p.border || src.borderColor || DEFAULT_SETTINGS.borderColor;

      return {
        id: 'custom_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        name: src.name || 'Kit Importado',
        color: accent,
        secondaryColor: secondary,
        tertiaryColor: tertiary,
        glowColor: glow,
        glowMode: src.glowMode || DEFAULT_SETTINGS.glowMode || 'auto',
        surfaceColor: surface,
        borderColor: border,
        borderWidth: Math.max(1, Math.min(5, parseInt(src.borderWidth, 10) || DEFAULT_SETTINGS.borderWidth || 1)),
        palette: {
          accent,
          secondary,
          tertiary,
          glow,
          surface,
          border,
        },
        fontDisplay: src.fontDisplay || src.font || DEFAULT_SETTINGS.fontDisplay,
        fontHud: src.fontHud || DEFAULT_SETTINGS.fontHud,
        fontBody: src.fontBody || DEFAULT_SETTINGS.fontBody,
        fontInput: src.fontInput || DEFAULT_SETTINGS.fontInput,
        fontTierlist: src.fontTierlist || src.fontDisplay || DEFAULT_SETTINGS.fontTierlist,
        fontWeightDisplay: String(src.fontWeightDisplay || DEFAULT_SETTINGS.fontWeightDisplay),
        fontWeightHud: String(src.fontWeightHud || DEFAULT_SETTINGS.fontWeightHud),
        fontWeightBody: String(src.fontWeightBody || DEFAULT_SETTINGS.fontWeightBody),
        fontWeightInput: String(src.fontWeightInput || DEFAULT_SETTINGS.fontWeightInput),
        fontWeightTierlist: String(src.fontWeightTierlist || DEFAULT_SETTINGS.fontWeightTierlist),
        cornerStyle: src.cornerStyle || DEFAULT_SETTINGS.cornerStyle || 'rounded',
        density: src.density || 'normal',
        disableGlowEffects: Boolean(src.disableGlowEffects),
        disableCustomColors: Boolean(src.disableCustomColors),
        isCustom: true,
      };
    },

    importKitFromString() {
      if (!this.importKitInput?.trim()) {
        window.Alpine?.store('app')?.toast?.('Por favor, ingresa el código o JSON del kit.', 'warning');
        return;
      }

      try {
        let raw = this.importKitInput.trim();
        if (raw.startsWith('TACTICAL-THEME::')) {
          raw = atob(raw.replace('TACTICAL-THEME::', ''));
        }

        const parsed = JSON.parse(raw);
        const kitToAdd = this._parseKitFromObject(parsed);

        this.customThemeKits.push(kitToAdd);
        this.saveCustomThemeKits();
        this.closeImportKitModal();
        window.Alpine?.store('app')?.toast?.(`Kit "${kitToAdd.name}" importado exitosamente.`, 'success');
      } catch (err) {
        console.error('[settings] Error al importar kit desde texto:', err);
        window.Alpine?.store('app')?.toast?.('Código o formato de kit inválido.', 'error');
      }
    },

    processImportKitFile(event) {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target.result;
          const parsed = JSON.parse(content);
          const kitToAdd = this._parseKitFromObject(parsed);

          this.customThemeKits.push(kitToAdd);
          this.saveCustomThemeKits();
          this.closeImportKitModal();
          window.Alpine?.store('app')?.toast?.(`Kit "${kitToAdd.name}" importado exitosamente.`, 'success');
        } catch (err) {
          console.error('[settings] Error al importar kit:', err);
          window.Alpine?.store('app')?.toast?.('El archivo no contiene un formato de kit de tema válido.', 'error');
        }
      };
      reader.readAsText(file);
      event.target.value = '';
    },

    importKitFile(event) {
      this.processImportKitFile(event);
    }
  };
}
