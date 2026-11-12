/**
 * core/icons/animatedIcons.ts
 * Renderizador nativo de iconos con micro-animaciones CSS usando Lucide directamente
 * (sin React, sin createRoot y sin fugas de memoria).
 */

import { appIcons, createIconSvgElement, renderIcons } from './icons.js';

const ICON_FALLBACK_ALIAS: Record<string, string> = {
  extras: 'puzzle',
  contact: 'id-card',
  users: 'users-round',
  'clipboard-list': 'list-todo',
  swords: 'sword',
};

export function mountAnimateIcon(containerEl: Element | null, iconName: string): boolean {
  if (!containerEl || !iconName) return false;

  const iconRegistry = appIcons as Record<string, unknown>;
  const resolvedName = iconRegistry[iconName] ? iconName : ICON_FALLBACK_ALIAS[iconName] || iconName;
  const size = parseInt(containerEl.getAttribute('data-size') || '18', 10) || 18;
  const extraClass = containerEl.getAttribute('data-icon-class') || '';

  const svg = createIconSvgElement(resolvedName, {
    width: size,
    height: size,
    class: `lucide-animated-svg ${extraClass}`.trim(),
  });

  if (svg) {
    containerEl.innerHTML = '';
    containerEl.appendChild(svg);
    containerEl.setAttribute('data-animate-icon-rendered', iconName);
    containerEl.classList.add('animate-icon-host');
    return true;
  }

  containerEl.setAttribute('data-lucide', resolvedName);
  renderIcons(containerEl.parentElement || document);
  containerEl.setAttribute('data-animate-icon-rendered', iconName);
  return false;
}

export function triggerIconAnimation(containerEl: Element | null): void {
  if (!containerEl) return;
  containerEl.classList.remove('is-icon-pulsing');
  // Force reflow to restart animation cleanly
  void (containerEl as HTMLElement).offsetWidth;
  containerEl.classList.add('is-icon-pulsing');
}

export function renderAllAnimateIcons(scope: ParentNode = document): void {
  if (typeof window === 'undefined') return;
  const elements = scope.querySelectorAll('[data-animate-icon]');
  elements.forEach((el) => {
    const iconName = el.getAttribute('data-animate-icon');
    const rendered = el.getAttribute('data-animate-icon-rendered');
    if (iconName && iconName !== rendered) {
      mountAnimateIcon(el, iconName);
    }
  });
}

let _observer: MutationObserver | null = null;
let _rafId: number | null = null;

export function initAnimateIconObserver(): void {
  if (typeof window === 'undefined' || typeof MutationObserver === 'undefined') return;
  if (_observer) return;

  renderAllAnimateIcons();

  _observer = new MutationObserver((mutations) => {
    let shouldScan = false;
    for (let i = 0; i < mutations.length; i++) {
      const m = mutations[i];
      if (m.type === 'childList') {
        const added = m.addedNodes;
        for (let j = 0; j < added.length; j++) {
          const node = added[j];
          if (node.nodeType === 1) {
            const el = node as Element;
            if (el.hasAttribute('data-animate-icon') || (el.firstElementChild && el.querySelector('[data-animate-icon]'))) {
              shouldScan = true;
              break;
            }
          }
        }
      } else if (m.type === 'attributes' && m.attributeName === 'data-animate-icon') {
        shouldScan = true;
        break;
      }
      if (shouldScan) break;
    }

    if (!shouldScan) return;

    if (_rafId) cancelAnimationFrame(_rafId);
    _rafId = requestAnimationFrame(() => {
      _rafId = null;
      renderAllAnimateIcons();
    });
  });

  _observer.observe(document.body || document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['data-animate-icon'],
  });
}
