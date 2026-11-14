/**
 * @file src/ui/views/settings/settingsData.ts
 */

export function renderSettingsData(): string {
  return `<!-- SUB-PESTAÑA 5: COPIAS DE SEGURIDAD Y DATOS (1 COLUMNA INTUITIVA) -->
<div x-data="{ showFolders: false, showStorage: false, selectedFolderId: $store.characters.folders?.[0]?.id || 'unassigned' }"
  class="space-y-5">

  <div class="wiki-settings-pane-head">
    <h2 class="wiki-settings-pane-title">Copias de Seguridad y Datos</h2>
    <p class="wiki-settings-pane-desc">Exporta tus fichas para guardarlas a salvo, restaura archivos o gestiona el espacio usado.</p>
  </div>

  <!-- 1. ACCIONES PRINCIPALES (SIEMPRE VISIBLES Y CLARAS) -->
  <section class="wiki-settings-section space-y-5">
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <!-- Exportar -->
      <div class="wiki-settings-card flex flex-col justify-between gap-3">
        <div>
          <div class="text-sm font-semibold text-[var(--wiki-text-main)]">Guardar copia de seguridad</div>
          <p class="text-xs mt-1 m-0" style="color: var(--wiki-text-muted);"
            x-text="$store.characters.list?.length === 1 ? 'Descarga tu ficha y configuración en un archivo .json.' : \`Descarga tus \${$store.characters.list?.length || 0} fichas y ajustes en un archivo .json.\`"></p>
        </div>

        <div class="space-y-2">
          <button type="button"
            x-show="$store.characters.active"
            @click="$store.settings.closeModal(); $store.app.openExportModal(null)"
            class="souls-btn souls-btn-primary w-full">
            <i data-lucide="file-image" class="w-3.5 h-3.5"></i>
            <span x-text="$store.characters.active?.sheetType === 'classic' ? 'Exportar Ficha B (PDF con imágenes)' : 'Exportar ficha actual (Imagen PNG)'"></span>
          </button>

          <button type="button" @click="$store.characters.exportAllJSON()" class="souls-btn w-full"
            :class="{ 'souls-btn-primary': !$store.characters.active }">
            <i data-lucide="download" class="w-3.5 h-3.5"></i>
            <span>Descargar copia completa (.json)</span>
          </button>

          <div class="flex flex-wrap gap-1.5">
            <button type="button" @click="$store.characters.exportJSON()" class="souls-btn !px-2.5 !py-1 text-xs flex-1">
              <span>JSON actual</span>
            </button>
            <button type="button" @click="$store.characters.copyActiveJSONToClipboard()" class="souls-btn !px-2.5 !py-1 text-xs flex-1">
              <span>Copiar JSON</span>
            </button>
            <button type="button" @click="$store.settings.closeModal(); $store.characters.buildDiscordExport()"
              class="souls-btn !px-2.5 !py-1 text-xs flex-1" title="Exportar formato Markdown para Discord">
              <span>Discord</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Importar -->
      <div class="wiki-settings-card flex flex-col justify-between gap-3"
        x-data="{ isDragging: false }"
        @dragover.prevent="isDragging = true"
        @dragleave.prevent="isDragging = false"
        @drop.prevent="isDragging = false; $store.characters.handleJSONDrop($event)"
        :style="isDragging ? 'border-color: var(--wiki-accent); background: var(--wiki-accent-dim);' : ''">
        <div>
          <div class="text-sm font-semibold text-[var(--wiki-text-main)]">Restaurar o importar</div>
          <p class="text-xs mt-1 m-0" style="color: var(--wiki-text-muted);">
            Sube o arrastra aquí un archivo <code class="font-mono">.json</code> para añadir o restaurar fichas.
          </p>
        </div>

        <input x-ref="settingsJsonFileInput" type="file" accept=".json,application/json" class="hidden"
          @change="$store.characters.importJSON($event)" />

        <div class="space-y-2">
          <button type="button" @click="$refs.settingsJsonFileInput.click()" class="souls-btn w-full">
            <i data-lucide="upload-cloud" class="w-3.5 h-3.5"></i>
            <span>Elegir archivo .json</span>
          </button>

          <div class="flex gap-1.5">
            <button type="button" @click="$store.characters.pasteJSONFromClipboard()" class="souls-btn !px-2.5 !py-1 text-xs flex-1">
              <span>Pegar portapapeles</span>
            </button>
            <button type="button"
              @click="$store.characters.jsonPreview.manualInputOpen = !$store.characters.jsonPreview.manualInputOpen"
              class="souls-btn !px-2.5 !py-1 text-xs flex-1">
              <span x-text="$store.characters.jsonPreview.manualInputOpen ? 'Cerrar texto' : 'Pegar texto'"></span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Pegar JSON manual cuando el usuario lo abre -->
    <div x-show="$store.characters.jsonPreview.manualInputOpen" x-cloak class="wiki-settings-card space-y-2.5">
      <div class="flex items-center justify-between text-xs">
        <span class="font-semibold">Pegar contenido JSON manualmente</span>
        <button type="button" @click="$store.characters.jsonPreview.manualInputText = ''"
          class="text-xs text-rose-400 cursor-pointer hover:underline">Limpiar</button>
      </div>
      <textarea x-model="$store.characters.jsonPreview.manualInputText" placeholder="{ ... }" rows="4"
        class="souls-textarea text-xs font-mono resize-y"></textarea>
      <button type="button" @click="$store.characters.processManualJSONInput()" class="souls-btn souls-btn-primary">
        <i data-lucide="file-search" class="w-3.5 h-3.5"></i>
        <span>Revisar e importar</span>
      </button>
    </div>
  </section>

  <!-- 2. EXPORTAR POR CARPETA (COLAPSADO POR DEFECTO) -->
  <div>
    <button type="button" @click="showFolders = !showFolders" class="wiki-accordion-header">
      <div class="flex items-center gap-2.5 min-w-0">
        <i data-lucide="folder-output" class="w-4 h-4 shrink-0 text-[var(--wiki-accent)]"></i>
        <div>
          <span class="text-sm font-semibold block">Exportar solo una carpeta</span>
          <span class="text-xs text-[var(--wiki-text-muted)] font-normal block">Descarga o comparte únicamente los personajes de una categoría</span>
        </div>
      </div>
      <i data-lucide="chevron-down" class="w-4 h-4 text-[var(--wiki-text-muted)] transition-transform shrink-0"
        :class="showFolders ? 'rotate-180' : ''"></i>
    </button>

    <div x-show="showFolders" x-collapse class="wiki-accordion-body space-y-3">
      <div class="flex flex-wrap items-center gap-2">
        <select x-model="selectedFolderId" class="souls-select text-xs flex-1 min-w-[200px]">
          <option value="unassigned" x-text="\`Sin carpeta (\${$store.characters.getFolderCharCount('unassigned')} fichas)\`"></option>
          <template x-for="f in $store.characters.folders" :key="f.id">
            <option :value="f.id" x-text="\`\${f.name} (\${$store.characters.getFolderCharCount(f.id)} fichas)\`"></option>
          </template>
        </select>

        <button type="button" @click="$store.characters.openCreateFolderModal()" class="souls-btn text-xs">
          <i data-lucide="folder-plus" class="w-3.5 h-3.5"></i>
          <span>Nueva carpeta</span>
        </button>
      </div>

      <div class="flex flex-wrap gap-2">
        <button type="button"
          @click="$store.characters.exportFolderJSON(selectedFolderId)"
          :disabled="$store.characters.getFolderCharCount(selectedFolderId) === 0"
          class="souls-btn souls-btn-primary disabled:opacity-40 disabled:cursor-not-allowed">
          <i data-lucide="download" class="w-3.5 h-3.5"></i>
          <span>Descargar carpeta</span>
        </button>
        <button type="button"
          @click="$store.characters.copyFolderJSONToClipboard(selectedFolderId)"
          :disabled="$store.characters.getFolderCharCount(selectedFolderId) === 0"
          class="souls-btn disabled:opacity-40 disabled:cursor-not-allowed">
          <i data-lucide="clipboard" class="w-3.5 h-3.5"></i>
          <span>Copiar JSON</span>
        </button>
      </div>
    </div>
  </div>

  <!-- 3. ESPACIO OCUPADO Y LIMPIEZA (COLAPSADO POR DEFECTO) -->
  <div>
    <button type="button"
      @click="showStorage = !showStorage; if (showStorage) $store.settings.refreshStorageTelemetry()"
      class="wiki-accordion-header">
      <div class="flex items-center gap-2.5 min-w-0">
        <i data-lucide="hard-drive" class="w-4 h-4 shrink-0 text-[var(--wiki-accent)]"></i>
        <div>
          <span class="text-sm font-semibold block">Espacio usado en el navegador</span>
          <span class="text-xs text-[var(--wiki-text-muted)] font-normal block"
            x-text="\`\${$store.settings.storageUsageMB} MB usados · Ver desglose, archivos grandes o limpiar caché\`"></span>
        </div>
      </div>
      <i data-lucide="chevron-down" class="w-4 h-4 text-[var(--wiki-text-muted)] transition-transform shrink-0"
        :class="showStorage ? 'rotate-180' : ''"></i>
    </button>

    <div x-show="showStorage" x-collapse class="wiki-accordion-body space-y-4">
      <div class="wiki-settings-card space-y-2">
        <div class="flex items-center justify-between text-xs">
          <span style="color: var(--wiki-text-muted);">Espacio total utilizado</span>
          <strong class="font-mono" x-text="\`\${$store.settings.storageUsageMB} MB de \${$store.settings.storageQuotaGB} GB\`"></strong>
        </div>
        <div class="w-full h-2 overflow-hidden" style="background: var(--wiki-bg-outer); border: 1px solid var(--wiki-border);">
          <div class="h-full transition-all duration-300" style="background-color: var(--wiki-accent);"
            :style="\`width: \${Math.max(2, Math.min(100, $store.settings.storagePercentage * 10))}%\`"></div>
        </div>
      </div>

      <div class="wiki-settings-card divide-y text-xs" style="border-color: var(--wiki-border);">
        <div class="flex items-center justify-between py-1.5">
          <span style="color: var(--wiki-text-muted);">Fichas (<span x-text="$store.settings.storageBreakdown.rosterCount"></span>)</span>
          <strong class="font-mono" x-text="\`\${($store.settings.storageBreakdown.rosterBytes / (1024 * 1024)).toFixed(1)} MB\`"></strong>
        </div>
        <div class="flex items-center justify-between py-1.5" style="border-color: var(--wiki-border);">
          <span style="color: var(--wiki-text-muted);">Tier List (<span x-text="($store.settings.storageBreakdown.tierlistGuestsCount || 0) + ($store.settings.storageBreakdown.tierlistTemplatesCount || 0)"></span>)</span>
          <strong class="font-mono" x-text="\`\${($store.settings.storageBreakdown.tierlistBytes / (1024 * 1024)).toFixed(1)} MB\`"></strong>
        </div>
        <div class="flex items-center justify-between py-1.5" style="border-color: var(--wiki-border);">
          <span style="color: var(--wiki-text-muted);">Fondos</span>
          <strong class="font-mono" x-text="\`\${($store.settings.storageBreakdown.backgroundsBytes / (1024 * 1024)).toFixed(1)} MB\`"></strong>
        </div>
        <div class="flex items-center justify-between py-1.5" style="border-color: var(--wiki-border);">
          <span style="color: var(--wiki-text-muted);">Emojis</span>
          <strong class="font-mono" x-text="\`\${($store.settings.storageBreakdown.emojisBytes / (1024 * 1024)).toFixed(1)} MB\`"></strong>
        </div>
        <div class="flex items-center justify-between py-1.5" style="border-color: var(--wiki-border);">
          <span style="color: var(--wiki-text-muted);">Sistema y caché</span>
          <strong class="font-mono" x-text="\`\${(($store.settings.storageBreakdown.systemOverheadBytes || 0) / (1024 * 1024)).toFixed(1)} MB\`"></strong>
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <span x-show="$store.settings.storageIsPersisted"
          class="text-xs px-2.5 py-1 border inline-flex items-center gap-1.5"
          style="border-color: var(--wiki-accent); background: var(--wiki-accent-dim); color: var(--wiki-accent);">
          <i data-lucide="shield-check" class="w-3.5 h-3.5"></i>
          <span>Almacenamiento protegido</span>
        </span>
        <button type="button"
          x-show="!$store.settings.storageIsPersisted && $store.settings.storagePersistenceSupported"
          @click="$store.settings.requestPersistence()" class="souls-btn">
          <i data-lucide="shield" class="w-3.5 h-3.5"></i>
          <span>Proteger datos contra limpieza del navegador</span>
        </button>
        <button type="button" @click="$store.settings.runStorageCleanup()" :disabled="$store.settings.isCleaningStorage"
          class="souls-btn disabled:opacity-50">
          <i data-lucide="recycle" class="w-3.5 h-3.5" :class="$store.settings.isCleaningStorage ? 'animate-spin' : ''"></i>
          <span x-text="$store.settings.isCleaningStorage ? 'Limpiando...' : 'Limpiar archivos temporales'"></span>
        </button>
      </div>

      <template x-if="$store.settings.heavyAssets.length > 0">
        <div class="space-y-1.5 pt-2 border-t" style="border-color: var(--wiki-border);">
          <div class="text-xs font-semibold">Imágenes más pesadas (&gt; 1 MB)</div>
          <div class="space-y-1.5 max-h-48 overflow-y-auto">
            <template x-for="asset in $store.settings.heavyAssets" :key="asset.id">
              <div class="wiki-settings-card flex items-center justify-between gap-2 text-xs">
                <div class="min-w-0">
                  <div class="font-medium truncate" x-text="asset.name"></div>
                  <div class="text-[11px] truncate" style="color: var(--wiki-text-muted);" x-text="asset.context"></div>
                </div>
                <div class="flex items-center gap-2 shrink-0">
                  <span class="font-mono text-[11px]" style="color: var(--wiki-accent);" x-text="asset.sizeFormatted"></span>
                  <button type="button" x-show="asset.actionType !== 'none'" @click="$store.settings.handleHeavyAssetAction(asset)"
                    class="souls-btn !p-1" title="Ir al elemento">
                    <i data-lucide="external-link" class="w-3.5 h-3.5"></i>
                  </button>
                </div>
              </div>
            </template>
          </div>
        </div>
      </template>
    </div>
  </div>

  <!-- 4. REINICIO DE FÁBRICA -->
  <section class="wiki-settings-section flex flex-col sm:flex-row sm:items-center justify-between gap-3"
    style="border-color: rgba(244, 63, 94, 0.35);">
    <div>
      <div class="text-sm font-semibold" style="color: #fb7185;">Empezar desde cero</div>
      <div class="text-xs" style="color: var(--wiki-text-muted);">Borra fichas locales y restaura todo a estado inicial (pide confirmación).</div>
    </div>
    <button type="button" @click="$store.app.openFactoryResetModal()" class="souls-btn souls-btn-danger shrink-0">
      <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
      <span>Borrar todo</span>
    </button>
  </section>

</div>
`;
}
