/**
 * utils/emojiAutocompleteEngine.js
 * Motor Global de Autocompletado y Previsualización de Emojis al estilo de Discord.
 * 
 * Detecta cuando el usuario escribe :codigo en cualquier editor enriquecido,
 * textarea o input de la aplicación, despliega un menú flotante con previsualización
 * en vivo (Hero Preview), permite navegar con flechas y colocar con Enter/Tab o click.
 */

class EmojiAutocompleteEngine {
  constructor() {
    this.popupEl = null;
    this.isVisible = false;
    this.activeTarget = null; // HTMLElement (rich-text-editor, textarea, input)
    this.matches = [];
    this.selectedIndex = 0;
    this.currentQuery = '';
    this.currentMatchRange = null; // Para contenteditable
    this.currentMatchIndices = null; // Para textarea/input { start, end }

    this._onInput = this._onInput.bind(this);
    this._onKeyDown = this._onKeyDown.bind(this);
    this._onDocumentClick = this._onDocumentClick.bind(this);
    this._onSelectionChange = this._onSelectionChange.bind(this);
    this.initialized = false;
  }

  init() {
    if (this.initialized || typeof document === 'undefined') return;
    this.initialized = true;

    this._createPopupElement();

    document.addEventListener('input', this._onInput, true);
    document.addEventListener('keydown', this._onKeyDown, true);
    document.addEventListener('click', this._onDocumentClick, true);
    document.addEventListener('selectionchange', this._onSelectionChange, true);
  }

  _createPopupElement() {
    if (this.popupEl) return;

    const popup = document.createElement('div');
    popup.id = 'tactical-emoji-autocomplete-popup';
    popup.className = 'fixed z-[99999999] w-72 bg-[#0a0e17]/95 border border-accent-gold/40 rounded-xl shadow-[0_12px_40px_rgba(0,0,0,0.9),0_0_20px_rgba(212,175,55,0.25)] backdrop-blur-xl p-2 select-none pointer-events-none opacity-0 scale-95 transition-[opacity,transform] duration-100 text-parchment-cream font-sans';
    popup.style.top = '-9999px';
    popup.style.left = '-9999px';
    popup.style.visibility = 'hidden';

    popup.innerHTML = `
      <!-- Cabecera / Hero Preview estilo Discord -->
      <div id="ea-hero-preview" class="p-2.5 rounded-lg bg-black/40 border border-white/10 flex items-center gap-3 mb-2 shadow-inner">
        <div class="w-11 h-11 rounded-lg bg-white/5 border border-white/15 flex items-center justify-center p-1 shrink-0 overflow-hidden relative">
          <img id="ea-hero-img" src="" alt="emoji" class="w-full h-full object-contain filter drop-shadow-md" />
          <span id="ea-hero-gif-badge" class="absolute bottom-0.5 right-0.5 px-1 py-0.2 bg-accent-gold text-black font-mono font-black text-[7px] rounded uppercase hidden">GIF</span>
        </div>
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-1.5">
            <span id="ea-hero-code" class="font-mono text-xs font-bold text-accent-gold truncate"></span>
          </div>
          <p id="ea-hero-name" class="text-[11px] text-parchment-cream/70 truncate"></p>
          <span id="ea-hero-cat" class="text-[9px] font-mono text-accent-cyan uppercase tracking-wider block mt-0.5"></span>
        </div>
      </div>

      <!-- Lista de resultados coincidentes -->
      <div class="text-[10px] font-mono uppercase tracking-wider text-parchment-cream/50 px-1 mb-1 flex items-center justify-between">
        <span>Coincidencias</span>
        <span id="ea-count-badge" class="text-accent-gold font-bold"></span>
      </div>
      <div id="ea-results-list" class="max-h-44 overflow-y-auto space-y-1 pr-0.5 custom-scrollbar"></div>

      <!-- Pie con atajos tácticos -->
      <div class="mt-2 pt-1.5 border-t border-white/10 flex items-center justify-between text-[10px] font-mono text-parchment-cream/60 px-1">
        <span><kbd class="px-1 py-0.5 rounded bg-white/10 text-white font-bold">↑↓</kbd> Navegar</span>
        <span><kbd class="px-1 py-0.5 rounded bg-accent-gold/20 text-accent-gold font-bold">↵ Tab</kbd> Colocar</span>
        <span><kbd class="px-1 py-0.5 rounded bg-white/10 text-white font-bold">Esc</kbd></span>
      </div>
    `;

    document.body.appendChild(popup);
    this.popupEl = popup;
  }

