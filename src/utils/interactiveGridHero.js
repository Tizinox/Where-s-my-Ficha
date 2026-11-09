/**
 * utils/interactiveGridHero.js
 * 
 * Recreación de alta fidelidad y ultra-rendimiento del componente:
 * "Interactive Grid Hero" (Skecher UI / CoDesign-Spa27)
 * 
 * Basado en las matemáticas exactas del componente original:
 * - Campo de celdas cuadradas que se suavizan y redondean (morphing / corner radius)
 * - Inset dinámico que abre las separaciones alrededor del puntero
 * - Resplandor radial subyacente que brilla a través de las aperturas
 * - Física Spring (stiffness: 520, damping: 38, mass: 1)
 * - Renderizado acelerado por hardware en Canvas 2D a 60/120 FPS
 * - Consumo 0% CPU en reposo (auto-sleep del bucle rAF)
 * - Reactivo a la paleta cromática global de $store.settings
 */

export class InteractiveGridHeroEngine {
  constructor(options = {}) {
    this.targetCellSize = options.cellSize ?? 72;
    this.gap = options.gap ?? 4;
    this.proximity = options.proximity ?? 4.35;
    this.effects = {
      restingOpacity: options.effects?.restingOpacity ?? 0.68,
      activeOpacity: options.effects?.activeOpacity ?? 1.0,
      cornerRadius: options.effects?.cornerRadius ?? 20,
      insetPercent: options.effects?.insetPercent ?? 5.5, // 5.5% del tamaño de celda
    };
    this.spring = {
      stiffness: options.spring?.stiffness ?? 520,
      damping: options.spring?.damping ?? 38,
      mass: options.spring?.mass ?? 1,
    };

    this.container = null;
    this.canvas = null;
    this.ctx = null;
    this.rafId = null;
    this.isRunning = false;
    this.isSleeping = false;
    this.lastTime = 0;

    // Métricas del grid
    this.metrics = {
      cellSize: 72,
      columns: 12,
      rows: 10,
      width: 0,
      height: 0,
      dpr: 1,
    };

    // Estado del puntero
    this.pointerX = -9999;
    this.pointerY = -9999;
    this.targetPointerX = -9999;
    this.targetPointerY = -9999;
    this.currentActive = 0;
    this.targetActive = 0;
    this.activeVelocity = 0;
    this.isPointerInside = false;

    // Detectar preferencia de reducción de movimiento
    this.reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;

    // Bindings
    this.handlePointerMove = this.handlePointerMove.bind(this);
    this.handlePointerLeave = this.handlePointerLeave.bind(this);
    this.handleResize = this.handleResize.bind(this);
    this.renderFrame = this.renderFrame.bind(this);
  }

  init(containerId = 'settings-interactive-grid-container', canvasId = 'settings-interactive-grid-canvas') {
    this.container = document.getElementById(containerId);
    this.canvas = document.getElementById(canvasId);

    if (!this.canvas) {
      return false;
    }

    this.ctx = this.canvas.getContext('2d', { alpha: true });
    if (!this.ctx) return false;

    // Asegurar compatibilidad para roundRect si el navegador no lo soporta de forma nativa
    if (!this.ctx.roundRect) {
      this.ctx.roundRect = function (x, y, w, h, r) {
        if (typeof r === 'undefined') r = 0;
        if (typeof r === 'number') {
          r = { tl: r, tr: r, br: r, bl: r };
        } else {
          const defaultRadius = { tl: 0, tr: 0, br: 0, bl: 0 };
          for (const side in defaultRadius) {
            r[side] = r[side] || defaultRadius[side];
          }
        }
        this.beginPath();
        this.moveTo(x + r.tl, y);
        this.lineTo(x + w - r.tr, y);
        this.quadraticCurveTo(x + w, y, x + w, y + r.tr);
        this.lineTo(x + w, y + h - r.br);
        this.quadraticCurveTo(x + w, y + h, x + w - r.br, y + h);
        this.lineTo(x + r.bl, y + h);
        this.quadraticCurveTo(x, y + h, x, y + h - r.bl);
        this.lineTo(x, y + r.tl);
        this.quadraticCurveTo(x, y, x + r.tl, y);
        this.closePath();
        return this;
      };
    }

    this.updateMetrics();
    window.addEventListener('resize', this.handleResize, { passive: true });

    // Iniciar con un frame de renderizado estático en reposo
    this.draw();
    return true;
  }

