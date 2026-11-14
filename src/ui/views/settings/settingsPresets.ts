/**
 * @file src/ui/views/settings/settingsPresets.ts
 */

export function renderSettingsPresets(): string {
  return `<!-- SUB-PESTAÑA 2: TEMAS Y KITS (CLARO Y DIRECTO) -->
<div class="space-y-5" x-data="{ openTools: false }">

  <div class="wiki-settings-pane-head flex flex-wrap items-end justify-between gap-3">
    <div>
      <h2 class="wiki-settings-pane-title">Temas y Kits</h2>
      <p class="wiki-settings-pane-desc">Aplica un estilo completo con un clic o crea tus propios temas.</p>
    </div>

    <div class="flex items-center gap-2">
      <button type="button" @click="$store.settings.openDesigner()" class="souls-btn souls-btn-primary">
        <i data-lucide="plus" class="w-3.5 h-3.5"></i>
        <span>Crear kit</span>
      </button>

      <div class="relative" @click.outside="openTools = false">
        <button type="button" @click="openTools = !openTools" class="souls-btn !px-2.5" title="Más opciones">
          <i data-lucide="more-horizontal" class="w-4 h-4"></i>
        </button>

        <div x-show="openTools" x-cloak
          class="absolute right-0 top-full mt-1 w-48 p-1 border shadow-xl z-30 space-y-0.5 text-xs"
          style="background: var(--wiki-bg-elevated); border-color: var(--wiki-border-strong);">
          <button type="button" @click="$store.settings.openImportKitModal(); openTools = false"
            class="w-full text-left px-2.5 py-2 hover:bg-white/10 flex items-center gap-2 cursor-pointer"
            style="color: var(--wiki-text-main);">
            <i data-lucide="download" class="w-3.5 h-3.5"></i>
            <span>Importar kit (JSON)</span>
          </button>
          <button type="button"
            @click="$store.settings.setKitViewMode($store.settings.kitViewMode === 'grid' ? 'magazine' : 'grid'); openTools = false"
            class="w-full text-left px-2.5 py-2 hover:bg-white/10 flex items-center gap-2 cursor-pointer"
            style="color: var(--wiki-text-main);">
            <i data-lucide="book-open" class="w-3.5 h-3.5"></i>
            <span x-text="$store.settings.kitViewMode === 'grid' ? 'Cambiar a vista carrusel' : 'Cambiar a cuadrícula'"></span>
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Buscador + filtro limpio -->
  <div class="flex flex-wrap items-center gap-3">
    <div class="relative flex-1 min-w-[200px]">
      <i data-lucide="search" class="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
        style="color: var(--wiki-text-dim);"></i>
      <input type="text" x-model="$store.settings.kitSearchQuery"
        placeholder="Buscar tema..."
        class="souls-input text-xs"
        style="padding-left: 32px !important; padding-right: 28px !important;" />
      <button type="button" x-show="$store.settings.kitSearchQuery"
        @click="$store.settings.kitSearchQuery = ''"
        class="absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer"
        style="color: var(--wiki-text-muted);" title="Limpiar">
        <i data-lucide="x" class="w-3.5 h-3.5"></i>
      </button>
    </div>

    <div class="wiki-segmented">
      <button type="button" @click="$store.settings.kitCategoryFilter = 'all'"
        :class="{ 'is-active': $store.settings.kitCategoryFilter === 'all' }"
        class="wiki-segmented-btn">Todos</button>
      <button type="button" @click="$store.settings.kitCategoryFilter = 'system'"
        :class="{ 'is-active': $store.settings.kitCategoryFilter === 'system' }"
        class="wiki-segmented-btn">Incluidos</button>
      <button type="button" @click="$store.settings.kitCategoryFilter = 'custom'"
        :class="{ 'is-active': $store.settings.kitCategoryFilter === 'custom' }"
        class="wiki-segmented-btn">Mis kits</button>
    </div>

    <div class="wiki-segmented" role="group" aria-label="Tipo de vista de kits">
      <button type="button" @click="$store.settings.setKitViewMode('magazine')"
        :class="{ 'is-active': $store.settings.kitViewMode === 'magazine' }"
        class="wiki-segmented-btn"
        title="Vista Revista / Carrusel editorial">
        <i data-lucide="book-open" class="w-3.5 h-3.5 shrink-0"></i>
        <span>Revista</span>
      </button>
      <button type="button" @click="$store.settings.setKitViewMode('grid')"
        :class="{ 'is-active': $store.settings.kitViewMode !== 'magazine' }"
        class="wiki-segmented-btn"
        title="Vista Cuadrícula de tarjetas">
        <i data-lucide="layout-grid" class="w-3.5 h-3.5 shrink-0"></i>
        <span>Cuadrícula</span>
      </button>
    </div>
  </div>

  <!-- VISTA CARRUSEL (cuando el usuario la elige en Más opciones) -->
  <div x-show="$store.settings.kitViewMode === 'magazine'" x-cloak class="space-y-3">
    <div class="flex items-center justify-between text-xs" style="color: var(--wiki-text-muted);">
      <span x-text="\`\${$store.settings.filteredThemeKits.length} temas disponibles\`"></span>
      <div class="flex items-center gap-1.5">
        <button type="button" @click="$store.settings.scrollMagazine(-1)" class="souls-btn !px-2.5 !py-1" title="Anterior">
          <i data-lucide="chevron-left" class="w-3.5 h-3.5"></i>
        </button>
        <button type="button" @click="$store.settings.scrollMagazine(1)" class="souls-btn !px-2.5 !py-1" title="Siguiente">
          <i data-lucide="chevron-right" class="w-3.5 h-3.5"></i>
        </button>
      </div>
    </div>

    <div id="magazine-scroller-container" class="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-3 scroll-smooth">
      <template x-for="kit in $store.settings.filteredThemeKits" :key="'mag-' + (kit.id || kit.name)">
        <article class="wiki-settings-section w-[290px] shrink-0 snap-center flex flex-col justify-between gap-4"
          :style="$store.settings.isKitActive(kit) ? 'border-color: var(--wiki-accent);' : ''">
          <div class="space-y-2.5">
            <div class="flex items-center justify-between gap-2">
              <h4 class="text-base font-semibold truncate m-0" style="color: var(--wiki-text-main);" x-text="kit.name"></h4>
              <span x-show="$store.settings.isKitActive(kit)"
                class="text-[10px] font-semibold uppercase px-1.5 py-0.5 shrink-0"
                style="background: var(--wiki-accent-dim); color: var(--wiki-accent); border: 1px solid var(--wiki-accent);">Activo</span>
            </div>
            <div class="flex items-center gap-1.5">
              <template x-for="swatch in ($store.settings.getKitPalette(kit) || []).slice(0, 5)" :key="swatch.label">
                <span class="w-4 h-4 rounded-full border border-black/30" data-protect-circle data-protect-radius :style="'background:' + swatch.color" :title="swatch.label"></span>
              </template>
            </div>
            <div class="text-xs" style="color: var(--wiki-text-muted);"
              x-text="\`\${kit.fontDisplay || 'Estándar'} · \${kit.fontBody || 'Estándar'}\`"></div>
          </div>

          <button type="button" @click="$store.settings.applyThemeKit(kit)"
            class="souls-btn w-full"
            :class="$store.settings.isKitActive(kit) ? '' : 'souls-btn-primary'"
            :style="$store.settings.isKitActive(kit) ? 'border-color: var(--wiki-accent); color: var(--wiki-accent);' : ''">
            <span x-text="$store.settings.isKitActive(kit) ? 'En uso' : 'Aplicar tema'"></span>
          </button>
        </article>
      </template>
    </div>
  </div>

  <!-- VISTA CUADRÍCULA LIMPIA (2 COLUMNAS EN EL ÁREA DE CONTENIDO) -->
  <div x-show="$store.settings.kitViewMode === 'grid'" class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
    <template x-for="kit in $store.settings.filteredThemeKits" :key="kit.id || kit.name">
      <article class="wiki-settings-section flex flex-col justify-between gap-3 relative"
        x-data="{ kitMenuOpen: false }"
        :class="{ 'is-menu-open': kitMenuOpen }"
        :style="$store.settings.isKitActive(kit) ? 'border-color: var(--wiki-accent);' : ''">

        <div class="space-y-2.5">
          <div class="flex items-start justify-between gap-2">
            <div class="min-w-0">
              <h4 class="text-sm font-semibold truncate m-0" style="color: var(--wiki-text-main);" x-text="kit.name"></h4>
              <p class="text-xs mt-0.5 m-0 truncate" style="color: var(--wiki-text-muted);"
                x-text="\`\${kit.fontDisplay || 'Estándar'} · \${kit.fontBody || 'Estándar'}\`"></p>
            </div>

            <span x-show="$store.settings.isKitActive(kit)"
              class="text-[10px] font-semibold uppercase px-1.5 py-0.5 shrink-0"
              style="background: var(--wiki-accent-dim); color: var(--wiki-accent); border: 1px solid var(--wiki-accent);">
              En uso
            </span>
          </div>

          <!-- Paleta visual simple en círculos -->
          <div class="flex items-center gap-1.5">
            <template x-for="swatch in ($store.settings.getKitPalette(kit) || []).slice(0, 5)" :key="swatch.label">
              <span class="w-4 h-4 rounded-full border border-black/30" data-protect-circle data-protect-radius
                :style="'background-color: ' + swatch.color + ';'"
                :title="swatch.label"></span>
            </template>
            <span x-show="kit.isCustom" class="text-[11px] ml-auto" style="color: var(--wiki-text-dim);">Propio</span>
          </div>
        </div>

        <!-- Acción principal + Menú ••• limpio -->
        <div class="flex items-center gap-2 pt-2.5 border-t" style="border-color: var(--wiki-border);">
          <button type="button"
            x-show="!$store.settings.isKitActive(kit)"
            @click="$store.settings.applyThemeKit(kit)"
            class="souls-btn souls-btn-primary flex-1">
            <span>Aplicar</span>
          </button>
          <span x-show="$store.settings.isKitActive(kit)"
            class="souls-btn flex-1 cursor-default"
            style="border-color: var(--wiki-accent); color: var(--wiki-accent);">
            <i data-lucide="check" class="w-3.5 h-3.5"></i>
            <span>Activo</span>
          </span>

          <div class="relative" @click.outside="kitMenuOpen = false">
            <button type="button" @click="kitMenuOpen = !kitMenuOpen" class="souls-btn !p-2" title="Opciones del kit">
              <i data-lucide="more-horizontal" class="w-3.5 h-3.5"></i>
            </button>

            <div x-show="kitMenuOpen" x-cloak
              class="absolute right-0 bottom-full mb-1 w-40 p-1 border shadow-xl z-30 space-y-0.5 text-xs"
              style="background: var(--wiki-bg-elevated); border-color: var(--wiki-border-strong);">
              <template x-if="kit.isCustom">
                <button type="button" @click="$store.settings.openDesigner(kit); kitMenuOpen = false"
                  class="w-full text-left px-2.5 py-1.5 hover:bg-white/10 flex items-center gap-2 cursor-pointer"
                  style="color: var(--wiki-text-main);">
                  <i data-lucide="edit-3" class="w-3.5 h-3.5"></i>
                  <span>Editar</span>
                </button>
              </template>
              <button type="button" @click="$store.settings.duplicateKit(kit); kitMenuOpen = false"
                class="w-full text-left px-2.5 py-1.5 hover:bg-white/10 flex items-center gap-2 cursor-pointer"
                style="color: var(--wiki-text-main);">
                <i data-lucide="copy" class="w-3.5 h-3.5"></i>
                <span>Duplicar</span>
              </button>
              <button type="button" @click="$store.settings.openExportKit(kit); kitMenuOpen = false"
                class="w-full text-left px-2.5 py-1.5 hover:bg-white/10 flex items-center gap-2 cursor-pointer"
                style="color: var(--wiki-text-main);">
                <i data-lucide="share-2" class="w-3.5 h-3.5"></i>
                <span>Exportar JSON</span>
              </button>
              <template x-if="kit.isCustom">
                <button type="button" @click="$store.settings.deleteCustomKit(kit.id); kitMenuOpen = false"
                  class="w-full text-left px-2.5 py-1.5 hover:bg-rose-500/20 text-rose-400 flex items-center gap-2 cursor-pointer border-t border-white/10">
                  <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                  <span>Eliminar</span>
                </button>
              </template>
            </div>
          </div>
        </div>
      </article>
    </template>
  </div>

  <!-- Estado vacío -->
  <template x-if="$store.settings.filteredThemeKits.length === 0">
    <div class="wiki-settings-card py-10 text-center space-y-2">
      <p class="text-sm m-0" style="color: var(--wiki-text-muted);">No hay temas que coincidan con tu búsqueda.</p>
      <button type="button"
        @click="$store.settings.kitSearchQuery = ''; $store.settings.kitCategoryFilter = 'all'"
        class="souls-btn mt-1">
        Ver todos los temas
      </button>
    </div>
  </template>

</div>
`;
}