  _onInput(e) {
    const target = e.target;
    // Ignorar eventos sintéticos o procedentes de textareas acompañantes ocultos
    if (!target || target.dataset?.hasRichCompanion === 'true' || target.style?.display === 'none' || target.getAttribute?.('aria-hidden') === 'true') {
      return;
    }

    if (!this._isValidTarget(target)) {
      if (this.isVisible && target === this.activeTarget) {
        this.hide();
      }
      return;
    }

    // Si ya hay un autocompletado activo en un editor y llega input de otro elemento ajeno, no interferir
    if (this.isVisible && this.activeTarget && target !== this.activeTarget) {
      return;
    }

    this._checkTrigger(target);
  }

  _onSelectionChange() {
    if (!this.isVisible || !this.activeTarget) return;
    const active = document.activeElement;
    // Si el usuario enfocó otro control o hizo click fuera del editor activo, ocultar
    if (!active || (active !== this.activeTarget && !this.activeTarget.contains(active))) {
      this.hide();
      return;
    }
    this._checkTrigger(this.activeTarget);
  }

  _isValidTarget(el) {
    if (!el) return false;
    if (el.closest?.('#emoji-picker-modal') || el.closest?.('#tactical-emoji-autocomplete-popup')) {
      return false;
    }
    // Ignorar textareas nativos que están ocultos por haberse enriquecido
    if (el.dataset?.hasRichCompanion === 'true' || el.style?.display === 'none' || el.getAttribute?.('aria-hidden') === 'true') {
      return false;
    }
    return (
      el.classList?.contains('rich-text-editor') ||
      el.tagName === 'TEXTAREA' ||
      (el.tagName === 'INPUT' && ['text', 'search'].includes(el.type))
    );
  }

  _checkTrigger(target) {
    const customEmojisStore = window.Alpine?.store('customEmojis');
    if (!customEmojisStore || !Array.isArray(customEmojisStore.list) || customEmojisStore.list.length === 0) {
      if (this.isVisible) this.hide();
      return;
    }

    // Caso 1: Editor enriquecido (contenteditable)
    if (target.classList?.contains('rich-text-editor')) {
      const sel = window.getSelection();
      if (!sel || !sel.rangeCount || !sel.isCollapsed) {
        if (this.isVisible) this.hide();
        return;
      }

      let node = sel.anchorNode;
      let offset = sel.anchorOffset;

      if (!node) {
        if (this.isVisible) this.hide();
        return;
      }

      // Si el navegador reporta un ELEMENT_NODE como anchorNode (común en Chrome), resolver el nodo de texto hijo
      if (node.nodeType === Node.ELEMENT_NODE) {
        const child = (offset > 0 ? node.childNodes[offset - 1] : node.childNodes[0]);
        if (child && child.nodeType === Node.TEXT_NODE) {
          node = child;
          offset = node.textContent.length;
        } else if (node.childNodes[offset] && node.childNodes[offset].nodeType === Node.TEXT_NODE) {
          node = node.childNodes[offset];
          offset = 0;
        } else {
          if (this.isVisible) this.hide();
          return;
        }
      }

      if (node.nodeType !== Node.TEXT_NODE) {
        if (this.isVisible) this.hide();
        return;
      }

      const text = node.textContent || '';
      const textBefore = text.substring(0, offset);

      // Buscar si el texto antes del cursor termina con :codigo (sin espacios ni dos puntos de cierre)
      const match = textBefore.match(/(?:^|[\s\u200B]):([a-zA-Z0-9_\-]{1,24})$/);
      if (!match) {
        if (this.isVisible) this.hide();
        return;
      }

      const query = match[1].toLowerCase();
      this.currentQuery = query;
      this.activeTarget = target;
      this.currentMatchRange = {
        node,
        startOffset: offset - match[1].length - 1, // incluye el ':'
        endOffset: offset
      };
      this.currentMatchIndices = null;

      this._searchAndShow(query);
      return;
    }

    // Caso 2: Textarea o Input estándar
    if (target.tagName === 'TEXTAREA' || target.tagName === 'INPUT') {
      const start = target.selectionStart;
      const end = target.selectionEnd;
      if (typeof start !== 'number' || start !== end) {
        if (this.isVisible) this.hide();
        return;
      }

      const val = target.value || '';
      const textBefore = val.substring(0, start);

      const match = textBefore.match(/(?:^|[\s\u200B]):([a-zA-Z0-9_\-]{1,24})$/);
      if (!match) {
        if (this.isVisible) this.hide();
        return;
      }

      const query = match[1].toLowerCase();
      this.currentQuery = query;
      this.activeTarget = target;
      this.currentMatchIndices = {
        start: start - match[1].length - 1,
        end: start
      };
      this.currentMatchRange = null;

      this._searchAndShow(query);
    }
  }

