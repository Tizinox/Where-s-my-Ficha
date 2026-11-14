/**
 * @file src/ui/views/tierlist/tierlistMultiselectBar.ts
 */

export function renderTierlistMultiselectBar(): string {
  return `<!-- ══════════════════════════════════════════════════════════════════════════
     BARRA FLOTANTE DE ACCIONES RÁPIDAS: SELECCIÓN MÚLTIPLE DE OPERATIVOS
     Totalmente sincronizada con el color de tema personalizado de configuraciones
     ══════════════════════════════════════════════════════════════════════════ -->
<div id="tierlist-multiselect-floating-bar"
  x-show="$store.tierlist.selectedCount > 0"
  x-cloak
  @keydown.escape.window="$store.tierlist.clearSelectedCharacters()"
  x-transition:enter="transition cubic-bezier(0.16, 1, 0.3, 1) duration-300"
  x-transition:enter-start="opacity-0 translate-y-10 scale-95"
  x-transition:enter-end="opacity-100 translate-y-0 scale-100"
  x-transition:leave="transition cubic-bezier(0.16, 1, 0.3, 1) duration-200"
  x-transition:leave-start="opacity-100 translate-y-0 scale-100"
  x-transition:leave-end="opacity-0 translate-y-10 scale-95"
  class="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[95vw] max-w-4xl p-3 sm:p-3.5 rounded-2xl backdrop-blur-2xl border-2 flex flex-col md:flex-row items-center justify-between gap-3 select-none transition-all"
  :class="$store.tierlist.selectedCount > 0 ? '' : 'hidden pointer-events-none'"
  :style="$store.tierlist.getMultiselectBarStyle()">

  <!-- Acento luminoso láser superior según color de configuraciones -->
  <div class="absolute inset-x-0 top-0 h-[2px] opacity-85" :style="$store.tierlist.getMultiselectLaserStyle()"></div>

  <!-- Sección Izquierda: Contador, Miniaturas y Deseleccionar -->
  <div class="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
    <div class="flex items-center gap-2.5">
      <!-- Indicador Pulsante con color de tema -->
      <div class="relative w-7 h-7 rounded-xl border flex items-center justify-center shrink-0 transition-colors"
        :style="$store.tierlist.getMultiselectIconBoxStyle()">
        <i data-lucide="layers" class="w-4 h-4" :style="\`color: \${$store.tierlist.getMultiselectAccentColor()};\`"></i>
        <span class="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full animate-ping"
          :style="\`background-color: \${$store.tierlist.getMultiselectAccentColor()};\`"></span>
      </div>

      <!-- Texto y Contador -->
      <div class="flex items-center gap-1.5">
        <span class="font-title text-sm sm:text-base font-black text-white" x-text="$store.tierlist.selectedCount"></span>
        <span class="text-[11px] font-mono font-bold uppercase tracking-wider"
          :style="\`color: \${$store.tierlist.getMultiselectAccentColor()};\`">
          <span x-text="$store.tierlist.selectedCountLabel"></span>
        </span>
      </div>
    </div>

    <!-- Pila de Miniaturas de Elementos Seleccionados (Operativos y Operadores) -->
    <div class="flex items-center -space-x-2 overflow-hidden px-1 py-0.5">
      <template x-for="(item, idx) in $store.tierlist.selectedDisplayItems.slice(0, 4)" :key="item.id">
        <div class="w-7 h-7 rounded-lg overflow-hidden border-2 bg-black/80 shrink-0 shadow-md relative transition-colors flex items-center justify-center"
          :style="\`border-color: \${$store.tierlist.getMultiselectAccentColor()};\`"
          :title="item.name">
          <template x-if="item.isOperator">
            <span class="font-mono font-black text-xs leading-none select-none" :style="\`color: \${item.color};\`" x-text="item.symbol"></span>
          </template>
          <template x-if="!item.isOperator">
            <div class="w-full h-full">
              <template x-if="item.char?.basics?.useIconForPfp ? Boolean(item.char?.basics?.iconDataUrl || item.char?.basics?.avatarDataUrl) : Boolean(item.char?.basics?.avatarDataUrl || item.char?.basics?.iconDataUrl)">
                <img :src="item.char?.basics?.useIconForPfp ? (item.char?.basics?.iconDataUrl || item.char?.basics?.avatarDataUrl) : (item.char?.basics?.avatarDataUrl || item.char?.basics?.iconDataUrl)"
                  class="w-full h-full object-cover pointer-events-none" alt="" />
              </template>
              <template x-if="!(item.char?.basics?.useIconForPfp ? Boolean(item.char?.basics?.iconDataUrl || item.char?.basics?.avatarDataUrl) : Boolean(item.char?.basics?.avatarDataUrl || item.char?.basics?.iconDataUrl))">
                <div class="w-full h-full flex items-center justify-center text-[10px] font-bold text-white bg-slate-800"
                  x-text="(item.char?.name || '?').charAt(0).toUpperCase()"></div>
              </template>
            </div>
          </template>
        </div>
      </template>

      <!-- Badge de +N si hay más de 4 con acento dinámico -->
      <template x-if="$store.tierlist.selectedCount > 4">
        <div class="w-7 h-7 rounded-lg border-2 text-[9px] font-mono font-black flex items-center justify-center shrink-0 shadow-md transition-colors"
          :style="\`border-color: \${$store.tierlist.getMultiselectAccentColor()}; color: \${$store.tierlist.getMultiselectAccentColor()}; background-color: rgba(\${$store.tierlist.getMultiselectRgbChannels()}, 0.25);\`"
          x-text="\`+\${$store.tierlist.selectedCount - 4}\`"></div>
      </template>
    </div>

    <!-- Botón Deseleccionar / Cancelar (solo icono ✕ para máximo ahorro de espacio) -->
    <button type="button" @click="$store.tierlist.clearSelectedCharacters()"
      class="w-8 h-8 rounded-xl bg-white/5 hover:bg-rose-500/20 border border-white/10 hover:border-rose-400/50 text-slate-400 hover:text-rose-300 flex items-center justify-center transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95 shrink-0"
      title="Deseleccionar todo (Esc)"
      aria-label="Deseleccionar todo">
      <i data-lucide="x" class="w-4 h-4"></i>
    </button>
  </div>

  <!-- Separador Central Vertical -->
  <div class="h-8 w-px bg-white/15 hidden md:block"></div>

  <!-- Sección Derecha: Destinos de Rango / Clasificación y Eliminación -->
  <div class="flex items-center gap-2 flex-wrap w-full md:w-auto justify-center md:justify-end">
    <!-- Acciones en Bloque: Intercalar Conectores (solo si hay 2+ seleccionados en el mismo tier) -->
    <template x-if="$store.tierlist.getSelectedCharactersTierInfo()">
      <div class="flex items-center gap-1.5 px-2 py-1 rounded-xl bg-black/60 border border-white/10 shrink-0">
        <span class="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider pl-1">
          Conectar:
        </span>
        <button type="button" @click="$store.tierlist.interleaveOperatorBetweenSelected('op_gt')"
          class="px-2 py-0.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-300 border border-emerald-500/40 font-mono font-black text-xs transition-all hover:scale-105 active:scale-95 cursor-pointer"
          title="Intercalar conector '>' (mayor que) entre los operativos seleccionados">
          &gt;
        </button>
        <button type="button" @click="$store.tierlist.interleaveOperatorBetweenSelected('op_eq')"
          class="px-2 py-0.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/40 text-cyan-300 border border-cyan-500/40 font-mono font-black text-xs transition-all hover:scale-105 active:scale-95 cursor-pointer"
          title="Intercalar conector '=' (equivalente) entre los operativos seleccionados">
          =
        </button>
        <button type="button" @click="$store.tierlist.interleaveOperatorBetweenSelected('op_dash')"
          class="px-2 py-0.5 rounded-lg bg-slate-500/20 hover:bg-slate-500/40 text-slate-300 border border-slate-500/40 font-mono font-black text-xs transition-all hover:scale-105 active:scale-95 cursor-pointer"
          title="Intercalar separador '—' (raya) entre los operativos seleccionados">
          —
        </button>
        <button type="button" @click="$store.tierlist.interleaveOperatorBetweenSelected('op_slash')"
          class="px-2 py-0.5 rounded-lg bg-slate-500/20 hover:bg-slate-500/40 text-slate-200 border border-slate-400/40 font-mono font-black text-xs transition-all hover:scale-105 active:scale-95 cursor-pointer"
          title="Intercalar separador '/' (raya diagonal) entre los operativos seleccionados">
          /
        </button>
        <button type="button" @click="$store.tierlist.interleaveOperatorBetweenSelected('op_hr')"
          class="px-2 py-0.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/40 text-cyan-300 border border-cyan-500/40 font-mono font-black text-xs transition-all hover:scale-105 active:scale-95 cursor-pointer"
          title="Intercalar línea divisoria horizontal entre los operativos seleccionados (Divide en 2 campos)">
          ───
        </button>
        <button type="button" @click="$store.tierlist.interleaveOperatorBetweenSelected('op_approx')"
          class="px-2 py-0.5 rounded-lg bg-sky-500/20 hover:bg-sky-500/40 text-sky-300 border border-sky-500/40 font-mono font-black text-xs transition-all hover:scale-105 active:scale-95 cursor-pointer"
          title="Intercalar conector '≈' (aproximado) entre los operativos seleccionados">
          ≈
        </button>
        <button type="button" @click="$store.tierlist.interleaveOperatorBetweenSelected('op_gte')"
          class="px-2 py-0.5 rounded-lg bg-sky-500/20 hover:bg-sky-500/40 text-sky-300 border border-sky-500/40 font-mono font-black text-xs transition-all hover:scale-105 active:scale-95 cursor-pointer"
          title="Intercalar conector '≥' (mayor o igual) entre los operativos seleccionados">
          ≥
        </button>
        <button type="button" @click="$store.tierlist.interleaveOperatorBetweenSelected('op_matchup')"
          class="px-2 py-0.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/40 text-amber-300 border border-amber-500/40 font-mono font-black text-xs transition-all hover:scale-105 active:scale-95 cursor-pointer"
          title="Intercalar conector '⇄' (matchup dependiente) entre los operativos seleccionados">
          ⇄
        </button>
      </div>
    </template>

    <span class="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-300 hidden sm:inline">
      Mover a:
    </span>

    <!-- Botones de Tiers Dinámicos -->
    <div class="flex items-center gap-1.5 flex-wrap justify-center">
      <template x-for="tier in $store.tierlist.tiers" :key="tier.id">
        <button type="button" @click="$store.tierlist.assignSelectedCharacters(tier.id)"
          class="min-w-[36px] h-9 px-2.5 py-1 rounded-xl flex items-center justify-center text-center transition-all hover:scale-110 active:scale-95 cursor-pointer shadow-md border border-white/30 text-white font-title font-black uppercase text-xs sm:text-sm relative overflow-hidden group"
          :style="\`background: \${$store.tierlist.getTierBackground(tier)};\`"
          :title="\`Mover \${$store.tierlist.selectedCount} seleccionados a Rango \${tier.label}\`">
          <!-- Brillo de hover en botón -->
          <div class="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
          <span class="relative z-10 pointer-events-none" :style="$store.tierlist.getTierLabelStyle(tier)" x-text="tier.label"></span>
        </button>
      </template>

      <!-- Botón Devolver al Banco (Reserva - sin icono para mayor espacio) -->
      <button type="button" @click="$store.tierlist.unassignSelectedCharacters()"
        class="h-9 px-3 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-white/20 text-slate-300 hover:text-white text-xs font-mono font-bold flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-sm ml-1"
        title="Devolver los operativos seleccionados al banco de reserva">
        <span>Al Banco</span>
      </button>

      <!-- Separador Vertical Delgado -->
      <div class="h-6 w-px bg-white/15 mx-0.5 hidden sm:block"></div>

      <!-- Botón Eliminar Múltiples Operativos (Invitados, Plantilla o Retirar del Tablero) -->
      <button type="button" @click="$store.tierlist.confirmDeleteSelectedCharacters()"
        class="h-9 px-2.5 sm:px-3 rounded-xl bg-rose-500/15 hover:bg-rose-500/30 border border-rose-500/40 hover:border-rose-400 text-rose-300 hover:text-white text-xs font-mono font-bold flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-sm"
        title="Eliminar operativos seleccionados (invitados/plantilla permanentemente)">
        <i data-lucide="trash-2" class="w-3.5 h-3.5 text-rose-400"></i>
        <span class="hidden sm:inline">Eliminar</span>
      </button>
    </div>
  </div>

</div>
`;
}
