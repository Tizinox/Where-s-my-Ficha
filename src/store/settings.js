/**
 * store/settings.js
 * Alpine.store('settings') — Sistema de Tematización Global Unificada.
 * Controla colores, 4 jerarquías tipográficas independientes (Google Fonts),
 * densidad de interfaz, kits temáticos y fondos de forma universal para toda la aplicación.
 *
 * Módulos desacoplados:
 * - constants.js: Ajustes por defecto, swatches de colores y kits de temas predefinidos.
 * - faviconEngine.js: Motor de favicon isométrico 3D (Easter Egg de Minecraft).
 * - themeDesigner.js: Diseñador de kits de temas, importación/exportación JSON.
 */

import { checkHudContrast } from '../utils/contrast.js';
import { db } from '../database.js';
import { ls } from '../utils/storage.js';
import { compressImageWithStats } from '../utils/imageCompressor.js';
import {
  DEFAULT_SETTINGS,
  POPULAR_ACCENT_SWATCHES,
  POPULAR_SECONDARY_SWATCHES,
  POPULAR_TERTIARY_SWATCHES,
  POPULAR_SURFACE_SWATCHES,
  POPULAR_BORDER_SWATCHES,
  THEME_KITS
} from './settings/constants.js';
import { createFaviconEngineMethods } from './settings/faviconEngine.js';
import { createThemeDesignerMethods } from './settings/themeDesigner.js';
import { createStorageHealthMethods } from './settings/storageHealth.js';

// Re-exportar constantes para retrocompatibilidad total con cualquier importador externo
export {
  DEFAULT_SETTINGS,
  POPULAR_ACCENT_SWATCHES,
  POPULAR_SECONDARY_SWATCHES,
  POPULAR_TERTIARY_SWATCHES,
  POPULAR_SURFACE_SWATCHES,
  POPULAR_BORDER_SWATCHES,
  THEME_KITS
};