  updateMetrics() {
    if (!this.canvas) return;

    // El canvas ocupa todo el viewport
    const width = window.innerWidth;
    const height = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    this.canvas.width = Math.round(width * dpr);
    this.canvas.height = Math.round(height * dpr);
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;

    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.scale(dpr, dpr);

    // Matemáticas originales de Skecher UI
    const safeWidth = Math.max(1, width);
    const safeHeight = Math.max(1, height);
    const columns = Math.max(1, Math.ceil((safeWidth + this.gap) / (this.targetCellSize + this.gap)));
    const cellSize = Math.max(1, (safeWidth - this.gap * (columns - 1)) / columns);
    const rows = Math.max(1, Math.ceil((safeHeight + this.gap) / (cellSize + this.gap)));

    this.metrics = {
      cellSize,
      columns,
      rows,
      width,
      height,
      dpr,
    };
  }

  handleResize() {
    this.updateMetrics();
    if (!this.isRunning) {
      this.draw();
    }
  }

  handlePointerMove(event) {
    if (!event) return;
    
    // Coordenadas relativas al viewport fijo
    this.targetPointerX = event.clientX;
    this.targetPointerY = event.clientY;
    this.targetActive = 1;
    this.isPointerInside = true;

    if (this.pointerX < -1000) {
      this.pointerX = this.targetPointerX;
      this.pointerY = this.targetPointerY;
    }

    this.wakeUp();
  }

  handlePointerLeave() {
    this.targetActive = 0;
    this.isPointerInside = false;
    this.wakeUp();
  }