  _searchAndShow(query) {
    const list = window.Alpine?.store('customEmojis')?.list || [];
    const q = query.trim().toLowerCase();

    // Buscar coincidencias
    const matches = list.filter(e => {
      if (!e || !e.shortcode) return false;
      const code = e.shortcode.toLowerCase();
      const name = (e.name || '').toLowerCase();
      return code.startsWith(q) || code.includes(q) || name.includes(q);
    }).slice(0, 5); // Máximo 5 mejores coincidencias

    if (matches.length === 0) {
      this.hide();
      return;
    }

    this.matches = matches;
    if (this.selectedIndex >= matches.length) {
      this.selectedIndex = 0;
    }

    this._renderPopup();
    this.show();
    this._positionPopup();

    // Ajustar con la altura exacta tras calcular dimensiones en el render
    requestAnimationFrame(() => {
      if (this.isVisible) {
        this._positionPopup();
      }
    });
  }

  _renderPopup() {
    if (!this.popupEl) return;

    const resultsContainer = this.popupEl.querySelector('#ea-results-list');
    const countBadge = this.popupEl.querySelector('#ea-count-badge');
    if (!resultsContainer) return;

    countBadge.textContent = `${this.matches.length} sugerencia${this.matches.length === 1 ? '' : 's'}`;

    // Renderizar Hero Preview para el emoji actualmente seleccionado
    this._updateHeroPreview(this.matches[this.selectedIndex] || this.matches[0]);

    // Renderizar lista
    resultsContainer.innerHTML = '';
    this.matches.forEach((emoji, idx) => {
      const isSelected = idx === this.selectedIndex;
      const isGif = window.Alpine?.store('customEmojis')?.isGif?.(emoji) || false;

      const item = document.createElement('div');
      item.className = `px-2 py-1.5 rounded-lg flex items-center justify-between gap-2 cursor-pointer transition-colors ${
        isSelected
          ? 'bg-accent-gold/20 border border-accent-gold/40 text-white shadow-sm'
          : 'hover:bg-white/5 border border-transparent text-parchment-cream/80'
      }`;

      item.innerHTML = `
        <div class="flex items-center gap-2 min-w-0">
          <img src="${emoji.url}" alt="${emoji.shortcode}" class="w-5 h-5 object-contain shrink-0 filter drop-shadow-sm" loading="lazy" />
          <span class="font-mono text-xs font-semibold ${isSelected ? 'text-accent-gold' : 'text-white'} truncate">:${emoji.shortcode}:</span>
        </div>
        <div class="flex items-center gap-1.5 shrink-0">
          ${isGif ? '<span class="px-1 py-0.2 bg-accent-gold/30 text-accent-gold font-mono text-[8px] font-bold rounded">GIF</span>' : ''}
          <span class="text-[9px] font-mono text-parchment-cream/40 uppercase">${emoji.category || 'General'}</span>
        </div>
      `;

      item.addEventListener('mouseenter', () => {
        this.selectedIndex = idx;
        this._renderPopupSelectionOnly();
      });

      item.addEventListener('mousedown', (e) => {
        e.preventDefault(); // Evitar perder el foco
        this._insertEmoji(emoji);
      });

      resultsContainer.appendChild(item);
    });
  }

