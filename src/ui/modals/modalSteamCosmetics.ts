/**
 * @file src/ui/modals/modalSteamCosmetics.ts
 */

export function renderModalSteamCosmetics(): string {
  return `<!-- ==============================================================
       MODAL: CATÁLOGO Y EXPLORADOR DE MARCOS DE AVATAR (STEAM POINTS SHOP)
       ============================================================== -->
  <div id="steam-frames-modal" x-data x-show="$store.steamFrames.isOpen" x-cloak
    class="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md"
    @keydown.escape.window="$store.steamFrames.close()" x-transition:enter="transition ease-out duration-200"
    x-transition:enter-start="opacity-0 scale-95" x-transition:enter-end="opacity-100 scale-100"
    x-transition:leave="transition ease-in duration-150" x-transition:leave-start="opacity-100 scale-100"
    x-transition:leave-end="opacity-0 scale-95">

    <!-- Backdrop Click -->
    <div class="absolute inset-0" @click="$store.steamFrames.close()"></div>

    <!-- Modal Dialog Window (Render diferido bajo demanda) -->
    <template x-if="$store.steamFrames.isOpen">
      <div
        data-protect-contrast="true" class="relative z-10 w-full max-w-5xl max-h-[92vh] flex flex-col rounded-2xl bg-[#0b0e14] border border-accent-cyan/40 shadow-[0_0_50px_rgba(0,0,0,0.9),0_0_25px_rgba(0,240,255,0.15)] overflow-hidden"
        @click.stop>

      <!-- 1. Header Cyberpunk / Steam -->
      <div
        class="p-4 sm:p-5 border-b border-white/10 bg-gradient-to-r from-black/80 via-[#10141d] to-black/80 flex items-center justify-between gap-4 shrink-0">
        <div class="flex items-center gap-3 min-w-0">
          <div
            class="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-cyan/20 to-accent-cyan/5 border border-accent-cyan/40 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(0,240,255,0.2)]">
            <svg class="w-5 h-5 text-accent-cyan" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="m4.93 4.93 4.24 4.24" />
              <path d="m14.83 9.17 4.24-4.24" />
              <path d="m14.83 14.83 4.24 4.24" />
              <path d="m9.17 14.83-4.24 4.24" />
            </svg>
          </div>
          <div class="min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <h2 class="font-title text-base sm:text-lg font-extrabold uppercase tracking-wider text-white truncate">
                Marcos de Avatar Animados // Steam Points Shop
              </h2>
              <span
                class="text-[9.5px] font-mono uppercase px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 tracking-wider flex items-center gap-1 shrink-0">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Conexión Directa Valve</span>
              </span>
            </div>
            <p class="text-xs text-parchment-cream/70 font-sans truncate">
              Explora más de 2,000 marcos cosméticos animados oficiales con soporte de transparencia APNG
            </p>
          </div>
        </div>

        <div class="flex items-center gap-2 shrink-0">
          <!-- Botón de Recargar API -->
          <button type="button" @click="$store.steamFrames.loadFrames(true)" :disabled="$store.steamFrames.isLoading"
            class="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-xs font-mono text-slate-300 hover:text-white transition-all cursor-pointer disabled:opacity-50"
            title="Forzar actualización desde el API oficial de Steam">
            <i data-lucide="refresh-cw" class="w-3.5 h-3.5"
              :class="$store.steamFrames.isLoading ? 'animate-spin text-accent-cyan' : ''"></i>
            <span class="text-[11px]">Actualizar Catálogo</span>
          </button>

          <!-- Botón Cerrar -->
          <button type="button" @click="$store.steamFrames.close()"
            class="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-slate-400 hover:text-white transition-all cursor-pointer">
            <i data-lucide="x" class="w-5 h-5"></i>
          </button>
        </div>
      </div>

      <!-- 2. Barra de Búsqueda y Filtros de Categorías -->
      <div class="p-3 sm:p-4 border-b border-white/10 bg-[#0d1017] space-y-3 shrink-0">
        <!-- Input de Búsqueda Principal -->
        <div class="relative">
          <div
            class="flex items-center gap-3 bg-black/70 border border-white/15 focus-within:border-accent-cyan rounded-xl px-3.5 py-2.5 transition-all shadow-inner">
            <i data-lucide="search" class="w-4 h-4 text-accent-cyan shrink-0"></i>
            <input type="text" id="steam-frames-search-input"
              class="bg-transparent border-0 text-sm text-white placeholder-white/40 focus:ring-0 focus:outline-none w-full font-sans"
              placeholder="Buscar por nombre de marco, temática o videojuego (ej: Fire, Neon, Hades, Cyber, Dragon, Skull, Gold)..."
              x-model="$store.steamFrames.query" @input="$store.steamFrames.onSearchInput()" />
            <button type="button" x-show="$store.steamFrames.query" @click="$store.steamFrames.clearSearch()"
              class="text-white/40 hover:text-white transition-colors cursor-pointer p-1">
              <i data-lucide="x" class="w-3.5 h-3.5"></i>
            </button>
          </div>
        </div>

        <!-- Filtros Rápidos de Categoría y Selector de Bordes del Avatar -->
        <div class="flex items-center justify-between gap-3 flex-wrap">
          <div class="flex items-center gap-1.5 flex-wrap">
            <button type="button" @click="$store.steamFrames.setCategory('all')"
              class="px-2.5 py-1 rounded-lg text-xs font-mono uppercase tracking-wider transition-all cursor-pointer"
              :class="$store.steamFrames.category === 'all' 
                ? 'bg-accent-cyan text-black font-bold shadow-[0_0_10px_rgba(0,240,255,0.4)]' 
                : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10'">
              Todos (<span x-text="$store.steamFrames.allFrames.length || 0"></span>)
            </button>

            <button type="button" @click="$store.steamFrames.setCategory('fire')"
              class="px-2.5 py-1 rounded-lg text-xs font-mono uppercase tracking-wider transition-all cursor-pointer"
              :class="$store.steamFrames.category === 'fire' 
                ? 'bg-amber-500 text-black font-bold shadow-[0_0_10px_rgba(245,158,11,0.4)]' 
                : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10'">
              <span>Fuego / Plasma</span>
            </button>

            <button type="button" @click="$store.steamFrames.setCategory('cyber')"
              class="px-2.5 py-1 rounded-lg text-xs font-mono uppercase tracking-wider transition-all cursor-pointer"
              :class="$store.steamFrames.category === 'cyber' 
                ? 'bg-cyan-400 text-black font-bold shadow-[0_0_10px_rgba(6,182,212,0.4)]' 
                : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10'">
              <span>Cyber / Neón</span>
            </button>

            <button type="button" @click="$store.steamFrames.setCategory('fantasy')"
              class="px-2.5 py-1 rounded-lg text-xs font-mono uppercase tracking-wider transition-all cursor-pointer"
              :class="$store.steamFrames.category === 'fantasy' 
                ? 'bg-purple-400 text-black font-bold shadow-[0_0_10px_rgba(192,132,252,0.4)]' 
                : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10'">
              <span>Fantasía / Mágico</span>
            </button>

            <button type="button" @click="$store.steamFrames.setCategory('dark')"
              class="px-2.5 py-1 rounded-lg text-xs font-mono uppercase tracking-wider transition-all cursor-pointer"
              :class="$store.steamFrames.category === 'dark' 
                ? 'bg-rose-500 text-white font-bold shadow-[0_0_10px_rgba(244,63,94,0.4)]' 
                : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10'">
              <span>Oscuro / Gótico</span>
            </button>

            <button type="button" @click="$store.steamFrames.setCategory('animated')"
              class="px-2.5 py-1 rounded-lg text-xs font-mono uppercase tracking-wider transition-all cursor-pointer"
              :class="$store.steamFrames.category === 'animated' 
                ? 'bg-emerald-400 text-black font-bold shadow-[0_0_10px_rgba(52,211,153,0.4)]' 
                : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10'">
              <span>Animados APNG</span>
            </button>
          </div>

          <!-- Selector de Bordes del Avatar y Total de coincidencias -->
          <div class="flex items-center gap-3 flex-wrap">
            <!-- Indicador y Alternador Rápido de Bordes -->
            <div class="flex items-center gap-1.5 bg-black/60 px-2 py-1 rounded-xl border border-white/15 shadow-inner">
              <span class="text-[10px] font-mono text-parchment-cream/70 uppercase">Bordes:</span>
              <span class="text-[10px] font-mono font-bold text-accent-cyan uppercase"
                x-text="$store.characters.isAvatarSquare() ? 'Cuadrado (0%)' : ($store.characters.isAvatarCircle() ? 'Circular (50%)' : ($store.characters.getAvatarRadius() + '%'))"></span>
              <button type="button" @click="$store.characters.toggleAvatarShape()"
                class="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-[10px] font-mono font-bold uppercase transition-all cursor-pointer text-white"
                title="Alternar entre cuadrado, redondeado y circular">
                Alternar
              </button>
            </div>

            <div class="text-[11px] font-mono text-parchment-cream/60">
              Mostrando <strong class="text-white" x-text="$store.steamFrames.paginatedFrames.length"></strong> de
              <strong class="text-accent-cyan" x-text="$store.steamFrames.totalCount"></strong> marcos
            </div>
          </div>
        </div>
      </div>

      <!-- 3. Contenedor Scrollable del Catálogo (Grid de Marcos) -->
      <div class="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        <!-- Indicador de Carga Inicial -->
        <div x-show="$store.steamFrames.isLoading && $store.steamFrames.allFrames.length === 0"
          class="py-16 text-center space-y-3">
          <div class="w-10 h-10 border-2 border-accent-cyan border-t-transparent rounded-full animate-spin mx-auto">
          </div>
          <p class="text-sm font-mono text-parchment-cream/80 uppercase tracking-wider">
            Conectando con la API oficial de Steam Points Shop...
          </p>
          <p class="text-xs text-ink-slate font-sans">
            Indexando más de 2,000 marcos cosméticos animados...
          </p>
        </div>

        <!-- Si la búsqueda no arrojó resultados -->
        <div x-show="!$store.steamFrames.isLoading && $store.steamFrames.paginatedFrames.length === 0"
          class="py-16 text-center space-y-3 max-w-md mx-auto">
          <div
            class="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-parchment-cream/40">
            <i data-lucide="frown" class="w-6 h-6"></i>
          </div>
          <h3 class="font-title text-base font-bold uppercase text-white">
            No se encontraron marcos
          </h3>
          <p class="text-xs text-parchment-cream/70 leading-relaxed font-sans">
            No encontramos ningún marco que coincida con tu criterio de búsqueda. Intenta con términos más generales en
            inglés o limpia los filtros.
          </p>
          <button type="button" @click="$store.steamFrames.clearSearch(); $store.steamFrames.setCategory('all')"
            class="px-4 py-2 rounded-xl bg-accent-cyan text-black font-mono font-bold text-xs uppercase tracking-wider cursor-pointer">
            Limpiar Búsqueda
          </button>
        </div>

        <!-- Grid de Tarjetas de Marco -->
        <div x-show="$store.steamFrames.paginatedFrames.length > 0"
          class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-4">
          <template x-for="frame in $store.steamFrames.paginatedFrames" :key="frame.id">
            <div
              class="steam-frame-card p-3 rounded-2xl bg-[#121620] border transition-all duration-200 flex flex-col justify-between gap-2.5 relative group"
              :class="$store.steamFrames.isEquipped(frame) 
                ? 'border-accent-gold shadow-[0_0_20px_rgba(245,158,11,0.25)] bg-[#171b26]' 
                : 'border-white/10 hover:border-accent-cyan/50 hover:bg-[#151a27]'">

              <!-- Badge de Equipado -->
              <div x-show="$store.steamFrames.isEquipped(frame)"
                class="absolute top-2 right-2 z-30 px-1.5 py-0.5 rounded-md bg-accent-gold text-black font-mono text-[9px] font-extrabold tracking-wider uppercase shadow-md">
                EQUIPADO
              </div>

              <!-- Vista Previa Central: Avatar + Marco Overlay Animado Oficial (Ajuste Exacto 1:1) -->
              <div class="py-2.5 flex items-center justify-center">
                <div class="relative w-20 h-20 sm:w-24 sm:h-24 shrink-0 flex items-center justify-center select-none">
                  <!-- Avatar Base (100% del contenedor para encajar exactamente en el marco de Steam) -->
                  <div
                    class="w-full h-full overflow-hidden bg-black/40 relative flex items-center justify-center shadow-inner transition-all"
                    :style="\`border-radius: \${$store.characters.getAvatarRadiusCss($store.characters.active)};\`">
                    <template x-if="$store.characters.getActiveAvatarUrl()">
                      <img :src="$store.characters.getActiveAvatarUrl()"
                        class="w-full h-full object-cover transition-all"
                        :style="\`\${$store.characters.getActiveAvatarTransform()}; border-radius: \${$store.characters.getAvatarRadiusCss($store.characters.active)};\`" alt="" />
                    </template>
                    <template x-if="!$store.characters.getActiveAvatarUrl()">
                      <svg class="w-10 h-10 text-white/30" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
                        fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"
                        stroke-linejoin="round">
                        <circle cx="12" cy="8" r="5" />
                        <path d="M20 21a8 8 0 0 0-16 0" />
                      </svg>
                    </template>
                  </div>

                  <!-- Marco de Steam Animado en APNG (Superpuesto en Geometría Oficial: 124% del avatar) -->
                  <img :src="frame.url" class="steam-avatar-frame-overlay pointer-events-none" :alt="frame.name"
                    loading="lazy" />
                </div>
              </div>

              <!-- Metadatos del Marco -->
              <div class="text-center space-y-0.5 min-w-0">
                <h4
                  class="font-title text-xs font-bold uppercase tracking-wider text-white truncate group-hover:text-accent-cyan transition-colors"
                  :title="$store.steamFrames.formatFrameName(frame.name)" x-text="$store.steamFrames.formatFrameName(frame.name)"></h4>
                <p class="text-[10.5px] font-sans text-parchment-cream/60 truncate" :title="$store.steamFrames.formatFrameGame(frame.game, frame.name)"
                  x-text="$store.steamFrames.formatFrameGame(frame.game, frame.name)"></p>
              </div>

              <!-- Botón de Equipar / Quitar -->
              <div class="pt-1">
                <button type="button" @click="$store.steamFrames.toggleEquip(frame)"
                  class="w-full py-1.5 px-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer"
                  :class="$store.steamFrames.isEquipped(frame)
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 hover:bg-red-500/20 hover:text-red-300 hover:border-red-500/50'
                    : 'bg-white/5 hover:bg-accent-cyan text-white hover:text-black border border-white/15 hover:border-accent-cyan shadow-sm'">
                  <span x-text="$store.steamFrames.isEquipped(frame) ? 'Desequipar' : 'Equipar'"></span>
                </button>
              </div>

            </div>
          </template>
        </div>

        <!-- Botón Cargar Más (Paginación Dinámica) -->
        <div x-show="$store.steamFrames.hasMore" class="pt-4 pb-2 text-center">
          <button type="button" @click="$store.steamFrames.loadMore()"
            class="px-6 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/20 text-xs font-mono font-bold uppercase tracking-wider text-white hover:text-accent-cyan transition-all cursor-pointer shadow-md hover:border-accent-cyan/50">
            Cargar más marcos (+48)...
          </button>
        </div>
      </div>

      <!-- 4. Footer del Modal -->
      <div class="p-3 sm:p-4 border-t border-white/10 bg-[#090b10] flex items-center justify-between gap-3 shrink-0">
        <div class="text-[11px] font-sans text-parchment-cream/60 flex items-center gap-2">
          <i data-lucide="info" class="w-3.5 h-3.5 text-accent-cyan shrink-0"></i>
          <span>Los marcos se visualizan en todas las tarjetas y fichas del personaje.</span>
        </div>

        <button type="button" @click="$store.steamFrames.close()"
          class="px-5 py-2 rounded-xl bg-accent-cyan text-black font-mono font-bold text-xs uppercase tracking-wider hover:bg-accent-cyan/90 transition-all cursor-pointer shadow-[0_0_15px_rgba(0,240,255,0.3)]">
          Listo
        </button>
      </div>
      </div>
    </template>
  </div>

  <!-- ==============================================================
       MODAL: CATÁLOGO Y EXPLORADOR DE AVATARES ANIMADOS (STEAM)
       ============================================================== -->
  <div id="steam-avatars-modal" x-data x-show="$store.steamAvatars.isOpen" x-cloak
    class="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md"
    @keydown.escape.window="$store.steamAvatars.close()" x-transition:enter="transition ease-out duration-200"
    x-transition:enter-start="opacity-0 scale-95" x-transition:enter-end="opacity-100 scale-100"
    x-transition:leave="transition ease-in duration-150" x-transition:leave-start="opacity-100 scale-100"
    x-transition:leave-end="opacity-0 scale-95">

    <!-- Backdrop Click -->
    <div class="absolute inset-0" @click="$store.steamAvatars.close()"></div>

    <!-- Modal Dialog Window (Render diferido bajo demanda) -->
    <template x-if="$store.steamAvatars.isOpen">
      <div
        data-protect-contrast="true" class="relative z-10 w-full max-w-5xl max-h-[92vh] flex flex-col rounded-2xl bg-[#0b0e14] border border-accent-cyan/40 shadow-[0_0_50px_rgba(0,0,0,0.9),0_0_25px_rgba(0,240,255,0.15)] overflow-hidden"
        @click.stop>

      <!-- 1. Header Cyberpunk / Steam -->
      <div
        class="p-4 sm:p-5 border-b border-white/10 bg-gradient-to-r from-black/80 via-[#10141d] to-black/80 flex items-center justify-between gap-4 shrink-0">
        <div class="flex items-center gap-3 min-w-0">
          <div
            class="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-cyan/20 to-accent-cyan/5 border border-accent-cyan/40 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(0,240,255,0.2)]">
            <i data-lucide="user-check" class="w-5 h-5 text-accent-cyan"></i>
          </div>
          <div class="min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <h2 class="font-title text-base sm:text-lg font-extrabold uppercase tracking-wider text-white truncate">
                Avatares Animados // Steam Points Shop
              </h2>
              <span
                class="text-[9.5px] font-mono uppercase px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 tracking-wider flex items-center gap-1 shrink-0">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>+2,700 Avatares Oficiales</span>
              </span>
            </div>
            <p class="text-xs text-parchment-cream/70 font-sans truncate">
              Asigna estos avatares animados al Ícono del personaje. Tu Avatar principal no se modificará.
            </p>
          </div>
        </div>

        <div class="flex items-center gap-2 shrink-0">
          <!-- Botón de Recargar API -->
          <button type="button" @click="$store.steamAvatars.loadAvatars(true)" :disabled="$store.steamAvatars.isLoading"
            class="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-xs font-mono text-slate-300 hover:text-white transition-all cursor-pointer disabled:opacity-50"
            title="Forzar actualización desde la API oficial de Steam">
            <i data-lucide="refresh-cw" class="w-3.5 h-3.5"
              :class="$store.steamAvatars.isLoading ? 'animate-spin text-accent-cyan' : ''"></i>
            <span class="text-[11px]">Actualizar Catálogo</span>
          </button>

          <!-- Botón Cerrar -->
          <button type="button" @click="$store.steamAvatars.close()"
            class="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-slate-400 hover:text-white transition-all cursor-pointer">
            <i data-lucide="x" class="w-5 h-5"></i>
          </button>
        </div>
      </div>

      <!-- 2. Barra de Búsqueda y Filtros de Categorías -->
      <div class="p-3 sm:p-4 border-b border-white/10 bg-[#0d1017] space-y-3 shrink-0">
        <!-- Input de Búsqueda Principal -->
        <div class="relative">
          <div
            class="flex items-center gap-3 bg-black/70 border border-white/15 focus-within:border-accent-cyan rounded-xl px-3.5 py-2.5 transition-all shadow-inner">
            <i data-lucide="search" class="w-4 h-4 text-accent-cyan shrink-0"></i>
            <input type="text" id="steam-avatars-search-input"
              placeholder="Buscar por nombre de avatar, juego o temática (ej: Hades, Anime, Cyberpunk, DOTA, Cat, Neon)..."
              class="bg-transparent border-0 text-xs sm:text-sm text-white placeholder-white/40 focus:ring-0 focus:outline-none w-full font-sans"
              x-model="$store.steamAvatars.query" @input="$store.steamAvatars.onSearchInput()" />
            <button type="button" x-show="$store.steamAvatars.query" @click="$store.steamAvatars.clearSearch()"
              class="text-white/40 hover:text-white transition-colors cursor-pointer p-1">
              <i data-lucide="x" class="w-4 h-4"></i>
            </button>
          </div>
        </div>

        <!-- Categorías Temáticas -->
        <div class="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin text-xs">
          <button type="button" @click="$store.steamAvatars.setCategory('all')"
            class="px-3 py-1 rounded-lg font-mono uppercase tracking-wider text-[11px] transition-all cursor-pointer shrink-0"
            :class="$store.steamAvatars.category === 'all'
              ? 'bg-accent-cyan text-black font-bold shadow-[0_0_12px_rgba(0,240,255,0.4)]'
              : 'bg-white/5 hover:bg-white/10 text-parchment-cream/70 hover:text-white border border-white/10'">
            Todos (<span x-text="$store.steamAvatars.allAvatars.length || 0"></span>)
          </button>

          <button type="button" @click="$store.steamAvatars.setCategory('anime')"
            class="px-3 py-1 rounded-lg font-mono uppercase tracking-wider text-[11px] transition-all cursor-pointer shrink-0"
            :class="$store.steamAvatars.category === 'anime'
              ? 'bg-accent-cyan text-black font-bold shadow-[0_0_12px_rgba(0,240,255,0.4)]'
              : 'bg-white/5 hover:bg-white/10 text-parchment-cream/70 hover:text-white border border-white/10'">
            Anime y Manga
          </button>

          <button type="button" @click="$store.steamAvatars.setCategory('cyber')"
            class="px-3 py-1 rounded-lg font-mono uppercase tracking-wider text-[11px] transition-all cursor-pointer shrink-0"
            :class="$store.steamAvatars.category === 'cyber'
              ? 'bg-accent-cyan text-black font-bold shadow-[0_0_12px_rgba(0,240,255,0.4)]'
              : 'bg-white/5 hover:bg-white/10 text-parchment-cream/70 hover:text-white border border-white/10'">
            Cyber y Sci-Fi
          </button>

          <button type="button" @click="$store.steamAvatars.setCategory('pixel')"
            class="px-3 py-1 rounded-lg font-mono uppercase tracking-wider text-[11px] transition-all cursor-pointer shrink-0"
            :class="$store.steamAvatars.category === 'pixel'
              ? 'bg-accent-cyan text-black font-bold shadow-[0_0_12px_rgba(0,240,255,0.4)]'
              : 'bg-white/5 hover:bg-white/10 text-parchment-cream/70 hover:text-white border border-white/10'">
            Pixel Art
          </button>

          <button type="button" @click="$store.steamAvatars.setCategory('fantasy')"
            class="px-3 py-1 rounded-lg font-mono uppercase tracking-wider text-[11px] transition-all cursor-pointer shrink-0"
            :class="$store.steamAvatars.category === 'fantasy'
              ? 'bg-accent-cyan text-black font-bold shadow-[0_0_12px_rgba(0,240,255,0.4)]'
              : 'bg-white/5 hover:bg-white/10 text-parchment-cream/70 hover:text-white border border-white/10'">
            Fantasía y RPG
          </button>

          <button type="button" @click="$store.steamAvatars.setCategory('dark')"
            class="px-3 py-1 rounded-lg font-mono uppercase tracking-wider text-[11px] transition-all cursor-pointer shrink-0"
            :class="$store.steamAvatars.category === 'dark'
              ? 'bg-accent-cyan text-black font-bold shadow-[0_0_12px_rgba(0,240,255,0.4)]'
              : 'bg-white/5 hover:bg-white/10 text-parchment-cream/70 hover:text-white border border-white/10'">
            Terror y Dark
          </button>

          <button type="button" @click="$store.steamAvatars.setCategory('creatures')"
            class="px-3 py-1 rounded-lg font-mono uppercase tracking-wider text-[11px] transition-all cursor-pointer shrink-0"
            :class="$store.steamAvatars.category === 'creatures'
              ? 'bg-accent-cyan text-black font-bold shadow-[0_0_12px_rgba(0,240,255,0.4)]'
              : 'bg-white/5 hover:bg-white/10 text-parchment-cream/70 hover:text-white border border-white/10'">
            Criaturas y Mascotas
          </button>

          <button type="button" @click="$store.steamAvatars.setCategory('fire')"
            class="px-3 py-1 rounded-lg font-mono uppercase tracking-wider text-[11px] transition-all cursor-pointer shrink-0"
            :class="$store.steamAvatars.category === 'fire'
              ? 'bg-accent-cyan text-black font-bold shadow-[0_0_12px_rgba(0,240,255,0.4)]'
              : 'bg-white/5 hover:bg-white/10 text-parchment-cream/70 hover:text-white border border-white/10'">
            Fuego y Elementos
          </button>
        </div>

        <!-- Barra de Estado / Conteo -->
        <div class="flex items-center justify-between text-xs font-mono text-ink-slate pt-1">
          <span>
            Mostrando <strong class="text-white" x-text="$store.steamAvatars.paginatedAvatars.length"></strong> de
            <strong class="text-accent-cyan" x-text="$store.steamAvatars.totalCount"></strong> avatares animados
          </span>
          <span class="text-[11px] text-amber-300 flex items-center gap-1 font-sans">
            <i data-lucide="shield-alert" class="w-3.5 h-3.5"></i>
            Equipa en el Ícono del personaje
          </span>
        </div>
      </div>

      <!-- 3. Contenedor de Grilla con Scroll -->
      <div class="flex-1 overflow-y-auto p-4 sm:p-5 bg-gradient-to-b from-[#090c12] to-[#06080c] min-h-[350px]">
        <!-- Loading State -->
        <div x-show="$store.steamAvatars.isLoading && $store.steamAvatars.allAvatars.length === 0"
          class="flex flex-col items-center justify-center py-20 text-center space-y-3">
          <div class="w-12 h-12 rounded-full border-2 border-accent-cyan border-t-transparent animate-spin"></div>
          <p class="text-sm font-mono text-accent-cyan">Conectando con la base de datos de Steam...</p>
        </div>

        <!-- Empty State -->
        <div x-show="!$store.steamAvatars.isLoading && $store.steamAvatars.paginatedAvatars.length === 0"
          class="flex flex-col items-center justify-center py-16 text-center space-y-3">
          <div
            class="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-ink-slate">
            <i data-lucide="search-x" class="w-8 h-8"></i>
          </div>
          <p class="font-title text-base font-bold text-white uppercase tracking-wider">
            No se encontraron avatares animados
          </p>
          <p class="text-xs text-ink-slate max-w-sm">
            Intenta con otro término de búsqueda en inglés o selecciona otra categoría.
          </p>
          <button type="button" @click="$store.steamAvatars.clearSearch(); $store.steamAvatars.setCategory('all')"
            class="px-4 py-1.5 rounded-xl bg-accent-cyan/20 border border-accent-cyan/40 text-accent-cyan text-xs font-mono uppercase hover:bg-accent-cyan/30 transition-all cursor-pointer">
            Limpiar Filtros
          </button>
        </div>

        <!-- Grid de Avatares Animados -->
        <div x-show="$store.steamAvatars.paginatedAvatars.length > 0"
          class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
          <template x-for="avatar in $store.steamAvatars.paginatedAvatars" :key="avatar.id">
            <div
              class="p-3 rounded-2xl bg-[#121620] border transition-all duration-200 flex flex-col items-center text-center group cursor-pointer relative overflow-hidden"
              :class="$store.steamAvatars.isEquipped(avatar)
                ? 'border-accent-cyan bg-accent-cyan/10 shadow-[0_0_20px_rgba(0,240,255,0.25)] ring-1 ring-accent-cyan'
                : 'border-white/10 hover:border-accent-cyan/50 hover:bg-[#181d2a]'"
              @click="$store.steamAvatars.promptEquip(avatar)">

              <!-- Indicador de Equipado Activo -->
              <div x-show="$store.steamAvatars.isEquipped(avatar)"
                class="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-accent-cyan text-black font-mono font-black text-[9px] uppercase tracking-wider shadow">
                EQUIPADO
              </div>

              <!-- Avatar Animado Thumbnail -->
              <div
                class="relative w-20 h-20 my-2 shrink-0 flex items-center justify-center rounded-2xl overflow-hidden bg-white/[0.04] border border-white/15 group-hover:border-accent-cyan/60 transition-all shadow-lg group-hover:scale-105">
                <img :src="avatar.url" class="w-full h-full object-contain p-1" :alt="avatar.name" loading="lazy" />
              </div>

              <!-- Nombre y Juego -->
              <div class="w-full space-y-0.5 my-1">
                <h3 class="font-title text-xs font-bold text-white group-hover:text-accent-cyan truncate w-full"
                  :title="avatar.name" x-text="avatar.name"></h3>
                <p class="text-[10px] text-parchment-cream/60 font-sans truncate w-full" :title="avatar.game || 'Steam'"
                  x-text="avatar.game || 'Steam'"></p>
              </div>

              <!-- Botón Equipar / Desequipar en Ícono -->
              <button type="button" @click.stop="$store.steamAvatars.promptEquip(avatar)"
                class="w-full mt-2 py-1.5 px-2 rounded-xl text-[10.5px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1"
                :class="$store.steamAvatars.isEquipped(avatar)
                  ? 'bg-accent-cyan text-black shadow-[0_0_10px_rgba(0,240,255,0.4)]'
                  : 'bg-white/5 group-hover:bg-accent-cyan/20 text-parchment-cream/80 group-hover:text-accent-cyan border border-white/10 group-hover:border-accent-cyan/40'">
                <i data-lucide="check" class="w-3 h-3" x-show="$store.steamAvatars.isEquipped(avatar)"></i>
                <span x-text="$store.steamAvatars.isEquipped(avatar) ? 'En Ícono' : 'Equipar'"></span>
              </button>
            </div>
          </template>
        </div>

        <!-- Botón Cargar Más (Paginación) -->
        <div x-show="$store.steamAvatars.hasMore" class="pt-6 pb-2 text-center">
          <button type="button" @click="$store.steamAvatars.loadMore()"
            class="px-6 py-2.5 rounded-xl bg-white/5 hover:bg-accent-cyan/20 border border-white/15 hover:border-accent-cyan/40 text-xs font-mono uppercase text-parchment-cream hover:text-accent-cyan font-bold transition-all cursor-pointer shadow-sm">
            Cargar Más Avatares (+48)
          </button>
        </div>
      </div>

      <!-- 4. Footer -->
      <div class="p-3 sm:p-4 border-t border-white/10 bg-[#0d1017] flex items-center justify-between gap-3 shrink-0">
        <div class="text-xs font-mono text-ink-slate flex items-center gap-1.5">
          <i data-lucide="film" class="w-4 h-4 text-accent-cyan"></i>
          <span>Los avatares animados reemplazan al ícono y se reproducen en vivo.</span>
        </div>

        <button type="button" @click="$store.steamAvatars.close()"
          class="px-5 py-2 rounded-xl bg-accent-cyan text-black font-mono font-bold text-xs uppercase tracking-wider hover:bg-accent-cyan/90 transition-all cursor-pointer shadow-[0_0_15px_rgba(0,240,255,0.3)]">
          Listo
        </button>
      </div>
      </div>
    </template>
  </div>

  <!-- ==============================================================
       MODAL: CONFIRMACIÓN DE REEMPLAZO DE ÍCONO DE PERSONAJE
       ============================================================== -->
  <div id="steam-avatar-confirm-modal" x-data x-show="$store.steamAvatars.showConfirmModal" x-cloak
    class="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
    @keydown.escape.window="$store.steamAvatars.cancelEquip()" x-transition:enter="transition ease-out duration-200"
    x-transition:enter-start="opacity-0 scale-95" x-transition:enter-end="opacity-100 scale-100"
    x-transition:leave="transition ease-in duration-150" x-transition:leave-start="opacity-100 scale-100"
    x-transition:leave-end="opacity-0 scale-95">

    <!-- Backdrop Click -->
    <div class="absolute inset-0" @click="$store.steamAvatars.cancelEquip()"></div>

    <!-- Modal Dialog Window -->
    <div
      class="relative z-10 w-full max-w-md rounded-2xl bg-[#0e131b] border-2 border-amber-500/50 shadow-[0_0_50px_rgba(0,0,0,0.95),0_0_30px_rgba(245,158,11,0.2)] overflow-hidden"
      @click.stop>

      <!-- Encabezado de Advertencia -->
      <div
        class="p-4 sm:p-5 border-b border-white/10 bg-gradient-to-r from-amber-500/20 via-[#192230] to-amber-500/20 flex items-center gap-3.5">
        <div
          class="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400 shrink-0 shadow-[0_0_15px_rgba(245,158,11,0.3)]">
          <i data-lucide="alert-triangle" class="w-5 h-5"></i>
        </div>
        <div class="min-w-0">
          <h3 class="font-title text-base font-extrabold uppercase tracking-wider text-white">
            ¿Reemplazar Ícono Actual?
          </h3>
          <p class="text-xs text-amber-300/80 font-sans">
            Ya tienes un ícono configurado en Datos Básicos
          </p>
        </div>
      </div>

      <!-- Contenido y Comparación Visual -->
      <div class="p-5 space-y-4 text-xs font-sans text-parchment-cream/90">
        <p class="leading-relaxed">
          Tu personaje ya tiene un ícono seleccionado. Si equipas este avatar animado de Steam, tu ícono actual será
          <strong>reemplazado</strong> por el nuevo.
        </p>

        <!-- Comparativa Visual (Ícono Actual vs Nuevo Avatar de Steam) -->
        <div class="p-3.5 rounded-xl bg-black/60 border border-white/10 flex items-center justify-around gap-2">
          <!-- Actual -->
          <div class="flex flex-col items-center text-center space-y-1.5">
            <span class="text-[10px] font-mono uppercase text-ink-slate font-bold">Ícono Actual</span>
            <div
              class="w-16 h-16 rounded-xl overflow-hidden bg-black/90 border border-red-500/50 flex items-center justify-center shadow">
              <template x-if="$store.steamAvatars.previousIconUrl">
                <img :src="$store.steamAvatars.previousIconUrl" class="w-full h-full object-cover" alt="Ícono actual" />
              </template>
              <template x-if="!$store.steamAvatars.previousIconUrl">
                <i data-lucide="image" class="w-6 h-6 text-white/30"></i>
              </template>
            </div>
            <span
              class="text-[9px] font-mono text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/20">Se
              reemplazará</span>
          </div>

          <!-- Flecha de Cambio -->
          <div class="flex flex-col items-center justify-center text-accent-cyan">
            <i data-lucide="arrow-right" class="w-6 h-6 animate-pulse"></i>
          </div>

          <!-- Nuevo Avatar de Steam -->
          <div class="flex flex-col items-center text-center space-y-1.5">
            <span class="text-[10px] font-mono uppercase text-accent-cyan font-bold">Nuevo Avatar</span>
            <div
              class="w-16 h-16 rounded-xl overflow-hidden bg-black/90 border border-accent-cyan/60 flex items-center justify-center shadow-[0_0_12px_rgba(0,240,255,0.25)]">
              <template x-if="$store.steamAvatars.pendingAvatar?.url">
                <img :src="$store.steamAvatars.pendingAvatar.url" class="w-full h-full object-cover"
                  alt="Nuevo avatar" />
              </template>
            </div>
            <span
              class="text-[9px] font-mono text-accent-cyan bg-accent-cyan/10 px-1.5 py-0.5 rounded border border-accent-cyan/20 truncate max-w-[100px]"
              x-text="$store.steamAvatars.pendingAvatar?.name || 'Steam'"></span>
          </div>
        </div>

        <!-- Nota Tranquilizadora sobre el Avatar Principal -->
        <div
          class="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2 text-emerald-300 text-[11px]">
          <i data-lucide="shield-check" class="w-4 h-4 shrink-0"></i>
          <span>Tu <strong>Avatar principal</strong> (foto/retrato) no se verá afectado en absoluto.</span>
        </div>
      </div>

      <!-- Botones de Acción (Cancelar vs Reemplazar Ícono) -->
      <div class="p-4 border-t border-white/10 bg-[#090c12] flex items-center justify-end gap-3">
        <button type="button" @click="$store.steamAvatars.cancelEquip()"
          class="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-parchment-cream hover:text-white font-hud text-xs font-bold uppercase tracking-wider transition-all cursor-pointer">
          Cancelar
        </button>

        <button type="button" @click="$store.steamAvatars.confirmEquip()"
          class="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-hud text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer shadow-[0_0_15px_rgba(245,158,11,0.3)]">
          Reemplazar Ícono
        </button>
      </div>

    </div>
  </div>
`;
}
