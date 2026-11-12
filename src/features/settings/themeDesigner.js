/**
 * store/settings/themeDesigner.js
 * Diseñador de kits de temas: Creación personalizada con 6 colores,
 * 5 tipografías, geometría de esquinas, clonación, importación y exportación JSON.
 */

import { ls } from '@core/db/storage.ts';

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
      color: '#00F0FF',
      secondaryColor: '#FF0077',
      tertiaryColor: '#D4AF37',
      glowColor: '#00F0FF',
      surfaceColor: '#0A0D14',
      borderColor: '#222A36',
      fontDisplay: 'Barlow Condensed',
      fontHud: 'Chakra Petch',
      fontBody: 'Inter Tight',
      fontInput: 'JetBrains Mono',
      fontTierlist: 'Barlow Condensed',
      cornerStyle: 'chamfer',
      density: 'normal',
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

    // ── Diseñador de Kits ──────────────────────────────
    openDesigner(kitToEdit = null) {
      if (kitToEdit) {
        const p = kitToEdit.palette || {};
        const isCustom = !!kitToEdit.isCustom;
        this.designerMode = isCustom ? 'edit' : 'create';
        this.designerForm = {
          id: isCustom ? kitToEdit.id : ('custom_' + Date.now()),
          name: isCustom ? (kitToEdit.name || 'Kit Personalizado') : `${kitToEdit.name} (Custom)`,
          color: kitToEdit.color || p.accent || '#00F0FF',
          secondaryColor: p.secondary || kitToEdit.secondaryColor || '#FF0077',
          tertiaryColor: p.tertiary || kitToEdit.tertiaryColor || '#D4AF37',
          glowColor: p.glow || kitToEdit.glowColor || kitToEdit.color || '#00F0FF',
          surfaceColor: p.surface || kitToEdit.surfaceColor || '#0A0D14',
          borderColor: p.border || kitToEdit.borderColor || '#222A36',
          fontDisplay: kitToEdit.fontDisplay || kitToEdit.font || 'Barlow Condensed',
          fontHud: kitToEdit.fontHud || 'Chakra Petch',
          fontBody: kitToEdit.fontBody || 'Inter Tight',
          fontInput: kitToEdit.fontInput || 'JetBrains Mono',
          fontTierlist: kitToEdit.fontTierlist || kitToEdit.fontDisplay || 'Barlow Condensed',
          cornerStyle: kitToEdit.cornerStyle || 'chamfer',
          density: kitToEdit.density || 'normal',
        };
      } else {
        this.designerMode = 'create';
        this.designerForm = {
          id: 'custom_' + Date.now(),
          name: 'Mi Kit Personalizado',
          color: this.accentColor || '#00F0FF',
          secondaryColor: this.secondaryColor || '#FF0077',
          tertiaryColor: this.tertiaryColor || '#D4AF37',
          glowColor: this.glowColor || this.accentColor || '#00F0FF',
          surfaceColor: this.surfaceColor || '#0A0D14',
          borderColor: this.borderColor || '#222A36',
          fontDisplay: this.fontDisplay || 'Barlow Condensed',
          fontHud: this.fontHud || 'Chakra Petch',
          fontBody: this.fontBody || 'Inter Tight',
          fontInput: this.fontInput || 'JetBrains Mono',
          fontTierlist: this.fontTierlist || 'Barlow Condensed',
          cornerStyle: this.cornerStyle || 'chamfer',
          density: this.density || 'normal',
        };
      }
      this.showDesignerModal = true;
      setTimeout(() => {
        window.lucide?.createIcons?.();
      }, 50);
    },

    syncCurrentSettingsToDesigner() {
      this.designerForm.color = this.accentColor || '#00F0FF';
      this.designerForm.secondaryColor = this.secondaryColor || '#FF0077';
      this.designerForm.tertiaryColor = this.tertiaryColor || '#D4AF37';
      this.designerForm.glowColor = this.glowColor || this.accentColor || '#00F0FF';
      this.designerForm.surfaceColor = this.surfaceColor || '#0A0D14';
      this.designerForm.borderColor = this.borderColor || '#222A36';
      this.designerForm.fontDisplay = this.fontDisplay || 'Barlow Condensed';
      this.designerForm.fontHud = this.fontHud || 'Chakra Petch';
      this.designerForm.fontBody = this.fontBody || 'Inter Tight';
      this.designerForm.fontInput = this.fontInput || 'JetBrains Mono';
      this.designerForm.fontTierlist = this.fontTierlist || 'Barlow Condensed';
      this.designerForm.cornerStyle = this.cornerStyle || 'chamfer';
      this.designerForm.density = this.density || 'normal';
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

      const formattedKit = {
        id: this.designerForm.id || ('custom_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6)),
        name: this.designerForm.name.trim(),
        color: this.designerForm.color || '#00F0FF',
        secondaryColor: this.designerForm.secondaryColor || '#FF0077',
        tertiaryColor: this.designerForm.tertiaryColor || '#D4AF37',
        glowColor: this.designerForm.glowColor || this.designerForm.color || '#00F0FF',
        surfaceColor: this.designerForm.surfaceColor || '#0A0D14',
        borderColor: this.designerForm.borderColor || '#222A36',
        palette: {
          accent: this.designerForm.color || '#00F0FF',
          secondary: this.designerForm.secondaryColor || '#FF0077',
          tertiary: this.designerForm.tertiaryColor || '#D4AF37',
          glow: this.designerForm.glowColor || this.designerForm.color || '#00F0FF',
          surface: this.designerForm.surfaceColor || '#0A0D14',
          border: this.designerForm.borderColor || '#222A36',
        },
        fontDisplay: this.designerForm.fontDisplay || 'Barlow Condensed',
        fontHud: this.designerForm.fontHud || 'Chakra Petch',
        fontBody: this.designerForm.fontBody || 'Inter Tight',
        fontInput: this.designerForm.fontInput || 'JetBrains Mono',
        fontTierlist: this.designerForm.fontTierlist || this.designerForm.fontDisplay || 'Barlow Condensed',
        cornerStyle: this.designerForm.cornerStyle || 'chamfer',
        density: this.designerForm.density || 'normal',
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
      const exportObject = {
        _type: 'superficha_theme_kit',
        version: 2,
        exportedAt: new Date().toISOString(),
        kit: {
          name: kit.name,
          color: kit.color || p.accent || '#00F0FF',
          secondaryColor: p.secondary || kit.secondaryColor || '#FF0077',
          tertiaryColor: p.tertiary || kit.tertiaryColor || '#D4AF37',
          glowColor: p.glow || kit.glowColor || kit.color || '#00F0FF',
          surfaceColor: p.surface || kit.surfaceColor || '#0A0D14',
          borderColor: p.border || kit.borderColor || '#222A36',
          palette: {
            accent: kit.color || p.accent || '#00F0FF',
            secondary: p.secondary || kit.secondaryColor || '#FF0077',
            tertiary: p.tertiary || kit.tertiaryColor || '#D4AF37',
            glow: p.glow || kit.glowColor || kit.color || '#00F0FF',
            surface: p.surface || kit.surfaceColor || '#0A0D14',
            border: p.border || kit.borderColor || '#222A36',
          },
          fontDisplay: kit.fontDisplay || kit.font || 'Barlow Condensed',
          fontHud: kit.fontHud || 'Chakra Petch',
          fontBody: kit.fontBody || 'Inter Tight',
          fontInput: kit.fontInput || 'JetBrains Mono',
          fontTierlist: kit.fontTierlist || kit.fontDisplay || 'Barlow Condensed',
          cornerStyle: kit.cornerStyle || 'chamfer',
          density: kit.density || 'normal',
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
      const accent = src.color || p.accent || '#00F0FF';
      const secondary = p.secondary || src.secondaryColor || '#FF0077';
      const tertiary = p.tertiary || src.tertiaryColor || '#D4AF37';
      const glow = p.glow || src.glowColor || accent;
      const surface = p.surface || src.surfaceColor || '#0A0D14';
      const border = p.border || src.borderColor || '#222A36';

      return {
        id: 'custom_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        name: src.name || 'Kit Importado',
        color: accent,
        secondaryColor: secondary,
        tertiaryColor: tertiary,
        glowColor: glow,
        surfaceColor: surface,
        borderColor: border,
        palette: {
          accent,
          secondary,
          tertiary,
          glow,
          surface,
          border,
        },
        fontDisplay: src.fontDisplay || src.font || 'Barlow Condensed',
        fontHud: src.fontHud || 'Chakra Petch',
        fontBody: src.fontBody || 'Inter Tight',
        fontInput: src.fontInput || 'JetBrains Mono',
        fontTierlist: src.fontTierlist || src.fontDisplay || 'Barlow Condensed',
        cornerStyle: src.cornerStyle || 'chamfer',
        density: src.density || 'normal',
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
