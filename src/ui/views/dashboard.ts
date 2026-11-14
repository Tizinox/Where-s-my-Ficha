/**
 * @file src/ui/views/dashboard.ts
 * Pantalla Principal: Archivo & Hub estilo Fandom Wiki.
 */

const DASHBOARD_SORT_OPTIONS = [
  { value: 'updated', label: 'Última edición' },
  { value: 'name_asc', label: 'Nombre (A - Z)' },
  { value: 'name_desc', label: 'Nombre (Z - A)' },
  { value: 'created', label: 'Fecha de creación' },
] as const;

function renderDropOverlay(): string {
  return `
  <!-- Drag and drop sutil para importar JSON -->
  <div x-show="isDraggingFiles" x-cloak
    class="fixed inset-0 z-50 pointer-events-none flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
    <div class="p-8 border-2 border-dashed text-center max-w-md bg-[var(--wiki-bg-canvas)]"
      style="border-color: var(--wiki-accent);">
      <i data-lucide="upload-cloud" class="w-10 h-10 mx-auto mb-2 text-[var(--wiki-accent)]"></i>
      <h3 class="font-display text-lg uppercase font-bold text-white mb-1">Soltar Fichas JSON Aquí</h3>
      <p class="text-xs text-slate-300">Importación automática para archivos individuales o múltiples.</p>
    </div>
  </div>`;
}

