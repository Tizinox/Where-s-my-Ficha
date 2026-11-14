/**
 * @file src/ui/layout/dynamicBg.ts
 * Capa de fondo dinámico: HUD Sci-Fi en modo clásico / Wiki sobrio en modo actual.
 */

export function renderDynamicBg(): string {
  return `<!-- ==============================================================
     DYNAMIC BACKGROUND LAYER (HYBRID: CLÁSICO EN FICHA MAIN / WIKI SOBRIO EN ACTUAL)
     ============================================================== -->
<div id="dynamic-bg-container" class="fixed inset-0 z-0 pointer-events-none overflow-hidden w-full h-full"
  :class="($store.app.activeView === 'editor' && $store.characters.active?.sheetType === 'classic') ? 'bg-[#080a0d]' : ''"
  :style="($store.app.activeView === 'editor' && $store.characters.active?.sheetType === 'classic') ? '' : 'background-color: var(--wiki-bg-outer);'">

  <!-- Modo Clásico (Rama main): Fondo Dinámico Nivel 3 -->
  <template x-if="$store.app.activeView === 'editor' && $store.characters.active?.sheetType === 'classic'">
    <div id="dynamic-bg-layer" class="fixed inset-0 z-0 pointer-events-none overflow-hidden w-full h-full bg-[#080a0d] [transform:translate3d(0,0,0)] will-change-transform">
      <div class="absolute inset-0 bg-[#080a0d] pointer-events-none"></div>

      <!-- Modo 1: Trama HUD Sci-Fi limpia (o fallback sin imagen) -->
      <template
        x-if="($store.characters.active?.presentation?.background?.mode || 'pattern') === 'pattern' || (!($store.characters.active?.presentation?.background?.image || $store.characters.active?.visualSettings?.backgroundUrl) && ($store.characters.active?.presentation?.background?.mode || 'pattern') === 'custom')">
        <div class="absolute inset-0 pointer-events-none"
          style="background-image: radial-gradient(circle at 50% 0%, rgba(16, 185, 129, 0.04) 0%, transparent 65%), linear-gradient(to right, rgba(255, 255, 255, 0.02) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.02) 1px, transparent 1px); background-size: 100% 100%, 32px 32px, 32px 32px;">
        </div>
      </template>

      <!-- Modo 2: Custom - Imagen o GIF personalizado -->
      <template
        x-if="($store.characters.active?.presentation?.background?.mode || 'pattern') === 'custom' && ($store.characters.active?.presentation?.background?.image || $store.characters.active?.visualSettings?.backgroundUrl)">
        <div class="relative w-full h-full overflow-hidden [transform:translate3d(0,0,0)]">
          <img
            :src="$store.app.getOptimizedImageUrl($store.characters.active?.presentation?.background?.image || $store.characters.active?.visualSettings?.backgroundUrl)"
            class="w-full h-full object-cover transition-opacity duration-300 pointer-events-none [transform:translate3d(0,0,0)] will-change-transform" fetchpriority="high" decoding="async"
            :style="$store.characters.getBackgroundStyle() + ' opacity: ' + (($store.characters.active?.presentation?.background?.opacity ?? 50) / 100) + ';'"
            alt="Fondo Dinámico" />
          <div class="absolute inset-0 bg-[#080a0d] pointer-events-none"
            :style="\`opacity: \${($store.characters.active?.presentation?.background?.scrim ?? 20) / 100};\`">
          </div>
          <div class="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/50 pointer-events-none">
          </div>
        </div>
      </template>

      <!-- Modo 3: Sincronizado con Panel Principal -->
      <template x-if="($store.characters.active?.presentation?.background?.mode || 'pattern') === 'sync'">
        <div class="relative w-full h-full overflow-hidden [transform:translate3d(0,0,0)]">
          <template x-if="$store.settings.dashboardBgMode === 'custom' && $store.settings.dashboardBgUrl">
            <div class="w-full h-full relative">
              <img :src="$store.settings.dashboardBgUrl"
                class="w-full h-full object-cover transition-opacity duration-300 pointer-events-none [transform:translate3d(0,0,0)] will-change-transform"
                :style="$store.settings.getDashboardBgStyle() + ' opacity: ' + (($store.characters.active?.presentation?.background?.opacity ?? 50) / 100) + ';'"
                alt="Fondo Sincronizado" />
              <div class="absolute inset-0 bg-[#080a0d] pointer-events-none"
                :style="\`opacity: \${($store.settings.dashboardBgOpacity ?? 60) / 100};\`"></div>
            </div>
          </template>
          <template
            x-if="$store.settings.dashboardBgMode === 'dynamic' && ($store.characters.active?.basics?.bannerDataUrl || $store.characters.active?.presentation?.background?.image)">
            <div class="w-full h-full relative">
              <img
                :src="$store.characters.active?.basics?.bannerDataUrl || $store.characters.active?.presentation?.background?.image"
                class="w-full h-full object-cover transition-opacity duration-300 pointer-events-none [transform:translate3d(0,0,0)] will-change-transform"
                :style="$store.settings.getDashboardBgStyle() + ' opacity: ' + (($store.characters.active?.presentation?.background?.opacity ?? 50) / 100) + ';'"
                alt="Fondo Sincronizado Dinámico" />
              <div class="absolute inset-0 bg-[#080a0d] pointer-events-none"
                :style="\`opacity: \${($store.settings.dashboardBgOpacity ?? 60) / 100};\`"></div>
            </div>
          </template>
          <template
            x-if="$store.settings.dashboardBgMode === 'pattern' || (!$store.settings.dashboardBgUrl && !$store.characters.active?.basics?.bannerDataUrl && !$store.characters.active?.presentation?.background?.image)">
            <div class="absolute inset-0 pointer-events-none"
              style="background-image: radial-gradient(circle at 50% 0%, rgba(6, 182, 212, 0.04) 0%, transparent 65%), linear-gradient(to right, rgba(255, 255, 255, 0.02) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.02) 1px, transparent 1px); background-size: 100% 100%, 32px 32px, 32px 32px;">
            </div>
          </template>
          <div class="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/50 pointer-events-none">
          </div>
        </div>
      </template>
    </div>
  </template>

  <!-- Modo Wiki Sobrio (Panel, Ajustes, Tier List y Ficha Unificada) -->
  <template x-if="!($store.app.activeView === 'editor' && $store.characters.active?.sheetType === 'classic')">
    <div id="dynamic-bg-layer" class="absolute inset-0 pointer-events-none">
      <div class="absolute inset-0 pointer-events-none" style="background-color: var(--wiki-bg-outer);"></div>

      <!-- Fondo del Panel Principal (Dashboard): Personalizado / Dinámico -->
      <template x-if="$store.app.activeView === 'dashboard'">
        <div class="absolute inset-0 pointer-events-none">
          <template x-if="$store.settings.dashboardBgMode === 'custom' && $store.settings.dashboardBgUrl">
            <div id="custom-bg-layer" class="absolute inset-0 overflow-hidden transition-opacity duration-300">
              <img
                :src="$store.app.getOptimizedImageUrl($store.settings.dashboardBgUrl)"
                class="w-full h-full object-cover pointer-events-none"
                :style="$store.settings.getDashboardBgStyle()"
                alt="" />
              <div class="absolute inset-0 pointer-events-none"
                :style="\`background-color: var(--wiki-bg-outer); opacity: \${($store.settings.dashboardBgOpacity ?? 60) / 100};\`"></div>
            </div>
          </template>

          <template x-if="$store.settings.dashboardBgMode === 'dynamic' && ($store.characters.active?.basics?.bannerDataUrl || $store.characters.active?.presentation?.background?.image || $store.characters.list?.[0]?.basics?.bannerDataUrl)">
            <div id="custom-bg-layer" class="absolute inset-0 overflow-hidden transition-opacity duration-300">
              <img
                :src="$store.app.getOptimizedImageUrl($store.characters.active?.basics?.bannerDataUrl || $store.characters.active?.presentation?.background?.image || $store.characters.list?.[0]?.basics?.bannerDataUrl)"
                class="w-full h-full object-cover pointer-events-none"
                :style="$store.settings.getDashboardBgStyle()"
                alt="" />
              <div class="absolute inset-0 pointer-events-none"
                :style="\`background-color: var(--wiki-bg-outer); opacity: \${($store.settings.dashboardBgOpacity ?? 60) / 100};\`"></div>
            </div>
          </template>
        </div>
      </template>

      <!-- Fondo de Ficha Unificada: Custom o Sincronizado con Panel Principal -->
      <template x-if="$store.app.activeView === 'editor'">
        <div class="absolute inset-0 pointer-events-none">
          <template
            x-if="($store.characters.active?.presentation?.background?.mode || 'pattern') === 'custom' && ($store.characters.active?.presentation?.background?.image || $store.characters.active?.visualSettings?.backgroundUrl)">
            <div id="custom-bg-layer" class="absolute inset-0 overflow-hidden transition-opacity duration-300">
              <img
                :src="$store.app.getOptimizedImageUrl($store.characters.active?.presentation?.background?.image || $store.characters.active?.visualSettings?.backgroundUrl)"
                class="w-full h-full object-cover pointer-events-none"
                :style="$store.characters.getBackgroundStyle() + ' opacity: ' + (($store.characters.active?.presentation?.background?.opacity ?? 50) / 100) + ';'"
                alt="" />
              <div class="absolute inset-0 pointer-events-none"
                :style="\`background-color: var(--wiki-bg-outer); opacity: \${($store.characters.active?.presentation?.background?.scrim ?? 20) / 100};\`"></div>
            </div>
          </template>

          <template x-if="($store.characters.active?.presentation?.background?.mode || 'pattern') === 'sync'">
            <div id="custom-bg-layer" class="absolute inset-0 overflow-hidden transition-opacity duration-300">
              <template x-if="$store.settings.dashboardBgMode === 'custom' && $store.settings.dashboardBgUrl">
                <div class="relative w-full h-full">
                  <img
                    :src="$store.app.getOptimizedImageUrl($store.settings.dashboardBgUrl)"
                    class="w-full h-full object-cover pointer-events-none"
                    :style="$store.settings.getDashboardBgStyle() + ' opacity: ' + (($store.characters.active?.presentation?.background?.opacity ?? 50) / 100) + ';'"
                    alt="" />
                  <div class="absolute inset-0 pointer-events-none"
                    :style="\`background-color: var(--wiki-bg-outer); opacity: \${($store.settings.dashboardBgOpacity ?? 60) / 100};\`"></div>
                </div>
              </template>
              <template x-if="$store.settings.dashboardBgMode === 'dynamic' && ($store.characters.active?.basics?.bannerDataUrl || $store.characters.active?.presentation?.background?.image)">
                <div class="relative w-full h-full">
                  <img
                    :src="$store.app.getOptimizedImageUrl($store.characters.active?.basics?.bannerDataUrl || $store.characters.active?.presentation?.background?.image)"
                    class="w-full h-full object-cover pointer-events-none"
                    :style="$store.settings.getDashboardBgStyle() + ' opacity: ' + (($store.characters.active?.presentation?.background?.opacity ?? 50) / 100) + ';'"
                    alt="" />
                  <div class="absolute inset-0 pointer-events-none"
                    :style="\`background-color: var(--wiki-bg-outer); opacity: \${($store.settings.dashboardBgOpacity ?? 60) / 100};\`"></div>
                </div>
              </template>
            </div>
          </template>
        </div>
      </template>
    </div>
  </template>
</div>`;
}

