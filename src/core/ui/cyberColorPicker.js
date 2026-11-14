/**
 * utils/cyberColorPicker.js
 * Selector de Color Profesional Cyber HUD para Atributos Corporales
 * (Color de Ojos, Color / Tipo de Cabello, Tono de Piel / Pigmento)
 * 
 * Reemplaza los inputs nativos tipo <input type="color"> por la interfaz
 * profesional 2D con regulador de saturación, brillo, tono espectral,
 * selector de formato HEX/RGB/HSL, paleta de muestras rápidas, botón de copiado
 * y herramienta de cuentagotas (EyeDropper API con fallback nativo).
 */

import {
  hsvToRgb,
  rgbToHsv,
  rgbValuesToHex,
  rgbToHsl,
  hslToRgb,
  hexToHsv
} from '@core/rich-text/textFormatterEngine.js';

export const BODY_COLOR_SWATCHES = [
  { color: '#ffffff', title: 'Blanco Puro / Nieve' },
  { color: '#f7d5b8', title: 'Porcelana / Piel Clara' },
  { color: '#d8a87b', title: 'Trigueña / Cálida' },
  { color: '#8d5524', title: 'Castaño / Bronce' },
  { color: '#3d2314', title: 'Ébano / Café Oscuro' },
  { color: '#111111', title: 'Negro Azabache' },
  { color: '#f59e0b', title: 'Rubio / Ámbar Dorado' },
  { color: '#ef4444', title: 'Pelirrojo / Rubí' },
  { color: '#00f0ff', title: 'Cian Neón' },
  { color: '#38bdf8', title: 'Azul Zafiro / Ojos Claros' },
  { color: '#10b981', title: 'Verde Esmeralda' },
  { color: '#a855f7', title: 'Violeta Místico' }
];

