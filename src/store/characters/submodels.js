/**
 * store/characters/submodels.js
 * Submodelos del personaje: Habilidades, Armas, Galería, Relaciones, Facciones,
 * Power Scaling, Objetos Secundarios, Ejes de Personalidad, Citas y Selector de Colores.
 */

import { compressImageWithStats } from '../../utils/imageCompressor.js';
import { fetchImageAsFileFromUrl } from '../../utils/imageUrlResolver.js';
import { getDefaultPersonalityAxes } from './schema.js';
import { rollWeightedPowerMatrix, POWER_RARITIES, getTierRarity } from '../../utils/powerScalingRandomizer.js';

export function createSubmodelMethods() {
  return {
    // ── Frases y Citas del Personaje ────────────────────────────
    quoteRotationIndex: 0,
    quoteRotationTimer: null,

    startQuoteRotation() {
      if (this.quoteRotationTimer) clearInterval(this.quoteRotationTimer);
      this.quoteRotationTimer = setInterval(() => {
        this.quoteRotationIndex++;
      }, 7000);
    },

    addQuote(quoteText) {
      if (!this.active) return;
      if (!this.active.basics) this.active.basics = {};
      if (!Array.isArray(this.active.basics.quotes)) this.active.basics.quotes = [];

      const trimmed = String(quoteText || '').trim();
      if (!trimmed) return;

      this.active.basics.quotes.push(trimmed);
      if (this.active.basics.showQuoteOnCard === undefined) {
        this.active.basics.showQuoteOnCard = true;
      }
      if (this.active.basics.rotateQuotesOnCard === undefined) {
        this.active.basics.rotateQuotesOnCard = true;
      }
      this.scheduleAutoSave();
    },

    updateQuote(index, newText) {
      if (!this.active || !this.active.basics || !Array.isArray(this.active.basics.quotes)) return;
      if (index >= 0 && index < this.active.basics.quotes.length) {
        this.active.basics.quotes[index] = String(newText || '');
        this.scheduleAutoSave();
      }
    },

    removeQuote(index) {
      if (!this.active || !this.active.basics || !Array.isArray(this.active.basics.quotes)) return;
      if (index >= 0 && index < this.active.basics.quotes.length) {
        if (typeof this.pushUndoSnapshot === 'function') {
          this.pushUndoSnapshot('Eliminar cita');
        }
        this.active.basics.quotes.splice(index, 1);
        this.scheduleAutoSave();
        window.Alpine?.store('app')?.toast('Cita eliminada.', 'info', {
          label: 'DESHACER (Ctrl+Z)',
          onClick: () => this.undo(),
          duration: 6000
        });
      }
    },

    getFeaturedQuote(char) {
      if (!char || !char.basics) return '';
      if (char.basics.showQuoteOnCard === false) return '';
      const quotes = Array.isArray(char.basics.quotes) ? char.basics.quotes.filter(q => q && String(q).trim()) : [];
      if (quotes.length === 0) return '';
      if (char.basics.rotateQuotesOnCard !== false && quotes.length > 1) {
        const idx = this.quoteRotationIndex % quotes.length;
        return String(quotes[idx] || '').trim();
      }
      return String(quotes[0] || '').trim();
    },

    // ── Integración con API de Colores (TheColorAPI) ────────
    async fetchColorName(field, hex) {
      if (!this.active || !hex) return;
      const hexClean = String(hex).replace('#', '').trim();
      if (!hexClean) return;
      try {
        const res = await fetch(`https://www.thecolorapi.com/id?hex=${hexClean}`);
        if (!res.ok) return;
        const data = await res.json();
        const colorName = data?.name?.value;
        if (colorName && this.active.body) {
          const currentVal = String(this.active.body[field] || '').trim();
          const lastApi = String(this.active.body[field + 'LastApi'] || '').trim();
          const isCustom = Boolean(this.active.body[field + 'IsCustom']);

          if (!currentVal || !isCustom || currentVal === lastApi) {
            this.active.body[field] = colorName;
            this.active.body[field + 'LastApi'] = colorName;
            this.active.body[field + 'IsCustom'] = false;
            this.scheduleAutoSave();
          }
        }
      } catch (e) {
        console.warn('[characters] Error al consultar TheColorAPI:', e);
      }
    },

    onColorTextInput(field) {
      if (!this.active || !this.active.body) return;
      const val = String(this.active.body[field] || '').trim();
      const lastApi = String(this.active.body[field + 'LastApi'] || '').trim();

      if (!val) {
        this.active.body[field + 'IsCustom'] = false;
        this.active.body[field + 'LastApi'] = '';
      } else if (val !== lastApi) {
        this.active.body[field + 'IsCustom'] = true;
      }

      this.scheduleAutoSave();
    },

    // ── Módulo de Habilidades ──────────────────────────────────
    addSkill(type = 'active') {
      if (!this.active) return;
      if (!Array.isArray(this.active.skills)) this.active.skills = [];
      const newSkill = {
        id: crypto.randomUUID(),
        type,
        title: '',
        summary: '',
        effect: '',
        td: '',
        cd: '',
        cost: '',
        condicion: '',
        tier: '',
        range: '',
        elementType: '',
        drawback: '',
        tags: [],
        imageDataUrl: '',
        imageIsGif: false,
        imageFit: 'cover',
      };
      this.active.skills.push(newSkill);
      this.scheduleAutoSave();
      return newSkill.id;
    },

    duplicateSkill(skillId) {
      if (!this.active || !Array.isArray(this.active.skills)) return;
      const index = this.active.skills.findIndex(s => s.id === skillId);
      if (index === -1) return;
      const original = this.active.skills[index];
      const copy = JSON.parse(JSON.stringify(original));
      copy.id = crypto.randomUUID();
      copy.title = original.title ? `${original.title} (Copia)` : 'Habilidad (Copia)';
      this.active.skills.splice(index + 1, 0, copy);
      this.scheduleAutoSave();
      window.Alpine?.store('app')?.toast('Habilidad duplicada.', 'success');
      return copy.id;
    },

    reorderSkills(fromIndex, toIndex) {
      if (!this.active || !Array.isArray(this.active.skills)) return;
      if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) return;
      if (fromIndex >= this.active.skills.length || toIndex >= this.active.skills.length) return;
      const [moved] = this.active.skills.splice(fromIndex, 1);
      this.active.skills.splice(toIndex, 0, moved);
      this.scheduleAutoSave();
    },

    reorderTabs(fromIndex, toIndex) {
      window.Alpine?.store('app')?.reorderTabs(fromIndex, toIndex);
    },

    removeSkill(skillId) {
      if (!this.active || !Array.isArray(this.active.skills)) return;
      if (typeof this.pushUndoSnapshot === 'function') {
        this.pushUndoSnapshot('Eliminar habilidad');
      }
      this.active.skills = this.active.skills.filter(s => s.id !== skillId);
      this.scheduleAutoSave();
      window.Alpine?.store('app')?.toast('Habilidad eliminada.', 'info', {
        label: 'DESHACER (Ctrl+Z)',
        onClick: () => this.undo(),
        duration: 6000
      });
    },

    uploadSkillImage(event, skillId) {
      const file = event.target.files?.[0];
      if (!file || !this.active) return;
      if (!file.type.startsWith('image/')) {
        window.Alpine?.store('app')?.toast('Selecciona una imagen o GIF válido.', 'warning');
        event.target.value = '';
        return;
      }
      window.Alpine?.store('app')?.openCropper(file, 'skill', skillId);
      event.target.value = '';
    },

    async processCroppedSkill(file, skillId) {
      if (!this.active) return;
      const skill = this.active.skills?.find(s => s.id === skillId);
      if (!skill) return;
      try {
        const { dataUrl, compressedKB } = await compressImageWithStats(file, 1280, 720);
        skill.imageDataUrl = dataUrl;
        skill.imageTransform = '';
        skill.imageIsGif = false;
        if (!skill.imageFit) skill.imageFit = 'cover';
        this.scheduleAutoSave();
        window.Alpine?.store('app')?.toast(`Habilidad actualizada y optimizada a ${compressedKB}KB (WebP)`, 'success');
      } catch (e) {
        window.Alpine?.store('app')?.toast('Error al procesar la imagen de la habilidad.', 'error');
      }
    },

    async processCroppedSkillGif(dataUrl, cssTransform, skillId) {
      if (!this.active) return;
      const skill = this.active.skills?.find(s => s.id === skillId);
      if (!skill) return;
      skill.imageDataUrl = dataUrl;
      skill.imageTransform = cssTransform;
      skill.imageIsGif = true;
      skill.imageFit = 'cover';
      this.scheduleAutoSave();
      window.Alpine?.store('app')?.toast('GIF animado de habilidad configurado con encuadre interactivo.', 'success');
    },

    async flipSkillImage(skillId) {
      const skill = this.active?.skills?.find(s => s.id === skillId);
      if (!skill || !skill.imageDataUrl) return;

      const isGif = skill.imageIsGif || skill.imageDataUrl.startsWith('data:image/gif');
      if (isGif) {
        skill.imageTransform = this._toggleCssFlipX(skill.imageTransform || '');
        this.scheduleAutoSave();
        window.Alpine?.store('app')?.toast('Efecto espejo aplicado al GIF.', 'success');
        return;
      }

      try {
        const flipped = await this._transformDataUrl(skill.imageDataUrl, (img, canvas, ctx) => {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
          ctx.drawImage(img, 0, 0);
        });
        skill.imageDataUrl = flipped;
        skill.imageTransform = '';
        this.scheduleAutoSave();
        window.Alpine?.store('app')?.toast('Efecto espejo aplicado a la habilidad.', 'success');
      } catch (err) {
        window.Alpine?.store('app')?.toast('No se pudo aplicar efecto espejo a la habilidad.', 'error');
      }
    },

    async rotateSkillImage(skillId) {
      const skill = this.active?.skills?.find(s => s.id === skillId);
      if (!skill || !skill.imageDataUrl) return;

      const isGif = skill.imageIsGif || skill.imageDataUrl.startsWith('data:image/gif');
      if (isGif) {
        skill.imageTransform = this._rotateCssTransform(skill.imageTransform || '', 90);
        this.scheduleAutoSave();
        window.Alpine?.store('app')?.toast('GIF rotado 90° con éxito.', 'success');
        return;
      }

      try {
        const rotated = await this._transformDataUrl(skill.imageDataUrl, (img, canvas, ctx) => {
          canvas.width = img.height;
          canvas.height = img.width;
          ctx.translate(canvas.width / 2, canvas.height / 2);
          ctx.rotate((90 * Math.PI) / 180);
          ctx.drawImage(img, -img.width / 2, -img.height / 2);
        });
        skill.imageDataUrl = rotated;
        skill.imageTransform = '';
        this.scheduleAutoSave();
        window.Alpine?.store('app')?.toast('Habilidad rotada 90° con éxito.', 'success');
      } catch (err) {
        window.Alpine?.store('app')?.toast('No se pudo rotar la habilidad.', 'error');
      }
    },

    async reCropSkillImage(skillId) {
      const skill = this.active?.skills?.find(s => s.id === skillId);
      if (!skill || !skill.imageDataUrl) {
        window.Alpine?.store('app')?.toast('No hay imagen para recortar.', 'info');
        return;
      }
      try {
        const res = await fetch(skill.imageDataUrl);
        const blob = await res.blob();
        const file = new File([blob], `skill_${skillId}_recrop.png`, { type: blob.type || 'image/png' });
        window.Alpine?.store('app')?.openCropper(file, 'skill', skillId);
      } catch (e) {
        window.Alpine?.store('app')?.toast('Error al abrir el recortador.', 'error');
      }
    },

    async loadSkillImageFromUrl(url, skillId) {
      if (!url || !url.trim()) return;
      const cleanUrl = url.trim();
      window.Alpine?.store('app')?.toast('Descargando imagen de la habilidad...', 'info');
      try {
        const file = await fetchImageAsFileFromUrl(cleanUrl);
        window.Alpine?.store('app')?.openCropper(file, 'skill', skillId);
      } catch (err) {
        console.error(`Error al cargar imagen de habilidad desde URL (${cleanUrl}):`, err);
        window.Alpine?.store('app')?.toast(
          'No se pudo descargar la imagen. Si el sitio requiere inicio de sesión, guarda la imagen en tu dispositivo y súbela como archivo.',
          'error'
        );
      }
    },

    toggleSkillImageFit(skillId) {
      if (!this.active || !Array.isArray(this.active.skills)) return;
      const skill = this.active.skills.find(s => s.id === skillId);
      if (!skill) return;
      skill.imageFit = skill.imageFit === 'cover' ? 'contain' : 'cover';
      this.scheduleAutoSave();
      const modeLabel = skill.imageFit === 'cover' ? 'Rellenar (Zoom)' : 'Encajar (Completo)';
      window.Alpine?.store('app')?.toast(`Ajuste de habilidad: ${modeLabel}`, 'info');
    },

    removeSkillImage(skillId) {
      if (!this.active) return;
      const skill = this.active.skills.find(s => s.id === skillId);
      if (!skill) return;
      if (typeof this.pushUndoSnapshot === 'function') {
        this.pushUndoSnapshot('Quitar imagen de habilidad');
      }
      skill.imageDataUrl = '';
      skill.imageTransform = '';
      skill.imageIsGif = false;
      skill.imageFit = 'contain';
      this.scheduleAutoSave();
      window.Alpine?.store('app')?.toast('Imagen de la habilidad eliminada.', 'info', {
        label: 'DESHACER (Ctrl+Z)',
        onClick: () => this.undo(),
        duration: 6000
      });
    },

    // ── Galería Extras ──────────────────────────────────────────
    async uploadGalleryImage(event) {
      const file = event.target.files?.[0];
      if (!file || !this.active) return;
      if (!this.active.extras.gallery) this.active.extras.gallery = [];
      if (!file.type.startsWith('image/')) {
        window.Alpine?.store('app')?.toast('Selecciona un archivo de imagen válido.', 'warning');
        return;
      }
      try {
        const { dataUrl, originalKB, compressedKB } = await compressImageWithStats(file);
        this.active.extras.gallery.push({ id: crypto.randomUUID(), dataUrl, originalKB, compressedKB, imageFit: 'contain' });
        this.scheduleAutoSave();
        window.Alpine?.store('app')?.toast(`Imagen añadida a la galería (${compressedKB} KB).`, 'success');
      } catch (e) {
        window.Alpine?.store('app')?.toast('Error al procesar la imagen.', 'error');
      }
      event.target.value = '';
    },

    async processCroppedGallery(file) {
      if (!this.active) return;
      try {
        const { dataUrl, originalKB, compressedKB } = await compressImageWithStats(file);
        this.active.extras.gallery.push({ id: crypto.randomUUID(), dataUrl, originalKB, compressedKB, imageFit: 'contain' });
        this.scheduleAutoSave();
        window.Alpine?.store('app')?.toast(`Imagen añadida a la galería (${compressedKB} KB).`, 'success');
      } catch (e) {
        window.Alpine?.store('app')?.toast('Error al procesar la imagen.', 'error');
      }
    },

    removeGalleryImage(imgId) {
      if (!this.active || !Array.isArray(this.active.extras.gallery)) return;
      if (typeof this.pushUndoSnapshot === 'function') {
        this.pushUndoSnapshot('Eliminar imagen de galería');
      }
      this.active.extras.gallery = this.active.extras.gallery.filter(g => g.id !== imgId);
      this.scheduleAutoSave();
      window.Alpine?.store('app')?.toast('Imagen eliminada de la galería.', 'info', {
        label: 'DESHACER (Ctrl+Z)',
        onClick: () => this.undo(),
        duration: 6000
      });
    },

    toggleGalleryImageFit(imgId) {
      if (!this.active || !Array.isArray(this.active.extras.gallery)) return;
      const img = this.active.extras.gallery.find(g => g.id === imgId);
      if (img) {
        img.imageFit = img.imageFit === 'cover' ? 'contain' : 'cover';
        this.scheduleAutoSave();
        const modeLabel = img.imageFit === 'cover' ? 'Rellenar (Zoom)' : 'Encajar (Completo)';
        window.Alpine?.store('app')?.toast(`Ajuste de imagen: ${modeLabel}`, 'info');
      }
    },

    // ── Matriz de Relaciones ────────────────────────────────────
    addRelation() {
      if (!this.active) return;
      if (!this.active.social) this.active.social = {};
      if (!Array.isArray(this.active.social.relations)) {
        this.active.social.relations = [];
      }
      this.active.social.relations.push({
        id: crypto.randomUUID(),
        name: '',
        bondType: 'Aliado',
        status: '',
        description: '',
      });
      this.scheduleAutoSave();
    },

    removeRelation(relationId) {
      if (!this.active || !Array.isArray(this.active.social?.relations)) return;
      if (typeof this.pushUndoSnapshot === 'function') {
        this.pushUndoSnapshot('Eliminar relación');
      }
      this.active.social.relations = this.active.social.relations.filter(r => r.id !== relationId);
      this.scheduleAutoSave();
      window.Alpine?.store('app')?.toast('Relación eliminada.', 'info', {
        label: 'DESHACER (Ctrl+Z)',
        onClick: () => this.undo(),
        duration: 6000
      });
    },

    // ── Matriz de Facciones ────────────────────────────────────
    addFactionRelation() {
      if (!this.active) return;
      if (!this.active.social) this.active.social = {};
      if (!Array.isArray(this.active.social.factions)) {
        this.active.social.factions = [];
      }
      this.active.social.factions.push({
        id: crypto.randomUUID(),
        name: '',
        affinity: 'Neutral',
      });
      this.scheduleAutoSave();
    },

    removeFactionRelation(factionId) {
      if (!this.active || !Array.isArray(this.active.social?.factions)) return;
      if (typeof this.pushUndoSnapshot === 'function') {
        this.pushUndoSnapshot('Eliminar facción');
      }
      this.active.social.factions = this.active.social.factions.filter(f => f.id !== factionId);
      this.scheduleAutoSave();
      window.Alpine?.store('app')?.toast('Facción eliminada.', 'info', {
        label: 'DESHACER (Ctrl+Z)',
        onClick: () => this.undo(),
        duration: 6000
      });
    },

    // ── Armas y Artefactos ─────────────────────────────────────
    addWeapon() {
      if (!this.active) return;
      if (!Array.isArray(this.active.weapons)) this.active.weapons = [];
      const newWeapon = {
        id: crypto.randomUUID(),
        imageDataUrl: '',
        imageFit: 'contain',
        imageOrientation: 'horizontal',
        name: '',
        rarity: 'Común',
        rarityColor: '',
        weaponType: '',
        tags: [],
        damage: '',
        range: '',
        cd: '',
        td: '',
        linkedSkillId: '',
        properties: '',
        lore: '',
      };
      this.active.weapons.push(newWeapon);
      this.scheduleAutoSave();
      return newWeapon.id;
    },

    duplicateWeapon(weaponId) {
      if (!this.active || !Array.isArray(this.active.weapons)) return;
      const index = this.active.weapons.findIndex(w => w.id === weaponId);
      if (index === -1) return;
      const original = this.active.weapons[index];
      const copy = JSON.parse(JSON.stringify(original));
      copy.id = crypto.randomUUID();
      copy.name = original.name ? `${original.name} (Copia)` : 'Arma (Copia)';
      this.active.weapons.splice(index + 1, 0, copy);
      this.scheduleAutoSave();
      window.Alpine?.store('app')?.toast('Arma / Artefacto duplicado.', 'success');
      return copy.id;
    },

    reorderWeapons(fromIndex, toIndex) {
      if (!this.active || !Array.isArray(this.active.weapons)) return;
      if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) return;
      if (fromIndex >= this.active.weapons.length || toIndex >= this.active.weapons.length) return;
      const [moved] = this.active.weapons.splice(fromIndex, 1);
      this.active.weapons.splice(toIndex, 0, moved);
      this.scheduleAutoSave();
    },

    removeWeapon(weaponId) {
      if (!this.active || !Array.isArray(this.active.weapons)) return;
      if (typeof this.pushUndoSnapshot === 'function') {
        this.pushUndoSnapshot('Eliminar arma/artefacto');
      }
      this.active.weapons = this.active.weapons.filter(w => w.id !== weaponId);
      this.scheduleAutoSave();
      window.Alpine?.store('app')?.toast('Arma / Artefacto eliminado.', 'info', {
        label: 'DESHACER (Ctrl+Z)',
        onClick: () => this.undo(),
        duration: 6000
      });
    },

    uploadWeaponImage(event, weaponId) {
      const file = event.target.files?.[0];
      if (!file || !this.active) return;
      if (!file.type.startsWith('image/')) {
        window.Alpine?.store('app')?.toast('Selecciona un archivo de imagen o GIF válido.', 'warning');
        event.target.value = '';
        return;
      }
      window.Alpine?.store('app')?.openCropper(file, 'weapon', weaponId);
      event.target.value = '';
    },

    async processCroppedWeapon(file, weaponId, orientation = null) {
      if (!this.active) return;
      const weapon = this.active.weapons?.find(w => w.id === weaponId);
      if (!weapon) return;
      try {
        const { dataUrl, compressedKB } = await compressImageWithStats(file);
        weapon.imageDataUrl = dataUrl;
        weapon.imageTransform = '';
        weapon.imageIsGif = false;
        if (orientation) weapon.imageOrientation = orientation;
        if (!weapon.imageFit) weapon.imageFit = 'contain';
        this.scheduleAutoSave();
        const orientLabel = (weapon.imageOrientation === 'vertical' || weapon.imageOrientation === 'tall') ? 'vertical' : 'horizontal';
        window.Alpine?.store('app')?.toast(`Arma guardada en formato ${orientLabel} (${compressedKB}KB WebP)`, 'success');
      } catch (e) {
        window.Alpine?.store('app')?.toast('Error al procesar la imagen del arma.', 'error');
      }
    },

    async processCroppedWeaponGif(dataUrl, cssTransform, weaponId, orientation = null) {
      if (!this.active) return;
      const weapon = this.active.weapons?.find(w => w.id === weaponId);
      if (!weapon) return;
      weapon.imageDataUrl = dataUrl;
      weapon.imageTransform = cssTransform;
      weapon.imageIsGif = true;
      if (orientation) weapon.imageOrientation = orientation;
      if (!weapon.imageFit) weapon.imageFit = 'contain';
      this.scheduleAutoSave();
      window.Alpine?.store('app')?.toast('GIF animado de arma configurado con éxito.', 'success');
    },

    async flipWeaponImage(weaponId) {
      const weapon = this.active?.weapons?.find(w => w.id === weaponId);
      if (!weapon || !weapon.imageDataUrl) return;

      const isGif = weapon.imageIsGif || weapon.imageDataUrl.startsWith('data:image/gif');
      if (isGif) {
        weapon.imageTransform = this._toggleCssFlipX(weapon.imageTransform || '');
        this.scheduleAutoSave();
        window.Alpine?.store('app')?.toast('Efecto espejo aplicado al GIF.', 'success');
        return;
      }

      try {
        const flipped = await this._transformDataUrl(weapon.imageDataUrl, (img, canvas, ctx) => {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
          ctx.drawImage(img, 0, 0);
        });
        weapon.imageDataUrl = flipped;
        weapon.imageTransform = '';
        this.scheduleAutoSave();
        window.Alpine?.store('app')?.toast('Efecto espejo aplicado al arma.', 'success');
      } catch (err) {
        window.Alpine?.store('app')?.toast('No se pudo aplicar efecto espejo al arma.', 'error');
      }
    },

    async rotateWeaponImage(weaponId) {
      const weapon = this.active?.weapons?.find(w => w.id === weaponId);
      if (!weapon || !weapon.imageDataUrl) return;

      const nextOrientation = (weapon.imageOrientation === 'vertical' || weapon.imageOrientation === 'tall')
        ? 'horizontal'
        : 'vertical';

      const isGif = weapon.imageIsGif || weapon.imageDataUrl.startsWith('data:image/gif');
      if (isGif) {
        weapon.imageTransform = this._rotateCssTransform(weapon.imageTransform || '', 90);
        weapon.imageOrientation = nextOrientation;
        this.scheduleAutoSave();
        window.Alpine?.store('app')?.toast(`GIF rotado 90° (Orientación: ${nextOrientation}).`, 'success');
        return;
      }

      try {
        const rotated = await this._transformDataUrl(weapon.imageDataUrl, (img, canvas, ctx) => {
          canvas.width = img.height;
          canvas.height = img.width;
          ctx.translate(canvas.width / 2, canvas.height / 2);
          ctx.rotate((90 * Math.PI) / 180);
          ctx.drawImage(img, -img.width / 2, -img.height / 2);
        });
        weapon.imageDataUrl = rotated;
        weapon.imageTransform = '';
        weapon.imageOrientation = nextOrientation;
        this.scheduleAutoSave();
        window.Alpine?.store('app')?.toast(`Arma rotada 90° (Orientación: ${nextOrientation}).`, 'success');
      } catch (err) {
        window.Alpine?.store('app')?.toast('No se pudo rotar el arma.', 'error');
      }
    },

    toggleWeaponImageOrientation(weaponId) {
      const weapon = this.active?.weapons?.find(w => w.id === weaponId);
      if (!weapon) return;
      const current = weapon.imageOrientation || 'horizontal';
      if (current === 'horizontal') {
        weapon.imageOrientation = 'vertical';
      } else if (current === 'vertical') {
        weapon.imageOrientation = 'tall';
      } else if (current === 'tall') {
        weapon.imageOrientation = 'horizontal';
      } else {
        weapon.imageOrientation = 'horizontal';
      }
      this.scheduleAutoSave();
      const labelMap = { horizontal: 'Horizontal (16:9)', vertical: 'Vertical (3:4)', tall: 'Vertical Alargado (9:16)' };
      window.Alpine?.store('app')?.toast(`Formato de arma: ${labelMap[weapon.imageOrientation] || weapon.imageOrientation}`, 'info');
    },

    async reCropWeaponImage(weaponId) {
      const weapon = this.active?.weapons?.find(w => w.id === weaponId);
      if (!weapon || !weapon.imageDataUrl) {
        window.Alpine?.store('app')?.toast('No hay imagen para recortar.', 'info');
        return;
      }
      try {
        const res = await fetch(weapon.imageDataUrl);
        const blob = await res.blob();
        const file = new File([blob], `weapon_${weaponId}_recrop.png`, { type: blob.type || 'image/png' });
        window.Alpine?.store('app')?.openCropper(file, 'weapon', weaponId);
      } catch (e) {
        window.Alpine?.store('app')?.toast('Error al abrir el recortador.', 'error');
      }
    },

    async loadWeaponImageFromUrl(url, weaponId) {
      if (!url || !url.trim()) return;
      const cleanUrl = url.trim();
      window.Alpine?.store('app')?.toast('Descargando imagen del arma...', 'info');
      try {
        const file = await fetchImageAsFileFromUrl(cleanUrl);
        window.Alpine?.store('app')?.openCropper(file, 'weapon', weaponId);
      } catch (err) {
        console.error(`Error al cargar imagen de arma desde URL (${cleanUrl}):`, err);
        window.Alpine?.store('app')?.toast(
          'No se pudo descargar la imagen. Si el sitio requiere inicio de sesión, guarda la imagen en tu dispositivo y súbela como archivo.',
          'error'
        );
      }
    },

    removeWeaponImage(weaponId) {
      const weapon = this.active?.weapons?.find(w => w.id === weaponId);
      if (weapon) {
        if (typeof this.pushUndoSnapshot === 'function') {
          this.pushUndoSnapshot('Quitar imagen de arma');
        }
        weapon.imageDataUrl = '';
        weapon.imageTransform = '';
        weapon.imageIsGif = false;
        this.scheduleAutoSave();
        window.Alpine?.store('app')?.toast('Imagen del arma eliminada.', 'info', {
          label: 'DESHACER (Ctrl+Z)',
          onClick: () => this.undo(),
          duration: 6000
        });
      }
    },

    toggleWeaponImageFit(weaponId) {
      const weapon = this.active?.weapons?.find(w => w.id === weaponId);
      if (weapon) {
        weapon.imageFit = weapon.imageFit === 'cover' ? 'contain' : 'cover';
        this.scheduleAutoSave();
        const modeLabel = weapon.imageFit === 'cover' ? 'Rellenar (Zoom)' : 'Encajar (Completo)';
        window.Alpine?.store('app')?.toast(`Ajuste de imagen: ${modeLabel}`, 'info');
      }
    },

    // ── Power-Scaling ──────────────────────────────────────────
    addFeat() {
      if (!this.active) return;
      if (!Array.isArray(this.active.powerScaling.feats)) {
        this.active.powerScaling.feats = [];
      }
      this.active.powerScaling.feats.unshift({
        id: crypto.randomUUID(),
        title: '',
        targetStat: '',
        tier: '',
        auditState: 'consistent',
        context: '',
        link: '',
      });
      this.scheduleAutoSave();
    },

    removeFeat(id) {
      if (!this.active) return;
      if (typeof this.pushUndoSnapshot === 'function') {
        this.pushUndoSnapshot('Eliminar hazaña');
      }
      this.active.powerScaling.feats = this.active.powerScaling.feats.filter(f => f.id !== id);
      this.scheduleAutoSave();
      window.Alpine?.store('app')?.toast('Hazaña eliminada.', 'info', {
        label: 'DESHACER (Ctrl+Z)',
        onClick: () => this.undo(),
        duration: 6000
      });
    },

    addHaxTag() {
      if (!this.active) return;
      const tag = (this.active.powerScaling.haxInput || '').trim();
      if (!tag) return;
      if (!Array.isArray(this.active.powerScaling.haxList)) {
        this.active.powerScaling.haxList = [];
      }
      if (!this.active.powerScaling.haxList.includes(tag)) {
        this.active.powerScaling.haxList.push(tag);
      }
      this.active.powerScaling.haxInput = '';
      this.scheduleAutoSave();
    },

    removeHaxTag(index) {
      if (!this.active || !Array.isArray(this.active.powerScaling.haxList)) return;
      if (typeof this.pushUndoSnapshot === 'function') {
        this.pushUndoSnapshot('Eliminar hax');
      }
      this.active.powerScaling.haxList.splice(index, 1);
      this.scheduleAutoSave();
      window.Alpine?.store('app')?.toast('Hax eliminado.', 'info', {
        label: 'DESHACER (Ctrl+Z)',
        onClick: () => this.undo(),
        duration: 6000
      });
    },

    addResistanceTag(customTag = null) {
      if (!this.active) return;
      const rawTag = (customTag !== null ? customTag : (this.active.powerScaling.resistancesInput || ''));
      const tag = (rawTag || '').trim();
      if (!tag) return;
      if (!Array.isArray(this.active.powerScaling.resistancesList)) {
        this.active.powerScaling.resistancesList = [];
      }
      if (!this.active.powerScaling.resistancesList.includes(tag)) {
        this.active.powerScaling.resistancesList.push(tag);
      }
      if (customTag === null) {
        this.active.powerScaling.resistancesInput = '';
      }
      this.scheduleAutoSave();
    },

    removeResistanceTag(index) {
      if (!this.active || !Array.isArray(this.active.powerScaling.resistancesList)) return;
      if (typeof this.pushUndoSnapshot === 'function') {
        this.pushUndoSnapshot('Eliminar resistencia');
      }
      this.active.powerScaling.resistancesList.splice(index, 1);
      this.scheduleAutoSave();
      window.Alpine?.store('app')?.toast('Resistencia eliminada.', 'info', {
        label: 'DESHACER (Ctrl+Z)',
        onClick: () => this.undo(),
        duration: 6000
      });
    },

    toggleResistancePreset(tag) {
      if (!this.active) return;
      if (!Array.isArray(this.active.powerScaling.resistancesList)) {
        this.active.powerScaling.resistancesList = [];
      }
      const list = this.active.powerScaling.resistancesList;
      const idx = list.indexOf(tag);
      if (idx >= 0) {
        list.splice(idx, 1);
      } else {
        list.push(tag);
      }
      this.scheduleAutoSave();
    },

    async randomizePowerMatrix() {
      if (!this.active || !this.active.powerScaling) return;
      await window.Alpine?.store('app')?.ensurePowerScalingLoaded?.();
      const ps = this.active.powerScaling;
      const powerOptions = window.Alpine?.store('app')?.powerOptions;
      if (!powerOptions) return;

      const rollResult = rollWeightedPowerMatrix(powerOptions);
      if (!rollResult) return;

      Object.assign(ps, rollResult.attributes);
      this.scheduleAutoSave();

      const rarity = rollResult.rarity;
      const tierLabel = rollResult.tierLabel || rollResult.tierValue;

      if (typeof document !== 'undefined') {
        const cards = document.querySelectorAll('.power-attribute-card');
        const glowClass = rarity.id === 'mythic'
          ? 'matrix-flash-mythic'
          : (rarity.id === 'legendary' ? 'matrix-flash-legendary' : 'matrix-flash-glow');

        cards.forEach(card => {
          card.classList.remove('matrix-flash-glow', 'matrix-flash-legendary', 'matrix-flash-mythic');
          card.style.setProperty('--rarity-flash-color', rarity.glowColor || 'rgba(0, 240, 255, 0.8)');
          void card.offsetWidth;
          card.classList.add(glowClass);
        });
        setTimeout(() => {
          cards.forEach(card => card.classList.remove('matrix-flash-glow', 'matrix-flash-legendary', 'matrix-flash-mythic'));
        }, 1100);
      }

      // Notificación estilizada según la rareza obtenida
      const appStore = window.Alpine?.store('app');
      if (rarity.id === 'mythic') {
        appStore?.toast?.(`¡TIRADA MÍTICA! Nivel Divino: ${tierLabel} (Probabilidad: ~1%)`, 'success');
      } else if (rarity.id === 'legendary') {
        appStore?.toast?.(`¡TIRADA LEGENDARIA! Nivel Hiperversal: ${tierLabel} (~2.5%)`, 'success');
      } else if (rarity.id === 'epic') {
        appStore?.toast?.(`¡Tirada Épica! Nivel Cósmico / Multiversal: ${tierLabel}`, 'info');
      } else if (rarity.id === 'rare') {
        appStore?.toast?.(`Tirada Rara: Nivel Planetario / Estelar: ${tierLabel}`, 'info');
      } else if (rarity.id === 'uncommon') {
        appStore?.toast?.(`Tirada: Nivel Urbano / Geográfico: ${tierLabel}`, 'info');
      } else {
        appStore?.toast?.(`Tirada: Nivel Terrenal / Humano: ${tierLabel}`, 'info');
      }

      return rollResult;
    },

    getPowerScalingRarity(tierValue) {
      const powerOptions = window.Alpine?.store('app')?.powerOptions;
      return getTierRarity(tierValue, powerOptions?.overallTier || []);
    },

    getPowerRaritiesList() {
      return POWER_RARITIES;
    },

    // ── Objetivos Secundarios (Prioridades) ─────────────────────
    addSecondaryGoal() {
      if (!this.active) return;
      if (!this.active.priorities) {
        this.active.priorities = {
          mainGoal: '',
          secondaryGoals: [],
          greatestFear: '',
          deepMotivation: '',
          currentConflict: '',
          maxLoyalty: '',
          sacrificeLine: '',
        };
      }
      if (!Array.isArray(this.active.priorities.secondaryGoals)) {
        if (typeof this.active.priorities.secondaryGoals === 'string' && this.active.priorities.secondaryGoals.trim()) {
          this.active.priorities.secondaryGoals = [{
            id: 'goal_' + Date.now(),
            text: this.active.priorities.secondaryGoals.trim(),
            status: 'in_progress'
          }];
        } else {
          this.active.priorities.secondaryGoals = [];
        }
      }

      const newGoal = {
        id: 'goal_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        text: '',
        status: 'in_progress',
      };

      this.active.priorities.secondaryGoals.push(newGoal);
      this._persist(this.active);
      this.scheduleAutoSave();
    },

    cycleSecondaryGoalStatus(goalId) {
      if (!this.active?.priorities?.secondaryGoals) return;
      const goal = this.active.priorities.secondaryGoals.find(g => g.id === goalId);
      if (!goal) return;

      const order = ['in_progress', 'completed', 'pending', 'abandoned'];
      const currentIdx = order.indexOf(goal.status || 'in_progress');
      const nextIdx = (currentIdx + 1) % order.length;
      goal.status = order[nextIdx];

      this._persist(this.active);
      this.scheduleAutoSave();
    },

    reorderSecondaryGoals(fromIdx, toIdx) {
      if (!this.active?.priorities?.secondaryGoals) return;
      const goals = this.active.priorities.secondaryGoals;
      if (fromIdx < 0 || fromIdx >= goals.length || toIdx < 0 || toIdx >= goals.length) return;

      const [item] = goals.splice(fromIdx, 1);
      goals.splice(toIdx, 0, item);

      this._persist(this.active);
      this.scheduleAutoSave();
    },

    removeSecondaryGoal(goalId) {
      if (!this.active?.priorities?.secondaryGoals) return;
      if (typeof this.pushUndoSnapshot === 'function') {
        this.pushUndoSnapshot('Eliminar objetivo secundario');
      }
      this.active.priorities.secondaryGoals = this.active.priorities.secondaryGoals.filter(g => g.id !== goalId);
      this._persist(this.active);
      this.scheduleAutoSave();
      window.Alpine?.store('app')?.toast('Objetivo eliminado.', 'info', {
        label: 'DESHACER (Ctrl+Z)',
        onClick: () => this.undo(),
        duration: 6000
      });
    },

    // ── Ejes de Personalidad (Mente) ───────────────────────────
    addPersonalityAxis(leftLabel = 'Nuevo Polo Izq.', rightLabel = 'Nuevo Polo Der.', defaultValue = 50, category = 'General') {
      if (!this.active) return;
      if (!this.active.mind) this.active.mind = {};
      if (!Array.isArray(this.active.mind.axes)) {
        this.active.mind.axes = [];
      }

      const cleanVal = isNaN(Number(defaultValue)) ? 50 : Math.max(0, Math.min(100, Number(defaultValue)));
      const newAxis = {
        id: crypto.randomUUID(),
        leftLabel: (leftLabel || 'Polo Izquierdo').trim(),
        rightLabel: (rightLabel || 'Polo Derecho').trim(),
        value: cleanVal,
        category: (category || 'General').trim()
      };

      this.active.mind.axes.push(newAxis);
      this._persist(this.active);
      this.scheduleAutoSave();
      window.Alpine?.store('app')?.toast(`Eje «${newAxis.leftLabel} ⟷ ${newAxis.rightLabel}» añadido.`, 'success');
      return newAxis.id;
    },

    removePersonalityAxis(axisId) {
      if (!this.active?.mind?.axes) return;
      if (typeof this.pushUndoSnapshot === 'function') {
        this.pushUndoSnapshot('Eliminar eje de personalidad');
      }
      this.active.mind.axes = this.active.mind.axes.filter(a => a.id !== axisId);
      this._persist(this.active);
      this.scheduleAutoSave();
      window.Alpine?.store('app')?.toast('Eje de personalidad eliminado.', 'info', {
        label: 'DESHACER (Ctrl+Z)',
        onClick: () => this.undo(),
        duration: 6000
      });
    },

    reorderPersonalityAxes(fromIdx, toIdx) {
      if (!this.active?.mind?.axes) return;
      const axes = this.active.mind.axes;
      if (fromIdx < 0 || fromIdx >= axes.length || toIdx < 0 || toIdx >= axes.length) return;

      const [moved] = axes.splice(fromIdx, 1);
      axes.splice(toIdx, 0, moved);

      this._persist(this.active);
      this.scheduleAutoSave();
    },

    resetPersonalityAxes() {
      if (!this.active) return;
      if (!this.active.mind) this.active.mind = {};
      if (typeof this.pushUndoSnapshot === 'function') {
        this.pushUndoSnapshot('Restaurar ejes de personalidad');
      }
      this.active.mind.axes = getDefaultPersonalityAxes();
      this._persist(this.active);
      this.scheduleAutoSave();
      window.Alpine?.store('app')?.toast('Ejes de personalidad restaurados a 15 ejes predeterminados.', 'success', {
        label: 'DESHACER',
        onClick: () => this.undo(),
        duration: 6000
      });
    }
  };
}