export function registerSettingsStore(Alpine) {
  // Carga sincrónica de caché desde localStorage para disponibilidad instantánea al montar
  const cached = ls.getJSON('superficha_global_settings') || {};

  Alpine.store('settings', {
    // Swatches Rápidos
    popularAccentSwatches: POPULAR_ACCENT_SWATCHES,
    popularSecondarySwatches: POPULAR_SECONDARY_SWATCHES,
    popularTertiarySwatches: POPULAR_TERTIARY_SWATCHES,
    popularSurfaceSwatches: POPULAR_SURFACE_SWATCHES,
    popularBorderSwatches: POPULAR_BORDER_SWATCHES,

    // Estado visual global del sistema (6 Canales Cromáticos)
    accentColor: cached.accentColor || DEFAULT_SETTINGS.accentColor,
    secondaryColor: cached.secondaryColor || DEFAULT_SETTINGS.secondaryColor,
    tertiaryColor: cached.tertiaryColor || DEFAULT_SETTINGS.tertiaryColor,
    glowColor: cached.glowColor || DEFAULT_SETTINGS.glowColor,
    glowMode: cached.glowMode || DEFAULT_SETTINGS.glowMode,
    surfaceColor: cached.surfaceColor || DEFAULT_SETTINGS.surfaceColor,
    borderColor: cached.borderColor || DEFAULT_SETTINGS.borderColor,
    borderWidth: cached.borderWidth ? parseInt(cached.borderWidth, 10) : (DEFAULT_SETTINGS.borderWidth || 1),

    fontDisplay: cached.fontDisplay || DEFAULT_SETTINGS.fontDisplay,
    fontBody: cached.fontBody || DEFAULT_SETTINGS.fontBody,
    fontInput: cached.fontInput || DEFAULT_SETTINGS.fontInput,
    fontHud: cached.fontHud || DEFAULT_SETTINGS.fontHud,
    fontTierlist: cached.fontTierlist || DEFAULT_SETTINGS.fontTierlist,

    fontWeightDisplay: cached.fontWeightDisplay || DEFAULT_SETTINGS.fontWeightDisplay,
    fontWeightBody: cached.fontWeightBody || DEFAULT_SETTINGS.fontWeightBody,
    fontWeightInput: cached.fontWeightInput || DEFAULT_SETTINGS.fontWeightInput,
    fontWeightHud: cached.fontWeightHud || DEFAULT_SETTINGS.fontWeightHud,
    fontWeightTierlist: cached.fontWeightTierlist || DEFAULT_SETTINGS.fontWeightTierlist,

    density: cached.density || DEFAULT_SETTINGS.density,
    cornerStyle: cached.cornerStyle || DEFAULT_SETTINGS.cornerStyle || 'chamfer',
    kitId: cached.kitId !== undefined ? cached.kitId : DEFAULT_SETTINGS.kitId,

    // Visibilidad de Íconos en Interfaz
    hideAllIcons: cached.hideAllIcons !== undefined ? cached.hideAllIcons : DEFAULT_SETTINGS.hideAllIcons,
    hideIconsH1: cached.hideIconsH1 !== undefined ? cached.hideIconsH1 : DEFAULT_SETTINGS.hideIconsH1,
    hideIconsH2: cached.hideIconsH2 !== undefined ? cached.hideIconsH2 : DEFAULT_SETTINGS.hideIconsH2,
    hideIconsH3: cached.hideIconsH3 !== undefined ? cached.hideIconsH3 : DEFAULT_SETTINGS.hideIconsH3,
    hideIconsLabels: cached.hideIconsLabels !== undefined ? cached.hideIconsLabels : DEFAULT_SETTINGS.hideIconsLabels,

    // Neutralización Cromática / Modo Monocromático de Textos y Encabezados
    disableCustomColors: cached.disableCustomColors !== undefined ? cached.disableCustomColors : DEFAULT_SETTINGS.disableCustomColors,
    disableGlowEffects: cached.disableGlowEffects !== undefined ? cached.disableGlowEffects : (DEFAULT_SETTINGS.disableGlowEffects || false),
    hideAnimatedFrames: cached.hideAnimatedFrames !== undefined ? cached.hideAnimatedFrames : (DEFAULT_SETTINGS.hideAnimatedFrames || false),
    hideKeyboardBadges: cached.hideKeyboardBadges !== undefined ? cached.hideKeyboardBadges : (DEFAULT_SETTINGS.hideKeyboardBadges || false),
    disableSettingsInteractiveGrid: cached.disableSettingsInteractiveGrid !== undefined ? cached.disableSettingsInteractiveGrid : (DEFAULT_SETTINGS.disableSettingsInteractiveGrid || false),
    hidePowerScalingTierBadge: cached.hidePowerScalingTierBadge !== undefined ? cached.hidePowerScalingTierBadge : (DEFAULT_SETTINGS.hidePowerScalingTierBadge || false),

    // Barra de Completitud en Header
    hideCompletenessBar: cached.hideCompletenessBar !== undefined ? cached.hideCompletenessBar : (DEFAULT_SETTINGS.hideCompletenessBar || false),

    // Botón Abrir Ficha Reciente en Header al estar en Dashboard / Tier List
    hideRecentSheetButton: cached.hideRecentSheetButton !== undefined ? cached.hideRecentSheetButton : (DEFAULT_SETTINGS.hideRecentSheetButton || false),
    hideTabFieldCounters: cached.hideTabFieldCounters !== undefined ? cached.hideTabFieldCounters : (DEFAULT_SETTINGS.hideTabFieldCounters || false),

    // Opciones de Tier List y Memoria de Invitados
    persistGuestCharacters: cached.persistGuestCharacters !== undefined ? cached.persistGuestCharacters : (DEFAULT_SETTINGS.persistGuestCharacters !== undefined ? DEFAULT_SETTINGS.persistGuestCharacters : true),
    hideGuestBadge: cached.hideGuestBadge !== undefined ? cached.hideGuestBadge : (DEFAULT_SETTINGS.hideGuestBadge || false),
    hideTemplateBadge: cached.hideTemplateBadge !== undefined ? cached.hideTemplateBadge : (DEFAULT_SETTINGS.hideTemplateBadge || false),
    tierlistShowFrameTemplate: cached.tierlistShowFrameTemplate !== undefined ? cached.tierlistShowFrameTemplate : (DEFAULT_SETTINGS.tierlistShowFrameTemplate !== undefined ? DEFAULT_SETTINGS.tierlistShowFrameTemplate : true),
    tierlistShowFrameRegistered: cached.tierlistShowFrameRegistered !== undefined ? cached.tierlistShowFrameRegistered : (DEFAULT_SETTINGS.tierlistShowFrameRegistered !== undefined ? DEFAULT_SETTINGS.tierlistShowFrameRegistered : true),
    tierlistShowFrameGuest: cached.tierlistShowFrameGuest !== undefined ? cached.tierlistShowFrameGuest : (DEFAULT_SETTINGS.tierlistShowFrameGuest !== undefined ? DEFAULT_SETTINGS.tierlistShowFrameGuest : true),
    tierlistBorderRadiusTemplate: cached.tierlistBorderRadiusTemplate !== undefined ? cached.tierlistBorderRadiusTemplate : (DEFAULT_SETTINGS.tierlistBorderRadiusTemplate !== undefined ? DEFAULT_SETTINGS.tierlistBorderRadiusTemplate : 25),
    tierlistBorderRadiusRegistered: cached.tierlistBorderRadiusRegistered !== undefined ? cached.tierlistBorderRadiusRegistered : (DEFAULT_SETTINGS.tierlistBorderRadiusRegistered !== undefined ? DEFAULT_SETTINGS.tierlistBorderRadiusRegistered : 25),
    tierlistBorderRadiusGuest: cached.tierlistBorderRadiusGuest !== undefined ? cached.tierlistBorderRadiusGuest : (DEFAULT_SETTINGS.tierlistBorderRadiusGuest !== undefined ? DEFAULT_SETTINGS.tierlistBorderRadiusGuest : 25),
    tierlistBorderRadiusSync: cached.tierlistBorderRadiusSync !== undefined ? cached.tierlistBorderRadiusSync : (DEFAULT_SETTINGS.tierlistBorderRadiusSync || false),
    hideTierCharacterCount: cached.hideTierCharacterCount !== undefined ? cached.hideTierCharacterCount : (DEFAULT_SETTINGS.hideTierCharacterCount || false),
    tierlistMemoryExpanded: cached.tierlistMemoryExpanded !== undefined ? cached.tierlistMemoryExpanded : (DEFAULT_SETTINGS.tierlistMemoryExpanded !== undefined ? DEFAULT_SETTINGS.tierlistMemoryExpanded : false),
    faviconEngineExpanded: cached.faviconEngineExpanded !== undefined ? cached.faviconEngineExpanded : (DEFAULT_SETTINGS.faviconEngineExpanded || false),
    dataCenterExpanded: cached.dataCenterExpanded !== undefined ? cached.dataCenterExpanded : (DEFAULT_SETTINGS.dataCenterExpanded !== undefined ? DEFAULT_SETTINGS.dataCenterExpanded : true),
    folderExportExpanded: cached.folderExportExpanded !== undefined ? cached.folderExportExpanded : (DEFAULT_SETTINGS.folderExportExpanded !== undefined ? DEFAULT_SETTINGS.folderExportExpanded : true),
    bootSettingsExpanded: cached.bootSettingsExpanded !== undefined ? cached.bootSettingsExpanded : (DEFAULT_SETTINGS.bootSettingsExpanded !== undefined ? DEFAULT_SETTINGS.bootSettingsExpanded : true),
    iconHierarchyExpanded: cached.iconHierarchyExpanded !== undefined ? cached.iconHierarchyExpanded : (DEFAULT_SETTINGS.iconHierarchyExpanded || false),

    // Arranque del Sistema y Pantalla BIOS
    fastBoot: cached.fastBoot !== undefined ? cached.fastBoot : (DEFAULT_SETTINGS.fastBoot || false),
    showSplashScreen: cached.showSplashScreen !== undefined ? cached.showSplashScreen : (DEFAULT_SETTINGS.showSplashScreen !== undefined ? DEFAULT_SETTINGS.showSplashScreen : true),
    showSplashQuotes: cached.showSplashQuotes !== undefined ? cached.showSplashQuotes : (DEFAULT_SETTINGS.showSplashQuotes !== undefined ? DEFAULT_SETTINGS.showSplashQuotes : true),
    bootSound: cached.bootSound !== undefined ? cached.bootSound : (DEFAULT_SETTINGS.bootSound !== undefined ? DEFAULT_SETTINGS.bootSound : true),
    bootQuotesCategory: cached.bootQuotesCategory || DEFAULT_SETTINGS.bootQuotesCategory || 'minecraft',
    customBootQuotes: cached.customBootQuotes || DEFAULT_SETTINGS.customBootQuotes || [],

    // Historial de Fuentes Personalizadas Escritas
    recentCustomFonts: [],

    // Estado de Placeholders
    showPlaceholders: DEFAULT_SETTINGS.showPlaceholders,
    _placeholderObserver: null,

    // Estado de validación y carga de fuentes
    fontStatus: 'idle', // 'idle' | 'loading' | 'success' | 'error'
    fontStatusMessage: '',
    _fontDebounceTimer: null,
    _lastLoadedFontsKey: '',

    // Kits temáticos
    themeKits: THEME_KITS,

    // Sub-pestaña activa en la pantalla de configuraciones
    activeSubTab: 'identity', // 'identity' | 'presets' | 'environment' | 'emojis' | 'data'

    // Estado de Fondo del Panel Principal (Dashboard)
    dashboardBgMode: 'pattern', // 'pattern' | 'custom' | 'dynamic'
    dashboardBgUrl: '',
    dashboardBgBlur: 0,
    dashboardBgOpacity: 60,
    dashboardBgZoom: 100, // 50 a 250 (%)
    dashboardBgPosX: 50,  // 0 a 100 (%)
    dashboardBgPosY: 50,  // 0 a 100 (%)

    // Estado de Fondo del Creador de Tier List
    tierlistBgMode: 'pattern', // 'pattern' | 'custom'
    tierlistBgUrl: '',
    tierlistBgBlur: 0,
    tierlistBgOpacity: 60,
    tierlistBgZoom: 100, // 50 a 250 (%)
    tierlistBgPosX: 50,  // 0 a 100 (%)
    tierlistBgPosY: 50,  // 0 a 100 (%)

    // ── Submódulos Desacoplados ─────────────────────────────────
    ...createFaviconEngineMethods(),
    ...createThemeDesignerMethods(),
    ...createStorageHealthMethods(),

    init() {
      this.loadGlobalSettings();
      this.loadCustomThemeKits();
      this.loadDashboardBgSettings();
      this.loadTierlistBgSettings();
      this.loadRecentCustomFonts();
      this.initFaviconEngine();
      this.refreshStorageTelemetry();

      const savedPlaceholders = ls.getJSON('superficha_show_placeholders');
      if (savedPlaceholders !== null) {
        this.showPlaceholders = savedPlaceholders;
      }

      let _isInitialEffectRun = true;
      Alpine.effect(() => {
        const _color = this.accentColor;
        const _secColor = this.secondaryColor;
        const _tertColor = this.tertiaryColor;
        const _glowColor = this.glowColor;
        const _glowMode = this.glowMode;
        const _surfColor = this.surfaceColor;
        const _bordColor = this.borderColor;
        const _fDisp = this.fontDisplay;
        const _fBody = this.fontBody;
        const _fInput = this.fontInput;
        const _fHud = this.fontHud;
        const _fTier = this.fontTierlist;
        const _fwDisp = this.fontWeightDisplay;
        const _fwBody = this.fontWeightBody;
        const _fwInput = this.fontWeightInput;
        const _fwHud = this.fontWeightHud;
        const _fwTier = this.fontWeightTierlist;
        const _density = this.density;
        const _cornerStyle = this.cornerStyle;

        this.applySettings();
        if (!_isInitialEffectRun) {
          this.saveGlobalSettingsDebounced();
        }
      });
      _isInitialEffectRun = false;

      this.applySettings();
      this.applyPlaceholderSettings();
    },

    // ── Gestión del Historial de Fuentes Personalizadas ──────────
    recordCustomFont(fontName) {
      if (!fontName || typeof fontName !== 'string') return;
      const clean = fontName.trim();
      if (!clean || clean.length < 2) return;
      const standardPresets = [
        'barlow condensed', 'orbitron', 'teko', 'bebas neue', 'cinzel',
        'inter tight', 'inter', 'roboto', 'open sans', 'eb garamond',
        'jetbrains mono', 'fira code', 'share tech mono', 'source code pro',
        'chakra petch', 'rajdhani', 'titillium web', 'exo 2',
        'sans-serif', 'monospace', 'serif', 'system-ui'
      ];
      if (standardPresets.includes(clean.toLowerCase())) return;

      let recents = (this.recentCustomFonts || []).filter(f => f.toLowerCase() !== clean.toLowerCase());
      recents.unshift(clean);
      if (recents.length > 6) recents = recents.slice(0, 6);
      this.recentCustomFonts = recents;
      this.saveRecentCustomFonts();
    },

    removeRecentCustomFont(fontName) {
      this.recentCustomFonts = (this.recentCustomFonts || []).filter(f => f.toLowerCase() !== (fontName || '').toLowerCase());
      this.saveRecentCustomFonts();
      Alpine.store('app').toast(`Fuente "${fontName}" eliminada del historial.`, 'info');
    },

    clearRecentCustomFonts() {
      this.recentCustomFonts = [];
      this.saveRecentCustomFonts();
      Alpine.store('app').toast('Historial de fuentes personalizadas vaciado.', 'info');
    },

    saveRecentCustomFonts() {
      ls.setJSON('superficha_recent_custom_fonts', this.recentCustomFonts);
    },

    loadRecentCustomFonts() {
      const parsed = ls.getJSON('superficha_recent_custom_fonts');
      if (Array.isArray(parsed)) {
        this.recentCustomFonts = parsed.filter(Boolean);
      }
    },

    // ── Getters de Tematización y WCAG ───────────────────────────
    get contrastInfo() {
      return checkHudContrast(this.accentColor);
    },

    get rgbChannels() {
      const rgb = this.hexToRgb(this.accentColor || DEFAULT_SETTINGS.accentColor);
      return rgb ? `${rgb.r}, ${rgb.g}, ${rgb.b}` : '0, 240, 255';
    },

    get secondaryRgbChannels() {
      const rgb = this.hexToRgb(this.secondaryColor || DEFAULT_SETTINGS.secondaryColor);
      return rgb ? `${rgb.r}, ${rgb.g}, ${rgb.b}` : '255, 0, 119';
    },

    get tertiaryRgbChannels() {
      const rgb = this.hexToRgb(this.tertiaryColor || DEFAULT_SETTINGS.tertiaryColor);
      return rgb ? `${rgb.r}, ${rgb.g}, ${rgb.b}` : '212, 175, 55';
    },

    get surfaceRgbChannels() {
      const rgb = this.hexToRgb(this.surfaceColor || DEFAULT_SETTINGS.surfaceColor);
      return rgb ? `${rgb.r}, ${rgb.g}, ${rgb.b}` : '10, 13, 20';
    },

    get borderRgbChannels() {
      const rgb = this.hexToRgb(this.borderColor || DEFAULT_SETTINGS.borderColor);
      return rgb ? `${rgb.r}, ${rgb.g}, ${rgb.b}` : '34, 42, 54';
    },

    get activeGlowColor() {
      if (this.disableGlowEffects) {
        return '#00000000';
      }
      if (this.glowMode === 'custom' && this.glowColor) {
        return this.glowColor;
      }
      return this.accentColor || DEFAULT_SETTINGS.accentColor;
    },

    get isLightSurface() {
      const surface = this.surfaceColor || DEFAULT_SETTINGS.surfaceColor;
      const rgb = this.hexToRgb(surface);
      if (!rgb) return false;
      const normalize = (val) => {
        const s = val / 255;
        return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
      };
      const lum = 0.2126 * normalize(rgb.r) + 0.7152 * normalize(rgb.g) + 0.0722 * normalize(rgb.b);
      return lum > 0.42; // Detecta blanco puro (#FFF) y tonalidades claras como #BBB7AD (lum ~0.47)
    },

    get scopedThemeStyle() {
      const accent = this.accentColor || DEFAULT_SETTINGS.accentColor;
      const rgb = this.hexToRgb(accent) || { r: 0, g: 240, b: 255 };
      const secondary = this.secondaryColor || DEFAULT_SETTINGS.secondaryColor;
      const secRgb = this.hexToRgb(secondary) || { r: 255, g: 0, b: 119 };
      const tertiary = this.tertiaryColor || DEFAULT_SETTINGS.tertiaryColor;
      const tertRgb = this.hexToRgb(tertiary) || { r: 212, g: 175, b: 55 };
      const surface = this.surfaceColor || DEFAULT_SETTINGS.surfaceColor;
      const surfRgb = this.hexToRgb(surface) || { r: 10, g: 13, b: 20 };
      const border = this.borderColor || DEFAULT_SETTINGS.borderColor;
      const bordRgb = this.hexToRgb(border) || { r: 34, g: 42, b: 54 };
      let glowRgba = this.disableGlowEffects ? 'transparent' : `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.35)`;
      if (!this.disableGlowEffects && this.glowMode === 'custom' && this.glowColor) {
        const glowRgb = this.hexToRgb(this.glowColor) || rgb;
        glowRgba = `rgba(${glowRgb.r}, ${glowRgb.g}, ${glowRgb.b}, 0.45)`;
      }
      const secGlow = this.disableGlowEffects ? 'transparent' : `rgba(${secRgb.r}, ${secRgb.g}, ${secRgb.b}, 0.35)`;
      const tertGlow = this.disableGlowEffects ? 'transparent' : `rgba(${tertRgb.r}, ${tertRgb.g}, ${tertRgb.b}, 0.35)`;
      const glowLg = this.disableGlowEffects ? 'transparent' : `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.12)`;

      const fDisplay = `"${(this.fontDisplay || 'Barlow Condensed').trim()}", "Barlow Condensed", sans-serif`;
      const fBody = `"${(this.fontBody || 'Inter Tight').trim()}", "Inter Tight", sans-serif`;
      const fInput = `"${(this.fontInput || 'JetBrains Mono').trim()}", "JetBrains Mono", monospace`;
      const fHud = `"${(this.fontHud || 'Chakra Petch').trim()}", "Chakra Petch", sans-serif`;
      const fTierlist = `"${(this.fontTierlist || 'Barlow Condensed').trim()}", "Barlow Condensed", sans-serif`;

      const isLight = this.isLightSurface;
      const textPrimary = isLight ? '#0B0F19' : '#FFFFFF';
      const textSecondary = isLight ? 'rgba(11, 15, 25, 0.75)' : 'rgba(255, 255, 255, 0.70)';
      const textMuted = isLight ? 'rgba(11, 15, 25, 0.50)' : 'rgba(255, 255, 255, 0.38)';
      const bWidth = `${this.borderWidth || 1}px`;

      return `--accent-primary:${accent};--accent-primary-rgb:${rgb.r},${rgb.g},${rgb.b};--accent:${accent};--accent-secondary:${secondary};--accent-secondary-rgb:${secRgb.r},${secRgb.g},${secRgb.b};--accent-tertiary:${tertiary};--accent-tertiary-rgb:${tertRgb.r},${tertRgb.g},${tertRgb.b};--accent-dim:rgba(${rgb.r},${rgb.g},${rgb.b},0.18);--accent-secondary-dim:rgba(${secRgb.r},${secRgb.g},${secRgb.b},0.18);--accent-tertiary-dim:rgba(${tertRgb.r},${tertRgb.g},${tertRgb.b},0.18);--accent-glow:${glowRgba};--accent-secondary-glow:${secGlow};--accent-tertiary-glow:${tertGlow};--accent-glow-lg:${glowLg};--border-accent:rgba(${rgb.r},${rgb.g},${rgb.b},0.25);--border-secondary:rgba(${secRgb.r},${secRgb.g},${secRgb.b},0.35);--border-tertiary:rgba(${tertRgb.r},${tertRgb.g},${tertRgb.b},0.35);--border-strong:rgba(${rgb.r},${rgb.g},${rgb.b},0.55);--border-custom:${border};--border-custom-rgb:${bordRgb.r},${bordRgb.g},${bordRgb.b};--border-subtle:rgba(${bordRgb.r},${bordRgb.g},${bordRgb.b},0.45);--border-panel:${border};--border-width:${bWidth};--bg-panel-custom:${surface};--bg-panel-rgb:${surfRgb.r},${surfRgb.g},${surfRgb.b};--bg-panel:rgba(${surfRgb.r},${surfRgb.g},${surfRgb.b},0.95);--bg-panel-2:rgba(${Math.min(255,surfRgb.r+7)},${Math.min(255,surfRgb.g+8)},${Math.min(255,surfRgb.b+11)},0.96);--bg-panel-3:rgba(${Math.min(255,surfRgb.r+14)},${Math.min(255,surfRgb.g+16)},${Math.min(255,surfRgb.b+22)},0.98);--bg-base:${surface};--text-primary:${textPrimary};--text-secondary:${textSecondary};--text-muted:${textMuted};--gradient-accent:linear-gradient(135deg,${accent} 0%,${secondary} 100%);--gradient-accent-h:linear-gradient(90deg,${accent} 0%,${secondary} 100%);--gradient-accent-tri:linear-gradient(90deg,${accent} 0%,${secondary} 50%,${tertiary} 100%);--font-display:${fDisplay};--font-body:${fBody};--font-input:${fInput};--font-hud:${fHud};--font-tierlist:${fTierlist};--font-weight-display:${this.fontWeightDisplay || '700'};--font-weight-body:${this.fontWeightBody || '400'};--font-weight-input:${this.fontWeightInput || '400'};--font-weight-hud:${this.fontWeightHud || '600'};--font-weight-tierlist:${this.fontWeightTierlist || '900'};`;
    },

    get filteredThemeKits() {
      let kits = [];
      if (this.kitCategoryFilter === 'system') {
        kits = [...(this.themeKits || [])];
      } else if (this.kitCategoryFilter === 'custom') {
        kits = [...(this.customThemeKits || [])];
      } else {
        kits = [...(this.themeKits || []), ...(this.customThemeKits || [])];
      }

      if (!this.kitSearchQuery?.trim()) {
        return kits;
      }

      const q = this.kitSearchQuery.toLowerCase().trim();
      return kits.filter(k => {
        const name = (k.name || '').toLowerCase();
        const fontDisp = (k.fontDisplay || '').toLowerCase();
        const fontBody = (k.fontBody || '').toLowerCase();
        const fontInput = (k.fontInput || '').toLowerCase();
        const fontHud = (k.fontHud || '').toLowerCase();
        const fontTier = (k.fontTierlist || '').toLowerCase();
        return name.includes(q) || fontDisp.includes(q) || fontBody.includes(q) || fontInput.includes(q) || fontHud.includes(q) || fontTier.includes(q);
      });
    },

    // ── Carga y Persistencia Global ──────────────────────────────
    _applySettingsObject(saved) {
      if (!saved || typeof saved !== 'object') return;
      if (saved.accentColor) this.accentColor = saved.accentColor;
      if (saved.secondaryColor) this.secondaryColor = saved.secondaryColor;
      if (saved.tertiaryColor) this.tertiaryColor = saved.tertiaryColor;
      if (saved.glowColor) this.glowColor = saved.glowColor;
      if (saved.glowMode) this.glowMode = saved.glowMode;
      if (saved.surfaceColor) this.surfaceColor = saved.surfaceColor;
      if (saved.borderColor) this.borderColor = saved.borderColor;
      if (saved.borderWidth) this.borderWidth = parseInt(saved.borderWidth, 10) || 1;

      if (saved.fontDisplay) this.fontDisplay = saved.fontDisplay;
      if (saved.fontBody) this.fontBody = saved.fontBody;
      if (saved.fontInput) this.fontInput = saved.fontInput;
      if (saved.fontHud) this.fontHud = saved.fontHud;
      if (saved.fontTierlist) this.fontTierlist = saved.fontTierlist;

      if (saved.fontWeightDisplay) this.fontWeightDisplay = saved.fontWeightDisplay;
      if (saved.fontWeightBody) this.fontWeightBody = saved.fontWeightBody;
      if (saved.fontWeightInput) this.fontWeightInput = saved.fontWeightInput;
      if (saved.fontWeightHud) this.fontWeightHud = saved.fontWeightHud;
      if (saved.fontWeightTierlist) this.fontWeightTierlist = saved.fontWeightTierlist;

      if (saved.density) this.density = saved.density;
      if (saved.cornerStyle !== undefined) this.cornerStyle = saved.cornerStyle;
      if (saved.kitId !== undefined) this.kitId = saved.kitId;

      if (saved.hideAllIcons !== undefined) this.hideAllIcons = saved.hideAllIcons;
      if (saved.hideIconsH1 !== undefined) this.hideIconsH1 = saved.hideIconsH1;
      if (saved.hideIconsH2 !== undefined) this.hideIconsH2 = saved.hideIconsH2;
      if (saved.hideIconsH3 !== undefined) this.hideIconsH3 = saved.hideIconsH3;
      if (saved.hideIconsLabels !== undefined) this.hideIconsLabels = saved.hideIconsLabels;
      if (saved.hideCompletenessBar !== undefined) this.hideCompletenessBar = saved.hideCompletenessBar;
      if (saved.hideRecentSheetButton !== undefined) this.hideRecentSheetButton = saved.hideRecentSheetButton;
      if (saved.hideTabFieldCounters !== undefined) this.hideTabFieldCounters = saved.hideTabFieldCounters;
      if (saved.disableCustomColors !== undefined) this.disableCustomColors = saved.disableCustomColors;
      if (saved.disableGlowEffects !== undefined) this.disableGlowEffects = saved.disableGlowEffects;
      if (saved.hideAnimatedFrames !== undefined) this.hideAnimatedFrames = saved.hideAnimatedFrames;
      if (saved.hideKeyboardBadges !== undefined) this.hideKeyboardBadges = saved.hideKeyboardBadges;
      if (saved.disableSettingsInteractiveGrid !== undefined) this.disableSettingsInteractiveGrid = saved.disableSettingsInteractiveGrid;
      if (saved.hidePowerScalingTierBadge !== undefined) this.hidePowerScalingTierBadge = saved.hidePowerScalingTierBadge;
      if (saved.persistGuestCharacters !== undefined) this.persistGuestCharacters = saved.persistGuestCharacters;
      if (saved.hideGuestBadge !== undefined) this.hideGuestBadge = saved.hideGuestBadge;
      if (saved.hideTemplateBadge !== undefined) this.hideTemplateBadge = saved.hideTemplateBadge;
      if (saved.tierlistShowFrameTemplate !== undefined) this.tierlistShowFrameTemplate = saved.tierlistShowFrameTemplate;
      if (saved.tierlistShowFrameRegistered !== undefined) this.tierlistShowFrameRegistered = saved.tierlistShowFrameRegistered;
      if (saved.tierlistShowFrameGuest !== undefined) this.tierlistShowFrameGuest = saved.tierlistShowFrameGuest;
      if (saved.tierlistBorderRadiusTemplate !== undefined) this.tierlistBorderRadiusTemplate = saved.tierlistBorderRadiusTemplate;
      if (saved.tierlistBorderRadiusRegistered !== undefined) this.tierlistBorderRadiusRegistered = saved.tierlistBorderRadiusRegistered;
      if (saved.tierlistBorderRadiusGuest !== undefined) this.tierlistBorderRadiusGuest = saved.tierlistBorderRadiusGuest;
      if (saved.tierlistBorderRadiusSync !== undefined) this.tierlistBorderRadiusSync = saved.tierlistBorderRadiusSync;
      if (saved.hideTierCharacterCount !== undefined) this.hideTierCharacterCount = saved.hideTierCharacterCount;
      if (saved.tierlistMemoryExpanded !== undefined) this.tierlistMemoryExpanded = saved.tierlistMemoryExpanded;
      if (saved.faviconEngineExpanded !== undefined) this.faviconEngineExpanded = saved.faviconEngineExpanded;
      if (saved.dataCenterExpanded !== undefined) this.dataCenterExpanded = saved.dataCenterExpanded;
      if (saved.folderExportExpanded !== undefined) this.folderExportExpanded = saved.folderExportExpanded;
      if (saved.bootSettingsExpanded !== undefined) this.bootSettingsExpanded = saved.bootSettingsExpanded;
      if (saved.iconHierarchyExpanded !== undefined) this.iconHierarchyExpanded = saved.iconHierarchyExpanded;

      if (saved.fastBoot !== undefined) this.fastBoot = saved.fastBoot;
      if (saved.showSplashScreen !== undefined) this.showSplashScreen = saved.showSplashScreen;
      if (saved.showSplashQuotes !== undefined) this.showSplashQuotes = saved.showSplashQuotes;
      if (saved.bootSound !== undefined) this.bootSound = saved.bootSound;
      if (saved.bootQuotesCategory !== undefined) this.bootQuotesCategory = saved.bootQuotesCategory === 'mafalda' ? 'minecraft' : saved.bootQuotesCategory;
      if (saved.customBootQuotes !== undefined) this.customBootQuotes = saved.customBootQuotes;
    },

    async loadGlobalSettings() {
      try {
        const savedLs = ls.getJSON('superficha_global_settings') || {};
        this._applySettingsObject(savedLs);

        try {
          const metaSaved = await db.meta.get('global_settings');
          if (metaSaved?.value && typeof metaSaved.value === 'object') {
            const merged = Object.assign({}, metaSaved.value, savedLs);
            this._applySettingsObject(merged);
            const serializedMerged = JSON.parse(JSON.stringify(merged));
            await db.meta.put({ key: 'global_settings', value: serializedMerged });
          } else if (Object.keys(savedLs).length > 0) {
            const serializedSavedLs = JSON.parse(JSON.stringify(savedLs));
            await db.meta.put({ key: 'global_settings', value: serializedSavedLs });
          }
        } catch { }
      } catch (e) {
        console.warn('[settings] Error al cargar configuraciones globales:', e);
      }
    },

    _saveTimer: null,
    saveGlobalSettingsDebounced() {
      if (this._saveTimer) clearTimeout(this._saveTimer);
      this._saveTimer = setTimeout(() => {
        this.saveGlobalSettings();
      }, 300);
    },

    async saveGlobalSettings() {
      try {
        const toSave = {
          accentColor: this.accentColor,
          secondaryColor: this.secondaryColor,
          tertiaryColor: this.tertiaryColor,
          glowColor: this.glowColor,
          glowMode: this.glowMode,
          surfaceColor: this.surfaceColor,
          borderColor: this.borderColor,
          borderWidth: this.borderWidth,
          fontDisplay: this.fontDisplay,
          fontBody: this.fontBody,
          fontInput: this.fontInput,
          fontHud: this.fontHud,
          fontTierlist: this.fontTierlist,
          fontWeightDisplay: this.fontWeightDisplay,
          fontWeightBody: this.fontWeightBody,
          fontWeightInput: this.fontWeightInput,
          fontWeightHud: this.fontWeightHud,
          fontWeightTierlist: this.fontWeightTierlist,
          density: this.density,
          cornerStyle: this.cornerStyle,
          kitId: this.kitId,
          hideAllIcons: this.hideAllIcons,
          hideIconsH1: this.hideIconsH1,
          hideIconsH2: this.hideIconsH2,
          hideIconsH3: this.hideIconsH3,
          hideIconsLabels: this.hideIconsLabels,
          hideCompletenessBar: this.hideCompletenessBar,
          hideRecentSheetButton: this.hideRecentSheetButton,
          hideTabFieldCounters: this.hideTabFieldCounters,
          disableCustomColors: this.disableCustomColors,
          disableGlowEffects: this.disableGlowEffects,
          hideAnimatedFrames: this.hideAnimatedFrames,
          hideKeyboardBadges: this.hideKeyboardBadges,
          disableSettingsInteractiveGrid: this.disableSettingsInteractiveGrid,
          hidePowerScalingTierBadge: this.hidePowerScalingTierBadge,
          persistGuestCharacters: this.persistGuestCharacters,
          hideGuestBadge: this.hideGuestBadge,
          hideTemplateBadge: this.hideTemplateBadge,
          tierlistShowFrameTemplate: this.tierlistShowFrameTemplate,
          tierlistShowFrameRegistered: this.tierlistShowFrameRegistered,
          tierlistShowFrameGuest: this.tierlistShowFrameGuest,
          tierlistBorderRadiusTemplate: this.tierlistBorderRadiusTemplate,
          tierlistBorderRadiusRegistered: this.tierlistBorderRadiusRegistered,
          tierlistBorderRadiusGuest: this.tierlistBorderRadiusGuest,
          tierlistBorderRadiusSync: this.tierlistBorderRadiusSync,
          hideTierCharacterCount: this.hideTierCharacterCount,
          tierlistMemoryExpanded: this.tierlistMemoryExpanded,
          faviconEngineExpanded: this.faviconEngineExpanded,
          dataCenterExpanded: this.dataCenterExpanded,
          folderExportExpanded: this.folderExportExpanded,
          bootSettingsExpanded: this.bootSettingsExpanded,
          iconHierarchyExpanded: this.iconHierarchyExpanded,
          fastBoot: this.fastBoot,
          showSplashScreen: this.showSplashScreen,
          showSplashQuotes: this.showSplashQuotes,
          bootSound: this.bootSound,
          bootQuotesCategory: this.bootQuotesCategory,
          customBootQuotes: this.customBootQuotes,
        };
        const raw = window.Alpine?.raw ? window.Alpine.raw(toSave) : toSave;
        const serialized = JSON.parse(JSON.stringify(raw));
        ls.setJSON('superficha_global_settings', serialized);
        await db.meta.put({ key: 'global_settings', value: serialized });
      } catch (e) {
        console.warn('[settings] Error al guardar configuraciones globales:', e);
      }
    },



    syncFromCharacter(char) {},
    syncToCharacter() {},

    // ── Control de Vista de Configuraciones (Pantalla Completa) ─────────
    openModal(subTab = null) {
      if (subTab && ['identity', 'presets', 'environment', 'emojis', 'data', 'extras'].includes(subTab)) {
        this.activeSubTab = subTab;
      }
      this.preloadAllKitFonts();
      Alpine.store('app')?.openSettingsView?.(subTab);
      setTimeout(() => {
        if (typeof window !== 'undefined' && window.lucide?.createIcons) {
          window.lucide.createIcons();
        }
      }, 60);
    },

    setSubTab(subTab) {
      if (['identity', 'presets', 'environment', 'emojis', 'data', 'extras'].includes(subTab)) {
        this.activeSubTab = subTab;
        Alpine.store('app')?.saveNavigationState?.();
        setTimeout(() => {
          if (typeof window !== 'undefined' && window.lucide?.createIcons) {
            window.lucide.createIcons();
          }
        }, 50);
      }
    },

    closeModal() {
      if (Alpine.store('app')?.activeView !== 'settings') return;
      try {
        this.saveGlobalSettings();
      } catch (e) {
        console.warn('[settings] Error saving settings on close:', e);
      }
      Alpine.store('app')?.closeSettingsView?.();
    },

    applyAndCloseModal() {
      try {
        this.saveGlobalSettings();
        this.applySettings();
      } catch (e) {
        console.warn('[settings] Error applying settings on close:', e);
      }
      Alpine.store('app')?.closeSettingsView?.();
      Alpine.store('app')?.toast?.('Configuración visual global aplicada.', 'success');
    },

    forceCloseAllModals() {
      this.showDesignerModal = false;
      this.showExportKitModal = false;
      this.showImportKitModal = false;
    },

    saveAsGlobalDefault() {
      this.saveGlobalSettings();
      Alpine.store('app').toast('Configuración global guardada.', 'success');
    },

    // ── Restablecimiento a Valores por Defecto ───────────────────
    async resetToDefault() {
      this.accentColor = DEFAULT_SETTINGS.accentColor;
      this.secondaryColor = DEFAULT_SETTINGS.secondaryColor;
      this.tertiaryColor = DEFAULT_SETTINGS.tertiaryColor;
      this.glowColor = DEFAULT_SETTINGS.glowColor;
      this.glowMode = DEFAULT_SETTINGS.glowMode;
      this.surfaceColor = DEFAULT_SETTINGS.surfaceColor;
      this.borderColor = DEFAULT_SETTINGS.borderColor;
      this.borderWidth = DEFAULT_SETTINGS.borderWidth || 1;

      this.fontDisplay = DEFAULT_SETTINGS.fontDisplay;
      this.fontBody = DEFAULT_SETTINGS.fontBody;
      this.fontInput = DEFAULT_SETTINGS.fontInput;
      this.fontHud = DEFAULT_SETTINGS.fontHud;
      this.fontTierlist = DEFAULT_SETTINGS.fontTierlist;

      this.fontWeightDisplay = DEFAULT_SETTINGS.fontWeightDisplay;
      this.fontWeightBody = DEFAULT_SETTINGS.fontWeightBody;
      this.fontWeightInput = DEFAULT_SETTINGS.fontWeightInput;
      this.fontWeightHud = DEFAULT_SETTINGS.fontWeightHud;
      this.fontWeightTierlist = DEFAULT_SETTINGS.fontWeightTierlist;

      this.density = DEFAULT_SETTINGS.density;
      this.kitId = '';

      this.hideAllIcons = DEFAULT_SETTINGS.hideAllIcons;
      this.hideIconsH1 = DEFAULT_SETTINGS.hideIconsH1;
      this.hideIconsH2 = DEFAULT_SETTINGS.hideIconsH2;
      this.hideIconsH3 = DEFAULT_SETTINGS.hideIconsH3;
      this.hideIconsLabels = DEFAULT_SETTINGS.hideIconsLabels;
      this.hideCompletenessBar = DEFAULT_SETTINGS.hideCompletenessBar;
      this.hideRecentSheetButton = DEFAULT_SETTINGS.hideRecentSheetButton;
      this.hideTabFieldCounters = DEFAULT_SETTINGS.hideTabFieldCounters;
      this.disableCustomColors = DEFAULT_SETTINGS.disableCustomColors;
      this.persistGuestCharacters = DEFAULT_SETTINGS.persistGuestCharacters;
      this.hideGuestBadge = DEFAULT_SETTINGS.hideGuestBadge;
      this.hideTemplateBadge = DEFAULT_SETTINGS.hideTemplateBadge;
      this.tierlistShowFrameTemplate = DEFAULT_SETTINGS.tierlistShowFrameTemplate;
      this.tierlistShowFrameRegistered = DEFAULT_SETTINGS.tierlistShowFrameRegistered;
      this.tierlistShowFrameGuest = DEFAULT_SETTINGS.tierlistShowFrameGuest;
      this.tierlistBorderRadiusTemplate = DEFAULT_SETTINGS.tierlistBorderRadiusTemplate;
      this.tierlistBorderRadiusRegistered = DEFAULT_SETTINGS.tierlistBorderRadiusRegistered;
      this.tierlistBorderRadiusGuest = DEFAULT_SETTINGS.tierlistBorderRadiusGuest;
      this.tierlistBorderRadiusSync = DEFAULT_SETTINGS.tierlistBorderRadiusSync;
      this.hideTierCharacterCount = DEFAULT_SETTINGS.hideTierCharacterCount;
      this.tierlistMemoryExpanded = DEFAULT_SETTINGS.tierlistMemoryExpanded;
      this.faviconEngineExpanded = DEFAULT_SETTINGS.faviconEngineExpanded;
      this.dataCenterExpanded = DEFAULT_SETTINGS.dataCenterExpanded;
      this.folderExportExpanded = DEFAULT_SETTINGS.folderExportExpanded;
      this.bootSettingsExpanded = DEFAULT_SETTINGS.bootSettingsExpanded;
      this.iconHierarchyExpanded = DEFAULT_SETTINGS.iconHierarchyExpanded;

      await this.saveGlobalSettings();
      this.applySettings();
      Alpine.store('app').toast('Configuración visual restablecida a valores por defecto.', 'info');
    },

    // ── Opciones de Memoria y Apariencia de Tier List ─────────────
    setTierlistBorderRadius(category, radius) {
      const val = Math.max(0, Math.min(50, Math.round(Number(radius) || 0)));
      if (this.tierlistBorderRadiusSync || category === 'all') {
        this.tierlistBorderRadiusTemplate = val;
        this.tierlistBorderRadiusRegistered = val;
        this.tierlistBorderRadiusGuest = val;
      } else if (category === 'template') {
        this.tierlistBorderRadiusTemplate = val;
      } else if (category === 'guest') {
        this.tierlistBorderRadiusGuest = val;
      } else {
        this.tierlistBorderRadiusRegistered = val;
      }
      this.saveGlobalSettings();
    },

    getTierlistBorderRadius(category) {
      if (category === 'template') return this.tierlistBorderRadiusTemplate ?? 25;
      if (category === 'guest') return this.tierlistBorderRadiusGuest ?? 25;
      return this.tierlistBorderRadiusRegistered ?? 25;
    },

    toggleTierlistBorderRadiusSync() {
      this.tierlistBorderRadiusSync = !this.tierlistBorderRadiusSync;
      if (this.tierlistBorderRadiusSync) {
        const refVal = this.tierlistBorderRadiusRegistered ?? 25;
        this.tierlistBorderRadiusTemplate = refVal;
        this.tierlistBorderRadiusGuest = refVal;
      }
      this.saveGlobalSettings();
      Alpine.store('app')?.toast?.(
        this.tierlistBorderRadiusSync
          ? 'Curvatura vinculada: Se aplicará el mismo formato a las tres categorías.'
          : 'Curvatura independiente por categoría desvinculada.',
        'info'
      );
    },

    toggleHideTierCharacterCount() {
      this.hideTierCharacterCount = !this.hideTierCharacterCount;
      this.saveGlobalSettings();
      Alpine.store('app')?.toast?.(
        this.hideTierCharacterCount
          ? 'Contadores de operativos por rango ocultos («0 OP»).'
          : 'Contadores de operativos por rango visibles («0 OP»).',
        'info'
      );
    },

    togglePersistGuestCharacters() {
      this.persistGuestCharacters = !this.persistGuestCharacters;
      this.saveGlobalSettings();
      const tierlistStore = Alpine.store('tierlist');
      if (tierlistStore && typeof tierlistStore.saveState === 'function') {
        tierlistStore.saveState();
      }
      Alpine.store('app')?.toast?.(
        this.persistGuestCharacters
          ? 'Memoria persistente activada: Los personajes temporales se guardarán en el almacenamiento local.'
          : 'Memoria de sesión: Los personajes temporales solo existirán mientras la pestaña esté abierta.',
        'info'
      );
    },

    toggleHideGuestBadge() {
      this.hideGuestBadge = !this.hideGuestBadge;
      this.saveGlobalSettings();
      Alpine.store('app')?.toast?.(
        this.hideGuestBadge
          ? 'Marco diferenciador de invitados desactivado (sin distintivo morado).'
          : 'Marco diferenciador de invitados activado (con distintivo morado).',
        'info'
      );
    },

    toggleHideTemplateBadge() {
      this.hideTemplateBadge = !this.hideTemplateBadge;
      this.saveGlobalSettings();
      Alpine.store('app')?.toast?.(
        this.hideTemplateBadge
          ? 'Marco diferenciador de plantilla desactivado (sin distintivo dorado).'
          : 'Marco diferenciador de plantilla activado (con distintivo dorado).',
        'info'
      );
    },

    toggleTierlistShowFrameTemplate() {
      this.tierlistShowFrameTemplate = !this.tierlistShowFrameTemplate;
      this.saveGlobalSettings();
      Alpine.store('app')?.toast?.(
        this.tierlistShowFrameTemplate
          ? 'Marco del sistema activado para personajes de plantilla.'
          : 'Marco del sistema deshabilitado para personajes de plantilla (modo limpio).',
        'info'
      );
    },

    toggleTierlistShowFrameRegistered() {
      this.tierlistShowFrameRegistered = !this.tierlistShowFrameRegistered;
      this.saveGlobalSettings();
      Alpine.store('app')?.toast?.(
        this.tierlistShowFrameRegistered
          ? 'Marco del sistema activado para personajes con ficha.'
          : 'Marco del sistema deshabilitado para personajes con ficha (modo limpio).',
        'info'
      );
    },

    toggleTierlistShowFrameGuest() {
      this.tierlistShowFrameGuest = !this.tierlistShowFrameGuest;
      this.saveGlobalSettings();
      Alpine.store('app')?.toast?.(
        this.tierlistShowFrameGuest
          ? 'Marco del sistema activado para personajes invitados.'
          : 'Marco del sistema deshabilitado para personajes invitados (modo limpio).',
        'info'
      );
    },

    toggleTierlistMemoryExpanded() {
      this.tierlistMemoryExpanded = !this.tierlistMemoryExpanded;
      this.saveGlobalSettings();
    },

    toggleFaviconEngineExpanded() {
      this.faviconEngineExpanded = !this.faviconEngineExpanded;
      this.saveGlobalSettings();
    },

    toggleDataCenterExpanded() {
      this.dataCenterExpanded = !this.dataCenterExpanded;
      this.saveGlobalSettings();
      setTimeout(() => window.lucide?.createIcons?.(), 50);
    },

    toggleFolderExportExpanded() {
      this.folderExportExpanded = !this.folderExportExpanded;
      this.saveGlobalSettings();
      setTimeout(() => window.lucide?.createIcons?.(), 50);
    },

    toggleBootSettingsExpanded() {
      this.bootSettingsExpanded = !this.bootSettingsExpanded;
      this.saveGlobalSettings();
      setTimeout(() => window.lucide?.createIcons?.(), 50);
    },

    toggleIconHierarchyExpanded() {
      this.iconHierarchyExpanded = !this.iconHierarchyExpanded;
      this.saveGlobalSettings();
      setTimeout(() => window.lucide?.createIcons?.(), 50);
    },

    // ── Métodos de Arranque del Sistema, BIOS y Splash Screen ──────
    toggleFastBoot() {
      this.fastBoot = !this.fastBoot;
      this.showSplashScreen = !this.fastBoot;
      if (typeof document !== 'undefined') {
        if (this.showSplashScreen) {
          document.documentElement.classList.remove('no-splash');
        } else {
          document.documentElement.classList.add('no-splash');
        }
      }
      this.saveGlobalSettings();
      Alpine.store('app')?.toast?.(
        this.fastBoot
          ? 'Arranque rápido activado: La pantalla BIOS se omitirá al cargar.'
          : 'Arranque estándar activado: La pantalla BIOS se mostrará al cargar.',
        'info'
      );
    },

    toggleSplashScreen() {
      this.showSplashScreen = !this.showSplashScreen;
      this.fastBoot = !this.showSplashScreen;
      if (typeof document !== 'undefined' && document.documentElement) {
        if (this.showSplashScreen) {
          document.documentElement.classList.remove('boot-mode-generic');
          document.documentElement.classList.add('boot-mode-bios');
        } else {
          document.documentElement.classList.remove('boot-mode-bios');
          document.documentElement.classList.add('boot-mode-generic');
        }
      }
      this.saveGlobalSettings();
      Alpine.store('app')?.toast?.(
        this.showSplashScreen
          ? 'Pantalla de arranque Retro BIOS activada.'
          : 'Pantalla de carga genérica 3D activada.',
        'info'
      );
    },

    toggleBootSound() {
      this.bootSound = !this.bootSound;
      this.saveGlobalSettings();
      Alpine.store('app')?.toast?.(
        this.bootSound
          ? 'Altavoz de arranque activado (Beep POST 890Hz).'
          : 'Altavoz de arranque silenciado.',
        'info'
      );
    },

    // ── Métodos de Visibilidad de Íconos y Modo Monocromático ────
    toggleHideAllIcons() {
      this.hideAllIcons = !this.hideAllIcons;
      this.hideIconsH1 = this.hideAllIcons;
      this.hideIconsH2 = this.hideAllIcons;
      this.hideIconsH3 = this.hideAllIcons;
      this.hideIconsLabels = this.hideAllIcons;
      this.applySettings();
      this.saveGlobalSettings();
      Alpine.store('app').toast(
        this.hideAllIcons ? 'Íconos deshabilitados en toda la aplicación.' : 'Íconos habilitados.',
        'info'
      );
    },

    toggleHideIconsH1() {
      this.hideIconsH1 = !this.hideIconsH1;
      this._syncMasterIconState();
      this.applySettings();
      this.saveGlobalSettings();
    },

    toggleHideIconsH2() {
      this.hideIconsH2 = !this.hideIconsH2;
      this._syncMasterIconState();
      this.applySettings();
      this.saveGlobalSettings();
    },

    toggleHideIconsH3() {
      this.hideIconsH3 = !this.hideIconsH3;
      this._syncMasterIconState();
      this.applySettings();
      this.saveGlobalSettings();
    },

    toggleHideIconsLabels() {
      this.hideIconsLabels = !this.hideIconsLabels;
      this._syncMasterIconState();
      this.applySettings();
      this.saveGlobalSettings();
    },

    _syncMasterIconState() {
      this.hideAllIcons = !!(this.hideIconsH1 && this.hideIconsH2 && this.hideIconsH3 && this.hideIconsLabels);
    },

    toggleDisableCustomColors() {
      this.disableCustomColors = !this.disableCustomColors;
      this.applySettings();
      this.saveGlobalSettings();
      Alpine.store('app').toast(
        this.disableCustomColors ? 'Modo Monocromático activo (colores neutros en títulos y etiquetas).' : 'Colores temáticos restaurados.',
        'info'
      );
    },

    toggleHideCompletenessBar() {
      this.hideCompletenessBar = !this.hideCompletenessBar;
      this.saveGlobalSettings();
      Alpine.store('app')?.toast?.(
        this.hideCompletenessBar ? 'Barra de completitud deshabilitada.' : 'Barra de completitud habilitada.',
        'info'
      );
    },

    toggleHideRecentSheetButton() {
      this.hideRecentSheetButton = !this.hideRecentSheetButton;
      this.saveGlobalSettings();
      Alpine.store('app')?.toast?.(
        this.hideRecentSheetButton ? 'Acceso rápido a ficha reciente deshabilitado.' : 'Acceso rápido a ficha reciente habilitado.',
        'info'
      );
    },


    toggleDisableGlowEffects() {
      this.disableGlowEffects = !this.disableGlowEffects;
      this.saveGlobalSettings();
      this._syncDocumentThemeClasses();
      Alpine.store('app')?.toast?.(
        this.disableGlowEffects ? 'Resplandores neón deshabilitados (modo mate).' : 'Resplandores neón activados.',
        'info'
      );
    },

    toggleHideAnimatedFrames() {
      this.hideAnimatedFrames = !this.hideAnimatedFrames;
      this.saveGlobalSettings();
      this._syncDocumentThemeClasses();
      Alpine.store('app')?.toast?.(
        this.hideAnimatedFrames ? 'Marcos animados de Steam ocultos.' : 'Marcos animados de Steam visibles.',
        'info'
      );
    },

    toggleHideKeyboardBadges() {
      this.hideKeyboardBadges = !this.hideKeyboardBadges;
      this.saveGlobalSettings();
      this._syncDocumentThemeClasses();
      Alpine.store('app')?.toast?.(
        this.hideKeyboardBadges ? 'Insignias de atajos de teclado ocultas.' : 'Insignias de atajos de teclado visibles.',
        'info'
      );
    },

        toggleHidePowerScalingTierBadge() {
      this.hidePowerScalingTierBadge = !this.hidePowerScalingTierBadge;
      this.saveSettings();
      Alpine.store('app')?.toast?.(
        this.hidePowerScalingTierBadge
          ? 'Insignia de Tier de Power Scaling oculta en las tarjetas de personajes.'
          : 'Insignia de Tier de Power Scaling visible en las tarjetas de personajes.',
        'info'
      );
    },

    toggleDisableSettingsInteractiveGrid() {
      this.disableSettingsInteractiveGrid = !this.disableSettingsInteractiveGrid;
      this.saveGlobalSettings();
      if (this.disableSettingsInteractiveGrid) {
        window.settingsInteractiveGrid?.sleep();
      } else {
        window.settingsInteractiveGrid?.updateMetrics();
        window.settingsInteractiveGrid?.wakeUp();
      }
      Alpine.store('app')?.toast?.(
        this.disableSettingsInteractiveGrid ? 'Fondo estático en Ajustes activado.' : 'Fondo interactivo en Ajustes activado.',
        'info'
      );
    },

    _syncDocumentThemeClasses() {
      if (typeof document === 'undefined') return;
      document.body.classList.toggle('hide-steam-frames', !!this.hideAnimatedFrames);
      document.body.classList.toggle('hide-kbd-badges', !!this.hideKeyboardBadges);
      document.body.classList.toggle('no-glow-effects', !!this.disableGlowEffects);
    },
    toggleHideTabFieldCounters() {
      this.hideTabFieldCounters = !this.hideTabFieldCounters;
      this.saveGlobalSettings();
      Alpine.store('app')?.toast?.(
        this.hideTabFieldCounters ? 'Contadores de campos en secciones deshabilitados.' : 'Contadores de campos en secciones habilitados.',
        'info'
      );
    },

    resetColor() {
      this.accentColor = DEFAULT_SETTINGS.accentColor;
      this.applySettings();
      Alpine.store('app').toast('Color de acento principal restablecido.', 'info');
    },

    resetSecondaryColor() {
      this.secondaryColor = DEFAULT_SETTINGS.secondaryColor;
      this.applySettings();
      Alpine.store('app').toast('Color secundario restablecido.', 'info');
    },

    resetTertiaryColor() {
      this.tertiaryColor = DEFAULT_SETTINGS.tertiaryColor;
      this.applySettings();
      Alpine.store('app').toast('Color terciario restablecido.', 'info');
    },

    resetSurfaceColor() {
      this.surfaceColor = DEFAULT_SETTINGS.surfaceColor;
      this.applySettings();
      Alpine.store('app').toast('Color de superficie restablecido.', 'info');
    },

    resetBorderColor() {
      this.borderColor = DEFAULT_SETTINGS.borderColor;
      this.borderWidth = DEFAULT_SETTINGS.borderWidth || 1;
      this.applySettings();
      Alpine.store('app').toast('Color y grosor de bordes restablecido.', 'info');
    },

    setBorderWidth(width) {
      const w = Math.max(1, Math.min(5, parseInt(width, 10) || 1));
      this.borderWidth = w;
      this.applySettings();
      this._persistAll();
    },

    resetGlowColor() {
      this.glowMode = DEFAULT_SETTINGS.glowMode;
      this.glowColor = DEFAULT_SETTINGS.glowColor;
      this.applySettings();
      Alpine.store('app').toast('Resplandor restablecido.', 'info');
    },

    resetFontDisplay() {
      this.fontDisplay = DEFAULT_SETTINGS.fontDisplay;
      this.fontWeightDisplay = DEFAULT_SETTINGS.fontWeightDisplay;
      this.applySettings();
      Alpine.store('app').toast('Fuente Display restablecida.', 'info');
    },

    resetFontBody() {
      this.fontBody = DEFAULT_SETTINGS.fontBody;
      this.fontWeightBody = DEFAULT_SETTINGS.fontWeightBody;
      this.applySettings();
      Alpine.store('app').toast('Fuente de Cuerpo restablecida.', 'info');
    },

    resetFontInput() {
      this.fontInput = DEFAULT_SETTINGS.fontInput;
      this.fontWeightInput = DEFAULT_SETTINGS.fontWeightInput;
      this.applySettings();
      Alpine.store('app').toast('Fuente de Inputs restablecida.', 'info');
    },

    resetFontHud() {
      this.fontHud = DEFAULT_SETTINGS.fontHud;
      this.fontWeightHud = DEFAULT_SETTINGS.fontWeightHud;
      this.applySettings();
      Alpine.store('app').toast('Fuente de HUD restablecida.', 'info');
    },

    resetFontTierlist() {
      this.fontTierlist = DEFAULT_SETTINGS.fontTierlist;
      this.fontWeightTierlist = DEFAULT_SETTINGS.fontWeightTierlist;
      this.applySettings();
      Alpine.store('app').toast('Fuente de Tier List restablecida.', 'info');
    },

    setDensity(density) {
      if (['compact', 'normal', 'comfortable'].includes(density)) {
        this.density = density;
        this.applySettings();
        this.saveGlobalSettings();
        const names = {
          compact: 'Compacta (Máximo espacio de trabajo)',
          normal: 'Normal (Equilibrada)',
          comfortable: 'Cómoda (Espaciosa y aireada)'
        };
        Alpine.store('app')?.toast?.(`Densidad visual: ${names[density]} aplicada.`, 'success');
      }
    },

    resetDensity() {
      this.density = DEFAULT_SETTINGS.density || 'normal';
      this.applySettings();
      this.saveGlobalSettings();
      Alpine.store('app')?.toast?.('Densidad visual restablecida a Normal.', 'info');
    },

    setCornerStyle(style) {
      if (['chamfer', 'sharp', 'rounded'].includes(style)) {
        this.cornerStyle = style;
        this.applySettings();
        this.saveGlobalSettings();
        const names = {
          chamfer: 'Bisel Triangular (Sci-Fi / Biselado)',
          sharp: 'Angular Recto (90° Afilado)',
          rounded: 'Redondeado Clásico (Curvo Suave)'
        };
        Alpine.store('app')?.toast?.(`Geometría de esquinas: ${names[style]} aplicada.`, 'success');
      }
    },

    resetCornerStyle() {
      this.cornerStyle = DEFAULT_SETTINGS.cornerStyle || 'chamfer';
      this.applySettings();
      this.saveGlobalSettings();
      Alpine.store('app')?.toast?.('Geometría de esquinas restablecida.', 'info');
    },

    // ── Kits Temáticos Globales ──────────────────────────────────
    applyThemeKit(kit) {
      if (!kit) return;
      this.accentColor = kit.color || kit.palette?.accent || DEFAULT_SETTINGS.accentColor;
      if (kit.palette) {
        if (kit.palette.secondary) this.secondaryColor = kit.palette.secondary;
        if (kit.palette.tertiary) this.tertiaryColor = kit.palette.tertiary;
        if (kit.palette.surface) this.surfaceColor = kit.palette.surface;
        if (kit.palette.border) this.borderColor = kit.palette.border;
        if (kit.palette.glow) {
          this.glowColor = kit.palette.glow;
          this.glowMode = kit.glowMode || 'custom';
        } else {
          this.glowMode = 'auto';
        }
      } else {
        if (kit.secondaryColor) this.secondaryColor = kit.secondaryColor;
        if (kit.tertiaryColor) this.tertiaryColor = kit.tertiaryColor;
        if (kit.surfaceColor) this.surfaceColor = kit.surfaceColor;
        if (kit.borderColor) this.borderColor = kit.borderColor;
        if (kit.glowColor) {
          this.glowColor = kit.glowColor;
          this.glowMode = 'custom';
        }
      }
      this.fontDisplay = kit.fontDisplay || kit.font || DEFAULT_SETTINGS.fontDisplay;
      this.fontBody = kit.fontBody || DEFAULT_SETTINGS.fontBody;
      this.fontInput = kit.fontInput || DEFAULT_SETTINGS.fontInput;
      this.fontHud = kit.fontHud || DEFAULT_SETTINGS.fontHud;
      this.fontTierlist = kit.fontTierlist || kit.fontDisplay || kit.font || DEFAULT_SETTINGS.fontTierlist;

      if (kit.fontWeightDisplay) this.fontWeightDisplay = kit.fontWeightDisplay;
      if (kit.fontWeightBody) this.fontWeightBody = kit.fontWeightBody;
      if (kit.fontWeightInput) this.fontWeightInput = kit.fontWeightInput;
      if (kit.fontWeightHud) this.fontWeightHud = kit.fontWeightHud;
      if (kit.fontWeightTierlist) this.fontWeightTierlist = kit.fontWeightTierlist;

      if (kit.cornerStyle) this.cornerStyle = kit.cornerStyle;
      this.density = kit.density || DEFAULT_SETTINGS.density;
      this.kitId = kit.id || '';

      this.saveGlobalSettings();
      this.applySettings();
      Alpine.store('app').toast(`Kit global "${kit.name}" aplicado.`, 'success');
    },

    // ── Inyección Global de CSS en :root y #app ──────────────────
    applySettings() {
      if (typeof document === 'undefined') return;

      const appEl = document.getElementById('app');
      const rootEl = document.documentElement;
      const rgb = this.hexToRgb(this.accentColor || DEFAULT_SETTINGS.accentColor) || { r: 0, g: 240, b: 255 };
      const accent = this.accentColor || DEFAULT_SETTINGS.accentColor;
      const secondary = this.secondaryColor || DEFAULT_SETTINGS.secondaryColor;
      const secRgb = this.hexToRgb(secondary) || { r: 255, g: 0, b: 119 };

      let glowRgba = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.35)`;
      if (this.glowMode === 'custom' && this.glowColor) {
        const glowRgb = this.hexToRgb(this.glowColor) || rgb;
        glowRgba = `rgba(${glowRgb.r}, ${glowRgb.g}, ${glowRgb.b}, 0.45)`;
      }

      const cleanDisp = (this.fontDisplay || 'Barlow Condensed').trim().replace(/['"]/g, '');
      const cleanBody = (this.fontBody || 'Inter Tight').trim().replace(/['"]/g, '');
      const cleanInput = (this.fontInput || 'JetBrains Mono').trim().replace(/['"]/g, '');
      const cleanHud = (this.fontHud || 'Chakra Petch').trim().replace(/['"]/g, '');
      const cleanTier = (this.fontTierlist || 'Barlow Condensed').trim().replace(/['"]/g, '');

      const fDisp = `"${cleanDisp}", "Barlow Condensed", sans-serif`;
      const fBody = `"${cleanBody}", "Inter Tight", sans-serif`;
      const fInput = `"${cleanInput}", "JetBrains Mono", monospace`;
      const fHud = `"${cleanHud}", "Chakra Petch", sans-serif`;
      const fTier = `"${cleanTier}", "Barlow Condensed", sans-serif`;

      const targets = [appEl, rootEl].filter(Boolean);
      const tertiary = this.tertiaryColor || DEFAULT_SETTINGS.tertiaryColor;
      const tertRgb = this.hexToRgb(tertiary) || { r: 212, g: 175, b: 55 };
      const surface = this.surfaceColor || DEFAULT_SETTINGS.surfaceColor;
      const surfRgb = this.hexToRgb(surface) || { r: 10, g: 13, b: 20 };
      const border = this.borderColor || DEFAULT_SETTINGS.borderColor;
      const bordRgb = this.hexToRgb(border) || { r: 34, g: 42, b: 54 };

      targets.forEach(el => {
        el.style.setProperty('--accent-primary', accent);
        el.style.setProperty('--accent-primary-rgb', `${rgb.r}, ${rgb.g}, ${rgb.b}`);
        el.style.setProperty('--accent', accent);
        el.style.setProperty('--accent-secondary', secondary);
        el.style.setProperty('--accent-secondary-rgb', `${secRgb.r}, ${secRgb.g}, ${secRgb.b}`);
        el.style.setProperty('--accent-tertiary', tertiary);
        el.style.setProperty('--accent-tertiary-rgb', `${tertRgb.r}, ${tertRgb.g}, ${tertRgb.b}`);
        el.style.setProperty('--accent-dim', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.18)`);
        el.style.setProperty('--accent-secondary-dim', `rgba(${secRgb.r}, ${secRgb.g}, ${secRgb.b}, 0.18)`);
        el.style.setProperty('--accent-tertiary-dim', `rgba(${tertRgb.r}, ${tertRgb.g}, ${tertRgb.b}, 0.18)`);
        el.style.setProperty('--accent-glow', glowRgba);
        el.style.setProperty('--accent-secondary-glow', `rgba(${secRgb.r}, ${secRgb.g}, ${secRgb.b}, 0.35)`);
        el.style.setProperty('--accent-tertiary-glow', `rgba(${tertRgb.r}, ${tertRgb.g}, ${tertRgb.b}, 0.35)`);
        el.style.setProperty('--accent-glow-lg', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.12)`);
        el.style.setProperty('--border-accent', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.25)`);
        el.style.setProperty('--border-secondary', `rgba(${secRgb.r}, ${secRgb.g}, ${secRgb.b}, 0.35)`);
        el.style.setProperty('--border-tertiary', `rgba(${tertRgb.r}, ${tertRgb.g}, ${tertRgb.b}, 0.35)`);
        el.style.setProperty('--border-strong', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.55)`);

        // Superficie y Fondos Dinámicos
        el.style.setProperty('--bg-panel-custom', surface);
        el.style.setProperty('--bg-panel-rgb', `${surfRgb.r}, ${surfRgb.g}, ${surfRgb.b}`);
        el.style.setProperty('--bg-panel', `rgba(${surfRgb.r}, ${surfRgb.g}, ${surfRgb.b}, 0.95)`);
        el.style.setProperty('--bg-panel-2', `rgba(${Math.min(255, surfRgb.r + 7)}, ${Math.min(255, surfRgb.g + 8)}, ${Math.min(255, surfRgb.b + 11)}, 0.96)`);
        el.style.setProperty('--bg-panel-3', `rgba(${Math.min(255, surfRgb.r + 14)}, ${Math.min(255, surfRgb.g + 16)}, ${Math.min(255, surfRgb.b + 22)}, 0.98)`);
        el.style.setProperty('--bg-base', surface);

        // Bordes y Contornos Dinámicos
        el.style.setProperty('--border-custom', border);
        el.style.setProperty('--border-custom-rgb', `${bordRgb.r}, ${bordRgb.g}, ${bordRgb.b}`);
        el.style.setProperty('--border-subtle', `rgba(${bordRgb.r}, ${bordRgb.g}, ${bordRgb.b}, 0.45)`);
        el.style.setProperty('--border-subtle-rgb', `${bordRgb.r}, ${bordRgb.g}, ${bordRgb.b}`);
        el.style.setProperty('--border-panel', border);
        el.style.setProperty('--border-width', `${this.borderWidth || 1}px`);

        // Contraste Dinámico Automático de Superficie
        const isLight = this.isLightSurface;
        el.setAttribute('data-surface-theme', isLight ? 'light' : 'dark');
        el.classList.toggle('surface-light', isLight);
        el.style.setProperty('--text-primary', isLight ? '#0B0F19' : '#FFFFFF');
        el.style.setProperty('--text-secondary', isLight ? 'rgba(11, 15, 25, 0.75)' : 'rgba(255, 255, 255, 0.70)');
        el.style.setProperty('--text-muted', isLight ? 'rgba(11, 15, 25, 0.50)' : 'rgba(255, 255, 255, 0.38)');

        el.style.setProperty('--gradient-accent', `linear-gradient(135deg, ${accent} 0%, ${secondary} 100%)`);
        el.style.setProperty('--gradient-accent-h', `linear-gradient(90deg, ${accent} 0%, ${secondary} 100%)`);
        el.style.setProperty('--gradient-accent-tri', `linear-gradient(90deg, ${accent} 0%, ${secondary} 50%, ${tertiary} 100%)`);

        el.style.setProperty('--font-display', fDisp);
        el.style.setProperty('--font-body', fBody);
        el.style.setProperty('--font-input', fInput);
        el.style.setProperty('--font-hud', fHud);
        el.style.setProperty('--font-tierlist', fTier);

        el.style.setProperty('--font-weight-display', this.fontWeightDisplay || '700');
        el.style.setProperty('--font-weight-body', this.fontWeightBody || '400');
        el.style.setProperty('--font-weight-input', this.fontWeightInput || '400');
        el.style.setProperty('--font-weight-hud', this.fontWeightHud || '600');
        el.style.setProperty('--font-weight-tierlist', this.fontWeightTierlist || '900');

        el.setAttribute('data-density', this.density || 'normal');
        el.setAttribute('data-corner-style', this.cornerStyle || 'chamfer');
      });

      if (document.body) {
        document.body.setAttribute('data-corner-style', this.cornerStyle || 'chamfer');
        if (document.documentElement) {
          document.documentElement.setAttribute('data-corner-style', this.cornerStyle || 'chamfer');
        }
        const densityVal = this.density || 'normal';
        document.body.setAttribute('data-density', densityVal);
        if (document.documentElement) {
          document.documentElement.setAttribute('data-density', densityVal);
        }

        const isH1Hidden = !!(this.hideAllIcons || this.hideIconsH1);
        const isH2Hidden = !!(this.hideAllIcons || this.hideIconsH2);
        const isH3Hidden = !!(this.hideAllIcons || this.hideIconsH3);
        const isLabelsHidden = !!(this.hideAllIcons || this.hideIconsLabels);
        const isMonochrome = !!this.disableCustomColors;

        document.body.classList.toggle('hide-icons-h1', isH1Hidden);
        document.body.classList.toggle('hide-icons-h2', isH2Hidden);
        document.body.classList.toggle('hide-icons-h3', isH3Hidden);
        document.body.classList.toggle('hide-icons-labels', isLabelsHidden);
        document.body.classList.toggle('disable-custom-colors', isMonochrome);
      }

      this.verifyAndLoadFonts();
    },

    // ── Verificación y Carga Dinámica de Google Fonts ────────────
    verifyAndLoadFonts() {
      if (typeof document === 'undefined') return;

      const systemFonts = ['barlow condensed', 'inter tight', 'jetbrains mono', 'chakra petch', 'sans-serif', 'monospace', 'serif', 'system-ui'];

      const fontEntries = [
        { name: (this.fontDisplay || '').trim().replace(/['"]/g, ''), weight: this.fontWeightDisplay || '700' },
        { name: (this.fontBody || '').trim().replace(/['"]/g, ''), weight: this.fontWeightBody || '400' },
        { name: (this.fontInput || '').trim().replace(/['"]/g, ''), weight: this.fontWeightInput || '400' },
        { name: (this.fontHud || '').trim().replace(/['"]/g, ''), weight: this.fontWeightHud || '600' },
        { name: (this.fontTierlist || '').trim().replace(/['"]/g, ''), weight: this.fontWeightTierlist || '900' }
      ].filter(f => f.name && !systemFonts.includes(f.name.toLowerCase()));

      const uniqueFonts = [...new Set(fontEntries.map(f => f.name))];
      const fontsKey = fontEntries.map(f => `${f.name}:${f.weight}`).sort().join('|');

      if (fontsKey === this._lastLoadedFontsKey) {
        return;
      }
      this._lastLoadedFontsKey = fontsKey;

      if (uniqueFonts.length === 0) {
        this.fontStatus = 'success';
        this.fontStatusMessage = '✓ Tipografías del sistema aplicadas';
        return;
      }

      uniqueFonts.forEach(font => this.recordCustomFont(font));

      const fontFamiliesQuery = uniqueFonts
        .map(f => `family=${f.replace(/\s+/g, '+')}:wght@300;400;500;600;700;800;900`)
        .join('&');

      const fontId = 'dynamic-google-fonts';
      let link = document.getElementById(fontId);
      if (!link) {
        link = document.createElement('link');
        link.id = fontId;
        link.rel = 'stylesheet';
        document.head.appendChild(link);
      }

      const newHref = `https://fonts.googleapis.com/css2?${fontFamiliesQuery}&display=swap`;
      if (link.href !== newHref) {
        link.href = newHref;
      }

      this.fontStatus = 'loading';
      this.fontStatusMessage = 'Cargando tipografías...';

      if (this._fontDebounceTimer) clearTimeout(this._fontDebounceTimer);
      this._fontDebounceTimer = setTimeout(async () => {
        try {
          if (document.fonts && document.fonts.load) {
            const loadPromises = fontEntries.map(f => document.fonts.load(`${f.weight} 16px "${f.name}"`));
            await Promise.all(loadPromises);
          }
          this.fontStatus = 'success';
          this.fontStatusMessage = '✓ Tipografías cargadas y listas';
        } catch {
          this.fontStatus = 'success';
          this.fontStatusMessage = '✓ Fuentes inyectadas';
        }
      }, 300);
    },

    preloadAllKitFonts() {
      const allKits = [...THEME_KITS, ...(this.customThemeKits || [])];
      const fonts = [];
      allKits.forEach(k => {
        if (k.fontDisplay) fonts.push(k.fontDisplay);
        if (k.fontBody) fonts.push(k.fontBody);
        if (k.fontInput) fonts.push(k.fontInput);
        if (k.fontHud) fonts.push(k.fontHud);
        if (k.fontTierlist) fonts.push(k.fontTierlist);
      });
      if (fonts.length > 0) {
        this.loadGoogleFonts(fonts);
      }
    },

    loadGoogleFonts(fontList) {
      if (typeof document === 'undefined' || !Array.isArray(fontList) || fontList.length === 0) return;
      const systemFonts = ['barlow condensed', 'inter tight', 'jetbrains mono', 'chakra petch', 'sans-serif', 'monospace', 'serif', 'system-ui'];
      const unique = [...new Set(fontList.map(f => String(f || '').trim().replace(/['"]/g, '')).filter(f => f && !systemFonts.includes(f.toLowerCase())))];
      if (unique.length === 0) return;

      const fontFamiliesQuery = unique
        .map(f => `family=${f.replace(/\s+/g, '+')}:wght@300;400;500;600;700;800;900`)
        .join('&');

      const fontId = 'preload-kit-google-fonts';
      let link = document.getElementById(fontId);
      if (!link) {
        link = document.createElement('link');
        link.id = fontId;
        link.rel = 'stylesheet';
        document.head.appendChild(link);
      }

      const newHref = `https://fonts.googleapis.com/css2?${fontFamiliesQuery}&display=swap`;
      if (link.href !== newHref) {
        link.href = newHref;
      }
    },

    getKitPalette(kit) {
      if (!kit) return [];
      const p = kit.palette || {};
      const accent = kit.color || p.accent || this.accentColor || '#00F0FF';
      const secondary = p.secondary || kit.secondaryColor || '#FF0077';
      const tertiary = p.tertiary || kit.tertiaryColor || '#D4AF37';
      const glow = p.glow || kit.glowColor || accent;
      const surface = p.surface || kit.surfaceColor || '#0A0D14';
      const border = p.border || kit.borderColor || '#222A36';

      return [
        { label: 'Primario', color: accent, key: 'accent' },
        { label: 'Secundario', color: secondary, key: 'secondary' },
        { label: 'Terciario', color: tertiary, key: 'tertiary' },
        { label: 'Resplandor', color: glow, key: 'glow' },
        { label: 'Superficie', color: surface, key: 'surface' },
        { label: 'Borde', color: border, key: 'border' },
      ];
    },

    isKitActive(kit) {
      if (!kit) return false;
      if (this.kitId && this.kitId === kit.id) return true;
      const currentAccent = (this.accentColor || '').trim().toUpperCase();
      const kitAccent = (kit.color || '').trim().toUpperCase();
      const currentDisp = (this.fontDisplay || '').trim().toLowerCase();
      const kitDisp = (kit.fontDisplay || '').trim().toLowerCase();
      const currentBody = (this.fontBody || '').trim().toLowerCase();
      const kitBody = (kit.fontBody || '').trim().toLowerCase();
      return currentAccent === kitAccent && currentDisp === kitDisp && currentBody === kitBody;
    },

    hexToRgb(hex) {
      if (!hex || typeof hex !== 'string') return null;
      let cleanHex = hex.trim().replace(/^#/, '');
      if (cleanHex.length === 3) {
        cleanHex = cleanHex.split('').map(c => c + c).join('');
      }
      if (cleanHex.length !== 6) return null;
      const num = parseInt(cleanHex, 16);
      if (isNaN(num)) return null;
      return {
        r: (num >> 16) & 255,
        g: (num >> 8) & 255,
        b: num & 255
      };
    },

    // ── Fondo del Panel Principal (Dashboard) ───────────────────
    async loadDashboardBgSettings() {
      const parsed = ls.getJSON('superficha_dashboard_bg_settings');
      if (parsed) {
        this._applyDashboardBgSettings(parsed);
      }
      try {
        if (db && db.meta) {
          const entry = await db.meta.get('superficha_dashboard_bg_settings');
          if (entry && entry.value) {
            this._applyDashboardBgSettings(entry.value);
          }
        }
      } catch (e) {
        console.warn('[settings] Error cargando fondo del Dashboard desde IndexedDB:', e);
      }
    },

    _applyDashboardBgSettings(parsed) {
      if (!parsed || typeof parsed !== 'object') return;
      if (parsed.dashboardBgMode) this.dashboardBgMode = parsed.dashboardBgMode;
      if (parsed.dashboardBgUrl !== undefined) this.dashboardBgUrl = parsed.dashboardBgUrl;
      if (parsed.dashboardBgTransform !== undefined) this.dashboardBgTransform = parsed.dashboardBgTransform;
      if (parsed.dashboardBgBlur !== undefined) this.dashboardBgBlur = Number(parsed.dashboardBgBlur);
      if (parsed.dashboardBgOpacity !== undefined) this.dashboardBgOpacity = Number(parsed.dashboardBgOpacity);
      if (parsed.dashboardBgZoom !== undefined) this.dashboardBgZoom = Number(parsed.dashboardBgZoom);
      if (parsed.dashboardBgPosX !== undefined) this.dashboardBgPosX = Number(parsed.dashboardBgPosX);
      if (parsed.dashboardBgPosY !== undefined) this.dashboardBgPosY = Number(parsed.dashboardBgPosY);
    },

    _dashboardBgSaveTimer: null,
    saveDashboardBgSettings(immediate = false) {
      if (immediate) {
        if (this._dashboardBgSaveTimer) clearTimeout(this._dashboardBgSaveTimer);
        this._dashboardBgSaveTimer = null;
        this._doSaveDashboardBgSettings();
        return;
      }
      if (this._dashboardBgSaveTimer) clearTimeout(this._dashboardBgSaveTimer);
      this._dashboardBgSaveTimer = setTimeout(() => {
        this._dashboardBgSaveTimer = null;
        this._doSaveDashboardBgSettings();
      }, 300);
    },

    async _doSaveDashboardBgSettings() {
      const toSave = {
        dashboardBgMode: this.dashboardBgMode,
        dashboardBgUrl: this.dashboardBgUrl,
        dashboardBgTransform: this.dashboardBgTransform || '',
        dashboardBgBlur: this.dashboardBgBlur,
        dashboardBgOpacity: this.dashboardBgOpacity,
        dashboardBgZoom: this.dashboardBgZoom ?? 100,
        dashboardBgPosX: this.dashboardBgPosX ?? 50,
        dashboardBgPosY: this.dashboardBgPosY ?? 50,
      };

      // 1. Guardar en IndexedDB (sin límite de 5MB; almacena GIFs y fondos de alta resolución de forma persistente)
      try {
        if (db && db.meta) {
          await db.meta.put({
            key: 'superficha_dashboard_bg_settings',
            value: toSave,
            updatedAt: Date.now()
          });
        }
      } catch (e) {
        console.warn('[settings] Error guardando fondo del dashboard en IndexedDB:', e);
      }

      // 2. Guardar en localStorage solo versión ligera para evitar QuotaExceededError
      try {
        const isHeavyDataUrl = typeof toSave.dashboardBgUrl === 'string' && toSave.dashboardBgUrl.startsWith('data:') && toSave.dashboardBgUrl.length > 250000;
        const lsCopy = isHeavyDataUrl ? { ...toSave, dashboardBgUrl: '' } : toSave;
        ls.setJSON('superficha_dashboard_bg_settings', lsCopy);
      } catch (_) {}
    },

    getDashboardBgStyle() {
      const blur = this.dashboardBgBlur || 0;
      if (this.dashboardBgTransform) {
        return `${this.dashboardBgTransform} filter: blur(${blur}px);`;
      }
      const zoom = Math.max(1, (this.dashboardBgZoom ?? 100) / 100);
      const x = Math.max(0, Math.min(100, this.dashboardBgPosX ?? 50));
      const y = Math.max(0, Math.min(100, this.dashboardBgPosY ?? 50));
      return `filter: blur(${blur}px); transform: scale(${zoom}); transform-origin: ${x}% ${y}%; object-position: ${x}% ${y}%;`;
    },

    resetDashboardBgFrame() {
      this.dashboardBgTransform = '';
      this.dashboardBgZoom = 100;
      this.dashboardBgPosX = 50;
      this.dashboardBgPosY = 50;
      this.saveDashboardBgSettings();
      Alpine.store('app')?.toast?.('Encuadre de fondo restablecido a valores centrales.', 'info');
    },

    openCropperForDashboard() {
      if (!this.dashboardBgUrl) {
        Alpine.store('app')?.toast('Primero debes subir una imagen o GIF.', 'info');
        return;
      }
      Alpine.store('app').openCropper(this.dashboardBgUrl, 'bg_dashboard');
    },

    async processCroppedDashboardBg(file) {
      try {
        const { dataUrl, compressedKB } = await compressImageWithStats(file, 1920, 1080);
        this.dashboardBgUrl = dataUrl;
        this.dashboardBgTransform = '';
        this.dashboardBgMode = 'custom';
        this.dashboardBgPosX = 50;
        this.dashboardBgPosY = 50;
        this.dashboardBgZoom = 100;
        this.saveDashboardBgSettings();
        Alpine.store('app').toast(`Fondo del Panel ajustado y guardado (${compressedKB}KB WebP).`, 'success');
      } catch (e) {
        console.error(e);
        Alpine.store('app').toast('Error al procesar fondo del panel.', 'error');
      }
    },

    async processCroppedDashboardBgGif(dataUrl, cssTransform) {
      this.dashboardBgUrl = dataUrl;
      this.dashboardBgTransform = cssTransform;
      this.dashboardBgMode = 'custom';
      this.saveDashboardBgSettings();
      Alpine.store('app').toast('Fondo GIF del Panel configurado con encuadre visual.', 'success');
    },

    uploadDashboardBgImage(event) {
      const file = event.target.files?.[0];
      if (!file) return;
      if (!file.type.startsWith('image/')) {
        Alpine.store('app').toast('Selecciona un archivo de imagen o GIF válido.', 'warning');
        return;
      }
      Alpine.store('app').openCropper(file, 'bg_dashboard');
      event.target.value = '';
    },

    removeDashboardBgImage() {
      this.dashboardBgUrl = '';
      this.dashboardBgTransform = '';
      if (this.dashboardBgMode === 'custom') {
        this.dashboardBgMode = 'pattern';
      }
      this.saveDashboardBgSettings();
      Alpine.store('app').toast('Fondo personalizado del Panel eliminado.', 'info');
    },

    // ── Fondo de la Tier List ──────────────────────
    async loadTierlistBgSettings() {
      const parsed = ls.getJSON('superficha_tierlist_bg_settings');
      if (parsed) {
        this._applyTierlistBgSettings(parsed);
      }
      try {
        if (db && db.meta) {
          const entry = await db.meta.get('superficha_tierlist_bg_settings');
          if (entry && entry.value) {
            this._applyTierlistBgSettings(entry.value);
          }
        }
      } catch (e) {
        console.warn('[settings] Error cargando fondo de Tier List desde IndexedDB:', e);
      }
    },

    _applyTierlistBgSettings(parsed) {
      if (!parsed || typeof parsed !== 'object') return;
      if (parsed.tierlistBgMode) this.tierlistBgMode = parsed.tierlistBgMode;
      if (parsed.tierlistBgUrl !== undefined) this.tierlistBgUrl = parsed.tierlistBgUrl;
      if (parsed.tierlistBgTransform !== undefined) this.tierlistBgTransform = parsed.tierlistBgTransform;
      if (parsed.tierlistBgBlur !== undefined) this.tierlistBgBlur = Number(parsed.tierlistBgBlur);
      if (parsed.tierlistBgOpacity !== undefined) this.tierlistBgOpacity = Number(parsed.tierlistBgOpacity);
      if (parsed.tierlistBgZoom !== undefined) this.tierlistBgZoom = Number(parsed.tierlistBgZoom);
      if (parsed.tierlistBgPosX !== undefined) this.tierlistBgPosX = Number(parsed.tierlistBgPosX);
      if (parsed.tierlistBgPosY !== undefined) this.tierlistBgPosY = Number(parsed.tierlistBgPosY);
    },

    _tierlistBgSaveTimer: null,
    saveTierlistBgSettings(immediate = false) {
      if (immediate) {
        if (this._tierlistBgSaveTimer) clearTimeout(this._tierlistBgSaveTimer);
        this._tierlistBgSaveTimer = null;
        this._doSaveTierlistBgSettings();
        return;
      }
      if (this._tierlistBgSaveTimer) clearTimeout(this._tierlistBgSaveTimer);
      this._tierlistBgSaveTimer = setTimeout(() => {
        this._tierlistBgSaveTimer = null;
        this._doSaveTierlistBgSettings();
      }, 300);
    },

    async _doSaveTierlistBgSettings() {
      const toSave = {
        tierlistBgMode: this.tierlistBgMode,
        tierlistBgUrl: this.tierlistBgUrl,
        tierlistBgTransform: this.tierlistBgTransform || '',
        tierlistBgBlur: this.tierlistBgBlur,
        tierlistBgOpacity: this.tierlistBgOpacity,
        tierlistBgZoom: this.tierlistBgZoom ?? 100,
        tierlistBgPosX: this.tierlistBgPosX ?? 50,
        tierlistBgPosY: this.tierlistBgPosY ?? 50,
      };

      // 1. Guardar en IndexedDB (sin límite de 5MB; almacena GIFs y fondos de alta resolución de forma persistente)
      try {
        if (db && db.meta) {
          await db.meta.put({
            key: 'superficha_tierlist_bg_settings',
            value: toSave,
            updatedAt: Date.now()
          });
        }
      } catch (e) {
        console.warn('[settings] Error guardando fondo de tierlist en IndexedDB:', e);
      }

      // 2. Guardar en localStorage solo versión ligera para evitar QuotaExceededError
      try {
        const isHeavyDataUrl = typeof toSave.tierlistBgUrl === 'string' && toSave.tierlistBgUrl.startsWith('data:') && toSave.tierlistBgUrl.length > 250000;
        const lsCopy = isHeavyDataUrl ? { ...toSave, tierlistBgUrl: '' } : toSave;
        ls.setJSON('superficha_tierlist_bg_settings', lsCopy);
      } catch (_) {}
    },

    getTierlistBgStyle() {
      const blur = this.tierlistBgBlur || 0;
      if (this.tierlistBgTransform) {
        return `${this.tierlistBgTransform} filter: blur(${blur}px);`;
      }
      const zoom = Math.max(1, (this.tierlistBgZoom ?? 100) / 100);
      const x = Math.max(0, Math.min(100, this.tierlistBgPosX ?? 50));
      const y = Math.max(0, Math.min(100, this.tierlistBgPosY ?? 50));
      return `filter: blur(${blur}px); transform: scale(${zoom}); transform-origin: ${x}% ${y}%; object-position: ${x}% ${y}%;`;
    },

    resetTierlistBgFrame() {
      this.tierlistBgTransform = '';
      this.tierlistBgZoom = 100;
      this.tierlistBgPosX = 50;
      this.tierlistBgPosY = 50;
      this.saveTierlistBgSettings();
      Alpine.store('app')?.toast?.('Encuadre de fondo de Tier List restablecido a valores centrales.', 'info');
    },

    openCropperForTierlist() {
      if (!this.tierlistBgUrl) {
        Alpine.store('app')?.toast('Primero debes subir una imagen o GIF.', 'info');
        return;
      }
      Alpine.store('app').openCropper(this.tierlistBgUrl, 'bg_tierlist');
    },

    async processCroppedTierlistBg(file) {
      try {
        const { dataUrl, compressedKB } = await compressImageWithStats(file, 1920, 1080);
        this.tierlistBgUrl = dataUrl;
        this.tierlistBgTransform = '';
        this.tierlistBgMode = 'custom';
        this.tierlistBgPosX = 50;
        this.tierlistBgPosY = 50;
        this.tierlistBgZoom = 100;
        this.saveTierlistBgSettings();
        Alpine.store('app').toast(`Fondo de Tier List ajustado y guardado (${compressedKB}KB WebP).`, 'success');
      } catch (e) {
        console.error(e);
        Alpine.store('app').toast('Error al procesar fondo de tier list.', 'error');
      }
    },

    async processCroppedTierlistBgGif(dataUrl, cssTransform) {
      this.tierlistBgUrl = dataUrl;
      this.tierlistBgTransform = cssTransform;
      this.tierlistBgMode = 'custom';
      this.saveTierlistBgSettings();
      Alpine.store('app').toast('Fondo GIF de Tier List configurado con encuadre visual.', 'success');
    },

    uploadTierlistBgImage(event) {
      const file = event.target.files?.[0];
      if (!file) return;
      if (!file.type.startsWith('image/')) {
        Alpine.store('app')?.toast?.('Selecciona un archivo de imagen o GIF válido.', 'warning');
        return;
      }
      Alpine.store('app').openCropper(file, 'bg_tierlist');
      event.target.value = '';
    },

    removeTierlistBgImage() {
      this.tierlistBgUrl = '';
      this.tierlistBgTransform = '';
      if (this.tierlistBgMode === 'custom') {
        this.tierlistBgMode = 'pattern';
      }
      this.saveTierlistBgSettings();
      Alpine.store('app')?.toast?.('Fondo personalizado de Tier List eliminado.', 'info');
    },

    // ── Acciones Globales de Entorno y Fondo ─────────────────────
    cloneDashboardBgToAll() {
      // 1. Tier List
      this.tierlistBgMode = this.dashboardBgMode === 'dynamic' ? 'custom' : this.dashboardBgMode;
      this.tierlistBgUrl = this.dashboardBgUrl;
      this.tierlistBgBlur = this.dashboardBgBlur;
      this.tierlistBgOpacity = this.dashboardBgOpacity;
      this.tierlistBgZoom = this.dashboardBgZoom ?? 100;
      this.tierlistBgPosX = this.dashboardBgPosX ?? 50;
      this.tierlistBgPosY = this.dashboardBgPosY ?? 50;
      this.saveTierlistBgSettings(true);

      // 2. Personaje Activo (si hay)
      const charStore = Alpine.store('characters');
      if (charStore && charStore.active) {
        if (!charStore.active.presentation) charStore.active.presentation = {};
        if (!charStore.active.presentation.background) charStore.active.presentation.background = {};
        charStore.active.presentation.background.mode = this.dashboardBgMode === 'dynamic' ? 'custom' : this.dashboardBgMode;
        charStore.active.presentation.background.image = this.dashboardBgUrl;
        charStore.active.presentation.background.blur = this.dashboardBgBlur;
        charStore.active.presentation.background.scrim = this.dashboardBgOpacity;
        charStore.active.presentation.background.zoom = this.dashboardBgZoom ?? 100;
        charStore.active.presentation.background.posX = this.dashboardBgPosX ?? 50;
        charStore.active.presentation.background.posY = this.dashboardBgPosY ?? 50;
        charStore.scheduleAutoSave();
      }

      Alpine.store('app')?.toast?.('Ajustes y fondo del Panel Principal clonados a Tier List y Ficha.', 'success');
    },

    applyPresetToPanel(panel, presetKey) {
      const presets = {
        nebula: {
          name: 'Nebula',
          url: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=80&w=1920&auto=format&fit=crop',
          blur: 0,
          scrim: 60,
          zoom: 110,
          posX: 50,
          posY: 50
        },
        cyberpunk: {
          name: 'Cyber Grid',
          url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1920&auto=format&fit=crop',
          blur: 2,
          scrim: 65,
          zoom: 105,
          posX: 50,
          posY: 40
        },
        blueprint: {
          name: 'Blueprint Tech',
          url: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=1920&auto=format&fit=crop',
          blur: 0,
          scrim: 70,
          zoom: 100,
          posX: 50,
          posY: 50
        },
        voidDark: {
          name: 'Dark Void',
          url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=1920&auto=format&fit=crop',
          blur: 3,
          scrim: 75,
          zoom: 115,
          posX: 50,
          posY: 50
        }
      };

      const p = presets[presetKey];
      if (!p) return;

      if (panel === 'dashboard') {
        this.dashboardBgMode = 'custom';
        this.dashboardBgUrl = p.url;
        this.dashboardBgBlur = p.blur;
        this.dashboardBgOpacity = p.scrim;
        this.dashboardBgZoom = p.zoom;
        this.dashboardBgPosX = p.posX;
        this.dashboardBgPosY = p.posY;
        this.saveDashboardBgSettings(true);
      } else if (panel === 'tierlist') {
        this.tierlistBgMode = 'custom';
        this.tierlistBgUrl = p.url;
        this.tierlistBgBlur = p.blur;
        this.tierlistBgOpacity = p.scrim;
        this.tierlistBgZoom = p.zoom;
        this.tierlistBgPosX = p.posX;
        this.tierlistBgPosY = p.posY;
        this.saveTierlistBgSettings(true);
      } else if (panel === 'character') {
        const charStore = Alpine.store('characters');
        if (charStore && charStore.active) {
          charStore.updateBackgroundMode('custom');
          charStore.setBackgroundUrl(p.url);
          charStore.updateBackgroundBlur(p.blur);
          charStore.updateBackgroundScrim(p.scrim);
          charStore.updateBackgroundZoom(p.zoom);
          charStore.updateBackgroundPosX(p.posX);
          charStore.updateBackgroundPosY(p.posY);
        }
      }
      Alpine.store('app')?.toast?.(`Fondo "${p.name}" aplicado.`, 'info');
    },

    resetAllBackgrounds() {
      this.dashboardBgMode = 'pattern';
      this.dashboardBgUrl = '';
      this.dashboardBgBlur = 0;
      this.dashboardBgOpacity = 60;
      this.dashboardBgZoom = 100;
      this.dashboardBgPosX = 50;
      this.dashboardBgPosY = 50;
      this.saveDashboardBgSettings(true);

      this.tierlistBgMode = 'pattern';
      this.tierlistBgUrl = '';
      this.tierlistBgBlur = 0;
      this.tierlistBgOpacity = 60;
      this.tierlistBgZoom = 100;
      this.tierlistBgPosX = 50;
      this.tierlistBgPosY = 50;
      this.saveTierlistBgSettings(true);

      const charStore = Alpine.store('characters');
      if (charStore && charStore.active) {
        charStore.updateBackgroundMode('pattern');
        charStore.removeBackgroundImage();
        charStore.resetBackgroundFrame();
      }
      Alpine.store('app')?.toast?.('Todos los fondos restablecidos a Trama HUD por defecto.', 'info');
    },

    // ── Control Global de Placeholders ───────────────────────────
    toggleShowPlaceholders() {
      this.showPlaceholders = !this.showPlaceholders;
      this.saveShowPlaceholders();
    },

    saveShowPlaceholders() {
      ls.setJSON('superficha_show_placeholders', this.showPlaceholders);
      const appStore = Alpine.store('app');
      if (appStore && typeof appStore.toast === 'function') {
        appStore.toast(
          this.showPlaceholders ? 'Textos de ejemplo (Placeholders) activados.' : 'Textos de ejemplo (Placeholders) ocultados.',
          'info'
        );
      }
      this.applyPlaceholderSettings();
    },

    applyPlaceholderSettings() {
      if (typeof document === 'undefined') return;
      const val = this.showPlaceholders ? 'true' : 'false';
      if (document.documentElement) {
        document.documentElement.setAttribute('data-show-placeholders', val);
      }
      if (document.body) {
        document.body.setAttribute('data-show-placeholders', val);
      }
    }
  });
}
