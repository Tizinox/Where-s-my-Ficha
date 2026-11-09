/**
 * store/settings/faviconEngine.js
 * Motor de Favicon Isométrico 3D (Easter Egg de Minecraft Heads y Skins).
 */

import {
  searchMinecraftHeads,
  resolveMinecraftHeadInput,
  getHeadRenderUrl,
  loadCoreHeads,
  loadExtendedHeadsDatabase,
  HEAD_CATEGORIES,
  POPULAR_HEAD_PRESETS
} from '../../utils/minecraftHeadsDb.js';
import { ls } from '../../utils/storage.js';

export function createFaviconEngineMethods() {
  return {
    faviconEasterEggUnlocked: false,
    faviconEngineMode: 'custom_heads', // 'custom_heads' | 'players'
    activeFavicon: '',
    activeFaviconName: '',
    minecraftFaviconInput: 'Steve',
    customHeadSearch: '',
    customHeadCategory: 'all',
    customHeadResults: [],
    selectedCustomHead: null,
    headCategories: HEAD_CATEGORIES,
    popularHeadPresets: POPULAR_HEAD_PRESETS,
    faviconStatus: 'idle', // 'idle' | 'checking' | 'valid' | 'error'
    faviconStatusMessage: '',
    resolvedFaviconUrl: '',
    _faviconCheckTimer: null,
    _customHeadSearchTimer: null,

    initFaviconEngine() {
      if (ls.get('sys_easteregg_favicon') === 'true') {
        this.faviconEasterEggUnlocked = true;
      }
      const savedMode = ls.get('sys_favicon_mode');
      if (savedMode === 'custom_heads' || savedMode === 'players') {
        this.faviconEngineMode = savedMode;
      }
      const savedFavicon = ls.get('sys_active_favicon');
      const savedName = ls.get('sys_active_favicon_name');
      if (savedFavicon) {
        this.activeFavicon = savedFavicon;
        this.activeFaviconName = savedName || '';
        this.injectFaviconLink(savedFavicon);
      }

      this.searchCustomHeads('');
      this.checkFaviconUser();
    },

    unlockFaviconEasterEgg() {
      this.faviconEasterEggUnlocked = true;
      ls.set('sys_easteregg_favicon', 'true');
      this.checkFaviconUser();
      window.Alpine?.store('app')?.toast('🎉 ¡Easter Egg desbloqueado! Motor de Favicon Isométrico 3D habilitado en Configuración.', 'success', 5000);
    },

    setFaviconEngineMode(mode) {
      this.faviconEngineMode = mode;
      ls.set('sys_favicon_mode', mode);

      if (mode === 'custom_heads') {
        this.searchCustomHeads(this.customHeadSearch, this.customHeadCategory);
      } else {
        this.checkFaviconUser();
      }
    },

    searchCustomHeads(term, category) {
      if (term !== undefined) this.customHeadSearch = term;
      if (category !== undefined) this.customHeadCategory = category;

      if (this._customHeadSearchTimer) {
        clearTimeout(this._customHeadSearchTimer);
      }

      this._customHeadSearchTimer = setTimeout(async () => {
        const query = (this.customHeadSearch || '').trim();
        const cat = this.customHeadCategory || 'all';

        // Cargar catálogo base bajo demanda de forma asíncrona
        await loadCoreHeads().catch(() => {});

        if (query.length >= 2) {
          await loadExtendedHeadsDatabase().catch(() => {});
        }

        const directResolution = resolveMinecraftHeadInput(query);
        if (directResolution) {
          this.faviconStatus = 'valid';
          this.resolvedFaviconUrl = directResolution.url;
          this.faviconStatusMessage = `✓ "${directResolution.name}" reconocido`;
          if (directResolution.type === 'item') {
            this.selectedCustomHead = { n: directResolution.name, h: directResolution.hash, c: directResolution.category, t: directResolution.tags };
          }
        } else if (!query) {
          this.faviconStatusMessage = '';
        }

        const results = searchMinecraftHeads(query, cat, 48);
        this.customHeadResults = results;

        if (!this.selectedCustomHead && results.length > 0 && query.length >= 2) {
          const first = results[0];
          this.resolvedFaviconUrl = getHeadRenderUrl(first.h);
          this.faviconStatus = 'valid';
          this.faviconStatusMessage = `✓ Cabeza de "${first.n}" encontrada (${first.c})`;
        }
      }, 100);
    },

    selectCustomHead(headItem) {
      if (!headItem) return;
      this.selectedCustomHead = headItem;
      const headName = headItem.n || headItem.name || 'Cabeza Personalizada';
      const headHash = headItem.h || headItem.hash;
      const url = getHeadRenderUrl(headHash);

      this.resolvedFaviconUrl = url;
      this.faviconStatus = 'valid';
      this.faviconStatusMessage = `✓ Cabeza de "${headName}" seleccionada`;
    },

    applyCustomHeadFavicon(headItem) {
      const item = headItem || this.selectedCustomHead || (this.customHeadResults && this.customHeadResults[0]);
      if (!item) {
        const resolved = resolveMinecraftHeadInput(this.customHeadSearch);
        if (resolved) {
          this.activeFavicon = resolved.url;
          this.activeFaviconName = resolved.name;
          this.injectFaviconLink(resolved.url);
          ls.set('sys_active_favicon', resolved.url);
          ls.set('sys_active_favicon_name', resolved.name);
          window.Alpine?.store('app')?.toast(`✓ Favicon de "${resolved.name}" aplicado a la pestaña.`, 'success');
          return;
        }
        window.Alpine?.store('app')?.toast('Selecciona o busca un objeto primero.', 'warning');
        return;
      }

      this.selectCustomHead(item);
      const headName = item.n || item.name || 'Cabeza Personalizada';
      const headHash = item.h || item.hash;
      const url = getHeadRenderUrl(headHash);

      this.activeFavicon = url;
      this.activeFaviconName = headName;
      this.injectFaviconLink(url);

      ls.set('sys_active_favicon', url);
      ls.set('sys_active_favicon_name', headName);

      window.Alpine?.store('app')?.toast(`✓ Favicon de "${headName}" aplicado a la pestaña.`, 'success');
    },

    getCalculatedFaviconUrl(input) {
      if (!input || !input.trim()) return '/favicon.png';
      const clean = input.trim();
      if (clean.startsWith('http://') || clean.startsWith('https://') || clean.startsWith('data:')) {
        return clean;
      }
      return getHeadRenderUrl(clean);
    },

    getMinotarFallbackUrl(input) {
      if (!input || !input.trim()) return '/favicon.png';
      const clean = input.trim();
      if (clean.startsWith('http://') || clean.startsWith('https://') || clean.startsWith('data:')) {
        return clean;
      }
      return `https://minotar.net/cube/${encodeURIComponent(clean)}/128.png`;
    },

    checkFaviconUser() {
      if (this._faviconCheckTimer) {
        clearTimeout(this._faviconCheckTimer);
      }

      if (this.faviconEngineMode === 'custom_heads') {
        if (this.selectedCustomHead) {
          this.resolvedFaviconUrl = getHeadRenderUrl(this.selectedCustomHead.h || this.selectedCustomHead.hash);
          this.faviconStatus = 'valid';
          this.faviconStatusMessage = `✓ Objeto "${this.selectedCustomHead.n || this.selectedCustomHead.name}" listo`;
          return;
        }
        if (this.customHeadSearch) {
          const resolved = resolveMinecraftHeadInput(this.customHeadSearch);
          if (resolved) {
            this.resolvedFaviconUrl = resolved.url;
            this.faviconStatus = 'valid';
            this.faviconStatusMessage = `✓ Objeto "${resolved.name}" listo`;
            return;
          }
        }
        if (this.customHeadResults && this.customHeadResults.length > 0) {
          const first = this.customHeadResults[0];
          this.resolvedFaviconUrl = getHeadRenderUrl(first.h);
          this.faviconStatus = 'valid';
          this.faviconStatusMessage = `✓ Cabeza de "${first.n}" lista`;
          return;
        }
      }

      const input = (this.minecraftFaviconInput || '').trim();
      if (!input) {
        this.faviconStatus = 'idle';
        this.faviconStatusMessage = 'Ingresa un username de Minecraft o hash';
        this.resolvedFaviconUrl = '/favicon.png';
        return;
      }

      this.faviconStatus = 'checking';
      this.faviconStatusMessage = `Comprobando skin de "${input}"...`;

      this._faviconCheckTimer = setTimeout(() => {
        const primaryUrl = this.getCalculatedFaviconUrl(input);

        if (primaryUrl.startsWith('http://') || primaryUrl.startsWith('https://')) {
          const testImg = new Image();
          testImg.crossOrigin = 'anonymous';

          testImg.onload = () => {
            this.faviconStatus = 'valid';
            this.resolvedFaviconUrl = primaryUrl;
            this.faviconStatusMessage = `✓ Skin 3D de "${input}" verificada y lista`;
          };

          testImg.onerror = () => {
            const fallbackUrl = this.getMinotarFallbackUrl(input);
            const fallbackImg = new Image();
            fallbackImg.crossOrigin = 'anonymous';

            fallbackImg.onload = () => {
              this.faviconStatus = 'valid';
              this.resolvedFaviconUrl = fallbackUrl;
              this.faviconStatusMessage = `✓ Skin 3D verificada vía Minotar Engine`;
            };

            fallbackImg.onerror = () => {
              this.faviconStatus = 'error';
              this.resolvedFaviconUrl = '/favicon.png';
              this.faviconStatusMessage = `⚠ No se encontró la skin. Se usará el icono predeterminado.`;
            };

            fallbackImg.src = fallbackUrl;
          };

          testImg.src = primaryUrl;
        } else {
          this.faviconStatus = 'valid';
          this.resolvedFaviconUrl = primaryUrl;
          this.faviconStatusMessage = 'Icono local asignado';
        }
      }, 300);
    },

    applyMinecraftFavicon(customInput) {
      if (this.faviconEngineMode === 'custom_heads') {
        this.applyCustomHeadFavicon();
        return;
      }

      if (customInput) {
        this.minecraftFaviconInput = customInput;
      }
      const target = this.minecraftFaviconInput || 'Steve';
      const url = this.resolvedFaviconUrl || this.getCalculatedFaviconUrl(target);

      this.injectFaviconLink(url);
      this.activeFavicon = url;
      this.activeFaviconName = target;
      ls.set('sys_active_favicon', url);
      ls.set('sys_active_favicon_name', target);

      this.checkFaviconUser();
      window.Alpine?.store('app')?.toast(`✓ Favicon isométrico 3D de "${target}" aplicado a la pestaña.`, 'success');
    },

    injectFaviconLink(url) {
      if (typeof document === 'undefined') return;

      let link = document.querySelector("link[rel*='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.type = 'image/png';
      link.href = url;

      let shortcutLink = document.querySelector("link[rel='shortcut icon']");
      if (shortcutLink) {
        shortcutLink.href = url;
      }
    },

    resetFavicon() {
      this.injectFaviconLink('/favicon.png');
      this.activeFavicon = '';
      this.activeFaviconName = '';
      this.minecraftFaviconInput = 'Steve';
      this.selectedCustomHead = null;
      this.customHeadSearch = '';
      this.searchCustomHeads('');
      this.resolvedFaviconUrl = '/favicon.png';
      this.faviconStatus = 'idle';
      this.faviconStatusMessage = '';
      ls.remove('sys_active_favicon');
      ls.remove('sys_active_favicon_name');
      window.Alpine?.store('app')?.toast('Favicon predeterminado restaurado.', 'info');
    }
  };
}
