/**
 * @file src/ui/modals/modalSteamEmojis.ts
 */

export function renderModalSteamEmojis(): string {
  return `<!-- ==============================================================
     MODAL: CATÁLOGO Y EXPLORADOR DE EMOTICONOS DE STEAM
     Packs de juegos populares y catálogo libre por juego con integración a customEmojis.
     ============================================================== -->
<div id="steam-emojis-modal" x-data x-show="$store.steamEmojis.isOpen" x-cloak
  class="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md"
  @keydown.escape.window="$store.steamEmojis.close()" x-transition:enter="transition ease-out duration-200"
  x-transition:enter-start="opacity-0 scale-95" x-transition:enter-end="opacity-100 scale-100"
  x-transition:leave="transition ease-in duration-150" x-transition:leave-start="opacity-100 scale-100"
  x-transition:leave-end="opacity-0 scale-95">

  <!-- Backdrop Click -->
  <div class="absolute inset-0" @click="$store.steamEmojis.close()"></div>

  <!-- Modal Dialog Window -->
  <template x-if="$store.steamEmojis.isOpen">
    <div
      data-protect-contrast="true" class="relative z-10 w-full max-w-5xl max-h-[92vh] flex flex-col rounded-2xl bg-[#0b0e14] border border-[#66c0f4]/40 shadow-[0_0_50px_rgba(0,0,0,0.95),0_0_25px_rgba(102,192,244,0.2)] overflow-hidden"
      @click.stop>

      <!-- 1. Header Steam Points Shop -->
      <div
        class="p-4 sm:p-5 border-b border-white/10 bg-gradient-to-r from-black/90 via-[#101826] to-black/90 flex items-center justify-between gap-4 shrink-0">
        <div class="flex items-center gap-3.5 min-w-0">
          <div
            class="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#171a21] to-[#1b2838] border-2 border-[#66c0f4]/50 flex items-center justify-center text-[#66c0f4] shrink-0 shadow-[0_0_20px_rgba(102,192,244,0.3)]">
            <i data-lucide="smile" class="w-6 h-6"></i>
          </div>
          <div class="min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <h2 class="font-title text-base sm:text-lg font-extrabold uppercase tracking-wider text-white truncate">
                Librería y Catálogo de Emoticonos // Steam
              </h2>
              <span
                class="text-[9.5px] font-mono uppercase px-2 py-0.5 rounded-full bg-[#66c0f4]/15 border border-[#66c0f4]/40 text-[#66c0f4] tracking-wider flex items-center gap-1 shrink-0 font-bold">
                <span class="w-1.5 h-1.5 rounded-full bg-[#66c0f4] animate-pulse"></span>
                <span>Steam Community CDN</span>
              </span>
            </div>
            <p class="text-xs text-parchment-cream/70 font-sans truncate">
              Añade emoticonos oficiales de tus juegos favoritos para usarlos con <code class="font-mono text-[#66c0f4] font-bold">:código:</code> en cualquier editor.
            </p>
          </div>
        </div>

        <div class="flex items-center gap-3 shrink-0">
          <!-- Indicador de Capacidad de Emojis -->
          <div class="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-mono">
            <span class="text-parchment-cream/60">Librería:</span>
            <span class="font-bold text-white" x-text="$store.customEmojis.totalCount + ' / ' + $store.customEmojis.maxCapacity"></span>
          </div>

          <!-- Botón Cerrar -->
          <button type="button" @click="$store.steamEmojis.close()"
            class="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-slate-400 hover:text-white transition-all cursor-pointer">
            <i data-lucide="x" class="w-5 h-5"></i>
          </button>
        </div>
      </div>

      <!-- 2. Barra de Navegación de Subpestañas del Modal -->
      <div class="p-3 sm:px-5 border-b border-white/10 bg-[#0d121c] flex items-center justify-between gap-3 shrink-0 flex-wrap">
        <div class="flex items-center gap-2 flex-wrap">
          <button type="button" @click="$store.steamEmojis.setTab('packs')"
            class="px-3.5 py-1.5 rounded-xl text-xs font-mono uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer font-bold"
            :class="$store.steamEmojis.activeTab === 'packs'
              ? 'bg-[#66c0f4] text-black shadow-[0_0_12px_rgba(102,192,244,0.4)]'
              : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10'">
            <i data-lucide="package" class="w-3.5 h-3.5"></i>
            <span>Packs Populares</span>
            <span class="px-1.5 py-0.2 rounded text-[9px] font-mono"
              :class="$store.steamEmojis.activeTab === 'packs' ? 'bg-black/30 text-black' : 'bg-white/10 text-ink-slate'"
              x-text="$store.steamEmojis.allPacks.length + ' Packs'">
            </span>
          </button>

          <button type="button" @click="$store.steamEmojis.setTab('search')"
            class="px-3.5 py-1.5 rounded-xl text-xs font-mono uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer font-bold"
            :class="$store.steamEmojis.activeTab === 'search'
              ? 'bg-[#66c0f4] text-black shadow-[0_0_12px_rgba(102,192,244,0.4)]'
              : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10'">
            <i data-lucide="search" class="w-3.5 h-3.5"></i>
            <span>Catálogo Libre por Juego</span>
            <span class="px-1.5 py-0.2 rounded text-[9px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Online
            </span>
          </button>

          <button type="button" @click="$store.steamEmojis.setTab('installed')"
            class="px-3.5 py-1.5 rounded-xl text-xs font-mono uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer font-bold"
            :class="$store.steamEmojis.activeTab === 'installed'
              ? 'bg-[#66c0f4] text-black shadow-[0_0_12px_rgba(102,192,244,0.4)]'
              : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10'">
            <i data-lucide="check-circle" class="w-3.5 h-3.5"></i>
            <span>Instalados de Steam</span>
            <span class="px-1.5 py-0.2 rounded text-[9px] font-mono bg-white/10"
              x-text="$store.steamEmojis.installedSteamEmojis.length"></span>
          </button>
        </div>

        <!-- Botón rápido si hay pack seleccionado para volver atrás -->
        <template x-if="$store.steamEmojis.selectedPack && $store.steamEmojis.activeTab === 'packs'">
          <button type="button" @click="$store.steamEmojis.closePackDetail()"
            class="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-parchment-cream text-xs font-mono flex items-center gap-1.5 cursor-pointer">
            <i data-lucide="arrow-left" class="w-3 h-3"></i>
            <span>Ver todos los packs</span>
          </button>
        </template>
      </div>

      <!-- 3. Contenedor Principal Scrolleable -->
      <div class="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 custom-scrollbar bg-[#090d14]">

        <!-- ═════════════════════════════════════════════════════════
             SUB-TAB A: PACKS POPULARES PRECARGADOS (VALVE, CS, INDIES...)
             ═════════════════════════════════════════════════════════ -->
        <div x-show="$store.steamEmojis.activeTab === 'packs'" class="space-y-6">

          <!-- Vista Detallada de Pack Individual -->
          <template x-if="$store.steamEmojis.selectedPack">
            <div class="space-y-4">
              <!-- Banner del Pack Abierto -->
              <div class="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#111927] to-[#152336] border border-white/15 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div class="flex items-center gap-3.5">
                  <div class="w-14 h-14 rounded-2xl bg-black/60 border border-white/20 p-2 flex items-center justify-center shrink-0 shadow-inner">
                    <img :src="$store.steamEmojis.selectedPack.icon" :alt="$store.steamEmojis.selectedPack.name" class="w-full h-full object-contain filter drop-shadow" />
                  </div>
                  <div>
                    <div class="flex items-center gap-2 flex-wrap">
                      <h3 class="font-title text-lg font-bold text-white uppercase tracking-wider" x-text="$store.steamEmojis.selectedPack.name"></h3>
                      <span class="px-2 py-0.5 rounded text-[9.5px] font-mono uppercase bg-[#66c0f4]/20 text-[#66c0f4] border border-[#66c0f4]/40 font-bold"
                        x-text="$store.steamEmojis.selectedPack.badge"></span>
                    </div>
                    <p class="text-xs text-parchment-cream/70 font-sans mt-0.5" x-text="$store.steamEmojis.selectedPack.description"></p>
                    <span class="text-[11px] font-mono text-ink-slate block mt-1"
                      x-text="$store.steamEmojis.selectedPack.emojis.length + ' emoticonos en este pack • Categoría: ' + $store.steamEmojis.selectedPack.category"></span>
                  </div>
                </div>

                <div class="flex items-center gap-2.5 shrink-0 flex-wrap">
                  <button type="button" @click="$store.steamEmojis.installPack($store.steamEmojis.selectedPack)"
                    class="px-4 py-2 rounded-xl bg-[#66c0f4] text-black font-mono font-bold text-xs uppercase tracking-wider hover:bg-[#66c0f4]/90 transition-all flex items-center gap-2 cursor-pointer shadow-md">
                    <i data-lucide="plus" class="w-4 h-4"></i>
                    <span>Añadir Pack Completo</span>
                  </button>
                  <button type="button" @click="$store.steamEmojis.uninstallPack($store.steamEmojis.selectedPack)"
                    class="px-3 py-2 rounded-xl bg-white/5 hover:bg-red-500/20 text-slate-300 hover:text-red-300 border border-white/10 hover:border-red-500/30 font-mono text-xs uppercase transition-all flex items-center gap-1.5 cursor-pointer">
                    <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                    <span>Desinstalar Pack</span>
                  </button>
                </div>
              </div>

              <!-- Grid de Emoticonos del Pack Seleccionado -->
              <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                <template x-for="emoji in $store.steamEmojis.selectedPack.emojis" :key="emoji.shortcode">
                  <div class="p-3 rounded-xl bg-[#111622] border transition-all flex flex-col items-center text-center justify-between gap-2.5 group relative"
                    :class="$store.steamEmojis.isEmojiAdded(emoji.shortcode) ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-white/10 hover:border-[#66c0f4]/40 hover:bg-[#141b2a]'">

                    <!-- Badge si ya está añadido -->
                    <template x-if="$store.steamEmojis.isEmojiAdded(emoji.shortcode)">
                      <span class="absolute top-1.5 right-1.5 px-1 py-0.2 rounded bg-emerald-500 text-black font-mono font-black text-[8px] uppercase tracking-wider">
                        EN LIBRERÍA
                      </span>
                    </template>

                    <!-- Icono Imagen -->
                    <div class="w-12 h-12 rounded-lg bg-black/50 border border-white/10 flex items-center justify-center p-1.5 shrink-0 shadow-inner group-hover:scale-110 transition-transform">
                      <img :src="emoji.url" :alt="emoji.name" class="w-full h-full object-contain filter drop-shadow" loading="lazy" @error="$event.target.style.display='none'" />
                    </div>

                    <!-- Shortcode y Nombre -->
                    <div class="w-full min-w-0">
                      <span class="font-mono text-xs font-bold text-accent-gold truncate block" x-text="':' + emoji.shortcode + ':'"></span>
                      <p class="text-[10px] text-parchment-cream/60 font-sans truncate" x-text="emoji.name"></p>
                    </div>

                    <!-- Botón Añadir / Quitar -->
                    <button type="button" @click="$store.steamEmojis.toggleEmoji(emoji, $store.steamEmojis.selectedPack.category)"
                      class="w-full py-1.5 px-2 rounded-lg font-mono text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer"
                      :class="$store.steamEmojis.isEmojiAdded(emoji.shortcode)
                        ? 'bg-red-500/20 text-red-300 border border-red-500/40 hover:bg-red-500/30'
                        : 'bg-white/5 hover:bg-[#66c0f4] text-white hover:text-black border border-white/15 hover:border-[#66c0f4]'">
                      <span x-text="$store.steamEmojis.isEmojiAdded(emoji.shortcode) ? 'Quitar' : '+ Añadir'"></span>
                    </button>
                  </div>
                </template>
              </div>
            </div>
          </template>

          <!-- Vista General: Lista de Todos los Packs -->
          <template x-if="!$store.steamEmojis.selectedPack">
            <div class="space-y-5">
              <!-- Barra de Búsqueda de Packs -->
              <div class="flex items-center gap-3 bg-black/60 border border-white/15 focus-within:border-[#66c0f4] rounded-xl px-3.5 py-2.5 transition-all shadow-inner">
                <i data-lucide="search" class="w-4 h-4 text-[#66c0f4] shrink-0"></i>
                <input type="text"
                  class="bg-transparent border-0 text-sm text-white placeholder-white/40 focus:ring-0 focus:outline-none w-full font-sans"
                  placeholder="Filtrar paquetes por juego o temática (ej: Counter-Strike, Portal, Undertale, Hollow Knight, Isaac, Terraria)..."
                  x-model="$store.steamEmojis.query" />
                <button type="button" x-show="$store.steamEmojis.query" @click="$store.steamEmojis.query = ''"
                  class="text-white/40 hover:text-white transition-colors cursor-pointer p-1">
                  <i data-lucide="x" class="w-3.5 h-3.5"></i>
                </button>
              </div>

              <!-- Grid de Tarjetas de Packs -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <template x-for="pack in $store.steamEmojis.filteredPacks" :key="pack.id">
                  <div class="p-4 rounded-2xl bg-[#111724] border border-white/10 hover:border-[#66c0f4]/40 transition-all flex flex-col justify-between gap-3 relative group shadow-sm hover:shadow-md">
                    <!-- Cabecera de la Tarjeta del Pack -->
                    <div class="flex items-start justify-between gap-3">
                      <div class="flex items-center gap-3 min-w-0">
                        <div class="w-12 h-12 rounded-xl bg-black/50 border border-white/15 p-2 flex items-center justify-center shrink-0 shadow-inner group-hover:scale-105 transition-transform">
                          <img :src="pack.icon" :alt="pack.name" class="w-full h-full object-contain filter drop-shadow" @error="$event.target.style.display='none'" />
                        </div>
                        <div class="min-w-0">
                          <div class="flex items-center gap-2 flex-wrap">
                            <h4 class="font-title text-sm font-bold text-white uppercase tracking-wider truncate" x-text="pack.name"></h4>
                            <span class="px-1.5 py-0.2 rounded text-[8.5px] font-mono uppercase bg-[#66c0f4]/20 text-[#66c0f4] border border-[#66c0f4]/40 font-bold"
                              x-text="pack.badge"></span>
                          </div>
                          <p class="text-[11px] text-parchment-cream/70 font-sans line-clamp-1 mt-0.5" x-text="pack.description"></p>
                        </div>
                      </div>

                      <!-- Estado de Instalación -->
                      <span class="text-[10px] font-mono shrink-0 px-2 py-0.5 rounded-full"
                        :class="$store.steamEmojis.isPackFullyAdded(pack)
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold'
                          : 'bg-white/5 text-ink-slate border border-white/10'">
                        <span x-text="$store.steamEmojis.getPackAddedCount(pack) + ' / ' + pack.emojis.length"></span>
                      </span>
                    </div>

                    <!-- Tira de Miniaturas de Emoticonos del Pack -->
                    <div class="py-2 px-3 rounded-xl bg-black/40 border border-white/5 flex items-center gap-2 overflow-x-auto custom-scrollbar">
                      <template x-for="emoji in pack.emojis.slice(0, 8)" :key="emoji.shortcode">
                        <div class="w-7 h-7 rounded bg-white/5 p-1 shrink-0 flex items-center justify-center relative group/item"
                          :title="':' + emoji.shortcode + ': - ' + emoji.name">
                          <img :src="emoji.url" :alt="emoji.shortcode" class="w-full h-full object-contain filter drop-shadow-sm" loading="lazy" @error="$event.target.style.display='none'" />
                          <template x-if="$store.steamEmojis.isEmojiAdded(emoji.shortcode)">
                            <div class="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-black"></div>
                          </template>
                        </div>
                      </template>
                      <template x-if="pack.emojis.length > 8">
                        <span class="text-[10px] font-mono text-parchment-cream/40 shrink-0 px-1 font-bold"
                          x-text="'+' + (pack.emojis.length - 8)"></span>
                      </template>
                    </div>

                    <!-- Botones de Acción -->
                    <div class="flex items-center justify-between gap-2 pt-1 border-t border-white/5">
                      <button type="button" @click="$store.steamEmojis.openPackDetail(pack)"
                        class="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white font-mono text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer">
                        <i data-lucide="eye" class="w-3.5 h-3.5"></i>
                        <span>Ver Emoticonos</span>
                      </button>

                      <button type="button" @click="$store.steamEmojis.installPack(pack)"
                        class="px-3.5 py-1.5 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer"
                        :class="$store.steamEmojis.isPackFullyAdded(pack)
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-[#66c0f4] text-black hover:brightness-110 shadow-sm'">
                        <i data-lucide="check" class="w-3.5 h-3.5" x-show="$store.steamEmojis.isPackFullyAdded(pack)"></i>
                        <i data-lucide="download" class="w-3.5 h-3.5" x-show="!$store.steamEmojis.isPackFullyAdded(pack)"></i>
                        <span x-text="$store.steamEmojis.isPackFullyAdded(pack) ? 'Pack Completo' : '+ Añadir Pack'"></span>
                      </button>
                    </div>
                  </div>
                </template>
              </div>
            </div>
          </template>
        </div>

        <!-- ═════════════════════════════════════════════════════════
             SUB-TAB B: CATÁLOGO LIBRE POR JUEGO (BUSCADOR STEAM COMPLETO)
             ═════════════════════════════════════════════════════════ -->
        <div x-show="$store.steamEmojis.activeTab === 'search'" class="space-y-6">

          <!-- Buscador de Juego en Tiempo Real -->
          <div class="space-y-3">
            <div class="flex items-center gap-3 bg-black/60 border border-white/15 focus-within:border-[#66c0f4] rounded-xl px-3.5 py-3 transition-all shadow-inner relative">
              <i data-lucide="search" class="w-4 h-4 text-[#66c0f4] shrink-0" :class="$store.steamEmojis.isSearching ? 'animate-spin' : ''"></i>
              <input type="text"
                class="bg-transparent border-0 text-sm text-white placeholder-white/40 focus:ring-0 focus:outline-none w-full font-sans"
                placeholder="Busca cualquier juego de Steam (ej: PAYDAY 2, Dead by Daylight, Dark Souls, Celeste, OMORI, Rust)..."
                x-model="$store.steamEmojis.searchQuery"
                @input.debounce.300ms="$store.steamEmojis.onSearchInput()" />
              <button type="button" x-show="$store.steamEmojis.searchQuery" @click="$store.steamEmojis.searchQuery = ''; $store.steamEmojis.searchResults = []"
                class="text-white/40 hover:text-white transition-colors cursor-pointer p-1">
                <i data-lucide="x" class="w-3.5 h-3.5"></i>
              </button>
            </div>

            <!-- Resultados del Autocompletado de Búsqueda Online -->
            <div x-show="$store.steamEmojis.searchResults.length > 0"
              class="p-2 rounded-xl bg-[#141a26] border border-[#66c0f4]/40 space-y-1 max-h-56 overflow-y-auto custom-scrollbar shadow-xl">
              <div class="text-[10px] font-mono text-[#66c0f4] px-2 py-1 uppercase font-bold tracking-wider">
                Juegos encontrados en SteamCardExchange:
              </div>
              <template x-for="game in $store.steamEmojis.searchResults" :key="game.appid">
                <button type="button" @click="$store.steamEmojis.selectGame(game); $store.steamEmojis.searchResults = []"
                  class="w-full px-3 py-2 rounded-lg text-left text-xs font-sans text-parchment-cream hover:text-white hover:bg-white/10 flex items-center justify-between gap-2 transition-colors cursor-pointer">
                  <span class="font-bold truncate" x-text="game.name"></span>
                  <span class="text-[10px] font-mono text-ink-slate shrink-0" x-text="'AppID: ' + game.appid"></span>
                </button>
              </template>
            </div>

            <!-- Chips de Juegos Populares Recomendados -->
            <div class="flex items-center gap-1.5 flex-wrap">
              <span class="text-[11px] font-mono text-ink-slate mr-1">Populares:</span>
              <template x-for="fg in $store.steamEmojis.featuredGames" :key="fg.appid">
                <button type="button" @click="$store.steamEmojis.selectGame(fg)"
                  class="px-2.5 py-1 rounded-lg text-xs font-sans transition-all cursor-pointer"
                  :class="$store.steamEmojis.selectedGame?.appid === fg.appid
                    ? 'bg-[#66c0f4] text-black font-bold shadow-sm'
                    : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10'">
                  <span x-text="fg.name"></span>
                </button>
              </template>
            </div>
          </div>

          <!-- Cabecera del Juego Seleccionado y Acciones -->
          <template x-if="$store.steamEmojis.selectedGame">
            <div class="p-4 rounded-2xl bg-gradient-to-r from-[#121926] to-[#172233] border border-white/15 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div class="min-w-0">
                <div class="flex items-center gap-2 flex-wrap">
                  <h3 class="font-title text-base font-bold text-white uppercase tracking-wider truncate" x-text="$store.steamEmojis.selectedGame.name"></h3>
                  <span class="px-2 py-0.5 rounded text-[9.5px] font-mono bg-white/10 text-parchment-cream border border-white/15 font-bold"
                    x-text="'AppID: ' + $store.steamEmojis.selectedGame.appid"></span>
                </div>
                <p class="text-xs text-parchment-cream/70 font-sans mt-0.5"
                  x-text="$store.steamEmojis.selectedGameEmojis.length + ' emoticonos oficiales disponibles en Steam para este juego.'"></p>
              </div>

              <div class="flex items-center gap-2 shrink-0">
                <button type="button" @click="$store.steamEmojis.installAllFromActiveGame()"
                  :disabled="$store.steamEmojis.isLoading || $store.steamEmojis.selectedGameEmojis.length === 0"
                  class="px-3.5 py-1.5 rounded-xl bg-[#66c0f4] text-black font-mono font-bold text-xs uppercase tracking-wider hover:bg-[#66c0f4]/90 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50">
                  <i data-lucide="plus" class="w-3.5 h-3.5"></i>
                  <span>Añadir Todos a mi Colección</span>
                </button>
              </div>
            </div>
          </template>

          <!-- Loading Spinner -->
          <div x-show="$store.steamEmojis.isLoading" class="flex flex-col items-center justify-center py-16 space-y-3">
            <div class="w-10 h-10 border-2 border-[#66c0f4] border-t-transparent rounded-full animate-spin"></div>
            <p class="text-xs font-mono text-[#66c0f4] tracking-wider uppercase">Extrayendo emoticonos de Steam...</p>
          </div>

          <!-- Empty State si no hay emoticonos -->
          <div x-show="!$store.steamEmojis.isLoading && $store.steamEmojis.selectedGame && $store.steamEmojis.selectedGameEmojis.length === 0"
            class="flex flex-col items-center justify-center py-16 text-center space-y-3">
            <i data-lucide="inbox" class="w-10 h-10 text-ink-slate"></i>
            <p class="text-sm font-bold text-white uppercase">No se detectaron emoticonos de trading cards para este juego</p>
            <p class="text-xs text-ink-slate max-w-sm">Prueba buscando otro título en el buscador o selecciona uno de los juegos recomendados arriba.</p>
          </div>

          <!-- Grid de Emoticonos del Juego Seleccionado -->
          <div x-show="!$store.steamEmojis.isLoading && $store.steamEmojis.selectedGameEmojis.length > 0"
            class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            <template x-for="emoji in $store.steamEmojis.selectedGameEmojis" :key="emoji.shortcode">
              <div class="p-3 rounded-xl bg-[#111622] border transition-all flex flex-col items-center text-center justify-between gap-2.5 group relative"
                :class="$store.steamEmojis.isEmojiAdded(emoji.shortcode) ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-white/10 hover:border-[#66c0f4]/40 hover:bg-[#141b2a]'">

                <!-- Badge si ya está añadido -->
                <template x-if="$store.steamEmojis.isEmojiAdded(emoji.shortcode)">
                  <span class="absolute top-1.5 right-1.5 px-1 py-0.2 rounded bg-emerald-500 text-black font-mono font-black text-[8px] uppercase tracking-wider">
                    EN LIBRERÍA
                  </span>
                </template>

                <!-- Icono Imagen -->
                <div class="w-12 h-12 rounded-lg bg-black/50 border border-white/10 flex items-center justify-center p-1.5 shrink-0 shadow-inner group-hover:scale-110 transition-transform">
                  <img :src="emoji.url" :alt="emoji.name" class="w-full h-full object-contain filter drop-shadow" loading="lazy" @error="$event.target.style.display='none'" />
                </div>

                <!-- Shortcode y Nombre -->
                <div class="w-full min-w-0">
                  <span class="font-mono text-xs font-bold text-accent-gold truncate block" x-text="':' + emoji.shortcode + ':'"></span>
                  <p class="text-[10px] text-parchment-cream/60 font-sans truncate" x-text="emoji.name"></p>
                </div>

                <!-- Botón Añadir / Quitar -->
                <button type="button" @click="$store.steamEmojis.toggleEmoji(emoji, $store.steamEmojis.selectedGame?.name || 'Steam')"
                  class="w-full py-1.5 px-2 rounded-lg font-mono text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer"
                  :class="$store.steamEmojis.isEmojiAdded(emoji.shortcode)
                    ? 'bg-red-500/20 text-red-300 border border-red-500/40 hover:bg-red-500/30'
                    : 'bg-white/5 hover:bg-[#66c0f4] text-white hover:text-black border border-white/15 hover:border-[#66c0f4]'">
                  <span x-text="$store.steamEmojis.isEmojiAdded(emoji.shortcode) ? 'Quitar' : '+ Añadir'"></span>
                </button>
              </div>
            </template>
          </div>

        </div>

        <!-- ═════════════════════════════════════════════════════════
             SUB-TAB C: MIS EMOJIS DE STEAM INSTALADOS
             ═════════════════════════════════════════════════════════ -->
        <div x-show="$store.steamEmojis.activeTab === 'installed'" class="space-y-4">
          <div class="flex items-center justify-between border-b border-white/10 pb-2">
            <span class="text-xs font-mono uppercase text-parchment-cream font-bold">
              Emoticonos de Steam actualmente en tu librería (<span x-text="$store.steamEmojis.installedSteamEmojis.length"></span>)
            </span>
            <span class="text-[11px] font-mono text-ink-slate">Listos para usar con :código:</span>
          </div>

          <!-- Empty State si no tiene emojis de Steam instalados -->
          <div x-show="$store.steamEmojis.installedSteamEmojis.length === 0"
            class="flex flex-col items-center justify-center py-16 text-center space-y-3">
            <i data-lucide="package-open" class="w-12 h-12 text-ink-slate"></i>
            <p class="text-sm font-bold text-white uppercase">Aún no has añadido emojis de Steam</p>
            <p class="text-xs text-ink-slate max-w-sm">Explora la pestaña "Packs Populares" o "Catálogo Libre" para añadir emoticonos a tu colección con un solo clic.</p>
            <button type="button" @click="$store.steamEmojis.setTab('packs')"
              class="px-4 py-2 rounded-xl bg-[#66c0f4] text-black font-mono font-bold text-xs uppercase cursor-pointer">
              Ver Packs Populares
            </button>
          </div>

          <!-- Grid de Instalados -->
          <div x-show="$store.steamEmojis.installedSteamEmojis.length > 0"
            class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            <template x-for="emoji in $store.steamEmojis.installedSteamEmojis" :key="emoji.id">
              <div class="p-3 rounded-xl bg-[#111622] border border-white/10 hover:border-[#66c0f4]/40 transition-all flex flex-col items-center text-center justify-between gap-2.5 group">
                <div class="w-12 h-12 rounded-lg bg-black/50 border border-white/10 flex items-center justify-center p-1.5 shrink-0 shadow-inner group-hover:scale-110 transition-transform">
                  <img :src="emoji.url" :alt="emoji.name" class="w-full h-full object-contain filter drop-shadow" loading="lazy" @error="$event.target.style.display='none'" />
                </div>
                <div class="w-full min-w-0">
                  <span class="font-mono text-xs font-bold text-accent-gold truncate block" x-text="':' + emoji.shortcode + ':'"></span>
                  <p class="text-[10px] text-parchment-cream/60 font-sans truncate" x-text="emoji.name"></p>
                </div>
                <button type="button" @click="$store.customEmojis.deleteEmoji(emoji.id)"
                  class="w-full py-1.5 px-2 rounded-lg bg-red-500/10 hover:bg-red-500/25 text-red-300 border border-red-500/30 font-mono text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer">
                  Eliminar
                </button>
              </div>
            </template>
          </div>
        </div>

      </div>

      <!-- 4. Footer -->
      <div class="p-3 sm:p-4 border-t border-white/10 bg-[#0d121c] flex items-center justify-between gap-3 shrink-0 flex-wrap">
        <div class="text-xs font-mono text-ink-slate flex items-center gap-1.5">
          <i data-lucide="smile" class="w-4 h-4 text-[#66c0f4]"></i>
          <span>Los emoticonos añadidos se sincronizan en IndexedDB y se autocompletan en vivo.</span>
        </div>

        <button type="button" @click="$store.steamEmojis.close()"
          class="px-5 py-2 rounded-xl bg-[#66c0f4] text-black font-mono font-bold text-xs uppercase tracking-wider hover:bg-[#66c0f4]/90 transition-all cursor-pointer shadow-[0_0_15px_rgba(102,192,244,0.3)]">
          Listo
        </button>
      </div>

    </div>
  </template>
</div>
`;
}
