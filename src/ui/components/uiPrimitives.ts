/**
 * @file src/ui/components/uiPrimitives.ts
 * Constructores reutilizables de componentes UI y primitivos de plantilla.
 */

export interface MainNavTabConfig {
  id: string;
  viewName: string;
  label: string;
  shortLabel?: string;
  clickExpr: string;
}

export interface RpgFieldConfig {
  label: string;
  readExpr: string;
  modelExpr: string;
  placeholder?: string;
  inputHandler?: string;
  readClass?: string;
}

export interface RpgStatConfig {
  label: string;
  readExpr: string;
  modelExpr: string;
  placeholder: string;
  valClass?: string;
  inputClass?: string;
}

export interface PhysicalTraitConfig {
  label: string;
  readExpr: string;
  modelExpr: string;
  placeholder: string;
}

export interface SettingsNavItemConfig {
  subTab: string;
  icon: string;
  label: string;
}

/**
 * Escapa texto plano para insertarlo de forma segura dentro de atributos HTML.
 */
export function escapeHtmlAttr(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

/**
 * Renderiza un botón de navegación principal de la barra superior.
 */
export function renderMainNavTab(tab: MainNavTabConfig): string {
  const labelHtml = tab.shortLabel
    ? `<span class="hidden 2xl:inline">${tab.label}</span><span class="2xl:hidden">${tab.shortLabel}</span>`
    : tab.label;

  return `
        <button type="button" data-tab="${escapeHtmlAttr(tab.id)}"
          class="souls-btn !border-0 !bg-transparent text-xs py-1.5 px-2.5 uppercase tracking-wider transition-colors cursor-pointer whitespace-nowrap shrink-0"
          :class="$store.app.activeView === '${tab.viewName}' ? '!text-[var(--wiki-accent)] !border-b-2 !border-[var(--wiki-accent)] font-semibold' : 'text-slate-300 hover:text-white'"
          @click="${escapeHtmlAttr(tab.clickExpr)}">
          ${labelHtml}
        </button>`;
}

/**
 * Renderiza un campo de texto o selector en la cabecera editorial de la ficha unificada.
 */
export function renderRpgHeaderField(field: RpgFieldConfig): string {
  const inputEvent = field.inputHandler || '$store.characters.scheduleAutoSave()';
  const readClass = field.readClass ? ` ${field.readClass}` : '';
  const placeholder = field.placeholder ? ` placeholder="${escapeHtmlAttr(field.placeholder)}"` : '';

  return `
    <div class="rpg-header-field">
      <span class="rpg-header-label">${field.label}</span>
      <div x-show="!$store.app.editMode" class="rpg-header-val truncate${readClass}"
        x-text="${escapeHtmlAttr(field.readExpr)}"></div>
      <input x-show="$store.app.editMode" type="text"
        class="souls-input text-xs !p-1.5"
        x-model="${escapeHtmlAttr(field.modelExpr)}"
        @input="${escapeHtmlAttr(inputEvent)}"${placeholder} />
    </div>`;
}

/**
 * Renderiza una celda estadística (stat bubble) de la ficha unificada.
 */
export function renderRpgStatBubble(stat: RpgStatConfig): string {
  const valClass = stat.valClass ? ` ${stat.valClass}` : ' text-xs truncate';
  const inputClass = stat.inputClass || 'souls-input text-xs text-center !p-1 mt-1';

  return `
            <div class="rpg-stat-bubble">
              <span class="rpg-stat-label">${stat.label}</span>
              <div x-show="!$store.app.editMode" class="rpg-stat-val${valClass}"
                x-text="${escapeHtmlAttr(stat.readExpr)}"></div>
              <input x-show="$store.app.editMode" type="text"
                class="${escapeHtmlAttr(inputClass)}"
                x-model="${escapeHtmlAttr(stat.modelExpr)}"
                @input="$store.characters.scheduleAutoSave()"
                placeholder="${escapeHtmlAttr(stat.placeholder)}" />
            </div>`;
}

/**
 * Renderiza una celda de rasgo biométrico físico (2x2) en la ficha unificada.
 */
export function renderPhysicalTraitTile(trait: PhysicalTraitConfig): string {
  return `
            <div class="p-2 border border-[var(--wiki-border)] bg-[var(--wiki-bg-elevated)]">
              <span class="block text-[9.5px] font-display uppercase text-slate-400">${trait.label}</span>
              <span x-show="!$store.app.editMode" class="font-semibold text-parchment-cream"
                x-text="${escapeHtmlAttr(trait.readExpr)}"></span>
              <input x-show="$store.app.editMode" type="text" class="souls-input text-xs !p-1 mt-0.5"
                x-model="${escapeHtmlAttr(trait.modelExpr)}" @input="$store.characters.scheduleAutoSave()" placeholder="${escapeHtmlAttr(trait.placeholder)}" />
            </div>`;
}

/**
 * Renderiza un ítem del menú lateral de configuración.
 */
export function renderSettingsNavItem(item: SettingsNavItemConfig): string {
  return `
            <button type="button" role="tab"
              @click="$store.settings.setSubTab('${item.subTab}')"
              :aria-selected="$store.settings.activeSubTab === '${item.subTab}'"
              :class="{ 'is-active': $store.settings.activeSubTab === '${item.subTab}' }"
              class="wiki-settings-nav-item">
              <i data-lucide="${escapeHtmlAttr(item.icon)}" class="w-4 h-4 shrink-0"></i>
              <span>${item.label}</span>
            </button>`;
}