  wakeUp() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.isSleeping = false;
    this.lastTime = performance.now();
    this.rafId = requestAnimationFrame(this.renderFrame);
  }

  sleep() {
    this.isRunning = false;
    this.isSleeping = true;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  renderFrame(currentTime) {
    if (!this.isRunning) return;

    const dt = Math.min((currentTime - this.lastTime) / 1000, 0.05); // clamp para estabilidad
    this.lastTime = currentTime;

    // Física de resorte (Spring) para targetActive
    if (this.reducedMotion) {
      this.currentActive = this.targetActive;
      this.activeVelocity = 0;
      this.pointerX = this.targetPointerX;
      this.pointerY = this.targetPointerY;
    } else {
      const force = -this.spring.stiffness * (this.currentActive - this.targetActive) - this.spring.damping * this.activeVelocity;
      const accel = force / this.spring.mass;
      this.activeVelocity += accel * dt;
      this.currentActive += this.activeVelocity * dt;

      // Suavizado cinemático del puntero (trail fluido)
      const followSpeed = 0.28;
      this.pointerX += (this.targetPointerX - this.pointerX) * followSpeed;
      this.pointerY += (this.targetPointerY - this.pointerY) * followSpeed;
    }

    // Dibujar frame
    this.draw();

    // Condición de reposo (sleep) para ahorrar 100% de CPU cuando no hay movimiento
    const isSettled =
      Math.abs(this.currentActive - this.targetActive) < 0.0005 &&
      Math.abs(this.activeVelocity) < 0.0005 &&
      Math.abs(this.pointerX - this.targetPointerX) < 0.5 &&
      Math.abs(this.pointerY - this.targetPointerY) < 0.5;

    if (isSettled) {
      this.currentActive = this.targetActive;
      this.activeVelocity = 0;
      this.draw(); // Asegurar render final nítido
      this.sleep();
      return;
    }

    this.rafId = requestAnimationFrame(this.renderFrame);
  }

  draw() {
    if (!this.ctx || !this.canvas) return;

    const { cellSize, columns, rows, width, height } = this.metrics;
    const ctx = this.ctx;
    const gap = this.gap;
    const responseRadius = cellSize * Math.max(1, this.proximity);

    // Obtener paleta activa de Alpine store 'settings'
    const settings = window.Alpine?.store('settings');
    const rgbChannels = settings?.rgbChannels || '16, 185, 129';
    const surfaceColor = settings?.surfaceColor || '#0a0c0e';

    // Limpiar canvas
    ctx.clearRect(0, 0, width, height);

    // 1. Capa Base Subyacente (Accent Glow cuando el cursor está activo)
    if (this.currentActive > 0.01 && this.pointerX > -500) {
      const glowRadius = responseRadius * 1.15;
      const glow = ctx.createRadialGradient(
        this.pointerX,
        this.pointerY,
        0,
        this.pointerX,
        this.pointerY,
        glowRadius
      );
      glow.addColorStop(0, `rgba(${rgbChannels}, ${0.32 * this.currentActive})`);
      glow.addColorStop(0.35, `rgba(${rgbChannels}, ${0.12 * this.currentActive})`);
      glow.addColorStop(0.7, `rgba(${rgbChannels}, ${0.03 * this.currentActive})`);
      glow.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, width, height);
    }

    // 2. Renderizado de las celdas (Grid interactivo de Skecher UI)
    const baseInsetPercent = this.effects.insetPercent / 100;
    const baseCornerRadius = this.effects.cornerRadius;
    const restingOpacity = this.effects.restingOpacity;
    const activeOpacity = this.effects.activeOpacity;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < columns; c++) {
        const cellLeft = c * (cellSize + gap);
        const cellTop = r * (cellSize + gap);
        const centerX = cellLeft + cellSize * 0.5;
        const centerY = cellTop + cellSize * 0.5;

        // Cálculo de influencia con smoothstep
        let influence = 0;
        if (this.currentActive > 0.005 && this.pointerX > -500) {
          const dist = Math.hypot(this.pointerX - centerX, this.pointerY - centerY);
          if (dist < responseRadius) {
            const prox = Math.max(0, 1 - dist / responseRadius);
            // smoothstep(prox) * currentActive
            influence = prox * prox * (3 - 2 * prox) * this.currentActive;
          }
        }

        // Efectos dinámicos en base a la influencia
        const inset = cellSize * baseInsetPercent * influence;
        const cornerRad = Math.max(2, 3 + influence * (baseCornerRadius - 3));
        const opacity = restingOpacity + influence * (activeOpacity - restingOpacity);

        const x = cellLeft + inset;
        const y = cellTop + inset;
        const w = Math.max(1, cellSize - inset * 2);
        const h = Math.max(1, cellSize - inset * 2);

        // Geometría con esquinas redondeadas
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, Math.min(cornerRad, w / 2));

        // Relleno de la celda (adaptado dinámicamente al tono superficial de la app)
        if (influence > 0.05) {
          // Celda activa: Más luminosa y con matiz táctico
          ctx.fillStyle = `rgba(18, 24, 34, ${Math.min(1, opacity * 0.95)})`;
        } else {
          // Celda en reposo: Fondo oscuro elegante con opacidad de descanso
          ctx.fillStyle = `rgba(11, 15, 20, ${opacity * 0.85})`;
        }
        ctx.fill();

        // Borde de la celda:
        // En reposo: borde sutil elegante
        // Cerca del puntero: se ilumina suavemente con el color de acento del tema
        if (influence > 0.02) {
          ctx.strokeStyle = `rgba(${rgbChannels}, ${0.15 + influence * 0.55})`;
          ctx.lineWidth = 1 + influence * 0.5;
        } else {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
          ctx.lineWidth = 1;
        }
        ctx.stroke();
      }
    }
  }

  destroy() {
    this.sleep();
    window.removeEventListener('resize', this.handleResize);
    this.canvas = null;
    this.container = null;
    this.ctx = null;
  }
}

// Instancia singleton para uso global
export const settingsInteractiveGrid = new InteractiveGridHeroEngine();
