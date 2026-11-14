/**
 * @file src/ui/layout/toasts.ts
 * Contenedor global de notificaciones tipo toast.
 */

const TOAST_ICON_VARIANTS = [
  { type: 'success', icon: 'check-circle-2', colorClass: 'text-emerald-400' },
  { type: 'error', icon: 'alert-triangle', colorClass: 'text-rose-400' },
  { type: 'warning', icon: 'alert-circle', colorClass: 'text-amber-400' },
  { type: 'info', icon: 'info', colorClass: 'text-cyan-400' },
] as const;

export function renderToasts(): string {
  const iconTemplates = TOAST_ICON_VARIANTS.map(
    (v) => `
          <template x-if="t.type === '${v.type}'">
            <i data-lucide="${v.icon}" class="w-4 h-4 ${v.colorClass}"></i>
          </template>`,
  ).join('');

  return `<!-- ==============================================================
           CONTENEDOR GLOBAL DE NOTIFICACIONES TOAST
           ============================================================== -->
  <div id="tactical-toast-container"
    class="fixed bottom-6 right-6 z-[9999999] flex flex-col items-end gap-2.5 pointer-events-none" x-cloak x-data
    aria-live="polite" aria-atomic="true">
    <template x-for="t in $store.app.toasts" :key="t.id">
      <div x-show="t.visible" x-transition:enter="transition ease-out duration-300 transform"
        x-transition:enter-start="opacity-0 translate-y-4 scale-95"
        x-transition:enter-end="opacity-100 translate-y-0 scale-100"
        x-transition:leave="transition ease-in duration-200 transform"
        x-transition:leave-start="opacity-100 translate-y-0 scale-100"
        x-transition:leave-end="opacity-0 translate-y-2 scale-95" class="tactical-toast" :class="{
              'toast-success': t.type === 'success',
              'toast-error': t.type === 'error',
              'toast-warning': t.type === 'warning',
              'toast-info': t.type === 'info'
            }">

        <!-- Icono según tipo -->
        <div class="shrink-0">${iconTemplates}
        </div>

        <!-- Mensaje y Contador de repetición -->
        <div class="flex-1 text-xs leading-snug font-sans break-words select-text flex items-center gap-2 flex-wrap">
          <span x-text="t.message"></span>
          <span x-show="t.count && t.count > 1"
            class="px-1.5 py-0.2 rounded-md bg-white/15 text-[10px] font-mono font-black text-white/90 border border-white/20 select-none shadow-sm animate-pulse"
            x-text="\`×\${t.count}\`"></span>
        </div>

        <!-- Botón de Acción / Deshacer -->
        <template x-if="t.action && t.action.label">
          <button type="button" @click="t.action.onClick?.(); $store.app.dismissToast(t.id)"
            class="px-2.5 py-1 rounded-lg bg-accent-gold/20 hover:bg-accent-gold hover:text-black border border-accent-gold/50 text-accent-gold text-[11px] font-mono font-bold uppercase tracking-wider transition-all shrink-0 cursor-pointer pointer-events-auto shadow-sm"
            x-text="t.action.label">
          </button>
        </template>

        <!-- Botón Cerrar Toast -->
        <button type="button" @click="$store.app.dismissToast(t.id)"
          class="p-1 rounded text-white/40 hover:text-white transition-colors cursor-pointer pointer-events-auto shrink-0"
          title="Cerrar notificación">
          <i data-lucide="x" class="w-3.5 h-3.5"></i>
        </button>
      </div>
    </template>
  </div>`;
}

