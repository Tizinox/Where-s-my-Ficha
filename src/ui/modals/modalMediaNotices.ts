/**
 * @file src/ui/modals/modalMediaNotices.ts
 */

export function renderModalMediaNotices(): string {
  return `<!-- ==============================================================
     LIGHTBOX MODAL — Vista previa a pantalla completa
     ============================================================== -->
  <div id="lightbox-modal" class="modal-backdrop z-[99999] p-4 sm:p-8" x-show="$store.app.lightboxUrl" x-cloak x-data
    x-transition:enter="transition ease-out duration-200" x-transition:enter-start="opacity-0 scale-95"
    x-transition:enter-end="opacity-100 scale-100" x-transition:leave="transition ease-in duration-150"
    x-transition:leave-start="opacity-100 scale-100" x-transition:leave-end="opacity-0 scale-95"
    @click="$store.app.closeLightbox()" @keydown.window.escape="$store.app.closeLightbox()" role="dialog"
    aria-modal="true" aria-label="Vista previa de imagen">
    <div class="relative max-w-5xl max-h-[90vh] flex flex-col items-center justify-center pointer-events-auto"
      @click.stop>
      <!-- Botón de cierre X -->
      <button type="button"
        class="absolute -top-3 -right-3 sm:-top-4 sm:-right-4 w-9 h-9 rounded-full bg-parchment-dark border border-parchment-brown/50 text-parchment-cream hover:text-accent-ruby hover:border-accent-ruby transition-all flex items-center justify-center shadow-2xl z-20 cursor-pointer"
        @click="$store.app.closeLightbox()" title="Cerrar vista previa (Esc)">
        <i data-lucide="x" class="w-5 h-5"></i>
      </button>

      <!-- Imagen a resolución completa sin recortes -->
      <img :src="$store.app.lightboxUrl" alt="Vista previa de referencia"
        class="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl border border-parchment-brown/40 bg-parchment-dark/95" />
    </div>
  </div>

  <!-- ==============================================================
     GIF WEIGHT WARNING MODAL — Aviso de Rendimiento para GIFs Pesados
     ============================================================== -->
  <div id="gif-size-error-modal" class="modal-backdrop z-[99999]" x-show="$store.app.showGifSizeErrorModal" x-cloak
    x-data x-transition:enter="transition ease-out duration-200" x-transition:enter-start="opacity-0 scale-95"
    x-transition:enter-end="opacity-100 scale-100" x-transition:leave="transition ease-in duration-150"
    x-transition:leave-start="opacity-100 scale-100" x-transition:leave-end="opacity-0 scale-95"
    @keydown.escape.window="$store.app.cancelHeavyGif()" role="dialog" aria-modal="true"
    aria-labelledby="gif-size-error-title">
    <div class="absolute inset-0" @click="$store.app.cancelHeavyGif()"></div>

    <div
      data-protect-contrast="true" class="modal-box relative w-full max-w-md bg-slate-950 border-2 border-amber-500/60 rounded-2xl shadow-2xl p-5 space-y-4">
      <div class="flex items-center gap-3 border-b border-amber-500/20 pb-3">
        <div class="p-2 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-400 shrink-0">
          <i data-lucide="alert-triangle" class="w-5 h-5"></i>
        </div>
        <div>
          <h3 id="gif-size-error-title"
            class="font-title text-base text-amber-400 font-extrabold uppercase tracking-wide">
            Aviso de Rendimiento: GIF Pesado
          </h3>
          <span class="text-[10px] text-slate-400 font-mono uppercase tracking-wider">
            Tamaño detectado: <span class="text-amber-300 font-bold" x-text="\`\${$store.app.gifWarningSizeMB || '10'} MB\`"></span>
          </span>
        </div>
      </div>

      <div class="space-y-2 text-xs text-slate-300 font-sans leading-relaxed">
        <p>
          Este archivo GIF supera el tamaño estándar de 10MB. La aplicación lo procesará y guardará de forma persistente en la base de datos interna del navegador (IndexedDB) sin restricciones de cuota.
        </p>
        <p class="text-amber-200/90 bg-amber-950/40 p-2.5 rounded-xl border border-amber-500/30 text-[11px] font-mono leading-normal">
          ⚠️ <strong>Advertencia de fluidez:</strong> Múltiples GIFs de gran tamaño reproduciéndose simultáneamente en pantalla consumen bastante memoria RAM y carga en la tarjeta gráfica (GPU).
        </p>
      </div>

      <div class="pt-2 flex items-center justify-end gap-2.5">
        <button type="button" @click="$store.app.cancelHeavyGif()"
          class="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-slate-300 text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer">
          Cancelar
        </button>
        <button type="button" @click="$store.app.confirmHeavyGif()"
          class="px-4 py-2 rounded-xl bg-amber-500/25 border border-amber-500/60 hover:bg-amber-500 hover:text-black text-amber-300 text-xs font-mono font-bold uppercase tracking-wider transition-all shadow-md cursor-pointer flex items-center gap-1.5">
          <i data-lucide="check" class="w-3.5 h-3.5"></i>
          <span>Continuar y Usar GIF</span>
        </button>
      </div>
    </div>
  </div>
`;
}
