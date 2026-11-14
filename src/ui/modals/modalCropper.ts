/**
 * @file src/ui/modals/modalCropper.ts
 */

export function renderModalCropper(): string {
  return `<!-- ==============================================================
     CROPPER MODAL — Ajuste de imágenes
     ============================================================== -->
  <div id="cropper-modal" class="modal-backdrop !z-[100000]" x-show="$store.app.showCropper" x-cloak x-data
    x-transition:enter="transition ease-out duration-200" x-transition:enter-start="opacity-0"
    x-transition:enter-end="opacity-100" x-transition:leave="transition ease-in duration-150"
    x-transition:leave-start="opacity-100" x-transition:leave-end="opacity-0"
    @keydown.escape.window="$store.app.cancelCropper()" role="dialog" aria-modal="true" aria-labelledby="cropper-title">
    <div class="absolute inset-0" @click="$store.app.cancelCropper()"></div>

    <div data-protect-contrast="true" class="modal-box relative w-full max-w-3xl flex flex-col h-[90vh] md:h-[80vh]">
      <!-- Header -->
      <div class="modal-header shrink-0">
        <div class="flex items-center gap-2">
          <i data-lucide="crop" class="w-5 h-5 text-accent-gold"></i>
          <h2 id="cropper-title" class="font-title text-xl text-parchment-peach"
            x-text="$store.app.cropperTargetType === 'banner' ? 'Ajustar y Recortar Banner (16:5)' : ($store.app.cropperTargetType === 'icon' ? 'Ajustar y Recortar Ícono (1:1)' : ($store.app.cropperTargetType === 'custom_emoji' ? 'Ajustar y Recortar Emoticono (1:1)' : ($store.app.cropperTargetType === 'tierlist_guest' ? 'Encuadrar y Ajustar Operativo (1:1)' : ($store.app.cropperTargetType === 'tierlist_icon' ? 'Ajustar Emblema de Tier List (1:1)' : ($store.app.cropperTargetType === 'folder_icon' ? 'Ajustar Logo de Carpeta (1:1)' : ($store.app.cropperTargetType === 'bg_dashboard' ? 'Ajustar Fondo del Panel Principal' : ($store.app.cropperTargetType === 'bg_tierlist' ? 'Ajustar Fondo de Tier List' : ($store.app.cropperTargetType === 'bg_character' ? 'Ajustar Fondo de Ficha de Personaje' : ($store.app.cropperTargetType === 'weapon' ? 'Ajustar Imagen de Arma / Artefacto' : ($store.app.cropperTargetType === 'skill' ? 'Ajustar y Recortar Habilidad (16:9)' : 'Ajustar Imagen (3:4)'))))))))))">
          </h2>
        </div>
        <button class="header-btn-ghost p-1.5 rounded-lg" @click="$store.app.cancelCropper()">
          <i data-lucide="x" class="w-5 h-5"></i>
        </button>
      </div>

      <!-- Selector de Proporción / Orientación cuando es Arma o Artefacto O Fondos de Pantalla -->
      <div x-show="$store.app.cropperTargetType === 'weapon' || $store.app.cropperTargetType === 'bg_dashboard' || $store.app.cropperTargetType === 'bg_tierlist' || $store.app.cropperTargetType === 'bg_character'"
        class="bg-black/75 border-b border-parchment-brown/20 px-4 py-2 flex items-center justify-between flex-wrap gap-2 text-xs shrink-0">
        <span class="text-ink-slate font-mono text-[11px] flex items-center gap-1.5 font-semibold">
          <svg class="w-3.5 h-3.5 text-accent-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/>
          </svg>
          Orientación / Encuadre:
        </span>
        <div class="flex items-center gap-1.5 flex-wrap">
          <button type="button" class="px-2.5 py-1 rounded text-xs font-mono font-bold transition-all cursor-pointer border"
            :class="$store.app.cropperAspectRatioMode === 'horizontal' ? 'bg-accent-gold text-black border-accent-gold shadow-md shadow-accent-gold/20' : 'bg-parchment-brown/15 text-parchment-cream border-parchment-brown/30 hover:bg-parchment-brown/30'"
            @click="$store.app.setCropperAspectRatio('horizontal')">
            16:9 Panorámico
          </button>
          <button type="button" class="px-2.5 py-1 rounded text-xs font-mono font-bold transition-all cursor-pointer border"
            :class="$store.app.cropperAspectRatioMode === 'ultrawide' ? 'bg-accent-gold text-black border-accent-gold shadow-md shadow-accent-gold/20' : 'bg-parchment-brown/15 text-parchment-cream border-parchment-brown/30 hover:bg-parchment-brown/30'"
            @click="$store.app.setCropperAspectRatio('ultrawide')">
            21:9 Ultra-Wide
          </button>
          <template x-if="$store.app.cropperTargetType === 'weapon'">
            <div class="inline-flex gap-1.5">
              <button type="button" class="px-2.5 py-1 rounded text-xs font-mono font-bold transition-all cursor-pointer border"
                :class="$store.app.cropperAspectRatioMode === 'vertical' ? 'bg-accent-gold text-black border-accent-gold shadow-md shadow-accent-gold/20' : 'bg-parchment-brown/15 text-parchment-cream border-parchment-brown/30 hover:bg-parchment-brown/30'"
                @click="$store.app.setCropperAspectRatio('vertical')">
                3:4 Vertical
              </button>
              <button type="button" class="px-2.5 py-1 rounded text-xs font-mono font-bold transition-all cursor-pointer border"
                :class="$store.app.cropperAspectRatioMode === 'tall' ? 'bg-accent-gold text-black border-accent-gold shadow-md shadow-accent-gold/20' : 'bg-parchment-brown/15 text-parchment-cream border-parchment-brown/30 hover:bg-parchment-brown/30'"
                @click="$store.app.setCropperAspectRatio('tall')">
                9:16 Alargado
              </button>
              <button type="button" class="px-2.5 py-1 rounded text-xs font-mono font-bold transition-all cursor-pointer border"
                :class="$store.app.cropperAspectRatioMode === 'square' ? 'bg-accent-gold text-black border-accent-gold shadow-md shadow-accent-gold/20' : 'bg-parchment-brown/15 text-parchment-cream border-parchment-brown/30 hover:bg-parchment-brown/30'"
                @click="$store.app.setCropperAspectRatio('square')">
                1:1 Cuadrado
              </button>
            </div>
          </template>
          <button type="button" class="px-2.5 py-1 rounded text-xs font-mono font-bold transition-all cursor-pointer border"
            :class="$store.app.cropperAspectRatioMode === 'free' ? 'bg-accent-gold text-black border-accent-gold shadow-md shadow-accent-gold/20' : 'bg-parchment-brown/15 text-parchment-cream border-parchment-brown/30 hover:bg-parchment-brown/30'"
            @click="$store.app.setCropperAspectRatio('free')">
            Libre
          </button>
        </div>
      </div>

      <!-- Body (Cropper Area) -->
      <div class="modal-body flex-1 overflow-hidden p-0 bg-parchment-dark/50 relative">
        <div class="w-full h-full flex items-center justify-center">
          <img id="cropper-image" src="" alt="Recortar imagen" class="max-w-full max-h-full" />
        </div>
      </div>

      <!-- Toolbar / Footer -->
      <div
        class="modal-footer shrink-0 flex flex-wrap items-center justify-between gap-2 border-t border-parchment-brown/20 bg-parchment-dark p-4">

        <!-- Controles de Edición -->
        <div
          class="flex items-center gap-1 bg-parchment-brown/10 p-1 rounded-lg border border-parchment-brown/20 flex-wrap">
          <button class="header-btn-ghost p-1.5 px-2 rounded text-xs gap-1" title="Acercar"
            @click="$store.app.cropperZoom(0.1)">
            <i data-lucide="zoom-in" class="w-4 h-4"></i>
            <span>Zoom +</span>
          </button>
          <button class="header-btn-ghost p-1.5 px-2 rounded text-xs gap-1" title="Alejar"
            @click="$store.app.cropperZoom(-0.1)">
            <i data-lucide="zoom-out" class="w-4 h-4"></i>
            <span>Zoom -</span>
          </button>
          <div class="w-px h-5 bg-parchment-brown/30 mx-1 hidden sm:block"></div>
          <button class="header-btn-ghost p-1.5 px-2 rounded text-xs gap-1" title="Rotar Izquierda"
            @click="$store.app.cropperRotate(-90)">
            <i data-lucide="rotate-ccw" class="w-4 h-4"></i>
            <span>-90°</span>
          </button>
          <button class="header-btn-ghost p-1.5 px-2 rounded text-xs gap-1" title="Rotar Derecha"
            @click="$store.app.cropperRotate(90)">
            <i data-lucide="rotate-cw" class="w-4 h-4"></i>
            <span>+90°</span>
          </button>
          <div class="w-px h-5 bg-parchment-brown/30 mx-1 hidden sm:block"></div>
          <button class="header-btn-ghost p-1.5 px-2 rounded text-xs gap-1" title="Espejo Horizontal"
            @click="$store.app.cropperFlipX()">
            <i data-lucide="flip-horizontal" class="w-4 h-4"></i>
            <span>Espejo H</span>
          </button>
          <button class="header-btn-ghost p-1.5 px-2 rounded text-xs gap-1" title="Espejo Vertical"
            @click="$store.app.cropperFlipY()">
            <i data-lucide="flip-vertical" class="w-4 h-4"></i>
            <span>Espejo V</span>
          </button>
        </div>

        <!-- Acciones -->
        <div class="flex items-center gap-2 ml-auto">
          <button class="header-btn-ghost cursor-pointer" @click="$store.app.cancelCropper()">Cancelar</button>
          <button class="header-btn-accent cursor-pointer" @click="$store.app.applyCropper()">
            <i data-lucide="check" class="w-4 h-4"></i>
            <span x-text="$store.app.cropperTargetType === 'folder_icon' ? 'Aplicar a Carpeta' : ($store.app.cropperTargetType === 'custom_emoji' ? 'Aplicar a Emoticono' : ($store.app.cropperTargetType === 'tierlist_icon' ? 'Aplicar Emblema' : ($store.app.cropperTargetType?.startsWith('bg_') ? 'Aplicar Fondo' : 'Aplicar Recorte')))"></span>
          </button>
        </div>
      </div>
    </div>
  </div>
`;
}
