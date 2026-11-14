/**
 * @file src/ui/modals/modalFolders.ts
 */

export function renderModalFolders(): string {
  return `<!-- ==============================================================
       MODAL DE CREACIÓN / EDICIÓN DE CARPETA DE PERSONAJES
       ============================================================== -->
  <div id="folder-config-modal" x-data x-show="$store.characters.folderModalOpen" x-cloak
    class="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto custom-scrollbar"
    x-transition:enter="transition ease-out duration-300" x-transition:enter-start="opacity-0"
    x-transition:enter-end="opacity-100" x-transition:leave="transition ease-in duration-200"
    x-transition:leave-start="opacity-100" x-transition:leave-end="opacity-0"
    @keydown.escape.window="if (!$store.app.showCropper) $store.characters.closeFolderModal()"
    @click.self="if (!$store.app.showCropper) $store.characters.closeFolderModal()"
    role="dialog" aria-modal="true"
    aria-labelledby="folder-modal-title">

    <!-- Modal Dialog Window (Render diferido bajo demanda) -->
    <template x-if="$store.characters.folderModalOpen">
    <div
      data-protect-contrast="true" class="modal-box relative w-full max-w-md max-h-[92vh] flex flex-col my-auto bg-[#0a0d12] border-2 rounded-2xl p-5 sm:p-6 text-parchment-cream overflow-visible transition-all shadow-2xl z-10"
      :style="\`border-color: \${$store.settings.borderColor || $store.app.hexToRgba($store.settings.accentColor, 0.45)}; box-shadow: \${$store.settings.disableGlowEffects ? '0 16px 40px rgba(0,0,0,0.85)' : \`0 0 50px \${$store.app.hexToRgba($store.settings.glowColor || $store.settings.accentColor, 0.28)}, 0 16px 40px rgba(0,0,0,0.85)\`};\`"
      @click.stop>

      <!-- Glow ambient light recortado según configuración de usuario -->
      <div class="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none" x-show="!$store.settings.disableGlowEffects">
        <div class="absolute -top-20 -right-20 w-40 h-40 rounded-full blur-3xl"
          :style="\`background-color: \${$store.app.hexToRgba($store.settings.glowColor || $store.settings.accentColor, 0.15)};\`"></div>
      </div>

      <!-- Header del Modal (Fijado) -->
      <div class="shrink-0 flex items-center justify-between border-b border-white/10 pb-3.5">
        <div class="flex items-center gap-2.5">
          <div
            class="category-header-icon-box w-9 h-9 rounded-xl flex items-center justify-center overflow-hidden transition-all"
            :style="\`background-color: \${$store.app.hexToRgba($store.settings.accentColor, 0.15)}; border: 1px solid \${$store.app.hexToRgba($store.settings.accentColor, 0.4)}; color: \${$store.settings.accentColor}; box-shadow: \${$store.settings.disableGlowEffects ? 'none' : \`0 0 12px \${$store.app.hexToRgba($store.settings.glowColor || $store.settings.accentColor, 0.35)}\`};\`">
            <template x-if="$store.characters.folderForm.customLogo">
              <img :src="$store.characters.folderForm.customLogo" class="w-full h-full"
                :style="$store.characters.getFolderLogoStyle($store.characters.folderForm)" alt="" />
            </template>
            <template x-if="!$store.characters.folderForm.customLogo">
              <span class="w-5 h-5 flex items-center justify-center"
                x-html="$store.characters.renderFolderIconSvg($store.characters.folderForm.icon, 'w-5 h-5', $store.characters.folderForm.color || $store.settings.accentColor || '#00F0FF')"></span>
            </template>
          </div>
          <div>
            <h2 id="folder-modal-title" class="font-hud font-bold text-base text-white tracking-wide uppercase"
              x-text="$store.characters.folderModalMode === 'create' ? 'NUEVA CARPETA' : 'EDITAR CARPETA'">
            </h2>
            <p class="text-[11px] font-mono text-ink-slate">Organización y clasificación de fichas</p>
          </div>
        </div>
        <button type="button" @click="$store.characters.closeFolderModal()"
          class="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors cursor-pointer">
          <i data-lucide="x" class="w-4 h-4"></i>
        </button>
      </div>

      <!-- Formulario de Carpeta (Cuerpo scrollable) -->
      <div class="flex-1 overflow-y-auto overflow-x-visible custom-scrollbar space-y-4 py-3 pr-1.5 -mr-1.5">

        <!-- Nombre de la Carpeta -->
        <div class="space-y-1.5">
          <label class="block text-xs font-mono text-slate-300 font-bold uppercase tracking-wider">
            Nombre de la Carpeta:
          </label>
          <input type="text" id="folder-name-input"
            class="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/20 text-white font-sans text-sm tracking-wide placeholder:text-slate-500 focus:outline-none shadow-inner normal-case transition-all"
            :style="\`border-color: \${$store.settings.borderColor ? $store.app.hexToRgba($store.settings.borderColor, 0.5) : 'rgba(255,255,255,0.2)'};\`"
            placeholder="Ej: Campaña Cyberpunk, Villanos, Protagonistas..." x-model="$store.characters.folderForm.name"
            @keydown.enter="$store.characters.saveFolderForm()" />
        </div>

        <!-- Selector de Ícono / Logo Personalizado (Imágenes y GIFs) -->
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <label class="block text-xs font-mono text-slate-300 font-bold uppercase tracking-wider">
              Ícono o Logo:
            </label>
            <!-- Botón Subir Imagen / Logo -->
            <label
              class="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/15 border border-white/20 text-[11px] font-mono transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
              :style="\`color: \${$store.settings.accentColor};\`">
              <i data-lucide="image-plus" class="w-3.5 h-3.5"></i>
              <span x-text="$store.characters.folderForm.customLogo ? 'Cambiar Logo / GIF' : 'Subir Logo / GIF'"></span>
              <input type="file" accept="image/*,.gif,.png,.jpg,.jpeg,.webp,.svg" class="hidden"
                @change="$store.characters.uploadFolderLogo($event)" />
            </label>
          </div>

          <!-- Si el usuario ha subido un logo o GIF propio con Encuadre Visual Libre (Cropper) -->
          <template x-if="$store.characters.folderForm.customLogo">
            <div class="p-3 bg-black/40 rounded-xl space-y-3 shadow-inner"
              :style="\`border: 1px solid \${$store.app.hexToRgba($store.settings.accentColor, 0.35)};\`">
              <div class="flex items-center justify-between gap-3">
                <div class="flex items-center gap-3">
                  <!-- Visualizador de Encuadre Cuadrado -->
                  <div
                    class="w-14 h-14 min-w-[56px] min-h-[56px] rounded-xl bg-black/80 overflow-hidden flex items-center justify-center shadow-lg relative"
                    :style="\`border: 2px solid \${$store.app.hexToRgba($store.settings.accentColor, 0.6)};\`">
                    <img :src="$store.characters.folderForm.customLogo" class="w-full h-full"
                      :style="$store.characters.getFolderLogoStyle($store.characters.folderForm)" alt="" />
                  </div>
                  <div>
                    <span class="text-xs font-bold text-white block">Logo / GIF Asignado</span>
                    <span class="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                      <i data-lucide="check-circle" class="w-3 h-3"></i> Encuadre visual activo
                    </span>
                  </div>
                </div>

                <div class="flex items-center gap-1.5 flex-wrap justify-end">
                  <button type="button" @click="$store.characters.openFolderLogoCropper()"
                    class="px-2.5 py-1.5 rounded-lg border text-white text-[11px] font-mono transition-all cursor-pointer flex items-center gap-1 shadow-sm hover:scale-[1.02]"
                    :style="\`background-color: \${$store.app.hexToRgba($store.settings.accentColor, 0.2)}; border-color: \${$store.app.hexToRgba($store.settings.accentColor, 0.5)}; color: \${$store.settings.accentColor};\`"
                    title="Mover, rotar 90°, espejar horizontal/vertical y hacer zoom libremente">
                    <i data-lucide="crop" class="w-3.5 h-3.5"></i>
                    <span>Encuadrar</span>
                  </button>
                  <label
                    class="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/15 text-slate-300 hover:text-white text-[11px] font-mono transition-colors cursor-pointer flex items-center gap-1"
                    title="Cargar otra imagen o GIF">
                    <i data-lucide="upload" class="w-3 h-3"></i>
                    <span>Cambiar</span>
                    <input type="file" accept="image/*,.gif,.png,.jpg,.jpeg,.webp,.svg" class="hidden"
                      @change="$store.characters.uploadFolderLogo($event)" />
                  </label>
                  <button type="button" @click="$store.characters.removeFolderLogo()"
                    class="px-2 py-1.5 rounded-lg bg-red-500/15 hover:bg-red-500/25 border border-red-500/40 text-red-400 hover:text-red-300 text-[11px] font-mono transition-colors cursor-pointer flex items-center gap-1"
                    title="Quitar este logo personalizado">
                    <i data-lucide="trash-2" class="w-3 h-3"></i>
                  </button>
                </div>
              </div>

              <!-- Pistas de Controles Visuales (Estilo Cyberpunk HUD) -->
              <div class="pt-2 border-t border-white/10 flex items-center justify-between text-[10px] font-mono text-ink-slate">
                <span class="flex items-center gap-1">
                  <i data-lucide="sparkles" class="w-3 h-3 text-accent-gold"></i>
                  <span>Sistema de recorte visual activo</span>
                </span>
                <span class="text-slate-400">Rotar · Espejo · Zoom · Paneo</span>
              </div>
            </div>
          </template>

          <!-- Si usa ícono del catálogo Lucide (Renderizado SVG puro para evitar duplicados) -->
          <template x-if="!$store.characters.folderForm.customLogo">
            <div
              class="grid grid-cols-5 sm:grid-cols-10 gap-1.5 p-2 bg-black/40 border border-white/10 rounded-xl max-h-36 overflow-y-auto custom-scrollbar">
              <template x-for="iconName in $store.characters.folderIconsCatalog" :key="iconName">
                <button type="button"
                  class="p-2 rounded-lg flex items-center justify-center transition-all cursor-pointer border"
                  :class="$store.characters.folderForm.icon === iconName ? 'scale-105' : 'border-transparent text-slate-400 hover:text-white hover:bg-white/5'"
                  :style="$store.characters.folderForm.icon === iconName ? \`background-color: \${$store.app.hexToRgba($store.settings.accentColor, 0.25)}; border-color: \${$store.settings.accentColor}; box-shadow: \${$store.settings.disableGlowEffects ? 'none' : \`0 0 10px \${$store.app.hexToRgba($store.settings.glowColor || $store.settings.accentColor, 0.35)}\`}; color: #ffffff;\` : ''"
                  @click="$store.characters.folderForm.icon = iconName" :title="iconName">
                  <span class="w-4 h-4 flex items-center justify-center pointer-events-none"
                    x-html="$store.characters.renderFolderIconSvg(iconName, 'w-4 h-4')"></span>
                </button>
              </template>
            </div>
          </template>
        </div>

        <!-- Selector de Color / Acento con Cyber Color Picker HUD -->
        <div class="space-y-1.5 relative"
          x-data="cyberColorPicker({
            label: 'Color de Carpeta',
            defaultColor: $store.settings.accentColor || '#00F0FF',
            value: () => $store.characters.folderForm.color,
            onSelect: (c) => { $store.characters.folderForm.color = c; },
            swatches: $store.characters.folderColorsCatalog
          })"
          x-init="$watch('currentHex', (c) => { if (isOpen && c) $store.characters.folderForm.color = c; })">
          <div class="flex items-center justify-between">
            <label class="block text-xs font-mono text-slate-300 font-bold uppercase tracking-wider">
              Color de Acento:
            </label>
            <button type="button" @click="toggle()"
              class="text-[11px] font-mono font-bold hover:underline cursor-pointer flex items-center gap-1"
              :style="\`color: \${$store.settings.accentColor};\`">
              <i data-lucide="palette" class="w-3 h-3"></i>
              <span>Selector Cyber HUD</span>
            </button>
          </div>

          <div class="flex items-center gap-2 flex-wrap p-2 bg-black/40 border border-white/10 rounded-xl relative">
            <template x-for="colorHex in $store.characters.folderColorsCatalog" :key="colorHex">
              <button type="button" data-protect-circle data-protect-radius
                class="w-7 h-7 rounded-full border-2 transition-all cursor-pointer relative flex items-center justify-center shrink-0"
                :style="\`background-color: \${colorHex}; border-color: \${$store.characters.folderForm.color === colorHex ? '#ffffff' : 'transparent'}; transform: \${$store.characters.folderForm.color === colorHex ? 'scale(1.15)' : 'scale(1)'}; box-shadow: \${$store.characters.folderForm.color === colorHex && !$store.settings.disableGlowEffects ? '0 0 10px ' + colorHex : 'none'};\`"
                @click="$store.characters.folderForm.color = colorHex; setFromHex(colorHex, true)" :title="colorHex">
                <i x-show="$store.characters.folderForm.color === colorHex" data-lucide="check"
                  class="w-3.5 h-3.5 text-black stroke-[3]"></i>
              </button>
            </template>

            <!-- Botón Pipeta Cyber HUD (Reemplaza el selector nativo blanco de Windows) -->
            <button type="button" @click="toggle()" data-protect-circle data-protect-radius
              class="w-7 h-7 rounded-full border border-dashed flex items-center justify-center cursor-pointer transition-all hover:scale-110 active:scale-95 shadow-sm"
              :style="\`border-color: \${$store.app.hexToRgba($store.settings.accentColor, 0.6)}; background-color: \${$store.app.hexToRgba($store.settings.accentColor, 0.12)}; color: \${$store.settings.accentColor};\`"
              :class="!$store.characters.folderColorsCatalog.includes($store.characters.folderForm.color) ? 'ring-2 border-white' : ''"
              title="Abrir selector de color Cyber HUD">
              <i data-lucide="pipette" class="w-3.5 h-3.5"></i>
            </button>
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
            class="absolute bottom-full right-0 mb-2 z-[999999] p-3.5 rounded-2xl flex flex-col gap-2.5 transition-all w-72 bg-[#0b0e14]/98 backdrop-blur-xl border border-white/20 shadow-2xl"
            :style="\`border-color: \${$store.app.hexToRgba($store.settings.borderColor || $store.settings.accentColor, 0.4)}; box-shadow: \${$store.settings.disableGlowEffects ? '0 24px 60px rgba(0,0,0,0.98)' : \`0 0 25px \${$store.app.hexToRgba($store.settings.glowColor || $store.settings.accentColor, 0.3)}, 0 24px 60px rgba(0,0,0,0.98)\`};\`">

            <!-- Encabezado con muestra actual, título y botón Reset -->
            <div class="flex items-center justify-between gap-2 pb-2 border-b border-white/10">
              <div class="flex items-center gap-2">
                <span class="w-6 h-6 rounded-full border border-white/60 shadow-inner shrink-0" :style="\`background-color: \${currentHex};\`"></span>
                <span class="text-xs font-semibold text-white tracking-wide font-sans" x-text="label"></span>
              </div>
              <button type="button" @click="resetColor()"
                class="text-[11px] font-medium font-sans text-white/70 hover:text-white px-2.5 py-0.5 rounded-md bg-white/5 hover:bg-white/15 border border-white/15 transition-colors cursor-pointer"
                title="Restablecer color por defecto">Reset</button>
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
                <span class="text-[10px] font-mono font-bold select-none" :style="\`color: \${$store.settings.accentColor};\`">HEX</span>
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
                  <input type="number" min="0" max="255" class="w-full px-1 py-0.5 rounded bg-white/10 border border-white/15 text-xs font-mono font-bold text-white text-center focus:outline-none"
                    x-model.number="rgbR" @input="onRgbInput()" @keydown.enter.prevent="applyColor()" />
                  <span class="text-[9px] font-mono text-white/50 mt-0.5 select-none">R</span>
                </div>
                <div class="flex flex-col items-center flex-1">
                  <input type="number" min="0" max="255" class="w-full px-1 py-0.5 rounded bg-white/10 border border-white/15 text-xs font-mono font-bold text-white text-center focus:outline-none"
                    x-model.number="rgbG" @input="onRgbInput()" @keydown.enter.prevent="applyColor()" />
                  <span class="text-[9px] font-mono text-white/50 mt-0.5 select-none">G</span>
                </div>
                <div class="flex flex-col items-center flex-1">
                  <input type="number" min="0" max="255" class="w-full px-1 py-0.5 rounded bg-white/10 border border-white/15 text-xs font-mono font-bold text-white text-center focus:outline-none"
                    x-model.number="rgbB" @input="onRgbInput()" @keydown.enter.prevent="applyColor()" />
                  <span class="text-[9px] font-mono text-white/50 mt-0.5 select-none">B</span>
                </div>
              </div>

              <!-- Modo HSL -->
              <div x-show="mode === 'hsl'" class="flex-1 flex items-center justify-between gap-1 px-1">
                <div class="flex flex-col items-center flex-1">
                  <input type="number" min="0" max="360" class="w-full px-1 py-0.5 rounded bg-white/10 border border-white/15 text-xs font-mono font-bold text-white text-center focus:outline-none"
                    x-model.number="hslH" @input="onHslInput()" @keydown.enter.prevent="applyColor()" />
                  <span class="text-[9px] font-mono text-white/50 mt-0.5 select-none">H°</span>
                </div>
                <div class="flex flex-col items-center flex-1">
                  <input type="number" min="0" max="100" class="w-full px-1 py-0.5 rounded bg-white/10 border border-white/15 text-xs font-mono font-bold text-white text-center focus:outline-none"
                    x-model.number="hslS" @input="onHslInput()" @keydown.enter.prevent="applyColor()" />
                  <span class="text-[9px] font-mono text-white/50 mt-0.5 select-none">S%</span>
                </div>
                <div class="flex flex-col items-center flex-1">
                  <input type="number" min="0" max="100" class="w-full px-1 py-0.5 rounded bg-white/10 border border-white/15 text-xs font-mono font-bold text-white text-center focus:outline-none"
                    x-model.number="hslL" @input="onHslInput()" @keydown.enter.prevent="applyColor()" />
                  <span class="text-[9px] font-mono text-white/50 mt-0.5 select-none">L%</span>
                </div>
              </div>

              <!-- Botón Pipeta / EyeDropper -->
              <button type="button" @click="pickWithEyeDropper()"
                class="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Cuentagotas (Capturar color de cualquier imagen o elemento)">
                <i data-lucide="pipette" class="w-3.5 h-3.5"></i>
              </button>

              <!-- Botón Copiar -->
              <button type="button" @click="copyColor()"
                class="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Copiar código HEX">
                <i data-lucide="copy" class="w-3.5 h-3.5"></i>
              </button>

              <!-- Botón Alternar Formato -->
              <button type="button" @click="cycleMode()"
                class="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Cambiar formato (HEX / RGB / HSL)">
                <i data-lucide="chevrons-up-down" class="w-3.5 h-3.5"></i>
              </button>
            </div>

            <!-- Muestras Rápidas del Catálogo de Carpetas -->
            <div class="grid grid-cols-5 gap-1.5 pt-0.5">
              <template x-for="sw in $store.characters.folderColorsCatalog" :key="sw">
                <button type="button" @click="setFromHex(sw, true)"
                  class="h-6 rounded-md border border-white/20 hover:scale-105 transition-transform cursor-pointer"
                  :style="\`background-color: \${sw};\`"
                  :title="sw"></button>
              </template>
            </div>

            <!-- Botón Aplicar Color -->
            <button type="button" @click="applyColor()"
              class="w-full py-2 rounded-xl text-xs font-bold font-hud uppercase tracking-wider text-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md hover:brightness-110 active:brightness-95"
              :style="\`background-color: \${$store.settings.accentColor}; box-shadow: \${$store.settings.disableGlowEffects ? 'none' : \`0 0 12px \${$store.app.hexToRgba($store.settings.glowColor || $store.settings.accentColor, 0.4)}\`};\`">
              <i data-lucide="check" class="w-4 h-4 stroke-[2.5]"></i>
              <span>APLICAR COLOR</span>
            </button>
          </div>
        </div>

        <!-- Vista Previa de la Carpeta -->
        <div class="p-3 rounded-xl bg-black/50 border border-white/10 flex items-center justify-between">
          <span class="text-[11px] font-mono text-ink-slate uppercase">Vista Previa:</span>
          <div class="folder-tab-chip is-active"
            :style="\`--folder-color: \${$store.characters.folderForm.color || $store.settings.accentColor || '#00F0FF'}; --folder-bg: \${$store.app.hexToRgba($store.characters.folderForm.color || $store.settings.accentColor || '#00F0FF', 0.16)}; --folder-glow: \${$store.app.hexToRgba($store.characters.folderForm.color || $store.settings.accentColor || '#00F0FF', 0.45)};\`">
            <template x-if="$store.characters.folderForm.customLogo">
              <div class="w-4 h-4 rounded overflow-hidden shrink-0 flex items-center justify-center">
                <img :src="$store.characters.folderForm.customLogo" class="w-full h-full"
                  :style="$store.characters.getFolderLogoStyle($store.characters.folderForm)" alt="" />
              </div>
            </template>
            <template x-if="!$store.characters.folderForm.customLogo">
              <span class="w-3.5 h-3.5 shrink-0 flex items-center justify-center"
                x-html="$store.characters.renderFolderIconSvg($store.characters.folderForm.icon, 'w-3.5 h-3.5', $store.characters.folderForm.color || $store.settings.accentColor || '#00F0FF')"></span>
            </template>
            <span class="normal-case font-sans"
              x-text="$store.characters.folderForm.name.trim() || 'Nombre de Carpeta'"></span>
            <span class="folder-tab-counter">0</span>
          </div>
        </div>

      </div>

      <!-- Acciones del Modal (Footer siempre visible y fijado) -->
      <div class="shrink-0 flex items-center justify-between gap-2.5 pt-3 border-t border-white/10">
        <div>
          <button type="button" x-show="$store.characters.folderModalMode === 'edit'"
            @click="
              const fId = $store.characters.folderForm.id;
              const f = $store.characters.folders.find(fold => fold.id === fId) || $store.characters.folderForm;
              $store.characters.closeFolderModal();
              $store.characters.confirmDeleteFolder(f);
            "
            class="px-3 py-2 rounded-xl text-rose-400 hover:text-white hover:bg-rose-500/20 border border-transparent hover:border-rose-500/30 text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Eliminar esta carpeta">
            <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
            <span class="hidden sm:inline">Eliminar Carpeta</span>
          </button>
        </div>

        <div class="flex items-center gap-2.5">
          <button type="button" @click="$store.characters.closeFolderModal()"
            class="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-xs text-slate-300 hover:text-white transition-all cursor-pointer font-mono">
            Cancelar
          </button>
          <button type="button" @click="$store.characters.saveFolderForm()"
            :disabled="!$store.characters.folderForm.name.trim()"
            class="px-5 py-2.5 rounded-xl font-hud font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none hover:brightness-110 active:brightness-95 select-none"
            :style="\`background-color: \${$store.settings.accentColor}; color: #000000; box-shadow: \${$store.settings.disableGlowEffects ? 'none' : \`0 0 16px \${$store.app.hexToRgba($store.settings.glowColor || $store.settings.accentColor, 0.45)}\`};\`">
            <i data-lucide="check" class="w-4 h-4 stroke-[2.5]"></i>
            <span x-text="$store.characters.folderModalMode === 'create' ? 'Crear Carpeta' : 'Guardar Carpeta'"></span>
          </button>
        </div>
      </div>

    </div>
    </template>
  </div>

  <!-- ==============================================================
       MODAL DE CONFIRMACIÓN: ELIMINAR CARPETA (DISEÑO DEDICADO HUD)
       ============================================================== -->
  <div id="delete-folder-modal" x-data x-show="Boolean($store.characters.deleteFolderTarget)" x-cloak
    class="fixed inset-0 z-[100000] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md"
    x-transition:enter="transition ease-out duration-200" x-transition:enter-start="opacity-0 scale-95"
    x-transition:enter-end="opacity-100 scale-100" x-transition:leave="transition ease-in duration-150"
    x-transition:leave-start="opacity-100 scale-100" x-transition:leave-end="opacity-0 scale-95"
    @keydown.escape.window="$store.characters.cancelDeleteFolder()"
    @keydown.enter.window="$store.characters.deleteFolderTarget && $store.characters.executeDeleteFolder()"
    role="dialog" aria-modal="true" aria-labelledby="delete-folder-title">

    <!-- Backdrop click para cancelar -->
    <div class="absolute inset-0" @click="$store.characters.cancelDeleteFolder()"></div>

    <template x-if="Boolean($store.characters.deleteFolderTarget)">
      <div
        class="relative w-full max-w-md bg-[#0a0d14] border border-rose-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-100 select-none shadow-[0_0_40px_rgba(244,63,94,0.25)]"
        @click.stop>

        <!-- Top Accent Bar Carmesí -->
        <div class="h-1.5 w-full bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500"></div>

        <div class="p-6 space-y-4">
          <!-- Icon & Title -->
          <div class="flex items-center gap-3.5">
            <div class="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border border-rose-500/40 bg-rose-500/15 text-rose-400 shadow-[0_0_16px_rgba(244,63,94,0.3)]">
              <i data-lucide="folder-minus" class="w-6 h-6"></i>
            </div>
            <div class="min-w-0">
              <h3 id="delete-folder-title" class="font-title text-lg font-bold text-white uppercase tracking-wider truncate">
                ¿Eliminar Carpeta?
              </h3>
              <span class="text-[10.5px] font-mono uppercase tracking-wider font-bold text-rose-400">
                Confirmación de Organización
              </span>
            </div>
          </div>

          <!-- Vista Previa de la Carpeta que se va a eliminar -->
          <div class="p-3.5 rounded-xl bg-black/60 border border-white/10 flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border"
              :style="\`background-color: \${$store.app.hexToRgba($store.characters.deleteFolderTarget.color || $store.settings.accentColor, 0.15)}; border-color: \${$store.app.hexToRgba($store.characters.deleteFolderTarget.color || $store.settings.accentColor, 0.4)}; color: \${$store.characters.deleteFolderTarget.color || $store.settings.accentColor};\`">
              <template x-if="$store.characters.deleteFolderTarget.customLogo">
                <img :src="$store.characters.deleteFolderTarget.customLogo" class="w-full h-full rounded-[inherit] object-cover" alt="" />
              </template>
              <template x-if="!$store.characters.deleteFolderTarget.customLogo">
                <span class="w-5 h-5 flex items-center justify-center"
                  x-html="$store.characters.renderFolderIconSvg($store.characters.deleteFolderTarget.icon, 'w-5 h-5', $store.characters.deleteFolderTarget.color || $store.settings.accentColor)"></span>
              </template>
            </div>
            <div class="min-w-0 flex-1">
              <h4 class="font-title text-base font-bold text-white truncate" x-text="$store.characters.deleteFolderTarget.name"></h4>
              <p class="text-xs text-slate-400 font-mono">
                <span class="font-bold text-amber-300" x-text="$store.characters.getFolderCharCount($store.characters.deleteFolderTarget.id)"></span> ficha(s) contenida(s)
              </p>
            </div>
          </div>

          <!-- Mensaje de Protección de Datos: Las fichas NO se pierden -->
          <div class="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-2.5 text-xs text-amber-200/90 font-sans leading-relaxed">
            <i data-lucide="shield-check" class="w-4 h-4 text-amber-400 shrink-0 mt-0.5"></i>
            <div>
              <strong>Tus fichas están seguras:</strong> Ningún personaje se borrará. Solamente se retirarán de esta carpeta y volverán a estar visibles en la sección <em>«Sin Carpeta»</em>.
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
            <button type="button" @click="$store.characters.cancelDeleteFolder()"
              class="px-4 py-2.5 rounded-xl text-xs font-mono font-bold text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer">
              Cancelar
            </button>

            <button type="button" @click="$store.characters.executeDeleteFolder()"
              class="px-5 py-2.5 rounded-xl font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg transition-all hover:scale-[1.02] active:scale-95 cursor-pointer bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white shadow-rose-900/40">
              <i data-lucide="trash-2" class="w-4 h-4"></i>
              <span>Eliminar Carpeta</span>
            </button>
          </div>

        </div>
      </div>
    </template>
  </div>
`;
}