function renderCommunityBanner(): string {
  return `
    <!-- 1. BANNER DE CABECERA DE COMUNIDAD ESTILO FANDOM WIKI -->
    <div class="fandom-community-banner">
      <div class="fandom-community-banner-content">

        <!-- Blasón y Título de la Wiki -->
        <div class="fandom-community-brand-block">
          <div class="fandom-community-avatar">
            <img src="/favicon.png" alt="Wiki Crest" />
          </div>
          <div class="fandom-community-meta">
            <span class="fandom-community-badge">
              <i data-lucide="compass" class="w-3 h-3"></i>
              <span>Compendio &amp; Archivo Central</span>
            </span>
            <h1 class="fandom-community-title">Where's my Ficha Wiki</h1>
          </div>
        </div>

        <!-- Métricas y Acción Principal -->
        <div class="fandom-community-actions">
          <div class="fandom-community-stats">
            <div class="fandom-stat-item">
              <span class="fandom-stat-val" x-text="$store.characters.list.length">0</span>
              <span class="fandom-stat-lbl">Fichas</span>
            </div>
            <div class="fandom-stat-divider"></div>
            <div class="fandom-stat-item">
              <span class="fandom-stat-val" x-text="$store.characters.folders.length">0</span>
              <span class="fandom-stat-lbl">Categorías</span>
            </div>
          </div>

          <button type="button" class="souls-btn souls-btn-primary py-2 px-4 text-xs font-semibold"
            @click="$store.characters.createNew()" title="Crear nueva ficha de personaje">
            <i data-lucide="plus" class="w-4 h-4"></i>
            <span>+ Crear Ficha</span>
          </button>
        </div>

      </div>

      <!-- Sub-navegación estilo Fandom (Pestañas de Categorías y Filtros) -->
      <div class="fandom-community-subnav">
        <div class="fandom-subnav-tabs">
          <button type="button" class="fandom-subnav-tab"
            :class="{ 'is-active': $store.characters.activeFolderId === 'all' && !$store.characters.filterFavorite }"
            @click="$store.characters.filterFavorite = false; $store.characters.setActiveFolder('all')">
            <i data-lucide="layers" class="w-3.5 h-3.5"></i>
            <span>Todas las Fichas</span>
            <span class="opacity-60 text-xs" x-text="\`(\${$store.characters.list.length})\`"></span>
          </button>

          <button type="button" class="fandom-subnav-tab"
            :class="{ 'is-active': $store.characters.filterFavorite }"
            @click="$store.characters.filterFavorite = !$store.characters.filterFavorite; $store.characters.currentPage = 1">
            <i data-lucide="star" class="w-3.5 h-3.5 text-amber-400"></i>
            <span>Favoritas</span>
            <span class="opacity-60 text-xs" x-text="\`(\${$store.characters.list.filter(c => c.isFavorite).length})\`"></span>
          </button>

          <button type="button" class="fandom-subnav-tab"
            x-show="$store.characters.folders.length > 0"
            :class="{
              'is-active': $store.characters.activeFolderId === 'unassigned' && !$store.characters.filterFavorite,
              '!border-dashed !border-[var(--wiki-accent)] !bg-[var(--wiki-accent-dim)]': $store.characters.dragOverFolderId === 'unassigned'
            }"
            @click="$store.characters.filterFavorite = false; $store.characters.setActiveFolder('unassigned')"
            @dragover.prevent="$store.characters.handleDragOverFolder($event, 'unassigned')"
            @dragleave.prevent="$store.characters.handleDragLeaveFolder($event, 'unassigned')"
            @drop.stop.prevent="$store.characters.handleDropOnFolder($event, 'unassigned')"
            title="Fichas sin carpeta (suelta una ficha aquí para sacarla de su carpeta)">
            <i data-lucide="folder" class="w-3.5 h-3.5 opacity-70"></i>
            <span>Sin Carpeta</span>
            <span class="opacity-60 text-xs" x-text="\`(\${$store.characters.unassignedCharCount})\`"></span>
          </button>

          <!-- Carpetas y Universos Dinámicos -->
          <template x-for="folder in $store.characters.folders" :key="folder.id">
            <button type="button" class="fandom-subnav-tab"
              :class="{
                'is-active': $store.characters.activeFolderId === folder.id && !$store.characters.filterFavorite,
                '!border-dashed !border-[var(--wiki-accent)] !bg-[var(--wiki-accent-dim)]': $store.characters.dragOverFolderId === folder.id
              }"
              @click="$store.characters.filterFavorite = false; $store.characters.setActiveFolder(folder.id)"
              @dragover.prevent="$store.characters.handleDragOverFolder($event, folder.id)"
              @dragleave.prevent="$store.characters.handleDragLeaveFolder($event, folder.id)"
              @drop.stop.prevent="$store.characters.handleDropOnFolder($event, folder.id)"
              :title="\`Abrir carpeta «\${folder.name}» (también puedes soltar tarjetas aquí)\`">
              <span class="w-2 h-2 rounded-full inline-block shrink-0" :style="\`background-color: \${folder.color || 'var(--wiki-accent)'};\`"></span>
              <span x-text="folder.name"></span>
              <span class="opacity-60 text-xs" x-text="\`(\${$store.characters.getFolderCharCount(folder.id)})\`"></span>
            </button>
          </template>

          <!-- Botón Añadir Categoría -->
          <button type="button" class="fandom-subnav-tab text-[var(--wiki-accent)]"
            @click="$store.characters.openCreateFolderModal()" title="Crear nueva carpeta o categoría de universo">
            <i data-lucide="folder-plus" class="w-3.5 h-3.5"></i>
            <span>+ Categoría</span>
          </button>
        </div>
      </div>

      <!-- Barra Contextual de Carpeta Activa -->
      <template x-if="$store.characters.activeFolder && !$store.characters.filterFavorite">
        <div class="mt-2 px-3 py-2 bg-[var(--wiki-bg-elevated)] border border-[var(--wiki-border-strong)] flex flex-wrap items-center justify-between gap-2 text-xs"
          x-data="{ openAddChars: false }">
          <div class="flex items-center gap-2 min-w-0">
            <span class="w-4 h-4 inline-flex items-center justify-center shrink-0"
              x-html="$store.characters.renderFolderIconSvg($store.characters.activeFolder.icon, 'w-4 h-4', $store.characters.activeFolder.color || 'var(--wiki-accent)')"></span>
            <span class="font-semibold text-white truncate" x-text="$store.characters.activeFolder.name"></span>
            <span class="text-slate-400 font-mono text-[11px]"
              x-text="\`· \${$store.characters.getFolderCharCount($store.characters.activeFolder.id)} ficha(s)\`"></span>
          </div>

          <div class="flex items-center gap-1.5 flex-wrap relative">
            <div class="relative" @click.outside="openAddChars = false">
              <button type="button" class="souls-btn souls-btn-primary text-[11px] py-1 px-2.5 cursor-pointer flex items-center gap-1"
                @click="openAddChars = !openAddChars">
                <i data-lucide="plus" class="w-3 h-3"></i>
                <span>Meter Fichas</span>
              </button>

              <div x-show="openAddChars" x-cloak
                class="absolute right-0 top-full mt-1 w-64 max-h-64 overflow-y-auto p-1.5 bg-[var(--wiki-bg-elevated)] border border-[var(--wiki-border-strong)] z-40 shadow-xl space-y-0.5">
                <div class="px-2 py-1 text-[10px] font-mono uppercase text-slate-400 border-b border-white/10">
                  Añadir a «<span x-text="$store.characters.activeFolder.name"></span>»
                </div>
                <template x-for="cand in $store.characters.list.filter(c => c.folderId !== $store.characters.activeFolderId)" :key="cand.id">
                  <button type="button"
                    @click="$store.characters.moveCharacterToFolder(cand.id, $store.characters.activeFolderId)"
                    class="w-full text-left px-2 py-1.5 hover:bg-white/10 flex items-center justify-between gap-2 text-slate-200 cursor-pointer">
                    <span class="truncate" x-text="cand.name || cand.basics?.fullName || 'Sin Nombre'"></span>
                    <span class="text-[10px] font-mono text-[var(--wiki-accent)] shrink-0">+ Meter</span>
                  </button>
                </template>
                <div x-show="$store.characters.list.filter(c => c.folderId !== $store.characters.activeFolderId).length === 0"
                  class="px-2 py-2 text-[11px] text-slate-400 italic text-center">
                  Todas las fichas ya están en esta carpeta.
                </div>
              </div>
            </div>

            <button type="button" class="souls-btn text-[11px] py-1 px-2 cursor-pointer flex items-center gap-1"
              @click="$store.characters.openEditFolderModal($store.characters.activeFolder)" title="Editar carpeta">
              <i data-lucide="pencil" class="w-3 h-3"></i>
              <span>Editar</span>
            </button>

            <button type="button" class="souls-btn text-[11px] py-1 px-2 cursor-pointer !text-rose-400 flex items-center gap-1"
              @click="$store.characters.confirmDeleteFolder($store.characters.activeFolder)" title="Eliminar carpeta">
              <i data-lucide="trash-2" class="w-3 h-3"></i>
              <span>Eliminar</span>
            </button>
          </div>
        </div>
      </template>
    </div>`;
}

