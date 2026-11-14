/**
 * @file src/ui/views/tierlist/modalTierlistDividerTitle.ts
 */

export function renderModalTierlistDividerTitle(): string {
  return `<!-- ==============================================================
     MODAL CYBER HUD: PERSONALIZAR TÍTULO DE SEPARADOR HORIZONTAL
     Permite asignar un nombre a la subdivisión o dejarlo en blanco (Línea Recta)
     ============================================================== -->
<div id="modal-tierlist-divider-title"
  class="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
  x-show="$store.tierlist.dividerTitleModal.isOpen" x-cloak
  @keydown.escape.window="$store.tierlist.dividerTitleModal.isOpen && $store.tierlist.closeDividerTitleModal()"
  role="dialog" aria-modal="true">

  <!-- Fondo / Backdrop Click para cerrar -->
  <div class="absolute inset-0 cursor-pointer" @click="$store.tierlist.closeDividerTitleModal()"></div>

  <!-- Contenedor de la Ventana HUD -->
  <div
    data-protect-contrast="true" class="relative w-full max-w-lg bg-[#0b0f19] rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-100 transition-all border border-cyan-500/40 shadow-[0_0_40px_rgba(0,240,255,0.22)] select-none animate-scale-in"
    @click.stop>

    <!-- Barra de Acento Neón Superior -->
    <div class="h-1.5 w-full bg-gradient-to-r from-cyan-500 via-sky-400 to-indigo-500"></div>

    <div class="p-5 sm:p-6 space-y-4">

      <!-- Cabecera: Ícono + Título + Subtítulo -->
      <div class="flex items-center justify-between border-b border-white/10 pb-3.5">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-400/40 text-cyan-300 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(0,240,255,0.25)]">
            <i data-lucide="split" class="w-5 h-5"></i>
          </div>
          <div>
            <h3 class="font-title text-base sm:text-lg font-bold text-white uppercase tracking-wider">
              Personalizar Separador
            </h3>
            <span class="text-[10px] font-mono text-cyan-400/80 uppercase tracking-wide block">
              // Subdivisión de campo horizontal
            </span>
          </div>
        </div>

        <button type="button" @click="$store.tierlist.closeDividerTitleModal()"
          class="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/15 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-white/10"
          title="Cerrar ventana">
          <i data-lucide="x" class="w-4 h-4"></i>
        </button>
      </div>

      <!-- Previsualización en Vivo de la Línea -->
      <div class="p-3.5 rounded-xl bg-black/60 border border-white/10 flex flex-col gap-2">
        <div class="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">
          <span>Vista Previa en Vivo:</span>
          <span class="text-cyan-400" x-text="$store.tierlist.dividerTitleModal.title.trim() ? 'Con Título' : 'Línea Recta Continua'"></span>
        </div>

        <div class="w-full py-3 flex items-center justify-center min-h-[46px] overflow-hidden">
          <!-- Modo A: Sin Título (Línea Recta) -->
          <template x-if="!$store.tierlist.dividerTitleModal.title.trim()">
            <div class="w-full relative flex items-center justify-center">
              <div class="h-[2px] w-full rounded-full"
                :style="\`background: linear-gradient(90deg, transparent 0%, \${$store.settings.accentColor || '#00f0ff'}88 15%, \${$store.settings.accentColor || '#00f0ff'} 50%, \${$store.settings.accentColor || '#00f0ff'}88 85%, transparent 100%); box-shadow: 0 0 10px \${$store.settings.accentColor || '#00f0ff'}88;\`"></div>
            </div>
          </template>

          <!-- Modo B: Con Título -->
          <template x-if="$store.tierlist.dividerTitleModal.title.trim()">
            <div class="w-full relative flex items-center justify-between">
              <div class="h-[2px] flex-1 rounded-full"
                :style="\`background: linear-gradient(90deg, transparent 0%, \${$store.settings.accentColor || '#00f0ff'}88 35%, \${$store.settings.accentColor || '#00f0ff'} 100%); box-shadow: 0 0 10px \${$store.settings.accentColor || '#00f0ff'}88;\`"></div>

              <div class="mx-3 px-3.5 py-1 rounded-full border flex items-center gap-2 backdrop-blur-md shadow-lg"
                :style="\`background-color: rgba(\${($store.settings.rgbChannels || '0, 240, 255')}, 0.12); border-color: rgba(\${($store.settings.rgbChannels || '0, 240, 255')}, 0.5); box-shadow: 0 0 14px rgba(\${($store.settings.rgbChannels || '0, 240, 255')}, 0.44);\`">
                <span class="font-mono font-black text-xs tracking-wider uppercase" :style="\`color: \${$store.settings.accentColor || '#00f0ff'};\`"
                  x-text="$store.tierlist.dividerTitleModal.title.trim()"></span>
              </div>

              <div class="h-[2px] flex-1 rounded-full"
                :style="\`background: linear-gradient(90deg, \${$store.settings.accentColor || '#00f0ff'} 0%, \${$store.settings.accentColor || '#00f0ff'}88 65%, transparent 100%); box-shadow: 0 0 10px \${$store.settings.accentColor || '#00f0ff'}88;\`"></div>
            </div>
          </template>
        </div>
      </div>

      <!-- Campo de Entrada: Nombre del Separador -->
      <div class="space-y-1.5">
        <label for="divider-title-input" class="block text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
          <span>Nombre de la Subdivisión:</span>
          <span class="text-[10px] text-slate-400 font-normal">Pulsa Enter para guardar</span>
        </label>

        <div class="relative">
          <input id="divider-title-input" type="text"
            x-model="$store.tierlist.dividerTitleModal.title"
            @keydown.enter.prevent="$store.tierlist.saveDividerTitle()"
            placeholder="Ej: Top Tier, Mid Tier, Variantes... (O vacío para línea recta)"
            maxlength="40"
            class="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/20 text-white font-mono text-sm placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30 transition-all shadow-inner" />

          <!-- Botón Rápido Limpiar (✕) dentro del input -->
          <button type="button" x-show="$store.tierlist.dividerTitleModal.title"
            @click="$store.tierlist.dividerTitleModal.title = ''"
            class="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-lg bg-white/10 hover:bg-white/20 text-slate-400 hover:text-white transition-colors cursor-pointer text-xs"
            title="Borrar texto para dejar línea recta">
            <i data-lucide="x" class="w-3.5 h-3.5"></i>
          </button>
        </div>
      </div>

      <!-- Sugerencias Rápidas / Presets con 1 clic -->
      <div class="space-y-1.5">
        <span class="text-[10.5px] font-mono text-slate-400 uppercase tracking-wide block font-bold">
          Sugerencias Rápidas:
        </span>
        <div class="flex items-center gap-1.5 flex-wrap">
          <template x-for="preset in ['Top Tier', 'Mid Tier', 'Low Tier', 'Variantes', 'Equipo B', 'Reservas', 'Fase 1']" :key="preset">
            <button type="button" @click="$store.tierlist.dividerTitleModal.title = preset"
              class="px-2 py-1 rounded-lg bg-white/5 hover:bg-cyan-500/20 border border-white/10 hover:border-cyan-400/40 text-slate-300 hover:text-cyan-300 font-mono text-[10.5px] transition-all cursor-pointer">
              <span x-text="preset"></span>
            </button>
          </template>

          <button type="button" @click="$store.tierlist.dividerTitleModal.title = ''"
            class="px-2 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/25 border border-rose-500/20 hover:border-rose-400/40 text-rose-300 font-mono text-[10.5px] transition-all cursor-pointer">
            <span>// Solo Línea Recta</span>
          </button>
        </div>
      </div>

      <!-- Acciones de Pie de Modal -->
      <div class="flex items-center justify-between gap-2 pt-3 border-t border-white/10 flex-wrap">
        <button type="button" @click="$store.tierlist.clearDividerTitle()"
          class="px-3 py-2 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white font-mono text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
          title="Guardar como línea recta continua sin texto">
          <i data-lucide="minus" class="w-3.5 h-3.5 text-cyan-400"></i>
          <span>Solo Línea Recta</span>
        </button>

        <div class="flex items-center gap-2">
          <button type="button" @click="$store.tierlist.closeDividerTitleModal()"
            class="px-4 py-2 rounded-xl text-xs font-mono font-bold text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer">
            Cancelar
          </button>

          <button type="button" @click="$store.tierlist.saveDividerTitle()"
            class="px-5 py-2 rounded-xl font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-lg transition-all hover:scale-[1.02] cursor-pointer bg-cyan-500 hover:bg-cyan-400 text-black shadow-[0_0_15px_rgba(0,240,255,0.4)]">
            <i data-lucide="check" class="w-3.5 h-3.5 stroke-[3]"></i>
            <span>Guardar</span>
          </button>
        </div>
      </div>

    </div>
  </div>
</div>

`;
}
