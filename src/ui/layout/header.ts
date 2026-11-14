/**
 * @file src/ui/layout/header.ts
 * Barra superior Wiki Fandom con navegación principal y controles de ficha.
 */

import { type MainNavTabConfig, renderMainNavTab } from '@ui/components/uiPrimitives';

const MAIN_NAV_TABS: MainNavTabConfig[] = [
  { id: 'characters', viewName: 'dashboard', label: 'Archivo de Fichas', shortLabel: 'Fichas', clickExpr: '$store.app.openDashboardView()' },
  { id: 'tierlist', viewName: 'tierlist', label: 'Tier List', clickExpr: '$store.app.openTierListView()' },
  { id: 'settings', viewName: 'settings', label: 'Configuración', clickExpr: '$store.settings.openModal()' },
];

export function renderHeader(): string {
  return `<!-- ==============================================================
     HEADER BAR — WIKI FANDOM FLAT TOP BAR
     ============================================================== -->
<header id="app-header" data-protect-contrast="true" class="sticky top-0 z-40 w-full border-b"
  style="background-color: var(--wiki-bg-header); border-color: var(--wiki-border);"
  :class="{ '!hidden': $store.app.activeView === 'tierlist' && $store.tierlist.isZenMode }">
  <div class="w-full max-w-[1240px] mx-auto px-2 sm:px-4 h-14 flex items-center justify-between gap-2 sm:gap-3 min-w-0">

    <!-- Izquierda: Identidad de la Wiki, Navegación Principal y Contexto -->
    <div class="flex items-center gap-2 lg:gap-4 min-w-0 flex-1 overflow-hidden">
      <a href="#" id="brand-logo" @click.prevent="$store.app.openDashboardView()"
        class="flex items-center gap-2 text-decoration-none group shrink-0"
        title="Where's my Ficha — Archivo Central">
        <img src="/favicon.png" alt="Logo" class="w-7 h-7 object-contain border p-0.5 shrink-0"
          style="border-color: var(--wiki-border-strong);" />
        <div class="flex-col" :class="$store.app.activeView === 'editor' ? 'hidden 2xl:flex' : 'flex'">
          <span style="font-family: var(--font-display); letter-spacing: 0.06em;"
            class="text-xs sm:text-sm font-bold text-[#e4e4e9] group-hover:text-[var(--wiki-accent)] transition-colors leading-tight whitespace-nowrap">
            WHERE'S MY FICHA
          </span>
          <span class="text-[9px] sm:text-[10px] uppercase tracking-widest hidden xl:inline whitespace-nowrap" style="color: var(--wiki-text-muted);">
            Compendio &amp; Wiki de Personajes
          </span>
        </div>
      </a>

      <!-- Navegación Principal estilo Wiki (Pestañas Superiores) -->
      <nav id="main-nav-tabs" class="hidden md:flex items-center gap-0.5 shrink-0">${MAIN_NAV_TABS.map(renderMainNavTab).join('')}
      </nav>

      <!-- Contexto del Personaje Activo cuando se está en el Editor -->
      <div x-show="$store.app.activeView === 'editor'" class="flex items-center gap-1.5 min-w-0 flex-1 overflow-hidden">
        <button id="btn-back-to-dashboard" type="button"
          class="souls-btn text-[11px] py-1 px-2 shrink-0 whitespace-nowrap"
          @click="$store.app.openDashboardView()" title="Regresar al Archivo de Fichas">
          <i data-lucide="arrow-left" class="w-3.5 h-3.5"></i>
          <span class="hidden sm:inline md:hidden">Fichas</span>
        </button>

        <span class="text-xs font-serif font-semibold text-[#e4e4e9] truncate min-w-0 flex-1 max-w-[180px]"
          x-text="$store.characters.active?.name || 'Ficha sin título'"></span>

        <!-- Favorito & Bloqueo -->
        <div class="flex items-center gap-1 shrink-0">
          <button type="button" @click="$store.characters.toggleFavorite($store.characters.activeId)"
            class="p-1 border transition-colors text-xs flex items-center justify-center shrink-0 cursor-pointer"
            :class="$store.characters.active?.isFavorite ? 'border-amber-400/50 text-amber-300 bg-amber-500/10' : 'border-white/10 text-white/40 hover:text-amber-300'"
            :title="$store.characters.active?.isFavorite ? 'Ficha Favorita ★' : 'Marcar como favorita ★'">
            <i data-lucide="star" class="w-3.5 h-3.5" :class="{ 'fill-amber-400 text-amber-400': $store.characters.active?.isFavorite }"></i>
          </button>
          <button type="button" @click="$store.characters.toggleLocked($store.characters.activeId)"
            class="p-1 border transition-colors text-xs flex items-center justify-center shrink-0 cursor-pointer"
            :class="$store.characters.active?.isLocked ? 'border-amber-400/50 text-amber-300 bg-amber-500/10' : 'border-white/10 text-white/40 hover:text-white'"
            :title="$store.characters.active?.isLocked ? 'Ficha protegida contra edición 🔒' : 'Proteger ficha contra edición 🔓'">
            <i :data-lucide="$store.characters.active?.isLocked ? 'lock' : 'unlock'" class="w-3.5 h-3.5"></i>
          </button>
        </div>

        <!-- Barra de Completitud de Ficha -->
        <div id="header-completeness-bar"
          x-show="!$store.settings.hideCompletenessBar && $store.characters.active"
          class="hidden xl:flex items-center gap-1.5 px-2 py-0.5 border border-white/10 bg-black/20 text-[10px] font-mono shrink-0 whitespace-nowrap"
          :title="\`Completitud de la ficha: \${$store.characters.overallCompletion || 0}%\`">
          <div class="w-10 h-1.5 bg-white/10 overflow-hidden" data-protect-radius="true">
            <div class="h-full transition-all duration-300"
              :style="\`background-color: var(--wiki-accent); width: \${$store.characters.overallCompletion || 0}%;\`"></div>
          </div>
          <span class="text-[var(--wiki-text-muted)] tabular-nums" x-text="\`\${$store.characters.overallCompletion || 0}%\`"></span>
        </div>
      </div>

      <!-- Acceso rápido a la última ficha activa (en Dashboard / Tier List) -->
      <button id="btn-recent-sheet" type="button"
        x-show="$store.app.activeView !== 'editor' && $store.app.activeView !== 'settings' && !$store.settings.hideRecentSheetButton && $store.characters.active"
        x-cloak
        @click="$store.app.openEditorView()"
        class="souls-btn text-[11px] py-1 px-2.5 hidden xl:inline-flex items-center gap-1.5 min-w-0 max-w-[165px] shrink"
        title="Abrir última ficha activa">
        <i data-lucide="history" class="w-3.5 h-3.5 shrink-0"></i>
        <span class="truncate" x-text="$store.characters.active?.name || 'Ficha reciente'"></span>
      </button>
    </div>

    <!-- Derecha: Estado, Modos y Acciones Rápidas -->
    <div class="flex items-center gap-1.5 sm:gap-2 shrink-0">

      <!-- Switch Modo Edición vs Vista Previa (En Editor) -->
      <div x-show="$store.app.activeView === 'editor'" class="flex items-center border border-white/15 shrink-0" role="group">
        <button id="btn-mode-preview" type="button"
          class="souls-btn text-[11px] py-1 px-2 !border-0 cursor-pointer whitespace-nowrap"
          :class="!$store.app.editMode ? 'souls-btn-primary' : 'text-slate-300'"
          @click="$store.app.editMode && $store.app.toggleEditMode()"
          title="Vista Previa estilo Artículo Wiki (Ctrl + P)">
          <i data-lucide="book-open" class="w-3.5 h-3.5 shrink-0"></i>
          <span class="hidden lg:inline">Artículo</span>
        </button>
        <button id="btn-mode-edit" type="button"
          class="souls-btn text-[11px] py-1 px-2 !border-0 border-l border-white/10 cursor-pointer whitespace-nowrap"
          :class="$store.app.editMode ? 'souls-btn-primary' : 'text-slate-300'"
          @click="$store.characters.active?.isLocked ? $store.app.toast('Ficha protegida contra edición.', 'warning') : ($store.app.editMode || $store.app.toggleEditMode())"
          title="Modo Edición estilo Menú Dark Souls (Ctrl + E)">
          <i data-lucide="edit-3" class="w-3.5 h-3.5 shrink-0"></i>
          <span class="hidden lg:inline">Editar</span>
        </button>
      </div>

      <!-- Exportar Ficha (Auto PDF en Ficha B / Imagen PNG en Ficha A) -->
      <button id="btn-export-sheet" type="button"
        x-show="$store.app.activeView === 'editor' && $store.characters.active"
        @click="$store.app.openExportModal(null)"
        class="souls-btn text-[11px] py-1 px-2 cursor-pointer shrink-0 whitespace-nowrap"
        :title="$store.characters.active?.sheetType === 'classic' ? 'Exportar Ficha B como PDF organizado con imágenes' : 'Exportar ficha como imagen legible, PDF, Discord o JSON'">
        <i data-lucide="file-image" class="w-3.5 h-3.5 shrink-0"></i>
        <span class="hidden lg:inline" x-text="$store.characters.active?.sheetType === 'classic' ? 'Exportar PDF' : 'Exportar'"></span>
      </button>

      <!-- Estado de Auto-Guardado -->
      <div class="flex items-center no-print shrink-0" x-show="$store.characters.active" x-cloak>
        <template x-if="$store.characters.saveStatus === 'saving'">
          <span class="text-[11px] font-mono text-[var(--wiki-accent)] flex items-center gap-1 whitespace-nowrap">
            <i data-lucide="loader-2" class="w-3.5 h-3.5 animate-spin"></i>
            <span class="hidden xl:inline">Guardando...</span>
          </span>
        </template>
        <template x-if="$store.characters.saveStatus === 'pending'">
          <button type="button" @click="$store.characters.forceSave()"
            class="souls-btn text-[11px] py-1 px-2 !border-amber-500/50 text-amber-300 hover:bg-amber-500/10 cursor-pointer whitespace-nowrap"
            title="Cambios pendientes. Clic o Ctrl+S para guardar">
            <span class="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
            <span class="hidden xl:inline">Guardar</span>
          </button>
        </template>
        <template x-if="$store.characters.saveStatus === 'saved' || $store.characters.saveStatus === 'idle'">
          <span class="text-[11px] font-mono text-emerald-400/90 flex items-center gap-1 select-none whitespace-nowrap"
            title="Todos los cambios guardados">
            <i data-lucide="check" class="w-3.5 h-3.5"></i>
            <span class="hidden xl:inline">Guardado</span>
          </span>
        </template>
        <template x-if="$store.characters.saveStatus === 'error'">
          <button type="button" @click="$store.characters.forceSave()"
            class="souls-btn text-[11px] py-1 px-2 !border-rose-500/50 text-rose-400 hover:bg-rose-500/10 cursor-pointer whitespace-nowrap"
            title="Error al guardar. Clic para reintentar">
            <i data-lucide="alert-circle" class="w-3.5 h-3.5"></i>
            <span class="hidden xl:inline">Error</span>
          </button>
        </template>
      </div>

      <!-- Botón + Nueva Ficha -->
      <button type="button" id="btn-new-character"
        class="souls-btn souls-btn-primary text-xs py-1 px-2.5 cursor-pointer inline-flex items-center gap-1.5 shrink-0 whitespace-nowrap"
        @click="$store.characters.createNew()" title="Crear nueva ficha de personaje">
        <i data-lucide="plus" class="w-3.5 h-3.5 shrink-0"></i>
        <span class="hidden lg:inline">Nueva Ficha</span>
        <span class="hidden sm:inline lg:hidden">Nueva</span>
      </button>

      <!-- Utilidades: Consola de comandos & Atajos -->
      <button id="btn-dev-console" type="button" @click="$store.devConsole.toggleModal()"
        class="souls-btn text-xs py-1 px-2 cursor-pointer no-print shrink-0" title="Consola de Comandos (Ctrl + \`)">
        <i data-lucide="terminal" class="w-3.5 h-3.5"></i>
      </button>
      <button type="button" @click="$store.app.toggleHotkeysModal()"
        class="souls-btn text-xs py-1 px-2 cursor-pointer no-print hidden xl:inline-flex shrink-0" title="Guía de Atajos (Shift + ?)">
        <i data-lucide="keyboard" class="w-3.5 h-3.5"></i>
      </button>

    </div>

  </div>
</header>`;
}