export function registerCyberColorPicker(Alpine) {
  Alpine.data('cyberColorPicker', ({ field, hexField, label, defaultColor = '#3b82f6', placement = 'left', value, onSelect, swatches, liveUpdate = false } = {}) => ({
    isOpen: false,
    field,
    hexField,
    label: label || 'Selector de Color',
    defaultColor,
    placement,
    liveUpdate: Boolean(liveUpdate),
    mode: 'hex', // 'hex' | 'rgb' | 'hsl'
    h: 217,
    s: 75,
    v: 95,
    hexInput: '#3B82F6',
    rgbR: 59,
    rgbG: 130,
    rgbB: 246,
    hslH: 217,
    hslS: 91,
    hslL: 60,
    currentHex: '#3b82f6',
    swatches: swatches || BODY_COLOR_SWATCHES,

    get activeChar() {
      return Alpine.store('characters')?.active;
    },

    get activeHex() {
      if (typeof value === 'function') {
        try {
          const v = value();
          return (v && typeof v === 'string' && v.trim()) ? v.trim() : (this.defaultColor || '#3b82f6');
        } catch (e) {
          return this.defaultColor || '#3b82f6';
        }
      }
      if (typeof value === 'string' && value.trim()) {
        return value.trim();
      }
      const stored = this.activeChar?.body?.[this.hexField];
      return (stored && stored.trim()) ? stored.trim() : (this.defaultColor || '#3b82f6');
    },

    init() {
      this.syncFromStore();
      if (typeof value === 'function') {
        this.$watch(() => {
          try {
            return value();
          } catch (e) {
            return null;
          }
        }, (newVal) => {
          if (!this.isOpen && newVal) {
            this.setFromHex(newVal, true);
          }
        });
      } else if (this.hexField) {
        this.$watch(() => this.activeChar?.body?.[this.hexField], (newVal) => {
          if (!this.isOpen && newVal) {
            this.syncFromStore();
          }
        });
      }
      this.$watch(() => Alpine.store('characters')?.activeId, () => {
        if (!this.isOpen) {
          this.syncFromStore();
        }
      });
    },

    syncFromStore() {
      const val = this.activeHex;
      this.setFromHex(val, true);
    },

    open() {
      this.syncFromStore();
      this.isOpen = true;
      if (!window._activeCyberColorPickers) window._activeCyberColorPickers = new Set();
      window._activeCyberColorPickers.add(this);
      this.$nextTick(() => {
        if (window.lucide?.createIcons) {
          window.lucide.createIcons();
        }
      });
    },

    close() {
      this.isOpen = false;
      if (window._activeCyberColorPickers) {
        window._activeCyberColorPickers.delete(this);
      }
    },

    toggle() {
      if (this.isOpen) {
        this.close();
      } else {
        this.open();
      }
    },

    updateFromHsv(h, s, v, source = 'all') {
      this.h = Math.max(0, Math.min(360, Math.round(h))) % 360;
      this.s = Math.max(0, Math.min(100, Math.round(s)));
      this.v = Math.max(0, Math.min(100, Math.round(v)));

      const rgb = hsvToRgb(this.h, this.s, this.v);
      this.currentHex = rgbValuesToHex(rgb.r, rgb.g, rgb.b).toLowerCase();

      if (source !== 'hex') {
        this.hexInput = this.currentHex.toUpperCase();
      }
      if (source !== 'rgb') {
        this.rgbR = rgb.r;
        this.rgbG = rgb.g;
        this.rgbB = rgb.b;
      }
      if (source !== 'hsl') {
        const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
        this.hslH = hsl.h;
        this.hslS = hsl.s;
        this.hslL = hsl.l;
      }

      if (this.liveUpdate && typeof onSelect === 'function') {
        try {
          onSelect(this.currentHex);
        } catch (_) {}
      }
    },

    setFromHex(hex, updateAll = true) {
      if (!hex || typeof hex !== 'string') return;
      let clean = hex.trim();
      if (!clean.startsWith('#') && /^[0-9a-fA-F]{3,6}$/.test(clean)) clean = '#' + clean;
      if (/^#[0-9a-fA-F]{3}$/.test(clean)) {
        clean = '#' + clean[1] + clean[1] + clean[2] + clean[2] + clean[3] + clean[3];
      }
      if (!/^#[0-9a-fA-F]{6}$/.test(clean)) return;

      const hsv = hexToHsv(clean);
      this.currentHex = clean.toLowerCase();
      this.updateFromHsv(hsv.h, hsv.s, hsv.v, updateAll ? 'all' : 'hex');
    },

    onHexInput(e) {
      const val = e.target.value;
      this.setFromHex(val, false);
    },

    onRgbInput() {
      const r = Math.max(0, Math.min(255, parseInt(this.rgbR, 10) || 0));
      const g = Math.max(0, Math.min(255, parseInt(this.rgbG, 10) || 0));
      const b = Math.max(0, Math.min(255, parseInt(this.rgbB, 10) || 0));
      const hsv = rgbToHsv(r, g, b);
      this.updateFromHsv(hsv.h, hsv.s, hsv.v, 'rgb');
    },

    onHslInput() {
      const h = Math.max(0, Math.min(360, parseInt(this.hslH, 10) || 0));
      const s = Math.max(0, Math.min(100, parseInt(this.hslS, 10) || 0));
      const l = Math.max(0, Math.min(100, parseInt(this.hslL, 10) || 0));
      const rgb = hslToRgb(h, s, l);
      const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
      this.updateFromHsv(hsv.h, hsv.s, hsv.v, 'hsl');
    },

    cycleMode() {
      const modes = ['hex', 'rgb', 'hsl'];
      const nextIdx = (modes.indexOf(this.mode) + 1) % modes.length;
      this.mode = modes[nextIdx];
    },

    async copyColor() {
      try {
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(this.currentHex.toUpperCase());
          Alpine.store('app')?.toast?.(`Color ${this.currentHex.toUpperCase()} copiado al portapapeles.`, 'info');
        }
      } catch (e) {
        Alpine.store('app')?.toast?.(`Código: ${this.currentHex.toUpperCase()}`, 'info');
      }
    },

    async pickWithEyeDropper() {
      if (typeof window !== 'undefined' && 'EyeDropper' in window) {
        try {
          const eyeDropper = new window.EyeDropper();
          const result = await eyeDropper.open();
          if (result && result.sRGBHex) {
            this.setFromHex(result.sRGBHex, true);
            Alpine.store('app')?.toast?.(`Color capturado: ${result.sRGBHex.toUpperCase()}`, 'success');
          }
          return;
        } catch (err) {
          // Si el usuario canceló deliberadamente con Escape
          if (err && (err.name === 'AbortError' || String(err).includes('AbortError'))) {
            return;
          }
        }
      }

      // Si el navegador no soporta EyeDropper (ej. Firefox) o falló, activar la pipeta interactiva HUD en pantalla
      this.startInAppPipette();
    },

    startInAppPipette() {
      if (typeof document === 'undefined') return;
      if (document.getElementById('hud-pipette-loupe')) return;

      const wasOpen = this.isOpen;
      // Cerrar temporalmente el popover para despejar completamente la pantalla y la ficha
      this.close();

      // Inyectar cursor de retícula crosshair global
      const styleEl = document.createElement('style');
      styleEl.id = 'hud-pipette-style';
      styleEl.textContent = '* { cursor: crosshair !important; }';
      document.head.appendChild(styleEl);

      // Crear HUD Loupe flotante de alta precisión
      const loupe = document.createElement('div');
      loupe.id = 'hud-pipette-loupe';
      loupe.setAttribute('data-protect-circle', 'true');
      loupe.setAttribute('data-protect-radius', 'true');
      loupe.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        z-index: 9999999;
        pointer-events: none;
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 5px 10px 5px 6px;
        background: rgba(8, 12, 20, 0.95);
        border: 1px solid rgba(245, 158, 11, 0.6);
        border-radius: 9999px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.85), 0 0 12px rgba(245, 158, 11, 0.3);
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        font-size: 11px;
        font-weight: 700;
        color: #ffffff;
        transform: translate3d(-9999px, -9999px, 0);
        user-select: none;
        backdrop-filter: blur(8px);
      `;

      const swatch = document.createElement('span');
      swatch.setAttribute('data-protect-circle', 'true');
      swatch.setAttribute('data-protect-radius', 'true');
      swatch.style.cssText = 'width: 16px; height: 16px; border-radius: 9999px; border: 2px solid #ffffff; box-shadow: 0 0 0 1px rgba(0,0,0,0.8); display: inline-block; flex-shrink: 0; background-color: ' + this.currentHex + ';';

      const hexLabel = document.createElement('span');
      hexLabel.textContent = this.currentHex.toUpperCase();
      hexLabel.style.letterSpacing = '0.05em';

      const tip = document.createElement('span');
      tip.textContent = 'Clic para capturar • Esc para salir';
      tip.style.cssText = 'font-size: 9px; opacity: 0.6; font-weight: 500; font-family: system-ui, sans-serif; margin-left: 2px;';

      loupe.appendChild(swatch);
      loupe.appendChild(hexLabel);
      loupe.appendChild(tip);
      document.body.appendChild(loupe);

      let currentHoverHex = this.currentHex;

      const sampleColorAt = (clientX, clientY) => {
        const el = document.elementFromPoint(clientX, clientY);
        if (!el || el === loupe || loupe.contains(el)) return currentHoverHex;

        // 1. Imagen (Avatar, Retratos, Banners, Fotografías de referencia)
        if (el.tagName === 'IMG' && el.complete && el.naturalWidth > 0) {
          try {
            const rect = el.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
              const scaleX = el.naturalWidth / rect.width;
              const scaleY = el.naturalHeight / rect.height;
              const imgX = Math.max(0, Math.min(el.naturalWidth - 1, Math.floor((clientX - rect.left) * scaleX)));
              const imgY = Math.max(0, Math.min(el.naturalHeight - 1, Math.floor((clientY - rect.top) * scaleY)));

              const canvas = document.createElement('canvas');
              canvas.width = 1;
              canvas.height = 1;
              const ctx = canvas.getContext('2d', { willReadFrequently: true });
              if (ctx) {
                ctx.drawImage(el, imgX, imgY, 1, 1, 0, 0, 1, 1);
                const pixel = ctx.getImageData(0, 0, 1, 1).data;
                if (pixel[3] > 0) {
                  return rgbValuesToHex(pixel[0], pixel[1], pixel[2]);
                }
              }
            }
          } catch (_) {
            // Continuar a inspección por estilos en caso de restricción externa
          }
        }

        // 2. Canvas
        if (el.tagName === 'CANVAS') {
          try {
            const rect = el.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
              const scaleX = el.width / rect.width;
              const scaleY = el.height / rect.height;
              const cx = Math.max(0, Math.min(el.width - 1, Math.floor((clientX - rect.left) * scaleX)));
              const cy = Math.max(0, Math.min(el.height - 1, Math.floor((clientY - rect.top) * scaleY)));
              const ctx = el.getContext('2d', { willReadFrequently: true });
              if (ctx) {
                const pixel = ctx.getImageData(cx, cy, 1, 1).data;
                if (pixel[3] > 0) {
                  return rgbValuesToHex(pixel[0], pixel[1], pixel[2]);
                }
              }
            }
          } catch (_) {}
        }

        // 3. Estilos de fondo y texto en la jerarquía DOM
        let curr = el;
        while (curr && curr !== document.body && curr !== document.documentElement) {
          const style = window.getComputedStyle(curr);
          const bg = style.backgroundColor;
          if (bg && bg !== 'transparent' && bg !== 'rgba(0, 0, 0, 0)') {
            const match = bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
            if (match) {
              const alpha = match[4] !== undefined ? parseFloat(match[4]) : 1;
              if (alpha > 0.05) {
                return rgbValuesToHex(parseInt(match[1], 10), parseInt(match[2], 10), parseInt(match[3], 10));
              }
            }
          }
          if (curr.children.length === 0 && curr.textContent?.trim()) {
            const fg = style.color;
            const matchFg = fg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
            if (matchFg) {
              return rgbValuesToHex(parseInt(matchFg[1], 10), parseInt(matchFg[2], 10), parseInt(matchFg[3], 10));
            }
          }
          curr = curr.parentElement;
        }

        return currentHoverHex;
      };

      const onPointerMove = (e) => {
        const hex = sampleColorAt(e.clientX, e.clientY);
        if (hex) {
          currentHoverHex = hex;
          swatch.style.backgroundColor = hex;
          hexLabel.textContent = hex.toUpperCase();
        }

        let posX = e.clientX + 16;
        let posY = e.clientY + 16;
        if (posX + 240 > window.innerWidth) posX = e.clientX - 240;
        if (posY + 40 > window.innerHeight) posY = e.clientY - 40;

        loupe.style.transform = `translate3d(${posX}px, ${posY}px, 0)`;
      };

      const cleanup = () => {
        window.removeEventListener('pointermove', onPointerMove, true);
        window.removeEventListener('click', onClick, true);
        window.removeEventListener('keydown', onKeyDown, true);
        window.removeEventListener('contextmenu', onContextMenu, true);
        if (styleEl && styleEl.parentNode) styleEl.parentNode.removeChild(styleEl);
        if (loupe && loupe.parentNode) loupe.parentNode.removeChild(loupe);
      };

      const onClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        cleanup();
        const hex = sampleColorAt(e.clientX, e.clientY) || currentHoverHex;
        this.setFromHex(hex, true);
        if (wasOpen) {
          this.open();
        }
        Alpine.store('app')?.toast?.(`Color capturado: ${hex.toUpperCase()}`, 'success');
      };

      const onKeyDown = (e) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          cleanup();
          if (wasOpen) {
            this.open();
          }
          Alpine.store('app')?.toast?.('Modo Pipeta cancelado.', 'info');
        }
      };

      const onContextMenu = (e) => {
        e.preventDefault();
        cleanup();
        if (wasOpen) {
          this.open();
        }
      };

      window.addEventListener('pointermove', onPointerMove, true);
      window.addEventListener('click', onClick, true);
      window.addEventListener('keydown', onKeyDown, true);
      window.addEventListener('contextmenu', onContextMenu, true);

      Alpine.store('app')?.toast?.('Modo Pipeta activo: Haz clic sobre cualquier elemento o imagen para capturar su color (Esc para cancelar).', 'info');
    },

    applyColor() {
      if (typeof onSelect === 'function') {
        try {
          onSelect(this.currentHex);
        } catch (e) {
          console.warn('cyberColorPicker onSelect error:', e);
        }
        this.close();
        return;
      }
      const charStore = Alpine.store('characters');
      if (charStore?.active?.body && this.hexField) {
        charStore.active.body[this.hexField] = this.currentHex;
        if (this.field) charStore.fetchColorName(this.field, this.currentHex);
        charStore.scheduleAutoSave();
        Alpine.store('app')?.toast?.(`${this.label} actualizado a ${this.currentHex.toUpperCase()}`, 'success');
      }
      this.close();
    },

    resetColor() {
      if (typeof onSelect === 'function') {
        try {
          onSelect(this.defaultColor || '#eab308');
        } catch (e) {
          console.warn('cyberColorPicker resetColor error:', e);
        }
        this.syncFromStore();
        this.close();
        return;
      }
      const charStore = Alpine.store('characters');
      if (charStore?.active?.body && this.hexField) {
        charStore.active.body[this.hexField] = '';
        if (this.field) charStore.active.body[this.field] = '';
        charStore.scheduleAutoSave();
        Alpine.store('app')?.toast?.(`${this.label} restablecido.`, 'info');
      }
      this.syncFromStore();
      this.close();
    },

    // ── Drag SV Box (Saturación y Brillo) ────────────────────
    handleSvPointerDown(e) {
      e.preventDefault();
      const target = e.currentTarget;
      try { target.setPointerCapture(e.pointerId); } catch (_) {}

      const update = (ev) => {
        const rect = target.getBoundingClientRect();
        const clientX = Math.max(rect.left, Math.min(rect.right, ev.clientX));
        const clientY = Math.max(rect.top, Math.min(rect.bottom, ev.clientY));
        const s = Math.round(((clientX - rect.left) / rect.width) * 100);
        const v = Math.round((1 - ((clientY - rect.top) / rect.height)) * 100);
        this.updateFromHsv(this.h, s, v, 'sv');
      };

      update(e);

      const onMove = (moveEv) => update(moveEv);
      const onUp = (upEv) => {
        try { target.releasePointerCapture(upEv.pointerId); } catch (_) {}
        target.removeEventListener('pointermove', onMove);
        target.removeEventListener('pointerup', onUp);
        target.removeEventListener('pointercancel', onUp);
      };

      target.addEventListener('pointermove', onMove);
      target.addEventListener('pointerup', onUp);
      target.addEventListener('pointercancel', onUp);
    },

    // ── Drag Hue Slider (Tono Espectral) ────────────────────
    handleHuePointerDown(e) {
      e.preventDefault();
      const target = e.currentTarget;
      try { target.setPointerCapture(e.pointerId); } catch (_) {}

      const update = (ev) => {
        const rect = target.getBoundingClientRect();
        const clientX = Math.max(rect.left, Math.min(rect.right, ev.clientX));
        const h = Math.round(((clientX - rect.left) / rect.width) * 360) % 360;
        this.updateFromHsv(h, this.s, this.v, 'hue');
      };

      update(e);

      const onMove = (moveEv) => update(moveEv);
      const onUp = (upEv) => {
        try { target.releasePointerCapture(upEv.pointerId); } catch (_) {}
        target.removeEventListener('pointermove', onMove);
        target.removeEventListener('pointerup', onUp);
        target.removeEventListener('pointercancel', onUp);
      };

      target.addEventListener('pointermove', onMove);
      target.addEventListener('pointerup', onUp);
      target.addEventListener('pointercancel', onUp);
    }
  }));
}
