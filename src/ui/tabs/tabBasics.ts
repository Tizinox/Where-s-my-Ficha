/**
 * @file src/ui/tabs/tabBasics.ts
 */

export function renderTabBasics(): string {
  return `<!-- =========================================================
           PESTAÑA 1: DATOS BÁSICOS
           ========================================================= -->
          <div x-show="$store.app.currentTab === 'basics'" class="space-y-6" data-tab-section="basics">
            <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <!-- Columna ID Visual Multi-Activo y Card Compositor (4 cols) -->
              <div class="lg:col-span-4 form-card space-y-4" data-export-component="identity-card" x-data="sheetVisualMedia('classic')">
                <!-- Título del Panel -->
                <div class="flex items-center justify-between border-b border-parchment-brown/20 pb-2.5">
                  <div class="flex items-center gap-2.5">
                    <div
                      class="category-header-icon-box !w-8 !h-8 rounded-lg bg-accent-cyan/15 border border-accent-cyan/40 flex items-center justify-center text-accent-cyan shrink-0"
                      style="box-shadow: 0 0 10px var(--accent-glow);">
                      <i data-lucide="scan-face" class="w-4 h-4"></i>
                    </div>
                    <h3 class="category-header-title">ID Visual</h3>
                  </div>
                  <span class="text-[10px] font-mono text-ink-slate uppercase tracking-wider">3 Recursos</span>
                </div>

                <!-- 1. BARRA DE PESTAÑAS Y ESTADO DE ASIGNACIÓN -->
                <div class="visual-asset-tabs">
                  <!-- Tab AVATAR -->
                  <button type="button" class="visual-asset-tab-btn" :class="{ 'is-active': visualTab === 'avatar' }"
                    @click="visualTab = 'avatar'; showUrlInput = false;" title="Avatar / Retrato del Personaje">
                    <span class="visual-asset-dot"
                      :class="$store.characters.active?.basics?.avatarDataUrl ? 'has-image' : 'is-empty'"></span>
                    <i data-lucide="user" class="w-3.5 h-3.5"></i>
                    <span>AVATAR</span>
                  </button>

                  <!-- Tab BÁNER -->
                  <button type="button" class="visual-asset-tab-btn" :class="{ 'is-active': visualTab === 'banner' }"
                    @click="visualTab = 'banner'; showUrlInput = false;" title="Báner Panorámico de Fondo">
                    <span class="visual-asset-dot"
                      :class="$store.characters.active?.basics?.bannerDataUrl ? 'has-image' : 'is-empty'"></span>
                    <i data-lucide="image" class="w-3.5 h-3.5"></i>
                    <span>BÁNER</span>
                  </button>

                  <!-- Tab ÍCONO -->
                  <button type="button" class="visual-asset-tab-btn" :class="{ 'is-active': visualTab === 'icon' }"
                    @click="visualTab = 'icon'; showUrlInput = false;" title="Ícono Cuadrado para Tarjeta y Badges">
                    <span class="visual-asset-dot"
                      :class="$store.characters.active?.basics?.iconDataUrl ? 'has-image' : 'is-empty'"></span>
                    <i data-lucide="square" class="w-3.5 h-3.5"></i>
                    <span>ÍCONO</span>
                  </button>
                </div>

                <!-- 2. MARCO DE VISTA PREVIA CON ASPECT RATIO DINÁMICO y DRAG AND DROP -->
                <div class="visual-preview-stage" :class="{ 'is-dragover': isDragging }"
                  @dragover.prevent="isDragging = true" @dragleave.prevent="isDragging = false"
                  @drop.prevent="handleDrop($event)">

                  <!-- Marco Adaptativo de la Imagen Activa -->
                  <div class="visual-preview-box group relative" :class="activeData.modeClass">

                    <!-- SI TIENE IMAGEN CARGADA -->
                    <template x-if="activeData.dataUrl">
                      <div class="w-full h-full relative overflow-hidden bg-black/40">
                        <img :src="$store.app.getOptimizedImageUrl(activeData.dataUrl)" :alt="activeData.title"
                          class="w-full h-full object-cover block transition-transform duration-300 group-hover:scale-105"
                          fetchpriority="high" decoding="async"
                          :style="activeData.transform || 'width:100%;height:100%;object-fit:cover;display:block;'" />

                        <!-- Overlay de Guías (sutil) -->
                        <div class="absolute inset-0 pointer-events-none border border-white/10 rounded-[inherit]">
                        </div>
                      </div>
                    </template>

                    <!-- SI ESTÁ VACÍO (Placeholder Dinámico con Retículo Biométrico) -->
                    <template x-if="!activeData.dataUrl">
                      <div
                        class="w-full h-full flex flex-col items-center justify-center p-4 text-center bg-black/50 select-none">
                        <!-- Retículo SVG según formato -->
                        <svg width="44" height="44" viewBox="0 0 64 64" fill="none" class="text-white/40 mb-1.5">
                          <circle cx="32" cy="32" r="22" stroke="currentColor" stroke-width="1" stroke-dasharray="4 3"
                            opacity="0.5" />
                          <circle cx="32" cy="32" r="10" stroke="currentColor" stroke-width="1.5" opacity="0.8" />
                          <circle cx="32" cy="32" r="2" fill="currentColor" />
                          <line x1="32" y1="8" x2="32" y2="18" stroke="currentColor" stroke-width="1.5" />
                          <line x1="32" y1="46" x2="32" y2="56" stroke="currentColor" stroke-width="1.5" />
                          <line x1="8" y1="32" x2="18" y2="32" stroke="currentColor" stroke-width="1.5" />
                          <line x1="46" y1="32" x2="56" y2="32" stroke="currentColor" stroke-width="1.5" />
                        </svg>
                        <span class="font-hud text-[10px] uppercase font-bold text-white/60 tracking-wider"
                          x-text="'SIN ' + visualTab.toUpperCase()"></span>
                        <span class="text-[9px] text-ink-slate font-mono mt-0.5" x-text="activeData.aspectLabel"></span>
                      </div>
                    </template>

                    <!-- Línea de escaneo animada si está vacío -->
                    <div class="avatar-scan-line" x-show="!activeData.dataUrl"></div>

                    <!-- Esquinas HUD -->
                    <div class="avatar-corner tl"></div>
                    <div class="avatar-corner tr"></div>
                    <div class="avatar-corner bl"></div>
                    <div class="avatar-corner br"></div>

                    <!-- Badge de Formato Activo (solo en modo edición, con data-export-hide) -->
                    <div class="absolute bottom-2 right-2 z-10 pointer-events-none" data-export-hide
                      x-show="$store.app.editMode">
                      <span
                        class="text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-black/85 text-parchment-cream border border-white/20 shadow"
                        x-text="activeData.aspectLabel"></span>
                    </div>
                  </div>
                </div>

                <!-- 3. HERRAMIENTAS DE EDICIÓN Y OPCIONES DE CARGA -->
                <div x-show="$store.app.editMode" class="space-y-3">

                  <!-- Barra de Micro-Herramientas (solo visible si el recurso actual tiene imagen) -->
                  <div x-show="activeData.dataUrl" class="flex items-center justify-center gap-1.5 flex-wrap">
                    <!-- Re-recortar -->
                    <button type="button" class="visual-tool-btn" @click="$store.characters.reCropAsset(visualTab)"
                      title="Ajustar recorte y encuadre">
                      <i data-lucide="crop" class="w-3.5 h-3.5"></i>
                      <span>Recortar</span>
                    </button>

                    <!-- Rotar 90° -->
                    <button type="button" class="visual-tool-btn" @click="$store.characters.rotateAsset(visualTab)"
                      title="Rotar 90 grados en sentido horario">
                      <i data-lucide="rotate-cw" class="w-3.5 h-3.5"></i>
                      <span>Rotar</span>
                    </button>

                    <!-- Efecto Espejo -->
                    <button type="button" class="visual-tool-btn" @click="$store.characters.flipAsset(visualTab)"
                      title="Voltear horizontalmente (Efecto Espejo)">
                      <i data-lucide="flip-horizontal" class="w-3.5 h-3.5"></i>
                      <span>Espejo</span>
                    </button>

                    <!-- Eliminar Recurso -->
                    <button type="button" class="visual-tool-btn danger"
                      @click="$store.characters.removeAsset(visualTab)" title="Eliminar este recurso gráfico">
                      <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                      <span>Quitar</span>
                    </button>
                  </div>

                  <!-- Botones Principales de Carga: Archivo Local + URL Externa -->
                  <div class="grid grid-cols-2 gap-2.5 items-center w-full my-1">
                    <!-- Botón Subir Archivo Local -->
                    <label class="chamfer-btn-primary w-full cursor-pointer select-none">
                      <i data-lucide="upload" class="w-3.5 h-3.5 shrink-0"></i>
                      <span class="truncate"
                        x-text="activeData.dataUrl ? 'CAMBIAR ' + visualTab.toUpperCase() : 'SUBIR ' + visualTab.toUpperCase()"></span>
                      <input type="file" accept="image/*" class="hidden" @change="
                          if (visualTab === 'avatar') $store.characters.uploadAvatar($event);
                          else if (visualTab === 'banner') $store.characters.uploadBanner($event, $store.characters.active?.id);
                          else if (visualTab === 'icon') $store.characters.uploadIcon($event, $store.characters.active?.id);
                        " />
                    </label>

                    <!-- Botón Alternar Carga por URL -->
                    <button type="button" class="chamfer-btn-outline w-full cursor-pointer select-none"
                      :class="{ 'is-active': showUrlInput }" @click="showUrlInput = !showUrlInput">
                      <i data-lucide="link" class="w-3.5 h-3.5 shrink-0"></i>
                      <span>DESDE URL</span>
                    </button>
                  </div>

                  <!-- Input Desplegable de Carga por URL -->
                  <div x-show="showUrlInput" x-transition
                    class="p-2.5 rounded-xl bg-black/60 border border-accent-cyan/30 space-y-2">
                    <label
                      class="text-[10px] font-mono text-accent-cyan uppercase tracking-wider flex items-center gap-1">
                      <i data-lucide="globe" class="w-3 h-3"></i> Enlace Web o Directo (Pinterest, ArtStation, Pixiv,
                      DeviantArt, etc.)
                    </label>
                    <div class="flex items-center gap-1.5">
                      <input type="url" class="form-input text-xs py-1.5 flex-1"
                        placeholder="https://... (Pinterest, ArtStation, Pixiv, Imgur o enlace directo)"
                        x-model="urlInput" @keydown.enter.prevent="submitUrl()" />
                      <button type="button"
                        class="px-3 py-1.5 bg-accent-cyan text-black font-hud text-xs font-bold uppercase rounded-lg hover:bg-accent-cyan/80 transition-colors cursor-pointer"
                        @click="submitUrl()">
                        Cargar
                      </button>
                    </div>
                  </div>

                  <!-- Avisos de Formato y Límites -->
                  <div class="p-2 rounded-lg bg-black/30 border border-parchment-brown/20 text-center space-y-0.5">
                    <p class="text-[10px] font-mono text-parchment-cream/90"
                      x-text="'Recomendado: ' + activeData.recommended"></p>
                    <p class="text-[9px] font-mono text-ink-slate uppercase tracking-wider">
                      Formatos: JPG · PNG · GIF (Animado) · WEBP · Drag y Drop Activo
                    </p>
                  </div>
                </div>

                <!-- 4. COMPOSITOR DE TARJETA EN TIEMPO REAL (LIVE CARD MOCKUP) -->
                <div class="pt-3 border-t border-parchment-brown/20 space-y-2">
                  <div class="flex items-center justify-between flex-wrap gap-1.5">
                    <span
                      class="text-[10px] font-mono font-bold uppercase tracking-wider text-accent-gold flex items-center gap-1.5 shrink-0">
                      <i data-lucide="layout-grid" class="w-3.5 h-3.5 text-accent-gold"></i> Vista Previa
                    </span>
                    <!-- Switch Fuente PFP: Ícono vs Avatar -->
                    <button type="button"
                      class="text-[9px] font-mono px-2 py-0.5 rounded-full border transition-all cursor-pointer flex items-center gap-1 shrink-0"
                      :class="$store.characters.active?.basics?.useIconForPfp ? 'border-accent-gold/50 bg-accent-gold/15 text-accent-gold' : 'border-accent-cyan/50 bg-accent-cyan/15 text-accent-cyan'"
                      @click="$store.characters.togglePfpSource()"
                      title="Clic para alternar si la tarjeta utiliza el Ícono o el Avatar Principal">
                      <span>PFP:</span>
                      <strong x-text="$store.characters.active?.basics?.useIconForPfp ? 'ÍCONO' : 'AVATAR'"></strong>
                    </button>
                  </div>

                  <!-- Mini-Tarjeta a Escala Real del Menú (Formato Panorámico 16:5) -->
                  <div class="mini-live-banner-card p-3 border border-white/20 shadow-lg select-none"
                    :style="\`--char-accent: \${$store.characters.getCharAccentColor($store.characters.active)};\`">

                    <!-- Báner de Fondo en Tiempo Real -->
                    <template
                      x-if="$store.characters.active?.basics?.bannerDataUrl || $store.characters.active?.visualSettings?.backgroundUrl">
                      <div class="card-banner-layer">
                        <img
                          :src="$store.characters.active?.basics?.bannerDataUrl || $store.characters.active?.visualSettings?.backgroundUrl"
                          class="card-banner-img" :style="$store.characters.active?.basics?.bannerTransform || ''"
                          alt="" />
                        <div class="card-banner-scrim"></div>
                      </div>
                    </template>

                    <!-- Glow Overlay por defecto si no hay Báner -->
                    <template
                      x-if="!$store.characters.active?.basics?.bannerDataUrl && !$store.characters.active?.visualSettings?.backgroundUrl">
                      <div
                        class="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#080a0d] z-0 pointer-events-none">
                      </div>
                    </template>

                    <!-- Contenido en Primer Plano -->
                    <div class="relative z-10 pointer-events-none">
                      <div class="flex items-center gap-2.5">
                        <!-- Frame del Ícono/Avatar en Vivo -->
                        <div class="relative shrink-0">
                          <div
                            class="relative overflow-hidden border-2 bg-black/60 flex items-center justify-center shrink-0 shadow-md transition-all"
                            data-protect-radius data-protect-circle
                            :class="($store.characters.getAvatarAspect($store.characters.active) === 'portrait') ? 'w-10 h-[52px] min-w-[40px] min-h-[52px]' : 'w-10 h-10 min-w-[40px] min-h-[40px]'"
                            :style="\`border-color: \${$store.characters.getCharAccentColor($store.characters.active)}; border-radius: \${$store.characters.getAvatarRadiusCss($store.characters.active)} !important; overflow: hidden; position: relative; isolation: isolate;\`">

                            <template x-if="$store.characters.getActiveAvatarUrl()">
                              <img :src="$store.characters.getActiveAvatarUrl()"
                                class="w-full h-full object-cover transition-all"
                                data-protect-radius data-protect-circle
                                :style="\`\${$store.characters.getActiveAvatarTransform()}; border-radius: \${$store.characters.getAvatarRadiusCss($store.characters.active)} !important;\`" alt="" />
                            </template>
                            <template x-if="!$store.characters.getActiveAvatarUrl()">
                              <div class="w-full h-full flex items-center justify-center">
                                <svg class="w-4 h-4 text-white/70" xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"
                                  stroke-linecap="round" stroke-linejoin="round">
                                  <circle cx="12" cy="8" r="5" />
                                  <path d="M20 21a8 8 0 0 0-16 0" />
                                </svg>
                              </div>
                            </template>
                          </div>

                          <!-- Marco de Avatar de Steam Superpuesto en Vista Previa -->
                          <template x-if="$store.characters.active?.basics?.avatarFrame?.url">
                            <img :src="$store.characters.active.basics.avatarFrame.url"
                              class="steam-avatar-frame-overlay" alt="" />
                          </template>
                        </div>

                        <!-- Nombre e Identidad en Vivo -->
                        <div class="min-w-0 flex-1 space-y-0.5">
                          <h4
                            class="font-title text-sm font-bold uppercase tracking-wider text-white truncate drop-shadow-md"
                            x-text="$store.characters.active?.name || $store.characters.active?.basics?.fullName || 'Sin Nombre'">
                          </h4>
                          <p class="text-[10px] text-parchment-cream/90 font-sans truncate drop-shadow"
                            x-text="$store.characters.active?.basics?.nickname ? '«' + $store.characters.active.basics.nickname + '»' : ($store.characters.active?.basics?.race || 'Operativo')">
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Mini Indicador si tiene marco de Steam equipado -->
                <template x-if="$store.characters.active?.basics?.avatarFrame?.url">
                  <div class="pt-2.5 border-t border-parchment-brown/20 flex items-center justify-between gap-2">
                    <div class="flex items-center gap-1.5 min-w-0">
                      <i data-lucide="steam" class="w-3.5 h-3.5 text-accent-cyan shrink-0"></i>
                      <span class="text-[10.5px] font-mono text-accent-cyan truncate"
                        x-text="$store.characters.active.basics.avatarFrame.name || 'Marco Steam'"></span>
                    </div>
                    <button type="button"
                      @click="$store.app.activeTabs.includes('steam') ? $store.app.setTab('steam') : $store.app.addTab('steam')"
                      class="px-2 py-0.5 rounded bg-accent-cyan/15 hover:bg-accent-cyan/25 border border-accent-cyan/40 text-accent-cyan text-[10px] font-mono font-bold uppercase transition-all shrink-0 cursor-pointer flex items-center gap-1">
                      <span>Ver en Steam</span>
                      <i data-lucide="arrow-right" class="w-2.5 h-2.5"></i>
                    </button>
                  </div>
                </template>

                <!-- 5. FORMATO y GEOMETRÍA DEL PERFIL (AVATAR / PFP) -->
                <div class="pt-3 border-t border-parchment-brown/20 space-y-3"
                  x-data="{
                    sliderVal: $store.characters.getAvatarRadius($store.characters.active),
                    syncRadius() {
                      this.sliderVal = $store.characters.getAvatarRadius($store.characters.active);
                    }
                  }"
                  x-init="
                    $watch(() => $store.characters.active?.basics?.avatarRadius, val => { if(val !== undefined) sliderVal = Number(val); });
                    $watch(() => $store.characters.active?.basics?.avatarShape, () => syncRadius());
                    $watch('$store.characters.activeId', () => syncRadius());
                  ">

                  <!-- Encabezado con título e indicador interactivo -->
                  <div class="flex items-center justify-between gap-2">
                    <div class="flex items-center gap-1.5 min-w-0">
                      <i data-lucide="shapes" class="w-4 h-4 text-accent-cyan shrink-0"></i>
                      <span class="text-[11px] font-mono font-bold uppercase tracking-wider text-parchment-cream truncate">
                        Formato y Bordes de Perfil
                      </span>
                    </div>

                    <!-- Badge reactivo que muestra el estado actual -->
                    <span class="px-2 py-0.5 rounded-full text-[9.5px] font-mono font-bold uppercase tracking-wider border shrink-0 transition-all"
                      :class="$store.characters.isAvatarSquare() 
                        ? 'bg-amber-500/15 border-amber-500/40 text-amber-300' 
                        : ($store.characters.isAvatarCircle() 
                          ? 'bg-purple-500/15 border-purple-500/40 text-purple-300' 
                          : 'bg-accent-cyan/15 border-accent-cyan/40 text-accent-cyan')"
                      x-text="$store.characters.isAvatarSquare() ? 'Cuadrado 0%' : ($store.characters.isAvatarCircle() ? 'Circular 50%' : ($store.characters.getAvatarRadius() + '% Curva'))">
                    </span>
                  </div>

                  <!-- Selector de Proporción (1:1 Cuadrado vs 3:4 Retrato Rectangular) -->
                  <div class="flex items-center justify-between p-2 rounded-xl bg-black/40 border border-white/10 text-xs">
                    <div class="flex items-center gap-1.5 min-w-0">
                      <i data-lucide="crop" class="w-3.5 h-3.5 text-parchment-cream/70 shrink-0"></i>
                      <span class="text-[11px] font-sans text-parchment-cream/80 truncate">Proporción:</span>
                    </div>
                    <div class="inline-flex rounded-lg bg-black/70 p-0.5 border border-white/15 shrink-0">
                      <button type="button" 
                        @click="$store.characters.setAvatarAspect('square')"
                        class="px-2.5 py-1 text-[10px] font-mono font-bold uppercase rounded transition-all cursor-pointer flex items-center gap-1.5"
                        :class="$store.characters.getAvatarAspect() === 'square' 
                          ? 'font-bold' 
                          : 'text-parchment-cream/60 hover:text-white'"
                        :style="$store.characters.getAvatarAspect() === 'square' 
                          ? ('background-color: ' + $store.settings.accentColor + '; color: #000; box-shadow: 0 0 10px ' + ($store.settings.activeGlowColor) + '80;') 
                          : ''"
                        title="Formato Cuadrado 1:1 (Compatible 100% con marcos de Steam y redes)">
                        <span class="w-2.5 h-2.5 border border-current rounded-none inline-block"></span>
                        <span>1:1 Cuadrado</span>
                      </button>
                      <button type="button" 
                        @click="$store.characters.setAvatarAspect('portrait')"
                        class="px-2.5 py-1 text-[10px] font-mono font-bold uppercase rounded transition-all cursor-pointer flex items-center gap-1.5"
                        :class="$store.characters.getAvatarAspect() === 'portrait' 
                          ? 'font-bold' 
                          : 'text-parchment-cream/60 hover:text-white'"
                        :style="$store.characters.getAvatarAspect() === 'portrait' 
                          ? ('background-color: ' + $store.settings.accentColor + '; color: #000; box-shadow: 0 0 10px ' + ($store.settings.activeGlowColor) + '80;') 
                          : ''"
                        title="Formato Retrato 3:4 (Rectangular vertical para ilustraciones de cuerpo/ficha)">
                        <span class="w-2.5 h-3.5 border border-current rounded-none inline-block"></span>
                        <span>3:4 Retrato</span>
                      </button>
                    </div>
                  </div>

                  <!-- Botones de Preajustes Rápidos (5 Formatos Canónicos) -->
                  <div class="space-y-1.5">
                    <div class="flex items-center justify-between text-[10px] font-mono text-ink-slate px-0.5">
                      <span class="flex items-center gap-1.5 text-slate-300">
                        <i data-lucide="layout-grid" class="w-3.5 h-3.5" :style="'color: ' + $store.settings.accentColor + ';'"></i>
                        <span>Preajustes Rápidos:</span>
                      </span>
                      <button type="button" 
                        @click="$store.characters.setAvatarRadius(25); sliderVal = 25;"
                        class="text-[9.5px] hover:underline cursor-pointer flex items-center gap-1 transition-colors"
                        :style="'color: ' + $store.settings.accentColor + ';'"
                        title="Restablecer a curvatura estándar por defecto (25%)">
                        <i data-lucide="rotate-ccw" class="w-3 h-3"></i> Restablecer
                      </button>
                    </div>

                    <div class="grid grid-cols-5 gap-1.5">
                      <!-- 1. Cuadrado / Recto (0%) -->
                      <button type="button"
                        @click="$store.characters.setAvatarShape('square'); sliderVal = 0;"
                        class="p-1.5 rounded-lg border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer group"
                        :class="$store.characters.getAvatarRadius() === 0 
                          ? 'border-transparent' 
                          : 'bg-black/40 border-white/10 hover:border-white/25 text-parchment-cream/70 hover:text-white'"
                        :style="$store.characters.getAvatarRadius() === 0 
                          ? ('background-color: rgba(' + $store.settings.rgbChannels + ', 0.18); border-color: ' + $store.settings.accentColor + '; color: ' + $store.settings.accentColor + '; box-shadow: 0 0 14px ' + ($store.settings.activeGlowColor) + '60;') 
                          : ''"
                        title="Cuadrado perfecto (0% - esquinas en ángulo recto de 90°)">
                        <svg class="w-4 h-4 shrink-0 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                          <rect x="3.5" y="3.5" width="17" height="17" rx="0" />
                        </svg>
                        <span class="text-[8.5px] font-mono font-bold uppercase truncate">Recto</span>
                      </button>

                      <!-- 2. Suave (12%) -->
                      <button type="button"
                        @click="$store.characters.setAvatarShape('smooth'); sliderVal = 12;"
                        class="p-1.5 rounded-lg border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer group"
                        :class="$store.characters.getAvatarRadius() === 12 
                          ? 'border-transparent' 
                          : 'bg-black/40 border-white/10 hover:border-white/25 text-parchment-cream/70 hover:text-white'"
                        :style="$store.characters.getAvatarRadius() === 12 
                          ? ('background-color: rgba(' + $store.settings.rgbChannels + ', 0.18); border-color: ' + $store.settings.accentColor + '; color: ' + $store.settings.accentColor + '; box-shadow: 0 0 14px ' + ($store.settings.activeGlowColor) + '60;') 
                          : ''"
                        title="Esquinas suaves (12% curvatura sutil)">
                        <svg class="w-4 h-4 shrink-0 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                          <rect x="3.5" y="3.5" width="17" height="17" rx="3.5" />
                        </svg>
                        <span class="text-[8.5px] font-mono font-bold uppercase truncate">Suave</span>
                      </button>

                      <!-- 3. Redondeado Estándar (25%) -->
                      <button type="button"
                        @click="$store.characters.setAvatarShape('rounded'); sliderVal = 25;"
                        class="p-1.5 rounded-lg border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer group"
                        :class="$store.characters.getAvatarRadius() === 25 
                          ? 'border-transparent' 
                          : 'bg-black/40 border-white/10 hover:border-white/25 text-parchment-cream/70 hover:text-white'"
                        :style="$store.characters.getAvatarRadius() === 25 
                          ? ('background-color: rgba(' + $store.settings.rgbChannels + ', 0.18); border-color: ' + $store.settings.accentColor + '; color: ' + $store.settings.accentColor + '; box-shadow: 0 0 14px ' + ($store.settings.activeGlowColor) + '60;') 
                          : ''"
                        title="Redondeado estándar (25% - clásico)">
                        <svg class="w-4 h-4 shrink-0 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                          <rect x="3.5" y="3.5" width="17" height="17" rx="6.5" />
                        </svg>
                        <span class="text-[8.5px] font-mono font-bold uppercase truncate">Estándar</span>
                      </button>

                      <!-- 4. Squircle (38%) -->
                      <button type="button"
                        @click="$store.characters.setAvatarShape('squircle'); sliderVal = 38;"
                        class="p-1.5 rounded-lg border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer group"
                        :class="$store.characters.getAvatarRadius() === 38 
                          ? 'border-transparent' 
                          : 'bg-black/40 border-white/10 hover:border-white/25 text-parchment-cream/70 hover:text-white'"
                        :style="$store.characters.getAvatarRadius() === 38 
                          ? ('background-color: rgba(' + $store.settings.rgbChannels + ', 0.18); border-color: ' + $store.settings.accentColor + '; color: ' + $store.settings.accentColor + '; box-shadow: 0 0 14px ' + ($store.settings.activeGlowColor) + '60;') 
                          : ''"
                        title="Squircle superelipse (38% - curvatura moderna)">
                        <svg class="w-4 h-4 shrink-0 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                          <path d="M 12 3.5 C 18.2 3.5 20.5 5.8 20.5 12 C 20.5 18.2 18.2 20.5 12 20.5 C 5.8 20.5 3.5 18.2 3.5 12 C 3.5 5.8 5.8 3.5 12 3.5 Z" />
                        </svg>
                        <span class="text-[8.5px] font-mono font-bold uppercase truncate">Squircle</span>
                      </button>

                      <!-- 5. Circular Perfecto (50%) -->
                      <button type="button"
                        @click="$store.characters.setAvatarShape('circle'); sliderVal = 50;"
                        class="p-1.5 rounded-lg border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer group"
                        :class="$store.characters.getAvatarRadius() === 50 
                          ? 'border-transparent' 
                          : 'bg-black/40 border-white/10 hover:border-white/25 text-parchment-cream/70 hover:text-white'"
                        :style="$store.characters.getAvatarRadius() === 50 
                          ? ('background-color: rgba(' + $store.settings.rgbChannels + ', 0.18); border-color: ' + $store.settings.accentColor + '; color: ' + $store.settings.accentColor + '; box-shadow: 0 0 14px ' + ($store.settings.activeGlowColor) + '60;') 
                          : ''"
                        title="Circular perfecto (50% - totalmente redondo)">
                        <svg class="w-4 h-4 shrink-0 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                          <circle cx="12" cy="12" r="8.5" />
                        </svg>
                        <span class="text-[8.5px] font-mono font-bold uppercase truncate">Círculo</span>
                      </button>
                    </div>
                  </div>

                  <!-- Slider Continuo de Redondez (0% a 50%) -->
                  <div class="p-2.5 rounded-xl bg-black/50 border border-white/10 space-y-2">
                    <div class="flex items-center justify-between text-xs">
                      <span class="text-[11px] font-sans text-parchment-cream/80 flex items-center gap-1.5">
                        <i data-lucide="sliders" class="w-3.5 h-3.5" :style="'color: ' + $store.settings.accentColor + ';'"></i>
                        Curvatura de Bordes:
                      </span>
                      <span class="font-mono text-xs font-bold" :style="'color: ' + $store.settings.accentColor + ';'" x-text="sliderVal + '%'"></span>
                    </div>

                    <div class="flex items-center gap-2.5">
                      <span class="text-[9px] font-mono text-ink-slate shrink-0 uppercase">0% Recto</span>
                      <input type="range" min="0" max="50" step="1"
                        x-model.number="sliderVal"
                        @input="$store.characters.setAvatarRadius(sliderVal)"
                        @change="$store.characters.pushUndoSnapshot('Ajustar curvatura de avatar'); $store.characters.scheduleAutoSave();"
                        class="w-full h-1.5 bg-black/80 rounded-lg appearance-none cursor-pointer"
                        :style="'accent-color: ' + $store.settings.accentColor + ';'" />
                      <span class="text-[9px] font-mono text-ink-slate shrink-0 uppercase">50% Círculo</span>
                    </div>
                  </div>

                  <!-- Nota contextual si hay marco de Steam -->
                  <template x-if="$store.characters.active?.basics?.avatarFrame?.url">
                    <p class="text-[10px] text-accent-cyan/80 font-sans flex items-start gap-1.5 px-1 leading-tight">
                      <i data-lucide="info" class="w-3.5 h-3.5 text-accent-cyan shrink-0 mt-0.5"></i>
                      <span>Marco de Steam activo: Los marcos se adaptan sobre cualquier silueta, y encajan al 100% en formato <strong>Cuadrado 1:1</strong>.</span>
                    </p>
                  </template>

                </div>

              </div>

              <!-- Columna Formulario (8 cols) -->
              <div class="lg:col-span-8 form-card" data-export-hide-on-id-card>
                <h3 class="form-card-title">
                  <i data-lucide="id-card" class="w-5 h-5"></i> IDENTIDAD Y ROL
                </h3>

                <!-- MODO EDICIA“N -->
                <div x-show="$store.app.editMode" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label class="form-label">Nombre Completo</label>
                    <input type="text" class="form-input" x-model="$store.characters.active.basics.fullName"
                      @input="$store.characters.active.name = $store.characters.active.basics.fullName; $store.characters.scheduleAutoSave()"
                      placeholder="Ej: Arthur Pendelton" />
                  </div>

                  <div>
                    <label class="form-label">Apodo / Alias / Títulos</label>
                    <input type="text" class="form-input" x-model="$store.characters.active.basics.nickname"
                      @input="$store.characters.scheduleAutoSave()" placeholder="Ej: El Halcón del Norte" />
                  </div>

                  <div>
                    <label class="form-label">Edad Real</label>
                    <input type="text" class="form-input" x-model="$store.characters.active.basics.realAge"
                      @input="$store.characters.scheduleAutoSave()" placeholder="Ej: 34 años" />
                  </div>

                  <div>
                    <label class="form-label">Edad Aparente</label>
                    <input type="text" class="form-input" x-model="$store.characters.active.basics.apparentAge"
                      @input="$store.characters.scheduleAutoSave()" placeholder="Ej: Aparenta 25 años" />
                  </div>

                  <div>
                    <label class="form-label">Género y Pronombres</label>
                    <input type="text" class="form-input" x-model="$store.characters.active.basics.genderPronouns"
                      @input="$store.characters.scheduleAutoSave()" placeholder="Ej: Masculino (Él/Him)" />
                  </div>

                  <div>
                    <label class="form-label">Raza / Especie</label>
                    <input type="text" class="form-input" x-model="$store.characters.active.basics.race"
                      @input="$store.characters.scheduleAutoSave()" placeholder="Ej: Humano / Androide / Cyborg" />
                  </div>

                  <div>
                    <label class="form-label">Orientación</label>
                    <input type="text" class="form-input" x-model="$store.characters.active.basics.orientation"
                      @input="$store.characters.scheduleAutoSave()" placeholder="Ej: Heterosexual / Bisexual" />
                  </div>

                  <div>
                    <label class="form-label">Ocupación / Rol</label>
                    <input type="text" class="form-input" x-model="$store.characters.active.basics.role"
                      @input="$store.characters.scheduleAutoSave()" placeholder="Ej: Operativo / Hacker / Navegante" />
                  </div>

                  <div class="sm:col-span-2">
                    <label class="form-label">Alineación Moral / Arquetipo</label>
                    <div class="space-y-2">
                      <select class="form-select"
                        :value="['Legal Bueno', 'Legal Neutral', 'Legal Malvado', 'Neutral Bueno', 'Neutral Absoluto', 'Neutral Malvado', 'Caótico Bueno', 'Caótico Neutral', 'Caótico Malvado'].includes($store.characters.active.basics.alignment) ? $store.characters.active.basics.alignment : 'Personalizado'"
                        @change="
                          if ($event.target.value !== 'Personalizado') {
                            $store.characters.active.basics.alignment = $event.target.value;
                          } else if (['Legal Bueno', 'Legal Neutral', 'Legal Malvado', 'Neutral Bueno', 'Neutral Absoluto', 'Neutral Malvado', 'Caótico Bueno', 'Caótico Neutral', 'Caótico Malvado'].includes($store.characters.active.basics.alignment)) {
                            $store.characters.active.basics.alignment = '';
                          }
                          $store.characters.scheduleAutoSave();
                        ">
                        <option value="Legal Bueno">Legal Bueno (Lawful Good)</option>
                        <option value="Legal Neutral">Legal Neutral (Lawful Neutral)</option>
                        <option value="Legal Malvado">Legal Malvado (Lawful Evil)</option>
                        <option value="Neutral Bueno">Neutral Bueno (Neutral Good)</option>
                        <option value="Neutral Absoluto">Neutral Absoluto (True Neutral)</option>
                        <option value="Neutral Malvado">Neutral Malvado (Neutral Evil)</option>
                        <option value="Caótico Bueno">Caótico Bueno (Chaotic Good)</option>
                        <option value="Caótico Neutral">Caótico Neutral (Chaotic Neutral)</option>
                        <option value="Caótico Malvado">Caótico Malvado (Chaotic Evil)</option>
                        <option value="Personalizado"> Personalizada / Filosofía propia...</option>
                      </select>

                      <!-- Campo de texto para Alineación Personalizada -->
                      <div
                        x-show="!['Legal Bueno', 'Legal Neutral', 'Legal Malvado', 'Neutral Bueno', 'Neutral Absoluto', 'Neutral Malvado', 'Caótico Bueno', 'Caótico Neutral', 'Caótico Malvado'].includes($store.characters.active.basics.alignment)">
                        <input type="text" class="form-input text-sm"
                          x-model="$store.characters.active.basics.alignment"
                          @input="$store.characters.scheduleAutoSave()"
                          placeholder="Ej: Anarquista Pragmático, Rebelde sin Causa, Nihilista Moral..." />
                      </div>
                    </div>

                    <!-- Recuadro informativo dinámico de Alineación Moral -->
                    <div
                      x-show="$store.characters.active?.basics.alignment && $store.app.alignments[$store.characters.active?.basics.alignment]"
                      x-transition:enter="transition ease-out duration-200"
                      x-transition:enter-start="opacity-0 -translate-y-1"
                      x-transition:enter-end="opacity-100 translate-y-0"
                      class="mt-2.5 p-3 rounded-xl bg-parchment-brown/10 border border-parchment-brown/25 flex items-start gap-2.5 text-xs font-sans text-ink-sage">
                      <i data-lucide="info" class="w-4 h-4 text-accent-gold/80 shrink-0 mt-0.5"></i>
                      <div class="space-y-1 flex-1">
                        <div class="flex items-center justify-between gap-2">
                          <span class="font-semibold text-parchment-cream"
                            x-text="$store.characters.active?.basics.alignment"></span>
                          <span class="text-[10px] text-accent-gold/80 italic"
                            x-text="$store.app.alignments[$store.characters.active?.basics.alignment]?.english"></span>
                        </div>
                        <p class="text-parchment-cream/80 leading-relaxed"
                          x-text="$store.app.alignments[$store.characters.active?.basics.alignment]?.description"></p>
                        <p class="text-[11px] text-ink-sage/90">
                          <strong class="text-accent-gold/70 font-medium">Ejemplos:</strong>
                          <span
                            x-text="$store.app.alignments[$store.characters.active?.basics.alignment]?.examples.join(', ')"></span>
                        </p>
                      </div>
                    </div>

                    <!-- Subsección: Frases del Personaje -->
                    <div class="mt-6 pt-5 border-t border-parchment-brown/20 space-y-3">
                      <div class="flex flex-wrap items-center justify-between gap-3">
                        <label class="form-label flex items-center gap-1.5 mb-0 select-none">
                          <i data-lucide="quote" class="w-3.5 h-3.5 text-accent-gold"></i> Frases Célebres y Citas
                          del Personaje
                        </label>

                        <!-- Controles de Visualización en el Panel -->
                        <div class="flex items-center gap-3 flex-wrap">
                          <!-- Toggle para mostrar / ocultar en la tarjeta del panel -->
                          <label
                            class="flex items-center gap-2 cursor-pointer select-none text-xs text-ink-slate hover:text-parchment-cream transition-colors">
                            <input type="checkbox"
                              :checked="$store.characters.active?.basics?.showQuoteOnCard !== false"
                              @change="if (!$store.characters.active.basics) $store.characters.active.basics = {}; $store.characters.active.basics.showQuoteOnCard = $event.target.checked; $store.characters.scheduleAutoSave()"
                              class="rounded bg-black/40 border-parchment-brown/40 text-accent-cyan focus:ring-0 w-3.5 h-3.5 cursor-pointer" />
                            <span class="text-[11px] font-mono">Mostrar en tarjeta</span>
                          </label>

                          <!-- Toggle para rotar automáticamente entre frases -->
                          <label
                            class="flex items-center gap-2 cursor-pointer select-none text-xs text-ink-slate hover:text-parchment-cream transition-colors"
                            x-show="($store.characters.active?.basics?.quotes || []).length > 1">
                            <input type="checkbox"
                              :checked="$store.characters.active?.basics?.rotateQuotesOnCard !== false"
                              @change="if (!$store.characters.active.basics) $store.characters.active.basics = {}; $store.characters.active.basics.rotateQuotesOnCard = $event.target.checked; $store.characters.scheduleAutoSave()"
                              class="rounded bg-black/40 border-parchment-brown/40 text-accent-gold focus:ring-0 w-3.5 h-3.5 cursor-pointer" />
                            <span class="text-[11px] font-mono flex items-center gap-1 text-accent-gold/90 font-medium">
                              <i data-lucide="refresh-cw" class="w-3 h-3"></i> Rotar Frases
                            </span>
                          </label>
                        </div>
                      </div>

                      <p class="text-[11px] text-ink-slate leading-tight">
                        Añade frases icónicas, lemas o citas que definan la personalidad del personaje. Puedes editarlas
                        directamente haciendo clic sobre cualquier frase de la lista.
                      </p>

                      <!-- Input con botón "+" para añadir frase -->
                      <div x-data="{ newQuoteText: '' }" class="flex items-center gap-2">
                        <input type="text" class="form-input text-xs flex-1" x-model="newQuoteText"
                          @keydown.enter.prevent="
                            if (newQuoteText.trim()) {
                              $store.characters.addQuote(newQuoteText.trim());
                              newQuoteText = '';
                            }
                          " placeholder="Ej: “El destino no está escrito, lo forjamos nosotros.”" />
                        <button type="button" @click="
                            if (newQuoteText.trim()) {
                              $store.characters.addQuote(newQuoteText.trim());
                              newQuoteText = '';
                            }
                          "
                          class="px-3.5 py-2 rounded-lg bg-accent-gold/20 text-accent-gold border border-accent-gold/40 hover:bg-accent-gold hover:text-black font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm shrink-0"
                          title="Añadir frase a la lista">
                          <i data-lucide="plus" class="w-4 h-4"></i>
                          <span class="hidden sm:inline">Añadir</span>
                        </button>
                      </div>

                      <!-- Lista de Frases Registradas (Editables In-Place) -->
                      <div class="space-y-1.5 pt-1"
                        x-show="($store.characters.active?.basics?.quotes || []).length > 0">
                        <template x-for="(quote, qIdx) in ($store.characters.active?.basics?.quotes || [])" :key="qIdx">
                          <div
                            class="flex items-center justify-between gap-2 p-1.5 px-2.5 rounded-lg bg-black/40 border border-parchment-brown/25 group hover:border-accent-gold/50 focus-within:border-accent-gold/70 focus-within:bg-black/60 transition-all">
                            <i data-lucide="quote" class="w-3.5 h-3.5 text-accent-gold/70 shrink-0 select-none"></i>
                            <input type="text"
                              class="form-input text-xs italic font-serif flex-1 bg-transparent border-0 focus:ring-0 focus:outline-none p-1 text-parchment-cream"
                              x-model="$store.characters.active.basics.quotes[qIdx]"
                              @input="$store.characters.scheduleAutoSave()" placeholder="Escribe o edita la frase..." />
                            <button type="button" @click="$store.characters.removeQuote(qIdx)"
                              class="p-1 rounded text-ink-slate hover:text-accent-ruby hover:bg-accent-ruby/10 transition-colors cursor-pointer shrink-0"
                              title="Eliminar frase">
                              <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                            </button>
                          </div>
                        </template>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- MODO LECTURA -->
                <div x-show="!$store.app.editMode" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div class="read-card">
                    <span class="read-label"><i data-lucide="user" class="w-3.5 h-3.5"></i> Nombre Completo</span>
                    <p class="read-value font-title text-lg" style="color:var(--accent);"
                      x-html="$store.app.formatRichText($store.characters.active?.basics.fullName || 'No especificado')"></p>
                  </div>

                  <div class="read-card">
                    <span class="read-label"><i data-lucide="award" class="w-3.5 h-3.5"></i> Apodo / Alias / Títulos</span>
                    <p class="read-value" x-html="$store.app.formatRichText($store.characters.active?.basics.nickname || 'Sin alias')"></p>
                  </div>

                  <div class="read-card">
                    <span class="read-label"><i data-lucide="hourglass" class="w-3.5 h-3.5"></i> Edad Real /
                      Aparente</span>
                    <p class="read-value"
                      x-text="($store.characters.active?.basics.realAge || '-') + ($store.characters.active?.basics.apparentAge ? ' (Aparenta ' + $store.characters.active.basics.apparentAge + ')' : '')">
                    </p>
                  </div>

                  <div class="read-card">
                    <span class="read-label"><i data-lucide="user" class="w-3.5 h-3.5"></i> Género y
                      Pronombres</span>
                    <p class="read-value" x-text="$store.characters.active?.basics.genderPronouns || 'No especificado'">
                    </p>
                  </div>

                  <div class="read-card">
                    <span class="read-label"><i data-lucide="dna" class="w-3.5 h-3.5"></i> Raza / Especie</span>
                    <p class="read-value" x-html="$store.app.formatRichText($store.characters.active?.basics.race || 'No especificada')"></p>
                  </div>

                  <div class="read-card">
                    <span class="read-label"><i data-lucide="heart" class="w-3.5 h-3.5"></i> Orientación</span>
                    <p class="read-value" x-text="$store.characters.active?.basics.orientation || 'No especificada'">
                    </p>
                  </div>

                  <div class="read-card sm:col-span-2">
                    <span class="read-label"><i data-lucide="briefcase" class="w-3.5 h-3.5"></i> Ocupación / Rol</span>
                    <p class="read-value" x-html="$store.app.formatRichText($store.characters.active?.basics.role || 'Sin ocupación')"></p>
                  </div>

                  <div class="read-card sm:col-span-2">
                    <span class="read-label"><i data-lucide="scale" class="w-3.5 h-3.5"></i> Alineación Moral</span>
                    <div class="flex items-center flex-wrap gap-2 mt-1.5">
                      <span
                        class="inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-medium leading-normal border border-accent-gold/40 text-accent-gold bg-accent-gold/10"
                        x-text="$store.characters.active?.basics.alignment"></span>
                      <span class="text-xs text-ink-slate italic leading-normal"
                        x-text="$store.app.alignments[$store.characters.active?.basics.alignment]?.english ? '(' + $store.app.alignments[$store.characters.active?.basics.alignment]?.english + ')' : ''"></span>
                    </div>
                    <div
                      x-show="$store.characters.active?.basics.alignment && $store.app.alignments[$store.characters.active?.basics.alignment]"
                      class="mt-2.5 text-xs text-ink-sage space-y-1 border-t border-parchment-brown/20 pt-2">
                      <p class="text-parchment-cream/80 leading-relaxed"
                        x-text="$store.app.alignments[$store.characters.active?.basics.alignment]?.description"></p>
                      <p class="text-[11px] text-ink-sage/90">
                        <strong class="text-accent-gold/70 font-medium">Ejemplos:</strong>
                        <span
                          x-text="$store.app.alignments[$store.characters.active?.basics.alignment]?.examples.join(', ')"></span>
                      </p>
                    </div>
                  </div>

                  <!-- Frases en Modo Lectura -->
                  <div class="read-card sm:col-span-2"
                    x-show="($store.characters.active?.basics?.quotes || []).length > 0">
                    <span class="read-label"><i data-lucide="quote" class="w-3.5 h-3.5 text-accent-gold"></i> Frases
                      Célebres y Citas</span>
                    <div class="space-y-2 mt-2">
                      <template x-for="(quote, qIdx) in ($store.characters.active?.basics?.quotes || [])" :key="qIdx">
                        <p
                          class="text-xs italic text-parchment-cream/95 font-serif leading-relaxed pl-1 flex items-start gap-1">
                          <span class="text-accent-gold/80 font-bold select-none text-sm leading-none shrink-0">“</span>
                          <span class="flex-1" x-html="$store.app.formatRichText(quote)"></span>
                          <span class="text-accent-gold/80 font-bold select-none text-sm leading-none shrink-0">”</span>
                        </p>
                      </template>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
`;
}
