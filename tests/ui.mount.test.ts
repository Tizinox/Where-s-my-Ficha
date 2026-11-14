import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import Alpine from 'alpinejs';
import {
  renderAppShellHtml,
  renderModalsRootHtml,
  mountAppUi,
} from '@ui/mountAppUi';
import { renderHeader } from '@ui/layout/header';
import { registerUiControllers } from '@ui/controllers/uiControllers';

const EXPECTED_UI_IDS = [
  'add-tab-menu',
  'app-content',
  'app-header',
  'app-sidebar',
  'batch-emoji-uploader',
  'brand-logo',
  'btn-add-tab',
  'btn-back-to-dashboard',
  'btn-create-sheet-classic',
  'btn-create-sheet-unified',
  'btn-delete-batch-confirm',
  'btn-delete-confirm',
  'btn-dev-console',
  'btn-mode-edit',
  'btn-mode-preview',
  'btn-new-character',
  'btn-rename-confirm',
  'btn-reset-confirm',
  'btn-settings',
  'char-bg-upload',
  'character-sheet-skeleton',
  'character-view-container',
  'create-sheet-modal',
  'cropper-image',
  'cropper-modal',
  'cropper-title',
  'custom-bg-layer',
  'dashboard-bg-upload',
  'delete-batch-dialog',
  'delete-dialog',
  'delete-folder-modal',
  'delete-folder-title',
  'dev-cli-input',
  'dev-console-logs-container',
  'dev-console-modal',
  'dev-console-title',
  'discord-modal',
  'divider-title-input',
  'dynamic-bg-container',
  'dynamic-bg-layer',
  'emoji-category-datalist',
  'emoji-editor-form-card',
  'emoji-file-uploader',
  'emoji-picker-modal',
  'emoji-picker-search-input',
  'factory-reset-modal',
  'factory-reset-title',
  'folder-config-modal',
  'folder-modal-title',
  'folder-name-input',
  'gallery-upload',
  'gif-size-error-modal',
  'gif-size-error-title',
  'hotkeys-modal-title',
  'import-emojis-json-input',
  'json-preview-modal',
  'json-preview-modal-title',
  'lightbox-modal',
  'magazine-scroller-container',
  'main-dashboard-view',
  'main-nav-tabs',
  'main-settings-view',
  'main-tierlist-view',
  'modal-create-custom-tab',
  'modal-create-sheet-title',
  'modal-custom-block',
  'modal-multi-image-picker',
  'modal-tierlist-custom-tool',
  'modal-tierlist-divider-title',
  'multi-picker-title',
  'rename-dialog',
  'rename-input',
  'reset-modal',
  'reset-modal-title',
  'steam-avatar-confirm-modal',
  'steam-avatars-modal',
  'steam-avatars-search-input',
  'steam-emojis-modal',
  'steam-frames-modal',
  'steam-frames-search-input',
  'tab-content',
  'tab-custom',
  'tactical-hotkeys-modal',
  'tactical-toast-container',
  'theme-designer-modal',
  'theme-export-modal',
  'theme-import-modal',
  'tierlist-batch-guests-modal',
  'tierlist-bg-upload',
  'tierlist-board-header-icon',
  'tierlist-confirm-modal',
  'tierlist-edit-tier-modal',
  'tierlist-guest-modal',
  'tierlist-icon-picker-modal',
  'tierlist-lists-modal',
  'tierlist-multiselect-floating-bar',
  'tierlist-render-board',
  'tierlist-tiermaker-modal',
  'unified-character-sheet',
];

