/**
 * @file src/ui/views/sheetClassic.ts
 * Contenedor principal de Ficha Clásica (Rama main / Modular por 12 Pestañas).
 */

import { renderTabBasics } from '@ui/tabs/tabBasics';
import { renderTabBody } from '@ui/tabs/tabBody';
import { renderTabMind } from '@ui/tabs/tabMind';
import { renderTabSocial } from '@ui/tabs/tabSocial';
import { renderTabBeliefs } from '@ui/tabs/tabBeliefs';
import { renderTabPriorities } from '@ui/tabs/tabPriorities';
import { renderTabSkills } from '@ui/tabs/tabSkills';
import { renderTabWeapons } from '@ui/tabs/tabWeapons';
import { renderTabPower } from '@ui/tabs/tabPower';
import { renderTabExtras } from '@ui/tabs/tabExtras';
import { renderTabSteam } from '@ui/tabs/tabSteam';
import { renderTabCustom } from '@ui/tabs/tabCustom';

const CLASSIC_LAZY_TABS = [
  { id: 'body', render: renderTabBody },
  { id: 'mind', render: renderTabMind },
  { id: 'social', render: renderTabSocial },
  { id: 'beliefs', render: renderTabBeliefs },
  { id: 'priorities', render: renderTabPriorities },
  { id: 'skills', render: renderTabSkills },
  { id: 'weapons', render: renderTabWeapons },
  { id: 'power', render: renderTabPower },
  { id: 'extras', render: renderTabExtras },
  { id: 'steam', render: renderTabSteam },
] as const;

export function renderClassicSheet(): string {
  const lazyTabsHtml = CLASSIC_LAZY_TABS.map(
    (tab) => `
          <template x-if="$store.app.isTabVisited('${tab.id}')">
            <div class="contents">${tab.render()}</div>
          </template>`,
  ).join('');

  return `
        <div id="tab-content" class="min-h-[600px] min-h-[60vh]" x-show="!$store.characters.loading && !$store.app.isSheetLoading" x-cloak>
          <!-- Encabezado de sección -->
          <div class="section-header-bar flex items-center justify-between gap-3 flex-wrap">
            <template x-for="tab in $store.app.activeTabObjects" :key="tab.id">
              <span x-show="$store.app.currentTab === tab.id">
                <h2 class="section-title">
                  <span :data-animate-icon="tab.icon" data-size="24" class="w-6 h-6 flex items-center justify-center shrink-0"></span>
                  <span x-text="tab.label"></span>
                </h2>
              </span>
            </template>
            <div class="flex items-center gap-2 shrink-0 ml-auto">
              <button id="btn-classic-convert-sheet" type="button"
                @click="$store.characters.openSheetConverterModal($store.characters.active?.id, 'unified')"
                class="souls-btn !py-1 !px-2.5 text-xs cursor-pointer inline-flex items-center gap-1.5"
                title="Convertir de Ficha B (Compleja) a Ficha A (Simple) conservando todos los detalles">
                <i data-lucide="arrow-right-left" class="w-3.5 h-3.5"></i>
                <span>Pasar a Ficha A (Simple)</span>
              </button>
              <button id="btn-classic-export-pdf" type="button"
                @click="$store.app.openExportModal(null, 'pdf')"
                class="souls-btn !py-1 !px-2.5 text-xs cursor-pointer inline-flex items-center gap-1.5"
                title="Descargar PDF organizado con todas las secciones e imágenes de la ficha">
                <i data-lucide="file-text" class="w-3.5 h-3.5"></i>
                <span>Exportar PDF</span>
              </button>
              <span class="mode-badge shadow-lg shadow-black/80 backdrop-blur-md"
                :class="$store.app.editMode ? 'mode-badge-edit' : 'mode-badge-preview'"
                x-text="$store.app.editMode ? '// EDITANDO' : '// VISTA PREVIA'"></span>
            </div>
          </div>

          <!-- Pestañas Modulares del Personaje -->
          ${renderTabBasics()}

          <!-- Pestañas Secundarias con Renderizado Diferido Bajo Demanda (Lazy Mount) -->${lazyTabsHtml}

          <!-- Pestaña para Secciones Personalizadas Dinámicas -->
          ${renderTabCustom()}
        </div>`;
}

