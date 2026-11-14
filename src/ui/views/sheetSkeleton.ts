/**
 * @file src/ui/views/sheetSkeleton.ts
 * Esqueleto de carga (Skeleton Screen) mostrado durante hidratación de ficha.
 */

export function renderSheetSkeleton(): string {
  return `<!-- ==============================================================
     SKELETON SCREEN: EDITOR DE FICHA (Transición HUD)
     ============================================================== -->
<div id="character-sheet-skeleton"
     x-show="$store.characters.loading || $store.app.isSheetLoading"
     x-cloak
     class="space-y-6 animate-pulse-subtle min-h-[650px] select-none"
     aria-label="Cargando ficha de personaje...">

  <div class="section-header-bar flex items-center justify-between pb-3 border-b border-white/10">
    <div class="flex items-center gap-3">
      <div class="w-8 h-8 rounded-xl skeleton-shimmer shrink-0"></div>
      <div class="h-6 w-44 sm:w-60 rounded-lg skeleton-shimmer"></div>
    </div>
    <div class="h-6 w-28 rounded-lg skeleton-shimmer"></div>
  </div>

  <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">

    <div class="lg:col-span-4 form-card space-y-4">
      <div class="flex items-center justify-between border-b border-white/10 pb-2.5">
        <div class="flex items-center gap-2">
          <div class="w-5 h-5 rounded skeleton-shimmer"></div>
          <div class="h-4 w-24 rounded skeleton-shimmer"></div>
        </div>
        <div class="h-3 w-16 rounded skeleton-shimmer opacity-60"></div>
      </div>

      <div class="grid grid-cols-3 gap-1.5 p-1 bg-black/40 rounded-xl border border-white/5">
        <div class="h-8 rounded-lg skeleton-shimmer"></div>
        <div class="h-8 rounded-lg skeleton-shimmer"></div>
        <div class="h-8 rounded-lg skeleton-shimmer"></div>
      </div>

      <div class="w-full aspect-[3/4] max-h-[380px] rounded-2xl border border-white/10 skeleton-shimmer flex flex-col items-center justify-center gap-3.5 relative overflow-hidden bg-black/50">
        <div class="w-20 h-20 rounded-full border border-white/15 bg-white/5 flex items-center justify-center">
          <svg class="w-10 h-10 text-white/20" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="12" cy="8" r="5" />
            <path d="M20 21a8 8 0 0 0-16 0" />
          </svg>
        </div>
        <div class="h-3 w-32 rounded skeleton-shimmer opacity-70"></div>
      </div>

      <div class="grid grid-cols-2 gap-2 pt-1">
        <div class="h-9 rounded-xl skeleton-shimmer"></div>
        <div class="h-9 rounded-xl skeleton-shimmer"></div>
      </div>
    </div>

    <div class="lg:col-span-8 space-y-6">
      <div class="form-card space-y-5">
        <div class="flex items-center justify-between border-b border-white/10 pb-3">
          <div class="flex items-center gap-2">
            <div class="w-5 h-5 rounded skeleton-shimmer"></div>
            <div class="h-5 w-40 rounded skeleton-shimmer"></div>
          </div>
          <div class="h-4 w-20 rounded-full skeleton-shimmer opacity-70"></div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="space-y-2">
            <div class="h-3.5 w-28 rounded skeleton-shimmer opacity-70"></div>
            <div class="h-10 w-full rounded-xl skeleton-shimmer"></div>
          </div>
          <div class="space-y-2">
            <div class="h-3.5 w-20 rounded skeleton-shimmer opacity-70"></div>
            <div class="h-10 w-full rounded-xl skeleton-shimmer"></div>
          </div>
          <div class="space-y-2">
            <div class="h-3.5 w-24 rounded skeleton-shimmer opacity-70"></div>
            <div class="h-10 w-full rounded-xl skeleton-shimmer"></div>
          </div>
          <div class="space-y-2">
            <div class="h-3.5 w-32 rounded skeleton-shimmer opacity-70"></div>
            <div class="h-10 w-full rounded-xl skeleton-shimmer"></div>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          <div class="space-y-2">
            <div class="h-3.5 w-16 rounded skeleton-shimmer opacity-70"></div>
            <div class="h-10 w-full rounded-xl skeleton-shimmer"></div>
          </div>
          <div class="space-y-2">
            <div class="h-3.5 w-28 rounded skeleton-shimmer opacity-70"></div>
            <div class="h-10 w-full rounded-xl skeleton-shimmer"></div>
          </div>
        </div>

        <div class="space-y-2 pt-2 border-t border-white/10">
          <div class="h-3.5 w-36 rounded skeleton-shimmer opacity-70"></div>
          <div class="h-24 w-full rounded-xl skeleton-shimmer"></div>
        </div>
      </div>

      <div class="form-card space-y-4">
        <div class="flex items-center gap-2 border-b border-white/10 pb-2.5">
          <div class="w-5 h-5 rounded skeleton-shimmer"></div>
          <div class="h-4 w-36 rounded skeleton-shimmer"></div>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div class="h-11 rounded-xl skeleton-shimmer"></div>
          <div class="h-11 rounded-xl skeleton-shimmer"></div>
          <div class="h-11 rounded-xl skeleton-shimmer"></div>
        </div>
      </div>
    </div>

  </div>
</div>`;
}

