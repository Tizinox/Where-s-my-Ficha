/**
 * @file src/ui/controllers/uiControllers.ts
 * Controladores reactivos reutilizables de Alpine.js extraídos de las vistas.
 */

export interface AlpineRegistry {
  data: (name: string, callback: (...args: any[]) => Record<string, any>) => void;
  store: (name: string) => any;
}

export type SheetVisualVariant = 'unified' | 'classic';

/**
 * Registra todos los controladores UI compartidos en Alpine antes de Alpine.start().
 */
export function registerUiControllers(Alpine: AlpineRegistry): void {
  Alpine.data('sheetVisualMedia', (variant: SheetVisualVariant = 'unified') => ({
    visualTab: 'avatar' as 'avatar' | 'banner' | 'icon',
    urlInput: '',
    showUrlInput: false,
    isDragging: false,
    newSkillName: '',
    newWeaponName: '',
    newQuoteText: '',

    get activeData() {
      const charStore = Alpine.store('characters');
      const b = charStore.active?.basics || {};
      const isClassic = variant === 'classic';

      if (this.visualTab === 'banner') {
        return {
          type: 'banner',
          shortLabel: 'Báner',
          title: 'Báner Panorámico',
          dataUrl: b.bannerDataUrl,
          transform: b.bannerTransform,
          modeClass: 'banner-mode',
          aspectLabel: '16:5 Panorámico',
          recommended: isClassic ? '1920 × 600 px · Horizontal' : '1920 × 600 px · Panorámico 16:5',
          emptyLabel: 'Sin Báner',
          desc: 'Fondo cinematográfico para la tarjeta de presentación en la lista de personajes.',
        };
      }

      if (this.visualTab === 'icon') {
        return {
          type: 'icon',
          shortLabel: 'Ícono',
          title: 'Ícono de Perfil',
          dataUrl: b.iconDataUrl,
          transform: b.iconTransform,
          modeClass: 'icon-mode',
          aspectLabel: '1:1 Cuadrado',
          recommended: isClassic ? '512 × 512 px · Cuadrado' : '512 × 512 px · Cuadrado 1:1',
          emptyLabel: 'Sin Ícono',
          desc: 'Miniatura para badges de lista, chat y navegación.',
        };
      }

      return {
        type: 'avatar',
        shortLabel: 'Imagen',
        title: isClassic ? 'Avatar Principal' : 'Imagen del Personaje',
        dataUrl: b.avatarDataUrl,
        transform: b.avatarTransform,
        modeClass: 'avatar-mode',
        aspectLabel: '3:4 Retrato',
        recommended: isClassic ? '768 × 1024 px · Vertical 3:4' : '768 × 1024 px · Retrato 3:4',
        emptyLabel: 'Sin Ilustración',
        desc: 'Ilustración del personaje en formato vertical para ficha de perfil.',
      };
    },

    handleDrop(e: DragEvent) {
      this.isDragging = false;
      const appStore = Alpine.store('app');
      const charStore = Alpine.store('characters');
      const file = e.dataTransfer?.files?.[0];
      if (file && file.type.startsWith('image/')) {
        appStore.openCropper(file, this.visualTab, charStore.activeId);
      } else {
        appStore.toast(
          variant === 'classic'
            ? 'Por favor arrastra un archivo de imagen válido.'
            : 'Arrastra un archivo de imagen válido.',
          'warning',
        );
      }
    },

    submitUrl() {
      const trimmed = this.urlInput.trim();
      if (!trimmed) return;
      Alpine.store('characters').loadAssetFromUrl(trimmed, this.visualTab);
      this.urlInput = '';
      this.showUrlInput = false;
    },

    addQuickSkill() {
      const title = this.newSkillName.trim();
      if (!title) return;
      const charStore = Alpine.store('characters');
      if (!Array.isArray(charStore.active.skills)) charStore.active.skills = [];
      charStore.active.skills.push({
        id: 'sk_' + Date.now(),
        type: 'active',
        title,
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
        imageFit: 'contain',
        imageTransform: '',
      });
      this.newSkillName = '';
      charStore.scheduleAutoSave();
    },

    removeSkill(idx: number) {
      const charStore = Alpine.store('characters');
      charStore.active.skills.splice(idx, 1);
      charStore.scheduleAutoSave();
    },

    addQuickWeapon() {
      const name = this.newWeaponName.trim();
      if (!name) return;
      const charStore = Alpine.store('characters');
      if (!Array.isArray(charStore.active.weapons)) charStore.active.weapons = [];
      charStore.active.weapons.push({
        id: 'wp_' + Date.now(),
        name,
        weaponType: 'Principal',
        rarity: 'Común',
        rarityColor: '',
        tags: [],
        damage: '',
        range: '',
        cd: '',
        td: '',
        linkedSkillId: '',
        properties: '',
        lore: '',
        imageDataUrl: '',
        imageIsGif: false,
        imageFit: 'contain',
        imageTransform: '',
        imageOrientation: 'horizontal',
      });
      this.newWeaponName = '';
      charStore.scheduleAutoSave();
    },

    removeWeapon(idx: number) {
      const charStore = Alpine.store('characters');
      charStore.active.weapons.splice(idx, 1);
      charStore.scheduleAutoSave();
    },

    addQuickQuote() {
      const quote = this.newQuoteText.trim();
      if (!quote) return;
      Alpine.store('characters').addQuote(quote);
      this.newQuoteText = '';
    },
  }));
}

