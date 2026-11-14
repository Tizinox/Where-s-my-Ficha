/**
 * @file src/ui/views/sheetUnified.ts
 * Ficha de personaje unificada estilo hoja editorial física (D&D / Mörk Borg).
 */

import {
  type PhysicalTraitConfig,
  type RpgStatConfig,
  renderPhysicalTraitTile,
  renderRpgHeaderField,
  renderRpgStatBubble,
} from '@ui/components/uiPrimitives';

const ALIGNMENT_OPTIONS = [
  'Legal Bueno',
  'Legal Neutral',
  'Legal Malvado',
  'Neutral Bueno',
  'Neutral Absoluto',
  'Neutral Malvado',
  'Caótico Bueno',
  'Caótico Neutral',
  'Caótico Malvado',
] as const;

const UNIFIED_POWER_STATS: RpgStatConfig[] = [
  {
    label: 'Tier General',
    readExpr: "$store.characters.active?.powerScaling?.tier || $store.characters.active?.powerScaling?.overallTier || '—'",
    modelExpr: '$store.characters.active.powerScaling.tier',
    placeholder: 'Ej. 8-C, 1-A',
    valClass: '',
    inputClass: 'souls-input font-mono text-center font-bold text-xs !p-1 mt-1',
  },
  {
    label: 'Potencia (AP)',
    readExpr: "$store.characters.active?.powerScaling?.strikingStrength || $store.characters.active?.powerScaling?.dc || '—'",
    modelExpr: '$store.characters.active.powerScaling.strikingStrength',
    placeholder: 'Potencia destructiva',
  },
  {
    label: 'Velocidad',
    readExpr: "$store.characters.active?.powerScaling?.speed || '—'",
    modelExpr: '$store.characters.active.powerScaling.speed',
    placeholder: 'Velocidad de combate',
  },
  {
    label: 'Durabilidad',
    readExpr: "$store.characters.active?.powerScaling?.durability || '—'",
    modelExpr: '$store.characters.active.powerScaling.durability',
    placeholder: 'Resistencia defensiva',
  },
  {
    label: 'Rango',
    readExpr: "$store.characters.active?.powerScaling?.range || '—'",
    modelExpr: '$store.characters.active.powerScaling.range',
    placeholder: 'Cuerpo a cuerpo, metros, km...',
  },
  {
    label: 'Estamina',
    readExpr: "$store.characters.active?.powerScaling?.stamina || '—'",
    modelExpr: '$store.characters.active.powerScaling.stamina',
    placeholder: 'Límite de fatiga / aguante',
  },
];

const PHYSICAL_TRAIT_FIELDS: PhysicalTraitConfig[] = [
  {
    label: 'Estatura',
    readExpr: "$store.characters.active?.body?.height || '—'",
    modelExpr: '$store.characters.active.body.height',
    placeholder: 'ej. 1.82 m',
  },
  {
    label: 'Peso / Complexión',
    readExpr: "($store.characters.active?.body?.weight || '') + ($store.characters.active?.body?.build ? ' · ' + $store.characters.active?.body?.build : '') || '—'",
    modelExpr: '$store.characters.active.body.weight',
    placeholder: 'ej. 75 kg / Atlético',
  },
  {
    label: 'Ojos',
    readExpr: "$store.characters.active?.body?.eyeColor || '—'",
    modelExpr: '$store.characters.active.body.eyeColor',
    placeholder: 'ej. Ámbar',
  },
  {
    label: 'Cabello',
    readExpr: "$store.characters.active?.body?.hairColor || '—'",
    modelExpr: '$store.characters.active.body.hairColor',
    placeholder: 'ej. Ceniza oscuro',
  },
];

const VISUAL_ASSET_TABS = [
  { key: 'avatar', label: 'Imagen', dataProp: 'avatarDataUrl', title: 'Imagen / Retrato del personaje' },
  { key: 'banner', label: 'Báner', dataProp: 'bannerDataUrl', title: 'Báner panorámico del personaje' },
  { key: 'icon', label: 'Ícono', dataProp: 'iconDataUrl', title: 'Ícono cuadrado del personaje' },
] as const;