  _renderPopupSelectionOnly() {
    if (!this.popupEl) return;
    const items = this.popupEl.querySelectorAll('#ea-results-list > div');
    items.forEach((item, idx) => {
      const isSelected = idx === this.selectedIndex;
      if (isSelected) {
        item.className = 'px-2 py-1.5 rounded-lg flex items-center justify-between gap-2 cursor-pointer transition-colors bg-accent-gold/20 border border-accent-gold/40 text-white shadow-sm';
      } else {
        item.className = 'px-2 py-1.5 rounded-lg flex items-center justify-between gap-2 cursor-pointer transition-colors hover:bg-white/5 border border-transparent text-parchment-cream/80';
      }
    });
    this._updateHeroPreview(this.matches[this.selectedIndex]);
  }

  _updateHeroPreview(emoji) {
    if (!emoji || !this.popupEl) return;
    const heroImg = this.popupEl.querySelector('#ea-hero-img');
    const heroCode = this.popupEl.querySelector('#ea-hero-code');
    const heroName = this.popupEl.querySelector('#ea-hero-name');
    const heroCat = this.popupEl.querySelector('#ea-hero-cat');
    const heroGifBadge = this.popupEl.querySelector('#ea-hero-gif-badge');

    if (heroImg) heroImg.src = emoji.url;
    if (heroCode) heroCode.textContent = `:${emoji.shortcode}:`;
    if (heroName) heroName.textContent = emoji.name || emoji.shortcode;
    if (heroCat) heroCat.textContent = emoji.category || 'General';

    const isGif = window.Alpine?.store('customEmojis')?.isGif?.(emoji) || false;
    if (heroGifBadge) {
      heroGifBadge.style.display = isGif ? 'block' : 'none';
    }
  }

  _positionPopup() {
    if (!this.popupEl || !this.activeTarget) return;

    let coords = null;

    if (this.activeTarget.classList?.contains('rich-text-editor')) {
      const sel = window.getSelection();
      if (sel && sel.rangeCount) {
        const range = sel.getRangeAt(0).cloneRange();
        // Obtener el rectángulo exacto del carácter previo si el rango está colapsado
        if (range.collapsed && range.startOffset > 0 && range.startContainer.nodeType === Node.TEXT_NODE) {
          try {
            const charRange = document.createRange();
            charRange.setStart(range.startContainer, range.startOffset - 1);
            charRange.setEnd(range.startContainer, range.startOffset);
            const charRects = charRange.getClientRects();
            if (charRects && charRects.length > 0) {
              const r = charRects[charRects.length - 1];
              coords = {
                left: r.right,
                right: r.right,
                top: r.top,
                bottom: r.bottom,
                width: 0,
                height: r.height
              };
            }
          } catch (_) {}
        }
        if (!coords) {
          const rects = range.getClientRects();
          if (rects && rects.length > 0) {
            coords = rects[rects.length - 1];
          } else {
            coords = range.getBoundingClientRect();
          }
        }
      }
    } else {
      coords = this.activeTarget.getBoundingClientRect();
    }

    if (!coords || (coords.height === 0 && coords.top === 0)) {
      coords = this.activeTarget.getBoundingClientRect();
    }

    const popupWidth = this.popupEl.offsetWidth || 288;
    // Altura real renderizada del popup según la cantidad de sugerencias visibles
    const popupHeight = this.popupEl.offsetHeight || 160;

    let posX = coords.left;
    // Colocar el popup cómodamente justo por encima del cursor (a 6px de margen)
    let posY = coords.top - popupHeight - 6;

    // Si no cabe arriba del viewport (menos de 10px del borde superior), colocarlo justo debajo
    if (posY < 10) {
      const bottomBase = coords.bottom || (coords.top + 24);
      posY = bottomBase + 6;
    }

    // Ajustar límites horizontales para que no se salga de la pantalla
    posX = Math.max(12, Math.min(posX, window.innerWidth - popupWidth - 12));

    this.popupEl.style.left = `${Math.round(posX)}px`;
    this.popupEl.style.top = `${Math.round(posY)}px`;
  }

  show() {
    if (!this.popupEl) return;
    this.popupEl.style.visibility = 'visible';
    this.popupEl.classList.remove('opacity-0', 'scale-95', 'pointer-events-none');
    this.popupEl.classList.add('opacity-100', 'scale-100', 'pointer-events-auto');
    this.isVisible = true;
  }