describe('Modular TS UI mounting and parity', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="app"></div><div id="modals-root"></div>';
  });

  it('preserves every DOM element ID and expands all nested partials without include tags', () => {
    const combinedHtml = `${renderAppShellHtml()}\n${renderModalsRootHtml()}`;

    expect(combinedHtml).not.toMatch(/<include\s+src=/i);

    for (const id of EXPECTED_UI_IDS) {
      expect(combinedHtml, `Missing UI element id="${id}"`).toContain(`id="${id}"`);
    }

    // Todos los 12 tabs clásicos deben estar montados dentro del árbol clásico
    for (const tabKey of [
      'basics',
      'body',
      'mind',
      'social',
      'beliefs',
      'priorities',
      'skills',
      'weapons',
      'power',
      'extras',
      'steam',
    ]) {
      expect(combinedHtml).toContain(`data-tab-section="${tabKey}"`);
    }
    expect(combinedHtml).toContain('id="tab-custom"');
    expect(combinedHtml).toContain('id="btn-unified-convert-sheet"');
    expect(combinedHtml).toContain('id="btn-classic-convert-sheet"');
    expect(combinedHtml).toContain('id="sheet-converter-modal"');

    // cyber-color-popover debe expandirse tanto en Ajustes como en Tier List
    const popoverMatches = combinedHtml.match(/class="cyber-color-popover/g) || [];
    expect(popoverMatches.length).toBe(7);
  });

  it('mounts #app and #modals-root synchronously into the DOM', () => {
    mountAppUi(Alpine, document);

    const appRoot = document.getElementById('app');
    const modalsRoot = document.getElementById('modals-root');

    expect(appRoot?.querySelector('#app-header')).not.toBeNull();
    expect(appRoot?.querySelector('#main-dashboard-view')).not.toBeNull();
    expect(appRoot?.querySelector('#main-settings-view')).not.toBeNull();
    expect(appRoot?.querySelector('#main-tierlist-view')).not.toBeNull();
    expect(appRoot?.querySelector('#app-sidebar')).not.toBeNull();
    expect(appRoot?.querySelector('#app-content')).not.toBeNull();
    const templates = Array.from(appRoot?.querySelectorAll('template') || []);
    expect(templates.some((t) => t.content.querySelector('#btn-unified-convert-sheet') !== null)).toBe(true);
    expect(templates.some((t) => t.content.querySelector('#btn-classic-convert-sheet') !== null)).toBe(true);

    expect(modalsRoot?.querySelector('#create-sheet-modal')).not.toBeNull();
    expect(modalsRoot?.querySelector('#sheet-converter-modal')).not.toBeNull();
    expect(modalsRoot?.querySelector('#btn-convert-sheet-copy')).not.toBeNull();
    expect(modalsRoot?.querySelector('#btn-convert-sheet-confirm')).not.toBeNull();
    expect(modalsRoot?.querySelector('#cropper-modal')).not.toBeNull();
    expect(modalsRoot?.querySelector('#folder-config-modal')).not.toBeNull();
    expect(modalsRoot?.querySelector('#tactical-toast-container')).not.toBeNull();
  });

  it('registers sheetVisualMedia controller and computes activeData / quick mutations', () => {
    const registered: Record<string, (...args: any[]) => any> = {};
    const mockChar: any = {
      id: 'char-1',
      basics: {
        avatarDataUrl: 'data:image/png;base64,AVATAR',
        bannerDataUrl: 'data:image/png;base64,BANNER',
        iconDataUrl: 'data:image/png;base64,ICON',
        quotes: [],
      },
      skills: [],
      weapons: [],
    };
    let saveCalls = 0;
    const mockStores: Record<string, any> = {
      characters: {
        activeId: 'char-1',
        active: mockChar,
        scheduleAutoSave: () => {
          saveCalls += 1;
        },
        addQuote: (q: string) => mockChar.basics.quotes.push(q),
      },
      app: {
        toast: () => {},
        openCropper: () => {},
      },
    };

    const mockAlpine = {
      data(name: string, fn: (...args: any[]) => Record<string, any>) {
        registered[name] = fn;
      },
      store(name: string) {
        return mockStores[name];
      },
    };

    registerUiControllers(mockAlpine);
    expect(typeof registered.sheetVisualMedia).toBe('function');

    const ctrl = registered.sheetVisualMedia('unified');
    expect(ctrl.activeData.type).toBe('avatar');
    expect(ctrl.activeData.dataUrl).toBe('data:image/png;base64,AVATAR');

    ctrl.visualTab = 'banner';
    expect(ctrl.activeData.type).toBe('banner');
    expect(ctrl.activeData.shortLabel).toBe('Báner');

    ctrl.newSkillName = 'Corte Astral';
    ctrl.addQuickSkill();
    expect(mockChar.skills).toHaveLength(1);
    expect(mockChar.skills[0].title).toBe('Corte Astral');
    expect(mockChar.skills[0].type).toBe('active');
    expect(mockChar.skills[0]).toHaveProperty('effect', '');

    ctrl.newWeaponName = 'Alabarda de Ceniza';
    ctrl.addQuickWeapon();
    expect(mockChar.weapons).toHaveLength(1);
    expect(mockChar.weapons[0].name).toBe('Alabarda de Ceniza');
    expect(mockChar.weapons[0].rarity).toBe('Común');
    expect(mockChar.weapons[0]).toHaveProperty('tags');

    ctrl.newQuoteText = 'Que la llama guíe tu senda.';
    ctrl.addQuickQuote();
    expect(mockChar.basics.quotes).toEqual(['Que la llama guíe tu senda.']);
    expect(saveCalls).toBe(2);
  });

  it('prevents topbar navigation and editor buttons from overflowing or overlapping in character creation/editor', () => {
    const headerHtml = renderHeader();
    document.body.innerHTML = headerHtml;

    const header = document.getElementById('app-header');
    expect(header).not.toBeNull();

    const navTabs = document.getElementById('main-nav-tabs');
    expect(navTabs).not.toBeNull();
    expect(navTabs?.querySelectorAll('button').length).toBe(3);

    // Every button inside main navigation tabs stays single-line and non-shrinking
    navTabs?.querySelectorAll('button').forEach((btn) => {
      expect(btn.className).toContain('whitespace-nowrap');
      expect(btn.className).toContain('shrink-0');
    });

    // Left bar constrains overflow so editor context & nav tabs never collide onto right action bar
    expect(headerHtml).toContain('min-w-0 flex-1 overflow-hidden');
    expect(headerHtml).toContain("$store.app.activeView === 'editor' ? 'hidden 2xl:flex' : 'flex'");
    expect(headerHtml).toContain('truncate min-w-0 flex-1 max-w-[180px]');
    expect(headerHtml).toContain('id="btn-export-sheet"');
    expect(headerHtml).toContain('id="btn-new-character"');

    const css = readFileSync(resolve(process.cwd(), 'src/ui/styles/wiki-souls.css'), 'utf8');
    expect(css).toContain('#app-header .souls-btn');
    expect(css).toContain('white-space: nowrap;');
    expect(css).toContain('#app-header #main-nav-tabs .souls-btn');
  });
});

