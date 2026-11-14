import { describe, it, expect, beforeEach, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const { mockMetaMap } = vi.hoisted(() => ({
  mockMetaMap: new Map<string, unknown>(),
}));

vi.mock('@core/db/dexie.ts', () => ({
  runMigrationIfNecessary: vi.fn(async () => {}),
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
    },
    characters: {
      toArray: vi.fn(async () => []),
      count: vi.fn(async () => 0),
      put: vi.fn(async () => {}),
      delete: vi.fn(async () => {}),
    },
  },
}));

import { registerCharactersStore } from '@features/characters/characters.store.js';
import { registerSettingsStore } from '@features/settings/settings.store.js';
import { renderDashboardView } from '@ui/views/dashboard.ts';
import { renderSettingsPresets } from '@ui/views/settings/settingsPresets.ts';

function createAlpineHarness() {
  const stores: Record<string, any> = {
    app: {
      toast: vi.fn(),
      activeView: 'dashboard',
      currentTab: 'basics',
      activeTabs: ['basics'],
      visitedTabs: ['basics'],
      openEditorView: vi.fn(),
      saveNavigationState: vi.fn(),
      warmupTabs: vi.fn(),
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

describe('Restored View Types (Grid & Panoramic + Settings Kits Revista/Grid)', () => {
  beforeEach(() => {
    localStorage.clear();
    mockMetaMap.clear();
    document.body.innerHTML = '<div id="app"></div>';
    document.body.className = '';
  });

  it('persists rosterViewMode (grid | banner) in characters store', () => {
    const { AlpineMock, stores } = createAlpineHarness();
    registerCharactersStore(AlpineMock);

    expect(stores.characters.rosterViewMode).toBe('grid');

    stores.characters.setRosterViewMode('banner');
    expect(stores.characters.rosterViewMode).toBe('banner');

    // Re-mounting should restore 'banner' from persisted storage
    const second = createAlpineHarness();
    registerCharactersStore(second.AlpineMock);
    expect(second.stores.characters.rosterViewMode).toBe('banner');

    second.stores.characters.setRosterViewMode('grid');
    expect(second.stores.characters.rosterViewMode).toBe('grid');
  });

  it('persists kitViewMode (magazine | grid) in settings store', () => {
    const { AlpineMock, stores } = createAlpineHarness();
    registerSettingsStore(AlpineMock);

    expect(stores.settings.kitViewMode).toBe('magazine');

    stores.settings.setKitViewMode('grid');
    expect(stores.settings.kitViewMode).toBe('grid');

    const second = createAlpineHarness();
    registerSettingsStore(second.AlpineMock);
    expect(second.stores.settings.kitViewMode).toBe('grid');
  });

  it('renders both grid and panoramic (banner) roster view modes and switcher in dashboard', () => {
    const html = renderDashboardView();

    expect(html).toContain(`role="group" aria-label="Tipo de vista del archivo"`);
    expect(html).toContain(`$store.characters.setRosterViewMode('grid')`);
    expect(html).toContain(`$store.characters.setRosterViewMode('banner')`);
    expect(html).toContain('Cuadrícula');
    expect(html).toContain('Panorámica');

    // Dual loading skeletons
    expect(html).toContain(`$store.characters.loading && $store.characters.rosterViewMode !== 'banner'`);
    expect(html).toContain(`$store.characters.loading && $store.characters.rosterViewMode === 'banner'`);

    // Dual card templates + banner anatomy + settings compatibility
    expect(html).toContain('class="fandom-roster-grid"');
    expect(html).toContain('class="fandom-roster-banner-grid"');
    expect(html).toContain('class="fandom-card fandom-card-banner group"');
    expect(html).toContain(`'has-banner': Boolean(char.basics?.bannerDataUrl || char.visualSettings?.backgroundUrl)`);
    expect(html).toContain(`$store.app.getOptimizedImageUrl(char.basics?.bannerDataUrl || char.visualSettings?.backgroundUrl)`);
    expect(html).toContain('$store.characters.getFeaturedQuote(char)');
    expect(html).toContain('$store.characters.getAvatarAspect(char)');
    expect(html).toContain('!$store.settings.hidePowerScalingTierBadge');
    expect(html).toContain('steam-avatar-frame-overlay');
  });

  it('exposes inline Revista / Cuadrícula kit view mode selector in settingsPresets', () => {
    const html = renderSettingsPresets();

    expect(html).toContain(`role="group" aria-label="Tipo de vista de kits"`);
    expect(html).toContain(`$store.settings.setKitViewMode('magazine')`);
    expect(html).toContain(`$store.settings.setKitViewMode('grid')`);
    expect(html).toContain(`$store.settings.kitViewMode === 'magazine'`);
    expect(html).toContain(`$store.settings.kitViewMode === 'grid'`);
  });

  it('includes panoramic grid, card scrim, corner-style, and density CSS rules in wiki-souls.css', () => {
    const css = readFileSync(
      resolve(process.cwd(), 'src/ui/styles/wiki-souls.css'),
      'utf8',
    );

    expect(css).toContain('.fandom-roster-banner-grid');
    expect(css).toContain('.fandom-card-banner');
    expect(css).toContain('.fandom-card-banner.has-banner');
    expect(css).toContain('.fandom-banner-scrim');
    expect(css).toContain('opacity: 1;');
    expect(css).toContain('[data-corner-style="sharp"] .fandom-banner-meta-pill');
    expect(css).toContain('[data-corner-style="chamfer"] .fandom-banner-meta-pill');
    expect(css).toContain('[data-density="compact"] .fandom-card-banner');
    expect(css).toContain('[data-density="comfortable"] .fandom-card-banner');
  });
});

