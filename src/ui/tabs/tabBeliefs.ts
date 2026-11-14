/**
 * @file src/ui/tabs/tabBeliefs.ts
 */

export function renderTabBeliefs(): string {
  return `<!-- =========================================================
           PESTAÑA 5: CREENCIAS
           ========================================================= -->
          <div x-show="$store.app.currentTab === 'beliefs'" class="space-y-6" data-tab-section="beliefs">
            <div class="form-card space-y-6">
              <!-- Encabezado Principal de la Pestaña -->
              <div class="flex items-center justify-between border-b border-parchment-brown/20 pb-3">
                <div class="flex items-center gap-3">
                  <div
                    class="category-header-icon-box w-9 h-9 rounded-xl bg-accent-cyan/15 border border-accent-cyan/40 flex items-center justify-center text-accent-cyan shrink-0"
                    style="box-shadow: 0 0 12px var(--accent-glow);">
                    <i data-lucide="compass" class="w-4.5 h-4.5"></i>
                  </div>
                  <div>
                    <h3 class="category-header-title">Creencias, Dogma y Filosofía de Vida</h3>
                    <p class="category-header-desc">Valores rectores, marco espiritual, psicología interna y
                      contradicciones morales del personaje.</p>
                  </div>
                </div>
                <span
                  class="text-[11px] font-mono text-ink-slate/80 uppercase tracking-widest px-2.5 py-1 rounded-md bg-white/[0.03] border border-white/5 hidden sm:inline-block">Filosofía
                  y Marco Espiritual</span>
              </div>

              <!-- MODO EDICIÓN -->
              <div x-show="$store.app.editMode" class="space-y-6">

                <!-- ──── MÓDULO 1: FILOSOFÍA CENTRAL, FE y COSMOVISIÓN ──── -->
                <div class="p-4 rounded-xl border border-accent-gold/25 bg-black/40 space-y-4">
                  <div class="flex items-center gap-2 border-b border-white/10 pb-2">
                    <i data-lucide="book-open" class="w-4 h-4 text-accent-gold"></i>
                    <h4 class="text-xs font-mono font-bold uppercase tracking-wider text-accent-gold">Filosofía Central,
                      Fe y Cosmovisión</h4>
                  </div>

                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label class="form-label flex items-center gap-1.5">
                        <i data-lucide="scale" class="w-3.5 h-3.5 text-accent-gold/80"></i> Código Moral / Filosofía
                        Rectora
                      </label>
                      <textarea class="form-textarea" rows="3" x-model="$store.characters.active.beliefs.moralCode"
                        @input="$store.characters.scheduleAutoSave()"
                        placeholder=""></textarea>
                    </div>

                    <div>
                      <label class="form-label flex items-center gap-1.5">
                        <i data-lucide="sun" class="w-3.5 h-3.5 text-accent-gold/80"></i> Religión / Fe / Dogma
                      </label>
                      <textarea class="form-textarea" rows="3" x-model="$store.characters.active.beliefs.religion"
                        @input="$store.characters.scheduleAutoSave()"
                        placeholder=""></textarea>
                    </div>
                  </div>

                  <div>
                    <label class="form-label flex items-center gap-1.5">
                      <i data-lucide="globe" class="w-3.5 h-3.5 text-accent-cyan"></i> Visión del Mundo / Cosmovisión
                    </label>
                    <textarea class="form-textarea" rows="2" x-model="$store.characters.active.beliefs.worldview"
                      @input="$store.characters.scheduleAutoSave()"
                      placeholder=""></textarea>
                  </div>
                </div>

                <!-- ──── MÓDULO 2: IDENTIDAD INTERNA y PSICOLOGÍA DE CREENCIAS ──── -->
                <div class="p-4 rounded-xl border border-accent-cyan/25 bg-black/40 space-y-4">
                  <div class="flex items-center gap-2 border-b border-white/10 pb-2">
                    <i data-lucide="user-check" class="w-4 h-4 text-accent-cyan"></i>
                    <h4 class="text-xs font-mono font-bold uppercase tracking-wider text-accent-cyan">Identidad Interna
                      y Psicología de Creencias</h4>
                  </div>

                  <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div class="md:col-span-1">
                      <label class="form-label flex items-center gap-1.5">
                        <i data-lucide="user-round" class="w-3.5 h-3.5 text-accent-cyan"></i> Autoimagen / Creencia
                        sobre sí mismo
                      </label>
                      <textarea class="form-textarea text-xs" rows="3"
                        x-model="$store.characters.active.beliefs.selfImage"
                        @input="$store.characters.scheduleAutoSave()"
                        placeholder=""></textarea>
                    </div>

                    <div class="md:col-span-1">
                      <label class="form-label flex items-center gap-1.5">
                        <i data-lucide="zap" class="w-3.5 h-3.5 text-amber-400"></i> Origen o Evento Detonante
                      </label>
                      <textarea class="form-textarea text-xs" rows="3"
                        x-model="$store.characters.active.beliefs.originEvent"
                        @input="$store.characters.scheduleAutoSave()"
                        placeholder=""></textarea>
                    </div>

                    <div class="md:col-span-1">
                      <label class="form-label flex items-center gap-1.5">
                        <i data-lucide="crown" class="w-3.5 h-3.5 text-purple-400"></i> Actitud ante la Autoridad
                      </label>
                      <textarea class="form-textarea text-xs" rows="3"
                        x-model="$store.characters.active.beliefs.authorityStance"
                        @input="$store.characters.scheduleAutoSave()"
                        placeholder=""></textarea>
                    </div>
                  </div>
                </div>

                <!-- ──── MÓDULO 3: TENSIONES MORALES, SESGOS y CONTRADICCIONES ──── -->
                <div class="p-4 rounded-xl border border-purple-500/25 bg-black/40 space-y-4">
                  <div class="flex items-center gap-2 border-b border-white/10 pb-2">
                    <i data-lucide="scale" class="w-4 h-4 text-purple-400"></i>
                    <h4 class="text-xs font-mono font-bold uppercase tracking-wider text-purple-400">Tensiones Morales,
                      Sesgos y Puntos Ciegos</h4>
                  </div>

                  <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div class="md:col-span-1">
                      <label class="form-label flex items-center gap-1.5">
                        <i data-lucide="split" class="w-3.5 h-3.5 text-purple-400"></i> Creencia Declarada vs. Activa
                      </label>
                      <textarea class="form-textarea text-xs" rows="3"
                        x-model="$store.characters.active.beliefs.statedVsActive"
                        @input="$store.characters.scheduleAutoSave()"
                        placeholder=""></textarea>
                    </div>

                    <div class="md:col-span-1">
                      <label class="form-label flex items-center gap-1.5">
                        <i data-lucide="eye-off" class="w-3.5 h-3.5 text-amber-400"></i> Contradicciones y Puntos Ciegos
                      </label>
                      <textarea class="form-textarea text-xs" rows="3"
                        x-model="$store.characters.active.beliefs.blindSpots"
                        @input="$store.characters.scheduleAutoSave()"
                        placeholder=""></textarea>
                    </div>

                    <div class="md:col-span-1">
                      <label class="form-label flex items-center gap-1.5">
                        <i data-lucide="alert-triangle" class="w-3.5 h-3.5 text-rose-400"></i> Prejuicios y Sesgos
                      </label>
                      <textarea class="form-textarea text-xs" rows="3"
                        x-model="$store.characters.active.beliefs.biasesPrejudices"
                        @input="$store.characters.scheduleAutoSave()"
                        placeholder=""></textarea>
                    </div>
                  </div>
                </div>

                <!-- ──── MÓDULO 4: AFECTOS, RECHAZOS y LÍMITES MORALES ──── -->
                <div class="p-4 rounded-xl border border-accent-ruby/25 bg-black/40 space-y-4">
                  <div class="flex items-center gap-2 border-b border-white/10 pb-2">
                    <i data-lucide="shield-alert" class="w-4 h-4 text-accent-ruby"></i>
                    <h4 class="text-xs font-mono font-bold uppercase tracking-wider text-accent-ruby">Afectos, Rechazos
                      y Límites Innegociables</h4>
                  </div>

                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label class="form-label flex items-center gap-1.5 text-accent-forest">
                        <i data-lucide="heart" class="w-3.5 h-3.5"></i> Lo que Ama / Valora
                      </label>
                      <textarea class="form-textarea" rows="2" x-model="$store.characters.active.beliefs.loves"
                        @input="$store.characters.scheduleAutoSave()"
                        placeholder=""></textarea>
                    </div>

                    <div>
                      <label class="form-label flex items-center gap-1.5 text-accent-ruby">
                        <i data-lucide="flame" class="w-3.5 h-3.5"></i> Lo que Odia / Detesta
                      </label>
                      <textarea class="form-textarea" rows="2" x-model="$store.characters.active.beliefs.hates"
                        @input="$store.characters.scheduleAutoSave()"
                        placeholder=""></textarea>
                    </div>
                  </div>

                  <!-- Línea Roja Destacada -->
                  <div class="p-3 rounded-lg bg-accent-ruby/10 border border-accent-ruby/30">
                    <label class="form-label flex items-center gap-1.5 text-accent-ruby font-bold">
                      <i data-lucide="shield-x" class="w-4 h-4"></i> Línea Roja Infranqueable / Precio Inaceptable
                    </label>
                    <input type="text"
                      class="form-input text-accent-ruby font-medium bg-black/60 border-accent-ruby/40 focus:border-accent-ruby"
                      x-model="$store.characters.active.beliefs.redLine" @input="$store.characters.scheduleAutoSave()"
                      placeholder="" />
                    <span class="text-[11px] text-accent-ruby/80 mt-1 block">El principio ético o precio que el personaje nunca cruzará ni pagará bajo ninguna circunstancia sin quebrar su identidad.</span>
                  </div>

                  <div>
                    <label class="form-label flex items-center gap-1.5 text-ink-slate">
                      <i data-lucide="clover" class="w-3.5 h-3.5 text-emerald-400"></i> Supersticiones / Creencias
                      Menores
                    </label>
                    <textarea class="form-textarea" rows="2" x-model="$store.characters.active.beliefs.superstitions"
                      @input="$store.characters.scheduleAutoSave()"
                      placeholder=""></textarea>
                  </div>
                </div>

              </div>

              <!-- MODO LECTURA / VISTA PREVIA -->
              <div x-show="!$store.app.editMode" class="space-y-6">

                <!-- ──── MÓDULO 1: FILOSOFÍA CENTRAL y FE (LECTURA) ──── -->
                <div class="space-y-3">
                  <div class="flex items-center gap-2 border-b border-parchment-brown/20 pb-1.5">
                    <i data-lucide="book-open" class="w-4 h-4 text-accent-gold"></i>
                    <h4 class="text-xs font-mono font-bold uppercase tracking-wider text-accent-gold">Filosofía Central,
                      Fe y Cosmovisión</h4>
                  </div>
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div class="read-card">
                      <span class="read-label"><i data-lucide="scale" class="w-3.5 h-3.5"></i> Código Moral /
                        Filosofía</span>
                      <p class="read-value font-serif italic"
                        x-html="$store.app.formatRichText($store.characters.active?.beliefs.moralCode) || 'Sin detallar'"></p>
                    </div>
                    <div class="read-card">
                      <span class="read-label"><i data-lucide="sun" class="w-3.5 h-3.5"></i> Religión / Fe /
                        Dogma</span>
                      <p class="read-value"
                        x-html="$store.app.formatRichText($store.characters.active?.beliefs.religion) || 'Sin religión declarada'"></p>
                    </div>
                    <div class="read-card sm:col-span-2">
                      <span class="read-label"><i data-lucide="globe" class="w-3.5 h-3.5 text-accent-cyan"></i> Visión
                        del Mundo / Cosmovisión</span>
                      <p class="read-value" x-html="$store.app.formatRichText($store.characters.active?.beliefs.worldview) || 'Sin detallar'"></p>
                    </div>
                  </div>
                </div>

                <!-- ──── MÓDULO 2: IDENTIDAD INTERNA y PSICOLOGÍA (LECTURA) ──── -->
                <div class="space-y-3">
                  <div class="flex items-center gap-2 border-b border-parchment-brown/20 pb-1.5">
                    <i data-lucide="user-check" class="w-4 h-4 text-accent-cyan"></i>
                    <h4 class="text-xs font-mono font-bold uppercase tracking-wider text-accent-cyan">Identidad Interna
                      y Psicología de Creencias</h4>
                  </div>
                  <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div class="read-card">
                      <span class="read-label"><i data-lucide="user-round" class="w-3.5 h-3.5"></i> Autoimagen /
                        Creencia de sí mismo</span>
                      <p class="read-value text-xs"
                        x-html="$store.app.formatRichText($store.characters.active?.beliefs.selfImage) || 'Sin detallar'"></p>
                    </div>
                    <div class="read-card">
                      <span class="read-label"><i data-lucide="zap" class="w-3.5 h-3.5 text-amber-400"></i> Origen /
                        Evento Detonante</span>
                      <p class="read-value text-xs"
                        x-html="$store.app.formatRichText($store.characters.active?.beliefs.originEvent) || 'Sin detallar'"></p>
                    </div>
                    <div class="read-card">
                      <span class="read-label"><i data-lucide="crown" class="w-3.5 h-3.5 text-purple-400"></i> Actitud
                        ante la Autoridad</span>
                      <p class="read-value text-xs"
                        x-html="$store.app.formatRichText($store.characters.active?.beliefs.authorityStance) || 'Sin detallar'"></p>
                    </div>
                  </div>
                </div>

                <!-- ──── MÓDULO 3: TENSIONES MORALES y SESGOS (LECTURA) ──── -->
                <div class="space-y-3">
                  <div class="flex items-center gap-2 border-b border-parchment-brown/20 pb-1.5">
                    <i data-lucide="scale" class="w-4 h-4 text-purple-400"></i>
                    <h4 class="text-xs font-mono font-bold uppercase tracking-wider text-purple-400">Tensiones Morales,
                      Sesgos y Puntos Ciegos</h4>
                  </div>
                  <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div class="read-card">
                      <span class="read-label"><i data-lucide="split" class="w-3.5 h-3.5 text-purple-400"></i> Creencia
                        Declarada vs. Activa</span>
                      <p class="read-value text-xs"
                        x-html="$store.app.formatRichText($store.characters.active?.beliefs.statedVsActive) || 'Sin detallar'"></p>
                    </div>
                    <div class="read-card">
                      <span class="read-label"><i data-lucide="eye-off" class="w-3.5 h-3.5 text-amber-400"></i>
                        Contradicciones y Puntos Ciegos</span>
                      <p class="read-value text-xs"
                        x-html="$store.app.formatRichText($store.characters.active?.beliefs.blindSpots) || 'Sin detallar'"></p>
                    </div>
                    <div class="read-card">
                      <span class="read-label"><i data-lucide="alert-triangle" class="w-3.5 h-3.5 text-rose-400"></i>
                        Prejuicios y Sesgos</span>
                      <p class="read-value text-xs"
                        x-html="$store.app.formatRichText($store.characters.active?.beliefs.biasesPrejudices) || 'Sin detallar'"></p>
                    </div>
                  </div>
                </div>

                <!-- ──── MÓDULO 4: AFECTOS y LÍMITES MORALES (LECTURA) ──── -->
                <div class="space-y-3">
                  <div class="flex items-center gap-2 border-b border-parchment-brown/20 pb-1.5">
                    <i data-lucide="shield-alert" class="w-4 h-4 text-accent-ruby"></i>
                    <h4 class="text-xs font-mono font-bold uppercase tracking-wider text-accent-ruby">Afectos, Rechazos
                      y Límites Innegociables</h4>
                  </div>
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div class="read-card">
                      <span class="read-label text-accent-forest"><i data-lucide="heart" class="w-3.5 h-3.5"></i> Lo que
                        Ama / Valora</span>
                      <p class="read-value" x-html="$store.app.formatRichText($store.characters.active?.beliefs.loves) || 'Sin detallar'"></p>
                    </div>
                    <div class="read-card">
                      <span class="read-label text-accent-ruby"><i data-lucide="flame" class="w-3.5 h-3.5"></i> Lo que
                        Odia / Detesta</span>
                      <p class="read-value" x-html="$store.app.formatRichText($store.characters.active?.beliefs.hates) || 'Sin detallar'"></p>
                    </div>
                  </div>

                  <div class="read-card border-l-4 border-l-accent-ruby bg-accent-ruby/5">
                    <span class="read-label text-accent-ruby font-bold"><i data-lucide="shield-x"
                        class="w-3.5 h-3.5"></i> Línea Roja Infranqueable / Precio Inaceptable</span>
                    <p class="read-value font-medium text-accent-ruby/90 text-sm"
                      x-html="$store.app.formatRichText($store.characters.active?.beliefs.redLine) || 'Sin definir'"></p>
                  </div>

                  <div class="read-card">
                    <span class="read-label"><i data-lucide="clover" class="w-3.5 h-3.5 text-emerald-400"></i>
                      Supersticiones / Creencias Menores</span>
                    <p class="read-value" x-html="$store.app.formatRichText($store.characters.active?.beliefs.superstitions) || 'Ninguna'"></p>
                  </div>
                </div>

              </div>

            </div>
          </div>
`;
}
