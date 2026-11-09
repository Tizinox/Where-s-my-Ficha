/**
 * utils/textFormatterEngine.js
 * Motor Global de Formato de Texto Enriquecido (WYSIWYG y Preview)
 * 
 * Permite que los usuarios vean y editen texto en Negrita, Cursiva, Subrayado y Tachado
 * DIRECTAMENTE en pantalla (sin ver molestos asteriscos crudos ** o *) tanto en Modo Edición
 * como en Modo Vista Previa / Lectura, manteniendo compatibilidad total con Discord Markdown,
 * almacenamiento en Alpine.js y persistencia en JSON/localStorage.
 */

/**
 * Convierte valores de color a formato Hexadecimal limpio (#rrggbb)
 */
export function rgbToHex(color) {
  if (!color || typeof color !== 'string') return color || '#ffffff';
  const trimmed = color.trim().toLowerCase();
  if (trimmed.startsWith('#')) return trimmed;
  const match = trimmed.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  if (match) {
    const r = parseInt(match[1], 10).toString(16).padStart(2, '0');
    const g = parseInt(match[2], 10).toString(16).padStart(2, '0');
    const b = parseInt(match[3], 10).toString(16).padStart(2, '0');
    return `#${r}${g}${b}`;
  }
  return trimmed;
}

export function hsvToRgb(h, s, v) {
  s = Math.max(0, Math.min(100, s)) / 100;
  v = Math.max(0, Math.min(100, v)) / 100;
  h = ((h % 360) + 360) % 360;
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let r = 0, g = 0, b = 0;
  if (h >= 0 && h < 60) { r = c; g = x; b = 0; }
  else if (h >= 60 && h < 120) { r = x; g = c; b = 0; }
  else if (h >= 120 && h < 180) { r = 0; g = c; b = x; }
  else if (h >= 180 && h < 240) { r = 0; g = x; b = c; }
  else if (h >= 240 && h < 300) { r = x; g = 0; b = c; }
  else { r = c; g = 0; b = x; }
  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255)
  };
}

export function rgbToHsv(r, g, b) {
  r = Math.max(0, Math.min(255, r)) / 255;
  g = Math.max(0, Math.min(255, g)) / 255;
  b = Math.max(0, Math.min(255, b)) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  const s = max === 0 ? 0 : d / max;
  const v = max;
  if (max !== min) {
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    v: Math.round(v * 100)
  };
}

export function rgbValuesToHex(r, g, b) {
  return '#' + [r, g, b].map(x => Math.max(0, Math.min(255, x)).toString(16).padStart(2, '0')).join('');
}

export function rgbToHsl(r, g, b) {
  r = Math.max(0, Math.min(255, r)) / 255;
  g = Math.max(0, Math.min(255, g)) / 255;
  b = Math.max(0, Math.min(255, b)) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
}

export function hslToRgb(h, s, l) {
  h = ((h % 360) + 360) % 360;
  s = Math.max(0, Math.min(100, s)) / 100;
  l = Math.max(0, Math.min(100, l)) / 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;

  if (h >= 0 && h < 60) { r = c; g = x; b = 0; }
  else if (h >= 60 && h < 120) { r = x; g = c; b = 0; }
  else if (h >= 120 && h < 180) { r = 0; g = c; b = x; }
  else if (h >= 180 && h < 240) { r = 0; g = x; b = c; }
  else if (h >= 240 && h < 300) { r = x; g = 0; b = c; }
  else { r = c; g = 0; b = x; }

  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255)
  };
}

export function hexToHsv(hex) {
  const clean = (hex || '').replace(/^#/, '');
  let r = 255, g = 255, b = 255;
  if (clean.length === 6) {
    r = parseInt(clean.substring(0, 2), 16) || 0;
    g = parseInt(clean.substring(2, 4), 16) || 0;
    b = parseInt(clean.substring(4, 6), 16) || 0;
  } else if (clean.length === 3) {
    r = parseInt(clean[0] + clean[0], 16) || 0;
    g = parseInt(clean[1] + clean[1], 16) || 0;
    b = parseInt(clean[2] + clean[2], 16) || 0;
  }
  return rgbToHsv(r, g, b);
}

/**
 * Sanea y repara cadenas que hayan sido contaminadas con tokens residuales
 * de color (_SPAN_COLOR_TOKEN_x, ___SPAN_COLOR_x___, etc.) por versiones previas.
 * @param {string} str Texto potencialmente contaminado
 * @returns {string} Texto saneado y limpio
 */
export function sanitizeCorruptedTokens(str) {
  if (!str || typeof str !== 'string') return '';
  return str
    .replace(/<u>\s*_*SPAN_COLOR(?:_TOKEN)?_\d+_*<\/u>_*/gi, '')
    .replace(/<u>\s*<\/u>/gi, '')
    .replace(/<em>\s*<\/em>/gi, '')
    .replace(/<strong>\s*<\/strong>/gi, '')
    .replace(/<s>\s*<\/s>/gi, '')
    .replace(/<span[^>]*>\s*<\/span>/gi, '')
    .replace(/_*SPAN_COLOR(?:_TOKEN)?_\d+_*<\/u>_*/gi, '')
    .replace(/_+SPAN_COLOR(?:_TOKEN)?_\d+_*/gi, '')
    .replace(/_*SPAN_COLOR(?:_TOKEN)?_\d+_+/gi, '')
    .replace(/\bSPAN_COLOR(?:_TOKEN)?_\d+\b/gi, '')
    .replace(/____+/g, '__');
}

/**
 * Recorre recursivamente todas las propiedades de un objeto y purga
 * cualquier cadena que contenga tokens corruptos de color.
 * @param {object} obj Objeto a sanear (ej. Personaje)
 * @returns {boolean} True si se modificó alguna propiedad
 */
export function sanitizeCharacterData(obj) {
  if (!obj || typeof obj !== 'object') return false;
  let modified = false;
  function walk(node) {
    if (!node || typeof node !== 'object') return;
    for (const key of Object.keys(node)) {
      const val = node[key];
      if (typeof val === 'string') {
        if (val.includes('SPAN_COLOR')) {
          node[key] = sanitizeCorruptedTokens(val);
          modified = true;
        }
      } else if (typeof val === 'object' && val !== null) {
        walk(val);
      }
    }
  }
  walk(obj);
  return modified;
}

/**
 * Convierte sintaxis Markdown o etiquetas HTML seguras a HTML estilizado para el editor y la vista previa.
 * @param {string} text Texto con Markdown o formato mixto
 * @returns {string} HTML renderizado
 */
export function parseMarkdownToHtml(text) {
  if (!text || typeof text !== 'string') return '';
  let html = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Limpieza preventiva de tokens corruptos heredados de versiones previas
  html = sanitizeCorruptedTokens(html);

  // Normalizar variantes de <font color="..."> a <span style="color: ...">
  html = html.replace(/<font\b[^>]*?\bcolor=(?:["']([^"']+)["']|([^\s>]+))[^>]*>/gi, (match, c1, c2) => {
    const color = rgbToHex(c1 || c2 || '');
    return `<span style="color: ${color};">`;
  });
  html = html.replace(/<\/font>/gi, '</span>');

  // Si no contiene caracteres de formato, retornar texto seguro con saltos <br>
  if (!/[\*\_~<>]/.test(html)) {
    return html.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>');
  }

  // 1. Proteger bloques de color canónicos <span style="color: ...">...</span>
  // Se utilizan delimitadores Unicode Private Use Area (\uE000 y \uE001) para que
  // ninguna regla de Markdown (negrita, cursiva, subrayado) colisione con el token.
  const spanTokens = [];
  html = html.replace(/<span style="color:\s*([^;"]+);?">([\s\S]*?)<\/span>/gi, (match, colorRaw, inner) => {
    const idx = spanTokens.length;
    const hex = rgbToHex(colorRaw.trim());
    spanTokens.push({ hex, inner });
    return `\uE000COLORTKN${idx}\uE001`;
  });

  // 1b. Proteger tags span de color que hayan quedado sin cerrar por versiones anteriores
  html = html.replace(/<span style="color:\s*([^;"]+);?">([^<]*)$/gi, (match, colorRaw, inner) => {
    const idx = spanTokens.length;
    const hex = rgbToHex(colorRaw.trim());
    spanTokens.push({ hex, inner });
    return `\uE000COLORTKN${idx}\uE001`;
  });

  // 2. Escapar caracteres HTML inseguros
  html = html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

  // 3. Transformar sintaxis de Markdown en elementos HTML
  // Negrita + Cursiva (***texto***)
  html = html.replace(/\*\*\*([^\*]+?)\*\*\*/g, '<strong><em>$1</em></strong>');

  // Negrita (**texto**)
  html = html.replace(/\*\*([^\*]+?)\*\*/g, '<strong>$1</strong>');

  // Cursiva (*texto* o _texto_ en límites de palabra)
  html = html.replace(/(^|[^\*])\*([^\*]+?)\*(?=[^\*]|$)/g, '$1<em>$2</em>');
  html = html.replace(/(^|[^a-zA-Z0-9_])_([^_\n]+?)_(?=[^a-zA-Z0-9_]|$)/g, '$1<em>$2</em>');

  // Subrayado (__texto__)
  html = html.replace(/__([^_]+?)__/g, '<u>$1</u>');

  // Tachado (~~texto~~)
  html = html.replace(/~~([^~]+?)~~/g, '<s>$1</s>');

  // 3b. Transformar emoticonos personalizados :shortcode: en imágenes
  html = html.replace(/:([a-zA-Z0-9_\-]{2,32}):/g, (match, code) => {
    try {
      const emoji = window.Alpine?.store('customEmojis')?.getEmojiByShortcode(code);
      if (emoji && emoji.url) {
        return `<img class="custom-inline-emoji" src="${emoji.url}" alt=":${emoji.shortcode}:" title=":${emoji.shortcode}:" data-shortcode="${emoji.shortcode}" loading="lazy" />`;
      }
    } catch (e) {}
    return match;
  });

  // 4. Restaurar y parsear internamente los bloques de color
  spanTokens.forEach((tok, idx) => {
    let parsedInner = tok.inner;
    parsedInner = parsedInner.replace(/\*\*\*([^\*]+?)\*\*\*/g, '<strong><em>$1</em></strong>');
    parsedInner = parsedInner.replace(/\*\*([^\*]+?)\*\*/g, '<strong>$1</strong>');
    parsedInner = parsedInner.replace(/(^|[^\*])\*([^\*]+?)\*(?=[^\*]|$)/g, '$1<em>$2</em>');
    parsedInner = parsedInner.replace(/(^|[^a-zA-Z0-9_])_([^_\n]+?)_(?=[^a-zA-Z0-9_]|$)/g, '$1<em>$2</em>');
    parsedInner = parsedInner.replace(/__([^_]+?)__/g, '<u>$1</u>');
    parsedInner = parsedInner.replace(/~~([^~]+?)~~/g, '<s>$1</s>');

    html = html.replaceAll(`\uE000COLORTKN${idx}\uE001`, `<span style="color: ${tok.hex};">${parsedInner}</span>`);
  });

  // 5. Convertir saltos de línea en <br>
  html = html.replace(/\n/g, '<br>');

  return html;
}