function renderTopActionBar(): string {
  return `
  <div class="flex items-center justify-between pb-4 mb-4 border-b border-[var(--wiki-border-strong)] flex-wrap gap-3">
    <div class="flex items-center gap-2">
      <button type="button" class="souls-btn text-xs py-1 px-3 cursor-pointer"
        @click="$store.app.openDashboardView()" title="Volver al Archivo Central">
        ← Volver al Archivo
      </button>
      <div class="flex items-center gap-1.5">
        <span class="text-xs uppercase font-mono text-[var(--wiki-accent)] font-semibold">Carpeta:</span>
        <select class="souls-select text-xs !py-0.5 !px-2"
          x-effect="$el.value = $store.characters.active?.folderId || ''"
          @change="$store.characters.moveCharacterToFolder($store.characters.active.id, $event.target.value || 'unassigned')"
          title="Asignar ficha a una carpeta">
          <option value="">Sin Carpeta</option>
          <template x-for="f in $store.characters.folders" :key="f.id">
            <option :value="f.id" x-text="f.name"></option>
          </template>
        </select>
      </div>
    </div>

    <div class="flex items-center gap-2">
      <button type="button" class="souls-btn"
        :class="{ 'souls-btn-primary': $store.app.editMode }"
        @click="$store.characters.active?.isLocked && !$store.app.editMode ? $store.app.toast('Ficha protegida contra edición.', 'warning') : $store.app.toggleEditMode()"
        :title="$store.app.editMode ? 'Cambiar a Vista de Lectura' : 'Editar directamente en la ficha'">
        <i :data-lucide="$store.app.editMode ? 'book-open' : 'edit-3'" class="w-3.5 h-3.5"></i>
        <span x-text="$store.app.editMode ? 'Vista Lectura' : 'Modo Edición'"></span>
      </button>

      <button id="btn-unified-convert-sheet" type="button" class="souls-btn"
        @click="$store.characters.openSheetConverterModal($store.characters.active?.id, 'classic')"
        title="Convertir de Ficha A (Simple) a Ficha B (Compleja) sin perder detalles">
        <i data-lucide="arrow-right-left" class="w-3.5 h-3.5"></i>
        <span>Pasar a Ficha B (Compleja)</span>
      </button>

      <button type="button" class="souls-btn" @click="$store.app.openExportModal(null, 'image')" title="Exportar ficha como imagen legible, Discord o JSON">
        <i data-lucide="file-image" class="w-3.5 h-3.5"></i>
        <span>Exportar</span>
      </button>
    </div>
  </div>`;
}

function renderBannerHero(): string {
  return `
  <template x-if="$store.characters.active?.basics?.bannerDataUrl">
    <div class="relative w-full h-32 sm:h-44 border border-[var(--wiki-border-strong)] bg-black/40 mb-4 overflow-hidden group">
      <img :src="$store.app.getOptimizedImageUrl($store.characters.active.basics.bannerDataUrl)"
        alt="Báner del personaje"
        class="w-full h-full object-cover block"
        :style="$store.characters.active.basics.bannerTransform || 'width:100%;height:100%;object-fit:cover;display:block;'" />
      <div class="absolute inset-0 pointer-events-none border border-white/10"></div>
      <div x-show="$store.app.editMode"
        class="absolute top-2 right-2 flex items-center gap-1.5 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
        <label class="souls-btn souls-btn-primary text-[10px] py-1 px-2 cursor-pointer select-none bg-[var(--wiki-bg-header)]/90">
          <span>Cambiar Báner</span>
          <input type="file" accept="image/*" class="hidden"
            @change="$store.characters.uploadBanner($event, $store.characters.active?.id)" />
        </label>
        <button type="button" class="souls-btn text-[10px] py-1 px-2 cursor-pointer bg-[var(--wiki-bg-header)]/90 !text-rose-400"
          @click="$store.characters.removeAsset('banner')" title="Eliminar báner">
          Quitar
        </button>
      </div>
    </div>
  </template>`;
}

