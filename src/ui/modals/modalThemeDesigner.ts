/**
 * @file src/ui/modals/modalThemeDesigner.ts
 */

export function renderModalThemeDesigner(): string {
  return `<!-- ==============================================================
     1. THEME DESIGNER MODAL — Creador / Editor de Kit de Tema
     ============================================================== -->
  <div id="theme-designer-modal" class="modal-backdrop z-[999990] p-3 sm:p-6" x-show="$store.settings.showDesignerModal"
    x-cloak x-data x-transition:enter="transition ease-out duration-200" x-transition:enter-start="opacity-0 scale-95"
    x-transition:enter-end="opacity-100 scale-100" x-transition:leave="transition ease-in duration-150"
    x-transition:leave-start="opacity-100 scale-100" x-transition:leave-end="opacity-0 scale-95"
    @keydown.escape.window="$store.settings.closeDesigner()" role="dialog" aria-modal="true">
    <div class="absolute inset-0 bg-black/80 backdrop-blur-md" @click="$store.settings.closeDesigner()"></div>

    <!-- Modal Dialog Window (Render diferido bajo demanda con ancho expandido a 1200px) -->
    <template x-if="$store.settings.showDesignerModal">
    <div
      data-protect-contrast="true" class="relative z-10 w-full bg-[#080a0d] border-2 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-parchment-cream transition-all"
      :style="'border-color: ' + ($store.settings.designerForm.color || '#00F0FF') + '60; box-shadow: 0 0 50px rgba(0,0,0,0.95), 0 0 30px ' + ($store.settings.designerForm.glowColor || $store.settings.designerForm.color || '#00F0FF') + '30; max-width: min(1200px, 96vw) !important; width: 100%;'"
      @click.stop>

      <!-- Topbar Header -->
      <div class="px-6 py-4 bg-[#050608] border-b border-white/10 flex items-center justify-between gap-4 shrink-0">
        <!-- Izquierda: Icono + Título + Subtítulo -->
        <div class="flex items-center gap-3.5 min-w-0 flex-1">
          <div class="w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 shadow-lg transition-colors"
            :style="'border-color: ' + ($store.settings.designerForm.color || '#00F0FF') + '60; background: ' + ($store.settings.designerForm.color || '#00F0FF') + '15; color: ' + ($store.settings.designerForm.color || '#00F0FF') + '; box-shadow: 0 0 15px ' + ($store.settings.designerForm.color || '#00F0FF') + '25;'">
            <i data-lucide="palette" class="w-5 h-5"></i>
          </div>
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2.5 flex-wrap">
              <h3 class="font-title text-base sm:text-lg font-bold uppercase tracking-wider whitespace-nowrap"
                :style="'color: ' + ($store.settings.designerForm.color || '#00F0FF')"
                x-text="$store.settings.designerMode === 'edit' ? 'Editar Kit Personalizado' : 'Diseñador de Kit de Tema'"></h3>
              <span class="text-[10px] px-2.5 py-0.5 rounded-full font-mono font-extrabold uppercase tracking-wider border shadow-sm shrink-0 flex items-center gap-1.5"
                :style="'background-color: ' + ($store.settings.designerForm.color || '#00F0FF') + '20; color: ' + ($store.settings.designerForm.color || '#00F0FF') + '; border-color: ' + ($store.settings.designerForm.color || '#00F0FF') + '50;'">
                <span class="w-1.5 h-1.5 rounded-full animate-pulse" :style="'background-color: ' + ($store.settings.designerForm.color || '#00F0FF')"></span>
                <span x-text="$store.settings.designerMode === 'edit' ? 'MODO EDICIÓN' : 'MODO CREACIÓN'"></span>
              </span>
            </div>
            <p class="text-xs text-ink-slate font-mono mt-0.5">
              Paleta cromática de 6 canales, jerarquía tipográfica y geometría de bordes.
            </p>
          </div>
        </div>

        <!-- Derecha: Botón de Cargar Ajustes + Botón Cerrar (SIEMPRE visibles y bien ordenados) -->
        <div class="flex items-center gap-2.5 sm:gap-3 shrink-0">
          <button type="button" @click="$store.settings.syncCurrentSettingsToDesigner()"
            class="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-parchment-cream/90 hover:text-white border border-white/10 hover:border-white/30 text-xs font-mono font-bold transition-all cursor-pointer whitespace-nowrap shadow-sm flex items-center gap-2 shrink-0 group"
            title="Importar la configuración activa actual de la app a este formulario">
            <i data-lucide="pipette" class="w-4 h-4 transition-transform group-hover:rotate-12" :style="'color: ' + ($store.settings.designerForm.color || '#00F0FF')"></i>
            <span>Cargar Ajustes Actuales</span>
          </button>

          <button type="button" @click="$store.settings.closeDesigner()"
            class="w-9 h-9 rounded-xl bg-white/5 hover:bg-rose-500/20 text-ink-slate hover:text-rose-400 border border-white/10 hover:border-rose-500/30 transition-all flex items-center justify-center cursor-pointer shrink-0"
            title="Cerrar diseñador (Esc)">
            <i data-lucide="x" class="w-4 h-4"></i>
          </button>
        </div>
      </div>

      <!-- Main Body: Form controls + Live Preview Card -->
      <div
        class="p-5 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 custom-scrollbar text-xs bg-[#080a0d]">

        <!-- Controls Column (7 cols) -->
        <div class="lg:col-span-7 space-y-4">
          <!-- Nombre del Kit -->
          <div class="space-y-1.5">
            <label class="block text-xs font-bold text-parchment-cream uppercase tracking-wider font-mono">Nombre del Kit</label>
            <input type="text" x-model="$store.settings.designerForm.name" placeholder="Ej: Cyberpunk Neon Custom..."
              class="form-input text-xs w-full bg-black/60 border-parchment-brown/30 focus:border-accent-cyan rounded-xl p-2.5 font-mono text-white" />
          </div>

          <!-- Paleta Cromática Completa (6 Canales de Color) -->
          <div class="space-y-2 p-3.5 rounded-xl bg-black/50 border border-white/10">
            <div class="flex items-center justify-between border-b border-white/10 pb-1.5">
              <span class="text-xs font-bold text-parchment-cream uppercase tracking-wider font-mono flex items-center gap-1.5">
                <i data-lucide="pipette" class="w-3.5 h-3.5 text-accent-cyan"></i>
                Paleta Cromática (6 Canales)
              </span>
              <span class="text-[10px] text-ink-slate font-mono">Sincronizado con CSS :root</span>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <!-- 1. Color Primario / Acento -->
              <div class="space-y-1">
                <label class="block text-[11px] font-bold text-accent-cyan font-mono">1. Primario / Acento</label>
                <div class="flex items-center gap-2">
                  <input type="color" x-model="$store.settings.designerForm.color"
                    class="w-8 h-8 rounded-lg border border-white/20 cursor-pointer bg-transparent shrink-0" />
                  <input type="text" x-model="$store.settings.designerForm.color"
                    class="form-input text-xs flex-1 bg-black/70 border-white/15 focus:border-accent-cyan rounded-lg p-2 font-mono uppercase" />
                </div>
              </div>

              <!-- 2. Color Secundario -->
              <div class="space-y-1">
                <label class="block text-[11px] font-bold text-pink-400 font-mono">2. Secundario</label>
                <div class="flex items-center gap-2">
                  <input type="color" x-model="$store.settings.designerForm.secondaryColor"
                    class="w-8 h-8 rounded-lg border border-white/20 cursor-pointer bg-transparent shrink-0" />
                  <input type="text" x-model="$store.settings.designerForm.secondaryColor"
                    class="form-input text-xs flex-1 bg-black/70 border-white/15 focus:border-pink-500 rounded-lg p-2 font-mono uppercase" />
                </div>
              </div>

              <!-- 3. Color Terciario -->
              <div class="space-y-1">
                <label class="block text-[11px] font-bold text-amber-400 font-mono">3. Terciario</label>
                <div class="flex items-center gap-2">
                  <input type="color" x-model="$store.settings.designerForm.tertiaryColor"
                    class="w-8 h-8 rounded-lg border border-white/20 cursor-pointer bg-transparent shrink-0" />
                  <input type="text" x-model="$store.settings.designerForm.tertiaryColor"
                    class="form-input text-xs flex-1 bg-black/70 border-white/15 focus:border-amber-500 rounded-lg p-2 font-mono uppercase" />
                </div>
              </div>

              <!-- 4. Resplandor / Glow -->
              <div class="space-y-1">
                <label class="block text-[11px] font-bold text-cyan-300 font-mono">4. Resplandor (Glow)</label>
                <div class="flex items-center gap-2">
                  <input type="color" x-model="$store.settings.designerForm.glowColor"
                    class="w-8 h-8 rounded-lg border border-white/20 cursor-pointer bg-transparent shrink-0" />
                  <input type="text" x-model="$store.settings.designerForm.glowColor"
                    class="form-input text-xs flex-1 bg-black/70 border-white/15 focus:border-cyan-400 rounded-lg p-2 font-mono uppercase" />
                </div>
              </div>

              <!-- 5. Fondo / Superficie de Paneles -->
              <div class="space-y-1">
                <label class="block text-[11px] font-bold text-slate-300 font-mono">5. Paneles / Superficie</label>
                <div class="flex items-center gap-2">
                  <input type="color" x-model="$store.settings.designerForm.surfaceColor"
                    class="w-8 h-8 rounded-lg border border-white/20 cursor-pointer bg-transparent shrink-0" />
                  <input type="text" x-model="$store.settings.designerForm.surfaceColor"
                    class="form-input text-xs flex-1 bg-black/70 border-white/15 focus:border-slate-400 rounded-lg p-2 font-mono uppercase" />
                </div>
              </div>

              <!-- 6. Bordes / Contornos -->
              <div class="space-y-1">
                <label class="block text-[11px] font-bold text-slate-400 font-mono">6. Bordes / Contornos</label>
                <div class="flex items-center gap-2">
                  <input type="color" x-model="$store.settings.designerForm.borderColor"
                    class="w-8 h-8 rounded-lg border border-white/20 cursor-pointer bg-transparent shrink-0" />
                  <input type="text" x-model="$store.settings.designerForm.borderColor"
                    class="form-input text-xs flex-1 bg-black/70 border-white/15 focus:border-slate-500 rounded-lg p-2 font-mono uppercase" />
                </div>
              </div>
            </div>
          </div>

          <!-- Jerarquía Tipográfica (5 Niveles) -->
          <div class="space-y-3 p-3.5 rounded-xl bg-black/50 border border-white/10">
            <div class="flex items-center justify-between border-b border-white/10 pb-1.5">
              <span class="text-xs font-bold text-parchment-cream uppercase tracking-wider font-mono flex items-center gap-1.5">
                <i data-lucide="type" class="w-3.5 h-3.5 text-accent-cyan"></i>
                Jerarquía Tipográfica (5 Niveles)
              </span>
              <span class="text-[10px] text-ink-slate font-mono">Google Fonts dinámico</span>
            </div>

            <!-- 1. Fuentes Display -->
            <div class="space-y-1">
              <div class="flex items-center justify-between gap-2">
                <label class="text-[11px] font-bold text-accent-cyan uppercase tracking-wider font-mono">1. Títulos / Display</label>
                <div class="flex items-center gap-2">
                  <span class="text-[10px] text-ink-slate font-normal">Encabezados principales</span>
                  <select x-model="$store.settings.designerForm.fontWeightDisplay" aria-label="Peso tipográfico Display"
                    class="bg-black/80 border border-white/15 rounded px-1.5 py-0.5 text-[10px] font-mono text-white cursor-pointer">
                    <option value="300">300</option><option value="400">400</option><option value="500">500</option><option value="600">600</option><option value="700">700</option><option value="800">800</option><option value="900">900</option>
                  </select>
                </div>
              </div>
              <input type="text" x-model="$store.settings.designerForm.fontDisplay" placeholder="Ej: Orbitron"
                class="form-input text-xs w-full bg-black/70 border-white/15 focus:border-accent-cyan rounded-lg p-2 font-mono text-white" />
              <div class="flex flex-wrap gap-1 pt-0.5">
                <template x-for="f in ['Orbitron', 'Cinzel', 'Teko', 'Rajdhani', 'Share Tech Mono', 'Barlow Condensed']" :key="f">
                  <button type="button" @click="$store.settings.designerForm.fontDisplay = f"
                    class="text-[9px] px-2 py-0.5 rounded bg-white/5 hover:bg-accent-cyan/20 hover:text-accent-cyan border border-white/10 text-ink-slate transition-all cursor-pointer">
                    <span x-text="f"></span>
                  </button>
                </template>
              </div>
            </div>

            <!-- 2. Fuentes HUD -->
            <div class="space-y-1">
              <div class="flex items-center justify-between gap-2">
                <label class="text-[11px] font-bold text-purple-400 uppercase tracking-wider font-mono">2. HUD / Métricas</label>
                <div class="flex items-center gap-2">
                  <span class="text-[10px] text-ink-slate font-normal">Estadísticas y barras</span>
                  <select x-model="$store.settings.designerForm.fontWeightHud" aria-label="Peso tipográfico HUD"
                    class="bg-black/80 border border-white/15 rounded px-1.5 py-0.5 text-[10px] font-mono text-white cursor-pointer">
                    <option value="300">300</option><option value="400">400</option><option value="500">500</option><option value="600">600</option><option value="700">700</option><option value="800">800</option><option value="900">900</option>
                  </select>
                </div>
              </div>
              <input type="text" x-model="$store.settings.designerForm.fontHud" placeholder="Ej: Chakra Petch"
                class="form-input text-xs w-full bg-black/70 border-white/15 focus:border-purple-500 rounded-lg p-2 font-mono text-white" />
              <div class="flex flex-wrap gap-1 pt-0.5">
                <template x-for="f in ['Chakra Petch', 'Rajdhani', 'Titillium Web', 'Orbitron', 'Exo 2', 'Inter Tight']" :key="f">
                  <button type="button" @click="$store.settings.designerForm.fontHud = f"
                    class="text-[9px] px-2 py-0.5 rounded bg-white/5 hover:bg-purple-500/20 hover:text-purple-300 border border-white/10 text-ink-slate transition-all cursor-pointer">
                    <span x-text="f"></span>
                  </button>
                </template>
              </div>
            </div>

            <!-- 3. Fuentes Body -->
            <div class="space-y-1">
              <div class="flex items-center justify-between gap-2">
                <label class="text-[11px] font-bold text-emerald-400 uppercase tracking-wider font-mono">3. Texto de Cuerpo / Body</label>
                <div class="flex items-center gap-2">
                  <span class="text-[10px] text-ink-slate font-normal">Descripciones y párrafos</span>
                  <select x-model="$store.settings.designerForm.fontWeightBody" aria-label="Peso tipográfico Body"
                    class="bg-black/80 border border-white/15 rounded px-1.5 py-0.5 text-[10px] font-mono text-white cursor-pointer">
                    <option value="300">300</option><option value="400">400</option><option value="500">500</option><option value="600">600</option><option value="700">700</option><option value="800">800</option>
                  </select>
                </div>
              </div>
              <input type="text" x-model="$store.settings.designerForm.fontBody" placeholder="Ej: Inter Tight"
                class="form-input text-xs w-full bg-black/70 border-white/15 focus:border-emerald-500 rounded-lg p-2 font-mono text-white" />
              <div class="flex flex-wrap gap-1 pt-0.5">
                <template x-for="f in ['Inter Tight', 'Inter', 'EB Garamond', 'Roboto', 'Montserrat', 'Open Sans']" :key="f">
                  <button type="button" @click="$store.settings.designerForm.fontBody = f"
                    class="text-[9px] px-2 py-0.5 rounded bg-white/5 hover:bg-emerald-500/20 hover:text-emerald-400 border border-white/10 text-ink-slate transition-all cursor-pointer">
                    <span x-text="f"></span>
                  </button>
                </template>
              </div>
            </div>

            <!-- 4. Fuentes Input -->
            <div class="space-y-1">
              <div class="flex items-center justify-between gap-2">
                <label class="text-[11px] font-bold text-amber-400 uppercase tracking-wider font-mono">4. Campos de Entrada / Monospace</label>
                <div class="flex items-center gap-2">
                  <span class="text-[10px] text-ink-slate font-normal">Inputs numéricos y código</span>
                  <select x-model="$store.settings.designerForm.fontWeightInput" aria-label="Peso tipográfico Inputs"
                    class="bg-black/80 border border-white/15 rounded px-1.5 py-0.5 text-[10px] font-mono text-white cursor-pointer">
                    <option value="300">300</option><option value="400">400</option><option value="500">500</option><option value="600">600</option><option value="700">700</option>
                  </select>
                </div>
              </div>
              <input type="text" x-model="$store.settings.designerForm.fontInput" placeholder="Ej: JetBrains Mono"
                class="form-input text-xs w-full bg-black/70 border-white/15 focus:border-amber-500 rounded-lg p-2 font-mono text-white" />
              <div class="flex flex-wrap gap-1 pt-0.5">
                <template x-for="f in ['JetBrains Mono', 'Fira Code', 'Share Tech Mono', 'Space Mono', 'Source Code Pro']" :key="f">
                  <button type="button" @click="$store.settings.designerForm.fontInput = f"
                    class="text-[9px] px-2 py-0.5 rounded bg-white/5 hover:bg-amber-500/20 hover:text-amber-400 border border-white/10 text-ink-slate transition-all cursor-pointer">
                    <span x-text="f"></span>
                  </button>
                </template>
              </div>
            </div>

            <!-- 5. Fuentes Tier List -->
            <div class="space-y-1">
              <div class="flex items-center justify-between gap-2">
                <label class="text-[11px] font-bold text-rose-400 uppercase tracking-wider font-mono">5. Tier List / Insignias</label>
                <div class="flex items-center gap-2">
                  <span class="text-[10px] text-ink-slate font-normal">Filas S/A/B/C/D</span>
                  <select x-model="$store.settings.designerForm.fontWeightTierlist" aria-label="Peso tipográfico Tier List"
                    class="bg-black/80 border border-white/15 rounded px-1.5 py-0.5 text-[10px] font-mono text-white cursor-pointer">
                    <option value="400">400</option><option value="500">500</option><option value="600">600</option><option value="700">700</option><option value="800">800</option><option value="900">900</option>
                  </select>
                </div>
              </div>
              <input type="text" x-model="$store.settings.designerForm.fontTierlist" placeholder="Ej: Barlow Condensed"
                class="form-input text-xs w-full bg-black/70 border-white/15 focus:border-rose-500 rounded-lg p-2 font-mono text-white" />
              <div class="flex flex-wrap gap-1 pt-0.5">
                <template x-for="f in ['Barlow Condensed', 'Teko', 'Orbitron', 'Cinzel', 'Rajdhani']" :key="f">
                  <button type="button" @click="$store.settings.designerForm.fontTierlist = f"
                    class="text-[9px] px-2 py-0.5 rounded bg-white/5 hover:bg-rose-500/20 hover:text-rose-400 border border-white/10 text-ink-slate transition-all cursor-pointer">
                    <span x-text="f"></span>
                  </button>
                </template>
              </div>
            </div>
          </div>

          <!-- Estructura y Geometría Visual -->
          <div class="space-y-4 p-4 rounded-xl bg-black/50 border border-white/10">
            <div class="flex items-center justify-between border-b border-white/10 pb-2">
              <span class="text-xs font-bold text-parchment-cream uppercase tracking-wider font-mono flex items-center gap-2">
                <i data-lucide="layout-grid" class="w-4 h-4" :style="'color: ' + ($store.settings.designerForm.color || '#00F0FF')"></i>
                Geometría de Esquinas, Bordes y Efectos
              </span>
              <span class="text-[10px] text-ink-slate font-mono">Bordes y espaciado global</span>
            </div>

            <!-- 1. Geometría de Esquinas (3 botones amplios sin truncate) -->
            <div class="space-y-1.5">
              <div class="flex items-center justify-between">
                <label class="block text-xs font-bold text-parchment-cream uppercase tracking-wider font-mono">Geometría de Esquinas</label>
                <span class="text-[10px] text-ink-slate font-mono font-medium"
                  x-text="$store.settings.designerForm.cornerStyle === 'chamfer' ? 'Biselado Sci-Fi' : ($store.settings.designerForm.cornerStyle === 'sharp' ? 'Angular Recto 90°' : 'Curvo Suave Moderno')"></span>
              </div>
              <div class="grid grid-cols-3 gap-2 bg-black/70 p-1.5 rounded-xl border border-white/10">
                <button type="button" @click="$store.settings.designerForm.cornerStyle = 'chamfer'"
                  :class="$store.settings.designerForm.cornerStyle === 'chamfer' ? 'font-bold shadow-md' : 'text-ink-slate hover:text-white border-transparent'"
                  :style="$store.settings.designerForm.cornerStyle === 'chamfer' ? ('border: 1px solid ' + ($store.settings.designerForm.color || '#00F0FF') + '; background: ' + ($store.settings.designerForm.color || '#00F0FF') + '25; color: ' + ($store.settings.designerForm.color || '#00F0FF')) : 'border: 1px solid transparent;'"
                  class="py-2.5 px-3 rounded-lg border text-xs font-mono transition-all text-center cursor-pointer whitespace-nowrap flex items-center justify-center gap-1.5"
                  title="Bisel Triangular Sci-Fi (Chamfer)">
                  <span class="text-xs">◆</span>
                  <span>Bisel</span>
                </button>
                <button type="button" @click="$store.settings.designerForm.cornerStyle = 'sharp'"
                  :class="$store.settings.designerForm.cornerStyle === 'sharp' ? 'font-bold shadow-md' : 'text-ink-slate hover:text-white border-transparent'"
                  :style="$store.settings.designerForm.cornerStyle === 'sharp' ? ('border: 1px solid ' + ($store.settings.designerForm.color || '#00F0FF') + '; background: ' + ($store.settings.designerForm.color || '#00F0FF') + '25; color: ' + ($store.settings.designerForm.color || '#00F0FF')) : 'border: 1px solid transparent;'"
                  class="py-2.5 px-3 rounded-lg border text-xs font-mono transition-all text-center cursor-pointer whitespace-nowrap flex items-center justify-center gap-1.5"
                  title="Angular Recto (90° Sharp)">
                  <span class="text-xs">◼</span>
                  <span>Recto</span>
                </button>
                <button type="button" @click="$store.settings.designerForm.cornerStyle = 'rounded'"
                  :class="$store.settings.designerForm.cornerStyle === 'rounded' ? 'font-bold shadow-md' : 'text-ink-slate hover:text-white border-transparent'"
                  :style="$store.settings.designerForm.cornerStyle === 'rounded' ? ('border: 1px solid ' + ($store.settings.designerForm.color || '#00F0FF') + '; background: ' + ($store.settings.designerForm.color || '#00F0FF') + '25; color: ' + ($store.settings.designerForm.color || '#00F0FF')) : 'border: 1px solid transparent;'"
                  class="py-2.5 px-3 rounded-lg border text-xs font-mono transition-all text-center cursor-pointer whitespace-nowrap flex items-center justify-center gap-1.5"
                  title="Curvo Suave (Redondeado)">
                  <span class="text-xs">●</span>
                  <span>Curvo</span>
                </button>
              </div>
            </div>

            <!-- 2. Grosor de Bordes (1px..5px) -->
            <div class="space-y-1.5 pt-1">
              <div class="flex items-center justify-between">
                <label class="block text-xs font-bold text-parchment-cream uppercase tracking-wider font-mono">Grosor de Bordes</label>
                <span class="text-xs font-mono font-bold text-accent-cyan"
                  x-text="($store.settings.designerForm.borderWidth || 1) + ' px'"></span>
              </div>
              <input type="range" min="1" max="5" step="1" x-model.number="$store.settings.designerForm.borderWidth"
                aria-label="Grosor de bordes del kit"
                class="w-full accent-cyan-400 cursor-pointer" />
            </div>

            <!-- 3. Densidad Visual (3 botones amplios sin truncate) -->
            <div class="space-y-1.5 pt-1">
              <div class="flex items-center justify-between">
                <label class="block text-xs font-bold text-parchment-cream uppercase tracking-wider font-mono">Densidad Visual</label>
                <span class="text-[10px] text-ink-slate font-mono font-medium"
                  x-text="$store.settings.designerForm.density === 'compact' ? 'Máximo espacio de trabajo' : ($store.settings.designerForm.density === 'normal' ? 'Densidad estándar balanceada' : 'Espaciado amplio y aireado')"></span>
              </div>
              <div class="grid grid-cols-3 gap-2 bg-black/70 p-1.5 rounded-xl border border-white/10">
                <button type="button" @click="$store.settings.designerForm.density = 'compact'"
                  :class="$store.settings.designerForm.density === 'compact' ? 'font-bold shadow-md' : 'text-ink-slate hover:text-white border-transparent'"
                  :style="$store.settings.designerForm.density === 'compact' ? ('border: 1px solid ' + ($store.settings.designerForm.color || '#00F0FF') + '; background: ' + ($store.settings.designerForm.color || '#00F0FF') + '25; color: ' + ($store.settings.designerForm.color || '#00F0FF')) : 'border: 1px solid transparent;'"
                  class="py-2.5 px-3 rounded-lg border text-xs font-mono transition-all text-center cursor-pointer whitespace-nowrap flex items-center justify-center gap-1.5"
                  title="Compacta: Mayor densidad y máximo espacio de trabajo">
                  <span>Compacta</span>
                </button>
                <button type="button" @click="$store.settings.designerForm.density = 'normal'"
                  :class="$store.settings.designerForm.density === 'normal' ? 'font-bold shadow-md' : 'text-ink-slate hover:text-white border-transparent'"
                  :style="$store.settings.designerForm.density === 'normal' ? ('border: 1px solid ' + ($store.settings.designerForm.color || '#00F0FF') + '; background: ' + ($store.settings.designerForm.color || '#00F0FF') + '25; color: ' + ($store.settings.designerForm.color || '#00F0FF')) : 'border: 1px solid transparent;'"
                  class="py-2.5 px-3 rounded-lg border text-xs font-mono transition-all text-center cursor-pointer whitespace-nowrap flex items-center justify-center gap-1.5"
                  title="Normal: Densidad balanceada">
                  <span>Normal</span>
                </button>
                <button type="button" @click="$store.settings.designerForm.density = 'comfortable'"
                  :class="$store.settings.designerForm.density === 'comfortable' ? 'font-bold shadow-md' : 'text-ink-slate hover:text-white border-transparent'"
                  :style="$store.settings.designerForm.density === 'comfortable' ? ('border: 1px solid ' + ($store.settings.designerForm.color || '#00F0FF') + '; background: ' + ($store.settings.designerForm.color || '#00F0FF') + '25; color: ' + ($store.settings.designerForm.color || '#00F0FF')) : 'border: 1px solid transparent;'"
                  class="py-2.5 px-3 rounded-lg border text-xs font-mono transition-all text-center cursor-pointer whitespace-nowrap flex items-center justify-center gap-1.5"
                  title="Cómoda: Espaciado amplio y relajado">
                  <span>Cómoda</span>
                </button>
              </div>
            </div>

            <!-- 4. Modo de Resplandor (Glow Mode) + Preferencias -->
            <div class="space-y-2 pt-1">
              <label class="block text-xs font-bold text-parchment-cream uppercase tracking-wider font-mono">Modo de Resplandor (Glow)</label>
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-1.5 bg-black/70 p-1.5 rounded-xl border border-white/10">
                <template x-for="gm in [{ id: 'auto', label: 'Auto' }, { id: 'custom', label: 'Manual' }, { id: 'match-primary', label: 'Primario' }, { id: 'none', label: 'Nulo' }]" :key="gm.id">
                  <button type="button" @click="$store.settings.designerForm.glowMode = gm.id"
                    :class="$store.settings.designerForm.glowMode === gm.id ? 'font-bold shadow-md' : 'text-ink-slate hover:text-white border-transparent'"
                    :style="$store.settings.designerForm.glowMode === gm.id ? ('border: 1px solid ' + ($store.settings.designerForm.color || '#00F0FF') + '; background: ' + ($store.settings.designerForm.color || '#00F0FF') + '25; color: ' + ($store.settings.designerForm.color || '#00F0FF')) : 'border: 1px solid transparent;'"
                    class="py-1.5 px-2 rounded-lg border text-[11px] font-mono transition-all text-center cursor-pointer"
                    x-text="gm.label"></button>
                </template>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <label class="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-black/60 border border-white/10 cursor-pointer">
                  <span class="text-[11px] font-mono text-parchment-cream">Desactivar Glow en este kit</span>
                  <input type="checkbox" x-model="$store.settings.designerForm.disableGlowEffects" class="accent-cyan-400 w-4 h-4 cursor-pointer" />
                </label>
                <label class="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-black/60 border border-white/10 cursor-pointer">
                  <span class="text-[11px] font-mono text-parchment-cream">Ignorar colores personalizados</span>
                  <input type="checkbox" x-model="$store.settings.designerForm.disableCustomColors" class="accent-cyan-400 w-4 h-4 cursor-pointer" />
                </label>
              </div>
            </div>
          </div>
        </div>

        <!-- Live Preview Column (5 cols) -->
        <div class="lg:col-span-5 flex flex-col space-y-3"
          x-data="{ get contrast() { return $store.settings.getDesignerContrastInfo(); } }">
          <label
            class="block text-xs font-bold text-accent-cyan uppercase tracking-wider font-mono flex items-center justify-between">
            <span class="flex items-center gap-1.5">
              <i data-lucide="eye" class="w-4 h-4"></i> Vista Previa en Vivo (HUD)
            </span>
            <span class="text-[10px] text-ink-slate font-normal">Reactivo en tiempo real</span>
          </label>

          <!-- Tarjeta de Vista Previa -->
          <div
            class="flex-1 flex flex-col justify-between space-y-4 shadow-2xl relative overflow-hidden transition-all"
            :style="
              'background-color: ' + ($store.settings.designerForm.disableCustomColors ? '#080a0d' : ($store.settings.designerForm.surfaceColor || '#080a0d')) + '; ' +
              'border-style: solid; ' +
              'border-width: ' + ($store.settings.designerForm.borderWidth || 1) + 'px; ' +
              'border-color: ' + ($store.settings.designerForm.disableCustomColors ? '#222A36' : ($store.settings.designerForm.borderColor || $store.settings.designerForm.color || '#00F0FF')) + '; ' +
              'border-radius: ' + ($store.settings.designerForm.cornerStyle === 'rounded' ? '14px' : '0px') + '; ' +
              'clip-path: ' + ($store.settings.designerForm.cornerStyle === 'chamfer' ? 'polygon(12px 0, calc(100% - 12px) 0, 100% 12px, 100% calc(100% - 12px), calc(100% - 12px) 100%, 12px 100%, 0 calc(100% - 12px), 0 12px)' : 'none') + '; ' +
              'padding: ' + ($store.settings.designerForm.density === 'compact' ? '12px' : ($store.settings.designerForm.density === 'comfortable' ? '22px' : '16px')) + '; ' +
              'box-shadow: ' + (($store.settings.designerForm.disableGlowEffects || $store.settings.designerForm.glowMode === 'none') ? 'none' : ('0 0 24px ' + ($store.settings.designerForm.glowMode === 'match-primary' ? ($store.settings.designerForm.color || '#00F0FF') : ($store.settings.designerForm.glowColor || $store.settings.designerForm.color || '#00F0FF')) + '35')) + ';'
            ">

            <div class="space-y-3.5">
              <!-- Preview Header -->
              <div class="flex items-center justify-between border-b pb-2.5"
                :style="'border-color: ' + ($store.settings.designerForm.borderColor || 'rgba(255,255,255,0.15)')">
                <span class="text-[10px] font-mono font-extrabold uppercase px-2 py-0.5 tracking-wider shadow-sm"
                  :style="'background-color: ' + ($store.settings.designerForm.color || '#00F0FF') + '20; color: ' + ($store.settings.designerForm.color || '#00F0FF') + '; border: ' + ($store.settings.designerForm.borderWidth || 1) + 'px solid ' + ($store.settings.designerForm.color || '#00F0FF') + '50; border-radius: ' + ($store.settings.designerForm.cornerStyle === 'rounded' ? '6px' : '0px') + ';'"
                  x-text="$store.settings.designerForm.name || 'VISTA PREVIA'"></span>

                <!-- 6 Swatches Live Preview -->
                <div class="flex items-center gap-1 bg-black/60 px-2 py-1 border border-white/10 shadow-inner"
                  :style="'border-radius: ' + ($store.settings.designerForm.cornerStyle === 'rounded' ? '8px' : '0px')">
                  <span class="w-3 h-3 rounded-full border border-white/30" data-protect-circle data-protect-radius :style="'background-color: ' + ($store.settings.designerForm.color || '#00F0FF')" title="Primario"></span>
                  <span class="w-3 h-3 rounded-full border border-white/30" data-protect-circle data-protect-radius :style="'background-color: ' + ($store.settings.designerForm.secondaryColor || '#FF0077')" title="Secundario"></span>
                  <span class="w-3 h-3 rounded-full border border-white/30" data-protect-circle data-protect-radius :style="'background-color: ' + ($store.settings.designerForm.tertiaryColor || '#D4AF37')" title="Terciario"></span>
                  <span class="w-3 h-3 rounded-full border border-white/30" data-protect-circle data-protect-radius :style="'background-color: ' + ($store.settings.designerForm.glowColor || '#00F0FF')" title="Resplandor"></span>
                  <span class="w-3 h-3 rounded-full border border-white/30" data-protect-circle data-protect-radius :style="'background-color: ' + ($store.settings.designerForm.surfaceColor || '#0A0D14')" title="Superficie"></span>
                  <span class="w-3 h-3 rounded-full border border-white/30" data-protect-circle data-protect-radius :style="'background-color: ' + ($store.settings.designerForm.borderColor || '#222A36')" title="Borde"></span>
                </div>
              </div>

              <!-- Display Title -->
              <div>
                <span class="text-[9px] text-ink-slate font-mono uppercase">Display Title:</span>
                <h4 class="text-xl truncate leading-tight mt-0.5 tracking-wide"
                  :style="'font-family: \\'' + ($store.settings.designerForm.fontDisplay || 'Orbitron') + '\\', sans-serif; font-weight: ' + ($store.settings.designerForm.fontWeightDisplay || '700') + '; color: ' + ($store.settings.designerForm.color || '#00F0FF')"
                  x-text="$store.settings.designerForm.name || 'Operativo Sombra'"></h4>
              </div>

              <!-- HUD Badge y Metrics -->
              <div>
                <span class="text-[9px] text-ink-slate font-mono uppercase">HUD y Métricas:</span>
                <div class="flex items-center gap-2 mt-0.5">
                  <span class="px-2.5 py-1 text-xs uppercase tracking-wider shadow-sm"
                    :style="'font-family: \\'' + ($store.settings.designerForm.fontHud || 'Chakra Petch') + '\\', sans-serif; font-weight: ' + ($store.settings.designerForm.fontWeightHud || '700') + '; color: ' + ($store.settings.designerForm.secondaryColor || '#FF0077') + '; border: ' + ($store.settings.designerForm.borderWidth || 1) + 'px solid ' + ($store.settings.designerForm.secondaryColor || '#FF0077') + '50; background: ' + ($store.settings.designerForm.secondaryColor || '#FF0077') + '15; border-radius: ' + ($store.settings.designerForm.cornerStyle === 'rounded' ? '8px' : '0px') + ';'">
                    [HP: 100% // LVL 45]
                  </span>
                  <!-- Tier List Badge Sample -->
                  <span class="px-2 py-0.5 text-[11px] uppercase"
                    :style="'font-family: \\'' + ($store.settings.designerForm.fontTierlist || 'Barlow Condensed') + '\\', sans-serif; font-weight: ' + ($store.settings.designerForm.fontWeightTierlist || '800') + '; color: ' + ($store.settings.designerForm.tertiaryColor || '#D4AF37') + '; border: ' + ($store.settings.designerForm.borderWidth || 1) + 'px solid ' + ($store.settings.designerForm.tertiaryColor || '#D4AF37') + '50; background: ' + ($store.settings.designerForm.tertiaryColor || '#D4AF37') + '15; border-radius: ' + ($store.settings.designerForm.cornerStyle === 'rounded' ? '5px' : '0px') + ';'">
                    TIER S
                  </span>
                </div>
              </div>

              <!-- Body Paragraph -->
              <div>
                <span class="text-[9px] text-ink-slate font-mono uppercase">Texto de Cuerpo / Body:</span>
                <p class="text-xs leading-relaxed mt-0.5"
                  :style="'font-family: \\'' + ($store.settings.designerForm.fontBody || 'Inter Tight') + '\\', sans-serif; font-weight: ' + ($store.settings.designerForm.fontWeightBody || '400') + '; color: ' + (contrast.surfaceIsLight ? '#181b20' : '#f3efe6')">
                  Especialista en combate y exploración. Este kit temático define la identidad visual para fichas y tarjetas.
                </p>
              </div>

              <!-- Input Monospace Sample -->
              <div>
                <span class="text-[9px] text-ink-slate font-mono uppercase">Campos / Monospace:</span>
                <div
                  class="p-2.5 bg-black/60 text-[11px] font-mono truncate"
                  :style="'font-family: \\'' + ($store.settings.designerForm.fontInput || 'JetBrains Mono') + '\\', monospace; font-weight: ' + ($store.settings.designerForm.fontWeightInput || '500') + '; border: ' + ($store.settings.designerForm.borderWidth || 1) + 'px solid ' + ($store.settings.designerForm.borderColor || '#222A36') + '; border-radius: ' + ($store.settings.designerForm.cornerStyle === 'rounded' ? '8px' : '0px') + '; color: ' + ($store.settings.designerForm.color || '#00F0FF')">
                  &gt; STATUS_OK: PROTOCOL_99 ACTIVE [2026]
                </div>
              </div>
            </div>

            <div class="pt-2 border-t flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono"
              :style="'border-color: ' + ($store.settings.designerForm.borderColor || 'rgba(255,255,255,0.15)')">
              <span class="text-ink-slate">Borde: <strong class="text-white uppercase"
                  x-text="($store.settings.designerForm.borderWidth || 1) + 'px ' + ($store.settings.designerForm.cornerStyle || 'rounded')"></strong></span>
              <span class="text-ink-slate">Densidad: <strong class="text-white uppercase"
                  x-text="$store.settings.designerForm.density"></strong></span>
              <span class="font-bold"
                :class="contrast.ok ? 'text-emerald-400' : (contrast.warn ? 'text-amber-400' : 'text-rose-400')"
                x-text="(contrast.ok ? '✓ ' : '⚠ ') + contrast.label"></span>
            </div>
          </div>
        </div>

      </div>

      <!-- Footer Buttons -->
      <div class="px-5 py-3.5 bg-[#050608] border-t border-accent-cyan/20 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <button type="button" @click="$store.settings.closeDesigner()"
          class="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-parchment-cream text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer">
          Cancelar
        </button>

        <div class="flex items-center gap-2.5">
          <button type="button" @click="$store.settings.saveDesignerKit(false)"
            class="px-4 py-2 rounded-xl bg-white/10 border border-white/20 hover:bg-white/20 text-white text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer">
            Guardar en Mis Kits
          </button>

          <button type="button" @click="$store.settings.saveDesignerKit(true)"
            class="px-5 py-2 rounded-xl bg-accent-cyan border border-accent-cyan text-black hover:bg-accent-cyan/80 text-xs font-mono font-extrabold uppercase tracking-wider transition-all shadow-lg shadow-accent-cyan/20 flex items-center gap-1.5 cursor-pointer">
            <i data-lucide="check" class="w-4 h-4"></i> Guardar y Aplicar Ahora
          </button>
        </div>
      </div>

    </div>
    </template>
  </div>

  <!-- ==============================================================
     2. THEME EXPORT MODAL — Exportación de Código / Archivo
     ============================================================== -->
  <div id="theme-export-modal" class="modal-backdrop z-[999992] p-3 sm:p-6" x-show="$store.settings.showExportKitModal"
    x-cloak x-data x-transition:enter="transition ease-out duration-200" x-transition:enter-start="opacity-0 scale-95"
    x-transition:enter-end="opacity-100 scale-100" x-transition:leave="transition ease-in duration-150"
    x-transition:leave-start="opacity-100 scale-100" x-transition:leave-end="opacity-0 scale-95"
    @keydown.escape.window="$store.settings.closeExportKit()" role="dialog" aria-modal="true">
    <div class="absolute inset-0 bg-black/80 backdrop-blur-md" @click="$store.settings.closeExportKit()"></div>

    <!-- Modal Dialog Window (Render diferido bajo demanda) -->
    <template x-if="$store.settings.showExportKitModal">
    <div
      data-protect-contrast="true" class="modal-box relative w-full max-w-xl bg-[#080a0d] border-2 border-accent-cyan/50 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-parchment-cream">

      <!-- Topbar Header -->
      <div class="px-5 py-3.5 bg-[#050608] border-b border-accent-cyan/30 flex items-center justify-between shrink-0">
        <div class="flex items-center gap-3">
          <div class="p-2 rounded-xl bg-accent-cyan/10 border border-accent-cyan/40 text-accent-cyan">
            <i data-lucide="share-2" class="w-5 h-5"></i>
          </div>
          <div>
            <h3
              class="font-title text-base text-accent-cyan font-bold uppercase tracking-wider flex items-center gap-2">
              Exportar Kit de Tema
            </h3>
            <span class="text-[10px] text-ink-slate font-mono uppercase tracking-widest"
              x-text="$store.settings.exportKitData?.name || 'Tema'"></span>
          </div>
        </div>

        <button type="button" @click="$store.settings.closeExportKit()"
          class="p-1 rounded-lg bg-black/50 text-ink-slate hover:text-white hover:bg-white/10 border border-white/10 transition-all cursor-pointer">
          <i data-lucide="x" class="w-4 h-4"></i>
        </button>
      </div>

      <!-- Main Body -->
      <div class="p-5 space-y-4 font-mono text-xs bg-[#080a0d]">
        <p class="text-parchment-cream/90 leading-relaxed font-sans">
          Copia el código hash Base64 o descarga el archivo <strong
            class="text-accent-cyan">.tacticaltheme.json</strong> para compartir tu configuración estética con otros
          usuarios:
        </p>

        <!-- Serialized String Textarea -->
        <div class="space-y-1">
          <label class="block text-[10px] text-ink-slate font-mono uppercase">Código de Exportación:</label>
          <textarea readonly x-model="$store.settings.exportKitString" @click="$el.select()"
            class="form-textarea text-xs w-full h-28 bg-black/80 border-parchment-brown/30 rounded-xl p-3 font-mono text-accent-cyan select-all focus:border-accent-cyan custom-scrollbar resize-none"></textarea>
        </div>
      </div>

      <!-- Footer Buttons -->
      <div
        class="px-5 py-3.5 bg-[#050608] border-t border-accent-cyan/20 flex flex-wrap items-center justify-between gap-2 shrink-0">
        <button type="button" @click="$store.settings.closeExportKit()"
          class="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-parchment-cream text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer">
          Cerrar
        </button>

        <div class="flex items-center gap-2">
          <button type="button" @click="$store.settings.copyExportString()"
            class="px-4 py-2 rounded-xl bg-accent-cyan/20 border border-accent-cyan/60 hover:bg-accent-cyan hover:text-black text-accent-cyan text-xs font-mono font-bold uppercase tracking-wider transition-all shadow-md flex items-center gap-1.5 cursor-pointer">
            <i data-lucide="copy" class="w-4 h-4"></i> Copiar Código
          </button>

          <button type="button" @click="$store.settings.downloadExportFile()"
            class="px-4 py-2 rounded-xl bg-amber-500/20 border border-amber-500/60 hover:bg-amber-500 hover:text-black text-amber-400 text-xs font-mono font-bold uppercase tracking-wider transition-all shadow-md flex items-center gap-1.5 cursor-pointer">
            <i data-lucide="download" class="w-4 h-4"></i> Descargar JSON
          </button>
        </div>
      </div>

    </div>
    </template>
  </div>

  <!-- ==============================================================
     3. THEME IMPORT MODAL — Importación de Código / Archivo Drag y Drop
     ============================================================== -->
  <div id="theme-import-modal" class="modal-backdrop z-[999994] p-3 sm:p-6" x-show="$store.settings.showImportKitModal"
    x-cloak x-data x-transition:enter="transition ease-out duration-200" x-transition:enter-start="opacity-0 scale-95"
    x-transition:enter-end="opacity-100 scale-100" x-transition:leave="transition ease-in duration-150"
    x-transition:leave-start="opacity-100 scale-100" x-transition:leave-end="opacity-0 scale-95"
    @keydown.escape.window="$store.settings.closeImportKitModal()" role="dialog" aria-modal="true">
    <div class="absolute inset-0 bg-black/80 backdrop-blur-md" @click="$store.settings.closeImportKitModal()"></div>

    <!-- Modal Dialog Window (Render diferido bajo demanda) -->
    <template x-if="$store.settings.showImportKitModal">
    <div
      data-protect-contrast="true" class="modal-box relative w-full max-w-xl bg-[#080a0d] border-2 border-amber-500/50 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-parchment-cream">

      <!-- Topbar Header -->
      <div class="px-5 py-3.5 bg-[#050608] border-b border-amber-500/30 flex items-center justify-between shrink-0">
        <div class="flex items-center gap-3">
          <div class="p-2 rounded-xl bg-amber-500/10 border border-amber-500/40 text-amber-400">
            <i data-lucide="download-cloud" class="w-5 h-5"></i>
          </div>
          <div>
            <h3 class="font-title text-base text-amber-400 font-bold uppercase tracking-wider flex items-center gap-2">
              Importar Kit de Tema
            </h3>
            <span class="text-[10px] text-ink-slate font-mono uppercase tracking-widest">Ingresa un código hash o
              sube
              un archivo .json</span>
          </div>
        </div>

        <button type="button" @click="$store.settings.closeImportKitModal()"
          class="p-1 rounded-lg bg-black/50 text-ink-slate hover:text-white hover:bg-white/10 border border-white/10 transition-all cursor-pointer">
          <i data-lucide="x" class="w-4 h-4"></i>
        </button>
      </div>

      <!-- Main Body -->
      <div class="p-5 space-y-4 font-mono text-xs bg-[#080a0d]">

        <!-- Pegar Código -->
        <div class="space-y-1.5">
          <label class="block text-xs font-bold text-amber-400 uppercase tracking-wider font-mono">1. Pegar Código
            String / Base64:</label>
          <textarea x-model="$store.settings.importKitInput"
            placeholder="Pega aquí el código TACTICAL-THEME::... o el JSON completo"
            class="form-textarea text-xs w-full h-28 bg-black/80 border-parchment-brown/30 rounded-xl p-3 font-mono text-white focus:border-amber-500 custom-scrollbar resize-none"></textarea>
        </div>

        <div class="flex items-center gap-3 text-ink-slate text-[10px] font-mono">
          <div class="h-px bg-white/10 flex-1"></div>
          <span>O SUBIR ARCHIVO</span>
          <div class="h-px bg-white/10 flex-1"></div>
        </div>

        <!-- Subir Archivo Drag y Drop -->
        <div class="space-y-1.5">
          <label class="block text-xs font-bold text-parchment-cream uppercase tracking-wider font-mono">2.
            Seleccionar
            Archivo (.json):</label>
          <label
            class="p-4 rounded-xl border-2 border-dashed border-parchment-brown/40 hover:border-amber-500/70 bg-black/40 hover:bg-amber-500/5 text-center block cursor-pointer transition-all">
            <i data-lucide="upload-cloud" class="w-6 h-6 text-amber-400 mx-auto mb-1"></i>
            <span class="text-xs text-parchment-cream font-bold block">Hacer clic para buscar archivo
              .tacticaltheme.json</span>
            <span class="text-[10px] text-ink-slate">Formatos soportados: .json, .tacticaltheme.json</span>
            <input type="file" accept=".json,.tacticaltheme.json" @change="$store.settings.processImportKitFile($event)"
              class="hidden" />
          </label>
        </div>

      </div>

      <!-- Footer Buttons -->
      <div class="px-5 py-3.5 bg-[#050608] border-t border-amber-500/20 flex items-center justify-between shrink-0">
        <button type="button" @click="$store.settings.closeImportKitModal()"
          class="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-parchment-cream text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer">
          Cancelar
        </button>

        <button type="button" @click="$store.settings.importKitFromString()"
          class="px-5 py-2 rounded-xl bg-amber-500 border border-amber-500 text-black hover:bg-amber-400 text-xs font-mono font-extrabold uppercase tracking-wider transition-all shadow-lg shadow-amber-500/20 flex items-center gap-1.5 cursor-pointer">
          <i data-lucide="download" class="w-4 h-4"></i> Procesar e Importar Kit
        </button>
      </div>

    </div>
    </template>
  </div>
`;
}
