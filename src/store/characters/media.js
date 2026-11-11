/**
 * store/characters/media.js
 * Gestión de medios visuales: Subida, recorte, optimización WebP, GIFs animados y transformaciones CSS.
 */

import { compressImageWithStats } from '../../utils/imageCompressor.js';
import { fetchImageAsFileFromUrl } from '../../utils/imageUrlResolver.js';
import { convertHeight, convertWeight } from '../../utils/unitConverter.js';

export function createMediaMethods() {
  return {
    // ── Helper: Transformaciones CSS seguras para GIFs animados (sin aplanar en Canvas) ──
    _toggleCssFlipX(currentTransform) {
      if (!currentTransform) return 'transform: scaleX(-1);';
      if (currentTransform.includes('scaleX(-1)')) {
        return currentTransform.replace('scaleX(-1)', 'scaleX(1)');
      }
      if (currentTransform.includes('scaleX(1)')) {
        return currentTransform.replace('scaleX(1)', 'scaleX(-1)');
      }
      if (currentTransform.includes('transform:')) {
        return currentTransform.replace('transform:', 'transform: scaleX(-1) ');
      }
      return currentTransform + ' transform: scaleX(-1);';
    },

    _rotateCssTransform(currentTransform, angle = 90) {
      if (!currentTransform) return `transform: rotate(${angle}deg);`;
      const rotMatch = currentTransform.match(/rotate\((-?\d+)deg\)/);
      if (rotMatch) {
        const currentAngle = parseInt(rotMatch[1], 10) || 0;
        const nextAngle = (currentAngle + angle) % 360;
        return currentTransform.replace(rotMatch[0], `rotate(${nextAngle}deg)`);
      }
      if (currentTransform.includes('transform:')) {
        return currentTransform.replace('transform:', `transform: rotate(${angle}deg) `);
      }
      return currentTransform + ` transform: rotate(${angle}deg);`;
    },

    // ── Helper: Gestión de ID Visual Multi-Activo (Avatar, Báner, Ícono) ─────────
    async _transformDataUrl(dataUrl, transformFn) {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          transformFn(img, canvas, ctx);
          const res = canvas.toDataURL('image/webp', 0.90);
          canvas.width = 0;
          canvas.height = 0;
          img.src = '';
          resolve(res);
        };
        img.onerror = (e) => reject(e);
        img.src = dataUrl;
      });
    },

    async rotateAsset(assetType = 'avatar', targetCharId = null) {
      const idToFind = targetCharId || this.activeId;
      const char = this.list.find(c => c.id === idToFind) || (this.active?.id === idToFind ? this.active : null);
      if (!char || !char.basics) return;
      const prop = assetType === 'banner' ? 'bannerDataUrl' : assetType === 'icon' ? 'iconDataUrl' : 'avatarDataUrl';
      const current = char.basics[prop];
      if (!current) return;

      const transformProp = assetType === 'banner' ? 'bannerTransform' : assetType === 'icon' ? 'iconTransform' : 'avatarTransform';
      const isGif = current.startsWith('data:image/gif') || (char.basics[transformProp] && char.basics[transformProp].includes('scale'));
      if (isGif) {
        char.basics[transformProp] = this._rotateCssTransform(char.basics[transformProp] || '', 90);
        if (this.active && this.active.id === char.id) {
          this.active.basics[transformProp] = char.basics[transformProp];
        }
        await this._persist(char);
        this.scheduleAutoSave();
        window.Alpine?.store('app')?.toast('Recurso rotado 90° con éxito.', 'success');
        return;
      }
      
      try {
        const rotated = await this._transformDataUrl(current, (img, canvas, ctx) => {
          canvas.width = img.height;
          canvas.height = img.width;
          ctx.translate(canvas.width / 2, canvas.height / 2);
          ctx.rotate((90 * Math.PI) / 180);
          ctx.drawImage(img, -img.width / 2, -img.height / 2);
        });
        char.basics[prop] = rotated;
        if (this.active && this.active.id === char.id) {
          this.active.basics[prop] = rotated;
        }
        await this._persist(char);
        this.scheduleAutoSave();
        window.Alpine?.store('app')?.toast('Recurso rotado 90° con éxito.', 'success');
      } catch (err) {
        window.Alpine?.store('app')?.toast('No se pudo rotar la imagen.', 'error');
      }
    },

    async flipAsset(assetType = 'avatar', targetCharId = null) {
      const idToFind = targetCharId || this.activeId;
      const char = this.list.find(c => c.id === idToFind) || (this.active?.id === idToFind ? this.active : null);
      if (!char || !char.basics) return;
      const prop = assetType === 'banner' ? 'bannerDataUrl' : assetType === 'icon' ? 'iconDataUrl' : 'avatarDataUrl';
      const current = char.basics[prop];
      if (!current) return;

      const transformProp = assetType === 'banner' ? 'bannerTransform' : assetType === 'icon' ? 'iconTransform' : 'avatarTransform';
      const isGif = current.startsWith('data:image/gif') || (char.basics[transformProp] && char.basics[transformProp].includes('scale'));
      if (isGif) {
        char.basics[transformProp] = this._toggleCssFlipX(char.basics[transformProp] || '');
        if (this.active && this.active.id === char.id) {
          this.active.basics[transformProp] = char.basics[transformProp];
        }
        await this._persist(char);
        this.scheduleAutoSave();
        window.Alpine?.store('app')?.toast('Efecto espejo aplicado con éxito.', 'success');
        return;
      }
      
      try {
        const flipped = await this._transformDataUrl(current, (img, canvas, ctx) => {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
          ctx.drawImage(img, 0, 0);
        });
        char.basics[prop] = flipped;
        if (this.active && this.active.id === char.id) {
          this.active.basics[prop] = flipped;
        }
        await this._persist(char);
        this.scheduleAutoSave();
        window.Alpine?.store('app')?.toast('Efecto espejo aplicado con éxito.', 'success');
      } catch (err) {
        window.Alpine?.store('app')?.toast('No se pudo aplicar efecto espejo.', 'error');
      }
    },

    async reCropAsset(assetType = 'avatar', targetCharId = null) {
      const idToFind = targetCharId || this.activeId;
      const char = this.list.find(c => c.id === idToFind) || (this.active?.id === idToFind ? this.active : null);
      if (!char || !char.basics) return;
      const prop = assetType === 'banner' ? 'bannerDataUrl' : assetType === 'icon' ? 'iconDataUrl' : 'avatarDataUrl';
      const current = char.basics[prop];
      if (!current) {
        window.Alpine?.store('app')?.toast('No hay imagen cargada para recortar en este recurso.', 'info');
        return;
      }
      
      try {
        const res = await fetch(current);
        const blob = await res.blob();
        const file = new File([blob], `${assetType}_recrop.png`, { type: blob.type || 'image/png' });
        window.Alpine?.store('app')?.openCropper(file, assetType, idToFind);
      } catch (e) {
        window.Alpine?.store('app')?.toast('Error al abrir el recortador.', 'error');
      }
    },

    async loadAssetFromUrl(url, assetType = 'avatar', targetCharId = null) {
      if (!url || !url.trim()) return;
      const cleanUrl = url.trim();
      const idToFind = targetCharId || this.activeId;
      await window.Alpine?.store('app')?.openMediaUrl(cleanUrl, assetType, idToFind);
    },

    removeAsset(assetType = 'avatar', targetCharId = null) {
      if (assetType === 'avatar') {
        this.removeAvatar();
      } else if (assetType === 'banner') {
        this.removeBanner(targetCharId);
      } else if (assetType === 'icon') {
        this.removeIcon(targetCharId);
      }
    },

    // ── Helper: Carga de Avatar con compresión y soporte de GIF ─────────
    async uploadAvatar(event) {
      const file = event.target.files?.[0];
      if (!file || !this.active) return;
      if (!file.type.startsWith('image/')) {
        window.Alpine?.store('app')?.toast('Selecciona un archivo de imagen válido.', 'warning');
        return;
      }
      window.Alpine?.store('app')?.openCropper(file, 'avatar');
      event.target.value = '';
    },

    async processCroppedAvatar(file) {
      if (!this.active) return;
      try {
        const { dataUrl, compressedKB } = await compressImageWithStats(file);
        if (!this.active.basics) this.active.basics = {};
        this.active.basics.avatarDataUrl = dataUrl;
        this.active.basics.avatarTransform = '';
        this.scheduleAutoSave();
        window.Alpine?.store('app')?.toast(`Avatar actualizado. Recortado y comprimido a ${compressedKB}KB (WebP)`, 'success');
      } catch (e) {
        window.Alpine?.store('app')?.toast('Error al procesar la imagen.', 'error');
      }
    },

    async processCroppedAvatarGif(dataUrl, cssTransform) {
      if (!this.active) return;
      if (!this.active.basics) this.active.basics = {};
      this.active.basics.avatarDataUrl = dataUrl;
      this.active.basics.avatarTransform = cssTransform;
      await this._persist(this.active);
      this.scheduleAutoSave();
      window.Alpine?.store('app')?.toast('Avatar GIF animado configurado con encuadre CSS.', 'success');
    },

    // ── Helper: Carga de Banner Personalizado ──────
    uploadBanner(event, targetCharId) {
      const file = event.target.files?.[0];
      if (!file) return;
      if (!file.type.startsWith('image/')) {
        window.Alpine?.store('app')?.toast('Selecciona un archivo de imagen válido.', 'warning');
        return;
      }
      const charId = targetCharId || this.activeId;
      window.Alpine?.store('app')?.openCropper(file, 'banner', charId);
      event.target.value = '';
    },

    async processCroppedBanner(file, targetCharId) {
      const idToFind = targetCharId || this.activeId;
      const char = this.list.find(c => c.id === idToFind) || (this.active?.id === idToFind ? this.active : null);
      if (!char) return;
      try {
        const { dataUrl, compressedKB } = await compressImageWithStats(file, 1200, 400);
        if (!char.basics) char.basics = {};
        char.basics.bannerDataUrl = dataUrl;
        char.basics.bannerTransform = '';
        if (this.active && this.active.id === char.id) {
          this.active.basics.bannerDataUrl = dataUrl;
          this.active.basics.bannerTransform = '';
        }
        await this._persist(char);
        window.Alpine?.store('app')?.toast(`Banner recortado y optimizado a ${compressedKB}KB (WebP)`, 'success');
      } catch (e) {
        window.Alpine?.store('app')?.toast('Error al procesar la imagen del banner.', 'error');
      }
    },

    async processCroppedBannerGif(dataUrl, cssTransform, targetCharId) {
      const idToFind = targetCharId || this.activeId;
      const char = this.list.find(c => c.id === idToFind) || (this.active?.id === idToFind ? this.active : null);
      if (!char) return;
      if (!char.basics) char.basics = {};
      char.basics.bannerDataUrl = dataUrl;
      char.basics.bannerTransform = cssTransform;
      if (this.active && this.active.id === char.id) {
        this.active.basics.bannerDataUrl = dataUrl;
        this.active.basics.bannerTransform = cssTransform;
      }
      await this._persist(char);
      window.Alpine?.store('app')?.toast('Banner GIF animado configurado con encuadre CSS.', 'success');
    },

    async removeBanner(targetCharId) {
      const idToFind = targetCharId || this.activeId;
      const char = this.list.find(c => c.id === idToFind) || (this.active?.id === targetCharId ? this.active : null);
      if (char && char.basics) {
        char.basics.bannerDataUrl = '';
        char.basics.bannerTransform = '';
        if (this.active && this.active.id === char.id) {
          this.active.basics.bannerDataUrl = '';
          this.active.basics.bannerTransform = '';
        }
        await this._persist(char);
        window.Alpine?.store('app')?.toast('Banner eliminado.', 'info');
      }
    },

    toggleUnitSystem(targetCharId) {
      const idToFind = targetCharId || this.activeId;
      const char = this.list.find(c => c.id === idToFind) || (this.active?.id === idToFind ? this.active : null);
      if (!char) return;
      if (!char.body) char.body = {};

      const currentSystem = char.body.unitSystem || 'metric';
      const newSystem = currentSystem === 'metric' ? 'imperial' : 'metric';

      if (char.body.height) {
        char.body.height = convertHeight(char.body.height, newSystem);
      }
      if (char.body.weight) {
        char.body.weight = convertWeight(char.body.weight, newSystem);
      }

      char.body.unitSystem = newSystem;
      if (this.active && this.active.id === char.id) {
        this.active.body.unitSystem = newSystem;
        this.active.body.height = char.body.height;
        this.active.body.weight = char.body.weight;
      }

      this._persist(char);
      this.scheduleAutoSave();
      window.Alpine?.store('app')?.toast(`Sistema de unidades cambiado a: ${newSystem === 'metric' ? 'Métrico (M/KG)' : 'Imperial (FT/LBS)'}`, 'info');
    },

    // ── Helper: Carga de Icono Dedicado ────
    uploadIcon(event, targetCharId) {
      const file = event.target.files?.[0];
      if (!file) return;
      if (!file.type.startsWith('image/')) {
        window.Alpine?.store('app')?.toast('Selecciona un archivo de imagen válido.', 'warning');
        return;
      }
      const charId = targetCharId || this.activeId;
      window.Alpine?.store('app')?.openCropper(file, 'icon', charId);
      event.target.value = '';
    },

    async processCroppedIcon(file, targetCharId) {
      const idToFind = targetCharId || this.activeId;
      const char = this.list.find(c => c.id === idToFind) || (this.active?.id === idToFind ? this.active : null);
      if (!char) return;
      try {
        const { dataUrl, compressedKB } = await compressImageWithStats(file, 400, 400);
        if (!char.basics) char.basics = {};
        char.basics.iconDataUrl = dataUrl;
        char.basics.iconTransform = '';
        if (this.active && this.active.id === char.id) {
          this.active.basics.iconDataUrl = dataUrl;
          this.active.basics.iconTransform = '';
        }
        await this._persist(char);
        window.Alpine?.store('app')?.toast(`Icono actualizado y comprimido a ${compressedKB}KB (WebP)`, 'success');
      } catch (e) {
        window.Alpine?.store('app')?.toast('Error al procesar el icono recortado.', 'error');
      }
    },

    async processCroppedIconGif(dataUrl, cssTransform, targetCharId) {
      const idToFind = targetCharId || this.activeId;
      const char = this.list.find(c => c.id === idToFind) || (this.active?.id === idToFind ? this.active : null);
      if (!char) return;
      if (!char.basics) char.basics = {};
      char.basics.iconDataUrl = dataUrl;
      char.basics.iconTransform = cssTransform;
      if (this.active && this.active.id === char.id) {
        this.active.basics.iconDataUrl = dataUrl;
        this.active.basics.iconTransform = cssTransform;
      }
      await this._persist(char);
      window.Alpine?.store('app')?.toast('Icono GIF animado configurado con encuadre CSS.', 'success');
    },

    async removeIcon(targetCharId) {
      const idToFind = targetCharId || this.activeId;
      const char = this.list.find(c => c.id === idToFind) || (this.active?.id === null ? this.active : null);
      if (char && char.basics) {
        char.basics.iconDataUrl = '';
        char.basics.iconTransform = '';
        if (this.active && this.active.id === char.id) {
          this.active.basics.iconDataUrl = '';
          this.active.basics.iconTransform = '';
        }
        await this._persist(char);
        window.Alpine?.store('app')?.toast('Icono eliminado.', 'info');
      }
    },

    // ── Alternar Fuente PFP en la Namecard (Icono vs Avatar) ────
    async togglePfpSource(targetCharId) {
      const idToFind = targetCharId || this.activeId;
      const char = this.list.find(c => c.id === idToFind) || (this.active?.id === idToFind ? this.active : null);
      if (char && char.basics) {
        char.basics.useIconForPfp = !char.basics.useIconForPfp;
        if (this.active && this.active.id === char.id) {
          this.active.basics.useIconForPfp = char.basics.useIconForPfp;
        }
        await this._persist(char);
        const mode = char.basics.useIconForPfp ? 'Icono' : 'Avatar Principal';
        window.Alpine?.store('app')?.toast(`PFP en Namecards cambiado a: ${mode}`, 'info');
      }
    },

    // ── Helper: Fondos Dinámicos (Level 3) ──────────────────────
    uploadBackgroundImage(event) {
      const file = event.target.files?.[0];
      if (!file) return;
      if (!file.type.startsWith('image/')) {
        window.Alpine?.store('app')?.toast('Selecciona una imagen o GIF válido.', 'warning');
        return;
      }
      window.Alpine?.store('app')?.openCropper(file, 'bg_character');
      event.target.value = '';
    },

    openCropperForCharacterBg() {
      const img = this.active?.presentation?.background?.image || this.active?.visualSettings?.backgroundUrl;
      if (!img) {
        window.Alpine?.store('app')?.toast('Primero debes subir una imagen o GIF.', 'info');
        return;
      }
      window.Alpine?.store('app')?.openCropper(img, 'bg_character');
    },

    async processCroppedCharacterBg(file) {
      if (!this.active) return;
      try {
        const { dataUrl, compressedKB } = await compressImageWithStats(file, 1920, 1080);
        if (!this.active.presentation) this.active.presentation = {};
        if (!this.active.presentation.background) this.active.presentation.background = {};
        this.active.presentation.background.image = dataUrl;
        this.active.presentation.background.transform = '';
        this.active.presentation.background.mode = 'custom';
        this.active.presentation.background.posX = 50;
        this.active.presentation.background.posY = 50;
        this.active.presentation.background.zoom = 100;
        if (!this.active.visualSettings) this.active.visualSettings = {};
        this.active.visualSettings.backgroundUrl = dataUrl;
        this.active.visualSettings.backgroundMode = 'custom';
        this.scheduleAutoSave();
        window.Alpine?.store('app')?.toast(`Fondo de ficha ajustado y guardado (${compressedKB}KB WebP)`, 'success');
      } catch (e) {
        window.Alpine?.store('app')?.toast('Error al procesar la imagen de fondo.', 'error');
      }
    },

    async processCroppedCharacterBgGif(dataUrl, cssTransform) {
      if (!this.active) return;
      if (!this.active.presentation) this.active.presentation = {};
      if (!this.active.presentation.background) this.active.presentation.background = {};
      this.active.presentation.background.image = dataUrl;
      this.active.presentation.background.transform = cssTransform;
      this.active.presentation.background.mode = 'custom';
      if (!this.active.visualSettings) this.active.visualSettings = {};
      this.active.visualSettings.backgroundUrl = dataUrl;
      this.active.visualSettings.backgroundMode = 'custom';
      this.scheduleAutoSave();
      window.Alpine?.store('app')?.toast('Fondo GIF de ficha configurado con encuadre visual.', 'success');
    },

    removeBackgroundImage() {
      if (!this.active) return;
      if (!this.active.presentation) this.active.presentation = {};
      if (!this.active.presentation.background) this.active.presentation.background = {};
      this.active.presentation.background.image = '';
      this.active.presentation.background.transform = '';
      if (!this.active.visualSettings) this.active.visualSettings = {};
      this.active.visualSettings.backgroundUrl = '';
      if (this.active.presentation.background.mode === 'custom') {
        this.active.presentation.background.mode = 'pattern';
        this.active.visualSettings.backgroundMode = 'pattern';
      }
      this.scheduleAutoSave();
      window.Alpine?.store('app')?.toast('Fondo de ficha eliminado.', 'info');
    },

    setBackgroundUrl(url) {
      if (!this.active) return;
      if (!this.active.presentation) this.active.presentation = {};
      if (!this.active.presentation.background) this.active.presentation.background = {};
      this.active.presentation.background.image = url;
      if (!this.active.visualSettings) this.active.visualSettings = {};
      this.active.visualSettings.backgroundUrl = url;
      if (url) {
        this.active.presentation.background.mode = 'custom';
        this.active.visualSettings.backgroundMode = 'custom';
      }
      this.scheduleAutoSave();
    },

    updateBackgroundMode(mode) {
      if (!this.active) return;
      if (!this.active.presentation) this.active.presentation = {};
      if (!this.active.presentation.background) this.active.presentation.background = {};
      this.active.presentation.background.mode = mode;
      if (!this.active.visualSettings) this.active.visualSettings = {};
      this.active.visualSettings.backgroundMode = mode;
      this.scheduleAutoSave();
    },

    updateBackgroundBlur(val) {
      if (!this.active) return;
      const n = Number(val);
      if (!this.active.presentation) this.active.presentation = {};
      if (!this.active.presentation.background) this.active.presentation.background = {};
      this.active.presentation.background.blur = n;
      if (!this.active.visualSettings) this.active.visualSettings = {};
      this.active.visualSettings.backgroundBlur = n;
      this.scheduleAutoSave();
    },

    updateBackgroundOpacity(val) {
      if (!this.active) return;
      const n = Number(val);
      if (!this.active.presentation) this.active.presentation = {};
      if (!this.active.presentation.background) this.active.presentation.background = {};
      this.active.presentation.background.opacity = n;
      if (!this.active.visualSettings) this.active.visualSettings = {};
      this.active.visualSettings.backgroundOpacity = n;
      this.scheduleAutoSave();
    },

    updateBackgroundPosX(val) {
      if (!this.active) return;
      const n = Number(val);
      if (!this.active.presentation) this.active.presentation = {};
      if (!this.active.presentation.background) this.active.presentation.background = {};
      this.active.presentation.background.posX = n;
      if (!this.active.visualSettings) this.active.visualSettings = {};
      this.active.visualSettings.backgroundPosX = n;
      this.scheduleAutoSave();
    },

    updateBackgroundPosY(val) {
      if (!this.active) return;
      const n = Number(val);
      if (!this.active.presentation) this.active.presentation = {};
      if (!this.active.presentation.background) this.active.presentation.background = {};
      this.active.presentation.background.posY = n;
      if (!this.active.visualSettings) this.active.visualSettings = {};
      this.active.visualSettings.backgroundPosY = n;
      this.scheduleAutoSave();
    },

    updateBackgroundZoom(val) {
      if (!this.active) return;
      const n = Number(val);
      if (!this.active.presentation) this.active.presentation = {};
      if (!this.active.presentation.background) this.active.presentation.background = {};
      this.active.presentation.background.zoom = n;
      if (!this.active.visualSettings) this.active.visualSettings = {};
      this.active.visualSettings.backgroundZoom = n;
      this.scheduleAutoSave();
    },

    updateBackgroundScrim(val) {
      if (!this.active) return;
      const n = Number(val);
      if (!this.active.presentation) this.active.presentation = {};
      if (!this.active.presentation.background) this.active.presentation.background = {};
      this.active.presentation.background.scrim = n;
      if (!this.active.visualSettings) this.active.visualSettings = {};
      this.active.visualSettings.backgroundScrim = n;
      this.scheduleAutoSave();
    },

    resetBackgroundFrame() {
      if (!this.active) return;
      if (!this.active.presentation) this.active.presentation = {};
      if (!this.active.presentation.background) this.active.presentation.background = {};
      this.active.presentation.background.transform = '';
      this.active.presentation.background.zoom = 100;
      this.active.presentation.background.posX = 50;
      this.active.presentation.background.posY = 50;
      if (!this.active.visualSettings) this.active.visualSettings = {};
      this.active.visualSettings.backgroundZoom = 100;
      this.active.visualSettings.backgroundPosX = 50;
      this.active.visualSettings.backgroundPosY = 50;
      this.scheduleAutoSave();
      window.Alpine?.store('app')?.toast?.('Encuadre de fondo de ficha restablecido a valores centrales.', 'info');
    },

    getBackgroundStyle() {
      const bg = this.active?.presentation?.background || {};
      const blur = bg.blur || 0;
      if (bg.transform) {
        return `${bg.transform} filter: blur(${blur}px);`;
      }
      const zoom = Math.max(1, (bg.zoom ?? 100) / 100);
      const x = Math.max(0, Math.min(100, bg.posX ?? 50));
      const y = Math.max(0, Math.min(100, bg.posY ?? 50));
      return `filter: blur(${blur}px); transform: scale(${zoom}); transform-origin: ${x}% ${y}%; object-position: ${x}% ${y}%;`;
    },

    removeAvatar() {
      if (!this.active) return;
      if (this.active.basics) {
        this.active.basics.avatarDataUrl = '';
        this.active.basics.avatarTransform = '';
      }
      this.scheduleAutoSave();
      window.Alpine?.store('app')?.toast('Foto de perfil eliminada.', 'info');
    },

    // ── Formato, Geometría y Curvatura del Perfil (Avatar / PFP) ─────────
    setAvatarShape(shape, targetCharId = null) {
      const char = targetCharId ? this.list.find(c => c.id === targetCharId) : this.active;
      if (!char) return;
      if (char.isLocked) {
        window.Alpine?.store('app')?.toast('Esta ficha está protegida contra edición.', 'error');
        return;
      }
      if (!char.basics) char.basics = {};

      let newRadius = 25;
      let shapeKey = shape;
      let label = 'Redondeado estándar';

      switch (shape) {
        case 'square':
        case 'sharp':
        case 'recto':
          newRadius = 0;
          shapeKey = 'square';
          label = 'Cuadrado (0% esquinas rectas)';
          break;
        case 'smooth':
        case 'soft':
        case 'suave':
          newRadius = 12;
          shapeKey = 'smooth';
          label = 'Suave (12% curvatura)';
          break;
        case 'squircle':
        case 'superellipse':
          newRadius = 38;
          shapeKey = 'squircle';
          label = 'Squircle moderno (38%)';
          break;
        case 'circle':
        case 'round':
        case 'circular':
        case 'redondo':
          newRadius = 50;
          shapeKey = 'circle';
          label = 'Circular (100% redondo)';
          break;
        case 'rounded':
        default:
          newRadius = 25;
          shapeKey = 'rounded';
          label = 'Redondeado estándar (25%)';
          break;
      }

      if (char.basics.avatarShape === shapeKey && char.basics.avatarRadius === newRadius) return;

      if (typeof this.pushUndoSnapshot === 'function') {
        this.pushUndoSnapshot(`Cambiar formato de perfil a ${label}`);
      }

      char.basics.avatarShape = shapeKey;
      char.basics.avatarRadius = newRadius;

      if (this.active && this.active.id === char.id) {
        this.active.basics.avatarShape = shapeKey;
        this.active.basics.avatarRadius = newRadius;
      }

      this._persist(char);
      if (typeof this.scheduleAutoSave === 'function') this.scheduleAutoSave();
      window.Alpine?.store('app')?.toast(`Bordes de perfil: ${label}.`, 'info');
    },

    setAvatarRadius(radius, targetCharId = null, notify = false) {
      const char = targetCharId ? this.list.find(c => c.id === targetCharId) : this.active;
      if (!char) return;
      if (char.isLocked) {
        window.Alpine?.store('app')?.toast('Esta ficha está protegida contra edición.', 'error');
        return;
      }
      if (!char.basics) char.basics = {};

      const val = Math.max(0, Math.min(50, Math.round(Number(radius) || 0)));
      if (char.basics.avatarRadius === val) return;

      char.basics.avatarRadius = val;
      if (val === 0) char.basics.avatarShape = 'square';
      else if (val === 50) char.basics.avatarShape = 'circle';
      else if (val === 25) char.basics.avatarShape = 'rounded';
      else if (val === 38) char.basics.avatarShape = 'squircle';
      else if (val === 12) char.basics.avatarShape = 'smooth';
      else char.basics.avatarShape = 'custom';

      if (this.active && this.active.id === char.id) {
        this.active.basics.avatarRadius = val;
        this.active.basics.avatarShape = char.basics.avatarShape;
      }

      this._persist(char);
      if (typeof this.scheduleAutoSave === 'function') this.scheduleAutoSave();
      if (notify) {
        window.Alpine?.store('app')?.toast(`Curvatura de avatar ajustada a ${val}%.`, 'info');
      }
    },

    setAvatarAspect(aspect, targetCharId = null) {
      const char = targetCharId ? this.list.find(c => c.id === targetCharId) : this.active;
      if (!char) return;
      if (char.isLocked) {
        window.Alpine?.store('app')?.toast('Esta ficha está protegida contra edición.', 'error');
        return;
      }
      if (!char.basics) char.basics = {};

      const newAspect = aspect === 'portrait' ? 'portrait' : 'square';
      if (char.basics.avatarAspect === newAspect) return;

      if (typeof this.pushUndoSnapshot === 'function') {
        this.pushUndoSnapshot(`Cambiar proporción de perfil a ${newAspect === 'portrait' ? '3:4 Retrato' : '1:1 Cuadrado'}`);
      }

      char.basics.avatarAspect = newAspect;
      if (this.active && this.active.id === char.id) {
        this.active.basics.avatarAspect = newAspect;
      }

      this._persist(char);
      if (typeof this.scheduleAutoSave === 'function') this.scheduleAutoSave();
      window.Alpine?.store('app')?.toast(
        newAspect === 'portrait' ? 'Proporción de perfil: Retrato vertical (3:4).' : 'Proporción de perfil: Cuadrado estándar (1:1).',
        'info'
      );
    },

    getAvatarAspect(char = null) {
      const c = char || this.active;
      return c?.basics?.avatarAspect || 'square';
    },

    getAvatarRadius(char = null) {
      const c = char || this.active;
      if (!c?.basics) return 25;
      if (c.basics.avatarRadius !== undefined && c.basics.avatarRadius !== null) {
        return Math.max(0, Math.min(50, Number(c.basics.avatarRadius)));
      }
      if (c.basics.avatarShape === 'square') return 0;
      if (c.basics.avatarShape === 'circle') return 50;
      if (c.basics.avatarShape === 'squircle') return 38;
      if (c.basics.avatarShape === 'smooth') return 12;
      return 25;
    },

    getAvatarRadiusCss(char = null) {
      const rad = this.getAvatarRadius(char);
      if (rad === 0) return '0px';
      if (rad === 50) return '50%';
      return `${rad}%`;
    },

    isAvatarSquare(char = null) {
      return this.getAvatarRadius(char) === 0;
    },

    isAvatarCircle(char = null) {
      return this.getAvatarRadius(char) === 50;
    },

    toggleAvatarShape(targetCharId = null) {
      const rad = this.getAvatarRadius(targetCharId ? this.list.find(c => c.id === targetCharId) : this.active);
      if (rad === 0) this.setAvatarShape('rounded', targetCharId);
      else if (rad <= 25) this.setAvatarShape('circle', targetCharId);
      else this.setAvatarShape('square', targetCharId);
    }
  };
}
