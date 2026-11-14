/**
 * @file src/ui/modals/modalCreateCustomTab.ts
 */

export function renderModalCreateCustomTab(): string {
  return `<!-- ==============================================================
     MODAL: Creador y Configurador de Sección Personalizada
     ============================================================== -->
<div id="modal-create-custom-tab" x-data class="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6"
  x-show="$store.characters.customTabModalOpen" x-cloak
  @keydown.escape.window="$store.characters.closeCustomTabModal()"
  role="dialog" aria-modal="true">

  <!-- Backdrop con desenfoque de cristal -->
  <div class="fixed inset-0 bg-black/85 backdrop-blur-md transition-opacity"
    x-show="$store.characters.customTabModalOpen"
    x-transition:enter="ease-out duration-200"
    x-transition:enter-start="opacity-0"
    x-transition:enter-end="opacity-100"
    x-transition:leave="ease-in duration-150"
    x-transition:leave-start="opacity-100"
    x-transition:leave-end="opacity-0"
    @click="$store.characters.closeCustomTabModal()"></div>

  <!-- Contenedor del Modal (Renderizado dinámico con template x-if) -->
  <template x-if="$store.characters.customTabModalOpen">
    <div data-protect-contrast="true" class="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl border border-accent-primary/40 bg-ink-dark/95 p-6 shadow-2xl shadow-black/95 backdrop-blur-xl transition-all space-y-6"
      x-init="$nextTick(() => window.lucide?.createIcons?.())"
      x-transition:enter="ease-out duration-200"
      x-transition:enter-start="opacity-0 scale-95 translate-y-4"
      x-transition:enter-end="opacity-100 scale-100 translate-y-0"
      x-transition:leave="ease-in duration-150"
      x-transition:leave-start="opacity-100 scale-100 translate-y-0"
      x-transition:leave-end="opacity-0 scale-95 translate-y-4">

      <!-- Encabezado del Modal -->
      <div class="flex items-center justify-between border-b border-white/10 pb-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 transition-colors"
            :style="\`background-color: \${($store.characters.customTabForm.accentColor || 'var(--accent, #00F0FF)') + '20'}; border-color: \${($store.characters.customTabForm.accentColor || 'var(--accent, #00F0FF)') + '60'};\`">
            <i :data-lucide="$store.characters.customTabForm.icon || 'layers'" class="w-5 h-5"
              :style="\`color: \${$store.characters.customTabForm.accentColor || 'var(--accent, #00F0FF)'};\`"></i>
          </div>
          <div>
            <h3 class="text-base font-bold text-parchment-cream font-mono tracking-wide"
              x-text="$store.characters.customTabEditingId ? 'Configurar Sección' : 'Nueva Sección Personalizada'"></h3>
            <p class="text-xs text-text-muted">Crea una pestaña independiente para esta ficha</p>
          </div>
        </div>
        <button type="button" @click="$store.characters.closeCustomTabModal()"
          class="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer">
          <i data-lucide="x" class="w-5 h-5"></i>
        </button>
      </div>

      <!-- Cartel de Advertencia: Mecánica en Fase Beta -->
      <div class="p-3.5 rounded-xl bg-amber-500/15 border border-amber-500/40 flex items-start gap-3 text-amber-200 shadow-inner">
        <i data-lucide="alert-triangle" class="w-5 h-5 text-amber-400 shrink-0 mt-0.5"></i>
        <div class="text-xs space-y-1">
          <p class="font-bold text-amber-300 font-mono uppercase tracking-wider text-[11px] flex items-center gap-2">
            <span>Aviso: Mecánica en Fase Beta</span>
            <span class="px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/50 text-[9px]">EXPERIMENTAL</span>
          </p>
          <p class="text-amber-200/90 leading-relaxed font-sans text-xs">
            Esta mecánica está en fase beta y es muy propensa a fallar, bugearse, verse mal visualmente o directamente romperse en caso de ser usada. Te recomendamos proceder con precaución y mantener respaldos de tus fichas.
          </p>
        </div>
      </div>

      <!-- Formulario -->
      <form @submit.prevent="$store.characters.saveCustomTabModal()" class="space-y-5">

        <!-- Nombre de la Sección -->
        <div class="space-y-1.5">
          <label class="block text-xs font-mono font-bold uppercase tracking-wider text-parchment-cream">
            Nombre de la Sección <span class="text-rose-400">*</span>
          </label>
          <input type="text" x-model="$store.characters.customTabForm.label"
            placeholder="Ej: Grimorio de Hechizos, Implantes, Vehículo, Mascotas..."
            required autofocus
            class="w-full px-3.5 py-2.5 rounded-xl border border-white/15 bg-black/40 text-sm text-parchment-cream placeholder-slate-500 focus:outline-none focus:border-accent-primary transition-colors font-sans">
        </div>

        <!-- Descripción / Lema -->
        <div class="space-y-1.5">
          <label class="block text-xs font-mono font-bold uppercase tracking-wider text-parchment-cream">
            Descripción o Lema (Opcional)
          </label>
          <input type="text" x-model="$store.characters.customTabForm.description"
            placeholder="Ej: Fórmulas arcanas y conjuros del pacto antiguo"
            class="w-full px-3.5 py-2.5 rounded-xl border border-white/15 bg-black/40 text-xs text-parchment-cream placeholder-slate-500 focus:outline-none focus:border-accent-primary transition-colors font-mono">
        </div>

        <!-- Selector de Ícono -->
        <div class="space-y-2">
          <label class="block text-xs font-mono font-bold uppercase tracking-wider text-parchment-cream">
            Ícono Representativo
          </label>
          <div class="grid grid-cols-7 sm:grid-cols-9 gap-2 p-3 rounded-xl border border-white/10 bg-black/40 max-h-36 overflow-y-auto custom-scrollbar"
            x-data="{
              icons: [
                'sparkles', 'sword', 'shield', 'book-open', 'bot', 'flame', 'skull', 'gem', 'zap',
                'compass', 'layers', 'heart', 'crosshair', 'target', 'dna', 'crown', 'coins',
                'package', 'scroll-text', 'map-pin', 'boxes', 'eye', 'ghost', 'bomb', 'clover',
                'gamepad-2', 'palette', 'briefcase', 'dice-5', 'trophy', 'coffee', 'activity', 'clapperboard'
              ]
            }">
            <template x-for="ic in icons" :key="ic">
              <button type="button"
                @click="$store.characters.customTabForm.icon = ic; $nextTick(() => window.lucide?.createIcons())"
                class="w-9 h-9 rounded-lg flex items-center justify-center border transition-all cursor-pointer"
                :class="$store.characters.customTabForm.icon === ic
                  ? 'bg-accent-primary/25 border-accent-primary shadow-sm scale-105'
                  : 'border-white/10 bg-white/5 hover:bg-white/15 hover:border-white/20 text-slate-400 hover:text-white'">
                <i :data-lucide="ic" class="w-4.5 h-4.5"
                  :class="$store.characters.customTabForm.icon === ic ? 'text-accent-primary' : ''"></i>
              </button>
            </template>
          </div>
        </div>

        <!-- Color de Acento Temático con Cyber HUD Selector -->
        <div class="space-y-2 relative"
          x-data="cyberColorPicker({
            label: 'Color de Sección',
            defaultColor: '#00F0FF',
            value: () => $store.characters.customTabForm.accentColor,
            onSelect: (c) => { $store.characters.customTabForm.accentColor = c; }
          })">
          <div class="flex items-center justify-between">
            <label class="block text-xs font-mono font-bold uppercase tracking-wider text-parchment-cream">
              Color de Acento Distintivo
            </label>
            <button type="button" @click="toggle()"
              class="text-[11px] font-mono font-bold text-accent-cyan hover:underline cursor-pointer flex items-center gap-1">
              <i data-lucide="palette" class="w-3 h-3"></i>
              <span>Selector Personalizado</span>
            </button>
          </div>

          <div class="flex items-center gap-2.5 flex-wrap p-2.5 rounded-xl border border-white/10 bg-black/40">
            <!-- Botón Trigger Cyber HUD -->
            <button type="button" @click="toggle()" data-protect-circle data-protect-radius
              class="w-7 h-7 rounded-full border-2 transition-transform cursor-pointer flex items-center justify-center shrink-0 relative overflow-hidden group shadow-md"
              :style="\`background-color: \${currentHex}; border-color: \${$store.characters.customTabForm.accentColor === currentHex ? '#ffffff' : 'rgba(255,255,255,0.4)'};\`"
              title="Abrir selector de color Cyber HUD">
              <i data-lucide="palette" class="w-3.5 h-3.5 text-white drop-shadow"></i>
            </button>

            <!-- Muestras Rápidas -->
            <template x-for="sw in [
              { label: 'Tema Global', color: '' },
              { label: 'Cyan Neón', color: '#00F0FF' },
              { label: 'Púrpura Arcano', color: '#A855F7' },
              { label: 'Oro Legendario', color: '#F59E0B' },
              { label: 'Rubí Carmesí', color: '#EF4444' },
              { label: 'Esmeralda', color: '#10B981' },
              { label: 'Rosa Neón', color: '#F43F5E' },
              { label: 'Azul Zafiro', color: '#3B82F6' },
              { label: 'Platino', color: '#E2E8F0' }
            ]" :key="sw.label">
              <button type="button" @click="$store.characters.customTabForm.accentColor = sw.color; if (sw.color) setFromHex(sw.color, true);"
                :title="sw.label"
                data-protect-circle data-protect-radius class="w-7 h-7 rounded-full border-2 transition-transform cursor-pointer flex items-center justify-center shrink-0"
                :class="$store.characters.customTabForm.accentColor === sw.color ? 'scale-125 border-white shadow-md ring-2 ring-white/40' : 'border-transparent hover:scale-110'"
                :style="\`background-color: \${sw.color || 'var(--accent, #00F0FF)'};\`">
                <span x-show="!sw.color" class="text-[9px] font-bold text-black font-mono">G</span>
              </button>
            </template>
          </div>

          <!-- POPOVER CYBER HUD DEL SELECTOR PROFESIONAL -->
          <div x-show="isOpen"
            x-cloak
            @click.outside="close()"
            @keydown.escape.window="close()"
            x-transition:enter="transition cubic-bezier(0.16, 1, 0.3, 1) duration-200"
            x-transition:enter-start="opacity-0 translate-y-2 scale-95"
            x-transition:enter-end="opacity-100 translate-y-0 scale-100"
            x-transition:leave="transition cubic-bezier(0.16, 1, 0.3, 1) duration-150"
            x-transition:leave-start="opacity-100 translate-y-0 scale-100"
            x-transition:leave-end="opacity-0 translate-y-2 scale-95"
            class="absolute top-full left-0 mt-2 z-[999999] p-3.5 rounded-2xl flex flex-col gap-2.5 transition-all w-72 bg-[#0b0e14]/98 backdrop-blur-xl border border-white/20 shadow-[0_24px_60px_rgba(0,0,0,0.98),0_0_20px_rgba(0,0,0,0.8)]">

            <!-- Encabezado con muestra actual, título y botón Quitar -->
            <div class="flex items-center justify-between gap-2 pb-2 border-b border-white/10">
              <div class="flex items-center gap-2">
                <span class="w-6 h-6 rounded-full border border-white/60 shadow-inner shrink-0" :style="\`background-color: \${currentHex};\`"></span>
                <span class="text-xs font-semibold text-white tracking-wide font-sans" x-text="label"></span>
              </div>
              <button type="button" @click="resetColor()"
                class="text-[11px] font-medium font-sans text-white/70 hover:text-white px-2.5 py-0.5 rounded-md bg-white/5 hover:bg-white/15 border border-white/15 transition-colors cursor-pointer"
                title="Restablecer color">Quitar</button>
            </div>

            <!-- Cuadro 2D: Saturación y Brillo (SV Box) -->
            <div class="w-full h-28 rounded-lg relative overflow-hidden cursor-crosshair border border-white/20 select-none touch-none"
              :style="\`background-color: hsl(\${h}, 100%, 50%); background-image: linear-gradient(to bottom, transparent, #000000), linear-gradient(to right, #ffffff, transparent);\`"
              @pointerdown="handleSvPointerDown($event)">
              <div class="absolute w-4 h-4 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.9),0_0_4px_rgba(0,0,0,0.8)] -translate-x-1/2 -translate-y-1/2 pointer-events-none bg-transparent"
                :style="\`left: \${s}%; top: \${100 - v}%;\`"></div>
            </div>

            <!-- Barra Horizontal: Hue (Tono 0 - 360°) -->
            <div class="flex flex-col gap-1">
              <div class="flex items-center justify-between text-[10px] text-white/50 font-mono">
                <span>Tono</span>
                <span x-text="\`\${h}°\`"></span>
              </div>
              <div class="w-full h-3.5 rounded-full relative cursor-pointer border border-black/70 select-none touch-none"
                style="background: linear-gradient(to right, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%);"
                @pointerdown="handleHuePointerDown($event)">
                <div class="absolute top-1/2 -translate-y-1/2 w-4.5 h-4.5 rounded-full bg-white border border-black/80 shadow-[0_0_4px_rgba(0,0,0,0.8)] -translate-x-1/2 pointer-events-none"
                  :style="\`left: \${(h / 360) * 100}%;\`"></div>
              </div>
            </div>

            <!-- Fila de Inputs Multimodo (HEX / RGB / HSL) con Pipeta y selector de formato -->
            <div class="flex items-center gap-1.5 p-1 rounded-xl bg-[#06080d] border border-white/15">
              <!-- Modo HEX -->
              <div x-show="mode === 'hex'" class="flex-1 flex items-center gap-1.5 px-2">
                <span class="text-[10px] font-mono font-bold text-amber-400 select-none">HEX</span>
                <input type="text" class="w-full px-1.5 py-0.5 rounded bg-transparent border-none text-xs font-mono font-bold text-white focus:outline-none text-center"
                  maxlength="7"
                  x-model="hexInput"
                  @input="onHexInput($event)"
                  @keydown.enter.prevent="applyColor()"
                  spellcheck="false" />
              </div>

              <!-- Modo RGB -->
              <div x-show="mode === 'rgb'" class="flex-1 flex items-center justify-between gap-1 px-1">
                <div class="flex flex-col items-center flex-1">
                  <input type="number" min="0" max="255" class="w-full px-1 py-0.5 rounded bg-white/10 border border-white/15 text-xs font-mono font-bold text-white text-center focus:border-amber-400 focus:outline-none"
                    x-model.number="rgbR" @input="onRgbInput()" @keydown.enter.prevent="applyColor()" />
                  <span class="text-[9px] font-mono text-white/50 mt-0.5 select-none">R</span>
                </div>
                <div class="flex flex-col items-center flex-1">
                  <input type="number" min="0" max="255" class="w-full px-1 py-0.5 rounded bg-white/10 border border-white/15 text-xs font-mono font-bold text-white text-center focus:border-amber-400 focus:outline-none"
                    x-model.number="rgbG" @input="onRgbInput()" @keydown.enter.prevent="applyColor()" />
                  <span class="text-[9px] font-mono text-white/50 mt-0.5 select-none">G</span>
                </div>
                <div class="flex flex-col items-center flex-1">
                  <input type="number" min="0" max="255" class="w-full px-1 py-0.5 rounded bg-white/10 border border-white/15 text-xs font-mono font-bold text-white text-center focus:border-amber-400 focus:outline-none"
                    x-model.number="rgbB" @input="onRgbInput()" @keydown.enter.prevent="applyColor()" />
                  <span class="text-[9px] font-mono text-white/50 mt-0.5 select-none">B</span>
                </div>
              </div>

              <!-- Modo HSL -->
              <div x-show="mode === 'hsl'" class="flex-1 flex items-center justify-between gap-1 px-1">
                <div class="flex flex-col items-center flex-1">
                  <input type="number" min="0" max="360" class="w-full px-1 py-0.5 rounded bg-white/10 border border-white/15 text-xs font-mono font-bold text-white text-center focus:border-amber-400 focus:outline-none"
                    x-model.number="hslH" @input="onHslInput()" @keydown.enter.prevent="applyColor()" />
                  <span class="text-[9px] font-mono text-white/50 mt-0.5 select-none">H°</span>
                </div>
                <div class="flex flex-col items-center flex-1">
                  <input type="number" min="0" max="100" class="w-full px-1 py-0.5 rounded bg-white/10 border border-white/15 text-xs font-mono font-bold text-white text-center focus:border-amber-400 focus:outline-none"
                    x-model.number="hslS" @input="onHslInput()" @keydown.enter.prevent="applyColor()" />
                  <span class="text-[9px] font-mono text-white/50 mt-0.5 select-none">S%</span>
                </div>
                <div class="flex flex-col items-center flex-1">
                  <input type="number" min="0" max="100" class="w-full px-1 py-0.5 rounded bg-white/10 border border-white/15 text-xs font-mono font-bold text-white text-center focus:border-amber-400 focus:outline-none"
                    x-model.number="hslL" @input="onHslInput()" @keydown.enter.prevent="applyColor()" />
                  <span class="text-[9px] font-mono text-white/50 mt-0.5 select-none">L%</span>
                </div>
              </div>

              <!-- Botón Pipeta -->
              <button type="button" @click="pickWithEyeDropper()"
                class="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                title="Cuentagotas (Capturar color)">
                <i data-lucide="pipette" class="w-3.5 h-3.5"></i>
              </button>

              <!-- Botón Copiar -->
              <button type="button" @click="copyColor()"
                class="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                title="Copiar código HEX">
                <i data-lucide="copy" class="w-3.5 h-3.5"></i>
              </button>

              <!-- Botón Alternar Formato -->
              <button type="button" @click="cycleMode()"
                class="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                title="Cambiar formato (HEX / RGB / HSL)">
                <i data-lucide="chevrons-up-down" class="w-3.5 h-3.5"></i>
              </button>
            </div>

            <!-- Muestras Rápidas -->
            <div class="grid grid-cols-6 gap-1.5 pt-0.5">
              <template x-for="sw in swatches" :key="sw.color || sw">
                <button type="button" @click="setFromHex(sw.color || sw, true)"
                  class="h-6 rounded-md border border-white/20 hover:scale-105 transition-transform"
                  :style="\`background-color: \${sw.color || sw};\`"
                  :title="sw.title || sw"></button>
              </template>
            </div>

            <!-- Botón Aplicar Color -->
            <button type="button" @click="applyColor()"
              class="w-full py-2.5 rounded-xl text-xs font-bold font-serif uppercase tracking-wider text-amber-300 border border-amber-500/60 bg-amber-950/40 hover:bg-amber-900/50 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg">
              <i data-lucide="check" class="w-4 h-4"></i>
              <span>APLICAR COLOR</span>
            </button>
          </div>
        </div>

        <!-- Plantilla Inicial (Solo en modo creación) -->
        <template x-if="!$store.characters.customTabEditingId">
          <div class="space-y-2">
            <label class="block text-xs font-mono font-bold uppercase tracking-wider text-parchment-cream">
              Estructura Inicial
            </label>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <!-- En Blanco -->
              <button type="button" @click="$store.characters.customTabForm.template = 'blank'"
                class="p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5"
                :class="$store.characters.customTabForm.template === 'blank'
                  ? 'border-accent-primary bg-accent-primary/15 text-white ring-1 ring-accent-primary/40'
                  : 'border-white/10 bg-white/5 hover:bg-white/10 text-slate-400'">
                <div class="flex items-center gap-2 font-mono text-xs font-bold text-parchment-cream">
                  <i data-lucide="layers" class="w-4 h-4 text-accent-cyan"></i>
                  <span>En Blanco</span>
                </div>
                <p class="text-[10px] text-text-muted">Sección vacía lista para añadir tus propios bloques.</p>
              </button>

              <!-- Colección de Tarjetas -->
              <button type="button" @click="$store.characters.customTabForm.template = 'cards'"
                class="p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5"
                :class="$store.characters.customTabForm.template === 'cards'
                  ? 'border-accent-primary bg-accent-primary/15 text-white ring-1 ring-accent-primary/40'
                  : 'border-white/10 bg-white/5 hover:bg-white/10 text-slate-400'">
                <div class="flex items-center gap-2 font-mono text-xs font-bold text-parchment-cream">
                  <i data-lucide="boxes" class="w-4 h-4 text-accent-gold"></i>
                  <span>Tarjetas</span>
                </div>
                <p class="text-[10px] text-text-muted">Lista de entradas para hechizos, artefactos o técnicas.</p>
              </button>

              <!-- Atributos y Recursos -->
              <button type="button" @click="$store.characters.customTabForm.template = 'attributes'"
                class="p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5"
                :class="$store.characters.customTabForm.template === 'attributes'
                  ? 'border-accent-primary bg-accent-primary/15 text-white ring-1 ring-accent-primary/40'
                  : 'border-white/10 bg-white/5 hover:bg-white/10 text-slate-400'">
                <div class="flex items-center gap-2 font-mono text-xs font-bold text-parchment-cream">
                  <i data-lucide="gauge" class="w-4 h-4 text-purple-400"></i>
                  <span>Atributos</span>
                </div>
                <p class="text-[10px] text-text-muted">Parámetros numéricos con barras de progreso y +/-.</p>
              </button>
            </div>
          </div>
        </template>

        <!-- Botones de Acción -->
        <div class="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
          <button type="button" @click="$store.characters.closeCustomTabModal()"
            class="px-4 py-2.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-xs font-mono font-bold text-slate-300 transition-colors cursor-pointer">
            CANCELAR
          </button>
          <button type="submit"
            class="header-btn-accent px-5 py-2.5 rounded-xl font-mono text-xs font-bold flex items-center gap-2 shadow-lg cursor-pointer">
            <i :data-lucide="$store.characters.customTabEditingId ? 'check' : 'plus'" class="w-4 h-4"></i>
            <span x-text="$store.characters.customTabEditingId ? 'GUARDAR CAMBIOS' : 'CREAR SECCIÓN'"></span>
          </button>
        </div>

      </form>
    </div>
  </template>
</div>
`;
}