function renderEditorialHeader(): string {
  const alignmentOptionsHtml = ALIGNMENT_OPTIONS.map(
    (a) => `<option value="${a}">${a}</option>`,
  ).join('\n        ');

  return `
  <div class="rpg-sheet-header-grid">

    <!-- Nombre del Personaje -->
    <div class="rpg-header-field is-title">
      <div class="flex items-center gap-3 min-w-0">
        <template x-if="$store.characters.active?.basics?.iconDataUrl">
          <div class="w-11 h-11 sm:w-12 sm:h-12 border border-[var(--wiki-border-strong)] bg-black/40 overflow-hidden shrink-0">
            <img :src="$store.app.getOptimizedImageUrl($store.characters.active.basics.iconDataUrl)"
              alt="Ícono"
              class="w-full h-full object-cover block"
              :style="$store.characters.active.basics.iconTransform || 'width:100%;height:100%;object-fit:cover;display:block;'" />
          </div>
        </template>
        <div class="min-w-0 flex-1">
          <span class="rpg-header-label">Nombre del Personaje</span>
          <div x-show="!$store.app.editMode" class="rpg-header-val font-bold text-xl sm:text-2xl truncate"
            x-text="$store.characters.active?.basics?.fullName || $store.characters.active?.name || 'Sin Nombre'"></div>
          <input x-show="$store.app.editMode" type="text"
            class="souls-input font-wiki-serif text-lg font-bold !p-1.5 w-full"
            x-model="$store.characters.active.basics.fullName"
            @input="$store.characters.active.name = $store.characters.active.basics.fullName; $store.characters.scheduleAutoSave()"
            placeholder="Nombre completo..." />
        </div>
      </div>
    </div>
    ${renderRpgHeaderField({
      label: 'Clase / Rol',
      readExpr: "$store.characters.active?.basics?.role || '—'",
      modelExpr: '$store.characters.active.basics.role',
      placeholder: 'Ej. Cazador, Erudito...',
    })}
    ${renderRpgHeaderField({
      label: 'Especie / Raza',
      readExpr: "$store.characters.active?.basics?.race || '—'",
      modelExpr: '$store.characters.active.basics.race',
      placeholder: 'Ej. Humano, Elfo...',
    })}

    <!-- Alineamiento Moral -->
    <div class="rpg-header-field">
      <span class="rpg-header-label">Alineamiento</span>
      <div x-show="!$store.app.editMode" class="rpg-header-val truncate"
        x-text="$store.characters.active?.basics?.alignment || '—'"></div>
      <select x-show="$store.app.editMode"
        class="souls-select text-xs !p-1.5"
        x-model="$store.characters.active.basics.alignment"
        @change="$store.characters.scheduleAutoSave()">
        <option value="">Seleccionar...</option>
        ${alignmentOptionsHtml}
      </select>
    </div>
    ${renderRpgHeaderField({
      label: 'Título / Alias',
      readExpr: "$store.characters.active?.basics?.nickname ? '«' + $store.characters.active.basics.nickname + '»' : '—'",
      modelExpr: '$store.characters.active.basics.nickname',
      placeholder: 'Ej. Portador del Sol...',
      readClass: 'italic',
    })}

  </div>`;
}