/**
 * Escapa caracteres HTML inseguros
 */
function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Serializa el DOM del editor enriquecido a sintaxis Markdown limpia para guardar en el modelo de datos.
 * @param {string|HTMLElement} source HTML o elemento contenedor
 * @returns {string} Texto en Markdown limpio para Discord y Alpine
 */
export function serializeHtmlToMarkdown(source) {
  if (!source) return '';

  let html = typeof source === 'string' ? source : (source.innerHTML || '');

  // Limpieza preventiva de tokens corruptos
  html = sanitizeCorruptedTokens(html);

  // 1. Reemplazar saltos de línea de bloque por \n
  html = html
    .replace(/<div><br\s*[\/]?>\s*<\/div>/gi, '\n')
    .replace(/<div>(.*?)<\/div>/gi, '\n$1')
    .replace(/<p>(.*?)<\/p>/gi, '\n$1\n')
    .replace(/<br\s*[\/]?>/gi, '\n');

  // 2. Normalizar variantes de <font color="..."> a <span style="color: ...">
  html = html.replace(/<font\b[^>]*?\bcolor=(?:["']([^"']+)["']|([^\s>]+))[^>]*>/gi, (match, c1, c2) => {
    const color = rgbToHex(c1 || c2 || '');
    return `<span style="color: ${color};">`;
  });
  html = html.replace(/<\/font>/gi, '</span>');

  // 3. Normalizar tags con color directo en style (<strong style="color: ...">, etc.)
  html = html.replace(/<(strong|b)\b([^>]*)>([\s\S]*?)<\/\1>/gi, (match, tag, attrs, inner) => {
    const colorMatch = attrs.match(/color:\s*([^;"']+)/i) || attrs.match(/color=["']([^"']+)["']/i);
    if (colorMatch) {
      const hex = rgbToHex(colorMatch[1]);
      return `<span style="color: ${hex};">**${inner}**</span>`;
    }
    return `**${inner}**`;
  });

  html = html.replace(/<(em|i)\b([^>]*)>([\s\S]*?)<\/\1>/gi, (match, tag, attrs, inner) => {
    const colorMatch = attrs.match(/color:\s*([^;"']+)/i) || attrs.match(/color=["']([^"']+)["']/i);
    if (colorMatch) {
      const hex = rgbToHex(colorMatch[1]);
      return `<span style="color: ${hex};">*${inner}*</span>`;
    }
    return `*${inner}*`;
  });

  html = html.replace(/<u\b([^>]*)>([\s\S]*?)<\/u>/gi, (match, attrs, inner) => {
    const colorMatch = attrs.match(/color:\s*([^;"']+)/i) || attrs.match(/color=["']([^"']+)["']/i);
    if (colorMatch) {
      const hex = rgbToHex(colorMatch[1]);
      return `<span style="color: ${hex};">__${inner}__</span>`;
    }
    return `__${inner}__`;
  });

  html = html.replace(/<(s|del|strike)\b([^>]*)>([\s\S]*?)<\/\1>/gi, (match, tag, attrs, inner) => {
    const colorMatch = attrs.match(/color:\s*([^;"']+)/i) || attrs.match(/color=["']([^"']+)["']/i);
    if (colorMatch) {
      const hex = rgbToHex(colorMatch[1]);
      return `<span style="color: ${hex};">~~${inner}~~</span>`;
    }
    return `~~${inner}~~`;
  });

  // 4. Normalizar spans con estilos de color y variantes de font-weight / font-style
  html = html.replace(/<span\b([^>]*)>([\s\S]*?)<\/span>/gi, (match, attrs, inner) => {
    const colorMatch = attrs.match(/color:\s*([^;"']+)/i);
    const isBold = /font-weight:\s*(bold|[6-9]\d\d)/i.test(attrs);
    const isItalic = /font-style:\s*italic/i.test(attrs);
    const isUnderline = /text-decoration:\s*[^;]*underline/i.test(attrs);
    const isStrike = /text-decoration:\s*[^;]*line-through/i.test(attrs);

    let wrapped = inner;
    if (isBold && !wrapped.startsWith('**') && !wrapped.endsWith('**')) wrapped = `**${wrapped}**`;
    if (isItalic && !wrapped.startsWith('*') && !wrapped.endsWith('*')) wrapped = `*${wrapped}*`;
    if (isUnderline && !wrapped.startsWith('__') && !wrapped.endsWith('__')) wrapped = `__${wrapped}__`;
    if (isStrike && !wrapped.startsWith('~~') && !wrapped.endsWith('~~')) wrapped = `~~${wrapped}~~`;

    if (colorMatch) {
      const hex = rgbToHex(colorMatch[1].trim());
      return `<span style="color: ${hex};">${wrapped}</span>`;
    }
    return wrapped;
  });

  // Normalizar cualquier span restante que tenga formato anidado por fuera
  html = html.replace(/__<span style="color:\s*([^;"]+);?">([\s\S]*?)<\/span>__/gi, (match, color, inner) => {
    return `<span style="color: ${rgbToHex(color)};">__${inner}__</span>`;
  });
  html = html.replace(/\*\*<span style="color:\s*([^;"]+);?">([\s\S]*?)<\/span>\*\*/gi, (match, color, inner) => {
    return `<span style="color: ${rgbToHex(color)};">**${inner}**</span>`;
  });
  html = html.replace(/\*<span style="color:\s*([^;"]+);?">([\s\S]*?)<\/span>\*/gi, (match, color, inner) => {
    return `<span style="color: ${rgbToHex(color)};">*${inner}*</span>`;
  });
  html = html.replace(/~~<span style="color:\s*([^;"]+);?">([\s\S]*?)<\/span>~~/gi, (match, color, inner) => {
    return `<span style="color: ${rgbToHex(color)};">~~${inner}~~</span>`;
  });

  // 5. Convertir imágenes de emoticonos personalizados de vuelta a sintaxis :shortcode:
  html = html.replace(/<img\b[^>]*?(?:data-shortcode=["']([^"']+)["']|alt=["']:?([^"':]+):?["'])[^>]*>/gi, (match, c1, c2) => {
    const code = (c1 || c2 || '').trim();
    return code ? `:${code}:` : '';
  });

  // 6. Proteger spans canónicos de color COMPLETOS: apertura Y cierre
  // Usamos delimitadores Unicode Private Use Area (\uE002 y \uE003) completamente libres de guiones bajos o tags HTML
  const colorTokens = [];
  html = html.replace(/<span style="color:\s*(#[0-9a-fA-F]{3,8});?">([\s\S]*?)<\/span>/gi, (match, hex, inner) => {
    const idx = colorTokens.length;
    colorTokens.push({ hex: hex.toLowerCase(), inner });
    return `\uE002COLORTKNSER${idx}\uE003`;
  });

  // 7. Eliminar cualquier etiqueta HTML remanente no soportada
  html = html.replace(/<[^>]+>/g, '');

  // 8. Restaurar spans canónicos protegidos
  colorTokens.forEach((tok, idx) => {
    html = html.replaceAll(`\uE002COLORTKNSER${idx}\uE003`, `<span style="color: ${tok.hex};">${tok.inner}</span>`);
  });

  // 9. Decodificar entidades HTML básicas
  html = html
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'");

  // 10. Normalizar saltos de línea repetidos de forma limpia
  return html.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

/**
 * Formateador universal para usar en plantillas Alpine: x-html="$store.app.formatRichText(val)"
 */
export function formatRichText(text) {
  return parseMarkdownToHtml(text);
}

/**
 * Motor Global de Formato de Texto
 */
class TextFormatterEngine {
  constructor() {
    this.activeEditor = null;
    this.activeInput = null;
    this.savedEditor = null;
    this.savedRange = null;
    this.savedActiveInput = null;
    this.savedSelectionStart = 0;
    this.savedSelectionEnd = 0;
    this.isVisible = false;
    this.toolbarEl = null;
    this._enhancedTextareas = new WeakSet();
    this._isScanning = false;
    this._isColorPopoverOpen = false;
    this._selectionRafId = null;

    // Estado interno del selector de color interactivo
    this._pickerH = 0;
    this._pickerS = 100;
    this._pickerV = 100;
    this._pickerHex = '#ffffff';
    this._colorMode = 'hex'; // 'hex' | 'rgb' | 'hsl'

    this._onSelectionChange = this._onSelectionChange.bind(this);
    this._onKeyDown = this._onKeyDown.bind(this);
    this._onWindowClick = this._onWindowClick.bind(this);
    this._onScroll = this._onScroll.bind(this);
  }

