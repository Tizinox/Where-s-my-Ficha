/**
 * @file src/ui/views/settings/settingsExtras.ts
 */

export function renderSettingsExtras(): string {
  return `<!-- SUB-PESTAÑA 6: TIER LIST Y SISTEMA (1 COLUMNA CLARA Y DIRECTA) -->
<div x-data="{ showAdvTierlist: false, activeRadiusCategory: 'registered' }" class="space-y-5">

  <div class="wiki-settings-pane-head">
    <h2 class="wiki-settings-pane-title">Tier List y Sistema</h2>
    <p class="wiki-settings-pane-desc">Personaliza cómo se comporta tu Tier List, la animación inicial y herramientas de la app.</p>
  </div>

  <!-- 1. TIER LIST (SIMPLE PRIMERO) -->
  <section class="wiki-settings-section space-y-4">
    <div class="text-sm font-semibold text-[var(--wiki-text-main)]">Tablero Tier List</div>

    <!-- Tamaño de fichas en Tier List -->
    <div class="space-y-2.5">
      <div class="flex items-center justify-between text-xs">
        <span style="color: var(--wiki-text-muted);">Tamaño de las imágenes</span>
        <span class="font-mono font-semibold" style="color: var(--wiki-accent);"
          x-text="$store.tierlist?.tokenSizeLabel || '72px'"></span>
      </div>

      <div class="wiki-segmented w-full">
        <button type="button" @click="$store.tierlist?.setTokenSize(56)" class="wiki-segmented-btn flex-1 justify-center"
          :class="{ 'is-active': ($store.tierlist?.tokenSize || 72) === 56 }">Pequeño</button>
        <button type="button" @click="$store.tierlist?.setTokenSize(72)" class="wiki-segmented-btn flex-1 justify-center"
          :class="{ 'is-active': ($store.tierlist?.tokenSize || 72) === 72 }">Mediano</button>
        <button type="button" @click="$store.tierlist?.setTokenSize(88)" class="wiki-segmented-btn flex-1 justify-center"
          :class="{ 'is-active': ($store.tierlist?.tokenSize || 72) === 88 }">Grande</button>
        <button type="button" @click="$store.tierlist?.setTokenSize(104)" class="wiki-segmented-btn flex-1 justify-center"
          :class="{ 'is-active': ($store.tierlist?.tokenSize || 72) === 104 }">Extra</button>
      </div>

      <input type="range" min="48" max="112" step="4"
        :value="$store.tierlist?.tokenSize || 72"
        @input="$store.tierlist?.setTokenSize($event.target.value)"
        class="wiki-range" />
    </div>

    <!-- Opciones principales -->
    <div class="pt-2 border-t" style="border-color: var(--wiki-border);">
      <div class="wiki-settings-row">
        <div>
          <div class="text-sm font-medium text-[var(--wiki-text-main)]">Guardar personajes sin ficha (Invitados)</div>
          <div class="text-xs text-[var(--wiki-text-muted)]">Mantiene en la Tier List imágenes sueltas que añadas aunque no tengan ficha.</div>
        </div>
        <button type="button" role="switch"
          @click="$store.settings.togglePersistGuestCharacters()"
          :aria-checked="$store.settings.persistGuestCharacters"
          :class="{ 'is-on': $store.settings.persistGuestCharacters }"
          class="wiki-switch">
          <span class="wiki-switch-thumb"></span>
        </button>
      </div>

      <div class="wiki-settings-row">
        <div>
          <div class="text-sm font-medium text-[var(--wiki-text-main)]">Ocultar contadores en cada fila</div>
          <div class="text-xs text-[var(--wiki-text-muted)]">Esconde el número de personajes debajo del título de cada rango.</div>
        </div>
        <button type="button" role="switch"
          @click="$store.settings.toggleHideTierCharacterCount()"
          :aria-checked="$store.settings.hideTierCharacterCount"
          :class="{ 'is-on': $store.settings.hideTierCharacterCount }"
          class="wiki-switch">
          <span class="wiki-switch-thumb"></span>
        </button>
      </div>
    </div>

    <!-- Opciones avanzadas de Tier List (colapsado) -->
    <div>
      <button type="button" @click="showAdvTierlist = !showAdvTierlist" class="wiki-accordion-header">
        <div class="flex items-center gap-2.5">
          <i data-lucide="shapes" class="w-4 h-4 text-[var(--wiki-accent)]"></i>
          <div>
            <span class="text-sm font-semibold block">Estilos avanzados de Tier List</span>
            <span class="text-xs text-[var(--wiki-text-muted)] font-normal block">Bordes redondeados, marcos por origen y etiquetas</span>
          </div>
        </div>
        <i data-lucide="chevron-down" class="w-4 h-4 text-[var(--wiki-text-muted)] transition-transform shrink-0"
          :class="showAdvTierlist ? 'rotate-180' : ''"></i>
      </button>

      <div x-show="showAdvTierlist" x-collapse class="wiki-accordion-body space-y-4">
        <div class="divide-y" style="border-color: var(--wiki-border);">
          <div class="wiki-settings-row">
            <div>
              <div class="text-sm font-medium text-[var(--wiki-text-main)]">Ocultar etiqueta «Invitado»</div>
              <div class="text-xs text-[var(--wiki-text-muted)]">Quita la insignia en personajes sin ficha.</div>
            </div>
            <button type="button" role="switch"
              @click="$store.settings.toggleHideGuestBadge()"
              :aria-checked="$store.settings.hideGuestBadge"
              :class="{ 'is-on': $store.settings.hideGuestBadge }"
              class="wiki-switch">
              <span class="wiki-switch-thumb"></span>
            </button>
          </div>

          <div class="wiki-settings-row">
            <div>
              <div class="text-sm font-medium text-[var(--wiki-text-main)]">Ocultar etiqueta «Plantilla»</div>
              <div class="text-xs text-[var(--wiki-text-muted)]">Quita la insignia en imágenes importadas de TierMaker.</div>
            </div>
            <button type="button" role="switch"
              @click="$store.settings.toggleHideTemplateBadge()"
              :aria-checked="$store.settings.hideTemplateBadge"
              :class="{ 'is-on': $store.settings.hideTemplateBadge }"
              class="wiki-switch">
              <span class="wiki-switch-thumb"></span>
            </button>
          </div>
        </div>

        <div class="space-y-2 pt-2 border-t" style="border-color: var(--wiki-border);">
          <div class="text-xs font-semibold">Mostrar borde alrededor según tipo</div>
          <div class="grid grid-cols-3 gap-2">
            <button type="button" @click="$store.settings.toggleTierlistShowFrameTemplate()"
              class="souls-btn !px-2.5 !py-1.5 text-xs justify-between"
              :style="$store.settings.tierlistShowFrameTemplate ? 'border-color: var(--wiki-accent); background: var(--wiki-accent-dim); color: var(--wiki-accent);' : ''">
              <span>Plantilla</span>
              <span class="font-mono text-[10px]" x-text="$store.settings.tierlistShowFrameTemplate ? 'Sí' : 'No'"></span>
            </button>
            <button type="button" @click="$store.settings.toggleTierlistShowFrameRegistered()"
              class="souls-btn !px-2.5 !py-1.5 text-xs justify-between"
              :style="$store.settings.tierlistShowFrameRegistered ? 'border-color: var(--wiki-accent); background: var(--wiki-accent-dim); color: var(--wiki-accent);' : ''">
              <span>Con ficha</span>
              <span class="font-mono text-[10px]" x-text="$store.settings.tierlistShowFrameRegistered ? 'Sí' : 'No'"></span>
            </button>
            <button type="button" @click="$store.settings.toggleTierlistShowFrameGuest()"
              class="souls-btn !px-2.5 !py-1.5 text-xs justify-between"
              :style="$store.settings.tierlistShowFrameGuest ? 'border-color: var(--wiki-accent); background: var(--wiki-accent-dim); color: var(--wiki-accent);' : ''">
              <span>Invitados</span>
              <span class="font-mono text-[10px]" x-text="$store.settings.tierlistShowFrameGuest ? 'Sí' : 'No'"></span>
            </button>
          </div>
        </div>

        <div class="space-y-3 pt-2 border-t" style="border-color: var(--wiki-border);">
          <div class="flex items-center justify-between gap-2 flex-wrap">
            <div class="wiki-segmented">
              <button type="button" @click="activeRadiusCategory = 'registered'"
                :class="{ 'is-active': activeRadiusCategory === 'registered' }"
                class="wiki-segmented-btn">Con ficha</button>
              <button type="button" @click="activeRadiusCategory = 'template'"
                :class="{ 'is-active': activeRadiusCategory === 'template' }"
                class="wiki-segmented-btn">Plantilla</button>
              <button type="button" @click="activeRadiusCategory = 'guest'"
                :class="{ 'is-active': activeRadiusCategory === 'guest' }"
                class="wiki-segmented-btn">Invitados</button>
            </div>

            <button type="button" @click="$store.settings.toggleTierlistBorderRadiusSync()"
              class="souls-btn !px-2.5 !py-1 text-xs"
              :class="{ 'souls-btn-primary': $store.settings.tierlistBorderRadiusSync }"
              title="Aplicar la misma forma a los 3 tipos">
              <i data-lucide="link" class="w-3 h-3"></i>
              <span x-text="$store.settings.tierlistBorderRadiusSync ? 'Sincronizados' : 'Sincronizar'"></span>
            </button>
          </div>

          <div class="grid grid-cols-5 gap-1.5 text-xs">
            <button type="button" @click="$store.settings.setTierlistBorderRadius(activeRadiusCategory, 0)"
              class="souls-btn !px-1 !py-1.5"
              :class="{ 'souls-btn-primary': $store.settings.getTierlistBorderRadius(activeRadiusCategory) === 0 }">Cuadrado</button>
            <button type="button" @click="$store.settings.setTierlistBorderRadius(activeRadiusCategory, 12)"
              class="souls-btn !px-1 !py-1.5"
              :class="{ 'souls-btn-primary': $store.settings.getTierlistBorderRadius(activeRadiusCategory) === 12 }">Suave</button>
            <button type="button" @click="$store.settings.setTierlistBorderRadius(activeRadiusCategory, 25)"
              class="souls-btn !px-1 !py-1.5"
              :class="{ 'souls-btn-primary': $store.settings.getTierlistBorderRadius(activeRadiusCategory) === 25 }">Medio</button>
            <button type="button" @click="$store.settings.setTierlistBorderRadius(activeRadiusCategory, 38)"
              class="souls-btn !px-1 !py-1.5"
              :class="{ 'souls-btn-primary': $store.settings.getTierlistBorderRadius(activeRadiusCategory) === 38 }">Curvo</button>
            <button type="button" @click="$store.settings.setTierlistBorderRadius(activeRadiusCategory, 50)"
              class="souls-btn !px-1 !py-1.5"
              :class="{ 'souls-btn-primary': $store.settings.getTierlistBorderRadius(activeRadiusCategory) === 50 }">Círculo</button>
          </div>

          <div class="flex items-center gap-3 text-xs">
            <input type="range" min="0" max="50" step="1"
              :value="$store.settings.getTierlistBorderRadius(activeRadiusCategory)"
              @input="$store.settings.setTierlistBorderRadius(activeRadiusCategory, $event.target.value)"
              class="wiki-range flex-1" />
            <span class="font-mono w-10 text-right" style="color: var(--wiki-accent);"
              x-text="$store.settings.getTierlistBorderRadius(activeRadiusCategory) + '%'"></span>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- 2. ANIMACIÓN DE CARGA Y HERRAMIENTAS -->
  <section class="wiki-settings-section space-y-4">
    <div class="text-sm font-semibold text-[var(--wiki-text-main)]">Inicio y Herramientas</div>

    <div class="space-y-2.5">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div class="text-sm font-medium text-[var(--wiki-text-main)]">Animación al abrir la aplicación</div>
          <div class="text-xs text-[var(--wiki-text-muted)]">Elige la pantalla de carga que prefieras ver al entrar.</div>
        </div>
        <button type="button" @click="if (window.retriggerBiosBoot) { window.retriggerBiosBoot(); }" class="souls-btn !py-1 text-xs">
          <i data-lucide="zap" class="w-3.5 h-3.5"></i>
          <span>Probar ahora</span>
        </button>
      </div>

      <div class="wiki-segmented w-full">
        <button type="button"
          @click="if (!$store.settings.showSplashScreen) $store.settings.toggleSplashScreen()"
          :class="{ 'is-active': $store.settings.showSplashScreen }"
          class="wiki-segmented-btn flex-1 justify-center">Terminal Retro BIOS</button>
        <button type="button"
          @click="if ($store.settings.showSplashScreen) $store.settings.toggleSplashScreen()"
          :class="{ 'is-active': !$store.settings.showSplashScreen }"
          class="wiki-segmented-btn flex-1 justify-center">Cubo 3D limpio</button>
      </div>
    </div>

    <div class="wiki-settings-row pt-3 border-t" style="border-color: var(--wiki-border);">
      <div>
        <div class="text-sm font-medium text-[var(--wiki-text-main)]">Sonido al iniciar</div>
        <div class="text-xs text-[var(--wiki-text-muted)]">Reproduce el efecto acústico táctico durante la pantalla de carga.</div>
      </div>
      <button type="button" role="switch" :aria-checked="String(Boolean($store.settings.bootSound))"
        @click="$store.settings.toggleBootSound()" class="wiki-switch shrink-0"
        :class="{ 'is-on': $store.settings.bootSound }" aria-label="Alternar sonido al iniciar">
        <span class="wiki-switch-thumb"></span>
      </button>
    </div>

    <div class="wiki-settings-row pt-3 border-t" style="border-color: var(--wiki-border);">
      <div>
        <div class="text-sm font-medium text-[var(--wiki-text-main)]">Consola de comandos (<kbd class="font-mono">Ctrl + \`</kbd>)</div>
        <div class="text-xs text-[var(--wiki-text-muted)]">Abre registros técnicos y comandos del sistema.</div>
      </div>
      <button type="button" @click="$store.settings.closeModal(); $store.devConsole.openModal()" class="souls-btn shrink-0">
        <i data-lucide="terminal" class="w-3.5 h-3.5"></i>
        <span>Abrir consola</span>
      </button>
    </div>
  </section>

  <!-- 3. FAVICON PERSONALIZADO (SOLO SI ESTÁ DESBLOQUEADO) -->
  <div x-show="$store.settings.faviconEasterEggUnlocked" x-cloak>
    <button type="button" @click="$store.settings.toggleFaviconEngineExpanded()" class="wiki-accordion-header"
      style="border-color: var(--wiki-accent);">
      <div class="flex items-center gap-2.5 min-w-0">
        <i data-lucide="unlock" class="w-4 h-4 shrink-0 text-[var(--wiki-accent)]"></i>
        <div>
          <span class="text-sm font-semibold block">Icono de pestaña (Favicon)</span>
          <span class="text-xs text-[var(--wiki-text-muted)] font-normal block"
            x-text="$store.settings.activeFavicon ? ($store.settings.activeFaviconName || 'Activo') : 'Predeterminado'"></span>
        </div>
      </div>
      <i data-lucide="chevron-down" class="w-4 h-4 text-[var(--wiki-text-muted)] transition-transform shrink-0"
        :class="$store.settings.faviconEngineExpanded ? 'rotate-180' : ''"></i>
    </button>

    <div x-show="$store.settings.faviconEngineExpanded" class="wiki-accordion-body space-y-3.5">
      <div class="wiki-segmented w-full">
        <button type="button" @click="$store.settings.setFaviconEngineMode('custom_heads')"
          :class="{ 'is-active': $store.settings.faviconEngineMode === 'custom_heads' }"
          class="wiki-segmented-btn flex-1 justify-center">Objetos / Cabezas</button>
        <button type="button" @click="$store.settings.setFaviconEngineMode('players')"
          :class="{ 'is-active': $store.settings.faviconEngineMode === 'players' }"
          class="wiki-segmented-btn flex-1 justify-center">Jugadores</button>
      </div>

      <div x-show="$store.settings.faviconEngineMode === 'custom_heads'" class="space-y-3">
        <div class="flex items-center gap-2">
          <input type="text" x-model="$store.settings.customHeadSearch"
            @input="$store.settings.searchCustomHeads($store.settings.customHeadSearch)"
            @keydown.enter.prevent="$store.settings.applyCustomHeadFavicon()"
            placeholder="Buscar cabeza, URL o /give..."
            class="souls-input text-xs font-mono flex-1" />
          <button type="button" @click="$store.settings.applyCustomHeadFavicon()" class="souls-btn souls-btn-primary shrink-0">Aplicar</button>
        </div>

        <div x-show="$store.settings.faviconStatusMessage"
          class="flex items-center justify-between gap-2 text-[11px] font-mono px-2.5 py-1 border"
          style="background: var(--wiki-accent-dim); border-color: var(--wiki-accent); color: var(--wiki-text-main);">
          <span class="truncate" x-text="$store.settings.faviconStatusMessage"></span>
          <span class="text-[10px] uppercase shrink-0" style="color: var(--wiki-accent);"
            x-text="$store.settings.faviconStatus === 'valid' ? 'Listo' : ($store.settings.faviconStatus === 'error' ? 'Aviso' : 'Detectado')"></span>
        </div>

        <div class="flex items-center gap-1 overflow-x-auto pb-1">
          <template x-for="cat in $store.settings.headCategories" :key="cat.id">
            <button type="button"
              @click="$store.settings.searchCustomHeads($store.settings.customHeadSearch, cat.id)"
              class="souls-btn !px-2.5 !py-1 text-xs whitespace-nowrap shrink-0"
              :class="{ 'souls-btn-primary': $store.settings.customHeadCategory === cat.id }"
              x-text="cat.name"></button>
          </template>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-52 overflow-y-auto p-2 border"
          style="background: var(--wiki-bg-canvas); border-color: var(--wiki-border);">
          <template x-for="item in $store.settings.customHeadResults" :key="item.h">
            <button type="button"
              @click="$store.settings.selectCustomHead(item)"
              @dblclick="$store.settings.applyCustomHeadFavicon(item)"
              class="p-2 border flex items-center gap-2 text-left cursor-pointer"
              :style="($store.settings.selectedCustomHead && $store.settings.selectedCustomHead.h === item.h)
                ? 'border-color: var(--wiki-accent); background: var(--wiki-accent-dim);'
                : 'border-color: var(--wiki-border); background: var(--wiki-bg-elevated);'">
              <img :src="'https://mc-heads.net/head/' + item.h + '/64'" :alt="item.n" loading="lazy"
                class="w-7 h-7 object-contain shrink-0" @error="$event.target.src = '/favicon.png'" />
              <span class="text-xs truncate" x-text="item.n"></span>
            </button>
          </template>
        </div>
      </div>

      <div x-show="$store.settings.faviconEngineMode === 'players'" class="space-y-3">
        <div class="flex items-center gap-2">
          <input type="text" x-model="$store.settings.minecraftFaviconInput"
            @input="$store.settings.checkFaviconUser()"
            @keydown.enter.prevent="$store.settings.applyMinecraftFavicon()"
            placeholder="Nick de Minecraft (ej: Steve)"
            class="souls-input text-xs flex-1" />
          <button type="button" @click="$store.settings.applyMinecraftFavicon()" class="souls-btn souls-btn-primary shrink-0">Aplicar</button>
        </div>

        <div x-show="$store.settings.faviconStatus || $store.settings.faviconStatusMessage"
          class="flex items-center justify-between gap-2 text-[11px] font-mono"
          style="color: var(--wiki-text-muted);">
          <span class="truncate" x-text="$store.settings.faviconStatusMessage || 'Vista isométrica 3D con casco.'"></span>
          <span class="inline-flex items-center gap-1 shrink-0"
            :class="$store.settings.faviconStatus === 'valid' ? 'text-emerald-400' : ($store.settings.faviconStatus === 'error' ? 'text-amber-400' : 'text-[var(--wiki-accent)]')">
            <i x-show="$store.settings.faviconStatus === 'checking'" data-lucide="loader-2" class="w-3 h-3 animate-spin"></i>
            <i x-show="$store.settings.faviconStatus === 'valid'" data-lucide="check-circle" class="w-3 h-3"></i>
            <i x-show="$store.settings.faviconStatus === 'error'" data-lucide="alert-triangle" class="w-3 h-3"></i>
            <span x-text="$store.settings.faviconStatus === 'checking' ? 'Comprobando...' : ($store.settings.faviconStatus === 'valid' ? 'Skin verificada' : ($store.settings.faviconStatus === 'error' ? 'Respaldo' : ''))"></span>
          </span>
        </div>
        <div class="flex flex-wrap gap-1.5">
          <template x-for="nick in ['MumboJumbo', 'Steve', 'Alex', 'Notch', 'Herobrine', 'Technoblade']" :key="nick">
            <button type="button"
              @click="$store.settings.minecraftFaviconInput = nick; $store.settings.checkFaviconUser(); $store.settings.applyMinecraftFavicon(nick)"
              class="souls-btn !px-2 !py-0.5 text-xs" x-text="nick"></button>
          </template>
        </div>
      </div>

      <div class="wiki-settings-card flex items-center justify-between gap-2 text-xs">
        <div class="flex items-center gap-2 min-w-0">
          <img :src="$store.settings.resolvedFaviconUrl || '/favicon.png'" alt="Favicon" class="w-4 h-4 object-contain shrink-0" @error="$event.target.src = '/favicon.png'" />
          <span class="truncate" style="color: var(--wiki-text-muted);"
            x-text="$store.settings.activeFavicon ? ($store.settings.activeFaviconName || 'Personalizado') : 'Predeterminado (/favicon.png)'"></span>
        </div>
        <button type="button" x-show="$store.settings.activeFavicon" @click="$store.settings.resetFavicon()"
          class="souls-btn !px-2 !py-1 text-xs shrink-0">Restablecer</button>
      </div>
    </div>
  </div>

</div>
`;
}
