import { describe, it, expect, beforeEach, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const { mockMetaMap } = vi.hoisted(() => ({
  mockMetaMap: new Map<string, unknown>(),
}));

vi.mock('@core/db/dexie.ts', () => ({
  db: {
    meta: {
      get: vi.fn(async (key: string) => {
        const val = mockMetaMap.get(key);
        return val !== undefined ? { key, value: val } : undefined;
      }),
      put: vi.fn(async (entry: { key: string; value: unknown }) => {
        mockMetaMap.set(entry.key, entry.value);
      }),
      delete: vi.fn(async (key: string) => {
        mockMetaMap.delete(key);
      }),
      toArray: vi.fn(async () => Array.from(mockMetaMap.entries()).map(([key, value]) => ({ key, value }))),
    },
    characters: {
      toArray: vi.fn(async () => []),
      count: vi.fn(async () => 0),
    },
  },
}));

import {
  buildThemeTokens,
  registerSettingsStore,
  DEFAULT_SETTINGS,
  THEME_KITS,
} from '@features/settings/settings.store.js';
import { ls } from '@core/db/storage.ts';
import { renderHeader } from '@ui/layout/header.ts';
import { renderDynamicBg } from '@ui/layout/dynamicBg.ts';
import { renderDashboardView } from '@ui/views/dashboard.ts';
import { renderTierlistView } from '@ui/views/tierlist/index.ts';
import { renderSettingsView } from '@ui/views/settings/index.ts';
import { renderModalThemeDesigner } from '@ui/modals/modalThemeDesigner.ts';
import { renderModalTierlistGuest } from '@ui/views/tierlist/modalTierlistGuest.ts';

function createAlpineHarness() {
  const stores: Record<string, any> = {
    app: {
      toast: vi.fn(),
      activeView: 'dashboard',
    },
    characters: {
      active: null,
      list: [],
    },
  };

  const AlpineMock = {
    raw: (v: unknown) => v,
    effect: (fn: () => void) => {
      fn();
    },
    store: (name: string, def?: any) => {
      if (def !== undefined) {
        stores[name] = def;
      }
      return stores[name];
    },
  };

  return { AlpineMock, stores };
}

describe('Configuration & Settings Regression Fixes', () => {
  beforeEach(() => {
    localStorage.clear();
    mockMetaMap.clear();
    document.body.innerHTML = '<div id="app"></div>';
    document.body.className = '';
    document.documentElement.removeAttribute('style');
    document.documentElement.removeAttribute('data-density');
    document.documentElement.removeAttribute('data-corner-style');
    document.documentElement.removeAttribute('data-show-placeholders');
  });

  it('computes complete theme CSS tokens including wiki headings, weights, glow state, and light surface contrast', () => {
    const sober = buildThemeTokens({ ...DEFAULT_SETTINGS });
    expect(sober.isLight).toBe(false);
    expect(sober.vars['--accent-glow']).toBe('transparent');
    expect(sober.vars['--font-wiki-heading']).toContain('Source Serif 4');

    const customized = buildThemeTokens({
      ...DEFAULT_SETTINGS,
      accentColor: '#00F0FF',
      secondaryColor: '#FF007F',
      tertiaryColor: '#10B981',
      surfaceColor: '#F7F5F0',
      borderWidth: 3,
      disableGlowEffects: false,
      glowMode: 'custom',
      glowColor: '#FF8800',
      fontDisplay: 'Orbitron',
      fontBody: 'EB Garamond',
      fontInput: 'Fira Code',
      fontHud: 'Rajdhani',
      fontTierlist: 'Teko',
      fontWeightDisplay: '800',
      fontWeightBody: '500',
      fontWeightInput: '600',
      fontWeightHud: '700',
      fontWeightTierlist: '900',
    });

    expect(customized.isLight).toBe(true);
    expect(customized.vars['--accent']).toBe('#00F0FF');
    expect(customized.vars['--accent-secondary']).toBe('#FF007F');
    expect(customized.vars['--accent-tertiary']).toBe('#10B981');
    expect(customized.vars['--border-width']).toBe('3px');
    expect(customized.vars['--accent-glow']).not.toBe('transparent');
    expect(customized.vars['--accent-glow']).toContain('255, 136, 0');
    expect(customized.vars['--font-wiki-heading']).toContain('Orbitron');
    expect(customized.vars['--font-wiki-serif']).toContain('EB Garamond');
    expect(customized.vars['--font-input']).toContain('Fira Code');
    expect(customized.vars['--font-hud']).toContain('Rajdhani');
    expect(customized.vars['--font-tierlist']).toContain('Teko');
    expect(customized.vars['--font-weight-display']).toBe('800');
    expect(customized.vars['--font-weight-body']).toBe('500');
    expect(customized.vars['--font-weight-input']).toBe('600');
    expect(customized.vars['--font-weight-hud']).toBe('700');
    expect(customized.vars['--font-weight-tierlist']).toBe('900');
  });

  it('toggleDisableGlowEffects immediately re-applies tokens and toggles body class', () => {
    const { AlpineMock, stores } = createAlpineHarness();
    registerSettingsStore(AlpineMock);
    const settings = stores.settings;
    settings.applySettings();

    expect(document.body.classList.contains('no-glow-effects')).toBe(true);
    expect(document.documentElement.style.getPropertyValue('--accent-glow')).toBe('transparent');

    settings.toggleDisableGlowEffects();

    expect(settings.disableGlowEffects).toBe(false);
    expect(document.body.classList.contains('no-glow-effects')).toBe(false);
    expect(document.documentElement.style.getPropertyValue('--accent-glow')).toContain('rgba(');
  });

  it('individual color and font resets immediately persist changes to localStorage', () => {
    const { AlpineMock, stores } = createAlpineHarness();
    registerSettingsStore(AlpineMock);
    const settings = stores.settings;

    settings.accentColor = '#123456';
    settings.secondaryColor = '#654321';
    settings.fontDisplay = 'Orbitron';
    settings.fontInput = 'Fira Code';

    settings.resetColor();
    expect(ls.getJSON<any>('superficha_global_settings')?.accentColor).toBe(DEFAULT_SETTINGS.accentColor);

    settings.resetSecondaryColor();
    expect(ls.getJSON<any>('superficha_global_settings')?.secondaryColor).toBe(DEFAULT_SETTINGS.secondaryColor);

    settings.resetFontDisplay();
    expect(ls.getJSON<any>('superficha_global_settings')?.fontDisplay).toBe(DEFAULT_SETTINGS.fontDisplay);

    settings.resetFontInput();
    expect(ls.getJSON<any>('superficha_global_settings')?.fontInput).toBe(DEFAULT_SETTINGS.fontInput);
  });

  it('resetToDefault restores previously missed flags including cornerStyle, glow, kbd, badges, placeholders, and boot options', async () => {
    const { AlpineMock, stores } = createAlpineHarness();
    registerSettingsStore(AlpineMock);
    const settings = stores.settings;

    settings.cornerStyle = 'chamfer';
    settings.disableGlowEffects = false;
    settings.hideAnimatedFrames = true;
    settings.hideKeyboardBadges = false;
    settings.disableSettingsInteractiveGrid = true;
    settings.hidePowerScalingTierBadge = true;
    settings.fastBoot = true;
    settings.showSplashScreen = false;
    settings.showSplashQuotes = false;
    settings.bootSound = false;
    settings.bootQuotesCategory = 'custom';
    settings.customBootQuotes = ['Custom test quote'];
    settings.showPlaceholders = true;

    await settings.resetToDefault();

    expect(settings.cornerStyle).toBe(DEFAULT_SETTINGS.cornerStyle);
    expect(settings.disableGlowEffects).toBe(DEFAULT_SETTINGS.disableGlowEffects);
    expect(settings.hideAnimatedFrames).toBe(false);
    expect(settings.hideKeyboardBadges).toBe(DEFAULT_SETTINGS.hideKeyboardBadges);
    expect(settings.disableSettingsInteractiveGrid).toBe(false);
    expect(settings.hidePowerScalingTierBadge).toBe(false);
    expect(settings.fastBoot).toBe(false);
    expect(settings.showSplashScreen).toBe(true);
    expect(settings.showSplashQuotes).toBe(true);
    expect(settings.bootSound).toBe(true);
    expect(settings.bootQuotesCategory).toBe(DEFAULT_SETTINGS.bootQuotesCategory);
    expect(settings.customBootQuotes).toEqual([]);
    expect(settings.showPlaceholders).toBe(false);
    expect(ls.getJSON<boolean>('superficha_show_placeholders')).toBe(false);
    expect(document.documentElement.getAttribute('data-show-placeholders')).toBe('false');
  });

  it('applyThemeKit enables visual glows for expressive kits and isKitActive detects secondary/font/corner divergence', () => {
    const { AlpineMock, stores } = createAlpineHarness();
    registerSettingsStore(AlpineMock);
    const settings = stores.settings;

    const cyberKit = THEME_KITS.find((k: any) => k.id === 'cyberpunk')!;
    const classicKit = THEME_KITS.find((k: any) => k.id === 'classic-rpg')!;

    settings.applyThemeKit(cyberKit);
    expect(settings.disableGlowEffects).toBe(false);
    expect(settings.disableCustomColors).toBe(false);
    expect(settings.isKitActive(cyberKit)).toBe(true);

    // Diverging on secondary color, font, or corner style invalidates active kit match
    settings.secondaryColor = '#000001';
    expect(settings.isKitActive(cyberKit)).toBe(false);

    settings.applyThemeKit(classicKit);
    expect(settings.disableGlowEffects).toBe(true);
    expect(settings.disableCustomColors).toBe(true);
    expect(settings.isKitActive(classicKit)).toBe(true);
  });

  it('handleHeavyAssetAction reset_bg persists empty background using dedicated background storage keys', async () => {
    const { AlpineMock, stores } = createAlpineHarness();
    registerSettingsStore(AlpineMock);
    const settings = stores.settings;

    settings.dashboardBgMode = 'custom';
    settings.dashboardBgUrl = 'https://example.com/bg.png';
    settings.saveDashboardBgSettings(true);

    settings.handleHeavyAssetAction({ actionType: 'reset_bg', targetId: 'dashboard' });
    await Promise.resolve();
    expect(settings.dashboardBgMode).toBe('pattern');
    expect(settings.dashboardBgUrl).toBe('');
    expect(ls.getJSON<any>('superficha_dashboard_bg_settings')?.dashboardBgUrl).toBe('');
    expect(ls.getJSON<any>('superficha_dashboard_bg_settings')?.dashboardBgMode).toBe('pattern');

    settings.tierlistBgMode = 'custom';
    settings.tierlistBgUrl = 'https://example.com/tl.png';
    settings.saveTierlistBgSettings(true);

    settings.handleHeavyAssetAction({ actionType: 'reset_bg', targetId: 'tierlist' });
    await Promise.resolve();
    expect(settings.tierlistBgMode).toBe('pattern');
    expect(settings.tierlistBgUrl).toBe('');
    expect(ls.getJSON<any>('superficha_tierlist_bg_settings')?.tierlistBgUrl).toBe('');
    expect(ls.getJSON<any>('superficha_tierlist_bg_settings')?.tierlistBgMode).toBe('pattern');
  });

  it('renders wired UI controls for header completeness, recent sheet button, dashboard tier badge, sync bg, and settings interactive grid', () => {
    const headerHtml = renderHeader();
    expect(headerHtml).toContain('id="header-completeness-bar"');
    expect(headerHtml).toContain('!$store.settings.hideCompletenessBar');
    expect(headerHtml).toContain('id="btn-recent-sheet"');
    expect(headerHtml).toContain('!$store.settings.hideRecentSheetButton');

    const dashboardHtml = renderDashboardView();
    expect(dashboardHtml).toContain('!$store.settings.hidePowerScalingTierBadge');
    expect(dashboardHtml).toContain("dashboardBgMode !== 'pattern'");

    const dynamicBgHtml = renderDynamicBg();
    expect(dynamicBgHtml).toContain('z-0 pointer-events-none');
    expect(dynamicBgHtml).not.toContain("'-z-10'");
    expect(dynamicBgHtml).toContain("$store.settings.dashboardBgMode === 'custom'");
    expect(dynamicBgHtml).toContain("$store.settings.dashboardBgMode === 'dynamic'");

    const tierlistHtml = renderTierlistView();
    expect(tierlistHtml).toContain("$store.settings.tierlistBgMode === 'sync'");
    expect(tierlistHtml).not.toContain('bg-[#07090d]');

    const settingsHtml = renderSettingsView();
    expect(settingsHtml).toContain('id="settings-interactive-grid-container"');
    expect(settingsHtml).toContain('id="settings-interactive-grid-canvas"');
    expect(settingsHtml).toContain('disableSettingsInteractiveGrid');
  });

  it('CSS stylesheets scope glow neutralization, fix hotkeys modal exemption, and cover density/custom-colors/icons', () => {
    const wikiCss = readFileSync(resolve(process.cwd(), 'src/ui/styles/wiki-souls.css'), 'utf8');
    const componentsCss = readFileSync(resolve(process.cwd(), 'src/ui/styles/components.css'), 'utf8');

    expect(wikiCss).toContain('body.no-glow-effects:not(.sheet-mode-classic) *');
    expect(wikiCss).toContain('body:not(.no-glow-effects):not(.sheet-mode-classic)');
    expect(wikiCss).toContain('[data-density="compact"]');
    expect(wikiCss).toContain('[data-density="comfortable"]');
    expect(wikiCss).toContain('body.disable-custom-colors :is(.wiki-shell, #main-dashboard-view, #unified-character-sheet, #modals-root)');
    expect(wikiCss).toContain('body.hide-icons-h1');
    expect(wikiCss).toContain('body.hide-icons-labels');

    expect(componentsCss).toContain('#tactical-hotkeys-modal kbd');
    expect(componentsCss).not.toContain('#modal-hotkeys kbd');
    expect(componentsCss).toContain('.wiki-settings-kbd');
    expect(componentsCss).toContain('.steam-foil-badge');
    expect(componentsCss).toContain('body.no-glow-effects .modal-box');

    expect(wikiCss).toContain('#main-dashboard-view');
    expect(wikiCss).not.toContain('#dashboard-view ');
    expect(wikiCss).toContain('#main-tierlist-view');
    expect(wikiCss).toContain('#modals-root .modal-box');
    expect(wikiCss).toContain('#tactical-floating-text-toolbar');
    expect(wikiCss).toContain('--border-width');
    expect(wikiCss).toContain('[role="switch"]');
    expect(wikiCss).toContain('[data-avatar-container]');
    expect(wikiCss).toContain('.tier-token-avatar-box');
    expect(wikiCss).toContain('.steam-avatar-frame-overlay');
    expect(wikiCss).toContain('.tf-color-swatch');
    expect(wikiCss).toContain('.sanity-dot');
    expect(wikiCss).toContain('.animate-spin');
    expect(wikiCss).toContain('.cropper-point');
    expect(wikiCss).toContain('[data-protect-circle]');

    const variablesCss = readFileSync(resolve(process.cwd(), 'src/ui/styles/variables.css'), 'utf8');
    expect(variablesCss).toContain('[data-protect-contrast]');

    const tailwindConfig = readFileSync(resolve(process.cwd(), 'tailwind.config.js'), 'utf8');
    expect(tailwindConfig).toContain("'wiki-serif'");
    expect(tailwindConfig).toContain("'wiki-heading'");
  });

  it('defaults cornerStyle to rounded, resets cleanly, and uses 12px tierlist border radius fallback', () => {
    const { AlpineMock } = createAlpineHarness();
    (window as any).Alpine = AlpineMock;
    registerSettingsStore(AlpineMock as any);

    const settings = AlpineMock.store('settings');
    settings.cornerStyle = 'chamfer';
    settings.resetCornerStyle();
    expect(settings.cornerStyle).toBe('rounded');
    expect(settings.getTierlistBorderRadius()).toBe(12);

    const tierlistStoreSrc = readFileSync(resolve(process.cwd(), 'src/features/tierlist/tierlist.store.js'), 'utf8');
    expect(tierlistStoreSrc).toContain('settings.tierlistBorderRadiusRegistered !== undefined ? settings.tierlistBorderRadiusRegistered : 12');
    expect(tierlistStoreSrc).not.toContain('borderRadius : 25');
  });

  it('validates themeDesigner round-trip, WCAG contrast calculation, glowMode preservation, and expanded isKitActive checks', () => {
    const { AlpineMock } = createAlpineHarness();
    (window as any).Alpine = AlpineMock;
    registerSettingsStore(AlpineMock as any);

    const settings = AlpineMock.store('settings');
    expect(settings.designerForm.cornerStyle).toBe('rounded');

    settings.designerForm.color = '#FFFFFF';
    settings.designerForm.surfaceColor = '#0A0D14';
    const highContrast = settings.getDesignerContrastInfo();
    expect(highContrast.ratio).toBeGreaterThan(15);
    expect(highContrast.ok).toBe(true);

    settings.designerForm.color = '#111111';
    settings.designerForm.surfaceColor = '#0A0D14';
    const lowContrast = settings.getDesignerContrastInfo();
    expect(lowContrast.ratio).toBeLessThan(2);
    expect(lowContrast.ok).toBe(false);

    const customKit = settings._parseKitFromObject({
      name: 'Precision Tactical Kit',
      color: '#00F0FF',
      secondaryColor: '#FF0077',
      tertiaryColor: '#D4AF37',
      glowColor: '#00F0FF',
      glowMode: 'match-primary',
      surfaceColor: '#0A0D14',
      borderColor: '#222A36',
      borderWidth: 3,
      fontDisplay: 'Orbitron',
      fontHud: 'Chakra Petch',
      fontBody: 'Inter Tight',
      fontInput: 'JetBrains Mono',
      fontTierlist: 'Barlow Condensed',
      fontWeightDisplay: '800',
      fontWeightHud: '600',
      fontWeightBody: '400',
      fontWeightInput: '500',
      fontWeightTierlist: '900',
      cornerStyle: 'sharp',
      density: 'compact',
      disableGlowEffects: true,
      disableCustomColors: false,
    });

    expect(customKit.borderWidth).toBe(3);
    expect(customKit.glowMode).toBe('match-primary');
    expect(customKit.fontWeightDisplay).toBe('800');
    expect(customKit.disableGlowEffects).toBe(true);

    settings.openDesigner(customKit);
    expect(settings.designerForm.borderWidth).toBe(3);
    expect(settings.designerForm.glowMode).toBe('match-primary');
    expect(settings.designerForm.fontWeightTierlist).toBe('900');
    expect(settings.designerForm.disableGlowEffects).toBe(true);

    settings.applyThemeKit(customKit);
    expect(settings.glowMode).toBe('match-primary');
    expect(settings.isKitActive(customKit)).toBe(true);

    settings.borderWidth = 4;
    expect(settings.isKitActive(customKit)).toBe(false);
    settings.applyThemeKit(customKit);
    settings.disableGlowEffects = false;
    expect(settings.isKitActive(customKit)).toBe(false);
  });

  it('measures custom emoji data URIs stored on em.url inside storage breakdown telemetry', async () => {
    const { AlpineMock, stores } = createAlpineHarness();
    const fakeDataUrl = 'data:image/png;base64,' + 'A'.repeat(256);
    stores.customEmojis = {
      list: [{ id: 'em1', name: 'crest', url: fakeDataUrl }],
    };
    (window as any).Alpine = AlpineMock;
    registerSettingsStore(AlpineMock as any);

    const settings = AlpineMock.store('settings');
    await settings.scanStorageBreakdown();
    expect(settings.storageBreakdown.emojisBytes).toBe(fakeDataUrl.length);
  });

  it('exposes complete settings controls, tierlist UI fixes, and rich-text/grid protections', () => {
    const designerHtml = renderModalThemeDesigner();
    expect(designerHtml).toContain('designerForm.borderWidth');
    expect(designerHtml).toContain('designerForm.glowMode');
    expect(designerHtml).toContain('designerForm.fontWeightDisplay');
    expect(designerHtml).toContain('designerForm.disableGlowEffects');
    expect(designerHtml).toContain('designerForm.disableCustomColors');
    expect(designerHtml).toContain('getDesignerContrastInfo()');
    expect(designerHtml).toContain('data-protect-contrast="true"');
    expect(designerHtml).toContain('data-protect-circle data-protect-radius');

    const settingsHtml = renderSettingsView();
    expect(settingsHtml).toContain('toggleBootSound()');
    expect(settingsHtml).toContain('x-model.number="$store.settings.dashboardBgOpacity"');
    expect(settingsHtml).toContain('x-model.number="$store.settings.tierlistBgOpacity"');
    expect(settingsHtml).toContain('x-model.number="$store.settings.dashboardBgBlur"');
    expect(settingsHtml).toContain('x-model.number="$store.settings.tierlistBgBlur"');
    expect(settingsHtml).toContain('data-protect-circle data-protect-radius');

    const guestModalHtml = renderModalTierlistGuest();
    expect(guestModalHtml).toContain('Configuración ➔ Tier List y Sistema');
    expect(guestModalHtml).not.toContain('Configuración ➔ Datos y Exportación');

    const tierlistHtml = renderTierlistView();
    expect(tierlistHtml).toContain('<kbd class="kbd-badge');
    expect(tierlistHtml).toContain('data-protect-contrast="true"');
    expect(tierlistHtml).toContain('role="switch"');

    const formatterSrc = readFileSync(resolve(process.cwd(), 'src/core/rich-text/textFormatterEngine.js'), 'utf8');
    expect(formatterSrc).toContain('data-protect-contrast');
    expect(formatterSrc).toContain('--border-width');
    expect(formatterSrc).toContain('data-protect-circle');

    const gridSrc = readFileSync(resolve(process.cwd(), 'src/core/ui/interactiveGridHero.js'), 'utf8');
    expect(gridSrc).toContain('isLightSurface');
    expect(gridSrc).toContain('disableGlowEffects');
    expect(gridSrc).toContain('cornerStyle');
  });
});