function renderLeftColumn(): string {
  return `
    <div>
      <!-- I. ATRIBUTOS Y ESCALA DE PODER -->
      <div class="rpg-box">
        <div class="rpg-box-header">
          <span>Atributos &amp; Escala de Poder</span>
          <i data-lucide="shield" class="w-3.5 h-3.5 text-[var(--wiki-accent)]"></i>
        </div>
        <div class="rpg-box-body">
          <div class="rpg-stat-grid">${UNIFIED_POWER_STATS.map(renderRpgStatBubble).join('')}
          </div>
        </div>
      </div>

      <!-- II. HABILIDADES Y TÉCNICAS -->
      <div class="rpg-box">
        <div class="rpg-box-header">
          <span>Habilidades &amp; Poderes</span>
          <span class="text-[10px] font-mono opacity-60"
            x-text="($store.characters.active?.skills || []).length + ' registradas'"></span>
        </div>
        <div class="rpg-box-body space-y-2">
          <div x-show="$store.app.editMode" class="flex items-center gap-1.5 pb-2 border-b border-[var(--wiki-border)]">
            <input type="text" class="souls-input text-xs flex-1 !p-1.5"
              x-model="newSkillName"
              @keydown.enter.prevent="addQuickSkill()"
              placeholder="Nueva habilidad o técnica..." />
            <button type="button" class="souls-btn souls-btn-primary text-xs py-1.5 px-2.5 cursor-pointer"
              @click="addQuickSkill()">
              + Añadir
            </button>
          </div>

          <div class="space-y-1.5">
            <template x-for="(skill, sIdx) in ($store.characters.active?.skills || [])" :key="skill.id || sIdx">
              <div class="p-2 border border-[var(--wiki-border)] bg-[var(--wiki-bg-elevated)] text-xs">
                <div class="flex items-center justify-between gap-1">
                  <strong class="text-parchment-cream font-wiki-serif" x-text="skill.title || skill.name || 'Sin título'"></strong>
                  <button x-show="$store.app.editMode" type="button" @click="removeSkill(sIdx)"
                    class="text-slate-400 hover:text-rose-400 cursor-pointer p-0.5" title="Eliminar habilidad">
                    <i data-lucide="trash-2" class="w-3 h-3"></i>
                  </button>
                </div>
                <p x-show="!$store.app.editMode && (skill.summary || skill.effect)"
                  class="text-[11px] text-slate-300 mt-1 leading-snug"
                  x-text="skill.summary || skill.effect"></p>
                <input x-show="$store.app.editMode" type="text"
                  class="souls-input text-[11px] !p-1 mt-1"
                  x-model="skill.summary"
                  @input="$store.characters.scheduleAutoSave()"
                  placeholder="Descripción breve del efecto o técnica..." />
              </div>
            </template>

            <div x-show="!($store.characters.active?.skills || []).length" class="text-xs italic text-slate-500 py-1">
              Sin habilidades registradas aún.
            </div>
          </div>
        </div>
      </div>

      <!-- III. INVENTARIO & EQUIPAMIENTO -->
      <div class="rpg-box">
        <div class="rpg-box-header">
          <span>Inventario &amp; Objetos</span>
          <i data-lucide="backpack" class="w-3.5 h-3.5 text-[var(--wiki-accent)]"></i>
        </div>
        <div class="rpg-box-body space-y-2">
          <label class="text-[10px] font-display uppercase tracking-wider text-slate-400 block">Objetos Clave y Equipamiento</label>
          <div x-show="!$store.app.editMode" class="text-xs text-slate-300 leading-relaxed whitespace-pre-line"
            x-text="$store.characters.active?.extras?.sentimentalItems || $store.characters.active?.powerScaling?.standardEquipment || 'Sin equipo registrado.'"></div>
          <textarea x-show="$store.app.editMode"
            class="souls-input text-xs w-full min-h-[90px]"
            x-model="$store.characters.active.extras.sentimentalItems"
            @input="$store.characters.scheduleAutoSave()"
            placeholder="Amuletos, artefactos, equipo de viaje, suministros..."></textarea>
        </div>
      </div>
    </div>`;
}