function renderSearchAndSortBar(): string {
  const optionsHtml = DASHBOARD_SORT_OPTIONS.map(
    (opt) => `<option value="${opt.value}">${opt.label}</option>`,
  ).join('\n          ');

  return `
    <!-- 2. BARRA DE BÚSQUEDA Y ORDEN -->
    <div class="fandom-search-bar-row">
      <div class="fandom-search-field">
        <i data-lucide="search" class="w-4 h-4 fandom-search-icon"></i>
        <input type="text"
          x-model="$store.characters.searchQuery"
          placeholder="Buscar artículos por nombre, rol, apodo o universo en la Wiki..."
          aria-label="Buscar en la Wiki"
          class="fandom-search-input" />
        <button type="button" x-show="$store.characters.searchQuery" @click="$store.characters.searchQuery = ''"
          class="fandom-search-clear" title="Limpiar búsqueda">
          <i data-lucide="x" class="w-4 h-4"></i>
        </button>
      </div>

      <!-- Controles de Vista y Orden -->
      <div class="flex flex-wrap items-center gap-3 shrink-0">
        <!-- Selector de Modo de Vista (Cuadrícula vs Panorámica) -->
        <div class="wiki-segmented" role="group" aria-label="Tipo de vista del archivo">
          <button
            type="button"
            class="wiki-segmented-btn"
            :class="$store.characters.rosterViewMode !== 'banner' ? 'is-active' : ''"
            @click="$store.characters.setRosterViewMode('grid')"
            title="Vista en cuadrícula de tarjetas"
          >
            <i data-lucide="layout-grid" class="w-3.5 h-3.5 shrink-0"></i>
            <span>Cuadrícula</span>
          </button>
          <button
            type="button"
            class="wiki-segmented-btn"
            :class="$store.characters.rosterViewMode === 'banner' ? 'is-active' : ''"
            @click="$store.characters.setRosterViewMode('banner')"
            title="Vista panorámica horizontal 16:5"
          >
            <i data-lucide="rows-3" class="w-3.5 h-3.5 shrink-0"></i>
            <span>Panorámica</span>
          </button>
        </div>

        <!-- Selector de Orden -->
        <div class="fandom-sort-field">
          <label class="fandom-sort-label">Ordenar por:</label>
          <select x-model="$store.characters.sortBy" class="souls-input text-xs py-1.5 px-2.5">
            ${optionsHtml}
          </select>
        </div>
      </div>
    </div>`;
}

function renderSkeletonAndEmpty(): string {
  return `
      <!-- Esqueleto de Carga (Cuadrícula) -->
      <template x-if="$store.characters.loading && $store.characters.rosterViewMode !== 'banner'">
        <div class="fandom-roster-grid">
          <template x-for="i in 6" :key="\`skel-\${i}\`">
            <div class="fandom-card animate-pulse">
              <div class="fandom-card-thumb bg-white/5"></div>
              <div class="fandom-card-body space-y-2">
                <div class="h-5 w-3/4 bg-white/10"></div>
                <div class="h-3 w-1/2 bg-white/5"></div>
              </div>
            </div>
          </template>
        </div>
      </template>

      <!-- Esqueleto de Carga (Panorámica) -->
      <template x-if="$store.characters.loading && $store.characters.rosterViewMode === 'banner'">
        <div class="fandom-roster-banner-grid">
          <template x-for="i in 4" :key="\`skel-banner-\${i}\`">
            <div class="fandom-card fandom-card-banner animate-pulse">
              <div class="fandom-banner-inner">
                <div class="flex items-center gap-3.5">
                  <div class="w-16 h-16 bg-white/10 shrink-0"></div>
                  <div class="flex-1 space-y-2">
                    <div class="h-5 w-1/2 bg-white/10"></div>
                    <div class="h-3 w-2/3 bg-white/5"></div>
                  </div>
                </div>
                <div class="h-3 w-1/3 bg-white/5"></div>
              </div>
            </div>
          </template>
        </div>
      </template>

      <!-- Estado Vacío -->
      <template x-if="!$store.characters.loading && $store.characters.paginatedList.length === 0">
        <div class="p-12 text-center bg-[var(--wiki-bg-canvas)] border border-[var(--wiki-border-strong)] max-w-lg mx-auto">
          <i data-lucide="book-open" class="w-10 h-10 mx-auto text-slate-500 mb-3"></i>
          <h3 class="font-wiki-serif text-lg text-white mb-1">No se encontraron artículos</h3>
          <p class="text-xs text-slate-400 mb-4">No hay personajes registrados en esta categoría o con este criterio de búsqueda.</p>
          <div class="flex items-center justify-center gap-2">
            <button type="button" class="souls-btn text-xs py-1.5 px-3"
              @click="$store.characters.clearDashboardFilters(); $store.characters.setActiveFolder('all');">
              Ver Todas las Fichas
            </button>
            <button type="button" class="souls-btn souls-btn-primary text-xs py-1.5 px-3"
              @click="$store.characters.createNew()">
              + Crear Primera Ficha
            </button>
          </div>
        </div>
      </template>`;
}

