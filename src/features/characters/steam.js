/**
 * store/characters/steam.js
 * Cosméticos y Vitrina Steam: Marcos animados, avatares, insignias coleccionables y formas de avatar.
 */

export function createSteamMethods() {
  return {
    setAvatarFrame(frame, targetCharId = null) {
      const char = targetCharId ? this.list.find(c => c.id === targetCharId) : this.active;
      if (!char) return;
      if (char.isLocked) {
        window.Alpine?.store('app')?.toast('Esta ficha está protegida contra edición.', 'error');
        return;
      }
      if (!char.basics) char.basics = {};
      if (typeof this.pushUndoSnapshot === 'function') {
        this.pushUndoSnapshot(frame ? 'Equipar marco de avatar' : 'Quitar marco de avatar');
      }
      let frameName = frame?.name || 'Marco Steam';
      let frameGame = frame?.game || 'Steam Points Shop';
      if (frameName.toLowerCase() === 'frame of reference') {
        frameName = 'Marco de Referencia';
      }
      if (frameGame.toLowerCase() === 'if_animated_frame' || frameName === 'Marco de Referencia') {
        frameGame = 'Idea Fix';
      }
      char.basics.avatarFrame = frame ? {
        id: frame.id || '',
        name: frameName,
        url: frame.url || '',
        previewUrl: frame.previewUrl || frame.url || '',
        game: frameGame,
        animated: frame.animated !== false
      } : null;
      if (this.active && this.active.id === char.id) {
        this.active.basics.avatarFrame = char.basics.avatarFrame;
      }
      this._persist(char);
      if (typeof this.scheduleAutoSave === 'function') this.scheduleAutoSave();
      if (frame) {
        window.Alpine?.store('app')?.toast(`Marco «${frameName}» equipado.`, 'success');
      } else {
        window.Alpine?.store('app')?.toast('Marco de avatar retirado.', 'info');
      }
    },

    removeAvatarFrame(targetCharId = null) {
      this.setAvatarFrame(null, targetCharId);
    },

    getAvatarFrameDisplayName(targetChar = null) {
      const char = targetChar || this.active;
      const frame = char?.basics?.avatarFrame;
      if (!frame) return 'Sin marco';
      let name = frame.name || 'Marco Steam';
      if (name.toLowerCase() === 'frame of reference') return 'Marco de Referencia';
      return name;
    },

    getAvatarFrameGameName(targetChar = null) {
      const char = targetChar || this.active;
      const frame = char?.basics?.avatarFrame;
      if (!frame) return '';
      let game = (frame.game || '').trim();
      let name = (frame.name || '').toLowerCase();
      if (game.toLowerCase() === 'if_animated_frame' || name === 'frame of reference' || name === 'marco de referencia') {
        return 'Idea Fix';
      }
      if (!game || /^(if_|anim_|animated_frame|tdr_)/i.test(game) || game.includes('Animated_Frame')) {
        if (/^tdr_/i.test(game)) return "Tom Clancy's The Division Resurgence";
        return 'Steam Points Shop';
      }
      return game;
    },

    setSteamIcon(avatar, targetCharId = null) {
      const char = targetCharId ? this.list.find(c => c.id === targetCharId) : this.active;
      if (!char) return;
      if (char.isLocked) {
        window.Alpine?.store('app')?.toast('Esta ficha está protegida contra edición.', 'error');
        return;
      }
      if (!char.basics) char.basics = {};
      if (typeof this.pushUndoSnapshot === 'function') {
        this.pushUndoSnapshot(avatar ? 'Equipar avatar de Steam como ícono' : 'Quitar ícono de Steam');
      }
      if (avatar) {
        const avatarUrl = typeof avatar === 'string' ? avatar : (avatar?.url || avatar?.previewUrl || '');
        char.basics.iconDataUrl = avatarUrl;
        char.basics.iconTransform = '';
        char.basics.steamIcon = {
          id: avatar.id || '',
          name: avatar.name || 'Avatar Steam',
          url: avatarUrl,
          previewUrl: avatar.previewUrl || avatarUrl,
          game: avatar.game || 'Steam Points Shop',
          category: avatar.category || 'other',
          animated: true
        };
        if (this.active && this.active.id === char.id) {
          this.active.basics.iconDataUrl = avatarUrl;
          this.active.basics.iconTransform = '';
          this.active.basics.steamIcon = char.basics.steamIcon;
        }
        this._persist(char);
        if (typeof this.scheduleAutoSave === 'function') this.scheduleAutoSave();
        const name = avatar?.name || 'Avatar de Steam';
        window.Alpine?.store('app')?.toast(`Avatar «${name}» equipado como Ícono.`, 'success');
      } else {
        this.removeSteamIcon(targetCharId);
      }
    },

    removeSteamIcon(targetCharId = null) {
      const char = targetCharId ? this.list.find(c => c.id === targetCharId) : this.active;
      if (!char) return;
      if (char.isLocked) {
        window.Alpine?.store('app')?.toast('Esta ficha está protegida contra edición.', 'error');
        return;
      }
      if (!char.basics) char.basics = {};
      if (typeof this.pushUndoSnapshot === 'function') {
        this.pushUndoSnapshot('Quitar ícono de avatar');
      }
      char.basics.iconDataUrl = '';
      char.basics.iconTransform = '';
      char.basics.steamIcon = null;
      if (this.active && this.active.id === char.id) {
        this.active.basics.iconDataUrl = '';
        this.active.basics.iconTransform = '';
        this.active.basics.steamIcon = null;
      }
      this._persist(char);
      if (typeof this.scheduleAutoSave === 'function') this.scheduleAutoSave();
      window.Alpine?.store('app')?.toast('Ícono de Steam retirado.', 'info');
    },

    getCharSteamBadges(char = null) {
      const c = char || this.active;
      if (!c?.basics?.steamBadges || !Array.isArray(c.basics.steamBadges)) return [];
      return c.basics.steamBadges.filter(Boolean).slice(0, 3);
    },

    setSteamBadge(badge, slotIndex = -1, targetCharId = null) {
      const char = targetCharId ? this.list.find(c => c.id === targetCharId) : this.active;
      if (!char) return;
      if (char.isLocked) {
        window.Alpine?.store('app')?.toast('Esta ficha está protegida contra edición.', 'error');
        return;
      }
      if (!char.basics) char.basics = {};
      if (!Array.isArray(char.basics.steamBadges)) char.basics.steamBadges = [];

      if (typeof this.pushUndoSnapshot === 'function') {
        this.pushUndoSnapshot('Equipar insignia de Steam');
      }

      const badgeObj = badge ? {
        id: String(badge.id || `badge_${Date.now()}`),
        appid: Number(badge.appid || 0),
        game: String(badge.game || 'Steam'),
        name: String(badge.name || 'Insignia Steam'),
        level: String(badge.level || 'Level 1'),
        isFoil: Boolean(badge.isFoil),
        url: String(badge.url || '')
      } : null;

      if (!badgeObj) return;

      if (slotIndex >= 0 && slotIndex < 3) {
        char.basics.steamBadges[slotIndex] = badgeObj;
      } else {
        let targetSlot = -1;
        for (let i = 0; i < 3; i++) {
          if (!char.basics.steamBadges[i]) {
            targetSlot = i;
            break;
          }
        }
        if (targetSlot === -1) targetSlot = 0;
        char.basics.steamBadges[targetSlot] = badgeObj;
      }

      char.basics.steamBadges = char.basics.steamBadges.slice(0, 3);

      if (this.active && this.active.id === char.id) {
        this.active.basics.steamBadges = [...char.basics.steamBadges];
      }

      this._persist(char);
      if (typeof this.scheduleAutoSave === 'function') this.scheduleAutoSave();
      const badgeTitle = badge?.name || 'Insignia';
      window.Alpine?.store('app')?.toast(`Insignia «${badgeTitle}» ${badge?.isFoil ? '(Foil) ' : ''}equipada en la vitrina.`, 'success');
    },

    removeSteamBadge(slotIndex, targetCharId = null) {
      const char = targetCharId ? this.list.find(c => c.id === targetCharId) : this.active;
      if (!char) return;
      if (char.isLocked) {
        window.Alpine?.store('app')?.toast('Esta ficha está protegida contra edición.', 'error');
        return;
      }
      if (!char.basics || !Array.isArray(char.basics.steamBadges)) return;

      if (typeof this.pushUndoSnapshot === 'function') {
        this.pushUndoSnapshot('Quitar insignia de Steam');
      }
      if (slotIndex >= 0 && slotIndex < char.basics.steamBadges.length) {
        char.basics.steamBadges.splice(slotIndex, 1);
      }

      if (this.active && this.active.id === char.id) {
        this.active.basics.steamBadges = [...char.basics.steamBadges];
      }

      this._persist(char);
      if (typeof this.scheduleAutoSave === 'function') this.scheduleAutoSave();
      window.Alpine?.store('app')?.toast('Insignia retirada de la vitrina.', 'info');
    },

    reorderSteamBadges(fromIndex, toIndex, targetCharId = null) {
      const char = targetCharId ? this.list.find(c => c.id === targetCharId) : this.active;
      if (!char || !char.basics || !Array.isArray(char.basics.steamBadges)) return;
      if (fromIndex < 0 || fromIndex >= char.basics.steamBadges.length) return;
      if (toIndex < 0 || toIndex >= 3) return;

      const item = char.basics.steamBadges.splice(fromIndex, 1)[0];
      char.basics.steamBadges.splice(toIndex, 0, item);
      char.basics.steamBadges = char.basics.steamBadges.slice(0, 3);

      if (this.active && this.active.id === char.id) {
        this.active.basics.steamBadges = [...char.basics.steamBadges];
      }

      this._persist(char);
      if (typeof this.scheduleAutoSave === 'function') this.scheduleAutoSave();
    },

    getActiveAvatarUrl(char = null) {
      const c = char || this.active;
      if (!c?.basics) return '';
      if (c.basics.useIconForPfp) {
        return c.basics.iconDataUrl || c.basics.avatarDataUrl || '';
      }
      return c.basics.avatarDataUrl || c.basics.iconDataUrl || '';
    },

    getActiveAvatarTransform(char = null) {
      const c = char || this.active;
      if (!c?.basics) return '';
      if (c.basics.useIconForPfp) {
        return c.basics.iconTransform || c.basics.avatarTransform || '';
      }
      return c.basics.avatarTransform || c.basics.iconTransform || '';
    }
  };
}