  hide() {
    if (!this.popupEl || !this.isVisible) return;
    this.popupEl.classList.remove('opacity-100', 'scale-100', 'pointer-events-auto');
    this.popupEl.classList.add('opacity-0', 'scale-95', 'pointer-events-none');
    setTimeout(() => {
      if (!this.isVisible && this.popupEl) {
        this.popupEl.style.visibility = 'hidden';
        this.popupEl.style.top = '-9999px';
        this.popupEl.style.left = '-9999px';
      }
    }, 120);
    this.isVisible = false;
    this.matches = [];
    this.selectedIndex = 0;
  }

  _onKeyDown(e) {
    if (!this.isVisible) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      e.stopPropagation();
      this.selectedIndex = (this.selectedIndex + 1) % this.matches.length;
      this._renderPopupSelectionOnly();
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      e.stopPropagation();
      this.selectedIndex = (this.selectedIndex - 1 + this.matches.length) % this.matches.length;
      this._renderPopupSelectionOnly();
      return;
    }

    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      e.stopPropagation();
      const chosen = this.matches[this.selectedIndex];
      if (chosen) {
        this._insertEmoji(chosen);
      }
      return;
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      this.hide();
    }
  }

  _onDocumentClick(e) {
    if (!this.isVisible) return;
    if (this.popupEl && this.popupEl.contains(e.target)) return;
    if (this.activeTarget && this.activeTarget.contains(e.target)) return;
    this.hide();
  }

  _insertEmoji(emoji) {
    if (!emoji || !this.activeTarget) {
      this.hide();
      return;
    }

    // Caso 1: Editor enriquecido (contenteditable)
    if (this.activeTarget.classList?.contains('rich-text-editor') && this.currentMatchRange) {
      const { node, startOffset, endOffset } = this.currentMatchRange;

      if (node && node.parentNode && document.body.contains(node)) {
        const text = node.textContent;
        const before = text.substring(0, startOffset);
        const after = text.substring(endOffset);

        const img = document.createElement('img');
        img.className = 'custom-inline-emoji';
        img.src = emoji.url;
        img.alt = `:${emoji.shortcode}:`;
        img.title = `:${emoji.shortcode}:`;
        img.dataset.shortcode = emoji.shortcode;
        img.loading = 'lazy';

        const parent = node.parentNode;
        const textBeforeNode = document.createTextNode(before);
        const textAfterNode = document.createTextNode('\u200B ' + after);

        parent.insertBefore(textBeforeNode, node);
        parent.insertBefore(img, node);
        parent.insertBefore(textAfterNode, node);
        parent.removeChild(node);

        const sel = window.getSelection();
        if (sel) {
          const newRange = document.createRange();
          newRange.setStart(textAfterNode, 2);
          newRange.collapse(true);
          sel.removeAllRanges();
          sel.addRange(newRange);
        }

        if (typeof this.activeTarget._flushSync === 'function') {
          this.activeTarget._flushSync();
        }
      }
      this.hide();
      return;
    }

    // Caso 2: Textarea o Input estándar
    if (this.activeTarget && (this.activeTarget.tagName === 'TEXTAREA' || this.activeTarget.tagName === 'INPUT')) {
      const target = this.activeTarget;
      const textToInsert = `:${emoji.shortcode}: `;

      if (this.currentMatchIndices) {
        const { start, end } = this.currentMatchIndices;
        const val = target.value || '';
        target.value = val.substring(0, start) + textToInsert + val.substring(end);
        target.selectionStart = target.selectionEnd = start + textToInsert.length;
      } else {
        const pos = target.selectionStart || 0;
        const val = target.value || '';
        target.value = val.substring(0, pos) + textToInsert + val.substring(pos);
        target.selectionStart = target.selectionEnd = pos + textToInsert.length;
      }

      target.focus();
      target.dispatchEvent(new Event('input', { bubbles: true }));
      target.dispatchEvent(new Event('change', { bubbles: true }));
      this.hide();
      return;
    }

    this.hide();
  }
}

export const emojiAutocompleteEngine = new EmojiAutocompleteEngine();
export default emojiAutocompleteEngine;
