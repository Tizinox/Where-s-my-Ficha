/**
 * @file src/ui/modals/modalDiscord.ts
 * Modal unificado y simplificado de exportación de ficha:
 *  - Pestaña principal: Imagen PNG legible (Completa / Tarjeta, Oscuro / Papel Claro)
 *  - Pestaña secundaria: Texto formateado para Discord
 *  - Pestaña secundaria: Respaldo JSON de la ficha
 * Nota: conserva `id="discord-modal"` por compatibilidad con el montaje y tests.
 */

export function renderModalDiscord(): string {
  return `<!-- ==============================================================
     MODAL UNIFICADO DE EXPORTACIÓN DE FICHA (IMAGEN PNG / DISCORD / JSON)
     ============================================================== -->
<div id="discord-modal"
  x-data
  x-show="$store.app.showDiscordModal"
  x-cloak
  x-transition:enter="transition ease-out duration-150"
  x-transition:enter-start="opacity-0"
  x-transition:enter-end="opacity-100"
  x-transition:leave="transition ease-in duration-100"
  x-transition:leave-start="opacity-100"
  x-transition:leave-end="opacity-0"
  class="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-sm overflow-y-auto"
  role="dialog"
  aria-modal="true"
  aria-labelledby="export-modal-title"
  @keydown.escape.window="$store.app.closeDiscordModal()"
  @click.self="$store.app.closeDiscordModal()">

  <div class="w-full max-w-4xl border overflow-hidden my-auto flex flex-col max-h-[92vh]"
    style="background-color: var(--wiki-bg-canvas, var(--bg-panel)); border-color: var(--wiki-border-strong, var(--border-custom)); color: var(--wiki-text-main, var(--text-primary));">

    <!-- Cabecera del Modal -->
    <div class="flex items-start justify-between gap-4 px-5 py-3.5 border-b shrink-0"
      style="border-color: var(--wiki-border, var(--border-subtle)); background-color: var(--wiki-bg-elevated, var(--bg-panel-elevated));">
      <div class="min-w-0">
        <span class="block text-[11px] font-mono uppercase tracking-widest mb-0.5"
          style="color: var(--wiki-accent, var(--accent));">
          Exportar Ficha
        </span>
        <div class="flex items-center gap-2.5 flex-wrap">
          <h2 id="export-modal-title" class="text-lg sm:text-xl font-bold truncate"
            style="font-family: var(--font-wiki-serif, var(--font-display, serif)); color: var(--wiki-text-main, var(--text-primary));"
            x-text="$store.app.exportTargetChar?.name || 'Personaje sin nombre'">
          </h2>
          <span x-show="$store.app.exportTargetChar?.meta?.universe"
            class="text-[11px] font-mono px-2 py-0.5 border"
            style="border-color: var(--wiki-border, var(--border-subtle)); color: var(--wiki-text-muted, var(--text-secondary)); background-color: var(--wiki-bg-canvas, var(--bg-panel));"
            x-text="$store.app.exportTargetChar?.meta?.universe || ''">
          </span>
        </div>
      </div>

      <button type="button"
        @click="$store.app.closeDiscordModal()"
        class="p-1.5 border cursor-pointer transition-opacity hover:opacity-75 shrink-0"
        style="border-color: var(--wiki-border, var(--border-subtle)); background-color: var(--wiki-bg-canvas, var(--bg-panel)); color: var(--wiki-text-muted, var(--text-secondary));"
        title="Cerrar (Esc)"
        aria-label="Cerrar ventana de exportación">
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>

    <!-- Selector de Formato Principal (PDF para Ficha B / Imagen PNG para Ficha A) -->
    <div class="px-5 pt-2.5 border-b flex items-center gap-1 overflow-x-auto shrink-0"
      style="border-color: var(--wiki-border, var(--border-subtle)); background-color: var(--wiki-bg-elevated, var(--bg-panel-elevated));"
      role="tablist"
      aria-label="Formato de exportación">

      <button type="button"
        role="tab"
        :aria-selected="$store.app.exportModalTab === 'pdf'"
        @click="$store.app.setExportModalTab('pdf')"
        class="px-3.5 py-2 text-xs sm:text-sm font-medium border border-b-0 flex items-center gap-2 cursor-pointer transition-colors whitespace-nowrap"
        :style="$store.app.exportModalTab === 'pdf'
          ? 'background-color: var(--wiki-bg-canvas, var(--bg-panel)); border-color: var(--wiki-border-strong, var(--border-custom)); color: var(--wiki-accent, var(--accent)); border-top: 2px solid var(--wiki-accent, var(--accent)); margin-bottom: -1px;'
          : 'background-color: transparent; border-color: transparent; color: var(--wiki-text-muted, var(--text-secondary));'">
        <svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <path d="M8 13h2a2 2 0 0 1 0 4H8v-4z" />
          <path d="M14 13v4" />
        </svg>
        <span>PDF con Imágenes</span>
        <span x-show="$store.app.exportTargetChar?.sheetType === 'classic'"
          class="text-[10px] font-mono uppercase px-1.5 py-0.5 border"
          style="border-color: var(--wiki-border, var(--border-subtle)); color: var(--wiki-accent, var(--accent));">
          Ficha B
        </span>
      </button>

      <button type="button"
        role="tab"
        :aria-selected="$store.app.exportModalTab === 'image'"
        @click="$store.app.setExportModalTab('image')"
        class="px-3.5 py-2 text-xs sm:text-sm font-medium border border-b-0 flex items-center gap-2 cursor-pointer transition-colors whitespace-nowrap"
        :style="$store.app.exportModalTab === 'image'
          ? 'background-color: var(--wiki-bg-canvas, var(--bg-panel)); border-color: var(--wiki-border-strong, var(--border-custom)); color: var(--wiki-accent, var(--accent)); border-top: 2px solid var(--wiki-accent, var(--accent)); margin-bottom: -1px;'
          : 'background-color: transparent; border-color: transparent; color: var(--wiki-text-muted, var(--text-secondary));'">
        <svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
        <span>Imagen PNG</span>
        <span x-show="$store.app.exportTargetChar?.sheetType !== 'classic'"
          class="text-[10px] font-mono uppercase px-1.5 py-0.5 border"
          style="border-color: var(--wiki-border, var(--border-subtle)); color: var(--wiki-accent, var(--accent));">
          Recomendado
        </span>
      </button>

      <button type="button"
        role="tab"
        :aria-selected="$store.app.exportModalTab === 'discord'"
        @click="$store.app.setExportModalTab('discord')"
        class="px-3.5 py-2 text-xs sm:text-sm font-medium border border-b-0 flex items-center gap-2 cursor-pointer transition-colors whitespace-nowrap"
        :style="$store.app.exportModalTab === 'discord'
          ? 'background-color: var(--wiki-bg-canvas, var(--bg-panel)); border-color: var(--wiki-border-strong, var(--border-custom)); color: var(--wiki-accent, var(--accent)); border-top: 2px solid var(--wiki-accent, var(--accent)); margin-bottom: -1px;'
          : 'background-color: transparent; border-color: transparent; color: var(--wiki-text-muted, var(--text-secondary));'">
        <svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        <span>Texto Discord</span>
      </button>

      <button type="button"
        role="tab"
        :aria-selected="$store.app.exportModalTab === 'json'"
        @click="$store.app.setExportModalTab('json')"
        class="px-3.5 py-2 text-xs sm:text-sm font-medium border border-b-0 flex items-center gap-2 cursor-pointer transition-colors whitespace-nowrap"
        :style="$store.app.exportModalTab === 'json'
          ? 'background-color: var(--wiki-bg-canvas, var(--bg-panel)); border-color: var(--wiki-border-strong, var(--border-custom)); color: var(--wiki-accent, var(--accent)); border-top: 2px solid var(--wiki-accent, var(--accent)); margin-bottom: -1px;'
          : 'background-color: transparent; border-color: transparent; color: var(--wiki-text-muted, var(--text-secondary));'">
        <svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="12" y1="18" x2="12" y2="12" />
          <polyline points="9 15 12 12 15 15" />
        </svg>
        <span>Archivo JSON</span>
      </button>
    </div>

    <!-- ============================================================
         PESTAÑA 0: PDF MULTIPÁGINA ORGANIZADO CON IMÁGENES (FICHA B)
         ============================================================ -->
    <div x-show="$store.app.exportModalTab === 'pdf'" class="flex-1 flex flex-col min-h-0">

      <!-- Controles de diseño del PDF -->
      <div class="px-5 py-3 border-b flex flex-wrap items-center justify-between gap-3 shrink-0"
        style="border-color: var(--wiki-border, var(--border-subtle)); background-color: var(--wiki-bg-canvas, var(--bg-panel));">

        <div class="flex flex-wrap items-center gap-3">
          <!-- Tema del PDF -->
          <div class="flex items-center gap-1.5">
            <span class="text-xs font-mono uppercase tracking-wider"
              style="color: var(--wiki-text-muted, var(--text-secondary));">
              Papel:
            </span>
            <div class="inline-flex border" style="border-color: var(--wiki-border-strong, var(--border-custom));">
              <button type="button"
                @click="$store.app.setExportPdfTheme('light')"
                class="px-2.5 py-1 text-xs font-medium cursor-pointer transition-colors"
                :style="$store.app.exportPdfTheme === 'light'
                  ? 'background-color: var(--wiki-accent, var(--accent)); color: #111115;'
                  : 'background-color: var(--wiki-bg-elevated, var(--bg-panel-elevated)); color: var(--wiki-text-main, var(--text-primary));'">
                Editorial Claro
              </button>
              <button type="button"
                @click="$store.app.setExportPdfTheme('dark')"
                class="px-2.5 py-1 text-xs font-medium cursor-pointer transition-colors border-l"
                :style="$store.app.exportPdfTheme === 'dark'
                  ? 'border-color: var(--wiki-border-strong, var(--border-custom)); background-color: var(--wiki-accent, var(--accent)); color: #111115;'
                  : 'border-color: var(--wiki-border-strong, var(--border-custom)); background-color: var(--wiki-bg-elevated, var(--bg-panel-elevated)); color: var(--wiki-text-main, var(--text-primary));'">
                Oscuro
              </button>
            </div>
          </div>

          <!-- Incluir imágenes y galería -->
          <label class="flex items-center gap-2 text-xs cursor-pointer select-none px-2.5 py-1 border"
            style="border-color: var(--wiki-border, var(--border-subtle)); background-color: var(--wiki-bg-elevated, var(--bg-panel-elevated)); color: var(--wiki-text-main, var(--text-primary));">
            <input type="checkbox"
              :checked="$store.app.exportPdfIncludeImages"
              @change="$store.app.toggleExportPdfImages()" />
            <span>Incluir retratos, galería e ítems</span>
          </label>
        </div>

        <!-- Contador de páginas A4 + refresco -->
        <div class="flex items-center gap-2 text-xs font-mono"
          style="color: var(--wiki-text-muted, var(--text-secondary));">
          <span x-show="$store.app.exportPdfPageCount > 0 && !$store.app.exportPdfLoading"
            x-text="'A4 · ' + $store.app.exportPdfPageCount + ($store.app.exportPdfPageCount === 1 ? ' página' : ' páginas')">
          </span>
          <button type="button"
            @click="$store.app.refreshExportPdfPreview()"
            :disabled="$store.app.exportPdfLoading"
            class="souls-btn !px-2 !py-1 text-xs"
            title="Regenerar páginas del PDF">
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <polyline points="23 4 23 10 17 10" />
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
            </svg>
            <span class="hidden sm:inline">Actualizar</span>
          </button>
        </div>
      </div>

      <!-- Vista Previa Multipágina del PDF -->
      <div class="flex-1 overflow-y-auto p-4 sm:p-5 min-h-[240px]"
        style="background-color: var(--wiki-bg-outer, #0d0d10);">

        <div x-show="$store.app.exportPdfLoading"
          class="flex flex-col items-center justify-center py-16 gap-3 text-sm"
          style="color: var(--wiki-text-muted, var(--text-secondary));">
          <div class="w-7 h-7 border-2 rounded-full animate-spin"
            style="border-color: var(--wiki-border-strong, var(--border-custom)); border-top-color: var(--wiki-accent, var(--accent));">
          </div>
          <span>Maquetando páginas A4 con todas las secciones e imágenes…</span>
        </div>

        <div x-show="!$store.app.exportPdfLoading && $store.app.exportPdfError"
          class="border p-5 text-center space-y-3 max-w-md mx-auto my-8"
          style="background-color: var(--wiki-bg-elevated, var(--bg-panel-elevated)); border-color: var(--wiki-border-strong, var(--border-custom));">
          <p class="text-sm" style="color: var(--wiki-text-main, var(--text-primary));"
            x-text="$store.app.exportPdfError"></p>
          <button type="button" @click="$store.app.refreshExportPdfPreview()" class="souls-btn souls-btn-primary text-xs">
            Reintentar
          </button>
        </div>

        <div x-show="!$store.app.exportPdfLoading && !$store.app.exportPdfError && $store.app.exportPdfPreviews.length > 0"
          class="space-y-4 max-w-2xl mx-auto">
          <template x-for="(pageUrl, pIdx) in $store.app.exportPdfPreviews" :key="pIdx">
            <div class="border p-2"
              style="background-color: var(--wiki-bg-canvas, var(--bg-panel)); border-color: var(--wiki-border-strong, var(--border-custom));">
              <div class="flex items-center justify-between px-2 pb-1.5 text-[11px] font-mono"
                style="color: var(--wiki-text-muted, var(--text-secondary));">
                <span x-text="'Página ' + (pIdx + 1) + ' de ' + $store.app.exportPdfPreviews.length"></span>
                <span>Formato A4</span>
              </div>
              <img :src="pageUrl"
                :alt="'Página ' + (pIdx + 1) + ' del PDF'"
                class="w-full h-auto block border"
                style="border-color: var(--wiki-border, var(--border-subtle));" />
            </div>
          </template>
        </div>
      </div>

      <!-- Barra de Descarga PDF -->
      <div class="px-5 py-3.5 border-t flex flex-wrap items-center justify-between gap-3 shrink-0"
        style="border-color: var(--wiki-border, var(--border-subtle)); background-color: var(--wiki-bg-elevated, var(--bg-panel-elevated));">
        <p class="text-xs" style="color: var(--wiki-text-muted, var(--text-secondary));">
          PDF A4 multipágina con datos organizados por secciones, habilidades, armas y galería sin cortes.
        </p>
        <button type="button"
          @click="$store.app.downloadExportPdf()"
          :disabled="$store.app.exportPdfLoading"
          class="souls-btn souls-btn-primary text-xs sm:text-sm ml-auto">
          <svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          <span>Descargar PDF</span>
        </button>
      </div>
    </div>

    <!-- ============================================================
         PESTAÑA 1: IMAGEN PNG LEGIBLE (POR DEFECTO)
         ============================================================ -->
    <div x-show="$store.app.exportModalTab === 'image'" class="flex-1 flex flex-col min-h-0">

      <!-- Controles simples de diseño de imagen -->
      <div class="px-5 py-3 border-b flex flex-wrap items-center justify-between gap-3 shrink-0"
        style="border-color: var(--wiki-border, var(--border-subtle)); background-color: var(--wiki-bg-canvas, var(--bg-panel));">

        <div class="flex flex-wrap items-center gap-3">
          <!-- Formato: Completa vs Tarjeta -->
          <div class="flex items-center gap-1.5">
            <span class="text-xs font-mono uppercase tracking-wider"
              style="color: var(--wiki-text-muted, var(--text-secondary));">
              Contenido:
            </span>
            <div class="inline-flex border" style="border-color: var(--wiki-border-strong, var(--border-custom));">
              <button type="button"
                @click="$store.app.setExportImagePreset('complete')"
                class="px-2.5 py-1 text-xs font-medium cursor-pointer transition-colors"
                :style="$store.app.exportImagePreset === 'complete'
                  ? 'background-color: var(--wiki-accent, var(--accent)); color: #111115;'
                  : 'background-color: var(--wiki-bg-elevated, var(--bg-panel-elevated)); color: var(--wiki-text-main, var(--text-primary));'">
                Ficha Completa
              </button>
              <button type="button"
                @click="$store.app.setExportImagePreset('compact')"
                class="px-2.5 py-1 text-xs font-medium cursor-pointer transition-colors border-l"
                :style="$store.app.exportImagePreset === 'compact'
                  ? 'border-color: var(--wiki-border-strong, var(--border-custom)); background-color: var(--wiki-accent, var(--accent)); color: #111115;'
                  : 'border-color: var(--wiki-border-strong, var(--border-custom)); background-color: var(--wiki-bg-elevated, var(--bg-panel-elevated)); color: var(--wiki-text-main, var(--text-primary));'">
                Tarjeta Resumida
              </button>
            </div>
          </div>

          <!-- Paleta: Oscuro vs Papel claro -->
          <div class="flex items-center gap-1.5">
            <span class="text-xs font-mono uppercase tracking-wider"
              style="color: var(--wiki-text-muted, var(--text-secondary));">
              Estilo:
            </span>
            <div class="inline-flex border" style="border-color: var(--wiki-border-strong, var(--border-custom));">
              <button type="button"
                @click="$store.app.setExportImageTheme('dark')"
                class="px-2.5 py-1 text-xs font-medium cursor-pointer transition-colors"
                :style="$store.app.exportImageTheme === 'dark'
                  ? 'background-color: var(--wiki-accent, var(--accent)); color: #111115;'
                  : 'background-color: var(--wiki-bg-elevated, var(--bg-panel-elevated)); color: var(--wiki-text-main, var(--text-primary));'">
                Oscuro
              </button>
              <button type="button"
                @click="$store.app.setExportImageTheme('light')"
                class="px-2.5 py-1 text-xs font-medium cursor-pointer transition-colors border-l"
                :style="$store.app.exportImageTheme === 'light'
                  ? 'border-color: var(--wiki-border-strong, var(--border-custom)); background-color: var(--wiki-accent, var(--accent)); color: #111115;'
                  : 'border-color: var(--wiki-border-strong, var(--border-custom)); background-color: var(--wiki-bg-elevated, var(--bg-panel-elevated)); color: var(--wiki-text-main, var(--text-primary));'">
                Papel Claro
              </button>
            </div>
          </div>
        </div>

        <!-- Metadatos + refresco manual -->
        <div class="flex items-center gap-2 text-xs font-mono"
          style="color: var(--wiki-text-muted, var(--text-secondary));">
          <span x-show="$store.app.exportImageMeta.width > 0 && !$store.app.exportImageLoading"
            x-text="$store.app.exportImageMeta.width + '×' + $store.app.exportImageMeta.height + ' px · ~' + $store.app.exportImageMeta.sizeKb + ' KB'">
          </span>
          <button type="button"
            @click="$store.app.refreshExportImagePreview()"
            :disabled="$store.app.exportImageLoading"
            class="souls-btn !px-2 !py-1 text-xs"
            title="Regenerar vista previa">
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <polyline points="23 4 23 10 17 10" />
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
            </svg>
            <span class="hidden sm:inline">Actualizar</span>
          </button>
        </div>
      </div>

      <!-- Vista Previa Instantánea de la Imagen -->
      <div class="flex-1 overflow-y-auto p-4 sm:p-5 min-h-[240px]"
        style="background-color: var(--wiki-bg-outer, #0d0d10);">

        <!-- Estado cargando -->
        <div x-show="$store.app.exportImageLoading"
          class="flex flex-col items-center justify-center py-16 gap-3 text-sm"
          style="color: var(--wiki-text-muted, var(--text-secondary));">
          <div class="w-7 h-7 border-2 rounded-full animate-spin"
            style="border-color: var(--wiki-border-strong, var(--border-custom)); border-top-color: var(--wiki-accent, var(--accent));">
          </div>
          <span>Renderizando ficha legible en alta definición…</span>
        </div>

        <!-- Estado error -->
        <div x-show="!$store.app.exportImageLoading && $store.app.exportImageError"
          class="border p-5 text-center space-y-3 max-w-md mx-auto my-8"
          style="background-color: var(--wiki-bg-elevated, var(--bg-panel-elevated)); border-color: var(--wiki-border-strong, var(--border-custom));">
          <p class="text-sm" style="color: var(--wiki-text-main, var(--text-primary));"
            x-text="$store.app.exportImageError"></p>
          <button type="button" @click="$store.app.refreshExportImagePreview()" class="souls-btn souls-btn-primary text-xs">
            Reintentar
          </button>
        </div>

        <!-- Imagen generada -->
        <div x-show="!$store.app.exportImageLoading && !$store.app.exportImageError && $store.app.exportImagePreviewUrl"
          class="flex justify-center">
          <img
            :src="$store.app.exportImagePreviewUrl"
            :alt="'Imagen exportada de ' + ($store.app.exportTargetChar?.name || 'Ficha')"
            class="max-w-full h-auto block border"
            style="border-color: var(--wiki-border-strong, var(--border-custom));" />
        </div>
      </div>

      <!-- Barra de Acciones PNG -->
      <div class="px-5 py-3.5 border-t flex flex-wrap items-center justify-between gap-3 shrink-0"
        style="border-color: var(--wiki-border, var(--border-subtle)); background-color: var(--wiki-bg-elevated, var(--bg-panel-elevated));">
        <p class="text-xs" style="color: var(--wiki-text-muted, var(--text-secondary));">
          Imagen PNG limpia con tipografía grande y lectura directa, sin menús de edición ni recortes.
        </p>
        <div class="flex items-center gap-2 ml-auto">
          <button type="button"
            @click="$store.app.copyExportImage()"
            :disabled="$store.app.exportImageLoading"
            class="souls-btn text-xs sm:text-sm">
            <svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
            <span>Copiar Imagen</span>
          </button>

          <button type="button"
            @click="$store.app.downloadExportImage()"
            :disabled="$store.app.exportImageLoading"
            class="souls-btn souls-btn-primary text-xs sm:text-sm">
            <svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span>Descargar PNG</span>
          </button>
        </div>
      </div>
    </div>

    <!-- ============================================================
         PESTAÑA 2: TEXTO DISCORD (SIMPLIFICADO)
         ============================================================ -->
    <div x-show="$store.app.exportModalTab === 'discord'" class="flex-1 flex flex-col min-h-0">

      <!-- Controles compactos de Discord -->
      <div class="px-5 py-3 border-b flex flex-wrap items-center justify-between gap-2.5 shrink-0"
        style="border-color: var(--wiki-border, var(--border-subtle)); background-color: var(--wiki-bg-canvas, var(--bg-panel));">

        <div class="flex flex-wrap items-center gap-2">
          <!-- Estándar vs Compacto -->
          <div class="inline-flex border" style="border-color: var(--wiki-border-strong, var(--border-custom));">
            <button type="button"
              @click="$store.app.setDiscordFormatMode('standard')"
              class="px-2.5 py-1 text-xs cursor-pointer"
              :style="$store.app.discordExportOptions.formatMode === 'standard'
                ? 'background-color: var(--wiki-accent, var(--accent)); color: #111115;'
                : 'background-color: var(--wiki-bg-elevated, var(--bg-panel-elevated)); color: var(--wiki-text-main, var(--text-primary));'">
              Estándar
            </button>
            <button type="button"
              @click="$store.app.setDiscordFormatMode('compact')"
              class="px-2.5 py-1 text-xs cursor-pointer border-l"
              :style="$store.app.discordExportOptions.formatMode === 'compact'
                ? 'border-color: var(--wiki-border-strong, var(--border-custom)); background-color: var(--wiki-accent, var(--accent)); color: #111115;'
                : 'border-color: var(--wiki-border-strong, var(--border-custom)); background-color: var(--wiki-bg-elevated, var(--bg-panel-elevated)); color: var(--wiki-text-main, var(--text-primary));'">
              Compacto
            </button>
          </div>

          <!-- Separador -->
          <select
            aria-label="Separador de Discord"
            :value="$store.app.discordExportOptions.separator"
            @change="$store.app.setDiscordSeparator($event.target.value)"
            class="px-2.5 py-1 text-xs border outline-none cursor-pointer"
            style="background-color: var(--wiki-bg-elevated, var(--bg-panel-elevated)); border-color: var(--wiki-border-strong, var(--border-custom)); color: var(--wiki-text-main, var(--text-primary));">
            <template x-for="sep in $store.app.discordSeparators" :key="sep.id">
              <option :value="sep.value" x-text="sep.label" :selected="sep.value === $store.app.discordExportOptions.separator"></option>
            </template>
          </select>

          <!-- Secciones incluidas -->
          <div class="relative">
            <button type="button"
              @click="$store.app.discordExportOptions.showSectionMenu = !$store.app.discordExportOptions.showSectionMenu"
              class="souls-btn !px-2.5 !py-1 text-xs">
              <span>Secciones (<span x-text="$store.app.discordExportOptions.selectedSections.length"></span>)</span>
            </button>

            <div x-show="$store.app.discordExportOptions.showSectionMenu"
              @click.outside="$store.app.discordExportOptions.showSectionMenu = false"
              class="absolute left-0 top-full mt-1 w-60 border p-2.5 z-30 space-y-1.5"
              style="background-color: var(--wiki-bg-canvas, var(--bg-panel)); border-color: var(--wiki-border-strong, var(--border-custom));">
              <div class="flex items-center justify-between pb-1.5 border-b text-[11px] font-mono"
                style="border-color: var(--wiki-border, var(--border-subtle));">
                <button type="button" @click="$store.app.toggleAllDiscordSections(true)" class="cursor-pointer underline" style="color: var(--wiki-link);">Todas</button>
                <button type="button" @click="$store.app.toggleAllDiscordSections(false)" class="cursor-pointer underline" style="color: var(--wiki-text-muted);">Mínimo</button>
              </div>
              <div class="max-h-52 overflow-y-auto space-y-1">
                <template x-for="sec in $store.app.discordSections" :key="sec.id">
                  <label class="flex items-center gap-2 text-xs py-0.5 cursor-pointer"
                    style="color: var(--wiki-text-main, var(--text-primary));">
                    <input type="checkbox"
                      :checked="$store.app.discordExportOptions.selectedSections.includes(sec.id)"
                      @change="$store.app.toggleDiscordSection(sec.id)" />
                    <span x-text="sec.label"></span>
                  </label>
                </template>
              </div>
            </div>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <div class="inline-flex border" style="border-color: var(--wiki-border-strong, var(--border-custom));">
            <button type="button"
              @click="$store.app.setDiscordPreviewTab('wysiwyg')"
              class="px-2.5 py-1 text-xs cursor-pointer"
              :style="$store.app.discordPreviewTab === 'wysiwyg'
                ? 'background-color: var(--wiki-bg-elevated, var(--bg-panel-elevated)); color: var(--wiki-accent, var(--accent));'
                : 'background-color: transparent; color: var(--wiki-text-muted, var(--text-secondary));'">
              Vista Previa
            </button>
            <button type="button"
              @click="$store.app.setDiscordPreviewTab('raw')"
              class="px-2.5 py-1 text-xs cursor-pointer border-l"
              :style="$store.app.discordPreviewTab === 'raw'
                ? 'border-color: var(--wiki-border-strong, var(--border-custom)); background-color: var(--wiki-bg-elevated, var(--bg-panel-elevated)); color: var(--wiki-accent, var(--accent));'
                : 'border-color: var(--wiki-border-strong, var(--border-custom)); background-color: transparent; color: var(--wiki-text-muted, var(--text-secondary));'">
              Markdown (<span x-text="$store.app.discordBlocks.length"></span>)
            </button>
          </div>

          <button type="button" @click="$store.app.copyAllDiscordBlocks()" class="souls-btn souls-btn-primary !px-3 !py-1 text-xs">
            Copiar Todo
          </button>
        </div>
      </div>

      <!-- Cuerpo de Discord -->
      <div class="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3"
        style="background-color: var(--wiki-bg-outer, #0d0d10);">

        <div x-show="$store.app.discordPreviewTab === 'wysiwyg'"
          class="border p-4 text-sm leading-relaxed discord-preview-body"
          style="background-color: var(--wiki-bg-canvas, var(--bg-panel)); border-color: var(--wiki-border, var(--border-subtle)); color: var(--wiki-text-main, var(--text-primary));"
          x-html="$store.app.discordHtmlPreview">
        </div>

        <div x-show="$store.app.discordPreviewTab === 'raw'" class="space-y-3">
          <template x-for="(block, index) in $store.app.discordBlocks" :key="index">
            <div class="border"
              style="background-color: var(--wiki-bg-canvas, var(--bg-panel)); border-color: var(--wiki-border, var(--border-subtle));">
              <div class="px-3.5 py-2 border-b flex items-center justify-between text-xs font-mono"
                style="border-color: var(--wiki-border, var(--border-subtle)); background-color: var(--wiki-bg-elevated, var(--bg-panel-elevated)); color: var(--wiki-text-muted, var(--text-secondary));">
                <span x-text="'Mensaje ' + (index + 1) + ' / ' + $store.app.discordBlocks.length + ' (' + block.length + ' / 1950 chars)'"></span>
                <button type="button" @click="$store.app.copyDiscordBlock(index)" class="souls-btn !px-2.5 !py-0.5 text-[11px]">
                  Copiar bloque
                </button>
              </div>
              <pre class="p-3.5 text-xs font-mono whitespace-pre-wrap break-words overflow-x-auto m-0"
                style="color: var(--wiki-text-main, var(--text-primary));"
                x-text="block"></pre>
            </div>
          </template>
        </div>
      </div>
    </div>

    <!-- ============================================================
         PESTAÑA 3: RESPALDO JSON DE FICHA
         ============================================================ -->
    <div x-show="$store.app.exportModalTab === 'json'" class="flex-1 p-5 sm:p-7 overflow-y-auto">
      <div class="max-w-xl mx-auto border p-5 sm:p-6 space-y-4"
        style="background-color: var(--wiki-bg-elevated, var(--bg-panel-elevated)); border-color: var(--wiki-border-strong, var(--border-custom));">
        <div>
          <span class="block text-[11px] font-mono uppercase tracking-widest mb-1"
            style="color: var(--wiki-accent, var(--accent));">Respaldo Portable</span>
          <h3 class="text-base sm:text-lg font-bold"
            style="font-family: var(--font-wiki-serif, serif); color: var(--wiki-text-main, var(--text-primary));">
            Exportar Ficha en JSON
          </h3>
          <p class="text-xs sm:text-sm mt-1.5 leading-relaxed"
            style="color: var(--wiki-text-muted, var(--text-secondary));">
            Guarda todos los datos editables de esta ficha —incluyendo pestañas personalizadas, relaciones, citas y retratos— para restaurarla o compartirla con otro usuario de Where's my Ficha.
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-2.5 pt-2">
          <button type="button" @click="$store.app.copyTargetJSON()" class="souls-btn text-xs sm:text-sm">
            Copiar JSON
          </button>
          <button type="button" @click="$store.app.exportTargetJSON()" class="souls-btn souls-btn-primary text-xs sm:text-sm">
            Descargar .json
          </button>
        </div>
      </div>
    </div>

  </div>
</div>`;
}