  init() {
    this._createToolbar();

    // Eventos de selección de texto
    document.addEventListener('mouseup', this._onSelectionChange, { passive: true });
    document.addEventListener('keyup', this._onSelectionChange, { passive: true });
    document.addEventListener('selectionchange', this._onSelectionChange, { passive: true });
    document.addEventListener('keydown', this._onKeyDown);
    document.addEventListener('mousedown', this._onWindowClick);
    window.addEventListener('scroll', this._onScroll, { capture: true, passive: true });
    window.addEventListener('resize', () => this.hide(), { passive: true });

    // Escanear y elevar textareas a editores enriquecidos
    this.scanAndEnhance();

    // Observar mutaciones en el DOM para nuevos textareas y para auto-formato en modo lectura de forma optimizada
    if (typeof MutationObserver !== 'undefined') {
      let _formatRafId = null;
      const observer = new MutationObserver((mutations) => {
        let hasRelevantChanges = false;
        for (let i = 0; i < mutations.length; i++) {
          const added = mutations[i].addedNodes;
          if (!added || added.length === 0) continue;
          for (let j = 0; j < added.length; j++) {
            const node = added[j];
            if (node.nodeType === 1) { // Node.ELEMENT_NODE
              // Ignorar mutaciones disparadas por nuestros propios componentes para evitar bucles
              if (node.classList?.contains('rich-text-editor') || node.classList?.contains('rich-formatted') || node.id === 'tactical-floating-text-toolbar' || node.id === 'tactical-emoji-autocomplete-popup') {
                continue;
              }
              if (node.closest && (node.closest('.rich-formatted') || node.closest('.rich-text-editor') || node.closest('#tactical-floating-text-toolbar') || node.closest('#tactical-emoji-autocomplete-popup'))) {
                continue;
              }
              if (node.tagName === 'TEXTAREA' || (node.querySelector && node.querySelector('textarea:not(.no-rich)'))) {
                hasRelevantChanges = true;
                break;
              }
              if (node.classList?.contains('read-value') || (node.querySelector && node.querySelector('.read-value:not(.rich-formatted), .read-card p:not(.read-label):not(.rich-formatted)'))) {
                hasRelevantChanges = true;
                break;
              }
            }
          }
          if (hasRelevantChanges) break;
        }

        if (!hasRelevantChanges) return;

        // Debounce con requestAnimationFrame para evitar layout thrashing
        if (_formatRafId) cancelAnimationFrame(_formatRafId);
        _formatRafId = requestAnimationFrame(() => {
          _formatRafId = null;
          this.scanAndEnhance();
          this.formatPreviewElements();
        });
      });
      observer.observe(document.body, { childList: true, subtree: true });
    }

    // Efecto reactivo con Alpine: sincronizar con debounce real cancelable al cambiar personaje o pestaña
    if (typeof window !== 'undefined' && window.Alpine) {
      let _syncTimer = null;
      let _lastTab = null;
      let _lastCharId = null;
      window.Alpine.effect(() => {
        const _activeId = window.Alpine.store('characters')?.activeId;
        const _currentTab = window.Alpine.store('app')?.currentTab;
        const _editMode = window.Alpine.store('app')?.editMode;
        
        const isTabSwitch = _lastTab !== null && _lastTab !== _currentTab;
        const isCharSwitch = _lastCharId !== null && _lastCharId !== _activeId;
        _lastTab = _currentTab;
        _lastCharId = _activeId;

        if (_syncTimer) clearTimeout(_syncTimer);
        // Si solo se cambió de pestaña dentro del mismo personaje, postergar la sincronización (240ms)
        // para que jamás interfiera con los 60 FPS de la transición visual entre secciones.
        const delay = (isTabSwitch && !isCharSwitch) ? 240 : 40;
        _syncTimer = setTimeout(() => {
          _syncTimer = null;
          this.syncAllEditorsFromTextareas();
          this.formatPreviewElements();
        }, delay);
      });
    }
  }