function renderCenterColumn(): string {
  const assetButtons = VISUAL_ASSET_TABS.map(
    (tab) => `
            <button type="button"
              class="souls-btn text-[11px] py-1.5 px-2 justify-center cursor-pointer"
              :class="{ 'souls-btn-primary': visualTab === '${tab.key}' }"
              @click="visualTab = '${tab.key}'; showUrlInput = false;"
              title="${tab.title}">
              <span class="w-1.5 h-1.5 rounded-full shrink-0"
                :class="$store.characters.active?.basics?.${tab.dataProp} ? 'bg-emerald-400' : 'bg-slate-500/60'"></span>
              <span>${tab.label}</span>
            </button>`,
  ).join('');

  return `
    <div>
      <!-- I. IDENTIDAD VISUAL -->
      <div class="rpg-box text-center">
        <div class="rpg-box-header">
          <span>Identidad Visual</span>
          <span class="text-[10px] font-mono opacity-75" x-text="activeData.shortLabel"></span>
        </div>
        <div class="rpg-box-body flex flex-col items-center space-y-3">
          <div class="grid grid-cols-3 gap-1 w-full">${assetButtons}
          </div>

          <div class="rpg-portrait-frame w-full flex justify-center"
            :class="{ 'is-dragover': isDragging }"
            @dragover.prevent="isDragging = true" @dragleave.prevent="isDragging = false"
            @drop.prevent="handleDrop($event)">
            <div class="relative mx-auto transition-all"
              :class="{
                'w-56 h-72': visualTab === 'avatar',
                'w-full aspect-[16/5]': visualTab === 'banner',
                'w-44 h-44': visualTab === 'icon'
              }">
              <div class="w-full h-full relative overflow-hidden bg-black/60"
                :style="visualTab === 'avatar' ? \`border-radius: \${$store.characters.getAvatarRadiusCss($store.characters.active)};\` : ''">
                <template x-if="activeData.dataUrl">
                  <img :src="$store.app.getOptimizedImageUrl(activeData.dataUrl)" :alt="activeData.title"
                    class="w-full h-full object-cover block"
                    :style="activeData.transform || 'width:100%;height:100%;object-fit:cover;display:block;'" />
                </template>
                <template x-if="!activeData.dataUrl">
                  <div class="w-full h-full flex flex-col items-center justify-center p-3 text-center text-slate-500">
                    <i data-lucide="image" class="w-9 h-9 mb-1.5 opacity-50"></i>
                    <span class="text-xs uppercase font-mono font-bold tracking-wider" x-text="activeData.emptyLabel"></span>
                    <span class="text-[10px] text-slate-600 mt-0.5">Arrastra una imagen aquí</span>
                  </div>
                </template>
              </div>

              <template x-if="visualTab === 'avatar' && $store.characters.active?.basics?.avatarFrame?.url">
                <img :src="$store.characters.active.basics.avatarFrame.url"
                  class="steam-avatar-frame-overlay pointer-events-none" alt="" />
              </template>
            </div>
          </div>

          <div x-show="$store.app.editMode" class="w-full space-y-2 pt-2 border-t border-[var(--wiki-border)]">
            <div class="grid grid-cols-2 gap-1.5">
              <label class="souls-btn souls-btn-primary text-xs py-1.5 px-2 cursor-pointer select-none text-center block">
                <span x-text="(activeData.dataUrl ? 'Cambiar ' : 'Subir ') + activeData.shortLabel"></span>
                <input type="file" accept="image/*" class="hidden" @change="
                  if (visualTab === 'avatar') $store.characters.uploadAvatar($event);
                  else if (visualTab === 'banner') $store.characters.uploadBanner($event, $store.characters.active?.id);
                  else if (visualTab === 'icon') $store.characters.uploadIcon($event, $store.characters.active?.id);
                " />
              </label>
              <button type="button" class="souls-btn text-xs py-1.5 px-2 cursor-pointer"
                @click="showUrlInput = !showUrlInput">
                Desde URL
              </button>
            </div>

            <div x-show="showUrlInput" class="p-2 bg-[var(--wiki-bg-elevated)] border border-[var(--wiki-border)] text-left space-y-1">
              <input type="url" class="souls-input text-xs w-full !p-1.5"
                placeholder="https://..."
                x-model="urlInput" @keydown.enter.prevent="submitUrl()" />
              <button type="button" class="souls-btn souls-btn-primary text-[11px] py-1 px-2.5 w-full mt-1"
                @click="submitUrl()">
                Cargar Enlace
              </button>
            </div>

            <div x-show="activeData.dataUrl" class="flex items-center justify-center gap-1 pt-1 flex-wrap">
              <button type="button" class="souls-btn text-[10px] py-1 px-2"
                @click="$store.characters.reCropAsset(visualTab)" title="Recortar y re-encuadrar">
                Recortar
              </button>
              <button type="button" class="souls-btn text-[10px] py-1 px-2"
                @click="$store.characters.rotateAsset(visualTab)" title="Rotar 90 grados">
                Rotar
              </button>
              <button type="button" class="souls-btn text-[10px] py-1 px-2"
                @click="$store.characters.flipAsset(visualTab)" title="Efecto espejo">
                Espejo
              </button>
              <button type="button" class="souls-btn text-[10px] py-1 px-2 !text-rose-400"
                @click="$store.characters.removeAsset(visualTab)" title="Eliminar recurso">
                Quitar
              </button>
            </div>

            <p class="text-[10px] font-mono text-slate-400 pt-0.5" x-text="activeData.recommended"></p>
          </div>
        </div>
      </div>

      <!-- II. RASGOS BIOMÉTRICOS & CONDICIÓN FÍSICA -->
      <div class="rpg-box">
        <div class="rpg-box-header">
          <span>Condición &amp; Rasgos Físicos</span>
          <i data-lucide="user-check" class="w-3.5 h-3.5 text-[var(--wiki-accent)]"></i>
        </div>
        <div class="rpg-box-body">
          <div class="grid grid-cols-2 gap-2 text-xs">${PHYSICAL_TRAIT_FIELDS.map(renderPhysicalTraitTile).join('')}
          </div>
        </div>
      </div>

      <!-- III. ARMAS & EQUIPAMIENTO DE ATAQUE -->
      <div class="rpg-box">
        <div class="rpg-box-header">
          <span>Armas &amp; Ataques</span>
          <span class="text-[10px] font-mono opacity-60"
            x-text="($store.characters.active?.weapons || []).length + ' armas'"></span>
        </div>
        <div class="rpg-box-body space-y-2">
          <div x-show="$store.app.editMode" class="flex items-center gap-1.5 pb-2 border-b border-[var(--wiki-border)]">
            <input type="text" class="souls-input text-xs flex-1 !p-1.5"
              x-model="newWeaponName"
              @keydown.enter.prevent="addQuickWeapon()"
              placeholder="Nueva arma o catalizador..." />
            <button type="button" class="souls-btn souls-btn-primary text-xs py-1.5 px-2.5 cursor-pointer"
              @click="addQuickWeapon()">
              + Añadir
            </button>
          </div>

          <div class="space-y-1.5">
            <template x-for="(weapon, wIdx) in ($store.characters.active?.weapons || [])" :key="weapon.id || wIdx">
              <div class="p-2 border border-[var(--wiki-border)] bg-[var(--wiki-bg-elevated)] text-xs flex items-center justify-between gap-2">
                <div class="min-w-0 flex-1">
                  <strong class="text-parchment-cream font-wiki-serif truncate block" x-text="weapon.name || 'Sin Nombre'"></strong>
                  <span class="text-[10px] font-mono text-slate-400" x-text="weapon.weaponType || 'Arma'"></span>
                </div>
                <button x-show="$store.app.editMode" type="button" @click="removeWeapon(wIdx)"
                  class="text-slate-400 hover:text-rose-400 cursor-pointer p-0.5" title="Eliminar arma">
                  <i data-lucide="trash-2" class="w-3 h-3"></i>
                </button>
              </div>
            </template>

            <div x-show="!($store.characters.active?.weapons || []).length" class="text-xs italic text-slate-500 py-1">
              Sin armas registradas.
            </div>
          </div>
        </div>
      </div>

      <!-- IV. CITAS CÉLEBRES & LEMAS -->
      <div class="rpg-box">
        <div class="rpg-box-header">
          <span>Citas Célebres &amp; Lemas</span>
          <i data-lucide="quote" class="w-3.5 h-3.5 text-[var(--wiki-accent)]"></i>
        </div>
        <div class="rpg-box-body space-y-2">
          <div x-show="$store.app.editMode" class="flex items-center gap-1.5 pb-2 border-b border-[var(--wiki-border)]">
            <input type="text" class="souls-input text-xs flex-1 !p-1.5"
              x-model="newQuoteText"
              @keydown.enter.prevent="addQuickQuote()"
              placeholder="Escribe un lema o cita célebre..." />
            <button type="button" class="souls-btn souls-btn-primary text-xs py-1.5 px-2.5 cursor-pointer"
              @click="addQuickQuote()">
              + Añadir
            </button>
          </div>

          <div class="space-y-1.5">
            <template x-for="(quote, qIdx) in ($store.characters.active?.basics?.quotes || [])" :key="qIdx">
              <div class="p-2 border-l-2 border-[var(--wiki-accent)] bg-[var(--wiki-bg-elevated)] text-xs italic font-serif text-parchment-cream flex items-start justify-between gap-1">
                <span class="flex-1">“<span x-text="quote"></span>”</span>
                <button x-show="$store.app.editMode" type="button" @click="$store.characters.removeQuote(qIdx)"
                  class="text-slate-400 hover:text-rose-400 cursor-pointer p-0.5 shrink-0 ml-1">
                  <i data-lucide="trash-2" class="w-3 h-3"></i>
                </button>
              </div>
            </template>

            <div x-show="!($store.characters.active?.basics?.quotes || []).length" class="text-xs italic text-slate-500 py-1">
              Sin citas célebres.
            </div>
          </div>
        </div>
      </div>
    </div>`;
}

