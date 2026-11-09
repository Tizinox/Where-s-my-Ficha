/**
 * store/devConsole.js
 * Alpine.store('devConsole') — Consola de Comandos y Diagnóstico en Tiempo Real.
 * Sistema interactivo con CLI, atajos de gestión de ficha,
 * monitor de eventos en vivo con deduplicación de logs, auto-completado y exportación.
 */

import { ls } from '../utils/storage.js';

const STORAGE_KEY = 'superficha_dev_logs_session';

export const AVAILABLE_COMMANDS = [
  // ── Ficha y Roster ──
  { cmd: 'char', desc: 'Muestra información y estado de la ficha activa', params: '', category: 'sheet' },
  { cmd: 'select', desc: 'Busca y selecciona un personaje del roster por su nombre', params: '<nombre>', category: 'sheet' },
  { cmd: 'rename', desc: 'Renombra el personaje activo al instante', params: '<nuevo nombre>', category: 'sheet' },
  { cmd: 'clone', desc: 'Duplica el personaje activo creando una copia en el roster', params: '', category: 'sheet' },
  { cmd: 'lock', desc: 'Alterna el bloqueo contra ediciones accidentales de la ficha', params: '', category: 'sheet' },
  { cmd: 'fav', desc: 'Alterna si la ficha activa está marcada como Favorita ★', params: '', category: 'sheet' },
  { cmd: 'tab', desc: 'Salta a una pestaña (basics, body, mind, social, skills, weapons, etc.)', params: '<pestaña>', category: 'sheet' },
  { cmd: 'quote', desc: 'Añade una cita memorable a la ficha activa al instante', params: '<"texto">', category: 'sheet' },

  // ── Herramientas y Productividad ──
  { cmd: 'backup', desc: 'Descarga inmediatamente una copia completa del roster (.json)', params: '', category: 'tools' },
  { cmd: 'export', desc: 'Exporta la ficha actual a JSON o abre el generador de imagen HD', params: '[json|img]', category: 'tools' },
  { cmd: 'preview', desc: 'Alterna el modo vista previa limpia (oculta controles de edición)', params: '', category: 'tools' },
  { cmd: 'discord', desc: 'Abre la estación de formato y exportación para Discord', params: '', category: 'tools' },
  { cmd: 'theme', desc: 'Cambia color de acento (#hex) o abre el Diseñador de Temas', params: '[#hex]', category: 'tools' },
  { cmd: 'save', desc: 'Fuerza el guardado y sincronización inmediata en IndexedDB', params: '', category: 'tools' },
  { cmd: 'storage', desc: 'Diagnóstico del almacenamiento local, personajes y espacio en disco', params: '', category: 'tools' },
  { cmd: 'fullscreen', desc: 'Alterna pantalla completa para la aplicación', params: '', category: 'tools' },

  // ── Sistema y Diagnóstico ──
  { cmd: 'help', desc: 'Muestra la guía completa de comandos organizada por categorías', params: '[sheet|tools|sys]', category: 'system' },
  { cmd: 'clear', desc: 'Limpia el historial de registros y comandos de la sesión', params: '', category: 'system' },
  { cmd: 'stats', desc: 'Diagnóstico del sistema (personajes, IDB, memoria)', params: '', category: 'system' },
  { cmd: 'copy', desc: 'Copia los registros completos al portapapeles', params: '', category: 'system' },
  { cmd: 'filter', desc: 'Filtra logs rápidamente por severidad', params: '<all|info|warn|error>', category: 'system' },
  { cmd: 'autoscroll', desc: 'Activa o desactiva el desplazamiento automático', params: '<on|off>', category: 'system' },
  { cmd: 'pause', desc: 'Alterna la pausa de la transmisión de eventos en vivo', params: '', category: 'system' },
  { cmd: 'reset-pos', desc: 'Restablece la ventana a su posición inicial', params: '', category: 'system' },
  { cmd: 'ping', desc: 'Prueba de latencia y ciclo reactivo del sistema', params: '', category: 'system' },
  { cmd: 'skeleton', desc: 'Simula el estado de carga Skeleton en vivo (3.5 seg)', params: '', category: 'system' },
  { cmd: 'favicon', desc: 'Estado del motor de favicons y Easter Egg', params: '', category: 'system' }
];

/**
 * Escapa caracteres HTML para prevenir inyecciones al renderizar resaltados.
 */