  _createToolbar() {
    if (this.toolbarEl) return;

    const bar = document.createElement('div');
    bar.id = 'tactical-floating-text-toolbar';
    bar.className = 'fixed z-[9999999] flex items-center gap-1 p-1 rounded-xl transition-all duration-150 select-none pointer-events-auto opacity-0 scale-95 pointer-events-none';
    bar.style.top = '-9999px';
    bar.style.left = '-9999px';
    bar.style.visibility = 'hidden';
    bar.style.backgroundColor = '#0b0e14';
    bar.style.border = '1px solid rgba(211, 193, 146, 0.55)';
    bar.style.boxShadow = '0 14px 38px rgba(0, 0, 0, 0.98), 0 0 0 1px rgba(255, 255, 255, 0.08)';
    bar.setAttribute('role', 'toolbar');
    bar.setAttribute('aria-label', 'Formato de Texto');

    bar.innerHTML = `
      <button type="button" data-format="bold" class="tf-btn px-2.5 py-1 rounded-lg text-xs font-bold text-parchment-cream hover:text-white hover:bg-white/10 active:scale-95 transition-all flex items-center justify-center font-serif cursor-pointer" title="Negrita / Grueso (Bold) [Ctrl+B]">
        <span class="font-extrabold text-sm leading-none" style="text-shadow: 0 0 1px currentColor;">B</span>
      </button>
      <button type="button" data-format="italic" class="tf-btn px-2.5 py-1 rounded-lg text-xs font-medium italic text-parchment-cream hover:text-white hover:bg-white/10 active:scale-95 transition-all flex items-center justify-center font-serif cursor-pointer" title="Cursiva (Italic) [Ctrl+I]">
        <span class="italic text-sm leading-none">I</span>
      </button>
      <button type="button" data-format="underline" class="tf-btn px-2.5 py-1 rounded-lg text-xs font-medium underline text-parchment-cream hover:text-white hover:bg-white/10 active:scale-95 transition-all flex items-center justify-center font-serif cursor-pointer" title="Subrayado (Underline) [Ctrl+U]">
        <span class="underline text-sm leading-none">U</span>
      </button>
      <button type="button" data-format="strikethrough" class="tf-btn px-2.5 py-1 rounded-lg text-xs font-medium line-through text-parchment-cream hover:text-white hover:bg-white/10 active:scale-95 transition-all flex items-center justify-center font-serif cursor-pointer" title="Tachado (Strikethrough) [Ctrl+Shift+S]">
        <span class="line-through text-sm leading-none opacity-80">S</span>
      </button>

      <div class="w-[1px] h-4 bg-white/20 mx-0.5 self-center"></div>

      <!-- Botón de color (bolita con halo de color activo) -->
      <div class="relative flex items-center">
        <button type="button" id="tf-color-btn" class="tf-color-trigger px-2 py-1 rounded-lg hover:bg-white/10 active:scale-95 transition-all flex items-center justify-center cursor-pointer group" title="Color de Texto Personalizado">
          <span id="tf-color-dot" class="w-3.5 h-3.5 rounded-full bg-white border border-black/50 shadow-[0_0_8px_rgba(255,255,255,0.7)] group-hover:scale-110 transition-transform pointer-events-none"></span>
        </button>

        <!-- Popover flotante del Selector de Color Profesional -->
        <div id="tf-color-popover" class="absolute top-full right-0 mt-2 p-3.5 rounded-2xl flex flex-col gap-2.5 transition-all duration-150 z-[99999999] opacity-0 scale-95 pointer-events-none w-72" style="display: none; background-color: #0b0e14; border: 1px solid rgba(211, 193, 146, 0.55); box-shadow: 0 24px 60px rgba(0, 0, 0, 0.98), 0 0 0 1px rgba(255, 255, 255, 0.1);">
          
          <!-- Encabezado con muestra y botón Quitar -->
          <div class="flex items-center justify-between gap-2 pb-2 border-b border-white/10">
            <div class="flex items-center gap-2">
              <span id="tf-picker-preview" class="w-6 h-6 rounded-full border border-white/60 shadow-inner shrink-0" data-protect-circle data-protect-radius style="background-color: #ffffff;"></span>
              <span class="text-xs font-semibold text-white tracking-wide font-sans">Color de Texto</span>
            </div>
            <button type="button" id="tf-reset-color-btn" class="text-[11px] font-medium font-sans text-white/70 hover:text-white px-2.5 py-0.5 rounded-md bg-white/5 hover:bg-white/15 border border-white/15 transition-colors cursor-pointer" title="Restablecer al color por defecto">Quitar</button>
          </div>

          <!-- Cuadro 2D: Saturación y Brillo -->
          <div id="tf-sv-box" class="w-full h-28 rounded-lg relative overflow-hidden cursor-crosshair border border-white/20 select-none touch-none" style="background-color: hsl(0, 100%, 50%); background-image: linear-gradient(to bottom, transparent, #000000), linear-gradient(to right, #ffffff, transparent);">
            <div id="tf-sv-handle" class="absolute w-4 h-4 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.9),0_0_4px_rgba(0,0,0,0.8)] -translate-x-1/2 -translate-y-1/2 pointer-events-none bg-transparent" data-protect-circle data-protect-radius style="left: 0%; top: 0%;"></div>
          </div>

          <!-- Barra Horizontal: Hue (Tono 0 - 360°) -->
          <div class="flex flex-col gap-1">
            <div class="flex items-center justify-between text-[10px] text-white/50 font-mono">
              <span>Tono</span>
              <span id="tf-hue-val">0°</span>
            </div>
            <div id="tf-hue-slider" class="w-full h-3.5 rounded-full relative cursor-pointer border border-black/70 select-none touch-none" style="background: linear-gradient(to right, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%);">
              <div id="tf-hue-handle" class="absolute top-1/2 -translate-y-1/2 w-4.5 h-4.5 rounded-full bg-white border border-black/80 shadow-[0_0_4px_rgba(0,0,0,0.8)] -translate-x-1/2 pointer-events-none" data-protect-circle data-protect-radius style="left: 0%;"></div>
            </div>
          </div>

          <!-- Fila de Inputs Multimodo (HEX / RGB / HSL) con selector de formato -->
          <div class="flex items-center gap-1.5 p-1 rounded-xl bg-[#06080d] border border-white/15">
            
            <!-- Modo HEX -->
            <div id="tf-mode-hex" class="flex-1 flex items-center gap-1.5 px-2">
              <span class="text-[10px] font-mono font-bold text-accent-gold select-none">HEX</span>
              <input type="text" id="tf-hex-input" class="w-full px-1.5 py-0.5 rounded bg-transparent border-none text-xs font-mono font-bold text-white focus:outline-none text-center" maxlength="7" value="#FFFFFF" spellcheck="false" />
            </div>

            <!-- Modo RGB -->
            <div id="tf-mode-rgb" class="flex-1 hidden items-center justify-between gap-1 px-1">
              <div class="flex flex-col items-center flex-1">
                <input type="number" id="tf-rgb-r" min="0" max="255" class="w-full px-1 py-0.5 rounded bg-white/10 border border-white/15 text-xs font-mono font-bold text-white text-center focus:border-accent-gold focus:outline-none" value="255" />
                <span class="text-[9px] font-mono text-white/50 mt-0.5 select-none">R</span>
              </div>
              <div class="flex flex-col items-center flex-1">
                <input type="number" id="tf-rgb-g" min="0" max="255" class="w-full px-1 py-0.5 rounded bg-white/10 border border-white/15 text-xs font-mono font-bold text-white text-center focus:border-accent-gold focus:outline-none" value="255" />
                <span class="text-[9px] font-mono text-white/50 mt-0.5 select-none">G</span>
              </div>
              <div class="flex flex-col items-center flex-1">
                <input type="number" id="tf-rgb-b" min="0" max="255" class="w-full px-1 py-0.5 rounded bg-white/10 border border-white/15 text-xs font-mono font-bold text-white text-center focus:border-accent-gold focus:outline-none" value="255" />
                <span class="text-[9px] font-mono text-white/50 mt-0.5 select-none">B</span>
              </div>
            </div>

            <!-- Modo HSL -->
            <div id="tf-mode-hsl" class="flex-1 hidden items-center justify-between gap-1 px-1">
              <div class="flex flex-col items-center flex-1">
                <input type="number" id="tf-hsl-h" min="0" max="360" class="w-full px-1 py-0.5 rounded bg-white/10 border border-white/15 text-xs font-mono font-bold text-white text-center focus:border-accent-gold focus:outline-none" value="0" />
                <span class="text-[9px] font-mono text-white/50 mt-0.5 select-none">H°</span>
              </div>
              <div class="flex flex-col items-center flex-1">
                <input type="number" id="tf-hsl-s" min="0" max="100" class="w-full px-1 py-0.5 rounded bg-white/10 border border-white/15 text-xs font-mono font-bold text-white text-center focus:border-accent-gold focus:outline-none" value="100" />
                <span class="text-[9px] font-mono text-white/50 mt-0.5 select-none">S%</span>
              </div>
              <div class="flex flex-col items-center flex-1">
                <input type="number" id="tf-hsl-l" min="0" max="100" class="w-full px-1 py-0.5 rounded bg-white/10 border border-white/15 text-xs font-mono font-bold text-white text-center focus:border-accent-gold focus:outline-none" value="50" />
                <span class="text-[9px] font-mono text-white/50 mt-0.5 select-none">L%</span>
              </div>
            </div>

            <!-- Botón Copiar Código de Color -->
            <button type="button" id="tf-copy-color-btn" class="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/15 active:scale-95 text-white/70 hover:text-white transition-all flex items-center justify-center cursor-pointer shrink-0 border border-white/10" title="Copiar código actual al portapapeles">
              <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
            </button>

            <!-- Botón Conmutador de Formato (↕) -->
            <button type="button" id="tf-mode-switch-btn" class="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/15 active:scale-95 text-white/70 hover:text-white transition-all flex items-center justify-center cursor-pointer shrink-0 border border-white/10" title="Cambiar formato de color: HEX / RGB / HSL">
              <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="7 15 12 20 17 15"></polyline>
                <polyline points="7 9 12 4 17 9"></polyline>
              </svg>
            </button>
          </div>

          <!-- Paleta de Colores Rápidos -->
          <div class="flex flex-wrap items-center justify-between gap-1 pt-1 border-t border-white/10">
            <button type="button" class="tf-color-swatch w-5 h-5 rounded-full bg-white border border-black/50 hover:scale-125 transition-transform cursor-pointer shadow-sm" data-protect-circle data-protect-radius data-color="#ffffff" title="Blanco"></button>
            <button type="button" class="tf-color-swatch w-5 h-5 rounded-full bg-[#d3c192] border border-black/50 hover:scale-125 transition-transform cursor-pointer shadow-sm" data-protect-circle data-protect-radius data-color="#d3c192" title="Oro"></button>
            <button type="button" class="tf-color-swatch w-5 h-5 rounded-full bg-[#f59e0b] border border-black/50 hover:scale-125 transition-transform cursor-pointer shadow-sm" data-protect-circle data-protect-radius data-color="#f59e0b" title="Ámbar"></button>
            <button type="button" class="tf-color-swatch w-5 h-5 rounded-full bg-[#00f0ff] border border-black/50 hover:scale-125 transition-transform cursor-pointer shadow-sm" data-protect-circle data-protect-radius data-color="#00f0ff" title="Cian"></button>
            <button type="button" class="tf-color-swatch w-5 h-5 rounded-full bg-[#38bdf8] border border-black/50 hover:scale-125 transition-transform cursor-pointer shadow-sm" data-protect-circle data-protect-radius data-color="#38bdf8" title="Azul Celeste"></button>
            <button type="button" class="tf-color-swatch w-5 h-5 rounded-full bg-[#ef4444] border border-black/50 hover:scale-125 transition-transform cursor-pointer shadow-sm" data-protect-circle data-protect-radius data-color="#ef4444" title="Rubí / Rojo"></button>
            <button type="button" class="tf-color-swatch w-5 h-5 rounded-full bg-[#ec4899] border border-black/50 hover:scale-125 transition-transform cursor-pointer shadow-sm" data-protect-circle data-protect-radius data-color="#ec4899" title="Rosa"></button>
            <button type="button" class="tf-color-swatch w-5 h-5 rounded-full bg-[#10b981] border border-black/50 hover:scale-125 transition-transform cursor-pointer shadow-sm" data-protect-circle data-protect-radius data-color="#10b981" title="Esmeralda"></button>
            <button type="button" class="tf-color-swatch w-5 h-5 rounded-full bg-[#a855f7] border border-black/50 hover:scale-125 transition-transform cursor-pointer shadow-sm" data-protect-circle data-protect-radius data-color="#a855f7" title="Púrpura"></button>
            <button type="button" class="tf-color-swatch w-5 h-5 rounded-full bg-[#94a3b8] border border-black/50 hover:scale-125 transition-transform cursor-pointer shadow-sm" data-protect-circle data-protect-radius data-color="#94a3b8" title="Plata"></button>
          </div>

          <!-- Botón de Confirmación -->
          <button type="button" id="tf-apply-color-btn" class="w-full py-2 px-3 rounded-xl bg-accent-gold/25 hover:bg-accent-gold/35 border border-accent-gold/60 text-accent-gold hover:text-white text-xs font-bold tracking-wider uppercase flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-sm mt-0.5">
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            Aplicar Color
          </button>

        </div>
      </div>

      <div class="w-[1px] h-4 bg-white/20 mx-0.5 self-center"></div>

      <!-- Botón de emoticonos / emojis -->
      <button type="button" id="tf-emoji-btn" class="px-2 py-1 rounded-lg text-sm hover:bg-white/10 active:scale-95 transition-all flex items-center justify-center cursor-pointer group" title="Insertar Emoticono Personalizado">
        <span class="group-hover:scale-110 transition-transform">😊</span>
      </button>
    `;

    // Botones de formato B, I, U, S
    bar.querySelectorAll('.tf-btn[data-format]').forEach(btn => {
      btn.addEventListener('mousedown', (e) => {
        e.preventDefault(); // Mantiene el foco en el editor activo
      });
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const format = btn.getAttribute('data-format');
        if (format) {
          this.applyFormat(format);
        }
      });
    });

    // Botón de selector de emojis
    const emojiBtn = bar.querySelector('#tf-emoji-btn');
    if (emojiBtn) {
      emojiBtn.addEventListener('mousedown', (e) => {
        e.preventDefault();
        this._saveCurrentSelection();
      });
      emojiBtn.addEventListener('click', (e) => {
        e.preventDefault();
        window.Alpine?.store('customEmojis')?.openPicker(this.activeEditor || this.activeInput);
      });
    }

    // Toggle de la paleta de colores
    const colorBtn = bar.querySelector('#tf-color-btn');
    const popover = bar.querySelector('#tf-color-popover');

    // Evitar pérdida de selección en el editor al hacer clic dentro del popover (salvo inputs de texto)
    popover.addEventListener('mousedown', (e) => {
      if (e.target.tagName !== 'INPUT') {
        e.preventDefault();
      }
    });

    colorBtn.addEventListener('mousedown', (e) => {
      e.preventDefault();
      this._saveCurrentSelection();
    });
    colorBtn.addEventListener('click', (e) => {
      e.preventDefault();
      this._toggleColorPopover();
    });

    // Control 2D: Saturación y Brillo (SV Box)
    const svBox = popover.querySelector('#tf-sv-box');
    const updateSvFromEvent = (e) => {
      const rect = svBox.getBoundingClientRect();
      const clientX = Math.max(rect.left, Math.min(rect.right, e.clientX));
      const clientY = Math.max(rect.top, Math.min(rect.bottom, e.clientY));
      const s = Math.round(((clientX - rect.left) / rect.width) * 100);
      const v = Math.round((1 - ((clientY - rect.top) / rect.height)) * 100);
      this._updatePickerColor(this._pickerH, s, v, 'sv');
    };

    svBox.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      try { svBox.setPointerCapture(e.pointerId); } catch (_) {}
      updateSvFromEvent(e);

      const onMove = (moveEv) => updateSvFromEvent(moveEv);
      const onUp = (upEv) => {
        try { svBox.releasePointerCapture(upEv.pointerId); } catch (_) {}
        svBox.removeEventListener('pointermove', onMove);
        svBox.removeEventListener('pointerup', onUp);
        svBox.removeEventListener('pointercancel', onUp);
      };

      svBox.addEventListener('pointermove', onMove);
      svBox.addEventListener('pointerup', onUp);
      svBox.addEventListener('pointercancel', onUp);
    });

    // Control Horizontal: Hue Slider
    const hueSlider = popover.querySelector('#tf-hue-slider');
    const updateHueFromEvent = (e) => {
      const rect = hueSlider.getBoundingClientRect();
      const clientX = Math.max(rect.left, Math.min(rect.right, e.clientX));
      const h = Math.round(((clientX - rect.left) / rect.width) * 360) % 360;
      this._updatePickerColor(h, this._pickerS, this._pickerV, 'hue');
    };

    hueSlider.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      try { hueSlider.setPointerCapture(e.pointerId); } catch (_) {}
      updateHueFromEvent(e);

      const onMove = (moveEv) => updateHueFromEvent(moveEv);
      const onUp = (upEv) => {
        try { hueSlider.releasePointerCapture(upEv.pointerId); } catch (_) {}
        hueSlider.removeEventListener('pointermove', onMove);
        hueSlider.removeEventListener('pointerup', onUp);
        hueSlider.removeEventListener('pointercancel', onUp);
      };

      hueSlider.addEventListener('pointermove', onMove);
      hueSlider.addEventListener('pointerup', onUp);
      hueSlider.addEventListener('pointercancel', onUp);
    });

    // Conmutador de formato de color (HEX / RGB / HSL)
    const modeSwitchBtn = popover.querySelector('#tf-mode-switch-btn');
    if (modeSwitchBtn) {
      modeSwitchBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this._cycleColorMode();
      });
    }

    // Botón Copiar Código de Color
    const copyBtn = popover.querySelector('#tf-copy-color-btn');
    if (copyBtn) {
      copyBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this._copyCurrentColor();
      });
    }

    // Input manual Hex (#RRGGBB)
    const hexInput = popover.querySelector('#tf-hex-input');
    if (hexInput) {
      hexInput.addEventListener('focus', () => hexInput.select());
      hexInput.addEventListener('dblclick', (e) => {
        e.stopPropagation();
        hexInput.select();
      });
      const parseAndSetHex = () => {
        let val = hexInput.value.trim();
        if (!val.startsWith('#') && /^[0-9a-fA-F]{3,6}$/.test(val)) val = '#' + val;
        if (/^#[0-9a-fA-F]{3}$/.test(val)) {
          val = '#' + val[1] + val[1] + val[2] + val[2] + val[3] + val[3];
          this._setPickerFromHex(val);
        } else if (/^#[0-9a-fA-F]{6}$/.test(val)) {
          this._setPickerFromHex(val);
        }
      };
      hexInput.addEventListener('input', parseAndSetHex);
      hexInput.addEventListener('paste', () => setTimeout(parseAndSetHex, 10));
      hexInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.applyColor(this._pickerHex);
          this._toggleColorPopover(false);
        }
      });
    }

    // Inputs manuales RGB
    const rgbR = popover.querySelector('#tf-rgb-r');
    const rgbG = popover.querySelector('#tf-rgb-g');
    const rgbB = popover.querySelector('#tf-rgb-b');
    const updateFromRgbInputs = () => {
      const r = Math.max(0, Math.min(255, parseInt(rgbR?.value, 10) || 0));
      const g = Math.max(0, Math.min(255, parseInt(rgbG?.value, 10) || 0));
      const b = Math.max(0, Math.min(255, parseInt(rgbB?.value, 10) || 0));
      const hsv = rgbToHsv(r, g, b);
      this._updatePickerColor(hsv.h, hsv.s, hsv.v, 'rgb');
    };

    [rgbR, rgbG, rgbB].forEach(input => {
      if (!input) return;
      input.addEventListener('focus', () => input.select());
      input.addEventListener('dblclick', (e) => {
        e.stopPropagation();
        input.select();
      });
      input.addEventListener('input', updateFromRgbInputs);
      input.addEventListener('paste', () => {
        setTimeout(() => {
          const val = input.value;
          const match = val.match(/(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
          if (match) {
            if (rgbR) rgbR.value = match[1];
            if (rgbG) rgbG.value = match[2];
            if (rgbB) rgbB.value = match[3];
          }
          updateFromRgbInputs();
        }, 10);
      });
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.applyColor(this._pickerHex);
          this._toggleColorPopover(false);
        }
      });
    });

    // Inputs manuales HSL
    const hslH = popover.querySelector('#tf-hsl-h');
    const hslS = popover.querySelector('#tf-hsl-s');
    const hslL = popover.querySelector('#tf-hsl-l');
    const updateFromHslInputs = () => {
      const h = Math.max(0, Math.min(360, parseInt(hslH?.value, 10) || 0));
      const s = Math.max(0, Math.min(100, parseInt(hslS?.value, 10) || 0));
      const l = Math.max(0, Math.min(100, parseInt(hslL?.value, 10) || 0));
      const rgb = hslToRgb(h, s, l);
      const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
      this._updatePickerColor(hsv.h, hsv.s, hsv.v, 'hsl');
    };

    [hslH, hslS, hslL].forEach(input => {
      if (!input) return;
      input.addEventListener('focus', () => input.select());
      input.addEventListener('dblclick', (e) => {
        e.stopPropagation();
        input.select();
      });
      input.addEventListener('input', updateFromHslInputs);
      input.addEventListener('paste', () => {
        setTimeout(() => {
          const val = input.value;
          const match = val.match(/(\d+)\s*,\s*(\d+)%?\s*,\s*(\d+)%?/);
          if (match) {
            if (hslH) hslH.value = match[1];
            if (hslS) hslS.value = match[2];
            if (hslL) hslL.value = match[3];
          }
          updateFromHslInputs();
        }, 10);
      });
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.applyColor(this._pickerHex);
          this._toggleColorPopover(false);
        }
      });
    });

    // Swatches de selección rápida
    popover.querySelectorAll('.tf-color-swatch').forEach(swatch => {
      swatch.addEventListener('click', (e) => {
        e.preventDefault();
        const color = swatch.getAttribute('data-color');
        if (color) {
          this._setPickerFromHex(color);
          this.applyColor(color);
          this._toggleColorPopover(false);
        }
      });
    });

    // Botón Quitar Color
    const resetBtn = popover.querySelector('#tf-reset-color-btn');
    resetBtn.addEventListener('click', (e) => {
      e.preventDefault();
      this.removeColor();
      this._toggleColorPopover(false);
    });

    // Botón Aplicar Color
    const applyBtn = popover.querySelector('#tf-apply-color-btn');
    applyBtn.addEventListener('click', (e) => {
      e.preventDefault();
      this.applyColor(this._pickerHex);
      this._toggleColorPopover(false);
    });

    document.body.appendChild(bar);
    this.toolbarEl = bar;
  }

  /**
   * Escanea todos los <textarea class="form-textarea"> y los eleva a editores visuales enriquecidos
   */
  scanAndEnhance() {
    if (this._isScanning) return;
    this._isScanning = true;

    try {
      const textareas = document.querySelectorAll('textarea:not(.no-rich)');
      textareas.forEach(ta => {
        if (this._enhancedTextareas.has(ta) || ta.classList.contains('no-rich')) return;
        this._enhanceTextarea(ta);
      });
    } finally {
      this._isScanning = false;
    }
  }

  /**
   * Eleva un textarea individual a editor visual WYSIWYG
   */
  _enhanceTextarea(textarea) {
    if (!textarea || this._enhancedTextareas.has(textarea)) return;
    this._enhancedTextareas.add(textarea);

    const parent = textarea.parentNode;
    if (!parent) return;

    // Crear el editor div contenteditable
    const editor = document.createElement('div');
    editor.contentEditable = 'true';
    editor.spellcheck = false;

    // Copiar clases visuales de Tailwind / estilo
    editor.className = textarea.className;
    editor.classList.add('rich-text-editor');
    editor.classList.remove('form-textarea-auto', 'form-textarea-expanded');

    // Copiar atributos de accesibilidad y placeholder
    const placeholder = textarea.getAttribute('placeholder') || '';
    if (placeholder) {
      editor.setAttribute('data-placeholder', placeholder);
    }

    // Copiar dimensiones inline si existen
    if (textarea.style.minHeight) {
      editor.style.minHeight = textarea.style.minHeight;
    } else if (textarea.rows) {
      const computedMinH = Math.max(56, textarea.rows * 24 + 18);
      editor.style.minHeight = `${computedMinH}px`;
    }

    // Cargar contenido inicial formateado desde el textarea
    const initialRaw = textarea.value || '';
    editor.innerHTML = parseMarkdownToHtml(initialRaw);
    this._toggleEmptyState(editor);

    // Ocultar textarea nativo manteniendo presencia en DOM para Alpine bindings
    textarea.style.display = 'none';
    textarea.setAttribute('aria-hidden', 'true');
    textarea.dataset.hasRichCompanion = 'true';

    // Insertar el editor justo después del textarea en el DOM
    parent.insertBefore(editor, textarea.nextSibling);

    // Guardar referencias mutuas
    textarea._richEditor = editor;
    editor._companionTextarea = textarea;

    // ── Sincronización: Editor -> Textarea (Al escribir o formatear) ──
    let _syncDebounceTimer = null;
    const syncEditorToTextarea = (immediate = false) => {
      const doSync = () => {
        const markdown = serializeHtmlToMarkdown(editor);
        if (textarea.value !== markdown) {
          textarea.value = markdown;
          textarea.dispatchEvent(new Event('input', { bubbles: true }));
          textarea.dispatchEvent(new Event('change', { bubbles: true }));
        }
        this._toggleEmptyState(editor);
        window.Alpine?.store('characters')?.scheduleAutoSave?.();
      };

      if (immediate) {
        if (_syncDebounceTimer) {
          clearTimeout(_syncDebounceTimer);
          _syncDebounceTimer = null;
        }
        doSync();
      } else {
        if (_syncDebounceTimer) clearTimeout(_syncDebounceTimer);
        _syncDebounceTimer = setTimeout(() => {
          _syncDebounceTimer = null;
          doSync();
        }, 120);
      }
    };
    editor._flushSync = () => syncEditorToTextarea(true);

    editor.addEventListener('focus', () => {
      const text = (editor.textContent || '').replace(/\u200B/g, '').trim();
      if (!text) {
        editor.innerHTML = '';
        editor.classList.add('is-empty');
        const sel = window.getSelection();
        if (sel) {
          const range = document.createRange();
          range.selectNodeContents(editor);
          range.collapse(true);
          sel.removeAllRanges();
          sel.addRange(range);
        }
      }
    });

    editor.addEventListener('input', () => {
      this._checkInlineMarkdownConversion(editor);
      syncEditorToTextarea(false);
    });

    editor.addEventListener('blur', () => {
      const text = (editor.textContent || '').replace(/\u200B/g, '').trim();
      if (!text) {
        editor.innerHTML = '';
        editor.classList.add('is-empty');
      }
      syncEditorToTextarea(true);
    });

    // ── Sincronización: Textarea -> Editor (Cuando Alpine o scripts modifican el valor) ──
    // Intercepción del descriptor de propiedad `value` para captura instantánea y reactiva
    const originalValueDescriptor = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value');
    if (originalValueDescriptor && !textarea._isDescriptorHooked) {
      textarea._isDescriptorHooked = true;
      Object.defineProperty(textarea, 'value', {
        get() {
          return originalValueDescriptor.get.call(this);
        },
        set(newVal) {
          originalValueDescriptor.set.call(this, newVal);
          if (editor && document.activeElement !== editor) {
            const currentMd = serializeHtmlToMarkdown(editor);
            if (currentMd !== (newVal || '')) {
              const formatted = parseMarkdownToHtml(newVal || '');
              if (editor.innerHTML !== formatted) {
                editor.innerHTML = formatted;
                TextFormatterEngine.prototype._toggleEmptyState(editor);
              }
            }
          }
        }
      });
    }
  }

  _toggleEmptyState(editor) {
    if (!editor) return;
    const text = (editor.textContent || '').replace(/\u200B/g, '').trim();
    if (!text) {
      editor.classList.add('is-empty');
    } else {
      editor.classList.remove('is-empty');
    }
  }

  /**
   * Sincroniza todos los editores enriquecidos con los valores actuales de sus textareas
   */
  syncAllEditorsFromTextareas() {
    const textareas = document.querySelectorAll('textarea:not(.no-rich)');
    textareas.forEach(ta => {
      const editor = ta._richEditor;
      if (editor && document.activeElement !== editor) {
        const val = ta.value || '';
        const currentMd = serializeHtmlToMarkdown(editor);
        if (currentMd !== val) {
          const parsed = parseMarkdownToHtml(val);
          if (editor.innerHTML !== parsed) {
            editor.innerHTML = parsed;
            this._toggleEmptyState(editor);
          }
        }
      }
    });
  }

  /**
   * Auto-detección mientras se escribe: Si el usuario teclea **palabra** o *palabra*,
   * se transforma en tiempo real a negrita/cursiva visual como en Discord.
   */
  _checkInlineMarkdownConversion(editor) {
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount || !sel.isCollapsed) return;

    const node = sel.anchorNode;
    if (!node || node.nodeType !== Node.TEXT_NODE) return;

    const text = node.textContent;
    const offset = sel.anchorOffset;

    // Reglas de auto-conversión al cerrar con delimitador
    const patterns = [
      { regex: /\*\*([^\*]+?)\*\*$/, tag: 'strong' },
      { regex: /__([^_]+?)__$/, tag: 'u' },
      { regex: /~~([^~]+?)~~$/, tag: 's' }
    ];

    const textBeforeCaret = text.substring(0, offset);

    // Auto-conversión directa de emoticonos :shortcode: al escribir el segundo ':'
    const emojiMatch = textBeforeCaret.match(/:([a-zA-Z0-9_\-]{2,32}):$/);
    if (emojiMatch) {
      const code = emojiMatch[1];
      const emoji = window.Alpine?.store('customEmojis')?.getEmojiByShortcode(code);
      if (emoji && emoji.url) {
        const matchedStr = emojiMatch[0];
        const startIdx = offset - matchedStr.length;
        const before = text.substring(0, startIdx);
        const after = text.substring(offset);

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

        const newRange = document.createRange();
        newRange.setStart(textAfterNode, 2);
        newRange.collapse(true);
        sel.removeAllRanges();
        sel.addRange(newRange);
        return;
      }
    }

    for (const p of patterns) {
      const match = textBeforeCaret.match(p.regex);
      if (match) {
        const matchedStr = match[0];
        const innerText = match[1];
        const startIdx = offset - matchedStr.length;

        const before = text.substring(0, startIdx);
        const after = text.substring(offset);

        // Crear fragmento enriquecido
        const parent = node.parentNode;
        const styledEl = document.createElement(p.tag);
        styledEl.textContent = innerText;

        const textBeforeNode = document.createTextNode(before);
        const textAfterNode = document.createTextNode('\u200B' + after); // zero-width space para situar el cursor

        parent.insertBefore(textBeforeNode, node);
        parent.insertBefore(styledEl, node);
        parent.insertBefore(textAfterNode, node);
        parent.removeChild(node);

        // Posicionar el cursor justo después del elemento estilizado
        const newRange = document.createRange();
        newRange.setStart(textAfterNode, 1);
        newRange.collapse(true);
        sel.removeAllRanges();
        sel.addRange(newRange);
        break;
      }
    }
  }

  parseMarkdownToHtml(text) {
    return parseMarkdownToHtml(text);
  }

  serializeHtmlToMarkdown(source) {
    return serializeHtmlToMarkdown(source);
  }

  /**
   * Sincroniza todos los editores enriquecidos a sus textareas compañeras
   */
  syncAllEditorsToTextareas() {
    const editors = document.querySelectorAll('.rich-text-editor');
    let anyChanged = false;
    editors.forEach(editor => {
      if (editor && editor._companionTextarea) {
        const md = serializeHtmlToMarkdown(editor);
        if (editor._companionTextarea.value !== md) {
          editor._companionTextarea.value = md;
          editor._companionTextarea.dispatchEvent(new Event('input', { bubbles: true }));
          editor._companionTextarea.dispatchEvent(new Event('change', { bubbles: true }));
          anyChanged = true;
        }
        this._toggleEmptyState(editor);
      }
    });
    if (anyChanged) {
      window.Alpine?.store('characters')?.scheduleAutoSave?.();
    }
  }

  /**
   * Sincroniza el editor actualmente activo o enfocado antes de cambiar de pestaña o guardar
   */
  syncActiveEditor() {
    this.syncAllEditorsToTextareas();
  }

  /**
   * Renderizado y formateo automático de elementos en Modo Lectura / Vista Previa (.read-value)
   * Diseñado de manera no destructiva: jamás sobrescribe elementos que ya posean nodos DOM enriquecidos.
   */
  formatPreviewElements() {
    const readElements = document.querySelectorAll('.read-value:not(.rich-formatted), .read-card p:not(.read-label):not(.rich-formatted)');
    readElements.forEach(el => {
      // Marcar de inmediato para evitar re-procesamiento redundante
      el.classList.add('rich-formatted');

      // Ignorar elementos de control, badges o títulos no descriptivos
      if (el.classList.contains('no-rich-preview') || el.closest('button') || el.closest('nav')) return;

      // Si el elemento o un contenedor ya tiene directiva x-html, Alpine gestiona el HTML directamente
      if (el.hasAttribute('x-html') || el.closest('[x-html]')) return;

      // Si ya tiene elementos HTML hijos (spans de color, negrita, etc.), ya está formateado.
      if (el.children.length > 0) return;

      const raw = el.textContent || '';
      // Si contiene sintaxis Markdown (** o * o __ o ~~) O etiquetas de color
      if (/(\*\*|__|\*|~~|<span|<font)/i.test(raw)) {
        el.innerHTML = parseMarkdownToHtml(raw);
      }
    });
  }

  // ── Gestión de Selección y Barra Flotante ──────────────────────────
  _saveCurrentSelection() {
    const sel = window.getSelection();
    if (sel && sel.rangeCount && !sel.isCollapsed) {
      this.savedRange = sel.getRangeAt(0).cloneRange();
      const container = this.savedRange.commonAncestorContainer;
      const el = container.nodeType === Node.ELEMENT_NODE ? container : container.parentElement;
      this.savedEditor = el ? el.closest('.rich-text-editor') : null;
    }
    const active = document.activeElement;
    if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) {
      if (this.toolbarEl && this.toolbarEl.contains(active)) return;
      this.savedActiveInput = active;
      this.savedSelectionStart = active.selectionStart;
      this.savedSelectionEnd = active.selectionEnd;
    }
  }

  _updateColorDot(hex) {
    const dot = this.toolbarEl?.querySelector('#tf-color-dot');
    if (dot) {
      dot.style.backgroundColor = hex;
      dot.style.borderColor = hex.toLowerCase() === '#ffffff' ? 'rgba(0,0,0,0.5)' : hex;
      dot.style.boxShadow = hex.toLowerCase() === '#ffffff' 
        ? '0 0 8px rgba(255,255,255,0.7)' 
        : `0 0 10px ${hex}`;
    }
  }

  _updatePickerColor(h, s, v, source = 'all') {
    this._pickerH = Math.max(0, Math.min(359, Math.round(h)));
    this._pickerS = Math.max(0, Math.min(100, Math.round(s)));
    this._pickerV = Math.max(0, Math.min(100, Math.round(v)));

    const rgb = hsvToRgb(this._pickerH, this._pickerS, this._pickerV);
    const hex = rgbValuesToHex(rgb.r, rgb.g, rgb.b);
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    this._pickerHex = hex;

    const popover = this.toolbarEl?.querySelector('#tf-color-popover');
    if (!popover) return;

    // Actualizar fondo del SV box según Hue
    const svBox = popover.querySelector('#tf-sv-box');
    if (svBox) {
      svBox.style.backgroundColor = `hsl(${this._pickerH}, 100%, 50%)`;
    }

    // Actualizar posición de la mirilla SV
    const svHandle = popover.querySelector('#tf-sv-handle');
    if (svHandle) {
      svHandle.style.left = `${this._pickerS}%`;
      svHandle.style.top = `${100 - this._pickerV}%`;
    }

    // Actualizar posición del deslizador de Hue
    const hueHandle = popover.querySelector('#tf-hue-handle');
    if (hueHandle) {
      hueHandle.style.left = `${(this._pickerH / 360) * 100}%`;
    }
    const hueVal = popover.querySelector('#tf-hue-val');
    if (hueVal) {
      hueVal.textContent = `${this._pickerH}°`;
    }

    // Actualizar previsualización de color
    const preview = popover.querySelector('#tf-picker-preview');
    if (preview) {
      preview.style.backgroundColor = hex;
    }

    // Actualizar input HEX si no se está editando activamente
    if (source !== 'hex') {
      const hexInput = popover.querySelector('#tf-hex-input');
      if (hexInput) hexInput.value = hex.toUpperCase();
    }

    // Actualizar inputs RGB si no se están editando activamente
    if (source !== 'rgb') {
      const rgbR = popover.querySelector('#tf-rgb-r');
      const rgbG = popover.querySelector('#tf-rgb-g');
      const rgbB = popover.querySelector('#tf-rgb-b');
      if (rgbR) rgbR.value = rgb.r;
      if (rgbG) rgbG.value = rgb.g;
      if (rgbB) rgbB.value = rgb.b;
    }

    // Actualizar inputs HSL si no se están editando activamente
    if (source !== 'hsl') {
      const hslH = popover.querySelector('#tf-hsl-h');
      const hslS = popover.querySelector('#tf-hsl-s');
      const hslL = popover.querySelector('#tf-hsl-l');
      if (hslH) hslH.value = hsl.h;
      if (hslS) hslS.value = hsl.s;
      if (hslL) hslL.value = hsl.l;
    }
  }

  _setColorMode(mode) {
    this._colorMode = mode;
    const popover = this.toolbarEl?.querySelector('#tf-color-popover');
    if (!popover) return;

    const hexContainer = popover.querySelector('#tf-mode-hex');
    const rgbContainer = popover.querySelector('#tf-mode-rgb');
    const hslContainer = popover.querySelector('#tf-mode-hsl');

    if (hexContainer) {
      hexContainer.classList.toggle('hidden', mode !== 'hex');
      hexContainer.classList.toggle('flex', mode === 'hex');
    }
    if (rgbContainer) {
      rgbContainer.classList.toggle('hidden', mode !== 'rgb');
      rgbContainer.classList.toggle('flex', mode === 'rgb');
    }
    if (hslContainer) {
      hslContainer.classList.toggle('hidden', mode !== 'hsl');
      hslContainer.classList.toggle('flex', mode === 'hsl');
    }
  }

  _cycleColorMode() {
    const modes = ['hex', 'rgb', 'hsl'];
    const nextIdx = (modes.indexOf(this._colorMode || 'hex') + 1) % modes.length;
    this._setColorMode(modes[nextIdx]);
  }

  _setPickerFromHex(hex) {
    if (!hex) return;
    const cleanHex = rgbToHex(hex);
    const hsv = hexToHsv(cleanHex);
    this._updatePickerColor(hsv.h, hsv.s, hsv.v, 'hex');
    const hexInput = this.toolbarEl?.querySelector('#tf-hex-input');
    if (hexInput) {
      hexInput.value = cleanHex.toUpperCase();
    }
  }

  _toggleColorPopover(forceState) {
    const popover = this.toolbarEl?.querySelector('#tf-color-popover');
    if (!popover) return;

    const isOpen = popover.style.display !== 'none' && !popover.classList.contains('opacity-0');
    const shouldOpen = typeof forceState === 'boolean' ? forceState : !isOpen;

    if (shouldOpen) {
      this._saveCurrentSelection();

      // Sincronizar el selector con el color de la selección actual
      let currentColor = '#ffffff';
      if (this.savedRange) {
        const container = this.savedRange.commonAncestorContainer;
        const el = container.nodeType === Node.ELEMENT_NODE ? container : container.parentElement;
        const coloredParent = el ? el.closest('[style*="color"]') : null;
        if (coloredParent && coloredParent.style.color) {
          currentColor = rgbToHex(coloredParent.style.color);
        }
      }
      this._setPickerFromHex(currentColor);
      this._setColorMode(this._colorMode || 'hex');

      // Comprobar espacio vertical para abrir arriba o abajo (el popover mide ~310px)
      const barRect = this.toolbarEl.getBoundingClientRect();
      const popoverHeight = 310;
      if (barRect.bottom + popoverHeight > window.innerHeight && barRect.top > popoverHeight) {
        popover.classList.remove('top-full', 'mt-2');
        popover.classList.add('bottom-full', 'mb-2');
      } else {
        popover.classList.remove('bottom-full', 'mb-2');
        popover.classList.add('top-full', 'mt-2');
      }

      // Evitar que se desborde horizontalmente de la pantalla
      if (barRect.left < 140) {
        popover.style.left = '0px';
        popover.style.right = 'auto';
      } else if (barRect.right > window.innerWidth - 140) {
        popover.style.left = 'auto';
        popover.style.right = '0px';
      } else {
        popover.style.left = 'auto';
        popover.style.right = '-20px';
      }

      popover.style.display = 'flex';
      requestAnimationFrame(() => {
        popover.classList.remove('opacity-0', 'scale-95', 'pointer-events-none');
        popover.classList.add('opacity-100', 'scale-100', 'pointer-events-auto');
      });
      this._isColorPopoverOpen = true;
    } else {
      popover.classList.remove('opacity-100', 'scale-100', 'pointer-events-auto');
      popover.classList.add('opacity-0', 'scale-95', 'pointer-events-none');
      setTimeout(() => {
        if (!this._isColorPopoverOpen) {
          popover.style.display = 'none';
        }
      }, 150);
      this._isColorPopoverOpen = false;
    }
  }

  /**
   * Copia el código del color actual al portapapeles según el modo activo (HEX, RGB o HSL)
   */
  _copyCurrentColor() {
    let textToCopy = this._pickerHex.toUpperCase();
    const rgb = hsvToRgb(this._pickerH, this._pickerS, this._pickerV);
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

    if (this._colorMode === 'rgb') {
      textToCopy = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
    } else if (this._colorMode === 'hsl') {
      textToCopy = `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(textToCopy).catch(() => {});
    } else {
      const ta = document.createElement('textarea');
      ta.value = textToCopy;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); } catch (_) {}
      document.body.removeChild(ta);
    }

    // Feedback visual en el botón de copiar
    const copyBtn = this.toolbarEl?.querySelector('#tf-copy-color-btn');
    if (copyBtn) {
      const originalHtml = copyBtn.innerHTML;
      copyBtn.innerHTML = `
        <svg class="w-3.5 h-3.5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      `;
      copyBtn.classList.add('border-emerald-500/50', 'bg-emerald-500/10');
      setTimeout(() => {
        if (copyBtn) {
          copyBtn.innerHTML = originalHtml;
          copyBtn.classList.remove('border-emerald-500/50', 'bg-emerald-500/10');
        }
      }, 1500);
    }
  }

  /**
   * Elimina cualquier color aplicado a la selección actual y restablece el estilo original
   */
  removeColor() {
    let sel = window.getSelection();
    let editor = this.activeEditor || (sel && sel.anchorNode && sel.anchorNode.parentElement?.closest('.rich-text-editor')) || this.savedEditor;

    if (editor) {
      editor.focus();
      if (this.savedRange && (!sel || sel.isCollapsed || !sel.rangeCount)) {
        sel.removeAllRanges();
        sel.addRange(this.savedRange);
      }
      sel = window.getSelection();
      if (sel && sel.rangeCount && !sel.isCollapsed) {
        const range = sel.getRangeAt(0);
        const container = range.commonAncestorContainer;
        const root = container.nodeType === Node.ELEMENT_NODE ? container : container.parentElement;

        // Limpiar color en ancestros coloreados si están contenidos dentro del editor
        let current = root;
        while (current && current !== editor) {
          if (current.style && current.style.color) {
            current.style.color = '';
            if (current.tagName === 'SPAN' && !current.getAttribute('style') && !current.className) {
              const parent = current.parentNode;
              if (parent) {
                while (current.firstChild) {
                  parent.insertBefore(current.firstChild, current);
                }
                parent.removeChild(current);
              }
            }
          }
          current = current.parentElement;
        }

        // Limpiar color en elementos descendientes dentro de la selección
        if (root) {
          const coloredDescendants = root.querySelectorAll('[style*="color"], font[color]');
          coloredDescendants.forEach(el => {
            if (sel.containsNode(el, true)) {
              el.style.color = '';
              if (el.tagName === 'FONT') {
                el.removeAttribute('color');
              }
              if (el.tagName === 'SPAN' && !el.getAttribute('style') && !el.className) {
                const parent = el.parentNode;
                if (parent) {
                  while (el.firstChild) {
                    parent.insertBefore(el.firstChild, el);
                  }
                  parent.removeChild(el);
                }
              }
            }
          });
        }

        this._updateColorDot('#ffffff');

        // Sincronizar inmediatamente al textarea compañero
        if (editor._companionTextarea) {
          const md = serializeHtmlToMarkdown(editor);
          editor._companionTextarea.value = md;
          editor._companionTextarea.dispatchEvent(new Event('input', { bubbles: true }));
          editor._companionTextarea.dispatchEvent(new Event('change', { bubbles: true }));
          window.Alpine?.store('characters')?.scheduleAutoSave?.();
        }
        this._toggleEmptyState(editor);
        return;
      }
    }

    // Input tradicional fallback
    const el = this.activeInput || this.savedActiveInput;
    if (el) {
      const start = typeof el.selectionStart === 'number' ? el.selectionStart : this.savedSelectionStart;
      const end = typeof el.selectionEnd === 'number' ? el.selectionEnd : this.savedSelectionEnd;
      if (typeof start !== 'number' || typeof end !== 'number' || start === end) return;

      const val = el.value || '';
      const selected = val.substring(start, end);
      const unwrapped = selected.replace(/<span\s+style="color:[^"]*">([\s\S]*?)<\/span>/gi, '$1');
      const newVal = val.substring(0, start) + unwrapped + val.substring(end);
      el.value = newVal;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
      window.Alpine?.store('characters')?.scheduleAutoSave?.();
      el.focus();
      el.setSelectionRange(start, start + unwrapped.length);
      this._updateColorDot('#ffffff');
    }
  }

  _onSelectionChange() {
    if (this._selectionRafId) cancelAnimationFrame(this._selectionRafId);
    this._selectionRafId = requestAnimationFrame(() => {
      this._selectionRafId = null;
      this._handleSelectionChange();
    });
  }

  _handleSelectionChange() {
    // Si el usuario está interactuando con la propia barra o popover de color, no intervenir
    const activeDocEl = document.activeElement;
    if (this.toolbarEl && activeDocEl && this.toolbarEl.contains(activeDocEl)) {
      return;
    }
    // Si el popover de color está abierto, el usuario está manipulando o copiando colores; no cerrar
    if (this._isColorPopoverOpen) {
      return;
    }

    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.rangeCount) {
      if (this.isVisible) this.hide();
      return;
    }

    const range = sel.getRangeAt(0);
    const container = range.commonAncestorContainer;
    const el = container.nodeType === Node.ELEMENT_NODE ? container : container.parentElement;

    // Detectar color actual si está dentro de un elemento con color
    const coloredParent = el ? el.closest('[style*="color"]') : null;
    if (coloredParent && coloredParent.style.color) {
      const currentHex = rgbToHex(coloredParent.style.color);
      this._updateColorDot(currentHex);
    } else {
      this._updateColorDot('#ffffff');
    }

    // Caso A: Selección dentro de un editor enriquecido
    const richEditor = el ? el.closest('.rich-text-editor') : null;
    if (richEditor) {
      this.activeEditor = richEditor;
      this.activeInput = null;
      this._saveCurrentSelection();
      this._updatePositionFromRange(range);
      return;
    }

    // Caso B: Selección dentro de un input estándar (fallback)
    if (activeDocEl && (activeDocEl.tagName === 'INPUT' || activeDocEl.tagName === 'TEXTAREA')) {
      if (this.toolbarEl && this.toolbarEl.contains(activeDocEl)) return;
      const start = activeDocEl.selectionStart;
      const end = activeDocEl.selectionEnd;
      if (typeof start === 'number' && typeof end === 'number' && start !== end) {
        this.activeEditor = null;
        this.activeInput = activeDocEl;
        this._saveCurrentSelection();
        this._updatePositionFromInput(activeDocEl, start, end);
        return;
      }
    }

    if (this.isVisible) this.hide();
  }

  _updatePositionFromRange(range) {
    if (!this.toolbarEl) return;
    const rect = range.getBoundingClientRect();
    if (!rect || (rect.width === 0 && rect.height === 0)) {
      this.hide();
      return;
    }

    if (rect.bottom < 10 || rect.top > window.innerHeight - 10) {
      this.hide();
      return;
    }

    const toolbarWidth = 192;
    const toolbarHeight = 36;

    let posX = rect.left + (rect.width / 2) - (toolbarWidth / 2);
    let posY = rect.top - toolbarHeight - 8;

    if (posY < 10) {
      posY = rect.bottom + 8;
    }

    posX = Math.max(10, Math.min(posX, window.innerWidth - toolbarWidth - 10));

    this.toolbarEl.style.visibility = 'visible';
    this.toolbarEl.style.left = `${Math.round(posX)}px`;
    this.toolbarEl.style.top = `${Math.round(posY)}px`;

    this.toolbarEl.classList.remove('opacity-0', 'scale-95', 'pointer-events-none');
    this.toolbarEl.classList.add('opacity-100', 'scale-100', 'pointer-events-auto');
    this.isVisible = true;
  }

  _updatePositionFromInput(input, start, end) {
    if (!this.toolbarEl) return;
    const rect = input.getBoundingClientRect();
    if (!rect || (rect.width === 0 && rect.height === 0)) {
      this.hide();
      return;
    }
    if (rect.bottom < 10 || rect.top > window.innerHeight - 10) {
      this.hide();
      return;
    }
    const toolbarWidth = 192;
    const toolbarHeight = 36;

    let posX = rect.left + (rect.width / 2) - (toolbarWidth / 2);
    let posY = rect.top - toolbarHeight - 8;

    if (posY < 10) {
      posY = rect.bottom + 8;
    }

    posX = Math.max(10, Math.min(posX, window.innerWidth - toolbarWidth - 10));

    this.toolbarEl.style.visibility = 'visible';
    this.toolbarEl.style.left = `${Math.round(posX)}px`;
    this.toolbarEl.style.top = `${Math.round(posY)}px`;

    this.toolbarEl.classList.remove('opacity-0', 'scale-95', 'pointer-events-none');
    this.toolbarEl.classList.add('opacity-100', 'scale-100', 'pointer-events-auto');
    this.isVisible = true;
  }

  hide() {
    if (!this.toolbarEl || !this.isVisible) return;
    this._toggleColorPopover(false);
    this.toolbarEl.classList.remove('opacity-100', 'scale-100', 'pointer-events-auto');
    this.toolbarEl.classList.add('opacity-0', 'scale-95', 'pointer-events-none');
    this.toolbarEl.style.visibility = 'hidden';
    this.toolbarEl.style.top = '-9999px';
    this.toolbarEl.style.left = '-9999px';
    this.isVisible = false;
  }

  _onScroll(e) {
    if (!this.isVisible) return;
    const popover = this.toolbarEl?.querySelector('#tf-color-popover');
    if (popover && e?.target && popover.contains(e.target)) return;
    this.hide();
  }

  _onWindowClick(e) {
    if (!this.isVisible) return;
    const popover = this.toolbarEl?.querySelector('#tf-color-popover');
    if (popover && popover.contains(e.target)) return;
    if (this.toolbarEl && this.toolbarEl.contains(e.target)) return;
    if (this.activeEditor && this.activeEditor.contains(e.target)) return;
    if (this.activeInput && this.activeInput === e.target) return;
    this.hide();
  }

  _onKeyDown(e) {
    if (e.key === 'Escape' && this.isVisible) {
      if (this._isColorPopoverOpen) {
        this._toggleColorPopover(false);
        return;
      }
      this.hide();
      return;
    }

    // Atajos de teclado: Ctrl+B, Ctrl+I, Ctrl+U, Ctrl+Shift+S
    if (e.ctrlKey || e.metaKey) {
      const key = e.key.toLowerCase();
      let format = null;

      if (key === 'b') format = 'bold';
      else if (key === 'i') format = 'italic';
      else if (key === 'u') format = 'underline';
      else if (e.shiftKey && (key === 's' || key === 'x')) format = 'strikethrough';

      if (format) {
        const active = document.activeElement;
        const isRich = active && active.classList.contains('rich-text-editor');
        const isInput = active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA');

        if (isRich || isInput) {
          e.preventDefault();
          this.applyFormat(format);
        }
      }
    }
  }

  /**
   * Aplica o remueve formato directamente de forma visual (sin asteriscos)
   * @param {'bold'|'italic'|'underline'|'strikethrough'} formatType
   */
  applyFormat(formatType) {
    const sel = window.getSelection();

    // 1. Si el foco está en un editor enriquecido: ejecutar comando visual nativo
    if (this.activeEditor || (sel && sel.anchorNode && sel.anchorNode.parentElement?.closest('.rich-text-editor'))) {
      const editor = this.activeEditor || sel.anchorNode.parentElement.closest('.rich-text-editor');
      editor.focus();

      let cmd = 'bold';
      if (formatType === 'italic') cmd = 'italic';
      else if (formatType === 'underline') cmd = 'underline';
      else if (formatType === 'strikethrough') cmd = 'strikeThrough';

      document.execCommand(cmd, false, null);

      // Sincronizar inmediatamente al textarea compañero
      if (editor._companionTextarea) {
        const md = serializeHtmlToMarkdown(editor);
        editor._companionTextarea.value = md;
        editor._companionTextarea.dispatchEvent(new Event('input', { bubbles: true }));
        editor._companionTextarea.dispatchEvent(new Event('change', { bubbles: true }));
        window.Alpine?.store('characters')?.scheduleAutoSave?.();
      }
      this._toggleEmptyState(editor);

      // Reubicar barra flotante sobre la nueva selección
      setTimeout(() => {
        if (sel && sel.rangeCount && !sel.isCollapsed) {
          this._updatePositionFromRange(sel.getRangeAt(0));
        }
      }, 15);
      return;
    }

    // 2. Si el foco está en un input tradicional (fallback)
    if (this.activeInput) {
      const el = this.activeInput;
      const start = el.selectionStart;
      const end = el.selectionEnd;
      if (typeof start !== 'number' || typeof end !== 'number' || start === end) return;

      const val = el.value || '';
      const selected = val.substring(start, end);
      let delimiter = '**';
      if (formatType === 'italic') delimiter = '*';
      else if (formatType === 'underline') delimiter = '__';
      else if (formatType === 'strikethrough') delimiter = '~~';

      const dLen = delimiter.length;
      let newVal = '';
      let newStart = start;
      let newEnd = end;

      if (selected.startsWith(delimiter) && selected.endsWith(delimiter) && selected.length >= dLen * 2) {
        const unwrapped = selected.substring(dLen, selected.length - dLen);
        newVal = val.substring(0, start) + unwrapped + val.substring(end);
        newStart = start;
        newEnd = start + unwrapped.length;
      } else {
        const formatted = `${delimiter}${selected}${delimiter}`;
        newVal = val.substring(0, start) + formatted + val.substring(end);
        newStart = start;
        newEnd = start + formatted.length;
      }

      el.value = newVal;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
      window.Alpine?.store('characters')?.scheduleAutoSave?.();
      el.focus();
      el.setSelectionRange(newStart, newEnd);
    }
  }

  /**
   * Aplica un color de texto visual al rango seleccionado (enriquecido con span style="color: ...")
   * @param {string} color Código de color hexadecimal o rgb
   */
  applyColor(color) {
    if (!color) return;
    const hex = rgbToHex(color.trim());

    // 1. Restaurar selección previa si la selección colapsó (ej. al interactuar con el color picker)
    let sel = window.getSelection();
    let editor = this.activeEditor || (sel && sel.anchorNode && sel.anchorNode.parentElement?.closest('.rich-text-editor')) || this.savedEditor;

    if (editor) {
      editor.focus();

      if (this.savedRange && (!sel || sel.isCollapsed || !sel.rangeCount)) {
        sel.removeAllRanges();
        sel.addRange(this.savedRange);
      }

      sel = window.getSelection();
      if (sel && sel.rangeCount && !sel.isCollapsed) {
        try {
          document.execCommand('styleWithCSS', false, true);
        } catch (e) {}

        document.execCommand('foreColor', false, hex);

        // Actualizar la bolita en la barra con el color activo
        this._updateColorDot(hex);

        // Sincronizar inmediatamente al textarea compañero
        if (editor._companionTextarea) {
          const md = serializeHtmlToMarkdown(editor);
          editor._companionTextarea.value = md;
          editor._companionTextarea.dispatchEvent(new Event('input', { bubbles: true }));
          editor._companionTextarea.dispatchEvent(new Event('change', { bubbles: true }));
          window.Alpine?.store('characters')?.scheduleAutoSave?.();
        }
        this._toggleEmptyState(editor);

        // Actualizar rango guardado y reubicar barra flotante
        setTimeout(() => {
          const currentSel = window.getSelection();
          if (currentSel && currentSel.rangeCount && !currentSel.isCollapsed) {
            this.savedRange = currentSel.getRangeAt(0).cloneRange();
            this._updatePositionFromRange(this.savedRange);
          }
        }, 20);
        return;
      }
    }

    // 2. Si el foco está en un input tradicional (fallback)
    const el = this.activeInput || this.savedActiveInput;
    if (el) {
      const start = typeof el.selectionStart === 'number' ? el.selectionStart : this.savedSelectionStart;
      const end = typeof el.selectionEnd === 'number' ? el.selectionEnd : this.savedSelectionEnd;
      if (typeof start !== 'number' || typeof end !== 'number' || start === end) return;

      const val = el.value || '';
      const selected = val.substring(start, end);
      const formatted = `<span style="color: ${hex};">${selected}</span>`;
      const newVal = val.substring(0, start) + formatted + val.substring(end);

      el.value = newVal;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
      window.Alpine?.store('characters')?.scheduleAutoSave?.();
      el.focus();
      el.setSelectionRange(start, start + formatted.length);
      this._updateColorDot(hex);
    }
  }
}

export const globalTextFormatter = new TextFormatterEngine();
