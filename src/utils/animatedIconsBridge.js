/**
 * utils/animatedIconsBridge.js
 * 
 * Puente de integración de @animateicons/react con el ecosistema Alpine.js / Vanilla JS.
 * Renderiza los micro-íconos SVG interactivos y animados de AnimateIcons (Lucide y Huge)
 * en las secciones de la ficha (sidebar y cabeceras) y en configuraciones.
 */

import React from 'react';
import { createRoot } from 'react-dom/client';

// Íconos animados de AnimateIcons (Lucide)
import {
  PaletteIcon,
  SparklesIcon,
  ImageIcon,
  DatabaseIcon,
  SlidersHorizontalIcon,
  ContactIcon,
  ActivityIcon,
  BrainIcon,
  UsersRoundIcon,
  CompassIcon,
  ClipboardListIcon,
  ZapIcon,
  SwordsIcon,
  GaugeIcon,
  LayersIcon,
  PuzzleIcon,
} from '@animateicons/react/lucide';

// Íconos animados de AnimateIcons (Huge)
import { SmileIcon } from '@animateicons/react/huge';

// Catálogo de mapeo de nombres de ícono canónicos
export const ANIMATE_ICON_MAP = {
  // Configuraciones
  'palette': PaletteIcon,
  'sparkles': SparklesIcon,
  'image': ImageIcon,
  'smile': SmileIcon,
  'database': DatabaseIcon,
  'sliders-horizontal': SlidersHorizontalIcon,
  'puzzle': PuzzleIcon,
  'extras': PuzzleIcon,

  // Secciones canónicas de la ficha (ALL_TABS)
  'id-card': ContactIcon,
  'contact': ContactIcon,
  'activity': ActivityIcon,
  'brain': BrainIcon,
  'users-round': UsersRoundIcon,
  'users': UsersRoundIcon,
  'compass': CompassIcon,
  'list-todo': ClipboardListIcon,
  'clipboard-list': ClipboardListIcon,
  'zap': ZapIcon,
  'sword': SwordsIcon,
  'swords': SwordsIcon,
  'gauge': GaugeIcon,
  'layers': LayersIcon,
};

// Registro de raíces activas de React y manejadores de animación
const _rootsMap = new WeakMap();
const _handlesMap = new WeakMap();

/**
 * Componente envoltorio reactivo con soporte de disparador externo
 */
function AnimatedIconRenderer({ IconComponent, size, className, onReady }) {
  const iconRef = React.useRef(null);

  React.useEffect(() => {
    if (iconRef.current && onReady) {
      onReady(iconRef.current);
    }
  }, [onReady]);

  return React.createElement(IconComponent, {
    ref: iconRef,
    size: size || 18,
    className: className || '',
    isAnimated: true,
  });
}

/**
 * Renderiza o actualiza un ícono animado en un elemento contenedor del DOM
 */
export function mountAnimateIcon(containerEl, iconName, options = {}) {
  if (!containerEl || !iconName) return null;

  const IconComponent = ANIMATE_ICON_MAP[iconName];
  if (!IconComponent) {
    // Si no existe versión animada en AnimateIcons (ej: steam), fallback limpio a Lucide estándar
    containerEl.setAttribute('data-lucide', iconName);
    window.lucide?.createIcons?.();
    return false;
  }

  const size = options.size || parseInt(containerEl.getAttribute('data-size') || '18', 10);
  const className = options.className || containerEl.getAttribute('data-icon-class') || '';

  let root = _rootsMap.get(containerEl);
  if (!root) {
    root = createRoot(containerEl);
    _rootsMap.set(containerEl, root);
  }

  const handleCallback = (handle) => {
    _handlesMap.set(containerEl, handle);
  };

  root.render(
    React.createElement(AnimatedIconRenderer, {
      IconComponent,
      size,
      className,
      onReady: handleCallback,
    })
  );

  containerEl.setAttribute('data-animate-icon-rendered', iconName);

  // Vincular eventos de hover en el contenedor o botón ancestro
  if (!containerEl._hasAnimateHoverBound) {
    containerEl._hasAnimateHoverBound = true;
    const triggerEl = containerEl.closest('button, [role="button"]') || containerEl;

    triggerEl.addEventListener('mouseenter', () => {
      const handle = _handlesMap.get(containerEl);
      handle?.startAnimation?.();
    });

    triggerEl.addEventListener('mouseleave', () => {
      const handle = _handlesMap.get(containerEl);
      handle?.stopAnimation?.();
    });
  }

  return true;
}

/**
 * Dispara la animación de un ícono específico
 */
export function triggerIconAnimation(containerEl) {
  if (!containerEl) return;
  const handle = _handlesMap.get(containerEl);
  handle?.startAnimation?.();
}

/**
 * Escanea y monta todos los íconos animados presentes en el DOM
 */
export function renderAllAnimateIcons(scope = document) {
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

/**
 * Observador de mutaciones para inyectar automáticamente íconos animados
 * cuando Alpine o el DOM agregue o modifique elementos con data-animate-icon
 */
let _observer = null;
let _rafId = null;

export function initAnimateIconObserver() {
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
            if (node.hasAttribute('data-animate-icon') || (node.firstElementChild && node.querySelector('[data-animate-icon]'))) {
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
