import { compressImageWithStats } from '@core/media/imageCompressor.js';
import { fetchImageAsFileFromUrl } from '@core/media/mediaUrlEngine.js';

export function createCustomTabMethods() {
  return {
    // ── GESTIÓN DEL MODAL DE SECCIÓN GENERAL ───────────────────────
    customTabModalOpen: false,
    customTabEditingId: null,
    customTabForm: {
      label: '',
      icon: 'layers',
      description: '',
      accentColor: '#00F0FF',
      template: 'blank'
    },

    openCreateCustomTabModal(tabIdToEdit = null) {
      const char = this.active || window.Alpine?.store('characters')?.active;
      if (!char) {
        window.Alpine?.store('app')?.toast?.('Selecciona o crea un personaje primero.', 'warning');
        return;
      }
      if (!Array.isArray(char.customTabs)) {
        char.customTabs = [];
      }

      if (tabIdToEdit) {
        const existing = char.customTabs.find(t => t.id === tabIdToEdit);
        if (existing) {
          this.customTabEditingId = tabIdToEdit;
          this.customTabForm = {
            label: existing.label || '',
            icon: existing.icon || 'layers',
            description: existing.description || '',
            accentColor: existing.accentColor || '#00F0FF',
            template: 'blank'
          };
          this.customTabModalOpen = true;
          setTimeout(() => window.lucide?.createIcons?.(), 50);
          return;
        }
      }

      // Modo creación nueva
      this.customTabEditingId = null;
      this.customTabForm = {
        label: '',
        icon: 'layers',
        description: '',
        accentColor: '#00F0FF',
        template: 'blank'
      };
      this.customTabModalOpen = true;
      setTimeout(() => window.lucide?.createIcons?.(), 50);
    },

    closeCustomTabModal() {
      this.customTabModalOpen = false;
      this.customTabEditingId = null;
    },

    saveCustomTabModal() {
      if (!this.active) return;
      if (!Array.isArray(this.active.customTabs)) {
        this.active.customTabs = [];
      }

      const form = this.customTabForm;
      const label = (form.label || '').trim() || 'Nueva Sección';
      const icon = form.icon || 'layers';
      const description = (form.description || '').trim();
      const accentColor = form.accentColor || '#00F0FF';

      const appStore = window.Alpine?.store('app');

      if (this.customTabEditingId) {
        // Editar existente
        const target = this.active.customTabs.find(t => t.id === this.customTabEditingId);
        if (target) {
          target.label = label;
          target.icon = icon;
          target.description = description;
          target.accentColor = accentColor;
          this.scheduleAutoSave();
          if (appStore) {
            appStore.tabsVersion++;
            appStore.toast(`Sección "${label}" actualizada.`, 'success');
          }
        }
      } else {
        // Crear nueva sección
        const newId = `custom_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
        let initialBlocks = [];

        // Plantilla inicial opcional para la pestaña completa
        if (form.template === 'mind') {
          initialBlocks.push({
            id: `blk_${crypto.randomUUID().slice(0, 8)}`,
            title: 'Perfil Psicológico y Arquetipo',
            icon: 'brain',
            accentColor: '#eab308',
            fields: [
              {
                id: `fld_${crypto.randomUUID().slice(0, 8)}`,
                label: 'Resumen de Personalidad y Temperamento',
                icon: 'smile',
                type: 'textarea',
                width: 'full',
                placeholder: 'Cómo se comporta en el día a día, trato con desconocidos, temperamento y presencia social...',
                color: '#eab308',
                value: ''
              },
              {
                id: `fld_${crypto.randomUUID().slice(0, 8)}`,
                label: 'Virtudes / Rasgos Positivos',
                icon: 'check-circle',
                type: 'textarea',
                width: 'third',
                placeholder: 'Ej: Leal, perseverante, empático, disciplinado...',
                color: '#10b981',
                value: ''
              },
              {
                id: `fld_${crypto.randomUUID().slice(0, 8)}`,
                label: 'Defectos / Rasgos Negativos',
                icon: 'alert-circle',
                type: 'textarea',
                width: 'third',
                placeholder: 'Ej: Orgulloso, impulsivo, rencoroso, desconfiado...',
                color: '#f43f5e',
                value: ''
              },
              {
                id: `fld_${crypto.randomUUID().slice(0, 8)}`,
                label: 'MBTI / Arquetipo Psicológico',
                icon: 'cpu',
                type: 'input',
                width: 'third',
                placeholder: 'Ej: INTJ / El Estratega / El Rebelde Trágico',
                color: '#00f0ff',
                value: ''
              }
            ]
          });
        }

        const newTab = {
          id: newId,
          label,
          icon,
          description,
          accentColor,
          blocks: initialBlocks
        };

        this.active.customTabs.push(newTab);

        if (!Array.isArray(this.active.activeTabs)) {
          this.active.activeTabs = [];
        }
        if (!this.active.activeTabs.includes(newId)) {
          this.active.activeTabs.push(newId);
        }

        if (appStore) {
          if (!Array.isArray(appStore.activeTabs)) {
            appStore.activeTabs = [];
          }
          if (!appStore.activeTabs.includes(newId)) {
            appStore.activeTabs.push(newId);
          }
          appStore.tabsVersion++;
          appStore.setTab(newId);
          appStore.toast(`¡Sección "${label}" creada con éxito!`, 'success');
        }

        this.scheduleAutoSave();
      }

      this.closeCustomTabModal();
    },

    deleteCustomTab(tabId) {
      if (!this.active || !Array.isArray(this.active.customTabs)) return;
      const idx = this.active.customTabs.findIndex(t => t.id === tabId);
      if (idx === -1) return;

      const tabLabel = this.active.customTabs[idx].label || 'Sección';

      if (typeof this.pushUndoSnapshot === 'function') {
        this.pushUndoSnapshot(`Eliminar sección "${tabLabel}"`);
      }

      this.active.customTabs.splice(idx, 1);

      if (Array.isArray(this.active.activeTabs)) {
        this.active.activeTabs = this.active.activeTabs.filter(id => id !== tabId);
      }

      const appStore = window.Alpine?.store('app');
      if (appStore) {
        if (Array.isArray(appStore.activeTabs)) {
          appStore.activeTabs = appStore.activeTabs.filter(id => id !== tabId);
        }
        appStore.tabsVersion++;
        if (appStore.currentTab === tabId) {
          appStore.setTab(appStore.activeTabs[0] || 'basics');
        }
        appStore.toast(`Sección "${tabLabel}" eliminada.`, 'info', {
          label: 'DESHACER (Ctrl+Z)',
          onClick: () => this.undo(),
          duration: 6000
        });
      }

      this.scheduleAutoSave();
    },

    getCustomTab(tabId) {
      if (!this.active || !Array.isArray(this.active.customTabs)) return null;
      return this.active.customTabs.find(t => t.id === tabId) || null;
    },

    // ── CAJA DE HERRAMIENTAS: DISEÑADOR DE SUB-SECCIÓN / BLOQUE ─────
    blockBuilderModalOpen: false,
    blockBuilderTabId: null,
    blockBuilderBlockIndex: null,
    blockBuilderForm: {
      title: '',
      icon: 'layers',
      accentColor: '#eab308',
      fields: []
    },

    openBlockBuilder(tabId, blockIndex = null) {
      const tab = this.getCustomTab(tabId);
      if (!tab) {
        window.Alpine?.store('app')?.toast?.('No se encontró la sección activa.', 'warning');
        return;
      }

      this.blockBuilderTabId = tabId;
      this.blockBuilderBlockIndex = blockIndex;

      if (blockIndex !== null && Array.isArray(tab.blocks) && tab.blocks[blockIndex]) {
        // Modo Edición de un bloque existente
        const existing = tab.blocks[blockIndex];
        let loadedFields = [];

        if (Array.isArray(existing.fields)) {
          // Copia profunda y sanitización de campos existentes
          loadedFields = existing.fields.filter(Boolean).map(f => ({
            id: f.id || `fld_${crypto.randomUUID().slice(0, 8)}`,
            label: f.label || 'Campo',
            icon: f.icon || (f.type === 'stat' ? 'gauge' : f.type === 'input' ? 'tag' : f.type === 'image' ? 'image' : f.type === 'badge_select' ? 'tags' : f.type === 'time_cost' ? 'clock' : f.type === 'rarity' ? 'gem' : f.type === 'divider' ? 'minus' : f.type === 'spacer' ? 'space' : 'file-text'),
            type: f.type || 'textarea',
            width: f.width || 'full',
            placeholder: f.placeholder || '',
            color: f.color || existing.accentColor || tab.accentColor || '#eab308',
            value: f.value !== undefined ? f.value : (f.type === 'rarity' ? 'raro' : f.type === 'badge_select' ? 'Activa' : ''),
            current: f.current !== undefined ? f.current : 0,
            max: f.max !== undefined ? f.max : 100,
            unit: f.unit || 'pts',
            imageTransform: f.imageTransform || '',
            imageFit: f.imageFit || 'cover',
            imageIsGif: !!f.imageIsGif,
            aspectRatio: f.aspectRatio || '16/9',
            optionsText: f.optionsText || (Array.isArray(f.options) ? f.options.join(', ') : 'Activa, Pasiva'),
            td: f.td || '',
            cd: f.cd || '',
            cost: f.cost || ''
          }));
        } else if (existing.type === 'text') {
          // Normalizar bloque antiguo de texto libre
          loadedFields = [{
            id: `fld_${crypto.randomUUID().slice(0, 8)}`,
            label: 'Crónica / Notas',
            icon: 'scroll-text',
            type: 'textarea',
            width: 'full',
            placeholder: 'Escribe aquí...',
            color: existing.accentColor || tab.accentColor || '#00f0ff',
            value: existing.content || ''
          }];
        } else if (existing.type === 'attributes' && Array.isArray(existing.items)) {
          // Normalizar atributos antiguos
          loadedFields = existing.items.filter(Boolean).map(it => ({
            id: it.id || `fld_${crypto.randomUUID().slice(0, 8)}`,
            label: it.label || 'Parámetro',
            icon: 'gauge',
            type: 'stat',
            width: 'third',
            placeholder: '',
            color: it.color || '#a855f7',
            current: it.current || 0,
            max: it.max || 100,
            unit: it.unit || 'pts',
            value: ''
          }));
        }

        this.blockBuilderForm = {
          title: existing.title || 'Sub-sección Modular',
          icon: existing.icon || 'layers',
          accentColor: existing.accentColor || tab.accentColor || '#eab308',
          fields: loadedFields
        };
      } else {
        // Modo Creación Nueva: Inicializar con plantilla balanceada
        this.blockBuilderForm = {
          title: 'Sub-sección Modular',
          icon: 'layers',
          accentColor: tab.accentColor || '#eab308',
          fields: [
            {
              id: `fld_${crypto.randomUUID().slice(0, 8)}`,
              label: 'Resumen Principal',
              icon: 'smile',
              type: 'textarea',
              width: 'full',
              placeholder: 'Detalles, descripción general o síntesis...',
              color: tab.accentColor || '#eab308',
              value: ''
            },
            {
              id: `fld_${crypto.randomUUID().slice(0, 8)}`,
              label: 'Aspectos Destacados',
              icon: 'check-circle',
              type: 'textarea',
              width: 'half',
              placeholder: 'Puntos fuertes o notas relevantes...',
              color: '#10b981',
              value: ''
            },
            {
              id: `fld_${crypto.randomUUID().slice(0, 8)}`,
              label: 'Consideraciones / Puntos Clave',
              icon: 'alert-circle',
              type: 'textarea',
              width: 'half',
              placeholder: 'Limitaciones, advertencias o detalles...',
              color: '#f43f5e',
              value: ''
            }
          ]
        };
      }

      this.blockBuilderModalOpen = true;
      setTimeout(() => window.lucide?.createIcons?.(), 60);
    },

    closeBlockBuilder() {
      this.blockBuilderModalOpen = false;
      this.blockBuilderTabId = null;
      this.blockBuilderBlockIndex = null;
    },

    applyBlockTemplate(templateKey) {
      const color = this.blockBuilderForm.accentColor || '#eab308';

      if (templateKey === 'mind') {
        // Idéntico a Captura 1: Perfil Psicológico y Arquetipo
        this.blockBuilderForm.title = 'Perfil Psicológico y Arquetipo';
        this.blockBuilderForm.icon = 'brain';
        this.blockBuilderForm.accentColor = '#eab308';
        this.blockBuilderForm.fields = [
          {
            id: `fld_${crypto.randomUUID().slice(0, 8)}`,
            label: 'Resumen de Personalidad y Temperamento',
            icon: 'smile',
            type: 'textarea',
            width: 'full',
            placeholder: 'Cómo se comporta en el día a día, trato con desconocidos, temperamento y presencia social...',
            color: '#eab308',
            value: ''
          },
          {
            id: `fld_${crypto.randomUUID().slice(0, 8)}`,
            label: 'Virtudes / Rasgos Positivos',
            icon: 'check-circle',
            type: 'textarea',
            width: 'third',
            placeholder: 'Ej: Leal, perseverante, empático, disciplinado...',
            color: '#10b981',
            value: ''
          },
          {
            id: `fld_${crypto.randomUUID().slice(0, 8)}`,
            label: 'Defectos / Rasgos Negativos',
            icon: 'alert-circle',
            type: 'textarea',
            width: 'third',
            placeholder: 'Ej: Orgulloso, impulsivo, rencoroso, desconfiado...',
            color: '#f43f5e',
            value: ''
          },
          {
            id: `fld_${crypto.randomUUID().slice(0, 8)}`,
            label: 'MBTI / Arquetipo Psicológico',
            icon: 'cpu',
            type: 'input',
            width: 'third',
            placeholder: 'Ej: INTJ / El Estratega / El Rebelde Trágico',
            color: '#00f0ff',
            value: ''
          }
        ];
      } else if (templateKey === 'sanity') {
        // Idéntico a Captura 2: Estabilidad Emocional, Sanidad y Vulnerabilidades
        this.blockBuilderForm.title = 'Estabilidad Emocional, Sanidad y Vulnerabilidades';
        this.blockBuilderForm.icon = 'shield-alert';
        this.blockBuilderForm.accentColor = '#f43f5e';
        this.blockBuilderForm.fields = [
          {
            id: `fld_${crypto.randomUUID().slice(0, 8)}`,
            label: 'Estado de Sanidad / Estabilidad',
            icon: 'activity',
            type: 'input',
            width: 'half',
            placeholder: 'Ej: Estable',
            color: '#f43f5e',
            value: 'Estable'
          },
          {
            id: `fld_${crypto.randomUUID().slice(0, 8)}`,
            label: 'Notas Clínicas / Síntomas',
            icon: 'file-text',
            type: 'textarea',
            width: 'half',
            placeholder: 'Ej: Insomnio severo, alucinaciones auditivas breves, paranoia nocturna...',
            color: '#f43f5e',
            value: ''
          },
          {
            id: `fld_${crypto.randomUUID().slice(0, 8)}`,
            label: 'Fobias, Traumas y Puntos Débiles Emocionales',
            icon: 'shield-x',
            type: 'textarea',
            width: 'half',
            placeholder: 'Ej: Pirofobia tras el incendio de su hogar, terror a la claustrofobia...',
            color: '#fb923c',
            value: ''
          },
          {
            id: `fld_${crypto.randomUUID().slice(0, 8)}`,
            label: 'Desencadenantes (Triggers)',
            icon: 'zap',
            type: 'textarea',
            width: 'half',
            placeholder: 'Estímulos o situaciones que rompen su autocontrol de inmediato...',
            color: '#f87171',
            value: ''
          },
          {
            id: `fld_${crypto.randomUUID().slice(0, 8)}`,
            label: 'Anclaje de Cordura / Refugio Emocional',
            icon: 'anchor',
            type: 'textarea',
            width: 'full',
            placeholder: 'Pensamiento, recuerdo, vínculo o hábito que restaura su balance mental en crisis...',
            color: '#38bdf8',
            value: ''
          }
        ];
      } else if (templateKey === 'double') {
        // Doble Columna (50% / 50%)
        this.blockBuilderForm.title = 'Estructura Doble';
        this.blockBuilderForm.icon = 'split';
        this.blockBuilderForm.accentColor = '#00f0ff';
        this.blockBuilderForm.fields = [
          {
            id: `fld_${crypto.randomUUID().slice(0, 8)}`,
            label: 'Columna Izquierda',
            icon: 'file-text',
            type: 'textarea',
            width: 'half',
            placeholder: 'Escribe aquí...',
            color: '#00f0ff',
            value: ''
          },
          {
            id: `fld_${crypto.randomUUID().slice(0, 8)}`,
            label: 'Columna Derecha',
            icon: 'file-text',
            type: 'textarea',
            width: 'half',
            placeholder: 'Escribe aquí...',
            color: '#00f0ff',
            value: ''
          }
        ];
      } else if (templateKey === 'notes') {
        // Bitácora / Crónica única (100%)
        this.blockBuilderForm.title = 'Crónica y Bitácora';
        this.blockBuilderForm.icon = 'scroll-text';
        this.blockBuilderForm.accentColor = '#00f0ff';
        this.blockBuilderForm.fields = [
          {
            id: `fld_${crypto.randomUUID().slice(0, 8)}`,
            label: 'Registro de Acontecimientos',
            icon: 'scroll-text',
            type: 'textarea',
            width: 'full',
            placeholder: 'Relato, antecedentes, acuerdos o información relevante...',
            color: '#00f0ff',
            value: ''
          }
        ];
      } else if (templateKey === 'stats') {
        // Parámetros y Medidores Numéricos
        this.blockBuilderForm.title = 'Parámetros y Recursos';
        this.blockBuilderForm.icon = 'gauge';
        this.blockBuilderForm.accentColor = '#a855f7';
        this.blockBuilderForm.fields = [
          {
            id: `fld_${crypto.randomUUID().slice(0, 8)}`,
            label: 'Energía / Vitalidad',
            icon: 'heart',
            type: 'stat',
            width: 'third',
            current: 10,
            max: 20,
            unit: 'pts',
            color: '#10b981',
            placeholder: '',
            value: ''
          },
          {
            id: `fld_${crypto.randomUUID().slice(0, 8)}`,
            label: 'Reserva Arcana',
            icon: 'zap',
            type: 'stat',
            width: 'third',
            current: 15,
            max: 30,
            unit: 'pts',
            color: '#a855f7',
            placeholder: '',
            value: ''
          },
          {
            id: `fld_${crypto.randomUUID().slice(0, 8)}`,
            label: 'Límite de Resistencia',
            icon: 'shield',
            type: 'stat',
            width: 'third',
            current: 50,
            max: 100,
            unit: '%',
            color: '#00f0ff',
            placeholder: '',
            value: ''
          }
        ];
      } else if (templateKey === 'blank') {
        // Sub-sección en blanco
        this.blockBuilderForm.title = 'Nueva Sub-sección';
        this.blockBuilderForm.icon = 'layers';
        this.blockBuilderForm.fields = [
          {
            id: `fld_${crypto.randomUUID().slice(0, 8)}`,
            label: 'Campo de Información',
            icon: 'file-text',
            type: 'textarea',
            width: 'full',
            placeholder: 'Escribe aquí...',
            color: color,
            value: ''
          }
        ];
      }

      setTimeout(() => window.lucide?.createIcons?.(), 60);
    },

    addBlockBuilderField(type = 'textarea', width = null, targetIndex = null, side = 'left') {
      const color = this.blockBuilderForm.accentColor || '#00f0ff';
      let label = 'Nuevo Campo';
      let icon = 'file-text';
      let placeholder = 'Escribe aquí...';
      let fieldWidth = width;

      if (type === 'stat') {
        label = 'Nuevo Parámetro';
        icon = 'gauge';
        placeholder = '';
        if (!fieldWidth) fieldWidth = 'third';
      } else if (type === 'input') {
        label = 'Nueva Entrada Corta';
        icon = 'tag';
        placeholder = 'Texto corto...';
        if (!fieldWidth) fieldWidth = 'half';
      } else if (type === 'image') {
        label = 'Imagen o GIF Demostrativo';
        icon = 'image';
        placeholder = '';
        if (!fieldWidth) fieldWidth = 'full';
      } else if (type === 'badge_select') {
        label = 'Tipo / Categoría';
        icon = 'tags';
        placeholder = 'Activa, Pasiva';
        if (!fieldWidth) fieldWidth = 'half';
      } else if (type === 'time_cost') {
        label = 'Tiempos y Recursos';
        icon = 'clock';
        placeholder = '';
        if (!fieldWidth) fieldWidth = 'full';
      } else if (type === 'rarity') {
        label = 'Calidad / Rareza';
        icon = 'gem';
        placeholder = '';
        if (!fieldWidth) fieldWidth = 'half';
      } else if (type === 'divider') {
        label = 'Separador';
        icon = 'minus';
        placeholder = 'Título opcional del separador...';
        if (!fieldWidth) fieldWidth = 'full';
      } else if (type === 'spacer') {
        label = 'Espacio de Separación';
        icon = 'space';
        placeholder = '';
        if (!fieldWidth) fieldWidth = 'half';
      } else {
        if (!fieldWidth) fieldWidth = 'full';
      }

      const newField = {
        id: `fld_${crypto.randomUUID().slice(0, 8)}`,
        label,
        icon,
        type,
        width: fieldWidth,
        placeholder,
        color,
        value: type === 'rarity' ? 'raro' : type === 'badge_select' ? 'Activa' : '',
        current: 10,
        max: 20,
        unit: 'pts',
        imageTransform: '',
        imageFit: 'cover',
        imageIsGif: false,
        aspectRatio: '16/9',
        optionsText: 'Activa, Pasiva',
        td: '',
        cd: '',
        cost: ''
      };

      if (!Array.isArray(this.blockBuilderForm.fields)) {
        this.blockBuilderForm.fields = [];
      }

      if (targetIndex !== null && targetIndex >= 0 && targetIndex <= this.blockBuilderForm.fields.length) {
        let insertPos = targetIndex;
        if (side === 'right') insertPos = targetIndex + 1;
        insertPos = Math.max(0, Math.min(this.blockBuilderForm.fields.length, insertPos));
        this.blockBuilderForm.fields.splice(insertPos, 0, newField);
      } else {
        this.blockBuilderForm.fields.push(newField);
      }
      setTimeout(() => window.lucide?.createIcons?.(), 60);
    },

    duplicateBlockBuilderField(index) {
      if (index >= 0 && index < this.blockBuilderForm.fields.length) {
        const source = this.blockBuilderForm.fields[index];
        const clone = JSON.parse(JSON.stringify(source));
        clone.id = `fld_${crypto.randomUUID().slice(0, 8)}`;
        clone.label = `${clone.label || 'Campo'} (Copia)`;
        this.blockBuilderForm.fields.splice(index + 1, 0, clone);
        setTimeout(() => window.lucide?.createIcons?.(), 60);
      }
    },

    setBlockBuilderFieldWidth(index, width) {
      if (this.blockBuilderForm?.fields?.[index]) {
        this.blockBuilderForm.fields[index].width = width;
      }
    },

    removeBlockBuilderField(index) {
      if (index >= 0 && index < this.blockBuilderForm.fields.length) {
        this.blockBuilderForm.fields.splice(index, 1);
      }
    },

    moveBlockBuilderField(fromIndex, toIndex, side = null) {
      if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) return;
      const fields = this.blockBuilderForm?.fields;
      if (!Array.isArray(fields) || fromIndex >= fields.length || toIndex >= fields.length) return;

      const [moved] = fields.splice(fromIndex, 1);
      let targetIndex = toIndex;

      if (side === 'right') {
        targetIndex = fromIndex < toIndex ? toIndex : toIndex + 1;
      } else if (side === 'left') {
        targetIndex = fromIndex < toIndex ? toIndex - 1 : toIndex;
      }

      targetIndex = Math.max(0, Math.min(fields.length, targetIndex));
      fields.splice(targetIndex, 0, moved);
      setTimeout(() => {
        if (typeof window !== 'undefined') window.lucide?.createIcons?.();
      }, 60);
    },

    moveBlockBuilderFieldToEnd(fromIndex) {
      if (fromIndex < 0) return;
      const fields = this.blockBuilderForm?.fields;
      if (!Array.isArray(fields) || fromIndex >= fields.length) return;
      const [moved] = fields.splice(fromIndex, 1);
      fields.push(moved);
      setTimeout(() => window.lucide?.createIcons?.(), 60);
    },

    saveBlockBuilder() {
      const tab = this.getCustomTab(this.blockBuilderTabId);
      if (!tab) {
        window.Alpine?.store('app')?.toast?.('No se encontró la sección activa.', 'error');
        return;
      }
      if (!Array.isArray(tab.blocks)) tab.blocks = [];

      const form = this.blockBuilderForm;
      const title = (form.title || '').trim() || 'Sub-sección Modular';
      const icon = form.icon || 'layers';
      const accentColor = form.accentColor || tab.accentColor || '#eab308';
      const fields = Array.isArray(form.fields) ? JSON.parse(JSON.stringify(form.fields)) : [];

      if (this.blockBuilderBlockIndex !== null && tab.blocks[this.blockBuilderBlockIndex]) {
        // Actualizar bloque existente preservando valores si los campos mantienen ID
        const existingBlock = tab.blocks[this.blockBuilderBlockIndex];
        const oldFieldMap = new Map();
        if (Array.isArray(existingBlock.fields)) {
          existingBlock.fields.forEach(f => oldFieldMap.set(f.id, f));
        }

        // Transferir valores previos si existen
        fields.forEach(f => {
          if (oldFieldMap.has(f.id)) {
            const old = oldFieldMap.get(f.id);
            if (f.value === '' && old.value) f.value = old.value;
            if (old.current !== undefined) f.current = old.current;
            if (old.max !== undefined) f.max = old.max;
            if (old.unit) f.unit = old.unit;
            if (old.imageTransform !== undefined) f.imageTransform = old.imageTransform;
            if (old.imageFit !== undefined) f.imageFit = old.imageFit;
            if (old.imageIsGif !== undefined) f.imageIsGif = old.imageIsGif;
            if (old.td !== undefined) f.td = old.td;
            if (old.cd !== undefined) f.cd = old.cd;
            if (old.cost !== undefined) f.cost = old.cost;
          }
        });

        existingBlock.title = title;
        existingBlock.icon = icon;
        existingBlock.accentColor = accentColor;
        existingBlock.fields = fields;
        if (existingBlock.isCollapsed === undefined) existingBlock.isCollapsed = false;
        delete existingBlock.type; // Ahora es un bloque modular estándar con fields

        window.Alpine?.store('app')?.toast?.(`Sub-sección "${title}" actualizada.`, 'success');
      } else {
        // Añadir nuevo bloque modular
        const newBlock = {
          id: `blk_${crypto.randomUUID().slice(0, 8)}`,
          title: title,
          icon: icon,
          accentColor: accentColor,
          isCollapsed: false,
          fields: fields
        };
        tab.blocks.push(newBlock);
        window.Alpine?.store('app')?.toast?.(`Sub-sección "${title}" creada con éxito.`, 'success');
      }

      this.scheduleAutoSave();
      this.closeBlockBuilder();
      setTimeout(() => window.lucide?.createIcons?.(), 80);
    },

    // ── ACCIONES INTERACTIVAS DIRECTAS SOBRE CAMPOS EN LA PESTAÑA ───
    setCustomFieldWidth(tabId, blockIndex, fieldIndex, width) {
      const tab = this.getCustomTab(tabId);
      if (!tab || !Array.isArray(tab.blocks) || !tab.blocks[blockIndex]) return;
      const blk = tab.blocks[blockIndex];
      if (Array.isArray(blk.fields) && blk.fields[fieldIndex]) {
        blk.fields[fieldIndex].width = width;
        this.scheduleAutoSave();
      }
    },

    addQuickFieldToCustomBlock(tabId, blockIndex, type = 'textarea', width = 'full') {
      const tab = this.getCustomTab(tabId);
      if (!tab || !Array.isArray(tab.blocks) || !tab.blocks[blockIndex]) return;
      const blk = tab.blocks[blockIndex];
      if (!Array.isArray(blk.fields)) blk.fields = [];

      const color = blk.accentColor || tab.accentColor || '#00f0ff';
      blk.fields.push({
        id: `fld_${crypto.randomUUID().slice(0, 8)}`,
        label: type === 'stat' ? 'Nuevo Parámetro' : type === 'input' ? 'Nueva Entrada' : 'Nuevo Campo de Texto',
        icon: type === 'stat' ? 'gauge' : type === 'input' ? 'tag' : 'file-text',
        type: type,
        width: width,
        placeholder: 'Escribe aquí...',
        color: color,
        value: '',
        current: 10,
        max: 20,
        unit: 'pts'
      });

      this.scheduleAutoSave();
      setTimeout(() => window.lucide?.createIcons?.(), 60);
    },

    removeCustomFieldFromBlock(tabId, blockIndex, fieldIndex) {
      const tab = this.getCustomTab(tabId);
      if (!tab || !Array.isArray(tab.blocks) || !tab.blocks[blockIndex]) return;
      const blk = tab.blocks[blockIndex];
      if (Array.isArray(blk.fields) && fieldIndex >= 0 && fieldIndex < blk.fields.length) {
        blk.fields.splice(fieldIndex, 1);
        this.scheduleAutoSave();
      }
    },

    incrementCustomFieldStat(tabId, blockIndex, fieldIndex, delta) {
      const tab = this.getCustomTab(tabId);
      if (!tab || !Array.isArray(tab.blocks) || !tab.blocks[blockIndex]) return;
      const blk = tab.blocks[blockIndex];
      if (Array.isArray(blk.fields) && blk.fields[fieldIndex]) {
        const item = blk.fields[fieldIndex];
        const cur = Number(item.current) || 0;
        const max = item.max !== '' && item.max !== null && item.max !== undefined ? Number(item.max) : null;
        let next = cur + delta;
        if (max !== null) {
          next = Math.max(0, Math.min(next, max));
        } else {
          next = Math.max(0, next);
        }
        item.current = next;
        this.scheduleAutoSave();
      }
    },

    removeCustomTabBlock(tabId, blockIndex) {
      const tab = this.getCustomTab(tabId);
      if (!tab || !Array.isArray(tab.blocks)) return;
      if (blockIndex >= 0 && blockIndex < tab.blocks.length) {
        if (typeof this.pushUndoSnapshot === 'function') {
          this.pushUndoSnapshot('Eliminar bloque');
        }
        tab.blocks.splice(blockIndex, 1);
        this.scheduleAutoSave();
        window.Alpine?.store('app')?.toast?.('Bloque eliminado.', 'info', {
          label: 'DESHACER (Ctrl+Z)',
          onClick: () => this.undo(),
          duration: 6000
        });
      }
    },

    moveCustomTabBlock(tabId, fromIndex, toIndex) {
      const tab = this.getCustomTab(tabId);
      if (!tab || !Array.isArray(tab.blocks)) return;
      if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) return;
      if (fromIndex >= tab.blocks.length || toIndex >= tab.blocks.length) return;

      const [moved] = tab.blocks.splice(fromIndex, 1);
      tab.blocks.splice(toIndex, 0, moved);
      this.scheduleAutoSave();
      setTimeout(() => window.lucide?.createIcons?.(), 60);
    },

    toggleCustomBlockCollapse(tabId, blockIndex) {
      const tab = this.getCustomTab(tabId);
      if (!tab || !Array.isArray(tab.blocks) || !tab.blocks[blockIndex]) return;
      tab.blocks[blockIndex].isCollapsed = !tab.blocks[blockIndex].isCollapsed;
      this.scheduleAutoSave();
      setTimeout(() => window.lucide?.createIcons?.(), 60);
    },

    // ── GESTIÓN DE IMÁGENES / GIFS EN CAMPOS PERSONALIZADOS ────────
    _findCustomField(tabId, fieldId) {
      if (!this.active || !Array.isArray(this.active.customTabs)) return null;
      const tab = this.active.customTabs.find(t => t.id === tabId);
      if (!tab || !Array.isArray(tab.blocks)) return null;
      for (const block of tab.blocks) {
        if (!Array.isArray(block.fields)) continue;
        const field = block.fields.find(f => f.id === fieldId);
        if (field) return { tab, block, field };
      }
      return null;
    },

    uploadCustomFieldImage(event, tabId, fieldId) {
      const file = event.target.files?.[0];
      if (!file || !this.active) return;
      if (!file.type.startsWith('image/')) {
        window.Alpine?.store('app')?.toast('Selecciona una imagen o GIF válido.', 'warning');
        event.target.value = '';
        return;
      }
      window.Alpine?.store('app')?.openCropper(file, 'custom_field', `${tabId}:${fieldId}`);
      event.target.value = '';
    },

    async processCroppedCustomField(file, targetRef) {
      if (!this.active) return;
      const [tabId, fieldId] = (targetRef || '').split(':');
      const found = this._findCustomField(tabId, fieldId);
      if (!found) return;

      try {
        const { dataUrl, compressedKB } = await compressImageWithStats(file, 1280, 720);
        found.field.value = dataUrl;
        found.field.imageTransform = '';
        found.field.imageIsGif = false;
        if (!found.field.imageFit) found.field.imageFit = 'cover';
        this.scheduleAutoSave();
        window.Alpine?.store('app')?.toast(`Imagen actualizada y optimizada a ${compressedKB}KB (WebP)`, 'success');
      } catch (e) {
        console.error('Error al procesar imagen de campo personalizado:', e);
        window.Alpine?.store('app')?.toast('Error al procesar la imagen.', 'error');
      }
    },

    async processCroppedCustomFieldGif(dataUrl, cssTransform, targetRef) {
      if (!this.active) return;
      const [tabId, fieldId] = (targetRef || '').split(':');
      const found = this._findCustomField(tabId, fieldId);
      if (!found) return;

      found.field.value = dataUrl;
      found.field.imageTransform = cssTransform;
      found.field.imageIsGif = true;
      found.field.imageFit = 'cover';
      this.scheduleAutoSave();
      window.Alpine?.store('app')?.toast('GIF animado configurado con éxito.', 'success');
    },

    reCropCustomFieldImage(tabId, fieldId) {
      const found = this._findCustomField(tabId, fieldId);
      if (!found || !found.field.value) return;

      const dataUrl = found.field.value;
      const isGif = found.field.imageIsGif || dataUrl.startsWith('data:image/gif');

      fetch(dataUrl)
        .then(res => res.blob())
        .then(blob => {
          const file = new File([blob], isGif ? 'recrop.gif' : 'recrop.png', { type: isGif ? 'image/gif' : 'image/png' });
          window.Alpine?.store('app')?.openCropper(file, 'custom_field', `${tabId}:${fieldId}`);
        })
        .catch(err => {
          console.error('[customTabs] Error al re-encuadrar imagen:', err);
          window.Alpine?.store('app')?.toast('No se pudo re-encuadrar la imagen.', 'error');
        });
    },

    async flipCustomFieldImage(tabId, fieldId) {
      const found = this._findCustomField(tabId, fieldId);
      if (!found || !found.field.value) return;

      const field = found.field;
      const isGif = field.imageIsGif || field.value.startsWith('data:image/gif');
      if (isGif) {
        field.imageTransform = this._toggleCssFlipX(field.imageTransform || '');
        this.scheduleAutoSave();
        window.Alpine?.store('app')?.toast('Efecto espejo aplicado al GIF.', 'success');
        return;
      }

      try {
        const flipped = await this._transformDataUrl(field.value, (img, canvas, ctx) => {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
          ctx.drawImage(img, 0, 0);
        });
        field.value = flipped;
        field.imageTransform = '';
        this.scheduleAutoSave();
        window.Alpine?.store('app')?.toast('Efecto espejo aplicado.', 'success');
      } catch (err) {
        window.Alpine?.store('app')?.toast('No se pudo aplicar efecto espejo.', 'error');
      }
    },

    async rotateCustomFieldImage(tabId, fieldId) {
      const found = this._findCustomField(tabId, fieldId);
      if (!found || !found.field.value) return;

      const field = found.field;
      const isGif = field.imageIsGif || field.value.startsWith('data:image/gif');
      if (isGif) {
        field.imageTransform = this._rotateCssTransform(field.imageTransform || '', 90);
        this.scheduleAutoSave();
        window.Alpine?.store('app')?.toast('Rotación aplicada al GIF.', 'success');
        return;
      }

      try {
        const rotated = await this._transformDataUrl(field.value, (img, canvas, ctx) => {
          canvas.width = img.height;
          canvas.height = img.width;
          ctx.translate(canvas.width / 2, canvas.height / 2);
          ctx.rotate((90 * Math.PI) / 180);
          ctx.drawImage(img, -img.width / 2, -img.height / 2);
        });
        field.value = rotated;
        field.imageTransform = '';
        this.scheduleAutoSave();
        window.Alpine?.store('app')?.toast('Imagen rotada 90° con éxito.', 'success');
      } catch (err) {
        window.Alpine?.store('app')?.toast('No se pudo rotar la imagen.', 'error');
      }
    },

    toggleCustomFieldImageFit(tabId, fieldId) {
      const found = this._findCustomField(tabId, fieldId);
      if (!found || !found.field) return;
      found.field.imageFit = (found.field.imageFit || 'cover') === 'cover' ? 'contain' : 'cover';
      this.scheduleAutoSave();
    },

    removeCustomFieldImage(tabId, fieldId) {
      const found = this._findCustomField(tabId, fieldId);
      if (!found || !found.field) return;
      found.field.value = '';
      found.field.imageTransform = '';
      found.field.imageIsGif = false;
      this.scheduleAutoSave();
      window.Alpine?.store('app')?.toast('Imagen eliminada del campo.', 'info');
    },

    async setCustomFieldImageUrl(tabId, fieldId, url) {
      if (!url || !url.trim()) return;
      const found = this._findCustomField(tabId, fieldId);
      if (!found) return;

      const cleanUrl = url.trim();
      const isGif = cleanUrl.toLowerCase().includes('.gif');

      if (isGif) {
        found.field.value = cleanUrl;
        found.field.imageTransform = '';
        found.field.imageIsGif = true;
        found.field.imageFit = 'cover';
        this.scheduleAutoSave();
        window.Alpine?.store('app')?.toast('GIF animado vinculado por URL.', 'success');
        return;
      }

      await window.Alpine?.store('app')?.openMediaUrl(cleanUrl, 'custom_field', `${tabId}:${fieldId}`);
    },

    // ── RETROCOMPATIBILIDAD CON BLOQUES ANTIGUOS ─────────────────────
    addCardToCustomBlock(tabId, blockIndex) {
      const tab = this.getCustomTab(tabId);
      if (!tab || !Array.isArray(tab.blocks) || !tab.blocks[blockIndex]) return;
      const blk = tab.blocks[blockIndex];
      if (!Array.isArray(blk.items)) blk.items = [];

      blk.items.push({
        id: `card_${crypto.randomUUID().slice(0, 8)}`,
        title: 'Nueva Entrada',
        tag: '',
        tagColor: tab.accentColor || '#00f0ff',
        details: '',
        description: ''
      });
      this.scheduleAutoSave();
    },

    removeCardFromCustomBlock(tabId, blockIndex, cardIndex) {
      const tab = this.getCustomTab(tabId);
      if (!tab || !Array.isArray(tab.blocks) || !tab.blocks[blockIndex]) return;
      const blk = tab.blocks[blockIndex];
      if (Array.isArray(blk.items) && cardIndex >= 0 && cardIndex < blk.items.length) {
        blk.items.splice(cardIndex, 1);
        this.scheduleAutoSave();
      }
    },

    addAttributeToCustomBlock(tabId, blockIndex) {
      const tab = this.getCustomTab(tabId);
      if (!tab || !Array.isArray(tab.blocks) || !tab.blocks[blockIndex]) return;
      const blk = tab.blocks[blockIndex];
      if (!Array.isArray(blk.items)) blk.items = [];

      blk.items.push({
        id: `attr_${crypto.randomUUID().slice(0, 8)}`,
        label: 'Nuevo Parámetro',
        current: 10,
        max: 20,
        unit: 'pts',
        color: tab.accentColor || '#00f0ff'
      });
      this.scheduleAutoSave();
    },

    removeAttributeFromCustomBlock(tabId, blockIndex, attrIndex) {
      const tab = this.getCustomTab(tabId);
      if (!tab || !Array.isArray(tab.blocks) || !tab.blocks[blockIndex]) return;
      const blk = tab.blocks[blockIndex];
      if (Array.isArray(blk.items) && attrIndex >= 0 && attrIndex < blk.items.length) {
        blk.items.splice(attrIndex, 1);
        this.scheduleAutoSave();
      }
    },

    incrementCustomAttribute(tabId, blockIndex, attrIndex, delta) {
      const tab = this.getCustomTab(tabId);
      if (!tab || !Array.isArray(tab.blocks) || !tab.blocks[blockIndex]) return;
      const blk = tab.blocks[blockIndex];
      if (Array.isArray(blk.items) && blk.items[attrIndex]) {
        const item = blk.items[attrIndex];
        const cur = Number(item.current) || 0;
        const max = item.max !== '' && item.max !== null && item.max !== undefined ? Number(item.max) : null;
        let next = cur + delta;
        if (max !== null) {
          next = Math.max(0, Math.min(next, max));
        } else {
          next = Math.max(0, next);
        }
        item.current = next;
        this.scheduleAutoSave();
      }
    },

    addImageToCustomGallery(tabId, blockIndex, dataUrl, caption = '') {
      const tab = this.getCustomTab(tabId);
      if (!tab || !Array.isArray(tab.blocks) || !tab.blocks[blockIndex]) return;
      const blk = tab.blocks[blockIndex];
      if (!Array.isArray(blk.items)) blk.items = [];

      blk.items.push({
        id: `img_${crypto.randomUUID().slice(0, 8)}`,
        dataUrl,
        caption: caption || ''
      });
      this.scheduleAutoSave();
    },

    removeImageFromCustomGallery(tabId, blockIndex, imgIndex) {
      const tab = this.getCustomTab(tabId);
      if (!tab || !Array.isArray(tab.blocks) || !tab.blocks[blockIndex]) return;
      const blk = tab.blocks[blockIndex];
      if (Array.isArray(blk.items) && imgIndex >= 0 && imgIndex < blk.items.length) {
        blk.items.splice(imgIndex, 1);
        this.scheduleAutoSave();
      }
    }
  };
}