function renderBannerCharacterCards(): string {
  return `
      <!-- Vista Panorámica Horizontal 16:5 (Banner Mode) -->
      <div class="fandom-roster-banner-grid" x-show="!$store.characters.loading && $store.characters.paginatedList.length > 0 && $store.characters.rosterViewMode === 'banner'">
        <template x-for="char in $store.characters.paginatedList" :key="\`banner-\${char.id}\`">
          <div class="fandom-card fandom-card-banner group"
            x-data="{ isMenuOpen: false }"
            draggable="true"
            :class="{
              'has-banner': Boolean(char.basics?.bannerDataUrl || char.visualSettings?.backgroundUrl),
              'is-menu-open': isMenuOpen
            }"
            :style="\`--char-accent: \${$store.characters.getCharAccentColor(char)};\${isMenuOpen ? ' overflow: visible !important; z-index: 40 !important;' : ''}\`"
            @dragstart="$store.characters.startCharDrag($event, char.id)"
            @dragend="$store.characters.endCharDrag()"
            @click="$store.characters.openCharacterSheet(char.id)"
            :title="\`Abrir ficha: \${char.name || 'Sin Nombre'} (arrástrala a una carpeta para guardarla)\`">

            <div class="fandom-banner-accent-rail"></div>

            <!-- Fondo Panorámico con Banner del Personaje -->
            <template x-if="char.basics?.bannerDataUrl || char.visualSettings?.backgroundUrl">
              <div class="fandom-banner-bg">
                <img
                  :src="$store.app.getOptimizedImageUrl(char.basics?.bannerDataUrl || char.visualSettings?.backgroundUrl)"
                  class="fandom-banner-bg-img"
                  :style="char.basics?.bannerDataUrl ? (char.basics?.bannerTransform || '') : ''"
                  loading="lazy"
                  decoding="async"
                  alt=""
                />
                <div class="fandom-banner-scrim"></div>
              </div>
            </template>

            <template x-if="!char.basics?.bannerDataUrl && !char.visualSettings?.backgroundUrl">
              <div class="fandom-banner-fallback-tint"></div>
            </template>

            <!-- Botones Flotantes Superiores (Favorita + Menú Contextual) -->
            <div class="absolute top-3 right-3 z-30 flex items-center gap-1.5" @click.stop>
              <button
                type="button"
                @click.stop="$store.characters.toggleFavorite(char.id)"
                class="w-7 h-7 flex items-center justify-center border transition-colors cursor-pointer"
                :style="char.isFavorite
                  ? 'background-color: var(--wiki-bg-elevated); border-color: var(--wiki-accent); color: var(--wiki-accent);'
                  : 'background-color: var(--wiki-bg-elevated); border-color: var(--wiki-border-strong); color: var(--wiki-text-muted);'"
                :title="char.isFavorite ? 'Quitar de favoritas' : 'Marcar como favorita'"
              >
                <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" :fill="char.isFavorite ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              </button>

              <div class="relative">
                <button
                  type="button"
                  @click.stop="isMenuOpen = !isMenuOpen"
                  class="w-7 h-7 flex items-center justify-center border cursor-pointer transition-colors"
                  style="background-color: var(--wiki-bg-elevated); border-color: var(--wiki-border-strong); color: var(--wiki-text-main);"
                  title="Opciones de ficha"
                >
                  <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="1.5" />
                    <circle cx="19" cy="12" r="1.5" />
                    <circle cx="5" cy="12" r="1.5" />
                  </svg>
                </button>

                <div
                  x-show="isMenuOpen"
                  @click.outside="isMenuOpen = false"
                  x-cloak
                  class="absolute right-0 top-full mt-1 w-48 p-1 border shadow-xl z-50 space-y-0.5 text-xs"
                  style="background-color: var(--wiki-bg-elevated); border-color: var(--wiki-border-strong);"
                >
                  <button
                    type="button"
                    @click.stop="$store.characters.toggleFavorite(char.id); isMenuOpen = false"
                    class="w-full text-left px-2.5 py-1.5 flex items-center gap-2 hover:bg-white/10 cursor-pointer"
                    style="color: var(--wiki-text-main);"
                  >
                    <svg class="w-3.5 h-3.5 shrink-0" style="color: var(--wiki-accent);" viewBox="0 0 24 24" :fill="char.isFavorite ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                    <span x-text="char.isFavorite ? 'Quitar de Favoritas' : 'Marcar como Favorita'"></span>
                  </button>

                  <button
                    type="button"
                    @click.stop="$store.characters.toggleLocked(char.id); isMenuOpen = false"
                    class="w-full text-left px-2.5 py-1.5 flex items-center gap-2 hover:bg-white/10 cursor-pointer"
                    style="color: var(--wiki-text-main);"
                  >
                    <svg class="w-3.5 h-3.5 shrink-0" style="color: var(--wiki-accent);" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    <span x-text="char.isLocked ? 'Desbloquear Ficha' : 'Proteger contra Edición'"></span>
                  </button>

                  <button
                    type="button"
                    @click.stop="$store.characters.duplicate(char.id); isMenuOpen = false"
                    class="w-full text-left px-2.5 py-1.5 flex items-center gap-2 hover:bg-white/10 cursor-pointer"
                    style="color: var(--wiki-text-main);"
                  >
                    <svg class="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                    </svg>
                    <span>Copiar Ficha</span>
                  </button>

                  <button
                    type="button"
                    @click.stop="$store.characters.openSheetConverterModal(char.id); isMenuOpen = false"
                    class="w-full text-left px-2.5 py-1.5 flex items-center gap-2 hover:bg-white/10 cursor-pointer"
                    style="color: var(--wiki-text-main);"
                  >
                    <svg class="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="m16 3 4 4-4 4" />
                      <path d="M20 7H4" />
                      <path d="m8 21-4-4 4-4" />
                      <path d="M4 17h16" />
                    </svg>
                    <span x-text="char.sheetType === 'classic' ? 'Convertir a Ficha A (Simple)' : 'Convertir a Ficha B (Compleja)'"></span>
                  </button>

                  <button
                    type="button"
                    @click.stop="$store.app.openExportModal(char.id); isMenuOpen = false"
                    class="w-full text-left px-2.5 py-1.5 flex items-center gap-2 hover:bg-white/10 cursor-pointer"
                    style="color: var(--wiki-accent);"
                  >
                    <svg class="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                    <span x-text="char.sheetType === 'classic' ? 'Exportar PDF' : 'Exportar Imagen'"></span>
                  </button>

                  <button
                    type="button"
                    @click.stop="$store.characters.exportJSONForChar(char.id); isMenuOpen = false"
                    class="w-full text-left px-2.5 py-1.5 flex items-center gap-2 hover:bg-white/10 cursor-pointer"
                    style="color: var(--wiki-text-main);"
                  >
                    <svg class="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" x2="12" y1="15" y2="3" />
                    </svg>
                    <span>Backup JSON</span>
                  </button>

                  <div class="my-1 border-t" style="border-color: var(--wiki-border);"></div>

                  <button
                    type="button"
                    @click.stop="$store.characters.confirmDelete(char.id); isMenuOpen = false"
                    class="w-full text-left px-2.5 py-1.5 flex items-center gap-2 text-rose-400 hover:bg-rose-500/15 cursor-pointer"
                  >
                    <svg class="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M3 6h18" />
                      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                    </svg>
                    <span>Eliminar Ficha</span>
                  </button>
                </div>
              </div>
            </div>

            <div class="fandom-banner-inner">
              <!-- Cabecera Horizontal: Avatar + Identidad + Etiquetas -->
              <div class="flex items-start gap-3.5 pr-16">
                <div class="relative shrink-0">
                  <div
                    data-avatar-container="true"
                    data-protect-radius="true"
                    class="fandom-banner-avatar"
                    :class="$store.characters.getAvatarAspect(char) === 'portrait' ? 'w-14 h-[74px]' : 'w-16 h-16'"
                    :style="\`border-color: \${char.isFavorite ? 'var(--wiki-accent)' : $store.characters.getCharAccentColor(char)}; border-radius: \${$store.characters.getAvatarRadiusCss(char)};\`"
                  >
                    <template x-if="char.basics?.useIconForPfp ? Boolean(char.basics?.iconDataUrl || char.basics?.avatarDataUrl) : Boolean(char.basics?.avatarDataUrl || char.basics?.iconDataUrl)">
                      <img
                        :src="$store.app.getOptimizedImageUrl(char.basics?.useIconForPfp ? (char.basics?.iconDataUrl || char.basics?.avatarDataUrl) : (char.basics?.avatarDataUrl || char.basics?.iconDataUrl))"
                        class="w-full h-full object-cover"
                        data-protect-radius="true"
                        :style="\`\${char.basics?.useIconForPfp ? (char.basics?.iconTransform || char.basics?.avatarTransform || '') : (char.basics?.avatarTransform || char.basics?.iconTransform || '')}; border-radius: \${$store.characters.getAvatarRadiusCss(char)};\`"
                        loading="lazy"
                        decoding="async"
                        alt=""
                      />
                    </template>
                    <template x-if="!(char.basics?.useIconForPfp ? Boolean(char.basics?.iconDataUrl || char.basics?.avatarDataUrl) : Boolean(char.basics?.avatarDataUrl || char.basics?.iconDataUrl))">
                      <svg class="w-7 h-7" style="color: var(--wiki-text-dim);" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="8" r="5" />
                        <path d="M20 21a8 8 0 0 0-16 0" />
                      </svg>
                    </template>
                  </div>
                  <template x-if="char.basics?.avatarFrame?.url">
                    <img :src="char.basics.avatarFrame.url" class="steam-avatar-frame-overlay" loading="lazy" decoding="async" alt="" />
                  </template>
                </div>

                <div class="min-w-0 flex-1 space-y-1.5">
                  <div class="flex items-center gap-2 flex-wrap">
                    <h3 class="fandom-card-title !mb-0 truncate" x-text="char.name || 'Sin Nombre'"></h3>
                    <span
                      x-show="char.id === $store.characters.activeId"
                      class="fandom-banner-meta-pill font-mono uppercase text-[10px]"
                      style="border-color: var(--wiki-accent); color: var(--wiki-accent);"
                    >
                      Activo
                    </span>
                    <span
                      x-show="char.isLocked"
                      class="fandom-banner-meta-pill font-mono uppercase text-[10px]"
                      style="border-color: var(--wiki-border-strong); color: var(--wiki-text-muted);"
                      title="Ficha protegida contra edición"
                    >
                      Protegida
                    </span>
                    <span
                      class="fandom-banner-meta-pill font-mono text-[10px]"
                      style="border-color: var(--wiki-border-strong); color: var(--wiki-text-muted);"
                      :title="char.sheetType === 'classic' ? 'Ficha B Compleja (Sidebar y 12 pestañas)' : 'Ficha A Simple (Vista unificada en 3 columnas)'"
                      x-text="char.sheetType === 'classic' ? 'Ficha B · Compleja' : 'Ficha A · Simple'"
                    ></span>
                  </div>

                  <template x-if="char.basics?.alias && char.basics.alias.trim() && char.basics.alias.trim().toLowerCase() !== (char.name || '').trim().toLowerCase()">
                    <p class="fandom-banner-alias text-xs m-0 truncate" x-text="\`«\${char.basics.alias.trim()}»\`"></p>
                  </template>

                  <div class="flex items-center gap-1.5 flex-wrap">
                    <template x-if="char.basics?.race && char.basics.race.trim()">
                      <span class="fandom-banner-meta-pill" x-text="char.basics.race.trim()"></span>
                    </template>
                    <template x-if="(char.extras?.fgcStyle || char.extras?.charClass || char.basics?.role) && (char.extras?.fgcStyle || char.extras?.charClass || char.basics?.role).trim()">
                      <span
                        class="fandom-banner-meta-pill"
                        style="border-color: var(--wiki-border-strong);"
                        x-text="(char.extras?.fgcStyle || char.extras?.charClass || char.basics?.role).trim()"
                      ></span>
                    </template>
                    <template x-if="!$store.settings.hidePowerScalingTierBadge && char.powerScaling?.tier && char.powerScaling.tier.trim()">
                      <span
                        class="fandom-banner-meta-pill tier-badge font-mono"
                        style="border-color: var(--wiki-accent); color: var(--wiki-accent);"
                        x-text="char.powerScaling.tier.trim()"
                      ></span>
                    </template>
                  </div>
                </div>
              </div>

              <!-- Frase Destacada (con rotación) -->
              <template x-if="$store.characters.getFeaturedQuote(char)">
                <div
                  class="fandom-banner-quote"
                  x-data="{
                    currentQuote: $store.characters.getFeaturedQuote(char),
                    init() {
                      this.$watch('$store.characters.quoteRotationIndex', () => {
                        const next = $store.characters.getFeaturedQuote(char);
                        if (next) this.currentQuote = next;
                      });
                    }
                  }"
                >
                  <span class="truncate" x-text="\`“\${currentQuote}”\`" :title="\`Frase: \${currentQuote}\`"></span>
                </div>
              </template>

              <!-- Coincidencia de Búsqueda -->
              <template x-if="$store.characters.searchQuery && $store.characters.getSearchMatch(char, $store.characters.searchQuery).subfieldTag">
                <div class="fandom-banner-meta-pill !max-w-full font-mono" style="color: var(--wiki-link);">
                  <span class="truncate" x-text="\`Coincidencia en: \${$store.characters.getSearchMatch(char, $store.characters.searchQuery).subfieldTag}\`"></span>
                </div>
              </template>

              <!-- Pie Panorámico: Fecha, Insignias Steam y Botón Abrir -->
              <div class="fandom-banner-footer">
                <div class="flex items-center gap-2.5 min-w-0">
                  <span class="fandom-banner-date text-[11px] font-mono truncate" x-text="\`Modificado: \${$store.characters.formatDate(char.updatedAt)}\`"></span>
                  <template x-if="char.basics?.steamBadges && char.basics.steamBadges.filter(Boolean).length > 0">
                    <div class="flex items-center gap-1 pl-2 border-l" style="border-color: var(--wiki-border);" @click.stop>
                      <template x-for="(b, bIdx) in char.basics.steamBadges.filter(Boolean).slice(0, 3)" :key="b.id || bIdx">
                        <img :src="b.url" :alt="b.name" :title="b.name" class="w-4 h-4 object-contain" :class="b.isFoil ? 'steam-foil-badge' : ''" loading="lazy" />
                      </template>
                    </div>
                  </template>
                </div>

                <button
                  type="button"
                  class="souls-btn souls-btn-primary text-xs !py-1 !px-3 shrink-0"
                  @click.stop="$store.characters.openCharacterSheet(char.id)"
                >
                  Abrir ficha
                </button>
              </div>
            </div>
          </div>
        </template>
      </div>`;
}

