/**
 * utils/multilineInputEngine.js
 * Motor Global de Expansión Multilínea (Shift + Enter)
 * 
 * Permite que cualquier campo de texto <input> de la aplicación se transforme
 * automáticamente en un área de texto multilínea (<textarea>) al presionar Shift + Enter,
 * expandiendo su altura dinámicamente y evitando el desplazamiento horizontal de texto largo.
 */

export class MultilineInputEngine {
  constructor() {
    this._onKeyDown = this._onKeyDown.bind(this);
    this._onInput = this._onInput.bind(this);
    this._onFocusIn = this._onFocusIn.bind(this);
    this.initialized = false;
  }

  init() {
    if (this.initialized || typeof document === 'undefined') return;
    this.initialized = true;

    document.addEventListener('keydown', this._onKeyDown, true);
    document.addEventListener('input', this._onInput, true);
    document.addEventListener('focusin', this._onFocusIn, true);

    // Escaneo de inputs con saltos de línea existentes
    this.scanAndExpandMultilineInputs();

    // Observar cambios de vista o mutaciones de pestaña de forma eficiente y debounced
    if (typeof MutationObserver !== 'undefined') {
      let _scanRaf = null;
      const observer = new MutationObserver((mutations) => {
        let hasNewInputs = false;
        for (let i = 0; i < mutations.length; i++) {
          const added = mutations[i].addedNodes;
          if (!added) continue;
          for (let j = 0; j < added.length; j++) {
            const n = added[j];
            if (n.nodeType === 1) {
              if (n.tagName === 'INPUT' || (n.querySelector && n.querySelector('input'))) {
                hasNewInputs = true;
                break;
              }
            }
          }
          if (hasNewInputs) break;
        }
        if (!hasNewInputs) return;

        if (_scanRaf) cancelAnimationFrame(_scanRaf);
        _scanRaf = requestAnimationFrame(() => {
          _scanRaf = null;
          this.scanAndExpandMultilineInputs();
        });
      });
      observer.observe(document.body, { childList: true, subtree: true });
    }
  }

  /**
   * Determina si un input es elegible para expansión multilínea
   */
  isEligibleInput(el) {
    if (!el || el.tagName.toLowerCase() !== 'input') return false;
    const type = (el.type || 'text').toLowerCase();
    if (type !== 'text' && type !== '') return false;

    // Excluir buscadores, selectores de color, campos con pattern estricto, etc.
    if (el.classList.contains('dashboard-search-input') || 
        el.classList.contains('no-multiline') ||
        el.hasAttribute('pattern') ||
        (el.getAttribute('x-model') || '').toLowerCase().includes('search') ||
        (el.getAttribute('placeholder') || '').toLowerCase().includes('buscar')) {
      return false;
    }

    return true;
  }

  /**
   * Auto-ajusta la altura de cualquier textarea que tenga auto-expand sin layout thrashing
   */
  autoResizeTextarea(textarea) {
    if (!textarea || textarea.tagName.toLowerCase() !== 'textarea') return;
    if (!textarea.classList.contains('form-textarea-auto') && !textarea.classList.contains('form-input')) return;

    if (textarea._resizeRafId) cancelAnimationFrame(textarea._resizeRafId);
    textarea._resizeRafId = requestAnimationFrame(() => {
      textarea._resizeRafId = null;
      textarea.style.height = 'auto';
      const scrollH = textarea.scrollHeight;
      const minH = textarea.dataset.minHeight ? parseInt(textarea.dataset.minHeight, 10) : 38;
      textarea.style.height = `${Math.max(minH, scrollH)}px`;
    });
  }

  /**
   * Transforma un <input> en un <textarea> auto-expandible preservando bindings de Alpine
   */
  morphInputToTextarea(input, insertNewline = false) {
    if (!this.isEligibleInput(input)) return null;

    const parent = input.parentNode;
    if (!parent) return null;

    const start = input.selectionStart ?? (input.value ? input.value.length : 0);
    const end = input.selectionEnd ?? (input.value ? input.value.length : 0);
    const oldVal = input.value || '';
    
    let newVal = oldVal;
    let targetCursor = start;

    if (insertNewline) {
      newVal = oldVal.substring(0, start) + '\n' + oldVal.substring(end);
      targetCursor = start + 1;
    }

    const textarea = document.createElement('textarea');

    // Copiar todos los atributos (x-model, @input, placeholder, id, name, data-*, etc.)
    for (let attr of input.attributes) {
      if (attr.name !== 'type' && attr.name !== 'value') {
        textarea.setAttribute(attr.name, attr.value);
      }
    }

    // Clases y estilos de expansión
    textarea.classList.add('form-textarea', 'form-textarea-auto', 'form-textarea-expanded');
    textarea.rows = 2;
    textarea.style.minHeight = '56px';
    textarea.style.resize = 'vertical';
    textarea.style.lineHeight = '1.45';
    textarea.dataset.minHeight = '56px';

    parent.replaceChild(textarea, input);

    // Conectar Alpine.js al nuevo elemento
    if (window.Alpine && window.Alpine.initTree) {
      window.Alpine.initTree(textarea);
    }

    // Asignar valor y disparar reactividad
    textarea.value = newVal;
    textarea.focus();
    try {
      textarea.setSelectionRange(targetCursor, targetCursor);
    } catch (e) {}

    this.autoResizeTextarea(textarea);

    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    textarea.dispatchEvent(new Event('change', { bubbles: true }));

    // Disparar autosave si está disponible
    if (window.Alpine && window.Alpine.store('characters')?.scheduleAutoSave) {
      window.Alpine.store('characters').scheduleAutoSave();
    }

    return textarea;
  }

  _onKeyDown(e) {
    // Detectar Shift + Enter
    if (e.key === 'Enter' && e.shiftKey) {
      const activeEl = document.activeElement;
      if (this.isEligibleInput(activeEl)) {
        e.preventDefault();
        e.stopPropagation();
        this.morphInputToTextarea(activeEl, true);
        return;
      }

      if (activeEl && activeEl.tagName.toLowerCase() === 'textarea') {
        // En textarea, permitir que se inserte la nueva línea y ajustar altura inmediatamente
        setTimeout(() => {
          this.autoResizeTextarea(activeEl);
        }, 0);
      }
    }
  }

  _onInput(e) {
    const target = e.target;
    if (target && target.tagName.toLowerCase() === 'textarea') {
      this.autoResizeTextarea(target);
    }
  }

  hasMultilineContent(val) {
    if (!val || typeof val !== 'string') return false;
    // Si contiene saltos de línea O sintaxis de formato Markdown/HTML que requiera renderizado enriquecido
    return val.includes('\n') || /(\*\*|__|\*|~~|<span|<font)/i.test(val);
  }

  _onFocusIn(e) {
    const target = e.target;
    if (target && this.isEligibleInput(target)) {
      // Si el valor ya tiene saltos de línea o formato enriquecido, convertirlo automáticamente
      if (this.hasMultilineContent(target.value)) {
        this.morphInputToTextarea(target, false);
      }
    }
  }

  scanAndExpandMultilineInputs() {
    if (typeof document === 'undefined') return;
    const inputs = document.querySelectorAll('input.form-input, input[type="text"]');
    inputs.forEach(input => {
      if (this.isEligibleInput(input) && this.hasMultilineContent(input.value)) {
        this.morphInputToTextarea(input, false);
      }
    });
  }
}

export const multilineInputEngine = new MultilineInputEngine();
