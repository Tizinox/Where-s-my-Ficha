/**
 * @file src/ui/views/tierlist/modalTierlistIconPicker.ts
 */

export function renderModalTierlistIconPicker(): string {
  return `<!-- Modal Selector de Ícono / Emblema Personalizado para la Tier List -->
<div id="tierlist-icon-picker-modal"
  class="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
  x-show="$store.tierlist.showIconPickerModal" x-cloak
  @keydown.escape.window="if (!$store.app.showCropper) $store.tierlist.closeIconPicker()"
  @click.self="if (!$store.app.showCropper) $store.tierlist.closeIconPicker()"
  role="dialog" aria-modal="true">

  <div
    data-protect-contrast="true" class="relative w-full max-w-2xl bg-[#0b0e17] border border-amber-500/40 rounded-2xl shadow-[0_0_30px_rgba(251,191,36,0.18)] shadow-2xl overflow-hidden flex flex-col text-parchment-cream max-h-[88vh] z-10"
    @click.stop>

    <!-- Modal Header -->
    <div
      class="px-6 sm:px-7 py-5 sm:py-5.5 border-b border-white/10 bg-gradient-to-r from-amber-950/40 via-black/70 to-black/80 flex items-center justify-between shrink-0">
      <div class="flex items-center gap-4">
        <div
          class="w-12 h-12 sm:w-13 sm:h-13 rounded-2xl bg-amber-500/20 text-amber-300 border-2 border-amber-400/50 flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(251,191,36,0.3)] overflow-hidden relative">
          <!-- Si tiene imagen personalizada cargada -->
          <div x-show="Boolean($store.tierlist.customIconUrl)" class="w-full h-full overflow-hidden flex items-center justify-center absolute inset-0">
            <img :src="$store.tierlist.customIconUrl || ''" class="w-full h-full"
              :style="$store.tierlist.getCustomIconStyle()" alt="" />
          </div>
          <!-- Si usa un ícono estándar de Lucide -->
          <div x-show="!$store.tierlist.customIconUrl" class="flex items-center justify-center w-full h-full">
            <i :data-lucide="$store.tierlist.icon || 'trophy'" class="w-6 h-6 text-amber-300"></i>
          </div>
        </div>
        <div class="space-y-0.5">
          <h3 class="font-title text-xl sm:text-2xl font-black text-white uppercase tracking-wider leading-snug">Personalizar Emblema de la Tier List</h3>
          <p class="text-xs sm:text-[12.5px] font-mono text-slate-400">
            Personalizando para: "<span class="text-amber-300 font-bold" x-text="$store.tierlist.title || 'Tier List'"></span>"
          </p>
        </div>
      </div>
      <button type="button" @click="$store.tierlist.closeIconPicker()"
        class="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
        title="Cerrar">
        <i data-lucide="x" class="w-5 h-5"></i>
      </button>
    </div>

    <!-- Segmented Tab Switcher (Subir Imagen vs Iconos Predeterminados) -->
    <div class="px-6 py-2.5 border-b border-white/10 bg-black/40 shrink-0">
      <div class="grid grid-cols-2 gap-2 p-1 rounded-xl bg-black/60 border border-white/15 text-xs font-mono">
        <button type="button" @click="$store.tierlist.iconPickerTab = 'upload'"
          class="py-2 px-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
          :class="$store.tierlist.iconPickerTab === 'upload' 
            ? 'bg-amber-500/25 text-amber-300 border border-amber-400/50 shadow-md shadow-amber-950/40' 
            : 'text-slate-400 hover:text-white hover:bg-white/5'">
          <i data-lucide="image" class="w-4 h-4"></i>
          <span>Subir Imagen Propia (GIF / PNG / JPG)</span>
        </button>

        <button type="button" @click="$store.tierlist.iconPickerTab = 'presets'"
          class="py-2 px-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
          :class="$store.tierlist.iconPickerTab === 'presets' 
            ? 'bg-amber-500/25 text-amber-300 border border-amber-400/50 shadow-md shadow-amber-950/40' 
            : 'text-slate-400 hover:text-white hover:bg-white/5'">
          <i data-lucide="layout-grid" class="w-4 h-4"></i>
          <span>Biblioteca de Íconos</span>
        </button>
      </div>
    </div>

    <!-- Modal Body -->
    <div class="px-6 pt-3.5 pb-6 space-y-4 overflow-y-auto flex-1">

      <!-- ════ PESTAÑA 1: SUBIR IMAGEN PROPIA Y AJUSTAR ════ -->
      <div x-show="$store.tierlist.iconPickerTab === 'upload'" class="space-y-5">

        <!-- Sección de Carga: Archivo Local o URL -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <!-- Opción A: Archivo Local -->
          <label
            class="flex flex-col items-center justify-center p-4 rounded-xl border border-dashed border-amber-400/30 bg-black/50 hover:bg-amber-950/20 hover:border-amber-400/60 cursor-pointer transition-all text-center group">
            <div
              class="w-10 h-10 rounded-full bg-amber-400/10 text-amber-300 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <i data-lucide="upload-cloud" class="w-5 h-5"></i>
            </div>
            <span class="text-xs font-mono font-bold text-white">Subir Archivo Local</span>
            <span class="text-[10px] text-slate-400 mt-0.5">PNG, JPG, WebP o GIF Animado</span>
            <input type="file" accept="image/*,.gif,.webp" class="hidden"
              @change="$store.tierlist.handleCustomIconUpload($event)" />
          </label>

          <!-- Opción B: Pegar Enlace / URL Web -->
          <div class="flex flex-col justify-between p-3.5 rounded-xl border border-white/10 bg-black/50 space-y-2">
            <div>
              <span class="text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5 mb-1">
                <i data-lucide="link" class="w-3.5 h-3.5 text-cyan-400"></i>
                O usar Enlace Web Directo
              </span>
              <p class="text-[10px] text-slate-500 font-mono">Pega cualquier enlace público de imagen o GIF</p>
            </div>
            <div class="flex items-center gap-1.5">
              <input type="text" x-model="$store.tierlist.customIconUrlInput"
                @keydown.enter.prevent="$store.tierlist.setCustomIconFromUrl($store.tierlist.customIconUrlInput)"
                placeholder="Pega enlace de Pinterest, ArtStation, Pixiv, Are.na o imagen directa"
                class="flex-1 px-3 py-1.5 rounded-lg bg-black/80 border border-white/20 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-400 transition-colors" />
              <button type="button" @click="$store.tierlist.setCustomIconFromUrl($store.tierlist.customIconUrlInput)"
                class="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/40 text-amber-200 border border-amber-400/40 text-xs font-mono font-bold cursor-pointer transition-all">
                Cargar
              </button>
            </div>
          </div>
        </div>

        <!-- Si YA hay imagen cargada: Panel de Encuadre Visual Libre (Cropper) -->
        <template x-if="$store.tierlist.customIconUrl">
          <div class="p-4 rounded-2xl bg-black/60 border border-amber-400/35 space-y-4 shadow-xl">
            <div class="flex items-center justify-between border-b border-white/10 pb-2.5">
              <span
                class="text-xs font-mono font-bold text-amber-300 uppercase tracking-wider flex items-center gap-2">
                <i data-lucide="crop" class="w-4 h-4 text-amber-400"></i>
                Encuadre y Geometría Visual del Emblema
              </span>
              <button type="button" @click="$store.tierlist.removeCustomIcon()"
                class="px-2.5 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/40 text-[11px] font-mono cursor-pointer transition-colors flex items-center gap-1.5"
                title="Quitar esta imagen personalizada y volver a los íconos de catálogo">
                <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                <span>Quitar Imagen</span>
              </button>
            </div>

            <div class="flex flex-col sm:flex-row items-center gap-5">
              <!-- Preview en vivo del Emblema con su encuadre/transform -->
              <div class="shrink-0 flex flex-col items-center gap-1.5">
                <div
                  class="relative w-24 h-24 rounded-2xl border-2 border-amber-400 bg-[#090d16] overflow-hidden flex items-center justify-center shadow-xl shadow-amber-950/50">
                  <img :src="$store.tierlist.customIconUrl" class="w-full h-full pointer-events-none"
                    :style="$store.tierlist.getCustomIconStyle()" alt="Encuadre" />
                </div>
                <span class="text-[9px] font-mono uppercase tracking-widest text-emerald-400 font-bold flex items-center gap-1">
                  <i data-lucide="check-circle" class="w-3 h-3"></i> Activo
                </span>
              </div>

              <!-- Acciones de Encuadre Libre: Botón principal de Cropper y Carga -->
              <div class="flex-1 w-full space-y-3">
                <div class="space-y-1">
                  <h4 class="text-xs font-mono font-bold text-white uppercase tracking-wider">
                    Control de Encuadre Visual Libre
                  </h4>
                  <p class="text-[11px] font-mono text-slate-300 leading-relaxed">
                    Ajusta tu imagen o GIF con total libertad: arrastra para mover, rota en 90°, espeja horizontal o verticalmente y ajusta el zoom visual.
                  </p>
                </div>

                <div class="flex items-center gap-2.5 flex-wrap pt-1">
                  <button type="button" @click="$store.tierlist.openIconCropper()"
                    class="py-2 px-3.5 rounded-xl bg-amber-500/25 hover:bg-amber-500/40 text-amber-200 border border-amber-400/60 text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer shadow-[0_0_15px_rgba(251,191,36,0.25)] hover:scale-[1.02] active:scale-[0.98]">
                    <i data-lucide="crop" class="w-4 h-4 text-amber-300"></i>
                    <span>Encuadrar / Editar con Cropper</span>
                  </button>

                  <label
                    class="py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 border border-white/20 text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Subir otro archivo">
                    <i data-lucide="upload" class="w-3.5 h-3.5 text-cyan-400"></i>
                    <span>Cambiar Imagen</span>
                    <input type="file" accept="image/*,.gif,.webp" class="hidden"
                      @change="$store.tierlist.handleCustomIconUpload($event)" />
                  </label>
                </div>
              </div>
            </div>

            <!-- Pistas informativas Cyberpunk HUD -->
            <div class="pt-2 border-t border-white/10 flex items-center justify-between text-[10px] font-mono text-slate-400">
              <span class="flex items-center gap-1">
                <i data-lucide="sparkles" class="w-3 h-3 text-amber-400"></i>
                <span>Compatible con PNG, JPG, WebP y GIFs animados con fotogramas intactos</span>
              </span>
              <span class="text-amber-400/90 font-bold">Proporción 1:1</span>
            </div>
          </div>
        </template>

        <template x-if="!$store.tierlist.customIconUrl">
          <div
            class="p-4 rounded-xl bg-white/[0.02] border border-white/10 text-center text-xs font-mono text-slate-400 space-y-1">
            <p class="font-bold text-slate-300">No tienes una imagen personalizada cargada.</p>
            <p>Sube un archivo de imagen o pega un enlace para usar tu propio logo, escudo o GIF animado en la Tier
              List.</p>
          </div>
        </template>
      </div>

      <!-- ════ PESTAÑA 2: BIBLIOTECA DE ÍCONOS ════ -->
      <div x-show="$store.tierlist.iconPickerTab === 'presets'" class="space-y-4">
        <!-- Buscador de Íconos -->
        <div class="relative">
          <i data-lucide="search"
            class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"></i>
          <input type="text" x-model="$store.tierlist.iconSearchQuery"
            placeholder="Buscar por nombre o categoría (ej: espada, fuerza, cerebro, escudo)..."
            class="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/70 border border-white/15 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors" />
        </div>

        <!-- Rejilla de Íconos Seleccionables (Espaciosa y sin duplicación de checks) -->
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[46vh] overflow-y-auto pr-1">
          <template x-for="ic in $store.tierlist.filteredIcons" :key="ic.id">
            <button type="button" @click="$store.tierlist.setTierListIcon(ic.id)"
              class="group/btn p-3 rounded-xl border flex items-center justify-between gap-2.5 transition-all cursor-pointer text-left"
              :class="(!$store.tierlist.customIconUrl && $store.tierlist.icon === ic.id) 
                ? 'bg-amber-500/20 border-amber-400 text-amber-200 shadow-[0_0_15px_rgba(251,191,36,0.3)] ring-1 ring-amber-400/50' 
                : 'bg-black/50 border-white/10 text-slate-300 hover:border-amber-400/40 hover:bg-amber-950/20 hover:text-white'">

              <div class="flex items-center gap-3 min-w-0">
                <div class="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border"
                  :class="(!$store.tierlist.customIconUrl && $store.tierlist.icon === ic.id) ? 'border-amber-400/60 bg-amber-400/25 text-amber-300' : 'border-white/10 bg-black/60 text-slate-400 group-hover/btn:text-amber-300 group-hover/btn:border-amber-400/40'">
                  <i :data-lucide="ic.id" class="w-4 h-4"></i>
                </div>
                <div class="min-w-0">
                  <span
                    class="text-xs font-mono font-bold block leading-tight text-white group-hover/btn:text-amber-200"
                    x-text="ic.label"></span>
                  <span class="text-[9px] font-mono text-slate-500 block uppercase mt-0.5"
                    x-text="ic.category || 'General'"></span>
                </div>
              </div>

              <!-- Check Único Inmutable en SVG Puro (100% inmune a duplicaciones de Lucide) -->
              <span x-show="!$store.tierlist.customIconUrl && $store.tierlist.icon === ic.id"
                class="w-5 h-5 text-amber-400 shrink-0 flex items-center justify-center">
                <svg class="w-5 h-5 drop-shadow-[0_0_6px_rgba(251,191,36,0.8)]" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </span>
            </button>
          </template>
        </div>
      </div>

    </div>

    <!-- Modal Footer -->
    <div class="px-6 py-4 border-t border-white/10 bg-black/60 flex items-center justify-between">
      <span class="text-[11px] font-mono text-slate-500">Los cambios se aplican y guardan automáticamente</span>
      <button type="button" @click="$store.tierlist.closeIconPicker()"
        class="px-5 py-2 rounded-xl text-xs font-mono font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-400/40 transition-colors cursor-pointer">
        Listo / Cerrar
      </button>
    </div>
  </div>
</div>
`;
}
