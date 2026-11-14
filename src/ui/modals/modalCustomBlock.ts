/**
 * @file src/ui/modals/modalCustomBlock.ts
 */

export function renderModalCustomBlock(): string {
  return `<!-- ==============================================================
     MODAL: CAJA DE HERRAMIENTAS - DISEÑADOR DE SUB-SECCIÓN MODULAR
     ============================================================== -->
<div id="modal-custom-block" x-data="{ viewMode: 'canvas', draggedIdx: null, dragOverIdx: null, dragOverSide: 'left', isDraggingNewType: null, isOverEndDropzone: false }"
  class="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-5 lg:p-8"
  x-show="$store.characters.blockBuilderModalOpen" x-cloak
  @keydown.escape.window="$store.characters.closeBlockBuilder()"
  role="dialog" aria-modal="true">

  <!-- Backdrop con desenfoque de cristal -->
  <div class="fixed inset-0 bg-black/85 backdrop-blur-md transition-opacity"
    x-show="$store.characters.blockBuilderModalOpen"
    x-transition:enter="ease-out duration-200"
    x-transition:enter-start="opacity-0"
    x-transition:enter-end="opacity-100"
    x-transition:leave="ease-in duration-150"
    x-transition:leave-start="opacity-100"
    x-transition:leave-end="opacity-0"
    @click="$store.characters.closeBlockBuilder()"></div>

  <!-- Contenedor del Modal Widescreen -->
  <template x-if="$store.characters.blockBuilderModalOpen">
    <div data-protect-contrast="true" class="relative z-10 w-full max-w-6xl max-h-[94vh] rounded-2xl border bg-ink-dark/98 shadow-2xl shadow-black/95 backdrop-blur-2xl transition-all flex flex-col overflow-hidden text-parchment-cream"
      x-init="$nextTick(() => window.lucide?.createIcons?.())"
      x-transition:enter="ease-out duration-200"
      x-transition:enter-start="opacity-0 scale-95 translate-y-4"
      x-transition:enter-end="opacity-100 scale-100 translate-y-0"
      x-transition:leave="ease-in duration-150"
      x-transition:leave-start="opacity-100 scale-100 translate-y-0"
      x-transition:leave-end="opacity-0 scale-95 translate-y-4"
      :style="\`border-color: \${($store.characters.blockBuilderForm.accentColor || '#eab308') + '50'}; box-shadow: 0 0 40px rgba(0,0,0,0.9), 0 0 25px \${($store.characters.blockBuilderForm.accentColor || '#eab308') + '20'};\`">

      <!-- ══════════════════════════════════════════════════════════
           BARRA SUPERIOR (HEADER): IDENTIDAD, MODO Y BOTÓN OJITO
           ══════════════════════════════════════════════════════════ -->
      <div class="px-5 sm:px-6 py-3.5 bg-black/70 border-b border-white/10 flex items-center justify-between gap-4 shrink-0">
        
        <!-- Identidad del Bloque -->
        <div class="flex items-center gap-3 min-w-0">
          <div class="w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 transition-colors shadow-sm"
            :style="\`background-color: \${($store.characters.blockBuilderForm.accentColor || '#eab308') + '20'}; border-color: \${($store.characters.blockBuilderForm.accentColor || '#eab308') + '60'};\`">
            <i :data-lucide="$store.characters.blockBuilderForm.icon || 'layers'" class="w-5 h-5"
              :style="\`color: \${$store.characters.blockBuilderForm.accentColor || '#eab308'};\`"></i>
          </div>
          <div class="min-w-0">
            <div class="flex items-center gap-2">
              <h3 class="text-sm sm:text-base font-bold text-parchment-cream font-mono tracking-wide truncate"
                x-text="$store.characters.blockBuilderBlockIndex !== null ? 'Editar Sub-sección' : 'Caja de Herramientas: Diseñar Sub-sección'"></h3>
              <span class="text-[9px] font-mono px-2 py-0.5 rounded border uppercase tracking-wider font-bold shrink-0 hidden sm:inline"
                :style="\`background-color: \${($store.characters.blockBuilderForm.accentColor || '#eab308') + '15'}; color: \${$store.characters.blockBuilderForm.accentColor || '#eab308'}; border-color: \${($store.characters.blockBuilderForm.accentColor || '#eab308') + '40'};\`"
                x-text="viewMode === 'canvas' ? 'Pizarra Modular' : viewMode === 'editor' ? 'Lista Detallada' : 'Vista Previa'"></span>
            </div>
            <p class="text-[11px] text-text-muted truncate">Arrastra, combina y organiza tus bloques en una pizarra interactiva</p>
          </div>
        </div>

        <!-- Selector de Vista (Pizarra vs Lista vs Vista Previa con el Ojito) y Botón Cerrar -->
        <div class="flex items-center gap-2 sm:gap-3 shrink-0">
          <!-- Botón de Conmutación de Vistas -->
          <div class="inline-flex rounded-xl bg-white/5 border border-white/10 p-0.5">
            <button type="button" @click="viewMode = 'canvas'; $nextTick(() => window.lucide?.createIcons?.())"
              class="px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              :class="viewMode === 'canvas' ? 'bg-accent-gold/25 text-accent-gold border border-accent-gold/40 shadow-sm' : 'text-slate-400 hover:text-white'">
              <i data-lucide="layout-grid" class="w-3.5 h-3.5"></i>
              <span>Pizarra</span>
            </button>

            <button type="button" @click="viewMode = 'editor'; $nextTick(() => window.lucide?.createIcons?.())"
              class="px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              :class="viewMode === 'editor' ? 'bg-white/15 text-white shadow-sm' : 'text-slate-400 hover:text-white'">
              <i data-lucide="sliders" class="w-3.5 h-3.5"></i>
              <span class="hidden sm:inline">Lista</span>
            </button>

            <button type="button" @click="viewMode = 'preview'; $nextTick(() => window.lucide?.createIcons?.())"
              class="px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              :class="viewMode === 'preview' ? 'bg-accent-cyan/25 text-accent-cyan border border-accent-cyan/40 shadow-sm' : 'text-slate-400 hover:text-white'">
              <i data-lucide="eye" class="w-3.5 h-3.5"></i>
              <span>Vista Previa</span>
            </button>
          </div>

          <!-- Botón Cerrar X -->
          <button type="button" @click="$store.characters.closeBlockBuilder()"
            class="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer ml-1">
            <i data-lucide="x" class="w-5 h-5"></i>
          </button>
        </div>

      </div>

      <!-- ══════════════════════════════════════════════════════════
           CUERPO DEL MODAL (CONMUTABLE ENTRE PIZARRA, LISTA Y VISTA PREVIA)
           ══════════════════════════════════════════════════════════ -->
      <div class="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">

        <!-- ──────────────────────────────────────────────────────────
             VISTA 0: PIZARRA MODULAR INTERACTIVA (CANVAS BENTO MOSAIC)
             ────────────────────────────────────────────────────────── -->
        <div x-show="viewMode === 'canvas'" class="space-y-4">
          
          <!-- BARRA DE IDENTIDAD Y PLANTILLAS RÁPIDAS -->
          <div class="p-3.5 rounded-xl border border-white/10 bg-black/40 flex flex-wrap items-center justify-between gap-3">
            <!-- Identidad rápida -->
            <div class="flex items-center gap-3 flex-1 min-w-[240px]">
              <div class="relative" x-data="{ openIconPicker: false }">
                <button type="button" @click="openIconPicker = !openIconPicker"
                  class="w-9 h-9 rounded-lg border flex items-center justify-center cursor-pointer transition-transform hover:scale-105 shadow-sm"
                  :style="\`background-color: \${($store.characters.blockBuilderForm.accentColor || '#eab308') + '25'}; border-color: \${($store.characters.blockBuilderForm.accentColor || '#eab308') + '70'};\`"
                  title="Cambiar ícono de la sub-sección">
                  <i :data-lucide="$store.characters.blockBuilderForm.icon || 'layers'" class="w-4.5 h-4.5"
                    :style="\`color: \${$store.characters.blockBuilderForm.accentColor || '#eab308'};\`"></i>
                </button>
                <!-- Mini popover selector de icono -->
                <div x-show="openIconPicker" @click.outside="openIconPicker = false" x-cloak
                  class="absolute top-full left-0 mt-2 z-50 p-2 rounded-xl bg-[#0b0e14] border border-white/20 shadow-2xl grid grid-cols-6 gap-1 w-52">
                  <template x-for="ic in ['sparkles', 'smile', 'heart', 'shield', 'shield-alert', 'zap', 'flame', 'sword', 'skull', 'brain', 'eye', 'crosshair', 'scroll-text', 'gem', 'activity', 'cpu', 'feather', 'clock']" :key="ic">
                    <button type="button" @click="$store.characters.blockBuilderForm.icon = ic; openIconPicker = false; $nextTick(() => window.lucide?.createIcons?.())"
                      class="w-7 h-7 rounded flex items-center justify-center hover:bg-white/15 text-slate-300 hover:text-white transition-colors cursor-pointer"
                      :class="$store.characters.blockBuilderForm.icon === ic ? 'bg-accent-gold/20 text-accent-gold' : ''">
                      <i :data-lucide="ic" class="w-3.5 h-3.5"></i>
                    </button>
                  </template>
                </div>
              </div>

              <div class="flex-1">
                <label class="text-[9px] font-mono text-slate-400 uppercase tracking-wider block">Título de la Sub-sección</label>
                <input type="text" x-model="$store.characters.blockBuilderForm.title"
                  placeholder="Ej: Técnicas Especiales, Perfil Mental..."
                  class="w-full text-xs sm:text-sm font-mono font-bold text-parchment-cream bg-transparent border-b border-white/20 focus:border-accent-primary focus:outline-none py-0.5" />
              </div>
            </div>

            <!-- Acceso rápido a Plantillas -->
            <div class="flex items-center gap-1.5 flex-wrap">
              <span class="text-[10px] font-mono text-slate-400 uppercase font-bold mr-1 hidden md:inline">Plantillas:</span>
              <button type="button" @click="$store.characters.applyBlockTemplate('mind')" class="px-2 py-1 rounded bg-white/5 hover:bg-white/15 border border-white/10 text-[10px] font-mono text-slate-300 hover:text-white cursor-pointer transition-colors" title="Cargar plantilla Mixta">Mixto</button>
              <button type="button" @click="$store.characters.applyBlockTemplate('double')" class="px-2 py-1 rounded bg-white/5 hover:bg-white/15 border border-white/10 text-[10px] font-mono text-slate-300 hover:text-white cursor-pointer transition-colors" title="2 columnas 50/50">Doble Columna</button>
              <button type="button" @click="$store.characters.applyBlockTemplate('stats')" class="px-2 py-1 rounded bg-white/5 hover:bg-white/15 border border-white/10 text-[10px] font-mono text-slate-300 hover:text-white cursor-pointer transition-colors" title="3 medidores de recursos">3 Medidores</button>
              <button type="button" @click="$store.characters.applyBlockTemplate('notes')" class="px-2 py-1 rounded bg-white/5 hover:bg-white/15 border border-white/10 text-[10px] font-mono text-slate-300 hover:text-white cursor-pointer transition-colors" title="Crónica completa al 100%">Crónica 100%</button>
            </div>
          </div>

          <!-- BANCO DE ELEMENTOS (TOOLBOX / DOCK SUPERIOR) -->
          <div class="p-4 rounded-xl border border-white/15 bg-black/60 shadow-lg space-y-2">
            <div class="flex items-center justify-between gap-3">
              <div class="flex items-center gap-2">
                <i data-lucide="boxes" class="w-4 h-4 text-accent-gold"></i>
                <h4 class="text-xs font-mono font-bold uppercase tracking-wider text-parchment-cream">Banco de Bloques y Elementos</h4>
                <span class="text-[10px] text-slate-400 font-mono hidden sm:inline">(Arrastra un elemento a la pizarra o pulsa para añadirlo)</span>
              </div>
              <span class="text-[10px] font-mono px-2 py-0.5 rounded border border-white/10 bg-white/5 text-slate-300"
                x-text="\`\${$store.characters.blockBuilderForm.fields.length} elementos en pizarra\`"></span>
            </div>

            <!-- CHIPS DE ELEMENTOS ARRASTRABLES Y CLICKEABLES -->
            <div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 pt-1">
              <!-- 1. Texto -->
              <div draggable="true"
                @dragstart="isDraggingNewType = 'textarea'; $event.dataTransfer.setData('application/x-block-type', 'textarea'); $event.dataTransfer.effectAllowed = 'copy';"
                @dragend="isDraggingNewType = null"
                @click="$store.characters.addBlockBuilderField('textarea', 'full')"
                class="p-2.5 rounded-xl border border-accent-gold/40 bg-accent-gold/10 hover:bg-accent-gold/25 hover:border-accent-gold/70 transition-all cursor-grab active:cursor-grabbing text-left flex flex-col justify-between group shadow-sm select-none">
                <div class="flex items-center justify-between">
                  <i data-lucide="file-text" class="w-4 h-4 text-accent-gold group-hover:scale-110 transition-transform"></i>
                  <span class="text-[9px] font-mono uppercase font-bold text-accent-gold/70">100%</span>
                </div>
                <div class="pt-1">
                  <span class="text-xs font-mono font-bold text-accent-gold block leading-tight">Texto</span>
                  <span class="text-[9px] text-slate-400 block leading-tight">Multilínea</span>
                </div>
              </div>

              <!-- 2. Input -->
              <div draggable="true"
                @dragstart="isDraggingNewType = 'input'; $event.dataTransfer.setData('application/x-block-type', 'input'); $event.dataTransfer.effectAllowed = 'copy';"
                @dragend="isDraggingNewType = null"
                @click="$store.characters.addBlockBuilderField('input', 'half')"
                class="p-2.5 rounded-xl border border-cyan-500/40 bg-cyan-500/10 hover:bg-cyan-500/25 hover:border-cyan-500/70 transition-all cursor-grab active:cursor-grabbing text-left flex flex-col justify-between group shadow-sm select-none">
                <div class="flex items-center justify-between">
                  <i data-lucide="type" class="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform"></i>
                  <span class="text-[9px] font-mono uppercase font-bold text-cyan-400/70">50%</span>
                </div>
                <div class="pt-1">
                  <span class="text-xs font-mono font-bold text-cyan-400 block leading-tight">Input</span>
                  <span class="text-[9px] text-slate-400 block leading-tight">Línea corta</span>
                </div>
              </div>

              <!-- 3. Medidor -->
              <div draggable="true"
                @dragstart="isDraggingNewType = 'stat'; $event.dataTransfer.setData('application/x-block-type', 'stat'); $event.dataTransfer.effectAllowed = 'copy';"
                @dragend="isDraggingNewType = null"
                @click="$store.characters.addBlockBuilderField('stat', 'third')"
                class="p-2.5 rounded-xl border border-purple-500/40 bg-purple-500/10 hover:bg-purple-500/25 hover:border-purple-500/70 transition-all cursor-grab active:cursor-grabbing text-left flex flex-col justify-between group shadow-sm select-none">
                <div class="flex items-center justify-between">
                  <i data-lucide="gauge" class="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform"></i>
                  <span class="text-[9px] font-mono uppercase font-bold text-purple-400/70">33%</span>
                </div>
                <div class="pt-1">
                  <span class="text-xs font-mono font-bold text-purple-400 block leading-tight">Medidor</span>
                  <span class="text-[9px] text-slate-400 block leading-tight">Barra puntos</span>
                </div>
              </div>

              <!-- 4. Imagen / GIF -->
              <div draggable="true"
                @dragstart="isDraggingNewType = 'image'; $event.dataTransfer.setData('application/x-block-type', 'image'); $event.dataTransfer.effectAllowed = 'copy';"
                @dragend="isDraggingNewType = null"
                @click="$store.characters.addBlockBuilderField('image', 'full')"
                class="p-2.5 rounded-xl border border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/25 hover:border-rose-500/70 transition-all cursor-grab active:cursor-grabbing text-left flex flex-col justify-between group shadow-sm select-none">
                <div class="flex items-center justify-between">
                  <i data-lucide="image" class="w-4 h-4 text-rose-400 group-hover:scale-110 transition-transform"></i>
                  <span class="text-[9px] font-mono uppercase font-bold text-rose-400/70">16:9</span>
                </div>
                <div class="pt-1">
                  <span class="text-xs font-mono font-bold text-rose-400 block leading-tight">Imagen/GIF</span>
                  <span class="text-[9px] text-slate-400 block leading-tight">Panorámico</span>
                </div>
              </div>

              <!-- 5. Categoría -->
              <div draggable="true"
                @dragstart="isDraggingNewType = 'badge_select'; $event.dataTransfer.setData('application/x-block-type', 'badge_select'); $event.dataTransfer.effectAllowed = 'copy';"
                @dragend="isDraggingNewType = null"
                @click="$store.characters.addBlockBuilderField('badge_select', 'half')"
                class="p-2.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/25 hover:border-emerald-500/70 transition-all cursor-grab active:cursor-grabbing text-left flex flex-col justify-between group shadow-sm select-none">
                <div class="flex items-center justify-between">
                  <i data-lucide="tags" class="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform"></i>
                </div>
                <div class="pt-1">
                  <span class="text-xs font-mono font-bold text-emerald-400 block leading-tight">Categoría</span>
                  <span class="text-[9px] text-slate-400 block leading-tight">Tipo de estado</span>
                </div>
              </div>

              <!-- 6. Tiempos y Coste -->
              <div draggable="true"
                @dragstart="isDraggingNewType = 'time_cost'; $event.dataTransfer.setData('application/x-block-type', 'time_cost'); $event.dataTransfer.effectAllowed = 'copy';"
                @dragend="isDraggingNewType = null"
                @click="$store.characters.addBlockBuilderField('time_cost', 'full')"
                class="p-2.5 rounded-xl border border-sky-500/40 bg-sky-500/10 hover:bg-sky-500/25 hover:border-sky-500/70 transition-all cursor-grab active:cursor-grabbing text-left flex flex-col justify-between group shadow-sm select-none">
                <div class="flex items-center justify-between">
                  <i data-lucide="clock" class="w-4 h-4 text-sky-400 group-hover:scale-110 transition-transform"></i>
                </div>
                <div class="pt-1">
                  <span class="text-xs font-mono font-bold text-sky-400 block leading-tight">Tiempos</span>
                  <span class="text-[9px] text-slate-400 block leading-tight">TD, CD, Coste</span>
                </div>
              </div>

              <!-- 7. Rareza -->
              <div draggable="true"
                @dragstart="isDraggingNewType = 'rarity'; $event.dataTransfer.setData('application/x-block-type', 'rarity'); $event.dataTransfer.effectAllowed = 'copy';"
                @dragend="isDraggingNewType = null"
                @click="$store.characters.addBlockBuilderField('rarity', 'half')"
                class="p-2.5 rounded-xl border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/25 hover:border-amber-500/70 transition-all cursor-grab active:cursor-grabbing text-left flex flex-col justify-between group shadow-sm select-none">
                <div class="flex items-center justify-between">
                  <i data-lucide="gem" class="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform"></i>
                </div>
                <div class="pt-1">
                  <span class="text-xs font-mono font-bold text-amber-400 block leading-tight">Rareza</span>
                  <span class="text-[9px] text-slate-400 block leading-tight">6 Rangos</span>
                </div>
              </div>

              <!-- 8. Separador / Espacio -->
              <div draggable="true"
                @dragstart="isDraggingNewType = 'divider'; $event.dataTransfer.setData('application/x-block-type', 'divider'); $event.dataTransfer.effectAllowed = 'copy';"
                @dragend="isDraggingNewType = null"
                @click="$store.characters.addBlockBuilderField('divider', 'full')"
                class="p-2.5 rounded-xl border border-slate-500/40 bg-slate-500/10 hover:bg-slate-500/25 hover:border-slate-500/70 transition-all cursor-grab active:cursor-grabbing text-left flex flex-col justify-between group shadow-sm select-none">
                <div class="flex items-center justify-between">
                  <i data-lucide="minus" class="w-4 h-4 text-slate-300 group-hover:scale-110 transition-transform"></i>
                  <span class="text-[9px] font-mono uppercase font-bold text-slate-400">Corte</span>
                </div>
                <div class="pt-1">
                  <span class="text-xs font-mono font-bold text-slate-300 block leading-tight">Separador</span>
                  <span class="text-[9px] text-slate-400 block leading-tight">Espaciar / Línea</span>
                </div>
              </div>
            </div>
          </div>

          <!-- LA PIZARRA INTERACTIVA (CANVAS MOSAICO BENTO) -->
          <div class="p-4 sm:p-5 rounded-2xl border border-white/15 bg-[#070a0f] relative min-h-[380px] shadow-2xl transition-all"
            style="background-image: radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px); background-size: 20px 20px;"
            @dragover.prevent
            @drop.prevent="
              const newType = $event.dataTransfer.getData('application/x-block-type');
              if (newType) {
                $store.characters.addBlockBuilderField(newType, null);
              } else {
                const from = draggedIdx !== null ? draggedIdx : parseInt($event.dataTransfer.getData('text/plain'), 10);
                if (!isNaN(from)) {
                  $store.characters.moveBlockBuilderFieldToEnd(from);
                }
              }
              draggedIdx = null;
              dragOverIdx = null;
              dragOverSide = 'left';
              isOverEndDropzone = false;
              isDraggingNewType = null;
            ">
            
            <!-- Barra superior de la Pizarra: estado visual y guía Cyber HUD -->
            <div class="p-2.5 sm:px-4 sm:py-2.5 rounded-xl border border-white/10 bg-black/50 flex flex-wrap items-center justify-between gap-3 text-xs font-mono transition-colors"
              :class="(draggedIdx !== null || isDraggingNewType !== null) ? 'border-accent-cyan/40 bg-accent-cyan/10' : ''">
              
              <div class="flex items-center gap-2.5">
                <span class="relative flex h-2.5 w-2.5">
                  <span class="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                    :class="(draggedIdx !== null || isDraggingNewType !== null) ? 'bg-accent-cyan' : 'bg-emerald-400'"></span>
                  <span class="relative inline-flex rounded-full h-2.5 w-2.5"
                    :class="(draggedIdx !== null || isDraggingNewType !== null) ? 'bg-accent-cyan' : 'bg-emerald-500'"></span>
                </span>
                
                <div class="flex items-center gap-2">
                  <span class="font-bold uppercase tracking-wider text-parchment-cream"
                    x-text="(draggedIdx !== null || isDraggingNewType !== null) ? 'Modo Reordenación / Posicionamiento' : 'Pizarra de Composición Modular'"></span>
                  <span class="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-slate-400 font-bold"
                    x-text="\`\${($store.characters.blockBuilderForm.fields || []).length} bloques\`"></span>
                </div>
              </div>

              <div class="text-[11px] text-slate-400 flex items-center gap-1.5">
                <template x-if="draggedIdx !== null || isDraggingNewType !== null">
                  <span class="text-accent-cyan font-bold flex items-center gap-1 animate-pulse">
                    <i data-lucide="navigation" class="w-3.5 h-3.5 rotate-90"></i>
                    Suelta sobre las guías iluminadas ◀ ▶ para posicionar con precisión
                  </span>
                </template>
                <template x-if="draggedIdx === null && isDraggingNewType === null">
                  <span>Arrastra desde el ícono <i data-lucide="grip-vertical" class="w-3 h-3 inline text-slate-400"></i> para reordenar · Clic en <span class="text-white font-bold">[25%-100%]</span> para redimensionar</span>
                </template>
              </div>
            </div>

            <!-- CUADRÍCULA 12 COLUMNAS DE LA PIZARRA CON GUIADO VISUAL INTELIGENTE -->
            <div class="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-stretch relative">
              <template x-for="(field, fIndex) in ($store.characters.blockBuilderForm.fields || []).filter(Boolean)" :key="field?.id || fIndex">
                <div class="relative transition-all duration-150"
                  :class="(field?.type === 'divider' || field?.type === 'spacer') ? 'col-span-12' : (field?.width === 'half') ? 'col-span-12 md:col-span-6' : (field?.width === 'third') ? 'col-span-12 md:col-span-4' : (field?.width === 'quarter') ? 'col-span-12 sm:col-span-6 md:col-span-3' : (field?.width === 'two-thirds') ? 'col-span-12 md:col-span-8' : 'col-span-12'"
                  @dragover.prevent.stop="
                    $event.dataTransfer.dropEffect = 'move';
                    const rect = $event.currentTarget.getBoundingClientRect();
                    const mouseX = $event.clientX - rect.left;
                    dragOverSide = mouseX > (rect.width / 2) ? 'right' : 'left';
                    dragOverIdx = fIndex;
                    isOverEndDropzone = false;
                  "
                  @dragleave="
                    const rect = $event.currentTarget.getBoundingClientRect();
                    const x = $event.clientX;
                    const y = $event.clientY;
                    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
                      if (dragOverIdx === fIndex) dragOverIdx = null;
                    }
                  "
                  @drop.prevent.stop="
                    const newType = $event.dataTransfer.getData('application/x-block-type');
                    if (newType) {
                      $store.characters.addBlockBuilderField(newType, null, fIndex, dragOverSide);
                    } else {
                      const from = draggedIdx !== null ? draggedIdx : parseInt($event.dataTransfer.getData('text/plain'), 10);
                      if (!isNaN(from) && from !== fIndex) {
                        $store.characters.moveBlockBuilderField(from, fIndex, dragOverSide);
                      }
                    }
                    draggedIdx = null;
                    dragOverIdx = null;
                    dragOverSide = 'left';
                    isDraggingNewType = null;
                    isOverEndDropzone = false;
                  ">

                  <!-- Guía Láser de Inserción Izquierda (Estilo Tier List) -->
                  <div x-show="(draggedIdx !== null || isDraggingNewType !== null) && dragOverIdx === fIndex && dragOverSide === 'left' && draggedIdx !== fIndex"
                    class="bento-drop-indicator-line indicator-left" x-cloak>
                    <span class="bento-drop-indicator-badge">◀ Insertar aquí</span>
                  </div>

                  <!-- Guía Láser de Inserción Derecha (Estilo Tier List) -->
                  <div x-show="(draggedIdx !== null || isDraggingNewType !== null) && dragOverIdx === fIndex && dragOverSide === 'right' && draggedIdx !== fIndex"
                    class="bento-drop-indicator-line indicator-right" x-cloak>
                    <span class="bento-drop-indicator-badge">Insertar aquí ▶</span>
                  </div>

                  <!-- BLOQUE / CUBO MOSAICO EN LA PIZARRA (ESTILO BENTO TREEMAP) -->
                  <div draggable="true"
                    @dragstart="draggedIdx = fIndex; $event.dataTransfer.setData('text/plain', fIndex); $event.dataTransfer.effectAllowed = 'move';"
                    @dragend="draggedIdx = null; dragOverIdx = null; dragOverSide = 'left'; isDraggingNewType = null; isOverEndDropzone = false;"
                    class="p-3.5 rounded-xl border flex flex-col justify-between transition-all duration-200 select-none relative group h-full cursor-grab active:cursor-grabbing backdrop-blur-md"
                    :style="\`background-color: \${(field?.color || '#eab308') + '15'}; border-color: \${(field?.color || '#eab308') + (dragOverIdx === fIndex && draggedIdx !== fIndex ? 'ff' : '45')}; box-shadow: 0 4px 20px rgba(0,0,0,0.5), inset 0 0 15px \${(field?.color || '#eab308') + '08'};\`"
                    :class="{
                      'opacity-25 scale-95 ring-2 ring-accent-primary/60 border-dashed': draggedIdx === fIndex,
                      'ring-2 ring-accent-cyan shadow-lg shadow-accent-cyan/30 translate-x-1.5': (draggedIdx !== null || isDraggingNewType !== null) && dragOverIdx === fIndex && dragOverSide === 'left' && draggedIdx !== fIndex,
                      'ring-2 ring-accent-cyan shadow-lg shadow-accent-cyan/30 -translate-x-1.5': (draggedIdx !== null || isDraggingNewType !== null) && dragOverIdx === fIndex && dragOverSide === 'right' && draggedIdx !== fIndex
                    }">

                    <!-- Encabezado del Bloque en la Pizarra -->
                    <div class="flex items-center justify-between gap-y-2 gap-x-1 pb-2 border-b border-white/10"
                      :class="(field?.width === 'quarter' || field?.width === 'third') ? 'flex-wrap' : 'flex-nowrap'">
                      
                      <!-- Grip de Arrastre + Indicador de Posición Secuencial #N + Badge de Tipo -->
                      <div class="flex items-center gap-1.5 shrink-0" :class="(field?.width === 'quarter' || field?.width === 'third') ? 'order-1' : ''">
                        <i data-lucide="grip-vertical" class="w-4 h-4 text-slate-500 group-hover:text-accent-cyan transition-colors shrink-0" title="Arrastra para reordenar en la pizarra"></i>
                        <span class="w-5 h-5 rounded-md bg-black/60 border border-white/15 text-[10px] font-mono font-bold text-parchment-cream/90 flex items-center justify-center shrink-0 shadow-inner" title="Posición secuencial del bloque">#<span x-text="fIndex + 1"></span></span>
                        <span class="text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded border shrink-0 flex items-center gap-1"
                          :style="\`background-color: \${(field?.color || '#eab308') + '25'}; color: \${field?.color || '#eab308'}; border-color: \${(field?.color || '#eab308') + '50'};\`"
                          :title="field?.type === 'stat' ? 'Medidor' : field?.type === 'input' ? 'Input' : field?.type === 'image' ? 'Imagen' : field?.type === 'badge_select' ? 'Categoría' : field?.type === 'time_cost' ? 'Tiempos' : field?.type === 'rarity' ? 'Rareza' : field?.type === 'divider' ? 'Separador' : 'Texto'">
                          <i :data-lucide="field?.type === 'stat' ? 'gauge' : field?.type === 'input' ? 'type' : field?.type === 'image' ? 'image' : field?.type === 'badge_select' ? 'tags' : field?.type === 'time_cost' ? 'clock' : field?.type === 'rarity' ? 'gem' : field?.type === 'divider' ? 'minus' : 'file-text'" class="w-3 h-3 shrink-0"></i>
                          <span x-text="field?.type === 'stat' ? 'Medidor' : field?.type === 'input' ? 'Input' : field?.type === 'image' ? 'Imagen' : field?.type === 'badge_select' ? 'Categoría' : field?.type === 'time_cost' ? 'Tiempos' : field?.type === 'rarity' ? 'Rareza' : field?.type === 'divider' ? 'Separador' : 'Texto'"></span>
                        </span>
                      </div>

                      <!-- Acciones: Duplicar y Eliminar -->
                      <div class="flex items-center gap-1 shrink-0" :class="(field?.width === 'quarter' || field?.width === 'third') ? 'order-2' : 'order-3'">
                        <button type="button" @click.stop="$store.characters.duplicateBlockBuilderField(fIndex)"
                          title="Duplicar elemento"
                          class="p-1 rounded text-slate-400 hover:text-accent-gold transition-colors cursor-pointer">
                          <i data-lucide="copy" class="w-3.5 h-3.5"></i>
                        </button>
                        <button type="button" @click.stop="$store.characters.removeBlockBuilderField(fIndex)"
                          title="Eliminar elemento de la pizarra"
                          class="p-1 rounded text-slate-400 hover:text-rose-400 transition-colors cursor-pointer">
                          <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                        </button>
                      </div>

                      <!-- Selector Rápido de Dimensión (25%, 33%, 50%, 66%, 100%) -->
                      <div class="inline-flex rounded-lg bg-black/60 border border-white/10 p-0.5 text-[9px] font-mono shrink-0 shadow-inner"
                        :class="(field?.width === 'quarter' || field?.width === 'third') ? 'order-3 w-full justify-between mt-1' : 'order-2'">
                        <button type="button" @click.stop="$store.characters.setBlockBuilderFieldWidth(fIndex, 'quarter')"
                          title="25% Cuarto (3 columnas)"
                          class="px-1.5 py-0.5 rounded cursor-pointer transition-colors text-center"
                          :class="[field?.width === 'quarter' ? 'bg-white text-black font-bold shadow-sm' : 'text-slate-400 hover:text-white', (field?.width === 'quarter' || field?.width === 'third') ? 'flex-1' : '']">25%</button>
                        <button type="button" @click.stop="$store.characters.setBlockBuilderFieldWidth(fIndex, 'third')"
                          title="33% Tercio (4 columnas)"
                          class="px-1.5 py-0.5 rounded cursor-pointer transition-colors text-center"
                          :class="[field?.width === 'third' ? 'bg-white text-black font-bold shadow-sm' : 'text-slate-400 hover:text-white', (field?.width === 'quarter' || field?.width === 'third') ? 'flex-1' : '']">33%</button>
                        <button type="button" @click.stop="$store.characters.setBlockBuilderFieldWidth(fIndex, 'half')"
                          title="50% Mitad (6 columnas)"
                          class="px-1.5 py-0.5 rounded cursor-pointer transition-colors text-center"
                          :class="[field?.width === 'half' ? 'bg-white text-black font-bold shadow-sm' : 'text-slate-400 hover:text-white', (field?.width === 'quarter' || field?.width === 'third') ? 'flex-1' : '']">50%</button>
                        <button type="button" @click.stop="$store.characters.setBlockBuilderFieldWidth(fIndex, 'two-thirds')"
                          title="66% Dos Tercios (8 columnas)"
                          class="px-1.5 py-0.5 rounded cursor-pointer transition-colors text-center"
                          :class="[field?.width === 'two-thirds' ? 'bg-white text-black font-bold shadow-sm' : 'text-slate-400 hover:text-white', (field?.width === 'quarter' || field?.width === 'third') ? 'flex-1' : '']">66%</button>
                        <button type="button" @click.stop="$store.characters.setBlockBuilderFieldWidth(fIndex, 'full')"
                          title="100% Completo (12 columnas)"
                          class="px-1.5 py-0.5 rounded cursor-pointer transition-colors text-center"
                          :class="[field?.width === 'full' ? 'bg-white text-black font-bold shadow-sm' : 'text-slate-400 hover:text-white', (field?.width === 'quarter' || field?.width === 'third') ? 'flex-1' : '']">100%</button>
                      </div>

                    </div>

                    <!-- Cuerpo del Bloque: Título / Etiqueta Directa y Representación Visual -->
                    <div class="py-2.5 space-y-2">
                      
                      <!-- Título Editable Directamente en la Pizarra -->
                      <div class="flex items-center gap-2">
                        <input type="text" x-model="field.label"
                          placeholder="Etiqueta / Nombre del bloque..."
                          draggable="false"
                          @dragstart.stop
                          @click.stop @mousedown.stop
                          class="w-full text-xs sm:text-sm font-mono font-bold text-parchment-cream bg-transparent border-b border-white/20 focus:border-accent-primary focus:outline-none transition-colors py-0.5 cursor-text"
                          :style="field?.type === 'divider' ? 'color: #ffffff;' : (\`color: \${field?.color || '#eab308'};\`)" />
                      </div>

                      <!-- Previsualización Visual Simulada dentro del Bloque de la Pizarra -->
                      <!-- 1. Texto -->
                      <template x-if="field?.type === 'textarea'">
                        <div class="space-y-1.5 py-1 opacity-70">
                          <div class="h-2 rounded bg-white/20 w-3/4"></div>
                          <div class="h-2 rounded bg-white/15 w-full"></div>
                          <div class="h-2 rounded bg-white/10 w-1/2"></div>
                        </div>
                      </template>

                      <!-- 2. Input -->
                      <template x-if="field?.type === 'input'">
                        <div class="p-1.5 rounded bg-black/40 border border-white/10 text-[10px] font-mono text-slate-400 flex items-center justify-between">
                          <span x-text="field?.placeholder || 'Entrada corta...'"></span>
                          <span class="text-[9px] text-slate-600 font-bold">1 línea</span>
                        </div>
                      </template>

                      <!-- 3. Medidor -->
                      <template x-if="field?.type === 'stat'">
                        <div class="space-y-1 py-1">
                          <div class="flex items-center justify-between text-[10px] font-mono">
                            <span class="text-slate-300">10 / 20 pts</span>
                            <span class="text-purple-400 font-bold">50%</span>
                          </div>
                          <div class="w-full h-1.5 rounded-full bg-black/50 overflow-hidden">
                            <div class="h-full rounded-full w-1/2" :style="\`background-color: \${field?.color || '#a855f7'};\`"></div>
                          </div>
                        </div>
                      </template>

                      <!-- 4. Imagen / GIF -->
                      <template x-if="field?.type === 'image'">
                        <div class="w-full aspect-video rounded-lg border border-dashed border-rose-500/40 bg-black/50 flex flex-col items-center justify-center gap-1 text-slate-400 py-3">
                          <i data-lucide="image" class="w-5 h-5 text-rose-400/80"></i>
                          <span class="text-[9px] font-mono font-bold text-slate-300 uppercase">16:9 Panorámico</span>
                        </div>
                      </template>

                      <!-- 5. Categoría -->
                      <template x-if="field?.type === 'badge_select'">
                        <div class="flex items-center gap-1 flex-wrap pt-0.5">
                          <span class="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">Activa</span>
                          <span class="px-2 py-0.5 rounded text-[9px] font-mono bg-white/5 text-slate-400 border border-white/10">Pasiva</span>
                        </div>
                      </template>

                      <!-- 6. Tiempos -->
                      <template x-if="field?.type === 'time_cost'">
                        <div class="grid grid-cols-3 gap-1 pt-0.5">
                          <div class="px-1.5 py-0.5 rounded bg-black/50 border border-white/10 text-center text-[9px] font-mono text-sky-300">TD</div>
                          <div class="px-1.5 py-0.5 rounded bg-black/50 border border-white/10 text-center text-[9px] font-mono text-amber-300">CD</div>
                          <div class="px-1.5 py-0.5 rounded bg-black/50 border border-white/10 text-center text-[9px] font-mono text-rose-300">Coste</div>
                        </div>
                      </template>

                      <!-- 7. Rareza -->
                      <template x-if="field?.type === 'rarity'">
                        <div class="pt-0.5">
                          <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-400/40 text-[9px] font-mono font-bold">
                            <i data-lucide="gem" class="w-3.5 h-3.5 text-blue-400"></i>
                            <span>Raro</span>
                          </span>
                        </div>
                      </template>

                      <!-- 8. Separador -->
                      <template x-if="field?.type === 'divider'">
                        <div class="py-1 flex items-center gap-2">
                          <div class="h-px bg-white/20 flex-1"></div>
                          <span class="text-[9px] font-mono text-white/90 uppercase font-bold px-1" x-text="field?.label?.trim() || 'Línea Divisoria'"></span>
                          <div class="h-px bg-white/20 flex-1"></div>
                        </div>
                      </template>

                    </div>

                    <!-- Pie del Bloque en la Pizarra: Métrica de Columnas y Flechas de Orden -->
                    <div class="flex items-center justify-between pt-2 border-t border-white/10 text-[9px] font-mono text-slate-400">
                      <span class="text-slate-400"
                        x-text="field?.width === 'quarter' ? '25% • 3 cols' : field?.width === 'third' ? '33% • 4 cols' : field?.width === 'half' ? '50% • 6 cols' : field?.width === 'two-thirds' ? '66% • 8 cols' : '100% • 12 cols'"></span>

                      <div class="flex items-center gap-1">
                        <button type="button" @click.stop="$store.characters.moveBlockBuilderField(fIndex, fIndex - 1, 'left')"
                          :disabled="fIndex === 0" title="Mover a la izquierda / antes"
                          class="p-0.5 rounded hover:text-white disabled:opacity-20 cursor-pointer">
                          <i data-lucide="chevron-left" class="w-3.5 h-3.5"></i>
                        </button>
                        <button type="button" @click.stop="$store.characters.moveBlockBuilderField(fIndex, fIndex + 1, 'right')"
                          :disabled="fIndex === $store.characters.blockBuilderForm.fields.length - 1" title="Mover a la derecha / después"
                          class="p-0.5 rounded hover:text-white disabled:opacity-20 cursor-pointer">
                          <i data-lucide="chevron-right" class="w-3.5 h-3.5"></i>
                        </button>
                      </div>
                    </div>

                  </div>

                </div>
              </template>

              <!-- ZONA DE INSERCIÓN FINAL (DROPZONE AL FINAL DEL TABLERO) -->
              <div x-show="($store.characters.blockBuilderForm.fields || []).length > 0"
                @dragover.prevent="isOverEndDropzone = true; dragOverIdx = null; $event.dataTransfer.dropEffect = 'move';"
                @dragleave="isOverEndDropzone = false"
                @drop.prevent.stop="
                  const newType = $event.dataTransfer.getData('application/x-block-type');
                  if (newType) {
                    $store.characters.addBlockBuilderField(newType, null, null);
                  } else {
                    const from = draggedIdx !== null ? draggedIdx : parseInt($event.dataTransfer.getData('text/plain'), 10);
                    if (!isNaN(from)) {
                      $store.characters.moveBlockBuilderFieldToEnd(from);
                    }
                  }
                  draggedIdx = null;
                  dragOverIdx = null;
                  dragOverSide = 'left';
                  isOverEndDropzone = false;
                  isDraggingNewType = null;
                "
                @click="$store.characters.addBlockBuilderField('textarea', 'half')"
                class="col-span-12 sm:col-span-6 md:col-span-3 min-h-[140px] rounded-xl border-2 border-dashed transition-all flex flex-col items-center justify-center gap-2 cursor-pointer p-4 select-none group/end"
                :class="{
                  'border-accent-cyan bg-accent-cyan/20 ring-2 ring-accent-cyan/70 scale-[1.02] shadow-[0_0_25px_rgba(0,240,255,0.35)]': isOverEndDropzone,
                  'border-accent-gold/40 bg-accent-gold/5 hover:border-accent-gold hover:bg-accent-gold/10': !isOverEndDropzone && (draggedIdx !== null || isDraggingNewType !== null),
                  'border-white/10 hover:border-white/25 bg-black/30 hover:bg-black/50': !isOverEndDropzone && draggedIdx === null && isDraggingNewType === null
                }">
                
                <div class="w-9 h-9 rounded-lg border flex items-center justify-center transition-transform group-hover/end:scale-110"
                  :class="isOverEndDropzone ? 'bg-accent-cyan text-black border-accent-cyan' : 'bg-white/5 border-white/10 text-slate-400 group-hover/end:text-accent-gold group-hover/end:border-accent-gold/40'">
                  <i :data-lucide="isOverEndDropzone ? 'arrow-down-to-dot' : 'plus'" class="w-4 h-4"></i>
                </div>
                
                <div class="text-center space-y-0.5">
                  <span class="text-xs font-mono font-bold block transition-colors"
                    :class="isOverEndDropzone ? 'text-accent-cyan' : 'text-slate-300 group-hover/end:text-white'"
                    x-text="isOverEndDropzone ? '¡Soltar para colocar al final!' : (draggedIdx !== null || isDraggingNewType !== null) ? 'Soltar aquí (al final)' : 'Añadir bloque al final'"></span>
                  <span class="text-[9px] font-mono text-slate-500 block">Posición #<span x-text="($store.characters.blockBuilderForm.fields || []).length + 1"></span></span>
                </div>
              </div>

            </div>

            <!-- ESTADO VACÍO EN LA PIZARRA -->
            <div x-show="!$store.characters.blockBuilderForm.fields || $store.characters.blockBuilderForm.fields.length === 0"
              class="py-16 text-center space-y-4 border border-dashed border-white/15 rounded-xl bg-black/40">
              <div class="w-12 h-12 rounded-xl bg-accent-gold/10 border border-accent-gold/30 mx-auto flex items-center justify-center text-accent-gold">
                <i data-lucide="layout-grid" class="w-6 h-6"></i>
              </div>
              <div class="max-w-md mx-auto space-y-1">
                <h5 class="text-sm font-mono font-bold text-parchment-cream">La Pizarra está vacía</h5>
                <p class="text-xs text-text-muted">Arrastra cualquier elemento del banco superior o haz clic para comenzar a construir tu composición personalizada.</p>
              </div>
              <div class="flex items-center justify-center gap-2 pt-2">
                <button type="button" @click="$store.characters.applyBlockTemplate('mind')"
                  class="px-3 py-1.5 rounded-lg bg-accent-gold/20 text-accent-gold border border-accent-gold/40 text-xs font-mono font-bold hover:bg-accent-gold/30 transition-colors cursor-pointer">
                  Cargar Plantilla Recomendada
                </button>
              </div>
            </div>

          </div>

        </div>

        <!-- ──────────────────────────────────────────────────────────
             VISTA 1: EDITOR DE ESTRUCTURA Y CAMPOS (ESPACIOSO)
             ────────────────────────────────────────────────────────── -->
        <div x-show="viewMode === 'editor'" class="space-y-5">
          
          <!-- FILA 1: PLANTILLAS RÁPIDAS (LIMPIAS, SIN EMOJIS, CON ÍCONOS SVG) -->
          <div class="p-3.5 rounded-xl border border-white/10 bg-black/40 space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <i data-lucide="layout-template" class="w-3.5 h-3.5 text-accent-gold"></i>
                Plantillas de Estructura Rápida:
              </span>
              <span class="text-[9px] font-mono text-text-muted hidden sm:inline">Carga un punto de partida pre-diseñado</span>
            </div>
            
            <div class="grid grid-cols-2 sm:grid-cols-6 gap-2">
              <button type="button" @click="$store.characters.applyBlockTemplate('mind')"
                class="px-3 py-2 rounded-lg border border-white/10 bg-white/5 hover:border-accent-gold hover:bg-accent-gold/15 transition-all text-left flex flex-col gap-1 cursor-pointer group">
                <div class="flex items-center gap-1.5 text-accent-gold font-mono font-bold text-xs">
                  <i data-lucide="brain" class="w-3.5 h-3.5 shrink-0 group-hover:scale-110 transition-transform"></i>
                  <span class="truncate">Perfil Mixto</span>
                </div>
                <span class="text-[9px] text-text-muted">1 grande + 3 columnas</span>
              </button>

              <button type="button" @click="$store.characters.applyBlockTemplate('sanity')"
                class="px-3 py-2 rounded-lg border border-white/10 bg-white/5 hover:border-rose-500 hover:bg-rose-500/15 transition-all text-left flex flex-col gap-1 cursor-pointer group">
                <div class="flex items-center gap-1.5 text-rose-400 font-mono font-bold text-xs">
                  <i data-lucide="shield-alert" class="w-3.5 h-3.5 shrink-0 group-hover:scale-110 transition-transform"></i>
                  <span class="truncate">Sanidad y Fobias</span>
                </div>
                <span class="text-[9px] text-text-muted">Pares 50% + Base 100%</span>
              </button>

              <button type="button" @click="$store.characters.applyBlockTemplate('double')"
                class="px-3 py-2 rounded-lg border border-white/10 bg-white/5 hover:border-accent-cyan hover:bg-accent-cyan/15 transition-all text-left flex flex-col gap-1 cursor-pointer group">
                <div class="flex items-center gap-1.5 text-accent-cyan font-mono font-bold text-xs">
                  <i data-lucide="split" class="w-3.5 h-3.5 shrink-0 group-hover:scale-110 transition-transform"></i>
                  <span class="truncate">Doble Columna</span>
                </div>
                <span class="text-[9px] text-text-muted">2 columnas iguales al 50%</span>
              </button>

              <button type="button" @click="$store.characters.applyBlockTemplate('notes')"
                class="px-3 py-2 rounded-lg border border-white/10 bg-white/5 hover:border-purple-400 hover:bg-purple-500/15 transition-all text-left flex flex-col gap-1 cursor-pointer group">
                <div class="flex items-center gap-1.5 text-purple-300 font-mono font-bold text-xs">
                  <i data-lucide="scroll-text" class="w-3.5 h-3.5 shrink-0 group-hover:scale-110 transition-transform"></i>
                  <span class="truncate">Bitácora</span>
                </div>
                <span class="text-[9px] text-text-muted">1 campo amplio al 100%</span>
              </button>

              <button type="button" @click="$store.characters.applyBlockTemplate('stats')"
                class="px-3 py-2 rounded-lg border border-white/10 bg-white/5 hover:border-emerald-400 hover:bg-emerald-500/15 transition-all text-left flex flex-col gap-1 cursor-pointer group">
                <div class="flex items-center gap-1.5 text-emerald-400 font-mono font-bold text-xs">
                  <i data-lucide="gauge" class="w-3.5 h-3.5 shrink-0 group-hover:scale-110 transition-transform"></i>
                  <span class="truncate">Parámetros</span>
                </div>
                <span class="text-[9px] text-text-muted">3 medidores al 33%</span>
              </button>

              <button type="button" @click="$store.characters.applyBlockTemplate('blank')"
                class="px-3 py-2 rounded-lg border border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/10 transition-all text-left flex flex-col gap-1 cursor-pointer group">
                <div class="flex items-center gap-1.5 text-slate-300 font-mono font-bold text-xs">
                  <i data-lucide="file-text" class="w-3.5 h-3.5 shrink-0 group-hover:scale-110 transition-transform"></i>
                  <span class="truncate">En Blanco</span>
                </div>
                <span class="text-[9px] text-text-muted">Diseño limpio desde cero</span>
              </button>
            </div>
          </div>

          <!-- FILA 2: DATOS GENERALES DE LA SUB-SECCIÓN -->
          <div class="grid grid-cols-1 sm:grid-cols-12 gap-4 p-4 rounded-xl border border-white/10 bg-black/30">
            <!-- Título de la sub-sección -->
            <div class="sm:col-span-5 space-y-1">
              <label class="block text-xs font-mono font-bold uppercase tracking-wider text-parchment-cream">
                Título de la Sub-sección <span class="text-rose-400">*</span>
              </label>
              <input type="text" x-model="$store.characters.blockBuilderForm.title"
                placeholder="Ej: Perfil Psicológico y Arquetipo, Habilidades, Recursos..."
                class="w-full px-3 py-2 rounded-xl border border-white/15 bg-black/60 text-xs font-mono font-bold text-parchment-cream placeholder-slate-500 focus:outline-none focus:border-accent-primary transition-colors">
            </div>

            <!-- Color de Acento (Sistema Cyber HUD nativo sin cuadro blanco de Windows) -->
            <div class="sm:col-span-4 space-y-1 relative"
              x-data="cyberColorPicker({
                label: 'Color de Sub-sección',
                defaultColor: '#eab308',
                value: () => $store.characters.blockBuilderForm.accentColor,
                onSelect: (c) => { $store.characters.blockBuilderForm.accentColor = c; }
              })">
              <label class="block text-xs font-mono font-bold uppercase tracking-wider text-parchment-cream">
                Color de Acento
              </label>
              
              <div class="flex items-center gap-2">
                <!-- Botón Trigger Cyber HUD -->
                <button type="button" @click="toggle()"
                  class="w-8 h-8 rounded-lg shrink-0 border border-white/20 hover:border-accent-cyan transition-all hover:scale-105 active:scale-95 cursor-pointer relative shadow-sm overflow-hidden flex items-center justify-center group focus:outline-none"
                  :style="\`background-color: \${currentHex}; box-shadow: 0 0 10px \${currentHex + '50'};\`"
                  title="Abrir selector de color Cyber HUD">
                  <div class="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                    <i data-lucide="pipette" class="w-3.5 h-3.5 text-white drop-shadow-md"></i>
                  </div>
                </button>

                <!-- Input HEX editable directo + Botón Personalizar -->
                <div class="flex-1 flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-white/10 bg-black/60">
                  <span class="text-xs font-mono text-slate-400 font-bold">#</span>
                  <input type="text"
                    :value="($store.characters.blockBuilderForm.accentColor || '').replace('#', '')"
                    @input="$store.characters.blockBuilderForm.accentColor = '#' + $event.target.value.replace(/[^0-9A-Fa-f]/g, '').slice(0, 6); setFromHex($store.characters.blockBuilderForm.accentColor, true);"
                    class="bg-transparent text-xs font-mono uppercase font-bold text-parchment-cream tracking-wider focus:outline-none w-20"
                    placeholder="EAB308" maxlength="6">
                  <button type="button" @click="toggle()"
                    class="ml-auto text-[10px] font-mono font-bold text-accent-cyan hover:underline cursor-pointer flex items-center gap-1">
                    <i data-lucide="palette" class="w-3 h-3"></i>
                    <span>Cyber Picker</span>
                  </button>
                </div>
              </div>

              <!-- POPOVER CYBER HUD DEL SELECTOR PROFESIONAL (IDÉNTICO A LA APP) -->
              <div x-show="isOpen"
                x-cloak
                @click.outside="close()"
                @keydown.escape.window="close()"
                x-transition:enter="transition cubic-bezier(0.16, 1, 0.3, 1) duration-200"
                x-transition:enter-start="opacity-0 translate-y-2 scale-95"
                x-transition:enter-end="opacity-100 translate-y-0 scale-100"
                x-transition:leave="transition cubic-bezier(0.16, 1, 0.3, 1) duration-150"
                x-transition:leave-start="opacity-100 translate-y-0 scale-100"
                x-transition:leave-end="opacity-0 translate-y-2 scale-95"
                class="absolute top-full left-0 mt-2 z-[999999] p-3.5 rounded-2xl flex flex-col gap-2.5 transition-all w-72 bg-[#0b0e14]/98 backdrop-blur-xl border border-white/20 shadow-[0_24px_60px_rgba(0,0,0,0.98),0_0_20px_rgba(0,0,0,0.8)]">

                <!-- Encabezado con muestra actual, título y botón Quitar -->
                <div class="flex items-center justify-between gap-2 pb-2 border-b border-white/10">
                  <div class="flex items-center gap-2">
                    <span class="w-6 h-6 rounded-full border border-white/60 shadow-inner shrink-0" :style="\`background-color: \${currentHex};\`"></span>
                    <span class="text-xs font-semibold text-white tracking-wide font-sans" x-text="label"></span>
                  </div>
                  <button type="button" @click="resetColor()"
                    class="text-[11px] font-medium font-sans text-white/70 hover:text-white px-2.5 py-0.5 rounded-md bg-white/5 hover:bg-white/15 border border-white/15 transition-colors cursor-pointer"
                    title="Restablecer color">Quitar</button>
                </div>

                <!-- Cuadro 2D: Saturación y Brillo (SV Box) -->
                <div class="w-full h-28 rounded-lg relative overflow-hidden cursor-crosshair border border-white/20 select-none touch-none"
                  :style="\`background-color: hsl(\${h}, 100%, 50%); background-image: linear-gradient(to bottom, transparent, #000000), linear-gradient(to right, #ffffff, transparent);\`"
                  @pointerdown="handleSvPointerDown($event)">
                  <div class="absolute w-4 h-4 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.9),0_0_4px_rgba(0,0,0,0.8)] -translate-x-1/2 -translate-y-1/2 pointer-events-none bg-transparent"
                    :style="\`left: \${s}%; top: \${100 - v}%;\`"></div>
                </div>

                <!-- Barra Horizontal: Hue (Tono 0 - 360°) -->
                <div class="flex flex-col gap-1">
                  <div class="flex items-center justify-between text-[10px] text-white/50 font-mono">
                    <span>Tono</span>
                    <span x-text="\`\${h}°\`"></span>
                  </div>
                  <div class="w-full h-3.5 rounded-full relative cursor-pointer border border-black/70 select-none touch-none"
                    style="background: linear-gradient(to right, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%);"
                    @pointerdown="handleHuePointerDown($event)">
                    <div class="absolute top-1/2 -translate-y-1/2 w-4.5 h-4.5 rounded-full bg-white border border-black/80 shadow-[0_0_4px_rgba(0,0,0,0.8)] -translate-x-1/2 pointer-events-none"
                      :style="\`left: \${(h / 360) * 100}%;\`"></div>
                  </div>
                </div>

                <!-- Fila de Inputs Multimodo (HEX / RGB / HSL) con Pipeta y selector de formato -->
                <div class="flex items-center gap-1.5 p-1 rounded-xl bg-[#06080d] border border-white/15">
                  <!-- Modo HEX -->
                  <div x-show="mode === 'hex'" class="flex-1 flex items-center gap-1.5 px-2">
                    <span class="text-[10px] font-mono font-bold text-amber-400 select-none">HEX</span>
                    <input type="text" class="w-full px-1.5 py-0.5 rounded bg-transparent border-none text-xs font-mono font-bold text-white focus:outline-none text-center"
                      maxlength="7"
                      x-model="hexInput"
                      @input="onHexInput($event)"
                      @keydown.enter.prevent="applyColor()"
                      spellcheck="false" />
                  </div>

                  <!-- Modo RGB -->
                  <div x-show="mode === 'rgb'" class="flex-1 flex items-center justify-between gap-1 px-1">
                    <div class="flex flex-col items-center flex-1">
                      <input type="number" min="0" max="255" class="w-full px-1 py-0.5 rounded bg-white/10 border border-white/15 text-xs font-mono font-bold text-white text-center focus:border-amber-400 focus:outline-none"
                        x-model.number="rgbR" @input="onRgbInput()" @keydown.enter.prevent="applyColor()" />
                      <span class="text-[9px] font-mono text-white/50 mt-0.5 select-none">R</span>
                    </div>
                    <div class="flex flex-col items-center flex-1">
                      <input type="number" min="0" max="255" class="w-full px-1 py-0.5 rounded bg-white/10 border border-white/15 text-xs font-mono font-bold text-white text-center focus:border-amber-400 focus:outline-none"
                        x-model.number="rgbG" @input="onRgbInput()" @keydown.enter.prevent="applyColor()" />
                      <span class="text-[9px] font-mono text-white/50 mt-0.5 select-none">G</span>
                    </div>
                    <div class="flex flex-col items-center flex-1">
                      <input type="number" min="0" max="255" class="w-full px-1 py-0.5 rounded bg-white/10 border border-white/15 text-xs font-mono font-bold text-white text-center focus:border-amber-400 focus:outline-none"
                        x-model.number="rgbB" @input="onRgbInput()" @keydown.enter.prevent="applyColor()" />
                      <span class="text-[9px] font-mono text-white/50 mt-0.5 select-none">B</span>
                    </div>
                  </div>

                  <!-- Modo HSL -->
                  <div x-show="mode === 'hsl'" class="flex-1 flex items-center justify-between gap-1 px-1">
                    <div class="flex flex-col items-center flex-1">
                      <input type="number" min="0" max="360" class="w-full px-1 py-0.5 rounded bg-white/10 border border-white/15 text-xs font-mono font-bold text-white text-center focus:border-amber-400 focus:outline-none"
                        x-model.number="hslH" @input="onHslInput()" @keydown.enter.prevent="applyColor()" />
                      <span class="text-[9px] font-mono text-white/50 mt-0.5 select-none">H°</span>
                    </div>
                    <div class="flex flex-col items-center flex-1">
                      <input type="number" min="0" max="100" class="w-full px-1 py-0.5 rounded bg-white/10 border border-white/15 text-xs font-mono font-bold text-white text-center focus:border-amber-400 focus:outline-none"
                        x-model.number="hslS" @input="onHslInput()" @keydown.enter.prevent="applyColor()" />
                      <span class="text-[9px] font-mono text-white/50 mt-0.5 select-none">S%</span>
                    </div>
                    <div class="flex flex-col items-center flex-1">
                      <input type="number" min="0" max="100" class="w-full px-1 py-0.5 rounded bg-white/10 border border-white/15 text-xs font-mono font-bold text-white text-center focus:border-amber-400 focus:outline-none"
                        x-model.number="hslL" @input="onHslInput()" @keydown.enter.prevent="applyColor()" />
                      <span class="text-[9px] font-mono text-white/50 mt-0.5 select-none">L%</span>
                    </div>
                  </div>

                  <!-- Botón Pipeta -->
                  <button type="button" @click="pickWithEyeDropper()"
                    class="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                    title="Cuentagotas (Capturar color)">
                    <i data-lucide="pipette" class="w-3.5 h-3.5"></i>
                  </button>

                  <!-- Botón Copiar -->
                  <button type="button" @click="copyColor()"
                    class="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                    title="Copiar código HEX">
                    <i data-lucide="copy" class="w-3.5 h-3.5"></i>
                  </button>

                  <!-- Botón Alternar Formato -->
                  <button type="button" @click="cycleMode()"
                    class="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                    title="Cambiar formato (HEX / RGB / HSL)">
                    <i data-lucide="chevrons-up-down" class="w-3.5 h-3.5"></i>
                  </button>
                </div>

                <!-- Muestras Rápidas Thematic -->
                <div class="grid grid-cols-6 gap-1.5 pt-0.5">
                  <template x-for="sw in swatches" :key="sw.color || sw">
                    <button type="button" @click="setFromHex(sw.color || sw, true)"
                      class="h-6 rounded-md border border-white/20 hover:scale-105 transition-transform"
                      :style="\`background-color: \${sw.color || sw};\`"
                      :title="sw.title || sw"></button>
                  </template>
                </div>

                <!-- Botón Aplicar Color -->
                <button type="button" @click="applyColor()"
                  class="w-full py-2.5 rounded-xl text-xs font-bold font-serif uppercase tracking-wider text-amber-300 border border-amber-500/60 bg-amber-950/40 hover:bg-amber-900/50 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg">
                  <i data-lucide="check" class="w-4 h-4 stroke-[2.5]"></i>
                  <span>APLICAR COLOR</span>
                </button>
              </div>

            </div>

            <!-- Ícono del Bloque (12 íconos válidos sin huecos vacíos) -->
            <div class="sm:col-span-3 space-y-1">
              <label class="block text-xs font-mono font-bold uppercase tracking-wider text-parchment-cream">
                Ícono
              </label>
              <div class="grid grid-cols-6 gap-1.5 pt-0.5">
                <template x-for="ic in ['sparkles', 'shield-alert', 'shield', 'brain', 'heart', 'zap', 'flame', 'scroll-text', 'gauge', 'cpu', 'swords', 'layers']" :key="ic">
                  <button type="button" @click="$store.characters.blockBuilderForm.icon = ic; $nextTick(() => window.lucide?.createIcons?.())"
                    class="w-7 h-7 rounded-lg border transition-all cursor-pointer flex items-center justify-center shrink-0"
                    :class="$store.characters.blockBuilderForm.icon === ic ? 'border-accent-primary bg-accent-primary/20 text-accent-primary shadow-sm scale-105' : 'border-white/10 bg-white/5 text-slate-400 hover:text-white hover:bg-white/15'">
                    <i :data-lucide="ic" class="w-3.5 h-3.5"></i>
                  </button>
                </template>
              </div>
            </div>
          </div>

          <!-- FILA 3: LISTA ESPACIOSA DE CAMPOS Y ELEMENTOS -->
          <div class="space-y-3 pt-1">
            <div class="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <h4 class="text-xs font-mono font-bold uppercase tracking-wider text-parchment-cream flex items-center gap-1.5">
                  <i data-lucide="sliders" class="w-4 h-4 text-accent-cyan"></i>
                  <span>Campos y Elementos Definidos</span>
                  <span class="text-[10px] text-text-muted font-normal" x-text="\`(\${$store.characters.blockBuilderForm.fields.length} campos)\`"></span>
                </h4>
                <p class="text-[11px] text-text-muted">Ajusta la etiqueta, dimensión y placeholder de cada elemento</p>
              </div>

              <!-- BOTONES PARA AÑADIR CAMPO (LIMPIOS, CON ÍCONOS SVG DE ALTA FIDELIDAD) -->
              <div class="flex items-center gap-1.5 flex-wrap">
                <button type="button" @click="$store.characters.addBlockBuilderField('textarea', 'full')"
                  class="px-2.5 py-1.5 rounded-lg border border-accent-gold/40 bg-accent-gold/15 text-accent-gold text-xs font-mono font-bold hover:bg-accent-gold/25 transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm">
                  <i data-lucide="file-text" class="w-3.5 h-3.5"></i>
                  <span>Texto</span>
                </button>

                <button type="button" @click="$store.characters.addBlockBuilderField('input', 'half')"
                  class="px-2.5 py-1.5 rounded-lg border border-accent-cyan/40 bg-accent-cyan/15 text-accent-cyan text-xs font-mono font-bold hover:bg-accent-cyan/25 transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm">
                  <i data-lucide="type" class="w-3.5 h-3.5"></i>
                  <span>Input</span>
                </button>

                <button type="button" @click="$store.characters.addBlockBuilderField('stat', 'third')"
                  class="px-2.5 py-1.5 rounded-lg border border-purple-500/40 bg-purple-500/15 text-purple-300 text-xs font-mono font-bold hover:bg-purple-500/25 transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm">
                  <i data-lucide="gauge" class="w-3.5 h-3.5"></i>
                  <span>Medidor</span>
                </button>

                <button type="button" @click="$store.characters.addBlockBuilderField('image', 'full')"
                  class="px-2.5 py-1.5 rounded-lg border border-rose-500/40 bg-rose-500/15 text-rose-300 text-xs font-mono font-bold hover:bg-rose-500/25 transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm">
                  <i data-lucide="image" class="w-3.5 h-3.5"></i>
                  <span>Imagen / GIF</span>
                </button>

                <button type="button" @click="$store.characters.addBlockBuilderField('badge_select', 'half')"
                  class="px-2.5 py-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/15 text-emerald-300 text-xs font-mono font-bold hover:bg-emerald-500/25 transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm">
                  <i data-lucide="tags" class="w-3.5 h-3.5"></i>
                  <span>Categoría</span>
                </button>

                <button type="button" @click="$store.characters.addBlockBuilderField('time_cost', 'full')"
                  class="px-2.5 py-1.5 rounded-lg border border-sky-500/40 bg-sky-500/15 text-sky-300 text-xs font-mono font-bold hover:bg-sky-500/25 transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm">
                  <i data-lucide="clock" class="w-3.5 h-3.5"></i>
                  <span>Tiempos</span>
                </button>

                <button type="button" @click="$store.characters.addBlockBuilderField('rarity', 'half')"
                  class="px-2.5 py-1.5 rounded-lg border border-amber-500/40 bg-amber-500/15 text-amber-300 text-xs font-mono font-bold hover:bg-amber-500/25 transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm">
                  <i data-lucide="gem" class="w-3.5 h-3.5"></i>
                  <span>Rareza</span>
                </button>

                <button type="button" @click="$store.characters.addBlockBuilderField('divider', 'full')"
                  class="px-2.5 py-1.5 rounded-lg border border-slate-500/40 bg-slate-500/15 text-slate-300 text-xs font-mono font-bold hover:bg-slate-500/25 transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm">
                  <i data-lucide="minus" class="w-3.5 h-3.5"></i>
                  <span>Separador</span>
                </button>
              </div>
            </div>

            <!-- LISTA DE CAMPOS CON ESPACIO COMPLETO Y CÓMODO -->
            <div class="space-y-3">
              <template x-for="(field, fIndex) in ($store.characters.blockBuilderForm.fields || []).filter(Boolean)" :key="field?.id || fIndex">
                <div class="p-4 rounded-xl border border-white/10 bg-black/50 space-y-3 relative group hover:border-white/20 transition-all shadow-md">
                  
                  <!-- Fila Superior: Badge con Ícono SVG, Etiqueta del Campo y Orden -->
                  <div class="flex items-center justify-between gap-3">
                    <div class="flex items-center gap-2.5 flex-1 min-w-0">
                      <!-- Badge Tipo con su Ícono SVG bien cargado -->
                      <span class="text-[9px] font-mono font-bold uppercase px-2.5 py-1 rounded border shrink-0 flex items-center gap-1.5"
                        :class="field?.type === 'stat' ? 'border-purple-500/40 bg-purple-500/10 text-purple-300' : field?.type === 'input' ? 'border-accent-cyan/40 bg-accent-cyan/10 text-accent-cyan' : field?.type === 'image' ? 'border-rose-500/40 bg-rose-500/10 text-rose-300' : field?.type === 'badge_select' ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300' : field?.type === 'time_cost' ? 'border-sky-500/40 bg-sky-500/10 text-sky-300' : field?.type === 'rarity' ? 'border-amber-500/40 bg-amber-500/10 text-amber-300' : field?.type === 'divider' ? 'border-slate-500/40 bg-slate-500/10 text-slate-300' : 'border-accent-gold/40 bg-accent-gold/10 text-accent-gold'">
                        <i :data-lucide="field?.type === 'stat' ? 'gauge' : field?.type === 'input' ? 'type' : field?.type === 'image' ? 'image' : field?.type === 'badge_select' ? 'tags' : field?.type === 'time_cost' ? 'clock' : field?.type === 'rarity' ? 'gem' : field?.type === 'divider' ? 'minus' : 'file-text'" class="w-3.5 h-3.5 shrink-0"></i>
                        <span x-text="field?.type === 'stat' ? 'Medidor' : field?.type === 'input' ? 'Input' : field?.type === 'image' ? 'Imagen / GIF' : field?.type === 'badge_select' ? 'Categoría' : field?.type === 'time_cost' ? 'Tiempos' : field?.type === 'rarity' ? 'Rareza' : field?.type === 'divider' ? 'Separador' : 'Área Texto'"></span>
                      </span>

                      <!-- Nombre / Etiqueta del Campo -->
                      <input type="text" x-model="field.label"
                        placeholder="Nombre / Etiqueta del campo..."
                        class="w-full text-xs font-mono font-bold text-parchment-cream bg-transparent border-b border-white/15 focus:border-accent-primary focus:outline-none transition-colors py-1">
                    </div>

                    <!-- Botones de Reordenar y Borrar -->
                    <div class="flex items-center gap-1 shrink-0">
                      <button type="button" @click="$store.characters.moveBlockBuilderField(fIndex, fIndex - 1)"
                        :disabled="fIndex === 0" title="Mover arriba"
                        class="p-1 rounded text-slate-400 hover:text-white disabled:opacity-20 cursor-pointer">
                        <i data-lucide="chevron-up" class="w-4 h-4"></i>
                      </button>
                      <button type="button" @click="$store.characters.moveBlockBuilderField(fIndex, fIndex + 1)"
                        :disabled="fIndex === $store.characters.blockBuilderForm.fields.length - 1" title="Mover abajo"
                        class="p-1 rounded text-slate-400 hover:text-white disabled:opacity-20 cursor-pointer">
                        <i data-lucide="chevron-down" class="w-4 h-4"></i>
                      </button>
                      <button type="button" @click="$store.characters.removeBlockBuilderField(fIndex)"
                        title="Eliminar este campo"
                        class="p-1 rounded text-slate-400 hover:text-rose-400 cursor-pointer ml-1">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                      </button>
                    </div>
                  </div>

                  <!-- Fila Intermedia: Dimensión del Campo y Color de Etiqueta Personalizable con Cyber HUD -->
                  <div class="flex items-center justify-between gap-4 flex-wrap pt-2 border-t border-white/5 text-xs font-mono">
                    <div class="flex items-center gap-2">
                      <span class="text-slate-400 text-[10px] uppercase font-bold">Ancho / Dimensión:</span>
                      <div class="inline-flex rounded-lg border border-white/10 bg-black/60 p-0.5 gap-0.5">
                        <button type="button" @click="field.width = 'full'"
                          class="px-2.5 py-1 rounded text-[10px] font-mono transition-colors cursor-pointer"
                          :class="field?.width === 'full' ? 'bg-accent-gold text-black font-bold' : 'text-slate-400 hover:text-white'">
                          100% Ancho Completo
                        </button>
                        <button type="button" @click="field.width = 'half'"
                          class="px-2.5 py-1 rounded text-[10px] font-mono transition-colors cursor-pointer"
                          :class="field?.width === 'half' ? 'bg-accent-cyan text-black font-bold' : 'text-slate-400 hover:text-white'">
                          50% Medio (2 por fila)
                        </button>
                        <button type="button" @click="field.width = 'third'"
                          class="px-2.5 py-1 rounded text-[10px] font-mono transition-colors cursor-pointer"
                          :class="field?.width === 'third' ? 'bg-purple-500 text-white font-bold' : 'text-slate-400 hover:text-white'">
                          33% Tercio (3 por fila)
                        </button>
                        <button type="button" @click="field.width = 'quarter'"
                          class="px-2.5 py-1 rounded text-[10px] font-mono transition-colors cursor-pointer"
                          :class="field?.width === 'quarter' ? 'bg-emerald-500 text-black font-bold' : 'text-slate-400 hover:text-white'">
                          25% Cuarto
                        </button>
                      </div>
                    </div>

                    <!-- Color individual del campo con Cyber HUD Picker -->
                    <div class="flex items-center gap-2 relative"
                      x-data="cyberColorPicker({
                        label: field?.label || 'Color de Etiqueta',
                        defaultColor: '#eab308',
                        value: () => field?.color,
                        onSelect: (c) => { if (field) field.color = c; }
                      })">
                      <span class="text-slate-400 text-[10px] uppercase font-bold">Color Etiqueta:</span>
                      
                      <!-- Botón Trigger Cyber HUD para el campo -->
                      <button type="button" @click="toggle()"
                        class="w-5 h-5 rounded-md border border-white/30 cursor-pointer shadow-sm hover:scale-125 transition-transform shrink-0"
                        :style="\`background-color: \${currentHex};\`"
                        title="Abrir selector Cyber HUD"></button>

                      <!-- Muestras rápidas -->
                      <div class="flex items-center gap-1">
                        <template x-for="fc in ['#eab308', '#00f0ff', '#f43f5e', '#10b981', '#a855f7', '#fb923c', '#38bdf8']" :key="fc">
                          <button type="button" @click="setFromHex(fc, true); if (field) field.color = fc;"
                            data-protect-circle data-protect-radius class="w-4 h-4 rounded-full border transition-transform hover:scale-125 cursor-pointer"
                            :style="\`background-color: \${fc}; border-color: \${(field?.color || '') === fc ? '#ffffff' : 'transparent'};\`"></button>
                        </template>
                      </div>

                      <!-- Popover Cyber HUD flotante para el campo -->
                      <div x-show="isOpen"
                        x-cloak
                        @click.outside="close()"
                        @keydown.escape.window="close()"
                        x-transition:enter="transition cubic-bezier(0.16, 1, 0.3, 1) duration-200"
                        x-transition:enter-start="opacity-0 translate-y-2 scale-95"
                        x-transition:enter-end="opacity-100 translate-y-0 scale-100"
                        x-transition:leave="transition cubic-bezier(0.16, 1, 0.3, 1) duration-150"
                        x-transition:leave-start="opacity-100 translate-y-0 scale-100"
                        x-transition:leave-end="opacity-0 translate-y-2 scale-95"
                        class="absolute bottom-full right-0 mb-2 z-[999999] p-3.5 rounded-2xl flex flex-col gap-2.5 transition-all w-72 bg-[#0b0e14]/98 backdrop-blur-xl border border-white/20 shadow-[0_24px_60px_rgba(0,0,0,0.98),0_0_20px_rgba(0,0,0,0.8)]">

                        <!-- Encabezado con muestra actual, título y botón Quitar -->
                        <div class="flex items-center justify-between gap-2 pb-2 border-b border-white/10">
                          <div class="flex items-center gap-2">
                            <span class="w-6 h-6 rounded-full border border-white/60 shadow-inner shrink-0" :style="\`background-color: \${currentHex};\`"></span>
                            <span class="text-xs font-semibold text-white tracking-wide font-sans truncate max-w-[140px]" x-text="label"></span>
                          </div>
                          <button type="button" @click="resetColor()"
                            class="text-[11px] font-medium font-sans text-white/70 hover:text-white px-2.5 py-0.5 rounded-md bg-white/5 hover:bg-white/15 border border-white/15 transition-colors cursor-pointer"
                            title="Restablecer color">Quitar</button>
                        </div>

                        <!-- Cuadro 2D: Saturación y Brillo (SV Box) -->
                        <div class="w-full h-28 rounded-lg relative overflow-hidden cursor-crosshair border border-white/20 select-none touch-none"
                          :style="\`background-color: hsl(\${h}, 100%, 50%); background-image: linear-gradient(to bottom, transparent, #000000), linear-gradient(to right, #ffffff, transparent);\`"
                          @pointerdown="handleSvPointerDown($event)">
                          <div class="absolute w-4 h-4 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.9),0_0_4px_rgba(0,0,0,0.8)] -translate-x-1/2 -translate-y-1/2 pointer-events-none bg-transparent"
                            :style="\`left: \${s}%; top: \${100 - v}%;\`"></div>
                        </div>

                        <!-- Barra Horizontal: Hue (Tono 0 - 360°) -->
                        <div class="flex flex-col gap-1">
                          <div class="flex items-center justify-between text-[10px] text-white/50 font-mono">
                            <span>Tono</span>
                            <span x-text="\`\${h}°\`"></span>
                          </div>
                          <div class="w-full h-3.5 rounded-full relative cursor-pointer border border-black/70 select-none touch-none"
                            style="background: linear-gradient(to right, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%);"
                            @pointerdown="handleHuePointerDown($event)">
                            <div class="absolute top-1/2 -translate-y-1/2 w-4.5 h-4.5 rounded-full bg-white border border-black/80 shadow-[0_0_4px_rgba(0,0,0,0.8)] -translate-x-1/2 pointer-events-none"
                              :style="\`left: \${(h / 360) * 100}%;\`"></div>
                          </div>
                        </div>

                        <!-- Fila de Inputs Multimodo (HEX / RGB / HSL) con Pipeta y selector de formato -->
                        <div class="flex items-center gap-1.5 p-1 rounded-xl bg-[#06080d] border border-white/15">
                          <!-- Modo HEX -->
                          <div x-show="mode === 'hex'" class="flex-1 flex items-center gap-1.5 px-2">
                            <span class="text-[10px] font-mono font-bold text-amber-400 select-none">HEX</span>
                            <input type="text" class="w-full px-1.5 py-0.5 rounded bg-transparent border-none text-xs font-mono font-bold text-white focus:outline-none text-center"
                              maxlength="7"
                              x-model="hexInput"
                              @input="onHexInput($event)"
                              @keydown.enter.prevent="applyColor()"
                              spellcheck="false" />
                          </div>

                          <!-- Modo RGB -->
                          <div x-show="mode === 'rgb'" class="flex-1 flex items-center justify-between gap-1 px-1">
                            <div class="flex flex-col items-center flex-1">
                              <input type="number" min="0" max="255" class="w-full px-1 py-0.5 rounded bg-white/10 border border-white/15 text-xs font-mono font-bold text-white text-center focus:border-amber-400 focus:outline-none"
                                x-model.number="rgbR" @input="onRgbInput()" @keydown.enter.prevent="applyColor()" />
                              <span class="text-[9px] font-mono text-white/50 mt-0.5 select-none">R</span>
                            </div>
                            <div class="flex flex-col items-center flex-1">
                              <input type="number" min="0" max="255" class="w-full px-1 py-0.5 rounded bg-white/10 border border-white/15 text-xs font-mono font-bold text-white text-center focus:border-amber-400 focus:outline-none"
                                x-model.number="rgbG" @input="onRgbInput()" @keydown.enter.prevent="applyColor()" />
                              <span class="text-[9px] font-mono text-white/50 mt-0.5 select-none">G</span>
                            </div>
                            <div class="flex flex-col items-center flex-1">
                              <input type="number" min="0" max="255" class="w-full px-1 py-0.5 rounded bg-white/10 border border-white/15 text-xs font-mono font-bold text-white text-center focus:border-amber-400 focus:outline-none"
                                x-model.number="rgbB" @input="onRgbInput()" @keydown.enter.prevent="applyColor()" />
                              <span class="text-[9px] font-mono text-white/50 mt-0.5 select-none">B</span>
                            </div>
                          </div>

                          <!-- Modo HSL -->
                          <div x-show="mode === 'hsl'" class="flex-1 flex items-center justify-between gap-1 px-1">
                            <div class="flex flex-col items-center flex-1">
                              <input type="number" min="0" max="360" class="w-full px-1 py-0.5 rounded bg-white/10 border border-white/15 text-xs font-mono font-bold text-white text-center focus:border-amber-400 focus:outline-none"
                                x-model.number="hslH" @input="onHslInput()" @keydown.enter.prevent="applyColor()" />
                              <span class="text-[9px] font-mono text-white/50 mt-0.5 select-none">H°</span>
                            </div>
                            <div class="flex flex-col items-center flex-1">
                              <input type="number" min="0" max="100" class="w-full px-1 py-0.5 rounded bg-white/10 border border-white/15 text-xs font-mono font-bold text-white text-center focus:border-amber-400 focus:outline-none"
                                x-model.number="hslS" @input="onHslInput()" @keydown.enter.prevent="applyColor()" />
                              <span class="text-[9px] font-mono text-white/50 mt-0.5 select-none">S%</span>
                            </div>
                            <div class="flex flex-col items-center flex-1">
                              <input type="number" min="0" max="100" class="w-full px-1 py-0.5 rounded bg-white/10 border border-white/15 text-xs font-mono font-bold text-white text-center focus:border-amber-400 focus:outline-none"
                                x-model.number="hslL" @input="onHslInput()" @keydown.enter.prevent="applyColor()" />
                              <span class="text-[9px] font-mono text-white/50 mt-0.5 select-none">L%</span>
                            </div>
                          </div>

                          <!-- Botón Pipeta -->
                          <button type="button" @click="pickWithEyeDropper()"
                            class="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                            title="Cuentagotas (Capturar color)">
                            <i data-lucide="pipette" class="w-3.5 h-3.5"></i>
                          </button>

                          <!-- Botón Copiar -->
                          <button type="button" @click="copyColor()"
                            class="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                            title="Copiar código HEX">
                            <i data-lucide="copy" class="w-3.5 h-3.5"></i>
                          </button>

                          <!-- Botón Alternar Formato -->
                          <button type="button" @click="cycleMode()"
                            class="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                            title="Cambiar formato (HEX / RGB / HSL)">
                            <i data-lucide="chevrons-up-down" class="w-3.5 h-3.5"></i>
                          </button>
                        </div>

                        <!-- Muestras Rápidas -->
                        <div class="grid grid-cols-6 gap-1.5 pt-0.5">
                          <template x-for="sw in swatches" :key="sw.color || sw">
                            <button type="button" @click="setFromHex(sw.color || sw, true)"
                              class="h-6 rounded-md border border-white/20 hover:scale-105 transition-transform"
                              :style="\`background-color: \${sw.color || sw};\`"
                              :title="sw.title || sw"></button>
                          </template>
                        </div>

                        <!-- Botón Aplicar Color -->
                        <button type="button" @click="applyColor()"
                          class="w-full py-2.5 rounded-xl text-xs font-bold font-serif uppercase tracking-wider text-amber-300 border border-amber-500/60 bg-amber-950/40 hover:bg-amber-900/50 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg">
                          <i data-lucide="check" class="w-4 h-4 stroke-[2.5]"></i>
                          <span>APLICAR COLOR</span>
                        </button>
                      </div>

                    </div>
                  </div>

                  <!-- Fila Inferior: Placeholder, Opciones y Guías de Elemento -->
                  <div class="pt-1">
                    <template x-if="field?.type === 'badge_select'">
                      <div class="flex items-center gap-2">
                        <span class="text-[10px] text-slate-400 font-mono shrink-0">Opciones (separadas por coma):</span>
                        <input type="text" x-model="field.optionsText"
                          placeholder="Activa, Pasiva"
                          class="flex-1 px-3 py-1.5 rounded-lg border border-white/10 bg-black/40 text-xs font-mono text-emerald-300 placeholder-slate-600 focus:outline-none focus:border-emerald-400">
                      </div>
                    </template>
                    <template x-if="field?.type === 'image'">
                      <div class="text-[10px] font-mono text-rose-300/80 flex items-center gap-1.5 py-0.5">
                        <i data-lucide="info" class="w-3.5 h-3.5 shrink-0"></i>
                        <span>Visualizador 16:9 con soporte de recorte, encuadre, reproducción de GIFs animados, lightbox y carga desde URL externa.</span>
                      </div>
                    </template>
                    <template x-if="field?.type === 'time_cost'">
                      <div class="text-[10px] font-mono text-sky-300/80 flex items-center gap-1.5 py-0.5">
                        <i data-lucide="info" class="w-3.5 h-3.5 shrink-0"></i>
                        <span>Genera automáticamente la trilogía de combate: TD (Duración), CD (Enfriamiento) y Coste de Recurso.</span>
                      </div>
                    </template>
                    <template x-if="field?.type === 'rarity'">
                      <div class="text-[10px] font-mono text-amber-300/80 flex items-center gap-1.5 py-0.5">
                        <i data-lucide="info" class="w-3.5 h-3.5 shrink-0"></i>
                        <span>Selector de 6 calidades canónicas (Común, Poco Común, Raro, Épico, Legendario, Mítico) con bordes iluminados.</span>
                      </div>
                    </template>
                    <template x-if="field?.type !== 'badge_select' && field?.type !== 'image' && field?.type !== 'time_cost' && field?.type !== 'rarity'">
                      <input type="text" x-model="field.placeholder"
                        placeholder="Texto de guía o placeholder (ej: Ej: Leal, perseverante, empático...)"
                        class="w-full px-3 py-1.5 rounded-lg border border-white/10 bg-black/40 text-xs font-mono text-slate-300 placeholder-slate-600 focus:outline-none focus:border-white/30">
                    </template>
                  </div>

                </div>
              </template>
            </div>
          </div>

        </div>

        <!-- ──────────────────────────────────────────────────────────
             VISTA 2: VISTA PREVIA COMPLETA EN PANTALLA ANCHA (OJITO)
             ────────────────────────────────────────────────────────── -->
        <div x-show="viewMode === 'preview'" class="space-y-6 py-2">
          
          <div class="p-4 rounded-xl border border-white/10 bg-black/40 flex items-center justify-between gap-4">
            <div class="flex items-center gap-2.5">
              <i data-lucide="eye" class="w-5 h-5 text-accent-cyan"></i>
              <div>
                <h4 class="text-xs font-mono font-bold uppercase tracking-wider text-parchment-cream">Vista Previa Real de la Sub-sección</h4>
                <p class="text-[11px] text-text-muted">Así es exactamente como se organizarán los campos y dimensiones en la ficha</p>
              </div>
            </div>

            <button type="button" @click="viewMode = 'editor'; $nextTick(() => window.lucide?.createIcons?.())"
              class="px-3 py-1.5 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 text-xs font-mono font-bold text-slate-300 hover:text-white flex items-center gap-1.5 cursor-pointer">
              <i data-lucide="sliders" class="w-3.5 h-3.5"></i>
              <span>Volver a Editar</span>
            </button>
          </div>

          <!-- RENDERIZADO IDÉNTICO A LA FICHA -->
          <div class="form-card space-y-4 p-5 sm:p-6"
            :style="\`border-left-color: \${$store.characters.blockBuilderForm.accentColor || '#eab308'};\`">
            
            <!-- Encabezado de la Sub-sección -->
            <div class="flex items-center gap-2 border-b border-parchment-brown/20 pb-2">
              <i :data-lucide="$store.characters.blockBuilderForm.icon || 'layers'" class="w-4.5 h-4.5"
                :style="\`color: \${$store.characters.blockBuilderForm.accentColor || '#eab308'};\`"></i>
              <h4 class="text-xs sm:text-sm font-mono font-bold uppercase tracking-wider"
                :style="\`color: \${$store.characters.blockBuilderForm.accentColor || '#eab308'};\`"
                x-text="$store.characters.blockBuilderForm.title || 'Sub-sección Modular'"></h4>
            </div>

            <!-- Cuadrícula de 12 Columnas -->
            <div class="grid grid-cols-1 md:grid-cols-12 gap-4">
              <template x-for="(f, fIndex) in ($store.characters.blockBuilderForm.fields || []).filter(Boolean)" :key="f?.id || fIndex">
                <div class="space-y-1.5"
                  :class="(f?.type === 'divider' || f?.type === 'spacer') ? 'col-span-12' : (f?.width === 'half') ? 'col-span-12 md:col-span-6' : (f?.width === 'third') ? 'col-span-12 md:col-span-4' : (f?.width === 'quarter') ? 'col-span-12 sm:col-span-6 md:col-span-3' : 'col-span-12'">
                  
                  <!-- Vista Previa de Separador (Natural, sin recuadro) -->
                  <template x-if="f?.type === 'divider'">
                    <div class="py-3 flex items-center gap-4 w-full my-1">
                      <div class="h-px bg-white/20 flex-1"></div>
                      <span x-show="f?.label && f.label.trim()"
                        class="text-xs font-mono font-bold uppercase tracking-widest text-white px-3 py-0.5 select-none"
                        x-text="f.label"></span>
                      <div class="h-px bg-white/20 flex-1"></div>
                    </div>
                  </template>

                  <!-- Vista Previa de Espacio -->
                  <template x-if="f?.type === 'spacer'">
                    <div class="py-2"></div>
                  </template>

                  <!-- Tarjeta estándar para otros campos -->
                  <template x-if="f?.type !== 'divider' && f?.type !== 'spacer'">
                    <div class="read-card border-l-4 h-full flex flex-col justify-between"
                      :style="\`border-left-color: \${f?.color || $store.characters.blockBuilderForm.accentColor || '#eab308'};\`">
                      
                      <div>
                        <span class="read-label"
                          :style="\`color: \${f?.color || $store.characters.blockBuilderForm.accentColor || '#eab308'};\`">
                          <i :data-lucide="f?.icon || (f?.type === 'stat' ? 'gauge' : f?.type === 'input' ? 'type' : 'file-text')" class="w-3.5 h-3.5"></i>
                          <span x-text="f?.label || 'Campo'"></span>
                        </span>

                        <!-- Vista de Texto -->
                        <template x-if="f?.type === 'textarea'">
                          <p class="read-value text-xs text-text-muted italic pt-1" x-text="f?.placeholder || 'Área de texto multilínea para notas, descripciones y relatos...'"></p>
                        </template>

                        <!-- Vista de Input -->
                        <template x-if="f?.type === 'input'">
                          <p class="read-value text-xs font-mono font-bold pt-1"
                            :style="\`color: \${f?.color || $store.characters.blockBuilderForm.accentColor || '#00f0ff'};\`"
                            x-text="f?.placeholder || 'Texto corto / entrada monolínea'"></p>
                        </template>
                      </div>

                      <!-- Vista de Medidor -->
                      <template x-if="f?.type === 'stat'">
                        <div class="space-y-1.5 pt-2">
                          <div class="flex items-center justify-between text-xs font-mono font-bold">
                            <span class="text-parchment-cream">10 / 20 pts</span>
                          </div>
                          <div class="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                            <div class="h-full rounded-full w-1/2" :style="\`background-color: \${f?.color || '#a855f7'};\`"></div>
                          </div>
                        </div>
                      </template>

                      <!-- Vista Previa de Imagen / GIF -->
                      <template x-if="f?.type === 'image'">
                        <div class="pt-2">
                          <div class="w-full aspect-video rounded-lg border border-dashed border-rose-500/40 bg-black/60 flex flex-col items-center justify-center gap-1 text-slate-400 p-4">
                            <i data-lucide="image" class="w-8 h-8 text-rose-400/70"></i>
                            <span class="text-[10px] font-mono font-bold text-slate-300 uppercase">Vista previa: Imagen o GIF (16:9 Widescreen)</span>
                            <span class="text-[9px] font-mono text-slate-500">Soporta arrastrar archivo o cargar desde enlace</span>
                          </div>
                        </div>
                      </template>

                      <!-- Vista Previa de Categoría / Tipo -->
                      <template x-if="f?.type === 'badge_select'">
                        <div class="pt-2 flex items-center gap-1.5 flex-wrap">
                          <template x-for="(opt, oIdx) in (f?.optionsText ? f.optionsText.split(',').map(s => s.trim()).filter(Boolean) : ['Activa', 'Pasiva'])" :key="oIdx">
                            <span class="px-2.5 py-1 rounded-md text-[10px] font-mono font-bold border"
                              :class="oIdx === 0 ? 'bg-emerald-500/25 border-emerald-400/50 text-emerald-300 shadow-sm' : 'bg-white/5 border-white/10 text-slate-400'"
                              x-text="opt"></span>
                          </template>
                        </div>
                      </template>

                      <!-- Vista Previa de Tiempos y Recursos -->
                      <template x-if="f?.type === 'time_cost'">
                        <div class="pt-2 grid grid-cols-3 gap-2">
                          <div class="px-2 py-1 rounded bg-black/50 border border-white/10 text-center text-[10px] font-mono text-sky-300">
                            <span class="text-slate-500 block text-[9px]">TD</span> 3 Turnos
                          </div>
                          <div class="px-2 py-1 rounded bg-black/50 border border-white/10 text-center text-[10px] font-mono text-amber-300">
                            <span class="text-slate-500 block text-[9px]">CD</span> 2 Turnos
                          </div>
                          <div class="px-2 py-1 rounded bg-black/50 border border-white/10 text-center text-[10px] font-mono text-purple-300">
                            <span class="text-slate-500 block text-[9px]">Coste</span> 15 PM
                          </div>
                        </div>
                      </template>

                      <!-- Vista Previa de Rareza -->
                      <template x-if="f?.type === 'rarity'">
                        <div class="pt-2">
                          <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-500/15 border border-blue-400/50 text-blue-300 text-xs font-mono font-bold shadow-[0_0_10px_rgba(59,130,246,0.3)]">
                            <i data-lucide="gem" class="w-3.5 h-3.5 text-blue-400"></i>
                            <span>Calidad: Raro</span>
                          </span>
                        </div>
                      </template>

                    </div>
                  </template>
                </div>
              </template>
            </div>

          </div>

        </div>

      </div>

      <!-- ══════════════════════════════════════════════════════════
           BARRA INFERIOR (FOOTER): ACCIONES FINALES
           ══════════════════════════════════════════════════════════ -->
      <div class="px-5 sm:px-6 py-3.5 bg-black/70 border-t border-white/10 flex items-center justify-between gap-3 shrink-0">
        <span class="text-[11px] font-mono text-text-muted hidden sm:inline"
          x-text="viewMode === 'canvas' ? 'Organiza y redimensiona tus bloques en la pizarra interactiva' : viewMode === 'editor' ? 'Ajusta detalles finos de cada campo en la lista' : 'Vista previa exacta de cómo se verá en tu ficha'"></span>

        <div class="flex items-center gap-3 ml-auto">
          <button type="button" @click="$store.characters.closeBlockBuilder()"
            class="px-4 py-2 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-xs font-mono font-bold text-slate-300 transition-colors cursor-pointer">
            Cancelar
          </button>

          <button type="button" @click="$store.characters.saveBlockBuilder()"
            class="px-5 py-2 rounded-xl text-xs font-mono font-bold text-black transition-all flex items-center gap-2 cursor-pointer shadow-lg hover:brightness-110"
            :style="\`background-color: \${$store.characters.blockBuilderForm.accentColor || '#eab308'};\`">
            <i data-lucide="check" class="w-4 h-4"></i>
            <span x-text="$store.characters.blockBuilderBlockIndex !== null ? 'Actualizar Sub-sección' : 'Guardar y Añadir a la Sección'"></span>
          </button>
        </div>
      </div>

    </div>
  </template>

</div>
`;
}
