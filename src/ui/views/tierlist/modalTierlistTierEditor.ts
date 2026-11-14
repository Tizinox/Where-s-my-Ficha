/**
 * @file src/ui/views/tierlist/modalTierlistTierEditor.ts
 */

export function renderModalTierlistTierEditor(): string {
  return `<!-- ════ MODAL DE PERSONALIZACIÓN DE RANGO (ESTUDIO DE COLOR y DEGRADADOS) ════ -->
<div id="tierlist-edit-tier-modal"
  class="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 pt-16 sm:pt-20 pb-8 bg-black/85 backdrop-blur-md overflow-y-auto"
  x-show="$store.tierlist.colorPickerTierId !== null" x-cloak
  @keydown.escape.window="$store.tierlist.closeTierEditor()" role="dialog" aria-modal="true">

  <div x-data="{ get tier() { return $store.tierlist.activeEditingTier; } }" x-show="tier"
    data-protect-contrast="true" class="relative w-full max-w-lg rounded-2xl overflow-hidden flex flex-col text-parchment-cream max-h-[calc(100vh-120px)] my-auto transition-all duration-300 shadow-2xl"
    :style="$store.tierlist.getTierModalAuraStyle(tier)" @click.outside="$store.tierlist.closeTierEditor()">

    <!-- Modal Header -->
    <div class="px-6 py-3.5 border-b border-white/10 flex items-center justify-between shrink-0"
      :style="tier?.colorType === 'gradient'
        ? \`background: linear-gradient(to right, \${$store.tierlist._hexToRgba(tier.color1 || '#ef4444', 0.22)}, rgba(11, 14, 23, 0.9) 60%, \${$store.tierlist._hexToRgba(tier.color2 || '#00c9a7', 0.15)});\`
        : \`background: linear-gradient(to right, \${$store.tierlist._hexToRgba($store.tierlist.getTierSolidColor(tier), 0.22)}, rgba(11, 14, 23, 0.9) 65%);\`">
      <div class="flex items-center gap-3">
        <div class="p-2 rounded-xl flex items-center justify-center border shadow-md transition-colors"
          :style="\`background: \${$store.tierlist._hexToRgba($store.tierlist.getTierPrimaryColor(tier), 0.2)}; border-color: \${$store.tierlist._hexToRgba($store.tierlist.getTierPrimaryColor(tier), 0.5)}; color: \${$store.tierlist.getTierPrimaryColor(tier)};\`">
          <i data-lucide="palette" class="w-5 h-5"></i>
        </div>
        <div>
          <h3 class="font-title text-lg font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <span>Estudio de Rango</span>
            <span class="text-xs px-2.5 py-0.5 rounded-full font-mono font-black border shadow-sm"
              :style="\`background: \${$store.tierlist.getTierBackground(tier)}; color: #ffffff; border-color: rgba(255,255,255,0.4); text-shadow: 0 1px 3px rgba(0,0,0,0.8);\`"
              x-text="tier?.label"></span>
          </h3>
          <p class="text-[11px] font-mono text-slate-400">Personaliza la tipografía, degradado y paleta de este nivel
          </p>
        </div>
      </div>
      <button type="button" @click="$store.tierlist.closeTierEditor()"
        class="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer">
        <i data-lucide="x" class="w-4.5 h-4.5"></i>
      </button>
    </div>

    <!-- Modal Body -->
    <div class="px-6 py-4 space-y-4 overflow-y-auto flex-1 custom-scrollbar">

      <!-- Vista Previa Volumétrica en Tiempo Real -->
      <div
        class="py-2.5 px-4 rounded-xl bg-black/60 border border-white/10 flex flex-col items-center justify-center gap-1.5 shadow-inner">
        <span class="text-[9.5px] font-mono uppercase tracking-widest text-slate-400 font-bold">Vista Previa del
          Monumento</span>
        <div
          class="tier-monument w-36 sm:w-40 min-h-[5rem] py-2 px-3 rounded-xl border-2 border-white/30 shadow-2xl relative flex flex-col items-center justify-center gap-1 transition-all"
          :style="\`background: \${$store.tierlist.getTierBackground(tier)};\`">
          <span class="tier-monument-letter text-white select-none block"
            :style="$store.tierlist.getTierLabelStyle(tier)"
            x-text="tier?.label"></span>
          <span x-show="!$store.settings.hideTierCharacterCount" class="tier-monument-pill text-white select-none inline-block relative z-10"
            style="color: #ffffff !important;">
            <span x-text="(tier?.characterIds || []).length"></span> OP
          </span>
        </div>
      </div>

      <!-- Nombre / Letra del Rango -->
      <div>
        <label
          class="block text-xs font-mono uppercase text-slate-300 font-bold mb-1.5 flex items-center justify-between">
          <span>Nombre o Letra del Rango:</span>
          <span class="text-[10px] text-slate-500 font-normal">Ej: S, S+, GOD, Z, A, ÉLITE, Medianamente malo</span>
        </label>
        <input type="text" :value="tier?.label" @input="$store.tierlist.updateTierLabel(tier.id, $el.value)"
          class="w-full px-4 py-2.5 rounded-xl bg-black/80 border border-white/20 text-base font-title font-black text-white focus:outline-none focus:border-cyan-400 transition-colors tracking-wider" />
      </div>

      <!-- Selector de Modo de Fondo -->
      <div>
        <label class="block text-xs font-mono uppercase text-slate-300 font-bold mb-1.5">Estilo Visual de
          Fondo:</label>
        <div class="grid grid-cols-2 gap-2 p-1 rounded-xl bg-black/70 border border-white/10 text-xs font-mono">
          <button type="button" @click="$store.tierlist.setTierColorType(tier.id, 'gradient')"
            class="py-2 px-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
            :class="tier?.colorType === 'gradient' ? 'bg-gradient-to-r from-violet-600/60 to-fuchsia-600/60 text-white border border-fuchsia-400/60 shadow-md' : 'text-slate-400 hover:text-white hover:bg-white/5'">
            <i data-lucide="palette" class="w-4 h-4 text-fuchsia-400"></i>
            <span>Degradado</span>
          </button>
          <button type="button" @click="$store.tierlist.setTierColorType(tier.id, 'solid')"
            class="py-2 px-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
            :class="tier?.colorType !== 'gradient' ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-400/60 shadow-md' : 'text-slate-400 hover:text-white hover:bg-white/5'">
            <i data-lucide="square" class="w-4 h-4 text-cyan-400"></i>
            <span>Color Sólido</span>
          </button>
        </div>
      </div>

      <!-- MODO DEGRADADO -->
      <template x-if="tier?.colorType === 'gradient'">
        <div class="space-y-4 pt-1">
          <!-- Selector de Colores del Degradado -->
          <div class="grid grid-cols-2 gap-3">
            <!-- Color 1 -->
            <div class="space-y-1.5">
              <label class="block text-[10px] font-mono uppercase text-slate-400 font-bold">Color Inicio:</label>
              <div class="flex items-center gap-2 bg-black/70 p-2 rounded-xl border border-white/15">
                <input type="color" :value="tier?.color1 || '#0b4f6c'"
                  @input="$store.tierlist.updateTierGradientColor(tier.id, 1, $el.value)"
                  class="w-8 h-8 rounded-lg border-0 bg-transparent cursor-pointer p-0 shrink-0" />
                <input type="text" :value="tier?.color1 || '#0b4f6c'"
                  @change="$store.tierlist.updateTierGradientColor(tier.id, 1, $el.value)"
                  class="w-full bg-transparent text-xs font-mono uppercase text-white focus:outline-none" />
              </div>
            </div>

            <!-- Color 2 -->
            <div class="space-y-1.5">
              <label class="block text-[10px] font-mono uppercase text-slate-400 font-bold">Color Fin:</label>
              <div class="flex items-center gap-2 bg-black/70 p-2 rounded-xl border border-white/15">
                <input type="color" :value="tier?.color2 || '#00c9a7'"
                  @input="$store.tierlist.updateTierGradientColor(tier.id, 2, $el.value)"
                  class="w-8 h-8 rounded-lg border-0 bg-transparent cursor-pointer p-0 shrink-0" />
                <input type="text" :value="tier?.color2 || '#00c9a7'"
                  @change="$store.tierlist.updateTierGradientColor(tier.id, 2, $el.value)"
                  class="w-full bg-transparent text-xs font-mono uppercase text-white focus:outline-none" />
              </div>
            </div>
          </div>

          <!-- Dirección del Degradado -->
          <div>
            <label class="block text-[10px] font-mono uppercase text-slate-400 font-bold mb-1.5">Orientación:</label>
            <div class="grid grid-cols-3 gap-2">
              <button type="button" @click="$store.tierlist.setTierGradientDir(tier.id, 'to bottom')"
                class="py-1.5 px-2 rounded-lg text-xs font-mono font-bold flex items-center justify-center gap-1.5 border transition-all cursor-pointer"
                :class="(tier?.gradientDir || 'to bottom') === 'to bottom' ? 'bg-cyan-500/25 text-cyan-300 border-cyan-400/60 shadow-sm' : 'bg-black/50 text-slate-400 border-white/10 hover:text-white'">
                <span>↓ Vertical</span>
              </button>
              <button type="button" @click="$store.tierlist.setTierGradientDir(tier.id, 'to bottom right')"
                class="py-1.5 px-2 rounded-lg text-xs font-mono font-bold flex items-center justify-center gap-1.5 border transition-all cursor-pointer"
                :class="tier?.gradientDir === 'to bottom right' ? 'bg-cyan-500/25 text-cyan-300 border-cyan-400/60 shadow-sm' : 'bg-black/50 text-slate-400 border-white/10 hover:text-white'">
                <span>↘ Diagonal</span>
              </button>
              <button type="button" @click="$store.tierlist.setTierGradientDir(tier.id, 'to right')"
                class="py-1.5 px-2 rounded-lg text-xs font-mono font-bold flex items-center justify-center gap-1.5 border transition-all cursor-pointer"
                :class="tier?.gradientDir === 'to right' ? 'bg-cyan-500/25 text-cyan-300 border-cyan-400/60 shadow-sm' : 'bg-black/50 text-slate-400 border-white/10 hover:text-white'">
                <span>→ Horizontal</span>
              </button>
            </div>
          </div>

          <!-- Presets de Degradados -->
          <div>
            <label class="block text-[10px] font-mono uppercase text-slate-400 font-bold mb-1.5">Degradados
              Predefinidos:</label>
            <div class="grid grid-cols-6 gap-2">
              <template x-for="g in $store.tierlist.presetGradients" :key="g.name">
                <button type="button" @click="$store.tierlist.setTierGradient(tier.id, g.from, g.to, g.dir)"
                  class="h-9 rounded-xl transition-transform hover:scale-110 border border-white/30 shadow-md cursor-pointer"
                  :style="\`background: linear-gradient(\${g.dir || 'to bottom'}, \${g.from}, \${g.to});\`"
                  :title="g.name">
                </button>
              </template>
            </div>
          </div>
        </div>
      </template>

      <!-- MODO COLOR SÓLIDO -->
      <template x-if="tier?.colorType !== 'gradient'">
        <div class="space-y-4 pt-1">
          <!-- Selector de Color Personalizado -->
          <div>
            <label class="block text-[10px] font-mono uppercase text-slate-400 font-bold mb-1.5">Color Sólido
              Personalizado:</label>
            <div class="flex items-center gap-2.5 bg-black/70 p-2 rounded-xl border border-white/15">
              <input type="color" :value="$store.tierlist.getTierSolidColor(tier)"
                @input="$store.tierlist.setTierColor(tier.id, $el.value)"
                class="w-8 h-8 rounded-lg border-0 bg-transparent cursor-pointer p-0 shrink-0" />
              <input type="text" :value="$store.tierlist.getTierSolidColor(tier)"
                @change="$store.tierlist.setTierColor(tier.id, $el.value)"
                class="w-full bg-transparent text-xs font-mono uppercase text-white focus:outline-none" />
            </div>
          </div>

          <!-- Paleta Sólida de Combate -->
          <div>
            <label class="block text-[10px] font-mono uppercase text-slate-400 font-bold mb-1.5">Paleta de
              Colores:</label>
            <div class="grid grid-cols-5 gap-2">
              <template x-for="c in $store.tierlist.presetColors" :key="c">
                <button type="button" @click="$store.tierlist.setTierColor(tier.id, c)"
                  class="w-full h-8 rounded-xl transition-transform hover:scale-105 border cursor-pointer shadow-sm"
                  :class="$store.tierlist.getTierSolidColor(tier) === c ? 'border-white ring-2 ring-cyan-400 shadow-md' : 'border-black/50'"
                  :style="\`background-color: \${c};\`">
                </button>
              </template>
            </div>
          </div>
        </div>
      </template>

    </div>

    <!-- Modal Footer -->
    <div class="px-6 py-3.5 border-t border-white/10 bg-black/60 flex items-center justify-between shrink-0">
      <span class="text-[11px] font-mono text-slate-500">Los cambios se guardan al instante</span>
      <button type="button" @click="$store.tierlist.closeTierEditor()"
        class="px-5 py-2.5 rounded-xl text-xs font-mono font-bold text-white transition-all cursor-pointer shadow-md hover:scale-105 active:scale-95"
        :style="\`background: \${$store.tierlist.getTierBackground(tier)}; border: 1px solid rgba(255,255,255,0.3); text-shadow: 0 1px 3px rgba(0,0,0,0.85); box-shadow: 0 0 10px \${$store.tierlist._hexToRgba($store.tierlist.getTierPrimaryColor(tier), 0.25)};\`">
        Listo / Aplicar
      </button>
    </div>

  </div>
</div>
`;
}