function escapeHtml(str) {
  if (typeof str !== 'string') return String(str || '');
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Formatea cualquier argumento de consola para extraer texto y stack trace completo.
 */
function formatLogArg(arg) {
  if (arg === null) return 'null';
  if (arg === undefined) return 'undefined';
  if (arg instanceof Error) {
    return arg.stack || `${arg.name}: ${arg.message}`;
  }
  if (typeof arg === 'object') {
    if (arg.stack || arg.message) {
      return arg.stack || `${arg.name || 'Error'}: ${arg.message}`;
    }
    try {
      return JSON.stringify(arg, null, 2);
    } catch {
      return String(arg);
    }
  }
  return String(arg);
}

/**
 * Traduce mensajes técnicos internos a un lenguaje humano claro y comprensible.
 */
function translateToHumanReadable(rawMsg, level) {
  if (['PROMPT', 'EASTER_EGG', 'CMD_OUTPUT', 'CMD_SUCCESS'].includes(level)) {
    return String(rawMsg);
  }

  let text = '';
  if (rawMsg instanceof Error) {
    text = rawMsg.message || 'Se produjo un error en una operación.';
  } else if (typeof rawMsg !== 'string') {
    text = formatLogArg(rawMsg);
  } else {
    text = rawMsg;
  }

  let clean = text
    .replace(/[a-zA-Z]:\\[^:\s\n"]+\\?/g, '[archivo local]')
    .replace(/file:\/\/\/[^\s\n"]+/g, '[recurso local]')
    .replace(/TacticalRosterDB|keyval-store|idb-keyval/gi, 'almacenamiento local');

  if (clean.includes('Dev HUD Console') || clean.includes('inicializada') || clean.includes('Consola de diagnóstico') || clean.includes('Consola lista')) {
    return 'Consola lista y registrando eventos del sistema.';
  }
  if (clean.includes('Almacenamiento local verificado') || clean.includes('Migración omitida') || clean.includes('almacenamiento local verificado')) {
    return 'Tus datos y personajes están al día en el almacenamiento local.';
  }
  if (clean.includes('sincronizado(s) con éxito') || clean.includes('Sincronizando datos')) {
    return 'Los personajes se sincronizaron correctamente.';
  }
  if (clean.includes('Ficha autoguardada') || clean.includes('Guardado exitoso') || clean.includes('forceSave')) {
    return 'Ficha de personaje guardada localmente con éxito.';
  }
  if (clean.includes('Exportación') || clean.includes('exportJSON') || clean.includes('exportDiscord')) {
    return 'Proceso de exportación de ficha ejecutado.';
  }
  if (clean.includes('Compresión') || clean.includes('compressImage')) {
    return 'Imagen optimizada para mayor velocidad y menor peso.';
  }
  if (clean.includes('Historial de logs limpiado') || clean.includes('Historial limpiado')) {
    return 'Historial de registros limpiado correctamente.';
  }
  if (clean.includes('Error al cargar imagen') || clean.includes('URL de imagen') || clean.includes('imageUrlResolver')) {
    return 'Error al descargar la imagen desde la URL externa.';
  }
  if (clean.includes('Excepción no controlada') || clean.includes('Promesa rechazada')) {
    return 'Se detectó una interrupción inesperada en una operación del sistema.';
  }
  if (clean.includes('Error al cargar') || clean.includes('Error')) {
    return 'Se detectó un problema en una operación del sistema.';
  }

  return clean;
}

export function registerDevConsoleStore(Alpine) {
  Alpine.store('devConsole', {
    showModal: false,
    isMinimized: false,
    windowSize: 'normal', // 'normal' (660px) | 'expanded' (880px)
    activeTab: 'terminal', // 'terminal' | 'logs' | 'all'
    filter: 'ALL', // 'ALL' | 'INFO' | 'WARN' | 'ERROR'
    searchQuery: '',
    commandInput: '',
    commandHistory: [],
    historyIndex: -1,
    _tempDraft: '',
    logs: [],
    maxLogs: 120,
    autoScroll: true,
    isLivePaused: false,
    pendingCountWhilePaused: 0,
    selectedSuggestionIndex: 0,

    // Barra de Acciones Rápidas (Toolbox de 1 Clic sin dados)
    quickActions: [
      { label: '💾 Backup Total', cmd: 'backup', title: 'Descargar copia completa de todos los personajes (.json)' },
      { label: '👤 Info Ficha', cmd: 'char', title: 'Ver información y estado de la ficha activa' },
      { label: '🔒 Bloquear', cmd: 'lock', title: 'Alternar bloqueo contra ediciones' },
      { label: '★ Favorito', cmd: 'fav', title: 'Marcar o desmarcar como favorito' },
      { label: '👁️ Vista Previa', cmd: 'preview', title: 'Alternar modo edición / vista lectura' },
      { label: '📥 Exportar JSON', cmd: 'export json', title: 'Descargar archivo JSON de la ficha activa' },
      { label: '📋 Discord', cmd: 'discord', title: 'Abrir exportador para Discord' },
      { label: '💾 Guardar', cmd: 'save', title: 'Forzar guardado inmediato en IndexedDB' },
      { label: '❓ Ayuda', cmd: 'help', title: 'Ver lista de todos los comandos disponibles' }
    ],

    // Estado de Posición Arrastrable (Drag y Drop)
    posX: null,
    posY: null,
    isDragging: false,
    _dragOffsetX: 0,
    _dragOffsetY: 0,

    init() {
      // 1. Restaurar historial de sesión anterior si existe
      try {
        const saved = sessionStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            this.logs = parsed.slice(-70).map(l => ({ ...l, isExpanded: false }));
          }
        }
      } catch (e) {
        console.warn('No se pudo restaurar el historial previo:', e);
      }

      // 2. Insertar separador visual de nueva sesión
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
      const dateStr = now.toLocaleDateString();

      this.logs.push({
        id: 'session_' + Date.now() + Math.random(),
        time: timeStr,
        level: 'INFO',
        message: `── Nueva Sesión iniciada: ${dateStr} ${timeStr} ──`,
        rawDetails: `[Session Start] ${now.toISOString()}`,
        isSessionDivider: true,
        count: 1,
        isExpanded: false
      });

      this.addLog('INFO', 'Consola lista y registrando eventos del sistema.');

      // 3. Interceptar console.log, console.warn y console.error
      const origLog = console.log;
      const origWarn = console.warn;
      const origError = console.error;
      let _isLogging = false;

      console.log = (...args) => {
        origLog.apply(console, args);
        if (_isLogging) return;
        _isLogging = true;
        try {
          const fullDetails = args.map(formatLogArg).join(' ');
          this.addLog('INFO', fullDetails, fullDetails);
        } finally { _isLogging = false; }
      };

      console.warn = (...args) => {
        origWarn.apply(console, args);
        if (_isLogging) return;
        _isLogging = true;
        try {
          const fullDetails = args.map(formatLogArg).join(' ');
          this.addLog('WARN', fullDetails, fullDetails);
        } finally { _isLogging = false; }
      };

      console.error = (...args) => {
        origError.apply(console, args);
        if (_isLogging) return;
        _isLogging = true;
        try {
          const fullDetails = args.map(formatLogArg).join(' ');
          this.addLog('ERROR', fullDetails, fullDetails);
        } finally { _isLogging = false; }
      };

      // 4. Capturar excepciones globales
      window.addEventListener('error', (e) => {
        const detail = e.error && e.error.stack ? e.error.stack : `${e.message} at ${e.filename}:${e.lineno}:${e.colno}`;
        this.addLog('ERROR', `Excepción no controlada: ${e.message}`, detail);
      });

      window.addEventListener('unhandledrejection', (e) => {
        const detail = e.reason && e.reason.stack ? e.reason.stack : String(e.reason);
        this.addLog('ERROR', `Operación rechazada no controlada: ${e.reason}`, detail);
      });

      // 5. Shortcut por teclado: Ctrl + ` (tilde) o Ctrl + Shift + D
      window.addEventListener('keydown', (e) => {
        if ((e.ctrlKey && e.key === '`') || (e.ctrlKey && e.shiftKey && (e.key === 'D' || e.key === 'd'))) {
          e.preventDefault();
          this.toggleModal();
        }
      });

      // 6. Guardar logs pendientes al cerrar pestaña
      window.addEventListener('beforeunload', () => {
        this._saveSessionLogsImmediate();
      });
    },

    _sessionPersistTimer: null,
    _saveSessionLogsDebounced() {
      if (this._sessionPersistTimer) return;
      this._sessionPersistTimer = setTimeout(() => {
        this._sessionPersistTimer = null;
        try {
          sessionStorage.setItem(STORAGE_KEY, JSON.stringify(this.logs));
        } catch { }
      }, 350);
    },

    _saveSessionLogsImmediate() {
      if (this._sessionPersistTimer) {
        clearTimeout(this._sessionPersistTimer);
        this._sessionPersistTimer = null;
      }
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(this.logs));
      } catch { }
    },

    toggleWindowSize() {
      this.windowSize = this.windowSize === 'normal' ? 'expanded' : 'normal';
    },

    runQuickAction(cmd) {
      this.executeCommand(cmd);
    },

    startDrag(e) {
      if (e.button !== 0) return;
      if (e.target.closest('button') || e.target.closest('input') || e.target.closest('select')) return;

      const windowEl = document.getElementById('dev-console-modal');
      if (!windowEl) return;

      const rect = windowEl.getBoundingClientRect();
      this.isDragging = true;
      this._dragOffsetX = e.clientX - rect.left;
      this._dragOffsetY = e.clientY - rect.top;

      const handleMouseMove = (moveEv) => {
        if (!this.isDragging) return;
        let newX = moveEv.clientX - this._dragOffsetX;
        let newY = moveEv.clientY - this._dragOffsetY;

        const maxX = window.innerWidth - rect.width;
        const maxY = window.innerHeight - rect.height;

        newX = Math.max(8, Math.min(newX, maxX - 8));
        newY = Math.max(8, Math.min(newY, maxY - 8));

        this.posX = newX;
        this.posY = newY;
      };

      const handleMouseUp = () => {
        this.isDragging = false;
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };

      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    },

    toggleMinimize() {
      this.isMinimized = !this.isMinimized;
    },

    resetPosition() {
      this.posX = null;
      this.posY = null;
    },

    // ── Registro de Logs con Agrupación / De-duplicación ─────────
    addLog(level, rawMessage, customDetails = null) {
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}.${String(now.getMilliseconds()).padStart(3, '0')}`;

      const humanMsg = translateToHumanReadable(rawMessage, level);
      const upperLevel = level.toUpperCase();
      const rawDetails = customDetails || formatLogArg(rawMessage);

      const lastLog = this.logs[this.logs.length - 1];
      const isSpecialLevel = ['PROMPT', 'EASTER_EGG', 'CMD_OUTPUT', 'CMD_SUCCESS'].includes(upperLevel);

      if (lastLog && !lastLog.isSessionDivider && !isSpecialLevel && lastLog.level === upperLevel && lastLog.message === humanMsg) {
        lastLog.count = (lastLog.count || 1) + 1;
        lastLog.time = timeStr;
        if (customDetails && (!lastLog.rawDetails || lastLog.rawDetails === humanMsg)) {
          lastLog.rawDetails = customDetails;
        }
        if (this.isLivePaused) {
          this.pendingCountWhilePaused++;
        }
      } else {
        const newEntry = {
          id: Date.now() + Math.random(),
          time: timeStr,
          level: upperLevel,
          message: humanMsg,
          rawDetails: rawDetails,
          isSessionDivider: false,
          count: 1,
          isExpanded: false
        };

        this.logs.push(newEntry);
        if (this.logs.length > this.maxLogs) {
          this.logs.shift();
        }

        if (this.isLivePaused) {
          this.pendingCountWhilePaused++;
        }
      }

      this._saveSessionLogsDebounced();

      if (!this.isLivePaused && this.autoScroll && this.showModal && !this.isMinimized) {
        setTimeout(() => {
          const el = document.getElementById('dev-console-logs-container');
          if (el) el.scrollTop = el.scrollHeight;
        }, 40);
      }
    },

    toggleLogExpansion(log) {
      log.isExpanded = !log.isExpanded;
    },

    togglePauseLive() {
      this.isLivePaused = !this.isLivePaused;
      if (!this.isLivePaused) {
        this.pendingCountWhilePaused = 0;
        if (this.autoScroll) {
          setTimeout(() => {
            const el = document.getElementById('dev-console-logs-container');
            if (el) el.scrollTop = el.scrollHeight;
          }, 50);
        }
      }
    },

    get filteredLogs() {
      let list = this.logs;

      if (this.activeTab === 'terminal') {
        list = list.filter(l => ['PROMPT', 'CMD_OUTPUT', 'CMD_SUCCESS', 'EASTER_EGG'].includes(l.level) || (l.level === 'WARN' && l.message.startsWith('>')));
      } else if (this.activeTab === 'logs') {
        list = list.filter(l => l.isSessionDivider || ['INFO', 'WARN', 'ERROR'].includes(l.level));
        if (this.filter !== 'ALL') {
          list = list.filter(l => l.isSessionDivider || l.level === this.filter);
        }
      } else if (this.activeTab === 'all') {
        if (this.filter !== 'ALL') {
          list = list.filter(l => l.isSessionDivider || l.level === this.filter);
        }
      }

      if (this.searchQuery && this.searchQuery.trim()) {
        const q = this.searchQuery.toLowerCase().trim();
        list = list.filter(l =>
          (l.message && l.message.toLowerCase().includes(q)) ||
          (l.rawDetails && l.rawDetails.toLowerCase().includes(q)) ||
          (l.time && l.time.includes(q)) ||
          (l.level && l.level.toLowerCase().includes(q))
        );
      }

      return list;
    },

    getHighlightedMessage(log) {
      if (!log || !log.message) return '';
      const safeText = escapeHtml(log.message);
      if (!this.searchQuery || !this.searchQuery.trim()) {
        return safeText;
      }
      const query = this.searchQuery.trim();
      const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(${escapedQuery})`, 'gi');
      return safeText.replace(regex, '<mark class="bg-amber-400/40 text-amber-200 px-0.5 rounded border-b border-amber-400 font-bold">$1</mark>');
    },

    getHighlightedDetails(log) {
      if (!log || !log.rawDetails) return '';
      const safeText = escapeHtml(log.rawDetails);
      if (!this.searchQuery || !this.searchQuery.trim()) {
        return safeText;
      }
      const query = this.searchQuery.trim();
      const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(${escapedQuery})`, 'gi');
      return safeText.replace(regex, '<mark class="bg-amber-400/40 text-amber-200 px-0.5 rounded border-b border-amber-400 font-bold">$1</mark>');
    },

    get commandSuggestions() {
      const input = this.commandInput.trim().toLowerCase();
      if (!input) return [];
      const clean = input.replace(/^>\s*/, '');
      const firstWord = clean.split(' ')[0];
      return AVAILABLE_COMMANDS.filter(c => c.cmd.startsWith(firstWord) || c.cmd.includes(firstWord));
    },

    applySuggestion(suggestion) {
      if (!suggestion) return;
      this.commandInput = suggestion.cmd + (suggestion.params ? ' ' : '');
      this.selectedSuggestionIndex = 0;
      setTimeout(() => {
        const inputEl = document.getElementById('dev-cli-input');
        if (inputEl) inputEl.focus();
      }, 30);
    },

    handleTabAutocomplete(e) {
      const suggestions = this.commandSuggestions;
      if (suggestions && suggestions.length > 0) {
        e.preventDefault();
        const selected = suggestions[this.selectedSuggestionIndex] || suggestions[0];
        this.applySuggestion(selected);
      }
    },

    openModal() {
      this.showModal = true;
      this.isMinimized = false;
      this.isLivePaused = false;
      this.pendingCountWhilePaused = 0;
      setTimeout(() => {
        const el = document.getElementById('dev-console-logs-container');
        if (el) el.scrollTop = el.scrollHeight;
        const inputEl = document.getElementById('dev-cli-input');
        if (inputEl) inputEl.focus();
      }, 100);
    },

    toggleModal() {
      this.showModal = !this.showModal;
      if (this.showModal) {
        this.isMinimized = false;
        this.isLivePaused = false;
        this.pendingCountWhilePaused = 0;
        setTimeout(() => {
          const el = document.getElementById('dev-console-logs-container');
          if (el) el.scrollTop = el.scrollHeight;
          const inputEl = document.getElementById('dev-cli-input');
          if (inputEl) inputEl.focus();
        }, 100);
      }
    },

    closeModal() {
      this.showModal = false;
    },

    clearLogs() {
      this.logs = [];
      this.pendingCountWhilePaused = 0;
      try {
        sessionStorage.removeItem(STORAGE_KEY);
      } catch { }
      this.addLog('INFO', 'Historial de registros limpiado.');
    },

    copyLogs() {
      const text = this.logs.map(l => {
        if (l.isSessionDivider) return `\n${l.message}\n`;
        const countStr = l.count > 1 ? ` (x${l.count})` : '';
        return `[${l.time}] [${l.level}]${countStr} ${l.rawDetails || l.message}`;
      }).join('\n');

      navigator.clipboard.writeText(text).then(() => {
        Alpine.store('app').toast('📋 Registros copiados al portapapeles.', 'success');
      }).catch(() => {
        Alpine.store('app').toast('Error al copiar registros.', 'error');
      });
    },

    copySingleLog(log) {
      const text = `[${log.time}] [${log.level}]${log.count > 1 ? ` (x${log.count})` : ''} ${log.message}\n\nDetalles técnicos:\n${log.rawDetails || log.message}`;
      navigator.clipboard.writeText(text).then(() => {
        Alpine.store('app').toast('📋 Detalle del registro copiado al portapapeles.', 'success');
      }).catch(() => {
        Alpine.store('app').toast('Error al copiar.', 'error');
      });
    },

    downloadLogs(format = 'log') {
      const now = new Date();
      const dateStr = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const osInfo = navigator.userAgentData?.platform || navigator.platform || 'Desconocido';
      const browserInfo = navigator.userAgent.slice(0, 100);

      let content = '';
      let mimeType = 'text/plain';
      let fileName = `wheresmyficha-devlogs-${dateStr}.log`;

      if (format === 'json') {
        mimeType = 'application/json';
        fileName = `wheresmyficha-devlogs-${dateStr}.json`;
        const payload = {
          exportedAt: now.toISOString(),
          environment: { os: osInfo, browser: browserInfo },
          totalLogs: this.logs.length,
          logs: this.logs
        };
        content = JSON.stringify(payload, null, 2);
      } else {
        const header = `================================================================================
WHERE'S MY FICHA — REPORTE DE REGISTROS DE CONSOLA
Fecha de Exportación: ${now.toLocaleString()} (${now.toISOString()})
Total de Eventos: ${this.logs.length}
Entorno: ${osInfo} | ${browserInfo}
================================================================================\n\n`;

        const body = this.logs.map(l => {
          if (l.isSessionDivider) return `\n${l.message}\n`;
          const countStr = l.count > 1 ? ` (x${l.count})` : '';
          let line = `[${l.time}] [${l.level}]${countStr} ${l.message}`;
          if (l.rawDetails && l.rawDetails !== l.message) {
            line += `\n  Detalles Técnicos:\n  ` + l.rawDetails.split('\n').join('\n  ');
          }
          return line;
        }).join('\n');

        content = header + body;
      }

      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      Alpine.store('app').toast(`💾 Registro descargado como ${fileName}`, 'success');
    },

    reportError(log) {
      const osInfo = navigator.userAgentData?.platform || navigator.platform || 'Desconocido';
      const browserInfo = navigator.userAgent.slice(0, 100);

      const reportText = `🚨 **REPORTE DE ERROR — Where's my Ficha**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⏱ **Hora del Evento:** ${log.time}${log.count > 1 ? ` (Ocurrido ${log.count} veces)` : ''}
🏷 **Categoría:** ${log.level}
💬 **Resumen:** ${log.message}
🛠 **Detalle Técnico del Error:**
\`\`\`
${log.rawDetails || log.message}
\`\`\`
💻 **Plataforma / Entorno:** ${osInfo} | ${browserInfo}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
_Pega este bloque en el canal de soporte técnico de Discord para recibir asistencia inmediata._`;

      navigator.clipboard.writeText(reportText).then(() => {
        Alpine.store('app').toast('📋 Reporte armado y copiado. ¡Listo para pegar en Discord!', 'success', 5000);
      }).catch(() => {
        Alpine.store('app').toast('No se pudo copiar automáticamente al portapapeles.', 'warning');
      });
    },

    // ── Intérprete y Procesador de Comandos ──
    async executeCommand(rawCmd) {
      if (!rawCmd || !rawCmd.trim()) return;
      const cmdStr = rawCmd.trim();

      if (this.commandHistory[this.commandHistory.length - 1] !== cmdStr) {
        this.commandHistory.push(cmdStr);
      }
      this.historyIndex = this.commandHistory.length;
      this._tempDraft = '';

      this.addLog('PROMPT', `> ${cmdStr}`);

      if (this.activeTab === 'logs') {
        this.activeTab = 'terminal';
      }

      const firstSpace = cmdStr.indexOf(' ');
      const mainWord = (firstSpace === -1 ? cmdStr : cmdStr.slice(0, firstSpace)).toLowerCase();
      const rawArgs = (firstSpace === -1 ? '' : cmdStr.slice(firstSpace + 1)).trim();

      const cleanMain = mainWord
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9_-]/g, '');

      // ── EASTER EGG DE FAVICON ──
      const cleanFull = cmdStr.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const isFaviconEasterEgg =
        cleanFull.includes('nena') && (cleanFull.includes('donde esta mi super favicon') || cleanFull.includes('donde esta mi favicon'));

      if (isFaviconEasterEgg) {
        this.addLog('EASTER_EGG', '> "Si, esto es un easter egg ;)"');
        const settingsStore = Alpine.store('settings');
        if (settingsStore && typeof settingsStore.unlockFaviconEasterEgg === 'function') {
          settingsStore.unlockFaviconEasterEgg();
        } else {
          ls.set('sys_easteregg_favicon', 'true');
        }
        this.commandInput = '';
        return;
      }

      // ── COMANDOS DISPONIBLES ──
      switch (cleanMain) {
        // ── 1. FICHA y ROSTER ──
        case 'char':
        case 'ficha':
        case 'whoami': {
          const char = Alpine.store('characters')?.active;
          if (!char) {
            this.addLog('WARN', '> No hay ningún personaje activo seleccionado en este momento.');
            break;
          }
          const basics = char.basics || {};
          const mind = char.mind || {};
          const ps = char.powerScaling || {};
          const lines = [
            `👤 FICHA ACTIVA: «${char.name || 'Sin nombre'}»`,
            `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
            ` • Nombre Completo: ${basics.fullName || char.name || '—'}`,
            ` • Raza / Especie: ${basics.race || '—'}  • Rol / Clase: ${basics.role || '—'}`,
            ` • Alineamiento: ${basics.alignment || 'Neutral'}  • Edad: ${basics.realAge || basics.apparentAge || '—'}`,
            ` • Nivel / Tier: ${ps.tier || 'No asignado'}  • Estado Mental: ${mind.sanityStatus || 'Estable'}`,
            ` • Protección: ${char.isLocked ? '🔒 Bloqueada' : '🔓 Editable'}  • Favorita: ${char.isFavorite ? '★ Sí' : 'No'}`,
            ` • Frases / Citas registradas: ${basics.quotes?.length || 0}`,
            ` • Pestaña actual en editor: [${(Alpine.store('app')?.activeTab || 'basics').toUpperCase()}]`
          ];
          this.addLog('CMD_OUTPUT', lines.join('\n'));
          break;
        }

        case 'select':
        case 'sel':
        case 'elegir-personaje': {
          const charStore = Alpine.store('characters');
          const query = rawArgs.toLowerCase().trim();
          if (!query) {
            this.addLog('WARN', '> Especifica el nombre o parte del nombre a seleccionar. Ej: select Aragorn');
            break;
          }
          const matches = charStore.list.filter(c => (c.name || '').toLowerCase().includes(query));
          if (matches.length === 0) {
            this.addLog('WARN', `> No se encontró ningún personaje que coincida con "${rawArgs}".`);
          } else if (matches.length === 1) {
            await charStore.selectActive(matches[0].id);
            this.addLog('CMD_OUTPUT', `✓ Personaje seleccionado: «${matches[0].name}».`);
          } else {
            const listNames = matches.map(c => ` • ${c.name}`).join('\n');
            this.addLog('CMD_OUTPUT', `Se encontraron ${matches.length} coincidencias:\n${listNames}\nEscribe el nombre más exacto para seleccionarlo.`);
          }
          break;
        }

        case 'rename':
        case 'renombrar': {
          const charStore = Alpine.store('characters');
          if (!charStore?.active) {
            this.addLog('WARN', '> No hay ningún personaje activo para renombrar.');
            break;
          }
          if (charStore.active.isLocked) {
            this.addLog('WARN', '> La ficha activa está protegida contra edición.');
            break;
          }
          if (!rawArgs.trim()) {
            this.addLog('WARN', '> Debes especificar el nuevo nombre. Ej: rename Gandalf el Blanco');
            break;
          }
          const oldName = charStore.active.name;
          await charStore.rename(charStore.active.id, rawArgs.trim());
          this.addLog('CMD_OUTPUT', `✓ Personaje renombrado de «${oldName}» a «${rawArgs.trim()}».`);
          break;
        }

        case 'clone':
        case 'duplicate':
        case 'duplicar': {
          const charStore = Alpine.store('characters');
          if (!charStore?.active) {
            this.addLog('WARN', '> No hay ningún personaje activo para duplicar.');
            break;
          }
          const copy = await charStore.duplicate(charStore.active.id);
          this.addLog('CMD_OUTPUT', `✓ Personaje duplicado con éxito: «${copy.name}» (ID: ${copy.id.slice(0, 8)}...).`);
          break;
        }

        case 'lock':
        case 'bloquear':
        case 'unlock':
        case 'desbloquear': {
          const charStore = Alpine.store('characters');
          if (!charStore?.active) {
            this.addLog('WARN', '> No hay ningún personaje activo.');
            break;
          }
          await charStore.toggleLocked(charStore.active.id);
          const isNowLocked = charStore.active.isLocked;
          this.addLog('CMD_OUTPUT', `✓ Ficha «${charStore.active.name}»: ${isNowLocked ? 'BLOQUEADA CONTRA EDICIÓN 🔒' : 'DESBLOQUEADA / EDITABLE 🔓'}`);
          break;
        }

        case 'fav':
        case 'favorite':
        case 'favorito': {
          const charStore = Alpine.store('characters');
          if (!charStore?.active) {
            this.addLog('WARN', '> No hay ningún personaje activo.');
            break;
          }
          await charStore.toggleFavorite(charStore.active.id);
          const isFav = charStore.active.isFavorite;
          this.addLog('CMD_OUTPUT', `✓ Ficha «${charStore.active.name}»: ${isFav ? 'Marcada como FAVORITA ★' : 'Desmarcada de favoritas'}`);
          break;
        }

        case 'tab':
        case 'pestana':
        case 'seccion': {
          const appStore = Alpine.store('app');
          const tabMap = {
            basics: 'basics', basico: 'basics', basicos: 'basics', datos: 'basics',
            body: 'body', cuerpo: 'body', fisico: 'body',
            mind: 'mind', mente: 'mind', psique: 'mind',
            social: 'social', relaciones: 'social',
            beliefs: 'beliefs', creencias: 'beliefs', moral: 'beliefs',
            priorities: 'priorities', prioridades: 'priorities', metas: 'priorities',
            skills: 'skills', habilidades: 'skills',
            weapons: 'weapons', armas: 'weapons', arsenal: 'weapons',
            powerscaling: 'powerScaling', combate: 'powerScaling', tier: 'powerScaling',
            extras: 'extras', curiosidades: 'extras',
            steam: 'steam'
          };
          const target = tabMap[rawArgs.toLowerCase().trim()];
          if (target && typeof appStore?.setActiveTab === 'function') {
            appStore.setActiveTab(target);
            this.addLog('CMD_OUTPUT', `✓ Navegado a la sección: [${target.toUpperCase()}]`);
          } else {
            this.addLog('WARN', `> Pestaña no reconocida: "${rawArgs}". Opciones válidas: basics, body, mind, social, beliefs, priorities, skills, weapons, combate, extras, steam`);
          }
          break;
        }

        case 'quote':
        case 'cita':
        case 'frase': {
          const charStore = Alpine.store('characters');
          if (!charStore?.active) {
            this.addLog('WARN', '> No hay ningún personaje activo.');
            break;
          }
          if (charStore.active.isLocked) {
            this.addLog('WARN', '> La ficha activa está protegida contra edición.');
            break;
          }
          let cleanQuote = rawArgs.trim();
          if ((cleanQuote.startsWith('"') && cleanQuote.endsWith('"')) || (cleanQuote.startsWith('«') && cleanQuote.endsWith('»'))) {
            cleanQuote = cleanQuote.slice(1, -1).trim();
          }
          if (!cleanQuote) {
            this.addLog('WARN', '> Debes escribir el texto de la frase o cita. Ej: quote "No todos los que vagan están perdidos"');
            break;
          }
          charStore.addQuote(cleanQuote);
          this.addLog('CMD_OUTPUT', `✓ Cita agregada a «${charStore.active.name}»:\n«${cleanQuote}»`);
          break;
        }

        // ── 2. PRODUCTIVIDAD, BACKUP y EXPORTACIÓN ──
        case 'backup':
        case 'respaldo': {
          const charStore = Alpine.store('characters');
          if (!charStore?.list || charStore.list.length === 0) {
            this.addLog('WARN', '> No hay personajes en el roster para respaldar.');
            break;
          }
          charStore.exportAllJSON();
          this.addLog('CMD_OUTPUT', `✓ Copia de seguridad completa descargada exitosamente (${charStore.list.length} personajes incluidos en archivo .json).`);
          break;
        }

        case 'export':
        case 'exportar': {
          const fmt = rawArgs.toLowerCase().trim();
          if (fmt === 'img' || fmt === 'imagen' || fmt === 'png') {
            this.addLog('WARN', '> La exportación a imagen ha sido deshabilitada en el sistema.');
          } else {
            const charStore = Alpine.store('characters');
            if (!charStore?.active) {
              this.addLog('WARN', '> No hay ningún personaje activo para exportar.');
              break;
            }
            charStore.exportJSON();
            this.addLog('CMD_OUTPUT', `✓ Respaldo JSON de «${charStore.active.name}» descargado.`);
          }
          break;
        }

        case 'preview':
        case 'vista':
        case 'modo-vista': {
          const appStore = Alpine.store('app');
          if (appStore) {
            appStore.toggleEditMode();
            this.addLog('CMD_OUTPUT', `✓ Modo cambiado a: ${appStore.editMode ? 'EDICIÓN ACTIVA ✏️' : 'VISTA PREVIA / LECTURA LIMPIA 👁️'}`);
          }
          break;
        }

        case 'discord': {
          Alpine.store('app')?.openDiscordModal();
          this.addLog('CMD_OUTPUT', '✓ Estación de formato para Discord abierta.');
          break;
        }

        case 'theme':
        case 'tema': {
          const hexMatch = rawArgs.match(/^#?([0-9a-fA-F]{6})$/);
          if (hexMatch) {
            const hex = '#' + hexMatch[1];
            const settingsStore = Alpine.store('settings');
            if (settingsStore) {
              settingsStore.accentColor = hex;
              settingsStore.applySettings?.();
              this.addLog('CMD_OUTPUT', `✓ Color de acento actualizado a: ${hex}`);
            }
          } else {
            Alpine.store('app')?.openThemeDesigner();
            this.addLog('CMD_OUTPUT', '✓ Diseñador de Temas abierto.');
          }
          break;
        }

        case 'save':
        case 'guardar': {
          const charStore = Alpine.store('characters');
          if (charStore?.active) {
            charStore.forceSave();
            this.addLog('CMD_OUTPUT', `✓ Ficha «${charStore.active.name}» guardada y sincronizada de inmediato en IndexedDB.`);
          }
          break;
        }

        case 'storage':
        case 'memoria':
        case 'disco': {
          const charStore = Alpine.store('characters');
          const count = charStore?.list?.length || 0;
          const folders = charStore?.folders?.length || 0;
          let estimateStr = 'No disponible';
          if (navigator.storage && navigator.storage.estimate) {
            try {
              const est = await navigator.storage.estimate();
              const mbUsed = ((est.usage || 0) / (1024 * 1024)).toFixed(2);
              const mbQuota = ((est.quota || 0) / (1024 * 1024 * 1024)).toFixed(1);
              estimateStr = `${mbUsed} MB utilizados (Cuota disponible: ~${mbQuota} GB)`;
            } catch { }
          }
          const lines = [
            '💾 DIAGNÓSTICO DE ALMACENAMIENTO LOCAL:',
            '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
            ` • Personajes guardados: ${count}`,
            ` • Carpetas organizadoras: ${folders}`,
            ` • Base de Datos: Dexie.js (IndexedDB) + LocalStorage`,
            ` • Espacio en disco: ${estimateStr}`,
            ` • Sugerencia: Usa el comando "backup" para tener una copia externa de tus fichas.`
          ];
          this.addLog('CMD_OUTPUT', lines.join('\n'));
          break;
        }

        case 'fullscreen':
        case 'pantalla': {
          if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().then(() => {
              this.addLog('CMD_OUTPUT', '✓ Pantalla completa activada.');
            }).catch(() => {
              this.addLog('WARN', '> No se pudo activar pantalla completa.');
            });
          } else {
            document.exitFullscreen().then(() => {
              this.addLog('CMD_OUTPUT', '✓ Pantalla completa desactivada.');
            });
          }
          break;
        }

        // ── 3. SISTEMA y DIAGNÓSTICO ──
        case 'help':
        case 'ayuda':
        case '?': {
          const sub = rawArgs.toLowerCase().trim();
          if (sub === 'sheet' || sub === 'ficha') {
            const lines = [
              '👤 ACCIONES DE FICHA y ROSTER:',
              ' • char / whoami       Muestra el resumen de la ficha activa',
              ' • select <nombre>     Busca y selecciona un personaje por su nombre',
              ' • rename <nombre>     Renombra el personaje activo al instante',
              ' • clone               Duplica el personaje activo en el roster',
              ' • lock / unlock       Alterna bloqueo contra ediciones accidentales',
              ' • fav                 Alterna estado de Favorita ★',
              ' • tab <sección>       Salta de pestaña (basics, body, mind, social, skills, etc.)',
              ' • quote "<texto>"     Añade una cita memorable a la ficha activa'
            ];
            this.addLog('CMD_OUTPUT', lines.join('\n'));
          } else if (sub === 'tools' || sub === 'herramientas') {
            const lines = [
              '⚡ HERRAMIENTAS y PRODUCTIVIDAD:',
              ' • backup              Descarga copia completa de todos los personajes en .json',
              ' • export [json|img]   Descarga ficha en JSON o abre exportador de imagen HD',
              ' • preview             Alterna el modo lectura limpia (oculta controles)',
              ' • discord             Abre el formateador de ficha para Discord',
              ' • theme [#hex]        Cambia color de acento (#hex) o abre Diseñador',
              ' • save                Fuerza guardado y sincronización en IndexedDB',
              ' • storage             Diagnóstico de personajes y espacio en disco',
              ' • fullscreen          Alterna pantalla completa'
            ];
            this.addLog('CMD_OUTPUT', lines.join('\n'));
          } else {
            const fullHelp = [
              '⚡ GUÍA COMPLETA DE COMANDOS:',
              '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
              '👤 [FICHA y ROSTER]:',
              ' • char / whoami       Resumen y estado de la ficha activa',
              ' • select <nombre>     Busca y selecciona un personaje del roster',
              ' • rename <nombre>     Renombra el personaje activo al instante',
              ' • clone               Duplica el personaje activo creando una copia',
              ' • lock / unlock       Bloquea o desbloquea contra ediciones accidentales',
              ' • fav                 Alterna si la ficha activa es Favorita ★',
              ' • tab <sección>       Salta de pestaña (basics, body, mind, social, skills...)',
              ' • quote "<texto>"     Añade una cita memorable a la ficha activa',
              '',
              '⚡ [PRODUCTIVIDAD y BACKUP]:',
              ' • backup              Descarga respaldo completo de todos los personajes (.json)',
              ' • export [json|img]   Descarga ficha en JSON o abre exportador visual HD',
              ' • preview             Alterna modo lectura limpia / edición activa',
              ' • discord             Abre la estación de formateo para Discord',
              ' • theme [#hex]        Cambia color de acento o abre el Diseñador de Temas',
              ' • save                Fuerza guardado inmediato en IndexedDB',
              ' • storage             Diagnóstico de base de datos y espacio en disco',
              ' • fullscreen          Alterna pantalla completa',
              '',
              '🛠️ [SISTEMA y DIAGNÓSTICO]:',
              ' • clear / cls         Limpia el historial de la consola',
              ' • stats               Diagnóstico técnico de memoria y ciclo reactivo',
              ' • copy                Copia todos los registros al portapapeles',
              ' • filter <nivel>      Filtra logs (all, info, warn, error)',
              ' • autoscroll [on|off] Activa o desactiva desplazamiento automático',
              ' • pause / resume      Pausa o reanuda la captura de eventos en vivo',
              ' • ping                Prueba de latencia y ciclo reactivo',
              ' • reset-pos           Restablece la ventana a su posición inicial',
              '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
              '💡 Atajos: [TAB] Autocompletar · [↑][↓] Historial · [Ctrl + `] Abrir/Cerrar consola'
            ];
            this.addLog('CMD_OUTPUT', fullHelp.join('\n'));
          }
          break;
        }

        case 'clear':
        case 'cls':
          this.clearLogs();
          break;

        case 'stats':
        case 'diagnostico': {
          const charCount = Alpine.store('characters')?.list?.length || 0;
          const activeName = Alpine.store('characters')?.active?.name || 'Ninguno';
          const totalLogs = this.logs.length;
          const isPaused = this.isLivePaused ? 'PAUSADO ⏸' : 'ACTIVO EN VIVO 🟢';
          this.addLog('CMD_OUTPUT', `Diagnóstico del Sistema:\n • Personajes en Roster: ${charCount}\n • Personaje Activo: «${activeName}»\n • Entradas en Historial: ${totalLogs}\n • Estado de Feed: ${isPaused}\n • Base de Datos: IndexedDB (Dexie.js) + LocalStorage (Activo)`);
          break;
        }

        case 'favicon': {
          const isUnlocked = ls.get('sys_easteregg_favicon') === 'true';
          const activeFav = ls.get('sys_active_favicon') || 'Predeterminado';
          this.addLog('CMD_OUTPUT', `Motor de Favicon:\n • Desbloqueado: ${isUnlocked ? 'SÍ [UNLOCKED]' : 'NO (Prueba la frase secreta)'}\n • Favicon Activo: ${activeFav}`);
          break;
        }

        case 'pause':
        case 'pausar':
        case 'resume':
        case 'reanudar':
          this.togglePauseLive();
          this.addLog('CMD_OUTPUT', `✓ Transmisión de logs en vivo: ${this.isLivePaused ? 'PAUSADA ⏸' : 'REANUDADA 🟢'}`);
          break;

        case 'copy':
        case 'copiar':
          this.copyLogs();
          break;

        case 'filter':
        case 'filtro':
          if (['all', 'todos'].includes(rawArgs)) this.filter = 'ALL';
          else if (['info'].includes(rawArgs)) this.filter = 'INFO';
          else if (['warn', 'aviso', 'warning'].includes(rawArgs)) this.filter = 'WARN';
          else if (['error', 'err'].includes(rawArgs)) this.filter = 'ERROR';
          else {
            this.addLog('CMD_OUTPUT', `Filtro actual: ${this.filter}. Opciones válidas: filter all | filter info | filter warn | filter error`);
            break;
          }
          this.addLog('CMD_OUTPUT', `✓ Filtro de registros cambiado a: [${this.filter}]`);
          break;

        case 'autoscroll':
          if (rawArgs === 'on' || rawArgs === '1' || rawArgs === 'true') this.autoScroll = true;
          else if (rawArgs === 'off' || rawArgs === '0' || rawArgs === 'false') this.autoScroll = false;
          else this.autoScroll = !this.autoScroll;
          this.addLog('CMD_OUTPUT', `✓ Auto-scroll: ${this.autoScroll ? 'ACTIVO' : 'PAUSADO'}`);
          break;

        case 'reset-pos':
          this.resetPosition();
          this.addLog('CMD_OUTPUT', '✓ Posición de la consola devuelta a la esquina inferior derecha.');
          break;

        case 'ping':
          this.addLog('CMD_OUTPUT', `✓ PONG! Consola reactiva y escuchando en tiempo real (${new Date().toLocaleTimeString()}).`);
          break;

        case 'skeleton':
        case 'esqueleto': {
          const charStore = Alpine.store('characters');
          const appStore = Alpine.store('app');
          if (charStore) charStore.loading = true;
          if (appStore) appStore.isSheetLoading = true;
          this.addLog('CMD_OUTPUT', '⚡ [SKELETON] Activando pantallas de esqueleto durante 3.5 segundos...');
          setTimeout(() => {
            if (charStore) charStore.loading = false;
            if (appStore) appStore.isSheetLoading = false;
            this.addLog('CMD_OUTPUT', '✓ [SKELETON] Estado de carga finalizado. Interfaz reactiva restaurada.');
          }, 3500);
          break;
        }

        default:
          this.addLog('WARN', `> Comando no reconocido: "${cmdStr}". Escribe "help" para ver la lista completa de comandos disponibles.`);
          break;
      }

      this.commandInput = '';
    },

    navigateHistory(direction) {
      if (!this.commandHistory.length) return;

      if (direction === 'up') {
        if (this.historyIndex === -1 || this.historyIndex === this.commandHistory.length) {
          this._tempDraft = this.commandInput;
          this.historyIndex = this.commandHistory.length - 1;
        } else if (this.historyIndex > 0) {
          this.historyIndex--;
        }
        this.commandInput = this.commandHistory[this.historyIndex] || '';
      } else if (direction === 'down') {
        if (this.historyIndex !== -1 && this.historyIndex < this.commandHistory.length - 1) {
          this.historyIndex++;
          this.commandInput = this.commandHistory[this.historyIndex] || '';
        } else {
          this.historyIndex = this.commandHistory.length;
          this.commandInput = this._tempDraft || '';
        }
      }

      setTimeout(() => {
        const inputEl = document.getElementById('dev-cli-input');
        if (inputEl) {
          inputEl.setSelectionRange(inputEl.value.length, inputEl.value.length);
        }
      }, 0);
    }
  });
}