function renderCharacterCard(): string {
  return `
      ${renderBannerCharacterCards()}

      <!-- Cuadrícula de Tarjetas Fandom -->
      <div class="fandom-roster-grid" x-show="!$store.characters.loading && $store.characters.paginatedList.length > 0 && $store.characters.rosterViewMode !== 'banner'">
        <template x-for="char in $store.characters.paginatedList" :key="char.id">
          <div class="fandom-card group"
            x-data="{ isMenuOpen: false }"
            draggable="true"
            :class="{ 'is-menu-open': isMenuOpen }"
            :style="isMenuOpen ? 'overflow: visible !important; z-index: 40 !important;' : ''"
            @dragstart="$store.characters.startCharDrag($event, char.id)"
            @dragend="$store.characters.endCharDrag()"
            @click="$store.characters.openCharacterSheet(char.id)"
            :title="\`Abrir ficha: \${char.name || 'Sin Nombre'} (arrástrala a una carpeta para guardarla)\`">

            <!-- Portada / Báner + Retrato del Personaje -->
            <div class="fandom-card-thumb" :style="isMenuOpen ? 'overflow: visible !important;' : ''">
              <!-- Caso 1: Báner + Imagen/Avatar superpuesta -->
              <template x-if="char.basics?.bannerDataUrl || char.visualSettings?.backgroundUrl">
                <div class="w-full h-full relative overflow-hidden">
                  <img :src="$store.app.getOptimizedImageUrl(char.basics?.bannerDataUrl || char.visualSettings?.backgroundUrl)"
                    :alt="char.name"
                    draggable="false"
                    class="w-full h-full object-cover block"
                    :style="char.basics?.bannerDataUrl ? (char.basics?.bannerTransform || '') : ''"
                    loading="lazy" />
                  <div class="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/15 pointer-events-none"></div>

                  <template x-if="char.basics?.avatarDataUrl">
                    <div class="absolute bottom-2.5 left-2.5 z-10 w-20 h-24">
                      <div class="w-full h-full border-2 border-[var(--wiki-accent)] bg-black/75 overflow-hidden"
                        :style="\`border-radius: \${$store.characters.getAvatarRadiusCss(char)};\`">
                        <img :src="$store.app.getOptimizedImageUrl(char.basics.avatarDataUrl)"
                          :alt="char.name"
                          draggable="false"
                          class="w-full h-full object-cover block"
                          :style="char.basics?.avatarTransform || ''"
                          loading="lazy" />
                      </div>
                      <template x-if="char.basics?.avatarFrame?.url">
                        <img :src="char.basics.avatarFrame.url" class="steam-avatar-frame-overlay pointer-events-none" alt="" />
                      </template>
                    </div>
                  </template>
                </div>
              </template>

              <!-- Caso 2: Solo Imagen/Avatar -->
              <template x-if="!(char.basics?.bannerDataUrl || char.visualSettings?.backgroundUrl) && char.basics?.avatarDataUrl">
                <div class="w-full h-full relative overflow-hidden">
                  <img :src="$store.app.getOptimizedImageUrl(char.basics.avatarDataUrl)"
                    :alt="char.name"
                    draggable="false"
                    class="w-full h-full object-cover block"
                    :style="char.basics?.avatarTransform || ''"
                    loading="lazy" />
                  <template x-if="char.basics?.avatarFrame?.url">
                    <img :src="char.basics.avatarFrame.url" class="steam-avatar-frame-overlay pointer-events-none" alt="" />
                  </template>
                </div>
              </template>

              <!-- Caso 3: Sin Báner ni Imagen/Avatar -->
              <template x-if="!char.basics?.avatarDataUrl && !char.basics?.bannerDataUrl && !char.visualSettings?.backgroundUrl">
                <div class="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-[var(--wiki-bg-elevated)]">
                  <i data-lucide="user" class="w-12 h-12 mb-1 opacity-50"></i>
                  <span class="text-[10px] uppercase font-mono tracking-wider">Sin Ilustración</span>
                </div>
              </template>

              <!-- Botón Favorito -->
              <button type="button"
                @click.stop="$store.characters.toggleFavorite(char.id)"
                class="absolute top-2 left-2 z-20 p-1 bg-[var(--wiki-bg-header)]/90 border border-white/20 hover:border-amber-400 text-xs cursor-pointer transition-colors"
                :title="char.isFavorite ? 'Ficha Favorita ★' : 'Marcar como Favorita'">
                <i data-lucide="star" class="w-3.5 h-3.5"
                  :class="char.isFavorite ? 'fill-amber-400 text-amber-400' : 'text-slate-400 hover:text-amber-300'"></i>
              </button>

              <!-- Menú de Opciones -->
              <div class="absolute top-2 right-2 z-20" @click.stop>
                <button type="button" @click.stop="isMenuOpen = !isMenuOpen"
                  class="p-1 bg-[var(--wiki-bg-header)]/90 border border-white/20 hover:border-white/50 text-slate-300 hover:text-white cursor-pointer transition-colors"
                  title="Opciones de Ficha">
                  <i data-lucide="more-horizontal" class="w-3.5 h-3.5"></i>
                </button>

                <div x-show="isMenuOpen" @click.outside="isMenuOpen = false"
                  class="absolute right-0 top-full mt-1 w-52 p-1 bg-[var(--wiki-bg-elevated)] border border-[var(--wiki-border-strong)] z-30 shadow-lg text-xs space-y-0.5 max-h-80 overflow-y-auto" x-cloak>
                  <button type="button" @click.stop="$store.characters.duplicate(char.id); isMenuOpen = false"
                    class="w-full text-left px-2.5 py-1.5 hover:bg-white/10 flex items-center gap-2 text-slate-200 cursor-pointer">
                    <i data-lucide="copy" class="w-3.5 h-3.5"></i>
                    <span>Duplicar Ficha</span>
                  </button>
                  <button type="button" @click.stop="$store.characters.openSheetConverterModal(char.id); isMenuOpen = false"
                    class="w-full text-left px-2.5 py-1.5 hover:bg-white/10 flex items-center gap-2 text-slate-200 cursor-pointer">
                    <i data-lucide="arrow-right-left" class="w-3.5 h-3.5"></i>
                    <span x-text="char.sheetType === 'classic' ? 'Convertir a Ficha A (Simple)' : 'Convertir a Ficha B (Compleja)'"></span>
                  </button>
                  <button type="button" @click.stop="$store.app.openExportModal(char.id); isMenuOpen = false"
                    class="w-full text-left px-2.5 py-1.5 hover:bg-white/10 flex items-center gap-2 cursor-pointer"
                    style="color: var(--wiki-accent);">
                    <svg class="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                    <span x-text="char.sheetType === 'classic' ? 'Exportar PDF' : 'Exportar Imagen'"></span>
                  </button>
                  <button type="button" @click.stop="$store.characters.exportJSONForChar(char.id); isMenuOpen = false"
                    class="w-full text-left px-2.5 py-1.5 hover:bg-white/10 flex items-center gap-2 text-slate-200 cursor-pointer">
                    <i data-lucide="download" class="w-3.5 h-3.5"></i>
                    <span>Backup JSON</span>
                  </button>

                  <!-- Mover a Carpeta -->
                  <div class="border-t border-white/10 pt-1 mt-1 space-y-0.5">
                    <div class="px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-slate-400">
                      Guardar en carpeta
                    </div>
                    <template x-for="f in $store.characters.folders" :key="f.id">
                      <button type="button"
                        @click.stop="$store.characters.moveCharacterToFolder(char.id, f.id); isMenuOpen = false"
                        class="w-full text-left px-2.5 py-1.5 hover:bg-white/10 flex items-center justify-between gap-2 text-slate-200 cursor-pointer">
                        <span class="flex items-center gap-2 min-w-0">
                          <span class="w-2 h-2 rounded-full shrink-0" :style="\`background-color: \${f.color || 'var(--wiki-accent)'};\`"></span>
                          <span class="truncate" x-text="f.name"></span>
                        </span>
                        <i x-show="char.folderId === f.id" data-lucide="check" class="w-3.5 h-3.5 text-[var(--wiki-accent)] shrink-0"></i>
                      </button>
                    </template>
                    <button x-show="char.folderId" type="button"
                      @click.stop="$store.characters.moveCharacterToFolder(char.id, 'unassigned'); isMenuOpen = false"
                      class="w-full text-left px-2.5 py-1.5 hover:bg-white/10 flex items-center gap-2 text-slate-300 cursor-pointer">
                      <i data-lucide="folder" class="w-3.5 h-3.5 opacity-60"></i>
                      <span>Quitar de carpeta</span>
                    </button>
                    <button type="button"
                      @click.stop="isMenuOpen = false; $store.characters.openCreateFolderModal()"
                      class="w-full text-left px-2.5 py-1.5 hover:bg-white/10 flex items-center gap-2 text-[var(--wiki-accent)] cursor-pointer">
                      <i data-lucide="folder-plus" class="w-3.5 h-3.5"></i>
                      <span>+ Nueva Carpeta</span>
                    </button>
                  </div>

                  <button type="button" @click.stop="$store.characters.confirmDelete(char.id); isMenuOpen = false"
                    class="w-full text-left px-2.5 py-1.5 hover:bg-rose-500/20 text-rose-400 flex items-center gap-2 cursor-pointer border-t border-white/10">
                    <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                    <span>Eliminar</span>
                  </button>
                </div>
              </div>

              <!-- Badge de Tier o Rol -->
              <div x-show="!$store.settings.hidePowerScalingTierBadge" class="absolute bottom-2 right-2 z-10 flex items-center gap-1">
                <span class="tier-badge text-[9.5px] font-mono uppercase font-bold px-1.5 py-0.5 bg-[var(--wiki-bg-header)]/90 border border-white/20 text-[var(--wiki-accent)]"
                  x-text="char.powerScaling?.tier || char.basics?.role || 'Ficha'"></span>
              </div>
            </div>

            <!-- Cuerpo del Card -->
            <div class="fandom-card-body">
              <div class="flex items-start gap-2.5">
                <template x-if="char.basics?.iconDataUrl">
                  <img :src="$store.app.getOptimizedImageUrl(char.basics.iconDataUrl)"
                    :alt="char.name"
                    class="w-9 h-9 object-cover border border-[var(--wiki-border-strong)] shrink-0 mt-0.5"
                    :style="char.basics.iconTransform || ''" />
                </template>
                <div class="min-w-0 flex-1">
                  <div class="flex items-center justify-between gap-1.5">
                    <h3 class="fandom-card-title truncate" x-text="char.name || char.basics?.fullName || 'Sin Nombre'"></h3>
                    <span class="text-[9px] font-mono uppercase px-1.5 py-0.5 border border-[var(--wiki-border-strong)] text-slate-300 shrink-0"
                      x-text="char.sheetType === 'classic' ? 'Ficha B' : 'Ficha A'"
                      :title="char.sheetType === 'classic' ? 'Ficha B · Compleja' : 'Ficha A · Simple'"></span>
                  </div>
                  <p class="fandom-card-subtitle truncate"
                    x-text="char.basics?.nickname ? ('«' + char.basics.nickname + '»') : (char.basics?.race || 'Registro Enciclopédico')"></p>
                </div>
              </div>

              <template x-if="char.basics?.quotes?.[0]">
                <p class="text-[11px] italic text-slate-400 font-serif line-clamp-1 mt-2 border-t border-[var(--wiki-border)] pt-1.5">
                  “<span x-text="char.basics.quotes[0]"></span>”
                </p>
              </template>

              <template x-if="char.folderId && $store.characters.folders.some(f => f.id === char.folderId)">
                <div class="mt-2 pt-1.5 border-t border-[var(--wiki-border)] flex items-center gap-1.5 text-[10px] font-mono text-slate-400">
                  <span class="w-2 h-2 rounded-full shrink-0"
                    :style="\`background-color: \${$store.characters.folders.find(f => f.id === char.folderId)?.color || 'var(--wiki-accent)'};\`"></span>
                  <span class="truncate" x-text="$store.characters.getFolderName(char.folderId)"></span>
                </div>
              </template>
            </div>

          </div>
        </template>
      </div>`;
}

