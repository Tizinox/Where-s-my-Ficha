/**
 * @file src/ui/modals/modalJsonPreview.ts
 */

export function renderModalJsonPreview(): string {
  return `<!-- ==============================================================
     MODAL DE PREVISUALIZACIÓN DE IMPORTACIÓN JSON (FICHA O ROSTER)
     ============================================================== -->
<div id="json-preview-modal" class="modal-backdrop no-print z-[999999]" x-show="$store.characters.jsonPreview.isOpen"
  x-cloak x-data x-transition:enter="transition ease-out duration-200" x-transition:enter-start="opacity-0"
  x-transition:enter-end="opacity-100" x-transition:leave="transition ease-in duration-150"
  x-transition:leave-start="opacity-100" x-transition:leave-end="opacity-0"
  @keydown.escape.window="$store.characters.closeImportPreview()" role="dialog" aria-modal="true"
  aria-labelledby="json-preview-modal-title">

  <!-- Fondo oscuro con efecto blur -->
  <div class="absolute inset-0 bg-black/85 backdrop-blur-md" @click="$store.characters.closeImportPreview()"></div>

  <!-- Diálogo Modal -->
  <template x-if="$store.characters.jsonPreview.isOpen">
    <div
      data-protect-contrast="true" class="modal-box relative w-full max-w-2xl bg-[#0b0e14] border-2 border-accent-cyan/50 rounded-2xl shadow-[0_0_60px_rgba(0,240,255,0.25)] p-5 sm:p-7 space-y-5 text-parchment-cream overflow-hidden my-auto max-h-[92vh] flex flex-col">

      <!-- Resplandor ambiental ciberpunk -->
      <div class="absolute -top-24 -right-24 w-52 h-52 bg-accent-cyan/15 rounded-full blur-3xl pointer-events-none"></div>
      <div class="absolute -bottom-24 -left-24 w-52 h-52 bg-accent-gold/10 rounded-full blur-3xl pointer-events-none"></div>

      <!-- Encabezado del Modal -->
      <div class="flex items-center justify-between border-b border-white/10 pb-4 shrink-0">
        <div class="flex items-center gap-3">
          <div
            class="w-10 h-10 rounded-xl bg-accent-cyan/15 border border-accent-cyan/40 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(0,240,255,0.2)]">
            <i data-lucide="file-text" class="w-5 h-5 text-accent-cyan"></i>
          </div>
          <div>
            <h2 id="json-preview-modal-title"
              class="font-hud font-bold text-base sm:text-lg text-accent-cyan tracking-wide flex items-center gap-2">
              PREVISUALIZACIÓN DE IMPORTACIÓN
            </h2>
            <p class="text-[11px] font-mono text-slate-400">Inspecciona el contenido antes de integrarlo a tu base de datos</p>
          </div>
        </div>

        <!-- Origen y Botón Cerrar -->
        <div class="flex items-center gap-2">
          <span
            class="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/15 text-[10px] font-mono text-parchment-peach max-w-[200px] truncate"
            :title="$store.characters.jsonPreview.sourceName">
            <i data-lucide="database" class="w-3 h-3 text-accent-gold shrink-0"></i>
            <span class="truncate" x-text="$store.characters.jsonPreview.sourceName"></span>
          </span>
          <button type="button" @click="$store.characters.closeImportPreview()"
            class="w-8 h-8 rounded-lg border border-white/10 hover:border-white/30 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Cerrar sin guardar">
            <i data-lucide="x" class="w-4 h-4"></i>
          </button>
        </div>
      </div>

      <!-- Contenedor con Scroll de Contenido -->
      <div class="space-y-4 overflow-y-auto pr-1 flex-1 custom-scrollbar">

        <!-- ═════════════════════════════════════════════════════════
             CASO 1: PERSONAJE INDIVIDUAL
             ═════════════════════════════════════════════════════════ -->
        <template x-if="!$store.characters.jsonPreview.isRoster && $store.characters.jsonPreview.char">
          <div class="space-y-4">

            <!-- Ficha Hero Visual -->
            <div
              class="p-4 rounded-xl border border-white/15 bg-black/40 flex flex-col sm:flex-row gap-4 items-center sm:items-start relative overflow-hidden shadow-inner">
              
              <!-- Avatar Preview -->
              <div class="relative shrink-0">
                <template x-if="$store.characters.jsonPreview.char.basics?.avatarDataUrl">
                  <img :src="$store.characters.jsonPreview.char.basics.avatarDataUrl" alt="Avatar"
                    class="w-20 h-20 sm:w-24 sm:h-24 rounded-xl object-cover border-2 border-accent-gold/40 shadow-lg bg-black/60" />
                </template>
                <template x-if="!$store.characters.jsonPreview.char.basics?.avatarDataUrl">
                  <div
                    class="w-20 h-20 sm:w-24 sm:h-24 rounded-xl border-2 border-white/20 bg-white/5 flex flex-col items-center justify-center text-slate-400">
                    <i data-lucide="user" class="w-8 h-8 mb-1 text-slate-500"></i>
                    <span class="text-[9px] font-mono">Sin Avatar</span>
                  </div>
                </template>
              </div>

              <!-- Metadatos de Identidad -->
              <div class="space-y-1.5 text-center sm:text-left flex-1 min-w-0">
                <div class="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h3 class="font-title text-xl sm:text-2xl font-bold text-parchment-cream leading-tight truncate"
                    x-text="$store.characters.jsonPreview.char.name || 'Sin Nombre'"></h3>
                </div>

                <p class="text-xs text-accent-gold italic font-title"
                  x-show="$store.characters.jsonPreview.char.basics?.title"
                  x-text="$store.characters.jsonPreview.char.basics?.title"></p>

                <!-- Chips de Metadatos -->
                <div class="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 pt-1">
                  <!-- Arquetipo -->
                  <span
                    class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-accent-cyan/15 border border-accent-cyan/30 text-accent-cyan"
                    x-text="$store.characters.jsonPreview.char.basics?.archetype || 'Aventurero'"></span>

                  <!-- Rol / Ocupación -->
                  <span class="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-500/15 border border-purple-500/30 text-purple-300"
                    x-show="$store.characters.jsonPreview.char.basics?.role"
                    x-text="$store.characters.jsonPreview.char.basics?.role"></span>

                  <!-- Alineamiento -->
                  <span class="px-2 py-0.5 rounded text-[10px] font-mono bg-white/5 border border-white/10 text-slate-300"
                    x-show="$store.characters.jsonPreview.char.basics?.alignment"
                    x-text="$store.characters.jsonPreview.char.basics?.alignment"></span>

                  <!-- Raza -->
                  <span class="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/15 border border-amber-500/30 text-amber-300"
                    x-show="$store.characters.jsonPreview.char.basics?.race"
                    x-text="$store.characters.jsonPreview.char.basics?.race"></span>
                </div>

                <!-- Concepto / Frase -->
                <p class="text-[11px] text-text-muted italic line-clamp-2 pt-1 border-t border-white/5 mt-1"
                  x-show="$store.characters.jsonPreview.char.basics?.concept"
                  x-text="'“' + $store.characters.jsonPreview.char.basics.concept + '”'"></p>
              </div>
            </div>

            <!-- Resumen Estadístico de Módulos Incluidos -->
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div class="p-2.5 rounded-lg bg-white/5 border border-white/10 flex items-center gap-2">
                <i data-lucide="zap" class="w-4 h-4 text-accent-gold shrink-0"></i>
                <div class="min-w-0">
                  <span class="text-[10px] text-slate-400 block font-mono">Habilidades</span>
                  <span class="text-xs font-bold text-white font-mono"
                    x-text="($store.characters.jsonPreview.char.skills?.length || 0) + ' registradas'"></span>
                </div>
              </div>

              <div class="p-2.5 rounded-lg bg-white/5 border border-white/10 flex items-center gap-2">
                <i data-lucide="sword" class="w-4 h-4 text-accent-ruby shrink-0"></i>
                <div class="min-w-0">
                  <span class="text-[10px] text-slate-400 block font-mono">Equipamiento</span>
                  <span class="text-xs font-bold text-white font-mono"
                    x-text="($store.characters.jsonPreview.char.weapons?.length || 0) + ' armas/ítems'"></span>
                </div>
              </div>

              <div class="p-2.5 rounded-lg bg-white/5 border border-white/10 flex items-center gap-2">
                <i data-lucide="users" class="w-4 h-4 text-emerald-400 shrink-0"></i>
                <div class="min-w-0">
                  <span class="text-[10px] text-slate-400 block font-mono">Vínculos Sociales</span>
                  <span class="text-xs font-bold text-white font-mono"
                    x-text="($store.characters.jsonPreview.char.social?.relations?.length || 0) + ' relaciones'"></span>
                </div>
              </div>

              <div class="p-2.5 rounded-lg bg-white/5 border border-white/10 flex items-center gap-2">
                <i data-lucide="gauge" class="w-4 h-4 text-accent-cyan shrink-0"></i>
                <div class="min-w-0">
                  <span class="text-[10px] text-slate-400 block font-mono">Power-Scaling</span>
                  <span class="text-xs font-bold text-white font-mono truncate block"
                    x-text="$store.characters.jsonPreview.char.powerScaling?.tier || 'No asignado'"></span>
                </div>
              </div>
            </div>

            <!-- Panel de Resolución de Conflictos -->
            <template x-if="$store.characters.jsonPreview.existingMatch">
              <div class="p-4 rounded-xl bg-amber-950/25 border-2 border-amber-500/50 space-y-3 shadow-lg">
                <div class="flex items-start gap-2.5">
                  <div class="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0 mt-0.5">
                    <i data-lucide="alert-triangle" class="w-4 h-4 text-amber-400"></i>
                  </div>
                  <div class="space-y-1">
                    <h4 class="text-xs font-bold text-amber-300 font-mono tracking-wide">
                      COINCIDENCIA ENCONTRADA EN EL ROSTER
                    </h4>
                    <p class="text-[11px] text-slate-300 leading-relaxed">
                      Ya existe una ficha guardada llamada <strong class="text-white" x-text="'“' + $store.characters.jsonPreview.existingMatch.name + '”'"></strong> en tu catálogo local.
                    </p>
                  </div>
                </div>

                <!-- Botones de Acción para Conflicto -->
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  <!-- Opción A: Sobrescribir -->
                  <button type="button" @click="$store.characters.confirmImportOverwrite()"
                    class="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/60 text-amber-200 font-mono font-bold text-xs transition-all cursor-pointer shadow-sm hover:scale-[1.01]">
                    <i data-lucide="rotate-ccw" class="w-4 h-4 text-amber-300"></i>
                    <span>Sobrescribir Ficha Existente</span>
                  </button>

                  <!-- Opción B: Importar como Nueva -->
                  <button type="button" @click="$store.characters.confirmImportAsNew()"
                    class="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-accent-cyan/20 hover:bg-accent-cyan/30 border border-accent-cyan/60 text-accent-cyan font-mono font-bold text-xs transition-all cursor-pointer shadow-sm hover:scale-[1.01]">
                    <i data-lucide="copy-plus" class="w-4 h-4 text-accent-cyan"></i>
                    <span>Importar como Nueva (Copia)</span>
                  </button>
                </div>
              </div>
            </template>

            <!-- Sin conflicto: Importación directa -->
            <template x-if="!$store.characters.jsonPreview.existingMatch">
              <div class="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/40 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div class="flex items-center gap-2 text-xs text-emerald-300 font-mono">
                  <i data-lucide="check-circle-2" class="w-4.5 h-4.5 text-emerald-400 shrink-0"></i>
                  <span>Ficha lista: No existen conflictos de identidad en tu base de datos.</span>
                </div>
                <button type="button" @click="$store.characters.confirmImportAsNew()"
                  class="w-full sm:w-auto px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-mono font-extrabold text-xs transition-all cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.3)] shrink-0 flex items-center justify-center gap-1.5">
                  <i data-lucide="download" class="w-4 h-4"></i>
                  <span>Confirmar e Importar</span>
                </button>
              </div>
            </template>

          </div>
        </template>

        <!-- ═════════════════════════════════════════════════════════
             CASO 2: PAQUETE DE RESPALDO DE ROSTER COMPLETO
             ═════════════════════════════════════════════════════════ -->
        <template x-if="$store.characters.jsonPreview.isRoster">
          <div class="space-y-4">
            <!-- Header Roster / Folder Info -->
            <div class="p-4 rounded-xl border space-y-2"
              :class="$store.characters.jsonPreview.isFolderBackup ? 'border-accent-cyan/40 bg-accent-cyan/5' : 'border-accent-gold/40 bg-accent-gold/5'">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <i :data-lucide="$store.characters.jsonPreview.isFolderBackup ? 'folder-kanban' : 'boxes'"
                    class="w-5 h-5"
                    :class="$store.characters.jsonPreview.isFolderBackup ? 'text-accent-cyan' : 'text-accent-gold'"></i>
                  <h3 class="font-hud font-bold text-sm text-parchment-cream uppercase tracking-wider"
                    x-text="$store.characters.jsonPreview.isFolderBackup ? ('Paquete de Carpeta: ' + ($store.characters.jsonPreview.folderInfo?.name || 'Colección')) : 'Paquete de Respaldo de Roster'">
                  </h3>
                </div>
                <span class="px-2 py-0.5 rounded border font-mono text-xs font-bold"
                  :class="$store.characters.jsonPreview.isFolderBackup ? 'bg-accent-cyan/20 border-accent-cyan/40 text-accent-cyan' : 'bg-accent-gold/20 border-accent-gold/40 text-accent-gold'"
                  x-text="($store.characters.jsonPreview.characters?.length || 0) + ' Personajes'"></span>
              </div>
              <p class="text-xs text-slate-300 leading-relaxed"
                x-text="$store.characters.jsonPreview.isFolderBackup
                  ? ('Colección modular de fichas agrupada bajo la carpeta «' + ($store.characters.jsonPreview.folderInfo?.name || 'Colección') + '». Al importarse se vincularán a esta categoría.')
                  : ('Este archivo contiene una colección completa con múltiples fichas' + ($store.characters.jsonPreview.folders?.length ? ' y ' + $store.characters.jsonPreview.folders.length + ' carpetas.' : '.'))">
              </p>
            </div>

            <!-- Lista de Fichas Incluidas en el Backup (Scrollable) -->
            <div class="space-y-1.5">
              <div class="flex items-center justify-between px-1">
                <span class="text-[11px] font-mono text-slate-400 block">Fichas contenidas en la importación:</span>
                <span class="text-[10px] font-mono text-cyan-400 font-bold"
                  x-text="\`\${$store.characters.jsonPreview.characters?.length || 0} detectadas\`"></span>
              </div>
              <div class="max-h-56 overflow-y-auto space-y-1.5 p-1 bg-black/40 rounded-xl border border-white/10 custom-scrollbar">
                <template x-for="(charItem, idx) in $store.characters.jsonPreview.characters" :key="idx">
                  <div class="flex items-center justify-between p-2 rounded-lg bg-white/5 border text-xs hover:border-white/20 transition-colors"
                    :class="$store.characters.list.some(c => (c.name || '').trim().toLowerCase() === (charItem.name || '').trim().toLowerCase()) ? 'border-amber-500/40 bg-amber-950/10' : 'border-white/5'">
                    <div class="flex items-center gap-2.5 min-w-0">
                      <template x-if="charItem.basics?.avatarDataUrl">
                        <img :src="charItem.basics.avatarDataUrl" class="w-8 h-8 rounded-lg object-cover border border-white/20 shrink-0 shadow-sm" />
                      </template>
                      <template x-if="!charItem.basics?.avatarDataUrl">
                        <div class="w-8 h-8 rounded-lg bg-white/10 border border-white/10 flex items-center justify-center shrink-0 text-slate-400">
                          <i data-lucide="user" class="w-4 h-4"></i>
                        </div>
                      </template>
                      <div class="min-w-0">
                        <div class="flex items-center gap-1.5">
                          <span class="font-bold text-white truncate" x-text="charItem.name || 'Sin Nombre'"></span>
                          <span x-show="charItem._sourceFile"
                            class="px-1.5 py-0.2 rounded bg-cyan-500/15 border border-cyan-400/30 text-[9px] font-mono text-cyan-300 truncate max-w-[130px]"
                            :title="\`Archivo de origen: \${charItem._sourceFile}\`"
                            x-text="charItem._sourceFile"></span>
                          <span x-show="$store.characters.list.some(c => (c.name || '').trim().toLowerCase() === (charItem.name || '').trim().toLowerCase())"
                            class="px-1.5 py-0.2 rounded bg-amber-500/20 border border-amber-500/40 text-[8.5px] font-mono text-amber-300 shrink-0"
                            title="Ya existe una ficha con este nombre (se creará una copia si seleccionas Fusionar)">
                            Existe copia
                          </span>
                        </div>
                        <div class="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono truncate mt-0.5">
                          <span x-text="charItem.basics?.archetype || 'Aventurero'"></span>
                          <template x-if="charItem.powerScaling?.tier">
                            <span class="text-amber-300 font-bold" x-text="\`· Tier \${charItem.powerScaling.tier}\`"></span>
                          </template>
                        </div>
                      </div>
                    </div>
                    <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-white/10 text-slate-300 shrink-0 font-bold"
                      x-text="(charItem.skills?.length || 0) + ' hab.'"></span>
                  </div>
                </template>
              </div>
            </div>

            <!-- Modos de Importación del Roster -->
            <div class="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-2.5">
              <span class="text-xs font-mono font-bold text-parchment-cream block">¿Cómo deseas importar este paquete?</span>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button type="button" @click="$store.characters.confirmImportRoster('merge')"
                  class="p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1"
                  :class="$store.characters.jsonPreview.rosterImportMode === 'merge' ? 'bg-accent-cyan/15 border-accent-cyan text-accent-cyan shadow-sm font-semibold' : 'bg-white/5 border-white/15 text-slate-300 hover:border-white/25'">
                  <span class="text-xs font-bold font-mono">1. Fusionar con Roster</span>
                  <span class="text-[10px] text-slate-400 font-sans">Añade estas fichas sin borrar tus personajes actuales.</span>
                </button>

                <button type="button" @click="$store.characters.confirmImportRoster('replace')"
                  class="p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1"
                  :class="$store.characters.jsonPreview.rosterImportMode === 'replace' ? 'bg-accent-ruby/20 border-accent-ruby text-rose-300 shadow-sm font-semibold' : 'bg-white/5 border-white/15 text-slate-300 hover:border-accent-ruby/40'">
                  <span class="text-xs font-bold font-mono">2. Reemplazar Roster</span>
                  <span class="text-[10px] text-slate-400 font-sans">Sustituye todo el catálogo actual por este respaldo.</span>
                </button>
              </div>
            </div>

          </div>
        </template>

        <!-- ═════════════════════════════════════════════════════════
             INSPECTOR DE CÓDIGO JSON CRUDO (ACCORDEÓN INTERACTIVO)
             ═════════════════════════════════════════════════════════ -->
        <div class="border-t border-white/10 pt-3 space-y-2">
          <div class="flex items-center justify-between">
            <button type="button" @click="$store.characters.jsonPreview.showRaw = !$store.characters.jsonPreview.showRaw"
              class="text-xs font-mono text-slate-400 hover:text-accent-cyan flex items-center gap-1.5 transition-colors cursor-pointer">
              <i data-lucide="code-2" class="w-3.5 h-3.5"></i>
              <span x-text="$store.characters.jsonPreview.showRaw ? 'Ocultar Código JSON Crudo' : 'Inspeccionar Código JSON Crudo'"></span>
              <i data-lucide="chevron-down" class="w-3 h-3 transition-transform duration-200"
                :class="$store.characters.jsonPreview.showRaw ? 'rotate-180' : ''"></i>
            </button>

            <button type="button" x-show="$store.characters.jsonPreview.showRaw"
              @click="$store.characters.copyPreviewRawJSON()"
              class="text-[10px] font-mono px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-slate-200 flex items-center gap-1 transition-all cursor-pointer">
              <i data-lucide="copy" class="w-3 h-3"></i>
              <span x-text="$store.characters.jsonPreview.copiedRaw ? '¡Copiado!' : 'Copiar JSON'"></span>
            </button>
          </div>

          <div x-show="$store.characters.jsonPreview.showRaw" x-transition class="mt-2">
            <pre
              class="p-3 rounded-xl bg-black/80 border border-white/15 font-mono text-[11px] text-emerald-400 overflow-x-auto max-h-48 custom-scrollbar leading-relaxed"
              x-text="$store.characters.jsonPreview.rawJSON"></pre>
          </div>
        </div>

      </div>

      <!-- Footer de Acciones del Modal -->
      <div class="border-t border-white/10 pt-3 flex items-center justify-between gap-3 shrink-0">
        <button type="button" @click="$store.characters.closeImportPreview()"
          class="header-btn-ghost px-4 py-2 border border-white/15 hover:border-white/30 text-xs font-mono text-slate-300 hover:text-white rounded-xl transition-all cursor-pointer">
          Cancelar / Descartar
        </button>

        <span class="text-[10px] font-mono text-slate-500 hidden sm:inline">
          Formato JSON Nativo • Cero pérdida de resolución
        </span>
      </div>

    </div>
  </template>
</div>
`;
}
