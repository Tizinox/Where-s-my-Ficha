/**
 * @file src/ui/tabs/tabSteam.ts
 */

export function renderTabSteam(): string {
  return `<!-- =========================================================
               PESTAÑA 11: STEAM (HUB DE COSMÉTICOS e INTEGRACIONES)
               Módulo opcional: no aparece por defecto y no se exporta.
               ========================================================= -->
          <div x-show="$store.app.currentTab === 'steam'" class="space-y-6" data-tab-section="steam" x-data="{ 
              activeSubTab: 'frames', // 'frames' | 'avatars' | 'badges' | 'emojis'
              showManualUrlInput: false, 
              manualUrl: '', 
              inlineQuery: '', 
              get inlineMatches() { 
                return $store.steamFrames.searchQuick(this.inlineQuery, 12); 
              },
              showManualAvatarUrlInput: false,
              manualAvatarUrl: '',
              inlineAvatarQuery: '',
              get inlineAvatarMatches() {
                return $store.steamAvatars.searchQuick(this.inlineAvatarQuery, 12);
              },
              init() {
                this.$watch('$store.app.currentTab', (val) => {
                  if (val === 'steam') {
                    if (this.activeSubTab === 'frames') $store.steamFrames.ensureLoaded?.();
                    else if (this.activeSubTab === 'avatars') $store.steamAvatars.ensureLoaded?.();
                    else if (this.activeSubTab === 'badges') $store.steamBadges.ensureLoaded?.();
                  }
                });
                this.$watch('activeSubTab', (val) => {
                  if ($store.app.currentTab === 'steam') {
                    if (val === 'frames') $store.steamFrames.ensureLoaded?.();
                    else if (val === 'avatars') $store.steamAvatars.ensureLoaded?.();
                    else if (val === 'badges') $store.steamBadges.ensureLoaded?.();
                  }
                });
              }
            }">

            <!-- Banner Cabecera Oficial Steam Hub -->
            <div
              class="form-card relative overflow-hidden bg-gradient-to-r from-[#0b1015] via-[#121c27] to-[#1a2b3c] border border-[#66c0f4]/30 shadow-[0_0_25px_rgba(102,192,244,0.1)]">
              <!-- Glow decorativo de fondo -->
              <div
                class="absolute -right-10 -top-10 w-56 h-56 bg-[#66c0f4]/10 rounded-full blur-3xl pointer-events-none">
              </div>

              <div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div class="flex items-center gap-3.5">
                  <div
                    class="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#171a21] to-[#1b2838] border-2 border-[#66c0f4]/40 flex items-center justify-center text-[#66c0f4] shadow-[0_0_15px_rgba(102,192,244,0.3)] shrink-0">
                    <i data-lucide="steam" class="w-6 h-6"></i>
                  </div>
                  <div>
                    <div class="flex items-center gap-2 flex-wrap">
                      <h3 class="font-title text-xl font-bold tracking-wide uppercase text-white drop-shadow-md">
                        STEAM POINTS SHOP y COSMÉTICOS
                      </h3>
                      <span
                        class="px-2 py-0.5 rounded-full text-[10px] font-mono uppercase bg-[#66c0f4]/15 border border-[#66c0f4]/40 text-[#66c0f4] tracking-wider">
                        MÓDULO OPCIONAL
                      </span>
                      <span
                        class="px-2 py-0.5 rounded-full text-[10px] font-mono uppercase bg-white/5 border border-white/10 text-white/50 tracking-wider">
                        NO AFECTA EXPORTACIÓN
                      </span>
                    </div>
                    <p class="text-xs text-parchment-cream/70 font-sans mt-0.5">
                      Personaliza y embellece tu personaje con marcos animados, efectos de avatar y cosméticos oficiales
                      de Steam.
                    </p>
                  </div>
                </div>

                <!-- Botón ocultar sección -->
                <button type="button" @click="$store.app.removeTab('steam')"
                  class="self-start md:self-auto px-3 py-1.5 rounded-xl bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500/40 text-ink-slate hover:text-red-300 font-hud text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer"
                  title="Ocultar esta pestaña de la barra lateral (puedes volver a añadirla en cualquier momento)">
                  <i data-lucide="eye-off" class="w-3.5 h-3.5"></i>
                  <span>Ocultar Pestaña</span>
                </button>
              </div>
            </div>

            <!-- Selector de Subpestañas Oficiales Steam (Marcos de Avatar vs Avatares Animados) -->
            <div class="flex items-center gap-2 border-b border-white/10 pb-3 flex-wrap">
              <button type="button" @click="activeSubTab = 'frames'; $store.steamFrames.ensureLoaded?.()"
                class="px-4 py-2 rounded-xl font-hud text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer"
                :class="activeSubTab === 'frames' 
                  ? 'bg-accent-cyan text-black shadow-[0_0_15px_rgba(0,240,255,0.35)]' 
                  : 'bg-white/5 hover:bg-white/10 text-parchment-cream/70 hover:text-white border border-white/10'">
                <i data-lucide="square" class="w-4 h-4"></i>
                <span>Marcos de Avatar</span>
                <span class="px-1.5 py-0.5 rounded text-[9.5px] font-mono"
                  :class="activeSubTab === 'frames' ? 'bg-black/30 text-black' : 'bg-white/10 text-ink-slate'">
                  +2,000
                </span>
              </button>

              <button type="button" @click="activeSubTab = 'avatars'; $store.steamAvatars.ensureLoaded?.()"
                class="px-4 py-2 rounded-xl font-hud text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer"
                :class="activeSubTab === 'avatars' 
                  ? 'bg-accent-cyan text-black shadow-[0_0_15px_rgba(0,240,255,0.35)]' 
                  : 'bg-white/5 hover:bg-white/10 text-parchment-cream/70 hover:text-white border border-white/10'">
                <i data-lucide="user-check" class="w-4 h-4"></i>
                <span>Avatares Animados (Ícono)</span>
                <span class="px-1.5 py-0.5 rounded text-[9.5px] font-mono uppercase font-bold"
                  :class="activeSubTab === 'avatars' ? 'bg-black/30 text-black' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'">
                  +2,700
                </span>
              </button>

              <button type="button" @click="activeSubTab = 'badges'; $store.steamBadges.ensureLoaded?.()"
                class="px-4 py-2 rounded-xl font-hud text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer"
                :class="activeSubTab === 'badges' 
                  ? 'bg-accent-cyan text-black shadow-[0_0_15px_rgba(0,240,255,0.35)]' 
                  : 'bg-white/5 hover:bg-white/10 text-parchment-cream/70 hover:text-white border border-white/10'">
                <i data-lucide="award" class="w-4 h-4"></i>
                <span>Insignias de Steam</span>
                <span class="px-1.5 py-0.5 rounded text-[9.5px] font-mono font-bold uppercase"
                  :class="activeSubTab === 'badges' ? 'bg-black/30 text-black' : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'">
                  +2,200
                </span>
              </button>

              <button type="button" @click="activeSubTab = 'emojis'"
                class="px-4 py-2 rounded-xl font-hud text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer"
                :class="activeSubTab === 'emojis' 
                  ? 'bg-accent-cyan text-black shadow-[0_0_15px_rgba(0,240,255,0.35)]' 
                  : 'bg-white/5 hover:bg-white/10 text-parchment-cream/70 hover:text-white border border-white/10'">
                <i data-lucide="smile" class="w-4 h-4"></i>
                <span>Emoticonos de Steam</span>
                <span class="px-1.5 py-0.5 rounded text-[9.5px] font-mono font-bold uppercase"
                  :class="activeSubTab === 'emojis' ? 'bg-black/30 text-black' : 'bg-[#66c0f4]/20 text-[#66c0f4] border border-[#66c0f4]/40'">
                  Packs y Catálogo
                </span>
              </button>
            </div>

            <!-- SUBPESTAÑA 1: MARCOS DE AVATAR -->
            <div x-show="activeSubTab === 'frames'" class="space-y-6">
              <!-- Panel Principal: Cuadrícula de Gestión Cosmética de Steam -->
              <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">

                <!-- COLUMNA IZQUIERDA (5 COLS): ESCAPARATE DE AVATAR y MARCO EQUIPADO -->
                <div class="lg:col-span-5 form-card space-y-4">
                  <div class="flex items-center justify-between border-b border-parchment-brown/20 pb-2.5">
                    <span
                      class="text-xs font-title font-bold uppercase tracking-wider text-accent-cyan flex items-center gap-2">
                      <i data-lucide="square" class="w-4 h-4 text-accent-cyan"></i>
                      Marco de Avatar de Steam
                    </span>
                    <span
                      class="text-[9px] font-mono uppercase px-2 py-0.5 rounded-full bg-accent-cyan/15 border border-accent-cyan/30 text-accent-cyan tracking-wider">
                      ANIMADO
                    </span>
                  </div>

                  <!-- ESCAPARATE VISUAL DEL AVATAR -->
                  <div
                    class="p-6 rounded-2xl bg-gradient-to-b from-[#0e141b] to-[#080c10] border border-[#66c0f4]/25 flex flex-col items-center justify-center text-center space-y-4 relative overflow-hidden shadow-inner">
                    <div
                      class="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(102,192,244,0.08)_0%,transparent_70%)] pointer-events-none">
                    </div>

                    <!-- Contenedor del Avatar con el Marco Animado Superpuesto -->
                    <div class="relative shrink-0 flex items-center justify-center p-3">
                      <div class="relative w-24 h-24 shrink-0">
                        <div
                          class="w-full h-full relative overflow-hidden bg-black/40 flex items-center justify-center transition-all shadow-2xl"
                          :style="\`border: 2px solid \${$store.characters.getCharAccentColor($store.characters.active)}; border-radius: \${$store.characters.getAvatarRadiusCss($store.characters.active)}; isolation: isolate;\`">
                          <template x-if="$store.characters.getActiveAvatarUrl()">
                            <img :src="$store.characters.getActiveAvatarUrl()"
                              class="w-full h-full object-cover transition-all"
                              :style="\`\${$store.characters.getActiveAvatarTransform()}; border-radius: \${$store.characters.getAvatarRadiusCss($store.characters.active)};\`" alt="Avatar del personaje" />
                          </template>
                          <template x-if="!$store.characters.getActiveAvatarUrl()">
                            <div class="w-full h-full flex items-center justify-center text-white/40">
                              <i data-lucide="user" class="w-10 h-10"></i>
                            </div>
                          </template>
                        </div>

                        <!-- Marco de Avatar Superpuesto (Anclado exactamente al avatar 1:1) -->
                        <template x-if="$store.characters.active?.basics?.avatarFrame?.url">
                          <img :src="$store.characters.active.basics.avatarFrame.url"
                            class="steam-avatar-frame-overlay pointer-events-none" alt="Marco activo" />
                        </template>
                      </div>
                    </div>

                    <!-- Metadatos del Marco Activo o Estado Vacío -->
                    <template x-if="$store.characters.active?.basics?.avatarFrame?.url">
                      <div class="space-y-1 w-full">
                        <h4
                          class="font-title text-base font-bold text-white uppercase tracking-wider truncate drop-shadow"
                          x-text="$store.characters.getAvatarFrameDisplayName() || 'Marco Steam'"></h4>
                        <p class="text-xs text-parchment-cream/70 font-sans truncate"
                          x-text="$store.characters.getAvatarFrameGameName() || 'Steam Points Shop'"></p>
                        <div class="flex items-center justify-center gap-2 pt-1">
                          <span
                            class="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold">
                            Equipado en Avatar
                          </span>
                          <span
                            class="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-[#66c0f4]/20 text-[#66c0f4] border border-[#66c0f4]/40 font-bold">
                            APNG Animado
                          </span>
                        </div>
                      </div>
                    </template>

                    <template x-if="!$store.characters.active?.basics?.avatarFrame?.url">
                      <div class="space-y-1 max-w-xs">
                        <p class="font-title text-sm font-bold uppercase tracking-wider text-parchment-cream">
                          Sin Marco Equipado
                        </p>
                        <p class="text-xs text-ink-slate leading-relaxed">
                          Explora el catálogo o usa el buscador rápido para elegir entre más de 2,000 marcos de la
                          tienda de Steam.
                        </p>
                      </div>
                    </template>

                    <!-- Botones de Acción del Escaparate -->
                    <div class="w-full pt-2 flex items-center gap-2 border-t border-white/10">
                      <button type="button" @click="$store.steamFrames.open()"
                        class="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-accent-cyan/20 via-accent-cyan/15 to-accent-cyan/20 hover:from-accent-cyan/30 hover:to-accent-cyan/30 border border-accent-cyan/50 text-accent-cyan font-hud text-xs font-extrabold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(0,240,255,0.15)] hover:shadow-[0_0_20px_rgba(0,240,255,0.3)]">
                        <i data-lucide="compass" class="w-4 h-4"></i>
                        <span>Explorar Catálogo (+2,000)</span>
                      </button>
                      <template x-if="$store.characters.active?.basics?.avatarFrame?.url">
                        <button type="button" @click="$store.characters.removeAvatarFrame()"
                          class="py-2.5 px-3.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/40 text-red-300 font-hud text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                          title="Quitar marco actual">
                          <i data-lucide="trash-2" class="w-4 h-4"></i>
                          <span>Quitar</span>
                        </button>
                      </template>
                    </div>
                  </div>

                  <!-- Entrada de URL Personalizada Directa -->
                  <div class="p-3 rounded-xl bg-black/40 border border-white/10 space-y-2">
                    <div class="flex items-center justify-between text-xs">
                      <span class="font-sans text-parchment-cream/80 flex items-center gap-1.5">
                        <i data-lucide="link" class="w-3.5 h-3.5 text-accent-gold"></i>
                        URL de Marco Directa / Externa
                      </span>
                      <button type="button" @click="showManualUrlInput = !showManualUrlInput"
                        class="text-[11px] text-accent-gold hover:underline font-mono cursor-pointer"
                        x-text="showManualUrlInput ? 'Cerrar' : 'Pegar URL'"></button>
                    </div>

                    <div x-show="showManualUrlInput" x-collapse class="space-y-2 pt-1">
                      <div class="flex items-center gap-2">
                        <input type="text" class="form-input text-xs flex-1 py-1.5 px-3 bg-black/60"
                          placeholder="https://... (APNG, PNG o WebP)" x-model="manualUrl"
                          @keydown.enter.prevent="if(manualUrl.trim()){ $store.characters.setAvatarFrame({ name: 'Marco Personalizado', url: manualUrl.trim(), animated: true }); manualUrl = ''; showManualUrlInput = false; }" />
                        <button type="button"
                          class="px-3 py-1.5 bg-accent-cyan text-black font-hud text-xs font-bold uppercase rounded-xl hover:bg-accent-cyan/80 transition-colors cursor-pointer shrink-0"
                          @click="if(manualUrl.trim()){ $store.characters.setAvatarFrame({ name: 'Marco Personalizado', url: manualUrl.trim(), animated: true }); manualUrl = ''; showManualUrlInput = false; }">
                          Aplicar
                        </button>
                      </div>
                      <p class="text-[10px] text-ink-slate">
                        Puedes pegar la URL de cualquier marco de Steam Community Market o CDN de Valve.
                      </p>
                    </div>
                  </div>
                </div>

                <!-- COLUMNA DERECHA (7 COLS): BUSCADOR RÁPIDO y CATÁLOGO EN VIVO -->
                <div class="lg:col-span-7 form-card space-y-4">
                  <div class="flex items-center justify-between border-b border-parchment-brown/20 pb-2.5">
                    <span
                      class="text-xs font-title font-bold uppercase tracking-wider text-parchment-cream flex items-center gap-2">
                      <i data-lucide="search" class="w-4 h-4 text-accent-cyan"></i>
                      Buscador Rápido de Marcos
                    </span>
                    <button type="button" @click="$store.steamFrames.open()"
                      class="text-xs font-hud font-bold text-[#66c0f4] hover:underline flex items-center gap-1 cursor-pointer">
                      <span>Ver Catálogo Completo</span>
                      <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>
                    </button>
                  </div>

                  <!-- Input de búsqueda -->
                  <div class="relative">
                    <div
                      class="flex items-center gap-2.5 bg-black/70 border border-white/15 focus-within:border-accent-cyan rounded-xl px-3 py-2 transition-all shadow-inner">
                      <i data-lucide="search" class="w-4 h-4 text-accent-cyan shrink-0"></i>
                      <input type="text"
                        placeholder="Buscar por temática o juego (ej: Fire, Neon, Cyber, Hades, Skull, Anime)..."
                        class="bg-transparent border-0 text-xs text-white placeholder-white/40 focus:ring-0 focus:outline-none w-full font-sans"
                        x-model="inlineQuery" />
                      <button type="button" x-show="inlineQuery" @click="inlineQuery = ''"
                        class="text-white/40 hover:text-white transition-colors cursor-pointer p-0.5">
                        <i data-lucide="x" class="w-3.5 h-3.5"></i>
                      </button>
                    </div>
                  </div>

                  <!-- Sugerencias Populares Rápidas si el buscador está vacío -->
                  <div x-show="!inlineQuery || inlineQuery.trim().length < 2" class="space-y-3">
                    <div class="flex items-center gap-1.5 flex-wrap text-xs">
                      <span class="text-[11px] font-mono text-ink-slate shrink-0">Tendencias:</span>
                      <template
                        x-for="tag in ['Fire', 'Cyber', 'Neon', 'Hades', 'Gold', 'Skull', 'Anime', 'Pixel', 'Space']"
                        :key="tag">
                        <button type="button" @click="inlineQuery = tag"
                          class="px-2 py-0.5 rounded-lg bg-white/5 hover:bg-accent-cyan/20 border border-white/10 hover:border-accent-cyan/40 text-[10.5px] font-mono text-parchment-cream/80 hover:text-accent-cyan transition-all cursor-pointer"
                          x-text="tag"></button>
                      </template>
                    </div>

                    <!-- Mini Muestrario Destacado de Marcos Oficiales -->
                    <div class="pt-2">
                      <p class="text-[11px] font-mono uppercase tracking-wider text-ink-slate mb-2">Marcos Populares de
                        la Comunidad</p>
                      <div class="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                        <template x-for="f in $store.steamFrames.allFrames.slice(0, 6)" :key="f.id">
                          <div @click="$store.steamFrames.toggleEquip(f)"
                            class="p-2 rounded-xl bg-black/50 border border-white/10 hover:border-accent-cyan/40 hover:bg-white/5 transition-all cursor-pointer flex flex-col items-center text-center group"
                            :class="$store.steamFrames.isEquipped(f) ? 'border-accent-cyan bg-accent-cyan/10 shadow-[0_0_12px_rgba(0,240,255,0.2)]' : ''">
                            <!-- Marco Thumbnail -->
                            <div class="relative shrink-0 flex items-center justify-center p-1.5 my-0.5">
                              <div class="relative w-9 h-9 shrink-0">
                                <div
                                  class="w-full h-full relative bg-black/60 border border-white/10 flex items-center justify-center overflow-hidden"
                                  :style="\`border-radius: \${$store.characters.getAvatarRadiusCss($store.characters.active)}; isolation: isolate;\`">
                                  <template x-if="$store.characters.getActiveAvatarUrl()">
                                    <img :src="$store.characters.getActiveAvatarUrl()"
                                      class="w-full h-full object-cover"
                                      :style="$store.characters.getActiveAvatarTransform()" alt="" />
                                  </template>
                                  <template x-if="!$store.characters.getActiveAvatarUrl()">
                                    <i data-lucide="user" class="w-4 h-4 text-white/40"></i>
                                  </template>
                                </div>
                                <img :src="f.url" class="steam-avatar-frame-overlay pointer-events-none" alt="" />
                              </div>
                            </div>
                            <span
                              class="text-[11px] font-title font-bold text-white group-hover:text-accent-cyan truncate w-full"
                              x-text="$store.steamFrames.formatFrameName(f.name)"></span>
                            <span class="text-[9px] font-sans text-ink-slate truncate w-full"
                              x-text="$store.steamFrames.formatFrameGame(f.game, f.name)"></span>
                            <span class="mt-1 text-[9px] font-mono uppercase font-bold px-1.5 py-0.5 rounded"
                              :class="$store.steamFrames.isEquipped(f) ? 'bg-accent-cyan text-black' : 'bg-white/5 text-parchment-cream/70 group-hover:text-white'"
                              x-text="$store.steamFrames.isEquipped(f) ? 'Equipado' : 'Equipar'"></span>
                          </div>
                        </template>
                      </div>
                    </div>
                  </div>

                  <!-- Resultados en Vivo cuando escribe -->
                  <div x-show="inlineQuery && inlineQuery.trim().length >= 2" class="space-y-3">
                    <div
                      class="flex items-center justify-between text-xs font-mono border-b border-white/10 pb-1.5 text-parchment-cream/70">
                      <span>Coincidencias: <strong class="text-accent-cyan"
                          x-text="inlineMatches.length"></strong></span>
                      <button type="button" @click="$store.steamFrames.query = inlineQuery; $store.steamFrames.open()"
                        class="text-accent-gold hover:underline flex items-center gap-1 cursor-pointer text-xs">
                        <span>Ver resultados en catálogo completo</span>
                        <i data-lucide="arrow-right" class="w-3 h-3"></i>
                      </button>
                    </div>

                    <template x-if="inlineMatches.length === 0">
                      <div class="py-8 text-center text-xs text-ink-slate font-sans space-y-1">
                        <i data-lucide="search-x" class="w-8 h-8 mx-auto text-ink-slate/60 mb-2"></i>
                        <p>No se encontraron marcos para «<span class="text-white font-mono"
                            x-text="inlineQuery"></span>»</p>
                        <p class="text-[10.5px] text-parchment-cream/50">Prueba buscando en inglés como: <strong
                            class="text-cyan-300">fire, glow, cyber, neon, dark, dragon, cat</strong></p>
                      </div>
                    </template>

                    <!-- Grilla de Resultados Rápidos -->
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-96 overflow-y-auto pr-1">
                      <template x-for="f in inlineMatches" :key="f.id">
                        <div @click="$store.steamFrames.toggleEquip(f)"
                          class="flex items-center gap-3 p-2 rounded-xl border border-white/10 bg-black/40 hover:border-accent-cyan/40 hover:bg-white/5 cursor-pointer transition-all group"
                          :class="$store.steamFrames.isEquipped(f) ? 'bg-accent-cyan/15 border-accent-cyan/50 shadow-sm' : ''">
                          <!-- Thumbnail del marco con el avatar del usuario -->
                          <div class="relative shrink-0 flex items-center justify-center p-1">
                            <div class="relative w-8 h-8 shrink-0">
                              <div
                                class="w-full h-full relative overflow-hidden bg-black/60 border border-white/10 flex items-center justify-center"
                                :style="\`border-radius: \${$store.characters.getAvatarRadiusCss($store.characters.active)}; isolation: isolate;\`">
                                <template x-if="$store.characters.getActiveAvatarUrl()">
                                  <img :src="$store.characters.getActiveAvatarUrl()" class="w-full h-full object-cover"
                                    :style="$store.characters.getActiveAvatarTransform()" alt="" />
                                </template>
                                <template x-if="!$store.characters.getActiveAvatarUrl()">
                                  <i data-lucide="user" class="w-4 h-4 text-white/40"></i>
                                </template>
                              </div>
                              <img :src="f.url" class="steam-avatar-frame-overlay pointer-events-none" alt="" />
                            </div>
                          </div>

                          <!-- Info del Marco -->
                          <div class="min-w-0 flex-1">
                            <p class="text-xs font-title font-bold text-white group-hover:text-accent-cyan truncate"
                              x-text="$store.steamFrames.formatFrameName(f.name)"></p>
                            <p class="text-[10px] text-parchment-cream/60 truncate"
                              x-text="$store.steamFrames.formatFrameGame(f.game, f.name)"></p>
                          </div>

                          <!-- Botón de acción -->
                          <button type="button"
                            class="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase transition-all shrink-0 cursor-pointer"
                            :class="$store.steamFrames.isEquipped(f) 
                            ? 'bg-accent-cyan text-black' 
                            : 'bg-white/5 text-parchment-cream/80 border border-white/15 group-hover:border-accent-cyan/40 group-hover:text-accent-cyan'"
                            x-text="$store.steamFrames.isEquipped(f) ? 'Equipado' : 'Equipar'">
                          </button>
                        </div>
                      </template>
                    </div>
                  </div>

                </div>

              </div>
            </div>
            <!-- FIN SUBPESTAÑA 1: MARCOS DE AVATAR -->

            <!-- ==============================================================
                 SUBPESTAÑA 2: AVATARES ANIMADOS DE STEAM (ÍCONO DE PERSONAJE)
                 ============================================================== -->
            <div x-show="activeSubTab === 'avatars'" class="space-y-6">

              <!-- AVISO ACLARATORIO CRÍTICO: REEMPLAZA AL ÍCONO, NO AL AVATAR -->
              <div
                class="p-4 rounded-2xl bg-gradient-to-r from-[#0e1622] via-[#121c29] to-[#0e1622] border border-[#66c0f4]/30 shadow-[0_0_20px_rgba(102,192,244,0.08)] flex items-start gap-4">
                <div
                  class="w-10 h-10 rounded-xl bg-[#66c0f4]/15 border border-[#66c0f4]/40 flex items-center justify-center text-[#66c0f4] shrink-0 mt-0.5 shadow-sm">
                  <i data-lucide="info" class="w-5 h-5"></i>
                </div>
                <div class="space-y-1 min-w-0">
                  <div class="flex items-center gap-2 flex-wrap">
                    <h4 class="font-title text-sm font-bold uppercase text-white tracking-wide">
                      Cosmético de Steam para el Ícono del Personaje
                    </h4>
                    <span
                      class="px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                      REEMPLAZA ÍCONO · AVATAR INTACTO
                    </span>
                  </div>
                  <p class="text-xs text-parchment-cream/80 font-sans leading-relaxed">
                    Al seleccionar un avatar animado de Steam, este reemplazará exclusivamente al <strong>Ícono del
                      personaje</strong> (<code
                      class="font-mono text-cyan-300 text-[11px]">char.basics.iconDataUrl</code>). Tu <strong>Avatar
                      principal</strong> (retrato/foto de perfil) permanecerá completamente intacto y sin ninguna
                    modificación.
                  </p>
                </div>
              </div>

              <!-- Cuadrícula Principal: Escaparate de Ícono (5 cols) + Buscador Rápido de Avatares (7 cols) -->
              <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">

                <!-- COLUMNA IZQUIERDA (5 COLS): ESCAPARATE DE ÍCONO DE STEAM -->
                <div class="lg:col-span-5 form-card space-y-4">
                  <div class="flex items-center justify-between border-b border-parchment-brown/20 pb-2.5">
                    <span
                      class="text-xs font-title font-bold uppercase tracking-wider text-accent-cyan flex items-center gap-2">
                      <i data-lucide="user-check" class="w-4 h-4 text-accent-cyan"></i>
                      Ícono de Personaje Activo
                    </span>
                    <span
                      class="text-[9px] font-mono uppercase px-2 py-0.5 rounded-full bg-accent-cyan/15 border border-accent-cyan/30 text-accent-cyan tracking-wider">
                      STEAM AVATAR
                    </span>
                  </div>

                  <!-- Escaparate Visual del Ícono con animación y Marco de Steam si existe -->
                  <div
                    class="p-6 rounded-2xl bg-gradient-to-b from-[#0e141b] to-[#080c10] border border-[#66c0f4]/25 flex flex-col items-center justify-center text-center space-y-4 relative overflow-hidden shadow-inner">
                    <div
                      class="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(102,192,244,0.08)_0%,transparent_70%)] pointer-events-none">
                    </div>

                    <!-- Contenedor del Ícono animado (con soporte para el marco de Steam si lo tiene) -->
                    <div class="relative shrink-0 flex items-center justify-center p-3">
                      <div class="relative w-24 h-24 shrink-0">
                        <div
                          class="w-full h-full relative overflow-hidden bg-white/[0.04] backdrop-blur-sm flex items-center justify-center transition-all shadow-2xl rounded-2xl border-2 border-[#66c0f4]/50" style="isolation: isolate;">
                          <template x-if="$store.characters.active?.basics?.iconDataUrl">
                            <img :src="$store.characters.active.basics.iconDataUrl"
                              class="w-full h-full object-cover transition-all"
                              :style="$store.characters.active.basics.iconTransform || ''"
                              alt="Ícono animado de Steam" />
                          </template>
                          <template x-if="!$store.characters.active?.basics?.iconDataUrl">
                            <div class="w-full h-full flex flex-col items-center justify-center text-white/30 gap-1">
                              <i data-lucide="image-off" class="w-8 h-8"></i>
                              <span class="text-[9px] font-mono uppercase">Sin Ícono</span>
                            </div>
                          </template>
                        </div>

                        <!-- Marco de Avatar Superpuesto si está equipado (Anclado exactamente al ícono 1:1) -->
                        <template x-if="$store.characters.active?.basics?.avatarFrame?.url">
                          <img :src="$store.characters.active.basics.avatarFrame.url"
                            class="steam-avatar-frame-overlay pointer-events-none" alt="Marco activo" />
                        </template>
                      </div>
                    </div>

                    <!-- Metadatos del Ícono Activo o Estado Vacío -->
                    <template x-if="$store.characters.active?.basics?.iconDataUrl">
                      <div class="space-y-1 w-full">
                        <h4
                          class="font-title text-base font-bold text-white uppercase tracking-wider truncate drop-shadow"
                          x-text="$store.characters.active.basics.steamIcon?.name || 'Ícono Personalizado'"></h4>
                        <p class="text-xs text-parchment-cream/70 font-sans truncate"
                          x-text="$store.characters.active.basics.steamIcon?.game || 'Steam Points Shop'"></p>
                        <div class="flex items-center justify-center gap-2 pt-1 flex-wrap">
                          <span
                            class="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold">
                            Equipado en Ícono
                          </span>
                          <span
                            class="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-[#66c0f4]/20 text-[#66c0f4] border border-[#66c0f4]/40 font-bold">
                            Animación Steam
                          </span>
                        </div>
                      </div>
                    </template>

                    <template x-if="!$store.characters.active?.basics?.iconDataUrl">
                      <div class="space-y-1 max-w-xs">
                        <p class="font-title text-sm font-bold uppercase tracking-wider text-parchment-cream">
                          Sin Ícono Equipado
                        </p>
                        <p class="text-xs text-ink-slate leading-relaxed">
                          Selecciona uno de los más de 2,700 avatares animados oficiales de Steam para asignarlo al
                          ícono de tu personaje.
                        </p>
                      </div>
                    </template>

                    <!-- Botones de Acción del Escaparate -->
                    <div class="w-full pt-2 flex items-center gap-2 border-t border-white/10">
                      <button type="button" @click="$store.steamAvatars.open()"
                        class="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-accent-cyan/20 via-accent-cyan/15 to-accent-cyan/20 hover:from-accent-cyan/30 hover:to-accent-cyan/30 border border-accent-cyan/50 text-accent-cyan font-hud text-xs font-extrabold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(0,240,255,0.15)] hover:shadow-[0_0_20px_rgba(0,240,255,0.3)]">
                        <i data-lucide="grid" class="w-4 h-4"></i>
                        <span>Explorar Catálogo (+2,700)</span>
                      </button>
                      <template x-if="$store.characters.active?.basics?.iconDataUrl">
                        <button type="button" @click="$store.characters.removeSteamIcon()"
                          class="py-2.5 px-3.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/40 text-red-300 font-hud text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                          title="Quitar ícono actual">
                          <i data-lucide="trash-2" class="w-4 h-4"></i>
                          <span>Quitar</span>
                        </button>
                      </template>
                    </div>
                  </div>

                  <!-- Entrada de URL Manual Directa (para cualquier avatar animado WebP/APNG/GIF) -->
                  <div class="p-3 rounded-xl bg-black/40 border border-white/10 space-y-2">
                    <div class="flex items-center justify-between text-xs">
                      <span class="font-sans text-parchment-cream/80 flex items-center gap-1.5">
                        <i data-lucide="link" class="w-3.5 h-3.5 text-accent-gold"></i>
                        URL de Avatar Directa / Externa
                      </span>
                      <button type="button" @click="showManualAvatarUrlInput = !showManualAvatarUrlInput"
                        class="text-[11px] text-accent-gold hover:underline font-mono cursor-pointer"
                        x-text="showManualAvatarUrlInput ? 'Cerrar' : 'Pegar URL'"></button>
                    </div>

                    <div x-show="showManualAvatarUrlInput" x-collapse class="space-y-2 pt-1">
                      <div class="flex items-center gap-2">
                        <input type="text" class="form-input text-xs flex-1 py-1.5 px-3 bg-black/60"
                          placeholder="https://... (WebP, GIF o APNG animado)" x-model="manualAvatarUrl"
                          @keydown.enter.prevent="if(manualAvatarUrl.trim()){ $store.steamAvatars.promptEquip({ name: 'Avatar Personalizado', url: manualAvatarUrl.trim(), game: 'Enlace Directo', animated: true }); manualAvatarUrl = ''; showManualAvatarUrlInput = false; }" />
                        <button type="button"
                          class="px-3 py-1.5 bg-accent-cyan text-black font-hud text-xs font-bold uppercase rounded-xl hover:bg-accent-cyan/80 transition-colors cursor-pointer shrink-0"
                          @click="if(manualAvatarUrl.trim()){ $store.steamAvatars.promptEquip({ name: 'Avatar Personalizado', url: manualAvatarUrl.trim(), game: 'Enlace Directo', animated: true }); manualAvatarUrl = ''; showManualAvatarUrlInput = false; }">
                          Aplicar
                        </button>
                      </div>
                      <p class="text-[10px] text-ink-slate">
                        Puedes pegar la URL directa de cualquier avatar animado de Steam Community Market o CDN de
                        Valve.
                      </p>
                    </div>
                  </div>
                </div>

                <!-- COLUMNA DERECHA (7 COLS): BUSCADOR RÁPIDO y CATÁLOGO EN VIVO -->
                <div class="lg:col-span-7 form-card space-y-4">
                  <div class="flex items-center justify-between border-b border-parchment-brown/20 pb-2.5">
                    <span
                      class="text-xs font-title font-bold uppercase tracking-wider text-parchment-cream flex items-center gap-2">
                      <i data-lucide="search" class="w-4 h-4 text-accent-cyan"></i>
                      Buscador Rápido de Avatares Animados
                    </span>
                    <button type="button" @click="$store.steamAvatars.open()"
                      class="text-xs font-hud font-bold text-[#66c0f4] hover:underline flex items-center gap-1 cursor-pointer">
                      <span>Ver Catálogo Completo</span>
                      <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>
                    </button>
                  </div>

                  <!-- Input de búsqueda -->
                  <div class="relative">
                    <div
                      class="flex items-center gap-2.5 bg-black/70 border border-white/15 focus-within:border-accent-cyan rounded-xl px-3 py-2 transition-all shadow-inner">
                      <i data-lucide="search" class="w-4 h-4 text-accent-cyan shrink-0"></i>
                      <input type="text"
                        placeholder="Buscar avatar por temática o juego (ej: Anime, Cyber, Pixel, Hades, Dota, Cats)..."
                        class="bg-transparent border-0 text-xs text-white placeholder-white/40 focus:ring-0 focus:outline-none w-full font-sans"
                        x-model="inlineAvatarQuery" />
                      <button type="button" x-show="inlineAvatarQuery" @click="inlineAvatarQuery = ''"
                        class="text-white/40 hover:text-white transition-colors cursor-pointer p-0.5">
                        <i data-lucide="x" class="w-3.5 h-3.5"></i>
                      </button>
                    </div>
                  </div>

                  <!-- Sugerencias Populares Rápidas si el buscador está vacío -->
                  <div x-show="!inlineAvatarQuery || inlineAvatarQuery.trim().length < 2" class="space-y-3">
                    <div class="flex items-center gap-1.5 flex-wrap text-xs">
                      <span class="text-[11px] font-mono text-ink-slate shrink-0">Tendencias:</span>
                      <template
                        x-for="tag in ['Anime', 'Cyber', 'Pixel', 'Hades', 'Dota', 'Dead by Daylight', 'Cats', 'Persona', 'Neon', 'Dark', 'Dragon']"
                        :key="tag">
                        <button type="button" @click="inlineAvatarQuery = tag"
                          class="px-2 py-0.5 rounded-lg bg-white/5 hover:bg-accent-cyan/20 border border-white/10 hover:border-accent-cyan/40 text-[10.5px] font-mono text-parchment-cream/80 hover:text-accent-cyan transition-all cursor-pointer"
                          x-text="tag"></button>
                      </template>
                    </div>

                    <!-- Muestrario Destacado de Avatares Populares -->
                    <div class="pt-2">
                      <p class="text-[11px] font-mono uppercase tracking-wider text-ink-slate mb-2">Avatares Animados
                        Populares</p>
                      <div class="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                        <template x-for="a in $store.steamAvatars.allAvatars.slice(0, 6)" :key="a.id">
                          <div @click="$store.steamAvatars.promptEquip(a)"
                            class="p-2 rounded-xl bg-black/50 border border-white/10 hover:border-accent-cyan/40 hover:bg-white/5 transition-all cursor-pointer flex flex-col items-center text-center group"
                            :class="$store.steamAvatars.isEquipped(a) ? 'border-accent-cyan bg-accent-cyan/10 shadow-[0_0_12px_rgba(0,240,255,0.2)]' : ''">
                            <!-- Avatar Thumbnail -->
                            <div
                              class="relative w-12 h-12 my-1 shrink-0 flex items-center justify-center rounded-xl overflow-hidden bg-white/[0.04] border border-white/10 group-hover:border-accent-cyan/50 shadow">
                              <img :src="a.url" class="w-full h-full object-contain p-0.5" :alt="a.name"
                                loading="lazy" />
                            </div>
                            <span
                              class="text-[11px] font-title font-bold text-white group-hover:text-accent-cyan truncate w-full"
                              x-text="a.name"></span>
                            <span class="text-[9px] font-sans text-ink-slate truncate w-full"
                              x-text="a.game || 'Steam'"></span>
                            <span class="mt-1 text-[9px] font-mono uppercase font-bold px-1.5 py-0.5 rounded"
                              :class="$store.steamAvatars.isEquipped(a) ? 'bg-accent-cyan text-black' : 'bg-white/5 text-parchment-cream/70 group-hover:text-white'"
                              x-text="$store.steamAvatars.isEquipped(a) ? 'En Ícono' : 'Equipar'"></span>
                          </div>
                        </template>
                      </div>
                    </div>
                  </div>

                  <!-- Resultados en Vivo cuando escribe -->
                  <div x-show="inlineAvatarQuery && inlineAvatarQuery.trim().length >= 2" class="space-y-3">
                    <div
                      class="flex items-center justify-between text-xs font-mono border-b border-white/10 pb-1.5 text-parchment-cream/70">
                      <span>Coincidencias: <strong class="text-accent-cyan"
                          x-text="inlineAvatarMatches.length"></strong></span>
                      <button type="button"
                        @click="$store.steamAvatars.query = inlineAvatarQuery; $store.steamAvatars.open()"
                        class="text-accent-gold hover:underline flex items-center gap-1 cursor-pointer text-xs">
                        <span>Ver en catálogo completo</span>
                        <i data-lucide="arrow-right" class="w-3 h-3"></i>
                      </button>
                    </div>

                    <template x-if="inlineAvatarMatches.length === 0">
                      <div class="py-8 text-center text-xs text-ink-slate font-sans space-y-1">
                        <i data-lucide="search-x" class="w-8 h-8 mx-auto text-ink-slate/60 mb-2"></i>
                        <p>No se encontraron avatares para «<span class="text-white font-mono"
                            x-text="inlineAvatarQuery"></span>»</p>
                        <p class="text-[10.5px] text-parchment-cream/50">Prueba con términos como: <strong
                            class="text-cyan-300">Anime, Pixel, Dragon, Cat, Robot, Girl, Dark</strong></p>
                      </div>
                    </template>

                    <!-- Grilla de Resultados Rápidos -->
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-96 overflow-y-auto pr-1">
                      <template x-for="a in inlineAvatarMatches" :key="a.id">
                        <div @click="$store.steamAvatars.promptEquip(a)"
                          class="flex items-center gap-3 p-2 rounded-xl border border-white/10 bg-black/40 hover:border-accent-cyan/40 hover:bg-white/5 cursor-pointer transition-all group"
                          :class="$store.steamAvatars.isEquipped(a) ? 'bg-accent-cyan/15 border-accent-cyan/50 shadow-sm' : ''">
                          <!-- Thumbnail del avatar animado -->
                          <div
                            class="relative w-11 h-11 shrink-0 flex items-center justify-center rounded-xl overflow-hidden bg-white/[0.04] border border-white/10">
                            <img :src="a.url" class="w-full h-full object-contain p-0.5" :alt="a.name" loading="lazy" />
                          </div>

                          <!-- Info del Avatar -->
                          <div class="min-w-0 flex-1">
                            <p class="text-xs font-title font-bold text-white group-hover:text-accent-cyan truncate"
                              x-text="a.name"></p>
                            <p class="text-[10px] text-parchment-cream/60 truncate"
                              x-text="a.game || 'Steam Points Shop'"></p>
                          </div>

                          <!-- Botón de acción -->
                          <button type="button"
                            class="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase transition-all shrink-0 cursor-pointer"
                            :class="$store.steamAvatars.isEquipped(a) 
                              ? 'bg-accent-cyan text-black' 
                              : 'bg-white/5 text-parchment-cream/80 border border-white/15 group-hover:border-accent-cyan/40 group-hover:text-accent-cyan'"
                            x-text="$store.steamAvatars.isEquipped(a) ? 'En Ícono' : 'Equipar'">
                          </button>
                        </div>
                      </template>
                    </div>
                  </div>

                </div>

              </div>

            </div>
            <!-- FIN SUBPESTAÑA 2: AVATARES ANIMADOS -->

            <!-- SUBPESTAÑA 3: INSIGNIAS DE STEAM (STEAM BADGES y FOIL BADGES) -->
            <div x-show="activeSubTab === 'badges'" class="space-y-6">

              <!-- Cabecera Informativa + Botón Insignia Externa -->
              <div class="p-4 rounded-2xl bg-gradient-to-r from-[#0e1622] via-[#121c29] to-[#0e1622] border border-[#66c0f4]/30 shadow-[0_0_20px_rgba(102,192,244,0.08)] flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div class="flex items-start gap-4 min-w-0">
                  <div class="w-10 h-10 rounded-xl bg-[#66c0f4]/15 border border-[#66c0f4]/40 flex items-center justify-center text-[#66c0f4] shrink-0 mt-0.5 shadow-sm">
                    <i data-lucide="info" class="w-5 h-5"></i>
                  </div>
                  <div class="space-y-1 min-w-0">
                    <div class="flex items-center gap-2 flex-wrap">
                      <h4 class="font-title text-sm font-bold uppercase text-white tracking-wide">
                        Expositor de Insignias de Steam
                      </h4>
                      <span class="px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                        3 ESPACIOS · +2,200 INSIGNIAS
                      </span>
                    </div>
                    <p class="text-xs text-parchment-cream/80 font-sans leading-relaxed">
                      Explora más de <strong class="text-white">+2,200 insignias oficiales y reflectantes (Foil)</strong> de más de 360 juegos de Steam, o busca en vivo en SteamCardExchange. Equipa hasta 3 insignias con tamaño balanceado al lado de la fecha en la tarjeta de personaje.
                    </p>
                  </div>
                </div>

                <div class="flex items-center gap-2 shrink-0 self-start md:self-center">
                  <button type="button" @click="$store.steamBadges.showCustomModal = true"
                    class="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 hover:border-amber-400/50 text-parchment-cream hover:text-white font-hud text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-sm">
                    <i data-lucide="plus" class="w-3.5 h-3.5 text-amber-400"></i>
                    <span>Insignia Externa (URL)</span>
                  </button>
                </div>
              </div>

              <!-- 1. VITRINA DE LOS 3 SLOTS DEL PERSONAJE ACTIVO -->
              <div class="form-card space-y-4">
                <div class="flex items-center justify-between border-b border-parchment-brown/20 pb-3 flex-wrap gap-2">
                  <div class="flex items-center gap-2">
                    <i data-lucide="award" class="w-4 h-4 text-amber-400"></i>
                    <span class="font-title font-bold text-xs uppercase tracking-wider text-white">
                      Slots del Personaje: <span class="text-accent-cyan" x-text="$store.characters.active?.basics?.name || 'Personaje Activo'"></span>
                    </span>
                  </div>
                  <span class="text-[11px] font-mono text-ink-slate">
                    Haz clic en un slot para elegir dónde equipar la siguiente insignia
                  </span>
                </div>

                <!-- Los 3 Slots en Grid -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <template x-for="(slotNum, slotIdx) in [0, 1, 2]" :key="slotIdx">
                    <div 
                      @click="$store.steamBadges.selectedSlot = slotIdx"
                      class="relative p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between min-h-[140px] group"
                      :style="$store.steamBadges.selectedSlot === slotIdx
                        ? \`background-color: \${$store.app.hexToRgba($store.settings.accentColor || '#00F0FF', 0.08)}; border-color: \${$store.settings.accentColor || '#00F0FF'}; box-shadow: 0 0 20px \${$store.app.hexToRgba($store.settings.accentColor || '#00F0FF', 0.25)};\`
                        : ''"
                      :class="$store.steamBadges.selectedSlot === slotIdx
                        ? 'ring-1 ring-white/20'
                        : 'bg-black/40 border-white/10 hover:border-white/25 hover:bg-white/[0.03]'">
                      
                      <!-- Header del Slot -->
                      <div class="flex items-center justify-between">
                        <div class="flex items-center gap-2">
                          <span class="w-6 h-6 rounded-lg flex items-center justify-center font-mono text-xs font-bold"
                            :style="$store.steamBadges.selectedSlot === slotIdx ? \`background-color: \${$store.settings.accentColor || '#00F0FF'}; color: #000000; font-weight: 900;\` : ''"
                            :class="$store.steamBadges.selectedSlot === slotIdx ? '' : 'bg-white/10 text-white/70'">
                            <span x-text="\`#\${slotIdx + 1}\`"></span>
                          </span>
                          <span class="text-xs font-hud font-bold tracking-wider uppercase"
                            :style="$store.steamBadges.selectedSlot === slotIdx ? \`color: \${$store.settings.accentColor || '#00F0FF'};\` : ''"
                            :class="$store.steamBadges.selectedSlot === slotIdx ? '' : 'text-parchment-cream/80'">
                            Slot <span x-text="slotIdx + 1"></span>
                          </span>
                        </div>

                        <!-- Tag Destino Activo -->
                        <span x-show="$store.steamBadges.selectedSlot === slotIdx" 
                          :style="\`background-color: \${$store.settings.accentColor || '#00F0FF'}; color: #000000; font-weight: 900;\`"
                          class="px-2 py-0.5 rounded-md text-[9px] font-mono uppercase tracking-wider shadow-sm">
                          Destino Activo
                        </span>
                      </div>

                      <!-- Contenido del Slot (Con o sin insignia) -->
                      <div class="py-2 flex items-center gap-3.5">
                        <!-- Con Insignia -->
                        <template x-if="$store.characters.getCharSteamBadges() && $store.characters.getCharSteamBadges()[slotIdx]">
                          <div class="flex items-center gap-3.5 w-full">
                            <div class="relative w-14 h-14 shrink-0 flex items-center justify-center rounded-xl bg-black/60 border border-white/10 p-1 shadow-inner">
                              <img :src="$store.characters.getCharSteamBadges()[slotIdx].url" 
                                :alt="$store.characters.getCharSteamBadges()[slotIdx].name" 
                                class="w-full h-full object-contain"
                                :class="$store.characters.getCharSteamBadges()[slotIdx].isFoil ? 'steam-foil-badge' : ''" />
                            </div>
                            <div class="min-w-0 flex-1 space-y-0.5">
                              <div class="flex items-center gap-1.5 flex-wrap">
                                <p class="text-xs font-title font-bold text-white truncate" x-text="$store.characters.getCharSteamBadges()[slotIdx].name"></p>
                                <span x-show="$store.characters.getCharSteamBadges()[slotIdx].isFoil" 
                                  class="px-1.5 py-0.2 rounded text-[7.5px] font-mono font-black uppercase bg-gradient-to-r from-amber-400 to-amber-200 text-black shrink-0">
                                  FOIL
                                </span>
                              </div>
                              <p class="text-[11px] font-sans text-parchment-cream/70 truncate" x-text="$store.characters.getCharSteamBadges()[slotIdx].game"></p>
                              <span class="text-[10px] font-mono text-cyan-300 block" x-text="$store.characters.getCharSteamBadges()[slotIdx].level"></span>
                            </div>
                          </div>
                        </template>

                        <!-- Slot Vacío -->
                        <template x-if="!($store.characters.getCharSteamBadges() && $store.characters.getCharSteamBadges()[slotIdx])">
                          <div class="flex items-center gap-3 w-full opacity-60 group-hover:opacity-100 transition-opacity">
                            <div class="w-14 h-14 shrink-0 rounded-xl border border-dashed border-white/20 flex items-center justify-center bg-white/[0.02]">
                              <i data-lucide="plus" class="w-5 h-5 text-white/40"></i>
                            </div>
                            <div class="text-left space-y-0.5">
                              <p class="text-xs font-title font-semibold text-white/70">Espacio Disponible</p>
                              <p class="text-[10px] font-sans text-ink-slate">Selecciona una insignia abajo</p>
                            </div>
                          </div>
                        </template>
                      </div>

                      <!-- Footer del Slot: Acciones -->
                      <div class="pt-2 border-t border-white/5 flex items-center justify-between text-[10px]">
                        <span class="font-mono text-white/40" x-text="$store.characters.getCharSteamBadges() && $store.characters.getCharSteamBadges()[slotIdx] ? 'Equipada' : 'Vacío'"></span>
                        <template x-if="$store.characters.getCharSteamBadges() && $store.characters.getCharSteamBadges()[slotIdx]">
                          <button type="button" 
                            @click.stop="$store.steamBadges.removeBadge(slotIdx)"
                            class="px-2 py-0.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/20 font-mono text-[10px] uppercase font-bold flex items-center gap-1 transition-all cursor-pointer">
                            <i data-lucide="trash-2" class="w-3 h-3"></i>
                            <span>Quitar</span>
                          </button>
                        </template>
                      </div>
                    </div>
                  </template>
                </div>
              </div>

              <!-- 2. EXPLORADOR y CATÁLOGO MASIVO DE INSIGNIAS (+2,200) -->
              <div class="form-card space-y-5">

                <!-- Header de la Barra de Búsqueda y Filtros -->
                <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-parchment-brown/20 pb-4">
                  <div class="space-y-1">
                    <div class="flex items-center gap-2">
                      <i data-lucide="award" class="w-5 h-5 text-amber-400"></i>
                      <h3 class="font-title font-bold text-base text-white uppercase tracking-wider">
                        Catálogo de Insignias de Steam
                      </h3>
                      <span class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40"
                        x-text="\`+\${$store.steamBadges.allBadges.length || 2296}\`">
                      </span>
                    </div>
                    <p class="text-xs text-parchment-cream/70 font-sans">
                      Explora o filtra insignias oficiales y foil por juego, temática o palabra clave.
                    </p>
                  </div>

                  <!-- Contador de Resultados y Filtro de Juego Activo -->
                  <div class="flex items-center gap-3 self-start lg:self-auto flex-wrap">
                    <template x-if="$store.steamBadges.selectedAppId">
                      <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-accent-cyan/15 border border-accent-cyan/40 text-accent-cyan text-xs font-mono">
                        <span class="truncate max-w-[160px]" x-text="$store.steamBadges.selectedGameName || \`AppID #\${$store.steamBadges.selectedAppId}\`"></span>
                        <button type="button" @click="$store.steamBadges.clearGameFilter()" class="hover:text-white transition-colors cursor-pointer ml-1 font-bold" title="Quitar filtro de juego">✕</button>
                      </div>
                    </template>
                    <span class="text-xs font-mono text-ink-slate"
                      x-text="\`Mostrando \${$store.steamBadges.paginatedBadges.length} de \${$store.steamBadges.totalCount} insignias\`">
                    </span>
                  </div>
                </div>

                <!-- Barra Principal de Búsqueda y Selector de Juego -->
                <div class="grid grid-cols-1 md:grid-cols-12 gap-3">
                  <!-- Buscador Texto / Nombre / ID (7 cols) -->
                  <div class="md:col-span-7 flex items-center gap-2">
                    <div class="relative flex-1">
                      <i data-lucide="search" class="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"></i>
                      <input type="text"
                        class="w-full bg-black/60 border border-white/15 rounded-xl pl-9 pr-9 py-2.5 text-xs font-mono text-white placeholder:text-white/30 focus:border-accent-cyan focus:outline-none transition-all shadow-inner"
                        placeholder="Buscar por insignia, juego o AppID (ej: Hades, Terraria, Portal, Foil, Isaac...)"
                        x-model="$store.steamBadges.query"
                        @input="$store.steamBadges.onSearchInput()"
                        @keydown.enter.prevent="$store.steamBadges.searchGameOnline()" />
                      <button type="button" x-show="$store.steamBadges.query" @click="$store.steamBadges.clearSearch()"
                        class="text-white/40 hover:text-white absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer p-0.5">
                        <i data-lucide="x" class="w-3.5 h-3.5"></i>
                      </button>
                    </div>
                    <!-- Botón Búsqueda Online SteamCardExchange -->
                    <button type="button" @click="$store.steamBadges.searchGameOnline()"
                      :disabled="$store.steamBadges.isSearchingOnline"
                      class="px-3.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 hover:border-accent-cyan text-white text-xs font-mono font-bold uppercase transition-all flex items-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50"
                      title="Buscar títulos no indexados directamente en SteamCardExchange">
                      <template x-if="!$store.steamBadges.isSearchingOnline">
                        <i data-lucide="globe" class="w-3.5 h-3.5 text-cyan-300"></i>
                      </template>
                      <template x-if="$store.steamBadges.isSearchingOnline">
                        <div class="w-3.5 h-3.5 border-2 border-accent-cyan border-t-transparent rounded-full animate-spin"></div>
                      </template>
                      <span class="hidden sm:inline">Online</span>
                    </button>
                  </div>

                  <!-- Selector de Juego (5 cols) -->
                  <div class="md:col-span-5 relative">
                    <select
                      :value="$store.steamBadges.selectedAppId || ''"
                      @change="$store.steamBadges.setGameFilter($event.target.value ? Number($event.target.value) : null, $event.target.selectedOptions[0]?.text)"
                      class="w-full bg-black/60 border border-white/15 rounded-xl px-3 py-2.5 text-xs font-mono text-white focus:border-accent-cyan focus:outline-none transition-all cursor-pointer truncate">
                      <option value="">🎮 Todos los Juegos (+360 juegos indexados)</option>
                      <template x-for="g in $store.steamBadges.featuredGames" :key="g.appid">
                        <option :value="g.appid" x-text="\`\${g.name} (\${g.badgesCount || 6} insig.)\`" :selected="$store.steamBadges.selectedAppId === g.appid"></option>
                      </template>
                    </select>
                  </div>
                </div>

                <!-- Barra de Filtros Rápidos (Tipo de Insignia + Juegos Populares) -->
                <div class="space-y-2.5 pt-1">
                  <div class="flex items-center justify-between gap-2 flex-wrap">
                    <!-- Filtro Tipo de Insignia -->
                    <div class="flex items-center gap-1.5 p-1 rounded-xl bg-black/60 border border-white/10">
                      <button type="button" @click="$store.steamBadges.setFilterType('all')"
                        class="px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase transition-all cursor-pointer"
                        :class="$store.steamBadges.filterType === 'all' ? 'bg-white/20 text-white shadow-sm' : 'text-ink-slate hover:text-white'">
                        Todas (<span x-text="$store.steamBadges.allBadges.length"></span>)
                      </button>
                      <button type="button" @click="$store.steamBadges.setFilterType('normal')"
                        class="px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase transition-all cursor-pointer"
                        :class="$store.steamBadges.filterType === 'normal' ? 'bg-accent-cyan text-black shadow-sm' : 'text-ink-slate hover:text-white'">
                        Normales
                      </button>
                      <button type="button" @click="$store.steamBadges.setFilterType('foil')"
                        class="px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase transition-all cursor-pointer flex items-center gap-1.5"
                        :class="$store.steamBadges.filterType === 'foil' ? 'bg-gradient-to-r from-amber-400 to-amber-200 text-black shadow-sm' : 'text-amber-300/70 hover:text-amber-300'">
                        <i data-lucide="sparkles" class="w-3.5 h-3.5"></i>
                        <span>Foil Reflectantes</span>
                      </button>
                    </div>

                    <!-- Botón Restablecer todo si hay filtros -->
                    <template x-if="$store.steamBadges.query || $store.steamBadges.selectedAppId || $store.steamBadges.filterType !== 'all'">
                      <button type="button"
                        @click="$store.steamBadges.query = ''; $store.steamBadges.selectedAppId = null; $store.steamBadges.selectedGameName = ''; $store.steamBadges.filterType = 'all'; $store.steamBadges.page = 1;"
                        class="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-mono text-red-400 hover:text-red-300 border border-white/10 transition-all cursor-pointer flex items-center gap-1">
                        <i data-lucide="rotate-ccw" class="w-3 h-3"></i>
                        <span>Restablecer Filtros</span>
                      </button>
                    </template>
                  </div>

                  <!-- Chips de Juegos Tendencia / Populares -->
                  <div class="flex items-center gap-1.5 flex-wrap text-xs pt-1">
                    <span class="text-[11px] font-mono text-ink-slate shrink-0 flex items-center gap-1 mr-1">
                      <i data-lucide="flame" class="w-3 h-3 text-amber-400"></i>
                      <span>Destacados:</span>
                    </span>
                    <button type="button"
                      @click="$store.steamBadges.clearGameFilter()"
                      class="px-2 py-0.5 rounded-lg border text-[10.5px] font-mono transition-all cursor-pointer"
                      :class="!$store.steamBadges.selectedAppId ? 'bg-accent-cyan/20 border-accent-cyan text-accent-cyan font-bold' : 'bg-white/5 hover:bg-white/10 border-white/10 text-parchment-cream/70 hover:text-white'">
                      Todos
                    </button>
                    <template x-for="g in $store.steamBadges.featuredGames.slice(0, 18)" :key="g.appid">
                      <button type="button"
                        @click="$store.steamBadges.setGameFilter(g.appid, g.name)"
                        class="px-2 py-0.5 rounded-lg border text-[10.5px] font-mono transition-all cursor-pointer flex items-center gap-1"
                        :class="$store.steamBadges.selectedAppId === g.appid ? 'bg-accent-cyan/25 border-accent-cyan text-accent-cyan font-bold shadow-sm' : 'bg-white/5 hover:bg-white/10 border-white/10 text-parchment-cream/80 hover:text-white'">
                        <span x-text="g.name"></span>
                        <span class="text-[9px] opacity-60" x-text="\`(\${g.badgesCount || 6})\`"></span>
                      </button>
                    </template>
                  </div>
                </div>

                <!-- Panel de Resultados de Búsqueda Online (SteamCardExchange) -->
                <template x-if="$store.steamBadges.onlineSearchResults && $store.steamBadges.onlineSearchResults.length > 0">
                  <div class="p-4 rounded-2xl bg-black/60 border border-cyan-500/30 space-y-3 shadow-lg">
                    <div class="flex items-center justify-between border-b border-white/10 pb-2">
                      <div class="flex items-center gap-2">
                        <i data-lucide="globe" class="w-4 h-4 text-cyan-400"></i>
                        <h4 class="font-title font-bold text-xs uppercase tracking-wider text-white">
                          Juegos encontrados en SteamCardExchange
                        </h4>
                      </div>
                      <button type="button" @click="$store.steamBadges.onlineSearchResults = []"
                        class="text-xs font-mono text-white/50 hover:text-white">Cerrar</button>
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
                      <template x-for="og in $store.steamBadges.onlineSearchResults" :key="og.appid">
                        <div class="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between gap-2 hover:border-cyan-400/50 transition-all">
                          <div class="min-w-0">
                            <p class="text-xs font-title font-bold text-white truncate" x-text="og.name"></p>
                            <p class="text-[10px] font-mono text-cyan-300" x-text="\`AppID: \${og.appid}\`"></p>
                          </div>
                          <button type="button" @click="$store.steamBadges.loadOnlineGameBadges(og)"
                            class="px-2.5 py-1 rounded-lg bg-accent-cyan text-black font-mono text-[10px] font-bold uppercase shrink-0 hover:bg-accent-cyan/80 transition-colors cursor-pointer">
                            Importar
                          </button>
                        </div>
                      </template>
                    </div>
                  </div>
                </template>

                <!-- Estado de Carga -->
                <div x-show="$store.steamBadges.isLoading" class="py-12 flex flex-col items-center justify-center gap-3 text-ink-slate">
                  <div class="w-8 h-8 rounded-full border-2 border-accent-cyan border-t-transparent animate-spin"></div>
                  <span class="text-xs font-mono">Cargando catálogo de insignias...</span>
                </div>

                <!-- Grilla de Insignias Paginadas (Masivo +2,200) -->
                <div x-show="!$store.steamBadges.isLoading && $store.steamBadges.paginatedBadges.length > 0"
                  class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5 pt-1">
                  <template x-for="b in $store.steamBadges.paginatedBadges" :key="b.id">
                    <div class="relative p-3 pb-3.5 rounded-2xl bg-black/50 border transition-all flex flex-col items-center justify-between text-center group h-[236px] overflow-hidden"
                      :style="$store.steamBadges.isBadgeEquipped(b) 
                        ? \`border-color: \${$store.settings.accentColor || '#00F0FF'}; background-color: \${$store.app.hexToRgba($store.settings.accentColor || '#00F0FF', 0.08)}; box-shadow: 0 0 15px \${$store.app.hexToRgba($store.settings.accentColor || '#00F0FF', 0.2)};\` 
                        : ''"
                      :class="$store.steamBadges.isBadgeEquipped(b)
                        ? ''
                        : (b.isFoil ? 'border-amber-500/30 hover:border-amber-400 hover:bg-amber-400/[0.04]' : 'border-white/10 hover:border-white/30 hover:bg-white/[0.03]')">
                      
                      <!-- Header de la tarjeta: Nivel y Foil Tag -->
                      <div class="w-full flex items-center justify-between mb-1 shrink-0">
                        <span class="text-[9.5px] font-mono text-ink-slate" x-text="b.level"></span>
                        <span x-show="b.isFoil" 
                          class="px-1.5 py-0.2 rounded text-[7.5px] font-mono font-black uppercase bg-gradient-to-r from-amber-400 to-amber-200 text-black shadow-sm">
                          FOIL
                        </span>
                      </div>

                      <!-- Preview de la Insignia (Contenida) -->
                      <div class="relative w-16 h-16 my-1.5 flex items-center justify-center shrink-0">
                        <img :src="b.url" :alt="b.name" 
                          class="w-full h-full object-contain filter drop-shadow-md transition-transform duration-200 group-hover:scale-105"
                          :class="b.isFoil ? 'steam-foil-badge' : ''"
                          loading="lazy" />
                      </div>

                      <!-- Metadatos de la Insignia -->
                      <div class="w-full min-w-0 space-y-0.5 mb-1 shrink-0">
                        <p class="text-xs font-title font-bold text-white group-hover:text-accent-cyan truncate" :title="b.name" x-text="b.name"></p>
                        <p class="text-[10px] font-sans text-parchment-cream/60 truncate" :title="b.game" x-text="b.game"></p>
                      </div>

                      <!-- Botón de Equipar / Estado (elevado, centrado y con glow configurado) -->
                      <div class="w-full mt-1.5 space-y-1 shrink-0">
                        <template x-if="$store.steamBadges.isBadgeEquipped(b)">
                          <div class="w-full py-1.5 px-2 rounded-xl font-mono text-[10px] font-bold uppercase flex items-center justify-center gap-1 border"
                            :style="\`background-color: \${$store.app.hexToRgba($store.settings.accentColor || '#00F0FF', 0.15)}; border-color: \${$store.app.hexToRgba($store.settings.accentColor || '#00F0FF', 0.4)}; color: \${$store.settings.accentColor || '#00F0FF'};\`">
                            <i data-lucide="check" class="w-3 h-3"></i>
                            <span>Equipada (Slot #<span x-text="$store.steamBadges.getEquippedSlot(b) + 1"></span>)</span>
                          </div>
                        </template>

                        <template x-if="!$store.steamBadges.isBadgeEquipped(b)">
                          <div class="w-full">
                            <!-- Botón Principal -->
                            <button type="button"
                              @click="$store.steamBadges.equipBadge(b, $store.steamBadges.selectedSlot)"
                              @mouseenter="if (!b.isFoil) { $el.style.backgroundColor = $store.settings.accentColor || '#00F0FF'; $el.style.borderColor = $store.settings.accentColor || '#00F0FF'; $el.style.color = '#000000'; }"
                              @mouseleave="if (!b.isFoil) { $el.style.backgroundColor = ''; $el.style.borderColor = ''; $el.style.color = ''; }"
                              class="w-full py-1.5 px-2 rounded-xl font-hud text-[10.5px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm border border-white/15"
                              :class="b.isFoil 
                                ? 'bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 text-black shadow-[0_0_12px_rgba(245,158,11,0.25)] border-amber-400/40' 
                                : 'bg-white/10 text-white'">
                              <i data-lucide="plus" class="w-3 h-3"></i>
                              <span>Equipar en #<span x-text="$store.steamBadges.selectedSlot + 1"></span></span>
                            </button>

                            <!-- Selector de Slots suave sin recorte con glow del tema del usuario -->
                            <div class="overflow-hidden transition-all duration-250 ease-out max-h-0 opacity-0 group-hover:max-h-10 group-hover:opacity-100 flex items-center justify-center gap-1.5 py-0 group-hover:py-1.5">
                              <span class="text-[9px] font-mono text-white/40 mr-0.5">Slot:</span>
                              <!-- Botón Slot 1 -->
                              <button type="button" @click.stop="$store.steamBadges.equipBadge(b, 0)"
                                class="w-6 h-5.5 rounded-md text-[10px] font-mono transition-all cursor-pointer flex items-center justify-center border border-transparent"
                                :style="$store.steamBadges.selectedSlot === 0 
                                  ? \`background-color: \${$store.settings.accentColor || '#00F0FF'}; color: #000000; font-weight: 900; box-shadow: 0 0 10px \${$store.app.hexToRgba($store.settings.accentColor || '#00F0FF', 0.55)}; border-color: \${$store.settings.accentColor || '#00F0FF'};\` 
                                  : ''"
                                :class="$store.steamBadges.selectedSlot === 0 ? '' : 'bg-white/10 hover:bg-white/25 text-white/80 font-bold border-white/10'"
                                title="Equipar en Slot 1">1</button>

                              <!-- Botón Slot 2 -->
                              <button type="button" @click.stop="$store.steamBadges.equipBadge(b, 1)"
                                class="w-6 h-5.5 rounded-md text-[10px] font-mono transition-all cursor-pointer flex items-center justify-center border border-transparent"
                                :style="$store.steamBadges.selectedSlot === 1 
                                  ? \`background-color: \${$store.settings.accentColor || '#00F0FF'}; color: #000000; font-weight: 900; box-shadow: 0 0 10px \${$store.app.hexToRgba($store.settings.accentColor || '#00F0FF', 0.55)}; border-color: \${$store.settings.accentColor || '#00F0FF'};\` 
                                  : ''"
                                :class="$store.steamBadges.selectedSlot === 1 ? '' : 'bg-white/10 hover:bg-white/25 text-white/80 font-bold border-white/10'"
                                title="Equipar en Slot 2">2</button>

                              <!-- Botón Slot 3 -->
                              <button type="button" @click.stop="$store.steamBadges.equipBadge(b, 2)"
                                class="w-6 h-5.5 rounded-md text-[10px] font-mono transition-all cursor-pointer flex items-center justify-center border border-transparent"
                                :style="$store.steamBadges.selectedSlot === 2 
                                  ? \`background-color: \${$store.settings.accentColor || '#00F0FF'}; color: #000000; font-weight: 900; box-shadow: 0 0 10px \${$store.app.hexToRgba($store.settings.accentColor || '#00F0FF', 0.55)}; border-color: \${$store.settings.accentColor || '#00F0FF'};\` 
                                  : ''"
                                :class="$store.steamBadges.selectedSlot === 2 ? '' : 'bg-white/10 hover:bg-white/25 text-white/80 font-bold border-white/10'"
                                title="Equipar en Slot 3">3</button>
                            </div>
                          </div>
                        </template>
                      </div>

                    </div>
                  </template>
                </div>

                <!-- Botón de Paginación: Cargar Más -->
                <div x-show="!$store.steamBadges.isLoading && $store.steamBadges.hasMore" class="pt-4 flex justify-center">
                  <button type="button" @click="$store.steamBadges.loadMore()"
                    class="px-6 py-3 rounded-xl bg-white/10 hover:bg-accent-cyan hover:text-black text-white border border-white/20 hover:border-accent-cyan font-hud text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-lg">
                    <i data-lucide="chevron-down" class="w-4 h-4"></i>
                    <span>Cargar más insignias (<span x-text="\`Mostrando \${$store.steamBadges.paginatedBadges.length} de \${$store.steamBadges.totalCount}\`"></span>)</span>
                  </button>
                </div>

                <!-- Empty state si no hay resultados -->
                <div x-show="!$store.steamBadges.isLoading && $store.steamBadges.paginatedBadges.length === 0" 
                  class="py-12 text-center space-y-3">
                  <div class="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-white/40">
                    <i data-lucide="search-x" class="w-6 h-6"></i>
                  </div>
                  <p class="text-sm font-title text-white/80">No se encontraron insignias con esos filtros.</p>
                  <p class="text-xs font-sans text-ink-slate max-w-sm mx-auto">
                    Prueba buscando por otro término o haz clic en «Buscar Online» para consultar SteamCardExchange directamente.
                  </p>
                  <div class="flex items-center justify-center gap-2 pt-1">
                    <button type="button"
                      @click="$store.steamBadges.query = ''; $store.steamBadges.selectedAppId = null; $store.steamBadges.selectedGameName = ''; $store.steamBadges.filterType = 'all'; $store.steamBadges.page = 1;"
                      class="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-mono text-white transition-all cursor-pointer">
                      Restablecer filtros
                    </button>
                    <button type="button" @click="$store.steamBadges.searchGameOnline()"
                      class="px-4 py-2 rounded-xl bg-accent-cyan text-black font-mono text-xs font-bold uppercase transition-all cursor-pointer">
                      Buscar en SteamCardExchange
                    </button>
                  </div>
                </div>

              </div>

              <!-- MODAL / DIÁLOGO DE INSIGNIA PERSONALIZADA EXTERNA -->
              <div x-show="$store.steamBadges.showCustomModal" x-cloak
                class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                <div @click.outside="$store.steamBadges.showCustomModal = false"
                  class="w-full max-w-md form-card space-y-4 bg-[#0d131a] border border-amber-500/30 shadow-[0_0_30px_rgba(245,158,11,0.2)]">
                  
                  <div class="flex items-center justify-between border-b border-white/10 pb-3">
                    <div class="flex items-center gap-2">
                      <i data-lucide="plus" class="w-4 h-4 text-amber-400"></i>
                      <h4 class="font-title font-bold text-sm text-white uppercase tracking-wider">Añadir Insignia por Enlace Directo</h4>
                    </div>
                    <button type="button" @click="$store.steamBadges.showCustomModal = false"
                      class="p-1 rounded-lg text-white/40 hover:text-white transition-colors">
                      <i data-lucide="x" class="w-4 h-4"></i>
                    </button>
                  </div>

                  <div class="space-y-3 text-xs">
                    <div class="space-y-1">
                      <label class="font-mono text-ink-slate">URL Directa de la Imagen (PNG/WEBP/GIF):</label>
                      <input type="text" x-model="$store.steamBadges.customUrl"
                        placeholder="https://community.cloudflare.steamstatic.com/economy/image/..."
                        class="w-full bg-black/60 border border-white/15 rounded-xl px-3 py-2 font-mono text-white placeholder:text-white/30 focus:border-amber-400 focus:outline-none" />
                    </div>

                    <div class="grid grid-cols-2 gap-3">
                      <div class="space-y-1">
                        <label class="font-mono text-ink-slate">Nombre de la Insignia:</label>
                        <input type="text" x-model="$store.steamBadges.customName"
                          placeholder=""
                          class="w-full bg-black/60 border border-white/15 rounded-xl px-3 py-2 font-sans text-white placeholder:text-white/30 focus:border-amber-400 focus:outline-none" />
                      </div>
                      <div class="space-y-1">
                        <label class="font-mono text-ink-slate">Juego:</label>
                        <input type="text" x-model="$store.steamBadges.customGame"
                          placeholder=""
                          class="w-full bg-black/60 border border-white/15 rounded-xl px-3 py-2 font-sans text-white placeholder:text-white/30 focus:border-amber-400 focus:outline-none" />
                      </div>
                    </div>

                    <!-- Toggle Foil -->
                    <label class="flex items-center gap-2.5 p-2 rounded-xl bg-white/[0.03] border border-white/10 cursor-pointer">
                      <input type="checkbox" x-model="$store.steamBadges.customIsFoil" class="rounded accent-amber-400 w-4 h-4" />
                      <div class="space-y-0.5">
                        <span class="font-title font-bold text-amber-300">Activar Efecto Foil Reflectante</span>
                        <p class="text-[10px] text-parchment-cream/60">Añade el brillo holográfico animado y la etiqueta dorada.</p>
                      </div>
                    </label>

                    <!-- Previsualización -->
                    <div x-show="$store.steamBadges.customUrl" class="p-3 rounded-xl bg-black/50 border border-white/10 flex items-center gap-3">
                      <img :src="$store.steamBadges.customUrl" class="w-12 h-12 object-contain" :class="$store.steamBadges.customIsFoil ? 'steam-foil-badge' : ''" />
                      <div class="min-w-0">
                        <p class="font-title font-bold text-white text-xs truncate" x-text="$store.steamBadges.customName || 'Insignia Personalizada'"></p>
                        <p class="text-[10px] text-ink-slate truncate" x-text="$store.steamBadges.customGame || 'Juego Externa'"></p>
                        <span x-show="$store.steamBadges.customIsFoil" class="text-[9px] font-mono text-amber-300">★ Foil Habilitado</span>
                      </div>
                    </div>
                  </div>

                  <div class="pt-2 flex items-center justify-end gap-2 border-t border-white/10">
                    <button type="button" @click="$store.steamBadges.showCustomModal = false"
                      class="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white font-mono text-xs uppercase cursor-pointer">
                      Cancelar
                    </button>
                    <button type="button" @click="$store.steamBadges.equipCustomBadge()"
                      class="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-300 text-black font-title font-bold text-xs uppercase tracking-wider hover:brightness-110 transition-all cursor-pointer">
                      Guardar y Equipar
                    </button>
                  </div>

                </div>
              </div>

            </div>
            <!-- FIN SUBPESTAÑA 3: INSIGNIAS DE STEAM -->

            <!-- ═════════════════════════════════════════════════════════
                 SUBPESTAÑA 4: EMOTICONOS DE STEAM y PACKS POPULARES
                 ═════════════════════════════════════════════════════════ -->
            <div x-show="activeSubTab === 'emojis'" class="space-y-6">

              <!-- BANNER HUB DE EMOTICONOS STEAM -->
              <div class="form-card relative overflow-hidden bg-gradient-to-r from-[#0b121c] via-[#101b2a] to-[#15273d] border border-[#66c0f4]/40 shadow-[0_0_30px_rgba(102,192,244,0.15)]">
                <div class="absolute -right-10 -top-10 w-64 h-64 bg-[#66c0f4]/10 rounded-full blur-3xl pointer-events-none"></div>

                <div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div class="flex items-center gap-3.5 min-w-0">
                    <div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#171a21] to-[#1a293b] border-2 border-[#66c0f4]/50 flex items-center justify-center text-[#66c0f4] shadow-[0_0_20px_rgba(102,192,244,0.3)] shrink-0">
                      <i data-lucide="smile" class="w-6 h-6"></i>
                    </div>
                    <div>
                      <div class="flex items-center gap-2 flex-wrap">
                        <h3 class="font-title text-xl font-bold tracking-wide uppercase text-white drop-shadow-md">
                          EMOTICONOS y PACKS // STEAM POINTS SHOP
                        </h3>
                        <span class="px-2 py-0.5 rounded-full text-[10px] font-mono uppercase bg-[#66c0f4]/20 border border-[#66c0f4]/40 text-[#66c0f4] tracking-wider font-bold">
                          OFICIAL VALVE y COMUNIDAD
                        </span>
                      </div>
                      <p class="text-xs text-parchment-cream/70 font-sans mt-0.5 max-w-2xl">
                        Añade paquetes de emoticonos de tus videojuegos favoritos a tu colección personal. Se integran automáticamente con el sistema de emojis y el autocompletado en vivo <code class="text-[#66c0f4] font-mono font-bold">:código:</code>.
                      </p>
                    </div>
                  </div>

                  <div class="flex items-center gap-2.5 shrink-0 flex-wrap">
                    <button type="button" @click="$store.steamEmojis.open('packs')"
                      class="px-4 py-2 rounded-xl bg-[#66c0f4] text-black font-hud text-xs font-bold uppercase tracking-wider hover:brightness-110 transition-all flex items-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(102,192,244,0.3)]">
                      <i data-lucide="package" class="w-4 h-4"></i>
                      <span>Explorar Packs</span>
                    </button>

                    <button type="button" @click="$store.steamEmojis.open('search')"
                      class="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-parchment-cream hover:text-white font-hud text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer">
                      <i data-lucide="search" class="w-4 h-4 text-[#66c0f4]"></i>
                      <span>Buscador por Juego</span>
                    </button>
                  </div>
                </div>

                <!-- Telemetría y Acceso Rápido -->
                <div class="relative z-10 mt-4 pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div class="flex items-center gap-4 flex-wrap font-mono text-[11px] text-parchment-cream/80">
                    <span class="flex items-center gap-1.5">
                      <i data-lucide="check-circle" class="w-3.5 h-3.5 text-emerald-400"></i>
                      <span>Emojis de Steam añadidos:</span>
                      <strong class="text-white font-mono" x-text="$store.steamEmojis.installedSteamEmojis.length"></strong>
                    </span>
                    <span class="text-white/20">•</span>
                    <span class="flex items-center gap-1.5">
                      <i data-lucide="cpu" class="w-3.5 h-3.5 text-[#66c0f4]"></i>
                      <span>Capacidad total:</span>
                      <strong class="text-white font-mono" x-text="$store.customEmojis.totalCount + ' / ' + $store.customEmojis.maxCapacity"></strong>
                    </span>
                  </div>

                  <button type="button" @click="$store.app.activeView = 'settings'; $store.settings.activeSubTab = 'emojis'"
                    class="text-xs font-mono text-accent-gold hover:underline flex items-center gap-1 cursor-pointer">
                    <span>Gestionar librería en Ajustes</span>
                    <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>
                  </button>
                </div>
              </div>

              <!-- SECCIÓN DE PAQUETES POPULARES DESTACADOS -->
              <div class="space-y-4">
                <div class="flex items-center justify-between border-b border-white/10 pb-2.5 flex-wrap gap-2">
                  <div class="flex items-center gap-2">
                    <i data-lucide="package" class="w-4 h-4 text-[#66c0f4]"></i>
                    <h4 class="font-title text-sm font-bold uppercase tracking-wider text-white">
                      Paquetes Iniciales Recomendados (Juegos Populares)
                    </h4>
                  </div>
                  <span class="text-xs font-mono text-ink-slate">Haz clic en "+ Añadir Pack" para importar a tu librería con 1 clic</span>
                </div>

                <!-- Grid de Packs -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <template x-for="pack in $store.steamEmojis.allPacks" :key="pack.id">
                    <div class="p-4 rounded-2xl bg-[#0f141e] border border-white/10 hover:border-[#66c0f4]/40 transition-all flex flex-col justify-between gap-3 group relative shadow-sm hover:shadow-md">
                      
                      <!-- Cabecera del Pack -->
                      <div class="flex items-start justify-between gap-3">
                        <div class="flex items-center gap-3 min-w-0">
                          <div class="w-11 h-11 rounded-xl bg-black/50 border border-white/15 p-2 flex items-center justify-center shrink-0 shadow-inner group-hover:scale-105 transition-transform">
                            <img :src="pack.icon" :alt="pack.name" class="w-full h-full object-contain filter drop-shadow" @error="$event.target.style.display='none'" />
                          </div>
                          <div class="min-w-0">
                            <h5 class="font-title text-xs font-bold text-white uppercase tracking-wider truncate group-hover:text-[#66c0f4] transition-colors" x-text="pack.name"></h5>
                            <span class="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded bg-[#66c0f4]/15 text-[#66c0f4] border border-[#66c0f4]/30 font-bold inline-block mt-0.5"
                              x-text="pack.badge"></span>
                          </div>
                        </div>

                        <!-- Indicador de cantidad añadida -->
                        <span class="text-[9.5px] font-mono shrink-0 px-2 py-0.5 rounded-full"
                          :class="$store.steamEmojis.isPackFullyAdded(pack)
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold'
                            : 'bg-white/5 text-ink-slate border border-white/10'">
                          <span x-text="$store.steamEmojis.getPackAddedCount(pack) + ' / ' + pack.emojis.length"></span>
                        </span>
                      </div>

                      <p class="text-[11px] text-parchment-cream/70 font-sans line-clamp-2" x-text="pack.description"></p>

                      <!-- Miniaturas de Emoticonos del Pack -->
                      <div class="p-2 rounded-xl bg-black/40 border border-white/5 flex items-center gap-1.5 overflow-x-auto custom-scrollbar">
                        <template x-for="emoji in pack.emojis.slice(0, 7)" :key="emoji.shortcode">
                          <div class="w-7 h-7 rounded bg-white/5 p-1 shrink-0 flex items-center justify-center relative"
                            :title="':' + emoji.shortcode + ': - ' + emoji.name">
                            <img :src="emoji.url" :alt="emoji.shortcode" class="w-full h-full object-contain filter drop-shadow-sm" loading="lazy" @error="$event.target.style.display='none'" />
                            <template x-if="$store.steamEmojis.isEmojiAdded(emoji.shortcode)">
                              <div class="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-black"></div>
                            </template>
                          </div>
                        </template>
                        <template x-if="pack.emojis.length > 7">
                          <span class="text-[10px] font-mono text-parchment-cream/40 shrink-0 px-1 font-bold"
                            x-text="'+' + (pack.emojis.length - 7)"></span>
                        </template>
                      </div>

                      <!-- Acciones del Pack -->
                      <div class="flex items-center justify-between gap-2 pt-1 border-t border-white/5">
                        <button type="button" @click="$store.steamEmojis.open('packs', pack)"
                          class="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white font-mono text-[11px] uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer">
                          <i data-lucide="eye" class="w-3 h-3"></i>
                          <span>Ver</span>
                        </button>

                        <button type="button" @click="$store.steamEmojis.installPack(pack)"
                          class="px-3 py-1.5 rounded-lg font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer"
                          :class="$store.steamEmojis.isPackFullyAdded(pack)
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-[#66c0f4] text-black hover:brightness-110 shadow-sm'">
                          <i data-lucide="check" class="w-3.5 h-3.5" x-show="$store.steamEmojis.isPackFullyAdded(pack)"></i>
                          <i data-lucide="download" class="w-3.5 h-3.5" x-show="!$store.steamEmojis.isPackFullyAdded(pack)"></i>
                          <span x-text="$store.steamEmojis.isPackFullyAdded(pack) ? 'Instalado' : '+ Añadir Pack'"></span>
                        </button>
                      </div>

                    </div>
                  </template>
                </div>
              </div>

            </div>
            <!-- FIN SUBPESTAÑA 4: EMOTICONOS DE STEAM -->

          </div>
`;
}