function renderPaginationBar(): string {
  return `
      <!-- 4. BARRA DE PAGINACIÓN LIMPIA -->
      <div x-show="!$store.characters.loading && $store.characters.filteredList.length > $store.characters.itemsPerPage" x-cloak
        class="flex items-center justify-between p-3 mt-6 border border-[var(--wiki-border)] bg-[var(--wiki-bg-canvas)] text-xs text-slate-300">
        <div>
          <span>Página <strong class="text-white" x-text="$store.characters.currentPage"></strong> de <strong class="text-white" x-text="$store.characters.totalPages"></strong></span>
          <span class="mx-1 text-slate-500">·</span>
          <span><strong class="text-[var(--wiki-accent)]" x-text="$store.characters.filteredList.length"></strong> fichas totales</span>
        </div>
        <div class="flex items-center gap-1.5">
          <button type="button" @click="$store.characters.prevPage()" :disabled="$store.characters.currentPage === 1"
            class="souls-btn text-xs py-1 px-2.5 cursor-pointer"
            :class="{ 'opacity-40 cursor-not-allowed': $store.characters.currentPage === 1 }">
            ← Anterior
          </button>
          <button type="button" @click="$store.characters.nextPage()" :disabled="$store.characters.currentPage === $store.characters.totalPages"
            class="souls-btn text-xs py-1 px-2.5 cursor-pointer"
            :class="{ 'opacity-40 cursor-not-allowed': $store.characters.currentPage === $store.characters.totalPages }">
            Siguiente →
          </button>
        </div>
      </div>`;
}

