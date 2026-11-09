/**
 * utils/bootScreen.js
 * Pantalla de Arranque: Secuencia Retro BIOS o Pantalla de Carga Genérica 3D
 * 
 * - Modo Retro BIOS: Recrea la estética icónica de la BIOS Award Modular v4.51PG
 *   con comprobación de memoria RAM, carga de componentes de sistema y pitido POST.
 * - Modo Carga Genérica 3D: Animación isométrica futurista con cubos 3D generados por CSS.
 * 
 * Previene totalmente el parpadeo de contenido sin estilizar (Anti-FOUC).
 */

// ── Síntesis de Audio de Altavoz de PC (Web Audio API) ─────────────
export function playBiosBeep(type = 'boot') {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    if (type === 'boot') {
      // Clásico pitido POST Award BIOS: 890Hz durante 120ms (Onda cuadrada pura)
      osc.type = 'square';
      osc.frequency.setValueAtTime(890, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.13);
    }
  } catch (_) {
    // Si el navegador bloquea la reproducción hasta interacción del usuario
  }
}

// ── Clase BootScreen ──────────────────────────────────────────────
export class BootScreen {
  constructor() {
    this.biosScreen = null;
    this.genericScreen = null;
    this.isDone = false;
    this.skipHandler = null;
  }

  init() {
    this.isDone = false;
    this.biosScreen = document.getElementById('bios-boot-screen');
    this.genericScreen = document.getElementById('generic-loading-screen');

    // Limpiar listeners previos si los hubiera
    if (this.skipHandler) {
      window.removeEventListener('keydown', this.skipHandler);
      if (this.biosScreen) this.biosScreen.removeEventListener('click', this.skipHandler);
      if (this.genericScreen) this.genericScreen.removeEventListener('click', this.skipHandler);
    }

    // 1. Determinar modo según configuración del usuario
    const saved = this._getSavedSettings();
    const useBios = saved.showSplashScreen !== false && !saved.fastBoot;

    // Actualizar clases de modo en <html> para consistencia
    if (typeof document !== 'undefined' && document.documentElement) {
      if (useBios) {
        document.documentElement.classList.remove('boot-mode-generic');
        document.documentElement.classList.add('boot-mode-bios');
      } else {
        document.documentElement.classList.remove('boot-mode-bios');
        document.documentElement.classList.add('boot-mode-generic');
      }
    }

    // 2. Controlador de salto rápido (Click o teclas Space, Enter, Escape)
    this.skipHandler = (e) => {
      if (e.type === 'keydown') {
        if (!['Space', 'Enter', 'Escape'].includes(e.code) && e.key !== ' ' && e.key !== 'Escape' && e.key !== 'Enter') {
          return;
        }
        e.preventDefault();
      }
      this.dismiss(true);
    };

    window.addEventListener('keydown', this.skipHandler);

    if (useBios) {
      if (this.genericScreen) this.genericScreen.style.display = 'none';
      if (this.biosScreen) {
        this.biosScreen.style.display = 'flex';
        this.biosScreen.style.opacity = '1';
        this.biosScreen.addEventListener('click', this.skipHandler);

        const skipBtn = document.getElementById('bios-skip-btn');
        if (skipBtn) {
          skipBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.dismiss(true);
          });
        }

        this.runBiosSequence(saved);
      }
    } else {
      if (this.biosScreen) this.biosScreen.style.display = 'none';
      if (this.genericScreen) {
        this.genericScreen.style.display = 'flex';
        this.genericScreen.style.opacity = '1';
        this.genericScreen.addEventListener('click', this.skipHandler);

        this.runGenericSequence();
      }
    }
  }

  async runBiosSequence(savedSettings = {}) {
    const memCount = document.getElementById('bios-mem-count');
    const logContainer = document.getElementById('bios-log-lines');
    if (!memCount || !logContainer) {
      this.dismiss();
      return;
    }

    logContainer.innerHTML = '';
    memCount.textContent = '0';

    // Conteo rápido de memoria RAM (0 -> 65536 KB)
    const targets = [0, 8192, 16384, 32768, 49152, 65536];
    for (const val of targets) {
      if (this.isDone) return;
      memCount.textContent = val.toString();
      await this._sleep(35);
    }

    // Líneas secuenciales de inicialización del kernel y subsistemas
    const lines = [
      { text: 'Award Plug and Play BIOS Extension v1.0A', color: '#c0c0c0', delay: 50 },
      { text: 'Copyright (C) 1997-2026, Award Software, Inc.', color: '#888888', delay: 30 },
      { text: '  Detecting IDE Primary Master   ... IndexedDB [Dexie Core MOUNTED]', color: '#5c7aff', delay: 70 },
      { text: '  Detecting IDE Primary Slave    ... LocalStorage [Profile Cache OK]', color: '#5c7aff', delay: 50 },
      { text: '  Detecting IDE Secondary Master ... Audio Engine [Sound Synthesis OK]', color: '#a0aec0', delay: 50 },
      { text: '  Detecting IDE Secondary Slave  ... Cyber-HUD [Tailwind Engine OK]', color: '#a0aec0', delay: 50 },
      { text: ' ', delay: 15 },
      { text: '  Mounting Alpine.js Reactive Kernel ......................... [OK]', color: '#10b981', delay: 60 },
      { text: '  Calibrating Hardware Acceleration y Canvas ................. [OK]', color: '#10b981', delay: 50 },
      { text: '  Loading Character Profiles y Steam Catalog ................. [100%]', color: '#00f0ff', delay: 70 },
      { text: ' ', delay: 15 },
      { text: 'SYSTEM BOOT COMPLETE — LAUNCHING OPERATIVE INTERFACE...', color: '#ffffff', delay: 90, bold: true }
    ];

    for (const item of lines) {
      if (this.isDone) return;
      await this._sleep(item.delay || 40);
      if (this.isDone) return;

      const p = document.createElement('div');
      p.style.color = item.color || '#c0c0c0';
      if (item.bold) {
        p.style.fontWeight = 'bold';
        p.style.textShadow = '0 0 8px rgba(255,255,255,0.6)';
      }
      p.textContent = item.text;
      logContainer.appendChild(p);
    }

    // Pitido POST de Altavoz de PC (si está habilitado)
    if (savedSettings.bootSound !== false && !this.isDone) {
      playBiosBeep('boot');
    }

    // Pausa de apreciación visual antes de dar paso
    await this._sleep(1100);

    if (document.readyState !== 'complete') {
      await new Promise(resolve => window.addEventListener('load', resolve, { once: true }));
    }

    this.dismiss();
  }

  async runGenericSequence() {
    // Animación de carga genérica 3D: apreciar ciclo de rotación y dar paso
    await this._sleep(1400);

    if (document.readyState !== 'complete') {
      await new Promise(resolve => window.addEventListener('load', resolve, { once: true }));
    }

    this.dismiss();
  }

  dismiss(immediate = false) {
    if (this.isDone) return;
    this.isDone = true;

    if (this.skipHandler) {
      window.removeEventListener('keydown', this.skipHandler);
      if (this.biosScreen) this.biosScreen.removeEventListener('click', this.skipHandler);
      if (this.genericScreen) this.genericScreen.removeEventListener('click', this.skipHandler);
    }

    const fadeDuration = immediate ? 180 : 380;
    const transitionStr = `opacity ${fadeDuration}ms ease-out`;

    if (this.biosScreen && this.biosScreen.style.display !== 'none') {
      this.biosScreen.style.transition = transitionStr;
      this.biosScreen.style.opacity = '0';
      setTimeout(() => {
        if (this.biosScreen) this.biosScreen.style.display = 'none';
      }, fadeDuration);
    }

    if (this.genericScreen && this.genericScreen.style.display !== 'none') {
      this.genericScreen.style.transition = transitionStr;
      this.genericScreen.style.opacity = '0';
      setTimeout(() => {
        if (this.genericScreen) this.genericScreen.style.display = 'none';
      }, fadeDuration);
    }
  }

  _getSavedSettings() {
    try {
      return JSON.parse(localStorage.getItem('superficha_global_settings')) || {};
    } catch (_) {
      return {};
    }
  }

  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const bootScreen = new BootScreen();
if (typeof window !== 'undefined') {
  window.bootScreen = bootScreen;
}
