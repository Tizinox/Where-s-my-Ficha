/**
 * @file src/ui/views/tierlist/index.ts
 * Pantalla Principal: Creador de Tier List (Cyber HUD Rework) y sus subcomponentes.
 */

import { renderTierlistHeader } from './tierlistHeader';
import { renderTierlistBoard } from './tierlistBoard';
import { renderTierlistPool } from './tierlistPool';
import { renderTierlistMultiselectBar } from './tierlistMultiselectBar';
import { renderModalTierlistGuest } from './modalTierlistGuest';
import { renderModalTierlistBatchGuests } from './modalTierlistBatchGuests';
import { renderModalTierlistLists } from './modalTierlistLists';
import { renderModalTierlistIconPicker } from './modalTierlistIconPicker';
import { renderModalTierlistTierEditor } from './modalTierlistTierEditor';
import { renderModalTierlistTiermaker } from './modalTierlistTiermaker';
import { renderModalTierlistConfirm } from './modalTierlistConfirm';
import { renderModalTierlistDividerTitle } from './modalTierlistDividerTitle';
import { renderModalTierlistCustomTool } from './modalTierlistCustomTool';

const TIERLIST_MODALS = [
  renderModalTierlistGuest,
  renderModalTierlistBatchGuests,
  renderModalTierlistLists,
  renderModalTierlistIconPicker,
  renderModalTierlistTierEditor,
  renderModalTierlistTiermaker,
  renderModalTierlistConfirm,
  renderModalTierlistDividerTitle,
  renderModalTierlistCustomTool,
] as const;