function renderRightColumn(): string {
  return `
    <div>
      <!-- I. PERSONALIDAD & CONDUCTA -->
      <div class="rpg-box">
        <div class="rpg-box-header">
          <span>Personalidad &amp; Rasgos</span>
          <i data-lucide="brain" class="w-3.5 h-3.5 text-[var(--wiki-accent)]"></i>
        </div>
        <div class="rpg-box-body space-y-3 text-xs">
          <div>
            <span class="block text-[10px] font-display uppercase tracking-wider text-slate-400 mb-1">Resumen de Personalidad</span>
            <div x-show="!$store.app.editMode" class="text-slate-300 leading-relaxed"
              x-text="$store.characters.active?.mind?.personalitySummary || 'Sin resumen registrado.'"></div>
            <textarea x-show="$store.app.editMode"
              class="souls-input text-xs w-full min-h-[70px]"
              x-model="$store.characters.active.mind.personalitySummary"
              @input="$store.characters.scheduleAutoSave()"
              placeholder="¿Cómo se comporta, qué lo define emocionalmente?"></textarea>
          </div>

          <div class="pt-2 border-t border-[var(--wiki-border)]">
            <span class="block text-[10px] font-display uppercase tracking-wider text-emerald-400 mb-1">Virtudes / Ideales</span>
            <div x-show="!$store.app.editMode" class="text-slate-300"
              x-text="$store.characters.active?.mind?.virtues || '—'"></div>
            <input x-show="$store.app.editMode" type="text" class="souls-input text-xs w-full !p-1.5"
              x-model="$store.characters.active.mind.virtues" @input="$store.characters.scheduleAutoSave()"
              placeholder="Principios, valores o fortalezas de carácter..." />
          </div>

          <div class="pt-2 border-t border-[var(--wiki-border)]">
            <span class="block text-[10px] font-display uppercase tracking-wider text-rose-400 mb-1">Defectos / Flaws</span>
            <div x-show="!$store.app.editMode" class="text-slate-300"
              x-text="$store.characters.active?.mind?.flaws || '—'"></div>
            <input x-show="$store.app.editMode" type="text" class="souls-input text-xs w-full !p-1.5"
              x-model="$store.characters.active.mind.flaws" @input="$store.characters.scheduleAutoSave()"
              placeholder="Debilidades, compulsiones o puntos ciegos..." />
          </div>
        </div>
      </div>

      <!-- II. HISTORIA, LORE & TRASFONDO -->
      <div class="rpg-box">
        <div class="rpg-box-header">
          <span>Historia, Lore &amp; Trasfondo</span>
          <span class="text-[10px] font-mono opacity-60">Crónica Completa</span>
        </div>
        <div class="rpg-box-body p-0">
          <div x-show="!$store.app.editMode" class="rpg-lined-area prose max-w-none text-xs sm:text-sm p-4 whitespace-pre-line leading-loose"
            x-html="$store.app.formatRichText($store.characters.active?.beliefs?.originEvent || $store.characters.active?.body?.physicalDescription || 'Sin biografía o trasfondo histórico registrado.')"></div>

          <textarea x-show="$store.app.editMode"
            class="rpg-lined-area w-full p-4 border-0 focus:outline-none resize-vertical"
            style="min-height: 280px;"
            x-model="$store.characters.active.beliefs.originEvent"
            @input="$store.characters.scheduleAutoSave()"
            placeholder="Escribe la biografía, crónicas, eventos fundacionales y lore completo del personaje aquí..."></textarea>
        </div>
      </div>

      <!-- III. CURIOSIDADES & NOTAS DE CAMPAÑA -->
      <div class="rpg-box">
        <div class="rpg-box-header">
          <span>Notas &amp; Curiosidades</span>
          <i data-lucide="sparkles" class="w-3.5 h-3.5 text-[var(--wiki-accent)]"></i>
        </div>
        <div class="rpg-box-body space-y-2 text-xs">
          <div x-show="!$store.app.editMode" class="text-slate-300 leading-relaxed whitespace-pre-line"
            x-text="$store.characters.active?.extras?.curiosities || 'Sin notas adicionales.'"></div>
          <textarea x-show="$store.app.editMode"
            class="souls-input text-xs w-full min-h-[80px]"
            x-model="$store.characters.active.extras.curiosities"
            @input="$store.characters.scheduleAutoSave()"
            placeholder="Trivia, actor de voz ficticio, temas musicales, notas de la mesa..."></textarea>
        </div>
      </div>
    </div>`;
}

export function renderUnifiedSheet(): string {
  return `<!-- ==============================================================
     FICHA DE PERSONAJE UNIFICADA (ESTILO HOJA FÍSICA RPG / D&D & MÖRK BORG)
     ============================================================== -->
<div class="rpg-sheet-shell" id="unified-character-sheet" x-data="sheetVisualMedia('unified')">
  ${renderTopActionBar()}
  ${renderBannerHero()}
  ${renderEditorialHeader()}

  <div class="rpg-sheet-3col">
    ${renderLeftColumn()}
    ${renderCenterColumn()}
    ${renderRightColumn()}
  </div>
</div>`;
}