export function renderDashboardView(): string {
  return `<!-- ==============================================================
     PANTALLA PRINCIPAL: ARCHIVO & HUB ESTILO FANDOM WIKI
     Despejado, editorial, flujo web natural y navegación comunitaria.
     ============================================================== -->
<main id="main-dashboard-view" role="main" aria-label="Archivo Central de Fichas"
  x-data="{ isDraggingFiles: false }"
  @keydown.escape.window="if ($store.app.activeView === 'dashboard' && $store.characters.selectedCount > 0) $store.characters.clearSelection()"
  @dragenter.prevent="if (!$store.characters.draggingCharId && $event.dataTransfer?.types?.includes('Files')) isDraggingFiles = true"
  @dragover.prevent="if (!$store.characters.draggingCharId && $event.dataTransfer?.types?.includes('Files')) isDraggingFiles = true"
  @dragleave.prevent="if ($event.relatedTarget === null || $event.target === $el) isDraggingFiles = false"
  @drop.prevent="isDraggingFiles = false; if (!$store.characters.draggingCharId && $event.dataTransfer?.files?.length) $store.characters.handleJSONDrop($event)"
  class="w-full pb-24 relative"
  :style="($store.settings.dashboardBgMode !== 'pattern') ? 'background-color: transparent;' : 'background-color: var(--wiki-bg-outer);'"
  x-show="$store.app.activeView === 'dashboard'">
  ${renderDropOverlay()}

  <div class="w-full max-w-[1240px] mx-auto px-4 sm:px-6 py-6 flex flex-col gap-6">
    ${renderCommunityBanner()}
    ${renderSearchAndSortBar()}

    <!-- 3. CUADRÍCULA DE FICHAS ESTILO FANDOM WIKI -->
    <div class="w-full">
      ${renderSkeletonAndEmpty()}
      ${renderCharacterCard()}
      ${renderPaginationBar()}
    </div>

  </div>
</main>`;
}