export function renderTierlistView(): string {
  const modalsHtml = TIERLIST_MODALS.map((renderFn) => renderFn()).join('\n');

  return `<!-- ==============================================================
     PANTALLA PRINCIPAL: CREADOR DE TIER LIST [CYBER HUD REWORK]
     ============================================================== -->
<main id="main-tierlist-view" role="main" aria-label="Creador de Tier List"
  class="tierlist-fullscreen-view col-span-full w-full min-h-screen bg-transparent px-3 sm:px-6 lg:px-8 py-6 pb-40 flex flex-col items-center justify-start overflow-y-auto relative"
  :class="{ 'has-pattern-bg': $store.settings.tierlistBgMode === 'pattern', '!pt-2 !pb-12': $store.tierlist.isZenMode }" style="grid-column: 1 / -1; grid-row: 2;"
  @keydown.ctrl.z.window.prevent="$store.app.activeView === 'tierlist' && $store.tierlist.undo()"
  @keydown.ctrl.y.window.prevent="$store.app.activeView === 'tierlist' && $store.tierlist.redo()"
  @keydown.ctrl.shift.z.window.prevent="$store.app.activeView === 'tierlist' && $store.tierlist.redo()"
  @keydown.window="$store.app.activeView === 'tierlist' && $store.tierlist.handleGlobalKeydown($event)"
  x-show="$store.app.activeView === 'tierlist'" x-cloak>
  <template x-if="$store.app.isViewVisited('tierlist')">
  <div>
  <!-- Pinned Viewport Wallpaper / Fondo HUD de la Tier List -->
  <div class="fixed inset-0 z-0 pointer-events-none overflow-hidden w-screen h-screen"
    style="transform: translateZ(0); will-change: transform, filter;">
    <div class="absolute inset-0" style="background-color: var(--wiki-bg-outer, #07090d);"></div>

    <template x-if="$store.settings.tierlistBgMode === 'pattern'">
      <div class="absolute inset-0 pointer-events-none"
        :style="\`background-image: radial-gradient(circle at 50% 0%, rgba(\${($store.settings.rgbChannels || '0, 240, 255')}, 0.12) 0%, transparent 65%), linear-gradient(to right, rgba(255, 255, 255, 0.025) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.025) 1px, transparent 1px); background-size: 100% 100%, 28px 28px, 28px 28px;\`">
      </div>
    </template>

    <template x-if="$store.settings.tierlistBgMode === 'custom' && $store.settings.tierlistBgUrl">
      <div class="relative w-full h-full overflow-hidden">
        <img :src="$store.app.getOptimizedImageUrl($store.settings.tierlistBgUrl)"
          class="w-full h-full object-cover transition-opacity duration-300 pointer-events-none" fetchpriority="high" decoding="async"
          :style="$store.settings.getTierlistBgStyle()"
          alt="Fondo Tier List" />
        <div class="absolute inset-0 pointer-events-none"
          :style="\`background-color: var(--wiki-bg-outer, #07090d); opacity: \${($store.settings.tierlistBgOpacity ?? 65) / 100};\`"></div>
      </div>
    </template>

    <template x-if="$store.settings.tierlistBgMode === 'sync'">
      <div class="relative w-full h-full overflow-hidden">
        <template x-if="$store.settings.dashboardBgMode === 'custom' && $store.settings.dashboardBgUrl">
          <div class="relative w-full h-full">
            <img :src="$store.app.getOptimizedImageUrl($store.settings.dashboardBgUrl)"
              class="w-full h-full object-cover transition-opacity duration-300 pointer-events-none" fetchpriority="high" decoding="async"
              :style="$store.settings.getDashboardBgStyle()"
              alt="Fondo Sincronizado Tier List" />
            <div class="absolute inset-0 pointer-events-none"
              :style="\`background-color: var(--wiki-bg-outer, #07090d); opacity: \${($store.settings.dashboardBgOpacity ?? 60) / 100};\`"></div>
          </div>
        </template>
        <template x-if="$store.settings.dashboardBgMode === 'dynamic' && ($store.characters.active?.basics?.bannerDataUrl || $store.characters.active?.presentation?.background?.image || $store.characters.list?.[0]?.basics?.bannerDataUrl)">
          <div class="relative w-full h-full">
            <img :src="$store.app.getOptimizedImageUrl($store.characters.active?.basics?.bannerDataUrl || $store.characters.active?.presentation?.background?.image || $store.characters.list?.[0]?.basics?.bannerDataUrl)"
              class="w-full h-full object-cover transition-opacity duration-300 pointer-events-none" fetchpriority="high" decoding="async"
              :style="$store.settings.getDashboardBgStyle()"
              alt="Fondo Dinámico Sincronizado Tier List" />
            <div class="absolute inset-0 pointer-events-none"
              :style="\`background-color: var(--wiki-bg-outer, #07090d); opacity: \${($store.settings.dashboardBgOpacity ?? 60) / 100};\`"></div>
          </div>
        </template>
        <template x-if="$store.settings.dashboardBgMode === 'pattern' || ($store.settings.dashboardBgMode === 'custom' && !$store.settings.dashboardBgUrl) || ($store.settings.dashboardBgMode === 'dynamic' && !$store.characters.active?.basics?.bannerDataUrl && !$store.characters.active?.presentation?.background?.image && !$store.characters.list?.[0]?.basics?.bannerDataUrl)">
          <div class="absolute inset-0 pointer-events-none"
            :style="\`background-image: radial-gradient(circle at 50% 0%, rgba(\${($store.settings.rgbChannels || '0, 240, 255')}, 0.12) 0%, transparent 65%), linear-gradient(to right, rgba(255, 255, 255, 0.025) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.025) 1px, transparent 1px); background-size: 100% 100%, 28px 28px, 28px 28px;\`">
          </div>
        </template>
      </div>
    </template>
  </div>

  <!-- Contenedor Principal (Centrado y Max Width) -->
  <div class="w-full max-w-[1440px] flex flex-col gap-6 relative z-10 transition-all duration-300"
    :class="$store.tierlist.isZenMode ? 'max-w-[1600px] gap-4' : ''">

    <!-- ──── Barra Superior Flotante en MODO ZEN ──── -->
    <div x-show="$store.tierlist.isZenMode" x-transition
      data-protect-contrast="true" class="sticky top-2 z-[60] w-full flex items-center justify-between gap-3 p-3 rounded-2xl border backdrop-blur-xl bg-black/80 border-white/15 shadow-[0_12px_40px_rgba(0,0,0,0.8)]">
      <div class="flex items-center gap-3 min-w-0">
        <div class="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border"
          :style="'background: ' + ($store.settings.accentColor || '#00f0ff') + '20; border-color: ' + ($store.settings.accentColor || '#00f0ff') + '60;'">
          <i data-lucide="trophy" class="w-4 h-4" :style="'color: ' + ($store.settings.accentColor || '#00f0ff')"></i>
        </div>
        <div class="min-w-0">
          <div class="flex items-center gap-2 flex-wrap">
            <h2 class="text-sm sm:text-base font-title font-black tracking-wide text-white truncate"
              x-text="$store.tierlist.activeListName || 'Clasificación General'"></h2>
            <span class="px-2 py-0.5 rounded-full text-[9px] font-mono uppercase tracking-wider font-extrabold flex items-center gap-1"
              :style="'background: ' + ($store.settings.accentColor || '#00f0ff') + '20; color: ' + ($store.settings.accentColor || '#00f0ff') + '; border: 1px solid ' + ($store.settings.accentColor || '#00f0ff') + '50;'">
              <span class="w-1.5 h-1.5 rounded-full animate-ping" :style="'background-color: ' + ($store.settings.accentColor || '#00f0ff')"></span>
              <span>Modo Zen</span>
            </span>
          </div>
          <p class="text-[11px] font-mono text-slate-400 truncate">
            <strong class="text-white" x-text="$store.tierlist.assignedCount"></strong> operativos clasificados en <span class="text-slate-300" x-text="\`\${$store.tierlist.tiers.length} rangos\`"></span>
          </p>
        </div>
      </div>

      <div class="flex items-center gap-2 shrink-0">
        <button type="button" @click="$store.tierlist.toggleZenShowPool()"
          class="px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
          :class="$store.tierlist.zenShowPool ? 'bg-white/15 border-white/30 text-white' : 'bg-white/5 border-white/10 text-slate-300 hover:text-white hover:bg-white/10'"
          title="Mostrar u ocultar banco de reserva en Modo Zen">
          <i data-lucide="users" class="w-4 h-4"></i>
          <span class="hidden sm:inline" x-text="$store.tierlist.zenShowPool ? 'Ocultar Banco' : 'Ver Banco'"></span>
        </button>

        <button type="button" @click="$store.tierlist.toggleNativeFullscreen()"
          class="px-2.5 sm:px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-slate-300 hover:text-white text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
          title="Alternar Pantalla Completa nativa (F11)">
          <i data-lucide="maximize" class="w-4 h-4"></i>
          <span class="hidden md:inline">Pantalla Completa</span>
        </button>

        <button type="button" @click="$store.tierlist.toggleZenMode(false)"
          class="px-3 sm:px-4 py-1.5 rounded-xl font-mono font-black text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md hover:scale-[1.03] active:scale-98"
          :style="'background: ' + ($store.settings.accentColor || '#00f0ff') + '; color: #000; box-shadow: 0 0 15px ' + ($store.settings.accentColor || '#00f0ff') + '80;'"
          title="Salir de Modo Zen (Tecla Esc o Z)">
          <i data-lucide="x" class="w-4 h-4 stroke-[2.5]"></i>
          <span>Salir</span>
          <kbd class="kbd-badge text-[9px] px-1 py-0.2 rounded bg-black/30 text-black/80 font-mono hidden sm:inline">ESC</kbd>
        </button>
      </div>
    </div>

    <!-- ──── Header Estándar de la Tier List (Oculto en Modo Zen) ──── -->
    <div x-show="!$store.tierlist.isZenMode" x-transition>
      ${renderTierlistHeader()}
    </div>

    <!-- Contenedor Reordenable: Tablero y Banco -->
    <div class="flex flex-col gap-6"
      :class="$store.tierlist.poolPosition === 'top' ? 'flex-col-reverse' : 'flex-col'">
      ${renderTierlistBoard()}

      <div x-show="!$store.tierlist.isZenMode || $store.tierlist.zenShowPool" x-transition>
        ${renderTierlistPool()}
      </div>
    </div>

  </div>

  <!-- ════ MODALES DE SISTEMA DE TIER LIST ════ -->
  ${modalsHtml}

  <!-- ════ BARRA FLOTANTE DE SELECCIÓN MÚLTIPLE ════ -->
  ${renderTierlistMultiselectBar()}

  </div>
  </template>
</main>`;
}

