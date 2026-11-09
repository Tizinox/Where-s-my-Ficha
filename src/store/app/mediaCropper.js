/**
 * store/app/mediaCropper.js
 * Submódulo de recorte de imágenes (Cropper.js), encuadre CSS de GIFs y caché LRU de Blob Object URLs.
 */

import Cropper from 'cropperjs';

export function createCropperMethods() {
  return {
    // ── Image Cropper State ─────────────────────────────────
    showCropper: false,
    cropperInstance: null,
    cropperTargetType: null, // 'avatar' | 'banner' | 'icon' | 'gallery' | 'weapon' | 'skill'
    cropperTargetCharId: null,
    cropperIsGif: false,
    cropperRawDataUrl: null,
    cropperAspectRatioMode: 'horizontal', // 'horizontal' | 'vertical' | 'tall' | 'square' | 'free'
    scaleX: 1,
    scaleY: 1,

    openCropper(file, targetType, targetCharId = null) {
      if (!file) return;

      const isGif = file.type === 'image/gif' || file.name.toLowerCase().endsWith('.gif');

      // Si el GIF supera 10MB, mostrar advertencia no bloqueante de consumo de rendimiento
      if (isGif && file.size > 10 * 1024 * 1024) {
        const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
        this.triggerGifWeightWarning(sizeMB, () => {
          this._loadCropperFile(file, targetType, targetCharId, isGif);
        });
        return;
      }

      this._loadCropperFile(file, targetType, targetCharId, isGif);
    },

    _loadCropperFile(file, targetType, targetCharId, isGif) {
      const reader = new FileReader();
      reader.onload = (e) => {
        this.showCropper = true;
        this.cropperTargetType = targetType;
        this.cropperTargetCharId = targetCharId;
        this.cropperIsGif = isGif;
        this.cropperRawDataUrl = e.target.result;
        this.scaleX = 1;
        this.scaleY = 1;

        // Inspeccionar dimensiones naturales de la imagen para sugerir orientación
        const imgProbe = new Image();
        imgProbe.onload = () => {
          let initialOrientation = 'horizontal';
          if (targetType === 'weapon') {
            const charStore = window.Alpine?.store('characters');
            const w = charStore?.active?.weapons?.find(item => item.id === targetCharId);
            if (w && w.imageOrientation) {
              initialOrientation = w.imageOrientation;
            } else if (imgProbe.naturalHeight > imgProbe.naturalWidth * 1.15) {
              initialOrientation = 'vertical';
            }
          }
          this.cropperAspectRatioMode = initialOrientation;

          setTimeout(async () => {
            const image = document.getElementById('cropper-image');
            if (image) {
              image.src = e.target.result;
              if (this.cropperInstance) {
                this.cropperInstance.destroy();
              }

              // Aspect ratio según tipo de destino
              let aspectRatio = NaN;
              if (targetType === 'avatar') {
                aspectRatio = 3 / 4; // 3:4 Vertical Retrato para Avatar
              } else if (targetType === 'icon' || targetType === 'tierlist_guest') {
                aspectRatio = 1; // 1:1 Cuadrado para Ícono y Token Tierlist
              } else if (targetType === 'banner') {
                aspectRatio = 16 / 5; // 16:5 Banner Panorámico Horizontal
              } else if (targetType === 'weapon') {
                if (this.cropperAspectRatioMode === 'vertical') {
                  aspectRatio = 3 / 4; // 3:4 Vertical Retrato para Arma
                } else if (this.cropperAspectRatioMode === 'tall') {
                  aspectRatio = 9 / 16; // 9:16 Alargado
                } else if (this.cropperAspectRatioMode === 'square') {
                  aspectRatio = 1; // 1:1 Cuadrado
                } else if (this.cropperAspectRatioMode === 'free') {
                  aspectRatio = NaN; // Libre
                } else {
                  aspectRatio = 16 / 9; // 16:9 Panorámico Horizontal
                  this.cropperAspectRatioMode = 'horizontal';
                }
              } else if (targetType === 'skill' || targetType === 'custom_field') {
                aspectRatio = 16 / 9; // 16:9 Panorámico para Habilidades y Secciones Modulares
              }

              try {
                const CropperClass = Cropper?.default || Cropper;
                this.cropperInstance = new CropperClass(image, {
                  viewMode: 1,
                  dragMode: 'move',
                  aspectRatio: aspectRatio,
                  autoCropArea: 0.9,
                  restore: false,
                  guides: true,
                  center: true,
                  highlight: false,
                  cropBoxMovable: true,
                  cropBoxResizable: true,
                  toggleDragModeOnDblclick: false,
                });
              } catch (err) {
                console.error('[mediaCropper] Error al inicializar Cropper:', err);
              }
            }
          }, 150);
        };
        imgProbe.src = e.target.result;
      };
      reader.readAsDataURL(file);
    },

    setCropperAspectRatio(mode) {
      this.cropperAspectRatioMode = mode;
      if (!this.cropperInstance) return;
      let ratio = NaN;
      if (mode === 'horizontal') ratio = 16 / 9;
      else if (mode === 'vertical') ratio = 3 / 4;
      else if (mode === 'tall') ratio = 9 / 16;
      else if (mode === 'square') ratio = 1;
      else if (mode === 'free') ratio = NaN;
      this.cropperInstance.setAspectRatio(ratio);
    },

    cancelCropper() {
      this.showCropper = false;
      this.cropperIsGif = false;
      this.cropperRawDataUrl = null;
      this.cropperAspectRatioMode = 'horizontal';
      if (this.cropperInstance) {
        this.cropperInstance.destroy();
        this.cropperInstance = null;
      }
    },

    cropperZoom(ratio) {
      if (this.cropperInstance) this.cropperInstance.zoom(ratio);
    },

    cropperRotate(degree) {
      if (this.cropperInstance) this.cropperInstance.rotate(degree);
    },

    cropperFlipX() {
      if (this.cropperInstance) {
        this.scaleX = this.scaleX === 1 ? -1 : 1;
        this.cropperInstance.scaleX(this.scaleX);
      }
    },

    cropperFlipY() {
      if (this.cropperInstance) {
        this.scaleY = this.scaleY === 1 ? -1 : 1;
        this.cropperInstance.scaleY(this.scaleY);
      }
    },

    async applyCropper() {
      if (!this.cropperInstance) return;
      
      const charsStore = window.Alpine?.store('characters');

      // Determinar orientación para el arma según modo activo o proporción resultante
      let chosenOrientation = this.cropperAspectRatioMode || 'horizontal';
      if (this.cropperTargetType === 'weapon') {
        if (this.cropperAspectRatioMode === 'free') {
          const data = this.cropperInstance.getData(true);
          if (data && data.width && data.height) {
            chosenOrientation = data.height > data.width * 1.15 ? 'vertical' : 'horizontal';
          } else {
            chosenOrientation = 'horizontal';
          }
        }
      }

      // FASE 3: Encuadre CSS de precisión sin procesamiento canvático para GIFs animados
      if (this.cropperIsGif && this.cropperRawDataUrl) {
        const imageData = this.cropperInstance.getImageData();
        const data = this.cropperInstance.getData(true); // Coordenadas enteras relativas a la imagen original

        const wPct = data.width > 0 ? (imageData.naturalWidth / data.width) * 100 : 100;
        const hPct = data.height > 0 ? (imageData.naturalHeight / data.height) * 100 : 100;
        const leftPct = data.width > 0 ? -(data.x / data.width) * 100 : 0;
        const topPct = data.height > 0 ? -(data.y / data.height) * 100 : 0;

        const rot = data.rotate || 0;
        const sx = data.scaleX || 1;
        const sy = data.scaleY || 1;

        const cssTransform = `position:absolute; width:${wPct.toFixed(2)}%; height:${hPct.toFixed(2)}%; left:${leftPct.toFixed(2)}%; top:${topPct.toFixed(2)}%; max-width:none!important; max-height:none!important; transform:rotate(${rot}deg) scaleX(${sx}) scaleY(${sy}); transform-origin:center center; pointer-events:none!important; user-select:none!important; -webkit-user-drag:none!important; user-drag:none!important;`;

        if (this.cropperTargetType === 'avatar') {
          await charsStore.processCroppedAvatarGif(this.cropperRawDataUrl, cssTransform);
        } else if (this.cropperTargetType === 'banner') {
          await charsStore.processCroppedBannerGif(this.cropperRawDataUrl, cssTransform, this.cropperTargetCharId);
        } else if (this.cropperTargetType === 'icon') {
          await charsStore.processCroppedIconGif(this.cropperRawDataUrl, cssTransform, this.cropperTargetCharId);
        } else if (this.cropperTargetType === 'weapon') {
          await charsStore.processCroppedWeaponGif(this.cropperRawDataUrl, cssTransform, this.cropperTargetCharId, chosenOrientation);
        } else if (this.cropperTargetType === 'skill') {
          await charsStore.processCroppedSkillGif(this.cropperRawDataUrl, cssTransform, this.cropperTargetCharId);
        } else if (this.cropperTargetType === 'custom_field') {
          await charsStore.processCroppedCustomFieldGif(this.cropperRawDataUrl, cssTransform, this.cropperTargetCharId);
        } else if (this.cropperTargetType === 'tierlist_guest') {
          const tierlistStore = window.Alpine?.store('tierlist');
          if (tierlistStore) {
            await tierlistStore.processCroppedGuestGif(this.cropperRawDataUrl, cssTransform);
          }
        }

        this.cancelCropper();
        return;
      }

      // Procesamiento canvático estándar para imágenes estáticas (PNG, JPG, WebP)
      const canvas = this.cropperInstance.getCroppedCanvas({
        imageSmoothingEnabled: true,
        imageSmoothingQuality: 'high',
      });

      if (!canvas) {
        this.toast('Error al recortar la imagen.', 'error');
        this.cancelCropper();
        return;
      }

      // Lo pasamos a blob y luego delegamos al store de characters
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], 'cropped.png', { type: 'image/png' });
        
        if (this.cropperTargetType === 'avatar') {
          await charsStore.processCroppedAvatar(file);
        } else if (this.cropperTargetType === 'banner') {
          await charsStore.processCroppedBanner(file, this.cropperTargetCharId);
        } else if (this.cropperTargetType === 'icon') {
          await charsStore.processCroppedIcon(file, this.cropperTargetCharId);
        } else if (this.cropperTargetType === 'gallery') {
          await charsStore.processCroppedGallery(file);
        } else if (this.cropperTargetType === 'weapon') {
          await charsStore.processCroppedWeapon(file, this.cropperTargetCharId, chosenOrientation);
        } else if (this.cropperTargetType === 'skill') {
          await charsStore.processCroppedSkill(file, this.cropperTargetCharId);
        } else if (this.cropperTargetType === 'custom_field') {
          await charsStore.processCroppedCustomField(file, this.cropperTargetCharId);
        } else if (this.cropperTargetType === 'tierlist_guest') {
          const tierlistStore = window.Alpine?.store('tierlist');
          if (tierlistStore) {
            await tierlistStore.processCroppedGuest(file);
          }
        }
        
        this.cancelCropper();
      }, 'image/png');
    },

    _storeBlobUrl(dataUrl, objectUrl) {
      if (!window._blobUrlCache) window._blobUrlCache = new Map();
      const MAX_BLOB_CACHE = 60;
      while (window._blobUrlCache.size >= MAX_BLOB_CACHE) {
        const oldestKey = window._blobUrlCache.keys().next().value;
        if (!oldestKey) break;
        const oldestUrl = window._blobUrlCache.get(oldestKey);
        if (oldestUrl && typeof oldestUrl === 'string' && oldestUrl.startsWith('blob:')) {
          try {
            URL.revokeObjectURL(oldestUrl);
          } catch (_) {}
        }
        window._blobUrlCache.delete(oldestKey);
      }
      window._blobUrlCache.set(dataUrl, objectUrl);
    },

    // ── Optimización de Imágenes: Soporte fluido para GIFs animados y Data-URIs ────────
    getOptimizedImageUrl(dataUrl) {
      if (!dataUrl || typeof dataUrl !== 'string') return dataUrl || '';
      // Los GIFs animados deben mantenerse intactos como Data-URI o URL directa para evitar reseteos de fotogramas
      if (dataUrl.startsWith('data:image/gif')) return dataUrl;
      if (!dataUrl.startsWith('data:')) return dataUrl;
      
      // Si la cadena Base64 es menor a 200KB (~260k caracteres), no requiere overhead de Blob
      if (dataUrl.length < 260000) return dataUrl;
      
      if (!window._blobUrlCache) window._blobUrlCache = new Map();

      // Si ya está en caché, retornamos la Object URL
      if (window._blobUrlCache.has(dataUrl)) {
        return window._blobUrlCache.get(dataUrl);
      }

      // Retornar dataUrl de inmediato para renderizado nativo sin mutaciones invasivas en el DOM
      return dataUrl;
    },

    /**
     * Decodifica un Data URL a Blob URL de manera asíncrona nativa
     */
    async getOptimizedBlobUrl(dataUrl) {
      if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:')) return dataUrl || '';
      if (dataUrl.length < 260000) return dataUrl;
      if (window._blobUrlCache?.has(dataUrl)) return window._blobUrlCache.get(dataUrl);
      try {
        const res = await fetch(dataUrl);
        const blob = await res.blob();
        const objectUrl = URL.createObjectURL(blob);
        this._storeBlobUrl(dataUrl, objectUrl);
        return objectUrl;
      } catch (e) {
        return dataUrl;
      }
    },

    /**
     * Revoca una URL específica del caché si existe
     * @param {string} dataUrl 
     */
    revokeOptimizedImageUrl(dataUrl) {
      if (!window._blobUrlCache || !window._blobUrlCache.has(dataUrl)) return;
      const objectUrl = window._blobUrlCache.get(dataUrl);
      if (objectUrl && typeof objectUrl === 'string' && objectUrl.startsWith('blob:')) {
        try {
          URL.revokeObjectURL(objectUrl);
        } catch (_) {}
      }
      window._blobUrlCache.delete(dataUrl);
    },

    /**
     * Revoca y limpia todas las Object URLs del caché para liberar memoria
     */
    clearBlobUrlCache() {
      if (!window._blobUrlCache) return;
      for (const blobUrl of window._blobUrlCache.values()) {
        if (blobUrl && typeof blobUrl === 'string' && blobUrl.startsWith('blob:')) {
          try {
            URL.revokeObjectURL(blobUrl);
          } catch (_) {}
        }
      }
      window._blobUrlCache.clear();
    }
  };
}
