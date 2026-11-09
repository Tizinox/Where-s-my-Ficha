/**
 * utils/magneticTabs.js
 * 
 * Motor de Navegación: Riel de Píldora Líquida Magnética (Magnetic Liquid Pill Rail)
 * 
 * Implementa física de doble resorte acoplado (Differential Two-Edge Springs):
 * - Al moverse entre pestañas, el borde frontal se dispara primero y el borde
 *   trasero se rezaga ligeramente, provocando un estiramiento físico real
 *   de masa líquida (mercurio / plasma) en pleno vuelo.
 * - Al frenar en el destino, el borde trasero alcanza al frontal y se comprime
 *   con un suave rebote elástico (spring settling).
 * - Soporte para píldora fantasma magnética en hover.
 * - Aceleración por GPU (translate3d) a 60/120 FPS y 0% de CPU en reposo.
 */

export class MagneticLiquidRail {
  constructor(options = {}) {
    this.containerId = options.containerId ?? 'settings-subtabs-rail';
    this.container = null;
    this.pill = null;
    this.ghostPill = null;
    this.activeTabId = options.initialTab ?? 'identity';
    this.hoverTabId = null;

    // Física de los bordes (Springs)
    this.leftEdge = 0;
    this.rightEdge = 0;
    this.targetLeft = 0;
    this.targetRight = 0;
    this.leftVelocity = 0;
    this.rightVelocity = 0;

    // Ghost pill
    this.ghostLeft = 0;
    this.ghostWidth = 0;

    this.rafId = null;
    this.isAnimating = false;
    this.lastTime = 0;
    this.resizeObserver = null;

    // Bindings
    this.renderLoop = this.renderLoop.bind(this);
    this.handleResize = this.handleResize.bind(this);
  }

  init(containerId = this.containerId) {
    this.containerId = containerId;
    this.container = document.getElementById(this.containerId);
    if (!this.container) return false;

    this.pill = this.container.querySelector('.settings-liquid-pill');
    this.ghostPill = this.container.querySelector('.settings-ghost-pill');

    if (!this.pill) return false;

    // Medición inicial de la pestaña activa
    const activeTab = window.Alpine?.store('settings')?.activeSubTab || this.activeTabId;
    this.activeTabId = activeTab;

    // Medir y fijar posición sin animación en el arranque inicial
    requestAnimationFrame(() => {
      this.measureTab(this.activeTabId, true);
    });

    // Observador de cambio de tamaño
    if (window.ResizeObserver) {
      this.resizeObserver = new ResizeObserver(this.handleResize);
      this.resizeObserver.observe(this.container);
    } else {
      window.addEventListener('resize', this.handleResize, { passive: true });
    }

    return true;
  }

  handleResize() {
    this.measureTab(this.activeTabId, false);
  }

  getTabElement(tabId) {
    if (!this.container) return null;
    return this.container.querySelector(`[data-subtab="${tabId}"]`);
  }

  measureTab(tabId, snapInstantly = false) {
    const el = this.getTabElement(tabId);
    if (!el || !this.container) return;

    const left = el.offsetLeft;
    const width = el.offsetWidth;
    const right = left + width;

    this.targetLeft = left;
    this.targetRight = right;

    if (snapInstantly || (this.leftEdge === 0 && this.rightEdge === 0)) {
      this.leftEdge = left;
      this.rightEdge = right;
      this.leftVelocity = 0;
      this.rightVelocity = 0;
      this.applyPillGeometry();
    } else {
      this.startAnimation();
    }
  }

  setActive(tabId, animate = true) {
    this.activeTabId = tabId;
    this.measureTab(tabId, !animate);
  }

  setHover(tabId) {
    this.hoverTabId = tabId;
    if (!this.ghostPill) return;

    if (!tabId || tabId === this.activeTabId) {
      this.ghostPill.style.opacity = '0';
      return;
    }

    const el = this.getTabElement(tabId);
    if (!el) {
      this.ghostPill.style.opacity = '0';
      return;
    }

    const left = el.offsetLeft;
    const width = el.offsetWidth;
    this.ghostPill.style.transform = `translate3d(${left}px, 0, 0)`;
    this.ghostPill.style.width = `${width}px`;
    this.ghostPill.style.opacity = '1';
  }

  clearHover() {
    this.hoverTabId = null;
    if (this.ghostPill) {
      this.ghostPill.style.opacity = '0';
    }
  }

  startAnimation() {
    if (this.isAnimating) return;
    this.isAnimating = true;
    this.lastTime = performance.now();
    this.rafId = requestAnimationFrame(this.renderLoop);
  }

  stopAnimation() {
    this.isAnimating = false;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  renderLoop(currentTime) {
    if (!this.isAnimating) return;

    const dt = Math.min((currentTime - this.lastTime) / 1000, 0.04);
    this.lastTime = currentTime;

    // Determinar la dirección de movimiento para la física diferencial de estiramiento líquido
    const isMovingRight = this.targetLeft > this.leftEdge;

    // El borde frontal tiene mayor rigidez (sale disparado primero)
    // El borde trasero tiene menor rigidez y más amortiguación (se rezaga y genera el estiramiento líquido)
    const kLead = 380;
    const cLead = 28;
    const kTrail = 240;
    const cTrail = 24;

    const kLeft = isMovingRight ? kTrail : kLead;
    const cLeft = isMovingRight ? cTrail : cLead;

    const kRight = isMovingRight ? kLead : kTrail;
    const cRight = isMovingRight ? cLead : cTrail;

    // Resorte para el borde izquierdo
    const forceLeft = -kLeft * (this.leftEdge - this.targetLeft) - cLeft * this.leftVelocity;
    this.leftVelocity += forceLeft * dt;
    this.leftEdge += this.leftVelocity * dt;

    // Resorte para el borde derecho
    const forceRight = -kRight * (this.rightEdge - this.targetRight) - cRight * this.rightVelocity;
    this.rightVelocity += forceRight * dt;
    this.rightEdge += this.rightVelocity * dt;

    // Aplicar al DOM
    this.applyPillGeometry();

    // Condición de reposo
    const leftDiff = Math.abs(this.leftEdge - this.targetLeft);
    const rightDiff = Math.abs(this.rightEdge - this.targetRight);
    const leftVel = Math.abs(this.leftVelocity);
    const rightVel = Math.abs(this.rightVelocity);

    if (leftDiff < 0.25 && rightDiff < 0.25 && leftVel < 0.3 && rightVel < 0.3) {
      this.leftEdge = this.targetLeft;
      this.rightEdge = this.targetRight;
      this.leftVelocity = 0;
      this.rightVelocity = 0;
      this.applyPillGeometry();
      this.stopAnimation();
      return;
    }

    this.rafId = requestAnimationFrame(this.renderLoop);
  }

  applyPillGeometry() {
    if (!this.pill) return;

    const left = this.leftEdge;
    const width = Math.max(16, this.rightEdge - this.leftEdge);

    this.pill.style.transform = `translate3d(${left}px, 0, 0)`;
    this.pill.style.width = `${width}px`;
    this.pill.style.opacity = '1';
  }

  destroy() {
    this.stopAnimation();
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    } else {
      window.removeEventListener('resize', this.handleResize);
    }
    this.container = null;
    this.pill = null;
    this.ghostPill = null;
  }
}

// Instancia singleton
export const settingsMagneticRail = new MagneticLiquidRail();
