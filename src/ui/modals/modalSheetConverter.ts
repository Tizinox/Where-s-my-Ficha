/**
 * @file src/ui/modals/modalSheetConverter.ts
 * Modal conversor bidireccional sin pérdida entre Ficha A (Simple) y Ficha B (Compleja).
 */

export function renderModalSheetConverter(): string {
  return `<!-- ==============================================================
     MODAL CONVERSOR DE FICHA (FICHA A SIMPLE ⇄ FICHA B COMPLEJA)
     ============================================================== -->
<div id="sheet-converter-modal"
  x-data="{
    get summary() {
      const m = $store.characters.sheetConverterModal;
      if (!m?.isOpen) return null;
      return $store.characters.getConversionSummary(m.charId, m.targetType);
    },
    get targetChar() {
      const m = $store.characters.sheetConverterModal;
      if (!m?.charId) return $store.characters.active;
      return $store.characters.list.find(c => c.id === m.charId) || $store.characters.active;
    }
  }"
  x-show="$store.characters.sheetConverterModal?.isOpen"
  x-cloak
  x-transition:enter="transition ease-out duration-150"
  x-transition:enter-start="opacity-0"
  x-transition:enter-end="opacity-100"
  x-transition:leave="transition ease-in duration-100"
  x-transition:leave-start="opacity-100"
  x-transition:leave-end="opacity-0"
  class="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto"
  role="dialog"
  aria-modal="true"
  aria-labelledby="modal-sheet-converter-title"
  @keydown.escape.window="$store.characters.closeSheetConverterModal()"
  @click.self="$store.characters.closeSheetConverterModal()">

  <div class="w-full max-w-2xl border shadow-2xl overflow-hidden my-auto"
    style="background-color: var(--bg-panel); border-color: var(--border-custom); color: var(--text-primary); outline: 1px solid var(--border-subtle); outline-offset: -4px;">

    <!-- Cabecera -->
    <div class="flex items-start justify-between gap-4 px-6 py-4 border-b"
      style="border-color: var(--border-subtle); background-color: var(--bg-panel-elevated);">
      <div class="min-w-0">
        <span class="block text-[10px] font-mono uppercase tracking-widest mb-1"
          style="color: var(--accent);">Conversor Bidireccional · Sin Pérdida</span>
        <h2 id="modal-sheet-converter-title" class="text-lg sm:text-xl font-bold tracking-wide truncate"
          style="font-family: var(--font-display, var(--font-title, serif)); color: var(--text-primary);">
          Convertir Formato de Ficha
        </h2>
        <p class="text-xs mt-0.5 truncate" style="color: var(--text-secondary);">
          Personaje: <strong class="font-semibold" style="color: var(--text-primary);" x-text="summary?.charName || 'Sin Nombre'"></strong>
        </p>
      </div>
      <button type="button"
        @click="$store.characters.closeSheetConverterModal()"
        class="p-1.5 border cursor-pointer transition-colors hover:opacity-80 shrink-0"
        style="border-color: var(--border-subtle); background-color: var(--bg-panel); color: var(--text-secondary);"
        title="Cerrar (Esc)"
        aria-label="Cerrar conversor de ficha">
        <i data-lucide="x" class="w-4 h-4"></i>
      </button>
    </div>

    <!-- Cuerpo del Conversor -->
    <div class="p-6 space-y-5">

      <!-- Flujo Origen -> Destino -->
      <div class="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] items-stretch gap-3">
        <!-- Origen -->
        <div class="p-3.5 border space-y-1.5"
          style="background-color: var(--bg-panel-elevated); border-color: var(--border-subtle);">
          <div class="flex items-center justify-between gap-2">
            <span class="text-[10px] font-mono uppercase tracking-wider" style="color: var(--text-secondary);">Formato Actual</span>
            <span class="text-[10px] font-mono font-bold px-2 py-0.5 border"
              style="border-color: var(--border-custom); color: var(--text-secondary);"
              x-text="summary ? $store.characters.getSheetTypeMeta(summary.sourceType).code : 'Ficha A'"></span>
          </div>
          <p class="text-sm font-bold"
            style="font-family: var(--font-wiki-serif, var(--font-display, serif)); color: var(--text-primary);"
            x-text="summary ? $store.characters.getSheetTypeMeta(summary.sourceType).name : 'Ficha A · Simple'"></p>
          <p class="text-[11px] leading-relaxed" style="color: var(--text-secondary);"
            x-text="summary ? $store.characters.getSheetTypeMeta(summary.sourceType).layoutHint : ''"></p>
        </div>

        <!-- Flecha -->
        <div class="flex items-center justify-center">
          <div class="w-9 h-9 border flex items-center justify-center shrink-0"
            style="border-color: var(--accent); background-color: var(--accent-dim); color: var(--accent);">
            <i data-lucide="arrow-right-left" class="w-4 h-4"></i>
          </div>
        </div>

        <!-- Destino -->
        <div class="p-3.5 border space-y-1.5"
          style="background-color: var(--bg-panel-elevated); border-color: var(--accent);">
          <div class="flex items-center justify-between gap-2">
            <span class="text-[10px] font-mono uppercase tracking-wider font-semibold" style="color: var(--accent);">Nuevo Formato</span>
            <span class="text-[10px] font-mono font-bold px-2 py-0.5 border"
              style="border-color: var(--accent); background-color: var(--accent-dim); color: var(--accent);"
              x-text="summary ? $store.characters.getSheetTypeMeta(summary.targetType).code : 'Ficha B'"></span>
          </div>
          <p class="text-sm font-bold"
            style="font-family: var(--font-wiki-serif, var(--font-display, serif)); color: var(--text-primary);"
            x-text="summary ? $store.characters.getSheetTypeMeta(summary.targetType).name : 'Ficha B · Compleja'"></p>
          <p class="text-[11px] leading-relaxed" style="color: var(--text-secondary);"
            x-text="summary ? $store.characters.getSheetTypeMeta(summary.targetType).layoutHint : ''"></p>
        </div>
      </div>

      <!-- Garantía de Cero Pérdida -->
      <div class="p-3.5 border flex items-start gap-3"
        style="background-color: rgba(16, 185, 129, 0.08); border-color: rgba(16, 185, 129, 0.38);">
        <i data-lucide="shield-check" class="w-5 h-5 text-emerald-400 shrink-0 mt-0.5"></i>
        <div class="space-y-1 text-xs leading-relaxed">
          <p class="font-bold text-emerald-300">
            Conversión 100 % reversible · 0 datos eliminados
          </p>
          <p style="color: var(--text-secondary);"
            x-text="summary?.targetType === 'classic'
              ? 'Se activan todas las pestañas modulares de la Ficha B (Cuerpo, Mente, Social, Creencias, Prioridades, Habilidades detalladas, Arsenal, Power-Scaling y Extras) manteniendo intacto todo lo que cargaste en la Ficha A.'
              : 'La ficha pasa al formato compacto de 3 columnas (Ficha A). Todos los detalles exclusivos de la Ficha B (ejes psicológicos, relaciones, facciones, hax, hazañas y pestañas personalizadas) permanecen guardados intactos y reaparecen intactos si vuelves a Ficha B.'"></p>
        </div>
      </div>

      <!-- Resumen del contenido detectado -->
      <div class="space-y-2.5">
        <div class="flex flex-wrap items-center gap-2 text-[11px] font-mono">
          <span class="px-2.5 py-1 border" style="border-color: var(--border-subtle); background-color: var(--bg-panel-elevated); color: var(--text-primary);">
            Habilidades: <strong x-text="summary?.skillsCount ?? 0"></strong>
          </span>
          <span class="px-2.5 py-1 border" style="border-color: var(--border-subtle); background-color: var(--bg-panel-elevated); color: var(--text-primary);">
            Armas: <strong x-text="summary?.weaponsCount ?? 0"></strong>
          </span>
          <span class="px-2.5 py-1 border" style="border-color: var(--border-subtle); background-color: var(--bg-panel-elevated); color: var(--text-primary);">
            Citas: <strong x-text="summary?.quotesCount ?? 0"></strong>
          </span>
          <span class="px-2.5 py-1 border" style="border-color: var(--border-subtle); background-color: var(--bg-panel-elevated); color: var(--text-primary);">
            Galería: <strong x-text="summary?.galleryCount ?? 0"></strong>
          </span>
          <span x-show="(summary?.customTabsCount ?? 0) > 0"
            class="px-2.5 py-1 border" style="border-color: var(--accent); background-color: var(--accent-dim); color: var(--accent);">
            Pestañas Custom: <strong x-text="summary?.customTabsCount ?? 0"></strong>
          </span>
        </div>

        <!-- Secciones detalladas preservadas -->
        <template x-if="summary && summary.preservedSections && summary.preservedSections.length > 0">
          <div class="p-3 border space-y-2"
            style="border-color: var(--border-subtle); background-color: var(--bg-panel-elevated);">
            <p class="text-[10px] font-mono uppercase tracking-wider" style="color: var(--text-secondary);">
              Secciones avanzadas detectadas y preservadas intactas:
            </p>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              <template x-for="sec in summary.preservedSections" :key="sec.key">
                <div class="px-2.5 py-1.5 border flex items-center justify-between gap-2 text-[11px]"
                  style="border-color: var(--border-subtle); background-color: var(--bg-panel);">
                  <span class="font-semibold truncate" style="color: var(--text-primary);" x-text="sec.label"></span>
                  <span class="font-mono text-[10px] shrink-0" style="color: var(--accent);" x-text="sec.detail"></span>
                </div>
              </template>
            </div>
          </div>
        </template>

        <!-- Notas de sincronización -->
        <template x-if="summary && summary.syncNotes && summary.syncNotes.length > 0">
          <ul class="space-y-1 text-[11px] pl-1" style="color: var(--text-secondary);">
            <template x-for="(note, nIdx) in summary.syncNotes" :key="nIdx">
              <li class="flex items-start gap-2">
                <span style="color: var(--accent);">•</span>
                <span x-text="note"></span>
              </li>
            </template>
          </ul>
        </template>
      </div>

      <!-- Aviso si la ficha está bloqueada -->
      <div x-show="targetChar?.isLocked"
        class="p-3 border text-xs flex items-center gap-2.5"
        style="border-color: rgba(245, 158, 11, 0.45); background-color: rgba(245, 158, 11, 0.1); color: #fcd34d;">
        <i data-lucide="lock" class="w-4 h-4 shrink-0"></i>
        <span>Esta ficha está bloqueada contra edición. Puedes usar <strong>"Convertir en una copia"</strong> para probar el nuevo formato sin desbloquearla ni tocar la original.</span>
      </div>

    </div>

    <!-- Pie de Acciones -->
    <div class="px-6 py-4 border-t flex items-center justify-between flex-wrap gap-3"
      style="border-color: var(--border-subtle); background-color: var(--bg-panel-elevated);">
      <button type="button"
        @click="$store.characters.closeSheetConverterModal()"
        class="souls-btn text-xs py-2 px-3.5 cursor-pointer">
        Cancelar
      </button>

      <div class="flex items-center gap-2 flex-wrap">
        <button id="btn-convert-sheet-copy" type="button"
          @click="$store.characters.confirmSheetConversion({ createCopy: true })"
          class="souls-btn text-xs py-2 px-3.5 cursor-pointer inline-flex items-center gap-1.5"
          title="Crea una copia independiente ya convertida y deja la ficha actual intacta">
          <i data-lucide="copy-plus" class="w-3.5 h-3.5"></i>
          <span>Convertir en una copia</span>
        </button>

        <button id="btn-convert-sheet-confirm" type="button"
          :disabled="targetChar?.isLocked"
          :class="targetChar?.isLocked ? 'opacity-45 cursor-not-allowed' : 'cursor-pointer'"
          @click="$store.characters.confirmSheetConversion({ createCopy: false })"
          class="souls-btn souls-btn-primary text-xs py-2 px-4 inline-flex items-center gap-1.5 font-semibold">
          <i data-lucide="refresh-cw" class="w-3.5 h-3.5"></i>
          <span x-text="summary ? 'Convertir a ' + $store.characters.getSheetTypeMeta(summary.targetType).code : 'Convertir ficha'"></span>
        </button>
      </div>
    </div>

  </div>
</div>`;
}
