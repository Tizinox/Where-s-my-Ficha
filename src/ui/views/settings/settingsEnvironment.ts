/**
 * @file src/ui/views/settings/settingsEnvironment.ts
 */

export function renderSettingsEnvironment(): string {
  return `<!-- SUB-PESTAÑA 3: FONDOS DE PANTALLA (GUIADO EN 1 COLUMNA) -->
<div x-data="{ activeSurface: 'dashboard', showAdvBg: false }" class="space-y-5">

  <div class="wiki-settings-pane-head">
    <h2 class="wiki-settings-pane-title">Fondos de Pantalla</h2>
    <p class="wiki-settings-pane-desc">Elige qué parte de la aplicación quieres personalizar y configura su fondo.</p>
  </div>

  <!-- Paso 1: Elegir vista -->
  <div class="wiki-segmented w-full">
    <button type="button" @click="activeSurface = 'dashboard'"
      :class="{ 'is-active': activeSurface === 'dashboard' }"
      class="wiki-segmented-btn flex-1 justify-center">
      <i data-lucide="layout-grid" class="w-3.5 h-3.5"></i>
      <span>Panel Principal</span>
    </button>
    <button type="button" @click="activeSurface = 'tierlist'"
      :class="{ 'is-active': activeSurface === 'tierlist' }"
      class="wiki-segmented-btn flex-1 justify-center">
      <i data-lucide="trophy" class="w-3.5 h-3.5"></i>
      <span>Tier List</span>
    </button>
    <button type="button" @click="activeSurface = 'character'"
      :class="{ 'is-active': activeSurface === 'character' }"
      class="wiki-segmented-btn flex-1 justify-center">
      <i data-lucide="file-text" class="w-3.5 h-3.5"></i>
      <span>Ficha Abierta</span>
    </button>
  </div>

  <!-- ════════ 1. PANEL PRINCIPAL ════════ -->
  <div x-show="activeSurface === 'dashboard'" class="space-y-4">
    <!-- Vista previa limpia -->
    <div class="relative w-full h-44 overflow-hidden border select-none"
      style="background: var(--wiki-bg-outer); border-color: var(--wiki-border);">
      <template x-if="$store.settings.dashboardBgMode === 'pattern'">
        <div class="w-full h-full pointer-events-none"
          style="background-image: linear-gradient(to right, rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.04) 1px, transparent 1px); background-size: 24px 24px;"></div>
      </template>
      <template x-if="$store.settings.dashboardBgMode === 'custom' && $store.settings.dashboardBgUrl">
        <div class="w-full h-full relative overflow-hidden pointer-events-none">
          <img :src="$store.settings.dashboardBgUrl" class="w-full h-full object-cover" :style="$store.settings.getDashboardBgStyle()" alt="" />
          <div class="absolute inset-0 bg-[#0a0c0e]" :style="\`opacity: \${($store.settings.dashboardBgOpacity ?? 60) / 100};\`"></div>
        </div>
      </template>
      <template x-if="$store.settings.dashboardBgMode === 'custom' && !$store.settings.dashboardBgUrl">
        <div class="w-full h-full flex flex-col items-center justify-center gap-1.5 text-xs pointer-events-none" style="color: var(--wiki-text-dim);">
          <i data-lucide="image" class="w-6 h-6 opacity-50"></i>
          <span>Sube una imagen o elige un estilo abajo</span>
        </div>
      </template>
      <template x-if="$store.settings.dashboardBgMode === 'dynamic'">
        <div class="w-full h-full relative overflow-hidden pointer-events-none">
          <img :src="$store.characters.active?.presentation?.background?.image || $store.characters.active?.basics?.bannerDataUrl || ''"
            class="w-full h-full object-cover" :style="$store.settings.getDashboardBgStyle()" alt="" />
          <div class="absolute inset-0 bg-[#0a0c0e]" :style="\`opacity: \${($store.settings.dashboardBgOpacity ?? 60) / 100};\`"></div>
        </div>
      </template>

      <div x-show="$store.settings.dashboardBgMode === 'custom' && $store.settings.dashboardBgUrl"
        class="absolute bottom-2.5 right-2.5 flex items-center gap-1.5">
        <button type="button" @click="$store.settings.openCropperForDashboard()" class="souls-btn !px-2.5 !py-1 text-xs">
          <i data-lucide="crop" class="w-3.5 h-3.5"></i>
          <span>Encuadrar</span>
        </button>
        <button type="button" @click="$store.settings.resetDashboardBgFrame()" class="souls-btn !p-1.5" title="Restablecer encuadre">
          <i data-lucide="rotate-ccw" class="w-3.5 h-3.5"></i>
        </button>
      </div>
    </div>

    <section class="wiki-settings-section space-y-4">
      <div class="space-y-2">
        <label class="text-sm font-semibold block" style="color: var(--wiki-text-main);">Tipo de fondo</label>
        <div class="wiki-segmented w-full">
          <button type="button" @click="$store.settings.dashboardBgMode = 'pattern'; $store.settings.saveDashboardBgSettings()"
            :class="{ 'is-active': $store.settings.dashboardBgMode === 'pattern' }"
            class="wiki-segmented-btn flex-1 justify-center">Cuadrícula simple</button>
          <button type="button" @click="$store.settings.dashboardBgMode = 'custom'; $store.settings.saveDashboardBgSettings()"
            :class="{ 'is-active': $store.settings.dashboardBgMode === 'custom' }"
            class="wiki-segmented-btn flex-1 justify-center">Imagen o GIF</button>
          <button type="button" @click="$store.settings.dashboardBgMode = 'dynamic'; $store.settings.saveDashboardBgSettings()"
            :class="{ 'is-active': $store.settings.dashboardBgMode === 'dynamic' }"
            class="wiki-segmented-btn flex-1 justify-center">Del personaje abierto</button>
        </div>
      </div>

      <div x-show="$store.settings.dashboardBgMode === 'dynamic'" x-cloak class="text-xs" style="color: var(--wiki-text-muted);">
        El fondo cambiará automáticamente según el último personaje que hayas abierto.
      </div>

      <div x-show="$store.settings.dashboardBgMode === 'custom'" x-cloak class="space-y-3 pt-2 border-t" style="border-color: var(--wiki-border);">
        <input id="dashboard-bg-upload" type="file" accept="image/png,image/jpeg,image/webp,image/gif"
          class="hidden" @change="$store.settings.uploadDashboardBgImage($event)">

        <template x-if="$store.settings.dashboardBgUrl">
          <div class="wiki-settings-card flex items-center justify-between gap-3">
            <div class="flex items-center gap-2.5 min-w-0">
              <img :src="$store.settings.dashboardBgUrl" class="w-9 h-9 object-cover border shrink-0"
                style="border-color: var(--wiki-border);" alt="" />
              <div class="min-w-0">
                <div class="text-xs font-semibold truncate"
                  x-text="$store.settings.dashboardBgUrl.startsWith('data:') ? 'Imagen cargada' : 'Imagen por enlace'"></div>
                <div class="text-[11px] truncate" style="color: var(--wiki-text-muted);"
                  x-text="$store.settings.dashboardBgUrl.startsWith('data:') ? 'Guardada localmente' : $store.settings.dashboardBgUrl"></div>
              </div>
            </div>
            <div class="flex items-center gap-1.5 shrink-0">
              <label for="dashboard-bg-upload" class="souls-btn !px-2.5 !py-1 text-xs cursor-pointer">Cambiar</label>
              <button type="button" @click="$store.settings.removeDashboardBgImage()" class="souls-btn souls-btn-danger !p-1.5" title="Quitar">
                <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
              </button>
            </div>
          </div>
        </template>

        <template x-if="!$store.settings.dashboardBgUrl">
          <div class="space-y-2.5">
            <label for="dashboard-bg-upload" class="souls-btn souls-btn-primary w-full cursor-pointer">
              <i data-lucide="upload" class="w-3.5 h-3.5"></i>
              <span>Subir imagen o GIF desde tu equipo</span>
            </label>
            <div class="flex items-center gap-2">
              <input type="text" x-model="$store.settings.dashboardBgUrl"
                @keydown.enter.prevent="$store.app.openMediaUrl($store.settings.dashboardBgUrl, 'bg_dashboard')"
                @input="$store.settings.saveDashboardBgSettings()"
                placeholder="O pega el enlace directo de una imagen..."
                class="souls-input text-xs flex-1">
              <button type="button" @click="$store.app.openMediaUrl($store.settings.dashboardBgUrl, 'bg_dashboard')"
                class="souls-btn shrink-0">Usar</button>
            </div>
          </div>
        </template>

        <div class="flex items-center justify-between gap-2 text-xs pt-1 flex-wrap">
          <span style="color: var(--wiki-text-muted);">O prueba un fondo incluido:</span>
          <div class="flex flex-wrap gap-1.5">
            <button type="button" @click="$store.settings.applyPresetToPanel('dashboard', 'nebula')" class="souls-btn !px-2.5 !py-1 text-xs">Nebula</button>
            <button type="button" @click="$store.settings.applyPresetToPanel('dashboard', 'cyberpunk')" class="souls-btn !px-2.5 !py-1 text-xs">Cyber</button>
            <button type="button" @click="$store.settings.applyPresetToPanel('dashboard', 'blueprint')" class="souls-btn !px-2.5 !py-1 text-xs">Blueprint</button>
            <button type="button" @click="$store.settings.applyPresetToPanel('dashboard', 'voidDark')" class="souls-btn !px-2.5 !py-1 text-xs">Void</button>
          </div>
        </div>
      </div>

      <!-- Slider básico de oscurecimiento -->
      <div class="space-y-1.5 pt-2 border-t" style="border-color: var(--wiki-border);">
        <div class="flex justify-between text-xs">
          <span class="font-medium" style="color: var(--wiki-text-main);">Oscurecer fondo (para leer mejor el texto)</span>
          <span class="font-mono font-semibold" x-text="\`\${$store.settings.dashboardBgOpacity}%\`"></span>
        </div>
        <input type="range" min="0" max="100" step="5" x-model.number="$store.settings.dashboardBgOpacity"
          @input="$store.settings.saveDashboardBgSettings()" class="wiki-range">
      </div>
    </section>
  </div>

  <!-- ════════ 2. TIER LIST ════════ -->
  <div x-show="activeSurface === 'tierlist'" class="space-y-4">
    <div class="relative w-full h-44 overflow-hidden border select-none"
      style="background: var(--wiki-bg-outer); border-color: var(--wiki-border);">
      <template x-if="$store.settings.tierlistBgMode === 'pattern'">
        <div class="w-full h-full pointer-events-none"
          style="background-image: linear-gradient(to right, rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.04) 1px, transparent 1px); background-size: 24px 24px;"></div>
      </template>
      <template x-if="$store.settings.tierlistBgMode === 'custom' && $store.settings.tierlistBgUrl">
        <div class="w-full h-full relative overflow-hidden pointer-events-none">
          <img :src="$store.settings.tierlistBgUrl" class="w-full h-full object-cover" :style="$store.settings.getTierlistBgStyle()" alt="" />
          <div class="absolute inset-0 bg-[#07090d]" :style="\`opacity: \${($store.settings.tierlistBgOpacity ?? 60) / 100};\`"></div>
        </div>
      </template>
      <template x-if="$store.settings.tierlistBgMode === 'custom' && !$store.settings.tierlistBgUrl">
        <div class="w-full h-full flex flex-col items-center justify-center gap-1.5 text-xs pointer-events-none" style="color: var(--wiki-text-dim);">
          <i data-lucide="image" class="w-6 h-6 opacity-50"></i>
          <span>Sube una imagen o elige un estilo abajo</span>
        </div>
      </template>
      <template x-if="$store.settings.tierlistBgMode === 'sync'">
        <div class="w-full h-full relative overflow-hidden pointer-events-none">
          <template x-if="$store.settings.dashboardBgMode === 'custom' && $store.settings.dashboardBgUrl">
            <div class="w-full h-full relative">
              <img :src="$store.settings.dashboardBgUrl" class="w-full h-full object-cover" :style="$store.settings.getDashboardBgStyle()" alt="" />
              <div class="absolute inset-0 bg-[#07090d]" :style="\`opacity: \${($store.settings.dashboardBgOpacity ?? 60) / 100};\`"></div>
            </div>
          </template>
          <template x-if="$store.settings.dashboardBgMode === 'dynamic' && ($store.characters.active?.presentation?.background?.image || $store.characters.active?.basics?.bannerDataUrl)">
            <div class="w-full h-full relative">
              <img :src="$store.characters.active?.presentation?.background?.image || $store.characters.active?.basics?.bannerDataUrl"
                class="w-full h-full object-cover" :style="$store.settings.getDashboardBgStyle()" alt="" />
              <div class="absolute inset-0 bg-[#07090d]" :style="\`opacity: \${($store.settings.dashboardBgOpacity ?? 60) / 100};\`"></div>
            </div>
          </template>
        </div>
      </template>

      <div x-show="$store.settings.tierlistBgMode === 'custom' && $store.settings.tierlistBgUrl"
        class="absolute bottom-2.5 right-2.5 flex items-center gap-1.5">
        <button type="button" @click="$store.settings.openCropperForTierlist()" class="souls-btn !px-2.5 !py-1 text-xs">
          <i data-lucide="crop" class="w-3.5 h-3.5"></i>
          <span>Encuadrar</span>
        </button>
        <button type="button" @click="$store.settings.resetTierlistBgFrame()" class="souls-btn !p-1.5" title="Restablecer encuadre">
          <i data-lucide="rotate-ccw" class="w-3.5 h-3.5"></i>
        </button>
      </div>
    </div>

    <section class="wiki-settings-section space-y-4">
      <div class="space-y-2">
        <label class="text-sm font-semibold block" style="color: var(--wiki-text-main);">Tipo de fondo</label>
        <div class="wiki-segmented w-full">
          <button type="button" @click="$store.settings.tierlistBgMode = 'pattern'; $store.settings.saveTierlistBgSettings()"
            :class="{ 'is-active': $store.settings.tierlistBgMode === 'pattern' }"
            class="wiki-segmented-btn flex-1 justify-center">Cuadrícula simple</button>
          <button type="button" @click="$store.settings.tierlistBgMode = 'custom'; $store.settings.saveTierlistBgSettings()"
            :class="{ 'is-active': $store.settings.tierlistBgMode === 'custom' }"
            class="wiki-segmented-btn flex-1 justify-center">Imagen o GIF</button>
          <button type="button" @click="$store.settings.tierlistBgMode = 'sync'; $store.settings.saveTierlistBgSettings()"
            :class="{ 'is-active': $store.settings.tierlistBgMode === 'sync' }"
            class="wiki-segmented-btn flex-1 justify-center">Igual que el Panel</button>
        </div>
      </div>

      <div x-show="$store.settings.tierlistBgMode === 'sync'" x-cloak class="text-xs" style="color: var(--wiki-text-muted);">
        Usa automáticamente el mismo fondo configurado para el Panel Principal.
      </div>

      <div x-show="$store.settings.tierlistBgMode === 'custom'" x-cloak class="space-y-3 pt-2 border-t" style="border-color: var(--wiki-border);">
        <input id="tierlist-bg-upload" type="file" accept="image/png,image/jpeg,image/webp,image/gif"
          class="hidden" @change="$store.settings.uploadTierlistBgImage($event)">

        <template x-if="$store.settings.tierlistBgUrl">
          <div class="wiki-settings-card flex items-center justify-between gap-3">
            <div class="flex items-center gap-2.5 min-w-0">
              <img :src="$store.settings.tierlistBgUrl" class="w-9 h-9 object-cover border shrink-0"
                style="border-color: var(--wiki-border);" alt="" />
              <div class="min-w-0">
                <div class="text-xs font-semibold truncate"
                  x-text="$store.settings.tierlistBgUrl.startsWith('data:') ? 'Imagen cargada' : 'Imagen por enlace'"></div>
                <div class="text-[11px] truncate" style="color: var(--wiki-text-muted);"
                  x-text="$store.settings.tierlistBgUrl.startsWith('data:') ? 'Guardada localmente' : $store.settings.tierlistBgUrl"></div>
              </div>
            </div>
            <div class="flex items-center gap-1.5 shrink-0">
              <label for="tierlist-bg-upload" class="souls-btn !px-2.5 !py-1 text-xs cursor-pointer">Cambiar</label>
              <button type="button" @click="$store.settings.removeTierlistBgImage()" class="souls-btn souls-btn-danger !p-1.5" title="Quitar">
                <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
              </button>
            </div>
          </div>
        </template>

        <template x-if="!$store.settings.tierlistBgUrl">
          <div class="space-y-2.5">
            <label for="tierlist-bg-upload" class="souls-btn souls-btn-primary w-full cursor-pointer">
              <i data-lucide="upload" class="w-3.5 h-3.5"></i>
              <span>Subir imagen o GIF desde tu equipo</span>
            </label>
            <div class="flex items-center gap-2">
              <input type="text" x-model="$store.settings.tierlistBgUrl"
                @keydown.enter.prevent="$store.app.openMediaUrl($store.settings.tierlistBgUrl, 'bg_tierlist')"
                @input="$store.settings.saveTierlistBgSettings()"
                placeholder="O pega el enlace directo de una imagen..."
                class="souls-input text-xs flex-1">
              <button type="button" @click="$store.app.openMediaUrl($store.settings.tierlistBgUrl, 'bg_tierlist')"
                class="souls-btn shrink-0">Usar</button>
            </div>
          </div>
        </template>

        <div class="flex items-center justify-between gap-2 text-xs pt-1 flex-wrap">
          <span style="color: var(--wiki-text-muted);">O prueba un fondo incluido:</span>
          <div class="flex flex-wrap gap-1.5">
            <button type="button" @click="$store.settings.applyPresetToPanel('tierlist', 'nebula')" class="souls-btn !px-2.5 !py-1 text-xs">Nebula</button>
            <button type="button" @click="$store.settings.applyPresetToPanel('tierlist', 'cyberpunk')" class="souls-btn !px-2.5 !py-1 text-xs">Cyber</button>
            <button type="button" @click="$store.settings.applyPresetToPanel('tierlist', 'blueprint')" class="souls-btn !px-2.5 !py-1 text-xs">Blueprint</button>
            <button type="button" @click="$store.settings.applyPresetToPanel('tierlist', 'voidDark')" class="souls-btn !px-2.5 !py-1 text-xs">Void</button>
          </div>
        </div>
      </div>

      <div class="space-y-1.5 pt-2 border-t" style="border-color: var(--wiki-border);">
        <div class="flex justify-between text-xs">
          <span class="font-medium" style="color: var(--wiki-text-main);">Oscurecer fondo</span>
          <span class="font-mono font-semibold" x-text="\`\${$store.settings.tierlistBgOpacity}%\`"></span>
        </div>
        <input type="range" min="0" max="100" step="5" x-model.number="$store.settings.tierlistBgOpacity"
          @input="$store.settings.saveTierlistBgSettings()" class="wiki-range">
      </div>
    </section>
  </div>

  <!-- ════════ 3. FICHA ABIERTA ════════ -->
  <div x-show="activeSurface === 'character'" class="space-y-4">
    <template x-if="!$store.characters.active">
      <div class="wiki-settings-card flex items-center gap-2.5 text-xs" style="color: var(--wiki-text-main);">
        <i data-lucide="alert-circle" class="w-4 h-4 shrink-0" style="color: var(--wiki-accent);"></i>
        <span>Primero abre o selecciona un personaje en el Panel para poder cambiar su fondo individual.</span>
      </div>
    </template>

    <div class="relative w-full h-44 overflow-hidden border select-none"
      style="background: var(--wiki-bg-outer); border-color: var(--wiki-border);">
      <template x-if="($store.characters.active?.presentation?.background?.mode || 'pattern') === 'pattern'">
        <div class="w-full h-full pointer-events-none"
          style="background-image: linear-gradient(to right, rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.04) 1px, transparent 1px); background-size: 24px 24px;"></div>
      </template>
      <template x-if="($store.characters.active?.presentation?.background?.mode || 'pattern') === 'custom' && $store.characters.active?.presentation?.background?.image">
        <div class="w-full h-full relative overflow-hidden pointer-events-none">
          <img :src="$store.characters.active.presentation.background.image" class="w-full h-full object-cover" :style="$store.characters.getBackgroundStyle()" alt="" />
          <div class="absolute inset-0 bg-[#080a0d]" :style="\`opacity: \${($store.characters.active?.presentation?.background?.scrim ?? 20) / 100};\`"></div>
        </div>
      </template>
      <template x-if="($store.characters.active?.presentation?.background?.mode || 'pattern') === 'custom' && !$store.characters.active?.presentation?.background?.image">
        <div class="w-full h-full flex flex-col items-center justify-center gap-1.5 text-xs pointer-events-none" style="color: var(--wiki-text-dim);">
          <i data-lucide="image" class="w-6 h-6 opacity-50"></i>
          <span>Sube una imagen o elige un estilo abajo</span>
        </div>
      </template>
      <template x-if="($store.characters.active?.presentation?.background?.mode || 'pattern') === 'sync'">
        <div class="w-full h-full relative overflow-hidden pointer-events-none">
          <template x-if="$store.settings.dashboardBgMode === 'custom' && $store.settings.dashboardBgUrl">
            <div class="w-full h-full relative">
              <img :src="$store.settings.dashboardBgUrl" class="w-full h-full object-cover" :style="$store.settings.getDashboardBgStyle()" alt="" />
              <div class="absolute inset-0 bg-[#080a0d]" :style="\`opacity: \${($store.settings.dashboardBgOpacity ?? 60) / 100};\`"></div>
            </div>
          </template>
          <template x-if="$store.settings.dashboardBgMode === 'dynamic' && ($store.characters.active?.presentation?.background?.image || $store.characters.active?.basics?.bannerDataUrl)">
            <div class="w-full h-full relative">
              <img :src="$store.characters.active?.presentation?.background?.image || $store.characters.active?.basics?.bannerDataUrl"
                class="w-full h-full object-cover" :style="$store.settings.getDashboardBgStyle()" alt="" />
              <div class="absolute inset-0 bg-[#080a0d]" :style="\`opacity: \${($store.settings.dashboardBgOpacity ?? 60) / 100};\`"></div>
            </div>
          </template>
        </div>
      </template>

      <div x-show="($store.characters.active?.presentation?.background?.mode || 'pattern') === 'custom' && $store.characters.active?.presentation?.background?.image"
        class="absolute bottom-2.5 right-2.5 flex items-center gap-1.5">
        <button type="button" @click="$store.characters.openCropperForCharacterBg()" class="souls-btn !px-2.5 !py-1 text-xs">
          <i data-lucide="crop" class="w-3.5 h-3.5"></i>
          <span>Encuadrar</span>
        </button>
        <button type="button" @click="$store.characters.resetBackgroundFrame()" class="souls-btn !p-1.5" title="Restablecer encuadre">
          <i data-lucide="rotate-ccw" class="w-3.5 h-3.5"></i>
        </button>
      </div>
    </div>

    <section class="wiki-settings-section space-y-4">
      <div class="space-y-2">
        <div class="flex items-center justify-between gap-2">
          <label class="text-sm font-semibold" style="color: var(--wiki-text-main);">Tipo de fondo</label>
          <span class="text-xs truncate" style="color: var(--wiki-text-muted);"
            x-text="$store.characters.active?.basics?.name || $store.characters.active?.name || ''"></span>
        </div>
        <div class="wiki-segmented w-full">
          <button type="button" @click="$store.characters.updateBackgroundMode('pattern')"
            :class="{ 'is-active': ($store.characters.active?.presentation?.background?.mode || 'pattern') === 'pattern' }"
            class="wiki-segmented-btn flex-1 justify-center">Cuadrícula simple</button>
          <button type="button" @click="$store.characters.updateBackgroundMode('custom')"
            :class="{ 'is-active': ($store.characters.active?.presentation?.background?.mode || 'pattern') === 'custom' }"
            class="wiki-segmented-btn flex-1 justify-center">Imagen o GIF</button>
          <button type="button" @click="$store.characters.updateBackgroundMode('sync')"
            :class="{ 'is-active': ($store.characters.active?.presentation?.background?.mode || 'pattern') === 'sync' }"
            class="wiki-segmented-btn flex-1 justify-center">Igual que el Panel</button>
        </div>
      </div>

      <div x-show="($store.characters.active?.presentation?.background?.mode || 'pattern') === 'sync'" x-cloak class="text-xs" style="color: var(--wiki-text-muted);">
        Esta ficha usará el mismo fondo configurado para el Panel Principal.
      </div>

      <div x-show="($store.characters.active?.presentation?.background?.mode || 'pattern') === 'custom'" x-cloak class="space-y-3 pt-2 border-t" style="border-color: var(--wiki-border);">
        <input id="char-bg-upload" type="file" accept="image/png,image/jpeg,image/webp,image/gif"
          class="hidden" @change="$store.characters.uploadBackgroundImage($event)">

        <template x-if="$store.characters.active?.presentation?.background?.image">
          <div class="wiki-settings-card flex items-center justify-between gap-3">
            <div class="flex items-center gap-2.5 min-w-0">
              <img :src="$store.characters.active.presentation.background.image" class="w-9 h-9 object-cover border shrink-0"
                style="border-color: var(--wiki-border);" alt="" />
              <div class="min-w-0">
                <div class="text-xs font-semibold truncate"
                  x-text="$store.characters.active.presentation.background.image.startsWith('data:') ? 'Imagen cargada' : 'Imagen por enlace'"></div>
                <div class="text-[11px] truncate" style="color: var(--wiki-text-muted);"
                  x-text="$store.characters.active.presentation.background.image.startsWith('data:') ? 'Guardada en ficha' : $store.characters.active.presentation.background.image"></div>
              </div>
            </div>
            <div class="flex items-center gap-1.5 shrink-0">
              <label for="char-bg-upload" class="souls-btn !px-2.5 !py-1 text-xs cursor-pointer">Cambiar</label>
              <button type="button" @click="$store.characters.removeBackgroundImage()" class="souls-btn souls-btn-danger !p-1.5" title="Quitar">
                <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
              </button>
            </div>
          </div>
        </template>

        <template x-if="!$store.characters.active?.presentation?.background?.image">
          <div class="space-y-2.5">
            <label for="char-bg-upload" class="souls-btn souls-btn-primary w-full cursor-pointer">
              <i data-lucide="upload" class="w-3.5 h-3.5"></i>
              <span>Subir imagen o GIF desde tu equipo</span>
            </label>
            <div class="flex items-center gap-2">
              <input type="text" :value="$store.characters.active?.presentation?.background?.image || ''"
                @keydown.enter.prevent="$store.app.openMediaUrl($el.value, 'bg_character')"
                @input="$store.characters.setBackgroundUrl($el.value)"
                placeholder="O pega el enlace directo de una imagen..."
                class="souls-input text-xs flex-1">
              <button type="button" @click="$store.app.openMediaUrl($store.characters.active?.presentation?.background?.image, 'bg_character')"
                class="souls-btn shrink-0">Usar</button>
            </div>
          </div>
        </template>

        <div class="flex items-center justify-between gap-2 text-xs pt-1 flex-wrap">
          <span style="color: var(--wiki-text-muted);">O prueba un fondo incluido:</span>
          <div class="flex flex-wrap gap-1.5">
            <button type="button" @click="$store.settings.applyPresetToPanel('character', 'nebula')" class="souls-btn !px-2.5 !py-1 text-xs">Nebula</button>
            <button type="button" @click="$store.settings.applyPresetToPanel('character', 'cyberpunk')" class="souls-btn !px-2.5 !py-1 text-xs">Cyber</button>
            <button type="button" @click="$store.settings.applyPresetToPanel('character', 'blueprint')" class="souls-btn !px-2.5 !py-1 text-xs">Blueprint</button>
            <button type="button" @click="$store.settings.applyPresetToPanel('character', 'voidDark')" class="souls-btn !px-2.5 !py-1 text-xs">Void</button>
          </div>
        </div>
      </div>

      <div class="space-y-1.5 pt-2 border-t" style="border-color: var(--wiki-border);">
        <div class="flex justify-between text-xs">
          <span class="font-medium" style="color: var(--wiki-text-main);">Oscurecer fondo</span>
          <span class="font-mono font-semibold" x-text="\`\${$store.characters.active?.presentation?.background?.scrim ?? 20}%\`"></span>
        </div>
        <input type="range" min="0" max="100" step="5"
          :value="$store.characters.active?.presentation?.background?.scrim ?? 20"
          @input="$store.characters.updateBackgroundScrim($el.value)" class="wiki-range">
      </div>
    </section>
  </div>

  <!-- Acordeón colapsado: Desenfoque, opacidad extra y acciones globales -->
  <div>
    <button type="button" @click="showAdvBg = !showAdvBg" class="wiki-accordion-header">
      <div class="flex items-center gap-2.5">
        <i data-lucide="sliders" class="w-4 h-4 text-[var(--wiki-accent)]"></i>
        <div>
          <span class="text-sm font-semibold block">Ajustes avanzados de imagen</span>
          <span class="text-xs text-[var(--wiki-text-muted)] font-normal block">Desenfoque, opacidad extra y aplicar a toda la app</span>
        </div>
      </div>
      <i data-lucide="chevron-down" class="w-4 h-4 text-[var(--wiki-text-muted)] transition-transform shrink-0"
        :class="showAdvBg ? 'rotate-180' : ''"></i>
    </button>

    <div x-show="showAdvBg" x-collapse class="wiki-accordion-body space-y-4">
      <div x-show="activeSurface === 'dashboard'" class="space-y-1.5">
        <div class="flex justify-between text-xs">
          <span>Desenfoque del Panel</span>
          <span class="font-mono font-semibold" x-text="\`\${$store.settings.dashboardBgBlur} px\`"></span>
        </div>
        <input type="range" min="0" max="30" step="1" x-model.number="$store.settings.dashboardBgBlur"
          @input="$store.settings.saveDashboardBgSettings()" class="wiki-range">
      </div>

      <div x-show="activeSurface === 'tierlist'" class="space-y-3">
        <div class="space-y-1.5">
          <div class="flex justify-between text-xs">
            <span>Desenfoque en Tier List</span>
            <span class="font-mono font-semibold" x-text="\`\${$store.settings.tierlistBgBlur} px\`"></span>
          </div>
          <input type="range" min="0" max="30" step="1" x-model.number="$store.settings.tierlistBgBlur"
            @input="$store.settings.saveTierlistBgSettings()" class="wiki-range">
        </div>
        <div class="space-y-1.5">
          <div class="flex justify-between text-xs">
            <span>Opacidad de las filas</span>
            <span class="font-mono font-semibold" x-text="\`\${$store.tierlist.rowOpacity ?? 40}%\`"></span>
          </div>
          <input type="range" min="0" max="100" step="5" :value="$store.tierlist.rowOpacity ?? 40"
            @input="$store.tierlist.setRowOpacity($el.value)" class="wiki-range">
        </div>
      </div>

      <div x-show="activeSurface === 'character'" class="space-y-3">
        <div class="space-y-1.5">
          <div class="flex justify-between text-xs">
            <span>Desenfoque en Ficha</span>
            <span class="font-mono font-semibold" x-text="\`\${$store.characters.active?.presentation?.background?.blur || 0} px\`"></span>
          </div>
          <input type="range" min="0" max="30" step="1"
            :value="$store.characters.active?.presentation?.background?.blur || 0"
            @input="$store.characters.updateBackgroundBlur($el.value)" class="wiki-range">
        </div>
        <div class="space-y-1.5">
          <div class="flex justify-between text-xs">
            <span>Transparencia del fondo</span>
            <span class="font-mono font-semibold" x-text="\`\${$store.characters.active?.presentation?.background?.opacity ?? 50}%\`"></span>
          </div>
          <input type="range" min="0" max="100" step="5"
            :value="$store.characters.active?.presentation?.background?.opacity ?? 50"
            @input="$store.characters.updateBackgroundOpacity($el.value)" class="wiki-range">
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-2 pt-3 border-t" style="border-color: var(--wiki-border);">
        <button type="button" @click="$store.settings.cloneDashboardBgToAll()" class="souls-btn">
          <i data-lucide="copy" class="w-3.5 h-3.5"></i>
          <span>Usar fondo del Panel en toda la app</span>
        </button>
        <button type="button" @click="$store.settings.resetAllBackgrounds()" class="souls-btn souls-btn-danger">
          <i data-lucide="rotate-ccw" class="w-3.5 h-3.5"></i>
          <span>Quitar todos los fondos</span>
        </button>
      </div>
    </div>
  </div>

</div>
`;
}
